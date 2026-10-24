import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Official Remotion font pattern: register FontFace from a local asset and hold the
// render with delayRender() until the faces are actually usable. No network access.
const FACES = [
  {family: 'Noto Sans SC', file: 'fonts/NotoSansSC-VF.ttf'},
  {family: 'Noto Serif SC', file: 'fonts/NotoSerifSC-VF.ttf'},
] as const;

let loading: Promise<void> | null = null;

const loadAll = (): Promise<void> => {
  if (loading) {
    return loading;
  }
  loading = (async () => {
    if (typeof document === 'undefined') {
      return;
    }
    const faces = await Promise.all(
      FACES.map(async ({family, file}) => {
        const url = staticFile(file);
        const face = new FontFace(family, `url(${url})`, {
          weight: '100 900',
          style: 'normal',
          display: 'block',
        });
        const loaded = await face.load();
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(loaded);
        return loaded;
      }),
    );
    await document.fonts.ready;
    if (!faces.every((face) => face.status === 'loaded')) {
      throw new Error('Local film fonts did not finish loading');
    }
    console.info('[film-fonts] local families ready: Noto Sans SC, Noto Serif SC');
  })();
  return loading;
};

export const useFilmFonts = (): void => {
  const [handle] = useState(() => delayRender('Loading local Noto fonts'));
  useEffect(() => {
    loadAll()
      .then(() => continueRender(handle))
      .catch((err: unknown) => cancelRender(err));
  }, [handle]);
};
