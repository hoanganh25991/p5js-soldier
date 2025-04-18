// Boss Module
// Represents a boss enemy with advanced properties, attacks, and visuals

import CONFIG from '../../config.js';
import { Enemy } from './enemy.js';
import { HealthBar } from './healthBar.js';
import { Wave } from './wave.js';

export class Boss extends Enemy {
  constructor(x, z, bossType, gameState) {
    // Get boss type configuration
    const bossConfig = CONFIG.BOSS.TYPES[bossType];
    if (!bossConfig) {
      console.error(`Invalid boss type: ${bossType}`);
      bossType = 'TITAN'; // Default to TITAN if invalid type
    }
    
    // Create base attributes for the boss
    const attributes = {
      sizeMultiplier: CONFIG.BOSS.SIZE_MULTIPLIER,
      baseColor: color(...bossConfig.COLOR),
      damageColor: color(255, 0, 0),
      colorBlend: 0.2
    };
    
    // Call parent constructor
    super(x, z, attributes, gameState);
    
    // Boss-specific properties
    this.bossType = bossType;
    this.name = bossConfig.NAME;
    this.isSpecial = true; // Flag as special enemy
    
    // Override health with boss-specific values
    this.maxHealth = CONFIG.ENEMY_HEALTH * CONFIG.BOSS.HEALTH_MULTIPLIER * bossConfig.HEALTH_MODIFIER;
    this.health = this.maxHealth;
    
    // Override speed with boss-specific values
    this.speed = CONFIG.ENEMY_SPEED * CONFIG.BOSS.SPEED_MULTIPLIER;
    
    // Override damage with boss-specific values
    this.damageMultiplier = CONFIG.BOSS.DAMAGE_MULTIPLIER * bossConfig.ATTACK_MODIFIER;
    
    // Special ability
    this.specialAbility = bossConfig.SPECIAL_ABILITY;
    
    // Attack cooldowns
    this.attackCooldowns = {
      GROUND_SLAM: 0,
      PROJECTILE_BURST: 0,
      SUMMON_MINIONS: 0
    };
    
    // Visual effects
    this.auraColor = CONFIG.BOSS.EFFECTS.AURA_COLOR;
    this.auraSize = CONFIG.BOSS.EFFECTS.AURA_SIZE;
    this.particleColors = CONFIG.BOSS.EFFECTS.PARTICLE_COLORS;
    this.particles = [];
    
    // Create a custom health bar for the boss
    this.healthBar = new HealthBar({
      height: CONFIG.BOSS.HEALTH_BAR.HEIGHT,
      verticalOffset: CONFIG.BOSS.HEALTH_BAR.OFFSET,
      useEntityWidth: true,
      widthMultiplier: 1.5,
      showPercentage: CONFIG.BOSS.HEALTH_BAR.SHOW_PERCENTAGE,
      showName: CONFIG.BOSS.HEALTH_BAR.SHOW_NAME,
      name: this.name
    });
    
    // Animation properties
    this.rotationSpeed = 0.01;
    this.hoverAmplitude = 5;
    this.hoverSpeed = 0.05;
    this.hoverOffset = random(TWO_PI); // Random starting phase
    this.scale = 1.0;
    this.targetScale = 1.0;
    
    // Boss state
    this.state = 'idle'; // idle, attacking, charging, stunned
    this.stateTimer = 0;
    this.attackPhase = 0;
    
    // Create projectiles array for special attacks
    this.projectiles = [];
  }
  
  static spawnRandom(gameState) {
    // Choose a random boss type
    const bossTypes = Object.keys(CONFIG.BOSS.TYPES);
    const randomType = bossTypes[Math.floor(random(bossTypes.length))];
    
    // Spawn at a random position on the edge of the world
    let angle = random(TWO_PI);
    let radius = CONFIG.ENEMY_RADIUS * 1.2; // Spawn slightly further away than regular enemies
    let x = cos(angle) * radius;
    let z = sin(angle) * radius;
    
    // Create and return the boss
    return new Boss(x, z, randomType, gameState);
  }
  
  update() {
    // Update base enemy behavior
    super.update();
    
    // Update boss-specific animations
    this.updateAnimations();
    
    // Update attack cooldowns
    this.updateCooldowns();
    
    // Update boss state
    this.updateState();
    
    // Update particles
    this.updateParticles();
    
    // Update projectiles
    this.updateProjectiles();
    
    // Perform special attacks based on boss type
    this.performSpecialAttacks();
  }
  
  updateAnimations() {
    // Hover animation
    this.y = sin(frameCount * this.hoverSpeed + this.hoverOffset) * this.hoverAmplitude;
    
    // Smooth scale transitions
    this.scale = lerp(this.scale, this.targetScale, 0.1);
    
    // Rotate the boss slowly
    this.rotation += this.rotationSpeed;
  }
  
  updateCooldowns() {
    // Decrease all cooldowns
    for (let attack in this.attackCooldowns) {
      if (this.attackCooldowns[attack] > 0) {
        this.attackCooldowns[attack]--;
      }
    }
  }
  
  updateState() {
    // Update state timer
    if (this.stateTimer > 0) {
      this.stateTimer--;
    } else {
      // Reset to idle state when timer expires
      if (this.state !== 'idle') {
        this.state = 'idle';
        this.targetScale = 1.0;
      }
    }
  }
  
