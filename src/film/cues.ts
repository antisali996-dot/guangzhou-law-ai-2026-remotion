/**
 * Single source of truth for every sound event in the film.
 * `src/film/Film.tsx` renders from it and `work/audio/mix.py` parses it,
 * so the studio preview and the delivered mix cannot drift apart again.
 */
import {LEAVE, LEAVE_START, LEAVE_WALK_DELAY} from './leave';

export const SCORE_REMOTION_VOLUME = 0.4;

/** Frame-accurate moment the cup strikes the basket rim. */
export const CONTACT_T = 10.7667;

export type SfxCue = {at: number; file: string; v: number};

const step = (at: number, v: number): SfxCue => ({at, file: 'sfx-step.wav', v});

export const SFX_CUES: SfxCue[] = [
  step(6.27, 0.42),
  step(6.76, 0.40),
  step(7.26, 0.36),
  step(7.78, 0.26),
  {at: 7.30, file: 'sfx-wheel.wav', v: 0.46},
  // the three collision sounds are all derived from one contact time
  {at: CONTACT_T, file: 'sfx-impact.wav', v: 0.86},
  {at: CONTACT_T + 0.033, file: 'sfx-splash.wav', v: 0.70},
  {at: CONTACT_T + 0.503, file: 'sfx-cupdrop.wav', v: 0.54},
  {at: 22.60, file: 'sfx-shutter.wav', v: 0.55},
  {at: 56.40, file: 'sfx-paper.wav', v: 0.50},
  {at: LEAVE_START + LEAVE_WALK_DELAY + 0.15, file: 'sfx-wheel.wav', v: 0.42},
  ...LEAVE.strikeTimes.map((at, i) => step(LEAVE_START + at, Math.max(0.30, 0.42 - i * 0.02))),
];
