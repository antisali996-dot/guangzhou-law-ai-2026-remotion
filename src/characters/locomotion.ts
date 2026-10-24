import {RIG} from './Rig';

/**
 * Planted-foot walking.
 *
 *  - The pelvis moves with an AUTHORED speed profile v(t), so travel is smooth by
 *    construction: no surging or stalling inside a step.
 *  - Footfalls are scheduled in pelvis DISTANCE (one step every ~STEP px). Each strike
 *    pins a sole point in the world; while a leg is in stance that point never moves, so
 *    feet cannot skate whatever the speed does. Starts and stops are just the first/last
 *    short steps of the schedule, ending with the feet together.
 *  - Swing feet travel from the last plant to the next one along a lifted arc; foot angle
 *    rolls heel strike -> flat -> toe-off, rotating about the contact point.
 *  - Leg angles are solved by two-bone IK from the pelvis, so the knee always flexes
 *    backwards. Pelvis height is a smooth double bounce clipped by what the legs can reach.
 */

export type LegAngles = {hip: number; knee: number; foot: number};
export type LocoSample = {near: LegAngles; far: LegAngles; bob: number; swing: number; hip: number; amp: number};
export type Strike = {d: number; x: number; leg: 0 | 1; lo?: number; real: boolean};
export type Track = {t0: number; dt: number; samples: LocoSample[]; strikes: Strike[]; strikeTimes: number[]};

const STEP = 105;
const GROUND_Y = 190;
const HEEL = {x: -9, y: 10};
const MID = {x: 5, y: 10};
const TOE = {x: 19, y: 9};
const L_MAX = (RIG.thigh + RIG.shin) * 0.998;
const REST = [-12, 12]; // ankle dx from own hip joint when standing: [near, far]
const H_STAND = GROUND_Y + 5; // standing: knees nearly straight, a few degrees soft
const H_HI = GROUND_Y + 5.5;
const H_BOB = 9;
const LIFT = 15;
const LO_FRAC = 0.1;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (x: number) => {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
};

/* ---------------------------------------------------------------- step planning */

const mkStrike = (d: number, x: number, leg: 0 | 1, real = true, lo?: number): Strike => ({d, x, leg, lo, real});

/**
 * @param D          total pelvis distance of the walk
 * @param fromStand  true: start at rest (two short initiation steps); false: already moving
 */
export const planWalk = (Dwant: number, fromStand: boolean, finishAtRest = true): {strikes: Strike[]; D: number} => {
  const out: Strike[] = [];
  let dI: number;
  if (fromStand) {
    out.push(mkStrike(-1, REST[0], 0, false, 0.02));
    out.push(mkStrike(-1, REST[1], 1, false));
    const d1 = 0.45 * STEP;
    out.push(mkStrike(d1, d1 + 0.3 * STEP, 0));
    dI = d1 + 0.85 * STEP;
    out.push(mkStrike(dI, dI + 0.45 * STEP, 1));
  } else {
    out.push(mkStrike(-1.55 * STEP, -1.55 * STEP + 0.5 * STEP, 0, false));
    dI = -0.45 * STEP;
    out.push(mkStrike(dI, dI + 0.5 * STEP, 1, false));
  }
  if (!finishAtRest) {
    // Include two future footfalls, so the final visible feet still have swing targets.
    for (let i = 0; dI + (i + 1) * STEP <= Dwant + 2 * STEP; i++) {
      const d = dI + (i + 1) * STEP;
      out.push(mkStrike(d, d + 0.5 * STEP, (i % 2) as 0 | 1));
    }
    return {strikes: out, D: Dwant};
  }
  // fit a whole number of STEP-long steps: the walk's distance follows the schedule, and
  // the speed profile is rescaled to match, so cadence stays regular
  let best: {c: number; D: number; err: number} | null = null;
  for (let c = 0; c <= 10; c++) {
    const legF2 = (c % 2) as 0 | 1;
    const dF2 = dI + (c + 1) * STEP;
    const D = dF2 + 0.5 * STEP - REST[legF2];
    const err = Math.abs(D - Dwant);
    if (!best || err < best.err) best = {c, D, err};
  }
  const {c, D} = best!;
  for (let i = 0; i < c; i++) {
    const d = dI + (i + 1) * STEP;
    out.push(mkStrike(d, d + 0.5 * STEP, (i % 2) as 0 | 1));
  }
  const legF2 = (c % 2) as 0 | 1;
  out.push(mkStrike(dI + (c + 1) * STEP, dI + (c + 1) * STEP + 0.5 * STEP, legF2));
  const legF1 = (1 - legF2) as 0 | 1;
  out.push(mkStrike(D - 5, D + REST[legF1], legF1));
  return {strikes: out, D};
};