  updateParticles() {
    // Add new particles occasionally
    if (frameCount % 5 === 0) {
      this.addParticle();
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;
      
      // Update particle life
      particle.life -= particle.decay;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  addParticle() {
    // Choose a random color from the particle colors
    const colorIndex = Math.floor(random(this.particleColors.length));
    const particleColor = this.particleColors[colorIndex];
    
    // Create a new particle
    const particle = {
      x: random(-this.width/2, this.width/2),
      y: random(-this.height/2, this.height/2),
      z: random(-this.depth/2, this.depth/2),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      vz: random(-0.5, 0.5),
      size: random(3, 8),
      color: color(...particleColor, random(150, 255)),
      life: random(30, 60),
      decay: random(0.5, 1.5)
    };
    
    // Add the particle to the array
    this.particles.push(particle);
  }
  
  updateProjectiles() {
    // Update existing projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update projectile position
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;
      projectile.z += projectile.vz;
      
      // Update projectile life
      projectile.life--;
      
      // Check for collisions with player or characters
      this.checkProjectileCollisions(projectile);
      
      // Remove dead projectiles
      if (projectile.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  checkProjectileCollisions(projectile) {
    // Check collision with player
    if (this.gameState.player) {
      const player = this.gameState.player;
      const distance = dist(projectile.x, projectile.z, player.x, player.z);
      
      if (distance < player.width) {
        // Damage player
        player.takeDamage(projectile.damage);
        
        // Remove projectile
        projectile.life = 0;
      }
    }
    
    // Check collision with characters
    for (const character of this.gameState.gameCharacters) {
      const distance = dist(projectile.x, projectile.z, character.x, character.z);
      
      if (distance < character.width) {
        // Damage character
        character.takeDamage(projectile.damage);
        
        // Remove projectile
        projectile.life = 0;
        break;
      }
    }
  }
  
  performSpecialAttacks() {
    // Only perform attacks if in idle state
    if (this.state !== 'idle') return;
    
    // Perform special attack based on boss type
    switch (this.specialAbility) {
      case 'GROUND_SLAM':
        this.performGroundSlam();
        break;
      case 'PROJECTILE_BURST':
        this.performProjectileBurst();
        break;
      case 'SUMMON_MINIONS':
        this.performSummonMinions();
        break;
    }
  }
  
  performGroundSlam() {
    // Check cooldown
    if (this.attackCooldowns.GROUND_SLAM > 0) return;
    
    // Set cooldown
    this.attackCooldowns.GROUND_SLAM = CONFIG.BOSS.ATTACKS.GROUND_SLAM.COOLDOWN;
    
    // Change state
    this.state = 'attacking';
    this.stateTimer = 60; // 1 second animation
    
    // Visual effect: boss grows then shrinks
    this.targetScale = 1.3;
    
    // After a delay, perform the actual slam
    setTimeout(() => {
      // Find all entities within radius
      const radius = CONFIG.BOSS.ATTACKS.GROUND_SLAM.RADIUS;
      const damage = CONFIG.BOSS.ATTACKS.GROUND_SLAM.DAMAGE * this.damageMultiplier;
      
      // Damage player if within radius
      if (this.gameState.player) {
        const distance = dist(this.x, this.z, this.gameState.player.x, this.gameState.player.z);
        if (distance < radius) {
          this.gameState.player.takeDamage(damage);
        }
      }
      
      // Damage characters if within radius
      for (const character of this.gameState.gameCharacters) {
        const distance = dist(this.x, this.z, character.x, character.z);
        if (distance < radius) {
          character.takeDamage(damage);
        }
      }
      
      // Create visual shockwave effect using the Wave class
      const shockwave = new Wave(this.x, this.y, this.z, 0, [255, 100, 0, 150], this.gameState);
      shockwave.maxRadius = radius;
      shockwave.lifespan = CONFIG.BOSS.ATTACKS.GROUND_SLAM.EFFECT_DURATION;
      this.gameState.waves.push(shockwave);
      
      // Reset scale
      this.targetScale = 1.0;
    }, 500); // 500ms delay
  }
  
  performProjectileBurst() {
    // Check cooldown
    if (this.attackCooldowns.PROJECTILE_BURST > 0) return;
    
    // Set cooldown
    this.attackCooldowns.PROJECTILE_BURST = CONFIG.BOSS.ATTACKS.PROJECTILE_BURST.COOLDOWN;
    
    // Change state
    this.state = 'attacking';
    this.stateTimer = 60; // 1 second animation
    
    // Visual effect: boss pulses
    this.targetScale = 1.2;
    
    // Create projectiles in a burst pattern
    const count = CONFIG.BOSS.ATTACKS.PROJECTILE_BURST.COUNT;
    const speed = CONFIG.BOSS.ATTACKS.PROJECTILE_BURST.SPEED;
    const damage = CONFIG.BOSS.ATTACKS.PROJECTILE_BURST.DAMAGE * this.damageMultiplier;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TWO_PI;
      
      // Create projectile
      const projectile = {
        x: this.x,
        y: this.y,
        z: this.z,
        vx: cos(angle) * speed,
        vy: 0,
        vz: sin(angle) * speed,
        size: 10,
        color: color(255, 100, 0),
        damage: damage,
        life: 120 // 2 seconds at 60fps
      };
      
      // Add projectile to array
      this.projectiles.push(projectile);
    }
  }
  
  performSummonMinions() {
    // Check cooldown
    if (this.attackCooldowns.SUMMON_MINIONS > 0) return;
    
    // Set cooldown
    this.attackCooldowns.SUMMON_MINIONS = CONFIG.BOSS.ATTACKS.SUMMON_MINIONS.COOLDOWN;
    
    // Change state
    this.state = 'attacking';
    this.stateTimer = 90; // 1.5 seconds animation
    
    // Visual effect: boss grows
    this.targetScale = 1.4;
    
    // After a delay, summon minions
    setTimeout(() => {
      const count = CONFIG.BOSS.ATTACKS.SUMMON_MINIONS.COUNT;
      
      // Summon minions around the boss
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * TWO_PI;
        const distance = 100; // Distance from boss
        
        // Calculate position
        const x = this.x + cos(angle) * distance;
        const z = this.z + sin(angle) * distance;
        
        // Create minion attributes
        const attributes = {
          sizeMultiplier: 0.7,
          baseColor: color(...CONFIG.BOSS.TYPES[this.bossType].COLOR, 200),
          damageColor: color(255, 0, 0),
          colorBlend: 0.3,
          isMinionOf: this.id // Reference to parent boss
        };
        
        // Create and add minion to game state
        const minion = new Enemy(x, z, attributes, this.gameState);
        minion.health = minion.maxHealth * 0.5; // Minions have less health
        minion.isMinion = true;
        
        // Add to game state
        this.gameState.enemies.push(minion);
        
        // Create summon effect using the Wave class
        const summonWave = new Wave(x, 0, z, 0, [100, 0, 100, 150], this.gameState);
        summonWave.maxRadius = 50;
        summonWave.lifespan = 30;
        this.gameState.waves.push(summonWave);
      }
      
      // Reset scale
      this.targetScale = 1.0;
    }, 1000); // 1000ms delay
  }
  
  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.rotation);
    
    // Apply scale
    scale(this.scale);
    
    // Draw aura
    this.drawAura();
    
    // Draw particles
    this.drawParticles();
    
    // Calculate color based on health and damage type
    let healthPercent = this.health / this.maxHealth;
    
    // Ensure healthPercent is valid (not NaN or negative)
    healthPercent = isNaN(healthPercent) ? 0 : Math.max(0, Math.min(1, healthPercent));
    
    let r = lerp(this.baseColor._getRed(), this.damageColor._getRed(), this.colorBlend);
    let g = lerp(this.baseColor._getGreen(), this.damageColor._getGreen(), this.colorBlend);
    let b = lerp(this.baseColor._getBlue(), this.damageColor._getBlue(), this.colorBlend);
    
    // Darken based on health
    r = r * healthPercent;
    g = g * healthPercent;
    b = b * healthPercent;
    
    // Draw the boss body
    fill(r, g, b);
    
    // Draw a more complex shape for the boss instead of just a box
    this.drawBossShape();
    
    // Draw health bar above the boss
    this.drawHealthBar();
    
    pop();
    
    // Draw projectiles
    this.drawProjectiles();
  }
  
