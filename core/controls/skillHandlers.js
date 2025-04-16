// Skill Handlers Module
// Contains handlers for each skill activation

import { Wave } from '../entities/wave.js';
import { Clone } from '../entities/clone.js';
import { Turret } from '../entities/turret.js';
import { Airstrike } from '../entities/airstrike.js';
import { Laser } from '../entities/laser.js';
import { GameBoyAdvanced } from '../entities/gameBoyAdvanced.js';
import { SKILLS } from '../skills.js';
import { SKILL_IDS } from '../../config/skills.js';
import CONFIG from '../../config.js';

/**
 * Handle Clone skill activation
 * @param {Object} gameState - The current game state
 */
export function handleCloneSkill(gameState) {
  // Create clone at random position around the player
  let cloneAngle = random(TWO_PI);
  let cloneRadius = 30;
  let cloneX = gameState.player.x + cos(cloneAngle) * cloneRadius;
  let cloneZ = gameState.player.z + sin(cloneAngle) * cloneRadius;
  gameState.clones.push(new Clone(cloneX, gameState.player.y, cloneZ, gameState));
  
  // Play clone sound with sound manager
  gameState.soundManager.play('clone', {
    priority: gameState.soundManager.PRIORITY.HIGH,
    sourceType: 'skill',
    sourceId: 'clone'
  });
  
  // Optional: Limit max number of clones to avoid overwhelming
  const maxClones = SKILLS[SKILL_IDS.CLONE].maxCount + (gameState.cloneMaxCountBonus || 0);
  if (gameState.clones.length > maxClones) {
    gameState.clones.shift(); // Remove oldest clone if too many
  }
}

/**
 * Handle Turret skill activation
 * @param {Object} gameState - The current game state
 */
export function handleTurretSkill(gameState) {
  // Throw a turret in the direction the player is facing
  const playerAngle = gameState.player.rotation;
  
  // Calculate a random throw distance within the configured range
  const minDistance = CONFIG.TURRET.THROW_DISTANCE * 0.5; // Minimum 50% of max distance
  const maxDistance = CONFIG.TURRET.THROW_DISTANCE;
  const throwDistance = random(minDistance, maxDistance);
  
  // Calculate a random angle deviation to make throws less predictable
  const angleDeviation = random(-PI/6, PI/6); // +/- 30 degrees
  const throwAngle = playerAngle + angleDeviation;
  
  // Create the turret object with throw properties
  const turret = new Turret(
    gameState.player.x,
    gameState.player.y - 50, // Start higher above player for better visibility
    gameState.player.z,
    throwAngle,
    CONFIG.TURRET.THROW_SPEED * random(0.8, 1.2), // Slightly less speed variation
    throwDistance * 0.5, // Reduce throw distance to keep it more visible
    gameState
  );
  
  // Add to game state
  gameState.turrets.push(turret);
  
  // Create throw effect
  if (gameState.waves) {
    // Create a small wave at the throw position
    const throwWave = new Wave(
      gameState.player.x, 
      gameState.player.y - 20, // Start slightly above player
      gameState.player.z, 
      50, // Small initial radius
      [100, 100, 255, 150] // Blue for turret
    );
    throwWave.growthRate = 5;
    throwWave.maxRadius = 100;
    gameState.waves.push(throwWave);
    
    // Add a trail effect behind the turret
    for (let i = 0; i < 5; i++) {
      const trailDelay = i * 3; // Frames of delay
      
      // Schedule a delayed trail particle
      setTimeout(() => {
        if (gameState.waves) {
          const trailX = gameState.player.x + cos(throwAngle) * (i * 20);
          const trailY = gameState.player.y - 20 - i * 2; // Arc upward
          const trailZ = gameState.player.z + sin(throwAngle) * (i * 20);
          
          const trailWave = new Wave(
            trailX,
            trailY,
            trailZ,
            20, // Small radius
            [100, 100, 255, 100 - i * 15] // Fading blue
          );
          trailWave.growthRate = 3;
          trailWave.maxRadius = 40;
          trailWave.lifespan = 15;
          gameState.waves.push(trailWave);
        }
      }, trailDelay * 16); // 16ms per frame
    }
  }
  
  // Play throw sound using sound manager
  gameState.soundManager.play('spawn', {
    priority: gameState.soundManager.PRIORITY.MEDIUM,
    sourceType: 'skill',
    sourceId: 'turret'
  });
}

