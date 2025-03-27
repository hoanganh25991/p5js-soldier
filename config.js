const CONFIG = {
    // Game settings
    PILLAR_HEIGHT: 100,
    PLAYER_HEALTH: 100,
    VICTORY_KILLS: 1000,
    
    // Player settings
    PLAYER_SIZE: 20,
    AUTO_FIRE_RATE: 500, // milliseconds between shots
    BULLET_SPEED: 15,
    BULLET_DAMAGE: 20,
    
    // Enemy settings
    ENEMY_COUNT: 50,
    ENEMY_SPEED: 0.5,
    ENEMY_SIZE: 15,
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
