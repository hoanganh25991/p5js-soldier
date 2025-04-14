// Status Board UI Component
// Displays game stats and skill cooldowns

import CONFIG from '../../config.js';
import { gameState } from '../gameState.js';
import { applyStyles } from './uiUtils.js';

// Status board styles
const statusBoardStyles = {
  position: 'fixed',
  top: '10px',
  left: '10px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '10px',
  borderRadius: '5px',
  fontFamily: 'Arial, sans-serif',
  zIndex: '100'
};

// Boss info styles
const bossInfoStyles = {
  display: 'none',
  marginTop: '10px',
  padding: '5px',
  background: 'rgba(255, 0, 0, 0.3)',
  border: '1px solid red',
  borderRadius: '3px'
};

// Cooldown popup styles
const cooldownPopupStyles = {
  position: 'fixed',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '33%',
  pointerEvents: 'none',
  zIndex: '200',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '5px'
};

// Color constants for progress indicators
const COLORS = {
  GREEN: '#00ff00',
  YELLOW: '#ffff00',
  ORANGE: '#ff9900',
  RED: '#ff0000',
  WHITE: '#ffffff'
};

/**
 * Create a stat display element with label and value
 * @param {string} label - The label text
 * @param {string} value - The initial value
 * @param {string} id - The ID for the value span
 * @returns {Element} The created div element
 */
function createStatDisplay(label, value, id) {
  const div = createElement('div', label);
  const span = createElement('span', value);
  span.id(id);
  div.child(span);
  return div;
}

/**
 * Create the status board UI element
 * @returns {Object} Object containing statusBoard and cooldownPopup elements
 */
export function createStatusBoard() {
  // Create main status board container
  const statusBoard = createElement('div');
  statusBoard.id('status-board');
  applyStyles(statusBoard, statusBoardStyles);

  // Add stat displays
  const statDisplays = [
    { label: 'FPS: ', value: '0', id: 'fps' },
    { label: 'Tower Height: ', value: '100', id: 'tower-height' },
    { label: 'Health: ', value: '100', id: 'health' },
    { label: 'Enemies Killed: ', value: '0', id: 'kills' },
    { label: 'Wave: ', value: '1', id: 'current-wave' },
    { label: 'Next Wave: ', value: '0/30', id: 'wave-progress' }
  ];
  
  // Add all stat displays to the status board
  statDisplays.forEach(stat => {
    statusBoard.child(createStatDisplay(stat.label, stat.value, stat.id));
  });
  
  // Create boss information display
  const bossDiv = createElement('div');
  bossDiv.id('boss-info');
  applyStyles(bossDiv, bossInfoStyles);
  
  // Add boss stats
  const bossStats = [
    { label: 'Boss: ', id: 'boss-name' },
    { label: 'Health: ', id: 'boss-health' }
  ];
  
  bossStats.forEach(stat => {
    bossDiv.child(createStatDisplay(stat.label, '', stat.id));
  });
  
  // Add boss div to status board
  statusBoard.child(bossDiv);
  
  // Create cooldown popup container
  const cooldownPopup = createElement('div');
  cooldownPopup.id('cooldown-popup');
  applyStyles(cooldownPopup, cooldownPopupStyles);
  
  return {
    statusBoard,
    cooldownPopup
  };
}

/**
 * Update the status board with current game state
 */
export function updateStatusBoard() {
  if (gameState.currentState !== 'playing') return;
  
  // Update basic stats
  updateBasicStats();
  
  // Update enemy and wave information
  updateEnemyInfo();
  
  // Update boss information
  updateBossInfo();
  
  // Update skill cooldowns
  updateSkillCooldowns();
}

/**
 * Update basic game stats (FPS, tower height, health)
 */
function updateBasicStats() {
  select('#fps').html(Math.floor(frameRate()));
  select('#tower-height').html(Math.ceil(gameState.towerHeight));
  select('#health').html(Math.ceil(gameState.playerHealth));
}

/**
 * Update enemy and wave information
 */
function updateEnemyInfo() {
  if (!gameState.enemyController) return;
  
  // Update total kills
  select('#kills').html(gameState.enemyController.getEnemiesKilled());
  
  // Update wave information
  const currentWave = gameState.enemyController.getCurrentWave();
  select('#current-wave').html(currentWave);
  
  // Update wave progress
  const killsInWave = gameState.enemyController.getKillsInCurrentWave();
  const enemiesPerWave = gameState.enemyController.enemiesPerWave;
  select('#wave-progress').html(`${killsInWave}/${enemiesPerWave}`);
  
  // Color the wave progress based on percentage
  const progressPercent = (killsInWave / enemiesPerWave) * 100;
  let progressColor;
  
  if (progressPercent > 75) {
    progressColor = COLORS.GREEN;
  } else if (progressPercent > 50) {
    progressColor = COLORS.YELLOW;
  } else if (progressPercent > 25) {
    progressColor = COLORS.ORANGE;
  } else {
    progressColor = COLORS.RED;
  }
  
  select('#wave-progress').style('color', progressColor);
}

/**
 * Update boss information if a boss is present
 */
function updateBossInfo() {
  const bossInfoDiv = select('#boss-info');
  if (!bossInfoDiv) return;
  
  if (gameState.bosses && gameState.bosses.length > 0) {
    // Show boss info
    bossInfoDiv.style('display', 'block');
    
    // Get the first boss
    const boss = gameState.bosses[0];
    
    // Update boss name
    select('#boss-name').html(boss.name || 'Unknown');
    
    // Update boss health
    const healthPercent = Math.floor((boss.health / boss.maxHealth) * 100);
    select('#boss-health').html(
      `${Math.ceil(boss.health)} / ${Math.ceil(boss.maxHealth)} (${healthPercent}%)`
    );
    
    // Color the health text based on percentage
    let healthColor;
    
    if (healthPercent > 60) {
      healthColor = COLORS.GREEN;
    } else if (healthPercent > 30) {
      healthColor = COLORS.YELLOW;
    } else {
      healthColor = COLORS.RED;
    }
    
    select('#boss-health').style('color', healthColor);
  } else {
    // Hide boss info if no boss is active
    bossInfoDiv.style('display', 'none');
  }
}

/**
 * Update skill cooldowns
 */
function updateSkillCooldowns() {
  // Mapping of skill names to UI element IDs
  const cooldownIds = {
    clone: 'clone-cd',
    turret: 'turret-cd',
    airstrike: 'airstrike-cd',
    laser: 'laser-cd',
    'game-boy-advanced': 'gba-cd',
    'gas-lighter': 'gas-lighter-cd'
  };
  
  // Update each skill's cooldown display
  for (const skillName in gameState.skills) {
    const elementId = cooldownIds[skillName];
    if (!elementId) continue; // Skip if no UI element ID is defined
    
    const element = select('#' + elementId);
    if (!element) continue; // Skip if element doesn't exist in the DOM
    
    const skillState = gameState.skills[skillName];
    
    if (skillState.cooldownRemaining > 0) {
      // Skill is on cooldown
      const seconds = Math.ceil(skillState.cooldownRemaining / 60);
      element.html(seconds + 's');
      element.style('color', COLORS.WHITE);
    } else if (skillState.active) {
      // Skill is active
      const remainingDuration = Math.ceil((skillState.endTime - gameState.frameCount) / 60);
      element.html('Active (' + remainingDuration + 's)');
      element.style('color', COLORS.GREEN);
    } else {
      // Skill is ready
      element.html('Ready');
      element.style('color', COLORS.WHITE);
    }
  }
}