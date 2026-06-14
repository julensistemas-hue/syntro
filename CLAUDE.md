CLAUDE.md — AI Security (aisecurity.es)

## ⚙️ Principios de trabajo

**Pensar antes de codificar.** Declarar suposiciones en voz alta. Si la petición es ambigua, preguntar. Si existe un enfoque más simple, decirlo. Parar cuando algo no está claro — nombrar qué es lo que no está claro, no elegir una interpretación arbitraria y ejecutar.

**Simplicidad primero.** Escribir el mínimo código que resuelva el problema. Sin abstracciones especulativas. Sin flexibilidad que nadie ha pedido. El test: ¿diría un senior que esto está sobrediseñado?

**Cambios quirúrgicos.** Tocar solo lo que la tarea requiere. No mejorar código adyacente. No refactorizar lo que no está roto. Cada línea cambiada debe trazarse directamente a la petición.

**Ejecución orientada al objetivo.** Convertir instrucciones vagas en objetivos verificables antes de escribir una línea. "Arregla el diseño" → identificar qué elemento se mueve/rompe y por qué, luego aplicar el mínimo cambio.

---

## 📂 Documentación de referencia

Leer el doc correspondiente antes de trabajar en esa área:

| Área | Archivo |
|------|---------|
| Contexto, servicios, filosofía, embudos | `docs/project/contexto.md` |
| Stack, estructura de carpetas, Tailwind v4, Supabase | `docs/project/arquitectura.md` |
| Colores, contraste, WCAG, callout boxes | `docs/project/ui-design.md` |
| Sistema de email (Resend + SMTP) | `docs/project/email.md` |
| Cuándo y cómo usar cada agente | `docs/project/agentes.md` |
| SEO/GEO, blog, keywords, automatizaciones | `docs/seo/README.md` |

---

## 🤖 Comportamientos automáticos — no esperar instrucción

**Deploy**: Tras cualquier modificación de código, hacer `git add -A` + commit descriptivo + `git push origin main` sin esperar que el usuario lo pida. El hook Stop también lo hace automáticamente al terminar el turno.

**Blog**: Al crear cualquier archivo en `src/pages/blog/`, añadirlo **en la misma operación** al array manual en `src/pages/blog/index.astro`. No son dos pasos separados — es siempre un único commit.

**Quality check**: Después de un push que incluya páginas nuevas en `src/pages/`, ejecutar `node .github/scripts/check-page-quality.js` con `CHANGED_FILES` apuntando a esas páginas. El GitHub Action también lo hace en paralelo.

---

## 🛠️ Comandos

```bash
pnpm dev        # localhost:4321
pnpm build      # ./dist/
pnpm preview    # preview del build
astro check     # type checking
```

---

## 🔍 Verificación visual

Siempre usar **Playwright MCP** (`mcp__playwright__browser_*`) para confirmar cambios UI antes de dar la tarea por terminada. Nunca asumir cómo queda algo sin screenshot.

---

## 🚀 Deployment

Push a `main` → Vercel despliega automáticamente → aisecurity.es en minutos.
