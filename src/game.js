/**
 * @fileoverview Motor Central de Jogo: Faxina Gravitacional: Caos Zero-G!
 * 
 * Arquitetura & Especificações Técnicas Oficiais CrazyGames:
 * - Resolução Lógica 960 x 540 (16:9 responsivo com Letterbox/Pillarbox centralizado)
 * - Fixed Timestep com acumulador delta time invariante em 60Hz, 144Hz e 165Hz
 * - Ragdoll física de Zé-G em gravidade zero (Verlet + Distance Constraints)
 * - Propulsores de Impulso de Lixo / Detritos com partículas dinâmicas
 * - Feixe / Viga de Tração Gravitacional (Tractor Beam) com renderização de cone energético
 * - Mãos Magnéticas do Zelador com arcos elétricos e arremesso inercial
 * - Sistema de Tração Gravitacional (STG) & Geradores Gravitacionais Ativos
 * - Resíduos Instáveis Voláteis com detecção de choque e explosões procedurais
 * - Checkpoints Mid-Level com salvamento de estado e anúncios Rewarded
 * - CrazyGames SDK v3: gameplayStart / gameplayStop, Mute de áudio e congelamento de física
 */

import { sound } from './audio.js';
import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';
import { i18n } from './i18n.js';
import { LEVELS } from './levels.js';
import { ZeGRagdoll } from './player.js';
import {
  SpaceDebris,
  VolatileResidue,
  DisposalUnit,
  GravityGenerator,
  Checkpoint,
  TractorBeam,
  MagneticHand,
  Wall,
  ParticleSystem,
  resolveCollisions
} from './physics.js';

export class GameEngine {
  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {any} hudInstance
   */
  constructor(canvasEl, hudInstance) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.hud = hudInstance;

    // Resolução Lógica Invariante (16:9)
    this.V_WIDTH = 960;
    this.V_HEIGHT = 540;

    // Fixed Timestep Rigoroso (60Hz invariante para 60Hz, 144Hz, 165Hz)
    this.FIXED_DT = 1 / 60;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.isPaused = false;
    this.isAdPaused = false;
    this.isRunning = false;
    this.animId = null;

    // Estado da Partida
    this.currentLevelIndex = 0;
    this.currentLevel = LEVELS[0];
    this.attempts = 3;
    this.maxAttempts = 3;
    this.score = 0;
    this.levelTime = 0;
    this.isHandlingVictory = false;
    this.isHandlingGameOver = false;

    // Entidades de Simulação
    /** @type {ZeGRagdoll|null} */
    this.player = null;
    /** @type {Wall[]} */
    this.walls = [];
    /** @type {SpaceDebris[]} */
    this.debris = [];
    /** @type {VolatileResidue[]} */
    this.volatiles = [];
    /** @type {DisposalUnit[]} */
    this.disposalUnits = [];
    /** @type {GravityGenerator[]} */
    this.generators = [];
    /** @type {Checkpoint[]} */
    this.checkpoints = [];
    /** @type {Checkpoint|null} */
    this.activeCheckpoint = null;

    // Ferramentas do Zelador Zé-G
    this.tractorBeam = new TractorBeam({ range: 180, strength: 420 });
    this.magneticHand = new MagneticHand({ reach: 70, springStrength: 18 });
    this.particleSystem = new ParticleSystem(400);

    // Sistema de Pulso Gravitacional
    this.gravityCharge = 100;
    this.gravityPulseCooldown = 0;

    // Trauma & Screen Shake Exponencial Amortecido (Game Juice Skill)
    this.trauma = 0;
    this.shakeDecay = 1.4;
    this.maxShakeOffset = 14;
    this.maxShakeAngle = 0.05;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeAngle = 0;

    // Input States
    this.keys = {};
    this.mouse = {
      x: this.V_WIDTH / 2,
      y: this.V_HEIGHT / 2,
      isDown: false,
      rightDown: false
    };
    this.virtualJoystick = { x: 0, y: 0 };

    // Fatores de Escala de Renderização
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Background Stars
    this.bgStars = [];
    for (let i = 0; i < 90; i++) {
      this.bgStars.push({
        x: Math.random() * this.V_WIDTH,
        y: Math.random() * this.V_HEIGHT,
        r: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 3 + 1
      });
    }

