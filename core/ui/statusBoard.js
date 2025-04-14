// Status Board UI Component
// Displays game stats and skill cooldowns

import CONFIG from '../config.js';
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
  
  // Create skills header
  const skillsHeader = createElement('div', 'Skills (Cooldown):');
  statusBoard.child(skillsHeader);
  
  // Create skill entries
  const skills = [
    { key: 'C', name: 'Clone', id: 'clone-cd' },
    { key: 'T', name: 'Turret', id: 'turret-cd' },
    { key: 'A', name: 'Airstrike', id: 'airstrike-cd' },
    { key: 'L', name: 'Laser', id: 'laser-cd' },
    { key: 'G', name: 'Game Boy Advanced', id: 'gba-cd' },
    { key: 'F', name: 'Gas Lighter', id: 'gas-lighter-cd' }
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
  cooldownPopup.style('top', '20px'); // Position at top
  cooldownPopup.style('right', '20px'); // Position at right
  cooldownPopup.style('transform', 'none'); // Remove the centering transform
  cooldownPopup.style('background', 'rgba(0, 0, 0, 0.6)'); // More transparent background
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
  cooldownPopup.style('text-align', 'center'); // Center text
  cooldownPopup.style('max-width', '33%'); // Limit width to 1/3 of screen
  cooldownPopup.style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)'); // Add subtle shadow
  
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
  
  // Get kills from enemy controller
  if (gameState.enemyController) {
    select('#kills').html(gameState.enemyController.getEnemiesKilled());
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