// Base Character Class
// Provides common functionality for all game characters

import CONFIG from '../../config.js';
import { Bullet } from '../bullet.js';
import { Wave } from '../wave.js';
import { Projectile } from '../projectile.js';
import { HealthBar } from '../healthBar.js';

export class Character {
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
    
    // Dimensions based on size
    this.width = 75 * this.size;
    this.height = 100 * this.size;
    this.depth = 75 * this.size;
    
    // Combat
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
    
    // Create health bar
    this.healthBar = new HealthBar({
      alwaysGreen: true,       // Always use green for character health bars
      useEntityWidth: true,     // Use character width for health bar width
      verticalOffset: 20        // Position above character
    });
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
  
  // Animation helper methods
  getBreathingEffect() {
    return sin(frameCount * 0.05) * 0.05; // Subtle breathing
  }
  
  getWalkingEffect() {
    return sin(this.animationFrame * 2) * 0.2; // Walking animation
  }
  
  getAttackingEffect() {
    return this.attackCooldown < 10 ? sin(frameCount * 0.5) * 0.3 : 0; // Attack animation
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
    // Update health bar with current health values
    const maxHealth = CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER;
    this.healthBar.updateHealth(this.health, maxHealth);
    
    // Draw the health bar
    this.healthBar.draw(this, this.rotation);
    
    // Debug log for health bar
    if (this.gameState.frameCount % 60 === 0) { // Log once per second
      const healthPercent = this.healthBar.getHealthPercentage();
      console.debug(`[CHARACTER HEALTH BAR DEBUG] ${this.type} health: ${this.health.toFixed(2)}/${maxHealth} (${(healthPercent * 100).toFixed(1)}%)`);
    }
  }
  
  // Default implementation - should be overridden by subclasses
  drawCharacter() {
    push();
    // Body
    fill(200, 200, 0); // Yellow
    box(this.width, this.height * 0.6, this.depth);
    
    // Head
    push();
    translate(0, -this.height * 0.4, 0);
    fill(220, 220, 0);
    sphere(this.width * 0.3);
    pop();
    
    // Arms
    push();
    translate(-this.width * 0.6, -this.height * 0.1, 0);
    rotateZ(-PI/8 + sin(this.animationFrame) * 0.2);
    fill(200, 200, 0);
    box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
    pop();
    
    push();
    translate(this.width * 0.6, -this.height * 0.1, 0);
    rotateZ(PI/8 - sin(this.animationFrame) * 0.2);
    fill(200, 200, 0);
    box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
    pop();
    
    // Legs
    push();
    translate(-this.width * 0.3, this.height * 0.3, 0);
    rotateX(sin(this.animationFrame) * 0.2);
    fill(180, 180, 0);
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    pop();
    
    push();
    translate(this.width * 0.3, this.height * 0.3, 0);
    rotateX(-sin(this.animationFrame) * 0.2);
    fill(180, 180, 0);
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    pop();
    pop();
  }
  
  // Default attack method - should be overridden by subclasses
  attack(target) {
    console.debug(`[CHARACTER DEBUG] ${this.type} attacking target`);
  }
  
  // Default special ability method - should be overridden by subclasses
  useSpecialAbility() {
    console.debug(`[CHARACTER DEBUG] ${this.type} using special ability`);
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