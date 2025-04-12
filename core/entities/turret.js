// Turret class

class Turret {
  constructor(x, y, z, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = 25;
    this.height = 35;
    this.depth = 25;
    this.lifespan = CONFIG.TURRET.DURATION;
    this.rotation = 0;
    this.damage = CONFIG.TURRET.DAMAGE;
    this.updateHeight(); // Initialize height
    this.legLength = 20;
  }

  findNearestEnemies(count = 1) {
    return findNearestEnemies(this, count, this.gameState);
  }

  showAimLine(target, gunZ) {
    return showAimLine(this, target, gunZ, [255, 0, 0]);
  }

  autoShoot(targetCount = CONFIG.TURRET.MAX_TARGETS) {
    autoShoot(this, targetCount, CONFIG.TURRET.FIRE_RATE, this.gameState);
  }

  update() {
    this.lifespan--;
    this.updateHeight();
    this.autoShoot();
  }

  updateHeight() {
    updateHeight(this, this.gameState);
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);

    // Draw legs
    push();
    fill(80);
    strokeWeight(2);
    stroke(60);

    // Front legs
    push();
    translate(this.width / 3, 0, this.depth / 3);
    box(3, this.legLength, 3);
    pop();

    push();
    translate(-this.width / 3, 0, this.depth / 3);
    box(3, this.legLength, 3);
    pop();

    // Back legs
    push();
    translate(this.width / 3, 0, -this.depth / 3);
    box(3, this.legLength, 3);
    pop();

    push();
    translate(-this.width / 3, 0, -this.depth / 3);
    box(3, this.legLength, 3);
    pop();
    pop();

    // Base - slightly above ground due to legs
    translate(0, -this.legLength / 2, 0);
    fill(100, 100, 255, map(this.lifespan, 0, CONFIG.TURRET.DURATION, 0, 255));
    box(this.width, this.height / 2, this.depth);

    // Upper part (gun mount)
    push();
    translate(0, -this.height / 3, 0);
    fill(80);
    box(this.width / 1.5, this.height / 3, this.depth / 1.5);
    pop();

    // Double gun barrels
    push();
    translate(this.width / 2, -this.height / 3, 0);
    fill(40);
    rotateZ(HALF_PI);

    // Top barrel
    push();
    translate(0, 0, 3);
    cylinder(2, 20);
    pop();

    // Bottom barrel
    push();
    translate(0, 0, -3);
    cylinder(2, 20);
    pop();

    pop();

    pop();
  }
}