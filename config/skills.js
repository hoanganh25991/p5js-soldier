// Skill configuration file
// Contains all skill-related settings

// Skill IDs - consistent uppercase naming for all skills
export const SKILL_IDS = {
  CLONE: 'CLONE',
  TURRET: 'TURRET',
  AIRSTRIKE: 'AIRSTRIKE',
  LASER: 'LASER',
  GBA: 'GBA',
  GAS_LIGHTER: 'GAS_LIGHTER'
};

// Skill key mappings - maps keyboard keys to skill IDs
export const SKILL_KEYS = {
  'a': SKILL_IDS.CLONE,
  's': SKILL_IDS.TURRET,
  'd': SKILL_IDS.AIRSTRIKE,
  'f': SKILL_IDS.LASER,
  'q': SKILL_IDS.GBA,
  'w': SKILL_IDS.GAS_LIGHTER
};

// Clone skill settings
export const CLONE = {
  COOLDOWN: 60,
  DURATION: 8 * 60,
  FIRE_RATE: 30, // Shoot as fast as player
  DAMAGE: 15,
  MAX_CLONES: 10,
};

// Turret skill settings
export const TURRET = {
  COOLDOWN: 5 * 60, // 5 seconds cooldown
  DURATION: 3 * 60, // 3 seconds duration
  FIRE_RATE: 15, // Twice as fast as clone
  DAMAGE: 15,
  BULLET_SIZE: 5,
  MAX_TARGETS: 5, // Shoot 5 enemies at once
  BULLET_SPEED: 30, // 1.5x normal bullet speed
};

// Airstrike skill settings
export const AIRSTRIKE = {
  COOLDOWN: 30,
  SPEED: 3,
  BOMB_RATE: 100,
  BOMB_SIZE: 60,       // Size of the bomb model (3x bigger)
  DAMAGE: 800,         // Increased base damage
  BLAST_RADIUS: 250,   // Increased area of effect radius
  DAMAGE_FALLOFF: 0.5, // Damage reduction at edge of blast (0.5 = 50% damage at edge)
  EXPLOSION_PARTICLES: 40, // Increased number of particles in explosion
  EXPLOSION_COLORS: [
    [255, 100, 50],    // Orange-red
    [255, 200, 50],    // Yellow-orange
    [100, 100, 100]    // Smoke gray
  ]
};

// Laser skill settings
export const LASER = {
  COOLDOWN: 30,
  DURATION: 5 * 60,
  DAMAGE: 80,
  WIDTH: 40,
};

// Game Boy Advanced skill settings
export const GBA = {
  COOLDOWN: 120,
  THROW_SPEED: 8, // Slower speed to make the throw more visible
  THROW_DISTANCE: 150 * 10, // Maximum throw distance
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
};
  
// Gas Lighter skill settings
export const GAS_LIGHTER = {
  COOLDOWN: 120,
  THROW_SPEED: 10, // Slightly faster than GBA
  THROW_DISTANCE: 150 * 10, // Maximum throw distance
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
};

// Skill definitions with all properties
export const SKILLS = {
  [SKILL_IDS.CLONE]: {
    name: 'Clone',
    description: 'Creates a clone that fights alongside you',
    cooldown: CLONE.COOLDOWN,
    duration: CLONE.DURATION,
    maxCount: CLONE.MAX_CLONES
  },
  [SKILL_IDS.TURRET]: {
    name: 'Turret',
    description: 'Deploys an auto-targeting turret',
    cooldown: TURRET.COOLDOWN,
    duration: TURRET.DURATION
  },
  [SKILL_IDS.AIRSTRIKE]: {
    name: 'Airstrike',
    description: 'Calls in an airstrike that bombs enemies',
    cooldown: AIRSTRIKE.COOLDOWN
  },
  [SKILL_IDS.LASER]: {
    name: 'Laser',
    description: 'Fires a powerful laser beam',
    cooldown: LASER.COOLDOWN,
    duration: LASER.DURATION
  },
  [SKILL_IDS.GBA]: {
    name: 'Game Boy Advanced',
    description: 'Throws a GBA that summons random game characters',
    cooldown: GBA.COOLDOWN,
    duration: GBA.CHARACTER_DURATION
  },
  [SKILL_IDS.GAS_LIGHTER]: {
    name: 'Gas Lighter',
    description: 'Throws a Gas Lighter that casts random fire skills',
    cooldown: GAS_LIGHTER.COOLDOWN,
    duration: GAS_LIGHTER.FIRE_SKILL_DURATION
  }
};