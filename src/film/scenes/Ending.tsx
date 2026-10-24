import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Actor, Hand, ALAN_LOOK, type Pose} from '../../characters/Rig';
import {phoneStowAt, phoneAboveBagPoints} from '../stowPhone';
import {cctvAt, CCTV_CONTACT} from '../cctv';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {Camera, EvidenceStill, EVIDENCE_FOCUS, HeldPhone, Vignette} from '../ui';
import {BIKE_DX, GROUND, HIP_REST, HIP_Y, ip, smooth, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';
import {standingLegs} from '../../characters/locomotion';
import {blinkAt} from '../../lib/blink';
import {leaveAt, LEAVE_BIKE_X, LEAVE_ACTOR_X} from '../leave';
export {LEAVE} from '../leave';

/**
 * The investigation result: a surveillance still that actually shows which window,
 * then the file being handed over. No phone-call shortcut, no "look, three windows".
 */
const CctvStage: React.FC<{local: number; zoom: number}> = ({local, zoom}) => {
  const CAM_W = 1416;
  const CAM_H = 896;
  const pushIn = Math.min(1, Math.max(0, smooth((local - 2.5) / 1.65)));
  const cs = 1.12 * zoom * (1 + 0.16 * pushIn);
  const fx = 1210 + 96 * pushIn;
  const fy = 648 - 236 * pushIn;

  const replay = cctvAt(local);
  const reach = ip(replay.local, [1.15, 1.6], [0, 1], smooth);
  const landed = replay.local > CCTV_CONTACT + 0.5;
  const cup = replay.cup;
  const actor = replay.actor;
  const markIn = ip(local, [2.55, 3.05], [0, 1], smooth);
  const tilt = Math.sin(local * 0.7) * 0.4;

  return (
    <div
      style={{
        position: 'absolute',
        left: 252,
        top: 92,
        width: CAM_W,
        height: CAM_H,
        overflow: 'hidden',
        borderRadius: 8,
        background: '#0A1217',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CAM_W,
          height: CAM_H,
          filter: 'brightness(0.82) contrast(1.06) saturate(0.62)',
          transform: `rotate(${tilt}deg) scale(1.01)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: CAM_W / 2,
            top: CAM_H / 2,
            width: 1920,
            height: 1080,
            transform: `scale(${cs}) translate(${-fx}px, ${-fy}px)`,
            transformOrigin: '0 0',
          }}
        >
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
            <Street showRain={false} rain={0} dim={0.12} />
          </svg>
          <Bike x={actor.bikeX} groundY={GROUND} spin={actor.wheelDeg} kickstand={actor.kickstand}
            cracked={replay.local >= CCTV_CONTACT ? 1 : 0} dent={replay.local >= CCTV_CONTACT ? 0.6 : 0} />
          <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={landed ? 1 : 0} scale={0.54} />
          <Actor pose={actor.pose} x={actor.hipX} y={HIP_Y} bob={actor.bob} />
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
            {/* the resident: head + shoulder behind the sill, one forearm swinging out */}
            <g opacity={0.95}>
              <circle cx={1364} cy={390} r={17} fill="#0B151A" />
              <path d="M 1340 440 q 5 -32 24 -32 q 19 0 24 32 z" fill="#0B151A" />
              <path
                d={`M 1346 416 L ${1350 + 36 * reach} ${426 + 30 * reach} L ${1352 + 36 * reach} ${433 + 30 * reach} L 1352 424 Z`}
                fill="#0B151A"
              />
              <circle cx={1352 + 38 * reach} cy={431 + 30 * reach} r={6.6} fill="#0B151A" />
            </g>
            <rect
              x={1300}
              y={322}
              width={132}
              height={122}
              fill="none"
              stroke="#F0D9A8"
              strokeWidth={3}
              opacity={markIn}
            />
          </svg>
          <Cup {...cup} />
        </div>
      </div>
      {/* A mild sensor tint stays legible after the footage is scaled into the monitor. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(160,180,172,0.025), rgba(0,0,0,0.02))',
        }}
      />
      <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 150px rgba(0,0,0,0.62)'}} />
      <div
        style={{
          position: 'absolute',
          left: 22,
          top: 14,
          fontFamily: '"Noto Sans SC", sans-serif',
          fontSize: 23,
          color: '#D7E0D8',
          letterSpacing: 1,
          opacity: 0.85,
        }}
      >
        CAM 03 · 2026-10-22 {replay.clock} · 示意回放
      </div>
      {markIn > 0.05 ? (
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 46,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 22,
            letterSpacing: 1,
            color: '#F0D9A8',
            opacity: markIn * 0.92,
          }}
        >
          锁定 · 二层 03 号窗
        </div>
      ) : null}
      <div style={{position: 'absolute', right: 22, top: 14, display: 'flex', alignItems: 'center', gap: 9}}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            background: '#C8503F',
            opacity: 0.5 + 0.45 * Math.sin(local * 6),
          }}
        />
        <span style={{fontFamily: '"Noto Sans SC", sans-serif', fontSize: 21, color: '#D7D0C6', opacity: 0.8}}>{replay.frozen ? '定格' : '回放'}</span>
      </div>
    </div>
  );
};

/**
 * The investigation result: a surveillance still that actually shows which window,
 * then the file being handed over. No phone-call shortcut, no "look, three windows".
 */
export const S08Investigate: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;

  const photoIn = ip(local, [0.15, 0.95], [0, 1], smooth);
  const monIn = ip(local, [1.7, 2.5], [0, 1], smooth);
  const paper1 = ip(local, [3.5, 4.1], [0, 1], smooth);
  const paper2 = ip(local, [4.0, 4.6], [0, 1], smooth);
  const paper3 = ip(local, [4.5, 5.1], [0, 1], smooth);
  const handIn = ip(local, [4.4, 5.2], [0, 1], smooth);
  const settled = ip(local, [6.0, 6.6], [0, 1], smooth);

  const papers = [
    {v: paper1, x: 1392, y: 596, rot: -4.5, fill: '#D9D2BF'},
    {v: paper2, x: 1424, y: 606, rot: 2.4, fill: '#E5DECB'},
    {v: paper3, x: 1408, y: 618, rot: -0.8, fill: '#CFC7B4'},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: '#0B1216'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="lampPool" cx="58%" cy="40%" r="52%">
            <stop offset="0%" stopColor="#4A4436" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#232A28" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0B1216" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1920} height={1080} fill="#141C1F" />
        <rect x={0} y={150} width={1920} height={720} fill="#1B2528" />
        <rect x={0} y={150} width={1920} height={6} fill="#2C3A3C" opacity={0.8} />
        <rect x={0} y={864} width={1920} height={216} fill="#111A1D" />
        <rect x={0} y={0} width={1920} height={1080} fill="url(#lampPool)" />
        {/* desk grain */}
        <g stroke="#2A3536" strokeWidth={1.2} opacity={0.35}>
          {Array.from({length: 14}).map((_, i) => (
            <line key={i} x1={80} y1={210 + i * 46} x2={1840} y2={206 + i * 46} />
          ))}
        </g>
      </svg>

      <div style={{position: 'absolute', left: 128, top: 112, fontFamily: '"Noto Sans SC", sans-serif',
        color: '#EDEADD', fontSize: 58, fontWeight: 600, letterSpacing: 2, opacity: photoIn}}>
        先找证据，再依法索赔
      </div>
      <div style={{position: 'absolute', left: 132, right: 132, top: 206, height: 2,
        background: '#6E8A80', opacity: photoIn*0.45}} />

      {/* 1 · close-up of the cracked rim */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 236 + 24 * (1 - photoIn),
          width: 486,
          height: 372,
          padding: 12,
          background: '#E9E2D0',
          boxShadow: '0 18px 38px rgba(0,0,0,0.55)',
          transform: `rotate(-3.1deg)`,
          opacity: photoIn,
        }}
      >
        <div style={{position: 'relative', width: 462, height: 300, overflow: 'hidden', background: '#1A242A'}}>
          <EvidenceStill w={462} h={300} focus={EVIDENCE_FOCUS} scale={3.15} />
          <div
            style={{
              position: 'absolute',
              left: 231 - 62,
              top: 150 - 40,
              width: 124,
              height: 80,
              border: '2px solid rgba(245,242,233,0.55)',
              borderRadius: 6,
            }}
          />
        </div>
        <div style={{fontFamily: '"Noto Sans SC", sans-serif', fontSize: 24, color: '#38443D', marginTop: 12, letterSpacing: 1}}>
          现场照片 01 · 前篮裂口
        </div>
      </div>

      {/* 2 · cctv still with source time */}
      <div
        style={{
          position: 'absolute',
          left: 718,
          top: 268 + 22 * (1 - monIn),
          width: 496,
          height: 372,
          padding: 12,
          background: '#1E2A2C',
          border: '2px solid #3C4C4C',
          boxShadow: '0 18px 38px rgba(0,0,0,0.5)',
          opacity: monIn,
          transform: 'scale(1.15)',
          transformOrigin: '0 0',
        }}
      >
        <div style={{position: 'relative', width: 472, height: 298, overflow: 'hidden', background: '#0A1217'}}>
          {/* independent surveillance footage: the window, the throw, the lock-on */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1416,
              height: 896,
              transform: `scale(${472 / 1416}) translate(-252px, -92px)`,
              transformOrigin: '0 0',
            }}
          >
            <CctvStage local={Math.max(0, local - 1.5)} zoom={1} />
          </div>
        </div>
        <div style={{fontFamily: '"Noto Sans SC", sans-serif', fontSize: 24, color: '#A9BDB4', marginTop: 12, letterSpacing: 1}}>
          监控线索 · 拍摄时间 20:41
        </div>
      </div>

      {/* 3 · materials gathered, hand pressing the stack */}
      <div style={{position: 'absolute', left: 1370, top: 392, width: 420, height: 420}}>
        <svg width={420} height={420} viewBox="0 0 420 420" style={{position: 'absolute'}}>
          <rect x={92} y={236} width={250} height={150} rx={10} fill="#2F4A44" stroke="#436A5F" strokeWidth={2} />
          <rect x={92} y={236} width={250} height={26} rx={8} fill="#3B5C53" />
          <rect x={112} y={252} width={64} height={34} rx={4} fill="#D7CFBA" opacity={0.85} />
        </svg>
        {papers.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 1258 - 26,
              top: p.y - 352 - 46 * (1 - p.v),
              width: 198,
              height: 122,
              background: p.fill,
              boxShadow: '0 8px 18px rgba(0,0,0,0.45)',
              transform: `rotate(${p.rot}deg)`,
              opacity: p.v,
            }}
          >
            <div style={{position: 'absolute', left: 14, top: 16, width: 120, height: 5, background: '#8A8677'}} />
            <div style={{position: 'absolute', left: 14, top: 32, width: 160, height: 4, background: '#A39E8D'}} />
            <div style={{position: 'absolute', left: 14, top: 48, width: 148, height: 4, background: '#A39E8D'}} />
            <div style={{position: 'absolute', left: 14, top: 64, width: 90, height: 4, background: '#A39E8D'}} />
          </div>
        ))}
        <svg width={420} height={420} viewBox="0 0 420 420" style={{position: 'absolute', opacity: handIn * 0.98}}>
          <g transform={`translate(${286 + 40 * (1 - handIn)} ${300 - 44 * handIn}) rotate(${14 - 6 * settled}) scale(1.55)`}>
            <Hand wrist={{x: 0, y: 0}} angle={74} pose="open" look={ALAN_LOOK} />
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 402,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 22,
            color: '#9FB3A9',
            opacity: settled,
            letterSpacing: 1,
          }}
        >
          材料已归拢
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 200,
          top: 868,
          fontFamily: '"Noto Sans SC", sans-serif',
          fontSize: 24,
          color: '#8FA29A',
          opacity: 0.75,
          letterSpacing: 2,
        }}
      >
        调查取证 · 现场照片 / 监控线索 / 材料提交
      </div>
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};

/** Puts the phone away, gives the basket one last look. */
export const S10Confirm: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;
  const phone = phoneStowAt(local);
  const pose: Pose = {
    ...phone.pose,
    blink: blinkAt(t),
    legNear: standingLegs().near,
    legFar: standingLegs().far,
    breath: Math.sin(t * 1.4),
    ponytail: -3,
  };
  const clipPoints = phoneAboveBagPoints(pose);

  return (
    <AbsoluteFill>
      <Camera x={LEAVE_ACTOR_X + 62} y={700} scale={2.28}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.12} />
        </svg>
        <Bike x={LEAVE_BIKE_X} groundY={GROUND} cracked={1} dent={0.6} lean={0.4} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
        <Actor
         
          pose={pose}
          x={LEAVE_ACTOR_X}
          y={HIP_Y}
          bob={standingLegs().bob}
          bagOpen={phone.bagOpen}
          nearProp={(wrist) => <HeldPhone wrist={wrist} phone={phone} clipPoints={clipPoints} clipId="phone-stowing" />}
        />
      </Camera>
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};

/** Re-grip, then keep walking while the camera settles behind her. */
export const S11Leave: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;
  const motion = leaveAt(local);

  return (
    <AbsoluteFill>
      <Camera x={motion.cameraX} y={760} scale={1.5}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.1} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={motion.bikeX} cy={GROUND + 3} rx={180} ry={12} fill="#080F14" opacity={0.4} />
        </svg>
        <Bike x={motion.bikeX} groundY={GROUND} cracked={1} dent={0.6} spin={motion.wheelDeg} kickstand={motion.kickstand} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
        <Actor pose={motion.pose} x={motion.actorX} y={HIP_Y} bob={motion.loco.bob} />
      </Camera>
      <Vignette strength={0.42} />
    </AbsoluteFill>
  );
};

/** End card: the line you keep, then the credit. */
export const S12Card: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const local = frame / 60;
  const first = ip(local, [0.1, 0.5], [0, 1], smooth);
  const second = ip(local, [1.3, 1.8], [0, 1], smooth);
  const credit = ip(local, [2.6, 3.2], [0, 1], smooth);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0B1418 0%, #16242B 58%, #0A1216 100%)'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g opacity={0.5}>
          <Street showRain={false} rain={0} dim={0.42} />
        </g>
        <rect x={0} y={540} width={1920} height={540} fill="url(#fadeBottom)" opacity={0.9} />
        {/* scrim so signboards/windows never compete with the closing line */}
        <ellipse cx={960} cy={500} rx={760} ry={300} fill="url(#textScrim)" />
        <defs>
          <radialGradient id="textScrim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0A1216" stopOpacity={0.92} />
            <stop offset="70%" stopColor="#0A1216" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#0A1216" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1216" stopOpacity={0} />
            <stop offset="100%" stopColor="#0A1216" stopOpacity={1} />
          </linearGradient>
        </defs>
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 76,
            fontWeight: 600,
            color: '#F5F2E9',
            letterSpacing: 2,
            opacity: first,
            textAlign: 'center',
            textShadow: '0 6px 26px rgba(0,0,0,0.55)',
          }}
        >
          守住手中的分寸
        </div>
        <div
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 76,
            fontWeight: 600,
            color: '#F5F2E9',
            letterSpacing: 2,
            marginTop: 18,
            opacity: second,
            textAlign: 'center',
            textShadow: '0 6px 26px rgba(0,0,0,0.55)',
          }}
        >
          才守得住楼下的平安
        </div>
        <div
          style={{
            marginTop: 64,
            fontFamily: '"Noto Serif SC", serif',
            fontSize: 40,
            fontWeight: 600,
            color: '#F0D9A8',
            opacity: credit,
            letterSpacing: 10,
          }}
        >
          《这一栋都要赔》
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 24,
            color: '#C8D2CB',
            opacity: credit * 0.86,
            letterSpacing: 2,
          }}
        >
          高空抛物 · 《民法典》第1254条 · 《刑法》第291条之二
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontSize: 22,
            color: '#9FB3A9',
            opacity: credit * 0.8,
            letterSpacing: 1.6,
          }}
        >
          AI辅助创作 · 原创动画 · 虚构故事
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
