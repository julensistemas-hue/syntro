import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env si existe (local), en GitHub Actions las vars vienen como process.env
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^"(.*)"$/, '$1');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const env = process.env;

const PROPERTY_ID = '519124169';

// Soporte para JSON completo (GOOGLE_SERVICE_ACCOUNT_JSON) o campos separados
let auth;
if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
} else {
  const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

const isAll = process.argv.includes('--all');
const periodoLabel = isAll ? 'Todos los datos disponibles' : 'Últimos 7 días';

const dateRange     = isAll ? { startDate: '2020-01-01', endDate: 'today' } : { startDate: '7daysAgo',  endDate: 'today' };
const dateRangePrev = isAll ? null : { startDate: '14daysAgo', endDate: '8daysAgo' };

// Filtro base: excluir páginas de prueba (/prueba-*, /test-*, /draft-*)
const EXCLUDE_TEST_PAGES = {
  filter: {
    fieldName: 'pagePath',
    stringFilter: { matchType: 'BEGINS_WITH', value: '/prueba-', caseSensitive: false }
  }
};

function withExcludeFilter(filters) {
  const notTestPages = { notExpression: EXCLUDE_TEST_PAGES };
  if (!filters) return notTestPages;
  return { andGroup: { expressions: [notTestPages, filters] } };
}

async function query(dimensions, metrics, filters, range) {
  try {
    const res = await analyticsData.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [range || dateRange],
        dimensions: dimensions.map(n => ({ name: n })),
        metrics:    metrics.map(n => ({ name: n })),
        dimensionFilter: withExcludeFilter(filters),
        limit: 20,
        orderBys: [{ metric: { metricName: metrics[0] }, desc: true }],
      },
    });
    return res.data.rows || [];
  } catch (e) {
    console.error('Error query GA4:', e.message);
    return [];
  }
}

// Totales simples (sin dimensiones)
async function queryTotals(range) {
  try {
    const res = await analyticsData.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [range],
        dimensions: [],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
        limit: 1,
      },
    });
    const t = res.data.rows?.[0]?.metricValues || [];
    return {
      sessions:  parseInt(t[0]?.value || '0'),
      users:     parseInt(t[1]?.value || '0'),
      pageviews: parseInt(t[2]?.value || '0'),
    };
  } catch (e) {
    console.error('Error query totals:', e.message);
    return { sessions: 0, users: 0, pageviews: 0 };
  }
}

