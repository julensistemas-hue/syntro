// Configuración i18n central de aisecurity.es
//
// Estrategia: español sin prefijo (raíz), inglés bajo /en/.
// hreflang recíproco SOLO en páginas que existen en ambos idiomas.
// El "detecta-y-muestra-en-inglés" lo resuelve Google con hreflang;
// nosotros nunca cambiamos el contenido de una misma URL por IP/idioma.

export const DEFAULT_LOCALE = "es" as const;
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Rutas (sin prefijo de idioma, con barra inicial) que existen en AMBOS idiomas.
 * Cada vez que se traduce una página, su slug se añade aquí para activar el
 * hreflang recíproco y el selector de idioma. Si una ruta no está aquí, se
 * trata como monoidioma (solo español) y no emite hreflang.
 *
 * El homepage de la versión inglesa es "/" (sirve /en).
 */
export const TRANSLATED_PATHS = new Set<string>([
  "/wazuh",
  "/blog",
  // Los posts de blog en inglés se irán añadiendo aquí, p. ej.:
  // "/blog/what-is-wazuh",
]);

/** Detecta el locale a partir del pathname (/en o /en/... => en). */
export function getLocaleFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

/** Quita el prefijo /en y devuelve la ruta canónica española (con barra inicial). */
export function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3); // "/en/wazuh" -> "/wazuh"
  return pathname;
}

/** Construye la URL de una ruta canónica en un locale concreto. */
export function localizePath(canonicalPath: string, locale: Locale): string {
  if (locale === "es") return canonicalPath;
  if (canonicalPath === "/") return "/en";
  return `/en${canonicalPath}`;
}

/** ¿Esta ruta canónica tiene versión en ambos idiomas? */
export function hasTranslation(canonicalPath: string): boolean {
  return TRANSLATED_PATHS.has(canonicalPath);
}
