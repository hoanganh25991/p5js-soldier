// Performance Manager
// Handles performance optimization, memory management, and adaptive rendering

import CONFIG from '../../config.js';

class PerformanceManager {
  constructor() {
    // Performance metrics
    this.fps = 0;
    this.frameTimeHistory = [];
    this.frameTimeHistoryMax = 60; // Store last 60 frames for analysis
    this.lastFrameTime = 0;
    this.memoryUsage = 0; // Estimated memory usage
    
    // Performance settings
    this.qualityLevel = 'auto'; // 'low', 'medium', 'high', 'ultra', 'auto'
    this.targetFPS = 60;
    this.adaptiveQuality = true;
    this.adaptiveInterval = 180; // Check every 3 seconds (60fps * 3)
    this.adaptiveCounter = 0;
    
    // Rendering settings
    this.particleLimit = 200;
    this.particleScaleFactor = 1.0;
    this.drawDistance = CONFIG.WORLD_RADIUS;
    this.entityLimit = CONFIG.MAX_ENEMIES;
    this.detailLevel = 1.0; // Scale for geometric detail
    this.textureQuality = 1.0; // Scale for texture quality
    this.shadowsEnabled = true;
    this.postProcessingEnabled = true;
    
    // Mobile detection
    this.isMobile = this.detectMobile();
    
    // GPU acceleration settings
    this.useGPUAcceleration = true;
    this.batchRendering = true;
    this.useInstancing = true; // For similar objects
    
    // Collision optimization
    this.spatialGridSize = 200; // Size of each grid cell
    this.spatialGrid = {}; // Grid for spatial partitioning
    this.collisionCheckFrequency = 1; // Check every frame by default
    
    // Apply initial settings based on device
    this.applyInitialSettings();
  }
  
