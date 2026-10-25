import React from 'react';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {FPS, SCENES, TOTAL_FRAMES, f, type SceneId} from './timeline';
import {SCORE_REMOTION_VOLUME, SFX_CUES} from './cues';
import {VO} from './vo';
import {CornerLabel, Grain, Subtitles, Vignette} from './ui';
import {S01Street} from './scenes/S01Street';
import {S00Cold} from './scenes/S00Cold';
import {S02Reaction} from './scenes/S02Reaction';
import {S03Residents} from './scenes/S03Residents';
import {S04Evidence} from './scenes/S04Evidence';
import {S05Law, S06Law, S07Law, S09Law} from './scenes/LawScenes';
import {S08Investigate, S10Confirm, S11Leave, S12Card} from './scenes/Ending';
import {foregroundRainAt} from './cameraAngles';

type SceneProps = {start: number};

/** Every shot of the film; a scene must exist for every entry in SCENES. */
const SHOTS: Partial<Record<SceneId, React.FC<SceneProps>>> = {
  s00: S00Cold,
  s01: S01Street,
  s02: S02Reaction,
  s03: S03Residents,
  s04: S04Evidence,
  s05: S05Law,
  s06: S06Law,
  s07: S07Law,
  s08: S08Investigate,
  s09: S09Law,
  s10: S10Confirm,
  s11: S11Leave,
  s12: S12Card,
};

/** cuts inside an action beat stay hard; entering a new place (evidence, law, ending) fades through the night */
const FADE_IN: Partial<Record<SceneId, number>> = {s04: 0, s05: 14, s06: 10, s07: 10, s08: 16, s09: 16, s10: 12, s11: 0, s12: 24};

const Fade: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const frame = useCurrentFrame();
  const o = frames > 0 ? interpolate(frame, [0, frames], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Missing: React.FC<{note: string}> = ({note}) => (
  <AbsoluteFill style={{background: '#101B22', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{color: '#8FA6A2', fontFamily: 'sans-serif', fontSize: 30}}>{note}</div>
  </AbsoluteFill>
);

export const Film: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#0B141A'}}>
    {SCENES.map((s) => {
      const Comp = SHOTS[s.id];
      return (
        <Sequence
          key={s.id}
          from={f(s.start)}
          durationInFrames={f(s.end) - f(s.start)}
          name={`${s.id} ${s.note}`}
        >
          <Fade frames={FADE_IN[s.id] ?? 0}>
            {Comp ? <Comp start={s.start} /> : <Missing note={`${s.id} — ${s.note}`} />}
          </Fade>
        </Sequence>
      );
    })}

    {/* narration: one Audio element per measured line, locked to the timeline */}
    {VO.map((line) => (
      <Sequence
        key={line.id}
        from={f(line.start)}
        durationInFrames={f(line.dur) + 2}
        name={`VO ${line.id}`}
      >
        <Audio src={staticFile(`vo/${line.file}`)} volume={1} />
      </Sequence>
    ))}

    <Rain />
    <Subtitles />
    <CornerLabel text="AI辅助创作 · 虚构故事" opacity={0.42} />

    {/* original score for this film; no continuous noise bed */}
    <Audio src={staticFile('audio/score.wav')} volume={SCORE_REMOTION_VOLUME} />

    {/* every effect is tied to a visible action; timing lives in cues.ts */}
    {SFX_CUES.map((s) => (
      <Sequence key={`${s.file}@${s.at}`} from={f(s.at)} durationInFrames={f(3)} name={s.file}>
        <Audio src={staticFile(`audio/${s.file}`)} volume={s.v} />
      </Sequence>
    ))}

    <Grade />
    <Vignette strength={0.16} />
  </AbsoluteFill>
);

/** very light rain across the whole film: thin, slanted, slow enough to read as mood rather than weather */
const RAIN_N = 70;
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const Rain: React.FC = () => {
  const frame = useCurrentFrame();
  if (!foregroundRainAt(frame)) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {Array.from({length: RAIN_N}).map((_, i) => {
          const speed = 15 + rnd(i + 3) * 9; // px per frame
          const len = 34 + rnd(i + 7) * 52;
          const x0 = rnd(i) * 2100 - 100;
          const y = ((rnd(i + 11) * 1300 + frame * speed) % 1300) - 110;
          const x = x0 - y * 0.16;
          return (
            <line key={i} x1={x} y1={y} x2={x - len * 0.16} y2={y + len} stroke="#C4DAE8" strokeWidth={1 + rnd(i + 5) * 0.8} opacity={0.07 + rnd(i + 9) * 0.09} strokeLinecap="round" />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** shared colour grade: teal shadows up top, warm lift near the ground, very light grain */
const Grade: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, rgba(40,92,120,0.10) 0%, rgba(40,92,120,0) 45%, rgba(255,170,90,0.06) 100%)',
        mixBlendMode: 'soft-light',
      }}
    />
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at 50% 62%, rgba(255,190,120,0.04) 0%, rgba(255,190,120,0) 60%)',
        mixBlendMode: 'screen',
      }}
    />
    <Grain />
  </AbsoluteFill>
);

export const FILM_FRAMES = TOTAL_FRAMES;
export const FILM_FPS = FPS;
