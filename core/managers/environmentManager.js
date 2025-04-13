// Environment Manager
// Handles environment updates, lighting, and effects

import { updateEnvironment, drawEnvironmentEffects, getEnvironmentModifiers } from '../environment/environmentEffects.js';
import { drawEnvironment } from '../environment.js';

/**
 * Update and render the game environment
 * @param {Object} gameState - The global game state
 */
export function updateGameEnvironment(gameState) {
  // Update environment (day/night cycle and weather)
  updateEnvironment(gameState);
  
  // Draw environment effects (sky, weather)
  drawEnvironmentEffects(gameState);
  
  // Get environment modifiers
  const envModifiers = getEnvironmentModifiers(gameState);
  
  // Apply environment lighting
  applyEnvironmentLighting(gameState);
  
  // Draw environment
  drawEnvironment();
  
  // Show waves
  gameState.waves.forEach(wave => wave.show());
  
  // Draw tower
  gameState.tower.show();
  
  // Show player
  gameState.player.show();
}

/**
 * Apply environment lighting based on time of day
 * @param {Object} gameState - The global game state
 */
function applyEnvironmentLighting(gameState) {
  // Apply environment lighting
  ambientLight(gameState.ambientLight || 100);
  
  // Add a main light source (sun/moon)
  const timeOfDay = gameState.timeOfDay;
  if (timeOfDay > 0.25 && timeOfDay < 0.75) {
    // Daytime - bright white light from above
    const intensity = 255 - Math.abs(timeOfDay - 0.5) * 200;
    pointLight(intensity, intensity, intensity, 0, -500, 0);
  } else {
    // Nighttime - dim blue light
    const moonIntensity = 100;
    pointLight(moonIntensity * 0.8, moonIntensity * 0.8, moonIntensity, 0, -300, 0);
  }
}