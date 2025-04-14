// Bullet Module

import CONFIG from '../../config.js';
import { Airstrike } from './airstrike.js';
import { Turret } from './turret.js';
import { Wave } from './wave.js';
import { checkBulletBossCollisions } from '../managers/bossManager.js';

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
      } else {
        // If no target, use the angle to determine direction
        this.vx = Math.cos(angle) * this.speed;
        this.vy = 0; // No vertical movement
        this.vz = Math.sin(angle) * this.speed;
      }
    }
  }

  update() {
    // Move bullet along direction vector
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Check collision with bosses first (priority targets)
    if (this.gameState.bosses && this.gameState.bosses.length > 0) {
      // Use the boss manager to check collisions
      const hitBoss = checkBulletBossCollisions(this, this.gameState);
      if (hitBoss) {
        return true; // Bullet hit a boss
      }
    }
    
    // Check collision with regular enemies
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        let d = dist(this.x, this.z, enemy.x, enemy.z);
  
        // Check if bullet is at right height to hit enemy
        if (d < enemy.width * 1.5 &&
            this.y < enemy.y + enemy.height &&
            this.y > enemy.y) {
          // Ensure damage is a valid number
          const damage = isNaN(this.damage) ? CONFIG.BULLET.PLAYER.DAMAGE : this.damage;
          // Use the takeDamage method on the enemy
          enemy.takeDamage(damage);
          return true; // Bullet hit something
        }
      }
    }

    // Check if bullet is too far or hit ground
    let distance = dist(0, 0, this.x, this.z);
    if (distance > CONFIG.WORLD_RADIUS || this.y > 50) {
      // Handle airstrike bombs hitting the ground or exploding
      if (this.source instanceof Airstrike && this.y > 50) {
        // Create explosion wave effect
        this.gameState.waves.push(new Wave(this.x, 50, this.z, 0, [255, 100, 50, 200], this.gameState));
        
        // Apply area damage to enemies within blast radius if it's an airstrike bomb
        if (this.isAirstrikeBomb && this.gameState.enemyController) {
          const enemies = this.gameState.enemyController.getEnemies();
          for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            // Calculate distance from explosion to enemy
            let explosionDist = dist(this.x, this.z, enemy.x, enemy.z);
            
            // Check if enemy is within blast radius
            if (explosionDist < this.blastRadius) {
              // Calculate damage falloff based on distance (more damage closer to center)
              let damageMultiplier = 1 - (explosionDist / this.blastRadius);
              let explosionDamage = this.damage * damageMultiplier;
              
              // Apply damage to enemy
              enemy.takeDamage(explosionDamage);
            }
          }
        }
      }
      return true; // Bullet out of range or hit ground
    }

    return false; // Bullet still active
  }

  show() {
    push();
    noStroke();
    translate(this.x, this.y, this.z);
    
    // Special rendering for airstrike bombs
    if (this.isAirstrikeBomb) {
      // Bomb body
      fill(50, 50, 50);
      push();
      rotateX(HALF_PI);
      ellipsoid(this.size / 6, this.size / 3, this.size / 6);
      pop();
      
      // Bomb fins
      fill(70, 70, 70);
      push();
      translate(0, this.size / 4, 0);
      rotateX(HALF_PI);
      cone(this.size / 8, this.size / 6);
      pop();
      
      // Add blinking red light for dramatic effect
      if (this.gameState.frameCount % 10 < 5) {
        fill(255, 0, 0);
        push();
        translate(0, -this.size / 6, 0);
        sphere(this.size / 15);
        pop();
      }
    } else {
      // Regular bullet rendering
      fill(...this.color);
      rotateX(HALF_PI);
      cylinder(this.size / 3, this.size);
    }
    
    pop();
  }
}