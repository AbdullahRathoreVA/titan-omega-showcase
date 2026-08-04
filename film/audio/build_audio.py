"""TITAN OMEGA — voice-over, score and sound design for all three cuts."""
import os, sys, wave
import numpy as np
from scipy import signal
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import *

HERE = os.path.dirname(os.path.abspath(__file__))
VODIR = os.path.join(HERE, 'vo')
os.makedirs(VODIR, exist_ok=True)

# ============================================================ VOICE-OVER
LINES = {
    'l01': "Three forty-seven, a.m.",
    'l02': "You're asleep.",
    'l03': "Your business isn't.",
    'l04': "One hundred agents.",
    'l05': "One command.",
    'l06': "It researches.",
    'l07': "It builds.",
    'l08': "It markets.",
    'l09': "It sells.",
    'l10': "While you sleep, it scales.",
    'l11': "This isn't a tool you use.",
    'l12': "It's a company that runs itself.",
    'l13': "Titan Omega.",
    'l14': "The business that never sleeps.",
    'l15': "One hundred agents. Building. Marketing. Selling.",
    'l16': "All night.",
    'l17': "Building.",
    'l18': "Marketing.",
    'l19': "Selling.",
    'l20': "One hundred A.I. agents.",
    'l21': "Titan Omega. The business that never sleeps.",
}

def synth_vo():
    from piper import PiperVoice, SynthesisConfig
    model = os.path.join(HERE, 'en-us-ryan-high.onnx')
    voice = PiperVoice.load(model)
    cfg = SynthesisConfig(length_scale=1.06, noise_scale=0.60, noise_w_scale=0.72)
    for k, text in LINES.items():
        path = os.path.join(VODIR, k + '_raw.wav')
        if os.path.exists(path):
            continue
        with wave.open(path, 'wb') as w:
            voice.synthesize_wav(text, w, syn_config=cfg)
        print('vo:', k, text)

def vo_line(key):
    """load + process one line: pitch down, EQ, compress, tiny room"""
    x = read_wav(os.path.join(VODIR, key + '_raw.wav'))
    # pitch down ~6% (also slows slightly -> more authority)
    x = signal.resample_poly(x, 106, 100)
    x = hp(x, 80)
    x = peaking(x, 115, 3.0, 0.9)     # chest
    x = peaking(x, 380, -3.0, 1.1)    # remove mud
    x = peaking(x, 4200, 3.5, 1.2)    # presence
    x = peaking(x, 7800, -3.0, 1.4)   # de-harsh
    x = compress(x, thresh_db=-22, ratio=3.6, makeup_db=5.0)
    x = compress(x, thresh_db=-12, ratio=6.0, makeup_db=1.5)
    # trim silence
    e = np.abs(x); thr = np.max(e) * 0.02
    idx = np.where(e > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - sec(0.03)): idx[-1] + sec(0.10)]
    x = convolve(x, VO_IR, wet=0.085)
    x /= (np.max(np.abs(x)) + 1e-9)
    return x * 0.85

VO_IR = make_ir(1.1, seed=5, damp=4200, pre=0.008)
HALL = make_ir(2.6, seed=17, damp=6200, pre=0.018)
PLATE = make_ir(1.5, seed=23, damp=8000, pre=0.006)

# ============================================================ MUSIC HELPERS
BPM = 128.0
BEAT = 60.0 / BPM

def chord(names):
    return [note_hz(n) for n in names]

AM = ['A2', 'E3', 'A3', 'C4']
F_ = ['F2', 'C3', 'F3', 'A3']
C_ = ['C3', 'G3', 'C4', 'E4']
G_ = ['G2', 'D3', 'G3', 'B3']

def lay_strings(dst, at, dur, notes, vel=1.0):
    for i, f in enumerate(chord(notes)):
        add(dst, strings(f, dur, vel=vel * (1.0 - i * 0.12), seed=i), at)

def lay_brass(dst, at, dur, notes, vel=1.0):
    for i, f in enumerate(chord(notes)[:3]):
        add(dst, brass(f, dur, vel=vel * (1.0 - i * 0.18), seed=i), at)

def lay_choir(dst, at, dur, notes, vel=1.0):
    for i, f in enumerate(chord(notes)):
        add(dst, choir(f, dur, vel=vel * (0.9 - i * 0.15), seed=i), at)

