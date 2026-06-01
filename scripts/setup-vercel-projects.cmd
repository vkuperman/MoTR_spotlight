@echo off
REM Usage from MoTR_spotlight folder (two lines in cmd.exe):
REM   set VERCEL_TOKEN=your_token_here
REM   scripts\setup-vercel-projects.cmd
REM
REM Or one line with token argument:
REM   scripts\setup-vercel-projects.cmd your_token_here

setlocal
cd /d "%~dp0.."

if not "%~1"=="" set "VERCEL_TOKEN=%~1"

if defined VERCEL_TOKEN (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-vercel-projects.ps1" -Token "%VERCEL_TOKEN%"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-vercel-projects.ps1" %*
)

exit /b %ERRORLEVEL%
