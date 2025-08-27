@echo off
REM === Frontend DEV expuesto en LAN ===
cd /d "%~dp0"
npm run dev -- --host
