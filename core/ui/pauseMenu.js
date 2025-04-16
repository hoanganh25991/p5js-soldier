// Pause Menu UI Component
// Displays the pause menu with resume, restart, and volume controls

import { gameState } from '../gameState.js';
import { resetGame } from '../managers/gameManager.js';
import { 
  createOverlay, 
  createTitle, 
  createStyledButton, 
  applyStyles, 
  styles 
} from './uiUtils.js';

// Volume container styles
const volumeContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '20px',
  marginBottom: '20px',
  width: '80%',
  maxWidth: '300px'
};

// Volume label styles
const volumeLabelStyles = {
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  marginBottom: '10px'
};

// Volume value styles
const volumeValueStyles = {
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  marginTop: '5px'
};

// Smaller button styles for mute button
const smallButtonStyles = {
  ...styles.button,
  padding: '10px 20px',
  fontSize: '16px'
};

/**
 * Create pause menu
 * @returns {Element} The pause menu element
 */
export function createPauseMenu() {
  // Create the main overlay
  const pauseMenu = createOverlay('pause-menu');
  
  // Title
  const title = createTitle('Game Paused');
  pauseMenu.child(title);
  
  // Resume button
  const resumeButton = createStyledButton(
    'Resume Game', 
    styles.buttonColors.primary, 
    () => {
      gameState.currentState = 'playing';
      pauseMenu.style('display', 'none');
      loop();
    }
  );
  pauseMenu.child(resumeButton);
  
  // Restart button
  const restartButton = createStyledButton(
    'Restart Game', 
    styles.buttonColors.secondary, 
    () => {
      resetGame(gameState);
      gameState.currentState = 'playing';
      pauseMenu.style('display', 'none');
      loop();
    }
  );
  pauseMenu.child(restartButton);
  
  // Volume control container
  const volumeContainer = createElement('div');
  applyStyles(volumeContainer, volumeContainerStyles);
  
  // Volume label
  const volumeLabel = createElement('div', 'Sound Volume');
  applyStyles(volumeLabel, volumeLabelStyles);
  volumeContainer.child(volumeLabel);
  
  // Create volume slider
  const volumeSlider = createSlider(0, 100, gameState.masterVolume * 100);
  volumeSlider.style('width', '100%');
  
  // Volume value display
  const volumeValue = createElement('div', `${Math.round(gameState.masterVolume * 100)}%`);
  applyStyles(volumeValue, volumeValueStyles);
  
  // Set up volume slider event handler
  volumeSlider.input(() => {
    const newVolume = volumeSlider.value() / 100;
    updateVolume(newVolume, volumeValue);
  });
  
  volumeContainer.child(volumeSlider);
  volumeContainer.child(volumeValue);
  pauseMenu.child(volumeContainer);
  
  // Initialize mute state
  gameState.previousVolume = gameState.masterVolume;
  gameState.isMuted = false;
  
  // Mute button
  const muteButton = createButton('Mute Sound');
  applyStyles(muteButton, smallButtonStyles);
  muteButton.style('background', styles.buttonColors.warning);
  
  muteButton.mousePressed(() => {
    toggleMute(muteButton, volumeSlider, volumeValue);
  });
  
  pauseMenu.child(muteButton);
  
  return pauseMenu;
}

/**
 * Update volume settings
 * @param {number} volume - New volume value (0-1)
 * @param {Element} volumeDisplay - Volume display element to update
 */
function updateVolume(volume, volumeDisplay) {
  // Update game state
  gameState.masterVolume = volume;
  
  // Update sound manager
  if (gameState.soundManager) {
    gameState.soundManager.setMasterVolume(volume);
  }
  
  // Update display
  volumeDisplay.html(`${Math.round(volume * 100)}%`);
}

/**
 * Toggle mute state
 * @param {Element} muteButton - The mute button element
 * @param {Element} volumeSlider - The volume slider element
 * @param {Element} volumeDisplay - The volume display element
 */
function toggleMute(muteButton, volumeSlider, volumeDisplay) {
  if (gameState.isMuted) {
    // Unmute
    gameState.masterVolume = gameState.previousVolume;
    muteButton.html('Mute Sound');
    muteButton.style('background', styles.buttonColors.warning);
  } else {
    // Mute
    gameState.previousVolume = gameState.masterVolume;
    gameState.masterVolume = 0;
    muteButton.html('Unmute Sound');
    muteButton.style('background', styles.buttonColors.primary);
  }
  
  // Toggle mute state
  gameState.isMuted = !gameState.isMuted;
  
  // Update sound manager
  if (gameState.soundManager) {
    gameState.soundManager.setMasterVolume(gameState.masterVolume);
  }
  
  // Update UI
  volumeSlider.value(gameState.masterVolume * 100);
  volumeDisplay.html(`${Math.round(gameState.masterVolume * 100)}%`);
}