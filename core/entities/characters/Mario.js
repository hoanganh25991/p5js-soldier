// Mario Character Class
// Implements the Mario character with jumping attacks

import { Character } from './Character.js';
import { Bullet } from '../bullet.js';
import { Wave } from '../wave.js';

export class Mario extends Character {
  constructor(x, y, z, gameState) {
    super(x, y, z, 'MARIO', gameState);
    
    // Set Mario-specific attack range
    this.attackRange = 100; // Melee attack range as in original
  }
  
  drawCharacter() {
    this.drawMario();
  }
  
  drawMario() {
    const walkingEffect = this.getWalkingEffect();
    
    push();
    // Legs with jumping animation
    push();
    translate(0, this.height * 0.3, 0);
    
    // Left leg
    push();
    translate(-this.width * 0.15, 0, 0);
    if (this.attackCooldown < 20) {
      // Jumping animation
      rotateX(-PI/4);
    } else {
      rotateX(walkingEffect);
    }
    fill(0, 0, 200); // Blue overalls
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Shoe
    translate(0, this.height * 0.2, 0);
    fill(100, 50, 0); // Brown shoes
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.15, 0, 0);
    if (this.attackCooldown < 20) {
      // Jumping animation
      rotateX(-PI/4);
    } else {
      rotateX(-walkingEffect);
    }
    fill(0, 0, 200); // Blue overalls
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Shoe
    translate(0, this.height * 0.2, 0);
    fill(100, 50, 0); // Brown shoes
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    pop();
    
