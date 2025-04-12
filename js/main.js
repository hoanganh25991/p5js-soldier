// Main entry point for the game
// Handles setup, draw, and main game loop

// Game state
let gameState = {
  // Game state management
  currentState: 'menu', // menu, playing, paused, gameOver
  frameCount: 0,
  enemiesKilled: 0,
  totalEnemiesSpawned: 0,
  pillarHeight: CONFIG.PILLAR_HEIGHT,
  playerHealth: CONFIG.PLAYER_HEALTH,
  skillCooldowns: {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0
  },
  // Camera control variables
  camera: null,
  cameraRotationX: -0.4, // Less steep angle for better perspective
  cameraRotationY: 0,
  zoomLevel: 2.0, // Wider view of battlefield
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  baseCameraDistance: 300, // Base distance that will be multiplied by zoomLevel
  // Game entities
  player: null,
  pillar: null,
  enemies: [],
  bullets: [],
  clones: [],
  turrets: [],
  airstrikes: [],
  waves: [],
  lasers: [],
  // Assets
  gameFont: null,
  shootSound: null,
  cloneSound: null,
  // Global popup timer
  popupTimer: null,
  // UI elements
  ui: {
    statusBoard: null,
    cooldownPopup: null,
    menuScreen: null,
    pauseMenu: null,
    gameOverScreen: null
  }
};

function preload() {
  // Load assets
  gameState.gameFont = loadFont('opensans-light.ttf');
  gameState.shootSound = loadSound('single-shot.mp3');
  gameState.cloneSound = loadSound('woosh-effect-12-255591.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  gameState.camera = createCamera();
  
  // Create UI elements
  gameState.ui.statusBoard = createStatusBoard();
  gameState.ui.menuScreen = createMenuUI();
  gameState.ui.pauseMenu = createPauseMenu();
  gameState.ui.gameOverScreen = createGameOverScreen();
  
  // Initialize game objects
  resetGame();
}

// Reset game to initial state
function resetGame() {
  // Reset game state
  gameState.frameCount = 0;
  gameState.enemiesKilled = 0;
  gameState.totalEnemiesSpawned = 0;
  gameState.pillarHeight = CONFIG.PILLAR_HEIGHT;
  gameState.playerHealth = CONFIG.PLAYER_HEALTH;
  gameState.skillCooldowns = {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0
  };
  
  // Reset camera
  gameState.cameraRotationX = -0.4;
  gameState.cameraRotationY = 0;
  gameState.zoomLevel = 2.0;
  
  // Clear all entities
  gameState.enemies = [];
  gameState.bullets = [];
  gameState.clones = [];
  gameState.turrets = [];
  gameState.airstrikes = [];
  gameState.waves = [];
  gameState.lasers = [];
  
  // Initialize player and pillar
  gameState.player = new Player(gameState);
  gameState.pillar = new Pillar(gameState);
  
  // Initial enemy spawn
  for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
    gameState.enemies.push(Enemy.spawnRandom(gameState));
    gameState.totalEnemiesSpawned++;
  }
  
  // Update UI
  updateStatusBoard();
}

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
      
      // Spawn new enemies
      spawnEnemies();
      
      // Show player
      gameState.player.show();
      
      // Update and show all game entities
      updateAndShowEntities();
      
      // Update cooldowns
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

function drawEnvironment() {
  // Draw ground
  push();
  translate(0, 50, 0);
  rotateX(HALF_PI);
  fill(34, 139, 34); // Forest green
  noStroke();
  plane(CONFIG.WORLD_RADIUS * 2, CONFIG.WORLD_RADIUS * 2);

  // Add grid pattern
  stroke(45, 150, 45);
  strokeWeight(1);
  let gridSize = 100;
  for (let x = -CONFIG.WORLD_RADIUS; x <= CONFIG.WORLD_RADIUS; x += gridSize) {
    line(x, -CONFIG.WORLD_RADIUS, x, CONFIG.WORLD_RADIUS);
  }
  for (let z = -CONFIG.WORLD_RADIUS; z <= CONFIG.WORLD_RADIUS; z += gridSize) {
    line(-CONFIG.WORLD_RADIUS, z, CONFIG.WORLD_RADIUS, z);
  }
  pop();
}

