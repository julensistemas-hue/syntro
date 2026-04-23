# Documentación SEO — aisecurity.es

> Índice de toda la estrategia SEO del proyecto. Leer este archivo antes de trabajar en cualquier tarea relacionada con posicionamiento.

---

## Archivos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| [geo-posicionamiento.md](geo-posicionamiento.md) | Estrategia completa de SEO geográfico (páginas por ciudad, blog, GBP, LinkedIn) |
| [automatizaciones.md](automatizaciones.md) | Scripts de automatización SEO: qué hacen, cómo usarlos, dónde se ejecutan |

---

## Contexto rápido del proyecto

**Sitio:** aisecurity.es — servicios de IA para PyMEs + ciberseguridad (Wazuh/ENS)  
**Propietario:** Julián, administrador de sistemas, 1 persona  
**Estado del dominio:** En producción en Vercel, dominio aisecurity.es activo

### Dos áreas de negocio con estrategias SEO distintas

**1. Servicios de IA** (chatbot, automatización, gestor documental, etc.)
- Keywords: "chatbot para empresas España", "automatización procesos pymes"
- Páginas: `/servicios/chatbot`, `/servicios/automatizacion`, etc.
- Sin estrategia geo activa aún

**2. Ciberseguridad / Soporte Técnico** ← **FOCO PRINCIPAL SEO AHORA**
- Keywords: "soporte técnico empresas [ciudad]", "Wazuh implementación", "ENS ciberseguridad"
- Estrategia geo activa: páginas `/soporte-tecnico/[ciudad]`
- Blog de concienciación ya creado (5 artículos publicados)
- Ver [geo-posicionamiento.md](geo-posicionamiento.md)

---

## Estado actual (abril 2026)

### Páginas geo creadas
- `/soporte-tecnico/benicarlo` — primera página geo de prueba (creada)
- Pendientes: Madrid, Barcelona, Valencia, Sevilla, Bilbao...

### Blog artículos publicados
- `/blog/ciberseguridad-basica-empleados-guia-completa`
- `/blog/detectar-phishing-outlook-microsoft-guia-empleados`
- `/blog/detectar-phishing-gmail-guia-empleados`
- `/blog/tu-contrasena-mayuscula-numeros-hackeable`
- `/blog/contrasenas-seguras-empleados-guia-completa`
- `/blog/pc-empresa-lento-causas-y-soluciones`
- `/blog/backup-automatico-pymes-guia-completa`
- `/blog/configurar-correo-corporativo-outlook-movil`

### Automatizaciones activas (GitHub Actions)
- **Cada lunes:** actualiza `modifiedDate` en artículos del blog (script 1)
- **Días 1 y 15:** rota títulos/meta descriptions A/B (script 3)
- **Cada push a main:** ping a Google/Bing/Yandex con IndexNow (script 5)
- **Manual/programado:** indexación directa via Google Indexing API (script 2)

---

## Decisiones de diseño importantes

1. **Páginas geo son 100% remotas** — el servicio se presta en remoto desde Benicarlò pero las páginas apuntan a ciudades con volumen de búsqueda. Cada página debe mencionar explícitamente que es servicio remoto.

2. **No duplicar contenido** — cada página geo tiene al menos un párrafo único sobre esa ciudad/región. El resto puede ser igual.

3. **Schema JSON-LD en todas las páginas de servicio** — tipo `LocalBusiness` o `Service` según corresponda.

4. **Blog de concienciación = embudo hacia test de empleados** — los artículos de phishing/contraseñas apuntan a `/servicios/test-concienciacion-empleados`.

5. **Wazuh = canal YouTube → web** — los vídeos del canal (~500 subs) llevan tráfico a `/wazuh` y `/curso-wazuh`.
