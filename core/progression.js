// Progression System Module
// Handles leveling, XP, and skill upgrades

import { SKILLS } from './skills.js';
import { SKILL_IDS } from '../config/skills.js';

// Skill upgrade options
export const SKILL_UPGRADES = {
  [SKILL_IDS.CLONE]: [
    {
      name: "Increased Duration",
      description: "Clones last 50% longer",
      levels: 3,
      effect: (level) => ({ durationMultiplier: 1 + (level * 0.5) })
    },
    {
      name: "Increased Damage",
      description: "Clones deal 25% more damage per level",
      levels: 3,
      effect: (level) => ({ damageMultiplier: 1 + (level * 0.25) })
    },
    {
      name: "More Clones",
      description: "Increase maximum clone count by 2 per level",
      levels: 3,
      effect: (level) => ({ maxCountBonus: level * 2 })
    }
  ],
  
  [SKILL_IDS.TURRET]: [
    {
      name: "Rapid Fire",
      description: "Turrets fire 20% faster per level",
      levels: 3,
      effect: (level) => ({ fireRateMultiplier: 1 - (level * 0.2) })
    },
    {
      name: "Extended Duration",
      description: "Turrets last 50% longer per level",
      levels: 3,
      effect: (level) => ({ durationMultiplier: 1 + (level * 0.5) })
    },
    {
      name: "Multi-Target",
      description: "Turrets can target 2 additional enemies per level",
      levels: 2,
      effect: (level) => ({ additionalTargets: level * 2 })
    }
  ],
  
  [SKILL_IDS.AIRSTRIKE]: [
    {
      name: "Carpet Bombing",
      description: "Airstrikes drop 50% more bombs per level",
      levels: 3,
      effect: (level) => ({ bombCountMultiplier: 1 + (level * 0.5) })
    },
    {
      name: "Increased Blast Radius",
      description: "Bomb blast radius increased by 25% per level",
      levels: 3,
      effect: (level) => ({ blastRadiusMultiplier: 1 + (level * 0.25) })
    },
    {
      name: "Reduced Cooldown",
      description: "Airstrike cooldown reduced by 20% per level",
      levels: 2,
      effect: (level) => ({ cooldownMultiplier: 1 - (level * 0.2) })
    }
  ],
  
  [SKILL_IDS.LASER]: [
    {
      name: "Increased Width",
      description: "Laser width increased by 30% per level",
      levels: 3,
      effect: (level) => ({ widthMultiplier: 1 + (level * 0.3) })
    },
    {
      name: "Increased Damage",
      description: "Laser deals 25% more damage per level",
      levels: 3,
      effect: (level) => ({ damageMultiplier: 1 + (level * 0.25) })
    },
    {
      name: "Extended Duration",
      description: "Laser lasts 30% longer per level",
      levels: 2,
      effect: (level) => ({ durationMultiplier: 1 + (level * 0.3) })
    }
  ],
  
  [SKILL_IDS.GBA]: [
    {
      name: "Character Health",
      description: "Summoned characters have 30% more health per level",
      levels: 3,
      effect: (level) => ({ healthMultiplier: 1 + (level * 0.3) })
    },
    {
      name: "Character Damage",
      description: "Summoned characters deal 25% more damage per level",
      levels: 3,
      effect: (level) => ({ damageMultiplier: 1 + (level * 0.25) })
    },
    {
      name: "Character Duration",
      description: "Summoned characters last 40% longer per level",
      levels: 2,
      effect: (level) => ({ durationMultiplier: 1 + (level * 0.4) })
    }
  ],
  
  [SKILL_IDS.GAS_LIGHTER]: [
    {
      name: "Fire Damage",
      description: "Fire skills deal 30% more damage per level",
      levels: 3,
      effect: (level) => ({ damageMultiplier: 1 + (level * 0.3) })
    },
    {
      name: "Fire Duration",
      description: "Fire skills last 40% longer per level",
      levels: 3,
      effect: (level) => ({ durationMultiplier: 1 + (level * 0.4) })
    },
    {
      name: "Fire Area",
      description: "Fire skills affect 25% larger area per level",
      levels: 2,
      effect: (level) => ({ areaMultiplier: 1 + (level * 0.25) })
    }
  ]
};

// Player stat upgrades
export const PLAYER_UPGRADES = [
  {
    name: "Max Health",
    description: "Increase maximum health by 10% per level",
    levels: 5,
    effect: (level) => ({ maxHealthMultiplier: 1 + (level * 0.1) })
  },
  {
    name: "Movement Speed",
    description: "Increase movement speed by 10% per level",
    levels: 3,
    effect: (level) => ({ speedMultiplier: 1 + (level * 0.1) })
  },
  {
    name: "Damage",
    description: "Increase weapon damage by 15% per level",
    levels: 3,
    effect: (level) => ({ damageMultiplier: 1 + (level * 0.15) })
  },
  {
    name: "Fire Rate",
    description: "Increase fire rate by 10% per level",
    levels: 3,
    effect: (level) => ({ fireRateMultiplier: 1 - (level * 0.1) })
  },
  {
    name: "XP Gain",
    description: "Gain 20% more XP per level",
    levels: 3,
    effect: (level) => ({ xpMultiplier: 1 + (level * 0.2) })
  }
];

