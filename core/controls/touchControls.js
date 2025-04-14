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
  
  // Add CSS for larger touch areas once
  if (!document.getElementById('touch-area-style')) {
    const touchAreaStyle = document.createElement('style');
    touchAreaStyle.id = 'touch-area-style';
    touchAreaStyle.textContent = `
      .touch-area::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        right: -50%;
        bottom: -50%;
        z-index: 1;
      }
    `;
    document.head.appendChild(touchAreaStyle);
  }

  // Create main container for virtual touch keys
  const virtualTouchKeys = createElement('div');
  virtualTouchKeys.id('virtual-touch-keys');
  virtualTouchKeys.style('position', 'fixed');
  
  // Position differently based on orientation
  const isLandscapeMode = isLandscape();
  if (isLandscapeMode) {
    // In landscape, keep at bottom right
    virtualTouchKeys.style('right', '20px');
    virtualTouchKeys.style('bottom', '20px');
  } else {
    // In portrait, position closer to the center-bottom for easier thumb reach
    virtualTouchKeys.style('right', '50%');
    virtualTouchKeys.style('transform', 'translateX(50%)'); // Center horizontally
    virtualTouchKeys.style('bottom', '40px'); // Slightly higher from bottom
  }
  
  virtualTouchKeys.style('display', 'flex');
  virtualTouchKeys.style('flex-direction', 'column');
  virtualTouchKeys.style('gap', getButtonSizeForOrientation().rowGap);
  virtualTouchKeys.style('z-index', '100');
  // Prevent text selection and double-tap zoom
  virtualTouchKeys.style('user-select', 'none');
  virtualTouchKeys.style('-webkit-user-select', 'none');
  virtualTouchKeys.style('-moz-user-select', 'none');
  virtualTouchKeys.style('-ms-user-select', 'none');
  virtualTouchKeys.style('touch-action', 'manipulation');
  
  // Store orientation state
  virtualTouchKeys.attribute('data-orientation', isLandscape() ? 'landscape' : 'portrait');

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
  
  // Get size based on current orientation
  const sizeConfig = getButtonSizeForOrientation();
  
  for (let i = 0; i < rows; i++) {
    // Create a row container
    const row = createElement('div');
    row.class('touch-key-row');
    row.style('display', 'flex');
    row.style('gap', sizeConfig.gap);
    row.style('justify-content', 'flex-end'); // Align to the right
    
    // Get skills for this row
    const rowSkills = skillEntries.slice(i * keysPerRow, (i + 1) * keysPerRow);
    
    // Create buttons for this row
    rowSkills.forEach(skill => {
      // Create a wrapper div with larger touch area
      const buttonWrapper = createElement('div');
      buttonWrapper.class('touch-key-wrapper');
      
      // Calculate larger touch area dimensions (50% larger than visible button)
      const touchWidth = parseInt(sizeConfig.width) * 1.5 + 'px';
      const touchHeight = parseInt(sizeConfig.height) * 1.5 + 'px';
      
      // Style the wrapper to have a larger touch area but be visually transparent
      // Use the same dimensions as the button to avoid adding extra padding
      buttonWrapper.style('width', sizeConfig.width);
      buttonWrapper.style('height', sizeConfig.height);
      buttonWrapper.style('position', 'relative');
      buttonWrapper.style('display', 'flex');
      buttonWrapper.style('align-items', 'center');
      buttonWrapper.style('justify-content', 'center');
      buttonWrapper.style('touch-action', 'manipulation');
      
      // Create the visible button inside the wrapper
      const keyButton = createElement('button', skill.key);
      keyButton.class('touch-key');
      keyButton.attribute('data-skill', skill.skillName);
      keyButton.attribute('title', skill.name);
      
      // Style the button based on orientation
      keyButton.style('width', sizeConfig.width);
      keyButton.style('height', sizeConfig.height);
      keyButton.style('border-radius', '50%');
      keyButton.style('background', 'rgba(0, 0, 0, 0.7)');
      keyButton.style('color', 'white');
      keyButton.style('border', '2px solid white');
      keyButton.style('font-size', sizeConfig.fontSize);
      keyButton.style('font-weight', 'bold');
      keyButton.style('cursor', 'pointer');
      keyButton.style('display', 'flex');
      keyButton.style('align-items', 'center');
      keyButton.style('justify-content', 'center');
      keyButton.style('user-select', 'none');
      keyButton.style('position', 'relative');
      keyButton.style('touch-action', 'manipulation');
      
      // Add a pseudo-element for larger touch area without affecting layout
      const buttonElement = keyButton.elt;
      buttonElement.style.position = 'relative';
      
      // Add the touch-area class to the button
      keyButton.class('touch-key touch-area');
      
      // Add the button to the wrapper
      buttonWrapper.child(keyButton);
      
      // Handle touch events directly on the button
      buttonElement.addEventListener('touchstart', function(e) {
        e.preventDefault();
        
        // Check if the skill is on cooldown
        if (keyButton.attribute('disabled')) {
          return; // Don't process touch events when disabled
        }
        
        // Simulate key press by calling the same handler used for keyboard
        window.gameState && handleKeyPressed(window.gameState, skill.key);
        
        // Visual feedback on the button
        keyButton.style('background', 'rgba(255, 255, 255, 0.7)');
        keyButton.style('color', 'black');
        
        // Reset button style after a short delay
        setTimeout(() => {
          keyButton.style('background', 'rgba(0, 0, 0, 0.7)');
          keyButton.style('color', 'white');
        }, 100);
      }, { passive: false });
      
      // Also prevent default on touchend to be thorough
      buttonElement.addEventListener('touchend', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      // Keep the mouse event for desktop testing
      keyButton.mousePressed(() => {
        // Check if the skill is on cooldown
        if (keyButton.attribute('disabled')) {
          return; // Don't process mouse events when disabled
        }
        
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
      
      row.child(buttonWrapper);
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
  return true;
  // return (('ontouchstart' in window) ||
  //    (navigator.maxTouchPoints > 0) ||
  //    (navigator.msMaxTouchPoints > 0));
}

/**
 * Check if the device is in landscape orientation
 * @returns {boolean} True if the device is in landscape orientation
 */
function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

/**
 * Get the appropriate button size based on orientation
 * @returns {Object} Object containing width, height, fontSize, and gap values
 */
function getButtonSizeForOrientation() {
  const isLandscapeMode = isLandscape();
  
  if (isLandscapeMode) {
    // Landscape mode - smaller buttons (1/2 size)
    return {
      width: '40px',
      height: '40px',
      fontSize: '18px',
      gap: '8px',
      rowGap: '8px'
    };
  } else {
    // Portrait mode - larger buttons (2x size)
    return {
      width: '100px',
      height: '100px',
      fontSize: '32px',
      gap: '15px',
      rowGap: '15px'
    };
  }
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
    
    // Add orientation change listener
    window.addEventListener('resize', () => {
      updateTouchControlsForOrientation(gameState);
    });
  }
  
  // Add global touch handlers to prevent unwanted zooming and text selection
  setupGlobalTouchHandlers();
}

/**
 * Update touch controls when orientation changes
 * @param {Object} gameState - The current game state
 */
function updateTouchControlsForOrientation(gameState) {
  if (!gameState || !gameState.ui || !gameState.ui.touchKeys) return;
  
  const touchKeys = gameState.ui.touchKeys;
  const currentOrientation = touchKeys.attribute('data-orientation');
  const newOrientation = isLandscape() ? 'landscape' : 'portrait';
  
  // Only update if orientation has changed
  if (currentOrientation !== newOrientation) {
    // Update orientation attribute
    touchKeys.attribute('data-orientation', newOrientation);
    
    // Get new size configuration
    const sizeConfig = getButtonSizeForOrientation();
    
    // Update position based on new orientation
    if (newOrientation === 'landscape') {
      // In landscape, position at bottom right
      touchKeys.style('right', '20px');
      touchKeys.style('bottom', '20px');
      touchKeys.style('transform', 'none'); // Remove any transform
    } else {
      // In portrait, position closer to center-bottom for easier thumb reach
      touchKeys.style('right', '50%');
      touchKeys.style('transform', 'translateX(50%)'); // Center horizontally
      touchKeys.style('bottom', '40px'); // Slightly higher from bottom
    }
    
    // Update container gap
    touchKeys.style('gap', sizeConfig.rowGap);
    
    // Update all rows
    selectAll('.touch-key-row').forEach(row => {
      row.style('gap', sizeConfig.gap);
    });
    
    // Update all buttons
    selectAll('.touch-key').forEach(button => {
      button.style('width', sizeConfig.width);
      button.style('height', sizeConfig.height);
      button.style('font-size', sizeConfig.fontSize);
    });
  }
}

/**
 * Set up global touch handlers to prevent unwanted behaviors on mobile
 */
function setupGlobalTouchHandlers() {
  // Get the canvas element
  const canvas = document.querySelector('canvas');
  if (canvas) {
    // Prevent default touch actions on canvas
    canvas.addEventListener('touchstart', function(e) {
      // Allow default for game mechanics that need it
      // but prevent double-tap zoom
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', function(e) {
      // Prevent text selection and other unwanted behaviors
      if (e.touches.length === 0) {
        e.preventDefault();
      }
    }, { passive: false });
  }
  
  // Prevent double-tap zoom on document
  document.addEventListener('touchstart', function(e) {
    // Only prevent default if it's not on an interactive element
    const target = e.target;
    if (target.tagName !== 'BUTTON' && 
        target.tagName !== 'INPUT' && 
        target.tagName !== 'SELECT' && 
        target.tagName !== 'TEXTAREA') {
      // Use a timer to detect double taps
      const now = Date.now();
      const timeSince = now - (this.lastTouch || 0);
      if (timeSince < 300) {
        // Double tap detected
        e.preventDefault();
      }
      this.lastTouch = now;
    }
  }, { passive: false });
}