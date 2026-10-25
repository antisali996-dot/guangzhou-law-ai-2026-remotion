/**
 * Single source of truth for every sound event in the film.
 * `src/film/Film.tsx` renders from it and `work/audio/mix.py` parses it,
 * so the studio preview and the delivered mix cannot drift apart again.
 */
import {LEAVE, LEAVE_START, LEAVE_WALK_DELAY} from './leave';
import {WALK_IN} from './alan';
import {CONTACT_T} from './eventTimes';
export {CONTACT_T} from './eventTimes';

export const SCORE_REMOTION_VOLUME = 0.4;

export type SfxCue = {at: number; file: string; v: number};

const step = (at: number, v: number): SfxCue => ({at, file: 'sfx-step.wav', v});

export const SFX_CUES: SfxCue[] = [
  ...WALK_IN.strikeTimes.map((at,i)=>step(at,Math.max(.26,.42-i*.04))),
  {at: 7.30, file: 'sfx-wheel.wav', v: 0.46},
  // the three collision sounds are all derived from one contact time
  {at: CONTACT_T, file: 'sfx-impact.wav', v: 0.86},
  {at: CONTACT_T + 0.033, file: 'sfx-splash.wav', v: 0.70},
  {at: CONTACT_T + 0.503, file: 'sfx-cupdrop.wav', v: 0.54},
  {at: 22.60, file: 'sfx-shutter.wav', v: 0.55},
  {at: 58.00, file: 'sfx-paper.wav', v: 0.50},
  {at: LEAVE_START + LEAVE_WALK_DELAY + 0.15, file: 'sfx-wheel.wav', v: 0.42},
  ...LEAVE.strikeTimes.map((at, i) => step(LEAVE_START + at, Math.max(0.30, 0.42 - i * 0.02))),
];
