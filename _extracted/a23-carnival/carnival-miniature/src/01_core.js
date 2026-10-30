/* =========================================================
   01 · 核心：渲染器 / 相机 / 光 / 材质 / 工具
   ========================================================= */
(function () {
  'use strict';
  const APP = (window.APP = {});
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  /* ---------------- 调色板 ---------------- */
  const C = (APP.C = {
    gold: 0xe9b44e,
    goldLt: 0xf8d98f,
    goldDk: 0xa4712a,
    cream: 0xfff1d6,
    ivory: 0xfffbf0,
    red: 0xd9383f,
    redDk: 0x9b1f2c,
    pink: 0xff9ec6,
    pinkDk: 0xd2568f,
    lilac: 0xa98cff,
    violet: 0x6b45c9,
    teal: 0x3fcabf,
    tealDk: 0x1d7c88,
    blue: 0x3d54b8,
    navy: 0x1a1740,
    wood: 0x8d5c36,
    woodDk: 0x5b3922,
    white: 0xfffdf7,
    iron: 0x2b2540,
    velvet: 0x8e1f4d,
    orange: 0xe8892f,
    mint: 0x9fe6c8,
    sky: 0x0a0820
  });

  /* ---------------- 渲染器 ---------------- */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x07061a, 1);
  document.getElementById('stage').appendChild(renderer.domElement);
  APP.renderer = renderer;

  const scene = (APP.scene = new THREE.Scene());
  const camera = (APP.camera = new THREE.PerspectiveCamera(40, W() / H(), 0.4, 600));
  camera.position.set(12.5, 14.2, 23);

  const controls = (APP.controls = new THREE.OrbitControls(camera, renderer.domElement));
  controls.target.set(0, 3.1, -0.6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.85;
  controls.enablePan = false;
  controls.minDistance = 12;
  controls.maxDistance = 74;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.22;

  /* 用户操作时暂停自转，松手 7 秒后重新漂浮 */
  let idleTimer = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (controls.autoRotate = true), 7000);
  });

  /* ---------------- 渐变光照贴图（三渲二分阶） ---------------- */
  const rampData = new Uint8Array([70, 70, 96, 255, 132, 132, 158, 255, 200, 200, 214, 255, 255, 255, 255, 255]);
  const toonRamp = new THREE.DataTexture(rampData, 4, 1, THREE.RGBAFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.generateMipmaps = false;
  toonRamp.needsUpdate = true;
  APP.toonRamp = toonRamp;

  /* ---------------- 环境反射（让镀金真的发光） ---------------- */
  (function buildEnv() {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0.0, '#0b0820');
    grd.addColorStop(0.34, '#241650');
    grd.addColorStop(0.48, '#4a2360');
    grd.addColorStop(0.55, '#a05a54');
    grd.addColorStop(0.62, '#e0a463');
    grd.addColorStop(0.72, '#432a45');
    grd.addColorStop(1.0, '#0d0a22');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    // 几团暖色光斑，给金属面提供高光变化
    const spots = [
      [110, 120, 90, 'rgba(255,206,140,0.75)'],
      [300, 108, 70, 'rgba(255,150,190,0.5)'],
      [420, 130, 80, 'rgba(150,190,255,0.35)']
    ];
    spots.forEach(([x, y, r, col]) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
  })();

  /* ---------------- 灯光 ---------------- */
  const hemi = new THREE.HemisphereLight(0x6a5ae8, 0x241634, 0.4);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffd7a6, 0.92);
  key.position.set(15, 24, 13);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -17;
  key.shadow.camera.right = 17;
  key.shadow.camera.top = 17;
  key.shadow.camera.bottom = -17;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 70;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x6f5cff, 0.4);
  fill.position.set(-16, 9, -15);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x9fd0ff, 0.3);
  rim.position.set(-6, 7, 18);
  scene.add(rim);

  const lights = [
    [0, 2.45, -1.0, 0xffb35c, 0.8, 9],
    [0, 1.3, -1.0, 0xffcf9a, 0.22, 6],
    [0, 4.45, -1.0, 0xffd79a, 1.15, 8],
    [-7.2, 1.9, 4.2, 0xffc98a, 0.7, 5.5],
    [7.0, 1.9, 4.6, 0xffb070, 0.8, 5.5],
    [0, 6.0, 9.35, 0xff5fa8, 0.55, 7]
  ];
  lights.forEach(([x, y, z, col, i, d]) => {
    const p = new THREE.PointLight(col, i, d, 2);
    p.position.set(x, y, z);
    scene.add(p);
  });

  /* ---------------- 材质工厂 ---------------- */
  const srgb = (c) => new THREE.Color(c).convertSRGBToLinear();
  APP.srgb = srgb;

  const toon = (APP.toon = (color, extra) =>
    new THREE.MeshToonMaterial(
      Object.assign({ color: srgb(color), gradientMap: toonRamp }, extra || {})
    ));

  const metal = (APP.metal = (color, rough = 0.26, metalness = 0.96) =>
    new THREE.MeshStandardMaterial({
      color: srgb(color),
      metalness,
      roughness: rough,
      envMapIntensity: 1.15
    }));

  const gloss = (APP.gloss = (color, rough = 0.14) =>
    new THREE.MeshStandardMaterial({
      color: srgb(color),
      metalness: 0.12,
      roughness: rough,
      envMapIntensity: 0.9
    }));

  const glass = (APP.glass = (opacity = 0.16) =>
    new THREE.MeshStandardMaterial({
      color: srgb(0xbfe4ff),
      metalness: 0.6,
      roughness: 0.06,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.4
    }));

  const emissive = (APP.emissive = (color, intensity = 1) =>
    new THREE.MeshBasicMaterial({ color: srgb(color).multiplyScalar(intensity) }));

  const M = (APP.M = {
    gold: metal(C.gold, 0.24),
    goldLt: metal(C.goldLt, 0.18),
    goldDk: metal(C.goldDk, 0.38),
    brass: metal(0xd8a35a, 0.3),
    chrome: metal(0xe4ecff, 0.04, 1.0),
    white: toon(C.white),
    ivory: toon(C.ivory),
    cream: toon(C.cream),
    red: toon(C.red),
    redDk: toon(C.redDk),
    pink: toon(C.pink),
    pinkDk: toon(C.pinkDk),
    lilac: toon(C.lilac),
    teal: toon(C.teal),
    tealDk: toon(C.tealDk),
    blue: toon(C.blue),
    navy: toon(C.navy),
    wood: toon(C.wood),
    woodDk: toon(C.woodDk),
    iron: toon(C.iron),
    velvet: toon(C.velvet),
    orange: gloss(C.orange, 0.2),
    mint: toon(C.mint),
    glass: glass(0.14),
    glassThick: glass(0.26)
  });

  /* ---------------- 几何 & 摆放工具 ---------------- */
  const G = (APP.G = {
    box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
    cyl: (rt, rb, h, s = 18, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open),
    sph: (r, s = 16) => new THREE.SphereGeometry(r, s, Math.max(6, s >> 1)),
    con: (r, h, s = 18) => new THREE.ConeGeometry(r, h, s),
    tor: (r, t, rs = 8, ts = 32, a = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, a),
    pla: (w, h, ws = 1, hs = 1) => new THREE.PlaneGeometry(w, h, ws, hs),
    cap: (r, len, cs = 6, rs = 12) =>
      THREE.CapsuleGeometry
        ? new THREE.CapsuleGeometry(r, len, cs, rs)
        : new THREE.CylinderGeometry(r, r, len, rs)
  });

  const mesh = (APP.mesh = function (geo, mat, x, y, z, cast) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = cast !== false;
    m.receiveShadow = true;
    return m;
  });

  /* 反向外壳描边：自动按物体尺寸计算厚度，柔和不炸边 */
  const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x1d1430, side: THREE.BackSide });
  const outline = (APP.outline = function (m, t) {
    if (!m || !m.isMesh || m.userData.noOutline) return m;
    m.geometry.computeBoundingSphere();
    const r = (m.geometry.boundingSphere ? m.geometry.boundingSphere.radius : 1) *
      Math.max(m.scale.x, m.scale.y, m.scale.z);
    const k = Math.max(0.016, Math.min(0.09, (t || 0.028) / Math.max(0.12, r)));
    const o = new THREE.Mesh(m.geometry, OUTLINE);
    o.scale.setScalar(1 + k);
    o.castShadow = false;
    o.receiveShadow = false;
    o.userData.noOutline = true;
    m.add(o);
    return m;
  });
  const outlineAll = (APP.outlineAll = function (root, t) {
    root.traverse((o) => {
      if (o.isMesh && !o.userData.noOutline && !o.userData.skipOutline) outline(o, t);
    });
    return root;
  });

  /* 帧回调登记 */
  APP.tickers = [];
  APP.onFrame = (fn) => APP.tickers.push(fn);

  /* ---------------- 程序化贴图 ---------------- */
  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  APP.cv = cv;

  /* 彩色几何拼花地砖 */
  APP.tileTexture = function () {
    const S = 512;
    const c = cv(S, S);
    const g = c.getContext('2d');
    const pal = [
      ['#1a2352', '#2a6f7c', '#dcc392', '#b8445f'],
      ['#241a4a', '#337d7a', '#e6d2ac', '#6d459f'],
      ['#152a52', '#276180', '#d8b982', '#c05573'],
      ['#1f1642', '#2f7170', '#e2caa0', '#7f4f96']
    ];
    const q = S / 2;
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const p = pal[(ty * 2 + tx) % 4];
        const ox = tx * q;
        const oy = ty * q;
        g.save();
        g.translate(ox, oy);
        // 底色
        g.fillStyle = p[0];
        g.fillRect(0, 0, q, q);
        // 四角三角
        g.fillStyle = p[1];
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(q, 0);
        g.lineTo(q / 2, q / 2);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(q, q);
        g.lineTo(0, q);
        g.lineTo(q / 2, q / 2);
        g.closePath();
        g.fill();
        // 中心菱形
        g.fillStyle = p[2];
        g.beginPath();
        g.moveTo(q / 2, q * 0.16);
        g.lineTo(q * 0.84, q / 2);
        g.lineTo(q / 2, q * 0.84);
        g.lineTo(q * 0.16, q / 2);
        g.closePath();
        g.fill();
        // 内层小菱形
        g.fillStyle = p[3];
        g.beginPath();
        g.moveTo(q / 2, q * 0.31);
        g.lineTo(q * 0.69, q / 2);
        g.lineTo(q / 2, q * 0.69);
        g.lineTo(q * 0.31, q / 2);
        g.closePath();
        g.fill();
        g.fillStyle = p[2];
        g.beginPath();
        g.arc(q / 2, q / 2, q * 0.055, 0, Math.PI * 2);
        g.fill();
        // 金线
        g.strokeStyle = 'rgba(233,180,78,0.85)';
        g.lineWidth = 2.5;
        g.strokeRect(1.5, 1.5, q - 3, q - 3);
        g.strokeStyle = 'rgba(255,240,200,0.35)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(q, q);
        g.moveTo(q, 0);
        g.lineTo(0, q);
        g.stroke();
        g.restore();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  };

  /* 木栈道 */
  APP.plankTexture = function (horizontal) {
    const c = cv(512, 512);
    const g = c.getContext('2d');
    g.fillStyle = '#4a2f1e';
    g.fillRect(0, 0, 512, 512);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const w = 512 / n;
      const base = 74 + Math.random() * 26;
      g.fillStyle = `rgb(${base + 26},${base - 4},${base - 26})`;
      g.fillRect(i * w + 1, 0, w - 2, 512);
      // 木纹
      for (let k = 0; k < 12; k++) {
        g.strokeStyle = `rgba(40,22,12,${0.05 + Math.random() * 0.12})`;
        g.lineWidth = 0.8 + Math.random() * 1.6;
        g.beginPath();
        const x = i * w + 4 + Math.random() * (w - 8);
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512);
        g.stroke();
      }
      // 缝隙阴影
      g.fillStyle = 'rgba(20,10,6,0.55)';
      g.fillRect(i * w, 0, 2, 512);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (horizontal) t.rotation = Math.PI / 2;
    return t;
  };

  /* 条纹（用于锥形屋顶、遮阳篷） */
  APP.stripeTexture = function (c1, c2, n, vertical) {
    const c = cv(512, 512);
    const g = c.getContext('2d');
    g.fillStyle = c1;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = c2;
    const w = 512 / n;
    for (let i = 0; i < n; i += 2) {
      if (vertical) g.fillRect(i * w, 0, w, 512);
      else g.fillRect(0, i * w, 512, w);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  };

  /* 发光文字 */
  APP.textTexture = function (text, opts) {
    const o = Object.assign(
      {
        w: 1024,
        h: 256,
        font: 'bold 150px Georgia, "Times New Roman", serif',
        color: '#fff6d8',
        glow: '#ff5fae',
        bg: null,
        border: null,
        letterSpacing: 0
      },
      opts || {}
    );
    const c = cv(o.w, o.h);
    const g = c.getContext('2d');
    if (o.bg) {
      g.fillStyle = o.bg;
      g.fillRect(0, 0, o.w, o.h);
    }
    if (o.border) {
      g.strokeStyle = o.border;
      g.lineWidth = 10;
      g.strokeRect(10, 10, o.w - 20, o.h - 20);
    }
    g.font = o.font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (o.letterSpacing) {
      // 手动字距
      const chars = text.split('');
      const widths = chars.map((ch) => g.measureText(ch).width + o.letterSpacing);
      const total = widths.reduce((a, b) => a + b, 0) - o.letterSpacing;
      let x = o.w / 2 - total / 2;
      g.shadowColor = o.glow;
      g.shadowBlur = 55;
      chars.forEach((ch, i) => {
        g.fillStyle = o.glow;
        g.fillText(ch, x + widths[i] / 2, o.h / 2);
        x += widths[i];
      });
      x = o.w / 2 - total / 2;
      g.shadowBlur = 26;
      chars.forEach((ch, i) => {
        g.fillStyle = o.color;
        g.fillText(ch, x + widths[i] / 2, o.h / 2);
        x += widths[i];
      });
    } else {
      g.shadowColor = o.glow;
      g.shadowBlur = 60;
      g.fillStyle = o.glow;
      g.fillText(text, o.w / 2, o.h / 2);
      g.shadowBlur = 30;
      g.fillStyle = o.color;
      g.fillText(text, o.w / 2, o.h / 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  };

  /* 柔光圆点（蒸汽、光晕） */
  APP.glowTexture = function (inner, outer) {
    const c = cv(128, 128);
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, inner || 'rgba(255,255,255,1)');
    rg.addColorStop(0.45, outer || 'rgba(255,255,255,0.35)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  };

  /* ---------------- 灯泡串（跑马灯） ---------------- */
  const bulbGeo = new THREE.SphereGeometry(1, 8, 6);
  class Bulbs {
    constructor(positions, radius, color) {
      this.n = positions.length;
      this.mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.mesh = new THREE.InstancedMesh(bulbGeo, this.mat, this.n);
      this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      const mtx = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3(radius, radius, radius);
      const v = new THREE.Vector3();
      for (let i = 0; i < this.n; i++) {
        const p = positions[i];
        v.set(p.x, p.y, p.z);
        mtx.compose(v, q, s);
        this.mesh.setMatrixAt(i, mtx);
        this.mesh.setColorAt(i, new THREE.Color(1, 1, 1));
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor.needsUpdate = true;
      this.mesh.castShadow = false;
      this.mesh.receiveShadow = false;
      this.base = srgb(color || 0xffcf82);
      this.col = new THREE.Color();
      this.speed = 3.2;
      this.phase = Math.random() * 8;
      this.spread = 0.55;
      this.min = 0.18;
      this.gain = 1.28;
    }
    update(t) {
      const n = this.n;
      for (let i = 0; i < n; i++) {
        const f = 0.5 + 0.5 * Math.sin(t * this.speed - i * this.spread + this.phase);
        const k = this.min + (1 - this.min) * Math.pow(f, 1.7);
        this.col.copy(this.base).multiplyScalar(k * this.gain);
        this.mesh.setColorAt(i, this.col);
      }
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
  APP.Bulbs = Bulbs;

  /* 环形灯泡坐标 */
  APP.ringPoints = function (count, radius, y, cx, cz, startAngle) {
    const out = [];
    const a0 = startAngle || 0;
    for (let i = 0; i < count; i++) {
      const a = a0 + (i / count) * Math.PI * 2;
      out.push({ x: (cx || 0) + Math.cos(a) * radius, y, z: (cz || 0) + Math.sin(a) * radius });
    }
    return out;
  };

  APP.bulbs = [];

  /* ---------------- 尺寸自适应 ---------------- */
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
})();
