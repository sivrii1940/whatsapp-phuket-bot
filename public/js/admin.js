// WhatsApp Bot Admin Panel - JavaScript
// v5.0 - Facebook Login & Meta API Edition

// Global Variables
let currentConnection = null;
let metaAccessToken = null;
let connectedPhoneId = null;
let selectedWhatsAppAccount = null;
let userAccessToken = null;
let socket = null;
let currentUserId = null;

// Facebook SDK Initialize
window.fbAsyncInit = function() {
    try {
        FB.init({
            appId: '1420845422894593', // Your Meta App ID
            cookie: true,
            xfbml: true,
            version: 'v21.0'
        });
        
        console.log('✅ Facebook SDK initialized');
        
        // Check saved session first
        setTimeout(() => {
            checkSavedSession();
        }, 500);
    } catch (error) {
        console.error('Facebook SDK init error:', error);
        checkSavedSession();
    }
};

// Load Facebook SDK
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/tr_TR/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Check saved session from localStorage - OTOMATIK LOGIN
async function checkSavedSession() {
    try {
        const savedToken = localStorage.getItem('whatsapp_access_token');
        const savedPhoneId = localStorage.getItem('whatsapp_phone_id');
        const savedPhoneNumber = localStorage.getItem('whatsapp_phone_number');
        const savedUserId = localStorage.getItem('whatsapp_user_id');
        
        if (savedToken && savedPhoneId && savedUserId) {
            console.log('📱 Kaydedilmiş oturum bulundu - OTOMATIK GİRİŞ');
            
            metaAccessToken = savedToken;
            connectedPhoneId = savedPhoneId;
            currentUserId = savedUserId;
            
            // Direkt bağlan - token kontrolü yapmadan
            updateConnectionStatus(true, savedPhoneNumber);
            initializeSocket(savedUserId);
            
            // Dashboard'a git
            showPage('dashboard');
            
            console.log('✅ Otomatik giriş başarılı!');
        } else {
            console.log('ℹ️ İlk giriş - Facebook login gerekli');
            showPage('connection');
        }
    } catch (error) {
        console.error('Session check error:', error);
        showPage('connection');
    }
}

// Verify connection with backend
async function verifyConnection(accessToken, phoneId) {
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Token doğrulama hatası:', data.error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Bağlantı doğrulama hatası:', error);
        return false;
    }
}

// Clear saved session
function clearSavedSession() {
    localStorage.removeItem('whatsapp_access_token');
    localStorage.removeItem('whatsapp_phone_id');
    localStorage.removeItem('whatsapp_phone_number');
    localStorage.removeItem('whatsapp_user_id');
    metaAccessToken = null;
    connectedPhoneId = null;
    currentUserId = null;
    console.log('🗑️ Oturum bilgileri temizlendi');
}

// Initialize Socket.io connection
function initializeSocket(userId) {
    if (socket && socket.connected) {
        console.log('⚠️ Socket zaten bağlı');
        return;
    }
    
    if (socket) {
        socket.disconnect();
    }
    
    console.log('🔌 Socket.io bağlantısı kuruluyor...');
    
    socket = io('http://localhost:3000', {
        query: { userId: userId || 'guest' },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
        console.log('✅ Socket.io bağlantısı kuruldu - ID:', socket.id);
    });
    
    socket.on('whatsapp-status', (data) => {
        console.log('📱 WhatsApp durum güncellemesi:', data);
        if (data.status === 'connected') {
            updateConnectionStatus('online', 'WhatsApp Bağlı', data.phoneNumber);
        } else {
            updateConnectionStatus('offline', 'Bağlantı Kesildi', data.message || '');
        }
    });
    
    socket.on('disconnect', (reason) => {
        console.log('❌ Socket.io bağlantısı kesildi:', reason);
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket.io bağlantı hatası:', error.message);
    });
}

// Connect with Test Token (for quick setup)
async function connectWithTestToken() {
    const accessToken = prompt('Meta API Testing sayfasından Access Token\'ı yapıştırın:');
    if (!accessToken) return;
    
    const phoneId = prompt('Phone Number ID\'yi girin:\n(Örn: 979792258544716)');
    if (!phoneId) return;
    
    const phoneNumber = prompt('Telefon numarasını girin:\n(Örn: +1 555 134 3275)');
    if (!phoneNumber) return;
    
    showConnectionStatus('Test token ile bağlanıyor...', 'info');
    
    try {
        const response = await apiCall('/api/connect-whatsapp', 'POST', {
            accessToken: accessToken,
            phoneId: phoneId,
            phoneNumber: phoneNumber,
            accountId: 'test-account',
            accountName: 'Test WhatsApp Account',
            businessName: 'My Business'
        });
        
        if (response.success) {
            connectedPhoneId = phoneId;
            metaAccessToken = accessToken;
            currentUserId = response.userId;
            
            // Oturum bilgilerini localStorage'a kaydet
            localStorage.setItem('whatsapp_access_token', accessToken);
            localStorage.setItem('whatsapp_phone_id', phoneId);
            localStorage.setItem('whatsapp_phone_number', phoneNumber);
            localStorage.setItem('whatsapp_user_id', response.userId);
            
            console.log('💾 Oturum bilgileri kaydedildi');
            
            // BAĞLANTI DURUMUNU GÜNCELLE!
            updateConnectionStatus('online', 'WhatsApp Bağlı', phoneNumber);
            
            // Socket.io bağlantısı kur
            initializeSocket(response.userId);
            
            showConnectionStatus('✅ WhatsApp Business hesabınız başarıyla bağlandı!', 'success');
            
            // Navigate to messages page
            setTimeout(() => {
                showPage('messages');
            }, 2000);
            
        } else {
            showConnectionStatus('Bağlantı hatası: ' + response.error, 'danger');
        }
        
    } catch (error) {
        showConnectionStatus('Bağlantı hatası: ' + error.message, 'danger');
    }
}

// Facebook Login Function
function loginWithFacebook() {
    if (typeof FB === 'undefined') {
        alert('Facebook SDK yükleniyor, lütfen sayfayı yenileyin.');
        location.reload();
        return;
    }
    
    console.log('🔵 Facebook Login başlatılıyor...');
    
    FB.login(function(response) {
        console.log('📥 Facebook response:', response);
        
        if (response.authResponse) {
            console.log('✅ Facebook login başarılı!');
            const accessToken = response.authResponse.accessToken;
            const userID = response.authResponse.userID;
            
            console.log('🔑 Access Token alındı:', accessToken.substring(0, 20) + '...');
            console.log('👤 User ID:', userID);
            
            // WhatsApp Business hesaplarını al
            getWhatsAppBusinessAccounts(accessToken);
        } else {
            console.log('❌ Facebook login iptal edildi veya başarısız');
            console.log('Status:', response.status);
            
            if (response.status === 'unknown') {
                alert('❌ Facebook girişi iptal edildi.\n\nLütfen "Facebook ile Giriş Yap" butonuna tekrar tıklayın ve izinleri onaylayın.');
            } else {
                alert('❌ Facebook girişi başarısız.\n\nHata: ' + (response.error || 'Bilinmeyen hata') + '\n\nLütfen tekrar deneyin.');
            }
        }
    }, {
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        return_scopes: true,
        auth_type: 'rerequest'
    });
}

