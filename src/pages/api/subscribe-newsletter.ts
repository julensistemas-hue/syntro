import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

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
    const email = data.get('email')?.toString();

    // Validación
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El email es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email HTML simplificado
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nueva Suscripcion al Newsletter</h2>
            <p>Email del suscriptor: <strong>${email}</strong></p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nueva Suscripcion al Newsletter

Email del suscriptor: ${email}

Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar notificación via EmailRelay SMTP
    await transporter.sendMail({
      from: `${import.meta.env.SMTP_FROM_NAME} <${import.meta.env.SMTP_FROM_EMAIL}>`,
      to: 'info@aisecurity.es',
      subject: `Nueva suscripcion: ${email}`,
      html: emailHtml,
      text: emailText,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Suscripción exitosa'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error procesando suscripción:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la suscripción' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
