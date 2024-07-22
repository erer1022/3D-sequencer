class NoteBox {
    constructor(position, duration, pitch) {
      this.position = position;
      this.duration = duration;
      this.pitch = pitch;
      this.isChoosed = false;
      this.color = null;
      this.isActivate = false;
      this.selected = false;
    }
  
    // Function to draw a box at a given position
    drawBox(p) {
      p.push();
      p.smooth();
      p.lights();
      p.stroke(225);
      
      let boxWidth = baseWidth * this.duration;
      let boxHeight = this.pitch;
  
      // set color effects
      if (this.isMouseOver(p)) {
        this.displayInfo(p);
        this.color = p.color(250, 232, 92, 150);
      } else if (this.isChoosed) {
        p.stroke(255);
        p.strokeWeight(2);
        this.color = p.color(250, 232, 92, 150);
      } else if (this.isActivate) {
        this.color = p.color(203, 223, 247, 150);
        this.displayInfo(p);
      } else {
        this.color = p.color(200, 223, 255 - this.pitch);
      }
  
      p.fill(this.color);
      p.translate(this.position.x + boxWidth / 2, -boxHeight / 2, this.position.z - baseWidth / 2);
      p.box(boxWidth, boxHeight, baseWidth); // Adjust the box size based on the duration
      p.pop();
    }
  
    displayInfo(p) {
      let boxWidth = baseWidth * this.duration;
      let boxHeight = this.pitch;
      
      // Drawing text in 2D coordinates, consider using screen coordinates
      p.push();
      // Convert 3D coordinates to screen coordinates
      let position = p.createVector(this.position.x + boxWidth / 2, this.position.y - boxHeight / 2, this.position.z - baseWidth / 2);
      p.translate(position.x, position.y, position.z);
      p.fill(0);
      p.text(`${this.midiNoteToNoteName(this.pitch)} \n${this.duration}`, 0, 0);
      p.pop();
    }
  
    isMouseOver(p) {
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2);
  
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2) < baseWidth / 2) {
        return true;
      } else {
        return false;
      }
    }
  
    isMouseNearBoxRightSide(p) {
      // adjust the x position
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x + baseWidth * this.duration, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2);
      
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x + baseWidth, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2) < baseWidth) {
        return true;
      } else {
        return false;
      }
    }
  
    isMouseNearBoxLeftSide(p) {
      // adjust the x position
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x - baseWidth * this.duration, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2);
      
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x - baseWidth * this.duration, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2) < baseWidth / 2) {
        return true;
      } else {
        return false;
      }
    }
  
    isMouseNearBoxBackSide(p) {
      // adjust the Z position
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth);
  
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth) < baseWidth) {
        return true;
      } else {
        return false;
      }
    }
  
    isMouseNearBoxFrontSide(p) {
      // adjust the Z position
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z + baseWidth);
  
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z + baseWidth) < baseWidth / 2) {
        return true;
      } else {
        return false;
      }
    }
  
    isMousePressed(p) {
      if (p.mouseIsPressed && this.isMouseOver(p)) {
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