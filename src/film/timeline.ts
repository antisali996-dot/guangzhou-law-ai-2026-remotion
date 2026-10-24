// Master timeline. Every narration line starts exactly on a scene boundary so the
// shots lock to the voice track (see src/film/vo.ts for the measured durations).
export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** seconds -> frame index (rounded, so 60fps sampling stays deterministic) */
export const f = (sec: number): number => Math.round(sec * FPS);

export type SceneId =
  | 's00'
  | 's01'
  | 's02'
  | 's03'
  | 's04'
  | 's05'
  | 's06'
  | 's07'
  | 's08'
  | 's09'
  | 's10'
  | 's11'
  | 's12';

export type SceneDef = {
  id: SceneId;
  /** global start in seconds */
  start: number;
  /** global end in seconds */
  end: number;
  vo: string | null;
  note: string;
};

export const SCENES: SceneDef[] = [
  {id: 's00', start: 0.0, end: 6.0, vo: 'L01', note: '冷开场：受损车篮与落杯细节 + 开场疑问'},
  {id: 's01', start: 6.0, end: 12.264, vo: 'L02', note: '骑楼街中景：推车、停车、杯子砸落'},
  {id: 's02', start: 12.264, end: 14.6, vo: null, note: '反应近景：转头、缩肩、略退、看向车篮'},
  {id: 's03', start: 14.6, end: 19.3, vo: 'L03', note: '居民提议：楼上住户议论，阿岚抬头'},
  {id: 's04', start: 19.3, end: 26.0, vo: 'L04', note: '报警留证：取手机、看屏、拍照、填信息'},
  {id: 's05', start: 26.0, end: 29.2, vo: 'L05', note: '法条一：禁止抛掷'},
  {id: 's06', start: 29.2, end: 38.7, vo: 'L06', note: '法条二：侵权人承担责任'},
  {id: 's07', start: 38.7, end: 52.0, vo: 'L07', note: '法条三：难以确定 + 补偿与追偿'},
  {id: 's08', start: 52.0, end: 59.5, vo: 'L08', note: '调查与索赔：现场照片、监控示意、材料'},
  {id: 's09', start: 59.5, end: 70.3, vo: 'L09', note: '刑责提示：刑法原文分段，生活场景保留'},
  {id: 's10', start: 70.3, end: 73.7, vo: 'L10', note: '依法认定：收起手机与材料'},
  {id: 's11', start: 73.7, end: 78.0, vo: 'L11', note: '离开：重新握把、迈步、推车前行'},
  {id: 's12', start: 78.0, end: 84.0, vo: null, note: '片尾：记忆句与创作说明'},
];

export const TOTAL_SEC = 84;
export const TOTAL_FRAMES = f(TOTAL_SEC); // 5040

export const scene = (id: SceneId): SceneDef => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) {
    throw new Error(`scene ${id} missing`);
  }
  return s;
};

/** local frame inside a scene, given the global frame */
export const localOf = (globalFrame: number, id: SceneId): number =>
  globalFrame - f(scene(id).start);

export const sceneFrames = (id: SceneId): number => {
  const s = scene(id);
  return f(s.end) - f(s.start);
};
