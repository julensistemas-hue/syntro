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

    const { lesson_id, content } = await request.json();

    if (!lesson_id || !content) {
      return new Response(
        JSON.stringify({ error: 'lesson_id y content son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get lesson info for email
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, modules(title)')
      .eq('id', lesson_id)
      .single();

    // Get user info
    const { data: courseUser } = await supabase
      .from('course_users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // Insert comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        lesson_id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Comment insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el comentario' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

      const moduleName = (lesson?.modules as any)?.title || 'Módulo desconocido';
      const lessonName = lesson?.title || 'Lección desconocida';
      const userName = courseUser?.name || 'Estudiante';
      const userEmail = courseUser?.email || user.email;

      await transporter.sendMail({
        from: `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
        to: 'info@aisecurity.es',
        subject: `💬 Nueva duda en el curso: ${lessonName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nueva duda en el Curso Wazuh</h2>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Estudiante:</strong> ${userName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 0 0 10px 0;"><strong>Módulo:</strong> ${moduleName}</p>
              <p style="margin: 0;"><strong>Lección:</strong> ${lessonName}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #666;"><strong>Comentario:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${content}</p>
            </div>

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Responde directamente desde el panel de Supabase o respondiendo a este email al estudiante.
            </p>
          </div>
        `,
        text: `
Nueva duda en el Curso Wazuh

Estudiante: ${userName}
Email: ${userEmail}
Módulo: ${moduleName}
Lección: ${lessonName}

Comentario:
${content}
        `,
      });
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true, comment }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Comment error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