def arp_run(dst, at, dur, notes, step=BEAT / 4, vel=0.5, cutoff0=700, cutoff1=5200):
    fs = chord(notes)
    n_steps = int(dur / step)
    pattern = [0, 1, 2, 3, 2, 1]
    for i in range(n_steps):
        f = fs[pattern[i % len(pattern)] % len(fs)]
        p = i / max(1, n_steps - 1)
        seg = osc_saw(f, sec(step * 1.7), detune=0.004, voices=2)
        seg = lp(seg, cutoff0 + (cutoff1 - cutoff0) * p)
        seg *= env_exp(len(seg), 0.003, step * 0.9, 3.2)
        add(dst, seg, at + i * step, vel * (0.7 + 0.3 * (i % 2)))

# ============================================================ MASTER SCORE
def build_master(total=60.0):
    music = buf(total)
    perc = buf(total)
    fx = buf(total)
    amb = buf(total)

    # ---------- 0-5 room tone: rain + hvac hum ----------
    add(amb, rain(9.6, vel=1.0, seed=31), 0.0)
    add(amb, hum(9.6, 60.0, vel=1.0), 0.0)
    amb[:sec(0.35)] *= np.linspace(0, 1, sec(0.35))
    # rain ducks away as the world wakes
    fade = np.ones(sec(9.6))
    fade[sec(8.4):] = np.linspace(1, 0, len(fade) - sec(8.4))
    amb[:sec(9.6)] *= fade

    # ---------- 4.6-14 sub drone + slow pulse ----------
    dr = sub(40.0, 10.0, vel=0.55)
    dr *= np.linspace(0.2, 1.0, len(dr)) ** 0.6
    add(music, dr, 4.6)
    add(music, sub(60.0, 9.0, vel=0.18), 5.2)
    for i in range(11):                                  # 72 bpm heartbeat pulse
        t = 5.4 + i * (60 / 72)
        if t > 13.6: break
        k = lp(kick(0.9, 78, 40, vel=0.45), 220)
        add(perc, k, t)

    # ---------- 13.0-14.0 riser into the reveal ----------
    add(fx, riser(2.6, vel=0.42, seed=13), 11.4)
    add(fx, whoosh(1.1, vel=0.55, seed=15), 13.1)

    # ---------- 14-20 genesis: braam + arp + strings ----------
    add(fx, braam(3.2, root=55.0, vel=0.72), 13.95)
    add(perc, kick(1.2, 110, 40, vel=0.9), 14.0)
    arp_run(music, 14.3, 5.6, AM, vel=0.34, cutoff0=600, cutoff1=4800)
    lay_strings(music, 15.6, 4.6, AM, vel=0.30)
    for i, t in enumerate([14.6, 15.1, 15.7, 16.2, 16.9, 17.4, 18.0, 18.6, 19.2]):
        add(fx, ping(1150 + i * 90, 0.45, vel=0.16), t)

    # ---------- 20-26 research: beat proper ----------
    for i in range(int(6 / BEAT) + 1):
        t = 20.0 + i * BEAT
        if t >= 26.0: break
        add(perc, kick(0.55, 100, 44, vel=0.62 if i % 2 == 0 else 0.34), t)
        if i % 2 == 1:
            hat = hp(noise(sec(0.05), 200 + i), 6500) * env_exp(sec(0.05), 0.0005, 0.02, 8)
            add(perc, hat, t, 0.22)
    arp_run(music, 20.0, 6.0, AM, vel=0.30, cutoff0=1200, cutoff1=6000)
    lay_strings(music, 20.0, 3.0, AM, vel=0.34)
    lay_strings(music, 23.0, 3.0, F_, vel=0.34)
    add(fx, chatter(6.0, vel=0.5, seed=41), 20.0)
    add(fx, whoosh(0.7, vel=0.35, seed=19), 19.7)

    # ---------- 26-31 build ----------
    for i in range(int(5 / BEAT) + 1):
        t = 26.0 + i * BEAT
        if t >= 31.0: break
        add(perc, kick(0.5, 105, 45, vel=0.72), t)
        snare = bp(noise(sec(0.18), 300 + i), 180, 4200) * env_exp(sec(0.18), 0.001, 0.07, 5)
        if i % 4 == 2:
            add(perc, snare, t, 0.45)
    arp_run(music, 26.0, 5.0, C_, vel=0.32, cutoff0=1800, cutoff1=7000)
    lay_strings(music, 26.0, 2.5, C_, vel=0.36)
    lay_strings(music, 28.5, 2.5, G_, vel=0.36)
    add(fx, mech(4.6, vel=0.30, seed=51), 26.1)
    add(fx, whoosh(0.6, vel=0.4, seed=23), 25.75)
    add(fx, ping(1600, 0.6, vel=0.3), 29.75)          # DEPLOYED

    # ---------- 31-36 market ----------
    for i in range(int(5 / BEAT) + 1):
        t = 31.0 + i * BEAT
        if t >= 36.0: break
        add(perc, kick(0.5, 108, 46, vel=0.8), t)
        if i % 2 == 1:
            add(perc, hp(noise(sec(0.06), 400 + i), 6000) * env_exp(sec(0.06), 0.0005, 0.025, 7), t, 0.25)
    lay_brass(music, 31.0, 1.6, AM, vel=0.42)
    lay_brass(music, 32.8, 1.2, AM, vel=0.36)
    lay_brass(music, 34.2, 1.8, F_, vel=0.44)
    lay_strings(music, 31.0, 5.0, AM, vel=0.26)
    for i in range(9):
        add(fx, whoosh(0.55, vel=0.20, seed=60 + i, up=(i % 2 == 0)), 31.1 + i * 0.52)

    # ---------- 36-41 sell: drop out, heartbeat, slam back ----------
    add(fx, braam(2.8, root=48.0, vel=0.66), 35.95)
    add(music, sub(41.0, 5.0, vel=0.5), 36.0)
    for i in range(6):                                  # heartbeat
        t = 38.2 + i * 0.62
        add(perc, lp(kick(0.5, 70, 38, vel=0.5), 180), t)
        add(perc, lp(kick(0.4, 62, 34, vel=0.3), 170), t + 0.19)
    lay_strings(music, 39.4, 1.6, AM, vel=0.22)
    add(fx, riser(1.6, vel=0.34, seed=71), 39.3)

    # ---------- 41-47 global: peak ----------
    add(fx, braam(3.4, root=55.0, vel=0.8), 40.95)
    for i in range(int(6 / BEAT) + 1):
        t = 41.0 + i * BEAT
        if t >= 46.9: break
        add(perc, taiko(0.9, vel=0.55 if i % 2 == 0 else 0.34), t)
        add(perc, kick(0.55, 110, 44, vel=0.7), t)
        if i % 4 == 3:
            add(perc, taiko(0.7, vel=0.4), t + BEAT / 2)
    lay_strings(music, 41.0, 3.0, F_, vel=0.40)
    lay_strings(music, 44.0, 1.6, G_, vel=0.40)
    lay_strings(music, 45.6, 1.4, AM, vel=0.42)
    lay_brass(music, 41.0, 2.2, F_, vel=0.46)
    lay_brass(music, 43.4, 1.4, G_, vel=0.44)
    lay_brass(music, 44.9, 2.0, AM, vel=0.50)
    lay_choir(music, 41.2, 5.6, AM, vel=0.34)
    add(fx, riser(2.0, vel=0.36, seed=73), 44.9)
    # reverse-cymbal into the dawn cut
    rc = whoosh(1.4, vel=0.5, seed=79, up=True)
    add(fx, rc, 45.7)

    # ---------- 47-57 dawn: solo piano, everything else gone ----------
    mel = [(0.15, 'A4', 1.3), (1.45, 'E4', 0.9), (2.35, 'F4', 1.2),
           (3.55, 'C4', 1.5), (5.05, 'G4', 1.0), (6.05, 'E4', 1.3),
           (7.35, 'A4', 1.7), (9.05, 'E4', 1.5)]
    for t, n, d in mel:
        add(music, piano(note_hz(n), d + 0.9, vel=0.34), 47.0 + t)
        if n in ('A4', 'F4'):
            add(music, piano(note_hz(n) * 1.5, d + 0.6, vel=0.10), 47.0 + t + 0.02)
    for t, n in [(0.10, 'A2'), (3.45, 'F2'), (5.0, 'C3'), (7.3, 'G2'), (9.0, 'A2')]:
        add(music, piano(note_hz(n), 3.2, vel=0.26), 47.0 + t)
    # dawn ambience: air + a few birds
    air = lp(noise(sec(10.5), 91), 900) * 0.02
    air *= np.linspace(0, 1, len(air)) ** 0.5
    add(amb, air, 47.0)
    for t, f in [(0.9, 3100), (2.6, 3600), (4.4, 2900), (7.9, 3400)]:
        n = sec(0.09)
        tt = np.arange(n) / SR
        chirp = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 14 * tt)) * tt) * env_exp(n, 0.004, 0.05, 6)
        add(amb, chirp, 47.0 + t, 0.055)

    # ---------- 52-57 logo ----------
    add(music, sub(41.0, 6.0, vel=0.24), 52.0)
    add(fx, ping(900, 1.2, vel=0.12), 55.0)

    # ---------- 57-60 CTA ----------
    add(music, sub(45.0, 3.4, vel=0.55, drop=0.35), 57.25)
    add(music, piano(note_hz('A2'), 3.0, vel=0.22), 57.3)
    add(fx, whoosh(0.7, vel=0.22, seed=83, up=False), 56.9)

    # ---------- sound-design one-shots ----------
    add(fx, keyclick(vel=1.6), 6.15)                    # THE hook sound
    add(fx, sub(52.0, 1.6, vel=0.30, drop=0.25), 6.15)
    add(fx, keyclick(vel=0.30), 6.44)
    kd = np.ones(sec(60.0))
    kd[sec(6.02):sec(6.14)] = np.linspace(1, 0.25, sec(6.14) - sec(6.02))
    kd[sec(6.14):sec(6.9)] = np.linspace(0.25, 1, sec(6.9) - sec(6.14))
    amb *= kd[:len(amb)]
    add(fx, whoosh(0.8, vel=0.4, seed=27), 8.7)         # into the wake
    add(fx, whoosh(0.9, vel=0.45, seed=29), 13.45)      # light wipe
    add(fx, ping(1500, 0.7, vel=0.18), 47.05)

    return music, perc, fx, amb

