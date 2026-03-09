import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          full_name: name || '',
        },
      },
    });

    if (error) {
      console.error('Registration error:', error.message);

      // Handle specific errors
      if (error.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email ya está registrado. ¿Quieres iniciar sesión?' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al crear la cuenta. Por favor, inténtalo de nuevo.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // The trigger in the database will automatically create the course_user entry

    // Send notification email to admin using Resend
    try {
      const resend = new Resend(import.meta.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'AI Security <info@aisecurity.es>',
        to: 'info@aisecurity.es',
        replyTo: email,
        subject: 'Nuevo registro - Curso Wazuh',
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
                        <td style="padding: 30px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px 12px 0 0;">
                          <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                            Nuevo Registro - Curso Wazuh
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px;">
                          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                              <strong>Pendiente de pago</strong> - El usuario aun no ha completado el pago.
                            </p>
                          </div>
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 12px; background-color: #f1f5f9; border-radius: 8px; margin-bottom: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 15px;">
                                  <strong style="color: #1e293b;">Nombre:</strong> ${name || 'No proporcionado'}
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 8px;"></td></tr>
                            <tr>
                              <td style="padding: 12px; background-color: #f1f5f9; border-radius: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 15px;">
                                  <strong style="color: #1e293b;">Email:</strong> ${email}
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0;">
                                <p style="margin: 0; color: #64748b; font-size: 14px;">
                                  <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
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
        text: `Nuevo registro - Curso Wazuh

Nombre: ${name || 'No proporcionado'}
Email: ${email}
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

Pendiente de pago.`,
      });
    } catch (emailError) {
      console.error('Error sending registration notification:', emailError);
      // Don't fail the registration if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cuenta creada correctamente',
        user: data.user
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
