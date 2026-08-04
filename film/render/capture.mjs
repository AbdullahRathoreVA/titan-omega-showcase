import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));

const cut = args.cut || 'master';
const outdir = args.outdir || `/home/user/titan-omega-film/out/frames_${cut}`;
const fps = Number(args.fps || 24);
const dur = Number(args.dur);            // total seconds of the cut
const from = Number(args.from || 0);     // first frame index (inclusive)
const to = Number(args.to !== undefined ? args.to : Math.round(dur * fps) - 1);

fs.mkdirSync(outdir, { recursive: true });

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-lcd-text', '--force-color-profile=srgb',
    '--disable-frame-rate-limit', '--font-render-hinting=none', '--allow-file-access-from-files'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exit(3); });
await page.goto('file:///home/user/titan-omega-film/render/film.html');
await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
const meta = await page.evaluate((c) => window.__setup(c), cut);
await page.setViewportSize({ width: meta.w, height: meta.h });

const el = await page.$('#out');
const t0 = Date.now();
for (let i = from; i <= to; i++) {
  const t = i / fps;
  await page.evaluate(([tt, ii]) => window.__frame(tt, ii), [t, i]);
  const buf = await el.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
  fs.writeFileSync(path.join(outdir, `f${String(i).padStart(5, '0')}.png`), buf);
  if ((i - from) % 40 === 0) {
    const done = i - from + 1, total = to - from + 1;
    const el_s = (Date.now() - t0) / 1000;
    console.log(`[${cut}] ${done}/${total}  ${(el_s / done).toFixed(2)}s/f  eta ${((total - done) * el_s / done / 60).toFixed(1)}m`);
  }
}
await browser.close();
console.log(`[${cut}] shard ${from}-${to} done in ${((Date.now() - t0) / 1000 / 60).toFixed(1)}m`);
