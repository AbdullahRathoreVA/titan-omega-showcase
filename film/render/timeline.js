/* ============================================================
   TIMELINE — master 60s · 30s re-cut · 15s vertical re-cut
   ============================================================ */

const CUTS = {
  master: {
    w: 1920, h: 804, layout: 'wide', fps: 24,
    edl: [
      ['S01', 0.00, 5.00, 0.00], ['S02', 5.00, 4.00, 0.00], ['S03', 9.00, 5.00, 0.00],
      ['S04', 14.00, 6.00, 0.00], ['S05', 20.00, 6.00, 0.00], ['S06', 26.00, 5.00, 0.00],
      ['S07', 31.00, 5.00, 0.00], ['S08', 36.00, 5.00, 0.00], ['S09', 41.00, 6.00, 0.00],
      ['S10', 47.00, 5.00, 0.00], ['S11', 52.00, 5.00, 0.00], ['S12', 57.00, 3.00, 0.00],
    ]
  },
  cut30: {
    w: 1920, h: 804, layout: 'wide', fps: 24,
    edl: [
      ['S01', 0.00, 3.00, 1.50], ['S02', 3.00, 2.20, 0.85], ['S03', 5.20, 4.20, 0.80],
      ['S04', 9.40, 5.00, 0.90], ['S06', 14.40, 3.20, 1.00], ['S07', 17.60, 3.00, 1.60],
      ['S08', 20.60, 3.20, 0.30], ['S10', 23.80, 3.00, 0.60], ['S11', 26.80, 2.20, 0.20],
      ['S12', 29.00, 1.00, 0.55],
    ]
  },
  cut15: {
    w: 1080, h: 1920, layout: 'vert', fps: 24,
    edl: [
      ['S01', 0.00, 1.80, 2.00], ['S02', 1.80, 1.40, 0.90], ['S03', 3.20, 2.80, 1.60],
      ['S04', 6.00, 4.20, 1.40], ['S10', 10.20, 2.60, 2.20], ['S11', 12.80, 1.40, 0.25],
      ['S12', 14.20, 0.80, 0.50],
    ]
  },
};

/* vertical reframing — focus point + zoom per scene */
const VFRAME = {
  S01: { fx: 700, fy: 455, zoom: 2.20 },
  S02: { fx: 960, fy: 430, zoom: 2.00 },
  S03: { fx: 960, fy: 430, zoom: 2.00 },
  S04: { fx: 960, fy: 402, zoom: 2.40 },
  S05: { fx: 960, fy: 402, zoom: 1.90 },
  S06: { fx: 1180, fy: 420, zoom: 2.00 },
  S07: { fx: 960, fy: 402, zoom: 1.90 },
  S08: { fx: 960, fy: 392, zoom: 1.80 },
  S09: { fx: 960, fy: 430, zoom: 2.00 },
  S10: { fx: 860, fy: 470, zoom: 2.20 },
  S11: { fx: 960, fy: 402, zoom: 1.75 },
  S12: { fx: 960, fy: 402, zoom: 1.75 },
};

/* burned-in captions for the vertical cut (out-time based) */
const VCAPTIONS = [
  [0.15, 2.55, 'Nobody is typing.'],
  [3.30, 5.10, "You're asleep."],
  [5.20, 6.90, "Your business isn't."],
  [7.00, 8.60, 'One hundred AI agents.'],
  [8.70, 10.10, 'All night.'],
  [10.30, 12.60, '247 tasks done by 07:12.'],
  [12.90, 14.90, 'TITAN OMEGA'],
];

let CUT = CUTS.master;

function setupCut(name) {
  CUT = CUTS[name];
  DEV = { W: CUT.w, H: CUT.h };
  LAYOUT = CUT.layout;
  VSCALE = DEV.W / V.W;
  const cv = document.getElementById('out');
  cv.width = DEV.W; cv.height = DEV.H;
  initPost();
  return CUT;
}

function frameAt(t) {
  let cur = CUT.edl[0], src = 0;
  for (const e of CUT.edl) {
    if (t >= e[1] - 1e-6) { cur = e; src = e[3] + (t - e[1]); }
  }
  return { id: cur[0], src: clamp(src, 0, SCENES[cur[0]].dur - 1e-4) };
}

