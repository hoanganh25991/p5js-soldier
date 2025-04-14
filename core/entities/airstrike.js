// Airstrike Module

import CONFIG from '../../config.js';
import { Bomb } from './bomb.js';
import particleManager from '../managers/particleManager.js';

export class Airstrike {
  constructor(gameState, startX, startZ, dirX, dirZ) {
    this.gameState = gameState;
    
    // Position - use provided start position or default if not provided
    this.x = startX !== undefined ? startX : -CONFIG.ENEMY_RADIUS;
    this.y = -700; // Always high above the ground
    this.z = startZ !== undefined ? startZ : 0;
    
    // Direction - use provided direction or default to moving right
    this.directionX = dirX !== undefined ? dirX : 1;
    this.directionZ = dirZ !== undefined ? dirZ : 0;
    
    // Calculate rotation based on direction
    this.rotation = atan2(this.directionZ, this.directionX);
    
    this.speed = CONFIG.AIRSTRIKE.SPEED;
    this.damage = CONFIG.AIRSTRIKE.DAMAGE;
    
    // Animation properties
    this.propellerRotation = 0;
    this.propellerSpeed = 0.5;
    this.engineThrust = 0;
    this.wingTilt = 0;
    this.tiltDirection = 1;
    this.tiltSpeed = 0.005;
    this.tiltMax = 0.05;
    
    // Trail effects
    this.trailTimer = 0;
    this.trailInterval = 5;
    
    // Bomb bay properties
    this.bombBayOpen = false;
    this.bombBayOpenAmount = 0;
    this.bombDropSound = null;
  }

