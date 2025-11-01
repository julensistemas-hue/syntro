# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Contexto del Proyecto: AI SECURITY

### Visión General
**AI SECURITY** (aisecurity.es) es una plataforma profesional que ofrece servicios en dos áreas principales:

1. **Soluciones de Inteligencia Artificial**: Automatización y optimización para PyMEs
2. **Servicios de Ciberseguridad y Sistemas**: Administración, seguridad (especialmente Wazuh/ENS) y consultoría técnica

### Filosofía del Proyecto - MUY IMPORTANTE
**Esta NO es una web de ventas de humo.** Los principios fundamentales son:

- ✅ **Transparencia total**: No prometemos ahorros irreales ni soluciones mágicas de IA
- ✅ **Casos de uso reales**: Cada servicio tiene demos interactivas y ejemplos tangibles con contexto empresarial
- ✅ **Educación al cliente**: Los clientes deben entender la tecnología para aprovecharla
- ✅ **Implementación práctica**: Análisis previo, desarrollo personalizado, formación del equipo y seguimiento activo
- ✅ **Resultados medibles**: Mejoras específicas (ej: "reduce 15h/mes"), no generalizaciones vacías

**Tono correcto**:
- ❌ Evitar: "Ahorra millones", "Revoluciona tu empresa", "Transforma tu negocio de la noche a la mañana"
- ✅ Usar: "Reduce 15 horas/mes en gestión documental", "Automatiza respuestas a 80% de consultas comunes"

### Público Objetivo
Pequeñas y medianas empresas (10-200 empleados) en España que buscan:
- Reducir costes operativos mediante automatización inteligente y específica
- Mejorar eficiencia de atención al cliente sin perder calidad humana
- Implementar medidas de ciberseguridad (especialmente **ENS - Esquema Nacional de Seguridad**)
- Modernizar infraestructura IT y procesos internos

### Servicios Principales

#### 🤖 Área de Inteligencia Artificial
Cada servicio incluye: análisis previo → desarrollo personalizado → formación del equipo → seguimiento

1. **Chatbot Inteligente**:
   - Atención al cliente 24/7 con integración a bases de datos y sistemas ERP/CRM
   - Consulta facturas, pedidos, productos en tiempo real

2. **Gestor Documental IA**:
   - Búsqueda semántica en documentación corporativa (políticas, manuales, procedimientos)
   - Encuentra información en segundos vs 10-15 minutos navegando carpetas

3. **Gestor de Citas IA**:
   - Automatización de reservas, confirmaciones y recordatorios
   - Integración con Google Calendar, Outlook

4. **Atención de Llamadas IA**:
   - Recepcionista virtual con voz natural en español
   - Deriva casos complejos a agentes humanos

5. **Automatización de Procesos**:
   - RPA con IA para tareas repetitivas (emails, informes, facturas)
   - Dashboard de ahorro medible

#### 🛡️ Área de Ciberseguridad y Sistemas

1. **Wazuh - PRIORIDAD ALTA Y ESTRATEGIA DE CAPTACIÓN**:
   - **Qué es**: SIEM open-source para detección de amenazas y cumplimiento normativo
   - **Por qué es prioritario**:
     - Requisito obligatorio para empresas que implementan **ENS (Esquema Nacional de Seguridad)**
     - Muchas PyMEs españolas necesitarán implementarlo en 2025-2026
     - Oportunidad de mercado: bajo conocimiento técnico en el sector target
   - **Servicios ofrecidos**:
     - Implementación completa de Wazuh
     - Configuración para cumplimiento ENS
     - Monitoreo de seguridad en tiempo real
     - Formación del equipo interno
     - Soporte y mantenimiento continuo

   **Estrategia de Contenido YouTube → Web**:
   - Canal existente: ~500 suscriptores (contenido técnico de sistemas)
   - Plan: 1 video Wazuh cada 2 semanas
   - Formato: Tutoriales prácticos, configuraciones específicas, casos de uso ENS
   - Target: Administradores de sistemas, empresas obligadas a cumplir ENS
   - Embudo: Video YouTube (valor real) → CTA a /wazuh → Demo interactiva → Solicitud reunión
   - Objetivo: Posicionarse como referente Wazuh/ENS para PyMEs españolas

