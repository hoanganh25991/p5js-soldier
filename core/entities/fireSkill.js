// Fire Skill Module
// Implements various fire-based skills

import CONFIG from '../config.js';
import { Wave } from './wave.js';
import { Projectile } from './projectile.js';
import { Bullet } from './bullet.js';

export class FireSkill {
  constructor(x, y, z, type, gameState) {
    this.gameState = gameState;
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Type and configuration
    this.type = type;
    this.typeConfig = CONFIG.GAS_LIGHTER.FIRE_SKILL_TYPES[type];
    
    // Stats
    this.damage = this.typeConfig.DAMAGE;
    this.lifespan = CONFIG.GAS_LIGHTER.FIRE_SKILL_DURATION;
    this.active = true;
    
    // Skill-specific properties
    this.cooldown = 0;
    this.duration = this.typeConfig.DURATION || 60 * 5; // Default 5 seconds if not specified
    this.currentDuration = 0;
    this.projectiles = [];
    this.waves = [];
    this.meteors = [];
    
    // Initialize skill-specific properties
    this.initializeSkill();
  }
  
  initializeSkill() {
    switch (this.type) {
      case 'FIREBALL':
        // Fireball doesn't need initialization, it's cast on update
        this.cooldown = 0; // Ready to cast immediately
        break;
        
      case 'FLAME_SHIELD':
        // Create initial shield wave
        this.createShieldWave();
        break;
        
      case 'INFERNO_BLAST':
        // Create initial blast wave
        this.createBlastWave();
        break;
        
      case 'PHOENIX_REBIRTH':
        // Create phoenix effect and heal player
        this.createPhoenixEffect();
        // Heal the player
        if (this.gameState.player && this.gameState.player.health) {
          this.gameState.player.health = Math.min(
            this.gameState.player.health + this.typeConfig.HEAL_AMOUNT,
            CONFIG.PLAYER_HEALTH
          );
        }
        break;
        
      case 'FIRESTORM':
        // Firestorm will create meteors on update
        this.meteorTimer = 0;
        break;
    }
  }
  
  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Update skill-specific logic
    switch (this.type) {
      case 'FIREBALL':
        // Cast fireballs periodically
        if (this.cooldown <= 0) {
          this.castFireball();
          this.cooldown = this.typeConfig.COOLDOWN;
        } else {
          this.cooldown--;
        }
        break;
        
      case 'FLAME_SHIELD':
        // Update shield duration
        if (this.currentDuration < this.duration) {
          this.currentDuration++;
          
          // Pulse the shield
          if (this.currentDuration % 10 === 0) {
            this.createShieldWave();
          }
          
          // Damage nearby enemies
          if (this.currentDuration % 15 === 0) {
            this.damageNearbyEnemies(this.typeConfig.RADIUS, this.damage / 5);
          }
        } else if (this.active) {
          // Deactivate after duration
          this.active = false;
        }
        break;
        
      case 'INFERNO_BLAST':
        // Update blast duration
        if (this.currentDuration < this.duration) {
          this.currentDuration++;
          
          // Expand the blast
          if (this.currentDuration % 5 === 0) {
            this.createBlastWave(this.currentDuration / this.duration);
          }
          
          // Damage enemies in blast radius
          if (this.currentDuration % 10 === 0) {
            const scaledRadius = this.typeConfig.RADIUS * (this.currentDuration / this.duration);
            this.damageNearbyEnemies(scaledRadius, this.damage / 3);
          }
        } else if (this.active) {
          // Deactivate after duration
          this.active = false;
        }
        break;
        
      case 'PHOENIX_REBIRTH':
        // Update phoenix duration
        if (this.currentDuration < this.duration) {
          this.currentDuration++;
          
          // Create rising phoenix particles
          if (this.currentDuration % 5 === 0) {
            this.createPhoenixParticles();
          }
          
          // Damage nearby enemies
          if (this.currentDuration % 15 === 0) {
            this.damageNearbyEnemies(this.typeConfig.RADIUS, this.damage / 5);
          }
        } else if (this.active) {
          // Deactivate after duration
          this.active = false;
        }
        break;
        
      case 'FIRESTORM':
        // Update firestorm duration
        if (this.currentDuration < this.duration) {
          this.currentDuration++;
          
          // Create meteors periodically
          this.meteorTimer++;
          if (this.meteorTimer >= this.duration / this.typeConfig.METEOR_COUNT) {
            this.createMeteor();
            this.meteorTimer = 0;
          }
        } else if (this.active) {
          // Deactivate after duration
          this.active = false;
        }
        break;
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update();
      if (this.projectiles[i].isDone) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // Update meteors for firestorm
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      
      // Update meteor position
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.z += meteor.vz;
      
      // Check if meteor hit the ground
      if (meteor.y >= -50) {
        // Create impact wave
        if (this.gameState.waves) {
          const impactWave = new Wave(
            meteor.x,
            -50,
            meteor.z,
            this.typeConfig.METEOR_SIZE * 2,
            [...this.typeConfig.COLOR, 180]
          );
          impactWave.growthRate = 5;
          impactWave.maxRadius = this.typeConfig.METEOR_SIZE * 5;
          this.gameState.waves.push(impactWave);
        }
        
        // Damage enemies near impact
        this.damageNearbyEnemies(this.typeConfig.METEOR_SIZE * 3, this.damage, meteor.x, -50, meteor.z);
        
        // Remove meteor
        this.meteors.splice(i, 1);
      }
    }
    
