/**
 * Script para notificar a Google Indexing API sobre nuevos artículos del blog
 *
 * Uso:
 * 1. Configurar credenciales de Google Cloud (ver README)
 * 2. Ejecutar: node scripts/index-new-blog-post.js https://aisecurity.es/blog/slug-del-articulo
 *
 * Documentación: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar credenciales de servicio de Google Cloud
const SERVICE_ACCOUNT_FILE = join(__dirname, '../google-service-account.json');

async function notifyGoogle(url) {
  try {
    // Leer credenciales
    const keyFile = JSON.parse(readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

    // Configurar autenticación
    const jwtClient = new google.auth.JWT(
      keyFile.client_email,
      null,
      keyFile.private_key,
      ['https://www.googleapis.com/auth/indexing'],
      null
    );

    await jwtClient.authorize();

    // Llamar a la API de indexación
    const response = await google.indexing('v3').urlNotifications.publish({
      auth: jwtClient,
      requestBody: {
        url: url,
        type: 'URL_UPDATED', // o 'URL_DELETED' para eliminar
      },
    });

    console.log('✅ Notificación enviada a Google:', response.data);
    console.log('📊 Estado:', response.status);
    console.log('🔗 URL indexada:', url);

    return response.data;
  } catch (error) {
    console.error('❌ Error al notificar a Google:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
    throw error;
  }
}

// Obtener URL del artículo desde argumentos de línea de comandos
const articleUrl = process.argv[2];

if (!articleUrl) {
  console.error('❌ Error: Debes proporcionar la URL del artículo');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/index-new-blog-post.js https://aisecurity.es/blog/slug-del-articulo');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node scripts/index-new-blog-post.js https://aisecurity.es/blog/ia-threat-hunting-wazuh');
  process.exit(1);
}

// Validar que sea una URL válida
try {
  new URL(articleUrl);
} catch (error) {
  console.error('❌ Error: URL inválida');
  process.exit(1);
}

// Ejecutar
notifyGoogle(articleUrl)
  .then(() => {
    console.log('');
    console.log('🎉 Proceso completado con éxito');
    console.log('Google indexará esta página en las próximas horas');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
