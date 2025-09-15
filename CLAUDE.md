# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is an Astro project with pnpm as the package manager:

- `pnpm dev` or `pnpm start` - Start development server at localhost:3000
- `pnpm build` - Build production site to ./dist/
- `pnpm preview` - Preview production build locally
- `astro add` - Add integrations
- `astro check` - Run type checking

## Project Architecture

This is an Astro-based SaaS/Startup template using Tailwind CSS v4:

### Key Technologies
- **Astro 5.12.6** - Static site generator with modern web framework features
- **Tailwind CSS v4** (Alpha) - Using new CSS-only approach without config file
- **pnpm** - Package manager (required, see .npmrc shamefully-hoist setting)
- **TypeScript** - Type checking enabled via tsconfig.json

### Directory Structure
```
src/
├── assets/images/     - Static image assets (logos, dashboard images)
├── components/        - Reusable Astro components
│   ├── Forms/        - Login/Signup form components
│   ├── global/       - Site-wide components (Navigation, Footer, Testimonial)
│   ├── infopages/    - Static page components (FAQ, Privacy, Terms)
│   └── landing/      - Homepage sections (Hero, Pricing, Features)
├── layouts/          - Page layout templates
│   └── utilities/    - Layout helper components (OptimizedImage)
├── pages/            - File-based routing (index, login, signup, etc.)
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
- Uses experimental Astro font providers for Google Fonts
- Sitemap integration enabled
- Site URL configured as "https://yoursite.com" (update for production)
- GPL-3.0 licensed template originally by Michael Andreuzza, modified by Bektur Aslan