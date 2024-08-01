class BuiltInMidi {
    constructor (name, x, y, w, h) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    display(p) {
        p.fill(180);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.w, this.h, 3);
       
          p.textSize(12);
          //p.textAlign(p.CENTER, p.CENTER);
          p.text(this.name, this.x + this.w / 2, this.h + 50);
        
      }
}