// Game Over Screen UI Component
// Displays the game over or victory screen with stats and restart options

import { gameState } from '../gameState.js';
import { resetGame } from '../managers/gameManager.js';
import { 
  createOverlay, 
  createTitle, 
  createStyledButton, 
  applyStyles, 
  styles 
} from './uiUtils.js';

// Stats display styles
const statsStyles = {
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  fontSize: '20px',
  marginBottom: '40px',
  textAlign: 'center'
};

/**
 * Create game over screen
 * @returns {Element} The game over screen element
 */
export function createGameOverScreen() {
  // Create the main overlay
  const gameOverScreen = createOverlay('game-over-screen');
  
  // Title (will be set dynamically)
  const title = createTitle('');
  title.id('game-over-title');
  gameOverScreen.child(title);
  
  // Stats
  const stats = createElement('div');
  stats.id('game-over-stats');
  applyStyles(stats, statsStyles);
  gameOverScreen.child(stats);
  
  // Restart button
  const restartButton = createStyledButton(
    'Play Again', 
    styles.buttonColors.primary, 
    () => {
      resetGame(gameState);
      gameState.currentState = 'playing';
      gameOverScreen.style('display', 'none');
      loop();
    }
  );
  gameOverScreen.child(restartButton);
  
  // Menu button
  const menuButton = createStyledButton(
    'Main Menu', 
    styles.buttonColors.secondary, 
    () => {
      resetGame(gameState);
      gameState.currentState = 'menu';
      gameOverScreen.style('display', 'none');
      document.getElementById('menu-container').style.display = 'flex';
      loop();
    }
  );
  gameOverScreen.child(menuButton);
  
  return gameOverScreen;
}

/**
 * Show game over screen with updated stats
 * @param {boolean} isVictory - Whether the player won
 */
export function showGameOverScreen(isVictory) {
  const gameOverScreen = select('#game-over-screen');
  const title = select('#game-over-title');
  const stats = select('#game-over-stats');
  
  if (!gameOverScreen || !title || !stats) return;
  
  // Set title based on game outcome
  if (isVictory) {
    title.html('Victory!');
    title.style('color', styles.buttonColors.primary); // Green for victory
  } else {
    title.html('Game Over');
    title.style('color', styles.buttonColors.danger); // Red for defeat
  }
  
  // Update stats
  stats.html(`
    <p>Enemies Killed: ${gameState.enemiesKilled}</p>
    <p>Tower Height: ${Math.ceil(gameState.towerHeight)}</p>
    <p>Health Remaining: ${Math.ceil(gameState.playerHealth)}</p>
  `);
  
  // Show the screen
  gameOverScreen.style('display', 'flex');
}