/**
 * Script maestro: Ejecuta todas las automatizaciones SEO
 *
 * Uso: node scripts/seo-automation/run-all.js
 *
 * Acciones:
 * 1. Actualiza fechas de publicación
 * 2. Genera variaciones de contenido
 * 3. Hace ping a buscadores
 * 4. (Opcional) Solicita indexación en Google
 * 5. Hace commit y push automático
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPTS_DIR = __dirname;
const PROJECT_DIR = path.join(__dirname, '../..');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, description) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);

  if (!fs.existsSync(scriptPath)) {
    log(`   ❌ Script no encontrado: ${scriptName}`, 'red');
    return false;
  }

  log(`\n${'─'.repeat(60)}`, 'cyan');
  log(`📌 ${description}`, 'blue');
  log(`${'─'.repeat(60)}`, 'cyan');

  try {
    execSync(`node "${scriptPath}"`, {
      cwd: PROJECT_DIR,
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    log(`   ❌ Error ejecutando ${scriptName}`, 'red');
    return false;
  }
}

async function gitCommitAndPush() {
  log(`\n${'─'.repeat(60)}`, 'cyan');
  log(`📌 Git: Commit y Push`, 'blue');
  log(`${'─'.repeat(60)}`, 'cyan');

  try {
    // Verificar si hay cambios
    const status = execSync('git status --porcelain', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    });

    if (!status.trim()) {
      log('   ⏭️  No hay cambios para commitear', 'yellow');
      return true;
    }

    // Mostrar cambios
    log('\n   Archivos modificados:', 'cyan');
    status.split('\n').filter(Boolean).forEach(line => {
      log(`     ${line}`, 'reset');
    });

    // Add, commit, push
    const commitMessage = `SEO: Auto-update content and dates (${new Date().toISOString().split('T')[0]})`;

    execSync('git add -A', { cwd: PROJECT_DIR, stdio: 'inherit' });
    execSync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_DIR, stdio: 'inherit' });
    execSync('git push', { cwd: PROJECT_DIR, stdio: 'inherit' });

    log('\n   ✅ Cambios pusheados a producción', 'green');
    return true;
  } catch (error) {
    log(`   ❌ Error en git: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const startTime = Date.now();

  log('\n' + '═'.repeat(60), 'cyan');
  log('   🚀 AUTOMATIZACIÓN SEO - AI SECURITY', 'green');
  log('═'.repeat(60), 'cyan');
  log(`   Fecha: ${new Date().toLocaleString('es-ES')}`, 'reset');

  const results = [];

  // 1. Actualizar fechas
  results.push({
    name: 'Actualizar fechas',
    success: runScript('1-update-dates.js', '1. Actualizando fechas de publicación')
  });

  // 2. Variaciones de contenido
  results.push({
    name: 'Variaciones contenido',
    success: runScript('4-content-variations.js', '2. Generando variaciones de contenido')
  });

  // 3. Ping a buscadores
  results.push({
    name: 'Ping buscadores',
    success: runScript('5-ping-search-engines.js', '3. Notificando a buscadores')
  });

  // 4. Git commit y push
  results.push({
    name: 'Git push',
    success: await gitCommitAndPush()
  });

  // Resumen final
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  log('\n' + '═'.repeat(60), 'cyan');
  log('   📊 RESUMEN FINAL', 'green');
  log('═'.repeat(60), 'cyan');

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const color = r.success ? 'green' : 'red';
    log(`   ${icon} ${r.name}`, color);
  });

  const successCount = results.filter(r => r.success).length;
  log(`\n   Total: ${successCount}/${results.length} exitosos`, successCount === results.length ? 'green' : 'yellow');
  log(`   Tiempo: ${duration}s`, 'reset');

  // Próximos pasos
  log('\n' + '─'.repeat(60), 'cyan');
  log('   💡 PRÓXIMOS PASOS:', 'yellow');
  log('─'.repeat(60), 'cyan');
  log('   1. Verificar deploy en Vercel', 'reset');
  log('   2. Revisar Search Console en 24-48h', 'reset');
  log('   3. Ejecutar rotación A/B cada 2 semanas:', 'reset');
  log('      node scripts/seo-automation/3-ab-rotation.js --rotate', 'cyan');
  log('   4. Configurar Google Indexing API para indexación instantánea', 'reset');
  log('\n');
}

// Verificar argumentos
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
Uso: node run-all.js [opciones]

Opciones:
  --help        Muestra esta ayuda
  --no-git      No hacer commit/push automático
  --dry-run     Simular sin aplicar cambios

Scripts individuales:
  1-update-dates.js       Actualiza fechas de publicación
  2-google-indexing.js    Solicita indexación en Google (requiere setup)
  3-ab-rotation.js        Rota títulos/descripciones A/B
  4-content-variations.js Genera variaciones de contenido
  5-ping-search-engines.js Notifica a buscadores

Programación recomendada (Task Scheduler de Windows):
  - Diario: run-all.js (actualiza fechas + ping)
  - Cada 2 semanas: 3-ab-rotation.js --rotate
  `);
  process.exit(0);
}

main().catch(console.error);
