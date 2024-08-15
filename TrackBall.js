class TrackBall {
  constructor(defaultPosition) {
    this.x = defaultPosition.x + baseWidth / 2;
    this.y = defaultPosition.y - defaultPitch - trackBallBase;
    this.z = defaultPosition.z - baseWidth / 2;
    //this.isJumping = false;
    this.angle = 0;
    this.isReverseOrder;
  }

  updatePosition(p, currentBox, nextBox, t) {
    // Interpolate between currentBox and nextBox based on t (0 to 1)
    this.x = p.lerp(currentBox.position.x + currentBox.duration * baseWidth / 2, nextBox.position.x + nextBox.duration * baseWidth / 2, t);
    this.z = p.lerp(currentBox.position.z - baseWidth / 2, nextBox.position.z - baseWidth / 2, t);

    let currentBoxHeight = defaultPitch + (currentBox.pitch - defaultPitch) * 4;
    let nextBoxHeight = defaultPitch + (nextBox.pitch - defaultPitch) * 4
    // Interpolate y position smoothly
    if (t < 0.5) {
      this.y = p.lerp(currentBox.position.y - currentBoxHeight - trackBallBase, currentBox.position.y - currentBoxHeight - trackBallBase - 100, t * 2);
    } else {
      this.y = p.lerp(currentBox.position.y - currentBoxHeight - trackBallBase - 100, nextBox.position.y - nextBoxHeight - trackBallBase, (t - 0.5) * 2);
    }
  }

  display(p) {
    //if (this.reachedTarget) return;
    p.push();
    p.translate(this.x, this.y, this.z);
    // if (this.isJumping) {
    //  p.rotateZ(this.angle);
    // }
    
    p.fill(232, 202, 219, 200);
    p.stroke(232, 202, 219);
    p.cone(trackBallBase, trackBallBase * 2);
    p.pop();

    //this.angle += 1 / 100;
  }
}