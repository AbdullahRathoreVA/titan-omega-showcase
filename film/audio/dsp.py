"""TITAN OMEGA — synthesis / DSP toolkit (numpy + scipy)."""
import numpy as np
from scipy import signal

SR = 48000

# ---------------------------------------------------------------- utilities
def sec(n):
    return int(round(n * SR))

def buf(dur):
    return np.zeros(sec(dur), dtype=np.float64)

def add(dst, src, at, gain=1.0):
    i = sec(at)
    if i < 0:
        src = src[-i:]; i = 0
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n] * gain
    return dst

def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = max(1, int(a * sr)), max(1, int(d * sr)), max(1, int(r * sr))
    sus = max(0, n - a - d - r)
    e = np.concatenate([
        np.linspace(0, 1, a, endpoint=False),
        np.linspace(1, s, d, endpoint=False),
        np.full(sus, s),
        np.linspace(s, 0, r),
    ])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))

def env_exp(n, attack=0.004, decay=0.4, curve=4.0, sr=SR):
    a = max(1, int(attack * sr))
    t = np.arange(n) / sr
    e = np.exp(-curve * np.maximum(0, t - attack) / max(1e-6, decay))
    e[:a] *= np.linspace(0, 1, a)
    return e

def lp(x, cutoff, order=4):
    cutoff = float(np.clip(cutoff, 20, SR / 2 - 200))
    b, a = signal.butter(order, cutoff / (SR / 2), 'low')
    return signal.filtfilt(b, a, x) if len(x) > 3 * order else x

def hp(x, cutoff, order=4):
    cutoff = float(np.clip(cutoff, 10, SR / 2 - 200))
    b, a = signal.butter(order, cutoff / (SR / 2), 'high')
    return signal.filtfilt(b, a, x) if len(x) > 3 * order else x

def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [max(20, lo) / (SR / 2), min(SR / 2 - 200, hi) / (SR / 2)], 'band')
    return signal.filtfilt(b, a, x) if len(x) > 3 * order else x

def peaking(x, f0, gain_db, Q=1.0):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * Q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return signal.lfilter(b, a, x)

def shelf_high(x, f0, gain_db, S=0.7):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    c = np.cos(w0); sq = 2 * np.sqrt(A) * alpha
    b = [A * ((A + 1) + (A - 1) * c + sq),
         -2 * A * ((A - 1) + (A + 1) * c),
         A * ((A + 1) + (A - 1) * c - sq)]
    a = [(A + 1) - (A - 1) * c + sq,
         2 * ((A - 1) - (A + 1) * c),
         (A + 1) - (A - 1) * c - sq]
    return signal.lfilter(b, a, x)

def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive) if drive > 0 else x

def rng(seed):
    return np.random.default_rng(seed)

# ---------------------------------------------------------------- oscillators
def note_hz(name):
    """'A2' -> Hz"""
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6,
             'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    i = 1 if name[1] in '#' else 1
    pitch = name[:-1]
    octave = int(name[-1])
    return 440.0 * 2 ** ((names[pitch] + (octave - 4) * 12 - 9) / 12)

