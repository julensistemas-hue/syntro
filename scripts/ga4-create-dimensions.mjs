/**
 * Registra custom dimensions en GA4 Admin vía API.
 * Uso: node scripts/ga4-create-dimensions.mjs
 */
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
}

const PROPERTY_ID = '519124169';

let auth;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.edit'],
  });
} else {
  auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/analytics.edit'],
  });
}

const admin = google.analyticsadmin({ version: 'v1beta', auth });

// Dimensiones a registrar
const DIMENSIONS = [
  { parameterName: 'page_type',    displayName: 'Tipo de página',     description: 'home/blog_post/servicio/consultoria/curso/wazuh/reunion/presupuesto' },
  { parameterName: 'link_url',     displayName: 'URL del enlace',      description: 'URL destino del enlace clicado' },
];

async function listExisting() {
  try {
    const res = await admin.properties.customDimensions.list({ parent: `properties/${PROPERTY_ID}` });
    return (res.data.customDimensions || []).map(d => d.parameterName);
  } catch (e) {
    console.error('Error listando dimensiones:', e.message);
    return [];
  }
}

async function createDimension(dim) {
  try {
    const res = await admin.properties.customDimensions.create({
      parent: `properties/${PROPERTY_ID}`,
      requestBody: {
        parameterName: dim.parameterName,
        displayName:   dim.displayName,
        description:   dim.description,
        scope:         'EVENT',
      },
    });
    console.log(`✅ Creada: ${dim.parameterName} → ${res.data.name}`);
    return true;
  } catch (e) {
    if (e.message?.includes('already exists') || e.code === 409) {
      console.log(`⏭️  Ya existe: ${dim.parameterName}`);
      return true;
    }
    console.error(`❌ Error creando ${dim.parameterName}:`, e.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Registrando custom dimensions en GA4...\n');
  const existing = await listExisting();
  console.log('Existentes:', existing.join(', ') || 'ninguna');
  console.log('');

  for (const dim of DIMENSIONS) {
    if (existing.includes(dim.parameterName)) {
      console.log(`⏭️  Ya existe: ${dim.parameterName}`);
    } else {
      await createDimension(dim);
    }
  }

  console.log('\n✅ Listo. Las dimensiones estarán disponibles en los informes en ~24h.');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
