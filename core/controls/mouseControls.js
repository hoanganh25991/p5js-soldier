// Mouse Controls Module
// Handles mouse wheel zooming and camera rotation via dragging

// Initialize mouse controls
function initMouseControls(gameState) {
  // This function is kept for potential future enhancements
  console.log("Mouse controls initialized");
}

// Handle mouse wheel for zooming
function handleMouseWheel(event, gameState) {
  // Only allow zooming in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Zoom with mouse wheel - rolling forward (negative delta) decreases zoom level (zooms in)
  // rolling backward (positive delta) increases zoom level (zooms out)
  gameState.zoomLevel = constrain(gameState.zoomLevel + (event.delta * 0.001), 0.2, 15.0);
  return false; // Prevent default scrolling
}

// Handle mouse press for camera rotation
function handleMousePressed(gameState) {
  // Only allow camera control in playing state
  if (gameState.currentState !== 'playing') return;
  
  // Start dragging with middle mouse button (button 1)
  if (mouseButton === CENTER) {
    gameState.isDragging = true;
    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }
}

// Handle mouse release to stop camera rotation
function handleMouseReleased(gameState) {
  if (mouseButton === CENTER) {
    gameState.isDragging = false;
  }
}

// Setup p5.js mouse event handlers
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