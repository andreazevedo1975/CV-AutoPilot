# CV-AutoPilot Enterprise - Instalador Local Seguro
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Instalador CV-AutoPilot Enterprise"

Clear-Host
Write-Host "===============================================================================" -ForegroundColor DarkRed
Write-Host "                CV-AUTOPILOT ENTERPRISE - INSTALADOR LOCAL" -ForegroundColor White
Write-Host "          Plataforma de Inteligencia em Carreira e Recrutamento 360" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor DarkRed
Write-Host ""

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptPath) { $ScriptPath = Get-Location }
Set-Location $ScriptPath

if (-not (Test-Path "package.json") -and (Test-Path "..\package.json")) {
    Set-Location ".."
    $ScriptPath = Get-Location
}

# 1. Verificar Node.js
Write-Host "[1/3] Verificando instalacao do Node.js..." -ForegroundColor Cyan
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue

if (-not $NodeCmd) {
    Write-Host "  AVISO: Node.js nao foi detectado neste computador." -ForegroundColor Yellow
    Write-Host "  Por favor, baixe o instalador oficial LTS em https://nodejs.org/" -ForegroundColor Yellow
    $OpenWeb = Read-Host "  Deseja abrir o site oficial agora? (S/N)"
    if ($OpenWeb -eq 'S' -or $OpenWeb -eq 's') {
        Start-Process "https://nodejs.org/"
    }
    Pause
    Exit
} else {
    $NodeVersion = & node -v
    Write-Host "  [OK] Node.js detectado: $NodeVersion" -ForegroundColor Green
}

# 2. Instalar dependencias
Write-Host ""
Write-Host "[2/3] Instalando dependencias locais da aplicacao..." -ForegroundColor Cyan
& npm install --legacy-peer-deps --no-audit
Write-Host "  [OK] Dependencias instaladas com sucesso!" -ForegroundColor Green

# 3. Finalizar
Write-Host ""
Write-Host "[3/3] Configuracao concluida!" -ForegroundColor Cyan
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar, execute o arquivo: Iniciar-CV-Autopilot.bat" -ForegroundColor Cyan
Write-Host ""

$Prompt = Read-Host "Deseja iniciar o aplicativo agora? (S/N)"
if ($Prompt -eq 'S' -or $Prompt -eq 's') {
    $Launcher = Join-Path $ScriptPath "Iniciar-CV-Autopilot.bat"
    if (Test-Path $Launcher) {
        Start-Process $Launcher
    } else {
        & npm run dev
    }
}
