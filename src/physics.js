/**
 * @fileoverview Custom 2D Zero-Gravity Physics Engine for Faxina Gravitacional: Caos Zero-G!
 * Implements Verlet/Euler zero-G rigid body dynamics, circle-circle and circle-wall collisions,
 * procedural space debris, volatile radioactive residues, disposal units, gravity generators,
 * checkpoints, tractor beams, magnetic hands, modular walls, and particle systems.
 * Pure Canvas 2D procedural rendering - zero external image assets.
 */

import { sound } from './audio.js';

/**
 * Helper to safely trigger audio effects without breaking if sound engine is muted or uninitialized.
 * @param {string} method
 * @param {...*} args
 */
function safeSound(method, ...args) {
  try {
    if (sound && typeof sound[method] === 'function') {
      sound[method](...args);
    }
  } catch (err) {
    // Non-blocking sound fallback
  }
}

/**
 * 2D Vector Helper utilities
 */
export const Vec2 = {
  create: (x = 0, y = 0) => ({ x, y }),
  distSq: (x1, y1, x2, y2) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
  lerp: (a, b, t) => a + (b - a) * t
};

// =============================================================================
// RIGID BODY BASE CLASS (ZERO-G)
// =============================================================================

/**
 * Base RigidBody for floating objects in zero gravity.
 */
export class RigidBody {
  /**
   * @param {Object} options
   * @param {number} options.x - X position
   * @param {number} options.y - Y position
   * @param {number} [options.radius=16] - Collision radius
   * @param {number} [options.mass=1.0] - Object mass (0 for static)
   * @param {number} [options.restitution=0.6] - Bounciness (0.0 to 1.0)
   * @param {number} [options.friction=0.08] - Surface friction
   * @param {boolean} [options.isStatic=false] - Whether object is immovable
   * @param {string} [options.type='body'] - Object type identifier
   * @param {string} [options.color='#94a3b8'] - Primary draw color
   * @param {string} [options.glowColor='rgba(148, 163, 184, 0.3)'] - Glow color
   */
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.oldX = this.x;
    this.oldY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.radius = options.radius ?? 16;
    this.mass = options.isStatic ? 0 : (options.mass ?? 1.0);
    this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
    this.restitution = options.restitution ?? 0.6;
    this.friction = options.friction ?? 0.08;
    this.isStatic = options.isStatic ?? false;
    this.type = options.type || 'body';
    this.color = options.color || '#94a3b8';
    this.glowColor = options.glowColor || 'rgba(148, 163, 184, 0.3)';
    this.isDisposed = false;

    // Angular orientation & physics
    this.angle = options.angle || 0;
    this.angularVelocity = 0;
    this.angularDamping = 0.992;
    this.linearDamping = 0.998; // High retention of momentum in zero-G vacuum

    // Accumulated external forces
    this.fx = 0;
    this.fy = 0;
  }

  /**
   * Applies continuous force (accumulated over delta time)
   * @param {number} fx - Force in X
   * @param {number} fy - Force in Y
   */
  applyForce(fx, fy) {
    if (this.isStatic) return;
    this.fx += fx;
    this.fy += fy;
  }

  /**
   * Applies instantaneous impulse (immediate velocity change)
   * @param {number} ix - Impulse in X
   * @param {number} iy - Impulse in Y
   */
  applyImpulse(ix, iy) {
    if (this.isStatic || this.invMass === 0) return;
    this.vx += ix * this.invMass;
    this.vy += iy * this.invMass;
  }

  /**
   * Applies rotational torque impulse
   * @param {number} torqueImpulse
   */
  applyTorque(torqueImpulse) {
    if (this.isStatic) return;
    this.angularVelocity += torqueImpulse / (this.mass * this.radius * 0.5 || 1);
  }

  /**
   * Updates position, velocity, and rotation using semi-implicit integration.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.isStatic || this.isDisposed) return;

    // Integrate forces into velocity: v += (F / m) * dt
    if (this.invMass > 0) {
      this.vx += this.fx * this.invMass * dt;
      this.vy += this.fy * this.invMass * dt;
    }
    // Clear force accumulators
    this.fx = 0;
    this.fy = 0;

    // Damping (vacuum friction)
    const dampingFactor = Math.pow(this.linearDamping, dt * 60);
    this.vx *= dampingFactor;
    this.vy *= dampingFactor;

    const angDampingFactor = Math.pow(this.angularDamping, dt * 60);
    this.angularVelocity *= angDampingFactor;

    // Velocity clamp to avoid physics tunnel breakdowns
    const maxSpeed = 700;
    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > maxSpeed * maxSpeed) {
      const speed = Math.sqrt(speedSq);
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Save previous position
    this.oldX = this.x;
    this.oldY = this.y;

    // Integrate position: x += v * dt
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Integrate rotation
    this.angle += this.angularVelocity * dt;
  }

  /**
   * Base render method (can be overridden by specialized subclasses).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    if (this.isDisposed) return;
    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const r = this.radius * scale;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.stroke();

    ctx.restore();
  }
}

// =============================================================================
// COLLISION DETECTION & RESOLUTION
// =============================================================================

/**
 * Resolves elastic circle-to-circle collision between two rigid bodies.
 * @param {RigidBody} a
 * @param {RigidBody} b
 * @returns {boolean} True if collision occurred
 */
