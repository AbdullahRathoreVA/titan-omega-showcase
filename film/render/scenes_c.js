/* ============================================================
   SCENES C — S09 GLOBAL · S10 07:12 · S11 LOGO · S12 CTA
   ============================================================ */

/* ---------- coarse land mask (lon/lat boxes) ---------- */
const LAND = [
  [-168, -140, 55, 72], [-140, -95, 50, 72], [-95, -60, 45, 70], [-125, -100, 32, 50],
  [-100, -75, 30, 49], [-85, -62, 40, 50], [-115, -97, 22, 32], [-105, -88, 15, 23],
  [-92, -77, 8, 18], [-58, -22, 60, 83], [-80, -74, 20, 24],
  [-80, -45, -5, 12], [-78, -35, -18, -5], [-73, -38, -30, -18], [-72, -50, -40, -30], [-73, -63, -55, -40],
  [-10, 30, 43, 60], [-9, 16, 36, 44], [5, 40, 55, 70], [-8, -1, 50, 58], [20, 45, 44, 60],
  [-17, 25, 12, 33], [25, 40, 8, 31], [-15, 20, -5, 12], [10, 42, -12, 8], [12, 40, -28, -12], [16, 33, -35, -28],
  [35, 60, 25, 40], [35, 58, 13, 27], [40, 90, 45, 72], [90, 140, 50, 72], [140, 180, 55, 70],
  [58, 90, 30, 48], [68, 90, 8, 30], [95, 125, 20, 45], [100, 110, 8, 20], [125, 145, 31, 45],
  [95, 140, -10, 8], [113, 153, -39, -11], [166, 178, -47, -34], [-180, 180, -90, -72],
];
function isLand(lon, lat) {
  for (const [a, b, c, d] of LAND) if (lon >= a && lon <= b && lat >= c && lat <= d) return true;
  return false;
}
const CITIES = [
  ['SFO', 37.77, -122.4], ['NYC', 40.71, -74.0], ['CHI', 41.88, -87.6], ['MEX', 19.43, -99.1],
  ['SAO', -23.55, -46.6], ['BOG', 4.7, -74.1], ['LON', 51.5, -0.12], ['PAR', 48.85, 2.35],
  ['BER', 52.52, 13.4], ['MAD', 40.4, -3.7], ['STO', 59.33, 18.07], ['DXB', 25.2, 55.27],
  ['LOS', 6.52, 3.37], ['JNB', -26.2, 28.04], ['CAI', 30.04, 31.24], ['MOW', 55.75, 37.62],
  ['DEL', 28.61, 77.2], ['BOM', 19.07, 72.87], ['SIN', 1.35, 103.8], ['HKG', 22.32, 114.17],
  ['SHA', 31.23, 121.47], ['TYO', 35.68, 139.69], ['SEL', 37.57, 126.98], ['SYD', -33.87, 151.2],
  ['AKL', -36.85, 174.76], ['LAX', 34.05, -118.24],
];
const ARCS = [[0, 6], [1, 6], [6, 15], [15, 16], [16, 18], [18, 21], [21, 23], [0, 25], [25, 4],
[6, 11], [11, 16], [4, 13], [13, 14], [1, 3], [3, 4], [20, 23], [19, 18], [22, 21], [7, 8], [24, 23], [17, 11], [9, 12]];

function sph(lat, lon, R) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  return [R * Math.cos(la) * Math.sin(lo), -R * Math.sin(la), R * Math.cos(la) * Math.cos(lo)];
}

const GLOBE_DOTS = (() => {
  const out = [];
  for (let lat = -88; lat <= 88; lat += 2.6) {
    const step = 2.6 / Math.max(0.18, Math.cos(lat * Math.PI / 180));
    for (let lon = -180; lon < 180; lon += step) {
      out.push({ lat, lon, land: isLand(lon, lat) });
    }
  }
  return out;
})();

