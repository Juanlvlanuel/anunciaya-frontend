@echo off
setlocal ENABLEDELAYEDEXPANSION
title AnunciaYA - Build and Install over Wi-Fi (no USB)

REM === Config ===
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "FRONT=E:\Anunciaya\anunciaya-frontend"
set "APP_ID=online.anunciaya.app"
set "DEVICE_HOST=192.168.1.77:42481"

echo [0/8] Verificando ADB en: %ADB%
if not exist "%ADB%" (
  echo ERROR: No se encontro ADB en "%ADB%". Ajusta la ruta en este .bat.
  pause
  exit /b 1
)

echo [1/8] Conectando a %DEVICE_HOST% ...
"%ADB%" connect %DEVICE_HOST%
if errorlevel 1 (
  echo ERROR: No se pudo conectar por Wi-Fi. Asegura que:
  echo  - El telefono esta en la misma red.
  echo  - "Depuracion inalambrica" esta activada y emparejada.
  echo  - El puerto coincide con el mostrado en el telefono.
  pause
  exit /b 1
)

echo [2/8] Verificando estado del dispositivo...
for /f "skip=1 tokens=1,2" %%A in ('"%ADB%" devices') do (
  if "%%A"=="%DEVICE_HOST%" if "%%B"=="device" set FOUND=1
)
if not defined FOUND (
  echo ERROR: El dispositivo %DEVICE_HOST% no aparece como "device".
  "%ADB%" devices
  pause
  exit /b 1
)

echo [3/8] Compilando frontend...
cd /d "%FRONT%"
call npm run build
if errorlevel 1 (
  echo ERROR en npm run build
  pause
  exit /b 1
)

echo [4/8] Sincronizando Capacitor...
call npx cap sync android
if errorlevel 1 (
  echo ERROR en npx cap sync android
  pause
  exit /b 1
)

echo [5/8] Compilando APK debug con Gradle...
cd android
call .\gradlew assembleDebug
if errorlevel 1 (
  echo ERROR en gradlew assembleDebug
  pause
  exit /b 1
)

set "APK=app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo ERROR: No se encontro el APK en "%CD%\%APK%"
  pause
  exit /b 1
)
echo [6/8] APK listo: %CD%\%APK%

echo [7/8] Desinstalando app previa (si existe)...
"%ADB%" -s %DEVICE_HOST% uninstall %APP_ID% >nul 2>&1

echo [8/8] Instalando APK por Wi-Fi...
"%ADB%" -s %DEVICE_HOST% install -r "%APK%"
if errorlevel 1 (
  echo ERROR al instalar. Prueba:
  echo   "%ADB%" -s %DEVICE_HOST% uninstall %APP_ID%
  echo y vuelve a ejecutar este .bat
  pause
  exit /b 1
)

echo.
echo ✅ Instalacion completada por Wi-Fi. Abre la app en el telefono.
pause
exit /b 0
