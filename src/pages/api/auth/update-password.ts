import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { password, access_token, refresh_token } = await request.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'La contraseña es obligatoria' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'Token de sesión no válido. El enlace puede haber expirado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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

    // Set the session from the recovery link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'El enlace ha expirado. Solicita uno nuevo.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error('Update password error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al cambiar la contraseña' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update password error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
