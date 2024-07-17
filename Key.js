class Key {
    constructor(note, x, y, w, h, color) {
      this.note = note;
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.color = color;
      this.originalColor = color;
      this.stroke = (210);
      this.isActivate = false;
    }
    
    display() {
      fill(this.color);
      stroke(this.stroke);
      rect(this.x, this.y, this.w, this.h, 3);
      if (!this.note.includes('#')) {
        fill(0);
        textSize(12);
        textAlign(CENTER, CENTER);
        text(this.note, this.x + this.w / 2, this.h + 180);
      }
    }
    
    lighten() {
      if (this.note.includes('#')) {
        this.color = color(0, 0, 0);
      } else {
        this.color = color(255, 255, 255);
      }
    }
    
    darken() {
      if (this.note.includes('#')) {
        this.color = color(0, 0, 0, 150);
      } else {
        this.color = color(255, 255, 255, 150);
      }
    }
    
    isMouseOver() {
        let mouseX3D = mouseX - width / 2;
        let mouseY3D = mouseY - height / 2;
        // if this note is black key
        if (this.note.includes('#')) {
            return mouseX3D >= (this.x - this.w / 2) && mouseX3D <= this.x + this.w / 2 && mouseY3D >= this.y && mouseY3D <= this.y + this.h;
            // if this note is white key
        } else {
            return mouseX3D >= (this.x - this.w / 2) && mouseX3D <= this.x + this.w / 2 && mouseY3D >= this.y + blackKeyHeight && mouseY3D <= this.y + this.h;
        }
    }

    isMousePressed() {
        if (mouseIsPressed && this.isMouseOver()) {
            return true;
        } else {
            return false;
        }
    }
  }