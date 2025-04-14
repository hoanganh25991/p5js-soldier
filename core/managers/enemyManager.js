// Enemy Manager
// Handles enemy spawning, updating, and management

import CONFIG from '../../config.js';
import { Enemy } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { Wave } from '../entities/wave.js';
import performanceManager from './performanceManager.js';
import particleManager from './particleManager.js';

export class EnemyManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.enemiesPerWave = 30;
    this.lastWaveKillCount = 0;
    
    // Performance-related properties
    this.maxVisibleEnemies = CONFIG.MAX_ENEMIES;
    this.enemyLODs = {}; // Level of detail for each enemy
  }

  initialize() {
    // Clear existing enemies
    this.enemies = [];
    this.totalEnemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.currentWave = 1;
    this.lastWaveKillCount = 0;
    this.enemyLODs = {};
    
    // Update max visible enemies based on performance settings
    if (CONFIG.PERFORMANCE) {
      this.maxVisibleEnemies = CONFIG.PERFORMANCE.ENTITY_LIMIT || CONFIG.MAX_ENEMIES;
    }
    
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
    // Check if we've reached the entity limit
    if (this.enemies.length >= this.maxVisibleEnemies) {
      return;
    }
    
    const enemy = Enemy.spawnRandom(this.gameState);
    this.enemies.push(enemy);
    this.totalEnemiesSpawned++;
    
    // Assign a unique ID for LOD tracking
    enemy.id = this.totalEnemiesSpawned;
    this.enemyLODs[enemy.id] = 0; // Default to highest detail
  }

  update() {
    // Update max visible enemies based on performance settings
    if (CONFIG.PERFORMANCE) {
      this.maxVisibleEnemies = CONFIG.PERFORMANCE.ENTITY_LIMIT || CONFIG.MAX_ENEMIES;
    }
    
    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      // Skip invalid enemies
      if (!this.enemies[i]) {
        this.enemies.splice(i, 1);
        continue;
      }
      
      const enemy = this.enemies[i];
      
      // Update LOD based on distance from player
      if (enemy.id) {
        this.updateEnemyLOD(enemy);
      }
      
      // Only update enemies that are within the draw distance
      if (performanceManager.shouldRender(enemy.x, enemy.z)) {
        enemy.update();
      }
      
      // Check if enemy is dead
      if (enemy.health <= 0) {
        // Create death effect
        this.createEnemyDeathEffect(enemy);
        
        // Remove enemy
        this.enemies.splice(i, 1);
        this.enemiesKilled++;
        
        // Remove from LOD tracking
        if (enemy.id && this.enemyLODs[enemy.id]) {
          delete this.enemyLODs[enemy.id];
        }
        
        // Check if a new wave should start
        if (this.enemiesKilled - this.lastWaveKillCount >= this.enemiesPerWave) {
          this.startNewWave();
        }
        
        // Spawn new enemy if below max limit
        if (this.enemies.length < this.maxVisibleEnemies) {
          this.spawnEnemy();
        }
      }
    }
    
    // Regular enemy spawning
    if (this.enemies.length < this.maxVisibleEnemies && this.gameState.frameCount % CONFIG.SPAWN_INTERVAL === 0) {
      this.spawnEnemy();
    }
  }
  
  // Update level of detail for an enemy based on distance
  updateEnemyLOD(enemy) {
    if (!enemy || !enemy.id) return;
    
    // Get LOD level based on distance
    const lod = performanceManager.getEntityLOD(enemy.x, enemy.z);
    
    // Store LOD level
    this.enemyLODs[enemy.id] = lod;
    
    // Apply LOD settings to enemy
    switch (lod) {
      case 0: // High detail
        enemy.useSimpleRendering = false;
        enemy.skipAnimations = false;
        break;
      case 1: // Medium detail
        enemy.useSimpleRendering = false;
        enemy.skipAnimations = true;
        break;
      case 2: // Low detail
        enemy.useSimpleRendering = true;
        enemy.skipAnimations = true;
        break;
    }
  }
  
  // Create death effect for an enemy
  createEnemyDeathEffect(enemy) {
    // Use particle manager for death effects if available
    if (particleManager && this.gameState.particleManager) {
      // Use the particle manager from gameState if available (it's initialized)
      const pm = this.gameState.particleManager || particleManager;
      
      // Check if we're on mobile or low performance mode
      const isMobile = this.gameState.performanceManager && 
                       this.gameState.performanceManager.isMobile;
      
      // Create fewer particles on mobile
      const particleCount = isMobile ? 5 : 10;
      
      pm.createParticleExplosion(
        enemy.x, enemy.y, enemy.z, 
        'EXPLOSION', 
        particleCount,
        {
          color: [255, 100, 0],
          size: 8,
          lifespan: 20
        }
      );
    } else {
      // Fallback to using Wave class directly
      // Create a shockwave effect
      const shockwave = new Wave(enemy.x, enemy.y, enemy.z, 0, [255, 100, 0, 150], this.gameState);
      shockwave.maxRadius = 50;
      shockwave.lifespan = 20;
      this.gameState.waves.push(shockwave);
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
    const enemiesToSpawn = Math.min(baseSpawnCount + additionalSpawns, this.maxVisibleEnemies - this.enemies.length);
    
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
    // Use particle manager for boss spawn effects if available
    if (particleManager && this.gameState.particleManager) {
      // Use the particle manager from gameState if available (it's initialized)
      const pm = this.gameState.particleManager || particleManager;
      
      // Check if we're on mobile or low performance mode
      const isMobile = this.gameState.performanceManager && 
                       this.gameState.performanceManager.isMobile;
      
      // Create fewer particles on mobile
      const particleCount = isMobile ? 15 : 30;
      
      // Create a shockwave effect
      pm.createParticleExplosion(
        boss.x, boss.y, boss.z, 
        'EXPLOSION', 
        particleCount, 
        {
          color: [255, 0, 0],
          size: 15,
          lifespan: 45,
          speed: 3
        }
      );
      
      // Add a wave effect regardless of platform
      const shockwave = new Wave(boss.x, boss.y, boss.z, 0, [255, 0, 0, 150], this.gameState);
      shockwave.maxRadius = 300;
      shockwave.lifespan = 60;
      this.gameState.waves.push(shockwave);
    } else {
      // Fallback to using Wave class directly
      // Create a shockwave effect
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
      const enemy = this.enemies[i];
      
      // Skip rendering enemies that are too far away
      if (!performanceManager.shouldRender(enemy.x, enemy.z)) {
        continue;
      }
      
      // Render with appropriate level of detail
      enemy.show();
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

// Create and export a default instance
export default EnemyManager;