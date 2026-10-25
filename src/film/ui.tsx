import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT, PALETTE} from '../theme';
import {HEIGHT, WIDTH, f} from './timeline';
import {VO} from './vo';
import {Street} from '../art/Street';
import {Bike, BIKE} from '../props/Bike';
import {Cup} from '../props/Cup';
import {TeaStain} from '../props/Splash';
import {CUP_REST, STAIN_X, CUP_GROUND_Y} from './alan';
import type {Vec} from '../lib/ik';
import {isLegalFrame} from './legalFlow';
import {PHONE_HEIGHT} from './stowPhone';

/* ------------------------------------------------------------------ camera */

export const Camera: React.FC<{
  x: number;
  y: number;
  scale: number;
  children: React.ReactNode;
}> = ({x, y, scale, children}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      transform: `scale(${scale}) translate(${WIDTH / 2 - x}px, ${HEIGHT / 2 - y}px)`,
      transformOrigin: `${WIDTH / 2}px ${HEIGHT / 2}px`,
    }}
  >
    {children}
  </div>
);


/* ------------------------------------------------------- evidence stills */

export const EVIDENCE_FOCUS = {x: 960 + BIKE.basketImpact.x, y: 1000 + BIKE.basketImpact.y};

export const HeldPhone: React.FC<{
  wrist: Vec;
  phone: {visible: boolean; angle: number; gripOffset: Vec};
  clipPoints: string;
  clipId: string;
}> = ({wrist, phone, clipPoints, clipId}) => phone.visible ? (
  <>
    <defs><clipPath id={clipId}><polygon points={clipPoints} /></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      <g transform={`translate(${wrist.x - phone.gripOffset.x} ${wrist.y - phone.gripOffset.y}) rotate(${phone.angle})`}>
        <rect x={-13} y={-PHONE_HEIGHT} width={26} height={PHONE_HEIGHT} rx={4.6} fill="#161E25" stroke="#5A6A72" strokeWidth={1.6} />
        <foreignObject x={-10.6} y={-PHONE_HEIGHT + 2.4} width={21.2} height={43.2}>
          <div style={{width: 21.2, height: 43.2, overflow: 'hidden', borderRadius: 2.4, position: 'relative'}}>
            <EvidenceStill w={21.2} h={43.2} focus={EVIDENCE_FOCUS} scale={0.2} />
          </div>
        </foreignObject>
      </g>
    </g>
  </>
) : null;

/** A framed crop of the real scene — used for photos, phone screens, evidence cards. */
export const EvidenceStill: React.FC<{
  w: number;
  h: number;
  focus: {x: number; y: number};
  scale: number;
  dim?: number;
}> = ({w, h, focus, scale, dim = 0.05}) => (
  <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: '#0E1A20'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
        transform: `translate(${w / 2}px, ${h / 2}px) scale(${scale}) translate(${-focus.x}px, ${-focus.y}px)`,
        transformOrigin: '0 0',
      }}
    >
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute'}}>
        <Street rain={6} dim={dim} />
      </svg>
      <Bike x={960} groundY={1000} cracked={1} dent={0.6} lean={-0.5} />
      <Cup {...CUP_REST} />
      <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.5} />
    </div>
  </div>
);

/* ------------------------------------------------------------- subtitles */

type Cue = {text: string; t0: number; t1: number};

const STORY_IDS = new Set(['L02', 'L03', 'L04', 'L08', 'L10', 'L11']);

export const SUB_CUES: Cue[] = VO.filter((l) => STORY_IDS.has(l.id)).flatMap((l) =>
  l.show.map((s) => ({text: s.text, t0: s.t0, t1: s.t1})),
);

