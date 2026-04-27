/**
 * Helper: enviar email con contenido HTML desde un archivo via Resend API
 * Uso: node send-email.js <archivo-html> <asunto>
 * O via stdin: cat content.html | node send-email.js - "Asunto"
 *
 * Requiere: RESEND_API_KEY env var (o hardcoded abajo para uso en agente remoto)
 */

const https = require('https');
const fs = require('fs');

const TO = process.env.REPORT_EMAIL || 'julen.sistemas@gmail.com';
const FROM = 'info@aisecurity.es';
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YG4icTFX_BY8beBj8wNbrpDYCBQn2xPci';

const file = process.argv[2];
const subject = process.argv[3] || '📊 SEO Report — aisecurity.es';

if (!file) {
  console.error('Uso: node send-email.js <archivo.html> "Asunto"');
  process.exit(1);
}

const html = file === '-'
  ? fs.readFileSync('/dev/stdin', 'utf-8')
  : fs.readFileSync(file, 'utf-8');

const body = JSON.stringify({
  from: `AI Security SEO <${FROM}>`,
  to: [TO],
  subject,
  html,
});

const options = {
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log(`✅ Email enviado a ${TO} via Resend`);
    } else {
      console.error(`❌ Error Resend (${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});

req.on('error', err => {
  console.error('❌ Error de red:', err.message);
  process.exit(1);
});

req.write(body);
req.end();