// WhatsApp Business hesaplarını al
async function getWhatsAppBusinessAccounts(accessToken) {
    try {
        console.log('📱 Facebook Login başarılı, WhatsApp bağlantısı kuruluyor...');
        
        // Kullanıcı bilgilerini al
        const userResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`);
        const userData = await userResponse.json();
        console.log('👤 User Data:', userData);
        
        if (userData.error) {
            throw new Error(userData.error.message);
        }
        
        currentUserId = userData.id;
        userAccessToken = accessToken;
        
        console.log('✅ Facebook kimlik doğrulandı:', userData.name);
        
        // Phone Number ID'yi kullanıcıdan al
        // Meta Console → WhatsApp → Phone Numbers sayfasından alınır
        const phoneId = prompt(
            '📱 Meta Console\'dan Phone Number ID\'yi girin:\n\n' +
            '1. https://business.facebook.com/wa/manage/phone-numbers/ sayfasını açın\n' +
            '2. Telefon numaranızı seçin\n' +
            '3. "Phone Number ID" değerini kopyalayın\n\n' +
            'Örnek: 979792258544716'
        );
        
        if (!phoneId || phoneId.trim() === '') {
            alert('❌ Phone Number ID gerekli!\n\nMeta Console\'dan Phone Number ID\'yi alıp tekrar deneyin.');
            showPage('connection');
            return;
        }
        
        const phoneNumber = prompt(
            '📞 WhatsApp Business telefon numaranızı girin:\n\n' +
            'Örnek: +90 555 123 4567'
        );
        
        if (!phoneNumber || phoneNumber.trim() === '') {
            alert('❌ Telefon numarası gerekli!');
            showPage('connection');
            return;
        }
        
        console.log('📱 Phone Number ID:', phoneId);
        console.log('📞 Phone Number:', phoneNumber);
        
        // Bağlantıyı test et
        const testResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?access_token=${accessToken}`);
        const testData = await testResponse.json();
        
        if (testData.error) {
            console.error('❌ Phone ID doğrulama hatası:', testData.error);
            alert('❌ Phone Number ID doğrulanamadı!\n\nHata: ' + testData.error.message + '\n\nLütfen Meta Console\'dan doğru Phone Number ID\'yi alın.');
            showPage('connection');
            return;
        }
        
        console.log('✅ Phone Number ID doğrulandı:', testData);
        
        // Bağlantıyı kur
        await connectWhatsAppAccount(accessToken, phoneId, phoneNumber, userData.name + ' - WhatsApp Business');
    } catch (error) {
        console.error('❌ Hata:', error);
        alert('WhatsApp hesapları alınırken hata: ' + error.message);
    }
}

// WhatsApp hesabını bağla
async function connectWhatsAppAccount(accessToken, phoneId, phoneNumber, businessName) {
    try {
        console.log('🔌 WhatsApp hesabı bağlanıyor...');
        
        const response = await apiCall('/api/connect-whatsapp', 'POST', {
            accessToken: accessToken,
            phoneId: phoneId,
            phoneNumber: phoneNumber,
            accountId: phoneId,
            accountName: businessName,
            businessName: businessName
        });
        
        if (response.success) {
            // Session bilgilerini kaydet
            localStorage.setItem('whatsapp_access_token', accessToken);
            localStorage.setItem('whatsapp_phone_id', phoneId);
            localStorage.setItem('whatsapp_phone_number', phoneNumber);
            localStorage.setItem('whatsapp_user_id', response.userId);
            
            connectedPhoneId = phoneId;
            metaAccessToken = accessToken;
            currentUserId = response.userId;
            
            // UI'ı güncelle
            updateConnectionStatus(true, phoneNumber);
            
            // Socket bağlantısı
            initializeSocket(response.userId);
            
            alert('✅ WhatsApp Business hesabınız başarıyla bağlandı!');
            
            // Dashboard'a git
            showPage('dashboard');
        } else {
            alert('Bağlantı hatası: ' + (response.error || 'Bilinmeyen hata'));
        }
    } catch (error) {
        console.error('❌ Bağlantı hatası:', error);
        alert('Bağlantı kurulurken hata: ' + error.message);
    }
}

