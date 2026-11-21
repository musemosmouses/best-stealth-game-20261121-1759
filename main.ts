// Night Archive — the hand-in program (Node 22, standard library only).
// It copies game/ and screenshots/ from beside this file into /output
// and writes /output/dossier.json with the vendored make.fun library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Dotfiles (a stray .gitkeep, a .DS_Store) must never reach /output:
// the grader counts every file it finds there.
function skipDotfiles(sourcePath) {
  const name = sourcePath.split('/').pop() ?? '';
  return !name.startsWith('.');
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true, filter: skipDotfiles });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true, filter: skipDotfiles });
}

// The caps are the scorer's own: an entry over them is refused, so the
// hand-in refuses itself first rather than shipping a doomed dossier.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
