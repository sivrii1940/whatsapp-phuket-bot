# 🌴 Phuket Turları WhatsApp Bot

Phuket turları için otomatik WhatsApp chatbot. Müşterilerinizi karşılar, tur seçeneklerini sunar ve katalog gönderir.

## 📋 Özellikler

- ✅ Otomatik karşılama mesajı
- ✅ Grup Turları, Balayı Tatili, Özel Tarihli Tur seçenekleri
- ✅ Dönemsel tur bilgileri (Ocak, Şubat-Mayıs, Haziran-Ağustos)
- ✅ PDF katalog gönderimi
- ✅ Görüşme talebi alma
- ✅ Çalışma saatleri kontrolü
- ✅ Oturum zaman aşımı yönetimi
- ✅ Admin komutları

---

## 🚀 Hızlı Kurulum

### 1. Gereksinimler

- **Node.js** (v18 veya üzeri) - [İndir](https://nodejs.org/)
- **Google Chrome** veya **Chromium** tarayıcı

### 2. Kurulum Adımları

```bash
# Klasöre git
cd "c:\Users\Mustafa\Desktop\MüşteriÇalışmaları\Whatsappkarsılamabotu"

# Bağımlılıkları yükle
npm install

# Botu başlat
npm start
```

### 3. QR Kod ile Bağlanma

1. Bot başladığında terminalde bir **QR kod** görünecek
2. Telefonunuzda **WhatsApp** açın
3. **Ayarlar > Bağlı Cihazlar > Cihaz Bağla** seçin
4. QR kodu tarayın
5. Bot artık aktif! 🎉

---

## 📁 Dosya Yapısı

```
Whatsappkarsılamabotu/
├── bot.js              # Ana bot kodu
├── config.js           # Ayarlar
├── messages.js         # Tüm mesaj içerikleri
├── flows.js            # Akış mantığı
├── package.json        # Proje bilgileri
├── README.md           # Bu dosya
└── kataloglar/         # PDF kataloglar
    ├── Phuket_Tur_Katalogu.pdf
    └── Balayi_Tatil_Katalogu.pdf
```

---

## ⚙️ Yapılandırma

### config.js dosyasını düzenleyin:

```javascript
module.exports = {
    // Şirket adı
    sirketAdi: "Phuket Türk Ekibi",
    
    // PDF katalog yolları
    kataloglar: {
        phuketTur: "./kataloglar/Phuket_Tur_Katalogu.pdf",
        balayiTatil: "./kataloglar/Balayi_Tatil_Katalogu.pdf"
    },
    
    // Çalışma saatleri (09:00 - 22:00)
    calismaSaatleri: {
        baslangic: 9,
        bitis: 22
    },
    
    // Oturum zaman aşımı (dakika)
    oturumZamanAsimi: 30
};
```

---

## 📝 Mesajları Özelleştirme

Tüm mesajlar `messages.js` dosyasındadır. İstediğiniz gibi düzenleyebilirsiniz:

```javascript
// Örnek: Hoş geldin mesajını değiştir
hosgeldin: `🌴 *Merhaba!*

Phuket turları için doğru yerdesiniz.
...
`
```

---

## 📄 PDF Katalog Ekleme

1. `kataloglar` klasörünü açın (yoksa otomatik oluşturulur)
2. PDF dosyalarınızı ekleyin:
   - `Phuket_Tur_Katalogu.pdf`
   - `Balayi_Tatil_Katalogu.pdf`
3. Dosya adlarını `config.js` ile eşleştirin

---

## 🛠️ Admin Komutları

Kendi telefonunuzdan (WhatsApp üzerinden) şu komutları yazabilirsiniz:

| Komut | Açıklama |
|-------|----------|
| `!durum` | Bot durumunu göster |
| `!oturumlar` | Aktif oturumları listele |
| `!yardim` | Komut listesi |

---

## 💬 Kullanıcı Komutları

Müşterileriniz şu komutları kullanabilir:

| Komut | Açıklama |
|-------|----------|
| `MENU` | Ana menüye dön |
| `GÖRÜŞME` | Görüşme planla |
| `YARDIM` | Yardım al |
| `1`, `2`, `3` | Menü seçenekleri |

---

## 🔄 Bot Akışı

```
Hoş Geldin Mesajı
       ↓
   Ana Menü
   ├── 1. Grup Turları → Dönem Seçimi → Detay/Görüşme
   ├── 2. Balayı Tatili → Katalog → Görüşme
   └── 3. Özel Tarihli → Katalog → Görüşme
```

---

## ⚠️ Önemli Notlar

1. **Resmi olmayan API**: Bu bot WhatsApp'ın resmi API'sini kullanmaz. Yoğun kullanımda hesabınız engellenebilir.

2. **7/24 Çalıştırma**: Botu sürekli çalıştırmak için:
   - Windows: PM2 veya Windows Service kullanın
   - Linux: PM2 veya systemd kullanın

3. **Yedekleme**: `whatsapp-session` klasörünü yedekleyin. Bu sayede QR kod tekrar taramak gerekmez.

---

## 🔧 Sorun Giderme

### QR kod görünmüyor
```bash
# Node modüllerini temizle ve yeniden yükle
rm -rf node_modules
npm install
```

### Chromium hatası
```bash
# Manuel Chromium yükle
npm install puppeteer
```

### Oturum bozuldu
```bash
# Oturum klasörünü sil
rm -rf whatsapp-session
npm start
```

---

## 📞 Destek

Sorularınız için iletişime geçin.

---

## 📜 Lisans

MIT License - Serbestçe kullanabilirsiniz.
  