2. **Otros servicios de sistemas**:
   - Administración de sistemas (Linux/Windows Server)
   - Copias de seguridad automatizadas (Veeam, Restic, Duplicati)
   - Microinformática y soporte técnico
   - Desarrollo web y microservicios
   - Consultoría de infraestructura cloud y on-premise

### Diferenciador Clave vs Competencia
- **Demos interactivas reales** (no capturas de pantalla estáticas ni videos pregrabados)
- **Contexto empresarial específico** en cada ejemplo (empresa de suministros, clínica dental, tienda online)
- **Transparencia en limitaciones**: La IA requiere trabajo, configuración y formación
- **Combinación única**: IA moderna (productividad) + Seguridad tradicional (Wazuh/ENS/cumplimiento)
- **Propietario es administrador de sistemas**: Conocimiento técnico real, no solo ventas

### Estructura de Conversión

**Embudo principal (servicios IA)**:
1. Usuario busca "automatizar atención cliente" o similar
2. Llega a aisecurity.es → Ve demos interactivas reales
3. Entiende el valor y limitaciones → Solicita reunión
4. Análisis personalizado → Propuesta específica → Implementación

**Embudo Wazuh (estrategia de contenido)**:
1. Usuario busca "configurar Wazuh" o "requisitos ENS" → Encuentra video YouTube
2. Video ofrece valor técnico real + menciona web para implementación profesional
3. Usuario visita /wazuh → Ve demo, casos de uso ENS, pricing transparente
4. Solicita reunión para implementación + formación + soporte

### URLs y Estructura del Sitio
- **Producción actual**: https://syntro-1etefg5gq-julensistemas-projects.vercel.app/
- **Dominio futuro**: aisecurity.es

**Páginas principales**:
- `/` - Homepage con servicios IA y link a Wazuh/Seguridad
- `/servicios/chatbot` - Demo interactiva chatbot
- `/servicios/gestor-documental` - Demo búsqueda documentos
- `/servicios/gestor-citas` - Demo calendario/reservas
- `/servicios/atencion-llamadas` - Demo llamadas IA
- `/servicios/automatizacion` - Dashboard ahorros
- `/wazuh` - **Página dedicada Wazuh** (alta prioridad para contenido YouTube)
- `/reunion` - Formulario solicitud consulta gratuita
- `/faq`, `/terms`, `/privacy` - Páginas legales/info

## Development Commands

This is an Astro project with pnpm as the package manager:

- `pnpm dev` or `pnpm start` - Start development server at localhost:4321
- `pnpm build` - Build production site to ./dist/
- `pnpm preview` - Preview production build locally
- `astro add` - Add integrations
- `astro check` - Run type checking

## Visual Verification

**IMPORTANT**: When discussing visual concepts, layouts, or UI elements on the website:
- **Always use Playwright tools** (`mcp__playwright__browser_*`) to verify how elements actually look
- Take screenshots to confirm visual changes before making modifications
- Use `browser_navigate` to view pages and `browser_snapshot` for accessibility tree
- Never assume how something looks without visual verification

## Frontend Design & UI/UX

**IMPORTANT**: For any frontend design, UI/UX, styling, colors, or visual aesthetics work:
- **Always use the `frontend-developer` agent** via the Task tool for:
  - Color scheme selection and palette decisions
  - Text readability and contrast improvements
  - Layout spacing and visual hierarchy
  - Component styling and design consistency
  - Accessibility compliance (WCAG standards)
  - Responsive design improvements
  - Visual polish and professional aesthetics
- The frontend-developer agent has expertise in:
  - Modern UI/UX best practices
  - Accessibility standards
  - Performance optimization
  - Design systems and component libraries
- **Color System**: Use the custom Tailwind v4 color system:
  - `accent-*` (25-950): Primary brand blue colors
  - `base-*` (25-950): Gray scale for text and backgrounds
  - Colors defined in `src/styles/global.css`
- **Never use harsh white backgrounds** - prefer `base-50`, `base-100`, or subtle gradients for better readability

## Project Architecture

This is an Astro-based SaaS/Startup template using Tailwind CSS v4:

