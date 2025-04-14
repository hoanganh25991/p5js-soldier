// Mouse Controls Module
// Handles mouse wheel zooming and camera rotation via dragging

/**
 * Initialize mouse controls
 * @param {Object} gameState - The current game state
 */
function initMouseControls(gameState) {
  // This function is kept for potential future enhancements
  console.log("Mouse controls initialized");
}

/**
 * Handle mouse wheel for zooming and field of view adjustment
 * @param {Object} event - The mouse wheel event
 * @param {Object} gameState - The current game state
 * @returns {boolean} - False to prevent default scrolling
 */
function handleMouseWheel(event, gameState) {
  // Only allow zooming in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Check if shift key is pressed for field of view adjustment
  if (keyIsDown(SHIFT)) {
    // Adjust field of view with mouse wheel when shift is pressed
    // Rolling forward (negative delta) decreases FOV (narrower view)
    // Rolling backward (positive delta) increases FOV (wider view)
    const fovAdjustment = event.delta * 0.0005;
    gameState.fieldOfView = gameState.fieldOfView + fovAdjustment;
    
    // Update perspective with new field of view
    perspective(gameState.fieldOfView, width / height, 0.1, 5000);
  } else {
    // Regular zoom with mouse wheel
    // Rolling forward (negative delta) decreases zoom level (zooms in)
    // Rolling backward (positive delta) increases zoom level (zooms out)
    const zoomAdjustment = event.delta * 0.001;
    gameState.zoomLevel = gameState.zoomLevel + zoomAdjustment;
  }
  
  return false; // Prevent default scrolling
}

/**
 * Handle mouse press for camera rotation
 * @param {Object} gameState - The current game state
 */
function handleMousePressed(gameState) {
  // Only allow camera control in playing state
  if (gameState.currentState !== 'playing') return;
  
  // Start dragging with middle mouse button
  if (mouseButton === CENTER) {
    gameState.isDragging = true;
    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }
}

/**
 * Handle mouse release to stop camera rotation
 * @param {Object} gameState - The current game state
 */
function handleMouseReleased(gameState) {
  if (mouseButton === CENTER) {
    gameState.isDragging = false;
  }
}

/**
 * Setup p5.js mouse event handlers
 * @param {Object} p5Instance - The p5.js instance
 * @param {Object} gameState - The current game state
 */
function setupMouseHandlers(p5Instance, gameState) {
  // Attach these handlers to the p5 instance
  p5Instance.mouseWheel = (event) => handleMouseWheel(event, gameState);
  p5Instance.mousePressed = () => handleMousePressed(gameState);
  p5Instance.mouseReleased = () => handleMouseReleased(gameState);
}

export { 
  initMouseControls, 
  handleMouseWheel, 
  handleMousePressed, 
  handleMouseReleased,
  setupMouseHandlers
};