# Configuración del Sistema de Reservas con Google Calendar

Este documento explica cómo configurar el sistema de reservas integrado con Google Calendar para la página `/reunion`.

## Características del Sistema

- **Verificación en tiempo real** de disponibilidad en tu Google Calendar
- **Creación automática** de eventos cuando alguien reserva una reunión
- **Google Meet automático** incluido en cada reunión
- **Email de confirmación** con todos los detalles
- **Horarios predefinidos**:
  - 10:00 - 11:00
  - 11:00 - 12:00
  - 15:00 - 16:00
  - 19:00 - 20:00
- **Lunes a viernes** (excluye fines de semana automáticamente)
- **Zona horaria**: Europe/Madrid

## Configuración Paso a Paso

### 1. Crear Service Account en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita la Google Calendar API:
   - Menú → "APIs y servicios" → "Biblioteca"
   - Busca "Google Calendar API"
   - Clic en "Habilitar"

4. Crea una Service Account:
   - Menú → "APIs y servicios" → "Credenciales"
   - Clic en "Crear credenciales" → "Cuenta de servicio"
   - Nombre: `aisecurity-calendar` (o el que prefieras)
   - Clic en "Crear y continuar"
   - No necesitas asignar roles → Clic en "Continuar"
   - Clic en "Listo"

5. Genera y descarga las credenciales:
   - En la lista de Service Accounts, haz clic en la que acabas de crear
   - Ve a la pestaña "Claves"
   - Clic en "Agregar clave" → "Crear clave nueva"
   - Selecciona formato **JSON**
   - Se descargará un archivo JSON con las credenciales

### 2. Compartir tu Google Calendar