# ============================================================ 30s SCORE
def build_cut30(total=30.0):
    music, perc, fx, amb = buf(total), buf(total), buf(total), buf(total)
    add(amb, rain(6.0, vel=1.0, seed=31), 0.0)
    add(amb, hum(6.0, 60.0, vel=1.0), 0.0)
    amb[:sec(0.3)] *= np.linspace(0, 1, sec(0.3))
    f = np.ones(sec(6.0)); f[sec(4.6):] = np.linspace(1, 0, len(f) - sec(4.6)); amb[:sec(6.0)] *= f

    add(fx, keyclick(vel=1.6), 3.30)
    add(fx, sub(52.0, 1.4, vel=0.28, drop=0.25), 3.30)
    dr = sub(40.0, 6.6, vel=0.55); dr *= np.linspace(0.25, 1, len(dr)) ** 0.6
    add(music, dr, 2.8)
    add(fx, riser(2.0, vel=0.40, seed=13), 7.4)
    add(fx, whoosh(0.9, vel=0.5, seed=29), 8.9)
    add(fx, braam(3.0, root=55.0, vel=0.72), 9.35)
    add(perc, kick(1.1, 110, 40, vel=0.9), 9.4)
    arp_run(music, 9.7, 4.6, AM, vel=0.34, cutoff0=700, cutoff1=5200)
    lay_strings(music, 10.6, 3.6, AM, vel=0.32)
    for i, t in enumerate([10.0, 10.5, 11.1, 11.7, 12.3, 12.9]):
        add(fx, ping(1150 + i * 100, 0.45, vel=0.15), t)

    for i in range(int(9.4 / BEAT) + 1):                 # 14.4 -> 23.8
        t = 14.4 + i * BEAT
        if t >= 23.8: break
        add(perc, kick(0.5, 104, 45, vel=0.75), t)
        if i % 2 == 1:
            add(perc, hp(noise(sec(0.05), 500 + i), 6300) * env_exp(sec(0.05), 0.0005, 0.02, 8), t, 0.22)
        if i % 4 == 2:
            add(perc, bp(noise(sec(0.18), 300 + i), 180, 4200) * env_exp(sec(0.18), 0.001, 0.07, 5), t, 0.4)
    arp_run(music, 14.4, 6.2, C_, vel=0.30, cutoff0=1500, cutoff1=6500)
    lay_strings(music, 14.4, 3.2, C_, vel=0.34)
    lay_brass(music, 17.6, 1.6, AM, vel=0.44)
    lay_strings(music, 17.6, 3.0, AM, vel=0.32)
    add(fx, mech(3.0, vel=0.26, seed=51), 14.5)
    for i in range(5):
        add(fx, whoosh(0.5, vel=0.18, seed=60 + i, up=(i % 2 == 0)), 17.7 + i * 0.55)
    add(fx, braam(2.4, root=48.0, vel=0.6), 20.55)
    add(music, sub(41.0, 3.2, vel=0.45), 20.6)
    for i in range(4):
        add(perc, lp(kick(0.5, 70, 38, vel=0.45), 180), 21.4 + i * 0.6)
    add(fx, riser(1.4, vel=0.32, seed=71), 22.3)
    add(fx, whoosh(1.2, vel=0.45, seed=79), 22.9)

    mel = [(0.2, 'A4', 1.2), (1.4, 'E4', 0.9), (2.3, 'C4', 1.4)]
    for t, n, d in mel:
        add(music, piano(note_hz(n), d + 0.8, vel=0.32), 23.8 + t)
    add(music, piano(note_hz('A2'), 3.0, vel=0.24), 23.9)
    air = lp(noise(sec(4.0), 91), 900) * 0.018
    add(amb, air, 23.8)
    add(music, sub(41.0, 3.0, vel=0.22), 26.8)
    add(music, sub(45.0, 2.2, vel=0.5, drop=0.35), 28.95)
    add(music, piano(note_hz('A2'), 2.0, vel=0.2), 29.0)
    return music, perc, fx, amb

