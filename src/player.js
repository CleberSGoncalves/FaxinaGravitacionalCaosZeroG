/**
 * @fileoverview Zé-G Ragdoll Space Janitor character for Faxina Gravitacional: Caos Zero-G!
 * Implements a Verlet-integrated multi-segment ragdoll with realistic zero-gravity inertia,
 * dual-nozzle backpack thrusters, procedural cartoon space suit graphics, and collision response.
 * Pure Canvas 2D procedural rendering - zero external image files.
 */

import { sound } from './audio.js';

/**
 * Safely calls audio method without crashing if audio engine is inactive.
 * @param {string} method
 * @param {...*} args
 */
function safeSound(method, ...args) {
  try {
    if (sound && typeof sound[method] === 'function') {
      sound[method](...args);
    }
  } catch (err) {
    // Non-blocking audio fallback
  }
}

/**
 * 2D distance constraint between two ragdoll nodes.
 */
class DistanceConstraint {
  /**
   * @param {Object} p1 - First point {x, y, oldX, oldY, mass}
   * @param {Object} p2 - Second point {x, y, oldX, oldY, mass}
   * @param {number} length - Target rest length
   * @param {number} [stiffness=1.0] - Relaxation strength (0 to 1)
   */
  constructor(p1, p2, length, stiffness = 1.0) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
    this.stiffness = stiffness;
  }

  solve() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const diff = (dist - this.length) / dist;

    const totalMass = (this.p1.mass || 1) + (this.p2.mass || 1);
    const m1Ratio = (this.p2.mass || 1) / totalMass;
    const m2Ratio = (this.p1.mass || 1) / totalMass;

    const offsetX = dx * diff * 0.5 * this.stiffness;
    const offsetY = dy * diff * 0.5 * this.stiffness;

    if (!this.p1.isPinned) {
      this.p1.x += offsetX * m1Ratio * 2;
      this.p1.y += offsetY * m1Ratio * 2;
    }
    if (!this.p2.isPinned) {
      this.p2.x -= offsetX * m2Ratio * 2;
      this.p2.y -= offsetY * m2Ratio * 2;
    }
  }
}

/**
 * Zé-G Ragdoll character class.
 */
export class ZeGRagdoll {
  /**
   * @param {number} startX
   * @param {number} startY
   */
  constructor(startX = 480, startY = 270) {
    // Core game state
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.hasGrabbedObject = false;
    this.grabbedObject = null;
    this.magneticRange = 65;
    this.tractorBeamActive = false;

    // Thruster state
    this.thrusterActive = false;
    this.thrustX = 0;
    this.thrustY = 0;
    this.thrustSoundThrottle = 0;

    // Facing & animation
    this.angle = 0;
    this.targetAngle = 0;
    this.facingDirection = 1; // 1 = right, -1 = left
    this.eyeBlinkTimer = 0;
    this.damageFlashTimer = 0;

    // Collision proxy properties
    this.radius = 24;
    this.linearDamping = 0.993; // Zero-G drift inertia retention
    this.angularDamping = 0.985;

    // Initialize ragdoll skeleton segments
    this.initSkeleton(startX, startY);
  }

