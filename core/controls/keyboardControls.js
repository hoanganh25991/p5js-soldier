// Keyboard controls for the game
// Handles key presses and activates corresponding actions

import { SKILL_NAMES, SKILLS, isSkillAvailable, activateSkill, getSkillByKey } from '../skills.js';
import { Wave } from '../entities/wave.js';
import { Clone } from '../entities/clone.js';
import { Turret } from '../entities/turret.js';
import { Airstrike } from '../entities/airstrike.js';
import { Laser } from '../entities/laser.js';
import { GameBoyAdvanced } from '../entities/gameBoyAdvanced.js';
import CONFIG from '../config.js';

/**
 * Handle pause and menu navigation keys
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 * @returns {boolean} - True if the key was handled, false otherwise
 */
export function handleMenuKeys(gameState, key) {
  // Handle pause with Escape key or P
  if (key === 'Escape' || key === 'p' || key === 'P') {
    if (gameState.currentState === 'playing') {
      gameState.currentState = 'paused';
      select('#pause-menu').style('display', 'flex');
      noLoop();
    } else if (gameState.currentState === 'paused') {
      gameState.currentState = 'playing';
      select('#pause-menu').style('display', 'none');
      loop();
    } else if (gameState.currentState === 'levelUp') {
      // Return to previous state from level up screen
      gameState.currentState = gameState.previousState || 'playing';
      if (gameState.ui.levelUpScreen) {
        gameState.ui.levelUpScreen.style('display', 'none');
      }
      loop();
    }
    return true;
  }
  
  return false;
}

/**
 * Handle sound control keys
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 * @returns {boolean} - True if the key was handled, false otherwise
 */
export function handleSoundKeys(gameState, key) {
  // Handle mute with M key
  if (key === 'm' || key === 'M') {
    // Toggle mute state
    if (gameState.isMuted) {
      // Unmute
      gameState.masterVolume = gameState.previousVolume;
    } else {
      // Mute
      gameState.previousVolume = gameState.masterVolume || 0.5;
      gameState.masterVolume = 0;
    }
    
    // Update mute state
    gameState.isMuted = !gameState.isMuted;
    
    // Update all sound volumes
    if (gameState.shootSound) gameState.shootSound.setVolume(gameState.masterVolume);
    if (gameState.cloneSound) gameState.cloneSound.setVolume(gameState.masterVolume);
    if (gameState.spawnSound) gameState.spawnSound.setVolume(gameState.masterVolume);
    
    // Show message
    window.showCooldownMessage(gameState.isMuted ? "Sound Muted" : "Sound Unmuted", 0);
    
    return true;
  }
  
  return false;
}

/**
 * Handle skill activation keys
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 * @returns {boolean} - True if the key was handled, false otherwise
 */
export function handleSkillKeys(gameState, key) {
  // Only process skill keys in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Get skill by key press
  const skillName = getSkillByKey(key);
  
  // If a valid skill key was pressed
  if (skillName) {
    // Check if skill is available
    if (isSkillAvailable(gameState.skills, skillName)) {
      // Activate the skill
      activateSkill(gameState.skills, skillName, gameState.frameCount);
      
      // Also update legacy cooldowns for backward compatibility
      gameState.skillCooldowns[skillName] = SKILLS[skillName].cooldown;
      
      // Handle specific skill actions
      switch (skillName) {
        case SKILL_NAMES.CLONE:
          handleCloneSkill(gameState);
          break;
          
        case SKILL_NAMES.TURRET:
          handleTurretSkill(gameState);
          break;
          
        case SKILL_NAMES.AIRSTRIKE:
          handleAirstrikeSkill(gameState);
          break;
          
        case SKILL_NAMES.LASER:
          handleLaserSkill(gameState);
          break;
          
        case SKILL_NAMES.GBA:
          handleGBASkill(gameState);
          break;
          
        case SKILL_NAMES.GAS_LIGHTER:
          handleGasLighterSkill(gameState);
          break;
      }
    } else {
      // Show cooldown message
      const cooldown = gameState.skills[skillName].cooldownRemaining;
      window.showCooldownMessage(SKILLS[skillName].name, cooldown);
    }
    return true;
  }
  
  return false;
}

/**
 * Handle Clone skill activation
 * @param {Object} gameState - The current game state
 */
function handleCloneSkill(gameState) {
  // Create clone at random position around the player
  let cloneAngle = random(TWO_PI);
  let cloneRadius = 30;
  let cloneX = gameState.player.x + cos(cloneAngle) * cloneRadius;
  let cloneZ = gameState.player.z + sin(cloneAngle) * cloneRadius;
  gameState.clones.push(new Clone(cloneX, gameState.player.y, cloneZ, gameState));
  
  // Play woosh sound
  gameState.cloneSound.play();
  
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
function handleTurretSkill(gameState) {
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
function handleAirstrikeSkill(gameState) {
  gameState.airstrikes.push(new Airstrike(gameState));
}

/**
 * Handle Laser skill activation
 * @param {Object} gameState - The current game state
 */
function handleLaserSkill(gameState) {
  gameState.lasers.push(new Laser(gameState));
}

/**
 * Handle Game Boy Advanced skill activation
 * @param {Object} gameState - The current game state
 */
function handleGBASkill(gameState) {
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
  
  // Play throw sound
  if (gameState.throwSound) {
    gameState.throwSound.play();
  } else if (gameState.spawnSound) {
    // Fallback to spawn sound if throw sound doesn't exist
    gameState.spawnSound.play();
  }
}

/**
 * Handle Gas Lighter skill activation
 * @param {Object} gameState - The current game state
 */
function handleGasLighterSkill(gameState) {
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
    
    // Play throw sound
    if (gameState.throwSound) {
      gameState.throwSound.play();
    } else if (gameState.spawnSound) {
      // Fallback to spawn sound if throw sound doesn't exist
      gameState.spawnSound.play();
    }
  });
}

/**
 * Main keyboard event handler
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 */
export function handleKeyPressed(gameState, key) {
  // Try handling menu keys first
  if (handleMenuKeys(gameState, key)) {
    return;
  }
  
  // Try handling sound keys next
  if (handleSoundKeys(gameState, key)) {
    return;
  }
  
  // Finally try handling skill keys
  handleSkillKeys(gameState, key);
}