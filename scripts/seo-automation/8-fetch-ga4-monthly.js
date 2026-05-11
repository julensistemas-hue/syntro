/**
 * Script 8-monthly: Fetch Google Analytics 4 data — ventana mensual
 *
 * Obtiene últimos 30 días vs 30 días anteriores.
 * Output:
 *   - scripts/seo-automation/ga4-data-monthly.json
 *
 * Uso: node scripts/seo-automation/8-fetch-ga4-monthly.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const OUTPUT_JSON = path.join(__dirname, 'ga4-data-monthly.json');
const PROPERTY_ID = '519124169';

function getDates(daysBack, offsetDays = 1) {
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

async function main() {
  console.log('🔄 Fetching GA4 data (mensual)...\n');

  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8'));
  } else {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const authClient = await auth.getClient();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });

  // 30 días vs 30 días anteriores (sin solapamiento)
  const currentMonth = getDates(30);      // días 1–30 atrás
  const previousMonth = getDates(30, 31); // días 31–60 atrás

  async function runReport(dateRange, dimensions, metrics, limit = 20, orderBy = null) {
    const body = {
      dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: metrics.map(m => ({ name: m })),
      limit,
    };
    if (orderBy) body.orderBys = orderBy;
    const res = await analyticsdata.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: body,
    });
    return res.data.rows || [];
  }

  const [topPagesRows, topPagesPrevRows, channelRows, eventRows, countryRows, deviceRows] = await Promise.all([
    runReport(currentMonth, ['pagePath'], ['sessions', 'activeUsers', 'bounceRate', 'averageSessionDuration', 'screenPageViews'], 25, [{ metric: { metricName: 'sessions' }, desc: true }]),
    runReport(previousMonth, ['pagePath'], ['sessions', 'activeUsers'], 25, [{ metric: { metricName: 'sessions' }, desc: true }]),
    runReport(currentMonth, ['sessionDefaultChannelGroup'], ['sessions', 'activeUsers', 'bounceRate', 'conversions'], 10, [{ metric: { metricName: 'sessions' }, desc: true }]),
    runReport(currentMonth, ['eventName'], ['eventCount', 'totalUsers'], 15, [{ metric: { metricName: 'eventCount' }, desc: true }]),
    runReport(currentMonth, ['country'], ['sessions', 'activeUsers'], 8, [{ metric: { metricName: 'sessions' }, desc: true }]),
    runReport(currentMonth, ['deviceCategory'], ['sessions', 'activeUsers', 'bounceRate'], 5, [{ metric: { metricName: 'sessions' }, desc: true }]),
  ]);

  const prevPageMap = new Map(topPagesPrevRows.map(r => [r.dimensionValues[0].value, parseInt(r.metricValues[0].value)]));

  const topPages = topPagesRows.map(r => {
    const page = r.dimensionValues[0].value;
    const sessions = parseInt(r.metricValues[0].value);
    const prevSessions = prevPageMap.get(page) || 0;
    return {
      page,
      sessions,
      activeUsers: parseInt(r.metricValues[1].value),
      bounceRate: parseFloat(r.metricValues[2].value),
      avgDuration: parseFloat(r.metricValues[3].value),
      pageViews: parseInt(r.metricValues[4].value),
      prevSessions,
      sessionsDiff: sessions - prevSessions,
    };
  });

  const channels = channelRows.map(r => ({
    channel: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value),
    activeUsers: parseInt(r.metricValues[1].value),
    bounceRate: parseFloat(r.metricValues[2].value),
    conversions: parseFloat(r.metricValues[3].value),
  }));

  const events = eventRows.map(r => ({
    event: r.dimensionValues[0].value,
    count: parseInt(r.metricValues[0].value),
    users: parseInt(r.metricValues[1].value),
  }));

  const countries = countryRows.map(r => ({
    country: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value),
    users: parseInt(r.metricValues[1].value),
  }));

  const devices = deviceRows.map(r => ({
    device: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value),
    users: parseInt(r.metricValues[1].value),
    bounceRate: parseFloat(r.metricValues[2].value),
  }));

  const totalSessions = channels.reduce((a, c) => a + c.sessions, 0);
  const organicChannel = channels.find(c => c.channel === 'Organic Search') || { sessions: 0 };

  // Totales mes anterior para comparativa global
  const prevTotalChannels = await runReport(previousMonth, ['sessionDefaultChannelGroup'], ['sessions'], 10, [{ metric: { metricName: 'sessions' }, desc: true }]);
  const prevTotalSessions = prevTotalChannels.reduce((a, r) => a + parseInt(r.metricValues[0].value), 0);

  const data = {
    generatedAt: new Date().toISOString(),
    propertyId: PROPERTY_ID,
    period: currentMonth,
    previousPeriod: previousMonth,
    summary: {
      totalSessions,
      prevTotalSessions,
      sessionsDiff: totalSessions - prevTotalSessions,
      organicSessions: organicChannel.sessions,
      organicPct: totalSessions > 0 ? ((organicChannel.sessions / totalSessions) * 100).toFixed(1) : '0',
    },
    topPages,
    channels,
    events,
    countries,
    devices,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));
  console.log('✅ ga4-data-monthly.json guardado');
  console.log(`\n📊 GA4 mensual: ${totalSessions} sesiones (vs ${prevTotalSessions} mes anterior) | ${data.summary.organicPct}% orgánico`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
