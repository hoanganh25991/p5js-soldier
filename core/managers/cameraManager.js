// Camera Manager
// Handles camera positioning, rotation, and zoom

import CONFIG from '../config.js';

/**
 * Calculate dynamic camera height based on screen dimensions
 * @param {number} screenWidth - Current screen width
 * @param {number} screenHeight - Current screen height
 * @returns {Object} - Object containing adjusted camera parameters
 */
export function calculateDynamicCameraParams(screenWidth, screenHeight) {
  // Base values from config
  const baseVerticalOffset = CONFIG.CAMERA.VERTICAL_OFFSET;
  const baseLookAtYOffset = CONFIG.CAMERA.LOOK_AT.Y_OFFSET;
  
  // Calculate aspect ratio
  const aspectRatio = screenWidth / screenHeight;
  
  // Adjust camera height based on screen dimensions
  let adjustedParams = {
    verticalOffset: baseVerticalOffset,
    lookAtYOffset: baseLookAtYOffset
  };
  
  // For landscape mode (typical mobile landscape or desktop)
  if (aspectRatio > 1) {
    // Wider screens need higher camera to see more of the ground
    // The narrower the height, the more we need to increase camera height
    // Further increased base factor to 1.8 for higher camera position
    const heightFactor = Math.max(1.8, 1800 / screenHeight);
    adjustedParams.verticalOffset = baseVerticalOffset * heightFactor;
    
    // Adjust the look-at point to focus more on the ground
    // Further reduced to 0.5 to look more downward
    adjustedParams.lookAtYOffset = baseLookAtYOffset * 0.5;
  } 
  // For portrait mode (typically mobile)
  else {
    // In portrait mode, we need even higher camera position
    // Further increased base factor to 2.0 for higher camera position
    const heightFactor = Math.max(2.0, 2000 / screenHeight);
    adjustedParams.verticalOffset = baseVerticalOffset * heightFactor;
    
    // Look more downward in portrait mode
    // Further reduced to 0.3 to look more downward
    adjustedParams.lookAtYOffset = baseLookAtYOffset * 0.3;
  }
  
  // Apply an additional height boost to ensure we can see the ground
  // Increased from 1.2 to 1.3 for even more height
  adjustedParams.verticalOffset *= 1.3;
  
  return adjustedParams;
}

/**
 * Initialize camera settings
 * @param {Object} gameState - The global game state
 */
export function initializeCamera(gameState) {
  // Add camera-specific properties to gameState
  gameState.cameraRotationX = -0.65; // Even steeper angle for better ground visibility
  gameState.cameraRotationY = 0;
  gameState.baseCameraDistance = 450; // Significantly increased base distance for wider view
  gameState.zoomLevel = 2.4; // Further increased zoom level for better battlefield overview
  
  // Store the dynamic camera parameters
  gameState.dynamicCameraParams = calculateDynamicCameraParams(windowWidth, windowHeight);
}

/**
 * Update camera parameters when window is resized
 * @param {Object} gameState - The global game state
 */
export function updateCameraOnResize(gameState) {
  gameState.dynamicCameraParams = calculateDynamicCameraParams(windowWidth, windowHeight);
}

/**
 * Update camera position and rotation
 * @param {Object} gameState - The global game state
 */
export function updateCamera(gameState) {
  // Update camera rotation when dragging
  if (gameState.isDragging) {
    let deltaX = (mouseX - gameState.lastMouseX) * 0.01;
    let deltaY = (mouseY - gameState.lastMouseY) * 0.01;

    gameState.cameraRotationY += deltaX;
    // Constrain to a steeper minimum angle to ensure better ground visibility
    gameState.cameraRotationX = constrain(gameState.cameraRotationX + deltaY, -PI / 2, -0.45);

    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }

  // Position camera behind player with increased distance
  let currentDistance = gameState.baseCameraDistance * gameState.zoomLevel;

  // Calculate camera position
  let camX = sin(gameState.cameraRotationY) * currentDistance;
  let camZ = cos(gameState.cameraRotationY) * currentDistance;

  // Use dynamic camera parameters based on screen size
  const dynamicParams = gameState.dynamicCameraParams || 
                        calculateDynamicCameraParams(windowWidth, windowHeight);
  
  // Position camera behind player using dynamic values with increased height
  // Added additional depth offset (200 instead of CONFIG.CAMERA.DEPTH_OFFSET) to position camera further back
  gameState.camera.setPosition(
    camX + CONFIG.CAMERA.HORIZONTAL_OFFSET, // Apply horizontal offset from config
    gameState.player.y - dynamicParams.verticalOffset, // Dynamic camera height
    camZ + 200 // Increased depth offset to position camera further back
  );

  // Look at point in front of player with better ground visibility using dynamic values
  // Adjust the look-at point to focus more on the ground area in front of the player
  gameState.camera.lookAt(
    CONFIG.CAMERA.LOOK_AT.X, // Horizontal look target from config
    gameState.player.y + dynamicParams.lookAtYOffset, // Dynamic vertical look target
    CONFIG.CAMERA.LOOK_AT.Z - 200 // Significantly increased forward look distance to see more ground
  );
}