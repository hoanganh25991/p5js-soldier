// Game Character Module
// Implements different game characters spawned by the GBA

import CONFIG from '../config.js';
import { findNearestEnemies, updateHeight } from '../utils.js';
import { Bullet } from './bullet.js';
import { Wave } from './wave.js';

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
    
    // Dimensions based on size (make them EXTREMELY large for better visibility)
    this.width = 150 * this.size;
    this.height = 200 * this.size;
    this.depth = 150 * this.size;
    
    // Combat
    this.attackRange = 500; // Much larger attack range to match increased size
    this.attackCooldown = 0;
    this.attackRate = 60; // Frames between attacks
    
    // Animation
    this.rotation = 0;
    this.animationFrame = 0;
    this.animationSpeed = 0.1;
    
    // Visual effects
    this.damageIndicators = []; // Array to store floating damage numbers
    
    // Lifespan
    this.lifespan = CONFIG.GBA.CHARACTER_DURATION;
    
    // Special abilities cooldown
    this.specialCooldown = 0;
    this.specialRate = 180; // 3 seconds between special abilities
    
    // Set a fixed height for the character (much higher than the calculated ground level)
    // This ensures the character is visible on the screen
    this.y = -50;
  }
  
  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Keep the character at a fixed height
    // This ensures the character is visible on the screen
    this.y = -50;
    
    // Find nearest enemy
    const target = this.findNearestEnemy();
    
    if (target) {
      // Calculate angle to target
      const angleToTarget = atan2(target.z - this.z, target.x - this.x);
      this.rotation = angleToTarget + HALF_PI;
      
      // Calculate distance to target
      const distToTarget = dist(this.x, this.z, target.x, target.z);
      
      if (distToTarget > this.attackRange) {
        // Move towards target if not in attack range
        this.x += cos(angleToTarget) * this.speed;
        this.z += sin(angleToTarget) * this.speed;
      } else {
        // Attack if in range and cooldown is ready
        if (this.attackCooldown <= 0) {
          this.attack(target);
          this.attackCooldown = this.attackRate;
        }
      }
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // Use special ability if cooldown is ready
    if (this.specialCooldown <= 0) {
      this.useSpecialAbility();
      this.specialCooldown = this.specialRate;
    }
    
    // Update animation
    this.animationFrame += this.animationSpeed;
  }
  
  show() {
    console.log(`Showing ${this.type} character at position: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
    
    push();
    // Position the character on the ground with feet at ground level
    translate(this.x, this.y, this.z);
    
    // Always face the camera instead of using rotation
    // This ensures the character is visible from any angle
    rotateY(frameCount * 0.02); // Slowly rotate to be visible from all angles
    
    // Base character body
    this.drawCharacter();
    
    // Health bar above character
    this.drawHealthBar();
    
    // Add a visual indicator above the character
    this.drawIndicator();
    
    pop();
  }
  
  // Draw a visual indicator above the character to make it more noticeable
  drawIndicator() {
    push();
    // Position above the character
    translate(0, -this.height * 1.2, 0);
    
    // Make the indicator always face the camera
    rotateY(-this.rotation);
    
    // Pulsing effect - MUCH larger
    const pulseSize = 50 + sin(frameCount * 0.1) * 20;
    
    // Draw the indicator
    noStroke();
    fill(255, 0, 0, 200); // Bright red, more opaque
    sphere(pulseSize);
    
    // Add a second indicator with different color and timing
    const pulseSize2 = 30 + cos(frameCount * 0.15) * 15;
    fill(255, 255, 0, 200); // Yellow, more opaque
    sphere(pulseSize2);
    
    pop();
  }
  
  drawCharacter() {
    // Set stroke for all characters to make them MUCH more visible
    stroke(0);
    strokeWeight(5); // Slightly thinner outline for more detail
    
    // Animation variables
    const breathingEffect = sin(frameCount * 0.05) * 0.05; // Subtle breathing
    const walkingEffect = sin(this.animationFrame * 2) * 0.2; // Walking animation
    const attackingEffect = this.attackCooldown < 10 ? sin(frameCount * 0.5) * 0.3 : 0; // Attack animation
    
    // Different appearance based on character type
    switch (this.type) {
      case 'TANK':
        // Tank - heavy, armored character with realistic tank features
        // Main body with treads
        push();
        // Tank body
        fill(100, 100, 100); // Darker gray for tank body
        box(this.width * 1.2, this.height * 0.5, this.depth * 1.2);
        
        // Tank treads (left)
        push();
        translate(-this.width * 0.6, this.height * 0.1, 0);
        fill(50, 50, 50);
        box(this.width * 0.1, this.height * 0.3, this.depth * 1.3);
        // Tread details
        for (let i = -5; i <= 5; i++) {
          push();
          translate(0, 0, i * this.depth * 0.1);
          rotateX(HALF_PI);
          fill(30, 30, 30);
          cylinder(this.width * 0.05, this.width * 0.1);
          pop();
        }
        pop();
        
        // Tank treads (right)
        push();
        translate(this.width * 0.6, this.height * 0.1, 0);
        fill(50, 50, 50);
        box(this.width * 0.1, this.height * 0.3, this.depth * 1.3);
        // Tread details
        for (let i = -5; i <= 5; i++) {
          push();
          translate(0, 0, i * this.depth * 0.1);
          rotateX(HALF_PI);
          fill(30, 30, 30);
          cylinder(this.width * 0.05, this.width * 0.1);
          pop();
        }
        pop();
        
        // Tank turret with rotation based on target direction
        push();
        translate(0, -this.height * 0.3, 0);
        rotateY(this.rotation);
        
        // Turret base
        fill(70, 70, 70);
        sphere(this.width * 0.4);
        
        // Turret body
        push();
        translate(0, -this.height * 0.1, 0);
        fill(60, 60, 60);
        box(this.width * 0.7, this.height * 0.2, this.depth * 0.7);
        pop();
        
        // Tank gun with recoil animation
        push();
        translate(this.width * 0.5 - attackingEffect * this.width, 0, 0);
        fill(50, 50, 50);
        rotateZ(HALF_PI);
        cylinder(this.width * 0.1, this.depth * 1.2);
        
        // Gun muzzle
        translate(0, 0, this.depth * 0.7);
        fill(40, 40, 40);
        cylinder(this.width * 0.12, this.width * 0.1);
        
        // Muzzle flash when firing
        if (this.attackCooldown < 5) {
          translate(0, 0, this.width * 0.1);
          fill(255, 200, 50, 200 - this.attackCooldown * 40);
          sphere(this.width * 0.2 * (5 - this.attackCooldown) / 5);
        }
        pop();
        pop();
        pop();
        break;
        
      case 'HERO':
        // Hero with realistic humanoid features and animated sword
        // Body
        push();
        // Legs with walking animation
        push();
        translate(0, this.height * 0.3, 0);
        // Left leg
        push();
        translate(-this.width * 0.2, 0, 0);
        rotateX(walkingEffect);
        fill(50, 50, 150); // Dark blue pants
        box(this.width * 0.25, this.height * 0.5, this.depth * 0.25);
        // Boot
        translate(0, this.height * 0.3, 0);
        fill(70, 40, 0); // Brown boots
        box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
        pop();
        
        // Right leg
        push();
        translate(this.width * 0.2, 0, 0);
        rotateX(-walkingEffect);
        fill(50, 50, 150); // Dark blue pants
        box(this.width * 0.25, this.height * 0.5, this.depth * 0.25);
        // Boot
        translate(0, this.height * 0.3, 0);
        fill(70, 40, 0); // Brown boots
        box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
        pop();
        pop();
        
        // Torso
        push();
        translate(0, 0, 0);
        fill(180, 180, 255); // Brighter blue for armor
        box(this.width * 0.8, this.height * 0.4, this.depth * 0.5);
        
        // Armor details
        push();
        translate(0, -this.height * 0.05, -this.depth * 0.2);
        fill(220, 220, 255); // Lighter blue for chest plate
        box(this.width * 0.6, this.height * 0.3, this.depth * 0.1);
        pop();
        
        // Shoulder pads
        push();
        translate(-this.width * 0.5, -this.height * 0.1, 0);
        fill(200, 200, 255);
        sphere(this.width * 0.2);
        pop();
        
        push();
        translate(this.width * 0.5, -this.height * 0.1, 0);
        fill(200, 200, 255);
        sphere(this.width * 0.2);
        pop();
        pop();
        
        // Head
        push();
        translate(0, -this.height * 0.4, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.25);
        
        // Helmet
        push();
        translate(0, -this.width * 0.1, 0);
        fill(220, 220, 255);
        box(this.width * 0.3, this.height * 0.2, this.depth * 0.3);
        pop();
        pop();
        
        // Arms
        // Left arm (shield arm)
        push();
        translate(-this.width * 0.5, -this.height * 0.1, 0);
        rotateX(walkingEffect * 0.5);
        fill(180, 180, 255);
        box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
        
        // Shield
        translate(-this.width * 0.2, this.height * 0.1, 0);
        fill(150, 150, 200);
        box(this.width * 0.1, this.height * 0.5, this.depth * 0.5);
        pop();
        
        // Right arm (sword arm) with attack animation
        push();
        translate(this.width * 0.5, -this.height * 0.1, 0);
        
        // Arm animation based on attack state
        if (this.attackCooldown < 15) {
          // Attack swing animation
          rotateZ(-PI / 4 - sin(frameCount * 0.5) * 1.5);
          rotateX(sin(frameCount * 0.5) * 0.5);
        } else {
          // Normal position
          rotateZ(-PI / 8 + sin(this.animationFrame) * 0.1);
        }
        
        fill(180, 180, 255);
        box(this.width * 0.2, this.height * 0.4, this.depth * 0.2);
        
        // Sword with glowing effect during attack
        translate(this.width * 0.1, -this.height * 0.3, 0);
        
        // Sword handle
        push();
        fill(70, 40, 0); // Brown handle
        box(this.width * 0.08, this.height * 0.2, this.width * 0.08);
        
        // Sword guard
        translate(0, -this.height * 0.12, 0);
        fill(200, 170, 0); // Gold guard
        box(this.width * 0.3, this.height * 0.05, this.width * 0.1);
        pop();
        
        // Sword blade with glow effect during attack
        push();
        translate(0, -this.height * 0.5, 0);
        
        // Glowing effect during attack
        if (this.attackCooldown < 15) {
          // Outer glow
          push();
          noStroke();
          fill(200, 200, 255, 100);
          box(this.width * 0.15, this.height * 0.8, this.width * 0.1);
          pop();
        }
        
        // Actual blade
        fill(220, 220, 220); // Silver
        box(this.width * 0.1, this.height * 0.8, this.width * 0.05);
        
        // Blade tip
        translate(0, -this.height * 0.4, 0);
        beginShape();
        vertex(-this.width * 0.05, 0, -this.width * 0.025);
        vertex(this.width * 0.05, 0, -this.width * 0.025);
        vertex(0, -this.height * 0.1, 0);
        vertex(-this.width * 0.05, 0, this.width * 0.025);
        vertex(this.width * 0.05, 0, this.width * 0.025);
        endShape(CLOSE);
        pop();
        
        pop();
        pop();
        break;
        
      case 'MARIO':
        // Mario - more detailed with animated features
        push();
        // Legs with jumping animation
        push();
        translate(0, this.height * 0.3, 0);
        
        // Left leg
        push();
        translate(-this.width * 0.15, 0, 0);
        if (this.attackCooldown < 20) {
          // Jumping animation
          rotateX(-PI/4);
        } else {
          rotateX(walkingEffect);
        }
        fill(0, 0, 200); // Blue overalls
        box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
        
        // Shoe
        translate(0, this.height * 0.2, 0);
        fill(100, 50, 0); // Brown shoes
        box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
        pop();
        
        // Right leg
        push();
        translate(this.width * 0.15, 0, 0);
        if (this.attackCooldown < 20) {
          // Jumping animation
          rotateX(-PI/4);
        } else {
          rotateX(-walkingEffect);
        }
        fill(0, 0, 200); // Blue overalls
        box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
        
        // Shoe
        translate(0, this.height * 0.2, 0);
        fill(100, 50, 0); // Brown shoes
        box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
        pop();
        pop();
        
        // Torso
        push();
        translate(0, 0, 0);
        fill(255, 50, 50); // Red shirt
        box(this.width * 0.6, this.height * 0.3, this.depth * 0.4);
        
        // Overalls front
        push();
        translate(0, 0, -this.depth * 0.15);
        fill(0, 0, 200); // Blue overalls
        box(this.width * 0.4, this.height * 0.3, this.depth * 0.1);
        pop();
        
        // Buttons
        push();
        translate(-this.width * 0.1, 0, -this.depth * 0.25);
        fill(255, 255, 0); // Yellow buttons
        sphere(this.width * 0.05);
        pop();
        
        push();
        translate(this.width * 0.1, 0, -this.depth * 0.25);
        fill(255, 255, 0); // Yellow buttons
        sphere(this.width * 0.05);
        pop();
        pop();
        
        // Head
        push();
        translate(0, -this.height * 0.3, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.3);
        
        // Eyes
        push();
        translate(this.width * 0.1, -this.width * 0.05, -this.depth * 0.25);
        fill(255);
        sphere(this.width * 0.08);
        
        // Pupil
        translate(0, 0, -this.width * 0.03);
        fill(0, 0, 200); // Blue eyes
        sphere(this.width * 0.04);
        pop();
        
        push();
        translate(-this.width * 0.1, -this.width * 0.05, -this.depth * 0.25);
        fill(255);
        sphere(this.width * 0.08);
        
        // Pupil
        translate(0, 0, -this.width * 0.03);
        fill(0, 0, 200); // Blue eyes
        sphere(this.width * 0.04);
        pop();
        
        // Nose
        push();
        translate(0, this.width * 0.05, -this.depth * 0.3);
        fill(255, 180, 160);
        sphere(this.width * 0.1);
        pop();
        
        // Mustache
        push();
        translate(0, this.width * 0.15, -this.depth * 0.25);
        fill(50, 30, 0); // Dark brown
        box(this.width * 0.5, this.height * 0.05, this.depth * 0.1);
        pop();
        
        // Hat
        push();
        translate(0, -this.height * 0.2, 0);
        fill(255, 0, 0); // Red hat
        
        // Hat base
        box(this.width * 0.6, this.height * 0.1, this.depth * 0.5);
        
        // Hat top
        translate(0, -this.height * 0.1, 0);
        box(this.width * 0.5, this.height * 0.1, this.depth * 0.4);
        
        // Hat emblem
        push();
        translate(0, 0, -this.depth * 0.25);
        fill(255);
        ellipse(0, 0, this.width * 0.2, this.width * 0.2);
        
        fill(255, 0, 0);
        textSize(this.width * 0.15);
        textAlign(CENTER, CENTER);
        text("M", 0, 0);
        pop();
        pop();
        pop();
        
        // Arms with animation
        // Left arm
        push();
        translate(-this.width * 0.4, -this.height * 0.05, 0);
        if (this.attackCooldown < 20) {
          // Jumping animation - arms up
          rotateZ(-PI/3);
        } else {
          rotateZ(-PI/8 + walkingEffect);
        }
        fill(255, 50, 50); // Red shirt
        box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
        
        // Hand
        translate(0, this.height * 0.2, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.12);
        pop();
        
        // Right arm
        push();
        translate(this.width * 0.4, -this.height * 0.05, 0);
        if (this.attackCooldown < 20) {
          // Jumping animation - arms up
          rotateZ(PI/3);
        } else {
          rotateZ(PI/8 - walkingEffect);
        }
        fill(255, 50, 50); // Red shirt
        box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
        
        // Hand
        translate(0, this.height * 0.2, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.12);
        pop();
        
        // Jump effect
        if (this.attackCooldown < 20) {
          push();
          translate(0, this.height * 0.6, 0);
          noStroke();
          fill(200, 200, 200, 150 - this.attackCooldown * 7.5);
          ellipse(0, 0, this.width * 1.5, this.depth * 0.5);
          pop();
        }
        pop();
        break;
        
      case 'MEGAMAN':
        // Megaman - more detailed with animated arm cannon
        push();
        // Legs with walking animation
        push();
        translate(0, this.height * 0.3, 0);
        
        // Left leg
        push();
        translate(-this.width * 0.15, 0, 0);
        rotateX(walkingEffect);
        fill(0, 50, 200); // Dark blue
        box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
        
        // Boot
        translate(0, this.height * 0.2, 0);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
        pop();
        
        // Right leg
        push();
        translate(this.width * 0.15, 0, 0);
        rotateX(-walkingEffect);
        fill(0, 50, 200); // Dark blue
        box(this.width * 0.2, this.height * 0.3, this.depth * 0.2);
        
        // Boot
        translate(0, this.height * 0.2, 0);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.25, this.height * 0.1, this.depth * 0.3);
        pop();
        pop();
        
        // Torso
        push();
        translate(0, 0, 0);
        fill(50, 150, 255); // Light blue body
        box(this.width * 0.6, this.height * 0.3, this.depth * 0.4);
        
        // Chest detail
        push();
        translate(0, 0, -this.depth * 0.15);
        fill(0, 50, 200); // Dark blue
        box(this.width * 0.4, this.height * 0.2, this.depth * 0.1);
        pop();
        pop();
        
        // Head with helmet
        push();
        translate(0, -this.height * 0.3, 0);
        
        // Face
        fill(255, 220, 180); // Skin tone
        box(this.width * 0.3, this.height * 0.25, this.depth * 0.25);
        
        // Helmet
        push();
        translate(0, -this.height * 0.1, 0);
        fill(0, 50, 200); // Dark blue helmet
        
        // Main helmet
        sphere(this.width * 0.35);
        
        // Helmet details
        push();
        translate(0, -this.width * 0.1, 0);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.4, this.height * 0.1, this.depth * 0.3);
        pop();
        
        // Ear pieces
        push();
        translate(this.width * 0.3, 0, 0);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.1, this.height * 0.2, this.depth * 0.1);
        pop();
        
        push();
        translate(-this.width * 0.3, 0, 0);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.1, this.height * 0.2, this.depth * 0.1);
        pop();
        pop();
        
        // Eyes
        push();
        translate(this.width * 0.1, 0, -this.depth * 0.15);
        fill(255);
        box(this.width * 0.1, this.height * 0.05, this.depth * 0.05);
        pop();
        
        push();
        translate(-this.width * 0.1, 0, -this.depth * 0.15);
        fill(255);
        box(this.width * 0.1, this.height * 0.05, this.depth * 0.05);
        pop();
        pop();
        
        // Left arm
        push();
        translate(-this.width * 0.4, -this.height * 0.05, 0);
        rotateZ(-PI/8 + walkingEffect);
        fill(50, 150, 255); // Light blue
        box(this.width * 0.15, this.height * 0.3, this.depth * 0.15);
        
        // Hand
        translate(0, this.height * 0.2, 0);
        fill(0, 50, 200); // Dark blue
        box(this.width * 0.2, this.height * 0.1, this.depth * 0.2);
        pop();
        
        // Right arm (cannon arm) with firing animation
        push();
        translate(this.width * 0.4, -this.height * 0.05, 0);
        
        // Arm animation based on attack state
        if (this.attackCooldown < 10) {
          // Recoil animation
          rotateZ(PI/6 + sin(frameCount * 0.5) * 0.2);
        } else {
          rotateZ(PI/8 - walkingEffect);
        }
        
        fill(50, 150, 255); // Light blue
        box(this.width * 0.15, this.height * 0.2, this.depth * 0.15);
        
        // Arm cannon
        translate(this.width * 0.1, this.height * 0.15, 0);
        
        // Cannon base
        fill(100, 100, 100); // Gray
        cylinder(this.width * 0.2, this.width * 0.3);
        
        // Cannon barrel
        push();
        translate(this.width * 0.2, 0, 0);
        fill(70, 70, 70); // Darker gray
        cylinder(this.width * 0.15, this.width * 0.4);
        
        // Cannon muzzle
        translate(this.width * 0.25, 0, 0);
        fill(50, 50, 50); // Even darker gray
        cylinder(this.width * 0.17, this.width * 0.1);
        
        // Muzzle flash when firing
        if (this.attackCooldown < 5) {
          translate(this.width * 0.1, 0, 0);
          fill(0, 200, 255, 200 - this.attackCooldown * 40);
          sphere(this.width * 0.2 * (5 - this.attackCooldown) / 5);
        }
        pop();
        
        // Energy charge effect
        if (this.attackCooldown > 50 && this.attackCooldown < 60) {
          push();
          translate(this.width * 0.4, 0, 0);
          fill(0, 200, 255, 150);
          sphere(this.width * 0.15 * (60 - this.attackCooldown) / 10);
          pop();
        }
        pop();
        pop();
        break;
        
      case 'SONGOKU':
        // Songoku - powerful character with animated energy effects
        push();
        // Legs in fighting stance
        push();
        translate(0, this.height * 0.3, 0);
        
        // Left leg
        push();
        translate(-this.width * 0.2, 0, 0);
        rotateX(PI/8 + walkingEffect * 0.5);
        fill(0, 0, 150); // Dark blue pants
        box(this.width * 0.25, this.height * 0.4, this.depth * 0.25);
        
        // Boot
        translate(0, this.height * 0.25, 0);
        fill(50, 50, 50); // Dark boots
        box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
        pop();
        
        // Right leg
        push();
        translate(this.width * 0.2, 0, 0);
        rotateX(-PI/8 - walkingEffect * 0.5);
        fill(0, 0, 150); // Dark blue pants
        box(this.width * 0.25, this.height * 0.4, this.depth * 0.25);
        
        // Boot
        translate(0, this.height * 0.25, 0);
        fill(50, 50, 50); // Dark boots
        box(this.width * 0.3, this.height * 0.1, this.depth * 0.3);
        pop();
        pop();
        
        // Torso
        push();
        translate(0, 0, 0);
        fill(255, 150, 0); // Orange gi
        box(this.width * 0.7, this.height * 0.4, this.depth * 0.4);
        
        // Gi belt
        push();
        translate(0, this.height * 0.15, 0);
        fill(0, 0, 150); // Blue belt
        box(this.width * 0.7, this.height * 0.1, this.depth * 0.5);
        pop();
        
        // Gi symbol
        push();
        translate(0, -this.height * 0.1, -this.depth * 0.21);
        fill(255);
        ellipse(0, 0, this.width * 0.3, this.width * 0.3);
        
        fill(255, 0, 0);
        textSize(this.width * 0.2);
        textAlign(CENTER, CENTER);
        text("悟", 0, 0);
        pop();
        pop();
        
        // Head
        push();
        translate(0, -this.height * 0.35, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.25);
        
        // Eyes
        push();
        translate(this.width * 0.1, -this.width * 0.05, -this.depth * 0.2);
        fill(255);
        sphere(this.width * 0.07);
        
        // Pupil
        translate(0, 0, -this.width * 0.02);
        fill(0);
        sphere(this.width * 0.03);
        pop();
        
        push();
        translate(-this.width * 0.1, -this.width * 0.05, -this.depth * 0.2);
        fill(255);
        sphere(this.width * 0.07);
        
        // Pupil
        translate(0, 0, -this.width * 0.02);
        fill(0);
        sphere(this.width * 0.03);
        pop();
        
        // Eyebrows
        push();
        translate(this.width * 0.1, -this.width * 0.12, -this.depth * 0.2);
        fill(0);
        box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
        pop();
        
        push();
        translate(-this.width * 0.1, -this.width * 0.12, -this.depth * 0.2);
        fill(0);
        box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
        pop();
        
        // Mouth
        push();
        translate(0, this.width * 0.1, -this.depth * 0.2);
        fill(200, 100, 100);
        box(this.width * 0.15, this.height * 0.02, this.depth * 0.05);
        pop();
        
        // Spiky hair with animation
        push();
        translate(0, -this.height * 0.2, 0);
        
        // Hair color changes based on power level
        let hairColor;
        if (this.specialCooldown < 30 || this.attackCooldown < 10) {
          // Powered up - yellow hair
          hairColor = [255, 255, 0];
          
          // Energy aura
          push();
          noStroke();
          fill(255, 255, 100, 100);
          sphere(this.width * 0.6 + sin(frameCount * 0.2) * this.width * 0.1);
          pop();
        } else {
          // Normal - black hair
          hairColor = [0, 0, 0];
        }
        
        fill(hairColor);
        
        // Create spiky hair with animation
        for (let i = 0; i < 12; i++) {
          push();
          let angle = i * TWO_PI / 12;
          let spikeHeight = this.height * 0.3;
          
          // Add animation to hair
          if (this.specialCooldown < 30 || this.attackCooldown < 10) {
            spikeHeight += sin(frameCount * 0.2 + i) * this.height * 0.1;
          }
          
          translate(
            cos(angle) * this.width * 0.2, 
            -this.height * 0.1 + sin(frameCount * 0.1 + i) * 0.05, 
            sin(angle) * this.depth * 0.2
          );
          
          // Rotate spikes outward
          let rotX = atan2(sin(angle), 0);
          let rotZ = atan2(cos(angle), 1);
          rotateX(rotX);
          rotateZ(rotZ);
          
          // Draw spike
          cone(this.width * 0.1, spikeHeight);
          pop();
        }
        pop();
        pop();
        
        // Arms with fighting stance
        // Left arm
        push();
        translate(-this.width * 0.45, -this.height * 0.1, 0);
        
        // Arm position based on attack state
        if (this.attackCooldown < 15) {
          // Punching animation
          rotateZ(-PI/2 + sin(frameCount * 0.5) * 0.5);
          rotateX(sin(frameCount * 0.5) * 0.3);
        } else {
          // Fighting stance
          rotateZ(-PI/4 + sin(this.animationFrame) * 0.1);
        }
        
        fill(255, 150, 0); // Orange gi
        box(this.width * 0.2, this.height * 0.35, this.depth * 0.2);
        
        // Hand
        translate(0, this.height * 0.2, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.15);
        
        // Energy effect on fist during attack
        if (this.attackCooldown < 15) {
          push();
          noStroke();
          fill(255, 255, 0, 150 - this.attackCooldown * 10);
          sphere(this.width * 0.2 + sin(frameCount * 0.5) * this.width * 0.05);
          pop();
        }
        pop();
        
        // Right arm
        push();
        translate(this.width * 0.45, -this.height * 0.1, 0);
        
        // Arm position based on attack state
        if (this.specialCooldown < 30) {
          // Kamehameha charging pose
          rotateZ(PI/2);
          rotateX(PI/6);
        } else if (this.attackCooldown < 15) {
          // Punching animation
          rotateZ(PI/2 - sin(frameCount * 0.5) * 0.5);
          rotateX(-sin(frameCount * 0.5) * 0.3);
        } else {
          // Fighting stance
          rotateZ(PI/4 - sin(this.animationFrame) * 0.1);
        }
        
        fill(255, 150, 0); // Orange gi
        box(this.width * 0.2, this.height * 0.35, this.depth * 0.2);
        
        // Hand
        translate(0, this.height * 0.2, 0);
        fill(255, 220, 180); // Skin tone
        sphere(this.width * 0.15);
        
        // Energy ball during special attack
        if (this.specialCooldown < 30) {
          push();
          noStroke();
          fill(255, 255, 0, 200);
          sphere(this.width * 0.25 * (30 - this.specialCooldown) / 30);
          
          // Energy rays
          for (let i = 0; i < 8; i++) {
            push();
            let angle = i * TWO_PI / 8;
            let rayLength = this.width * 0.4 * (30 - this.specialCooldown) / 30;
            
            translate(
              cos(angle) * rayLength * 0.5, 
              sin(angle) * rayLength * 0.5, 
              0
            );
            
            rotateX(PI/2);
            rotateY(angle);
            
            fill(255, 255, 0, 150);
            cylinder(this.width * 0.05, rayLength);
            pop();
          }
          pop();
        }
        
        // Energy effect on fist during attack
        if (this.attackCooldown < 15) {
          push();
          noStroke();
          fill(255, 255, 0, 150 - this.attackCooldown * 10);
          sphere(this.width * 0.2 + sin(frameCount * 0.5) * this.width * 0.05);
          pop();
        }
        pop();
        
        // Power-up aura effect
        if (this.specialCooldown < 30 || this.attackCooldown < 10) {
          push();
          noStroke();
          
          // Ground energy effect
          translate(0, this.height * 0.6, 0);
          fill(255, 255, 0, 100);
          ellipse(0, 0, this.width * 2 + sin(frameCount * 0.2) * this.width * 0.5, this.depth * 0.5);
          
          // Rising energy particles
          for (let i = 0; i < 10; i++) {
            push();
            let angle = random(TWO_PI);
            let dist = random(this.width);
            let height = random(-this.height * 0.5, this.height * 0.5);
            
            translate(cos(angle) * dist, height, sin(angle) * dist);
            fill(255, 255, random(100, 200), 150);
            sphere(random(this.width * 0.05, this.width * 0.1));
            pop();
          }
          pop();
        }
        pop();
        break;
        
      default:
        // Default character with basic humanoid features
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
  }
  
  drawHealthBar() {
    // Health bar above character
    push();
    translate(0, -this.height * 0.9, 0);
    rotateY(-this.rotation); // Counter-rotate to face camera
    
    // Create a 3D health bar that's always visible
    push();
    // Add a backing plate for better visibility
    noStroke();
    fill(0, 0, 0, 150);
    rect(-this.width / 2 - 5, -12, this.width + 10, 24, 5);
    
    // Character type icon
    push();
    translate(-this.width / 2 - 20, 0, 0);
    
    // Different icon based on character type
    switch (this.type) {
      case 'TANK':
        fill(150, 150, 150);
        box(15, 15, 5);
        break;
      case 'HERO':
        fill(180, 180, 255);
        rotateZ(PI/4);
        box(5, 20, 5);
        break;
      case 'MARIO':
        fill(255, 0, 0);
        sphere(8);
        break;
      case 'MEGAMAN':
        fill(0, 150, 255);
        sphere(8);
        break;
      case 'SONGOKU':
        fill(255, 255, 0);
        sphere(8);
        break;
      default:
        fill(200, 200, 0);
        sphere(8);
    }
    pop();
    
    // Background bar with 3D effect
    stroke(50);
    strokeWeight(1);
    fill(80, 80, 80);
    rect(-this.width / 2, -8, this.width, 16, 3);
    
    // Health percentage
    const healthPercent = this.health / (CONFIG.GBA.CHARACTER_HEALTH * this.typeConfig.HEALTH_MULTIPLIER);
    
    // Health bar color changes based on health percentage
    if (healthPercent > 0.6) {
      // Healthy - green
      fill(0, 255, 0);
    } else if (healthPercent > 0.3) {
      // Medium health - yellow
      fill(255, 255, 0);
    } else {
      // Low health - red with pulsing effect
      const pulseEffect = sin(frameCount * 0.2) * 0.2 + 0.8;
      fill(255 * pulseEffect, 0, 0);
    }
    
    // Health bar with rounded corners
    noStroke();
    rect(-this.width / 2, -8, this.width * healthPercent, 16, 3);
    
    // Health percentage text
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(Math.floor(healthPercent * 100) + "%", 0, 0);
    
    // Character type label
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(this.type, 0, -20);
    pop();
    
    // Add damage indicators when character takes damage
    if (this.health < this.lastHealth && frameCount % 5 === 0) {
      this.damageIndicators.push({
        value: Math.floor(this.lastHealth - this.health),
        x: random(-this.width/2, this.width/2),
        y: -this.height * 0.5,
        life: 30
      });
      this.lastHealth = this.health;
    }
    
    // Draw damage indicators
    for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
      const indicator = this.damageIndicators[i];
      
      push();
      translate(indicator.x, indicator.y, 0);
      rotateY(-this.rotation);
      
      // Text gets smaller and more transparent as it rises
      const alpha = indicator.life * 8;
      fill(255, 0, 0, alpha);
      textSize(20 + (30 - indicator.life));
      textAlign(CENTER, CENTER);
      text("-" + indicator.value, 0, 0);
      pop();
      
      // Move indicator up
      indicator.y -= 2;
      indicator.life--;
      
      // Remove expired indicators
      if (indicator.life <= 0) {
        this.damageIndicators.splice(i, 1);
      }
    }
    
    pop();
  }
  
  findNearestEnemy() {
    return findNearestEnemies(this, 1, this.gameState);
  }
  
  attack(target) {
    // Different attack based on character type
    switch (this.type) {
      case 'TANK':
        // Tank fires a powerful shot
        const tankBullet = new Bullet(
          this.x, 
          this.y - this.height * 0.3, 
          this.z, 
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
        // Mario jumps on enemies
        this.velocityY = -5;
        if (dist(this.x, this.z, target.x, target.z) < this.width) {
          target.health -= this.damage;
        }
        break;
        
      case 'MEGAMAN':
        // Megaman fires from arm cannon
        for (let i = 0; i < 3; i++) { // Triple shot
          const spread = (i - 1) * 0.1;
          const bulletAngle = this.rotation - HALF_PI + spread;
          const bulletSpeed = 25;
          
          const megamanBullet = new Bullet(
            this.x, 
            this.y, 
            this.z, 
            bulletAngle, 
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
            megamanBullet.vx = Math.cos(bulletAngle) * bulletSpeed;
            megamanBullet.vy = 0; // No vertical movement
            megamanBullet.vz = Math.sin(bulletAngle) * bulletSpeed;
          }
          
          this.gameState.bullets.push(megamanBullet);
        }
        break;
        
      case 'SONGOKU':
        // Songoku does a powerful energy attack
        const bulletAngle = this.rotation - HALF_PI;
        const bulletSpeed = 30;
        
        const gokuBullet = new Bullet(
          this.x, 
          this.y, 
          this.z, 
          bulletAngle, 
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
          gokuBullet.vx = Math.cos(bulletAngle) * bulletSpeed;
          gokuBullet.vy = 0; // No vertical movement
          gokuBullet.vz = Math.sin(bulletAngle) * bulletSpeed;
        }
        
        this.gameState.bullets.push(gokuBullet);
        break;
    }
  }
  
  useSpecialAbility() {
    // Special abilities unique to each character type
    switch (this.type) {
      case 'TANK':
        // Tank creates a shockwave that damages all nearby enemies
        const tankWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 5, 
          [100, 100, 100, 200]
        );
        tankWave.damage = this.damage * 0.5;
        tankWave.growthRate = 3;
        this.gameState.waves.push(tankWave);
        break;
        
      case 'HERO':
        // Hero does a spinning sword attack
        const heroWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 3, 
          [200, 200, 255, 150]
        );
        heroWave.damage = this.damage * 0.7;
        heroWave.growthRate = 2;
        this.gameState.waves.push(heroWave);
        break;
        
      case 'MARIO':
        // Mario throws fireballs in all directions
        for (let i = 0; i < 8; i++) {
          const angle = i * TWO_PI / 8;
          // Set properties before creating the bullet
          const bulletSpeed = 15;
          const bulletDamage = this.damage * 0.6;
          const bulletSize = 5;
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
        // Megaman charges a powerful blast
        const megamanWave = new Wave(
          this.x, 
          this.y, 
          this.z, 
          this.width * 4, 
          [0, 200, 255, 150]
        );
        megamanWave.damage = this.damage;
        megamanWave.growthRate = 2.5;
        this.gameState.waves.push(megamanWave);
        break;
        
      case 'SONGOKU':
        // Songoku does a kamehameha blast
        // Create a powerful wave in front of the character
        const gokuWave = new Wave(
          this.x + cos(this.rotation - HALF_PI) * this.width * 2, 
          this.y, 
          this.z + sin(this.rotation - HALF_PI) * this.width * 2, 
          this.width * 6, 
          [255, 255, 0, 200]
        );
        gokuWave.damage = this.damage * 1.5;
        gokuWave.growthRate = 4;
        this.gameState.waves.push(gokuWave);
        break;
    }
  }
  
  takeDamage(amount) {
    // Store previous health for damage indicator
    this.lastHealth = this.health;
    
    // Apply damage
    this.health -= amount;
    
    // Create damage indicator
    this.damageIndicators.push({
      value: Math.floor(amount),
      x: random(-this.width/2, this.width/2),
      y: -this.height * 0.5,
      life: 30
    });
    
    // Create hit effect
    if (this.gameState && this.gameState.waves) {
      // Create a small impact wave
      const hitWave = new Wave(
        this.x, 
        this.y, 
        this.z, 
        this.width * 1.5, 
        [255, 0, 0, 150]
      );
      hitWave.growthRate = 2;
      hitWave.maxRadius = this.width * 2;
      hitWave.damage = 0; // This wave doesn't cause damage
      this.gameState.waves.push(hitWave);
    }
    
    // Return true if character is dead
    return this.health <= 0;
  }
}