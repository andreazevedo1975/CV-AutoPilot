@echo off
chcp 65001 >nul
title CV-AutoPilot Enterprise - Servidor Local (http://localhost:3000)
color 0F

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Identificar pasta raiz com package.json
if not exist "package.json" (
    if exist "..\package.json" (
        cd ..
    )
)

set "ROOT_DIR=%cd%"

echo ===============================================================================
echo                CV-AUTOPILOT ENTERPRISE - SERVIDOR LOCAL
echo ===============================================================================
echo.
echo  Pasta da Aplicacao: %ROOT_DIR%
echo  Porta Local: http://localhost:3000
echo.

:: 1. Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi detectado!
    echo Por favor, instale o Node.js LTS em https://nodejs.org/ e tente novamente.
    echo.
    pause
    exit /b 1
)

:: 2. Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo [AVISO] As dependencias (node_modules) ainda nao foram instaladas.
    echo Instalando automaticamente agora... Aguarde alguns instantes.
    echo.
    call npm install --legacy-peer-deps --no-audit
    echo.
)

:: 3. Liberar a porta 3000 caso esteja ocupada por processo anterior
echo Verificando disponibilidade da porta 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /f /pid %%p >nul 2>&1
)

echo.
echo ===============================================================================
echo  INICIANDO SERVIDOR LOCAL VITE...
echo  O painel abrira automaticamente no seu navegador padrao:
echo  --^> http://localhost:3000
echo.
echo  Para ENCERRAR: Feche esta janela do terminal ou pressione CTRL+C.
echo ===============================================================================
echo.

:: Agendar abertura do navegador quando o servidor estiver pronto (aguarda 2.5s)
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Milliseconds 2500; Start-Process 'http://localhost:3000/'"

:: Iniciar Vite dev server
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [AVISO] O servidor foi interrompido ou falhou na execucao padrao.
    echo Tentando iniciar diretamente via Vite CLI...
    call npx vite --host 0.0.0.0 --port 3000
)

pause