  update() {
    // Move in the direction vector
    this.x += this.directionX * this.speed;
    this.z += this.directionZ * this.speed;
    
    // Update animation properties
    this.propellerRotation += this.propellerSpeed;
    this.engineThrust = 0.5 + Math.sin(this.gameState.frameCount * 0.1) * 0.2;
    
    // Update wing tilt for subtle banking effect
    this.wingTilt += this.tiltSpeed * this.tiltDirection;
    if (Math.abs(this.wingTilt) > this.tiltMax) {
      this.tiltDirection *= -1;
    }
    
    // Add engine exhaust particles
    this.trailTimer++;
    if (this.trailTimer >= this.trailInterval) {
      this.trailTimer = 0;
      
      // Calculate direction vector for exhaust (opposite to movement direction)
      const exhaustDirX = -this.directionX;
      const exhaustDirZ = -this.directionZ;
      
      // Calculate perpendicular vector for engine positions
      // This creates a vector perpendicular to the direction of travel
      const perpX = -this.directionZ; // Perpendicular to direction
      const perpZ = this.directionX;  // Perpendicular to direction
      
      // Left engine exhaust - positioned to the left of the aircraft
      particleManager.createParticle(
        this.x + perpX * 30, 
        this.y + 5, 
        this.z + perpZ * 30,
        'SMOKE',
        {
          vx: exhaustDirX * this.speed * 0.5 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.2,
          vz: exhaustDirZ * this.speed * 0.5 + (Math.random() - 0.5) * 0.2,
          size: 8 + Math.random() * 4,
          color: [200, 200, 200],
          alpha: 150,
          lifespan: 20 + Math.floor(Math.random() * 10)
        }
      );
      
      // Right engine exhaust - positioned to the right of the aircraft
      particleManager.createParticle(
        this.x - perpX * 30, 
        this.y + 5, 
        this.z - perpZ * 30,
        'SMOKE',
        {
          vx: exhaustDirX * this.speed * 0.5 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.2,
          vz: exhaustDirZ * this.speed * 0.5 + (Math.random() - 0.5) * 0.2,
          size: 8 + Math.random() * 4,
          color: [200, 200, 200],
          alpha: 150,
          lifespan: 20 + Math.floor(Math.random() * 10)
        }
      );
    }

    // Drop bombs periodically
    if (this.gameState.frameCount % CONFIG.AIRSTRIKE.BOMB_RATE === 0) {
      // Open bomb bay doors
      this.bombBayOpen = true;
      
      // Create a specialized bomb entity
      // Pass the direction to the bomb so it knows which way to fall
      const bomb = new Bomb(
        this.x, 
        this.y + 10, 
        this.z, 
        this, 
        this.gameState, 
        this.directionX, 
        this.directionZ
      );
      
      // Add to gameState bombs array (create if it doesn't exist)
      if (!this.gameState.bombs) {
        this.gameState.bombs = [];
      }
      this.gameState.bombs.push(bomb);
      
      // Play drop sound if available
      if (this.gameState.bombDropSound) {
        this.gameState.bombDropSound.play();
      } else if (this.gameState.soundManager) {
        // Try using the sound manager if available
        this.gameState.soundManager.play('explosion', {
          priority: this.gameState.soundManager.PRIORITY.HIGH,
          sourceType: 'skill',
          sourceId: 'airstrike'
        });
      }
    }
    
    // Update bomb bay doors
    if (this.bombBayOpen) {
      this.bombBayOpenAmount = Math.min(1, this.bombBayOpenAmount + 0.1);
      if (this.bombBayOpenAmount >= 1 && this.gameState.frameCount % CONFIG.AIRSTRIKE.BOMB_RATE > 10) {
        this.bombBayOpen = false;
      }
    } else {
      this.bombBayOpenAmount = Math.max(0, this.bombBayOpenAmount - 0.05);
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    
    // First rotate to align with direction of travel
    rotateY(this.rotation);
    
    // Then apply banking effect
    rotateZ(this.wingTilt);
    
    // Apply a 90-degree rotation to fix the orientation
    // This makes the aircraft fly with its nose pointing in the direction of travel
    rotateY(PI/2);
    
    // Main body - fuselage
    fill(150, 150, 180);
    stroke(100);
    strokeWeight(0.5);
    push();
    box(20, 15, 100); // Swapped width and depth to align with direction
    pop();
    
    // Bomb bay doors
    if (this.bombBayOpenAmount > 0) {
      push();
      translate(0, 7, 0);
      
      // Left door
      push();
      translate(-10, 0, 0);
      rotateZ(this.bombBayOpenAmount * PI/3); // Wider opening angle
      fill(120, 120, 150);
      box(20, 1, 60); // Adjusted for new orientation
      pop();
      
      // Right door
      push();
      translate(10, 0, 0);
      rotateZ(-this.bombBayOpenAmount * PI/3); // Wider opening angle
      fill(120, 120, 150);
      box(20, 1, 60); // Adjusted for new orientation
      pop();
      
      // Door details - hinges
      push();
      translate(-20, 0, 0);
      fill(80, 80, 80);
      rotateZ(PI/2);
      cylinder(2, 22);
      pop();
      
      push();
      translate(20, 0, 0);
      fill(80, 80, 80);
      rotateZ(PI/2);
      cylinder(2, 22);
      pop();
      
      // Interior bomb bay - visible when doors are open
      if (this.bombBayOpenAmount > 0.5) {
        push();
        translate(0, -5, 0);
        fill(60, 60, 60);
        box(35, 10, 55);
        
        // Bomb rack details
        fill(40, 40, 40);
        push();
        translate(0, 0, -20);
        box(30, 8, 2);
        pop();
        
        push();
        translate(0, 0, 0);
        box(30, 8, 2);
        pop();
        
        push();
        translate(0, 0, 20);
        box(30, 8, 2);
        pop();
        pop();
      }
      
      pop();
    }
    
    // Wings
    fill(120, 120, 150);
    push();
    
    // Main wings
    push();
    translate(0, 5, 0);
    // Add subtle wing flex
    rotateZ(sin(this.gameState.frameCount * 0.02) * 0.03);
    box(80, 5, 30);
    
    // Wing details - flaps
    push();
    translate(0, 0, -25);
    fill(100, 100, 130);
    box(28, 3, 20);
    pop();
    
    // Wing lights
    push();
    translate(35, -2, -35);
    fill(255, 0, 0);
    sphere(2);
    pop();
    
    push();
    translate(-35, -2, -35);
    fill(0, 255, 0);
    sphere(2);
    pop();
    
    pop();
    
    // Tail wings
    push();
    translate(0, 0, -35);
    box(15, 5, 20);
    pop();
    
    // Vertical stabilizer
    push();
    translate(0, -10, -40);
    box(3, 20, 15);
    pop();
    pop();
    
    // Cockpit
    fill(200, 200, 255, 150);
    push();
    translate(0, -5, 30);
    scale(1, 0.7, 1);
    sphere(10);
    
    // Cockpit details
    push();
    translate(0, 0, 0);
    fill(50, 50, 80);
    rotateZ(PI/2);
    cylinder(8, 2);
    pop();
    pop();
    
    // Engines
    fill(80);
    push();
    translate(-30, 5, 0);
    rotateZ(PI/2);
    cylinder(5, 20);
    
    // Rotating propellers
    push();
    translate(0, -15, 0);
    rotateX(this.propellerRotation);
    fill(50);
    
    // Propeller blades
    for (let i = 0; i < 4; i++) {
      push();
      rotateX(i * PI/2);
      translate(0, 0, 10);
      box(1, 2, 20);
      pop();
    }
    
    // Propeller hub
    fill(30);
    sphere(3);
    pop();
    
    // Engine exhaust
    push();
    translate(0, 15, 0);
    fill(200 + sin(this.gameState.frameCount * 0.2) * 55, 
         100 + sin(this.gameState.frameCount * 0.2) * 50, 
         50);
    sphere(3 * this.engineThrust);
    pop();
    pop();
    
    // Second engine
    push();
    translate(30, 5, 0);
    rotateZ(PI/2);
    cylinder(5, 20);
    
    // Rotating propellers
    push();
    translate(0, -15, 0);
    rotateX(-this.propellerRotation); // Rotate opposite direction
    fill(50);
    
    // Propeller blades
    for (let i = 0; i < 4; i++) {
      push();
      rotateX(i * PI/2);
      translate(0, 0, 10);
      box(1, 2, 20);
      pop();
    }
    
    // Propeller hub
    fill(30);
    sphere(3);
    pop();
    
    // Engine exhaust
    push();
    translate(0, 15, 0);
    fill(200 + sin(this.gameState.frameCount * 0.2 + 1) * 55, 
         100 + sin(this.gameState.frameCount * 0.2 + 1) * 50, 
         50);
    sphere(3 * this.engineThrust);
    pop();
    pop();
    
    // Nose cone
    fill(100, 100, 130);
    push();
    translate(0, 0, 50);
    rotateX(PI/2);
    cone(10, 20);
    pop();
    
    // Tail cone
    fill(100, 100, 130);
    push();
    translate(0, 0, -50);
    rotateX(-PI/2);
    cone(10, 15);
    pop();

    pop();
  }
}