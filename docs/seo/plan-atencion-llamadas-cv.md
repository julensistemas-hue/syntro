# Plan: Motor de captación automatizado — Atención de Llamadas IA · Comunidad Valenciana

> Objetivo: convertir `/servicios/atencion-llamadas` en una máquina de captación **automática, medible y auto-iterativa** para empresas de la Comunidad Valenciana. Una vez configurado: produce contenido solo, mide qué funciona y ajusta la estrategia sin intervención manual.

---

## 0. TL;DR

1. **Nicho primario: clínicas dentales y sanidad privada** (dental, fisio, podología, estética) en la Comunidad Valenciana. Es el nicho con más densidad de empresas, más dolor telefónico real y mayor disposición a pagar. **WISP se descarta como nicho principal** (mercado demasiado pequeño) pero se reserva como experimento secundario.
2. **Posicionamiento Google = SEO programático vertical × geo**: una matriz de landing pages tipo `recepcionista virtual para clínicas dentales en Valencia/Alicante/Castellón`, más un motor de blog que genera 1 artículo/día.
3. **Email marketing = outbound B2B conforme a LSSI/RGPD** a direcciones corporativas genéricas (info@/cita@/recepcion@), con secuencia de 3 toques y baja automática. Más un canal inbound (lead magnet).
4. **Medición**: reutilizamos el tracking GA4 ya arreglado (conversion_click hacia `/presupuesto?plan=Atencion-Llamadas-IA` + form_submit) y ampliamos el informe semanal con un embudo específico de este nicho.
5. **Loop auto-iterativo en dos niveles**:
   - **Diario** (GitHub Action + DeepSeek): genera y publica 1 blog del nicho desde una cola de keywords, lo indexa.
   - **Semanal** (estratega): lee GSC + GA4, decide qué funciona, rellena la cola de keywords, ajusta A/B y manda informe por email. Cierra el círculo *medir → decidir → producir → medir*.

---

## 1. Selección de nicho

### Criterios de un buen nicho para "atención de llamadas IA"
1. **Volumen de llamadas repetitivas alto** (citas, horarios, estados) → la IA resuelve el 80-85%.
2. **Coste real de la llamada perdida** (una cita no cogida = dinero perdido) → ROI evidente.
3. **Muchas empresas del mismo tipo** → permite SEO programático y email a escala.
4. **Baja digitalización / recepción saturada** → dolor presente, no hipotético.
5. **Ticket y permanencia razonables** → justifica el coste de adquisición.

### Comparativa (Comunidad Valenciana)

| Nicho | Nº empresas CV | Dolor telefónico | Ticket | ROI claro | Veredicto |
|-------|----------------|------------------|--------|-----------|-----------|
| **Clínicas dentales / sanidad privada** | Muy alto (miles) | Muy alto (citas) | Medio-alto | Sí (cita perdida = €€) | ⭐ **PRIMARIO** |
| Talleres / ITV | Alto | Alto | Medio | Sí | Secundario A |
| Asesorías / gestorías | Alto | Medio-alto | Medio | Medio | Secundario B |
| Hostelería / turismo Costa Blanca | Muy alto pero estacional | Alto | Variable | Sí (estacional) | Experimento |
| Inmobiliarias | Alto | Alto | Variable | Medio | Experimento |
| **WISP / ISP rural** | Bajo (decenas) | Muy alto | Alto | Sí | ❌ Mercado pequeño |

### Por qué clínicas dentales y NO WISP
- **TAM**: en CV hay miles de clínicas dentales/sanitarias frente a unas pocas decenas de WISP. El SEO programático y el email-marketing necesitan **volumen de targets**; con WISP la matriz de páginas y la lista de emails se agotan en una semana.
- **Búsqueda con intención**: nadie busca "recepcionista IA para WISP", pero sí hay volumen creciente en "centralita/recepcionista virtual clínica".
- **Dolor universal y homogéneo**: todas las clínicas tienen el mismo problema (recepción saturada, citas perdidas en horario de comida/noche), lo que permite un mensaje único y replicable.
- **WISP como experimento**: si Julián tiene contacto directo con algún WISP, es un cliente excelente (plan avanzado, integraciones), pero no es base para un motor de captación masivo. Se aborda 1-a-1, no por embudo.

