// Laser class

class Laser {
  constructor(gameState) {
    this.gameState = gameState;
    this.y = -200; // Height of the laser beam
    this.lifespan = 60;
    this.radius = CONFIG.ENEMY_RADIUS * 0.6; // Radius of the circular laser beam
  }

  update() {
    this.lifespan--;
    for (let enemy of this.gameState.enemies) {
      if (abs(enemy.y - this.y) < 20) {
        enemy.health -= CONFIG.LASER.DAMAGE;
      }
    }
  }

  show() {
    push();
    translate(0, this.y, 0);
    noFill();
    stroke(255, 0, 0, this.lifespan * 4);
    strokeWeight(4);
    
    // Draw circular laser beam
    beginShape();
    for (let angle = 0; angle <= TWO_PI; angle += 0.1) {
      let x = cos(angle) * this.radius;
      let z = sin(angle) * this.radius;
      vertex(x, 0, z);
    }
    endShape(CLOSE);
    
    pop();
  }
}