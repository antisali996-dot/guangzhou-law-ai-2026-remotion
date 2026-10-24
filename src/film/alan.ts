import {Easing, interpolate} from 'remotion';
import type {Pose} from '../characters/Rig';
import {BIKE, wheelRotationFor} from '../props/Bike';
import {CONTACT_T} from './cues';
import {GROUND, HIP_Y, BIKE_DX, HIP_REST, ACTOR_SHIFT} from './geometry';
export {GROUND, HIP_Y, BIKE_DX, HIP_REST, ACTOR_SHIFT} from './geometry';
import {buildTrack, sampleTrack} from '../characters/locomotion';

/* ------------------------------------------------------------- geometry */

export const RIM_Y = GROUND + BIKE.basketTop.y; // 796
/** global seconds of the cup impact (measured against the L02 narration) */
export const T_CONTACT = CONTACT_T;
/** One throw from the window, shared by the street shot and surveillance replay. */
export const CUP_FLIGHT_DURATION = 0.87;
export const T_DROP = T_CONTACT - CUP_FLIGHT_DURATION;
export const CUP_START_Y = 476;
export const CONTACT_X = HIP_REST + BIKE_DX + BIKE.basketImpact.x;
export const CUP_X = 1397;
export const GRAVITY = 2 * (RIM_Y - CUP_START_Y) / CUP_FLIGHT_DURATION ** 2;
// The cup settles on the foreground pavement, beside the bicycle's travel lane.
export const CUP_GROUND_Y = GROUND + 50;
export const CUP_REST = {x: 1140, y: CUP_GROUND_Y - 26, rotate: 99, residue: 0.14, drips: 1, straw: false, scale: 0.56} as const;
export const STAIN_X = CUP_REST.x + 24;

export const ip = (
  t: number,
  times: number[],
  values: number[],
  ease: (n: number) => number = (x) => x,
): number => {
  const n = times.length;
  if (t <= times[0]) {
    return values[0];
  }
  if (t >= times[n - 1]) {
    return values[n - 1];
  }
  for (let i = 0; i < n - 1; i++) {
    if (t >= times[i] && t <= times[i + 1]) {
      const k = (t - times[i]) / Math.max(1e-6, times[i + 1] - times[i]);
      return values[i] + (values[i + 1] - values[i]) * ease(k);
    }
  }
  return values[n - 1];
};

export const smooth = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);

/* --------------------------------------------------------------- walking */

/** One continuous trajectory, shared with the settled cup in following shots. */
export const cupAt = (t: number) => {
  const since = t - T_CONTACT;
  const fall = Math.min(CUP_FLIGHT_DURATION, Math.max(0, t - T_DROP));
  if (since <= 0) return {
    x: CUP_X + (CONTACT_X - CUP_X) * fall / CUP_FLIGHT_DURATION,
    y: Math.min(CUP_START_Y + 0.5 * GRAVITY * fall * fall, RIM_Y),
    rotate: ip(t, [T_DROP, T_DROP + CUP_FLIGHT_DURATION * 0.55, T_CONTACT], [6, -12, 6]),
    residue: 0.62, drips: 0, straw: true, scale: CUP_REST.scale,
  };
  return {
    x: ip(since, [0, 0.2, 0.5, 0.8, 1.2, 1.45], [CONTACT_X, CONTACT_X + 6, CONTACT_X + 10, CONTACT_X + 2, CUP_REST.x + 2, CUP_REST.x]),
    y: ip(since, [0, 0.13, 0.36, 0.5, 0.68, 0.95, 1.2, 1.45], [RIM_Y, 762, 858, CUP_REST.y, CUP_REST.y-28, CUP_REST.y-4, CUP_REST.y-2, CUP_REST.y]),
    rotate: ip(since, [0, 0.22, 0.5, 0.8, 1.2, 1.45], [6, 62, 96, 104, 96, CUP_REST.rotate]),
    residue: ip(since, [0, 0.35, 0.9], [0.62, 0.28, CUP_REST.residue]),
    drips: ip(since, [0.1, 0.6], [0, 1]), straw: t < T_CONTACT + 0.3, scale: CUP_REST.scale,
  };
};

