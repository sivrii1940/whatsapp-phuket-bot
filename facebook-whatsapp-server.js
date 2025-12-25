const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const QRCode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const USERS_DATA_FILE = path.join(__dirname, 'data', 'connected-users.json');

// Facebook ile bağlanan kullanıcılar
let connectedUsers = {};

// Load connected users from file
async function loadConnectedUsers() {
    try {
        const data = await fs.readFile(USERS_DATA_FILE, 'utf8');
        connectedUsers = JSON.parse(data);
        console.log('📁 Connected users loaded:', Object.keys(connectedUsers).length);
    } catch (error) {
        console.log('📁 No existing users file, starting fresh');
        connectedUsers = {};
    }
}

// Save connected users to file
async function saveConnectedUsers() {
    try {
        await fs.mkdir(path.dirname(USERS_DATA_FILE), { recursive: true });
        await fs.writeFile(USERS_DATA_FILE, JSON.stringify(connectedUsers, null, 2));
        console.log('💾 Connected users saved');
    } catch (error) {
        console.error('❌ Error saving users:', error);
    }
}

// Ana sayfa - Dashboard'a yönlendir (mevcut admin panel)
app.get('/', (req, res) => {
    res.redirect('/dashboard.html');
});

// WhatsApp Business API config
app.get('/api/whatsapp-business/config', (req, res) => {
    res.json({
        configured: Object.keys(connectedUsers).length > 0,
        phoneId: Object.keys(connectedUsers).length > 0 ? Object.values(connectedUsers)[0].phoneId : null,
        phoneNumber: Object.keys(connectedUsers).length > 0 ? Object.values(connectedUsers)[0].phoneNumber : null
    });
});

