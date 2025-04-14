// Enemy configuration file
// Contains all enemy-related settings

// Basic enemy settings
export const ENEMY = {
  RADIUS: 1000,
  COUNT: 30, // Reduced from 50 to improve performance
  SPEED: 0.5, // Increased enemy speed but still slower than bullets
  WIDTH: 20,
  HEIGHT: 40,
  DEPTH: 20,
  HEALTH: 100,
  DAMAGE_TO_TOWER: 0.02,
  DAMAGE_TO_PILLAR: 0.02,
  DAMAGE_TO_PLAYER: 0.2,
  DAMAGE_TO_CHARACTER: 5, // Damage dealt to characters
  HEALTH_BAR: {
    ENABLED: true,
    HEIGHT: 5,
    OFFSET: 15, // Distance above enemy
    COLORS: {
      HIGH: [0, 255, 0, 230], // Green for high health
      MEDIUM: [255, 255, 0, 230], // Yellow for medium health
      LOW: [255, 0, 0, 230], // Red for low health
      BACKGROUND: [40, 40, 40, 200] // Dark gray background
    }
  }
};

// Boss settings
export const BOSS = {
  SPAWN_INTERVAL: 3600, // Spawn a boss every 3600 frames (1 minute at 60fps)
  HEALTH_MULTIPLIER: 10, // 10x normal enemy health
  SIZE_MULTIPLIER: 2.5, // 2.5x normal enemy size
  SPEED_MULTIPLIER: 0.6, // Slower than normal enemies
  DAMAGE_MULTIPLIER: 3, // 3x normal enemy damage
  XP_REWARD: 500, // XP reward for killing a boss
  SCORE_REWARD: 1000, // Score reward for killing a boss
  
  // Boss attack patterns
  ATTACKS: {
    GROUND_SLAM: {
      DAMAGE: 30,
      RADIUS: 200,
      COOLDOWN: 300, // 5 seconds at 60fps
      EFFECT_DURATION: 60 // 1 second at 60fps
    },
    PROJECTILE_BURST: {
      DAMAGE: 15,
      COUNT: 8, // Number of projectiles
      SPEED: 8,
      COOLDOWN: 600 // 10 seconds at 60fps
    },
    SUMMON_MINIONS: {
      COUNT: 3, // Number of minions to summon
      COOLDOWN: 900 // 15 seconds at 60fps
    }
  },
  
  // Boss health bar
  HEALTH_BAR: {
    HEIGHT: 10, // Taller than normal enemies
    OFFSET: 30, // Higher above the boss
    SHOW_PERCENTAGE: true, // Show percentage text
    SHOW_NAME: true // Show boss name
  },
  
  // Boss visual effects
  EFFECTS: {
    AURA_COLOR: [255, 50, 0, 150], // Red aura
    AURA_SIZE: 1.2, // 20% larger than the boss
    PARTICLE_COUNT: 20,
    PARTICLE_COLORS: [
      [255, 0, 0], // Red
      [255, 100, 0], // Orange
      [255, 200, 0] // Yellow
    ]
  },
  
  // Boss types
  TYPES: {
    TITAN: {
      NAME: "Titan",
      COLOR: [150, 50, 50], // Dark red
      HEALTH_MODIFIER: 1.2, // 20% more health
      ATTACK_MODIFIER: 1.5, // 50% more damage
      SPECIAL_ABILITY: "GROUND_SLAM"
    },
    NECROMANCER: {
      NAME: "Necromancer",
      COLOR: [100, 0, 100], // Purple
      HEALTH_MODIFIER: 0.8, // 20% less health
      ATTACK_MODIFIER: 1.0, // Normal damage
      SPECIAL_ABILITY: "SUMMON_MINIONS"
    },
    JUGGERNAUT: {
      NAME: "Juggernaut",
      COLOR: [50, 50, 150], // Blue
      HEALTH_MODIFIER: 1.5, // 50% more health
      ATTACK_MODIFIER: 0.8, // 20% less damage
      SPECIAL_ABILITY: "PROJECTILE_BURST"
    }
  }
};