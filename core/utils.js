// Utility Module
// Utility functions used across the game

import CONFIG from '../config.js';
import { Bullet } from './entities/bullet.js';

// Update entity height based on tower height
export function updateHeight(entity, gameState) {
  // Adjust height based on tower height
  entity.y = -20 - gameState.towerHeight * 5 + entity.height / 2;
}

// Draw aim line from source to target
export function showAimLine(source, target, gunZ = null, aimColor = [255, 255, 0]) {
  // Get gun position (slightly above source center)
  let gunX = source.x;
  let gunY = source.y - source.height / 3;
  if (gunZ === null) gunZ = source.z;

  // Calculate angle to target
  let angle = atan2(target.z - gunZ, target.x - gunX);

  // Draw aim line
  push();
  stroke(...aimColor);
  strokeWeight(2);
  noFill();
  beginShape(LINES);
  vertex(gunX, gunY, gunZ);
  vertex(target.x, target.y + target.height / 2, target.z);
  endShape();
  pop();

  return { gunX, gunY, gunZ, angle };
}

// Auto-shoot at nearest enemies
export function autoShoot(source, targetCount = 1, fireRate = CONFIG.FIRE_RATE, gameState) {
  if (gameState.frameCount % fireRate !== 0) return;

  // Find targets
  let targets = source.findNearestEnemies(targetCount);

  // Debug logging only 1% of the time to reduce console spam
  if (Math.random() < 0.01) {
    console.log(`${source.constructor.name} found ${targets.length} targets`);
  }

  // Draw aim lines and shoot at all targets
  for (let target of targets) {
    let { gunX, gunY, gunZ, angle } = showAimLine(source, target);
    source.rotation = angle + HALF_PI;

    // Debug logging only 1% of the time
    if (Math.random() < 0.01) {
      console.log(`Shooting at target: ${target.x.toFixed(0)}, ${target.y.toFixed(0)}, ${target.z.toFixed(0)}`);
    }

    // Create bullet
    gameState.bullets.push(new Bullet(gunX, gunY, gunZ, angle, target, source, gameState));
    
    // Play shoot sound with optimized handling based on entity type
    if (source.constructor.name === 'Player') {
      // For player, use lower volume but higher priority
      gameState.soundManager.playWithTempVolume('shoot', 0.2, {
        priority: gameState.soundManager.PRIORITY.HIGH,
        sourceType: 'player'
      });
    } else {
      // For other entities (clones, turrets), use normal volume with batching
      gameState.soundManager.play('shoot', {
        allowBatching: true,
        priority: gameState.soundManager.PRIORITY.MEDIUM,
        sourceType: source.constructor.name
      });
    }
  }
}

// Find nearest enemies to a source
export function findNearestEnemies(source, count = 1, gameState) {
  // Get enemies from the controller
  const enemies = gameState.enemyController ? gameState.enemyController.getEnemies() : [];
  
  if (enemies.length === 0) return [];

  // Sort enemies by distance to source
  return enemies
    .map(enemy => ({
      enemy,
      distance: dist(source.x, source.z, enemy.x, enemy.z)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(data => data.enemy);
}