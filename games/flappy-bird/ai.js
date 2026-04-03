/**
 * AI Autopilot untuk Flappy Bird
 * Menghitung posisi burung terhadap celah pipa terdekat
 */
function autopilot() {
    // 1. Cari pipa terdekat yang belum dilewati
    const targetPipe = pipes.find(p => p.x + 60 > bird.x - bird.r);

    if (targetPipe) {
        // 2. Target adalah tengah-tengah celah pipa (Gap Center)
        const targetY = targetPipe.top + (targetPipe.gap / 2);
        
        // 3. Jika burung mulai turun melewati batas toleransi, lompat!
        // AI "jago banget" akan menjaga burung tetap di garis tengah celah
        if (bird.y > targetY + 5) {
            bird.v = JUMP_POWER;
        }
    } else {
        // 4. Jika tidak ada pipa, terbang santai di tengah layar
        if (bird.y > canvas.height / 2 + 20) {
            bird.v = JUMP_POWER;
        }
    }
}