  drawAura() {
    // Draw aura around the boss
    push();
    noStroke();
    fill(...this.auraColor);
    
    // Scale slightly larger than the boss
    scale(this.auraSize);
    
    // Use sphere for aura
    sphere(max(this.width, this.height, this.depth) / 1.5);
    pop();
  }
  
  drawParticles() {
    // Draw all particles
    for (const particle of this.particles) {
      push();
      translate(particle.x, particle.y, particle.z);
      noStroke();
      fill(particle.color);
      sphere(particle.size * (particle.life / 60)); // Size decreases as life decreases
      pop();
    }
  }
  
  drawBossShape() {
    // Draw a more complex shape for the boss based on its type
    switch (this.bossType) {
      case 'TITAN':
        this.drawTitanShape();
        break;
      case 'NECROMANCER':
        this.drawNecromancerShape();
        break;
      case 'JUGGERNAUT':
        this.drawJuggernautShape();
        break;
      default:
        // Fallback to basic box
        box(this.width, this.height, this.depth);
    }
  }
  
  drawTitanShape() {
    // Main body structure
    push();
    
    // Draw torso - muscular body
    fill(80, 60, 40); // Stone-like color
    box(this.width, this.height * 0.6, this.depth);
    
    // Add chest details - armor plates
    push();
    translate(0, -this.height * 0.1, this.depth * 0.4);
    fill(100, 80, 60); // Lighter stone color
    box(this.width * 0.8, this.height * 0.3, this.depth * 0.1);
    
    // Add central gem
    translate(0, 0, this.depth * 0.06);
    fill(200, 50, 0, 200); // Glowing red gem
    sphere(this.width * 0.1);
    pop();
    
    // Draw waist and belt
    push();
    translate(0, this.height * 0.2, 0);
    fill(60, 40, 20); // Darker stone
    box(this.width * 0.8, this.height * 0.1, this.depth * 0.8);
    
    // Belt buckle
    translate(0, 0, this.depth * 0.4);
    fill(150, 120, 0); // Gold color
    box(this.width * 0.3, this.height * 0.05, this.depth * 0.05);
    pop();
    
    // Draw legs
    push();
    translate(0, this.height * 0.4, 0);
    
    // Left leg
    push();
    translate(-this.width * 0.25, 0, 0);
    fill(70, 50, 30); // Stone color
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Knee armor
    translate(0, this.height * 0.1, this.depth * 0.15);
    fill(100, 80, 60); // Lighter stone
    sphere(this.width * 0.12);
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.25, 0, 0);
    fill(70, 50, 30); // Stone color
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Knee armor
    translate(0, this.height * 0.1, this.depth * 0.15);
    fill(100, 80, 60); // Lighter stone
    sphere(this.width * 0.12);
    pop();
    pop();
    
    // Draw shoulders (wider than body)
    push();
    translate(0, -this.height * 0.25, 0);
    fill(90, 70, 50); // Stone color
    box(this.width * 1.5, this.height * 0.2, this.depth * 0.8);
    
    // Left shoulder spike
    push();
    translate(-this.width * 0.7, -this.height * 0.05, 0);
    fill(60, 40, 20); // Darker stone
    rotateZ(-PI/6);
    cone(this.width * 0.15, this.height * 0.3, 4); // Square spike
    pop();
    
    // Right shoulder spike
    push();
    translate(this.width * 0.7, -this.height * 0.05, 0);
    fill(60, 40, 20); // Darker stone
    rotateZ(PI/6);
    cone(this.width * 0.15, this.height * 0.3, 4); // Square spike
    pop();
    pop();
    
    // Draw arms
    push();
    // Left arm
    push();
    translate(-this.width * 0.7, 0, 0);
    rotateZ(PI/8);
    
    // Upper arm
    fill(80, 60, 40); // Stone color
    box(this.width * 0.25, this.height * 0.4, this.depth * 0.25);
    
    // Elbow joint
    translate(0, this.height * 0.25, 0);
    fill(100, 80, 60); // Lighter stone
    sphere(this.width * 0.15);
    
    // Forearm - larger for weapon
    translate(0, this.height * 0.2, 0);
    rotateZ(-PI/4);
    fill(70, 50, 30); // Stone color
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Weapon - giant hammer
    translate(0, this.height * 0.3, 0);
    
    // Hammer handle
    push();
    fill(60, 30, 10); // Dark wood color
    rotateX(PI/2);
    cylinder(this.width * 0.05, this.height * 0.6);
    
    // Hammer head
    translate(0, -this.height * 0.3, 0);
    fill(50, 50, 60); // Dark metal
    box(this.width * 0.4, this.width * 0.4, this.height * 0.3);
    
    // Hammer details
    push();
    translate(0, 0, this.height * 0.15);
    fill(150, 120, 0); // Gold accents
    box(this.width * 0.3, this.width * 0.3, this.height * 0.02);
    pop();
    
    push();
    translate(0, 0, -this.height * 0.15);
    fill(150, 120, 0); // Gold accents
    box(this.width * 0.3, this.width * 0.3, this.height * 0.02);
    pop();
    pop();
    pop();
    
