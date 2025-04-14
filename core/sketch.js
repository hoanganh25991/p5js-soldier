// Main entry point for the game (p5.js sketch)
// Handles setup, draw, and main game loop

// Import modules
import CONFIG from '../../config.js';
import { gameState, resetGameState } from './gameState.js';
import { setupMouseHandlers, handleMouseWheel, handleMousePressed, handleMouseReleased } from './controls/mouseControls.js';
import { handleKeyPressed } from './controls/keyboardControls.js';
import { setupTouchControls, updateVirtualTouchKeys } from './controls/touchControls.js';
import { 
  createStatusBoard, 
  updateStatusBoard, 
  createMenuUI, 
  createPauseMenu, 
  createGameOverScreen, 
  showGameOverScreen, 
  showCooldownMessage,
  createZoomControls,
  updateZoomControlsVisibility
} from './ui/index.js';
import { initializeUpgrades, applyUpgrades, awardXP, checkLevelUp, updateCombo, incrementCombo } from './progression.js';
import { updateSkillStates } from './skills.js';

// Import game managers
import { initializeCamera, updateCamera, updateCameraOnResize } from './managers/cameraManager.js';
import { updateAndShowEntities } from './managers/entityManager.js';
import { checkGameEndConditions, resetGame } from './managers/gameManager.js';
import { updateGameEnvironment } from './managers/environmentManager.js';
import soundManager from './managers/soundManager.js';

// p5.js preload function - called before setup
function preload() {
  // Load assets
  gameState.gameFont = loadFont('fonts/opensans-light.ttf');
  
  // Load all sounds through the sound manager
  soundManager.loadSounds();
  
  // Store sound manager in game state for easy access
  gameState.soundManager = soundManager;
}

// p5.js setup function - called once at start
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  gameState.camera = createCamera();
  
  // Set target frame rate to 60 FPS
  frameRate(60);
  
  // Set the default font for all text rendering in WEBGL mode
  if (gameState.gameFont) {
    textFont(gameState.gameFont);
  }
  
  // Set global sound volume (0.5 = 50% of original volume)
  gameState.masterVolume = 0.5;
  soundManager.setMasterVolume(gameState.masterVolume);
  
  // Create UI elements
  gameState.ui.statusBoard = createStatusBoard();
  gameState.ui.menuScreen = createMenuUI();
  gameState.ui.pauseMenu = createPauseMenu();
  gameState.ui.gameOverScreen = createGameOverScreen();
  gameState.ui.zoomControls = createZoomControls(gameState);
  
  // Setup controls
  setupMouseHandlers(window, gameState);
  setupTouchControls(gameState);
  
  // Make gameState available globally for the virtual keyboard
  window.gameState = gameState;
  
  // Make showCooldownMessage available globally for other modules
  window.showCooldownMessage = showCooldownMessage;
  
  // Initialize camera
  initializeCamera(gameState);
  
  // Initialize game objects
  resetGame(gameState);
}

// p5.js draw function - called every frame
function draw() {
  // Only set the font once per frame if needed, not on every draw call
  if (gameState.gameFont && frameCount === 1) {
    textFont(gameState.gameFont);
  }
  
  // Handle different game states
  switch (gameState.currentState) {
    case 'menu':
      // Just draw a simple background in menu state
      background(50, 80, 120);
      break;
      
    case 'playing':
      // Main game loop
      gameState.frameCount++;
      
      // Update environment and game state
      updateGameEnvironment(gameState);
      
      // Update player first to get new height
      gameState.player.update();
      
      // Update camera position and rotation
      updateCamera(gameState);
      
      // Update combo system
      updateCombo(gameState);
      
      // Update and show all game entities
      updateAndShowEntities(gameState);
      
      // Update skill states
      updateSkillStates(gameState.skills, gameState.frameCount);
      
      // Update legacy cooldowns for backward compatibility
      for (let skill in gameState.skillCooldowns) {
        if (gameState.skillCooldowns[skill] > 0) {
          gameState.skillCooldowns[skill]--;
        }
      }
      
      // Update UI elements
      updateStatusBoard();
      updateVirtualTouchKeys(gameState);
      updateZoomControlsVisibility(gameState);
      
      // Check win/lose conditions
      checkGameEndConditions(gameState);
      break;
      
    case 'paused':
      // In paused state, we don't update anything
      // Just keep the last frame visible
      break;
      
    case 'gameOver':
      // In game over state, we don't update anything
      // Just keep the last frame visible with game over overlay
      break;
      
    case 'levelUp':
      // In level up state, we don't update anything
      // Just keep the last frame visible with level up overlay
      break;
  }
}

// Event handlers
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Update camera parameters based on new screen dimensions
  if (gameState && gameState.camera) {
    updateCameraOnResize(gameState);
  }
}

// Mouse control functions - these are global p5.js functions that delegate to our handlers
function mouseWheel(event) {
  handleMouseWheel(event, gameState);
}

function mousePressed() {
  handleMousePressed(gameState);
}

function mouseReleased() {
  handleMouseReleased(gameState);
}

function keyPressed() {
  // Delegate to the keyboard controls module
  handleKeyPressed(gameState, key);
}

// Make p5.js functions available globally
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.mouseWheel = mouseWheel;
window.mousePressed = mousePressed;
window.mouseReleased = mouseReleased;
window.keyPressed = keyPressed;