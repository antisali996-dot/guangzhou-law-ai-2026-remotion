import React from 'react';
import {PROPS} from '../theme';

/**
 * Dark-grey city bicycle with a black hard-plastic front basket.
 * Local geometry: ground at y = 0, origin below the bottom bracket.
 */
export const BIKE = {
  wheelR: 76,
  rearHub: {x: -142, y: -76},
  frontHub: {x: 140, y: -76},
  grip: {x: 118, y: -230},
  basketTop: {x: 154, y: -204},
  basketImpact: {x: 188, y: -204},
  basketBottom: {x: 158, y: -134},
  saddle: {x: -54, y: -200},
} as const;

/** Positive SVG rotation is clockwise: the bottom of a forward wheel moves left. */
export const wheelRotationFor = (distance: number): number => distance / BIKE.wheelR * 180 / Math.PI;

export const bikeKickstandTip = (amount: number) => {
  const down = Math.min(1, Math.max(0, amount));
  return {x: -92 + 44 * down, y: -70 + 70 * down};
};

export const rotateLocal = (p: {x: number; y: number}, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return {
    x: p.x * Math.cos(r) - p.y * Math.sin(r),
    y: p.x * Math.sin(r) + p.y * Math.cos(r),
  };
};

export const bikePoint = (
  local: {x: number; y: number},
  x: number,
  groundY: number,
  lean: number,
  scale: number,
) => {
  const r = rotateLocal(local, lean);
  return {x: x + r.x * scale, y: groundY + r.y * scale};
};

const Wheel: React.FC<{cx: number; cy: number; r: number; spin?: number}> = ({cx, cy, r, spin = 0}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#12171C" strokeWidth={13} />
    <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke="#59636B" strokeWidth={3} opacity={0.9} />
    <g transform={`rotate(${spin} ${cx} ${cy})`} stroke="#8E9AA0" strokeWidth={1.5} opacity={0.6}>
      {Array.from({length: 12}).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * 6}
            y1={cy + Math.sin(a) * 6}
            x2={cx + Math.cos(a) * (r - 11)}
            y2={cy + Math.sin(a) * (r - 11)}
          />
        );
      })}
    </g>
    <circle cx={cx} cy={cy} r={6} fill="#7B858B" />
  </g>
);

/** Black hard-plastic basket with slots and a rim that can crack. */
const Basket: React.FC<{dent: number; cracked: number}> = ({dent, cracked}) => {
  const squash = 1 - Math.max(0, dent) * 0.16;
  const d = Math.max(0, Math.min(1, cracked));
  return (
    <g transform={`translate(154 -204) scale(1 ${squash}) translate(-154 204)`}>
      <path d="M 104 -202 L 206 -202 L 196 -132 Q 155 -120 114 -132 Z" fill="#22262B" />
      <path d="M 104 -202 L 206 -202 L 204 -190 L 106 -190 Z" fill="#2C3137" />
      <g fill="#14171B">
        <path d="M 116 -186 l 10 0 l 2 48 l -12 0 z" />
        <path d="M 134 -186 l 10 0 l 1 54 l -12 0 z" />
        <path d="M 152 -186 l 10 0 l 0 57 l -11 0 z" />
        <path d="M 170 -186 l 10 0 l -2 52 l -10 0 z" />
        <path d="M 188 -186 l 10 0 l -4 48 l -10 0 z" />
      </g>
      <path d="M 102 -204 q 52 -6 106 0 l 0 8 q -53 -6 -106 0 z" fill="#1A1E22" />
      <path d="M 104 -202 q 50 -4 102 0" stroke="#4A5158" strokeWidth={2} fill="none" opacity={0.7} />
      <path d="M 150 -204 l 0 -14" stroke="#3B4247" strokeWidth={5} strokeLinecap="round" />
      <path d="M 150 -218 q 22 -4 30 -12" stroke="#3B4247" strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* crack opens from the front-right rim */}
      <g opacity={d}>
        <path
          d={`M ${BIKE.basketImpact.x - d * 6} -202 l -4 ${8 + d * 10} l 6 ${6} l -3 ${10 + d * 6}`}
          stroke="#0C0E10"
          strokeWidth={3.2}
          fill="none"
          strokeLinejoin="round"
        />
        <path d={`M ${184 - d * 6} -196 l -7 ${4 + d * 6}`} stroke="#0C0E10" strokeWidth={2.2} fill="none" />
        <path d={`M ${190 - d * 6} -200 l 6 ${3 + d * 5}`} stroke="#565E64" strokeWidth={1.2} fill="none" opacity={0.8} />
      </g>
      {/* tea stain on the inner wall */}
      <ellipse cx={150} cy={-139} rx={30} ry={5.4} fill="#6B4A2E" opacity={d * 0.8} />
      <path d="M 134 -141 q 4 -14 2 -20" stroke="#6B4A2E" strokeWidth={2.6} fill="none" opacity={d * 0.55} />
      <path d="M 152 -140 q 3 -10 1 -16" stroke="#6B4A2E" strokeWidth={2.2} fill="none" opacity={d * 0.45} />
      <ellipse cx={150} cy={-138} rx={22} ry={3} fill="#8A613E" opacity={d * 0.45} />
    </g>
  );
};