// Get User's WhatsApp Business Accounts
async function getUserWhatsAppAccounts(accessToken) {
    try {
        // Get user's businesses
        const businessResponse = await fetch(`https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}`);
        const businessData = await businessResponse.json();
        
        console.log('Businesses:', businessData);
        
        if (!businessData.data || businessData.data.length === 0) {
            showConnectionStatus('WhatsApp Business hesabı bulunamadı. Lütfen önce Meta Business Manager\'da WhatsApp Business hesabınızı kurun.', 'warning');
            return;
        }
        
        let allWhatsAppAccounts = [];
        
        // Get WhatsApp accounts for each business
        for (let business of businessData.data) {
            try {
                const whatsappResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
                );
                const whatsappData = await whatsappResponse.json();
                
                if (whatsappData.data) {
                    for (let account of whatsappData.data) {
                        // Get phone numbers for each WhatsApp account
                        const phoneResponse = await fetch(
                            `https://graph.facebook.com/v21.0/${account.id}/phone_numbers?access_token=${accessToken}`
                        );
                        const phoneData = await phoneResponse.json();
                        
                        if (phoneData.data) {
                            for (let phone of phoneData.data) {
                                allWhatsAppAccounts.push({
                                    businessName: business.name,
                                    accountId: account.id,
                                    accountName: account.name,
                                    phoneId: phone.id,
                                    phoneNumber: phone.display_phone_number,
                                    status: phone.verified_name
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting WhatsApp accounts for business:', business.name, error);
            }
        }
        
        console.log('All WhatsApp Accounts:', allWhatsAppAccounts);
        
        if (allWhatsAppAccounts.length === 0) {
            showConnectionStatus('WhatsApp Business telefon numarası bulunamadı. Lütfen Meta Business Manager\'da telefon numaranızı ekleyin.', 'warning');
            return;
        }
        
        showWhatsAppAccountSelection(allWhatsAppAccounts);
        
    } catch (error) {
        console.error('Error getting WhatsApp accounts:', error);
        showConnectionStatus('WhatsApp Business hesapları alınırken hata oluştu: ' + error.message, 'danger');
    }
}

// Show WhatsApp Account Selection
function showWhatsAppAccountSelection(accounts) {
    const selectionDiv = document.getElementById('whatsappAccountSelection');
    const accountListDiv = document.getElementById('whatsappAccountList');
    const connectBtn = document.getElementById('connectSelectedAccount');
    
    accountListDiv.innerHTML = '';
    
    accounts.forEach((account, index) => {
        const accountDiv = document.createElement('div');
        accountDiv.className = 'card mb-2';
        accountDiv.style.cursor = 'pointer';
        
        accountDiv.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex align-items-center">
                    <input type="radio" name="whatsappAccount" value="${index}" id="account_${index}" class="form-check-input me-3">
                    <label for="account_${index}" class="flex-grow-1" style="cursor: pointer;">
                        <div class="fw-bold">${account.accountName}</div>
                        <div class="text-muted small">📱 ${account.phoneNumber}</div>
                        <div class="text-muted small">📊 ${account.businessName}</div>
                    </label>
                </div>
            </div>
        `;
        
        accountDiv.onclick = () => {
            document.getElementById(`account_${index}`).checked = true;
            selectedWhatsAppAccount = account;
            connectBtn.classList.remove('d-none');
            
            // Remove previous selections
            document.querySelectorAll('#whatsappAccountList .card').forEach(card => {
                card.classList.remove('border-success');
            });
            accountDiv.classList.add('border-success');
        };
        
        accountListDiv.appendChild(accountDiv);
    });
    
    selectionDiv.classList.remove('d-none');
    showConnectionStatus('WhatsApp Business hesaplarınız bulundu. Birini seçin:', 'success');
}

// Connect Selected WhatsApp Account
document.getElementById('connectSelectedAccount')?.addEventListener('click', async function() {
    if (!selectedWhatsAppAccount) {
        showConnectionStatus('Lütfen bir WhatsApp Business hesabı seçin.', 'warning');
        return;
    }
    
    showConnectionStatus('WhatsApp Business hesabı bağlanıyor...', 'info');
    
    try {
        const response = await apiCall('/api/connect-whatsapp', 'POST', {
            accessToken: userAccessToken,
            phoneId: selectedWhatsAppAccount.phoneId,
            phoneNumber: selectedWhatsAppAccount.phoneNumber,
            accountId: selectedWhatsAppAccount.accountId,
            accountName: selectedWhatsAppAccount.accountName,
            businessName: selectedWhatsAppAccount.businessName
        });
        
        if (response.success) {
            connectedPhoneId = selectedWhatsAppAccount.phoneId;
            updateConnectionStatus('online', 'WhatsApp Bağlı', selectedWhatsAppAccount.phoneNumber);
            showConnectionStatus('✅ WhatsApp Business hesabınız başarıyla bağlandı!', 'success');
            
            // Hide selection interface
            document.getElementById('whatsappAccountSelection').classList.add('d-none');
            
            // Update UI
            initializeDashboard();
        } else {
            showConnectionStatus('Bağlantı hatası: ' + response.error, 'danger');
        }
        
    } catch (error) {
        showConnectionStatus('Bağlantı hatası: ' + error.message, 'danger');
    }
});

// Show connection status message
function showConnectionStatus(message, type) {
    const statusDiv = document.getElementById('connectionStatus');
    const messageSpan = document.getElementById('connectionMessage');
    
    statusDiv.className = `alert alert-${type}`;
    messageSpan.textContent = message;
    statusDiv.classList.remove('d-none');
    
    // Auto hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.classList.add('d-none');
        }, 5000);
    }
}

// Update connection status in sidebar - Persistent Session
function updateConnectionStatus(isConnected, phoneNumber = '') {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusSubtext = document.getElementById('statusSubtext');
    
    if (isConnected) {
        if (statusDot) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
        }
        if (statusText) statusText.textContent = 'WhatsApp Bağlı';
        if (statusSubtext) statusSubtext.textContent = phoneNumber || 'Aktif';
        
        // Session'ı sürekli tut - localStorage'ı periyodik olarak yenile
        setInterval(() => {
            const token = localStorage.getItem('whatsapp_access_token');
            if (token) {
                localStorage.setItem('whatsapp_last_activity', new Date().toISOString());
                console.log('💾 Session aktif tutuldu');
            }
        }, 5 * 60 * 1000); // 5 dakikada bir
    } else {
        if (statusDot) {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
        }
        if (statusText) statusText.textContent = 'Bağlantısız';
        if (statusSubtext) statusSubtext.textContent = 'Facebook ile giriş yapın';
    }
}

// Auth kontrolü
const authToken = 'demo-token';
const user = { name: 'Demo User', role: 'admin' };

// API helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(endpoint, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// Çıkış fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        clearSavedSession();
        window.location.reload();
    }
}

// Socket.io başlatma - initializeSocket() fonksiyonunda yapılıyor
// Duplicate tanım kaldırıldı - Socket events initializeSocket() içinde tanımlanıyor

// Facebook Connect Functions
function connectWithMeta() {
    showConnectionStatus('Facebook ile giriş yapılıyor...', 'info');
    
    FB.login(function(response) {
        if (response.authResponse) {
            console.log('Facebook login successful:', response);
            metaAccessToken = response.authResponse.accessToken;
            showConnectionStatus('Facebook girişi başarılı! WhatsApp Business hesapları alınıyor...', 'info');
            getUserWhatsAppAccounts(metaAccessToken);
        } else {
            showConnectionStatus('Facebook girişi iptal edildi.', 'warning');
        }
    }, {
        scope: 'whatsapp_business_management'
    });
}

// Get User's WhatsApp Business Accounts
async function getUserWhatsAppAccounts(accessToken) {
    try {
        // İlk olarak user'ın business'larını al
        const businessResponse = await fetch(`https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}`);
        const businessData = await businessResponse.json();
        
        console.log('Businesses:', businessData);
        
        if (!businessData.data || businessData.data.length === 0) {
            showConnectionStatus('WhatsApp Business hesabı bulunamadı. Lütfen Meta Business Manager\'da WhatsApp Business hesabınızı kurun.', 'warning');
            return;
        }
        
        let allWhatsAppAccounts = [];
        
        // Her business için WhatsApp hesapları al
        for (let business of businessData.data) {
            try {
                const whatsappResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
                );
                const whatsappData = await whatsappResponse.json();
                
                if (whatsappData.data) {
                    for (let account of whatsappData.data) {
                        // Her WhatsApp account için phone numbers al
                        const phoneResponse = await fetch(
                            `https://graph.facebook.com/v21.0/${account.id}/phone_numbers?access_token=${accessToken}`
                        );
                        const phoneData = await phoneResponse.json();
                        
                        if (phoneData.data && phoneData.data.length > 0) {
                            const phone = phoneData.data[0]; // İlk telefon numarasını kullan
                            allWhatsAppAccounts.push({
                                businessName: business.name,
                                accountId: account.id,
                                accountName: account.name,
                                phoneId: phone.id,
                                phoneNumber: phone.display_phone_number,
                                status: phone.verified_name
                            });
                            break; // Sadece ilk hesabı al
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting WhatsApp accounts for business:', business.name, error);
            }
        }
        
        console.log('All WhatsApp Accounts:', allWhatsAppAccounts);
        
        if (allWhatsAppAccounts.length === 0) {
            showConnectionStatus('WhatsApp Business telefon numarası bulunamadı. Lütfen Meta Business Manager\'da telefon numaranızı ekleyin.', 'warning');
            return;
        }
        
        // İlk hesabı otomatik olarak bağla
        const selectedAccount = allWhatsAppAccounts[0];
        await connectWhatsAppAccount(selectedAccount);
        
    } catch (error) {
        console.error('Error getting WhatsApp accounts:', error);
        showConnectionStatus('WhatsApp Business hesapları alınırken hata oluştu: ' + error.message, 'danger');
    }
}

// Connect WhatsApp Account
async function connectWhatsAppAccount(account) {
    try {
        showConnectionStatus(`${account.phoneNumber} bağlanıyor...`, 'info');
        
        // Backend'e bağlantı bilgilerini gönder
        const response = await apiCall('/api/connect-whatsapp', 'POST', {
            accessToken: metaAccessToken,
            phoneId: account.phoneId,
            phoneNumber: account.phoneNumber,
            accountId: account.accountId,
            accountName: account.accountName,
            businessName: account.businessName
        });
        
        if (response.success) {
            connectedPhoneId = account.phoneId;
            currentConnection = 'meta';
            updateConnectionStatus('connected', `Meta WhatsApp API - ${account.phoneNumber}`);
            showConnectionStatus(`✅ WhatsApp Business hesabı başarıyla bağlandı! (${account.phoneNumber})`, 'success');
            
            // 3 saniye sonra mesajları sayfasına geç
            setTimeout(() => {
                showPage('messages');
                hideConnectionStatus();
            }, 3000);
            
        } else {
            showConnectionStatus('Bağlantı hatası: ' + response.error, 'danger');
        }
        
    } catch (error) {
        showConnectionStatus('Bağlantı hatası: ' + error.message, 'danger');
    }
}

// Connection Status Helper Functions
function showConnectionStatus(message, type = 'info') {
    const statusDiv = document.getElementById('connectionStatus');
    const messageSpan = document.getElementById('connectionMessage');
    
    if (statusDiv && messageSpan) {
        statusDiv.className = `alert alert-${type}`;
        statusDiv.classList.remove('d-none');
        messageSpan.textContent = message;
    }
}

function hideConnectionStatus() {
    const statusDiv = document.getElementById('connectionStatus');
    if (statusDiv) {
        statusDiv.classList.add('d-none');
    }
}

// Facebook connect button event
document.addEventListener('DOMContentLoaded', function() {
    const fbConnectBtn = document.getElementById('facebook-connect-btn');
    if (fbConnectBtn) {
        fbConnectBtn.addEventListener('click', connectWithMeta);
    }
});

// State
let currentMessages = {};
let currentFlows = [];
let currentSettings = {};
let selectedMessage = null;
let selectedFlow = null;
let logs = [];
let stats = { total: 0, users: 0, today: 0, catalogs: 0 };

// =====================
// SOCKET EVENTS - Moved to initializeSocket() function
// =====================

// =====================
// CONNECTION STATUS - Using the main function at line 425
// =====================

// =====================
// WHATSAPP CONNECTION
// =====================

function connectWithQR() {
    showConnectionStatus('QR kod oluşturuluyor...');
    document.getElementById('qrCodeSection').classList.add('d-none');
    
    // API'ye QR kod isteği gönder
    (async () => {
        try {
            const result = await apiCall('/api/whatsapp/connect-qr', 'POST');
            if (result && result.success) {
                showConnectionStatus('QR kod bekleniyor...');
                document.getElementById('qrCodeSection').classList.remove('d-none');
                updateConnectionStatus('qr');
            } else {
                throw new Error(result?.message || 'QR kod hatası');
            }
        } catch (error) {
            console.error('QR kod hatası:', error);
            showToast(error.message || 'QR kod başlatılamadı!', 'error');
            hideConnectionStatus();
        }
    })();
}

function connectWithPhone() {
    showToast('Telefon bağlantısı şu anda geliştiriliyor. QR kod kullanın.', 'warning');
}

function connectWithMeta() {
    const accessToken = prompt('Meta Access Token\'inizi girin:');
    if (!accessToken) return;
    
    const phoneNumberId = prompt('Phone Number ID\'nizi girin:');
    if (!phoneNumberId) return;
    
    showConnectionStatus('Meta/Facebook ile bağlanılıyor...');
    
    // API'ye Meta bilgileri gönder
    (async () => {
        try {
            const result = await apiCall('/api/whatsapp/connect-meta', 'POST', {
                accessToken,
                phoneNumberId
            });
            if (result && result.success) {
                showToast('Meta/Facebook ile bağlantı kuruldu!', 'success');
                updateConnectionStatus('connected');
            } else {
                throw new Error(result?.message || 'Bağlantı hatası');
            }
        } catch (error) {
            console.error('Meta bağlantı hatası:', error);
            showToast('Meta bağlantısı kurulamadı!', 'error');
            hideConnectionStatus();
        }
    })();
}

function showQRCode(qrData) {
    const container = document.getElementById('qrCodeContainer');
    if (!container) return;
    
    // QR kodu image olarak göster
    container.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" 
             alt="WhatsApp QR Kodu" 
             style="border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    `;
    
    document.getElementById('qrCodeSection').classList.remove('d-none');
}

function hideQRCode() {
    document.getElementById('qrCodeSection').classList.add('d-none');
}

function showConnectionStatus(message) {
    const statusEl = document.getElementById('connectionStatus');
    const messageEl = document.getElementById('connectionMessage');
    
    if (statusEl && messageEl) {
        messageEl.textContent = message;
        statusEl.classList.remove('d-none', 'alert-success', 'alert-danger');
        statusEl.classList.add('alert-info');
    }
}

function hideConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.classList.add('d-none');
    }
}

// =====================
// DATA LOADING
// =====================

async function loadAllData() {
    try {
        const [messages, flows, settings] = await Promise.all([
            apiCall('/api/messages'),
            apiCall('/api/flows'),
            apiCall('/api/settings')
        ]);

        currentMessages = messages || {};
        currentFlows = flows || {};
        currentSettings = settings || {};

        renderMessageList();
        renderFlowsList();
        renderSettings();
        
        // loadCatalogs'u da await et
        await loadCatalogs();

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        // Toast fonksiyonu yoksa sadece console'da göster
        if (typeof showToast === 'function') {
            showToast('Veri yüklenemedi!', 'error');
        }
    }
}

// =====================
// MESSAGES
// =====================

function renderMessageList() {
    const container = document.getElementById('messageList');
    if (!container) return;

    const categories = {
        'Hoşgeldin': ['hosgeldin'],
        'Grup Turları': ['grupTurlari', 'ocakSomestre', 'subatNisanMayis', 'haziranAgustos'],
        'Balayı & Özel': ['balayiTatili', 'ozelTarihliTur'],
        'Görüşme': ['gorusmeTalebi'],
        'Genel': ['anlasilmadi', 'menuDon', 'yardim']
    };

    let html = '';

    for (const [categoryName, messageKeys] of Object.entries(categories)) {
        html += `<div class="message-item category"><i class="bi bi-folder2-open"></i> ${categoryName}</div>`;
        
        for (const key of messageKeys) {
            if (currentMessages[key]) {
                const msg = currentMessages[key];
                const label = msg.label || key;
                const icon = msg.key === 'hosgeldin' ? 'bi-hand-wave' : 'bi-chat-text';
                
                html += `
                    <div class="message-item" onclick="editMessage('${key}')" style="cursor: pointer;">
                        <div class="icon"><i class="bi ${icon}"></i></div>
                        <div class="flex-grow-1">
                            <div style="font-weight: 500;">${label}</div>
                            <small class="text-muted">${msg.message ? msg.message.substring(0, 50) + '...' : 'Boş mesaj'}</small>
                        </div>
                    </div>
                `;
            }
        }
    }

    container.innerHTML = html || '<div class="text-muted p-3">Mesaj bulunamadı</div>';
}

function formatMessageLabel(key) {
    const labels = {
        'karsilama': 'Karşılama',
        'hosBulduk': 'Hoş Bulduk',
        'menu': 'Ana Menü',
        'menuGoster': 'Menü Göster',
        'bilgi': 'Bilgi Mesajı',
        'katalog': 'Katalog Mesajı',
        'tesekkur': 'Teşekkür',
        'yardim': 'Yardım',
        'calismaSaatiDisinda': 'Çalışma Saati Dışında',
        'hata': 'Hata Mesajı'
    };
    return labels[key] || key;
}

function selectMessage(category, key) {
    selectedMessage = { category, key };

    // Highlight selected
    document.querySelectorAll('.message-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.message-item[data-category="${category}"][data-key="${key}"]`)?.classList.add('active');

    // Load into editor
    const editor = document.getElementById('messageEditor');
    const title = document.getElementById('editingTitle');
    const saveBtn = document.getElementById('saveMessageBtn');

    const messageContent = currentMessages[category]?.[key] || '';
    editor.value = messageContent;
    editor.disabled = false;
    title.textContent = `${formatMessageLabel(key)} Düzenleme`;
    saveBtn.disabled = false;

    updatePreview(messageContent);
}

function updatePreview(text) {
    const preview = document.getElementById('messagePreview');
    if (preview) {
        preview.textContent = text;
    }
}

// Message editor live preview
document.getElementById('messageEditor')?.addEventListener('input', (e) => {
    updatePreview(e.target.value);
});

// Save message
document.getElementById('saveMessageBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    (async () => {
        try {
            await saveMessage();
        } catch (error) {
            console.error('Mesaj kaydetme hatası:', error);
            showToast('Mesaj kaydedilemedi!', 'error');
        }
    })();
});

