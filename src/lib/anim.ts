export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInCubic = (t: number): number => Math.pow(clamp(t, 0, 1), 3);
export const easeInOutCubic = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutBack = (t: number, overshoot = 1.7): number => {
  const x = clamp(t, 0, 1) - 1;
  return 1 + (overshoot + 1) * x * x * x + overshoot * x * x;
};

/** Normalised progress of `frame` inside [from, to], clamped. */
export const range = (frame: number, from: number, to: number): number =>
  clamp((frame - from) / Math.max(1, to - from), 0, 1);

/** Damped oscillation used for impacts and wobbles. */
export const damped = (
  frame: number,
  start: number,
  {
    amplitude,
    frequency = 0.28,
    decay = 0.075,
    phase = 0,
  }: {amplitude: number; frequency?: number; decay?: number; phase?: number},
): number => {
  const t = frame - start;
  if (t < 0) {
    return 0;
  }
  return amplitude * Math.exp(-t * decay) * Math.cos(t * frequency + phase);
};

/** Physical drop: constant acceleration in px/s^2 expressed in frames. */
export const dropY = (
  frame: number,
  startFrame: number,
  y0: number,
  vy0: number,
  fps: number,
  gravity = 2600,
): number => {
  const t = Math.max(0, (frame - startFrame) / fps);
  return y0 + vy0 * t + 0.5 * gravity * t * t;
};
