/* ============================================================
   TITAN OMEGA — CINEMATIC ENGINE / CORE
   Deterministic, frame-accurate 2D cinematography engine.
   All randomness is seeded so every render is identical.
   ============================================================ */

const V = { W: 1920, H: 804 };            // virtual (master 2.39:1) design space
let DEV = { W: 1920, H: 804 };            // device / output size
let LAYOUT = 'wide';                      // 'wide' | 'vert'
let VSCALE = 1;                           // virtual -> device scale
let VOFFY = 0;                            // vertical focus offset (virtual px)

/* ---------- palette ---------- */
const C = {
  black:   '#000000',
  ink:     '#05070C',
  deep:    '#0A0E1A',
  white:   '#FFFFFF',
  silver:  '#C4CAD4',
  blue:    '#0A84FF',
  blueLt:  '#5AB4FF',
  purple:  '#5E17EB',
  cyan:    '#4DE8E0',
  orange:  '#FF7A18',
  amber:   '#FFB067',
  green:   '#34E08A',
  warm:    '#FFC38A',
};

/* ---------- math ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => b === a ? 0 : clamp((v - a) / (b - a), 0, 1);
const smooth = t => t * t * (3 - 2 * t);
const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
const eOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const eInExpo = t => t <= 0 ? 0 : Math.pow(2, 10 * (t - 1));
const eOutCubic = t => 1 - Math.pow(1 - t, 3);
const eInCubic = t => t * t * t;
const eInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOutQuint = t => 1 - Math.pow(1 - t, 5);
const eOutBack = (t, s = 1.34) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
// ramp helper: value goes 0->1 between a and b of local time, with easing
const ramp = (t, a, b, ease = smooth) => ease(inv(a, b, t));
// pulse: 0->1->0
const pulse = (t, a, peak, b) => t < peak ? smooth(inv(a, peak, t)) : 1 - smooth(inv(peak, b, t));

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// deterministic reusable random pools
function pool(seed, n, f) {
  const r = mulberry32(seed), out = [];
  for (let i = 0; i < n; i++) out.push(f(r, i));
  return out;
}

/* ---------- colour utils ---------- */
function hex2rgb(h) {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgba(h, a) {
  const [r, g, b] = typeof h === 'string' ? hex2rgb(h) : h;
  return `rgba(${r},${g},${b},${a})`;
}
function mixHex(h1, h2, t) {
  const a = hex2rgb(h1), b = hex2rgb(h2);
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
}

/* ---------- canvases ---------- */
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ---------- glow sprites (cached) ---------- */
const _glowCache = new Map();
function glowSprite(color, softness = 1) {
  const key = color + '|' + softness;
  if (_glowCache.has(key)) return _glowCache.get(key);
  const S = 256, c = mkCanvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const stops = softness === 1
    ? [[0, 1], [0.10, 0.85], [0.25, 0.42], [0.45, 0.14], [0.70, 0.03], [1, 0]]
    : [[0, 1], [0.05, 0.7], [0.18, 0.28], [0.40, 0.07], [1, 0]];
  for (const [p, a] of stops) g.addColorStop(p, rgba(color, a));
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  _glowCache.set(key, c);
  return c;
}
function glow(ctx, x, y, r, color, alpha = 1, softness = 1) {
  if (alpha <= 0.002 || r <= 0) return;
  const s = glowSprite(color, softness);
  ctx.globalAlpha = alpha;
  ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/* ---------- shapes ---------- */
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* glassmorphism panel */
function glassPanel(ctx, x, y, w, h, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.003) return;
  const tint = o.tint || C.blue;
  ctx.save();
  rrect(ctx, x, y, w, h, o.r || 6);
  const g = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
  g.addColorStop(0, rgba(tint, 0.13 * a));
  g.addColorStop(0.5, rgba(tint, 0.05 * a));
  g.addColorStop(1, rgba('#000814', 0.16 * a));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba(o.edge || C.blueLt, (o.edgeA === undefined ? 0.45 : o.edgeA) * a);
  ctx.lineWidth = o.lw || 1;
  ctx.stroke();
  // top specular
  ctx.beginPath();
  ctx.moveTo(x + (o.r || 6), y + 0.5); ctx.lineTo(x + w - (o.r || 6), y + 0.5);
  ctx.strokeStyle = rgba('#FFFFFF', 0.22 * a); ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

/* ---------- text ---------- */
function T(ctx, str, x, y, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = a;
  const fam = o.mono ? "'JetBrains Mono'" : (o.display ? "'Inter Display','Inter'" : "'Inter'");
  ctx.font = `${o.weight || 400} ${o.size || 20}px ${fam}`;
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  if (o.shadow) { ctx.shadowColor = rgba(o.shadow, 0.9); ctx.shadowBlur = o.shadowBlur || 18; }
  ctx.fillStyle = o.color || C.white;
  ctx.fillText(str, x, y);
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 1; ctx.strokeText(str, x, y); }
  ctx.restore();
}
function textW(ctx, str, o = {}) {
  ctx.save();
  const fam = o.mono ? "'JetBrains Mono'" : (o.display ? "'Inter Display','Inter'" : "'Inter'");
  ctx.font = `${o.weight || 400} ${o.size || 20}px ${fam}`;
  ctx.letterSpacing = (o.ls || 0) + 'px';
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}
/* per-character staggered reveal (fade + rise) */
function textStagger(ctx, str, x, y, lt, o = {}) {
  const start = o.start || 0, step = o.step || 0.06, dur = o.dur || 0.45;
  const chars = [...str];
  const ls = o.ls || 0;
  let total = textW(ctx, str, o);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const oo = Object.assign({}, o); oo.align = 'left';
  chars.forEach((ch, i) => {
    const p = clamp((lt - start - i * step) / dur, 0, 1);
    const e = eOutExpo(p);
    const w = textW(ctx, ch, o) + ls;
    if (p > 0) {
      oo.alpha = (o.alpha === undefined ? 1 : o.alpha) * p;
      T(ctx, ch, cx, y + (1 - e) * (o.rise === undefined ? 10 : o.rise), oo);
    }
    cx += w;
  });
}

/* ---------- gradients ---------- */
function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
function hgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

/* ---------- volumetric helpers ---------- */
// soft volumetric beam — built from overlapping radial falloffs so it has no hard edges
function lightCone(ctx, x, y, ang, spread, len, color, alpha) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.globalCompositeOperation = 'lighter';
  const N = 26;
  for (let i = 1; i <= N; i++) {
    const p = i / N;
    const d = p * len;
    const r = Math.max(18, Math.tan(spread) * d * 1.15);
    const a = alpha * 0.30 * Math.pow(1 - p, 1.5) * (1 - Math.pow(p, 3) * 0.2);
    glow(ctx, d, 0, r, color, a, 2);
  }
  glow(ctx, 0, 0, Math.max(30, len * 0.05), color, alpha * 0.5);
  ctx.restore();
}

