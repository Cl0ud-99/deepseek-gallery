/**
 * overlap.mjs — 追查「重复三角形」的具体归属
 *
 *   node archive/_tools/overlap.mjs A09,A02,A19
 *
 * 把重合分成两类：
 *   solid  = 两侧都是普通材质  → 真正需要处理的叠面
 *   fx     = 涉及 ShaderMaterial → 描边外壳 / 水面 / 特效层，通常是有意的
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '_extracted');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8909;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.bin':'application/octet-stream' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(ROOT, u);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-store' });
  fs.createReadStream(fp).pipe(res);
});

const audit = fs.readFileSync(path.join(__dirname, 'audit.mjs'), 'utf8');
const TARGETS = [];
for (const m of audit.matchAll(/\{ id:'(A\d\d)', rel:'([^']+)', wait:(\d+) \}/g)) TARGETS.push({ id: m[1], rel: m[2], wait: +(m[3]) });

const INJECT = () => {
  const dt = new EventTarget();
  dt.addEventListener('observe', (e) => {
    const d = e.detail; if (!d) return;
    if (d.isScene) (window.__SCENES__ = window.__SCENES__ || []).push(d);
  });
  window.__THREE_DEVTOOLS__ = dt;
};

const DETAIL = () => {
  const scenes = (window.__SCENES__ || []).filter(Boolean);
  if (!scenes.length) return { error: 'no scene' };
  let scene = scenes[0], best = -1;
  for (const sc of scenes) { let n = 0; sc.traverse(o => { if (o.isMesh) n++; }); if (n > best) { best = n; scene = sc; } }
  scene.updateMatrixWorld(true);

  const items = [];
  scene.traverse(o => {
    if (!o.isMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m) return;
    if (o.parent && o.parent.isMesh && o.parent.geometry === o.geometry) return;  // 共用父几何的外壳
    if (m.side === 2) return;                                                     // BackSide 外壳
    const isFX = !!m.isShaderMaterial;
    const label = (o.name || 'unnamed') + ' [' + (m.name || (m.type + (m.color ? '#' + m.color.getHexString() : ''))) + ']';
    items.push({ o, isFX, label, id: o.uuid });
  });

  const tri = new Map();
  const solid = new Map(), fxg = new Map();
  let budget = 400000, checked = 0, shell = 0;
  for (const it of items) {
    if (budget <= 0) break;
    const o = it.o, g = o.geometry;
    if (!g || !g.attributes || !g.attributes.position) continue;
    const pa = g.attributes.position, idx = g.index;
    const n = idx ? idx.count / 3 : pa.count / 3;
    if (n > budget) continue;
    const e = o.matrixWorld.elements;
    const v = (i) => {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      return [(e[0]*x+e[4]*y+e[8]*z+e[12]).toFixed(3), (e[1]*x+e[5]*y+e[9]*z+e[13]).toFixed(3), (e[2]*x+e[6]*y+e[10]*z+e[14]).toFixed(3)];
    };
    for (let t = 0; t < n; t++) {
      const a = v(idx ? idx.getX(t*3) : t*3), b = v(idx ? idx.getX(t*3+1) : t*3+1), c = v(idx ? idx.getX(t*3+2) : t*3+2);
      if (a.join() === b.join() || b.join() === c.join() || a.join() === c.join()) continue;
      const k = [a, b, c].sort().map(p => p.join('_')).join('|');
      const prev = tri.get(k);
      if (prev === undefined) { tri.set(k, it); continue; }
      const sameLabel = prev.id === it.id;
      const bucket = (prev.isFX || it.isFX) ? fxg : solid;
      const key = sameLabel ? (prev.label + '  (自身重复面)') : (prev.label + '  <->  ' + it.label);
      const rec = bucket.get(key);
      if (rec) rec.n++;
      else bucket.set(key, {
        n: 1,
        at: [a.join(', ')][0],
        sameGeo: prev.o.geometry === it.o.geometry,
        sameMat: prev.o.material === it.o.material,
        sameMatrix: prev.o.matrixWorld.elements.every((v, i) => Math.abs(v - it.o.matrixWorld.elements[i]) < 1e-6),
        visible: prev.o.visible && it.o.visible,
        matA: prev.o.material.type, matB: it.o.material.type,
      });
    }
    budget -= n; checked += n;
  }
  const top = (m) => [...m.entries()].sort((x, y) => y[1].n - x[1].n).slice(0, 10)
    .map(([k, v]) => ({ pair: k, tris: v.n, at: v.at, sameGeo: v.sameGeo, sameMat: v.sameMat,
      sameMatrix: v.sameMatrix, visible: v.visible }));
  const sum = (m) => { let s = 0; for (const v of m.values()) s += v.n; return s; };
  return { checked, meshes: items.length, solidTotal: sum(solid), fxTotal: sum(fxg),
    solidPairs: solid.size, fxPairs: fxg.size, solidTop: top(solid), fxTop: top(fxg) };
};

const ids = process.argv[2] ? process.argv[2].split(',') : ['A09'];
const list = TARGETS.filter(t => ids.includes(t.id));
const enc = p => p.split('/').map(encodeURIComponent).join('/');
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage','--hide-scrollbars','--window-size=1280,800'], protocolTimeout: 300000 });
const out = [];
for (const t of list) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluateOnNewDocument(INJECT);
  try {
    await page.goto('http://127.0.0.1:' + PORT + '/' + enc(t.rel), { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => (window.__SCENES__ || []).length > 0, { timeout: 40000 }).catch(() => {});
    await new Promise(r => setTimeout(r, t.wait));
    const r = await page.evaluate(DETAIL);
    r.id = t.id; out.push(r);
    console.log('=== ' + t.id + ' === meshes ' + r.meshes + ' | tris ' + r.checked +
      ' | SOLID dup ' + r.solidTotal + ' (' + r.solidPairs + ' pairs) | FX dup ' + r.fxTotal + ' (' + r.fxPairs + ' pairs)');
    for (const x of r.solidTop) console.log('   S ' + String(x.tris).padStart(4) + '  ' + x.pair +
      '  sameGeo=' + x.sameGeo + ' sameMat=' + x.sameMat + ' sameMatrix=' + x.sameMatrix + ' visible=' + x.visible + '  @ ' + x.at);
  } catch (e) { console.log(t.id, 'FAIL', String(e).slice(0, 140)); }
  await page.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(__dirname, 'overlap-result.json'), JSON.stringify(out, null, 2));