// Character Classes Index
// Exports all character classes for easy importing

import { Character } from './Character.js';
import { Tank } from './Tank.js';
import { Hero } from './Hero.js';
import { Mario } from './Mario.js';
import { Megaman } from './Megaman.js';
import { Songoku } from './Songoku.js';

// Export all classes for external use
export { Character, Tank, Hero, Mario, Megaman, Songoku };

// Factory function to create the appropriate character type
export function createCharacter(x, y, z, type, gameState) {
  switch (type) {
    case 'TANK':
      return new Tank(x, y, z, gameState);
    case 'HERO':
      return new Hero(x, y, z, gameState);
    case 'MARIO':
      return new Mario(x, y, z, gameState);
    case 'MEGAMAN':
      return new Megaman(x, y, z, gameState);
    case 'SONGOKU':
      return new Songoku(x, y, z, gameState);
    default:
      console.warn(`Unknown character type: ${type}, using base Character class`);
      return new Character(x, y, z, type, gameState);
  }
}