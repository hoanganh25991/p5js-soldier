// Projectile Module
// Implements visible projectiles for game characters

import CONFIG from '../config.js';
import { Wave } from './wave.js';

export class Projectile {
  constructor(x, y, z, angle, type, source, gameState) {
    this.gameState = gameState;
    this.source = source;
    this.type = type;
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = angle;
    
    // Physics
    this.speed = 15;
    this.gravity = 0;
    this.lifespan = 60; // Default lifespan in frames
    this.isDone = false;
    this.target = null; // Target for homing projectiles
    
    // Appearance
    this.size = 10;
    this.color = [255, 255, 255];
    this.trailEffect = true;
    this.trailParticles = [];
    
    // Combat
    this.damage = source ? source.damage : 10;
    this.hitRadius = 20;
    
    // Set type-specific properties
    this.setTypeProperties();
    
    // Calculate velocity based on angle
    this.vx = Math.cos(angle) * this.speed;
    this.vy = 0; // Will be modified by gravity if applicable
    this.vz = Math.sin(angle) * this.speed;
  }
  
  setTypeProperties() {
    switch (this.type) {
      case 'TANK_SHELL':
        this.color = [100, 100, 100];
        this.size = 15;
        this.speed = 20;
        this.gravity = 0.1;
        this.damage *= 1.2;
        this.hitRadius = 30;
        break;
        
      case 'MEGAMAN_BLAST':
        this.color = [0, 200, 255];
        this.size = 12;
        this.speed = 25;
        this.lifespan = 45;
        break;
        
      case 'SONGOKU_KAMEHAMEHA':
        this.color = [255, 255, 0];
        this.size = 20;
        this.speed = 30;
        this.damage *= 1.5;
        this.hitRadius = 40;
        this.lifespan = 90;
        break;
        
      case 'FIRE_FIREBALL':
        this.color = [255, 100, 0];
        this.size = 15;
        this.speed = 25;
        this.lifespan = 60;
        this.hitRadius = 30;
        break;
    }
  }
  
  update() {
    // For homing projectiles (like fireballs), adjust trajectory slightly
    if (this.type === 'FIRE_FIREBALL' && this.target && !this.target.isDead) {
      // Calculate angle to target
      const targetAngle = atan2(this.target.z - this.z, this.target.x - this.x);
      
      // Current angle
      const currentAngle = atan2(this.vz, this.vx);
      
      // Calculate angle difference (shortest path)
      let angleDiff = targetAngle - currentAngle;
      if (angleDiff > PI) angleDiff -= TWO_PI;
      if (angleDiff < -PI) angleDiff += TWO_PI;
      
      // Adjust angle slightly (homing effect)
      const homingStrength = 0.05; // How quickly it turns toward target
      const newAngle = currentAngle + angleDiff * homingStrength;
      
      // Update velocity based on new angle
      const speed = sqrt(this.vx * this.vx + this.vz * this.vz);
      this.vx = cos(newAngle) * speed;
      this.vz = sin(newAngle) * speed;
    }
    
    // Move projectile
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    
    // Apply gravity if applicable
    if (this.gravity > 0) {
      this.vy += this.gravity;
    }
    
    // Add trail particles
    if (this.trailEffect && frameCount % 2 === 0) {
      this.trailParticles.push({
        x: this.x,
        y: this.y,
        z: this.z,
        size: this.size * 0.7,
        alpha: 200,
        life: 15
      });
    }
    
    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.alpha -= 10;
      particle.size *= 0.95;
      particle.life--;
      
      if (particle.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
    
    // Check collision with enemies
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const d = dist(this.x, this.z, enemy.x, enemy.z);
        
        // Check if projectile is at right height to hit enemy
        if (d < this.hitRadius + enemy.width * 0.5 &&
            this.y < enemy.y + enemy.height &&
            this.y > enemy.y) {
          
          // Apply damage to enemy
          if (enemy.takeDamage(this.damage)) {
            // Enemy died, will be removed by the controller
          }
          
          // Create hit effect
          this.createHitEffect(enemy);
          
          // Mark projectile as done
          this.isDone = true;
          return;
        }
      }
    }
    
    // Check if projectile is out of bounds or lifespan ended
    const distance = dist(0, 0, this.x, this.z);
    if (distance > CONFIG.WORLD_RADIUS || this.y > 50 || this.lifespan <= 0) {
      this.isDone = true;
    }
    
