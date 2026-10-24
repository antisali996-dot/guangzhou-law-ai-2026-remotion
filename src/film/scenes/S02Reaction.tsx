import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Actor} from '../../characters/Rig';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {Camera, Vignette} from '../ui';
import {BIKE_DX, GROUND, HIP_REST, HIP_Y, alanAt, ip, smooth, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';

/**
 * Reaction: the head snaps down to the basket, the shoulders tighten, one small
 * step back, then she lifts her eyes to the building above.
 */
export const S02Reaction: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;
  const base = alanAt(t);

  const headDown = ip(local, [0.02, 0.5, 1.15], [0.42, 0.52, 0.5], smooth);
  const lookUp = ip(local, [1.25, 1.95], [0, 1], smooth);
  const stepT = ip(local, [0.25, 1.1], [0, 1], smooth);

  const hipX = HIP_REST;
  const lean = 4 + 2.6 * stepT;
  const lift = 3.2 * (1 - stepT) + 1.4 * lookUp;

  const pose = {
    ...base.pose,
    lean,
    chest: 1.6,
    headYaw: headDown * (1 - lookUp) - 0.28 * lookUp,
    headNod: headDown * 34 - 10 * lookUp,
    headTilt: 1.4 - 2 * lookUp,
    shoulderLift: lift,
    breathing: 0,
    breath: Math.sin(t * 1.6) * 0.9,
    ponytail: -3 + Math.sin(t * 2.4) * 2.4,
    surprise: 0.95 * (1 - smooth(local / 1.15)),
    mood: -0.75,
  };

  const scale = 2.44 + 0.06 * smooth(local / 2.3);

  return (
    <AbsoluteFill>
      <Camera x={hipX - 14} y={712} scale={scale}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.1} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={hipX + BIKE_DX} cy={GROUND + 3} rx={170} ry={12} fill="#080F14" opacity={0.42} />
        </svg>
        <Bike
          x={hipX + BIKE_DX}
          groundY={GROUND}
          cracked={1}
          dent={0.6}
          lean={0.6}
          spin={base.wheelDeg}
        />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
        <Actor pose={pose} x={hipX} y={HIP_Y} bob={base.bob} />
      </Camera>
      <Vignette strength={0.42} />
    </AbsoluteFill>
  );
};
