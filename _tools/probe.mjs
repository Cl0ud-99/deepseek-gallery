
/**
 * probe.mjs — 逐件测量 draw call / 三角面 / 帧率（软件渲染）
 *
 * 用法（在 archive 的上一级执行，node_modules 在那里）：
 *   node archive/_tools/probe.mjs              # 全部
 *   node archive/_tools/probe.mjs A11,A18      # 指定编号
 *   node archive/_tools/probe.mjs A11 --ms 4000
 *
 * 原理：本地静态服务器 + 无头 Chrome(SwiftShader) + 注入式 WebGL 计数器。
 *       不需要项目暴露任何调试句柄，对 19 件一视同仁。
 *       统计的是「每帧 draw call 数」与「每帧三角面数」，帧率仅作软渲染参考。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '_extracted');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8901;
const W = 1280, H = 800;

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.bin':'application/octet-stream' };

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let fp = path.join(ROOT, urlPath);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
    if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

export const TARGETS = [
  { id:'A01', rel:'a01-twin-peaks-lodge/TwinPeaks-BlackLodge/TwinPeaks-BlackLodge.html', wait:6000 },
  { id:'A02', rel:'a02-ashtray-maze/ashtray-maze/standalone/ashtray-maze.html', wait:8000 },
  { id:'A03', rel:'a03-aurora-hourglass/aurora-hourglass/index.html', wait:6000 },
  { id:'A04', rel:'a04-autumn-farm/index.html', wait:8000, net:true },
  { id:'A05', rel:'a05-cliff-lighthouse-cafe/cliff-lighthouse-cafe/index.html', wait:6000 },
  { id:'A06', rel:'a06-cloud-post-office/cloud-post-office/index.html', wait:6000 },
  { id:'A07', rel:'a07-fbc-quarry/fbc-quarry/standalone/fbc-quarry-07.html', wait:8000 },
  { id:'A08', rel:'a08-fbc-redshift/fbc-redshift-archive/dist/FBC-Redshift-Archive.html', wait:8000 },
  { id:'A09', rel:'a09-grand-hotel/grand-hotel-diorama/grand-hotel-diorama.html', wait:7000 },
  { id:'A10', rel:'a10-lighthouse/lighthouse-scene/lighthouse.html', wait:7000 },
  { id:'A11', rel:'a11-lunar-outpost/lunar-outpost/index-offline.html', wait:7000 },
  { id:'A12', rel:'a12-monach-stutter-lab/monach_stutter_lab/monach_stutter_lab.html', wait:7000, net:true },
  { id:'A13', rel:'a13-mori-mart/mori-mart/index.html', wait:6000 },
  { id:'A14', rel:'a14-polar-icebreaker/polar-icebreaker/polar-icebreaker.html', wait:7000 },
  { id:'A15', rel:'a15-qipao-diorama/qipao-diorama/standalone/qipao-diorama.html', wait:8000 },
  { id:'A16', rel:'a16-route66-diner/route66-diner/index.html', wait:6000 },
  { id:'A17', rel:'a17-twin-peaks-red-room/twin-peaks-red-room/standalone/twin-peaks-red-room.html', wait:8000 },
  { id:'A18', rel:'a18-whale-dream-atelier/whale-dream-atelier/dist/dream-weaver-atelier.html', wait:11000 },
  { id:'A19', rel:'a19-stranger-things/hawkins-mirror/hawkins-mirror.html', wait:7000 }
];

const INJECT = () => {
  const S = (window.__probe = { frames:0, draws:0, tris:0, on:false });
  const wrap = (proto, name, tri) => {
    const orig = proto && proto[name];
    if (!orig) return;
    proto[name] = function (...a) {
      if (S.on) { S.draws++; S.tris += tri(a); }
      return orig.apply(this, a);
    };
  };
  const protos = [];
  if (window.WebGLRenderingContext) protos.push(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) protos.push(WebGL2RenderingContext.prototype);
  for (const p of protos) {
    wrap(p, 'drawElements', a => Math.floor(a[1] / 3));
    wrap(p, 'drawArrays', a => Math.floor(a[2] / 3));
    wrap(p, 'drawElementsInstanced', a => Math.floor(a[1] / 3) * (a[4] || 1));
    wrap(p, 'drawArraysInstanced', a => Math.floor(a[2] / 3) * (a[3] || 1));
  }
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { S.frames++; return cb(t); });
};

const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2].split(',') : null;
const msIdx = process.argv.indexOf('--ms');
const SAMPLE_MS = msIdx > 0 ? Number(process.argv[msIdx + 1]) : 2000;
const list = only ? TARGETS.filter(t => only.includes(t.id)) : TARGETS;
const enc = p => p.split('/').map(encodeURIComponent).join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage','--hide-scrollbars','--mute-audio','--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', + '--window-size=' + W + ',' + H],
  protocolTimeout: 240000
});

const rows = [];
for (const t of list) {
  const url = 'http://127.0.0.1:' + PORT + '/' + enc(t.rel);
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
  await page.evaluateOnNewDocument(INJECT);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 40000 }).catch(() => {});
    await sleep(t.wait);
    const gpu = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return null;
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return null;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { w: c.width, h: c.height, r: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '?' };
    });
    await page.evaluate(() => { const S = window.__probe; S.frames = 0; S.draws = 0; S.tris = 0; S.on = true; });
    // 至少数到 3 帧（软渲染下可能很慢），最多等 25 秒
    const t0 = Date.now();
    let s = { frames: 0, draws: 0, tris: 0 };
    while (Date.now() - t0 < 25000) {
      await sleep(400);
      s = await page.evaluate(() => ({ frames: window.__probe.frames, draws: window.__probe.draws, tris: window.__probe.tris }));
      if (s.frames >= 3 && Date.now() - t0 >= SAMPLE_MS) break;
    }
    await page.evaluate(() => { window.__probe.on = false; });
    const frames = Math.max(1, s.frames);
    const secs = (Date.now() - t0) / 1000;
    rows.push({ id: t.id, frames, draws: s.draws, tris: s.tris,
      callsPerFrame: +(s.draws / frames).toFixed(1), trisPerFrame: Math.round(s.tris / frames),
      fps: +(frames / secs).toFixed(1), canvas: gpu ? gpu.w + 'x' + gpu.h : '?',
      errs: errs.slice(0, 2) });
  } catch (e) {
    rows.push({ id: t.id, error: String(e).slice(0, 160) });
  }
  await page.close();
  const r = rows[rows.length - 1];
  console.log(r.error ? (r.id + '  FAIL ' + r.error)
    : (r.id + '  ' + String(r.callsPerFrame).padStart(7) + ' calls   ' + String(r.trisPerFrame).padStart(8) + ' tris   '
       + String(r.fps).padStart(5) + ' fps   ' + r.canvas + (r.errs.length ? '   ! ' + r.errs.join(' | ') : '')));
}
await browser.close();
server.close();
fs.writeFileSync(path.join(__dirname, 'probe-result.json'), JSON.stringify(rows, null, 2));
console.log('\nsaved _tools/probe-result.json');