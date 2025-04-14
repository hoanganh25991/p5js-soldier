// Boss Manager Module
// Handles boss spawning, updates, and special effects

import CONFIG from '../../config.js';
import { Boss } from '../entities/boss.js';
import { Wave } from '../entities/wave.js';

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
  // Check performance settings
  const performanceManager = gameState.performanceManager;
  const isMobile = performanceManager && performanceManager.isMobile;
  const isLowQuality = CONFIG.PERFORMANCE && CONFIG.PERFORMANCE.QUALITY_LEVEL === 'low';
  const isLowFPS = performanceManager && performanceManager.fps < performanceManager.targetFPS * 0.8;
  
  // Use particle manager if available
  if (gameState.particleManager) {
    // Adjust particle count based on performance
    let particleCount = 30; // Default for high quality
    
    // Reduce particles based on performance factors
    if (isMobile) {
      particleCount = 15;
    }
    if (isLowQuality) {
      particleCount = Math.max(10, Math.floor(particleCount * 0.6));
    }
    if (isLowFPS) {
      particleCount = Math.max(8, Math.floor(particleCount * 0.7));
    }
    
    // Create the explosion with adjusted parameters
    gameState.particleManager.createParticleExplosion(
      boss.x, boss.y, boss.z, 
      'EXPLOSION', 
      particleCount, 
      {
        color: [255, 0, 0],
        size: isMobile || isLowQuality ? 10 : 15,
        lifespan: isMobile || isLowQuality ? 30 : 45,
        speed: isMobile || isLowQuality ? 2 : 3
      }
    );
    
    // Add a wave effect with adjusted parameters based on performance
    if (!isMobile || !isLowQuality || !isLowFPS) {
      const shockwave = new Wave(boss.x, boss.y, boss.z, 0, [255, 0, 0, 150], gameState);
      shockwave.maxRadius = isMobile || isLowQuality ? 200 : 300;
      shockwave.lifespan = isMobile || isLowQuality ? 40 : 60;
      gameState.waves.push(shockwave);
    }
  } else {
    // Fallback to using Wave class directly
    // Create a shockwave effect with adjusted parameters
    const shockwave = new Wave(boss.x, boss.y, boss.z, 0, [255, 0, 0, 150], gameState);
    shockwave.maxRadius = isMobile || isLowQuality ? 200 : 300;
    shockwave.lifespan = isMobile || isLowQuality ? 40 : 60;
    gameState.waves.push(shockwave);
    
    // Create particles with adjusted count based on performance
    const particleCount = isMobile ? 10 : (isLowQuality ? 15 : 30);
    
    // Skip additional particles on very low performance
    if (isMobile && isLowQuality && isLowFPS) {
      return;
    }
    
    for (let i = 0; i < particleCount; i++) {
      const angle = random(TWO_PI);
      const distance = random(200);
      
      // Calculate position
      const x = boss.x + cos(angle) * distance;
      const y = boss.y + random(-50, 50);
      const z = boss.z + sin(angle) * distance;
      
      // Create particle using the Wave class with adjusted parameters
      const particleColor = [255, random(0, 100), 0, random(150, 255)];
      const particle = new Wave(x, y, z, random(5, 15), particleColor, gameState);
      particle.lifespan = isMobile || isLowQuality ? random(20, 40) : random(30, 60);
      particle.growthRate = isMobile || isLowQuality ? random(0.7, 1.2) : random(0.5, 1.0);
      
      // Add particle to game state
      gameState.waves.push(particle);
    }
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
  // Get performance manager and current frame
  const performanceManager = gameState.performanceManager;
  const currentFrame = gameState.frameCount;
  
  // Update each boss
  for (let i = gameState.bosses.length - 1; i >= 0; i--) {
    const boss = gameState.bosses[i];
    
    // Skip bosses that are too far away
    if (performanceManager && !performanceManager.shouldRender(boss.x, boss.z)) {
      continue;
    }
    
    // Get LOD level based on distance
    let lod = 0;
    if (performanceManager) {
      lod = performanceManager.getEntityLOD(boss.x, boss.z);
      
      // Apply performance-based adjustments to LOD
      if (CONFIG.PERFORMANCE) {
        // On low quality settings, increase LOD level (reduce detail)
        if (CONFIG.PERFORMANCE.QUALITY_LEVEL === 'low') {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
        
        // On mobile devices, further reduce detail
        if (performanceManager.isMobile) {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
      }
    }
    
    // Determine if we should update this boss on this frame
    let shouldUpdate = false;
    
    // Always update close bosses (LOD 0)
    if (lod === 0) {
      shouldUpdate = true;
    }
    // Update medium distance bosses (LOD 1) every other frame
    else if (lod === 1 && currentFrame % 2 === 0) {
      shouldUpdate = true;
    }
    // Update far bosses (LOD 2) every third frame
    else if (lod === 2 && currentFrame % 3 === 0) {
      shouldUpdate = true;
    }
    
    // Update boss if needed
    if (shouldUpdate) {
      boss.update();
    }
    
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
  // Get performance manager
  const performanceManager = gameState.performanceManager;
  
  // Check if we can use GPU batching
  const useGPUBatching = gameState.gpuManager && 
                         gameState.gpuManager.isInitialized && 
                         CONFIG.PERFORMANCE && 
                         CONFIG.PERFORMANCE.BATCH_RENDERING;
  
  // Group bosses by distance for LOD rendering
  const bossesByLOD = {
    0: [], // High detail (close)
    1: [], // Medium detail (medium distance)
    2: []  // Low detail (far)
  };
  
  // Sort bosses by distance
  for (const boss of gameState.bosses) {
    // Skip bosses that are too far away
    if (performanceManager && !performanceManager.shouldRender(boss.x, boss.z)) {
      continue;
    }
    
    // Get LOD level based on distance
    let lod = 0;
    if (performanceManager) {
      lod = performanceManager.getEntityLOD(boss.x, boss.z);
      
      // Apply performance-based adjustments to LOD
      if (CONFIG.PERFORMANCE) {
        // On low quality settings, increase LOD level (reduce detail)
        if (CONFIG.PERFORMANCE.QUALITY_LEVEL === 'low') {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
        
        // On mobile devices, further reduce detail
        if (performanceManager.isMobile) {
          lod = Math.min(2, lod + 1); // Increase LOD by 1, max at 2
        }
      }
    }
    
    // Add to appropriate LOD group
    bossesByLOD[lod].push(boss);
  }
  
  // Try to use GPU batching for bosses if available
  if (useGPUBatching && bossesByLOD[2].length > 0) {
    // Attempt to batch render low-detail bosses
    if (gameState.gpuManager.batchEntity(bossesByLOD[2], 'bosses_low_detail')) {
      // Successfully batched, remove from regular rendering
      bossesByLOD[2] = [];
    }
  }
  
  // Render each LOD group
  for (const lod in bossesByLOD) {
    const bosses = bossesByLOD[lod];
    
    // Skip empty groups
    if (bosses.length === 0) continue;
    
    // Apply LOD-specific rendering settings
    for (const boss of bosses) {
      // Set LOD-specific properties
      switch (parseInt(lod)) {
        case 0: // High detail
          boss.useSimpleRendering = false;
          boss.skipAnimations = false;
          boss.skipParticles = false;
          break;
        case 1: // Medium detail
          boss.useSimpleRendering = false;
          boss.skipAnimations = true;
          boss.skipParticles = true;
          break;
        case 2: // Low detail
          boss.useSimpleRendering = true;
          boss.skipAnimations = true;
          boss.skipParticles = true;
          break;
      }
      
      // Render the boss
      boss.show();
    }
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