/* ============================== S09 ============================== */
SCENES.S09 = {
  dur: 6,
  draw(ctx, lt) {
    const back = eInOutCubic(clamp(lt / 5.6, 0, 1));
    const R = lerp(520, 330, back);
    const spin = -1.15 + lt * 0.11;
    const tilt = -0.36 + Math.sin(lt * 0.1) * 0.03;
    const cx = V.W / 2 + lerp(-40, 60, back), cy = V.H / 2 + lerp(120, 40, back);

    bgGrad(ctx, [[0, '#00010A'], [0.5, '#01020E'], [1, '#000005']]);

    // starfield
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of STARS) {
      const tw = 0.4 + 0.6 * Math.sin(lt * 1.7 + s.p);
      ctx.fillStyle = rgba(s.w ? '#DDE9FF' : '#8FB6FF', s.a * tw);
      ctx.fillRect(s.x * V.W, s.y * V.H, s.r, s.r);
    }
    ctx.restore();

    const rot = (p) => rotX(rotY(p, spin), tilt);
    const cam = 1500;
    const pr = (p) => {
      const z = p[2] + cam;
      const k = 1150 / z;
      return [cx + p[0] * k, cy + p[1] * k, k, p[2]];
    };

    // atmosphere
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const atmoR = R * 1.22;
    const ag = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, atmoR);
    ag.addColorStop(0, rgba('#0A84FF', 0.0));
    ag.addColorStop(0.55, rgba('#1E7BFF', 0.18));
    ag.addColorStop(0.8, rgba('#4DE8E0', 0.10));
    ag.addColorStop(1, rgba('#0A84FF', 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, atmoR, 0, 6.2832); ctx.fill();
    ctx.restore();

    // planet body (dark)
    ctx.save();
    const bg2 = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
    bg2.addColorStop(0, '#071228');
    bg2.addColorStop(0.65, '#03060F');
    bg2.addColorStop(1, '#010206');
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
    ctx.restore();

    // dot surface
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sun = [-0.55, -0.35, 0.75];
    for (const d of GLOBE_DOTS) {
      const p0 = sph(d.lat, d.lon, R);
      const p = rot(p0);
      if (p[2] < -R * 0.05) continue;
      const P = pr(p);
      const n = [p[0] / R, p[1] / R, p[2] / R];
      const lam = clamp(n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2], -1, 1);
      const day = clamp(lam * 1.5 + 0.45, 0, 1);
      const edge = clamp((p[2] + R * 0.05) / (R * 0.5), 0, 1);
      if (d.land) {
        const a = (0.16 + day * 0.5) * edge;
        ctx.fillStyle = rgba(day > 0.55 ? '#9FD4FF' : '#2E6CC0', a);
        ctx.fillRect(P[0] - 1.1, P[1] - 1.1, 2.2, 2.2);
      } else {
        const a = (0.03 + day * 0.09) * edge;
        ctx.fillStyle = rgba('#0E4E9E', a);
        ctx.fillRect(P[0] - 0.9, P[1] - 0.9, 1.6, 1.6);
      }
    }
    ctx.restore();

    // city ignition
    const cityP = CITIES.map(([n, la, lo], i) => {
      const p = rot(sph(la, lo, R * 1.005));
      return { P: pr(p), z: p[2], n, i, on: clamp((lt - 0.35 - i * 0.11) / 0.4, 0, 1) };
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const c of cityP) {
      if (c.z < 0 || c.on <= 0) continue;
      const tw = 0.7 + 0.3 * Math.sin(lt * 3 + c.i);
      glow(ctx, c.P[0], c.P[1], 42 * c.on * c.P[2] * 1.4, C.cyan, 0.45 * c.on * tw);
      glow(ctx, c.P[0], c.P[1], 9 * c.on * c.P[2] * 1.4, C.white, 0.9 * c.on);
      const ring = (lt - 0.35 - c.i * 0.11) / 0.9;
      if (ring > 0 && ring < 1) {
        ctx.strokeStyle = rgba(C.white, 0.5 * (1 - ring)); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(c.P[0], c.P[1], ring * 46 * c.P[2] * 1.3, 0, 6.2832); ctx.stroke();
      }
    }

    // great-circle arcs
    for (let k = 0; k < ARCS.length; k++) {
      const [i, j] = ARCS[k];
      const t0 = 1.15 + k * 0.10;
      const draw = clamp((lt - t0) / 0.55, 0, 1);
      if (draw <= 0) continue;
      const A = sph(CITIES[i][1], CITIES[i][2], R), B = sph(CITIES[j][1], CITIES[j][2], R);
      ctx.beginPath();
      let started = false;
      const N = 34;
      for (let s = 0; s <= N * draw; s++) {
        const q = s / N;
        const m = [lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)];
        const len = Math.hypot(m[0], m[1], m[2]) || 1;
        const h = R * (1 + 0.20 * Math.sin(q * Math.PI));
        const p = rot([m[0] / len * h, m[1] / len * h, m[2] / len * h]);
        if (p[2] < -R * 0.2) { started = false; continue; }
        const P = pr(p);
        started ? ctx.lineTo(P[0], P[1]) : (ctx.moveTo(P[0], P[1]), started = true);
      }
      ctx.strokeStyle = rgba(k % 4 === 0 ? C.cyan : C.blueLt, 0.42 * draw);
      ctx.lineWidth = 1.3; ctx.stroke();
      // travelling packet
      if (draw >= 1) {
        const q = ((lt * 0.55 + k * 0.17) % 1);
        const m = [lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)];
        const len = Math.hypot(m[0], m[1], m[2]) || 1;
        const h = R * (1 + 0.20 * Math.sin(q * Math.PI));
        const p = rot([m[0] / len * h, m[1] / len * h, m[2] / len * h]);
        if (p[2] > -R * 0.2) {
          const P = pr(p);
          glow(ctx, P[0], P[1], 26, C.white, 0.7);
          glow(ctx, P[0], P[1], 60, C.cyan, 0.3);
        }
      }
    }
    ctx.restore();

    // terminator sheen + rim
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#63B8FF', 0.22); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    const rimg = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.05);
    rimg.addColorStop(0, rgba('#63B8FF', 0));
    rimg.addColorStop(0.5, rgba('#8FD0FF', 0.14));
    rimg.addColorStop(1, rgba('#63B8FF', 0));
    ctx.fillStyle = rimg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, 6.2832); ctx.fill();
    ctx.restore();

    // orbital rings
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 2; r++) {
      ctx.beginPath();
      let st = false;
      const RR = R * (1.30 + r * 0.16);
      for (let a = 0; a <= 6.35; a += 0.06) {
        const p = rot(rotX([Math.cos(a) * RR, 0, Math.sin(a) * RR], 0.5 + r * 0.35));
        const P = pr(p);
        const behind = p[2] < 0 && Math.hypot(P[0] - cx, P[1] - cy) < R;
        if (behind) { st = false; continue; }
        st ? ctx.lineTo(P[0], P[1]) : (ctx.moveTo(P[0], P[1]), st = true);
      }
      ctx.strokeStyle = rgba(C.blue, 0.16 - r * 0.05); ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();

    // sun flare entering right
    const flare = ramp(lt, 3.6, 5.2, smooth);
    if (flare > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fx = lerp(V.W + 200, V.W * 0.78, flare);
      glow(ctx, fx, V.H * 0.30, 460 * flare, '#FFD9A8', 0.34 * flare);
      glow(ctx, fx, V.H * 0.30, 130 * flare, C.white, 0.5 * flare);
      anamorphic(ctx, fx, V.H * 0.30, V.W * 2.0, 90, '#9FD0FF', 0.30 * flare);
      ctx.restore();
    }

    // blow out to white at the very end (cut into S10)
    const blow = clamp((lt - 5.55) / 0.45, 0, 1);
    if (blow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#EAF4FF', eInCubic(blow));
      fillAll(ctx, ctx.fillStyle);
      ctx.restore();
    }
  }
};
const STARS = pool(9911, 320, r => ({ x: r(), y: r(), r: r() > 0.9 ? 2 : 1, a: 0.15 + r() * 0.6, w: r() > 0.7, p: r() * 6.28 }));

