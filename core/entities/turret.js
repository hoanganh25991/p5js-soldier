// Turret Module

import CONFIG from '../../config.js';
import { findNearestEnemies, showAimLine, autoShoot, updateHeight } from '../utils.js';

export class Turret {
  constructor(x, y, z, direction, speed, distance, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = 25;
    this.height = 35;
    this.depth = 25;
    this.lifespan = CONFIG.TURRET.DURATION;
    this.rotation = 0;
    this.damage = CONFIG.TURRET.DAMAGE;
    this.legLength = 20;
    
    // Throwing properties
    this.direction = direction || 0;
    this.speed = speed || 0;
    this.distance = distance || 0;
    this.distanceTraveled = 0;
    
    // Physics for throwing
    this.velocityY = -10; // Initial upward velocity
    this.gravity = 0.4;   // Gravity for falling
    this.grounded = false;
    this.groundLevel = -50; // Fixed ground level
    
    // Rotation for throwing animation
    this.rotationX = 0;
    this.rotationSpeed = 0.15;
    
    // If no throwing parameters were provided, place immediately
    if (!speed) {
      this.grounded = true;
      this.updateHeight(); // Initialize height for stationary turret
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
      }
      
      // Check if turret has traveled its maximum distance
      if (this.distanceTraveled >= this.distance) {
        this.grounded = true;
      }
    } else {
      // Normal turret behavior when grounded
      this.updateHeight();
      this.autoShoot();
    }
  }

  updateHeight() {
    if (this.grounded) {
      updateHeight(this, this.gameState);
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    
    // Apply different rotations based on whether the turret is in the air or grounded
    if (!this.grounded) {
      // When in the air, rotate based on throw direction and add tumbling
      rotateY(this.direction);
      rotateX(this.rotationX);
      
      // Draw the turret body without legs when in the air
      fill(100, 100, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
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
      fill(100, 100, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
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
    }
    
    pop();
  }
}