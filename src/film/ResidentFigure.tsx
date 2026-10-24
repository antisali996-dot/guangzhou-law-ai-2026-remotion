import React from 'react';

/**
 * The neighbours: two residents lean out over the street and argue about who
 * should pay. Backlit silhouettes — they are never identified, never pointed at.
 */
export const Neighbour: React.FC<{
  x: number;
  y: number;
  phase: number;
  lean: number;
  gesture: number;
  tilt: number;
}> = ({x, y, phase, lean, gesture, tilt}) => {
  const arm = -22 - gesture * 22 + Math.sin(phase) * 3;
  const body = lean + Math.sin(phase * 0.8) * 0.8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${body * 0.5})`}>
        {/* shoulders + torso, cut by the sill */}
        <path d="M -30 44 L -31 -4 q 4 -14 16 -17 L 4 -22 q 14 3 19 17 L 24 44 Z" fill="#0E181E" />
        {/* head */}
        <g transform={`rotate(${tilt} 0 -34)`}>
          <circle cx={1} cy={-40} r={16} fill="#0E181E" />
          <path d="M -15 -44 q 4 -14 16 -13 q 12 1 15 12 q -8 -6 -16 -5 q -9 1 -15 6 z" fill="#080F14" />
        </g>
        {/* raised forearm resting on the sill */}
        <g transform={`rotate(${arm} 18 -8)`}>
          <path d="M 16 -6 L 33 -26 L 39 -22 L 21 -1 Z" fill="#0E181E" />
          <g transform={`rotate(${-arm * 0.35} 37 -25)`}>
            <circle cx={37} cy={-26} r={5.6} fill="#0E181E" />
            <path d="M 40 -29 l 7 -3 M 41 -25 l 8 0 M 39 -22 l 6 4" stroke="#0E181E" strokeWidth={2.6} strokeLinecap="round" />
          </g>
        </g>
      </g>
      {/* rim light from the room behind */}
      <path d="M -30 44 L -31 -4 q 4 -14 16 -17 L 4 -22 q 14 3 19 17 L 24 44" fill="none" stroke="#F0C98F" strokeWidth={1.6} opacity={0.28} />
      <circle cx={1} cy={-40} r={16} fill="none" stroke="#F0C98F" strokeWidth={1.4} opacity={0.22} />
    </g>
  );
};