/** pelvis distance at which the leg planted by strike `k` lifts off */
const liftoff = (all: Strike[], k: Strike): number => {
  if (k.lo !== undefined) return k.lo;
  const other = all.filter((s) => s.leg !== k.leg && s.d > k.d).sort((a, b) => a.d - b.d)[0];
  const own = all.filter((s) => s.leg === k.leg && s.d > k.d).sort((a, b) => a.d - b.d)[0];
  if (!other) return Infinity;
  const nextOwn = own ? own.d : Infinity;
  return Math.min(other.d + LO_FRAC * Math.max(60, other.d - k.d), nextOwn - 10);
};

type Foot = {x: number; lift: number; ang: number; stance: boolean};

const footAt = (all: Strike[], leg: 0 | 1, s: number): Foot => {
  const mine = all.filter((k) => k.leg === leg).sort((a, b) => a.d - b.d);
  let i = 0;
  for (let k = 0; k < mine.length; k++) if (mine[k].d <= s) i = k;
  const cur = mine[i];
  const nxt = mine[i + 1];
  const lo = liftoff(all, cur);
  if (s < lo || !nxt) {
    const span = Math.max(1, Math.min(lo, 1e6) - cur.d);
    const f = clamp((s - cur.d) / span, 0, 1);
    const ang = f < 0.15 ? lerp(-14, 0, smooth(f / 0.15)) : f < 0.7 ? 0 : lerp(0, 26, smooth((f - 0.7) / 0.3));
    return {x: cur.x, lift: 0, ang: nxt ? ang : 0, stance: true};
  }
  const sigma = clamp((s - lo) / Math.max(1, nxt.d - lo), 0, 1);
  const e = smooth(sigma);
  return {
    x: lerp(cur.x, nxt.x, e),
    lift: LIFT * Math.pow(Math.sin(Math.PI * sigma), 0.85),
    ang: lerp(26, -14, e),
    stance: false,
  };
};

/* ----------------------------------------------------------------------- IK */

const contactLocal = (ang: number) => {
  const a = clamp(ang / 9, -1, 1);
  return a < 0 ? {x: lerp(MID.x, HEEL.x, -a), y: lerp(MID.y, HEEL.y, -a)} : {x: lerp(MID.x, TOE.x, a), y: lerp(MID.y, TOE.y, a)};
};
const rotPt = (p: {x: number; y: number}, ang: number) => {
  const c = Math.cos(rad(ang));
  const s = Math.sin(rad(ang));
  return {x: p.x * c - p.y * s, y: p.x * s + p.y * c};
};

const solveLeg = (dx: number, dy: number): {hip: number; knee: number} => {
  const a = RIG.thigh;
  const b = RIG.shin;
  const d = clamp(Math.hypot(dx, dy), 20, L_MAX);
  const theta = Math.atan2(dx, dy);
  const alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const interior = Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1));
  return {hip: deg(theta + alpha), knee: -(180 - deg(interior))};
};

/**
 * Smooth minimum (polynomial): equals min() away from a crossover and rounds the corner
 * where two values meet. Unlike log-sum-exp its bias is bounded (k/4), so a standing
 * figure is not pressed into a squat just because several limits happen to agree.
 */
const smin2 = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const softMin = (v: number[], k: number) => v.slice(1).reduce((acc, x) => smin2(acc, x, k), v[0]);

const legPose = (foot: Foot, H: number, hipX: number): LegAngles => {
  const rc = rotPt(contactLocal(foot.ang), foot.ang);
  const dx = foot.x - hipX - rc.x;
  const dy = H - foot.lift - rc.y;
  const k = solveLeg(dx, dy);
  return {hip: k.hip, knee: k.knee, foot: foot.ang};
};

const pelvisHeight = (all: Strike[], s: number, amp: number, feet: Foot[]): number => {
  const sorted = [...all].sort((a, b) => a.d - b.d);
  let k = 0;
  while (k < sorted.length - 2 && sorted[k + 1].d <= s) k++;
  const span = Math.max(30, sorted[k + 1].d - sorted[k].d);
  const phi = clamp((s - sorted[k].d) / span, 0, 1);
  const walk = H_HI - H_BOB * (1 + Math.cos(2 * Math.PI * phi)) * 0.5;
  const target = lerp(H_STAND, walk, amp);
  // each leg limits the pelvis by what it can reach; a lifted foot relaxes its limit smoothly
  const feas = feet.map((f) => {
    const rc = rotPt(contactLocal(f.ang), f.ang);
    const dx = f.x - s - rc.x;
    return Math.sqrt(Math.max(1, L_MAX * L_MAX - dx * dx)) + rc.y + f.lift;
  });
  return softMin([target, ...feas.map((x) => x + 1.2)], 4);
};

