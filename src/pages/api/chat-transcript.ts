import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, page } = await request.json();

    // Solo enviar si hay al menos 1 mensaje del usuario
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    if (userMessages.length === 0) {
      return new Response(null, { status: 204 });
    }

    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: parseInt(import.meta.env.SMTP_PORT),
      secure: false,
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASSWORD,
      },
    });

    const lines = messages
      .map((m: { role: string; text: string }) =>
        `<tr>
          <td style="padding:6px 10px;font-weight:bold;color:${m.role === "user" ? "#2563eb" : "#16a34a"};white-space:nowrap;vertical-align:top;">
            ${m.role === "user" ? "👤 Usuario" : "🤖 Asistente"}
          </td>
          <td style="padding:6px 10px;color:#1e293b;">${m.text}</td>
        </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:1.1rem;">💬 Conversación del asistente web</h2>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.85rem;">Página: ${page}</p>
        </div>
        <div style="background:#f8fafc;padding:20px 24px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;">
            ${lines}
          </table>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Security Web" <${import.meta.env.SMTP_FROM_EMAIL}>`,
      to: "info@aisecurity.es",
      subject: `💬 Chat web — ${userMessages.length} pregunta${userMessages.length > 1 ? "s" : ""} (${page})`,
      html,
    });

    return new Response(null, { status: 200 });
  } catch (e) {
    return new Response(null, { status: 500 });
  }
};
