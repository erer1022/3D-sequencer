class TrackBall {
  constructor(defaultPosition) {
    this.x = defaultPosition.x + baseWidth / 2;
    this.y = - baseWidth - trackBallBase / 2;
    this.z = defaultPosition.z - baseWidth / 2;
    //this.isJumping = false;
    this.angle = 0;
  }

  updatePosition(currentBox, nextBox, moveDirection, duration) {
    // set the ball at the center of the currentBox
    let currentX = currentBox.position.x + currentBox.duration * baseWidth / 2;
    let currentY = - currentBox.pitch - trackBallBase / 2;
    let currentZ = currentBox.position.z - baseWidth / 2;

    let targetX = nextBox.position.x + nextBox.duration * baseWidth / 2;
    let targetY = - nextBox.pitch - trackBallBase / 2;
    let targetZ = nextBox.position.z - baseWidth / 2;

    let velocityX = (targetX - currentX) / duration / 60;
    let velocityY = (targetY - currentY) / duration / 60;
    let velocityZ = (targetZ - currentZ) / duration / 60;

    
    switch (moveDirection) {
      case BoxSide.RIGHT:
        
        if(this.x < targetX) {
          // velocityX < 0
          console.log(`this.x ${this.x} targetX: ${targetX}`)
          this.isJumping = true;
          this.x += velocityX;
          this.y += velocityY;
        } else {
          this.isJumping = false;
          this.x = targetX;
          this.y = targetY;
        }
        break;

      case BoxSide.LEFT:
      if(this.x > targetX) {
        // velocityX < 0
        this.isJumping = true;
        this.x += velocityX;
        this.y += velocityY;
      } else {
        this.isJumping = false;
        this.x = targetX;
        this.y = targetY;
      }
      break;

      case BoxSide.FRONT:
        if(this.z < targetZ) {
          this.isJumping = true;
          this.z += velocityZ;
          this.y += velocityY;
        } else {
          this.isJumping = false;
          this.z = targetZ;
          this.y = targetY;
        }
        break;

      case BoxSide.BACK:
      if(this.z > targetZ) {
        this.isJumping = true;
        // velocityZ < 0
        this.z += velocityZ;
        this.y += velocityY;
      } else {
        this.isJumping = false;
        this.z = targetZ;
        this.y = targetY;
      }
      break;

    }
    
   }

  display(p) {
    //if (this.reachedTarget) return;
    p.push();
    p.translate(this.x, this.y, this.z);
    // if (this.isJumping) {
    //  p.rotateZ(this.angle);
    // }
    
    p.fill(252, 220, 242, 200);
    p.stroke(252, 220, 242);
    p.cone(trackBallBase / 2, trackBallBase);
    p.pop();

    this.angle += 1 / 100;
  }
}