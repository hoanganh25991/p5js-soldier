// Player Module

import CONFIG from '../../config.js';
import { updateHeight, showAimLine, autoShoot, findNearestEnemies } from '../utils.js';
import { Bullet } from './bullet.js';

export class Player {
  constructor(gameState) {
    this.gameState = gameState;
    this.x = 0;
    this.y = 0; // Will be calculated based on tower height
    this.z = 0;
    this.width = CONFIG.PLAYER_WIDTH;
    this.height = CONFIG.PLAYER_HEIGHT;
    this.depth = CONFIG.PLAYER_DEPTH;
    this.rotation = 0;
    this.targetEnemy = null;
    this.updateHeight(); // Initialize height
  }
  
  // Add takeDamage method to handle damage from boss projectiles
  takeDamage(amount) {
    // Reduce player health in the game state
    this.gameState.playerHealth -= amount;
    
    // Ensure health doesn't go below 0
    if (this.gameState.playerHealth < 0) {
      this.gameState.playerHealth = 0;
    }
    
    // Play hit sound if available
    if (this.gameState.soundManager && this.gameState.soundManager.play) {
      this.gameState.soundManager.play('hit', {
        priority: this.gameState.soundManager.PRIORITY.HIGH,
        sourceType: 'player'
      });
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);

    // Player body
    fill(0, 255, 0);
    box(this.width, this.height, this.depth);

    // Gun
    push();
    translate(-this.width / 2, -this.height / 4, 0);
    fill(100);
    rotateZ(HALF_PI);
    cylinder(4, 20);
    pop();

    pop();
  }

  findNearestEnemies(count = 1) {
    return findNearestEnemies(this, count, this.gameState);
  }

  showAimLine(target, aimColor = [255, 255, 0]) {
    return showAimLine(this, target, null, aimColor);
  }

  autoShoot(targetCount = 1) {
    // Custom implementation for player to reduce sound volume
    if (this.gameState.frameCount % CONFIG.FIRE_RATE !== 0) return;

    // Find targets
    let targets = this.findNearestEnemies(targetCount);

    // Draw aim lines and shoot at all targets
    for (let target of targets) {
      let { gunX, gunY, gunZ, angle } = this.showAimLine(target);
      this.rotation = angle + HALF_PI;

      // Create bullet
      this.gameState.bullets.push(new Bullet(gunX, gunY, gunZ, angle, target, this, this.gameState));
      
      // Play shoot sound at reduced volume using sound manager
      this.gameState.soundManager.playWithTempVolume('shoot', this.gameState.masterVolume * 0.2, {
        priority: this.gameState.soundManager.PRIORITY.HIGH,
        sourceType: 'player'
      });
    }
  }

  update() {
    this.updateHeight();
    this.autoShoot();
  }

  updateHeight() {
    updateHeight(this, this.gameState);
    // Update clones height too
    for (let clone of this.gameState.clones) {
      updateHeight(clone, this.gameState);
    }
  }
}