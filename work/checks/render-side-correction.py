"""Repair v22's same-side walking error by rendering only affected Film frames."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
FF=r'D:\dshws\tools\ffmpeg\bin\ffmpeg.exe'
PROBE=r'D:\dshws\tools\ffmpeg\bin\ffprobe.exe'
parser=argparse.ArgumentParser()
parser.add_argument('--output',required=True)
parser.add_argument('--resume-dir')
args=parser.parse_args()
output=(ROOT/args.output).resolve()
base=ROOT/'out/这一栋都要赔_二维动画_1080P60_v22.mp4'
if output.exists() or output.suffix.lower()!='.mp4' or not output.is_relative_to(ROOT/'out'):
    parser.error('Choose a new MP4 inside project out/.')
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if digest(base)!='cf3761cfa621ce32dc0f8e4a403b7c9cf61793ad5fb9f360bcd4bf2f1aa48879':
    raise RuntimeError('This correction is tied to the verified v22 baseline.')
stamp=datetime.now(timezone(timedelta(hours=8))).strftime('%Y%m%d-%H%M%S')
work=(ROOT/args.resume_dir).resolve() if args.resume_dir else ROOT/'work'/f'render-side-{stamp}'
if not work.is_relative_to(ROOT/'work'):
    parser.error('Resume files must remain inside project work/.')
if not args.resume_dir:work.mkdir()
def snapshot():
    files=list((ROOT/'src').rglob('*'))+list((ROOT/'public').rglob('*'))
    files += [p for p in (ROOT/'work/audio').glob('*') if p.suffix in ('.py','.cjs','.mjs')]
    files += [ROOT/p for p in ('remotion.config.ts','package.json','package-lock.json')]
    return {str(p.relative_to(ROOT)):digest(p) for p in sorted(files) if p.is_file()}
before=snapshot()
if args.resume_dir and json.loads((work/'source-sha256.json').read_text(encoding='utf-8'))!=before:
    raise RuntimeError('Cannot reuse fragments after source inputs changed.')
prior=json.loads((ROOT/'work/render-20261025-193017/source-sha256.json').read_text(encoding='utf-8'))
changed={p.replace('\\','/') for p in before.keys()|prior.keys() if before.get(p)!=prior.get(p)}
allowed={'src/characters/Rig.tsx','src/props/Bike.tsx','src/film/scenes/S01Street.tsx',
    'src/film/scenes/S02Reaction.tsx','src/film/scenes/S03Residents.tsx',
    'src/film/scenes/S04Evidence.tsx','src/film/scenes/Ending.tsx'}
if not changed.issubset(allowed):
    raise RuntimeError(f'Inputs outside the correction scope changed: {changed-allowed}')
(work/'source-sha256.json').write_text(json.dumps(before,indent=2),encoding='utf-8')
# Exclusive ends. Every actual Actor scene is replaced, including the CCTV thumbnail.
ranges=[(360,516),(672,954),(1158,1278),(3120,3570),(4218,4680)]
plan={'baseline':str(base),'baselineSha256':digest(base),'frames':5040,'fps':60,
    'changedInputs':sorted(changed),'renderRangesExclusive':ranges,
    'renderedFrames':sum(b-a for a,b in ranges),'audio':'Copy the existing verified AAC stream'}
(work/'patch-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
def run(command,log=None):
    subprocess.run([str(x) for x in command],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT if log else None,check=True)
print(f'Correction run: {work}',flush=True)
parts=[]
for i,(start,end) in enumerate(ranges):
    part=work/f'part-{i+1}.mp4';parts.append(part)
    print(f'Part {i+1}/{len(ranges)}: frames {start}-{end-1}, {end-start} frames',flush=True)
    if args.resume_dir and part.exists():
        print('Reusing verified fragment; no re-render.',flush=True)
    else:
        with (work/f'part-{i+1}.log').open('w',encoding='utf-8') as log:
            run(['node',ROOT/'node_modules/@remotion/cli/remotion-cli.js','render','src/index.ts',
                'Film',part,'--muted','--concurrency=4','--bundle-cache=false',f'--frames={start}-{end-1}'],log)
    probe=json.loads(subprocess.run([PROBE,'-v','error','-show_streams','-of','json',str(part)],
        capture_output=True,text=True,check=True).stdout)
    if int(probe['streams'][0]['nb_frames'])!=end-start:
        raise RuntimeError(f'Wrong frame count for {part}')
if snapshot()!=before:
    raise RuntimeError('Source changed during partial rendering.')
old_ranges=[(0,360),(516,672),(954,1158),(1278,3120),(3570,4218),(4680,5040)]
filters=['[0:v]split=6'+''.join(f'[o{i}]' for i in range(6))]
for i,(start,end) in enumerate(old_ranges):
    filters.append(f'[o{i}]trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS,setsar=1[v{i}]')
for i in range(5):
    filters.append(f'[{i+1}:v]setpts=PTS-STARTPTS,setsar=1[p{i}]')
order=''.join(f'[v{i}][p{i}]' for i in range(5))+'[v5]'
filters.append(order+'concat=n=11:v=1:a=0[v]')
(work/'concat-filter.txt').write_text(';'.join(filters),encoding='utf-8')
print('Assembling 84-second corrected film with unchanged audio.',flush=True)
cmd=[FF,'-hide_banner','-v','error','-n','-i',base]
for part in parts:cmd+=['-i',part]
cmd+=['-filter_complex',';'.join(filters),'-map','[v]','-map','0:a:0',
    '-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','60',
    '-fps_mode','cfr','-threads','4','-c:a','copy','-movflags','+faststart',output]
run(cmd)
run([sys.executable,'-B','work/audio/check_mp4.py',output,'--report',work/'mp4-report.json'])
plan.update(output=str(output),outputSha256=digest(output),sourceStable=True)
(work/'patch-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Verified corrected film: {output}',flush=True)