/* ============================== S10 ============================== */
function drawPerson(ctx, x, y, s, sit, rim) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.translate(0, sit * 66);
  const body = '#070A10';

  // soft ambient separation from the wall
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 10, -150, 210, '#3A2A14', 0.45, 2);
  ctx.restore();

  ctx.fillStyle = body;
  // torso — shoulders wide, tapering to the desk line
  ctx.beginPath();
  ctx.moveTo(-16, -176);
  ctx.lineTo(16, -176);
  ctx.bezierCurveTo(52, -170, 74, -140, 82, -86);
  ctx.bezierCurveTo(88, -40, 90, 10, 92, 90);
  ctx.lineTo(-92, 90);
  ctx.bezierCurveTo(-90, 10, -88, -40, -82, -86);
  ctx.bezierCurveTo(-74, -140, -52, -170, -16, -176);
  ctx.closePath(); ctx.fill();

  // neck
  ctx.fillRect(-15, -196, 30, 26);
  // head
  ctx.beginPath(); ctx.ellipse(0, -222, 27, 31, 0, 0, 6.2832); ctx.fill();
  // slight hair mass
  ctx.beginPath(); ctx.ellipse(0, -232, 28, 26, 0, Math.PI, 0); ctx.fill();

  // rim light along the window-side edge
  ctx.strokeStyle = rgba(rim, 0.60); ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, -224, 27.5, 31, 0, -1.35, 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, -192);
  ctx.lineTo(17, -176);
  ctx.bezierCurveTo(52, -170, 74, -140, 82, -86);
  ctx.bezierCurveTo(88, -40, 90, 10, 92, 60);
  ctx.stroke();
  ctx.strokeStyle = rgba(rim, 0.16); ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(17, -176);
  ctx.bezierCurveTo(52, -170, 74, -140, 82, -86);
  ctx.bezierCurveTo(88, -40, 90, 10, 92, 60);
  ctx.stroke();
  ctx.restore();
}

