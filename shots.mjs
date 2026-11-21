// Takes the entry's four screenshots with headless Chromium (Playwright):
// the editor with the sample scenes loaded, and three covers drawn by the
// app's own engine at full post size and scaled to the gate's limits.
// Also reports the editor's console errors and failed or external requests.
//
//   node shots.mjs
//
// Needs playwright-core, resolved from the scratch install named by
// SHOTS_ENV (default ~/workspace/makefun/shots-env), and a Chromium binary
// (CHROME_BIN or the Playwright cache's headless shell).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(join(process.env.SHOTS_ENV ?? join(homedir(), 'workspace/makefun/shots-env'), 'package.json'));
const { chromium } = require('playwright-core');

const chromeBin = process.env.CHROME_BIN
  ?? join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell');
const port = 8123;
const base = `http://localhost:${port}`;

async function waitForServer(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(base + '/');
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('serve.ts did not come up');
}

// Render one cover inside the page with the app's own modules and return it
// as a JPEG data URL at exactly (tw x th).
async function renderCoverJpeg(page, spec, quality) {
  return page.evaluate(async ({ spec, quality }) => {
    const cover = await import('/src/cover.js');
    const samples = await import('/src/samples.js');
    await document.fonts.load('80px Anton');
    await document.fonts.load('40px Pacifico');
    const sources = [null, null, null, null, samples.paintSunsetScene(), samples.paintNeonScene()];
    const pattern = [4, 5, 4, 5, 4, 5, 4, 5, 4];
    const panels = pattern.map((source) => ({ source, zoom: 1, panX: 0, panY: 0 }));
    const state = { sources, panels, selected: 0, heat: 4, ...spec };
    const full = document.createElement('canvas');
    cover.renderCover(full, state);
    const out = document.createElement('canvas');
    out.width = spec.tw;
    out.height = spec.th;
    out.getContext('2d').drawImage(full, 0, 0, spec.tw, spec.th);
    return out.toDataURL('image/jpeg', quality);
  }, { spec, quality });
}

async function main() {
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  const server = spawn('node', ['serve.ts'], {
    cwd: here,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  const report = { consoleErrors: [], pageErrors: [], failedRequests: [], externalRequests: [], files: {} };
  try {
    await waitForServer();
    const browser = await chromium.launch({ executablePath: chromeBin, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1180 } });
    page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => report.pageErrors.push(String(e)));
    page.on('requestfailed', (r) => report.failedRequests.push(r.url()));
    page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) report.externalRequests.push(r.url()); });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    // Load the sample scenes into the first two photo slots, as a user would.
    await page.click('[data-sample="0"][data-scene="sunset"]');
    await page.click('[data-sample="1"][data-scene="neon"]');
    await page.waitForTimeout(300);

    // The editor, samples loaded, hero layout: a viewport screenshot.
    let quality = 84;
    let shot = await page.screenshot({ type: 'jpeg', quality });
    while (shot.length > 262144 && quality > 50) {
      quality -= 8;
      shot = await page.screenshot({ type: 'jpeg', quality });
    }
    writeFileSync(join(here, 'screenshots', '2-editor.jpg'), shot);
    report.files['2-editor.jpg'] = shot.length;

    const covers = [
      { name: '1-cover.jpg', spec: { size: 'wide', layout: 'hero', grade: 'vice', title: 'NEON COAST', subtitle: 'one night in the city', badge: 'NEW POSTER', heat: 4, tw: 1280, th: 720 } },
      { name: '3-portrait.jpg', spec: { size: 'portrait', layout: 'nine', grade: 'neon', title: 'PALM CITY', subtitle: 'after dark', badge: 'HEAT 5', heat: 5, tw: 1024, th: 1280 } },
      { name: '4-square.jpg', spec: { size: 'square', layout: 'four', grade: 'teal', title: 'COASTLINE', subtitle: 'golden hour radio', badge: 'CRUISIN', heat: 3, tw: 1024, th: 1024 } },
    ];
    for (const { name, spec } of covers) {
      let q = 0.86;
      let data = await renderCoverJpeg(page, spec, q);
      let buf = Buffer.from(data.split(',')[1], 'base64');
      while (buf.length > 262144 && q > 0.5) {
        q -= 0.08;
        data = await renderCoverJpeg(page, spec, q);
        buf = Buffer.from(data.split(',')[1], 'base64');
      }
      writeFileSync(join(here, 'screenshots', name), buf);
      report.files[name] = buf.length;
    }
    await browser.close();
  } finally {
    server.kill();
  }
  console.log(JSON.stringify(report, null, 2));
}

await main();
