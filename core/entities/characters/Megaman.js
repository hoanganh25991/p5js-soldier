// Megaman Character Class
// Implements the Megaman character with ranged attacks

import { Character } from './Character.js';
import { Bullet } from '../bullet.js';
import { Projectile } from '../projectile.js';

export class Megaman extends Character {
  constructor(x, y, z, gameState) {
    super(x, y, z, 'MEGAMAN', gameState);
    
    // Set Megaman-specific attack range
    this.attackRange = 400; // Medium-range attack (adjusted from 600)
  }
  
  drawCharacter() {
    this.drawMegaman();
  }
  
  drawMegaman() {
    const walkingEffect = this.getWalkingEffect();
    const attackingEffect = this.getAttackingEffect();
    
    push();
    // Legs with walking animation
    push();
    translate(0, this.height * 0.3, 0);
    
    // Left leg
    push();
    translate(-this.width * 0.15, 0, 0);
    rotateX(walkingEffect);
    fill(0, 0, 150); // Dark blue legs
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Boot
    translate(0, this.height * 0.2, 0);
    fill(0, 200, 255); // Light blue boots
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.15, 0, 0);
    rotateX(-walkingEffect);
    fill(0, 0, 150); // Dark blue legs
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Boot
    translate(0, this.height * 0.2, 0);
    fill(0, 200, 255); // Light blue boots
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    pop();
    
