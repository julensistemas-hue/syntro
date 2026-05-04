/**
 * Script 8: Fetch Google Analytics 4 data
 *
 * Obtiene métricas de comportamiento de GA4:
 * - Páginas más visitadas (sesiones, usuarios, bounce rate, tiempo)
 * - Canales de tráfico (organic, direct, referral, etc.)
 * - Conversiones (eventos clave)
 * - Comparativa vs período anterior
 *
 * Output:
 *   - scripts/seo-automation/ga4-data.json
 *   - docs/seo/ga4-data.md  (legible por Claude)
 *
 * Uso: node scripts/seo-automation/8-fetch-ga4.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const OUTPUT_JSON = path.join(__dirname, 'ga4-data.json');
const OUTPUT_MD = path.join(__dirname, '../../docs/seo/ga4-data.md');
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
  console.log('🔄 Fetching GA4 data...\n');

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

  // 3 días vs 3 días anteriores (trigger 2x/semana)
  const current28 = getDates(3);      // nombre mantenido por compatibilidad con el resto del código
  const previous28 = getDates(3, 4);  // los 3 días anteriores (offsetDays=4 para no solapar)

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

  // Top páginas por sesiones
  const [topPagesRows, topPagesPrevRows] = await Promise.all([
    runReport(current28,
      ['pagePath'],
      ['sessions', 'activeUsers', 'bounceRate', 'averageSessionDuration', 'screenPageViews'],
      20,
      [{ metric: { metricName: 'sessions' }, desc: true }]
    ),
    runReport(previous28,
      ['pagePath'],
      ['sessions', 'activeUsers'],
      20,
      [{ metric: { metricName: 'sessions' }, desc: true }]
    ),
  ]);

  // Canales de tráfico
  const channelRows = await runReport(current28,
    ['sessionDefaultChannelGroup'],
    ['sessions', 'activeUsers', 'bounceRate', 'conversions'],
    10,
    [{ metric: { metricName: 'sessions' }, desc: true }]
  );

  // Eventos/conversiones clave
  const eventRows = await runReport(current28,
    ['eventName'],
    ['eventCount', 'totalUsers'],
    15,
    [{ metric: { metricName: 'eventCount' }, desc: true }]
  );

  // Países
  const countryRows = await runReport(current28,
    ['country'],
    ['sessions', 'activeUsers'],
    8,
    [{ metric: { metricName: 'sessions' }, desc: true }]
  );

  // Dispositivos
  const deviceRows = await runReport(current28,
    ['deviceCategory'],
    ['sessions', 'activeUsers', 'bounceRate'],
    5,
    [{ metric: { metricName: 'sessions' }, desc: true }]
  );

  // Totales generales
  const totalRows = await runReport(current28,
    ['date'],
    ['sessions', 'activeUsers', 'bounceRate', 'averageSessionDuration', 'conversions'],
    1
  );

  const prevPageMap = new Map(
    topPagesPrevRows.map(r => [r.dimensionValues[0].value, parseInt(r.metricValues[0].value)])
  );

  function parseRow(row, dims, mets) {
    const obj = {};
    dims.forEach((d, i) => obj[d] = row.dimensionValues[i].value);
    mets.forEach((m, i) => obj[m] = parseFloat(row.metricValues[i].value));
    return obj;
  }

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

  const data = {
    generatedAt: new Date().toISOString(),
    propertyId: PROPERTY_ID,
    period: current28,
    summary: {
      totalSessions,
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
  console.log('✅ ga4-data.json guardado');

  // Generar MD legible
  const fmt = n => Number.isInteger(n) ? n.toLocaleString('es-ES') : n.toFixed(1);
  const fmtDur = s => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  const fmtPct = n => `${(n * 100).toFixed(1)}%`;

  const md = [
    `# Google Analytics 4 — aisecurity.es`,
    `**Generado:** ${new Date(data.generatedAt).toLocaleString('es-ES')}`,
    `**Período:** ${data.period.startDate} → ${data.period.endDate} (3 días)`,
    '',
    `## Resumen`,
    `- Sesiones totales: **${totalSessions}**`,
    `- Sesiones orgánicas: **${organicChannel.sessions}** (${data.summary.organicPct}% del total)`,
    '',
    `## Canales de tráfico`,
    `| Canal | Sesiones | Usuarios | Bounce | Conversiones |`,
    `|-------|----------|----------|--------|--------------|`,
    ...channels.map(c =>
      `| ${c.channel} | ${c.sessions} | ${c.activeUsers} | ${fmtPct(c.bounceRate)} | ${c.conversions} |`
    ),
    '',
    `## Top Páginas (3 días)`,
    `| Página | Sesiones | Usuarios | Bounce | Duración media | vs anterior |`,
    `|--------|----------|----------|--------|----------------|-------------|`,
    ...topPages.slice(0, 15).map(p =>
      `| ${p.page} | ${p.sessions} | ${p.activeUsers} | ${fmtPct(p.bounceRate)} | ${fmtDur(p.avgDuration)} | ${p.sessionsDiff > 0 ? `📈 +${p.sessionsDiff}` : p.sessionsDiff < 0 ? `📉 ${p.sessionsDiff}` : '➡️'} |`
    ),
    '',
    `## Eventos y conversiones`,
    `| Evento | Disparos | Usuarios |`,
    `|--------|----------|----------|`,
    ...events.slice(0, 12).map(e =>
      `| ${e.event} | ${e.count} | ${e.users} |`
    ),
    '',
    `## Países`,
    ...countries.map(c => `- **${c.country}**: ${c.sessions} sesiones`),
    '',
    `## Dispositivos`,
    ...devices.map(d => `- **${d.device}**: ${d.sessions} sesiones, bounce ${fmtPct(d.bounceRate)}`),
  ].join('\n');

  // Crear directorio si no existe
  const dir = path.dirname(OUTPUT_MD);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_MD, md);
  console.log('✅ docs/seo/ga4-data.md guardado');
  console.log(`\n📊 GA4: ${totalSessions} sesiones | ${data.summary.organicPct}% orgánico | ${events.length} tipos de eventos`);
}

main().catch(err => {
  console.error('❌', err.message);
  if (err.message.includes('403') || err.message.includes('permission')) {
    console.error('\n💡 Solución: Añade el service account como Lector en GA4:');
    console.error('   analytics.google.com → Admin → Administración de acceso → + → seo-automation@julensistemas.iam.gserviceaccount.com');
  }
  process.exit(1);
});