### Key Technologies
- **Astro 5.12.6** - SSR mode with Vercel adapter for API routes
- **Tailwind CSS v4** (Alpha) - Using new CSS-only approach without config file
- **pnpm** - Package manager (required, see .npmrc shamefully-hoist setting)
- **TypeScript** - Type checking enabled via tsconfig.json
- **Resend** - Email service for form submissions (resend.com)

### Directory Structure
```
src/
├── assets/images/     - Static image assets (logos, dashboard images)
├── components/        - Reusable Astro components
│   ├── Forms/        - Login/Signup form components
│   ├── global/       - Site-wide components (Navigation, Footer, Testimonial)
│   ├── infopages/    - Static page components (FAQ, Privacy, Terms)
│   ├── landing/      - Homepage sections (Hero, Pricing, Features)
│   └── meeting/      - Meeting request form component (MeetingRequest.astro)
├── layouts/          - Page layout templates
│   └── utilities/    - Layout helper components (OptimizedImage)
├── pages/            - File-based routing (index, login, signup, etc.)
│   └── api/          - API routes (send-meeting-request.ts)
└── styles/global.css - Main stylesheet with Tailwind v4 configuration
```

### Styling System (Tailwind CSS v4)
- No `tailwind.config.js` - configuration is in `src/styles/global.css`
- Uses `@import "tailwindcss"` and `@plugin` directives
- Custom theme variables defined in `@theme` block
- Primary accent color system (accent-25 to accent-950)
- Base color system (base-25 to base-950)
- Inter font family with variable font support

### Important Notes
- **Output Mode**: `server` (SSR) with `@astrojs/vercel` adapter for API routes
- Uses experimental Astro font providers for Google Fonts
- Sitemap integration enabled
- Site URL configured as "https://yoursite.com" (update for production)
- GPL-3.0 licensed template originally by Michael Andreuzza, modified by Bektur Aslan

## Deployment

This project is deployed on Vercel with automatic deployments from GitHub:

1. **Git Workflow**:
   - Changes must be committed to GitHub repository
   - Vercel automatically deploys on push to main branch
   - Use `git add .`, `git commit -m "message"`, `git push` to deploy

2. **Production URL**: https://syntro-r4j7d2htk-julensistemas-projects.vercel.app/

3. **Deployment Process**:
   - Commit changes to git
   - Push to GitHub repository
   - Vercel automatically builds and deploys
   - Changes are live within minutes

4. **Environment Variables** (Required for Vercel):
   - `RESEND_API_KEY` - API key from Resend for email sending
   - Configure in Vercel: Settings → Environment Variables
   - Must redeploy after adding environment variables

## Email System (Meeting Request Form)

This project includes a meeting request form that sends emails using Resend:

### Configuration Files
- **Form Component**: `src/components/meeting/MeetingRequest.astro`
- **API Route**: `src/pages/api/send-meeting-request.ts`
- **Page**: `/reunion` - Meeting request page
- **Documentation**: `SETUP_EMAIL.md` - Complete setup instructions

### Environment Setup
1. Create a `.env` file in the root (already exists):
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
2. Get API key from [https://resend.com](https://resend.com) (free 100 emails/month)
3. For production: Add `RESEND_API_KEY` to Vercel environment variables

### Form Features
- **Required Fields**: Name + (Email OR Phone)
- **Optional Fields**: Company, service interest, company size, message, budget
- **Validations**: Client-side validation, at least one contact method required
- **Email Delivery**: Sends to `julen.sistemas@gmail.com`
- **Email Format**: Professional HTML template with company branding
- **User Feedback**: Success/error messages, loading states

### Email Template
- Styled HTML email with gradient header
- All form fields included in structured format
- Reply-to set to user's email if provided
- Timestamp in Europe/Madrid timezone
- Fallback plain text version

### Testing
- Local: Start dev server (`pnpm dev`) and visit http://localhost:4322/reunion
- Production: Ensure `RESEND_API_KEY` is set in Vercel environment variables

### Changing Recipients
To change where emails are sent, edit `src/pages/api/send-meeting-request.ts`:
```typescript
to: ['julen.sistemas@gmail.com'], // Change this line
```

### Custom Domain (Optional)
By default uses `onboarding@resend.dev` as sender. To use custom domain:
1. Add domain in Resend dashboard
2. Configure DNS records (SPF, DKIM, DMARC)
3. Update `from:` field in API route to `'AI Security <noreply@yourdomain.com>'`