/**
 * Handle Airstrike skill activation
 * @param {Object} gameState - The current game state
 */
export function handleAirstrikeSkill(gameState) {
  // Find enemies to target
  const enemies = gameState.enemyController ? gameState.enemyController.getEnemies() : [];
  
  // If no enemies, use default behavior
  if (enemies.length === 0) {
    gameState.airstrikes.push(new Airstrike(gameState));
    return;
  }
  
  // Choose a random enemy to target
  const targetEnemy = enemies[Math.floor(random(enemies.length))];
  
  // Calculate a random starting position on the edge of the screen
  // We'll use a random angle and place the airstrike at the edge
  const startAngle = random(TWO_PI);
  const distanceFromCenter = 1000; // Far enough to be off-screen
  
  // Calculate start position
  const startX = cos(startAngle) * distanceFromCenter;
  const startZ = sin(startAngle) * distanceFromCenter;
  
  // Calculate direction vector towards the enemy
  const directionX = targetEnemy.x - startX;
  const directionZ = targetEnemy.z - startZ;
  
  // Normalize the direction vector
  const length = sqrt(directionX * directionX + directionZ * directionZ);
  const normalizedDirX = directionX / length;
  const normalizedDirZ = directionZ / length;
  
  // Create the airstrike with the calculated parameters
  const airstrike = new Airstrike(gameState, startX, startZ, normalizedDirX, normalizedDirZ);
  gameState.airstrikes.push(airstrike);
}

/**
 * Handle Laser skill activation
 * @param {Object} gameState - The current game state
 */
export function handleLaserSkill(gameState) {
  gameState.lasers.push(new Laser(gameState));
}

/**
 * Handle Game Boy Advanced skill activation
 * @param {Object} gameState - The current game state
 */
export function handleGBASkill(gameState) {
  // Throw a GBA in the direction the player is facing
  const playerAngle = gameState.player.rotation;
  
  // Calculate a random throw distance within the configured range
  const minDistance = CONFIG.GBA.THROW_DISTANCE * 0.5; // Minimum 50% of max distance
  const maxDistance = CONFIG.GBA.THROW_DISTANCE;
  const throwDistance = random(minDistance, maxDistance);
  
  // Calculate a random angle deviation to make throws less predictable
  const angleDeviation = random(-PI/6, PI/6); // +/- 30 degrees
  const throwAngle = playerAngle + angleDeviation;
  
  // Create the GBA object with random properties
  const gba = new GameBoyAdvanced(
    gameState.player.x,
    gameState.player.y - 20, // Start slightly above player
    gameState.player.z,
    throwAngle,
    CONFIG.GBA.THROW_SPEED * random(0.8, 1.5), // Random speed variation
    throwDistance,
    gameState
  );
  
  // Add to game state
  gameState.gbas.push(gba);
  
  // Create throw effect
  if (gameState.waves) {
    // Create a small wave at the throw position
    const throwWave = new Wave(
      gameState.player.x, 
      gameState.player.y - 20, // Start slightly above player
      gameState.player.z, 
      50, // Small initial radius
      [180, 50, 180, 150] // Purple for GBA
    );
    throwWave.growthRate = 5;
    throwWave.maxRadius = 100;
    gameState.waves.push(throwWave);
    
    // Add a trail effect behind the GBA
    for (let i = 0; i < 5; i++) {
      const trailDelay = i * 3; // Frames of delay
      
      // Schedule a delayed trail particle
      setTimeout(() => {
        if (gameState.waves) {
          const trailX = gameState.player.x + cos(throwAngle) * (i * 20);
          const trailY = gameState.player.y - 20 - i * 2; // Arc upward
          const trailZ = gameState.player.z + sin(throwAngle) * (i * 20);
          
          const trailWave = new Wave(
            trailX,
            trailY,
            trailZ,
            20, // Small radius
            [180, 50, 180, 100 - i * 15] // Fading purple
          );
          trailWave.growthRate = 3;
          trailWave.maxRadius = 40;
          trailWave.lifespan = 15;
          gameState.waves.push(trailWave);
        }
      }, trailDelay * 16); // 16ms per frame
    }
  }
  
  // Play throw sound using sound manager
  gameState.soundManager.play('spawn', {
    priority: gameState.soundManager.PRIORITY.MEDIUM,
    sourceType: 'skill',
    sourceId: 'gba'
  });
}

