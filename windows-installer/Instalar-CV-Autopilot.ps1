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

$RootDir = Get-Location
Write-Host "Pasta do Projeto: $RootDir" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1/4] Verificando instalacao do Node.js..." -ForegroundColor Cyan
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue

if (-not $NodeCmd) {
    Write-Host "  AVISO: Node.js nao foi detectado neste computador." -ForegroundColor Yellow
    Write-Host "  Por favor, baixe o instalador oficial LTS em https://nodejs.org/" -ForegroundColor Yellow
    $OpenWeb = Read-Host "  Deseja abrir o site oficial agora? (S/N)"
    if ($OpenWeb -eq 'S' -or $OpenWeb -eq 's') {
        Start-Process "https://nodejs.org/"
    }
    Pause
    Exit 1
} else {
    $NodeVersion = & node -v
    Write-Host "  [OK] Node.js detectado: $NodeVersion" -ForegroundColor Green
}

# 2. Instalar dependencias
Write-Host ""
Write-Host "[2/4] Instalando dependencias locais da aplicacao..." -ForegroundColor Cyan
& npm install --legacy-peer-deps --no-audit

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Tentando com --force..." -ForegroundColor Yellow
    & npm install --force --no-audit
}
Write-Host "  [OK] Dependencias instaladas com sucesso!" -ForegroundColor Green

# 3. Criar arquivo de configuracao .env se necessario
Write-Host ""
Write-Host "[3/4] Configurando ambiente local (.env)..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        Set-Content -Path ".env" -Value "VITE_PORT=3000`n# GEMINI_API_KEY="
    }
    Write-Host "  [OK] Arquivo .env criado!" -ForegroundColor Green
} else {
    Write-Host "  [OK] Arquivo .env ja configurado!" -ForegroundColor Green
}

# 4. Criar Atalho na Area de Trabalho
Write-Host ""
Write-Host "[4/4] Criando atalho na Area de Trabalho..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [System.Environment]::GetFolderPath('Desktop')
    $Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopPath "CV-AutoPilot.lnk"))
    
    $LauncherPath = Join-Path $RootDir "Iniciar-CV-Autopilot.bat"
    if (-not (Test-Path $LauncherPath)) {
        $LauncherPath = Join-Path $RootDir "windows-installer\Iniciar-CV-Autopilot.bat"
    }
    $Shortcut.TargetPath = $LauncherPath
    $Shortcut.WorkingDirectory = $RootDir
    $Shortcut.Description = "CV-AutoPilot Enterprise - Plataforma de Carreira e ATS"
    $Shortcut.Save()
    Write-Host "  [OK] Atalho criado na Area de Trabalho com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "  [INFO] Atalho direto disponivel em Iniciar-CV-Autopilot.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar, execute o arquivo: Iniciar-CV-Autopilot.bat ou o atalho no Desktop." -ForegroundColor Cyan
Write-Host "O painel abrira em: http://localhost:3000/" -ForegroundColor Cyan
Write-Host ""

$Prompt = Read-Host "Deseja iniciar o aplicativo agora? (S/N)"
if ($Prompt -eq 'S' -or $Prompt -eq 's') {
    if (Test-Path $LauncherPath) {
        Start-Process $LauncherPath
    } else {
        Start-Process "Iniciar-CV-Autopilot.bat"
    }
}