// Initialize player's upgrade levels
export function initializeUpgrades() {
  const upgrades = {
    skills: {},
    player: {}
  };
  
  // Initialize skill upgrades
  Object.keys(SKILL_UPGRADES).forEach(skillName => {
    upgrades.skills[skillName] = {};
    
    SKILL_UPGRADES[skillName].forEach((upgrade, index) => {
      upgrades.skills[skillName][index] = 0; // Start at level 0 (not upgraded)
    });
  });
  
  // Initialize player upgrades
  PLAYER_UPGRADES.forEach((upgrade, index) => {
    upgrades.player[index] = 0; // Start at level 0 (not upgraded)
  });
  
  return upgrades;
}

// Apply all upgrades to get current stats
export function applyUpgrades(gameState) {
  const upgrades = gameState.upgrades;
  
  // Apply skill upgrades
  Object.keys(upgrades.skills).forEach(skillName => {
    const skillUpgrades = upgrades.skills[skillName];
    
    // For each upgrade path
    Object.keys(skillUpgrades).forEach(upgradeIndex => {
      const level = skillUpgrades[upgradeIndex];
      
      if (level > 0) {
        const upgradeEffect = SKILL_UPGRADES[skillName][upgradeIndex].effect(level);
        
        // Apply the effect to the skill
        applySkillUpgrade(gameState, skillName, upgradeEffect);
      }
    });
  });
  
  // Apply player upgrades
  Object.keys(upgrades.player).forEach(upgradeIndex => {
    const level = upgrades.player[upgradeIndex];
    
    if (level > 0) {
      const upgradeEffect = PLAYER_UPGRADES[upgradeIndex].effect(level);
      
      // Apply the effect to the player
      applyPlayerUpgrade(gameState, upgradeEffect);
    }
  });
}

// Apply a skill upgrade effect
function applySkillUpgrade(gameState, skillName, effect) {
  // Different effects for different skills
  switch(skillName) {
    case SKILL_IDS.CLONE:
      if (effect.durationMultiplier) {
        gameState.cloneDurationMultiplier = effect.durationMultiplier;
      }
      if (effect.damageMultiplier) {
        gameState.cloneDamageMultiplier = effect.damageMultiplier;
      }
      if (effect.maxCountBonus) {
        gameState.cloneMaxCountBonus = effect.maxCountBonus;
      }
      break;
      
    case SKILL_IDS.TURRET:
      if (effect.fireRateMultiplier) {
        gameState.turretFireRateMultiplier = effect.fireRateMultiplier;
      }
      if (effect.durationMultiplier) {
        gameState.turretDurationMultiplier = effect.durationMultiplier;
      }
      if (effect.additionalTargets) {
        gameState.turretAdditionalTargets = effect.additionalTargets;
      }
      break;
      
    case SKILL_IDS.AIRSTRIKE:
      if (effect.bombCountMultiplier) {
        gameState.airstrikeBombCountMultiplier = effect.bombCountMultiplier;
      }
      if (effect.blastRadiusMultiplier) {
        gameState.airstrikeBlastRadiusMultiplier = effect.blastRadiusMultiplier;
      }
      if (effect.cooldownMultiplier) {
        gameState.airstrikeCooldownMultiplier = effect.cooldownMultiplier;
      }
      break;
      
    case SKILL_IDS.LASER:
      if (effect.widthMultiplier) {
        gameState.laserWidthMultiplier = effect.widthMultiplier;
      }
      if (effect.damageMultiplier) {
        gameState.laserDamageMultiplier = effect.damageMultiplier;
      }
      if (effect.durationMultiplier) {
        gameState.laserDurationMultiplier = effect.durationMultiplier;
      }
      break;
      
    case SKILL_IDS.GBA:
      if (effect.healthMultiplier) {
        gameState.gbaHealthMultiplier = effect.healthMultiplier;
      }
      if (effect.damageMultiplier) {
        gameState.gbaDamageMultiplier = effect.damageMultiplier;
      }
      if (effect.durationMultiplier) {
        gameState.gbaDurationMultiplier = effect.durationMultiplier;
      }
      break;
      
    case SKILL_IDS.GAS_LIGHTER:
      if (effect.damageMultiplier) {
        gameState.gasLighterDamageMultiplier = effect.damageMultiplier;
      }
      if (effect.durationMultiplier) {
        gameState.gasLighterDurationMultiplier = effect.durationMultiplier;
      }
      if (effect.areaMultiplier) {
        gameState.gasLighterAreaMultiplier = effect.areaMultiplier;
      }
      break;
  }
}

