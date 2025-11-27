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

    // Mapeo de planes para mejor presentación
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
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #3b82f6; margin-bottom: 5px; }
            .field-value { color: #4b5563; }
            .priority { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .plan-badge { display: inline-block; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Nueva Solicitud de Migración WordPress</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Un cliente está interesado en migrar su WordPress a código puro</p>
            </div>

            <div class="content">
              <div class="priority">
                <strong>⚡ Plan seleccionado:</strong> <span class="plan-badge">${planTexto}</span>
              </div>

              ${email ? `
              <div class="field">
                <div class="field-label">📧 Email</div>
                <div class="field-value"><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></div>
              </div>
              ` : ''}

              <div class="field">
                <div class="field-label">📱 Teléfono</div>
                <div class="field-value"><a href="tel:${telefono}" style="color: #3b82f6;">${telefono}</a></div>
              </div>

              <div class="field">
                <div class="field-label">🌐 URL WordPress Actual</div>
                <div class="field-value"><a href="${wordpress_url}" target="_blank" style="color: #3b82f6;">${wordpress_url}</a></div>
              </div>

              ${mensaje ? `
              <div class="field">
                <div class="field-label">💬 Mensaje del cliente</div>
                <div class="field-value" style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">${mensaje.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}

              <div class="footer">
                <p>Este email fue enviado automáticamente desde el formulario de migración WordPress de aisecurity.es</p>
                <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Nueva Solicitud de Migración WordPress - AI Security

Plan seleccionado: ${planTexto}

Información de contacto:
------------------------
${email ? `Email: ${email}` : ''}
Teléfono: ${telefono}

WordPress actual:
-----------------
URL: ${wordpress_url}

${mensaje ? `Mensaje del cliente:\n${mensaje}` : ''}

---
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
    `;

    // Enviar email
    const result = await resend.emails.send({
      from: 'AI Security <onboarding@resend.dev>',
      to: ['julen.sistemas@gmail.com'],
      subject: `🚀 Migración WordPress: ${planTexto}`,
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
        message: 'Solicitud enviada correctamente',
        id: result.data?.id,
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
