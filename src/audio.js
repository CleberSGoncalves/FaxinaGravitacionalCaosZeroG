/**
 * @fileoverview Complete Procedural Audio System for 'Faxina Gravitacional: Caos Zero-G!'
 * 100% synthesized in real-time via Web Audio API - ZERO external audio files or assets.
 * 
 * Features:
 * - Master, SFX, and BGM volume controls with smooth exponential/linear ramping
 * - CrazyGames SDK v3 audio compliance (automatic ad muting & unmuting)
 * - Safe user-gesture audio context unlock (pointerdown, keydown, touchstart)
 * - Official FluidCleb Interactive audio brand sequence (intro sweep, fusion, ejection)
 * - Comprehensive space station gameplay SFX (thruster bursts, magnetic grab, gravity beams,
 *   explosions, radioactive alarms, pneumatic waste disposal, metallic collisions)
 * - Generative zero-g space station background ambient drone & pentatonic melody synthesis
 * - Pitch randomization (0.95 - 1.05) on all playback methods for natural variety
 * 
 * @module audio
 * @author FluidCleb Interactive
 */

/**
 * Procedural Sound and Music Synthesizer Engine.
 */
class SoundSystem {
  /**
   * Constructs the SoundSystem with default volume parameters and initial states.
   */
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;

    /** @type {GainNode|null} */
    this.masterGain = null;

    /** @type {GainNode|null} */
    this.sfxGain = null;

    /** @type {GainNode|null} */
    this.bgmGain = null;

    /** @type {boolean} */
    this.isMuted = false;

    /** @type {boolean} */
    this.isAdMuted = false;

    /** @type {boolean} */
    this.bgmRunning = false;

    /** @type {any} */
    this.bgmTimer = null;

    /** @type {number} */
    this.bgmStep = 0;

    /** @type {OscillatorNode|null} */
    this.bgmDroneOsc = null;

    /** @type {OscillatorNode|null} */
    this.bgmDroneLfo = null;

    /** @type {GainNode|null} */
    this.bgmDroneGain = null;

    /** @type {GainNode|null} */
    this.bgmDroneLfoGain = null;

    /** @type {BiquadFilterNode|null} */
    this.bgmDroneFilter = null;

    /** @type {number} */
    this.masterVolumeVal = 0.85;

    /** @type {number} */
    this.sfxVolumeVal = 0.9;

    /** @type {number} */
    this.bgmVolumeVal = 0.4;

    /** @type {AudioBuffer|null} */
    this._noiseBuffer = null;

    /** @type {Float32Array|null} */
    this._distortionCurve = null;

