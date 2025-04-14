/**
 * Skills System Module
 * 
 * This module handles all skill-related functionality including:
 * - Skill definitions and properties
 * - Skill state management (cooldowns, durations, etc.)
 * - Skill activation and deactivation
 * - Key mapping for skills
 * 
 * It uses the modular configuration structure from config/skills.js
 */

import { SkillConfig } from '../config.js';
// Destructure the skill configuration for easier access
const { SKILL_IDS, SKILL_KEYS, SKILLS: CONFIG_SKILLS } = SkillConfig;

/**
 * SKILLS object
 * 
 * Contains all skill definitions with their properties and key mappings.
 * This is created by combining the skill definitions from the config
 * with the key mappings.
 * 
 * Structure:
 * {
 *   SKILL_ID: {
 *     name: 'Skill Name',
 *     description: 'Skill description',
 *     cooldown: 60, // in frames
 *     duration: 300, // in frames (if applicable)
 *     key: 'a' // keyboard key to activate the skill
 *     // other skill-specific properties
 *   },
 *   // other skills...
 * }
 */
export const SKILLS = {};

// Populate the SKILLS object with data from the config
Object.keys(CONFIG_SKILLS).forEach(skillId => {
  // Find the key for this skill by looking for the skill ID in SKILL_KEYS values
  let keyName;
  Object.entries(SKILL_KEYS).forEach(([key, id]) => {
    if (id === skillId) {
      keyName = key;
    }
  });
  
  // Add the skill to the SKILLS object with its key mapping
  SKILLS[skillId] = {
    ...CONFIG_SKILLS[skillId],
    key: keyName
  };
});

/**
 * Initialize skill state for the game
 * 
 * Creates a new skill state object with default values for all skills.
 * This should be called once at the start of the game.
 * 
 * @returns {Object} The initialized skill state object
 */
export function initializeSkillState() {
  const skillState = {};
  
  // Initialize each skill with default state
  Object.keys(SKILLS).forEach(skillName => {
    skillState[skillName] = {
      cooldownRemaining: 0, // Current cooldown remaining in frames
      active: false,        // Whether the skill is currently active
      activeDuration: 0,    // How long the skill has been active
      endTime: 0,           // Frame count when the skill will end
      lastUsed: 0,          // Frame count when the skill was last used
      count: 0              // For skills that can have multiple instances
    };
  });
  
  return skillState;
}

/**
 * Check if a skill is available (not on cooldown)
 * 
 * @param {Object} skillState - The current skill state object
 * @param {string} skillName - The ID of the skill to check
 * @returns {boolean} True if the skill is available, false otherwise
 */
export function isSkillAvailable(skillState, skillName) {
  return skillState[skillName].cooldownRemaining <= 0;
}

/**
 * Activate a skill
 * 
 * Sets the skill on cooldown, marks it as active if it has a duration,
 * and increments the count for skills that can have multiple instances.
 * 
 * @param {Object} skillState - The current skill state object
 * @param {string} skillName - The ID of the skill to activate
 * @param {number} frameCount - The current frame count
 * @returns {Object} The updated skill state
 */
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
  if (skillName === SKILL_IDS.CLONE || skillName === SKILL_IDS.TURRET || 
      skillName === SKILL_IDS.GBA || skillName === SKILL_IDS.GAS_LIGHTER) {
    skillState[skillName].count++;
  }
  
  return skillState;
}

/**
 * Update skill states (call this every frame)
 * 
 * Decrements cooldowns and checks if active skills should end.
 * 
 * @param {Object} skillState - The current skill state object
 * @param {number} frameCount - The current frame count
 * @returns {Object} The updated skill state
 */
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

/**
 * Get remaining cooldown for UI display
 * 
 * @param {Object} skillState - The current skill state object
 * @param {string} skillName - The ID of the skill to check
 * @returns {number} The remaining cooldown in frames
 */
export function getSkillCooldown(skillState, skillName) {
  return skillState[skillName].cooldownRemaining;
}

/**
 * Get skill ID by key press
 * 
 * @param {string} key - The key that was pressed
 * @returns {string|null} The ID of the skill mapped to the key, or null if no skill is mapped
 */
export function getSkillByKey(key) {
  const lowerKey = key.toLowerCase();
  return SKILL_KEYS[lowerKey] || null;
}