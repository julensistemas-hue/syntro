import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email invalido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email al usuario - TEXTO SIMPLE
    const userMessage = `Inscripcion Curso Wazuh

Gracias por inscribirte.

Detalles:
- Fecha: 20-22 Enero 2025
- Horario: 3 dias
- Modalidad: Online
- Precio: 100 euros

Te enviaremos los detalles de pago.

Contacto: info@aisecurity.es
`;

    // Enviar confirmación al usuario
    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: email,
      subject: 'Inscripcion Curso Wazuh',
      text: userMessage,
    });

    // Notificación al admin
    const adminMessage = `Nueva inscripcion al curso

Email: ${email}
Fecha: ${new Date().toLocaleString('es-ES')}
`;

    await resend.emails.send({
      from: 'AI Security <info@aisecurity.es>',
      to: 'julen.sistemas@gmail.com',
      replyTo: email,
      subject: 'Nueva inscripcion curso',
      text: adminMessage,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inscripcion confirmada'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar inscripcion' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