    // Return true if skill is done (lifespan ended and no active effects)
    return this.lifespan <= 0 && !this.active && this.projectiles.length === 0 && this.meteors.length === 0;
  }
  
  show() {
    // Draw projectiles
    for (const projectile of this.projectiles) {
      projectile.show();
    }
    
    // Draw meteors for firestorm
    for (const meteor of this.meteors) {
      push();
      translate(meteor.x, meteor.y, meteor.z);
      
      // Meteor trail
      push();
      noStroke();
      for (let i = 0; i < 5; i++) {
        const trailSize = this.typeConfig.METEOR_SIZE * (1 - i * 0.15);
        const alpha = 200 - i * 40;
        fill(this.typeConfig.COLOR[0], this.typeConfig.COLOR[1], this.typeConfig.COLOR[2], alpha);
        translate(-meteor.vx * 2, -meteor.vy * 2, -meteor.vz * 2);
        sphere(trailSize);
      }
      pop();
      
      // Meteor body
      noStroke();
      fill(this.typeConfig.COLOR);
      sphere(this.typeConfig.METEOR_SIZE);
      
      // Meteor glow
      push();
      noStroke();
      fill(255, 255, 200, 100);
      sphere(this.typeConfig.METEOR_SIZE * 1.3);
      pop();
      
      pop();
    }
    
    // Draw skill-specific effects
    switch (this.type) {
      case 'FLAME_SHIELD':
        if (this.active && this.currentDuration < this.duration) {
          this.drawFlameShield();
        }
        break;
        
      case 'PHOENIX_REBIRTH':
        if (this.active && this.currentDuration < this.duration) {
          this.drawPhoenix();
        }
        break;
    }
  }
  
  // Skill-specific methods
  
  castFireball() {
    // Find a random enemy to target
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    if (enemies.length === 0) return;
    
    const target = enemies[Math.floor(random(enemies.length))];
    
    // Calculate angle to target
    const angleToTarget = atan2(target.z - this.z, target.x - this.x);
    
    // Create fireball projectile
    const fireball = new Projectile(
      this.x,
      this.y - 20, // Start above ground
      this.z,
      angleToTarget,
      'FIRE_FIREBALL',
      this,
      this.gameState
    );
    
    // Set fireball properties
    fireball.color = this.typeConfig.COLOR;
    fireball.size = this.typeConfig.SIZE;
    fireball.speed = this.typeConfig.SPEED;
    fireball.damage = this.damage;
    
    // Add to projectiles array
    this.projectiles.push(fireball);
    
    // Also add to gameState bullets for backward compatibility
    const fireballBullet = new Bullet(
      this.x, 
      this.y - 20, 
      this.z, 
      angleToTarget, 
      target, 
      this, 
      this.gameState
    );
    
    fireballBullet.damage = this.damage;
    fireballBullet.size = this.typeConfig.SIZE;
    fireballBullet.color = this.typeConfig.COLOR;
    
    // If we have a target, the bullet will already have velocity set
    // If not, we need to set it manually
    if (!target) {
      fireballBullet.vx = Math.cos(angleToTarget) * this.typeConfig.SPEED;
      fireballBullet.vy = 0;
      fireballBullet.vz = Math.sin(angleToTarget) * this.typeConfig.SPEED;
    }
    
    this.gameState.bullets.push(fireballBullet);
    
    // Create cast effect
    if (this.gameState.waves) {
      const castWave = new Wave(
        this.x,
        this.y - 20,
        this.z,
        30,
        [...this.typeConfig.COLOR, 150]
      );
      castWave.growthRate = 3;
      castWave.maxRadius = 50;
      castWave.lifespan = 15;
      this.gameState.waves.push(castWave);
    }
  }
  
  createShieldWave() {
    if (!this.gameState.waves) return;
    
    // Create a shield wave
    const shieldWave = new Wave(
      this.x,
      this.y - 20,
      this.z,
      this.typeConfig.RADIUS,
      [...this.typeConfig.COLOR, 150]
    );
    shieldWave.growthRate = 2;
    shieldWave.maxRadius = this.typeConfig.RADIUS * 1.1;
    shieldWave.lifespan = 30;
    shieldWave.damage = this.damage / 10; // Small damage over time
    this.gameState.waves.push(shieldWave);
  }
  
  drawFlameShield() {
    push();
    translate(this.x, this.y - 20, this.z);
    
    // Shield effect
    noStroke();
    fill(...this.typeConfig.COLOR, 50 + sin(frameCount * this.typeConfig.PULSE_RATE) * 30);
    sphere(this.typeConfig.RADIUS * (0.9 + sin(frameCount * this.typeConfig.PULSE_RATE) * 0.1));
    
    // Flame particles around shield
    for (let i = 0; i < 8; i++) {
      push();
      const angle = i * TWO_PI / 8 + frameCount * 0.01;
      const radius = this.typeConfig.RADIUS;
      const x = cos(angle) * radius;
      const z = sin(angle) * radius;
      const y = sin(frameCount * 0.1 + i) * 20;
      
      translate(x, y, z);
      fill(...this.typeConfig.COLOR, 150);
      sphere(5 + sin(frameCount * 0.2 + i) * 3);
      pop();
    }
    
    pop();
  }
  
  createBlastWave(progress = 0) {
    if (!this.gameState.waves) return;
    
    // Calculate radius based on progress
    const radius = this.typeConfig.RADIUS * (progress || 0.2);
    
    // Create a blast wave
    const blastWave = new Wave(
      this.x,
      this.y - 20,
      this.z,
      radius,
      [...this.typeConfig.COLOR, 180]
    );
    blastWave.growthRate = this.typeConfig.EXPANSION_RATE;
    blastWave.maxRadius = radius * 1.5;
    blastWave.lifespan = 20;
    blastWave.damage = this.damage / 5; // Damage over time
    this.gameState.waves.push(blastWave);
  }
  
  createPhoenixEffect() {
    if (!this.gameState.waves) return;
    
    // Create initial phoenix wave
    const phoenixWave = new Wave(
      this.x,
      this.y - 20,
      this.z,
      this.typeConfig.RADIUS,
      [...this.typeConfig.COLOR, 200]
    );
    phoenixWave.growthRate = 5;
    phoenixWave.maxRadius = this.typeConfig.RADIUS * 1.5;
    phoenixWave.lifespan = 30;
    this.gameState.waves.push(phoenixWave);
    
    // Create rising particles
    this.createPhoenixParticles();
  }
  
  createPhoenixParticles() {
    if (!this.gameState.waves) return;
    
    // Create rising phoenix particles
    for (let i = 0; i < 10; i++) {
      const angle = random(TWO_PI);
      const radius = random(this.typeConfig.RADIUS * 0.2, this.typeConfig.RADIUS * 0.8);
      const x = this.x + cos(angle) * radius;
      const z = this.z + sin(angle) * radius;
      
      const particle = new Wave(
        x,
        this.y - random(10, 50),
        z,
        random(10, 30),
        [...this.typeConfig.COLOR, random(150, 200)]
      );
      particle.growthRate = random(1, 3);
      particle.maxRadius = random(20, 40);
      particle.riseSpeed = this.typeConfig.RISE_SPEED * random(0.8, 1.2);
      particle.lifespan = random(20, 40);
      this.gameState.waves.push(particle);
    }
  }
  
  drawPhoenix() {
    push();
    translate(this.x, this.y - 100, this.z);
    
    // Phoenix body
    noStroke();
    
    // Wings
    push();
    const wingSpread = sin(frameCount * 0.05) * 0.5 + 0.5;
    
    // Left wing
    push();
    rotateZ(PI/4 - wingSpread);
    rotateX(PI/6);
    fill(...this.typeConfig.COLOR, 150);
    
    beginShape();
    vertex(0, 0, 0);
    vertex(-100, -50, 0);
    vertex(-150, 0, 0);
    vertex(-100, 50, 0);
    endShape(CLOSE);
    pop();
    
    // Right wing
    push();
    rotateZ(-PI/4 + wingSpread);
    rotateX(PI/6);
    fill(...this.typeConfig.COLOR, 150);
    
    beginShape();
    vertex(0, 0, 0);
    vertex(100, -50, 0);
    vertex(150, 0, 0);
    vertex(100, 50, 0);
    endShape(CLOSE);
    pop();
    
    pop();
    
    // Body
    fill(...this.typeConfig.COLOR, 180);
    ellipsoid(30, 60, 20);
    
    // Head
    push();
    translate(0, -70, 0);
    fill(...this.typeConfig.COLOR, 200);
    sphere(20);
    
    // Beak
    push();
    translate(0, 0, 20);
    fill(255, 200, 0);
    cone(5, 15);
    pop();
    pop();
    
    // Tail
    push();
    translate(0, 80, 0);
    fill(...this.typeConfig.COLOR, 150);
    
    // Tail feathers
    for (let i = -2; i <= 2; i++) {
      push();
      translate(i * 10, 0, 0);
      rotateX(PI/6);
      rotateY(i * PI/12);
      
      beginShape();
      vertex(0, 0, 0);
      vertex(-10, 50, 0);
      vertex(0, 80, 0);
      vertex(10, 50, 0);
      endShape(CLOSE);
      pop();
    }
    pop();
    
    pop();
  }
  
  createMeteor() {
    // Create a meteor at a random position above the battlefield
    const radius = random(CONFIG.WORLD_RADIUS * 0.3, CONFIG.WORLD_RADIUS * 0.7);
    const angle = random(TWO_PI);
    const meteorX = cos(angle) * radius;
    const meteorZ = sin(angle) * radius;
    const meteorY = -500 - random(200); // Start high above
    
    // Calculate target position (random point on the ground)
    const targetRadius = random(CONFIG.WORLD_RADIUS * 0.5);
    const targetAngle = random(TWO_PI);
    const targetX = cos(targetAngle) * targetRadius;
    const targetZ = sin(targetAngle) * targetRadius;
    const targetY = -50; // Ground level
    
    // Calculate velocity
    const dx = targetX - meteorX;
    const dy = targetY - meteorY;
    const dz = targetZ - meteorZ;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    const speed = this.typeConfig.METEOR_SPEED;
    const vx = dx / dist * speed;
    const vy = dy / dist * speed;
    const vz = dz / dist * speed;
    
    // Create meteor object
    const meteor = {
      x: meteorX,
      y: meteorY,
      z: meteorZ,
      vx: vx,
      vy: vy,
      vz: vz,
      size: this.typeConfig.METEOR_SIZE,
      rotation: random(TWO_PI)
    };
    
    // Add to meteors array
    this.meteors.push(meteor);
  }
  
  damageNearbyEnemies(radius, damage, centerX, centerY, centerZ) {
    // Use provided center or skill position
    const x = centerX !== undefined ? centerX : this.x;
    const z = centerZ !== undefined ? centerZ : this.z;
    
    // Get enemies
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    
    // Apply damage to enemies within radius
    for (const enemy of enemies) {
      const distance = dist(x, z, enemy.x, enemy.z);
      if (distance <= radius) {
        // Apply damage with falloff based on distance
        const falloff = 1 - (distance / radius);
        const actualDamage = damage * falloff;
        enemy.takeDamage(actualDamage);
      }
    }
  }
}