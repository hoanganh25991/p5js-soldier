// Environment Module
// Handles drawing the ground, grid, and other environmental elements

import CONFIG from './config.js';

/**
 * Draws the ground plane with a grid pattern
 */
export function drawGround() {
  push();
  translate(0, 50, 0);
  rotateX(HALF_PI);
  
  // Draw the base ground plane
  fill(34, 139, 34); // Forest green
  noStroke();
  plane(CONFIG.WORLD_RADIUS * 2, CONFIG.WORLD_RADIUS * 2);
  
  // Add grid pattern
  stroke(45, 150, 45);
  strokeWeight(1);
  let gridSize = 100;
  
  // Draw vertical grid lines
  for (let x = -CONFIG.WORLD_RADIUS; x <= CONFIG.WORLD_RADIUS; x += gridSize) {
    line(x, -CONFIG.WORLD_RADIUS, x, CONFIG.WORLD_RADIUS);
  }
  
  // Draw horizontal grid lines
  for (let z = -CONFIG.WORLD_RADIUS; z <= CONFIG.WORLD_RADIUS; z += gridSize) {
    line(-CONFIG.WORLD_RADIUS, z, CONFIG.WORLD_RADIUS, z);
  }
  
  pop();
}

/**
 * Main function to draw all environment elements
 */
export function drawEnvironment() {
  // Draw the ground with grid
  drawGround();
  
  // Future environment elements can be added here:
  // - drawSkybox()
  // - drawTrees()
  // - drawMountains()
  // - drawWater()
  // etc.
}