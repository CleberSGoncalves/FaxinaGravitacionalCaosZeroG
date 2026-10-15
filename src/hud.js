/**
 * @fileoverview Complete HUD (Heads-Up Display) and UI Modal System for Faxina Gravitacional: Caos Zero-G!
 * 
 * Features:
 * - Top navigation bar: Chamber/Level badge, Sector info, Attempts (hearts), Stars, Timer, Score, and control buttons
 * - Bottom status bar: Gravity Charge meter, Trash disposal tracker, and Dynamic Health bar
 * - Touch Controls: Virtual joystick zone for mobile maneuvering + Action buttons (Tractor Beam, Gravity Pulse, Magnetic Hands)
 * - Complete Modals:
 *     1. Chamber / Level Select Modal with reactive cards grid, sector badges, stars, and lock states
 *     2. Victory Modal with celebration star pop animations, stats, and CrazyGames 2x Rewarded Ad
 *     3. Game Over / Station Breach Modal with hazard styling and equal-visibility Rewarded Ad Revive
 *     4. Settings Modal with real-time audio sliders, mute toggle, graphics presets, trajectory, shake, and bilingual language switch
 *     5. Pause Overlay with sci-fi blur and quick actions
 *     6. Non-intrusive floating Hint Toast with auto-dismiss
 * - CrazyGames SDK v3 full compliance (gameplayStart/gameplayStop on modal transitions, ad mute/unmute, ad pause/resume)
 * - Full EN/PT-BR real-time reactive localization
 */

import { i18n } from './i18n.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';
import { LEVELS } from './levels.js';

/**
 * Fallback levels definition in case LEVELS array is empty or loading
 */
