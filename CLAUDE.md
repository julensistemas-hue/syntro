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
- `/curso-wazuh` - **Landing page curso intensivo Wazuh** (20 Enero 2025, €100)
- `/reunion` - Formulario solicitud consulta gratuita
- `/blog` - Blog técnico con artículos sobre IA, Wazuh y sistemas
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
- **Resend** - Email service for meeting request form (resend.com)
- **Nodemailer** - SMTP email library for course inscriptions via EmailRelay

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
├── pages/            - File-based routing (index, curso-wazuh, blog, etc.)
│   └── api/          - API routes
│       ├── send-meeting-request.ts       - Meeting form (Resend)
│       └── inscripcion-curso-wazuh.ts    - Course enrollment (EmailRelay SMTP)
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

## Email System

This project has **two email systems** configured:

### 1. Meeting Request Form (Resend - Legacy)
Used for: `/reunion` - Meeting request and consultation scheduling

**Configuration Files:**
- **Form Component**: `src/components/meeting/MeetingRequest.astro`
- **API Route**: `src/pages/api/send-meeting-request.ts`
- **Page**: `/reunion` - Meeting request page
- **Documentation**: `SETUP_EMAIL.md` - Complete setup instructions

**Environment Variables:**
```env
RESEND_API_KEY=re_your_api_key_here
```

**Features:**
- Required Fields: Name + (Email OR Phone)
- Optional Fields: Company, service interest, company size, message, budget
- Email Delivery: Sends to `julen.sistemas@gmail.com`
- Google Calendar integration for meeting scheduling
- Professional HTML template with company branding

### 2. Wazuh Course Inscription (EmailRelay SMTP - Production)
Used for: `/curso-wazuh` - Wazuh intensive course enrollment

**Configuration Files:**
- **Form Component**: Inline form in `src/pages/curso-wazuh.astro`
- **API Route**: `src/pages/api/inscripcion-curso-wazuh.ts`
- **Email Service**: EmailRelay SMTP (info@aisecurity.es)

**Environment Variables (Required in Vercel):**
```env
SMTP_HOST=smtp1.s.ipzmarketing.com
SMTP_PORT=587
SMTP_USER=rbaknxqyoxkj
SMTP_PASSWORD=cpexfT8y5EjXw2ez
SMTP_FROM_EMAIL=info@aisecurity.es
SMTP_FROM_NAME=AI Security
```

**Features:**
- Single required field: Email
- Dual email system:
  - **User confirmation email**: Payment instructions (Bank transfer + Bizum)
  - **Admin notification**: New inscription alert to info@aisecurity.es
- Payment details included in email:
  - Bank transfer: IBAN ES52 0081 1389 1200 0114 0773 (Julian Vergara Díaz)
  - Bizum: 722 67 48 74
- Uses `nodemailer` library for SMTP transport
- Professional HTML + plain text email templates

**Implementation:**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT),
  secure: false,
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASSWORD,
  },
});
```

### Vercel Environment Variables Setup

**CRITICAL**: Both email systems require environment variables configured in Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add the following variables:
   - `RESEND_API_KEY` (for meeting requests)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (for course inscriptions)
   - `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
3. Redeploy after adding variables

### Testing
- **Meeting form**: `pnpm dev` → http://localhost:4321/reunion
- **Course inscription**: `pnpm dev` → http://localhost:4321/curso-wazuh
- Production: Ensure all environment variables are set in Vercel

## UI/UX Design Rules - CRITICAL

### SYSTEMATIC PROBLEM: Color Contrast Violations

**This is a recurring issue that MUST be prevented.** The developer has repeatedly created components with illegible text by using light text on light backgrounds or similar low-contrast combinations.

### TAILWIND CSS V4 COLOR CONFIGURATION - IMPORTANT

**This project uses Tailwind CSS v4 (Alpha)** which works differently from previous versions:

