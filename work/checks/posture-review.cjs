// Static, native-component posture audit. Does not invoke Remotion rendering.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),h=React.createElement;
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/preflight-20261025-gait');fs.mkdirSync(out,{recursive:true});
const {alanAt}=require('../../src/film/alan.ts'),{leaveAt,LEAVE_DURATION}=require('../../src/film/leave.ts');
const {Actor}=require('../../src/characters/Rig.tsx');
if(process.argv.includes('--capture')) {
  if(fs.existsSync(path.join(out,'before-rig.tsx'))) throw new Error('Refusing to overwrite captured baseline');
  fs.copyFileSync(path.join(root,'src/characters/Rig.tsx'),path.join(out,'before-rig.tsx'));
  fs.copyFileSync(path.join(root,'src/characters/locomotion.ts'),path.join(out,'before-locomotion.ts'));
  const entry=Array.from({length:541},(_,f)=>alanAt(f/60));
  const departure=Array.from({length:Math.ceil(LEAVE_DURATION*60)+1},(_,f)=>leaveAt(f/60));
  fs.writeFileSync(path.join(out,'before-poses.json'),JSON.stringify({entry,departure}));
  console.log('Captured pre-correction rig, gait source and actual poses.');process.exit(0);
}
const baseline=JSON.parse(fs.readFileSync(path.join(out,'before-poses.json'),'utf8'));
const filename=path.join(root,'src/characters/Rig.tsx'),old=new Module(filename,module);old.filename=filename;old.paths=module.paths;
old._compile(ts.transpileModule(fs.readFileSync(path.join(out,'before-rig.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
const times=[6.15,6.4,6.65,6.9,7.15,7.4,7.7,8.3];
const card=(C,s,label)=>{const p=s.pose;return `<section><div class="label">${label}</div>${renderToStaticMarkup(h(C,{x:145,y:285,scale:.7,pose:p,bob:s.bob??s.loco.bob}))}<div class="ground"></div></section>`;};
const rows=times.map(t=>`<div class="pair">${card(old.exports.Actor,baseline.entry[Math.round(t*60)],`修改前 · ${t.toFixed(2)}秒`)}${card(Actor,alanAt(t),`当前 · ${t.toFixed(2)}秒`)}</div>`).join('');
const font='file:///'+root.replaceAll('\\','/')+'/public/fonts/NotoSansSC-VF.ttf';
const css=`@font-face{font-family:Review;src:url('${font}')}*{box-sizing:border-box}body{margin:0;padding:24px;width:1200px;background:#11272e;color:#eeeadd;font-family:Review,sans-serif}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;margin:0 0 20px;color:#bed1c3}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1a3038}section{position:relative;overflow:hidden;height:440px;background:#37515a}.label{position:absolute;inset:0 0 auto;height:38px;background:#213a42;padding:8px;font-size:17px;z-index:2}.ground{position:absolute;left:12px;right:12px;top:418px;border-top:1px dashed #94a5a0}`;
fs.writeFileSync(path.join(out,'posture-review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${css}</style><h1>人物承重与迈步 · 静态复审</h1><p>每组左侧为修正前，右侧为当前真实组件；同一时刻对照。尚未验收连续动态。</p><div class="grid">${rows}</div></html>`);
const all=times.map(t=>card(Actor,alanAt(t),`${t.toFixed(2)}秒`)).join('');
fs.writeFileSync(path.join(out,'current-poses.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${css}.grid{grid-template-columns:repeat(4,1fr)}</style><h1>当前人物姿态 · 实际入场与停步</h1><p>使用完整片6–8.3秒的实际步态；原静态工具误用了片头时间，已纠正。未渲染视频。</p><div class="grid">${all}</div></html>`);
console.log(out);