    // Right arm
    push();
    translate(this.width * 0.7, 0, 0);
    rotateZ(-PI/8);
    
    // Upper arm
    fill(80, 60, 40); // Stone color
    box(this.width * 0.25, this.height * 0.4, this.depth * 0.25);
    
    // Elbow joint
    translate(0, this.height * 0.25, 0);
    fill(100, 80, 60); // Lighter stone
    sphere(this.width * 0.15);
    
    // Forearm with shield
    translate(0, this.height * 0.2, 0);
    rotateZ(PI/4);
    fill(70, 50, 30); // Stone color
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Shield
    translate(0, this.height * 0.1, this.depth * 0.2);
    rotateX(PI/6);
    fill(50, 50, 60); // Dark metal
    
    // Shield base
    box(this.width * 0.5, this.height * 0.6, this.depth * 0.05);
    
    // Shield boss (center)
    translate(0, 0, this.depth * 0.03);
    fill(150, 120, 0); // Gold
    sphere(this.width * 0.1);
    
    // Shield rim
    translate(0, 0, -this.depth * 0.03);
    noFill();
    stroke(150, 120, 0); // Gold
    strokeWeight(this.width * 0.03);
    rect(0, 0, this.width * 0.5, this.height * 0.6);
    noStroke();
    pop();
    pop();
    
    // Draw neck
    push();
    translate(0, -this.height * 0.3, 0);
    fill(70, 50, 30); // Stone color
    cylinder(this.width * 0.2, this.height * 0.1);
    pop();
    
    // Draw head
    push();
    translate(0, -this.height * 0.45, 0);
    
    // Base head
    fill(90, 70, 50); // Stone color
    sphere(this.width * 0.4);
    
    // Face details
    
    // Eyes - glowing
    push();
    // Left eye
    translate(-this.width * 0.15, -this.width * 0.05, this.width * 0.3);
    fill(200, 50, 0, 200); // Glowing red
    sphere(this.width * 0.08);
    
    // Right eye
    translate(this.width * 0.3, 0, 0);
    sphere(this.width * 0.08);
    pop();
    
    // Mouth - jagged
    push();
    translate(0, this.width * 0.15, this.width * 0.3);
    fill(30, 20, 10); // Dark crevice
    box(this.width * 0.3, this.width * 0.05, this.width * 0.1);
    
    // Teeth
    fill(200, 200, 180); // Bone color
    for (let i = -2; i <= 2; i++) {
      push();
      translate(i * this.width * 0.06, -this.width * 0.03, 0);
      box(this.width * 0.04, this.width * 0.08, this.width * 0.04);
      pop();
    }
    pop();
    
    // Brow ridge
    push();
    translate(0, -this.width * 0.15, this.width * 0.25);
    fill(60, 40, 20); // Darker stone
    box(this.width * 0.5, this.width * 0.08, this.width * 0.15);
    pop();
    
    // Draw horns
    // Left horn
    push();
    translate(-this.width * 0.3, -this.height * 0.1, 0);
    rotateZ(-PI/4);
    
    // Base of horn
    fill(60, 40, 20); // Darker stone
    cylinder(this.width * 0.1, this.height * 0.1);
    
    // Horn segments - getting narrower
    for (let i = 0; i < 3; i++) {
      translate(0, -this.height * 0.1, 0);
      rotateZ(-PI/16); // Slight curve
      fill(70 + i*10, 50 + i*10, 30 + i*10); // Gradually lighter
      cylinder(this.width * (0.08 - i*0.02), this.height * 0.1);
    }
    
    // Horn tip
    translate(0, -this.height * 0.1, 0);
    fill(100, 80, 60); // Lighter stone
    cone(this.width * 0.04, this.height * 0.15);
    pop();
    
    // Right horn
    push();
    translate(this.width * 0.3, -this.height * 0.1, 0);
    rotateZ(PI/4);
    
    // Base of horn
    fill(60, 40, 20); // Darker stone
    cylinder(this.width * 0.1, this.height * 0.1);
    
    // Horn segments - getting narrower
    for (let i = 0; i < 3; i++) {
      translate(0, -this.height * 0.1, 0);
      rotateZ(PI/16); // Slight curve
      fill(70 + i*10, 50 + i*10, 30 + i*10); // Gradually lighter
      cylinder(this.width * (0.08 - i*0.02), this.height * 0.1);
    }
    
    // Horn tip
    translate(0, -this.height * 0.1, 0);
    fill(100, 80, 60); // Lighter stone
    cone(this.width * 0.04, this.height * 0.15);
    pop();
    
    // Crown/helmet
    push();
    translate(0, -this.width * 0.2, 0);
    fill(150, 120, 0); // Gold
    
    // Crown base
    cylinder(this.width * 0.42, this.height * 0.1);
    
    // Crown spikes
    for (let i = 0; i < 8; i++) {
      push();
      const angle = i * TWO_PI / 8;
      rotateY(angle);
      translate(0, -this.height * 0.05, this.width * 0.4);
      fill(180, 150, 20); // Brighter gold
      cone(this.width * 0.05, this.height * 0.15, 3); // Triangular spikes
      pop();
    }
    pop();
    
    pop(); // End head
    
    // Add floating rocks orbiting the Titan
    push();
    for (let i = 0; i < 5; i++) {
      push();
      const angle = frameCount * 0.01 + i * TWO_PI / 5;
      const orbitRadius = this.width * 1.5;
      const x = cos(angle) * orbitRadius;
      const y = sin(angle * 0.5) * this.height * 0.5 - this.height * 0.2;
      const z = sin(angle) * orbitRadius;
      
      translate(x, y, z);
      rotateX(frameCount * 0.02 + i);
      rotateY(frameCount * 0.03 + i);
      
      // Random rock shape
      fill(80 + i*10, 60 + i*5, 40 + i*5);
      if (i % 3 === 0) {
        box(this.width * 0.2, this.width * 0.15, this.width * 0.15);
      } else if (i % 3 === 1) {
        sphere(this.width * 0.12);
      } else {
        cone(this.width * 0.1, this.width * 0.2, 5);
      }
      pop();
    }
    pop();
    