export function circleVsCircle(a, b) {
  if (a.isDisposed || b.isDisposed) return false;
  if (a.isStatic && b.isStatic) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;

  if (distSq >= minDist * minDist || distSq === 0) {
    return false;
  }

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;

  // Position correction based on inverse masses
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return false;

  const moveRatioA = a.invMass / totalInvMass;
  const moveRatioB = b.invMass / totalInvMass;

  a.x -= nx * overlap * moveRatioA;
  a.y -= ny * overlap * moveRatioA;
  b.x += nx * overlap * moveRatioB;
  b.y += ny * overlap * moveRatioB;

  // Relative velocity
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;

  // Do not resolve if velocities are separating
  if (velAlongNormal > 0) return true;

  // Restitution & impulse
  const e = Math.min(a.restitution, b.restitution);
  let j = -(1 + e) * velAlongNormal;
  j /= totalInvMass;

  // Apply normal impulse
  const impulseX = j * nx;
  const impulseY = j * ny;

  a.vx -= impulseX * a.invMass;
  a.vy -= impulseY * a.invMass;
  b.vx += impulseX * b.invMass;
  b.vy += impulseY * b.invMass;

  // Tangent friction impulse
  const tx = -ny;
  const ty = nx;
  const velAlongTangent = rvx * tx + rvy * ty;
  const mu = Math.sqrt(a.friction * b.friction);
  let jt = -velAlongTangent / totalInvMass;
  jt = Vec2.clamp(jt, -j * mu, j * mu);

  const frictionImpulseX = jt * tx;
  const frictionImpulseY = jt * ty;

  a.vx -= frictionImpulseX * a.invMass;
  a.vy -= frictionImpulseY * a.invMass;
  b.vx += frictionImpulseX * b.invMass;
  b.vy += frictionImpulseY * b.invMass;

  // Impart slight rotational spin
  a.angularVelocity += jt * (a.radius * 0.001);
  b.angularVelocity -= jt * (b.radius * 0.001);

  // Play clank sound on heavy impacts
  if (Math.abs(velAlongNormal) > 120) {
    safeSound('playClank', Math.min(1.0, Math.abs(velAlongNormal) / 300));
  }

  return true;
}

/**
 * Resolves collision between a circle rigid body and a static line wall segment.
 * @param {RigidBody} body
 * @param {Wall} wall
 * @returns {number} Impact normal velocity (0 if no collision)
 */
export function circleVsWall(body, wall) {
  if (body.isDisposed || body.isStatic) return 0;

  const wx = wall.x2 - wall.x1;
  const wy = wall.y2 - wall.y1;
  const wallLenSq = wx * wx + wy * wy;
  if (wallLenSq === 0) return 0;

  // Project body center onto wall segment
  const dot = (body.x - wall.x1) * wx + (body.y - wall.y1) * wy;
  const t = Vec2.clamp(dot / wallLenSq, 0, 1);

  const closestX = wall.x1 + t * wx;
  const closestY = wall.y1 + t * wy;

  const dx = body.x - closestX;
  const dy = body.y - closestY;
  const distSq = dx * dx + dy * dy;
  const minDist = body.radius + wall.thickness * 0.5;

  if (distSq >= minDist * minDist) {
    return 0;
  }

  const dist = Math.sqrt(distSq) || 0.001;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;

  // Resolve positional penetration
  body.x += nx * overlap;
  body.y += ny * overlap;

  // Velocity resolution
  const velAlongNormal = body.vx * nx + body.vy * ny;
  if (velAlongNormal >= 0) return 0;

  const e = body.restitution;
  const impulse = -(1 + e) * velAlongNormal;

  body.vx += impulse * nx;
  body.vy += impulse * ny;

  // Tangential friction against wall
  const tx = -ny;
  const ty = nx;
  const velAlongTangent = body.vx * tx + body.vy * ty;
  body.vx -= velAlongTangent * body.friction * tx;
  body.vy -= velAlongTangent * body.friction * ty;

  // Impart spin based on wall scrape
  body.angularVelocity += velAlongTangent * 0.02;

  // Impact speed magnitude
  const impactSpeed = Math.abs(velAlongNormal);
  if (impactSpeed > 100) {
    safeSound('playHit', Math.min(1.0, impactSpeed / 350));
  }

  return impactSpeed;
}

/**
 * Iterative collision solver for all bodies and chamber walls.
 * @param {Array<RigidBody>} bodies
 * @param {Array<Wall>} walls
 * @param {ParticleSystem} [particleSystem]
 * @param {*} [player]
 */
export function resolveCollisions(bodies, walls, particleSystem = null, player = null) {
  // 1. Solve Body-to-Wall Collisions
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.isDisposed || b.isStatic) continue;

    for (let w = 0; w < walls.length; w++) {
      const impactSpeed = circleVsWall(b, walls[w]);

      // Volatile residue explosion condition: impact speed > 180 px/s
      if (b instanceof VolatileResidue && impactSpeed > 180 && !b.isExploded) {
        b.explode(particleSystem, bodies, player);
      }
    }
  }

  // 2. Solve Body-to-Body Collisions (Pairwise)
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    if (a.isDisposed) continue;

    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (b.isDisposed) continue;

      const collided = circleVsCircle(a, b);
      if (collided) {
        // Check volatile residue interaction with other objects
        if ((a instanceof VolatileResidue && !a.isExploded) || (b instanceof VolatileResidue && !b.isExploded)) {
          const vol = a instanceof VolatileResidue ? a : b;
          const other = a instanceof VolatileResidue ? b : a;
          const relSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
          if (relSpeed > 220) {
            vol.explode(particleSystem, bodies, player);
          }
        }
      }
    }
  }
}

// =============================================================================
// SPACE DEBRIS CLASS (TRASH ITEMS)
// =============================================================================

/**
 * Floating space trash object with pure procedural rendering.
 * Types: 'can', 'bottle', 'box', 'barrel'.
 */
