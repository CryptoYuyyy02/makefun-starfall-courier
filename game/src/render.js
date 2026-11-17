// Drawing only: the world's state and the current screen in, pixels out. A neon-on-deep-space
// look: a procedural starfield, a receding perspective grid, a glowing ship with engine flare and
// shield ring, jagged asteroids and spinning crystals. Every decorative position is a pure function
// of its index, so a given frame is byte-for-byte repeatable for the screenshot scenes.
import { FIELD, FONT, LIVES, PALETTE } from './config.js';
import { KIND_COIN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 660, top: 150, line: 36, bottom: 78 };
const STAR_COUNT = 120;

// Deterministic starfield: fixed hash of the index gives position, size and twinkle phase.
function star(i) {
  const h1 = ((i * 1103515245 + 12345) >>> 0) / 4294967296;
  const h2 = ((i * 22695477 + 7) >>> 0) / 4294967296;
  const h3 = ((i * 48271 + 999) >>> 0) / 4294967296;
  return { x: h1 * FIELD.width, y: h2 * FIELD.groundY, r: 0.6 + h3 * 1.6, p: h3 * 6.283 };
}

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) { value = next; text = prefix + next; }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('SCORE ');
  const levelLabel = cachedLabel('SECTOR ');
  const finalLabel = cachedLabel('SCORE ');
  const bestLabel = cachedLabel('BEST ');
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i += 1) stars.push(star(i));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = size + '|' + (weight || '');
    if (!fonts.has(key)) fonts.set(key, `${weight || ''} ${size}px ${FONT}`.trim());
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawBackground(state) {
    // Deep-space gradient.
    const g = context.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, PALETTE.backdrop);
    g.addColorStop(0.7, PALETTE.sky);
    g.addColorStop(1, PALETTE.ground);
    context.fillStyle = g;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // Stars: slowly drift with elapsed time, wrap at the horizon.
    const drift = (state.elapsed * 18) % FIELD.groundY;
    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      const y = (s.y + drift) % FIELD.groundY;
      const twinkle = 0.55 + 0.45 * Math.sin(state.elapsed * 2 + s.p);
      context.globalAlpha = twinkle;
      context.fillStyle = i % 7 === 0 ? PALETTE.accent : PALETTE.text;
      context.beginPath();
      context.arc(s.x, y, s.r, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;

    // Perspective grid on the lower deck.
    context.strokeStyle = PALETTE.grid;
    context.lineWidth = 1;
    const horizon = FIELD.groundY;
    for (let i = -8; i <= 8; i += 1) {
      context.beginPath();
      context.moveTo(FIELD.width / 2 + i * 26, horizon);
      context.lineTo(FIELD.width / 2 + i * 150, FIELD.height);
      context.stroke();
    }
    for (let i = 0; i < 7; i += 1) {
      const t = i / 7;
      const y = horizon + (FIELD.height - horizon) * t * t;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(FIELD.width, y);
      context.stroke();
    }
    context.strokeStyle = PALETTE.accent;
    context.lineWidth = 2;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(0, horizon);
    context.lineTo(FIELD.width, horizon);
    context.stroke();
    context.globalAlpha = 1;
  }

  function glowRing(cx, cy, radius, color, width) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
  }

  function drawItems(state) {
    const items = state.items;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      if (item.kind === KIND_COIN) {
        // Spinning diamond crystal with a golden halo.
        const pulse = 1 + 0.12 * Math.sin(state.elapsed * 6 + index);
        const r = item.width / 2 * pulse;
        context.save();
        context.translate(cx, cy);
        context.rotate(state.elapsed * 2 + index);
        context.shadowColor = PALETTE.coin;
        context.shadowBlur = 22;
        context.fillStyle = PALETTE.coin;
        context.beginPath();
        context.moveTo(0, -r);
        context.lineTo(r * 0.7, 0);
        context.lineTo(0, r);
        context.lineTo(-r * 0.7, 0);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
        context.fillStyle = PALETTE.coinCore;
        context.beginPath();
        context.moveTo(0, -r * 0.55);
        context.lineTo(r * 0.38, 0);
        context.lineTo(0, r * 0.55);
        context.lineTo(-r * 0.38, 0);
        context.closePath();
        context.fill();
        context.restore();
      } else {
        // Jagged asteroid silhouette with a hot core and rim light.
        const w = item.width; const h = item.height;
        context.save();
        context.translate(cx, cy);
        context.rotate(Math.sin(state.elapsed * 1.5 + index) * 0.12);
        context.shadowColor = PALETTE.block;
        context.shadowBlur = 18;
        context.fillStyle = PALETTE.block;
        context.beginPath();
        context.moveTo(-w / 2, -h / 4);
        context.lineTo(-w / 3, -h / 2);
        context.lineTo(w / 5, -h / 2 + 6);
        context.lineTo(w / 2, -h / 6);
        context.lineTo(w / 2 - 8, h / 2);
        context.lineTo(-w / 4, h / 2 - 4);
        context.lineTo(-w / 2, h / 5);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = PALETTE.blockEdge;
        context.lineWidth = 2;
        context.stroke();
        // Crater lines.
        context.strokeStyle = 'rgba(10,10,20,0.5)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-w / 6, -h / 6);
        context.lineTo(w / 8, h / 6);
        context.moveTo(w / 6, -h / 4);
        context.lineTo(w / 3, -h / 8);
        context.stroke();
        context.restore();
      }
    }
  }

  function drawShip(state) {
    const player = state.player;
    const show = player.invulnerable === 0 || Math.floor(player.invulnerable * 10) % 2 === 1;
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const w = player.width; const h = player.height;
    if (!show) {
      context.globalAlpha = 0.35;
      glowRing(cx, cy, w * 0.7, PALETTE.shield, 2);
      context.globalAlpha = 1;
      return;
    }
    context.save();
    context.translate(cx, cy);
    // Engine flare.
    const flare = 14 + 6 * Math.sin(state.elapsed * 24);
    context.fillStyle = 'rgba(93,242,255,0.35)';
    context.beginPath();
    context.moveTo(-w / 2 + 8, -6);
    context.lineTo(-w / 2 - flare, 0);
    context.lineTo(-w / 2 + 8, 6);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.player;
    context.beginPath();
    context.moveTo(-w / 2 - flare * 0.55, -3);
    context.lineTo(-w / 2 + 6, 0);
    context.lineTo(-w / 2 - flare * 0.55, 3);
    context.closePath();
    context.fill();
    // Hull.
    context.shadowColor = PALETTE.player;
    context.shadowBlur = 20;
    context.fillStyle = PALETTE.player;
    context.beginPath();
    context.moveTo(w / 2, 0);
    context.lineTo(-w / 2, -h / 2);
    context.lineTo(-w / 4, 0);
    context.lineTo(-w / 2, h / 2);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    // Cockpit core.
    context.fillStyle = PALETTE.playerCore;
    context.beginPath();
    context.moveTo(w / 4, 0);
    context.lineTo(-w / 8, -h / 5);
    context.lineTo(-w / 8, h / 5);
    context.closePath();
    context.fill();
    context.restore();
    // Shield ring just after a hit.
    if (player.invulnerable > 0) {
      context.globalAlpha = 0.4 + 0.3 * Math.sin(state.elapsed * 18);
      glowRing(cx, cy, w * 0.72, PALETTE.shield, 3);
      context.globalAlpha = 1;
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    context.save();
    context.shadowColor = PALETTE.accent;
    context.shadowBlur = 12;
    text(scoreLabel(state.score), 28, 22, 30, PALETTE.text, 'left', '700');
    text(levelLabel(state.level), FIELD.width / 2, 22, 30, PALETTE.accent, 'center', '700');
    context.restore();
    if (state.combo >= 2) {
      context.save();
      context.shadowColor = PALETTE.coin;
      context.shadowBlur = 14;
      text('x' + state.combo + ' COMBO', FIELD.width / 2, 62, 22, PALETTE.coin, 'center', '700');
      context.restore();
    }
    text('HULL', FIELD.width - 30 - LIVES * 30, 24, 20, PALETTE.muted, 'right', '600');
    for (let life = 0; life < LIVES; life += 1) {
      const x = FIELD.width - 26 - (life + 1) * 30;
      const alive = life < state.lives;
      context.fillStyle = alive ? PALETTE.block : 'rgba(255,77,109,0.15)';
      context.beginPath();
      context.moveTo(x, 22);
      context.lineTo(x + 18, 22);
      context.lineTo(x + 22, 30);
      context.lineTo(x + 18, 38);
      context.lineTo(x, 38);
      context.lineTo(x + 4, 30);
      context.closePath();
      context.fill();
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.save();
    context.shadowColor = accent;
    context.shadowBlur = 30;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.restore();
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    // Accent bars at the corners.
    context.fillStyle = accent;
    context.fillRect(x, y, 90, 5);
    context.fillRect(x + PANEL.width - 90, y + height - 5, 90, 5);
    context.textBaseline = 'alphabetic';
    context.save();
    context.shadowColor = accent;
    context.shadowBlur = 18;
    text(title, FIELD.width / 2, y + 92, 56, PALETTE.text, 'center', '800');
    context.restore();
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 24, PALETTE.muted, 'center', '500');
    }
    context.save();
    context.shadowColor = PALETTE.coin;
    context.shadowBlur = 14;
    text(prompt, FIELD.width / 2, y + height - 42, 26, PALETTE.coin, 'center', '700');
    context.restore();
  }

  const TITLE_LINES = [
    'Gather crystals. Dodge the asteroid field.',
    'Steer with ← → or A D.  P pause.',
    'Chain crystals to charge your shield.',
  ];
  const PAUSED_LINES = ['The field holds its breath.'];
  const OVER_LINES = ['', ''];

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawBackground(state);
    drawItems(state);
    drawShip(state);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[3] = undefined;
      drawPanel('STARFALL COURIER', TITLE_LINES.concat(bestLabel(best)), 'Press Space or click to launch', PALETTE.accent);
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', PAUSED_LINES, 'Press P to resume', PALETTE.accent);
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('Ship Lost', OVER_LINES, 'Press Space or click to fly again', PALETTE.accent2);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
