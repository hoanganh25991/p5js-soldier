// Game Character Module
// Implements different game characters spawned by the GBA

import CONFIG from '../config.js';
import { findNearestEnemies, updateHeight } from '../utils.js';
import { Bullet } from './bullet.js';
import { Wave } from './wave.js';
import { Projectile } from './projectile.js';

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
    this.lastHealth = this.health; // Track previous health for damage indicators
    this.damage = this.typeConfig.DAMAGE;
    this.speed = this.typeConfig.SPEED;
    this.size = this.typeConfig.SIZE;
    
    // Dimensions based on size (reduced by half for better gameplay)
    this.width = 75 * this.size;
    this.height = 100 * this.size;
    this.depth = 75 * this.size;
    
    // Combat
    // Different attack ranges based on character type
    if (this.type === 'HERO') {
      this.attackRange = 10; // Hero needs to be very close to attack
    } else if (this.type === 'MARIO') {
      this.attackRange = 100; // Melee attack range
    } else if (this.type === 'TANK') {
      this.attackRange = 150; // Tank has slightly longer range due to its gun
    } else {
      this.attackRange = 600; // Ranged attack range (MEGAMAN, SONGOKU)
    }
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
    
    // Physics for jumping and movement
    this.groundLevel = -50; // Default ground level
    this.y = this.groundLevel; // Start at ground level
    this.velocityY = 0; // Vertical velocity for jumping
    this.gravity = 0.5; // Gravity force
    this.isJumping = false; // Track if character is jumping
    
    // Projectile properties
    this.projectiles = []; // Store active projectiles
  }
  
  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Apply physics for jumping
    if (this.isJumping || this.y < this.groundLevel) {
      // Apply gravity
      this.velocityY += this.gravity;
      this.y += this.velocityY;
      
      // Check if landed
      if (this.y >= this.groundLevel) {
        this.y = this.groundLevel;
        this.velocityY = 0;
        this.isJumping = false;
      }
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      // Remove projectiles that are done
      if (projectile.isDone) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // Only update targeting and movement every few frames to improve performance
    if (this.gameState.frameCount % 10 === 0) {
      // Find nearest enemy
      const target = this.findNearestEnemy();
      
      // Track if we need to find a new target
      let targetDefeated = false;
      
      if (target) {
        // Calculate angle to target
        const angleToTarget = atan2(target.z - this.z, target.x - this.x);
        this.rotation = angleToTarget + HALF_PI;
        
        // Calculate distance to target
        const distToTarget = dist(this.x, this.z, target.x, target.z);
        
        if (distToTarget > this.attackRange) {
          // Move towards target if not in attack range
          // Add acceleration when far from target for faster movement
          const speedMultiplier = distToTarget > this.attackRange * 5 ? 1.5 : 1.0;
          this.x += cos(angleToTarget) * this.speed * speedMultiplier;
          this.z += sin(angleToTarget) * this.speed * speedMultiplier;
        } else {
          // Attack if in range and cooldown is ready
          if (this.attackCooldown <= 0) {
            // Attack the target
            this.attack(target);
            this.attackCooldown = this.attackRate;
            
            // Check if target is defeated after attack
            if (target.health <= 0) {
              targetDefeated = true;
            }
          }
        }
        
        // If target was defeated, immediately look for the next closest enemy
        if (targetDefeated) {
          // Find the next target immediately
          const nextTarget = this.findNearestEnemy();
          if (nextTarget) {
            // Calculate angle to next target
            const angleToNextTarget = atan2(nextTarget.z - this.z, nextTarget.x - this.x);
            
            // Start moving toward the next target with a burst of speed
            this.x += cos(angleToNextTarget) * this.speed * 3; // Move much faster initially
            this.z += sin(angleToNextTarget) * this.speed * 3;
          }
        }
      }
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // Use special ability if cooldown is ready, not too frequently, and only if enemies exist
    if (this.specialCooldown <= 0 && this.gameState.frameCount % 5 === 0) {
      // Check if there are any enemies before using special ability
      const hasEnemies = this.findNearestEnemy() !== null;
      if (hasEnemies) {
        this.useSpecialAbility();
        this.specialCooldown = this.specialRate;
      } else {
        // If no enemies, set a shorter cooldown to check again soon
        this.specialCooldown = 30;
      }
    }
    
    // Update animation at a slower rate
    if (this.gameState.frameCount % 3 === 0) {
      this.animationFrame += this.animationSpeed;
    }
  }
  
  show() {
    // Draw all projectiles first
    for (const projectile of this.projectiles) {
      projectile.show();
    }
    
    push();
    // Position the character at their current height (for jumping)
    translate(this.x, this.y, this.z);
    
    // Use the character's actual rotation instead of continuous rotation
    // This makes the character face the direction they're moving/attacking
    rotateY(this.rotation);
    
    // Base character body
    this.drawCharacter();
    
    // Health bar above character
    this.drawHealthBar();
    
    pop();
  }
  
  drawHealthBar() {
    // Calculate health percentage and ensure it's valid
    const maxHealth = CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER;
    let healthPercent = this.health / maxHealth;
    healthPercent = isNaN(healthPercent) ? 0 : Math.max(0, Math.min(1, healthPercent));
    
    // Debug log health values if they seem incorrect
    if (healthPercent > 1 || healthPercent < 0 || isNaN(healthPercent)) {
      console.debug(`[CHARACTER HEALTH BAR DEBUG] Invalid health percentage: ${healthPercent}, health=${this.health}, maxHealth=${maxHealth}`);
    }
    
    // Position the health bar above the character
    const barHeight = 15; // Increased height for more pronounced 3D effect
    const barWidth = this.width * 1.2; // Slightly wider than the character
    const barDepth = 20; // Significantly increased depth for true 3D appearance
    const barY = -this.height / 2 - CONFIG.ENEMY_HEALTH_BAR.OFFSET - 5; // Slightly higher position
    
    // Make the health bar always face the camera
    const currentRotation = this.rotation;
    rotateY(-currentRotation);
    
    // Create a more pronounced 3D health bar
    push();
    translate(0, barY, 0);
    
    // Add slight rotation for better 3D perspective
    rotateX(PI/16); // Slight tilt forward
    
    // Draw the outer frame/casing of the health bar (like a capsule)
    push();
    stroke(30, 30, 30);
    strokeWeight(1);
    fill(70, 70, 70);
    
    // Main frame
    box(barWidth + 6, barHeight + 6, barDepth + 6);
    
    // Inner cutout (black background)
    push();
    translate(0, 0, 2); // Move slightly forward
    fill(20, 20, 20);
    box(barWidth, barHeight, barDepth + 8); // Slightly deeper than the frame
    pop();
    pop();
    
    // Draw the health bar background (empty portion)
    push();
    noStroke();
    fill(40, 40, 40);
    translate(0, 0, 3); // Position in front of the cutout
    box(barWidth - 4, barHeight - 4, barDepth - 4);
    pop();
    
    // Only draw health bar if there's health to show
    if (healthPercent > 0) {
      // Draw the filled portion with 3D lighting effects
      push();
      noStroke();
      
      // Calculate the position for the health bar fill
      // It should start from the left edge and extend based on health percentage
      const fillWidth = barWidth * healthPercent;
      translate(-barWidth/2 + fillWidth/2, 0, 4); // Position at left edge + half of fill width
      
      // Use a fixed color for health bar that doesn't match character colors
      const baseColor = [200, 200, 200]; // Light gray for all health bars
      
      // Create a glowing 3D health bar with multiple layers
      
      // Base layer (slightly darker)
      fill(baseColor[0] * 0.7, baseColor[1] * 0.7, baseColor[2] * 0.7);
      box(fillWidth, barHeight - 6, barDepth - 6);
      
      // Middle layer (base color)
      push();
      translate(0, 0, 1);
      fill(baseColor[0], baseColor[1], baseColor[2]);
      box(fillWidth - 2, barHeight - 8, barDepth - 8);
      pop();
      
      // Top layer (brighter for highlight)
      push();
      translate(0, 0, 2);
      fill(min(255, baseColor[0] * 1.3), min(255, baseColor[1] * 1.3), min(255, baseColor[2] * 1.3));
      box(fillWidth - 4, barHeight - 10, barDepth - 10);
      pop();
      
      // Add pulsing glow effect
      const pulseAmount = sin(frameCount * 0.1) * 0.5 + 0.5; // Pulsing between 0 and 1
      push();
      translate(0, 0, 3);
      fill(baseColor[0], baseColor[1], baseColor[2], 100 * pulseAmount);
      box(fillWidth - 6, barHeight - 12, barDepth - 6);
      pop();
      
      // Add highlight reflections (small white strips)
      push();
      fill(255, 255, 255, 150);
      translate(0, -barHeight/4, 4);
      box(fillWidth * 0.8, 1, barDepth - 12);
      pop();
      
      pop();
    }
    
    // Add decorative elements to make it look more high-tech
    
    // Left cap
    push();
    translate(-barWidth/2 - 3, 0, 0);
    fill(80, 80, 80);
    rotateY(PI/2);
    cylinder(barHeight/2, 5);
    pop();
    
    // Right cap
    push();
    translate(barWidth/2 + 3, 0, 0);
    fill(80, 80, 80);
    rotateY(PI/2);
    cylinder(barHeight/2, 5);
    pop();
    
    pop(); // End of health bar group
    
    // Debug log for health bar
    if (this.gameState.frameCount % 60 === 0) { // Log once per second
      console.debug(`[CHARACTER HEALTH BAR DEBUG] ${this.type} health: ${this.health.toFixed(2)}/${maxHealth} (${(healthPercent * 100).toFixed(1)}%)`);
    }
  }
  

  
  attack(target) {
    // Different attack based on character type
    switch (this.type) {
      case 'TANK':
        // Tank fires a visible shell
        const tankShellX = this.x + Math.cos(this.rotation - HALF_PI) * this.width * 0.7;
        const tankShellY = this.y - this.height * 0.3;
        const tankShellZ = this.z + Math.sin(this.rotation - HALF_PI) * this.width * 0.7;
        
        // Create visible projectile
        const tankShell = new Projectile(
          tankShellX,
          tankShellY,
          tankShellZ,
          this.rotation - HALF_PI,
          'TANK_SHELL',
          this,
          this.gameState
        );
        
        // Add to projectiles array
        this.projectiles.push(tankShell);
        
        // Also add to gameState bullets for backward compatibility
        const tankBullet = new Bullet(
          tankShellX, 
          tankShellY, 
          tankShellZ, 
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
        // Mario jumps on enemies - FULL BODY JUMP
        this.velocityY = -15; // Stronger jump
        this.isJumping = true;
        
        // Only damage enemy if directly above them
        if (dist(this.x, this.z, target.x, target.z) < this.width) {
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
        break;
        
      case 'MEGAMAN':
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
        break;
        
      case 'SONGOKU':
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
        break;
    }
  }
  
  useSpecialAbility() {
    // Special abilities unique to each character type
    switch (this.type) {
      case 'TANK':
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
        break;
        
      case 'HERO':
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
        break;
        
      case 'MARIO':
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
        break;
        
      case 'MEGAMAN':
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
        break;
        
      case 'SONGOKU':
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
        break;
    }
  }
  
  takeDamage(amount) {
    // Store previous health for health bar animation
    this.lastHealth = this.health;
    
    // Debug log before damage
    console.debug(`[CHARACTER DEBUG] ${this.type} before damage: health=${this.health.toFixed(2)}, damage=${amount.toFixed(2)}`);
    
    // Apply damage
    this.health -= amount;
    
    // Debug log after damage
    console.debug(`[CHARACTER DEBUG] ${this.type} after damage: health=${this.health.toFixed(2)}, maxHealth=${CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER}`);
    
    // Create hit effect - simplified for better performance
    if (this.gameState && this.gameState.waves) {
      // Create a small impact wave
      const hitWave = new Wave(
        this.x, 
        this.y, 
        this.z, 
        this.width * 1.2, 
        [255, 0, 0, 120]
      );
      hitWave.growthRate = 1.5;
      hitWave.maxRadius = this.width * 1.5;
      hitWave.damage = 0; // This wave doesn't cause damage
      this.gameState.waves.push(hitWave);
    }
    
    // Check if character is dead
    const isDead = this.health <= 0;
    
    // Debug log if character died
    if (isDead) {
      console.debug(`[CHARACTER DEBUG] ${this.type} died at position x=${this.x.toFixed(2)}, z=${this.z.toFixed(2)}`);
    }
    
    // Return true if character is dead
    return isDead;
  }
  
  // Cache for enemy search to improve performance
  _enemyCache = {
    lastUpdateFrame: -1,
    nearestEnemy: null,
    enemyCount: 0
  };
  
  // Find the nearest enemy with caching to improve performance
  findNearestEnemy() {
    // Only update the cache every 10 frames to reduce calculations
    const currentFrame = this.gameState.frameCount;
    
    // If we have a recent cache and the enemy count hasn't changed, use the cached result
    if (
      this._enemyCache.lastUpdateFrame > currentFrame - 10 && 
      this.gameState.enemyController && 
      this.gameState.enemyController.getEnemies().length === this._enemyCache.enemyCount
    ) {
      return this._enemyCache.nearestEnemy;
    }
    
    // Get all enemies from the controller
    const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
    this._enemyCache.enemyCount = enemies.length;
    
    // If no enemies, cache null and return
    if (enemies.length === 0) {
      this._enemyCache.nearestEnemy = null;
      this._enemyCache.lastUpdateFrame = currentFrame;
      return null;
    }
    
    // Find the closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = dist(this.x, this.z, enemy.x, enemy.z);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    // Update cache
    this._enemyCache.nearestEnemy = closestEnemy;
    this._enemyCache.lastUpdateFrame = currentFrame;
    
    return closestEnemy;
  }
}