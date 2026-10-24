import {Easing, interpolate} from 'remotion';
import {armGeometryFor, type Pose} from '../characters/Rig';
import {buildTrack, sampleTrack} from '../characters/locomotion';
import {BIKE, wheelRotationFor} from '../props/Bike';
import {GROUND, HIP_Y, HIP_REST, BIKE_DX} from './geometry';
import {phoneStowAt} from './stowPhone';
import {scene} from './timeline';
import {blinkAt} from '../lib/blink';

const ease = Easing.inOut(Easing.cubic);
const progress = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {
  easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const LEAVE_START = scene('s11').start;
export const LEAVE_DURATION = scene('s11').end - LEAVE_START;
export const LEAVE_WALK_DELAY = 0.8;
export const LEAVE_ACTOR_X = HIP_REST;
export const LEAVE_BIKE_X = LEAVE_ACTOR_X + BIKE_DX;
export const LEAVE = buildTrack({t0: 0, t1: LEAVE_DURATION,
  speed: (t) => 190 * progress(t, LEAVE_WALK_DELAY, LEAVE_WALK_DELAY + 0.8),
  vRef: 190, fromStand: true, finishAtRest: false});
const distance = LEAVE.samples[LEAVE.samples.length - 1].hip;
const idle = phoneStowAt(scene('s10').end - scene('s10').start);

export const leaveAt = (local: number) => {
  const loco = sampleTrack(LEAVE, local);
  const ready = progress(local, 0, 0.75);
  const lookAhead = progress(local, 0.1, 0.9);
  const pose: Pose = {
    ...idle.pose,
    blink: blinkAt(LEAVE_START + local),
    lean: mix(idle.pose.lean ?? 0, 6 + 4 * loco.amp, ready),
    chest: mix(idle.pose.chest ?? 0, 2.2 + loco.swing * 1.1, ready),
    headYaw: mix(idle.pose.headYaw ?? 0, 0.06, lookAhead),
    headNod: mix(idle.pose.headNod ?? 0, -1 + loco.bob * 0.7 * loco.amp, lookAhead),
    headTilt: mix(1, 0, lookAhead),
    shoulderLift: (2 - loco.bob * 0.45 * loco.amp) * ready,
    mood: mix(-0.3, 0.1 + 0.2 * loco.hip / distance, ready),
    legNear: loco.near, legFar: loco.far,
    ponytail: -3 - loco.swing * 3 * ready,
  };
  const nearTarget = {x: BIKE_DX + BIKE.grip.x, y: GROUND + BIKE.grip.y - HIP_Y - loco.bob};
  const farTarget = {x: nearTarget.x - 13, y: nearTarget.y - 9};
  const gripPose: Pose = {...pose, armNear: {kind: 'ik', target: nearTarget}, armFar: {kind: 'ik', target: farTarget}};
  const nearProgress = progress(local, 0.05, 0.55);
  const farProgress = progress(local, 0.15, 0.75);
  for (const near of [true, false]) {
    const p = near ? nearProgress : farProgress;
    const from = armGeometryFor(idle.pose, near);
    const to = armGeometryFor(gripPose, near);
    const arm = p >= 1 ? {kind: 'ik' as const, target: near ? nearTarget : farTarget, hand: 'grip' as const} : {
      kind: 'angles' as const, upper: mix(from.upperDeg, to.upperDeg, p),
      lower: mix(from.foreDeg, to.foreDeg, p), hand: p > 0.8 ? 'grip' as const : 'relaxed' as const,
    };
    if (near) pose.armNear = arm; else pose.armFar = arm;
  }
  const cameraTravel = 120 * (1 - Math.exp(-loco.hip / 120));
  return {loco, pose, actorX: LEAVE_ACTOR_X + loco.hip, bikeX: LEAVE_BIKE_X + loco.hip,
    cameraX: LEAVE_ACTOR_X + 26 + cameraTravel, wheelDeg: wheelRotationFor(loco.hip),
    kickstand: 1 - progress(local, 0.55, 0.78)};
};
