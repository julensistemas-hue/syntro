/**
 * Script 7: SEO Weekly Report — Análisis, comparación histórica y envío por email
 *
 * Ejecuta cada martes y viernes via GitHub Actions.
 * 1. Extrae datos de Google Search Console (últimos 28 días vs 28 anteriores)
 * 2. Compara con el reporte histórico anterior
 * 3. Detecta oportunidades y tendencias
 * 4. Propone acciones concretas
 * 5. Envía resumen por email a julen.sistemas@gmail.com
 *
 * Variables de entorno necesarias (GitHub Actions Secrets):
 *   GOOGLE_CREDENTIALS_JSON  → contenido del google-credentials.json (base64 o JSON string)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
 *   REPORT_EMAIL             → destinatario (julen.sistemas@gmail.com)
 */

const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ─── Configuración ────────────────────────────────────────────────────────────
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const HISTORY_FILE = path.join(__dirname, 'seo-history.json');
const REPORT_EMAIL = process.env.REPORT_EMAIL || 'julen.sistemas@gmail.com';

// Objetivos de negocio — para priorizar recomendaciones
const BUSINESS_GOALS = {
  primary: ['wazuh', 'curso wazuh', 'wazuh ens', 'implementar wazuh'],
  secondary: ['soporte técnico', 'soporte it', 'técnico informático'],
  tertiary: ['chatbot empresas', 'automatización ia', 'gestor documental'],
};

// Páginas de conversión clave
const CONVERSION_PAGES = ['/wazuh', '/curso-wazuh', '/reunion', '/soporte-tecnico'];