1. **Colors MUST be defined in `@theme` block** in `src/styles/global.css` to work with Tailwind classes
2. **`text-black` class is NOW AVAILABLE** - `--color-black: #000000` has been added to the theme
3. **Available color classes**:
   - `text-black` → Pure black (#000000) - **USE THIS for maximum contrast**
   - `text-base-900` → Almost black (#121416)
   - `text-base-800` → Dark gray (#212529)
   - `text-base-700` → Medium dark gray (#343a40)

**Why `text-black` didn't work before:**
- Tailwind v4 uses CSS variables defined in `@theme`
- The color `black` wasn't properly defined in the theme (was `#121212`, now `#000000`)
- Global CSS rule `p { color: var(--color-base-600); }` was overriding Tailwind classes
- **Solution**: Use `style="color: #000000;"` for inline styles OR use `text-black` class (now fixed)

**Best Practice:**
- For components that need **true black text**, use `text-black` class or `style="color: #000000;"`
- For general text, use `text-base-700`, `text-base-800`, or `text-base-900`
- When Tailwind classes don't work due to CSS specificity, use inline styles with `style=""`

### WCAG AA Compliance Requirements (MANDATORY)

**All text must meet these minimum contrast ratios:**
- **Normal text** (< 18pt): **4.5:1** contrast ratio minimum
- **Large text** (≥ 18pt or 14pt bold): **3:1** contrast ratio minimum
- **UI components and icons**: **3:1** contrast ratio minimum

### Color Combination Rules

**LIGHT BACKGROUNDS** (base-25, base-50, base-100, accent-50, blue-50, green-50, purple-50, amber-50, etc.):
- ✅ **USE DARK TEXT**: base-700, base-800, base-900
- ❌ **NEVER USE**: Light text colors (base-300, base-400, base-500, accent-300, blue-300, etc.)

**DARK BACKGROUNDS** (base-700, base-800, base-900, accent-600, blue-600, etc.):
- ✅ **USE LIGHT TEXT**: base-25, base-50, base-100, base-200
- ❌ **NEVER USE**: Dark text colors on dark backgrounds

### Common Violations to Avoid

**BAD Examples (DO NOT USE):**
```html
<!-- ❌ WRONG: Light text on light background -->
<div class="bg-blue-50">
  <p class="text-blue-300">This is illegible!</p>
</div>

<!-- ❌ WRONG: Light text on light background -->
<div class="bg-purple-50">
  <h5 class="text-purple-700">Hard to read</h5>
</div>

<!-- ❌ WRONG: Medium color on light background -->
<div class="bg-accent-50">
  <p class="text-accent-500">Low contrast</p>
</div>
```

**GOOD Examples (USE THESE):**
```html
<!-- ✅ CORRECT: Dark text on light background -->
<div class="bg-blue-50">
  <p class="text-base-800">This is legible!</p>
</div>

<!-- ✅ CORRECT: Dark heading, dark body text on light background -->
<div class="bg-purple-50">
  <h5 class="text-base-900">Clear heading</h5>
  <p class="text-base-700">Clear body text</p>
</div>

<!-- ✅ CORRECT: White text on dark background -->
<div class="bg-accent-600">
  <p class="text-white">High contrast</p>
</div>

<!-- ✅ CORRECT: Light text on dark background -->
<div class="bg-base-800">
  <p class="text-base-50">Easy to read</p>
</div>
```

### Specific Color Combinations Reference

| Background | Acceptable Text Colors | ❌ NEVER USE |
|------------|----------------------|--------------|
| `bg-blue-50` | `text-base-700`, `text-base-800`, `text-base-900` | `text-blue-300`, `text-blue-400`, `text-blue-500` |
| `bg-purple-50` | `text-base-700`, `text-base-800`, `text-base-900` | `text-purple-300`, `text-purple-400`, `text-purple-500` |
| `bg-green-50` | `text-base-700`, `text-base-800`, `text-base-900` | `text-green-300`, `text-green-400`, `text-green-500` |
| `bg-amber-50` | `text-base-700`, `text-base-800`, `text-base-900` | `text-amber-300`, `text-amber-400`, `text-amber-500` |
| `bg-accent-50` | `text-base-700`, `text-base-800`, `text-base-900` | `text-accent-300`, `text-accent-400`, `text-accent-500` |
| `bg-accent-600` | `text-white`, `text-base-50`, `text-base-100` | `text-base-600`, `text-base-700`, `text-base-800` |
| `bg-base-800` | `text-white`, `text-base-50`, `text-base-100` | `text-base-600`, `text-base-700` |

### Verification Checklist

**Before committing any component with colored backgrounds:**
1. ✅ Is the background color light (50-200 range)? → Use dark text (700-900)
2. ✅ Is the background color dark (600-900 range)? → Use light text (25-200)
3. ✅ Does the text have sufficient contrast for its size?
4. ✅ Are all interactive elements (buttons, links) also properly contrasted?

### Design System Color Usage

**From `src/styles/global.css`:**
- **Accent colors** (`accent-*`): Professional blue scale (25-950)
- **Base colors** (`base-*`): Gray scale for text and backgrounds (25-950)

**Safe combinations:**
- Light backgrounds: `bg-base-50`, `bg-base-100` → Dark text: `text-base-700`, `text-base-800`, `text-base-900`
- Medium backgrounds: `bg-base-500`, `bg-base-600` → Light text: `text-base-50`, `text-base-100`
- Dark backgrounds: `bg-base-800`, `bg-base-900` → Light text: `text-base-50`, `text-white`

### Visual Design Principles

1. **Never use harsh white backgrounds** - prefer `base-50`, `base-100`, or subtle gradients
2. **Maintain visual hierarchy** with proper heading sizes and weights
3. **Use consistent spacing** with Tailwind's spacing scale
4. **Add subtle animations** for improved user experience (hover effects, transitions)
5. **Implement proper focus states** for accessibility

### Files Recently Fixed for Contrast Issues

The following files had contrast violations that were corrected:
- `src/components/meeting/MeetingRequestCalendar.astro` (lines 184-224)
- `src/components/landing/AIHero.astro` (dashboard stats sections)
- `src/pages/servicios/chatbot.astro` (demo context badges)
- `src/pages/servicios/gestor-documental.astro` (context boxes)
- `src/pages/servicios/automatizacion.astro` (dashboard header)

**These serve as reference examples of proper contrast implementation.**

## Specialized Agents

This project includes specialized AI agents for specific tasks. Use the Task tool with the appropriate `subagent_type` to invoke them.

### Available Agents

#### 1. Frontend Developer Agent
**Type**: `frontend-developer`  
**Use When**:
- Implementing UI components with React, Vue, or other frameworks
- State management and performance optimization
- Accessibility implementation (WCAG compliance)
- Modern frontend architecture decisions
- Responsive design across devices

**Examples**:
```javascript
// Invoke for UI component work
Task({
  subagent_type: "frontend-developer",
  prompt: "Create an accessible modal component with focus trapping"
});

// Invoke for performance optimization
Task({
  subagent_type: "frontend-developer",
  prompt: "Optimize bundle size and implement code splitting"
});
```

#### 2. UI Designer Agent
**Type**: `ui-designer`  
**File**: `.claude/agents/ui-designer.md`  
**Use When**:
- Improving visual design and aesthetics
- Creating color schemes and design systems
- Enhancing text readability and contrast (WCAG AA)
- Layout spacing and visual hierarchy
- Component styling and design consistency
- Prototyping and design iterations

**Examples**:
```javascript
// Invoke for design improvements
Task({
  subagent_type: "ui-designer",
  prompt: "Analyze and improve the visual design of the homepage with better contrast and spacing"
});

// Invoke for design system work
Task({
  subagent_type: "ui-designer",
  prompt: "Create a cohesive design system with color tokens and typography scale"
});
```

**Note**: This agent was used to implement the current visual improvements including:
- Responsive typography with `clamp()`
- WCAG AA compliant color contrast
- Professional shadow system
- Smooth animations and micro-interactions

#### 3. SEO Specialist Agent
**Type**: `seo-specialist`  
**File**: `.claude/agents/seo-specialist.md`  
**Use When**:
- Optimizing meta tags and structured data
- Improving site architecture and technical SEO
- Keyword research and content optimization
- Implementing schema.org markup
- Analyzing Core Web Vitals
- Local SEO optimization (Google Business Profile)
- Link building strategies
- SEO audits and reporting

**Examples**:
```javascript
// Invoke for technical SEO
Task({
  subagent_type: "seo-specialist",
  prompt: "Audit the site for technical SEO issues and implement fixes for Core Web Vitals"
});

// Invoke for content optimization
Task({
  subagent_type: "seo-specialist",
  prompt: "Optimize meta tags and add structured data for all service pages"
});

// Invoke for keyword research
Task({
  subagent_type: "seo-specialist",
  prompt: "Research keywords for 'automatización empresarial con IA' and create content strategy"
});
```

### When to Use Specialized Agents

**Use specialized agents when:**
- ✅ The task requires domain-specific expertise (design, SEO, frontend)
- ✅ You need to follow industry best practices and standards
- ✅ The work involves complex technical decisions in that domain
- ✅ You want consistent patterns across the codebase

**Use general assistance when:**
- ❌ Simple file operations (use Read, Write, Edit tools directly)
- ❌ Quick bug fixes or minor text changes
- ❌ Tasks that don't require specialized knowledge

### Agent Priority System

Agents are configured with priority levels that affect when they should be invoked:

- **High Priority**: UI Designer, SEO Specialist, Frontend Developer
  - Invoke proactively for relevant tasks
  - Essential for maintaining quality standards

- **Medium Priority**: General purpose agents
  - Invoke when specifically requested

- **Low Priority**: Experimental or specialized use cases
  - Invoke only for specific scenarios

### Best Practices

1. **Be Specific**: Provide clear, detailed prompts to agents
2. **Context Matters**: Include relevant information about the project and current state
3. **One Agent at a Time**: Don't mix multiple specialized domains in one task
4. **Review Output**: Always review agent recommendations before applying changes
5. **Iterative Approach**: Use agents for complex tasks that benefit from specialized knowledge

### Examples by Scenario

**Scenario: Improve Homepage Aesthetics**
```javascript
// ✅ Correct: Use UI Designer
Task({
  subagent_type: "ui-designer",
  prompt: "Analyze homepage design and improve visual hierarchy, contrast, and spacing"
});
```

**Scenario: Optimize for Google Search**
```javascript
// ✅ Correct: Use SEO Specialist
Task({
  subagent_type: "seo-specialist",
  prompt: "Perform SEO audit and optimize all pages for target keywords: 'IA para empresas', 'automatización inteligente'"
});
```

**Scenario: Build Interactive Component**
```javascript
// ✅ Correct: Use Frontend Developer
Task({
  subagent_type: "frontend-developer",
  prompt: "Create an accessible tabs component with keyboard navigation and ARIA labels"
});
```

**Scenario: Fix Typo in Text**
```javascript
// ❌ Incorrect: Don't use agent for simple edits
// ✅ Correct: Use Edit tool directly
Edit({
  file_path: "src/pages/index.astro",
  old_string: "Contáctenos",
  new_string: "Contáctanos"
});
```
