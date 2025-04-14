// Camera Controls Module
// Provides UI buttons for zooming in/out and camera rotation

/**
 * Create camera control buttons in the top right corner
 * @param {Object} gameState - The global game state
 * @returns {Object} - The container element with camera control buttons
 */
export function createZoomControls(gameState) {
  // Create container for camera controls
  const cameraControlsContainer = createElement('div');
  cameraControlsContainer.id('zoom-controls');
  cameraControlsContainer.style('position', 'fixed');
  cameraControlsContainer.style('top', '20px');
  cameraControlsContainer.style('right', '20px');
  cameraControlsContainer.style('display', 'flex');
  cameraControlsContainer.style('flex-direction', 'column');
  cameraControlsContainer.style('gap', '10px');
  cameraControlsContainer.style('z-index', '100');
  
  // Create zoom controls row
  const zoomRow = createElement('div');
  zoomRow.style('display', 'flex');
  zoomRow.style('flex-direction', 'row');
  zoomRow.style('gap', '10px');
  zoomRow.style('justify-content', 'center');
  
  // Create zoom in button
  const zoomInButton = createButton('+');
  styleControlButton(zoomInButton);
  zoomInButton.mousePressed(() => {
    // Zoom in - decrease zoom level (makes camera closer)
    gameState.zoomLevel -= 0.5;
  });
  
  // Create zoom out button
  const zoomOutButton = createButton('-');
  styleControlButton(zoomOutButton);
  zoomOutButton.mousePressed(() => {
    // Zoom out - increase zoom level (makes camera further)
    gameState.zoomLevel += 0.5;
  });
  
  // Add zoom buttons to zoom row
  zoomRow.child(zoomInButton);
  zoomRow.child(zoomOutButton);
  
  // Create horizontal rotation controls row
  const horizontalRotationRow = createElement('div');
  horizontalRotationRow.style('display', 'flex');
  horizontalRotationRow.style('flex-direction', 'row');
  horizontalRotationRow.style('gap', '10px');
  horizontalRotationRow.style('justify-content', 'center');
  
  // Create left rotation button
  const rotateLeftButton = createButton('←');
  styleControlButton(rotateLeftButton);
  rotateLeftButton.mousePressed(() => {
    // Rotate camera left
    gameState.cameraRotationY -= 0.1;
  });
  
  // Create right rotation button
  const rotateRightButton = createButton('→');
  styleControlButton(rotateRightButton);
  rotateRightButton.mousePressed(() => {
    // Rotate camera right
    gameState.cameraRotationY += 0.1;
  });
  
  // Add horizontal rotation buttons to row
  horizontalRotationRow.child(rotateLeftButton);
  horizontalRotationRow.child(rotateRightButton);
  
  // Create vertical rotation controls row
  const verticalRotationRow = createElement('div');
  verticalRotationRow.style('display', 'flex');
  verticalRotationRow.style('flex-direction', 'row');
  verticalRotationRow.style('gap', '10px');
  verticalRotationRow.style('justify-content', 'center');
  
  // Create up rotation button
  const rotateUpButton = createButton('↑');
  styleControlButton(rotateUpButton);
  rotateUpButton.mousePressed(() => {
    // Rotate camera up (decrease X rotation)
    gameState.cameraRotationX -= 0.1;
  });
  
  // Create down rotation button
  const rotateDownButton = createButton('↓');
  styleControlButton(rotateDownButton);
  rotateDownButton.mousePressed(() => {
    // Rotate camera down (increase X rotation)
    gameState.cameraRotationX += 0.1;
  });
  
  // Add vertical rotation buttons to row
  verticalRotationRow.child(rotateUpButton);
  verticalRotationRow.child(rotateDownButton);
  
  // Add all control rows to main container
  cameraControlsContainer.child(zoomRow);
  cameraControlsContainer.child(horizontalRotationRow);
  cameraControlsContainer.child(verticalRotationRow);
  
  // Initially hide the camera controls (they'll be shown when game is playing)
  cameraControlsContainer.style('display', 'none');
  
  return cameraControlsContainer;
}

/**
 * Apply styles to a camera control button
 * @param {p5.Element} button - The button to style
 */
function styleControlButton(button) {
  button.style('width', '40px');
  button.style('height', '40px');
  button.style('font-size', '24px');
  button.style('font-weight', 'bold');
  button.style('background', 'rgba(0, 0, 0, 0.5)');
  button.style('color', 'white');
  button.style('border', '2px solid white');
  button.style('border-radius', '50%');
  button.style('cursor', 'pointer');
  button.style('display', 'flex');
  button.style('justify-content', 'center');
  button.style('align-items', 'center');
  button.style('padding', '0');
  button.style('user-select', 'none');
  button.style('touch-action', 'manipulation');
  
  // Add hover effect
  button.mouseOver(() => {
    button.style('background', 'rgba(50, 50, 50, 0.7)');
  });
  
  button.mouseOut(() => {
    button.style('background', 'rgba(0, 0, 0, 0.5)');
  });
}

/**
 * Update camera controls visibility based on game state
 * @param {Object} gameState - The global game state
 */
export function updateZoomControlsVisibility(gameState) {
  const cameraControlsContainer = select('#zoom-controls');
  if (!cameraControlsContainer) return;
  
  // Show camera controls only when game is in playing state
  if (gameState.currentState === 'playing') {
    cameraControlsContainer.style('display', 'flex');
  } else {
    cameraControlsContainer.style('display', 'none');
  }
}