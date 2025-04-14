// Laser Module

import CONFIG from '../../config.js';

export class Laser {
  constructor(gameState) {
    this.gameState = gameState;
    this.y = -200; // Height of the laser beam
    this.lifespan = 60;
    this.radius = CONFIG.ENEMY_RADIUS * 0.6; // Radius of the circular laser beam
  }

  update() {
    this.lifespan--;
    
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let enemy of enemies) {
        if (abs(enemy.y - this.y) < 20) {
          enemy.takeDamage(CONFIG.LASER.DAMAGE);
        }
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