SCENES.S10 = {
  dur: 5,
  draw(ctx, lt) {
    const fromWhite = 1 - clamp(lt / 0.55, 0, 1);
    const dawn = ramp(lt, 0.0, 1.6, eOutCubic);
    const walk = clamp((lt - 0.5) / 1.7, 0, 1);
    const sit = clamp((lt - 2.35) / 0.9, 0, 1);
    const fadeOut = clamp((lt - 4.45) / 0.55, 0, 1);

    drawRoom(ctx, lt, { warm: 1, dawn, noDesk: true });
    drawChair(ctx, { x: 1000, y: 520, s: 0.82, rim: '#FFC38A', rimA: 0.34, body: '#080604', bounce: '#3A2A14' });

    // sun beam through the window
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    lightCone(ctx, 1500, 180, Math.PI - 0.42, 0.22, 1500, '#FFB877', 0.30 * dawn);
    lightCone(ctx, 1420, 120, Math.PI - 0.30, 0.10, 1300, '#FFD3A0', 0.20 * dawn);
    // dust motes in the beam
    for (const m of DUST) {
      const px = 1500 - (m.d + (lt * m.sp) % 900) * 1.0;
      const py = 180 + (1500 - px) * 0.42 * m.o + Math.sin(lt * 0.6 + m.p) * 22;
      if (px < 120) continue;
      const tw = 0.35 + 0.65 * Math.sin(lt * 1.6 + m.p * 3);
      glow(ctx, px, py, m.r * 8, '#FFE0B8', 0.22 * tw * dawn);
    }
    ctx.restore();

    // founder walks in and sits — drawn behind the desk plane
    const px = lerp(1330, 1000, eInOutCubic(walk));
    const bob = Math.sin(walk * 22) * (1 - sit) * 5;
    drawPerson(ctx, px, 610 + bob, 0.95, sit, '#FFC38A');
    drawDesk(ctx, { warm: 1, dawn });
    drawMonitor(ctx, lt, { on: 1, done: true, content: false });

    // completed-work panel
    const pa = ramp(lt, 2.5, 3.3, eOutExpo);
    if (pa > 0) {
      const w = 380, h = 96, x = 150, y = 170;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glassPanel(ctx, x, y, w, h, { alpha: pa * 0.9, r: 4, tint: '#FFB877', edge: '#FFD8B0', edgeA: 0.4 });
      ctx.restore();
      T(ctx, 'OVERNIGHT', x + 22, y + 32, { mono: true, size: 11, ls: 6, color: '#FFD8B0', alpha: 0.75 * pa });
      const n = Math.floor(eOutQuint(clamp((lt - 2.7) / 1.2, 0, 1)) * 247);
      T(ctx, String(n), x + 22, y + 76, { mono: true, size: 42, weight: 500, color: C.white, alpha: pa });
      T(ctx, 'TASKS COMPLETE', x + 22 + textW(ctx, String(247), { mono: true, size: 42, weight: 500 }) + 18, y + 74,
        { size: 13, ls: 5, color: '#FFE0C0', alpha: 0.8 * pa });
    }

    // clock
    T(ctx, '07:12', 74, V.H - 52, { mono: true, size: 22, ls: 3, color: C.warm, alpha: 0.55 * dawn });
    T(ctx, 'LOCAL', 74, V.H - 78, { mono: true, size: 11, ls: 5, color: C.warm, alpha: 0.25 * dawn });

    if (fromWhite > 0) { ctx.fillStyle = rgba('#EAF4FF', fromWhite); fillAll(ctx, ctx.fillStyle); }
    if (fadeOut > 0) { ctx.fillStyle = rgba('#000000', eInCubic(fadeOut)); fillAll(ctx, ctx.fillStyle); }
  }
};
const DUST = pool(6363, 90, r => ({ d: r() * 900, sp: 8 + r() * 26, o: 0.5 + r() * 1.1, r: 0.5 + r() * 1.6, p: r() * 6.28 }));

