/**
 * Script: generate-email.js
 * Lee search-console-data.json y genera /tmp/seo-report-email.html
 *
 * Uso: node scripts/seo-automation/generate-email.js [analysis-text-file]
 *
 * Si se pasa un archivo de análisis, lo incluye en el email.
 * Si no, genera solo las tablas de datos.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'search-console-data.json');
const OUTPUT = '/tmp/seo-report-email.html';

if (!fs.existsSync(DATA_FILE)) {
  console.error('❌ No se encontró search-console-data.json. Ejecuta primero 7-fetch-and-save.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Análisis externo opcional
const analysisFile = process.argv[2];
let analysisHtml = '';
if (analysisFile && fs.existsSync(analysisFile)) {
  const raw = fs.readFileSync(analysisFile, 'utf-8');
  // Convertir texto plano a HTML básico
  analysisHtml = raw
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) return `<h3 style="color:#1a73e8;margin:20px 0 8px">${line.replace('## ', '')}</h3>`;
      if (line.startsWith('### ')) return `<h4 style="color:#333;margin:16px 0 6px">${line.replace('### ', '')}</h4>`;
      if (line.startsWith('- ')) return `<li style="margin:4px 0">${line.replace('- ', '')}</li>`;
      if (line.startsWith('**') && line.endsWith('**')) return `<strong>${line.replace(/\*\*/g, '')}</strong>`;
      if (line === '') return '<br>';
      return `<p style="margin:4px 0">${line}</p>`;
    })
    .join('\n');
}

// Calcular cambios
const clicksDiff = data.totals.current.clicks - data.totals.previous.clicks;
const clicksPct = data.totals.previous.clicks > 0
  ? ((clicksDiff / data.totals.previous.clicks) * 100).toFixed(1)
  : '0';
const impDiff = data.totals.current.impressions - data.totals.previous.impressions;

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';
const clicksArrow = clicksDiff >= 0 ? `<span style="color:#0a7c42">${arrowUp} +${clicksPct}%</span>` : `<span style="color:#c5221f">${arrowDown} ${clicksPct}%</span>`;
const impArrow = impDiff >= 0 ? `<span style="color:#0a7c42">${arrowUp}</span>` : `<span style="color:#c5221f">${arrowDown}</span>`;

const generatedDate = new Date(data.generatedAt).toLocaleDateString('es-ES', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// Top keywords rows
const kwRows = data.topKeywords.slice(0, 12).map(k => {
  const trend = k.isNew
    ? '<span style="color:#1a73e8">🆕 nueva</span>'
    : k.clicks > k.prevClicks
      ? `<span style="color:#0a7c42">${arrowUp} +${k.clicks - k.prevClicks}</span>`
      : k.clicks < k.prevClicks
        ? `<span style="color:#c5221f">${arrowDown} ${k.clicks - k.prevClicks}</span>`
        : '&rarr;';
  return `
    <tr style="border-bottom:1px solid #e8eaed">
      <td style="padding:8px 12px;font-size:13px">${k.keyword}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:600">${k.clicks}</td>
      <td style="padding:8px 12px;text-align:center">${k.impressions}</td>
      <td style="padding:8px 12px;text-align:center">${(k.ctr * 100).toFixed(1)}%</td>
      <td style="padding:8px 12px;text-align:center">${k.position.toFixed(1)}</td>
      <td style="padding:8px 12px;text-align:center">${trend}</td>
    </tr>`;
}).join('');

// Top pages rows
const pageRows = data.topPages.slice(0, 8).map(p => {
  const trend = p.clicks > p.prevClicks
    ? `<span style="color:#0a7c42">${arrowUp} +${p.clicks - p.prevClicks}</span>`
    : p.clicks < p.prevClicks
      ? `<span style="color:#c5221f">${arrowDown} ${p.clicks - p.prevClicks}</span>`
      : '&rarr;';
  return `
    <tr style="border-bottom:1px solid #e8eaed">
      <td style="padding:8px 12px;font-size:12px;max-width:280px;word-break:break-all">${p.page}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:600">${p.clicks}</td>
      <td style="padding:8px 12px;text-align:center">${(p.ctr * 100).toFixed(1)}%</td>
      <td style="padding:8px 12px;text-align:center">${p.position.toFixed(1)}</td>
      <td style="padding:8px 12px;text-align:center">${trend}</td>
    </tr>`;
}).join('');

// Opportunities rows
const oppRows = data.opportunities.slice(0, 8).map(o => `
    <tr style="border-bottom:1px solid #e8eaed">
      <td style="padding:8px 12px;font-size:13px">${o.keyword}</td>
      <td style="padding:8px 12px;text-align:center">${o.impressions}</td>
      <td style="padding:8px 12px;text-align:center;color:#c5221f">${(o.ctr * 100).toFixed(1)}%</td>
      <td style="padding:8px 12px;text-align:center">${o.position.toFixed(1)}</td>
    </tr>`).join('');

// Near top rows
const nearTopItems = data.nearTop.slice(0, 6).map(k =>
  `<li style="margin:6px 0"><strong>${k.keyword}</strong> — pos ${k.position.toFixed(1)}, ${k.impressions} impresiones, ${k.clicks} clicks</li>`
).join('');

// New keywords
const newKwItems = data.newKeywords.slice(0, 8).map(k =>
  `<li style="margin:6px 0"><strong>${k.keyword}</strong> — ${k.impressions} impresiones, pos ${k.position.toFixed(1)}</li>`
).join('');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEO Report aisecurity.es</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;color:#333">

<div style="max-width:680px;margin:0 auto;padding:20px">

  <!-- Header -->
  <div style="background:#1a73e8;border-radius:12px 12px 0 0;padding:24px 32px;color:white">
    <h1 style="margin:0;font-size:22px;font-weight:700">📊 SEO Report — aisecurity.es</h1>
    <p style="margin:6px 0 0;opacity:0.9;font-size:14px">${generatedDate} &nbsp;|&nbsp; Período: ${data.period.startDate} → ${data.period.endDate}</p>
  </div>

  <!-- KPIs -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed">
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a73e8">Resumen 28 días</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:140px;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#1a73e8">${data.totals.current.clicks}</div>
        <div style="font-size:12px;color:#666;margin-top:4px">Clicks totales</div>
        <div style="font-size:13px;margin-top:6px">${clicksArrow}</div>
        <div style="font-size:11px;color:#999">vs ${data.totals.previous.clicks} anterior</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#1a73e8">${data.totals.current.impressions.toLocaleString('es-ES')}</div>
        <div style="font-size:12px;color:#666;margin-top:4px">Impresiones</div>
        <div style="font-size:13px;margin-top:6px">${impArrow}</div>
        <div style="font-size:11px;color:#999">vs ${data.totals.previous.impressions.toLocaleString('es-ES')} anterior</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#1a73e8">${data.opportunities.length}</div>
        <div style="font-size:12px;color:#666;margin-top:4px">Oportunidades CTR</div>
        <div style="font-size:11px;color:#999;margin-top:6px">>30 impr, CTR &lt;4%</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#1a73e8">${data.newKeywords.length}</div>
        <div style="font-size:12px;color:#666;margin-top:4px">Keywords nuevas</div>
        <div style="font-size:11px;color:#999;margin-top:6px">vs período anterior</div>
      </div>
    </div>
  </div>

  ${analysisHtml ? `
  <!-- Análisis IA -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;border-top:2px solid #1a73e8;margin-top:8px;border-radius:0">
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a73e8">🤖 Análisis y recomendaciones</h2>
    <div style="font-size:13px;line-height:1.6">${analysisHtml}</div>
  </div>
  ` : ''}

  <!-- Top Keywords -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a73e8">Top Keywords (28 días)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8f9fa">
          <th style="padding:10px 12px;text-align:left;font-weight:600;color:#555">Keyword</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Clicks</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Impr.</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">CTR</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Pos.</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Tend.</th>
        </tr>
      </thead>
      <tbody>${kwRows}</tbody>
    </table>
  </div>

  <!-- Top Pages -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a73e8">Top Páginas (28 días)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8f9fa">
          <th style="padding:10px 12px;text-align:left;font-weight:600;color:#555">Página</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Clicks</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">CTR</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Pos.</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Tend.</th>
        </tr>
      </thead>
      <tbody>${pageRows}</tbody>
    </table>
  </div>

  ${oppRows ? `
  <!-- Oportunidades CTR -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 8px;font-size:16px;color:#1a73e8">⚡ Oportunidades de CTR</h2>
    <p style="margin:0 0 16px;font-size:12px;color:#666">Keywords con alta visibilidad y bajo CTR — mejorar title/description puede doblar el tráfico sin cambiar posición</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#fff8e1">
          <th style="padding:10px 12px;text-align:left;font-weight:600;color:#555">Keyword</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Impr.</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">CTR actual</th>
          <th style="padding:10px 12px;text-align:center;font-weight:600;color:#555">Posición</th>
        </tr>
      </thead>
      <tbody>${oppRows}</tbody>
    </table>
  </div>
  ` : ''}

  ${nearTopItems ? `
  <!-- Near Top -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 8px;font-size:16px;color:#1a73e8">🎯 Keywords cerca del Top 3 (pos 4-15)</h2>
    <p style="margin:0 0 12px;font-size:12px;color:#666">Las más rentables de empujar con contenido, FAQs o links internos</p>
    <ul style="margin:0;padding-left:20px;font-size:13px">${nearTopItems}</ul>
  </div>
  ` : ''}

  ${newKwItems ? `
  <!-- New Keywords -->
  <div style="background:white;padding:24px 32px;border-left:1px solid #e8eaed;border-right:1px solid #e8eaed;margin-top:8px">
    <h2 style="margin:0 0 8px;font-size:16px;color:#1a73e8">🆕 Keywords nuevas detectadas</h2>
    <ul style="margin:0;padding-left:20px;font-size:13px">${newKwItems}</ul>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="background:#f8f9fa;border:1px solid #e8eaed;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center">
    <p style="margin:0;font-size:12px;color:#999">Generado automáticamente por el agente SEO de aisecurity.es &nbsp;|&nbsp; ${data.period.startDate} → ${data.period.endDate}</p>
  </div>

</div>
</body>
</html>`;

fs.writeFileSync(OUTPUT, html);
console.log(`✅ Email HTML generado: ${OUTPUT}`);
console.log(`   Tamaño: ${Math.round(html.length / 1024)}KB`);
