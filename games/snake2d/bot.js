// bot.js
class Bot {
    constructor(worldSize) {
        this.worldSize = worldSize;
        this.minSpeed = 1.75;
        this.maxSpeed = 2.5;
        this.turnSpeed = 0.12; // Sedikit dinaikkan agar bot lebih lincah menghindar
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.worldSize;
        this.y = Math.random() * this.worldSize;
        this.targetAngle = Math.random() * Math.PI * 2;
        this.angle = this.targetAngle;
        this.color = `hsl(${Math.random() * 360}, 60%, 50%)`;
        this.speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
        this.radius = 11;
        this.segments = [];
        this.length = 25;
        for(let i=0; i<this.length; i++) this.segments.push({x: this.x, y: this.y});

        const names = ["Shadow", "NeonX", "Cyber", "Glitch", "Bit", "Volt", "Racer", "Zapper", "Hunter", "Ghost"];
        this.name = names[Math.floor(Math.random() * names.length)] + "#" + Math.floor(Math.random() * 99);
    }

    update(foods, allSnakes) { 
        // allSnakes adalah array yang berisi [player, bot1, bot2, dst]
        
        let obstacleDetected = false;

        // 1. SENSOR PENGHINDAR (Radar Depan)
        // Bot mengecek area di depannya (sejauh 80-100 pixel)
        const sensorDist = 80;
        const sensorX = this.x + Math.cos(this.angle) * sensorDist;
        const sensorY = this.y + Math.sin(this.angle) * sensorDist;

        for (let snake of allSnakes) {
            // Jangan cek kepala sendiri, tapi cek segmen badan ular lain
            snake.segments.forEach((seg, idx) => {
                // Jika sensor mendeteksi badan ular (jarak < radius aman)
                if (Math.hypot(sensorX - seg.x, sensorY - seg.y) < this.radius + 20) {
                    obstacleDetected = true;
                    // Berbelok menjauh dari rintangan
                    this.targetAngle += 0.5; 
                }
            });
            if (obstacleDetected) break;
        }

        // 2. Jika tidak ada rintangan, baru cari makanan
        if (!obstacleDetected) {
            if (Math.random() < 0.05) {
                let nearest = null;
                let minDist = 400;
                for (let i = 0; i < foods.length; i += 10) {
                    let d = Math.hypot(this.x - foods[i].x, this.y - foods[i].y);
                    if (d < minDist) { minDist = d; nearest = foods[i]; }
                }
                if (nearest) this.targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            }
        }

        // 3. Batas Dunia (Border Avoidance)
        const margin = 150;
        if (this.x < margin || this.x > this.worldSize - margin || 
            this.y < margin || this.y > this.worldSize - margin) {
            this.targetAngle += 0.3;
        }

        // 4. Smooth Turning
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * this.turnSpeed;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.segments.unshift({ x: this.x, y: this.y });
        if (this.segments.length > this.length) this.segments.pop();
    }

    draw(ctx) {
        if (this.segments.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 2;
        ctx.lineCap = "round";
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i += 2) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.stroke();
    }
}