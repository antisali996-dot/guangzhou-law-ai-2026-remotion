// Local evidence for the original subtitle overlap; does not render any media.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const {execFileSync}=require('node:child_process');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'../..'),out=path.join(root,'work/preflight-20261025-five');fs.mkdirSync(out,{recursive:true});
const {SUB_CUES,subtitleCueAtFrame}=require('../../src/film/ui.tsx'),{f}=require('../../src/film/timeline.ts');
const filename=path.join(root,'src/film/ui.tsx'),old=new Module(filename,module);old.filename=filename;old.paths=module.paths;
const source=execFileSync('git',['show','6fa1485:src/film/ui.tsx'],{cwd:root,encoding:'utf8'}).replace('const cueAt =','export const cueAt =');
old._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
const examples=[];
for(let i=1;i<SUB_CUES.length;i++)if(f(SUB_CUES[i-1].t1)===f(SUB_CUES[i].t0)){
  const frame=f(SUB_CUES[i].t0),expected=SUB_CUES[i].text,prior=old.exports.cueAt(frame/60)?.text,current=subtitleCueAtFrame(frame)?.text;
  if(prior!==expected)examples.push({frame,seconds:frame/60,expected,prior,current,corrected:current===expected});
}
fs.writeFileSync(path.join(out,'subtitle-boundaries.json'),JSON.stringify({baseline:'6fa1485',videoRendered:false,examples},null,2));
if(!examples.length||examples.some(e=>!e.corrected))throw new Error('Boundary evidence missing or correction failed');
console.log(JSON.stringify({reproducedBoundaries:examples.length,example:examples[0]}));
