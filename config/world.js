// World configuration file
// Contains world, game, and camera settings

// Debug settings
export const DEBUG = {
  DEBUG_MODE: false // Set to true to show performance metrics
};

// Performance settings
export const PERFORMANCE = {
  QUALITY_LEVEL: 'auto', // 'low', 'medium', 'high', 'ultra', 'auto'
  PARTICLE_LIMIT: 200,
  PARTICLE_SCALE: 1.0,
  DRAW_DISTANCE: 1500, // Same as WORLD_RADIUS by default
  ENTITY_LIMIT: 30, // Maximum number of entities to render
  DETAIL_LEVEL: 1.0, // Scale for geometric detail
  TEXTURE_QUALITY: 1.0, // Scale for texture quality
  SHADOWS_ENABLED: false, // Shadows are expensive, disabled by default
  POST_PROCESSING: false, // Post-processing effects
  COLLISION_CHECK_FREQUENCY: 1, // Check collisions every N frames
  USE_GPU_ACCELERATION: true,
  BATCH_RENDERING: true,
  USE_INSTANCING: true
};

// World settings
export const WORLD = {
  RADIUS: 1500,
  MAX_ENEMIES: 30, // Reduced from 50 to improve performance
  SPAWN_INTERVAL: 90, // Increased from 60 to reduce spawn frequency
  TOWER_HEIGHT: 100,
  PILLAR_HEIGHT: 100,
  VICTORY_KILLS: 1000
};

// Camera settings
export const CAMERA = {
  VERTICAL_OFFSET: 600, // Camera height above player
  HORIZONTAL_OFFSET: 0, // Horizontal offset from calculated position
  DEPTH_OFFSET: 100, // Camera depth offset behind player
  LOOK_AT: {
    X: 0, // Horizontal look target
    Y_OFFSET: 200, // Vertical look target relative to player
    Z: -400, // Forward look distance
  }
};

// Player settings
export const PLAYER = {
  HEALTH: 100,
  WIDTH: 20,
  HEIGHT: 40,
  DEPTH: 20,
  FIRE_RATE: 30 // frames between shots
};

// Bullet settings
export const BULLET = {
  PLAYER: {
    SPEED: 20,
    DAMAGE: 35,
    SIZE: 5,
    COLOR: [255, 255, 0] // Yellow
  },
  TURRET: {
    SPEED: 20,
    DAMAGE: 10,
    SIZE: 5,
    COLOR: [255, 100, 100] // Red
  }
};