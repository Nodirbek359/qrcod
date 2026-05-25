// =========================================================================
// 1. UNICON-SOFT ORIGINAL JAVA ALGORITMINING BRAUZERDAGI 100% MATEMATIK NUSXASI
// Ushbu qism qisqartirilmagan va to'liq saqlab qolingan
// =========================================================================

if (typeof window.otplib === 'undefined') {
    console.error("DIQQAT: otplib hali yuklanmagan!");
}
// Global o'zgaruvchi
const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

// =========================================================================
// API BOG'LANISH MANTIG'I
// =========================================================================
const API_URL = "https://neotech-api.onrender.com";


// script.js
// 1. URL parametrlarni o'qib olish
const urlParams = new URLSearchParams(window.location.search);
const USER_ID = urlParams.get('userId') || window.Telegram.WebApp.initDataUnsafe?.user?.id;

// 2. Agar userId topilsa, uni loyihada ishlatamiz
if (USER_ID) {
    console.log("Foydalanuvchi ID olindi:", USER_ID);
    // Shu yerdan keyin bazadan ma'lumotlarni tortish funksiyasini chaqirasiz
    displaySecrets(); 
} else {
    console.error("Foydalanuvchi ID topilmadi!");
}

// 1. Ma'lumot yuborish (POST)
async function saveScanDataToDatabase(secret) {
    try {
        const response = await fetch(`${API_URL}/api/save-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: String(USER_ID),
                qr_secret: secret, // Serverda qr_secret deb kutilmoqda
                scanned_at: new Date().toISOString() // Vaqtni qo'shib yuboramiz
            })
        });
        const result = await response.json();
        console.log("Server javobi:", result);
        return result.success;
    } catch (error) {
        console.error("Bazaga yuborishda xato:", error);
    }
}
async function getSecretsFromDatabase(userId) {
    try {
        // SERVERDA YOZILGAN ANIQ MANZIL: /api/get-user-secrets/
        const response = await fetch(`${API_URL}/api/get-user-secrets/${userId}`);
        const result = await response.json();
        
        // Agar success bo'lsa, secrets massivini qaytaramiz
        if (result && result.success) {
            return result.secrets;
        } else {
            console.error("Server xatosi:", result.message);
            return [];
        }
    } catch (error) {
        console.error("Bazadan olishda xato:", error);
        return [];
    }
}

function startTimer(timerElementId) {
    const el = document.getElementById(timerElementId);
    if (!el) return;

    // Har soniyada vaqtni yangilash
    setInterval(() => {
        const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
        el.innerText = seconds;
    }, 1000);
}
function generateUniconOTP(secret) {
    try {
        // Skrinshotdagi obyektga moslashtirilgan chaqiruv
        // TOTP klassidan foydalanamiz
        const totp = new otplib.TOTP({
            secret: secret,
            // Standart sozlamalar (ko'p tizimlar uchun mos)
            algorithm: 'sha1',
            digits: 6,
            step: 30
        });
        
        return totp.generate(secret);
    } catch (error) {
        console.error("OTP generatsiya qilishda xatolik:", error);
        return "000 000";
    }
}

// 2. OTP yangilash funksiyasi (otplib bilan)
function updateOTP(secret, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return; // Element topilmasa, funksiyani to'xtatamiz

    try {
        // otplib yuklanganligini tekshiramiz
        if (typeof window.otplib === 'undefined') {
            throw new Error("otplib topilmadi");
        }
        
        // Secret ni tozalash (bo'sh joylarni olib tashlash)
        const cleanSecret = secret.trim().replace(/\s/g, '');
        
        // Kodni generatsiya qilish
        // 13.4.0 versiyasi uchun to'g'ridan-to'g'ri window.otplib.totp.generate() ishlatiladi
        const token = window.otplib.totp.generate(cleanSecret);
        
        // Kodni formatlash (3 ta raqam - 3 ta raqam)
        const formattedOtp = token.slice(0, 3) + " " + token.slice(3);
        el.textContent = formattedOtp;
    } catch (e) {
        console.error("OTP XATOLIGI:", e);
        el.textContent = "XATO";
    }
}

/// 3. Asosiy ekranga chiqarish funksiyasi (Yangilangan)
async function displaySecrets() {
    const listElement = document.getElementById('secrets-list');
    const btn = document.getElementById('fetchSecretsBtn');

    if (!listElement) return;

    btn.disabled = true;
    listElement.innerHTML = '<li style="text-align:center;">Yuklanmoqda...</li>';

    const secrets = await getSecretsFromDatabase(USER_ID);
    listElement.innerHTML = ''; 

    if (secrets && secrets.length > 0) {
        secrets.forEach((secret, index) => {
            const cardId = `otp-${index}`;
            const timerId = `timer-${index}`;
            
            const li = document.createElement('li');
            li.style.listStyle = 'none';
            li.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: bold; color: #333;">EDO.IJRO.UZ</span>
                        <span style="color: #666; font-size: 14px;"><span id="${timerId}">30</span> s</span>
                    </div>
                    <div id="${cardId}" style="font-size: 32px; font-weight: bold; text-align: center; color: #2481cc; letter-spacing: 5px;">
                        --- ---
                    </div>
                    <div style="font-size: 12px; color: #999; text-align: center; margin-top: 5px;">
                        Foydalanuvchi: ${USER_ID}
                    </div>
                </div>`;
            listElement.appendChild(li);

            // Ichki yangilash funksiyasi
            const updateUI = () => {
                const el = document.getElementById(cardId);
                if (el) {
                    const rawOtp = generateUniconOTP(secret); // BU YERDA CHAQIRILDI
                    const formattedOtp = rawOtp.substring(0, 3) + " " + rawOtp.substring(3, 6);
                    el.innerText = formattedOtp;
                }
            };

            // Birinchi marta darhol chaqirish
            updateUI();
            
            // Har 1 soniyada kodni tekshirib yangilash
            setInterval(updateUI, 1000);
            
            // Taymerni boshqarish
            startTimer(timerId);
        });
    } else {
        listElement.innerHTML = '<li style="text-align:center;">Kalitlar topilmadi.</li>';
    }
    btn.disabled = false;
}





