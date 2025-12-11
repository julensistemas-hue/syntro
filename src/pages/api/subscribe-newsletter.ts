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

    // Email HTML para el usuario (confirmación)
    const userEmailHtml = `
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
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Bienvenido a AI Security
                      </h1>
                      <p style="margin: 10px 0 0; color: #f0f0f0; font-size: 16px;">
                        Te has suscrito correctamente al newsletter
                      </p>
                    </td>
                  </tr>

                  <!-- Content Card -->
                  <tr>
                    <td style="padding: 0 20px 20px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <tr>
                          <td style="padding: 40px;">
                            <p style="margin: 0 0 24px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                              Gracias por suscribirte a nuestro newsletter. A partir de ahora recibirás las últimas novedades sobre inteligencia artificial, ciberseguridad y tecnología.
                            </p>

                            <!-- Details Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
                              <tr>
                                <td style="padding: 20px;">
                                  <h2 style="margin: 0 0 16px; color: #1a202c; font-size: 18px; font-weight: 600;">
                                    Que esperar
                                  </h2>
                                  <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                                    <li>Articulos sobre IA y automatizacion empresarial</li>
                                    <li>Tutoriales de ciberseguridad y Wazuh</li>
                                    <li>Ofertas exclusivas en cursos y servicios</li>
                                    <li>Novedades del sector tecnologico</li>
                                  </ul>
                                </td>
                              </tr>
                            </table>

                            <p style="margin: 24px 0 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                              Si tienes alguna pregunta, no dudes en contactarnos.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background: rgba(255,255,255,0.05);">
                      <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px;">
                        <strong>AI Security</strong>
                      </p>
                      <p style="margin: 0; font-size: 13px;">
                        <a href="mailto:info@aisecurity.es" style="color: #ffffff; text-decoration: none;">info@aisecurity.es</a>
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

    const userTextFallback = `Bienvenido a AI Security

Gracias por suscribirte a nuestro newsletter.

Que esperar:
- Articulos sobre IA y automatizacion empresarial
- Tutoriales de ciberseguridad y Wazuh
- Ofertas exclusivas en cursos y servicios
- Novedades del sector tecnologico

Contacto: info@aisecurity.es
`;

    // Email HTML para admin (notificación)
    const adminEmailHtml = `
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

    const adminTextFallback = `Nueva Suscripcion al Newsletter

Email del suscriptor: ${email}

Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
`;

    // Enviar confirmación al usuario
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: email,
      subject: 'Bienvenido a AI Security - Suscripcion confirmada',
      html: userEmailHtml,
      text: userTextFallback,
    });

    // Enviar notificación al admin
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: 'info@aisecurity.es',
      subject: `Nueva suscripcion: ${email}`,
      html: adminEmailHtml,
      text: adminTextFallback,
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
