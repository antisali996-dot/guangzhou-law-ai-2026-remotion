// Original score + sound effects for the film. No samples, no external assets:
// every sound here is synthesised from sine partials and seeded noise.
import {mkdirSync, writeFileSync} from 'node:fs';

const SR = 48000;
const OUT = 'public/audio';
mkdirSync(OUT, {recursive: true});

/* ------------------------------------------------------------------ utils */

let seed = 20261022;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const buf = (sec) => new Float32Array(Math.floor(sec * SR));
const add = (dst, i, v) => {
  if (i >= 0 && i < dst.length) dst[i] += v;
};

const sine = (t, f) => Math.sin(2 * Math.PI * f * t);
const tri = (t, f) => {
  const p = (t * f) % 1;
  return 4 * Math.abs(p - 0.5) - 1;
};

/** warm voice: fundamental + soft 2nd/3rd partials */
const voice = (t, f) => sine(t, f) + 0.34 * sine(t, f * 2) + 0.12 * sine(t, f * 3);

const env = (t, dur, a, d, s, r) => {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  return s * Math.max(0, (dur - t) / r);
};

const onePole = (cutoff) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  return (x) => {
    y = (1 - a) * x + a * y;
    return y;
  };
};

const writeWav = (name, L, R) => {
  const n = L.length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, L[i]));
    const r = Math.max(-1, Math.min(1, R[i]));
    data.writeInt16LE(Math.round(l * 32767), i * 4);
    data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(`${OUT}/${name}`, Buffer.concat([h, data]));
  console.log(name, (data.length / 1048576).toFixed(2), 'MB', (n / SR).toFixed(2), 's');
};

/* ------------------------------------------------------------------ score */

const TOTAL = 84;
const L = buf(TOTAL);
const R = buf(TOTAL);

// Am – F – C – G, twelve seconds each: quiet, steady, never triumphant.
const chords = [
  {t0: 0, root: 55.0, notes: [220.0, 261.63, 329.63]},
  {t0: 12, root: 43.65, notes: [174.61, 220.0, 261.63]},
  {t0: 24, root: 65.41, notes: [196.0, 261.63, 329.63]},
  {t0: 36, root: 49.0, notes: [196.0, 246.94, 293.66]},
  {t0: 48, root: 55.0, notes: [220.0, 261.63, 329.63]},
  {t0: 60, root: 43.65, notes: [174.61, 220.0, 261.63]},
  {t0: 72, root: 65.41, notes: [196.0, 261.63, 329.63]},
];

for (const c of chords) {
  const dur = Math.min(13.5, TOTAL - c.t0);
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    if (t < c.t0 || t > c.t0 + dur) continue;
    const lt = t - c.t0;
    const e = env(lt, dur, 1.6, 1.2, 0.78, 2.4);
    let l = 0;
    let r = 0;
    c.notes.forEach((f, k) => {
      const det = 1 + (k - 1) * 0.0016;
      const v = 0.032 * voice(lt + k * 0.013, f * det) * e;
      l += v * (0.85 - k * 0.12);
      r += v * (0.65 + k * 0.16);
    });
    // root support, very quiet
    const b = 0.036 * sine(lt, c.root) * e;
    L[i] += l + b;
    R[i] += r + b;
  }
}

// sparse pentatonic plucks, one every two bars, deterministic placement
const scaleNotes = [440.0, 493.88, 523.25, 587.33, 659.25, 783.99];
const beat = 2.0;
for (let t0 = 3.0; t0 < TOTAL - 4; t0 += beat * 2) {
  const idx = Math.floor(rnd() * scaleNotes.length);
  const f = scaleNotes[idx] / (rnd() > 0.65 ? 2 : 1);
  const dur = 1.6;
  const pan = 0.3 + rnd() * 0.4;
  const gain = 0.055 + rnd() * 0.03;
  for (let i = Math.floor(t0 * SR); i < Math.min(L.length, Math.floor((t0 + dur) * SR)); i++) {
    const lt = i / SR - t0;
    const e = env(lt, dur, 0.008, 0.35, 0.22, 0.9);
    const v = gain * (voice(lt, f) * 0.7 + sine(lt, f * 4.01) * 0.06) * e;
    L[i] += v * (1 - pan);
    R[i] += v * pan;
  }
}

// long soft room: two delays, no metallic ring
for (let i = 0; i < L.length; i++) {
  const d1 = Math.floor(0.137 * SR);
  const d2 = Math.floor(0.271 * SR);
  if (i > d1) L[i] += R[i - d1] * 0.16;
  if (i > d2) R[i] += L[i - d2] * 0.11;
}

// fades
for (let i = 0; i < L.length; i++) {
  const t = i / SR;
  const fin = Math.min(1, t / 2.4);
  const fout = Math.min(1, Math.max(0, (TOTAL - t) / 4.5));
  L[i] *= fin * fout;
  R[i] *= fin * fout;
}
writeWav('score.wav', L, R);

/* --------------------------------------------------------------- ambience */

