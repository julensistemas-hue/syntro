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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nueva Solicitud de Migracion WordPress</h2>

            <p><strong>Plan seleccionado:</strong> ${planTexto}</p>
            ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
            <p><strong>Telefono:</strong> ${telefono}</p>
            <p><strong>URL WordPress:</strong> ${wordpress_url}</p>
            ${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ''}

            <hr>
            <p style="font-size: 12px; color: #666;">
              Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
            </p>
          </div>
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
      from: 'AI Security <onboarding@resend.dev>',
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