/**
 * Handle Gas Lighter skill activation
 * @param {Object} gameState - The current game state
 */
export function handleGasLighterSkill(gameState) {
  // Throw a Gas Lighter in the direction the player is facing
  const gasLighterPlayerAngle = gameState.player.rotation;
  
  // Calculate a random throw distance within the configured range
  const gasLighterMinDistance = CONFIG.GAS_LIGHTER.THROW_DISTANCE * 0.5; // Minimum 50% of max distance
  const gasLighterMaxDistance = CONFIG.GAS_LIGHTER.THROW_DISTANCE;
  const gasLighterThrowDistance = random(gasLighterMinDistance, gasLighterMaxDistance);
  
  // Calculate a random angle deviation to make throws less predictable
  const gasLighterAngleDeviation = random(-PI/6, PI/6); // +/- 30 degrees
  const gasLighterThrowAngle = gasLighterPlayerAngle + gasLighterAngleDeviation;
  
  // Initialize gasLighters array if it doesn't exist
  if (!gameState.gasLighters) {
    gameState.gasLighters = [];
  }
  
  // Import the GasLighter class if needed
  import('../entities/gasLighter.js').then(module => {
    const GasLighter = module.GasLighter;
    
    // Create the Gas Lighter object with random properties
    const gasLighter = new GasLighter(
      gameState.player.x,
      gameState.player.y - 20, // Start slightly above player
      gameState.player.z,
      gasLighterThrowAngle,
      CONFIG.GAS_LIGHTER.THROW_SPEED * random(0.8, 1.5), // Random speed variation
      gasLighterThrowDistance,
      gameState
    );
    
    // Add to game state
    gameState.gasLighters.push(gasLighter);
    
    // Create throw effect
    if (gameState.waves) {
      // Create a small wave at the throw position
      const throwWave = new Wave(
        gameState.player.x, 
        gameState.player.y - 20, // Start slightly above player
        gameState.player.z, 
        50, // Small initial radius
        [255, 100, 0, 150] // Orange for Gas Lighter
      );
      throwWave.growthRate = 5;
      throwWave.maxRadius = 100;
      gameState.waves.push(throwWave);
      
      // Add a trail effect behind the Gas Lighter
      for (let i = 0; i < 5; i++) {
        const trailDelay = i * 3; // Frames of delay
        
        // Schedule a delayed trail particle
        setTimeout(() => {
          if (gameState.waves) {
            const trailX = gameState.player.x + cos(gasLighterThrowAngle) * (i * 20);
            const trailY = gameState.player.y - 20 - i * 2; // Arc upward
            const trailZ = gameState.player.z + sin(gasLighterThrowAngle) * (i * 20);
            
            const trailWave = new Wave(
              trailX,
              trailY,
              trailZ,
              20, // Small radius
              [255, 100, 0, 100 - i * 15] // Fading orange
            );
            trailWave.growthRate = 3;
            trailWave.maxRadius = 40;
            trailWave.lifespan = 15;
            gameState.waves.push(trailWave);
          }
        }, trailDelay * 16); // 16ms per frame
      }
    }
    
    // Play throw sound using sound manager
    gameState.soundManager.play('spawn', {
      priority: gameState.soundManager.PRIORITY.MEDIUM,
      sourceType: 'skill',
      sourceId: 'gas-lighter'
    });
  });
}