@echo off
title AnunciaYA - TODO EN UNO (Pair + Connect + Backend + APK) [OPTIMIZADO+LOGCAT]
setlocal EnableExtensions EnableDelayedExpansion

REM ====== CONFIG (ajusta si cambian tus rutas) ======
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "BACKEND_DIR=E:\Anunciaya\anunciaya-backend"
set "FRONTEND_DIR=E:\Anunciaya\anunciaya-frontend"
set "RUN_BACKEND_BAT=run_backend_apk.bat"
set "BUILD_INSTALL_BAT=wifi_build_install_autoopen.bat"
set "APP_ID=online.anunciaya.app"
REM ===================================================

if not exist "%ADB%" (
  echo [ERROR] No se encontro ADB en: %ADB%
  pause
  exit /b 1
)

echo(
echo === AnunciaYA - TODO EN UNO (Optimizado + Logcat) ===
echo  [1] Solo servicios (Backend + APK) con conexion ya activa
echo  [2] Flujo completo con Pair + Connect (Wi-Fi)
echo  [3] Conexion USB directa (rapido)
echo(

choice /C 123 /M "Selecciona una opcion:"
if errorlevel 3 goto USB_MODE
if errorlevel 2 goto FLUJO_COMPLETO
if errorlevel 1 goto SOLO_SERVICIOS

:FLUJO_COMPLETO
echo(
echo Ingresa los datos de emparejamiento Wi-Fi (Depuracion inalambrica > Vincular con codigo):
set /p PAIR_HOST=  IP:PUERTO_PAREJA (ej. 192.168.1.77:41234): 
set /p PAIR_CODE=  Codigo de 6 digitos: 

echo( & echo Reiniciando ADB...
"%ADB%" kill-server >nul 2>&1
"%ADB%" start-server >nul 2>&1

echo( & echo [PAIR] %PAIR_HOST% (codigo %PAIR_CODE%)
"%ADB%" pair %PAIR_HOST% %PAIR_CODE%
if errorlevel 1 goto PAIR_FAIL
echo [OK] Pair exitoso.

:ASK_CONNECT
set /p CONNECT_HOST=  IP:PUERTO_CONEXION (ej. 192.168.1.77:42585): 
echo( & echo [CONNECT] %CONNECT_HOST%
"%ADB%" connect %CONNECT_HOST%
if errorlevel 1 (
  echo [ERROR] No se pudo conectar a %CONNECT_HOST%. Intenta de nuevo.
  goto ASK_CONNECT
)
goto SERVICIOS

:USB_MODE
echo(
echo [USB] Usando conexion por cable (mas estable).
"%ADB%" devices
goto SERVICIOS

:SOLO_SERVICIOS
echo(
echo Saltando Pair + Connect... usando conexion ya activa.
goto SERVICIOS

:SERVICIOS
REM ====== BACKEND: ventana nueva persistente ======
if exist "%BACKEND_DIR%\%RUN_BACKEND_BAT%" (
  echo( & echo [BACKEND] Iniciando backend en ventana aparte...
  start "AnunciaYA Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && call ""%RUN_BACKEND_BAT%"""
) else (
  echo [ADVERTENCIA] No se encontro "%RUN_BACKEND_BAT%" en "%BACKEND_DIR%"
)

REM ====== APK: ventana nueva persistente ======
if exist "%FRONTEND_DIR%\%BUILD_INSTALL_BAT%" (
  echo( & echo [APK] Compilando e instalando...
  start "AnunciaYA APK Build+Install" cmd /k "cd /d ""%FRONTEND_DIR%"" && call ""%BUILD_INSTALL_BAT%"""
) else (
  echo [ADVERTENCIA] No se encontro "%BUILD_INSTALL_BAT%" en "%FRONTEND_DIR%"
)

REM ====== LOGCAT: ventana nueva ======
echo( & echo [LOGCAT] Abriendo logs filtrados para %APP_ID% ...
start "Logcat - %APP_ID%" cmd /k ""%ADB%" -s %DEVICE_HOST% logcat | findstr %APP_ID%"


echo.
echo ✅ Preparativos listos. Si usas Chrome: abre chrome://inspect/#devices para inspeccionar la WebView.
goto END

:PAIR_FAIL
echo [ERROR] Pair fallo (el codigo expira rapido). Genera uno nuevo e intentalo otra vez.
goto END

:END
echo.
pause
exit /b 0
