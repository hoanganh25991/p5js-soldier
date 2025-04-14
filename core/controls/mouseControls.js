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
    
    // Store the current camera focus point before zooming
    if (!gameState.zoomFocusPoint) {
      gameState.zoomFocusPoint = {
        x: CONFIG.CAMERA.LOOK_AT.X,
        y: gameState.player.y + gameState.dynamicCameraParams.lookAtYOffset,
        z: CONFIG.CAMERA.LOOK_AT.Z
      };
    }
    
    // Update zoom level
    const previousZoom = gameState.zoomLevel;
    gameState.zoomLevel = gameState.zoomLevel + zoomAdjustment;
    
    // Constrain zoom level to reasonable values
    gameState.zoomLevel = constrain(gameState.zoomLevel, 0.5, 3.0);
  }
  
  return false; // Prevent default scrolling
}

/**
 * Handle mouse press for camera movement
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
    
    // Initialize camera movement direction flags
    gameState.cameraMovement = {
      left: false,
      right: false,
      up: false,
      down: false
    };
  }
}

/**
 * Handle mouse release to stop camera movement
 * @param {Object} gameState - The current game state
 */
function handleMouseReleased(gameState) {
  if (mouseButton === CENTER) {
    gameState.isDragging = false;
    
    // Reset camera movement flags
    if (gameState.cameraMovement) {
      gameState.cameraMovement.left = false;
      gameState.cameraMovement.right = false;
      gameState.cameraMovement.up = false;
      gameState.cameraMovement.down = false;
    }
  }
}

/**
 * Handle mouse drag for camera movement in 4 directions
 * @param {Object} gameState - The current game state
 */
function handleMouseDragged(gameState) {
  // Only process if we're dragging with the middle mouse button
  if (!gameState.isDragging || gameState.currentState !== 'playing') return;
  
  // Calculate the delta movement
  const deltaX = mouseX - gameState.lastMouseX;
  const deltaY = mouseY - gameState.lastMouseY;
  
  // Determine camera movement direction based on drag direction
  if (deltaX < -5) {
    // Dragging left moves camera right (or scene left)
    gameState.cameraMovement.right = true;
    gameState.cameraMovement.left = false;
  } else if (deltaX > 5) {
    // Dragging right moves camera left (or scene right)
    gameState.cameraMovement.left = true;
    gameState.cameraMovement.right = false;
  } else {
    gameState.cameraMovement.left = false;
    gameState.cameraMovement.right = false;
  }
  
  if (deltaY < -5) {
    // Dragging up moves camera down (or scene up)
    gameState.cameraMovement.down = true;
    gameState.cameraMovement.up = false;
  } else if (deltaY > 5) {
    // Dragging down moves camera up (or scene down)
    gameState.cameraMovement.up = true;
    gameState.cameraMovement.down = false;
  } else {
    gameState.cameraMovement.up = false;
    gameState.cameraMovement.down = false;
  }
  
  // Update last mouse position
  gameState.lastMouseX = mouseX;
  gameState.lastMouseY = mouseY;
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
  p5Instance.mouseDragged = () => handleMouseDragged(gameState);
}

export { 
  initMouseControls, 
  handleMouseWheel, 
  handleMousePressed, 
  handleMouseReleased,
  handleMouseDragged,
  setupMouseHandlers
};