    // Torso
    push();
    translate(0, 0, 0);
    fill(0, 150, 255); // Medium blue body
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.4);
    
    // Chest details
    push();
    translate(0, -this.height * 0.05, -this.depth * 0.15);
    fill(0, 200, 255); // Light blue chest
    box(this.width * 0.4, this.height * 0.2, this.depth * 0.1);
    pop();
    pop();
    
    // Head
    push();
    translate(0, -this.height * 0.3, 0);
    
    // Helmet
    fill(0, 150, 255); // Medium blue helmet
    sphere(this.width * 0.3);
    
    // Face
    push();
    translate(0, 0, this.depth * 0.15);
    fill(255, 220, 180); // Skin tone
    box(this.width * 0.4, this.height * 0.25, this.depth * 0.2);
    
    // Eyes
    push();
    translate(-this.width * 0.1, -this.width * 0.05, this.depth * 0.1);
    fill(255);
    sphere(this.width * 0.05);
    
    // Pupil
    push();
    translate(0, 0, this.width * 0.02);
    fill(0);
    sphere(this.width * 0.02);
    pop();
    pop();
    
    push();
    translate(this.width * 0.1, -this.width * 0.05, this.depth * 0.1);
    fill(255);
    sphere(this.width * 0.05);
    
    // Pupil
    push();
    translate(0, 0, this.width * 0.02);
    fill(0);
    sphere(this.width * 0.02);
    pop();
    pop();
    
    // Mouth
    push();
    translate(0, this.width * 0.1, this.depth * 0.1);
    fill(50, 50, 50);
    box(this.width * 0.2, this.height * 0.02, this.depth * 0.01);
    pop();
    pop();
    
    // Helmet details
    push();
    translate(0, -this.height * 0.15, 0);
    fill(0, 200, 255); // Light blue helmet top
    box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
    pop();
    
    // Ear pieces
    push();
    translate(-this.width * 0.3, 0, 0);
    fill(0, 200, 255); // Light blue ear pieces
    box(this.width * 0.1, this.height * 0.15, this.depth * 0.1);
    pop();
    
    push();
    translate(this.width * 0.3, 0, 0);
    fill(0, 200, 255); // Light blue ear pieces
    box(this.width * 0.1, this.height * 0.15, this.depth * 0.1);
    pop();
    pop();
    
    // Arms
    // Left arm (normal arm)
    push();
    translate(-this.width * 0.4, -this.height * 0.05, 0);
    rotateZ(-PI/8 + sin(this.animationFrame) * 0.3);
    fill(0, 150, 255); // Medium blue arm
    box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
    
    // Hand
    translate(0, this.height * 0.2, 0);
    fill(255, 255, 255); // White glove
    sphere(this.width * 0.12);
    pop();
    
    // Right arm (buster arm) with attack animation
    push();
    translate(this.width * 0.4, -this.height * 0.05, 0);
    
    // Arm position based on attack state
    if (this.attackCooldown < 15) {
      // Attack animation - arm extended forward
      rotateZ(PI/8);
      rotateY(-PI/4);
    } else {
      // Normal position
      rotateZ(PI/8 - sin(this.animationFrame) * 0.3);
    }
    
    fill(0, 150, 255); // Medium blue arm
    box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
    
    // Buster cannon
    translate(0, this.height * 0.2, 0);
    fill(100, 100, 100); // Gray buster
    
    // Buster base
    push();
    rotateZ(HALF_PI);
    cylinder(this.width * 0.15, this.width * 0.3);
    pop();
    
    // Buster barrel
    push();
    translate(this.width * 0.2, 0, 0);
    rotateZ(HALF_PI);
    fill(50, 50, 50); // Darker gray barrel
    cylinder(this.width * 0.1, this.width * 0.2);
    
    // Muzzle flash during attack
    if (this.attackCooldown < 5) {
      translate(0, 0, 0);
      fill(0, 200, 255, 200 - this.attackCooldown * 40); // Blue energy
      sphere(this.width * 0.15 * (5 - this.attackCooldown) / 5);
    }
    pop();
    pop();
    pop();
  }
  
  attack(target) {
    // Megaman fires visible blasts from arm cannon
    const megamanArmX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.5;
    const megamanArmY = this.y - this.height * 0.2;
    const megamanArmZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.5;
    
    // Triple shot with visible projectiles
    for (let i = 0; i < 3; i++) {
      const spread = (i - 1) * 0.1;
      const blastAngle = this.rotation - HALF_PI + spread;
      
      // Create visible projectile
      const megaBlast = new Projectile(
        megamanArmX,
        megamanArmY,
        megamanArmZ,
        blastAngle,
        'MEGAMAN_BLAST',
        this,
        this.gameState
      );
      
      // Adjust damage for multiple shots
      megaBlast.damage = this.damage / 3;
      
      // Add to projectiles array
      this.projectiles.push(megaBlast);
      
      // Also add to gameState bullets for backward compatibility
      const megamanBullet = new Bullet(
        megamanArmX, 
        megamanArmY, 
        megamanArmZ, 
        blastAngle, 
        target, 
        this, 
        this.gameState
      );
      
      megamanBullet.damage = this.damage / 3;
      megamanBullet.size = 6;
      megamanBullet.color = [0, 200, 255];
      
      // If we have a target, the bullet will already have velocity set
      // If not, we need to set it manually
      if (!target) {
        const bulletSpeed = 25;
        megamanBullet.vx = Math.cos(blastAngle) * bulletSpeed;
        megamanBullet.vy = 0; // No vertical movement
        megamanBullet.vz = Math.sin(blastAngle) * bulletSpeed;
      }
      
      this.gameState.bullets.push(megamanBullet);
    }
  }
  
  useSpecialAbility() {
    // Megaman fires a large blast - use projectiles instead of waves
    const megaBlastX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.5;
    const megaBlastY = this.y - this.height * 0.2;
    const megaBlastZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.5;
    
    // Create a large projectile
    const megaBlast = new Projectile(
      megaBlastX,
      megaBlastY,
      megaBlastZ,
      this.rotation - HALF_PI,
      'MEGAMAN_BLAST',
      this,
      this.gameState
    );
    
    // Make it larger and more powerful
    megaBlast.size = 25;
    megaBlast.damage = this.damage * 2;
    megaBlast.speed = 20;
    
    // Add to projectiles array
    this.projectiles.push(megaBlast);
    
    // Also add to gameState bullets for backward compatibility
    const megaBullet = new Bullet(
      megaBlastX, 
      megaBlastY, 
      megaBlastZ, 
      this.rotation - HALF_PI, 
      null, 
      this, 
      this.gameState
    );
    megaBullet.damage = this.damage * 2;
    megaBullet.size = 15;
    megaBullet.color = [0, 200, 255];
    megaBullet.vx = Math.cos(this.rotation - HALF_PI) * 20;
    megaBullet.vz = Math.sin(this.rotation - HALF_PI) * 20;
    this.gameState.bullets.push(megaBullet);
  }
}