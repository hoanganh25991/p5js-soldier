// Clone class

class Clone {
  constructor(x, y, z, gameState) {
    this.gameState = gameState;
    // Position
    this.x = x;
    this.y = y;
    this.z = z;

    // Scale everything down to 70%
    const scale = 0.7;
    this.width = CONFIG.PLAYER_WIDTH * scale;
    this.height = CONFIG.PLAYER_HEIGHT * scale;
    this.depth = CONFIG.PLAYER_DEPTH * scale;

    // Combat stats
    this.health = CONFIG.PLAYER_HEALTH * scale;
    this.damage = CONFIG.BULLET.PLAYER.DAMAGE * scale;

    // Clone specific
    this.lifespan = CONFIG.CLONE.DURATION;
    this.rotation = 0;
    this.opacity = 180; // Slightly transparent
  }

  findNearestEnemies(count = 1) {
    return findNearestEnemies(this, count, this.gameState);
  }

  showAimLine(target, aimColor = [0, 255, 0]) {
    // Get gun position (slightly above clone center)
    let gunX = this.x;
    let gunZ = this.z;
    let gunY = this.y - this.height / 3; // Gun position above center

    // Calculate angle to target
    let angle = atan2(target.z - gunZ, target.x - gunX);

    // Draw aim line from gun to enemy
    stroke(...aimColor);
    strokeWeight(2);
    beginShape();
    vertex(gunX, gunY, gunZ); // Start at gun
    vertex(target.x, target.y + target.height / 2, target.z); // End at enemy top
    endShape();

    // Draw target marker
    push();
    translate(target.x, target.y + target.height / 2, target.z);
    stroke(255, 0, 0);
    strokeWeight(4);
    point(0, 0, 0); // Target point
    pop();

    return { gunX, gunY, gunZ, angle };
  }

  autoShoot(targetCount = 1) {
    if (this.gameState.frameCount % CONFIG.CLONE.FIRE_RATE !== 0) return;

    // Find multiple targets
    let targets = this.findNearestEnemies(targetCount);
    if (!Array.isArray(targets)) targets = targets ? [targets] : [];

    // Draw aim lines for all targets
    push();
    for (let target of targets) {
      let { gunX, gunY, gunZ, angle } = this.showAimLine(target, [0, 255, 0]);

      // Update rotation to face target
      this.rotation = angle + HALF_PI;

      // Spawn bullet with target info and clone as source
      this.gameState.bullets.push(new Bullet(gunX, gunY, gunZ, angle, target, this, this.gameState));
      break; // Only shoot at first target
    }
    pop();
  }

  update() {
    this.lifespan--;
  }

  show() {
    this.autoShoot(3); // Auto-target and show aim lines for 3 nearest enemies

    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);

    // Clone body - lighter green and slightly transparent
    fill(100, 255, 100, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, this.opacity));
    box(this.width, this.height, this.depth);

    // Gun
    push();
    translate(-this.width / 2, -this.height / 4, 0);
    fill(150, 150, 150, map(this.lifespan, 0, CONFIG.CLONE.DURATION, 0, this.opacity));
    rotateZ(HALF_PI);
    cylinder(3, 15); // Slightly smaller gun
    pop();

    pop();
  }
}