export class SpaceDebris extends RigidBody {
  /**
   * @param {Object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {'can'|'bottle'|'box'|'barrel'} [options.type='can']
   */
  constructor(options = {}) {
    const type = options.type || 'can';
    let radius = 14;
    let mass = 1.0;
    let restitution = 0.55;
    let friction = 0.08;
    let color = '#94a3b8';
    let scoreValue = 100;

    switch (type) {
      case 'can':
        radius = 12;
        mass = 0.8;
        restitution = 0.65;
        color = '#38bdf8'; // Cyan energy drink can
        scoreValue = 100;
        break;
      case 'bottle':
        radius = 15;
        mass = 1.1;
        restitution = 0.5;
        color = '#10b981'; // Green synthetic coolant bottle
        scoreValue = 150;
        break;
      case 'box':
        radius = 18;
        mass = 1.8;
        restitution = 0.35;
        color = '#f59e0b'; // Amber industrial supply crate
        scoreValue = 200;
        break;
      case 'barrel':
        radius = 22;
        mass = 2.5;
        restitution = 0.4;
        color = '#ea580c'; // Heavy rusty orange hazardous drum
        scoreValue = 300;
        break;
    }

    super({
      x: options.x,
      y: options.y,
      radius,
      mass,
      restitution,
      friction,
      type: 'debris',
      color
    });

    this.debrisType = type;
    this.scoreValue = scoreValue;
    this.disposalAnim = 0; // 0 to 1 suction animation
    this.isBeingDisposed = false;
    this.suctionTarget = null;
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  /**
   * Starts disposal sequence into a hatch.
   * @param {{x: number, y: number}} target
   */
  startDisposal(target) {
    this.isBeingDisposed = true;
    this.suctionTarget = target;
  }

  /**
   * Updates debris physics and disposal suction animation.
   * @param {number} dt
   */
  update(dt) {
    if (this.isDisposed) return;

    if (this.isBeingDisposed && this.suctionTarget) {
      this.disposalAnim += dt * 2.8;
      this.x = Vec2.lerp(this.x, this.suctionTarget.x, dt * 8);
      this.y = Vec2.lerp(this.y, this.suctionTarget.y, dt * 8);
      this.angularVelocity += dt * 30;
      this.angle += this.angularVelocity * dt;

      if (this.disposalAnim >= 1.0) {
        this.isDisposed = true;
      }
      return;
    }

    this.wobblePhase += dt * 2;
    super.update(dt);
  }

  /**
   * Procedural Canvas 2D rendering for distinct debris shapes.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    if (this.isDisposed) return;

    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const animScale = this.isBeingDisposed ? Math.max(0.01, 1 - this.disposalAnim) : 1;
    const r = this.radius * scale * animScale;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    switch (this.debrisType) {
      case 'can':
        this.renderCan(ctx, r, scale);
        break;
      case 'bottle':
        this.renderBottle(ctx, r, scale);
        break;
      case 'box':
        this.renderBox(ctx, r, scale);
        break;
      case 'barrel':
        this.renderBarrel(ctx, r, scale);
        break;
    }

    ctx.restore();
  }

  /**
   * Procedural soda / ration can
   */
  renderCan(ctx, r, scale) {
    const w = r * 1.5;
    const h = r * 2.2;

    // Outer can body gradient
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.35, '#38bdf8');
    grad.addColorStop(0.65, '#e0f2fe');
    grad.addColorStop(1, '#0369a1');

    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Rim lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Top rim ring
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w / 2, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pull-tab on top
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -h / 2, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Cyan energy logo band
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-w / 2, -h * 0.15, w, h * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(7, Math.floor(8 * scale))}px Rajdhani, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z-G', 0, 0);
  }

  /**
   * Procedural coolant bottle / oxygen flask
   */
  renderBottle(ctx, r, scale) {
    const w = r * 1.4;
    const h = r * 2.4;

    // Bottle body
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.4, '#10b981');
    grad.addColorStop(0.7, '#6ee7b7');
    grad.addColorStop(1, '#065f46');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Rounded base and tapered neck
    ctx.roundRect(-w / 2, -h / 4, w, h * 0.75, [0, 0, 6 * scale, 6 * scale]);
    ctx.fill();

    // Tapered neck
    ctx.fillStyle = '#059669';
    ctx.fillRect(-w * 0.25, -h / 2, w * 0.5, h * 0.3);

    // Metallic valve cap
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-w * 0.35, -h * 0.58, w * 0.7, h * 0.12);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w * 0.35, -h * 0.58, w * 0.7, h * 0.12);

    // Pressure gauge dial
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(2.5 * scale, -2.5 * scale);
    ctx.stroke();
  }

  /**
   * Procedural cargo crate
   */
  renderBox(ctx, r, scale) {
    const s = r * 1.8;

    // Box base
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-s / 2, -s / 2, s, s);

    // Inner panel
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-s / 2 + 3 * scale, -s / 2 + 3 * scale, s - 6 * scale, s - 6 * scale);

    // Cross braces
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.moveTo(-s / 2 + 4 * scale, -s / 2 + 4 * scale);
    ctx.lineTo(s / 2 - 4 * scale, s / 2 - 4 * scale);
    ctx.moveTo(s / 2 - 4 * scale, -s / 2 + 4 * scale);
    ctx.lineTo(-s / 2 + 4 * scale, s / 2 - 4 * scale);
    ctx.stroke();

    // Metallic corner reinforcements
    ctx.fillStyle = '#475569';
    const corner = 5 * scale;
    ctx.fillRect(-s / 2, -s / 2, corner, corner);
    ctx.fillRect(s / 2 - corner, -s / 2, corner, corner);
    ctx.fillRect(-s / 2, s / 2 - corner, corner, corner);
    ctx.fillRect(s / 2 - corner, s / 2 - corner, corner, corner);

    // Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
  }

  /**
   * Procedural toxic / fuel barrel
   */
  renderBarrel(ctx, r, scale) {
    const w = r * 1.6;
    const h = r * 2.1;

    // Barrel body
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#c2410c');
    grad.addColorStop(0.3, '#f97316');
    grad.addColorStop(0.7, '#fdba74');
    grad.addColorStop(1, '#9a3412');

    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Corrugated reinforcement ribs
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h * 0.25);
    ctx.lineTo(w / 2, -h * 0.25);
    ctx.moveTo(-w / 2, h * 0.25);
    ctx.lineTo(w / 2, h * 0.25);
    ctx.stroke();

    // Toxic hazard stripe in center
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-w / 2, -h * 0.12, w, h * 0.24);

    // Dark hazard triangles / stripes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.12);
    ctx.lineTo(-w * 0.05, h * 0.12);
    ctx.lineTo(w * 0.1, h * 0.12);
    ctx.lineTo(-w * 0.05, -h * 0.12);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  }
}

