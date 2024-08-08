class NotePitchBox {
    constructor(position, duration, pitch) {
      this.position = position;
      this.duration = duration;
      this.pitch = pitch;
      this.isChoosed = false;
      this.color = null;
      this.isActivate = false;
      this.selected = false;
      this.isAddingNewTrackBall = false;
      this.startTime;
      this.boxHeight;
    }
  
  
    // Function to draw a box at a given position
    display(p) {
      p.push();
      p.smooth();
      p.lights();
      p.stroke(200);
      
      let boxWidth = baseWidth * this.duration;
  
      // set color effects
      if (this.isMouseOver(p)) {
        this.displayInfo(p);
        this.color = p.color(252, 227, 238, 150);
      } else if (this.isChoosed) {
        p.stroke(255);
        p.strokeWeight(2);
        this.color = p.color(252, 227, 238, 150);
      } else if (this.isActivate) {
        p.noStroke();
        this.color = p.color(203, 223, 247, 150);
        this.displayInfo(p);
      } else {
        this.color = p.color(210, 225, 250);
      }
  
      p.fill(this.color);
      p.translate(this.position.x + boxWidth / 2, this.position.y - this.boxHeight / 2, this.position.z - baseWidth / 2);
      p.box(boxWidth, this.boxHeight, baseWidth); // Adjust the box size based on the duration
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
      p.fill(110);
      p.textSize(25);
      p.text(`${this.midiNoteToNoteName(this.pitch)}`, 0, 0);
      p.pop();
    }

    
  
    isMouseOver(p) {
      let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2);
  
      if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                 cam1.eyeY + x._data[1] * dToObj / xMag, 
                 cam1.eyeZ + x._data[2] * dToObj / xMag, 
                 this.position.x + baseWidth * this.duration / 2, this.position.y - this.pitch / 2, this.position.z - baseWidth / 2) < baseWidth / 4) {
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