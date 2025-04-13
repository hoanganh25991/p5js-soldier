// Game Over Screen UI Component
// Displays the game over or victory screen with stats and restart options

import { gameState } from '../gameState.js';
import { resetGame } from '../managers/gameManager.js';

// Create game over screen
export function createGameOverScreen() {
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

// Show game over screen
export function showGameOverScreen(isVictory) {
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
    <p>Tower Height: ${Math.ceil(gameState.towerHeight)}</p>
    <p>Health Remaining: ${Math.ceil(gameState.playerHealth)}</p>
  `);
  
  gameOverScreen.style('display', 'flex');
}