// UI Utilities
// Common functions and styles for UI components

// Common styles for full-screen overlays (menus, game over screens, etc.)
export const styles = {
  // Full screen overlay base style
  fullScreenOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: '300'
  },
  
  // Text styles
  title: {
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    marginBottom: '40px'
  },
  
  // Button styles
  button: {
    padding: '15px 30px',
    fontSize: '20px',
    marginBottom: '20px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    color: 'white'
  },
  
  // Button colors
  buttonColors: {
    primary: '#4CAF50',   // Green - for primary actions (start, resume)
    secondary: '#2196F3', // Blue - for secondary actions (menu, restart)
    danger: '#F44336',    // Red - for destructive actions
    warning: '#FF5722'    // Orange - for caution actions (mute)
  }
};

// Apply styles to an element from a style object
export function applyStyles(element, styleObj) {
  for (const [property, value] of Object.entries(styleObj)) {
    element.style(property, value);
  }
  return element;
}

// Create a styled button with common formatting
export function createStyledButton(label, color, clickHandler) {
  const button = createButton(label);
  
  // Apply base button styles
  applyStyles(button, styles.button);
  
  // Apply specific color
  button.style('background', color);
  
  // Add click handler if provided
  if (clickHandler) {
    button.mousePressed(clickHandler);
  }
  
  return button;
}

// Create a styled title
export function createTitle(text) {
  const title = createElement('h1', text);
  applyStyles(title, styles.title);
  return title;
}

// Create a full screen overlay container
export function createOverlay(id, initialDisplay = 'none') {
  const overlay = createElement('div');
  overlay.id(id);
  
  // Apply full screen overlay styles
  applyStyles(overlay, styles.fullScreenOverlay);
  
  // Set initial display state
  overlay.style('display', initialDisplay);
  
  return overlay;
}