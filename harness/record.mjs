#!/usr/bin/env node
// record.mjs — capture a driven video of each artifact and stitch a reel.
//
//   node harness/record.mjs <root> --manifest reel.json [--out video]
//
// reel.json:
//   [{ "file": "app.html", "main": "App Name", "sub": "what the critic measured",
//      "drive": "drivers/app.mjs" }]
//
// Two things here were learned the hard way and are worth keeping:
//
//   1. Playwright's video timeline starts at CONTEXT CREATION, not at page
//      load. A clip's first 5-12 seconds are lead-in and splash screens. So
//      this takes the TAIL of each recording, which is always the part where
//      the app is actually being driven.
//
//   2. Playwright names videos by hash and does not clean the directory. If
//      you re-record, the old .webm is still sitting there. Always pick the
//      NEWEST file, or you will silently stitch a stale take. (Ask me how I
//      know.)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { serve, findChromium, GPU_ARGS } from './lib/serve.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const root = path.resolve(args[0] || '.');
const manifest = JSON.parse(fs.readFileSync(flag('--manifest', 'reel.json'), 'utf8'));
const out = flag('--out', 'video');
const SEG = Number(flag('--segment', 11));
fs.mkdirSync(path.join(out, 'raw'), { recursive: true });
fs.mkdirSync(path.join(out, 'seg'), { recursive: true });

const srv = await serve(root, Number(flag('--port', 8950)));
const browser = await chromium.launch({ executablePath: findChromium(), args: GPU_ARGS });

for (const item of manifest) {
  const dir = path.join(out, 'raw', path.basename(item.file, '.html'));
  fs.rmSync(dir, { recursive: true, force: true });          // never stitch a stale take
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.goto(`${srv.origin}/${item.file.replace(/^\//, '')}`, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(5500);
  if (item.drive) {
    const mod = await import(path.resolve(item.drive));
    await (mod.default || (() => {}))(page).catch(e => console.log('  drive:', String(e).slice(0, 80)));
  }
  await page.waitForTimeout(700);
  await ctx.close();                                          // flushes the video
  console.log('captured', item.file);
}
await browser.close(); srv.close();

// ---- stitch ----
const dur = f => Number(execFileSync('ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]).toString().trim());

const segs = [];
manifest.forEach((item, i) => {
  const dir = path.join(out, 'raw', path.basename(item.file, '.html'));
  const src = path.join(dir, fs.readdirSync(dir).filter(f => f.endsWith('.webm'))
    .map(f => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)[0].f);                         // NEWEST, always
  const start = Math.max(0.5, dur(src) - SEG - 0.6);          // the driven tail
  const dst = path.join(out, 'seg', String(i + 1).padStart(2, '0') + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-i', src,
    '-t', String(SEG),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=30',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', dst]);
  segs.push(dst);
  console.log(`seg ${i + 1}  start=${start.toFixed(1)}s  ${item.main}`);
});

const list = path.join(out, 'list.txt');
fs.writeFileSync(list, segs.map(s => `file '${path.resolve(s)}'\n`).join(''));
const final = path.join(out, 'reel.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
  '-i', list, '-c', 'copy', '-movflags', '+faststart', final]);
console.log('\nWROTE', final, (fs.statSync(final).size / 1e6).toFixed(2), 'MB');
