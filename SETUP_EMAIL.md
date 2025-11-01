# Configuración del Sistema de Emails

Este proyecto utiliza **Resend** para enviar emails desde el formulario de solicitud de reunión.

## Pasos de configuración

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (100 emails/mes gratis)
3. Verifica tu email

### 2. Obtener la API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Dale un nombre como "AI Security - Production"
4. Selecciona los permisos: "Sending access"
5. Copia la API key (empieza con `re_`)

### 3. Configurar variables de entorno

#### Para desarrollo local:

Crea un archivo `.env` en la raíz del proyecto (ya existe):

```env
RESEND_API_KEY=re_tu_api_key_aqui
```

#### Para producción en Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Settings → Environment Variables
3. Agrega una nueva variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: tu API key de Resend
   - **Environment**: Production, Preview, Development (selecciona todos)
4. Guarda los cambios
5. Redeploy el proyecto para que tome efecto

### 4. Verificar dominio (Opcional pero recomendado)

Por defecto, Resend usa `onboarding@resend.dev` como remitente. Para usar tu propio dominio:

1. En Resend, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio (ejemplo: `aisecurity.es`)
4. Sigue las instrucciones para agregar los registros DNS:
   - SPF
   - DKIM
   - DMARC
5. Una vez verificado, actualiza el archivo de la API:

```typescript
// En: src/pages/api/send-meeting-request.ts
from: 'AI Security <noreply@aisecurity.es>', // Cambia esto
```

### 5. Probar el formulario

1. Inicia el servidor de desarrollo: `pnpm dev`
2. Ve a `http://localhost:3000/reunion`
3. Rellena el formulario
4. Verifica que llegue el email a `julen.sistemas@gmail.com`

## Estructura del proyecto

- **Formulario**: `src/components/meeting/MeetingRequest.astro`
- **API Route**: `src/pages/api/send-meeting-request.ts`
- **Variables de entorno**: `.env` (local) / Vercel Dashboard (producción)

## Email que se envía

El email incluye:

- ✅ Nombre del contacto
- ✅ Empresa
- ✅ Email y/o teléfono
- ✅ Servicio de interés
- ✅ Tamaño de la empresa
- ✅ Mensaje (opcional)
- ✅ Presupuesto estimado
- ✅ Fecha y hora de envío
- ✅ Formato HTML con diseño profesional

## Campos del formulario

### Obligatorios:
- **Nombre**: Siempre requerido
- **Email o Teléfono**: Al menos uno de los dos

### Opcionales:
- Empresa
- Servicio de interés
- Tamaño de empresa
- Mensaje
- Presupuesto

## Solución de problemas

### Error: "RESEND_API_KEY is not defined"
- Verifica que el archivo `.env` existe
- Verifica que la variable está configurada correctamente
- Reinicia el servidor de desarrollo

### No llegan los emails
- Verifica que la API key es válida en el dashboard de Resend
- Revisa los logs de Resend para ver si hay errores
- Verifica que el email destino (`julen.sistemas@gmail.com`) es correcto

### Error 500 en producción
- Verifica que la variable de entorno está configurada en Vercel
- Redeploy el proyecto después de agregar la variable
- Revisa los logs de Vercel: Project → Deployments → [último deployment] → View Function Logs

## Cambiar el email destino

Para cambiar el email donde llegan las solicitudes, edita:

```typescript
// src/pages/api/send-meeting-request.ts línea ~174
to: ['julen.sistemas@gmail.com'], // Cambia este email
```

Puedes agregar múltiples destinatarios:

```typescript
to: ['julen.sistemas@gmail.com', 'otro@email.com'],
```

## Límites del plan gratuito de Resend

- **100 emails/mes** gratis
- Si necesitas más, puedes upgradear a:
  - **Growth**: €20/mes - 50,000 emails
  - **Business**: €80/mes - 100,000 emails

## Próximos pasos

1. ✅ Configurar API key de Resend
2. ✅ Probar el formulario en local
3. ✅ Configurar variable de entorno en Vercel
4. ✅ Hacer deploy y probar en producción
5. 🔄 (Opcional) Verificar dominio personalizado
6. 🔄 (Opcional) Agregar email de confirmación al usuario