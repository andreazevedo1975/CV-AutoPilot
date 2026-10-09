@echo off
chcp 65001 >nul
title Gerador de Arquivo EXE Nativo - CV-AutoPilot Enterprise
color 0E

echo ===============================================================================
echo                GERADOR DE EXECUTAVEL NATIVO (.EXE) WINDOWS
echo                        CV-AutoPilot Enterprise
echo ===============================================================================
echo.
echo  Este assistente ira compilar e gerar um executavel standalone (.exe)
echo  portavel para ser distribuido ou executado em qualquer PC Windows.
echo.

cd /d "%~dp0"
if not exist "package.json" (
    cd ..
)

echo [1/3] Compilando assets de producao com Vite...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar build de producao.
    pause
    exit /b 1
)

echo.
echo [2/3] Empacotando aplicacao para Windows x64...
call npx --yes electron-packager . "CV-AutoPilot" --platform=win32 --arch=x64 --out=dist-exe --overwrite --prune=true --entry=windows-installer/electron-main.cjs

if %errorlevel% neq 0 (
    echo.
    echo  Tentando empacotamento com webview nativa do Windows...
    call npx --yes nativefier --name "CV-AutoPilot" "http://localhost:3000" --platform windows --out dist-exe
)

echo.
echo [3/3] Processo concluido!
echo  O arquivo executavel (.exe) foi gerado na pasta:
echo  %cd%\dist-exe\
echo.
echo  Voce pode copiar a pasta gerada para qualquer pendrive ou outro computador!
echo ===============================================================================
pause
