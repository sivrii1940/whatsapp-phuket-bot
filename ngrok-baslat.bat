@echo off
echo ================================================
echo        WhatsApp Bot - Ngrok Baslatici
echo ================================================
echo.
echo 1. Ngrok yuklu degilse buradan indirin:
echo    https://ngrok.com/download
echo.
echo 2. Zip dosyasini acin ve ngrok.exe dosyasini 
echo    bu klasore kopyalayin
echo.
echo 3. Ngrok hesabi olusturun (ucretsiz):
echo    https://dashboard.ngrok.com/signup
echo.
echo 4. Authtoken'i kopyalayip asagidaki komutu calistirin:
echo    ngrok config add-authtoken SIZIN_TOKEN_INIZ
echo.
echo ================================================
echo Ngrok baslatiliyor...
echo ================================================
echo.

if not exist ngrok.exe (
    echo HATA: ngrok.exe bulunamadi!
    echo Lutfen ngrok.exe dosyasini bu klasore kopyalayin.
    echo.
    pause
    exit
)

echo Server port 3000'de baslatilacak...
echo.
echo Ngrok URL'inizi asagida goreceksiniz!
echo Ornek: https://abc123.ngrok.io
echo.
echo Bu URL'i Meta Developer Console'a girin:
echo https://developers.facebook.com/apps/1420845422894593
echo.
echo Webhook URL: https://SIZIN-NGROK-URL/webhook
echo Verify Token: mustafa_bot_webhook_2025
echo.
pause
echo.
echo NGROK BASLATILIYOR...
echo.
ngrok http 3000
