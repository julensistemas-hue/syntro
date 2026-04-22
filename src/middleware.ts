import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

// Public routes within /aula that don't require authentication
const PUBLIC_AULA_ROUTES = [
  '/aula/login',
  '/aula/registro',
  '/aula/logout',
  '/aula/recuperar',
  '/aula/nueva-contrasena',
  '/aula/pago-completado',
];

// ─── Agent Discovery: Link headers (RFC 8288) ────────────────────────────────
const LINK_HEADER = [
  '<https://aisecurity.es/sitemap-index.xml>; rel="sitemap"',
  '<https://aisecurity.es/llms.txt>; rel="describedby"; type="text/markdown"',
].join(', ');

// ─── Markdown for Agents: contenido de la web en markdown ────────────────────
const SITE_MARKDOWN = `# AI Security — aisecurity.es

Plataforma profesional española de Inteligencia Artificial y Ciberseguridad para PyMEs (10-200 empleados).

Filosofía: transparencia total, demos interactivas reales y resultados medibles. Sin promesas vacías.

## Servicios de Inteligencia Artificial

- **Chatbot Inteligente** (/servicios/chatbot): Atención al cliente 24/7 con integración a ERP/CRM. Consulta facturas, pedidos y productos en tiempo real.
- **Gestor Documental IA** (/servicios/gestor-documental): Búsqueda semántica en documentación corporativa. Encuentra información en segundos vs 10-15 minutos navegando carpetas.
- **Gestor de Citas IA** (/servicios/gestor-citas): Automatización de reservas, confirmaciones y recordatorios. Integración con Google Calendar y Outlook.
- **Atención de Llamadas IA** (/servicios/atencion-llamadas): Recepcionista virtual con voz natural en español. Deriva casos complejos a agentes humanos.
- **Automatización de Procesos** (/servicios/automatizacion): RPA con IA para emails, informes y facturas. Dashboard de ahorro medible.

## Servicios de Ciberseguridad y Sistemas

- **Wazuh / ENS** (/wazuh): SIEM open-source para cumplimiento del Esquema Nacional de Seguridad. Implementación, configuración, formación y soporte.
- **Curso Wazuh** (/curso-wazuh): Curso intensivo de Wazuh.
- **Soporte técnico** (/soporte-tecnico): Administración Linux/Windows Server, copias de seguridad, microinformática, consultoría cloud y on-premise.

## Público objetivo

PyMEs españolas de 10 a 200 empleados que buscan reducir costes operativos, cumplir con el ENS y modernizar su infraestructura IT.

## Contacto

- Consulta gratuita: https://aisecurity.es/reunion
- Blog técnico: https://aisecurity.es/blog
- Más información: https://aisecurity.es/llms.txt
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Check if a path requires authentication
function isProtectedRoute(pathname: string): boolean {
  // Check if it's an aula route
  if (!pathname.startsWith('/aula')) {
    return false;
  }

  // Check if it's a public aula route
  for (const publicRoute of PUBLIC_AULA_ROUTES) {
    if (pathname === publicRoute || pathname.startsWith(publicRoute + '/')) {
      return false;
    }
  }

  // All other /aula routes are protected
  return true;
}

// Returns true for HTML page routes (excludes API, assets, aula)
function isHtmlRoute(pathname: string): boolean {
  return (
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_') &&
    !/\.(js|css|png|jpg|jpeg|webp|svg|ico|xml|txt|json|woff|woff2|map)$/.test(pathname)
  );
}

// Añade Link headers a la respuesta (con fallback si headers son inmutables)
function withLinkHeaders(response: Response): Response {
  try {
    response.headers.set('Link', LINK_HEADER);
    response.headers.append('Vary', 'Accept');
    return response;
  } catch {
    const headers = new Headers(response.headers);
    headers.set('Link', LINK_HEADER);
    headers.append('Vary', 'Accept');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const accept = context.request.headers.get('accept') ?? '';

  // ── Markdown for Agents: devuelve markdown cuando el agente lo solicita ──
  if (accept.includes('text/markdown') && isHtmlRoute(pathname)) {
    return new Response(SITE_MARKDOWN, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept',
      },
    });
  }

  // Skip non-protected routes
  if (!isProtectedRoute(pathname)) {
    const response = await next();
    // ── Link headers: añade cabeceras de descubrimiento para agentes ──
    if (isHtmlRoute(pathname) && response.headers.get('content-type')?.includes('text/html')) {
      return withLinkHeaders(response);
    }
    return response;
  }

  // Get Supabase credentials
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured, redirect to login
    return context.redirect('/aula/login?error=config');
  }

  // Get access token from cookie
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (!accessToken) {
    // No token, redirect to login
    const returnUrl = encodeURIComponent(pathname);
    return context.redirect(`/aula/login?returnUrl=${returnUrl}`);
  }

  // Verify token with Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Try to refresh the token
    if (refreshToken) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData.session) {
        // Set new tokens
        context.cookies.set('sb-access-token', refreshData.session.access_token, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        context.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Store user in locals for the page to access
        context.locals.user = refreshData.user;
        context.locals.session = refreshData.session;
        return next();
      }
    }

    // Token invalid and refresh failed, redirect to login
    context.cookies.delete('sb-access-token', { path: '/' });
    context.cookies.delete('sb-refresh-token', { path: '/' });
    const returnUrl = encodeURIComponent(pathname);
    return context.redirect(`/aula/login?returnUrl=${returnUrl}`);
  }

  // User authenticated, check if payment verified
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    const serverClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: courseUser } = await serverClient
      .from('course_users')
      .select('payment_verified')
      .eq('id', user.id)
      .single();

    if (!courseUser?.payment_verified) {
      // User exists but payment not verified
      context.locals.paymentPending = true;
    }
  }

  // Store user in locals for the page to access
  context.locals.user = user;
  return next();
});
