// serve.mjs — static server for tumbling.
//
// Serving over http:// rather than file:// is not a detail. OPFS, web workers
// and ES module scripts all fail silently under file://, which produces false
// failures that look exactly like real bugs. Every tumble starts here.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.nes': 'application/octet-stream',
};

export async function serve(root, port = 8900) {
  const missing = [];
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, url);
    if (!file.startsWith(path.resolve(root))) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // Record every 404 so a bare server's own /favicon.ico can never be
      // mistaken for an application defect. This actually happened.
      missing.push(url);
      res.writeHead(404); return res.end();
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      // COOP/COEP so SharedArrayBuffer-dependent apps behave as they would in production
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(port, r));
  return {
    port,
    origin: `http://localhost:${port}`,
    missing,
    close: () => server.close(),
  };
}

export function findChromium() {
  const base = `${process.env.HOME}/Library/Caches/ms-playwright`;
  const candidates = [];
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter(d => /^chromium(_headless_shell)?-\d+$/.test(d))
      .sort((a, b) => +b.split('-')[1] - +a.split('-')[1])) {
      candidates.push(
        `${base}/${d}/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
        `${base}/${d}/chrome-linux/chrome`,
        `${base}/${d}/chrome-mac/headless_shell`,
      );
    }
  }
  candidates.push(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  );
  return candidates.find(p => fs.existsSync(p));
}

// GPU flags matter. Without them WebGL/WebGPU silently fall back or fail,
// and you end up "finding" bugs that only exist in your harness.
export const GPU_ARGS = [
  '--use-gl=angle',
  '--use-angle=metal',
  '--ignore-gpu-blocklist',
  '--enable-unsafe-webgpu',
  '--autoplay-policy=no-user-gesture-required',
];