> **Decisión**: arrancamos vertical **clínicas dentales** en CV. Validado el motor (4-6 semanas), se clona la maquinaria a talleres/asesorías cambiando keywords, copy y lista. La arquitectura es la misma; solo cambian los datos.

---

## 2. Arquitectura del embudo

```
                 ┌─────────────────────── LOOP SEMANAL (estratega) ───────────────────────┐
                 │                                                                          │
   GSC + GA4 ──► análisis ──► cola de keywords ──► ajuste A/B ──► informe email            │
        ▲                                                                                   │
        │                                                                                   ▼
   [ MEDICIÓN ]                                                              [ PRODUCCIÓN diaria ]
        ▲                                                                       1 blog/día (DeepSeek)
        │                                                                       + IndexNow ping
        │                                                                                   │
        │                                                                                   ▼
   conversion_click / form_submit  ◄── /presupuesto?plan=Atencion-Llamadas-IA ◄── LANDINGS vertical×geo
        ▲                                                                                   ▲
        │                                                                                   │
   tráfico orgánico (SEO/GEO)   +   email outbound B2B   +   inbound (lead magnet)  ────────┘
```

Tres fuentes de tráfico alimentan las landings; las landings convierten a `/presupuesto`; GA4 mide; el estratega semanal decide qué producir; el motor diario produce. Cerrado.

---

## 3. Posicionamiento en Google (SEO/GEO programático)

### 3.1 Matriz vertical × geo (landing pages)

Patrón de URL nuevo bajo el servicio existente:

```
/servicios/atencion-llamadas                                  (página madre, ya existe)
/servicios/atencion-llamadas/clinicas-dentales                (vertical)
/servicios/atencion-llamadas/clinicas-dentales-valencia       (vertical × ciudad)
/servicios/atencion-llamadas/clinicas-dentales-alicante
/servicios/atencion-llamadas/clinicas-dentales-castellon
/servicios/atencion-llamadas/clinicas-dentales-elche
/servicios/atencion-llamadas/clinicas-dentales-torrevieja
... (top 10-12 ciudades CV por densidad de clínicas)
```

- **Generación programática**: una plantilla `.astro` + un array de `{ciudad, provincia, párrafo único}` que renderiza por `getStaticPaths` (o SSR con params, siguiendo el patrón ya documentado en memoria `reference_ssr_dynamic_routes`).
- **Anti-duplicado** (regla ya establecida en `docs/seo`): cada página lleva ≥1 párrafo único sobre esa ciudad + datos locales (nº aprox. de clínicas, mención de barrios/zonas). El resto (demo, niveles, FAQ) se reutiliza del componente madre.
- **Servicio remoto**: cada página deja claro que se presta en remoto desde Benicarló (igual que las geo de soporte).
- Reutiliza el **schema Service + FAQPage** que ya tiene la página madre, adaptando `areaServed` a la ciudad.

### 3.2 Keywords objetivo (clúster dental CV)

| Tipo | Ejemplos | Intención |
|------|----------|-----------|
| Transaccional vertical×geo | "recepcionista virtual clínica dental Valencia", "centralita IA clínica Alicante" | Alta (compra) |
| Problema | "clínica dental pierde llamadas hora comida", "no doy abasto teléfono recepción clínica" | Media |
| Informacional (blog) | "cómo reducir llamadas perdidas clínica dental", "secretaria virtual vs recepcionista IA" | Baja-media (top funnel) |
| Comparativa | "alternativa a contratar recepcionista clínica", "coste recepcionista vs IA" | Media-alta |

La cola de keywords vive en un JSON versionado: `scripts/seo-automation/keyword-queue-llamadas.json`.

### 3.3 Off-page / refuerzos
- **Google Business Profile**: si procede, servicio con área de servicio CV (no dirección física pública).
- **Enlazado interno**: la home y `/servicios/atencion-llamadas` enlazan a las landings vertical×geo; cada blog enlaza a su landing de nicho.
- **IndexNow + Google Indexing API**: ya montado (scripts 5 y 2). Añadir las nuevas URLs a `URLS_TO_INDEX`.

