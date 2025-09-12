@echo off
setlocal ENABLEDELAYEDEXPANSION
title AnunciaYA - Build, Install & Auto-Open (USB o Wi-Fi con Logcat)

REM === Config ===
set "ADB=C:\Users\Optiplex 9020\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "FRONT=E:\Anunciaya\anunciaya-frontend"
set "APP_ID=online.anunciaya.app"

echo ==========================================
echo  AnunciaYA - Instalacion automatica
echo ==========================================
echo  [1] USB (rapido)
echo  [2] Wi-Fi (pedira IP:PUERTO)
echo  [3] Solo compilar (sin instalar)
echo ==========================================

choice /C 123 /M "Selecciona el modo:"
if errorlevel 3 goto SOLO_BUILD
if errorlevel 2 goto WIFI_MODE
if errorlevel 1 goto USB_MODE

:USB_MODE
echo [USB] Detectando dispositivos conectados...
for /f "skip=1 tokens=1" %%A in ('"%ADB%" devices') do (
  if "%%A" NEQ "" (
    set DEVICE_HOST=%%A
    goto CONTINUAR
  )
)


:WIFI_MODE
set /p DEVICE_HOST=Escribe la direccion IP:PUERTO del telefono (ej. 192.168.1.77:42481): 
echo [Wi-Fi] Conectando a %DEVICE_HOST% ...
"%ADB%" connect %DEVICE_HOST%
goto CONTINUAR

:SOLO_BUILD
set DEVICE_HOST=
goto BUILD

:CONTINUAR
echo [Verificando estado del dispositivo...]
"%ADB%" devices
echo.

:BUILD
echo [1/8] Limpiando carpeta dist...
cd /d "%FRONT%"
if exist dist rmdir /s /q dist

echo [2/8] Compilando frontend...
call npm run build || exit /b 1

echo [3/8] Sincronizando Capacitor...
call npx cap sync android || exit /b 1

echo [4/8] Compilando APK debug con Gradle...
cd android
call .\gradlew assembleDebug || exit /b 1

set "APK=app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo ERROR: No se encontro el APK en "%CD%\%APK%"
  pause
  exit /b 1
)
echo [5/8] APK listo: %CD%\%APK%

if "%DEVICE_HOST%"=="" (
  echo [MODO SOLO BUILD] Saltando instalacion en dispositivo.
  goto END
)

echo [6/8] Desinstalando app previa...
"%ADB%" -s %DEVICE_HOST% uninstall %APP_ID% >nul 2>&1

echo [7/8] Instalando APK...
"%ADB%" -s %DEVICE_HOST% install -r "%APK%" || exit /b 1

echo.
echo ✅ Instalacion completada.
echo [8/8] Abriendo app en el dispositivo...
"%ADB%" -s %DEVICE_HOST% shell monkey -p %APP_ID% -c android.intent.category.LAUNCHER 1

REM === Nuevo: abrir ventana con logcat filtrado ===
echo.
echo [LOGCAT] Abriendo logs filtrados de la app...
start "Logcat - %APP_ID%" cmd /k ""%ADB%" -s %DEVICE_HOST% logcat | findstr %APP_ID%"



:END
echo.
pause
exit /b 0