def osc_saw(f, n, detune=0.0, voices=1, phase=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for v in range(voices):
        d = 1.0 + (v - (voices - 1) / 2) * detune
        # band-limited-ish saw via additive partials
        y = np.zeros(n)
        k = 1
        while f * d * k < SR / 2.2 and k <= 28:
            y += np.sin(2 * np.pi * f * d * k * t + phase * k) / k
            k += 1
        out += y
    return out / max(1, voices) * 0.6

def osc_sine(f, n, phase=0.0, fm=None):
    t = np.arange(n) / SR
    if fm is None:
        return np.sin(2 * np.pi * f * t + phase)
    return np.sin(2 * np.pi * f * t + phase + fm)

def osc_tri(f, n):
    t = np.arange(n) / SR
    y = np.zeros(n)
    k = 1
    while f * k < SR / 2.2 and k <= 21:
        if k % 2 == 1:
            y += ((-1) ** ((k - 1) // 2)) * np.sin(2 * np.pi * f * k * t) / (k * k)
        k += 1
    return y * 0.8

def noise(n, seed=0):
    return rng(seed).standard_normal(n)

# ---------------------------------------------------------------- instruments
def piano(f, dur, vel=1.0, seed=0):
    """additive piano-ish tone with inharmonicity + hammer noise"""
    n = sec(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    B = 0.0004
    for k in range(1, 15):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > SR / 2.2:
            break
        amp = (1.0 / (k ** 1.35)) * (1.0 + 0.25 * np.sin(k * 2.3 + seed))
        decay = 2.4 + 5.5 / k
        y += amp * np.sin(2 * np.pi * fk * t + (k * 0.7)) * np.exp(-t * decay * 0.55)
    y /= np.max(np.abs(y)) + 1e-9
    # hammer transient
    hm = lp(noise(min(n, sec(0.02)), seed + 7), 4200) * np.linspace(1, 0, min(n, sec(0.02))) ** 2
    y[:len(hm)] += hm * 0.16
    y *= env_exp(n, 0.002, dur * 0.9, 2.2)
    return y * vel * 0.9

def strings(f, dur, vel=1.0, seed=0, detune=0.006):
    n = sec(dur)
    y = osc_saw(f, n, detune=detune, voices=5)
    y = lp(y, 3200)
    # bow noise + vibrato shimmer
    t = np.arange(n) / SR
    vib = 1 + 0.0016 * np.sin(2 * np.pi * 5.2 * t)
    y *= vib
    y *= env_adsr(n, min(0.28, dur * 0.4), 0.25, 0.75, min(0.5, dur * 0.5))
    return y * vel * 0.5

def brass(f, dur, vel=1.0, seed=0):
    n = sec(dur)
    y = osc_saw(f, n, detune=0.004, voices=3)
    y = soft_clip(y * 1.7, 1.6)
    y = bp(y, f * 0.8, min(SR / 2.4, f * 9))
    y = peaking(y, 900, 4.0, 1.1)
    e = env_adsr(n, 0.05, 0.12, 0.8, min(0.35, dur * 0.4))
    return y * e * vel * 0.42

def choir(f, dur, vel=1.0, seed=0):
    n = sec(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k, amp in [(1, 1.0), (2, 0.45), (3, 0.28), (4, 0.16), (5, 0.09), (6, 0.05)]:
        vib = 0.004 * np.sin(2 * np.pi * (4.6 + k * 0.3) * t + k)
        y += amp * np.sin(2 * np.pi * f * k * t * (1 + vib) + k * 1.7)
    # formant colouring (ah)
    y = peaking(y, 730, 7, 2.2)
    y = peaking(y, 1090, 5, 2.4)
    y = lp(y, 5200)
    y *= env_adsr(n, dur * 0.35, dur * 0.2, 0.85, dur * 0.42)
    return y / (np.max(np.abs(y)) + 1e-9) * vel * 0.5

def sub(f, dur, vel=1.0, drop=0.0):
    n = sec(dur)
    t = np.arange(n) / SR
    freq = f * (1 + drop * np.exp(-t * 9))
    ph = 2 * np.pi * np.cumsum(freq) / SR
    y = np.sin(ph) * env_exp(n, 0.003, dur * 0.7, 2.6)
    return y * vel

def kick(dur=0.7, f0=95, f1=42, vel=1.0, seed=1):
    n = sec(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 26)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.001, dur * 0.42, 3.4)
    click = hp(noise(sec(0.006), seed), 1800) * np.linspace(1, 0, sec(0.006)) ** 2
    y[:len(click)] += click * 0.35
    return y * vel

def taiko(dur=1.1, vel=1.0, seed=3):
    n = sec(dur)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (78 * np.exp(-t * 3.0) + 54) * t) * env_exp(n, 0.002, 0.34, 3.0)
    skin = lp(noise(n, seed), 900) * env_exp(n, 0.001, 0.10, 6.0)
    y = body * 0.9 + skin * 0.55
    return y * vel

def braam(dur=2.6, root=55.0, vel=1.0, seed=5):
    n = sec(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for mult, amp, det in [(1, 1.0, 0.0), (2, 0.7, 0.004), (3, 0.45, -0.003),
                           (4, 0.3, 0.006), (6, 0.16, -0.005), (8, 0.09, 0.008)]:
        f = root * mult * (1 + det)
        sweep = 1 + 0.03 * np.exp(-t * 2.2)
        y += amp * np.sin(2 * np.pi * f * sweep * t + mult)
    y = soft_clip(y * 0.9, 2.2)
    y = lp(y, 3400)
    y *= env_adsr(n, 0.12, 0.5, 0.55, dur * 0.55)
    return y / (np.max(np.abs(y)) + 1e-9) * vel

def whoosh(dur=0.9, vel=1.0, seed=11, up=True):
    n = sec(dur)
    x = noise(n, seed)
    t = np.linspace(0, 1, n)
    out = np.zeros(n)
    # time-varying bandpass via chunked filtering
    chunks = 24
    idx = np.linspace(0, n, chunks + 1).astype(int)
    for c in range(chunks):
        a, b = idx[c], idx[c + 1]
        p = c / (chunks - 1)
        f = 260 * (14 ** (p if up else 1 - p))
        seg = bp(x[max(0, a - 512):b], f * 0.6, min(SR / 2.3, f * 1.9), order=2)
        seg = seg[-(b - a):]
        out[a:b] = seg
    shape = np.sin(np.pi * t) ** 1.4
    return out * shape * vel * 0.9

def riser(dur=3.0, vel=1.0, seed=13):
    n = sec(dur)
    t = np.linspace(0, 1, n)
    f = 180 * (10 ** (t * 1.35))
    y = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR, 0.35) * 0.4
    nz = bp(noise(n, seed), 800, 9000, 2) * 0.5
    y = (y + nz) * (t ** 2.2)
    return y * vel

def ping(f=1200, dur=0.5, vel=1.0):
    n = sec(dur)
    y = osc_sine(f, n) * env_exp(n, 0.001, 0.10, 5.5)
    y += osc_sine(f * 2.01, n) * env_exp(n, 0.001, 0.05, 8) * 0.35
    return y * vel * 0.5

def keyclick(vel=1.0, seed=21):
    n = sec(0.09)
    nz = noise(n, seed)
    body = bp(nz, 900, 6500, 2) * env_exp(n, 0.0004, 0.020, 9)
    tick = hp(nz, 4200) * env_exp(n, 0.0002, 0.006, 16) * 0.8
    thock = osc_sine(150, n) * env_exp(n, 0.001, 0.035, 8) * 0.5
    y = body * 0.9 + tick + thock
    y = peaking(y, 3000, 5, 1.2)
    return y / (np.max(np.abs(y)) + 1e-9) * vel

def rain(dur, vel=1.0, seed=31):
    n = sec(dur)
    x = noise(n, seed)
    y = bp(x, 700, 9000, 2) * 0.6 + lp(x, 400) * 0.25
    # droplet transients
    r = rng(seed + 1)
    for _ in range(int(dur * 26)):
        i = int(r.random() * (n - 2000))
        d = sec(0.012)
        y[i:i + d] += hp(noise(d, int(r.random() * 1e6)), 2600) * np.linspace(1, 0, d) ** 2 * 0.5
    return y * vel * 0.28

def hum(dur, f=60.0, vel=1.0):
    n = sec(dur)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t + 1) + 0.12 * np.sin(2 * np.pi * f * 3 * t)
    y += lp(noise(n, 77), 180) * 0.5
    return y * vel * 0.1

def chatter(dur, vel=1.0, seed=41):
    """data-transfer texture: pitched blips"""
    n = sec(dur)
    out = np.zeros(n)
    r = rng(seed)
    t_ = 0.0
    while t_ < dur:
        f = 700 + r.random() * 2600
        d = 0.02 + r.random() * 0.05
        seg = osc_sine(f, sec(d)) * env_exp(sec(d), 0.001, d * 0.5, 6)
        i = sec(t_)
        m = min(len(seg), n - i)
        if m > 0:
            out[i:i + m] += seg[:m] * (0.25 + r.random() * 0.5)
        t_ += 0.03 + r.random() * 0.09
    return lp(out, 6000) * vel * 0.16

def mech(dur, vel=1.0, seed=51):
    """rapid mechanical assembly texture"""
    n = sec(dur)
    out = np.zeros(n)
    r = rng(seed)
    t_ = 0.0
    while t_ < dur:
        d = 0.03
        seg = keyclick(0.6 + r.random() * 0.4, seed=int(r.random() * 1e6))
        seg = seg * np.linspace(1, 0.2, len(seg))
        i = sec(t_)
        m = min(len(seg), n - i)
        if m > 0:
            out[i:i + m] += seg[:m]
        t_ += 0.018 + r.random() * 0.035
    return out * vel * 0.5

# ---------------------------------------------------------------- reverb
def make_ir(dur=2.2, seed=99, damp=5200, pre=0.012):
    n = sec(dur)
    x = noise(n, seed) * np.exp(-np.linspace(0, 1, n) * 5.2)
    x = lp(x, damp)
    x[:sec(pre)] *= np.linspace(0, 1, sec(pre)) ** 3
    # a few early reflections
    for d, g in [(0.011, 0.5), (0.019, 0.38), (0.031, 0.3), (0.047, 0.22)]:
        i = sec(d)
        x[i:i + 400] += np.linspace(g, 0, 400)
    return x / (np.max(np.abs(x)) + 1e-9)

def convolve(x, ir, wet=0.3):
    y = signal.fftconvolve(x, ir)[:len(x)]
    y /= (np.max(np.abs(y)) + 1e-9)
    return x * (1 - wet) + y * np.max(np.abs(x)) * wet

# ---------------------------------------------------------------- dynamics
def compress(x, thresh_db=-18, ratio=4.0, attack=0.005, release=0.12, makeup_db=0.0):
    eps = 1e-9
    env = np.abs(x)
    # smooth envelope
    a = np.exp(-1 / (attack * SR)); r = np.exp(-1 / (release * SR))
    e = np.zeros_like(env)
    prev = 0.0
    # vectorised-ish two-pass approximation
    e = signal.lfilter([1 - r], [1, -r], env)
    g_db = np.zeros_like(e)
    lvl = 20 * np.log10(e + eps)
    over = lvl - thresh_db
    g_db = np.where(over > 0, -over * (1 - 1 / ratio), 0.0)
    g = 10 ** ((g_db + makeup_db) / 20)
    return x * g

def duck(x, key, amount=0.72, attack=0.02, release=0.28):
    """sidechain x by the envelope of key"""
    env = np.abs(key)
    r = np.exp(-1 / (release * SR))
    e = signal.lfilter([1 - r], [1, -r], env)
    e /= (np.max(e) + 1e-9)
    return x * (1 - amount * np.clip(e * 3.2, 0, 1))

def limit(x, ceiling=0.89):
    peak = np.max(np.abs(x)) + 1e-9
    if peak > ceiling:
        x = x * (ceiling / peak)
    return np.tanh(x * 1.02) * 0.985

def stereo(mid, side_src=None, width=0.6):
    if side_src is None:
        side_src = np.zeros_like(mid)
    l = mid + side_src * width
    r = mid - side_src * width
    return np.stack([l, r], axis=1)

def write_wav(path, data, sr=SR):
    import wave
    d = np.clip(data, -1, 1)
    if d.ndim == 1:
        d = np.stack([d, d], axis=1)
    pcm = (d * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(d.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())

def read_wav(path):
    import wave
    with wave.open(path, 'rb') as w:
        sr = w.getframerate(); ch = w.getnchannels()
        raw = w.readframes(w.getnframes())
    x = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    return x
