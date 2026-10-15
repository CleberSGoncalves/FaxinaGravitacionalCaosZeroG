/**
 * @fileoverview CrazyGames SDK v3 Integration Bridge for Faxina Gravitacional: Caos Zero-G!
 * Implements strict compliance with CrazyGames publishing guidelines:
 * - Proper gameplayStart / gameplayStop lifecycle management
 * - Rewarded Ads with mandatory audio muting and gameplay pause
 * - Midgame Ads with 180s cooldown / 3-level pacing, strictly during logical breaks
 * - Error/AdBlocker handling (never reward on ad failure)
 * - Safe mock mode for local development without live SDK
 */

/**
 * @typedef {'revive' | 'double_rewards' | 'checkpoint'} RewardedAdType
 */

export class CrazyGamesBridge {
  constructor() {
    /** @type {any} */
    this.sdk = null;
    /** @type {boolean} */
    this.isInitialized = false;
    /** @type {boolean} */
    this.hasAdblock = false;
    /** @type {boolean} */
    this.inGameplay = false;
    /** @type {number} */
    this.lastMidgameTime = performance.now();
    /** @type {number} */
    this.levelsCompletedSinceLastAd = 0;
    /** @type {(() => void) | null} */
    this.onAdPauseCallback = null;
    /** @type {(() => void) | null} */
    this.onAdResumeCallback = null;
    /** @type {boolean} */
    this.isAudioMutedByAd = false;
  }

  /**
   * Registers global pause and resume callbacks to freeze game physics and mute audio during ads.
   * @param {() => void} onPause
   * @param {() => void} onResume
   */
  setAdCallbacks(onPause, onResume) {
    this.onAdPauseCallback = onPause;
    this.onAdResumeCallback = onResume;
  }

