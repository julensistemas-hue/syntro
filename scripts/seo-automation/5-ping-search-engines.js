/**
 * Script 5: Ping automático a buscadores
 *
 * Notifica a Google, Bing, Yandex y otros buscadores cuando hay
 * cambios en el sitemap o contenido nuevo.
 *
 * Métodos:
 * - Ping directo a URLs de notificación
 * - Envío de sitemap actualizado
 * - IndexNow API (Bing/Yandex)
 *
 * Uso: node scripts/seo-automation/5-ping-search-engines.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración
const SITE_URL = 'https://aisecurity.es';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const LOG_FILE = path.join(__dirname, 'ping-log.json');

// IndexNow key (generada automáticamente si no existe)
const INDEXNOW_KEY_FILE = path.join(__dirname, 'indexnow-key.txt');

// URLs de concienciación
const URLS_TO_PING = [
  '/blog/ciberseguridad-basica-empleados-guia-completa',
  '/blog/detectar-phishing-outlook-microsoft-guia-empleados',
  '/blog/detectar-phishing-gmail-guia-empleados',
  '/blog/tu-contrasena-mayuscula-numeros-hackeable',
  '/blog/contrasenas-seguras-empleados-guia-completa'
];

// Obtener o generar IndexNow key
function getIndexNowKey() {
  if (fs.existsSync(INDEXNOW_KEY_FILE)) {
    return fs.readFileSync(INDEXNOW_KEY_FILE, 'utf-8').trim();
  }

  // Generar nueva key (32 caracteres hex)
  const key = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(INDEXNOW_KEY_FILE, key);

  console.log('🔑 Nueva IndexNow key generada:', key);
  console.log(`\n⚠️  IMPORTANTE: Debes crear el archivo de verificación:`);
  console.log(`   Crear: public/${key}.txt`);
  console.log(`   Contenido: ${key}`);
  console.log(`   URL accesible: ${SITE_URL}/${key}.txt\n`);

  return key;
}

// Función para hacer request HTTP/HTTPS
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'AISecurity-SEO-Bot/1.0',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Ping a Google
async function pingGoogle() {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const response = await makeRequest(url);
    return {
      engine: 'Google',
      success: response.statusCode === 200,
      statusCode: response.statusCode
    };
  } catch (error) {
    return {
      engine: 'Google',
      success: false,
      error: error.message
    };
  }
}

// Ping a Bing (método clásico)
async function pingBing() {
  const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const response = await makeRequest(url);
    return {
      engine: 'Bing (sitemap)',
      success: response.statusCode === 200,
      statusCode: response.statusCode
    };
  } catch (error) {
    return {
      engine: 'Bing (sitemap)',
      success: false,
      error: error.message
    };
  }
}

// IndexNow API (Bing, Yandex, Seznam, Naver)
async function pingIndexNow(urls) {
  const key = getIndexNowKey();

  const body = JSON.stringify({
    host: new URL(SITE_URL).hostname,
    key: key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls.map(u => `${SITE_URL}${u}`)
  });

  // IndexNow endpoints
  const endpoints = [
    'https://api.indexnow.org/IndexNow',
    'https://www.bing.com/IndexNow',
    'https://yandex.com/indexnow'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint, 'POST', body);
      results.push({
        engine: endpoint.includes('bing') ? 'Bing (IndexNow)' :
          endpoint.includes('yandex') ? 'Yandex' : 'IndexNow API',
        success: response.statusCode >= 200 && response.statusCode < 300,
        statusCode: response.statusCode
      });
    } catch (error) {
      results.push({
        engine: endpoint,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// Ping a Yandex (método clásico)
async function pingYandex() {
  const url = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const response = await makeRequest(url);
    return {
      engine: 'Yandex (sitemap)',
      success: response.statusCode === 200 || response.statusCode === 302,
      statusCode: response.statusCode
    };
  } catch (error) {
    return {
      engine: 'Yandex (sitemap)',
      success: false,
      error: error.message
    };
  }
}

// Cargar log
function loadLog() {
  if (fs.existsSync(LOG_FILE)) {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  }
  return { pings: [] };
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// Ejecutar todos los pings
async function main() {
  console.log('🔔 Ping automático a buscadores\n');
  console.log(`🌐 Sitio: ${SITE_URL}`);
  console.log(`📄 Sitemap: ${SITEMAP_URL}`);
  console.log(`📋 URLs a notificar: ${URLS_TO_PING.length}\n`);

  const results = [];
  const log = loadLog();

  // 1. Ping clásico a Google
  console.log('🔄 Notificando a Google...');
  const googleResult = await pingGoogle();
  results.push(googleResult);
  console.log(`   ${googleResult.success ? '✅' : '❌'} ${googleResult.engine}: ${googleResult.statusCode || googleResult.error}`);

  // 2. Ping clásico a Bing
  console.log('🔄 Notificando a Bing (sitemap)...');
  const bingResult = await pingBing();
  results.push(bingResult);
  console.log(`   ${bingResult.success ? '✅' : '❌'} ${bingResult.engine}: ${bingResult.statusCode || bingResult.error}`);

  // 3. IndexNow (Bing, Yandex, etc.)
  console.log('🔄 Enviando a IndexNow API...');
  const indexNowResults = await pingIndexNow(URLS_TO_PING);
  results.push(...indexNowResults);
  indexNowResults.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.engine}: ${r.statusCode || r.error}`);
  });

  // 4. Ping clásico a Yandex
  console.log('🔄 Notificando a Yandex...');
  const yandexResult = await pingYandex();
  results.push(yandexResult);
  console.log(`   ${yandexResult.success ? '✅' : '❌'} ${yandexResult.engine}: ${yandexResult.statusCode || yandexResult.error}`);

  // Guardar log
  log.pings.push({
    timestamp: new Date().toISOString(),
    results: results
  });
  saveLog(log);

  // Resumen
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n📊 RESUMEN:');
  console.log(`   ✅ Exitosos: ${successful}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log(`\n📝 Log guardado en: ${LOG_FILE}`);

  // Recordatorio IndexNow
  const key = getIndexNowKey();
  console.log('\n💡 RECORDATORIO IndexNow:');
  console.log(`   Para que IndexNow funcione, necesitas crear:`);
  console.log(`   Archivo: public/${key}.txt`);
  console.log(`   Contenido: ${key}`);
}

main().catch(console.error);