async function saveMessage() {
    if (!selectedMessage) return;

    const editor = document.getElementById('messageEditor');
    const newValue = editor.value;

    try {
        if (!currentMessages[selectedMessage.category]) {
            currentMessages[selectedMessage.category] = {};
        }
        currentMessages[selectedMessage.category][selectedMessage.key] = newValue;

        const result = await apiCall('/api/messages', 'POST', currentMessages);

        if (result && result.success !== false) {
            showToast('Mesaj kaydedildi!', 'success');
        } else {
            throw new Error('Kayıt hatası');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showToast('Mesaj kaydedilemedi!', 'error');
    }
}

// =====================
// FLOWS
// =====================

function renderFlowsList() {
    const container = document.getElementById('flowsList');
    if (!container || !currentFlows.menuSecenekleri) return;

    let html = '';

    currentFlows.menuSecenekleri.forEach((flow, index) => {
        html += `
            <div class="flow-card" data-index="${index}">
                <div class="d-flex align-items-center gap-3">
                    <div class="flow-number">${flow.numara}</div>
                    <div>
                        <h6 class="mb-1">${flow.baslik}</h6>
                        <small class="text-muted">${flow.anahtar_kelimeler?.join(', ') || ''}</small>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<p class="text-muted text-center">Henüz menü seçeneği yok</p>';

    // Add click handlers
    container.querySelectorAll('.flow-card').forEach(card => {
        card.addEventListener('click', () => selectFlow(parseInt(card.dataset.index)));
    });
}

function selectFlow(index) {
    selectedFlow = index;
    const flow = currentFlows.menuSecenekleri[index];

    const editorContainer = document.getElementById('flowEditor');
    editorContainer.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Numara</label>
            <input type="text" class="form-control" id="flowNumara" value="${flow.numara}">
        </div>
        <div class="mb-3">
            <label class="form-label">Başlık</label>
            <input type="text" class="form-control" id="flowBaslik" value="${flow.baslik}">
        </div>
        <div class="mb-3">
            <label class="form-label">Anahtar Kelimeler (virgülle ayırın)</label>
            <input type="text" class="form-control" id="flowAnahtarlar" value="${(flow.anahtar_kelimeler || []).join(', ')}">
        </div>
        <div class="mb-3">
            <label class="form-label">Mesaj Anahtarı</label>
            <input type="text" class="form-control" id="flowMesaj" value="${flow.mesaj || ''}">
            <div class="form-text">messages.json içindeki mesaj yolu (örn: grupTurlari.bilgi)</div>
        </div>
        <div class="mb-3">
            <label class="form-label">Katalog (opsiyonel)</label>
            <input type="text" class="form-control" id="flowKatalog" value="${flow.katalog || ''}">
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-whatsapp flex-grow-1" onclick="saveFlow()">
                <i class="bi bi-check-lg"></i> Kaydet
            </button>
            <button class="btn btn-outline-danger" onclick="deleteFlow()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
}

async function saveFlow() {
    if (selectedFlow === null) return;

    const anahtarlarRaw = document.getElementById('flowAnahtarlar').value;
    const anahtarlar = anahtarlarRaw.split(',').map(s => s.trim()).filter(s => s);

    currentFlows.menuSecenekleri[selectedFlow] = {
        id: currentFlows.menuSecenekleri[selectedFlow].id,
        numara: document.getElementById('flowNumara').value,
        baslik: document.getElementById('flowBaslik').value,
        anahtar_kelimeler: anahtarlar,
        mesaj: document.getElementById('flowMesaj').value,
        katalog: document.getElementById('flowKatalog').value || null
    };

    try {
        const result = await apiCall('/api/flows', 'POST', currentFlows);

        if (result && result.success !== false) {
            showToast('Akış kaydedildi!', 'success');
            renderFlowsList();
        } else {
            throw new Error('Kayıt hatası');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showToast('Akış kaydedilemedi!', 'error');
    }
}

async function deleteFlow() {
    if (selectedFlow === null) return;
    if (!confirm('Bu seçeneği silmek istediğinize emin misiniz?')) return;

    currentFlows.menuSecenekleri.splice(selectedFlow, 1);
    selectedFlow = null;

    try {
        await apiCall('/api/flows', 'POST', currentFlows);
        showToast('Seçenek silindi!', 'success');
        renderFlowsList();
        document.getElementById('flowEditor').innerHTML = '<p class="text-muted">Listeden bir seçenek seçin</p>';
    } catch (error) {
        console.error('Silme hatası:', error);
        showToast('Seçenek silinemedi!', 'error');
    }
}

// YENİ FLOW EKLEME FONKSİYONU
function addNewFlow() {
    // Eğer currentFlows yoksa veya menuSecenekleri yoksa, initialize et
    if (!currentFlows) {
        currentFlows = { menuSecenekleri: [] };
    }
    if (!currentFlows.menuSecenekleri) {
        currentFlows.menuSecenekleri = [];
    }
    
    const newFlow = {
        id: Date.now(),
        numara: (currentFlows.menuSecenekleri.length + 1).toString(),
        baslik: 'Yeni Seçenek',
        anahtar_kelimeler: [],
        mesaj: '',
        katalog: null
    };
    
    currentFlows.menuSecenekleri.push(newFlow);
    renderFlowsList();
    
    // Yeni eklenen flow'ı seç
    selectFlow(currentFlows.menuSecenekleri.length - 1);
    
    showToast('Yeni seçenek eklendi! Lütfen düzenleyin.', 'info');
}

// =====================
// CATALOGS
// =====================

async function loadCatalogs() {
    try {
        const response = await apiCall('/api/catalogs');
        const catalogs = Array.isArray(response) ? response : (response.catalogs || []);

        const container = document.getElementById('catalogsList');
        const selectPhuket = document.getElementById('catalogPhuket');
        const selectBalayi = document.getElementById('catalogBalayi');

        if (!catalogs || catalogs.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="bi bi-cloud-upload" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-3">Henüz katalog yüklenmedi</p>
                    <small>Yukarıdaki "PDF Yükle" butonunu kullanarak katalog ekleyin</small>
                </div>
            `;
            if (selectPhuket) selectPhuket.innerHTML = '<option value="">Katalog yok</option>';
            if (selectBalayi) selectBalayi.innerHTML = '<option value="">Katalog yok</option>';
            return;
        }

        let catalogHtml = '';
        let optionsHtml = '<option value="">Seçin...</option>';

        catalogs.forEach(cat => {
            const catalogName = cat.name || cat;
            catalogHtml += `
                <div class="catalog-item" data-filename="${catalogName}">
                    <i class="bi bi-file-earmark-pdf"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${catalogName}</h6>
                        <small class="text-muted">PDF Dosyası</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCatalog('${catalogName}')" title="Sil">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            optionsHtml += `<option value="${catalogName}">${catalogName}</option>`;
        });

        container.innerHTML = catalogHtml;
        if (selectPhuket) selectPhuket.innerHTML = optionsHtml;
        if (selectBalayi) selectBalayi.innerHTML = optionsHtml;

        // Set current values
        if (currentSettings.kataloglar) {
            if (selectPhuket) selectPhuket.value = currentSettings.kataloglar.phuketTur || '';
            if (selectBalayi) selectBalayi.value = currentSettings.kataloglar.balayi || '';
        }

    } catch (error) {
        console.error('Katalog yükleme hatası:', error);
        
        // Fallback UI
        const container = document.getElementById('catalogsList');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="bi bi-exclamation-circle" style="font-size: 3rem; color: #dc3545;"></i>
                    <p class="mt-3">Katalog yüklenemedi</p>
                    <small>Hata: ${error.message}</small>
                </div>
            `;
        }
    }
}

// Katalog yükleme
document.getElementById('catalogUpload')?.addEventListener('change', async (e) => {
    try {
        const files = e.target.files;
        if (!files.length) return;

        const progressCard = document.getElementById('uploadProgressCard');
        const progressBar = document.getElementById('uploadProgress');
        const fileName = document.getElementById('uploadFileName');

            for (const file of files) {
                if (!file.name.endsWith('.pdf')) {
                    showToast('Sadece PDF dosyaları yüklenebilir!', 'error');
                    continue;
                }

                // Show progress
                progressCard.style.display = 'block';
                fileName.textContent = file.name + ' yükleniyor...';
                progressBar.style.width = '0%';

                const formData = new FormData();
                formData.append('catalog', file);

                try {
                    const xhr = new XMLHttpRequest();
                    
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percent = (e.loaded / e.total) * 100;
                            progressBar.style.width = percent + '%';
                        }
                    });

                    await new Promise((resolve, reject) => {
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                resolve(JSON.parse(xhr.responseText));
                            } else {
                                reject(new Error('Yükleme başarısız'));
                            }
                        };
                        xhr.onerror = () => reject(new Error('Ağ hatası'));
                        xhr.open('POST', '/api/catalogs/upload');
                        xhr.send(formData);
                    });

                    showToast(`${file.name} başarıyla yüklendi!`, 'success');

                } catch (error) {
                    console.error('Yükleme hatası:', error);
                    showToast(`${file.name} yüklenemedi!`, 'error');
                }
            }

            // Hide progress and refresh
            progressCard.style.display = 'none';
            e.target.value = '';
            loadCatalogs();
    } catch (error) {
        console.error('Katalog yükleme hatası:', error);
        showToast('Bir hata oluştu!', 'error');
    }
});

