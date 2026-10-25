// Freeze actual Film scenes to check a person walking alongside a bicycle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {renderAt}=require('./composite-static-review.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/preflight-20261025-side');
const times=[6.4,6.9,7.15,8.3,13.1,15.3,20.6,54.6,71.3,75.2,77.9];
const frames=times.map(time=>({time,html:renderAt(time)}));
if(process.argv.includes('--check')){
  for(const {time,html} of frames){
    const actors=[...html.matchAll(/data-character="actor"/g)];
    assert.equal(actors.length,1,`${time}s splits the person across the bicycle`);
    const bike=html.indexOf('data-prop="bicycle"'),actor=actors[0].index;
    assert.ok(bike>=0&&actor>bike,`${time}s puts the person behind or across the bicycle`);
    for(const leg of ['far-leg','near-leg']) assert.ok(html.indexOf(`data-body-part="${leg}"`)>actor,`${time}s moves ${leg} off the shared near-side layer`);
  }
  console.log(`Same-side walking composition checked in ${frames.length} real Film scenes.`);process.exit(0);
}
fs.mkdirSync(out,{recursive:true});
const phase=process.argv.includes('--baseline')?'before':'current';
const font='file:///'+root.replaceAll('\\','/')+'/public/fonts/NotoSansSC-VF.ttf';
const css=`@font-face{font-family:Review;src:url('${font}')}*{box-sizing:border-box}body{margin:0;padding:20px;background:#11272e;color:#eeeadd;font-family:Review,sans-serif;width:1200px}h1{font-size:28px;margin:0 0 8px}p{font-size:17px;color:#bed1c3;margin:0 0 18px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.label{height:36px;background:#213a42;padding:7px 12px;font-size:18px}.viewport{width:573px;height:322px;overflow:hidden;position:relative}.world{width:1920px;height:1080px;position:absolute;transform:scale(.2984375);transform-origin:0 0}`;
const card=({time,html})=>`<section><div class="label">${time.toFixed(2)}秒 · ${phase==='before'?'修正前':'当前'}</div><div class="viewport"><div class="world">${html}</div></div></section>`;
fs.writeFileSync(path.join(out,`side-${phase}.html`),`<!doctype html><meta charset="utf-8"><style>${css}</style><h1>人站在自行车同一侧 · 静态复核</h1><p>实际Film组件固定时刻；不编码视频。检查两腿、车架、轮胎和车把的遮挡。</p><div class="grid">${frames.map(card).join('')}</div>`);
// Keep the exact same scene crops for a before/after spatial comparison.
for(const time of [6.9,7.15,8.3,75.2,77.9]){
  const html=frames.find(s=>s.time===time).html;
  fs.writeFileSync(path.join(out,`frame-${time}-${phase}.html`),`<!doctype html><meta charset="utf-8"><style>@font-face{font-family:'Noto Sans SC';src:url('${font}')}body{margin:0;width:1920px;height:1080px;overflow:hidden}.stage{position:relative;width:1920px;height:1080px}</style><div class="stage">${html}</div>`);
}
fs.writeFileSync(path.join(out,`composition-${phase}.json`),JSON.stringify({videoRendered:false,times,rule:'One complete person on the near side of the bicycle'},null,2));
if(phase==='current'&&fs.existsSync(path.join(out,'frame-6.9-before.html'))){
  const panels=['before','current'].map(p=>`<section><div class="label">${p==='before'?'修正前 · 两腿分跨车架':'当前 · 双腿在车架同一侧'}</div><div class="close"><iframe src="frame-6.9-${p}.html"></iframe></div></section>`).join('');
  fs.writeFileSync(path.join(out,'side-closeup.html'),`<!doctype html><meta charset="utf-8"><style>${css}.close{position:relative;width:573px;height:520px;overflow:hidden}.close iframe{position:absolute;left:-650px;top:-470px;width:1920px;height:1080px;border:0}</style><h1>推车站位修正 · 双腿与车架遮挡</h1><p>同为完整片6.90秒的静态构图。未重新渲染视频。</p><div class="grid">${panels}</div>`);
}
console.log(out);