### 3.4 Motor de blog (contenido)
- Cada artículo ataca una keyword informacional/comparativa del clúster dental y enlaza a la landing del nicho como CTA.
- Usa `BlogLayout` (que **ya tiene GA4** tras el arreglo de hoy) + se añade al array de `src/pages/blog/index.astro` en el mismo commit (regla del proyecto).
- Lo genera el loop diario (sección 6).

---

## 4. Email marketing (outbound B2B)

### 4.1 Marco legal (importante — filosofía "sin humo")
En España el email comercial B2B se rige por **LSSI-CE art. 21 + RGPD**. Camino defendible:
- Enviar **solo a direcciones corporativas genéricas** (info@, cita@, recepcion@clinica.es), no a personas identificadas.
- Oferta **relacionada con la actividad** del destinatario (reducir llamadas perdidas en su clínica).
- **Identificación clara** del remitente + **baja inmediata** en cada email (link de opt-out y honrarlo).
- Sin compra de bases de datos; emails obtenidos de fuentes públicas (webs, directorios).
- Registro de bajas persistente para no reimpactar.

> Si se prefiere riesgo cero: priorizar **inbound** (lead magnet + SEO) y usar el outbound solo como complemento manual/LinkedIn.

### 4.2 Infraestructura (reutiliza Resend, ya integrado)
- Lista de clínicas: scraping/recopilación a `scripts/outreach/leads-clinicas-cv.json` (`{empresa, ciudad, email, web, estado}`).
- Envío con Resend (dominio aisecurity.es ya verificado) mediante un script `scripts/outreach/send-sequence.js`.
- Tabla de supresión `scripts/outreach/unsuppress.json` + endpoint de baja.

### 4.3 Secuencia de 3 toques (cada 4-5 días)
1. **Toque 1 — dolor**: "¿Cuántas citas perdéis cuando la recepción está al teléfono o cerrada?" → link a la landing dental de su ciudad.
2. **Toque 2 — prueba**: caso/demo ("una recepcionista IA coge el 100% de las llamadas, incluso a las 22h") → demo interactiva.
3. **Toque 3 — oferta suave**: "análisis gratuito de vuestro volumen de llamadas" → `/presupuesto?plan=Atencion-Llamadas-IA`.
- Todo trackeado con UTM (`?utm_source=email&utm_campaign=dental_cv`) para medir en GA4.

---

## 5. Medición

### 5.1 Qué ya funciona (tras el fix de hoy)
- `conversion_click` cuando alguien pulsa el CTA a `/presupuesto?plan=Atencion-Llamadas-IA`.
- `form_submit` / `conversion_form` al enviar el formulario de presupuesto.
- `page_type`, `page_path`, `link_url`, scroll y tiempo en página por landing.

### 5.2 KPIs del embudo dental CV
| Etapa | Métrica | Fuente |
|-------|---------|--------|
| Visibilidad | impresiones + posición media de keywords dentales | GSC |
| Tráfico | sesiones a `/servicios/atencion-llamadas*` por ciudad | GA4 |
| Interés | scroll ≥75% + tiempo ≥60s en landings | GA4 |
| Conversión | conversion_click + form_submit con plan Atencion-Llamadas | GA4 |
| Email | open/click/conversión por toque y campaña | Resend + UTM |

### 5.3 Informe semanal (ampliar el existente)
- Reutiliza `scripts/ga4-weekly-report.mjs` + `seo-automation/7-*`/`8-*`/`analyze-and-email.js`.
- Añadir una **sección "Embudo Atención-Llamadas CV"**: tráfico por landing, conversiones del plan, top keywords dentales (GSC), y **tendencia semana a semana** (mejora/empeora) — que es justo lo que pides para saber "si la estrategia va a mejor".

---

## 6. El loop auto-iterativo

