const CONFIG = {
    // World settings
    WORLD_RADIUS: 1500,
    MAX_ENEMIES: 100,
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
    BULLET_SPEED: 15,
    BULLET_DAMAGE: 35,
    BULLET_SIZE: 5,
    
    // Enemy settings
    ENEMY_COUNT: 100,
    ENEMY_SPEED: 0.5,
    ENEMY_WIDTH: 20,
    ENEMY_HEIGHT: 40,
    ENEMY_DEPTH: 20,
    ENEMY_HEALTH: 100,
    ENEMY_DAMAGE_TO_PILLAR: 0.02,
    ENEMY_DAMAGE_TO_PLAYER: 0.2,
    
    // Skill settings
    CLONE: {
        COOLDOWN: 10000,
        DURATION: 8000,
        FIRE_RATE: 800,
        DAMAGE: 15
    },
    
    TURRET: {
        COOLDOWN: 15000,
        DURATION: 12000,
        FIRE_RATE: 500,
        DAMAGE: 25,
        RANGE: 300
    },
    
    AIRSTRIKE: {
        COOLDOWN: 20000,
        SPEED: 3,
        BOMB_RATE: 200,
        DAMAGE: 50,
        BLAST_RADIUS: 100
    },
    
    LASER: {
        COOLDOWN: 25000,
        DURATION: 3000,
        DAMAGE: 8,
        WIDTH: 40
    }
};
