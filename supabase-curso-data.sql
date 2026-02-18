-- =====================================================
-- DATOS DEL CURSO: Módulo 1 - Introducción a Wazuh
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =====================================================

-- Primero eliminar los datos de ejemplo existentes
DELETE FROM lessons;
DELETE FROM modules;

-- =====================================================
-- MÓDULO 1: Introducción a Wazuh
-- =====================================================
INSERT INTO modules (id, title, description, order_index, is_published) VALUES
(1, 'Introducción a Wazuh', 'Conoce qué es Wazuh, para qué sirve y cómo puede ayudarte a securizar tu infraestructura. Este módulo sienta las bases para el resto del curso.', 1, true);

-- =====================================================
-- LECCIONES DEL MÓDULO 1
-- Usando un video público de YouTube para pruebas
-- =====================================================

-- Lección 1: Qué es Wazuh y para qué sirve (6 min)
INSERT INTO lessons (id, module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
(1, 1, '¿Qué es Wazuh y para qué sirve?',
'Introducción completa a Wazuh: qué es este SIEM open-source, sus principales características y por qué es la elección de miles de empresas para proteger su infraestructura.',
'https://youtu.be/DKCmZz88ihQ',
6, 1, true,
'<h2>¿Qué es Wazuh?</h2>
<p>Wazuh es una plataforma de seguridad <strong>open-source</strong> que proporciona capacidades de detección de amenazas, monitoreo de integridad de archivos, respuesta a incidentes y cumplimiento normativo.</p>

<h3>Características principales:</h3>
<ul>
  <li><strong>Detección de intrusiones</strong>: Identifica amenazas en tiempo real analizando logs y eventos del sistema</li>
  <li><strong>Monitoreo de integridad</strong>: Detecta cambios no autorizados en archivos críticos</li>
  <li><strong>Análisis de vulnerabilidades</strong>: Escanea sistemas en busca de software desactualizado</li>
  <li><strong>Cumplimiento normativo</strong>: Ayuda a cumplir con ENS, GDPR, PCI-DSS, HIPAA y más</li>
</ul>

<h3>¿Por qué elegir Wazuh?</h3>
<ul>
  <li>100% Open Source - Sin costes de licencia</li>
  <li>Escalable - De 1 a miles de agentes</li>
  <li>Comunidad activa - Soporte y documentación excelentes</li>
  <li>Integrable - Funciona con Elastic, Grafana, SOAR y más</li>
</ul>',
'[
  {"name": "Documentación oficial Wazuh", "url": "https://documentation.wazuh.com", "type": "link"},
  {"name": "Wazuh en GitHub", "url": "https://github.com/wazuh/wazuh", "type": "link"}
]'::jsonb);

-- Lección 2: Introducción al curso (IMPORTANTE VER)
INSERT INTO lessons (id, module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
(2, 1, 'Introducción al curso (¡Importante ver!)',
'Bienvenida al curso, estructura del contenido, qué vas a aprender y cómo sacar el máximo provecho. Lee esto antes de continuar.',
'https://youtu.be/DKCmZz88ihQ',
8, 2, true,
'<h2>Bienvenido al Curso Intensivo de Wazuh</h2>

<p>En este curso aprenderás a implementar, configurar y mantener Wazuh en entornos empresariales reales. Está diseñado para administradores de sistemas, técnicos de seguridad y profesionales IT que necesitan implementar un SIEM para cumplimiento normativo (especialmente <strong>ENS - Esquema Nacional de Seguridad</strong>).</p>

<h3>¿Qué vas a aprender?</h3>
<ol>
  <li><strong>Fundamentos</strong>: Arquitectura, componentes y flujo de datos de Wazuh</li>
  <li><strong>Instalación</strong>: En Linux, Docker y Windows - elige tu entorno preferido</li>
  <li><strong>Configuración</strong>: Agentes, reglas personalizadas y decoders</li>
  <li><strong>Cumplimiento ENS</strong>: Configuraciones específicas para el Esquema Nacional de Seguridad</li>
  <li><strong>Dashboards</strong>: Visualización de datos y alertas</li>
</ol>

<h3>Cómo aprovechar el curso</h3>
<ul>
  <li>📺 <strong>Ve los videos</strong>: Cada lección incluye explicación teórica y práctica</li>
  <li>📥 <strong>Descarga los recursos</strong>: Scripts, configuraciones y documentos complementarios</li>
  <li>💬 <strong>Pregunta tus dudas</strong>: Usa la sección de comentarios de cada lección</li>
  <li>✅ <strong>Marca tu progreso</strong>: Te ayudará a retomar donde lo dejaste</li>
</ul>

<div style="background: rgba(0, 101, 255, 0.1); border: 1px solid rgba(0, 101, 255, 0.3); padding: 16px; border-radius: 8px; margin-top: 20px;">
  <strong>💡 Consejo:</strong> Te recomiendo tener una máquina virtual o VPS lista para practicar durante el curso. Puedes usar cualquier distribución Linux (Ubuntu Server 22.04 recomendado).
</div>',
'[
  {"name": "Requisitos del curso (PDF)", "url": "/recursos/requisitos-curso-wazuh.pdf", "type": "pdf"},
  {"name": "Checklist pre-instalación", "url": "/recursos/checklist-wazuh.pdf", "type": "pdf"}
]'::jsonb);

-- Lección 3: Instalación en Linux
INSERT INTO lessons (id, module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
(3, 1, 'Instalación de Wazuh en Linux',
'Guía paso a paso para instalar Wazuh en un servidor Linux. Cubrimos Ubuntu, Debian, CentOS y Rocky Linux.',
'https://youtu.be/DKCmZz88ihQ',
18, 3, true,
'<h2>Instalación de Wazuh en Linux</h2>

<p>Esta lección te guía a través del proceso completo de instalación de Wazuh en un servidor Linux. Usaremos el instalador oficial "all-in-one" que configura todos los componentes automáticamente.</p>

<h3>Requisitos mínimos</h3>
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <tr style="background: rgba(255,255,255,0.1);">
    <th style="padding: 8px; text-align: left; border: 1px solid #374151;">Componente</th>
    <th style="padding: 8px; text-align: left; border: 1px solid #374151;">Mínimo</th>
    <th style="padding: 8px; text-align: left; border: 1px solid #374151;">Recomendado</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #374151;">CPU</td>
    <td style="padding: 8px; border: 1px solid #374151;">2 cores</td>
    <td style="padding: 8px; border: 1px solid #374151;">4 cores</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #374151;">RAM</td>
    <td style="padding: 8px; border: 1px solid #374151;">4 GB</td>
    <td style="padding: 8px; border: 1px solid #374151;">8 GB</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #374151;">Disco</td>
    <td style="padding: 8px; border: 1px solid #374151;">50 GB</td>
    <td style="padding: 8px; border: 1px solid #374151;">100 GB SSD</td>
  </tr>
</table>

<h3>Comando de instalación</h3>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh && sudo bash ./wazuh-install.sh -a</code></pre>

<h3>Distribuciones soportadas</h3>
<ul>
  <li>Ubuntu 18.04, 20.04, 22.04 LTS</li>
  <li>Debian 10, 11, 12</li>
  <li>CentOS 7, 8</li>
  <li>Rocky Linux 8, 9</li>
  <li>Amazon Linux 2</li>
</ul>

<div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 16px; border-radius: 8px; margin-top: 20px;">
  <strong>⚠️ Importante:</strong> El instalador genera automáticamente las credenciales de acceso. Guárdalas en un lugar seguro - las necesitarás para acceder al dashboard.
</div>',
'[
  {"name": "Script de instalación Wazuh", "url": "https://packages.wazuh.com/4.7/wazuh-install.sh", "type": "link"},
  {"name": "Guía oficial de instalación", "url": "https://documentation.wazuh.com/current/installation-guide/", "type": "link"},
  {"name": "Comandos post-instalación", "url": "/recursos/comandos-wazuh-linux.txt", "type": "other"}
]'::jsonb);

-- Lección 4: Instalación en Docker
INSERT INTO lessons (id, module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
(4, 1, 'Instalación de Wazuh en Docker',
'Despliega Wazuh usando Docker y Docker Compose. Ideal para entornos de desarrollo, pruebas o laboratorios.',
'https://youtu.be/DKCmZz88ihQ',
15, 4, true,
'<h2>Wazuh con Docker</h2>

<p>Docker es una excelente opción para desplegar Wazuh rápidamente, especialmente en entornos de desarrollo, pruebas o laboratorios. En esta lección aprenderás a usar el repositorio oficial de Docker de Wazuh.</p>

<h3>Requisitos previos</h3>
<ul>
  <li>Docker Engine 20.10 o superior</li>
  <li>Docker Compose v2</li>
  <li>Al menos 6 GB de RAM disponibles</li>
  <li>50 GB de espacio en disco</li>
</ul>

<h3>Pasos de instalación</h3>

<h4>1. Clonar el repositorio</h4>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>git clone https://github.com/wazuh/wazuh-docker.git -b v4.7.0
cd wazuh-docker/single-node</code></pre>

<h4>2. Generar certificados</h4>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>docker compose -f generate-indexer-certs.yml run --rm generator</code></pre>

<h4>3. Iniciar los servicios</h4>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>docker compose up -d</code></pre>

<h4>4. Acceder al dashboard</h4>
<p>Una vez iniciado, accede a <code>https://localhost</code> con las credenciales por defecto:</p>
<ul>
  <li><strong>Usuario:</strong> admin</li>
  <li><strong>Contraseña:</strong> SecretPassword</li>
</ul>

<div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 16px; border-radius: 8px; margin-top: 20px;">
  <strong>✅ Ventaja:</strong> Con Docker puedes tener Wazuh funcionando en menos de 10 minutos. Perfecto para probar configuraciones antes de implementar en producción.
</div>',
'[
  {"name": "Repositorio wazuh-docker", "url": "https://github.com/wazuh/wazuh-docker", "type": "link"},
  {"name": "docker-compose.yml personalizado", "url": "/recursos/docker-compose-wazuh.yml", "type": "other"},
  {"name": "Guía Docker oficial", "url": "https://documentation.wazuh.com/current/deployment-options/docker/", "type": "link"}
]'::jsonb);

-- Lección 5: Instalación en Windows
INSERT INTO lessons (id, module_id, title, description, video_url, duration_minutes, order_index, is_published, text_content, resources) VALUES
(5, 1, 'Instalación de Wazuh en Windows',
'Cómo instalar el agente de Wazuh en Windows y conectarlo al manager. Incluye configuración del firewall y troubleshooting.',
'https://youtu.be/DKCmZz88ihQ',
12, 5, true,
'<h2>Agente Wazuh en Windows</h2>

<p>El agente de Wazuh para Windows te permite monitorizar estaciones de trabajo y servidores Windows. En esta lección aprenderás a instalarlo, configurarlo y conectarlo a tu Wazuh Manager.</p>

<h3>Requisitos</h3>
<ul>
  <li>Windows 7 SP1 o superior / Windows Server 2008 R2 o superior</li>
  <li>Permisos de administrador</li>
  <li>Conectividad al Wazuh Manager (puerto 1514/TCP)</li>
</ul>

<h3>Métodos de instalación</h3>

<h4>Opción 1: Instalador MSI (GUI)</h4>
<ol>
  <li>Descarga el instalador desde <a href="https://packages.wazuh.com/4.x/windows/">packages.wazuh.com</a></li>
  <li>Ejecuta el instalador como administrador</li>
  <li>Introduce la IP/hostname del Wazuh Manager</li>
  <li>Configura el grupo del agente (opcional)</li>
</ol>

<h4>Opción 2: PowerShell (automatizado)</h4>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.7.0-1.msi -OutFile wazuh-agent.msi

msiexec.exe /i wazuh-agent.msi /q WAZUH_MANAGER="IP_DEL_MANAGER" WAZUH_REGISTRATION_SERVER="IP_DEL_MANAGER"</code></pre>

<h3>Configuración del Firewall</h3>
<p>Asegúrate de que el firewall permita la comunicación:</p>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>netsh advfirewall firewall add rule name="Wazuh Agent" dir=out action=allow protocol=TCP remoteport=1514</code></pre>

<h3>Verificar conexión</h3>
<p>En el Wazuh Manager, verifica que el agente está conectado:</p>
<pre style="background: #0f1419; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>/var/ossec/bin/agent_control -l</code></pre>

<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: 8px; margin-top: 20px;">
  <strong>❌ Error común:</strong> Si el agente aparece como "Disconnected", verifica que el puerto 1514 está abierto en el firewall del servidor y que el agente puede resolver el hostname del manager.
</div>',
'[
  {"name": "Instalador Windows (MSI)", "url": "https://packages.wazuh.com/4.x/windows/wazuh-agent-4.7.0-1.msi", "type": "link"},
  {"name": "Script PowerShell instalación", "url": "/recursos/install-wazuh-agent.ps1", "type": "other"},
  {"name": "Guía troubleshooting Windows", "url": "/recursos/troubleshooting-wazuh-windows.pdf", "type": "pdf"}
]'::jsonb);

-- Reset sequence para que futuros INSERT funcionen correctamente
SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules));
SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons));

-- Verificar que se insertaron correctamente
SELECT 'Módulos insertados:' as info, COUNT(*) as total FROM modules;
SELECT 'Lecciones insertadas:' as info, COUNT(*) as total FROM lessons;
SELECT m.title as modulo, l.title as leccion, l.duration_minutes as duracion
FROM modules m
JOIN lessons l ON l.module_id = m.id
ORDER BY m.order_index, l.order_index;
