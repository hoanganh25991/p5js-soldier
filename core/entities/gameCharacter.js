// Game Character Module
// Implements different game characters spawned by the GBA

import CONFIG from '../config.js';
import { findNearestEnemies } from '../utils.js';
import { Bullet } from './bullet.js';
import { Wave } from './wave.js';

export class GameCharacter {
  constructor(x, y, z, type, gameState) {
    this.gameState = gameState;
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Character type
    this.type = type;
    this.typeConfig = CONFIG.GBA.CHARACTER_TYPES[type];
    
    // Stats
    this.health = CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER;
    this.damage = this.typeConfig.DAMAGE;
    this.speed = this.typeConfig.SPEED;
    this.size = this.typeConfig.SIZE;
    
    // Dimensions based on size
    this.width = 20 * this.size;
    this.height = 40 * this.size;
    this.depth = 20 * this.size;
    
    // Combat
    this.attackRange = 100;
    this.attackCooldown = 0;
    this.attackRate = 60; // Frames between attacks
    
    // Animation
    this.rotation = 0;
    this.animationFrame = 0;
    this.animationSpeed = 0.1;
    
    // Lifespan
    this.lifespan = CONFIG.GBA.CHARACTER_DURATION;
    
    // Special abilities cooldown
    this.specialCooldown = 0;
    this.specialRate = 180; // 3 seconds between special abilities
  }
  
  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Find nearest enemy
    const target = this.findNearestEnemy();
    
