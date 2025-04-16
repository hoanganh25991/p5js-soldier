// Turret Module

import CONFIG from '../../config.js';
import { findNearestEnemies, showAimLine, autoShoot, updateHeight } from '../utils.js';
import { Wave } from './wave.js';

export class Turret {
  constructor(x, y, z, direction, speed, distance, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = 30; // Slightly wider
    this.height = 40; // Slightly taller
    this.depth = 30; // Slightly deeper
    this.lifespan = CONFIG.TURRET.DURATION;
    this.rotation = 0;
    this.damage = CONFIG.TURRET.DAMAGE;
    this.legLength = 20;
    
    // Health properties
    this.health = CONFIG.TURRET.HEALTH;
    this.maxHealth = CONFIG.TURRET.HEALTH;
    this.isDestroyed = false;
    
    // Throwing properties
    this.direction = direction || 0;
    this.speed = speed || 0;
    this.distance = distance || 0;
    this.distanceTraveled = 0;
    this.landingEffectCreated = false; // Flag to track if landing effect has been created
    
    // Physics for throwing
    this.velocityY = -15; // Increased initial upward velocity for better visibility
    this.gravity = 0.3;   // Reduced gravity for slower fall and more hang time
    this.grounded = false;
    this.groundLevel = 0; // Fixed ground level - set to 0 to be more visible
    
    // Rotation for throwing animation
    this.rotationX = 0;
    this.rotationSpeed = 0.15;
    
    // If no throwing parameters were provided, place immediately
    if (!speed) {
      this.grounded = true;
      this.updateHeight(); // Initialize height for stationary turret
    }
  }
  
  takeDamage(amount) {
    if (this.isDestroyed) return;
    
    this.health -= amount;
    
    // Check if turret is destroyed
    if (this.health <= 0) {
      this.health = 0;
      this.isDestroyed = true;
      this.createDestructionEffect();
    }
  }
  
  createDestructionEffect() {
    // Only create the effect if we have the waves array available
    if (this.gameState.waves) {
      try {
        // Create an explosion wave effect
        const explosionWave = new Wave(
          this.x,
          this.y,
          this.z,
          60, // Initial radius
          [255, 100, 50, 200] // Orange-red for explosion
        );
        explosionWave.growthRate = 8;
        explosionWave.maxRadius = 150;
        this.gameState.waves.push(explosionWave);
        
        // Add some explosion particles
        for (let i = 0; i < 12; i++) {
          const particleAngle = random(TWO_PI);
          const particleRadius = random(30, 80);
          const particleX = this.x + cos(particleAngle) * particleRadius;
          const particleZ = this.z + sin(particleAngle) * particleRadius;
          
          const particleWave = new Wave(
            particleX,
            this.y,
            particleZ,
            random(15, 30), // Small radius
            [255, random(50, 150), 0, random(150, 200)]
          );
          particleWave.growthRate = random(3, 6);
          particleWave.maxRadius = random(40, 70);
          particleWave.lifespan = random(20, 40);
          this.gameState.waves.push(particleWave);
        }
        
        // Play explosion sound if available
        if (this.gameState.soundManager) {
          this.gameState.soundManager.play('explosion', {
            priority: this.gameState.soundManager.PRIORITY.HIGH,
            sourceType: 'skill',
            sourceId: 'turret-destroyed'
          });
        }
      } catch (error) {
        console.error("Error creating destruction effect:", error);
      }
    }
  }

  findNearestEnemies(count = 1) {
    return findNearestEnemies(this, count, this.gameState);
  }

  showAimLine(target, gunZ) {
    return showAimLine(this, target, gunZ, [255, 0, 0]);
  }

  autoShoot(targetCount = CONFIG.TURRET.MAX_TARGETS) {
    // Only shoot if grounded
    if (this.grounded) {
      autoShoot(this, targetCount, CONFIG.TURRET.FIRE_RATE, this.gameState);
    }
  }

  update() {
    this.lifespan--;
    
    // If turret is destroyed, don't process any further
    if (this.isDestroyed) {
      return;
    }
    
    // If not grounded yet, handle throwing physics
    if (!this.grounded) {
      // Update position based on direction and speed
      this.x += cos(this.direction) * this.speed;
      this.z += sin(this.direction) * this.speed;
      
      // Apply gravity and update vertical position
      this.velocityY += this.gravity;
      this.y += this.velocityY;
      
      // Rotate while in air
      this.rotationX += this.rotationSpeed;
      
      // Track distance traveled
      this.distanceTraveled += this.speed;
      
      // Check if turret has hit the ground
      if (this.y >= this.groundLevel) {
        this.y = this.groundLevel; // Set to ground level
        this.grounded = true;
        
        // Create landing effect if not already created
        if (!this.landingEffectCreated) {
          this.createLandingEffectNow();
          this.landingEffectCreated = true;
        }
      }
      
      // Check if turret has traveled its maximum distance
      if (this.distanceTraveled >= this.distance) {
        this.grounded = true;
        
        // Create landing effect if not already created
        if (!this.landingEffectCreated) {
          this.createLandingEffectNow();
          this.landingEffectCreated = true;
        }
      }
    } else {
      // Normal turret behavior when grounded
      this.updateHeight();
      this.autoShoot();
    }
    
    // Check if lifespan has expired
    if (this.lifespan <= 0) {
      this.isDestroyed = true;
    }
  }

  updateHeight() {
    if (this.grounded) {
      // When thrown on the ground, we want to keep it at ground level
      // rather than adjusting based on tower height
      if (this.speed > 0) {
        // For thrown turrets, keep at ground level
        this.y = this.groundLevel;
      } else {
        // For turrets placed directly on the tower, use the standard height calculation
        updateHeight(this, this.gameState);
      }
    }
  }
  
