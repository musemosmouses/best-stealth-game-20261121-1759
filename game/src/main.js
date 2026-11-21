// Night Archive — the game itself.
// One job: run it. Owns the loop, the states (title, playing, won,
// lost), the keyboard and mouse, the HUD, and the win/lose rules.
// Wren, the night archivist, must pocket three star charts and reach
// the exit door unseen — the wardens' cones decide what "unseen" means.

import { TILE, VIEW_W, VIEW_H, PEBBLE_FLIGHT_SECONDS } from './config.js';
import {
  playerSpawn,
  chartSpawns,
  exitTile,
  GUARD_ROUTES,
} from './level.js';
import { Guard } from './guard.js';
import { Player } from './player.js';
import { SoundBank } from './audio.js';
import {
  drawFloor,
  drawCoverAndWalls,
  drawCharts,
  drawExit,
  drawCone,
  drawGuard,
  drawPlayer,
  drawPebble,
  drawDarkness,
  drawAlarmVignette,
} from './render.js';
import { stageShot, shotFromUrl } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const hudCharts = document.getElementById('hud-charts');
const hudSuspicion = document.getElementById('hud-suspicion');
const hudPebbles = document.getElementById('hud-pebbles');
const hudTimer = document.getElementById('hud-timer');
const alarmBanner = document.getElementById('alarm-banner');
const titleScreen = document.getElementById('title-screen');
const winScreen = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const winStats = document.getElementById('win-stats');
const loseStats = document.getElementById('lose-stats');

export const game = {
  state: 'title', // title | playing | won | lost
  player: null,
  guards: [],
  charts: [],
  exitOpen: false,
  chartsTaken: 0,
  time: 0,
  detections: 0,
  alarmed: false,
  sound: new SoundBank(),
  lastStepSound: 0,
  shot: null,

  recomputeExit() {
    this.exitOpen = this.charts.every((c) => c.taken);
  },

  reset() {
    const spawn = playerSpawn();
    this.player = new Player(spawn);
    this.guards = GUARD_ROUTES.map((route) => new Guard(route));
    this.charts = chartSpawns();
    this.exitOpen = false;
    this.chartsTaken = 0;
    this.time = 0;
    this.detections = 0;
    this.alarmed = false;
    this.state = 'playing';
  },

  start() {
    this.sound.init();
    this.reset();
    titleScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    loseScreen.classList.add('hidden');
    if (this.shot) stageShot(this, this.shot);
  },

  win() {
    this.state = 'won';
    this.sound.winJingle();
    winStats.textContent = `All three star charts recovered in ${formatTime(this.time)} — spotted ${this.detections} time${this.detections === 1 ? '' : 's'}.`;
    winScreen.classList.remove('hidden');
  },

  lose(guard) {
    this.state = 'lost';
    this.sound.loseTone();
    loseStats.textContent = `${guard.name} caught Wren after ${formatTime(this.time)} — ${this.chartsTaken} of 3 charts recovered.`;
    loseScreen.classList.remove('hidden');
  },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sneak: false,
};

const KEY_MAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

window.addEventListener('keydown', (event) => {
  const action = KEY_MAP[event.code];
  if (action) {
    input[action] = true;
    event.preventDefault();
  }
  if (event.code === 'KeyR' && game.state !== 'title') game.start();
});

window.addEventListener('keyup', (event) => {
  const action = KEY_MAP[event.code];
  if (action) input[action] = false;
});

// Click the floor to throw a pebble there. The wardens walk over to
// look at the noise — a route around a cone that will not move.
canvas.addEventListener('click', (event) => {
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((event.clientY - rect.top) / rect.height) * VIEW_H;
  const noise = game.player.throwPebble(x, y);
  if (noise) {
    for (const guard of game.guards) guard.hearNoise(noise.x, noise.y);
  }
});

document.getElementById('start-button').addEventListener('click', () => game.start());
document.getElementById('again-win').addEventListener('click', () => game.start());
document.getElementById('again-lose').addEventListener('click', () => game.start());

