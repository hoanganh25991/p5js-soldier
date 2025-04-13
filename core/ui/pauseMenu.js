// Pause Menu UI Component
// Displays the pause menu with resume, restart, and volume controls

import { gameState } from '../gameState.js';
import { resetGame } from '../managers/gameManager.js';

// Create pause menu
export function createPauseMenu() {
  const pauseMenu = createElement('div');
  pauseMenu.id('pause-menu');
  pauseMenu.style('position', 'fixed');
  pauseMenu.style('top', '0');
  pauseMenu.style('left', '0');
  pauseMenu.style('width', '100%');
  pauseMenu.style('height', '100%');
  pauseMenu.style('display', 'none');
  pauseMenu.style('flex-direction', 'column');
  pauseMenu.style('justify-content', 'center');
  pauseMenu.style('align-items', 'center');
  pauseMenu.style('background', 'rgba(0, 0, 0, 0.7)');
  pauseMenu.style('z-index', '300');
  
  // Title
  const title = createElement('h1', 'Game Paused');
  title.style('color', 'white');
  title.style('font-family', 'Arial, sans-serif');
  title.style('margin-bottom', '40px');
  pauseMenu.child(title);
  
  // Resume button
  const resumeButton = createButton('Resume Game');
  resumeButton.style('padding', '15px 30px');
  resumeButton.style('font-size', '20px');
  resumeButton.style('margin-bottom', '20px');
  resumeButton.style('cursor', 'pointer');
  resumeButton.style('background', '#4CAF50');
  resumeButton.style('color', 'white');
  resumeButton.style('border', 'none');
  resumeButton.style('border-radius', '5px');
  resumeButton.mousePressed(() => {
    gameState.currentState = 'playing';
    pauseMenu.style('display', 'none');
    loop();
  });
  pauseMenu.child(resumeButton);
  
  // Restart button
  const restartButton = createButton('Restart Game');
  restartButton.style('padding', '15px 30px');
  restartButton.style('font-size', '20px');
  restartButton.style('margin-bottom', '20px');
  restartButton.style('cursor', 'pointer');
  restartButton.style('background', '#2196F3');
  restartButton.style('color', 'white');
  restartButton.style('border', 'none');
  restartButton.style('border-radius', '5px');
  restartButton.mousePressed(() => {
    resetGame();
    gameState.currentState = 'playing';
    pauseMenu.style('display', 'none');
    loop();
  });
  pauseMenu.child(restartButton);
  
  // Volume control
  const volumeContainer = createElement('div');
  volumeContainer.style('display', 'flex');
  volumeContainer.style('flex-direction', 'column');
  volumeContainer.style('align-items', 'center');
  volumeContainer.style('margin-top', '20px');
  volumeContainer.style('margin-bottom', '20px');
  volumeContainer.style('width', '80%');
  volumeContainer.style('max-width', '300px');
  
  const volumeLabel = createElement('div', 'Sound Volume');
  volumeLabel.style('color', 'white');
  volumeLabel.style('font-family', 'Arial, sans-serif');
  volumeLabel.style('margin-bottom', '10px');
  volumeContainer.child(volumeLabel);
  
  // Create volume slider
  const volumeSlider = createSlider(0, 100, gameState.masterVolume * 100);
  volumeSlider.style('width', '100%');
  volumeSlider.input(() => {
    // Update master volume
    const newVolume = volumeSlider.value() / 100;
    gameState.masterVolume = newVolume;
    
    // Update all sound volumes
    if (gameState.shootSound) gameState.shootSound.setVolume(newVolume);
    if (gameState.cloneSound) gameState.cloneSound.setVolume(newVolume);
    if (gameState.spawnSound) gameState.spawnSound.setVolume(newVolume);
    
    // Update volume display
    volumeValue.html(`${Math.round(newVolume * 100)}%`);
  });
  volumeContainer.child(volumeSlider);
  
  // Volume value display
  const volumeValue = createElement('div', `${Math.round(gameState.masterVolume * 100)}%`);
  volumeValue.style('color', 'white');
  volumeValue.style('font-family', 'Arial, sans-serif');
  volumeValue.style('margin-top', '5px');
  volumeContainer.child(volumeValue);
  
  pauseMenu.child(volumeContainer);
  
  // Mute button
  const muteButton = createButton('Mute Sound');
  muteButton.style('padding', '10px 20px');
  muteButton.style('font-size', '16px');
  muteButton.style('margin-bottom', '20px');
  muteButton.style('cursor', 'pointer');
  muteButton.style('background', '#FF5722');
  muteButton.style('color', 'white');
  muteButton.style('border', 'none');
  muteButton.style('border-radius', '5px');
  
  // Store previous volume for unmuting
  gameState.previousVolume = gameState.masterVolume;
  gameState.isMuted = false;
  
  muteButton.mousePressed(() => {
    if (gameState.isMuted) {
      // Unmute
      gameState.masterVolume = gameState.previousVolume;
      muteButton.html('Mute Sound');
      muteButton.style('background', '#FF5722');
    } else {
      // Mute
      gameState.previousVolume = gameState.masterVolume;
      gameState.masterVolume = 0;
      muteButton.html('Unmute Sound');
      muteButton.style('background', '#4CAF50');
    }
    
    // Toggle mute state
    gameState.isMuted = !gameState.isMuted;
    
    // Update all sound volumes
    if (gameState.shootSound) gameState.shootSound.setVolume(gameState.masterVolume);
    if (gameState.cloneSound) gameState.cloneSound.setVolume(gameState.masterVolume);
    if (gameState.spawnSound) gameState.spawnSound.setVolume(gameState.masterVolume);
    
    // Update slider
    volumeSlider.value(gameState.masterVolume * 100);
    volumeValue.html(`${Math.round(gameState.masterVolume * 100)}%`);
  });
  
  pauseMenu.child(muteButton);
  
  return pauseMenu;
}