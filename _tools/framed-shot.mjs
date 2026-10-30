/**
 * framed-shot.mjs — 自动取景的预览图渲染
 *
 *   node _tools/framed-shot.mjs            # 全部重拍
 *   node _tools/framed-shot.mjs A09,A15    # 指定
 *
 * 与 shot.mjs 的区别：不等相机自己转到某个角度，而是接管取景——
 *   1. 冻结在第一帧的机位（抵消 autoRotate，同一件每次出图角度一致）
 *   2. 计算"实体"包围盒（排除天空、粒子、描边外壳、不可见件）
 *   3. 用包围球反推所需视场；不够广就把机位沿视线后退，保证整件入画
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
const PORT = 8903;
const W = 1440, H = 900;

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.woff':'font/woff', '.woff2':'font/woff2', '.bin':'application/octet-stream' };

const server = http.createServer((req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    let fp = path.join(ROOT, u);
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
    if (!fs.existsSync(fp)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));

/* 页面内：挂 devtools 观察者，接管取景 */
const INJECT = () => {
  const dt = new EventTarget();
  dt.addEventListener('observe', (e) => {
    const d = e.detail;
    if (!d) return;
    if (d.isScene) (window.__SCENES__ = window.__SCENES__ || []).push(d);
    else if (d.isWebGLRenderer && !d.__patched) {
      d.__patched = true;
      window.__R__ = d;
      const orig = d.render.bind(d);
      d.render = function (sc, cam) {
        try { window.__fit(sc, cam); } catch (err) {}
        return orig(sc, cam);
      };
    }
  });
  window.__THREE_DEVTOOLS__ = dt;

  window.__ARM = false;
  let homePos = null, homeQuat = null, fit = null, tries = 0;

  window.__fit = function (scene, cam) {
    /* 后处理 pass 用的是正交相机、场景里只有一个全屏 quad —— 一律不碰 */
    if (!window.__ARM) return;                    // 场景稳定后由外部上膛
    if (!cam || !cam.isPerspectiveCamera) return;
    if (!scene || !scene.children || scene.children.length < 3) return;

    var Box3 = null, Vector3 = null;
    scene.traverse(function (o) {
      if (Box3 || !o.geometry || !o.geometry.isBufferGeometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (o.geometry.boundingBox) { Box3 = o.geometry.boundingBox.constructor; Vector3 = o.geometry.boundingBox.min.constructor; }
    });
    if (!Box3) return;

    /* 1. 冻结机位（抵消 autoRotate / 阻尼），只在第一帧记录 */
    if (!homePos) { homePos = cam.position.clone(); homeQuat = cam.quaternion.clone(); }
    cam.position.copy(homePos);
    cam.quaternion.copy(homeQuat);

    /* 2. 实体包围盒：排除天空 / 粒子 / 描边外壳 / 超大远景 */
    if (!fit) {
      tries++;
      var items = [];
      scene.traverse(function (o) {
        if (!o.isMesh || !o.geometry || !o.geometry.isBufferGeometry) return;
        if (!o.geometry.attributes || !o.geometry.attributes.position) return;
        if (o.visible === false) return;
        var m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m) return;
        if (m.side === 2 || m.depthWrite === false || m.transparent) return;
        if (/sky|dome|star|backdrop|fog|cloud|haze/i.test(o.name || '')) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        var b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
        var sz = b.getSize(new Vector3());
        items.push({ box: b, size: Math.max(sz.x, sz.y, sz.z) });
      });
      if (items.length < 8) { tries++; return; }    // 场景还没建完

      items.sort(function (a, b2) { return a.size - b2.size; });
      var median = items[(items.length / 2) | 0].size;
      var limit = median * 8;
      var full = new Box3();
      for (var i2 = 0; i2 < items.length; i2++) if (items[i2].size <= limit) full.union(items[i2].box);

      var center = full.getCenter(new Vector3());
      var radius = full.getSize(new Vector3()).length() / 2;
      if (!isFinite(radius) || radius <= 0) return;
      var corners = [];
      for (var cx = 0; cx < 2; cx++) for (var cy = 0; cy < 2; cy++) for (var cz = 0; cz < 2; cz++) {
        corners.push(new Vector3(cx ? full.max.x : full.min.x, cy ? full.max.y : full.min.y, cz ? full.max.z : full.min.z));
      }
      fit = { center: center, radius: radius, corners: corners };
      window.__FIT_INFO = { r: +radius.toFixed(2), c: center.toArray().map(function (v) { return +v.toFixed(2); }), fov0: +cam.fov.toFixed(1) };
    }

    /* 3. 统一取景：
         方位角沿用作者本来的机位（保留各自的朝向感），
         仰角夹在 12°~38°（避免拍到背面或俯视），
         视场固定 40°，距离按包围盒 8 个角反解。 */
    var MARGIN = 1.05;
    var TARGET_FOV = 40 * Math.PI / 180;
    var EL_MIN = 12 * Math.PI / 180, EL_MAX = 38 * Math.PI / 180;

    var d0 = cam.position.clone().sub(fit.center);
    var dist0 = d0.length() || fit.radius * 3;
    var az = Math.atan2(d0.x, d0.z);
    var el = Math.asin(Math.max(-1, Math.min(1, d0.y / dist0)));
    el = Math.max(EL_MIN, Math.min(EL_MAX, el));

    function place(d) {
      cam.position.set(
        fit.center.x + Math.cos(el) * Math.sin(az) * d,
        fit.center.y + Math.sin(el) * d,
        fit.center.z + Math.cos(el) * Math.cos(az) * d
      );
      cam.lookAt(fit.center);
      cam.updateMatrixWorld();
    }

    function angles() {
      var ax = 0, ay = 0, tmp = new Vector3();
      for (var i3 = 0; i3 < fit.corners.length; i3++) {
        tmp.copy(fit.corners[i3]);
        cam.worldToLocal(tmp);
        var tz = -tmp.z;
        if (tz <= 1e-3) return 1e3;
        ax = Math.max(ax, Math.abs(tmp.x) / tz);
        ay = Math.max(ay, Math.abs(tmp.y) / tz);
      }
      return Math.max(ay, ax / cam.aspect);
    }

    var dist = fit.radius * 2.2;
    var want = Math.tan(TARGET_FOV / 2) / MARGIN;
    for (var it = 0; it < 6; it++) {
      place(dist);
      var t = angles();
      if (t >= 1e3) { dist *= 1.6; continue; }      // 有角点跑到相机背后 → 后拉
      var k = t / want;                             // 远了就拉近，近了就推远
      if (Math.abs(k - 1) < 0.012) break;
      dist *= k;
    }
    place(dist);
    cam.fov = TARGET_FOV * 180 / Math.PI;
    cam.updateProjectionMatrix();
        window.__FIT_INFO && (window.__FIT_INFO.fov1 = +cam.fov.toFixed(1));
  };
};