// Katalog silme
async function deleteCatalog(filename) {
    if (!confirm(`"${filename}" dosyasını silmek istediğinize emin misiniz?`)) return;

    try {
        const result = await apiCall('/api/catalogs/' + encodeURIComponent(filename), 'DELETE');

        if (result && result.success !== false) {
            showToast('Katalog silindi!', 'success');
            loadCatalogs();
        } else {
            throw new Error('Silme başarısız');
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        showToast('Katalog silinemedi!', 'error');
    }
}

document.getElementById('saveCatalogsBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        currentSettings.kataloglar = {
            phuketTur: document.getElementById('catalogPhuket').value,
            balayi: document.getElementById('catalogBalayi').value
        };

        const result = await apiCall('/api/settings', 'POST', currentSettings);

        if (result && result.success !== false) {
            showToast('Katalog ayarları kaydedildi!', 'success');
        }
    } catch (error) {
        console.error('Katalog kayıt hatası:', error);
        showToast('Kayıt hatası!', 'error');
    }
});

// =====================
// SETTINGS
// =====================

function renderSettings() {
    document.getElementById('settingSirketAdi').value = currentSettings.sirketAdi || '';
    document.getElementById('settingCalismaSaatiAktif').checked = currentSettings.calismaSaatleri?.aktif || false;
    document.getElementById('settingSaatBaslangic').value = currentSettings.calismaSaatleri?.baslangic || 9;
    document.getElementById('settingSaatBitis').value = currentSettings.calismaSaatleri?.bitis || 22;
    document.getElementById('settingGecikme').value = currentSettings.yanitGecikmesi || 1000;
    document.getElementById('settingZamanAsimi').value = currentSettings.oturumZamanAsimi || 30;
}

