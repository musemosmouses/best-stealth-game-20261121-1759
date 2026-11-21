// Night Archive — the wardens.
// One job: everything a guard does. Patrols its route, pauses to look
// around, watches its vision cone, fills suspicion when it sees the
// player, chases on alarm and walks over to investigate a noise.

import {
  TILE,
  GUARD_RADIUS,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  CONE_RANGE_ALERT,
  CONE_HALF_ANGLE_ALERT,
  SUSPICION_BASE_RATE,
  SUSPICION_DRAIN_RATE,
  SUSPICION_GRACE_SECONDS,
  ALARM_SECONDS,
  ALARM_AFTERMATH,
  MOD_SNEAK,
  MOD_BUSH,
  MOD_SHADOW,
  MOD_LANTERN_LIGHT,
  MOD_MOVING,
  MOD_STILL,
  GUARD_PAUSE_SECONDS,
  GUARD_SCAN_SWEEP,
} from './config.js';
import {
  lineOfSightClear,
  inLanternLight,
  inShadow,
  inBush,
  moveCircle,
} from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(current, target, maxStep) {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

export class Guard {
  constructor(route) {
    this.name = route.name;
    this.color = route.color;
    this.route = route.waypoints.map((w) => ({ x: w.tx * TILE, y: w.ty * TILE }));
    this.waypointIndex = 0;
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.facing = Math.PI / 2;
    this.mode = 'patrol'; // patrol | pause | chase | investigate
    this.pauseTimer = 0;
    this.scanPhase = 0;
    this.scanBase = this.facing;
    this.suspicion = 0;
    this.graceTimer = 0;
    this.alarmTimer = 0;
    this.lastSeenX = this.x;
    this.lastSeenY = this.y;
    this.investigateX = 0;
    this.investigateY = 0;
    this.chaseTargetX = 0;
    this.chaseTargetY = 0;
    this.seesPlayer = false;
    // Frozen by a staged screenshot: the warden holds its pose so the
    // shot is the moment the maker staged, not a frame later.
    this.frozen = false;
  }

  coneRange() {
    return this.mode === 'chase' ? CONE_RANGE_ALERT : CONE_RANGE;
  }

  coneHalfAngle() {
    return this.mode === 'chase' ? CONE_HALF_ANGLE_ALERT : CONE_HALF_ANGLE;
  }

  // Can this guard see the player right now? Range, cone angle and a
  // clear line of sight all have to agree.
  canSeePlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.coneRange()) return false;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, this.facing)) > this.coneHalfAngle()) return false;
    return lineOfSightClear(this.x, this.y, player.x, player.y);
  }

  // How fast suspicion fills while the player is in view. Closer, lit and
  // moving is worse; sneaking, hidden in a bush or standing in shadow
  // buys time.
  detectionRate(player, dist) {
    let rate = SUSPICION_BASE_RATE * (1.15 - dist / this.coneRange());
    if (player.sneaking) rate *= MOD_SNEAK;
    if (inBush(player.x, player.y)) rate *= MOD_BUSH;
    else if (inShadow(player.x, player.y)) rate *= MOD_SHADOW;
    if (inLanternLight(player.x, player.y)) rate *= MOD_LANTERN_LIGHT;
    rate *= player.moving ? MOD_MOVING : MOD_STILL;
    return Math.max(8, Math.min(95, rate));
  }

  // The alarm is not instant: suspicion hits 100, the warden gets a
  // short grace window, and only if the player is still in sight when
  // it ends does the alarm sound. Breaking line of sight saves you.
  update(dt, player, exitOpen) {
    if (this.frozen) {
      this.seesPlayer = this.canSeePlayer(player);
      return;
    }
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.seesPlayer = this.canSeePlayer(player);

    if (this.mode === 'chase') {
      this.alarmTimer -= dt;
      this.suspicion = 100;
      if (this.alarmTimer <= 0) {
        this.mode = 'patrol';
        this.suspicion = ALARM_AFTERMATH;
        this.waypointIndex = this.nearestWaypoint();
      }
    } else if (this.seesPlayer) {
      this.suspicion += this.detectionRate(player, dist) * dt;
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
      if (this.suspicion >= 100) {
        this.suspicion = 100;
        this.graceTimer += dt;
        if (this.graceTimer >= SUSPICION_GRACE_SECONDS) {
          this.startChase();
        }
      } else {
        this.graceTimer = 0;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DRAIN_RATE * dt);
      this.graceTimer = 0;
    }

    if (this.mode === 'chase') {
      this.chasePlayer(dt, player, exitOpen);
    } else if (this.mode === 'investigate') {
      this.walkTo(dt, this.investigateX, this.investigateY, GUARD_INVESTIGATE_SPEED, exitOpen, true);
      if (Math.hypot(this.investigateX - this.x, this.investigateY - this.y) < 14) {
        this.mode = 'pause';
        this.pauseTimer = GUARD_PAUSE_SECONDS;
        this.scanBase = this.facing;
        this.scanPhase = 0;
      }
    } else if (this.mode === 'pause') {
      this.pauseTimer -= dt;
      this.scanPhase += dt;
      this.facing = this.scanBase + Math.sin(this.scanPhase * 1.6) * GUARD_SCAN_SWEEP;
      if (this.pauseTimer <= 0) {
        this.mode = 'patrol';
        this.waypointIndex = (this.waypointIndex + 1) % this.route.length;
      }
    } else {
      const target = this.route[this.waypointIndex];
      const arrived = this.walkTo(dt, target.x, target.y, GUARD_PATROL_SPEED, exitOpen, true);
      if (arrived) {
        this.mode = 'pause';
        this.pauseTimer = GUARD_PAUSE_SECONDS;
        this.scanBase = this.facing;
        this.scanPhase = 0;
      }
    }
  }

  // Walk toward a point, facing the direction of travel. Returns true
  // once close enough to count as arrived. Patrols and investigations
  // walk axis-aligned, like a warden walking a corridor: a diagonal
  // step can wedge a guard on a shelf corner and never let it arrive.
  walkTo(dt, tx, ty, speed, exitOpen, axial = false) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    let stepX = 0;
    let stepY = 0;
    if (axial) {
      if (Math.abs(dx) > 4) stepX = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      else stepY = Math.sign(dy) * Math.min(Math.abs(dy), speed * dt);
    } else {
      const want = Math.atan2(dy, dx);
      this.facing = turnToward(this.facing, want, 5.5 * dt);
      const step = Math.min(dist, speed * dt);
      stepX = Math.cos(this.facing) * step;
      stepY = Math.sin(this.facing) * step;
    }
    if (axial) {
      const want = stepX !== 0 ? (stepX > 0 ? 0 : Math.PI) : stepY > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.facing = turnToward(this.facing, want, 5.5 * dt);
    }
    const moved = moveCircle(this.x, this.y, GUARD_RADIUS, stepX, stepY, exitOpen);
    this.x = moved.x;
    this.y = moved.y;
    return dist < 14;
  }

  chasePlayer(dt, player, exitOpen) {
    // Chase the player's live position while seen, else the last place
    // the warden saw them.
    if (this.seesPlayer) {
      this.chaseTargetX = player.x;
      this.chaseTargetY = player.y;
    }
    this.walkTo(dt, this.chaseTargetX, this.chaseTargetY, GUARD_CHASE_SPEED, exitOpen);
  }

  startChase() {
    this.mode = 'chase';
    this.alarmTimer = ALARM_SECONDS;
    this.graceTimer = 0;
    this.chaseTargetX = this.lastSeenX;
    this.chaseTargetY = this.lastSeenY;
  }

  // A pebble landing nearby pulls the warden over to look.
  hearNoise(x, y) {
    if (this.mode === 'chase') return;
    if (Math.hypot(x - this.x, y - this.y) > 280) return;
    this.investigateX = x;
    this.investigateY = y;
    this.mode = 'investigate';
  }

  nearestWaypoint() {
    let best = 0;
    let bestDist = Infinity;
    this.route.forEach((w, i) => {
      const d = Math.hypot(w.x - this.x, w.y - this.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  // Caught means a chasing warden got within arm's reach.
  touchesPlayer(player) {
    return this.mode === 'chase' && Math.hypot(player.x - this.x, player.y - this.y) < GUARD_RADIUS + 11 + 4;
  }
}
