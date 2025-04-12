// Mouse Controls Module
// Handles mouse wheel zooming and camera rotation via dragging

// Initialize mouse controls
function initMouseControls(gameState) {
  // In p5.js, we don't need to register these handlers here
  // as they're already defined in main.js as global functions
  // This function is kept for potential future enhancements
  console.log("Mouse controls initialized");
}

// Handle mouse wheel for zooming
function handleMouseWheel(event, gameState) {
  // Only allow zooming in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Zoom with mouse wheel - rolling forward (negative delta) decreases zoom level (zooms in)
  // rolling backward (positive delta) increases zoom level (zooms out)
  gameState.zoomLevel = constrain(gameState.zoomLevel + (event.delta * 0.001), 0.2, 10.0);
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

// These functions are now globally available
// No export needed in non-module approach