// =============================================================================
// VOLATILE RESIDUE CLASS (HAZARDOUS UNSTABLE WASTE)
// =============================================================================

/**
 * Highly radioactive and volatile space residue.
 * Explodes if impacted hard against walls or touched violently.
 */
export class VolatileResidue extends RigidBody {
  /**
   * @param {Object} options
   * @param {number} options.x
   * @param {number} options.y
   */
  constructor(options = {}) {
    super({
      x: options.x,
      y: options.y,
      radius: 17,
      mass: 1.2,
      restitution: 0.7,
      friction: 0.05,
      type: 'volatile',
      color: '#84cc16'
    });

    this.pulsePhase = Math.random() * Math.PI * 2;
    this.isExploded = false;
    this.explosionRadius = 85;
    this.innerSwirlAngle = 0;
  }

  /**
   * Updates radioactive pulse and rotational swirl
   * @param {number} dt
   */
  update(dt) {
    if (this.isDisposed || this.isExploded) return;
    this.pulsePhase += dt * 5;
    this.innerSwirlAngle += dt * 3;
    super.update(dt);
  }

  /**
   * Triggers explosion, damages nearby objects/player and spawns shockwave particles.
   * @param {ParticleSystem} [particleSystem]
   * @param {Array<RigidBody>} [bodies]
   * @param {*} [player]
   */
  explode(particleSystem = null, bodies = [], player = null) {
    if (this.isExploded || this.isDisposed) return;
    this.isExploded = true;
    this.isDisposed = true;

    safeSound('playExplosion', 1.0);

    // Particle explosion
    if (particleSystem) {
      particleSystem.emitExplosion(this.x, this.y, '#84cc16');
      particleSystem.emitSparks(this.x, this.y, 25, '#facc15');
    }

    // Damage player if inside radius
    if (player && player.isAlive && !player.isInvulnerable) {
      const pCenter = player.getCenter();
      const dist = Vec2.dist(this.x, this.y, pCenter.x, pCenter.y);
      if (dist < this.explosionRadius) {
        const falloff = 1 - dist / this.explosionRadius;
        const damage = Math.round(25 + falloff * 40);
        player.takeDamage(damage);

        // Knockback player
        const dx = (pCenter.x - this.x) / (dist || 1);
        const dy = (pCenter.y - this.y) / (dist || 1);
        player.applyImpulse(dx * 450 * falloff, dy * 450 * falloff);
      }
    }

    // Shockwave push other rigid bodies
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b === this || b.isDisposed || b.isStatic) continue;

      const dist = Vec2.dist(this.x, this.y, b.x, b.y);
      if (dist < this.explosionRadius && dist > 0) {
        const factor = (1 - dist / this.explosionRadius) * 550;
        const nx = (b.x - this.x) / dist;
        const ny = (b.y - this.y) / dist;
        b.applyImpulse(nx * factor, ny * factor);

        // Chain reaction if another volatile residue is within core blast
        if (b instanceof VolatileResidue && !b.isExploded && dist < this.explosionRadius * 0.7) {
          b.explode(particleSystem, bodies, player);
        }
      }
    }
  }

  /**
   * Procedural radioactive trefoil symbol and pulsing green hazard aura.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    if (this.isDisposed || this.isExploded) return;

    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.12;
    const r = this.radius * scale * pulse;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Pulsing outer glow aura
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
    glowGrad.addColorStop(0, 'rgba(132, 204, 22, 0.6)');
    glowGrad.addColorStop(0.6, 'rgba(163, 230, 53, 0.2)');
    glowGrad.addColorStop(1, 'rgba(132, 204, 22, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Central containment core
    const coreGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    coreGrad.addColorStop(0, '#bef264');
    coreGrad.addColorStop(0.5, '#84cc16');
    coreGrad.addColorStop(1, '#4d7c0f');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Radioactive Trefoil Symbol
    ctx.rotate(this.angle + this.innerSwirlAngle);
    ctx.fillStyle = '#0f172a';

    // 3 trefoil blades (leaves)
    const bladeRadius = r * 0.65;
    const innerRadius = r * 0.25;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, bladeRadius, a - 0.5, a + 0.5);
      ctx.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
      ctx.closePath();
      ctx.fill();
    }

    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Yellow warning border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// =============================================================================
// DISPOSAL UNIT CLASS (WASTE INCINERATOR / CHUTE)
// =============================================================================

/**
 * Static intake hatch zone where trash must be deposited.
 */
