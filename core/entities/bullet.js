// Bullet Module

import CONFIG from '../config.js';
import { Airstrike } from './airstrike.js';
import { Turret } from './turret.js';
import { Wave } from './wave.js';

export class Bullet {
  constructor(x, y, z, angle, target, source = null, gameState) {
    this.gameState = gameState;
    // Starting position (gun)
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = angle;
    this.source = source;

    // Set bullet properties based on source
    if (source instanceof Airstrike) {
      this.speed = CONFIG.AIRSTRIKE.SPEED;
      this.size = CONFIG.AIRSTRIKE.BOMB_SIZE; // Much bigger bombs
      this.damage = source.damage;
      this.color = [255, 255, 255]; // White bombs
      // Velocity set by airstrike update
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
    } else {
      const bulletType = source instanceof Turret ? CONFIG.BULLET.TURRET : CONFIG.BULLET.PLAYER;
      this.speed = source instanceof Turret ? CONFIG.TURRET.BULLET_SPEED : bulletType.SPEED;
      this.size = bulletType.SIZE;
      this.damage = source ? source.damage : bulletType.DAMAGE;
      this.color = bulletType.COLOR;

      if (target) {
        // Calculate direction vector to target
        let targetY = target.y + target.height / 2; // Aim at enemy top half
        let dx = target.x - x;
        let dy = targetY - y;
        let dz = target.z - z;
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Normalize direction vector and multiply by speed
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        this.vz = (dz / dist) * this.speed;
      }
    }
  }

  update() {
    // Move bullet along direction vector
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Debug: Log bullet position every second
    if (this.gameState.frameCount % 60 === 0) {
      console.log(`Bullet at: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
      console.log(`Bullet velocity: ${this.vx.toFixed(2)}, ${this.vy.toFixed(2)}, ${this.vz.toFixed(2)}`);
    }

    // Check collision with enemies
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        let d = dist(this.x, this.z, enemy.x, enemy.z);
  
        // Check if bullet is at right height to hit enemy
        if (d < enemy.width * 1.5 &&
            this.y < enemy.y + enemy.height &&
            this.y > enemy.y) {
          console.log('Bullet hit enemy!');
          
          // Use the takeDamage method on the enemy
          if (enemy.takeDamage(this.damage)) {
            // Enemy died, will be removed by the controller in next update
          }
          
          return true; // Bullet hit something
        }
      }
    }

    // Check if bullet is too far or hit ground
    let distance = dist(0, 0, this.x, this.z);
    if (distance > CONFIG.WORLD_RADIUS || this.y > 50) {
      // Create wave effect if it's an airstrike bomb hitting the ground
      if (this.source instanceof Airstrike && this.y > 50) {
        this.gameState.waves.push(new Wave(this.x, this.z, this.gameState));
      }
      console.log(`Bullet removed at distance: ${distance.toFixed(0)}, height: ${this.y.toFixed(0)}`);
      return true; // Bullet out of range or hit ground
    }

    return false; // Bullet still active
  }

  show() {
    push();
    noStroke();
    translate(this.x, this.y, this.z);
    fill(...this.color);
    rotateX(HALF_PI);
    cylinder(this.size / 3, this.size);
    pop();
  }
}