// Umbral de oportunidad: impresiones altas, CTR bajo
const OPPORTUNITY_MIN_IMPRESSIONS = 30;
const OPPORTUNITY_MAX_CTR = 0.04;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDates(daysBack, offsetDays = 3) {
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function pct(val, prev) {
  if (!prev || prev === 0) return val > 0 ? '+100%' : '0%';
  const diff = ((val - prev) / prev) * 100;
  return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
}

function arrow(val, prev) {
  if (!prev) return '';
  return val > prev ? '📈' : val < prev ? '📉' : '➡️';
}

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  }
  return { reports: [] };
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ─── Google Search Console ────────────────────────────────────────────────────
async function getSearchConsoleData(authClient) {
  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  // Detectar propiedad
  const sitesRes = await sc.sites.list();
  const site = (sitesRes.data.siteEntry || []).find(s => s.siteUrl.includes('aisecurity.es'));
  if (!site) throw new Error('Propiedad aisecurity.es no encontrada en Search Console');
  const siteUrl = site.siteUrl;

  const current = getDates(28);
  const previous = getDates(56, 31); // 28 días anteriores

  async function query(dates, dimensions, rowLimit = 100) {
    const res = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { ...dates, dimensions, rowLimit },
    });
    return res.data.rows || [];
  }

  // Datos período actual
  const [kwCurrent, pagesCurrent, kwPrevious, pagesPrevious] = await Promise.all([
    query(current, ['query'], 100),
    query(current, ['page'], 25),
    query(previous, ['query'], 100),
    query(previous, ['page'], 25),
  ]);

  // Totales
  const sumClicks = rows => rows.reduce((a, r) => a + r.clicks, 0);
  const sumImpressions = rows => rows.reduce((a, r) => a + r.impressions, 0);

  const totals = {
    current: { clicks: sumClicks(kwCurrent), impressions: sumImpressions(kwCurrent) },
    previous: { clicks: sumClicks(kwPrevious), impressions: sumImpressions(kwPrevious) },
  };

  // Map previous keywords para comparación
  const prevKwMap = new Map(kwPrevious.map(r => [r.keys[0], r]));
  const prevPageMap = new Map(pagesPrevious.map(r => [r.keys[0], r]));

  // Keywords enriquecidas con delta
  const keywords = kwCurrent.map(r => {
    const prev = prevKwMap.get(r.keys[0]);
    return {
      keyword: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
      prevClicks: prev?.clicks || 0,
      prevPosition: prev?.position || null,
      isNew: !prev,
    };
  });

  // Páginas enriquecidas
  const pages = pagesCurrent.map(r => {
    const slug = r.keys[0].replace('https://aisecurity.es', '') || '/';
    const prev = prevPageMap.get(r.keys[0]);
    return {
      page: slug,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
      prevClicks: prev?.clicks || 0,
    };
  });

  // Oportunidades: muchas impresiones, poco CTR, posición < 20
  const opportunities = keywords
    .filter(k => k.impressions >= OPPORTUNITY_MIN_IMPRESSIONS && k.ctr < OPPORTUNITY_MAX_CTR && k.position < 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  // Keywords de negocio
  const businessKeywords = keywords.filter(k =>
    [...BUSINESS_GOALS.primary, ...BUSINESS_GOALS.secondary, ...BUSINESS_GOALS.tertiary]
      .some(goal => k.keyword.includes(goal))
  );

  // Nuevas keywords que aparecieron esta semana
  const newKeywords = keywords.filter(k => k.isNew && k.impressions > 10).slice(0, 10);

  // Keywords en posición 4-15 (cerca del top 3, empujar)
  const nearTop = keywords
    .filter(k => k.position >= 4 && k.position <= 15 && k.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  return { siteUrl, totals, keywords, pages, opportunities, businessKeywords, newKeywords, nearTop, period: current };
}

// ─── Generador de recomendaciones ─────────────────────────────────────────────
function generateRecommendations(data, history) {
  const recs = [];

  // 1. Oportunidades de CTR (impacto inmediato)
  if (data.opportunities.length > 0) {
    const top = data.opportunities.slice(0, 3);
    recs.push({
      priority: '🔥 ALTA',
      type: 'CTR',
      action: `Mejorar title/description de estas keywords con muchas impresiones pero bajo CTR:`,
      items: top.map(k => `"${k.keyword}" — ${k.impressions} impresiones, CTR ${(k.ctr*100).toFixed(1)}%, pos ${k.position.toFixed(1)}`),
      why: 'Son búsquedas donde ya apareces pero no hacen click. Cambiar el título puede duplicar el tráfico sin cambiar posición.',
    });
  }

  // 2. Keywords cerca del top 3
  if (data.nearTop.length > 0) {
    const top = data.nearTop.slice(0, 3);
    recs.push({
      priority: '🔥 ALTA',
      type: 'Contenido',
      action: 'Reforzar estas páginas para subir al top 3 (están en posición 4-15):',
      items: top.map(k => `"${k.keyword}" — pos ${k.position.toFixed(1)}, ${k.impressions} impresiones`),
      why: 'Pasar de posición 6 a posición 2 puede multiplicar clicks x5. Añadir más contenido, FAQs o mejorar estructura H2/H3.',
    });
  }

  // 3. Nuevas keywords detectadas
  if (data.newKeywords.length > 0) {
    recs.push({
      priority: '📊 MEDIA',
      type: 'Nuevas oportunidades',
      action: 'Nuevas keywords que han aparecido esta semana — considerar crear contenido:',
      items: data.newKeywords.slice(0, 5).map(k => `"${k.keyword}" — ${k.impressions} impresiones`),
      why: 'Son búsquedas nuevas donde Google está probando si tu web es relevante. Crear contenido específico puede consolidar esas posiciones.',
    });
  }

  // 4. Páginas de conversión — revisar si tienen tráfico
  const conversionData = data.pages.filter(p => CONVERSION_PAGES.some(cp => p.page === cp));
  const missingConversion = CONVERSION_PAGES.filter(cp => !conversionData.some(p => p.page === cp));
  if (missingConversion.length > 0) {
    recs.push({
      priority: '📊 MEDIA',
      type: 'Conversión',
      action: 'Páginas de conversión clave sin tráfico visible — solicitar indexación o crear contenido:',
      items: missingConversion,
      why: 'Si estas páginas no reciben visitas orgánicas, los servicios principales no se están vendiendo por SEO.',
    });
  }

  // 5. Oportunidades de nuevos servicios/contenido basadas en keywords detectadas
  const allKeywords = data.keywords.map(k => k.keyword).join(' ');
  const opportunities = [];

  if (allKeywords.includes('curso') && !allKeywords.includes('curso ia')) {
    opportunities.push('Curso de IA para empresas — hay interés en formación, no solo en Wazuh');
  }
  if (allKeywords.includes('microsoft') || allKeywords.includes('365')) {
    opportunities.push('Artículo/servicio: "Securizar Microsoft 365 con Wazuh" — búsquedas activas detectadas');
  }
  if (allKeywords.includes('docker') || allKeywords.includes('contenedor')) {
    opportunities.push('Guía: "Monitorizar contenedores Docker con Wazuh" — ya tienes contenido, mejorar SEO');
  }
  if (allKeywords.includes('siem') || allKeywords.includes('xdr')) {
    opportunities.push('Landing page dedicada SIEM/XDR — diferente a /wazuh, para búsquedas más genéricas');
  }
  if (allKeywords.includes('phishing') || allKeywords.includes('concienciacion')) {
    opportunities.push('Servicio de simulación de phishing para empresas — hay demanda, considerar landing page');
  }

  if (opportunities.length > 0) {
    recs.push({
      priority: '💡 OPORTUNIDAD',
      type: 'Nuevos servicios/contenido',
      action: 'Oportunidades detectadas en los datos de búsqueda:',
      items: opportunities,
      why: 'Basado en las keywords que la gente busca y que llevan a tu web — señales de demanda real.',
    });
  }

  // 6. Comparación histórica — alertas de caída
  if (history.reports.length > 0) {
    const lastReport = history.reports[history.reports.length - 1];
    const clicksDrop = lastReport.totals?.current?.clicks - data.totals.current.clicks;
    if (clicksDrop > 20) {
      recs.push({
        priority: '⚠️ ALERTA',
        type: 'Caída de tráfico',
        action: `Caída de ${clicksDrop} clicks respecto al reporte anterior`,
        items: [`Clicks anteriores: ${lastReport.totals.current.clicks}`, `Clicks actuales: ${data.totals.current.clicks}`],
        why: 'Revisar si Google ha penalizado alguna página o si hay un problema técnico.',
      });
    }
  }

  return recs;
}

// ─── Plantilla HTML del email ─────────────────────────────────────────────────
function buildEmailHtml(data, recommendations, history) {
  const { totals, keywords, pages, opportunities, businessKeywords, nearTop, period } = data;
  const prev = history.reports.length > 0 ? history.reports[history.reports.length - 1] : null;

  const clicksChange = pct(totals.current.clicks, totals.previous.clicks);
  const impressionsChange = pct(totals.current.impressions, totals.previous.impressions);
  const clicksArrow = arrow(totals.current.clicks, totals.previous.clicks);
  const impressionsArrow = arrow(totals.current.impressions, totals.previous.impressions);

  const kwRows = keywords.slice(0, 10).map(k => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 8px 12px; font-size: 13px; color: #333;">${k.keyword}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; font-weight: 600; color: #1a73e8;">${k.clicks}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: #555;">${k.impressions}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: ${k.position <= 3 ? '#0f9d58' : k.position <= 10 ? '#f57c00' : '#d93025'};">${k.position.toFixed(1)}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px;">${k.isNew ? '🆕' : k.clicks > k.prevClicks ? '📈' : k.clicks < k.prevClicks ? '📉' : '➡️'}</td>
    </tr>`).join('');

  const pageRows = pages.slice(0, 8).map(p => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 8px 12px; font-size: 13px; color: #333; font-family: monospace;">${p.page}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; font-weight: 600; color: #1a73e8;">${p.clicks}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: #555;">${(p.ctr * 100).toFixed(1)}%</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: ${p.position <= 3 ? '#0f9d58' : p.position <= 10 ? '#f57c00' : '#d93025'};">${p.position.toFixed(1)}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px;">${p.clicks > p.prevClicks ? '📈' : p.clicks < p.prevClicks ? '📉' : '➡️'}</td>
    </tr>`).join('');

  const recBlocks = recommendations.map(r => `
    <div style="background: #f8f9fa; border-left: 4px solid ${r.priority.includes('ALTA') ? '#d93025' : r.priority.includes('ALERTA') ? '#f57c00' : r.priority.includes('OPORTUNIDAD') ? '#0f9d58' : '#1a73e8'}; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 16px;">
      <div style="font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 6px;">${r.priority} · ${r.type}</div>
      <div style="font-size: 14px; font-weight: 600; color: #222; margin-bottom: 8px;">${r.action}</div>
      <ul style="margin: 0 0 8px 0; padding-left: 20px;">
        ${r.items.map(i => `<li style="font-size: 13px; color: #444; margin-bottom: 4px;">${i}</li>`).join('')}
      </ul>
      <div style="font-size: 12px; color: #777; font-style: italic;">💡 ${r.why}</div>
    </div>`).join('');

  const opportunityRows = opportunities.slice(0, 5).map(o => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 8px 12px; font-size: 13px; color: #333;">${o.keyword}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: #555;">${o.impressions}</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: #d93025;">${(o.ctr * 100).toFixed(1)}%</td>
      <td style="padding: 8px 12px; text-align: center; font-size: 13px;">${o.position.toFixed(1)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="background:#f4f6f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px;text-align:center;">
    <div style="font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;">📊 SEO Report — aisecurity.es</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);">Período: ${period.startDate} → ${period.endDate}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">Generado: ${new Date().toLocaleString('es-ES')}</div>
  </td></tr>

  <!-- KPIs -->
  <tr><td style="padding:24px;">
    <table width="100%">
      <tr>
        <td width="50%" style="text-align:center;padding:16px;background:#f0f7ff;border-radius:8px;margin-right:8px;">
          <div style="font-size:32px;font-weight:700;color:#1a73e8;">${totals.current.clicks}</div>
          <div style="font-size:12px;color:#666;margin-top:4px;">Clicks (28 días)</div>
          <div style="font-size:13px;font-weight:600;color:${totals.current.clicks >= totals.previous.clicks ? '#0f9d58' : '#d93025'};margin-top:2px;">${clicksArrow} ${clicksChange} vs período anterior</div>
        </td>
        <td width="8"></td>
        <td width="50%" style="text-align:center;padding:16px;background:#f0f7ff;border-radius:8px;">
          <div style="font-size:32px;font-weight:700;color:#1a73e8;">${totals.current.impressions.toLocaleString('es-ES')}</div>
          <div style="font-size:12px;color:#666;margin-top:4px;">Impresiones (28 días)</div>
          <div style="font-size:13px;font-weight:600;color:${totals.current.impressions >= totals.previous.impressions ? '#0f9d58' : '#d93025'};margin-top:2px;">${impressionsArrow} ${impressionsChange} vs período anterior</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Recomendaciones -->
  <tr><td style="padding:0 24px 24px;">
    <div style="font-size:16px;font-weight:700;color:#222;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0;">🎯 Acciones recomendadas esta semana</div>
    ${recBlocks || '<p style="color:#666;font-size:14px;">Sin recomendaciones urgentes esta semana. ¡Buen trabajo!</p>'}
  </td></tr>

  <!-- Top Keywords -->
  <tr><td style="padding:0 24px 24px;">
    <div style="font-size:16px;font-weight:700;color:#222;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f0f0f0;">🔍 Top 10 Keywords</div>
    <table width="100%" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;font-weight:600;">Keyword</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Clicks</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Impr.</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Posición</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Tendencia</th>
        </tr>
      </thead>
      <tbody>${kwRows}</tbody>
    </table>
  </td></tr>

  <!-- Top Páginas -->
  <tr><td style="padding:0 24px 24px;">
    <div style="font-size:16px;font-weight:700;color:#222;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f0f0f0;">📄 Top Páginas por Clicks</div>
    <table width="100%" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;font-weight:600;">Página</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Clicks</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">CTR</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Posición</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Tendencia</th>
        </tr>
      </thead>
      <tbody>${pageRows}</tbody>
    </table>
  </td></tr>

  ${opportunities.length > 0 ? `
  <!-- Oportunidades CTR -->
  <tr><td style="padding:0 24px 24px;">
    <div style="font-size:16px;font-weight:700;color:#222;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f0f0f0;">🎯 Oportunidades de CTR</div>
    <p style="font-size:13px;color:#666;margin:0 0 12px;">Keywords donde apareces pero no hacen click — mejorar title/description puede aumentar tráfico sin cambiar posición:</p>
    <table width="100%" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#fff8e1;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;font-weight:600;">Keyword</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Impresiones</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">CTR actual</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;font-weight:600;">Posición</th>
        </tr>
      </thead>
      <tbody>${opportunityRows}</tbody>
    </table>
  </td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="background:#f8f9fa;padding:20px 24px;text-align:center;border-top:1px solid #e8e8e8;">
    <div style="font-size:12px;color:#999;">AI Security · aisecurity.es · Reporte automático SEO</div>
    <div style="font-size:11px;color:#bbb;margin-top:4px;">Generado por GitHub Actions · Próximo reporte en 3-4 días</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Enviar email ─────────────────────────────────────────────────────────────
async function sendEmail(html, subject) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp1.s.ipzmarketing.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'rbaknxqyoxkj',
      pass: process.env.SMTP_PASSWORD || 'cpexfT8y5EjXw2ez',
    },
  });

  await transporter.sendMail({
    from: `"AI Security SEO Bot" <${process.env.SMTP_FROM_EMAIL || 'info@aisecurity.es'}>`,
    to: REPORT_EMAIL,
    subject,
    html,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📊 SEO Weekly Report — aisecurity.es\n');

  // Cargar credenciales
  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    // GitHub Actions: credenciales como variable de entorno
    credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8')
    );
  } else if (fs.existsSync(CREDENTIALS_PATH)) {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  } else {
    throw new Error('No se encontraron credenciales de Google. Configura GOOGLE_CREDENTIALS_JSON o google-credentials.json');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  });
  const authClient = await auth.getClient();

  // Obtener datos
  console.log('🔄 Obteniendo datos de Search Console...');
  const data = await getSearchConsoleData(authClient);
  console.log(`✅ Datos obtenidos: ${data.keywords.length} keywords, ${data.pages.length} páginas`);

  // Cargar historial
  const history = loadHistory();

  // Generar recomendaciones
  console.log('🧠 Generando recomendaciones...');
  const recommendations = generateRecommendations(data, history);
  console.log(`✅ ${recommendations.length} recomendaciones generadas`);

  // Guardar en historial
  history.reports.push({
    date: new Date().toISOString(),
    totals: data.totals,
    topKeywords: data.keywords.slice(0, 20),
    topPages: data.pages.slice(0, 10),
  });
  // Mantener solo los últimos 12 reportes (~6 semanas)
  if (history.reports.length > 12) history.reports = history.reports.slice(-12);
  saveHistory(history);
  console.log('✅ Historial actualizado');

  // Generar email
  const clicksChange = pct(data.totals.current.clicks, data.totals.previous.clicks);
  const subject = `📊 SEO aisecurity.es — ${data.totals.current.clicks} clicks ${clicksChange} · ${recommendations.length} acciones`;
  const html = buildEmailHtml(data, recommendations, history);

  // Enviar email
  console.log(`📧 Enviando reporte a ${REPORT_EMAIL}...`);
  await sendEmail(html, subject);
  console.log('✅ Email enviado');

  // Guardar MD actualizado para Claude
  const md = `# Search Console Report — aisecurity.es\n\n**Generado:** ${new Date().toLocaleString('es-ES')}  \n**Período:** ${data.period.startDate} → ${data.period.endDate}\n\n## Totales\n- Clicks: ${data.totals.current.clicks} (${clicksChange} vs período anterior)\n- Impresiones: ${data.totals.current.impressions}\n\n## Top Keywords\n\n${data.keywords.slice(0,15).map(k => `- **${k.keyword}**: ${k.clicks} clicks, pos ${k.position.toFixed(1)}, ${k.impressions} impresiones`).join('\n')}\n\n## Oportunidades CTR\n\n${data.opportunities.slice(0,5).map(o => `- **${o.keyword}**: ${o.impressions} impresiones, CTR ${(o.ctr*100).toFixed(1)}%, pos ${o.position.toFixed(1)}`).join('\n')}\n\n## Recomendaciones\n\n${recommendations.map(r => `### ${r.priority} — ${r.type}\n${r.action}\n${r.items.map(i => `- ${i}`).join('\n')}`).join('\n\n')}`;
  fs.writeFileSync(path.join(__dirname, '../../docs/seo/search-console-data.md'), md);
  console.log('✅ docs/seo/search-console-data.md actualizado');

  console.log('\n🎉 Reporte completado');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
