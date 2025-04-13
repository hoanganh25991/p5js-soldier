// Main entry point for the game
// Handles setup, draw, and main game loop

// Import modules
import CONFIG from './config.js';
import { gameState, resetGameState } from './gameState.js';
import { setupMouseHandlers, handleMouseWheel, handleMousePressed, handleMouseReleased } from './controls/mouseControls.js';
import { handleKeyPressed } from './controls/keyboardControls.js';
import { createStatusBoard, updateStatusBoard, createMenuUI, createPauseMenu, createGameOverScreen, showGameOverScreen, showCooldownMessage } from './ui.js';
import { drawEnvironment } from './environment.js';
import { updateHeight, showAimLine, autoShoot, findNearestEnemies } from './utils.js';
import { Player } from './entities/player.js';
import { Pillar } from './entities/pillar.js';
import { EnemyController } from './controllers/enemyController.js';
import { Bullet } from './entities/bullet.js';
import { Clone } from './entities/clone.js';
import { Turret } from './entities/turret.js';
import { Airstrike } from './entities/airstrike.js';
import { Wave } from './entities/wave.js';
import { Laser } from './entities/laser.js';
import { GameBoyAdvanced } from './entities/gameBoyAdvanced.js';
import { GameCharacter } from './entities/gameCharacter.js';
import { SKILL_NAMES, SKILL_KEYS, SKILLS, updateSkillStates, isSkillAvailable, activateSkill, getSkillByKey } from './skills.js';
import { PowerUp, spawnRandomPowerUp, POWER_UP_TYPES } from './entities/powerUp.js';
import { updateEnvironment, drawEnvironmentEffects, getEnvironmentModifiers } from './environment/environmentEffects.js';
import { initializeUpgrades, applyUpgrades, awardXP, checkLevelUp, updateCombo, incrementCombo } from './progression.js';

// Add camera-specific properties to gameState
gameState.cameraRotationX = -0.4; // Less steep angle for better perspective
gameState.cameraRotationY = 0;
gameState.baseCameraDistance = 300; // Base distance that will be multiplied by zoomLevel
gameState.zoomLevel = 2.0; // Wider view of battlefield

// p5.js preload function - called before setup
function preload() {
  // Load assets
  gameState.gameFont = loadFont('fonts/opensans-light.ttf');
  gameState.shootSound = loadSound('sounds/single-shot.mp3');
  gameState.cloneSound = loadSound('sounds/woosh.mp3');
  gameState.spawnSound = loadSound('sounds/woosh.mp3'); // Reuse woosh sound for character spawn
}

// p5.js setup function - called once at start
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  gameState.camera = createCamera();
  
  // Set the default font for all text rendering in WEBGL mode
  if (gameState.gameFont) {
    textFont(gameState.gameFont);
  }
  
  // Set global sound volume (0.5 = 50% of original volume)
  gameState.masterVolume = 0.5;
  if (gameState.shootSound) gameState.shootSound.setVolume(gameState.masterVolume);
  if (gameState.cloneSound) gameState.cloneSound.setVolume(gameState.masterVolume);
  if (gameState.spawnSound) gameState.spawnSound.setVolume(gameState.masterVolume);
  
  // Create UI elements
  gameState.ui.statusBoard = createStatusBoard();
  gameState.ui.menuScreen = createMenuUI();
  gameState.ui.pauseMenu = createPauseMenu();
  gameState.ui.gameOverScreen = createGameOverScreen();
  
  // Setup mouse handlers
  setupMouseHandlers(window, gameState);
  
  // Make showCooldownMessage available globally for other modules
  window.showCooldownMessage = showCooldownMessage;
  
  // Initialize game objects
  resetGame();
}

// Reset game to initial state
function resetGame() {
  // Reset game state
  resetGameState();
  
  // Reset camera
  gameState.cameraRotationX = -0.4;
  gameState.cameraRotationY = 0;
  gameState.zoomLevel = 2.0;
  
  // Initialize player and pillar
  gameState.player = new Player(gameState);
  gameState.pillar = new Pillar(gameState);
  
  // Initialize enemy controller
  gameState.enemyController = new EnemyController(gameState);
  gameState.enemyController.initialize();
  
  // Initialize progression system
  gameState.upgrades = initializeUpgrades();
  applyUpgrades(gameState);
  
  // Initialize power-up spawn timer
  gameState.powerUpSpawnTimer = random(300, 600); // 5-10 seconds
  
  // Update UI
  updateStatusBoard();
}

