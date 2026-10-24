import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Street} from '../../art/Street';
import {Bike, BIKE} from '../../props/Bike';
import {Cup} from '../../props/Cup';
import {TeaStain} from '../../props/Splash';
import {clamp} from '../../lib/anim';
import {BigText, Camera, Vignette} from '../ui';
import {GROUND, CUP_REST, STAIN_X, CUP_GROUND_Y} from '../alan';

/**
 * Cold open: the damaged basket, the fallen cup, the tea running into the wet
 * pavement. No character, no explanation — just the question.
 */
export const S00Cold: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const t = start + frame / 60;
  const q = clamp(frame / 360, 0, 1);
  const push = q * q * (3 - 2 * q);
  const scale = 2.3 + push * 0.2;

  // drips run off the cracked rim, two offset streams
  const dripA = (frame % 66) / 66;
  const dripB = ((frame + 22) % 66) / 66;

  return (
    <AbsoluteFill>
      <Camera x={1096} y={866} scale={scale}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Street showRain={false} rain={0} dim={0.16} />
        </svg>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <ellipse cx={1020} cy={GROUND + 4} rx={210} ry={14} fill="#080F14" opacity={0.4} />
        </svg>
        <Bike x={960} groundY={GROUND} cracked={1} dent={0.62} lean={-1.2} />
        <Cup {...CUP_REST} />
        <TeaStain x={STAIN_X} y={CUP_GROUND_Y + 2} amount={1} scale={0.52} />
        {/* tea still running off the rim */}
        {[dripA, dripB].map((p, i) => (
          <circle
            key={i}
            cx={960 + BIKE.basketImpact.x + i * 6}
            cy={790 + p * p * 150}
            r={2.6}
            fill="#A67B52"
            opacity={p < 0.92 ? 0.85 - p * 0.5 : 0}
          />
        ))}
      </Camera>
      <Vignette strength={0.5} />
      <BigText
        lines={[
          {text: '杯子从楼上飞下，', at: 120},
          {text: '整栋楼都要赔？', at: 221},
        ]}
        y={120}
        size={70}
        weight={600}
      />
    </AbsoluteFill>
  );
};