const only = process.argv[2] ? process.argv[2].split(',') : null;
const list = only ? T.filter(t => only.includes(t.id)) : T;
const enc = p => p.split('/').map(encodeURIComponent).join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage','--hide-scrollbars','--mute-audio','--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--window-size=' + W + ',' + H],
  protocolTimeout: 300000
});

for (const t of list) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(INJECT);
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 90)));
  try {
    await page.goto('http://127.0.0.1:' + PORT + '/' + enc(t.rel), { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(t.wait || 7000);
    await page.evaluate(() => { window.__ARM = true; });
    await sleep(900);
    const fit = await page.evaluate(() => window.__FIT_INFO || null);
    const file = path.join(OUT, t.id + '.png');
    await page.screenshot({ path: file, type: 'png' });
    const kb = (fs.statSync(file).size / 1024) | 0;
    console.log(t.id, fit ? 'OK  ' : 'NOFIT', String(kb).padStart(5) + 'KB',
      fit ? ('r=' + fit.r + ' fov ' + fit.fov0 + '->' + fit.fov1) : '', errs.length ? ('! ' + errs[0]) : '');
  } catch (e) {
    console.log(t.id, 'FAIL', String(e).slice(0, 120));
  }
  await page.close();
}

await browser.close();
server.close();
console.log('done');