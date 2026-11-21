// Night Archive — the player.
// One job: Wren, the night archivist. Walks, sneaks, throws pebbles to
// pull wardens away, and pockets the star charts.

import {
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PEBBLE_COUNT,
  PEBBLE_COOLDOWN_SECONDS,
  PEBBLE_FLIGHT_SECONDS,
} from './config.js';
import { moveCircle, inBush } from './level.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER_RADIUS;
    this.sneaking = false;
    this.moving = false;
    this.facingX = 0;
    this.facingY = 1;
    this.pebbles = PEBBLE_COUNT;
    this.pebbleCooldown = 0;
    this.pebble = null; // a pebble in flight, or null
    this.stepPhase = 0;
    this.hiddenInBush = false;
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.sneaking = false;
    this.moving = false;
    this.pebbles = PEBBLE_COUNT;
    this.pebbleCooldown = 0;
    this.pebble = null;
    this.stepPhase = 0;
  }

  update(dt, input, exitOpen) {
    let ax = 0;
    let ay = 0;
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;
    this.moving = ax !== 0 || ay !== 0;
    this.sneaking = input.sneak;
    if (this.moving) {
      const len = Math.hypot(ax, ay);
      ax /= len;
      ay /= len;
      this.facingX = ax;
      this.facingY = ay;
      const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
      const moved = moveCircle(this.x, this.y, this.radius, ax * speed * dt, ay * speed * dt, exitOpen);
      this.x = moved.x;
      this.y = moved.y;
      this.stepPhase += speed * dt;
    }
    this.hiddenInBush = inBush(this.x, this.y);
    if (this.pebbleCooldown > 0) this.pebbleCooldown -= dt;
    if (this.pebble) {
      this.pebble.t += dt;
      if (this.pebble.t >= PEBBLE_FLIGHT_SECONDS) {
        this.pebble.landed = true;
        this.pebble.ring = 0;
      }
      if (this.pebble.landed) {
        this.pebble.ring += dt * 90;
        if (this.pebble.ring > 46) this.pebble = null;
      }
    }
  }

  canThrowPebble() {
    return this.pebbles > 0 && this.pebbleCooldown <= 0 && !this.pebble;
  }

  // A pebble arcs to the clicked point, lands with a soft ring, and the
  // wardens nearby walk over to see what made the noise.
  throwPebble(targetX, targetY) {
    if (!this.canThrowPebble()) return null;
    this.pebbles -= 1;
    this.pebbleCooldown = PEBBLE_COOLDOWN_SECONDS;
    this.pebble = {
      fromX: this.x,
      fromY: this.y,
      x: targetX,
      y: targetY,
      t: 0,
      landed: false,
      ring: 0,
    };
    return { x: targetX, y: targetY };
  }

  pebblePosition() {
    if (!this.pebble) return null;
    const p = this.pebble;
    if (!p.landed) {
      const k = Math.min(1, p.t / PEBBLE_FLIGHT_SECONDS);
      return { x: p.fromX + (p.x - p.fromX) * k, y: p.fromY + (p.y - p.fromY) * k, landed: false };
    }
    return { x: p.x, y: p.y, landed: true, ring: p.ring };
  }
}
