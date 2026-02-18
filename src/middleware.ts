import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

// Public routes within /aula that don't require authentication
const PUBLIC_AULA_ROUTES = [
  '/aula/login',
  '/aula/registro',
  '/aula/logout',
  '/aula/recuperar',
  '/aula/pago-completado',
];

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

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Skip non-protected routes
  if (!isProtectedRoute(pathname)) {
    return next();
  }

  // Get Supabase credentials
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

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
