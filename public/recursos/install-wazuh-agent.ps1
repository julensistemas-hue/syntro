# ============================================
# SCRIPT DE INSTALACIÓN - AGENTE WAZUH WINDOWS
# Curso Intensivo de Wazuh - AI Security
# ============================================

# INSTRUCCIONES:
# 1. Modifica las variables de configuración abajo
# 2. Ejecuta PowerShell como Administrador
# 3. Ejecuta: .\install-wazuh-agent.ps1

# ============================================
# CONFIGURACIÓN - MODIFICA ESTOS VALORES
# ============================================

$WAZUH_MANAGER = "IP_DE_TU_MANAGER"          # Ej: "192.168.1.100" o "wazuh.tudominio.com"
$AGENT_NAME = $env:COMPUTERNAME               # Nombre del agente (por defecto: nombre del equipo)
$AGENT_GROUP = "default"                      # Grupo del agente (opcional)
$WAZUH_VERSION = "4.7.0-1"                   # Versión de Wazuh a instalar

# ============================================
# NO MODIFICAR DEBAJO DE ESTA LÍNEA
# ============================================

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Instalador de Wazuh Agent - AI Security   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar configuración
if ($WAZUH_MANAGER -eq "IP_DE_TU_MANAGER") {
    Write-Host "ERROR: Debes configurar la variable WAZUH_MANAGER con la IP de tu servidor" -ForegroundColor Red
    Write-Host "Edita este script y modifica la linea 15" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuracion:" -ForegroundColor Green
Write-Host "  - Wazuh Manager: $WAZUH_MANAGER"
Write-Host "  - Nombre del agente: $AGENT_NAME"
Write-Host "  - Grupo: $AGENT_GROUP"
Write-Host "  - Version: $WAZUH_VERSION"
Write-Host ""

# Crear directorio temporal
$tempDir = "$env:TEMP\wazuh-install"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Descargar el instalador
$installerUrl = "https://packages.wazuh.com/4.x/windows/wazuh-agent-$WAZUH_VERSION.msi"
$installerPath = "$tempDir\wazuh-agent.msi"

Write-Host "Descargando Wazuh Agent $WAZUH_VERSION..." -ForegroundColor Yellow
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Descarga completada!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo descargar el instalador" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Instalar el agente
Write-Host ""
Write-Host "Instalando Wazuh Agent..." -ForegroundColor Yellow

$msiArgs = @(
    "/i", $installerPath,
    "/q",
    "WAZUH_MANAGER=$WAZUH_MANAGER",
    "WAZUH_AGENT_NAME=$AGENT_NAME",
    "WAZUH_AGENT_GROUP=$AGENT_GROUP",
    "WAZUH_REGISTRATION_SERVER=$WAZUH_MANAGER"
)

$process = Start-Process msiexec.exe -ArgumentList $msiArgs -Wait -PassThru
if ($process.ExitCode -eq 0) {
    Write-Host "Instalacion completada!" -ForegroundColor Green
} else {
    Write-Host "ERROR: La instalacion fallo con codigo $($process.ExitCode)" -ForegroundColor Red
    exit 1
}

# Iniciar el servicio
Write-Host ""
Write-Host "Iniciando servicio Wazuh Agent..." -ForegroundColor Yellow
try {
    Start-Service WazuhSvc
    Write-Host "Servicio iniciado!" -ForegroundColor Green
} catch {
    Write-Host "ADVERTENCIA: No se pudo iniciar el servicio automaticamente" -ForegroundColor Yellow
}

# Configurar firewall
Write-Host ""
Write-Host "Configurando regla de firewall..." -ForegroundColor Yellow
try {
    $ruleName = "Wazuh Agent (TCP-Out 1514)"
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName `
            -Direction Outbound `
            -Action Allow `
            -Protocol TCP `
            -RemotePort 1514 `
            -Program "C:\Program Files (x86)\ossec-agent\wazuh-agent.exe" | Out-Null
        Write-Host "Regla de firewall creada!" -ForegroundColor Green
    } else {
        Write-Host "La regla de firewall ya existe" -ForegroundColor Gray
    }
} catch {
    Write-Host "ADVERTENCIA: No se pudo configurar el firewall automaticamente" -ForegroundColor Yellow
}

# Verificar estado
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INSTALACION COMPLETADA                    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$service = Get-Service WazuhSvc -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Estado del servicio: $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Yellow" })
}

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verifica en tu Wazuh Manager que el agente aparece conectado"
Write-Host "  2. Ejecuta: /var/ossec/bin/agent_control -l"
Write-Host "  3. Si no aparece, revisa los logs en: C:\Program Files (x86)\ossec-agent\ossec.log"
Write-Host ""

# Limpiar
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Logs del agente: C:\Program Files (x86)\ossec-agent\ossec.log" -ForegroundColor Gray
Write-Host "Configuracion: C:\Program Files (x86)\ossec-agent\ossec.conf" -ForegroundColor Gray
Write-Host ""
