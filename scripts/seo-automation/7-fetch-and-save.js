/**
 * Script 7: Fetch Search Console data y guarda historial
 *
 * Solo obtiene datos y los guarda. El análisis lo hace Claude.
 * Output:
 *   - scripts/seo-automation/search-console-data.json  (datos actuales)
 *   - scripts/seo-automation/seo-history.json          (historial de reportes)
 *   - docs/seo/search-console-data.md                  (legible por Claude)
 *
 * Uso: node scripts/seo-automation/7-fetch-and-save.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const OUTPUT_JSON = path.join(__dirname, 'search-console-data.json');
const HISTORY_FILE = path.join(__dirname, 'seo-history.json');
const OUTPUT_MD = path.join(__dirname, '../../docs/seo/search-console-data.md');

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

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  return { reports: [] };
}

async function main() {
  console.log('🔄 Fetching Search Console data...\n');

  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8'));
  } else {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  }

  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const authClient = await auth.getClient();
  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  // Detectar propiedad
  const sitesRes = await sc.sites.list();
  const site = (sitesRes.data.siteEntry || []).find(s => s.siteUrl.includes('aisecurity.es'));
  if (!site) throw new Error('Propiedad aisecurity.es no encontrada');
  const siteUrl = site.siteUrl;

  // Últimos 3 días vs 3 días anteriores (el trigger corre 2x/semana)
  // GSC tiene delay de ~3 días, por eso offsetDays=3 por defecto
  const current3 = getDates(3);          // últimos 3 días disponibles
  const previous3 = getDates(3, 6);      // los 3 días anteriores a esos
  const current90 = getDates(90);        // tendencia larga para detectar nuevas keywords

  async function query(dates, dimensions, rowLimit = 100) {
    const res = await sc.searchanalytics.query({ siteUrl, requestBody: { ...dates, dimensions, rowLimit } });
    return res.data.rows || [];
  }

  const [kwCurrent, pagesCurrent, kwPrevious, pagesPrevious, kw90] = await Promise.all([
    query(current3, ['query'], 100),
    query(current3, ['page'], 30),
    query(previous3, ['query'], 100),
    query(previous3, ['page'], 30),
    query(current90, ['query'], 50),
  ]);

  const prevKwMap = new Map(kwPrevious.map(r => [r.keys[0], r]));
  const prevPageMap = new Map(pagesPrevious.map(r => [r.keys[0], r]));

  const sumClicks = rows => rows.reduce((a, r) => a + r.clicks, 0);
  const sumImpressions = rows => rows.reduce((a, r) => a + r.impressions, 0);

  const data = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    period: current3,
    periodDays: 3,
    totals: {
      current: { clicks: sumClicks(kwCurrent), impressions: sumImpressions(kwCurrent) },
      previous: { clicks: sumClicks(kwPrevious), impressions: sumImpressions(kwPrevious) },
    },
    topKeywords: kwCurrent.map(r => {
      const prev = prevKwMap.get(r.keys[0]);
      return {
        keyword: r.keys[0],
        clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
        prevClicks: prev?.clicks || 0, prevPosition: prev?.position || null, isNew: !prev,
      };
    }),
    topPages: pagesCurrent.map(r => {
      const slug = r.keys[0].replace('https://aisecurity.es', '') || '/';
      const prev = prevPageMap.get(r.keys[0]);
      return {
        page: slug, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
        prevClicks: prev?.clicks || 0,
      };
    }),
    trending90: kw90.map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
    opportunities: kwCurrent
      .filter(r => r.impressions >= 5 && r.ctr < 0.04 && r.position < 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    nearTop: kwCurrent
      .filter(r => r.position >= 4 && r.position <= 15 && r.impressions >= 2)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    newKeywords: kwCurrent
      .filter(r => !prevKwMap.has(r.keys[0]) && r.impressions >= 2)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
  };

  // Guardar JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));
  console.log('✅ search-console-data.json guardado');

  // Guardar historial
  const history = loadHistory();
  history.reports.push({ date: data.generatedAt, totals: data.totals, topKeywords: data.topKeywords.slice(0, 20) });
  if (history.reports.length > 16) history.reports = history.reports.slice(-16);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log('✅ seo-history.json actualizado');

  // Guardar MD para Claude
  const clicksDiff = data.totals.current.clicks - data.totals.previous.clicks;
  const clicksPct = data.totals.previous.clicks > 0 ? ((clicksDiff / data.totals.previous.clicks) * 100).toFixed(1) : 'N/A';
  const md = [
    `# Search Console Data — aisecurity.es`,
    `**Generado:** ${new Date(data.generatedAt).toLocaleString('es-ES')}`,
    `**Período actual:** ${data.period.startDate} → ${data.period.endDate}`,
    '',
    `## Totales (3 días)`,
    `| | Actual | Anterior | Cambio |`,
    `|--|--|--|--|`,
    `| Clicks | ${data.totals.current.clicks} | ${data.totals.previous.clicks} | ${clicksDiff >= 0 ? '+' : ''}${clicksPct}% |`,
    `| Impresiones | ${data.totals.current.impressions} | ${data.totals.previous.impressions} | - |`,
    '',
    `## Top 15 Keywords (3 días)`,
    `| Keyword | Clicks | Impresiones | CTR | Posición | vs anterior |`,
    `|---------|--------|-------------|-----|----------|-------------|`,
    ...data.topKeywords.slice(0, 15).map(k =>
      `| ${k.keyword} | ${k.clicks} | ${k.impressions} | ${(k.ctr*100).toFixed(1)}% | ${k.position.toFixed(1)} | ${k.isNew ? '🆕 nueva' : k.clicks > k.prevClicks ? `📈 +${k.clicks - k.prevClicks}` : k.clicks < k.prevClicks ? `📉 ${k.clicks - k.prevClicks}` : '➡️'} |`
    ),
    '',
    `## Top Páginas (3 días)`,
    `| Página | Clicks | CTR | Posición | vs anterior |`,
    `|--------|--------|-----|----------|-------------|`,
    ...data.topPages.slice(0, 12).map(p =>
      `| ${p.page} | ${p.clicks} | ${(p.ctr*100).toFixed(1)}% | ${p.position.toFixed(1)} | ${p.clicks > p.prevClicks ? `📈 +${p.clicks - p.prevClicks}` : p.clicks < p.prevClicks ? `📉 ${p.clicks - p.prevClicks}` : '➡️'} |`
    ),
    '',
    `## Oportunidades CTR (impresiones altas, clicks bajos)`,
    `| Keyword | Impresiones | CTR | Posición |`,
    `|---------|-------------|-----|----------|`,
    ...data.opportunities.slice(0, 10).map(o =>
      `| ${o.keyword} | ${o.impressions} | ${(o.ctr*100).toFixed(1)}% | ${o.position.toFixed(1)} |`
    ),
    '',
    `## Keywords cerca del Top 3 (posición 4-15)`,
    ...data.nearTop.map(k => `- **${k.keyword}** — pos ${k.position.toFixed(1)}, ${k.impressions} impresiones`),
    '',
    `## Keywords nuevas esta semana`,
    ...data.newKeywords.map(k => `- **${k.keyword}** — ${k.impressions} impresiones, pos ${k.position.toFixed(1)}`),
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md);
  console.log('✅ docs/seo/search-console-data.md actualizado');
  console.log(`\n📊 Resumen: ${data.totals.current.clicks} clicks | ${data.opportunities.length} oportunidades | ${data.newKeywords.length} keywords nuevas`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