  /**
   * Builds the anatomical segments and distance constraints of Zé-G.
   * @param {number} cx
   * @param {number} cy
   */
  initSkeleton(cx, cy) {
    // Segments: each has { x, y, oldX, oldY, vx, vy, mass, radius }
    this.torso = {
      x: cx,
      y: cy,
      oldX: cx,
      oldY: cy,
      vx: 0,
      vy: 0,
      mass: 3.0,
      radius: 18
    };

    this.head = {
      x: cx,
      y: cy - 26,
      oldX: cx,
      oldY: cy - 26,
      vx: 0,
      vy: 0,
      mass: 1.2,
      radius: 14
    };

    // Left Arm
    this.leftElbow = {
      x: cx - 18,
      y: cy - 10,
      oldX: cx - 18,
      oldY: cy - 10,
      vx: 0,
      vy: 0,
      mass: 0.6,
      radius: 6
    };
    this.leftHand = {
      x: cx - 28,
      y: cy + 4,
      oldX: cx - 28,
      oldY: cy + 4,
      vx: 0,
      vy: 0,
      mass: 0.5,
      radius: 7
    };

    // Right Arm
    this.rightElbow = {
      x: cx + 18,
      y: cy - 10,
      oldX: cx + 18,
      oldY: cy - 10,
      vx: 0,
      vy: 0,
      mass: 0.6,
      radius: 6
    };
    this.rightHand = {
      x: cx + 28,
      y: cy + 4,
      oldX: cx + 28,
      oldY: cy + 4,
      vx: 0,
      vy: 0,
      mass: 0.5,
      radius: 7
    };

    // Left Leg
    this.leftKnee = {
      x: cx - 12,
      y: cy + 22,
      oldX: cx - 12,
      oldY: cy + 22,
      vx: 0,
      vy: 0,
      mass: 0.8,
      radius: 7
    };
    this.leftFoot = {
      x: cx - 14,
      y: cy + 40,
      oldX: cx - 14,
      oldY: cy + 40,
      vx: 0,
      vy: 0,
      mass: 0.6,
      radius: 8
    };

    // Right Leg
    this.rightKnee = {
      x: cx + 12,
      y: cy + 22,
      oldX: cx + 12,
      oldY: cy + 22,
      vx: 0,
      vy: 0,
      mass: 0.8,
      radius: 7
    };
    this.rightFoot = {
      x: cx + 14,
      y: cy + 40,
      oldX: cx + 14,
      oldY: cy + 40,
      vx: 0,
      vy: 0,
      mass: 0.6,
      radius: 8
    };

    // Array of all points for integration and collisions
    this.points = [
      this.head,
      this.torso,
      this.leftElbow,
      this.leftHand,
      this.rightElbow,
      this.rightHand,
      this.leftKnee,
      this.leftFoot,
      this.rightKnee,
      this.rightFoot
    ];

    // Distance constraints
    this.constraints = [
      // Spine: Head to Torso
      new DistanceConstraint(this.head, this.torso, 24, 0.95),

      // Left Arm: Torso -> Elbow -> Hand
      new DistanceConstraint(this.torso, this.leftElbow, 16, 0.9),
      new DistanceConstraint(this.leftElbow, this.leftHand, 16, 0.9),

      // Right Arm: Torso -> Elbow -> Hand
      new DistanceConstraint(this.torso, this.rightElbow, 16, 0.9),
      new DistanceConstraint(this.rightElbow, this.rightHand, 16, 0.9),

      // Left Leg: Torso -> Knee -> Foot
      new DistanceConstraint(this.torso, this.leftKnee, 20, 0.92),
      new DistanceConstraint(this.leftKnee, this.leftFoot, 20, 0.92),

      // Right Leg: Torso -> Knee -> Foot
      new DistanceConstraint(this.torso, this.rightKnee, 20, 0.92),
      new DistanceConstraint(this.rightKnee, this.rightFoot, 20, 0.92),

      // Structural cross-constraints (prevent unnatural limp folding)
      new DistanceConstraint(this.leftElbow, this.rightElbow, 34, 0.4),
      new DistanceConstraint(this.leftKnee, this.rightKnee, 24, 0.45),
      new DistanceConstraint(this.head, this.leftFoot, 66, 0.2),
      new DistanceConstraint(this.head, this.rightFoot, 66, 0.2)
    ];
  }

  /**
   * Returns central coordinates of Zé-G (torso center).
   * @returns {{x: number, y: number}}
   */
  getCenter() {
    return { x: this.torso.x, y: this.torso.y };
  }

  /**
   * Current overall velocity vector based on torso.
   */
  get vx() {
    return this.torso.vx;
  }
  set vx(val) {
    this.torso.vx = val;
  }

  get vy() {
    return this.torso.vy;
  }
  set vy(val) {
    this.torso.vy = val;
  }

  /**
   * Applies impulse directly to torso and head nodes.
   * @param {number} ix
   * @param {number} iy
   */
  applyImpulse(ix, iy) {
    if (!this.isAlive) return;
    this.torso.vx += ix / this.torso.mass;
    this.torso.vy += iy / this.torso.mass;
    this.head.vx += (ix * 0.4) / this.head.mass;
    this.head.vy += (iy * 0.4) / this.head.mass;
  }

  /**
   * Applies continuous force to Zé-G.
   * @param {number} fx
   * @param {number} fy
   */
  applyForce(fx, fy) {
    if (!this.isAlive) return;
    this.torso.vx += (fx / this.torso.mass) * (1 / 60);
    this.torso.vy += (fy / this.torso.mass) * (1 / 60);
  }

