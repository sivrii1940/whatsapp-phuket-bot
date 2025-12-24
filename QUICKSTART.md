# 🚀 WhatsApp Bot v2.1 - Hızlı Başlangıç Kılavuzu

## ✅ Başarıyla Eklenen Özellikler

### 🔐 1. Kullanıcı Yönetim Sistemi
- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ Token tabanlı kimlik doğrulama
- ✅ Rol tabanlı yetkilendirme (Admin, Manager, User)
- ✅ Güvenli şifre hash'leme (SHA-256)
- ✅ Session yönetimi (24 saat)

### 📱 2. WhatsApp Business API Entegrasyonu
- ✅ Meta WhatsApp Business Cloud API desteği
- ✅ Text mesaj gönderme
- ✅ Template mesajları
- ✅ Medya mesajları (resim, video, PDF)
- ✅ İnteraktif butonlar
- ✅ Liste mesajları
- ✅ Webhook desteği

## 🎯 İlk Kullanım Adımları

### Adım 1: Sisteme Giriş
1. Tarayıcıda http://localhost:3000 adresine gidin
2. Otomatik olarak login sayfasına yönlendirileceksiniz
3. "Yeni Hesap Oluştur" butonuna tıklayın

### Adım 2: İlk Admin Kullanıcıyı Oluştur
```
İlk kayıt olan kullanıcı otomatik olarak ADMIN rolü alır!
```
- Kullanıcı adı: istediğiniz kullanıcı adı
- Email: geçerli bir email
- Şifre: güvenli bir şifre (min. 6 karakter)

### Adım 3: Giriş Yapın
- Oluşturduğunuz kullanıcı bilgileriyle giriş yapın
- Dashboard'a yönlendirileceksiniz

### Adım 4: WhatsApp Bağlantısı (Web.js)
1. Sol menüden "WhatsApp Bağlantısı" sekmesine gidin
2. QR kodu telefonunuzla tarayın:
   - WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz Bağla
3. Bağlantı kurulduktan sonra bot aktif olacak

## 📱 WhatsApp Business API Kurulumu (Opsiyonel)

### Meta Developer Console'da Hazırlık
1. https://developers.facebook.com/ adresine gidin
2. Yeni bir uygulama oluşturun
3. WhatsApp ürününü ekleyin
4. API bilgilerini alın:
   - Phone Number ID
   - Permanent Access Token
   - Business Account ID

### Panelde Yapılandırma
1. Dashboard'da "WhatsApp Business API" sekmesine gidin
2. Bilgileri doldurun:
   - **Phone Number ID**: Meta'dan aldığınız ID
   - **Access Token**: Permanent token
   - **Webhook Verify Token**: Kendi belirlediğiniz güvenli bir token
   - **Business Account ID**: İşletme hesabı ID'si
3. "Etkinleştir" switch'ini açın
4. "Yapılandırmayı Kaydet" butonuna tıklayın

### Webhook Kurulumu
Meta Developer Console'da:
- Callback URL: `https://your-domain.com/api/whatsapp-business/webhook`
- Verify Token: Yukarıda belirlediğiniz token
- Subscribe to: `messages` event'i

## 👥 Kullanıcı Yönetimi

### Yeni Kullanıcı Ekleme (Sadece Admin)
1. "Kullanıcı Yönetimi" sekmesine gidin
2. "Yeni Kullanıcı Ekle" butonuna tıklayın
3. Kullanıcı bilgilerini girin
4. Rolü seçin:
   - **Admin**: Tüm yetkilere sahip
   - **Manager**: Mesaj ve flow yönetimi
   - **User**: Sadece görüntüleme

## 🔑 API Kullanımı

### Giriş Endpoint
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "şifre"
}

# Response
{
  "success": true,
  "token": "abc123...",
  "user": {
    "id": "1",
    "username": "admin",
    "role": "admin"
  }
}
```

### Mesaj Gönderme (WhatsApp Business API)
```bash
POST http://localhost:3000/api/whatsapp-business/send-message
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "to": "905551234567",
  "message": "Merhaba!"
}
```

### Template Mesaj Gönderme
```bash
POST http://localhost:3000/api/whatsapp-business/send-template
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "to": "905551234567",
  "templateName": "hello_world",
  "languageCode": "tr"
}
```

## 📂 Dosya Yapısı

```
project/
├── models/
│   └── User.js                          # Kullanıcı model ve işlemleri
├── services/
│   └── WhatsAppBusinessAPI.js           # WhatsApp Business API servisi
├── middleware/
│   └── auth.js                          # Kimlik doğrulama middleware
├── routes/
│   ├── auth.js                          # Auth API endpoints
│   └── whatsapp-business.js             # WhatsApp Business API endpoints
├── data/
│   ├── users.json                       # Kullanıcı veritabanı
│   ├── whatsapp-business-config.json    # WA Business API config
│   ├── messages.json                    # Mesaj şablonları
│   ├── flows.json                       # Flow yapılandırması
│   └── settings.json                    # Genel ayarlar
├── public/
│   ├── login.html                       # Giriş sayfası
│   ├── dashboard.html                   # Ana yönetim paneli
│   ├── index.html                       # Yönlendirme sayfası
│   └── js/
│       └── admin.js                     # Panel JavaScript
├── app.js                               # Ana bot uygulaması
├── server.js                            # Express server
├── config.js                            # Bot konfigürasyonu
└── package.json
```

## 🔒 Güvenlik Notları

1. **Production Kullanımı İçin**:
   - Gerçek bir veritabanı kullanın (MongoDB, PostgreSQL)
   - HTTPS kullanın
   - JWT ile daha güvenli token yönetimi
   - Rate limiting ekleyin
   - CORS ayarlarını sıkılaştırın

2. **Şifre Politikası**:
   - Minimum 6 karakter (önerilir: 12+)
   - Karmaşık şifreler kullanın
   - Düzenli şifre değişikliği

3. **Token Güvenliği**:
   - Token'lar 24 saat geçerli
   - localStorage'da saklanır
   - Çıkış yapınca silinir

## 🐛 Sorun Giderme

### "Token gerekli" hatası
- Çıkış yapıp tekrar giriş yapın
- localStorage'ı temizleyin

### WhatsApp bağlanmıyor
- QR kodu yeniden tarayın
- Session klasörünü silin: `whatsapp-session/`
- Botu yeniden başlatın

### API çalışmıyor
- Access token'ın geçerli olduğunu kontrol edin
- Webhook URL'inin doğru olduğunu kontrol edin
- Meta Developer Console'da log'ları inceleyin

## 📊 Özellik Karşılaştırması

| Özellik | WhatsApp Web.js | WhatsApp Business API |
|---------|----------------|----------------------|
| QR Kod Bağlantısı | ✅ Evet | ❌ Hayır |
| Template Mesajları | ❌ Hayır | ✅ Evet |
| İnteraktif Butonlar | ❌ Sınırlı | ✅ Tam Destek |
| Webhook | ❌ Hayır | ✅ Evet |
| Resmi Destek | ❌ Hayır | ✅ Evet |
| Maliyet | 🆓 Ücretsiz | 💰 Ücretli |

## 🎉 Tebrikler!

Sisteminiz başarıyla kuruldu ve çalışıyor! 

- 🌐 Panel: http://localhost:3000
- 📚 Detaylı Dok: README_v2.md
- 💬 Destek: GitHub Issues

---
**Not**: Bu sistem eğitim/demo amaçlıdır. Production kullanımı için lütfen güvenlik önlemlerini artırın.
