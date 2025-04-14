// Bomb Module
// Specialized entity for airstrike bombs

import CONFIG from '../../config.js';
import { Wave } from './wave.js';

export class Bomb {
  constructor(x, y, z, source, gameState, dirX, dirZ) {
    this.gameState = gameState;
    this.x = x;
    this.y = y;
    this.z = z;
    this.source = source;
    
    // Physics properties - use direction if provided, otherwise use source speed
    if (dirX !== undefined && dirZ !== undefined) {
      this.vx = source.speed * 0.5 * dirX; // Keep some forward momentum from the plane
      this.vz = source.speed * 0.5 * dirZ; // Add sideways momentum based on plane direction
    } else {
      this.vx = source.speed * 0.5; // Default to moving right if no direction provided
      this.vz = 0;
    }
    
    this.vy = 15; // Fall speed
    this.rotationX = 0;
    this.rotationZ = 0;
    this.rotationSpeed = 0.02;
    
    // Bomb properties
    this.damage = CONFIG.AIRSTRIKE.DAMAGE;
    this.blastRadius = CONFIG.AIRSTRIKE.BLAST_RADIUS || 150;
    this.size = CONFIG.AIRSTRIKE.BOMB_SIZE || 20;
    
    // Visual effects
    this.trailTimer = 0;
    this.trailInterval = 3;
    
    // Sound effect will be played on impact
    this.hasExploded = false;
    
    // Import particle manager for trail effects
    this.particleManager = null;
    import('../managers/particleManager.js').then(module => {
      this.particleManager = module.default;
    });
  }
  