  /**
   * Applies gravitational pull toward a specific point (e.g. Gravity Generator).
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} strength
   */
  applyGravityPull(targetX, targetY, strength = 260) {
    if (!this.isAlive) return;
    const dx = targetX - this.torso.x;
    const dy = targetY - this.torso.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    this.torso.vx += nx * strength * (1 / 60);
    this.torso.vy += ny * strength * (1 / 60);
  }

  /**
   * Sets thruster steering input from keyboard or virtual joystick.
   * @param {number} ix - Horizontal input (-1 to 1)
   * @param {number} iy - Vertical input (-1 to 1)
   */
  setThrustInput(ix, iy) {
    if (!this.isAlive) {
      this.thrustX = 0;
      this.thrustY = 0;
      this.thrusterActive = false;
      return;
    }

    const mag = Math.hypot(ix, iy);
    if (mag > 0.05) {
      this.thrustX = ix / Math.max(1, mag);
      this.thrustY = iy / Math.max(1, mag);
      this.thrusterActive = true;
      this.targetAngle = Math.atan2(this.thrustY, this.thrustX);
      if (Math.abs(ix) > 0.1) {
        this.facingDirection = ix > 0 ? 1 : -1;
      }
    } else {
      this.thrustX = 0;
      this.thrustY = 0;
      this.thrusterActive = false;
    }
  }

  /**
   * Deals damage to Zé-G with sound and screen-shake cues.
   * @param {number} amount
   * @returns {boolean} True if player died from this blow
   */
  takeDamage(amount) {
    if (!this.isAlive || this.isInvulnerable) return false;

    this.health = Math.max(0, this.health - amount);
    this.damageFlashTimer = 0.35;
    safeSound('playPlayerHurt');

    if (this.health <= 0) {
      this.isAlive = false;
      safeSound('playPlayerDie');
      return true;
    }

    return false;
  }

  /**
   * Revives Zé-G, healing to full and granting temporary invulnerability.
   * @param {number} rx
   * @param {number} ry
   */
  revive(rx, ry) {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 3.0; // 3 seconds invulnerability
    this.damageFlashTimer = 0;

    // Reset skeleton around revive position
    this.initSkeleton(rx, ry);
    safeSound('playRevive');
  }

  /**
   * Updates ragdoll integration, constraints, thruster forces, and wall collision.
   * @param {number} dt
   * @param {Array<*>} walls
   * @param {ParticleSystem} [particleSystem]
   */
  update(dt, walls = [], particleSystem = null) {
    // Invulnerability and flash timers
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
    }

    this.eyeBlinkTimer += dt;

    // Thruster propulsion force
    if (this.isAlive && this.thrusterActive) {
      const thrustPower = 440; // Propulsion acceleration in px/s^2
      this.torso.vx += this.thrustX * thrustPower * dt;
      this.torso.vy += this.thrustY * thrustPower * dt;
      this.head.vx += this.thrustX * thrustPower * 0.8 * dt;
      this.head.vy += this.thrustY * thrustPower * 0.8 * dt;

      // Thruster sound throttle
      this.thrustSoundThrottle -= dt;
      if (this.thrustSoundThrottle <= 0) {
        safeSound('playThrust');
        this.thrustSoundThrottle = 0.12;
      }

      // Thruster exhaust particles from backpack nozzles
      if (particleSystem) {
        const bpX = this.torso.x - this.thrustX * 16;
        const bpY = this.torso.y - this.thrustY * 16;
        particleSystem.emitThruster(bpX, bpY, Math.atan2(this.thrustY, this.thrustX), 1.0);
      }
    }

