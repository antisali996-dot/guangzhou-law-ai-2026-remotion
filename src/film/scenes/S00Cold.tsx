import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {FONT} from '../../theme';
import {FPS} from '../timeline';

/**
 * Cold open: the damaged basket, the fallen cup, the tea running into the wet
 * pavement. No character, no explanation — just the question.
 */
export const S00Cold: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const first = spring({frame: frame - 12, fps: FPS, config: {damping: 200}, durationInFrames: 30});
  const second = spring({frame: frame - 50, fps: FPS, config: {damping: 200}, durationInFrames: 30});
  const detail = interpolate(frame, [0, 360], [1.015, 1.065], {extrapolateRight: 'clamp'});
  const caption = frame / FPS + start >= 2;
  return (
    <AbsoluteFill style={{background: '#11262E'}}>
      <Img src={staticFile('film-v18/basket-detail.png')} style={{width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${detail})`, transformOrigin: '78% 58%'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(10,27,34,0.98) 0%, rgba(10,27,34,0.88) 28%, rgba(10,27,34,0.22) 58%, transparent 80%)'}} />
      <div style={{position: 'absolute', left: 126, top: 145, fontFamily: FONT.sans, fontSize: 28,
        color: '#B4CCC5', fontWeight: 500, letterSpacing: 4, opacity: first}}>高空抛物 · 普法短片</div>
      <div style={{position: 'absolute', left: 118, top: 280, color: '#F4F1E6', fontFamily: FONT.sans,
        fontSize: 126, lineHeight: 1.16, fontWeight: 700, letterSpacing: 1}}>
        <div style={{opacity: first, transform: `translateY(${24*(1-first)}px)`}}>这一栋</div>
        <div style={{opacity: second, transform: `translateY(${24*(1-second)}px)`, color: '#E6BA82'}}>都要赔？</div>
      </div>
      <div style={{position: 'absolute', left: 126, top: 654, width: 360*second, height: 4, background: '#C7775B'}} />
      <div style={{position: 'absolute', left: 126, top: 706, color: '#D5DFD5', fontFamily: FONT.serif,
        fontSize: 40, lineHeight: 1.5, opacity: caption ? 1 : 0}}>杯子从楼上飞下，<br />责任该由谁承担？</div>
      <div style={{position: 'absolute', left: 126, bottom: 93, fontFamily: FONT.sans, fontSize: 25,
        color: '#92ADA7', letterSpacing: 2, opacity: first}}>沿着证据，找到该承担责任的人</div>
    </AbsoluteFill>
  );
};
