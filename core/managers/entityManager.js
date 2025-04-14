// Entity Manager
// Handles updating and rendering all game entities

import CONFIG from '../../config.js';
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
  // Get performance manager
  const performanceManager = gameState.performanceManager;
  
  // Check if we can use GPU batching
  const useGPUBatching = gameState.gpuManager && 
                         gameState.gpuManager.isInitialized && 
                         CONFIG.PERFORMANCE && 
                         CONFIG.PERFORMANCE.BATCH_RENDERING;
  
  // Group bullets by type for batch rendering
  const bulletsByType = {};
  
  // Limit the number of bullets to process based on performance settings
  const maxBulletsToProcess = performanceManager && performanceManager.isMobile ? 
                             Math.min(100, gameState.bullets.length) : 
                             gameState.bullets.length;
  
  // Process bullets from newest to oldest (most recent bullets are more important)
  const startIndex = Math.max(0, gameState.bullets.length - maxBulletsToProcess);
  
  for (let i = gameState.bullets.length - 1; i >= startIndex; i--) {
    const bullet = gameState.bullets[i];
    
    // Skip bullets that are too far away
    if (performanceManager && !performanceManager.shouldRender(bullet.x, bullet.z)) {
      // For distant bullets, just remove them
      gameState.bullets.splice(i, 1);
      continue;
    }
    
    if (bullet.update()) { // Returns true if bullet should be removed
      gameState.bullets.splice(i, 1);
    } else {
      // Group bullets by type for batch rendering
      const bulletType = bullet.type || 'default';
      if (!bulletsByType[bulletType]) {
        bulletsByType[bulletType] = [];
      }
      bulletsByType[bulletType].push(bullet);
    }
  }
  
  // Render each bullet group
  for (const type in bulletsByType) {
    const bullets = bulletsByType[type];
    
    // Skip empty groups
    if (bullets.length === 0) continue;
    
    // Try to use GPU batching for bullets if available
    if (useGPUBatching && bullets.length > 10) {
      // Attempt to batch render bullets
      if (gameState.gpuManager.batchEntity(bullets, `bullets_${type}`)) {
        continue; // Successfully batched, skip individual rendering
      }
    }
    
    // Fallback to individual rendering
    for (const bullet of bullets) {
      bullet.show();
    }
  }
  
  // If we have too many bullets, remove the oldest ones
  if (gameState.bullets.length > 300) {
    // Keep only the 300 most recent bullets
    gameState.bullets = gameState.bullets.slice(-300);
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
  // Get performance manager and current frame
  const performanceManager = gameState.performanceManager;
  const currentFrame = gameState.frameCount;
  
  // Limit the number of waves to process based on performance settings
  const maxWavesToProcess = performanceManager && performanceManager.isMobile ? 
                           Math.min(50, gameState.waves.length) : 
                           gameState.waves.length;
  
  // Process waves from newest to oldest (most recent waves are more important)
  const startIndex = Math.max(0, gameState.waves.length - maxWavesToProcess);
  
  for (let i = gameState.waves.length - 1; i >= startIndex; i--) {
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
    
    // Skip waves that are too far away
    if (performanceManager && !performanceManager.shouldRender(obj.x, obj.z)) {
      // For distant waves, just decrease lifespan without rendering
      obj.lifespan -= 1;
      if (obj.lifespan <= 0) {
        gameState.waves.splice(i, 1);
      }
      continue;
    }
    
    // Get distance-based LOD for this wave
    let lod = 0;
    if (performanceManager) {
      lod = performanceManager.getEntityLOD(obj.x, obj.z);
    }
    
    // Determine if we should update this wave on this frame
    let shouldUpdate = true;
    
    // Apply staggered updates based on LOD and frame count
    if (lod === 1 && currentFrame % 2 !== 0) {
      shouldUpdate = false;
    } else if (lod === 2 && currentFrame % 3 !== 0) {
      shouldUpdate = false;
    }
    
    // Update the wave and remove if needed
    try {
      if (shouldUpdate) {
        if (obj.update()) {
          gameState.waves.splice(i, 1);
        } else {
          // Apply LOD-based rendering
          if (lod === 0 || (lod === 1 && currentFrame % 2 === 0) || (lod === 2 && currentFrame % 3 === 0)) {
            obj.show();
          }
        }
      } else {
        // For waves we're not updating this frame, just decrease lifespan
        obj.lifespan -= 1;
        if (obj.lifespan <= 0) {
          gameState.waves.splice(i, 1);
        }
      }
    } catch (error) {
      console.error('Error updating wave at index', i, error);
      gameState.waves.splice(i, 1);
    }
  }
  
  // If we have too many waves, remove the oldest ones
  if (gameState.waves.length > 200) {
    // Keep only the 200 most recent waves
    gameState.waves = gameState.waves.slice(-200);
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
  // Get performance manager and current frame
  const performanceManager = gameState.performanceManager;
  const currentFrame = gameState.frameCount;
  
  // Group characters by LOD for batch rendering
  const charactersByLOD = {
    0: [], // High detail (close)
    1: [], // Medium detail (medium distance)
    2: []  // Low detail (far)
  };
  
  for (let i = gameState.gameCharacters.length - 1; i >= 0; i--) {
    const character = gameState.gameCharacters[i];
    
    // Skip characters that are too far away
    if (performanceManager && !performanceManager.shouldRender(character.x, character.z)) {
      // For distant characters, just update lifespan without rendering
      if (character.lifespan) {
        character.lifespan--;
      }
      if (character.health <= 0 || (character.lifespan !== undefined && character.lifespan <= 0)) {
        gameState.gameCharacters.splice(i, 1);
      }
      continue;
    }
    
    // Get LOD level based on distance
    let lod = 0;
    if (performanceManager) {
      lod = performanceManager.getEntityLOD(character.x, character.z);
      
      // Apply performance-based adjustments to LOD
      if (CONFIG.PERFORMANCE) {
        // On low quality settings, increase LOD level (reduce detail)
        if (CONFIG.PERFORMANCE.QUALITY_LEVEL === 'low') {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
        
        // On mobile devices, further reduce detail
        if (performanceManager.isMobile) {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
      }
    }
    
    // Determine if we should update this character on this frame
    let shouldUpdate = true;
    
    // Apply staggered updates based on LOD and frame count
    if (lod === 1 && currentFrame % 2 !== 0) {
      shouldUpdate = false;
    } else if (lod === 2 && currentFrame % 3 !== 0) {
      shouldUpdate = false;
    }
    
    // Update character if needed
    if (shouldUpdate) {
      character.update();
    } else if (character.lifespan) {
      // For characters we're not updating this frame, just decrease lifespan
      character.lifespan--;
    }
    
    // Check if character is dead
    if (character.health <= 0 || (character.lifespan !== undefined && character.lifespan <= 0)) {
      gameState.gameCharacters.splice(i, 1);
      continue;
    }
    
    // Set LOD-specific properties
    if (character.setLOD && typeof character.setLOD === 'function') {
      character.setLOD(lod);
    } else {
      // Fallback if setLOD method doesn't exist
      character.useSimpleRendering = lod === 2;
      character.skipAnimations = lod >= 1;
      character.skipEffects = lod >= 1;
    }
    
    // Add to appropriate LOD group for rendering
    charactersByLOD[lod].push(character);
  }
  
  // Check if we can use GPU batching
  const useGPUBatching = gameState.gpuManager && 
                         gameState.gpuManager.isInitialized && 
                         CONFIG.PERFORMANCE && 
                         CONFIG.PERFORMANCE.BATCH_RENDERING;
  
  // Render each LOD group
  for (const lod in charactersByLOD) {
    const characters = charactersByLOD[lod];
    
    // Skip empty groups
    if (characters.length === 0) continue;
    
    // Try to use GPU batching for low-detail characters if available
    if (useGPUBatching && lod === '2' && characters.length > 5) {
      // Attempt to batch render low-detail characters
      if (gameState.gpuManager.batchEntity(characters, 'characters_low_detail')) {
        continue; // Successfully batched, skip individual rendering
      }
    }
    
    // Render each character individually
    for (const character of characters) {
      character.show();
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