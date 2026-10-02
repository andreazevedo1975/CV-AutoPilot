@echo off
chcp 65001 >nul
title Encerrar CV-AutoPilot Enterprise
color 0C

echo ===============================================================================
echo                ENCERRAR CV-AUTOPILOT ENTERPRISE LOCAL
echo ===============================================================================
echo.
echo  Localizando e finalizando processos locais na porta 3000...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Finalizando processo PID: %%a...
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo  [OK] Todos os servicos locais do CV-AutoPilot foram finalizados!
timeout /t 3 >nul
