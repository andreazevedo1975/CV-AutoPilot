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
cd ..

echo [1/3] Compilando assets de producao com Vite...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar build de producao.
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando Electron Packager temporario...
call npx --yes electron-packager . "CV-AutoPilot" --platform=win32 --arch=x64 --out=dist-exe --overwrite --icon=src/assets/images/cv_autopilot_logo_1789832318438.jpg --prune=true

if %errorlevel% neq 0 (
    echo.
    echo  Tentando empacotamento alternativo via Nativefier...
    call npx --yes nativefier --name "CV-AutoPilot" "http://localhost:3000" --icon "src/assets/images/cv_autopilot_logo_1789832318438.jpg" --platform windows --out dist-exe
)

echo.
echo [3/3] Processo concluido!
echo  O arquivo executavel (.exe) foi gerado na pasta:
echo  %~dp0..\dist-exe\
echo.
echo  Voce pode copiar a pasta gerada para qualquer pendrive ou outro computador!
echo ===============================================================================
pause
