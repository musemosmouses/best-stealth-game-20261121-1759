// Night Archive — the archive floor.
// One job: the handcrafted level. It owns the tile map, what blocks
// movement and sight, the lantern light pools, the shadow pools, the
// star-chart spots, the exit door and the wardens' patrol routes.

import { TILE, COLS, ROWS } from './config.js';

// Legend: # wall · + doorway · . floor · P player spawn · 1/2/3 star charts
//         E exit door · S shelf (cover, blocks sight) · C crate (cover)
//         B bush (hide inside, slows detection)
export const MAP_ROWS = [
  '########################',
  '#P....#......#....1....#',
  '#.....#..B...#.........#',
  '#.C...#......#....S....#',
  '#.....+......+....S....#',
  '#.....#......#.........#',
  '#..B..#..C...#....C....#',
  '#.....#......#.........#',
  '#..S..+...2..+....S....#',
  '#..S..#......#....S....#',
  '#.....#..B...#.........#',
  '#.C...#......#....C....#',
  '#.....+......+....B....#',
  '#.....#......#....3....#',
  '#.....#......#.........#',
  '####################E###',
];

export const TILE_WALL = '#';
export const TILE_SHELF = 'S';
export const TILE_CRATE = 'C';
export const TILE_BUSH = 'B';
export const TILE_DOOR = '+';
export const TILE_EXIT = 'E';

export function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return TILE_WALL;
  return MAP_ROWS[ty][tx];
}

export function isSolidTile(tx, ty) {
  const t = tileAt(tx, ty);
  return t === TILE_WALL || t === TILE_SHELF || t === TILE_CRATE;
}

// The exit door tile is solid until every chart is collected.
export function isSolidForPlayer(tx, ty, exitOpen) {
  if (tileAt(tx, ty) === TILE_EXIT) return !exitOpen;
  return isSolidTile(tx, ty);
}

export function blocksSight(tx, ty) {
  const t = tileAt(tx, ty);
  return t === TILE_WALL || t === TILE_SHELF || t === TILE_CRATE;
}

export function isBushTile(tx, ty) {
  return tileAt(tx, ty) === TILE_BUSH;
}

// A line of sight is clear when no sight-blocking tile is sampled
// along the segment between the two points.
export function lineOfSightClear(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(tx, ty)) return false;
  }
  return true;
}

// Circle-versus-tile collision: try the move one axis at a time so the
// player slides along walls instead of sticking to them.
export function moveCircle(x, y, radius, dx, dy, exitOpen) {
  let nx = x + dx;
  if (circleHitsSolid(nx, y, radius, exitOpen)) nx = x;
  let ny = y + dy;
  if (circleHitsSolid(nx, ny, radius, exitOpen)) ny = y;
  return { x: nx, y: ny };
}

export function circleHitsSolid(x, y, radius, exitOpen) {
  const x0 = Math.floor((x - radius) / TILE);
  const x1 = Math.floor((x + radius) / TILE);
  const y0 = Math.floor((y - radius) / TILE);
  const y1 = Math.floor((y + radius) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolidForPlayer(tx, ty, exitOpen)) {
        const cx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
        const cy = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius) return true;
      }
    }
  }
  return false;
}

// Lanterns hang on wall tiles and pool warm light on the floor.
// Standing in a lantern pool makes the wardens spot you faster.
export const LANTERNS = [
  { tx: 6, ty: 2, r: 130 },
  { tx: 13, ty: 6, r: 130 },
  { tx: 6, ty: 11, r: 130 },
  { tx: 13, ty: 10, r: 130 },
  { tx: 20, ty: 3, r: 120 },
];

export function lanternAt(tx, ty) {
  return LANTERNS.find((l) => l.tx === tx && l.ty === ty) || null;
}

export function inLanternLight(x, y) {
  return LANTERNS.some((l) => {
    const cx = l.tx * TILE + TILE / 2;
    const cy = l.ty * TILE + TILE / 2;
    return Math.hypot(x - cx, y - cy) < l.r;
  });
}

// Shadow pools: unlit floor where detection fills half as fast.
export const SHADOW_POOLS = [
  { x: 3.5 * TILE, y: 11.5 * TILE, r: 95 },
  { x: 17 * TILE, y: 11 * TILE, r: 100 },
  { x: 10 * TILE, y: 3 * TILE, r: 85 },
  { x: 21 * TILE, y: 13.5 * TILE, r: 80 },
];

export function inShadow(x, y) {
  return SHADOW_POOLS.some((p) => Math.hypot(x - p.x, y - p.y) < p.r);
}

export function inBush(x, y) {
  return isBushTile(Math.floor(x / TILE), Math.floor(y / TILE));
}

// Scan the map once for the spawn, the charts and the exit.
export function findInMap(ch) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP_ROWS[ty][tx] === ch) return { tx, ty };
    }
  }
  return null;
}

export function chartSpawns() {
  return ['1', '2', '3'].map((ch) => {
    const s = findInMap(ch);
    return { x: s.tx * TILE + TILE / 2, y: s.ty * TILE + TILE / 2, taken: false };
  });
}

export function playerSpawn() {
  const s = findInMap('P');
  return { x: s.tx * TILE + TILE / 2, y: s.ty * TILE + TILE / 2 };
}

export function exitTile() {
  const s = findInMap('E');
  return { tx: s.tx, ty: s.ty, x: s.tx * TILE + TILE / 2, y: s.ty * TILE + TILE / 2 };
}

// The wardens' patrol routes, in tile coordinates. Each warden walks its
// loop, pauses at every waypoint and looks around before moving on.
export const GUARD_ROUTES = [
  {
    name: 'Warden Ash',
    color: '#f5b942',
    waypoints: [
      { tx: 10.5, ty: 2.5 },
      { tx: 10.5, ty: 7.5 },
      { tx: 10.5, ty: 13.5 },
    ],
  },
  {
    name: 'Warden Brine',
    color: '#3ec6c6',
    waypoints: [
      { tx: 16.5, ty: 2.5 },
      { tx: 21.5, ty: 3.5 },
      { tx: 21.5, ty: 12.5 },
      { tx: 16.5, ty: 12.5 },
    ],
  },
  {
    name: 'Warden Moss',
    color: '#b48be8',
    waypoints: [
      { tx: 1.5, ty: 13.5 },
      { tx: 1.5, ty: 5.5 },
      { tx: 4.5, ty: 5.5 },
      { tx: 4.5, ty: 13.5 },
    ],
  },
];
