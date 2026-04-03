class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 0.25;
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.hp = 100;
        this.lastShot = 0;
        this.shootInterval = 1000; // Tembak tiap 1 detik
    }

    update(keys, deltaTime, worldW, worldH) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const mag = Math.hypot(dx, dy);
            dx /= mag; dy /= mag;
        }

        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // Boundary
        this.x = Math.max(this.radius, Math.min(this.x, worldW - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, worldH - this.radius));
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#4287f5";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
}