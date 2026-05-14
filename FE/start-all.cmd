@echo off
echo Starting all FE projects...

start "website" cmd /c "cd /d %~dp0website &&  npm run dev -- -p 3004"
start "Workslip" cmd /c "cd /d %~dp0Workslip &&  npm run dev -- -p 3005"
start "Backoffice" cmd /c "cd /d %~dp0Backoffice && npm run dev -- -p 3006"

echo All started — close each window to stop.
