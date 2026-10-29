/**
 * 逐件截图脚本 —— 生成 archive/previews/Axx.png
 *
 * 用法（在 archive 目录的上一级执行，node_modules 在那里）：
 *   node archive/_tools/shot.mjs            # 全部 19 件
 *   node archive/_tools/shot.mjs A15,A17    # 只跑指定编号
 *
 * 依赖：npm install puppeteer-core（本机 Chrome，不下载浏览器）
 * 原理：起本地静态服务器（避免 file:// 挡住 ES Module / importmap），
 *       无头 Chrome + SwiftShader 软件渲染 WebGL，等场景出画后再截。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '_extracted');
const OUT = path.join(__dirname, '..', 'previews');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8899;
const W = 1440, H = 900;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.hdr': 'application/octet-stream', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let fp = path.join(ROOT, urlPath);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
    if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(fp).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
});

// wait = 场景稳定所需的额外等待（毫秒），重型场景给更多时间
const TARGETS = [
  { id: 'A01', rel: 'a01-twin-peaks-lodge/TwinPeaks-BlackLodge/TwinPeaks-BlackLodge.html', wait: 7000 },
  { id: 'A02', rel: 'a02-ashtray-maze/ashtray-maze/standalone/ashtray-maze.html', wait: 9000 },
  { id: 'A03', rel: 'a03-aurora-hourglass/aurora-hourglass/index.html', wait: 7000 },
  { id: 'A04', rel: 'a04-autumn-farm/index.html', wait: 9000 },
  { id: 'A05', rel: 'a05-cliff-lighthouse-cafe/cliff-lighthouse-cafe/index.html', wait: 7000 },
  { id: 'A06', rel: 'a06-cloud-post-office/cloud-post-office/index.html', wait: 7000 },
  { id: 'A07', rel: 'a07-fbc-quarry/fbc-quarry/standalone/fbc-quarry-07.html', wait: 9000 },
  { id: 'A08', rel: 'a08-fbc-redshift/fbc-redshift-archive/dist/FBC-Redshift-Archive.html', wait: 9000 },
  { id: 'A09', rel: 'a09-grand-hotel/grand-hotel-diorama/grand-hotel-diorama.html', wait: 8000 },
  { id: 'A10', rel: 'a10-lighthouse/lighthouse-scene/lighthouse.html', wait: 8000 },
  { id: 'A11', rel: 'a11-lunar-outpost/lunar-outpost/index-offline.html', wait: 8000 },
  { id: 'A12', rel: 'a12-monach-stutter-lab/monach_stutter_lab/monach_stutter_lab.html', wait: 8000 },
  { id: 'A13', rel: 'a13-mori-mart/mori-mart/index.html', wait: 7000 },
  { id: 'A14', rel: 'a14-polar-icebreaker/polar-icebreaker/polar-icebreaker.html', wait: 8000 },
  { id: 'A15', rel: 'a15-qipao-diorama/qipao-diorama/standalone/qipao-diorama.html', wait: 9000 },
  { id: 'A16', rel: 'a16-route66-diner/route66-diner/index.html', wait: 7000 },
  { id: 'A17', rel: 'a17-twin-peaks-red-room/twin-peaks-red-room/standalone/twin-peaks-red-room.html', wait: 9000 },
  { id: 'A18', rel: 'a18-whale-dream-atelier/whale-dream-atelier/dist/dream-weaver-atelier.html', wait: 12000 },
  { id: 'A19', rel: 'a19-stranger-things/stranger-things/stranger-things-hawkins-diorama.html', wait: 8000 }
];

const only = process.argv[2] ? process.argv[2].split(',') : null;
const list = only ? TARGETS.filter(t => only.includes(t.id)) : TARGETS;
const enc = p => p.split('/').map(s => encodeURIComponent(s)).join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

await new Promise(r => server.listen(PORT, '127.0.0.1', r));
console.log('server on', PORT);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox', '--disable-gpu-sandbox',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    `--window-size=${W},${H}`
  ],
  protocolTimeout: 240000
});

for (const t of list) {
  const url = `http://127.0.0.1:${PORT}/${enc(t.rel)}`;
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(2500);
    await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 30000 }).catch(() => {});
    await sleep(t.wait);
    const file = path.join(OUT, `${t.id}.png`);
    await page.screenshot({ path: file, type: 'png' });
    const sz = fs.statSync(file).size;
    // 黑屏/加载中的 PNG 通常小于 45KB，用体积做兜底判据
    console.log(`${t.id}  ${sz > 45000 ? 'OK  ' : 'THIN'}  ${(sz / 1024).toFixed(0)}KB`);
    if (sz <= 45000 && errs.length) console.log('   ', errs.slice(0, 3).join(' | ').slice(0, 300));
  } catch (e) {
    console.log(`${t.id}  FAIL  ${String(e).slice(0, 160)}`);
    if (errs.length) console.log('   ', errs.slice(0, 3).join(' | ').slice(0, 300));
  }
  await page.close();
}

await browser.close();
server.close();
console.log('done');
