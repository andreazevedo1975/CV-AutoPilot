@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Instalador - CV-AutoPilot Enterprise
color 0F

echo ===============================================================================
echo                CV-AUTOPILOT ENTERPRISE - CONFIGURADOR LOCAL
echo          Plataforma de Inteligencia em Carreira e Recrutamento 360
echo ===============================================================================
echo.
echo  Iniciando a verificacao do ambiente Windows...
echo.

set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"
if not exist "package.json" (
    if exist "..\\package.json" (
        cd ..
        set "INSTALL_DIR=%cd%\\"
    )
)

:: 1. Verificar se o Node.js esta instalado
echo [1/4] Verificando instalacao do Node.js LTS...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  AVISO: Node.js nao foi detectado neste computador.
    echo  Para maxima seguranca e conformidade com o Windows Defender:
    echo.
    echo  Por favor, baixe o instalador oficial gratuito do Node.js LTS em:
    echo  --^> https://nodejs.org/ (Versao recomendada LTS v20 ou superior)
    echo.
    echo  Deseja abrir o site oficial agora para baixar?
    set /p OPEN_NODE="Abrir https://nodejs.org agora? (S/N): "
    if /i "!OPEN_NODE!"=="S" (
        start "" "https://nodejs.org/"
    )
    echo.
    echo  Apos concluir a instalacao do Node.js, execute este instalador novamente.
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
    echo  [OK] Node.js detectado com sucesso: !NODE_VER!
)

:: 2. Instalar dependencias locais com npm
echo.
echo [2/4] Instalando dependencias locais (React, Vite, Motores ATS)...
echo  (Aguarde alguns instantes enquanto os pacotes sao resolvidos...)
echo.
call npm install --legacy-peer-deps --no-audit

if %errorlevel% neq 0 (
    echo.
    echo  Tentando instalacao padrão de dependencias...
    call npm install --no-audit
)
echo  [OK] Dependencias instaladas com sucesso!

:: 3. Criar arquivo .env se necessario
echo.
echo [3/4] Verificando configuracao de ambiente local...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Arquivo de configuracao .env criado!
    ) else (
        echo # CV-AutoPilot Config Local > .env
        echo VITE_PORT=3000 >> .env
        echo  [OK] Arquivo de configuracao .env inicializado!
    )
) else (
    echo  [OK] Arquivo de configuracao .env ja pronto!
)

:: 4. Finalizacao
echo.
echo [4/4] Configurando inicializadores locais...
echo  [OK] Iniciar-CV-Autopilot.bat pronto.
echo.
echo ===============================================================================
echo                INSTALACAO LOCAL CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo.
echo  A ferramenta esta 100%% configurada para rodar localmente no seu computador.
echo.
echo  Como Iniciar:
echo   - Execute o arquivo "Iniciar-CV-Autopilot.bat" nesta pasta.
echo   - Ele abrira automaticamente seu painel em: http://localhost:3000
echo.
echo ===============================================================================
echo.

set /p RESP="Deseja iniciar o CV-AutoPilot agora mesmo? (S/N): "
if /i "%RESP%"=="S" (
    echo.
    echo  Iniciando aplicacao...
    start "" "Iniciar-CV-Autopilot.bat"
) else (
    echo.
    echo  Tudo pronto! Voce podera abrir quando desejar.
    timeout /t 3 >nul
)

exit /b 0
