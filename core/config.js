// Game Configuration Module

const CONFIG = {
  // World settings
  WORLD_RADIUS: 1500,
  MAX_ENEMIES: 30, // Reduced from 50 to improve performance
  SPAWN_INTERVAL: 90, // Increased from 60 to reduce spawn frequency
  // Game settings
  TOWER_HEIGHT: 100,
  PLAYER_HEALTH: 100,
  VICTORY_KILLS: 1000,

  // Player settings
  PLAYER_WIDTH: 20,
  PLAYER_HEIGHT: 40,
  PLAYER_DEPTH: 20,
  FIRE_RATE: 30, // frames between shots

  // Bullet settings
  BULLET: {
    PLAYER: {
      SPEED: 20,
      DAMAGE: 35,
      SIZE: 5,
      COLOR: [255, 255, 0], // Yellow
    },
    TURRET: {
      SPEED: 20,
      DAMAGE: 10,
      SIZE: 5,
      COLOR: [255, 100, 100], // Red
    },
  },

  // Enemy settings
  ENEMY_RADIUS: 1000,
  ENEMY_COUNT: 30, // Reduced from 50 to improve performance
  ENEMY_SPEED: 0.5, // Increased enemy speed but still slower than bullets
  ENEMY_WIDTH: 20,
  ENEMY_HEIGHT: 40,
  ENEMY_DEPTH: 20,
  ENEMY_HEALTH: 100,
  ENEMY_DAMAGE_TO_TOWER: 0.02,
  ENEMY_DAMAGE_TO_PLAYER: 0.2,
  ENEMY_DAMAGE_TO_CHARACTER: 5, // Damage dealt to characters
  ENEMY_HEALTH_BAR: {
    ENABLED: true,
    HEIGHT: 5,
    OFFSET: 15, // Distance above enemy
    COLORS: {
      HIGH: [0, 255, 0, 230], // Green for high health
      MEDIUM: [255, 255, 0, 230], // Yellow for medium health
      LOW: [255, 0, 0, 230], // Red for low health
      BACKGROUND: [40, 40, 40, 200] // Dark gray background
    }
  },

  // Skill settings
  CLONE: {
    // COOLDOWN: 60,
    COOLDOWN: 0,
    DURATION: 8 * 60,
    FIRE_RATE: 30, // Shoot as fast as player
    DAMAGE: 15,
    MAX_CLONES: 10,
  },

  TURRET: {
    // COOLDOWN: 5 * 60, // 5 seconds cooldown
    COOLDOWN: 30, // 5 seconds cooldown
    DURATION: 3 * 60, // 3 seconds duration
    FIRE_RATE: 15, // Twice as fast as clone
    DAMAGE: 15,
    BULLET_SIZE: 5,
    MAX_TARGETS: 5, // Shoot 5 enemies at once
    BULLET_SPEED: 30, // 1.5x normal bullet speed
  },

  AIRSTRIKE: {
    // COOLDOWN: 60,
    COOLDOWN: 30,
    SPEED: 3,
    BOMB_RATE: 100,
    BOMB_SIZE: 100,
    DAMAGE: 500,
    BLAST_RADIUS: 150,
  },

  LASER: {
    // COOLDOWN: 60,
    COOLDOWN: 30,
    DURATION: 5 * 60,
    DAMAGE: 80,
    WIDTH: 40,
  },

  // Game Boy Advanced skill
  GBA: {
    COOLDOWN: 0,
    THROW_SPEED: 8, // Slower speed to make the throw more visible
    THROW_DISTANCE: 150 * 5, // Maximum throw distance
    CHARACTER_DURATION: 200 * 60, // 20 seconds (increased from 10)
    CHARACTER_HEALTH: 300 * 10, // Increased from 150
    CHARACTER_TYPES: {
      TANK: {
        HEALTH_MULTIPLIER: 2.0,
        DAMAGE: 80, // Increased from 40
        SPEED: 10, // Doubled from 0.8
        SIZE: 0.75, // Reduced by half from 1.5
      },
      HERO: {
        HEALTH_MULTIPLIER: 1.2,
        DAMAGE: 120,
        SPEED: 10,
        SIZE: 1.0,
      },
      MARIO: {
        HEALTH_MULTIPLIER: 0.5,
        DAMAGE: 60,
        SPEED: 10,
        SIZE: 0.8,
      },
      MEGAMAN: {
        HEALTH_MULTIPLIER: 1.0,
        DAMAGE: 100,
        SPEED: 10,
        SIZE: 0.9,
      },
      SONGOKU: {
        HEALTH_MULTIPLIER: 1.5,
        DAMAGE: 140,
        SPEED: 10,
        SIZE: 1.1,
      },
    },
    // Visual effects for character summoning
    SUMMON_EFFECTS: {
      PARTICLES_COUNT: 20,
      WAVE_DURATION: 45,
      SHOCKWAVE_SIZE: 300,
      PARTICLE_COLORS: {
        TANK: [100, 100, 100],
        HERO: [100, 100, 255],
        MARIO: [255, 50, 50],
        MEGAMAN: [0, 150, 255],
        SONGOKU: [255, 255, 0],
      },
    },
    },
    
    // Gas Lighter skill
    GAS_LIGHTER: {
        COOLDOWN: 0,
        THROW_SPEED: 10, // Slightly faster than GBA
        THROW_DISTANCE: 150 * 5, // Maximum throw distance
        FIRE_SKILL_DURATION: 60 * 2, // 2 minutes duration
        FIRE_SKILL_TYPES: {
            FIREBALL: {
                DAMAGE: 100,
                SPEED: 25,
                SIZE: 15,
                COLOR: [255, 100, 0], // Orange-red
                COOLDOWN: 60 // 1 second between fireballs
            },
            FLAME_SHIELD: {
                DAMAGE: 50, // Damage per tick
                RADIUS: 150,
                DURATION: 10 * 60, // 10 seconds
                COLOR: [255, 150, 50], // Orange
                PULSE_RATE: 0.1
            },
            INFERNO_BLAST: {
                DAMAGE: 200,
                RADIUS: 300,
                DURATION: 3 * 60, // 3 seconds
                COLOR: [255, 50, 0], // Deep red
                EXPANSION_RATE: 10
            },
            PHOENIX_REBIRTH: {
                HEAL_AMOUNT: 500,
                DAMAGE: 150,
                RADIUS: 200,
                DURATION: 5 * 60, // 5 seconds
                COLOR: [255, 200, 0], // Golden
                RISE_SPEED: 5
            },
            FIRESTORM: {
                DAMAGE: 80, // Damage per meteor
                METEOR_COUNT: 20,
                DURATION: 8 * 60, // 8 seconds
                COLOR: [255, 80, 0], // Red-orange
                METEOR_SIZE: 20,
                METEOR_SPEED: 15
            }
        },
        // Visual effects for fire skill casting
        CAST_EFFECTS: {
            PARTICLES_COUNT: 30,
            WAVE_DURATION: 60,
            SHOCKWAVE_SIZE: 250,
            PARTICLE_COLORS: {
                FIREBALL: [255, 100, 0],
                FLAME_SHIELD: [255, 150, 50],
                INFERNO_BLAST: [255, 50, 0],
                PHOENIX_REBIRTH: [255, 200, 0],
                FIRESTORM: [255, 80, 0]
            }
        }
  },
};

export default CONFIG;
