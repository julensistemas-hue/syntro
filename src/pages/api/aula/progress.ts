import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { lesson_id, completed } = await request.json();

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: 'lesson_id es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use anon client for auth verification
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to bypass RLS for upsert
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // Upsert progress
    const { error } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id,
        completed: completed ?? true,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,lesson_id',
      });

    if (error) {
      console.error('Progress update error:', error);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el progreso' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Progress error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