const DEFAULT_LEVELS = [
  { id: 1, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção', color: '#00f5ff', hintEn: 'Use thrusters to maneuver and push loose debris into the incinerator.', hintPt: 'Use os propulsores para manobrar e empurrar os detritos no incinerador.' },
  { id: 2, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção', color: '#00f5ff', hintEn: 'Click & hold to activate Tractor Beam and pull objects toward you.', hintPt: 'Clique e segure para ativar o Feixe de Tração e puxar objetos.' },
  { id: 3, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção', color: '#00f5ff', hintEn: 'Watch out for station walls! Collisions reduce hull integrity.', hintPt: 'Cuidado com as paredes! Colisões reduzem a integridade do traje.' },
  { id: 4, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção', color: '#00f5ff', hintEn: 'Collect scrap containers to earn bonus stars.', hintPt: 'Colete contêineres de sucata para ganhar estrelas bônus.' },
  { id: 5, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção', color: '#00f5ff', hintEn: 'Press Space to release a Gravity Pulse and blast debris away!', hintPt: 'Pressione Espaço para soltar um Pulso de Gravidade e afastar detritos!' },
  { id: 6, sector: 'Reactor Core', sectorPt: 'Núcleo do Reator', color: '#fbbf24', hintEn: 'Radioactive barrels are unstable! Transport them carefully.', hintPt: 'Barris radioativos são instáveis! Transporte-os com muito cuidado.' },
  { id: 7, sector: 'Reactor Core', sectorPt: 'Núcleo do Reator', color: '#fbbf24', hintEn: 'Magnetic hands can grab heavy rods. Press Shift to grip.', hintPt: 'Mãos magnéticas agarram hastes pesadas. Pressione Shift para segurar.' },
  { id: 8, sector: 'Reactor Core', sectorPt: 'Núcleo do Reator', color: '#fbbf24', hintEn: 'Coolant leaks reverse thruster inertia. Compensate with reverse thrust.', hintPt: 'Vazamentos de refrigerante invertem a inércia. Compense com ré.' },
  { id: 9, sector: 'Reactor Core', sectorPt: 'Núcleo do Reator', color: '#fbbf24', hintEn: 'Align core fuel cells before the containment shield overheats.', hintPt: 'Alinhe as células de combustível antes do escudo superaquecer.' },
  { id: 10, sector: 'Reactor Core', sectorPt: 'Núcleo do Reator', color: '#fbbf24', hintEn: 'Massive radiation surge! Clear all volatile cores quickly!', hintPt: 'Pico de radiação! Limpe todos os núcleos voláteis rapidamente!' },
  { id: 11, sector: 'Bio-Dome', sectorPt: 'Bio-Domo', color: '#10b981', hintEn: 'Floating hydroponic pods bounce elastically. Use them as trampolines.', hintPt: 'Cápsulas hidropônicas quicam bastante. Use-as como trampolins.' },
  { id: 12, sector: 'Bio-Dome', sectorPt: 'Bio-Domo', color: '#10b981', hintEn: 'Bio-waste sticks to surfaces. Use the Tractor Beam to peel it off.', hintPt: 'Resíduos biológicos grudam nas superfícies. Puxe com o Feixe.' },
  { id: 13, sector: 'Bio-Dome', sectorPt: 'Bio-Domo', color: '#10b981', hintEn: 'Air ventilation draft pushes objects toward the intake vents.', hintPt: 'A corrente de ventilação empurra objetos para os dutos.' },
  { id: 14, sector: 'Bio-Dome', sectorPt: 'Bio-Domo', color: '#10b981', hintEn: 'Disarm spores before disposing into containment tubes.', hintPt: 'Desarme os esporos antes de jogá-los nos tubos de contenção.' },
  { id: 15, sector: 'Bio-Dome', sectorPt: 'Bio-Domo', color: '#10b981', hintEn: 'Massive overgrown vine blockage. Clear debris to reopen the hatch.', hintPt: 'Bloqueio denso de vinhas. Remova os detritos para reabrir a escotilha.' },
  { id: 16, sector: 'Gravity Core', sectorPt: 'Núcleo Gravitacional', color: '#a855f7', hintEn: 'The core gravity pulse oscillates periodically. Time your burns.', hintPt: 'O pulso de gravidade oscila periodicamente. Calcule seus impulsos.' },
  { id: 17, sector: 'Gravity Core', sectorPt: 'Núcleo Gravitacional', color: '#a855f7', hintEn: 'Micro black-holes attract all loose debris. Keep your distance!', hintPt: 'Micro buracos-negros atraem detritos soltos. Mantenha distância!' },
  { id: 18, sector: 'Gravity Core', sectorPt: 'Núcleo Gravitacional', color: '#a855f7', hintEn: 'Repulsor gates bounce heavy mass. Guide volatile junk through.', hintPt: 'Portões repulsores repelem massa pesada. Guie o lixo volátil.' },
  { id: 19, sector: 'Gravity Core', sectorPt: 'Núcleo Gravitacional', color: '#a855f7', hintEn: 'Zero-G vortex spin! Maintain stabilization thrusters.', hintPt: 'Vórtice giratório de gravidade zero! Firme os propulsores.' },
  { id: 20, sector: 'Gravity Core', sectorPt: 'Núcleo Gravitacional', color: '#a855f7', hintEn: 'Final Meltdown! Stabilize the station gravitational core!', hintPt: 'Colapso Final! Estabilize o núcleo gravitacional da estação!' }
];

/**
 * @typedef {Object} HUDCallbacks
 * @property {() => void} [onRestart] - Restart current level
 * @property {(levelId: number) => void} [onSelectLevel] - Load specified level
 * @property {() => void} [onNextLevel] - Advance to next level
 * @property {(isActive: boolean) => void} [onTractorBeam] - Toggle tractor beam state
 * @property {() => void} [onGravityPulse] - Activate gravity pulse explosion
 * @property {(isGrabbing: boolean) => void} [onMagneticGrab] - Toggle magnetic hands grip
 * @property {() => void} [onPause] - Pause gameplay
 * @property {() => void} [onResume] - Resume gameplay
 * @property {(vector: {x: number, y: number}) => void} [onMove] - Touch joystick directional vector
 */

/**
 * GameHUD orchestrates all DOM overlays, counters, bars, touch controls, and modal dialogues.
 */
export class GameHUD {
  /**
   * Initializes GameHUD with container and action callbacks.
   * Supports both (containerEl, callbacks) and ({ container, onRestart, ... }) call styles.
   * @param {HTMLElement|Object} containerOrOptions
   * @param {HUDCallbacks} [maybeCallbacks]
   */
  constructor(containerOrOptions, maybeCallbacks) {
    if (containerOrOptions && (containerOrOptions instanceof HTMLElement || containerOrOptions.nodeType === 1)) {
      this.container = containerOrOptions;
      this.cb = maybeCallbacks || {};
    } else if (containerOrOptions && typeof containerOrOptions === 'object') {
      this.container = containerOrOptions.container || document.getElementById('game-stage') || document.getElementById('app') || document.body;
      this.cb = containerOrOptions;
    } else {
      this.container = document.getElementById('game-stage') || document.getElementById('app') || document.body;
      this.cb = maybeCallbacks || {};
    }

    // State Variables
    this.attempts = 3;
    this.maxAttempts = 3;
    this.starsCount = 0;
    this.gravityCharge = 100; // 0 to 100
    this.timer = 0;
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.trashDisposed = 0;
    this.totalTrash = 0;
    this.isPaused = false;
    this.isTractorBeamActive = false;
    this.isMagneticActive = false;
    this.activeModal = null;
    this.hintTimer = null;

    // Resolve initial level object
    const allLevels = this.getLevelsList();
    this.currentLevel = allLevels[0] || DEFAULT_LEVELS[0];

    // Build complete DOM tree
    this.initDOM();

    // Register real-time localization listener
    this.onLocaleChanged = () => this.refreshTexts();
    if (typeof window !== 'undefined') {
      window.addEventListener('locale-changed', this.onLocaleChanged);
    }
    if (i18n && typeof i18n.onChange === 'function') {
      i18n.onChange(this.onLocaleChanged);
    }

    // Sync audio button to current mute state
    this.updateMuteButtonVisual();
  }

  /**
   * Safe getter for levels list from levels.js or fallback.
   * @returns {Array<any>}
   */
  getLevelsList() {
    if (typeof LEVELS !== 'undefined' && Array.isArray(LEVELS) && LEVELS.length > 0) {
      return LEVELS;
    }
    return DEFAULT_LEVELS;
  }

  /**
   * Constructs all DOM elements for HUD top/bottom bars, touch controls, and modals.
   */
  initDOM() {
    // 0. Remove any stale HUD container if re-instantiated
    const staleHud = this.container.querySelector('.hud-container');
    if (staleHud) staleHud.remove();

    // Root HUD Wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'hud-container';

    // Decorative Station Scanline and Vignette Overlays
    this.scanlineFx = document.createElement('div');
    this.scanlineFx.className = 'hud-scanline-fx';
    this.vignetteFx = document.createElement('div');
    this.vignetteFx.className = 'hud-vignette-fx';
    this.wrapper.appendChild(this.scanlineFx);
    this.wrapper.appendChild(this.vignetteFx);

    // =========================================================================
    // 1. TOP BAR (.hud-top-bar)
    // =========================================================================
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-top-bar';

    // --- LEFT BLOCK: Level badge & Attempts (Hearts) ---
    const leftBlock = document.createElement('div');
    leftBlock.className = 'hud-block-left';

    this.levelBadge = document.createElement('div');
    this.levelBadge.className = 'hud-level-badge';
    this.levelBadge.title = 'Level Info / Tip';
    this.levelBadge.innerHTML = `
      <span class="hud-level-icon">🛸</span>
      <span class="hud-level-badge-number" id="hud-level-badge-text">${i18n.t('level')} 1</span>
      <span class="hud-sector-subtitle" id="hud-sector-badge-text" style="font-size: 0.75rem; opacity: 0.85; margin-left: 4px;"></span>
    `;
    this.levelBadge.addEventListener('click', () => {
      const lang = i18n.getLang();
      const hint = lang === 'pt-BR'
        ? (this.currentLevel.hintPt || this.currentLevel.hint || '')
        : (this.currentLevel.hintEn || this.currentLevel.hint || '');
      if (hint) this.showHint(hint);
    });
    leftBlock.appendChild(this.levelBadge);

    this.attemptsBox = document.createElement('div');
    this.attemptsBox.className = 'hud-attempts-box';
    this.attemptsBox.title = i18n.t('attempts');
    leftBlock.appendChild(this.attemptsBox);
    this.updateAttemptsVisual();

    this.topBar.appendChild(leftBlock);

    // --- CENTER BLOCK: Stars, Timer, Score ---
    const centerBlock = document.createElement('div');
    centerBlock.className = 'hud-block-center';

    this.starsBox = document.createElement('div');
    this.starsBox.className = 'hud-stars-box';
    this.starsBox.title = i18n.t('stars');
    this.starsBox.innerHTML = `
      <svg class="hud-stars-icon" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      <span class="hud-stars-count" id="hud-stars-count">0/3</span>
    `;
    centerBlock.appendChild(this.starsBox);

    this.timerBox = document.createElement('div');
    this.timerBox.className = 'hud-coins-box';
    this.timerBox.title = i18n.t('timer');
    this.timerBox.innerHTML = `
      <span style="font-size: 1rem;">⏱️</span>
      <span class="hud-coins-count" id="hud-timer-val">00:00</span>
    `;
    centerBlock.appendChild(this.timerBox);

    this.scoreBox = document.createElement('div');
    this.scoreBox.className = 'hud-coins-box';
    this.scoreBox.title = i18n.t('score');
    this.scoreBox.innerHTML = `
      <svg class="hud-coins-icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V18h-2v-1.07A4.2 4.2 0 0 1 8 13.1l1.86-.54a2.38 2.38 0 0 0 2.14 1.74c.9 0 1.5-.47 1.5-1.15 0-.75-.63-1.08-1.78-1.55C10.23 11 8.5 10.23 8.5 8.43a3.64 3.64 0 0 1 2.5-3.41V4h2v1a4 4 0 0 1 2.8 3.5l-1.84.53A2.12 2.12 0 0 0 12 7.37c-.82 0-1.4.45-1.4 1 0 .66.57 1 1.7 1.44 1.63.66 3.2 1.48 3.2 3.32a3.62 3.62 0 0 1-2.5 3.8z"/></svg>
      <span class="hud-coins-count" id="hud-score-val">0</span>
    `;
    centerBlock.appendChild(this.scoreBox);

    this.topBar.appendChild(centerBlock);

    // --- RIGHT BLOCK: Control Buttons ---
    const rightBlock = document.createElement('div');
    rightBlock.className = 'hud-block-right';

    // Restart Button
    this.btnRestart = document.createElement('button');
    this.btnRestart.className = 'hud-icon-btn';
    this.btnRestart.id = 'hud-btn-restart';
    this.btnRestart.title = i18n.t('restart');
    this.btnRestart.innerHTML = '🔄';
    this.btnRestart.addEventListener('click', () => {
      this.playSfxClick();
      if (this.cb.onRestart) this.cb.onRestart();
    });
    rightBlock.appendChild(this.btnRestart);

    // Levels Grid Button
    this.btnLevels = document.createElement('button');
    this.btnLevels.className = 'hud-icon-btn';
    this.btnLevels.id = 'hud-btn-levels';
    this.btnLevels.title = i18n.t('menu');
    this.btnLevels.innerHTML = '📋';
    this.btnLevels.addEventListener('click', () => {
      this.playSfxClick();
      this.showLevelSelect();
    });
    rightBlock.appendChild(this.btnLevels);

    // Pause Button
    this.btnPause = document.createElement('button');
    this.btnPause.className = 'hud-icon-btn';
    this.btnPause.id = 'hud-btn-pause';
    this.btnPause.title = i18n.t('paused');
    this.btnPause.innerHTML = '⏸️';
    this.btnPause.addEventListener('click', () => {
      this.playSfxClick();
      this.togglePause();
    });
    rightBlock.appendChild(this.btnPause);

    // Mute Audio Toggle Button
    this.btnMute = document.createElement('button');
    this.btnMute.className = 'hud-icon-btn';
    this.btnMute.id = 'hud-btn-mute';
    this.btnMute.title = i18n.t('settings_mute_all');
    this.btnMute.innerHTML = '🔊';
    this.btnMute.addEventListener('click', () => {
      const isMuted = sound?.toggleMute ? sound.toggleMute() : false;
      this.updateMuteButtonVisual(isMuted);
    });
    rightBlock.appendChild(this.btnMute);

    // Language Toggle (🇧🇷 / 🇺🇸)
    this.btnLang = document.createElement('button');
    this.btnLang.className = 'hud-icon-btn';
    this.btnLang.id = 'hud-btn-lang';
    this.btnLang.title = i18n.t('settings_lang');
    this.btnLang.innerHTML = i18n.getLang() === 'pt-BR' ? '🇧🇷' : '🇺🇸';
    this.btnLang.addEventListener('click', () => {
      this.playSfxClick();
      i18n.toggleLocale();
      this.btnLang.innerHTML = i18n.getLang() === 'pt-BR' ? '🇧🇷' : '🇺🇸';
      this.refreshTexts();
    });
    rightBlock.appendChild(this.btnLang);

    // Settings Modal Button
    this.btnSettings = document.createElement('button');
    this.btnSettings.className = 'hud-icon-btn';
    this.btnSettings.id = 'hud-btn-settings';
    this.btnSettings.title = i18n.t('settings');
    this.btnSettings.innerHTML = '⚙️';
    this.btnSettings.addEventListener('click', () => {
      this.playSfxClick();
      this.showSettings();
    });
    rightBlock.appendChild(this.btnSettings);

    this.topBar.appendChild(rightBlock);
    this.wrapper.appendChild(this.topBar);

    // =========================================================================
    // 2. BOTTOM BAR (.hud-bottom-bar)
    // =========================================================================
    this.bottomBar = document.createElement('div');
    this.bottomBar.className = 'hud-bottom-bar';

    // --- BOTTOM LEFT: Gravity Meter + Trash Counter ---
    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'hud-block-left';
    bottomLeft.style.flexDirection = 'column';
    bottomLeft.style.alignItems = 'flex-start';
    bottomLeft.style.gap = '8px';
    bottomLeft.style.pointerEvents = 'auto';

    // Gravity Power Charge Meter
    this.gravityBox = document.createElement('div');
    this.gravityBox.className = 'hud-gravity-box';
    this.gravityBox.title = i18n.t('gravity_ready');
    this.gravityBox.innerHTML = `
      <div class="hud-gravity-header">
        <span class="hud-gravity-label" id="hud-gravity-label-text">${i18n.t('gravity_charge')}</span>
        <span class="hud-gravity-value" id="hud-gravity-val-text">100%</span>
      </div>
      <div class="hud-gravity-track">
        <div class="hud-gravity-fill" id="hud-gravity-fill-bar" style="width: 100%;"></div>
      </div>
    `;
    this.gravityBox.addEventListener('click', () => {
      if (this.gravityCharge >= 100) {
        if (this.cb.onGravityPulse) this.cb.onGravityPulse();
      }
    });
    bottomLeft.appendChild(this.gravityBox);

    // Trash / Debris Disposed Counter
    this.trashBox = document.createElement('div');
    this.trashBox.className = 'hud-coins-box';
    this.trashBox.title = i18n.t('trash_disposed');
    this.trashBox.innerHTML = `
      <span style="font-size: 1.1rem;">🧹</span>
      <span style="font-family: var(--font-scifi); font-size: 0.85rem; color: var(--color-alloy-300);" id="hud-trash-label">${i18n.t('trash_disposed_hud')}:</span>
      <span class="hud-coins-count" id="hud-trash-val" style="color: var(--color-cyan-bright);">0 / 0</span>
    `;
    bottomLeft.appendChild(this.trashBox);

    this.bottomBar.appendChild(bottomLeft);

    // --- BOTTOM CENTER: Action Buttons (Tractor, Pulse, Grab) ---
    this.abilityGroup = document.createElement('div');
    this.abilityGroup.className = 'hud-ability-group';

    // Tractor Beam Button
    this.btnTractor = document.createElement('div');
    this.btnTractor.className = 'hud-ability-wrapper';
    this.btnTractor.innerHTML = `
      <button class="hud-ability-btn" id="hud-btn-tractor" title="${i18n.t('tractor_beam')}">
        <span style="font-size: 1.8rem;">🧲</span>
      </button>
      <span class="hud-ability-label" id="hud-lbl-tractor">${i18n.t('tractor_beam')}</span>
    `;
    this.btnTractor.querySelector('button').addEventListener('click', () => {
      this.isTractorBeamActive = !this.isTractorBeamActive;
      const btn = this.btnTractor.querySelector('button');
      btn.classList.toggle('is-active', this.isTractorBeamActive);
      if (this.cb.onTractorBeam) this.cb.onTractorBeam(this.isTractorBeamActive);
    });
    this.abilityGroup.appendChild(this.btnTractor);

    // Gravity Pulse Button
    this.btnPulse = document.createElement('div');
    this.btnPulse.className = 'hud-ability-wrapper';
    this.btnPulse.innerHTML = `
      <button class="hud-ability-btn is-active" id="hud-btn-pulse" title="${i18n.t('gravity_ready')}">
        <span style="font-size: 1.8rem;">💥</span>
        <div class="hud-ability-badge" id="hud-pulse-badge">1</div>
      </button>
      <span class="hud-ability-label" id="hud-lbl-pulse">Pulse</span>
    `;
    this.btnPulse.querySelector('button').addEventListener('click', () => {
      if (this.gravityCharge >= 100) {
        if (this.cb.onGravityPulse) this.cb.onGravityPulse();
      }
    });
    this.abilityGroup.appendChild(this.btnPulse);

    // Magnetic Hands Button
    this.btnGrab = document.createElement('div');
    this.btnGrab.className = 'hud-ability-wrapper';
    this.btnGrab.innerHTML = `
      <button class="hud-ability-btn" id="hud-btn-grab" title="${i18n.t('magnetic_hands')}">
        <span style="font-size: 1.8rem;">🧤</span>
      </button>
      <span class="hud-ability-label" id="hud-lbl-grab">${i18n.t('magnetic_hands')}</span>
    `;
    this.btnGrab.querySelector('button').addEventListener('click', () => {
      this.isMagneticActive = !this.isMagneticActive;
      const btn = this.btnGrab.querySelector('button');
      btn.classList.toggle('is-active', this.isMagneticActive);
      if (this.cb.onMagneticGrab) this.cb.onMagneticGrab(this.isMagneticActive);
    });
    this.abilityGroup.appendChild(this.btnGrab);

    this.bottomBar.appendChild(this.abilityGroup);

    // --- BOTTOM RIGHT: Dynamic Health Bar ---
    const bottomRight = document.createElement('div');
    bottomRight.className = 'hud-block-right';
    bottomRight.style.flexDirection = 'column';
    bottomRight.style.alignItems = 'flex-end';
    bottomRight.style.gap = '8px';
    bottomRight.style.pointerEvents = 'auto';

    this.healthBox = document.createElement('div');
    this.healthBox.className = 'hud-gravity-box';
    this.healthBox.style.minWidth = '160px';
    this.healthBox.title = i18n.t('health');
    this.healthBox.innerHTML = `
      <div class="hud-gravity-header">
        <span class="hud-gravity-label" id="hud-health-label-text">❤️ ${i18n.t('health')}</span>
        <span class="hud-gravity-value" id="hud-health-val-text" style="color: #10b981;">100%</span>
      </div>
      <div class="hud-gravity-track" style="border-color: rgba(16, 185, 129, 0.4);">
        <div class="hud-gravity-fill" id="hud-health-fill-bar" style="width: 100%; background: linear-gradient(90deg, #059669, #10b981, #6ee7b7); box-shadow: 0 0 10px #10b981;"></div>
      </div>
    `;
    bottomRight.appendChild(this.healthBox);
    this.bottomBar.appendChild(bottomRight);

    this.wrapper.appendChild(this.bottomBar);

    // =========================================================================
    // 3. TOUCH CONTROLS LAYER (.touch-controls-layer)
    // =========================================================================
    this.initTouchControls();

    // =========================================================================
    // 4. FLOATING HINT TOAST NOTIFICATION (.hud-hint-toast)
    // =========================================================================
    this.hintToast = document.createElement('div');
    this.hintToast.className = 'hud-hint-toast';
    this.hintToast.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zm-1 18a2 2 0 0 0 2 2 2 2 0 0 0 2-2z"/></svg>
      <span id="hud-hint-toast-text"></span>
    `;
    this.hintToast.addEventListener('click', () => this.hideHint());
    this.wrapper.appendChild(this.hintToast);

    // =========================================================================
    // 5. PAUSE OVERLAY (.pause-overlay)
    // =========================================================================
    this.initPauseOverlay();

    // Attach complete HUD tree into container
    this.container.appendChild(this.wrapper);
  }

  /**
   * Initializes mobile virtual joystick and action buttons zone.
   */
  initTouchControls() {
    this.touchLayer = document.createElement('div');
    this.touchLayer.className = 'touch-controls-layer';

    // Detect touch capability
    const isTouchDevice = (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    if (isTouchDevice) {
      this.touchLayer.style.display = 'block';
    }

    // Left Virtual Joystick Zone
    this.joystickZone = document.createElement('div');
    this.joystickZone.className = 'touch-joystick-zone';
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'touch-joystick-knob';
    this.joystickZone.appendChild(this.joystickKnob);

    let isDragging = false;
    let originX = 0;
    let originY = 0;
    const maxRadius = 45;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.joystickZone.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      isDragging = true;
      handleTouchMove(e);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - originX;
      const deltaY = touch.clientY - originY;
      const dist = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const clampedDist = Math.min(dist, maxRadius);
      const moveX = Math.cos(angle) * clampedDist;
      const moveY = Math.sin(angle) * clampedDist;

      this.joystickKnob.style.transform = `translate(${moveX}px, ${moveY}px)`;

      const normX = moveX / maxRadius;
      const normY = moveY / maxRadius;

      if (this.cb.onMove) {
        this.cb.onMove({ x: normX, y: normY });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtual-joystick-move', {
          detail: { x: normX, y: normY }
        }));
      }
    };

    const handleTouchEnd = (e) => {
      isDragging = false;
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
      if (this.cb.onMove) {
        this.cb.onMove({ x: 0, y: 0 });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtual-joystick-move', {
          detail: { x: 0, y: 0 }
        }));
      }
    };

    this.joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.joystickZone.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.joystickZone.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.joystickZone.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    this.touchLayer.appendChild(this.joystickZone);
    this.wrapper.appendChild(this.touchLayer);
  }

  /**
   * Initializes the Pause Overlay with quick action buttons.
   */
  initPauseOverlay() {
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'pause-overlay';
    this.pauseOverlay.innerHTML = `
      <div class="pause-title">${i18n.t('paused')}</div>
      <div class="pause-actions">
        <button class="modal-btn modal-btn-primary" id="btn-pause-resume">
          ▶️ ${i18n.t('resume')}
        </button>
        <button class="modal-btn modal-btn-secondary" id="btn-pause-restart">
          🔄 ${i18n.t('restart')}
        </button>
        <button class="modal-btn modal-btn-secondary" id="btn-pause-levels">
          📋 ${i18n.t('menu')}
        </button>
        <button class="modal-btn modal-btn-secondary" id="btn-pause-settings">
          ⚙️ ${i18n.t('settings')}
        </button>
      </div>
    `;

    this.pauseOverlay.querySelector('#btn-pause-resume').addEventListener('click', () => {
      this.playSfxClick();
      this.hidePause();
    });

    this.pauseOverlay.querySelector('#btn-pause-restart').addEventListener('click', () => {
      this.playSfxClick();
      this.hidePause();
      if (this.cb.onRestart) this.cb.onRestart();
    });

    this.pauseOverlay.querySelector('#btn-pause-levels').addEventListener('click', () => {
      this.playSfxClick();
      this.hidePause();
      this.showLevelSelect();
    });

    this.pauseOverlay.querySelector('#btn-pause-settings').addEventListener('click', () => {
      this.playSfxClick();
      this.showSettings();
    });

    this.wrapper.appendChild(this.pauseOverlay);
  }

  // =========================================================================
  // UPDATE METHODS
  // =========================================================================

  /**
   * Updates level number and sector title in top badge.
   * @param {Object|number} level - Level object or 1-based index
   */
  updateLevel(level) {
    if (typeof level === 'number') {
      const all = this.getLevelsList();
      this.currentLevel = all.find(l => l.id === level) || { id: level, sector: 'Maintenance Bay', sectorPt: 'Baía de Manutenção' };
    } else if (level && typeof level === 'object') {
      this.currentLevel = level;
    }

    const badgeNum = document.getElementById('hud-level-badge-text');
    const badgeSector = document.getElementById('hud-sector-badge-text');

    if (badgeNum) {
      badgeNum.textContent = `${i18n.t('level')} ${this.currentLevel.id || 1}`;
    }

    if (badgeSector) {
      const isPt = i18n.getLang() === 'pt-BR';
      const sectorName = isPt
        ? (this.currentLevel.sectorPt || this.currentLevel.sector || '')
        : (this.currentLevel.sector || '');
      badgeSector.textContent = sectorName ? `• ${sectorName}` : '';
      if (this.currentLevel.color) {
        badgeSector.style.color = this.currentLevel.color;
      }
    }

    // Show initial hint for the chamber if available
    const hint = i18n.getLang() === 'pt-BR'
      ? (this.currentLevel.hintPt || this.currentLevel.hint)
      : (this.currentLevel.hintEn || this.currentLevel.hint);
    if (hint) {
      this.showHint(hint);
    }
  }

  /**
   * Updates attempts / hearts display.
   * @param {number} current
   * @param {number} [max=3]
   */
  updateAttempts(current, max = 3) {
    this.attempts = Math.max(0, current);
    this.maxAttempts = Math.max(1, max);
    this.updateAttemptsVisual();
  }

  /**
   * Internal renderer for attempts hearts.
   */
  updateAttemptsVisual() {
    if (!this.attemptsBox) return;
    let html = '';
    for (let i = 0; i < this.maxAttempts; i++) {
      if (i < this.attempts) {
        html += `<span class="hud-attempt-heart is-active"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>`;
      } else {
        html += `<span class="hud-attempt-heart is-lost"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>`;
      }
    }
    this.attemptsBox.innerHTML = html;
  }

  /**
   * Updates stars earned count.
   * @param {number} count
   * @param {number} [total=3]
   */
  updateStars(count, total = 3) {
    this.starsCount = Math.max(0, Math.min(total, count));
    const el = document.getElementById('hud-stars-count');
    if (el) el.textContent = `${this.starsCount}/${total}`;
  }

  /**
   * Updates score display.
   * @param {number} score
   */
  updateScore(score) {
    this.score = Math.max(0, Math.floor(score));
    const el = document.getElementById('hud-score-val');
    if (el) el.textContent = this.score.toLocaleString();
  }

  /**
   * Updates timer display in MM:SS format.
   * @param {number} seconds - Elapsed or remaining seconds
   */
  updateTimer(seconds) {
    this.timer = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(this.timer / 60);
    const secs = this.timer % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const el = document.getElementById('hud-timer-val');
    if (el) el.textContent = formatted;
  }

  /**
   * Updates health bar width and color transition (Green -> Amber -> Red).
   * @param {number} current
   * @param {number} [max=100]
   */
  updateHealth(current, max = 100) {
    this.maxHealth = Math.max(1, max);
    this.health = Math.max(0, Math.min(this.maxHealth, current));
    const pct = Math.round((this.health / this.maxHealth) * 100);

    const valEl = document.getElementById('hud-health-val-text');
    const barEl = document.getElementById('hud-health-fill-bar');

    if (valEl) valEl.textContent = `${pct}%`;
    if (barEl) {
      barEl.style.width = `${pct}%`;
      if (pct > 60) {
        barEl.style.background = 'linear-gradient(90deg, #059669, #10b981, #6ee7b7)';
        barEl.style.boxShadow = '0 0 10px #10b981';
        if (valEl) valEl.style.color = '#10b981';
      } else if (pct > 25) {
        barEl.style.background = 'linear-gradient(90deg, #d97706, #fbbf24, #fef08a)';
        barEl.style.boxShadow = '0 0 10px #fbbf24';
        if (valEl) valEl.style.color = '#fbbf24';
      } else {
        barEl.style.background = 'linear-gradient(90deg, #b91c1c, #ef4444, #fca5a5)';
        barEl.style.boxShadow = '0 0 12px #ef4444';
        if (valEl) valEl.style.color = '#ef4444';
      }
    }
  }

  /**
   * Updates gravity charge bar percentage and ready status.
   * @param {number} charge - Charge from 0 to 100
   */
  updateGravityCharge(charge) {
    this.gravityCharge = Math.max(0, Math.min(100, Math.round(charge)));
    const valEl = document.getElementById('hud-gravity-val-text');
    const fillEl = document.getElementById('hud-gravity-fill-bar');

    if (valEl) valEl.textContent = `${this.gravityCharge}%`;
    if (fillEl) fillEl.style.width = `${this.gravityCharge}%`;

    if (this.gravityBox) {
      if (this.gravityCharge >= 100) {
        this.gravityBox.classList.add('is-ready');
        this.gravityBox.title = i18n.t('gravity_ready');
      } else {
        this.gravityBox.classList.remove('is-ready');
        this.gravityBox.title = i18n.t('gravity_charge');
      }
    }
  }

  /**
   * Updates disposed trash tracker.
   * @param {number} disposed
   * @param {number} total
   */
  updateTrash(disposed, total) {
    this.trashDisposed = Math.max(0, disposed);
    this.totalTrash = Math.max(0, total);
    const el = document.getElementById('hud-trash-val');
    if (el) el.textContent = `${this.trashDisposed} / ${this.totalTrash}`;
  }

  /**
   * Displays non-obtrusive floating toast hint at bottom center.
   * @param {string} text
   * @param {number} [durationMs=3000]
   */
  showHint(text, durationMs = 3000) {
    if (!this.hintToast) return;
    const txtEl = document.getElementById('hud-hint-toast-text');
    if (txtEl) txtEl.textContent = text;

    this.hintToast.classList.add('is-visible');

    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      this.hideHint();
    }, durationMs);
  }

  /**
   * Hides the hint toast immediately.
   */
  hideHint() {
    if (!this.hintToast) return;
    this.hintToast.classList.remove('is-visible');
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  // =========================================================================
  // MODAL CONTROLS & LIFECYCLE
  // =========================================================================

  /**
   * Displays the Victory (Chamber Cleaned) modal with animated star slots and 2x Rewarded Ad.
   * @param {number} starsEarned
   * @param {number} score
   * @param {number|string} time
   * @param {number} trashCount
   * @param {() => void} [onNext]
   * @param {() => void} [onRestart]
   */
  showVictoryModal(starsEarned, score, time, trashCount, onNext, onRestart) {
    this.hideAllModals();
    crazyGames.gameplayStop();
    crazyGames.happyTime();
    if (sound?.playVictory) sound.playVictory();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay is-visible';

    const panel = document.createElement('div');
    panel.className = 'modal-panel modal-victory';

    let currentScore = typeof score === 'number' ? score : this.score;
    let isRewardedClaimed = false;

    // Time formatting
    const timeFormatted = typeof time === 'number'
      ? `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`
      : String(time || '00:00');

    panel.innerHTML = `
      <div class="modal-header">
        <div style="font-size: 2.2rem; margin-bottom: 6px;">🎉 🛸 🏆</div>
        <div class="modal-title">${i18n.t('congrats')}</div>
        <div class="modal-subtitle">${i18n.t('level_cleared')}</div>
      </div>

      <div class="victory-stars-row">
        <div class="victory-star-slot" id="v-star-1">
          <svg class="victory-star-icon" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </div>
        <div class="victory-star-slot" id="v-star-2">
          <svg class="victory-star-icon" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </div>
        <div class="victory-star-slot" id="v-star-3">
          <svg class="victory-star-icon" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        </div>
      </div>

      <div class="victory-stats-panel">
        <div class="victory-stat-item">
          <span class="victory-stat-label">${i18n.t('score')}:</span>
          <span class="victory-stat-value" id="v-score-val">${currentScore.toLocaleString()}</span>
        </div>
        <div class="victory-stat-item">
          <span class="victory-stat-label">${i18n.t('time_taken')}:</span>
          <span class="victory-stat-value">${timeFormatted}</span>
        </div>
        <div class="victory-stat-item">
          <span class="victory-stat-label">${i18n.t('trash_disposed')}:</span>
          <span class="victory-stat-value">${trashCount !== undefined ? trashCount : this.trashDisposed}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn-rewarded" id="btn-victory-double">
          <svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          ${i18n.t('double_rewards')}
        </button>

        <button class="modal-btn modal-btn-primary" id="btn-victory-next">
          ${i18n.t('next_level')}
        </button>

        <div class="modal-actions-row">
          <button class="modal-btn modal-btn-secondary" id="btn-victory-restart">
            ${i18n.t('try_again')}
          </button>
          <button class="modal-btn modal-btn-secondary" id="btn-victory-levels">
            ${i18n.t('level_select')}
          </button>
        </div>
      </div>
    `;

    // Staggered star animation
    setTimeout(() => {
      if (starsEarned >= 1) panel.querySelector('#v-star-1')?.classList.add('is-awarded');
    }, 150);
    setTimeout(() => {
      if (starsEarned >= 2) panel.querySelector('#v-star-2')?.classList.add('is-awarded');
    }, 350);
    setTimeout(() => {
      if (starsEarned >= 3) panel.querySelector('#v-star-3')?.classList.add('is-awarded');
    }, 550);

    // 2x Rewarded Ad Button
    const doubleBtn = panel.querySelector('#btn-victory-double');
    doubleBtn.addEventListener('click', () => {
      if (isRewardedClaimed) return;
      this.playSfxClick();

      crazyGames.requestRewardedAd('double_rewards', () => {
        isRewardedClaimed = true;
        currentScore *= 2;
        storage.addCoins(100);
        const scoreEl = panel.querySelector('#v-score-val');
        if (scoreEl) scoreEl.textContent = `${currentScore.toLocaleString()} (2X BONUS!)`;
        doubleBtn.classList.remove('modal-btn-rewarded');
        doubleBtn.classList.add('modal-btn-primary');
        doubleBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        doubleBtn.innerHTML = '✅ 2X REWARD CLAIMED!';
        doubleBtn.disabled = true;
        this.showHint('+100 Space Scrap Awarded!');
      }, (err) => {
        this.showHint(i18n.getLang() === 'pt-BR' ? 'Anúncio indisponível no momento.' : 'Ad currently unavailable.');
      });
    });

    // Next Level Button (Triggers Midgame Ad then advances)
    panel.querySelector('#btn-victory-next').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;

      crazyGames.requestMidgameAd(() => {
        crazyGames.gameplayStart();
        if (onNext) onNext();
        else if (this.cb.onNextLevel) this.cb.onNextLevel();
      });
    });

    // Try Again Button
    panel.querySelector('#btn-victory-restart').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      crazyGames.gameplayStart();
      if (onRestart) onRestart();
      else if (this.cb.onRestart) this.cb.onRestart();
    });

    // Chamber Select Button
    panel.querySelector('#btn-victory-levels').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      this.showLevelSelect();
    });

    overlay.appendChild(panel);
    (document.getElementById('app') || document.body).appendChild(overlay);
    this.activeModal = overlay;
  }

  /**
   * Displays the Game Over (Station Breach) modal with equal-visibility Rewarded Ad Revive.
   * @param {() => void} [onRevive]
   * @param {() => void} [onRestart]
   * @param {boolean} [canRevive=true]
   */
  showGameOverModal(onRevive, onRestart, canRevive = true) {
    this.hideAllModals();
    crazyGames.gameplayStop();
    if (sound?.playGameOver) sound.playGameOver();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay is-visible';

    const panel = document.createElement('div');
    panel.className = 'modal-panel modal-game-over';

    panel.innerHTML = `
      <div class="modal-header">
        <div style="font-size: 2.2rem; margin-bottom: 6px;">⚠️ 💥 🚨</div>
        <div class="modal-title">${i18n.t('level_failed')}</div>
        <div class="hazard-stripe-bar"></div>
        <p class="game-over-reason">${i18n.t('level_failed_desc')}</p>
      </div>

      <div class="modal-footer">
        <!-- Rewarded Ad Revive Button (Same visual priority, hidden if already used) -->
        ${canRevive ? `
        <button class="modal-btn modal-btn-rewarded" id="btn-gameover-revive">
          <svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          ${i18n.t('revive_btn')}
        </button>` : ''}

        <button class="modal-btn modal-btn-primary" id="btn-gameover-retry">
          ${i18n.t('try_again')}
        </button>

        <button class="modal-btn modal-btn-secondary" id="btn-gameover-levels">
          ${i18n.t('level_select')}
        </button>
      </div>
    `;

    // Rewarded Ad Revive Click
    if (canRevive) {
      const reviveBtn = panel.querySelector('#btn-gameover-revive');
      if (reviveBtn) {
        reviveBtn.addEventListener('click', () => {
          this.playSfxClick();

          crazyGames.requestRewardedAd('revive', () => {
            overlay.remove();
            this.activeModal = null;
            this.updateHealth(100);
            crazyGames.gameplayStart();
            if (onRevive) onRevive();
            this.showHint('Emergency Kit Deployed! Hull Repaired!');
          }, (err) => {
            // STRICT CRAZYGAMES REQUIREMENT: NEVER grant revive on error/adblock
            this.showHint(i18n.getLang() === 'pt-BR' ? 'Anúncio indisponível para reviver.' : 'Ad unavailable for revive.');
          });
        });
      }
    }

    // Try Again Click
    panel.querySelector('#btn-gameover-retry').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      crazyGames.requestMidgameAd(() => {
        crazyGames.gameplayStart();
        if (onRestart) onRestart();
        else if (this.cb.onRestart) this.cb.onRestart();
      });
    });

    // Levels Click
    panel.querySelector('#btn-gameover-levels').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      this.showLevelSelect();
    });

    overlay.appendChild(panel);
    (document.getElementById('app') || document.body).appendChild(overlay);
    this.activeModal = overlay;
  }

  /**
   * Displays the Chamber Selection Modal grid with progress and stars.
   */
  showLevelSelect() {
    this.hideAllModals();
    crazyGames.gameplayStop();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay is-visible';

    const panel = document.createElement('div');
    panel.className = 'modal-panel modal-panel-level-select';

    const allLevels = this.getLevelsList();
    const unlockedLevel = storage.getUnlockedLevel();

    let gridHtml = '';
    allLevels.forEach((lvl) => {
      const isLocked = lvl.id > unlockedLevel;
      const isCurrent = lvl.id === (this.currentLevel?.id || 1);
      const starsEarned = storage.getLevelStars(lvl.id);

      const sectorColor = lvl.color || '#00f5ff';

      gridHtml += `
        <div class="level-card ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}" data-lvl="${lvl.id}" style="${isCurrent ? `border-color: ${sectorColor};` : ''}">
          ${isLocked ? `
            <svg class="level-card-lock-icon" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          ` : `
            <span class="level-card-number">${lvl.id}</span>
            <div class="level-card-stars">
              <svg class="level-card-star ${starsEarned >= 1 ? 'is-earned' : ''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <svg class="level-card-star ${starsEarned >= 2 ? 'is-earned' : ''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <svg class="level-card-star ${starsEarned >= 3 ? 'is-earned' : ''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            </div>
          `}
        </div>
      `;
    });

    panel.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">🛸 ${i18n.t('level_select')}</div>
        <div class="modal-subtitle">Orbital Haven Station Chambers</div>
      </div>

      <div class="modal-body">
        <div class="level-grid">
          ${gridHtml}
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" id="btn-levelselect-close">
          ${i18n.t('settings_close')}
        </button>
      </div>
    `;

    // Level card clicks
    panel.querySelectorAll('.level-card:not(.is-locked)').forEach((card) => {
      card.addEventListener('click', () => {
        const lvlId = Number(card.getAttribute('data-lvl'));
        this.playSfxClick();
        overlay.remove();
        this.activeModal = null;
        crazyGames.gameplayStart();
        if (this.cb.onSelectLevel) this.cb.onSelectLevel(lvlId);
      });
    });

    // Close button
    panel.querySelector('#btn-levelselect-close').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      crazyGames.gameplayStart();
    });

    overlay.appendChild(panel);
    (document.getElementById('app') || document.body).appendChild(overlay);
    this.activeModal = overlay;
  }

  /**
   * Displays the Settings Modal with audio volume sliders, graphic toggles, and language choice.
   */
  showSettings() {
    this.hideAllModals();
    crazyGames.gameplayStop();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay is-visible';

    const panel = document.createElement('div');
    panel.className = 'modal-panel';

    const currentSettings = storage.getSettings();
    const isMuted = sound?.isMuted ?? false;
    const currentLang = i18n.getLang();

    panel.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">⚙️ ${i18n.t('settings')}</div>
      </div>

      <div class="modal-body">
        <div class="settings-group">
          <!-- AUDIO SECTION -->
          <div style="font-family: var(--font-scifi); font-size: 1.1rem; color: var(--color-cyan-glow); border-bottom: 1px solid rgba(0,245,255,0.2); padding-bottom: 4px;">
            🎵 ${i18n.t('settings_audio')}
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_master_vol')}</span>
            </div>
            <div class="sci-slider-wrap">
              <input type="range" class="sci-slider" id="set-master-vol" min="0" max="100" value="${Math.round((sound?.getMasterVolume ? sound.getMasterVolume() : currentSettings.masterVolume) * 100)}" />
              <span class="settings-hint" id="val-master-vol" style="min-width: 38px;">${Math.round(currentSettings.masterVolume * 100)}%</span>
            </div>
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_bgm_vol')}</span>
            </div>
            <div class="sci-slider-wrap">
              <input type="range" class="sci-slider" id="set-bgm-vol" min="0" max="100" value="${Math.round((sound?.getBgmVolume ? sound.getBgmVolume() : currentSettings.bgmVolume) * 100)}" />
              <span class="settings-hint" id="val-bgm-vol" style="min-width: 38px;">${Math.round(currentSettings.bgmVolume * 100)}%</span>
            </div>
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_sfx_vol')}</span>
            </div>
            <div class="sci-slider-wrap">
              <input type="range" class="sci-slider" id="set-sfx-vol" min="0" max="100" value="${Math.round((sound?.getSfxVolume ? sound.getSfxVolume() : currentSettings.sfxVolume) * 100)}" />
              <span class="settings-hint" id="val-sfx-vol" style="min-width: 38px;">${Math.round(currentSettings.sfxVolume * 100)}%</span>
            </div>
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_mute_all')}</span>
            </div>
            <button class="modal-btn modal-btn-secondary" id="set-mute-btn" style="width: auto; padding: 6px 16px;">
              ${isMuted ? '🔇 ' + i18n.t('settings_unmute_all') : '🔊 ' + i18n.t('settings_mute_all')}
            </button>
          </div>

          <!-- GRAPHICS SECTION -->
          <div style="font-family: var(--font-scifi); font-size: 1.1rem; color: var(--color-cyan-glow); border-bottom: 1px solid rgba(0,245,255,0.2); padding-bottom: 4px; margin-top: 10px;">
            🖥️ ${i18n.t('settings_video')}
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_trajectory')}</span>
            </div>
            <label class="sci-toggle">
              <input type="checkbox" id="set-trajectory" ${currentSettings.showTrajectory ? 'checked' : ''} />
              <span class="sci-toggle-track"></span>
            </label>
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">${i18n.t('settings_shake')}</span>
            </div>
            <label class="sci-toggle">
              <input type="checkbox" id="set-shake" ${currentSettings.screenShake ? 'checked' : ''} />
              <span class="sci-toggle-track"></span>
            </label>
          </div>

          <!-- LANGUAGE SECTION -->
          <div style="font-family: var(--font-scifi); font-size: 1.1rem; color: var(--color-cyan-glow); border-bottom: 1px solid rgba(0,245,255,0.2); padding-bottom: 4px; margin-top: 10px;">
            🌐 ${i18n.t('settings_lang')}
          </div>

          <div class="settings-item">
            <div class="settings-label-wrap">
              <span class="settings-label">Language / Idioma</span>
            </div>
            <div class="language-selector">
              <button class="lang-btn ${currentLang === 'pt-BR' ? 'is-active' : ''}" id="btn-lang-pt">🇧🇷 PT</button>
              <button class="lang-btn ${currentLang === 'en' ? 'is-active' : ''}" id="btn-lang-en">🇺🇸 EN</button>
            </div>
          </div>

          <!-- RESET PROGRESS SECTION -->
          <div style="margin-top: 14px;">
            <button class="modal-btn modal-btn-danger" id="btn-settings-reset" style="padding: 10px 16px; font-size: 0.85rem;">
              ⚠️ ${i18n.t('settings_reset')}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn-primary" id="btn-settings-save">
          💾 ${i18n.t('settings_close')}
        </button>
      </div>
    `;

    // Sliders Event Handlers
    const bindSlider = (sliderId, valId, soundFn, settingsKey) => {
      const slider = panel.querySelector(sliderId);
      const valLabel = panel.querySelector(valId);
      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        valLabel.textContent = `${val}%`;
        const normalized = val / 100;
        if (sound && typeof sound[soundFn] === 'function') {
          sound[soundFn](normalized);
        }
        storage.saveSettings({ [settingsKey]: normalized });
      });
    };

    bindSlider('#set-master-vol', '#val-master-vol', 'setMasterVolume', 'masterVolume');
    bindSlider('#set-bgm-vol', '#val-bgm-vol', 'setBgmVolume', 'bgmVolume');
    bindSlider('#set-sfx-vol', '#val-sfx-vol', 'setSfxVolume', 'sfxVolume');

    // Mute Button Handler
    const muteBtn = panel.querySelector('#set-mute-btn');
    muteBtn.addEventListener('click', () => {
      this.playSfxClick();
      const muted = sound?.toggleMute ? sound.toggleMute() : false;
      muteBtn.textContent = muted ? '🔇 ' + i18n.t('settings_unmute_all') : '🔊 ' + i18n.t('settings_mute_all');
      this.updateMuteButtonVisual(muted);
    });

    // Trajectory & Shake Toggles
    panel.querySelector('#set-trajectory').addEventListener('change', (e) => {
      storage.saveSettings({ showTrajectory: e.target.checked });
    });

    panel.querySelector('#set-shake').addEventListener('change', (e) => {
      storage.saveSettings({ screenShake: e.target.checked });
    });

    // Language Buttons
    panel.querySelector('#btn-lang-pt').addEventListener('click', () => {
      this.playSfxClick();
      i18n.setLocale('pt-BR');
      overlay.remove();
      this.showSettings();
    });

    panel.querySelector('#btn-lang-en').addEventListener('click', () => {
      this.playSfxClick();
      i18n.setLocale('en');
      overlay.remove();
      this.showSettings();
    });

    // Reset Progress Button
    panel.querySelector('#btn-settings-reset').addEventListener('click', () => {
      this.playSfxClick();
      const confirmReset = typeof window !== 'undefined'
        ? window.confirm(i18n.t('settings_reset_confirm'))
        : true;
      if (confirmReset) {
        storage.clearAll();
        this.updateAttempts(3);
        this.updateStars(0);
        this.updateScore(0);
        this.updateLevel(1);
        overlay.remove();
        this.activeModal = null;
        crazyGames.gameplayStart();
        if (this.cb.onSelectLevel) this.cb.onSelectLevel(1);
      }
    });

    // Save & Close Button
    panel.querySelector('#btn-settings-save').addEventListener('click', () => {
      this.playSfxClick();
      overlay.remove();
      this.activeModal = null;
      crazyGames.gameplayStart();
    });

    overlay.appendChild(panel);
    (document.getElementById('app') || document.body).appendChild(overlay);
    this.activeModal = overlay;
  }

  /**
   * Shows pause overlay.
   */
  showPause() {
    this.isPaused = true;
    crazyGames.gameplayStop();
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.add('is-visible');
    }
    if (this.cb.onPause) this.cb.onPause();
  }

  /**
   * Hides pause overlay and resumes gameplay.
   */
  hidePause() {
    this.isPaused = false;
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.remove('is-visible');
    }
    crazyGames.gameplayStart();
    if (this.cb.onResume) this.cb.onResume();
  }

  /**
   * Toggles pause state.
   */
  togglePause() {
    if (this.isPaused) {
      this.hidePause();
    } else {
      this.showPause();
    }
  }

  /**
   * Removes all open modal overlays from DOM.
   */
  hideAllModals() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
    if (typeof document !== 'undefined') {
      const activeOverlays = document.querySelectorAll('.modal-overlay');
      activeOverlays.forEach(o => o.remove());
    }
    if (this.pauseOverlay) {
      this.pauseOverlay.classList.remove('is-visible');
    }
    this.isPaused = false;
  }

  /**
   * Updates audio button visual state.
   * @param {boolean} [forcedState]
   */
  updateMuteButtonVisual(forcedState) {
    if (!this.btnMute) return;
    const muted = forcedState !== undefined ? forcedState : (sound?.isMuted ?? false);
    this.btnMute.innerHTML = muted ? '🔇' : '🔊';
    this.btnMute.title = muted ? i18n.t('settings_unmute_all') : i18n.t('settings_mute_all');
  }

  /**
   * Safe click audio invocation.
   */
  playSfxClick() {
    try {
      if (sound?.playClick) {
        sound.playClick();
      }
    } catch (e) {}
  }

  /**
   * Re-translates all static HUD labels, tooltips, and badges when language changes.
   */
  refreshTexts() {
    this.updateLevel(this.currentLevel);

    if (this.btnRestart) this.btnRestart.title = i18n.t('restart');
    if (this.btnLevels) this.btnLevels.title = i18n.t('menu');
    if (this.btnPause) this.btnPause.title = i18n.t('paused');
    if (this.btnSettings) this.btnSettings.title = i18n.t('settings');
    if (this.btnLang) this.btnLang.innerHTML = i18n.getLang() === 'pt-BR' ? '🇧🇷' : '🇺🇸';

    const gravLabel = document.getElementById('hud-gravity-label-text');
    if (gravLabel) gravLabel.textContent = i18n.t('gravity_charge');

    const healthLabel = document.getElementById('hud-health-label-text');
    if (healthLabel) healthLabel.textContent = `❤️ ${i18n.t('health')}`;

    const trashLabel = document.getElementById('hud-trash-label');
    if (trashLabel) trashLabel.textContent = `${i18n.t('trash_disposed_hud')}:`;

    const lblTractor = document.getElementById('hud-lbl-tractor');
    if (lblTractor) lblTractor.textContent = i18n.t('tractor_beam');

    const lblGrab = document.getElementById('hud-lbl-grab');
    if (lblGrab) lblGrab.textContent = i18n.t('magnetic_hands');

    if (this.pauseOverlay) {
      const pTitle = this.pauseOverlay.querySelector('.pause-title');
      if (pTitle) pTitle.textContent = i18n.t('paused');
      const pResume = this.pauseOverlay.querySelector('#btn-pause-resume');
      if (pResume) pResume.innerHTML = `▶️ ${i18n.t('resume')}`;
      const pRestart = this.pauseOverlay.querySelector('#btn-pause-restart');
      if (pRestart) pRestart.innerHTML = `🔄 ${i18n.t('restart')}`;
      const pLevels = this.pauseOverlay.querySelector('#btn-pause-levels');
      if (pLevels) pLevels.innerHTML = `📋 ${i18n.t('menu')}`;
      const pSettings = this.pauseOverlay.querySelector('#btn-pause-settings');
      if (pSettings) pSettings.innerHTML = `⚙️ ${i18n.t('settings')}`;
    }

    this.updateMuteButtonVisual();
  }

  /**
   * Sets tractor beam button active visual state.
   * @param {boolean} active
   */
  setTractorBeamActive(active) {
    this.isTractorBeamActive = Boolean(active);
    const btn = this.btnTractor?.querySelector('button');
    if (btn) btn.classList.toggle('is-active', this.isTractorBeamActive);
  }

  /**
   * Sets magnetic hands button active visual state.
   * @param {boolean} active
   */
  setMagneticActive(active) {
    this.isMagneticActive = Boolean(active);
    const btn = this.btnGrab?.querySelector('button');
    if (btn) btn.classList.toggle('is-active', this.isMagneticActive);
  }

  /**
   * Cleans up event listeners and removes HUD DOM when destroyed.
   */
  destroy() {
    this.hideAllModals();
    if (this.hintTimer) clearTimeout(this.hintTimer);
    if (typeof window !== 'undefined' && this.onLocaleChanged) {
      window.removeEventListener('locale-changed', this.onLocaleChanged);
    }
    if (this.wrapper) {
      this.wrapper.remove();
    }
  }
}

export default GameHUD;
