import {Composition} from 'remotion';
import {TestClip} from './TestClip';
import {AccidentVerify} from './scenes/Accident';
import {Film} from './film/Film';
import {Sequence, AbsoluteFill} from 'remotion';
import {S01Street} from './film/scenes/S01Street';
import {Vignette} from './film/ui';
import {useFilmFonts} from './lib/fonts';
import {FPS, WIDTH, HEIGHT, TOTAL_FRAMES} from './film/timeline';

/** the internal gate: 5–8 s of continuous action, no subtitles, no narration */
const ActionClip: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#0B141A'}}>
    <Sequence from={0} durationInFrames={376}>
      <S01Street start={6} />
    </Sequence>
    <Vignette strength={0.26} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => {
  useFilmFonts();
  return (
    <>
      <Composition
        id="TestClip"
        component={TestClip}
        durationInFrames={120}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="AccidentVerify"
        component={AccidentVerify}
        durationInFrames={420}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="ActionClip"
        component={ActionClip}
        durationInFrames={376}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Film"
        component={Film}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
