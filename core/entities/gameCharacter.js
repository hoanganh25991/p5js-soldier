// Game Character Module
// Implements different game characters spawned by the GBA

import { Character } from './characters/Character.js';
import { Tank } from './characters/Tank.js';
import { Hero } from './characters/Hero.js';
import { Mario } from './characters/Mario.js';
import { Megaman } from './characters/Megaman.js';
import { Songoku } from './characters/Songoku.js';

export class GameCharacter {
  constructor(x, y, z, type, gameState) {
    // Create the appropriate character type
    let character;
    
    // Store the character type
    this.type = type;
    
    // Create the character instance
    switch (type) {
      case 'TANK':
        character = new Tank(x, y, z, gameState);
        // Add character-specific drawing methods
        this.drawTank = Tank.prototype.drawTank.bind(this);
        break;
      case 'HERO':
        character = new Hero(x, y, z, gameState);
        // Add character-specific drawing methods
        this.drawHero = Hero.prototype.drawHero.bind(this);
        break;
      case 'MARIO':
        character = new Mario(x, y, z, gameState);
        // Add character-specific drawing methods
        this.drawMario = Mario.prototype.drawMario.bind(this);
        break;
      case 'MEGAMAN':
        character = new Megaman(x, y, z, gameState);
        // Add character-specific drawing methods
        this.drawMegaman = Megaman.prototype.drawMegaman.bind(this);
        break;
      case 'SONGOKU':
        character = new Songoku(x, y, z, gameState);
        // Add character-specific drawing methods
        this.drawSongoku = Songoku.prototype.drawSongoku.bind(this);
        break;
      default:
        console.warn(`Unknown character type: ${type}, using base Character class`);
        character = new Character(x, y, z, type, gameState);
    }
    
    // Copy all properties from the created character to this instance
    Object.assign(this, character);
    
    // Copy all methods from Character prototype and bind them to this instance
    this.update = Character.prototype.update.bind(this);
    this.show = Character.prototype.show.bind(this);
    this.drawCharacter = Character.prototype.drawCharacter.bind(this);
    this.attack = Character.prototype.attack.bind(this);
    this.useSpecialAbility = Character.prototype.useSpecialAbility.bind(this);
    this.findNearestEnemy = Character.prototype.findNearestEnemy.bind(this);
    this.takeDamage = Character.prototype.takeDamage.bind(this);
    this.drawHealthBar = Character.prototype.drawHealthBar.bind(this);
    this.getBreathingEffect = Character.prototype.getBreathingEffect.bind(this);
    this.getWalkingEffect = Character.prototype.getWalkingEffect.bind(this);
    this.getAttackingEffect = Character.prototype.getAttackingEffect.bind(this);
    
    // Override with character-specific methods and bind them to this instance
    switch (type) {
      case 'TANK':
        this.attack = Tank.prototype.attack.bind(this);
        this.useSpecialAbility = Tank.prototype.useSpecialAbility.bind(this);
        this.drawCharacter = Tank.prototype.drawCharacter.bind(this);
        break;
      case 'HERO':
        this.attack = Hero.prototype.attack.bind(this);
        this.useSpecialAbility = Hero.prototype.useSpecialAbility.bind(this);
        this.drawCharacter = Hero.prototype.drawCharacter.bind(this);
        break;
      case 'MARIO':
        this.attack = Mario.prototype.attack.bind(this);
        this.useSpecialAbility = Mario.prototype.useSpecialAbility.bind(this);
        this.drawCharacter = Mario.prototype.drawCharacter.bind(this);
        break;
      case 'MEGAMAN':
        this.attack = Megaman.prototype.attack.bind(this);
        this.useSpecialAbility = Megaman.prototype.useSpecialAbility.bind(this);
        this.drawCharacter = Megaman.prototype.drawCharacter.bind(this);
        break;
      case 'SONGOKU':
        this.attack = Songoku.prototype.attack.bind(this);
        this.useSpecialAbility = Songoku.prototype.useSpecialAbility.bind(this);
        this.drawCharacter = Songoku.prototype.drawCharacter.bind(this);
        break;
    }
  }
}