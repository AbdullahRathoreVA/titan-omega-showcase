import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; }));
const cut = args.cut || 'master';
const times = (args.t || '2').split(',').map(Number);
const outdir = args.outdir || '/home/user/titan-omega-film/out/stills';
fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-lcd-text', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1920 } });
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); });
await page.goto('file:///home/user/titan-omega-film/render/film.html');
await page.waitForFunction('window.__ready === true');
const meta = await page.evaluate(c => window.__setup(c), cut);
await page.setViewportSize({ width: meta.w, height: meta.h });
const el = await page.$('#out');
for (const t of times) {
  await page.evaluate(([tt, ii]) => window.__frame(tt, ii), [t, Math.round(t * 24)]);
  const buf = await el.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(`${outdir}/${cut}_t${String(t).replace('.', '_')}.jpg`, buf);
}
await browser.close();
console.log('stills done');
