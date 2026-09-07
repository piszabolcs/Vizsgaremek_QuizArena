@echo off
chcp 65001 >nul
setlocal
set "ROOT=%~dp0"
set "NODE=%ROOT%node\node.exe"
set "APP=%ROOT%app"

echo ============================================
echo   QuizArena - hordozhato inditas
echo ============================================
echo.

if not exist "%APP%\db\quizarena.db" (
  echo Elso inditas: adatbazis letrehozasa es feltoltese mintaadatokkal...
  "%NODE%" "%APP%\db\build_db.js"
  echo.
)

echo A szerver inditasa kulon ablakban...
start "QuizArena szerver - EZT AZ ABLAKOT NE ZARD BE" "%NODE%" "%APP%\server\app.js"

timeout /t 2 /nobreak >nul
start "" http://localhost:3000

echo.
echo A QuizArena elindult: http://localhost:3000
echo A szerver leallitasahoz zard be a "QuizArena szerver" cimu ablakot.
echo.
pause
