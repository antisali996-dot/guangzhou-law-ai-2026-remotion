"""Validate an explicitly chosen final MP4, including its decoded narration."""
import argparse
import json
import re
import subprocess
import sys
from timeline_audio import ROOT, FF, PROBE, load_timeline, check_cues, pcm, subtract_templates

parser = argparse.ArgumentParser()
parser.add_argument('mp4', help='Final file to verify; never silently checks an old version')
parser.add_argument('--report')
args = parser.parse_args()
path = (ROOT / args.mp4).resolve()
timeline = load_timeline()
probe = json.loads(subprocess.run([PROBE, '-v', 'error', '-show_streams', '-show_format',
                                   '-of', 'json', str(path)], capture_output=True, text=True, encoding="utf-8", errors="replace", check=True).stdout)
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
checks = {
    'video': video['codec_name'] == 'h264' and video['width'] == 1920 and video['height'] == 1080,
    'frames': int(video['nb_frames']) == timeline['totalFrames'],
    'fps': video['r_frame_rate'] == f"{timeline['fps']}/1",
    'duration': abs(float(video['duration']) - timeline['duration']) < 1 / timeline['fps'],
    'audio': audio['codec_name'] == 'aac' and audio['sample_rate'] == '48000' and audio['channels'] == 2,
}
decode = subprocess.run([FF, '-hide_banner', '-nostats', '-xerror', '-i', str(path),
    '-map', '0:v:0', '-map', '0:a:0', '-vf', 'blackdetect=d=0.25:pix_th=0.10',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
    capture_output=True, text=True, encoding="utf-8", errors="replace")
checks['decode'] = decode.returncode == 0
checks['black_frames'] = 'black_start:' not in decode.stderr
match = re.search(r'\{[^{}]*"input_i"[^{}]*\}', decode.stderr, re.S)
loudness = json.loads(match.group(0)) if match else {}
checks['loudness'] = bool(loudness) and abs(float(loudness['input_i']) + 16) <= 0.3 and float(loudness['input_tp']) <= -1.0
mix = pcm(path)
rows = check_cues(None, timeline['voices'], timeline['fps'], min_confidence=0.25, mix=mix)
checks['narration'] = all(row['ok'] for row in rows)
residual = subtract_templates(mix, [(v['start'], pcm(ROOT / 'public' / v['file'])) for v in timeline['voices']])
residual = subtract_templates(residual, [(0, pcm(ROOT / 'public/audio/score.wav'))])
effects = check_cues(None, timeline['effects'], timeline['fps'], min_confidence=0.25, mix=residual)
checks['effects'] = all(row['ok'] for row in effects)
report = dict(file=str(path), checks=checks, narration=rows, effects=effects, loudness=loudness, probe=probe)
if args.report:
    (ROOT / args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(checks, ensure_ascii=False))
sys.exit(0 if all(checks.values()) else 1)
