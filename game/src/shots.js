// Night Archive — screenshot staging.
// One job: set up the four named moments for the screenshots, from the
// game's own state, so each shot is a real render of the game code.
// ?shot=cover | patrol | alarm | win — no parameter, the game just plays.

import { TILE } from './config.js';

// Place the player and the wardens, set suspicion and objectives, then
// hand the staged game back to the loop. Nothing here draws: the normal
// render pass draws the staged state.
export function stageShot(game, name) {
  const { player, guards, charts } = game;
  const at = (tx, ty) => ({ x: tx * TILE, y: ty * TILE });
  const setGuard = (i, tx, ty, facing, suspicion) => {
    const g = guards[i];
    const p = at(tx, ty);
    g.x = p.x;
    g.y = p.y;
    g.facing = facing;
    g.suspicion = suspicion;
    g.mode = 'pause';
    g.pauseTimer = 99;
    g.scanBase = facing;
    g.scanPhase = 0;
    g.graceTimer = 0;
    g.alarmTimer = 0;
    g.frozen = true;
  };

  if (name === 'cover') {
    // Wren crouched behind a crate, Warden Ash's cone sweeping past —
    // one chart already pocketed, the second glowing in the next room.
    player.x = 8.5 * TILE;
    player.y = 6.5 * TILE;
    player.sneaking = true;
    charts[0].taken = true;
    setGuard(0, 9.5, 8.5, -1.9, 38);
    setGuard(1, 19.5, 4.5, Math.PI * 0.7, 0);
    setGuard(2, 3.5, 11.5, 0, 0);
  } else if (name === 'patrol') {
    // The opening moment: three wardens on their rounds, cones lit,
    // Wren at the door with the whole archive ahead.
    setGuard(0, 9.5, 4.5, Math.PI / 2, 0);
    setGuard(1, 20.5, 6.5, Math.PI, 0);
    setGuard(2, 4.5, 9.5, -Math.PI / 2, 0);
  } else if (name === 'alarm') {
    // A near miss in the east wing: Warden Brine has almost got Wren,
    // the cone is red, and the bush is the only cover left.
    player.x = 17.5 * TILE;
    player.y = 11.5 * TILE;
    player.sneaking = true;
    charts[0].taken = true;
    charts[1].taken = true;
    setGuard(1, 19.5, 9.5, 2.2, 88);
    setGuard(0, 10.5, 10.5, 0, 20);
    setGuard(2, 3.5, 5.5, Math.PI / 2, 0);
  } else if (name === 'win') {
    // All three charts pocketed, the exit door open and glowing, Wren
    // one step from walking out — Brine's cone still sweeping the hall.
    player.x = 20.5 * TILE;
    player.y = 14.2 * TILE;
    charts[0].taken = true;
    charts[1].taken = true;
    charts[2].taken = true;
    setGuard(1, 18.5, 11.5, -Math.PI * 0.4, 12);
    setGuard(0, 9.5, 7.5, Math.PI / 2, 0);
    setGuard(2, 3.5, 13.5, 0, 0);
  }
  // The HUD counts charts from chartsTaken, so a staged moment must
  // say how many its taken flags already pocketed.
  game.chartsTaken = game.charts.filter((c) => c.taken).length;
  game.recomputeExit();
}

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  return ['cover', 'patrol', 'alarm', 'win'].includes(shot) ? shot : null;
}