# ============================================================ 15s SCORE
def build_cut15(total=15.0):
    music, perc, fx, amb = buf(total), buf(total), buf(total), buf(total)
    add(amb, rain(4.0, vel=1.0, seed=31), 0.0)
    add(amb, hum(4.0, 60.0, vel=1.0), 0.0)
    amb[:sec(0.25)] *= np.linspace(0, 1, sec(0.25))
    f = np.ones(sec(4.0)); f[sec(2.8):] = np.linspace(1, 0, len(f) - sec(2.8)); amb[:sec(4.0)] *= f
    add(fx, keyclick(vel=1.6), 2.05)
    add(fx, sub(52.0, 1.2, vel=0.26, drop=0.25), 2.05)
    dr = sub(40.0, 4.2, vel=0.55); dr *= np.linspace(0.3, 1, len(dr)) ** 0.6
    add(music, dr, 1.7)
    add(fx, riser(1.6, vel=0.38, seed=13), 4.5)
    add(fx, whoosh(0.8, vel=0.5, seed=29), 5.55)
    add(fx, braam(2.8, root=55.0, vel=0.72), 5.95)
    add(perc, kick(1.0, 110, 40, vel=0.85), 6.0)
    arp_run(music, 6.2, 3.8, AM, vel=0.32, cutoff0=800, cutoff1=5400)
    lay_strings(music, 6.6, 3.4, AM, vel=0.32)
    for i, t in enumerate([6.5, 7.0, 7.6, 8.2, 8.8]):
        add(fx, ping(1150 + i * 100, 0.4, vel=0.14), t)
    for i in range(int(4.0 / BEAT)):
        t = 6.2 + i * BEAT
        add(perc, kick(0.5, 104, 45, vel=0.6), t)
    add(fx, whoosh(1.0, vel=0.4, seed=79), 9.5)
    add(music, piano(note_hz('A4'), 2.0, vel=0.3), 10.4)
    add(music, piano(note_hz('E4'), 1.6, vel=0.24), 11.5)
    add(music, piano(note_hz('A2'), 3.0, vel=0.24), 10.4)
    add(amb, lp(noise(sec(2.6), 91), 900) * 0.018, 10.3)
    add(music, sub(41.0, 2.2, vel=0.22), 12.8)
    add(music, sub(45.0, 1.9, vel=0.45, drop=0.35), 14.05)
    return music, perc, fx, amb

