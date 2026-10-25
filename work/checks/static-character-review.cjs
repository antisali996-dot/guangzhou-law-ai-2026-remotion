// Static SVG/HTML inspection only: never opens Remotion or creates video frames.
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const Module=require('node:module');
const {execFileSync}=require('node:child_process');
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {Head}=require('../../src/characters/Head.tsx');
const {Actor,ALAN_LOOK,RIG}=require('../../src/characters/Rig.tsx');
const {Street}=require('../../src/art/Street.tsx');
const {Bike}=require('../../src/props/Bike.tsx');
const {alanAt,GROUND,HIP_Y}=require('../../src/film/alan.ts');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(root,process.argv[2]||'work/preflight-20261025');
if(!out.startsWith(path.join(root,'work')+path.sep)) throw new Error('Static review output must stay inside project work/');
fs.mkdirSync(out,{recursive:true});
const oldFile=path.join(root,'src/characters/Rig.tsx');
const oldText=execFileSync('git',['show','6fa1485:src/characters/Rig.tsx'],{cwd:root,encoding:'utf8'}).replace('const Head: React.FC<','export const LegacyHead: React.FC<').replaceAll('<Head ', '<LegacyHead ');
const oldModule=new Module(oldFile,module);oldModule.filename=oldFile;oldModule.paths=module.paths;
oldModule._compile(ts.transpileModule(oldText,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,oldFile);
const LegacyHead=oldModule.exports.LegacyHead;
const priorDir=path.join(root,'work/preflight-20261025-gait');
let priorActor,priorPoses;
if(fs.existsSync(path.join(priorDir,'before-rig.tsx'))) {
  const m=new Module(oldFile,module);m.filename=oldFile;m.paths=module.paths;
  m._compile(ts.transpileModule(fs.readFileSync(path.join(priorDir,'before-rig.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,oldFile);
  priorActor=m.exports.Actor;priorPoses=JSON.parse(fs.readFileSync(path.join(priorDir,'before-poses.json'),'utf8'));
}
const h=React.createElement;
const poses=[
  {label:'旧头部 · 对照',old:true,yaw:.25,mood:-.75},
  {label:'新头部 · 自然',yaw:.25,mood:.15},
  {label:'新头部 · 轻微皱眉',yaw:.25,mood:-.75},
  {label:'新头部 · 惊讶',yaw:.25,mood:-.75,surprise:.95},
  {label:'新头部 · 眨眼',yaw:.25,mood:-.75,blink:1},
  {label:'新头部 · 转头',yaw:-.34,mood:-.45},
];
const faces=h('div',{className:'faces'},poses.map((p,i)=>h('section',{className:'card',key:i},
  h('svg',{width:330,height:290,viewBox:'-57 -53 114 116'},
    h('path',{d:'M-20 38Q0 50 20 38L34 42Q43 46 44 63H-44Q-43 46-34 42Z',fill:ALAN_LOOK.shirt}),
    h(p.old?LegacyHead:Head,{yaw:p.yaw,mood:p.mood,surprise:p.surprise||0,blink:p.blink||0,nod:0,tilt:0,ponytail:-3,look:ALAN_LOOK})),
  h('div',{className:'label'},p.label))));
const a=alanAt(8.1);
const scene=h('div',{className:'scene'},h('div',{className:'world'},
  h('svg',{width:1920,height:1080,style:{position:'absolute'}},h(Street,{showRain:false,rain:0,dim:.06})),
  h(Bike,{x:a.bikeX,groundY:GROUND,spin:a.wheelDeg,kickstand:a.kickstand}),
  h(Actor,{pose:a.pose,x:a.hipX,y:HIP_Y,bob:a.bob})),h('div',{className:'scene-label'},'新头部与现有身体、单车、街景 · 静态检查'));
const markup=renderToStaticMarkup(h(React.Fragment,null,h('h1',null,'人物头部与画风复核'),h('p',null,'自然、皱眉、惊讶、眨眼、转头；静态预检，不代表动作连续性已验收。'),faces,scene));
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>@font-face{font-family:Review;src:url('file:///${root.replaceAll('\\','/')}/public/fonts/NotoSansSC-VF.ttf')}*{box-sizing:border-box}body{margin:0;padding:26px;background:#11272e;color:#eeeadd;font-family:Review,sans-serif;width:1200px}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;color:#bed1c3;margin:0 0 20px}.faces{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{height:340px;background:#e7e6dc;display:flex;flex-direction:column;align-items:center;color:#284343}.label{font-size:21px}.scene{height:540px;width:1148px;margin-top:20px;position:relative;overflow:hidden}.world{position:absolute;width:1920px;height:1080px;transform:scale(.94) translate(-338px,-438px);transform-origin:0 0}.scene-label{position:absolute;left:22px;bottom:15px;padding:8px 14px;background:#10252bd9;font-size:21px}</style>${markup}</html>`;
fs.writeFileSync(path.join(out,'character-review.html'),html);
const legSamples=[
  {label:'裤腰与髋部放大',time:8.1,pose:a.pose,view:'-54 -31 112 99'},
  {label:'站立 · 全裤腿',time:8.1,pose:a.pose,view:'-90 -38 200 265'},
  {label:'推车迈步 · 完整片6.4秒',time:6.4,pose:alanAt(6.4).pose,view:'-90 -38 200 265'},
  {label:'减速收步 · 7.7 秒',time:7.7,pose:alanAt(7.7).pose,view:'-90 -38 200 265'},
];
const legCards=legSamples.flatMap((s,i)=>(priorActor?[false,true]:[true]).map(current=>{
  const pose=current?s.pose:priorPoses.entry[Math.round(s.time*60)].pose;
  const actor=renderToStaticMarkup(h(current?Actor:priorActor,{pose,x:0,y:0}));
  // Reuse the real actor's contents with a closer static viewBox; no alternate art.
  const close=actor.replace(/viewBox="[^"]+"/,`viewBox="${s.view}"`).replace(/style="[^"]*"/,'style="width:100%;height:100%;overflow:visible"').replace('width="460"','width="540"').replace('height="680"','height="340"');
  return `<section class="leg-card ${i===0?'root':''}"><div class="leg-label">${current?'修改后':'修改前'} · ${s.label}</div><div class="leg-window">${close}</div></section>`;
})).join('');
fs.writeFileSync(path.join(out,'legs-review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>@font-face{font-family:Review;src:url('file:///${root.replaceAll('\\','/')}/public/fonts/NotoSansSC-VF.ttf')}*{box-sizing:border-box}body{margin:0;padding:26px;width:1200px;background:#11272e;color:#eeeadd;font-family:Review,sans-serif}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;color:#bed1c3;margin:0 0 20px}.legs{display:grid;grid-template-columns:1fr 1fr;gap:14px}.leg-card{height:368px;background:#37515a;overflow:hidden}.leg-label{height:43px;background:#213a42;padding:8px 16px;font-size:20px}.leg-window{height:325px;overflow:hidden}.root .leg-window{height:310px}</style><h1>裤腿连接与轮廓 · 静态对照</h1><p>${priorActor?'左：本轮步态修正前；右：当前修正，均为各自真实姿态。':'当前真实姿态。'}尚未进行视频动态验收。</p><div class="legs">${legCards}</div></html>`);
const {LegalQuotation}=require('../../src/film/scenes/LegalStory.tsx');
const {CIVIL_QUOTES,COMPENSATION_QUOTES,CRIMINAL_QUOTES}=require('../../src/film/legalFlow.ts');
const quotations=[
  {label:'民事责任 · 最长原文段',text:CIVIL_QUOTES[0],cite:'《民法典》第1254条第一款（节选）'},
  {label:'条件分支 · 补偿后追偿',text:COMPENSATION_QUOTES[3],cite:'《民法典》第1254条第一款（节选）'},
  {label:'刑事责任 · 保留情节严重前提',text:CRIMINAL_QUOTES[0],cite:'《刑法》第291条之二第一款',criminal:true},
  {label:'刑种选择 · 保留或者关系',text:CRIMINAL_QUOTES[1],cite:'《刑法》第291条之二第一款',criminal:true},
];
const quoteMarkup=renderToStaticMarkup(h('div',null,h('h1',null,'法条字号与引用区静态复核'),h('p',null,'原文、出处和进度标记在实际比例下检查；未导出视频。'),quotations.map((q,i)=>h('section',{className:'q-block',key:i},h('div',{className:'q-title'},q.label),h('div',{className:'q-world'},h(LegalQuotation,{...q,active:0,count:4}))))));
const fontRoot='file:///'+root.replaceAll('\\','/')+'/public/fonts/';
fs.writeFileSync(path.join(out,'legal-review.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>@font-face{font-family:'Noto Sans SC';src:url('${fontRoot}NotoSansSC-VF.ttf')}@font-face{font-family:'Noto Serif SC';src:url('${fontRoot}NotoSerifSC-VF.ttf')}*{box-sizing:border-box}body{margin:0;padding:26px;width:1200px;background:#11272e;color:#eeeadd;font-family:'Noto Sans SC',sans-serif}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;color:#bed1c3;margin:0 0 20px}.q-block{height:238px;position:relative;margin-bottom:18px;border:1px solid #426260;overflow:hidden}.q-title{padding:12px 18px;font-size:23px;color:#c7d4c4}.q-world{position:absolute;left:0;top:32px;width:1920px;height:1080px;transform:scale(.598) translate(-72px,-690px);transform-origin:0 0}</style>${quoteMarkup}</html>`);
fs.writeFileSync(path.join(out,'static-review.json'),JSON.stringify({mode:'React server SVG + static browser screenshot',videoRendered:false,poses:poses.map(p=>p.label),referenceCommit:'6fa1485'},null,2));
// Browser geometry check: the actual cloth must cover both bone centre-lines,
// including the previously detached root, during entry and departure samples.
const {legGeometryFor}=require('../../src/characters/Rig.tsx');
const {leaveAt,LEAVE_DURATION}=require('../../src/film/leave.ts');
const coverage=[];
for(const [label,start,duration,sample] of [['entry',6,8.5,alanAt],['departure',0,LEAVE_DURATION,leaveAt]]) {
  for(let f=Math.ceil(start*60);f<=Math.floor(duration*60);f+=6) {
    const pose=sample(f/60).pose;
    for(const [hip,spec] of [[{x:RIG.hipHalf,y:0},pose.legNear],[{x:-RIG.hipHalf,y:RIG.farHipY},pose.legFar]]) {
      const g=legGeometryFor(hip,spec),points=[];
      for(const [a,b] of [[hip,g.knee],[g.knee,g.ankle]]) for(let i=0;i<=16;i++) points.push([a.x+(b.x-a.x)*i/16,a.y+(b.y-a.y)*i/16]);
      coverage.push({label,time:f/60,hip:hip.x,d:g.outline,points});
    }
  }
}
fs.writeFileSync(path.join(out,'leg-coverage.html'),`<!doctype html><meta charset="utf-8"><pre id="result"></pre><script>const samples=${JSON.stringify(coverage)};const ctx=document.createElement('canvas').getContext('2d');const failures=[];let points=0;for(const s of samples){const p=new Path2D(s.d);for(const [x,y] of s.points){points++;if(!ctx.isPointInPath(p,x,y))failures.push({label:s.label,time:s.time,hip:s.hip,x,y});}}document.getElementById('result').textContent=JSON.stringify({mode:'static SVG path coverage',videoRendered:false,poses:samples.length,points,failures});</script>`);
console.log(path.join(out,'character-review.html'));
