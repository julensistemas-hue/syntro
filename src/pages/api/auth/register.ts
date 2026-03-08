import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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

    // Send notification email to admin
    try {
      const transporter = nodemailer.createTransport({
        host: import.meta.env.SMTP_HOST,
        port: parseInt(import.meta.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: import.meta.env.SMTP_USER,
          pass: import.meta.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
        to: 'info@aisecurity.es',
        subject: '📝 Nuevo registro - Curso Wazuh',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nuevo usuario registrado</h2>

            <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0;">
                <strong>📝 Pendiente de pago</strong><br>
                El usuario aún no ha completado el pago.
              </p>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${name || 'No proporcionado'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>
          </div>
        `,
        text: `
Nuevo usuario registrado

Nombre: ${name || 'No proporcionado'}
Email: ${email}
Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

Pendiente de pago.
        `,
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
