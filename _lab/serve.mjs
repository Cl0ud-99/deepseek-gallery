/**
 * serve.mjs — 本地预览服务器（仅实验分支用）
 *
 *   node _lab/serve.mjs        → http://127.0.0.1:8090
 *
 *  /            实验室索引（19 件 + 环境声开关说明）
 *  /s/A01 …     场景
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EX = path.join(__dirname, '..', '_extracted');
const PORT = Number(process.env.PORT || 8090);

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2' };

const TARGETS = [["A01","a01-twin-peaks-lodge/TwinPeaks-BlackLodge/TwinPeaks-BlackLodge.html"],["A02","a02-ashtray-maze/ashtray-maze/standalone/ashtray-maze.html"],["A03","a03-aurora-hourglass/aurora-hourglass/index.html"],["A04","a04-autumn-farm/index.html"],["A05","a05-cliff-lighthouse-cafe/cliff-lighthouse-cafe/index.html"],["A06","a06-cloud-post-office/cloud-post-office/index.html"],["A07","a07-fbc-quarry/fbc-quarry/standalone/fbc-quarry-07.html"],["A08","a08-fbc-redshift/fbc-redshift-archive/dist/FBC-Redshift-Archive.html"],["A09","a09-grand-hotel/grand-hotel-diorama/grand-hotel-diorama.html"],["A10","a10-lighthouse/lighthouse-scene/lighthouse.html"],["A11","a11-lunar-outpost/lunar-outpost/index-offline.html"],["A12","a12-monach-stutter-lab/monach_stutter_lab/monach_stutter_lab.html"],["A13","a13-mori-mart/mori-mart/index.html"],["A14","a14-polar-icebreaker/polar-icebreaker/polar-icebreaker.html"],["A15","a15-qipao-diorama/qipao-diorama/standalone/qipao-diorama.html"],["A16","a16-route66-diner/route66-diner/index.html"],["A17","a17-twin-peaks-red-room/twin-peaks-red-room/standalone/twin-peaks-red-room.html"],["A18","a18-whale-dream-atelier/whale-dream-atelier/dist/dream-weaver-atelier.html"],["A19","a19-stranger-things/hawkins-mirror/hawkins-mirror.html"],["A20","a20-moonlit-perfume-atelier/moonlit-perfume-atelier/index.html"],["A21","a21-ice-fire-mine-station/ice-fire-mine-station/index.html"],["A22","a22-floating-lava-glacier/index.html"],["A23","a23-carnival/carnival-miniature/carnival.html"]];

const NAMES = { A01:'Black Lodge', A02:'Ashtray Maze', A03:'Aurora Hourglass', A04:'Autumn Farm',
  A05:'Cliff Lighthouse Café', A06:'Cloud Post Office', A07:'FBC Quarry 07', A08:'Redshift Archive',
  A09:'Grand Hotel', A10:'The Lighthouse', A11:'Lunar Outpost', A12:'Stutter Lab', A13:'Mori Mart',
  A14:'Polar Icebreaker', A15:'Qipao Diorama', A16:'Route 66 Diner', A17:'The Red Room',
  A18:'Sunset Dream Loom', A19:'Hawkins / Upside Down',
  A20:'Moonlit Perfume Atelier', A21:'Ice-Fire Mine Station' };

const SOUND = { A01:'雨 + 低频 drone + 远雷', A02:'工业嗡鸣 + 荧光灯 + 金属撞击',
  A03:'高空风 + 玻璃泛音 + 星铃', A04:'溪流 + 鸟 + 蜂', A05:'海浪 + 海鸥 + 轻风',
  A06:'云海风 + 螺旋桨 + 蒸汽', A07:'深低频 + 金属共振 + 警报', A08:'压迫 drone + 纸页 + 钟',
  A09:'阿尔卑斯风 + 缆索 + 钟 + 蒸汽', A10:'暴雨 + 海鸥 + 雷', A11:'真空结构嗡鸣 + 无线电',
  A12:'极静高频 + 时间卡顿脉冲', A13:'细雨 + 叶响 + 风铃 + 蛙', A14:'寒风 + 冰裂 + 船体金属',
  A15:'雨 + 电车铃 + 留声机 + 滴水', A16:'热风 + 远处卡车 + 霓虹嗡', A17:'低音 drone + 雨 + 钟摆 + 雷',
  A18:'梦幻 drone + 玻璃 + 气泡', A19:'80s 合成器 + 雨 + 街机 + 威胁低频',
  A20:'白天花园 · 琉璃泛音 · 水声 · 鸟', A21:'熔岩咕嘟 · 冰裂 · 矿机 · 蒸汽' };

const idx = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<title>环境声实验 · 19 件</title>
<style>
  :root{--bg:#0a0c11;--panel:#12161f;--line:rgba(255,255,255,.09);--text:#e9ecf3;--dim:#8a92a6;--amber:#ffb46b}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font:14px/1.6 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;padding:40px}
  h1{font-size:24px;letter-spacing:-.01em;margin-bottom:8px}
  p.note{color:var(--dim);font-size:13px;margin-bottom:6px}
  .warn{margin:18px 0 26px;padding:12px 16px;border:1px solid rgba(255,180,107,.3);background:rgba(255,180,107,.07);
    border-radius:10px;color:#ffd0a0;font-size:12.5px;max-width:760px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;max-width:1320px}
  a.card{display:block;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;
    text-decoration:none;color:inherit;transition:.15s}
  a.card:hover{border-color:rgba(255,180,107,.45);transform:translateY(-2px)}
  .id{font-size:11px;color:var(--amber);letter-spacing:.12em}
  .nm{font-size:15px;font-weight:600;margin-top:2px}
  .sd{font-size:12px;color:var(--dim);margin-top:6px}
</style></head><body>
<h1>环境声实验 · 19 件</h1>
<p class="note">每个场景右下角有「点击开启环境声」——浏览器要求先有一次点击才能出声。</p>
<p class="note">声音全部由 Web Audio 现场合成，包内没有任何音频文件。</p>
<div class="warn">本地实验分支 <b>exp/ambience</b>，只在本地预览，未推送、未部署。加 <code>?nosound=1</code> 可静音。</div>
<div class="grid">
${TARGETS.map(([id, rel]) => `<a class="card" href="/s/${id}">
  <div class="id">${id}</div>
  <div class="nm">${NAMES[id] || id}</div>
  <div class="sd">${SOUND[id] || ''}</div>
</a>`).join('')}
</div></body></html>`;

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith('/previews/')) {
    const fp = path.join(EX, '..', decodeURIComponent(url));
    if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (url === '/expo' || url === '/expo.html') {
    const fp = path.join(EX, '..', 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (url === '/audition' || url === '/audition.html') {
    const fp = path.join(__dirname, 'audition.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (url === '/archive' || url === '/archive.html') {
    const fp = path.join(EX, '..', 'archive.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(idx);
  }
  if (url.startsWith('/s/')) {
    const id = url.slice(3);
    const hit = TARGETS.find(t => t[0] === id);
    if (!hit) { res.writeHead(404); return res.end('no such scene'); }
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.writeHead(302, { Location: '/_extracted/' + hit[1].split('/').map(encodeURIComponent).join('/') + q });
    return res.end();
  }
  const rel = url.replace(/^\/_extracted\//, '');
  let fp = path.join(EX, rel);
  if (!fp.startsWith(EX)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('ambience lab: http://127.0.0.1:' + PORT);
});