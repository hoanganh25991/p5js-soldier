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
  updateSettings() {
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
    
    // Check all cells within radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const cellKey = `${centerCellX + dx},${centerCellZ + dz}`;
        if (this.grid[cellKey]) {
          nearby.push(...this.grid[cellKey]);
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
    
    // Check collision masks if groups are defined
    if (entity1.collisionGroup && entity2.collisionGroup) {
      // Get mask for entity1's group
      let mask = 0;
      for (const group in this.collisionGroups) {
        if (this.collisionGroups[group] === entity1.collisionGroup) {
          mask = this.collisionMasks[group];
          break;
        }
      }
      
      // Skip if entity2's group is not in entity1's mask
      if ((mask & entity2.collisionGroup) === 0) {
        return false;
      }
    }
    
    // Broad phase - bounding sphere check
    const dx = entity1.x - entity2.x;
    const dz = entity1.z - entity2.z;
    const distanceSquared = dx * dx + dz * dz;
    
    // Use width as radius if available, otherwise default to 20
    const radius1 = entity1.width || entity1.size || 20;
    const radius2 = entity2.width || entity2.size || 20;
    const minDistance = radius1 + radius2;
    
    if (distanceSquared > minDistance * minDistance) {
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
    // Update settings
    this.updateSettings();
    
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
    
    // Process collisions for each entity type
    this.processBulletEnemyCollisions(gameState);
    this.processPlayerEnemyCollisions(gameState);
    this.processSkillEnemyCollisions(gameState);
    this.processPowerUpCollisions(gameState);
    
    // Store collision stats
    this.lastFrameCollisions = this.actualCollisions;
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
  processBulletEnemyCollisions(gameState) {
    if (!gameState.bullets || !gameState.enemies) return;
    
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = gameState.bullets[i];
      
      // Skip if bullet is invalid
      if (!bullet || typeof bullet.x !== 'number') continue;
      
      // Get nearby enemies using spatial grid
      const nearbyEntities = this.getNearbyEntities(bullet.x, bullet.z, this.gridSize);
      
      let hitSomething = false;
      
      for (const entity of nearbyEntities) {
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
          const callbackKey = 'BULLET_ENEMY';
          if (this.collisionCallbacks[callbackKey]) {
            this.collisionCallbacks[callbackKey](bullet, entity, gameState);
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
    
    // Get nearby enemies using spatial grid
    const nearbyEntities = this.getNearbyEntities(gameState.player.x, gameState.player.z, this.gridSize);
    
    for (const entity of nearbyEntities) {
      // Skip if not an enemy
      if (entity.collisionGroup !== this.collisionGroups.ENEMY) continue;
      
      this.potentialCollisions++;
      
      // Check collision
      if (this.checkCollision(gameState.player, entity)) {
        // Apply damage to player
        if (gameState.player.takeDamage) {
          gameState.player.takeDamage(CONFIG.ENEMY_DAMAGE_TO_PLAYER);
        }
        
        this.actualCollisions++;
        
        // Call collision callback if registered
        const callbackKey = 'PLAYER_ENEMY';
        if (this.collisionCallbacks[callbackKey]) {
          this.collisionCallbacks[callbackKey](gameState.player, entity, gameState);
        }
      }
    }
  }
  
  // Process skill-enemy collisions
  processSkillEnemyCollisions(gameState) {
    // Process each skill type that can damage enemies
    this.processSkillTypeEnemyCollisions(gameState.turrets, gameState);
    this.processSkillTypeEnemyCollisions(gameState.lasers, gameState);
    this.processSkillTypeEnemyCollisions(gameState.airstrikes, gameState);
    this.processSkillTypeEnemyCollisions(gameState.fireSkills, gameState);
  }
  
  // Process collisions between a specific skill type and enemies
  processSkillTypeEnemyCollisions(skills, gameState) {
    if (!skills || !gameState.enemies) return;
    
    for (const skill of skills) {
      // Skip if skill is invalid or doesn't have a damage method
      if (!skill || typeof skill.x !== 'number' || !skill.damage) continue;
      
      // Get nearby enemies using spatial grid
      const nearbyEntities = this.getNearbyEntities(skill.x, skill.z, skill.radius || this.gridSize);
      
      for (const entity of nearbyEntities) {
        // Skip if not an enemy
        if (!entity.takeDamage || entity.collisionGroup !== this.collisionGroups.ENEMY) continue;
        
        this.potentialCollisions++;
        
        // Check collision
        if (this.checkCollision(skill, entity)) {
          // Apply damage to enemy
          const damage = skill.damage || 10;
          entity.takeDamage(damage);
          
          this.actualCollisions++;
          
          // Call collision callback if registered
          const callbackKey = 'SKILL_ENEMY';
          if (this.collisionCallbacks[callbackKey]) {
            this.collisionCallbacks[callbackKey](skill, entity, gameState);
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