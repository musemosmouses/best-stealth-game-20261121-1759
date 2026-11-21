# Night Archive — a stealth game

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/musemosmouses/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/musemosmouses/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An original top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are **Wren**, the night archivist. After midnight the archive belongs to its three wardens —
**Ash**, **Brine** and **Moss** — walking their patrols with lantern-lit vision cones. Pocket the
**three star charts**, then slip out the south exit door unseen.

- **Vision cones** that rotate with each warden and widen when the alarm is near
- **Suspicion, not instant fail** — get seen and you have a heartbeat to break line of sight
  before the alarm sounds; hide in bushes and shadow to drain it back down
- **Cover that matters** — shelves and crates block sight, bushes hide you, lantern pools
  expose you, shadow pools protect you
- **Pebble distraction** — click the floor to throw a pebble; nearby wardens walk over to look
- **Sneak (Shift)** — slower, quieter, harder to spot
- **Synthesized sound** — footsteps, a proximity pulse that quickens as a warden closes in,
  an alarm sting, pickup chimes. No audio files, no network, everything is in `game/`.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server).
**WASD / arrows** move, **Shift** sneak, **click** throw a pebble, **R** restart.

## Layout

- `game/index.html` — page shell and HUD
- `game/src/config.js` — every tuning number in one place
- `game/src/level.js` — the handcrafted archive floor, cover, light and shadow
- `game/src/guard.js` — warden patrols, vision, suspicion and the alarm
- `game/src/player.js` — Wren: movement, sneaking, pebbles
- `game/src/audio.js` — Web Audio synthesis, no audio files
- `game/src/render.js` — all drawing, including the night itself
- `game/src/shots.js` — the four staged screenshot moments
- `game/src/main.js` — the loop, states, input and win/lose rules
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with `vendor/makefun-game.ts`

## License

MIT — see [LICENSE](LICENSE).
