# 🚀 WhatsApp Bot Sunucu Kurulum Rehberi

Bu rehber, WhatsApp botunuzu bir VPS sunucusunda 7/24 çalıştırmanızı sağlar.

---

## 📋 Gereksinimler

- Ubuntu 20.04 veya 22.04 VPS (minimum 1GB RAM, önerilen 2GB)
- SSH erişimi
- Domain (opsiyonel, admin panel için)

---

## 🔧 Adım 1: Sunucuya Bağlanma

```bash
ssh root@SUNUCU_IP_ADRESI
```

---

## 📦 Adım 2: Sistem Güncellemesi

```bash
apt update && apt upgrade -y
```

---

## 🟢 Adım 3: Node.js Kurulumu

```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js kur
apt install -y nodejs

# Versiyon kontrolü
node -v
npm -v
```

---

## 🌐 Adım 4: Chrome/Chromium Kurulumu (WhatsApp Web için gerekli)

```bash
# Gerekli kütüphaneler
apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 \
    lsb-release xdg-utils wget libgbm1

# Chromium kur
apt install -y chromium-browser
```

---

## 📁 Adım 5: Bot Dosyalarını Yükle

### Seçenek A: Git ile (Önerilen)

```bash
# Proje klasörü oluştur
mkdir -p /var/www
cd /var/www

# Git ile klonla (GitHub kullanıyorsanız)
git clone https://github.com/KULLANICI/whatsapp-bot.git
cd whatsapp-bot
```

### Seçenek B: SFTP/SCP ile

```bash
# Bilgisayarınızdan sunucuya kopyalayın
scp -r ./Whatsappkarsılamabotu root@SUNUCU_IP:/var/www/whatsapp-bot
```

### Seçenek C: FileZilla ile

1. FileZilla'yı açın
2. Host: SUNUCU_IP, Username: root, Port: 22
3. Tüm proje dosyalarını `/var/www/whatsapp-bot` klasörüne yükleyin

---

## 📥 Adım 6: Bağımlılıkları Kur

```bash
cd /var/www/whatsapp-bot
npm install
```

---

## ⚙️ Adım 7: PM2 Kurulumu (Process Manager)

```bash
# PM2'yi global olarak kur
npm install -g pm2

# Botu başlat
pm2 start ecosystem.config.js

# Durumu kontrol et
pm2 status

# Logları izle
pm2 logs whatsapp-bot

# Sunucu yeniden başladığında otomatik çalış
pm2 startup
pm2 save
```

---

## 🔥 Adım 8: Firewall Ayarları

```bash
# UFW etkinleştir
ufw enable

# SSH izin ver
ufw allow 22

# Admin panel portu
ufw allow 3000

# Durumu kontrol et
ufw status
```

---

## 🌐 Adım 9: Admin Panele Erişim

Tarayıcıdan açın:
```
http://SUNUCU_IP:3000
```

---

## 📱 Adım 10: WhatsApp Bağlantısı

1. Admin paneli açın
2. QR kodu görüntüleyin
3. Telefonunuzla tarayın
4. Bağlantı tamamlandı!

---

## 🔒 Adım 11: Nginx ile Güvenli Bağlantı (Opsiyonel)

Domain ve SSL sertifikası için:

```bash
# Nginx kur
apt install -y nginx

# Certbot kur (SSL için)
apt install -y certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/whatsapp-bot` dosyası oluştur:

```nginx
server {
    listen 80;
    server_name bot.siteniz.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Siteyi etkinleştir
ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL sertifikası al
certbot --nginx -d bot.siteniz.com
```

---

## 📊 Faydalı PM2 Komutları

```bash
# Durumu göster
pm2 status

# Logları göster
pm2 logs whatsapp-bot

# Yeniden başlat
pm2 restart whatsapp-bot

# Durdur
pm2 stop whatsapp-bot

# Sil
pm2 delete whatsapp-bot

# Kaynak kullanımı
pm2 monit
```

---

## 🔄 Güncelleme Yapma

```bash
cd /var/www/whatsapp-bot

# Git ile güncelle
git pull

# Bağımlılıkları güncelle
npm install

# Botu yeniden başlat
pm2 restart whatsapp-bot
```

---

## ⚠️ Sorun Giderme

### QR Kod Görünmüyor
```bash
# Chrome'un düzgün kurulduğunu kontrol et
which chromium-browser

# Logları kontrol et
pm2 logs whatsapp-bot --lines 100
```

### Bellek Yetersiz
```bash
# Swap alanı oluştur (2GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Bağlantı Kopuyor
WhatsApp oturumu `.wwebjs_auth` klasöründe saklanır. Bu klasörün yazma izinlerini kontrol edin:
```bash
chmod -R 755 /var/www/whatsapp-bot/.wwebjs_auth
```

---

## 💰 Önerilen VPS Sağlayıcıları

| Sağlayıcı | Minimum Plan | Fiyat |
|-----------|--------------|-------|
| [Contabo](https://contabo.com) | VPS S (4GB RAM) | €4.99/ay |
| [Hetzner](https://hetzner.com) | CX11 (2GB RAM) | €3.79/ay |
| [DigitalOcean](https://digitalocean.com) | Basic (1GB RAM) | $6/ay |
| [Vultr](https://vultr.com) | Cloud (1GB RAM) | $5/ay |
| [Turhost](https://turhost.com) | VDS-1 | ₺150/ay |

---

## 📞 Destek

Sorunlarınız için iletişime geçin.

---

**🎉 Kurulum tamamlandı! Botunuz artık 7/24 çalışıyor.**
