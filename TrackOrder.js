class TrackOrder {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.isReverse = false;
        this.color;
    }

    display(p) {

        if (this.isMouseOver(p)) {
            this.displayInfo(p);
        }

        if(this.isReverse) {
            this.color = p.color(100);
            p.fill(this.color);
        } else{
            this.color = p.color(240);
            p.fill(this.color);
        }
        p.noStroke();
        
        p.rect(this.x, this.y / 2, trackBallBase, trackBallBase, 5);

        p.noFill();
        p.stroke(this.color);
        p.strokeWeight(5);
        p.rect(this.x - 10, this.y / 2 - 10, trackBallBase * 1.5, trackBallBase * 1.5, 5);
    }

    isMouseOver(p) {
        if (p.dist(this.x, this.y, p.mouseX, p.mouseY) < trackBallBase * 2) {
            return true;
        } else {
            return false;
        }
    }

    displayInfo(p) {
        //p.push();
        p.fill(110);
        p.textSize(15);
        if (this.isReverse) {
            p.text(`reverse order`, this.x + trackBallBase * 5, this.y - trackBallBase * 1.5);
        } else {
            p.text(`forward order`, this.x + trackBallBase * 5, this.y - trackBallBase * 1.5);
        }
        
        //p.pop();
      }

   
}