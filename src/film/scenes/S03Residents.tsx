import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Actor} from '../../characters/Rig';
import {Bike} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {Camera, Vignette} from '../ui';
import {Neighbour} from '../ResidentFigure';
import {UpwardShot} from '../AngleShots';
import {UPWARD_LOCAL} from '../cameraAngles';
import {BIKE_DX, GROUND, HIP_REST, HIP_Y, alanAt, ip, smooth, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';

export const S03Residents: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const local = t - start;
  const base = alanAt(t);

  const lookUp = ip(local, [0.1, 0.85], [0, 1], smooth);
  const gesture = ip(local, [0.6, 1.4, 2.6, 3.4], [0, 1, 1, 0.35], smooth);

  const pose = {
    ...base.pose,
    lean: 2.2,
    chest: 2,
    headYaw: -0.34 * lookUp,
    headNod: -16 * lookUp,
    headTilt: -3 * lookUp,
    armNear: {kind: 'relaxed' as const},
    armFar: {kind: 'relaxed' as const},
    shoulderLift: 1.2,
    mood: -0.45,
    breath: Math.sin(t * 1.5) * 0.8,
    ponytail: -4 + Math.sin(t * 2.1) * 2,
  };

  if (local >= UPWARD_LOCAL) return <UpwardShot t={t} local={local} gesture={gesture} />;

  return (
    <AbsoluteFill>
      <Camera x={1120} y={672} scale={1.58}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.06} />
          {/* residents, clipped inside their window openings */}
          <clipPath id="winA">
            <rect x={1316} y={328} width={100} height={110} />
          </clipPath>
          <clipPath id="winB">
            <rect x={1616} y={328} width={100} height={110} />
          </clipPath>
          <clipPath id="winC">
            <rect x={1316} y={496} width={100} height={110} />
          </clipPath>
          <g clipPath="url(#winA)">
            <Neighbour x={1366} y={436} phase={t * 2.6} lean={-2} gesture={gesture} tilt={-4} />
          </g>
          <g clipPath="url(#winB)">
            <Neighbour x={1666} y={436} phase={t * 2.1 + 1.4} lean={2} gesture={gesture * 0.6} tilt={6} />
          </g>
          <g clipPath="url(#winC)">
            <Neighbour x={1366} y={604} phase={t * 3.1 + 2.6} lean={-1} gesture={gesture * 0.3} tilt={-2} />
          </g>
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={HIP_REST + BIKE_DX} cy={GROUND + 3} rx={180} ry={12} fill="#080F14" opacity={0.4} />
        </svg>
        <Bike x={HIP_REST + BIKE_DX} groundY={GROUND} cracked={1} dent={0.6} spin={base.wheelDeg} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.54} />
        <Actor pose={pose} x={HIP_REST} y={HIP_Y} bob={base.bob} />
      </Camera>
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};
