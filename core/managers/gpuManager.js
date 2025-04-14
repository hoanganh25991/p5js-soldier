// GPU Manager
// Handles GPU acceleration and WebGL optimizations

import CONFIG from '../../config.js';
import performanceManager from './performanceManager.js';

class GPUManager {
  constructor() {
    // WebGL context
    this.gl = null;
    this.p5Canvas = null;

    // Rendering state
    this.isInitialized = false;
    this.isWebGLAvailable = false;
    this.isWebGL2Available = false;
    this.extensionsSupported = {};

    // Batch rendering
    this.batchSize = 0;
    this.maxBatchSize = 1000;
    this.batchedEntities = {
      enemies: [],
      bullets: [],
      particles: [],
      skills: [],
      powerUps: []
    };

    // Geometry buffers for instanced rendering
    this.geometryBuffers = {};

    // Instanced rendering
    this.instancedRendering = false;
    this.instanceCount = 0;
    this.instanceData = new Float32Array(this.maxBatchSize * 8); // x, y, z, size, r, g, b, a

    // Shader programs
    this.shaders = {};

    // Texture cache
    this.textureCache = {};
    this.textureLoadQueue = [];
    this.maxConcurrentTextureLoads = 4;
    this.activeTextureLoads = 0;

    // Performance metrics
    this.drawCalls = 0;
    this.trianglesRendered = 0;
    this.lastFrameDrawCalls = 0;
    this.frameTimeStart = 0;
    this.gpuTime = 0;

    // Adaptive settings
    this.adaptiveQuality = true;
    this.qualityLevel = 'auto';
    this.lastAdaptiveCheck = 0;
    this.adaptiveCheckInterval = 60; // Check every 60 frames
  }

  // Initialize GPU manager with p5 canvas
  initialize(p5Canvas) {
    if (this.isInitialized) return;

    this.p5Canvas = p5Canvas;

    // Try to get WebGL context
    try {
      // Get WebGL context from p5's canvas
      this.gl = this.p5Canvas.GL;

      if (this.gl) {
        this.isWebGLAvailable = true;

        // Check if WebGL2 is available
        this.isWebGL2Available = (this.gl instanceof WebGL2RenderingContext);

        // Check for extensions
        this.checkExtensions();

        // Initialize shaders and buffers
        this.initializeShaders();

        // Create geometry buffers for common shapes
        this.createGeometryBuffers();

        // Set initial quality based on device capabilities
        this.setInitialQuality();

        this.isInitialized = true;
        console.log('[GPU Manager] Initialized successfully');
        console.log(`[GPU Manager] WebGL2: ${this.isWebGL2Available ? 'Available' : 'Not Available'}`);
      } else {
        console.warn('[GPU Manager] WebGL context not available');
      }
    } catch (e) {
      console.error('[GPU Manager] Error initializing:', e);
      this.isWebGLAvailable = false;
    }

    return this;
  }

  // Set initial quality based on device capabilities
  setInitialQuality() {
    // Determine initial quality based on device capabilities
    if (!this.isWebGLAvailable) {
      // WebGL not available, use lowest quality
      this.qualityLevel = 'low';
      return;
    }

    // Check if we're on a mobile device
    const isMobile = performanceManager.isMobile;

    // Check WebGL version and extensions
    if (this.isWebGL2Available && this.extensionsSupported['WEBGL_draw_buffers']) {
      // High-end device with WebGL2 and advanced extensions
      this.qualityLevel = isMobile ? 'medium' : 'high';
    } else if (this.instancedRendering) {
      // Mid-range device with instancing support
      this.qualityLevel = isMobile ? 'low' : 'medium';
    } else {
      // Basic WebGL support
      this.qualityLevel = 'low';
    }

    console.log(`[GPU Manager] Initial quality set to: ${this.qualityLevel}`);
  }

  // Check for supported WebGL extensions
  checkExtensions() {
    if (!this.gl) return;

    const extensions = [
      'ANGLE_instanced_arrays',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_depth_texture',
      'OES_vertex_array_object',
      'WEBGL_draw_buffers'
    ];

    extensions.forEach(ext => {
      const extension = this.gl.getExtension(ext);
      this.extensionsSupported[ext] = !!extension;

      if (extension && ext === 'ANGLE_instanced_arrays') {
        this.instancedRendering = true;
      }
    });

    console.log('[GPU Manager] Supported extensions:', this.extensionsSupported);
  }

  // Initialize shader programs
  initializeShaders() {
    if (!this.gl) return;

    try {
      // Basic shader for instanced rendering
      if (this.instancedRendering) {
        // We'll use a simple vertex and fragment shader for instanced rendering
        // This is a placeholder - in a real implementation, we would define actual GLSL shaders
        this.shaders.instanced = {
          initialized: true,
          // In a real implementation, we would compile and link shaders here
        };
      }

      // Use p5's built-in shaders for regular rendering
    } catch (e) {
      console.error('[GPU Manager] Error initializing shaders:', e);
    }
  }

