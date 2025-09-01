@echo off
title AnunciaYA - TODO EN UNO (Pair + Connect + Backend + APK) [FIX6]
setlocal EnableExtensions EnableDelayedExpansion

REM ====== CONFIG ======
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "BACKEND_DIR=E:\Anunciaya\anunciaya-backend"
set "FRONTEND_DIR=E:\Anunciaya\anunciaya-frontend"
set "RUN_BACKEND_BAT=run_backend_apk.bat"
set "BUILD_INSTALL_BAT=wifi_build_install_autoopen.bat"
REM =====================

if not exist "%ADB%" (
  echo [ERROR] No se encontro ADB en: %ADB%
  goto HOLD
)

:MENU
cls
echo ======================================================
echo   AnunciaYA - TODO EN UNO  [FIX6]
echo ======================================================
echo   1) Pair + Connect  (primer uso del dia)
echo   2) Solo Connect    (ya hiciste pair hoy)
echo   3) Abrir servicios (backend + build/install)
echo   4) Salir
echo ======================================================
choice /C 1234 /M "Elige una opcion"
if errorlevel 4 goto HOLD
if errorlevel 3 goto SERVICIOS
if errorlevel 2 goto SOLO_CONNECT
if errorlevel 1 goto FULL_FLOW

:FULL_FLOW
REM ---------- PAIR ----------
echo.
echo [PAIR] Ingresa datos de "Vincular con codigo" en el celular:
set "PAIR_HOST="
set /p PAIR_HOST=  IP:PUERTO_PAREJA (ej. 192.168.1.77:41234): 
set "PAIR_CODE="
set /p PAIR_CODE=  Codigo de 6 digitos: 

echo.
echo [ADB] Reiniciando...
"%ADB%" kill-server >nul 2>&1
"%ADB%" start-server >nul 2>&1

echo.
echo [PAIR] %PAIR_HOST%  (codigo %PAIR_CODE%)
"%ADB%" pair %PAIR_HOST% %PAIR_CODE%
if errorlevel 1 (
  echo.
  echo [ERROR] Pair fallo (el codigo expira en ~60s). Genera uno nuevo y reintenta.
  pause
  goto MENU
)
echo [OK] Successfully paired.
echo.
goto SOLO_CONNECT

:SOLO_CONNECT
REM ---------- CONNECT (con reintentos) ----------
:ASK_CONNECT
set "CONNECT_HOST="
echo [CONNECT] Ingresa "Direccion IP y puerto" (pantalla principal, NO el de pair).
set /p CONNECT_HOST=  IP:PUERTO_CONEXION (ej. 192.168.1.77:42585): 
if "%CONNECT_HOST%"=="" goto ASK_CONNECT

echo.
echo [CONNECT] Intentando %CONNECT_HOST% ...
"%ADB%" connect %CONNECT_HOST%
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo conectar a %CONNECT_HOST% (puerto incorrecto o fuera de red).
  echo Intenta de nuevo...
  echo.
  goto ASK_CONNECT
)

echo.
echo Dispositivos (buscando %CONNECT_HOST% como "device"):
set "CONNECTED_OK="
for /f "tokens=1,2" %%A in ('"%ADB%" devices ^| findstr /R /C:"^[0-9][0-9.]*:"') do (
  if /I "%%A"=="%CONNECT_HOST%" if /I "%%B"=="device" set "CONNECTED_OK=1"
  echo   %%A    %%B
)
if not defined CONNECTED_OK (
  echo.
  echo [ADVERTENCIA] %CONNECT_HOST% no aparece como "device". Puedes continuar, pero si falla, reconecta.
)
echo.
pause
goto SERVICIOS

:SERVICIOS
echo.
echo ================== ABRIENDO SERVICIOS ==================

REM ---------- BACKEND en ventana nueva persistente ----------
if exist "%BACKEND_DIR%\%RUN_BACKEND_BAT%" (
  echo [BACKEND] Ventana: "AnunciaYA Backend (APK)"
  start "AnunciaYA Backend (APK)" cmd /k "cd /d ""%BACKEND_DIR%"" && echo [CWD] %BACKEND_DIR% && call ""%RUN_BACKEND_BAT%"""
) else (
  echo [WARN] No se encontro "%RUN_BACKEND_BAT%" en "%BACKEND_DIR%"
)

REM ---------- APK Build+Install en ventana nueva persistente ----------
if exist "%FRONTEND_DIR%\%BUILD_INSTALL_BAT%" (
  echo [APK] Ventana: "AnunciaYA APK Build+Install"
  start "AnunciaYA APK Build+Install" cmd /k "cd /d ""%FRONTEND_DIR%"" && echo [CWD] %FRONTEND_DIR% && call ""%BUILD_INSTALL_BAT%"""
) else (
  echo [WARN] No se encontro "%BUILD_INSTALL_BAT%" en "%FRONTEND_DIR%"
)

echo.
echo [TIP] Depura en: chrome://inspect/#devices  → "WebView in online.anunciaya.app" → inspect
echo.
pause
goto MENU

:HOLD
echo.
echo (Cerrar esta ventana o presionar una tecla)
pause > nul
exit /b 0