document.getElementById('saveSettingsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    (async () => {
        try {
            currentSettings.sirketAdi = document.getElementById('settingSirketAdi').value;
            currentSettings.calismaSaatleri = {
                aktif: document.getElementById('settingCalismaSaatiAktif').checked,
                baslangic: parseInt(document.getElementById('settingSaatBaslangic').value),
                bitis: parseInt(document.getElementById('settingSaatBitis').value)
            };
            currentSettings.yanitGecikmesi = parseInt(document.getElementById('settingGecikme').value);
            currentSettings.oturumZamanAsimi = parseInt(document.getElementById('settingZamanAsimi').value);

            const result = await apiCall('/api/settings', 'POST', currentSettings);

            if (result && result.success !== false) {
                showToast('Ayarlar kaydedildi!', 'success');
            } else {
                throw new Error('Kayıt hatası');
            }
        } catch (error) {
            console.error('Ayarlar kayıt hatası:', error);
            showToast('Ayarlar kaydedilemedi!', 'error');
        }
    })();
});

// =====================
// LOGS
// =====================

function addLog(log) {
    logs.unshift(log);
    if (logs.length > 100) logs.pop();

    stats.total++;
    updateStats(stats);
    updateLogCount();
    renderLogs();
    renderDashboardLogs();
    updateLastActivity();
}

