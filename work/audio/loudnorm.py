"""Two-pass EBU R128 normalization with identical targets in both passes."""
import argparse
import json
import re
import subprocess
from timeline_audio import ROOT, FF

parser = argparse.ArgumentParser()
parser.add_argument('--source', default='work/mix-raw.wav')
parser.add_argument('--output', default='work/mix-final.wav')
parser.add_argument('--report')
args = parser.parse_args()
target = 'loudnorm=I=-16:TP=-1.5:LRA=11'
probe = subprocess.run([FF, '-hide_banner', '-nostats', '-i', str(ROOT / args.source),
                        '-af', target + ':print_format=json', '-f', 'null', '-'], capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
data = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', probe.stderr, re.S).group(0))
chain = (target + ':linear=true' + f":measured_I={data['input_i']}:measured_TP={data['input_tp']}"
         + f":measured_LRA={data['input_lra']}:measured_thresh={data['input_thresh']}"
         + f":offset={data['target_offset']}:print_format=json")
result = subprocess.run([FF, '-hide_banner', '-nostats', '-y', '-i', str(ROOT / args.source),
                         '-af', chain, '-ar', '48000', '-ac', '2', str(ROOT / args.output)],
                        capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
output = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', result.stderr, re.S).group(0))
if args.report:
    (ROOT / args.report).write_text(json.dumps(dict(first_pass=data, second_pass=output), indent=2), encoding='utf-8')
print('Normalized:', args.output, 'LUFS:', output['output_i'], 'dBTP:', output['output_tp'])
