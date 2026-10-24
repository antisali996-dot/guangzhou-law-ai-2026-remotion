import React from 'react';
import {PALETTE} from '../theme';

const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 13.7) * 43758.5453;
  return s - Math.floor(s);
};

const VANISH = {x: 960, y: 655};
const CURB_TOP = 892;
const PAVE_TOP = 916;

/** One upper-floor window: some lit, some dark, curtains / AC units. */
const Window: React.FC<{x: number; y: number; w: number; h: number; i: number}> = ({x, y, w, h, i}) => {
  const lit = rnd(i) > 0.42;
  const curtain = rnd(i + 3) > 0.55;
  const ac = rnd(i + 7) > 0.66;
  const warm = lit ? (rnd(i + 11) > 0.5 ? '#E8C089' : PALETTE.lamp) : '#24343D';
  return (
    <g>
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} fill="#3A4A48" />
      <rect x={x} y={y} width={w} height={h} fill={warm} opacity={lit ? 0.9 : 1} />
      {lit ? (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="url(#winWarm)" opacity={0.85} />
          {curtain ? (
            <>
              <path d={`M ${x} ${y} L ${x + w * 0.34} ${y} L ${x + w * 0.26} ${y + h} L ${x} ${y + h} Z`} fill="#8B6E55" opacity={0.85} />
              <path d={`M ${x + w * 0.7} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + w * 0.76} ${y + h} Z`} fill="#8B6E55" opacity={0.7} />
            </>
          ) : (
            <g stroke="#C99B63" strokeWidth={1.2} opacity={0.5}>
              {Array.from({length: 4}).map((_, k) => (
                <line key={k} x1={x} y1={y + (h / 4) * k + 8} x2={x + w} y2={y + (h / 4) * k + 8} />
              ))}
            </g>
          )}
          <circle cx={x + w * 0.5} cy={y + h * 0.26} r={5} fill="#FFE0AE" opacity={0.9} />
        </g>
      ) : (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#1E2C34" />
          <path d={`M ${x} ${y} L ${x + w * 0.55} ${y} L ${x} ${y + h * 0.7} Z`} fill="#2F434C" opacity={0.8} />
        </g>
      )}
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#3C4A48" strokeWidth={3} />
      <line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} stroke="#3C4A48" strokeWidth={2.4} />
      <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} fill="none" stroke="#7D8F86" strokeWidth={3} />
      <rect x={x - 12} y={y + h + 4} width={w + 24} height={9} fill="#83958C" />
      <rect x={x - 12} y={y + h + 12} width={w + 24} height={5} fill="#4A5A55" />
      {ac ? (
        <g>
          <rect x={x + w * 0.16} y={y + h + 22} width={54} height={34} rx={3} fill="#B9C3BD" />
          <rect x={x + w * 0.16} y={y + h + 22} width={54} height={8} fill="#D7DED8" />
          {Array.from({length: 5}).map((_, k) => (
            <line key={k} x1={x + w * 0.16 + 6} y1={y + h + 36 + k * 3} x2={x + w * 0.16 + 48} y2={y + h + 36 + k * 3} stroke="#8B9791" strokeWidth={1.4} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** Shopfront behind the arcade: warm interior with simple believable contents. */
const Shop: React.FC<{x: number; w: number; kind: 'dessert' | 'shutter' | 'watch' | 'plants'}> = ({x, w, kind}) => {
  const top = 690;
  const bottom = 900;
  // Clip the shopfront to the arch opening so the rectangle never covers the arcade curve.
  const clipId = `shopArch${x}`;
  const spring = 640 + 92;
  return (
    <g clipPath={`url(#${clipId})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={`M ${x} ${bottom} L ${x} ${spring} Q ${x + w / 2} ${640 - 22} ${x + w} ${spring} L ${x + w} ${bottom} Z`} />
        </clipPath>
      </defs>
      <rect x={x} y={top - 40} width={w} height={bottom - top + 40} fill="#2A393B" />
      <rect x={x + 6} y={top} width={w - 12} height={bottom - top} fill="url(#shopWarm)" />
      <rect x={x + 6} y={top} width={w - 12} height={(bottom - top) * 0.62} fill="#8A6A4E" opacity={0.35} />
      {kind === 'dessert' ? (
        <g>
          <rect x={x + 18} y={bottom - 96} width={w - 36} height={96} fill="#4A3527" />
          <rect x={x + 18} y={bottom - 96} width={w - 36} height={12} fill="#7A5B40" />
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <rect x={x + 40 + k * 74} y={top + 42} width={58} height={80} rx={2} fill="#3A2C20" opacity={0.9} />
              <g stroke="#E0BE8A" strokeWidth={2} opacity={0.55}>
                <line x1={x + 50 + k * 74} y1={top + 62} x2={x + 88 + k * 74} y2={top + 62} />
                <line x1={x + 50 + k * 74} y1={top + 76} x2={x + 88 + k * 74} y2={top + 76} />
                <line x1={x + 50 + k * 74} y1={top + 90} x2={x + 80 + k * 74} y2={top + 90} />
              </g>
            </g>
          ))}
          <g stroke="#F3DDBB" strokeWidth={2} opacity={0.22} fill="none">
            <path d={`M ${x + 70} ${bottom - 110} q 10 -18 -2 -34 q -10 -16 2 -30`} />
            <path d={`M ${x + 112} ${bottom - 110} q 10 -18 -2 -34 q -10 -16 2 -30`} />
          </g>
        </g>
      ) : null}
      {kind === 'watch' ? (
        <g>
          <rect x={x + 22} y={bottom - 104} width={w - 44} height={104} fill="#43392C" />
          <rect x={x + 22} y={bottom - 104} width={w - 44} height={10} fill="#6E5B45" />
          <g stroke="#D8BC90" strokeWidth={2} opacity={0.4}>
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={x + 34} y1={bottom - 84 + k * 16} x2={x + w - 34} y2={bottom - 84 + k * 16} />
            ))}
          </g>
          <circle cx={x + w * 0.5} cy={top + 80} r={26} fill="#EBD9B4" opacity={0.85} />
          <circle cx={x + w * 0.5} cy={top + 80} r={22} fill="#F5E7C6" />
          <line x1={x + w * 0.5} y1={top + 80} x2={x + w * 0.5} y2={top + 64} stroke="#3A2C20" strokeWidth={2.4} />
          <line x1={x + w * 0.5} y1={top + 80} x2={x + w * 0.5 + 13} y2={top + 84} stroke="#3A2C20" strokeWidth={2} />
        </g>
      ) : null}
      {kind === 'shutter' ? (
        <g>
          <rect x={x + 4} y={top} width={w - 8} height={bottom - top} fill="#5A6663" />
          {Array.from({length: 34}).map((_, k) => (
            <line key={k} x1={x + 4} y1={top + k * 6} x2={x + w - 4} y2={top + k * 6} stroke="#48534F" strokeWidth={2.6} />
          ))}
          <rect x={x + 4} y={bottom - 86} width={w - 8} height={86} fill="#1B2A30" />
          <rect x={x + 12} y={bottom - 78} width={w - 24} height={6} fill={PALETTE.lamp} opacity={0.5} />
        </g>
      ) : null}
      {kind === 'plants' ? (
        <g>
          <rect x={x + 16} y={bottom - 70} width={w - 32} height={70} fill="#3C3A2E" />
          {[0, 1, 2, 3].map((k) => (
            <g key={k} transform={`translate(${x + 40 + k * 52} ${bottom - 74})`}>
              <path d="M 0 0 l -14 -30 q 8 -6 14 4 q 6 -22 14 -8 q 6 16 -6 34 z" fill="#40604F" />
              <path d="M 0 0 l -8 -22 q 6 -4 10 2 q 4 -12 8 -4" fill="#567A62" opacity={0.8} />
              <rect x={-10} y={-2} width={20} height={16} rx={2} fill="#7A5B44" />
            </g>
          ))}
        </g>
      ) : null}
      {[0.32, 0.68].map((f, k) => (
        <g key={k}>
          <line x1={x + w * f} y1={top - 40} x2={x + w * f} y2={top + 6} stroke="#2A2119" strokeWidth={1.6} />
          <circle cx={x + w * f} cy={top + 12} r={7} fill="#FFE2B4" />
          <circle cx={x + w * f} cy={top + 12} r={22} fill="url(#bulbGlow)" opacity={0.55} />
        </g>
      ))}
      <rect x={x} y={top - 40} width={w} height={bottom - top + 40} fill="none" stroke="#384744" strokeWidth={8} />
    </g>
  );
};

const Column: React.FC<{x: number; y: number; h: number; w: number}> = ({x, y, h, w}) => (
  <g>
    <rect x={x - 7} y={y - 26} width={w + 14} height={16} fill="#7A8C83" />
    <rect x={x - 4} y={y - 10} width={w + 8} height={10} fill="#5C6E68" />
    <rect x={x} y={y} width={w} height={h} fill="url(#colGrad)" />
    <rect x={x} y={y} width={5} height={h} fill="#7E9187" opacity={0.7} />
    <rect x={x + w - 7} y={y} width={7} height={h} fill="#374744" opacity={0.8} />
    <rect x={x + w * 0.4} y={y} width={2} height={h} fill="#4C5E59" opacity={0.5} />
    <rect x={x - 6} y={y + h - 18} width={w + 12} height={18} fill="#52645F" />
    <rect x={x - 10} y={y + h - 4} width={w + 20} height={8} fill="#697B74" />
  </g>
);

export const Street: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rain?: number;
  showRain?: boolean;
  dim?: number;
}> = ({x = 0, y = 0, scale = 1, rain = 0, showRain = true, dim = 0}) => {
  const arcadeTop = 640;
  const columns = [26, 342, 658, 974, 1290, 1606, 1876];
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: '960px 640px', overflow: 'hidden'}}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#101C2B" />
          <stop offset="70%" stopColor="#23415A" />
          <stop offset="100%" stopColor="#35596B" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C7A88" />
          <stop offset="55%" stopColor="#4D6A78" />
          <stop offset="100%" stopColor="#3E5766" />
        </linearGradient>
        <linearGradient id="shopWarm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD596" />
          <stop offset="45%" stopColor="#EDB066" />
          <stop offset="100%" stopColor="#9A6636" />
        </linearGradient>
        <linearGradient id="winWarm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE1B4" />
          <stop offset="100%" stopColor="#D9A263" />
        </linearGradient>
        <linearGradient id="colGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6E8896" />
          <stop offset="35%" stopColor="#58727F" />
          <stop offset="100%" stopColor="#3B505C" />
        </linearGradient>
        <linearGradient id="paveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#32495A" />
          <stop offset="45%" stopColor="#263A4A" />
          <stop offset="100%" stopColor="#18232F" />
        </linearGradient>
        <linearGradient id="curbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#89988F" />
          <stop offset="55%" stopColor="#5E6E68" />
          <stop offset="100%" stopColor="#3C4B47" />
        </linearGradient>
        <radialGradient id="bulbGlow">
          <stop offset="0%" stopColor="#FFDCA8" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#FFDCA8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pool">
          <stop offset="0%" stopColor="#E9BD80" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#E9BD80" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C489" stopOpacity={0.42} />
          <stop offset="60%" stopColor="#D8A96F" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#D8A96F" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coolRefl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8FAEB8" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#8FAEB8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="depthShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16232B" stopOpacity={0.5} />
          <stop offset="55%" stopColor="#16232B" stopOpacity={0} />
          <stop offset="100%" stopColor="#101A20" stopOpacity={0.32} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={1920} height={700} fill="url(#sky)" />
      <g opacity={0.75}>
        <rect x={70} y={196} width={150} height={420} fill="#243844" />
        <rect x={250} y={150} width={110} height={470} fill="#1E303B" />
        <rect x={1560} y={168} width={150} height={450} fill="#223541" />
        <rect x={1740} y={210} width={170} height={410} fill="#1D2E39" />
        {Array.from({length: 26}).map((_, i) => {
          const gx = 84 + (i % 6) * 24 + Math.floor(i / 6) * 240;
          const gy = 220 + (i % 3) * 44;
          return <rect key={i} x={gx} y={gy} width={9} height={13} fill="#D9B984" opacity={rnd(i) > 0.55 ? 0.5 : 0.14} />;
        })}
      </g>

      <rect x={-20} y={120} width={1960} height={552} fill="url(#wallGrad)" />
      <rect x={-20} y={112} width={1960} height={26} fill="#7893A0" />
      <rect x={-20} y={138} width={1960} height={9} fill="#465853" />
      {[300, 468].map((yy, i) => (
        <g key={i}>
          <rect x={-20} y={yy} width={1960} height={14} fill="#7C98A6" opacity={0.9} />
          <rect x={-20} y={yy + 14} width={1960} height={7} fill="#3F504C" opacity={0.8} />
        </g>
      ))}
      {[80, 400, 720, 1040, 1360, 1680].map((px, i) => (
        <g key={i}>
          <rect x={px} y={146} width={30} height={500} fill="#6D817A" />
          <rect x={px + 24} y={146} width={8} height={500} fill="#485A55" opacity={0.85} />
          <rect x={px - 4} y={146} width={4} height={500} fill="#83968C" opacity={0.6} />
        </g>
      ))}

      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => {
          const wx = 118 + col * 300;
          const wy = 162 + row * 168;
          return <Window key={`${row}-${col}`} x={wx} y={wy} w={96} h={104} i={row * 10 + col} />;
        }),
      )}

      <g>
        <rect x={700} y={430} width={44} height={150} rx={3} fill="#2E3C3B" stroke="#8B9A90" strokeWidth={2} />
        <rect x={704} y={434} width={36} height={142} fill="#C9A469" opacity={0.9} />
        {['糖', '水'].map((ch, i) => (
          <text key={ch} x={722} y={482 + i * 46} textAnchor="middle" fontSize={34} fill="#3A2A1B" fontFamily={'"Noto Serif SC", serif'} fontWeight={600}>
            {ch}
          </text>
        ))}
        <rect x={1282} y={452} width={40} height={126} rx={3} fill="#2E3C3B" stroke="#8B9A90" strokeWidth={2} />
        <rect x={1286} y={456} width={32} height={118} fill="#B9C6B7" opacity={0.85} />
        {['修', '表'].map((ch, i) => (
          <text key={ch} x={1302} y={498 + i * 42} textAnchor="middle" fontSize={30} fill="#2C3A33" fontFamily={'"Noto Serif SC", serif'} fontWeight={600}>
            {ch}
          </text>
        ))}
      </g>

      <g>
        <path d="M 1330 262 q 120 18 244 4" stroke="#1E2B33" strokeWidth={2} fill="none" />
        <rect x={1380} y={268} width={30} height={44} fill="#C9B49A" opacity={0.75} />
        <rect x={1424} y={266} width={26} height={52} fill="#8FA6A8" opacity={0.7} />
        <rect x={1462} y={270} width={34} height={36} fill="#B7846F" opacity={0.7} />
      </g>

      <g stroke="#141F26" fill="none">
        <path d="M -20 150 Q 500 196 980 168 T 1960 150" strokeWidth={3} opacity={0.85} />
        <path d="M -20 172 Q 620 220 1120 186 T 1960 176" strokeWidth={2.2} opacity={0.7} />
        <path d="M -20 196 Q 420 236 900 208 T 1960 198" strokeWidth={1.6} opacity={0.55} />
      </g>

      <rect x={-20} y={arcadeTop - 26} width={1960} height={30} fill="#4E605B" />
      <rect x={-20} y={arcadeTop + 4} width={1960} height={10} fill="#2E3D3B" />
      <rect x={-20} y={arcadeTop + 14} width={1960} height={26} fill="#3A4B47" />
      {[
        [78, 342],
        [394, 658],
        [710, 974],
        [1026, 1290],
        [1342, 1606],
        [1658, 1876],
      ].map(([a, b], i) => (
        <g key={i}>
          <path
            d={`M ${a} ${arcadeTop + 40} L ${a} ${arcadeTop + 92} Q ${(a + b) / 2} ${arcadeTop - 22} ${b} ${arcadeTop + 92} L ${b} ${arcadeTop + 40} Z`}
            fill="#26393A"
          />
          <path
            d={`M ${a + 8} ${arcadeTop + 40} L ${a + 8} ${arcadeTop + 92} Q ${(a + b) / 2} ${arcadeTop - 8} ${b - 8} ${arcadeTop + 92} L ${b - 8} ${arcadeTop + 40}`}
            fill="none"
            stroke="#6D7F78"
            strokeWidth={5}
            opacity={0.65}
          />
        </g>
      ))}

      <Shop x={80} w={286} kind="dessert" />
      <Shop x={404} w={262} kind="watch" />
      <Shop x={716} w={272} kind="shutter" />
      <Shop x={1032} w={272} kind="plants" />
      <Shop x={1348} w={276} kind="dessert" />

      {columns.map((cx, i) => (
        <Column key={i} x={cx} y={arcadeTop + 16} h={CURB_TOP - arcadeTop - 12} w={52} />
      ))}

      {[250, 566, 882, 1198, 1514].map((lx, i) => (
        <g key={i}>
          <line x1={lx} y1={arcadeTop + 16} x2={lx} y2={arcadeTop + 54} stroke="#2A2119" strokeWidth={1.8} />
          <ellipse cx={lx} cy={arcadeTop + 66} rx={13} ry={16} fill="#D9A25F" opacity={0.9} />
          <ellipse cx={lx} cy={arcadeTop + 66} rx={13} ry={16} fill="url(#bulbGlow)" opacity={0.5} />
          <line x1={lx} y1={arcadeTop + 82} x2={lx} y2={arcadeTop + 92} stroke="#8A3E2E" strokeWidth={2.4} />
        </g>
      ))}

      <rect x={0} y={CURB_TOP} width={1920} height={30} fill="url(#curbGrad)" />
      <rect x={0} y={CURB_TOP} width={1920} height={5} fill="#A3B0A6" opacity={0.55} />
      <rect x={0} y={CURB_TOP + 30} width={1920} height={12} fill="#1A252B" opacity={0.85} />
      <rect x={0} y={PAVE_TOP} width={1920} height={1080 - PAVE_TOP} fill="url(#paveGrad)" />

      <g stroke="#4E6169" strokeWidth={2} opacity={0.32}>
        {Array.from({length: 13}).map((_, i) => {
          const k = i - 6;
          const farX = VANISH.x + k * 148;
          const nearX = VANISH.x + k * 336;
          return <line key={i} x1={farX} y1={PAVE_TOP} x2={nearX} y2={1080} />;
        })}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const yy = PAVE_TOP + Math.pow(k / 5, 1.7) * (1080 - PAVE_TOP);
          return <line key={k} x1={0} y1={yy} x2={1920} y2={yy} opacity={0.5} />;
        })}
      </g>

      {[210, 540, 870, 1190, 1500].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={PAVE_TOP + 26} rx={210} ry={44} fill="url(#pool)" />
          <rect x={cx - 58} y={PAVE_TOP + 4} width={116} height={150} fill="url(#refl)" opacity={0.75} />
          <rect x={cx - 96} y={PAVE_TOP + 8} width={22} height={96} fill="url(#refl)" opacity={0.4} />
          <rect x={cx + 78} y={PAVE_TOP + 8} width={18} height={80} fill="url(#refl)" opacity={0.35} />
        </g>
      ))}
      <rect x={0} y={PAVE_TOP} width={1920} height={90} fill="url(#coolRefl)" opacity={0.7} />

      <g>
        <ellipse cx={392} cy={1010} rx={168} ry={26} fill="#16232A" opacity={0.55} />
        <ellipse cx={392} cy={1008} rx={150} ry={19} fill="url(#coolRefl)" opacity={0.6} />
        <ellipse cx={392} cy={1006} rx={92} ry={7} fill="#96B4BE" opacity={0.18} />
        <ellipse cx={1222} cy={1042} rx={196} ry={28} fill="#16232A" opacity={0.5} />
        <ellipse cx={1222} cy={1040} rx={172} ry={20} fill="url(#refl)" opacity={0.55} />
        <ellipse cx={1222} cy={1036} rx={104} ry={6} fill="#F0C489" opacity={0.22} />
        <ellipse cx={1690} cy={990} rx={128} ry={20} fill="#16232A" opacity={0.45} />
        <ellipse cx={1690} cy={988} rx={110} ry={14} fill="url(#coolRefl)" opacity={0.5} />
      </g>

      <g>
        <rect x={252} y={912} width={92} height={22} rx={3} fill="#2A363C" />
        {Array.from({length: 6}).map((_, i) => (
          <rect key={i} x={258 + i * 14} y={916} width={8} height={14} fill="#131C21" />
        ))}
        <path d="M 620 956 q 12 -8 22 2 q -10 8 -22 -2 z" fill="#3F5A44" opacity={0.8} />
        <path d="M 660 972 q 10 -6 18 2 q -8 6 -18 -2 z" fill="#4A5F3E" opacity={0.7} />
        <path d="M 1046 918 q 12 -4 16 6 q -12 4 -16 -6 z" fill="#7C5B3A" opacity={0.75} />
      </g>

      <rect x={0} y={0} width={1920} height={1080} fill="url(#depthShade)" />

      <g stroke="#C6D9DF" strokeWidth={1.3} opacity={0.18} style={{display: showRain ? undefined : 'none'}}>
        {Array.from({length: 46}).map((_, i) => {
          const bx = rnd(i) * 1980 - 30;
          const off = (rain * (0.6 + rnd(i + 5) * 0.5) + rnd(i + 9) * 1080) % 1120;
          const by = off - 40;
          const len = 16 + rnd(i + 2) * 26;
          return <line key={i} x1={bx} y1={by} x2={bx - 7} y2={by + len} opacity={0.7} />;
        })}
      </g>

      {dim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#0B141A" opacity={dim} /> : null}
    </svg>
  );
};
