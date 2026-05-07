/**
 * analyze-and-email.js
 *
 * Lee search-console-data.json + ga4-data.json, genera análisis narrativo
 * completo y envía email HTML vía Resend.
 *
 * Uso: node scripts/seo-automation/analyze-and-email.js [extra-notes-file]
 *
 * El análisis narrativo lo genera este script automáticamente.
 * Claude solo necesita ejecutar este comando — sin generar texto.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GSC_FILE = path.join(__dirname, 'search-console-data.json');
const GA4_FILE = path.join(__dirname, 'ga4-data.json');
const CHANGES_FILE = path.join(__dirname, 'seo-changes.json');
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YG4icTFX_BY8beBj8wNbrpDYCBQn2xPci';
const TO = process.env.REPORT_EMAIL || 'julen.sistemas@gmail.com';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtPct = n => `${(n * 100).toFixed(1)}%`;
const fmtDur = s => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
const arrow = (cur, prev) => cur > prev ? `▲ +${cur - prev}` : cur < prev ? `▼ ${cur - prev}` : '→';
const arrowColor = (cur, prev) => cur > prev ? '#0a7c42' : cur < prev ? '#c5221f' : '#666';

function loadJSON(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}

// ─── load data ──────────────────────────────────────────────────────────────
const gsc = loadJSON(GSC_FILE);
const ga4 = loadJSON(GA4_FILE);
const changesLog = loadJSON(CHANGES_FILE, { changes: [] });

if (!gsc) { console.error('❌ No search-console-data.json'); process.exit(1); }

const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const periodStart = gsc.startDate || gsc.period?.startDate || '';
const periodEnd = gsc.endDate || gsc.period?.endDate || '';
const extraNotes = process.argv[2] && fs.existsSync(process.argv[2])
  ? fs.readFileSync(process.argv[2], 'utf-8') : '';

// ─── change tracking ────────────────────────────────────────────────────────

// Para cada cambio registrado, busca las métricas actuales de esa página en GSC
function evaluateChanges() {
  const results = [];
  for (const change of changesLog.changes || []) {
    // Buscar la página en topPages de GSC (normalizar URL)
    const slug = change.page.startsWith('/') ? change.page : '/' + change.page;
    const current = (gsc.topPages || []).find(p => {
      const pageSlug = p.page.replace('https://aisecurity.es', '') || '/';
      return pageSlug === slug || p.page === slug;
    });

    if (!current || !change.snapshot) {
      results.push({ ...change, status: 'no-data', current: null });
      continue;
    }

    const curClicks = current.clicks || 0;
    const curCtr = current.ctr || 0;
    const curPos = current.position || 0;
    const snap = change.snapshot;

    const clicksDelta = curClicks - (snap.clicks || 0);
    const ctrDelta = curCtr - (snap.ctr || 0);
    const posDelta = (snap.position || 0) - curPos; // positivo = mejoró posición

    // Determinar si mejoró, empeoró o sin cambio relevante
    let status = 'neutral';
    if (ctrDelta > 0.005 || clicksDelta > 3 || posDelta > 0.5) status = 'improved';
    else if (ctrDelta < -0.005 || clicksDelta < -5 || posDelta < -1) status = 'declined';

    results.push({
      ...change,
      status,
      current: { clicks: curClicks, ctr: curCtr, position: curPos },
      delta: { clicks: clicksDelta, ctr: ctrDelta, position: posDelta }
    });
  }
  return results;
}

const changeResults = evaluateChanges();

// ─── analysis ───────────────────────────────────────────────────────────────

// Clicks trend (support both JSON structures)
const cur = gsc.trend?.recent30 || gsc.totals?.current || { clicks: 0, impressions: 0 };
const prev = gsc.trend?.previous30 || gsc.totals?.previous || { clicks: 0, impressions: 0 };
const clicksDiff = cur.clicks - prev.clicks;
const clicksPct = prev.clicks > 0 ? ((clicksDiff / prev.clicks) * 100).toFixed(1) : '0';
const impDiff = cur.impressions - prev.impressions;
const impPct = prev.impressions > 0 ? ((impDiff / prev.impressions) * 100).toFixed(1) : '0';

// Top opps: high impressions, low CTR
const topOpps = (gsc.opportunities || []).slice(0, 6);
const nearTop = (gsc.nearTop || gsc.targetKeywords || []).slice(0, 6);
const newKw = (gsc.newKeywords || []).slice(0, 8);
const topKw = (gsc.topKeywords || []).slice(0, 10);
const topPages = (gsc.topPages || []).slice(0, 8);

// GA4 cross-analysis
const ga4TopPages = ga4 ? (ga4.topPages || []) : [];
const channels = ga4 ? (ga4.channels || []) : [];
const events = ga4 ? (ga4.events || []) : [];
const formStarts = events.find(e => e.event === 'form_start')?.count || 0;
const organic = channels.find(c => c.channel === 'Organic Search');
const direct = channels.find(c => c.channel === 'Direct');

// Cross: find pages with high GSC clicks but high GA4 bounce
const crossInsights = [];
if (ga4) {
  for (const gscPage of topPages) {
    const slug = gscPage.page.replace('https://aisecurity.es', '') || '/';
    const ga4Page = ga4TopPages.find(p => p.page === slug);
    if (ga4Page) {
      if (ga4Page.bounceRate > 0.6 && gscPage.clicks > 5) {
        crossInsights.push({ type: 'high-bounce', page: slug, clicks: gscPage.clicks, bounce: ga4Page.bounceRate, dur: ga4Page.avgDuration });
      } else if (ga4Page.avgDuration > 300 && gscPage.ctr < 0.03) {
        crossInsights.push({ type: 'low-ctr-engaged', page: slug, clicks: gscPage.clicks, ctr: gscPage.ctr, dur: ga4Page.avgDuration });
      }
    }
  }
}

// Change tracking HTML
let changeTrackingHtml = '';
if (changeResults.length > 0) {
  const statusIcon = s => s === 'improved' ? '✅' : s === 'declined' ? '❌' : s === 'no-data' ? '⏳' : '➡️';
  const statusColor = s => s === 'improved' ? '#0a7c42' : s === 'declined' ? '#c5221f' : '#666';
  const statusLabel = s => s === 'improved' ? 'Mejoró' : s === 'declined' ? 'Empeoró' : s === 'no-data' ? 'Sin datos aún' : 'Sin cambio relevante';

  const rows = changeResults.map(c => {
    const icon = statusIcon(c.status);
    const color = statusColor(c.status);
    const label = statusLabel(c.status);
    const snapInfo = c.snapshot ? `CTR ${(c.snapshot.ctr * 100).toFixed(1)}% · Pos ${c.snapshot.position?.toFixed(1)} · ${c.snapshot.clicks} clicks` : '—';
    const curInfo = c.current ? `CTR ${(c.current.ctr * 100).toFixed(1)}% · Pos ${c.current.position?.toFixed(1)} · ${c.current.clicks} clicks` : '—';
    const deltaInfo = c.delta ? [
      c.delta.clicks !== 0 ? `${c.delta.clicks > 0 ? '+' : ''}${c.delta.clicks} clicks` : '',
      c.delta.ctr !== 0 ? `CTR ${c.delta.ctr > 0 ? '+' : ''}${(c.delta.ctr * 100).toFixed(1)}pp` : '',
      c.delta.position !== 0 ? `Pos ${c.delta.position > 0 ? '▲' : '▼'}${Math.abs(c.delta.position).toFixed(1)}` : '',
    ].filter(Boolean).join(' · ') || '—' : '—';

    return `
    <tr style="border-bottom:1px solid #e8eaed">
      <td style="padding:10px;font-size:12px;max-width:200px">
        <div style="font-weight:600;color:#333">${c.page}</div>
        <div style="color:#888;font-size:11px;margin-top:2px">${c.description}</div>
        <div style="color:#aaa;font-size:10px;margin-top:2px">${c.date}</div>
      </td>
      <td style="padding:10px;font-size:11px;color:#666;text-align:center">${snapInfo}</td>
      <td style="padding:10px;font-size:11px;text-align:center;color:#333">${curInfo}</td>
      <td style="padding:10px;font-size:12px;text-align:center;font-weight:600;color:${color}">${deltaInfo || '—'}</td>
      <td style="padding:10px;font-size:12px;text-align:center;color:${color}">${icon} ${label}</td>
    </tr>`;
  }).join('');

  changeTrackingHtml = `
  <div style="background:white;padding:20px 28px;border-left:4px solid #fbbc04;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 6px;font-size:15px;color:#333">📋 Seguimiento de cambios anteriores</h2>
    <p style="margin:0 0 14px;font-size:11px;color:#666">Cambios aplicados en iteraciones previas y su impacto en GSC desde entonces</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr style="background:#f8f9fa">
        <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:left">Cambio</th>
        <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Antes</th>
        <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Ahora</th>
        <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Δ</th>
        <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#555;text-align:center">Estado</th>
      </tr>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// Best engaged pages from GA4
const bestEngaged = ga4TopPages.filter(p => p.avgDuration > 300 && p.bounceRate < 0.3).slice(0, 3);

// ─── build HTML ─────────────────────────────────────────────────────────────

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
  const t = k.isNew ? '<span style="color:#1a73e8">🆕</span>'
    : k.clicks > (k.prevClicks || 0) ? `<span style="color:#0a7c42">▲</span>`
    : k.clicks < (k.prevClicks || 0) ? `<span style="color:#c5221f">▼</span>` : '→';
  return tableRow(k.keyword, k.clicks, k.impressions, `${(k.ctr * 100).toFixed(1)}%`, k.position.toFixed(1), t);
}).join('');

const pageRows = topPages.map(p => {
  const slug = p.page.replace('https://aisecurity.es', '') || '/';
  const ga4p = ga4TopPages.find(x => x.page === slug);
  const bounceCell = ga4p ? fmtPct(ga4p.bounceRate) : '—';
  const durCell = ga4p ? fmtDur(ga4p.avgDuration) : '—';
  const t = p.clicks > p.prevClicks ? `<span style="color:#0a7c42">▲ +${p.clicks - p.prevClicks}</span>`
    : p.clicks < p.prevClicks ? `<span style="color:#c5221f">▼ ${p.clicks - p.prevClicks}</span>` : '→';
  return tableRow(slug, p.clicks, `${(p.ctr * 100).toFixed(1)}%`, bounceCell, durCell, t);
}).join('');

const oppRows = topOpps.map(o =>
  tableRow(o.keyword, o.impressions, `${(o.ctr * 100).toFixed(1)}%`, o.position.toFixed(1))
).join('');

const nearTopRows = nearTop.map(k =>
  tableRow(k.keyword, k.position != null ? Number(k.position).toFixed(1) : '—', k.impressions || '—', k.clicks || '—')
).join('');

// Cross-insight messages
let crossHtml = '';
if (crossInsights.length > 0) {
  const items = crossInsights.map(c => {
    if (c.type === 'high-bounce') return `<li style="margin:6px 0"><strong>${c.page}</strong>: ${c.clicks} clicks desde Google pero bounce rate ${fmtPct(c.bounce)} en GA4 y solo ${fmtDur(c.dur)} de media. El contenido no cumple la expectativa → revisar H1 y primer párrafo.</li>`;
    if (c.type === 'low-ctr-engaged') return `<li style="margin:6px 0"><strong>${c.page}</strong>: CTR bajo (${fmtPct(c.ctr)}) pero ${fmtDur(c.dur)} de duración media → los que llegan se quedan. Mejorar title/meta para atraer más.</li>`;
    return '';
  }).join('');
  crossHtml = `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">🔀 Insights GSC × GA4</h2>
    <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6">${items}</ul>
  </div>`;
}

// Best engaged pages
let engagedHtml = '';
if (bestEngaged.length > 0) {
  const items = bestEngaged.map(p =>
    `<li style="margin:6px 0"><strong>${p.page}</strong>: ${fmtDur(p.avgDuration)} media, bounce ${fmtPct(p.bounceRate)} — página que engancha, añadir CTA claro</li>`
  ).join('');
  engagedHtml = `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#0a7c42">⭐ Páginas que más enganchan (GA4)</h2>
    <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6">${items}</ul>
  </div>`;
}

// GA4 channels
let channelsHtml = '';
if (channels.length > 0) {
  const rows = channels.map(c =>
    tableRow(c.channel, c.sessions, c.activeUsers, fmtPct(c.bounceRate))
  ).join('');
  channelsHtml = `
  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">📡 Canales de tráfico (GA4)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Canal', 'Sesiones', 'Usuarios', 'Bounce')}
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// Extra notes from Claude (if any)
let notesHtml = '';
if (extraNotes.trim()) {
  const lines = extraNotes.trim().split('\n').map(l => {
    if (l.startsWith('## ')) return `<h3 style="color:#1a73e8;font-size:14px;margin:14px 0 6px">${l.replace('## ', '')}</h3>`;
    if (l.startsWith('- ')) return `<li style="margin:4px 0">${l.replace('- ', '')}</li>`;
    if (l === '') return '<br>';
    return `<p style="margin:3px 0">${l}</p>`;
  }).join('\n');
  notesHtml = `
  <div style="background:white;padding:20px 28px;border-left:4px solid #1a73e8;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">🤖 Observaciones adicionales</h2>
    <div style="font-size:13px;line-height:1.6">${lines}</div>
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>SEO+GA4 Report aisecurity.es</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;color:#333">
<div style="max-width:700px;margin:0 auto;padding:20px">

  <div style="background:#1a73e8;border-radius:12px 12px 0 0;padding:22px 28px;color:white">
    <h1 style="margin:0;font-size:20px;font-weight:700">📊 Análisis SEO+GA4 — aisecurity.es</h1>
    <p style="margin:6px 0 0;opacity:0.9;font-size:13px">${date} &nbsp;|&nbsp; ${periodStart} → ${periodEnd}</p>
  </div>

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed">
    <h2 style="margin:0 0 14px;font-size:15px;color:#1a73e8">KPIs — últimos 3 días vs 3 días anteriores</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${kpiCard('Clicks GSC', cur.clicks,
        `vs ${prev.clicks} anterior`,
        `${clicksDiff >= 0 ? '▲' : '▼'} ${clicksDiff >= 0 ? '+' : ''}${clicksPct}%`,
        clicksDiff >= 0 ? '#0a7c42' : '#c5221f')}
      ${kpiCard('Impresiones', cur.impressions.toLocaleString('es-ES'),
        `vs ${prev.impressions.toLocaleString('es-ES')}`,
        `${impDiff >= 0 ? '▲' : '▼'} ${impDiff >= 0 ? '+' : ''}${impPct}%`,
        impDiff >= 0 ? '#0a7c42' : '#c5221f')}
      ${ga4 ? kpiCard('Sesiones GA4', ga4.summary.totalSessions, `${ga4.summary.organicPct}% orgánico`, '', '') : ''}
      ${kpiCard('Oport. CTR', gsc.opportunities?.length || 0, '>30 impr, CTR <4%', '', '')}
      ${kpiCard('Kw nuevas', gsc.newKeywords?.length || 0, 'vs período anterior', '', '')}
      ${ga4 && formStarts ? kpiCard('Form starts', formStarts, 'GA4 — intención real', '', '#1a73e8') : ''}
    </div>
  </div>

  ${changeTrackingHtml}
  ${crossHtml}
  ${engagedHtml}

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">🔑 Top Keywords</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${tableHead('Keyword', 'Clicks', 'Impr.', 'CTR', 'Pos.', 'Tend.')}
      <tbody>${kwRows}</tbody>
    </table>
  </div>

  <div style="background:white;padding:20px 28px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 12px;font-size:15px;color:#1a73e8">📄 Top Páginas (GSC + GA4)</h2>
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
    <h2 style="margin:0 0 10px;font-size:15px;color:#1a73e8">🆕 Keywords nuevas detectadas</h2>
    <ul style="margin:0;padding-left:18px;font-size:12px">
      ${newKw.map(k => `<li style="margin:4px 0"><strong>${k.keyword}</strong> — ${k.impressions} impr, pos ${k.position.toFixed(1)}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${channelsHtml}
  ${notesHtml}

  <div style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:0 0 12px 12px;padding:14px 28px;text-align:center;margin-top:0">
    <p style="margin:0;font-size:11px;color:#999">Generado automáticamente — aisecurity.es &nbsp;|&nbsp; ${periodStart} → ${periodEnd}</p>
  </div>

</div>
</body>
</html>`;

// ─── update snapshots in seo-changes.json ───────────────────────────────────
// Actualiza el snapshot de cada cambio con los datos actuales para la próxima iteración
try {
  let updated = false;
  for (const result of changeResults) {
    if (result.current && result.status !== 'no-data') {
      const entry = changesLog.changes.find(c => c.id === result.id);
      if (entry) {
        entry.lastChecked = new Date().toISOString().split('T')[0];
        entry.lastMetrics = result.current;
        updated = true;
      }
    }
  }
  if (updated) {
    fs.writeFileSync(CHANGES_FILE, JSON.stringify(changesLog, null, 2));
    console.log('✅ seo-changes.json actualizado con métricas recientes');
  }
} catch (e) {
  console.warn('⚠️ No se pudo actualizar seo-changes.json:', e.message);
}

// ─── send via Resend ─────────────────────────────────────────────────────────
const subject = `📊 SEO+GA4 aisecurity.es — ${new Date().toLocaleDateString('es-ES')}`;
const body = JSON.stringify({ from: 'AI Security SEO <info@aisecurity.es>', to: [TO], subject, html });

const req = https.request({
  hostname: 'api.resend.com', path: '/emails', method: 'POST',
  headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log(`✅ Email enviado a ${TO} — "${subject}"`);
    } else {
      console.error(`❌ Resend error (${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});
req.on('error', e => { console.error('❌ Red:', e.message); process.exit(1); });
req.write(body);
req.end();