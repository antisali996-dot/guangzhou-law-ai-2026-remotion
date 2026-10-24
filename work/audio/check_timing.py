"""Check EVERY current narration/effect cue in the score-free mix."""
import argparse
import json
import sys
from timeline_audio import ROOT, load_timeline, check_cues, pcm, subtract_templates

parser = argparse.ArgumentParser()
parser.add_argument('--mix', default='work/mix-stems.wav')
parser.add_argument('--report')
args = parser.parse_args()
timeline = load_timeline()
mix = pcm(ROOT / args.mix)
rows = check_cues(None, timeline['voices'], timeline['fps'], mix=mix)
residual = subtract_templates(mix, [(v['start'], pcm(ROOT / 'public' / v['file'])) for v in timeline['voices']])
rows += check_cues(None, timeline['effects'], timeline['fps'], min_confidence=0.35, mix=residual)
if args.report:
    (ROOT / args.report).write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
bad = sum(not row['ok'] for row in rows)
print(f'Timing: {len(rows)-bad}/{len(rows)} within one frame with identifiable signal')
sys.exit(1 if bad else 0)
