import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const CJK = '"Microsoft YaHei", "Microsoft YaHei UI", "SimHei", sans-serif';

export const TestClip: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();

  // Continuous, frame-driven motion: linear in x, gentle sine in y.
  const progress = frame / (durationInFrames - 1);
  const x = interpolate(progress, [0, 1], [180, width - 180 - 160]);
  const y = height / 2 + Math.sin(progress * Math.PI * 2) * 180;
  const rotation = progress * 360;
  const barWidth = interpolate(progress, [0, 1], [0, 1440]);

  return (
    <AbsoluteFill style={{backgroundColor: '#0B1020', fontFamily: CJK}}>
      {/* existing local audio asset, copied into public/ */}
      <Audio src={staticFile('vo_s01.mp3')} />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: '#F5F7FF',
            letterSpacing: 4,
            textAlign: 'center',
          }}
        >
          广州法律 AI · 环境自检
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 46,
            fontWeight: 400,
            color: '#8FA4C8',
            letterSpacing: 2,
          }}
        >
          Remotion 2 秒测试片段 · 1920×1080 · 60fps · 120 帧
        </div>

        {/* per-frame moving shape */}
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y - 80,
            width: 160,
            height: 160,
            borderRadius: 32,
            background: 'linear-gradient(135deg, #4F8CFF 0%, #7BE0C8 100%)',
            transform: `rotate(${rotation}deg)`,
            boxShadow: '0 24px 60px rgba(79, 140, 255, 0.35)',
          }}
        />

        {/* frame readout for per-frame verification */}
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 240,
            fontFamily: 'Consolas, monospace',
            fontSize: 40,
            color: '#6F86AB',
          }}
        >
          frame {String(frame).padStart(3, '0')} / {durationInFrames - 1} · {fps} fps
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 96,
            left: 240,
            width: 1440,
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(143, 164, 200, 0.2)',
          }}
        >
          <div
            style={{
              width: barWidth,
              height: '100%',
              borderRadius: 5,
              backgroundColor: '#4F8CFF',
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
