#!/usr/bin/env node
'use strict';

const https = require('https');

const SITE_URL    = 'https://aisecurity.es';
const RESEND_KEY  = (process.env.RESEND_API_KEY  || '').trim().replace(/[\r\n\t]/g, '');
const PS_KEY      = (process.env.PAGESPEED_API_KEY || '').trim().replace(/[\r\n\t]/g, '');
const EMAIL_TO    = (process.env.EMAIL_TO || 'julen.sistemas@gmail.com').trim();
const FILES_RAW   = process.env.CHANGED_FILES || '';

// ── URL mapping ────────────────────────────────────────────────────────────

function fileToUrl(f) {
  let p = f.replace('src/pages/', '').replace(/\.astro$/, '').replace(/\/index$/, '');
  if (p === 'index') p = '';
  return `${SITE_URL}/${p}`.replace(/\/$/, '') || SITE_URL;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AISecurityQualityBot/1.0' }, timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  });
}

function postJson(hostname, path, payload, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── PageSpeed ──────────────────────────────────────────────────────────────

async function getPageSpeed(url) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${PS_KEY ? `&key=${PS_KEY}` : ''}`;
  try {
    const res = await fetchUrl(apiUrl);
    const d = JSON.parse(res.body);
    if (d.error) { console.log(`  ⚠️ PageSpeed API error: ${d.error.message}`); return null; }
    const cats   = d.lighthouseResult?.categories || {};
    const audits = d.lighthouseResult?.audits || {};
    const perf = Math.round((cats.performance?.score || 0) * 100);
    if (perf === 0 && !cats.performance) { console.log('  ⚠️ PageSpeed sin datos (rate limit)'); return null; }
    return {
      perf,
      seo:    Math.round((cats.seo?.score            || 0) * 100),
      a11y:   Math.round((cats.accessibility?.score  || 0) * 100),
      bp:     Math.round((cats['best-practices']?.score || 0) * 100),
      lcp:    audits['largest-contentful-paint']?.displayValue || 'N/A',
      cls:    audits['cumulative-layout-shift']?.displayValue  || 'N/A',
      tbt:    audits['total-blocking-time']?.displayValue       || 'N/A',
    };
  } catch (e) { console.log(`  ⚠️ PageSpeed error: ${e.message}`); return null; }
}

// ── SEO checks ─────────────────────────────────────────────────────────────

function checkSEO(html) {
  const s = [];
  const c = {};

  // Title
  const tM = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = tM ? tM[1].replace(/\s+/g, ' ').trim() : null;
  c.title = !!title;
  if (!title) s.push('Falta el &lt;title&gt;');
  else if (title.length < 40 || title.length > 70) s.push(`Title: ${title.length} chars (ideal 40-70)`);

  // Meta description
  const dM = html.match(/<meta\s+name=["']description["'][^>]*content=["'](.*?)["']/i)
            || html.match(/<meta\s+content=["'](.*?)["'][^>]*name=["']description["']/i);
  const desc = dM ? dM[1] : null;
  c.desc = !!desc;
  if (!desc) s.push('Falta meta description');
  else if (desc.length < 120 || desc.length > 165) s.push(`Meta desc: ${desc.length} chars (ideal 120-165)`);

  // Canonical
  c.canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  if (!c.canonical) s.push('Falta &lt;link rel="canonical"&gt;');

  // OG
  c.og = /<meta[^>]+property=["']og:title["']/i.test(html)
      && /<meta[^>]+property=["']og:description["']/i.test(html)
      && /<meta[^>]+property=["']og:image["']/i.test(html);
  if (!c.og) s.push('Faltan og:title / og:description / og:image');

  // H1
  const h1s = (html.match(/<h1[^>]*>/gi) || []).length;
  c.h1 = h1s === 1;
  if (h1s === 0) s.push('Falta H1');
  if (h1s > 1)   s.push(`${h1s} H1 detectados — debe haber solo 1`);

  // Images alt
  const imgs      = [...html.matchAll(/<img[^>]+>/gi)];
  const noAlt     = imgs.filter(i => !/alt=["'][^"']+/.test(i[0])).length;
  c.imgAlt = noAlt === 0;
  if (noAlt > 0) s.push(`${noAlt} imagen(es) sin alt text`);

  // lang
  c.lang = /html[^>]+lang=["'](es|en)/i.test(html);
  if (!c.lang) s.push('html sin lang válido (es/en)');

  // robots noindex
  c.noindex = /<meta[^>]+content=["'][^"']*noindex/i.test(html);
  if (c.noindex) s.push('⚠️ Página marcada como noindex — no aparecerá en Google');

  // Schema.org
  c.article = /["']@type["']\s*:\s*["']Article["']/i.test(html);
  c.faq     = /["']@type["']\s*:\s*["']FAQPage["']/i.test(html);

  return { c, s, title, desc };
}

// ── GEO checks ─────────────────────────────────────────────────────────────

function checkGEO(html, isBlog) {
  const s = [];
  const c = {};

  // Strip scripts/styles for word count
  const plain = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const words = plain.split(' ').filter(w => w.length > 3).length;
  c.words = words;
  const minWords = isBlog ? 600 : 200;
  if (words < minWords) s.push(`Contenido: ~${words} palabras (mínimo recomendado: ${minWords})`);

  // Headings in question format
  const hAll = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)];
  const hQ   = hAll.filter(h => h[1].replace(/<[^>]+>/g, '').trim().startsWith('¿'));
  c.hRatio = hAll.length > 0 ? hQ.length / hAll.length : 1;
  if (hAll.length > 2 && c.hRatio < 0.6) {
    s.push(`Solo ${hQ.length}/${hAll.length} H2/H3 son preguntas (objetivo ≥60% para GEO)`);
  }

  // Direct answer paragraph before first H2
  const h2Idx = html.search(/<h2/i);
  const preH2  = h2Idx > 0 ? html.slice(0, h2Idx) : html;
  c.directAnswer = /<p[^>]*>\s*\S/.test(preH2);
  if (!c.directAnswer) s.push('Falta párrafo de respuesta directa antes del primer H2 (clave para GEO)');

  // FAQ Schema
  c.faq = /["']@type["']\s*:\s*["']FAQPage["']/i.test(html);
  if (isBlog && !c.faq) s.push('Añadir FAQ Schema JSON-LD (mejora presencia en AI Overviews / ChatGPT)');

  // Self-contained snippet: at least one concrete data point
  c.hasData = /\d+[%€$h/]|\d+ (hora|minuto|segundo|día|mes|euro|usuario)/.test(plain);
  if (isBlog && !c.hasData) s.push('Incluir datos concretos (%, €, horas, etc.) para ser citado por IAs');

  return { c, s, hQ: hQ.length, hAll: hAll.length, words };
}

// ── Email builder ──────────────────────────────────────────────────────────

const col = n => n >= 90 ? '#22c55e' : n >= 50 ? '#f59e0b' : '#ef4444';
const ok  = v => v ? '✅' : '❌';
const ratio = (a, b, th) => (b === 0 ? '✅' : a/b >= th ? '✅' : a/b >= th/2 ? '🟡' : '❌');

function buildEmail(url, ps, seo, geo) {
  const issues = [...seo.s, ...geo.s];
  const score  = issues.length === 0 ? '✅ Sin problemas' : issues.length <= 3 ? `🟡 ${issues.length} mejora(s)` : `🔴 ${issues.length} mejoras`;

  const psHtml = ps ? `
    <table width="100%" cellpadding="0" cellspacing="8">
      <tr>
        ${['Rendimiento','SEO','Accesibilidad','Best Practices'].map((l,i) => {
          const v = [ps.perf, ps.seo, ps.a11y, ps.bp][i];
          return `<td align="center" style="background:#1e293b;padding:12px;border-radius:8px;width:25%;">
            <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">${l}</div>
            <div style="color:${col(v)};font-size:28px;font-weight:900;">${v}</div>
            <div style="color:#64748b;font-size:11px;">/100</div>
          </td>`;
        }).join('')}
      </tr>
    </table>
    <p style="color:#64748b;font-size:12px;margin-top:8px;">Core Web Vitals (mobile) · LCP: <strong style="color:#e2e8f0;">${ps.lcp}</strong> · CLS: <strong style="color:#e2e8f0;">${ps.cls}</strong> · TBT: <strong style="color:#e2e8f0;">${ps.tbt}</strong></p>
  ` : '<p style="color:#f59e0b;background:#1e293b;padding:12px;border-radius:8px;">⚠️ PageSpeed no disponible (rate limit o timeout) — añade PAGESPEED_API_KEY a los secrets</p>';

  const seoRows = [
    [ok(seo.c.title),    'Title',                          seo.title ? `"${seo.title.slice(0,55)}${seo.title.length>55?'…':''}" (${seo.title.length} chars)` : '—'],
    [ok(seo.c.desc),     'Meta description',               seo.desc ? `${seo.desc.length} chars` : '—'],
    [ok(seo.c.canonical),'Canonical URL',                  ''],
    [ok(seo.c.og),       'Open Graph (title/desc/image)',  ''],
    [ok(seo.c.article || seo.c.faq), 'Schema.org JSON-LD', `${seo.c.article?'Article ':''} ${seo.c.faq?'FAQPage':''}`],
    [ok(seo.c.h1),       'H1 único',                       ''],
    [ok(seo.c.imgAlt),   'Imágenes con alt text',          ''],
    [ok(seo.c.lang),     'lang="es"',                      ''],
    [seo.c.noindex ? '🔴' : '✅', 'No-noindex',            ''],
  ].map(([ico, label, val]) => `
    <tr>
      <td style="padding:5px 4px;font-size:18px;">${ico}</td>
      <td style="padding:5px 8px;font-size:13px;color:#e2e8f0;">${label}</td>
      <td style="padding:5px 4px;font-size:12px;color:#64748b;">${val}</td>
    </tr>`).join('');

  const geoRows = [
    [ok(geo.c.directAnswer), 'Párrafo respuesta directa antes del H2', ''],
    [ratio(geo.hQ, geo.hAll, 0.6), 'H2/H3 en formato pregunta (¿...?)', `${geo.hQ}/${geo.hAll} headings (${Math.round(geo.c.hRatio*100)}%)`],
    [ok(geo.c.faq),          'FAQ Schema JSON-LD',                     ''],
    [geo.c.words >= 600 ? '✅' : geo.c.words >= 200 ? '🟡' : '❌', 'Contenido suficiente', `~${geo.words} palabras`],
    [ok(geo.c.hasData),      'Datos concretos citables por IA',        ''],
  ].map(([ico, label, val]) => `
    <tr>
      <td style="padding:5px 4px;font-size:18px;">${ico}</td>
      <td style="padding:5px 8px;font-size:13px;color:#e2e8f0;">${label}</td>
      <td style="padding:5px 4px;font-size:12px;color:#64748b;">${val}</td>
    </tr>`).join('');

  const improvHtml = issues.length > 0
    ? `<h2 style="color:#f1f5f9;border-bottom:1px solid #334155;padding-bottom:8px;margin-top:28px;">⚠️ Mejoras recomendadas</h2>
       <ul style="padding-left:20px;line-height:2;">${issues.map(i => `<li style="color:#fbbf24;font-size:14px;">${i}</li>`).join('')}</ul>`
    : `<div style="background:#14532d;border-radius:8px;padding:14px;margin-top:20px;border:1px solid #166534;">
         <p style="margin:0;color:#86efac;font-size:14px;">✅ ¡Todo correcto! Página lista para SEO y GEO.</p>
       </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:32px 24px;max-width:680px;margin:0 auto;">
  <div style="margin-bottom:24px;">
    <h1 style="color:#60a5fa;margin:0 0 4px;font-size:22px;">🔍 Informe de Calidad — ${score}</h1>
    <p style="color:#475569;margin:0;font-size:13px;">AI Security · Push a producción detectado</p>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:16px;border-left:4px solid #3b82f6;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">URL analizada</p>
    <a href="${url}" style="color:#60a5fa;font-weight:700;font-size:15px;text-decoration:none;">${url}</a>
  </div>

  <h2 style="color:#f1f5f9;border-bottom:1px solid #334155;padding-bottom:8px;">⚡ PageSpeed (Mobile)</h2>
  ${psHtml}

  <h2 style="color:#f1f5f9;border-bottom:1px solid #334155;padding-bottom:8px;margin-top:28px;">📋 SEO Técnico</h2>
  <table width="100%" cellpadding="0" cellspacing="0">${seoRows}</table>

  <h2 style="color:#f1f5f9;border-bottom:1px solid #334155;padding-bottom:8px;margin-top:28px;">🤖 GEO — IA Search Optimization</h2>
  <table width="100%" cellpadding="0" cellspacing="0">${geoRows}</table>

  ${improvHtml}

  <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0 16px;">
  <p style="color:#334155;font-size:12px;margin:0;">Generado por GitHub Actions · AI Security · <a href="https://aisecurity.es" style="color:#475569;">aisecurity.es</a></p>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const files = FILES_RAW.split('\n')
    .map(f => f.trim())
    .filter(f => f && f.endsWith('.astro') && !f.includes('/api/') && !f.startsWith('src/pages/_'));

  if (!files.length) { console.log('Sin páginas .astro para analizar.'); return; }

  const urls = [...new Set(files.slice(0, 5).map(fileToUrl))];
  console.log(`\n📋 Páginas a analizar (${urls.length}):\n${urls.join('\n')}\n`);

  for (const url of urls) {
    console.log(`\n━━ ${url}`);
    const isBlog = url.includes('/blog/');

    let html = '';
    try {
      const res = await fetchUrl(url);
      if (res.status !== 200) { console.log(`  HTTP ${res.status} — saltando`); continue; }
      html = res.body;
    } catch (e) { console.log(`  Error: ${e.message}`); continue; }

    console.log('  🔍 PageSpeed...');
    const ps = await getPageSpeed(url);
    if (ps) console.log(`  Perf:${ps.perf} SEO:${ps.seo} A11y:${ps.a11y} BP:${ps.bp}`);

    const seo = checkSEO(html);
    const geo = checkGEO(html, isBlog);
    console.log(`  SEO issues: ${seo.s.length} | GEO issues: ${geo.s.length}`);

    const total   = seo.s.length + geo.s.length;
    const emoji   = total === 0 ? '✅' : total <= 3 ? '🟡' : '🔴';
    const subject = `${emoji} Calidad: ${url.replace(SITE_URL, '') || '/'} — ${total} mejora(s) detectadas`;
    const body    = buildEmail(url, ps, seo, geo);

    if (RESEND_KEY) {
      console.log('  📧 Enviando email...');
      const r = await postJson('api.resend.com', '/emails',
        { from: 'AI Security Quality Bot <info@aisecurity.es>', to: [EMAIL_TO], subject, html: body },
        RESEND_KEY);
      console.log(`  Email: HTTP ${r.status}`);
    } else {
      console.log('  ⚠️  RESEND_API_KEY no configurada');
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
