import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El email es obligatorio' }),
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

    // Send password reset email
    const redirectTo = `${url.origin}/aula/nueva-contrasena`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Password reset error:', error.message);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
