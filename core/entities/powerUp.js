// Power-Up System
// Defines different types of power-ups that can spawn in the game

import CONFIG from '../../config.js';

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
    
    // Visibility improvement - raise power-ups above ground
    this.y = 50; // Start 50 units above ground
    
    // Auto-fly to player settings
    this.flyToPlayerTimer = 300; // Start flying to player after 5 seconds (300 frames)
    this.isFlying = false;
    this.flySpeed = 8; // Similar to GBA throw speed
    this.direction = 0; // Will be calculated when flying starts
    
    // Physics for flying animation
    this.velocityY = 0;
    this.gravity = 0.1; // Lighter gravity than GBA
    
    // Create fewer particles for better performance
    this.particles = [];
    for (let i = 0; i < 5; i++) { // Reduced from 20 to 5
      this.particles.push({
        angle: random(TWO_PI),
        radius: random(30, 50),
        speed: random(0.01, 0.03),
        size: random(3, 8),
        yOffset: random(-20, 20)
      });
    }
    
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
    
    // Only apply float offset if not flying
    if (!this.isFlying) {
      this.floatOffset = sin(frameCount * this.floatSpeed) * 5;
    }
    
    // Pulse effect
    this.pulseSize = sin(frameCount * 0.1) * 2;
    
    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.angle += particle.speed;
      
      // Make particles move up and down slightly
      particle.yOffset = sin(frameCount * 0.05 + i) * 15;
    }
    
    // Calculate distance to player
    const distToPlayer = dist(this.x, this.y, this.z, 
                             this.gameState.player.x, 
                             this.gameState.player.y, 
                             this.gameState.player.z);
    
    // Check if it's time to start flying to player
    if (!this.isFlying && this.flyToPlayerTimer <= 0) {
      this.isFlying = true;
      
      // Calculate direction to player
      this.direction = atan2(
        this.gameState.player.z - this.z,
        this.gameState.player.x - this.x
      );
      
      // Initial upward velocity for arc motion
      this.velocityY = -5;
      
      // Show message that power-up is coming to player
      if (window.showCooldownMessage) {
        window.showCooldownMessage(`${this.type.charAt(0).toUpperCase() + this.type.slice(1)} power-up is flying to you!`, 0);
      }
    }
    
    // Handle flying to player
    if (this.isFlying) {
      // Move toward player
      this.x += cos(this.direction) * this.flySpeed;
      this.z += sin(this.direction) * this.flySpeed;
      
      // Apply gravity and update vertical position
      this.velocityY += this.gravity;
      this.y += this.velocityY;
      
      // Cap the maximum height to ensure it doesn't go too high
      const maxHeight = this.gameState.player.y - 100;
      if (this.y < maxHeight) {
        this.y = maxHeight;
        this.velocityY = 0;
      }
      
      // Ensure it doesn't go below ground level
      if (this.y > 0) {
        this.y = 0;
        this.velocityY = -2; // Bounce effect
      }
    } else {
      // Decrease timer if not flying yet
      this.flyToPlayerTimer--;
    }
    
    // Check for collection by player (increased collection radius)
    if (distToPlayer < 50 && !this.collected) {
      this.collected = true;
      this.applyEffect();
      return true; // Signal to remove this power-up
    }
    
    // Decrease lifespan
    this.lifespan--;
    
    // Return true when lifespan is over to remove the power-up
    return this.lifespan <= 0;
  }
  
  show() {
    // Draw beam of light from ground to power-up (simplified)
    // Only show beam if not flying
    if (!this.isFlying) {
      push();
      stroke(this.color[0], this.color[1], this.color[2], 100);
      strokeWeight(3);
      line(this.x, 0, this.z, this.x, this.y + this.floatOffset, this.z);
      pop();
    } else {
      // Draw trail effect when flying
      push();
      stroke(this.color[0], this.color[1], this.color[2], 150);
      strokeWeight(4);
      // Draw a trail behind the power-up
      const trailLength = 5;
      for (let i = 1; i <= trailLength; i++) {
        const alpha = 150 - (i * 20); // Fade out
        stroke(this.color[0], this.color[1], this.color[2], alpha);
        strokeWeight(4 - (i * 0.5));
        const trailX = this.x - cos(this.direction) * this.flySpeed * i * 2;
        const trailZ = this.z - sin(this.direction) * this.flySpeed * i * 2;
        const trailY = this.y + (i * 2); // Trail slightly rises
        line(trailX, trailY, trailZ, this.x, this.y, this.z);
      }
      pop();
    }
    
    // Calculate current y position with float offset if not flying
    const currentY = this.y + (this.isFlying ? 0 : this.floatOffset);
    
    // Draw the power-up itself
    push();
    translate(this.x, currentY, this.z);
    rotateY(this.rotationY);
    
    // Add more rotation when flying for dynamic effect
    if (this.isFlying) {
      rotateX(frameCount * 0.1);
      rotateZ(frameCount * 0.05);
    }
    
    // Use a single light instead of multiple lights
    // Removed ambientLight and using only one pointLight
    pointLight(this.color[0], this.color[1], this.color[2], 0, 0, 0);
    
    // Draw power-up with simpler material settings
    noStroke();
    fill(this.color[0], this.color[1], this.color[2]);
    
    // Make power-ups larger for better visibility
    // Make them even larger when flying
    const displaySize = this.size * 2 + this.pulseSize + (this.isFlying ? 5 : 0);
    
    // Add glow effect
    ambientLight(this.color[0]/3, this.color[1]/3, this.color[2]/3);
    specularMaterial(250);
    shininess(20);
    
    // Simplified shapes for different power-ups
    switch(this.type) {
      case POWER_UP_TYPES.HEALTH:
        // Heart shape (simplified as a sphere)
        sphere(displaySize);
        break;
        
      case POWER_UP_TYPES.DAMAGE_BOOST:
        // Sword shape (simplified as a box)
        box(displaySize, displaySize*1.5, displaySize/3);
        break;
        
      case POWER_UP_TYPES.SPEED_BOOST:
        // Lightning bolt (simplified as a cone)
        cone(displaySize, displaySize*1.5);
        break;
        
      case POWER_UP_TYPES.COOLDOWN_RESET:
        // Clock (simplified as a torus)
        torus(displaySize*0.7, displaySize/4);
        break;
        
      case POWER_UP_TYPES.SHIELD:
        // Shield (simplified as a sphere)
        sphere(displaySize);
        break;
        
      case POWER_UP_TYPES.MULTI_SHOT:
        // Multiple bullets (simplified as a single sphere)
        sphere(displaySize);
        break;
        
      case POWER_UP_TYPES.XP_BOOST:
        // Star (simplified as an octahedron)
        octahedron(displaySize);
        break;
        
      default:
        // Default cube
        box(displaySize);
    }
    
    // Draw particles (simplified)
    // Add more particles when flying
    const particleCount = this.isFlying ? this.particles.length * 2 : this.particles.length;
    for (let i = 0; i < particleCount; i++) {
      // Use existing particles or calculate new positions for extra particles
      const particleIndex = i % this.particles.length;
      const particle = this.particles[particleIndex];
      
      // Calculate particle position
      let particleX, particleZ, particleY;
      
      if (i < this.particles.length) {
        // Original particles orbit around the power-up
        particleX = cos(particle.angle) * particle.radius;
        particleZ = sin(particle.angle) * particle.radius;
        particleY = particle.yOffset;
      } else {
        // Extra particles for flying mode - create a trail effect
        const trailFactor = (i - this.particles.length) / this.particles.length;
        particleX = -cos(this.direction) * (30 + trailFactor * 50);
        particleZ = -sin(this.direction) * (30 + trailFactor * 50);
        particleY = particle.yOffset + trailFactor * 20;
      }
      
      push();
      translate(particleX, particleY, particleZ);
      
      // Make particles pulse when flying
      const particleSize = this.isFlying ? 
        particle.size * (1 + sin(frameCount * 0.2 + i) * 0.3) : 
        particle.size;
        
      // Particles fade out in the trail
      const alpha = i < this.particles.length ? 150 : 150 * (1 - ((i - this.particles.length) / this.particles.length));
      
      fill(this.color[0], this.color[1], this.color[2], alpha);
      sphere(particleSize);
      pop();
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
  
  // Set y to 0 - the PowerUp constructor will adjust the height
  // to make it visible above ground
  const y = 0;
  
  // Random power-up type
  const powerUpTypes = Object.values(POWER_UP_TYPES);
  const randomType = powerUpTypes[Math.floor(random(powerUpTypes.length))];
  
  // Show spawn message with more details
  if (window.showCooldownMessage) {
    window.showCooldownMessage(`${randomType.charAt(0).toUpperCase() + randomType.slice(1)} power-up spawned! It will fly to you in 5 seconds.`, 0);
  }
  
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