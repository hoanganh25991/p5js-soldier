// Main configuration file
// Imports and re-exports all configuration modules

// Import configuration modules
import * as SkillConfig from './config/skills.js';
import * as EnemyConfig from './config/enemies.js';
import * as WorldConfig from './config/world.js';

// Create a unified CONFIG object
const CONFIG = {
  // Debug settings
  DEBUG_MODE: WorldConfig.DEBUG.DEBUG_MODE,
  
  // Performance settings
  PERFORMANCE: WorldConfig.PERFORMANCE,
  
  // Skill configurations
  SKILL_IDS: SkillConfig.SKILL_IDS,
  SKILL_KEYS: SkillConfig.SKILL_KEYS,
  SKILLS: SkillConfig.SKILLS,
  
  // Skill-specific settings
  CLONE: SkillConfig.CLONE,
  TURRET: SkillConfig.TURRET,
  AIRSTRIKE: SkillConfig.AIRSTRIKE,
  LASER: SkillConfig.LASER,
  GBA: SkillConfig.GBA,
  GAS_LIGHTER: SkillConfig.GAS_LIGHTER,
  
  // World settings
  WORLD_RADIUS: WorldConfig.WORLD.RADIUS,
  MAX_ENEMIES: WorldConfig.WORLD.MAX_ENEMIES,
  SPAWN_INTERVAL: WorldConfig.WORLD.SPAWN_INTERVAL,
  TOWER_HEIGHT: WorldConfig.WORLD.TOWER_HEIGHT,
  PILLAR_HEIGHT: WorldConfig.WORLD.PILLAR_HEIGHT,
  VICTORY_KILLS: WorldConfig.WORLD.VICTORY_KILLS,
  
  // Player settings
  PLAYER_HEALTH: WorldConfig.PLAYER.HEALTH,
  PLAYER_WIDTH: WorldConfig.PLAYER.WIDTH,
  PLAYER_HEIGHT: WorldConfig.PLAYER.HEIGHT,
  PLAYER_DEPTH: WorldConfig.PLAYER.DEPTH,
  FIRE_RATE: WorldConfig.PLAYER.FIRE_RATE,
  
  // Camera settings
  CAMERA: WorldConfig.CAMERA,
  
  // Bullet settings
  BULLET: WorldConfig.BULLET,
  
  // Enemy settings
  ENEMY_RADIUS: EnemyConfig.ENEMY.RADIUS,
  ENEMY_COUNT: EnemyConfig.ENEMY.COUNT,
  ENEMY_SPEED: EnemyConfig.ENEMY.SPEED,
  ENEMY_WIDTH: EnemyConfig.ENEMY.WIDTH,
  ENEMY_HEIGHT: EnemyConfig.ENEMY.HEIGHT,
  ENEMY_DEPTH: EnemyConfig.ENEMY.DEPTH,
  ENEMY_HEALTH: EnemyConfig.ENEMY.HEALTH,
  ENEMY_DAMAGE_TO_TOWER: EnemyConfig.ENEMY.DAMAGE_TO_TOWER,
  ENEMY_DAMAGE_TO_PILLAR: EnemyConfig.ENEMY.DAMAGE_TO_PILLAR,
  ENEMY_DAMAGE_TO_PLAYER: EnemyConfig.ENEMY.DAMAGE_TO_PLAYER,
  ENEMY_DAMAGE_TO_CHARACTER: EnemyConfig.ENEMY.DAMAGE_TO_CHARACTER,
  ENEMY_HEALTH_BAR: EnemyConfig.ENEMY.HEALTH_BAR,
  
  // Boss settings
  BOSS: EnemyConfig.BOSS
};

export default CONFIG;

// Also export individual modules for direct access
export { SkillConfig, EnemyConfig, WorldConfig };
