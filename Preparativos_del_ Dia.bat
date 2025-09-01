@echo off
title AnunciaYA - TODO EN UNO (Pair + Connect + Backend + APK) [FIX4]
setlocal EnableExtensions EnableDelayedExpansion

REM ====== CONFIG (ajusta si cambian tus rutas) ======
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "BACKEND_DIR=E:\Anunciaya\anunciaya-backend"
set "FRONTEND_DIR=E:\Anunciaya\anunciaya-frontend"
set "RUN_BACKEND_BAT=run_backend_apk.bat"
set "BUILD_INSTALL_BAT=wifi_build_install_autoopen.bat"
REM ===================================================

if not exist "%ADB%" (
  echo [ERROR] No se encontro ADB en: %ADB%
  goto END
)

echo(
echo === AnunciaYA - TODO EN UNO (FIX4) ===
echo  1) Opcion rapida si ya tienes Pair+Connect hoy
echo  2) Flujo completo (Pair + Connect + Backend + APK)
echo(

choice /C SN /M "¿Ya estas Pair + Connect en este mismo dia?"
if errorlevel 2 goto FLUJO_COMPLETO
if errorlevel 1 goto SOLO_SERVICIOS

:FLUJO_COMPLETO
echo(
echo Ingresa los datos del celular (Depuracion inalambrica > Vincular con codigo):
set "PAIR_HOST="
set /p PAIR_HOST=  IP:PUERTO_PAREJA (ej. 192.168.1.77:41234): 
set "PAIR_CODE="
set /p PAIR_CODE=  Codigo de 6 digitos: 

echo( & echo Reiniciando ADB...
"%ADB%" kill-server >nul 2>&1
"%ADB%" start-server >nul 2>&1

echo( & echo [PAIR] %PAIR_HOST% (codigo %PAIR_CODE%)
"%ADB%" pair %PAIR_HOST% %PAIR_CODE%
if errorlevel 1 goto PAIR_FAIL
echo [OK] Successfully paired.

:ASK_CONNECT
echo( & set "CONNECT_HOST="
set /p CONNECT_HOST=  IP:PUERTO_CONEXION (pantalla principal, ej. 192.168.1.77:42585): 
echo( & echo [CONNECT] %CONNECT_HOST%
"%ADB%" connect %CONNECT_HOST%
if errorlevel 1 (
  echo( & echo [ERROR] No se pudo conectar a %CONNECT_HOST%.
  echo Intenta de nuevo con el puerto correcto (el de "Direccion IP y puerto").
  goto ASK_CONNECT
)

echo( & echo Dispositivos:
"%ADB%" devices
goto SERVICIOS

:SOLO_SERVICIOS
echo(
echo Saltando Pair + Connect...
echo Usando la conexion ya activa de hoy.
goto SERVICIOS

:SERVICIOS
REM ====== BACKEND: ventana nueva persistente ======
if exist "%BACKEND_DIR%\%RUN_BACKEND_BAT%" (
  echo( & echo [BACKEND] Abriendo backend en ventana aparte...
  start "AnunciaYA Backend (APK)" cmd /k "cd /d ""%BACKEND_DIR%"" && call ""%RUN_BACKEND_BAT%"""
) else (
  echo( & echo [ADVERTENCIA] No se encontro "%RUN_BACKEND_BAT%" en "%BACKEND_DIR%"
)

REM ====== APK: ventana nueva persistente ======
if exist "%FRONTEND_DIR%\%BUILD_INSTALL_BAT%" (
  echo( & echo [APK] Abriendo build+install en ventana aparte...
  start "AnunciaYA APK Build+Install" cmd /k "cd /d ""%FRONTEND_DIR%"" && call ""%BUILD_INSTALL_BAT%"""
) else (
  echo( & echo [ADVERTENCIA] No se encontro "%BUILD_INSTALL_BAT%" en "%FRONTEND_DIR%"
)

echo(
echo Abre chrome://inspect/#devices y pulsa "inspect" en WebView in online.anunciaya.app
goto END

:PAIR_FAIL
echo(
echo [ERROR] Pair fallo (el codigo expira rapido). Genera uno nuevo y reintenta.
goto END

:END
echo(
echo (Esta ventana NO se cierra sola). Presiona una tecla para salir o dejala abierta.
pause > nul
exit /b 0