  update() {
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    
    // Calculate rotation based on velocity direction
    // This makes the bomb point in the direction it's moving
    if (this.vx !== 0 || this.vz !== 0) {
      // Calculate angle based on horizontal velocity
      const horizontalAngle = atan2(this.vz, this.vx);
      
      // Gradually rotate towards the target angle
      const targetRotationZ = -horizontalAngle; // Negative because of coordinate system
      
      // Smoothly interpolate rotation
      this.rotationZ = lerp(this.rotationZ, targetRotationZ, 0.1);
    }
    
    // Add tumbling rotation for realistic falling motion
    this.rotationX += this.rotationSpeed;
    
    // Add trail particles using particle manager
    this.trailTimer++;
    if (this.particleManager && this.trailTimer >= this.trailInterval) {
      this.trailTimer = 0;
      
      // Create smoke trail that follows behind the bomb
      this.particleManager.createParticle(
        this.x, this.y, this.z,
        'SMOKE',
        {
          // Particles move opposite to the bomb's direction but slower
          vx: -this.vx * 0.2 + (Math.random() - 0.5) * 0.5,
          vy: -this.vy * 0.2 + (Math.random() - 0.5) * 0.5,
          vz: -this.vz * 0.2 + (Math.random() - 0.5) * 0.5,
          size: this.size / 8 + Math.random() * 2,
          color: [200, 200, 200],
          alpha: 150,
          lifespan: 15 + Math.floor(Math.random() * 10)
        }
      );
    }
    
    // Check collision with enemies
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        let d = dist(this.x, this.z, enemy.x, enemy.z);
        
        // Direct hit detection
        if (d < enemy.width * 1.5 &&
            this.y < enemy.y + enemy.height &&
            this.y > enemy.y) {
          this.explode();
          return true; // Bomb hit something directly
        }
      }
    }
    
    // Check if bomb hit ground or is out of bounds
    let distance = dist(0, 0, this.x, this.z);
    if (distance > CONFIG.WORLD_RADIUS || this.y > 50) {
      this.explode();
      return true; // Bomb exploded
    }
    
    return false; // Bomb still active
  }
  
  explode() {
    if (this.hasExploded) return; // Prevent multiple explosions
    this.hasExploded = true;
    
    // Create explosion wave effect
    if (!this.gameState.waves) {
      this.gameState.waves = [];
    }
    
    // Create primary explosion wave
    const waveColor = [255, 100, 50, 200];
    const primaryWave = new Wave(this.x, 50, this.z, 0, waveColor, this.gameState);
    primaryWave.growthRate = 15; // Faster growth for bigger explosion
    primaryWave.maxRadius = this.blastRadius * 1.2;
    primaryWave.height = 120; // Taller explosion
    primaryWave.riseSpeed = 3.5; // Faster rise
    this.gameState.waves.push(primaryWave);
    
    // Create secondary waves for more dramatic effect
    const secondaryWave = new Wave(this.x, 50, this.z, this.blastRadius * 0.3, [255, 200, 50, 180], this.gameState);
    secondaryWave.growthRate = 12;
    secondaryWave.maxRadius = this.blastRadius * 1.4;
    secondaryWave.height = 150; // Taller explosion
    secondaryWave.riseSpeed = 4.0; // Faster rise
    this.gameState.waves.push(secondaryWave);
    
    // Create shockwave
    const shockWave = new Wave(this.x, 50, this.z, this.blastRadius * 0.1, [255, 255, 255, 150], this.gameState);
    shockWave.growthRate = 20; // Much faster growth for shockwave
    shockWave.maxRadius = this.blastRadius * 1.8;
    shockWave.lifespan = 25;
    shockWave.height = 30; // Lower height for ground-level shockwave
    this.gameState.waves.push(shockWave);
    
    // Create additional fire dome
    const fireDome = new Wave(this.x, 50, this.z, this.blastRadius * 0.2, [255, 50, 0, 170], this.gameState);
    fireDome.growthRate = 10;
    fireDome.maxRadius = this.blastRadius * 0.8;
    fireDome.height = 180; // Very tall fire dome
    fireDome.riseSpeed = 5.0; // Fast rising fire
    fireDome.lifespan = 45; // Longer lasting
    this.gameState.waves.push(fireDome);
    
    // Create explosion particles using the particle manager
    if (this.particleManager) {
      // Use the particle manager directly if available
      this.createExplosionParticles(this.particleManager);
    } else {
      // Otherwise import it dynamically
      import('../managers/particleManager.js').then(module => {
        const particleManager = module.default;
        this.createExplosionParticles(particleManager);
      });
    }
    
    // Play explosion sound if available
    if (this.gameState.explosionSound) {
      this.gameState.explosionSound.play();
    }
    
    // Apply area damage to enemies within blast radius
    if (this.gameState.enemyController) {
      const enemies = this.gameState.enemyController.getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        // Calculate distance from explosion to enemy
        let explosionDist = dist(this.x, this.z, enemy.x, enemy.z);
        
        // Check if enemy is within blast radius
        if (explosionDist < this.blastRadius) {
          // Calculate damage falloff based on distance (more damage closer to center)
          const falloffRate = CONFIG.AIRSTRIKE.DAMAGE_FALLOFF || 0.5;
          let damageMultiplier = 1 - (explosionDist / this.blastRadius) * falloffRate;
          let explosionDamage = this.damage * damageMultiplier;
          
          // Apply damage to enemy
          enemy.takeDamage(explosionDamage);
        }
      }
    }
  }
  
  createExplosionParticles(particleManager) {
    // Get explosion colors from config or use defaults
    const explosionColors = CONFIG.AIRSTRIKE.EXPLOSION_COLORS || [
      [255, 100, 50],  // Orange-red
      [255, 200, 50],  // Yellow-orange
      [100, 100, 100]  // Smoke gray
    ];
    
    // Number of particles from config or default
    const particleCount = CONFIG.AIRSTRIKE.EXPLOSION_PARTICLES || 40;
    
    // Create main explosion particles
    particleManager.createParticleExplosion(
      this.x, 50, this.z, 
      'EXPLOSION', 
      Math.floor(particleCount * 0.7), 
      {
        speed: 6, // Faster speed for bigger explosion
        size: random(15, 35), // Larger particles
        color: explosionColors[0],
        lifespan: 50 // Longer lasting
      }
    );
    
    // Create fire particles
    particleManager.createParticleExplosion(
      this.x, 50, this.z, 
      'FIRE', 
      Math.floor(particleCount * 0.5), 
      {
        speed: 5,
        size: random(12, 30), // Larger fire particles
        color: explosionColors[1],
        lifespan: 40,
        gravity: -0.15 // Rise upward faster
      }
    );
    
    // Add smoke particles
    particleManager.createParticleExplosion(
      this.x, 50, this.z, 
      'SMOKE', 
      Math.floor(particleCount * 0.6), 
      {
        speed: 3,
        size: random(20, 45), // Much larger smoke clouds
        color: explosionColors[2],
        lifespan: 100, // Longer lasting smoke
        gravity: -0.08 // Slowly rise
      }
    );
    
    // Add debris particles
    particleManager.createParticleExplosion(
      this.x, 50, this.z, 
      'DEBRIS', 
      Math.floor(particleCount * 0.4), 
      {
        speed: 8, // Faster flying debris
        size: random(5, 15), // Larger debris chunks
        color: [100, 80, 60],
        lifespan: 70,
        gravity: 0.25 // Fall faster
      }
    );
    
    // Add spark particles
    particleManager.createParticleExplosion(
      this.x, 50, this.z, 
      'SPARK', 
      Math.floor(particleCount * 0.3), 
      {
        speed: 10, // Very fast sparks
        size: random(3, 8),
        color: [255, 255, 200], // Bright yellow-white
        lifespan: 30,
        gravity: 0.1
      }
    );
    
    // Add secondary explosions
    setTimeout(() => {
      // Create delayed secondary explosions for dramatic effect
      for (let i = 0; i < 3; i++) {
        const angle = random(TWO_PI);
        const distance = random(this.blastRadius * 0.3, this.blastRadius * 0.6);
        const offsetX = this.x + cos(angle) * distance;
        const offsetZ = this.z + sin(angle) * distance;
        
        particleManager.createParticleExplosion(
          offsetX, 50, offsetZ, 
          'EXPLOSION', 
          Math.floor(particleCount * 0.3), 
          {
            speed: 4,
            size: random(10, 20),
            color: explosionColors[0],
            lifespan: 30
          }
        );
      }
    }, 100); // 100ms delay for secondary explosions
  }
  
  show() {
    // Draw bomb
    push();
    noStroke();
    translate(this.x, this.y, this.z);
    rotateX(this.rotationX);
    rotateZ(this.rotationZ);
    
    // Main bomb body
    fill(40, 40, 40);
    push();
    ellipsoid(this.size / 6, this.size / 3, this.size / 6);
    pop();
    
    // Nose cone
    fill(60, 60, 60);
    push();
    translate(0, -this.size / 3, 0);
    rotateX(PI);
    cone(this.size / 6, this.size / 6);
    pop();
    
    // Tail fins
    fill(70, 70, 70);
    
    // Vertical fins
    push();
    translate(0, this.size / 4, 0);
    box(this.size / 30, this.size / 6, this.size / 5);
    pop();
    
    // Horizontal fins
    push();
    translate(0, this.size / 4, 0);
    box(this.size / 5, this.size / 6, this.size / 30);
    pop();
    
    // Add metal bands around the bomb
    fill(80, 80, 80);
    push();
    translate(0, -this.size / 6, 0);
    rotateX(HALF_PI);
    cylinder(this.size / 6 + 1, this.size / 30);
    pop();
    
    push();
    translate(0, this.size / 6, 0);
    rotateX(HALF_PI);
    cylinder(this.size / 6 + 1, this.size / 30);
    pop();
    
    // Add blinking red light for dramatic effect
    if (this.gameState.frameCount % 10 < 5) {
      fill(255, 0, 0);
      push();
      translate(0, -this.size / 6, 0);
      sphere(this.size / 15);
      pop();
    }
    
    // Add warning markings
    push();
    fill(255, 255, 0);
    translate(0, 0, 0);
    rotateX(HALF_PI);
    
    // Yellow and black warning stripes
    for (let i = 0; i < 4; i++) {
      push();
      rotateY(i * HALF_PI);
      translate(0, 0, this.size / 6 - 0.5);
      
      // Alternate yellow and black
      if (i % 2 === 0) {
        fill(255, 255, 0);
      } else {
        fill(0);
      }
      
      // Warning stripe
      plane(this.size / 15, this.size / 6);
      pop();
    }
    pop();
    
    pop();
  }
}