// Apply a player upgrade effect
function applyPlayerUpgrade(gameState, effect) {
  if (effect.maxHealthMultiplier) {
    gameState.playerMaxHealthMultiplier = effect.maxHealthMultiplier;
  }
  if (effect.speedMultiplier) {
    gameState.playerSpeedMultiplier = effect.speedMultiplier;
  }
  if (effect.damageMultiplier) {
    gameState.playerDamageMultiplier = effect.damageMultiplier;
  }
  if (effect.fireRateMultiplier) {
    gameState.playerFireRateMultiplier = effect.fireRateMultiplier;
  }
  if (effect.xpMultiplier) {
    gameState.playerXpMultiplier = effect.xpMultiplier;
  }
}

// Award XP to the player
export function awardXP(gameState, amount) {
  // Apply XP multiplier if available
  const multiplier = gameState.playerXpMultiplier || 1.0;
  const xpGained = Math.floor(amount * multiplier);
  
  // Add XP
  gameState.xp += xpGained;
  
  // Check for level up
  checkLevelUp(gameState);
  
  return xpGained;
}

// Check if player has leveled up
export function checkLevelUp(gameState) {
  if (gameState.xp >= gameState.xpToNextLevel) {
    // Level up
    gameState.level++;
    gameState.xp -= gameState.xpToNextLevel;
    
    // Increase XP required for next level
    gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.2);
    
    // Award skill point
    gameState.skillPoints++;
    
    // Show level up message
    if (window.showMessage) {
      // window.showMessage(`Level Up! Now level ${gameState.level}`, 0);
    }
    
    // Show level up screen
    showLevelUpScreen(gameState);
    
    // Check for additional level ups
    if (gameState.xp >= gameState.xpToNextLevel) {
      checkLevelUp(gameState);
    }
    
    return true;
  }
  
  return false;
}

// Show level up screen
function showLevelUpScreen(gameState) {
  // This function should be implemented in the UI module
  // For now, we'll just log to console
  console.log(`Level Up! Player is now level ${gameState.level} with ${gameState.skillPoints} skill points`);
  
  // In a real implementation, this would pause the game and show a UI for spending skill points
  if (gameState.ui.levelUpScreen) {
    gameState.ui.levelUpScreen.style('display', 'flex');
    gameState.previousState = gameState.currentState;
    gameState.currentState = 'levelUp';
    noLoop();
  }
}

// Spend a skill point
export function spendSkillPoint(gameState, category, index, subIndex) {
  // Check if player has skill points
  if (gameState.skillPoints <= 0) {
    return false;
  }
  
  // Check if upgrade is valid
  if (category === 'skills') {
    const skillName = Object.keys(SKILL_UPGRADES)[index];
    const upgrade = SKILL_UPGRADES[skillName][subIndex];
    
    // Check if upgrade is already at max level
    if (gameState.upgrades.skills[skillName][subIndex] >= upgrade.levels) {
      return false;
    }
    
    // Apply upgrade
    gameState.upgrades.skills[skillName][subIndex]++;
  } else if (category === 'player') {
    const upgrade = PLAYER_UPGRADES[index];
    
    // Check if upgrade is already at max level
    if (gameState.upgrades.player[index] >= upgrade.levels) {
      return false;
    }
    
    // Apply upgrade
    gameState.upgrades.player[index]++;
  } else {
    return false;
  }
  
  // Spend skill point
  gameState.skillPoints--;
  
  // Apply all upgrades
  applyUpgrades(gameState);
  
  return true;
}

// Create a combo system
export function updateCombo(gameState) {
  // Decrease combo timer
  if (gameState.comboTimer > 0) {
    gameState.comboTimer--;
    
    // Reset combo if timer reaches zero
    if (gameState.comboTimer === 0 && gameState.combo > 0) {
      // Award XP based on max combo reached
      const comboXP = Math.floor(gameState.combo * 5);
      awardXP(gameState, comboXP);
      
      // Show combo end message
      if (window.showMessage) {
        // window.showMessage(`Combo x${gameState.combo} ended! +${comboXP} XP`, 0);
      }
      
      // Reset combo
      gameState.combo = 0;
    }
  }
}

// Increment combo when enemy is killed
export function incrementCombo(gameState) {
  // Increase combo
  gameState.combo++;
  
  // Update max combo if needed
  if (gameState.combo > gameState.maxCombo) {
    gameState.maxCombo = gameState.combo;
  }
  
  // Reset combo timer (3 seconds)
  gameState.comboTimer = 180;
  
  // Show combo message for significant combos
  if (gameState.combo >= 5 && gameState.combo % 5 === 0) {
    if (window.showMessage) {
      // window.showMessage(`Combo x${gameState.combo}!`, 0);
    }
  }
}