// Gas Lighter Module
// Implements a throwable Gas Lighter that casts random fire skills

import CONFIG from '../config.js';
import { Wave } from './wave.js';
import { FireSkill } from './fireSkill.js';

export class GasLighter {
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
    
    // Appearance
    this.width = 20;
    this.height = 10;
    this.depth = 15;
    this.rotation = 0;
    this.rotationSpeed = 0.15;
    
    // Set a fixed ground level
    this.groundLevel = -50;
  }
  
  update() {
    // If already hit the ground, return true to remove this object
    if (this.grounded) {
      // Cast a random fire skill
      this.castFireSkill();
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
    
    // Check if Gas Lighter has hit the ground
    if (this.y >= this.groundLevel) {
      this.y = this.groundLevel; // Set to ground level
      this.grounded = true;
    }
    
    // Check if Gas Lighter has traveled its maximum distance
    if (this.distanceTraveled >= this.distance) {
      this.grounded = true;
    }
    
    return false; // Not done yet
  }
  
  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(this.direction);
    rotateX(this.rotation);
    
    // Add stroke for better visibility
    stroke(0);
    strokeWeight(2);
    
    // Gas Lighter body - metallic silver
    fill(200, 200, 200);
    box(this.width, this.height, this.depth);
    
    // Gas Lighter top - with flame
    push();
    translate(0, -this.height/2 - 2, 0);
    
    // Lighter top
    fill(150, 150, 150);
    box(this.width * 0.8, 4, this.depth * 0.8);
    
    // Flame effect
    if (!this.grounded) {
      push();
      translate(0, -5, 0);
      noStroke();
      
      // Inner flame - yellow
      fill(255, 255, 0, 200);
      sphere(3 + sin(frameCount * 0.2) * 1);
      
      // Outer flame - orange
      fill(255, 150, 0, 150);
      sphere(5 + sin(frameCount * 0.2) * 1.5);
      
      // Flame tip - red
      fill(255, 50, 0, 100);
      sphere(7 + sin(frameCount * 0.2) * 2);
      pop();
    }
    pop();
    
    // Gas Lighter wheel
    push();
    translate(this.width/3, -this.height/2, 0);
    fill(100, 100, 100);
    rotateX(HALF_PI);
    cylinder(3, 2);
    pop();
    
    pop();
  }
  
  castFireSkill() {
    // Choose a random fire skill type
    const fireSkillTypes = ['FIREBALL', 'FLAME_SHIELD', 'INFERNO_BLAST', 'PHOENIX_REBIRTH', 'FIRESTORM'];
    const randomType = fireSkillTypes[Math.floor(random(fireSkillTypes.length))];
    
    // Create the fire skill at the Gas Lighter's landing position
    const fireSkill = new FireSkill(
      this.x, 
      this.y, 
      this.z, 
      randomType,
      this.gameState
    );
    
    // Add to game state
    if (!this.gameState.fireSkills) {
      this.gameState.fireSkills = [];
    }
    this.gameState.fireSkills.push(fireSkill);
    
    // Create a visual effect for the cast
    if (this.gameState.waves) {
      // Get the color for this fire skill type
      let waveColor = CONFIG.GAS_LIGHTER.CAST_EFFECTS.PARTICLE_COLORS[randomType] || [255, 100, 0];
      
      // Add alpha channel
      waveColor = [...waveColor, 180];
      
      // Create a wave effect
      const castWave = new Wave(
        this.x,
        this.y,
        this.z,
        100,
        waveColor
      );
      castWave.growthRate = 5;
      castWave.maxRadius = 200;
      this.gameState.waves.push(castWave);
      
      // Add rising particles
      for (let i = 0; i < 15; i++) {
        const particleAngle = random(TWO_PI);
        const particleRadius = random(50, 150);
        const particleX = this.x + cos(particleAngle) * particleRadius;
        const particleY = this.y - random(20, 100);
        const particleZ = this.z + sin(particleAngle) * particleRadius;
        
        const particleWave = new Wave(
          particleX,
          particleY,
          particleZ,
          random(10, 30),
          [...waveColor.slice(0, 3), random(100, 200)]
        );
        particleWave.growthRate = random(1, 3);
        particleWave.maxRadius = random(30, 60);
        particleWave.riseSpeed = random(1, 3);
        particleWave.lifespan = random(20, 40);
        this.gameState.waves.push(particleWave);
      }
    }
    
    // Play cast sound
    if (this.gameState.fireSound) {
      this.gameState.fireSound.play();
    } else if (this.gameState.spawnSound) {
      // Fallback to spawn sound if fire sound doesn't exist
      this.gameState.spawnSound.play();
    }
  }
}