const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. KONFIGURASI & STATE ---
canvas.width = 800;
canvas.height = 200;

let score = 0;
let highScore = localStorage.getItem("dinoHighScore") || 0;
let gameSpeed = 5;
let isGameOver = false;
let isPaused = false;

// Tampilkan High Score saat awal load
document.getElementById('high-score').innerText = "HI " + highScore.toString().padStart(5, '0');

// --- 2. ASSET LOADER ---
const imgDino = new Image();
imgDino.src = 'assets/game_objects/bird-mid.png'; 

const imgCactus = new Image();
imgCactus.src = 'assets/game_objects/pipe.png';

// --- 3. OBJEK GAME ---
const dino = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    v: 0,
    gravity: 0.6,
    jumpPower: -12,
    isGrounded: false
};

let obstacles = [];
let spawnTimer = 0;
let nextSpawn = 100;

// --- 4. FUNGSI INTI ---

function spawnObstacle() {
    // Kelompok rintangan (1-3 buah)
    let groupSize = Math.floor(Math.random() * 3) + 1;
    let randomH = Math.random() * (20) + 30; 

    for (let i = 0; i < groupSize; i++) {
        obstacles.push({
            x: canvas.width + (i * 25), 
            y: canvas.height - randomH - 5,
            width: 20,
            height: randomH
        });
    }
}

function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    const menu = document.getElementById('pause-menu');
    
    if (isPaused) {
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
        requestAnimationFrame(update); // Jalankan kembali loop
    }
}

function die() {
    isGameOver = true;
    let finalScore = Math.floor(score);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem("dinoHighScore", highScore);
        document.getElementById('high-score').innerText = "HI " + highScore.toString().padStart(5, '0');
    }
}

function restartGame() {
    score = 0;
    gameSpeed = 5;
    isGameOver = false;
    isPaused = false;
    obstacles = [];
    spawnTimer = 0;
    dino.y = 150;
    dino.v = 0;
    document.getElementById('pause-menu').classList.add('hidden');
    update();
}

function exitGame() {
    window.location.href = '../../index.html'; // Kembali ke menu utama
}

// --- 5. GAME LOOP ---

function update() {
    if (isGameOver || isPaused) return;

    // Fisika Dino
    dino.v += dino.gravity;
    dino.y += dino.v;

    const groundY = canvas.height - 40;
    if (dino.y > groundY) {
        dino.y = groundY;
        dino.v = 0;
        dino.isGrounded = true;
    }

    // Skor Jarak
    score += 0.15;
    document.getElementById('current-score').innerText = Math.floor(score).toString().padStart(5, '0');

    // Spawning Rintangan
    spawnTimer++;
    if (spawnTimer > nextSpawn) {
        spawnObstacle();
        spawnTimer = 0;
        nextSpawn = Math.random() * (150 - 70) + 70;
    }

    // Gerakan & Tabrakan
    obstacles.forEach((ob, index) => {
        ob.x -= gameSpeed;

        if (
            dino.x < ob.x + ob.width &&
            dino.x + dino.width > ob.x &&
            dino.y < ob.y + ob.height &&
            dino.y + dino.height > ob.y
        ) {
            die();
        }

        if (ob.x < -100) {
            obstacles.splice(index, 1);
        }
    });

    gameSpeed += 0.001;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Garis Lantai
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 5);
    ctx.lineTo(canvas.width, canvas.height - 5);
    ctx.stroke();

    // Dino
    ctx.drawImage(imgDino, dino.x, dino.y, dino.width, dino.height);

    // Rintangan
    obstacles.forEach(ob => {
        ctx.drawImage(imgCactus, ob.x, ob.y, ob.width, ob.height);
    });

    if (isGameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = "20px Courier New";
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER - Tap to Restart", canvas.width/2, canvas.height/2);
    }
}

// --- 6. EVENT LISTENERS ---

// Keyboard
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isGameOver) restartGame();
        else if (dino.isGrounded && !isPaused) {
            dino.v = dino.jumpPower;
            dino.isGrounded = false;
        }
    }
    if (e.code === 'Escape') togglePause();
});

// Touch (Seluruh Layar)
window.addEventListener('touchstart', (e) => {
    // Jika menekan tombol UI, jangan buat dino lompat
    if (e.target.tagName === 'BUTTON') return;
    
    if (e.cancelable) e.preventDefault();

    if (isGameOver) {
        restartGame();
    } else if (dino.isGrounded && !isPaused) {
        dino.v = dino.jumpPower;
        dino.isGrounded = false;
    }
}, { passive: false });


// Mulai Game
update();