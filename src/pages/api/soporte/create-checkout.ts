import type { APIRoute } from 'astro';
import { createSoporteCheckoutSession, SOPORTE_CONFIG, type SoportePlanId } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { planId } = await request.json();

    if (!planId || !(planId in SOPORTE_CONFIG)) {
      return new Response(
        JSON.stringify({ error: 'Plan no válido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = url.origin;
    const successUrl = `${baseUrl}/soporte-pago-exitoso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/soporte-tecnico#precios`;

    const session = await createSoporteCheckoutSession(
      planId as SoportePlanId,
      successUrl,
      cancelUrl
    );

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Soporte checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al crear la sesión de pago' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
