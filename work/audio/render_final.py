"""Repeatable render -> mix -> normalize -> mux -> verify. Preserve old exports."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from timeline_audio import ROOT, FF

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True, help='New MP4 path, for example out/film_v14.mp4')
parser.add_argument('--concurrency', type=int, default=4)
args = parser.parse_args()
output = (ROOT / args.output).resolve()
if output.exists() or output.suffix.lower() != '.mp4':
    parser.error('Choose a new .mp4 output path; existing files are preserved.')
stamp = datetime.now(timezone(timedelta(hours=8))).strftime('%Y%m%d-%H%M%S')
work = ROOT / 'work' / f'render-{stamp}'
work.mkdir()
output.parent.mkdir(parents=True, exist_ok=True)


def run(*command):
    subprocess.run([str(x) for x in command], cwd=ROOT, check=True)


def snapshot():
    files = sorted((ROOT / 'src').rglob('*')) + sorted((ROOT / 'public').rglob('*'))
    files += [p for p in (ROOT / 'work/audio').glob('*') if p.suffix in ('.py', '.cjs', '.mjs')]
    files += [ROOT / name for name in ('remotion.config.ts', 'package.json', 'package-lock.json')]
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in files if p.is_file()}


before = snapshot()
(work / 'source-sha256.json').write_text(json.dumps(before, indent=2), encoding='utf-8')
run('node', ROOT / 'node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false')
run('node', '--test', 'work/checks/animation.cjs')
run(sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'work/checks', '-p', 'test_audio.py')
run(sys.executable, '-B', 'work/audio/mix.py', '--output-dir', work)
run(sys.executable, '-B', 'work/audio/check_timing.py', '--mix', work / 'mix-stems.wav', '--report', work / 'timing-report.json')
run(sys.executable, '-B', 'work/audio/loudnorm.py', '--source', work / 'mix-raw.wav', '--output', work / 'mix-final.wav', '--report', work / 'loudness-report.json')
print('Rendering full-resolution video. Progress:', work / 'render.log', flush=True)
with (work / 'render.log').open('w', encoding='utf-8') as log:
    subprocess.run(['node', str(ROOT / 'node_modules/@remotion/cli/remotion-cli.js'),
        'render', 'src/index.ts', 'Film', str(work / 'video.mp4'), '--muted',
        f'--concurrency={args.concurrency}', '--bundle-cache=false'],
        cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, check=True)
if snapshot() != before:
    raise RuntimeError('Source changed during rendering; preserve this run and render again.')
run(FF, '-hide_banner', '-v', 'error', '-n', '-i', work / 'video.mp4', '-i', work / 'mix-final.wav',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
    '-movflags', '+faststart', output)
run(sys.executable, '-B', 'work/audio/check_mp4.py', output, '--report', work / 'mp4-report.json')
print('Verified final video:', output, flush=True)