  // Create geometry buffers for common shapes
  createGeometryBuffers() {
    if (!this.gl) return;

    try {
      // Create a buffer for a simple quad (for particles, bullets, etc.)
      // In a real implementation, we would create actual WebGL buffers
      this.geometryBuffers.quad = {
        initialized: true,
        // In a real implementation, we would create vertex buffers here
      };

      // Create a buffer for a simple cube (for enemies, etc.)
      this.geometryBuffers.cube = {
        initialized: true,
        // In a real implementation, we would create vertex buffers here
      };
    } catch (e) {
      console.error('[GPU Manager] Error creating geometry buffers:', e);
    }
  }

  // Start a new frame (reset counters)
  beginFrame() {
    // Record frame start time for GPU timing
    this.frameTimeStart = performance.now();

    // Reset counters
    this.drawCalls = 0;
    this.trianglesRendered = 0;
    this.batchSize = 0;

    // Clear batched entities
    for (const key in this.batchedEntities) {
      this.batchedEntities[key] = [];
    }

    // Process texture load queue
    this.processTextureQueue();

    return this;
  }

  // End frame and collect stats
  endFrame() {
    // Flush any remaining batches
    this.flushBatches();

    // Calculate GPU time
    this.gpuTime = performance.now() - this.frameTimeStart;

    // Store stats
    this.lastFrameDrawCalls = this.drawCalls;

    // Check if we need to adapt quality settings
    if (this.adaptiveQuality && (++this.lastAdaptiveCheck >= this.adaptiveCheckInterval)) {
      this.adaptQuality();
      this.lastAdaptiveCheck = 0;
    }

    return this;
  }

  // Adapt quality settings based on performance
  adaptQuality() {
    // Get current FPS from performance manager
    const currentFPS = performanceManager.fps;
    const targetFPS = performanceManager.targetFPS;

    // If FPS is too low, reduce quality
    if (currentFPS < targetFPS * 0.8) { // Below 80% of target
      this.decreaseQuality();
    }
    // If FPS is consistently high, we can try increasing quality
    else if (currentFPS > targetFPS * 0.95 && this.gpuTime < 16) { // Above 95% of target and frame time < 16ms
      this.increaseQuality();
    }
  }

  // Decrease quality to improve performance
  decreaseQuality() {
    // Don't decrease if already at lowest
    if (this.qualityLevel === 'low') return;

    // Determine new quality level
    let newLevel;
    switch (this.qualityLevel) {
      case 'ultra': newLevel = 'high'; break;
      case 'high': newLevel = 'medium'; break;
      case 'medium': newLevel = 'low'; break;
      default: return;
    }

    this.qualityLevel = newLevel;
    console.log(`[GPU Manager] Decreased quality to ${this.qualityLevel}`);
  }

  // Increase quality if performance is good
  increaseQuality() {
    // Don't increase if already at highest
    if (this.qualityLevel === 'ultra') return;

    // Determine new quality level
    let newLevel;
    switch (this.qualityLevel) {
      case 'low': newLevel = 'medium'; break;
      case 'medium': newLevel = 'high'; break;
      case 'high': newLevel = 'ultra'; break;
      default: return;
    }

    this.qualityLevel = newLevel;
    console.log(`[GPU Manager] Increased quality to ${this.qualityLevel}`);
  }

  // Add an entity to the appropriate batch
  batchEntity(entity, type) {
    if (!CONFIG.PERFORMANCE.BATCH_RENDERING) {
      return false; // Batching disabled
    }

    if (!this.batchedEntities[type]) {
      return false; // Unknown batch type
    }

    // Add to batch
    this.batchedEntities[type].push(entity);
    this.batchSize++;

    // Flush if batch is full
    if (this.batchSize >= this.maxBatchSize) {
      this.flushBatches();
    }

    return true;
  }

  // Render all batched entities
  flushBatches() {
    if (!CONFIG.PERFORMANCE.BATCH_RENDERING) {
      return;
    }

    // Process each batch type
    for (const type in this.batchedEntities) {
      const batch = this.batchedEntities[type];
      if (batch.length === 0) continue;

      // Render the batch
      this.renderBatch(batch, type);

      // Clear the batch
      this.batchedEntities[type] = [];
    }

    this.batchSize = 0;
  }

  // Render a batch of entities
  renderBatch(batch, type) {
    if (!this.gl || batch.length === 0) return;

    // Use instanced rendering if supported and appropriate for the entity type
    if (this.instancedRendering && this.canUseInstancing(type)) {
      this.renderBatchInstanced(batch, type);
    } else {
      // Fallback to regular rendering
      this.renderBatchRegular(batch, type);
    }
  }

  // Check if we can use instancing for this entity type
  canUseInstancing(type) {
    // Only use instancing for certain entity types and if the quality level allows it
    return (
      (type === 'particles' || type === 'bullets') &&
      this.qualityLevel !== 'low' &&
      CONFIG.PERFORMANCE.USE_INSTANCING
    );
  }

