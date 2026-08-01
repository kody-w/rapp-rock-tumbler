#!/usr/bin/env node
// tumble.mjs — run an HTML artifact in a real browser and hand back numbers.
//
//   node harness/tumble.mjs <root> <file.html> [--drive script.mjs] [--seconds 9]
//
// What it does, in the order that matters:
//   1. serves <root> over http (never file://)
//   2. launches real Chromium with GPU flags
//   3. captures pageerror + console.error, and separates the server's own 404s
//      from genuine application errors
//   4. optionally drives the app with a supplied script
//   5. screenshots, then computes statistics over the PNG *outside the page*
//   6. prints a report made of numbers
//
// It deliberately does NOT decide whether the app is "good". It reports
// measurements. Judgement is yours; the harness only removes the excuse.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { chromium } from 'playwright-core';
import { serve, findChromium, GPU_ARGS } from './lib/serve.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const root = path.resolve(args[0] || '.');
const target = args[1];
if (!target) {
  console.error('usage: node harness/tumble.mjs <root> <file.html> [--drive drive.mjs] [--seconds 9]');
  process.exit(2);
}
const settle = Number(flag('--seconds', 9)) * 1000;
const outDir = flag('--out', 'tumble-out');
fs.mkdirSync(outDir, { recursive: true });

const exe = findChromium();
if (!exe) { console.error('No Chromium found. Try: npx playwright install chromium'); process.exit(2); }

const srv = await serve(root, Number(flag('--port', 8900)));
const browser = await chromium.launch({ executablePath: exe, args: GPU_ARGS });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', e => pageErrors.push(e.message.slice(0, 240)));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 240)); });

const url = `${srv.origin}/${target.replace(/^\//, '')}`;
const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(e => {
  pageErrors.push('GOTO ' + e.message); return null;
});
await page.waitForTimeout(settle);

// optional driver: export default async (page) => { ... }
const driveFile = flag('--drive', null);
if (driveFile) {
  const mod = await import(path.resolve(driveFile));
  await (mod.default || (() => {}))(page).catch(e => pageErrors.push('DRIVE ' + String(e).slice(0, 200)));
  await page.waitForTimeout(800);
}

const shot = path.join(outDir, path.basename(target, '.html') + '.png');
const buf = await page.screenshot();
fs.writeFileSync(shot, buf);

// ---- measure the frame from OUTSIDE the page ----
// Page-side code can tell you whatever it likes. A PNG cannot.
const png = PNG.sync.read(buf);
const hist = new Map();
let n = 0;
for (let y = 0; y < png.height; y += 2) {
  for (let x = 0; x < png.width; x += 2) {
    const i = (png.width * y + x) << 2;
    const k = ((png.data[i] >> 4) << 8) | ((png.data[i + 1] >> 4) << 4) | (png.data[i + 2] >> 4);
    hist.set(k, (hist.get(k) || 0) + 1); n++;
  }
}
let top = 0, topKey = 0;
for (const [k, v] of hist) if (v > top) { top = v; topKey = k; }
const dominantFrac = +(top / n).toFixed(3);
const dominantRGB = [((topKey >> 8) & 15) * 17, ((topKey >> 4) & 15) * 17, (topKey & 15) * 17];

const dom = await page.evaluate(() => ({
  title: document.title,
  canvases: document.querySelectorAll('canvas').length,
  buttons: document.querySelectorAll('button,[role=button]').length,
  // A whole UI displaced by a uniform offset with transform:none is a SCROLL,
  // not a layout bug. Report it so nobody has to guess.
  scrollX: Math.round(window.scrollX), scrollY: Math.round(window.scrollY),
  docWidth: document.documentElement.scrollWidth, viewWidth: window.innerWidth,
}));

const serverNoise = srv.missing;
const realConsole = consoleErrors.filter(t => !/favicon/i.test(t) &&
  !(/404/.test(t) && serverNoise.length));

console.log(`\n=== TUMBLE  ${target} ===`);
console.log(`http status        ${resp ? resp.status() : 'n/a'}`);
console.log(`title              ${JSON.stringify(dom.title)}`);
console.log(`canvases/buttons   ${dom.canvases} / ${dom.buttons}`);
console.log(`scrollX/scrollY    ${dom.scrollX} / ${dom.scrollY}${dom.scrollX ? '   <-- document scrolled; suspect an unclipped oversized child' : ''}`);
console.log(`doc vs viewport    ${dom.docWidth}px vs ${dom.viewWidth}px${dom.docWidth > dom.viewWidth ? '   <-- horizontally scrollable' : ''}`);
// Only meaningful for rendered scenes. A dark document legitimately has one
// dominant background colour, so flagging it there is a false positive — which
// this harness produced against its own landing page on the first run.
const slabWarn = dom.canvases > 0 && dominantFrac > 0.30;
console.log(`dominant colour    ${dominantFrac} of frame is rgb(${dominantRGB})${slabWarn ? '   <-- a flat slab fills the view; camera may be inside geometry' : dom.canvases === 0 ? '   (no canvas — not a scene metric here)' : ''}`);
console.log(`pageerrors         ${pageErrors.length}`);
pageErrors.forEach(e => console.log('   ! ' + e));
console.log(`console errors     ${realConsole.length}   (server 404s seen: ${[...new Set(serverNoise)].join(', ') || 'none'})`);
realConsole.forEach(e => console.log('   ! ' + e));
console.log(`screenshot         ${shot}`);

const verdict = pageErrors.length === 0 && realConsole.length === 0;
console.log(`\n${verdict ? 'CLEAN' : 'DEFECTS PRESENT'} — numbers above, judgement yours.\n`);

await browser.close(); srv.close();
process.exit(verdict ? 0 : 1);
