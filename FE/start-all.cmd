@echo off
setlocal

echo Closing anything already running on ports 3004, 3005, 3006 and old Backoffice port 3002...

for %%P in (3004 3005 3006 3002) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        echo Killing process on port %%P with PID %%A
        taskkill /PID %%A /F >nul 2>&1
    )
)

echo.
echo Starting all FE projects...

start "Website" cmd /k "cd /d %~dp0website && npm run dev -- -p 3004"
start "Workslip" cmd /k "cd /d %~dp0Workslip && npm run dev -- -p 3005"
start "Backoffice" cmd /k "cd /d %~dp0Backoffice && npm run dev"

echo.
echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo Opening projects in browser...

start "" "http://localhost:3004"
start "" "http://localhost:3005"
start "" "http://localhost:3006"

echo.
echo All started — close each window to stop.
endlocal
