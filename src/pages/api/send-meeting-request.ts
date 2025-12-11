import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { createCalendarEvent, isValidTimeSlot, formatDate } from '../../lib/google-calendar';

// Configurar transporte SMTP con EmailRelay
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASSWORD,
  },
});

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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nueva Solicitud de Consulta</h2>

            ${calendarEvent ? `
            <p><strong>Reunion agendada:</strong> ${formatDate(meetingDate!)} a las ${selectedTime}h</p>
            ${calendarEvent.meetLink ? `<p>Enlace: ${calendarEvent.meetLink}</p>` : ''}
            ` : `
            <p><strong>Accion requerida:</strong> Contactar para agendar reunion</p>
            `}

            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Empresa:</strong> ${empresa || 'No especificada'}</p>
            <p><strong>Email:</strong> ${email || 'No proporcionado'}</p>
            <p><strong>Telefono:</strong> ${telefono || 'No proporcionado'}</p>
            <p><strong>Servicio de interes:</strong> ${servicioTexto}</p>
            <p><strong>Tamano de empresa:</strong> ${empleadosTexto}</p>
            ${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ''}
            <p><strong>Presupuesto estimado:</strong> ${presupuestoTexto}</p>

            <hr>
            <p style="font-size: 12px; color: #666;">
              Enviado desde aisecurity.es - ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nueva Solicitud de Consulta

Nombre: ${nombre}
Empresa: ${empresa || 'No especificada'}
Email: ${email || 'No proporcionado'}
Telefono: ${telefono || 'No proporcionado'}
Servicio de interes: ${servicioTexto}
Tamano de empresa: ${empleadosTexto}
Presupuesto estimado: ${presupuestoTexto}

${calendarEvent ? `Reunion agendada: ${formatDate(meetingDate!)} a las ${selectedTime}h
${calendarEvent.meetLink ? `Enlace: ${calendarEvent.meetLink}` : ''}` : ''}

${mensaje ? `Mensaje: ${mensaje}` : ''}

---
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar email via EmailRelay SMTP
    await transporter.sendMail({
      from: `${import.meta.env.SMTP_FROM_NAME} <${import.meta.env.SMTP_FROM_EMAIL}>`,
      to: 'info@aisecurity.es',
      replyTo: email || undefined,
      subject: `Nueva solicitud de consulta - ${nombre}${empresa ? ` (${empresa})` : ''}`,
      html: emailHtml,
      text: emailText,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: calendarEvent ? 'Reunión agendada correctamente' : 'Solicitud enviada correctamente',
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