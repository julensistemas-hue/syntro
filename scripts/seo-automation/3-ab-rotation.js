/**
 * Script 3: Rotación A/B de títulos y descripciones
 *
 * Rota entre diferentes variaciones de títulos y meta descriptions
 * para probar qué versión posiciona mejor en Google.
 *
 * Guarda métricas para comparar rendimiento entre variaciones.
 *
 * Uso: node scripts/seo-automation/3-ab-rotation.js
 * Programar: Ejecutar cada 2 semanas para dar tiempo a medir resultados
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BLOG_DIR = path.join(__dirname, '../../src/pages/blog');
const STATE_FILE = path.join(__dirname, 'ab-state.json');

// Variaciones A/B para cada artículo
const AB_VARIATIONS = {
  'ciberseguridad-basica-empleados-guia-completa': {
    titles: [
      'Ciberseguridad Básica para Empleados: Guía Completa 2025',
      'Test de Ciberseguridad para Empleados: Guía Práctica 2025',
      'Concienciación en Ciberseguridad: Guía para Empleados con Test'
    ],
    descriptions: [
      'Guía práctica de ciberseguridad para empleados: contraseñas, phishing, WiFi, dispositivos e ingeniería social. Incluye test de concienciación gratuito para evaluar a tu equipo.',
      'Test de concienciación en ciberseguridad para empresas. Evalúa a tus empleados en phishing, contraseñas y seguridad digital. Cumple ISO 27001 y ENS.',
      'Plataforma de tests de seguridad para empleados. Mide el nivel de concienciación de tu equipo con evaluaciones de phishing, contraseñas y ciberseguridad.'
    ]
  },
  'detectar-phishing-gmail-guia-empleados': {
    titles: [
      'Cómo detectar emails de phishing en Gmail: Guía para empleados',
      'Test de Phishing en Gmail para Empleados: Aprende a Detectarlo',
      'Detectar Phishing en Gmail: Test de Concienciación para Empresas'
    ],
    descriptions: [
      'Aprende a identificar emails fraudulentos en Gmail. Verifica remitentes, detecta enlaces sospechosos y evalúa a tu equipo con nuestro test de concienciación gratuito para empleados.',
      'Test de phishing para empleados que usan Gmail. Entrena a tu equipo para detectar emails fraudulentos y cumple requisitos ISO 27001.',
      'Evaluación de phishing en Gmail para empresas. Mide cuántos empleados caerían en un ataque de phishing con nuestro test gratuito.'
    ]
  },
  'detectar-phishing-outlook-microsoft-guia-empleados': {
    titles: [
      'Cómo detectar emails de phishing en Outlook y Microsoft 365: Guía para empleados',
      'Test de Phishing en Outlook para Empleados: Detecta Amenazas',
      'Phishing en Microsoft 365: Test de Concienciación para Empresas'
    ],
    descriptions: [
      'Aprende a identificar emails fraudulentos en Outlook y Microsoft 365. Verifica remitentes, detecta enlaces sospechosos y prueba nuestro test de concienciación gratuito para empleados.',
      'Test de phishing para usuarios de Outlook y Microsoft 365. Evalúa la preparación de tu equipo contra ataques de suplantación.',
      'Simulación de phishing para empresas con Microsoft 365. Descubre cuántos empleados detectarían un email fraudulento.'
    ]
  },
  'tu-contrasena-mayuscula-numeros-hackeable': {
    titles: [
      '¿Tu contraseña empieza con mayúscula y acaba en números? Es hackeable',
      'Test: ¿Tu Contraseña es Segura? El Patrón Mayúscula+Números es Hackeable',
      'Contraseñas Hackeables: Por qué Empresa2024 No es Segura (con Test)'
    ],
    descriptions: [
      'Si tu contraseña sigue el patrón Palabra2024 o similar, los hackers la descifran en minutos. Descubre por qué este patrón es predecible y prueba nuestro test de concienciación gratuito para empleados.',
      'El 90% de empleados usa contraseñas predecibles como Empresa2024. Evalúa a tu equipo con nuestro test de seguridad de contraseñas.',
      'Test de contraseñas para empresas: ¿Cuántos empleados usan patrones hackeables? Descúbrelo con nuestra evaluación gratuita.'
    ]
  },
  'contrasenas-seguras-empleados-guia-completa': {
    titles: [
      'Contraseñas Seguras para Empleados: Guía Completa 2025',
      'Test de Contraseñas Seguras: Curso para Empleados con Evaluación',
      'Formación en Contraseñas Seguras: Guía con Test para Empresas'
    ],
    descriptions: [
      'Mini-curso gratuito de seguridad de contraseñas. Aprende a crear contraseñas seguras, usar gestores como Passbolt, activar 2FA y cumplir ISO 27001 y ENS.',
      'Curso de contraseñas seguras con test de evaluación. Forma a tus empleados en gestores de contraseñas, 2FA y buenas prácticas.',
      'Plataforma de formación en contraseñas para empresas. Incluye test de evaluación, certificado y seguimiento del progreso del equipo.'
    ]
  }
};

// Cargar estado actual
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  // Estado inicial: todos en variación 0
  const state = {
    currentVariations: {},
    history: [],
    lastRotation: null
  };
  Object.keys(AB_VARIATIONS).forEach(slug => {
    state.currentVariations[slug] = { titleIndex: 0, descIndex: 0 };
  });
  return state;
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Rotar a la siguiente variación
function rotateVariation(current, maxIndex) {
  return (current + 1) % maxIndex;
}

// Actualizar archivo .astro con nueva variación
function updateArticle(slug, titleIndex, descIndex) {
  const filePath = path.join(BLOG_DIR, `${slug}.astro`);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${slug}.astro no encontrado`);
    return false;
  }

  const variations = AB_VARIATIONS[slug];
  const newTitle = variations.titles[titleIndex];
  const newDesc = variations.descriptions[descIndex];

  let content = fs.readFileSync(filePath, 'utf-8');

  // Actualizar título
  content = content.replace(
    /title="[^"]+"/,
    `title="${newTitle}"`
  );

  // Actualizar descripción
  content = content.replace(
    /description="[^"]+"/,
    `description="${newDesc}"`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

// Actualizar blog index
function updateBlogIndex(slug, titleIndex, descIndex) {
  const indexPath = path.join(BLOG_DIR, 'index.astro');
  let content = fs.readFileSync(indexPath, 'utf-8');

  const variations = AB_VARIATIONS[slug];
  const newTitle = variations.titles[titleIndex];
  const newDesc = variations.descriptions[descIndex];

  // Buscar el bloque del artículo y actualizar
  const titleRegex = new RegExp(`(slug: "${slug}"[^}]*title: ")[^"]+(")`);
  const descRegex = new RegExp(`(slug: "${slug}"[^}]*description: ")[^"]+(")`);

  content = content.replace(titleRegex, `$1${newTitle}$2`);
  content = content.replace(descRegex, `$1${newDesc}$2`);

  fs.writeFileSync(indexPath, content, 'utf-8');
}

// Ejecutar rotación
function runRotation() {
  console.log('🔄 Rotación A/B de títulos y descripciones\n');

  const state = loadState();
  const today = new Date().toISOString();

  console.log(`📅 Última rotación: ${state.lastRotation || 'Nunca'}\n`);

  const rotationResults = [];

  Object.keys(AB_VARIATIONS).forEach(slug => {
    const variations = AB_VARIATIONS[slug];
    const current = state.currentVariations[slug];

    // Rotar ambos índices
    const newTitleIndex = rotateVariation(current.titleIndex, variations.titles.length);
    const newDescIndex = rotateVariation(current.descIndex, variations.descriptions.length);

    console.log(`📝 ${slug}`);
    console.log(`   Título: variación ${current.titleIndex} → ${newTitleIndex}`);
    console.log(`   Descripción: variación ${current.descIndex} → ${newDescIndex}`);

    // Actualizar archivos
    const articleUpdated = updateArticle(slug, newTitleIndex, newDescIndex);
    if (articleUpdated) {
      updateBlogIndex(slug, newTitleIndex, newDescIndex);
      console.log(`   ✅ Actualizado`);

      // Guardar nuevo estado
      state.currentVariations[slug] = {
        titleIndex: newTitleIndex,
        descIndex: newDescIndex
      };

      rotationResults.push({
        slug,
        from: { title: current.titleIndex, desc: current.descIndex },
        to: { title: newTitleIndex, desc: newDescIndex },
        newTitle: variations.titles[newTitleIndex],
        newDesc: variations.descriptions[newDescIndex]
      });
    }

    console.log('');
  });

  // Guardar historial
  state.history.push({
    timestamp: today,
    rotations: rotationResults
  });
  state.lastRotation = today;

  saveState(state);

  console.log('📊 RESUMEN:');
  console.log(`   Artículos rotados: ${rotationResults.length}`);
  console.log(`   Estado guardado en: ${STATE_FILE}`);
  console.log('\n💡 Recuerda:');
  console.log('   1. Hacer git commit y push');
  console.log('   2. Esperar 2 semanas antes de la siguiente rotación');
  console.log('   3. Comparar métricas en Search Console entre rotaciones');
}

// Mostrar estado actual sin rotar
function showCurrentState() {
  const state = loadState();

  console.log('📊 ESTADO ACTUAL DE VARIACIONES A/B\n');
  console.log(`Última rotación: ${state.lastRotation || 'Nunca'}\n`);

  Object.keys(AB_VARIATIONS).forEach(slug => {
    const current = state.currentVariations[slug];
    const variations = AB_VARIATIONS[slug];

    console.log(`📝 ${slug}`);
    console.log(`   Título (${current.titleIndex}/${variations.titles.length - 1}): ${variations.titles[current.titleIndex].substring(0, 60)}...`);
    console.log(`   Descripción (${current.descIndex}/${variations.descriptions.length - 1}): ${variations.descriptions[current.descIndex].substring(0, 60)}...`);
    console.log('');
  });
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--status')) {
  showCurrentState();
} else if (args.includes('--rotate')) {
  runRotation();
} else {
  console.log('🔄 Script de Rotación A/B\n');
  console.log('Uso:');
  console.log('  node 3-ab-rotation.js --status   Ver estado actual');
  console.log('  node 3-ab-rotation.js --rotate   Ejecutar rotación');
  console.log('\n💡 Ejecuta --status primero para ver las variaciones actuales');
}
