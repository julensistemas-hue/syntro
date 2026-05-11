/**
 * Script 7-monthly: Fetch Search Console data — ventana mensual
 *
 * Obtiene últimos 30 días vs 30 días anteriores (con offset de 3 días por delay de GSC).
 * Output:
 *   - scripts/seo-automation/search-console-data-monthly.json
 *   - scripts/seo-automation/seo-history-monthly.json
 *
 * Uso: node scripts/seo-automation/7-fetch-monthly.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const OUTPUT_JSON = path.join(__dirname, 'search-console-data-monthly.json');
const HISTORY_FILE = path.join(__dirname, 'seo-history-monthly.json');

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
  console.log('🔄 Fetching Search Console data (mensual)...\n');

  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8'));
  } else {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  }

  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const authClient = await auth.getClient();
  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  const sitesRes = await sc.sites.list();
  const site = (sitesRes.data.siteEntry || []).find(s => s.siteUrl.includes('aisecurity.es'));
  if (!site) throw new Error('Propiedad aisecurity.es no encontrada');
  const siteUrl = site.siteUrl;

  // Últimos 30 días vs 30 días anteriores (sin solapamiento)
  const currentMonth = getDates(30);        // días 3–33 atrás
  const previousMonth = getDates(30, 33);   // días 33–63 atrás

  async function query(dates, dimensions, rowLimit = 100) {
    const res = await sc.searchanalytics.query({ siteUrl, requestBody: { ...dates, dimensions, rowLimit } });
    return res.data.rows || [];
  }

  const [kwCurrent, pagesCurrent, kwPrevious, pagesPrevious] = await Promise.all([
    query(currentMonth, ['query'], 200),
    query(currentMonth, ['page'], 50),
    query(previousMonth, ['query'], 200),
    query(previousMonth, ['page'], 50),
  ]);

  const prevKwMap = new Map(kwPrevious.map(r => [r.keys[0], r]));
  const prevPageMap = new Map(pagesPrevious.map(r => [r.keys[0], r]));

  const sumClicks = rows => rows.reduce((a, r) => a + r.clicks, 0);
  const sumImpressions = rows => rows.reduce((a, r) => a + r.impressions, 0);

  const data = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    period: currentMonth,
    previousPeriod: previousMonth,
    periodDays: 30,
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
        prevPosition: prev?.position || null,
      };
    }),
    opportunities: kwCurrent
      .filter(r => r.impressions >= 20 && r.ctr < 0.04 && r.position < 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    nearTop: kwCurrent
      .filter(r => r.position >= 4 && r.position <= 15 && r.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    newKeywords: kwCurrent
      .filter(r => !prevKwMap.has(r.keys[0]) && r.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));
  console.log('✅ search-console-data-monthly.json guardado');

  // Historial mensual (máx. 12 meses)
  const history = loadHistory();
  history.reports.push({ date: data.generatedAt, totals: data.totals, topKeywords: data.topKeywords.slice(0, 20) });
  if (history.reports.length > 12) history.reports = history.reports.slice(-12);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log('✅ seo-history-monthly.json actualizado');

  console.log(`\n📊 Mensual: ${data.totals.current.clicks} clicks | ${data.totals.previous.clicks} clicks mes anterior | ${data.opportunities.length} oportunidades`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
