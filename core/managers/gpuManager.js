// GPU Manager
// Handles GPU acceleration and WebGL optimizations

import CONFIG from '../../config.js';

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
      particles: []
    };
    
    // Instanced rendering
    this.instancedRendering = false;
    this.instanceCount = 0;
    
    // Shader programs
    this.shaders = {};
    
    // Texture cache
    this.textureCache = {};
    
    // Performance metrics
    this.drawCalls = 0;
    this.trianglesRendered = 0;
    this.lastFrameDrawCalls = 0;
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
    // We'll use p5's built-in shaders for now
    // In the future, we could add custom shaders here
  }
  
  // Start a new frame (reset counters)
  beginFrame() {
    this.drawCalls = 0;
    this.trianglesRendered = 0;
    this.batchSize = 0;
    
    // Clear batched entities
    for (const key in this.batchedEntities) {
      this.batchedEntities[key] = [];
    }
    
    return this;
  }
  
  // End frame and collect stats
  endFrame() {
    // Flush any remaining batches
    this.flushBatches();
    
    // Store stats
    this.lastFrameDrawCalls = this.drawCalls;
    
    return this;
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
    
    // For now, we'll just use p5's rendering for each entity
    // In the future, we could implement true batched rendering with a single draw call
    
    // Count as a single draw call for stats purposes
    this.drawCalls++;
    
    // Estimate triangles rendered
    let trianglesPerEntity = 0;
    switch (type) {
      case 'enemies': trianglesPerEntity = 20; break;
      case 'bullets': trianglesPerEntity = 8; break;
      case 'particles': trianglesPerEntity = 4; break;
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
      
      // Load image and create texture
      // For now, we'll rely on p5's texture loading
      // In the future, we could implement custom texture loading
    }
    
    return null;
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
    text(`WebGL2: ${this.isWebGL2Available ? 'Yes' : 'No'}`, x, y + 20);
    text(`Instancing: ${this.instancedRendering ? 'Yes' : 'No'}`, x, y + 40);
    pop();
  }
}

// Create and export a singleton instance
const gpuManager = new GPUManager();
export default gpuManager;