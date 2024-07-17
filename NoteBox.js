class NoteBox {
    constructor(position, duration, pitch) {
        this.position = position;
        this.duration = duration;
        this.pitch = pitch;
        this.isChoosed = false;
        this.color;
        this.isActivate = false;
    }

    // Function to draw a box at a given position
    drawBox() {
        push();
        smooth();
        lights();
        
        let boxWidth = baseWidth * this.duration;
        let boxHeight = this.pitch;
        // set color effects
        if (this.isMouseOver()){
            this.displayInfo();
            this.color = color(250, 232, 92, 150);
        } else if (this.isChoosed){
            stroke(255);
            strokeWeight(2);
        } else if (this.isActivate){
            this.color = color(203, 223, 247, 150);
            this.displayInfo();
        } else {
            this.color = color(203, 223, 247);
        }

        fill(this.color);
        translate(this.position.x + boxWidth / 2, -boxHeight/2, this.position.z);
        box(boxWidth, boxHeight, baseWidth); // Adjust the box size based on the duration
        pop();
  }

    displayInfo() {
        let boxWidth = baseWidth * this.duration;
        let boxHeight = this.pitch;
        
        // Drawing text in 2D coordinates, consider using screen coordinates
        push();
        // Convert 3D coordinates to screen coordinates
        let position = createVector(this.position.x + boxWidth / 2, this.position.y - boxHeight / 2, 0);
        translate(position.x, position.y, position.z);
        fill(0);
        text(`${this.midiNoteToNoteName(this.pitch)}`, 0, 0);
        pop();
    }

    isMouseOver(){
        let mouseX3D = mouseX - width / 2;
        let mouseY3D = mouseY - height / 2;
        let boxWidth = baseWidth * this.duration;
        let boxHeight = this.pitch;
  
        // Calculate the distance from the mouse to the center of the box in the X and Y dimensions
        let dx = mouseX3D - this.position.x - boxWidth / 2;
        let dy = mouseY3D - this.position.y + boxHeight / 2;
  
        // Since we are dealing with 3D, we need to include the Z dimension
        // Assuming the box is aligned with the Z-axis, we need to check the Z position too
        let dz = 0 - this.position.z; // If you have a different Z position for the mouse, adjust this accordingly
  
        let withinX = abs(dx) < boxWidth / 2;
        let withinY = abs(dy) < boxHeight / 2;
        let withinZ = abs(dz) < baseWidth / 2;
  
        return withinX && withinY && withinZ;
    }

    isMousePressed() {
        if (mouseIsPressed && this.isMouseOver()) {
            return true;
        } else {
            return false;
        }
    }

    midiNoteToNoteName(noteNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(noteNumber / 12) - 1;
        const noteIndex = noteNumber % 12;
        return noteNames[noteIndex] + octave;
    }
}