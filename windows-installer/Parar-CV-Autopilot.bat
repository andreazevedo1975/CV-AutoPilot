@echo off
chcp 65001 >nul
title Encerrar CV-AutoPilot Enterprise (Porta 3000)
color 0C

echo ===============================================================================
echo                ENCERRAR CV-AUTOPILOT ENTERPRISE LOCAL
echo ===============================================================================
echo.
echo  Localizando e finalizando processos locais na porta 3000...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo  [OK] Todos os servicos locais do CV-AutoPilot foram finalizados com sucesso!

echo.
echo  Porta 3000 liberada com sucesso.
timeout /t 3 >nul
exit /b 0
