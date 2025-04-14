// Cooldown Popup UI Component
// Shows temporary messages when skills are on cooldown

import { gameState } from '../gameState.js';

// Show cooldown message in the popup
export function showCooldownMessage(skillName, cooldown) {
  const popupContainer = select('#cooldown-popup');
  
  // Create a new message element
  const messageElement = createElement('div');
  messageElement.class('cooldown-message');
  
  // Style the message
  messageElement.style('background', 'rgba(0, 0, 0, 0.6)');
  messageElement.style('color', 'white');
  messageElement.style('padding', '8px 15px');
  messageElement.style('border-radius', '5px');
  messageElement.style('font-family', 'Arial, sans-serif');
  messageElement.style('font-size', '16px'); // Smaller font size
  messageElement.style('font-weight', 'bold');
  messageElement.style('text-align', 'center');
  messageElement.style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.5)');
  messageElement.style('opacity', '0.8');
  messageElement.style('transition', 'opacity 0.3s');
  messageElement.style('margin-bottom', '5px');
  
  // Set the message content
  if (cooldown === 0) {
    messageElement.html(`${skillName}`);
  } else {
    messageElement.html(`${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`);
  }
  
  // Add the message to the container
  popupContainer.child(messageElement);
  
  // Set a timer to remove this specific message
  setTimeout(() => {
    // Fade out
    messageElement.style('opacity', '0');
    
    // Remove from DOM after fade completes
    setTimeout(() => {
      messageElement.remove();
    }, 300); // Match the transition time
  }, 3000);
}