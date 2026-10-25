// Full-film static composition: fixed frame contexts, silent audio, native local images.
// This tests composition/readability, not Remotion playback or encoded video.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),h=React.createElement;
const remotion=require('remotion');let globalFrame=0;
const Frame=React.createContext(null);
const currentFrame=()=>React.useContext(Frame)??globalFrame;
const shim={...remotion,useCurrentFrame:currentFrame,
  Img:({src,style,alt})=>h('img',{src,style,alt:alt||''}),
  Sequence:({from=0,durationInFrames=Infinity,layout,children})=>{
    const local=currentFrame()-from;
    return local<0||local>=durationInFrames?null:h(Frame.Provider,{value:local},layout==='none'?children:h(remotion.AbsoluteFill,null,children));
  }};
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,f)=>{
  const original=m.require.bind(m);
  m.require=id=>id==='remotion'?shim:id==='@remotion/media'?{Audio:()=>null}:original(id);
  m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
};
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/preflight-20261025-five');fs.mkdirSync(out,{recursive:true});
const {Film}=require('../../src/film/Film.tsx');
const times=[3,7.15,12.8,20.6,23.2,26.7,30,39.5,45.5,49.4,54.6,61,65,68.5,71.3,77.9,80,83.5];
const renderAt=time=>{
  globalFrame=Math.round(time*60);
  const markup=renderToStaticMarkup(h(Film));
  for(const a of markup.matchAll(/(?:src|href)="\/([^"#]+)"/g)) if(!fs.existsSync(path.join(root,'public',decodeURIComponent(a[1])))) throw new Error(`Missing art: ${a[1]}`);
  const url='file:///'+root.replaceAll('\\','/')+'/public/';
  return markup.replaceAll('src="/',`src="${url}`).replaceAll('href="/',`href="${url}`);
};
module.exports={renderAt};
if(require.main!==module) return;
const fonts='file:///'+root.replaceAll('\\','/')+'/public/fonts/';
const fontCss=`@font-face{font-family:'Noto Sans SC';src:url('${fonts}NotoSansSC-VF.ttf')}@font-face{font-family:'Noto Serif SC';src:url('${fonts}NotoSerifSC-VF.ttf')}`;
const shots=times.map(time=>({time,html:renderAt(time)}));
const phase=process.argv.includes('--baseline')?'before':'current';
const sheet=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${fontCss}*{box-sizing:border-box}body{margin:0;padding:20px;width:1240px;background:#11272e;color:#eeeadd;font-family:'Noto Sans SC',sans-serif}h1{font-size:30px;margin:0 0 8px}p{font-size:17px;margin:0 0 18px;color:#bed1c3}.grid{display:grid;grid-template-columns:repeat(3,390px);gap:14px}.label{height:32px;background:#213a42;padding:5px 10px;font-size:16px}.viewport{width:390px;height:219.375px;position:relative;overflow:hidden;background:#0b141a}.world{position:absolute;width:1920px;height:1080px;transform:scale(.203125);transform-origin:0 0}</style><h1>五维复审 · 390像素宽静态合成</h1><p>包含实际场景、字幕、角标、雨层、调色与淡入；音频关闭。固定帧检查，未导出视频。</p><div class="grid">${shots.map(({time,html})=>`<section><div class="label">完整片 ${time.toFixed(2)}秒</div><div class="viewport"><div class="world">${html}</div></div></section>`).join('')}</div></html>`;
fs.writeFileSync(path.join(out,`mobile-${phase}.html`),sheet);
const layoutTimes=[26.7,30,35.7,39.5,42.5,45.5,49.4,54.6,61,65,68.5,83.5];
for(const time of layoutTimes) {
  const html=shots.find(s=>s.time===time)?.html??renderAt(time);
  fs.writeFileSync(path.join(out,`frame-${time}-${phase}.html`),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${fontCss}*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:'Noto Sans SC',sans-serif}.stage{position:relative;width:1920px;height:1080px}</style><div class="stage">${html}</div></html>`);
}
if(phase==='current') {
  const comparisons=[{time:30,label:'民事责任 · 原文字号'},{time:45.5,label:'补偿分支 · 条件与图解'},{time:65,label:'刑罚选择 · 名称、期限与或'},{time:83.5,label:'片尾 · 回答开头问题'}];
  if(comparisons.every(s=>fs.existsSync(path.join(out,`frame-${s.time}-before.html`)))) {
    fs.writeFileSync(path.join(out,'readability-compare.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>${fontCss}*{box-sizing:border-box}body{margin:0;padding:20px;width:840px;background:#11272e;color:#eeeadd;font-family:'Noto Sans SC',sans-serif}h1{font-size:28px;margin:0 0 8px}p{font-size:16px;margin:0 0 18px;color:#bed1c3}.pair{display:grid;grid-template-columns:390px 390px;gap:16px;margin-bottom:16px}.label{height:34px;padding:5px 8px;font-size:16px;background:#213a42}.viewport{width:390px;height:219.375px;overflow:hidden;position:relative}iframe{width:1920px;height:1080px;border:0;position:absolute;transform:scale(.203125);transform-origin:0 0}</style><h1>手机宽度 · 修改前后静态对照</h1><p>同为390像素宽；左：本轮修改前，右：当前。未导出视频。</p>${comparisons.map(s=>`<div class="pair">${['before','current'].map(p=>`<section><div class="label">${p==='before'?'修改前':'当前'} · ${s.label}</div><div class="viewport"><iframe src="frame-${s.time}-${p}.html"></iframe></div></section>`).join('')}</div>`).join('')}</html>`);
  }
  const layoutScript=`const times=${JSON.stringify(layoutTimes)};
  window.addEventListener('load',async()=>{
    const frames=[...document.querySelectorAll('iframe')];await Promise.all(frames.map(f=>f.contentDocument.fonts.ready));
    const failures=[],rows=[];const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    frames.forEach((f,i)=>{const d=f.contentDocument,time=times[i],q=d.querySelector('[data-law-part="quotation"]');const row={time};
      if(!d.fonts.check('56px "Noto Sans SC"')||!d.fonts.check('56px "Noto Serif SC"'))failures.push({time,reason:'local review fonts not ready'});
      const rect=n=>n.getBoundingClientRect();const textRect=n=>{const r=d.createRange();r.selectNodeContents(n);return r.getBoundingClientRect();};
      if(q){const text=q.querySelector('[data-law-part="quote-text"]'),cite=q.querySelector('[data-law-part="citation"]');
        const a=textRect(text),b=rect(cite),box=rect(q);row.quoteFont=parseFloat(f.contentWindow.getComputedStyle(text).fontSize);row.mobileQuoteFont=row.quoteFont*390/1920;row.citationGap=b.top-a.bottom;
        if(overlaps(a,b)||a.right>box.right-12||a.left<box.left||a.bottom>box.bottom)failures.push({time,reason:'quote/citation overlap or overflow'});
        if(d.querySelector('[data-story-part="subtitle"]'))failures.push({time,reason:'duplicate law captions'});
      }
      const condition=d.querySelector('[data-law-part="condition"]'),headline=d.querySelector('[data-law-part="headline"]');
      if(condition&&headline&&rect(condition).bottom>rect(headline).top-4)failures.push({time,reason:'condition collides with headline'});
      const branch=d.querySelector('[data-law-part="branch-summary"]');if(branch){const children=[...branch.children],box=rect(branch);for(const n of children){const a=rect(n);if(a.right>box.right+.5||a.bottom>box.bottom+.5)failures.push({time,reason:'branch summary overflows'});}for(let k=1;k<children.length;k++)if(overlaps(rect(children[k-1]),rect(children[k])))failures.push({time,reason:'branch content overlaps'});}
      const penalties=[...d.querySelectorAll('[data-penalty]')];if(penalties.length){row.penalties=penalties.map(p=>p.getAttribute('data-penalty'));if(penalties.length!==3||!penalties[0].textContent.includes('一年以下')||penalties.slice(1).some(p=>p.textContent.includes('一年以下'))||d.querySelectorAll('[data-law-part="alternative"]').length!==2)failures.push({time,reason:'penalty alternative or term association'});}
      const answer=d.querySelector('[data-story-part="closing-answer"]');if(answer){row.mobileAnswerFont=parseFloat(f.contentWindow.getComputedStyle(answer).fontSize)*390/1920;const a=textRect(answer);if(a.left<120||a.right>1800)failures.push({time,reason:'closing answer leaves safe area'});}
      rows.push(row);
    });document.getElementById('result').textContent=JSON.stringify({mode:'browser DOM with loaded local fonts',videoRendered:false,frames:rows.length,failures,rows});
  });`;
  fs.writeFileSync(path.join(out,'layout-check.html'),`<!doctype html><meta charset="utf-8"><pre id="result">pending</pre>${layoutTimes.map(time=>`<iframe style="position:absolute;left:-2400px;top:-2400px;width:1920px;height:1080px;border:0" src="frame-${time}-current.html"></iframe>`).join('')}<script>${layoutScript}</script>`);
}
fs.writeFileSync(path.join(out,`composition-${phase}.json`),JSON.stringify({mode:'React SSR with fixed nested frame contexts; silent audio',videoRendered:false,mobileWidth:390,times,overlays:['scene fades','subtitles','corner label','rain','grade','vignette']},null,2));
console.log(out);
