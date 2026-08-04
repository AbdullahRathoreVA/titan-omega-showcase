/* ============================================================
   SCENES A — S01 EMPTY CHAIR · S02 SOMETHING TYPED
              S03 THE WAKE   · S04 GENESIS
   ============================================================ */

const SCENES = {};

/* fill beyond virtual bounds so device canvas is always covered */
function fillAll(ctx, style) {
  ctx.fillStyle = style;
  ctx.fillRect(-2400, -2400, V.W + 4800, V.H + 4800);
}
function bgGrad(ctx, stops) {
  const g = ctx.createLinearGradient(0, -600, 0, V.H + 600);
  for (const [p, c] of stops) g.addColorStop(p, c);
  fillAll(ctx, g);
}

/* ---------- shared: the room ---------- */
// warm=0 -> night/blue ; warm=1 -> dawn
function drawRoom(ctx, t, o = {}) {
  const warm = o.warm || 0;
  const key = warm > 0.5 ? C.warm : '#7FB6FF';

  bgGrad(ctx, [[0, '#020306'], [0.55, warm > 0.5 ? '#0A0805' : '#04060D'], [1, '#000000']]);

  // ---- window (right) with rain / dawn light
  const wx = 1180, wy = 30, ww = 640, wh = 540;
  ctx.save();
  ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  const wg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  if (warm > 0.5) {
    wg.addColorStop(0, rgba('#FFB877', 0.30 * o.dawn));
    wg.addColorStop(0.45, rgba('#FF9245', 0.22 * o.dawn));
    wg.addColorStop(1, rgba('#2A1608', 0.16 * o.dawn));
  } else {
    wg.addColorStop(0, rgba('#0B1832', 0.85));
    wg.addColorStop(1, rgba('#050A16', 0.9));
  }
  ctx.fillStyle = wg; ctx.fillRect(wx, wy, ww, wh);

  if (warm < 0.5) {
    // distant city bokeh
    for (const b of ROOM_BOKEH) {
      glow(ctx, wx + b.x * ww, wy + wh * 0.55 + b.y * wh * 0.4, b.r,
        b.w ? '#FFCE8A' : '#78B0FF', b.a * (0.5 + 0.5 * Math.sin(t * 1.3 + b.p)));
    }
    // rain streaks on glass
    ctx.globalCompositeOperation = 'lighter';
    for (const r of RAIN) {
      const y = wy + ((r.y * wh + t * r.sp * 40) % (wh + 90)) - 45;
      const x = wx + r.x * ww + Math.sin(y * 0.02 + r.p) * 3;
      const g2 = ctx.createLinearGradient(x, y, x, y + r.l);
      g2.addColorStop(0, rgba('#9CC8FF', 0));
      g2.addColorStop(0.5, rgba('#9CC8FF', 0.20 * r.a));
      g2.addColorStop(1, rgba('#9CC8FF', 0));
      ctx.fillStyle = g2; ctx.fillRect(x, y, r.w, r.l);
    }
    // droplets
    for (const d of DROPS) {
      glow(ctx, wx + d.x * ww, wy + d.y * wh, d.r * 3, '#8FC0FF', 0.10 * d.a);
    }
  } else {
    // dawn sun bloom through glass
    glow(ctx, wx + ww * 0.62, wy + wh * 0.30, 420, '#FFC888', 0.42 * o.dawn);
    glow(ctx, wx + ww * 0.62, wy + wh * 0.30, 170, '#FFF0DC', 0.5 * o.dawn);
  }
  ctx.restore();

  // window frame
  ctx.strokeStyle = rgba('#0A0F1C', 1); ctx.lineWidth = 10;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.strokeStyle = rgba(key, warm > 0.5 ? 0.22 * o.dawn : 0.10); ctx.lineWidth = 1.5;
  ctx.strokeRect(wx + 5, wy + 5, ww - 10, wh - 10);
  ctx.fillStyle = rgba('#05070C', 1);
  ctx.fillRect(wx + ww / 2 - 5, wy, 10, wh);

  // ---- back wall: dark, but with a readable falloff so the room has volume
  ctx.save();
  const wallG = ctx.createLinearGradient(0, 0, 900, V.H);
  wallG.addColorStop(0, warm > 0.5 ? 'rgba(20,13,6,0.55)' : 'rgba(6,9,18,0.55)');
  wallG.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = wallG; ctx.fillRect(-300, -200, wx + 300, V.H + 200);
  // soft wash of the key light on the wall behind the desk
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, warm > 0.5 ? 980 : 560, 330, 620, warm > 0.5 ? '#6B4A22' : '#12294F', warm > 0.5 ? 0.5 * o.dawn : 0.55, 2);
  glow(ctx, 300, 520, 460, warm > 0.5 ? '#3A2A14' : '#0C1D3C', 0.4, 2);
  ctx.restore();

  if (!o.noDesk) drawDesk(ctx, o);
}

