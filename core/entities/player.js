// Player Module

import CONFIG from '../config.js';
import { updateHeight, showAimLine, autoShoot, findNearestEnemies } from '../utils.js';

export class Player {
  constructor(gameState) {
    this.gameState = gameState;
    this.x = 0;
    this.y = 0; // Will be calculated based on pillar height
    this.z = 0;
    this.width = CONFIG.PLAYER_WIDTH;
    this.height = CONFIG.PLAYER_HEIGHT;
    this.depth = CONFIG.PLAYER_DEPTH;
    this.rotation = 0;
    this.targetEnemy = null;
    this.updateHeight(); // Initialize height
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
    autoShoot(this, targetCount, CONFIG.FIRE_RATE, this.gameState);
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