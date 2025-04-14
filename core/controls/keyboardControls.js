// Keyboard controls for the game
// Handles key presses and activates corresponding actions

import { togglePause, toggleMute, activateSkillByKey } from './controlsInterface.js';

/**
 * Main keyboard event handler
 * @param {Object} gameState - The current game state
 * @param {string} key - The key that was pressed
 */
export function handleKeyPressed(gameState, key) {
  // Handle pause with Escape key or P
  if (key === 'Escape' || key === 'p' || key === 'P') {
    togglePause(gameState);
    return;
  }
  
  // Handle mute with M key
  if (key === 'm' || key === 'M') {
    toggleMute(gameState);
    return;
  }
  
  // Try handling skill keys
  activateSkillByKey(gameState, key);
}