/* ============================== S11 ============================== */
function wordmark(ctx, cx, cy, size, ls, alpha, sweep, sub, subAlpha) {
  // brushed-silver fill with travelling specular
  const str = 'TITAN OMEGA';
  const w = textW(ctx, str, { size, weight: 500, ls, display: true });
  const g = ctx.createLinearGradient(cx - w / 2, cy - size, cx + w / 2, cy + size * 0.4);
  const s = clamp(sweep, -0.4, 1.4);
  g.addColorStop(0, '#8E97A6');
  g.addColorStop(clamp(s - 0.16, 0.001, 0.98), '#C4CAD4');
  g.addColorStop(clamp(s, 0.002, 0.985), '#FFFFFF');
  g.addColorStop(clamp(s + 0.16, 0.003, 0.99), '#C4CAD4');
  g.addColorStop(1, '#7E8796');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `500 ${size}px 'Inter Display','Inter'`;
  ctx.letterSpacing = ls + 'px';
  ctx.textAlign = 'center';
  ctx.fillStyle = g;
  ctx.fillText(str, cx + ls / 2, cy);
  ctx.restore();
  if (sub) {
    T(ctx, sub, cx, cy + size * 0.62, {
      size: size * 0.115, weight: 400, ls: size * 0.10, align: 'center', color: C.silver, alpha: subAlpha
    });
  }
}