  // Detect if user is on a mobile device
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 800 && window.innerHeight <= 1200);
  }
  
  // Apply initial settings based on device capabilities
  applyInitialSettings() {
    if (this.isMobile) {
      // Mobile devices get lower initial settings
      this.qualityLevel = 'low';
      this.particleLimit = 50;
      this.particleScaleFactor = 0.6;
      this.drawDistance = CONFIG.WORLD_RADIUS * 0.7;
      this.entityLimit = Math.floor(CONFIG.MAX_ENEMIES * 0.6);
      this.detailLevel = 0.5;
      this.textureQuality = 0.5;
      this.shadowsEnabled = false;
      this.postProcessingEnabled = false;
      this.collisionCheckFrequency = 2; // Check every other frame
    } else {
      // Desktop gets higher initial settings
      this.qualityLevel = 'high';
    }
    
    // Apply the settings to the CONFIG object
    this.applySettingsToConfig();
  }
  
  // Update performance metrics each frame
  update() {
    const currentTime = performance.now();
    
    // Calculate frame time and FPS
    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimeHistory.push(frameTime);
      
      // Keep history at the right size
      if (this.frameTimeHistory.length > this.frameTimeHistoryMax) {
        this.frameTimeHistory.shift();
      }
      
      // Calculate average FPS from recent frames
      const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / 
                          this.frameTimeHistory.length;
      this.fps = Math.round(1000 / avgFrameTime);
    }
    
    this.lastFrameTime = currentTime;
    
    // Estimate memory usage if available
    if (window.performance && window.performance.memory) {
      this.memoryUsage = window.performance.memory.usedJSHeapSize;
    }
    
    // Check if we need to adapt quality settings
    if (this.adaptiveQuality) {
      this.adaptiveCounter++;
      if (this.adaptiveCounter >= this.adaptiveInterval) {
        this.adaptQualitySettings();
        this.adaptiveCounter = 0;
      }
    }
    
    return this;
  }
  
  // Adapt quality settings based on performance
  adaptQualitySettings() {
    if (!this.adaptiveQuality) return;
    
    // If FPS is too low, reduce quality
    if (this.fps < this.targetFPS * 0.8) { // Below 80% of target
      this.decreaseQuality();
    } 
    // If FPS is consistently high, we can try increasing quality
    else if (this.fps > this.targetFPS * 0.95 && this.qualityLevel !== 'ultra') {
      // Only increase if all recent frames were good
      const allFramesGood = this.frameTimeHistory.every(time => time < 1000 / (this.targetFPS * 0.9));
      if (allFramesGood) {
        this.increaseQuality();
      }
    }
  }
  
  // Decrease quality settings to improve performance
  decreaseQuality() {
    switch (this.qualityLevel) {
      case 'ultra':
        this.qualityLevel = 'high';
        this.particleLimit = Math.floor(this.particleLimit * 0.8);
        this.shadowsEnabled = true;
        this.postProcessingEnabled = true;
        break;
      case 'high':
        this.qualityLevel = 'medium';
        this.particleLimit = Math.floor(this.particleLimit * 0.7);
        this.drawDistance = CONFIG.WORLD_RADIUS * 0.9;
        this.detailLevel = 0.8;
        this.shadowsEnabled = false;
        this.postProcessingEnabled = true;
        break;
      case 'medium':
        this.qualityLevel = 'low';
        this.particleLimit = Math.floor(this.particleLimit * 0.5);
        this.drawDistance = CONFIG.WORLD_RADIUS * 0.7;
        this.detailLevel = 0.5;
        this.textureQuality = 0.5;
        this.shadowsEnabled = false;
        this.postProcessingEnabled = false;
        this.collisionCheckFrequency = 2; // Check every other frame
        break;
      case 'low':
        // Already at lowest, just reduce particles further
        this.particleLimit = Math.max(20, Math.floor(this.particleLimit * 0.8));
        this.drawDistance = Math.max(CONFIG.WORLD_RADIUS * 0.5, this.drawDistance * 0.9);
        this.collisionCheckFrequency = 3; // Check every third frame
        break;
    }
    
    // Apply the new settings
    this.applySettingsToConfig();
    
    console.log(`[Performance] Decreased quality to ${this.qualityLevel}, FPS: ${this.fps}`);
  }
  
  // Increase quality settings if performance is good
  increaseQuality() {
    switch (this.qualityLevel) {
      case 'low':
        this.qualityLevel = 'medium';
        this.particleLimit = Math.min(100, Math.floor(this.particleLimit * 1.5));
        this.drawDistance = CONFIG.WORLD_RADIUS * 0.9;
        this.detailLevel = 0.8;
        this.textureQuality = 0.8;
        this.collisionCheckFrequency = 1;
        break;
      case 'medium':
        this.qualityLevel = 'high';
        this.particleLimit = Math.min(200, Math.floor(this.particleLimit * 1.3));
        this.drawDistance = CONFIG.WORLD_RADIUS;
        this.detailLevel = 1.0;
        this.textureQuality = 1.0;
        this.postProcessingEnabled = true;
        break;
      case 'high':
        this.qualityLevel = 'ultra';
        this.particleLimit = Math.min(300, Math.floor(this.particleLimit * 1.2));
        this.shadowsEnabled = true;
        break;
    }
    
    // Apply the new settings
    this.applySettingsToConfig();
    
    console.log(`[Performance] Increased quality to ${this.qualityLevel}, FPS: ${this.fps}`);
  }
  
  // Apply current settings to the CONFIG object
  applySettingsToConfig() {
    // Update CONFIG values based on current performance settings
    CONFIG.PERFORMANCE = {
      QUALITY_LEVEL: this.qualityLevel,
      PARTICLE_LIMIT: this.particleLimit,
      PARTICLE_SCALE: this.particleScaleFactor,
      DRAW_DISTANCE: this.drawDistance,
      ENTITY_LIMIT: this.entityLimit,
      DETAIL_LEVEL: this.detailLevel,
      TEXTURE_QUALITY: this.textureQuality,
      SHADOWS_ENABLED: this.shadowsEnabled,
      POST_PROCESSING: this.postProcessingEnabled,
      COLLISION_CHECK_FREQUENCY: this.collisionCheckFrequency,
      USE_GPU_ACCELERATION: this.useGPUAcceleration,
      BATCH_RENDERING: this.batchRendering,
      USE_INSTANCING: this.useInstancing
    };
  }
  
  // Initialize spatial grid for collision detection
  initSpatialGrid() {
    this.spatialGrid = {};
  }
  
  // Add an entity to the spatial grid
  addToSpatialGrid(entity) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.z !== 'number') {
      return;
    }
    
    // Calculate grid cell coordinates
    const cellX = Math.floor(entity.x / this.spatialGridSize);
    const cellZ = Math.floor(entity.z / this.spatialGridSize);
    const cellKey = `${cellX},${cellZ}`;
    
    // Create cell if it doesn't exist
    if (!this.spatialGrid[cellKey]) {
      this.spatialGrid[cellKey] = [];
    }
    
    // Add entity to cell
    this.spatialGrid[cellKey].push(entity);
  }
  
  // Get nearby entities for collision checking
  getNearbyEntities(x, z, radius = this.spatialGridSize) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.spatialGridSize);
    const centerCellX = Math.floor(x / this.spatialGridSize);
    const centerCellZ = Math.floor(z / this.spatialGridSize);
    
    // Check all cells within radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const cellKey = `${centerCellX + dx},${centerCellZ + dz}`;
        if (this.spatialGrid[cellKey]) {
          nearby.push(...this.spatialGrid[cellKey]);
        }
      }
    }
    
    return nearby;
  }
  
  // Clear the spatial grid (call at the beginning of each frame)
  clearSpatialGrid() {
    this.spatialGrid = {};
  }
  
  // Check if an entity should be rendered based on distance
  shouldRender(x, z) {
    // Temporarily disable distance-based culling to ensure all enemies are visible
    return true;
    
    // Original distance-based culling (commented out for now)
    // const distanceSquared = x * x + z * z;
    // return distanceSquared <= this.drawDistance * this.drawDistance;
  }
  
  // Get the appropriate level of detail for an entity based on distance
  getEntityLOD(x, z) {
    // Temporarily always return highest detail level (0) to ensure all enemies are visible
    return 0;
    
    // Original LOD calculation (commented out for now)
    // const distance = Math.sqrt(x * x + z * z);
    // const normalizedDistance = distance / this.drawDistance;
    // 
    // // Return LOD level (0 = highest detail, 2 = lowest detail)
    // if (normalizedDistance < 0.3) return 0;
    // if (normalizedDistance < 0.7) return 1;
    // return 2;
  }
  
  // Display performance metrics (for debug)
  displayMetrics(x, y) {
    push();
    textAlign(LEFT);
    textSize(14);
    fill(255);
    text(`FPS: ${this.fps}`, x, y);
    text(`Quality: ${this.qualityLevel}`, x, y + 20);
    text(`Particles: ${this.particleLimit}`, x, y + 40);
    text(`Draw Distance: ${Math.round(this.drawDistance)}`, x, y + 60);
    pop();
  }
}

// Create and export a singleton instance
const performanceManager = new PerformanceManager();
export default performanceManager;