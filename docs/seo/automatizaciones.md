# Automatizaciones SEO — Scripts y GitHub Actions

Todos los scripts están en `scripts/seo-automation/`. Se ejecutan automáticamente via GitHub Actions o manualmente con Node.js.

---

## Scripts disponibles

### Script 1 — Actualizar fechas (`1-update-dates.js`)
**Qué hace:** Actualiza `modifiedDate` en los 5 artículos de concienciación del blog para que Google los vea como contenido fresco.  
**Cuándo se ejecuta:** Cada lunes a las 09:00h (GitHub Actions)  
**Ejecución manual:** `node scripts/seo-automation/1-update-dates.js`  
**Archivos afectados:** `src/pages/blog/*.astro` + `src/pages/blog/index.astro`

---

### Script 2 — Google Indexing API (`2-google-indexing.js`)
**Qué hace:** Solicita indexación directa a Google para las URLs prioritarias via Google Indexing API.  
**Requiere:** `scripts/seo-automation/google-credentials.json` (cuenta de servicio `seo-automation@julensistemas.iam.gserviceaccount.com`) — **NO commitear**  
**Cuándo se ejecuta:** Manual (ejecutar tras publicar contenido nuevo)  
**Ejecución manual:** `node scripts/seo-automation/2-google-indexing.js`  
**URLs indexadas:**
- `/blog/ciberseguridad-basica-empleados-guia-completa`
- `/blog/detectar-phishing-outlook-microsoft-guia-empleados`
- `/blog/detectar-phishing-gmail-guia-empleados`
- `/blog/tu-contrasena-mayuscula-numeros-hackeable`
- `/blog/contrasenas-seguras-empleados-guia-completa`
- `/servicios/test-concienciacion-empleados`

**Setup Google Cloud:**
- Proyecto: `julensistemas`
- API habilitada: Web Search Indexing API (`indexing.googleapis.com`)
- Cuenta de servicio añadida como Propietario en Search Console

---

### Script 3 — Rotación A/B (`3-ab-rotation.js`)
**Qué hace:** Rota títulos y meta descriptions entre 3 variaciones por artículo para probar cuál posiciona mejor.  
**Cuándo se ejecuta:** Días 1 y 15 de cada mes (GitHub Actions)  
**Ejecución manual:**
```bash
node scripts/seo-automation/3-ab-rotation.js --status   # Ver variación actual
node scripts/seo-automation/3-ab-rotation.js --rotate   # Ejecutar rotación
```
**Estado guardado en:** `scripts/seo-automation/ab-state.json` (no commitear)

---

### Script 4 — Variaciones de contenido (`4-content-variations.js`)
**Qué hace:** Realiza pequeños cambios en párrafos (actualizar año, rotar sinónimos) para que el contenido parezca actualizado.  
**Cuándo se ejecuta:** Manual / bajo demanda  
**Ejecución manual:** `node scripts/seo-automation/4-content-variations.js`

---

### Script 5 — Ping a buscadores (`5-ping-search-engines.js`)
**Qué hace:** Notifica a Google, Bing y Yandex via IndexNow cuando hay cambios en el sitio.  
**Cuándo se ejecuta:** En cada push a `main` (GitHub Actions — espera 60s al deploy de Vercel)  
**Ejecución manual:** `node scripts/seo-automation/5-ping-search-engines.js`  
**IndexNow key:** `68a67eafc24317348d515073e5547e72` (archivo en `public/`)  
**Resultados esperados:** Google puede dar 404 si el dominio no está activo; Bing/Yandex/IndexNow = 202

---

### Script 6 — Ejecutar todos (`run-all.js`)
**Qué hace:** Lanza los 5 scripts en secuencia.  
**Ejecución manual:** `node scripts/seo-automation/run-all.js`

---

## GitHub Actions Workflows

| Workflow | Archivo | Trigger | Script |
|----------|---------|---------|--------|
| SEO Update Dates | `.github/workflows/seo-update-dates.yml` | Cada lunes 08:00 UTC | Script 1 |
| SEO A/B Rotation | `.github/workflows/seo-ab-rotation.yml` | Días 1 y 15 09:00 UTC | Script 3 |
| SEO Ping | `.github/workflows/seo-ping.yml` | Push a main | Script 5 |

Los workflows hacen commit automático si hay cambios (scripts 1 y 3). El ping (script 5) solo notifica, no modifica archivos.

---

## Archivos que NO se suben a GitHub (.gitignore)

```
scripts/seo-automation/google-credentials.json   ← clave API Google
scripts/seo-automation/ab-state.json             ← estado rotación A/B
scripts/seo-automation/ping-log.json             ← log de pings
scripts/seo-automation/indexing-log.json         ← log de indexaciones
scripts/seo-automation/indexnow-key.txt          ← clave IndexNow
```

---

## Para añadir nuevas URLs a indexar

Editar la constante `URLS_TO_INDEX` en `scripts/seo-automation/2-google-indexing.js` y `5-ping-search-engines.js`.

## Para añadir nuevos artículos a la rotación A/B

Añadir entrada al objeto `AB_VARIATIONS` en `scripts/seo-automation/3-ab-rotation.js` con el slug del artículo y 3 variaciones de título/descripción.
