# 🚀 AWS Free Tier - WhatsApp Bot Kurulum Rehberi

AWS Free Tier ile **12 ay ücretsiz** sunucu kullanabilirsiniz!

---

## 📋 AWS Free Tier Neler Sunuyor?

| Kaynak | Ücretsiz Limit |
|--------|----------------|
| **EC2** | 750 saat/ay (t2.micro veya t3.micro) |
| **Disk** | 30 GB SSD |
| **Trafik** | 15 GB/ay çıkış |
| **Süre** | 12 ay |

> ⚠️ **Önemli**: 12 ay sonra ücretlendirme başlar. Takvime not alın!

---

## 🔧 Adım 1: AWS Hesabı Oluşturma

1. **https://aws.amazon.com** adresine gidin
2. **"Create an AWS Account"** tıklayın
3. Bilgilerinizi doldurun:
   - Email adresi
   - Şifre
   - AWS hesap adı

4. **Kredi kartı gerekli** (doğrulama için, ücret alınmaz)
   - $1 test ücreti çekilir ve iade edilir

5. Telefon doğrulaması yapın

6. **"Basic Support - Free"** planını seçin

---

## 🖥️ Adım 2: EC2 Instance Oluşturma

### 2.1 EC2 Dashboard'a Git
1. AWS Console'da arama kutusuna **"EC2"** yazın
2. **EC2** servisine tıklayın

### 2.2 Instance Başlat
1. **"Launch Instance"** butonuna tıklayın

### 2.3 Ayarları Yapılandır

| Ayar | Değer |
|------|-------|
| **Name** | `whatsapp-bot` |
| **OS** | Ubuntu Server 22.04 LTS (Free tier eligible) |
| **Instance Type** | `t2.micro` (Free tier eligible) ⚠️ Bunu seçin! |
| **Key Pair** | "Create new key pair" → İsim: `whatsapp-bot-key` → Download |

### 2.4 Network Ayarları
**"Edit"** tıklayın ve şu kuralları ekleyin:

| Type | Port | Source | Açıklama |
|------|------|--------|----------|
| SSH | 22 | My IP | Sunucuya bağlantı |
| Custom TCP | 3000 | 0.0.0.0/0 | Admin panel |

### 2.5 Storage (Disk)
- **30 GB** gp2 (Free tier'da max 30GB)

### 2.6 Launch!
- **"Launch Instance"** tıklayın
- Birkaç dakika bekleyin

---

## 🔑 Adım 3: Sunucuya Bağlanma

### Windows için (PuTTY ile):

1. **PuTTY indirin**: https://www.putty.org

2. **.pem dosyasını .ppk'ya çevirin**:
   - PuTTYgen'i açın
   - "Load" → indirdiğiniz `.pem` dosyasını seçin
   - "Save private key" → `whatsapp-bot-key.ppk` olarak kaydedin

3. **PuTTY ile bağlanın**:
   - Host: `ubuntu@SUNUCU_IP` (EC2 Dashboard'dan IP'yi kopyalayın)
   - Port: 22
   - Connection → SSH → Auth → Browse → `.ppk` dosyasını seçin
   - "Open" tıklayın

### Mac/Linux için:

```bash
chmod 400 whatsapp-bot-key.pem
ssh -i whatsapp-bot-key.pem ubuntu@SUNUCU_IP
```

---

## 📦 Adım 4: Sunucu Kurulumu

Bağlandıktan sonra şu komutları sırayla çalıştırın:

```bash
# Sistem güncelle
sudo apt update && sudo apt upgrade -y

# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Chrome bağımlılıkları
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
    libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1

# Chromium kur
sudo apt install -y chromium-browser

# PM2 kur
sudo npm install -g pm2

# Proje klasörü oluştur
sudo mkdir -p /var/www/whatsapp-bot
sudo chown -R ubuntu:ubuntu /var/www/whatsapp-bot
```

---

## 📤 Adım 5: Bot Dosyalarını Yükle

### FileZilla ile (En Kolay):

1. **FileZilla indirin**: https://filezilla-project.org

2. **Site Manager'ı açın** (File → Site Manager)

3. **Yeni site ekleyin**:
   | Ayar | Değer |
   |------|-------|
   | Protocol | SFTP |
   | Host | EC2 IP adresi |
   | Port | 22 |
   | User | ubuntu |
   | Key file | `.ppk` dosyanız |

4. **Bağlanın** ve dosyaları `/var/www/whatsapp-bot` klasörüne sürükleyin:
   - `app.js`
   - `package.json`
   - `ecosystem.config.js`
   - `data/` klasörü
   - `public/` klasörü
   - `kataloglar/` klasörü

---

## ▶️ Adım 6: Botu Başlat

```bash
cd /var/www/whatsapp-bot

# Bağımlılıkları kur
npm install

# PM2 ile başlat
pm2 start ecosystem.config.js

# Otomatik başlatma ayarla
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
```

---

## 🌐 Adım 7: Admin Panele Eriş

Tarayıcıdan açın:
```
http://EC2_IP_ADRESI:3000
```

EC2 IP adresinizi AWS Console → EC2 → Instances → Public IPv4 address'den bulabilirsiniz.

---

## 📱 Adım 8: WhatsApp Bağla

1. Admin panelde **"WhatsApp Bağlantısı"** sayfasına gidin
2. QR kodu telefonunuzla tarayın
3. Bağlantı tamamlandı! ✅

---

## ⚠️ Önemli Uyarılar

### 💰 Ücretlendirme Kontrolü

1. **Billing Dashboard'u kontrol edin**: 
   - AWS Console → Billing → Bills
   
2. **Budget Alarm kurun**:
   - AWS Console → Billing → Budgets → Create Budget
   - $0.01 üzeri harcamada email alsın

3. **12 ay sonra ne olur?**
   - t2.micro: ~$8-10/ay
   - Ya ödemeye devam edin ya da Contabo'ya geçin

### 🔄 Elastic IP (Sabit IP)

EC2 yeniden başlatılınca IP değişir. Sabit IP için:

```
EC2 → Elastic IPs → Allocate → Associate (instance'ınıza bağlayın)
```

> ⚠️ Elastic IP kullanılmadığında ücretlidir! Instance'a bağlı olduğu sürece ücretsiz.

---

## 🛠️ Faydalı Komutlar

```bash
# Logları izle
pm2 logs whatsapp-bot

# Durumu gör
pm2 status

# Yeniden başlat
pm2 restart whatsapp-bot

# Durdur
pm2 stop whatsapp-bot
```

---

## 📅 Takvime Not Al!

```
📆 AWS Free Tier Bitiş: [BUGÜN + 12 AY]

1 ay önce hatırlatma kur - ya iptal et ya da ücretli plana geç!
```

---

## ✅ Kurulum Tamamlandı!

Artık botunuz AWS'de 7/24 çalışıyor. 

Herhangi bir cihazdan `http://EC2_IP:3000` adresine girerek yönetebilirsiniz! 🎉
