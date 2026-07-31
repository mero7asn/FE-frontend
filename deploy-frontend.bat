@echo off
echo ========================================
echo Deploying Frontend to Vercel
echo ========================================
echo.

cd "%~dp0"

echo.
echo IMPORTANT: Make sure you've updated .env.production
echo with your backend URL before deploying!
echo.
set /p continue="Press Enter to continue or Ctrl+C to cancel..."

echo.
echo Deploying frontend...
call vercel --prod
echo.

echo ========================================
echo Frontend Deployment Complete!
echo ========================================
echo.
echo Your app is now live!
echo.
pause
