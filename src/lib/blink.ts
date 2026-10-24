/** A few authored blinks, away from impact and other key contact moments. */
const BLINK_STARTS = [6.8, 8.9, 13.6, 16.2, 18.6, 20.7, 71.9, 74.1, 76.5];
export const blinkAt = (seconds: number): number => {
  for (const start of BLINK_STARTS) {
    const d = seconds - start;
    if (d < 0 || d >= 0.18) continue;
    if (d < 0.06) return d / 0.06;
    if (d < 0.09) return 1;
    return 1 - (d - 0.09) / 0.09;
  }
  return 0;
};