    /** @type {boolean} */
    this._isUnlocked = false;
  }

  /**
   * Initializes the Web Audio Context, sets up the gain node hierarchy,
   * and attaches passive user-gesture listeners to unlock audio on first interaction.
   * @returns {void}
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!AudioCtx) {
        console.warn('[Audio] Web Audio API is not supported in this browser environment.');
        return;
      }

      this.ctx = new AudioCtx();

      // Master Gain -> Destination
      this.masterGain = this.ctx.createGain();
      const currentMaster = (this.isMuted || this.isAdMuted) ? 0.0001 : this.masterVolumeVal;
      this.masterGain.gain.setValueAtTime(currentMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain -> Master Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolumeVal, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // BGM Gain -> Master Gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolumeVal, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Pre-generate procedural noise buffer
      this._generateNoiseBuffer();

      // Setup gesture unlock listeners
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this._isUnlocked = true;
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    } catch (err) {
      console.warn('[Audio] Failed to initialize Web Audio Context:', err);
    }
  }

  // =========================================================================
  // VOLUME CONTROL & MUTE COMPLIANCE (CRAZYGAMES SDK)
  // =========================================================================

  /**
   * Sets the user mute state.
   * @param {boolean} muted
   * @returns {void}
   */
  setMuted(muted) {
    this.isMuted = !!muted;
    this.updateMasterVolume();
  }

  /**
   * Toggles the user mute state.
   * @returns {boolean} Current mute state
   */
  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Mutes audio immediately for advertisement playback (CrazyGames requirement).
   * @returns {void}
   */
  muteForAd() {
    this.isAdMuted = true;
    this.updateMasterVolume();
  }

  /**
   * Restores audio after advertisement completion (CrazyGames requirement).
   * @returns {void}
   */
  unmuteAfterAd() {
    this.isAdMuted = false;
    this.updateMasterVolume();
  }

  /**
   * Sets the master volume level.
   * @param {number} val Normalized value (0.0 to 1.0)
   * @returns {void}
   */
  setMasterVolume(val) {
    this.masterVolumeVal = Math.max(0, Math.min(1, val));
    this.updateMasterVolume();
  }

  /**
   * Retrieves current master volume level.
   * @returns {number}
   */
  getMasterVolume() {
    return this.masterVolumeVal;
  }

  /**
   * Sets the SFX sub-bus volume level.
   * @param {number} val Normalized value (0.0 to 1.0)
   * @returns {void}
   */
  setSfxVolume(val) {
    this.sfxVolumeVal = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sfxGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.linearRampToValueAtTime(this.sfxVolumeVal, now + 0.05);
      } catch (e) {}
    }
  }

  /**
   * Retrieves current SFX volume level.
   * @returns {number}
   */
  getSfxVolume() {
    return this.sfxVolumeVal;
  }

  /**
   * Sets the BGM sub-bus volume level.
   * @param {number} val Normalized value (0.0 to 1.0)
   * @returns {void}
   */
  setBgmVolume(val) {
    this.bgmVolumeVal = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGain.gain.cancelScheduledValues(now);
        this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolumeVal, now + 0.05);
      } catch (e) {}
    }
  }

  /**
   * Retrieves current BGM volume level.
   * @returns {number}
   */
  getBgmVolume() {
    return this.bgmVolumeVal;
  }

  /**
   * Smoothly updates master gain node target value to avoid audio popping.
   * @returns {void}
   */
  updateMasterVolume() {
    if (!this.masterGain || !this.ctx) return;
    const target = (this.isMuted || this.isAdMuted) ? 0.0001 : this.masterVolumeVal;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.05);
    } catch (e) {}
  }

  // =========================================================================
  // INTERNAL SYNTHESIS HELPERS
  // =========================================================================

  /**
   * Generates a 2-second looped white noise buffer for procedural filtering.
   * @private
   */
  _generateNoiseBuffer() {
    if (!this.ctx) return;
    try {
      const sampleRate = this.ctx.sampleRate || 44100;
      const bufferSize = sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this._noiseBuffer = buffer;
    } catch (e) {
      this._noiseBuffer = null;
    }
  }

  /**
   * Creates a gentle soft-clipping distortion curve for electronic buzzes.
   * @private
   * @param {number} amount
   * @returns {Float32Array}
   */
  _getDistortionCurve(amount = 20) {
    if (this._distortionCurve) return this._distortionCurve;
    const nSamples = 256;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    this._distortionCurve = curve;
    return curve;
  }

  /**
   * Calculates a pitch-randomized frequency within a 0.95 to 1.05 range.
   * @private
   * @param {number} freq Base frequency in Hz
   * @param {number} [minVar=0.95]
   * @param {number} [maxVar=1.05]
   * @returns {number}
   */
  _randPitch(freq, minVar = 0.95, maxVar = 1.05) {
    return freq * (minVar + Math.random() * (maxVar - minVar));
  }

  /**
   * Verifies if playback is permitted under current context and mute states.
   * @private
   * @returns {boolean}
   */
  _canPlay() {
    this.init();
    if (!this.ctx || this.isMuted || this.isAdMuted) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  // =========================================================================
  // 1. FLUIDCLEB INTRO SYNTHESIS (EXACT BRAND AUDIO SIGNATURE)
  // =========================================================================

  /**
   * FluidCleb brand intro sweep: Rising sine wave (180Hz -> 540Hz) with smooth envelope.
   * @returns {void}
   */
  playFluidClebIntro() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.65);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * FluidCleb brand fusion sound: Dual-oscillator harmonic chord convergence (triangle + sine).
   * @returns {void}
   */
  playFluidFusion() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } catch (e) {}
  }

  /**
   * FluidCleb brand ejection sound: Soaring high-frequency fluid sweep (320Hz -> 1800Hz).
   * @returns {void}
   */
  playFluidEject() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.65);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  // =========================================================================
  // 2. SPACE STATION GAMEPLAY SFX
  // =========================================================================

  /**
   * Gas Thruster Burst: Pressurized gas jet using bandpass filtered white noise
   * and subtle low-end displacement.
   * @param {number} [intensity=1.0]
   * @returns {void}
   */
  playThrusterBurst(intensity = 1.0) {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const pitch = this._randPitch(800);
      const gainVal = Math.min(0.4, 0.28 * intensity);

      // Noise generator for gas rush
      if (this._noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(pitch, now);
        filter.Q.setValueAtTime(3.2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.17);
      }

      // Low rumble for nozzle kick
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(this._randPitch(120), now);
      sub.frequency.exponentialRampToValueAtTime(50, now + 0.14);

      subGain.gain.setValueAtTime(gainVal * 0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);

      sub.start(now);
      sub.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * Magnetic Hands Grab: Electronic buzzing clamp sound (sawtooth sweep + distortion).
   * @returns {void}
   */
  playMagneticGrab() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const shaper = this.ctx.createWaveShaper();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const startFreq = this._randPitch(200);
      const endFreq = this._randPitch(620);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.13);

      shaper.curve = this._getDistortionCurve(25);
      shaper.oversample = '2x';

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.26, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * Magnetic Hands Release: Softer reverse sweep from high to low frequency.
   * @returns {void}
   */
  playMagneticRelease() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const startFreq = this._randPitch(580);
      const endFreq = this._randPitch(180);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.13);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  /**
   * Gravity Traction Beam: Sustained detuned dual-frequency hum with 8Hz tremolo modulation.
   * @param {number} [duration=0.5]
   * @returns {void}
   */
  playGravityBeam(duration = 0.5) {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const dur = Math.max(0.2, duration);

      const f1 = this._randPitch(120);
      const f2 = this._randPitch(182);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const tremolo = this.ctx.createOscillator();
      const tremoloGain = this.ctx.createGain();
      const beamGain = this.ctx.createGain();
      const masterBeamGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(f1, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(f2, now);

      // Tremolo LFO at 8Hz
      tremolo.type = 'sine';
      tremolo.frequency.setValueAtTime(8, now);

      tremoloGain.gain.setValueAtTime(0.35, now);
      tremolo.connect(tremoloGain);

      beamGain.gain.setValueAtTime(0.65, now);
      tremoloGain.connect(beamGain.gain);

      // Main amplitude envelope
      masterBeamGain.gain.setValueAtTime(0.01, now);
      masterBeamGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      masterBeamGain.gain.setValueAtTime(0.25, now + dur - 0.08);
      masterBeamGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(beamGain);
      osc2.connect(beamGain);
      beamGain.connect(masterBeamGain);
      masterBeamGain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      tremolo.start(now);

      osc1.stop(now + dur);
      osc2.stop(now + dur);
      tremolo.stop(now + dur);
    } catch (e) {}
  }

  /**
   * Gravity Pulse: Deep visceral sub-bass 'whomp' with punchy attack.
   * @returns {void}
   */
  playGravityPulse() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Exponential frequency drop 60Hz -> 28Hz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this._randPitch(65), now);
      osc.frequency.exponentialRampToValueAtTime(26, now + 0.38);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.4);

      // Air displacement noise puff
      if (this._noiseBuffer) {
        const puff = this.ctx.createBufferSource();
        puff.buffer = this._noiseBuffer;

        const puffFilter = this.ctx.createBiquadFilter();
        puffFilter.type = 'lowpass';
        puffFilter.frequency.setValueAtTime(320, now);
        puffFilter.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        const puffGain = this.ctx.createGain();
        puffGain.gain.setValueAtTime(0.3, now);
        puffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        puff.connect(puffFilter);
        puffFilter.connect(puffGain);
        puffGain.connect(this.sfxGain);

        puff.start(now);
        puff.stop(now + 0.25);
      }
    } catch (e) {}
  }

  /**
   * Trash Disposal: Satisfying vacuum suction 'shwooop' through the incineration chute.
   * Sweeps bandpass filter from 2000Hz down to 200Hz.
   * @returns {void}
   */
  playTrashDispose() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;

      // Filtered noise suction sweep
      if (this._noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(this._randPitch(2100), now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.28);
        filter.Q.setValueAtTime(4.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.38, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.31);
      }

      // Suction low whistle drop
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.28);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Volatile Hazard Warning: 3 rapid alternating alarm beeps (880Hz / 660Hz / 880Hz).
   * @returns {void}
   */
  playVolatileWarning() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const beeps = [880, 660, 880];
      const beepDuration = 0.07;
      const beepInterval = 0.11;

      beeps.forEach((freq, idx) => {
        const startTime = now + idx * beepInterval;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(this._randPitch(freq), startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + beepDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + beepDuration);
      });
    } catch (e) {}
  }

  /**
   * Volatile Residue Explosion: White noise lowpass sweep (4000Hz -> 100Hz)
   * backed by sub-bass 40Hz punch and distortion.
   * @returns {void}
   */
  playVolatileExplode() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy noise burst
      if (this._noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this._randPitch(4200), now);
        filter.frequency.exponentialRampToValueAtTime(90, now + 0.58);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.63);
      }

      // Sub-bass detonation thump
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();

      sub.type = 'sine';
      sub.frequency.setValueAtTime(42, now);
      sub.frequency.exponentialRampToValueAtTime(18, now + 0.65);

      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);

      sub.start(now);
      sub.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * Checkpoint Reached: Uplifting chime arpeggio (C5 - E5 - G5).
   * @returns {void}
   */
  playCheckpointReached() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const noteDuration = 0.28;
      const step = 0.12;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * step;
        const osc = this.ctx.createOscillator();
        const spark = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        spark.type = 'sine';
        spark.frequency.setValueAtTime(freq * 2, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.24, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gain);
        spark.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        spark.start(startTime);
        osc.stop(startTime + noteDuration);
        spark.stop(startTime + noteDuration);
      });
    } catch (e) {}
  }

  /**
   * Level Complete Fanfare: Ascending victory sequence (C5 - E5 - G5 - C6)
   * with simulated chamber delay reflection.
   * @returns {void}
   */
  playLevelComplete() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const step = 0.14;

      // Synthetic space delay line
      const delay = this.ctx.createDelay();
      delay.delayTime.setValueAtTime(0.18, now);
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.setValueAtTime(0.35, now);

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(this.sfxGain);

      notes.forEach((freq, idx) => {
        const startTime = now + idx * step;
        const isFinal = idx === notes.length - 1;
        const dur = isFinal ? 0.9 : 0.35;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, startTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.002, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(isFinal ? 0.35 : 0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        gain.connect(delay);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + dur);
        osc2.stop(startTime + dur);
      });
    } catch (e) {}
  }

  /**
   * Game Over Tone: Sad descending sequence (G4 - E4 - C4).
   * @returns {void}
   */
  playGameOver() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392.00, 329.63, 261.63]; // G4, E4, C4
      const step = 0.28;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * step;
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        sub.type = 'sine';
        sub.frequency.setValueAtTime(freq * 0.5, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.24, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        sub.start(startTime);
        osc.stop(startTime + 0.6);
        sub.stop(startTime + 0.6);
      });
    } catch (e) {}
  }

  /**
   * UI Click: Extremely short high-frequency blip (1200Hz, 0.05s).
   * @returns {void}
   */
  playUIClick() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(this._randPitch(1200), now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Metallic Collision: Impact clank using bandpass filtered noise at 3000Hz
   * and dual resonant pings (0.08s).
   * @param {number} [intensity=1.0] Normalized collision force (0.1 to 2.0)
   * @returns {void}
   */
  playCollision(intensity = 1.0) {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const clampedInt = Math.max(0.1, Math.min(2.0, intensity));
      const pitch = this._randPitch(3000);

      if (this._noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(pitch, now);
        filter.Q.setValueAtTime(6.0, now);

        const gain = this.ctx.createGain();
        const targetVol = Math.min(0.45, 0.3 * clampedInt);
        gain.gain.setValueAtTime(targetVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.085);
      }

      // Metallic ring tone
      const ring = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(this._randPitch(1450), now);

      ringGain.gain.setValueAtTime(0.12 * clampedInt, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      ring.connect(ringGain);
      ringGain.connect(this.sfxGain);

      ring.start(now);
      ring.stop(now + 0.08);
    } catch (e) {}
  }

  /**
   * Generator Recharge: Continuous rising frequency sweep (100Hz -> 2000Hz) over 1.5s
   * with crescendo gain.
   * @returns {void}
   */
  playGeneratorRecharge() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const dur = 1.5;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + dur);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(200, now);
      osc2.frequency.exponentialRampToValueAtTime(4000, now + dur);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.35, now + dur * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + dur);
      osc2.stop(now + dur);

      // Climax electrical burst
      setTimeout(() => {
        if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
        try {
          const t = this.ctx.currentTime;
          const chime = this.ctx.createOscillator();
          const cGain = this.ctx.createGain();
          chime.type = 'sine';
          chime.frequency.setValueAtTime(1760, t);
          cGain.gain.setValueAtTime(0.28, t);
          cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          chime.connect(cGain);
          cGain.connect(this.sfxGain);
          chime.start(t);
          chime.stop(t + 0.35);
        } catch (err) {}
      }, dur * 1000);
    } catch (e) {}
  }

  /**
   * Radiation Alert: Geiger-counter style rapid randomized micro-pulses.
   * @returns {void}
   */
  playAlertRadiation() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const numClicks = Math.floor(Math.random() * 4) + 4; // 4 to 7 clicks

      for (let i = 0; i < numClicks; i++) {
        const offset = Math.random() * 0.35;
        const clickTime = now + offset;

        if (this._noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this._noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(this._randPitch(2600), clickTime);
          filter.Q.setValueAtTime(8.0, clickTime);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.25, clickTime);
          gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.012);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);

          noise.start(clickTime);
          noise.stop(clickTime + 0.015);
        }
      }
    } catch (e) {}
  }

  /**
   * Airlock Decompression Hiss: Pressurized air chamber equalizer.
   * @returns {void}
   */
  playAirlockHiss() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      if (this._noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.46);
      }
    } catch (e) {}
  }

  /**
   * Rewarded Ad Revive Chime: Positive ascending chord on emergency rescue.
   * @returns {void}
   */
  playRevive() {
    if (!this._canPlay() || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major chord sweep
      chords.forEach((freq, i) => {
        const startTime = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch (e) {}
  }

  // =========================================================================
  // 3. PROCEDURAL BACKGROUND MUSIC (BGM)
  // =========================================================================

  /**
   * Starts procedural ambient zero-g background music.
   * Generates a continuous low-frequency drone (A1 55Hz + sub) with slow LFO modulation,
   * coupled with a spacey pentatonic melody scheduled recursively at ~75 BPM.
   * @returns {void}
   */
  startBgm() {
    this.init();
    if (this.bgmRunning || !this.ctx || !this.bgmGain) return;
    this.bgmRunning = true;

    try {
      const now = this.ctx.currentTime;

      // 1. Deep Space Drone Synth (55Hz / A1)
      this.bgmDroneOsc = this.ctx.createOscillator();
      this.bgmDroneOsc.type = 'sine';
      this.bgmDroneOsc.frequency.setValueAtTime(55, now);

      this.bgmDroneFilter = this.ctx.createBiquadFilter();
      this.bgmDroneFilter.type = 'lowpass';
      this.bgmDroneFilter.frequency.setValueAtTime(160, now);

      this.bgmDroneGain = this.ctx.createGain();
      this.bgmDroneGain.gain.setValueAtTime(0.001, now);
      this.bgmDroneGain.gain.linearRampToValueAtTime(0.45, now + 2.0);

      // Slow LFO breathing effect (0.12 Hz)
      this.bgmDroneLfo = this.ctx.createOscillator();
      this.bgmDroneLfo.type = 'sine';
      this.bgmDroneLfo.frequency.setValueAtTime(0.12, now);

      this.bgmDroneLfoGain = this.ctx.createGain();
      this.bgmDroneLfoGain.gain.setValueAtTime(0.15, now);

      this.bgmDroneLfo.connect(this.bgmDroneLfoGain);
      this.bgmDroneLfoGain.connect(this.bgmDroneGain.gain);

      this.bgmDroneOsc.connect(this.bgmDroneFilter);
      this.bgmDroneFilter.connect(this.bgmDroneGain);
      this.bgmDroneGain.connect(this.bgmGain);

      this.bgmDroneOsc.start(now);
      this.bgmDroneLfo.start(now);

      // 2. Begin Generative Space Pentatonic Melody Loop
      this._scheduleNextBgmNote();
    } catch (e) {
      console.warn('[Audio] Failed to start procedural BGM:', e);
    }
  }

  /**
   * Recursively schedules procedural pentatonic notes at ~75 BPM.
   * Notes: A3 (220Hz), C4 (261.63Hz), D4 (293.66Hz), E4 (329.63Hz), G4 (392Hz), A4 (440Hz).
   * @private
   */
  _scheduleNextBgmNote() {
    if (!this.bgmRunning) return;

    // ~75 BPM -> ~800ms per beat. Interval is 2 to 4 beats.
    const beatMs = 800;
    const intervalBeats = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 beats
    const delay = intervalBeats * beatMs;

    this.bgmTimer = setTimeout(() => {
      if (!this.bgmRunning || !this.ctx || !this.bgmGain) return;
      if (this.isMuted || this.isAdMuted) {
        this._scheduleNextBgmNote();
        return;
      }

      try {
        const pentatonicScale = [
          220.00, // A3
          261.63, // C4
          293.66, // D4
          329.63, // E4
          392.00, // G4
          440.00, // A4
          523.25, // C5
          659.25  // E5
        ];

        const noteFreq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
        const now = this.ctx.currentTime;
        const noteDuration = 1.6;

        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const noteFilter = this.ctx.createBiquadFilter();
        const noteGain = this.ctx.createGain();

        // Warm triangle note
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        // Sine sub-harmonic
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(noteFreq * 0.5, now);

        noteFilter.type = 'lowpass';
        noteFilter.frequency.setValueAtTime(1400, now);

        // Smooth atmospheric envelope (soft attack, long dreamy tail)
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.linearRampToValueAtTime(0.26, now + 0.12);
        noteGain.gain.setValueAtTime(0.22, now + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);

        osc.connect(noteFilter);
        subOsc.connect(noteFilter);
        noteFilter.connect(noteGain);
        noteGain.connect(this.bgmGain);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + noteDuration);
        subOsc.stop(now + noteDuration);
      } catch (err) {}

      this._scheduleNextBgmNote();
    }, delay);
  }

  /**
   * Stops procedural background music and clears all timers and nodes gracefully.
   * @returns {void}
   */
  stopBgm() {
    this.bgmRunning = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }

    if (this.ctx && this.bgmDroneGain) {
      try {
        const now = this.ctx.currentTime;
        this.bgmDroneGain.gain.cancelScheduledValues(now);
        this.bgmDroneGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);

        setTimeout(() => {
          if (this.bgmDroneOsc) {
            try { this.bgmDroneOsc.stop(); } catch (e) {}
            this.bgmDroneOsc.disconnect();
            this.bgmDroneOsc = null;
          }
          if (this.bgmDroneLfo) {
            try { this.bgmDroneLfo.stop(); } catch (e) {}
            this.bgmDroneLfo.disconnect();
            this.bgmDroneLfo = null;
          }
          if (this.bgmDroneGain) {
            this.bgmDroneGain.disconnect();
            this.bgmDroneGain = null;
          }
        }, 650);
      } catch (e) {}
    }
  }
}

/**
 * Singleton instance of the procedural sound system.
 * @type {SoundSystem}
 */
export const sound = new SoundSystem();
export default sound;
export { SoundSystem };
