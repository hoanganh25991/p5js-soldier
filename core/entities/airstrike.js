// Airstrike Module

import CONFIG from '../../config.js';
import { Bomb } from './bomb.js';
import particleManager from '../managers/particleManager.js';

export class Airstrike {
  constructor(gameState) {
    this.gameState = gameState;
    this.x = -CONFIG.ENEMY_RADIUS;
    this.y = -700; // Even higher above towers
    this.z = 0;
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
    this.x += this.speed;
    
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
      
      // Left engine exhaust
      particleManager.createParticle(
        this.x - 5, 
        this.y + 5, 
        this.z - 40,
        'SMOKE',
        {
          vx: -this.speed * 0.5 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.2,
          vz: (Math.random() - 0.5) * 0.2,
          size: 8 + Math.random() * 4,
          color: [200, 200, 200],
          alpha: 150,
          lifespan: 20 + Math.floor(Math.random() * 10)
        }
      );
      
      // Right engine exhaust
      particleManager.createParticle(
        this.x - 5, 
        this.y + 5, 
        this.z + 40,
        'SMOKE',
        {
          vx: -this.speed * 0.5 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.2,
          vz: (Math.random() - 0.5) * 0.2,
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
      const bomb = new Bomb(this.x, this.y + 10, this.z, this, this.gameState);
      
      // Add to gameState bombs array (create if it doesn't exist)
      if (!this.gameState.bombs) {
        this.gameState.bombs = [];
      }
      this.gameState.bombs.push(bomb);
      
      // Play drop sound if available
      if (this.gameState.bombDropSound) {
        this.gameState.bombDropSound.play();
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
    rotateZ(this.wingTilt); // Apply subtle banking effect
    
    // Main body - fuselage
    fill(150, 150, 180);
    stroke(100);
    strokeWeight(0.5);
    push();
    box(100, 15, 20);
    pop();
    
    // Bomb bay doors
    if (this.bombBayOpenAmount > 0) {
      push();
      translate(0, 7, 0);
      
      // Left door
      push();
      translate(0, 0, -10);
      rotateZ(this.bombBayOpenAmount * PI/3); // Wider opening angle
      fill(120, 120, 150);
      box(60, 1, 20); // Larger doors for bigger bombs
      pop();
      
      // Right door
      push();
      translate(0, 0, 10);
      rotateZ(-this.bombBayOpenAmount * PI/3); // Wider opening angle
      fill(120, 120, 150);
      box(60, 1, 20); // Larger doors for bigger bombs
      pop();
      
      // Door details - hinges
      push();
      translate(0, 0, -20);
      fill(80, 80, 80);
      cylinder(2, 22);
      pop();
      
      push();
      translate(0, 0, 20);
      fill(80, 80, 80);
      cylinder(2, 22);
      pop();
      
      // Interior bomb bay - visible when doors are open
      if (this.bombBayOpenAmount > 0.5) {
        push();
        translate(0, -5, 0);
        fill(60, 60, 60);
        box(55, 10, 35);
        
        // Bomb rack details
        fill(40, 40, 40);
        push();
        translate(-20, 0, 0);
        box(2, 8, 30);
        pop();
        
        push();
        translate(0, 0, 0);
        box(2, 8, 30);
        pop();
        
        push();
        translate(20, 0, 0);
        box(2, 8, 30);
        pop();
        pop();
      }
      
      pop();
    }
    
    // Wings
    fill(120, 120, 150);
    push();
    rotateY(PI/2);
    
    // Main wings
    push();
    translate(0, 5, 0);
    // Add subtle wing flex
    rotateX(sin(this.gameState.frameCount * 0.02) * 0.03);
    box(80, 5, 30);
    
    // Wing details - flaps
    push();
    translate(-25, 0, 0);
    fill(100, 100, 130);
    box(20, 3, 28);
    pop();
    
    // Wing lights
    push();
    translate(-35, -2, 35);
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
    translate(-35, 0, 0);
    box(20, 5, 15);
    pop();
    
    // Vertical stabilizer
    push();
    translate(-40, -10, 0);
    box(15, 20, 3);
    pop();
    pop();
    
    // Cockpit
    fill(200, 200, 255, 150);
    push();
    translate(30, -5, 0);
    scale(1, 0.7, 1);
    sphere(10);
    
    // Cockpit details
    push();
    translate(0, 0, 0);
    fill(50, 50, 80);
    rotateX(PI/2);
    cylinder(8, 2);
    pop();
    pop();
    
    // Engines
    fill(80);
    push();
    translate(0, 5, -30);
    rotateX(PI/2);
    cylinder(5, 20);
    
    // Rotating propellers
    push();
    translate(0, -15, 0);
    rotateY(this.propellerRotation);
    fill(50);
    
    // Propeller blades
    for (let i = 0; i < 4; i++) {
      push();
      rotateY(i * PI/2);
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
    translate(0, 5, 30);
    rotateX(PI/2);
    cylinder(5, 20);
    
    // Rotating propellers
    push();
    translate(0, -15, 0);
    rotateY(-this.propellerRotation); // Rotate opposite direction
    fill(50);
    
    // Propeller blades
    for (let i = 0; i < 4; i++) {
      push();
      rotateY(i * PI/2);
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
    translate(50, 0, 0);
    rotateZ(PI/2);
    cone(10, 20);
    pop();
    
    // Tail cone
    fill(100, 100, 130);
    push();
    translate(-50, 0, 0);
    rotateZ(-PI/2);
    cone(10, 15);
    pop();

    pop();
  }
}