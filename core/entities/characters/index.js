// Character Classes Index
// Exports all character classes for easy importing

export { Character } from './Character.js';
export { Tank } from './Tank.js';
export { Hero } from './Hero.js';
export { Mario } from './Mario.js';
export { Megaman } from './Megaman.js';
export { Songoku } from './Songoku.js';

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