  createLandingEffectNow() {
    // Only create the effect if we have the waves array available
    if (this.gameState.waves) {
      try {
        // Create a landing wave effect using the imported Wave class
        const landingWave = new Wave(
          this.x,
          this.y,
          this.z,
          50, // Initial radius
          [100, 100, 255, 180] // Blue for turret
        );
        landingWave.growthRate = 5;
        landingWave.maxRadius = 100;
        this.gameState.waves.push(landingWave);
        
        // Add some smaller particles around the landing spot
        for (let i = 0; i < 8; i++) {
          const particleAngle = random(TWO_PI);
          const particleRadius = random(20, 60);
          const particleX = this.x + cos(particleAngle) * particleRadius;
          const particleZ = this.z + sin(particleAngle) * particleRadius;
          
          const particleWave = new Wave(
            particleX,
            this.y,
            particleZ,
            random(10, 20), // Small radius
            [120, 120, 255, random(150, 200)]
          );
          particleWave.growthRate = random(2, 4);
          particleWave.maxRadius = random(30, 50);
          particleWave.lifespan = random(15, 30);
          this.gameState.waves.push(particleWave);
        }
        
        // Play landing sound if available
        if (this.gameState.soundManager) {
          this.gameState.soundManager.play('impact', {
            priority: this.gameState.soundManager.PRIORITY.MEDIUM,
            sourceType: 'skill',
            sourceId: 'turret-land'
          });
        }
      } catch (error) {
        console.error("Error creating landing effect:", error);
        // Fallback to a simpler effect if there's an error
        if (this.gameState.soundManager) {
          this.gameState.soundManager.play('impact', {
            priority: this.gameState.soundManager.PRIORITY.MEDIUM,
            sourceType: 'skill',
            sourceId: 'turret-land'
          });
        }
      }
    }
  }

  show() {
    // If destroyed, don't render anything
    if (this.isDestroyed) {
      return;
    }
    
    push();
    translate(this.x, this.y, this.z);
    
    // Apply different rotations based on whether the turret is in the air or grounded
    if (!this.grounded) {
      // When in the air, rotate based on throw direction and add tumbling
      rotateY(this.direction);
      rotateX(this.rotationX);
      
      // Draw the turret body without legs when in the air - brighter color for visibility
      stroke(0);
      strokeWeight(2);
      fill(120, 120, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
      box(this.width, this.height / 2, this.depth);
      
      // Upper part (gun mount)
      push();
      translate(0, -this.height / 3, 0);
      fill(80);
      box(this.width / 1.5, this.height / 3, this.depth / 1.5);
      pop();
      
      // Double gun barrels
      push();
      translate(this.width / 2, -this.height / 3, 0);
      fill(40);
      rotateZ(HALF_PI);
      
      // Top barrel
      push();
      translate(0, 0, 3);
      cylinder(2, 20);
      pop();
      
      // Bottom barrel
      push();
      translate(0, 0, -3);
      cylinder(2, 20);
      pop();
      
      pop();
    } else {
      // When grounded, use the original display logic
      rotateY(this.rotation);
      
      // Draw legs
      push();
      fill(80);
      strokeWeight(2);
      stroke(60);
      
      // Front legs
      push();
      translate(this.width / 3, 0, this.depth / 3);
      box(3, this.legLength, 3);
      pop();
      
      push();
      translate(-this.width / 3, 0, this.depth / 3);
      box(3, this.legLength, 3);
      pop();
      
      // Back legs
      push();
      translate(this.width / 3, 0, -this.depth / 3);
      box(3, this.legLength, 3);
      pop();
      
      push();
      translate(-this.width / 3, 0, -this.depth / 3);
      box(3, this.legLength, 3);
      pop();
      pop();
      
      // Base - slightly above ground due to legs
      translate(0, -this.legLength / 2, 0);
      fill(120, 120, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
      box(this.width, this.height / 2, this.depth);
      
      // Upper part (gun mount)
      push();
      translate(0, -this.height / 3, 0);
      fill(80);
      box(this.width / 1.5, this.height / 3, this.depth / 1.5);
      pop();
      
      // Double gun barrels
      push();
      translate(this.width / 2, -this.height / 3, 0);
      fill(40);
      rotateZ(HALF_PI);
      
      // Top barrel
      push();
      translate(0, 0, 3);
      cylinder(2, 20);
      pop();
      
      // Bottom barrel
      push();
      translate(0, 0, -3);
      cylinder(2, 20);
      pop();
      
      pop();
      
      // Draw health bar if grounded and health is less than max
      if (this.health < this.maxHealth) {
        push();
        // Position the health bar above the turret
        translate(0, -this.height - 10, 0);
        // Make the health bar face the camera
        rotateY(-this.gameState.cameraRotationY);
        
        // Health bar background
        noStroke();
        fill(50, 50, 50, 180);
        rect(-15, -2, 30, 4);
        
        // Health bar fill
        const healthPercentage = this.health / this.maxHealth;
        const healthBarWidth = 30 * healthPercentage;
        
        // Choose color based on health percentage
        if (healthPercentage > 0.6) {
          fill(0, 255, 0, 200); // Green for high health
        } else if (healthPercentage > 0.3) {
          fill(255, 255, 0, 200); // Yellow for medium health
        } else {
          fill(255, 0, 0, 200); // Red for low health
        }
        
        rect(-15, -2, healthBarWidth, 4);
        pop();
      }
    }
    
    pop();
  }
}