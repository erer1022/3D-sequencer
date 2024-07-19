class Key {
  constructor(note, x, y, w, h, color) {
    this.note = note;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.originalColor = color;
    this.stroke = 210;
    this.isActivate = false;
  }

  display(p) {
    p.fill(this.color);
    p.stroke(this.stroke);
    p.rect(this.x, this.y, this.w, this.h, 3);
    if (!this.note.includes('#')) {
      p.fill(150);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.note, this.x + this.w / 2, this.h + 120);
    }
  }

  lighten(p) {
    if (this.note.includes('#')) {
      this.color = p.color(0, 0, 0);
    } else {
      this.color = p.color(255, 255, 255);
    }
  }

  darken(p) {
    if (this.note.includes('#')) {
      this.color = p.color(0, 0, 0, 150);
    } else {
      this.color = p.color(255, 255, 255, 150);
    }
  }

  isMouseOver(p) {
    // if this note is black key
    if (this.note.includes('#')) {
      return p.mouseX >= this.x && p.mouseX <= this.x + this.w && p.mouseY >= this.y && p.mouseY <= this.y + this.h;
    } else {
      return p.mouseX >= this.x && p.mouseX <= this.x + this.w && p.mouseY >= this.y && p.mouseY <= this.y + this.h;
    }
  }

  isMousePressed(p) {
    if (p.mouseIsPressed && this.isMouseOver(p)) {
      return true;
    } else {
      return false;
    }
  }
}