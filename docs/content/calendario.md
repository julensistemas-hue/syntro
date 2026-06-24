# Calendario editorial — AI Security

> Cadencia recomendada. Realista para una persona. Ajustar al ritmo real; mejor constante
> y sostenible que ambicioso y abandonado.

---

## Cadencia base (semanal)

| Frecuencia | Pieza ancla | Derivadas (del mismo tema) |
|------------|-------------|----------------------------|
| 1×/semana | **1 post de blog** (pilar 1 o 2, SEO/GEO) | Hilo X + post Medium de ese tema |
| 1×/semana | **1 hilo X** (pilar 3 o 4) | — |
| 2×/semana | **Comentar/aportar en Reddit** (no siempre post propio) | — |
| 1-2×/mes | **1 vídeo YouTube** (pilar 1/2/3) | Blog de apoyo + hilo + Medium |

> Principio "1 tema → muchos formatos": cada pieza ancla genera derivadas el mismo día o en
> los días siguientes, reutilizando el trabajo del `/contenido`.

## Rotación de pilares (para no monotematizar)

Semana A: P1 (caso empresa) · Semana B: P3 (técnico) · Semana C: P1 (caso empresa) ·
Semana D: P4 (conceptual). Intercalar P2 (Wazuh) ~1×/mes alineado con el canal existente.

## Mejores momentos (orientativo, validar con analítica)

- **Blog**: cualquier día; lo que importa es la indexación, no la hora.
- **X**: mañanas (ES) o tarde-noche (alcance EN/US). Probar y medir.
- **Reddit**: mañanas entre semana (US) para los subs grandes en EN.
- **YouTube**: publicar 1-2 días antes del pico de visualización del canal; revisar YT Studio.
- **Medium**: martes-jueves rinden algo mejor.

## Automatización / recordatorios (opcional)

Para recordatorios recurrentes se puede usar la skill `schedule` (cron de agentes) o
`/loop`. Ejemplo: un recordatorio semanal "elige la idea ✅ del banco y lanza `/contenido`".
No se programa publicación 100% automática porque el usuario supervisa todos los textos.

## Plantilla de planning mensual

```
Mes: ______
Objetivo del mes (leads / autoridad / SEO): ______
Tema destacado (vídeo): ______
Semana 1: [pilar] [idea del banco] → ancla: ____  derivadas: ____
Semana 2: ...
Semana 3: ...
Semana 4: ...
Revisión: métricas GSC/GA4/leads, qué funcionó, ajustar banco.
```
