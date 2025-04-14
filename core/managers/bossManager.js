// Boss Manager Module
// Handles boss spawning, updates, and special effects

import CONFIG from '../config.js';
import { Boss } from '../entities/boss.js';

// Update boss spawn timer and spawn bosses when needed
export function updateBossSpawning(gameState) {
  // Only spawn bosses during gameplay
  if (gameState.currentState !== 'playing') return;
  
  // Decrease boss spawn timer
  if (gameState.bossSpawnTimer > 0) {
    gameState.bossSpawnTimer--;
  }
  
  // Check if it's time to spawn a boss and if we're under the limit
  if (gameState.bossSpawnTimer <= 0 && gameState.activeBossCount < 1) {
    // Spawn a boss
    spawnBoss(gameState);
    
    // Reset timer
    gameState.bossSpawnTimer = CONFIG.BOSS.SPAWN_INTERVAL;
    
    // Announce boss spawn
    announceBossSpawn(gameState);
  }
}

// Spawn a boss at a random location
function spawnBoss(gameState) {
  // Create a new boss
  const boss = Boss.spawnRandom(gameState);
  
  // Add to game state
  gameState.bosses.push(boss);
  
  // Increment active boss count
  gameState.activeBossCount++;
  
  // Create spawn effect
  createBossSpawnEffect(boss, gameState);
  
  return boss;
}

// Create visual effects for boss spawn
function createBossSpawnEffect(boss, gameState) {
  // Create a shockwave effect
  gameState.waves.push({
    x: boss.x,
    y: boss.y,
    z: boss.z,
    radius: 0,
    maxRadius: 300,
    color: color(255, 0, 0, 150),
    life: 60,
    type: 'bossSpawn'
  });
  
  // Create particles
  for (let i = 0; i < 30; i++) {
    const angle = random(TWO_PI);
    const distance = random(200);
    
    // Calculate position
    const x = boss.x + cos(angle) * distance;
    const y = boss.y + random(-50, 50);
    const z = boss.z + sin(angle) * distance;
    
    // Create particle
    const particle = {
      x: x,
      y: y,
      z: z,
      vx: cos(angle) * random(1, 3),
      vy: random(-1, 1),
      vz: sin(angle) * random(1, 3),
      size: random(5, 15),
      color: color(255, random(0, 100), 0, random(150, 255)),
      life: random(30, 60),
      decay: random(0.5, 1.0)
    };
    
    // Add particle to game state
    gameState.waves.push({
      ...particle,
      type: 'particle'
    });
  }
}

// Display boss spawn announcement
function announceBossSpawn(gameState) {
  // If there's a UI system, use it to display the announcement
  if (gameState.ui && gameState.ui.showAnnouncement) {
    gameState.ui.showAnnouncement("BOSS INCOMING!", color(255, 0, 0), 180);
  } else {
    // Otherwise, log to console
    console.log("BOSS INCOMING!");
  }
}

// Update all bosses
export function updateBosses(gameState) {
  // Update each boss
  for (let i = gameState.bosses.length - 1; i >= 0; i--) {
    const boss = gameState.bosses[i];
    
    // Update boss
    boss.update();
    
    // Check if boss is dead
    if (boss.health <= 0) {
      // Remove boss from array
      gameState.bosses.splice(i, 1);
      
      // Decrement active boss count
      gameState.activeBossCount--;
      
      // Announce boss defeat
      announceBossDefeat(boss, gameState);
    }
  }
}

// Display boss defeat announcement
function announceBossDefeat(boss, gameState) {
  // If there's a UI system, use it to display the announcement
  if (gameState.ui && gameState.ui.showAnnouncement) {
    gameState.ui.showAnnouncement(`${boss.name} DEFEATED!`, color(0, 255, 0), 180);
  } else {
    // Otherwise, log to console
    console.log(`${boss.name} DEFEATED!`);
  }
}

// Draw all bosses
export function drawBosses(gameState) {
  // Draw each boss
  for (const boss of gameState.bosses) {
    boss.show();
  }
}

// Check if a bullet hits any boss
export function checkBulletBossCollisions(bullet, gameState) {
  // Check each boss
  for (const boss of gameState.bosses) {
    // Calculate distance between bullet and boss
    const distance = dist(bullet.x, bullet.z, boss.x, boss.z);
    
    // Check if bullet hits boss
    if (distance < boss.width / 2) {
      // Apply damage to boss
      const isDead = boss.takeDamage(bullet.damage);
      
      // If boss is dead, give rewards
      if (isDead) {
        // Add XP and score
        gameState.xp += CONFIG.BOSS.XP_REWARD;
        gameState.score += CONFIG.BOSS.SCORE_REWARD;
        
        // Increment enemies killed count
        gameState.enemiesKilled++;
      }
      
      // Return true to indicate hit
      return true;
    }
  }
  
  // Return false if no hit
  return false;
}