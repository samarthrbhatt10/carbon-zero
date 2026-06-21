/**
 * @module storage
 * @description localStorage abstraction with schema versioning, error handling,
 * and serialization safety.
 *
 * Implements schema migration so old stored data is cleanly invalidated when
 * the data shape changes across app versions.
 *
 * No PII is stored by default — email is hashed before storage if provided.
 */

import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from '../utils/constants.js';

// ---------------------------------------------------------------------------
// Core read/write helpers
// ---------------------------------------------------------------------------

/**
 * Safely writes a value to localStorage as JSON.
 * Silently handles QuotaExceededError.
 * @param {string} key
 * @param {*} value
 */
export const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Storage quota exceeded or unavailable — degrade gracefully
    console.warn(`[storage] Failed to write "${key}":`, err.message);
  }
};

/**
 * Safely reads and parses a value from localStorage.
 * @param {string} key
 * @param {*} [defaultValue=null] - Returned if key is missing or parse fails
 * @returns {*}
 */
export const storageGet = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
export const storageRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently ignore
  }
};

/**
 * Clears all CarbonZero keys from localStorage (keys prefixed with 'cz_').
 */
export const storageClearAll = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('cz_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Silently ignore
  }
};

// ---------------------------------------------------------------------------
// Schema version management
// ---------------------------------------------------------------------------

/**
 * Checks if stored data schema matches current version.
 * If not, clears stale data and writes new version.
 */
export const ensureSchemaVersion = () => {
  const storedVersion = storageGet(STORAGE_KEYS.SCHEMA_VERSION, 0);
  if (storedVersion !== CURRENT_SCHEMA_VERSION) {
    storageClearAll();
    storageSet(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
  }
};

// ---------------------------------------------------------------------------
// Domain-specific accessors
// ---------------------------------------------------------------------------

/**
 * Saves the user's footprint calculation result.
 * @param {Object} footprintResult - Output from calcTotalFootprint()
 */
export const saveFootprint = (footprintResult) => {
  storageSet(STORAGE_KEYS.USER_FOOTPRINT, {
    ...footprintResult,
    savedAt: new Date().toISOString(),
  });
};

/**
 * Retrieves the saved footprint result.
 * @returns {Object|null}
 */
export const getFootprint = () => storageGet(STORAGE_KEYS.USER_FOOTPRINT, null);

/**
 * Saves the user's active action IDs list.
 * @param {string[]} actionIds
 */
export const saveUserActions = (actionIds) => {
  storageSet(STORAGE_KEYS.USER_ACTIONS, actionIds);
};

/**
 * Retrieves the user's active action IDs.
 * @returns {string[]}
 */
export const getUserActions = () => storageGet(STORAGE_KEYS.USER_ACTIONS, []);

/**
 * Saves the user's daily action log.
 * @param {Object} log - Map of dateKey → { actionId: boolean }
 */
export const saveDailyLog = (log) => storageSet(STORAGE_KEYS.DAILY_LOG, log);

/**
 * Retrieves the daily action log.
 * @returns {Object}
 */
export const getDailyLog = () => storageGet(STORAGE_KEYS.DAILY_LOG, {});

/**
 * Saves the current streak count.
 * @param {number} streak
 */
export const saveStreak = (streak) => storageSet(STORAGE_KEYS.STREAK, streak);

/**
 * Retrieves the current streak.
 * @returns {number}
 */
export const getStreak = () => storageGet(STORAGE_KEYS.STREAK, 0);

/**
 * Saves the user's earned badges.
 * @param {string[]} badgeIds
 */
export const saveBadges = (badgeIds) => storageSet(STORAGE_KEYS.BADGES, badgeIds);

/**
 * Retrieves the user's earned badge IDs.
 * @returns {string[]}
 */
export const getBadges = () => storageGet(STORAGE_KEYS.BADGES, []);

/**
 * Gets the current points total.
 * @returns {number}
 */
export const getPoints = () => storageGet(STORAGE_KEYS.POINTS, 0);

/**
 * Adds points to the running total.
 * @param {number} delta - Points to add
 * @returns {number} New total
 */
export const addPoints = (delta) => {
  const current = getPoints();
  const newTotal = current + delta;
  storageSet(STORAGE_KEYS.POINTS, newTotal);
  return newTotal;
};

// ---------------------------------------------------------------------------
// App Shell / Config accessors
// ---------------------------------------------------------------------------

export const saveSession = (session) => storageSet(STORAGE_KEYS.USER_SESSION, session);
export const getSession = () => storageGet(STORAGE_KEYS.USER_SESSION, null);
export const clearSession = () => storageRemove(STORAGE_KEYS.USER_SESSION);

export const saveTheme = (theme) => storageSet(STORAGE_KEYS.THEME_PREF, theme);
export const getTheme = () => storageGet(STORAGE_KEYS.THEME_PREF, 'system');

export const setOnboardingDone = () => storageSet(STORAGE_KEYS.ONBOARDING_DONE, true);
export const isOnboardingDone = () => storageGet(STORAGE_KEYS.ONBOARDING_DONE, false);

// ---------------------------------------------------------------------------
// Anonymous email hash (OWASP A04 — no PII stored in plaintext)
// ---------------------------------------------------------------------------

/**
 * Generates a simple, consistent hash of an email address.
 * Used only as a display identifier — not for authentication.
 * @param {string} email
 * @returns {Promise<string>} Hex hash string (first 8 chars)
 */
export const hashEmail = async (email) => {
  const msgBuffer = new TextEncoder().encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
};

export default {
  storageSet,
  storageGet,
  storageRemove,
  storageClearAll,
  ensureSchemaVersion,
  saveFootprint,
  getFootprint,
  saveUserActions,
  getUserActions,
  saveDailyLog,
  getDailyLog,
  saveStreak,
  getStreak,
  saveBadges,
  getBadges,
  getPoints,
  addPoints,
  saveSession,
  getSession,
  clearSession,
  saveTheme,
  getTheme,
  setOnboardingDone,
  isOnboardingDone,
  hashEmail,
};
