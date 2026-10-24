import React from 'react';
import {PROPS} from '../theme';

type Drop = {a: number; v: number; s: number; d: number};

// Deterministic droplet fan; no Math.random anywhere in the render.
const DROPS: Drop[] = [
  {a: -168, v: 250, s: 5.2, d: 0.0},
  {a: -150, v: 300, s: 4.2, d: 0.03},
  {a: -132, v: 210, s: 3.4, d: 0.05},
  {a: -112, v: 330, s: 6.0, d: 0.02},
  {a: -96, v: 260, s: 4.6, d: 0.06},
  {a: -78, v: 300, s: 3.8, d: 0.04},
  {a: -58, v: 230, s: 5.4, d: 0.08},
  {a: -40, v: 280, s: 3.2, d: 0.1},
  {a: -20, v: 200, s: 4.0, d: 0.12},
  {a: 170, v: 190, s: 2.8, d: 0.14},
  {a: 150, v: 240, s: 3.6, d: 0.09},
  {a: 120, v: 260, s: 4.4, d: 0.07},
  {a: 95, v: 210, s: 3.0, d: 0.11},
  {a: 70, v: 290, s: 4.8, d: 0.05},
  {a: 48, v: 235, s: 3.4, d: 0.13},
  {a: 25, v: 205, s: 2.6, d: 0.15},
];

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2.4);

/**
 * Tea spray for the impact: expands from the contact point along ballistic arcs.
 * `progress` is 0 at contact and 1 when the spray has fully fallen away.
 */
export const Splash: React.FC<{
  x: number;
  y: number;
  progress: number;
  scale?: number;
  opacity?: number;
}> = ({x, y, progress, scale = 1, opacity = 1}) => {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0 || p >= 1) return null;
  const g = 900;
  const fade = 1 - Math.max(0, (p - 0.55) / 0.45);
  return (
    <svg
      width={420 * scale}
      height={420 * scale}
      viewBox="-210 -260 420 420"
      style={{position: 'absolute', left: x - 210 * scale, top: y - 260 * scale, overflow: 'visible', opacity}}
    >
      {/* crown at the moment of contact */}
      <g opacity={Math.max(0, 1 - p / 0.3)}>
        <path
          d={`M ${-34 - p * 40} 0 Q ${-20 - p * 10} ${-26 - p * 46} 0 ${-30 - p * 52} Q ${20 + p * 10} ${-26 - p * 46} ${34 + p * 40} 0`}
          fill="none"
          stroke={PROPS.tea}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.55}
        />
        <ellipse cx={0} cy={0} rx={26 + p * 60} ry={7 + p * 10} fill={PROPS.tea} opacity={0.28} />
      </g>

      {DROPS.map((dr, i) => {
        const t = p - dr.d;
        if (t <= 0) return null;
        const ang = (dr.a * Math.PI) / 180;
        const dist = easeOut(t) * dr.v * 0.55;
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist + 0.5 * g * Math.pow(t * 0.62, 2) * 0.35;
        const r = Math.max(0.9, dr.s * 0.46 * (1 - t * 0.4));
        const alpha = 0.82 * fade;
        const heading = (Math.atan2(dy - 0, dx - 0) * 180) / Math.PI;
        const len = r * (2.1 + dr.v / 420);
        return (
          <g key={i} opacity={alpha} transform={`translate(${dx} ${dy}) rotate(${heading})`}>
            <ellipse cx={0} cy={0} rx={len} ry={r * 0.82} fill={PROPS.tea} />
            <ellipse cx={-len * 0.25} cy={0} rx={len * 0.4} ry={r * 0.62} fill="#D9B285" opacity={0.55} />
          </g>
        );
      })}
    </svg>
  );
};

/** Wet tea patch that stays on the pavement / basket wall. */
export const TeaStain: React.FC<{x: number; y: number; scale?: number; amount?: number; onWall?: boolean}> = ({
  x,
  y,
  scale = 1,
  amount = 1,
  onWall = false,
}) => (
  <svg
    width={260 * scale}
    height={180 * scale}
    viewBox="-130 -90 260 180"
    style={{position: 'absolute', left: x - 130 * scale, top: y - 90 * scale, overflow: 'visible'}}
  >
    <g transform={onWall ? 'scale(1 0.55)' : 'scale(1 0.42)'} opacity={Math.min(1, amount)}>
      <ellipse cx={0} cy={0} rx={72} ry={44} fill={PROPS.teaDeep} opacity={0.42} />
      <ellipse cx={-8} cy={-2} rx={52} ry={28} fill={PROPS.tea} opacity={0.5} />
      <ellipse cx={18} cy={4} rx={26} ry={17} fill="#8A613E" opacity={0.45} />
      <ellipse cx={-30} cy={8} rx={9} ry={5} fill={PROPS.tea} opacity={0.6} />
      <ellipse cx={34} cy={-8} rx={5} ry={3.4} fill={PROPS.tea} opacity={0.7} />
    </g>
    {!onWall ? <ellipse cx={0} cy={-2} rx={58} ry={24} fill="rgba(190,220,226,0.10)" /> : null}
  </svg>
);
