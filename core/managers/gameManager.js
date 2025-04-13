// Game Manager
// Handles game state, win/lose conditions, and game reset

import CONFIG from '../config.js';
import { resetGameState } from '../gameState.js';
import { Player } from '../entities/player.js';
import { Pillar } from '../entities/pillar.js';
import { EnemyController } from '../controllers/enemyController.js';
import { initializeUpgrades, applyUpgrades, awardXP, incrementCombo } from '../progression.js';
import { updateStatusBoard, showGameOverScreen } from '../ui.js';

/**
 * Reset game to initial state
 * @param {Object} gameState - The global game state
 */
export function resetGame(gameState) {
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

/**
 * Check game end conditions (win/lose)
 * @param {Object} gameState - The global game state
 */
export function checkGameEndConditions(gameState) {
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