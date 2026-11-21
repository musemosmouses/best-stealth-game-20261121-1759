// Night Archive — drawing.
// One job: everything the player sees. The archive floor, the cover,
// the wardens and their vision cones, the player, and the night itself:
// dark means hidden, lit means exposed.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS } from './config.js';
import { MAP_ROWS, tileAt, lanternAt, LANTERNS, SHADOW_POOLS, exitTile } from './level.js';

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export function drawFloor(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const t = tileAt(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === '#') continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(x, y, TILE, 1);
    }
  }
  // Shadow pools read as darker floor: standing here, you are harder to see.
  for (const p of SHADOW_POOLS) {
    const g = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, p.r);
    g.addColorStop(0, 'rgba(6, 8, 18, 0.55)');
    g.addColorStop(1, 'rgba(6, 8, 18, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lantern pools read as warm lit floor: standing here, you are easier to see.
  for (const l of LANTERNS) {
    const c = tileCenter(l.tx, l.ty);
    const g = ctx.createRadialGradient(c.x, c.y, 6, c.x, c.y, l.r);
    g.addColorStop(0, 'rgba(255, 179, 71, 0.20)');
    g.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, l.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCoverAndWalls(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const t = tileAt(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
      } else if (t === 'S') {
        // Shelf: a wooden bookcase, tall enough to block sight.
        ctx.fillStyle = COLORS.shelf;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.shelfEdge;
        ctx.fillRect(x + 3, y + 3, TILE - 6, 4);
        ctx.fillStyle = 'rgba(255, 220, 160, 0.25)';
        for (let i = 0; i < 3; i++) ctx.fillRect(x + 7 + i * 10, y + 10, 5, 20);
      } else if (t === 'C') {
        // Crate: low cover you can crouch behind.
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + TILE - 5, y + TILE - 5);
        ctx.moveTo(x + TILE - 5, y + 5);
        ctx.lineTo(x + 5, y + TILE - 5);
        ctx.stroke();
      } else if (t === 'B') {
        // Bush: a leafy hiding spot. Step inside and the cones slide off you.
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(x + 12, y + 14, 11, 0, Math.PI * 2);
        ctx.arc(x + 27, y + 12, 12, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 27, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.bushLight;
        ctx.beginPath();
        ctx.arc(x + 14, y + 12, 4, 0, Math.PI * 2);
        ctx.arc(x + 26, y + 24, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 'E') {
        // The exit door is drawn by drawExit, not here.
      }
      const lantern = lanternAt(tx, ty);
      if (lantern) {
        const c = tileCenter(tx, ty);
        ctx.fillStyle = '#2b2f3d';
        ctx.fillRect(c.x - 3, c.y - 12, 6, 14);
        ctx.fillStyle = COLORS.lanternGlow;
        ctx.beginPath();
        ctx.arc(c.x, c.y - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
        ctx.beginPath();
        ctx.arc(c.x, c.y - 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function drawCharts(ctx, charts, time) {
  for (const chart of charts) {
    if (chart.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + chart.x) * 0.12;
    const g = ctx.createRadialGradient(chart.x, chart.y, 2, chart.x, chart.y, 26 * pulse);
    g.addColorStop(0, 'rgba(89, 227, 255, 0.55)');
    g.addColorStop(1, 'rgba(89, 227, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(chart.x, chart.y, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(chart.x, chart.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.chart;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#e8fbff';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

export function drawExit(ctx, exitOpen, time) {
  const e = exitTile();
  const x = e.tx * TILE;
  const y = e.ty * TILE;
  ctx.fillStyle = '#20242f';
  ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
  if (exitOpen) {
    const glow = 0.5 + Math.sin(time * 4) * 0.2;
    ctx.fillStyle = `rgba(57, 217, 126, ${glow})`;
    ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
    ctx.fillStyle = '#eafff3';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', e.x, e.y - 16);
  } else {
    ctx.fillStyle = COLORS.exitLocked;
    ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
    ctx.strokeStyle = '#7c1d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawCone(ctx, guard) {
  const range = guard.coneRange();
  const half = guard.coneHalfAngle();
  const color =
    guard.suspicion > 80 ? COLORS.coneAlarm : guard.suspicion > 35 ? COLORS.coneWary : COLORS.coneCalm;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawGuard(ctx, guard, time) {
  const bob = Math.sin(time * 6 + guard.x) * 1.5;
  // Body: a round-shouldered warden in a coloured tabard, visible
  // against the floor at a glance.
  ctx.fillStyle = '#20242f';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob * 0.3, 12, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick: the nose of the cone.
  ctx.strokeStyle = '#10131c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 15, guard.y + Math.sin(guard.facing) * 15);
  ctx.stroke();
  // Eyes.
  const ex = Math.cos(guard.facing) * 5;
  const ey = Math.sin(guard.facing) * 5;
  const px = -Math.sin(guard.facing) * 5;
  const py = Math.cos(guard.facing) * 5;
  ctx.fillStyle = '#10131c';
  ctx.beginPath();
  ctx.arc(guard.x + ex + px, guard.y + ey + py, 1.8, 0, Math.PI * 2);
  ctx.arc(guard.x + ex - px, guard.y + ey - py, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // "?" while suspicious, "!" once the alarm is about to sound.
  if (guard.suspicion > 35 || guard.mode === 'chase') {
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = guard.mode === 'chase' ? '#ff3c3c' : '#ffd640';
    ctx.fillText(guard.mode === 'chase' ? '!' : '?', guard.x, guard.y - 18);
  }
  // A thin suspicion arc over the warden's head.
  if (guard.suspicion > 2) {
    ctx.strokeStyle = guard.suspicion > 80 ? '#ff3c3c' : '#ffd640';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
}

export function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase * 0.09) * 1.5 : 0;
  // A hooded figure in dark teal, small against the floor, bright
  // enough to find at a glance.
  ctx.fillStyle = '#0b2e2a';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8fffb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.facingX * 13, player.y + player.facingY * 13);
  ctx.stroke();
  if (player.sneaking) {
    // A crouch ring: you are sneaking, and slower for it.
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.hiddenInBush) {
    ctx.strokeStyle = 'rgba(76, 154, 88, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawPebble(ctx, player) {
  const pos = player.pebblePosition();
  if (!pos) return;
  if (pos.landed) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.ring, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The night itself: a dark wash over the whole floor, punched through
// around lanterns, the charts, the exit and the player — so light reads
// as safety and dark as cover. The wash is built on an offscreen canvas
// so the holes cut the dark, never the floor beneath it.
const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW_W;
darkCanvas.height = VIEW_H;
const darkCtx = darkCanvas.getContext('2d');

export function drawDarkness(ctx, player, charts, exitOpen) {
  darkCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  darkCtx.fillStyle = 'rgba(5, 7, 16, 0.44)';
  darkCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  darkCtx.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r) => {
    const g = darkCtx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = g;
    darkCtx.beginPath();
    darkCtx.arc(x, y, r, 0, Math.PI * 2);
    darkCtx.fill();
  };
  for (const l of LANTERNS) {
    const c = tileCenter(l.tx, l.ty);
    punch(c.x, c.y, l.r);
  }
  for (const chart of charts) {
    if (!chart.taken) punch(chart.x, chart.y, 70);
  }
  const e = exitTile();
  if (exitOpen) punch(e.x, e.y, 95);
  punch(player.x, player.y, 100);
  darkCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
}

// A red edge creep when the wardens are close to sounding the alarm.
export function drawAlarmVignette(ctx, suspicion) {
  if (suspicion < 55) return;
  const a = ((suspicion - 55) / 45) * 0.5;
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.72);
  g.addColorStop(0, 'rgba(255, 40, 40, 0)');
  g.addColorStop(1, `rgba(255, 40, 40, ${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export { MAP_ROWS };
