@echo off
echo [*] Sincronizando backup no GitHub...
git add .
git commit -m "auto: deploy e backup Faxina Gravitacional: Caos Zero-G! (CrazyGames HTML5)"
git push -u origin main
echo [OK] Backup concluido com sucesso!
