import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Actor, type Pose} from '../../characters/Rig';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {Camera, EvidenceStill, EVIDENCE_FOCUS, HeldPhone, Vignette} from '../ui';
import {BIKE_DX, GROUND, HIP_REST, HIP_Y, alanAt, ip, smooth, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';
import {phoneTakeOutAt, phoneAboveBagPoints} from '../stowPhone';
import {ShoulderShot} from '../AngleShots';
import {SHOULDER_LOCAL} from '../cameraAngles';


/** A: phone comes up; B: what the screen sees; C: the saved photo, held up. */
export const S04Evidence: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;
  const base = alanAt(t);

  const phase: 'a' | 'b' | 'c' = local < 2.0 ? 'a' : local < 4.85 ? 'b' : 'c';
  const raise = ip(local, [0.1, 0.9], [0, 1], smooth);
  const press = ip(local, [3.1, 3.3, 3.5], [0, 1, 0], smooth);
  const flash = interpolate(local, [3.3, 3.42, 3.62], [0, 0.82, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phone = phoneTakeOutAt(local);
  const pose: Pose = {...base.pose, ...phone.pose, breath: Math.sin(t * 1.6) * 0.8};
  const clipPoints = phoneAboveBagPoints(pose);

  if (local >= SHOULDER_LOCAL.start && local < SHOULDER_LOCAL.end) return <ShoulderShot local={local}/>;

  return (
    <AbsoluteFill>
      <Camera x={phase === 'a' ? 946 : 952} y={phase === 'a' ? 690 : 706} scale={phase === 'a' ? 2.1 : 2.02}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.08} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={HIP_REST + BIKE_DX} cy={GROUND + 3} rx={180} ry={12} fill="#080F14" opacity={0.4} />
        </svg>
        <Bike x={HIP_REST + BIKE_DX} groundY={GROUND} cracked={1} dent={0.6} spin={base.wheelDeg} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
        {phase === 'a' ? (
          <Actor
           
            pose={pose}
            x={HIP_REST}
            y={HIP_Y}
            bob={base.bob}
            bagOpen={phone.bagOpen}
            nearProp={(wrist) => <HeldPhone wrist={wrist} phone={phone} clipPoints={clipPoints} clipId="phone-taking-out" />}
          />
        ) : null}
      </Camera>

      {phase === 'b' ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', inset: 0, background: '#0B1216', opacity: 0.94}} />
          <div
            style={{
              position: 'absolute',
              left: 660,
              top: 66,
              width: 600,
              height: 806,
              borderRadius: 42,
              background: '#11181E',
              border: '3px solid #3B4A52',
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
            }}
          >
            <EvidenceStill w={600} h={806} focus={EVIDENCE_FOCUS} scale={3.1} />
            <div style={{position: 'absolute', left: 24, top: 20, fontFamily: '"Noto Sans SC", sans-serif', fontSize: 26, color: '#F1EAD8', opacity: 0.9}}>
              20:41
            </div>
            <div style={{position: 'absolute', left: 24, top: 58, fontFamily: '"Noto Sans SC", sans-serif', fontSize: 19, color: '#C9D3CE', opacity: 0.65}}>
              现场 · 车筐受损
            </div>
            <svg width={600} height={806} viewBox="0 0 600 806" style={{position: 'absolute', left: 0, top: 0}}>
              <g stroke="#FFFFFF" strokeWidth={1.2} opacity={0.14}>
                <line x1={200} y1={0} x2={200} y2={806} />
                <line x1={400} y1={0} x2={400} y2={806} />
                <line x1={0} y1={268} x2={600} y2={268} />
                <line x1={0} y1={536} x2={600} y2={536} />
              </g>
              <g stroke="#F3E9D2" strokeWidth={2.6} fill="none" opacity={0.9}>
                <path d="M 196 372 h -22 v -22" />
                <path d="M 392 350 v 22 h -22" />
                <path d="M 196 500 h -22 v -22" />
                <path d="M 392 478 v 22 h -22" />
              </g>
              <circle cx={300} cy={720} r={40} fill="none" stroke="#F1EAD8" strokeWidth={3} opacity={0.9} />
              <circle cx={300} cy={720} r={31 - 4 * press} fill="#F1EAD8" opacity={0.92} />
              <rect x={272} y={14} width={56} height={5} rx={2.5} fill="#6B7A80" opacity={0.5} />
            </svg>
            {flash > 0 ? (
              <div style={{position: 'absolute', inset: 0, background: '#FFFDF4', opacity: flash}} />
            ) : null}
          </div>
        </AbsoluteFill>
      ) : null}

      {phase === 'c' ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', inset: 0, background: '#0B1216', opacity: 0.86}} />
          <div
            style={{
              position: 'absolute',
              left: 640,
              top: 180,
              width: 660,
              height: 520,
              padding: 18,
              background: '#E9E1CE',
              boxShadow: '0 26px 60px rgba(0,0,0,0.62)',
              transform: `rotate(-1.3deg) translateY(${-6 * raise}px)`,
            }}
          >
            <EvidenceStill w={624} h={420} focus={EVIDENCE_FOCUS} scale={2.2} />
            <div style={{fontFamily: '"Noto Sans SC", sans-serif', fontSize: 22, color: '#4A554E', marginTop: 12, letterSpacing: 1.2}}>
              2026·10·22　20:41　现场照片 01
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
      <Vignette strength={0.36} />
    </AbsoluteFill>
  );
};
