import {BAG, bagPointFor, armGeometryFor, type Pose} from '../characters/Rig';
import {Easing, interpolate} from 'remotion';

const smooth = Easing.inOut(Easing.cubic);
const ip = (t: number, times: number[], values: number[], easing = smooth) =>
  interpolate(t, times, values, {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const PHONE_HEIGHT = 48;
export const PHONE_GRIP = {x: 8, y: -29};

export const phoneAboveBagPoints = (pose: Pose) => [
  {x: -500, y: -500}, {x: 500, y: -500},
  {x: 500, y: BAG.mouthY}, {x: -500, y: BAG.mouthY},
].map((point) => bagPointFor(pose, point)).map((point) => `${point.x},${point.y}`).join(' ');

export const phoneStowAt = (local: number) => {
  const lower = ip(local, [0.2, 0.9], [0, 1], smooth);
  const insert = ip(local, [0.9, 1.7], [0, 1], smooth);
  const withdraw = ip(local, [1.8, 2.2], [0, 1], smooth);
  const look = ip(local, [1.7, 2.4], [0, 1], smooth);
  const pose: Pose = {
    lean: 1.8, chest: 1.4, headYaw: 0.34 * lower + 0.3 * look,
    headNod: 14 * lower + 16 * look, headTilt: 1, mood: -0.3,
    shoulderLift: 2.4 * (1 - lower), armNear: {kind: 'relaxed'}, armFar: {kind: 'relaxed'},
  };
  const angle = BAG.angle + (pose.lean ?? 0) + (pose.chest ?? 0) * 0.5;
  const r = angle * Math.PI / 180;
  const gripOffset = {x: PHONE_GRIP.x * Math.cos(r) - PHONE_GRIP.y * Math.sin(r),
    y: PHONE_GRIP.x * Math.sin(r) + PHONE_GRIP.y * Math.cos(r)};
  // Keep the entire phone above the opening, then slide its full height inside.
  const bottomInBag = {x: 0, y: BAG.mouthY - 3 + 54 * insert};
  const atBag = bagPointFor(pose, bottomInBag);
  const bottom = {x: 74 + (atBag.x - 74) * lower, y: -126 + (atBag.y + 126) * lower};
  const holding = {x: bottom.x + gripOffset.x, y: bottom.y + gripOffset.y};
  const topInBagY = bottomInBag.y - PHONE_HEIGHT;
  const visible = topInBagY < BAG.mouthY;
  const handTarget = {
    x: holding.x + (13 - holding.x) * withdraw,
    y: holding.y + (14 - holding.y) * withdraw,
  };
  pose.armNear = {kind: 'ik', target: handTarget, hand: visible ? 'phone' : 'relaxed'};
  const bagOpen = ip(local, [0.45, 0.75, 1.85, 2.15], [0, 1, 1, 0]);
  return {pose, angle, gripOffset, bottomInBag, topInBagY, visible, handTarget, bagOpen};
};

/** Retrieve through the same opening, then lift the phone and aim at the basket. */
export const phoneTakeOutAt = (local: number) => {
  const state = phoneStowAt(ip(local, [0.15, 0.95], [1.7, 0.2]));
  const reach = ip(local, [0, 0.2], [0, 1]);
  const aim = ip(local, [1.2, 1.95], [0, 1]);
  const pose: Pose = {...state.pose, armNear: {kind: 'relaxed'}, armFar: {kind: 'relaxed'}};
  const relaxed = armGeometryFor(pose, true);
  const handTarget = {
    x: relaxed.wrist.x + (state.handTarget.x - relaxed.wrist.x) * reach - 4 * aim,
    y: relaxed.wrist.y + (state.handTarget.y - relaxed.wrist.y) * reach + 40 * aim,
  };
  pose.armNear = {kind: 'ik', target: handTarget, hand: state.visible ? 'phone' : 'relaxed'};
  if (reach < 1) {
    const target = armGeometryFor(pose, true);
    pose.armNear = {kind: 'angles', upper: relaxed.upperDeg + (target.upperDeg - relaxed.upperDeg) * reach,
      lower: relaxed.foreDeg + (target.foreDeg - relaxed.foreDeg) * reach, hand: 'relaxed'};
  }
  pose.headYaw = ip(local, [0, 1], [-0.34, 0.05]);
  pose.headNod = ip(local, [0, 0.8], [-16, 10]) - 6 * aim;
  pose.headTilt = ip(local, [0, 0.8], [-3, 0]);
  pose.mood = -0.2;
  const bagOpen = ip(local, [0.03, 0.17, 0.95, 1.18], [0, 1, 1, 0]);
  return {...state, pose, handTarget, bagOpen};
};
