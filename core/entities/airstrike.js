// Airstrike Module

import CONFIG from '../../config.js';
import { Bullet } from './bullet.js';

export class Airstrike {
  constructor(gameState) {
    this.gameState = gameState;
    this.x = -CONFIG.ENEMY_RADIUS;
    this.y = -700; // Even higher above towers
    this.z = 0;
    this.speed = CONFIG.AIRSTRIKE.SPEED;
    this.damage = CONFIG.AIRSTRIKE.DAMAGE;
  }

  update() {
    this.x += this.speed;

    // Drop bombs periodically
    if (this.gameState.frameCount % CONFIG.AIRSTRIKE.BOMB_RATE === 0) {
      // Create bullet with no target, just straight down
      let bullet = new Bullet(this.x, this.y, this.z, 0, null, this, this.gameState);
      bullet.vy = 15; // Move downward much faster
      bullet.vx = this.speed * 0.5; // Keep some forward momentum
      this.gameState.bullets.push(bullet);
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    fill(150);

    // Simple box airplane
    box(80, 20, 60);

    pop();
  }
}