1. Abre [Google Calendar](https://calendar.google.com)
2. En "Mis calendarios", haz clic en los 3 puntos de tu calendario principal
3. Selecciona "Configuración y compartir"
4. Baja hasta "Compartir con usuarios específicos"
5. Clic en "Agregar personas"
6. Pega el email de la service account:
   - Lo encuentras en el archivo JSON descargado
   - Campo: `client_email`
   - Ejemplo: `aisecurity-calendar@proyecto-123456.iam.gserviceaccount.com`
7. Selecciona permisos: **"Hacer cambios en eventos"**
8. Clic en "Enviar"

### 3. Configurar Variables de Entorno

Abre el archivo `.env` en la raíz del proyecto y añade estas variables:

```env
# Google Calendar Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTuClavePrivadaAqui\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=tu-email@gmail.com
```

**Cómo obtener cada variable del archivo JSON descargado:**

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Campo `client_email`
- `GOOGLE_PRIVATE_KEY`: Campo `private_key` (mantén los `\n` y las comillas)
- `GOOGLE_CALENDAR_ID`: Tu email de Google Calendar (normalmente tu email personal)

**IMPORTANTE**: La `GOOGLE_PRIVATE_KEY` debe estar entre comillas dobles y mantener los saltos de línea `\n`.

Ejemplo completo:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=aisecurity-calendar@mi-proyecto-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=julen.sistemas@gmail.com
```

### 4. Configurar Variables en Vercel (Producción)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Settings → Environment Variables
3. Añade las 3 variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_CALENDAR_ID`
4. Asegúrate de seleccionar los entornos: Production, Preview, Development
5. Guarda los cambios
6. **Redeploy** el proyecto para aplicar las variables

## Personalización

### Cambiar Horarios Disponibles

Edita el archivo `src/lib/google-calendar.ts`:

```typescript
const AVAILABLE_SLOTS = [
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '15:00', end: '16:00' },
  { start: '19:00', end: '20:00' },
];
```

### Cambiar Duración de las Reuniones

En el mismo archivo:

```typescript
const MEETING_DURATION_MINUTES = 60; // Cambiar a 30, 45, 90, etc.
```

### Cambiar Zona Horaria

```typescript
const TIMEZONE = 'Europe/Madrid'; // Cambiar a tu zona horaria
```

### Habilitar Fines de Semana

Edita `src/lib/google-calendar.ts`, función `getNextAvailableDates`:

```typescript
// Comentar o eliminar estas líneas:
// if (dayOfWeek !== 0 && dayOfWeek !== 6) {
//   dates.push(new Date(currentDate));
// }

// Reemplazar por:
dates.push(new Date(currentDate));
```

### Cambiar Días de Antelación

En `src/lib/google-calendar.ts`:

```typescript
export function getNextAvailableDates(days: number = 30): Date[] {
  // Cambiar el 30 por el número de días que quieras
}
```

## Archivos del Sistema

### Creados/Modificados

- `src/lib/google-calendar.ts` - Utilidades para Google Calendar API
- `src/pages/api/check-availability.ts` - API para verificar disponibilidad
- `src/pages/api/send-meeting-request.ts` - API actualizada para crear eventos
- `src/components/meeting/MeetingRequest.astro` - Formulario con selector de fecha/hora

### Dependencias Añadidas

- `googleapis` (v164.1.0) - Cliente oficial de Google APIs

## Pruebas

### Prueba Local

1. Asegúrate de que las variables de entorno están en `.env`
2. Ejecuta el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
3. Visita http://localhost:4321/reunion
4. Selecciona una fecha futura (lunes a viernes)
5. Verifica que se muestren los horarios disponibles
6. Selecciona un horario y completa el formulario
7. Verifica que:
   - Se crea el evento en tu Google Calendar
   - Recibes el email de confirmación
   - El email incluye el enlace de Google Meet

### Prueba en Producción

1. Asegúrate de que las variables están configuradas en Vercel
2. Redeploy el proyecto
3. Visita https://tu-dominio.com/reunion
4. Realiza una prueba de reserva completa

## Solución de Problemas

### Error: "Missing Google Calendar credentials"

- Verifica que las 3 variables de entorno están configuradas
- Verifica que `GOOGLE_PRIVATE_KEY` tiene las comillas y los `\n`
- En producción, asegúrate de haber redeployado después de añadir las variables

### Error: "Failed to check calendar availability"

- Verifica que compartiste el calendar con el email de la service account
- Verifica que diste permisos de "Hacer cambios en eventos"
- Verifica que el `GOOGLE_CALENDAR_ID` es correcto (tu email de Google Calendar)

### No aparecen horarios disponibles

- Verifica que la fecha seleccionada no es fin de semana
- Verifica que tu calendario no tiene eventos en esos horarios
- Revisa la consola del navegador para errores de JavaScript

### El evento se crea pero sin Google Meet

- Verifica que la API de Google Calendar está habilitada
- Verifica que el `conferenceDataVersion: 1` está en el código
- Algunos calendarios corporativos pueden tener Meet deshabilitado

### Email no llega

- Verifica que la variable `RESEND_API_KEY` está configurada
- Verifica que el email de destino en `send-meeting-request.ts` es correcto
- Revisa los logs de Vercel para errores de Resend

## Seguridad

**IMPORTANTE**:
- **NUNCA** commitees el archivo JSON de credenciales a Git
- **NUNCA** expongas las variables de entorno públicamente
- El archivo `.env` está en `.gitignore` para proteger las credenciales
- En producción, usa las variables de entorno de Vercel

## Próximos Pasos (Mejoras Futuras)

- [ ] Recordatorios automáticos 24h antes de la reunión
- [ ] Opción de cancelar/reprogramar desde un enlace único
- [ ] Soporte para múltiples tipos de reunión (30min, 60min)
- [ ] Dashboard para ver todas las reuniones programadas
- [ ] Integración con WhatsApp para notificaciones
- [ ] Sincronización bidireccional (detectar cancelaciones en Calendar)

## Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs de Vercel en el dashboard
3. Verifica que todas las credenciales son correctas
4. Consulta la [documentación oficial de Google Calendar API](https://developers.google.com/calendar/api/v3/reference)

---

**Configurado por**: Claude Code (claude.ai/code)
**Fecha**: 2025-11-04
**Versión**: 1.0
