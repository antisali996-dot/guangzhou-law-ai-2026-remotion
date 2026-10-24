// Evaluate the project's own TypeScript values in memory; never regex-parse cues.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022},
    }).outputText, filename);
}
const read = (relative) => require(path.join(root, relative));
const {FPS, TOTAL_FRAMES} = read('src/film/timeline.ts');
const {VO} = read('src/film/vo.ts');
const {SFX_CUES, SCORE_REMOTION_VOLUME} = read('src/film/cues.ts');
const start = (seconds) => Math.round(seconds * FPS) / FPS;
const voices = VO.map((v) => ({id: v.id, file: `vo/${v.file}`, start: start(v.start),
  duration: (Math.round(v.dur * FPS) + 2) / FPS, gain: 1}));
const effects = SFX_CUES.map((s, i) => ({id: `${i + 1}:${s.file}`, file: `audio/${s.file}`,
  start: start(s.at), duration: 3, gain: s.v}));
process.stdout.write(JSON.stringify({root, fps: FPS, totalFrames: TOTAL_FRAMES,
  duration: TOTAL_FRAMES / FPS, scoreGain: SCORE_REMOTION_VOLUME, voices, effects}));
