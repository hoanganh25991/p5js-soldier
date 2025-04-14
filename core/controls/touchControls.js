// Touch Controls for the game
// Handles touch input and displays virtual keys for mobile devices

import { SKILLS, SKILL_KEYS, SKILL_NAMES } from '../skills.js';
import { handleKeyPressed } from './keyboardControls.js';

/**
 * Create virtual touch keys for mobile devices
 * @returns {Object} The virtual touch keys DOM element
 */
export function createVirtualTouchKeys() {
  // Only create virtual keys on touch devices
  if (!isTouchDevice()) {
    return null;
  }

  // Create main container for virtual touch keys
  const virtualTouchKeys = createElement('div');
  virtualTouchKeys.id('virtual-touch-keys');
  virtualTouchKeys.style('position', 'fixed');
  virtualTouchKeys.style('right', '20px');
  virtualTouchKeys.style('bottom', '20px');
  virtualTouchKeys.style('display', 'flex');
  virtualTouchKeys.style('flex-direction', 'column');
  virtualTouchKeys.style('gap', '10px');
  virtualTouchKeys.style('z-index', '100');

  // Get all skills and their keys
  const skillEntries = Object.entries(SKILLS).map(([skillName, skillData]) => {
    return {
      key: skillData.key.toUpperCase(),
      name: skillData.name,
      skillName
    };
  });

  // Create rows with 4 keys per row
  const keysPerRow = 4;
  const rows = Math.ceil(skillEntries.length / keysPerRow);
  
  for (let i = 0; i < rows; i++) {
    // Create a row container
    const row = createElement('div');
    row.class('touch-key-row');
    row.style('display', 'flex');
    row.style('gap', '10px');
    row.style('justify-content', 'flex-end'); // Align to the right
    
    // Get skills for this row
    const rowSkills = skillEntries.slice(i * keysPerRow, (i + 1) * keysPerRow);
    
    // Create buttons for this row
    rowSkills.forEach(skill => {
      const keyButton = createElement('button', skill.key);
      keyButton.class('touch-key');
      keyButton.attribute('data-skill', skill.skillName);
      keyButton.attribute('title', skill.name);
      
      // Style the button
      keyButton.style('width', '50px');
      keyButton.style('height', '50px');
      keyButton.style('border-radius', '50%');
      keyButton.style('background', 'rgba(0, 0, 0, 0.7)');
      keyButton.style('color', 'white');
      keyButton.style('border', '2px solid white');
      keyButton.style('font-size', '20px');
      keyButton.style('font-weight', 'bold');
      keyButton.style('cursor', 'pointer');
      keyButton.style('display', 'flex');
      keyButton.style('align-items', 'center');
      keyButton.style('justify-content', 'center');
      keyButton.style('user-select', 'none');
      keyButton.style('touch-action', 'manipulation');
      
      // Add touch/click event
      keyButton.mousePressed(() => {
        // Simulate key press by calling the same handler used for keyboard
        window.gameState && handleKeyPressed(window.gameState, skill.key);
        
        // Visual feedback
        keyButton.style('background', 'rgba(255, 255, 255, 0.7)');
        keyButton.style('color', 'black');
        
        // Reset button style after a short delay
        setTimeout(() => {
          keyButton.style('background', 'rgba(0, 0, 0, 0.7)');
          keyButton.style('color', 'white');
        }, 100);
      });
      
      row.child(keyButton);
    });
    
    virtualTouchKeys.child(row);
  }

  return virtualTouchKeys;
}

/**
 * Update the virtual touch keys to reflect skill cooldowns
 * @param {Object} gameState - The current game state
 */
export function updateVirtualTouchKeys(gameState) {
  if (!gameState || !gameState.skills) return;
  
  // Get all virtual key buttons
  const keyButtons = selectAll('.touch-key');
  
  keyButtons.forEach(button => {
    const skillName = button.attribute('data-skill');
    
    if (skillName && gameState.skills[skillName]) {
      const cooldown = gameState.skills[skillName].cooldownRemaining;
      
      if (cooldown > 0) {
        // Skill is on cooldown
        button.style('opacity', '0.5');
        button.attribute('disabled', '');
        
        // Optional: Show cooldown timer on the button
        if (cooldown >= 1) {
          button.html(Math.ceil(cooldown));
        }
      } else {
        // Skill is available
        button.style('opacity', '1');
        button.removeAttribute('disabled');
        button.html(button.attribute('data-skill') ? SKILLS[button.attribute('data-skill')].key.toUpperCase() : '');
      }
    }
  });
}

/**
 * Check if the device supports touch
 * @returns {boolean} True if the device supports touch
 */
function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}

/**
 * Add special touch controls for movement and actions
 * This can be expanded to add virtual joysticks or other touch controls
 * @param {Object} gameState - The current game state
 */
export function setupTouchControls(gameState) {
  if (!isTouchDevice()) return;
  
  // Create and add virtual touch keys to the DOM
  const touchKeys = createVirtualTouchKeys();
  if (touchKeys) {
    // Store reference in game state for updates
    gameState.ui = gameState.ui || {};
    gameState.ui.touchKeys = touchKeys;
  }
}