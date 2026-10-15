/**
 * @fileoverview LocalStorage persistence module for Faxina Gravitacional: Caos Zero-G!
 * Manages player progress, unlocked levels, star ratings, scores, currency, charges, and settings.
 */

export const STORAGE_KEY = 'faxina_gravitacional_zerog_v1';

/**
 * @typedef {Object} GameSettings
 * @property {number} masterVolume - Master audio volume (0.0 to 1.0)
 * @property {number} bgmVolume - Background music volume (0.0 to 1.0)
 * @property {number} sfxVolume - Sound effects volume (0.0 to 1.0)
 * @property {'low'|'medium'|'high'} graphicsQuality - Visual quality preset
 * @property {boolean} showTrajectory - Whether to render trajectory aim guide
 * @property {boolean} screenShake - Screen shake impulse effect toggle
 */

/**
 * @typedef {Object} GameSaveData
 * @property {number} unlockedLevel - Highest unlocked level index (1-based)
 * @property {Record<string|number, number>} levelStars - Stars earned per level { [levelId]: stars }
 * @property {Record<string|number, number>} levelScores - Best score achieved per level
 * @property {number} totalCoins - Collected space scrap currency / coins
 * @property {number} gravityCharges - Available special gravity pulse charges
 * @property {boolean} soundMuted - Audio mute status flag
 * @property {string|null} lang - Selected language code ('pt' | 'en' | null for auto-detect)
 * @property {GameSettings} settings - User preferences and audio settings
 */

/**
 * Default save structure
 * @type {GameSaveData}
 */
const DEFAULT_DATA = {
  unlockedLevel: 1,
  levelStars: {},
  levelScores: {},
  totalCoins: 0,
  gravityCharges: 3,
  soundMuted: false,
  lang: null,
  settings: {
    masterVolume: 0.85,
    bgmVolume: 0.4,
    sfxVolume: 0.9,
    graphicsQuality: 'high',
    showTrajectory: true,
    screenShake: true
  }
};

/**
 * Class managing all client-side persistent storage with fail-safe error handling.
 */
export class StorageManager {
  /**
   * Initializes StorageManager and loads saved state.
   */
  constructor() {
    /** @type {GameSaveData} */
    this.data = this.createDefaultData();
    this.load();
  }

  /**
   * Creates a fresh clone of the default data.
   * @returns {GameSaveData}
   */
  createDefaultData() {
    return {
      unlockedLevel: DEFAULT_DATA.unlockedLevel,
      levelStars: { ...DEFAULT_DATA.levelStars },
      levelScores: { ...DEFAULT_DATA.levelScores },
      totalCoins: DEFAULT_DATA.totalCoins,
      gravityCharges: DEFAULT_DATA.gravityCharges,
      soundMuted: DEFAULT_DATA.soundMuted,
      lang: DEFAULT_DATA.lang,
      settings: { ...DEFAULT_DATA.settings }
    };
  }

