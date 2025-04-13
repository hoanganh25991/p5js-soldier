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
    // Set Y position to slightly above ground level for all fire effects
    // This ensures effects appear on the ground and behind characters but are still visible
    this.effectY = -48; // Slightly above ground level to ensure visibility
    
    switch (this.type) {
      case 'FIREBALL':
        // Fireball doesn't need initialization, it's cast on update
        this.cooldown = 0; // Ready to cast immediately
        break;
        
      case 'FLAME_SHIELD':
        // Create initial shield wave at ground level
        this.createShieldWave();
        break;
        
      case 'INFERNO_BLAST':
        // Create initial blast wave at ground level
        this.createBlastWave();
        break;
        
      case 'PHOENIX_REBIRTH':
        // Create phoenix effect at ground level and heal player
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
      
      // Check if meteor reached its target position
      const distToTarget = dist(meteor.x, meteor.z, meteor.targetX, meteor.targetZ);
      const heightPastTarget = meteor.y > meteor.targetY;
      
      // Never let meteors hit the ground - they should always explode in mid-air
      if (distToTarget < 20 || heightPastTarget || meteor.y >= -150) {
        // Create impact wave at ground level
        if (this.gameState.waves) {
          // Main explosion wave at ground level
          const impactWave = new Wave(
            meteor.x,
            this.effectY, // Use ground level Y position
            meteor.z,
            this.typeConfig.METEOR_SIZE * 2,
            [...this.typeConfig.COLOR, 200] // More opaque
          );
          impactWave.growthRate = 8; // Faster growth
          impactWave.maxRadius = this.typeConfig.METEOR_SIZE * 6; // Larger
          impactWave.lifespan = 25; // Longer lasting
          
          // Set height to create a dramatic 3D effect that rises from the ground
          impactWave.height = 80; // Much taller height for pronounced 3D effect
          impactWave.riseSpeed = 2.5; // Make the wave rise faster
          
          this.gameState.waves.push(impactWave);
          
          // Secondary explosion wave at ground level (different color)
          const secondaryWave = new Wave(
            meteor.x,
            this.effectY, // Use ground level Y position
            meteor.z,
            this.typeConfig.METEOR_SIZE * 1.5,
            [255, 255, 100, 180] // Yellow-orange
          );
          secondaryWave.growthRate = 6;
          secondaryWave.maxRadius = this.typeConfig.METEOR_SIZE * 4;
          secondaryWave.lifespan = 20;
          
          // Set height to create a dramatic 3D effect that rises from the ground
          secondaryWave.height = 60; // Tall height for pronounced 3D effect
          secondaryWave.riseSpeed = 2.0; // Make the wave rise at a good pace
          
          this.gameState.waves.push(secondaryWave);
        }
        
        // Damage enemies near impact
        this.damageNearbyEnemies(this.typeConfig.METEOR_SIZE * 3, this.damage, meteor.x, this.effectY, meteor.z);
        
        // Create additional fire particles for a ground-level explosion
        if (this.gameState.waves) {
          // More particles for a bigger explosion
          for (let j = 0; j < 15; j++) {
            // Create particles in a 2D circle on the ground
            const particleAngle = random(TWO_PI);
            const particleRadius = random(10, 50);
            
            // Calculate position on the ground
            const particleX = meteor.x + cos(particleAngle) * particleRadius;
            const particleY = this.effectY; // Ground level
            const particleZ = meteor.z + sin(particleAngle) * particleRadius;
            
            // Randomize colors for more variety
            const colorVariation = floor(random(3));
            let particleColor;
            
            if (colorVariation === 0) {
              // Orange-red
              particleColor = [255, random(50, 150), 0, random(150, 200)];
            } else if (colorVariation === 1) {
              // Yellow
              particleColor = [255, 255, random(0, 100), random(150, 200)];
            } else {
              // Red
              particleColor = [255, random(0, 50), 0, random(150, 200)];
            }
            
            const fireParticle = new Wave(
              particleX,
              particleY,
              particleZ,
              random(5, 20),
              particleColor
            );
            
            // Some particles grow faster than others
            fireParticle.growthRate = random(2, 6);
            fireParticle.maxRadius = random(20, 60);
            fireParticle.lifespan = random(15, 40);
            
            // Make particles rise dramatically from the ground with 3D effect
            fireParticle.height = random(40, 100); // Much taller height for pronounced 3D effect
            
            // All particles rise at different speeds, but faster overall
            fireParticle.riseSpeed = random(2.0, 4.0);
            
            this.gameState.waves.push(fireParticle);
          }
        }
        
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
      
      // Meteor rotation for more dynamic appearance
      const rotationSpeed = frameCount * 0.05;
      rotateX(rotationSpeed + (meteor.rotation || 0));
      rotateY(rotationSpeed * 0.7);
      
      // Enhanced meteor trail
      push();
      noStroke();
      for (let i = 0; i < 8; i++) { // Longer trail
        const trailSize = this.typeConfig.METEOR_SIZE * (1 - i * 0.1);
        const alpha = 200 - i * 25;
        
        // Alternate colors in the trail for fire effect
        if (i % 2 === 0) {
          fill(this.typeConfig.COLOR[0], this.typeConfig.COLOR[1], this.typeConfig.COLOR[2], alpha);
        } else {
          fill(255, 255, 100, alpha); // Yellow for fire effect
        }
        
        translate(-meteor.vx * 1.5, -meteor.vy * 1.5, -meteor.vz * 1.5);
        sphere(trailSize);
      }
      pop();
      
      // Meteor body
      noStroke();
      fill(this.typeConfig.COLOR);
      sphere(this.typeConfig.METEOR_SIZE);
      
      // Inner glow
      push();
      noStroke();
      fill(255, 255, 200, 150);
      sphere(this.typeConfig.METEOR_SIZE * 0.7);
      pop();
      
      // Outer glow
      push();
      noStroke();
      fill(255, 200, 50, 80);
      sphere(this.typeConfig.METEOR_SIZE * 1.5);
      pop();
      
      // Small particles around the meteor
      for (let i = 0; i < 5; i++) {
        push();
        const particleAngle = random(TWO_PI);
        const particleElevation = random(PI);
        const particleRadius = this.typeConfig.METEOR_SIZE * 1.8;
        
        const px = cos(particleAngle) * sin(particleElevation) * particleRadius;
        const py = cos(particleElevation) * particleRadius;
        const pz = sin(particleAngle) * sin(particleElevation) * particleRadius;
        
        translate(px, py, pz);
        noStroke();
        fill(255, random(100, 255), 0, random(100, 200));
        sphere(random(2, 5));
        pop();
      }
      
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
    // Find a random enemy to target, prioritizing closer enemies
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    if (enemies.length === 0) return;
    
    // Sort enemies by distance to the Gas Lighter
    const sortedEnemies = [...enemies].sort((a, b) => {
      const distA = dist(this.x, this.z, a.x, a.z);
      const distB = dist(this.x, this.z, b.x, b.z);
      return distA - distB; // Sort by closest first
    });
    
    // 70% chance to target one of the closest enemies, 30% chance for random
    let target;
    if (random() < 0.7 && sortedEnemies.length > 0) {
      // Choose one of the closest 3 enemies (or fewer if there aren't 3)
      const closestCount = min(3, sortedEnemies.length);
      target = sortedEnemies[floor(random(closestCount))];
    } else {
      // Choose a completely random enemy
      target = enemies[Math.floor(random(enemies.length))];
    }
    
    // Calculate angle to target
    const angleToTarget = atan2(target.z - this.z, target.x - this.x);
    
    // Create fireball projectile - start at ground level
    const fireball = new Projectile(
      this.x,
      this.effectY, // Use ground level Y position
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
    fireball.target = target; // Track the target for homing capability
    
    // Add to projectiles array
    this.projectiles.push(fireball);
    
    // Also add to gameState bullets for backward compatibility
    const fireballBullet = new Bullet(
      this.x, 
      this.effectY, // Use ground level Y position
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
    
    // Create cast effect at ground level
    if (this.gameState.waves) {
      const castWave = new Wave(
        this.x,
        this.effectY, // Use ground level Y position
        this.z,
        30,
        [...this.typeConfig.COLOR, 150]
      );
      castWave.growthRate = 3;
      castWave.maxRadius = 50;
      castWave.lifespan = 15;
      castWave.height = 70; // Much taller height for pronounced 3D effect
      castWave.riseSpeed = 3.0; // Make it rise very quickly
      this.gameState.waves.push(castWave);
    }
  }
  
  createShieldWave() {
    if (!this.gameState.waves) return;
    
    // Create a shield wave at ground level
    const shieldWave = new Wave(
      this.x,
      this.effectY, // Use ground level Y position
      this.z,
      this.typeConfig.RADIUS,
      [...this.typeConfig.COLOR, 150]
    );
    shieldWave.growthRate = 2;
    shieldWave.maxRadius = this.typeConfig.RADIUS * 1.1;
    shieldWave.lifespan = 30;
    shieldWave.damage = this.damage / 10; // Small damage over time
    shieldWave.height = 100; // Much taller height for pronounced 3D shield effect
    shieldWave.riseSpeed = 1.5; // Moderate rise for shield effect
    this.gameState.waves.push(shieldWave);
  }
  
  drawFlameShield() {
    push();
    translate(this.x, this.effectY, this.z); // Use ground level Y position
    
    // Shield effect - 3D dome rising from the ground
    noStroke();
    
    // Base glow on the ground
    push();
    fill(...this.typeConfig.COLOR, 40 + sin(frameCount * this.typeConfig.PULSE_RATE) * 20);
    translate(0, 0, 0);
    rotateX(HALF_PI);
    ellipse(0, 0, this.typeConfig.RADIUS * 2.2);
    pop();
    
    // Main shield dome
    push();
    fill(...this.typeConfig.COLOR, 50 + sin(frameCount * this.typeConfig.PULSE_RATE) * 30);
    
    // Create a dome effect by using half a sphere
    translate(0, -this.typeConfig.RADIUS * 0.5, 0); // Move up to create dome from ground
    
    // Draw the dome
    beginShape();
    const detailLevel = 20;
    const radius = this.typeConfig.RADIUS * (0.9 + sin(frameCount * this.typeConfig.PULSE_RATE) * 0.1);
    
    // Draw only the top half of a sphere to create a dome
    for (let i = 0; i <= detailLevel; i++) {
      const lat = map(i, 0, detailLevel, 0, PI/2); // Only go from 0 to PI/2 for top half
      
      for (let j = 0; j <= detailLevel; j++) {
        const lon = map(j, 0, detailLevel, 0, TWO_PI);
        
        const x = radius * sin(lat) * cos(lon);
        const y = -radius * cos(lat); // Negative to make dome rise up
        const z = radius * sin(lat) * sin(lon);
        
        vertex(x, y, z);
      }
    }
    endShape(CLOSE);
    pop();
    
    // Get enemies for targeting flame particles
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    const nearbyEnemies = enemies.filter(enemy => {
      const distance = dist(this.x, this.z, enemy.x, enemy.z);
      return distance < this.typeConfig.RADIUS * 2; // Only consider enemies within twice the shield radius
    });
    
    // Flame particles around shield - some random, some targeting enemies
    for (let i = 0; i < 8; i++) {
      push();
      
      let x, z;
      
      // 70% chance to target a nearby enemy if available
      if (nearbyEnemies.length > 0 && random() < 0.7) {
        // Choose a random nearby enemy
        const targetEnemy = nearbyEnemies[floor(random(nearbyEnemies.length))];
        
        // Calculate direction to enemy
        const dx = targetEnemy.x - this.x;
        const dz = targetEnemy.z - this.z;
        const dist = sqrt(dx*dx + dz*dz);
        
        // Position flame particle in the direction of the enemy, but still on shield surface
        x = dx / dist * this.typeConfig.RADIUS;
        z = dz / dist * this.typeConfig.RADIUS;
      } else {
        // Random position on shield
        const angle = i * TWO_PI / 8 + frameCount * 0.01;
        x = cos(angle) * this.typeConfig.RADIUS;
        z = sin(angle) * this.typeConfig.RADIUS;
      }
      
      // Keep y value low to stay close to ground
      const y = sin(frameCount * 0.1 + i) * 5; // Reduced height variation
      
      translate(x, y, z);
      fill(...this.typeConfig.COLOR, 150);
      
      // Use flattened spheres for ground-level effect
      push();
      scale(1, 0.4, 1); // Flatten vertically
      sphere(5 + sin(frameCount * 0.2 + i) * 3);
      pop();
      
      // Add a small flame trail pointing outward
      push();
      const outwardX = x * 0.3;
      const outwardZ = z * 0.3;
      translate(outwardX, 0, outwardZ);
      fill(...this.typeConfig.COLOR, 100);
      
      // Flatten this sphere too
      push();
      scale(1, 0.4, 1);
      sphere(3 + sin(frameCount * 0.3 + i) * 2);
      pop();
      
      pop();
      
      pop();
    }
    
    pop();
  }
  
  createBlastWave(progress = 0) {
    if (!this.gameState.waves) return;
    
    // Get enemies for targeting
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    
    // Calculate radius based on progress
    const radius = this.typeConfig.RADIUS * (progress || 0.2);
    
    // Create the main blast wave at ground level
    const blastWave = new Wave(
      this.x,
      this.effectY, // Use ground level Y position
      this.z,
      radius,
      [...this.typeConfig.COLOR, 180]
    );
    blastWave.growthRate = this.typeConfig.EXPANSION_RATE;
    blastWave.maxRadius = radius * 1.5;
    blastWave.lifespan = 20;
    blastWave.damage = this.damage / 5; // Damage over time
    
    // Set height to create a dramatic 3D effect that rises from the ground
    blastWave.height = 90; // Much taller height for pronounced 3D effect
    blastWave.riseSpeed = 2.2; // Make the wave rise faster
    
    this.gameState.waves.push(blastWave);
    
    // Create additional targeted blast waves toward enemies (30% chance)
    if (enemies.length > 0 && random() < 0.3) {
      // Sort enemies by distance
      const sortedEnemies = [...enemies].sort((a, b) => {
        const distA = dist(this.x, this.z, a.x, a.z);
        const distB = dist(this.x, this.z, b.x, b.z);
        return distA - distB;
      });
      
      // Target one of the closest 3 enemies
      const closestCount = min(3, sortedEnemies.length);
      const targetEnemy = sortedEnemies[floor(random(closestCount))];
      
      // Calculate direction to enemy
      const dx = targetEnemy.x - this.x;
      const dz = targetEnemy.z - this.z;
      const distance = sqrt(dx*dx + dz*dz);
      
      // Create a directional blast wave toward the enemy
      // Position it partway between the skill and the enemy
      const midpointX = this.x + dx * 0.5;
      const midpointZ = this.z + dz * 0.5;
      
      const targetedWave = new Wave(
        midpointX,
        this.effectY, // Use ground level Y position
        midpointZ,
        radius * 0.7, // Slightly smaller
        [...this.typeConfig.COLOR, 200] // More opaque
      );
      targetedWave.growthRate = this.typeConfig.EXPANSION_RATE * 1.5; // Faster expansion
      targetedWave.maxRadius = radius * 1.2;
      targetedWave.lifespan = 15;
      targetedWave.damage = this.damage / 4; // Slightly more damage
      
      // Set height to create a dramatic 3D effect that rises from the ground
      targetedWave.height = 70; // Much taller height for pronounced 3D effect
      targetedWave.riseSpeed = 2.8; // Make the wave rise very quickly
      
      this.gameState.waves.push(targetedWave);
    }
  }
  
  createPhoenixEffect() {
    if (!this.gameState.waves) return;
    
    // Create initial phoenix wave at ground level
    const phoenixWave = new Wave(
      this.x,
      this.effectY, // Use ground level Y position
      this.z,
      this.typeConfig.RADIUS,
      [...this.typeConfig.COLOR, 200]
    );
    phoenixWave.growthRate = 5;
    phoenixWave.maxRadius = this.typeConfig.RADIUS * 1.5;
    phoenixWave.lifespan = 30;
    
    // Set height to create a dramatic 3D effect that rises from the ground
    phoenixWave.height = 120; // Very tall height for dramatic phoenix effect
    phoenixWave.riseSpeed = 3.5; // Make the wave rise very quickly for phoenix rebirth effect
    
    this.gameState.waves.push(phoenixWave);
    
    // Create rising particles
    this.createPhoenixParticles();
  }
  
  createPhoenixParticles() {
    if (!this.gameState.waves) return;
    
    // Create rising phoenix particles starting from ground level
    for (let i = 0; i < 10; i++) {
      const angle = random(TWO_PI);
      const radius = random(this.typeConfig.RADIUS * 0.2, this.typeConfig.RADIUS * 0.8);
      const x = this.x + cos(angle) * radius;
      const z = this.z + sin(angle) * radius;
      
      const particle = new Wave(
        x,
        this.effectY, // Start at ground level
        z,
        random(10, 30),
        [...this.typeConfig.COLOR, random(150, 200)]
      );
      particle.growthRate = random(1, 3);
      particle.maxRadius = random(20, 40);
      particle.riseSpeed = this.typeConfig.RISE_SPEED * random(0.8, 1.2);
      particle.lifespan = random(20, 40);
      
      // Make particles have dramatic 3D height for better visual effect
      particle.height = random(50, 120); // Much taller height for pronounced 3D effect
      
      this.gameState.waves.push(particle);
    }
  }
  
  drawPhoenix() {
    push();
    // Position phoenix at ground level
    translate(this.x, this.effectY, this.z);
    
    // Base glow on the ground
    push();
    noStroke();
    fill(...this.typeConfig.COLOR, 40 + sin(frameCount * 0.1) * 20);
    rotateX(HALF_PI);
    ellipse(0, 0, this.typeConfig.RADIUS * 2.5);
    pop();
    
    // Phoenix body - 3D rising effect
    noStroke();
    
    // Wing flapping animation
    const wingSpread = sin(frameCount * 0.05) * 0.3 + 0.7;
    const wingHeight = sin(frameCount * 0.1) * 20;
    const riseHeight = -80 - sin(frameCount * 0.03) * 30; // Rising effect
    
    // Draw 3D phoenix body
    push();
    translate(0, riseHeight, 0); // Move up from ground
    
    // Main body
    fill(...this.typeConfig.COLOR, 180);
    sphere(20);
    
    // Left wing
    push();
    translate(-40 * wingSpread, wingHeight, 0);
    rotateZ(PI/6);
    rotateY(-PI/4);
    fill(...this.typeConfig.COLOR, 150);
    
    // Create wing with custom shape
    beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = map(i, 0, 9, -PI/2, PI/2);
      const r = 60 - i * 5;
      const x = cos(angle) * r;
      const y = sin(angle) * r;
      vertex(x, y, 0);
    }
    endShape(CLOSE);
    pop();
    
    // Right wing
    push();
    translate(40 * wingSpread, wingHeight, 0);
    rotateZ(-PI/6);
    rotateY(PI/4);
    fill(...this.typeConfig.COLOR, 150);
    
    // Create wing with custom shape
    beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = map(i, 0, 9, -PI/2, PI/2);
      const r = 60 - i * 5;
      const x = cos(angle) * r;
      const y = sin(angle) * r;
      vertex(x, y, 0);
    }
    endShape(CLOSE);
    pop();
    
    // Tail
    push();
    translate(0, 10, -30);
    rotateX(PI/4);
    fill(...this.typeConfig.COLOR, 170);
    
    // Create tail with custom shape
    beginShape();
    for (let i = 0; i < 8; i++) {
      const x = map(i, 0, 7, -20, 20);
      const y = map(i, 0, 7, 0, -80);
      const z = sin(i/7 * PI) * 10;
      vertex(x, y, z);
    }
    endShape(CLOSE);
    pop();
    
    // Head
    push();
    translate(0, -20, 20);
    fill(...this.typeConfig.COLOR, 200);
    sphere(15);
    
    // Beak
    translate(0, 0, 15);
    fill(255, 200, 0, 200);
    cone(5, 15);
    pop();
    
    pop();
    
    // Rising flame particles
    for (let i = 0; i < 15; i++) {
      push();
      const angle = random(TWO_PI);
      const dist = random(10, 60);
      const x = cos(angle) * dist;
      const z = sin(angle) * dist;
      const y = random(-100, -10); // Vary height
      
      translate(x, y, z);
      fill(255, random(100, 255), 0, random(100, 200));
      sphere(random(3, 8));
      pop();
    }
    
    pop();
  }
  
  createMeteor() {
    // Create a meteor at a random position above the battlefield
    const radius = random(CONFIG.WORLD_RADIUS * 0.3, CONFIG.WORLD_RADIUS * 0.7);
    const angle = random(TWO_PI);
    const meteorX = cos(angle) * radius;
    const meteorZ = sin(angle) * radius;
    const meteorY = -500 - random(200); // Start high above
    
    // Get enemies
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    
    let targetX, targetZ;
    
    // 80% chance to target an enemy if available
    if (enemies.length > 0 && random() < 0.8) {
      // Choose a random enemy to target
      const targetEnemy = enemies[floor(random(enemies.length))];
      targetX = targetEnemy.x;
      targetZ = targetEnemy.z;
      
      // Add some randomness to the target position
      targetX += random(-50, 50);
      targetZ += random(-50, 50);
    } else {
      // Target a random position on the battlefield
      const targetRadius = random(CONFIG.WORLD_RADIUS * 0.5);
      const targetAngle = random(TWO_PI);
      targetX = cos(targetAngle) * targetRadius;
      targetZ = sin(targetAngle) * targetRadius;
    }
    
    // Set target Y to be well above ground level so meteors never hit the ground
    const targetY = -200 - random(100); // Well above ground level
    
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
      rotation: random(TWO_PI),
      targetX: targetX,
      targetZ: targetZ,
      targetY: targetY
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