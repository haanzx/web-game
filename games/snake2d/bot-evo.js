class Bot {
    constructor(worldSize) {
        this.worldSize = worldSize;
        
        // --- GENETIKA (Akan berubah seiring evolusi) ---
        this.weights = {
            foodAttraction: 0.5 + Math.random(), // Seberapa nafsu sama makanan
            dangerAwareness: 0.5 + Math.random(), // Seberapa takut nabrak
            aggression: Math.random(),            // Keinginan buat motong jalan lawan
            sensorRange: 100 + Math.random() * 100
        };

        this.reset();
    }

    reset() {
        // Jika ada bot "Master" (skor tertinggi), tiru gen-nya dengan sedikit mutasi
        const master = this.findMaster();
        if (master && master.length > 50) {
            this.evolveFrom(master);
        }

        this.x = Math.random() * this.worldSize;
        this.y = Math.random() * this.worldSize;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.color = `hsl(${Math.random() * 360}, 60%, 50%)`;
        
        // Kecepatan dipengaruhi oleh gen aggression
        this.speed = 2.0 + (this.weights.aggression * 1.5); 
        this.turnSpeed = 0.08 + (this.weights.dangerAwareness * 0.05);
        
        this.radius = 11;
        this.segments = [];
        this.length = 25;
        this.name = this.generateName();
        
        for(let i=0; i<this.length; i++) this.segments.push({x: this.x, y: this.y});
    }

    // Fungsi Belajar: Mengambil sifat dari bot terbaik
    evolveFrom(master) {
        for (let key in this.weights) {
            // Tiru 90% sifat master, 10% perubahan acak (mutasi)
            this.weights[key] = master.weights[key] * 0.9 + (Math.random() * 0.2);
        }
        this.isEvolved = true; // Tandai kalau ini bot "pintar"
    }

    findMaster() {
        if (typeof bots === 'undefined' || bots.length === 0) return null;
        // Cari bot dengan segmen terbanyak (paling sukses bertahan hidup)
        return bots.reduce((prev, current) => (prev.length > current.length) ? prev : current);
    }

    update(foods, allSnakes) {
        let steerX = 0;
        let steerY = 0;

        // 1. Insting Mencari Makanan (Dikalibrasi oleh foodAttraction)
        let nearestFood = null;
        let minDist = 300;
        for (let i = 0; i < foods.length; i += 15) {
            let d = Math.hypot(this.x - foods[i].x, this.y - foods[i].y);
            if (d < minDist) { minDist = d; nearestFood = foods[i]; }
        }
        if (nearestFood) {
            steerX += (nearestFood.x - this.x) * this.weights.foodAttraction;
            steerY += (nearestFood.y - this.y) * this.weights.foodAttraction;
        }

        // 2. Insting Menghindar (Dikalibrasi oleh dangerAwareness)
        allSnakes.forEach(snake => {
            if (snake === this) return;
            
            // Cek hanya segmen yang dekat (optimasi M20)
            snake.segments.forEach((seg, idx) => {
                if (idx % 5 !== 0) return; 
                let d = Math.hypot(this.x - seg.x, this.y - seg.y);
                if (d < this.weights.sensorRange) {
                    // Semakin dekat, semakin kuat dorongan buat menjauh (inverse force)
                    let force = (this.weights.sensorRange - d) * this.weights.dangerAwareness * 5;
                    steerX -= (seg.x - this.x) * force;
                    steerY -= (seg.y - this.y) * force;
                }
            });
        });

        // 3. Eksekusi Pergerakan Berdasarkan Hasil "Pemikiran"
        this.targetAngle = Math.atan2(steerY, steerX);

        // Smooth Turn
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * this.turnSpeed;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Update Badan
        this.segments.unshift({ x: this.x, y: this.y });
        if (this.segments.length > this.length) this.segments.pop();
    }

    generateName() {
        const prefix = this.isEvolved ? "Gen-" : "Bot-";
        return prefix + Math.floor(Math.random() * 999);
    }

    draw(ctx) {
        if (this.segments.length < 2) return;
        ctx.beginPath();
        // Beri aura sedikit bersinar kalau dia bot hasil evolusi (pintar)
        ctx.strokeStyle = this.isEvolved ? "white" : this.color;
        ctx.lineWidth = this.radius * 2;
        ctx.lineCap = "round";
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i += 2) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.stroke();
        
        // Gambar Nama di atas kepala
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText(this.name, this.x - 20, this.y - 20);
    }
}