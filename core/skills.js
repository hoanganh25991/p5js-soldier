// Skills System Module
// Defines skill enums, configurations, and key mappings

import CONFIG from '../../config.js';

// Skill name enum - maps keys to skill names
export const SKILL_NAMES = {
  CLONE: 'clone',
  TURRET: 'turret',
  AIRSTRIKE: 'airstrike',
  LASER: 'laser',
  GBA: 'game-boy-advanced',
  GAS_LIGHTER: 'gas-lighter'
};

// Key mapping - maps keyboard keys to skills
export const SKILL_KEYS = {
  [SKILL_NAMES.CLONE]: 'c',
  [SKILL_NAMES.TURRET]: 't',
  [SKILL_NAMES.AIRSTRIKE]: 'a',
  [SKILL_NAMES.LASER]: 'l',
  [SKILL_NAMES.GBA]: 'g',
  [SKILL_NAMES.GAS_LIGHTER]: 'f'
};

// Skill definitions with all properties
export const SKILLS = {
  [SKILL_NAMES.CLONE]: {
    name: 'Clone',
    description: 'Creates a clone that fights alongside you',
    cooldown: CONFIG.CLONE.COOLDOWN,
    duration: CONFIG.CLONE.DURATION,
    key: SKILL_KEYS[SKILL_NAMES.CLONE],
    maxCount: CONFIG.CLONE.MAX_CLONES
  },
  [SKILL_NAMES.TURRET]: {
    name: 'Turret',
    description: 'Deploys an auto-targeting turret',
    cooldown: CONFIG.TURRET.COOLDOWN,
    duration: CONFIG.TURRET.DURATION,
    key: SKILL_KEYS[SKILL_NAMES.TURRET]
  },
  [SKILL_NAMES.AIRSTRIKE]: {
    name: 'Airstrike',
    description: 'Calls in an airstrike that bombs enemies',
    cooldown: CONFIG.AIRSTRIKE.COOLDOWN,
    key: SKILL_KEYS[SKILL_NAMES.AIRSTRIKE]
  },
  [SKILL_NAMES.LASER]: {
    name: 'Laser',
    description: 'Fires a powerful laser beam',
    cooldown: CONFIG.LASER.COOLDOWN,
    duration: CONFIG.LASER.DURATION,
    key: SKILL_KEYS[SKILL_NAMES.LASER]
  },
  [SKILL_NAMES.GBA]: {
    name: 'Game Boy Advanced',
    description: 'Throws a GBA that summons random game characters',
    cooldown: CONFIG.GBA.COOLDOWN,
    duration: CONFIG.GBA.CHARACTER_DURATION,
    key: SKILL_KEYS[SKILL_NAMES.GBA]
  },
  [SKILL_NAMES.GAS_LIGHTER]: {
    name: 'Gas Lighter',
    description: 'Throws a Gas Lighter that casts random fire skills',
    cooldown: CONFIG.GAS_LIGHTER.COOLDOWN,
    duration: CONFIG.GAS_LIGHTER.FIRE_SKILL_DURATION,
    key: SKILL_KEYS[SKILL_NAMES.GAS_LIGHTER]
  }
};

// Initialize skill state for the game
export function initializeSkillState() {
  const skillState = {};
  
  // Initialize each skill with default state
  Object.keys(SKILLS).forEach(skillName => {
    skillState[skillName] = {
      cooldownRemaining: 0,
      active: false,
      activeDuration: 0,
      endTime: 0,
      lastUsed: 0,
      count: 0 // For skills that can have multiple instances
    };
  });
  
  return skillState;
}

// Check if a skill is available (not on cooldown)
export function isSkillAvailable(skillState, skillName) {
  return skillState[skillName].cooldownRemaining <= 0;
}

// Activate a skill
export function activateSkill(skillState, skillName, frameCount) {
  const skill = SKILLS[skillName];
  
  // Set cooldown
  skillState[skillName].cooldownRemaining = skill.cooldown;
  skillState[skillName].lastUsed = frameCount;
  
  // For skills with duration
  if (skill.duration) {
    skillState[skillName].active = true;
    skillState[skillName].activeDuration = skill.duration;
    skillState[skillName].endTime = frameCount + skill.duration;
  }
  
  // For skills with count (like clones)
  if (skillName === SKILL_NAMES.CLONE || skillName === SKILL_NAMES.TURRET || 
      skillName === SKILL_NAMES.GBA || skillName === SKILL_NAMES.GAS_LIGHTER) {
    skillState[skillName].count++;
  }
  
  return skillState;
}

// Update skill states (call this every frame)
export function updateSkillStates(skillState, frameCount) {
  Object.keys(skillState).forEach(skillName => {
    const state = skillState[skillName];
    
    // Update cooldowns
    if (state.cooldownRemaining > 0) {
      state.cooldownRemaining--;
    }
    
    // Check if active skills should end
    if (state.active && frameCount >= state.endTime) {
      state.active = false;
      state.activeDuration = 0;
    }
  });
  
  return skillState;
}

// Get remaining cooldown for UI display
export function getSkillCooldown(skillState, skillName) {
  return skillState[skillName].cooldownRemaining;
}

// Get skill by key press
export function getSkillByKey(key) {
  const lowerKey = key.toLowerCase();
  
  for (const skillName in SKILL_KEYS) {
    if (SKILL_KEYS[skillName] === lowerKey) {
      return skillName;
    }
  }
  
  return null;
}