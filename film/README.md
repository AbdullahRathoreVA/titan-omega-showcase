# TITAN OMEGA — "The Business That Never Sleeps"

Finished films, rendered end-to-end inside this session. No external AI video service,
no stock footage, no third-party assets: every frame, every sound and the voice-over
were generated here from code.

## Files

In this repo (`film/`):

| File | Format | Use |
|---|---|---|
| `media/TitanOmega_15s_Vertical.mp4` | 1080×1920 (9:16) · 24 fps · captions burned in | Reels / TikTok / Shorts |
| `media/still_*.jpg` | JPEG | Thumbnail / poster frames pulled from the master |
| `subtitles/*.srt` | SubRip | Upload alongside each cut for accessibility + SEO |
| `render/` · `audio/` | Source | The engine that produces every frame and every sound |

Delivered separately (kept out of git to avoid bloating the repo — rebuild with `render/encode.sh`):

| File | Format | Use |
|---|---|---|
| `TitanOmega_60s_2K.mp4` | 1920×804 (2.39:1) · 24 fps · H.264 CRF 16 · AAC 320k · 43 MB | YouTube / site hero / LinkedIn master |
| `TitanOmega_60s_web.mp4` | same, 3.0 Mbps two-pass · 24 MB | Email, embeds, anywhere with an upload cap |
| `TitanOmega_30s_2K.mp4` | 1920×804 (2.39:1) · 24 fps · 23 MB | Paid social, pre-roll, pitch decks |

## The film

**Concept — THE EMPTY CHAIR.** 03:47 AM, a dark office, nobody at the desk. A key
depresses on its own. The room dissolves into the command space, 100+ agents bloom,
the system researches, builds, markets, sells, scales worldwide — and at 07:12 the
founder walks back in to 247 completed tasks. Tagline: *the business that never sleeps.*

**Scene map (60s master)**

| Time | Scene |
|---|---|
| 0:00 | 03:47 — the empty chair |
| 0:05 | Something typed (the hook) |
| 0:09 | The wake — the floor becomes glass |
| 0:14 | Genesis — one hundred agents |
| 0:20 | It researches |
| 0:26 | It builds |
| 0:31 | It markets |
| 0:36 | It sells |
| 0:41 | Global scale |
| 0:47 | 07:12 — everything already done |
| 0:52 | Wordmark |
| 0:57 | titanomega.ai · Book a build |

## How it was made

- **Picture** — a purpose-built deterministic 2D cinematography engine (`render/`), drawn
  frame-by-frame in Chromium and captured at 24 fps. Volumetric beams, glass panels,
  a Fibonacci agent swarm with neural filaments, a dotted globe with real continent
  masking and great-circle arcs, plus a film post chain: highlight bloom, halation,
  chromatic aberration, 35mm grain, dither and vignette.
- **Sound** — the whole score is synthesised from scratch in `audio/dsp.py`: sub drone,
  filtered arps, string/brass/choir stacks, taiko, braams, risers, plus a full sound-design
  library (keystroke, whooshes, UI pings, data chatter, rain, dawn birds). Mixed with
  sidechain ducking under the voice and a section-by-section dynamic arc.
- **Voice** — Piper neural TTS (`en-us-ryan-high`), pitched down 6% and processed
  (HPF, chest lift, presence, two-stage compression, 8% room) for a documentary read.

## Re-rendering / editing

```bash
cd render
node capture.mjs --cut=master --from=0 --to=1439 --outdir=../out/frames_master
python3 ../audio/build_audio.py      # rebuild score + VO
./encode.sh                          # frames + audio -> mp4
```

`render/timeline.js` holds the edit decision list — change durations, reorder scenes or
add new cuts there. `render/scenes_*.js` hold the shot content; `render/post.js` the grade.