    // Decrease lifespan
    this.lifespan--;
  }
  
  createHitEffect(target) {
    // Create a hit effect based on projectile type
    if (this.gameState.waves) {
      let waveColor;
      let waveSize;
      
      switch (this.type) {
        case 'TANK_SHELL':
          waveColor = [100, 100, 100, 180];
          waveSize = 100;
          break;
          
        case 'MEGAMAN_BLAST':
          waveColor = [0, 200, 255, 180];
          waveSize = 80;
          break;
          
        case 'SONGOKU_KAMEHAMEHA':
          waveColor = [255, 255, 0, 180];
          waveSize = 120;
          break;
          
        case 'FIRE_FIREBALL':
          waveColor = [255, 100, 0, 180];
          waveSize = 100;
          
          // Add extra fire particles for fireball
          for (let i = 0; i < 8; i++) {
            const angle = random(TWO_PI);
            const radius = random(30, 60);
            const particleX = target.x + cos(angle) * radius;
            const particleY = target.y + random(-30, 30);
            const particleZ = target.z + sin(angle) * radius;
            
            const fireParticle = new Wave(
              particleX,
              particleY,
              particleZ,
              random(10, 20),
              [255, random(50, 150), 0, random(150, 200)]
            );
            fireParticle.growthRate = random(2, 4);
            fireParticle.maxRadius = random(20, 40);
            fireParticle.lifespan = random(15, 30);
            this.gameState.waves.push(fireParticle);
          }
          break;
          
        default:
          waveColor = [255, 255, 255, 180];
          waveSize = 60;
      }
      
      // Create hit wave
      const hitWave = new Wave(
        target.x,
        target.y,
        target.z,
        waveSize,
        waveColor
      );
      hitWave.growthRate = 5;
      hitWave.maxRadius = waveSize * 2;
      this.gameState.waves.push(hitWave);
    }
  }
  
  show() {
    // Draw trail particles first (behind projectile)
    for (const particle of this.trailParticles) {
      push();
      translate(particle.x, particle.y, particle.z);
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], particle.alpha);
      
      // Different shapes based on projectile type
      if (this.type === 'SONGOKU_KAMEHAMEHA') {
        sphere(particle.size);
      } else if (this.type === 'MEGAMAN_BLAST') {
        box(particle.size);
      } else {
        sphere(particle.size);
      }
      pop();
    }
    
    // Draw the projectile
    push();
    translate(this.x, this.y, this.z);
    
    // Rotate to face direction of travel
    const headingAngle = atan2(this.vz, this.vx);
    rotateY(headingAngle);
    
    // Draw based on type
    noStroke();
    fill(this.color[0], this.color[1], this.color[2]);
    
    switch (this.type) {
      case 'TANK_SHELL':
        // Tank shell - elongated with pointed tip
        push();
        rotateZ(HALF_PI);
        cylinder(this.size * 0.3, this.size * 1.5);
        translate(0, this.size * 0.8, 0);
        cone(this.size * 0.3, this.size * 0.5);
        pop();
        break;
        
      case 'MEGAMAN_BLAST':
        // Megaman blast - energy sphere with pulsing effect
        const pulseSize = this.size + sin(frameCount * 0.3) * 2;
        sphere(pulseSize);
        
        // Add glow effect
        push();
        noStroke();
        fill(this.color[0], this.color[1], this.color[2], 100);
        sphere(pulseSize * 1.3);
        pop();
        break;
        
      case 'SONGOKU_KAMEHAMEHA':
        // Kamehameha - large energy beam
        push();
        rotateZ(HALF_PI);
        
        // Core beam
        fill(255, 255, 255);
        cylinder(this.size * 0.4, this.size * 2);
        
        // Outer energy
        fill(this.color[0], this.color[1], this.color[2], 150);
        cylinder(this.size * 0.8, this.size * 2);
        
        // Energy waves
        for (let i = 0; i < 3; i++) {
          const wavePos = (frameCount * 0.2 + i * TWO_PI / 3) % TWO_PI;
          const waveOffset = sin(wavePos) * this.size * 0.3;
          
          push();
          translate(0, waveOffset, 0);
          fill(this.color[0], this.color[1], this.color[2], 100);
          torus(this.size * 0.8, this.size * 0.1);
          pop();
        }
        pop();
        break;
        
      case 'FIRE_FIREBALL':
        // Fireball - flaming sphere with dynamic fire effects
        push();
        
        // Core of the fireball
        fill(255, 200, 50);
        sphere(this.size * 0.6);
        
        // Outer flame layer
        fill(this.color[0], this.color[1], this.color[2], 180);
        sphere(this.size * 0.9 + sin(frameCount * 0.2) * this.size * 0.1);
        
        // Flame tendrils
        for (let i = 0; i < 8; i++) {
          push();
          const angle = i * TWO_PI / 8 + frameCount * 0.05;
          const x = cos(angle) * this.size * 0.7;
          const y = sin(angle) * this.size * 0.7;
          const z = sin(frameCount * 0.1 + i) * this.size * 0.5;
          
          translate(x, y, z);
          fill(255, 100 + random(50), 0, 150);
          sphere(this.size * 0.3 + sin(frameCount * 0.3 + i) * this.size * 0.1);
          pop();
        }
        
        // Smoke trail
        for (let i = 0; i < 3; i++) {
          push();
          // Position behind the fireball
          rotateY(PI);
          translate(0, 0, this.size * (1 + i * 0.5));
          
          fill(100, 100, 100, 80 - i * 20);
          sphere(this.size * (0.5 + i * 0.2));
          pop();
        }
        
        pop();
        break;
        
      default:
        // Default projectile - simple sphere
        sphere(this.size);
    }
    
    pop();
  }
}