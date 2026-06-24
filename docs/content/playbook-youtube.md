# Playbook — YouTube

> Pack **guionizado completo**. Lo ejecuta `youtube-scriptwriter`.
> La subida del vídeo es manual (el usuario graba/renderiza). Generamos todo lo demás.

---

## Público y objetivo

Mixto: PyME que quiere ver el "cómo" + técnicos. Objetivo: **autoridad** + leads (embudo a
`/wazuh`, `/curso-wazuh`, aisecurity.es). Pilares 1, 2, 3.

## Qué entrega el pack (todo en ES + EN)

1. **Guion palabra por palabra** con marcas de tiempo aproximadas y notas de B-roll/pantalla.
2. **Título** SEO (≤ 60 chars, keyword + beneficio o curiosidad honesta).
3. **Descripción** optimizada (primeras 2 líneas = gancho + keyword; luego resumen Q&A para
   GEO; timestamps; links; CTA).
4. **Tags** (10-15).
5. **Timestamps / capítulos** (mejoran retención y SEO).
6. **Concepto de miniatura** (texto grande 3-4 palabras + idea visual; alto contraste).
7. **Pinned comment** (pregunta para fomentar comentarios + link CTA).

## Estructura del guion (retención es todo)

- **0-15s — Hook.** Decir QUÉ van a conseguir y por qué quedarse. Sin intro larga, sin
  "hola, bienvenidos a otro vídeo". Mostrar el resultado final primero si se puede.
- **15-45s — Contexto/promesa.** El problema real + qué van a aprender exactamente.
- **Cuerpo — pasos/demostración.** En pantalla, no hablando a cámara sin más. Cada sección
  con micro-hook ("y aquí viene lo importante…").
- **Honestidad** (sello de la casa): qué NO hace bien, cuándo no usarlo.
- **Cierre + CTA único.** "Si quieres implementar esto en tu empresa: aisecurity.es" o
  suscríbete. Tarjeta al siguiente vídeo.

## SEO YouTube + GEO

- Keyword en título, primeras palabras de la descripción y dicha en voz (la transcripción
  se indexa).
- Descripción con bloque Q&A (regla GEO): "¿Qué es X? …  ¿Cómo se hace? …" → citable.
- Timestamps con preguntas: "01:20 ¿Cómo configurar…?".
- Research previo: usar MCP `youtube-transcript` para analizar vídeos competidores del tema
  (qué cubren, qué les falta) y diferenciarse.

## Formato del guion (para que sea grabable)

```
[00:00 · HOOK · pantalla: resultado final]
NARRACIÓN: "..."

[00:15 · CONTEXTO · cámara]
NARRACIÓN: "..."

[00:45 · PASO 1 · screencast: terminal]
NARRACIÓN: "..."
NOTA B-ROLL: mostrar el comando X ejecutándose
...
```

## Faceless / AI-video (opcional)

Si el usuario opta por vídeo sin cara: el guion sirve igual para voz IA + screencast/capturas.
Indicar en notas qué se muestra en pantalla en cada bloque. El render lo hace el usuario.

## Publicación (parcialmente manual)

- El **vídeo** lo sube el usuario manualmente a YouTube Studio.
- Vía `browsermcp` se puede **rellenar** título, descripción, tags, capítulos y pinned
  comment en Studio una vez subido el archivo, y dejar todo listo para su revisión.

## Checklist
- [ ] Hook en los primeros 15s con resultado/promesa.
- [ ] Guion completo con notas de pantalla.
- [ ] Título + descripción (con Q&A) + tags + timestamps + miniatura + pinned.
- [ ] Sección de honestidad/límites.
- [ ] 1 CTA al cierre.
- [ ] ES + EN.