    // Torso
    push();
    translate(0, 0, 0);
    fill(255, 50, 50); // Red shirt
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.4);
    
    // Overalls front
    push();
    translate(0, 0, -this.depth * 0.15);
    fill(0, 0, 200); // Blue overalls
    box(this.width * 0.4, this.height * 0.3, this.depth * 0.1);
    pop();
    
    // Buttons
    push();
    translate(-this.width * 0.1, 0, -this.depth * 0.25);
    fill(255, 255, 0); // Yellow buttons
    sphere(this.width * 0.05);
    pop();
    
    push();
    translate(this.width * 0.1, 0, -this.depth * 0.25);
    fill(255, 255, 0); // Yellow buttons
    sphere(this.width * 0.05);
    pop();
    pop();
    
    // Head
    push();
    translate(0, -this.height * 0.3, 0);
    fill(255, 200, 160); // Skin tone
    sphere(this.width * 0.3);
    
    // Cap
    push();
    translate(0, -this.width * 0.15, 0);
    fill(255, 50, 50); // Red cap
    
    // Cap base
    push();
    rotateX(PI/2);
    cylinder(this.width * 0.32, this.height * 0.1);
    pop();
    
    // Cap top
    push();
    translate(0, -this.height * 0.05, 0);
    sphere(this.width * 0.3);
    pop();
    
    // Cap brim
    push();
    translate(0, 0, this.depth * 0.2);
    rotateX(PI/2);
    fill(255, 50, 50); // Red
    cylinder(this.width * 0.05, this.width * 0.4);
    pop();
    
    // M logo
    push();
    translate(0, 0, this.depth * 0.32);
    fill(255); // White circle
    circle(0, 0, this.width * 0.2);
    
    // M letter
    fill(255, 50, 50); // Red M
    textSize(this.width * 0.2);
    textAlign(CENTER, CENTER);
    text("M", 0, 0);
    pop();
    pop();
    
    // Face features
    // Mustache
    push();
    translate(0, this.width * 0.05, this.depth * 0.2);
    fill(0);
    box(this.width * 0.4, this.height * 0.05, this.depth * 0.1);
    pop();
    
    // Eyes
    push();
    translate(-this.width * 0.1, -this.width * 0.05, this.depth * 0.25);
    fill(255);
    sphere(this.width * 0.08);
    
    // Pupil
    push();
    translate(0, 0, this.width * 0.05);
    fill(0, 0, 200); // Blue eyes
    sphere(this.width * 0.04);
    pop();
    pop();
    
    push();
    translate(this.width * 0.1, -this.width * 0.05, this.depth * 0.25);
    fill(255);
    sphere(this.width * 0.08);
    
    // Pupil
    push();
    translate(0, 0, this.width * 0.05);
    fill(0, 0, 200); // Blue eyes
    sphere(this.width * 0.04);
    pop();
    pop();
    
    // Nose
    push();
    translate(0, this.width * 0.05, this.depth * 0.3);
    fill(255, 150, 100);
    sphere(this.width * 0.1);
    pop();
    pop();
    
    // Arms with jumping animation
    // Left arm
    push();
    translate(-this.width * 0.4, -this.height * 0.05, 0);
    
    // Arm position based on attack state
    if (this.attackCooldown < 20) {
      // Jumping animation - arms up
      rotateZ(-PI/2);
    } else {
      // Walking animation
      rotateZ(-PI/8 + sin(this.animationFrame) * 0.3);
    }
    
    fill(255, 50, 50); // Red shirt
    box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
    
    // Hand
    translate(0, this.height * 0.2, 0);
    fill(255, 200, 160); // Skin tone
    sphere(this.width * 0.12);
    pop();
    
    // Right arm
    push();
    translate(this.width * 0.4, -this.height * 0.05, 0);
    
    // Arm position based on attack state
    if (this.attackCooldown < 20) {
      // Jumping animation - arms up
      rotateZ(PI/2);
    } else {
      // Walking animation
      rotateZ(PI/8 - sin(this.animationFrame) * 0.3);
    }
    
    fill(255, 50, 50); // Red shirt
    box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
    
    // Hand
    translate(0, this.height * 0.2, 0);
    fill(255, 200, 160); // Skin tone
    sphere(this.width * 0.12);
    pop();
    pop();
  }
  
  attack(target) {
    // Mario jumps on enemies
    // Start a jump if not already jumping
    if (!this.isJumping) {
      this.isJumping = true;
      this.velocityY = -10; // Jump upward
      
      // If target is in range, damage it
      if (dist(this.x, this.z, target.x, target.z) < this.attackRange) {
        target.health -= this.damage;
        
        // Simplified impact effect - smaller and shorter-lived
        if (frameCount % 2 === 0) { // Only create wave on every other frame
          const simpleWave = new Wave(
            target.x, 
            target.y, 
            target.z, 
            this.width * 0.6, // Smaller radius
            [255, 50, 50, 120] // More transparent
          );
          simpleWave.lifespan = 15; // Shorter lifespan (half of default)
          simpleWave.growthRate = 5; // Slower growth
          this.gameState.waves.push(simpleWave);
        }
      }
    }
  }
  
  useSpecialAbility() {
    // Mario throws fireballs in fewer directions (reduced from 8 to 4)
    for (let i = 0; i < 4; i++) { // Reduced from 8 to 4 directions
      const angle = i * TWO_PI / 4;
      // Set properties before creating the bullet
      const bulletSpeed = 15;
      const bulletDamage = this.damage * 0.8; // Increased damage to compensate for fewer bullets
      const bulletSize = 6; // Slightly larger to be more visible
      const bulletColor = [255, 100, 0];
      
      // Create the bullet with these properties
      const marioBullet = new Bullet(
        this.x, 
        this.y, 
        this.z, 
        angle, 
        null, // No specific target
        this, 
        this.gameState
      );
      
      // Set additional properties
      marioBullet.damage = bulletDamage;
      marioBullet.size = bulletSize;
      marioBullet.color = bulletColor;
      
      // Recalculate velocity based on new speed
      marioBullet.vx = Math.cos(angle) * bulletSpeed;
      marioBullet.vy = 0; // No vertical movement
      marioBullet.vz = Math.sin(angle) * bulletSpeed;
      
      this.gameState.bullets.push(marioBullet);
    }
  }
}