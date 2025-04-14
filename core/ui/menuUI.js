// Menu UI Component
// Displays the main menu with game title, start button and instructions

import { gameState } from '../gameState.js';
import { 
  createOverlay, 
  createTitle, 
  createStyledButton, 
  applyStyles, 
  styles 
} from './uiUtils.js';

// Instruction styles
const instructionStyles = {
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  width: '60%',
  textAlign: 'center',
  lineHeight: '1.5'
};

/**
 * Create main menu UI
 * @returns {Element} The menu container element
 */
export function createMenuUI() {
  // Create the main overlay with initial display set to 'flex'
  const menuContainer = createOverlay('menu-container', 'flex');
  
  // Title
  const title = createTitle('Soldier Tower');
  menuContainer.child(title);
  
  // Start button
  const startButton = createStyledButton(
    'Start Game', 
    styles.buttonColors.primary, 
    () => {
      gameState.currentState = 'playing';
      menuContainer.style('display', 'none');
    }
  );
  menuContainer.child(startButton);
  
  // Instructions (commented out in original code)
  // Keeping this for future reference but maintaining the commented state
  const instructions = createElement('div');
  applyStyles(instructions, instructionStyles);
  
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
    <p><strong>Camera Controls (top right):</strong></p>
    <p>+ / - Buttons - Zoom In/Out</p>
    <p>← / → Buttons - Rotate Camera Left/Right</p>
    <p>↑ / ↓ Buttons - Rotate Camera Up/Down</p>
  `;
  
  // Keeping these commented as they were in the original
  // instructions.html(instructionsText);
  // menuContainer.child(instructions);
  
  return menuContainer;
}