// Wave Module

import CONFIG from '../config.js';

export class Wave {
  constructor(x, y, z, initialRadius = 0, color = [255, 255, 255, 200], gameState = null) {
    this.x = x;
    this.y = y || -50; // Default to ground level if not specified
    this.z = z;
    this.gameState = gameState; // Store the game state
    
    // Visual properties
    this.color = color;
    this.initialRadius = initialRadius;
    this.radius = initialRadius;
    this.growthRate = 10;
    this.maxRadius = CONFIG.AIRSTRIKE.BLAST_RADIUS;
    this.lifespan = 30; // Duration in frames
    this.height = 0; // Height of the wave (0 = sphere, >0 = cylinder)
    
    // Movement properties
    this.riseSpeed = 0; // Speed at which the wave rises (0 = no rise)
    
    // Combat properties
    this.damage = 0; // Damage caused by the wave
    this.damageRadius = 0; // Radius within which damage is applied
    
    // Debug mode
    this.debug = false; // Set to true to show debug visualization
    
    // Drastically simplified - always use just one ring for all wave effects
    // This significantly reduces the number of objects and calculations
    this.rings = [
      { radius: initialRadius, speed: this.growthRate }
    ];
    
    // Store initial Y position for debugging
    this.initialY = y || -50;
  }

  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Update main radius and ring radius together
    if (this.radius < this.maxRadius) {
      this.radius += this.growthRate;
      
      // Update the single ring (we know it exists because we always create one)
      this.rings[0].radius += this.rings[0].speed;
    }
    
    // Apply rising effect if specified
    if (this.riseSpeed > 0) {
      this.y -= this.riseSpeed;
    }
    
    // Apply damage to enemies if this is a damaging wave
    if (this.damage > 0 && this.damageRadius > 0 && this.gameState) {
      // Get enemies from the enemy controller if available
      const enemies = this.gameState.enemyController ? this.gameState.enemyController.getEnemies() : [];
      
      for (let enemy of enemies) {
        if (enemy && typeof enemy.x !== 'undefined' && typeof enemy.z !== 'undefined') {
          const distance = dist(this.x, this.z, enemy.x, enemy.z);
          if (distance <= this.damageRadius && typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(this.damage);
          }
        }
      }
    }
    
    // Return true when the wave should be removed
    return this.lifespan <= 0;
  }

  show() {
    // Never skip rendering for waves with height or rise speed
    // Only skip flat waves at ground level with no movement for optimization
    if (this.y >= -51 && this.y <= -49 && this.riseSpeed <= 0 && this.height <= 5) {
      // Don't render flat waves at ground level with no rise
      // But always render waves with height or rise speed
      return;
    }
    
    push();
    translate(this.x, this.y, this.z);
    
    // Draw different types of waves based on height
    if (this.height > 0) {
      // Draw as a cylinder (flat wave)
      this.drawFlatWave();
    } else {
      // Draw as expanding rings
      this.drawExpandingRings();
    }
    
    pop();
  }
  
  drawExpandingRings() {
    noFill();
    
    // Draw only the first ring for better performance
    // This significantly reduces the number of vertices being drawn
    if (this.rings.length > 0) {
      // Calculate alpha based on lifespan
      let alpha = map(this.lifespan, 30, 0, this.color[3] || 255, 0);
      
      // Set stroke color with calculated alpha
      stroke(this.color[0], this.color[1], this.color[2], alpha);
      strokeWeight(2); // Consistent stroke weight
      
      // Use even fewer vertices for better performance
      // Increase the angle step from 0.3 to 0.5 (reduces vertex count further)
      const angleStep = 0.5;
      
      // Draw continuous ring with fewer segments
      beginShape();
      for (let angle = 0; angle <= TWO_PI; angle += angleStep) {
        let r = this.rings[0].radius;
        let x = cos(angle) * r;
        let z = sin(angle) * r;
        vertex(x, 0, z);
      }
      endShape(CLOSE);
    }
  }
  
  drawFlatWave() {
    // Draw a 3D wave effect with proper height
    if (this.rings.length > 0) {
      // Calculate alpha based on lifespan
      let alpha = map(this.lifespan, 30, 0, this.color[3] || 255, 0);
      
      // Set fill color with calculated alpha
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], alpha);
      
      // Draw a 3D cylinder that rises from the ground
      push();
      
      // Position the cylinder to rise from the ground
      // Move it down by half its height so it starts at the ground
      translate(0, this.height/2, 0);
      
      // Rotate to make cylinder vertical (standing up from ground)
      rotateX(HALF_PI);
      
      // Use a moderate detail level for better performance
      const detailLevel = 12; // Increased from 8 for better appearance
      
      // Draw the cylinder with proper radius and height
      cylinder(this.rings[0].radius, this.height, detailLevel);
      
      // Add a cap at the top for better visual effect
      translate(0, -this.height/2, 0);
      fill(this.color[0], this.color[1], this.color[2], alpha * 0.7);
      ellipse(0, 0, this.rings[0].radius * 2);
      
      pop();
    }
  }
}