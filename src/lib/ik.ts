export type Vec = {x: number; y: number};

export type TwoBoneSolution = {
  /** Elbow joint position in the same space as the inputs. */
  elbow: Vec;
  /** Angle of the upper segment in degrees (screen space, 0 = +x). */
  upper: number;
  /** Angle of the lower segment in degrees (screen space). */
  lower: number;
  /** Wrist position actually reachable (clamped to the bone lengths). */
  wrist: Vec;
  /** True when the target is farther than the limb can reach. */
  stretched: boolean;
};

/**
 * Analytical two-bone IK (shoulder → elbow → hand).
 * `bend` = +1 / -1 selects which side the joint pops to.
 */
export const solveTwoBone = (
  root: Vec,
  target: Vec,
  upperLength: number,
  lowerLength: number,
  bend: 1 | -1,
): TwoBoneSolution => {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const raw = Math.hypot(dx, dy);
  const min = Math.abs(upperLength - lowerLength) + 1;
  const max = upperLength + lowerLength - 0.5;
  const dist = Math.min(max, Math.max(min, raw));
  const stretched = raw > max;

  const base = Math.atan2(dy, dx);
  const cosShoulder =
    (upperLength * upperLength + dist * dist - lowerLength * lowerLength) /
    (2 * upperLength * dist);
  const shoulderOffset = Math.acos(Math.min(1, Math.max(-1, cosShoulder)));
  const shoulderAngle = base + bend * shoulderOffset;
  const elbow: Vec = {
    x: root.x + Math.cos(shoulderAngle) * upperLength,
    y: root.y + Math.sin(shoulderAngle) * upperLength,
  };
  const wrist: Vec = {
    x: root.x + Math.cos(base) * dist,
    y: root.y + Math.sin(base) * dist,
  };
  const lowerAngle = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
  const deg = (r: number) => (r * 180) / Math.PI;
  return {
    elbow,
    wrist,
    upper: deg(shoulderAngle),
    lower: deg(lowerAngle),
    stretched,
  };
};