    this.initInput();
    this.resizeCanvas();
    this.resizeHandler = () => this.resizeCanvas();
    window.addEventListener('resize', this.resizeHandler);

    // Sincronização rigorosa CrazyGames SDK v3 para MUTE e PAUSA
    crazyGames.setAdCallbacks(
      () => {
        this.isAdPaused = true;
        sound.muteForAd();
      },
      () => {
        this.isAdPaused = false;
        sound.unmuteAfterAd();
      }
    );

    // Carrega progresso salvo
    const startLevelId = storage.getUnlockedLevel() || 1;
    this.loadLevel(startLevelId);

    // Inicia música de fundo procedural
    sound.startBgm();
  }

  /**
   * Redimensiona o canvas mantendo a proporção exata 16:9 com aspect-fit
   */
  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement || document.body;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;

    const targetAspect = this.V_WIDTH / this.V_HEIGHT;
    const windowAspect = w / h;

    if (windowAspect > targetAspect) {
      this.scale = h / this.V_HEIGHT;
      this.offsetX = (w - this.V_WIDTH * this.scale) / 2;
      this.offsetY = 0;
    } else {
      this.scale = w / this.V_WIDTH;
      this.offsetX = 0;
      this.offsetY = (h - this.V_HEIGHT * this.scale) / 2;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.dpr = dpr;
  }

  /**
   * Converte coordenadas de tela/toque para o espaço lógico de coordenadas (960x540)
   */
  screenToLogical(screenX, screenY) {
    const lx = (screenX - this.offsetX) / this.scale;
    const ly = (screenY - this.offsetY) / this.scale;
    return {
      x: Math.max(0, Math.min(this.V_WIDTH, lx)),
      y: Math.max(0, Math.min(this.V_HEIGHT, ly))
    };
  }

  /**
   * Inicializa ouvintes de eventos para Desktop (WASD/Mouse) e Mobile (Touch)
   */
  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Pular ou reiniciar com R
      if (e.key === 'r' || e.key === 'R') {
        this.restartLevel();
      }
      // Pulso Gravitacional com Barra de Espaço
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerGravityPulse();
      }
      // Mãos Magnéticas com Shift
      if (e.key === 'Shift') {
        this.toggleMagneticGrab();
      }
      // Pausa com P ou Escape
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.hud && typeof this.hud.togglePause === 'function') {
          this.hud.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') {
        this.releaseMagneticGrab();
      }
    });

    // Eventos do Mouse
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.screenToLogical(e.clientX, e.clientY);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        const pos = this.screenToLogical(e.clientX, e.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.tractorBeam.isActive = true;
        sound.playGravityBeam?.();
      } else if (e.button === 2) {
        e.preventDefault();
        this.toggleMagneticGrab();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
        this.tractorBeam.isActive = false;
      } else if (e.button === 2) {
        this.releaseMagneticGrab();
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Suporte ao Joystick Virtual Móvel
    window.addEventListener('virtual-joystick-move', (e) => {
      if (e.detail) {
        this.virtualJoystick.x = e.detail.x || 0;
        this.virtualJoystick.y = e.detail.y || 0;
      }
    });
  }

  /**
   * Adiciona trauma à câmera para trepidação exponencial amortecida (Screen Shake)
   */
  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Carrega e inicializa uma fase da estação
   */
  loadLevel(levelId) {
    const lvl = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    this.currentLevel = lvl;
    this.currentLevelIndex = lvl.id - 1;
    this.isHandlingVictory = false;
    this.isHandlingGameOver = false;
    this.hasRevivedThisLevel = false;
    this.levelTime = 0;
    this.gravityCharge = 100;
    this.activeCheckpoint = null;

    // Paredes de contorno obrigatórias da câmara (960x540)
    this.walls = [
      new Wall({ x1: 24, y1: 24, x2: this.V_WIDTH - 24, y2: 24, thickness: 20 }),
      new Wall({ x1: this.V_WIDTH - 24, y1: 24, x2: this.V_WIDTH - 24, y2: this.V_HEIGHT - 24, thickness: 20 }),
      new Wall({ x1: this.V_WIDTH - 24, y1: this.V_HEIGHT - 24, x2: 24, y2: this.V_HEIGHT - 24, thickness: 20 }),
      new Wall({ x1: 24, y1: this.V_HEIGHT - 24, x2: 24, y2: 24, thickness: 20 })
    ];

    // Paredes internas da fase
    if (lvl.walls && Array.isArray(lvl.walls)) {
      for (const w of lvl.walls) {
        this.walls.push(new Wall({
          x1: w.x1,
          y1: w.y1,
          x2: w.x2,
          y2: w.y2,
          thickness: w.thickness || 18
        }));
      }
    }

    // Inicializa Zelador Zé-G
    const startPos = lvl.playerStart || { x: 180, y: 270 };
    this.player = new ZeGRagdoll(startPos.x, startPos.y);

    // Inicializa Detritos Espaciais
    this.debris = [];
    if (lvl.debris && Array.isArray(lvl.debris)) {
      for (const d of lvl.debris) {
        this.debris.push(new SpaceDebris({
          type: d.type || 'can',
          x: d.x,
          y: d.y,
          radius: d.radius || 20
        }));
      }
    }

    // Inicializa Resíduos Voláteis Radioativos
    this.volatiles = [];
    if (lvl.volatiles && Array.isArray(lvl.volatiles)) {
      for (const v of lvl.volatiles) {
        this.volatiles.push(new VolatileResidue({
          x: v.x,
          y: v.y,
          radius: v.radius || 22
        }));
      }
    }

    // Inicializa Escotilhas / Unidades de Incineração
    this.disposalUnits = [];
    if (lvl.disposalUnits && Array.isArray(lvl.disposalUnits)) {
      for (const u of lvl.disposalUnits) {
        this.disposalUnits.push(new DisposalUnit({
          x: u.x,
          y: u.y,
          width: u.width || 110,
          height: u.height || 110,
          color: u.color || '#10b981'
        }));
      }
    }

    // Inicializa Geradores Gravitacionais
    this.generators = [];
    if (lvl.generators && Array.isArray(lvl.generators)) {
      for (const g of lvl.generators) {
        this.generators.push(new GravityGenerator({
          x: g.x,
          y: g.y,
          radius: g.radius || 45,
          fieldRadius: g.fieldRadius || 180,
          strength: g.strength || 320,
          charge: g.charge || 100
        }));
      }
    }

    // Inicializa Checkpoints
    this.checkpoints = [];
    if (lvl.checkpoints && Array.isArray(lvl.checkpoints)) {
      for (const cp of lvl.checkpoints) {
        this.checkpoints.push(new Checkpoint({
          x: cp.x,
          y: cp.y
        }));
      }
    }

    // Atualiza HUD
    if (this.hud) {
      this.hud.updateLevel(lvl);
      this.hud.updateAttempts(this.attempts, this.maxAttempts);
      this.hud.updateStars(storage.getLevelStars(lvl.id), 3);
      this.hud.updateScore(this.score);
      this.hud.updateHealth(this.player.health, 100);
      this.hud.updateGravityCharge(this.gravityCharge);
      this.hud.updateTrash(0, this.debris.length);
    }
  }

  /**
   * Reinicia a fase atual
   */
  restartLevel() {
    if (this.activeCheckpoint && this.player) {
      // Reinicia no Checkpoint ativo
      this.player.revive(this.activeCheckpoint.x, this.activeCheckpoint.y);
      this.hud?.updateHealth(100);
      sound.playRevive?.();
    } else {
      this.loadLevel(this.currentLevel.id);
      sound.playUIClick?.();
    }
  }

  /**
   * Avança para a próxima fase
   */
  nextLevel() {
    const nextId = this.currentLevel.id + 1;
    if (nextId <= LEVELS.length) {
      storage.setUnlockedLevel(nextId);
      this.loadLevel(nextId);
    } else {
      // Concluiu todos os níveis
      this.hud?.showHint?.(i18n.t('all_levels_beaten'));
      this.loadLevel(1);
    }
  }

  /**
   * Dispara Pulso Gravitacional (Empurrão Radial em Área)
   */
  triggerGravityPulse() {
    if (this.gravityCharge < 100 || !this.player || !this.player.isAlive) return;

    this.gravityCharge = 0;
    this.hud?.updateGravityCharge(0);

    const center = this.player.getCenter();
    sound.playGravityPulse?.();
    this.addTrauma(0.5);

    // Efeito visual de partículas cósmicas em anel
    this.particleSystem.emitExplosion(center.x, center.y, '#00f5ff');

    // Empurra todos os corpos rígidos próximos
    const allBodies = [...this.debris, ...this.volatiles];
    const pulseRadius = 240;
    const pulseForce = 550;

    for (const body of allBodies) {
      if (body.isDisposed) continue;
      const dx = body.x - center.x;
      const dy = body.y - center.y;
      const dist = Math.hypot(dx, dy);
      if (dist < pulseRadius && dist > 1) {
        const factor = (1 - dist / pulseRadius);
        const impulse = pulseForce * factor;
        body.applyImpulse((dx / dist) * impulse, (dy / dist) * impulse);
      }
    }
  }

  /**
   * Alterna as Mãos Magnéticas do Zelador
   */
  toggleMagneticGrab() {
    if (!this.player || !this.player.isAlive) return;
    if (this.magneticHand.grabbedBody) {
      this.releaseMagneticGrab();
    } else {
      const allBodies = [...this.debris, ...this.volatiles];
      const success = this.magneticHand.tryGrab(this.player, allBodies);
      this.hud?.setMagneticActive(success);
    }
  }

  releaseMagneticGrab() {
    if (this.magneticHand.grabbedBody) {
      this.magneticHand.release(this.player);
      this.hud?.setMagneticActive(false);
    }
  }

  toggleTractorBeam() {
    this.tractorBeam.isActive = !this.tractorBeam.isActive;
    this.hud?.setTractorBeamActive(this.tractorBeam.isActive);
    if (this.tractorBeam.isActive) {
      sound.playGravityBeam?.();
    }
  }

  /**
   * Inicia o loop de animação contínuo
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    const loop = (now) => {
      if (!this.isRunning) return;
      this.animId = requestAnimationFrame(loop);

      const frameTime = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.isPaused && !this.isAdPaused) {
        this.accumulator += frameTime;
        while (this.accumulator >= this.FIXED_DT) {
          this.fixedUpdate(this.FIXED_DT);
          this.accumulator -= this.FIXED_DT;
        }
      }

      this.render();
    };

    this.animId = requestAnimationFrame(loop);
  }

  /**
   * Pausa e retoma a simulação
   */
  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  /**
   * Atualização com Fixed Timestep (60Hz constante e determinístico)
   */
  fixedUpdate(dt) {
    if (this.isHandlingVictory || this.isHandlingGameOver) return;

    this.levelTime += dt;
    this.hud?.updateTimer(Math.floor(this.levelTime));

    // Recarga passiva da Carga Gravitacional
    if (this.gravityCharge < 100) {
      this.gravityCharge = Math.min(100, this.gravityCharge + dt * 14);
      this.hud?.updateGravityCharge(this.gravityCharge);
    }

    // 1. Processamento de Controles do Jogador Zé-G
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Soma entrada do joystick virtual
    moveX += this.virtualJoystick.x;
    moveY += this.virtualJoystick.y;

    const inputLen = Math.hypot(moveX, moveY);
    if (inputLen > 0.05 && this.player && this.player.isAlive) {
      const normX = moveX / Math.max(1, inputLen);
      const normY = moveY / Math.max(1, inputLen);
      this.player.setThrustInput(normX, normY);
    } else if (this.player) {
      this.player.setThrustInput(0, 0);
    }

    // 2. Atualiza Zé-G Ragdoll
    if (this.player) {
      this.player.update(dt, this.walls, this.particleSystem);
      this.hud?.updateHealth(this.player.health);

      if (!this.player.isAlive && !this.isHandlingGameOver) {
        this.triggerGameOver();
        return;
      }
    }

    const playerCenter = this.player ? this.player.getCenter() : { x: 0, y: 0 };

    // 3. Atualiza Feixe de Tração (Tractor Beam)
    if (this.tractorBeam.isActive && this.player) {
      this.tractorBeam.setAim(playerCenter.x, playerCenter.y, this.mouse.x, this.mouse.y);
      const allBodies = [...this.debris, ...this.volatiles];
      for (const b of allBodies) {
        if (!b.isDisposed) {
          this.tractorBeam.applyTo(b, dt);
        }
      }
    }
    this.tractorBeam.update(dt);

    // 4. Atualiza Mãos Magnéticas
    if (this.player) {
      this.magneticHand.update(this.player, dt);
    }

    // 5. Atualiza Geradores Gravitacionais Ativos
    for (const gen of this.generators) {
      gen.update(dt);
      if (this.player && this.player.isAlive) {
        gen.applyField(this.player, dt);
        const dist = Math.hypot(this.player.getCenter().x - gen.x, this.player.getCenter().y - gen.y);
        if (dist < gen.radius + 35) {
          this.gravityCharge = Math.min(100, this.gravityCharge + dt * 45);
          this.hud?.updateGravityCharge(this.gravityCharge);
        }
      }
      for (const b of [...this.debris, ...this.volatiles]) {
        if (!b.isDisposed) {
          gen.applyField(b, dt);
        }
      }
    }

    // 6. Atualiza Checkpoints
    for (const cp of this.checkpoints) {
      cp.update(dt);
      if (this.player && this.player.isAlive) {
        const remaining = this.debris.filter(d => !d.isDisposed).length;
        if (cp.checkActivation(this.player, remaining)) {
          this.activeCheckpoint = cp;
          this.hud?.showHint?.(i18n.t('checkpoint_saved'));
          sound.playCheckpointReached?.();
        }
      }
    }

    // 7. Atualiza Física dos Detritos
    for (const d of this.debris) {
      if (d.isDisposed) continue;
      d.update(dt);

      // Checa sucção nas escotilhas de descarte
      for (const u of this.disposalUnits) {
        u.applySuction(d, dt);
        if (u.checkDisposal(d)) {
          d.startDisposal(u);
          this.score += 150;
          this.hud?.updateScore(this.score);
          sound.playTrashDispose?.();
          this.particleSystem.emitDisposal(u.x, u.y);
          this.addTrauma(0.15);

          // Atualiza contador de lixo no HUD
          const disposedCount = this.debris.filter(deb => deb.isDisposed).length;
          this.hud?.updateTrash(disposedCount, this.debris.length);
        }
      }
    }

    // 8. Atualiza Resíduos Voláteis Radioativos
    for (const v of this.volatiles) {
      v.update(dt);

      // Dano por proximidade perigosa ou impacto em Zé-G
      if (this.player && this.player.isAlive && !this.player.isInvulnerable) {
        const dist = Math.hypot(v.x - playerCenter.x, v.y - playerCenter.y);
        if (dist < v.radius + 24) {
          this.player.takeDamage(25);
          this.addTrauma(0.35);
          sound.playAlertRadiation?.();
        }
      }

      // Checa sucção cuidadosa nas escotilhas
      for (const u of this.disposalUnits) {
        u.applySuction(v, dt);
        if (u.checkDisposal(v)) {
          v.isDisposed = true;
          this.score += 300;
          this.hud?.updateScore(this.score);
          sound.playTrashDispose?.();
          this.particleSystem.emitDisposal(u.x, u.y);
        }
      }
    }

    // 9. Resolução de Colisões Mútuas e Paredes
    const activeBodies = [...this.debris.filter(d => !d.isDisposed), ...this.volatiles.filter(v => !v.isDisposed)];
    resolveCollisions(activeBodies, this.walls, this.particleSystem, this.player);

    // 10. Atualiza Sistema de Partículas
    this.particleSystem.update(dt);

    // 11. Atualiza Screen Shake Trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.shakeDecay * dt);
      const shake = this.trauma * this.trauma;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.maxShakeOffset * shake;
      this.shakeAngle = (Math.random() * 2 - 1) * this.maxShakeAngle * shake;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeAngle = 0;
    }

    // 12. Verifica Condição de Vitória (Todos os detritos limpos)
    const remainingDebris = this.debris.filter(d => !d.isDisposed).length;
    if (remainingDebris === 0 && !this.isHandlingVictory) {
      this.triggerVictory();
    }
  }

  /**
   * Dispara a tela de vitória com cálculo de estrelas e salvamento
   */
  triggerVictory() {
    this.isHandlingVictory = true;

    // Cálculo de Estrelas baseado no tempo
    const thresholds = this.currentLevel.starsThresholds || { time3: 35, time2: 60 };
    let stars = 1;
    if (this.levelTime <= thresholds.time3) {
      stars = 3;
    } else if (this.levelTime <= thresholds.time2) {
      stars = 2;
    }

    // Salva progresso no Storage
    storage.setLevelStars(this.currentLevel.id, stars);
    storage.setLevelScore(this.currentLevel.id, this.score);
    storage.setUnlockedLevel(this.currentLevel.id + 1);

    sound.playLevelComplete?.();

    if (this.hud) {
      this.hud.showVictoryModal(
        stars,
        this.score,
        this.levelTime,
        this.debris.length,
        () => this.nextLevel(),
        () => this.restartLevel()
      );
    }
  }

  /**
   * Dispara a tela de Game Over (Tentativa Esgotada / Radiação Fatal)
   */
  triggerGameOver() {
    this.isHandlingGameOver = true;
    sound.playGameOver?.();

    if (this.hud) {
      const canRevive = !this.hasRevivedThisLevel;
      this.hud.showGameOverModal(
        () => {
          // Callback de Revive com Rewarded Ad (com 3s de invulnerabilidade)
          this.hasRevivedThisLevel = true;
          if (this.player) {
            const rx = this.activeCheckpoint ? this.activeCheckpoint.x : this.currentLevel.playerStart.x;
            const ry = this.activeCheckpoint ? this.activeCheckpoint.y : this.currentLevel.playerStart.y;
            this.player.revive(rx, ry);
            this.isHandlingGameOver = false;
            sound.playRevive?.();
          }
        },
        () => {
          this.restartLevel();
        },
        canRevive
      );
    }
  }

  /**
   * Renderização completa de todos os elementos na tela
   */
  render() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    // Limpa a tela com preto espacial
    this.ctx.fillStyle = '#01040a';
    this.ctx.fillRect(0, 0, w, h);

    // Aplica Transformada de Escala + Screen Shake
    this.ctx.translate(this.offsetX + this.shakeOffsetX, this.offsetY + this.shakeOffsetY);
    this.ctx.scale(this.scale, this.scale);
    if (this.shakeAngle !== 0) {
      this.ctx.translate(this.V_WIDTH / 2, this.V_HEIGHT / 2);
      this.ctx.rotate(this.shakeAngle);
      this.ctx.translate(-this.V_WIDTH / 2, -this.V_HEIGHT / 2);
    }

    // 1. Fundo Espacial da Câmara
    this.renderBackground();

    // 2. Unidades de Incineração / Escotilhas
    for (const u of this.disposalUnits) {
      u.render(this.ctx);
    }

    // 3. Geradores Gravitacionais
    for (const g of this.generators) {
      g.render(this.ctx);
    }

    // 4. Checkpoints
    for (const cp of this.checkpoints) {
      cp.render(this.ctx);
    }

    // 5. Paredes da Câmara
    for (const wall of this.walls) {
      wall.render(this.ctx);
    }

    // 6. Detritos Espaciais
    for (const d of this.debris) {
      d.render(this.ctx);
    }

    // 7. Resíduos Voláteis
    for (const v of this.volatiles) {
      v.render(this.ctx);
    }

    // 8. Feixe de Tração (Tractor Beam)
    if (this.tractorBeam.isActive) {
      this.tractorBeam.render(this.ctx);
    }

    // 9. Mãos Magnéticas
    if (this.player) {
      this.magneticHand.render(this.ctx, this.player);
    }

    // 10. Jogador Zé-G Ragdoll
    if (this.player) {
      this.player.render(this.ctx);
    }

    // 11. Partículas
    this.particleSystem.render(this.ctx);

    this.ctx.restore();
  }

  /**
   * Renderiza o fundo metálico da câmara espacial com estrelas e painéis
   */
  renderBackground() {
    // Fundo base temático do setor
    this.ctx.fillStyle = this.currentLevel.bgColor || '#030818';
    this.ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

    // Estrelas cintilantes através das janelas
    this.ctx.save();
    for (const s of this.bgStars) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = s.alpha * 0.45;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Grade sutil de painéis metálicos da estação
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    this.ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < this.V_WIDTH; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.V_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.V_HEIGHT; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.V_WIDTH, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}

export default GameEngine;
