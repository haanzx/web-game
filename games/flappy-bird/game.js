const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const isDemo = new URLSearchParams(window.location.search).get('mode') === 'demo';

let bird, pipes, frame, score, gameActive, isPaused;
const GRAVITY = 0.25;
const JUMP_POWER = -4.8;
let groundX = 0;
const GROUND_SPEED = 3;

// 1. OBJEK ASSET
const images = {
    bird: [new Image(), new Image(), new Image()],
    pipe: new Image(),
    base: new Image(),
    bg: new Image()
};

const numAssets = [];
for (let i = 0; i <= 9; i++) {
    numAssets[i] = new Image();
    numAssets[i].src = `assets/ui/numbers/${i}.png`;
}

let imagesLoaded = 0;
// Total: 3 (bird) + 1 (pipe) + 1 (base) + 1 (bg) + 10 (numbers) = 16
const totalImages = 16; 

function checkAssets() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        init();
        update(); 
    }
}

// 2. SET PATH & LOAD
const path = 'assets/game_objects/';
images.bird[0].src = path + 'bird-up.png';
images.bird[1].src = path + 'bird-mid.png';
images.bird[2].src = path + 'bird-down.png';
images.pipe.src = path + 'pipe.png';
images.base.src = path + 'base.png';
images.bg.src = path + 'background-day.png';

// Gabungkan semua asset untuk dipasang listener onload
const allAssets = [
    ...images.bird, 
    images.pipe, 
    images.base, 
    images.bg, 
    ...numAssets
];

allAssets.forEach(img => {
    img.onload = checkAssets;
    img.onerror = () => {
        console.error("Gagal memuat asset:", img.src);
        // Tetap jalankan checkAssets agar game tidak stuck jika 1 gambar gagal
        checkAssets(); 
    };
});

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bird = { x: 80, y: canvas.height / 2, v: 0, r: 12 };
    pipes = [];
    frame = 0;
    score = 0;
    gameActive = isDemo;
    isPaused = false;
    
    if (isDemo) {
        const ui = document.getElementById('game-ui');
        if (ui) ui.style.display = 'none';
    }
}

function spawnPipe() {
    const gap = 170;
    const h = Math.random() * (canvas.height - gap - 200) + 100;
    pipes.push({ x: canvas.width, top: h, gap: gap, passed: false });
}

function update() {
    if (isPaused) return;

    if (gameActive) {
        // Gerakan Lantai
        groundX -= GROUND_SPEED;
        if (groundX <= -canvas.width) groundX = 0;

        bird.v += GRAVITY;
        bird.y += bird.v;
        frame++;

        if (frame % 90 === 0) spawnPipe();

        pipes.forEach((p, i) => {
            p.x -= 3.5;

            // Deteksi Tabrakan Pipa
            if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + 60) {
                if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) {
                    isDemo ? init() : die();
                }
            }

            // Hitung Skor
            if (!p.passed && p.x < bird.x) {
                p.passed = true;
                score++;
                // Update UI HTML jika masih digunakan
                const scoreElem = document.getElementById('score');
                if (scoreElem) scoreElem.innerText = score;
            }
            
            if (p.x < -100) pipes.splice(i, 1);
        });

        // Tabrakan Lantai & Langit
        if (bird.y + bird.r > canvas.height - 100 || bird.y < 0) {
            isDemo ? init() : die();
        }
        
        // Autopilot untuk mode demo
        if (isDemo && typeof autopilot === 'function') autopilot();
    }
    
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background
    if (images.bg.complete) {
        ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    }

    // 2. Pipes
    pipes.forEach(p => {
        if (images.pipe.complete) {
            // Pipa Atas (Dibalik)
            ctx.save();
            ctx.translate(p.x + 30, p.top);
            ctx.scale(1, -1);
            ctx.drawImage(images.pipe, -30, 0, 60, 400);
            ctx.restore();
            // Pipa Bawah
            ctx.drawImage(images.pipe, p.x, p.top + p.gap, 60, 400);
        }
    });

    // 3. Base (Lantai)
    if (images.base.complete) {
        ctx.drawImage(images.base, groundX, canvas.height - 100, canvas.width, 100);
        ctx.drawImage(images.base, groundX + canvas.width, canvas.height - 100, canvas.width, 100);
    }

    // 4. Bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    let rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, bird.v * 0.15));
    ctx.rotate(rotation);
    let birdIndex = Math.floor((frame / 5) % 3);
    if (images.bird[birdIndex].complete) {
        ctx.drawImage(images.bird[birdIndex], -17, -12, 34, 24);
    }
    ctx.restore();

    // 5. Score (Menggunakan Asset Angka)
    drawAnimatedScore(Math.floor(score), canvas.width / 2, 50);

    // 6. Overlay Start
    if (!gameActive && !isDemo) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("TAP UNTUK MULAI", canvas.width / 2, canvas.height / 2);
    }
}

function drawAnimatedScore(score, x, y) {
    const scoreStr = score.toString();
    const digitWidth = 24; 
    const digitHeight = 36;
    const totalWidth = scoreStr.length * digitWidth;
    
    let startX = x - (totalWidth / 2);

    for (let i = 0; i < scoreStr.length; i++) {
        const digit = parseInt(scoreStr[i]);
        const img = numAssets[digit];
        
        if (img && img.complete) {
            ctx.drawImage(img, startX + (i * digitWidth), y, digitWidth, digitHeight);
        }
    }
}

function die() {
    gameActive = false;
    // Tampilkan Popup Death
    const overlay = document.getElementById('overlay');
    const deathPopup = document.getElementById('death-popup');
    const finalScore = document.getElementById('final-score');
    
    if (overlay) overlay.classList.remove('hidden');
    if (deathPopup) deathPopup.classList.remove('hidden');
    if (finalScore) finalScore.innerText = score;

    const pausePopup = document.getElementById('pause-popup');
    if (pausePopup) pausePopup.classList.add('hidden');
}

// --- CONTROLS ---

window.gameControl = {
    jump: () => { 
        if (isPaused) return;
        bird.v = JUMP_POWER; 
        if (!gameActive) gameActive = true; 
    },
    resume: () => { 
        isPaused = false; 
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('hidden'); 
    }
};

window.addEventListener('keydown', e => {
    if (e.code === 'Space') gameControl.jump();
});

canvas.addEventListener('touchstart', e => { 
    // Jika menyentuh tombol pause, jangan lompat
    if (e.target.tagName === 'BUTTON') return;
    
    e.preventDefault(); 
    gameControl.jump(); 
}, { passive: false });

// Listener tombol pause
const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
    pauseBtn.onclick = (e) => {
        e.stopPropagation();
        isPaused = true;
        document.getElementById('overlay')?.classList.remove('hidden');
        document.getElementById('pause-popup')?.classList.remove('hidden');
        document.getElementById('death-popup')?.classList.add('hidden');
    };
}