// p5.js draw function - called every frame
function draw() {
  // Set the font at the beginning of each frame to ensure all text rendering works
  if (gameState.gameFont) {
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
      
      // Update environment (day/night cycle and weather)
      updateEnvironment(gameState);
      
      // Draw environment effects (sky, weather)
      drawEnvironmentEffects(gameState);
      
      // Update player first to get new height
      gameState.player.update();
      
      // Update camera position and rotation
      updateCamera();
      
      // Update combo system
      updateCombo(gameState);
      
      // Update power-up spawn timer
      if (gameState.powerUpSpawnTimer > 0) {
        gameState.powerUpSpawnTimer--;
        
        // Spawn a power-up when timer reaches zero
        if (gameState.powerUpSpawnTimer === 0) {
          gameState.powerUps.push(spawnRandomPowerUp(gameState));
          
          // Reset timer for next power-up (10-20 seconds)
          gameState.powerUpSpawnTimer = random(600, 1200);
        }
      }
      
      // Update and remove finished waves
      for (let i = gameState.waves.length - 1; i >= 0; i--) {
        if (gameState.waves[i].update()) {
          gameState.waves.splice(i, 1);
        }
      }
      
      // Get environment modifiers
      const envModifiers = getEnvironmentModifiers(gameState);
      
      // Apply environment lighting
      ambientLight(gameState.ambientLight || 100);
      
      // Add a main light source (sun/moon)
      const timeOfDay = gameState.timeOfDay;
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        // Daytime - bright white light from above
        const intensity = 255 - Math.abs(timeOfDay - 0.5) * 200;
        pointLight(intensity, intensity, intensity, 0, -500, 0);
      } else {
        // Nighttime - dim blue light
        const moonIntensity = 100;
        pointLight(moonIntensity * 0.8, moonIntensity * 0.8, moonIntensity, 0, -300, 0);
      }
      
      // Draw environment
      drawEnvironment();
      
      // Show waves
      gameState.waves.forEach(wave => wave.show());
      
      // Draw pillar
      gameState.pillar.show();
      
      // Show player
      gameState.player.show();
      
      // Update and show all game entities
      updateAndShowEntities();
      
      // Update skill states
      updateSkillStates(gameState.skills, gameState.frameCount);
      
      // Update legacy cooldowns for backward compatibility
      for (let skill in gameState.skillCooldowns) {
        if (gameState.skillCooldowns[skill] > 0) {
          gameState.skillCooldowns[skill]--;
        }
      }
      
      // Update status board
      updateStatusBoard();
      
      // Check win/lose conditions
      checkGameEndConditions();
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

function updateCamera() {
  // Update camera rotation when dragging
  if (gameState.isDragging) {
    let deltaX = (mouseX - gameState.lastMouseX) * 0.01;
    let deltaY = (mouseY - gameState.lastMouseY) * 0.01;

    gameState.cameraRotationY += deltaX;
    gameState.cameraRotationX = constrain(gameState.cameraRotationX + deltaY, -PI / 2, 0);

    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }

  // Position camera behind player at 1/3 screen height
  let currentDistance = gameState.baseCameraDistance * gameState.zoomLevel;

  // Calculate camera position
  let camX = sin(gameState.cameraRotationY) * currentDistance;
  let camZ = cos(gameState.cameraRotationY) * currentDistance;

  // Position camera behind player
  gameState.camera.setPosition(
    camX, // Keep player centered horizontally
    gameState.player.y - 600, // Camera slightly above player
    camZ + 100 // Camera behind player
  );

  // Look at point in front of player at 1/3 screen height
  gameState.camera.lookAt(
    0, // Keep centered horizontally
    gameState.player.y + 700, // Look slightly down
    -400 // Look ahead of player
  );
}

function updateAndShowEntities() {
  // Update and render enemies using the controller
  gameState.enemyController.update();
  gameState.enemyController.render();

  // Update and show bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    if (gameState.bullets[i].update()) { // Returns true if bullet should be removed
      gameState.bullets.splice(i, 1);
    } else {
      gameState.bullets[i].show();
    }
  }

  // Update and show clones
  for (let i = gameState.clones.length - 1; i >= 0; i--) {
    gameState.clones[i].update();
    gameState.clones[i].show();
    if (gameState.clones[i].lifespan <= 0) {
      gameState.clones.splice(i, 1);
    }
  }

  // Update and show turrets
  for (let i = gameState.turrets.length - 1; i >= 0; i--) {
    gameState.turrets[i].update();
    gameState.turrets[i].show();
    if (gameState.turrets[i].lifespan <= 0) {
      gameState.turrets.splice(i, 1);
    }
  }

  // Update and show airstrikes
  for (let i = gameState.airstrikes.length - 1; i >= 0; i--) {
    // Remove airstrike when it flies off screen
    if (gameState.airstrikes[i].x > width + 50) {
      gameState.airstrikes.splice(i, 1);
      continue; // Skip to next iteration after removing
    }
    gameState.airstrikes[i].update();
    gameState.airstrikes[i].show();
  }

  // Update and show lasers
  for (let i = gameState.lasers.length - 1; i >= 0; i--) {
    gameState.lasers[i].update();
    gameState.lasers[i].show();
    if (gameState.lasers[i].lifespan <= 0) {
      gameState.lasers.splice(i, 1);
    }
  }

  // Update and show waves
  for (let i = gameState.waves.length - 1; i >= 0; i--) {
    if (gameState.waves[i].update()) {
      gameState.waves.splice(i, 1);
    } else {
      gameState.waves[i].show();
    }
  }
  
  // Update and show Game Boy Advanced objects
  for (let i = gameState.gbas.length - 1; i >= 0; i--) {
    if (gameState.gbas[i].update()) { // Returns true when GBA hits the ground and spawns a character
      gameState.gbas.splice(i, 1);
    } else {
      gameState.gbas[i].show();
    }
  }
  
  // Update and show Gas Lighter objects
  if (gameState.gasLighters) {
    for (let i = gameState.gasLighters.length - 1; i >= 0; i--) {
      if (gameState.gasLighters[i].update()) { // Returns true when Gas Lighter hits the ground and casts a fire skill
        gameState.gasLighters.splice(i, 1);
      } else {
        gameState.gasLighters[i].show();
      }
    }
  }
  
  // Update and show Fire Skills
  if (gameState.fireSkills) {
    console.debug(`[MAIN DEBUG] Fire skills count in update loop: ${gameState.fireSkills.length}`);
    for (let i = gameState.fireSkills.length - 1; i >= 0; i--) {
      if (gameState.fireSkills[i].update()) { // Returns true when fire skill is done
        console.debug(`[MAIN DEBUG] Fire skill ${gameState.fireSkills[i].type} disappeared at position x=${gameState.fireSkills[i].x.toFixed(2)}, z=${gameState.fireSkills[i].z.toFixed(2)}`);
        gameState.fireSkills.splice(i, 1);
        console.debug(`[MAIN DEBUG] Fire skill removed, remaining skills: ${gameState.fireSkills.length}`);
      } else {
        gameState.fireSkills[i].show();
      }
    }
  }
  
  // Update and show Game Characters
  console.debug(`[MAIN DEBUG] Game characters count in update loop: ${gameState.gameCharacters.length}`);
  for (let i = gameState.gameCharacters.length - 1; i >= 0; i--) {
    gameState.gameCharacters[i].update();
    gameState.gameCharacters[i].show();
    if (gameState.gameCharacters[i].health <= 0 || gameState.gameCharacters[i].lifespan <= 0) {
      console.debug(`[MAIN DEBUG] Removing ${gameState.gameCharacters[i].type} character due to health: ${gameState.gameCharacters[i].health.toFixed(2)}, lifespan: ${gameState.gameCharacters[i].lifespan}`);
      gameState.gameCharacters.splice(i, 1);
      console.debug(`[MAIN DEBUG] Character removed, remaining characters: ${gameState.gameCharacters.length}`);
    }
  }
  
  // Update and show Power-Ups
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    if (gameState.powerUps[i].update()) { // Returns true when power-up is collected or expires
      gameState.powerUps.splice(i, 1);
    } else {
      gameState.powerUps[i].show();
    }
  }
}

