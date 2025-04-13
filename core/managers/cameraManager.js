// Camera Manager
// Handles camera positioning, rotation, and zoom

import CONFIG from '../config.js';

/**
 * Initialize camera settings
 * @param {Object} gameState - The global game state
 */
export function initializeCamera(gameState) {
  // Add camera-specific properties to gameState
  gameState.cameraRotationX = -0.4; // Less steep angle for better perspective
  gameState.cameraRotationY = 0;
  gameState.baseCameraDistance = 300; // Base distance that will be multiplied by zoomLevel
  gameState.zoomLevel = 2.0; // Wider view of battlefield
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
    gameState.cameraRotationX = constrain(gameState.cameraRotationX + deltaY, -PI / 2, 0);

    gameState.lastMouseX = mouseX;
    gameState.lastMouseY = mouseY;
  }

  // Position camera behind player at 1/3 screen height
  let currentDistance = gameState.baseCameraDistance * gameState.zoomLevel;

  // Calculate camera position
  let camX = sin(gameState.cameraRotationY) * currentDistance;
  let camZ = cos(gameState.cameraRotationY) * currentDistance;

  // Position camera behind player using config values
  gameState.camera.setPosition(
    camX + CONFIG.CAMERA.HORIZONTAL_OFFSET, // Apply horizontal offset from config
    gameState.player.y - CONFIG.CAMERA.VERTICAL_OFFSET, // Camera height from config
    camZ + CONFIG.CAMERA.DEPTH_OFFSET // Camera depth from config
  );

  // Look at point in front of player with better sky visibility using config values
  gameState.camera.lookAt(
    CONFIG.CAMERA.LOOK_AT.X, // Horizontal look target from config
    gameState.player.y + CONFIG.CAMERA.LOOK_AT.Y_OFFSET, // Vertical look target from config
    CONFIG.CAMERA.LOOK_AT.Z // Forward look distance from config
  );
}