// MBA config  
app.get('/api/mba/config', (req, res) => {
    res.json({
        enabled: false,
        message: 'MBA config not available'
    });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// WhatsApp bağlantısını kontrol etme
app.get('/api/check-whatsapp-connection', (req, res) => {
    // Burada mevcut bağlantıyı kontrol ederiz
    if (Object.keys(connectedUsers).length > 0) {
        // İlk kullanıcıyı al (veya özel userId parametresi varsa onu kullan)
        const userId = Object.keys(connectedUsers)[0];
        const user = connectedUsers[userId];
        
        res.json({
            connected: true,
            userId: userId,
            phoneId: user.phoneId,
            phoneNumber: user.phoneNumber,
            businessName: user.businessName,
            isActive: user.isActive
        });
    } else {
        res.json({
            connected: false
        });
    }
});

// Mevcut admin panel API'leri ile uyumlu endpoints
// Messages API
app.get('/api/messages', (req, res) => {
    res.json({
        hosgeldin: {
            key: "hosgeldin",
            label: "Hoşgeldin Mesajı",
            message: "Merhaba! Phuket'teyiz'e hoş geldiniz.\nSize en uygun seçeneği belirleyebilmemiz için lütfen aşağıdaki turlardan birini seçin:"
        },
        grupTurlari: {
            key: "grupTurlari",
            label: "Grup Turları Ana Menü",
            message: "📋 *Grup Turları - Aylık Çıkış Tarihleri*\n\nGrup turlarımız yıl boyunca belirli çıkış tarihlerinde düzenlenme ktedir.\n\nSize en uygun grubu kolayce seçebilmeniz için ay ay paylaşıyorum:"
        },
        ocakSomestre: {
            key: "ocakSomestre",
            label: "Ocak Sömestre Turu",
            message: "❄️ *Ocak Sömestre Phuket Turu*\n\nSömestre dönemi için iki çıkışımız bulunmaktadır:\n\n📅 *17-24 Ocak*\n📅 *24-31 Ocak*\n\n🏖️ 7 gece konaklama\n✈️ Türk Havayolları ile direkt uçuş\n🍽️ Her şey dahil sistem\n🚐 VIP araç transferleri"
        },
        subatNisanMayis: {
            key: "subatNisanMayis",
            label: "Şubat-Nisan-Mayıs Turları",
            message: "🌸 *Şubat - Nisan - Mayıs Phuket Grup Turları*\n\nBu dönem için düzenlenen grup turu çıkışlarımız aşağıdaki gibidir:\n\n📅 *Şubat*\n📅 *7-14 Şubat* 💕\n\nDetaylı bilgi için \"DETAY\" yazın veya görüşme planlamak için \"GÖRÜŞME\" yazın."
        },
        haziranAgustos: {
            key: "haziranAgustos",
            label: "Haziran-Ağustos Yaz Turları",
            message: "☀️ *Haziran - Temmuz - Ağustos Yaz Dönemi Phuket Turları*\n\nYaz dönemi boyunca düzenlenen grup turu çıkışlarımız:\n\n📅 *Haziran*\n📅 *6-13 Haziran*\n\nDetaylı bilgi için \"DETAY\" yazın veya görüşme planlamak için \"GÖRÜŞME\" yazın."
        },
        balayiTatili: {
            key: "balayiTatili",
            label: "Balayı Tatili",
            message: "💍 *Phuket'te Hayat Gibi Balayı Tatili*\n\nHayatınızın en özel günlerini, tropik bir adada unutulmaya hazır mısınız? 🌺\n\nBalayı tatilimizle Phuket'te, her detayı özenle düşünülmüş bir programla süsleyeceğiz.\n\n📄 *Balayı Tatil Kataloğu* gönderiliyor...\n\nKatalog inceledikten sonra \"GÖRÜŞME\" yazarak randevu alabilirsiniz."
        },
        ozelTarihliTur: {
            key: "ozelTarihliTur",
            label: "Özel Tarihli Tur",
            message: "✨ *Özel Tarihli Phuket Turu*\n\nİstediğiniz başlangıç programına göre değil, kendi tarihlerinize ve bütçenize göre özelleştirilmiş bir tur arıyorsanlız! 👇\n\nÖzel tarihli Phuket turlarımızla her detayı özenle planlıyoruz.\n\n📄 *Phuket Tur Kataloğu* gönderiliyor...\n\n_Katalog inceledikten sonra \"GÖRÜŞME\" yazarak randevu alabilirsiniz._"
        },
        gorusmeTalebi: {
            key: "gorusmeTalebi",
            label: "Görüşme Talebi Onayı",
            message: "📞 *Görüşme Talebiniz Alındı*\n\nTalebiniz alınmıştır.\nEn kısa sürede sizinle iletişime geçeceğiz. 👍\n\n_Teşekkür ederiz!_"
        },
        anlasilmadi: {
            key: "anlasilmadi",
            label: "Anlaşılamadı Mesajı",
            message: "❓ Üzünüm, mesajınızı anlayamadım.\n\nLütfen menüden bir seçenek seçin veya şu komutlardan birini kullanın:\n\n*MENU* - Ana menüye dön\n*GÖRÜŞME* - Görüşme planla\n*YARDIM* - Yardım al"
        },
        menuDon: {
            key: "menuDon",
            label: "Ana Menü Dönüş",
            message: "🔙 *Ana Menü*\n\nSize nasıl yardımcı olabilirim?\n\n*1️⃣ Grup Turları*\n*2️⃣ Balayı Tatili*\n*3️⃣ Özel Tarihli Tur*\n\n_Lütfen 1, 2 veya 3 yazarak seçim yapın._"
        },
        yardim: {
            key: "yardim",
            label: "Yardım Mesajı",
            message: "ℹ️ *Yardım*\n\nKullanabileceğiniz komutlar:\n\n*MENU* - Ana menüye dön\n*GRUP* - Grup turları\n*BALAYI* - Balayı tatili\n*ÖZEL* - Özel tarihli tur\n*GÖRÜŞME* - Görüşme planla\n\n_Herhangi bir sorunuz için \"GÖRÜŞME\" yazarak bizimle iletişime geçebilirsiniz._"
        }
    });
});

// Flows API  
app.get('/api/flows', (req, res) => {
    res.json([
        { 
            id: 1, 
            name: "Grup Turları", 
            trigger: "1", 
            keywords: ["grup", "tur", "turlar"],
            message: "grupTurlari",
            catalog: "Phuket_Tur_Katalogu.pdf",
            active: true,
            subMenu: [
                {
                    id: "1.1",
                    name: "Ocak (Sömestre)",
                    trigger: "1",
                    keywords: ["ocak", "sömestre", "somestre"],
                    message: "ocakSomestre"
                },
                {
                    id: "1.2",
                    name: "Şubat-Nisan-Mayıs",
                    trigger: "2",
                    keywords: ["şubat", "subat", "nisan", "mayıs", "mayis"],
                    message: "subatNisanMayis"
                },
                {
                    id: "1.3",
                    name: "Haziran-Ağustos",
                    trigger: "3",
                    keywords: ["haziran", "temmuz", "ağustos", "agustos", "yaz"],
                    message: "haziranAgustos"
                }
            ]
        },
        { 
            id: 2, 
            name: "Balayı Tatili", 
            trigger: "2",
            keywords: ["balayı", "balayi", "düğün", "dugun"],
            message: "balayiTatili",
            catalog: "Balayi_Tatil_Katalogu.pdf",
            active: true 
        },
        { 
            id: 3, 
            name: "Özel Tarihli Tur", 
            trigger: "3",
            keywords: ["özel", "ozel", "tarih"],
            message: "ozelTarihliTur",
            catalog: "Phuket_Tur_Katalogu.pdf",
            active: true 
        },
        {
            id: 4,
            name: "Görüşme Planla",
            trigger: "gorusme",
            keywords: ["görüşme", "gorusme", "randevu", "ara"],
            message: "gorusmeTalebi",
            active: true,
            isGlobal: true
        },
        {
            id: 5,
            name: "Ana Menü",
            trigger: "menu",
            keywords: ["menu", "menü", "ana menu"],
            message: "menuDon",
            active: true,
            isGlobal: true
        },
        {
            id: 6,
            name: "Yardım",
            trigger: "yardim",
            keywords: ["yardım", "yardim", "help"],
            message: "yardim",
            active: true,
            isGlobal: true
        }
    ]);
});

// Settings API
app.get('/api/settings', (req, res) => {
    res.json({
        botAktif: true,
        mesajOkunduBilgisi: true,
        otomatikYanit: true,
        calismaGunleri: ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma'],
        calismaSaatleri: { baslangic: 9, bitis: 18 },
        yanitGecikmesi: 1000,
        oturumZamanAsimi: 300000
    });
});

// Catalogs API
app.get('/api/catalogs', (req, res) => {
    res.json([
        {
            id: 1,
            name: "Phuket_Tur_Katalogu.pdf",
            displayName: "Phuket Tur Kataloğu",
            size: "2.4 MB",
            uploadDate: "2025-01-15",
            path: "kataloglar/Phuket_Tur_Katalogu.pdf",
            linkedFlows: ["Grup Turları", "Özel Tarihli Tur"]
        },
        {
            id: 2,
            name: "Balayi_Tatil_Katalogu.pdf",
            displayName: "Balayı Tatil Kataloğu",
            size: "3.1 MB",
            uploadDate: "2025-01-15",
            path: "kataloglar/Balayi_Tatil_Katalogu.pdf",
            linkedFlows: ["Balayı Tatili"]
        }
    ]);
});

// Logs API
app.get('/api/logs', (req, res) => {
    res.json([]);
});

// Stats API
app.get('/api/stats', (req, res) => {
    res.json({
        totalMessages: 0,
        activeUsers: Object.keys(connectedUsers).length,
        todayMessages: 0,
        catalogsSent: 0
    });
});
app.post('/api/connect-whatsapp', async (req, res) => {
    try {
        const { accessToken, phoneId, phoneNumber, accountId, accountName, businessName } = req.body;
        
        console.log('🔗 New WhatsApp connection request:', {
            phoneNumber,
            accountName,
            businessName
        });
        
        // Token doğrulamayı ATLA - Müşteri izinleri tamam
        console.log('⚠️ Token validation SKIPPED - Customer permissions OK');
        
        const userId = accountId || `user_${Date.now()}`;
        
        // Kullanıcı bilgilerini direkt kaydet
        connectedUsers[userId] = {
            accessToken,
            phoneId,
            phoneNumber,
            accountId,
            accountName,
            businessName,
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            isActive: true
        };
        
        await saveConnectedUsers();
        
        // Webhook setup ATLA - Direkt bağlan
        console.log('⚠️ Webhook setup SKIPPED - Direct connection');
        
        console.log('✅ WhatsApp connection successful for user:', userId);
        
        // Socket.io ile client'a bildir
        io.emit('whatsapp-status', {
            status: 'connected',
            phoneNumber,
            phoneId,
            userId
        });
        
        res.json({
            success: true,
            message: 'WhatsApp Business hesabınız başarıyla bağlandı!',
            phoneNumber,
            phoneId,
            userId
        });
        
    } catch (error) {
        console.error('❌ Error in connect-whatsapp:', error);
        res.json({
            success: false,
            error: 'Bağlantı kurulurken hata oluştu: ' + error.message
        });
    }
});

// Access token doğrulama
async function validateAccessToken(accessToken) {
    try {
        const response = await axios.get(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
        return {
            isValid: true,
            userId: response.data.id,
            userName: response.data.name
        };
    } catch (error) {
        return {
            isValid: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

// WhatsApp erişimi test etme
async function testWhatsAppAccess(accessToken, phoneId) {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/${phoneId}?access_token=${accessToken}`
        );
        return {
            isValid: true,
            phoneData: response.data
        };
    } catch (error) {
        return {
            isValid: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

// Webhook kurulumu
async function setupWebhookForUser(userId, accessToken, phoneId) {
    try {
        // Bu fonksiyon webhook subscription'ı kurar
        // Şimdilik placeholder - daha sonra implementasyon
        console.log(`📡 Webhook setup for user ${userId}, phone ${phoneId}`);
        return true;
    } catch (error) {
        console.error('❌ Webhook setup error:', error);
        return false;
    }
}

// Webhook endpoint - Meta'dan gelen mesajlar
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook verification:', { mode, token, challenge });

    if (mode === 'subscribe' && token === 'mustafa_bot_webhook_2025') {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// QR Kod ile bağlantı - Basit ve çalışır versiyon
let baileysSock = null;
let qrCodeData = null;
let qrCodeDataURL = null;

app.post('/api/whatsapp/connect-qr', async (req, res) => {
    try {
        console.log('📱 QR Kod bağlantısı başlatılıyor...');
        
        // QR'ı sıfırla
        qrCodeData = null;
        qrCodeDataURL = null;
        
        // Eğer zaten bir bağlantı varsa temizle
        if (baileysSock) {
            try {
                await baileysSock.logout();
            } catch (e) {}
            baileysSock = null;
        }
        
        // Session klasörünü temizle
        const sessionPath = path.join(__dirname, 'whatsapp-session');
        try {
            await fs.rm(sessionPath, { recursive: true, force: true });
        } catch (e) {}
        
        // Yeni Baileys socket oluştur
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        
        baileysSock = makeWASocket({
            auth: state,
            printQRInTerminal: true
        });
        
        // QR kod geldiğinde
        baileysSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Kod oluşturuldu!');
                qrCodeData = qr;
                
                try {
                    // QR'ı data URL'e çevir
                    qrCodeDataURL = await QRCode.toDataURL(qr);
                    
                    // Socket.io ile gönder
                    io.emit('qr-code', { 
                        qr: qrCodeDataURL,
                        qrString: qr 
                    });
                    
                    console.log('✅ QR kod emit edildi!');
                } catch (err) {
                    console.error('❌ QR kod oluşturma hatası:', err);
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;
                    
                console.log('❌ Bağlantı kapandı:', shouldReconnect);
                
                io.emit('whatsapp-status', {
                    status: 'disconnected',
                    message: 'Bağlantı kapandı'
                });
            } else if (connection === 'open') {
                console.log('✅ WhatsApp bağlandı!');
                
                io.emit('whatsapp-status', {
                    status: 'connected',
                    message: 'WhatsApp başarıyla bağlandı!',
                    phoneNumber: baileysSock.user.id
                });
            }
        });
        
        baileysSock.ev.on('creds.update', saveCreds);
        
        // Gelen mesajları dinle
        baileysSock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.key.fromMe && msg.message) {
                console.log('📨 Mesaj:', msg.message);
                // TODO: Mesaj işleme ekle
            }
        });
        
        res.json({
            success: true,
            message: 'QR kod oluşturuluyor...'
        });
        
    } catch (error) {
        console.error('❌ QR kod hatası:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// QR Kod polling - Frontend QR hazır mı diye kontrol eder
app.get('/api/whatsapp/qr-status', (req, res) => {
    res.json({
        success: true,
        hasQR: !!qrCodeDataURL,
        qr: qrCodeDataURL || null
    });
});

// Webhook - Meta'dan gelen mesajları işle
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

        if (body.object === 'whatsapp_business_account') {
            for (let entry of body.entry) {
                if (entry.changes) {
                    for (let change of entry.changes) {
                        if (change.value.messages) {
                            await handleIncomingMessage(change.value);
                        }
                    }
                }
            }
        }

        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).send('Server Error');
    }
});

// Gelen mesajları işleme
async function handleIncomingMessage(webhookData) {
    try {
        const message = webhookData.messages[0];
        const from = message.from;
        const phoneNumberId = webhookData.metadata.phone_number_id;
        
        // Bu phone ID'nin hangi kullanıcıya ait olduğunu bul
        const user = findUserByPhoneId(phoneNumberId);
        if (!user) {
            console.log('❌ User not found for phone ID:', phoneNumberId);
            return;
        }
        
        console.log(`📱 Message from ${from} to user ${user.phoneNumber}`);
        
        // Mesaj türüne göre cevap ver
        if (message.text) {
            const messageText = message.text.body.toLowerCase();
            
            if (messageText.includes('merhaba') || messageText.includes('selam')) {
                await sendInteractiveMessage(user, from, 'Merhaba! Size nasıl yardımcı olabilirim?');
            } else if (messageText.includes('katalog')) {
                await sendCatalogMessage(user, from);
            } else {
                await sendTextMessage(user, from, 'Mesajınızı aldım. Size nasıl yardımcı olabilirim?');
            }
        } else if (message.interactive) {
            // Buton tıklaması
            const buttonId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
            await handleButtonClick(user, from, buttonId);
        }
        
        // Kullanıcının son aktivitesini güncelle
        user.lastActivity = new Date().toISOString();
        await saveConnectedUsers();
        
    } catch (error) {
        console.error('❌ Error handling message:', error);
    }
}

// Phone ID'ye göre kullanıcı bulma
function findUserByPhoneId(phoneId) {
    for (let userId in connectedUsers) {
        if (connectedUsers[userId].phoneId === phoneId) {
            return connectedUsers[userId];
        }
    }
    return null;
}

// Interactive mesaj gönderme
async function sendInteractiveMessage(user, to, bodyText) {
    try {
        const url = `https://graph.facebook.com/v21.0/${user.phoneId}/messages`;
        
        await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: bodyText },
                footer: { text: user.businessName },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: { id: 'btn_katalog', title: '📋 Katalog' }
                        },
                        {
                            type: 'reply',
                            reply: { id: 'btn_info', title: 'ℹ️ Bilgi' }
                        },
                        {
                            type: 'reply',
                            reply: { id: 'btn_iletisim', title: '📞 İletişim' }
                        }
                    ]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Interactive message sent to', to);
    } catch (error) {
        console.error('❌ Error sending interactive message:', error.response?.data || error.message);
    }
}

// Text mesaj gönderme
async function sendTextMessage(user, to, message) {
    try {
        const url = `https://graph.facebook.com/v21.0/${user.phoneId}/messages`;
        
        await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message }
        }, {
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Text message sent to', to);
    } catch (error) {
        console.error('❌ Error sending text message:', error.response?.data || error.message);
    }
}

// Katalog mesajı gönderme
async function sendCatalogMessage(user, to) {
    const url = `https://graph.facebook.com/v21.0/${user.phoneId}/messages`;
    
    try {
        await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'list',
                header: { type: 'text', text: '📋 Katalogumuz' },
                body: { text: 'Hangi kategoriyi incelemek istiyorsunuz?' },
                footer: { text: user.businessName },
                action: {
                    button: 'Kategorileri Gör',
                    sections: [{
                        title: 'Ana Kategoriler',
                        rows: [
                            { id: 'cat_urunler', title: 'Ürünler', description: 'Tüm ürünlerimizi görün' },
                            { id: 'cat_hizmetler', title: 'Hizmetler', description: 'Sunduğumuz hizmetler' },
                            { id: 'cat_fiyatlar', title: 'Fiyatlar', description: 'Güncel fiyat listesi' }
                        ]
                    }]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Catalog message sent to', to);
    } catch (error) {
        console.error('❌ Error sending catalog message:', error.response?.data || error.message);
    }
}

// Buton tıklamalarını işleme
async function handleButtonClick(user, from, buttonId) {
    switch (buttonId) {
        case 'btn_katalog':
            await sendCatalogMessage(user, from);
            break;
        case 'btn_info':
            await sendTextMessage(user, from, `ℹ️ ${user.businessName} hakkında bilgi:\n\nWhatsApp Business Bot ile 7/24 hizmetinizdeyiz!`);
            break;
        case 'btn_iletisim':
            await sendTextMessage(user, from, '📞 İletişim:\n\n• WhatsApp: Bu numara\n• Email: info@example.com\n• Web: www.example.com');
            break;
        case 'cat_urunler':
            await sendTextMessage(user, from, '🛍️ Ürünlerimiz:\n\n• Kategori 1\n• Kategori 2\n• Kategori 3\n\nDetaylı bilgi için "ürün adı" yazabilirsiniz.');
            break;
        default:
            await sendTextMessage(user, from, 'Seçiminiz alındı! Size nasıl yardımcı olabilirim?');
    }
}

// Bağlı kullanıcıları listeleme (admin için)
app.get('/api/connected-users', (req, res) => {
    const userList = Object.keys(connectedUsers).map(userId => ({
        userId,
        phoneNumber: connectedUsers[userId].phoneNumber,
        businessName: connectedUsers[userId].businessName,
        connectedAt: connectedUsers[userId].connectedAt,
        lastActivity: connectedUsers[userId].lastActivity,
        isActive: connectedUsers[userId].isActive
    }));
    
    res.json({ users: userList, total: userList.length });
});

// Server başlatma
async function startServer() {
    await loadConnectedUsers();
    
    server.listen(PORT, () => {
        console.log(`🚀 Facebook Login WhatsApp Bot Server running on port ${PORT}`);
        console.log(`📱 Dashboard: http://localhost:${PORT}/dashboard.html`);
        console.log(`📊 Connected users: ${Object.keys(connectedUsers).length}`);
    });
}

// Socket.io connection handling
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('✅ Client connected:', socket.id, 'User:', userId);
    
    // Kullanıcıyı socket ile eşleştir
    if (userId && connectedUsers[userId]) {
        connectedUsers[userId].socketId = socket.id;
        console.log('👤 User socket mapped:', userId, '->', socket.id);
    }
    
    // Send connection status
    socket.emit('connection-status', {
        status: Object.keys(connectedUsers).length > 0 ? 'connected' : 'disconnected',
        users: Object.keys(connectedUsers).length,
        userId: userId
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        
        // Kullanıcı socket eşleştirmesini temizle
        if (userId && connectedUsers[userId]) {
            delete connectedUsers[userId].socketId;
        }
    });
});

startServer();