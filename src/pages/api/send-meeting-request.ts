import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createCalendarEvent, isValidTimeSlot, formatDate } from '../../lib/google-calendar';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const nombre = data.get('nombre')?.toString();
    const empresa = data.get('empresa')?.toString();
    const email = data.get('email')?.toString();
    const telefono = data.get('telefono')?.toString();
    const servicios = data.get('servicios')?.toString();
    const empleados = data.get('empleados')?.toString();
    const mensaje = data.get('mensaje')?.toString();
    const presupuesto = data.get('presupuesto')?.toString();
    const selectedDate = data.get('selectedDate')?.toString();
    const selectedTime = data.get('selectedTime')?.toString();

    // Validación básica: nombre es obligatorio, y al menos email o teléfono
    if (!nombre) {
      return new Response(
        JSON.stringify({ error: 'El nombre es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email && !telefono) {
      return new Response(
        JSON.stringify({ error: 'Debes proporcionar al menos un email o teléfono' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate date and time if provided
    if (selectedDate && selectedTime) {
      if (!isValidTimeSlot(selectedTime)) {
        return new Response(
          JSON.stringify({ error: 'Horario seleccionado no válido' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Mapeo de servicios para mejor presentación
    const serviciosMap: Record<string, string> = {
      'chatbot': 'Chatbot Inteligente',
      'gestor-documental': 'Gestor Documental IA',
      'gestor-citas': 'Gestor de Citas IA',
      'atencion-llamadas': 'Atención de Llamadas IA',
      'automatizacion': 'Automatización de Procesos',
      'consultoria': 'Consultoría Personalizada',
      'multiple': 'Múltiples servicios'
    };

    const empleadosMap: Record<string, string> = {
      '1-10': '1-10 empleados',
      '11-50': '11-50 empleados',
      '51-200': '51-200 empleados',
      '201-500': '201-500 empleados',
      '500+': 'Más de 500 empleados'
    };

    const presupuestoMap: Record<string, string> = {
      '5k-15k': '€5,000 - €15,000',
      '15k-50k': '€15,000 - €50,000',
      '50k-100k': '€50,000 - €100,000',
      '100k+': 'Más de €100,000',
      'no-sure': 'No estoy seguro'
    };

    // Construir el contenido del email
    const servicioTexto = servicios ? serviciosMap[servicios] || servicios : 'No especificado';
    const empleadosTexto = empleados ? empleadosMap[empleados] || empleados : 'No especificado';
    const presupuestoTexto = presupuesto ? presupuestoMap[presupuesto] || presupuesto : 'No especificado';

    // Create Google Calendar event if date and time are selected
    let calendarEvent: { eventId: string; meetLink?: string } | null = null;
    let meetingDate: Date | null = null;

    if (selectedDate && selectedTime) {
      try {
        meetingDate = new Date(selectedDate);
        calendarEvent = await createCalendarEvent({
          name: nombre,
          email: email,
          phone: telefono,
          company: empresa,
          date: meetingDate,
          timeSlot: selectedTime,
          message: mensaje,
        });
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Continue without calendar event - don't fail the whole request
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #667eea; margin-bottom: 5px; }
            .field-value { color: #4b5563; }
            .priority { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Nueva Solicitud de Consulta</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Has recibido una nueva solicitud desde el formulario de contacto</p>
            </div>

            <div class="content">
              ${calendarEvent ? `
              <div class="priority" style="background: #d1fae5; border-left-color: #10b981;">
                <strong>✅ Reunión agendada:</strong> ${formatDate(meetingDate!)} a las ${selectedTime}h
                ${calendarEvent.meetLink ? `<br><a href="${calendarEvent.meetLink}" style="color: #059669; text-decoration: none;">🔗 Enlace de Google Meet</a>` : ''}
              </div>
              ` : `
              <div class="priority">
                <strong>⚡ Acción requerida:</strong> Contactar para agendar reunión
              </div>
              `}

              <div class="field">
                <div class="field-label">👤 Nombre</div>
                <div class="field-value">${nombre}</div>
              </div>

              <div class="field">
                <div class="field-label">🏢 Empresa</div>
                <div class="field-value">${empresa || 'No especificada'}</div>
              </div>

              <div class="field">
                <div class="field-label">📧 Email</div>
                <div class="field-value">${email || 'No proporcionado'}</div>
              </div>

              <div class="field">
                <div class="field-label">📱 Teléfono</div>
                <div class="field-value">${telefono || 'No proporcionado'}</div>
              </div>

              <div class="field">
                <div class="field-label">🤖 Servicio de interés</div>
                <div class="field-value">${servicioTexto}</div>
              </div>

              <div class="field">
                <div class="field-label">👥 Tamaño de empresa</div>
                <div class="field-value">${empleadosTexto}</div>
              </div>

              ${mensaje ? `
              <div class="field">
                <div class="field-label">💬 Mensaje</div>
                <div class="field-value">${mensaje}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="field-label">💰 Presupuesto estimado</div>
                <div class="field-value">${presupuestoTexto}</div>
              </div>

              <div class="footer">
                <p>Este email fue enviado automáticamente desde el formulario de solicitud de consulta de aisecurity.es</p>
                <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nueva Solicitud de Consulta - AI Security

Información de contacto:
------------------------
Nombre: ${nombre}
Empresa: ${empresa || 'No especificada'}
Email: ${email || 'No proporcionado'}
Teléfono: ${telefono || 'No proporcionado'}

Detalles del servicio:
---------------------
Servicio de interés: ${servicioTexto}
Tamaño de empresa: ${empleadosTexto}
Presupuesto estimado: ${presupuestoTexto}

${calendarEvent ? `
Reunión agendada:
----------------
Fecha: ${formatDate(meetingDate!)} a las ${selectedTime}h
${calendarEvent.meetLink ? `Enlace Google Meet: ${calendarEvent.meetLink}` : ''}
ID del evento: ${calendarEvent.eventId}
` : ''}

${mensaje ? `Mensaje:\n${mensaje}` : ''}

---
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar email
    const result = await resend.emails.send({
      from: 'AI Security <onboarding@resend.dev>', // Cambiarás esto cuando configures tu dominio
      to: ['julen.sistemas@gmail.com'], // Cambiado a email verificado en Resend (en desarrollo)
      subject: `🎯 Nueva solicitud de consulta - ${nombre} (${empresa || 'Empresa no especificada'})`,
      html: emailHtml,
      text: emailText,
      replyTo: email || undefined,
    });

    if (result.error) {
      console.error('Error enviando email:', result.error);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: calendarEvent ? 'Reunión agendada correctamente' : 'Solicitud enviada correctamente',
        id: result.data?.id,
        calendarEventId: calendarEvent?.eventId,
        meetLink: calendarEvent?.meetLink
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error procesando solicitud:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};