### 6.1 Nivel DIARIO — motor de contenido (desatendido)
**Workflow nuevo**: `.github/workflows/content-daily-llamadas.yml` (cron diario, p.ej. `17 6 * * *`).
Ejecuta `scripts/seo-automation/content-engine-llamadas.js` que:
1. Lee `keyword-queue-llamadas.json` y coge la siguiente keyword pendiente.
2. Llama a **DeepSeek** (`DEEPSEEK_API_KEY` ya en Vercel/Actions) con un prompt-plantilla del nicho (tono "sin humo", estructura blog, CTA a la landing dental, schema Article).
3. Crea `src/pages/blog/<slug>.astro` con `BlogLayout` **y lo añade al array de `index.astro`** (mismo commit).
4. `git commit + push` → Vercel despliega → el workflow de IndexNow (ya existente) hace ping.
5. Marca la keyword como "publicada" en la cola.
- **Guardarraíles**: 1 artículo/día máx; valida con `check-page-quality.js` (ya existe) antes de commitear; si la cola está vacía, no hace nada y avisa.

### 6.2 Nivel SEMANAL — estratega (cierra el bucle)
**Workflow nuevo o ampliar `ga4-weekly-report.yml`**: `scripts/seo-automation/strategist-weekly.js` que:
1. Descarga GSC (queries, impresiones, posición) + GA4 (tráfico/conversiones por landing) — reutiliza `7-fetch`/`8-fetch-ga4`.
2. **Detecta oportunidades**: keywords con muchas impresiones y pocos clics (falta contenido), landings con tráfico pero 0 conversión (falta CTA/copy), ciudades sin página todavía.
3. **Rellena `keyword-queue-llamadas.json`** con las nuevas oportunidades (esto alimenta el motor diario → auto-iteración real).
4. Decide si crear nuevas landings de ciudad (genera issue/tarea o las crea directamente).
5. Ajusta la rotación A/B (script 3) de las landings de peor CTR.
6. Manda el **informe email** con tendencia y acciones tomadas.

> Este nivel semanal es el que hace que el sistema "itere sobre sí mismo": lo que mide define lo que el motor diario produce la semana siguiente.

### 6.3 Opción avanzada (estratega con Claude)
Para decisiones más ricas (redactar nuevas estrategias, no solo keywords), el paso semanal puede invocar a Claude Code en modo agente programado (skill `/schedule` o un agente con la API). Útil para "sacar nuevas estrategias", pero el núcleo funciona con DeepSeek + reglas, sin depender de que el equipo esté delante.

---

## 7. Roadmap por fases

| Fase | Semana | Entregables |
|------|--------|-------------|
| **0 — Base** | 1 | Plantilla landing vertical×geo + 1 landing piloto (`clinicas-dentales-valencia`). Cola de keywords inicial (20-30). Verificar tracking del plan en GA4. |
| **1 — Geo** | 1-2 | 8-12 landings dental×ciudad CV. Alta en GSC + Indexing API + IndexNow. Enlazado interno. |
| **2 — Contenido** | 2 | Motor diario (workflow + content-engine-llamadas.js). Primeros 5-7 blogs dentales. |
| **3 — Medición** | 2-3 | Sección "Embudo Atención-Llamadas CV" en el informe semanal con tendencia. |
| **4 — Email** | 3-4 | Lista de clínicas CV, secuencia de 3 toques en Resend, opt-out, UTMs. |
| **5 — Estratega** | 4 | strategist-weekly.js: análisis → rellena cola → ajusta A/B → email. Bucle cerrado. |
| **6 — Iterar/clonar** | 5+ | Revisar resultados; si funciona, clonar maquinaria a talleres/asesorías cambiando datos. |

---

## 8. Riesgos y decisiones abiertas
- **Legal email B2B**: confirmar apetito de riesgo (outbound a genéricos vs solo inbound).
- **Calidad del contenido auto-generado**: riesgo de "thin content" penalizable. Mitigación: prompt con datos reales + check de calidad + máx 1/día + revisión humana semanal del estratega.
- **Canibalización**: las landings vertical×geo no deben competir entre sí; enlazado y `canonical` cuidados.
- **WISP**: no entra en el motor; si surge un lead WISP, atención manual.
- **Capacidad de entrega**: si entran muchos leads, validar que Julián puede implantar (el plan básico es 7-10 días).

---

*Documento vivo. Relacionado con: `docs/seo/geo-posicionamiento.md`, `docs/seo/automatizaciones.md`, tracking GA4 (`GoogleAnalytics.astro`).*
