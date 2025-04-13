// Enemy Module
// Represents an enemy entity with properties and rendering

import CONFIG from '../config.js';
import { GameBoyAdvanced } from './gameBoyAdvanced.js';
import { HealthBar } from './healthBar.js';

export class Enemy {
  constructor(x, z, attributes, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.z = z;
    this.y = 0;

    // Random attributes with multipliers
    let sizeMultiplier = attributes.sizeMultiplier || 1;
    this.width = CONFIG.ENEMY_WIDTH * sizeMultiplier;
    this.height = CONFIG.ENEMY_HEIGHT * sizeMultiplier;
    this.depth = CONFIG.ENEMY_DEPTH * sizeMultiplier;

    // Health scales with size
    this.maxHealth = CONFIG.ENEMY_HEALTH * (sizeMultiplier * 1.5);
    this.health = this.maxHealth;

    // Bigger enemies are slower
    this.speed = CONFIG.ENEMY_SPEED / sizeMultiplier;

    // Damage scales with size
    this.damageMultiplier = sizeMultiplier;

    this.rotation = 0;

    // Store color attributes
    this.baseColor = attributes.baseColor || color(255, 0, 0);
    this.damageColor = attributes.damageColor || color(255, 165, 0);
    this.colorBlend = attributes.colorBlend || 0; // 0 = base color, 1 = damage color
    
    // Create health bar
    this.healthBar = new HealthBar({
      alwaysGreen: false,      // Use color based on health percentage
      useEntityWidth: true,     // Use enemy width for health bar width
      verticalOffset: CONFIG.ENEMY_HEALTH_BAR.OFFSET // Use config offset
    });
  }

  static spawnRandom(gameState) {
    let angle = random(TWO_PI);
    let radius = CONFIG.ENEMY_RADIUS;
    let x = cos(angle) * radius;
    let z = sin(angle) * radius;

    // Random attributes
    let sizeMultiplier = random(0.7, 1.5); // Size variation
    let colorBlend = random(); // How much damage color to show

    // Different enemy types
    let attributes = {
      sizeMultiplier: sizeMultiplier,
      baseColor: color(255, 0, 0), // Base red
      damageColor: color(255, 165, 0), // Orange for damage
      colorBlend: colorBlend
    };

    return new Enemy(x, z, attributes, gameState);
  }

  update() {
    // Find the closest character to target
    const closestCharacter = this.findNearestCharacter();
    
    // If there's a character to target, move towards it
    if (closestCharacter) {
      // Calculate movement towards the closest character
      let angle = atan2(closestCharacter.z - this.z, closestCharacter.x - this.x);
      this.x += cos(angle) * this.speed;
      this.z += sin(angle) * this.speed;
      this.rotation = angle + HALF_PI; // Make enemy face the character
      
      // Check if enemy has reached the character
      if (dist(this.x, this.z, closestCharacter.x, closestCharacter.z) < 50) {
        // Attack the character
        if (closestCharacter.takeDamage) {
          closestCharacter.takeDamage(CONFIG.ENEMY_DAMAGE_TO_CHARACTER * this.damageMultiplier);
        }
      }
    } else {
      // If no characters, move towards the center (pillar) as before
      let angle = atan2(0 - this.z, 0 - this.x);
      this.x += cos(angle) * this.speed;
      this.z += sin(angle) * this.speed;
      this.rotation = angle + HALF_PI; // Make enemy face the pillar

      // Check if enemy has reached the pillar
      if (dist(this.x, this.z, 0, 0) < 50) {
        this.gameState.pillarHeight = max(0, this.gameState.pillarHeight - CONFIG.ENEMY_DAMAGE_TO_PILLAR);
        if (this.gameState.pillarHeight === 0) {
          this.gameState.playerHealth -= CONFIG.ENEMY_DAMAGE_TO_PLAYER;
        }
      }
    }
  }
  
  findNearestCharacter() {
    // Get all characters from the game state using the static method
    const characters = GameBoyAdvanced.getCharacters(this.gameState);
    
    if (characters.length === 0) return null;
    
    // Find the closest character
    let closestCharacter = null;
    let closestDistance = Infinity;
    
    for (const character of characters) {
      const distance = dist(this.x, this.z, character.x, character.z);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCharacter = character;
      }
    }
    
    return closestCharacter;
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);

    // Calculate color based on health and damage type
    let healthPercent = this.health / this.maxHealth;
    
    // Ensure healthPercent is valid (not NaN or negative)
    healthPercent = isNaN(healthPercent) ? 0 : Math.max(0, Math.min(1, healthPercent));
    
    let r = lerp(this.baseColor._getRed(), this.damageColor._getRed(), this.colorBlend);
    let g = lerp(this.baseColor._getGreen(), this.damageColor._getGreen(), this.colorBlend);
    let b = lerp(this.baseColor._getBlue(), this.damageColor._getBlue(), this.colorBlend);

    // Darken based on health, but ensure we don't get pure white (which happens if health > maxHealth)
    r = r * healthPercent;
    g = g * healthPercent;
    b = b * healthPercent;
    
    // Debug: log enemy health values if they appear white
    if (r > 240 && g > 240 && b > 240) {
      console.log(`White enemy detected: health=${this.health}, maxHealth=${this.maxHealth}, healthPercent=${healthPercent}`);
    }

    fill(r, g, b);
    box(this.width, this.height, this.depth);
    
    // Draw health bar above the enemy
    this.drawHealthBar();
    
    pop();
  }
  
  // Draw health bar above the enemy
  drawHealthBar() {
    // Check if health bars are enabled in config
    if (!CONFIG.ENEMY_HEALTH_BAR.ENABLED) return;
    
    // Update health bar with current health values
    this.healthBar.updateHealth(this.health, this.maxHealth);
    
    // Draw the health bar
    this.healthBar.draw(this, this.rotation);
    
    // Debug: log health values if they seem incorrect
    const healthPercent = this.healthBar.getHealthPercentage();
    if (healthPercent > 1 || healthPercent < 0 || isNaN(healthPercent)) {
      console.log(`Invalid health percentage: ${healthPercent}, health=${this.health}, maxHealth=${this.maxHealth}`);
    }
  }

  takeDamage(amount) {
    // Ensure amount is a valid number
    if (isNaN(amount) || amount <= 0) {
      console.log(`Invalid damage amount: ${amount}`);
      return false;
    }
    
    // Debug log before damage
    console.debug(`[ENEMY DEBUG] Before damage: health=${this.health.toFixed(2)}, damage=${amount.toFixed(2)}`);
    
    // Apply damage
    this.health -= amount;
    
    // Debug log after damage
    console.debug(`[ENEMY DEBUG] After damage: health=${this.health.toFixed(2)}, maxHealth=${this.maxHealth.toFixed(2)}`);
    
    // Check if enemy is dead
    const isDead = this.health <= 0;
    
    // Debug log if enemy died
    if (isDead) {
      console.debug(`[ENEMY DEBUG] Enemy died at position x=${this.x.toFixed(2)}, z=${this.z.toFixed(2)}`);
    }
    
    // Return true if enemy is dead
    return isDead;
  }

  getPosition() {
    return { x: this.x, y: this.y, z: this.z };
  }
}