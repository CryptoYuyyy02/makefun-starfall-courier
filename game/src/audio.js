// Programmatic sound for Starfall Courier, built with the WebAudio API — no asset files, no
// network. Each cue is a short synthesised tone (or a small sweep) so the game has audio feedback
// for collecting a crystal, taking a hit, launching and losing. The AudioContext is created lazily
// on the first user gesture (browsers block audio before that), and every cue is wrapped so a
// browser without WebAudio — or a screenshot run with no gesture — simply stays silent.

let context = null;

/** Create or resume the audio context on a user gesture. Safe to call repeatedly. */
export function unlock() {
  if (context === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { context = new AC(); } catch { return; }
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
}

/** A single tone with an optional falling/rising sweep, an envelope and a wave shape. */
function tone(freq, endFreq, duration, type, volume, delay) {
  if (context === null || context.state !== 'running') return;
  const t0 = context.currentTime + (delay || 0);
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq && endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A bright two-note arpeggio for a crystal; the pitch rises with the combo. */
export function crystal(combo) {
  const step = Math.min(12, Math.max(0, (combo - 1) | 0));
  const base = 620 * Math.pow(2, step / 24);
  tone(base, base * 1.5, 0.13, 'triangle', 0.14, 0);
  tone(base * 1.5, base * 2, 0.16, 'sine', 0.1, 0.07);
}

/** A low noise-like thud with a downward sweep for a hull hit. */
export function hit() {
  tone(180, 55, 0.28, 'sawtooth', 0.18, 0);
  tone(90, 40, 0.34, 'square', 0.1, 0.02);
}

/** An ascending launch chirp. */
export function launch() {
  tone(220, 660, 0.22, 'triangle', 0.12, 0);
  tone(440, 880, 0.2, 'sine', 0.08, 0.1);
}

/** A descending three-note loss motif. */
export function gameOver() {
  tone(440, 330, 0.24, 'triangle', 0.13, 0);
  tone(330, 220, 0.26, 'triangle', 0.12, 0.16);
  tone(220, 110, 0.42, 'sine', 0.12, 0.34);
}
