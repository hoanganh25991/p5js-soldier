// Collision Manager
// Handles efficient collision detection and resolution

import CONFIG from '../../config.js';
import performanceManager from './performanceManager.js';

class CollisionManager {
  constructor() {
    // Spatial partitioning grid
    this.gridSize = 200; // Size of each grid cell
    this.grid = {}; // Grid cells containing entities

    // Collision groups
    this.collisionGroups = {
      PLAYER: 1,
      ENEMY: 2,
      BULLET: 4,
      SKILL: 8,
      POWERUP: 16,
      ENVIRONMENT: 32
    };

    // Collision masks (what can collide with what)
    this.collisionMasks = {
      PLAYER: this.collisionGroups.ENEMY | this.collisionGroups.POWERUP | this.collisionGroups.ENVIRONMENT,
      ENEMY: this.collisionGroups.PLAYER | this.collisionGroups.BULLET | this.collisionGroups.SKILL | this.collisionGroups.ENVIRONMENT,
      BULLET: this.collisionGroups.ENEMY | this.collisionGroups.ENVIRONMENT,
      SKILL: this.collisionGroups.ENEMY | this.collisionGroups.ENVIRONMENT,
      POWERUP: this.collisionGroups.PLAYER,
      ENVIRONMENT: this.collisionGroups.PLAYER | this.collisionGroups.ENEMY | this.collisionGroups.BULLET | this.collisionGroups.SKILL
    };

    // Optimization settings
    this.frameCounter = 0;
    this.checkFrequency = 1; // Check every frame by default

    // Collision statistics
    this.potentialCollisions = 0;
    this.actualCollisions = 0;
    this.lastFrameCollisions = 0;

    // Broad phase optimization
    this.useBroadPhase = true;
    this.useNarrowPhase = true;

    // Collision response callbacks
    this.collisionCallbacks = {};
  }

  // Update settings from performance manager
  updatePerformanceSettings() {
    if (CONFIG.PERFORMANCE) {
      this.checkFrequency = CONFIG.PERFORMANCE.COLLISION_CHECK_FREQUENCY || 1;
    }
  }

  // Clear the spatial grid
  clearGrid() {
    this.grid = {};
  }

  // Get grid cell key from position
  getCellKey(x, z) {
    const cellX = Math.floor(x / this.gridSize);
    const cellZ = Math.floor(z / this.gridSize);
    return `${cellX},${cellZ}`;
  }

