class TrackBall {
  constructor(currentBox, nextBox, duration, moveDirection, distance) {
    this.x = currentBox.position.x + 10;
    this.y = -currentBox.pitch - 10;
    this.z = currentBox.position.z - baseWidth / 2;
    this.targetX = nextBox.position.x;
    this.targetY = -nextBox.pitch - 10;

    this.reachedTarget = false;
    this.isJumping = false;

    this.duration = duration;
    this.direction = moveDirection;
    this.distance = distance;
    this.angle = 0;
    // this.distance = distance;
    // this.velocity = distance / duration;
  }

  updatePosition() {
    let distance;
    let velocityX;
    let velocityY;
    //console.log(`direction: ${this.direction} x: ${this.x} distance: ${this.distance}`)
    switch (this.direction) {
      case BoxSide.RIGHT:
        distance = this.targetX - this.x;
        velocityX = (distance + 20) / this.duration / 60;
        velocityY = (this.y - this.targetY) / 10;

        console.log(`distance: ${distance} velocityX: ${velocityX} velocityY: ${velocityY}`)

        if (this.x + this.duration * baseWidth < this.targetX) {
          this.isJumping = true;
          this.jumpToRight(velocityX, velocityY)
        } else {
          this.isJumping = false;
          this.moveRight(velocityX);
        }
        
        break;
      // case BoxSide.LEFT:
      //   this.target = this.x - this.distance;
      //   this.goLeft();
      //   break;
      // case BoxSide.BACK:
      //   this.target = this.z - this.distance;
      //   this.goBack();
      //   break;
      // case BoxSide.FRONT: // Uncomment if you want to include the front side
      // this.target = this.z + this.distance;
      // this.goFront();
      //   break;
      // default:
      //   potentialPosition = null;
    }
  }

  jumpToRight(velocityX, velocityY) {
      this.x += velocityX;
      this.y -= velocityY;
    
  }

  moveRight(velocityX) {
    if (this.x + 10 <= this.targetX) {
      this.x += velocityX;
    } else {
      this.x = this.targetX;
      this.reachedTarget = true;
    }
  }

  // goLeft() {
  //   if (this.x >= this.target) {
  //     this.x -= this.velocity / 60;
  //   } else {
  //     this.x = this.target;
  //   }
  //   // Check if the target is reached
  //   if (this.x <= this.target - 1) {
  //     this.reachedTarget = true;
  //   } else {
  //     this.reachedTarget = false;
  //   }
  // }

  // goFront() {
  //   if (this.z <= this.target) {
  //     this.z += this.velocity / 60;
  //   } else {
  //     this.z = this.target;
  //   }
  //   // Check if the target is reached
  //   if (this.z <= this.target - 1) {
  //     this.reachedTarget = true;
  //   } else {
  //     this.reachedTarget = false;
  //   }
  // }

  // goBack() {
  //   if (this.z >= this.target) {
  //     this.z -= this.velocity / 60;
  //   } else {
  //     this.z = this.target;
  //   }
  //   // Check if the target is reached
  //   if (this.z <= this.target - 1) {
  //     this.reachedTarget = true;
  //   } else {
  //     this.reachedTarget = false;
  //   }
  // }

  display(p) {
    if (this.reachedTarget) return;
    p.push();
    p.translate(this.x, this.y, this.z);
    if (this.isJumping) {
      p.rotateZ(this.angle);
    }
    
    p.fill(235, 229, 114, 200);
    p.stroke(255, 255, 255);
    p.box(20);
    p.pop();

    this.angle += 3 / 10;
  }
}