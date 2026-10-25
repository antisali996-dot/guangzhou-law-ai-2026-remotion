import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';
import {FPS} from './timeline';

/** A single spoken clause, with a plain-language headline and a separate quotation. */
export const LawFocus: React.FC<{
  lines: string[]; marks: number[]; active: number; start: number;
  headings: readonly string[]; section: string; cite: string; criminal?: boolean;
}> = ({lines, marks, active, start, headings, section, cite, criminal = false}) => {
  const frame = useCurrentFrame();
  const phaseFrame = Math.max(0, frame - Math.round((marks[active] - start) * FPS));
  const enter = spring({frame: phaseFrame, fps: FPS, config: {damping: 200, stiffness: 180}, durationInFrames: 26});
  const opacity = interpolate(phaseFrame, [0, 7], [0, 1], {extrapolateRight: 'clamp'});
  const ink = '#233E43';
  const accent = criminal ? '#A24937' : '#32756E';
  const headline = headings[Math.min(active, headings.length - 1)];
  return (
    <div data-law-part="quotation" style={{position: 'absolute', left: 88, top: 162, width: 1050, height: 744,
      background: '#EFEDE4', color: ink, boxShadow: '0 12px 40px rgba(4,12,15,0.23)',
      border: '1px solid rgba(200,207,195,0.7)', overflow: 'hidden'}}>
      <Img src={staticFile('film-v18/paper-texture.png')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: accent}} />
      <div style={{position: 'absolute', left: 54, top: 39, right: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: FONT.sans, fontSize: 27, fontWeight: 600, letterSpacing: 2, color: accent}}>
        <span>{section}</span>
        <span style={{fontSize: 23, fontWeight: criminal ? 600 : 400, color: criminal ? accent : '#667874', letterSpacing: 1}}>
          {criminal ? '适用前提：情节严重' : '结合本案 · 读懂法条'}
        </span>
      </div>
      <div style={{position: 'absolute', left: 54, top: 112, right: 40,
        transform: `translateY(${18 * (1 - enter)}px)`, opacity}}>
        {headline.split('\n').map((line, i) => (
          <div key={`${active}-${i}`} style={{fontFamily: FONT.sans, fontSize: line.length > 10 ? 76 : 84,
            fontWeight: 700, lineHeight: 1.24, letterSpacing: 0.5, color: i === 1 ? accent : ink}}>{line}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 54, top: 356, width: 72 + 610 * enter, height: 3, background: accent, opacity: 0.55}} />
      <div style={{position: 'absolute', left: 54, top: 390, fontFamily: FONT.sans, fontSize: 26,
        letterSpacing: 2, color: '#6B7A74'}}>法条原文 · 节选</div>
      <div data-law-part="quote-text" style={{position: 'absolute', left: 54, top: 438, right: 54, fontFamily: FONT.serif,
        fontSize: 52, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0.6, color: ink,
        opacity, transform: `translateY(${10 * (1 - enter)}px)`}}>{lines[active]}</div>
      <div data-law-part="citation" style={{position: 'absolute', left: 54, bottom: 68, right: 35, fontFamily: FONT.sans,
        fontSize: 28, color: '#566B65', lineHeight: 1.4}}>{cite}</div>
      <div style={{position: 'absolute', left: 54, right: 54, bottom: 35, display: 'flex', gap: 12}}>
        {lines.map((_, i) => <div key={i} style={{height: 5, flex: 1,
          background: i <= active ? accent : '#CED4C9', opacity: i === active ? 1 : 0.45}} />)}
      </div>
    </div>
  );
};

/** Existing code-drawn props become simple visual signposts for the quoted rule. */
export const LawCompanion: React.FC<{criminal?: boolean; active: number}> = ({criminal = false, active}) => {
  const frame = useCurrentFrame();
  const p = spring({frame: frame-10, fps: FPS, config: {damping: 200}, durationInFrames: 35});
  return (
    <div style={{position: 'absolute', left: 1250, top: 185, width: 560, height: 620,
      opacity: p, color: '#E9EAE0', fontFamily: FONT.sans, textAlign: 'center',
      background: 'radial-gradient(ellipse, rgba(12,30,35,0.85) 0%, rgba(12,30,35,0.60) 45%, transparent 74%)'}}>
      {!criminal ? <>
        <svg width={560} height={430} viewBox="0 0 560 430">
          <g transform="rotate(14 280 220)" stroke="#DAE3D5" strokeWidth={5} fill="rgba(211,225,211,0.10)">
            <path d="M 215 150 L 345 150 L 326 310 Q 280 331 234 310 Z" />
            <path d="M 210 140 Q 280 122 350 140 L 350 151 L 210 151 Z" />
            <path d="M 285 138 L 310 71" strokeLinecap="round" />
            <path d="M 234 232 Q 281 242 327 232" opacity={0.65} />
          </g>
          <circle cx={280} cy={220} r={162} fill="none" stroke="#C96F59" strokeWidth={10}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1-p} />
          <path d="M 167 333 L 393 107" stroke="#C96F59" strokeWidth={12} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1-p} />
        </svg>
        <div style={{fontSize: 44, fontWeight: 600, letterSpacing: 5}}>禁止从建筑物抛物</div>
        <div style={{fontSize: 27, color: '#AFC2B9', marginTop: 20}}>守住手中的分寸</div>
      </> : active === 0 ? <>
        <svg width={560} height={370} viewBox="0 0 560 370" fill="none" stroke="#DA9A7A" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
          <path d="M 280 55 L 440 321 L 120 321 Z" />
          <path d="M 280 151 L 280 235" />
          <circle cx={280} cy={275} r={5} fill="#DA9A7A" />
        </svg>
        <div style={{fontSize: 62, fontWeight: 600, letterSpacing: 4}}>情节严重</div>
        <div style={{fontSize: 29, marginTop: 25, color: '#BECBC0'}}>是否构成犯罪，要依法认定</div>
      </> : active === 1 ? <div style={{paddingTop: 126}}>
        <div style={{fontSize: 36, color: '#C3CEC3', letterSpacing: 5}}>有期徒刑</div>
        <div style={{fontSize: 86, fontWeight: 700, color: '#E2B583', marginTop: 24}}>一年以下</div>
        <div style={{width: 300, height: 2, background: '#66817B', margin: '40px auto'}} />
        <div style={{fontSize: 40, letterSpacing: 7}}>拘役 · 管制</div>
      </div> : <div style={{paddingTop: 110}}>
        <div style={{fontSize: 34, color: '#C3CEC3', letterSpacing: 4}}>并处或者单处</div>
        <div style={{fontSize: 108, fontWeight: 700, color: '#E2B583', marginTop: 40, letterSpacing: 12}}>罚金</div>
        <div style={{width: 248, height: 3, background: '#C7775B', margin: '42px auto'}} />
        <div style={{fontSize: 28, color: '#BECBC0'}}>《刑法》第291条之二第一款</div>
      </div>}
    </div>
  );
};