# ============================================================ MIX
def arc_env(total, points):
    """piecewise dB arc over time -> linear gain curve"""
    n = sec(total)
    t = np.arange(n) / SR
    ts = np.array([p[0] for p in points]); db = np.array([p[1] for p in points])
    return 10 ** (np.interp(t, ts, db) / 20)

def mix(name, beds, vo_events, total, out_path, arc=None):
    music, perc, fx, amb = beds
    # spatial / tonal polish
    music = convolve(music, HALL, wet=0.26)
    perc = convolve(perc, PLATE, wet=0.10)
    fx = convolve(fx, HALL, wet=0.20)
    music = compress(music, thresh_db=-20, ratio=2.4, makeup_db=2.0)
    perc = compress(perc, thresh_db=-18, ratio=3.2, makeup_db=1.5)

    vo = buf(total)
    for at, key, gain in vo_events:
        add(vo, vo_line(key), at, gain)
    vo = compress(vo, thresh_db=-16, ratio=3.0, makeup_db=1.0)

    bed = music * 0.85 + perc * 0.72 + fx * 0.62 + amb * 0.42
    if arc is not None:
        bed *= arc_env(total, arc)
    bed = duck(bed, vo, amount=0.70, release=0.30)

    m = bed + vo * 1.14
    m = hp(m, 26)
    m = peaking(m, 260, -2.2, 0.9)     # unmud
    m = peaking(m, 2800, 1.8, 0.8)     # intelligibility
    m = shelf_high(m, 7200, 4.5, 0.8)  # air
    m = limit(m, 0.90)

    # gentle stereo: music/fx wide, VO centre
    side = (convolve(music, HALL, wet=0.5) * 0.5 + fx * 0.4)
    side = hp(side, 220) * 0.35
    st = stereo(m, side, width=0.55)
    st = np.clip(st, -1, 1)
    write_wav(out_path, st)
    peak = np.max(np.abs(st))
    rms = np.sqrt(np.mean(st ** 2))
    print(f'{name}: {total:.1f}s  peak {20*np.log10(peak+1e-9):.1f} dBFS  rms {20*np.log10(rms+1e-9):.1f} dBFS -> {out_path}')

