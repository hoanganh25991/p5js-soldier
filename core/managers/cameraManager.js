// Camera Manager
// Handles camera positioning, rotation, and zoom

import CONFIG from '../../config.js';

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
    lookAtYOffset: baseLookAtYOffset,
    fieldOfViewAdjustment: 1.0, // Default field of view adjustment factor
    cameraAngleAdjustment: 0 // Default camera angle adjustment
  };
  
  // For landscape mode (typical mobile landscape or desktop)
  if (aspectRatio > 1) {
    // Wider screens need higher camera to see more of the ground
    // The narrower the height, the more we need to increase camera height
    const heightFactor = Math.max(1.8, 1800 / screenHeight);
    adjustedParams.verticalOffset = baseVerticalOffset * heightFactor;
    
    // Adjust the look-at point to focus more on the ground
    adjustedParams.lookAtYOffset = baseLookAtYOffset * 0.5;
    
    // No additional FOV adjustment needed for landscape
    adjustedParams.fieldOfViewAdjustment = 1.0;
  } 
  // For portrait mode (typically mobile)
  else {
    // In portrait mode, we need significant adjustments for better ground visibility
    
    // Calculate how extreme the portrait mode is (narrower = more extreme)
    const portraitFactor = Math.min(1.0, aspectRatio); // 0.5 is very narrow, 1.0 is square
    
    // More extreme portrait modes need more extreme adjustments
    const narrownessFactor = 1.0 + (1.0 - portraitFactor) * 2.0;
    
    // Significantly increase camera height in portrait mode
    const heightFactor = Math.max(2.5, 2500 / screenHeight) * narrownessFactor;
    adjustedParams.verticalOffset = baseVerticalOffset * heightFactor;
    
    // Look more downward in portrait mode
    adjustedParams.lookAtYOffset = baseLookAtYOffset * 0.2;
    
    // Widen the field of view in portrait mode to see more ground
    adjustedParams.fieldOfViewAdjustment = 1.3; // 30% wider FOV
    
    // Adjust camera angle to be less steep in portrait mode
    adjustedParams.cameraAngleAdjustment = 0.15; // Make camera angle less steep by 0.15 radians
  }
  
  // Apply an additional height boost to ensure we can see the ground
  adjustedParams.verticalOffset *= 1.4;
  
  return adjustedParams;
}

/**
 * Initialize camera settings
 * @param {Object} gameState - The global game state
 */
export function initializeCamera(gameState) {
  // Store the dynamic camera parameters
  gameState.dynamicCameraParams = calculateDynamicCameraParams(windowWidth, windowHeight);
  
  // Add camera-specific properties to gameState
  gameState.cameraRotationX = -0.3 + gameState.dynamicCameraParams.cameraAngleAdjustment; // Adjust angle based on screen orientation
  gameState.cameraRotationY = 0;
  gameState.baseCameraDistance = 500; // Further increased base distance for wider view
  gameState.zoomLevel = 1.5; // More zoomed in by default (smaller value = more zoomed in)
  
  // Set field of view with dynamic adjustment based on screen orientation
  gameState.fieldOfView = (PI / 3) * gameState.dynamicCameraParams.fieldOfViewAdjustment; // Adjust FOV based on screen orientation
  
  // Set perspective with the adjusted field of view
  perspective(gameState.fieldOfView, width / height, 0.1, 5000);
}

/**
 * Update camera parameters when window is resized
 * @param {Object} gameState - The global game state
 */
export function updateCameraOnResize(gameState) {
  // Recalculate dynamic parameters based on new screen dimensions
  gameState.dynamicCameraParams = calculateDynamicCameraParams(windowWidth, windowHeight);
  
  // Update camera angle based on new orientation
  gameState.cameraRotationX = -0.3 + gameState.dynamicCameraParams.cameraAngleAdjustment;
  
  // Update field of view based on new orientation
  gameState.fieldOfView = (PI / 3) * gameState.dynamicCameraParams.fieldOfViewAdjustment;
  
  // Reset perspective with the adjusted field of view
  perspective(gameState.fieldOfView, width / height, 0.1, 5000);
}

