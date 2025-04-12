// UI Management
// Handles creation and updating of UI elements

// Create the status board and other UI elements
function createStatusBoard() {
  // Create main status board container
  const statusBoard = createElement('div');
  statusBoard.id('status-board');
  statusBoard.style('position', 'fixed');
  statusBoard.style('top', '10px');
  statusBoard.style('left', '10px');
  statusBoard.style('background', 'rgba(0, 0, 0, 0.7)');
  statusBoard.style('color', 'white');
  statusBoard.style('padding', '10px');
  statusBoard.style('border-radius', '5px');
  statusBoard.style('font-family', 'Arial, sans-serif');
  statusBoard.style('z-index', '100');
  
  // Create pillar height display
  const pillarHeightDiv = createElement('div', 'Pillar Height: ');
  const pillarHeightSpan = createElement('span', '100');
  pillarHeightSpan.id('pillar-height');
  pillarHeightDiv.child(pillarHeightSpan);
  statusBoard.child(pillarHeightDiv);
  
  // Create health display
  const healthDiv = createElement('div', 'Health: ');
  const healthSpan = createElement('span', '100');
  healthSpan.id('health');
  healthDiv.child(healthSpan);
  statusBoard.child(healthDiv);
  
  // Create kills display
  const killsDiv = createElement('div', 'Enemies Killed: ');
  const killsSpan = createElement('span', '0');
  killsSpan.id('kills');
  killsDiv.child(killsSpan);
  statusBoard.child(killsDiv);
  
  // Create skills header
  const skillsHeader = createElement('div', 'Skills (Cooldown):');
  statusBoard.child(skillsHeader);
  
  // Create skill entries
  const skills = [
    { key: 'C', name: 'Clone', id: 'clone-cd' },
    { key: 'T', name: 'Turret', id: 'turret-cd' },
    { key: 'A', name: 'Airstrike', id: 'airstrike-cd' },
    { key: 'L', name: 'Laser', id: 'laser-cd' }
  ];
  
  skills.forEach((skill, index) => {
    const skillDiv = createElement('div', `${index + 1}: ${skill.name} (${skill.key}) - `);
    const skillSpan = createElement('span', 'Ready');
    skillSpan.id(skill.id);
    skillDiv.child(skillSpan);
    statusBoard.child(skillDiv);
  });
  
  // Create cooldown popup
  const cooldownPopup = createElement('div');
  cooldownPopup.id('cooldown-popup');
  cooldownPopup.style('position', 'fixed');
  cooldownPopup.style('top', '50%');
  cooldownPopup.style('left', '50%');
  cooldownPopup.style('transform', 'translate(-50%, -50%)');
  cooldownPopup.style('background', 'rgba(255, 0, 0, 0.8)');
  cooldownPopup.style('color', 'white');
  cooldownPopup.style('padding', '15px 30px');
  cooldownPopup.style('border-radius', '5px');
  cooldownPopup.style('font-family', 'Arial, sans-serif');
  cooldownPopup.style('font-size', '24px');
  cooldownPopup.style('font-weight', 'bold');
  cooldownPopup.style('pointer-events', 'none');
  cooldownPopup.style('opacity', '0');
  cooldownPopup.style('transition', 'opacity 0.3s');
  cooldownPopup.style('z-index', '200');
  
  return {
    statusBoard,
    cooldownPopup
  };
}

// Create menu UI
function createMenuUI() {
  const menuContainer = createElement('div');
  menuContainer.id('menu-container');
  menuContainer.style('position', 'fixed');
  menuContainer.style('top', '0');
  menuContainer.style('left', '0');
  menuContainer.style('width', '100%');
  menuContainer.style('height', '100%');
  menuContainer.style('display', 'flex');
  menuContainer.style('flex-direction', 'column');
  menuContainer.style('justify-content', 'center');
  menuContainer.style('align-items', 'center');
  menuContainer.style('background', 'rgba(0, 0, 0, 0.8)');
  menuContainer.style('z-index', '300');
  
  // Title
  const title = createElement('h1', 'Pillar Defense Game');
  title.style('color', 'white');
  title.style('font-family', 'Arial, sans-serif');
  title.style('margin-bottom', '40px');
  menuContainer.child(title);
  
  // Start button
  const startButton = createButton('Start Game');
  startButton.style('padding', '15px 30px');
  startButton.style('font-size', '20px');
  startButton.style('margin-bottom', '20px');
  startButton.style('cursor', 'pointer');
  startButton.style('background', '#4CAF50');
  startButton.style('color', 'white');
  startButton.style('border', 'none');
  startButton.style('border-radius', '5px');
  startButton.mousePressed(() => {
    gameState.currentState = 'playing';
    menuContainer.style('display', 'none');
  });
  menuContainer.child(startButton);
  
  // Instructions
  const instructions = createElement('div');
  instructions.style('color', 'white');
  instructions.style('font-family', 'Arial, sans-serif');
  instructions.style('width', '60%');
  instructions.style('text-align', 'center');
  instructions.style('line-height', '1.5');
  
  const instructionsText = `
    <h2>How to Play</h2>
    <p>Defend your pillar from incoming enemies!</p>
    <p><strong>Controls:</strong></p>
    <p>C - Spawn Clone</p>
    <p>T - Deploy Turret</p>
    <p>A - Call Airstrike</p>
    <p>L - Fire Laser</p>
    <p>Middle Mouse - Rotate Camera</p>
    <p>Mouse Wheel - Zoom In/Out</p>
  `;
  
  instructions.html(instructionsText);
  menuContainer.child(instructions);
  
  return menuContainer;
}