    // Ground crack effect
    push();
    translate(0, this.height * 0.5, 0);
    rotateX(PI/2);
    
    // Crack lines
    stroke(200, 50, 0, 150); // Glowing red
    strokeWeight(3);
    for (let i = 0; i < 8; i++) {
      const angle = i * TWO_PI / 8;
      const len = this.width * (1.2 + sin(frameCount * 0.05 + i) * 0.2);
      
      line(0, 0, cos(angle) * len, sin(angle) * len);
    }
    noStroke();
    pop();
    
    pop(); // End main body
  }
  
  drawNecromancerShape() {
    // Main body - centered at origin
    push();
    
    // Draw main body (thinner)
    fill(30, 10, 40); // Dark purple-black for the main robe
    box(this.width * 0.8, this.height, this.depth * 0.8);
    
    // Draw robe-like bottom (wider at bottom)
    push();
    translate(0, this.height * 0.3, 0);
    fill(40, 0, 60); // Darker purple for the bottom of the robe
    cone(this.width * 1.2, this.height * 0.6, 4); // Square-based cone for robe
    pop();
    
    // Add robe details - belt
    push();
    translate(0, this.height * 0.05, 0);
    fill(100, 0, 0); // Dark red for belt
    rotateX(PI/2);
    cylinder(this.width * 0.5, this.height * 0.05);
    
    // Belt buckle
    translate(0, 0, -this.height * 0.03);
    fill(150, 120, 0); // Gold color
    box(this.width * 0.2, this.width * 0.2, this.height * 0.02);
    pop();
    
    // Add shoulder pads
    push();
    translate(0, -this.height * 0.2, 0);
    fill(60, 0, 80); // Purple for shoulder pads
    
    // Left shoulder pad
    push();
    translate(-this.width * 0.5, 0, 0);
    rotateZ(PI/4);
    box(this.width * 0.4, this.height * 0.1, this.depth * 0.3);
    
    // Shoulder spike
    translate(-this.width * 0.2, 0, 0);
    rotateZ(-PI/4);
    fill(80, 0, 100);
    cone(this.width * 0.1, this.height * 0.2);
    pop();
    
    // Right shoulder pad
    push();
    translate(this.width * 0.5, 0, 0);
    rotateZ(-PI/4);
    box(this.width * 0.4, this.height * 0.1, this.depth * 0.3);
    
    // Shoulder spike
    translate(this.width * 0.2, 0, 0);
    rotateZ(PI/4);
    fill(80, 0, 100);
    cone(this.width * 0.1, this.height * 0.2);
    pop();
    pop();
    
    // Draw head (skull-like)
    push();
    translate(0, -this.height * 0.35, 0); // Move up from center
    
    // Skull base
    fill(220, 220, 220); // Skull-like color
    sphere(this.width * 0.3);
    
    // Eye sockets
    fill(0, 0, 0); // Black for eye sockets
    push();
    translate(-this.width * 0.1, -this.width * 0.05, -this.width * 0.2);
    sphere(this.width * 0.08);
    pop();
    
    push();
    translate(this.width * 0.1, -this.width * 0.05, -this.width * 0.2);
    sphere(this.width * 0.08);
    pop();
    
    // Glowing eyes inside sockets
    fill(200, 0, 0, 150); // Glowing red
    push();
    translate(-this.width * 0.1, -this.width * 0.05, -this.width * 0.22);
    sphere(this.width * 0.05);
    pop();
    
    push();
    translate(this.width * 0.1, -this.width * 0.05, -this.width * 0.22);
    sphere(this.width * 0.05);
    pop();
    
    // Jaw
    fill(200, 200, 200);
    push();
    translate(0, this.width * 0.1, -this.width * 0.05);
    rotateX(PI/20);
    box(this.width * 0.25, this.width * 0.1, this.width * 0.3);
    pop();
    
    // Draw hood over the head
    fill(20, 0, 30); // Very dark purple hood
    translate(0, -this.height * 0.1, 0);
    rotateX(PI/4); // Tilt hood forward slightly
    cone(this.width * 0.45, this.height * 0.35, 8); // More detailed cone
    pop();
    
    // Draw staff
    push();
    translate(this.width * 0.6, 0, 0); // Position to the right
    rotateZ(PI/6); // Tilt staff
    
    // Staff body
    fill(80, 40, 10); // Dark brown staff
    cylinder(this.width * 0.05, this.height * 1.2);
    
    // Staff details - rings
    for (let i = 0; i < 3; i++) {
      push();
      translate(0, -this.height * 0.2 * i, 0);
      fill(150, 120, 0); // Gold rings
      rotateX(PI/2);
      torus(this.width * 0.08, this.width * 0.02);
      pop();
    }
    
    // Staff orb
    translate(0, -this.height * 0.6, 0); // Position orb at top of staff
    
    // Orb holder (claw-like)
    push();
    fill(100, 80, 0); // Gold-bronze
    
    // Draw 3 claws around the orb
    for (let i = 0; i < 3; i++) {
      push();
      rotateY(i * TWO_PI/3);
      translate(this.width * 0.15, 0, 0);
      rotateZ(PI/2);
      cone(this.width * 0.04, this.width * 0.3);
      pop();
    }
    pop();
    
    // The orb itself
    fill(150, 0, 150, 200); // Purple orb
    sphere(this.width * 0.2);
    
    // Inner glow
    fill(200, 100, 255, 150); // Lighter purple for inner glow
    sphere(this.width * 0.15);
    
    // Core
    fill(255, 200, 255, 200); // Bright core
    sphere(this.width * 0.08);
    pop();
    
    // Add floating rune circles around the necromancer
    push();
    noFill();
    stroke(150, 0, 150, 150); // Purple glow
    strokeWeight(2);
    
    // Horizontal rune circle
    rotateX(PI/2);
    circle(0, 0, this.width * 2.2);
    
    // Add rune symbols
    for (let i = 0; i < 8; i++) {
      push();
      const angle = i * TWO_PI / 8;
      const x = cos(angle) * this.width * 1.1;
      const y = sin(angle) * this.width * 1.1;
      translate(x, y, 0);
      rotateX(-PI/2); // Rotate to face outward
      fill(150, 0, 150, 150 + sin(frameCount * 0.05 + i) * 50); // Pulsing glow
      
      // Draw a simple rune symbol
      beginShape();
      vertex(-this.width * 0.05, -this.width * 0.05);
      vertex(this.width * 0.05, -this.width * 0.05);
      vertex(0, this.width * 0.05);
      endShape(CLOSE);
      pop();
    }
    pop();
    
    // Add chains hanging from the robe
    push();
    stroke(150, 150, 150);
    strokeWeight(2);
    noFill();
    
    // Left side chain
    push();
    translate(-this.width * 0.4, this.height * 0.1, -this.depth * 0.2);
    
    // Draw chain links
    for (let i = 0; i < 5; i++) {
      const yOffset = i * this.height * 0.06;
      // Alternate horizontal and vertical links
      if (i % 2 === 0) {
        ellipse(0, yOffset, this.width * 0.08, this.width * 0.04);
      } else {
        ellipse(0, yOffset, this.width * 0.04, this.width * 0.08);
      }
    }
    pop();
    
    // Right side chain
    push();
    translate(this.width * 0.4, this.height * 0.1, -this.depth * 0.2);
    
    // Draw chain links
    for (let i = 0; i < 5; i++) {
      const yOffset = i * this.height * 0.06;
      // Alternate horizontal and vertical links
      if (i % 2 === 0) {
        ellipse(0, yOffset, this.width * 0.08, this.width * 0.04);
      } else {
        ellipse(0, yOffset, this.width * 0.04, this.width * 0.08);
      }
    }
    pop();
    pop();
    
    pop(); // End main body
  }
  
  drawJuggernautShape() {
    // Draw main body (bulkier)
    push();
    box(this.width * 1.2, this.height * 0.8, this.depth * 1.2);
    
    // Draw armor plates
    push();
    translate(0, -this.height * 0.1, this.depth * 0.6);
    box(this.width * 0.8, this.height * 0.6, this.depth * 0.1);
    pop();
    
    push();
    translate(0, -this.height * 0.1, -this.depth * 0.6);
    box(this.width * 0.8, this.height * 0.6, this.depth * 0.1);
    pop();
    
    push();
    translate(this.width * 0.6, -this.height * 0.1, 0);
    box(this.width * 0.1, this.height * 0.6, this.depth * 0.8);
    pop();
    
    push();
    translate(-this.width * 0.6, -this.height * 0.1, 0);
    box(this.width * 0.1, this.height * 0.6, this.depth * 0.8);
    pop();
    
    // Draw head (helmet-like)
    translate(0, -this.height * 0.5, 0);
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.6);
    
    // Draw shoulder pads
    push();
    translate(this.width * 0.7, -this.height * 0.1, 0);
    sphere(this.width * 0.3);
    pop();
    
    push();
    translate(-this.width * 0.7, -this.height * 0.1, 0);
    sphere(this.width * 0.3);
    pop();
    
    pop();
  }
  
  drawHealthBar() {
    // Check if health bars are enabled in config
    if (!CONFIG.ENEMY_HEALTH_BAR.ENABLED) return;
    
    // Update health bar with current health values
    this.healthBar.updateHealth(this.health, this.maxHealth);
    
    // Draw the health bar
    this.healthBar.draw(this, this.rotation);
  }
  
  drawProjectiles() {
    // Draw all projectiles
    for (const projectile of this.projectiles) {
      push();
      translate(projectile.x, projectile.y, projectile.z);
      noStroke();
      fill(projectile.color);
      
      // Draw projectile based on boss type
      switch (this.bossType) {
        case 'JUGGERNAUT':
          // Spiked ball
          sphere(projectile.size);
          break;
        case 'NECROMANCER':
          // Skull
          box(projectile.size);
          break;
        default:
          // Fireball
          sphere(projectile.size);
      }
      
      pop();
    }
  }
  
  takeDamage(amount) {
    // Call parent method and get result
    const isDead = super.takeDamage(amount);
    
    // If boss is dead, give rewards
    if (isDead) {
      // Add XP and score
      this.gameState.xp += CONFIG.BOSS.XP_REWARD;
      this.gameState.score += CONFIG.BOSS.SCORE_REWARD;
      
      // Create death explosion effect
      this.createDeathEffect();
    }
    
    return isDead;
  }
  
  createDeathEffect() {
    // Create a large explosion effect when the boss dies
    const explosionCount = 20;
    const explosionRadius = 200;
    
    // Create multiple explosion waves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        // Add wave effect
        this.gameState.waves.push({
          x: this.x,
          y: this.y,
          z: this.z,
          radius: 0,
          maxRadius: explosionRadius * (i + 1) * 0.5,
          color: color(255, 100, 0, 150 - i * 30),
          life: 60 - i * 10,
          type: 'explosion'
        });
        
        // Create particles
        for (let j = 0; j < explosionCount; j++) {
          const angle = random(TWO_PI);
          const distance = random(explosionRadius);
          
          // Calculate position
          const x = this.x + cos(angle) * distance;
          const y = this.y + random(-50, 50);
          const z = this.z + sin(angle) * distance;
          
          // Create particle
          const particle = {
            x: x,
            y: y,
            z: z,
            vx: cos(angle) * random(1, 5),
            vy: random(-2, 2),
            vz: sin(angle) * random(1, 5),
            size: random(10, 30),
            color: color(255, random(50, 150), 0, random(150, 255)),
            life: random(30, 90),
            decay: random(0.5, 1.5)
          };
          
          // Add particle to game state
          this.gameState.waves.push({
            ...particle,
            type: 'particle'
          });
        }
      }, i * 300); // Stagger explosions
    }
  }
  
  drawJuggernautShape() {
    // Main body structure
    push();
    
    // Draw heavily armored torso
    fill(50, 50, 60); // Dark metal color
    box(this.width * 1.1, this.height * 0.6, this.depth * 1.1);
    
    // Add armor plates to chest
    push();
    translate(0, -this.height * 0.1, this.depth * 0.55);
    fill(70, 70, 80); // Lighter metal
    
    // Central chest plate
    box(this.width * 0.6, this.height * 0.3, this.depth * 0.05);
    
    // Chest insignia
    translate(0, 0, this.depth * 0.03);
    fill(200, 0, 0); // Red insignia
    
    // Draw a star-like insignia
    push();
    rotateZ(PI/4);
    box(this.width * 0.2, this.width * 0.05, this.depth * 0.02);
    rotateZ(PI/2);
    box(this.width * 0.2, this.width * 0.05, this.depth * 0.02);
    pop();
    
    // Circle around insignia
    noFill();
    stroke(200, 0, 0);
    strokeWeight(3);
    circle(0, 0, this.width * 0.3);
    noStroke();
    pop();
    
    // Add armor plates to back
    push();
    translate(0, -this.height * 0.1, -this.depth * 0.55);
    fill(70, 70, 80); // Lighter metal
    box(this.width * 0.8, this.height * 0.4, this.depth * 0.05);
    pop();
    
    // Draw waist and belt
    push();
    translate(0, this.height * 0.2, 0);
    fill(40, 40, 50); // Darker metal
    box(this.width * 0.9, this.height * 0.1, this.depth * 0.9);
    
    // Belt details
    for (let i = 0; i < 8; i++) {
      push();
      const angle = i * TWO_PI / 8;
      rotateY(angle);
      translate(0, 0, this.depth * 0.45);
      fill(70, 70, 80); // Lighter metal
      box(this.width * 0.1, this.height * 0.08, this.depth * 0.05);
      pop();
    }
    pop();
    
    // Draw massive armored legs
    push();
    translate(0, this.height * 0.4, 0);
    
    // Left leg
    push();
    translate(-this.width * 0.3, 0, 0);
    fill(50, 50, 60); // Dark metal
    box(this.width * 0.35, this.height * 0.4, this.depth * 0.35);
    
    // Knee armor
    translate(0, this.height * 0.1, this.depth * 0.15);
    fill(70, 70, 80); // Lighter metal
    sphere(this.width * 0.15);
    
    // Leg spikes
    push();
    translate(0, 0, this.width * 0.1);
    rotateX(-PI/4);
    fill(90, 90, 100); // Bright metal
    cone(this.width * 0.08, this.height * 0.2, 4); // Square spike
    pop();
    pop();
    
    // Right leg
    push();
    translate(this.width * 0.3, 0, 0);
    fill(50, 50, 60); // Dark metal
    box(this.width * 0.35, this.height * 0.4, this.depth * 0.35);
    
    // Knee armor
    translate(0, this.height * 0.1, this.depth * 0.15);
    fill(70, 70, 80); // Lighter metal
    sphere(this.width * 0.15);
    
    // Leg spikes
    push();
    translate(0, 0, this.width * 0.1);
    rotateX(-PI/4);
    fill(90, 90, 100); // Bright metal
    cone(this.width * 0.08, this.height * 0.2, 4); // Square spike
    pop();
    pop();
    pop();
    
    // Draw massive shoulders with armor plates
    push();
    translate(0, -this.height * 0.25, 0);
    fill(60, 60, 70); // Medium metal
    box(this.width * 1.6, this.height * 0.2, this.depth * 0.9);
    
    // Left shoulder armor
    push();
    translate(-this.width * 0.7, -this.height * 0.05, 0);
    
    // Main shoulder plate
    fill(70, 70, 80); // Lighter metal
    rotateZ(-PI/8);
    box(this.width * 0.4, this.height * 0.25, this.depth * 0.4);
    
    // Shoulder spikes - multiple spikes in a row
    for (let i = -1; i <= 1; i++) {
      push();
      translate(i * this.width * 0.1, -this.height * 0.1, this.depth * 0.15);
      rotateX(-PI/6);
      fill(90, 90, 100); // Bright metal
      cone(this.width * 0.08, this.height * 0.25, 4); // Square spike
      pop();
    }
    pop();
    
    // Right shoulder armor
    push();
    translate(this.width * 0.7, -this.height * 0.05, 0);
    
    // Main shoulder plate
    fill(70, 70, 80); // Lighter metal
    rotateZ(PI/8);
    box(this.width * 0.4, this.height * 0.25, this.depth * 0.4);
    
    // Shoulder spikes - multiple spikes in a row
    for (let i = -1; i <= 1; i++) {
      push();
      translate(i * this.width * 0.1, -this.height * 0.1, this.depth * 0.15);
      rotateX(-PI/6);
      fill(90, 90, 100); // Bright metal
      cone(this.width * 0.08, this.height * 0.25, 4); // Square spike
      pop();
    }
    pop();
    pop();
    
    // Draw massive arms
    push();
    // Left arm
    push();
    translate(-this.width * 0.8, 0, 0);
    rotateZ(PI/12);
    
    // Upper arm
    fill(60, 60, 70); // Medium metal
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Elbow joint
    translate(0, this.height * 0.25, 0);
    fill(70, 70, 80); // Lighter metal
    sphere(this.width * 0.18);
    
    // Forearm - with weapon
    translate(0, this.height * 0.25, 0);
    rotateZ(-PI/6);
    fill(60, 60, 70); // Medium metal
    box(this.width * 0.35, this.height * 0.45, this.depth * 0.35);
    
    // Weapon - massive mace
    translate(0, this.height * 0.3, 0);
    
    // Mace handle
    push();
    fill(40, 40, 50); // Dark metal
    rotateX(PI/2);
    cylinder(this.width * 0.08, this.height * 0.5);
    
    // Mace head
    translate(0, -this.height * 0.25, 0);
    fill(70, 70, 80); // Lighter metal
    
    // Central sphere
    sphere(this.width * 0.25);
    
    // Spikes on mace
    for (let i = 0; i < 8; i++) {
      push();
      const angle = i * TWO_PI / 8;
      rotateZ(angle);
      translate(this.width * 0.25, 0, 0);
      rotateZ(-PI/2);
      fill(90, 90, 100); // Bright metal
      cone(this.width * 0.08, this.height * 0.2, 4); // Square spike
      pop();
    }
    pop();
    pop();
    
    // Right arm
    push();
    translate(this.width * 0.8, 0, 0);
    rotateZ(-PI/12);
    
    // Upper arm
    fill(60, 60, 70); // Medium metal
    box(this.width * 0.3, this.height * 0.4, this.depth * 0.3);
    
    // Elbow joint
    translate(0, this.height * 0.25, 0);
    fill(70, 70, 80); // Lighter metal
    sphere(this.width * 0.18);
    
    // Forearm - with shield
    translate(0, this.height * 0.25, 0);
    rotateZ(PI/6);
    fill(60, 60, 70); // Medium metal
    box(this.width * 0.35, this.height * 0.45, this.depth * 0.35);
    
    // Shield
    translate(0, this.height * 0.1, this.depth * 0.3);
    rotateX(PI/6);
    
    // Shield base
    fill(50, 50, 60); // Dark metal
    box(this.width * 0.7, this.height * 0.8, this.depth * 0.08);
    
    // Shield details
    push();
    translate(0, 0, this.depth * 0.04);
    fill(70, 70, 80); // Lighter metal
    
    // Shield pattern
    box(this.width * 0.5, this.height * 0.6, this.depth * 0.02);
    
    // Shield emblem
    translate(0, 0, this.depth * 0.02);
    fill(200, 0, 0); // Red emblem
    
    // Draw a cross emblem
    box(this.width * 0.4, this.height * 0.1, this.depth * 0.02);
    box(this.width * 0.1, this.height * 0.4, this.depth * 0.02);
    pop();
    
    // Shield spikes around the edge
    for (let i = 0; i < 12; i++) {
      if (i % 3 !== 0) { // Skip some positions for variation
        push();
        const angle = i * TWO_PI / 12;
        const radius = this.width * 0.35;
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;
        
        translate(x, y, 0);
        rotateZ(angle + PI/2);
        rotateX(-PI/2);
        
        fill(90, 90, 100); // Bright metal
        cone(this.width * 0.05, this.height * 0.1, 4); // Square spike
        pop();
      }
    }
    pop();
    pop();
    
    // Draw neck
    push();
    translate(0, -this.height * 0.35, 0);
    fill(50, 50, 60); // Dark metal
    cylinder(this.width * 0.25, this.height * 0.1);
    
    // Neck armor plates
    for (let i = 0; i < 4; i++) {
      push();
      const angle = i * TWO_PI / 4;
      rotateY(angle);
      translate(0, 0, this.width * 0.2);
      fill(70, 70, 80); // Lighter metal
      box(this.width * 0.15, this.height * 0.08, this.depth * 0.05);
      pop();
    }
    pop();
    
    // Draw head
    push();
    translate(0, -this.height * 0.5, 0);
    
    // Helmet base
    fill(60, 60, 70); // Medium metal
    sphere(this.width * 0.35);
    
    // Face plate
    push();
    translate(0, 0, this.width * 0.25);
    fill(70, 70, 80); // Lighter metal
    box(this.width * 0.4, this.height * 0.3, this.depth * 0.2);
    
    // Eye slits
    push();
    translate(0, -this.width * 0.05, this.depth * 0.1);
    fill(200, 0, 0, 150); // Glowing red
    box(this.width * 0.3, this.width * 0.03, this.depth * 0.01);
    pop();
    
    // Breathing vents
    for (let i = -1; i <= 1; i += 2) {
      push();
      translate(i * this.width * 0.1, this.width * 0.1, this.depth * 0.1);
      fill(40, 40, 50); // Dark metal
      box(this.width * 0.05, this.width * 0.1, this.depth * 0.01);
      pop();
    }
    pop();
    
    // Helmet crest
    push();
    translate(0, -this.width * 0.2, 0);
    rotateX(-PI/6);
    fill(200, 0, 0); // Red crest
    box(this.width * 0.05, this.height * 0.3, this.depth * 0.05);
    pop();
    
    // Helmet horns
    // Left horn
    push();
    translate(-this.width * 0.25, -this.width * 0.1, 0);
    rotateZ(-PI/6);
    rotateX(-PI/6);
    
    // Horn segments
    for (let i = 0; i < 3; i++) {
      fill(90 - i*10, 90 - i*10, 100 - i*10); // Gradually darker
      translate(0, -this.height * 0.1, 0);
      rotateZ(-PI/16); // Slight curve
      cylinder(this.width * (0.08 - i*0.02), this.height * 0.1);
    }
    
    // Horn tip
    translate(0, -this.height * 0.1, 0);
    fill(60, 60, 70); // Medium metal
    cone(this.width * 0.04, this.height * 0.15, 4); // Square tip
    pop();
    
    // Right horn
    push();
    translate(this.width * 0.25, -this.width * 0.1, 0);
    rotateZ(PI/6);
    rotateX(-PI/6);
    
    // Horn segments
    for (let i = 0; i < 3; i++) {
      fill(90 - i*10, 90 - i*10, 100 - i*10); // Gradually darker
      translate(0, -this.height * 0.1, 0);
      rotateZ(PI/16); // Slight curve
      cylinder(this.width * (0.08 - i*0.02), this.height * 0.1);
    }
    
    // Horn tip
    translate(0, -this.height * 0.1, 0);
    fill(60, 60, 70); // Medium metal
    cone(this.width * 0.04, this.height * 0.15, 4); // Square tip
    pop();
    pop();
    
    // Add energy effects around the Juggernaut
    push();
    // Energy field
    noFill();
    stroke(200, 0, 0, 100 + sin(frameCount * 0.1) * 50); // Pulsing red
    strokeWeight(3);
    
    // Draw energy rings
    for (let i = 0; i < 3; i++) {
      push();
      const pulseOffset = sin(frameCount * 0.05 + i) * 0.2;
      const scale = 1.2 + i * 0.3 + pulseOffset;
      
      rotateX(frameCount * 0.01 + i);
      rotateY(frameCount * 0.02 + i);
      
      ellipse(0, 0, this.width * scale, this.height * scale);
      pop();
    }
    noStroke();
    
    // Add impact craters on the ground
    translate(0, this.height * 0.5, 0);
    rotateX(PI/2);
    
    // Crater
    fill(70, 70, 70, 100);
    ellipse(0, 0, this.width * 2, this.depth * 2);
    
    // Cracks
    stroke(60, 60, 60, 150);
    strokeWeight(2);
    for (let i = 0; i < 8; i++) {
      const angle = i * TWO_PI / 8;
      const len = this.width * (1 + sin(frameCount * 0.05 + i) * 0.2);
      
      line(0, 0, cos(angle) * len, sin(angle) * len);
    }
    noStroke();
    pop();
    
    pop(); // End main body
  }
}