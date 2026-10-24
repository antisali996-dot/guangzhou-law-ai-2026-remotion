import React from 'react';
import {PROPS} from '../theme';

/**
 * Brand-free transparent plastic bubble-tea cup: flat lid, straw, brown residue,
 * a few ice cubes. Local origin = bottom center, height 86, top width 56.
 */
export const CUP = {h: 86, topW: 56, botW: 40, lidW: 62} as const;
export const cupLiquidLevel = (amount: number) => -8 - 72 * Math.min(1, Math.max(0, amount));

export const Cup: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  residue?: number; // 0..1 how much tea is left
  opacity?: number;
  straw?: boolean;
  drips?: number;
}> = ({x, y, scale = 1, rotate = 0, residue = 0.55, opacity = 1, straw = true, drips = 0}) => {
  const clipId = React.useId();
  const amount = Math.min(1, Math.max(0, residue));
  const level = cupLiquidLevel(amount);
  return (
  <svg
    width={120 * scale}
    height={200 * scale}
    viewBox="-60 -170 120 200"
    style={{position: 'absolute', left: x - 60 * scale, top: y - 170 * scale, overflow: 'visible', opacity}}
  >
    <g transform={`rotate(${rotate} 0 0)`}>
      {/* body: cold plastic with a cool rim reflection */}
      <path d="M -28 -86 L 28 -86 L 20 -7 Q 20 0 13 0 L -13 0 Q -20 0 -20 -7 Z" fill={PROPS.cupGlass} />
      <path d="M -28 -86 L -16 -86 L -10 -2 L -13 0 Q -20 0 -20 -7 Z" fill="rgba(245,250,248,0.30)" />
      <path d="M 20 -86 L 28 -86 L 20 -7 Q 20 0 13 0 L 10 -2 Z" fill="rgba(120,146,150,0.20)" />
      <path
        d="M -28 -86 L 28 -86 L 20 -7 Q 20 0 13 0 L -13 0 Q -20 0 -20 -7 Z"
        fill="none"
        stroke="rgba(248,252,250,0.55)"
        strokeWidth={1.6}
      />

      <defs>
        <clipPath id={clipId}><path d="M -28 -86 L 28 -86 L 20 -7 Q 20 0 13 0 L -13 0 Q -20 0 -20 -7 Z" /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
      {/* brown tea residue with a soft surface line */}
      <g opacity={0.55 + amount * 0.4}>
        <path
          d={`M -24 ${level} q 8 ${-3 - amount * 2} 16 0 q 8 3 16 0 q 8 -3 16 0 L 19 -8 Q 19 -1 13 -1 L -13 -1 Q -19 -1 -19 -8 Z`}
          fill={PROPS.tea}
          opacity={amount > 0 ? 0.62 : 0}
        />
        <path
          d={`M -23 ${level + 2} q 8 -3 16 0 q 8 3 16 0 q 8 -3 15 0`}
          fill="none"
          stroke="#C79A6B"
          strokeWidth={1.6}
          opacity={0.75}
        />
        <path d={`M -18 ${Math.max(level + 8, -16)} q 18 4 36 0 L 16 -8 Q 16 -2 10 -2 L -10 -2 Q -16 -2 -16 -8 Z`} fill={PROPS.teaDeep} opacity={amount > 0 ? 0.55 : 0} />
        {/* pearls */}
        <g fill="#4A3222" opacity={0.8}>
          <circle cx={-10} cy={-12} r={3.1} />
          <circle cx={-2} cy={-9} r={3.3} />
          <circle cx={7} cy={-13} r={3} />
          <circle cx={12} cy={-8} r={2.6} />
          <circle cx={-14} cy={-7} r={2.4} />
        </g>
      </g>

      {/* ice */}
      <g fill={PROPS.ice} stroke="rgba(255,255,255,0.55)" strokeWidth={1}>
        <rect x={-18} y={level - 6} width={13} height={12} rx={3} transform={`rotate(-14 -12 ${level})`} />
        <rect x={2} y={level - 2} width={12} height={11} rx={3} transform={`rotate(18 8 ${level + 4})`} />
        <rect x={-8} y={level + 6} width={11} height={10} rx={2.5} transform={`rotate(6 -2 ${level + 11})`} />
      </g>

      </g>

      {/* condensation */}
      <g fill="rgba(255,255,255,0.35)">
        <ellipse cx={-22} cy={-62} rx={1.8} ry={3.2} />
        <ellipse cx={-24} cy={-48} rx={1.4} ry={2.4} />
        <ellipse cx={22} cy={-56} rx={1.5} ry={2.6} />
      </g>

      {/* flat lid + rim */}
      <rect x={-31} y={-95} width={62} height={10} rx={4} fill={PROPS.lid} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
      <path d="M -31 -88 L 31 -88" stroke="rgba(120,146,150,0.5)" strokeWidth={1.6} />
      <ellipse cx={0} cy={-95} rx={31} ry={3.4} fill="rgba(255,255,255,0.22)" />

      {straw ? (
        <g>
          <path d="M 3 -94 L 15 -132" stroke="#C9A87C" strokeWidth={8} strokeLinecap="round" />
          <path d="M 3 -94 L 15 -132" stroke="#E2C79C" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        </g>
      ) : null}

      {drips > 0 ? (
        <g opacity={Math.min(1, drips)}>
          <path d="M -20 -6 q -2 8 0 12" stroke={PROPS.tea} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.8} />
          <path d="M 14 -4 q 3 7 1 10" stroke={PROPS.tea} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.7} />
          <circle cx={-19} cy={8} r={2.6} fill={PROPS.tea} opacity={0.85} />
        </g>
      ) : null}
    </g>
  </svg>
);
};
