/* ============================================================
   POST — bloom · halation · chromatic aberration · grain ·
          vignette · gate weave · final contrast
   ============================================================ */

let SC, SCX;        // scene buffer
let BL, BLX;        // bloom buffer (quarter res)
let TN, TNX;        // tint buffer
let GRAIN = [];     // noise tiles
let GRAIN_PAT = [];

function initPost() {
  SC = mkCanvas(DEV.W, DEV.H); SCX = SC.getContext('2d', { alpha: false });
  const bw = Math.round(DEV.W / 4), bh = Math.round(DEV.H / 4);
  BL = mkCanvas(bw, bh); BLX = BL.getContext('2d');
  TN = mkCanvas(bw, bh); TNX = TN.getContext('2d');

  GRAIN = []; GRAIN_PAT = [];
  for (let g = 0; g < 6; g++) {
    const S = 512, c = mkCanvas(S, S), x = c.getContext('2d');
    const img = x.createImageData(S, S);
    const r = mulberry32(1000 + g * 77);
    for (let i = 0; i < S * S; i++) {
      // gaussian-ish
      const n = (r() + r() + r() + r() - 2) * 0.5;
      const v = clamp(128 + n * 150, 0, 255);
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    GRAIN.push(c);
  }
}

/* main post chain: src scene canvas -> out ctx */
function applyPost(out, frame, o = {}) {
  const bloomAmt = o.bloom === undefined ? 0.55 : o.bloom;
  const halo = o.halation === undefined ? 0.30 : o.halation;
  const grainAmt = o.grain === undefined ? 0.055 : o.grain;
  const vig = o.vignette === undefined ? 0.55 : o.vignette;
  const ca = o.ca === undefined ? 1 : o.ca;

  const bw = BL.width, bh = BL.height;

  // ---- highlight extraction: draw scene small, then multiply by itself (squares luminance)
  BLX.globalCompositeOperation = 'source-over';
  BLX.clearRect(0, 0, bw, bh);
  BLX.filter = 'none';
  BLX.drawImage(SC, 0, 0, bw, bh);
  BLX.globalCompositeOperation = 'multiply';
  BLX.drawImage(BL, 0, 0);
  BLX.drawImage(BL, 0, 0);          // ^3 — only real highlights survive
  BLX.globalCompositeOperation = 'source-over';

  // ---- base frame
  out.globalCompositeOperation = 'source-over';
  out.filter = 'none';
  out.drawImage(SC, 0, 0);

  // ---- bloom (two radii) with chromatic split
  out.globalCompositeOperation = 'lighter';
  const radii = [[7, bloomAmt * 0.85], [20, bloomAmt * 0.55]];
  for (const [r, a] of radii) {
    out.filter = `blur(${r}px)`;
    out.globalAlpha = a;
    if (ca > 0) {
      const dx = 2.2 * ca, dy = 1.0 * ca;
      // red slightly out, blue slightly in
      out.globalAlpha = a * 0.5;
      out.drawImage(BL, -dx, -dy, DEV.W + dx * 2, DEV.H + dy * 2);
      out.drawImage(BL, dx, dy, DEV.W - dx * 2, DEV.H - dy * 2);
      out.globalAlpha = a * 0.6;
      out.drawImage(BL, 0, 0, DEV.W, DEV.H);
    } else {
      out.drawImage(BL, 0, 0, DEV.W, DEV.H);
    }
  }
  // ---- halation (wide, warm)
  if (halo > 0) {
    out.filter = `blur(${Math.round(DEV.W / 46)}px)`;
    out.globalAlpha = halo * 0.45;
    out.drawImage(BL, 0, 0, DEV.W, DEV.H);
  }
  out.filter = 'none';
  out.globalAlpha = 1;
  out.globalCompositeOperation = 'source-over';

  // ---- vignette
  if (vig > 0) {
    const g = out.createRadialGradient(DEV.W / 2, DEV.H / 2, Math.min(DEV.W, DEV.H) * 0.22,
      DEV.W / 2, DEV.H / 2, Math.hypot(DEV.W, DEV.H) * 0.60);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.62, `rgba(0,0,0,${0.22 * vig})`);
    g.addColorStop(1, `rgba(0,0,0,${0.80 * vig})`);
    out.fillStyle = g; out.fillRect(0, 0, DEV.W, DEV.H);
  }

  // ---- film grain
  if (grainAmt > 0) {
    const gi = frame % GRAIN.length;
    if (!GRAIN_PAT[gi]) GRAIN_PAT[gi] = out.createPattern(GRAIN[gi], 'repeat');
    out.save();
    out.globalCompositeOperation = 'overlay';
    out.globalAlpha = grainAmt;
    // sub-pixel jitter so grain doesn't lock to the pixel grid
    const jx = (frame * 37) % 512, jy = (frame * 101) % 512;
    out.translate(-jx, -jy);
    out.fillStyle = GRAIN_PAT[gi];
    out.fillRect(0, 0, DEV.W + 512, DEV.H + 512);
    out.restore();
  }

  {
    const gi2 = (frame + 3) % GRAIN.length;
    if (!GRAIN_PAT[gi2]) GRAIN_PAT[gi2] = out.createPattern(GRAIN[gi2], 'repeat');
    out.save();
    out.globalCompositeOperation = 'lighter';
    out.globalAlpha = 0.020;
    out.translate(-((frame * 53) % 512), -((frame * 149) % 512));
    out.fillStyle = GRAIN_PAT[gi2];
    out.fillRect(0, 0, DEV.W + 512, DEV.H + 512);
    out.restore();
  }

  // ---- lifted blacks (film print emulation: never crush to 0)
  out.globalCompositeOperation = 'lighter';
  out.fillStyle = 'rgba(10,14,26,0.055)';
  out.fillRect(0, 0, DEV.W, DEV.H);
  out.globalCompositeOperation = 'source-over';
}
