// Cooldown Popup UI Component
// Shows temporary messages when skills are on cooldown

import { gameState } from '../gameState.js';

// Show cooldown message in the popup
export function showCooldownMessage(skillName, cooldown) {
  const popup = select('#cooldown-popup');
  popup.html(`${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`);
  popup.style('opacity', '1');

  // Clear existing timer
  if (gameState.popupTimer) clearTimeout(gameState.popupTimer);

  // Hide popup after 2 seconds
  gameState.popupTimer = setTimeout(() => {
    popup.style('opacity', '0');
  }, 2000);
}