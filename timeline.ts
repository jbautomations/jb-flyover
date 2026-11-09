import * as THREE from 'three';
import {INPUTS} from './content';

// ── Output spec ──────────────────────────────────────────────
export const FPS = 60;
export const WIDTH = 1440;
export const HEIGHT = 1152;
export const DURATION_S = 14.5;
export const DURATION_FRAMES = Math.round(DURATION_S * FPS); // 870
export const PX = 100; // 100 screen px = 1 world unit
export const FOV = 38;

// ── Cue sheet (seconds) ──────────────────────────────────────
export const T = {
  chipLift: 1.35, // Key lift 1: stat chips stand up
  bubbleLift: 3.4, // SMS bubbles lift
  featureLift: 5.45, // Key lift 2: featured row card
  flightEnd: 8.2, // glide ends
  diveStart: 9.47, // overhead → dive begins
  diveEnd: 11.4, // camera lands square on the end card
  morphStart: 10.2, // hero fades into end card
  morphEnd: 11.3,
  badgeIn: 11.2, // white pill fades in
  closingStart: 11.9, // typewriter: closing line
  closingDur: 1.5,
  tailStart: 13.45, // typewriter: italic tail
  tailDur: 0.95,
};

export const FEATURE_LIFT_UNITS = 112 / PX; // 112px high
export const FEATURE_TILT = THREE.MathUtils.degToRad(30); // stands up 30° toward lens
export const CHIP_TILT = THREE.MathUtils.degToRad(20);

// ── Easing helpers ───────────────────────────────────────────
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const easeOutBack = (x: number) => {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const rise = (t: number, a: number, dur: number) => easeOutBack(clamp01((t - a) / dur));
const fall = (t: number, a: number, dur: number) => 1 - smooth(a, a + dur, t);

// ── Camera path ──────────────────────────────────────────────
// World layout (y descends down the page, page plane is z = 0):
//   hero 0 · chips -4.1 · steps -7.3 · scheduler/SMS -11 · services -15.4
//   · row -19 · cta -22.4
type Key = {t: number; pos: [number, number, number]; look: [number, number, number]};
const KEYS: Key[] = [
  // 0–8.2s: glide backwards down the page, always looking up it
  {t: 0.0, pos: [0.0, -1.6, 12.0], look: [0.0, 0.2, 0]},
  {t: 1.35, pos: [1.4, -6.0, 10.2], look: [0.3, -4.0, 0]},
  {t: 2.6, pos: [-1.6, -9.2, 10.0], look: [-0.2, -7.2, 0]},
  {t: 3.4, pos: [0.8, -12.8, 9.4], look: [0.0, -10.6, 0]},
  {t: 4.4, pos: [1.8, -16.6, 9.0], look: [0.2, -14.6, 0]},
  {t: 5.45, pos: [0.8, -20.0, 11.8], look: [0.0, -18.4, 0]},
  {t: 6.8, pos: [-0.6, -19.8, 9.0], look: [-1.6, -18.3, 0]},
  {t: 8.2, pos: [-1.6, -19.6, 7.6], look: [-2.6, -18.2, 0]},
  // 8.2–9.47s: pull up overhead
  {t: 8.85, pos: [3.0, -9.0, 24.0], look: [0.0, -10.0, 0]},
  {t: 9.47, pos: [5.0, -1.0, 34.0], look: [0.0, -8.0, 0]},
  // 9.47–11.4s: dive straight back into the header block
  {t: 10.4, pos: [2.5, 2.0, 26.0], look: [0.0, -1.5, 0]},
  {t: 11.4, pos: [0.0, 0.0, 16.73], look: [0.0, 0.0, 0]}, // end plane exactly fills frame
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, 'catmullrom', 0.5);
const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.look)), false, 'catmullrom', 0.5);

function cameraAt(t: number) {
  const tt = Math.min(Math.max(t, KEYS[0].t), KEYS[KEYS.length - 1].t);
  let i = 0;
  while (i < KEYS.length - 2 && tt > KEYS[i + 1].t) i++;
  const seg = (tt - KEYS[i].t) / (KEYS[i + 1].t - KEYS[i].t);
  const u = (i + seg) / (KEYS.length - 1);
  return {pos: posCurve.getPoint(u), look: lookCurve.getPoint(u)};
}

// ── typewriter ───────────────────────────────────────────────
const typed = (text: string, start: number, dur: number, t: number) =>
  text.slice(0, Math.floor(clamp01((t - start) / dur) * text.length));

// ── The seek(t) mapping: time → entire scene state ───────────
export type SeekState = ReturnType<typeof seek>;

export function seek(t: number) {
  const cam = cameraAt(t);
  const settle = 1 - smooth(10.8, 11.4, t);
  const roll = Math.sin(t * 0.9) * 0.014 * settle;

  const closing = typed(INPUTS.closing, T.closingStart, T.closingDur, t);
  const tail = typed(INPUTS.tail, T.tailStart, T.tailDur, t);
  const typingDone = t > T.tailStart + T.tailDur;

  return {
    t,
    camera: {pos: cam.pos, look: cam.look, roll},
    chips: [0, 1, 2].map((i) => {
      const a = T.chipLift + i * 0.09;
      return rise(t, a, 0.8) * fall(t, a + 1.6, 0.7); // 0..1(+overshoot)
    }),
    bubbles: [0, 1, 2].map((i) => {
      const a = T.bubbleLift + i * 0.16;
      return rise(t, a, 0.8) * fall(t, a + 1.5, 0.7);
    }),
    feature: smooth(T.featureLift, T.featureLift + 0.9, t) * fall(t, T.flightEnd + 0.1, 0.8),
    morph: smooth(T.morphStart, T.morphEnd, t), // hero → end card crossfade
    badge: smooth(T.badgeIn, T.badgeIn + 0.6, t),
    closing,
    tail,
    cursorOn: !typingDone || Math.floor(t * 2) % 2 === 0,
    typingTarget: (closing.length < INPUTS.closing.length ? 'closing' : 'tail') as 'closing' | 'tail',
  };
}