export const Bike: React.FC<{
  x: number;
  groundY: number;
  lean?: number;
  scale?: number;
  dent?: number;
  cracked?: number;
  jolt?: number;
  spin?: number;
  opacity?: number;
  kickstand?: number;
}> = ({x, groundY, lean = 0, scale = 1, dent = 0, cracked = 0, jolt = 0, spin = 0, opacity = 1, kickstand = 1}) => (
  <svg
    width={520 * scale}
    height={320 * scale}
    viewBox="-260 -320 520 320"
    style={{
      position: 'absolute',
      left: x - 260 * scale,
      top: groundY - 320 * scale,
      overflow: 'visible',
      opacity,
    }}
  >
    <g transform={`translate(0 ${jolt}) rotate(${lean} 0 0)`}>
      <Wheel cx={BIKE.rearHub.x} cy={BIKE.rearHub.y} r={BIKE.wheelR} spin={spin} />
      <Wheel cx={BIKE.frontHub.x} cy={BIKE.frontHub.y} r={BIKE.wheelR} spin={spin} />

      <path d={`M -212 -104 a 76 76 0 0 1 140 -22`} stroke="#2A3037" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M 70 -102 a 76 76 0 0 1 142 24`} stroke="#2A3037" strokeWidth={7} fill="none" strokeLinecap="round" />

      <g stroke="#4A5158" strokeWidth={9} strokeLinecap="round" fill="none">
        <path d={`M ${BIKE.rearHub.x} ${BIKE.rearHub.y} L -12 -90 L ${BIKE.saddle.x} ${BIKE.saddle.y}`} />
        <path d="M -12 -90 L 112 -146" />
        <path d={`M ${BIKE.saddle.x} ${BIKE.saddle.y} L 112 -146`} />
        <path d={`M 112 -146 L ${BIKE.frontHub.x} ${BIKE.frontHub.y}`} />
      </g>
      <path d="M -12 -90 L -12 -140" stroke="#3C4349" strokeWidth={5} strokeLinecap="round" />
      <circle cx={-12} cy={-90} r={18} fill="none" stroke="#6C767D" strokeWidth={4} />
      <circle cx={-12} cy={-90} r={8} fill="#7C868C" />

      <line x1={-12} y1={-90} x2={2} y2={-72} stroke="#23282D" strokeWidth={5} strokeLinecap="round" />
      <rect x={-6} y={-70} width={22} height={5} rx={2} fill="#1D2226" />

      <path
        d={`M ${BIKE.saddle.x - 32} ${BIKE.saddle.y - 6} q 20 -10 48 -2 q 10 3 6 9 q -24 8 -54 1 z`}
        fill="#202429"
      />
      <path d={`M ${BIKE.saddle.x - 30} ${BIKE.saddle.y - 3} q 20 -6 44 0`} stroke="#4C545A" strokeWidth={2} fill="none" opacity={0.6} />

      <path d="M 112 -146 L 116 -236" stroke="#4A5158" strokeWidth={7} strokeLinecap="round" />
      <path d="M 116 -236 q 20 -10 36 -2" stroke="#4A5158" strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d="M 108 -228 q 14 -6 26 0" stroke="#1B1F23" strokeWidth={9} strokeLinecap="round" fill="none" />
      <circle cx={112} cy={-240} r={5} fill={PROPS.lampGold} opacity={0.85} />
      <circle cx={112} cy={-240} r={9} fill="none" stroke="#8A939A" strokeWidth={1.4} opacity={0.7} />

      <path d="M -136 -164 L -54 -178" stroke="#3F464C" strokeWidth={4} strokeLinecap="round" />
      <path d={`M -136 -164 L ${BIKE.rearHub.x} ${BIKE.rearHub.y + 4}`} stroke="#3F464C" strokeWidth={3} opacity={0.8} />

      <path d={`M -14 -74 L ${bikeKickstandTip(kickstand).x} ${bikeKickstandTip(kickstand).y}`} stroke="#394046" strokeWidth={4} strokeLinecap="round" opacity={0.9} />

      <g transform="translate(0 0)">
        <Basket dent={dent} cracked={cracked} />
      </g>
    </g>
  </svg>
);
