# Archivos de Audio para Demo de Llamadas IA

Esta carpeta contiene los archivos de audio para los 3 escenarios de la demo interactiva de atención de llamadas.

## Estructura de carpetas

```
public/audio/
├── reservar/       # Escenario: Reservar una cita
├── modificar/      # Escenario: Modificar/Eliminar cita
└── pago/           # Escenario: Consulta sobre pago
```

## Archivos necesarios por escenario

### 📅 Escenario "Reservar una cita" (carpeta: reservar/)
- `ai_1.mp3` - "¡Hola! Bienvenido a Clínica Dental Dr. García. ¿En qué puedo ayudarte?"
- `user_1.mp3` - "Hola, quisiera reservar una cita"
- `ai_2.mp3` - "Por supuesto. ¿Qué día te vendría mejor?"
- `user_2.mp3` - "El próximo martes por la mañana"
- `ai_3.mp3` - "Perfecto. Tengo disponibilidad a las 10:00 y a las 11:30. ¿Cuál prefieres?"
- `user_3.mp3` - "A las 10:00 está bien"
- `ai_4.mp3` - "¡Excelente! He reservado tu cita para el martes a las 10:00. Te enviaré un SMS de confirmación. ¿Necesitas algo más?"

### ✏️ Escenario "Modificar/Eliminar cita" (carpeta: modificar/)
- `ai_1.mp3` - "Buenos días, Clínica Dental Dr. García. ¿En qué puedo ayudarle?"
- `user_1.mp3` - "Necesito modificar mi cita del jueves"
- `ai_2.mp3` - "Claro, déjame verificar. ¿Podría darme su nombre completo?"
- `user_2.mp3` - "Soy María González"
- `ai_3.mp3` - "Perfecto, María. Veo que tiene una cita el jueves a las 16:00. ¿Qué día le vendría mejor?"
- `user_3.mp3` - "El viernes por la tarde"
- `ai_4.mp3` - "Tengo disponibilidad el viernes a las 17:30. ¿Le viene bien?"
- `user_4.mp3` - "Sí, perfecto"
- `ai_5.mp3` - "Listo, he modificado su cita al viernes 17:30. Le enviaré una confirmación por SMS."

### 💳 Escenario "Consulta sobre pago" (carpeta: pago/)
- `ai_1.mp3` - "Clínica Dental Dr. García, ¿en qué puedo ayudarle?"
- `user_1.mp3` - "Quisiera saber cuánto dura un tratamiento de ortodoncia"
- `ai_2.mp3` - "El tratamiento de ortodoncia suele durar entre 12 y 24 meses, dependiendo del caso. ¿Le gustaría información sobre las formas de pago?"
- `user_2.mp3` - "Sí, ¿tienen opciones de financiación?"
- `ai_3.mp3` - "Sí, ofrecemos financiación sin intereses hasta 12 meses, y también aceptamos tarjetas de crédito y transferencias. ¿Le gustaría agendar una consulta gratuita para valoración?"
- `user_3.mp3` - "Sí, me interesa"
- `ai_4.mp3` - "Perfecto. ¿Qué día le vendría mejor para la consulta?"

## Notas importantes

1. **Formato de audio**: Los archivos deben estar en formato MP3
2. **Nombres de archivo**: Deben coincidir exactamente con los nombres indicados arriba
3. **Calidad recomendada**: 128kbps o superior para buena calidad
4. **Duración**: Los audios deben ser cortos y claros (máximo 10-15 segundos cada uno)

## Funcionamiento

- Los audios se reproducen automáticamente cuando aparece el texto correspondiente en la conversación
- Si un archivo de audio no existe, la demo seguirá funcionando pero sin sonido
- Los audios se detienen automáticamente cuando se cuelga la llamada
- Al cambiar de escenario en el selector, se reproduce automáticamente el nuevo escenario

## Cómo añadir los archivos

Simplemente arrastra y suelta tus archivos MP3 en las carpetas correspondientes con los nombres exactos indicados arriba.
