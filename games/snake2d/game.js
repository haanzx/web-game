// 1. Perbaikan Variabel Global (Hapus deklarasi allSnakes di sini)
let canvas, ctx, player, bots = [], foods = [];
let gameActive = true, isPaused = false;
let camera = { x: 0, y: 0 }, targetAngle = 0;
const WORLD_SIZE = 2500;
const NUM_BOTS = 20;

// Setup Analog Dinamis
let analogOrigin = { x: 0, y: 0 };
const analogCont = document.getElementById('analog-container');
const stick = document.getElementById('stick');

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player = new Player(WORLD_SIZE/2, WORLD_SIZE/2, '#ff0075');
    
    bots = [];
    for(let i=0; i<NUM_BOTS; i++) {
        bots.push(new Bot(WORLD_SIZE));
    }

    foods = [];
    for(let i=0; i<150; i++) spawnFood();
}

function spawnFood() {
    foods.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        r: 4, 
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        isPremium: false
    });
}

function dropFood(segments, color) {
    segments.forEach((seg, index) => {
        // Drop makanan setiap 3 segmen agar tidak membebani render
        if (index % 3 === 0) {
            foods.push({
                x: seg.x + (Math.random() - 0.5) * 20,
                y: seg.y + (Math.random() - 0.5) * 20,
                r: 6, 
                color: color, 
                isPremium: true 
            });
        }
    });
}

function update() {
    if (!gameActive || isPaused) return;

    // Update Posisi Player & Kamera
    player.update(targetAngle);
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // --- PENTING: Gunakan let, jangan dideklarasikan di global ---
    let currentSnakes = [player, ...bots]; 

    // Logika Makanan (Player)
    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        if (Math.hypot(player.x - f.x, player.y - f.y) < player.radius + f.r) {
            player.length += f.isPremium ? 6 : 3;
            foods.splice(i, 1);
            if (!f.isPremium) spawnFood();
            document.getElementById('scoreVal').innerText = (player.length - 30) * 10;
        }
    }

    // Logika Bot & Tabrakan
    bots.forEach(bot => {
        // Kirim currentSnakes agar bot bisa belajar/menghindar
        bot.update(foods, currentSnakes);

        // Bot makan
        for (let i = foods.length - 1; i >= 0; i--) {
            let f = foods[i];
            if (Math.hypot(bot.x - f.x, bot.y - f.y) < bot.radius + f.r) {
                bot.length += f.isPremium ? 4 : 2;
                foods.splice(i, 1);
                if (!f.isPremium) spawnFood();
            }
        }

        let botHit = false;

        // Cek jika KEPALA BOT nabrak BADAN PLAYER
        player.segments.forEach((seg, idx) => {
            if (idx > 5 && Math.hypot(bot.x - seg.x, bot.y - seg.y) < bot.radius + player.radius) {
                botHit = true;
            }
        });

        // Cek jika KEPALA BOT nabrak BADAN BOT LAIN
        bots.forEach(otherBot => {
            if (bot !== otherBot && !botHit) {
                if(Math.hypot(bot.x - otherBot.x, bot.y - otherBot.y) < 400) {
                    otherBot.segments.forEach((seg) => {
                        if (Math.hypot(bot.x - seg.x, bot.y - seg.y) < bot.radius + otherBot.radius) {
                            botHit = true;
                        }
                    });
                }
            }
        });

        // Cek Batas Dunia untuk Bot
        if (bot.x < 0 || bot.x > WORLD_SIZE || bot.y < 0 || bot.y > WORLD_SIZE) botHit = true;

        if (botHit) {
            dropFood(bot.segments, bot.color);
            bot.reset(); // Memanggil reset yang sudah ada logika evolusinya
        }
    });

    // Cek jika KEPALA PLAYER nabrak BADAN BOT
    bots.forEach(bot => {
        bot.segments.forEach((seg) => {
            if (Math.hypot(player.x - seg.x, player.y - seg.y) < player.radius + bot.radius) {
                die();
            }
        });
    });

    // Cek Batas Dunia Player
    if (player.x < 0 || player.x > WORLD_SIZE || player.y < 0 || player.y > WORLD_SIZE) die();
}

