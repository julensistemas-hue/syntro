import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { course } = await request.json();

    if (course !== 'wazuh') {
      return new Response(
        JSON.stringify({ error: 'Curso no válido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = url.origin;
    const successUrl = `${baseUrl}/aula/pago-completado?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/aula/pago`;

    const session = await createCheckoutSession(
      'wazuh',
      user.email!,
      successUrl,
      cancelUrl
    );

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al crear la sesión de pago' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
