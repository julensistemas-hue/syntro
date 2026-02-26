import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { method, reference } = await request.json();

    if (!method || !reference) {
      return new Response(
        JSON.stringify({ error: 'Método y referencia son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update user with payment reference (using service role to bypass RLS)
    const serverClient = createClient(supabaseUrl!, serviceRoleKey!);

    const { error: updateError } = await serverClient
      .from('course_users')
      .update({
        payment_method: method,
        payment_reference: reference,
        // payment_verified remains false until admin confirms
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar la información de pago' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user info for email
    const { data: courseUser } = await serverClient
      .from('course_users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // Send email notification to admin
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

      const methodName = method === 'bizum' ? 'Bizum' : 'Transferencia bancaria';
      const userName = courseUser?.name || 'Sin nombre';
      const userEmail = courseUser?.email || user.email;

      await transporter.sendMail({
        from: `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
        to: 'info@aisecurity.es',
        subject: `💰 Confirmación de pago manual - Curso Wazuh`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nueva confirmación de pago manual</h2>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Acción requerida:</strong> Verificar el pago y activar el acceso manualmente en Supabase.
              </p>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Estudiante:</strong> ${userName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 0 0 10px 0;"><strong>Método de pago:</strong> ${methodName}</p>
              <p style="margin: 0;"><strong>Referencia:</strong> ${reference}</p>
            </div>

            <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #155724;">
                <strong>Para activar el acceso:</strong><br>
                1. Verificar el pago en tu banco o Bizum<br>
                2. Ir a Supabase → Tabla course_users<br>
                3. Buscar al usuario por email<br>
                4. Cambiar <code>payment_verified</code> a <code>true</code>
              </p>
            </div>
          </div>
        `,
        text: `
Nueva confirmación de pago manual - Curso Wazuh

Estudiante: ${userName}
Email: ${userEmail}
Método de pago: ${methodName}
Referencia: ${reference}

Para activar el acceso:
1. Verificar el pago en tu banco o Bizum
2. Ir a Supabase → Tabla course_users
3. Buscar al usuario por email
4. Cambiar payment_verified a true
        `,
      });
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Confirm payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
