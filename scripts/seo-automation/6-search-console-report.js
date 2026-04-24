/**
 * Script 6: Google Search Console Report
 *
 * Extrae datos de rendimiento del sitio en Google Search:
 * - Top keywords con posición, clicks e impresiones
 * - Top páginas por tráfico
 * - Oportunidades: páginas con muchas impresiones pero bajo CTR
 * - Rendimiento de keywords objetivo del proyecto
 *
 * Output: docs/seo/search-console-data.md (legible por Claude)
 *         docs/seo/search-console-data.json (datos en bruto)
 *
 * Uso: node scripts/seo-automation/6-search-console-report.js
 * Programar: Añadir a GitHub Actions semanalmente
 *
 * REQUISITOS:
 * 1. Habilitar "Google Search Console API" en Google Cloud Console
 * 2. Añadir seo-automation@julensistemas.iam.gserviceaccount.com
 *    como usuario en Search Console (Settings → Users → Add user)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const SITE_URL = 'sc-domain:aisecurity.es'; // Formato domain property
const SITE_URL_FALLBACK = 'https://aisecurity.es/'; // Formato URL prefix
const OUTPUT_MD = path.join(__dirname, '../../docs/seo/search-console-data.md');
const OUTPUT_JSON = path.join(__dirname, 'search-console-data.json');

// Keywords objetivo del proyecto (para seguimiento específico)
const TARGET_KEYWORDS = [
  'soporte técnico informático',
  'soporte técnico empresas',
  'técnico informático pymes',
  'wazuh implementación',
  'wazuh ens',
  'ciberseguridad empleados',
  'test phishing empleados',
  'chatbot empresas',
  'automatización procesos pymes',
  'soporte técnico madrid',
  'soporte técnico barcelona',
  'soporte técnico valencia',
];

function getDates(daysBack = 90) {
  const end = new Date();
  end.setDate(end.getDate() - 3); // Search Console tiene 3 días de delay
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

async function querySearchConsole(auth, siteUrl, requestBody) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody,
    });
    return res.data.rows || [];
  } catch (e) {
    throw e;
  }
}

async function getSiteUrl(auth) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  try {
    const res = await searchconsole.sites.list();
    const sites = res.data.siteEntry || [];
    console.log('Propiedades encontradas en Search Console:');
    sites.forEach(s => console.log(' -', s.siteUrl, `(${s.permissionLevel})`));
    // Buscar aisecurity.es
    const match = sites.find(s =>
      s.siteUrl.includes('aisecurity.es')
    );
    if (match) return match.siteUrl;
    // Si no hay match, usar la primera disponible
    if (sites.length > 0) return sites[0].siteUrl;
    return null;
  } catch (e) {
    console.log('Error listando propiedades:', e.message);
    return null;
  }
}

function formatNumber(n) {
  if (!n) return '0';
  return n.toLocaleString('es-ES');
}

function formatPercent(n) {
  if (!n) return '0%';
  return (n * 100).toFixed(1) + '%';
}

function formatPosition(n) {
  if (!n) return '-';
  return n.toFixed(1);
}

async function main() {
  console.log('📊 Google Search Console Report\n');

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const authClient = await auth.getClient();

  // Detectar URL de la propiedad
  console.log('🔍 Buscando propiedad en Search Console...');
  let siteUrl = await getSiteUrl(authClient);

  if (!siteUrl) {
    console.log('\n❌ No se encontró ninguna propiedad en Search Console.');
    console.log('\n📋 PASOS PARA CONFIGURAR:');
    console.log('1. Ve a https://search.google.com/search-console');
    console.log('2. Selecciona tu propiedad (aisecurity.es)');
    console.log('3. Ve a Configuración → Usuarios y permisos');
    console.log('4. Añade: seo-automation@julensistemas.iam.gserviceaccount.com');
    console.log('5. Rol: Propietario restringido o Completo');
    console.log('\nTambién debes habilitar la API en Google Cloud:');
    console.log('→ Google Cloud Console → APIs → Habilitar → "Google Search Console API"');
    return;
  }

  console.log(`✅ Propiedad: ${siteUrl}\n`);

  const { startDate, endDate } = getDates(90);
  console.log(`📅 Período: ${startDate} → ${endDate}\n`);

  const data = { siteUrl, startDate, endDate, generatedAt: new Date().toISOString() };

  // --- 1. Top keywords ---
  console.log('🔄 Obteniendo top keywords...');
  try {
    const rows = await querySearchConsole(authClient, siteUrl, {
      startDate, endDate,
      dimensions: ['query'],
      rowLimit: 50,
      orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    });
    data.topKeywords = rows.map(r => ({
      keyword: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
    console.log(`   ✅ ${rows.length} keywords`);
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    data.topKeywords = [];
  }

  // --- 2. Top páginas ---
  console.log('🔄 Obteniendo top páginas...');
  try {
    const rows = await querySearchConsole(authClient, siteUrl, {
      startDate, endDate,
      dimensions: ['page'],
      rowLimit: 20,
      orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    });
    data.topPages = rows.map(r => ({
      page: r.keys[0].replace('https://aisecurity.es', ''),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
    console.log(`   ✅ ${rows.length} páginas`);
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    data.topPages = [];
  }

  // --- 3. Oportunidades (alto impresiones, bajo CTR) ---
  console.log('🔄 Calculando oportunidades...');
  try {
    const rows = await querySearchConsole(authClient, siteUrl, {
      startDate, endDate,
      dimensions: ['query'],
      rowLimit: 100,
      orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
    });
    // Páginas con >50 impresiones pero CTR < 3% y posición < 20
    data.opportunities = rows
      .filter(r => r.impressions > 50 && r.ctr < 0.03 && r.position < 20)
      .slice(0, 15)
      .map(r => ({
        keyword: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));
    console.log(`   ✅ ${data.opportunities.length} oportunidades encontradas`);
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    data.opportunities = [];
  }

  // --- 4. Keywords objetivo del proyecto ---
  console.log('🔄 Buscando keywords objetivo...');
  try {
    const rows = await querySearchConsole(authClient, siteUrl, {
      startDate, endDate,
      dimensions: ['query'],
      rowLimit: 1000,
    });
    const allKeywords = new Map(rows.map(r => [r.keys[0].toLowerCase(), r]));
    data.targetKeywords = TARGET_KEYWORDS.map(kw => {
      const match = [...allKeywords.entries()].find(([k]) => k.includes(kw.toLowerCase()));
      if (match) {
        return {
          keyword: kw,
          found: true,
          clicks: match[1].clicks,
          impressions: match[1].impressions,
          ctr: match[1].ctr,
          position: match[1].position,
          actualKeyword: match[0],
        };
      }
      return { keyword: kw, found: false };
    });
    const found = data.targetKeywords.filter(k => k.found).length;
    console.log(`   ✅ ${found}/${TARGET_KEYWORDS.length} keywords objetivo encontradas`);
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    data.targetKeywords = [];
  }

  // --- 5. Tendencia últimos 30 días vs anteriores 30 días ---
  console.log('🔄 Calculando tendencia...');
  try {
    const { startDate: s1, endDate: e1 } = getDates(30);
    const { startDate: s2, endDate: e2 } = getDates(60);

    const [recent, previous] = await Promise.all([
      querySearchConsole(authClient, siteUrl, { startDate: s1, endDate: e1, dimensions: ['date'], rowLimit: 30 }),
      querySearchConsole(authClient, siteUrl, { startDate: s2, endDate: e2, dimensions: ['date'], rowLimit: 30 }),
    ]);

    const sumClicks = rows => rows.reduce((a, r) => a + r.clicks, 0);
    const sumImpressions = rows => rows.reduce((a, r) => a + r.impressions, 0);

    data.trend = {
      recent30: { clicks: sumClicks(recent), impressions: sumImpressions(recent) },
      previous30: { clicks: sumClicks(previous), impressions: sumImpressions(previous) },
    };
    const clicksDiff = data.trend.recent30.clicks - data.trend.previous30.clicks;
    const clicksPct = data.trend.previous30.clicks > 0
      ? ((clicksDiff / data.trend.previous30.clicks) * 100).toFixed(1)
      : 'N/A';
    console.log(`   ✅ Tendencia clicks: ${clicksPct}% vs mes anterior`);
  } catch (e) {
    console.log('   ❌ Error tendencia:', e.message);
    data.trend = null;
  }

  // --- Guardar JSON ---
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));

  // --- Generar Markdown legible ---
  let md = `# Search Console Report — aisecurity.es\n\n`;
  md += `**Generado:** ${new Date().toLocaleString('es-ES')}  \n`;
  md += `**Período:** ${startDate} → ${endDate}  \n`;
  md += `**Propiedad:** ${siteUrl}\n\n`;

  // Tendencia
  if (data.trend) {
    const { recent30, previous30 } = data.trend;
    const clicksDiff = recent30.clicks - previous30.clicks;
    const clicksPct = previous30.clicks > 0 ? ((clicksDiff / previous30.clicks) * 100).toFixed(1) : 'N/A';
    const impDiff = recent30.impressions - previous30.impressions;
    const impPct = previous30.impressions > 0 ? ((impDiff / previous30.impressions) * 100).toFixed(1) : 'N/A';
    const arrow = n => n > 0 ? '▲' : n < 0 ? '▼' : '→';

    md += `## Tendencia (últimos 30 días vs 30 días anteriores)\n\n`;
    md += `| Métrica | Reciente | Anterior | Cambio |\n`;
    md += `|---------|---------|---------|--------|\n`;
    md += `| Clicks | ${formatNumber(recent30.clicks)} | ${formatNumber(previous30.clicks)} | ${arrow(clicksDiff)} ${clicksPct}% |\n`;
    md += `| Impresiones | ${formatNumber(recent30.impressions)} | ${formatNumber(previous30.impressions)} | ${arrow(impDiff)} ${impPct}% |\n\n`;
  }

  // Top keywords
  if (data.topKeywords.length > 0) {
    md += `## Top 20 Keywords por Clicks\n\n`;
    md += `| Keyword | Clicks | Impresiones | CTR | Posición |\n`;
    md += `|---------|--------|-------------|-----|----------|\n`;
    data.topKeywords.slice(0, 20).forEach(k => {
      md += `| ${k.keyword} | ${formatNumber(k.clicks)} | ${formatNumber(k.impressions)} | ${formatPercent(k.ctr)} | ${formatPosition(k.position)} |\n`;
    });
    md += '\n';
  }

  // Top páginas
  if (data.topPages.length > 0) {
    md += `## Top Páginas por Clicks\n\n`;
    md += `| Página | Clicks | Impresiones | CTR | Posición |\n`;
    md += `|--------|--------|-------------|-----|----------|\n`;
    data.topPages.forEach(p => {
      md += `| ${p.page || '/'} | ${formatNumber(p.clicks)} | ${formatNumber(p.impressions)} | ${formatPercent(p.ctr)} | ${formatPosition(p.position)} |\n`;
    });
    md += '\n';
  }

  // Keywords objetivo
  md += `## Keywords Objetivo del Proyecto\n\n`;
  md += `| Keyword | Estado | Clicks | Impresiones | CTR | Posición |\n`;
  md += `|---------|--------|--------|-------------|-----|----------|\n`;
  data.targetKeywords.forEach(k => {
    if (k.found) {
      md += `| ${k.keyword} | ✅ | ${formatNumber(k.clicks)} | ${formatNumber(k.impressions)} | ${formatPercent(k.ctr)} | ${formatPosition(k.position)} |\n`;
    } else {
      md += `| ${k.keyword} | ❌ sin datos | - | - | - | - |\n`;
    }
  });
  md += '\n';

  // Oportunidades
  if (data.opportunities.length > 0) {
    md += `## Oportunidades (alto impresiones, bajo CTR)\n\n`;
    md += `_Keywords que aparecen mucho en Google pero pocos hacen click — mejorar título/descripción puede aumentar tráfico sin cambiar posición._\n\n`;
    md += `| Keyword | Impresiones | CTR actual | Posición |\n`;
    md += `|---------|-------------|------------|----------|\n`;
    data.opportunities.forEach(o => {
      md += `| ${o.keyword} | ${formatNumber(o.impressions)} | ${formatPercent(o.ctr)} | ${formatPosition(o.position)} |\n`;
    });
    md += '\n';
  }

  fs.writeFileSync(OUTPUT_MD, md);

  console.log('\n✅ REPORTE GENERADO:');
  console.log(`   📄 Markdown: docs/seo/search-console-data.md`);
  console.log(`   📊 JSON:     scripts/seo-automation/search-console-data.json`);
  console.log('\n💡 El archivo .md es legible por Claude en futuras sesiones');
}

main().catch(err => {
  if (err.code === 403) {
    console.log('\n❌ Error 403 — Sin permisos');
    console.log('Necesitas añadir la cuenta de servicio a Search Console:');
    console.log('→ search.google.com/search-console → Configuración → Usuarios → Añadir');
    console.log('→ Email: seo-automation@julensistemas.iam.gserviceaccount.com');
    console.log('→ También habilita "Google Search Console API" en Google Cloud Console');
  } else if (err.code === 404) {
    console.log('\n❌ Error 404 — Propiedad no encontrada');
    console.log('Verifica que la propiedad esté añadida en Search Console');
  } else {
    console.log('\n❌ Error inesperado:', err.message);
  }
});
