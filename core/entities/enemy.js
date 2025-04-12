// Enemy class
// Represents an enemy entity with properties and rendering

class Enemy {
  constructor(x, z, attributes, gameState) {
    this.gameState = gameState;
    this.x = x;
    this.z = z;
    this.y = 0;

    // Random attributes with multipliers
    let sizeMultiplier = attributes.sizeMultiplier || 1;
    this.width = CONFIG.ENEMY_WIDTH * sizeMultiplier;
    this.height = CONFIG.ENEMY_HEIGHT * sizeMultiplier;
    this.depth = CONFIG.ENEMY_DEPTH * sizeMultiplier;

    // Health scales with size
    this.maxHealth = CONFIG.ENEMY_HEALTH * (sizeMultiplier * 1.5);
    this.health = this.maxHealth;

    // Bigger enemies are slower
    this.speed = CONFIG.ENEMY_SPEED / sizeMultiplier;

    // Damage scales with size
    this.damageMultiplier = sizeMultiplier;

    this.rotation = 0;

    // Store color attributes
    this.baseColor = attributes.baseColor || color(255, 0, 0);
    this.damageColor = attributes.damageColor || color(255, 165, 0);
    this.colorBlend = attributes.colorBlend || 0; // 0 = base color, 1 = damage color
  }

  static spawnRandom(gameState) {
    let angle = random(TWO_PI);
    let radius = CONFIG.ENEMY_RADIUS;
    let x = cos(angle) * radius;
    let z = sin(angle) * radius;

    // Random attributes
    let sizeMultiplier = random(0.7, 1.5); // Size variation
    let colorBlend = random(); // How much damage color to show

    // Different enemy types
    let attributes = {
      sizeMultiplier: sizeMultiplier,
      baseColor: color(255, 0, 0), // Base red
      damageColor: color(255, 165, 0), // Orange for damage
      colorBlend: colorBlend
    };

    return new Enemy(x, z, attributes, gameState);
  }

  update() {
    // Calculate movement towards the center (pillar)
    let angle = atan2(0 - this.z, 0 - this.x);
    this.x += cos(angle) * this.speed;
    this.z += sin(angle) * this.speed;
    this.rotation = angle + HALF_PI; // Make enemy face the pillar

    // Check if enemy has reached the pillar
    if (dist(this.x, this.z, 0, 0) < 50) {
      this.gameState.pillarHeight = max(0, this.gameState.pillarHeight - CONFIG.ENEMY_DAMAGE_TO_PILLAR);
      if (this.gameState.pillarHeight === 0) {
        this.gameState.playerHealth -= CONFIG.ENEMY_DAMAGE_TO_PLAYER;
      }
    }
  }

  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);

    // Calculate color based on health and damage type
    let healthPercent = this.health / this.maxHealth;
    let r = lerp(this.baseColor._getRed(), this.damageColor._getRed(), this.colorBlend);
    let g = lerp(this.baseColor._getGreen(), this.damageColor._getGreen(), this.colorBlend);
    let b = lerp(this.baseColor._getBlue(), this.damageColor._getBlue(), this.colorBlend);

    // Darken based on health
    r *= healthPercent;
    g *= healthPercent;
    b *= healthPercent;

    fill(r, g, b);
    box(this.width, this.height, this.depth);
    pop();
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }

  getPosition() {
    return { x: this.x, y: this.y, z: this.z };
  }
}