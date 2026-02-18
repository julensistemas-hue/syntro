import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('Stripe secret key not configured. Payment features will not work.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-06-30.basil' })
  : null;

// Course pricing configuration
export const COURSE_CONFIG = {
  // Curso Wazuh Intensivo
  wazuh: {
    name: 'Curso Intensivo Wazuh',
    description: 'Aprende a implementar y gestionar Wazuh para cumplimiento ENS',
    priceId: import.meta.env.STRIPE_WAZUH_PRICE_ID || '',
    priceAmount: 50_00, // €50 in cents
    currency: 'eur',
  }
};

export async function createCheckoutSession(
  courseId: keyof typeof COURSE_CONFIG,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const course = COURSE_CONFIG[courseId];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: course.currency,
          product_data: {
            name: course.name,
            description: course.description,
          },
          unit_amount: course.priceAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      course_id: courseId,
      customer_email: customerEmail,
    },
  });

  return session;
}

export async function verifyPayment(sessionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    paid: session.payment_status === 'paid',
    email: session.customer_email,
    courseId: session.metadata?.course_id,
  };
}
