// Entity Manager
// Handles updating and rendering all game entities

import { spawnRandomPowerUp } from '../entities/powerUp.js';
import { updateBossSpawning, updateBosses, drawBosses, checkBulletBossCollisions } from './bossManager.js';
import { Wave } from '../entities/wave.js';

/**
 * Update and show all game entities
 * @param {Object} gameState - The global game state
 */
export function updateAndShowEntities(gameState) {
  // Update power-up spawn timer
  updatePowerUpSpawnTimer(gameState);
  
  // Update and render enemies using the controller
  gameState.enemyController.update();
  gameState.enemyController.render();
  
  // Update and render bosses
  updateBossSpawning(gameState);
  updateBosses(gameState);
  drawBosses(gameState);

  // Update and show bullets
  updateBullets(gameState);

  // Update and show bombs
  updateBombs(gameState);

  // Update and show clones
  updateClones(gameState);

  // Update and show turrets
  updateTurrets(gameState);

  // Update and show airstrikes
  updateAirstrikes(gameState);

  // Update and show lasers
  updateLasers(gameState);

  // Update and show waves
  updateWaves(gameState);
  
  // Update and show Game Boy Advanced objects
  updateGBAs(gameState);
  
  // Update and show Gas Lighter objects
  updateGasLighters(gameState);
  
  // Update and show Fire Skills
  updateFireSkills(gameState);
  
  // Update and show Game Characters
  updateGameCharacters(gameState);
  
  // Update and show Power-Ups
  updatePowerUps(gameState);
}

/**
 * Update power-up spawn timer
 * @param {Object} gameState - The global game state
 */
function updatePowerUpSpawnTimer(gameState) {
  if (gameState.powerUpSpawnTimer > 0) {
    gameState.powerUpSpawnTimer--;
    
    // Spawn a power-up when timer reaches zero
    if (gameState.powerUpSpawnTimer === 0) {
      gameState.powerUps.push(spawnRandomPowerUp(gameState));
      
      // Reset timer for next power-up (10-20 seconds)
      gameState.powerUpSpawnTimer = random(600, 1200);
    }
  }
}

/**
 * Update and show bullets
 * @param {Object} gameState - The global game state
 */
function updateBullets(gameState) {
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    if (gameState.bullets[i].update()) { // Returns true if bullet should be removed
      gameState.bullets.splice(i, 1);
    } else {
      gameState.bullets[i].show();
    }
  }
}

/**
 * Update and show clones
 * @param {Object} gameState - The global game state
 */
function updateClones(gameState) {
  for (let i = gameState.clones.length - 1; i >= 0; i--) {
    gameState.clones[i].update();
    gameState.clones[i].show();
    if (gameState.clones[i].lifespan <= 0) {
      gameState.clones.splice(i, 1);
    }
  }
}

/**
 * Update and show turrets
 * @param {Object} gameState - The global game state
 */
function updateTurrets(gameState) {
  for (let i = gameState.turrets.length - 1; i >= 0; i--) {
    gameState.turrets[i].update();
    gameState.turrets[i].show();
    if (gameState.turrets[i].lifespan <= 0) {
      gameState.turrets.splice(i, 1);
    }
  }
}

/**
 * Update and show airstrikes
 * @param {Object} gameState - The global game state
 */
function updateAirstrikes(gameState) {
  for (let i = gameState.airstrikes.length - 1; i >= 0; i--) {
    // Remove airstrike when it flies off screen
    if (gameState.airstrikes[i].x > width + 50) {
      gameState.airstrikes.splice(i, 1);
      continue; // Skip to next iteration after removing
    }
    gameState.airstrikes[i].update();
    gameState.airstrikes[i].show();
  }
}

/**
 * Update and show bombs
 * @param {Object} gameState - The global game state
 */
function updateBombs(gameState) {
  // Initialize bombs array if it doesn't exist
  if (!gameState.bombs) {
    gameState.bombs = [];
  }
  
  for (let i = gameState.bombs.length - 1; i >= 0; i--) {
    if (gameState.bombs[i].update()) { // Returns true if bomb should be removed
      gameState.bombs.splice(i, 1);
    } else {
      gameState.bombs[i].show();
    }
  }
}

/**
 * Update and show lasers
 * @param {Object} gameState - The global game state
 */
