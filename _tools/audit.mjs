/**
 * audit.mjs — 逐件打开场景，做结构审计
 *
 * 用法（在 archive 的上一级执行）：
 *   node archive/_tools/audit.mjs            # 全部 19 件
 *   node archive/_tools/audit.mjs A09,A18    # 指定编号
 *
 * 原理：three.js 在构造 Scene / WebGLRenderer 时会向 __THREE_DEVTOOLS__ 派发 observe 事件。
 * 我们在页面脚本之前挂一个假 devtools，就能拿到真实的 scene 与 renderer —— 不需要作品
 * 暴露任何调试句柄，也不需要改一行源码。
 *
 * 报告三件事：
 *   1. 规模与结构（mesh / 三角面 / 材质 / 阴影体 / 透明件）
 *   2. 合批空间（按材质分组后还能省多少 draw call）
 *   3. 叠面嫌疑（重复网格、共面贴片、重复三角形、退化三角形）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '_extracted');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8907;

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

const TARGETS = [
  { id:'A01', rel:'a01-twin-peaks-lodge/TwinPeaks-BlackLodge/TwinPeaks-BlackLodge.html', wait:6000 },
  { id:'A02', rel:'a02-ashtray-maze/ashtray-maze/standalone/ashtray-maze.html', wait:8000 },
  { id:'A03', rel:'a03-aurora-hourglass/aurora-hourglass/index.html', wait:6000 },
  { id:'A04', rel:'a04-autumn-farm/index.html', wait:8000 },
  { id:'A05', rel:'a05-cliff-lighthouse-cafe/cliff-lighthouse-cafe/index.html', wait:6000 },
  { id:'A06', rel:'a06-cloud-post-office/cloud-post-office/index.html', wait:6000 },
  { id:'A07', rel:'a07-fbc-quarry/fbc-quarry/standalone/fbc-quarry-07.html', wait:8000 },
  { id:'A08', rel:'a08-fbc-redshift/fbc-redshift-archive/dist/FBC-Redshift-Archive.html', wait:8000 },
  { id:'A09', rel:'a09-grand-hotel/grand-hotel-diorama/grand-hotel-diorama.html', wait:7000 },
  { id:'A10', rel:'a10-lighthouse/lighthouse-scene/lighthouse.html', wait:7000 },
  { id:'A11', rel:'a11-lunar-outpost/lunar-outpost/index-offline.html', wait:7000 },
  { id:'A12', rel:'a12-monach-stutter-lab/monach_stutter_lab/monach_stutter_lab.html', wait:7000 },
  { id:'A13', rel:'a13-mori-mart/mori-mart/index.html', wait:6000 },
  { id:'A14', rel:'a14-polar-icebreaker/polar-icebreaker/polar-icebreaker.html', wait:7000 },
  { id:'A15', rel:'a15-qipao-diorama/qipao-diorama/standalone/qipao-diorama.html', wait:8000 },
  { id:'A16', rel:'a16-route66-diner/route66-diner/index.html', wait:6000 },
  { id:'A17', rel:'a17-twin-peaks-red-room/twin-peaks-red-room/standalone/twin-peaks-red-room.html', wait:8000 },
  { id:'A18', rel:'a18-whale-dream-atelier/whale-dream-atelier/dist/dream-weaver-atelier.html', wait:11000 },
  { id:'A19', rel:'a19-stranger-things/hawkins-mirror/hawkins-mirror.html', wait:7000 },
  { id:'A20', rel:'a20-moonlit-perfume-atelier/moonlit-perfume-atelier/index.html', wait:7000 },
  { id:'A21', rel:'a21-ice-fire-mine-station/ice-fire-mine-station/index.html', wait:7000 }
];

const INJECT = () => {
  const dt = new EventTarget();
  dt.addEventListener('observe', (e) => {
    const d = e.detail;
    if (!d) return;
    if (d.isScene) { (window.__SCENES__ = window.__SCENES__ || []).push(d); window.__SCENE__ = d; }
    else if (d.isWebGLRenderer) window.__RENDERER__ = d;
  });
  window.__THREE_DEVTOOLS__ = dt;
};

const ANALYZE = () => {
  const renderer = window.__RENDERER__;
  const scenes = (window.__SCENES__ || []).filter(Boolean);
  if (!scenes.length) return { error: 'no scene captured' };
  // 有些作品会建多个 Scene（例如独立的反射场景），取网格最多的那个
  let scene = scenes[0], best = -1;
  for (const sc of scenes) {
    let n = 0;
    sc.traverse((o) => { if (o.isMesh) n++; });
    if (n > best) { best = n; scene = sc; }
  }
  const t0 = performance.now();
  scene.updateMatrixWorld(true);

  const out = {
    meshes: 0, instanced: 0, points: 0, lines: 0, sprites: 0,
    tris: 0, verts: 0, materials: new Set(), geometries: new Set(),
    shells: 0, shadowCasters: 0, shadowCastersTiny: 0, transparent: 0, shader: 0,
    candidateMeshes: 0, buckets: new Set(), mergeable: 0,
    dupeMeshes: 0, dupeGroups: [], coplanarDecals: 0, decalSamples: [],
    triChecked: 0, dupTris: 0, dupTriCrossMesh: 0, degenerateTris: 0,
    sameGeoTris: 0,
  };

  const items = [];
  scene.traverse((o) => {
    if (o.isInstancedMesh) {
      out.instanced++;
      const g = o.geometry;
      if (g && g.attributes.position) {
        const c = (g.index ? g.index.count : g.attributes.position.count) / 3;
        out.tris += c * o.count; out.verts += g.attributes.position.count * o.count;
      }
      out.materials.add(o.material && o.material.uuid);
      out.geometries.add(o.geometry && o.geometry.uuid);
      return;
    }
    if (o.isSprite) { out.sprites++; return; }
    if (o.isPoints) { out.points++; return; }
    if (o.isLine) { out.lines++; return; }
    if (!o.isMesh) return;
    // 反向外壳描边：要么挂在父 mesh 下共用同一份 geometry，要么材质就是 BackSide。
    // 合批之后父链断掉，所以 BackSide 才是可靠的判据。
    const mm0 = Array.isArray(o.material) ? o.material[0] : o.material;
    const isShell = (o.parent && o.parent.isMesh && o.parent.geometry === o.geometry) ||
                    (mm0 && mm0.side === 2) || (mm0 && mm0.isShaderMaterial && o.userData && o.userData.isOutline);
    // 外壳照样计数（它们真的会被画），只是不参与叠面/合批分析
    if (isShell) out.shells++;
    out.meshes++;
    const g = o.geometry;
    const m = o.material;
    if (g && g.attributes && g.attributes.position) {
      const c = (g.index ? g.index.count : g.attributes.position.count) / 3;
      out.tris += c; out.verts += g.attributes.position.count;
    }
    if (m) { out.materials.add(Array.isArray(m) ? m.map(x => x.uuid).join(',') : m.uuid); }
    if (g) out.geometries.add(g.uuid);
    if (o.castShadow) {
      out.shadowCasters++;
      const bs = g && g.boundingSphere ? g.boundingSphere.radius : 0;
      if (bs * (o.scale ? Math.max(o.scale.x, o.scale.y, o.scale.z) : 1) < 0.6) out.shadowCastersTiny++;
    }
    const mat = Array.isArray(m) ? m[0] : m;
    if (mat) {
      if (mat.transparent) out.transparent++;
      if (mat.isShaderMaterial) out.shader++;
    }

    // 合批候选（与 src/batch.js 的判定保持一致）
    const okBatch = !isShell && o.isMesh && !o.isInstancedMesh && !Array.isArray(m) && mat &&
      !mat.transparent && mat.opacity >= 0.999 && mat.depthWrite !== false &&
      !mat.isShaderMaterial && !o.userData.glass && !o.userData.noBatch && g && g.attributes.position &&
      !(g.morphAttributes && Object.keys(g.morphAttributes).length);
    if (okBatch) {
      out.candidateMeshes++;
      out.buckets.add(mat.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + (o.renderOrder | 0));
    }

    let wb = null;
    try {
      if (!g.boundingBox) g.computeBoundingBox();
      wb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    } catch (e) { wb = null; }
    if (isShell) return;
    items.push({ obj: o, uuid: o.uuid, name: o.name || '', mat: mat ? (mat.name || mat.uuid.slice(0, 8)) : '-',
      matId: mat ? mat.uuid : '-', geoId: g ? g.uuid : '-', cast: !!o.castShadow,
      wb: wb, tris: g && g.attributes.position ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0,
      matrix: o.matrixWorld.elements.slice() });
  });

  // ---------- 1. 完全重复的网格（同几何 + 同世界矩阵） ----------
  const dupKey = new Map();
  for (const it of items) {
    const mm = it.matrix.map(v => v.toFixed(4)).join(',');
    const k = it.geoId + '|' + mm + '|' + it.matId;
    const arr = dupKey.get(k);
    if (arr) arr.push(it); else dupKey.set(k, [it]);
  }
  for (const [k, arr] of dupKey) { if (arr.length > 1) { out.dupeMeshes += arr.length - 1; out.dupeGroups.push(arr.length); } }

  // ---------- 2. 共面贴片（薄片的平面和别的网格的某个面重合） ----------
  const probe = items.find(i => i.wb);
  const BOX3 = probe ? probe.wb.constructor : null;
  const VEC3 = probe ? probe.wb.min.constructor : null;
  const sceneBox = new BOX3();
  for (const it of items) if (it.wb) sceneBox.union(it.wb);
  const sceneSize = sceneBox.getSize(new VEC3()).length() || 1;
  const eps = sceneSize * 0.002;          // 相对场景尺度 0.2%
  const thin = [], solid = [];
  for (const it of items) {
    if (!it.wb) continue;
    const s = [it.wb.max.x - it.wb.min.x, it.wb.max.y - it.wb.min.y, it.wb.max.z - it.wb.min.z];
    const mx = Math.max(...s), mn = Math.min(...s);
    if (mx > 0 && mn / mx < 0.02) thin.push({ it, axis: s.indexOf(mn), s, mx });
    else solid.push(it);
  }
  const axisName = ['x', 'y', 'z'];
  for (const t of thin) {
    const a = t.axis;
    const lo = t.it.wb.min[axisName[a]], hi = t.it.wb.max[axisName[a]];
    const plane = (lo + hi) / 2;
    const oa = axisName[(a + 1) % 3], ob = axisName[(a + 2) % 3];
    for (const s of solid) {
      if (!s.wb || s === t.it) continue;
      const onFace = Math.abs(s.wb.min[axisName[a]] - plane) < eps || Math.abs(s.wb.max[axisName[a]] - plane) < eps;
      if (!onFace) continue;
      const ov = (p) => Math.max(0, Math.min(t.it.wb.max[p], s.wb.max[p]) - Math.max(t.it.wb.min[p], s.wb.min[p]));
      const area = (ov(oa) * ov(ob));
      const myArea = (t.it.wb.max[oa] - t.it.wb.min[oa]) * (t.it.wb.max[ob] - t.it.wb.min[ob]);
      if (myArea > 0 && area / myArea > 0.6) {
        out.coplanarDecals++;
        if (out.decalSamples.length < 8) out.decalSamples.push((t.it.name || t.it.mat) + ' 贴在 ' + (s.name || s.mat) + ' 的 ' + axisName[a] + ' 面');
        break;
      }
    }
  }

  // ---------- 3. 全局三角形重复 + 退化三角形 ----------
  const triMap = new Map();
  let budget = 400000;
  const geos = new Map();
  for (const it of items) if (it.tris > 0 && !geos.has(it.geoId)) geos.set(it.geoId, it);
  const pos = { x: 0, y: 0, z: 0 };
  for (const it of items) {
    if (budget <= 0) break;
    const o = it.obj;
    if (!o || !o.geometry || !o.geometry.attributes.position) continue;
    const g = o.geometry;
    const pa = g.attributes.position;
    const idx = g.index;
    const n = idx ? idx.count / 3 : pa.count / 3;
    if (n > budget) continue;
    const e = o.matrixWorld.elements;
    const vert = (i) => {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      return [ (e[0]*x + e[4]*y + e[8]*z + e[12]).toFixed(3),
               (e[1]*x + e[5]*y + e[9]*z + e[13]).toFixed(3),
               (e[2]*x + e[6]*y + e[10]*z + e[14]).toFixed(3) ];
    };
    for (let t = 0; t < n; t++) {
      const a = idx ? idx.getX(t*3) : t*3;
      const b = idx ? idx.getX(t*3+1) : t*3+1;
      const c = idx ? idx.getX(t*3+2) : t*3+2;
      const va = vert(a), vb = vert(b), vc = vert(c);
      if ((va[0]===vb[0]&&va[1]===vb[1]&&va[2]===vb[2]) ||
          (vb[0]===vc[0]&&vb[1]===vc[1]&&vb[2]===vc[2]) ||
          (va[0]===vc[0]&&va[1]===vc[1]&&va[2]===vc[2])) { out.degenerateTris++; continue; }
      const vs = [va, vb, vc].sort();
      const key = vs[0].join('_') + '|' + vs[1].join('_') + '|' + vs[2].join('_');
      const prev = triMap.get(key);
      if (prev === undefined) triMap.set(key, it.geoId + '@' + it.uuid);
      else {
        out.dupTris++;
        if (prev.split('@')[1] !== it.uuid) out.dupTriCrossMesh++;
      }
    }
    budget -= n;
    out.triChecked += n;
  }

  const sameGeo = new Map();
  for (const it of items) { if (it.geoId !== '-') sameGeo.set(it.geoId, (sameGeo.get(it.geoId) || 0) + 1); }
  for (const c of sameGeo.values()) if (c > 1) out.sameGeoTris += c - 1;

  const info = renderer && renderer.info ? renderer.info.render : null;
  const result = {
    ok: true,
    ms: Math.round(performance.now() - t0),
    meshes: out.meshes, shells: out.shells, instanced: out.instanced, points: out.points, lines: out.lines, sprites: out.sprites,
    tris: Math.round(out.tris), verts: Math.round(out.verts),
    materials: out.materials.size, geometries: out.geometries.size,
    shadowCasters: out.shadowCasters, shadowCastersTiny: out.shadowCastersTiny,
    transparent: out.transparent, shader: out.shader,
    candidateMeshes: out.candidateMeshes, buckets: out.buckets.size,
    mergeable: out.candidateMeshes - out.buckets.size,
    duplicateMeshes: out.dupeMeshes, duplicateGroups: out.dupeGroups.slice(0, 12),
    sharedGeometryReuse: out.sameGeoTris,
    coplanarDecals: out.coplanarDecals, decalSamples: out.decalSamples,
    triChecked: out.triChecked, duplicateTris: out.dupTris, duplicateTrisCrossMesh: out.dupTriCrossMesh,
    degenerateTris: out.degenerateTris,
    drawCalls: info ? info.calls : null,
  };
  return result;
};

const only = process.argv[2] ? process.argv[2].split(',') : null;
const list = only ? TARGETS.filter(t => only.includes(t.id)) : TARGETS;
const enc = p => p.split('/').map(encodeURIComponent).join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage','--hide-scrollbars','--mute-audio','--disable-background-timer-throttling',
    '--disable-renderer-backgrounding','--window-size=1280,800'],
  protocolTimeout: 300000,
});

const results = [];
for (const t of list) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(INJECT);
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
  try {
    await page.goto('http://127.0.0.1:' + PORT + '/' + enc(t.rel), { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.__SCENE__, { timeout: 40000 }).catch(() => {});
    await sleep(t.wait);
    const r = await page.evaluate(ANALYZE);
    r.id = t.id;
    if (errs.length) r.errors = errs.slice(0, 2);
    results.push(r);
    console.log(t.id, r.ok
      ? ('meshes ' + r.meshes + ' (shell ' + r.shells + ') | tris ' + r.tris + ' | mats ' + r.materials +
         ' | mergeable -' + r.mergeable +
         ' | dupMesh ' + r.duplicateMeshes +
         ' | dupTri ' + r.duplicateTris + ' (x-mesh ' + r.duplicateTrisCrossMesh + ')' +
         ' | decals ' + r.coplanarDecals + ' | ' + r.ms + 'ms')
      : ('FAIL ' + (r.error || '')));
  } catch (e) {
    results.push({ id: t.id, ok: false, error: String(e).slice(0, 200) });
    console.log(t.id, 'FAIL', String(e).slice(0, 120));
  }
  await page.close();
}

await browser.close();
server.close();
fs.writeFileSync(path.join(__dirname, 'audit-result.json'), JSON.stringify(results, null, 2));
console.log('\nsaved _tools/audit-result.json');