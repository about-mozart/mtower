@echo off
setlocal
cd /d "%~dp0"

rem Usa uma porta diferente a cada execucao para nao abrir uma versao antiga.
set /a PORT=8100 + (%RANDOM% %% 800)

echo.
echo Iniciando o site MTower em http://localhost:%PORT%
echo Nao feche a janela do servidor enquanto estiver usando o site.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "Servidor local MTower - Porta %PORT%" cmd /k "cd /d ""%~dp0"" && py -m http.server %PORT% --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://localhost:%PORT%/index.html?v=%RANDOM%"
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "Servidor local MTower - Porta %PORT%" cmd /k "cd /d ""%~dp0"" && python -m http.server %PORT% --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://localhost:%PORT%/index.html?v=%RANDOM%"
  exit /b
)

echo Python nao foi encontrado neste computador.
echo Abra o index.html diretamente ou instale o Python para visualizar o 3D.
echo.
pause
