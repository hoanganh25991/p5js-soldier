// Health Bar Module
// Implements a reusable 3D health bar that can be used by different entities

import CONFIG from '../config.js';

export class HealthBar {
  constructor(options = {}) {
    // Default options
    this.options = {
      width: 50,                // Width of the health bar
      height: CONFIG.ENEMY_HEALTH_BAR.HEIGHT || 5, // Height of the health bar
      depth: 5,                 // Depth of the health bar
      verticalOffset: 20,       // Distance above the entity
      alwaysGreen: false,       // If true, always use green color regardless of health percentage
      useEntityWidth: true,     // If true, use the entity's width for the health bar width
      widthMultiplier: 1.2,     // Multiplier for the entity's width if useEntityWidth is true
      showPercentage: false,    // If true, show health percentage text
      showName: false,          // If true, show entity name
      name: "",                 // Entity name to display
      ...options                // Override defaults with provided options
    };
    
    // Health values
    this.currentHealth = 100;
    this.maxHealth = 100;
  }
  
  // Update health values
  updateHealth(currentHealth, maxHealth) {
    this.currentHealth = currentHealth;
    this.maxHealth = maxHealth;
  }
  
  // Calculate health percentage
  getHealthPercentage() {
    let healthPercent = this.currentHealth / this.maxHealth;
    // Ensure health percentage is valid
    return isNaN(healthPercent) ? 0 : Math.max(0, Math.min(1, healthPercent));
  }
  
  // Draw the health bar
  draw(entity, rotation) {
    // Calculate health percentage
    const healthPercent = this.getHealthPercentage();
    
    // Calculate bar width based on options
    let barWidth = this.options.width;
    if (this.options.useEntityWidth && entity.width) {
      barWidth = entity.width * this.options.widthMultiplier;
    }
    
    // Calculate vertical position
    const entityHeight = entity.height || 0;
    const barY = -entityHeight - this.options.verticalOffset;
    
    // Make the health bar always face the camera
    rotateY(-rotation);
    
    // Draw background (empty bar)
    push();
    translate(0, barY, 0);
    noStroke();
    fill(...CONFIG.ENEMY_HEALTH_BAR.COLORS.BACKGROUND);
    box(barWidth, this.options.height, this.options.depth);
    pop();
    
    // Only draw health bar if there's health to show
    if (healthPercent > 0) {
      // Draw health (filled portion)
      push();
      translate(-barWidth/2 + (barWidth * healthPercent)/2, barY, 0);
      
      // Determine fill color based on health percentage and options
      if (this.options.alwaysGreen) {
        // Always use green for some entities (like characters)
        fill(...CONFIG.ENEMY_HEALTH_BAR.COLORS.HIGH);
      } else {
        // Color based on health percentage for other entities (like enemies)
        if (healthPercent > 0.6) {
          fill(...CONFIG.ENEMY_HEALTH_BAR.COLORS.HIGH);
        } else if (healthPercent > 0.3) {
          fill(...CONFIG.ENEMY_HEALTH_BAR.COLORS.MEDIUM);
        } else {
          fill(...CONFIG.ENEMY_HEALTH_BAR.COLORS.LOW);
        }
      }
      
      noStroke();
      box(barWidth * healthPercent, this.options.height, this.options.depth + 1); // Slightly in front of background
      pop();
    }
    
    // Draw name and percentage if enabled
    if (this.options.showName || this.options.showPercentage) {
      push();
      
      // Position text above health bar
      translate(0, barY - 15, 0);
      
      // Use HTML overlay for text to ensure readability
      // We'll use p5.js's text rendering for 3D space
      textAlign(CENTER, CENTER);
      textSize(12);
      
      // Draw name if enabled
      if (this.options.showName && this.options.name) {
        fill(255);
        stroke(0);
        strokeWeight(2);
        text(this.options.name, 0, 0);
        
        // If also showing percentage, move down for next line
        if (this.options.showPercentage) {
          translate(0, -15, 0);
        }
      }
      
      // Draw percentage if enabled
      if (this.options.showPercentage) {
        const percentText = Math.floor(healthPercent * 100) + "%";
        
        // Color based on health percentage
        if (healthPercent > 0.6) {
          fill(0, 255, 0);
        } else if (healthPercent > 0.3) {
          fill(255, 255, 0);
        } else {
          fill(255, 0, 0);
        }
        
        stroke(0);
        strokeWeight(2);
        text(percentText, 0, 0);
      }
      
      pop();
    }
  }
}