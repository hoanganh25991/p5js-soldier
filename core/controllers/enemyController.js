// Enemy Controller Module
// Handles enemy spawning, updating, and management

import CONFIG from '../../config.js';
import { Enemy } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { Wave } from '../entities/wave.js';

export class EnemyController {
  constructor(gameState) {
    this.gameState = gameState;
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.enemiesPerWave = 30;
    this.lastWaveKillCount = 0;
  }

  initialize() {
    // Clear existing enemies
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.lastWaveKillCount = 0;
    
    // Initial enemy spawn
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
      this.spawnEnemy();
    }
    
    // Show wave 1 started message
    if (this.gameState && typeof this.gameState.addCooldownMessage === 'function') {
      // Wait a short time before showing the first wave message
      setTimeout(() => {
        const message = {
          text: `Wave ${this.currentWave} started!`,
          color: [255, 200, 0], // Gold color for wave notifications
          duration: 180 // 3 seconds at 60fps
        };
        this.gameState.addCooldownMessage(message);
      }, 1000); // Wait 1 second before showing the message
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
        this.enemies.splice(i, 1);
        continue;
      }
      
      this.enemies[i].update();
      
      // Check if enemy is dead
      if (this.enemies[i].health <= 0) {
        this.enemies.splice(i, 1);
        this.enemiesKilled++;
        
        // Check if a new wave should start
        if (this.enemiesKilled - this.lastWaveKillCount >= this.enemiesPerWave) {
          this.startNewWave();
        }
        
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

  startNewWave() {
    this.currentWave++;
    this.lastWaveKillCount = this.enemiesKilled;
    
    // Create a notification for the new wave
    if (this.gameState && typeof this.gameState.addCooldownMessage === 'function') {
      const message = {
        text: `Wave ${this.currentWave} started!`,
        color: [255, 200, 0], // Gold color for wave notifications
        duration: 180 // 3 seconds at 60fps
      };
      
      this.gameState.addCooldownMessage(message);
    }
    
    // Spawn additional enemies for the new wave
    // Increase the number of enemies spawned based on wave number (up to a maximum)
    const baseSpawnCount = 5;
    const additionalSpawns = Math.min(this.currentWave - 1, 10); // Add up to 10 more enemies for higher waves
    const enemiesToSpawn = Math.min(baseSpawnCount + additionalSpawns, CONFIG.MAX_ENEMIES - this.enemies.length);
    
    for (let i = 0; i < enemiesToSpawn; i++) {
      this.spawnEnemy();
    }
    
    // Spawn a boss with each new wave
    this.spawnBossForWave();
    
    // Every 5 waves, make enemies stronger
    if (this.currentWave % 5 === 0) {
      // Notify player about stronger enemies
      if (this.gameState && typeof this.gameState.addCooldownMessage === 'function') {
        const strengthMessage = {
          text: `Warning: Enemies are getting stronger!`,
          color: [255, 50, 50], // Red color for warning
          duration: 240 // 4 seconds at 60fps
        };
        
        // Show this message after a short delay
        setTimeout(() => {
          this.gameState.addCooldownMessage(strengthMessage);
        }, 1500);
      }
    }
  }
  
  // Spawn a boss for the current wave
  spawnBossForWave() {
    // Create a new boss
    const boss = Boss.spawnRandom(this.gameState);
    
    // Scale boss health and damage based on wave number
    const waveScaling = 1 + (this.currentWave * 0.1); // 10% increase per wave
    boss.maxHealth *= waveScaling;
    boss.health = boss.maxHealth;
    boss.damageMultiplier *= waveScaling;
    
    // Add to game state
    this.gameState.bosses.push(boss);
    
    // Increment active boss count
    this.gameState.activeBossCount++;
    
    // Create spawn effect
    this.createBossSpawnEffect(boss);
    
    // Announce boss spawn with wave number
    this.announceBossSpawn();
  }
  
  // Create visual effects for boss spawn
  createBossSpawnEffect(boss) {
    // Create a shockwave effect using the Wave class
    const shockwave = new Wave(boss.x, boss.y, boss.z, 0, [255, 0, 0, 150], this.gameState);
    shockwave.maxRadius = 300;
    shockwave.lifespan = 60;
    this.gameState.waves.push(shockwave);
    
    // Create particles
    for (let i = 0; i < 30; i++) {
      const angle = random(TWO_PI);
      const distance = random(200);
      
      // Calculate position
      const x = boss.x + cos(angle) * distance;
      const y = boss.y + random(-50, 50);
      const z = boss.z + sin(angle) * distance;
      
      // Create particle using the Wave class
      const particleColor = [255, random(0, 100), 0, random(150, 255)];
      const particle = new Wave(x, y, z, random(5, 15), particleColor, this.gameState);
      particle.lifespan = random(30, 60);
      particle.growthRate = random(0.5, 1.0);
      
      // Add particle to game state
      this.gameState.waves.push(particle);
    }
  }
  
  // Display boss spawn announcement
  announceBossSpawn() {
    // If there's a UI system, use it to display the announcement
    if (this.gameState && typeof this.gameState.addCooldownMessage === 'function') {
      const message = {
        text: `WAVE ${this.currentWave} BOSS INCOMING!`,
        color: [255, 0, 0], // Red color for warning
        duration: 180 // 3 seconds at 60fps
      };
      this.gameState.addCooldownMessage(message);
      
      // Add a second message about boss strength for higher waves
      if (this.currentWave > 1) {
        setTimeout(() => {
          const strengthMessage = {
            text: `Boss strength increased by ${(this.currentWave * 10)}%!`,
            color: [255, 50, 50], // Red color for warning
            duration: 180 // 3 seconds at 60fps
          };
          this.gameState.addCooldownMessage(strengthMessage);
        }, 1000); // Show after 1 second
      }
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
  
  getCurrentWave() {
    return this.currentWave;
  }
  
  getKillsInCurrentWave() {
    return this.enemiesKilled - this.lastWaveKillCount;
  }
  
  getKillsNeededForNextWave() {
    return this.enemiesPerWave - this.getKillsInCurrentWave();
  }
}