/* draw one frame of the current cut into the output canvas */
function renderFrame(t, frameIdx) {
  const { id, src } = frameAt(t);
  const scene = SCENES[id];

  // --- scene pass (into SC)
  SCX.setTransform(1, 0, 0, 1, 0, 0);
  SCX.globalAlpha = 1;
  SCX.globalCompositeOperation = 'source-over';
  SCX.filter = 'none';
  SCX.fillStyle = '#000000';
  SCX.fillRect(0, 0, DEV.W, DEV.H);

  const vf = LAYOUT === 'vert' ? VFRAME[id] : null;
  const s = VSCALE * (vf ? vf.zoom : 1);
  const fx = vf ? vf.fx : V.W / 2, fy = vf ? vf.fy : V.H / 2;

  SCX.save();
  SCX.translate(DEV.W / 2, DEV.H / 2);
  SCX.scale(s, s);
  SCX.translate(-fx, -fy);
  scene.draw(SCX, src);
  SCX.restore();

  if (LAYOUT === 'vert') drawVerticalOverlay(SCX, t, id, src);

  // --- post
  const outCtx = document.getElementById('out').getContext('2d', { alpha: false });
  outCtx.setTransform(1, 0, 0, 1, 0, 0);
  const grade = POSTGRADE[id] || {};
  applyPost(outCtx, frameIdx, grade);
}

/* per-scene post weighting */
const POSTGRADE = {
  S01: { bloom: 0.40, halation: 0.22, grain: 0.075, vignette: 0.72, ca: 0.7 },
  S02: { bloom: 0.50, halation: 0.26, grain: 0.070, vignette: 0.70, ca: 0.9 },
  S03: { bloom: 0.62, halation: 0.32, grain: 0.055, vignette: 0.58, ca: 1.0 },
  S04: { bloom: 0.78, halation: 0.40, grain: 0.050, vignette: 0.52, ca: 1.3 },
  S05: { bloom: 0.58, halation: 0.28, grain: 0.052, vignette: 0.56, ca: 1.0 },
  S06: { bloom: 0.56, halation: 0.26, grain: 0.052, vignette: 0.56, ca: 1.0 },
  S07: { bloom: 0.70, halation: 0.44, grain: 0.050, vignette: 0.54, ca: 1.2 },
  S08: { bloom: 0.60, halation: 0.30, grain: 0.052, vignette: 0.62, ca: 0.9 },
  S09: { bloom: 0.80, halation: 0.42, grain: 0.048, vignette: 0.50, ca: 1.4 },
  S10: { bloom: 0.46, halation: 0.40, grain: 0.070, vignette: 0.62, ca: 0.7 },
  S11: { bloom: 0.44, halation: 0.24, grain: 0.055, vignette: 0.66, ca: 0.6 },
  S12: { bloom: 0.40, halation: 0.20, grain: 0.055, vignette: 0.68, ca: 0.5 },
};

/* vertical: top mark + burned captions inside the safe zones */
function drawVerticalOverlay(ctx, t, id, src) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // top brand mark (after the film has established itself)
  if (t > 2.6 && id !== 'S11' && id !== 'S12') {
    const a = clamp((t - 2.6) / 0.6, 0, 1) * 0.55;
    ctx.globalAlpha = a;
    ctx.font = `500 20px 'Inter Display','Inter'`;
    ctx.letterSpacing = '9px';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#C4CAD4';
    ctx.fillText('TITAN OMEGA', DEV.W / 2 + 4.5, DEV.H * 0.115);
    ctx.globalAlpha = 1;
  }

  // captions
  for (const [a, b, txt] of VCAPTIONS) {
    if (t < a || t > b) continue;
    const fade = Math.min(clamp((t - a) / 0.22, 0, 1), clamp((b - t) / 0.22, 0, 1));
    const big = txt === 'Nobody is typing.' || txt === 'TITAN OMEGA';
    const size = big ? 62 : 46;
    const y = big && txt === 'Nobody is typing.' ? DEV.H * 0.30 : DEV.H * 0.775;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.font = `${big ? 600 : 500} ${size}px 'Inter Display','Inter'`;
    ctx.letterSpacing = txt === 'TITAN OMEGA' ? '14px' : '0px';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(txt, DEV.W / 2, y);
    ctx.restore();
  }
  ctx.restore();
}
