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
    
    console.log(`Spawning ${randomType} character at CENTER position: 0, -50, 0`);
    
    // Calculate a position directly in front of the player
    const spawnDistance = 100; // Distance in front of player
    const playerAngle = this.gameState.player.rotation;
    const spawnX = this.gameState.player.x + Math.cos(playerAngle) * spawnDistance;
    const spawnZ = this.gameState.player.z + Math.sin(playerAngle) * spawnDistance;
    
    console.log(`Player angle: ${playerAngle.toFixed(2)}, Spawn position: ${spawnX.toFixed(0)}, -50, ${spawnZ.toFixed(0)}`);
    
    // Create the character directly in front of the player
    const character = new GameCharacter(
      spawnX, 
      -50, // Fixed height
      spawnZ, 
      randomType,
      this.gameState
    );
    
    // Add to game state
    this.gameState.gameCharacters.push(character);
    console.log(`Game characters count: ${this.gameState.gameCharacters.length}`);
    
    // Create a visual effect for the spawn
    // Add a wave effect to make the spawn more noticeable
    if (this.gameState.waves) {
      // Create a wave at the spawn position
      const spawnWave = new Wave(
        spawnX, 
        -50, // Fixed height
        spawnZ, 
        300, // MUCH larger radius
        [255, 0, 0, 200] // Bright red, more opaque
      );
      spawnWave.growthRate = 10; // Faster growth
      this.gameState.waves.push(spawnWave);
      
      // Add a second wave with different color
      const spawnWave2 = new Wave(
        spawnX, 
        -50, // Fixed height
        spawnZ, 
        200, // Smaller initial radius
        [255, 255, 0, 200] // Yellow, more opaque
      );
      spawnWave2.growthRate = 15; // Even faster growth
      this.gameState.waves.push(spawnWave2);
    }
    
    // Play spawn sound
    if (this.gameState.spawnSound) {
      this.gameState.spawnSound.play();
    }
  }
}