// Menu UI Component
// Displays the main menu with game title, start button and instructions

import { gameState } from '../gameState.js';

// Create menu UI
export function createMenuUI() {
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
  const title = createElement('h1', 'Soldier Tower');
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
    <p>Defend your tower from incoming enemies!</p>
    <p><strong>Controls:</strong></p>
    <p>C - Spawn Clone</p>
    <p>T - Deploy Turret</p>
    <p>A - Call Airstrike</p>
    <p>L - Fire Laser</p>
    <p>G - Throw Game Boy Advanced (summons game characters)</p>
    <p>F - Throw Gas Lighter (casts fire skills)</p>
    <p>Middle Mouse - Rotate Camera</p>
    <p>Mouse Wheel - Zoom In/Out</p>
  `;
  
  instructions.html(instructionsText);
  menuContainer.child(instructions);
  
  return menuContainer;
}