// Create pause menu
function createPauseMenu() {
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
  
  return pauseMenu;
}

// Create game over screen
function createGameOverScreen() {
  const gameOverScreen = createElement('div');
  gameOverScreen.id('game-over-screen');
  gameOverScreen.style('position', 'fixed');
  gameOverScreen.style('top', '0');
  gameOverScreen.style('left', '0');
  gameOverScreen.style('width', '100%');
  gameOverScreen.style('height', '100%');
  gameOverScreen.style('display', 'none');
  gameOverScreen.style('flex-direction', 'column');
  gameOverScreen.style('justify-content', 'center');
  gameOverScreen.style('align-items', 'center');
  gameOverScreen.style('background', 'rgba(0, 0, 0, 0.8)');
  gameOverScreen.style('z-index', '300');
  
  // Title (will be set dynamically)
  const title = createElement('h1', '');
  title.id('game-over-title');
  title.style('color', 'white');
  title.style('font-family', 'Arial, sans-serif');
  title.style('margin-bottom', '20px');
  gameOverScreen.child(title);
  
  // Stats
  const stats = createElement('div');
  stats.id('game-over-stats');
  stats.style('color', 'white');
  stats.style('font-family', 'Arial, sans-serif');
  stats.style('font-size', '20px');
  stats.style('margin-bottom', '40px');
  stats.style('text-align', 'center');
  gameOverScreen.child(stats);
  
  // Restart button
  const restartButton = createButton('Play Again');
  restartButton.style('padding', '15px 30px');
  restartButton.style('font-size', '20px');
  restartButton.style('margin-bottom', '20px');
  restartButton.style('cursor', 'pointer');
  restartButton.style('background', '#4CAF50');
  restartButton.style('color', 'white');
  restartButton.style('border', 'none');
  restartButton.style('border-radius', '5px');
  restartButton.mousePressed(() => {
    resetGame();
    gameState.currentState = 'playing';
    gameOverScreen.style('display', 'none');
    loop();
  });
  gameOverScreen.child(restartButton);
  
  // Menu button
  const menuButton = createButton('Main Menu');
  menuButton.style('padding', '15px 30px');
  menuButton.style('font-size', '20px');
  menuButton.style('cursor', 'pointer');
  menuButton.style('background', '#2196F3');
  menuButton.style('color', 'white');
  menuButton.style('border', 'none');
  menuButton.style('border-radius', '5px');
  menuButton.mousePressed(() => {
    resetGame();
    gameState.currentState = 'menu';
    gameOverScreen.style('display', 'none');
    document.getElementById('menu-container').style.display = 'flex';
    loop();
  });
  gameOverScreen.child(menuButton);
  
  return gameOverScreen;
}

// Update the status board with current game state
function updateStatusBoard() {
  if (gameState.currentState !== 'playing') return;
  
  // Update stats
  select('#pillar-height').html(Math.ceil(gameState.pillarHeight));
  select('#health').html(Math.ceil(gameState.playerHealth));
  
  // Get kills from enemy controller
  if (gameState.enemyController) {
    select('#kills').html(gameState.enemyController.getEnemiesKilled());
  }
  
  // Update cooldowns
  const cooldownIds = {
    clone: 'clone-cd',
    turret: 'turret-cd',
    airstrike: 'airstrike-cd',
    laser: 'laser-cd'
  };
  
  for (const skill in gameState.skillCooldowns) {
    const element = select('#' + cooldownIds[skill]);
    if (gameState.skillCooldowns[skill] > 0) {
      const seconds = Math.ceil(gameState.skillCooldowns[skill] / 60);
      element.html(seconds + 's');
    } else {
      element.html('Ready');
    }
  }
}

// Show cooldown message in the popup
function showCooldownMessage(skillName, cooldown) {
  const popup = select('#cooldown-popup');
  popup.html(`${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`);
  popup.style('opacity', '1');

  // Clear existing timer
  if (gameState.popupTimer) clearTimeout(gameState.popupTimer);

  // Hide popup after 2 seconds
  gameState.popupTimer = setTimeout(() => {
    popup.style('opacity', '0');
  }, 2000);
}

// Show game over screen
function showGameOverScreen(isVictory) {
  const gameOverScreen = select('#game-over-screen');
  const title = select('#game-over-title');
  const stats = select('#game-over-stats');
  
  if (isVictory) {
    title.html('Victory!');
    title.style('color', '#4CAF50');
  } else {
    title.html('Game Over');
    title.style('color', '#F44336');
  }
  
  stats.html(`
    <p>Enemies Killed: ${gameState.enemiesKilled}</p>
    <p>Pillar Height: ${Math.ceil(gameState.pillarHeight)}</p>
    <p>Health Remaining: ${Math.ceil(gameState.playerHealth)}</p>
  `);
  
  gameOverScreen.style('display', 'flex');
}