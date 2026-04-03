const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const xpFill = document.getElementById("xp-bar-fill");
const timeVal = document.getElementById("time-val");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

let player, enemies = [], projectiles = [], keys = {};
let lastTime = 0, spawnTimer = 0;
let isPaused = false;
let isGameOver = false;

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function init() {
    player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    document.getElementById("pause-overlay").style.display = isPaused ? "flex" : "none";
    if (!isPaused) {
        lastTime = performance.now(); // Reset timer agar tidak loncat
        requestAnimationFrame(gameLoop);
    }
}


function gameLoop(timeStamp) {
    if (isPaused) return;

    if (!lastTime) lastTime = timeStamp;
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    update(deltaTime, timeStamp);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt, ts) {
    player.update(keys, dt, WORLD_WIDTH, WORLD_HEIGHT);

    // Auto Shoot
    if (ts - player.lastShot > player.shootInterval) {
        findAndShootTarget();
        player.lastShot = ts;
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].life <= 0) projectiles.splice(i, 1);
    }

    // Spawn Enemy
    spawnTimer += dt;
    if (spawnTimer > 1000) {
        const angle = Math.random() * Math.PI * 2;
        enemies.push(new Enemy(
            player.x + Math.cos(angle) * 600,
            player.y + Math.sin(angle) * 600
        ));
        spawnTimer = 0;
    }

    // Update Enemies & Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        // Berikan array 'enemies' ke update untuk logika separation
        enemies[i].update(player, enemies, dt);
        
        // Tabrakan dengan Player (Damage)
        const dToPlayer = Math.hypot(player.x - enemies[i].x, player.y - enemies[i].y);
        if (dToPlayer < player.radius + enemies[i].radius) {
            player.hp -= 0.2; // Kurangi darah
            if (player.hp <= 0) showGameOver();
        }

        // Hit Peluru
        projectiles.forEach((p, pIdx) => {
            if (Math.hypot(p.x - enemies[i].x, p.y - enemies[i].y) < 20) {
                enemies[i].hp -= p.damage;
                projectiles.splice(pIdx, 1);
            }
        });

        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
            player.xp += 25;
            if (player.xp >= player.nextLevelXp) levelUp();
            xpFill.style.width = (player.xp / player.nextLevelXp * 100) + "%";
        }
    }

    // Update Timer UI
    const totalSec = Math.floor(ts / 1000);
    timeVal.innerText = `${Math.floor(totalSec/60).toString().padStart(2,'0')}:${(totalSec%60).toString().padStart(2,'0')}`;
}

// ... (findAndShootTarget, levelUp, draw sama seperti sebelumnya) ...
function findAndShootTarget() {
    if (enemies.length === 0) return;
    let closest = enemies[0];
    let minDist = Math.hypot(player.x - closest.x, player.y - closest.y);
    enemies.forEach(e => {
        let d = Math.hypot(player.x - e.x, player.y - e.y);
        if (d < minDist) { minDist = d; closest = e; }
    });
    const angle = Math.atan2(closest.y - player.y, closest.x - player.x);
    projectiles.push(new Projectile(player.x, player.y, angle));
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.nextLevelXp *= 1.3;
    document.getElementById("level-val").innerText = player.level;
}

function draw() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-player.x + canvas.width / 2, -player.y + canvas.height / 2);
    
    // Grid Tanah
    ctx.strokeStyle = "#222";
    for(let i=0; i<=WORLD_WIDTH; i+=100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_WIDTH, i); ctx.stroke();
    }

    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    player.draw(ctx);
    ctx.restore();
}

// Fungsi untuk Restart Game
function restartGame() {
    console.log("Restarting...");
    window.location.reload();
}

// Fungsi untuk Kembali ke Menu Utama
function goToMenu() {
    window.location.href = 'index.html';
}

// Update fungsi showGameOver agar lebih solid
function showGameOver() {
    isGameOver = true;
    isPaused = true;
    
    // Munculkan Overlay
    const goOverlay = document.getElementById("gameover-overlay");
    goOverlay.style.display = "flex";
    
    // Isi Skor
    document.getElementById("final-score").innerText = player.level;
    
    // Hentikan Loop (Opsional tapi bagus untuk performa i3)
    cancelAnimationFrame(gameLoop); 
}

init();