  /**
   * Initializes the CrazyGames SDK v3.
   * Handles SDK presence, asynchronous initialization, and AdBlocker detection.
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        if (typeof this.sdk.init === 'function') {
          await this.sdk.init();
        }
        this.isInitialized = true;
        this.hasAdblock = false;
        console.log('[CrazyGames] SDK v3 initialized successfully.');

        // Query platform settings if available
        try {
          if (this.sdk.game && this.sdk.game.settings) {
            console.log('[CrazyGames] Platform settings:', this.sdk.game.settings);
          }
        } catch (e) {
          // Non-critical platform setting read failure
        }
        return true;
      } else {
        console.warn('[CrazyGames] SDK v3 not detected in window (Local dev / fallback mode active).');
        this.isInitialized = false;
        return false;
      }
    } catch (err) {
      console.warn('[CrazyGames] SDK v3 initialization failed (likely AdBlock active):', err);
      this.hasAdblock = true;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Notifies CrazyGames that active gameplay has started.
   * Must be called when user enters active physics/chamber simulation.
   */
  gameplayStart() {
    if (this.inGameplay) return;
    this.inGameplay = true;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
        this.sdk.game.gameplayStart();
        console.log('[CrazyGames] Event gameplayStart dispatched.');
      }
    } catch (err) {
      console.debug('[CrazyGames] Error triggering gameplayStart:', err);
    }
  }

  /**
   * Notifies CrazyGames that active gameplay has stopped.
   * Must be called when opening menus, modals, level select, pause, victory, or game over.
   */
  gameplayStop() {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
        this.sdk.game.gameplayStop();
        console.log('[CrazyGames] Event gameplayStop dispatched.');
      }
    } catch (err) {
      console.debug('[CrazyGames] Error triggering gameplayStop:', err);
    }
  }

  /**
   * Notifies CrazyGames of a celebratory milestone (e.g. chamber cleaned, high combo).
   */
  happyTime() {
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.happytime === 'function') {
        this.sdk.game.happytime();
      } else if (this.sdk && this.sdk.game && typeof this.sdk.game.happyTime === 'function') {
        this.sdk.game.happyTime();
      }
    } catch (err) {
      console.debug('[CrazyGames] Error triggering happyTime:', err);
    }
  }

  /**
   * Requests a Rewarded Ad (video ad with player-opted reward).
   * Strict CrazyGames guidelines:
   * - Must freeze gameplay and mute audio before ad opens
   * - Must resume gameplay and restore audio when finished or errored
   * - MUST NEVER award the reward on error or AdBlock dismissal
   *
   * @param {RewardedAdType} rewardType - Type of reward requested
   * @param {() => void} onRewarded - Invoked ONLY if the video is watched completely
   * @param {(error?: any) => void} [onError] - Invoked if closed early, blocked, or failed
   */
  async requestRewardedAd(rewardType, onRewarded, onError) {
    console.log(`[CrazyGames] Requesting Rewarded Ad for: ${rewardType}`);

    // Pause physics and mute audio before ad begins
    if (this.onAdPauseCallback) this.onAdPauseCallback();
    this.gameplayStop();

    if (this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log('[CrazyGames] Rewarded Ad started.');
            if (this.onAdPauseCallback) this.onAdPauseCallback();
          },
          adFinished: () => {
            console.log('[CrazyGames] Rewarded Ad finished successfully.');
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onRewarded) onRewarded();
          },
          adError: (err) => {
            console.warn('[CrazyGames] Rewarded Ad error / blocked by AdBlock:', err);
            // STRICT CRAZYGAMES RULE: Never give reward on error or AdBlock!
            if (this.onAdResumeCallback) this.onAdResumeCallback();
            if (onError) onError(err);
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] Exception requesting Rewarded Ad:', err);
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onError) onError(err);
      }
    } else {
      // Mock mode for local dev environment
      console.log('[CrazyGames MOCK] Dev environment without SDK. Simulating Rewarded Ad prompt...');
      const userApproved = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`[CrazyGames Mock Mode]\nRewarded Ad requested: "${rewardType}".\n\nSimulate successful ad view to grant reward?`)
        : true;

      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (userApproved) {
        if (onRewarded) onRewarded();
      } else {
        if (onError) onError('ad_dismissed');
      }
    }
  }

  /**
   * Requests a Midgame Ad (interstitial video ad).
   * Guidelines:
   * - Triggered only during logical pauses (between chambers, victory/failure screens)
   * - Never during active zero-g movement
   * - Cooldown of 180 seconds OR at least 3 levels completed
   *
   * @param {() => void} [onFinished] - Callback invoked when ad finishes or is bypassed
   */
  async requestMidgameAd(onFinished) {
    const now = performance.now();
    const timeSinceLastAd = (now - this.lastMidgameTime) / 1000;
    this.levelsCompletedSinceLastAd++;

    const shouldTrigger = timeSinceLastAd >= 180 || this.levelsCompletedSinceLastAd >= 3;

    if (!shouldTrigger) {
      if (onFinished) onFinished();
      return;
    }

    console.log(`[CrazyGames] Requesting Midgame Ad (${Math.round(timeSinceLastAd)}s elapsed, ${this.levelsCompletedSinceLastAd} levels)...`);
    if (this.onAdPauseCallback) this.onAdPauseCallback();
    this.gameplayStop();

    const conclude = () => {
      this.lastMidgameTime = performance.now();
      this.levelsCompletedSinceLastAd = 0;
      if (this.onAdResumeCallback) this.onAdResumeCallback();
      if (onFinished) onFinished();
    };

    if (this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            console.log('[CrazyGames] Midgame Ad started.');
            if (this.onAdPauseCallback) this.onAdPauseCallback();
          },
          adFinished: () => {
            console.log('[CrazyGames] Midgame Ad finished.');
            conclude();
          },
          adError: (err) => {
            console.warn('[CrazyGames] Midgame Ad error / adblock:', err);
            conclude();
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] Exception requesting Midgame Ad:', err);
        conclude();
      }
    } else {
      console.log('[CrazyGames MOCK] Midgame Ad bypassed instantly in dev environment.');
      conclude();
    }
  }
}

export const crazyGames = new CrazyGamesBridge();
export default crazyGames;
