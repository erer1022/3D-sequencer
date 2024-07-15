class NoteBox {
    constructor(position, duration, pitch) {
        this.position = position;
        this.duration = duration;
        this.pitch = pitch;
    }

    // Function to draw a box at a given position
    drawBox(baseWidth, color) {
        boxWidth = baseWidth * this.duration;
        boxHeight = this.pitch;
  
        push();
        fill(color);
        stroke(210);
        translate(this.position.x, -boxHeight/2, this.position.z);
        box(boxWidth, boxHeight, baseWidth); // Adjust the box size based on the duration
        pop();
  }
}