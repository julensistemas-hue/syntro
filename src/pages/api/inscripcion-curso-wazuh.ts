import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Configure EmailRelay SMTP transporter
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

    const fromEmail = import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es';
    const fromName = import.meta.env.SMTP_FROM_NAME || 'AI Security';

    // Email al usuario - SOLO TEXTO PLANO
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

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Inscripcion Curso Wazuh',
      text: userMessage,
    });

    // Email al admin - SOLO TEXTO PLANO
    const adminMessage = `Nueva inscripcion al curso

Email: ${email}
Fecha: ${new Date().toLocaleString('es-ES')}
`;

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: fromEmail,
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
