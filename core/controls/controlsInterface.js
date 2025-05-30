// Controls Interface Module
// Provides a common interface for all input methods (keyboard, mouse, touch)

import { SKILLS, isSkillAvailable, activateSkill, getSkillByKey } from '../skills.js';
import { SKILL_IDS } from '../../config/skills.js';
import { handleCloneSkill, handleTurretSkill, handleAirstrikeSkill, handleLaserSkill, handleGBASkill, handleGasLighterSkill } from './skillHandlers.js';

/**
 * Handle pause and menu navigation
 * @param {Object} gameState - The current game state
 * @returns {boolean} - True if the action was handled, false otherwise
 */
export function togglePause(gameState) {
  if (gameState.currentState === 'playing') {
    gameState.currentState = 'paused';
    select('#pause-menu').style('display', 'flex');
    noLoop();
    return true;
  } else if (gameState.currentState === 'paused') {
    gameState.currentState = 'playing';
    select('#pause-menu').style('display', 'none');
    loop();
    return true;
  } else if (gameState.currentState === 'levelUp') {
    // Return to previous state from level up screen
    gameState.currentState = gameState.previousState || 'playing';
    if (gameState.ui.levelUpScreen) {
      gameState.ui.levelUpScreen.style('display', 'none');
    }
    loop();
    return true;
  }
  
  return false;
}

/**
 * Toggle sound mute state
 * @param {Object} gameState - The current game state
 * @returns {boolean} - True if the action was handled, false otherwise
 */
export function toggleMute(gameState) {
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
  
  // Update all sound volumes through the sound manager
  gameState.soundManager.setMasterVolume(gameState.masterVolume);
  
  // Show message
  window.showMessage(gameState.isMuted ? "Sound Muted" : "Sound Unmuted", 0);
  
  return true;
}

/**
 * Activate a skill by name
 * @param {Object} gameState - The current game state
 * @param {string} skillName - The name of the skill to activate
 * @returns {boolean} - True if the skill was activated, false otherwise
 */
export function activateSkillByName(gameState, skillName) {
  // Only process skill activation in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Check if skill is available
  if (isSkillAvailable(gameState.skills, skillName)) {
    // Activate the skill
    activateSkill(gameState.skills, skillName, gameState.frameCount);
    
    // Also update legacy cooldowns for backward compatibility
    gameState.skillCooldowns[skillName] = SKILLS[skillName].cooldown;
    
    // Handle specific skill actions
    switch (skillName) {
      case SKILL_IDS.CLONE:
        handleCloneSkill(gameState);
        break;
        
      case SKILL_IDS.TURRET:
        handleTurretSkill(gameState);
        break;
        
      case SKILL_IDS.AIRSTRIKE:
        handleAirstrikeSkill(gameState);
        break;
        
      case SKILL_IDS.LASER:
        handleLaserSkill(gameState);
        break;
        
      case SKILL_IDS.GBA:
        handleGBASkill(gameState);
        break;
        
      case SKILL_IDS.GAS_LIGHTER:
        handleGasLighterSkill(gameState);
        break;
    }
    
    return true;
  } else {
    // Show cooldown message
    // const cooldown = gameState.skills[skillName].cooldownRemaining;
    // window.showMessage(SKILLS[skillName].name, cooldown);
    return false;
  }
}

/**
 * Activate a skill by key
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 * @returns {boolean} - True if the skill was activated, false otherwise
 */
export function activateSkillByKey(gameState, key) {
  // Get skill by key press
  const skillName = getSkillByKey(key);
  
  // If a valid skill key was pressed
  if (skillName) {
    return activateSkillByName(gameState, skillName);
  }
  
  return false;
}

/**
 * Utility function to check if device is in landscape orientation
 * @returns {boolean} True if the device is in landscape orientation
 */
export function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

/**
 * Utility function to check if the device supports touch input
 * @returns {boolean} True if the device supports touch input
 */
export function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}