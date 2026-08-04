/* ============================================================
   SCENES B — S05 RESEARCH · S06 BUILD · S07 MARKET · S08 SELL
   ============================================================ */

/* ============================== S05 ============================== */
const CORRIDOR = pool(6612, 22, r => ({
  z: r(), h: 300 + r() * 300, w: 190 + r() * 150,
  y: -40 + r() * 90, kind: Math.floor(r() * 3), seed: r() * 100,
  title: 0
}));
const PANEL_TITLES = ['MARKET SCAN', 'COMPETITOR MATRIX', 'SIGNAL FEED', 'SENTIMENT', 'SUPPLY GRAPH',
  'PRICING MODEL', 'TAM / SAM', 'CHURN RISK', 'KEYWORD DELTA', 'DEMAND CURVE', 'COHORT 04', 'ROUTE PLAN'];

SCENES.S05 = {
  dur: 6,
  draw(ctx, lt) {
    const speed = 1 + eInCubic(clamp((lt - 4.6) / 1.4, 0, 1)) * 7;   // speed ramp out
    const travel = lt * 300 + Math.pow(clamp(lt - 4.6, 0, 2), 2) * 620;
    const dutch = 0.052;

    bgGrad(ctx, [[0, '#01030A'], [0.5, '#020615'], [1, '#00020A']]);

    ctx.save();
    ctx.translate(V.W / 2, V.H / 2); ctx.rotate(dutch); ctx.translate(-V.W / 2, -V.H / 2);

    // far digital rain
    ctx.save(); ctx.globalAlpha = 0.5; digitalRain(ctx, lt, 0.15); ctx.restore();

    // floor reflection strip
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = -1; i < 7; i++) glow(ctx, i * 330 + 120, V.H * 1.02, 520, '#0B3E92', 0.26, 2);
    const flg = ctx.createLinearGradient(0, 0, V.W, 0);
    flg.addColorStop(0, rgba(C.blue, 0)); flg.addColorStop(0.5, rgba('#4FA0FF', 0.22)); flg.addColorStop(1, rgba(C.blue, 0));
    ctx.fillStyle = flg; ctx.fillRect(-400, V.H * 0.80, V.W + 800, 1);
    ctx.restore();

    // corridor panels (parallax by depth)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sorted = CORRIDOR.map((p, i) => ({ p, i })).sort((a, b) => b.p.z - a.p.z);
    for (const { p, i } of sorted) {
      const depth = 0.28 + p.z * 1.25;                    // parallax factor
      const scale = lerp(1.5, 0.45, p.z);
      const span = 360;
      let x = ((i * span - travel * depth * 0.55) % (span * CORRIDOR.length));
      if (x < -700) x += span * CORRIDOR.length;
      x = x - 200;
      const w = p.w * scale, h = p.h * scale;
      const y = V.H / 2 + p.y * scale - 20;
      if (x < -w - 400 || x > V.W + 400) continue;

      const blur = p.z > 0.62 ? (p.z - 0.62) * 22 : (p.z < 0.18 ? (0.18 - p.z) * 40 : 0);
      ctx.save();
      ctx.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none';
      ctx.globalAlpha = lerp(1, 0.35, p.z);

      glassPanel(ctx, x, y - h / 2, w, h, { r: 4, edgeA: 0.55 });
      // header
      T(ctx, PANEL_TITLES[i % PANEL_TITLES.length], x + 12 * scale, y - h / 2 + 22 * scale, {
        mono: true, size: 12 * scale, weight: 500, ls: 2.4 * scale, color: C.blueLt, alpha: 0.9
      });
      ctx.fillStyle = rgba(C.blue, 0.35);
      ctx.fillRect(x + 12 * scale, y - h / 2 + 30 * scale, w - 24 * scale, 1);

      // content — populated in cascade
      const fill = clamp((lt - 0.15 - (i % 6) * 0.09) / 0.9, 0, 1);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y - h / 2 + 34 * scale, w, h - 44 * scale); ctx.clip();
      if (p.kind === 0) {
        const n = 12;
        for (let k = 0; k < n; k++) {
          const kk = k / n;
          if (kk > fill) break;
          const bh = (0.15 + Math.abs(Math.sin(k * 1.7 + p.seed)) * 0.8) * (h - 70 * scale);
          ctx.fillStyle = rgba(k === n - 1 ? C.cyan : C.blue, 0.55);
          ctx.fillRect(x + 14 * scale + k * ((w - 28 * scale) / n), y + h / 2 - 20 * scale - bh,
            (w - 28 * scale) / n - 4 * scale, bh);
        }
      } else if (p.kind === 1) {
        ctx.strokeStyle = rgba(C.blueLt, 0.8); ctx.lineWidth = 1.6 * scale;
        ctx.beginPath();
        const N = 26;
        for (let k = 0; k <= N * fill; k++) {
          const px = x + 14 * scale + (k / N) * (w - 28 * scale);
          const py = y + h * 0.28 - (Math.sin(k * 0.55 + p.seed) * 0.28 + (k / N) * 0.72) * (h * 0.5);
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        T(ctx, '+18.4%', x + w - 14 * scale, y + h / 2 - 18 * scale, {
          mono: true, size: 16 * scale, weight: 500, align: 'right', color: C.cyan, alpha: fill
        });
      } else {
        const rows = Math.floor((h - 60 * scale) / (16 * scale));
        for (let k = 0; k < rows * fill; k++) {
          const on = ((lt * 2.4 + k + i) % 6) < 3.2;
          ctx.fillStyle = rgba(on ? C.blueLt : '#3A5A8E', on ? 0.7 : 0.35);
          ctx.fillRect(x + 14 * scale, y - h / 2 + 46 * scale + k * 16 * scale,
            (w - 34 * scale) * (0.35 + ((k * 37 + i * 11) % 60) / 100), 2.6 * scale);
          ctx.fillStyle = rgba(C.cyan, 0.5);
          ctx.fillRect(x + w - 22 * scale, y - h / 2 + 46 * scale + k * 16 * scale, 6 * scale, 2.6 * scale);
        }
      }
      ctx.restore();

      holoScan(ctx, x, y - h / 2, w, h, lt + i, 0.10, 120);
      glow(ctx, x + w / 2, y, w * 0.9, C.blue, 0.10);
      ctx.restore();
    }
    ctx.restore();

    // two agents exchanging a light packet, mid-ground
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ax = 560 - (travel * 0.25) % 2400, bx = ax + 640;
    const ay = V.H * 0.66, by = V.H * 0.58;
    if (ax > -400 && ax < V.W + 400) {
      ctx.strokeStyle = rgba(C.blue, 0.35); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      glow(ctx, ax, ay, 60, C.cyan, 0.5); glow(ctx, ax, ay, 16, C.white, 0.8);
      glow(ctx, bx, by, 60, C.blue, 0.45); glow(ctx, bx, by, 14, C.white, 0.7);
      const q = (lt * 0.55) % 1;
      const px = lerp(ax, bx, q), py = lerp(ay, by, q);
      glow(ctx, px, py, 46, C.white, 0.75);
      // trail
      for (let k = 1; k < 8; k++) {
        const qq = clamp(q - k * 0.014, 0, 1);
        glow(ctx, lerp(ax, bx, qq), lerp(ay, by, qq), 30, C.cyan, 0.16 * (1 - k / 8));
      }
    }
    ctx.restore();

    ctx.restore();

    // label
    const la = ramp(lt, 0.7, 1.4) * (1 - ramp(lt, 4.4, 5.0));
    T(ctx, 'RESEARCH → DECIDE', V.W - 84, 96, {
      mono: true, size: 13, weight: 500, ls: 6, align: 'right', color: C.silver, alpha: 0.75 * la
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(C.cyan, 0.8 * la);
    ctx.fillRect(V.W - 84 - 6, 108, 6, 6);
    ctx.restore();

    // speed-ramp whip streaks
    const whip = clamp((lt - 5.2) / 0.8, 0, 1);
    if (whip > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of WHIP) {
        const y = s.y * V.H;
        const g = ctx.createLinearGradient(0, y, V.W, y);
        g.addColorStop(0, rgba(C.blue, 0));
        g.addColorStop(0.5, rgba(s.c ? C.white : C.blueLt, 0.30 * whip * s.a));
        g.addColorStop(1, rgba(C.blue, 0));
        ctx.fillStyle = g; ctx.fillRect(0, y, V.W, s.h * whip);
      }
      ctx.restore();
    }
  }
};
const WHIP = pool(4242, 26, r => ({ y: r(), h: 1 + r() * 7, a: 0.3 + r() * 0.7, c: r() > 0.7 }));

