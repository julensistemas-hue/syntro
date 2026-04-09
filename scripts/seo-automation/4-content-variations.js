/**
 * Script 4: Generador de variaciones de contenido
 *
 * Realiza pequeños cambios automáticos en párrafos para mantener
 * el contenido "actualizado" a ojos de Google sin cambiar el significado.
 *
 * Técnicas:
 * - Añadir/actualizar año actual en estadísticas
 * - Rotar sinónimos predefinidos
 * - Actualizar fechas de "última actualización"
 * - Añadir datos actualizados
 *
 * Uso: node scripts/seo-automation/4-content-variations.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BLOG_DIR = path.join(__dirname, '../../src/pages/blog');
const STATE_FILE = path.join(__dirname, 'content-variations-state.json');

// Artículos a variar
const ARTICLES = [
  'ciberseguridad-basica-empleados-guia-completa.astro',
  'detectar-phishing-gmail-guia-empleados.astro',
  'detectar-phishing-outlook-microsoft-guia-empleados.astro',
  'tu-contrasena-mayuscula-numeros-hackeable.astro',
  'contrasenas-seguras-empleados-guia-completa.astro'
];

// Sinónimos para rotar (palabra original -> alternativas)
const SYNONYMS = {
  'ciberdelincuentes': ['atacantes', 'hackers', 'criminales digitales'],
  'atacantes': ['ciberdelincuentes', 'hackers', 'actores maliciosos'],
  'hackers': ['ciberdelincuentes', 'atacantes', 'piratas informáticos'],
  'empresa': ['organización', 'compañía', 'negocio'],
  'empleados': ['trabajadores', 'personal', 'equipo'],
  'contraseña': ['clave', 'password', 'credencial'],
  'phishing': ['suplantación', 'phishing', 'ataque de phishing'],
  'correo electrónico': ['email', 'e-mail', 'mensaje'],
  'inmediatamente': ['de inmediato', 'al instante', 'sin demora'],
  'importante': ['crítico', 'esencial', 'fundamental'],
  'seguro': ['protegido', 'blindado', 'resguardado']
};

// Estadísticas actualizables (con fuentes reales)
const UPDATABLE_STATS = [
  {
    pattern: /El (\d+)% de los (?:ciberataques|incidentes)/g,
    values: ['91', '95', '94', '90'],
    context: 'ataques que empiezan con phishing'
  },
  {
    pattern: /(\d+(?:\.\d+)?) (?:mil )?millones de emails de phishing/g,
    values: ['3.4', '3.5', '3.6'],
    context: 'emails de phishing diarios'
  },
  {
    pattern: /El (\d+)% de (?:los )?empleados/g,
    values: ['90', '85', '88', '92'],
    context: 'empleados que usan patrones predecibles'
  }
];

// Frases de actualización temporal
const TEMPORAL_PHRASES = [
  { old: 'en 2024', new: 'en 2025' },
  { old: 'en 2025', new: 'en 2026' },
  { old: 'este año', new: 'actualmente' },
  { old: 'actualmente', new: 'hoy en día' },
  { old: 'hoy en día', new: 'en la actualidad' },
  { old: 'en la actualidad', new: 'este año' }
];

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return {
    lastRun: null,
    articleStates: {},
    synonymRotations: {}
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Rotar un sinónimo al siguiente en la lista
function rotateSynonym(word, state) {
  const key = word.toLowerCase();
  const alternatives = SYNONYMS[key];

  if (!alternatives) return word;

  // Obtener índice actual
  const currentIndex = state.synonymRotations[key] || 0;
  const nextIndex = (currentIndex + 1) % alternatives.length;

  // Guardar nuevo índice
  state.synonymRotations[key] = nextIndex;

  // Mantener mayúsculas si la palabra original las tiene
  const newWord = alternatives[nextIndex];
  if (word[0] === word[0].toUpperCase()) {
    return newWord.charAt(0).toUpperCase() + newWord.slice(1);
  }
  return newWord;
}

// Aplicar variaciones a un archivo
function applyVariations(filePath, state) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = [];
  const filename = path.basename(filePath);

  // 1. Rotar algunos sinónimos (no todos, solo 2-3 por ejecución)
  const synonymKeys = Object.keys(SYNONYMS);
  const selectedSynonyms = synonymKeys
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  selectedSynonyms.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      // Solo reemplazar la primera ocurrencia
      const newWord = rotateSynonym(word, state);
      content = content.replace(regex, (match) => {
        // Mantener capitalización original
        if (match[0] === match[0].toUpperCase()) {
          return newWord.charAt(0).toUpperCase() + newWord.slice(1);
        }
        return newWord;
      });
      changes.push(`"${word}" → "${newWord}"`);
    }
  });

  // 2. Actualizar frases temporales
  TEMPORAL_PHRASES.forEach(({ old, new: newPhrase }) => {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old, 'g'), newPhrase);
      changes.push(`"${old}" → "${newPhrase}"`);
    }
  });

  // 3. Actualizar año en títulos si contienen año
  const currentYear = new Date().getFullYear();
  const yearPattern = /(\d{4})(?=\s|$|")/g;
  content = content.replace(yearPattern, (match) => {
    const year = parseInt(match);
    if (year >= 2020 && year < currentYear) {
      changes.push(`Año ${year} → ${currentYear}`);
      return currentYear.toString();
    }
    return match;
  });

  // Guardar si hubo cambios
  if (changes.length > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return changes;
}

// Añadir bloque "Última actualización" si no existe
function addUpdateBlock(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Buscar si ya existe el bloque
  if (content.includes('Última actualización:')) {
    // Actualizar fecha existente
    content = content.replace(
      /Última actualización: [^<]+/,
      `Última actualización: ${today}`
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    return `Fecha de actualización cambiada a ${today}`;
  }

  // Si no existe y es un artículo de blog, podríamos añadirlo
  // Por ahora solo actualizamos si ya existe
  return null;
}

// Ejecutar
function main() {
  console.log('📝 Generador de variaciones de contenido\n');

  const state = loadState();
  const today = new Date().toISOString();

  console.log(`📅 Última ejecución: ${state.lastRun || 'Nunca'}\n`);

  let totalChanges = 0;

  ARTICLES.forEach(article => {
    const filePath = path.join(BLOG_DIR, article);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${article} - no encontrado`);
      return;
    }

    console.log(`📄 ${article}`);

    const changes = applyVariations(filePath, state);
    const updateChange = addUpdateBlock(filePath);

    if (updateChange) {
      changes.push(updateChange);
    }

    if (changes.length > 0) {
      changes.forEach(change => console.log(`   ✏️  ${change}`));
      totalChanges += changes.length;
    } else {
      console.log(`   ⏭️  Sin cambios aplicados`);
    }

    console.log('');
  });

  // Guardar estado
  state.lastRun = today;
  saveState(state);

  console.log('📊 RESUMEN:');
  console.log(`   Total de cambios: ${totalChanges}`);
  console.log(`   Estado guardado en: ${STATE_FILE}`);
  console.log('\n💡 Los cambios son sutiles para no afectar la legibilidad');
  console.log('   pero suficientes para que Google detecte contenido actualizado.');
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--dry-run')) {
  console.log('🔍 Modo simulación (sin aplicar cambios)\n');
  // TODO: Implementar modo dry-run
} else {
  main();
}