  // Render a batch using instanced rendering
  renderBatchInstanced(batch, type) {
    // In a real implementation, we would:
    // 1. Prepare instance data (positions, colors, etc.)
    // 2. Bind the appropriate geometry buffer (quad, cube, etc.)
    // 3. Set up instanced attributes
    // 4. Draw all instances in a single draw call

    // For now, we'll just simulate the performance benefit
    this.drawCalls++; // Just one draw call for the entire batch

    // Estimate triangles rendered
    let trianglesPerEntity = 0;
    switch (type) {
      case 'enemies': trianglesPerEntity = 20; break;
      case 'bullets': trianglesPerEntity = 8; break;
      case 'particles': trianglesPerEntity = 4; break;
      case 'skills': trianglesPerEntity = 12; break;
      case 'powerUps': trianglesPerEntity = 16; break;
      default: trianglesPerEntity = 10;
    }

    this.trianglesRendered += batch.length * trianglesPerEntity;
  }

  // Render a batch using regular rendering (one draw call per entity)
  renderBatchRegular(batch, type) {
    // For now, we'll just use p5's rendering for each entity
    // In a real implementation, we would optimize this further

    // Each entity gets its own draw call
    this.drawCalls += batch.length;

    // Estimate triangles rendered
    let trianglesPerEntity = 0;
    switch (type) {
      case 'enemies': trianglesPerEntity = 20; break;
      case 'bullets': trianglesPerEntity = 8; break;
      case 'particles': trianglesPerEntity = 4; break;
      case 'skills': trianglesPerEntity = 12; break;
      case 'powerUps': trianglesPerEntity = 16; break;
      default: trianglesPerEntity = 10;
    }

    this.trianglesRendered += batch.length * trianglesPerEntity;
  }

  // Create and cache a texture
  createTexture(imageOrPath) {
    if (typeof imageOrPath === 'string') {
      // Check cache first
      if (this.textureCache[imageOrPath]) {
        return this.textureCache[imageOrPath];
      }

      // Add to load queue if not already loading
      if (!this.textureLoadQueue.includes(imageOrPath)) {
        this.textureLoadQueue.push(imageOrPath);
        this.processTextureQueue();
      }

      // Return a placeholder texture or null
      return null;
    } else if (imageOrPath && imageOrPath.width && imageOrPath.height) {
      // It's an image object, create texture directly
      const texture = this.createTextureFromImage(imageOrPath);
      return texture;
    }

    return null;
  }

  // Create a texture from an image object
  createTextureFromImage(image) {
    if (!this.gl || !image) return null;

    try {
      // In a real implementation, we would create a WebGL texture here
      // For now, we'll just return a placeholder
      return {
        width: image.width,
        height: image.height,
        // Other texture properties would go here
      };
    } catch (e) {
      console.error('[GPU Manager] Error creating texture:', e);
      return null;
    }
  }

  // Process the texture load queue
  processTextureQueue() {
    // Don't process if we're already at the concurrent load limit
    if (this.activeTextureLoads >= this.maxConcurrentTextureLoads) return;

    // Process up to the concurrent load limit
    while (this.textureLoadQueue.length > 0 && this.activeTextureLoads < this.maxConcurrentTextureLoads) {
      const path = this.textureLoadQueue.shift();
      this.activeTextureLoads++;

      // In a real implementation, we would load the image and create a texture
      // For now, we'll just simulate the loading process
      setTimeout(() => {
        // Simulate texture creation
        this.textureCache[path] = {
          width: 256,
          height: 256,
          // Other texture properties would go here
        };

        this.activeTextureLoads--;
        this.processTextureQueue(); // Process next in queue
      }, 100); // Simulate loading time
    }
  }

  // Check if the device supports instanced rendering
  supportsInstancing() {
    return this.instancedRendering;
  }

  // Get performance stats
  getStats() {
    return {
      drawCalls: this.lastFrameDrawCalls,
      trianglesRendered: this.trianglesRendered,
      batchSize: this.batchSize,
      webgl2: this.isWebGL2Available,
      instancing: this.instancedRendering
    };
  }

  // Display GPU stats (for debug)
  displayStats(x, y) {
    push();
    textAlign(LEFT);
    textSize(14);
    fill(255);
    text(`Draw Calls: ${this.lastFrameDrawCalls}`, x, y);
    text(`GPU Time: ${this.gpuTime.toFixed(2)}ms`, x, y + 20);
    text(`Quality: ${this.qualityLevel}`, x, y + 40);
    text(`WebGL2: ${this.isWebGL2Available ? 'Yes' : 'No'}`, x, y + 60);
    text(`Instancing: ${this.instancedRendering ? 'Yes' : 'No'}`, x, y + 80);
    pop();
  }
}

// Create and export a singleton instance
const gpuManager = new GPUManager();
export default gpuManager;