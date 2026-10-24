import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Actor} from '../../characters/Rig';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {Splash, TeaStain} from '../../props/Splash';
import {clamp} from '../../lib/anim';
import {Camera, Vignette} from '../ui';
import {GROUND, HIP_Y, RIM_Y, alanAt, smooth, cupAt, CONTACT_X, STAIN_X, T_CONTACT, ACTOR_SHIFT, CUP_GROUND_Y} from '../alan';

const CUT = 252; // frame of the cut from the mid shot to the accident close shot

const Shadow: React.FC<{x: number; y: number; rx: number; ry: number; opacity?: number}> = ({
  x,
  y,
  rx,
  ry,
  opacity = 0.4,
}) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#080F14" opacity={opacity} />;

const MidShot: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const a = alanAt(t);
  const push = smooth(clamp(frame / CUT, 0, 1));
  const scale = 1.76 + push * 0.2;
  const focusY = 798 + push * 14;
  const focusX = 900 + (a.hipX - 800) * 0.55 + ACTOR_SHIFT * 0.5;

  return (
    <AbsoluteFill>
      <Camera x={focusX} y={focusY} scale={scale}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.06} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Shadow x={a.bikeX} y={GROUND + 2} rx={188} ry={13} opacity={0.42} />
          <Shadow x={a.hipX + 6} y={GROUND + 2} rx={54} ry={9} opacity={0.3} />
        </svg>
        <Bike x={a.bikeX} groundY={GROUND} spin={a.wheelDeg} kickstand={a.kickstand} />
        <Actor pose={a.pose} x={a.hipX} y={HIP_Y} bob={a.bob} />
      </Camera>
      <Vignette strength={0.38} />
    </AbsoluteFill>
  );
};

const AccidentShot: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const a = alanAt(t);

  const since = t - T_CONTACT;
  const jolt = since > 0 ? 3.4 * Math.exp(-since * 4.2) * Math.cos(since * 26) : 0;

  const cup = cupAt(t);

  const splashP = since > 0 ? clamp(since / 0.62, 0, 1) : 0;
  const stain = clamp((since - 0.42) / 0.5, 0, 1);

  return (
    <AbsoluteFill>
      <Camera x={985} y={845} scale={2.05}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.08} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Shadow x={a.bikeX} y={GROUND + 2} rx={190} ry={13} opacity={0.4} />
          <Shadow x={a.hipX + 6} y={GROUND + 2} rx={56} ry={9} opacity={0.26} />
        </svg>
        <Bike
          x={a.bikeX}
          groundY={GROUND}
          jolt={jolt}
          spin={a.wheelDeg}
          kickstand={a.kickstand}
          cracked={clamp((since - 0.05) / 0.35, 0, 1)}
          dent={0.6 * clamp(since / 0.4, 0, 1)}
        />
        <Actor pose={a.pose} x={a.hipX} y={HIP_Y} bob={a.bob} />
        {/* cup is its own layer: physics driven, never glued to the bike */}
        <Cup {...cup} />
        <Splash x={CONTACT_X} y={RIM_Y - 8} progress={splashP} opacity={1} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 4} amount={stain} />
      </Camera>
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};

export const S01Street: React.FC<{start: number}> = ({start}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={CUT} layout="none">
      <MidShot start={start} />
    </Sequence>
    <Sequence from={CUT} durationInFrames={376 - CUT} layout="none">
      <AccidentShot start={start + CUT / 60} />
    </Sequence>
  </AbsoluteFill>
);