/* ============================== S06 ============================== */
const CODE_LINES = [
  ['const', ' swarm = ', 'await', ' titan.', 'spawn', '({'],
  ['  role: ', "'growth-engineer'", ','],
  ['  tools: [', "'repo'", ', ', "'deploy'", ', ', "'analytics'", '],'],
  ['  budget: ', '0', ','],
  ['});'],
  [''],
  ['// plan → build → verify → ship'],
  ['for', ' (', 'const', ' task ', 'of', ' plan.tasks) {'],
  ['  await', ' agent.', 'execute', '(task);'],
  ['  if', ' (task.', 'verified', ') queue.', 'ship', '(task);'],
  ['}'],
  [''],
  ['export default', ' async', ' function', ' main() {'],
  ['  const', ' site = ', 'await', ' build.', 'compose', '({'],
  ['    theme: ', "'obsidian'", ', motion: ', 'true'],
  ['  });'],
  ['  await', ' deploy.', 'edge', '(site);'],
  ['  return', ' site.url;'],
  ['}'],
];
const CODE_COLORS = { kw: '#7AA6FF', str: '#FFB067', fn: '#4DE8E0', num: '#C792EA', com: '#42557A', def: '#A8BEDC' };
function codeColor(tok) {
  const t = tok.trim();
  if (/^\/\//.test(t)) return CODE_COLORS.com;
  if (/^'/.test(t)) return CODE_COLORS.str;
  if (/^(const|await|for|of|if|export default|async|function|return|true|false)$/.test(t)) return CODE_COLORS.kw;
  if (/^\d+$/.test(t)) return CODE_COLORS.num;
  if (/^(spawn|execute|ship|compose|edge|verified)$/.test(t)) return CODE_COLORS.fn;
  return CODE_COLORS.def;
}

SCENES.S06 = {
  dur: 5,
  draw(ctx, lt) {
    const pull = eInOutCubic(clamp((lt - 0.35) / 2.4, 0, 1));   // macro -> wide
    const zoom = lerp(2.35, 0.94, pull);

    bgGrad(ctx, [[0, '#01040A'], [0.5, '#02060F'], [1, '#000208']]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    fogBank(ctx, lt * 0.4 + 40, '#0B3E92', 0.35, 0.6);
    ctx.restore();

    // ---------- code slab ----------
    ctx.save();
    ctx.translate(V.W * 0.5, V.H * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-V.W * 0.5 - lerp(120, 250, pull), -V.H * 0.5);

    const lineH = 30;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glassPanel(ctx, 176, 96, 700, V.H - 192, { r: 5, edgeA: 0.34, alpha: 0.9 });
    ctx.restore();
    T(ctx, 'agent://build/main.ts', 200, 128, { mono: true, size: 13, ls: 2, color: C.blueLt, alpha: 0.8 });
    ctx.save();
    ctx.beginPath(); ctx.rect(176, 140, 700, V.H - 236); ctx.clip();
    const scroll = (lt * 210) % (CODE_LINES.length * lineH);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let rep = 0; rep < 2; rep++) {
      for (let i = 0; i < CODE_LINES.length; i++) {
        const y = 120 + i * lineH + rep * CODE_LINES.length * lineH - scroll;
        if (y < -40 || y > V.H + 40) continue;
        let x = 240;
        const written = clamp((lt * 3.4 - i * 0.05 - rep * 0.4), 0, 1);
        // line number
        T(ctx, String(i + 1 + rep * CODE_LINES.length).padStart(3, '0'), x - 34, y, {
          mono: true, size: 15, color: '#2C4166', alpha: 0.9, align: 'right'
        });
        for (const tok of CODE_LINES[i]) {
          const show = tok.slice(0, Math.ceil(tok.length * written));
          T(ctx, show, x, y, { mono: true, size: 17, weight: 400, color: codeColor(tok), alpha: 0.95 });
          x += textW(ctx, tok, { mono: true, size: 17 });
        }
      }
    }
    ctx.restore();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bridge = clamp((lt - 1.1) / 0.6, 0, 1);
    if (bridge > 0) {
      const bg2 = ctx.createLinearGradient(876, 0, 1240, 0);
      bg2.addColorStop(0, rgba(C.cyan, 0.30 * bridge));
      bg2.addColorStop(1, rgba(C.blue, 0));
      ctx.fillStyle = bg2; ctx.fillRect(876, V.H / 2 - 60, 364 * bridge, 120);
      for (let i = 0; i < 5; i++) {
        const q = ((lt * 0.9 + i * 0.2) % 1);
        glow(ctx, lerp(876, 1240, q), V.H / 2 + Math.sin(i * 2 + lt) * 24, 26, C.cyan, 0.34 * bridge * (1 - q));
      }
    }
    ctx.restore();
    ctx.restore();

    // ---------- site assembling in 3D layers ----------
    const bx = V.W * 0.68, by = V.H * 0.52;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(bx, by);
    ctx.scale(lerp(0.5, 1.0, pull), lerp(0.5, 1.0, pull));

    const parts = [
      { x: -230, y: -210, w: 460, h: 40, t: 1.30, kind: 'bar' },
      { x: -230, y: -160, w: 300, h: 120, t: 1.50, kind: 'hero' },
      { x: 90, y: -160, w: 140, h: 120, t: 1.66, kind: 'img' },
      { x: -230, y: -28, w: 140, h: 96, t: 1.80, kind: 'card' },
      { x: -80, y: -28, w: 140, h: 96, t: 1.92, kind: 'card' },
      { x: 70, y: -28, w: 160, h: 96, t: 2.04, kind: 'card' },
      { x: -230, y: 82, w: 460, h: 70, t: 2.18, kind: 'foot' },
    ];
    for (const p of parts) {
      const a = clamp((lt - p.t) / 0.42, 0, 1);
      if (a <= 0) continue;
      const e = eOutExpo(a);
      const z = (1 - e) * 260;                      // flies in from depth
      const s = 1 - (1 - e) * 0.25;
      const yy = p.y + (1 - e) * 44;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, 0); ctx.scale(s, s);
      // wireframe -> filled
      const solid = clamp((lt - p.t - 0.30) / 0.45, 0, 1);
      rrect(ctx, p.x, yy, p.w, p.h, 4);
      ctx.fillStyle = rgba(p.kind === 'hero' ? C.blue : '#12386E', 0.10 + solid * 0.24);
      ctx.fill();
      ctx.strokeStyle = rgba(C.blueLt, 0.75 - solid * 0.3);
      ctx.lineWidth = 1.2; ctx.stroke();
      if (solid > 0.15) {
        ctx.save();
        ctx.beginPath(); ctx.rect(p.x, yy, p.w, p.h); ctx.clip();
        ctx.globalAlpha = a * solid;
        if (p.kind === 'bar') {
          ctx.fillStyle = rgba(C.white, 0.55); ctx.fillRect(p.x + 14, yy + 17, 46, 6);
          for (let k = 0; k < 4; k++) { ctx.fillStyle = rgba(C.blueLt, 0.4); ctx.fillRect(p.x + p.w - 40 - k * 62, yy + 18, 38, 4); }
        } else if (p.kind === 'hero') {
          ctx.fillStyle = rgba(C.white, 0.65); ctx.fillRect(p.x + 18, yy + 26, 200, 12);
          ctx.fillStyle = rgba(C.white, 0.35); ctx.fillRect(p.x + 18, yy + 48, 150, 7);
          ctx.fillStyle = rgba(C.orange, 0.55); rrect(ctx, p.x + 18, yy + 74, 78, 22, 4); ctx.fill();
        } else if (p.kind === 'img') {
          for (let k = 0; k < 5; k++) { ctx.fillStyle = rgba(C.cyan, 0.14 + k * 0.05); ctx.fillRect(p.x + 8, yy + 10 + k * 21, p.w - 16, 15); }
        } else if (p.kind === 'card') {
          ctx.fillStyle = rgba(C.blueLt, 0.5); ctx.fillRect(p.x + 12, yy + 16, 44, 6);
          for (let k = 0; k < 3; k++) { ctx.fillStyle = rgba(C.white, 0.22); ctx.fillRect(p.x + 12, yy + 34 + k * 12, p.w - 40 + k * 8, 4); }
        } else {
          for (let k = 0; k < 4; k++) { ctx.fillStyle = rgba(C.white, 0.18); ctx.fillRect(p.x + 16 + k * 110, yy + 22, 74, 4); }
        }
        ctx.restore();
      }
      // snap sparks
      const sp = (lt - p.t) / 0.3;
      if (sp > 0 && sp < 1) {
        for (let k = 0; k < 8; k++) {
          const ang = k / 8 * 6.2832;
          const rr = sp * 40;
          glow(ctx, p.x + p.w / 2 + Math.cos(ang) * rr, yy + p.h / 2 + Math.sin(ang) * rr * 0.6, 16, C.cyan, 0.5 * (1 - sp));
        }
      }
      ctx.restore();
    }
    glow(ctx, 0, -40, 400, C.blue, 0.13);
    ctx.restore();

    // DEPLOYED flash
    const dep = clamp((lt - 3.75) / 0.25, 0, 1) * (1 - clamp((lt - 4.75) / 0.25, 0, 1));
    if (dep > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bw = 300, bh = 46, bxx = V.W / 2 - bw / 2, byy = V.H - 148;
      rrect(ctx, bxx, byy, bw, bh, 4);
      ctx.fillStyle = rgba(C.green, 0.14 * dep); ctx.fill();
      ctx.strokeStyle = rgba(C.green, 0.7 * dep); ctx.lineWidth = 1; ctx.stroke();
      T(ctx, 'DEPLOYED · 00:00:04', V.W / 2, byy + 30, {
        mono: true, size: 17, weight: 500, ls: 3, align: 'center', color: '#B4FFD8', alpha: dep
      });
      glow(ctx, V.W / 2, byy + bh / 2, 260, C.green, 0.16 * dep);
      ctx.restore();
    }

    // label
    T(ctx, 'BUILD', 84, 96, {
      mono: true, size: 13, weight: 500, ls: 6, color: C.silver,
      alpha: 0.7 * ramp(lt, 0.4, 1.0) * (1 - ramp(lt, 4.5, 4.95))
    });
  }
};

/* ============================== S07 ============================== */
const CARDS = pool(1717, 260, r => ({
  ang: r() * Math.PI * 2, sp: 260 + r() * 620, t0: 0.15 + r() * 3.9,
  s: 0.55 + r() * 0.9, spin: (r() - 0.5) * 2, kind: Math.floor(r() * 4), lift: r()
}));

SCENES.S07 = {
  dur: 5,
  draw(ctx, lt) {
    // camera pitch: 88° (top-down) -> 14° (horizon)
    const pitch = lerp(1.48, 0.24, eInOutCubic(clamp((lt - 0.2) / 3.6, 0, 1)));
    const boom = lerp(1.15, 0.82, eInOutCubic(clamp(lt / 4.2, 0, 1)));
    const cz = lerp(1500, 1150, eInOutCubic(clamp(lt / 4.2, 0, 1)));
    const horizon = V.H * lerp(0.5, 0.42, eInOutCubic(clamp((lt - 0.2) / 3.6, 0, 1)));

    bgGrad(ctx, [[0, '#0A0400'], [0.42, '#14070A'], [1, '#03010A']]);

    // warm horizon haze once tilted
    const tilt = 1 - inv(0.24, 1.48, pitch);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createLinearGradient(0, horizon - 300, 0, horizon + 460);
    hg.addColorStop(0, rgba(C.orange, 0));
    hg.addColorStop(0.42, rgba(C.orange, 0.15 * tilt));
    hg.addColorStop(0.62, rgba('#FF5A12', 0.07 * tilt));
    hg.addColorStop(1, rgba('#FF3D00', 0));
    ctx.fillStyle = hg; ctx.fillRect(-500, horizon - 300, V.W + 1000, 760);
    fogBank(ctx, lt * 0.5 + 60, '#8A3B08', 0.45, 0.55);
    ctx.restore();

    const proj = (x, y, z) => {
      // world plane (x,z) with height y ; camera pitched
      let p = [x, y, z];
      p = rotX(p, pitch);
      const d = p[2] + cz;
      if (d <= 40) return null;
      const k = (860 * boom) / d;
      return [V.W / 2 + p[0] * k, horizon + p[1] * k, k, d];
    };

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // ground grid
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      let started = false;
      for (let z = -900; z <= 2600; z += 175) {
        const p = proj(i * 240, 0, z);
        if (!p) { started = false; continue; }
        started ? ctx.lineTo(p[0], p[1]) : (ctx.moveTo(p[0], p[1]), started = true);
      }
      ctx.strokeStyle = rgba('#FF8A3D', 0.10);
      ctx.stroke();
    }

    // hub
    const hub = proj(0, 0, 0);
    if (hub) {
      const hp = 0.8 + 0.2 * Math.sin(lt * 6.2);
      glow(ctx, hub[0], hub[1], 230 * hub[2] * 1.4, C.orange, 0.26 * hp);
      glow(ctx, hub[0], hub[1], 72 * hub[2] * 1.4, '#FFD3A8', 0.34 * hp);
      glow(ctx, hub[0], hub[1], 16 * hub[2] * 1.4, C.white, 0.75);
      // emission rings on the beat
      for (let b = 0; b < 9; b++) {
        const q = (lt - (0.2 + b * 0.5)) / 1.5;
        if (q > 0 && q < 1) {
          ctx.strokeStyle = rgba(C.amber, 0.35 * (1 - q));
          ctx.lineWidth = 2.5 * (1 - q) + 0.4;
          ctx.beginPath();
          let st = false;
          for (let a = 0; a <= 6.35; a += 0.15) {
            const rr = q * 1500;
            const p = proj(Math.cos(a) * rr, 0, Math.sin(a) * rr);
            if (!p) { st = false; continue; }
            st ? ctx.lineTo(p[0], p[1]) : (ctx.moveTo(p[0], p[1]), st = true);
          }
          ctx.stroke();
        }
      }
    }

    // cards flying outward
    for (const c of CARDS) {
      const age = lt - c.t0;
      if (age <= 0) continue;
      const dist = age * c.sp;
      if (dist > 2400) continue;
      const x = Math.cos(c.ang) * dist, z = Math.sin(c.ang) * dist;
      const y = -Math.sin(clamp(dist / 2000, 0, 1) * Math.PI) * (60 + c.lift * 190);
      const p = proj(x, y, z);
      if (!p) continue;
      const fade = clamp(1 - dist / 2300, 0, 1) * clamp(age / 0.18, 0, 1);
      const k = p[2];
      const w = 44 * c.s * k * 1.7, h = 30 * c.s * k * 1.7;
      if (w < 0.8 || w > 190 || p[3] < 380 || dist < 210) continue;

      // motion trail
      const pPrev = proj(Math.cos(c.ang) * (dist - c.sp * 0.11), -Math.sin(clamp((dist - c.sp * 0.11) / 2000, 0, 1) * Math.PI) * (60 + c.lift * 190), Math.sin(c.ang) * (dist - c.sp * 0.11));
      if (pPrev) {
        const tg = ctx.createLinearGradient(pPrev[0], pPrev[1], p[0], p[1]);
        tg.addColorStop(0, rgba(C.orange, 0));
        tg.addColorStop(1, rgba(C.amber, 0.35 * fade));
        ctx.strokeStyle = tg; ctx.lineWidth = Math.max(0.6, h * 0.5);
        ctx.beginPath(); ctx.moveTo(pPrev[0], pPrev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p[0], p[1]);
      ctx.rotate(c.spin * 0.12);
      rrect(ctx, -w / 2, -h / 2, w, h, Math.max(1, 2 * k * 1.6));
      const cg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      cg.addColorStop(0, rgba('#FFD9B0', 0.30));
      cg.addColorStop(1, rgba(C.orange, 0.14));
      ctx.fillStyle = cg; ctx.fill();
      ctx.strokeStyle = rgba('#FFE3C4', 0.55); ctx.lineWidth = Math.max(0.4, 0.9 * k * 1.4);
      ctx.stroke();
      if (w > 22) {
        ctx.fillStyle = rgba(C.white, 0.5);
        ctx.fillRect(-w / 2 + w * 0.12, -h * 0.18, w * 0.5, Math.max(1, h * 0.08));
        ctx.fillStyle = rgba(C.white, 0.26);
        ctx.fillRect(-w / 2 + w * 0.12, h * 0.02, w * 0.68, Math.max(1, h * 0.06));
      }
      ctx.restore();
      glow(ctx, p[0], p[1], w * 1.4, C.orange, 0.075 * fade);
    }
    ctx.restore();

    // label + counter
    const la = ramp(lt, 1.5, 2.2) * (1 - ramp(lt, 4.5, 4.95));
    const count = Math.floor(eOutQuint(clamp((lt - 1.5) / 2.4, 0, 1)) * 10000);
    T(ctx, count.toLocaleString('en-US'), V.W / 2, V.H - 108, {
      mono: true, size: 44, weight: 500, ls: 2, align: 'center', color: C.white, alpha: la
    });
    T(ctx, 'ASSETS PUBLISHED / DAY', V.W / 2, V.H - 78, {
      size: 13, weight: 400, ls: 9, align: 'center', color: C.amber, alpha: 0.85 * la
    });

    // flare wipe out
    const fl = clamp((lt - 4.55) / 0.45, 0, 1);
    if (fl > 0) anamorphic(ctx, V.W / 2, V.H * 0.45, V.W * 2.4, 240 * fl, '#FFB067', 0.55 * fl);
  }
};

/* ============================== S08 ============================== */
SCENES.S08 = {
  dur: 5,
  draw(ctx, lt) {
    const push = eInOutCubic(clamp(lt / 5, 0, 1));
    const zoom = lerp(1.0, 1.075, push);
    const target = 1284930;
    const val = Math.floor(eOutQuint(clamp((lt - 0.25) / 3.1, 0, 1)) * target);
    const heartbeat = lt > 2.6 && lt < 4.1;

    bgGrad(ctx, [[0, '#00060A'], [0.5, '#01100C'], [1, '#000305']]);

    ctx.save();
    ctx.translate(V.W / 2, V.H / 2); ctx.scale(zoom, zoom); ctx.translate(-V.W / 2, -V.H / 2);

    // flanking agent pillars
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.floor(i / 2);
      const x = V.W / 2 + side * (430 + k * 140);
      const h = 260 - k * 26;
      const a = 0.18 - k * 0.026;
      const pulseA = 0.5 + 0.5 * Math.sin(lt * 2.2 + i);
      const g = ctx.createLinearGradient(0, V.H / 2 - h, 0, V.H / 2 + h);
      g.addColorStop(0, rgba(C.green, 0));
      g.addColorStop(0.5, rgba(C.green, a * (0.6 + 0.4 * pulseA)));
      g.addColorStop(1, rgba(C.green, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 3, V.H / 2 - h, 6, h * 2);
      glow(ctx, x, V.H / 2, 90, C.green, 0.10 * pulseA);
    }
    fogBank(ctx, lt * 0.3 + 80, '#0B5C3A', 0.16, 0.6);
    ctx.restore();

    // the monolith
    const mw = 900, mh = 300, mx = V.W / 2 - mw / 2, my = V.H / 2 - mh / 2 - 14;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glassPanel(ctx, mx, my, mw, mh, { r: 3, tint: '#0BE07E', edge: '#7BFFC4', edgeA: 0.32, alpha: 0.9 });
    // heat shimmer / refraction band
    const shim = ctx.createLinearGradient(mx, my, mx + mw, my);
    shim.addColorStop(0, rgba(C.green, 0));
    shim.addColorStop(clamp((lt * 0.28) % 1, 0.01, 0.99), rgba(C.green, 0.08));
    shim.addColorStop(1, rgba(C.green, 0));
    ctx.fillStyle = shim; ctx.fillRect(mx, my, mw, mh);
    ctx.restore();

    T(ctx, 'REVENUE', V.W / 2, my + 58, {
      size: 13, weight: 500, ls: 12, align: 'center', color: '#7BFFC4', alpha: 0.8 * ramp(lt, 0.1, 0.7)
    });

    const numStr = '$' + val.toLocaleString('en-US');
    const beat = heartbeat ? 1 + 0.012 * Math.sin(lt * 9) : 1;
    ctx.save();
    ctx.translate(V.W / 2, my + 168);
    ctx.scale(beat, beat);
    T(ctx, numStr, 0, -8, {
      mono: true, size: 104, weight: 500, ls: -1, align: 'center', color: C.white, alpha: ramp(lt, 0.2, 0.6)
    });
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, V.W / 2, my + 140, 520, C.green, 0.16 + (heartbeat ? 0.05 * Math.sin(lt * 9) : 0));
    ctx.restore();

    // sparkline + delta
    const spA = ramp(lt, 1.2, 2.0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(C.green, 0.75 * spA); ctx.lineWidth = 2;
    ctx.beginPath();
    const N = 40, prog = clamp((lt - 1.2) / 2.2, 0, 1);
    for (let i = 0; i <= N * prog; i++) {
      const x = mx + 90 + (i / N) * (mw - 180);
      const y = my + mh - 46 - (Math.pow(i / N, 1.6) * 0.62 + Math.sin(i * 0.8) * 0.05) * 74;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    T(ctx, '↑ 412%   ·   LAST 30 DAYS   ·   ZERO HEADCOUNT ADDED', V.W / 2, my + mh - 22, {
      mono: true, size: 13, ls: 3, align: 'center', color: '#8FF0C0', alpha: 0.6 * spA
    });

    ctx.restore();

    // sub-drop to black at the very end
    const drop = clamp((lt - 4.72) / 0.28, 0, 1);
    if (drop > 0) { ctx.fillStyle = rgba('#000000', eInExpo(drop)); fillAll(ctx, ctx.fillStyle); }
  }
};