// anamorphic horizontal flare
function anamorphic(ctx, x, y, w, h, color, alpha) {
  if (alpha <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  glow(ctx, x, y, h * 3, color, alpha * 0.5);
  ctx.restore();
}

/* fog banks — pre-rendered soft blobs, deterministic drift */
const FOG = pool(9182, 26, r => ({
  x: r() * 2200 - 140, y: r() * 900 - 40, s: 260 + r() * 520,
  sp: 4 + r() * 14, ph: r() * 6.28, a: 0.05 + r() * 0.11
}));
function fogBank(ctx, t, color, amount, yc = 0.5) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of FOG) {
    const x = f.x + Math.sin(t * 0.13 + f.ph) * 60 + t * f.sp * 0.5;
    const y = f.y * 0.6 + V.H * yc * 0.6 + Math.cos(t * 0.11 + f.ph) * 26;
    glow(ctx, (x % 2300) - 190, y, f.s, color, f.a * amount, 2);
  }
  ctx.restore();
}

/* particle field (rising motes) */
const MOTES = pool(4471, 260, r => ({
  x: r() * V.W, y: r() * V.H, s: 0.6 + r() * 2.4, sp: 4 + r() * 26,
  ph: r() * 6.28, dr: 6 + r() * 26
}));
function motes(ctx, t, color, amount, speed = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of MOTES) {
    const y = ((m.y - t * m.sp * speed) % (V.H + 120) + V.H + 120) % (V.H + 120) - 60;
    const x = m.x + Math.sin(t * 0.5 + m.ph) * m.dr;
    const tw = 0.45 + 0.55 * Math.sin(t * 2.1 + m.ph * 3);
    glow(ctx, x, y, m.s * 7, color, 0.20 * amount * tw);
    ctx.fillStyle = rgba(color, 0.5 * amount * tw);
    ctx.fillRect(x - m.s / 2, y - m.s / 2, m.s, m.s);
  }
  ctx.restore();
}

