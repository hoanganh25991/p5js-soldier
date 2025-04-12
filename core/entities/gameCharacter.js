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
          this.x += cos(angleToTarget) * this.speed;
          this.z += sin(angleToTarget) * this.speed;
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
          // Move a bit away to create distance before engaging next enemy
          this.x += cos(angleToTarget) * -20; // Move back slightly
          this.z += sin(angleToTarget) * -20;
        }
      }
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // Use special ability if cooldown is ready and not too frequently
    if (this.specialCooldown <= 0 && this.gameState.frameCount % 5 === 0) {
      this.useSpecialAbility();
      this.specialCooldown = this.specialRate;
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
    
    // Add a visual indicator above the character
    this.drawIndicator();
    
    pop();
  }
  
  // Draw a simple indicator above the character (removed complex effects)
  drawIndicator() {
    push();
    // Position above the character
    translate(0, -this.height * 1.2, 0);
    
    // Make the indicator always face the camera
    rotateY(-this.rotation);
    
    // Simple small indicator dot
    noStroke();
    fill(255, 0, 0); // Red dot
    sphere(10); // Small fixed size
    
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
        
        // Simplified jump effect - just a small dust puff
        if (this.attackCooldown < 10) { // Reduced duration
          push();
          translate(0, this.height * 0.6, 0);
          noStroke();
          fill(200, 200, 200, 100 - this.attackCooldown * 10); // Fades faster
          ellipse(0, 0, this.width * 0.8, this.depth * 0.3); // Smaller size
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
        
        // Set the font before drawing text
        if (this.gameState.gameFont) {
          textFont(this.gameState.gameFont);
        }
        
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
        
        // Power-up aura effect - optimized for performance
        if (this.specialCooldown < 30 || this.attackCooldown < 10) {
          push();
          noStroke();
          
          // Ground energy effect - only draw when absolutely necessary
          // Only draw ground effect for special abilities, not regular attacks
          if (this.specialCooldown < 30) {
            translate(0, this.height * 0.6, 0);
            fill(255, 255, 0, 100);
            ellipse(0, 0, this.width * 2, this.depth * 0.5); // Removed sin animation for better performance
          }
          
          // Rising energy particles - reduced count and only for special abilities
          if (this.specialCooldown < 15) { // Only during the first half of special cooldown
            // Reduce particle count from 10 to 3
            for (let i = 0; i < 3; i++) {
              push();
              let angle = random(TWO_PI);
              let dist = random(this.width);
              let height = random(-this.height * 0.5, this.height * 0.5);
              
              translate(cos(angle) * dist, height, sin(angle) * dist);
              fill(255, 255, random(100, 200), 150);
              sphere(random(this.width * 0.05, this.width * 0.1));
              pop();
            }
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
    
    // Set the font before drawing any text
    if (this.gameState.gameFont) {
      textFont(this.gameState.gameFont);
    }
    
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
    
    // Track health changes without showing damage indicators
    if (this.health < this.lastHealth) {
      // Just update the last health value without creating text indicators
      this.lastHealth = this.health;
      
      // Flash the health bar instead of showing damage numbers
      if (this.gameState.frameCount % 5 === 0) {
        // Create a small hit effect
        if (this.gameState && this.gameState.waves) {
          const hitWave = new Wave(
            this.x, 
            this.y, 
            this.z, 
            this.width * 0.8, 
            [255, 0, 0, 100]
          );
          hitWave.growthRate = 1.5;
          hitWave.maxRadius = this.width * 1.2;
          this.gameState.waves.push(hitWave);
        }
      }
    }
    
    pop();
  }
  
  findNearestEnemy() {
    // Get the closest enemy
    const enemies = findNearestEnemies(this, 1, this.gameState);
    return enemies.length > 0 ? enemies[0] : null;
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
    
    // Apply damage
    this.health -= amount;
    
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
    
    // Return true if character is dead
    return this.health <= 0;
  }
}