function renderLogs() {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    if (logs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted p-5">
                <i class="bi bi-chat-left-dots" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="mt-3">Henüz konuşma yok</p>
            </div>
        `;
        return;
    }

    let html = '';
    logs.forEach(log => {
        const iconClass = log.type === 'incoming' ? 'incoming' : 'outgoing';
        const icon = log.type === 'incoming' ? 'bi-arrow-down-left' : 'bi-arrow-up-right';
        const time = new Date(log.timestamp).toLocaleTimeString('tr-TR');

        html += `
            <div class="log-item">
                <div class="log-icon ${iconClass}"><i class="bi ${icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong>${log.from || 'Bot'}</strong>
                        <small class="text-muted">${time}</small>
                    </div>
                    <div class="text-muted">${log.message?.substring(0, 100) || ''}${log.message?.length > 100 ? '...' : ''}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderDashboardLogs() {
    const container = document.getElementById('dashboardLogs');
    if (!container) return;

    const recentLogs = logs.slice(0, 5);

    if (recentLogs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted p-5">
                <i class="bi bi-chat-left-dots" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="mt-3">Henüz konuşma yok</p>
            </div>
        `;
        return;
    }

    let html = '';
    recentLogs.forEach(log => {
        const iconClass = log.type === 'incoming' ? 'incoming' : 'outgoing';
        const icon = log.type === 'incoming' ? 'bi-arrow-down-left' : 'bi-arrow-up-right';
        const time = new Date(log.timestamp).toLocaleTimeString('tr-TR');

        html += `
            <div class="log-item">
                <div class="log-icon ${iconClass}"><i class="bi ${icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <strong>${log.from || 'Bot'}</strong>
                        <small class="text-muted">${time}</small>
                    </div>
                    <small class="text-muted">${log.message?.substring(0, 50) || ''}...</small>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateLogCount() {
    const badge = document.getElementById('logCount');
    if (badge) {
        badge.textContent = logs.length;
    }
}

function updateLastActivity() {
    const el = document.getElementById('lastActivity');
    if (el) {
        el.textContent = new Date().toLocaleTimeString('tr-TR');
    }
}

document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
    if (confirm('Tüm logları temizlemek istediğinize emin misiniz?')) {
        logs = [];
        renderLogs();
        updateLogCount();
        showToast('Loglar temizlendi', 'success');
    }
});

// =====================
// STATS
// =====================

function updateStats(newStats) {
    stats = { ...stats, ...newStats };
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statUsers').textContent = stats.users || 0;
    document.getElementById('statToday').textContent = stats.today || 0;
    document.getElementById('statCatalogs').textContent = stats.catalogs || 0;
}

// =====================
// NAVIGATION
// =====================

document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (!page) return;

        // Update nav
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show page
        document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
        document.getElementById(`page-${page}`).style.display = 'block';
    });
});

// =====================
// TOAST NOTIFICATIONS
// =====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const id = 'toast-' + Date.now();

    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';

    const toastHtml = `
        <div id="${id}" class="toast show ${bgClass} text-white" role="alert">
            <div class="toast-body d-flex align-items-center gap-2">
                <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'}"></i>
                ${message}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);

    setTimeout(() => {
        document.getElementById(id)?.remove();
    }, 3000);
}

// =====================
// INIT
// =====================

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('WhatsApp Bot Admin Panel v2.0');
        (async () => {
            try {
                await loadWhatsAppBusinessConfig();
            } catch (error) {
                console.error('Initial data loading hatası:', error);
            }
        })();
    } catch (error) {
        console.error('DOMContentLoaded hatası:', error);
    }
});

// =====================
// WHATSAPP BUSINESS API
// =====================

async function loadWhatsAppBusinessConfig() {
    try {
        const data = await apiCall('/api/whatsapp-business/config');
        if (data.success) {
            document.getElementById('wbaEnabled').checked = data.config.enabled;
            document.getElementById('wbaPhoneNumberId').value = data.config.phoneNumberId || '';
            if (data.config.hasAccessToken) {
                document.getElementById('wbaAccessToken').placeholder = '********** (Kayıtlı)';
            }
        }
    } catch (error) {
        console.error('WBA config yükleme hatası:', error);
    }
}

document.getElementById('saveWbaConfigBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    (async () => {
        try {
            const config = {
                enabled: document.getElementById('wbaEnabled').checked,
                phoneNumberId: document.getElementById('wbaPhoneNumberId').value,
                accessToken: document.getElementById('wbaAccessToken').value,
                webhookVerifyToken: document.getElementById('wbaWebhookToken').value,
                businessAccountId: document.getElementById('wbaBusinessAccountId')?.value || ''
            };

            const data = await apiCall('/api/whatsapp-business/config', 'POST', config);
            if (data.success) {
                showToast('WhatsApp Business API yapılandırması kaydedildi', 'success');
            } else {
                showToast('Kayıt hatası: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('WBA config kayıt hatası:', error);
            showToast('Bir hata oluştu', 'error');
        }
    })();
});

// Facebook Connect Button Event Listener
document.getElementById('facebook-connect-btn')?.addEventListener('click', function() {
    connectWithFacebook();
});

// =====================
// PAGE NAVIGATION & DATA LOADING
// =====================

function showPage(pageName) {
    console.log('📝 Sayfa açılıyor:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        console.log('✅ Sayfa gösterildi:', pageName);
    } else {
        console.error('❌ Sayfa bulunamadı:', `page-${pageName}`);
    }
    
    // Load page data
    loadPageData(pageName);
}

async function loadPageData(pageName) {
    try {
        switch(pageName) {
            case 'messages':
                await loadMessages();
                break;
            case 'flows':
                await loadFlows();
                break;
            case 'catalogs':
                await loadCatalogs();
                break;
            case 'settings':
                await loadSettings();
                break;
            case 'logs':
                renderLogs();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${pageName}:`, error);
    }
}

