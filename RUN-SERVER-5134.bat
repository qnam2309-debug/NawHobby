@echo off
echo Killing old dotnet processes on ports 5134,5000...
netstat -ano ^| findstr :5134 ^| findstr LISTENING ^| for /f "tokens=5" %%a in ('more') do taskkill /PID %%a /F >nul 2>&1
netstat -ano ^| findstr :5000 ^| findstr LISTENING ^| for /f "tokens=5" %%a in ('more') do taskkill /PID %%a /F >nul 2>&1

echo Starting GundamStore API on http://localhost:5134...
cd backend\GundamStoreApi
dotnet run --urls=http://localhost:5134
pause