  /**
   * Loads saved state from localStorage with fallback to defaults.
   * @returns {boolean} True if data was successfully loaded, false otherwise.
   */
  load() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.save();
        return true;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.data = {
          unlockedLevel: typeof parsed.unlockedLevel === 'number' ? Math.max(1, parsed.unlockedLevel) : 1,
          levelStars: parsed.levelStars && typeof parsed.levelStars === 'object' ? parsed.levelStars : {},
          levelScores: parsed.levelScores && typeof parsed.levelScores === 'object' ? parsed.levelScores : {},
          totalCoins: typeof parsed.totalCoins === 'number' ? Math.max(0, parsed.totalCoins) : 0,
          gravityCharges: typeof parsed.gravityCharges === 'number' ? Math.max(0, parsed.gravityCharges) : 3,
          soundMuted: Boolean(parsed.soundMuted),
          lang: parsed.lang || null,
          settings: {
            masterVolume: typeof parsed.settings?.masterVolume === 'number' ? parsed.settings.masterVolume : DEFAULT_DATA.settings.masterVolume,
            bgmVolume: typeof parsed.settings?.bgmVolume === 'number' ? parsed.settings.bgmVolume : DEFAULT_DATA.settings.bgmVolume,
            sfxVolume: typeof parsed.settings?.sfxVolume === 'number' ? parsed.settings.sfxVolume : DEFAULT_DATA.settings.sfxVolume,
            graphicsQuality: parsed.settings?.graphicsQuality || DEFAULT_DATA.settings.graphicsQuality,
            showTrajectory: parsed.settings?.showTrajectory !== undefined ? Boolean(parsed.settings.showTrajectory) : DEFAULT_DATA.settings.showTrajectory,
            screenShake: parsed.settings?.screenShake !== undefined ? Boolean(parsed.settings.screenShake) : DEFAULT_DATA.settings.screenShake
          }
        };
        return true;
      }
    } catch (err) {
      console.warn('[StorageManager] Failed to load data from localStorage:', err);
    }
    return false;
  }

  /**
   * Saves current state to localStorage.
   * @returns {boolean} True if successfully persisted, false if quota exceeded or error occurred.
   */
  save() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const serialized = JSON.stringify(this.data);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.error('[StorageManager] Failed to persist data to localStorage:', err);
      return false;
    }
  }

  /**
   * Retrieves player settings.
   * @returns {GameSettings}
   */
  getSettings() {
    return { ...this.data.settings };
  }

  /**
   * Updates player settings and persists changes.
   * @param {Partial<GameSettings>} newSettings
   * @returns {GameSettings}
   */
  saveSettings(newSettings) {
    if (newSettings && typeof newSettings === 'object') {
      this.data.settings = {
        ...this.data.settings,
        ...newSettings
      };
      this.save();
    }
    return this.getSettings();
  }

  /**
   * Gets the highest unlocked level index.
   * @returns {number}
   */
  getUnlockedLevel() {
    return this.data.unlockedLevel || 1;
  }

  /**
   * Updates unlocked level index if higher than current.
   * @param {number} lvl
   * @returns {number} Current unlocked level
   */
  setUnlockedLevel(lvl) {
    const validLevel = Math.max(1, Math.floor(lvl));
    if (validLevel > this.data.unlockedLevel) {
      this.data.unlockedLevel = validLevel;
      this.save();
    }
    return this.data.unlockedLevel;
  }

  /**
   * Gets stars earned for a specific level.
   * @param {string|number} levelId
   * @returns {number} 0-3 stars
   */
  getLevelStars(levelId) {
    return this.data.levelStars[String(levelId)] || 0;
  }

  /**
   * Sets earned stars for a specific level if it exceeds current record.
   * @param {string|number} levelId
   * @param {number} stars - Stars earned (0 to 3)
   * @returns {number} Best stars for this level
   */
  setLevelStars(levelId, stars) {
    const key = String(levelId);
    const validStars = Math.min(3, Math.max(0, Math.floor(stars)));
    const current = this.data.levelStars[key] || 0;
    if (validStars > current) {
      this.data.levelStars[key] = validStars;
      this.save();
    }
    return this.data.levelStars[key];
  }

  /**
   * Gets the highest score achieved on a level.
   * @param {string|number} levelId
   * @returns {number}
   */
  getLevelScore(levelId) {
    return this.data.levelScores[String(levelId)] || 0;
  }

  /**
   * Sets the score for a level if it beats previous record.
   * @param {string|number} levelId
   * @param {number} score
   * @returns {number}
   */
  setLevelScore(levelId, score) {
    const key = String(levelId);
    const validScore = Math.max(0, Math.floor(score));
    const current = this.data.levelScores[key] || 0;
    if (validScore > current) {
      this.data.levelScores[key] = validScore;
      this.save();
    }
    return this.data.levelScores[key];
  }

  /**
   * Computes total stars earned across all levels.
   * @returns {number}
   */
  getTotalStars() {
    let total = 0;
    for (const key of Object.keys(this.data.levelStars)) {
      total += this.data.levelStars[key] || 0;
    }
    return total;
  }

  /**
   * Adds coins/scrap to player wallet.
   * @param {number} amount
   * @returns {number} New total coins
   */
  addCoins(amount) {
    const validAmount = Math.floor(amount);
    this.data.totalCoins = Math.max(0, (this.data.totalCoins || 0) + validAmount);
    this.save();
    return this.data.totalCoins;
  }

  /**
   * Gets total coins in wallet.
   * @returns {number}
   */
  getCoins() {
    return this.data.totalCoins || 0;
  }

  /**
   * Sets available gravity charges.
   * @param {number} charges
   * @returns {number}
   */
  setGravityCharges(charges) {
    this.data.gravityCharges = Math.max(0, Math.floor(charges));
    this.save();
    return this.data.gravityCharges;
  }

  /**
   * Gets available gravity charges.
   * @returns {number}
   */
  getGravityCharges() {
    return typeof this.data.gravityCharges === 'number' ? this.data.gravityCharges : 3;
  }

  /**
   * Resets all player progress to defaults.
   */
  clearAll() {
    this.data = this.createDefaultData();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[StorageManager] Failed to remove key from localStorage:', err);
    }
    this.save();
  }
}

export const storage = new StorageManager();