function update(dt) {
  if (game.state !== 'playing') return;
  game.time += dt;
  const player = game.player;

  // Footstep sounds, paced by speed and quieter while sneaking.
  if (player.moving) {
    const stride = player.sneaking ? 46 : 30;
    if (player.stepPhase - game.lastStepSound > stride) {
      game.lastStepSound = player.stepPhase;
      game.sound.footstep(player.sneaking);
    }
  }
  // The nearest warden's pulse: closer means faster and louder.
  let nearest = Infinity;
  for (const guard of game.guards) {
    nearest = Math.min(nearest, Math.hypot(guard.x - player.x, guard.y - player.y));
  }
  game.sound.proximityPulse(nearest);

  const wasAlarmed = game.guards.some((g) => g.mode === 'chase');
  player.update(dt, input, game.exitOpen);
  for (const guard of game.guards) guard.update(dt, player, game.exitOpen);
  const nowAlarmed = game.guards.some((g) => g.mode === 'chase');
  if (nowAlarmed && !wasAlarmed) {
    game.detections += 1;
    game.sound.alertSting();
  }
  game.alarmed = nowAlarmed;

  // A pebble landing rings out once, then the wardens come to look.
  const pebble = player.pebble;
  if (pebble && pebble.landed && !pebble.rang) {
    pebble.rang = true;
    game.sound.pebbleTick();
  }

  // Picking up a chart: walk over its glow.
  for (const chart of game.charts) {
    if (!chart.taken && Math.hypot(chart.x - player.x, chart.y - player.y) < 24) {
      chart.taken = true;
      game.chartsTaken += 1;
      game.sound.pickupChime();
      game.recomputeExit();
    }
  }

  // Caught: a chasing warden within arm's reach.
  for (const guard of game.guards) {
    if (guard.touchesPlayer(player)) {
      game.lose(guard);
      return;
    }
  }

  // Out: all three charts pocketed, step onto the open exit door.
  if (game.exitOpen) {
    const e = exitTile();
    if (Math.abs(player.x - e.x) < TILE / 2 + 4 && Math.abs(player.y - e.y) < TILE / 2 + 4) {
      game.win();
    }
  }
}

function render(time) {
  drawFloor(ctx);
  drawCharts(ctx, game.charts, time);
  drawExit(ctx, game.exitOpen, time);
  drawCoverAndWalls(ctx);
  for (const guard of game.guards) drawCone(ctx, guard);
  for (const guard of game.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, game.player, time);
  drawPebble(ctx, game.player);
  drawDarkness(ctx, game.player, game.charts, game.exitOpen);
  const suspicion = Math.max(...game.guards.map((g) => g.suspicion));
  drawAlarmVignette(ctx, suspicion);
}

function updateHud() {
  const dots = '◆'.repeat(game.chartsTaken) + '◇'.repeat(3 - game.chartsTaken);
  hudCharts.textContent = `Charts ${dots} ${game.chartsTaken}/3`;
  const suspicion = Math.max(...game.guards.map((g) => g.suspicion));
  hudSuspicion.style.width = `${suspicion}%`;
  hudSuspicion.style.background = suspicion > 80 ? '#ff3c3c' : suspicion > 35 ? '#ff9628' : '#ffd640';
  hudPebbles.textContent = `Pebbles ×${game.player.pebbles}`;
  hudTimer.textContent = formatTime(game.time);
  alarmBanner.classList.toggle('hidden', !game.alarmed);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(now / 1000);
  updateHud();
  requestAnimationFrame(loop);
}

// A staged screenshot starts playing immediately, with no title screen:
// the shot is the game, not the menu.
game.shot = shotFromUrl();
game.reset();
if (game.shot) {
  stageShot(game, game.shot);
  titleScreen.classList.add('hidden');
}
requestAnimationFrame(loop);

// A small handle for the maker's own play-tests: read state, move Wren,
// read what the wardens see. The game never calls it.
window.__nightArchive = {
  game,
  input,
  state() {
    return {
      state: game.state,
      chartsTaken: game.chartsTaken,
      exitOpen: game.exitOpen,
      time: game.time,
      detections: game.detections,
      player: { x: game.player.x, y: game.player.y, pebbles: game.player.pebbles },
      guards: game.guards.map((g) => ({
        name: g.name,
        x: g.x,
        y: g.y,
        mode: g.mode,
        suspicion: Math.round(g.suspicion),
        seesPlayer: g.seesPlayer,
      })),
    };
  },
  teleport(x, y) {
    game.player.x = x;
    game.player.y = y;
  },
};
