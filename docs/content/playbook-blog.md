# Playbook — Blog aisecurity.es (Astro)

> Cómo se escribe y publica un post en el blog. Formato real del proyecto.
> Lo ejecuta el agente `blog-writer`. Ver también `geo-llm.md` y el `seo-specialist`.

---

## Público y objetivo

Decisores PyME ES que buscan en Google. Objetivo: **SEO/GEO + leads**. Pilares 1 y 2.

## Formato técnico (OBLIGATORIO seguirlo exacto)

Los posts son archivos `.astro` en `src/pages/blog/<slug>.astro` que usan `BlogLayout`:

```astro
---
import BlogLayout from "../../layouts/BlogLayout.astro";
---

<BlogLayout
  title="Título SEO (máx ~60 chars)"
  description="Meta description con propuesta de valor + CTA (máx ~155 chars)"
  publishDate="YYYY-MM-DD"
  author="AI Security"
  readTime="8 min"
  tags={["Tag1", "Tag2", "Inteligencia Artificial", "Casos de Uso"]}
  canonical="https://aisecurity.es/blog/<slug>">

<article>
<h1>Título con la keyword principal (puede ser pregunta)</h1>

<p>RESPUESTA DIRECTA en 2-3 frases (esto es lo que citan los LLM — regla GEO 1).</p>

<h2>¿Qué es / por qué importa…?</h2>
<p>…</p>

<h2>¿Cómo se hace…?</h2>
<!-- pasos, <pre><code class="language-xxx"> para código -->

<h2>¿Qué resultados reales da?</h2>
<!-- números concretos, caso real -->

<h2>¿Qué limitaciones tiene?</h2>
<!-- honestidad anti-hype -->

<h2>Preguntas frecuentes</h2>
<!-- + JSON-LD FAQPage -->

</article>
</BlogLayout>
```

## ⚠️ Regla automática del proyecto (CLAUDE.md)

Al crear el `.astro`, **en la misma operación** añadir el artículo al array `articles` en
`src/pages/blog/index.astro`. Es un único commit, no dos pasos. Objeto del array:

```js
{
  slug: "<slug>",
  title: "…",
  description: "…",
  publishDate: "YYYY-MM-DD",
  readTime: "8 min",
  tags: ["…"],
  category: "Inteligencia Artificial"   // o "Casos de Uso", "Wazuh", etc.
}
```

## SEO on-page (del seo-specialist)

- Title ≤ 60 chars, keyword principal al inicio.
- Description ≤ 155 chars, con CTA.
- Canonical siempre.
- Schema JSON-LD: `Article` + `FAQPage` (para las FAQ).
- Enlaces internos: a servicios relevantes (`/servicios/chatbot`, `/wazuh`, `/consultoria-ia`)
  y a otros posts del blog.

## GEO

Aplicar las 7 reglas de `geo-llm.md`. Imprescindibles: respuesta directa en el primer `<p>`,
H2 en pregunta, FAQ con JSON-LD, una limitación honesta.

## CTA (1 por post, al final)

Pilar 1 → `/presupuesto` o `/consultoria-ia`. Pilar 2 → `/wazuh` o `/curso-wazuh`.
Patrón usado en el proyecto: `/contacto-migracion?plan=X` pre-rellena el servicio.

## Versión EN

El post EN va en la estructura i18n `/en` (ver memoria `project_i18n_en`). Añadir a
`TRANSLATED_PATHS` y hreflang. No es traducción literal: adaptar ejemplos al mercado EN.

## Publicación

Commit + push a `main` → Vercel despliega. El hook Stop y el comportamiento automático del
proyecto ya hacen `git add -A` + commit + push. Tras el push de una página nueva, ejecutar
`node .github/scripts/check-page-quality.js` con `CHANGED_FILES`.

## Checklist antes de publicar
- [ ] `.astro` creado con formato `BlogLayout`.
- [ ] Añadido al array de `index.astro` (mismo commit).
- [ ] Respuesta directa en primer párrafo + H2 en pregunta + FAQ JSON-LD.
- [ ] 1 CTA al final, enlaces internos.
- [ ] Versión EN en `/en` + hreflang.
- [ ] `astro check` sin errores.
