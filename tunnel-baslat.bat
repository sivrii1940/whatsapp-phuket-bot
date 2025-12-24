@echo off
echo ================================================
echo     WhatsApp Bot - LocalTunnel Baslatici
echo ================================================
echo.
echo Localtunnel kuruluyor (ilk seferde 10 saniye)...
echo.

call npm install -g localtunnel

echo.
echo ================================================
echo TUNNEL BASLATILIYOR...
echo ================================================
echo.
echo Asagida goreceksiniz URL'i Meta Console'a girin!
echo.
echo Webhook URL: https://SIZIN-URL.loca.lt/webhook
echo Verify Token: mustafa_bot_webhook_2025
echo.
pause
echo.

lt --port 3000 --subdomain phuket-whatsapp-bot

pause
