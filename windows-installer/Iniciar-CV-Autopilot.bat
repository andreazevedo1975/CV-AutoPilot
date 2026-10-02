@echo off
chcp 65001 >nul
title CV-AutoPilot Enterprise - Servidor Local
color 0F

cd /d "%~dp0"
if not exist "package.json" (
    cd ..
)

echo ===============================================================================
echo                CV-AUTOPILOT ENTERPRISE - SERVIDOR LOCAL
echo ===============================================================================
echo.
echo  Iniciando a aplicacao na porta local 3000...
echo.
echo  Painel de Controle: http://localhost:3000
echo.
echo  Para ENCERRAR a aplicacao: Basta fechar esta janela ou pressionar CTRL+C.
echo ===============================================================================
echo.

:: Abrir navegador padrao
start "" "http://localhost:3000"

:: Iniciar servidor Vite
call npm run dev

pause
