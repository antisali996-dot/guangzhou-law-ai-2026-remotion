import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {Camera, EvidenceStill, EVIDENCE_FOCUS, LawText} from '../ui';
import {GROUND, ip, smooth, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';

type PhotoSpec = {focus: {x: number; y: number}; scale: number; caption: string};

type LawShotProps = {
  start: number;
  lines: string[];
  /** absolute seconds at which each line becomes the current one */
  marks: number[];
  cite: string;
  dim: number;
  cam: {x: number; y: number; scale: number};
  photo?: PhotoSpec | null;
  diagram?: boolean;
  rain?: number;
};


/**
 * Schematic for Art. 1254 para. 2: unknown thrower -> who can prove innocence is excluded ->
 * remaining possible users compensate -> compensator may recover from the real thrower.
 * Driven by the same absolute seconds as the narration marks in S07.
 */
const COLS = 4;
const ROWS = 5;
const WW = 78;
const WH = 70;
const GX = 22;
const GY = 20;
const BX = 40;
const BY = 64;
const CULPRIT = {r: 1, c: 2};
const isCandidate = (r: number, c: number) => r <= 2 && (c === 1 || c === 2);
const winCenter = (r: number, c: number) => ({x: BX + c * (WW + GX) + WW / 2, y: BY + r * (WH + GY) + WH / 2});
const BASKET = {x: BX + 2 * (WW + GX) - GX / 2, y: 548};

const LegalDiagram: React.FC<{t: number}> = ({t}) => {
  const appear = ip(t, [38.8, 39.5], [0, 1], smooth);
  const qMark = ip(t, [39.4, 39.9, 41.2, 41.6], [0, 1, 1, 0]);
  const pulse = 0.65 + 0.35 * Math.sin(t * 5);
  const glow = ip(t, [44.9, 45.5], [0, 1], smooth);
  const trace = ip(t, [48.9, 49.8], [0, 1], smooth);
  const phase = t < 41.589 ? 0 : t < 44.768 ? 1 : t < 48.825 ? 2 : 3;
  const legend = ['无法确定具体侵权人', '能证明自己不是侵权人的，排除', '可能加害的使用人，给予补偿', '补偿后，向侵权人追偿'][phase];
  let ex = 0;
  const cells: React.ReactNode[] = [];
  const coins: React.ReactNode[] = [];
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cand = isCandidate(r, c);
      const x = BX + c * (WW + GX);
      const y = BY + r * (WH + GY);
      let fill = '#6B5434';
      let stroke = '#A8895A';
      let mark: React.ReactNode = null;
      if (!cand) {
        const e = ip(t, [42.0 + ex * 0.11, 42.45 + ex * 0.11], [0, 1], smooth);
        ex += 1;
        fill = e > 0.5 ? '#1C2A30' : fill;
        stroke = e > 0.5 ? '#35505A' : stroke;
        if (e > 0.05) {
          mark = (
            <path
              d={`M ${x + 24} ${y + 36} l 11 11 l 22 -26`}
              stroke="#7FC6A4"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={e * 0.9}
              strokeDasharray={60}
              strokeDashoffset={60 * (1 - e)}
            />
          );
        }
      } else {
        fill = '#C98F4A';
        stroke = '#F0C27A';
        const isCulprit = r === CULPRIT.r && c === CULPRIT.c;
        const rank = k;
        k += 1;
        const g = glow * (0.7 + 0.3 * Math.sin(t * 4 + rank));
        fill = glow > 0.02 ? '#E0A559' : fill;
        mark = (
          <>
            {glow > 0.02 ? <rect x={x - 6} y={y - 6} width={WW + 12} height={WH + 12} rx={6} fill="#F0C27A" opacity={0.18 * g} /> : null}
            {isCulprit && trace > 0.02 ? (
              <rect x={x - 5} y={y - 5} width={WW + 10} height={WH + 10} rx={5} fill="none" stroke="#E4604A" strokeWidth={4} opacity={trace} />
            ) : null}
          </>
        );
        const cc = winCenter(r, c);
        const cp = ip(t, [45.4 + rank * 0.16, 47.0 + rank * 0.16], [0, 1], (v) => v * v);
        if (cp > 0.001 && cp < 0.999) {
          coins.push(
            <g key={`coin${r}${c}`} transform={`translate(${cc.x + (BASKET.x - cc.x) * cp} ${cc.y + (BASKET.y - cc.y) * cp})`} opacity={1 - Math.max(0, cp - 0.85) / 0.15}>
              <circle r={13} fill="#F2CE7D" stroke="#B9893A" strokeWidth={2} />
              <text y={6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#7A5522" fontFamily="sans-serif">¥</text>
            </g>,
          );
        }
      }
      cells.push(
        <g key={`${r}-${c}`}>
          <rect x={x} y={y} width={WW} height={WH} rx={4} fill={fill} stroke={stroke} strokeWidth={3} />
          <line x1={x + WW / 2} y1={y} x2={x + WW / 2} y2={y + WH} stroke={stroke} strokeWidth={2} opacity={0.5} />
          <line x1={x} y1={y + WH / 2} x2={x + WW} y2={y + WH / 2} stroke={stroke} strokeWidth={2} opacity={0.5} />
          {mark}
        </g>,
      );
      if (qMark > 0.02 && r + c < 99) {
        cells.push(
          <text key={`q${r}-${c}`} x={x + WW / 2} y={y + WH / 2 + 12} textAnchor="middle" fontSize={34} fontWeight={700} fill="#F7E3B8" opacity={qMark * pulse * 0.8} fontFamily="sans-serif">?</text>,
        );
      }
    }
  }
  // recovery arrows: every compensating window points back at the thrower
  const target = winCenter(CULPRIT.r, CULPRIT.c);
  const arrows: React.ReactNode[] = [];
  if (trace > 0.02) {
    for (let r = 0; r <= 2; r++) {
      for (const c of [1, 2]) {
        if (r === CULPRIT.r && c === CULPRIT.c) continue;
        const a = winCenter(r, c);
        const mx = (a.x + target.x) / 2 + (c === 1 ? -36 : 36);
        const my = (a.y + target.y) / 2;
        arrows.push(
          <path
            key={`ar${r}${c}`}
            d={`M ${a.x} ${a.y} Q ${mx} ${my} ${target.x} ${target.y}`}
            fill="none"
            stroke="#F4D9A4"
            strokeWidth={3}
            strokeDasharray="8 8"
            strokeDashoffset={-t * 26}
            opacity={trace * 0.9}
          />,
        );
      }
    }
  }
  return (
    <div style={{position: 'absolute', left: 1290, top: 110, width: 500, height: 670, opacity: appear, transform: `translateY(${16 * (1 - appear)}px)`}}>
      <svg width={500} height={670} viewBox="0 0 500 670">
        <rect x={6} y={6} width={488} height={658} rx={14} fill="#0D171C" opacity={0.78} stroke="#3A4B4C" strokeWidth={2} />
        <text x={250} y={44} textAnchor="middle" fontSize={22} fill="#9FB3A9" letterSpacing={3} fontFamily={'"Noto Sans SC", sans-serif'}>示意图 · 非真实场景</text>
        <rect x={BX - 14} y={BY - 14} width={4 * WW + 3 * GX + 28} height={5 * WH + 4 * GY + 28} rx={8} fill="#16232A" stroke="#2D3E42" strokeWidth={3} />
        {cells}
        {arrows}
        {coins}
        <g transform={`translate(${BASKET.x} ${BASKET.y})`}>
          <path d="M -34 -16 L 34 -16 L 28 24 L -28 24 Z" fill="#20282D" stroke="#5E6A70" strokeWidth={3} />
          <path d="M -6 -16 L 4 24" stroke="#C46A58" strokeWidth={3} />
          <text y={46} textAnchor="middle" fontSize={20} fill="#9FB3A9" fontFamily={'"Noto Sans SC", sans-serif'}>受损的车筐</text>
        </g>
        <text x={250} y={640} textAnchor="middle" fontSize={26} fill="#F2E6C9" fontFamily={'"Noto Serif SC", serif'} letterSpacing={1.5}>{legend}</text>
      </svg>
    </div>
  );
};