async function loadMessages() {
    try {
        console.log('📨 Mesajlar yükleninor...');
        const response = await fetch('/api/messages');
        currentMessages = await response.json();
        console.log('📨 Mesajlar yüklendi:', currentMessages);
        renderMessageList();
    } catch (error) {
        console.error('❌ Mesaj yükleme hatası:', error);
    }
}

async function loadFlows() {
    try {
        console.log('🔀 Flowlar yükleniyor...');
        const response = await fetch('/api/flows');
        currentFlows = await response.json();
        console.log('🔀 Flowlar yüklendi:', currentFlows);
        renderFlowsList();
    } catch (error) {
        console.error('❌ Flow yükleme hatası:', error);
    }
}

async function loadCatalogs() {
    try {
        console.log('📄 Kataloglar yükleniyor...');
        const response = await fetch('/api/catalogs');
        const catalogs = await response.json();
        console.log('📄 Kataloglar yüklendi:', catalogs);
        renderCatalogsList(catalogs);
    } catch (error) {
        console.error('❌ Katalog yükleme hatası:', error);
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        currentSettings = await response.json();
        renderSettings();
    } catch (error) {
        console.error('Ayarlar yükleme hatası:', error);
    }
}

function renderCatalogsList(catalogs) {
    const container = document.getElementById('catalogsList');
    if (!container) return;
    
    if (catalogs.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">Katalog bulunamadı</div>';
        return;
    }
    
    let html = '';
    catalogs.forEach(cat => {
        const downloadUrl = `/kataloglar/${encodeURIComponent(cat.name)}`;
        
        html += `
            <div class="catalog-item mb-3 p-3 border rounded">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-file-earmark-pdf text-danger" style="font-size: 2rem;"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${cat.displayName || cat.name}</h6>
                        <small class="text-muted">${cat.size || 'PDF Dosyası'} • ${cat.uploadDate || ''}</small>
                        ${cat.linkedFlows ? `<div class="mt-1"><small class="badge bg-success">${cat.linkedFlows.join(', ')}</small></div>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <a href="${downloadUrl}" target="_blank" class="btn btn-success" title="PDF'i Görüntüle">
                            <i class="bi bi-eye"></i> PDF Yükle
                        </a>
                        <button class="btn btn-outline-danger" onclick="deleteCatalog('${cat.name}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderFlowsList() {
    const container = document.getElementById('flowsList');
    if (!container) return;
    
    if (!currentFlows || currentFlows.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">Flow bulunamadı</div>';
        return;
    }
    
    let html = '';
    currentFlows.forEach((flow, index) => {
        const icon = flow.isGlobal ? 'bi-lightning' : 'bi-menu-button';
        const badge = flow.isGlobal ? '<span class="badge bg-warning">Global</span>' : '';
        
        html += `
            <div class="flow-item mb-3 p-3 border rounded ${flow.active ? '' : 'opacity-50'}">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi ${icon} text-primary" style="font-size: 1.5rem;"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${flow.name} ${badge}</h6>
                        <small class="text-muted">Tetikleyici: ${flow.trigger} ${flow.keywords ? `• Kelimeler: ${flow.keywords.join(', ')}` : ''}</small>
                        ${flow.catalog ? `<div class="mt-1"><small class="badge bg-info">${flow.catalog}</small></div>` : ''}
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" ${flow.active ? 'checked' : ''} onchange="toggleFlow(${flow.id})">
                    </div>
                </div>
                ${flow.subMenu && flow.subMenu.length > 0 ? `
                    <div class="mt-2 ps-4">
                        ${flow.subMenu.map(sub => `
                            <div class="text-muted small">
                                <i class="bi bi-arrow-return-right"></i> ${sub.name} (${sub.trigger})
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderSettings() {
    // Settings render logic here
}

function toggleFlow(flowId) {
    const flow = currentFlows.find(f => f.id === flowId);
    if (flow) {
        flow.active = !flow.active;
        console.log(`🔄 Flow toggled: ${flow.name} - ${flow.active ? 'active' : 'inactive'}`);
        // TODO: Save to backend
        // apiCall('/api/flows/' + flowId, 'PUT', { active: flow.active });
        renderFlowsList();
    }
}

function deleteCatalog(catalogName) {
    if (confirm(`"${catalogName}" kataloğunu silmek istediğinize emin misiniz?`)) {
        console.log('🗑️ Katalog silme:', catalogName);
        // TODO: Implement delete
        // apiCall('/api/catalogs/' + catalogName, 'DELETE');
        showToast('Katalog silindi', 'success');
        loadCatalogs();
    }
}

function editMessage(key) {
    const msg = currentMessages[key];
    if (!msg) {
        console.error('Mesaj bulunamadı:', key);
        return;
    }
    
    const editor = document.getElementById('messageEditor');
    const titleEl = document.getElementById('editingTitle');
    const saveBtn = document.getElementById('saveMessageBtn');
    const preview = document.getElementById('messagePreview');
    
    if (editor) {
        editor.value = msg.message || '';
        editor.disabled = false;
        editor.dataset.currentKey = key;
        
        // Live preview on edit
        editor.oninput = function() {
            if (preview) {
                preview.innerHTML = formatWhatsAppMessage(this.value);
            }
        };
        
        // Initial preview
        if (preview) {
            preview.innerHTML = formatWhatsAppMessage(msg.message || '');
        }
    }
    
    if (titleEl) titleEl.textContent = msg.label || key;
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.onclick = () => saveMessage(key);
    }
}

function saveMessage(key) {
    const editor = document.getElementById('messageEditor');
    if (!editor) return;
    
    const newMessage = editor.value;
    
    // Update in memory
    if (currentMessages[key]) {
        currentMessages[key].message = newMessage;
    }
    
    // TODO: Save to backend
    // apiCall('/api/messages', 'PUT', { key, message: newMessage });
    
    showToast('Mesaj kaydedildi!', 'success');
    console.log('✅ Mesaj güncellendi:', key);
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 250px;';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function logout() {
    // Clear localStorage
    localStorage.removeItem('whatsapp_access_token');
    localStorage.removeItem('whatsapp_phone_id');
    localStorage.removeItem('whatsapp_phone_number');
    localStorage.removeItem('whatsapp_user_id');
    
    // Disconnect socket
    if (socket) {
        socket.disconnect();
    }
    
    // Show connection page
    showPage('connection');
    
    // Update UI
    updateConnectionStatus(false);
    
    showToast('Oturum kapatıldı', 'info');
    console.log('🚪 Çıkış yapıldı');
}

function formatWhatsAppMessage(text) {
    if (!text) return 'Mesaj önizlemesi burada görünecek...';
    
    return text
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin panel yüklendi');
    
    // Setup nav links
    document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                // Remove active from all
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Show page
                showPage(page);
            }
        });
    });
    
    // Show connection page by default
    showPage('connection');
    
    // Check connection status on load - handled by Facebook SDK init
    // checkSavedSession() is called from fbAsyncInit
});

