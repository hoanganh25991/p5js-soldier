// Game Character Module
// Implements different game characters spawned by the GBA

import { createCharacter } from './characters/index.js';

export class GameCharacter {
  constructor(x, y, z, type, gameState) {
    // Create the appropriate character type using the factory function
    const character = createCharacter(x, y, z, type, gameState);
    
    // Copy all properties from the created character to this instance
    Object.assign(this, character);
  }
}