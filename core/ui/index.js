// UI Module Index
// Exports all UI components from their respective modules

import { createStatusBoard, updateStatusBoard } from './statusBoard.js';
import { createMenuUI } from './menuUI.js';
import { createPauseMenu } from './pauseMenu.js';
import { createGameOverScreen, showGameOverScreen } from './gameOverScreen.js';
import { showCooldownMessage } from './cooldownPopup.js';
import { createVirtualKeyboard, updateVirtualKeyboard } from './virtualKeyboard.js';

export {
  createStatusBoard,
  updateStatusBoard,
  createMenuUI,
  createPauseMenu,
  createGameOverScreen,
  showGameOverScreen,
  showCooldownMessage,
  createVirtualKeyboard,
  updateVirtualKeyboard
};