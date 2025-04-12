// Wave Module

import CONFIG from '../config.js';

export class Wave {
  constructor(x, y, z, initialRadius = 0, color = [255, 255, 255, 200]) {
    this.x = x;
    this.y = y || -50; // Default to ground level if not specified
    this.z = z;
    
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
    
    // Create fewer rings for better performance
    // Reduced from 3 rings to 1-2 rings based on initial radius
    if (initialRadius > 100) {
      // For larger waves, use just one ring
      this.rings = [
        { radius: initialRadius, speed: this.growthRate }
      ];
    } else {
      // For smaller waves, use two rings
      this.rings = [
        { radius: initialRadius, speed: this.growthRate },
        { radius: initialRadius * 0.7, speed: this.growthRate * 0.7 }
      ];
    }
  }

  update() {
    // Decrease lifespan
    this.lifespan--;
    
    // Update main radius
    if (this.radius < this.maxRadius) {
      this.radius += this.growthRate;
    }
    
    // Update all rings
    for (let ring of this.rings) {
      if (ring.radius < this.maxRadius) {
        ring.radius += ring.speed;
      }
    }
    
    // Apply rising effect if specified
    if (this.riseSpeed > 0) {
      this.y -= this.riseSpeed;
    }
    
    // Apply damage to enemies if this is a damaging wave
    if (this.damage > 0 && this.damageRadius > 0 && this.gameState && this.gameState.enemies) {
      for (let enemy of this.gameState.enemies) {
        const distance = dist(this.x, this.z, enemy.x, enemy.z);
        if (distance <= this.damageRadius) {
          enemy.takeDamage(this.damage);
        }
      }
    }
    
    // Return true when the wave should be removed
    return this.lifespan <= 0;
  }

  show() {
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
    
    // Draw multiple expanding rings
    for (let i = 0; i < this.rings.length; i++) {
      // Calculate alpha based on lifespan and ring index
      let alpha = map(this.lifespan, 30, 0, this.color[3] || 255, 0);
      alpha *= (1 - i * 0.2); // Fade out outer rings
      
      // Set stroke color with calculated alpha
      stroke(this.color[0], this.color[1], this.color[2], alpha);
      strokeWeight(3 - i); // Thinner outer rings
      
      // Use fewer vertices for better performance
      // Increase the angle step from 0.1 to 0.3 (reduces vertex count by 3x)
      const angleStep = 0.3;
      
      // Draw continuous ring
      beginShape();
      for (let angle = 0; angle <= TWO_PI; angle += angleStep) {
        let r = this.rings[i].radius;
        let x = cos(angle) * r;
        let z = sin(angle) * r;
        vertex(x, 0, z);
      }
      endShape(CLOSE);
    }
  }
  
  drawFlatWave() {
    // Draw a flat wave (cylinder)
    for (let i = 0; i < this.rings.length; i++) {
      // Calculate alpha based on lifespan and ring index
      let alpha = map(this.lifespan, 30, 0, this.color[3] || 255, 0);
      alpha *= (1 - i * 0.2); // Fade out outer rings
      
      // Set fill color with calculated alpha
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], alpha);
      
      // Draw cylinder
      push();
      rotateX(HALF_PI); // Rotate to make cylinder vertical
      cylinder(this.rings[i].radius, this.height);
      pop();
    }
  }
}