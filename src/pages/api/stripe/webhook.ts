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

    if (session.payment_status === 'paid') {
      const paymentType = session.metadata?.type;

      // Route to appropriate handler
      if (paymentType === 'soporte') {
        await handleSoportePayment(session);
      } else {
        await handleCoursePayment(session);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function createTransporter() {
  return nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port: parseInt(import.meta.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: import.meta.env.SMTP_USER,
      pass: import.meta.env.SMTP_PASSWORD,
    },
  });
}

async function handleSoportePayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  const planId = session.metadata?.plan_id || '';
  const amount = (session.amount_total || 0) / 100;

  const planNames: Record<string, string> = {
    '5h': 'Bolsa de Soporte 5 horas',
    '10h': 'Bolsa de Soporte 10 horas',
    '20h': 'Bolsa de Soporte 20 horas',
  };
  const planName = planNames[planId] || 'Bolsa de Soporte';

  console.log(`Soporte payment received: ${planName} - ${customerEmail} - €${amount}`);

  try {
    const transporter = createTransporter();
    const fromHeader = `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`;

    // Email to admin
    await transporter.sendMail({
      from: fromHeader,
      to: 'info@aisecurity.es',
      subject: `💰 Nuevo pago de soporte - ${planName} - €${amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0065ff 0%, #0052cc 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">💰 Nuevo pago de soporte recibido</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; color: #155724; font-weight: bold;">✅ Pago procesado correctamente por Stripe</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #666; width: 40%;">Plan contratado</td>
                <td style="padding: 10px 0; color: #111; font-weight: bold;">${planName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #666;">Importe</td>
                <td style="padding: 10px 0; color: #28a745; font-weight: bold; font-size: 18px;">€${amount}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; color: #666;">Email cliente</td>
                <td style="padding: 10px 0; color: #111;"><a href="mailto:${customerEmail}" style="color: #0065ff;">${customerEmail || 'No disponible'}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Session ID</td>
                <td style="padding: 10px 0; color: #999; font-size: 12px;">${session.id}</td>
              </tr>
            </table>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
              <p style="margin: 0; color: #856404;"><strong>Acción requerida:</strong> Contacta al cliente en las próximas 24h para coordinar el inicio del soporte.</p>
            </div>
          </div>
        </div>
      `,
      text: `Nuevo pago de soporte recibido\n\nPlan: ${planName}\nImporte: €${amount}\nEmail cliente: ${customerEmail}\nSession: ${session.id}\n\nContacta al cliente para coordinar el inicio del soporte.`,
    });

    // Email to customer (only if we have their email)
    if (customerEmail) {
      await transporter.sendMail({
        from: fromHeader,
        to: customerEmail,
        subject: `✅ Confirmación de pago - ${planName} - AI Security`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0065ff 0%, #0052cc 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Pago Confirmado!</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0;">AI Security - Soporte Técnico Profesional</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">Hola,</p>

              <p style="font-size: 16px; color: #333;">
                Hemos recibido tu pago correctamente. Gracias por confiar en AI Security para tu soporte técnico.
              </p>

              <div style="background: #f0f7ff; border: 1px solid #0065ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0065ff; margin: 0 0 12px 0; font-size: 16px;">Resumen de tu compra</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 0; color: #666;">Servicio</td>
                    <td style="padding: 8px 0; color: #111; font-weight: bold;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Importe pagado</td>
                    <td style="padding: 8px 0; color: #0065ff; font-weight: bold; font-size: 18px;">€${amount}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">
                  📞 Nos pondremos en contacto contigo en las próximas 24 horas para coordinar el inicio del soporte.
                </p>
              </div>

              <p style="font-size: 16px; color: #333;">
                Si tienes cualquier urgencia, puedes contactarnos directamente:
              </p>

              <div style="text-align: center; margin: 25px 0;">
                <a href="mailto:info@aisecurity.es"
                   style="background: #0065ff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  info@aisecurity.es
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

              <p style="font-size: 12px; color: #999;">
                <strong>Referencia de pago:</strong> ${session.id}
              </p>
            </div>

            <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
              © 2026 AI Security - aisecurity.es
            </p>
          </div>
        `,
        text: `¡Pago Confirmado! - AI Security\n\nHemos recibido tu pago correctamente.\n\nPlan: ${planName}\nImporte: €${amount}\n\nNos pondremos en contacto contigo en las próximas 24 horas.\n\nSi tienes urgencia: info@aisecurity.es\n\nReferencia: ${session.id}\n\n© 2026 AI Security - aisecurity.es`,
      });
    }

  } catch (emailError) {
    console.error('Error sending soporte payment emails:', emailError);
  }
}

async function handleCoursePayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.metadata?.customer_email;
  const courseId = session.metadata?.course_id;

  if (!customerEmail) {
    console.error('No customer email in session:', session.id);
    return;
  }

  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }

    const serverClient = createClient(supabaseUrl, serviceRoleKey);

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

    console.log(`Course payment verified for ${customerEmail} - Session: ${session.id}`);

    try {
      const transporter = createTransporter();
      const fromHeader = `"${import.meta.env.SMTP_FROM_NAME || 'AI Security'}" <${import.meta.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`;
      const userName = user?.name || 'Estudiante';

      await transporter.sendMail({
        from: fromHeader,
        to: customerEmail,
        subject: '🎉 ¡Pago confirmado! - Curso Intensivo de Wazuh',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0065ff 0%, #0052cc 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Pago Confirmado!</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">Hola ${userName},</p>
              <p style="font-size: 16px; color: #333;">Tu pago para el <strong>Curso Intensivo de Wazuh</strong> se ha procesado correctamente.</p>
              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ Ya tienes acceso completo al curso</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://aisecurity.es/aula" style="background: #0065ff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Acceder al Aula Virtual
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 14px; color: #666;"><strong>Referencia de pago:</strong> ${session.id}</p>
              <p style="font-size: 14px; color: #666;">Si tienes cualquier duda, contacta con nosotros en <a href="mailto:info@aisecurity.es" style="color: #0065ff;">info@aisecurity.es</a></p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">© 2026 AI Security - aisecurity.es</p>
          </div>
        `,
        text: `¡Pago Confirmado!\n\nHola ${userName},\n\nTu pago para el Curso Intensivo de Wazuh se ha procesado correctamente.\nYa tienes acceso completo al curso.\n\nAccede al aula virtual: https://aisecurity.es/aula\n\nReferencia: ${session.id}\n\nContacto: info@aisecurity.es`,
      });

      await transporter.sendMail({
        from: fromHeader,
        to: 'info@aisecurity.es',
        subject: '💰 Nuevo pago con Stripe - Curso Wazuh',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nuevo pago recibido via Stripe</h2>
            <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>✅ Pago procesado automáticamente</strong><br>El acceso ya ha sido activado.</p>
            </div>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p style="margin: 0 0 10px 0;"><strong>Estudiante:</strong> ${userName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${customerEmail}</p>
              <p style="margin: 0 0 10px 0;"><strong>Curso:</strong> ${courseId || 'wazuh'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Importe:</strong> ${(session.amount_total || 0) / 100}€</p>
              <p style="margin: 0;"><strong>Session ID:</strong> ${session.id}</p>
            </div>
          </div>
        `,
        text: `Nuevo pago recibido via Stripe\n\nEstudiante: ${userName}\nEmail: ${customerEmail}\nCurso: ${courseId || 'wazuh'}\nImporte: ${(session.amount_total || 0) / 100}€\nSession ID: ${session.id}\n\nEl acceso ya ha sido activado automáticamente.`,
      });

    } catch (emailError) {
      console.error('Error sending course confirmation emails:', emailError);
    }

  } catch (error) {
    console.error('Error processing course payment:', error);
  }
}
