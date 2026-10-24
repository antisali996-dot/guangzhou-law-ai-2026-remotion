import React from 'react';
import {solveTwoBone, type Vec} from '../lib/ik';
import {SKIN} from '../theme';

/**
 * Layered 2-D character rig (flat illustration with two-tone modelling).
 *
 * Screen space: origin at the hip centre, +y down. Every joint is an explicit
 * pivot: hips, knees, ankles, waist, neck, shoulders, elbows, wrists. Scenes
 * never touch geometry — they only hand a `Pose` to this component, so the
 * character stays identical across every shot.
 */

export const RIG = {
  hipHalf: 21,
  thigh: 96,
  shin: 90,
  footH: 24,
  shoulderHalf: 29,
  upperArm: 88,
  forearm: 86,
  shoulderY: -146,
  neckY: -152,
  headY: -191,
  headR: 31,
} as const;

export type HandPose = 'grip' | 'open' | 'phone' | 'relaxed';

export type ArmSpec =
  | {kind: 'ik'; target: Vec; bend?: 1 | -1; hand?: HandPose}
  | {kind: 'angles'; upper: number; lower: number; hand?: HandPose}
  | {kind: 'relaxed'; hand?: HandPose};

/** hip/knee in degrees from vertical (knee < 0 flexes backwards); foot = absolute toe-down angle */
export type LegSpec = {hip: number; knee: number; foot?: number};

export type Pose = {
  lean?: number;
  chest?: number;
  headYaw?: number;
  headNod?: number;
  headTilt?: number;
  shoulderLift?: number;
  armNear: ArmSpec;
  armFar: ArmSpec;
  legNear?: LegSpec;
  legFar?: LegSpec;
  breath?: number;
  ponytail?: number;
  /** 0 = calm, 1 = brief startle (raised brows, wider eyes, parted mouth) */
  surprise?: number;
  blink?: number;
  /** -1 = worried / serious, 0 = neutral, +1 = warm smile. Default is a faint smile. */
  mood?: number;
};

export type CharacterLook = {
  shirt: string;
  shirtShade: string;
  pants: string;
  pantsShade: string;
  shoes: string;
  shoeSole: string;
  hair: string;
  hairShade: string;
  skin: string;
  skinShade: string;
  bag?: string;
  /** 'ponytail' = 阿岚, 'short' = 居民 */
  hairStyle: 'ponytail' | 'short';
  height?: number;
};

export const ALAN_LOOK: CharacterLook = {
  shirt: '#E2664F',
  shirtShade: '#B84A3C',
  pants: '#2F3A4E',
  pantsShade: '#222B3B',
  shoes: '#EDE8DE',
  shoeSole: '#9D9F9B',
  hair: '#221E1D',
  hairShade: '#151212',
  skin: SKIN.base,
  skinShade: SKIN.shade,
  bag: '#7A5B44',
  hairStyle: 'ponytail',
};

export const RESIDENT_LOOK: CharacterLook = {
  shirt: '#8E8C7E',
  shirtShade: '#767466',
  pants: '#4A4238',
  pantsShade: '#3A342C',
  shoes: '#3C3A36',
  shoeSole: '#26241F',
  hair: '#4A4642',
  hairShade: '#35322E',
  skin: '#E2B48D',
  skinShade: '#C8936C',
  hairStyle: 'short',
};

const rad = (deg: number) => (deg * Math.PI) / 180;

const rot = (p: Vec, deg: number): Vec => ({
  x: p.x * Math.cos(rad(deg)) - p.y * Math.sin(rad(deg)),
  y: p.x * Math.sin(rad(deg)) + p.y * Math.cos(rad(deg)),
});

export const BAG = {x: -24, y: -10, angle: -6, mouthY: 4, height: 52} as const;

/** Bag, torso and held objects share the same hip-local coordinate system. */
export const torsoPointFor = (pose: Pose, point: Vec): Vec => {
  const pivotY = RIG.shoulderY * 0.3;
  const r = rot({x: point.x, y: point.y - pivotY}, (pose.lean ?? 0) + (pose.chest ?? 0) * 0.5);
  return {x: r.x, y: r.y + pivotY};
};

