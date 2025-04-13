// Camera Manager
// Handles camera positioning, rotation, and zoom

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

  // Position camera behind player
  gameState.camera.setPosition(
    camX, // Keep player centered horizontally
    gameState.player.y - 600, // Camera slightly above player
    camZ + 100 // Camera behind player
  );

  // Look at point in front of player with better sky visibility
  gameState.camera.lookAt(
    0, // Keep centered horizontally
    gameState.player.y + 200, // Look more level to see sky
    -400 // Look ahead of player
  );
}