// Night Archive — shared tuning constants.
// One job: every number the game balances on lives here, so a tweak
// never means hunting through the rest of the code.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 16;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

// Movement speeds, pixels per second.
export const PLAYER_WALK_SPEED = 132;
export const PLAYER_SNEAK_SPEED = 72;
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 98;
export const GUARD_INVESTIGATE_SPEED = 76;

// Radii, pixels.
export const PLAYER_RADIUS = 11;
export const GUARD_RADIUS = 13;
export const PEBBLE_RANGE = 280;

// Vision cone.
export const CONE_RANGE = 178;
export const CONE_HALF_ANGLE = 0.55;
export const CONE_RANGE_ALERT = 205;
export const CONE_HALF_ANGLE_ALERT = 0.78;

// Suspicion: 0 calm, 100 alarm.
export const SUSPICION_BASE_RATE = 62;
export const SUSPICION_DRAIN_RATE = 26;
export const SUSPICION_GRACE_SECONDS = 1.2;
export const ALARM_SECONDS = 6;
export const ALARM_AFTERMATH = 42;

// Detection multipliers.
export const MOD_SNEAK = 0.55;
export const MOD_BUSH = 0.25;
export const MOD_SHADOW = 0.5;
export const MOD_LANTERN_LIGHT = 1.5;
export const MOD_MOVING = 1.15;
export const MOD_STILL = 0.85;

// Pebbles.
export const PEBBLE_COUNT = 5;
export const PEBBLE_COOLDOWN_SECONDS = 1.5;
export const PEBBLE_FLIGHT_SECONDS = 0.35;

// Guards pause and look around at each waypoint.
export const GUARD_PAUSE_SECONDS = 1.3;
export const GUARD_SCAN_SWEEP = 1.05;

// Palette.
export const COLORS = {
  floorA: '#232a3d',
  floorB: '#1e2434',
  floorShadow: '#181d2c',
  floorLit: '#2c3348',
  wall: '#3a415a',
  wallTop: '#4d5674',
  shelf: '#6b4a2f',
  shelfEdge: '#8a6238',
  crate: '#8a6d3b',
  crateEdge: '#b08d4e',
  bush: '#2f6b3a',
  bushLight: '#4c9a58',
  lanternGlow: '#ffb347',
  chart: '#59e3ff',
  exitLocked: '#c0392b',
  exitOpen: '#39d97e',
  player: '#2dd4bf',
  playerHood: '#0f766e',
  coneCalm: 'rgba(255, 214, 64, 0.26)',
  coneWary: 'rgba(255, 150, 40, 0.32)',
  coneAlarm: 'rgba(255, 60, 60, 0.38)',
};
