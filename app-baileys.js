/**
 * 🤖 Phuket Turları WhatsApp Bot - Baileys Entegrasyonlu
 * 
 * Bu bot, @whiskeysockets/baileys kütüphanesi ile çalışır.
 * Gerçek WhatsApp butonlarını destekler.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Baileys WhatsApp Client
const { connectWhatsApp, sendButtonMessage, getConnectionStatus } = require('./baileys-client');

// ============================================
// EXPRESS & SOCKET.IO SETUP
// ============================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// ROUTES
// ============================================

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.get('/api/whatsapp/logs', (req, res) => {
    res.json({
        success: true,
        logs: []
    });
});

// ============================================
// DATA HELPER FUNCTIONS
// ============================================

function getMessages() {
    try {
        const messagesPath = path.join(__dirname, 'data', 'messages.json');
        if (fs.existsSync(messagesPath)) {
            return JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        }
    } catch (error) {
        console.error('Messages okuma hatası:', error);
    }
    return {};
}

function getFlows() {
    try {
        const flowsPath = path.join(__dirname, 'data', 'flows.json');
        if (fs.existsSync(flowsPath)) {
            return JSON.parse(fs.readFileSync(flowsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Flows okuma hatası:', error);
    }
    return {};
}

function getSettings() {
    try {
        const settingsPath = path.join(__dirname, 'data', 'settings.json');
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Settings okuma hatası:', error);
    }
    return {
        botName: 'Phuket Bot',
        welcomeMessage: 'Hoşgeldiniz!',
        workingHours: {
            enabled: false,
            start: 9,
            end: 18
        }
    };
}

function writeJSON(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('JSON yazma hatası:', error);
        return false;
    }
}

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Messages API
app.get('/api/messages', (req, res) => {
    res.json(getMessages());
});

app.post('/api/messages', (req, res) => {
    const messagesPath = path.join(__dirname, 'data', 'messages.json');
    if (writeJSON(messagesPath, req.body)) {
        io.emit('messages-updated');
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Kayıt hatası' });
    }
});

// Flows API
app.get('/api/flows', (req, res) => {
    res.json(getFlows());
});

app.post('/api/flows', (req, res) => {
    const flowsPath = path.join(__dirname, 'data', 'flows.json');
    if (writeJSON(flowsPath, req.body)) {
        io.emit('flows-updated');
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Kayıt hatası' });
    }
});

// Settings API
app.get('/api/settings', (req, res) => {
    res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    if (writeJSON(settingsPath, req.body)) {
        io.emit('settings-updated');
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Kayıt hatası' });
    }
});

// Status API
app.get('/api/status', (req, res) => {
    const status = getConnectionStatus();
    res.json({
        connected: status === 'connected',
        status: status,
        activeUsers: 0,
        lastActivity: new Date().toISOString()
    });
});

// Logs API
app.get('/api/logs', (req, res) => {
    res.json([]);
});

app.delete('/api/logs', (req, res) => {
    res.json({ success: true });
});

// Catalogs API (PDF Files)
app.get('/api/catalogs', (req, res) => {
    try {
        const catalogsPath = path.join(__dirname, 'kataloglar');
        if (fs.existsSync(catalogsPath)) {
            const files = fs.readdirSync(catalogsPath)
                .filter(file => file.endsWith('.pdf'))
                .map(file => ({
                    name: file,
                    path: `/kataloglar/${file}`,
                    size: fs.statSync(path.join(catalogsPath, file)).size,
                    modified: fs.statSync(path.join(catalogsPath, file)).mtime
                }));
            res.json(files);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Katalog listeme hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Kataloglar statik dosya servisi
app.use('/kataloglar', express.static(path.join(__dirname, 'kataloglar')));

// WhatsApp Business API Config
app.get('/api/whatsapp-business/config', (req, res) => {
    res.json({
        success: true,
        config: {
            phoneNumberId: null,
            accessToken: null,
            verified: false,
            webhook: {
                url: null,
                verifyToken: null
            }
        }
    });
});

// Kataloglar API (PDF Files)
app.get('/api/catalogs', (req, res) => {
    try {
        const catalogsPath = path.join(__dirname, 'kataloglar');
        if (fs.existsSync(catalogsPath)) {
            const files = fs.readdirSync(catalogsPath)
                .filter(file => file.endsWith('.pdf'))
                .map(file => ({
                    name: file,
                    path: `/kataloglar/${file}`,
                    size: fs.statSync(path.join(catalogsPath, file)).size,
                    modified: fs.statSync(path.join(catalogsPath, file)).mtime
                }));
            res.json(files);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Katalog listeme hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).send(); // No Content
});

// WhatsApp QR Kod başlat
app.post('/api/whatsapp/connect-qr', async (req, res) => {
    try {
        console.log('🔗 QR Kod bağlantısı başlatılıyor...');
        
        // Baileys client'i başlat
        await connectWhatsApp(io);
        
        res.json({ success: true, message: 'QR kod oluşturuluyor...' });
        
    } catch (error) {
        console.error('QR bağlantı hatası:', error);
        res.status(500).json({ success: false, message: 'Bağlantı hatası' });
    }
});

// Durum kontrolü
app.get('/api/whatsapp/status', (req, res) => {
    const status = getConnectionStatus();
    res.json({ 
        success: true, 
        status: status,
        connected: status === 'connected'
    });
});

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
    console.log('🔗 Yeni socket bağlantısı:', socket.id);
    
    // Bağlantı durumunu gönder
    socket.emit('status', { 
        status: getConnectionStatus(),
        timestamp: new Date().toISOString()
    });
    
    // Heartbeat
    const heartbeat = setInterval(() => {
        if (socket.connected) {
            socket.emit('ping', { timestamp: Date.now() });
        } else {
            clearInterval(heartbeat);
        }
    }, 30000);
    
    // Disconnect handling
    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket bağlantısı kapandı:', socket.id, reason);
        clearInterval(heartbeat);
    });
    
    socket.on('error', (error) => {
        console.error('❌ Socket hatası:', error);
    });
    
    // Pong response
    socket.on('pong', (data) => {
        // Client alive response
    });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         🤖 Phuket Turları WhatsApp Bot v3.0                ║');
    console.log('║              + Baileys Client (Gerçek Butonlar)            ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  🚀 Başlatılıyor...                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log(`🖥️  Admin Panel: http://localhost:${PORT}`);
    console.log('📱 WhatsApp bağlantısı bekleniyor...');
    console.log('🌐 Dashboard\'dan "QR Başlat" butonuna tıklayın\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Bot kapatılıyor...');
    process.exit(0);
});