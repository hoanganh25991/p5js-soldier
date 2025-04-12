// Game State Module
// Centralizes game state management

import CONFIG from './config.js';
import { initializeSkillState } from './skills.js';

// Create the game state object
const gameState = {
  // Game state management
  currentState: 'menu', // menu, playing, paused, gameOver
  frameCount: 0,
  pillarHeight: CONFIG.PILLAR_HEIGHT,
  playerHealth: CONFIG.PLAYER_HEALTH,
  
  // Legacy skill cooldowns (for backward compatibility)
  skillCooldowns: {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0,
    'game-boy-advanced': 0,
    'gas-lighter': 0
  },
  
  // New skill system
  skills: initializeSkillState(),
  
  // Camera control variables
  zoomLevel: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  
  // Game objects
  player: null,
  pillar: null,
  bullets: [],
  enemies: [],
  clones: [],
  turrets: [],
  airstrikes: [],
  lasers: [],
  gbas: [],
  gameCharacters: [],
  waves: [],
  gasLighters: [],
  fireSkills: [],
  
  // Game stats
  enemiesKilled: 0,
  
  // UI elements
  ui: {
    statusBoard: null,
    menuScreen: null,
    pauseMenu: null,
    gameOverScreen: null
  },
  
  // Sound effects
  shootSound: null,
  cloneSound: null,
  
  // Camera
  camera: null
};

// Reset game state to initial values
function resetGameState() {
  gameState.frameCount = 0;
  gameState.pillarHeight = CONFIG.PILLAR_HEIGHT;
  gameState.playerHealth = CONFIG.PLAYER_HEALTH;
  gameState.zoomLevel = 1.0;
  gameState.isDragging = false;
  gameState.enemiesKilled = 0;
  
  // Reset skills
  gameState.skills = initializeSkillState();
  
  // Reset legacy cooldowns (for backward compatibility)
  gameState.skillCooldowns = {
    clone: 0,
    turret: 0,
    airstrike: 0,
    laser: 0,
    'game-boy-advanced': 0,
    'gas-lighter': 0
  };
  
  // Clear game objects
  gameState.bullets = [];
  gameState.enemies = [];
  gameState.clones = [];
  gameState.turrets = [];
  gameState.airstrikes = [];
  gameState.lasers = [];
  gameState.gbas = [];
  gameState.gameCharacters = [];
  gameState.waves = [];
  gameState.gasLighters = [];
  gameState.fireSkills = [];
}

export { gameState, resetGameState };