export class DisposalUnit {
  /**
   * @param {Object} options
   * @param {number} options.x - Top-left X
   * @param {number} options.y - Top-left Y
   * @param {number} [options.width=64]
   * @param {number} [options.height=64]
   */
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 64;
    this.height = options.height || 64;
    this.centerX = this.x + this.width / 2;
    this.centerY = this.y + this.height / 2;
    this.suctionRange = Math.max(this.width, this.height) * 1.2;
    this.suctionPower = 180;
    this.lightsTimer = 0;
    this.vortexAngle = 0;
  }

  /**
   * Checks if a rigid body's center has fallen inside the hatch bounds.
   * @param {RigidBody} body
   * @returns {boolean}
   */
  checkDisposal(body) {
    if (body.isDisposed) return false;
    return (
      body.x >= this.x + 6 &&
      body.x <= this.x + this.width - 6 &&
      body.y >= this.y + 6 &&
      body.y <= this.y + this.height - 6
    );
  }

  /**
   * Applies gentle suction vortex pull on nearby floating debris.
   * @param {RigidBody} body
   * @param {number} dt
   */
  applySuction(body, dt) {
    if (body.isDisposed || body.isStatic) return;

    const dx = this.centerX - body.x;
    const dy = this.centerY - body.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.suctionRange && dist > 1) {
      const force = (1 - dist / this.suctionRange) * this.suctionPower;
      const nx = dx / dist;
      const ny = dy / dist;

      // Add gentle spiral tangential suction
      const tx = -ny;
      const ty = nx;

      body.applyForce(nx * force + tx * force * 0.25, ny * force + ty * force * 0.25);
    }
  }

  /**
   * Updates internal animation lights and vortex
   * @param {number} dt
   */
  update(dt) {
    this.lightsTimer += dt * 4;
    this.vortexAngle += dt * 4.5;
  }

  /**
   * Procedural Canvas 2D rendering of dark metallic hatch with green LED indicators.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const w = this.width * scale;
    const h = this.height * scale;
    const cX = this.centerX * scale + offsetX;
    const cY = this.centerY * scale + offsetY;

    ctx.save();

    // Outer metal frame with bevel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(screenX, screenY, w, h);

    // Hazard stripes around frame edges
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.strokeRect(screenX, screenY, w, h);

    // Inner dark vacuum chute
    const chutePad = 6 * scale;
    const chuteGrad = ctx.createRadialGradient(cX, cY, 4 * scale, cX, cY, w * 0.5);
    chuteGrad.addColorStop(0, '#020617');
    chuteGrad.addColorStop(0.7, '#0f172a');
    chuteGrad.addColorStop(1, '#064e3b');

    ctx.fillStyle = chuteGrad;
    ctx.fillRect(screenX + chutePad, screenY + chutePad, w - chutePad * 2, h - chutePad * 2);

    // Suction Vortex Rings
    ctx.save();
    ctx.translate(cX, cY);
    ctx.rotate(this.vortexAngle);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, (w * 0.3) * (0.5 + 0.5 * Math.sin(this.lightsTimer)), 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();

    // 4 Corner Green Status Indicator LEDs
    const ledRadius = Math.max(2, 3.5 * scale);
    const ledPad = 5 * scale;
    const ledPositions = [
      { x: screenX + ledPad, y: screenY + ledPad },
      { x: screenX + w - ledPad, y: screenY + ledPad },
      { x: screenX + ledPad, y: screenY + h - ledPad },
      { x: screenX + w - ledPad, y: screenY + h - ledPad }
    ];

    const isBlinking = Math.floor(this.lightsTimer) % 2 === 0;
    ctx.fillStyle = isBlinking ? '#22c55e' : '#15803d';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = isBlinking ? 8 * scale : 2 * scale;

    for (const pos of ledPositions) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ledRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // "RECYCLE / DISPOSAL" label
    ctx.fillStyle = '#a7f3d0';
    ctx.font = `bold ${Math.max(7, Math.floor(9 * scale))}px Rajdhani, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DISPOSAL', cX, screenY + h * 0.85);

    ctx.restore();
  }
}

// =============================================================================
// GRAVITY GENERATOR CLASS (RECHARGEABLE ZERO-G FIELD)
// =============================================================================

/**
 * Stationary gravity field generator.
 * Pulls objects toward center when activated. Has depletable battery charge.
 */
export class GravityGenerator {
  /**
   * @param {Object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} [options.radius=175] - Gravity field radius
   * @param {number} [options.strength=300] - Pull force
   * @param {number} [options.charge=100] - Starting charge (0-100)
   */
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.radius = options.radius || 175;
    this.strength = options.strength || 300;
    this.charge = options.charge ?? 100;
    this.maxCharge = 100;
    this.isActive = true;
    this.coreRadius = 24;
    this.drainRate = 7; // depletes 7% per second active
    this.rechargeRate = 22; // recharges when player touches
    this.pulseTimer = 0;
    this.ringRotation = 0;
  }

  /**
   * Applies gravitational pull to body if within active field radius.
   * @param {RigidBody} body
   * @param {number} dt
   */
  applyField(body, dt) {
    if (!this.isActive || this.charge <= 0 || body.isDisposed || body.isStatic) return;

    const dx = this.x - body.x;
    const dy = this.y - body.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.radius * this.radius && distSq > 100) {
      const dist = Math.sqrt(distSq);
      // Gravitational falloff formula
      const falloff = 1 - dist / this.radius;
      const force = this.strength * falloff;
      const nx = dx / dist;
      const ny = dy / dist;

      body.applyForce(nx * force, ny * force);
    }
  }

  /**
   * Recharges energy level (e.g. when player interacts)
   * @param {number} amount
   */
  recharge(amount) {
    this.charge = Math.min(this.maxCharge, this.charge + amount);
    if (this.charge > 10) {
      this.isActive = true;
    }
  }

  /**
   * Updates charge depletion, wave pulse animations and ring rotations.
   * @param {number} dt
   */
  update(dt) {
    if (this.isActive && this.charge > 0) {
      this.charge = Math.max(0, this.charge - this.drainRate * dt);
      if (this.charge <= 0) {
        this.isActive = false;
        safeSound('playPowerDown');
      }
    }

    this.pulseTimer += dt * 3.5;
    this.ringRotation += dt * 2.2;
  }

  /**
   * Procedural rendering of core generator and translucent gravity field.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const fieldR = this.radius * scale;
    const coreR = this.coreRadius * scale;

    ctx.save();
    ctx.translate(screenX, screenY);

    // 1. Concentric Gravitational Wave Ripples (when active)
    if (this.isActive && this.charge > 0) {
      const rippleFraction = (this.pulseTimer % 2) / 2;
      const rippleR = fieldR * (1 - rippleFraction);

      const fieldGrad = ctx.createRadialGradient(0, 0, coreR, 0, 0, fieldR);
      fieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      fieldGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.08)');
      fieldGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = fieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, fieldR, 0, Math.PI * 2);
      ctx.fill();

      // Ripple line
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * (1 - rippleFraction)})`;
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Rotating Magnetic Energy Rings
    ctx.save();
    ctx.rotate(this.ringRotation);
    ctx.strokeStyle = this.isActive ? '#00f5ff' : '#475569';
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, coreR * 1.45, coreR * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI * 0.5);
    ctx.strokeStyle = this.isActive ? '#38bdf8' : '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0, coreR * 1.45, coreR * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Central Core Chamber
    const coreGrad = ctx.createRadialGradient(-coreR * 0.3, -coreR * 0.3, 2, 0, 0, coreR);
    if (this.isActive) {
      coreGrad.addColorStop(0, '#e0f2fe');
      coreGrad.addColorStop(0.5, '#0284c7');
      coreGrad.addColorStop(1, '#0c4a6e');
    } else {
      coreGrad.addColorStop(0, '#94a3b8');
      coreGrad.addColorStop(0.6, '#475569');
      coreGrad.addColorStop(1, '#1e293b');
    }

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.stroke();

    // 4. Charge Level Arc Indicator
    const chargeAngle = (this.charge / this.maxCharge) * Math.PI * 2;
    ctx.strokeStyle = this.charge > 25 ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, coreR + 4 * scale, -Math.PI / 2, -Math.PI / 2 + chargeAngle);
    ctx.stroke();

    // Charge Percentage Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(8, Math.floor(10 * scale))}px Rajdhani, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(this.charge)}%`, 0, 0);

    ctx.restore();
  }
}

// =============================================================================
// CHECKPOINT CLASS (MID-LEVEL PROGRESS SAVE BEACON)
// =============================================================================

/**
 * Mid-level holographic save point.
 * Activates when player touches it, storing state for revives/restarts.
 */
