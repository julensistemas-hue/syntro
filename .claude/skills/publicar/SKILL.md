---
name: publicar
description: Publica un pack de contenido ya aprobado por el usuario. Blog vía commit+push; Medium/Reddit/Twitter/YouTube vía browsermcp con la sesión del usuario, siempre confirmando antes de enviar. Actualiza el estado en el banco de ideas.
---

# /publicar — Publicar el pack aprobado

Publica las piezas que el usuario ya ha revisado y aprobado en `/contenido`.
**Nunca publicas sin la aprobación explícita del usuario para cada plataforma.**

## Pasos por plataforma

### Blog (aisecurity.es)
1. Confirma que el `.astro` está en `src/pages/blog/` y dado de alta en `index.astro`.
2. `astro check`. Luego `git add -A` + commit descriptivo + `git push origin main`
   (comportamiento estándar del proyecto). Vercel despliega.
3. Tras el push, ejecuta `node .github/scripts/check-page-quality.js` con `CHANGED_FILES`.

### Medium
1. `browsermcp` → `medium.com/new-story`. Pega título, subtítulo, cuerpo, 5 tags.
2. Configura canonical al blog si la pieza existe allí. Deja en **borrador**.
3. Muestra el borrador al usuario; publica solo tras su OK.

### Reddit
1. `browsermcp` → subreddit elegido; **lee sus reglas primero**.
2. Muestra al usuario subreddit + título + cuerpo. Publica solo tras OK. Aplica flair si toca.

### Twitter/X
1. `browsermcp` → `x.com`. Publica el hilo encadenando respuestas (o entrega para copy-paste).
2. Pon el link en el último tweet o primer comentario según el playbook. Confirma antes.

### YouTube
1. El **vídeo lo sube el usuario** manualmente.
2. Con `browsermcp` rellena en YouTube Studio: título, descripción (con Q&A), tags,
   capítulos y pinned comment. Deja listo para que el usuario publique.

## Al terminar
- Mueve la idea a la tabla **"Publicadas"** de `docs/content/banco-ideas.md` con fecha,
  plataformas y enlaces.

## Reglas
- Confirmación del usuario **por plataforma** antes de enviar nada externo.
- Publicar vía `browsermcp` requiere sesión iniciada en cada plataforma; si no la hay, avisa.
- Reddit y X son sensibles a la autopromoción: respeta los playbooks.