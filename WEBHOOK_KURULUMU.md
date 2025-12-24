# WhatsApp Bot Webhook Kurulumu

## ⚠️ ÖNEMLİ: Bot mesaj alamıyor çünkü webhook kurulmamış!

Bot'unuzun WhatsApp mesajlarını alabilmesi için Meta Developer Console'da webhook yapılandırması yapmanız gerekiyor.

## 📋 Adım Adım Kurulum:

### 1. Ngrok veya Localtunnel ile Public URL Oluşturun

**Seçenek A - Ngrok (Önerilen):**
```bash
# Ngrok indir: https://ngrok.com/download
# Terminal'de çalıştır:
ngrok http 3000
```

**Seçenek B - Localtunnel:**
```bash
npm install -g localtunnel
lt --port 3000
```

Bu size şuna benzer bir URL verecek:
- `https://abc123.ngrok.io` VEYA
- `https://sharp-tiger-45.loca.lt`

### 2. Meta Developer Console'da Webhook Ayarlayın

1. **Meta Developer Console'a gidin:**
   - https://developers.facebook.com/apps/1420845422894593

2. **WhatsApp → Configuration sayfasını açın**

3. **Webhook bölümünde "Configure Webhook" tıklayın**

4. **Bilgileri girin:**
   ```
   Callback URL: https://YOUR-NGROK-URL/webhook
   Verify Token: mustafa_bot_webhook_2025
   ```
   
   Örnek:
   ```
   Callback URL: https://abc123.ngrok.io/webhook
   Verify Token: mustafa_bot_webhook_2025
   ```

5. **"Verify and Save" tıklayın**
   - ✅ Başarılı olursa yeşil tik göreceksiniz

6. **Subscribe to Webhook Fields:**
   - `messages` ✓ (önemli!)
   - `messaging_postbacks` ✓

7. **Save** tıklayın

### 3. Test Edin

1. WhatsApp'tan bot numarasına mesaj atın: `Merhaba`

2. Terminal'de şunu görmelisiniz:
   ```
   📨 Webhook received: { ... }
   📱 Message from +905016300906 to user +90 501 630 09 06
   ✅ Interactive message sent to +905016300906
   ```

3. Bot size butonlu mesaj gönderecek! 🎉

## 🔧 Sorun Giderme:

### Webhook verification başarısız olursa:
- Ngrok/localtunnel çalışıyor mu kontrol edin
- URL'de `/webhook` yazdığınızdan emin olun
- Verify Token'ın tam olarak `mustafa_bot_webhook_2025` olduğundan emin olun

### Mesaj gelmiyor ama verification başarılıysa:
- Terminal'de `📨 Webhook received` mesajı görüyor musunuz?
- `messages` field'ına subscribe oldunuz mu?
- Test için `+90 501 630 09 06` numarasından mesaj atın

### Ngrok her yeniden başlatmada URL değişiyor:
- Ücretsiz Ngrok'ta normal
- Her seferinde Meta Console'da URL'i güncelleyin
- VEYA Ngrok premium alın (sabit URL)
- VEYA Production'da gerçek domain kullanın

## 🚀 Production İçin:

Production ortamında:
1. Gerçek bir domain alın (örn: bot.phuketeyiz.com)
2. SSL sertifikası kurun (Let's Encrypt ücretsiz)
3. Server'ı AWS/DigitalOcean/Heroku'ya deploy edin
4. Meta Console'da production webhook URL'ini ayarlayın

## 📞 Test Numaraları:

Meta Developer Console'da test için eklediğiniz numaralar:
- `+90 501 630 09 06` (sizin numara)

Başka numaralardan test etmek için onları da Meta Console'da ekleyin:
**WhatsApp → Getting Started → Phone Numbers → Manage phone number list**

---

✅ Webhook kurulumu tamamlandıktan sonra bot mesajlara otomatik cevap verecek!
