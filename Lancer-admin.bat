@echo off
chcp 65001 >nul
title Panneau admin - Heros du Jour
cd /d "%~dp0"
echo.
echo   Panneau admin de Heros du Jour
echo   ------------------------------
echo   Le panneau va s'ouvrir dans ton navigateur.
echo   Laisse cette fenetre ouverte tant que tu l'utilises.
echo   Pour arreter : ferme cette fenetre.
echo.
start "" "http://localhost:8125/outils/admin.html"
python outils\serveur-admin.py
if errorlevel 1 py outils\serveur-admin.py
echo.
pause