SCENES.S11 = {
  dur: 5,
  draw(ctx, lt) {
    const push = clamp(lt / 5, 0, 1);
    fillAll(ctx, '#000000');

    // single top light
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const la = ramp(lt, 0.1, 1.6);
    const g = ctx.createRadialGradient(V.W / 2, V.H * 0.36, 20, V.W / 2, V.H * 0.36, 900);
    g.addColorStop(0, rgba('#123A70', 0.42 * la));
    g.addColorStop(0.5, rgba('#0B2246', 0.14 * la));
    g.addColorStop(1, rgba('#000000', 0));
    ctx.fillStyle = g; fillAll(ctx, g);
    fogBank(ctx, lt * 0.25 + 120, '#12386E', 0.30 * la, 0.55);
    ctx.restore();

    const size = 92 * (1 + push * 0.012);
    const ls = lerp(30, 20, eOutExpo(clamp(lt / 1.6, 0, 1)));
    const cy = V.H * 0.5;

    // per-letter reveal
    const str = 'TITAN OMEGA';
    const reveal = clamp((lt - 0.25) / (str.length * 0.06 + 0.5), 0, 1);
    ctx.save();
    if (reveal < 1) {
      // masked reveal: draw letters progressively
      const chars = [...str];
      const total = textW(ctx, str, { size, weight: 500, ls, display: true });
      let x = V.W / 2 - total / 2 + ls / 2;
      chars.forEach((ch, i) => {
        const a = clamp((lt - 0.25 - i * 0.06) / 0.5, 0, 1);
        const w = textW(ctx, ch, { size, weight: 500, ls, display: true }) + ls;
        if (a > 0) {
          ctx.save();
          ctx.globalAlpha = eOutExpo(a);
          ctx.font = `500 ${size}px 'Inter Display','Inter'`;
          ctx.letterSpacing = ls + 'px';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#C4CAD4';
          ctx.fillText(ch, x, cy + (1 - eOutExpo(a)) * 9);
          ctx.restore();
        }
        x += w;
      });
    } else {
      wordmark(ctx, V.W / 2, cy, size, ls, 1, (lt - 2.5) / 1.6, null, 0);
    }
    ctx.restore();

    // sub-line
    const sa = ramp(lt, 1.5, 2.4);
    T(ctx, 'AUTONOMOUS BUSINESS OPERATING SYSTEM', V.W / 2, cy + 58, {
      size: 13, weight: 400, ls: 9.5, align: 'center', color: C.silver, alpha: 0.72 * sa
    });
    // hairline
    const hw = ramp(lt, 1.2, 2.6, eOutExpo) * 560;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createLinearGradient(V.W / 2 - hw / 2, 0, V.W / 2 + hw / 2, 0);
    hg.addColorStop(0, rgba(C.blue, 0)); hg.addColorStop(0.5, rgba('#7FC4FF', 0.55)); hg.addColorStop(1, rgba(C.blue, 0));
    ctx.fillStyle = hg; ctx.fillRect(V.W / 2 - hw / 2, cy + 24, hw, 1);
    ctx.restore();

    // light sweep across the mark
    const sw = clamp((lt - 2.6) / 1.1, 0, 1);
    if (sw > 0 && sw < 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const x = lerp(V.W * 0.2, V.W * 0.8, sw);
      ctx.save();
      ctx.translate(x, cy - 26); ctx.scale(1, 0.34);
      glow(ctx, 0, 0, 300, '#FFFFFF', 0.16 * Math.sin(sw * Math.PI), 2);
      ctx.restore();
      anamorphic(ctx, x, cy - 16, 900, 20, '#BFE0FF', 0.22 * Math.sin(sw * Math.PI));
      ctx.restore();
    }

    if (lt < 0.35) { ctx.fillStyle = rgba('#000000', 1 - lt / 0.35); fillAll(ctx, ctx.fillStyle); }
  }
};

/* ============================== S12 ============================== */
SCENES.S12 = {
  dur: 3,
  draw(ctx, lt) {
    fillAll(ctx, '#000000');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(V.W / 2, V.H * 0.42, 20, V.W / 2, V.H * 0.42, 820);
    g.addColorStop(0, rgba('#0E2E5C', 0.30));
    g.addColorStop(1, rgba('#000000', 0));
    ctx.fillStyle = g; fillAll(ctx, g);
    ctx.restore();

    const cy = V.H * 0.40;
    wordmark(ctx, V.W / 2, cy, 46, 12, 1, 0.5, null, 0);

    const a = ramp(lt, 0.25, 1.0, eOutExpo);
    T(ctx, 'titanomega.ai', V.W / 2, cy + 96, {
      size: 30, weight: 400, ls: 3, align: 'center', color: C.white, alpha: a
    });
    // caret callback to S02
    const blink = (lt % 1.1) < 0.6 ? 1 : 0.15;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cw = textW(ctx, 'titanomega.ai', { size: 30, ls: 3 });
    ctx.fillStyle = rgba(C.blueLt, 0.9 * a * blink);
    ctx.fillRect(V.W / 2 + cw / 2 + 10, cy + 74, 13, 26);
    glow(ctx, V.W / 2 + cw / 2 + 16, cy + 87, 60, C.blue, 0.30 * a * blink);
    ctx.restore();

    const b = ramp(lt, 0.7, 1.4, eOutExpo);
    const bw = 260, bh = 46;
    ctx.save();
    rrect(ctx, V.W / 2 - bw / 2, cy + 132, bw, bh, 3);
    ctx.strokeStyle = rgba(C.silver, 0.42 * b); ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    T(ctx, 'BOOK A BUILD  →', V.W / 2, cy + 162, {
      size: 14, weight: 500, ls: 6, align: 'center', color: C.white, alpha: 0.92 * b
    });

    const fade = clamp((lt - 2.45) / 0.55, 0, 1);
    if (fade > 0) { ctx.fillStyle = rgba('#000000', eInCubic(fade)); fillAll(ctx, ctx.fillStyle); }
  }
};