function delta(curr, prev) {
  if (!prev || prev === 0) return '';
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return `<span style="color:#94a3b8;font-size:0.72rem;">= igual</span>`;
  const up = pct > 0;
  return `<span style="color:${up ? '#16a34a' : '#dc2626'};font-size:0.72rem;font-weight:600;">${up ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
}

function row(cols) {
  return `<tr>${cols.map((c, i) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;${i === 0 ? 'color:#1e293b;' : 'color:#475569;text-align:right;'}">${c}</td>`).join('')}</tr>`;
}

function section(title, emoji, headers, rows) {
  if (!rows.length) return `<div style="margin-bottom:28px;"><h3 style="color:#1e3a5f;margin:0 0 8px;">${emoji} ${title}</h3><p style="color:#94a3b8;font-size:0.85rem;">Sin datos aún</p></div>`;
  return `
  <div style="margin-bottom:32px;">
    <h3 style="color:#1e3a5f;margin:0 0 12px;font-size:1rem;">${emoji} ${title}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:0.875rem;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <thead><tr>${headers.map(h => `<th style="padding:10px 12px;background:#f8fafc;color:#64748b;font-weight:600;text-align:${h === headers[0] ? 'left' : 'right'};font-size:0.8rem;text-transform:uppercase;letter-spacing:0.03em;">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

async function buildReport() {
  console.log('📊 Consultando GA4...\n');

  // Totales esta semana y semana anterior
  const curr = await queryTotals(dateRange);
  const prev = isAll ? null : await queryTotals(dateRangePrev);

  // 1. Top botones/links clicados — con página de origen
  const clicks = await query(
    ['customEvent:event_label', 'customEvent:event_category', 'pagePath'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', orGroup: { expressions: [
      { filter: { fieldName: 'eventName', stringFilter: { value: 'click_link' } } },
      { filter: { fieldName: 'eventName', stringFilter: { value: 'click_button' } } },
    ] } } }
  );

  // 2. Clicks por categoría
  const byCategory = await query(
    ['customEvent:event_category'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', orGroup: { expressions: [
      { filter: { fieldName: 'eventName', stringFilter: { value: 'click_link' } } },
      { filter: { fieldName: 'eventName', stringFilter: { value: 'click_button' } } },
    ] } } }
  );

  // 3. Conversiones (leads/presupuesto/pago) — con página de origen y texto del botón
  const conversions = await query(
    ['customEvent:event_label', 'pagePath'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', stringFilter: { value: 'conversion_click' } } }
  );

  // 4. Formularios enviados — con página
  const forms = await query(
    ['customEvent:event_label', 'pagePath'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', stringFilter: { value: 'form_submit' } } }
  );

  // 5. Scroll depth promedio por tipo de página
  const scrollDepth = await query(
    ['customEvent:page_type'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', stringFilter: { value: 'scroll_depth' } } }
  );

  // 6. Secciones más vistas
  const sectionViews = await query(
    ['customEvent:event_label'],
    ['eventCount'],
    { filter: { fieldName: 'eventName', stringFilter: { value: 'section_view' } } }
  );

  // 7. Páginas más visitadas
  const pages = await query(['pagePath'], ['screenPageViews'], null);

  const now = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const kpiBlock = (icon, label, value, prevValue) => `
    <div style="background:white;border-radius:10px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <div style="font-size:1.6rem;margin-bottom:4px;">${icon}</div>
      <div style="font-size:1.5rem;font-weight:700;color:#1e293b;">${value.toLocaleString('es-ES')}</div>
      ${prev ? `<div style="margin-top:2px;">${delta(value, prevValue)}</div>` : ''}
      <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">${label}</div>
      ${prev ? `<div style="font-size:0.72rem;color:#cbd5e1;margin-top:1px;">sem. ant.: ${prevValue?.toLocaleString('es-ES') ?? '-'}</div>` : ''}
    </div>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f1f5f9;margin:0;padding:24px;">
<div style="max-width:660px;margin:0 auto;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;padding:28px 32px;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:1.4rem;">📊 Informe semanal GA4</h1>
    <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.875rem;">AI Security · ${periodoLabel} · ${now}</p>
    ${prev ? `<p style="color:rgba(255,255,255,0.5);margin:3px 0 0;font-size:0.78rem;">Comparativa con semana anterior (${dateRangePrev.startDate} → ${dateRangePrev.endDate})</p>` : ''}
  </div>

  <!-- KPIs con comparativa -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;">
    ${kpiBlock('🔄', 'Sesiones',       curr.sessions,  prev?.sessions)}
    ${kpiBlock('👥', 'Usuarios',       curr.users,     prev?.users)}
    ${kpiBlock('👁️', 'Páginas vistas', curr.pageviews, prev?.pageviews)}
  </div>

  <!-- Conversiones -->
  ${section('Clicks de conversión (leads)', '🎯',
    ['Botón / Enlace', 'Página origen', 'Clicks'],
    conversions.map(r => row([
      r.dimensionValues[0].value || '(sin texto)',
      r.dimensionValues[1].value || '/',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Formularios -->
  ${section('Formularios enviados', '📋',
    ['Formulario', 'Página', 'Envíos'],
    forms.map(r => row([
      r.dimensionValues[0].value || 'form',
      r.dimensionValues[1].value || '/',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Top botones con página -->
  ${section('Top botones clicados', '🖱️',
    ['Texto del botón', 'Categoría', 'Página origen', 'Clicks'],
    clicks.map(r => row([
      r.dimensionValues[0].value || '(sin texto)',
      r.dimensionValues[1].value || '-',
      r.dimensionValues[2].value || '/',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Por categoría -->
  ${section('Clicks por categoría', '📂',
    ['Categoría', 'Total clicks'],
    byCategory.map(r => row([
      r.dimensionValues[0].value || '-',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Scroll depth -->
  ${section('Engagement por tipo de página (scroll)', '📊',
    ['Tipo de página', 'Eventos scroll'],
    scrollDepth.map(r => row([
      r.dimensionValues[0].value || '-',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Secciones vistas -->
  ${section('Secciones más vistas', '👁️',
    ['Sección', 'Veces vista'],
    sectionViews.map(r => row([
      r.dimensionValues[0].value || '-',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Páginas más vistas -->
  ${section('Páginas más visitadas', '📄',
    ['Página', 'Vistas'],
    pages.map(r => row([
      r.dimensionValues[0].value || '/',
      r.metricValues[0].value,
    ])).join('')
  )}

  <!-- Footer -->
  <div style="text-align:center;padding:16px;color:#94a3b8;font-size:0.78rem;">
    Generado automáticamente · <a href="https://analytics.google.com" style="color:#3b82f6;">Ver GA4 completo</a>
  </div>

</div>
</body>
</html>`;

  return html;
}

async function sendEmail(html) {
  const now = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AI Security Analytics <info@aisecurity.es>',
      to: ['info@aisecurity.es'],
      subject: `📊 Informe GA4 semanal — ${now}`,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  console.log('✅ Email enviado a info@aisecurity.es');
}

const html = await buildReport();
await sendEmail(html);