  // Add an entity to the spatial grid
  addToGrid(entity, group) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.z !== 'number') {
      return;
    }

    // Set collision group if provided
    if (group) {
      entity.collisionGroup = this.collisionGroups[group];
    }

    // Calculate grid cell
    const cellKey = this.getCellKey(entity.x, entity.z);

    // Create cell if it doesn't exist
    if (!this.grid[cellKey]) {
      this.grid[cellKey] = [];
    }

    // Add entity to cell
    this.grid[cellKey].push(entity);
  }

  // Get nearby entities from the grid
  getNearbyEntities(x, z, radius = this.gridSize) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.gridSize);
    const centerCellX = Math.floor(x / this.gridSize);
    const centerCellZ = Math.floor(z / this.gridSize);

    // Calculate squared distance for optimization
    const radiusSquared = radius * radius;

    // Check all cells within radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        // Skip cells that are definitely outside the radius
        // This optimization reduces the number of cells we need to check
        const cellDistanceSquared = dx * dx + dz * dz;
        if (cellDistanceSquared > cellRadius * cellRadius) continue;

        const cellKey = `${centerCellX + dx},${centerCellZ + dz}`;
        if (this.grid[cellKey]) {
          // Filter entities by actual distance for better precision
          for (const entity of this.grid[cellKey]) {
            const distX = entity.x - x;
            const distZ = entity.z - z;
            const distSquared = distX * distX + distZ * distZ;

            if (distSquared <= radiusSquared) {
              nearby.push(entity);
            }
          }
        }
      }
    }

    return nearby;
  }

  // Register a collision callback
  registerCollisionCallback(group1, group2, callback) {
    const key = `${group1}_${group2}`;
    this.collisionCallbacks[key] = callback;
  }

  // Check collisions between two entities
  checkCollision(entity1, entity2) {
    // Skip if either entity doesn't have position
    if (!entity1 || !entity2 ||
        typeof entity1.x !== 'number' || typeof entity1.z !== 'number' ||
        typeof entity2.x !== 'number' || typeof entity2.z !== 'number') {
      return false;
    }

    // Skip if entities are the same
    if (entity1 === entity2) {
      return false;
    }

    // Fast collision mask check using bitwise operations
    if (entity1.collisionGroup && entity2.collisionGroup) {
      // Get mask for entity1's group
      let mask = 0;

      // Use a more efficient lookup approach with a switch statement
      // This avoids the loop and is faster for a small number of groups
      switch (entity1.collisionGroup) {
        case this.collisionGroups.PLAYER:
          mask = this.collisionMasks.PLAYER;
          break;
        case this.collisionGroups.ENEMY:
          mask = this.collisionMasks.ENEMY;
          break;
        case this.collisionGroups.BULLET:
          mask = this.collisionMasks.BULLET;
          break;
        case this.collisionGroups.SKILL:
          mask = this.collisionMasks.SKILL;
          break;
        case this.collisionGroups.POWERUP:
          mask = this.collisionMasks.POWERUP;
          break;
        case this.collisionGroups.ENVIRONMENT:
          mask = this.collisionMasks.ENVIRONMENT;
          break;
      }

      // Skip if entity2's group is not in entity1's mask
      if ((mask & entity2.collisionGroup) === 0) {
        return false;
      }
    }

    // Broad phase - bounding sphere check with early distance calculation
    const dx = entity1.x - entity2.x;
    const dz = entity1.z - entity2.z;
    const distanceSquared = dx * dx + dz * dz;

    // Cache entity dimensions to avoid repeated property lookups
    const radius1 = entity1.width || entity1.size || 20;
    const radius2 = entity2.width || entity2.size || 20;
    const minDistance = radius1 + radius2;
    const minDistanceSquared = minDistance * minDistance;

    if (distanceSquared > minDistanceSquared) {
      return false; // No collision
    }

    // Narrow phase - height check
    if (this.useNarrowPhase) {
      // Skip height check if either entity doesn't have height
      if (typeof entity1.y !== 'number' || typeof entity2.y !== 'number') {
        return true; // Assume collision if no height info
      }

      const height1 = entity1.height || entity1.size || 40;
      const height2 = entity2.height || entity2.size || 40;

      // Check if entities overlap vertically
      if (entity1.y + height1 < entity2.y || entity1.y > entity2.y + height2) {
        return false; // No vertical overlap
      }
    }

    // Collision detected
    return true;
  }

  // Process collisions for all entities
  processCollisions(gameState) {
    // Get performance manager
    const performanceManager = gameState.performanceManager;
    
    // Update settings
    this.updatePerformanceSettings();
    
    // Dynamically adjust check frequency based on performance
    if (performanceManager) {
      // On mobile devices, check less frequently
      if (performanceManager.isMobile) {
        this.checkFrequency = Math.max(2, this.checkFrequency);
      }
      
      // If FPS is low, reduce collision check frequency
      if (performanceManager.fps < performanceManager.targetFPS * 0.7) {
        this.checkFrequency = Math.min(4, this.checkFrequency + 1);
      } 
      // If FPS is good, we can check more frequently
      else if (performanceManager.fps > performanceManager.targetFPS * 0.9 && this.checkFrequency > 1) {
        this.checkFrequency = Math.max(1, this.checkFrequency - 1);
      }
    }

    // Increment frame counter
    this.frameCounter++;

    // Skip collision checks based on frequency
    if (this.frameCounter % this.checkFrequency !== 0) {
      return;
    }

    // Reset collision counters
    this.potentialCollisions = 0;
    this.actualCollisions = 0;

    // Clear the spatial grid
    this.clearGrid();

    // Add entities to the grid
    this.populateGrid(gameState);

    // Use performance-based culling to reduce collision checks
    const drawDistance = performanceManager ? 
                        performanceManager.drawDistance : 
                        (CONFIG.PERFORMANCE && CONFIG.PERFORMANCE.DRAW_DISTANCE || CONFIG.WORLD_RADIUS);
    const cullDistanceSquared = drawDistance * drawDistance;
    
    // Process collisions in order of importance
    // Always process player collisions first
    this.processPlayerEnemyCollisions(gameState);
    
    // Process bullet collisions (most important for gameplay)
    this.processBulletEnemyCollisions(gameState, cullDistanceSquared);
    
    // Process power-ups (important for gameplay but less frequent)
    this.processPowerUpCollisions(gameState);
    
    // Process skill collisions last (can be most expensive)
    // Skip skill collision checks on very low performance
    const skipSkillCollisions = performanceManager && 
                               performanceManager.isMobile && 
                               performanceManager.fps < performanceManager.targetFPS * 0.6;
    
    if (!skipSkillCollisions) {
      this.processSkillEnemyCollisions(gameState, cullDistanceSquared);
    }

    // Store collision stats
    this.lastFrameCollisions = this.actualCollisions;
    
    // Update CONFIG with current check frequency
    if (CONFIG.PERFORMANCE) {
      CONFIG.PERFORMANCE.COLLISION_CHECK_FREQUENCY = this.checkFrequency;
    }
  }

  // Populate the spatial grid with all entities
  populateGrid(gameState) {
    // Add player
    if (gameState.player) {
      this.addToGrid(gameState.player, 'PLAYER');
    }

    // Add enemies
    if (gameState.enemies) {
      for (const enemy of gameState.enemies) {
        this.addToGrid(enemy, 'ENEMY');
      }
    }

    // Add bosses
    if (gameState.bosses) {
      for (const boss of gameState.bosses) {
        this.addToGrid(boss, 'ENEMY');
      }
    }

    // Add bullets
    if (gameState.bullets) {
      for (const bullet of gameState.bullets) {
        this.addToGrid(bullet, 'BULLET');
      }
    }

    // Add skills
    if (gameState.clones) {
      for (const clone of gameState.clones) {
        this.addToGrid(clone, 'SKILL');
      }
    }

    if (gameState.turrets) {
      for (const turret of gameState.turrets) {
        this.addToGrid(turret, 'SKILL');
      }
    }

    // Add power-ups
    if (gameState.powerUps) {
      for (const powerUp of gameState.powerUps) {
        this.addToGrid(powerUp, 'POWERUP');
      }
    }
  }

  // Process bullet-enemy collisions
  processBulletEnemyCollisions(gameState, cullDistanceSquared) {
    if (!gameState.bullets || !gameState.enemies) return;

    // Get player position for distance culling
    const playerX = gameState.player ? gameState.player.x : 0;
    const playerZ = gameState.player ? gameState.player.z : 0;
    
    // Get performance manager and current frame
    const performanceManager = gameState.performanceManager;
    const currentFrame = gameState.frameCount || 0;
    
    // Determine how many bullets to process based on performance
    let maxBulletsToProcess = gameState.bullets.length;
    
    // On mobile or low performance, limit the number of bullets we process
    if (performanceManager && performanceManager.isMobile) {
      maxBulletsToProcess = Math.min(100, maxBulletsToProcess);
    } else if (performanceManager && performanceManager.fps < performanceManager.targetFPS * 0.8) {
      maxBulletsToProcess = Math.min(200, maxBulletsToProcess);
    }
    
    // Process bullets from newest to oldest (most recent bullets are more important)
    const startIndex = Math.max(0, gameState.bullets.length - maxBulletsToProcess);
    
    // Cache collision callback for better performance
    const bulletEnemyCallback = this.collisionCallbacks['BULLET_ENEMY'];

    for (let i = gameState.bullets.length - 1; i >= startIndex; i--) {
      const bullet = gameState.bullets[i];

      // Skip if bullet is invalid
      if (!bullet || typeof bullet.x !== 'number') continue;

      // Skip bullets that are too far from player (culling)
      if (cullDistanceSquared) {
        const dx = bullet.x - playerX;
        const dz = bullet.z - playerZ;
        const distSquared = dx * dx + dz * dz;

        if (distSquared > cullDistanceSquared) {
          continue; // Skip this bullet, it's too far away
        }
      }
      
      // Apply staggered collision checks for distant bullets
      if (performanceManager) {
        const bulletDistSquared = bullet.x * bullet.x + bullet.z * bullet.z;
        const normalizedDist = Math.sqrt(bulletDistSquared) / performanceManager.drawDistance;
        
        // Skip some collision checks for distant bullets
        if (normalizedDist > 0.7 && currentFrame % 2 !== 0) {
          continue; // Skip every other frame for distant bullets
        }
        if (normalizedDist > 0.9 && currentFrame % 3 !== 0) {
          continue; // Skip 2 of 3 frames for very distant bullets
        }
      }

      // Get nearby enemies using spatial grid with optimized radius
      // Use bullet size + max enemy size as search radius for better precision
      const searchRadius = (bullet.size || 5) + 40; // 40 is a reasonable max enemy size
      const nearbyEntities = this.getNearbyEntities(bullet.x, bullet.z, searchRadius);

      let hitSomething = false;
      
      // Limit the number of potential collisions to check
      const maxEntitiesToCheck = Math.min(nearbyEntities.length, 20);

      for (let j = 0; j < maxEntitiesToCheck; j++) {
        const entity = nearbyEntities[j];
        
        // Skip if not an enemy
        if (!entity.takeDamage || entity.collisionGroup !== this.collisionGroups.ENEMY) continue;

        this.potentialCollisions++;

        // Check collision
        if (this.checkCollision(bullet, entity)) {
          // Apply damage to enemy
          const damage = bullet.damage || CONFIG.BULLET.PLAYER.DAMAGE;
          entity.takeDamage(damage);

          // Mark bullet as hit
          hitSomething = true;
          this.actualCollisions++;

          // Call collision callback if registered
          if (bulletEnemyCallback) {
            bulletEnemyCallback(bullet, entity, gameState);
          }

          break; // Bullet can only hit one enemy
        }
      }

      // Remove bullet if it hit something
      if (hitSomething) {
        gameState.bullets.splice(i, 1);
      }
    }
  }

  // Process player-enemy collisions
  processPlayerEnemyCollisions(gameState) {
    if (!gameState.player || !gameState.enemies) return;
    
    // Get performance manager and current frame
    const performanceManager = gameState.performanceManager;
    const currentFrame = gameState.frameCount || 0;
    
    // Cache collision callback for better performance
    const playerEnemyCallback = this.collisionCallbacks['PLAYER_ENEMY'];
    
    // Track when the player was last damaged to prevent damage spam
    if (!gameState.player.lastDamageFrame) {
      gameState.player.lastDamageFrame = 0;
    }
    
    // Calculate damage cooldown based on performance
    const damageCooldown = performanceManager && performanceManager.isMobile ? 15 : 10;
    const canTakeDamage = (currentFrame - gameState.player.lastDamageFrame) >= damageCooldown;
    
    // If player can't take damage yet, we can skip collision checks
    if (!canTakeDamage) {
      return;
    }

    // Get nearby enemies using spatial grid with optimized search radius
    // Use player size + max enemy size as search radius for better precision
    const searchRadius = (gameState.player.width || 20) + 40; // 40 is a reasonable max enemy size
    const nearbyEntities = this.getNearbyEntities(gameState.player.x, gameState.player.z, searchRadius);
    
    // Limit the number of potential collisions to check
    const maxEntitiesToCheck = Math.min(nearbyEntities.length, 
                                       performanceManager && performanceManager.isMobile ? 10 : 20);
    
    // Track if player was damaged this frame
    let playerDamaged = false;

    for (let i = 0; i < maxEntitiesToCheck && !playerDamaged; i++) {
      const entity = nearbyEntities[i];
      
      // Skip if not an enemy
      if (entity.collisionGroup !== this.collisionGroups.ENEMY) continue;

      this.potentialCollisions++;

      // Check collision
      if (this.checkCollision(gameState.player, entity)) {
        // Apply damage to player
        if (gameState.player.takeDamage) {
          gameState.player.takeDamage(CONFIG.ENEMY_DAMAGE_TO_PLAYER);
          gameState.player.lastDamageFrame = currentFrame;
          playerDamaged = true;
        }

        this.actualCollisions++;

        // Call collision callback if registered
        if (playerEnemyCallback) {
          playerEnemyCallback(gameState.player, entity, gameState);
        }
        
        // No need to check more enemies once player is damaged
        break;
      }
    }
  }

  // Process skill-enemy collisions
  processSkillEnemyCollisions(gameState, cullDistanceSquared) {
    // Process each skill type that can damage enemies
    this.processSkillTypeEnemyCollisions(gameState.turrets, gameState, cullDistanceSquared);
    this.processSkillTypeEnemyCollisions(gameState.lasers, gameState, cullDistanceSquared);
    this.processSkillTypeEnemyCollisions(gameState.airstrikes, gameState, cullDistanceSquared);
    this.processSkillTypeEnemyCollisions(gameState.fireSkills, gameState, cullDistanceSquared);
  }

  // Process collisions between a specific skill type and enemies
  processSkillTypeEnemyCollisions(skills, gameState, cullDistanceSquared) {
    if (!skills || !gameState.enemies) return;

    // Get player position for distance culling
    const playerX = gameState.player ? gameState.player.x : 0;
    const playerZ = gameState.player ? gameState.player.z : 0;
    
    // Get performance manager and current frame
    const performanceManager = gameState.performanceManager;
    const currentFrame = gameState.frameCount || 0;
    
    // Cache collision callback for better performance
    const skillEnemyCallback = this.collisionCallbacks['SKILL_ENEMY'];
    
    // Determine how many skills to process based on performance
    const maxSkillsToProcess = performanceManager && performanceManager.isMobile ? 
                              Math.min(20, skills.length) : 
                              skills.length;
    
    // Process only a subset of skills if there are too many
    const skillsToProcess = skills.length > maxSkillsToProcess ? 
                           skills.slice(0, maxSkillsToProcess) : 
                           skills;

    for (const skill of skillsToProcess) {
      // Skip if skill is invalid or doesn't have a damage method
      if (!skill || typeof skill.x !== 'number' || !skill.damage) continue;

      // Skip skills that are too far from player (culling)
      if (cullDistanceSquared) {
        const dx = skill.x - playerX;
        const dz = skill.z - playerZ;
        const distSquared = dx * dx + dz * dz;

        if (distSquared > cullDistanceSquared) {
          continue; // Skip this skill, it's too far away
        }
      }
      
      // Apply staggered collision checks for distant skills
      if (performanceManager) {
        const skillDistSquared = skill.x * skill.x + skill.z * skill.z;
        const normalizedDist = Math.sqrt(skillDistSquared) / performanceManager.drawDistance;
        
        // Skip some collision checks for distant skills
        if (normalizedDist > 0.7 && currentFrame % 2 !== 0) {
          continue; // Skip every other frame for distant skills
        }
        if (normalizedDist > 0.9 && currentFrame % 3 !== 0) {
          continue; // Skip 2 of 3 frames for very distant skills
        }
      }

      // Use skill radius if available, otherwise use a reasonable default
      const searchRadius = skill.radius || (skill.size ? skill.size * 2 : this.gridSize);

      // Get nearby enemies using spatial grid with optimized radius
      const nearbyEntities = this.getNearbyEntities(skill.x, skill.z, searchRadius);
      
      // Limit the number of potential collisions to check
      const maxEntitiesToCheck = Math.min(nearbyEntities.length, 
                                         performanceManager && performanceManager.isMobile ? 10 : 30);
      
      // Track how many enemies were damaged by this skill in this frame
      // to prevent skills from damaging too many enemies at once
      let enemiesDamaged = 0;
      const maxEnemiesDamagedPerFrame = skill.maxTargets || 
                                       (skill.isAreaEffect ? 10 : 3);

      for (let i = 0; i < maxEntitiesToCheck && enemiesDamaged < maxEnemiesDamagedPerFrame; i++) {
        const entity = nearbyEntities[i];
        
        // Skip if not an enemy
        if (!entity.takeDamage || entity.collisionGroup !== this.collisionGroups.ENEMY) continue;

        this.potentialCollisions++;

        // Check collision
        if (this.checkCollision(skill, entity)) {
          // Apply damage to enemy
          const damage = skill.damage || 10;
          entity.takeDamage(damage);

          this.actualCollisions++;
          enemiesDamaged++;

          // Call collision callback if registered
          if (skillEnemyCallback) {
            skillEnemyCallback(skill, entity, gameState);
          }
          
          // If this skill is not an area effect, break after first hit
          if (!skill.isAreaEffect) {
            break;
          }
        }
      }
    }
  }

  // Process power-up collisions
  processPowerUpCollisions(gameState) {
    if (!gameState.player || !gameState.powerUps) return;

    for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
      const powerUp = gameState.powerUps[i];

      // Skip if power-up is invalid
      if (!powerUp || typeof powerUp.x !== 'number') continue;

      this.potentialCollisions++;

      // Check collision with player
      if (this.checkCollision(gameState.player, powerUp)) {
        // Apply power-up effect
        if (powerUp.apply) {
          powerUp.apply(gameState);
        }

        // Remove power-up
        gameState.powerUps.splice(i, 1);

        this.actualCollisions++;

        // Call collision callback if registered
        const callbackKey = 'PLAYER_POWERUP';
        if (this.collisionCallbacks[callbackKey]) {
          this.collisionCallbacks[callbackKey](gameState.player, powerUp, gameState);
        }
      }
    }
  }

  // Get collision stats
  getStats() {
    return {
      potentialCollisions: this.potentialCollisions,
      actualCollisions: this.lastFrameCollisions,
      checkFrequency: this.checkFrequency
    };
  }

  // Display collision stats (for debug)
  displayStats(x, y) {
    push();
    textAlign(LEFT);
    textSize(14);
    fill(255);
    text(`Collisions: ${this.lastFrameCollisions}`, x, y);
    text(`Check Frequency: ${this.checkFrequency}`, x, y + 20);
    pop();
  }
}

// Create and export a singleton instance
const collisionManager = new CollisionManager();
export default collisionManager;