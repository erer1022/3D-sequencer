// Ellipse class
class Bar {
    constructor(x, y, d, p) {
        this.x = x;
        this.y = y;
        this.d = d;
        this.growthRate = p.random(1, 3);
        this.alpha = 255;
    }

    update() {
        this.d += this.growthRate;
        this.alpha -= 3;  // Fade out
    }

    display(p) {
        p.fill(p.random(240, 255), p.random(240, 255), 255, this.alpha)
        p.stroke(p.random(240, 255), p.random(240, 255), 255, this.alpha)
        
        p.ellipse(this.x, this.y, this.d);
    }
}