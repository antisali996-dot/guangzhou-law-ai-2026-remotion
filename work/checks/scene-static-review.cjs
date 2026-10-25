// Freeze the real scene components at selected times for static composition QA.
// No renderer, encoder, video file, or image-generation service is invoked.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),h=React.createElement;
const remotion=require('remotion');let frame=0;
const shim={...remotion,useCurrentFrame:()=>frame,Img:({src,style,alt})=>h('img',{src,style,alt:alt||''})};
const compile=(m,f,source)=>{
  const original=m.require.bind(m);m.require=id=>id==='remotion'?shim:original(id);
  m._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
};
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,f)=>compile(m,f,fs.readFileSync(f,'utf8'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/preflight-20261025-gait');fs.mkdirSync(out,{recursive:true});
const midFile=path.join(root,'src/film/scenes/S01Street.tsx'),mid=new Module(midFile,module);mid.filename=midFile;mid.paths=module.paths;
compile(mid,midFile,fs.readFileSync(midFile,'utf8').replace('const MidShot:','export const MidShot:'));
const {S02Reaction}=require('../../src/film/scenes/S02Reaction.tsx');
const {S04Evidence}=require('../../src/film/scenes/S04Evidence.tsx');
const {S08Investigate,S10Confirm,S11Leave,S12Card}=require('../../src/film/scenes/Ending.tsx');
const {S07Law,S09Law}=require('../../src/film/scenes/LawScenes.tsx');
const {S00Cold}=require('../../src/film/scenes/S00Cold.tsx');
const {SCENES}=require('../../src/film/timeline.ts');
const samples=[
  {label:'推车 · 6.40秒',Comp:mid.exports.MidShot,start:6,time:6.4},
  {label:'换脚 · 7.15秒',Comp:mid.exports.MidShot,start:6,time:7.15},
  {label:'停稳 · 8.30秒',Comp:mid.exports.MidShot,start:6,time:8.3},
  {label:'反应 · 13.10秒',Comp:S02Reaction,start:12.264,time:13.1},
  {label:'取手机 · 20.60秒',Comp:S04Evidence,start:19.3,time:20.6},
  {label:'离场 · 75.20秒',Comp:S11Leave,start:73.7,time:75.2},
];
const card=s=>{
  if(!s.Comp) throw new Error(`Missing scene component: ${s.label}`);
  frame=Math.round((s.time-s.start)*60);
  const body=renderToStaticMarkup(h(s.Comp,{start:s.start}));
  return `<section><div class="label">${s.label}</div><div class="viewport"><div class="world">${body}</div></div></section>`;
};
const fonts='file:///'+root.replaceAll('\\','/')+'/public/fonts/';
const css=`@font-face{font-family:'Noto Sans SC';src:url('${fonts}NotoSansSC-VF.ttf')}@font-face{font-family:'Noto Serif SC';src:url('${fonts}NotoSerifSC-VF.ttf')}*{box-sizing:border-box}body{width:1200px;margin:0;padding:24px;background:#11272e;color:#eeeadd;font-family:'Noto Sans SC',sans-serif}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;margin:0 0 20px;color:#bed1c3}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.label{height:38px;padding:8px 12px;background:#213a42;font-size:18px}.viewport{width:569px;height:320px;position:relative;overflow:hidden;background:#0b141a}.world{width:1920px;height:1080px;position:absolute;transform:scale(.29635417);transform-origin:0 0}`;
const write=(name,title,list)=>{
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${css}</style><h1>${title}</h1><p>实际镜头组件固定时刻；不含全片字幕等叠层。仅静态审查，未渲染视频。</p><div class="grid">${list.map(card).join('')}</div></html>`;
  for(const asset of html.matchAll(/(?:src|href)="\/([^"#]+)"/g)) {
    if(!fs.existsSync(path.join(root,'public',decodeURIComponent(asset[1])))) throw new Error(`Missing static art: ${asset[1]}`);
  }
  const publicUrl='file:///'+root.replaceAll('\\','/')+'/public/';
  fs.writeFileSync(path.join(out,name+'.html'),html.replaceAll('src="/',`src="${publicUrl}`).replaceAll('href="/',`href="${publicUrl}`));
};
write('scene-context','人物、单车与镜头构图复审',samples);
// These additional scenes check neck/hand relationships and the final visual answer.
write('ending-context','收纳、启步与片尾复审',[
  {label:'收手机 · 71.30秒',Comp:S10Confirm,start:70.3,time:71.3},
  {label:'启步前 · 73.70秒',Comp:S11Leave,start:73.7,time:73.7},
  {label:'持续离场 · 77.90秒',Comp:S11Leave,start:73.7,time:77.9},
  {label:'片尾回应 · 80.00秒',Comp:S12Card,start:78,time:80},
]);
write('story-context','开场、法律分支与本案衔接',[
  {label:'开场问题 · 3.00秒',Comp:S00Cold,start:0,time:3},
  {label:'补偿条件分支 · 45.50秒',Comp:S07Law,start:38.7,time:45.5},
  {label:'回到本案 · 54.60秒',Comp:S08Investigate,start:52,time:54.6},
  {label:'刑责条件 · 61.00秒',Comp:S09Law,start:59.5,time:61},
]);
fs.writeFileSync(path.join(out,'scene-static.json'),JSON.stringify({videoRendered:false,mode:'React SSR, fixed useCurrentFrame; native img for local art',frames:samples.map(({label,start,time})=>({label,start,time,localFrame:Math.round((time-start)*60)})),timeline:SCENES.length},null,2));
console.log(out);