function drawDesk(ctx, o = {}) {
  const warm = o.warm || 0;
  const key = warm > 0.5 ? C.warm : '#7FB6FF';
  const dy = 596;
  const dg = ctx.createLinearGradient(0, dy, 0, V.H);
  dg.addColorStop(0, warm > 0.5 ? '#14100C' : '#070A11');
  dg.addColorStop(0.35, warm > 0.5 ? '#0A0806' : '#03050A');
  dg.addColorStop(1, '#000000');
  ctx.fillStyle = dg; ctx.fillRect(-300, dy, V.W + 600, V.H - dy + 300);
  // desk edge highlight
  const eg = ctx.createLinearGradient(0, 0, V.W, 0);
  eg.addColorStop(0, rgba(key, 0));
  eg.addColorStop(0.30, rgba(key, warm > 0.5 ? 0.26 * o.dawn : 0.34));
  eg.addColorStop(0.62, rgba(key, warm > 0.5 ? 0.14 * o.dawn : 0.10));
  eg.addColorStop(1, rgba(key, 0));
  ctx.fillStyle = eg; ctx.fillRect(-300, dy, V.W + 600, 1.6);

  // keyboard on the desk (ties S01 to S02)
  ctx.save();
  ctx.translate(470, 628);
  ctx.fillStyle = warm > 0.5 ? '#0B0906' : '#05070C';
  rrect(ctx, -170, -14, 340, 62, 6); ctx.fill();
  ctx.strokeStyle = rgba(key, warm > 0.5 ? 0.22 * o.dawn : 0.30); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-168, -12); ctx.lineTo(168, -12); ctx.stroke();
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = rgba(key, (warm > 0.5 ? 0.05 * o.dawn : 0.07) * (1 - r * 0.2));
      ctx.fillRect(-158 + i * 21.4, -6 + r * 16, 16, 11);
    }
  }
  ctx.restore();
}

const ROOM_BOKEH = pool(3301, 34, r => ({
  x: r(), y: r(), r: 6 + r() * 26, a: 0.10 + r() * 0.30, w: r() > 0.6, p: r() * 6.28
}));
const RAIN = pool(881, 120, r => ({
  x: r(), y: r(), l: 30 + r() * 110, w: 0.8 + r() * 1.2, sp: 0.5 + r() * 1.6, a: 0.3 + r() * 0.7, p: r() * 6.28
}));
const DROPS = pool(9091, 60, r => ({ x: r(), y: r(), r: 1 + r() * 3, a: 0.3 + r() * 0.7 }));

/* the monitor */
function drawMonitor(ctx, t, o = {}) {
  const x = 300, y = 316, w = 470, h = 278;
  const on = o.on === undefined ? 1 : o.on;
  // stand
  ctx.fillStyle = '#04060A';
  ctx.fillRect(x + w / 2 - 26, y + h, 52, 46);
  ctx.fillRect(x + w / 2 - 96, y + h + 44, 192, 8);
  // bezel
  ctx.fillStyle = '#070A11';
  rrect(ctx, x - 8, y - 8, w + 16, h + 16, 6); ctx.fill();
  // screen
  ctx.save();
  rrect(ctx, x, y, w, h, 3); ctx.clip();
  const sg = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  sg.addColorStop(0, rgba('#0C1E3C', 0.95 * on));
  sg.addColorStop(1, rgba('#04080F', 0.95 * on));
  ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
  // faint UI content
  ctx.globalCompositeOperation = 'lighter';
  if (o.content !== false) {
    for (let i = 0; i < 12; i++) {
      const ly = y + 26 + i * 19;
      const lw = SCREEN_LINES[i] * (w - 70);
      ctx.fillStyle = rgba(i === 0 ? C.blueLt : '#5C86C8', (i === 0 ? 0.55 : 0.20) * on);
      ctx.fillRect(x + 26, ly, lw, i === 0 ? 3 : 2);
    }
    // right column mini chart
    ctx.strokeStyle = rgba(C.blue, 0.35 * on); ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const px = x + w - 150 + i * 6, py = y + h - 60 - CHART_A[i] * 46;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  if (o.done) {
    // completed-work state (S10)
    for (let i = 0; i < 7; i++) {
      const ly = y + 30 + i * 34;
      ctx.fillStyle = rgba(C.green, 0.5);
      ctx.fillRect(x + 26, ly, 9, 9);
      ctx.fillStyle = rgba('#9DBBE8', 0.30);
      ctx.fillRect(x + 46, ly + 3, 120 + SCREEN_LINES[i] * 210, 3);
    }
  }
  ctx.restore();
  // screen glow spill
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + w / 2, y + h / 2, 420, '#2E6FD8', 0.30 * on);
  ctx.restore();
}
const SCREEN_LINES = pool(551, 16, r => 0.25 + r() * 0.7);
const CHART_A = pool(552, 30, r => r());

