// Main entry point for the game
// Handles setup, draw, and main game loop

// Import modules
import CONFIG from './config.js';
import { gameState, resetGameState } from './gameState.js';
import { setupMouseHandlers, handleMouseWheel, handleMousePressed, handleMouseReleased } from './controls/mouseControls.js';
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
  
  // Create UI elements
  gameState.ui.statusBoard = createStatusBoard();
  gameState.ui.menuScreen = createMenuUI();
  gameState.ui.pauseMenu = createPauseMenu();
  gameState.ui.gameOverScreen = createGameOverScreen();
  
  // Setup mouse handlers
  setupMouseHandlers(window, gameState);
  
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
  
  // Update UI
  updateStatusBoard();
}

// p5.js draw function - called every frame
function draw() {
  // Handle different game states
  switch (gameState.currentState) {
    case 'menu':
      // Just draw a simple background in menu state
      background(50, 80, 120);
      break;
      
    case 'playing':
      // Main game loop
      gameState.frameCount++;
      
      // Sky gradient
      background(135, 206, 235); // Light blue sky
      
      // Update player first to get new height
      gameState.player.update();
      
      // Update camera position and rotation
      updateCamera();
      
      // Update and remove finished waves
      for (let i = gameState.waves.length - 1; i >= 0; i--) {
        if (gameState.waves[i].update()) {
          gameState.waves.splice(i, 1);
        }
      }
      
      // Add some ambient light
      ambientLight(100);
      pointLight(255, 255, 255, 0, -500, 0);
      
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
  
  // Update and show Game Characters
  console.log(`Game characters count in update loop: ${gameState.gameCharacters.length}`);
  for (let i = gameState.gameCharacters.length - 1; i >= 0; i--) {
    gameState.gameCharacters[i].update();
    gameState.gameCharacters[i].show();
    if (gameState.gameCharacters[i].health <= 0 || gameState.gameCharacters[i].lifespan <= 0) {
      console.log(`Removing ${gameState.gameCharacters[i].type} character due to health: ${gameState.gameCharacters[i].health}, lifespan: ${gameState.gameCharacters[i].lifespan}`);
      gameState.gameCharacters.splice(i, 1);
    }
  }
}

function checkGameEndConditions() {
  if (gameState.playerHealth <= 0) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(false); // Game over - defeat
    noLoop();
  } else if (gameState.enemyController.getEnemiesKilled() >= CONFIG.VICTORY_KILLS) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(true); // Game over - victory
    noLoop();
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
  // Handle pause with Escape key
  if (key === 'Escape' || key === 'p' || key === 'P') {
    if (gameState.currentState === 'playing') {
      gameState.currentState = 'paused';
      select('#pause-menu').style('display', 'flex');
      noLoop();
    } else if (gameState.currentState === 'paused') {
      gameState.currentState = 'playing';
      select('#pause-menu').style('display', 'none');
      loop();
    }
    return;
  }
  
  // Only process skill keys in playing state
  if (gameState.currentState !== 'playing') return;
  
  // Get skill by key press
  const skillName = getSkillByKey(key);
  
  // If a valid skill key was pressed
  if (skillName) {
    // Check if skill is available
    if (isSkillAvailable(gameState.skills, skillName)) {
      // Activate the skill
      activateSkill(gameState.skills, skillName, gameState.frameCount);
      
      // Also update legacy cooldowns for backward compatibility
      gameState.skillCooldowns[skillName] = SKILLS[skillName].cooldown;
      
      // Handle specific skill actions
      switch (skillName) {
        case SKILL_NAMES.CLONE:
          // Create clone at random position around the player
          let cloneAngle = random(TWO_PI);
          let cloneRadius = 30;
          let cloneX = gameState.player.x + cos(cloneAngle) * cloneRadius;
          let cloneZ = gameState.player.z + sin(cloneAngle) * cloneRadius;
          gameState.clones.push(new Clone(cloneX, gameState.player.y, cloneZ, gameState));
          
          // Play woosh sound
          gameState.cloneSound.play();
          
          // Optional: Limit max number of clones to avoid overwhelming
          if (gameState.clones.length > SKILLS[SKILL_NAMES.CLONE].maxCount) {
            gameState.clones.shift(); // Remove oldest clone if too many
          }
          break;
          
        case SKILL_NAMES.TURRET:
          // Create turret at random position around the player
          let turretAngle = random(TWO_PI);
          let turretRadius = 40;
          let turretX = gameState.player.x + cos(turretAngle) * turretRadius;
          let turretZ = gameState.player.z + sin(turretAngle) * turretRadius;
          gameState.turrets.push(new Turret(turretX, gameState.player.y, turretZ, gameState));
          break;
          
        case SKILL_NAMES.AIRSTRIKE:
          gameState.airstrikes.push(new Airstrike(gameState));
          break;
          
        case SKILL_NAMES.LASER:
          gameState.lasers.push(new Laser(gameState));
          break;
          
        case SKILL_NAMES.GBA:
          // Create GBA at player position with direction based on player rotation
          let throwDirection = gameState.player.rotation;
          let throwSpeed = 5; // Fixed speed for better visibility
          let throwDistance = 100; // Shorter distance for better visibility
          
          // Create the GBA object
          gameState.gbas.push(new GameBoyAdvanced(
            gameState.player.x, 
            -50, // Fixed height for better visibility
            gameState.player.z,
            throwDirection,
            throwSpeed,
            throwDistance,
            gameState
          ));
          break;
      }
    } else {
      // Show cooldown message
      const cooldown = gameState.skills[skillName].cooldownRemaining;
      showCooldownMessage(SKILLS[skillName].name, cooldown);
    }
  }
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