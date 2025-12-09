import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Configure EmailRelay SMTP transporter
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST || 'smtp1.s.ipzmarketing.com',
  port: parseInt(import.meta.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: import.meta.env.SMTP_USER || 'rbaknxqyoxkj',
    pass: import.meta.env.SMTP_PASSWORD || 'cpexfT8y5EjXw2ez',
  },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send confirmation email to user
    const fromEmail = import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es';
    const fromName = import.meta.env.SMTP_FROM_NAME || 'AI Security';

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: '✅ Inscripción Confirmada - Curso Intensivo de Wazuh',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0065ff 0%, #3b82f6 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px 20px;
              border: 1px solid #e9ecef;
              border-top: none;
              border-radius: 0 0 10px 10px;
            }
            .highlight {
              background: #f1f3f5;
              padding: 15px;
              border-left: 4px solid #0065ff;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #0065ff;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .info-box {
              background: #ebf7ff;
              border: 1px solid #3b82f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎓 ¡Bienvenido al Curso de Wazuh!</h1>
          </div>

          <div class="content">
            <p>Hola,</p>

            <p>Tu inscripción al <strong>Curso Práctico e Intensivo de Wazuh</strong> ha sido confirmada con éxito. ¡Estamos emocionados de tenerte con nosotros!</p>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #0065ff;">📅 Detalles del Curso</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Fechas:</strong> 7, 8 y 9 de Enero 2025</li>
                <li><strong>Horario:</strong> 09:00 - 18:00 (hora local)</li>
                <li><strong>Modalidad:</strong> 100% Online</li>
                <li><strong>Precio:</strong> €100</li>
              </ul>
            </div>

            <div class="highlight">
              <h3 style="margin-top: 0;">💳 Instrucciones de Pago</h3>
              <p>Para completar tu inscripción, realiza el pago de <strong>€100</strong> mediante:</p>

              <h4 style="margin: 15px 0 10px 0; color: #0065ff;">Opción 1: Transferencia Bancaria</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Titular:</strong> Julian Vergara Díaz</li>
                <li><strong>IBAN:</strong> ES52 0081 1389 1200 0114 0773</li>
                <li><strong>Concepto:</strong> Curso Wazuh - ${email}</li>
              </ul>

              <h4 style="margin: 15px 0 10px 0; color: #0065ff;">Opción 2: Bizum</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Teléfono:</strong> 722 67 48 74</li>
                <li><strong>Concepto:</strong> Curso Wazuh - ${email}</li>
              </ul>

              <p style="color: #ef4444; font-weight: bold;">⚠️ Importante: Incluye tu email en el concepto del pago</p>
            </div>

            <p>Una vez realizado el pago, envíanos el comprobante a <strong>info@aisecurity.es</strong> y te enviaremos:</p>
            <ul>
              <li>✅ Link de acceso a las clases online</li>
              <li>✅ Material del curso en PDF</li>
              <li>✅ Acceso al entorno de prácticas</li>
              <li>✅ Certificado de asistencia (al finalizar)</li>
            </ul>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #0065ff;">📚 Qué Aprenderás</h3>
              <p>Este curso intensivo cubre:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Instalación y configuración de Wazuh Manager</li>
                <li>Despliegue de agentes en Linux y Windows</li>
                <li>Monitorización de servidores, firewalls y NAS</li>
                <li>Creación de reglas y decoders personalizados</li>
                <li>Dashboards y cumplimiento normativo (ENS, PCI-DSS, GDPR)</li>
              </ul>
            </div>

            <h3>¿Tienes Preguntas?</h3>
            <p>Si necesitas ayuda o tienes alguna duda, escríbenos a <strong>info@aisecurity.es</strong> y te responderemos en menos de 24 horas.</p>

            <p>¡Nos vemos el 7 de Enero!</p>

            <p style="margin-top: 30px;">
              Saludos,<br>
              <strong>Equipo AI Security</strong>
            </p>
          </div>

          <div class="footer">
            <p>AI Security - Formación en Ciberseguridad</p>
            <p>aisecurity.es | info@aisecurity.es</p>
          </div>
        </body>
        </html>
      `,
      text: `
¡Bienvenido al Curso de Wazuh!

Tu inscripción al Curso Práctico e Intensivo de Wazuh ha sido confirmada.

DETALLES DEL CURSO:
- Fechas: 7, 8 y 9 de Enero 2025
- Horario: 09:00 - 18:00
- Modalidad: 100% Online
- Precio: €100

INSTRUCCIONES DE PAGO:
Realiza el pago de €100 mediante:

Opción 1: Transferencia Bancaria
- Titular: Julian Vergara Díaz
- IBAN: ES52 0081 1389 1200 0114 0773
- Concepto: Curso Wazuh - ${email}

Opción 2: Bizum
- Teléfono: 722 67 48 74
- Concepto: Curso Wazuh - ${email}

⚠️ Importante: Incluye tu email en el concepto del pago

Envía el comprobante a info@aisecurity.es para recibir:
✅ Link de acceso a las clases
✅ Material del curso
✅ Acceso al entorno de prácticas
✅ Certificado de asistencia

¿Tienes preguntas? Escríbenos a info@aisecurity.es

¡Nos vemos el 7 de Enero!

Equipo AI Security
aisecurity.es
      `,
    });

    // Send notification to admin
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: fromEmail,
      replyTo: email,
      subject: '🎓 Nueva Inscripción - Curso Wazuh',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0065ff 0%, #3b82f6 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px 20px;
              border: 1px solid #e9ecef;
              border-top: none;
              border-radius: 0 0 10px 10px;
            }
            .info {
              background: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #0065ff;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">🎓 Nueva Inscripción al Curso</h2>
          </div>

          <div class="content">
            <h3>Curso Práctico e Intensivo de Wazuh</h3>

            <div class="info">
              <p><strong>📧 Email del participante:</strong><br>${email}</p>
              <p><strong>📅 Fecha de inscripción:</strong><br>${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>

            <p><strong>Próximos pasos:</strong></p>
            <ul>
              <li>El participante recibirá un email con las instrucciones de pago</li>
              <li>Deberá realizar transferencia de €100</li>
              <li>Al recibir el comprobante, enviarle acceso al curso</li>
            </ul>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Este email se generó automáticamente desde la landing page del curso de Wazuh.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Nueva Inscripción - Curso Wazuh

Email del participante: ${email}
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

El participante recibirá un email con las instrucciones de pago.
      `,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inscripción procesada correctamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing inscription:', error);

    return new Response(
      JSON.stringify({
        error: 'Error al procesar la inscripción. Por favor, inténtalo de nuevo o contacta con info@aisecurity.es',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