//=-----------------------------------------------------

function base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let bytes = [];
    for (let i = 0; i < base32.length; i++) {
        const val = alphabet.indexOf(base32[i].toUpperCase());
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    return new Uint8Array(bytes);
}

function uniconPadding(bytes, blockSize) {
    let totalLen = bytes.length + 9;
    let numBlocks = Math.ceil(totalLen / blockSize);
    let padded = new Uint8Array(numBlocks * blockSize);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    
    let bitLen = BigInt(bytes.length * 8);
    let view = new DataView(padded.buffer);
    view.setBigUint64(padded.length - 8, bitLen, false);
    return padded;
}

function rotateRight(val, amount) {
    return (val >>> amount) | (val << (32 - amount));
}

function uniconCustomSHA256(bytes) {
    let iArrCopyOf = new Int32Array([1779033703, -1150833019, 1013904242, -1521486534, 1359893119, -1694144372, 528734635, 1541459225]);
    
    const K256 = new Int32Array([
        1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993, -1841331548, -1424204075,
        -670586216, 310598401, 607225278, 1426881987, 1925078388, -2132889090, -1680079193, -1046744716,
        -459576895, -272742522, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
        -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585, 113926993, 338241895,
        666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, -2117940946, -1838011259,
        -1564481375, -1474664885, -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
        430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
        1955562222, 2024104815, -2067236844, -1933114872, -1866530822, -1538233109, -1090935817, -965641998
    ]);

    let bArrA = uniconPadding(bytes, 64);
    let iArr = new Int32Array(64);
    let view = new DataView(bArrA.buffer);

    for (let i12 = 0; i12 < bArrA.length; i12 += 64) {
        for (let i13 = 0; i13 < 16; i13++) {
            iArr[i13] = view.getInt32(i12 + i13 * 4, false);
        }
        for (let i14 = 16; i14 < 64; i14++) {
            let i15 = iArr[i14 - 15];
            let iRotateRight = (i15 >>> 3) ^ (rotateRight(i15, 7) ^ rotateRight(i15, 18));
            let i16 = iArr[i14 - 2];
            let iRotateRightHex = (i16 >>> 10) ^ (rotateRight(i16, 17) ^ rotateRight(i16, 19));
            iArr[i14] = (iArr[i14 - 16] + iRotateRight + iArr[i14 - 7] + iRotateRightHex) | 0;
        }

        let a = iArrCopyOf[0], b = iArrCopyOf[1], c = iArrCopyOf[2], d = iArrCopyOf[3];
        let e = iArrCopyOf[4], f = iArrCopyOf[5], g = iArrCopyOf[6], h = iArrCopyOf[7];

        for (let i28 = 0; i28 < 64; i28++) {
            let s1 = (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) | 0;
            let ch = ((e & f) ^ ((~e) & g)) | 0;
            let temp1 = (h + s1 + ch + K256[i28] + iArr[i28]) | 0;

            let s0 = (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) | 0;
            let maj = (((a & b) ^ (a & c)) ^ (b & c)) | 0;
            let temp2 = (s0 + maj) | 0;

            h = g; g = f; f = e;
            e = (d + temp1) | 0;
            d = c; c = b; b = a;
            a = (temp1 + temp2) | 0;
        }

        iArrCopyOf[0] = (iArrCopyOf[0] + a) | 0;
        iArrCopyOf[1] = (iArrCopyOf[1] + b) | 0;
        iArrCopyOf[2] = (iArrCopyOf[2] + c) | 0;
        iArrCopyOf[3] = (iArrCopyOf[3] + d) | 0;
        iArrCopyOf[4] = (iArrCopyOf[4] + e) | 0;
        iArrCopyOf[5] = (iArrCopyOf[5] + f) | 0;
        iArrCopyOf[6] = (iArrCopyOf[6] + g) | 0;
        iArrCopyOf[7] = (iArrCopyOf[7] + h) | 0;
    }

    let resultBytes = new Uint8Array(32);
    let resultView = new DataView(resultBytes.buffer);
    for (let i = 0; i < 8; i++) {
        resultView.setInt32(i * 4, iArrCopyOf[i], false);
    }
    return resultBytes;
}

