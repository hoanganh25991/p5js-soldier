// Sound Manager Module
// Handles sound loading, playback, batching, and memory management

import CONFIG from '../config.js';

class SoundManager {
  constructor() {
    // Sound collections
    this.sounds = {};
    this.soundInstances = [];
    
    // Sound settings
    this.masterVolume = 0.5;
    this.maxSounds = 20; // Maximum number of sounds playing simultaneously
    this.batchWindow = 50; // Time window in ms to batch similar sounds
    
    // Sound batching queues
    this.batchQueues = {};
    
    // Priority levels (higher number = higher priority)
    this.PRIORITY = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };
  }

  // Load all game sounds
  loadSounds() {
    // Main gameplay sounds
    this.registerSound('shoot', 'sounds/single-shot.mp3');
    this.registerSound('clone', 'sounds/woosh.mp3');
    this.registerSound('spawn', 'sounds/woosh.mp3'); // Reuse woosh sound for character spawn
    
    return this; // For method chaining
  }

  // Register a new sound
  registerSound(id, path) {
    this.sounds[id] = {
      path: path,
      sound: loadSound(path),
      instances: [],
      lastPlayed: 0
    };
    
    return this;
  }

  // Set master volume for all sounds
  setMasterVolume(volume) {
    this.masterVolume = volume;
    
    // Update volume for all loaded sounds
    for (const id in this.sounds) {
      if (this.sounds[id].sound) {
        this.sounds[id].sound.setVolume(volume);
      }
    }
    
    return this;
  }

  // Play a sound with various options
  play(id, options = {}) {
    const defaults = {
      volume: this.masterVolume,
      priority: this.PRIORITY.MEDIUM,
      allowBatching: true,
      sourceType: null, // For analytics/debugging
      sourceId: null    // For analytics/debugging
    };
    
    const settings = { ...defaults, ...options };
    
    // Check if sound exists
    if (!this.sounds[id] || !this.sounds[id].sound) {
      console.warn(`Sound '${id}' not found or not loaded`);
      return null;
    }
    
    // Check if we should batch this sound
    if (settings.allowBatching) {
      const now = Date.now();
      
      // Initialize batch queue for this sound if it doesn't exist
      if (!this.batchQueues[id]) {
        this.batchQueues[id] = {
          lastBatchTime: 0,
          pendingCount: 0,
          pendingVolume: 0
        };
      }
      
      const queue = this.batchQueues[id];
      
      // If we're within the batch window, add to batch instead of playing immediately
      if (now - queue.lastBatchTime < this.batchWindow) {
        queue.pendingCount++;
        queue.pendingVolume = Math.min(1.0, queue.pendingVolume + (settings.volume * 0.2));
        
        // If this is the first sound in a new batch, schedule the batch to play
        if (queue.pendingCount === 1) {
          setTimeout(() => this.playBatch(id), this.batchWindow);
        }
        
        return null;
      }
      
      // Start a new batch
      queue.lastBatchTime = now;
      queue.pendingCount = 1;
      queue.pendingVolume = settings.volume;
      
      // Schedule this batch to play
      setTimeout(() => this.playBatch(id), this.batchWindow);
      return null;
    }
    
    // If we're not batching, play immediately
    return this.playImmediate(id, settings.volume, settings.priority);
  }

  // Play a batched sound
  playBatch(id) {
    if (!this.batchQueues[id]) return null;
    
    const queue = this.batchQueues[id];
    
    // Only play if there are pending sounds
    if (queue.pendingCount > 0) {
      // Calculate volume based on number of sounds in batch
      const volume = Math.min(1.0, queue.pendingVolume);
      
      // Play the batched sound
      const instance = this.playImmediate(id, volume, this.PRIORITY.MEDIUM);
      
      // Reset the batch
      queue.pendingCount = 0;
      queue.pendingVolume = 0;
      
      return instance;
    }
    
    return null;
  }

  // Play a sound immediately
  playImmediate(id, volume, priority) {
    const sound = this.sounds[id];
    
    // Check if we need to remove old sounds to stay under the limit
    this.manageActiveSounds(priority);
    
    // Play the sound
    const soundInstance = sound.sound.play();
    
    // Set the volume
    sound.sound.setVolume(volume);
    
    // Track this instance
    this.soundInstances.push({
      id,
      instance: soundInstance,
      priority,
      startTime: Date.now()
    });
    
    // Update last played time
    sound.lastPlayed = Date.now();
    
    return soundInstance;
  }

  // Manage active sounds to prevent too many from playing at once
  manageActiveSounds(newSoundPriority) {
    // Remove completed sounds from tracking
    this.soundInstances = this.soundInstances.filter(instance => {
      // Keep only sounds that are still playing
      return instance.instance && instance.instance.isPlaying();
    });
    
    // If we're under the limit, no need to remove any sounds
    if (this.soundInstances.length < this.maxSounds) {
      return;
    }
    
    // Sort by priority (lowest first) and then by start time (oldest first)
    this.soundInstances.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.startTime - b.startTime;
    });
    
    // Remove lowest priority sounds until we're under the limit
    while (this.soundInstances.length >= this.maxSounds) {
      const oldest = this.soundInstances.shift();
      if (oldest && oldest.instance) {
        oldest.instance.stop();
      }
    }
  }

  // Play a sound with temporary volume change
  playWithTempVolume(id, tempVolume, options = {}) {
    // Get the sound
    const sound = this.sounds[id];
    if (!sound || !sound.sound) {
      console.warn(`Sound '${id}' not found or not loaded`);
      return;
    }
    
    // Save current volume
    const currentVolume = sound.sound.getVolume();
    
    // Set to temporary volume
    sound.sound.setVolume(tempVolume);
    
    // Play the sound
    const instance = this.play(id, { ...options, allowBatching: false });
    
    // Reset to original volume after playing
    setTimeout(() => {
      sound.sound.setVolume(currentVolume);
    }, 100);
    
    return instance;
  }

  // Get a sound by ID
  getSound(id) {
    return this.sounds[id] ? this.sounds[id].sound : null;
  }

  // Stop all sounds
  stopAll() {
    for (const id in this.sounds) {
      if (this.sounds[id].sound) {
        this.sounds[id].sound.stop();
      }
    }
    
    // Clear tracking arrays
    this.soundInstances = [];
    
    return this;
  }

  // Pause all sounds
  pauseAll() {
    for (const id in this.sounds) {
      if (this.sounds[id].sound && this.sounds[id].sound.isPlaying()) {
        this.sounds[id].sound.pause();
      }
    }
    
    return this;
  }

  // Resume all sounds
  resumeAll() {
    for (const id in this.sounds) {
      if (this.sounds[id].sound && !this.sounds[id].sound.isPlaying()) {
        this.sounds[id].sound.play();
      }
    }
    
    return this;
  }
}

// Create and export a singleton instance
const soundManager = new SoundManager();
export default soundManager;