function spawnEnemies() {
  if (gameState.enemies.length < CONFIG.MAX_ENEMIES && gameState.frameCount % CONFIG.SPAWN_INTERVAL === 0) {
    gameState.enemies.push(Enemy.spawnRandom(gameState));
    gameState.totalEnemiesSpawned++;
  }
}

function updateAndShowEntities() {
  // Update and show enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    gameState.enemies[i].update();
    gameState.enemies[i].show();
    if (gameState.enemies[i].health <= 0) {
      gameState.enemies.splice(i, 1);
      gameState.enemiesKilled++;
      if (gameState.enemies.length < 50) {
        gameState.enemies.push(Enemy.spawnRandom(gameState));
      }
    }
  }

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
}

function checkGameEndConditions() {
  if (gameState.playerHealth <= 0) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(false); // Game over - defeat
    noLoop();
  } else if (gameState.enemiesKilled >= CONFIG.VICTORY_KILLS) {
    gameState.currentState = 'gameOver';
    showGameOverScreen(true); // Game over - victory
    noLoop();
  }
}

// Event handlers
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseWheel(event) {
  // Only allow zooming in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Zoom with mouse wheel - rolling forward (negative delta) decreases zoom level (zooms in)
  // rolling backward (positive delta) increases zoom level (zooms out)
  gameState.zoomLevel = constrain(gameState.zoomLevel + (event.delta * 0.001), 0.2, 10.0);
  return false; // Prevent default scrolling
}

function mousePressed() {
  // Only allow camera control in playing state
  if (gameState.currentState !== 'playing') return;
  
  // Start dragging with middle mouse button (button 1)
  if (mouseButton === CENTER) {
    gameState.isDragging = true;
    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    gameState.isDragging = false;
  }
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
  
  if (key === 'c' || key === 'C') {
    if (gameState.skillCooldowns.clone <= 0) {
      // Create clone at random position around the player
      let angle = random(TWO_PI);
      let radius = 30;
      let cloneX = gameState.player.x + cos(angle) * radius;
      let cloneZ = gameState.player.z + sin(angle) * radius;
      gameState.clones.push(new Clone(cloneX, gameState.player.y, cloneZ, gameState));

      // Play woosh sound
      gameState.cloneSound.play();

      // Optional: Limit max number of clones to avoid overwhelming
      if (gameState.clones.length > CONFIG.CLONE.MAX_CLONES) {
        gameState.clones.shift(); // Remove oldest clone if too many
      }
      gameState.skillCooldowns.clone = CONFIG.CLONE.COOLDOWN;
    } else {
      showCooldownMessage('Clone', gameState.skillCooldowns.clone);
    }
  } else if (key === 't' || key === 'T') {
    if (gameState.skillCooldowns.turret <= 0) {
      // Create turret at random position around the player
      let angle = random(TWO_PI);
      let radius = 40;
      let turretX = gameState.player.x + cos(angle) * radius;
      let turretZ = gameState.player.z + sin(angle) * radius;
      gameState.turrets.push(new Turret(turretX, gameState.player.y, turretZ, gameState));
      gameState.skillCooldowns.turret = CONFIG.TURRET.COOLDOWN;
    } else {
      showCooldownMessage('Turret', gameState.skillCooldowns.turret);
    }
  } else if (key === 'a' || key === 'A') {
    if (gameState.skillCooldowns.airstrike <= 0) {
      gameState.airstrikes.push(new Airstrike(gameState));
      gameState.skillCooldowns.airstrike = CONFIG.AIRSTRIKE.COOLDOWN;
    } else {
      showCooldownMessage('Airstrike', gameState.skillCooldowns.airstrike);
    }
  } else if (key === 'l' || key === 'L') {
    if (gameState.skillCooldowns.laser <= 0) {
      gameState.lasers.push(new Laser(gameState));
      gameState.skillCooldowns.laser = CONFIG.LASER.COOLDOWN;
    } else {
      showCooldownMessage('Laser', gameState.skillCooldowns.laser);
    }
  }
}