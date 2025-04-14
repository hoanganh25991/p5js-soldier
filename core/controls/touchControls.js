// Touch Controls for the game
// Handles touch input and displays virtual keys for mobile devices

import { SKILLS } from '../skills.js';
import { activateSkillByName, isLandscape } from './controlsInterface.js';

/**
 * Create virtual touch keys for mobile devices
 * @returns {Object} The virtual touch keys DOM element
 */
export function createVirtualTouchKeys() {
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
  virtualTouchKeys.style('right', '20px');
  virtualTouchKeys.style('bottom', '20px');
  virtualTouchKeys.style('display', 'flex');
  virtualTouchKeys.style('flex-direction', 'column');
  virtualTouchKeys.style('gap', getButtonSizeForOrientation().rowGap);
  virtualTouchKeys.style('z-index', '100');
  virtualTouchKeys.style('user-select', 'none');
  virtualTouchKeys.style('-webkit-user-select', 'none');
  virtualTouchKeys.style('-moz-user-select', 'none');
  virtualTouchKeys.style('-ms-user-select', 'none');
  virtualTouchKeys.style('touch-action', 'manipulation');
  
  // Store orientation state
  virtualTouchKeys.attribute('data-orientation', isLandscape() ? 'landscape' : 'portrait');

  // Get all skills and their keys
  const skillEntries = Object.entries(SKILLS).map(([skillName, skillData], index) => {
    return {
      key: skillData.key.toUpperCase(),
      name: skillData.name,
      skillName,
      index // Store the index for color generation
    };
  });

  // Create rows with 4 keys per row
  const keysPerRow = 4;
  const rows = Math.ceil(skillEntries.length / keysPerRow);
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
      
      // Style the wrapper
      buttonWrapper.style('width', sizeConfig.width);
      buttonWrapper.style('height', sizeConfig.height);
      buttonWrapper.style('position', 'relative');
      buttonWrapper.style('display', 'flex');
      buttonWrapper.style('align-items', 'center');
      buttonWrapper.style('justify-content', 'center');
      buttonWrapper.style('touch-action', 'manipulation');
      
      // Create the visible button inside the wrapper
      const keyButton = createElement('button', skill.key);
      keyButton.class('touch-key touch-area');
      keyButton.attribute('data-skill', skill.skillName);
      keyButton.attribute('title', skill.name);
      
      // Get dynamic color based on skill index
      const skillColor = generateSkillColor(skill.index);
      
      // Style the button
      keyButton.style('width', sizeConfig.width);
      keyButton.style('height', sizeConfig.height);
      keyButton.style('border-radius', '50%');
      keyButton.style('background', skillColor.bg);
      keyButton.style('color', 'white');
      keyButton.style('border', `2px solid ${skillColor.border}`);
      keyButton.style('font-size', sizeConfig.fontSize);
      keyButton.style('font-weight', 'bold');
      keyButton.style('cursor', 'pointer');
      keyButton.style('display', 'flex');
      keyButton.style('align-items', 'center');
      keyButton.style('justify-content', 'center');
      keyButton.style('user-select', 'none');
      keyButton.style('position', 'relative');
      keyButton.style('touch-action', 'manipulation');
      
      // Add the button to the wrapper
      buttonWrapper.child(keyButton);
      
      // Handle touch events
      const buttonElement = keyButton.elt;
      buttonElement.addEventListener('touchstart', function(e) {
        e.preventDefault();
        
        // Check if the skill is on cooldown
        if (keyButton.attribute('disabled')) {
          return; // Don't process touch events when disabled
        }
        
        // Activate skill directly using the common interface
        window.gameState && activateSkillByName(window.gameState, skill.skillName);
        
        // Visual feedback - brighten the button using dynamic colors
        const highlightColor = generateSkillColor(skill.index, true);
        
        keyButton.style('background', highlightColor.bg);
        keyButton.style('color', 'black');
        
        // Reset button style after a short delay
        setTimeout(() => {
          // Get the original color back from the dynamic color generator
          const originalColor = generateSkillColor(skill.index);
          
          keyButton.style('background', originalColor.bg);
          keyButton.style('color', 'white');
        }, 100);
      }, { passive: false });
      
      // Prevent default on touchend
      buttonElement.addEventListener('touchend', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      // Mouse event for desktop testing
      keyButton.mousePressed(() => {
        if (keyButton.attribute('disabled')) return;
        
        window.gameState && activateSkillByName(window.gameState, skill.skillName);
        
        // Visual feedback - brighten the button using dynamic colors
        const highlightColor = generateSkillColor(skill.index, true);
        
        keyButton.style('background', highlightColor.bg);
        keyButton.style('color', 'black');
        
        // Reset button style after a short delay
        setTimeout(() => {
          // Get the original color back from the dynamic color generator
          const originalColor = generateSkillColor(skill.index);
          
          keyButton.style('background', originalColor.bg);
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
        
        // Show cooldown timer on the button
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
 * Get button size configuration based on device orientation
 * @returns {Object} Object containing width, height, fontSize, and gap values
 */
function getButtonSizeForOrientation() {
  return {
    width: '40px',
    height: '40px',
    fontSize: '18px',
    gap: '8px',
    rowGap: '8px'
  };
}

/**
 * Generate a color for a skill based on its index
 * @param {number} index - The index of the skill
 * @param {boolean} isHighlight - Whether to generate a highlight color
 * @returns {Object} Object containing background and border colors
 */
function generateSkillColor(index, isHighlight = false) {
  // Define a set of vibrant colors that are visually distinct
  const baseColors = [
    { bg: [0, 100, 255], border: '#00a0ff' },     // Blue
    { bg: [255, 100, 0], border: '#ff6400' },     // Orange
    { bg: [255, 0, 0], border: '#ff0000' },       // Red
    { bg: [255, 0, 255], border: '#ff00ff' },     // Magenta
    { bg: [0, 255, 0], border: '#00ff00' },       // Green
    { bg: [255, 255, 0], border: '#ffff00' },     // Yellow
    { bg: [0, 255, 255], border: '#00ffff' },     // Cyan
    { bg: [128, 0, 255], border: '#8000ff' },     // Purple
    { bg: [255, 128, 0], border: '#ff8000' },     // Amber
    { bg: [0, 128, 255], border: '#0080ff' },     // Sky Blue
    { bg: [255, 0, 128], border: '#ff0080' },     // Pink
    { bg: [128, 255, 0], border: '#80ff00' }      // Lime
  ];
  
  // Get the color based on index, wrapping around if needed
  const colorIndex = index % baseColors.length;
  const color = baseColors[colorIndex];
  
  if (isHighlight) {
    // Create a brighter version for highlight
    return {
      bg: `rgba(${color.bg[0] + 100}, ${color.bg[1] + 80}, ${color.bg[2] + 50}, 0.9)`,
      border: color.border
    };
  } else {
    // Return the normal color with transparency
    return {
      bg: `rgba(${color.bg[0]}, ${color.bg[1]}, ${color.bg[2]}, 0.7)`,
      border: color.border
    };
  }
}

/**
 * Set up touch controls for the game
 * @param {Object} gameState - The current game state
 */
export function setupTouchControls(gameState) {
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
      // Prevent double-tap zoom but allow single touches
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