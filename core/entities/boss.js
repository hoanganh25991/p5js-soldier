// Boss Module
// Represents a boss enemy with advanced properties, attacks, and visuals

import CONFIG from '../config.js';
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
    // Draw main body
    push();
    box(this.width, this.height, this.depth);
    
    // Draw shoulders (wider than body)
    translate(0, -this.height * 0.25, 0);
    box(this.width * 1.5, this.height * 0.2, this.depth * 0.8);
    
    // Draw head
    translate(0, -this.height * 0.2, 0);
    sphere(this.width * 0.4);
    
    // Draw horns
    push();
    translate(-this.width * 0.3, -this.height * 0.1, 0);
    rotateZ(-PI/4);
    cone(this.width * 0.1, this.height * 0.3);
    pop();
    
    push();
    translate(this.width * 0.3, -this.height * 0.1, 0);
    rotateZ(PI/4);
    cone(this.width * 0.1, this.height * 0.3);
    pop();
    
    pop();
  }
  
  drawNecromancerShape() {
    // Main body - centered at origin
    push();
    
    // Draw main body (thinner)
    box(this.width * 0.8, this.height, this.depth * 0.8);
    
    // Draw robe-like bottom (wider at bottom)
    push();
    translate(0, this.height * 0.3, 0);
    fill(this.baseColor); // Ensure we're using the boss color
    cone(this.width * 1.2, this.height * 0.6, 4); // Square-based cone for robe
    pop();
    
    // Draw head (skull-like)
    push();
    translate(0, -this.height * 0.3, 0); // Move up from center
    fill(220, 220, 220); // Skull-like color
    sphere(this.width * 0.3);
    
    // Draw hood over the head
    fill(30, 30, 30); // Dark hood
    translate(0, -this.height * 0.1, 0);
    rotateX(PI/4); // Tilt hood forward slightly
    cone(this.width * 0.4, this.height * 0.3);
    pop();
    
    // Draw staff
    push();
    translate(this.width * 0.6, 0, 0); // Position to the right
    rotateZ(PI/6); // Tilt staff
    fill(120, 60, 20); // Brown staff
    cylinder(this.width * 0.05, this.height * 1.2);
    
    // Staff orb
    translate(0, -this.height * 0.6, 0); // Position orb at top of staff
    fill(150, 0, 150, 200); // Purple orb
    sphere(this.width * 0.2);
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
}