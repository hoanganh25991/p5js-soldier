// Wave class

class Wave {
  constructor(x, z, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.z = z;
    this.rings = [
      { radius: 0, speed: CONFIG.AIRSTRIKE.BLAST_RADIUS / 10 },
      { radius: 0, speed: CONFIG.AIRSTRIKE.BLAST_RADIUS / 15 },
      { radius: 0, speed: CONFIG.AIRSTRIKE.BLAST_RADIUS / 20 }
    ];
    this.maxRadius = CONFIG.AIRSTRIKE.BLAST_RADIUS;
    this.lifespan = 30; // Duration in frames
  }

  update() {
    this.lifespan--;
    for (let ring of this.rings) {
      if (ring.radius < this.maxRadius) {
        ring.radius += ring.speed;
      }
    }
    return this.lifespan <= 0;
  }

  show() {
    push();
    translate(this.x, 49, this.z); // Just above ground level
    noFill();

    // Draw multiple expanding rings
    for (let i = 0; i < this.rings.length; i++) {
      let alpha = map(this.lifespan, 30, 0, 255, 0);
      stroke(255, 255, 255, alpha * (1 - i * 0.2)); // Fade out outer rings
      strokeWeight(3 - i); // Thinner outer rings

      // Draw continuous ring
      beginShape();
      for (let angle = 0; angle <= TWO_PI; angle += 0.1) {
        let r = this.rings[i].radius;
        let x = cos(angle) * r;
        let z = sin(angle) * r;
        vertex(x, 0, z);
      }
      endShape(CLOSE);
    }
    pop();
  }
}