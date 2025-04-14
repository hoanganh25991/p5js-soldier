# Performance Optimizations

This document outlines the performance optimizations implemented in the game to ensure smooth gameplay across different devices and performance levels.

## Core Optimization Techniques

### 1. Level of Detail (LOD) System

We've implemented a comprehensive LOD system that adjusts the detail level of entities based on:
- Distance from the player/camera
- Current FPS
- Device capabilities (mobile vs desktop)
- Quality settings

Each entity can have up to 3 LOD levels:
- **LOD 0**: High detail (close to player)
- **LOD 1**: Medium detail (medium distance)
- **LOD 2**: Low detail (far from player)

### 2. Staggered Updates

Not all entities need to be updated every frame. We've implemented a staggered update system:
- **LOD 0 entities**: Updated every frame
- **LOD 1 entities**: Updated every other frame
- **LOD 2 entities**: Updated every third frame

This significantly reduces CPU load while maintaining visual quality.

### 3. Batch Rendering

Entities of the same type and LOD level are grouped together for batch rendering:
- Reduces draw calls
- Improves GPU utilization
- Supports GPU instancing when available

### 4. Adaptive Quality Settings

The game automatically adjusts quality settings based on performance:
- Monitors FPS and adjusts settings to maintain target framerate
- Reduces particle counts, draw distance, and detail levels when needed
- Different default settings for mobile vs desktop

### 5. Entity Culling

Entities that are too far from the player are:
- Not rendered
- Updated less frequently or not at all
- Removed if they exceed maximum counts

## Optimized Systems

### Enemy Manager

- Groups enemies by LOD level for efficient rendering
- Implements staggered updates based on distance
- Reduces particle effects for distant enemies
- Adjusts spawn rates based on performance
- Uses simplified rendering for distant enemies

### Boss Manager

- Implements LOD-based rendering for bosses
- Reduces special effects based on performance
- Staggered updates for distant bosses
- Optimized spawn effects that scale with performance

### Entity Manager

- Limits the number of entities based on performance
- Prioritizes newer/closer entities when limits are reached
- Implements batch rendering for bullets, waves, and characters
- Optimizes wave effects with distance-based detail reduction

### Particle Manager

- Uses object pooling to reduce garbage collection
- Implements batch rendering for particles
- Adjusts particle counts based on performance
- Supports GPU acceleration when available

## Mobile-Specific Optimizations

- Reduced entity counts
- Lower particle limits
- Simplified rendering
- Increased LOD thresholds
- Disabled post-processing effects
- Reduced spawn rates

## Performance Monitoring

The performance manager continuously monitors:
- Current FPS
- Frame time history
- Memory usage (when available)
- Entity counts

Based on these metrics, it can dynamically adjust quality settings to maintain the target framerate.

## Implementation Details

### LOD Calculation

```javascript
// Get the appropriate level of detail for an entity based on distance
getEntityLOD(x, z) {
  const distance = Math.sqrt(x * x + z * z);
  const normalizedDistance = distance / this.drawDistance;
  
  // Return LOD level (0 = highest detail, 2 = lowest detail)
  if (normalizedDistance < 0.3) return 0;
  if (normalizedDistance < 0.7) return 1;
  return 2;
}
```

### Staggered Updates

```javascript
// Determine if we should update this entity on this frame
let shouldUpdate = false;

// Always update close entities (LOD 0)
if (lod === 0) {
  shouldUpdate = true;
}
// Update medium distance entities (LOD 1) every other frame
else if (lod === 1 && currentFrame % 2 === 0) {
  shouldUpdate = true;
}
// Update far entities (LOD 2) every third frame
else if (lod === 2 && currentFrame % 3 === 0) {
  shouldUpdate = true;
}

// Only update if needed
if (shouldUpdate) {
  entity.update();
}
```

### Batch Rendering

```javascript
// Group entities by LOD for batch rendering
const entitiesByLOD = {
  0: [], // High detail
  1: [], // Medium detail
  2: []  // Low detail
};

// Sort entities by LOD
for (const entity of entities) {
  const lod = getLOD(entity);
  entitiesByLOD[lod].push(entity);
}

// Try to use GPU batching for low-detail entities
if (useGPUBatching && entitiesByLOD[2].length > 0) {
  if (gpuManager.batchEntity(entitiesByLOD[2], 'entity_type')) {
    // Successfully batched, skip individual rendering
    entitiesByLOD[2] = [];
  }
}

// Render each LOD group
for (const lod in entitiesByLOD) {
  renderEntities(entitiesByLOD[lod], parseInt(lod));
}
```

### Collision Manager

- Implements spatial partitioning for efficient collision detection
- Uses adaptive collision check frequency based on performance
- Prioritizes collision checks by importance (player > bullets > power-ups > skills)
- Implements staggered collision checks for distant entities
- Limits the number of collision checks per frame
- Skips expensive collision checks on low-performance devices
- Implements damage cooldown to prevent collision spam
- Optimizes search radius for each entity type

```javascript
// Dynamically adjust check frequency based on performance
if (performanceManager) {
  // On mobile devices, check less frequently
  if (performanceManager.isMobile) {
    this.checkFrequency = Math.max(2, this.checkFrequency);
  }
  
  // If FPS is low, reduce collision check frequency
  if (performanceManager.fps < performanceManager.targetFPS * 0.7) {
    this.checkFrequency = Math.min(4, this.checkFrequency + 1);
  } 
  // If FPS is good, we can check more frequently
  else if (performanceManager.fps > performanceManager.targetFPS * 0.9 && this.checkFrequency > 1) {
    this.checkFrequency = Math.max(1, this.checkFrequency - 1);
  }
}
```

## Future Optimizations

- WebGL instanced rendering for similar entities
- Occlusion culling for entities behind obstacles
- Texture atlasing for improved batch rendering
- Web Workers for physics calculations
- Adaptive resolution scaling