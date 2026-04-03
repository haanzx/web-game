class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 0.08;
        this.hp = 20;
    }

    update(player, enemies, deltaTime) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // 1. Gerak Mengejar Player
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }

        // 2. LOGIKA ANTI-DEMPET (Separation)
        enemies.forEach(other => {
            if (other === this) return;
            const overlapDx = this.x - other.x;
            const overlapDy = this.y - other.y;
            const overlapDist = Math.hypot(overlapDx, overlapDy);
            
            // Jika jarak antar musuh < total radius, dorong keluar
            const minDist = this.radius * 2; 
            if (overlapDist < minDist && overlapDist > 0) {
                const force = (minDist - overlapDist) / 2;
                this.x += (overlapDx / overlapDist) * force;
                this.y += (overlapDy / overlapDist) * force;
            }
        });
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4444";
        ctx.fill();
    }
}