export const bagPointFor = (pose: Pose, point: Vec): Vec => {
  const r = rot(point, BAG.angle);
  return torsoPointFor(pose, {x: BAG.x + r.x, y: BAG.y + r.y});
};

type ArmGeom = {shoulder: Vec; elbow: Vec; wrist: Vec; upperDeg: number; foreDeg: number};

const solveArm = (shoulder: Vec, spec: ArmSpec, outward: 1 | -1): ArmGeom => {
  if (spec.kind === 'ik') {
    // Both analytical solutions are valid; the elbow one that hangs lowest keeps the
    // arm outside the torso instead of folding across the chest.
    const a = solveTwoBone(shoulder, spec.target, RIG.upperArm, RIG.forearm, 1);
    const b = solveTwoBone(shoulder, spec.target, RIG.upperArm, RIG.forearm, -1);
    // A relaxed arm hangs: prefer the elbow that sits lower than the shoulder-hand line,
    // and only use the outward side to break near-ties. Never the raised "chicken wing".
    const dy = a.elbow.y - b.elbow.y;
    const dx = outward * (a.elbow.x - b.elbow.x);
    const s = Math.abs(dy) > 4 ? (dy > 0 ? a : b) : dx > 0 ? a : b;
    return {shoulder, elbow: s.elbow, wrist: s.wrist, upperDeg: s.upper, foreDeg: s.lower};
  }
  const upper = spec.kind === 'angles' ? spec.upper : outward === 1 ? 88 : 108;
  const lower = spec.kind === 'angles' ? spec.lower : outward === 1 ? 84 : 94;
  const elbow = {
    x: shoulder.x + Math.cos(rad(upper)) * RIG.upperArm,
    y: shoulder.y + Math.sin(rad(upper)) * RIG.upperArm,
  };
  const wrist = {
    x: elbow.x + Math.cos(rad(lower)) * RIG.forearm,
    y: elbow.y + Math.sin(rad(lower)) * RIG.forearm,
  };
  return {shoulder, elbow, wrist, upperDeg: upper, foreDeg: lower};
};

export const armGeometryFor = (pose: Pose, near: boolean): ArmGeom => {
  const shoulder = torsoPointFor(pose, {
    x: near ? RIG.shoulderHalf : -RIG.shoulderHalf + 12,
    y: RIG.shoulderY - (pose.shoulderLift ?? 0) * (near ? 1 : 0.75),
  });
  return solveArm(shoulder, near ? pose.armNear : pose.armFar, near ? 1 : -1);
};

