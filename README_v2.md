# 🤖 WhatsApp Bot - Gelişmiş Versiyon

## ✨ Yeni Özellikler

### 🔐 Kullanıcı Yönetimi
- Kullanıcı kayıt ve giriş sistemi
- Rol tabanlı yetkilendirme (Admin, Manager, User)
- JWT benzeri token tabanlı oturum yönetimi
- Güvenli şifre hash'leme

### 📱 WhatsApp Business API Entegrasyonu
- Meta WhatsApp Business API desteği
- Gelişmiş mesaj tipleri:
  - Text mesajları
  - Template mesajları
  - Medya mesajları (resim, video, PDF)
  - İnteraktif buton mesajları
  - Liste mesajları
- Webhook desteği
- Mesaj durumu takibi

### 🎯 Özellikler

1. **Kullanıcı Sistemi**
   - Kayıt ol / Giriş yap
   - Şifre değiştirme
   - Kullanıcı profil yönetimi
   - Çoklu kullanıcı desteği

2. **WhatsApp Business API**
   - Cloud API entegrasyonu
   - Template yönetimi
   - Medya paylaşımı
   - İnteraktif mesajlar

3. **Admin Panel**
   - Kullanıcı yönetimi
   - WhatsApp Business API ayarları
   - Mesaj şablonları
   - İstatistikler ve raporlar

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. İlk Kullanıcıyı Oluştur
Sistemi ilk kez başlattığınızda, kayıt olan ilk kullanıcı otomatik olarak **admin** rolü alır.

### 3. Sistemi Başlat
```bash
npm start
```

Server http://localhost:3000 adresinde çalışacaktır.

## 📖 Kullanım

### Giriş Yapma
1. Tarayıcıda `http://localhost:3000` adresine gidin
2. İlk kez kullanıyorsanız "Yeni Hesap Oluştur" butonuna tıklayın
3. Kullanıcı bilgilerinizi girin ve kayıt olun
4. Giriş yapın

### WhatsApp Business API Kurulumu

#### Meta Business Hesabı Oluşturma
1. [Meta for Developers](https://developers.facebook.com/) adresine gidin
2. Bir uygulama oluşturun ve WhatsApp ürününü ekleyin
3. Phone Number ID ve Access Token'ı alın

#### API Yapılandırması
1. Admin panele giriş yapın
2. Yan menüden "WhatsApp Business API" sekmesine gidin
3. Gerekli bilgileri girin:
   - **Phone Number ID**: WhatsApp Business telefon numarası ID'si
   - **Access Token**: Meta API erişim token'ı
   - **Webhook Verify Token**: Webhook doğrulama için özel token
   - **Business Account ID**: İşletme hesabı ID'si
4. "Kaydet" butonuna tıklayın

#### Webhook Kurulumu
1. Meta Developer Console'da Webhooks bölümüne gidin
2. Callback URL: `https://your-domain.com/api/whatsapp-business/webhook`
3. Verify Token: Ayarlarda girdiğiniz token
4. Subscribe to: `messages` event'i

## 🔑 API Endpoints

### Auth Endpoints
```
POST /api/auth/register       - Yeni kullanıcı kaydı
POST /api/auth/login          - Kullanıcı girişi
POST /api/auth/logout         - Çıkış
GET  /api/auth/me             - Mevcut kullanıcı bilgisi
POST /api/auth/change-password - Şifre değiştir
```

### WhatsApp Business API Endpoints
```
GET  /api/whatsapp-business/config        - Yapılandırmayı al
POST /api/whatsapp-business/config        - Yapılandırmayı güncelle
POST /api/whatsapp-business/send-message  - Mesaj gönder
POST /api/whatsapp-business/send-template - Template gönder
POST /api/whatsapp-business/send-media    - Medya gönder
POST /api/whatsapp-business/send-buttons  - Buton mesajı gönder
POST /api/whatsapp-business/send-list     - Liste mesajı gönder
GET  /api/whatsapp-business/profile       - Business profil bilgisi
```

## 🔒 Güvenlik

- Şifreler SHA-256 ile hash'lenir
- Token tabanlı kimlik doğrulama
- Rol tabanlı erişim kontrolü
- Session yönetimi ve timeout

## 📁 Dosya Yapısı

```
project/
├── models/
│   └── User.js                    # Kullanıcı modeli
├── services/
│   └── WhatsAppBusinessAPI.js     # WhatsApp Business API servisi
├── middleware/
│   └── auth.js                    # Auth middleware'leri
├── routes/
│   ├── auth.js                    # Auth route'ları
│   └── whatsapp-business.js       # WhatsApp Business route'ları
├── data/
│   ├── users.json                 # Kullanıcı veritabanı
│   ├── whatsapp-business-config.json  # WhatsApp API config
│   ├── messages.json              # Mesaj şablonları
│   └── settings.json              # Genel ayarlar
├── public/
│   ├── login.html                 # Giriş sayfası
│   ├── dashboard.html             # Ana panel
│   └── js/
│       └── admin.js               # Panel JavaScript
├── app.js                         # Ana uygulama (Bot)
├── server.js                      # Server
└── package.json
```

## 🛠 Kullanılan Teknolojiler

- **Backend**: Node.js, Express.js
- **WhatsApp**: whatsapp-web.js, WhatsApp Business API
- **Real-time**: Socket.IO
- **Frontend**: Bootstrap 5, Vanilla JavaScript
- **Auth**: Custom JWT-like token system
- **Storage**: JSON file-based database

## 📝 Kullanıcı Rolleri

### Admin
- Tüm yetkilere sahip
- Kullanıcı yönetimi
- Sistem ayarları
- WhatsApp API yapılandırması

### Manager
- Mesaj şablonlarını düzenleyebilir
- İstatistikleri görüntüleyebilir
- Katalog yönetimi

### User
- Sadece görüntüleme yetkisi
- Logları inceleyebilir

## 🔄 Güncellemeler

### v2.1.0 (Mevcut)
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ WhatsApp Business API entegrasyonu
- ✅ Rol tabanlı yetkilendirme
- ✅ Token tabanlı auth
- ✅ Gelişmiş mesaj tipleri desteği

### v2.0.0
- Admin panel
- Mesaj şablonları
- Flow yönetimi
- Real-time updates

## 🐛 Sorun Giderme

### Port 3000 kullanımda hatası
```bash
# Windows'ta portu kullanan process'i bul ve sonlandır
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### WhatsApp bağlantı hatası
- QR kodu tarayın
- Session dosyalarını silin ve yeniden başlatın
- `whatsapp-session` klasörünü silin

### API bağlantı hatası
- Access token'ın geçerli olduğundan emin olun
- Webhook URL'inin doğru olduğunu kontrol edin
- HTTPS kullanılıyor mu kontrol edin

## 📞 Destek

Sorularınız için GitHub Issues kullanabilirsiniz.

## 📄 Lisans

MIT License

---

**Not**: Bu sistem production kullanımı için veritabanı (MongoDB, PostgreSQL vb.) kullanılması önerilir. Şu anki versiyon JSON dosyaları kullanmaktadır.
