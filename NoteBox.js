class NoteBox {
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
    }
  
    clone(p) {
      return new NoteBox (p.createVector(this.position.x, this.position.y, this.position.z), this.duration, this.pitch);
    }
    // Function to draw a box at a given position
    display(p) {
      p.push();
      p.smooth();
      p.lights();
      p.stroke(200);
      
      let boxWidth = baseWidth * this.duration;
      let boxHeight = defaultPitch + (this.pitch - defaultPitch) * 4;

      if (this.isAddingNewTrackBall && this.isMouseOver(p)) {
        this.drawPotentialTrackBall(p);
      }
  
      // set color effects
      // let lowColor = p.color(255, 200, 200);  // Red for low pitch
      // let highColor = p.color(200, 200, 255); // Blue for high pitch
      // let opacity = 200;
      // let pitchColor = this.getColorForPitch(p, lowColor, highColor, this.pitch, opacity);
      // Map pitch to color with octave-based brightness adjustment
      let pitchColor = this.getColorForPitch(p, this.pitch);

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
        this.color = pitchColor;
      }
  
      p.fill(this.color);
      p.translate(this.position.x + boxWidth / 2, this.position.y - boxHeight / 2, this.position.z - baseWidth / 2);
      p.box(boxWidth, boxHeight, baseWidth); // Adjust the box size based on the duration
      p.pop();
    }

    // getColorForPitch(p, lowColor, highColor, pitch, opacity) {
    //   let normalizedPitch = pitch / 127.0;
    //   let interpolatedColor = p.lerpColor(lowColor, highColor, normalizedPitch);
    //   interpolatedColor.setAlpha(opacity); // Set the alpha (opacity) of the interpolated color
    //   return interpolatedColor;
    // }
    getColorForPitch(p, pitch) {
      // Define distinct colors for notes in one octave
      const colors = {
        0: p.color(247, 161, 158),    // C - Red
        1: p.color(252, 220, 172),  // C#/Db - Orange
        2: p.color(252, 251, 172),  // D - Yellow
        3: p.color(198, 255, 186),    // D#/Eb - Green
        4: p.color(183, 246, 247),  // E - Cyan
        5: p.color(184, 227, 252),    // F - Blue
        6: p.color(192, 218, 252),   // F#/Gb - Indigo
        7: p.color(231, 202, 252),// G - Violet
        8: p.color(236, 177, 252),  // G#/Ab - Purple
        9: p.color(250, 190, 223),// A - Pink
        10: p.color(250, 155, 207),// A#/Bb - Hot Pink
        11: p.color(203, 111, 252)  // B - Dark Purple
      };

      // Determine the note within the octave and the octave number
      let noteInOctave = pitch % 12;
      let octave = Math.floor(pitch / 12);

      // Get the base color for the note
      let baseColor = colors[noteInOctave];

      // Adjust the brightness based on the octave (higher octave = less brightness)
      let brightnessFactor = 1 - (octave / 10.0); // Assuming up to 10 octaves; adjust as needed
      let adjustedColor = p.color(
        p.red(baseColor) * brightnessFactor,
        p.green(baseColor) * brightnessFactor,
        p.blue(baseColor) * brightnessFactor,
        200
      );

      return adjustedColor;
    }

    drawPotentialTrackBall(p) {
      let Color = p.color(200, 200, 200, 100); // Semi-transparent blue for the potential box
      let boxHeight = defaultPitch + (this.pitch - defaultPitch) * 4;

        p.push();
        p.fill(Color);
        p.stroke(210);
        p.translate(this.position.x + baseWidth / 2, this.position.y - boxHeight - trackBallBase, this.position.z - baseWidth / 2);
        p.cone(trackBallBase, trackBallBase * 2); // Default potential box size
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