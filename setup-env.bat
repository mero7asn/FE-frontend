@echo off
echo Adding Frontend Environment Variables to Vercel...
echo.

echo Adding REACT_APP_API_URL...
echo https://backend-inky-zeta-14.vercel.app/api > temp.txt
vercel env add REACT_APP_API_URL production < temp.txt

echo.
echo Adding REACT_APP_WHATSAPP_NUMBER...
echo +1234567890 > temp.txt
vercel env add REACT_APP_WHATSAPP_NUMBER production < temp.txt

echo.
echo Adding REACT_APP_INTEGRITY_SECRET...
echo your_integrity_secret_change_in_production > temp.txt
vercel env add REACT_APP_INTEGRITY_SECRET production < temp.txt

del temp.txt

echo.
echo ================================
echo Environment Variables Added!
echo Now redeploying frontend...
echo ================================
echo.

vercel --prod --yes

pause