/**
 * Update camera position and rotation
 * @param {Object} gameState - The global game state
 */
export function updateCamera(gameState) {
  // Ensure perspective settings are applied each frame
  if (gameState.fieldOfView) {
    perspective(gameState.fieldOfView, width / height, 0.1, 5000);
  }

  // Initialize camera offset values if they don't exist
  if (!gameState.cameraOffsetX) gameState.cameraOffsetX = 0;
  if (!gameState.cameraOffsetZ) gameState.cameraOffsetZ = 0;
  
  // Handle 4-direction camera movement when dragging with CENTER mouse button
  if (gameState.isDragging && gameState.cameraMovement) {
    // Movement speed factor - adjust as needed
    const moveSpeed = 5;
    
    // Apply camera movement based on direction flags
    if (gameState.cameraMovement.left) {
      // Move camera left (or scene right)
      gameState.cameraOffsetX -= moveSpeed * cos(gameState.cameraRotationY);
      gameState.cameraOffsetZ -= moveSpeed * sin(gameState.cameraRotationY);
    }
    if (gameState.cameraMovement.right) {
      // Move camera right (or scene left)
      gameState.cameraOffsetX += moveSpeed * cos(gameState.cameraRotationY);
      gameState.cameraOffsetZ += moveSpeed * sin(gameState.cameraRotationY);
    }
    if (gameState.cameraMovement.up) {
      // Move camera up (or scene down)
      gameState.cameraOffsetX += moveSpeed * sin(gameState.cameraRotationY);
      gameState.cameraOffsetZ -= moveSpeed * cos(gameState.cameraRotationY);
    }
    if (gameState.cameraMovement.down) {
      // Move camera down (or scene up)
      gameState.cameraOffsetX -= moveSpeed * sin(gameState.cameraRotationY);
      gameState.cameraOffsetZ += moveSpeed * cos(gameState.cameraRotationY);
    }
  }

  // Position camera behind player with increased distance
  let currentDistance = gameState.baseCameraDistance * gameState.zoomLevel;

  // Calculate camera position
  let camX = sin(gameState.cameraRotationY) * currentDistance;
  let camZ = cos(gameState.cameraRotationY) * currentDistance;

  // Use dynamic camera parameters based on screen size
  const dynamicParams = gameState.dynamicCameraParams || 
                        calculateDynamicCameraParams(windowWidth, windowHeight);
  
  // Calculate aspect ratio to determine if we're in portrait mode
  const aspectRatio = width / height;
  const isPortrait = aspectRatio <= 1;
  
  // Position camera behind player using dynamic values with increased height
  // Added additional depth offset to position camera further back
  // Apply camera offsets for 4-direction movement
  gameState.camera.setPosition(
    camX + CONFIG.CAMERA.HORIZONTAL_OFFSET + gameState.cameraOffsetX, // Apply horizontal offset from config + movement offset
    gameState.player.y - dynamicParams.verticalOffset * (isPortrait ? 0.7 : 0.8), // Adjust height based on orientation
    camZ + (isPortrait ? 300 : 250) + gameState.cameraOffsetZ // Further back in portrait mode + movement offset
  );

  // Calculate look-at point with offsets
  const lookAtX = CONFIG.CAMERA.LOOK_AT.X + gameState.cameraOffsetX;
  const lookAtZ = CONFIG.CAMERA.LOOK_AT.Z + gameState.cameraOffsetZ - (isPortrait ? 50 : 100);
  
  // Look at point in front of player with better ground visibility using dynamic values
  // Adjust the look-at point to focus more on the ground area in front of the player
  gameState.camera.lookAt(
    lookAtX, // Horizontal look target from config with offset
    gameState.player.y + dynamicParams.lookAtYOffset * (isPortrait ? 3.5 : 2.5), // Higher look-at point in portrait mode
    lookAtZ // Adjusted forward look distance based on orientation with offset
  );
  
  // Store the current focus point for zooming
  gameState.zoomFocusPoint = {
    x: lookAtX,
    y: gameState.player.y + dynamicParams.lookAtYOffset * (isPortrait ? 3.5 : 2.5),
    z: lookAtZ
  };
}