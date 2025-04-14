// Cooldown Popup UI Component
// Shows temporary messages when skills are on cooldown

import { gameState } from '../gameState.js';

// Show cooldown message in the popup
export function showCooldownMessage(skillName, cooldown) {
  const popup = select('#cooldown-popup');
  
  // If cooldown is 0, it's an informational message, not a cooldown
  if (cooldown === 0) {
    popup.html(`${skillName}`);
  } else {
    popup.html(`${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`);
  }
  
  // Show the popup with semi-transparency
  popup.style('opacity', '0.8');
  
  // Clear existing timer
  if (gameState.popupTimer) clearTimeout(gameState.popupTimer);
  
  // Store current messages in an array if not exists
  if (!gameState.messageQueue) {
    gameState.messageQueue = [];
  }
  
  // Add this message to the queue
  gameState.messageQueue.push({
    message: popup.html(),
    timestamp: Date.now()
  });
  
  // Only keep the last 3 messages
  if (gameState.messageQueue.length > 3) {
    gameState.messageQueue.shift();
  }
  
  // Update the popup with all messages
  let allMessages = '';
  gameState.messageQueue.forEach(msg => {
    allMessages += `<div>${msg.message}</div>`;
  });
  popup.html(allMessages);
  
  // Hide popup after 3 seconds
  gameState.popupTimer = setTimeout(() => {
    // Remove the oldest message
    if (gameState.messageQueue.length > 0) {
      gameState.messageQueue.shift();
      
      // If there are still messages, update the display
      if (gameState.messageQueue.length > 0) {
        let remainingMessages = '';
        gameState.messageQueue.forEach(msg => {
          remainingMessages += `<div>${msg.message}</div>`;
        });
        popup.html(remainingMessages);
      } else {
        // If no messages left, hide the popup
        popup.style('opacity', '0');
      }
    } else {
      popup.style('opacity', '0');
    }
  }, 3000);
}