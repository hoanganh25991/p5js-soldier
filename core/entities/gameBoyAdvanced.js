// Game Boy Advanced Module
// Implements a throwable GBA that spawns random game characters

import CONFIG from '../config.js';
import { GameCharacter } from './gameCharacter.js';
import { updateHeight } from '../utils.js';
import { Wave } from './wave.js';

export class GameBoyAdvanced {
  // Static method to get all characters from the game state
  static getCharacters(gameState) {
    return gameState.gameCharacters || [];
  }
  constructor(x, y, z, direction, speed, distance, gameState) {
    this.gameState = gameState;
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Movement
    this.direction = direction;
    this.speed = speed;
    this.distance = distance;
    this.distanceTraveled = 0;
    
    // Physics
    this.velocityY = -10; // Higher initial upward velocity for better visibility
    this.gravity = 0.4;   // Stronger gravity for faster fall
    this.grounded = false;
    
    // Appearance (larger for better visibility)
    this.width = 25;
    this.height = 8;
    this.depth = 15;
    this.rotation = 0;
    this.rotationSpeed = 0.1;
    
    // Set a fixed ground level
    // This ensures the GBA and characters are visible on the screen
    this.groundLevel = -50;
  }
  
  update() {
    // If already hit the ground, return true to remove this object
    if (this.grounded) {
      // Spawn a random game character
      this.spawnGameCharacter();
      return true;
    }
    
    // Update position based on direction and speed
    this.x += cos(this.direction) * this.speed;
    this.z += sin(this.direction) * this.speed;
    
    // Apply gravity and update vertical position
    this.velocityY += this.gravity;
    this.y += this.velocityY;
    
    // Rotate while in air
    this.rotation += this.rotationSpeed;
    
    // Track distance traveled
    this.distanceTraveled += this.speed;
    
    // Check if GBA has hit the ground
    if (this.y >= this.groundLevel) {
      this.y = this.groundLevel; // Set to ground level
      this.grounded = true;
    }
    
    // Check if GBA has traveled its maximum distance
    if (this.distanceTraveled >= this.distance) {
      this.grounded = true;
    }
    
    return false; // Not done yet
  }
  
  show() {
    // Remove console.log to improve performance
    // console.log(`Showing GBA at position: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
    
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.direction);
    rotateX(this.rotation);
    
    // Add stroke for better visibility
    stroke(0);
    strokeWeight(2);
    
    // GBA body - brighter purple color
    fill(180, 50, 180);
    box(this.width, this.height, this.depth);
    
    // GBA screen - light blue
    push();
    translate(0, -this.height/2 - 1, 0);
    fill(173, 216, 230);
    box(this.width * 0.7, 1, this.depth * 0.7);
    pop();
    
    // GBA buttons - red and black
    push();
    translate(this.width/3, -this.height/2 - 1, this.depth/3);
    fill(255, 0, 0);
    sphere(1.5);
    pop();
    
    push();
    translate(this.width/3, -this.height/2 - 1, -this.depth/3);
    fill(0);
    sphere(1.5);
    pop();
    
    pop();
  }
  
  spawnGameCharacter() {
    // Choose a random character type
    const characterTypes = ['TANK', 'HERO', 'MARIO', 'MEGAMAN', 'SONGOKU'];
    const randomType = characterTypes[Math.floor(random(characterTypes.length))];
    
    // Remove console.log to improve performance
    // console.log(`Spawning ${randomType} character at position: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
    
    // Create the character at the GBA's landing position
    const character = new GameCharacter(
      this.x, 
      this.y, // Use the GBA's height
      this.z, 
      randomType,
      this.gameState
    );
    
    // Add to game state
    this.gameState.gameCharacters.push(character);
    // Remove console.log to improve performance
    // console.log(`Game characters count: ${this.gameState.gameCharacters.length}`);
    
    // Create a minimal visual effect for the spawn (optimized for performance)
    // Removed ground-level waves/auras to fix FPS drop issue
    if (this.gameState.waves) {
      // Create a colored wave based on character type
      let waveColor;
      switch (randomType) {
        case 'TANK':
          waveColor = [100, 100, 100, 180]; // Gray for tank
          break;
        case 'HERO':
          waveColor = [100, 100, 255, 180]; // Blue for hero
          break;
        case 'MARIO':
          waveColor = [255, 50, 50, 180]; // Red for Mario
          break;
        case 'MEGAMAN':
          waveColor = [0, 150, 255, 180]; // Light blue for Megaman
          break;
        case 'SONGOKU':
          waveColor = [255, 255, 0, 180]; // Yellow for Songoku
          break;
        default:
          waveColor = [200, 200, 0, 180]; // Default yellow
      }
      
      // Create a single rising particle instead of ground-level waves
      // This avoids the FPS drop caused by ground-level auras
      const particleY = this.y - 100; // Position well above ground level
      
      // Create a small wave that rises up from the spawn point
      const spawnEffect = new Wave(
        this.x,
        particleY, // Start above ground level
        this.z,
        50,
        [...waveColor.slice(0, 3), 150]
      );
      spawnEffect.growthRate = 2;
      spawnEffect.maxRadius = 100;
      spawnEffect.riseSpeed = 2; // Make it rise
      spawnEffect.lifespan = 20; // Shorter lifespan
      this.gameState.waves.push(spawnEffect);
    }
    
    // Play spawn sound
    if (this.gameState.spawnSound) {
      this.gameState.spawnSound.play();
    }
  }
}