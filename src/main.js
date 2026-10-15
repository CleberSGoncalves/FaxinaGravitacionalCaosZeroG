/**
 * @fileoverview Main entry point for Faxina Gravitacional: Caos Zero-G!
 * Orchestrates CrazyGames SDK initialization, cinematic splash intro, HUD, and Game Engine.
 */

import crazyGames from './crazygames.js';
import CinematicIntro from './splash.js';
import GameHUD from './hud.js';
import GameEngine from './game.js';
import i18n from './i18n.js';
import './style.css';

/**
 * Bootstraps the application once DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize CrazyGames SDK v3
    await crazyGames.init();

    // 2. Resolve core DOM containers
    const appEl = document.getElementById('app');
    const stageEl = document.getElementById('game-stage');
    const gameCanvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('game-canvas'));

    if (!appEl || !stageEl || !gameCanvas) {
      console.error('[Main] Critical DOM elements missing: #app, #game-stage, or #game-canvas');
      return;
    }

    /** @type {GameEngine|null} */
    let engine = null;
    /** @type {GameHUD|null} */
    let hud = null;

    // 3. Instantiate Cinematic Intro sequence
    const intro = new CinematicIntro({
      container: stageEl,
      onComplete: () => {
        // Construct HUD with required game action callbacks
        hud = new GameHUD({
          container: stageEl,
          onRestart: () => {
            if (engine) {
              engine.restartLevel();
            }
          },
          onSelectLevel: (levelId) => {
            if (engine) {
              engine.loadLevel(levelId);
            }
          },
          onNextLevel: () => {
            if (engine) {
              engine.nextLevel();
            }
          },
          onTractorBeam: () => {
            if (engine) {
              engine.toggleTractorBeam();
            }
          },
          onGravityPulse: () => {
            if (engine) {
              engine.triggerGravityPulse();
            }
          }
        });

        // Initialize and launch physics game engine
        engine = new GameEngine(gameCanvas, hud);
        engine.start();

        // Signal gameplay start to CrazyGames analytics
        crazyGames.gameplayStart();
      }
    });

    // Start intro sequence
    intro.start();

    // Global focus & visibility management for audio and physics stability
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (engine && typeof engine.pause === 'function') {
          engine.pause();
        }
      } else {
        if (engine && typeof engine.resume === 'function') {
          engine.resume();
        }
      }
    });

    window.addEventListener('blur', () => {
      if (engine && typeof engine.pause === 'function') {
        engine.pause();
      }
    });

    window.addEventListener('focus', () => {
      if (engine && typeof engine.resume === 'function') {
        engine.resume();
      }
    });

  } catch (error) {
    console.error('[Main] Application bootstrap failed:', error);
  }
});
