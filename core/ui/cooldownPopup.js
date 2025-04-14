// Cooldown Popup UI Component
// Shows temporary messages when skills are on cooldown or for game events

import { gameState } from '../gameState.js';
import { applyStyles } from './uiUtils.js';

// Default message styles
const messageStyles = {
  background: 'rgba(0, 0, 0, 0.6)',
  padding: '8px 15px',
  borderRadius: '5px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  opacity: '0.8',
  transition: 'opacity 0.3s',
  marginBottom: '5px'
};

// Constants
const DEFAULT_DURATION_FRAMES = 180; // 3 seconds at 60fps
const FADE_TRANSITION_MS = 300;

/**
 * Show cooldown message in the popup
 * @param {string} skillName - Name of the skill
 * @param {number} cooldown - Cooldown time in frames
 */
export function showCooldownMessage(skillName, cooldown) {
  const text = cooldown === 0 
    ? skillName 
    : `${skillName} on cooldown: ${Math.ceil(cooldown / 60)}s`;
    
  showPopupMessage({
    text,
    color: [255, 255, 255], // White color for cooldown messages
    duration: DEFAULT_DURATION_FRAMES
  });
}

/**
 * Show a general popup message
 * @param {Object} message - Message configuration object
 * @param {string} message.text - Message text content
 * @param {number[]} [message.color] - RGB color array [r,g,b]
 * @param {number} [message.duration] - Duration in frames
 */
export function showPopupMessage(message) {
  const popupContainer = select('#cooldown-popup');
  if (!popupContainer) return;
  
  // Create a new message element
  const messageElement = createElement('div');
  messageElement.class('popup-message');
  
  // Apply default styles
  applyStyles(messageElement, messageStyles);
  
  // Set text color based on message configuration
  const color = message.color || [255, 255, 255]; // Default to white
  messageElement.style('color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
  
  // Set the message content
  messageElement.html(message.text);
  
  // Add the message to the container
  popupContainer.child(messageElement);
  
  // Calculate display duration (default to 3 seconds if not specified)
  const displayDuration = message.duration 
    ? message.duration / 60 * 1000 
    : 3000;
  
  // Set a timer to remove this specific message
  setTimeout(() => {
    // Fade out
    messageElement.style('opacity', '0');
    
    // Remove from DOM after fade completes
    setTimeout(() => {
      messageElement.remove();
    }, FADE_TRANSITION_MS);
  }, displayDuration);
}

// Alias for showPopupMessage for backward compatibility
export const addCooldownMessage = showPopupMessage;