export class Checkpoint {
  /**
   * @param {Object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} [options.radius=26]
   */
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.radius = options.radius || 26;
    this.isActivated = false;
    this.glowPhase = 0;
    this.spin = 0;
    this.savedState = null;
  }

  /**
   * Checks if player touched checkpoint to activate it.
   * @param {*} player
   * @param {number} [remainingDebrisCount=0]
   * @returns {boolean} True on first activation
   */
  checkActivation(player, remainingDebrisCount = 0) {
    if (this.isActivated || !player || !player.isAlive) return false;

    const pCenter = player.getCenter();
    const distSq = Vec2.distSq(this.x, this.y, pCenter.x, pCenter.y);

    if (distSq < (this.radius + 20) * (this.radius + 20)) {
      this.isActivated = true;
      this.savedState = {
        x: this.x,
        y: this.y,
        remainingDebris: remainingDebrisCount
      };
      safeSound('playCheckpoint');
      return true;
    }
    return false;
  }

  /**
   * Updates holographic rotation and glow animation.
   * @param {number} dt
   */
  update(dt) {
    this.glowPhase += dt * 4;
    this.spin += dt * (this.isActivated ? 3.0 : 1.2);
  }

  /**
   * Procedural rendering of holographic quantum beacon.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    const screenX = this.x * scale + offsetX;
    const screenY = this.y * scale + offsetY;
    const r = this.radius * scale;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Glowing base pedestal
    ctx.fillStyle = '#334155';
    ctx.fillRect(-r * 0.7, r * 0.6, r * 1.4, r * 0.35);
    ctx.strokeStyle = this.isActivated ? '#10b981' : '#64748b';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeRect(-r * 0.7, r * 0.6, r * 1.4, r * 0.35);

    // Light beam column
    const beamGrad = ctx.createLinearGradient(0, r * 0.6, 0, -r * 1.2);
    beamGrad.addColorStop(0, this.isActivated ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.15)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.6);
    ctx.lineTo(r * 0.5, r * 0.6);
    ctx.lineTo(r * 0.8, -r * 1.2);
    ctx.lineTo(-r * 0.8, -r * 1.2);
    ctx.closePath();
    ctx.fill();

    // Floating Holographic Diamond Beacon
    const hoverY = Math.sin(this.glowPhase) * 4 * scale;
    ctx.translate(0, hoverY);
    ctx.rotate(this.spin);

    const diamondSize = r * 0.65;
    ctx.fillStyle = this.isActivated ? 'rgba(16, 185, 129, 0.8)' : 'rgba(56, 189, 248, 0.6)';
    ctx.strokeStyle = this.isActivated ? '#34d399' : '#bae6fd';
    ctx.lineWidth = Math.max(1.5, 2 * scale);

    ctx.beginPath();
    ctx.moveTo(0, -diamondSize);
    ctx.lineTo(diamondSize * 0.7, 0);
    ctx.lineTo(0, diamondSize);
    ctx.lineTo(-diamondSize * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// =============================================================================
// TRACTOR BEAM CLASS (CURSOR / TOUCH DIRECTED ENERGY CONE)
// =============================================================================

/**
 * Short-range directional beam that attracts or pulls objects towards the origin.
 */
export class TractorBeam {
  /**
   * @param {Object} [options]
   * @param {number} [options.range=160]
   * @param {number} [options.strength=340]
   */
  constructor(options = {}) {
    this.originX = 0;
    this.originY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.angle = 0;
    this.range = options.range || 160;
    this.coneAngle = Math.PI * 0.4;
    this.strength = options.strength || 340;
    this.isActive = false;
    this.pulsePhase = 0;
  }

  /**
   * Sets beam origin and target aim point
   * @param {number} ox
   * @param {number} oy
   * @param {number} tx
   * @param {number} ty
   */
  setAim(ox, oy, tx, ty) {
    this.originX = ox;
    this.originY = oy;
    this.targetX = tx;
    this.targetY = ty;
    this.angle = Math.atan2(ty - oy, tx - ox);
  }

