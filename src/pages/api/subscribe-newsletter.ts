import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

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

    // Email HTML para notificarte
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
            .email-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0; }
            .email-value { font-size: 18px; font-weight: 600; color: #667eea; word-break: break-all; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Nueva Suscripción al Newsletter</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Alguien se ha suscrito a tu boletín de noticias</p>
            </div>

            <div class="content">
              <p style="margin-top: 0;">Has recibido una nueva suscripción:</p>

              <div class="email-box">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Email del suscriptor
                </div>
                <div class="email-value">${email}</div>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                💡 <strong>Próximos pasos:</strong><br>
                • Agrega este email a tu lista de correos<br>
                • Envía un email de bienvenida<br>
                • Programa contenido relevante sobre IA
              </p>

              <div class="footer">
                <p>Este email fue enviado automáticamente desde el formulario de suscripción de aisecurity.es</p>
                <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nueva Suscripción al Newsletter - AI SECURITY

Email del suscriptor: ${email}

Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

---
Próximos pasos:
- Agrega este email a tu lista de correos
- Envía un email de bienvenida
- Programa contenido relevante sobre IA
    `;

    // Enviar notificación al administrador
    const result = await resend.emails.send({
      from: 'AI Security Newsletter <onboarding@resend.dev>',
      to: ['info@aisecurity.es'],
      subject: `📧 Nueva suscripción: ${email}`,
      html: emailHtml,
      text: emailText,
    });

    if (result.error) {
      console.error('Error enviando email:', result.error);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la suscripción' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Suscripción exitosa',
        id: result.data?.id
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