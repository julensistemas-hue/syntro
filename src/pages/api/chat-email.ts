import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, question, reply } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    // Send notification to admin via Resend
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: 'julen.sistemas@gmail.com',
      replyTo: email,
      subject: `Cliente quiere respuesta detallada - ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a5f; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Un cliente quiere que le respondas con mas detalle</h2>
          <p style="color: #666; font-size: 14px;">Fecha: ${now}</p>
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
            <strong style="color: #1e3a5f;">Email del cliente:</strong>
            <p style="color: #333; margin: 8px 0 0 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
          </div>
          <div style="background: #f0f4ff; border-left: 4px solid #6366f1; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
            <strong style="color: #1e3a5f;">Pregunta del cliente:</strong>
            <p style="color: #333; margin: 8px 0 0 0;">${question || '(sin pregunta registrada)'}</p>
          </div>
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
            <strong style="color: #166534;">Respuesta del asistente:</strong>
            <p style="color: #333; margin: 8px 0 0 0;">${reply || '(sin respuesta registrada)'}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #666; font-size: 13px;"><strong>Accion requerida:</strong> Responder a <a href="mailto:${email}" style="color: #2563eb;">${email}</a> con informacion detallada sobre su consulta.</p>
        </div>
      `,
      text: `Cliente quiere respuesta detallada\n\nFecha: ${now}\nEmail: ${email}\nPregunta: ${question || '(vacia)'}\nRespuesta del asistente: ${reply || '(vacia)'}\n\nResponder a: ${email}`,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat email API error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
