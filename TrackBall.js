class TrackBall {
  constructor(position, pitch, distance, duration) {
    this.x = position.x;
    this.y = -pitch - 10;
    this.z = position.z;
    this.targetX = position.x + distance;
    this.reachedTarget = false;
    this.velocity = distance / duration;
  }

  updatePosition() {
      if (this.x <= this.targetX) {
          this.x += this.velocity / 60;
      } else {
          this.x = this.targetX;
      }
      // Check if the target is reached
      if (this.x >= this.targetX - 0.5) {
          this.reachedTarget = true;
      } else {
          this.reachedTarget = false;
      }
    }

  display() {
    if (this.reachedTarget) return;
    push();
    translate(this.x, this.y, this.z);
    fill(235, 229, 114, 200);
    stroke(255, 255, 255);
    cone(10, 20);
    pop();
  }
}