function updateLasers(gameState) {
  for (let i = gameState.lasers.length - 1; i >= 0; i--) {
    gameState.lasers[i].update();
    gameState.lasers[i].show();
    if (gameState.lasers[i].lifespan <= 0) {
      gameState.lasers.splice(i, 1);
    }
  }
}

/**
 * Update and show waves
 * @param {Object} gameState - The global game state
 */
function updateWaves(gameState) {
  for (let i = gameState.waves.length - 1; i >= 0; i--) {
    // Check if the wave object has the required methods
    if (!gameState.waves[i]) {
      console.warn('Null or undefined wave object found at index', i);
      gameState.waves.splice(i, 1);
      continue;
    }
    
    // Check if this is a particle object mistakenly added to waves array
    // Particles have properties like vx, vy, vz, size, life, decay, type
    const obj = gameState.waves[i];
    if (typeof obj.update !== 'function' && 
        obj.vx !== undefined && obj.vy !== undefined && obj.vz !== undefined && 
        obj.life !== undefined && obj.decay !== undefined) {
      
      // This is a particle object, convert it to a Wave object
      console.log('Converting particle to Wave at index', i);
      
      // Create a proper Wave object with the particle's properties
      const wave = new Wave(obj.x, obj.y, obj.z, obj.size || 5, obj.color || [255, 255, 255, 200], gameState);
      wave.lifespan = obj.life || 30;
      wave.growthRate = obj.decay || 1;
      
      // Replace the particle with the Wave
      gameState.waves[i] = wave;
      continue;
    }
    else if (typeof obj.update !== 'function') {
      console.warn('Invalid wave object found at index', i);
      console.warn('Object type:', typeof obj);
      console.warn('Object constructor:', obj.constructor ? obj.constructor.name : 'unknown');
      console.warn('Object properties:', Object.keys(obj));
      console.warn('Object value:', JSON.stringify(obj));
      
      // Remove the invalid wave
      gameState.waves.splice(i, 1);
      continue;
    }
    
    // Update the wave and remove if needed
    try {
      if (gameState.waves[i].update()) {
        gameState.waves.splice(i, 1);
      } else {
        gameState.waves[i].show();
      }
    } catch (error) {
      console.error('Error updating wave at index', i, error);
      gameState.waves.splice(i, 1);
    }
  }
}

/**
 * Update and show Game Boy Advanced objects
 * @param {Object} gameState - The global game state
 */
function updateGBAs(gameState) {
  for (let i = gameState.gbas.length - 1; i >= 0; i--) {
    if (gameState.gbas[i].update()) { // Returns true when GBA hits the ground and spawns a character
      gameState.gbas.splice(i, 1);
    } else {
      gameState.gbas[i].show();
    }
  }
}

/**
 * Update and show Gas Lighter objects
 * @param {Object} gameState - The global game state
 */
function updateGasLighters(gameState) {
  if (gameState.gasLighters) {
    for (let i = gameState.gasLighters.length - 1; i >= 0; i--) {
      if (gameState.gasLighters[i].update()) { // Returns true when Gas Lighter hits the ground and casts a fire skill
        gameState.gasLighters.splice(i, 1);
      } else {
        gameState.gasLighters[i].show();
      }
    }
  }
}

/**
 * Update and show Fire Skills
 * @param {Object} gameState - The global game state
 */
function updateFireSkills(gameState) {
  if (gameState.fireSkills) {
    for (let i = gameState.fireSkills.length - 1; i >= 0; i--) {
      if (gameState.fireSkills[i].update()) { // Returns true when fire skill is done
        gameState.fireSkills.splice(i, 1);
      } else {
        gameState.fireSkills[i].show();
      }
    }
  }
}

/**
 * Update and show Game Characters
 * @param {Object} gameState - The global game state
 */
function updateGameCharacters(gameState) {
  for (let i = gameState.gameCharacters.length - 1; i >= 0; i--) {
    gameState.gameCharacters[i].update();
    gameState.gameCharacters[i].show();
    if (gameState.gameCharacters[i].health <= 0 || gameState.gameCharacters[i].lifespan <= 0) {
      gameState.gameCharacters.splice(i, 1);
    }
  }
}

/**
 * Update and show Power-Ups
 * @param {Object} gameState - The global game state
 */
function updatePowerUps(gameState) {
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    if (gameState.powerUps[i].update()) { // Returns true when power-up is collected or expires
      gameState.powerUps.splice(i, 1);
    } else {
      gameState.powerUps[i].show();
    }
  }
}