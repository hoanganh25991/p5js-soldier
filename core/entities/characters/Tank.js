// Tank Character Class
// Implements the Tank character with long-range attacks

import { Character } from './Character.js';
import { Bullet } from '../bullet.js';
import { Projectile } from '../projectile.js';

export class Tank extends Character {
  constructor(x, y, z, gameState) {
    super(x, y, z, 'TANK', gameState);
    
    // Set Tank-specific attack range
    this.attackRange = 600; // Long-range attack as requested
  }
  
  drawCharacter() {
    this.drawTank();
  }
  
  drawTank() {
    const attackingEffect = this.getAttackingEffect();
    
    push();
    // Tank body
    fill(100, 100, 100); // Darker gray for tank body
    box(this.width * 1.2, this.height * 0.5, this.depth * 1.2);
    
    // Tank treads (left)
    push();
    translate(-this.width * 0.6, this.height * 0.1, 0);
    fill(50, 50, 50);
    box(this.width * 0.1, this.height * 0.3, this.depth * 1.3);
    // Tread details
    for (let i = -5; i <= 5; i++) {
      push();
      translate(0, 0, i * this.depth * 0.1);
      rotateX(HALF_PI);
      fill(30, 30, 30);
      cylinder(this.width * 0.05, this.width * 0.1);
      pop();
    }
    pop();
    
    // Tank treads (right)
    push();
    translate(this.width * 0.6, this.height * 0.1, 0);
    fill(50, 50, 50);
    box(this.width * 0.1, this.height * 0.3, this.depth * 1.3);
    // Tread details
    for (let i = -5; i <= 5; i++) {
      push();
      translate(0, 0, i * this.depth * 0.1);
      rotateX(HALF_PI);
      fill(30, 30, 30);
      cylinder(this.width * 0.05, this.width * 0.1);
      pop();
    }
    pop();
    
    // Tank turret with rotation based on target direction
    push();
    translate(0, -this.height * 0.3, 0);
    rotateY(this.rotation);
    
    // Turret base
    fill(70, 70, 70);
    sphere(this.width * 0.4);
    
    // Turret body
    push();
    translate(0, -this.height * 0.1, 0);
    fill(60, 60, 60);
    box(this.width * 0.7, this.height * 0.2, this.depth * 0.7);
    pop();
    
    // Tank gun with recoil animation
    push();
    translate(this.width * 0.5 - attackingEffect * this.width, 0, 0);
    fill(50, 50, 50);
    rotateZ(HALF_PI);
    cylinder(this.width * 0.1, this.depth * 1.2);
    
    // Gun muzzle
    translate(0, 0, this.depth * 0.7);
    fill(40, 40, 40);
    cylinder(this.width * 0.12, this.width * 0.1);
    
    // Muzzle flash when firing
    if (this.attackCooldown < 5) {
      translate(0, 0, this.width * 0.1);
      fill(255, 200, 50, 200 - this.attackCooldown * 40);
      sphere(this.width * 0.2 * (5 - this.attackCooldown) / 5);
    }
    pop();
    pop();
    pop();
  }
  
  attack(target) {
    // Tank fires a shell at the target
    const shellX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.7;
    const shellY = this.y - this.height * 0.3;
    const shellZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.7;
    
    // Create visible projectile
    const tankShell = new Projectile(
      shellX,
      shellY,
      shellZ,
      this.rotation - HALF_PI,
      'TANK_SHELL',
      this,
      this.gameState
    );
    
    // Add to projectiles array
    this.projectiles.push(tankShell);
    
    // Also add to gameState bullets for backward compatibility
    const tankBullet = new Bullet(
      shellX, 
      shellY, 
      shellZ, 
      this.rotation - HALF_PI, 
      target, 
      this, 
      this.gameState
    );
    
    tankBullet.damage = this.damage;
    tankBullet.size = 8;
    tankBullet.color = [100, 100, 100];
    
    // If we have a target, the bullet will already have velocity set
    // If not, we need to set it manually
    if (!target) {
      const bulletSpeed = 20;
      tankBullet.vx = Math.cos(this.rotation - HALF_PI) * bulletSpeed;
      tankBullet.vy = 0; // No vertical movement
      tankBullet.vz = Math.sin(this.rotation - HALF_PI) * bulletSpeed;
    }
    
    this.gameState.bullets.push(tankBullet);
  }
  
  useSpecialAbility() {
    // Tank fires multiple shells in different directions
    for (let i = 0; i < 6; i++) {
      const angle = this.rotation - HALF_PI + (i - 2.5) * 0.2;
      const shellX = this.x + Math.cos(angle) * this.width * 0.7;
      const shellY = this.y - this.height * 0.3;
      const shellZ = this.z + Math.sin(angle) * this.width * 0.7;
      
      // Create visible projectile
      const tankShell = new Projectile(
        shellX,
        shellY,
        shellZ,
        angle,
        'TANK_SHELL',
        this,
        this.gameState
      );
      
      // Add to projectiles array
      this.projectiles.push(tankShell);
      
      // Also add to gameState bullets for backward compatibility
      const tankBullet = new Bullet(
        shellX, 
        shellY, 
        shellZ, 
        angle, 
        null, 
        this, 
        this.gameState
      );
      tankBullet.damage = this.damage * 0.5;
      tankBullet.size = 8;
      tankBullet.color = [100, 100, 100];
      tankBullet.vx = Math.cos(angle) * 20;
      tankBullet.vz = Math.sin(angle) * 20;
      this.gameState.bullets.push(tankBullet);
    }
  }
}