  /**
   * Applies attraction force to body if inside beam cone.
   * @param {RigidBody} body
   * @param {number} dt
   */
  applyTo(body, dt) {
    if (!this.isActive || body.isDisposed || body.isStatic) return;

    const dx = body.x - this.originX;
    const dy = body.y - this.originY;
    const distSq = dx * dx + dy * dy;

    if (distSq > this.range * this.range || distSq < 100) return;

    const dist = Math.sqrt(distSq);
    const bodyAngle = Math.atan2(dy, dx);
    let angleDiff = Math.abs(bodyAngle - this.angle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    if (angleDiff <= this.coneAngle * 0.5) {
      // Pull object towards tractor beam origin
      const falloff = 1 - dist / this.range;
      const force = this.strength * falloff;
      const nx = -dx / dist;
      const ny = -dy / dist;

      body.applyForce(nx * force, ny * force);

      // Dampen perpendicular drift for alignment
      const perpX = -ny;
      const perpY = nx;
      const perpVel = body.vx * perpX + body.vy * perpY;
      body.applyForce(-perpX * perpVel * 20, -perpY * perpVel * 20);
    }
  }

  /**
   * Updates pulse oscillation
   * @param {number} dt
   */
  update(dt) {
    if (this.isActive) {
      this.pulsePhase += dt * 8;
    }
  }

  /**
   * Procedural rendering of translucent cyan cone with energy wave rings.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    if (!this.isActive) return;

    const ox = this.originX * scale + offsetX;
    const oy = this.originY * scale + offsetY;
    const r = this.range * scale;
    const halfCone = this.coneAngle * 0.5;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(this.angle);

    // Translucent beam cone gradient
    const coneGrad = ctx.createRadialGradient(0, 0, 5 * scale, 0, 0, r);
    coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    coneGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)');
    coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -halfCone, halfCone);
    ctx.closePath();
    ctx.fill();

    // Traveling wave ripples
    const numRipples = 3;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    for (let i = 0; i < numRipples; i++) {
      const frac = ((this.pulsePhase * 0.3 + i / numRipples) % 1);
      const curR = r * frac;
      ctx.strokeStyle = `rgba(0, 245, 255, ${0.5 * (1 - frac)})`;
      ctx.beginPath();
      ctx.arc(0, 0, curR, -halfCone * frac, halfCone * frac);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// =============================================================================
// MAGNETIC HAND CLASS (TETHER SPRING & THROW SYSTEM)
// =============================================================================

/**
 * Janitor's magnetic hand module.
 * Grabs nearest floating object within range and creates dynamic spring tether.
 * Allows throwing debris by releasing during movement!
 */
export class MagneticHand {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxRange=65]
   * @param {number} [options.stiffness=170]
   */
  constructor(options = {}) {
    this.maxRange = options.maxRange || 65;
    this.stiffness = options.stiffness || 170;
    this.damping = 12;
    /** @type {RigidBody|null} */
    this.grabbedBody = null;
    this.isGrabbing = false;
    this.arcTimer = 0;
  }

  /**
   * Attempts to grab the closest eligible debris item near the player.
   * @param {*} player
   * @param {Array<RigidBody>} bodies
   * @returns {RigidBody|null} Grabbed body or null
   */
  tryGrab(player, bodies) {
    if (this.grabbedBody) return this.grabbedBody;

    const pCenter = player.getCenter();
    let closestBody = null;
    let closestDistSq = this.maxRange * this.maxRange;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.isDisposed || b.isStatic) continue;

      const distSq = Vec2.distSq(pCenter.x, pCenter.y, b.x, b.y);
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestBody = b;
      }
    }

    if (closestBody) {
      this.grabbedBody = closestBody;
      this.isGrabbing = true;
      safeSound('playGrab');
      return closestBody;
    }

    return null;
  }

  /**
   * Releases currently grabbed object, imparting throw velocity from player momentum!
   * @param {*} player
   */
  release(player) {
    if (!this.grabbedBody) return;

    if (player) {
      // Impart throw momentum
      const throwBonus = 1.35;
      this.grabbedBody.vx = player.vx * throwBonus;
      this.grabbedBody.vy = player.vy * throwBonus;
      this.grabbedBody.applyTorque((Math.random() - 0.5) * 50);
    }

    this.grabbedBody = null;
    this.isGrabbing = false;
    safeSound('playRelease');
  }

  /**
   * Updates spring physics between hand and grabbed body.
   * @param {*} player
   * @param {number} dt
   */
  update(player, dt) {
    this.arcTimer += dt * 15;

    if (!this.grabbedBody || this.grabbedBody.isDisposed) {
      this.grabbedBody = null;
      this.isGrabbing = false;
      return;
    }

    const pCenter = player.getCenter();
    const dx = pCenter.x - this.grabbedBody.x;
    const dy = pCenter.y - this.grabbedBody.y;
    const dist = Math.hypot(dx, dy);

    // Break tether if pulled beyond 180px
    if (dist > 180) {
      this.release(player);
      return;
    }

    const restLength = 35;
    const displacement = dist - restLength;
    const springForce = displacement * this.stiffness;
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);

    // Damping relative velocity
    const relVx = this.grabbedBody.vx - player.vx;
    const relVy = this.grabbedBody.vy - player.vy;
    const dampForce = (relVx * nx + relVy * ny) * this.damping;

    const totalPull = springForce - dampForce;
    this.grabbedBody.applyForce(nx * totalPull, ny * totalPull);
  }

  /**
   * Procedural rendering of electric arc connection line between player and object.
   * @param {CanvasRenderingContext2D} ctx
   * @param {*} player
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, player, scale = 1, offsetX = 0, offsetY = 0) {
    if (!this.grabbedBody || !player) return;

    const p = player.getCenter();
    const x1 = p.x * scale + offsetX;
    const y1 = p.y * scale + offsetY;
    const x2 = this.grabbedBody.x * scale + offsetX;
    const y2 = this.grabbedBody.y * scale + offsetY;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8 * scale;
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);

    // Procedural electric lightning jagged arc
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const lx = Vec2.lerp(x1, x2, t);
      const ly = Vec2.lerp(y1, y2, t);
      const jitter = (Math.sin(this.arcTimer + i * 2) * 8 - 4) * scale;
      const perpX = -(y2 - y1) / (Vec2.dist(x1, y1, x2, y2) || 1);
      const perpY = (x2 - x1) / (Vec2.dist(x1, y1, x2, y2) || 1);

      ctx.lineTo(lx + perpX * jitter, ly + perpY * jitter);
    }

    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

// =============================================================================
// WALL CLASS (STATIC CHAMBER BOUNDARIES & OBSTACLES)
// =============================================================================

/**
 * Static boundary or partition wall with metallic panels and rivets.
 */
