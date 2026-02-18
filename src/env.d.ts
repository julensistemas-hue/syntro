/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // Stripe
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly STRIPE_WAZUH_PRICE_ID: string;

  // Email (existing)
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: string;
  readonly SMTP_USER: string;
  readonly SMTP_PASSWORD: string;
  readonly SMTP_FROM_EMAIL: string;
  readonly SMTP_FROM_NAME: string;
  readonly RESEND_API_KEY: string;

  // Google Calendar (existing)
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  readonly GOOGLE_PRIVATE_KEY: string;
  readonly GOOGLE_CALENDAR_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Astro locals for middleware
declare namespace App {
  interface Locals {
    user?: import('@supabase/supabase-js').User;
    session?: import('@supabase/supabase-js').Session;
    paymentPending?: boolean;
  }
}
