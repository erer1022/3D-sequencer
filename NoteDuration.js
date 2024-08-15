class NoteDuration {
    constructor(duration, noteBox) {
        this.duration = duration;
        this.w = duration * baseWidth;
        this.h = noteBox.pitch;
        // always above the currentChoosedBox
        this.x;
        this.y = noteBox.position.y;
        this.z = noteBox.position.z;
        this.translateY;
    }

    // Function to draw a box at a given position
    display(p) {
        this.setPosition(p);
        
        p.push();
        p.smooth();
        p.stroke(210);

        // set color effects
        if (this.isMouseOver(p)) {
            this.displayInfo(p);
          this.color = p.color(252, 227, 238, 150);
        } else {
          this.color = p.color(200, 200, 200);
        }

        if (this.y <= 0) {
          this.translateY = -this.y - this.h - sketch3DHeight / 2;
        } else {
          this.translateY = this.y - this.h - sketch3DHeight / 2;
        }
    
        p.fill(this.color);
        p.translate(this.x, this.translateY, this.z);
        p.box(this.w, this.h, baseWidth); // Adjust the box size based on the duration
        p.pop();
      }

      displayInfo(p) {
        if (this.y <= 0) {
          this.translateY = -this.y - this.h - sketch3DHeight / 2;
        } else {
          this.translateY = this.y - this.h - sketch3DHeight / 2;
        }


        p.push();
        p.translate(this.x + this.w, this.translateY, this.z);
        p.fill(110);
        p.textSize(20);
        p.text(`note\nduration:\n ${this.convertDurationToToneJS(this.duration)}`, 0, 0);
        p.pop();
      }

      setPosition(p) {
        switch (this.duration) {
            case 1:
            this.x = p.windowWidth / 3;
            break;

            case 1/2:
            this.x = p.windowWidth / 8;
            break;

            case 1/4:
            this.x = 0;
            break;

            case 1/8:
            this.x = -p.windowWidth / 8;
            break;

            case 1/16:
            this.x = -p.windowWidth / 4;
            break;
        }
      }

      isMouseOver(p) {

        if (this.y <= 0) {
          this.translateY = -this.y - this.h - sketch3DHeight / 2;
        } else {
          this.translateY = this.y - this.h - sketch3DHeight / 2;
        }

        let dToObj = p.dist(cam1.eyeX, cam1.eyeY, cam1.eyeZ, this.x + this.w / 2, this.translateY, this.z);
    
        if (p.dist(cam1.eyeX + x._data[0] * dToObj / xMag, 
                   cam1.eyeY + x._data[1] * dToObj / xMag, 
                   cam1.eyeZ + x._data[2] * dToObj / xMag, 
                   this.x + this.w / 2, this.translateY, this.z) < baseWidth / 3) {
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

     convertDurationToToneJS(duration) {
        const durationMap = {
          '1': "1n",
          '0.5': "2n",
          '0.25': "4n",
          '0.125': "8n",
          '0.0625': "16n"
        };
        return durationMap[duration.toString()];
      }
}