const AL = buf(TOTAL);
const AR = buf(TOTAL);
const lpL = onePole(2600);
const lpR = onePole(2100);
for (let i = 0; i < AL.length; i++) {
  const t = i / SR;
  const swell = 0.72 + 0.28 * Math.sin(t * 0.23) * Math.sin(t * 0.07 + 1.1);
  AL[i] = lpL(rnd() * 2 - 1) * 0.055 * swell;
  AR[i] = lpR(rnd() * 2 - 1) * 0.05 * swell;
}
// occasional drips off the arcade
for (let k = 0; k < 26; k++) {
  const t0 = 2 + rnd() * (TOTAL - 6);
  const f = 900 + rnd() * 1400;
  for (let i = Math.floor(t0 * SR); i < Math.min(AL.length, Math.floor((t0 + 0.18) * SR)); i++) {
    const lt = i / SR - t0;
    const v = 0.05 * Math.exp(-lt * 34) * sine(lt, f);
    AL[i] += v * 0.7;
    AR[i] += v * 0.45;
  }
}
for (let i = 0; i < AL.length; i++) {
  const t = i / SR;
  const fin = Math.min(1, t / 3);
  const fout = Math.min(1, Math.max(0, (TOTAL - t) / 5));
  AL[i] *= fin * fout;
  AR[i] *= fin * fout;
}
writeWav('rain.wav', AL, AR);

/* -------------------------------------------------------------------- sfx */

const sfx = (name, dur, fill) => {
  const l = buf(dur);
  const r = buf(dur);
  fill(l, r, dur);
  writeWav(name, l, r);
};

// plastic cup hitting the wire basket: hard click + hollow body
sfx('sfx-impact.wav', 0.6, (l, r) => {
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const click = Math.exp(-t * 220) * (rnd() * 2 - 1) * 0.55;
    const body = Math.exp(-t * 26) * sine(t, 196) * 0.42;
    const ring = Math.exp(-t * 14) * sine(t, 740) * 0.12;
    const v = click + body + ring;
    l[i] += v;
    r[i] += v * 0.94;
  }
});

// tea splashing across wet pavement
sfx('sfx-splash.wav', 0.8, (l, r) => {
  let lp = onePole(5200);
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 9) * (1 - Math.exp(-t * 90));
    const n = lp(rnd() * 2 - 1) * e * 0.5;
    const fizz = Math.exp(-t * 18) * sine(t, 1600 + 900 * t) * 0.05;
    l[i] += n + fizz;
    r[i] += n * 0.9 + fizz * 1.1;
  }
});

// the cup settling on the ground
sfx('sfx-cupdrop.wav', 0.9, (l, r) => {
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const a = Math.exp(-t * 150) * (rnd() * 2 - 1) * 0.3;
    const b = Math.exp(-t * 22) * sine(t, 150) * 0.28;
    const roll = Math.exp(-t * 5) * sine(t, 430 + 60 * Math.sin(t * 40)) * 0.08;
    l[i] += a + b + roll;
    r[i] += (a + b + roll) * 0.92;
  }
});

// phone shutter
sfx('sfx-shutter.wav', 0.35, (l, r) => {
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const c1 = t < 0.006 ? (rnd() * 2 - 1) * 0.5 : 0;
    const c2 = t > 0.05 && t < 0.062 ? (rnd() * 2 - 1) * 0.34 : 0;
    const body = Math.exp(-t * 60) * sine(t, 1200) * 0.1;
    l[i] += c1 + c2 + body;
    r[i] += c1 + c2 + body;
  }
});

// bicycle wheel rolling on wet stone
sfx('sfx-wheel.wav', 2.4, (l, r) => {
  let lp = onePole(900);
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const e = Math.min(1, t / 0.15) * Math.min(1, (2.4 - t) / 0.4);
    const roll = lp(rnd() * 2 - 1) * 0.16 * e;
    const tick = Math.exp(-((t * 3.6) % 1) * 26) * 0.05 * e;
    l[i] += roll + tick;
    r[i] += roll * 0.95 + tick;
  }
});

// a step on wet pavement
sfx('sfx-step.wav', 0.4, (l, r) => {
  let lp = onePole(1500);
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const thud = Math.exp(-t * 55) * sine(t, 92) * 0.26;
    const scuff = lp(rnd() * 2 - 1) * Math.exp(-t * 42) * 0.1;
    l[i] += thud + scuff;
    r[i] += thud * 0.9 + scuff * 1.05;
  }
});

// papers being squared up
sfx('sfx-paper.wav', 0.7, (l, r) => {
  let lp = onePole(3800);
  for (let i = 0; i < l.length; i++) {
    const t = i / SR;
    const am = 0.5 + 0.5 * Math.sin(t * 47 + Math.sin(t * 13) * 3);
    const e = Math.min(1, t / 0.04) * Math.max(0, 1 - t / 0.7);
    const v = lp(rnd() * 2 - 1) * 0.22 * e * am;
    l[i] += v;
    r[i] += v * 0.9;
  }
});

console.log('done');