/**
 * Walk-in, from foot contact (see characters/locomotion.ts): cut in at full stride, shorten
 * the stride over one second and come to rest with the feet together. Speed and distance
 * are results of the gait, so the rest position is measured from the track, not assumed.
 */
const WALK_T0 = 6.0;
const WALK_V = 190; // px/s, about 0.8 m/s: an unhurried push
const easeStep = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};
const walkSpeed = (t: number) => WALK_V * (1 - easeStep((t - 7.0) / 1.1));
export const WALK_IN = buildTrack({t0: WALK_T0, t1: 8.3, speed: walkSpeed, vRef: WALK_V, fromStand: false});
const WALK_DIST = WALK_IN.samples[WALK_IN.samples.length - 1].hip;
export const WALK_FROM = HIP_REST - WALK_DIST;
export const WALK_TO = HIP_REST;

/**
 * 阿岚's state while she wheels the bike along the pavement.
 * Shared by every shot that covers this moment so poses match across cuts.
 */
export type AlanState = {
  hipX: number;
  bikeX: number;
  pose: Pose;
  bob: number;
  recoil: number;
  lookAtBasket: number;
  wheelDeg: number;
  kickstand: number;
};

export const alanAt = (t: number): AlanState => {
  const loco = sampleTrack(WALK_IN, t);
  const hipX = WALK_FROM + loco.hip;
  const moving = loco.amp;

  const since = t - T_CONTACT;
  const recoil = since < 0 ? 0 : Math.exp(-since * 3.0) * Math.min(1, since / 0.05);

  // checks the basket, glances up the street, then back down at the basket
  const lookAtBasket =
    interpolate(t, [7.55, 8.0, 8.9, 9.4], [0, 1, 0.12, 0.9], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: smooth,
    }) *
    (1 - 0.55 * Math.max(0, Math.min(1, since * 2)));

  const headYaw = 0.08 + lookAtBasket * 0.4 - recoil * 0.18;
  const headNod = 4 + lookAtBasket * 12 - (since > 0 ? Math.exp(-since * 4.2) * 14 : 0) + loco.bob * 0.7 * moving;
  const lean = 10 * moving + 4 * (1 - moving) - recoil * 3.2;
  const shoulderLift = recoil * 12 - loco.bob * 0.45 * moving;

  // Single source of contact geometry: the bar sits at bikeX + BIKE.grip.x in world
  // space, and the actor stands at hipX, so the hip-local target follows BIKE_DX.
  const gripX = BIKE_DX + BIKE.grip.x;
  // the bar is fixed in the world, so the hand target counter-moves with the pelvis bob
  const gripY = GROUND + BIKE.grip.y - HIP_Y - loco.bob; // -40 at rest

  return {
    hipX,
    bikeX: hipX + BIKE_DX,
    bob: loco.bob,
    recoil,
    lookAtBasket,
    wheelDeg: wheelRotationFor(hipX - WALK_FROM),
    kickstand: 1 - moving,
    pose: {
      lean,
      chest: 1.2 - recoil * 1.8 + loco.swing * 1.1 * moving,
      headYaw,
      headNod,
      headTilt: -1 + recoil * 2,
      shoulderLift,
      armNear: {kind: 'ik', target: {x: gripX, y: gripY}, bend: 1, hand: 'grip'},
      // Both wrists follow the two handlebar targets.
      armFar: {kind: 'ik', target: {x: gripX - 13, y: gripY - 9}, bend: 1, hand: 'grip'},
      legNear: loco.near,
      legFar: loco.far,
      mood: since < 0 ? 0.15 : 0.15 - 0.95 * Math.min(1, since / 0.3),
      breath: Math.sin(t * 1.5) * 0.7,
      ponytail: -loco.swing * 3 + Math.sin(t * 2.2) * 2,
    },
  };
};