function checkGameEndConditions() {
  // Check if player has died
  if (gameState.playerHealth <= 0) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(false); // Game over - defeat
    noLoop();
    return;
  }
  
  // Check for victory condition
  if (gameState.enemyController.getEnemiesKilled() >= CONFIG.VICTORY_KILLS) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(true); // Game over - victory
    noLoop();
    return;
  }
  
  // Check if enemies were killed this frame
  const currentEnemiesKilled = gameState.enemyController.getEnemiesKilled();
  if (currentEnemiesKilled > gameState.enemiesKilled) {
    // Calculate how many enemies were killed this frame
    const newKills = currentEnemiesKilled - gameState.enemiesKilled;
    
    // Update the stored count
    gameState.enemiesKilled = currentEnemiesKilled;
    
    // Award XP for kills (base 10 XP per kill)
    const baseXP = 10 * newKills;
    
    // Increment combo for each kill
    for (let i = 0; i < newKills; i++) {
      incrementCombo(gameState);
    }
    
    // Apply combo multiplier (combo starts at 0, so add 1 for multiplier)
    const comboMultiplier = 1 + (gameState.combo * 0.1); // 10% bonus per combo level
    
    // Calculate final XP with combo bonus
    const xpGained = Math.floor(baseXP * comboMultiplier);
    
    // Award XP
    awardXP(gameState, xpGained);
    
    // Update score
    gameState.score += newKills * 100 * comboMultiplier;
  }
}

// Event handlers
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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