// Virtual Keyboard UI Component
// Displays touch-friendly skill buttons on the right side of the screen for mobile devices

import { SKILLS, SKILL_KEYS, SKILL_NAMES } from '../skills.js';
import { handleKeyPressed } from '../controls/keyboardControls.js';

/**
 * Create a virtual keyboard for touch devices
 * @returns {Object} The virtual keyboard DOM element
 */
export function createVirtualKeyboard() {
  // Only create virtual keyboard on touch devices
  if (!isTouchDevice()) {
    return null;
  }

  // Create main container for virtual keyboard
  const virtualKeyboard = createElement('div');
  virtualKeyboard.id('virtual-keyboard');
  virtualKeyboard.style('position', 'fixed');
  virtualKeyboard.style('right', '20px');
  virtualKeyboard.style('top', '50%');
  virtualKeyboard.style('transform', 'translateY(-50%)');
  virtualKeyboard.style('display', 'flex');
  virtualKeyboard.style('flex-direction', 'column');
  virtualKeyboard.style('gap', '10px');
  virtualKeyboard.style('z-index', '100');

  // Get all skills and their keys
  const skillEntries = Object.entries(SKILLS).map(([skillName, skillData]) => {
    return {
      key: skillData.key.toUpperCase(),
      name: skillData.name,
      skillName
    };
  });

  // Create a button for each skill
  skillEntries.forEach(skill => {
    const keyButton = createElement('button', skill.key);
    keyButton.class('virtual-key');
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
    
    virtualKeyboard.child(keyButton);
  });

  return virtualKeyboard;
}

/**
 * Update the virtual keyboard to reflect skill cooldowns
 * @param {Object} gameState - The current game state
 */
export function updateVirtualKeyboard(gameState) {
  if (!gameState || !gameState.skills) return;
  
  // Get all virtual key buttons
  const keyButtons = selectAll('.virtual-key');
  
  keyButtons.forEach(button => {
    const skillName = button.attribute('data-skill');
    
    if (skillName && gameState.skills[skillName]) {
      const cooldown = gameState.skills[skillName].cooldownRemaining;
      
      if (cooldown > 0) {
        // Skill is on cooldown
        button.style('opacity', '0.5');
        button.attribute('disabled', '');
      } else {
        // Skill is available
        button.style('opacity', '1');
        button.removeAttribute('disabled');
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