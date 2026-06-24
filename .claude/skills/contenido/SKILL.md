---
name: contenido
description: Genera el pack multiplataforma (blog, Medium, Reddit, Twitter/X, YouTube) en ES+EN a partir de una idea afilada del banco. Lanza los agentes especializados de cada plataforma y deja todo listo para tu revisión antes de publicar.
---

# /contenido — Generar el pack multiplataforma

Toma una idea (del banco `docs/content/banco-ideas.md` o la que indique el usuario) y produce
las piezas adaptadas a cada plataforma, en **ES + EN**.

## Pasos

1. **Carga la idea**: si no está afilada, sugiere pasar antes por `/idea`. Lee
   `docs/content/estrategia.md` para el mapa pilar→plataforma y decide qué plataformas aplican
   (no todas las ideas van a las 5).

2. **Confirma el alcance** con el usuario: qué plataformas, ES/EN o solo una, ancla y derivadas.

3. **Genera con los agentes especializados** (pueden ir en paralelo, uno por plataforma):
   - Blog → `blog-writer` (formato Astro + alta en index.astro)
   - Medium → `medium-writer`
   - Reddit → `reddit-strategist`
   - Twitter/X → `twitter-threadwriter`
   - YouTube → `youtube-scriptwriter`
   - Keywords/SEO transversal → `seo-specialist`
   Cada agente lee su `playbook-*.md` y aplica `geo-llm.md`.

4. **Entrega para revisión**: presenta cada pieza claramente separada por plataforma e idioma.
   **No publiques nada todavía** — el usuario supervisa todos los textos.

5. **Marca el estado** en `banco-ideas.md` como "en producción".

## Reglas
- Respeta la voz anti-hype en todas las piezas (filtro de `README.md`).
- El blog se deja como archivo `.astro` + alta en `index.astro` (no se commitea aquí; eso es `/publicar`).
- Para publicar, usar `/publicar` después de la aprobación del usuario.