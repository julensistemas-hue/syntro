/**
 * Script 7-monthly: Fetch Search Console data mensual (28 días)
 *
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
  console.log('🔄 Fetching Search Console data (mensual 28 días)...\n');

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

  // Mes actual (últimos 28 días disponibles) vs mes anterior (28 días antes de esos)
  const current28 = getDates(28);
  const previous28 = getDates(28, 31);  // 28 días antes, sin solapar

  async function query(dates, dimensions, rowLimit = 100) {
    const res = await sc.searchanalytics.query({ siteUrl, requestBody: { ...dates, dimensions, rowLimit } });
    return res.data.rows || [];
  }

  const [kwCurrent, pagesCurrent, kwPrevious, pagesPrevious] = await Promise.all([
    query(current28, ['query'], 100),
    query(current28, ['page'], 50),
    query(previous28, ['query'], 100),
    query(previous28, ['page'], 50),
  ]);

  const prevKwMap = new Map(kwPrevious.map(r => [r.keys[0], r]));
  const prevPageMap = new Map(pagesPrevious.map(r => [r.keys[0], r]));

  const sumClicks = rows => rows.reduce((a, r) => a + r.clicks, 0);
  const sumImpressions = rows => rows.reduce((a, r) => a + r.impressions, 0);

  const data = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    period: current28,
    previousPeriod: previous28,
    periodDays: 28,
    totals: {
      current: { clicks: sumClicks(kwCurrent), impressions: sumImpressions(kwCurrent) },
      previous: { clicks: sumClicks(kwPrevious), impressions: sumImpressions(kwPrevious) },
    },
    topKeywords: kwCurrent.map(r => {
      const prev = prevKwMap.get(r.keys[0]);
      return {
        keyword: r.keys[0],
        clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
        prevClicks: prev?.clicks || 0, prevImpressions: prev?.impressions || 0,
        prevPosition: prev?.position || null, isNew: !prev,
      };
    }),
    topPages: pagesCurrent.map(r => {
      const slug = r.keys[0].replace('https://aisecurity.es', '') || '/';
      const prev = prevPageMap.get(r.keys[0]);
      return {
        page: slug, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
        prevClicks: prev?.clicks || 0, prevImpressions: prev?.impressions || 0,
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
      .filter(r => !prevKwMap.has(r.keys[0]) && r.impressions >= 3)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20)
      .map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));
  console.log('✅ search-console-data-monthly.json guardado');

  const history = loadHistory();
  history.reports.push({
    date: data.generatedAt,
    period: data.period,
    totals: data.totals,
    topKeywords: data.topKeywords.slice(0, 20),
  });
  if (history.reports.length > 12) history.reports = history.reports.slice(-12);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log('✅ seo-history-monthly.json actualizado');

  const clicksDiff = data.totals.current.clicks - data.totals.previous.clicks;
  const clicksPct = data.totals.previous.clicks > 0
    ? ((clicksDiff / data.totals.previous.clicks) * 100).toFixed(1) : 'N/A';

  console.log(`\n📊 Mes actual: ${data.totals.current.clicks} clicks | Mes anterior: ${data.totals.previous.clicks} clicks | Cambio: ${clicksDiff >= 0 ? '+' : ''}${clicksPct}%`);
  console.log(`   ${data.opportunities.length} oportunidades CTR | ${data.newKeywords.length} keywords nuevas este mes`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
