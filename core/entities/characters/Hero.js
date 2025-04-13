// Hero Character Class
// Implements the Hero character with melee attacks

import { Character } from './Character.js';
import { Bullet } from '../bullet.js';
import { Wave } from '../wave.js';

export class Hero extends Character {
  constructor(x, y, z, gameState) {
    super(x, y, z, 'HERO', gameState);
    
    // Set Hero-specific attack range
    this.attackRange = 50; // Melee attack range as requested
  }
  
  drawCharacter() {
    this.drawHero();
  }
  
  drawHero() {
    const walkingEffect = this.getWalkingEffect();
    
    push();
    // Legs with walking animation
    push();
    translate(0, this.height * 0.3, 0);
    // Left leg
    push();
    translate(-this.width * 0.2, 0, 0);
    rotateX(walkingEffect);
    fill(50, 50, 150); // Dark blue pants
    box(this.width * 0.25, this.height * 0.5, this.depth * 0.25);
    // Boot
    translate(0, this.height * 0.3, 0);
    fill(70, 40, 0); // Brown boots
    box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.2, 0, 0);
    rotateX(-walkingEffect);
    fill(50, 50, 150); // Dark blue pants
    box(this.width * 0.25, this.height * 0.5, this.depth * 0.25);
    // Boot
    translate(0, this.height * 0.3, 0);
    fill(70, 40, 0); // Brown boots
    box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
    pop();
    pop();
    
    // Torso
    push();
    translate(0, 0, 0);
    fill(180, 180, 255); // Brighter blue for armor
    box(this.width * 0.8, this.height * 0.4, this.depth * 0.5);
    
    // Armor details
    push();
    translate(0, -this.height * 0.05, -this.depth * 0.2);
    fill(220, 220, 255); // Lighter blue for chest plate
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.1);
    pop();
    
    // Shoulder pads
    push();
    translate(-this.width * 0.5, -this.height * 0.1, 0);
    fill(200, 200, 255);
    sphere(this.width * 0.2);
    pop();
    
    push();
    translate(this.width * 0.5, -this.height * 0.1, 0);
    fill(200, 200, 255);
    sphere(this.width * 0.2);
    pop();
    pop();
    
    // Head
    push();
    translate(0, -this.height * 0.4, 0);
    fill(255, 220, 180); // Skin tone
    sphere(this.width * 0.25);
    
    // Helmet
    push();
    translate(0, -this.width * 0.1, 0);
    fill(220, 220, 255);
    box(this.width * 0.3, this.height * 0.2, this.depth * 0.3);
    pop();
    pop();
    
    // Arms
    // Left arm (shield arm)
    push();
    translate(-this.width * 0.5, -this.height * 0.1, 0);
    rotateX(walkingEffect * 0.5);
    fill(180, 180, 255);
    box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
    
    // Shield
    translate(-this.width * 0.2, this.height * 0.1, 0);
    fill(150, 150, 200);
    box(this.width * 0.1, this.height * 0.5, this.depth * 0.5);
    pop();
    
    // Right arm (sword arm) with attack animation
    push();
    translate(this.width * 0.5, -this.height * 0.1, 0);
    
    // Arm animation based on attack state
    if (this.attackCooldown < 15) {
      // Attack swing animation
      rotateZ(-PI / 4 - sin(frameCount * 0.5) * 1.5);
      rotateX(sin(frameCount * 0.5) * 0.5);
    } else {
      // Normal position
      rotateZ(-PI / 8 + sin(this.animationFrame) * 0.1);
    }
    
    fill(180, 180, 255);
    box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
    
    // Sword with glowing effect during attack
    translate(this.width * 0.1, -this.height * 0.3, 0);
    
    // Sword handle
    push();
    fill(70, 40, 0); // Brown handle
    box(this.width * 0.08, this.height * 0.2, this.width * 0.08);
    
    // Sword guard
    translate(0, -this.height * 0.12, 0);
    fill(200, 170, 0); // Gold guard
    box(this.width * 0.3, this.height * 0.05, this.width * 0.1);
    pop();
    
    // Sword blade with glow effect during attack
    push();
    translate(0, -this.height * 0.5, 0);
    
    // Glowing effect during attack
    if (this.attackCooldown < 15) {
      // Outer glow
      push();
      noStroke();
      fill(200, 200, 255, 100);
      box(this.width * 0.15, this.height * 0.8, this.width * 0.1);
      pop();
    }
    
    // Actual blade
    fill(220, 220, 220); // Silver
    box(this.width * 0.1, this.height * 0.8, this.width * 0.05);
    
    // Blade tip
    translate(0, -this.height * 0.4, 0);
    beginShape();
    vertex(-this.width * 0.05, 0, -this.width * 0.025);
    vertex(this.width * 0.05, 0, -this.width * 0.025);
    vertex(0, -this.height * 0.1, 0);
    vertex(-this.width * 0.05, 0, this.width * 0.025);
    vertex(this.width * 0.05, 0, this.width * 0.025);
    endShape(CLOSE);
    pop();
    
    pop();
    pop();
  }
  
  attack(target) {
    // Hero does a sword slash
    // Since this is a melee attack, we need to check if the target is within range
    if (dist(this.x, this.z, target.x, target.z) < this.width) {
      target.health -= this.damage;
      
      // Create a small impact wave
      const slashWave = new Wave(
        target.x, 
        target.y, 
        target.z, 
        this.width * 0.8, 
        [200, 200, 255, 150]
      );
      slashWave.lifespan = 20;
      slashWave.growthRate = 3;
      this.gameState.waves.push(slashWave);
    }
  }
  
  useSpecialAbility() {
    // Hero does a spinning sword attack - use projectiles instead of waves
    for (let i = 0; i < 8; i++) {
      const angle = i * TWO_PI / 8;
      const slashX = this.x + Math.cos(angle) * this.width;
      const slashY = this.y - this.height * 0.2;
      const slashZ = this.z + Math.sin(angle) * this.width;
      
      // Create a bullet for damage
      const heroBullet = new Bullet(
        slashX, 
        slashY, 
        slashZ, 
        angle, 
        null, 
        this, 
        this.gameState
      );
      heroBullet.damage = this.damage * 0.3;
      heroBullet.size = 5;
      heroBullet.color = [200, 200, 255];
      heroBullet.vx = Math.cos(angle) * 15;
      heroBullet.vz = Math.sin(angle) * 15;
      this.gameState.bullets.push(heroBullet);
    }
  }
}