    // Semi-implicit Verlet integration for all ragdoll nodes
    const damping = Math.pow(this.linearDamping, dt * 60);

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];

      // Damping
      p.vx *= damping;
      p.vy *= damping;

      // Velocity clamp
      const speedSq = p.vx * p.vx + p.vy * p.vy;
      if (speedSq > 550 * 550) {
        const speed = Math.sqrt(speedSq);
        p.vx = (p.vx / speed) * 550;
        p.vy = (p.vy / speed) * 550;
      }

      // Update position
      p.oldX = p.x;
      p.oldY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Constraint Relaxation Solver (7 iterations for stable joints)
    const iterations = 7;
    for (let iter = 0; iter < iterations; iter++) {
      for (let c = 0; c < this.constraints.length; c++) {
        this.constraints[c].solve();
      }

      // Collide each ragdoll node with chamber walls
      this.solveWallCollisions(walls);
    }

    // Derive torso angle from head-torso vector
    const dx = this.head.x - this.torso.x;
    const dy = this.head.y - this.torso.y;
    this.angle = Math.atan2(dy, dx) + Math.PI * 0.5;
  }

  /**
   * Resolves collisions between ragdoll joint circles and wall segments.
   * @param {Array<*>} walls
   */
  solveWallCollisions(walls) {
    if (!walls || walls.length === 0) return;

    for (let pIdx = 0; pIdx < this.points.length; pIdx++) {
      const p = this.points[pIdx];

      for (let wIdx = 0; wIdx < walls.length; wIdx++) {
        const w = walls[wIdx];
        const wx = w.x2 - w.x1;
        const wy = w.y2 - w.y1;
        const wLenSq = wx * wx + wy * wy;
        if (wLenSq === 0) continue;

        const dot = (p.x - w.x1) * wx + (p.y - w.y1) * wy;
        const t = Math.max(0, Math.min(1, dot / wLenSq));
        const cx = w.x1 + t * wx;
        const cy = w.y1 + t * wy;

        const distSq = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
        const minDist = p.radius + w.thickness * 0.5;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = (p.x - cx) / dist;
          const ny = (p.y - cy) / dist;
          const overlap = minDist - dist;

          p.x += nx * overlap;
          p.y += ny * overlap;

          // Bounce velocity
          const velDot = p.vx * nx + p.vy * ny;
          if (velDot < 0) {
            const restitution = 0.4;
            p.vx -= (1 + restitution) * velDot * nx;
            p.vy -= (1 + restitution) * velDot * ny;
          }
        }
      }
    }
  }

  /**
   * Procedural Canvas 2D rendering of Zé-G, cartoon space janitor.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    // Invulnerability flashing effect
    if (this.isInvulnerable && Math.floor(this.invulnerabilityTimer * 12) % 2 === 0) {
      return; // Skip alternate frames for flicker
    }

    ctx.save();

    // Damage flash tint
    const isFlashing = this.damageFlashTimer > 0;

    // Helper to project point to screen coordinates
    const toScreen = (p) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY
    });

    const sHead = toScreen(this.head);
    const sTorso = toScreen(this.torso);
    const sLElbow = toScreen(this.leftElbow);
    const sLHand = toScreen(this.leftHand);
    const sRElbow = toScreen(this.rightElbow);
    const sRHand = toScreen(this.rightHand);
    const sLKnee = toScreen(this.leftKnee);
    const sLFoot = toScreen(this.leftFoot);
    const sRKnee = toScreen(this.rightKnee);
    const sRFoot = toScreen(this.rightFoot);

    // 1. Draw Thruster Backpack (Behind Torso)
    this.renderBackpack(ctx, sTorso, scale);

    // 2. Draw Legs
    this.renderLimb(ctx, sTorso, sLKnee, 12 * scale, '#e2e8f0');
    this.renderLimb(ctx, sLKnee, sLFoot, 10 * scale, '#cbd5e1');
    this.renderBoot(ctx, sLFoot, scale);

    this.renderLimb(ctx, sTorso, sRKnee, 12 * scale, '#e2e8f0');
    this.renderLimb(ctx, sRKnee, sRFoot, 10 * scale, '#cbd5e1');
    this.renderBoot(ctx, sRFoot, scale);

    // 3. Draw Torso (Space Janitor Suit)
    this.renderTorso(ctx, sTorso, scale, isFlashing);

    // 4. Draw Arms & Janitor Gloves
    this.renderLimb(ctx, sTorso, sLElbow, 10 * scale, '#e2e8f0');
    this.renderLimb(ctx, sLElbow, sLHand, 8 * scale, '#cbd5e1');
    this.renderGlove(ctx, sLHand, scale);

    this.renderLimb(ctx, sTorso, sRElbow, 10 * scale, '#e2e8f0');
    this.renderLimb(ctx, sRElbow, sRHand, 8 * scale, '#cbd5e1');
    this.renderGlove(ctx, sRHand, scale);

    // 5. Draw Helmet & Expressive Face
    this.renderHelmet(ctx, sHead, scale, isFlashing);

    // 6. Invulnerability Energy Shield Aura (if active)
    if (this.isInvulnerable) {
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 12 * scale;
      ctx.lineWidth = Math.max(1.5, 2.5 * scale);
      ctx.beginPath();
      ctx.arc(sTorso.x, sTorso.y, 36 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Procedural rendering of articulated limb segment.
   */
  renderLimb(ctx, p1, p2, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Dark joint ring
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, width * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Procedural janitor yellow rubber dish glove.
   */
  renderGlove(ctx, pos, scale) {
    const r = 7 * scale;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    // Blue magnetic gauntlet wristband
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Procedural space janitor heavy boot.
   */
  renderBoot(ctx, pos, scale) {
    const r = 8 * scale;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(pos.x - r * 0.7, pos.y, r * 1.4, r * 0.5);
  }

  /**
   * Procedural backpack with thruster nozzles.
   */
  renderBackpack(ctx, torsoPos, scale) {
    const w = 22 * scale;
    const h = 26 * scale;

    ctx.save();
    ctx.translate(torsoPos.x, torsoPos.y);
    ctx.rotate(this.angle);

    // Backpack container
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Dual thruster nozzles at bottom of pack
    const nW = 5 * scale;
    const nH = 6 * scale;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-w * 0.35 - nW / 2, h / 2, nW, nH);
    ctx.fillRect(w * 0.35 - nW / 2, h / 2, nW, nH);

    // Active thrust nozzle flare
    if (this.thrusterActive) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-w * 0.35, h / 2 + nH + 3 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.arc(w * 0.35, h / 2 + nH + 3 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Procedural space suit torso.
   */
  renderTorso(ctx, torsoPos, scale, isFlashing) {
    const w = 24 * scale;
    const h = 30 * scale;

    ctx.save();
    ctx.translate(torsoPos.x, torsoPos.y);
    ctx.rotate(this.angle);

    // Padded white suit chest
    ctx.fillStyle = isFlashing ? '#ef4444' : '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, [8 * scale, 8 * scale, 5 * scale, 5 * scale]);
    ctx.fill();

    // Cyan chest patch / emblem
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-w * 0.3, -h * 0.25, w * 0.6, h * 0.2);

    // Janitor utility belt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w / 2, h * 0.25, w, h * 0.2);

    // Golden belt buckle
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-3 * scale, h * 0.25, 6 * scale, h * 0.2);

    ctx.restore();
  }

  /**
   * Procedural bubble helmet with transparent visor, reflections, and expressive cartoon face.
   */
  renderHelmet(ctx, headPos, scale, isFlashing) {
    const r = this.head.radius * scale;

    ctx.save();
    ctx.translate(headPos.x, headPos.y);

    // Outer helmet ring
    ctx.fillStyle = isFlashing ? '#ef4444' : '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0, 0, r + 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.stroke();

    // Transparent cyan bubble visor
    const visorGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    visorGrad.addColorStop(0, '#7dd3fc');
    visorGrad.addColorStop(0.7, '#0284c7');
    visorGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Inside Face: Cute worried cartoon janitor expression
    const eyeSpacing = 4.5 * scale;
    const eyeY = -1.5 * scale;
    const isBlinking = Math.sin(this.eyeBlinkTimer * 2) > 0.96;

    if (!isBlinking && this.isAlive) {
      // White of eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-eyeSpacing, eyeY, 3 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeSpacing, eyeY, 3 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils looking in direction of motion/facing
      const pupilShiftX = this.facingDirection * 1.2 * scale;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-eyeSpacing + pupilShiftX, eyeY, 1.8 * scale, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + pupilShiftX, eyeY, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Worried/surprised wavy cartoon mouth
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.arc(0, 5 * scale, 2.8 * scale, 0, Math.PI);
      ctx.stroke();
    } else if (!this.isAlive) {
      // Dead 'X' eyes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(1, 2 * scale);
      this.drawX(ctx, -eyeSpacing, eyeY, 2.5 * scale);
      this.drawX(ctx, eyeSpacing, eyeY, 2.5 * scale);
    }

    // Visor glass reflection highlight crescent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Helper to draw cartoon 'X' eyes when player is knocked out.
   */
  drawX(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
  }
}
