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

    // Email HTML elegante
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f9;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        Nueva Suscripcion al Newsletter
                      </h1>
                      <p style="margin: 12px 0 0; color: #d1fae5; font-size: 15px;">
                        Un nuevo suscriptor se ha unido
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <div style="padding: 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #065f46; font-size: 15px;">
                          <strong style="color: #047857;">Email del suscriptor:</strong><br>
                          <span style="font-size: 16px; font-weight: 600; color: #064e3b;">${email}</span>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 16px 16px;">
                      <p style="margin: 0; color: #64748b; font-size: 12px;">
                        Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailText = `
Nueva Suscripcion al Newsletter

Email del suscriptor: ${email}

Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar notificación via Resend
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: 'julen.sistemas@gmail.com',
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
