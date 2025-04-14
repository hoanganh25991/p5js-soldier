// Skill Handlers Module
// Contains handlers for each skill activation

import { Wave } from '../entities/wave.js';
import { Clone } from '../entities/clone.js';
import { Turret } from '../entities/turret.js';
import { Airstrike } from '../entities/airstrike.js';
import { Laser } from '../entities/laser.js';
import { GameBoyAdvanced } from '../entities/gameBoyAdvanced.js';
import { SKILL_NAMES, SKILLS } from '../skills.js';
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
  const maxClones = SKILLS[SKILL_NAMES.CLONE].maxCount + (gameState.cloneMaxCountBonus || 0);
  if (gameState.clones.length > maxClones) {
    gameState.clones.shift(); // Remove oldest clone if too many
  }
}

/**
 * Handle Turret skill activation
 * @param {Object} gameState - The current game state
 */
export function handleTurretSkill(gameState) {
  // Create turret at random position around the player
  let turretAngle = random(TWO_PI);
  let turretRadius = 40;
  let turretX = gameState.player.x + cos(turretAngle) * turretRadius;
  let turretZ = gameState.player.z + sin(turretAngle) * turretRadius;
  gameState.turrets.push(new Turret(turretX, gameState.player.y, turretZ, gameState));
}

/**
 * Handle Airstrike skill activation
 * @param {Object} gameState - The current game state
 */
export function handleAirstrikeSkill(gameState) {
  gameState.airstrikes.push(new Airstrike(gameState));
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