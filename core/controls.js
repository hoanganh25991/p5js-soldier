// Mouse and keyboard controls for the game

// Mouse wheel handler for zooming
function mouseWheel(event) {
  // Only allow zooming in playing state
  if (gameState.currentState !== 'playing') return false;
  
  // Zoom with mouse wheel - rolling forward (negative delta) decreases zoom level (zooms in)
  // rolling backward (positive delta) increases zoom level (zooms out)
  gameState.zoomLevel = constrain(gameState.zoomLevel + (event.delta * 0.001), 0.2, 10.0);
  return false; // Prevent default scrolling
}

// Mouse press handler for camera rotation
function mousePressed() {
  // Only allow camera control in playing state
  if (gameState.currentState !== 'playing') return;
  
  // Start dragging with middle mouse button (button 1)
  if (mouseButton === CENTER) {
    gameState.isDragging = true;
    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }
}

// Mouse release handler
function mouseReleased() {
  if (mouseButton === CENTER) {
    gameState.isDragging = false;
  }
}