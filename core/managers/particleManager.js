// Particle Manager
// Handles efficient particle rendering and updates

import CONFIG from '../../config.js';
import performanceManager from './performanceManager.js';
import gpuManager from './gpuManager.js';

class ParticleManager {
  constructor() {
    // Particle pools
    this.particles = [];
    this.activeParticles = 0;
    this.maxParticles = 200; // Default, will be updated from performance manager
    
    // Particle types
    this.particleTypes = {
      EXPLOSION: { color: [255, 100, 0], size: 10, lifespan: 30, gravity: 0.1 },
      SMOKE: { color: [100, 100, 100], size: 15, lifespan: 60, gravity: -0.05 },
      SPARK: { color: [255, 255, 0], size: 5, lifespan: 20, gravity: 0.2 },
      DEBRIS: { color: [150, 150, 150], size: 8, lifespan: 45, gravity: 0.15 },
      FIRE: { color: [255, 50, 0], size: 12, lifespan: 25, gravity: -0.1 },
      WATER: { color: [0, 100, 255], size: 8, lifespan: 40, gravity: 0.2 },
      ENERGY: { color: [0, 255, 255], size: 10, lifespan: 35, gravity: 0 }
    };
    
    // Particle batches for efficient rendering
    this.particleBatches = {};
    
    // Instanced rendering data
    this.useInstancing = false;
    this.instanceData = null;
    
    // Optimization flags
    this.useLOD = true; // Level of Detail for particles
    this.usePooling = true; // Object pooling for particles
    
    // Pre-allocate particle pool
    this.initParticlePool();
  }
  
