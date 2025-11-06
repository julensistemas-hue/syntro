# Solución de Problemas - Google Calendar

## Problema: "No funciona la conexión con Calendar"

### Causa Probable
El calendario "reservas reunion aisecurity.es" es un calendario secundario, no el principal. Necesitas obtener su ID específico.

### Solución Paso a Paso

#### 1. Obtener el ID del Calendario

1. Ve a [Google Calendar](https://calendar.google.com)
2. En la barra lateral izquierda, busca el calendario "reservas reunion aisecurity.es"
3. Haz clic en los 3 puntos al lado del nombre → "Configuración y compartir"
4. Baja hasta la sección **"Integrar calendario"**
5. Copia el **"ID del calendario"**
   - Debería verse algo como: `c_xxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com`
   - O algo como: `xxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com`

#### 2. Actualizar el .env

Edita el archivo `.env` y reemplaza:

```env
GOOGLE_CALENDAR_ID=julen.sistemas@gmail.com
```

Por:

```env
GOOGLE_CALENDAR_ID=el_id_que_copiaste@group.calendar.google.com
```

#### 3. Verificar Permisos

Asegúrate de que compartiste el calendario con la service account:

1. En la configuración del calendario "reservas reunion aisecurity.es"
2. Sección "Compartir con usuarios específicos"
3. Debe estar añadido: `aisecurity-calenda@julensistemas.iam.gserviceaccount.com`
4. Con permisos: **"Hacer cambios en eventos"**

## Verificar la Configuración

### Opción 1: Usar el Calendario Principal

Si prefieres usar tu calendar principal (`julen.sistemas@gmail.com`):

1. Comparte ese calendario con: `aisecurity-calenda@julensistemas.iam.gserviceaccount.com`
2. Asegúrate de que `.env` tiene: `GOOGLE_CALENDAR_ID=julen.sistemas@gmail.com`

### Opción 2: Usar el Calendario Secundario

Si quieres usar "reservas reunion aisecurity.es":

1. Obtén su ID desde Google Calendar (paso 1 arriba)
2. Comparte ESE calendario con la service account
3. Actualiza `.env` con el ID completo

## Probar la Conexión

### Test Local

1. Reinicia el servidor de desarrollo:
   ```bash
   # Ctrl+C para parar
   pnpm dev
   ```

2. Ve a http://localhost:4321/reunion

3. Selecciona una fecha

4. Deberías ver los horarios disponibles:
   - 10:00 - 12:00
   - 12:00 - 14:00
   - 15:00 - 17:00
   - 19:00 - 21:00

5. Si ves un error, abre la consola del navegador (F12) y busca mensajes de error

### Errores Comunes

#### Error: "Missing Google Calendar credentials"
- Las variables de entorno no están configuradas
- Asegúrate de que el archivo `.env` existe y tiene las 3 variables

#### Error: "Failed to check calendar availability"
- El calendario no está compartido con la service account
- El ID del calendario es incorrecto
- La API de Google Calendar no está habilitada

#### Error: "Not Found" o "404"
- El ID del calendario es incorrecto
- Verifica que copiaste el ID completo, incluyendo `@group.calendar.google.com`

## Logs de Depuración

Si sigues teniendo problemas, añade logs temporalmente:

1. Edita `src/lib/google-calendar.ts`

2. En la función `getAvailableSlots`, añade después de la línea 43:

```typescript
console.log('Calendar ID:', calendarId);
console.log('Service Account Email:', serviceAccountEmail);
```

3. Reinicia el servidor

4. Abre la consola del navegador (F12)

5. Intenta seleccionar una fecha

6. Verás en la consola del servidor (terminal) los valores

## Resumen Rápido

**Para calendar secundario "reservas reunion aisecurity.es":**

```bash
# 1. Obtén el ID desde Google Calendar → Configuración → Integrar calendario
# 2. Edita .env:
GOOGLE_CALENDAR_ID=c_xxxxxxxxxx@group.calendar.google.com

# 3. Comparte el calendario con:
# aisecurity-calenda@julensistemas.iam.gserviceaccount.com
# Permisos: "Hacer cambios en eventos"

# 4. Reinicia servidor
pnpm dev
```

**Para calendar principal:**

```bash
# 1. Edita .env (ya está configurado):
GOOGLE_CALENDAR_ID=julen.sistemas@gmail.com

# 2. Comparte TU calendario principal con:
# aisecurity-calenda@julensistemas.iam.gserviceaccount.com
# Permisos: "Hacer cambios en eventos"

# 3. Reinicia servidor
pnpm dev
```

## ¿Necesitas más ayuda?

Si después de seguir estos pasos sigue sin funcionar:

1. Verifica que la API de Google Calendar está habilitada:
   - https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=julensistemas

2. Revisa los logs del servidor (terminal donde ejecutaste `pnpm dev`)

3. Revisa la consola del navegador (F12 → Console)

4. Comparte los mensajes de error específicos que veas

---

**Nota**: Después de cambiar el `.env`, SIEMPRE reinicia el servidor de desarrollo para que los cambios tengan efecto.
