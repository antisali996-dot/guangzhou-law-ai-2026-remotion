import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Actor, type ArmSpec, type HandPose, type Pose} from '../characters/Rig';
import {Street} from '../art/Street';
import {Bike, BIKE, bikePoint} from '../props/Bike';
import {Cup} from '../props/Cup';
import {Splash, TeaStain} from '../props/Splash';
import {damped, range, smoothstep} from '../lib/anim';

/**
 * Shot 02–04 of the film, also used as the internal 7 s action check:
 * walk the bike in, stop with the hand still on the bar, cup falls from above,
 * hits the basket rim, sprays tea, cup tumbles to the ground, she reacts.
 *
 * World coordinates: pavement at y = 1000, her hips at (hipX, 810).
 */
const GROUND = 1000;
const HIP_Y = 810;
const BIKE_DX = -12;
const CONTACT = 264; // 4.40 s @ 60 fps
const FALL_START = 226;
const RIM_Y = GROUND + BIKE.basketTop.y; // world y of the basket rim (~796)

const clampI = (f: number, input: number[], output: number[], easing = Easing.inOut(Easing.cubic)) =>
  interpolate(f, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

const DEBUG = false;
const Mark: React.FC<{x: number; y: number; color: string; label: string}> = ({x, y, color, label}) => (
  <>
    <circle cx={x} cy={y} r={7} fill="none" stroke={color} strokeWidth={2.5} />
    <path d={`M ${x - 14} ${y} L ${x + 14} ${y} M ${x} ${y - 14} L ${x} ${y + 14}`} stroke={color} strokeWidth={1.6} />
    <text x={x + 12} y={y - 14} fill={color} fontSize={17} fontFamily="monospace">
      {label}
    </text>
  </>
);

const armTo = (x: number, y: number, hand: HandPose, bend: 1 | -1): ArmSpec => ({
  kind: 'ik',
  target: {x, y},
  hand,
  bend,
});

// One hand stays welded to the grip for the whole shot: this is the local target,
// measured from the hip centre, and the bike moves with the same offset.
const GRIP_LOCAL = {x: BIKE.grip.x + BIKE_DX, y: GROUND + BIKE.grip.y - HIP_Y};

export const AccidentVerify: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- walk-in and stop -------------------------------------------------
  const walkT = smoothstep(range(frame, 0, 96));
  const settleT = smoothstep(range(frame, 96, 128));
  const hipX = 786 + 126 * walkT + 6 * settleT;
  const bikeX = hipX + BIKE_DX;

  const stride = (frame / fps) * 5.4;
  const stepping = 1 - smoothstep(range(frame, 96, 122));
  const hipSwing = Math.sin(stride * Math.PI * 2) * 19 * stepping;
  const kneeNear = 6 + (12 + 12 * Math.sin(stride * Math.PI * 2 + 0.9)) * stepping;
  const kneeFar = 6 + (12 + 12 * Math.sin(stride * Math.PI * 2 + Math.PI + 0.9)) * stepping;
  const bob = -2.4 * Math.abs(Math.cos(stride * Math.PI * 2)) * stepping;

  // ---- reaction ---------------------------------------------------------
  const hit = frame >= CONTACT;
  const recoil = hit ? Math.exp(-(frame - CONTACT) * 0.055) : 0;
  const headUp = clampI(frame, [CONTACT, CONTACT + 12, CONTACT + 34], [0, 1, 0], Easing.out(Easing.cubic));
  const lookBack = clampI(frame, [CONTACT + 30, CONTACT + 70], [0, 1], Easing.inOut(Easing.cubic));

  const lean =
    clampI(frame, [0, 96], [5, 3]) -
    recoil * 7 +
    clampI(frame, [CONTACT + 40, CONTACT + 90], [0, -1]);
  const headNod =
    clampI(frame, [0, 96], [6, 9]) -
    headUp * 24 +
    lookBack * 20;
  const headYaw =
    clampI(frame, [0, 96], [0.5, 0.58]) -
    headUp * 0.62 +
    lookBack * 0.34;
  const shoulderLift = recoil * 11;
  const stepBack = recoil * 13;

  // ---- cup --------------------------------------------------------------
  const fallT = Math.max(0, (frame - FALL_START) / fps);
  const cupYFree = 276 + 0.5 * 2600 * fallT * fallT; // px, world
  const cupXFree = 1078 + (frame - FALL_START) * 0.14;

  let cupX = cupXFree;
  let cupY = Math.min(cupYFree, RIM_Y);
  let cupRot = clampI(frame, [FALL_START, CONTACT], [-16, 10]);
  let cupScale = 1;
  if (frame > CONTACT) {
    cupX = clampI(frame, [CONTACT, 276, 292, 300, 310, 320], [1078, 1090, 1110, 1124, 1134, 1138]);
    cupY = clampI(frame, [CONTACT, 274, 290, 298, 308, 320], [RIM_Y, 772, 942, 986, 958, 984], Easing.quad);
    cupRot = clampI(frame, [CONTACT, 274, 292, 302, 320], [10, 58, 94, 101, 93]);
  } else {
    cupY = cupYFree;
  }

  const cracked = range(frame, CONTACT, CONTACT + 20);
  const dent = range(frame, CONTACT, CONTACT + 24) * 0.5;
  const jolt = damped(frame, CONTACT, {amplitude: 7, frequency: 0.62, decay: 0.2});
  const splashP = range(frame, CONTACT, CONTACT + 38);

  const pose: Pose = {
    lean,
    chest: clampI(frame, [0, 96], [3, 2]) + recoil * 2,
    headYaw,
    headNod,
    shoulderLift,
    armNear: armTo(GRIP_LOCAL.x, GRIP_LOCAL.y, 'grip', 1),
    armFar: {kind: 'relaxed', hand: 'relaxed'},
    legNear: {hip: hipSwing + 4, knee: kneeNear + recoil * 8},
    legFar: {hip: -hipSwing + 1, knee: kneeFar + recoil * 6},
    ponytail: -Math.sin(frame / 9) * 4 - recoil * 12,
  };

  const spin = ((hipX - 870) / BIKE.wheelR) * (180 / Math.PI);
  const camScale = 1.7;
  const focus = {x: 995 + stepBack * 0.4, y: 700};

  return (
    <AbsoluteFill style={{backgroundColor: '#0E1A22'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '0 0',
          transform: `translate(960px, 540px) scale(${camScale}) translate(${-focus.x}px, ${-focus.y}px)`,
        }}
      >
        <Street rain={frame * 2.2} />

        {/* shadows */}
        <div
          style={{
            position: 'absolute',
            left: hipX - 76,
            top: GROUND - 12,
            width: 152,
            height: 26,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(10,18,24,0.55), rgba(10,18,24,0))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: bikeX - 170,
            top: GROUND - 8,
            width: 340,
            height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(10,18,24,0.45), rgba(10,18,24,0))',
          }}
        />

        <Bike x={bikeX} groundY={GROUND} spin={spin} cracked={cracked} dent={dent} jolt={jolt} />

        <Actor pose={pose} x={hipX - stepBack} y={HIP_Y + bob} bob={0} />

        {/* tea stain on the basket wall is drawn by the bike; the ground stain lands after the cup */}
        {frame > 300 ? (
          <TeaStain x={cupX - 30} y={GROUND - 2} scale={0.9} amount={range(frame, 300, 330)} />
        ) : null}

        <Cup x={cupX} y={cupY} rotate={cupRot} scale={cupScale} residue={1} drips={frame > CONTACT ? 1 : 0} />
        {/* soft contact shadow that only appears as the cup nears the pavement */}
        {cupY > 850 ? (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <ellipse
              cx={cupX + 16}
              cy={GROUND - 4}
              rx={34 + (cupY - 850) * 0.12}
              ry={7 + (cupY - 850) * 0.02}
              fill="rgba(8,16,22,0.42)"
              opacity={Math.min(0.55, (cupY - 850) / 140)}
            />
          </svg>
        ) : null}
        <Splash x={1076} y={RIM_Y - 4} progress={splashP} />
        {DEBUG ? (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <Mark x={bikeX + BIKE.grip.x} y={GROUND + BIKE.grip.y} color="#FF3B3B" label="grip" />
            <Mark x={bikeX + 155} y={RIM_Y} color="#3BFF8B" label="rim" />
            <Mark x={hipX} y={HIP_Y} color="#3BB8FF" label="hip" />
            <Mark x={bikeX + BIKE.saddle.x} y={GROUND + BIKE.saddle.y} color="#FFE23B" label="saddle" />
          </svg>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