if __name__ == '__main__':
    synth_vo()

    VO_MASTER = [
        (1.00, 'l01', 1.0), (5.55, 'l02', 1.0), (9.55, 'l03', 1.0),
        (14.95, 'l04', 1.0), (17.85, 'l05', 1.0), (21.45, 'l06', 1.0),
        (27.00, 'l07', 1.0), (32.00, 'l08', 1.0), (37.00, 'l09', 1.0),
        (41.95, 'l10', 1.0), (47.25, 'l11', 1.0), (50.55, 'l12', 1.0),
        (54.45, 'l13', 1.0), (57.35, 'l14', 1.0),
    ]
    VO_30 = [
        (0.55, 'l01', 1.0), (3.15, 'l02', 1.0), (5.35, 'l03', 1.0),
        (9.75, 'l04', 1.0), (14.60, 'l17', 1.0), (17.70, 'l18', 1.0),
        (20.70, 'l19', 1.0), (23.95, 'l16', 1.0), (26.55, 'l21', 1.0),
    ]
    VO_15 = [
        (3.35, 'l02', 1.0), (5.25, 'l03', 1.0), (7.05, 'l20', 1.0),
        (9.55, 'l16', 1.0), (12.85, 'l13', 1.0),
    ]

    out = os.path.join(HERE, '..', 'out')
    os.makedirs(out, exist_ok=True)
    ARC_MASTER = [(0, -11), (4.5, -10), (5, -7), (9, -4.5), (14, -1.5), (20, -1.5),
                  (26, 0), (31, 1.0), (36, -0.5), (40.8, 2.5), (46.9, 2.5), (47.2, -5),
                  (52, -6), (56.9, -6), (57.3, -2), (60, -2)]
    ARC_30 = [(0, -11), (2.9, -9), (3.4, -6), (9, -2), (14.4, 0.5), (20.5, 0.5),
              (23.6, 1.5), (23.9, -5), (26.8, -6), (28.9, -2), (30, -2)]
    ARC_15 = [(0, -11), (1.9, -9), (2.3, -6), (6, 0.5), (9.4, 1.5), (10.1, -5),
              (12.8, -6), (14.0, -2), (15, -2)]
    mix('master', build_master(60.0), VO_MASTER, 60.0, os.path.join(out, 'audio_master.wav'), ARC_MASTER)
    mix('cut30', build_cut30(30.0), VO_30, 30.0, os.path.join(out, 'audio_cut30.wav'), ARC_30)
    mix('cut15', build_cut15(15.0), VO_15, 15.0, os.path.join(out, 'audio_cut15.wav'), ARC_15)
