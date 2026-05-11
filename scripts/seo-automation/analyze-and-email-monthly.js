/**
 * analyze-and-email-monthly.js
 *
 * Lee search-console-data-monthly.json + ga4-data-monthly.json,
 * genera análisis mensual narrativo y envía email HTML vía Resend.
 *
 * Uso: RESEND_API_KEY=re_xxx node scripts/seo-automation/analyze-and-email-monthly.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GSC_FILE = path.join(__dirname, 'search-console-data-monthly.json');
const GA4_FILE = path.join(__dirname, 'ga4-data-monthly.json');
const HISTORY_FILE = path.join(__dirname, 'seo-history-monthly.json');
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YG4icTFX_BY8beBj8wNbrpDYCBQn2xPci';
const TO = process.env.REPORT_EMAIL || 'julen.sistemas@gmail.com';

const fmtPct = n => `${(n * 100).toFixed(1)}%`;
const fmtDur = s => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

function loadJSON(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}

const gsc = loadJSON(GSC_FILE);
const ga4 = loadJSON(GA4_FILE);
const history = loadJSON(HISTORY_FILE, { reports: [] });

if (!gsc) { console.error('❌ No search-console-data-monthly.json — ejecuta primero 7-fetch-monthly.js'); process.exit(1); }

const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
const month = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
const periodStart = gsc.period?.startDate || '';
const periodEnd = gsc.period?.endDate || '';
const prevStart = gsc.previousPeriod?.startDate || '';
const prevEnd = gsc.previousPeriod?.endDate || '';

// ─── KPIs ────────────────────────────────────────────────────────────────────
const cur = gsc.totals?.current || { clicks: 0, impressions: 0 };
const prev = gsc.totals?.previous || { clicks: 0, impressions: 0 };
const clicksDiff = cur.clicks - prev.clicks;
const clicksPct = prev.clicks > 0 ? ((clicksDiff / prev.clicks) * 100).toFixed(1) : '0';
const impDiff = cur.impressions - prev.impressions;
const impPct = prev.impressions > 0 ? ((impDiff / prev.impressions) * 100).toFixed(1) : '0';

const ga4TopPages = ga4 ? (ga4.topPages || []) : [];
const channels = ga4 ? (ga4.channels || []) : [];
const events = ga4 ? (ga4.events || []) : [];
const organic = channels.find(c => c.channel === 'Organic Search');
const formStarts = events.find(e => e.event === 'form_start')?.count || 0;
const formSubmits = events.find(e => e.event === 'form_submit')?.count || 0;

// ─── trend histórico (últimos 6 meses del historial) ─────────────────────────
const recentHistory = (history.reports || []).slice(-6);
const trendHtml = recentHistory.length >= 2 ? (() => {
  const rows = recentHistory.map(r => {
    const d = new Date(r.date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    return `<tr style="border-bottom:1px solid #e8eaed">
      <td style="padding:6px 10px;font-size:12px">${d}</td>
      <td style="padding:6px 10px;font-size:12px;text-align:center">${r.totals?.current?.clicks || 0}</td>
      <td style="padding:6px 10px;font-size:12px;text-align:center">${r.totals?.current?.impressions || 0}</td>
    </tr>`;
  }).join('');
  return `
  <div style="background:white;padding:20px 28px;border-left:4px solid #34a853;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#34a853">📈 Tendencia histórica (últimos meses)</h2>
    <table style="border-collapse:collapse;font-size:12px">
      <tr style="background:#f8f9fa">
        <th style="padding:7px 10px;font-size:11px;font-weight:600;color:#555;text-align:left">Mes</th>
        <th style="padding:7px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Clicks</th>
        <th style="padding:7px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Impresiones</th>
      </tr>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
})() : '';

// ─── top keywords con análisis de movimiento ─────────────────────────────────
const topKw = (gsc.topKeywords || []).slice(0, 15);
const topPages = (gsc.topPages || []).slice(0, 10);
const topOpps = (gsc.opportunities || []).slice(0, 8);
const nearTop = (gsc.nearTop || []).slice(0, 8);
const newKw = (gsc.newKeywords || []).slice(0, 15);

// Keywords que más crecieron
const kwGrowth = (gsc.topKeywords || [])
  .filter(k => !k.isNew && k.prevClicks > 0 && k.clicks > k.prevClicks)
  .map(k => ({ ...k, growth: k.clicks - k.prevClicks, growthPct: ((k.clicks - k.prevClicks) / k.prevClicks * 100).toFixed(0) }))
  .sort((a, b) => b.growth - a.growth)
  .slice(0, 5);

// Keywords que cayeron
const kwDeclines = (gsc.topKeywords || [])
  .filter(k => !k.isNew && k.prevClicks > 2 && k.clicks < k.prevClicks)
  .map(k => ({ ...k, drop: k.prevClicks - k.clicks }))
  .sort((a, b) => b.drop - a.drop)
  .slice(0, 5);

// ─── cross-insights GSC × GA4 ────────────────────────────────────────────────
const crossInsights = [];
if (ga4) {
  for (const gscPage of topPages) {
    const slug = gscPage.page.replace('https://aisecurity.es', '') || '/';
    const ga4Page = ga4TopPages.find(p => p.page === slug);
    if (ga4Page) {
      if (ga4Page.bounceRate > 0.65 && gscPage.clicks > 10) {
        crossInsights.push({ type: 'high-bounce', page: slug, clicks: gscPage.clicks, bounce: ga4Page.bounceRate, dur: ga4Page.avgDuration });
      }
      if (ga4Page.avgDuration > 300 && gscPage.ctr < 0.03) {
        crossInsights.push({ type: 'low-ctr-engaged', page: slug, clicks: gscPage.clicks, ctr: gscPage.ctr, dur: ga4Page.avgDuration });
      }
    }
  }
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────
function kpiCard(label, value, sub, trend, trendColor) {
  return `
    <div style="flex:1;min-width:130px;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:26px;font-weight:700;color:#1a73e8">${value}</div>
      <div style="font-size:11px;color:#666;margin-top:4px">${label}</div>
      ${trend ? `<div style="font-size:12px;margin-top:6px;color:${trendColor}">${trend}</div>` : ''}
      ${sub ? `<div style="font-size:10px;color:#999">${sub}</div>` : ''}
    </div>`;
}

function tableRow(...cells) {
  return `<tr style="border-bottom:1px solid #e8eaed">${cells.map((c, i) =>
    `<td style="padding:7px 10px;font-size:12px;${i === 0 ? 'max-width:220px;word-break:break-all' : 'text-align:center'}">${c}</td>`
  ).join('')}</tr>`;
}

function tableHead(...headers) {
  return `<tr style="background:#f8f9fa">${headers.map(h =>
    `<th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:${h === headers[0] ? 'left' : 'center'}">${h}</th>`
  ).join('')}</tr>`;
}

const kwRows = topKw.map(k => {
  const trend = k.isNew ? '<span style="color:#1a73e8">🆕</span>'
    : k.clicks > (k.prevClicks || 0) ? `<span style="color:#0a7c42">▲ +${k.clicks - k.prevClicks}</span>`
    : k.clicks < (k.prevClicks || 0) ? `<span style="color:#c5221f">▼ ${k.clicks - k.prevClicks}</span>` : '→';
  const posTrend = k.prevPosition
    ? (k.position < k.prevPosition ? `<span style="color:#0a7c42">▲${(k.prevPosition - k.position).toFixed(1)}</span>`
       : k.position > k.prevPosition ? `<span style="color:#c5221f">▼${(k.position - k.prevPosition).toFixed(1)}</span>` : '→')
    : '—';
  return tableRow(k.keyword, k.clicks, k.impressions, `${(k.ctr * 100).toFixed(1)}%`, k.position.toFixed(1), trend, posTrend);
}).join('');

const pageRows = topPages.map(p => {
  const slug = p.page.replace('https://aisecurity.es', '') || '/';
  const ga4p = ga4TopPages.find(x => x.page === slug);
  const bounceCell = ga4p ? fmtPct(ga4p.bounceRate) : '—';
  const durCell = ga4p ? fmtDur(ga4p.avgDuration) : '—';
  const trend = p.clicks > p.prevClicks ? `<span style="color:#0a7c42">▲ +${p.clicks - p.prevClicks}</span>`
    : p.clicks < p.prevClicks ? `<span style="color:#c5221f">▼ ${p.clicks - p.prevClicks}</span>` : '→';
  return tableRow(slug, p.clicks, `${(p.ctr * 100).toFixed(1)}%`, bounceCell, durCell, trend);
}).join('');

const oppRows = topOpps.map(o =>
  tableRow(o.keyword, o.impressions, `${(o.ctr * 100).toFixed(1)}%`, o.position.toFixed(1))
).join('');

const nearTopRows = nearTop.map(k =>
  tableRow(k.keyword, k.position.toFixed(1), k.impressions, k.clicks)
).join('');

// Keywords que crecieron
const growthHtml = kwGrowth.length > 0 ? `
  <div style="background:white;padding:20px 28px;border-left:4px solid #0a7c42;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#0a7c42">🚀 Keywords con mayor crecimiento este mes</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Clicks este mes', 'Clicks mes ant.', 'Crecimiento')}
      <tbody>${kwGrowth.map(k => tableRow(k.keyword, k.clicks, k.prevClicks, `<span style="color:#0a7c42">+${k.growth} (+${k.growthPct}%)</span>`)).join('')}</tbody>
    </table>
  </div>` : '';

// Keywords que cayeron
const declinesHtml = kwDeclines.length > 0 ? `
  <div style="background:white;padding:20px 28px;border-left:4px solid #fbbc04;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#b06000">⚠️ Keywords con bajada de tráfico</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Clicks este mes', 'Clicks mes ant.', 'Caída')}
      <tbody>${kwDeclines.map(k => tableRow(k.keyword, k.clicks, k.prevClicks, `<span style="color:#c5221f">-${k.drop}</span>`)).join('')}</tbody>
    </table>
  </div>` : '';

// Cross-insights
const crossHtml = crossInsights.length > 0 ? `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">🔀 Insights GSC × GA4</h2>
    <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6">
      ${crossInsights.map(c => {
        if (c.type === 'high-bounce') return `<li style="margin:6px 0"><strong>${c.page}</strong>: ${c.clicks} clicks desde Google pero bounce rate ${fmtPct(c.bounce)} y ${fmtDur(c.dur)} media → el contenido no cumple la expectativa, revisar H1 y primer párrafo</li>`;
        if (c.type === 'low-ctr-engaged') return `<li style="margin:6px 0"><strong>${c.page}</strong>: CTR bajo (${fmtPct(c.ctr)}) pero ${fmtDur(c.dur)} de duración → los que llegan se quedan, mejorar title/meta para atraer más</li>`;
        return '';
      }).join('')}
    </ul>
  </div>` : '';

// GA4 canales
const channelsHtml = channels.length > 0 ? `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">📡 Canales de tráfico — 28 días (GA4)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Canal', 'Sesiones', 'Usuarios', 'Bounce', 'Conversiones')}
      <tbody>${channels.map(c => tableRow(c.channel, c.sessions, c.activeUsers, fmtPct(c.bounceRate), c.conversions)).join('')}</tbody>
    </table>
  </div>` : '';

// ─── resumen ejecutivo narrativo ──────────────────────────────────────────────
const clicksTrend = clicksDiff > 0 ? `creció un <strong style="color:#0a7c42">+${clicksPct}%</strong>` : clicksDiff < 0 ? `bajó un <strong style="color:#c5221f">${clicksPct}%</strong>` : 'se mantuvo estable';
const impTrend = impDiff > 0 ? `subió un <strong style="color:#0a7c42">+${impPct}%</strong>` : impDiff < 0 ? `bajó un <strong style="color:#c5221f">${impPct}%</strong>` : 'se mantuvo';
const organicSummary = ga4 ? `El tráfico orgánico representa <strong>${ga4.summary.organicPct}%</strong> de las ${ga4.summary.totalSessions} sesiones totales en GA4.` : '';
const formSummary = formStarts > 0 ? `Se registraron <strong>${formStarts} inicios de formulario</strong>${formSubmits > 0 ? ` y <strong>${formSubmits} envíos</strong>` : ''} durante el mes.` : '';

const execSummaryHtml = `
  <div style="background:#e8f0fe;padding:20px 28px;border-left:4px solid #1a73e8;border-right:1px solid #e8eaed;margin-top:8px;border-radius:4px">
    <h2 style="margin:0 0 10px;font-size:15px;color:#1a73e8">📝 Resumen ejecutivo — ${month}</h2>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#333">
      Durante los últimos 28 días, el tráfico de búsqueda ${clicksTrend} respecto al mes anterior
      (${cur.clicks} vs ${prev.clicks} clicks). Las impresiones ${impTrend} (${cur.impressions.toLocaleString('es-ES')} vs ${prev.impressions.toLocaleString('es-ES')}).
      ${organicSummary}
    </p>
    ${newKw.length > 0 ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#333">Se detectaron <strong>${newKw.length} keywords nuevas</strong> este mes, con ${topOpps.length} oportunidades de mejora de CTR identificadas.</p>` : ''}
    ${formSummary ? `<p style="margin:0;font-size:13px;line-height:1.7;color:#333">${formSummary}</p>` : ''}
  </div>`;

// ─── build final HTML ─────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Informe SEO Mensual aisecurity.es — ${month}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;color:#333">
<div style="max-width:720px;margin:0 auto;padding:20px">

  <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);border-radius:12px 12px 0 0;padding:24px 28px;color:white">
    <h1 style="margin:0;font-size:22px;font-weight:700">📊 Informe SEO Mensual — aisecurity.es</h1>
    <p style="margin:6px 0 0;opacity:0.9;font-size:13px">${date} &nbsp;|&nbsp; Período: ${periodStart} → ${periodEnd}</p>
    <p style="margin:4px 0 0;opacity:0.7;font-size:11px">Comparado con: ${prevStart} → ${prevEnd}</p>
  </div>

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed">
    <h2 style="margin:0 0 14px;font-size:15px;color:#1a73e8">KPIs mensual — 28 días vs mes anterior</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${kpiCard('Clicks GSC', cur.clicks, `vs ${prev.clicks} anterior`,
        `${clicksDiff >= 0 ? '▲' : '▼'} ${clicksDiff >= 0 ? '+' : ''}${clicksPct}%`,
        clicksDiff >= 0 ? '#0a7c42' : '#c5221f')}
      ${kpiCard('Impresiones', cur.impressions.toLocaleString('es-ES'), `vs ${prev.impressions.toLocaleString('es-ES')}`,
        `${impDiff >= 0 ? '▲' : '▼'} ${impDiff >= 0 ? '+' : ''}${impPct}%`,
        impDiff >= 0 ? '#0a7c42' : '#c5221f')}
      ${ga4 ? kpiCard('Sesiones GA4', ga4.summary.totalSessions, `${ga4.summary.organicPct}% orgánico`, '', '') : ''}
      ${ga4 ? kpiCard('Usuarios únicos', ga4.summary.totalUsers || '—', '28 días', '', '') : ''}
      ${kpiCard('Opor. CTR', gsc.opportunities?.length || 0, 'alto impresión, bajo CTR', '', '')}
      ${kpiCard('Kw nuevas', newKw.length, 'detectadas este mes', '', '#1a73e8')}
      ${formStarts ? kpiCard('Form starts', formStarts, formSubmits ? `${formSubmits} enviados` : 'GA4', '', '#1a73e8') : ''}
    </div>
  </div>

  ${execSummaryHtml}
  ${trendHtml}
  ${growthHtml}
  ${declinesHtml}
  ${crossHtml}

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">🔑 Top Keywords — 28 días</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Clicks', 'Impr.', 'CTR', 'Pos.', 'Δ Clicks', 'Δ Pos.')}
      <tbody>${kwRows}</tbody>
    </table>
  </div>

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">📄 Top Páginas (GSC + GA4) — 28 días</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Página', 'Clicks', 'CTR', 'Bounce', 'Duración', 'Tend.')}
      <tbody>${pageRows}</tbody>
    </table>
  </div>

  ${oppRows ? `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 6px;font-size:15px;color:#1a73e8">⚡ Oportunidades CTR</h2>
    <p style="margin:0 0 12px;font-size:11px;color:#666">Alta visibilidad, bajo CTR — mejorar title/meta puede doblar el tráfico</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Impr.', 'CTR', 'Pos.')}
      <tbody>${oppRows}</tbody>
    </table>
  </div>` : ''}

  ${nearTopRows ? `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 6px;font-size:15px;color:#1a73e8">🎯 Keywords cerca del Top 3 (pos 4-15)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Pos.', 'Impr.', 'Clicks')}
      <tbody>${nearTopRows}</tbody>
    </table>
  </div>` : ''}

  ${newKw.length ? `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 10px;font-size:15px;color:#1a73e8">🆕 Keywords nuevas este mes (${newKw.length})</h2>
    <ul style="margin:0;padding-left:18px;font-size:12px;columns:2;gap:20px">
      ${newKw.map(k => `<li style="margin:4px 0"><strong>${k.keyword}</strong> — ${k.impressions} impr, pos ${k.position.toFixed(1)}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${channelsHtml}

  <div style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:0 0 12px 12px;padding:14px 28px;text-align:center;margin-top:0">
    <p style="margin:0;font-size:11px;color:#999">Informe mensual generado automáticamente — aisecurity.es &nbsp;|&nbsp; ${periodStart} → ${periodEnd}</p>
  </div>

</div>
</body>
</html>`;

// ─── send via Resend ──────────────────────────────────────────────────────────
const subject = `📊 Informe SEO Mensual aisecurity.es — ${month}`;
const body = JSON.stringify({
  from: 'AI Security SEO <info@aisecurity.es>',
  to: [TO],
  subject,
  html,
});

const req = https.request({
  hostname: 'api.resend.com', path: '/emails', method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log(`✅ Email mensual enviado a ${TO} — "${subject}"`);
    } else {
      console.error(`❌ Resend error (${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});
req.on('error', e => { console.error('❌ Red:', e.message); process.exit(1); });
req.write(body);
req.end();