/** A law clause held over the scene it belongs to, with the damage kept in view. */
const LawShot: React.FC<LawShotProps> = ({start, lines, marks, cite, dim, cam, photo = null, diagram = false, rain = 7}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const active = marks.reduce((acc, m) => (t >= m ? acc + 1 : acc), 0) - 1;

  // a very slow push keeps the frame alive across 8–13 s of text without shaking it
  const push = Math.min(1, frame / 480);
  const scale = cam.scale * (1 + 0.055 * push);
  const pin = Math.min(1, Math.max(0, (frame - 18) / 40));

  return (
    <AbsoluteFill>
      <Camera x={cam.x} y={cam.y} scale={scale}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={dim} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={908} cy={GROUND + 3} rx={180} ry={12} fill="#080F14" opacity={0.38} />
        </svg>
        <Bike x={960} groundY={GROUND} cracked={1} dent={0.6} lean={-0.6} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
      </Camera>
      {photo ? (
        <div
          style={{
            position: 'absolute',
            left: 1364,
            top: 286,
            width: 356,
            opacity: pin,
            transform: `translateY(${14 * (1 - pin)}px) rotate(-1.1deg)`,
          }}
        >
          <div
            style={{
              width: 356,
              height: 218,
              padding: 6,
              background: '#0D171C',
              border: '2px solid #C4CDC4',
              boxShadow: '0 10px 26px rgba(0,0,0,0.5)',
            }}
          >
            <EvidenceStill w={340} h={202} focus={photo.focus} scale={photo.scale} dim={0.16} />
          </div>
          <div
            style={{
              marginTop: 9,
              fontFamily: '"Noto Sans SC", sans-serif',
              fontSize: 18,
              letterSpacing: 1.4,
              color: '#C8D2C8',
              opacity: 0.92,
            }}
          >
            {photo.caption}
          </div>
        </div>
      ) : null}
      {diagram ? <LegalDiagram t={t} /> : null}
      <LawText lines={lines} active={Math.max(0, active)} cite={cite} y={diagram ? 410 : 452} size={diagram ? 48 : 52} />
      {diagram ? (
        <div style={{position: 'absolute', left: 128, top: 974, fontFamily: '"Noto Sans SC", sans-serif',
          fontSize: 28, color: '#E9D7AD', letterSpacing: 1, padding: '10px 18px',
          borderLeft: '3px solid #C7A56D', background: 'rgba(8,15,20,0.62)'}}>
          要点：先调查取证，不是整栋楼一概赔偿。
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const S05Law: React.FC<{start: number}> = ({start}) => (
  <LawShot
    start={start}
    lines={['禁止从建筑物中抛掷物品。']}
    marks={[26.0]}
    cite="《民法典》第1254条第一款（节选）"
    dim={0.26}
    cam={{x: 1000, y: 662, scale: 1.28}}
  />
);

export const S06Law: React.FC<{start: number}> = ({start}) => (
  <LawShot
    start={start}
    lines={['从建筑物中抛掷物品或者从建筑物上坠落的物品造成他人损害的，', '由侵权人依法承担侵权责任；']}
    marks={[29.2, 35.319]}
    cite="《民法典》第1254条第一款（节选）"
    dim={0.22}
    cam={{x: 1010, y: 650, scale: 1.24}}
    photo={{focus: EVIDENCE_FOCUS, scale: 2.6, caption: '现场照片 01 · 前篮受损'}}
  />
);

export const S07Law: React.FC<{start: number}> = ({start}) => (
  <LawShot
    start={start}
    lines={[
      '经调查难以确定具体侵权人的，',
      '除能够证明自己不是侵权人的外，',
      '由可能加害的建筑物使用人给予补偿。',
      '可能加害的建筑物使用人补偿后，有权向侵权人追偿。',
    ]}
    marks={[38.7, 41.589, 44.768, 48.825]}
    cite="《民法典》第1254条第一款（节选）"
    dim={0.2}
    cam={{x: 990, y: 640, scale: 1.2}}
    diagram
  />
);

export const S09Law: React.FC<{start: number}> = ({start}) => (
  <LawShot
    start={start}
    lines={[
      '从建筑物或者其他高空抛掷物品，情节严重的，',
      '处一年以下有期徒刑、拘役或者管制，',
      '并处或者单处罚金。',
    ]}
    marks={[59.5, 63.964, 67.79]}
    cite="《刑法》第291条之二第一款"
    dim={0.3}
    cam={{x: 1150, y: 560, scale: 1.16}}
    rain={0}
  />
);
