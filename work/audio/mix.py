"""Rebuild preview-equivalent tracks from the evaluated Remotion timeline."""
import argparse
import json
from pathlib import Path
import subprocess
from timeline_audio import ROOT, FF, load_timeline

parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', default='work')
args = parser.parse_args()
out = (ROOT / args.output_dir).resolve()
out.mkdir(parents=True, exist_ok=True)
timeline = load_timeline()
cues = timeline['voices'] + timeline['effects']
score = dict(file='audio/score.wav', start=0, duration=timeline['duration'], gain=timeline['scoreGain'])

def render(items, destination):
    command = [FF, '-hide_banner', '-v', 'error', '-y']
    for cue in items:
        command += ['-i', str(ROOT / 'public' / cue['file'])]
    graph = []
    for i, cue in enumerate(items):
        delay = round(cue['start'] * 1000)
        graph.append(f"[{i}:a]atrim=duration={cue['duration']},asetpts=PTS-STARTPTS,volume={cue['gain']},adelay={delay}:all=1,apad=whole_dur={timeline['duration']}[a{i}]")
    graph.append(''.join(f'[a{i}]' for i in range(len(items))) +
                 f"amix=inputs={len(items)}:normalize=0,atrim=duration={timeline['duration']}[mix]")
    command += ['-filter_complex', ';'.join(graph), '-map', '[mix]', '-ar', '48000',
                '-ac', '2', '-c:a', 'pcm_f32le', str(destination)]
    subprocess.run(command, check=True)

render([score] + cues, out / 'mix-raw.wav')
render(cues, out / 'mix-stems.wav')
(out / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Mixed {len(timeline['voices'])} voices + {len(timeline['effects'])} effects; score={timeline['scoreGain']}; {timeline['duration']}s")