    if (target) {
      // Calculate angle to target
      const angleToTarget = atan2(target.z - this.z, target.x - this.x);
      this.rotation = angleToTarget + HALF_PI;
      
      // Calculate distance to target
      const distToTarget = dist(this.x, this.z, target.x, target.z);
      
      if (distToTarget > this.attackRange) {
        // Move towards target if not in attack range
        this.x += cos(angleToTarget) * this.speed;
        this.z += sin(angleToTarget) * this.speed;
      } else {
        // Attack if in range and cooldown is ready
        if (this.attackCooldown <= 0) {
          this.attack(target);
          this.attackCooldown = this.attackRate;
        }
      }
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // Use special ability if cooldown is ready
    if (this.specialCooldown <= 0) {
      this.useSpecialAbility();
      this.specialCooldown = this.specialRate;
    }
    
    // Update animation
    this.animationFrame += this.animationSpeed;
  }
  
  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);
    
    // Base character body
    this.drawCharacter();
    
    // Health bar above character
    this.drawHealthBar();
    
    pop();
  }
  
  drawCharacter() {
    // Different appearance based on character type
    switch (this.type) {
      case 'TANK':
        // Tank - heavy, armored character
        fill(100, 100, 100); // Gray
        box(this.width * 1.2, this.height * 0.8, this.depth * 1.2);
        
        // Tank turret
        push();
        translate(0, -this.height * 0.3, 0);
        fill(70, 70, 70);
        rotateZ(HALF_PI);
        cylinder(this.width * 0.3, this.depth * 0.8);
        
        // Tank gun
        translate(0, 0, this.depth * 0.5);
        fill(50, 50, 50);
        cylinder(this.width * 0.1, this.depth * 0.8);
        pop();
        break;
        
      case 'HERO':
        // Hero with broadsword
        fill(150, 150, 200); // Light blue-gray
        box(this.width, this.height, this.depth);
        
        // Sword
        push();
        translate(this.width * 0.7, -this.height * 0.2, 0);
        fill(200, 200, 200); // Silver
        rotateZ(-PI / 4 + sin(this.animationFrame) * 0.2); // Slight sword animation
        box(this.width * 0.1, this.height * 0.8, this.width * 0.05);
        pop();
        break;
        
      case 'MARIO':
        // Mario - small, fast character
        fill(255, 0, 0); // Red
        box(this.width, this.height, this.depth);
        
        // Mario hat
        push();
        translate(0, -this.height * 0.6, 0);
        fill(255, 0, 0); // Red
        box(this.width * 0.8, this.height * 0.2, this.depth * 0.8);
        pop();
        
        // Mario overalls
        push();
        translate(0, this.height * 0.2, 0);
        fill(0, 0, 255); // Blue
        box(this.width, this.height * 0.6, this.depth);
        pop();
        break;
        
      case 'MEGAMAN':
        // Megaman - balanced character with arm cannon
        fill(0, 100, 255); // Blue
        box(this.width, this.height, this.depth);
        
        // Arm cannon
        push();
        translate(this.width * 0.7, 0, 0);
        fill(100, 100, 100); // Gray
        rotateZ(HALF_PI);
        cylinder(this.width * 0.2, this.width * 0.5);
        pop();
        
        // Helmet
        push();
        translate(0, -this.height * 0.5, 0);
        fill(0, 50, 200); // Darker blue
        sphere(this.width * 0.4);
        pop();
        break;
        
      case 'SONGOKU':
        // Songoku - powerful character with spiky hair
        fill(255, 165, 0); // Orange
        box(this.width, this.height, this.depth);
        
        // Spiky hair
        push();
        translate(0, -this.height * 0.6, 0);
        fill(255, 255, 0); // Yellow
        for (let i = 0; i < 5; i++) {
          push();
          let angle = i * TWO_PI / 5;
          translate(cos(angle) * this.width * 0.3, -this.height * 0.1, sin(angle) * this.depth * 0.3);
          rotateX(PI / 4);
          cone(this.width * 0.15, this.height * 0.3);
          pop();
        }
        pop();
        break;
        
      default:
        // Default character
        fill(200, 200, 0); // Yellow
        box(this.width, this.height, this.depth);
    }
  }
  
  drawHealthBar() {
    // Health bar above character
    push();
    translate(0, -this.height * 0.8, 0);
    rotateY(-this.rotation); // Counter-rotate to face camera
    
    // Background bar
    fill(100, 100, 100);
    noStroke();
    rect(-this.width / 2, -2, this.width, 4);
    
    // Health percentage
    const healthPercent = this.health / (CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER);
    fill(255 * (1 - healthPercent), 255 * healthPercent, 0);
    rect(-this.width / 2, -2, this.width * healthPercent, 4);
    pop();
  }
  
  findNearestEnemy() {
    return findNearestEnemies(this, 1, this.gameState);
  }
  
  attack(target) {
    // Different attack based on character type
    switch (this.type) {
      case 'TANK':
        // Tank fires a powerful shot
        const tankBullet = new Bullet(
          this.x, 
          this.y - this.height * 0.3, 
          this.z, 
          this.rotation - HALF_PI, 
          target, 
          this, 
          this.gameState
        );
        tankBullet.damage = this.damage;
        tankBullet.size = 8;
        tankBullet.color = [100, 100, 100];
        this.gameState.bullets.push(tankBullet);
        break;
        
      case 'HERO':
        // Hero does melee attack
        if (dist(this.x, this.z, target.x, target.z) < this.width * 2) {
          target.health -= this.damage;
          
          // Create a small wave effect for the sword slash
          this.gameState.waves.push(new Wave(
            this.x, 
            this.y, 
            this.z, 
            this.width * 2, 
            [200, 200, 255, 150]
          ));
        }
        break;
        
      case 'MARIO':
        // Mario jumps on enemies
        this.velocityY = -5;
        if (dist(this.x, this.z, target.x, target.z) < this.width) {
          target.health -= this.damage;
        }
        break;
        
      case 'MEGAMAN':
        // Megaman fires from arm cannon
        for (let i = 0; i < 3; i++) { // Triple shot
          const spread = (i - 1) * 0.1;
          const megamanBullet = new Bullet(
            this.x, 
            this.y, 
            this.z, 
            this.rotation - HALF_PI + spread, 
            target, 
            this, 
            this.gameState
          );
          megamanBullet.damage = this.damage / 3;
          megamanBullet.size = 6;
          megamanBullet.color = [0, 200, 255];
          megamanBullet.speed = 25;
          this.gameState.bullets.push(megamanBullet);
        }
        break;
        
      case 'SONGOKU':
        // Songoku does a powerful energy attack
        const gokuBullet = new Bullet(
          this.x, 
          this.y, 
          this.z, 
          this.rotation - HALF_PI, 
          target, 
          this, 
          this.gameState
        );
        gokuBullet.damage = this.damage;
        gokuBullet.size = 10;
        gokuBullet.color = [255, 255, 0];
        gokuBullet.speed = 30;
        this.gameState.bullets.push(gokuBullet);
        break;
    }
  }
  
  useSpecialAbility() {
    // Special abilities unique to each character type
    switch (this.type) {
      case 'TANK':
        // Tank creates a shockwave that damages all nearby enemies
        const tankWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 5, 
          [100, 100, 100, 200]
        );
        tankWave.damage = this.damage * 0.5;
        tankWave.growthRate = 3;
        this.gameState.waves.push(tankWave);
        break;
        
      case 'HERO':
        // Hero does a spinning sword attack
        const heroWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 3, 
          [200, 200, 255, 150]
        );
        heroWave.damage = this.damage * 0.7;
        heroWave.growthRate = 2;
        this.gameState.waves.push(heroWave);
        break;
        
      case 'MARIO':
        // Mario throws fireballs in all directions
        for (let i = 0; i < 8; i++) {
          const angle = i * TWO_PI / 8;
          const marioBullet = new Bullet(
            this.x, 
            this.y, 
            this.z, 
            angle, 
            null, // No specific target
            this, 
            this.gameState
          );
          marioBullet.damage = this.damage * 0.6;
          marioBullet.size = 5;
          marioBullet.color = [255, 100, 0];
          marioBullet.speed = 15;
          this.gameState.bullets.push(marioBullet);
        }
        break;
        
      case 'MEGAMAN':
        // Megaman charges a powerful blast
        const megamanWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 4, 
          [0, 200, 255, 150]
        );
        megamanWave.damage = this.damage;
        megamanWave.growthRate = 2.5;
        this.gameState.waves.push(megamanWave);
        break;
        
      case 'SONGOKU':
        // Songoku does a kamehameha blast
        // Create a powerful wave in front of the character
        const gokuWave = new Wave(
          this.x + cos(this.rotation - HALF_PI) * this.width * 2, 
          this.y, 
          this.z + sin(this.rotation - HALF_PI) * this.width * 2, 
          this.width * 6, 
          [255, 255, 0, 200]
        );
        gokuWave.damage = this.damage * 1.5;
        gokuWave.growthRate = 4;
        this.gameState.waves.push(gokuWave);
        break;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
}