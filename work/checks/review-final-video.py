"""Decode a chosen movie for visual QA; never substitutes source-generated stills."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
FF = r'D:\dshws\tools\ffmpeg\bin\ffmpeg.exe'
parser = argparse.ArgumentParser()
parser.add_argument('video')
parser.add_argument('--output-dir', required=True)
parser.add_argument('--previous')
parser.add_argument('--compare-times', type=float, nargs='+', default=[6.4,13.1,65,83.5])
parser.add_argument('--check-reused-scenes', action='store_true')
args = parser.parse_args()
VIDEO = (ROOT / args.video).resolve()
QA = (ROOT / args.output_dir).resolve()
if not QA.is_relative_to(ROOT / 'work'):
    parser.error('Review files must remain inside project work/.')
QA.mkdir(parents=True, exist_ok=True)


def frame(time, video=VIDEO):
    result = subprocess.run([FF, '-v', 'error', '-ss', str(time), '-i', str(video),
        '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
        capture_output=True, check=True)
    return Image.open(io.BytesIO(result.stdout)).convert('RGB')


def sheet(name, times, crop=None, width=480, cols=4):
    height = round(width * ((crop[3]-crop[1])/(crop[2]-crop[0]) if crop else 9/16))
    canvas = Image.new('RGB', (width*cols, (height+24)*((len(times)+cols-1)//cols)), '#172026')
    draw = ImageDraw.Draw(canvas)
    for i, time in enumerate(times):
        im = frame(time)
        if crop:
            im = im.crop(crop)
        im.thumbnail((width, height))
        x, y = i % cols * width, i // cols * (height+24)
        canvas.paste(im, (x, y))
        draw.text((x+8, y+height+4), f'{time:.3f}s', fill='white')
    canvas.save(QA/name, quality=94)


sheet('overview.jpg', [3, 6.4, 7.15, 8.3, 9.4, 10.7667, 11.6, 13.1,
    15.3, 17, 20.6, 22.6, 26.7, 30, 39.5, 45.5, 49.4, 54.6, 61, 65, 68.5, 71.3, 77.9, 83.5])
sheet('gait.jpg', [6.15, 6.4, 6.65, 6.9, 7.15, 7.4, 7.7, 8.3])
sheet('face.jpg', [12.3, 12.6, 13.1, 13.4, 13.65, 13.7, 14.1, 14.5],
      crop=(820, 155, 1240, 490), width=350)
sheet('law.jpg', [26.7, 30, 35.7, 39.5, 42.5, 45.5, 49.4, 61, 65, 68.5])
sheet('phone.jpg', [19.3, 19.6, 19.9, 20.3, 20.7, 21.2, 21.8, 22.2, 70.6, 71.3, 72, 73])
sheet('ending.jpg', [73.7, 74.3, 75, 75.5, 76, 76.5, 77, 77.9, 78.5, 79.5, 81, 83.5])
sheet('subtitle-boundary.jpg', [477/60, 478/60, 479/60, 480/60])
sheet('cctv.jpg', [54.9, 55.2, 55.6, 55.9, 56.1, 56.4, 56.7, 56.9],
      crop=(360, 160, 1550, 913))

# A dense sequence over actual step/stop transitions, rather than a single chosen pose.
sheet('gait-sequence.jpg', [6+i/12 for i in range(30)], width=384, cols=6)

# Track the visible shirt in the actual decoded departure frames.
positions = []
for time in [75, 75.5, 76, 76.5, 77, 77.4, 77.9]:
    im = frame(time).resize((960, 540))
    region = np.asarray(im, dtype=float)[170:330, 250:950]
    mask = ((region[:, :, 0] > 110) & (region[:, :, 0] > 1.7*region[:, :, 1])
            & (region[:, :, 0] > 1.9*region[:, :, 2]))
    yy, xx = np.nonzero(mask)
    if len(xx) < 1000:
        raise RuntimeError(f'Shirt cannot be reliably identified at {time}s')
    positions.append(dict(time=time, pixels=len(xx), centroid_x_half_size=float(xx.mean()+250)))
xs = [p['centroid_x_half_size'] for p in positions]
if not all(b>a+10 for a,b in zip(xs,xs[1:])) or xs[-1]-xs[-2]<=45:
    raise RuntimeError(f'Departure did not visibly continue: {positions}')

if args.previous:
    previous = (ROOT/args.previous).resolve()
    canvas = Image.new('RGB', (1440, len(args.compare_times)*429), '#14282E')
    draw = ImageDraw.Draw(canvas)
    for row,time in enumerate(args.compare_times):
        for col,video in enumerate([previous,VIDEO]):
            canvas.paste(frame(time,video).resize((720,405)), (col*720,row*429))
            draw.text((col*720+12,row*429+409), f'{"Previous" if col==0 else "Current"} | {time:.1f}s', fill='white')
    canvas.save(QA/'comparison.jpg',quality=95)

report = dict(video=str(VIDEO), bytes=VIDEO.stat().st_size,
    sha256=hashlib.sha256(VIDEO.read_bytes()).hexdigest(),
    evidence='Frames decoded from the explicitly selected final MP4',
    visible_departure=positions, last_half_second_displacement_full_pixels=(xs[-1]-xs[-2])*2,
    subjective_audio_audition=False)
if args.check_reused_scenes:
    if not args.previous:
        raise RuntimeError('Reused-scene verification needs the previous film.')
    errors=[]
    for time in [3,9.4,17,23.2,27.5,45.5,65,83.5]:
        old=np.asarray(frame(time,previous).resize((960,540)),dtype=float)
        new=np.asarray(frame(time).resize((960,540)),dtype=float)
        delta=float(np.abs(old-new).mean())
        if delta>2.5:
            raise RuntimeError(f'Reused scene changed unexpectedly at {time}s: {delta}')
        errors.append(dict(time=time,mean_pixel_difference=delta))
    def audio_hash(video):
        result=subprocess.run([FF,'-v','error','-i',str(video),'-map','0:a:0','-c','copy',
            '-f','hash','-hash','sha256','-'],capture_output=True,text=True,check=True)
        return result.stdout.strip()
    old_audio=audio_hash(previous);new_audio=audio_hash(VIDEO)
    if old_audio!=new_audio:
        raise RuntimeError('Reused compressed audio packets differ from the baseline.')
    report.update(reused_scenes=errors,audio_packets_unchanged=True,audio_packet_hash=new_audio)
(QA/'visual-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
