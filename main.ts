// "Starfall Courier" hand-in for best-game-01 (Node 22, standard library only).
// The game itself is the game/ folder: offline static files that open in desktop Chrome with no
// build step and no network request. This program stages game/ and screenshots/ into /output and
// asks the vendored make.fun library to build dossier.json, the summary the five judges read.
// It also writes a small game-info.json describing the entry, so the hand-in records its title.
//
// Run locally:  MAKEFUN_OUTPUT_DIR=out node main.ts
// Play locally: node serve.ts   then open http://localhost:8080
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// A short description of this entry for the hand-in, written on every run.
const info = {
  title: 'Starfall Courier',
  genre: 'neon arcade dodger',
  controls: 'Left/Right or A/D to steer, P to pause',
  goal: 'Collect energy crystals and chain combos for score while dodging asteroids',
};
writeFileSync(join(out, 'game-info.json'), `${JSON.stringify(info, null, 2)}\n`);

// The scorer's own caps (reference/gate.json). These only refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
