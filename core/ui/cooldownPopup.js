// Cooldown Popup UI Component
// Shows temporary messages when skills are on cooldown or for game events

import { gameState } from '../gameState.js';

// Show cooldown message in the popup
export function showCooldownMessage(skillName, cooldown) {
  // Create a message object and pass it to the general message function
  const message = {
    text: cooldown === 0 ? `${skillName}` : `${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`,
    color: [255, 255, 255], // White color for cooldown messages
    duration: 180 // 3 seconds at 60fps
  };
  
  showPopupMessage(message);
}

// Show a general popup message
export function showPopupMessage(message) {
  const popupContainer = select('#cooldown-popup');
  
  // Create a new message element
  const messageElement = createElement('div');
  messageElement.class('popup-message');
  
  // Style the message
  messageElement.style('background', 'rgba(0, 0, 0, 0.6)');
  
  // Set text color based on message configuration
  const color = message.color || [255, 255, 255]; // Default to white
  messageElement.style('color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
  
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
  messageElement.html(message.text);
  
  // Add the message to the container
  popupContainer.child(messageElement);
  
  // Calculate display duration (default to 3 seconds if not specified)
  const displayDuration = message.duration ? message.duration / 60 * 1000 : 3000;
  
  // Set a timer to remove this specific message
  setTimeout(() => {
    // Fade out
    messageElement.style('opacity', '0');
    
    // Remove from DOM after fade completes
    setTimeout(() => {
      messageElement.remove();
    }, 300); // Match the transition time
  }, displayDuration);
}

// Add a message to the game state for display
export function addCooldownMessage(message) {
  showPopupMessage(message);
}