/* the empty chair (silhouette + rim) */
function drawChair(ctx, o = {}) {
  const x = o.x || 980, y = o.y || 470, s = o.s || 1;
  const rim = o.rim || '#6FA8FF';
  const rimA = o.rimA === undefined ? 0.55 : o.rimA;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  // ambient bounce so the silhouette separates from the wall
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, -30, -90, 260, o.bounce || '#0E2547', 0.5, 2);
  ctx.restore();
  ctx.fillStyle = o.body || '#090C13';

  // backrest (slightly turned)
  ctx.beginPath();
  ctx.moveTo(-74, -8);
  ctx.bezierCurveTo(-92, -120, -70, -212, -6, -222);
  ctx.bezierCurveTo(58, -230, 84, -140, 74, -14);
  ctx.bezierCurveTo(40, 6, -34, 8, -74, -8);
  ctx.closePath(); ctx.fill();
  // rim light on the left edge
  ctx.save();
  ctx.strokeStyle = rgba(rim, rimA); ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-73, -10);
  ctx.bezierCurveTo(-91, -120, -69, -211, -6, -221);
  ctx.stroke();
  ctx.strokeStyle = rgba(rim, rimA * 0.35); ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  // seat
  ctx.fillStyle = o.body || '#090C13';
  ctx.beginPath();
  ctx.moveTo(-104, 4); ctx.lineTo(104, 0);
  ctx.bezierCurveTo(120, 30, 108, 46, 84, 48);
  ctx.lineTo(-84, 52); ctx.bezierCurveTo(-114, 50, -122, 26, -104, 4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(rim, rimA * 0.5); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-104, 5); ctx.lineTo(104, 1); ctx.stroke();

  // gas stem
  ctx.fillStyle = o.body || '#090C13';
  ctx.fillRect(-11, 48, 22, 74);
  ctx.strokeStyle = rgba(rim, rimA * 0.35); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-10, 50); ctx.lineTo(-10, 120); ctx.stroke();

  // 5-star base
  ctx.strokeStyle = o.body || '#090C13'; ctx.lineWidth = 13; ctx.lineCap = 'round';
  const legs = [[-1.05, 84], [-0.35, 96], [0.35, 96], [1.05, 84], [Math.PI / 2, 66]];
  for (const [a, L] of legs) {
    ctx.beginPath(); ctx.moveTo(0, 122);
    ctx.lineTo(Math.sin(a) * L * 1.5, 122 + Math.cos(a) * L * 0.36 + 26);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================== S01 ============================== */
SCENES.S01 = {
  dur: 5,
  draw(ctx, lt) {
    const fadeIn = ramp(lt, 0, 1.1, eOutCubic);

    drawRoom(ctx, lt, { warm: 0, noDesk: true });
    drawChair(ctx, { x: 985, y: 442, s: 0.94, rimA: 0.6, body: '#080B12', bounce: '#0A1B33' });
    drawDesk(ctx, { warm: 0 });
    drawMonitor(ctx, lt, { on: 1 });

    // volumetric beam from monitor across the room
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    lightCone(ctx, 560, 452, 0.10, 0.24, 980, '#2C6FD0', 0.42);
    lightCone(ctx, 560, 452, Math.PI - 0.08, 0.20, 520, '#2C6FD0', 0.22);
    fogBank(ctx, lt * 0.3 + 4, '#1B4C96', 0.42, 0.62);
    // monitor reflection in the desk surface
    ctx.save();
    ctx.globalAlpha = 0.085;
    ctx.translate(0, 1204); ctx.scale(1, -0.5);
    ctx.filter = 'blur(13px)';
    drawMonitor(ctx, lt, { on: 1 });
    ctx.filter = 'none';
    ctx.restore();
    // pool of light on desk
    const pg = ctx.createRadialGradient(600, 606, 4, 600, 606, 520);
    pg.addColorStop(0, rgba('#2E6FD8', 0.30));
    pg.addColorStop(1, rgba('#2E6FD8', 0));
    ctx.fillStyle = pg; ctx.fillRect(60, 560, 1100, 240);
    ctx.restore();

    // coffee cup on desk (dead, cold)
    ctx.save();
    ctx.fillStyle = '#04060B';
    rrect(ctx, 812, 556, 46, 44, 4); ctx.fill();
    ctx.strokeStyle = rgba('#5E8FD8', 0.34); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(813, 558); ctx.lineTo(813, 598); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(835, 557, 23, 5, 0, Math.PI, 0); ctx.stroke();
    ctx.restore();

    // clock 03:46 -> 03:47
    const clock = lt < 1.6 ? '03:46' : '03:47';
    const tick = lt >= 1.6 && lt < 1.75 ? 0.9 : 0.4;
    T(ctx, clock, 74, V.H - 52, {
      mono: true, size: 22, weight: 400, ls: 3, color: C.silver, alpha: tick * fadeIn
    });
    T(ctx, 'LOCAL', 74, V.H - 78, {
      mono: true, size: 11, weight: 400, ls: 5, color: C.silver, alpha: 0.22 * fadeIn
    });

    // fade from black
    if (fadeIn < 1) { ctx.fillStyle = rgba('#000000', 1 - fadeIn); fillAll(ctx, ctx.fillStyle); }
  }
};

/* ============================== S02 ============================== */
const KEYS = (() => {
  const rows = [];
  const layout = [14, 13, 13, 12, 8];
  for (let r = 0; r < 5; r++) {
    const n = layout[r], row = [];
    for (let i = 0; i < n; i++) row.push({ i, n });
    rows.push(row);
  }
  return rows;
})();

SCENES.S02 = {
  dur: 4,
  draw(ctx, lt) {
    const press = clamp((lt - 1.15) / 0.10, 0, 1) * (1 - clamp((lt - 1.55) / 0.35, 0, 1));
    const blue = ramp(lt, 0.9, 3.6, smooth);
    const dolly = lt * 9;

    bgGrad(ctx, [[0, '#010205'], [0.5, '#02040A'], [1, '#000000']]);

    ctx.save();
    ctx.translate(-dolly, 0);

    // far rows -> near rows, with defocus
    const rows = 5;
    for (let r = rows - 1; r >= 0; r--) {
      const depth = r / (rows - 1);           // 1 = far
      const blurAmt = Math.pow(depth, 1.6) * 16 + (r === 1 ? 0 : 0);
      const focusRow = 1;
      const b = Math.abs(r - focusRow) * (r > focusRow ? 7.5 : 13);
      ctx.filter = b > 0.4 ? `blur(${b.toFixed(1)}px)` : 'none';

      const scale = lerp(1.35, 0.52, depth);
      const y = lerp(690, 250, depth);
      const kw = 116 * scale, kh = 104 * scale, gap = 13 * scale;
      const n = KEYS[r].length;
      const total = n * (kw + gap);
      const x0 = V.W / 2 - total / 2 + (r % 2) * 18 * scale + dolly * (0.35 + depth * 0.5);

      for (let i = 0; i < n; i++) {
        const kx = x0 + i * (kw + gap);
        const isHero = (r === focusRow && i === 6);
        const down = isHero ? press * 7 : 0;
        const ky = y + down;

        // key body
        ctx.fillStyle = '#080B12';
        rrect(ctx, kx, ky, kw, kh, 9 * scale); ctx.fill();
        // top face
        const tg = ctx.createLinearGradient(kx, ky, kx, ky + kh);
        tg.addColorStop(0, rgba('#161C28', 1 - down * 0.06));
        tg.addColorStop(0.55, rgba('#0B1018', 1));
        tg.addColorStop(1, rgba('#05080D', 1));
        ctx.fillStyle = tg;
        rrect(ctx, kx + 3 * scale, ky + 3 * scale, kw - 6 * scale, kh - 10 * scale, 7 * scale); ctx.fill();
        // edge light (from monitor, upper-left)
        ctx.strokeStyle = rgba('#4E8AE0', (0.30 + (isHero ? press * 0.5 : 0)) * (1 - depth * 0.5));
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(kx + 4 * scale, ky + kh - 12 * scale);
        ctx.lineTo(kx + 4 * scale, ky + 8 * scale);
        ctx.lineTo(kx + kw - 10 * scale, ky + 4 * scale);
        ctx.stroke();
        // legend
        ctx.filter = ctx.filter;
        T(ctx, KEYCAPS[(r * 14 + i) % KEYCAPS.length], kx + kw / 2, ky + kh / 2 + 6 * scale, {
          mono: true, size: 21 * scale, weight: 500, align: 'center',
          color: '#6E86A8', alpha: 0.35 * (1 - depth * 0.6)
        });

        if (isHero && press > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          glow(ctx, kx + kw / 2, ky + kh / 2, kw * 1.5, C.blue, 0.55 * press);
          ctx.strokeStyle = rgba(C.blueLt, 0.9 * press); ctx.lineWidth = 1.6 * scale;
          rrect(ctx, kx + 3 * scale, ky + 3 * scale, kw - 6 * scale, kh - 10 * scale, 7 * scale); ctx.stroke();
          ctx.restore();
        }
      }
    }
    ctx.filter = 'none';
    ctx.restore();

    // ambient blue rising
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ag = ctx.createLinearGradient(0, V.H, 0, 120);
    ag.addColorStop(0, rgba(C.blue, 0.16 * blue));
    ag.addColorStop(1, rgba(C.blue, 0));
    ctx.fillStyle = ag; fillAll(ctx, ag);
    fogBank(ctx, lt * 0.4, '#1B4C96', 0.5 * blue, 0.8);
    ctx.restore();

    // the line that writes itself
    const line = 'titan.omega > swarm.wake()';
    const n = Math.floor(clamp((lt - 1.5) / 1.05, 0, 1) * line.length);
    const shown = line.slice(0, n);
    const cw = textW(ctx, 'M', { mono: true, size: 30, ls: 4 });
    const totalW = textW(ctx, line, { mono: true, size: 30, ls: 4 });
    const tx = V.W / 2 - totalW / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    T(ctx, shown, tx, 152, { mono: true, size: 30, weight: 400, ls: 4, color: '#BFE0FF', alpha: 0.95 });
    // caret
    if (lt > 1.35 && (Math.floor(lt * 2.2) % 2 === 0 || n > 0)) {
      const cx = tx + textW(ctx, shown, { mono: true, size: 30, ls: 4 });
      ctx.fillStyle = rgba(C.blueLt, 0.9);
      ctx.fillRect(cx + 2, 130, cw * 0.7, 30);
      glow(ctx, cx + cw * 0.35, 145, 60, C.blue, 0.4);
    }
    ctx.restore();
  }
};
const KEYCAPS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];

