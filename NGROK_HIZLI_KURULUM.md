# 🚀 NGROK KURULUM REHBERİ - HIZLI BAŞLANGIÇ

## 📥 1. ADIM: Ngrok İndirin (30 saniye)

1. Bu linke tıklayın: https://ngrok.com/download
2. "Download for Windows" butonuna tıklayın
3. ZIP dosyası inecek (~ 10 MB)

## 📂 2. ADIM: Ngrok.exe'yi Kopyalayın (15 saniye)

1. İndirilen ZIP dosyasını çift tıklayıp açın
2. İçindeki **ngrok.exe** dosyasını kopyalayın
3. Bu WhatsApp Bot klasörüne (bu README'nin olduğu klasöre) yapıştırın

```
WhatsappBot/
├── ngrok.exe  ← BURAYA KOPYALAYIN
├── ngrok-baslat.bat
├── facebook-whatsapp-server.js
└── ...
```

## 🔑 3. ADIM: Ücretsiz Hesap Oluşturun (1 dakika)

1. https://dashboard.ngrok.com/signup adresine gidin
2. Email veya Google hesabıyla ücretsiz kayıt olun
3. Login olduktan sonra **"Your Authtoken"** sayfası açılacak
4. Authtoken'ı kopyalayın (örn: `2bXz...` gibi uzun bir kod)

## ⚙️ 4. ADIM: Authtoken'ı Ayarlayın (20 saniye)

1. Bu klasörde CMD veya PowerShell açın (Shift + Sağ Tık → "Terminal'de Aç")
2. Şu komutu çalıştırın (**KENDİ TOKEN'INIZLA**):

```bash
ngrok config add-authtoken 2bXzYOURTOKENHEREabc123
```

## ▶️ 5. ADIM: Ngrok'u Başlatın (10 saniye)

### Yöntem 1: Batch Dosyasıyla (KOLAY)
1. `ngrok-baslat.bat` dosyasına çift tıklayın
2. Ngrok açılacak ve size bir URL verecek!

### Yöntem 2: Manuel Komutla
```bash
ngrok http 3000
```

## 🌐 6. ADIM: Ngrok URL'inizi Bulun

Ngrok başladığında şöyle bir ekran göreceksiniz:

```
Session Status                online
Account                       sizin@email.com
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

👆 **İŞTE BU URL!** → `https://abc123.ngrok.io` (sizinki farklı olacak)

## 🔧 7. ADIM: Meta Console'da Webhook Ayarlayın (2 dakika)

1. https://developers.facebook.com/apps/1420845422894593 adresine gidin
2. Sol menüden **WhatsApp → Configuration** tıklayın
3. **"Edit"** butonuna tıklayın
4. Şu bilgileri girin:

```
Callback URL: https://abc123.ngrok.io/webhook
             ↑ KENDİ NGROK URL'İNİZLE DEĞİŞTİRİN!

Verify Token: mustafa_bot_webhook_2025
```

5. **"Verify and Save"** tıklayın ✅
6. **"Manage"** butonuna tıklayın
7. **"messages"** kutusunu işaretleyin ✅
8. **"Done"** tıklayın

## ✅ 8. ADIM: TEST EDİN!

1. WhatsApp'tan bot numarasına mesaj atın: **"Merhaba"**
2. Terminal'de şunu görmelisiniz:
   ```
   📨 Webhook received from: +905016300906
   ✅ Sending interactive menu...
   ```
3. WhatsApp'ta bot size butonlu mesaj gönderecek! 🎉

## ⚠️ ÖNEMLİ NOTLAR

### 🔄 Her Ngrok Başlatışında
- Ngrok her başlattığınızda **FARKLI BİR URL** verir!
- Yeni URL'i Meta Console'da tekrar güncellemelisiniz
- (Ücretli ngrok hesabıyla sabit URL alabilirsiniz)

### 🔌 Ngrok Çalışır Durumda Olmalı
- Bot mesaj alabilmesi için **ngrok açık kalmalı**
- Ngrok'u kapattığınızda webhook çalışmaz

### 💻 Server da Çalışmalı
- Node.js serveriniz port 3000'de çalışıyor olmalı
- `node facebook-whatsapp-server.js` komutuyla başlatılmış olmalı

## 🆘 SORUN GİDERME

### "ngrok.exe bulunamadı" Hatası
→ ngrok.exe dosyasını doğru klasöre kopyaladığınızdan emin olun

### "Authentication Required" Hatası
→ Authtoken'ı doğru girdiğinizden emin olun (3. adım)

### Webhook Verification Failed
→ Verify Token'ın **tam olarak** `mustafa_bot_webhook_2025` olduğundan emin olun

### Bot Mesaja Cevap Vermiyor
→ Terminal'de "📨 Webhook received" yazısı görünüyor mu?
→ Hayır? Meta Console'da webhook URL'i kontrol edin
→ Evet? Server'daki console log'lara bakın

## 📞 HIZLI REFERANS

| Öğe | Değer |
|-----|-------|
| Ngrok İndirme | https://ngrok.com/download |
| Ngrok Dashboard | https://dashboard.ngrok.com |
| Meta Developer Console | https://developers.facebook.com/apps/1420845422894593 |
| Webhook Path | `/webhook` |
| Verify Token | `mustafa_bot_webhook_2025` |
| Server Port | `3000` |
| Test Telefon | `+90 501 630 09 06` |

## 🎯 BAŞARILI KURULUM KONTROLÜ

✅ Ngrok çalışıyor ve URL veriyor
✅ Meta Console'da webhook ayarlandı
✅ "messages" field'i subscribe edildi
✅ Node.js server port 3000'de çalışıyor
✅ Bot'a "Merhaba" yazınca cevap veriyor
✅ Butonlar görünüyor ve tıklanıyor

---

**Hepsi bu kadar! Artık botunuz çalışıyor! 🚀**
