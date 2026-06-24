# Sistema de Contenido Multiplataforma — AI Security

> Índice del sistema de creación y distribución de contenido sobre IA.
> **Leer este archivo antes de crear cualquier pieza de contenido.**

---

## Qué es esto

Un sistema para producir contenido sobre IA y publicarlo, **adaptado a cada plataforma**,
en YouTube, Medium, Reddit, Twitter/X y el blog de aisecurity.es. Una idea → un *pack*
multiplataforma, no un copia-pega.

## Filosofía — INNEGOCIABLE

Es la misma de la web (`docs/project/contexto.md`): **anti-humo**.

- ❌ "La IA va a revolucionar tu empresa", "el futuro es ahora", hype vacío.
- ✅ Casos de uso **reales**, con números concretos, limitaciones honestas y el "cómo".
- El diferenciador: la mayoría del contenido de IA en internet **no aporta y nubla la
  vista** sobre lo que la IA puede hacer de verdad. Nosotros mostramos uso real.

> Regla de oro: si una frase podría estar en cualquier vídeo genérico de "IA para
> emprendedores", se borra.

## Los 4 pilares de contenido

| # | Pilar | Peso | De qué va |
|---|-------|------|-----------|
| 1 | **IA general para empresas** | 🟩 Principal | Casos de uso reales, qué problemas cubre de verdad, con números. Público: decisores y profesionales de PyME. |
| 2 | **IA + ciberseguridad / Wazuh** | 🟦 Pequeño | IA aplicada a SOC, detección, automatización defensiva. Enlaza con `/wazuh`, `/curso-wazuh`. |
| 3 | **Técnico: MCPs, agentes, Claude** | 🟨 Medio | Construir con IA. MCP, agentes, Claude Code, prompting real. Público: dev/técnico. |
| 4 | **Conceptual** | 🟪 Medio | Cómo entender la IA para usarla. La brecha entre lo que aporta hoy y lo que llegará a aportar. Mentalidad, no hype. |

## Objetivo (triple, se prioriza por plataforma)

1. **Leads** → aisecurity.es (`/presupuesto`, `/contacto-migracion`, cursos).
2. **Autoridad / marca** AI Security.
3. **SEO / GEO** del dominio.

Mapeo por defecto: **blog = SEO/GEO**, **YouTube/Twitter = autoridad**, **todas con CTA suave a leads**.

## Idiomas

Todo el contenido se produce en **ES + EN**. El EN se mide antes de abrir más idiomas
(ver memoria del proyecto: i18n `/en`).

## Identidad

Se publica como marca **AI Security** (no marca personal). Tono experto, cercano,
técnico-pero-claro. Sin emojis en exceso, sin clickbait hueco.

---

## Mapa del sistema

```
docs/content/                 ← conocimiento (fuente de verdad)
├── README.md                 ← este archivo
├── estrategia.md             ← pilares, público, voz, pilar→plataforma, CTAs
├── geo-llm.md                ← cómo aparecer en respuestas de IA (GEO)
├── playbook-blog.md          ← formato Astro del proyecto
├── playbook-medium.md
├── playbook-reddit.md
├── playbook-twitter.md
├── playbook-youtube.md
├── banco-ideas.md            ← BACKLOG: aquí se dejan títulos/ideas
└── calendario.md             ← cadencia editorial

.claude/agents/               ← ejecutores (uno por plataforma)
├── content-strategist.md     ← estratega: ángulo, GEO, refinamiento
├── blog-writer.md
├── medium-writer.md
├── reddit-strategist.md
├── twitter-threadwriter.md
├── youtube-scriptwriter.md
└── seo-specialist.md (ya existía) ← keyword research

.claude/skills/               ← flujos invocables
├── idea/        → /idea       refinar un tema iterativamente y guardarlo en el banco
├── contenido/   → /contenido  generar el pack multiplataforma ES+EN
└── publicar/    → /publicar    publicar el pack (browsermcp + commit)
```

## Flujo de trabajo típico

1. **`/idea <tema>`** — abrimos un tema, el estratega da feedback, lo refinamos juntos
   hasta tener buen ángulo. Se guarda en `banco-ideas.md`.
2. **`/contenido <idea>`** — se genera el pack ES+EN para todas las plataformas. El
   usuario lo revisa y aprueba.
3. **`/publicar <idea>`** — se publica donde toque y se marca el estado en el banco.

## MCPs que usa el sistema

| MCP | Uso |
|-----|-----|
| `browsermcp` | Publicar en Medium / Reddit / X / YouTube Studio con la sesión del usuario |
| `youtube-transcript` | Research de vídeos competidores |
| `fetch` / WebSearch / WebFetch | Research SEO/GEO, tendencias, fuentes citables |
| `github` | Commits del blog (Astro) |

> Límites honestos: la subida del **vídeo** de YouTube es manual. Medium no tiene API de
> publicación (se usa `browsermcp`). Publicar vía navegador requiere sesión iniciada.