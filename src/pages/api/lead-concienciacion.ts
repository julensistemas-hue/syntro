import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, source } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El email es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'El formato del email no es válido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save lead to database
    const { error: dbError } = await supabase
      .from('concienciacion_leads')
      .insert({
        email,
        source: source || 'blog-concienciacion',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // If duplicate email, still send success (don't reveal it's already registered)
      if (dbError.code === '23505') {
        // Continue to send emails anyway
      } else {
        return new Response(
          JSON.stringify({ error: 'Error al guardar los datos' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Send emails using Resend
    try {
      const resend = new Resend(import.meta.env.RESEND_API_KEY);

      // Email to user
      await resend.emails.send({
        from: 'AI Security <info@aisecurity.es>',
        to: email,
        subject: '🔐 Acceso a la herramienta de concienciación',
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f8fafc;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); border-radius: 12px 12px 0 0;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                            ¡Gracias por tu interés!
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px;">
                          <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                            Hemos recibido tu solicitud para acceder a nuestra <strong>herramienta de evaluación de concienciación en ciberseguridad</strong>.
                          </p>

                          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">¿Qué incluye?</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #475569;">
                              <li style="margin-bottom: 8px;">Test de concienciación para empleados</li>
                              <li style="margin-bottom: 8px;">Gráficos de resultados por departamento</li>
                              <li style="margin-bottom: 8px;">Informe descargable para auditorías ISO 27001/ENS</li>
                            </ul>
                          </div>

                          <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                            En breve nos pondremos en contacto contigo para darte acceso y explicarte cómo funciona la herramienta.
                          </p>

                          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                              <strong>Nota:</strong> Mientras tanto, te recomendamos leer nuestros artículos sobre concienciación en ciberseguridad en <a href="https://aisecurity.es/blog" style="color: #7c3aed;">nuestro blog</a>.
                            </p>
                          </div>

                          <p style="margin: 0; color: #64748b; font-size: 14px;">
                            Si tienes alguna pregunta, responde a este email o escríbenos a <a href="mailto:info@aisecurity.es" style="color: #7c3aed;">info@aisecurity.es</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 30px; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
                          <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                            AI Security · Ciberseguridad e IA para empresas<br>
                            <a href="https://aisecurity.es" style="color: #7c3aed;">aisecurity.es</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        text: `¡Gracias por tu interés!

Hemos recibido tu solicitud para acceder a nuestra herramienta de evaluación de concienciación en ciberseguridad.

¿Qué incluye?
- Test de concienciación para empleados
- Gráficos de resultados por departamento
- Informe descargable para auditorías ISO 27001/ENS

En breve nos pondremos en contacto contigo para darte acceso y explicarte cómo funciona la herramienta.

Mientras tanto, te recomendamos leer nuestros artículos sobre concienciación en ciberseguridad en https://aisecurity.es/blog

Si tienes alguna pregunta, escríbenos a info@aisecurity.es

AI Security · Ciberseguridad e IA para empresas
https://aisecurity.es`,
      });

      // Notification email to admin
      await resend.emails.send({
        from: 'AI Security <info@aisecurity.es>',
        to: 'info@aisecurity.es',
        replyTo: email,
        subject: '🎯 Nuevo lead - Herramienta Concienciación',
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f8fafc;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); border-radius: 12px 12px 0 0;">
                          <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                            Nuevo Lead - Concienciación
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px;">
                          <div style="background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #065f46; font-size: 14px;">
                              <strong>Nuevo interesado</strong> en la herramienta de concienciación
                            </p>
                          </div>
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 12px; background-color: #f1f5f9; border-radius: 8px; margin-bottom: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 15px;">
                                  <strong style="color: #1e293b;">Email:</strong> ${email}
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 8px;"></td></tr>
                            <tr>
                              <td style="padding: 12px; background-color: #f1f5f9; border-radius: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 15px;">
                                  <strong style="color: #1e293b;">Origen:</strong> ${source || 'blog-concienciacion'}
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 8px;"></td></tr>
                            <tr>
                              <td style="padding: 12px; background-color: #f1f5f9; border-radius: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 15px;">
                                  <strong style="color: #1e293b;">Fecha:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        text: `Nuevo Lead - Herramienta Concienciación

Email: ${email}
Origen: ${source || 'blog-concienciacion'}
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
      });
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the request if email fails - lead is already saved
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud recibida correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lead capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};