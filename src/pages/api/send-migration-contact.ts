import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const empresa = data.empresa;
    const email = data.email;
    const telefono = data.telefono;
    const wordpress_url = data.wordpress_url;
    const mensaje = data.mensaje;
    const plan = data.plan;

    // Validación básica
    if (!telefono || !wordpress_url) {
      return new Response(
        JSON.stringify({ error: 'Teléfono y URL de WordPress son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mapeo de planes
    const planesMap: Record<string, string> = {
      'landing': 'Landing Page (450€)',
      'corporativa': 'Web Corporativa (800€)',
      'personalizada': 'Página Personalizada (1,000€ - 2,000€)',
    };

    const planTexto = plan ? planesMap[plan] || plan : 'No especificado';

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
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        Solicitud Migracion WordPress
                      </h1>
                      <p style="margin: 12px 0 0; color: #ede9fe; font-size: 15px;">
                        Nueva solicitud de migracion de sitio web
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Plan Box -->
                      <div style="padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 24px;">
                        <p style="margin: 0; color: #6b21a8; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Plan Seleccionado
                        </p>
                        <p style="margin: 8px 0 0; color: #581c87; font-size: 18px; font-weight: 700;">
                          ${planTexto}
                        </p>
                      </div>

                      <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                        Informacion de Contacto
                      </h2>

                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        ${email ? `
                        <tr>
                          <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
                            <p style="margin: 0; color: #475569; font-size: 14px;">
                              <strong style="color: #1e293b;">Email:</strong> ${email}
                            </p>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0;">
                            <p style="margin: 0; color: #475569; font-size: 14px;">
                              <strong style="color: #1e293b;">Telefono:</strong> ${telefono}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <p style="margin: 0; color: #475569; font-size: 14px;">
                              <strong style="color: #1e293b;">URL WordPress:</strong><br>
                              <a href="${wordpress_url}" style="color: #8b5cf6; text-decoration: none; word-break: break-all;">${wordpress_url}</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                      ${mensaje ? `
                      <div style="margin-top: 24px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #713f12; font-weight: 600; font-size: 14px;">Mensaje adicional:</p>
                        <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 1.6;">${mensaje}</p>
                      </div>
                      ` : ''}
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
Nueva Solicitud de Migracion WordPress

Plan seleccionado: ${planTexto}
${email ? `Email: ${email}` : ''}
Telefono: ${telefono}
URL WordPress: ${wordpress_url}
${mensaje ? `Mensaje: ${mensaje}` : ''}

Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar email via Resend
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: 'julen.sistemas@gmail.com',
      replyTo: email || undefined,
      subject: `Migracion WordPress: ${planTexto}`,
      html: emailHtml,
      text: emailText,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud enviada correctamente'
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
