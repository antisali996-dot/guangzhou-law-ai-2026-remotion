"""Shared source timeline and confidence-aware waveform matching. No output on import."""
import json
from pathlib import Path
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
FF = r'D:\dshws\tools\ffmpeg\bin\ffmpeg.exe'
PROBE = r'D:\dshws\tools\ffmpeg\bin\ffprobe.exe'
RATE = 12000


def load_timeline():
    result = subprocess.run(['node', str(Path(__file__).with_name('export-timeline.cjs'))],
                            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
    return json.loads(result.stdout)


def pcm(path):
    result = subprocess.run([FF, '-v', 'error', '-i', str(path), '-ac', '1', '-ar',
                             str(RATE), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(result.stdout, np.float32).astype(float)


def measure(mix, source, expected):
    source = source[:int(2.5 * RATE)]
    left = max(0, round((expected - 0.15) * RATE))
    right = min(len(mix), round((expected + 0.15) * RATE) + len(source))
    span = mix[left:right]
    if not len(source) or len(span) < len(source):
        return None, 0.0
    n, m = len(span), len(source)
    size = 1 << (n + m - 2).bit_length()
    dot = np.fft.irfft(np.fft.rfft(span, size) * np.conj(np.fft.rfft(source, size)), size)[:n-m+1]
    energy = np.r_[0.0, np.cumsum(span * span)]
    denominator = np.sqrt(np.maximum(1e-20, (energy[m:] - energy[:-m]) * np.sum(source * source)))
    confidence = dot / denominator
    index = int(np.argmax(confidence))
    return (left + index) / RATE, float(confidence[index])


def subtract_templates(mix, templates):
    """Remove identified narration from a real mix before locating quiet effects."""
    residual = mix.copy()
    for start, source in templates:
        first = round(start * RATE)
        source = source[:max(0, min(len(source), len(mix) - first))]
        energy = float(np.dot(source, source))
        if not len(source) or energy < 1e-20:
            continue
        gain = np.dot(mix[first:first + len(source)], source) / energy
        residual[first:first + len(source)] -= source * gain
    return residual


def check_cues(path, cues, fps, min_confidence=0.25, mix=None):
    if mix is None:
        mix = pcm(path)
    rows = []
    for cue in cues:
        found, confidence = measure(mix, pcm(ROOT / 'public' / cue['file']), cue['start'])
        delta = None if found is None else found - cue['start']
        ok = delta is not None and abs(delta) <= 1 / fps and confidence >= min_confidence
        rows.append(dict(id=cue['id'], expected=cue['start'], found=found,
                         offset_ms=None if delta is None else delta * 1000,
                         confidence=confidence, ok=ok))
        print(f"{cue['id']:22s} start={found} confidence={confidence:.3f} {'ok' if ok else 'FAIL'}")
    return rows
