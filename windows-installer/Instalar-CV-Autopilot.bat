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

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Identificar pasta raiz com package.json
if not exist "package.json" (
    if exist "..\package.json" (
        cd ..
    )
)

set "ROOT_DIR=%cd%"
echo  [Diretorio do Projeto]: %ROOT_DIR%
echo.

:: 1. Verificar se o Node.js esta instalado
echo [1/5] Verificando instalacao do Node.js LTS...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ===========================================================================
    echo  AVISO CRITICO: Node.js nao foi detectado neste computador.
    echo  O Node.js e necessario para executar a aplicacao localmente.
    echo  Baixe o instalador oficial gratuito do Node.js LTS em:
    echo  --^> https://nodejs.org/ (Recomendado versao 20 LTS ou superior)
    echo  ===========================================================================
    echo.
    set /p OPEN_NODE="Deseja abrir o site oficial https://nodejs.org agora? (S/N): "
    if /i "!OPEN_NODE!"=="S" (
        start "" "https://nodejs.org/"
    )
    echo.
    echo  Apos concluir a instalacao do Node.js, feche e abra este instalador novamente.
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
    echo  [OK] Node.js detectado com sucesso: !NODE_VER!
)

:: 2. Garantir integridade do package.json
echo.
echo [2/5] Verificando manifesto da aplicacao (package.json)...
if not exist "package.json" (
    echo  [AVISO] package.json nao encontrado na pasta atual. Criando manifesto padrao...
    (
        echo {
        echo   "name": "cv-autopilot",
        echo   "private": true,
        echo   "version": "1.0.0",
        echo   "type": "module",
        echo   "scripts": {
        echo     "dev": "vite --host 0.0.0.0 --port 3000",
        echo     "build": "vite build",
        echo     "preview": "vite preview"
        echo   },
        echo   "dependencies": {
        echo     "@google/genai": "^1.27.0",
        echo     "framer-motion": "^13.4.4",
        echo     "jspdf": "^4.2.1",
        echo     "jszip": "^3.10.2",
        echo     "lucide-react": "^1.47.0",
        echo     "pptxgenjs": "^4.0.1",
        echo     "react": "^19.2.0",
        echo     "react-dom": "^19.2.0",
        echo     "react-markdown": "^10.1.0",
        echo     "recharts": "^3.10.1",
        echo     "xlsx": "^0.18.5"
        echo   },
        echo   "devDependencies": {
        echo     "@types/node": "^22.14.0",
        echo     "@vitejs/plugin-react": "^5.0.0",
        echo     "typescript": "~5.8.2",
        echo     "vite": "^6.2.0"
        echo   }
        echo }
    ) > "package.json"
    echo  [OK] package.json criado com sucesso!
) else (
    echo  [OK] package.json validado com sucesso!
)

:: 3. Instalar dependencias locais com npm
echo.
echo [3/5] Instalando dependencias locais (React, Vite, Motores ATS, Lucide)...
echo  (Aguarde alguns instantes enquanto os pacotes sao resolvidos pelo npm...)
echo.
call npm install --legacy-peer-deps --no-audit

if %errorlevel% neq 0 (
    echo.
    echo  [AVISO] Tentando instalacao de contingencia (--force)...
    call npm install --force --no-audit
)

if not exist "node_modules" (
    echo.
    echo  [ERRO] Falha ao criar a pasta node_modules. Verifique sua conexao com a internet.
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas e prontas!

:: 4. Criar arquivo de configuracao .env se necessario
echo.
echo [4/5] Configurando ambiente local (.env)...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Arquivo .env copiado a partir de .env.example!
    ) else (
        (
            echo VITE_PORT=3000
            echo # GEMINI_API_KEY=
        ) > ".env"
        echo  [OK] Arquivo .env criado com sucesso!
    )
) else (
    echo  [OK] Arquivo .env ja configurado!
)

:: 5. Criar Atalho na Area de Trabalho (Desktop)
echo.
echo [5/5] Criando atalho na Area de Trabalho do Windows...
set "TARGET_LAUNCHER=%ROOT_DIR%\Iniciar-CV-Autopilot.bat"
if not exist "%TARGET_LAUNCHER%" (
    if exist "%SCRIPT_DIR%Iniciar-CV-Autopilot.bat" (
        set "TARGET_LAUNCHER=%SCRIPT_DIR%Iniciar-CV-Autopilot.bat"
    )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $scPath = Join-Path $desktop 'CV-AutoPilot.lnk'; $sc = $ws.CreateShortcut($scPath); $sc.TargetPath = '%TARGET_LAUNCHER%'; $sc.WorkingDirectory = '%ROOT_DIR%'; $sc.Description = 'CV-AutoPilot Enterprise'; $sc.Save()" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Atalho "CV-AutoPilot" criado na sua Area de Trabalho!
) else (
    echo  [INFO] Atalho direto disponivel na pasta do projeto: Iniciar-CV-Autopilot.bat
)

:: Liberar porta 3000 se houver processo anterior ocupando
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /f /pid %%p >nul 2>&1
)

echo.
echo ===============================================================================
echo                INSTALACAO LOCAL CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo.
echo  A aplicacao esta 100%% pronta para rodar no seu computador!
echo.
echo  Como Iniciar:
echo   1. Duplo clique no atalho "CV-AutoPilot" na sua Area de Trabalho.
echo   2. Ou execute o arquivo "Iniciar-CV-Autopilot.bat".
echo   3. O painel abrira automaticamente em: http://localhost:3000
echo.
echo ===============================================================================
echo.

set /p RESP="Deseja iniciar o CV-AutoPilot agora mesmo? (S/N): "
if /i "%RESP%"=="S" (
    echo.
    echo  Iniciando servidor local...
    if exist "%TARGET_LAUNCHER%" (
        start "" "%TARGET_LAUNCHER%"
    ) else (
        start "" "Iniciar-CV-Autopilot.bat"
    )
) else (
    echo.
    echo  Tudo pronto! Voce pode abrir a qualquer momento pelo atalho na Area de Trabalho.
    timeout /t 3 >nul
)

exit /b 0
