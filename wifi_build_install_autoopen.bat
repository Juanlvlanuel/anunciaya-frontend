@echo off
setlocal ENABLEDELAYEDEXPANSION
title AnunciaYA - Build, Install & Auto-Open over Wi-Fi

REM === Config ===
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "FRONT=E:\Anunciaya\anunciaya-frontend"
set "APP_ID=online.anunciaya.app"

echo ==========================================
echo  AnunciaYA - Instalacion por Wi-Fi
echo ==========================================
set /p DEVICE_HOST=Escribe la direccion IP:PUERTO del telefono (ej. 192.168.1.77:42481): 

echo [0/10] Verificando ADB en: %ADB%
if not exist "%ADB%" (
  echo ERROR: No se encontro ADB en "%ADB%". Ajusta la ruta en este .bat.
  pause
  exit /b 1
)

echo [1/10] Conectando a %DEVICE_HOST% ...
"%ADB%" connect %DEVICE_HOST%

echo [2/10] Verificando estado del dispositivo...
for /f "skip=1 tokens=1,2" %%A in ('"%ADB%" devices') do (
  if "%%A"=="%DEVICE_HOST%" if "%%B"=="device" set FOUND=1
)
if not defined FOUND (
  echo ERROR: El dispositivo %DEVICE_HOST% no aparece como "device".
  "%ADB%" devices
  pause
  exit /b 1
)

echo [3/10] Limpiando carpeta dist...
cd /d "%FRONT%"
if exist dist (
  rmdir /s /q dist
  echo Carpeta dist eliminada.
)

echo [4/10] Compilando frontend...
call npm run build || exit /b 1

echo [5/10] Sincronizando Capacitor...
call npx cap sync android || exit /b 1

echo [6/10] Compilando APK debug con Gradle...
cd android
call .\gradlew assembleDebug || exit /b 1

set "APK=app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo ERROR: No se encontro el APK en "%CD%\%APK%"
  pause
  exit /b 1
)
echo [7/10] APK listo: %CD%\%APK%

echo [8/10] Desinstalando app previa (si existe)...
"%ADB%" -s %DEVICE_HOST% uninstall %APP_ID% >nul 2>&1

echo [9/10] Instalando APK por Wi-Fi...
"%ADB%" -s %DEVICE_HOST% install -r "%APK%" || exit /b 1

echo [10/10] Abriendo la app en el dispositivo...
"%ADB%" -s %DEVICE_HOST% shell monkey -p %APP_ID% -c android.intent.category.LAUNCHER 1

echo.
echo ✅ Instalacion completada y la app se abrio en el telefono.
pause
exit /b 0