// Tambahkan di game.js, di luar fungsi update atau init
function updateLeaderboard() {
    if (!gameActive || isPaused) return;

    // 1. Kumpulkan data
    let allSnakes = [];
    allSnakes.push({ name: "YOU", score: (player.length - 30) * 10 });
    bots.forEach(bot => {
        allSnakes.push({ name: bot.name, score: (bot.length - 25) * 10 });
    });

    // 2. Sort
    allSnakes.sort((a, b) => b.score - a.score);

    // 3. Tampilkan TOP 10 (Gaya Wormate)
    let lbHTML = "";
    let playerRank = 0;

    allSnakes.forEach((snake, index) => {
        if (index < 10) {
            lbHTML += `<div class="lb-item">
                <span class="rank-val">${index + 1}.</span>
                <span class="name-val">${snake.name}</span>
                <span class="score-val">${snake.score}</span>
            </div>`;
        }
        if (snake.name === "YOU") playerRank = index + 1;
    });

    document.getElementById('lb-list').innerHTML = lbHTML;

    // 4. Cek Peringkat User
    const myRankEl = document.getElementById('my-rank');
    if (playerRank > 10) {
        myRankEl.innerHTML = `[Rank ${playerRank}] YOU: ${(player.length - 30) * 10}`;
        myRankEl.style.display = "block";
    } else {
        myRankEl.style.display = "none";
    }
}

// Panggil fungsi ini setiap 1 detik agar hemat baterai M20
setInterval(updateLeaderboard, 1000);

function die() {
    if (!gameActive) return;
    gameActive = false;
    dropFood(player.segments, player.color);
    document.getElementById('finalScore').innerText = document.getElementById('scoreVal').innerText;
    document.getElementById('death-overlay').classList.remove('hidden');
}

// Di dalam game.js
function draw() {
    // 1. Bersihkan layar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Simpan state awal (tanpa kamera)
    ctx.save();
    
    // 3. Geser seluruh dunia sesuai posisi kamera
    // Kita kurangi camera agar objek "bergerak" berlawanan dengan arah player
    ctx.translate(-camera.x, -camera.y);
    
    // --- SEMUA DI BAWAH INI ADALAH KOORDINAT DUNIA ---
    
    // Gambar Grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    for(let i=0; i<=WORLD_SIZE; i+=100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i); ctx.stroke();
    }
    
    // Gambar Makanan
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); 
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); 
        ctx.fill();
    });

    // Gambar Bot
    bots.forEach(bot => bot.draw(ctx));

    // Gambar Player
    player.draw(ctx);

    // --- SELESAI GAMBAR OBJEK DUNIA ---
    
    // 4. Kembalikan state awal (untuk UI seperti Score yang tidak ikut gerak kamera)
    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Event Listeners (Analog & Mouse)
window.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    const dx = e.clientX - canvas.width / 2;
    const dy = e.clientY - canvas.height / 2;
    targetAngle = Math.atan2(dy, dx);
});

window.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    analogOrigin = { x: touch.clientX, y: touch.clientY };
    analogCont.style.left = (analogOrigin.x - 50) + 'px';
    analogCont.style.top = (analogOrigin.y - 50) + 'px';
    analogCont.style.display = 'block';
});

window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - analogOrigin.x;
    const dy = touch.clientY - analogOrigin.y;
    targetAngle = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy), 30);
    stick.style.transform = `translate(${(dx/Math.hypot(dx,dy))*dist}px, ${(dy/Math.hypot(dx,dy))*dist}px)`;
});

window.addEventListener('touchend', () => {
    analogCont.style.display = 'none';
    stick.style.transform = `translate(0,0)`;
});

window.onload = () => { init(); loop(); };

// Objek global untuk mengontrol UI dari HTML
window.gameControl = {
    // Fungsi untuk memunculkan menu pause
    pause: () => {
        if (!gameActive) return; // Jangan pause kalau sudah mati
        isPaused = true;
        document.getElementById('pause-overlay').classList.remove('hidden');
    },
    
    // Fungsi untuk melanjutkan game
    resume: () => {
        isPaused = false;
        document.getElementById('pause-overlay').classList.add('hidden');
    },
    
    // Fungsi untuk kembali ke menu utama (index.html)
    goHome: () => {
        window.location.href = 'index.html'; 
    }
};