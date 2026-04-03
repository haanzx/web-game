// player.js
class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = 0;
        this.speed = 2.8;
        this.radius = 12;
        this.segments = [];
        this.length = 30;
    }

    update(targetAngle) {
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.15;

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
        ctx.lineJoin = "round";
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.stroke();
    }
}