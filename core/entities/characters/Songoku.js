// Songoku Character Class
// Implements the Songoku character with energy attacks

import { Character } from './Character.js';
import { Bullet } from '../bullet.js';
import { Projectile } from '../projectile.js';

export class Songoku extends Character {
  constructor(x, y, z, gameState) {
    super(x, y, z, 'SONGOKU', gameState);
    
    // Set Songoku-specific attack range
    this.attackRange = 300; // Medium-range attack as requested
  }
  
  drawCharacter() {
    this.drawSongoku();
  }
  
  drawSongoku() {
    const walkingEffect = this.getWalkingEffect();
    
    push();
    // Legs with walking animation
    push();
    translate(0, this.height * 0.3, 0);
    
    // Left leg
    push();
    translate(-this.width * 0.15, 0, 0);
    rotateX(walkingEffect);
    fill(255, 150, 0); // Orange gi pants
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Boot
    translate(0, this.height * 0.2, 0);
    fill(0, 0, 200); // Blue boots
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.15, 0, 0);
    rotateX(-walkingEffect);
    fill(255, 150, 0); // Orange gi pants
    box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
    
    // Boot
    translate(0, this.height * 0.2, 0);
    fill(0, 0, 200); // Blue boots
    box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
    pop();
    pop();
    
    // Torso
    push();
    translate(0, 0, 0);
    fill(255, 150, 0); // Orange gi
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.4);
    
    // Gi belt
    push();
    translate(0, this.height * 0.15, 0);
    fill(0, 0, 200); // Blue belt
    box(this.width * 0.6, this.height * 0.05, this.depth * 0.4);
    pop();
    
    // Gi symbol
    push();
    translate(0, -this.height * 0.05, -this.depth * 0.21);
    fill(255); // White circle
    circle(0, 0, this.width * 0.2);
    
    // Kanji
    fill(255, 0, 0); // Red kanji
    textSize(this.width * 0.15);
    textAlign(CENTER, CENTER);
    text("悟", 0, 0);
    pop();
    pop();
    
    // Head
    push();
    translate(0, -this.height * 0.3, 0);
    fill(255, 220, 180); // Skin tone
    sphere(this.width * 0.25);
    
    // Eyes
    push();
    translate(-this.width * 0.08, -this.width * 0.02, this.depth * 0.15);
    fill(0);
    sphere(this.width * 0.03);
    pop();
    
    push();
    translate(this.width * 0.08, -this.width * 0.02, this.depth * 0.15);
    fill(0);
    sphere(this.width * 0.03);
    pop();
    
    // Eyebrows
    push();
    translate(-this.width * 0.08, -this.width * 0.07, this.depth * 0.15);
    fill(0);
    box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
    pop();
    
    push();
    translate(this.width * 0.08, -this.width * 0.07, this.depth * 0.15);
    fill(0);
    box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
    pop();
    
    // Mouth
    push();
    translate(0, this.width * 0.1, this.depth * 0.2);
    fill(200, 100, 100);
    box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
    pop();
    
    // Spiky hair with animation
    push();
    translate(0, -this.height * 0.2, 0);
    
    // Hair color changes based on power level
    let hairColor;
    if (this.specialCooldown < 30 || this.attackCooldown < 10) {
      // Powered up - yellow hair
      hairColor = [255, 255, 0];
      
      // Energy aura
      push();
      noStroke();
      fill(255, 255, 100, 100);
      sphere(this.width * 0.6 + sin(frameCount * 0.2) * this.width * 0.1);
      pop();
    } else {
      // Normal - black hair
      hairColor = [0, 0, 0];
    }
    
    fill(hairColor);
    
    // Create spiky hair with animation
    for (let i = 0; i < 12; i++) {
      push();
      let angle = i * TWO_PI / 12;
      let spikeHeight = this.height * 0.3;
      
      // Add animation to hair
      if (this.specialCooldown < 30 || this.attackCooldown < 10) {
        spikeHeight += sin(frameCount * 0.2 + i) * this.height * 0.1;
      }
      
      translate(
        cos(angle) * this.width * 0.2, 
        -this.height * 0.1 + sin(frameCount * 0.1 + i) * 0.05, 
        sin(angle) * this.depth * 0.2
      );
      
      // Rotate spikes outward
      let rotX = atan2(sin(angle), 0);
      let rotZ = atan2(cos(angle), 1);
      rotateX(rotX);
      rotateZ(rotZ);
      
      // Draw spike
      cone(this.width * 0.1, spikeHeight);
      pop();
    }
    pop();
    pop();
    
    // Arms with fighting stance
    // Left arm
    push();
    translate(-this.width * 0.45, -this.height * 0.1, 0);
    
    // Arm position based on attack state
    if (this.attackCooldown < 15) {
      // Punching animation
      rotateZ(-PI/2 + sin(frameCount * 0.5) * 0.5);
      rotateX(sin(frameCount * 0.5) * 0.3);
    } else {
      // Fighting stance
      rotateZ(-PI/4 + sin(this.animationFrame) * 0.1);
    }
    
    fill(255, 150, 0); // Orange gi
    box(this.width * 0.2, this.height * 0.35, this.depth * 0.2);
    
    // Hand
    translate(0, this.height * 0.2, 0);
    fill(255, 220, 180); // Skin tone
    sphere(this.width * 0.15);
    
    // Energy effect on fist during attack
    if (this.attackCooldown < 15) {
      push();
      noStroke();
      fill(255, 255, 0, 150 - this.attackCooldown * 10);
      sphere(this.width * 0.2 + sin(frameCount * 0.5) * this.width * 0.05);
      pop();
    }
    pop();
    
    // Right arm
    push();
    translate(this.width * 0.45, -this.height * 0.1, 0);
    
    // Arm position based on attack state
    if (this.attackCooldown < 15) {
      // Kamehameha pose - both hands forward
      rotateZ(PI/2 - sin(frameCount * 0.5) * 0.5);
      rotateX(-sin(frameCount * 0.5) * 0.3);
    } else {
      // Fighting stance
      rotateZ(PI/4 - sin(this.animationFrame) * 0.1);
    }
    
    fill(255, 150, 0); // Orange gi
    box(this.width * 0.2, this.height * 0.35, this.depth * 0.2);
    
    // Hand
    translate(0, this.height * 0.2, 0);
    fill(255, 220, 180); // Skin tone
    sphere(this.width * 0.15);
    
    // Energy effect on hand during attack
    if (this.attackCooldown < 15) {
      push();
      noStroke();
      fill(255, 255, 0, 150 - this.attackCooldown * 10);
      sphere(this.width * 0.2 + sin(frameCount * 0.5) * this.width * 0.05);
      pop();
    }
    pop();
    pop();
  }
  
  attack(target) {
    // Songoku fires a visible kamehameha beam
    const gokuHandsX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.4;
    const gokuHandsY = this.y - this.height * 0.1;
    const gokuHandsZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.4;
    
    // Create visible kamehameha projectile
    const kamehameha = new Projectile(
      gokuHandsX,
      gokuHandsY,
      gokuHandsZ,
      this.rotation - HALF_PI,
      'SONGOKU_KAMEHAMEHA',
      this,
      this.gameState
    );
    
    // Add to projectiles array
    this.projectiles.push(kamehameha);
    
    // Also add to gameState bullets for backward compatibility
    const gokuBullet = new Bullet(
      gokuHandsX, 
      gokuHandsY, 
      gokuHandsZ, 
      this.rotation - HALF_PI, 
      target, 
      this, 
      this.gameState
    );
    
    gokuBullet.damage = this.damage;
    gokuBullet.size = 10;
    gokuBullet.color = [255, 255, 0];
    
    // If we have a target, the bullet will already have velocity set
    // If not, we need to set it manually
    if (!target) {
      const bulletSpeed = 30;
      gokuBullet.vx = Math.cos(this.rotation - HALF_PI) * bulletSpeed;
      gokuBullet.vy = 0; // No vertical movement
      gokuBullet.vz = Math.sin(this.rotation - HALF_PI) * bulletSpeed;
    }
    
    this.gameState.bullets.push(gokuBullet);
  }
  
  useSpecialAbility() {
    // Songoku fires a large kamehameha beam - use projectiles instead of waves
    const gokuHandsX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.4;
    const gokuHandsY = this.y - this.height * 0.1;
    const gokuHandsZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.4;
    
    // Create a large kamehameha projectile
    const kamehameha = new Projectile(
      gokuHandsX,
      gokuHandsY,
      gokuHandsZ,
      this.rotation - HALF_PI,
      'SONGOKU_KAMEHAMEHA',
      this,
      this.gameState
    );
    
    // Make it larger and more powerful
    kamehameha.size = 30;
    kamehameha.damage = this.damage * 3;
    kamehameha.speed = 25;
    
    // Add to projectiles array
    this.projectiles.push(kamehameha);
    
    // Also add to gameState bullets for backward compatibility
    const gokuBullet = new Bullet(
      gokuHandsX, 
      gokuHandsY, 
      gokuHandsZ, 
      this.rotation - HALF_PI, 
      null, 
      this, 
      this.gameState
    );
    gokuBullet.damage = this.damage * 3;
    gokuBullet.size = 20;
    gokuBullet.color = [255, 255, 0];
    gokuBullet.vx = Math.cos(this.rotation - HALF_PI) * 25;
    gokuBullet.vz = Math.sin(this.rotation - HALF_PI) * 25;
    this.gameState.bullets.push(gokuBullet);
  }
}