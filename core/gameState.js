// Game State Module
// Centralizes game state management

import CONFIG from './config.js';
import { initializeSkillState } from './skills.js';

// Create the game state object
const gameState = {
  // Game state management
  currentState: 'menu', // menu, playing, paused, gameOver, levelUp
  previousState: null, // Store previous state when entering levelUp
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
  powerUps: [], // New array for power-ups
  
  // Game stats
  enemiesKilled: 0,
  score: 0,
  combo: 0,
  comboTimer: 0,
  maxCombo: 0,
  
  // Progression system
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  skillPoints: 0,
  
  // Environment effects
  timeOfDay: 0, // 0-1 value representing time of day (0 = midnight, 0.5 = noon, 1 = midnight again)
  dayLength: 3600, // One day lasts this many frames (1 minute at 60fps)
  weather: 'clear', // clear, rain, storm, fog
  weatherIntensity: 0, // 0-1 value for intensity
  weatherTimer: 0, // Timer for weather changes
  rainParticles: [], // Array to store rain particles
  ambientLight: 100, // Default ambient light level
  fogDensity: 0, // Fog density (0-1)
  
  // UI elements
  ui: {
    statusBoard: null,
    menuScreen: null,
    pauseMenu: null,
    gameOverScreen: null,
    levelUpScreen: null
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
  gameState.currentState = 'menu';
  gameState.previousState = null;
  gameState.pillarHeight = CONFIG.PILLAR_HEIGHT;
  gameState.playerHealth = CONFIG.PLAYER_HEALTH;
  gameState.zoomLevel = 1.0;
  gameState.isDragging = false;
  gameState.enemiesKilled = 0;
  
  // Reset progression
  gameState.score = 0;
  gameState.combo = 0;
  gameState.comboTimer = 0;
  gameState.maxCombo = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNextLevel = 1000;
  gameState.skillPoints = 0;
  
  // Reset environment
  gameState.timeOfDay = 0.5; // Start at noon
  gameState.weather = 'clear';
  gameState.weatherIntensity = 0;
  gameState.weatherTimer = random(600, 1800); // Random time until first weather change
  gameState.rainParticles = [];
  gameState.ambientLight = 100;
  gameState.fogDensity = 0;
  
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
  gameState.powerUps = [];
}

export { gameState, resetGameState };