/** Tapered limb polygon from a joint chain with per-joint widths. */
const limbPath = (a: Vec, b: Vec, wa: number, wb: number): string => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const p1 = {x: a.x + nx * wa, y: a.y + ny * wa};
  const p2 = {x: b.x + nx * wb, y: b.y + ny * wb};
  const p3 = {x: b.x - nx * wb, y: b.y - ny * wb};
  const p4 = {x: a.x - nx * wa, y: a.y - ny * wa};
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Q ${b.x} ${b.y} ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Q ${a.x} ${a.y} ${p1.x} ${p1.y} Z`;
};

export const Hand: React.FC<{
  wrist: Vec;
  angle: number;
  pose: HandPose;
  look: CharacterLook;
}> = ({wrist, angle, pose, look}) => {
  const fingers = pose === 'grip' ? 4 : 4;
  return (
    <g transform={`translate(${wrist.x} ${wrist.y}) rotate(${angle})`}>
      {/* back of the hand */}
      <path
        d="M -7 -8 q 12 -4 17 4 q 2 8 -4 12 q -10 3 -14 -4 q -3 -8 1 -12 z"
        fill={look.skin}
      />
      <path d="M -6 3 q 8 5 15 1 q 1 5 -5 7 q -8 1 -10 -8 z" fill={look.skinShade} opacity={0.5} />
      {pose === 'grip' ? (
        <g>
          {Array.from({length: fingers}).map((_, i) => (
            <g key={i}>
              <path
                d={`M 3 ${-6.5 + i * 4.6} q 9 -1.4 11.5 3 q 1.6 3.6 -3.2 3.8 q -7.4 0.2 -8.6 -3.6`}
                fill={look.skin}
              />
              <path
                d={`M 3.5 ${-6.2 + i * 4.6} q 9 -1.2 11 3`}
                stroke={look.skinShade}
                strokeWidth={0.9}
                fill="none"
                opacity={0.6}
              />
            </g>
          ))}
          {/* thumb wrapping over the bar */}
          <path d="M -5 -7.5 q 9 -3.4 13 1.6 q 3 4.2 -2.4 6.2 q -7 1.4 -11 -2.6 z" fill={look.skin} />
          <path d="M -5 -7.5 q 9 -3.4 13 1.6" stroke={look.skinShade} strokeWidth={1} fill="none" opacity={0.55} />
        </g>
      ) : pose === 'phone' ? (
        <g>
          {Array.from({length: 4}).map((_, i) => (
            <path
              key={i}
              d={`M 3 ${-6.5 + i * 4.4} q 8 -1 10 3 q 1.4 3.2 -3 3.4 q -6.6 0.2 -7.8 -3.2`}
              fill={look.skin}
            />
          ))}
          <path d="M -5 -6 q 8 -4 12 0 q 3 3.6 -2 5.4 q -6.4 1.2 -10 -2.4 z" fill={look.skin} />
        </g>
      ) : pose === 'open' ? (
        <g>
          {Array.from({length: 4}).map((_, i) => (
            <path
              key={i}
              d={`M 5 ${-6 + i * 4.4} q ${9 - Math.abs(i - 1.5) * 1.8} ${-1.4 + i * 0.9} ${11 - Math.abs(i - 1.5) * 2} ${-0.4 + i * 0.9}`}
              stroke={look.skin}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <path d="M -4 -6 q -7 -1.6 -9 3.4" stroke={look.skin} strokeWidth={4.4} strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          {/* relaxed: palm, four loosely curled fingers, thumb along the side */}
          <ellipse cx={6} cy={0} rx={9} ry={7.4} fill={look.skin} />
          {[
            {y: -4.6, l: 15, c: 3.2},
            {y: -1.6, l: 17, c: 4},
            {y: 1.4, l: 16, c: 4.4},
            {y: 4.2, l: 12.6, c: 4.4},
          ].map((fg, i) => (
            <path
              key={i}
              d={`M 9 ${fg.y} q ${fg.l * 0.6} ${fg.c * 0.4} ${fg.l} ${fg.c}`}
              stroke={look.skin}
              strokeWidth={3.7}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <path d="M 2 -6 q 7 -4 13 1" stroke={look.skin} strokeWidth={4} strokeLinecap="round" fill="none" />
          <path d="M 9 -3.2 q 7 0.8 13 3 M 9 -0.2 q 8 1.2 14 4 M 9 2.8 q 7 1.2 12 4" stroke={look.skinShade} strokeWidth={0.9} fill="none" opacity={0.5} />
        </g>
      )}
      <path d="M -5 -6 q 5 -2 8 1" stroke={look.skinShade} strokeWidth={1.2} fill="none" opacity={0.55} />
    </g>
  );
};

const Arm: React.FC<{
  geom: ArmGeom;
  look: CharacterLook;
  near: boolean;
  hand: HandPose;
  sleeve?: boolean;
  /** Held object, anchored to the wrist and drawn beneath the curled fingers. */
  prop?: (wrist: Vec, angle: number) => React.ReactNode;
}> = ({geom, look, near, hand, sleeve = true, prop}) => {
  const {shoulder, elbow, wrist, upperDeg, foreDeg} = geom;
  const skin = near ? look.skin : look.skinShade;
  const shirt = near ? look.shirt : look.shirtShade;
  // Upper-arm sleeve ends ~55% down the upper arm; forearm is bare skin.
  const sleeveEnd = {
    x: shoulder.x + (elbow.x - shoulder.x) * 0.56,
    y: shoulder.y + (elbow.y - shoulder.y) * 0.56,
  };
  return (
    <g>
      <path d={limbPath(shoulder, elbow, 9.2, 6.8)} fill={skin} />
      <path d={limbPath(elbow, wrist, 6.8, 4.6)} fill={skin} />
      <path d={limbPath(elbow, wrist, 5, 3.4)} fill={look.skinShade} opacity={near ? 0.14 : 0.24} />
      {sleeve ? (
        <>
          {/* short sleeve: one continuous cloth shape, rounded at the shoulder */}
          {near ? <circle cx={shoulder.x} cy={shoulder.y + 2} r={11.6} fill={shirt} /> : null}
          <path d={limbPath(shoulder, sleeveEnd, near ? 11.6 : 9.6, near ? 10.8 : 10)} fill={shirt} />
          <path d={limbPath(shoulder, sleeveEnd, 4.4, 4.6)} fill={look.shirtShade} opacity={near ? 0.26 : 0.2} />
          <path d={limbPath(sleeveEnd, {x: sleeveEnd.x + (elbow.x - shoulder.x) * 0.06, y: sleeveEnd.y + (elbow.y - shoulder.y) * 0.06}, 10.8, 10.8)} fill={look.shirtShade} opacity={0.5} />
        </>
      ) : null}
      <circle cx={elbow.x} cy={elbow.y} r={7.4} fill={skin} />
      {prop ? prop(wrist, foreDeg) : null}
      <Hand wrist={wrist} angle={foreDeg} pose={hand} look={{...look, skin}} />
    </g>
  );
};

const Leg: React.FC<{hip: Vec; spec: LegSpec; look: CharacterLook; near: boolean}> = ({
  hip,
  spec,
  look,
  near,
}) => {
  const knee = {
    x: hip.x + Math.sin(rad(spec.hip)) * RIG.thigh,
    y: hip.y + Math.cos(rad(spec.hip)) * RIG.thigh,
  };
  const a2 = rad(spec.hip + spec.knee);
  const ankle = {x: knee.x + Math.sin(a2) * RIG.shin, y: knee.y + Math.cos(a2) * RIG.shin};
  const pants = near ? look.pants : look.pantsShade;
  return (
    <g>
      {near ? null : <circle cx={hip.x} cy={hip.y + 6} r={14} fill={pants} />}
      <path d={limbPath({x: hip.x, y: hip.y + 8}, knee, 14.6, 11.6)} fill={pants} />
      <path d={limbPath(knee, ankle, 11, 6.6)} fill={pants} />
      <circle cx={knee.x} cy={knee.y} r={11.2} fill={pants} />
      {/* knee crease and a turned-up cuff */}
      <path
        d={`M ${knee.x - 8} ${knee.y + 3} q 8 4 16 -1`}
        stroke={look.pantsShade}
        strokeWidth={2.2}
        fill="none"
        opacity={0.5}
      />
      <path d={limbPath({x: ankle.x + (knee.x - ankle.x) * 0.08, y: ankle.y + (knee.y - ankle.y) * 0.08}, ankle, 7.4, 7.2)} fill={look.pantsShade} opacity={0.7} />
      {/* shoe */}
      <g transform={`translate(${ankle.x} ${ankle.y}) rotate(${spec.foot ?? (spec.hip < 0 ? -spec.hip * 1.05 : -spec.hip * 0.45) - spec.knee * 0.3 - 1})`}>
        <path d="M -9 -2 q 1 -8 9 -8 q 11 0 17 6 q 5 5 3 10 l -28 1 q -3 -4 -1 -9 z" fill={look.shoes} />
        <path d="M -10 6 l 30 -1 q 2 3 -1 5 l -28 0 q -2 -2 -1 -4 z" fill={look.shoeSole} />
        <path d="M 2 -2 q 6 3 10 1" stroke={look.shoeSole} strokeWidth={1.6} fill="none" opacity={0.7} />
      </g>
    </g>
  );
};

const Head: React.FC<{
  yaw: number;
  nod: number;
  tilt: number;
  look: CharacterLook;
  ponytail: number;
  surprise?: number;
  mood?: number;
  blink?: number;
}> = ({yaw, nod, tilt, look, ponytail, surprise = 0, mood = 0.25, blink = 0}) => {
  const f = yaw * 6; // features slide with the head turn
  const squash = 1 - Math.abs(yaw) * 0.07;
  const m = nod * 0.08;
  const sx = surprise;
  const worry = Math.max(0, -mood);
  const smile = Math.max(0, mood);
  const eyeOpen = Math.max(0.04, 1 - Math.min(1, Math.max(0, blink)));
  return (
    <g transform={`rotate(${tilt}) translate(${yaw * 2} 0)`}>
      {/* neck: slim, lit from the front, shadow thrown by the jaw */}
      <path d="M -7 12 L 7.5 12 L 9 36 Q 0 47 -9 36 Z" fill={look.skin} />
      <path d="M -7 12 L 7.5 12 L 8 25 Q 0 31 -7 25 Z" fill={look.skinShade} opacity={0.75} />
      <path d="M -9 36 Q 0 47 9 36 L 9 38 Q 0 49 -9 38 Z" fill={look.skinShade} opacity={0.4} />
      {/* ponytail: tied low behind the head, soft tapered tail */}
      {look.hairStyle === 'ponytail' ? (
        <g transform={`rotate(${ponytail} -21 -16)`}>
          <path
            d="M -21 -24 C -35 -22 -43 -4 -41 13 C -40 26 -34 36 -26 38 C -18 39 -15 31 -21 24 C -27 14 -27 2 -23 -9 Z"
            fill={look.hairShade}
          />
          <path d="M -26 -17 C -33 -9 -35 6 -32 18" stroke={look.hair} strokeWidth={3.2} fill="none" opacity={0.42} strokeLinecap="round" />
          <path d="M -30 8 C -31 18 -29 27 -26 33" stroke="#4A3F3C" strokeWidth={1.6} fill="none" opacity={0.5} strokeLinecap="round" />
          <rect x={-27} y={-26} width={9} height={7.5} rx={3.2} fill="#C9604F" transform="rotate(-24 -22 -22)" />
        </g>
      ) : null}
      <g transform={`scale(${squash} 1) translate(${-f * 0.1} 0)`}>
        {/* face: full forehead, soft cheeks, small rounded chin */}
        <path
          d="M -24 -4 C -25 -21 -13 -31 2 -31 C 17 -31 27 -21 27 -6 C 27 4 24 12 20 19 C 16 25 9 29 2 29 C -8 29 -17 25 -21 16 C -23 11 -24 4 -24 -4 Z"
          fill={look.skin}
        />
        <path d="M 8 9 C 18 11 22 18 18 24 C 13 29 6 30 1 29 C 7 24 10 16 8 9 Z" fill={look.skinShade} opacity={0.16} />
        {/* ear + earring */}
        <ellipse cx={-21} cy={4} rx={4.4} ry={6.2} fill={look.skinShade} />
        <ellipse cx={-21} cy={4.5} rx={2.2} ry={3.6} fill={look.skin} opacity={0.5} />
        <circle cx={-21} cy={10.4} r={1.8} fill="#F2D27A" />
        {/* brows: thin, softly arched; inner ends lift when worried */}
        <path d={`M ${-9 + f} ${-13.6 - 3 * sx + 0.8 * worry} q 4.6 ${-2.6 - 1.2 * worry} 9 ${0.2 - 3.6 * worry}`} stroke="#3A2D29" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        <path d={`M ${6.4 + f} ${-14.2 - 3 * sx - 3 * worry} q 4.6 ${-2.2 + 1.4 * worry} 8.8 ${1.2 + 3 * worry}`} stroke="#3A2D29" strokeWidth={1.7} fill="none" strokeLinecap="round" />
        {/* eyes: small sclera, large dark iris tucked under the lid, one catch-light */}
        <g transform={`translate(0 -3.2) scale(1 ${eyeOpen}) translate(0 3.2)`}>
        <ellipse cx={-4.4 + f} cy={-3.2} rx={4.1} ry={4.5 + 0.8 * sx} fill="#F7F2EA" />
        <ellipse cx={10.6 + f} cy={-3.2} rx={3.8} ry={4.4 + 0.8 * sx} fill="#F7F2EA" />
        <circle cx={-3.6 + f} cy={-3.2} r={3} fill="#44302A" />
        <circle cx={11.3 + f} cy={-3.2} r={2.8} fill="#44302A" />
        <circle cx={-3.5 + f} cy={-3.2} r={1.7} fill="#15100E" />
        <circle cx={11.4 + f} cy={-3.2} r={1.6} fill="#15100E" />
        <circle cx={-2.7 + f} cy={-4.2} r={0.85} fill="#fff" opacity={0.95} />
        <circle cx={12.1 + f} cy={-4.2} r={0.8} fill="#fff" opacity={0.95} />
        {/* upper lids and one soft outer lash each */}
        <path d={`M ${-9 + f} -4.2 q 4.6 -5.2 9 -0.2`} stroke="#2B221F" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <path d={`M ${7 + f} -4.2 q 4.3 -4.8 8.4 -0.2`} stroke="#2B221F" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <path d={`M ${-9 + f} -4.2 l -2 -1.2`} stroke="#2B221F" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <path d={`M ${15.4 + f} -4.4 l 1.8 -1.3`} stroke="#2B221F" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        </g>
        <g opacity={blink} stroke="#2B221F" strokeWidth={1.4} strokeLinecap="round" fill="none">
          <path d={`M ${-9+f} -3.2 q 4.6 1.1 9 0`} />
          <path d={`M ${7+f} -3.2 q 4.3 1.1 8.4 0`} />
        </g>
        {/* nose: a small shaded tip, no hook */}
        <path d={`M ${14.6 + f} 2.4 q 2.2 2.2 0.2 4.4`} stroke={look.skinShade} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.85} />
        {/* cheek colour, kept subtle */}
        <ellipse cx={3.5 + f} cy={10.4} rx={4.8} ry={2.8} fill="#E58C7C" opacity={0.17} />
        {/* mouth: follows mood */}
        {sx > 0.35 ? (
          <ellipse cx={8 + f} cy={16.6 + m} rx={2.6} ry={1.3 + 2.1 * sx} fill="#7A3F33" />
        ) : (
          <>
            <path d={`M ${3.4 + f} ${16 + m} q 4.6 ${5.6 * smile - 3.8 * worry} 9.2 ${-0.8 * smile + 0.4 * worry}`} stroke="#B8564C" strokeWidth={2.1} fill="none" strokeLinecap="round" />
            {smile > 0.15 ? <path d={`M ${12.4 + f} ${15.6 + m} q 0.9 0.2 1.2 -0.7`} stroke="#B8564C" strokeWidth={1.2} fill="none" strokeLinecap="round" /> : null}
          </>
        )}
      </g>
      {/* hair: rounded crown, side-swept fringe that clears the brows, side lock past the ear */}
      <path
        d="M -28 -2 C -33 -27 -16 -40 2 -39 C 21 -38 32 -25 29 -5 C 26 -13 21 -19 14 -22 C 6 -19 -9 -19 -18 -11 C -21 -5 -22 8 -22 15 C -26 12 -29 4 -28 -2 Z"
        fill={look.hair}
      />
      <path
        d="M 28 -8 C 27 -27 13 -37 -3 -35 C -19 -34 -27 -22 -26 -8 C -17 -21 -3 -27 8 -24 C 17 -22 24 -17 28 -8 Z"
        fill={look.hair}
      />
      <path d="M -24 -9 C -27 2 -28 16 -24 28 C -19 19 -19 4 -19 -7 Z" fill={look.hairShade} />
      <path d="M -8 -34 C 5 -36 18 -30 25 -18" stroke="#5A4F4B" strokeWidth={2.2} fill="none" opacity={0.4} strokeLinecap="round" />
      <path d="M 14 -22 C 8 -25 0 -25 -6 -22" stroke={look.hairShade} strokeWidth={1.6} fill="none" opacity={0.5} />
      <path d="M 22 -12 C 20 -17 17 -20 13 -22" stroke={look.hairShade} strokeWidth={1.4} fill="none" opacity={0.45} strokeLinecap="round" />
    </g>
  );
};

export const Actor: React.FC<{
  pose: Pose;
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  look?: CharacterLook;
  opacity?: number;
  /** vertical offset in px for weight shift / bob, applied at the hips. */
  bob?: number;
  /** Object held in the near hand; anchored to the solved wrist. */
  nearProp?: (wrist: Vec, angle: number) => React.ReactNode;
  bagOpen?: number;
  /** 'behind' = far leg only (draw before the bike); 'front' = the rest; default draws everything. */
  part?: 'all' | 'behind' | 'front';
}> = ({pose, x, y, scale = 1, facing = 1, look = ALAN_LOOK, opacity = 1, bob = 0, nearProp, bagOpen = 0, part = 'all'}) => {
  const drawBehind = part !== 'front';
  const drawFront = part !== 'behind';
  const lean = pose.lean ?? 0;
  const chest = pose.chest ?? 0;
  const yaw = Math.max(-1, Math.min(1, pose.headYaw ?? 0));

  // Torso pivots at the waist; shoulders and head follow the same transform so
  // the neck and shoulder line stay attached at every lean angle.
  const pivotY = RIG.shoulderY * 0.3;
  const torsoDeg = lean + chest * 0.5;
  const torsoPoint = (p: Vec): Vec => torsoPointFor(pose, p);
  const nearArm = armGeometryFor(pose, true);
  const farArm = armGeometryFor(pose, false);
  const nearHand = pose.armNear.hand ?? 'relaxed';
  const farHand = pose.armFar.hand ?? 'relaxed';

  const legNear = pose.legNear ?? {hip: 3, knee: -3, foot: 0};
  const legFar = pose.legFar ?? {hip: -3, knee: -3, foot: 0};

  // The head turns around the neck root, not the top of the chest, so a nod swings the
  // jaw instead of sliding the whole head and opening the collar.
  const neckRoot = torsoPoint({x: 0, y: RIG.neckY});
  const headFromNeck = RIG.headY - RIG.neckY;

  return (
    <svg
      width={460}
      height={680}
      viewBox="-230 -330 460 680"
      style={{
        position: 'absolute',
        left: x - 230 * scale,
        top: y - 330 * scale,
        width: 460 * scale,
        height: 680 * scale,
        overflow: 'visible',
        opacity,
        transform: `scaleX(${facing})`,
        transformOrigin: `${230 * scale}px ${330 * scale}px`,
      }}
    >
      <g transform={`translate(0 ${bob})`}>
        {/* far leg behind the bike, far arm behind the body */}
        {drawBehind ? <Leg hip={{x: -RIG.hipHalf, y: 0}} spec={legFar} look={look} near={false} /> : null}
        {drawFront ? <Arm geom={farArm} look={look} near={false} hand={farHand} /> : null}
        {drawFront ? <>

        {/* pelvis: rounded hips so the legs hang from a joint, not from the hem */}
        <path d="M -29 -8 Q 0 -17 29 -8 L 31 20 Q 0 33 -31 20 Z" fill={look.pantsShade} />
        <path d="M -25 -4 Q 0 -12 25 -4 L 25 6 Q 0 14 -25 6 Z" fill={look.pants} opacity={0.65} />

        {/* torso */}
        <g transform={`rotate(${torsoDeg} 0 ${pivotY})`}>
          {/* fitted tee: narrow sloped shoulders, defined waist, hem flaring over the hips */}
          <path
            d="M -13 -154 C -24 -152 -33 -149 -36 -139 C -38 -124 -35 -104 -31 -88 C -27 -72 -25 -58 -26 -44 C -28 -30 -35 -18 -37 -9 Q 0 6 38 -9 C 36 -18 29 -30 27 -44 C 26 -58 28 -72 32 -88 C 36 -104 39 -124 37 -139 C 34 -149 24 -152 13 -154 Q 0 -146 -13 -154 Z"
            fill={look.shirt}
          />
          {/* far side in soft shade */}
          <path
            d="M -36 -139 C -38 -124 -35 -104 -31 -88 C -27 -72 -25 -58 -26 -44 C -28 -30 -35 -18 -37 -9 L -18 -7 C -21 -40 -23 -92 -19 -150 C -29 -149 -34 -145 -36 -139 Z"
            fill={look.shirtShade}
            opacity={0.3}
          />
          {/* soft bust shading under the neckline */}
          <path d="M 4 -100 q 12 11 25 -2" stroke={look.shirtShade} strokeWidth={2.4} fill="none" opacity={0.3} strokeLinecap="round" />
          {/* collar band */}
          <path d="M -18 -151 Q 0 -125 18 -151" stroke={look.shirtShade} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* chest + belly folds */}
          <g stroke={look.shirtShade} strokeWidth={2.2} fill="none" opacity={0.42} strokeLinecap="round">
            <path d="M -20 -60 q 10 7 22 2" />
            <path d="M 8 -90 q 6 10 4 24" />
            <path d="M -24 -30 q 14 7 30 1" />
          </g>
          {/* hem */}
          <path d="M -35 -13 Q 0 2 37 -13" stroke={look.shirtShade} strokeWidth={3} fill="none" opacity={0.7} />
          {/* gentle rim light, kept inside the silhouette */}
          <path d="M 33 -126 C 37 -104 35 -80 30 -52" stroke="rgba(255,206,150,0.38)" strokeWidth={3.6} fill="none" strokeLinecap="round" />
          {/* bag strap + bag */}
          {look.bag ? (
            <g>
              <path d="M 27 -110 q 3 4 1 8 L -12 -12 q -4 2 -7 -2 L 24 -114 q 2 -1 3 4 z" fill={look.bag} />
              <path d="M 25 -110 q 1 2 0 4 L -10 -16" stroke="#9A7558" strokeWidth={1.6} fill="none" opacity={0.45} />
              <g transform={`translate(${BAG.x} ${BAG.y}) rotate(${BAG.angle})`}>
                <rect x={-18} y={BAG.mouthY} width={36} height={BAG.height} rx={6} fill={look.bag} />
                <path d={`M -15 ${BAG.mouthY + BAG.height - 5} q 15 4 30 0`} stroke="#624731" strokeWidth={1.4} fill="none" opacity={0.5} />
                <rect x={-18} y={4 - 11 * bagOpen} width={36} height={12} rx={5} fill="#8A684D" />
                {bagOpen > 0 ? <ellipse cx={0} cy={BAG.mouthY} rx={16} ry={3 * bagOpen} fill="#32251D" /> : null}
                <path d={`M -18 ${16 - 17 * bagOpen} q 18 6 36 0`} stroke="#6E5138" strokeWidth={1.6} fill="none" opacity={0.7} />
                <rect x={-4} y={13 - 16 * bagOpen} width={8} height={7} rx={1.6} fill="#C7A986" />
              </g>
            </g>
          ) : null}
        </g>

        {/* near leg in front of torso hem */}
        <Leg hip={{x: RIG.hipHalf, y: 0}} spec={legNear} look={look} near />

        {/* head */}
        <g
          transform={`translate(${neckRoot.x} ${neckRoot.y}) rotate(${torsoDeg * 0.55 + (pose.headNod ?? 0) * 0.45 + (pose.headTilt ?? 0) * 0.5}) translate(0 ${headFromNeck})`}
        >
          <Head yaw={yaw} nod={0} tilt={0} look={look} ponytail={pose.ponytail ?? 0} surprise={pose.surprise ?? 0} mood={pose.mood ?? 0.25} blink={pose.blink ?? 0} />
        </g>

        {/* near arm last, in front */}
        <Arm geom={nearArm} look={look} near hand={nearHand} prop={nearProp} />
        </> : null}
      </g>
    </svg>
  );
};