export class Wall {
  /**
   * @param {Object} options
   * @param {number} options.x1
   * @param {number} options.y1
   * @param {number} options.x2
   * @param {number} options.y2
   * @param {number} [options.thickness=16]
   */
  constructor(options = {}) {
    this.x1 = options.x1 || 0;
    this.y1 = options.y1 || 0;
    this.x2 = options.x2 || 0;
    this.y2 = options.y2 || 0;
    this.thickness = options.thickness || 16;

    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    this.length = Math.hypot(dx, dy) || 1;
    this.nx = -dy / this.length;
    this.ny = dx / this.length;
  }

  /**
   * Procedural Canvas 2D rendering of metallic bulkhead with rivets.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    const sx1 = this.x1 * scale + offsetX;
    const sy1 = this.y1 * scale + offsetY;
    const sx2 = this.x2 * scale + offsetX;
    const sy2 = this.y2 * scale + offsetY;
    const t = this.thickness * scale;

    ctx.save();
    ctx.lineCap = 'round';

    // Outer dark metallic stroke
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = t + 3 * scale;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    // Inner metallic plate
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = t;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    // Central highlight stripe
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();

    // Periodic rivets along wall
    const rivetSpacing = 28 * scale;
    const numRivets = Math.max(1, Math.floor((this.length * scale) / rivetSpacing));
    ctx.fillStyle = '#cbd5e1';

    for (let i = 0; i <= numRivets; i++) {
      const frac = i / numRivets;
      const rx = Vec2.lerp(sx1, sx2, frac);
      const ry = Vec2.lerp(sy1, sy2, frac);

      ctx.beginPath();
      ctx.arc(rx, ry, Math.max(1, 2 * scale), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// =============================================================================
// PARTICLE & PARTICLE SYSTEM (VISUAL FX)
// =============================================================================

/**
 * Individual visual effect particle.
 */
export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.radius = 3;
    this.startRadius = 3;
    this.endRadius = 0;
    this.color = '#38bdf8';
    this.type = 'spark';
    this.alpha = 1;
  }

  /**
   * Updates particle life and movement
   * @param {number} dt
   * @returns {boolean} True if particle is still active
   */
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Drag
    this.vx *= 0.96;
    this.vy *= 0.96;

    const progress = 1 - this.life / this.maxLife;
    this.alpha = Math.max(0, 1 - progress);
    this.radius = Vec2.lerp(this.startRadius, this.endRadius, progress);

    return true;
  }
}

/**
 * High performance particle pool system.
 */
export class ParticleSystem {
  constructor(maxParticles = 500) {
    this.pool = [];
    this.particles = [];
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Emits particles with customizable options.
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {Object} options
   */
  emit(x, y, count = 10, options = {}) {
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop() || new Particle();
      p.reset();

      const angle = options.angle !== undefined
        ? options.angle + (Math.random() - 0.5) * (options.spread || Math.PI * 0.5)
        : Math.random() * Math.PI * 2;

      const speed = options.speed !== undefined
        ? options.speed * (0.6 + Math.random() * 0.8)
        : 60 + Math.random() * 120;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = options.life || (0.4 + Math.random() * 0.4);
      p.life = p.maxLife;
      p.startRadius = options.startRadius || 3.5;
      p.endRadius = options.endRadius !== undefined ? options.endRadius : 0.5;
      p.color = options.color || '#38bdf8';
      p.type = options.type || 'spark';

      this.particles.push(p);
    }
  }

  /**
   * Emits directional thruster exhaust particles.
   * @param {number} x
   * @param {number} y
   * @param {number} angle
   * @param {number} [power=1]
   */
  emitThruster(x, y, angle, power = 1) {
    const oppAngle = angle + Math.PI;
    this.emit(x, y, Math.ceil(3 * power), {
      angle: oppAngle,
      spread: Math.PI * 0.25,
      speed: 160 * power,
      life: 0.25,
      startRadius: 4,
      endRadius: 1,
      color: Math.random() > 0.4 ? '#38bdf8' : '#00f5ff'
    });
  }

  /**
   * Emits fiery explosive blast particles.
   * @param {number} x
   * @param {number} y
   * @param {string} [color='#84cc16']
   */
  emitExplosion(x, y, color = '#84cc16') {
    this.emit(x, y, 35, {
      speed: 220,
      life: 0.65,
      startRadius: 7,
      endRadius: 0.5,
      color
    });
  }

  /**
   * Emits disposal suction vortex particles.
   * @param {number} x
   * @param {number} y
   */
  emitDisposal(x, y) {
    this.emit(x, y, 15, {
      speed: 90,
      life: 0.45,
      startRadius: 4,
      endRadius: 1,
      color: '#10b981'
    });
  }

  /**
   * Emits metallic collision sparks.
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {string} [color='#facc15']
   */
  emitSparks(x, y, count = 10, color = '#facc15') {
    this.emit(x, y, count, {
      speed: 150,
      life: 0.35,
      startRadius: 3,
      endRadius: 0.5,
      color
    });
  }

  /**
   * Updates all active particles and returns finished ones to pool.
   * @param {number} dt
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p.update(dt)) {
        this.particles.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  /**
   * Procedural Canvas 2D rendering of all particles.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale
   * @param {number} offsetX
   * @param {number} offsetY
   */
  render(ctx, scale = 1, offsetX = 0, offsetY = 0) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const px = p.x * scale + offsetX;
      const py = p.y * scale + offsetY;
      const r = Math.max(0.5, p.radius * scale);

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
