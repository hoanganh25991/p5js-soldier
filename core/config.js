// Game Configuration Module

const CONFIG = {
    // World settings
    WORLD_RADIUS: 1500,
    MAX_ENEMIES: 50,
    SPAWN_INTERVAL: 60, // frames between spawns
    // Game settings
    PILLAR_HEIGHT: 100,
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
            COLOR: [255, 255, 0] // Yellow
        },
        TURRET: {
            SPEED: 20,
            DAMAGE: 10,
            SIZE: 5,
            COLOR: [255, 100, 100] // Red
        }
    },

    // Enemy settings
    ENEMY_RADIUS: 1000,
    ENEMY_COUNT: 50,
    ENEMY_SPEED: 0.5, // Increased enemy speed but still slower than bullets
    ENEMY_WIDTH: 20,
    ENEMY_HEIGHT: 40,
    ENEMY_DEPTH: 20,
    ENEMY_HEALTH: 100,
    ENEMY_DAMAGE_TO_PILLAR: 0.02,
    ENEMY_DAMAGE_TO_PLAYER: 0.2,

    // Skill settings
    CLONE: {
        // COOLDOWN: 60,
        COOLDOWN: 0,
        DURATION: 8 * 60,
        FIRE_RATE: 30, // Shoot as fast as player
        DAMAGE: 15,
        MAX_CLONES: 10
    },

    TURRET: {
        // COOLDOWN: 5 * 60, // 5 seconds cooldown
        COOLDOWN: 30, // 5 seconds cooldown
        DURATION: 3 * 60, // 3 seconds duration
        FIRE_RATE: 15,  // Twice as fast as clone
        DAMAGE: 15,
        BULLET_SIZE: 5,
        MAX_TARGETS: 5,  // Shoot 5 enemies at once
        BULLET_SPEED: 30 // 1.5x normal bullet speed
    },

    AIRSTRIKE: {
        // COOLDOWN: 60,
        COOLDOWN: 30,
        SPEED: 3,
        BOMB_RATE: 100,
        BOMB_SIZE: 100,
        DAMAGE: 500,
        BLAST_RADIUS: 150
    },

    LASER: {
        // COOLDOWN: 60,
        COOLDOWN: 30,
        DURATION: 5 * 60,
        DAMAGE: 80,
        WIDTH: 40
    }
};

export default CONFIG;