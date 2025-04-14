// Status Board UI Component
// Displays game stats and skill cooldowns

import CONFIG from '../../config.js';
import { gameState } from '../gameState.js';

// Create the status board UI element
export function createStatusBoard() {
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

  // FPS
  const fpsDiv = createElement('div', 'FPS: ');
  const fpsSpan = createElement('span', '0');
  fpsSpan.id('fps');
  fpsDiv.child(fpsSpan);
  statusBoard.child(fpsDiv);
  
  // Create tower height display
  const towerHeightDiv = createElement('div', 'Tower Height: ');
  const towerHeightSpan = createElement('span', '100');
  towerHeightSpan.id('tower-height');
  towerHeightDiv.child(towerHeightSpan);
  statusBoard.child(towerHeightDiv);
  
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
  
  // Create wave display
  const waveDiv = createElement('div', 'Wave: ');
  const waveSpan = createElement('span', '1');
  waveSpan.id('current-wave');
  waveDiv.child(waveSpan);
  statusBoard.child(waveDiv);
  
  // Create wave progress display
  const waveProgressDiv = createElement('div', 'Next Wave: ');
  const waveProgressSpan = createElement('span', '0/30');
  waveProgressSpan.id('wave-progress');
  waveProgressDiv.child(waveProgressSpan);
  statusBoard.child(waveProgressDiv);
  
  // Create boss information display (hidden by default)
  const bossDiv = createElement('div');
  bossDiv.id('boss-info');
  bossDiv.style('display', 'none'); // Hidden by default
  bossDiv.style('margin-top', '10px');
  bossDiv.style('padding', '5px');
  bossDiv.style('background', 'rgba(255, 0, 0, 0.3)');
  bossDiv.style('border', '1px solid red');
  bossDiv.style('border-radius', '3px');
  
  // Boss name
  const bossNameDiv = createElement('div', 'Boss: ');
  const bossNameSpan = createElement('span', '');
  bossNameSpan.id('boss-name');
  bossNameDiv.child(bossNameSpan);
  bossDiv.child(bossNameDiv);
  
  // Boss health
  const bossHealthDiv = createElement('div', 'Health: ');
  const bossHealthSpan = createElement('span', '');
  bossHealthSpan.id('boss-health');
  bossHealthDiv.child(bossHealthSpan);
  bossDiv.child(bossHealthDiv);
  
  // Add boss div to status board
  statusBoard.child(bossDiv);
  
  // TODO: Create skills header
  // const skillsHeader = createElement('div', 'Skills (Cooldown):');
  // statusBoard.child(skillsHeader);
  
  // // Create skill entries
  // const skills = [
  //   { key: 'C', name: 'Clone', id: 'clone-cd' },
  //   { key: 'T', name: 'Turret', id: 'turret-cd' },
  //   { key: 'A', name: 'Airstrike', id: 'airstrike-cd' },
  //   { key: 'L', name: 'Laser', id: 'laser-cd' },
  //   { key: 'G', name: 'Game Boy Advanced', id: 'gba-cd' },
  //   { key: 'F', name: 'Gas Lighter', id: 'gas-lighter-cd' }
  // ];
  
  // skills.forEach((skill, index) => {
  //   const skillDiv = createElement('div', `${index + 1}: ${skill.name} (${skill.key}) - `);
  //   const skillSpan = createElement('span', 'Ready');
  //   skillSpan.id(skill.id);
  //   skillDiv.child(skillSpan);
  //   statusBoard.child(skillDiv);
  // });
  
  // TODO: Create cooldown popup container
  const cooldownPopup = createElement('div');
  cooldownPopup.id('cooldown-popup');
  cooldownPopup.style('position', 'fixed');
  cooldownPopup.style('top', '20px'); // Position at top
  cooldownPopup.style('left', '50%'); // Center horizontally
  cooldownPopup.style('transform', 'translateX(-50%)'); // Center horizontally
  cooldownPopup.style('width', '33%'); // Width to 1/3 of screen
  cooldownPopup.style('pointer-events', 'none');
  cooldownPopup.style('z-index', '200');
  cooldownPopup.style('display', 'flex');
  cooldownPopup.style('flex-direction', 'column');
  cooldownPopup.style('align-items', 'center');
  cooldownPopup.style('gap', '5px'); // Space between messages
  
  return {
    statusBoard,
    cooldownPopup
  };
}

// Update the status board with current game state
export function updateStatusBoard() {
  if (gameState.currentState !== 'playing') return;
  
  // Update stats
  select('#fps').html(Math.floor(frameRate()));
  select('#tower-height').html(Math.ceil(gameState.towerHeight));
  select('#health').html(Math.ceil(gameState.playerHealth));
  
  // Get kills and wave information from enemy controller
  if (gameState.enemyController) {
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
    if (progressPercent > 75) {
      select('#wave-progress').style('color', '#00ff00'); // Green
    } else if (progressPercent > 50) {
      select('#wave-progress').style('color', '#ffff00'); // Yellow
    } else if (progressPercent > 25) {
      select('#wave-progress').style('color', '#ff9900'); // Orange
    } else {
      select('#wave-progress').style('color', '#ff0000'); // Red
    }
  }
  
  // Update boss information if there's an active boss
  const bossInfoDiv = select('#boss-info');
  if (gameState.bosses && gameState.bosses.length > 0) {
    // Show boss info
    bossInfoDiv.style('display', 'block');
    
    // Get the first boss (we'll only show info for one boss even if there are multiple)
    const boss = gameState.bosses[0];
    
    // Update boss name
    select('#boss-name').html(boss.name || 'Unknown');
    
    // Update boss health
    const healthPercent = Math.floor((boss.health / boss.maxHealth) * 100);
    select('#boss-health').html(`${Math.ceil(boss.health)} / ${Math.ceil(boss.maxHealth)} (${healthPercent}%)`);
    
    // Color the health text based on percentage
    if (healthPercent > 60) {
      select('#boss-health').style('color', '#00ff00'); // Green
    } else if (healthPercent > 30) {
      select('#boss-health').style('color', '#ffff00'); // Yellow
    } else {
      select('#boss-health').style('color', '#ff0000'); // Red
    }
  } else {
    // Hide boss info if no boss is active
    bossInfoDiv.style('display', 'none');
  }
  
  // Update cooldowns using the new skill system
  const cooldownIds = {
    clone: 'clone-cd',
    turret: 'turret-cd',
    airstrike: 'airstrike-cd',
    laser: 'laser-cd',
    'game-boy-advanced': 'gba-cd',
    'gas-lighter': 'gas-lighter-cd'
  };
  
  // Use new skill system for cooldowns
  for (const skillName in gameState.skills) {
    const elementId = cooldownIds[skillName];
    if (!elementId) continue; // Skip if no UI element ID is defined
    
    const element = select('#' + elementId);
    if (!element) continue; // Skip if element doesn't exist in the DOM
    
    const skillState = gameState.skills[skillName];
    
    if (skillState.cooldownRemaining > 0) {
      const seconds = Math.ceil(skillState.cooldownRemaining / 60);
      element.html(seconds + 's');
    } else if (skillState.active) {
      // Show active status for skills with duration
      const remainingDuration = Math.ceil((skillState.endTime - gameState.frameCount) / 60);
      element.html('Active (' + remainingDuration + 's)');
      element.style('color', '#00ff00'); // Green for active
    } else {
      element.html('Ready');
      element.style('color', 'white'); // Reset color
    }
  }
}