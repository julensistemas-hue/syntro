/**
 * Script 1: Auto-actualizar fechas de publicación
 *
 * Actualiza publishDate y añade modifiedDate a los artículos del blog
 * para que Google vea contenido "fresco" y mejore el posicionamiento.
 *
 * Uso: node scripts/seo-automation/1-update-dates.js
 * Programar: Ejecutar semanalmente con Task Scheduler de Windows
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BLOG_DIR = path.join(__dirname, '../../src/pages/blog');
const BLOG_INDEX = path.join(BLOG_DIR, 'index.astro');

// Artículos de concienciación a actualizar (los que queremos posicionar)
const ARTICLES_TO_UPDATE = [
  'ciberseguridad-basica-empleados-guia-completa.astro',
  'detectar-phishing-outlook-microsoft-guia-empleados.astro',
  'detectar-phishing-gmail-guia-empleados.astro',
  'tu-contrasena-mayuscula-numeros-hackeable.astro',
  'contrasenas-seguras-empleados-guia-completa.astro'
];

// Función para obtener fecha actual en formato YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Función para actualizar modifiedDate en un archivo .astro
function updateArticleDate(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const today = getTodayDate();

  let updated = content;

  // Si ya tiene modifiedDate, actualizarlo
  if (content.includes('modifiedDate=')) {
    updated = content.replace(
      /modifiedDate="[\d-]+"/,
      `modifiedDate="${today}"`
    );
  }
  // Si no tiene modifiedDate pero tiene publishDate, añadirlo después
  else if (content.includes('publishDate=')) {
    updated = content.replace(
      /(publishDate="[\d-]+")/,
      `$1\n  modifiedDate="${today}"`
    );
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    return true;
  }
  return false;
}

// Función para actualizar el índice del blog
function updateBlogIndex() {
  const content = fs.readFileSync(BLOG_INDEX, 'utf-8');
  const today = getTodayDate();

  // Actualizar las fechas en el array de articles para los artículos de concienciación
  let updated = content;

  ARTICLES_TO_UPDATE.forEach(article => {
    const slug = article.replace('.astro', '');
    // Buscar el bloque del artículo y actualizar su publishDate
    const regex = new RegExp(
      `(slug: "${slug}"[^}]*publishDate: ")([\\d-]+)(")`
    );
    updated = updated.replace(regex, `$1${today}$3`);
  });

  if (updated !== content) {
    fs.writeFileSync(BLOG_INDEX, updated, 'utf-8');
    return true;
  }
  return false;
}

// Ejecutar
console.log('🗓️  Actualizando fechas de artículos de concienciación...\n');

let updatedCount = 0;

ARTICLES_TO_UPDATE.forEach(article => {
  const filePath = path.join(BLOG_DIR, article);
  if (fs.existsSync(filePath)) {
    const wasUpdated = updateArticleDate(filePath);
    if (wasUpdated) {
      console.log(`✅ ${article} - modifiedDate actualizado`);
      updatedCount++;
    } else {
      console.log(`⏭️  ${article} - sin cambios necesarios`);
    }
  } else {
    console.log(`❌ ${article} - archivo no encontrado`);
  }
});

// Actualizar índice
const indexUpdated = updateBlogIndex();
if (indexUpdated) {
  console.log(`\n✅ index.astro - fechas actualizadas`);
}

console.log(`\n📊 Resumen: ${updatedCount} artículos actualizados`);
console.log(`📅 Nueva fecha: ${getTodayDate()}`);
console.log('\n💡 Recuerda hacer git commit y push para que los cambios se reflejen en producción');
