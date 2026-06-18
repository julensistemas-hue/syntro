// Strings de interfaz compartidos (nav, footer, banner) por idioma.
// Solo cubre la UI que se muestra en la experiencia inglesa (Wazuh + Blog).
import type { Locale } from "./config";

export const ui = {
  es: {
    "nav.wazuh": "Wazuh",
    "nav.blog": "Blog",
    "nav.cta": "Solicitar Reunión",
    "nav.free": "GRATIS",
    "lang.switch": "English",
    "banner.toEn": "This page is available in English",
    "banner.toEnCta": "Read in English",
    "banner.toEs": "Esta página está disponible en español",
    "banner.toEsCta": "Leer en español",
    "footer.rights": "Todos los derechos reservados.",
    "footer.madeIn": "Hecho en España",
  },
  en: {
    "nav.wazuh": "Wazuh",
    "nav.blog": "Blog",
    "nav.cta": "Book a Meeting",
    "nav.free": "FREE",
    "lang.switch": "Español",
    "banner.toEn": "This page is available in English",
    "banner.toEnCta": "Read in English",
    "banner.toEs": "Esta página está disponible en español",
    "banner.toEsCta": "Leer en español",
    "footer.rights": "All rights reserved.",
    "footer.madeIn": "Made in Spain",
  },
} as const;

export function t(locale: Locale, key: keyof (typeof ui)["es"]): string {
  return ui[locale][key] ?? ui.es[key];
}
