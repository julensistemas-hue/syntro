---
name: idea
description: Abre o retoma un tema de contenido de IA y lo refina iterativamente contigo (feedback, ángulos, datos) hasta tener una idea afilada y diferenciada, que se guarda en el banco de ideas. Úsalo al empezar a pensar un tema antes de producir contenido.
---

# /idea — Refinar un tema hasta que merezca producirse

Flujo **conversacional e iterativo** para convertir un tema vago en una idea afilada.
No produces el contenido final aquí: lo afilas y lo registras.

## Pasos

1. **Lee el contexto**: `docs/content/README.md`, `docs/content/estrategia.md`,
   `docs/content/banco-ideas.md`. Si el usuario retoma una idea existente, cárgala.

2. **Delega en el estratega**: usa el agente `content-strategist` para encuadrar (pilar,
   público, hueco), hacer research (WebSearch/WebFetch, `youtube-transcript`, `seo-specialist`)
   y proponer **2-3 ángulos** con una recomendación.

3. **Itera con el usuario**: presenta el feedback honesto (qué es genérico, qué ángulo es más
   fuerte, qué datos faltan) y **pregunta**. Repite hasta que el usuario esté conforme. No
   cierres a la primera: el valor está en el ida y vuelta.

4. **Aplica el filtro anti-hype**: la idea debe aportar algo que el contenido genérico no da
   (dato, caso real, límite honesto o modelo mental nuevo). Si no, sigue afilando.

5. **Cierra y guarda**: cuando la idea esté buena, **actualiza `docs/content/banco-ideas.md`**
   con una fila (estado 🔧 o ✅, pilar, plataformas objetivo, ángulo) usando el formato de
   salida del `content-strategist`.

## Importante
- Una idea por sesión de `/idea` (a menos que el usuario quiera lluvia de varias).
- No escribas el post/hilo/guion aquí — para eso está `/contenido`.
- Sé directo en el feedback. El usuario quiere co-crear, no aprobación automática.