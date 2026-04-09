/**
 * Script 2: Indexación automática en Google Search Console
 *
 * Usa la API de Google Indexing para solicitar indexación de URLs.
 * Requiere configurar credenciales de Google Cloud.
 *
 * SETUP:
 * 1. Ir a Google Cloud Console: https://console.cloud.google.com/
 * 2. Crear proyecto o usar existente
 * 3. Habilitar "Indexing API"
 * 4. Crear Service Account y descargar JSON de credenciales
 * 5. Añadir el email del Service Account como propietario en Search Console
 * 6. Guardar credenciales en: scripts/seo-automation/google-credentials.json
 *
 * Uso: node scripts/seo-automation/2-google-indexing.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuración
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const SITE_URL = 'https://aisecurity.es';

// URLs de concienciación a indexar
const URLS_TO_INDEX = [
  '/blog/ciberseguridad-basica-empleados-guia-completa',
  '/blog/detectar-phishing-outlook-microsoft-guia-empleados',
  '/blog/detectar-phishing-gmail-guia-empleados',
  '/blog/tu-contrasena-mayuscula-numeros-hackeable',
  '/blog/contrasenas-seguras-empleados-guia-completa',
  '/servicios/test-concienciacion-empleados' // Landing principal
];

// Log de indexaciones
const LOG_FILE = path.join(__dirname, 'indexing-log.json');

function loadLog() {
  if (fs.existsSync(LOG_FILE)) {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  }
  return { requests: [] };
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

async function requestIndexing(auth, url) {
  const indexing = google.indexing({ version: 'v3', auth });

  try {
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED'
      }
    });

    return {
      success: true,
      url: url,
      notifyTime: response.data.urlNotificationMetadata?.latestUpdate?.notifyTime,
      response: response.data
    };
  } catch (error) {
    return {
      success: false,
      url: url,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Google Indexing API - Solicitando indexación...\n');

  // Verificar credenciales
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('❌ No se encontraron credenciales de Google.');
    console.log('\n📋 INSTRUCCIONES DE SETUP:');
    console.log('1. Ir a https://console.cloud.google.com/');
    console.log('2. Crear proyecto o seleccionar existente');
    console.log('3. Buscar y habilitar "Indexing API"');
    console.log('4. Ir a "Credenciales" > "Crear credenciales" > "Cuenta de servicio"');
    console.log('5. Descargar el JSON de la cuenta de servicio');
    console.log('6. Guardar como: scripts/seo-automation/google-credentials.json');
    console.log('7. En Search Console, añadir el email del Service Account como propietario');
    console.log('\n📧 El email del Service Account tiene formato: nombre@proyecto.iam.gserviceaccount.com');
    return;
  }

  // Cargar credenciales
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

  // Autenticar
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing']
  });

  const authClient = await auth.getClient();
  const log = loadLog();

  console.log(`📍 Sitio: ${SITE_URL}`);
  console.log(`📄 URLs a indexar: ${URLS_TO_INDEX.length}\n`);

  const results = [];

  for (const urlPath of URLS_TO_INDEX) {
    const fullUrl = `${SITE_URL}${urlPath}`;
    console.log(`🔄 Solicitando: ${fullUrl}`);

    const result = await requestIndexing(authClient, fullUrl);
    results.push(result);

    if (result.success) {
      console.log(`   ✅ Indexación solicitada`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }

    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Guardar log
  log.requests.push({
    timestamp: new Date().toISOString(),
    results: results
  });
  saveLog(log);

  // Resumen
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n📊 RESUMEN:');
  console.log(`   ✅ Exitosas: ${successful}`);
  console.log(`   ❌ Fallidas: ${failed}`);
  console.log(`\n📝 Log guardado en: ${LOG_FILE}`);
}

// Verificar si googleapis está instalado
try {
  require.resolve('googleapis');
  main().catch(console.error);
} catch (e) {
  console.log('📦 Instalando dependencia googleapis...');
  console.log('   Ejecuta: npm install googleapis');
  console.log('\n   O desde la carpeta del proyecto:');
  console.log('   cd scripts/seo-automation && npm init -y && npm install googleapis');
}