/* ------------------------------------------------------------------- tracks */

export type TrackSpec = {
  t0: number;
  t1: number;
  /** pelvis speed over time, px/s */
  speed: (t: number) => number;
  /** speed at which the walk is fully developed */
  vRef: number;
  fromStand: boolean;
  /** False for a shot that cuts while the character is still walking. */
  finishAtRest?: boolean;
};

const DT = 1 / 240;

export const buildTrack = (spec: TrackSpec): Track => {
  const n = Math.round((spec.t1 - spec.t0) / DT);
  const dist: number[] = [0];
  for (let i = 1; i <= n; i++) dist.push(dist[i - 1] + spec.speed(spec.t0 + (i - 0.5) * DT) * DT);
  const {strikes, D: planned} = planWalk(dist[n], spec.fromStand, spec.finishAtRest ?? true);
  const scale = planned / dist[n];
  for (let i = 0; i <= n; i++) dist[i] *= scale;
  const samples: LocoSample[] = [];
  for (let i = 0; i <= n; i++) {
    const s = dist[i];
    const v = spec.speed(spec.t0 + i * DT) * scale;
    const amp = smooth(v / spec.vRef);
    const feet = [footAt(strikes, 0, s), footAt(strikes, 1, s)];
    const H = pelvisHeight(strikes, s, amp, feet);
    const near = legPose(feet[0], H, s);
    const far = legPose(feet[1], H, s);
    samples.push({near, far, bob: GROUND_Y - H, swing: clamp((feet[0].x - s) / 60, -1, 1), hip: s, amp});
  }
  const strikeTimes = strikes
    .filter((k) => k.real && k.d <= dist[n])
    .map((k) => {
      const i = dist.findIndex((d) => d >= k.d);
      return spec.t0 + (i < 0 ? n : i) * DT;
    });
  return {t0: spec.t0, dt: DT, samples, strikes, strikeTimes};
};

const mixLeg = (a: LegAngles, b: LegAngles, k: number): LegAngles => ({
  hip: lerp(a.hip, b.hip, k),
  knee: lerp(a.knee, b.knee, k),
  foot: lerp(a.foot, b.foot, k),
});

export const sampleTrack = (tr: Track, t: number): LocoSample => {
  const x = (t - tr.t0) / tr.dt;
  const i = clamp(Math.floor(x), 0, tr.samples.length - 1);
  const j = Math.min(tr.samples.length - 1, i + 1);
  const k = clamp(x - i, 0, 1);
  const a = tr.samples[i];
  const b = tr.samples[j];
  return {
    near: mixLeg(a.near, b.near, k),
    far: mixLeg(a.far, b.far, k),
    bob: lerp(a.bob, b.bob, k),
    swing: lerp(a.swing, b.swing, k),
    hip: lerp(a.hip, b.hip, k),
    amp: lerp(a.amp, b.amp, k),
  };
};

/** relaxed standing legs, for shots that never walk */
export const standingLegs = (): LocoSample => {
  const feet: Foot[] = [
    {x: REST[0], lift: 0, ang: 0, stance: true},
    {x: REST[1], lift: 0, ang: 0, stance: true},
  ];
  return {near: legPose(feet[0], H_STAND, 0), far: legPose(feet[1], H_STAND, 0), bob: GROUND_Y - H_STAND, swing: 0, hip: 0, amp: 0};
};

/** sole contact position in the figure's world frame, for verification */
export const soleX = (leg: 0 | 1, L: LegAngles, hipX: number, bob: number) => {
  const jointX = hipX + (leg === 0 ? RIG.hipHalf : -RIG.hipHalf);
  const kx = jointX + Math.sin(rad(L.hip)) * RIG.thigh;
  const ky = Math.cos(rad(L.hip)) * RIG.thigh;
  const a2 = rad(L.hip + L.knee);
  const ax = kx + Math.sin(a2) * RIG.shin;
  const ay = ky + Math.cos(a2) * RIG.shin;
  const r = rotPt(contactLocal(L.foot), L.foot);
  return {x: ax + r.x, y: ay + r.y + bob, ax, ay};
};
