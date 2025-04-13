// Power-Up System
// Defines different types of power-ups that can spawn in the game

import CONFIG from '../config.js';

// Power-up types
export const POWER_UP_TYPES = {
  HEALTH: 'health',
  DAMAGE_BOOST: 'damage-boost',
  SPEED_BOOST: 'speed-boost',
  COOLDOWN_RESET: 'cooldown-reset',
  SHIELD: 'shield',
  MULTI_SHOT: 'multi-shot',
  XP_BOOST: 'xp-boost'
};

// Power-up class
export class PowerUp {
  constructor(x, y, z, type, gameState) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.gameState = gameState;
    this.size = 15;
    this.rotationY = 0;
    this.floatOffset = 0;
    this.floatSpeed = 0.05;
    this.lifespan = 600; // 10 seconds at 60fps
    this.collected = false;
    this.pulseSize = 0;
    
    // Set color based on type
    switch(this.type) {
      case POWER_UP_TYPES.HEALTH:
        this.color = [255, 50, 50]; // Red
        break;
      case POWER_UP_TYPES.DAMAGE_BOOST:
        this.color = [255, 150, 0]; // Orange
        break;
      case POWER_UP_TYPES.SPEED_BOOST:
        this.color = [0, 255, 255]; // Cyan
        break;
      case POWER_UP_TYPES.COOLDOWN_RESET:
        this.color = [150, 50, 255]; // Purple
        break;
      case POWER_UP_TYPES.SHIELD:
        this.color = [50, 150, 255]; // Blue
        break;
      case POWER_UP_TYPES.MULTI_SHOT:
        this.color = [255, 255, 0]; // Yellow
        break;
      case POWER_UP_TYPES.XP_BOOST:
        this.color = [0, 255, 150]; // Green
        break;
      default:
        this.color = [255, 255, 255]; // White
    }
  }
  
  update() {
    // Rotate and float animation
    this.rotationY += 0.02;
    this.floatOffset = sin(frameCount * this.floatSpeed) * 5;
    
    // Pulse effect
    this.pulseSize = sin(frameCount * 0.1) * 2;
    
    // Decrease lifespan
    this.lifespan--;
    
    // Check for collection by player
    const distToPlayer = dist(this.x, this.y, this.z, 
                             this.gameState.player.x, 
                             this.gameState.player.y, 
                             this.gameState.player.z);
    
    if (distToPlayer < 30 && !this.collected) {
      this.collected = true;
      this.applyEffect();
      return true; // Signal to remove this power-up
    }
    
    // Return true when lifespan is over to remove the power-up
    return this.lifespan <= 0;
  }
  
  show() {
    push();
    translate(this.x, this.y + this.floatOffset, this.z);
    rotateY(this.rotationY);
    
    // Glow effect
    ambientLight(this.color[0]/2, this.color[1]/2, this.color[2]/2);
    pointLight(this.color[0], this.color[1], this.color[2], 0, 0, 0);
    
    // Draw power-up
    noStroke();
    fill(this.color[0], this.color[1], this.color[2]);
    
    // Different shapes for different power-ups
    switch(this.type) {
      case POWER_UP_TYPES.HEALTH:
        // Heart shape (simplified as a sphere with texture)
        sphere(this.size + this.pulseSize);
        break;
      case POWER_UP_TYPES.DAMAGE_BOOST:
        // Sword shape (simplified as a box)
        box(this.size + this.pulseSize, this.size*2 + this.pulseSize, this.size/2 + this.pulseSize);
        break;
      case POWER_UP_TYPES.SPEED_BOOST:
        // Lightning bolt (simplified as a cone)
        cone(this.size + this.pulseSize, this.size*2 + this.pulseSize);
        break;
      case POWER_UP_TYPES.COOLDOWN_RESET:
        // Clock (simplified as a torus)
        torus(this.size + this.pulseSize, this.size/3 + this.pulseSize);
        break;
      case POWER_UP_TYPES.SHIELD:
        // Shield (simplified as a half sphere)
        sphere(this.size + this.pulseSize);
        break;
      case POWER_UP_TYPES.MULTI_SHOT:
        // Multiple bullets (simplified as multiple small spheres)
        for (let i = 0; i < 3; i++) {
          push();
          translate(cos(i * TWO_PI/3) * (this.size/2), 0, sin(i * TWO_PI/3) * (this.size/2));
          sphere((this.size/2) + this.pulseSize);
          pop();
        }
        break;
      case POWER_UP_TYPES.XP_BOOST:
        // Star (simplified as an octahedron)
        octahedron(this.size + this.pulseSize);
        break;
      default:
        // Default cube
        box(this.size + this.pulseSize);
    }
    
    pop();
  }
  
  applyEffect() {
    // Apply effect based on power-up type
    switch(this.type) {
      case POWER_UP_TYPES.HEALTH:
        // Heal player
        this.gameState.playerHealth = min(this.gameState.playerHealth + 25, CONFIG.PLAYER_HEALTH);
        showCooldownMessage("Health +25", 0);
        break;
        
      case POWER_UP_TYPES.DAMAGE_BOOST:
        // Increase damage for a limited time
        this.gameState.player.damageMultiplier = 2.0;
        this.gameState.player.damageBoostTimer = 600; // 10 seconds
        showCooldownMessage("Damage Boost!", 0);
        break;
        
      case POWER_UP_TYPES.SPEED_BOOST:
        // Increase movement speed for a limited time
        this.gameState.player.speedMultiplier = 2.0;
        this.gameState.player.speedBoostTimer = 600; // 10 seconds
        showCooldownMessage("Speed Boost!", 0);
        break;
        
      case POWER_UP_TYPES.COOLDOWN_RESET:
        // Reset all skill cooldowns
        Object.keys(this.gameState.skills).forEach(skillName => {
          this.gameState.skills[skillName].cooldownRemaining = 0;
          this.gameState.skillCooldowns[skillName] = 0; // For legacy support
        });
        showCooldownMessage("All Skills Ready!", 0);
        break;
        
      case POWER_UP_TYPES.SHIELD:
        // Add a temporary shield
        this.gameState.player.shieldActive = true;
        this.gameState.player.shieldHealth = 100;
        this.gameState.player.shieldTimer = 900; // 15 seconds
        showCooldownMessage("Shield Activated!", 0);
        break;
        
      case POWER_UP_TYPES.MULTI_SHOT:
        // Enable multi-shot for a limited time
        this.gameState.player.multiShotActive = true;
        this.gameState.player.multiShotCount = 3; // Triple shot
        this.gameState.player.multiShotTimer = 600; // 10 seconds
        showCooldownMessage("Multi-Shot Enabled!", 0);
        break;
        
      case POWER_UP_TYPES.XP_BOOST:
        // Give XP boost
        const xpGain = 500;
        this.gameState.xp += xpGain;
        this.checkLevelUp();
        showCooldownMessage(`+${xpGain} XP!`, 0);
        break;
    }
  }
  
  checkLevelUp() {
    // Check if player has enough XP to level up
    if (this.gameState.xp >= this.gameState.xpToNextLevel) {
      this.gameState.level++;
      this.gameState.xp -= this.gameState.xpToNextLevel;
      this.gameState.xpToNextLevel = Math.floor(this.gameState.xpToNextLevel * 1.2); // Increase XP needed for next level
      this.gameState.skillPoints++; // Award a skill point
      
      // Show level up message
      showCooldownMessage(`Level Up! Now level ${this.gameState.level}`, 0);
      
      // Check for additional level ups
      if (this.gameState.xp >= this.gameState.xpToNextLevel) {
        this.checkLevelUp();
      }
    }
  }
}

// Function to spawn a random power-up
export function spawnRandomPowerUp(gameState) {
  // Random position within a reasonable radius of the player
  const angle = random(TWO_PI);
  const radius = random(100, 200);
  const x = gameState.player.x + cos(angle) * radius;
  const z = gameState.player.z + sin(angle) * radius;
  const y = gameState.player.y;
  
  // Random power-up type
  const powerUpTypes = Object.values(POWER_UP_TYPES);
  const randomType = powerUpTypes[Math.floor(random(powerUpTypes.length))];
  
  // Create and return the power-up
  return new PowerUp(x, y, z, randomType, gameState);
}

// Import this function from ui.js
function showCooldownMessage(message, skillIndex) {
  // This is a placeholder - the actual implementation is in ui.js
  // We'll need to make sure this function is properly imported or defined
  if (window.showCooldownMessage) {
    window.showCooldownMessage(message, skillIndex);
  } else {
    console.log("UI Message:", message);
  }
}