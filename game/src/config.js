// "Starfall Courier" — every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule depends on screen size.

export const FIELD = { width: 1280, height: 720, groundY: 664 };

export const STEP = 1 / 60;

export const PLAYER = {
  width: 76,
  height: 30,
  speed: 600,
  invulnerable: 1.6,
};

export const LIVES = 3;

// Falling hazards: jagged asteroids of varying width.
export const BLOCK = {
  minWidth: 46,
  maxWidth: 120,
  height: 46,
  speed: 250,
  speedPerLevel: 32,
  speedJitter: 95,
  interval: 0.52,
  intervalScale: 0.88,
  minInterval: 0.13,
  dodgePoints: 1,
};

// Energy crystals: collect for points and a burst of shield charge.
export const COIN = {
  size: 30,
  speed: 205,
  speedPerLevel: 15,
  interval: 1.35,
  intervalJitter: 0.85,
  points: 25,
};

export const LEVEL = { seconds: 12, max: 12 };

export const POOL_SIZE = 72;

// A neon-on-deep-space palette with three accent hues.
export const PALETTE = {
  backdrop: '#070b18',
  sky: '#0b1226',
  ground: '#0f1b34',
  player: '#5ef2ff',
  playerCore: '#ffffff',
  block: '#ff4d6d',
  blockEdge: '#ff9db1',
  coin: '#ffd166',
  coinCore: '#fff6d8',
  panel: 'rgba(10,18,40,0.86)',
  panelEdge: '#2de2e6',
  text: '#eaf6ff',
  muted: '#8aa0c0',
  accent: '#2de2e6',
  accent2: '#f72585',
  grid: 'rgba(45,226,230,0.07)',
  shield: '#7cf5ff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'starfall-courier.best';
