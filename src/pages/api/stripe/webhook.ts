import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response('Webhook signature missing', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process if payment was successful
    if (session.payment_status === 'paid') {
      const customerEmail = session.customer_email || session.metadata?.customer_email;
      const courseId = session.metadata?.course_id;

      if (!customerEmail) {
        console.error('No customer email in session:', session.id);
        return new Response('No customer email', { status: 400 });
      }

      try {
        // Update payment status in Supabase
        const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
        const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error('Supabase credentials not configured');
        }

        const serverClient = createClient(supabaseUrl, serviceRoleKey);

        // Update user's payment status
        const { data: user, error: updateError } = await serverClient
          .from('course_users')
          .update({
            payment_verified: true,
            payment_method: 'stripe',
            payment_reference: session.id,
            payment_date: new Date().toISOString(),
          })
          .eq('email', customerEmail)
          .select('name, email')
          .single();

        if (updateError) {
          console.error('Error updating payment status:', updateError);
          throw updateError;
        }

        console.log(`Payment verified for ${customerEmail} - Session: ${session.id}`);

        // Send confirmation email to user
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

          const userName = user?.name || 'Estudiante';

          // Email to user
          await transporter.sendMail({
            from: `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
            to: customerEmail,
            subject: '🎉 ¡Pago confirmado! - Curso Intensivo de Wazuh',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0065ff 0%, #0052cc 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">¡Pago Confirmado!</h1>
                </div>

                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 16px; color: #333;">Hola ${userName},</p>

                  <p style="font-size: 16px; color: #333;">
                    Tu pago para el <strong>Curso Intensivo de Wazuh</strong> se ha procesado correctamente.
                  </p>

                  <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #2e7d32; font-weight: bold;">
                      ✅ Ya tienes acceso completo al curso
                    </p>
                  </div>

                  <p style="font-size: 16px; color: #333;">
                    Puedes acceder al aula virtual desde el siguiente enlace:
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aisecurity.es/aula"
                       style="background: #0065ff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Acceder al Aula Virtual
                    </a>
                  </div>

                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                  <p style="font-size: 14px; color: #666;">
                    <strong>Referencia de pago:</strong> ${session.id}
                  </p>

                  <p style="font-size: 14px; color: #666;">
                    Si tienes cualquier duda, no dudes en contactarnos en
                    <a href="mailto:info@aisecurity.es" style="color: #0065ff;">info@aisecurity.es</a>
                  </p>
                </div>

                <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
                  © 2026 AI Security - aisecurity.es
                </p>
              </div>
            `,
            text: `
¡Pago Confirmado!

Hola ${userName},

Tu pago para el Curso Intensivo de Wazuh se ha procesado correctamente.
Ya tienes acceso completo al curso.

Accede al aula virtual: https://aisecurity.es/aula

Referencia de pago: ${session.id}

Si tienes cualquier duda, contacta con nosotros en info@aisecurity.es

© 2026 AI Security - aisecurity.es
            `,
          });

          // Email notification to admin
          await transporter.sendMail({
            from: `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
            to: 'info@aisecurity.es',
            subject: '💰 Nuevo pago con Stripe - Curso Wazuh',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Nuevo pago recibido via Stripe</h2>

                <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #155724;">
                    <strong>✅ Pago procesado automáticamente</strong><br>
                    El acceso ya ha sido activado.
                  </p>
                </div>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Estudiante:</strong> ${userName}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${customerEmail}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Curso:</strong> ${courseId || 'wazuh'}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Importe:</strong> ${(session.amount_total || 0) / 100}€</p>
                  <p style="margin: 0;"><strong>Session ID:</strong> ${session.id}</p>
                </div>
              </div>
            `,
            text: `
Nuevo pago recibido via Stripe

Estudiante: ${userName}
Email: ${customerEmail}
Curso: ${courseId || 'wazuh'}
Importe: ${(session.amount_total || 0) / 100}€
Session ID: ${session.id}

El acceso ya ha sido activado automáticamente.
            `,
          });

        } catch (emailError) {
          console.error('Error sending confirmation emails:', emailError);
          // Don't fail the webhook if email fails
        }

      } catch (error) {
        console.error('Error processing payment:', error);
        return new Response('Error processing payment', { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