export const subtitleCueAtFrame = (frame: number): Cue | null => {
  for (const c of SUB_CUES) {
    if (frame >= f(c.t0) && frame < f(c.t1)) {
      return c;
    }
  }
  return null;
};

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / 60;
  const cue = subtitleCueAtFrame(frame);
  if (!cue || isLegalFrame(frame)) {
    return null;
  }
  const fadeIn = interpolate(sec, [cue.t0 - 0.06, cue.t0 + 0.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(sec, [cue.t1 - 0.14, cue.t1 + 0.06], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background:
            'linear-gradient(to top, rgba(8,15,20,0.52) 0%, rgba(8,15,20,0.22) 46%, rgba(8,15,20,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 96,
          textAlign: 'center',
          opacity: Math.min(fadeIn, fadeOut),
        }}
      >
        <span data-story-part="subtitle"
          style={{
            fontFamily: FONT.sans,
            fontWeight: 400,
            fontSize: 54,
            lineHeight: 1.42,
            letterSpacing: 1.2,
            color: PALETTE.subtitle,
            textShadow: '0 2px 10px rgba(6,12,16,0.62), 0 1px 2px rgba(6,12,16,0.5)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {cue.text}
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- big text */

export const BigText: React.FC<{
  lines: {text: string; at: number}[];
  y: number;
  size?: number;
  weight?: number;
  align?: 'center' | 'left';
  x?: number;
}> = ({lines, y, size = 68, weight = 600, align = 'center', x}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: align === 'center' ? 0 : x ?? 140,
        right: align === 'center' ? 0 : undefined,
        textAlign: align,
        fontFamily: FONT.serif,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.34,
        letterSpacing: 3,
        color: PALETTE.subtitle,
        textShadow: '0 3px 16px rgba(6,12,16,0.72), 0 1px 3px rgba(6,12,16,0.6)',
      }}
    >
      {lines.map((l) => {
        const p = interpolate(frame, [l.at, l.at + 22], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={l.text}
            style={{opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------- law text */

const CLAUSE_MAX = 15;

const chunkClause = (text: string): string[] => {
  const rows: string[] = [];
  let cur = '';
  for (const ch of text) {
    cur += ch;
    if (cur.length >= CLAUSE_MAX && '，；。、,;'.includes(ch)) {
      rows.push(cur);
      cur = '';
    } else if (cur.length >= CLAUSE_MAX + 3) {
      rows.push(cur);
      cur = '';
    }
  }
  if (cur) rows.push(cur);
  return rows;
};

export const LawText: React.FC<{
  lines: string[];
  /** index of the clause being spoken, -1 = all equal */
  active: number;
  cite: string;
  y?: number;
  size?: number;
  x?: number;
  width?: number;
}> = ({lines, active, cite, y = 452, size = 52, x = 128, width = 1320}) => {
  return (
    <>
    <div
      style={{
        position: 'absolute',
        left: x - 190,
        top: y - 190,
        width: width + 420,
        height: 700,
        background:
          'radial-gradient(66% 62% at 26% 52%, rgba(7,13,17,0.9) 0%, rgba(7,13,17,0.82) 42%, rgba(7,13,17,0.34) 68%, rgba(7,13,17,0) 84%)',
      }}
    />
    <div style={{position: 'absolute', left: x, top: y, width}}>
      <div style={{width: 3, height: 26, background: PALETTE.lamp, opacity: 0.85, marginBottom: 20}} />
      {lines.map((l, i) => {
        const on = active < 0 || i === active;
        return (
          <div key={i} style={{marginBottom: 14}}>
            {chunkClause(l).map((row, ri) => (
              <div
                key={ri}
                style={{
                  fontFamily: FONT.serif,
                  fontWeight: 500,
                  fontSize: size,
                  lineHeight: 1.4,
                  letterSpacing: 1.2,
                  color: on ? '#F7F3E8' : 'rgba(240,236,226,0.6)',
                  textShadow: '0 2px 14px rgba(6,12,16,0.8)',
                  whiteSpace: 'nowrap',
                }}
              >
                {row}
              </div>
            ))}
          </div>
        );
      })}
      <div
        style={{
          marginTop: 16,
          fontFamily: FONT.sans,
          fontWeight: 400,
          fontSize: 28,
          letterSpacing: 1.5,
          color: 'rgba(233,226,210,0.62)',
        }}
      >
        ——{cite}
      </div>
    </div>
    </>
  );
};

export const CornerLabel: React.FC<{text: string; opacity?: number}> = ({text, opacity = 0.5}) => (
  <div
    style={{
      position: 'absolute',
      left: 64,
      top: 54,
      fontFamily: FONT.sans,
      fontSize: 24,
      letterSpacing: 3,
      color: 'rgba(240,236,226,0.9)',
      opacity,
    }}
  >
    {text}
  </div>
);

/** soft edge darkening; keeps night scenes from washing out without a heavy vignette */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.42}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(120% 96% at 50% 46%, rgba(0,0,0,0) 42%, rgba(4,9,13,${strength}) 100%)`,
    }}
  />
);

/** faint film grain that does not hide art problems (very low opacity) */
export const Grain: React.FC<{seed?: number}> = () => {
  return (
    <Img src={staticFile('film-v18/paper-texture.png')} style={{position: 'absolute', inset: 0,
      width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none',
      mixBlendMode: 'soft-light', opacity: 0.045}} />
  );
};
