/**
 * Helper: enviar email con contenido HTML desde un archivo
 * Uso: node send-email.js <archivo-html> <asunto>
 * O via stdin: cat content.html | node send-email.js - "Asunto"
 */

const nodemailer = require('nodemailer');
const fs = require('fs');

const TO = process.env.REPORT_EMAIL || 'julen.sistemas@gmail.com';
const file = process.argv[2];
const subject = process.argv[3] || '📊 SEO Report — aisecurity.es';

if (!file) {
  console.error('Uso: node send-email.js <archivo.html> "Asunto"');
  process.exit(1);
}

const html = file === '-'
  ? fs.readFileSync('/dev/stdin', 'utf-8')
  : fs.readFileSync(file, 'utf-8');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp1.s.ipzmarketing.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'rbaknxqyoxkj',
    pass: process.env.SMTP_PASSWORD || 'cpexfT8y5EjXw2ez',
  },
});

transporter.sendMail({
  from: `"AI Security SEO" <${process.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
  to: TO,
  subject,
  html,
}).then(() => {
  console.log(`✅ Email enviado a ${TO}`);
}).catch(err => {
  console.error('❌ Error enviando email:', err.message);
  process.exit(1);
});