/* ============================== S03 ============================== */
const WAKE_PANELS = pool(2211, 16, r => ({
  a: r() * Math.PI * 2, rad: 620 + r() * 520, h: 120 + r() * 190, w: 150 + r() * 190,
  y: -60 - r() * 250, t0: r() * 1.5, kind: Math.floor(r() * 3), seed: r() * 100
}));

SCENES.S03 = {
  dur: 5,
  draw(ctx, lt) {
    const crane = eInOutCubic(clamp(lt / 3.4, 0, 1));
    const arc = eInOutCubic(clamp(lt / 4.4, 0, 1));
    const dissolve = ramp(lt, 0.15, 1.5);
    const wipe = clamp((lt - 4.45) / 0.55, 0, 1);
    const hz = lerp(690, 545, crane);          // horizon line of the glass floor

    bgGrad(ctx, [[0, '#01020A'], [0.40, '#03071A'], [0.78, '#040B22'], [1, '#01030E']]);

    ctx.save();
    ctx.translate(V.W / 2, V.H / 2);
    ctx.scale(1 + crane * 0.10, 1 + crane * 0.10);
    ctx.translate(-V.W / 2, -V.H / 2 + crane * 120);

    // ---------- residual room, dissolving away ----------
    if (dissolve < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - dissolve;
      drawChair(ctx, { x: 985, y: 442, s: 0.94, rimA: 0.55, body: '#080B12' });
      drawDesk(ctx, { warm: 0 });
      drawMonitor(ctx, lt, { on: 1 });
      ctx.restore();
    }

    // ---------- the abyss below the glass ----------
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ab = ctx.createLinearGradient(0, hz - 40, 0, V.H + 260);
    ab.addColorStop(0, rgba('#0A3A8C', 0.0));
    ab.addColorStop(0.30, rgba('#0E56C0', 0.30 * dissolve));
    ab.addColorStop(0.75, rgba('#1E86FF', 0.20 * dissolve));
    ab.addColorStop(1, rgba('#0A3A8C', 0.02 * dissolve));
    ctx.fillStyle = ab; ctx.fillRect(-900, hz - 40, V.W + 1800, V.H + 300);
    glow(ctx, V.W / 2, hz + 210, 1000, '#1266DA', 0.30 * dissolve, 2);

    // perspective floor
    const rot = arc * 0.55;
    ctx.lineWidth = 1;
    for (let i = -30; i <= 30; i++) {
      const x = V.W / 2 + i * 116 + Math.sin(rot) * 200;
      ctx.globalAlpha = dissolve * (0.42 - Math.abs(i) * 0.012);
      if (ctx.globalAlpha <= 0.01) continue;
      ctx.strokeStyle = rgba('#5AB4FF', 1);
      ctx.beginPath();
      ctx.moveTo(V.W / 2 + (x - V.W / 2) * 0.03, hz);
      ctx.lineTo(V.W / 2 + (x - V.W / 2) * 4.2, V.H + 300);
      ctx.stroke();
    }
    for (let j = 1; j < 26; j++) {
      const p = j / 26;
      const y = hz + Math.pow(p, 2.6) * (V.H + 280 - hz);
      ctx.globalAlpha = dissolve * 0.30 * p;
      ctx.beginPath(); ctx.moveTo(-900, y); ctx.lineTo(V.W + 900, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // data strata drifting deep under the floor
    for (let k = 0; k < 30; k++) {
      const p = ((k / 30) + (lt * 0.05)) % 1;
      const y = hz + Math.pow(p, 2.0) * 500;
      const w = 260 + p * 1700;
      const a = dissolve * 0.22 * (1 - p) * (0.45 + 0.55 * Math.sin(k * 2.3 + lt));
      ctx.fillStyle = rgba(k % 3 === 0 ? C.cyan : C.blue, a);
      ctx.fillRect(V.W / 2 - w / 2 + Math.sin(k * 5.1) * 260, y, w, 1.4);
    }
    ctx.restore();

    // ---------- volumetric shafts rising through the room ----------
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = 250 + i * 360 + Math.sin(lt * 0.5 + i) * 26;
      lightCone(ctx, x, hz + 120, -Math.PI / 2 + (i - 2) * 0.045, 0.13, 900,
        i === 3 ? C.orange : '#2E7FE0', (i === 3 ? 0.55 : 0.75) * dissolve);
    }
    fogBank(ctx, lt * 0.5, '#15458E', 0.55 * dissolve, 0.6);
    ctx.restore();

    // ---------- holo panels resolving out of the fog, in a deliberate arc ----------
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const N = WAKE_PANELS.length;
    WAKE_PANELS.forEach((p, i) => {
      const t0 = 1.0 + i * 0.075;
      const a = ramp(lt, t0, t0 + 0.7, eOutExpo);
      if (a <= 0.01) return;
      // deterministic arc placement: fan out left/right, never dead centre
      const side = i % 2 ? 1 : -1;
      const rank = Math.floor(i / 2);                       // 0..N/2
      const ang = (rank / (N / 2)) * 1.15 + 0.22 + rot * 0.25;
      const depth = 0.55 + 0.45 * Math.cos(rank * 0.5);
      const x = V.W / 2 + side * Math.sin(ang) * (470 + rank * 145);
      const y = hz - 150 - Math.cos(rank * 0.8) * 130 - (i % 3) * 66 - crane * 40;
      const s = depth * lerp(0.88, 1.04, a);
      const w = p.w * s, h = p.h * s * 0.82;
      ctx.save();
      ctx.globalAlpha = a * (0.42 + depth * 0.58);
      ctx.filter = depth < 0.8 ? `blur(${((0.8 - depth) * 10).toFixed(1)}px)` : 'none';
      glassPanel(ctx, x - w / 2, y - h / 2, w, h, { alpha: 1, r: 4, edgeA: 0.55 });
      miniContent(ctx, x - w / 2 + 12 * s, y - h / 2 + 14 * s, w - 24 * s, h - 28 * s, p.kind, lt, p.seed, s);
      glow(ctx, x, y, w * 0.85, C.blue, 0.10);
      // reflection on the glass floor
      ctx.save();
      ctx.globalAlpha = a * 0.16 * depth;
      ctx.translate(0, (hz + 26) * 2);
      ctx.scale(1, -1);
      ctx.filter = 'blur(6px)';
      glassPanel(ctx, x - w / 2, y - h / 2, w, h, { alpha: 1, r: 4, edgeA: 0.4 });
      ctx.restore();
      ctx.filter = 'none';
      ctx.restore();
    });
    ctx.restore();

    // ---------- the core igniting under the floor ----------
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ig = ramp(lt, 2.3, 4.6, eInCubic);
    glow(ctx, V.W / 2, hz - 40, 140 + ig * 780, C.blue, 0.34 * ig, 2);
    glow(ctx, V.W / 2, hz - 40, 30 + ig * 150, '#CFE8FF', 0.40 * ig);
    for (let k = 0; k < 3; k++) {
      const q = ((lt * 0.5 + k / 3) % 1);
      ctx.strokeStyle = rgba(C.blueLt, 0.22 * ig * (1 - q));
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(V.W / 2, hz - 40, q * 1100, q * 300, 0, 0, 6.2832); ctx.stroke();
    }
    motes(ctx, lt + 8, C.blueLt, 0.55 * dissolve, 1.3);
    ctx.restore();

    ctx.restore();

    // ---------- light wipe out ----------
    if (wipe > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const x = -400 + wipe * (V.W + 900);
      const g = ctx.createLinearGradient(x - 460, 0, x + 180, 0);
      g.addColorStop(0, rgba(C.blue, 0));
      g.addColorStop(0.72, rgba('#7FC4FF', 0.6));
      g.addColorStop(0.94, rgba(C.white, 0.92));
      g.addColorStop(1, rgba(C.white, 0));
      ctx.fillStyle = g; fillAll(ctx, g);
      ctx.restore();
    }
  }
};

/* small holo panel contents used across scenes */
function miniContent(ctx, x, y, w, h, kind, t, seed, s = 1) {
  const r = mulberry32(Math.floor(seed * 1000));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (kind === 0) {              // bar chart
    const n = 9;
    for (let i = 0; i < n; i++) {
      const bh = (0.2 + r() * 0.8) * h * (0.55 + 0.45 * Math.sin(t * 1.5 + i));
      ctx.fillStyle = rgba(i === n - 1 ? C.cyan : C.blue, 0.55);
      ctx.fillRect(x + i * (w / n) + 2, y + h - bh, w / n - 5, bh);
    }
  } else if (kind === 1) {       // line chart
    ctx.strokeStyle = rgba(C.blueLt, 0.75); ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    for (let i = 0; i <= 22; i++) {
      const px = x + (i / 22) * w;
      const py = y + h * 0.75 - (Math.sin(i * 0.7 + seed) * 0.3 + i / 22 * 0.6) * h * 0.7;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
    ctx.fillStyle = rgba(C.blue, 0.14); ctx.fill();
  } else {                       // data rows
    const n = Math.max(3, Math.floor(h / (14 * s)));
    for (let i = 0; i < n; i++) {
      const on = ((t * 3 + i + seed) % 7) < 4;
      ctx.fillStyle = rgba(on ? C.blueLt : '#3E5C8C', on ? 0.6 : 0.3);
      ctx.fillRect(x, y + i * 14 * s, w * (0.3 + r() * 0.7), 2.2 * s);
    }
  }
  ctx.restore();
}

/* ============================== S04 ============================== */
const AGENTS = (() => {
  const N = 132, out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const r = mulberry32(31337);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    const shell = 300 + (i % 5) * 46 + r() * 40;
    out.push({
      p: [Math.cos(th) * rad * shell, y * shell * 0.72, Math.sin(th) * rad * shell],
      t0: i === 0 ? 0.15 : 0.55 + Math.pow(i / N, 0.62) * 3.25 + r() * 0.12,
      s: 0.6 + r() * 0.9, ph: r() * 6.28, big: i % 11 === 0
    });
  }
  return out;
})();
const AGENT_LINKS = (() => {
  const links = [];
  for (let i = 1; i < AGENTS.length; i++) {
    let best = [], a = AGENTS[i];
    for (let j = 0; j < AGENTS.length; j++) {
      if (i === j) continue;
      const b = AGENTS[j];
      const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
      best.push([d, j]);
    }
    best.sort((u, v) => u[0] - v[0]);
    for (let k = 0; k < 2; k++) links.push([i, best[k][1], best[k][0]]);
  }
  return links;
})();

SCENES.S04 = {
  dur: 6,
  draw(ctx, lt) {
    const push = eInOutCubic(clamp(lt / 6, 0, 1));
    const fov = lerp(760, 1080, push);
    const cz = lerp(1180, 980, push);
    const rot = lt * 0.16;
    const expand = eOutExpo(clamp(lt / 4.2, 0, 1));

    bgGrad(ctx, [[0, '#04010E'], [0.5, '#06021A'], [1, '#01000A']]);

    // ambient purple haze
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, V.W / 2, V.H / 2, 980, C.purple, 0.16 + 0.04 * Math.sin(lt * 1.5), 2);
    fogBank(ctx, lt * 0.35 + 20, '#2A0E6E', 0.34, 0.5);
    ctx.restore();

    // project all nodes
    const pts = AGENTS.map((a, i) => {
      const born = clamp((lt - a.t0) / 0.22, 0, 1);
      const grow = born <= 0 ? 0 : eOutBack(born);
      const scaleOut = lerp(0.22, 1.02, expand);
      let p = [a.p[0] * scaleOut, a.p[1] * scaleOut, a.p[2] * scaleOut];
      p = rotY(p, rot); p = rotX(p, Math.sin(lt * 0.22) * 0.16 - 0.08);
      const pr = project(p, fov, cz);
      return { pr, grow, a, i, born };
    });

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // neural filaments
    ctx.lineWidth = 1;
    for (const [i, j, d] of AGENT_LINKS) {
      const A = pts[i], B = pts[j];
      if (!A.pr || !B.pr || A.grow < 0.4 || B.grow < 0.4) continue;
      const depth = clamp((1600 - (A.pr[3] + B.pr[3]) / 2) / 900, 0, 1);
      const a = 0.26 * depth * Math.min(A.grow, B.grow) * clamp(1 - d / 340, 0, 1);
      if (a < 0.012) continue;
      // data pulse travelling along some filaments
      ctx.strokeStyle = rgba(C.blue, a);
      ctx.beginPath(); ctx.moveTo(A.pr[0], A.pr[1]); ctx.lineTo(B.pr[0], B.pr[1]); ctx.stroke();
      if ((i * 7 + j) % 9 === 0) {
        const q = ((lt * 0.8 + (i % 10) * 0.1) % 1);
        const px = lerp(A.pr[0], B.pr[0], q), py = lerp(A.pr[1], B.pr[1], q);
        glow(ctx, px, py, 16, C.cyan, 0.40 * depth);
      }
    }

    // core
    const corePulse = 0.75 + 0.25 * Math.sin(lt * 3.4);
    glow(ctx, V.W / 2, V.H / 2, 260 * (1 + push * 0.3), C.blue, 0.40 * corePulse);
    glow(ctx, V.W / 2, V.H / 2, 62 * (1 + push * 0.2), '#BFE6FF', 0.40 * corePulse);
    glow(ctx, V.W / 2, V.H / 2, 16, C.white, 0.9);

    // nodes
    for (const P of pts) {
      if (!P.pr || P.grow <= 0) continue;
      const [x, y, k, z] = P.pr;
      const depth = clamp((1700 - z) / 1000, 0, 1);
      const rr = (P.a.big ? 3.6 : 2.3) * P.a.s * k * P.grow;
      const tw = 0.72 + 0.28 * Math.sin(lt * 2.6 + P.a.ph);
      glow(ctx, x, y, rr * 9, P.a.big ? C.cyan : C.blue, 0.30 * depth * tw);
      glow(ctx, x, y, rr * 3.0, P.a.big ? '#BFE6FF' : '#8FC8FF', 0.34 * depth * tw);
      ctx.fillStyle = rgba(C.white, 0.85 * depth * tw);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.7, rr * 0.85), 0, 6.2832); ctx.fill();
      // spawn shock ring
      const sr = (lt - P.a.t0) / 0.55;
      if (sr > 0 && sr < 1) {
        ctx.strokeStyle = rgba(C.cyan, 0.34 * (1 - sr));
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(x, y, rr + sr * 34, 0, 6.2832); ctx.stroke();
      }
      // glass shell on hero nodes
      if (P.a.big && depth > 0.35) {
        ctx.strokeStyle = rgba(C.white, 0.16 * depth * P.grow);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, rr * 4.2, 0, 6.2832); ctx.stroke();
      }
    }

    // energy waves radiating on the big spawn beats
    for (const beat of [0.6, 1.5, 2.6, 3.7]) {
      const q = (lt - beat) / 1.5;
      if (q > 0 && q < 1) {
        ctx.strokeStyle = rgba(C.blueLt, 0.10 * (1 - q));
        ctx.lineWidth = 1.4 * (1 - q) + 0.4;
        ctx.beginPath(); ctx.ellipse(V.W / 2, V.H / 2, q * 1250, q * 700, 0, 0, 6.2832); ctx.stroke();
      }
    }
    ctx.restore();

    // title
    const ty = V.H - 118;
    textStagger(ctx, 'ONE HUNDRED AGENTS', V.W / 2, ty, lt - 3.05, {
      align: 'center', size: 34, weight: 500, ls: 16, color: C.white, step: 0.035, dur: 0.5, rise: 14
    });
    const subA = ramp(lt, 3.9, 4.6);
    T(ctx, 'ONE COMMAND', V.W / 2, ty + 40, {
      align: 'center', size: 15, weight: 400, ls: 11, color: C.blueLt, alpha: subA * 0.85
    });
    // hairline under title
    const lw = ramp(lt, 3.3, 4.4, eOutExpo) * 460;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createLinearGradient(V.W / 2 - lw / 2, 0, V.W / 2 + lw / 2, 0);
    lg.addColorStop(0, rgba(C.blue, 0)); lg.addColorStop(0.5, rgba(C.blueLt, 0.7)); lg.addColorStop(1, rgba(C.blue, 0));
    ctx.fillStyle = lg; ctx.fillRect(V.W / 2 - lw / 2, ty + 16, lw, 1);
    ctx.restore();
  }
};
