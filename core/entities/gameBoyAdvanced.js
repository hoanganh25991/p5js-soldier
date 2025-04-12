// Game Boy Advanced Module
// Implements a throwable GBA that spawns random game characters

import CONFIG from '../config.js';
import { GameCharacter } from './gameCharacter.js';
import { updateHeight } from '../utils.js';
import { Wave } from './wave.js';

export class GameBoyAdvanced {
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
    console.log(`Showing GBA at position: ${this.x.toFixed(0)}, ${this.y.toFixed(0)}, ${this.z.toFixed(0)}`);
    
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
    
    console.log(`Spawning ${randomType} character at position: ${this.x.toFixed(0)}, ${this.groundLevel.toFixed(0)}, ${this.z.toFixed(0)}`);
    
    // Create the character
    const character = new GameCharacter(
      this.x, 
      this.groundLevel, // On the ground
      this.z, 
      randomType,
      this.gameState
    );
    
    // Add to game state
    this.gameState.gameCharacters.push(character);
    console.log(`Game characters count: ${this.gameState.gameCharacters.length}`);
    
    // Create a visual effect for the spawn
    // Add a wave effect to make the spawn more noticeable
    if (this.gameState.waves) {
      const spawnWave = new Wave(
        this.x, 
        this.groundLevel, 
        this.z, 
        100, // Large radius
        [255, 255, 255, 200] // White, semi-transparent
      );
      spawnWave.growthRate = 5; // Fast growth
      this.gameState.waves.push(spawnWave);
    }
    
    // Play spawn sound
    if (this.gameState.spawnSound) {
      this.gameState.spawnSound.play();
    }
  }
}