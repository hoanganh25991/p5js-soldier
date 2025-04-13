// Entity Manager
// Handles updating and rendering all game entities

import { spawnRandomPowerUp } from '../entities/powerUp.js';

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

  // Update and show bullets
  updateBullets(gameState);

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
    if (gameState.waves[i].update()) {
      gameState.waves.splice(i, 1);
    } else {
      gameState.waves[i].show();
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