function generateUniconOTP(secretBase32) {
    const keyBytes = base32ToBytes(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    let counter = Math.floor(epoch / 30);

    const timeBuffer = new Uint8Array(8);
    const timeView = new DataView(timeBuffer.buffer);
    timeView.setBigUint64(0, BigInt(counter), false);

    const blockSize = 64;
    let key = keyBytes;
    if (key.length > blockSize) {
        key = uniconCustomSHA256(key);
    }
    if (key.length < blockSize) {
        let temp = new Uint8Array(blockSize);
        temp.set(key);
        key = temp;
    }

    const ipad = new Uint8Array(blockSize);
    const opad = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i++) {
        ipad[i] = key[i] ^ 0x36;
        opad[i] = key[i] ^ 0x5C;
    }

    let innerConcat = new Uint8Array(blockSize + 8);
    innerConcat.set(ipad);
    innerConcat.set(timeBuffer, blockSize);
    const innerHash = uniconCustomSHA256(innerConcat);

    let outerConcat = new Uint8Array(blockSize + 32);
    outerConcat.set(opad);
    outerConcat.set(innerHash, blockSize);
    const hmacResult = uniconCustomSHA256(outerConcat);

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const resView = new DataView(hmacResult.buffer);
    const binary = resView.getInt32(offset, false) & 0x7fffffff;

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

// =========================================================================
// 2. KAMERA, FAYL YUKLASH VA INTERFEYS MANTIQLARI
// =========================================================================

const video = document.getElementById('webcam');
const scannerView = document.getElementById('scanner-view');
const fileInput = document.getElementById('file-upload');

let activeSecret = null;
let timerInterval = null;
let isScanning = false;
let streamRef = null;

// KAMERANI OCHISH VA SKANERNI BOSHLASH
document.getElementById('fab-btn').addEventListener('click', () => {
    scannerView.style.display = 'flex';
    isScanning = true;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            streamRef = stream;
            video.srcObject = stream;
            video.play();
            requestAnimationFrame(tick);
        }).catch(err => {
            alert("Kamerani ochishda xato: " + err);
            closeScanner();
        });
});

// SKANERNI BEKOR QILISH / YOPISH
document.getElementById('btn-cancel').addEventListener('click', closeScanner);

function closeScanner() {
    isScanning = false;
    scannerView.style.display = 'none';
    if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
        streamRef = null;
    }
}

// TEZLASHTIRILGAN QR-KOD QIDIRISH (requestAnimationFrame)
function tick() {
    if (!isScanning) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        // Optimizatsiya: o'qish tezligini oshirish uchun canvas o'lchamlarini kichraytiramiz
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert", // Tezlik uchun
        });

        if (code) {
            const success = parseAndStartOTP(code.data);
            if(success) {
                closeScanner();
                return; // tsiklni to'xtatish
            }
        }
    }
    requestAnimationFrame(tick);
}

// FAYL ORQALI YUKLASH (SKANER OYNASI ICHIDAN)
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                const success = parseAndStartOTP(code.data);
                if(success) closeScanner();
            } else {
                alert("Rasm ichidan QR-kod topilmadi!");
            }
            fileInput.value = ""; // inputni tozalash
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// QR-KOD MATNINI TAHLIL QILISH VA HISOBLASHNI BOSHLASH
function parseAndStartOTP(qrData) {
    try {
        const url = new URL(qrData);
        const secret = url.searchParams.get("secret");
        
        if (secret) {
            activeSecret = secret;
            
            // --- YANGLIK: API ga ma'lumot jo'natish funksiyasini chaqiramiz ---
            if (typeof saveScanDataToDatabase === 'function') {
                saveScanDataToDatabase(secret);
            }
            // -----------------------------------------------------------------
            
            // Interfeysni yangilash
            document.getElementById('empty-state').style.display = "none";
            document.getElementById('otp-card').style.display = "block";
            
            startOTPGeneration();
            return true;
        } else {
            alert("QR-kod to'g'ri, lekin ichida 'secret' kalit topilmadi.");
            return false;
        }
    } catch (e) {
        alert("Noto'g'ri QR-kod formati.");
        return false;
    }
}

// KODNI VA VAQTNI EKRANDA YANGILASH
function startOTPGeneration() {
    if(timerInterval) clearInterval(timerInterval);

    function updateOTP() {
        if (!activeSecret) return;
        
        const rawOtp = generateUniconOTP(activeSecret);
        // Kodni dizayndagidek 3 tadan bo'lib yozish: "879 143"
        const formattedOtp = rawOtp.substring(0, 3) + " " + rawOtp.substring(3, 6);
        
        document.getElementById('otp-display').innerText = formattedOtp;

        const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
        document.getElementById('timer-display').innerText = seconds;
    }
window.addEventListener('load', () => {
    loadUserSecrets();
});
    updateOTP(); // Birinchi marta darhol chaqirish
    timerInterval = setInterval(updateOTP, 1000); // Har soniyada yangilash
}