/* digital rain (background texture, very low opacity) */
const RAIN_COLS = pool(7712, 90, r => ({
  x: r(), sp: 40 + r() * 160, ph: r() * 100, len: 8 + Math.floor(r() * 22), sz: 9 + r() * 5
}));
const GLYPHS = '01ΩΣΔ▲△◇+×⌁⎔0110';
function digitalRain(ctx, t, amount) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.font = `400 12px 'JetBrains Mono'`;
  ctx.textAlign = 'center';
  for (let i = 0; i < RAIN_COLS.length; i++) {
    const col = RAIN_COLS[i];
    const x = col.x * V.W;
    const head = ((t * col.sp + col.ph * 30) % (V.H + 420)) - 210;
    for (let k = 0; k < col.len; k++) {
      const y = head - k * 15;
      if (y < -20 || y > V.H + 20) continue;
      const a = (1 - k / col.len) * amount * 0.5;
      const gi = (i * 7 + k * 3 + Math.floor(t * 6 + i)) % GLYPHS.length;
      ctx.fillStyle = rgba(k === 0 ? C.white : C.cyan, a);
      ctx.fillText(GLYPHS[gi], x, y);
    }
  }
  ctx.restore();
}

/* ---------- 3D helpers ---------- */
function rotY(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}
function rotX(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}
function project(p, fov, cz) {
  const z = p[2] + cz;
  if (z <= 1) return null;
  const k = fov / z;
  return [V.W / 2 + p[0] * k, V.H / 2 + p[1] * k, k, z];
}

/* ---------- film-scanline / interference for holo panels ---------- */
function holoScan(ctx, x, y, w, h, t, alpha = 0.16, speed = 90) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(C.blueLt, alpha * 0.35);
  for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 1);
  const sy = y + ((t * speed) % (h + 60)) - 30;
  const g = ctx.createLinearGradient(0, sy - 30, 0, sy + 30);
  g.addColorStop(0, rgba(C.white, 0));
  g.addColorStop(0.5, rgba(C.white, alpha));
  g.addColorStop(1, rgba(C.white, 0));
  ctx.fillStyle = g; ctx.fillRect(x, sy - 30, w, 60);
  ctx.restore();
}

/* ---------- virtual space transform ---------- */
function beginVirtual(ctx, opts = {}) {
  ctx.save();
  const zoom = (opts.zoom || 1);
  ctx.translate(DEV.W / 2, DEV.H / 2 + (opts.dy || 0) * VSCALE * zoom);
  ctx.scale(VSCALE * zoom, VSCALE * zoom);
  ctx.translate(-V.W / 2, -V.H / 2 + (VOFFY || 0));
}
function endVirtual(ctx) { ctx.restore(); }
