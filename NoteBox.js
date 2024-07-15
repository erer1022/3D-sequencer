class NoteBox {
    constructor(position, duration, pitch) {
        this.position = position;
        this.duration = duration;
        this.pitch = pitch;
        this.isChoosed = false;
        this.color = color(155, 190, 250);
        this.isActivate = false;
    }

    // Function to draw a box at a given position
    drawBox(baseWidth) {
        boxWidth = baseWidth * this.duration;
        boxHeight = this.pitch;
  
        push();
        smooth();
        lights();
        if (this.isChoosed && !this.isActivate) {
            this.color = color(89, 123, 181);
            strokeWeight(2);
            stroke(255);
        } else if (!this.isChoosed && !this.isActivate) {
            this.color = color(155, 190, 250);
            noStroke();
        } else {
            this.color = color(155, 190, 250, 150);
        }
        fill(this.color);
        translate(this.position.x + boxWidth / 2, -boxHeight/2, this.position.z);
        box(boxWidth, boxHeight, baseWidth); // Adjust the box size based on the duration
        pop();
  }

  
}