  // Initialize the particle pool
  initParticlePool() {
    // Create a pool of reusable particle objects
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        ax: 0, ay: 0, az: 0,
        size: 0,
        initialSize: 0,
        color: [255, 255, 255],
        alpha: 255,
        lifespan: 0,
        maxLifespan: 0,
        gravity: 0,
        type: null,
        rotation: 0,
        rotationSpeed: 0
      });
    }
  }
  
  // Update particle manager settings from performance manager
  updatePerformanceSettings() {
    if (CONFIG.PERFORMANCE) {
      this.maxParticles = CONFIG.PERFORMANCE.PARTICLE_LIMIT;
      this.useInstancing = CONFIG.PERFORMANCE.USE_INSTANCING && gpuManager.supportsInstancing();
      
      // Resize particle pool if needed
      if (this.particles.length < this.maxParticles) {
        const additionalParticles = this.maxParticles - this.particles.length;
        for (let i = 0; i < additionalParticles; i++) {
          this.particles.push({
            active: false,
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            ax: 0, ay: 0, az: 0,
            size: 0,
            initialSize: 0,
            color: [255, 255, 255],
            alpha: 255,
            lifespan: 0,
            maxLifespan: 0,
            gravity: 0,
            type: null,
            rotation: 0,
            rotationSpeed: 0
          });
        }
      }
    }
  }
  
  // Create a new particle
  createParticle(x, y, z, type, options = {}) {
    // Check if we've reached the particle limit
    if (this.activeParticles >= this.maxParticles) {
      return null;
    }
    
    // Get particle type settings
    const typeSettings = this.particleTypes[type] || this.particleTypes.EXPLOSION;
    
    // Find an inactive particle in the pool
    let particle = null;
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        particle = this.particles[i];
        break;
      }
    }
    
    // If no inactive particles found, return null
    if (!particle) {
      return null;
    }
    
    // Set up the particle
    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.z = z;
    
    // Velocity
    particle.vx = options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 2;
    particle.vy = options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 2 - 1;
    particle.vz = options.vz !== undefined ? options.vz : (Math.random() - 0.5) * 2;
    
    // Acceleration
    particle.ax = options.ax !== undefined ? options.ax : 0;
    particle.ay = options.ay !== undefined ? options.ay : 0;
    particle.az = options.az !== undefined ? options.az : 0;
    
    // Appearance
    particle.size = options.size !== undefined ? options.size : typeSettings.size;
    particle.initialSize = particle.size;
    particle.color = options.color || typeSettings.color;
    particle.alpha = options.alpha !== undefined ? options.alpha : 255;
    
    // Physics
    particle.lifespan = options.lifespan !== undefined ? options.lifespan : typeSettings.lifespan;
    particle.maxLifespan = particle.lifespan;
    particle.gravity = options.gravity !== undefined ? options.gravity : typeSettings.gravity;
    
    // Rotation
    particle.rotation = options.rotation !== undefined ? options.rotation : Math.random() * Math.PI * 2;
    particle.rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : (Math.random() - 0.5) * 0.2;
    
    // Type
    particle.type = type;
    
    // Increment active particle count
    this.activeParticles++;
    
    // Add to appropriate batch
    if (!this.particleBatches[type]) {
      this.particleBatches[type] = [];
    }
    this.particleBatches[type].push(particle);
    
    return particle;
  }
  
  // Create multiple particles at once (explosion, etc.)
  createParticleExplosion(x, y, z, type, count, options = {}) {
    const particles = [];
    const actualCount = Math.min(count, this.maxParticles - this.activeParticles);
    
    for (let i = 0; i < actualCount; i++) {
      // Calculate velocity based on explosion pattern
      const angle = Math.random() * Math.PI * 2;
      const speed = options.speed || (Math.random() * 2 + 1);
      
      const particleOptions = {
        ...options,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        vy: (Math.random() - 0.3) * speed - 1, // Mostly upward
        lifespan: options.lifespan !== undefined ? options.lifespan : 
                 (this.particleTypes[type]?.lifespan || 30) * (0.8 + Math.random() * 0.4)
      };
      
      const particle = this.createParticle(x, y, z, type, particleOptions);
      if (particle) {
        particles.push(particle);
      }
    }
    
    return particles;
  }
  
  // Update all active particles
  update() {
    // Update settings from performance manager
    this.updatePerformanceSettings();
    
    // Reset active count
    this.activeParticles = 0;
    
    // Clear batches
    this.particleBatches = {};
    
    // Update each particle
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      // Update lifespan
      particle.lifespan--;
      
      // Check if particle is dead
      if (particle.lifespan <= 0) {
        particle.active = false;
        continue;
      }
      
      // Apply acceleration
      particle.vx += particle.ax;
      particle.vy += particle.ay;
      particle.vz += particle.az;
      
      // Apply gravity
      particle.vy += particle.gravity;
      
      // Apply velocity
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;
      
      // Apply rotation
      particle.rotation += particle.rotationSpeed;
      
      // Update size based on lifespan
      const lifeRatio = particle.lifespan / particle.maxLifespan;
      
      // Different size curves for different particle types
      switch (particle.type) {
        case 'EXPLOSION':
          // Explosion particles get smaller as they age
          particle.size = particle.initialSize * (0.5 + lifeRatio * 0.5);
          break;
        case 'SMOKE':
          // Smoke particles get larger as they age
          particle.size = particle.initialSize * (1 + (1 - lifeRatio) * 1.5);
          break;
        default:
          // Default behavior - slight shrinking
          particle.size = particle.initialSize * (0.7 + lifeRatio * 0.3);
      }
      
      // Update alpha based on lifespan
      particle.alpha = 255 * lifeRatio;
      
      // Check if particle is out of bounds
      const distanceSquared = particle.x * particle.x + particle.z * particle.z;
      if (distanceSquared > CONFIG.WORLD_RADIUS * CONFIG.WORLD_RADIUS || particle.y > 100) {
        particle.active = false;
        continue;
      }
      
      // Increment active count
      this.activeParticles++;
      
      // Add to appropriate batch
      if (!this.particleBatches[particle.type]) {
        this.particleBatches[particle.type] = [];
      }
      this.particleBatches[particle.type].push(particle);
    }
  }
  
  // Render all active particles
  render() {
    // Skip rendering if no active particles
    if (this.activeParticles === 0) return;
    
    // Use instanced rendering if available
    if (this.useInstancing && gpuManager.supportsInstancing()) {
      this.renderInstanced();
    } else {
      this.renderBatched();
    }
  }
  
  // Render particles using batched rendering
  renderBatched() {
    // Render each batch separately
    for (const type in this.particleBatches) {
      const batch = this.particleBatches[type];
      if (batch.length === 0) continue;
      
      // Try to use GPU manager for batching
      if (gpuManager.isInitialized && CONFIG.PERFORMANCE.BATCH_RENDERING) {
        if (gpuManager.batchEntity(batch, 'particles')) {
          continue; // GPU manager will handle this batch
        }
      }
      
      // Fallback to manual rendering
      this.renderParticleBatch(batch, type);
    }
  }
  
  // Render a batch of particles manually
  renderParticleBatch(batch, type) {
    // Set common rendering properties for this batch
    noStroke();
    
    // Get LOD based on performance settings
    const lod = this.useLOD ? Math.floor(3 - CONFIG.PERFORMANCE.DETAIL_LEVEL * 3) : 0;
    
    // Render each particle
    for (let i = 0; i < batch.length; i++) {
      const p = batch[i];
      
      // Skip particles that are too far away
      if (!performanceManager.shouldRender(p.x, p.z)) {
        continue;
      }
      
      push();
      translate(p.x, p.y, p.z);
      
      // Apply rotation
      rotateX(p.rotation);
      rotateY(p.rotation * 0.7);
      
      // Set color with alpha
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      
      // Render based on LOD and particle type
      if (lod === 0) {
        // High detail
        switch (type) {
          case 'EXPLOSION':
            sphere(p.size);
            break;
          case 'SMOKE':
            sphere(p.size);
            break;
          case 'SPARK':
            box(p.size * 0.5, p.size * 0.5, p.size * 2);
            break;
          case 'ENERGY':
            torus(p.size * 0.7, p.size * 0.3);
            break;
          default:
            sphere(p.size);
        }
      } else if (lod === 1) {
        // Medium detail - simpler shapes
        switch (type) {
          case 'SPARK':
            box(p.size * 0.5, p.size * 0.5, p.size);
            break;
          default:
            sphere(p.size);
        }
      } else {
        // Low detail - just spheres or points
        if (p.size > 5) {
          sphere(p.size);
        } else {
          // For very small particles, use point rendering
          strokeWeight(p.size);
          stroke(p.color[0], p.color[1], p.color[2], p.alpha);
          point(0, 0, 0);
        }
      }
      
      pop();
    }
  }
  
  // Render particles using instanced rendering
  renderInstanced() {
    // This is a placeholder for future implementation
    // WebGL instanced rendering would go here
    // For now, fall back to batched rendering
    this.renderBatched();
  }
  
  // Get current particle stats
  getStats() {
    return {
      active: this.activeParticles,
      total: this.particles.length,
      batches: Object.keys(this.particleBatches).length
    };
  }
}

// Create and export a singleton instance
const particleManager = new ParticleManager();
export default particleManager;