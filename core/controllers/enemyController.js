// Enemy Controller Module
// Handles enemy spawning, updating, and management

import CONFIG from '../config.js';
import { Enemy } from '../entities/enemy.js';

export class EnemyController {
  constructor(gameState) {
    this.gameState = gameState;
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
  }

  initialize() {
    // Clear existing enemies
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
    
    // Initial enemy spawn
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    this.enemies.push(Enemy.spawnRandom(this.gameState));
    this.totalEnemiesSpawned++;
  }

  update() {
    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      // Skip invalid enemies
      if (!this.enemies[i]) {
        console.log('Found invalid enemy at index', i);
        this.enemies.splice(i, 1);
        continue;
      }
      
      this.enemies[i].update();
      
      // Check if enemy is dead
      if (this.enemies[i].health <= 0) {
        this.enemies.splice(i, 1);
        this.enemiesKilled++;
        
        // Spawn new enemy if below max limit
        if (this.enemies.length < CONFIG.MAX_ENEMIES) {
          this.spawnEnemy();
        }
      }
    }
    
    // Regular enemy spawning
    if (this.enemies.length < CONFIG.MAX_ENEMIES && this.gameState.frameCount % CONFIG.SPAWN_INTERVAL === 0) {
      this.spawnEnemy();
    }
  }

  render() {
    // Render all enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].show();
    }
  }

  getEnemiesKilled() {
    return this.enemiesKilled;
  }

  getTotalEnemiesSpawned() {
    return this.totalEnemiesSpawned;
  }

  getEnemies() {
    return this.enemies;
  }
}