import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================
   0. RENDERER / SCENE / CAMERA
   ============================================================ */
const host = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.5, 2200);
camera.position.set(88, 58, 104);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-2, 17, -4);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.65;
controls.screenSpacePanning = false;
controls.minDistance = 28;
controls.maxDistance = 300;
controls.minPolarAngle = 0.14;
controls.maxPolarAngle = 1.44;
controls.update();

const _p = new URLSearchParams(location.search);
if (_p.has('cam')) {
  const v = _p.get('cam').split(',').map(Number);
  if (v.length >= 6 && v.every(n => isFinite(n))) {
    camera.position.set(v[0], v[1], v[2]);
    controls.target.set(v[3], v[4], v[5]);
    controls.update();
  }
}

const world = new THREE.Group();
scene.add(world);

/* ============================================================
   1. CONSTANTS
   ============================================================ */
const B = 84;            // base size
const HALF = B / 2;
const SEA_Y = 0;
const TOP = 13;          // cliff plateau height

/* ============================================================
   2. SKY
   ============================================================ */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {
    cTop:  { value: new THREE.Color('#5aa6d4') },
    cMid:  { value: new THREE.Color('#ffd0a8') },
    cLow:  { value: new THREE.Color('#ffb185') },
    cSun:  { value: new THREE.Color('#ffe9c2') },
    sunDir: { value: new THREE.Vector3(0.82, 0.16, 0.38).normalize() }
  },
  vertexShader: `
    varying vec3 vW;
    void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 cTop, cMid, cLow, cSun, sunDir;
    varying vec3 vW;
    void main(){
      vec3 d = normalize(vW);
      float t = smoothstep(-0.9, 0.35, d.y);
      vec3 col = mix(cLow, cMid, smoothstep(0.0, 0.42, t));
      col = mix(col, cTop, smoothstep(0.38, 1.0, t));
      float s = max(dot(d, normalize(sunDir)), 0.0);
      col += cSun * pow(s, 90.0) * 1.1;
      col += cSun * pow(s, 8.0) * 0.20;
      col += cSun * exp(-abs(d.y - 0.02) * 6.0) * 0.16;
      gl_FragColor = vec4(col, 1.0);
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 26), skyMat);
sky.frustumCulled = false;
scene.add(sky);

/* soft clouds */
(function clouds() {
  const g = new THREE.Group();
  scene.add(g);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffe8d2, transparent: true, opacity: 0.55, depthWrite: false });
  const mat2 = new THREE.MeshBasicMaterial({ color: 0xffc9ae, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * 6.283;
    const r = 420 + Math.random() * 320;
    const yy = 40 + Math.random() * 260;
    const cl = new THREE.Group();
    cl.position.set(Math.cos(a) * r, yy, Math.sin(a) * r);
    const n = 4 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) {
      const s = 26 + Math.random() * 42;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), k % 3 === 0 ? mat2 : cloudMat);
      puff.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 80);
      puff.scale.y = 0.5;
      cl.add(puff);
    }
    g.add(cl);
  }
})();

/* ============================================================
   3. LIGHTS
   ============================================================ */
const sun = new THREE.DirectionalLight(0xffd2a2, 2.2);
sun.position.set(120, 46, 62);
sun.target.position.set(-4, 12, -4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 74;
sun.shadow.camera.bottom = -74;
sun.shadow.camera.near = 40;
sun.shadow.camera.far = 320;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target);

const fill = new THREE.DirectionalLight(0xa8d6f0, 0.95);
fill.position.set(-80, 60, -60);
scene.add(fill);

scene.add(new THREE.HemisphereLight(0xcfe8f5, 0xd9bd96, 0.95));
scene.add(new THREE.AmbientLight(0xfff0dd, 0.34));

const L_CAFE = new THREE.PointLight(0xffc98e, 30, 24, 2);
L_CAFE.position.set(-1, 18.5, -6);
scene.add(L_CAFE);
const L_SUNROOM = new THREE.PointLight(0xffe0b0, 18, 18, 2);
L_SUNROOM.position.set(13, 17, -6);
scene.add(L_SUNROOM);

/* ============================================================
   4. TEXTURES
   ============================================================ */
const MAXANISO = renderer.capabilities.getMaxAnisotropy();
const R = Math.random;

function makeTex(w, h, draw, rep) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, MAXANISO);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}

/* weathered white stucco */
const stuccoTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#fbf3e6'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(226,208,184,0.30)' : 'rgba(255,252,246,0.5)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 24 + R()*90, 18 + R()*70, R()*3, 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 2400; i++) {
    const k = R();
    ctx.fillStyle = k < 0.4 ? 'rgba(214,196,172,0.30)' : k < 0.75 ? 'rgba(255,255,252,0.55)' : 'rgba(198,176,150,0.22)';
    ctx.beginPath(); ctx.arc(R()*w, R()*h, R()*2.4 + 0.4, 0, 6.283); ctx.fill();
  }
  /* weather streaks */
  ctx.strokeStyle = 'rgba(206,188,164,0.22)'; ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const x = R()*w;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y < h; y += 24) ctx.lineTo(x + Math.sin(y * 0.02) * 4, y);
    ctx.stroke();
  }
}, [3, 2]);

/* terracotta roof tiles */
const tileTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#a9503a'; ctx.fillRect(0, 0, w, h);
  const cols = 9, rows = 7;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * w / cols, y = r * h / rows;
      const v = 0.84 + R() * 0.32;
      ctx.fillStyle = `rgb(${Math.round(206*v)},${Math.round(112*v)},${Math.round(80*v)})`;
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + w / cols - 2, y);
      ctx.lineTo(x + w / cols - 2, y + h / rows - 3);
      ctx.quadraticCurveTo(x + w / cols / 2, y + h / rows + 7, x + 2, y + h / rows - 3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,56,38,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = R() < 0.6 ? 'rgba(122,140,84,0.30)' : 'rgba(90,100,64,0.24)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 6 + R()*22, 4 + R()*14, R()*3, 0, 6.283); ctx.fill();
  }
}, [7, 4]);

/* cliff rock */
const rockTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#c8ab84'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(180,150,112,0.35)' : 'rgba(226,206,176,0.30)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 30 + R()*90, 20 + R()*60, R()*3, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(140,112,80,0.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    let x = R()*w, y = R()*h;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (R()-0.5)*90; y += (R()-0.5)*90; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = R() < 0.5 ? 'rgba(150,124,92,0.30)' : 'rgba(238,222,196,0.35)';
    ctx.beginPath(); ctx.arc(R()*w, R()*h, R()*2.6 + 0.4, 0, 6.283); ctx.fill();
  }
}, [2, 2]);

/* wood */
const woodTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#b98a5c'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = R() < 0.5 ? 'rgba(140,98,60,0.35)' : 'rgba(214,176,134,0.30)';
    ctx.lineWidth = R() * 2.6 + 0.6;
    const x = R()*w;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y <= h; y += 18) ctx.lineTo(x + Math.sin(y*0.03 + x)*3.6, y);
    ctx.stroke();
  }
}, [2, 2]);

/* mosaic floor */
const mosaicTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f0e6d2'; ctx.fillRect(0, 0, w, h);
  const n = 8, s = w / n;
  const pal = ['#e8dcc4', '#d9c9ac', '#f6efe0', '#e2d3b8'];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    ctx.fillStyle = pal[(x * 3 + y * 5) % pal.length];
    ctx.fillRect(x*s + 1.5, y*s + 1.5, s - 3, s - 3);
  }
  /* blue border motif */
  ctx.strokeStyle = '#6ba8b8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(w/2, h/2, w*0.28, 0, 6.283); ctx.stroke();
  ctx.beginPath(); ctx.arc(w/2, h/2, w*0.16, 0, 6.283); ctx.stroke();
}, [3, 3]);

/* chalkboard menu */
const chalkTex = makeTex(256, 320, (ctx, w, h) => {
  ctx.fillStyle = '#2f3a36'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(240,238,225,0.9)'; ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.fillStyle = '#f2efe0';
  ctx.font = 'bold 30px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('MENU', w/2, 56);
  ctx.font = '17px Georgia, serif'; ctx.textAlign = 'left';
  const items = [['Espresso', '2.5'], ['Cappuccino', '3.0'], ['Caffè Latte', '3.5'],
                 ['Croissant', '2.0'], ['Torta', '4.0'], ['Limonata', '3.0'], ['Vino', '5.0']];
  items.forEach(([n, p], i) => {
    ctx.fillText(n, 34, 100 + i * 28);
    ctx.textAlign = 'right'; ctx.fillText(p, w - 34, 100 + i * 28); ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(240,238,225,0.35)';
    ctx.beginPath(); ctx.moveTo(34, 106 + i * 28); ctx.lineTo(w - 34, 106 + i * 28); ctx.stroke();
  });
});

/* soft radial */
const softTex = makeTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

/* paper grain */
const paperTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 46;
    d[i] = d[i+1] = d[i+2] = v;
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.20;
  for (let i = 0; i < 260; i++) {
    ctx.strokeStyle = R() < 0.5 ? '#9a9a9a' : '#6a6a6a';
    ctx.lineWidth = R() * 1.6 + 0.4;
    const x = R()*w, y = R()*h, a = R()*3.14, l = 6 + R()*40;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); ctx.stroke();
  }
}, [1, 1]);

/* ============================================================
   5. MATERIALS
   ============================================================ */
const gradData = new Uint8Array([118, 158, 196, 228, 255]);
const grad = new THREE.DataTexture(gradData, gradData.length, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter;
grad.generateMipmaps = false;
grad.needsUpdate = true;

const toon = (color, opts = {}) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: grad }, opts));
const toonM = (map, opts = {}) => new THREE.MeshToonMaterial(Object.assign({ map, gradientMap: grad }, opts));

const M = {
  stucco:    toonM(stuccoTex),
  stuccoWarm: toon(0xf6e7d2),
  white:     toon(0xfdf8ef),
  tile:      toonM(tileTex),
  rock:      toonM(rockTex),
  rockSide:  (() => { const t = rockTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 2); return new THREE.MeshToonMaterial({ map: t, gradientMap: grad }); })(),
  rockLight: toon(0xd9c2a0),
  wood:      toonM(woodTex),
  woodDark:  toon(0x8a6440),
  teal:      toon(0x4f9fa8),
  deepTeal:  toon(0x2f7d88),
  terra:     toon(0xc25a3e),
  pink:      toon(0xe0619a),
  pinkLight: toon(0xef8ab8),
  leaf:      toon(0x5c8f52),
  leafDeep:  toon(0x3f7040),
  leafOlive: toon(0x7aa05a),
  sand:      toon(0xe8d4ae),
  metal:     new THREE.MeshPhongMaterial({ color: 0x3a4a52, shininess: 70, specular: 0xbfd0d8 }),
  brass:     new THREE.MeshPhongMaterial({ color: 0xc9a25c, shininess: 110, specular: 0xffefc0 }),
  glass: new THREE.MeshPhongMaterial({
    color: 0xcdeef2, transparent: true, opacity: 0.30,
    shininess: 240, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false
  }),
  windowGlass: new THREE.MeshPhongMaterial({
    color: 0xd8f2f4, transparent: true, opacity: 0.10,
    shininess: 240, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false
  }),
  glassDeep: new THREE.MeshPhongMaterial({
    color: 0x9fd8e0, transparent: true, opacity: 0.42,
    shininess: 240, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false
  }),
  mosaic:    toonM(mosaicTex)
};

const pulses = [];
function glowMat(r, g, b, amp = 0.2, speed = 1.5, phase = 0) {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.color.setRGB(r, g, b);
  m.userData.base = { r, g, b };
  pulses.push({ mat: m, base: { r, g, b }, amp, speed, phase });
  return m;
}
const glowFlat = (r, g, b) => {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.color.setRGB(r, g, b);
  return m;
};

/* soft outline material */
const outlineMat = new THREE.MeshBasicMaterial({
  color: 0x6d7f8c, side: THREE.BackSide, transparent: true, opacity: 0.55
});
function outline(mesh, s = 1.035) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat);
  o.scale.setScalar(s);
  o.castShadow = false;
  o.receiveShadow = false;
  mesh.add(o);
  return mesh;
}

/* ============================================================
   6. HELPERS
   ============================================================ */
function mkBox(w, h, d, mat, r = 0, seg = 1) {
  let geo;
  if (r > 0) {
    const rr = Math.min(r, w * 0.48, h * 0.48, d * 0.48);
    geo = new RoundedBoxGeometry(w, h, d, seg, rr);
  } else geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function mkCyl(rt, rb, h, seg, mat, open) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1, !!open), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function mkSph(r, mat, seg) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, (seg || 14) * 0.65), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function place(p, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); p.add(m); return m;
}
const X = (p, w, h, d, m, x, y, z, r = 0, rx = 0, ry = 0, rz = 0) =>
  place(p, mkBox(w, h, d, m, r), x, y, z, rx, ry, rz);
const Cy = (p, rt, rb, h, sg, m, x, y, z, rx = 0, ry = 0, rz = 0) =>
  place(p, mkCyl(rt, rb, h, sg, m), x, y, z, rx, ry, rz);
const Sp = (p, r, m, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const s = mkSph(r, m); s.scale.set(sx, sy, sz); return place(p, s, x, y, z);
};
const To = (p, r, t, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 18) =>
  place(p, new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg), m), x, y, z, rx, ry, rz);

function flatGeo(geo) {
  const g2 = geo.index ? geo.toNonIndexed() : geo;
  g2.computeVertexNormals();
  return g2;
}
function mkFlat(geo, mat) {
  const m = new THREE.Mesh(flatGeo(geo), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* arched opening helper: returns a shape ready for extrude (wall with arch cut) */
function archShape(w, h, archH) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(-w / 2, h - archH);
  s.quadraticCurveTo(-w / 2, h, 0, h);
  s.quadraticCurveTo(w / 2, h, w / 2, h - archH);
  s.lineTo(w / 2, 0);
  s.lineTo(-w / 2, 0);
  return s;
}

/* ============================================================
   7. BASE — half cliff, half jelly sea
   ============================================================ */
let seaTop = null;
const foamRings = [];

function buildBase() {
  const g = new THREE.Group();
  world.add(g);

  /* ---- cliff plateau ---- */
  const plateau = new THREE.Mesh(
    new RoundedBoxGeometry(B, TOP + 7, 48, 2, 1.0),
    [M.rockSide, M.rockSide, toon(0x8fae62), M.rock, M.rockSide, M.rockSide]
  );
  plateau.position.set(0, (TOP + 7) / 2 - 7, -18);
  plateau.castShadow = true; plateau.receiveShadow = true;
  g.add(plateau);

  /* grassy top */
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(B - 0.4, 47.4), toon(0x93b268));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, TOP + 0.02, -18);
  grass.receiveShadow = true;
  g.add(grass);

  /* ---- rocky cliff face ---- */
  const faceZ = 6;
  const rockMatA = toon(0xd6bd99);
  const rockMatB = toon(0xc2a37d);
  const rockMatC = toon(0xac8d68);
  /* layered rock strata on the cliff face */
  for (let row = 0; row < 6; row++) {
    const y = 1.1 + row * 2.05;
    for (let i = 0; i < 10; i++) {
      const w = 7.5 + Math.random() * 6.5;
      const x = -HALF + 2 + i * 8.4 + (row % 2) * 3.8 + (Math.random() - 0.5) * 2.4;
      const d = 3.0 + Math.random() * 2.6;
      const mat = [rockMatA, rockMatB, rockMatC][(i + row) % 3];
      const slab = X(g, w, 1.7 + Math.random() * 0.8, d, mat,
        x, y, faceZ - d / 2 + Math.random() * 2.2, 0.34, 0, 0, (Math.random() - 0.5) * 0.05);
      slab.rotation.x = (Math.random() - 0.5) * 0.07;
      slab.castShadow = true; slab.receiveShadow = true;
      if (Math.random() < 0.3) {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 5, 0, 6.283, 0, Math.PI * 0.4), M.leafDeep);
        tuft.position.set(x + (Math.random() - 0.5) * 4, y + 0.9, faceZ + 0.2);
        tuft.scale.set(1.4, 0.34, 0.9);
        g.add(tuft);
      }
    }
  }
  /* rock slabs on the side faces */
  for (let i = 0; i < 9; i++) {
    const z = -40 + i * 5.2 + Math.random() * 2;
    const y = 2.4 + (i % 3) * 3.2 + Math.random();
    [-1, 1].forEach(sd => {
      const slab = X(g, 2.6 + Math.random() * 1.6, 1.6 + Math.random() * 0.9, 6.5 + Math.random() * 3,
        [rockMatA, rockMatB, rockMatC][(i + (sd > 0 ? 1 : 0)) % 3],
        sd * (HALF - 0.6), y, z, 0.3);
      slab.rotation.z = sd * 0.05;
      slab.castShadow = true; slab.receiveShadow = true;
    });
  }

  /* boulders at the waterline */
  for (let i = 0; i < 16; i++) {
    const x = -HALF + 2 + Math.random() * (B - 4);
    const s = 1.3 + Math.random() * 2.0;
    const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), i % 3 === 0 ? M.rockLight : rockMatB);
    rk.position.set(x, s * 0.3 - 0.5, faceZ + 1 + Math.random() * 5);
    rk.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rk.scale.y = 0.7;
    rk.castShadow = true; rk.receiveShadow = true;
    g.add(rk);
  }

  /* ---- jelly sea ---- */
  const seaDepth = 7.5;
  const jelly = new THREE.Mesh(
    new RoundedBoxGeometry(B, seaDepth, 42, 2, 0.7),
    new THREE.MeshPhongMaterial({
      color: 0x2fb6c8, transparent: true, opacity: 0.55,
      shininess: 30, specular: 0x3f6f80, depthWrite: true
    })
  );
  jelly.position.set(0, -seaDepth / 2 - 0.4, 21);
  jelly.receiveShadow = true;
  g.add(jelly);
  /* inner darker core for depth */
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(B - 6, 3.4, 34),
    new THREE.MeshPhongMaterial({ color: 0x1a7f96, transparent: true, opacity: 0.5, shininess: 20, specular: 0x336677 })
  );
  core.position.set(0, -4.6, 21);
  g.add(core);

  /* sea surface shader */
  const seaMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color('#63d0de') },
      uDeep: { value: new THREE.Color('#1c7b98') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uSun: { value: new THREE.Color('#ffd08a') }
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.z += sin(p.x * 0.35 + p.y * 0.2) * 0.16;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uShallow, uDeep, uFoam, uSun;
      varying vec2 vUv; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
      }
      void main(){
        vec2 uv = vUv;
        float n1 = noise(vec2(uv.x*8.0, uv.y*4.5 - uTime*0.06));
        float n2 = noise(vec2(uv.x*21.0 + 7.0, uv.y*11.0 - uTime*0.11));
        float n3 = noise(vec2(uv.x*48.0, uv.y*26.0 - uTime*0.19));
        float w = n1*0.48 + n2*0.32 + n3*0.20;
        vec3 col = mix(uDeep, uShallow, smoothstep(0.26, 0.86, w));
        /* shallower & brighter near the shore */
        col = mix(col, uShallow, smoothstep(0.72, 0.90, uv.y) * 0.45);
        /* sunset glitter */
        float sp = pow(max(0.0, n3 - 0.60) * 2.6, 2.0);
        col += uSun * sp * (0.45 + 0.55*sin(uTime*2.6 + uv.x*90.0 + uv.y*40.0)) * 0.38;
        /* shore foam */
        float shore = smoothstep(0.805, 0.895, uv.y) * (0.45 + 0.55*sin(uTime*1.5 + uv.x*52.0));
        col = mix(col, uFoam, clamp(shore * 0.85, 0.0, 0.8));
        /* crest lines */
        col += uFoam * smoothstep(0.93, 1.0, n2) * 0.09;
        gl_FragColor = vec4(col, 0.94);
      }`
  });
  seaTop = new THREE.Mesh(new THREE.PlaneGeometry(B, 42, 40, 20), seaMat);
  seaTop.rotation.x = -Math.PI / 2;
  seaTop.position.set(0, 0.02, 21);
  seaTop.receiveShadow = true;
  g.add(seaTop);

  /* foam rings lapping the rocks */
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.1, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-34 + Math.random() * 66, 0.09, 4.5 + Math.random() * 5);
    g.add(ring);
    foamRings.push({ mesh: ring, t: Math.random() });
  }

  /* plinth edge */
  X(g, B + 1.4, 1.2, B + 1.4, M.white, 0, -8.0, 0, 0.2);

  return g;
}

/* ============================================================
   8. LIGHTHOUSE
   ============================================================ */
let beamGroup = null, lampGlow = null;

function buildLighthouse() {
  const g = new THREE.Group();
  world.add(g);
  const lx = -25, lz = -14;
  const baseY = TOP;

  /* base plinth */
  const plinth = X(g, 14, 2.6, 14, M.white, lx, baseY + 1.3, lz, 0.5);
  outline(plinth, 1.03);
  X(g, 15.4, 0.6, 15.4, M.stuccoWarm, lx, baseY + 2.75, lz, 0.2);

  /* tower drum, tapered in 4 segments */
  const segs = [
    [5.2, 4.9, 5.6], [4.9, 4.4, 5.6], [4.4, 3.9, 5.6], [3.9, 3.5, 5.2]
  ];
  let yy = baseY + 2.9;
  segs.forEach(([rb, rt, h], i) => {
    const seg = Cy(g, rt, rb, h, 26, M.stucco, lx, yy + h / 2, lz);
    outline(seg, 1.03);
    yy += h;
    if (i < segs.length - 1) {
      X(g, rt * 2 + 0.9, 0.4, rt * 2 + 0.9, M.stuccoWarm, lx, yy, lz, 0.15);
    }
  });
  const towerTop = yy;

  /* red band */
  Cy(g, 5.16, 5.06, 1.6, 26, M.terra, lx, baseY + 6.4, lz);
  /* small windows */
  [0, 1, 2].forEach(i => {
    const a = -0.9 + i * 2.1;
    const rr = 4.6 - i * 0.25;
    const wy = baseY + 6.5 + i * 5.2;
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6),
      glowMat(1.6, 1.25, 0.75, 0.15, 1.2, i));
    wm.position.set(lx + Math.sin(a) * rr, wy, lz + Math.cos(a) * rr);
    wm.rotation.y = a;
    g.add(wm);
    X(g, 1.3, 0.22, 0.25, M.white, lx + Math.sin(a) * rr, wy + 0.9, lz + Math.cos(a) * rr, 0.05, 0, a, 0);
  });

  /* gallery */
  const galY = towerTop + 0.2;
  Cy(g, 4.9, 4.9, 0.4, 26, M.white, lx, galY, lz);
  To(g, 4.75, 0.12, M.metal, lx, galY + 1.05, lz, Math.PI / 2);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * 6.283;
    Cy(g, 0.07, 0.07, 1.05, 5, M.metal, lx + Math.cos(a) * 4.68, galY + 0.55, lz + Math.sin(a) * 4.68);
  }

  /* lantern room */
  const lrY = galY + 1.2;
  Cy(g, 3.0, 3.0, 0.4, 20, M.white, lx, lrY, lz);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.283;
    Cy(g, 0.1, 0.1, 3.0, 5, M.metal, lx + Math.cos(a) * 2.9, lrY + 1.7, lz + Math.sin(a) * 2.9);
  }
  const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 3.0, 20, 1, true), M.glassDeep);
  lanternGlass.position.set(lx, lrY + 1.7, lz);
  g.add(lanternGlass);
  /* lamp */
  const lamp = Sp(g, 1.15, glowMat(3.0, 2.6, 1.7, 0.10, 3.0, 0), lx, lrY + 1.8, lz);
  lamp.castShadow = false;
  /* roof */
  const cap = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.4, 20), M.terra);
  cap.position.set(lx, lrY + 4.4, lz);
  cap.castShadow = true;
  g.add(cap);
  To(g, 3.35, 0.14, M.white, lx, lrY + 3.3, lz, Math.PI / 2);
  Cy(g, 0.16, 0.16, 1.2, 6, M.metal, lx, lrY + 6.0, lz);
  Sp(g, 0.32, M.brass, lx, lrY + 6.7, lz);

  /* rotating beam */
  beamGroup = new THREE.Group();
  beamGroup.position.set(lx, lrY + 1.8, lz);
  g.add(beamGroup);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffeed0, transparent: true, opacity: 0.02,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const beamGeo = new THREE.ConeGeometry(1.6, 26, 12, 1, true);
  const beam1 = new THREE.Mesh(beamGeo, beamMat);
  beam1.rotation.z = Math.PI / 2;
  beam1.position.x = 13;
  beamGroup.add(beam1);
  const beam2 = new THREE.Mesh(beamGeo, beamMat);
  beam2.rotation.z = -Math.PI / 2;
  beam2.position.x = -13;
  beamGroup.add(beam2);

  /* spiral external stair */
  const stair = new THREE.Group();
  stair.position.set(lx, baseY + 2.9, lz);
  g.add(stair);
  const steps = 26;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 3.2;
    const y = t * 9.5;
    const rr = 5.6 - t * 0.45;
    X(stair, 2.1, 0.16, 1.0, M.woodDark, Math.sin(a) * rr, y, Math.cos(a) * rr, 0.04, 0, a, 0);
    if (i % 2 === 0) {
      Cy(stair, 0.06, 0.06, 1.1, 5, M.metal, Math.sin(a) * (rr - 0.4), y + 0.55, Math.cos(a) * (rr - 0.4));
    }
  }
  const railPts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = t * Math.PI * 3.2;
    const rr = 5.6 - t * 0.45;
    railPts.push(new THREE.Vector3(Math.sin(a) * (rr + 0.42), t * 9.5 + 1.0, Math.cos(a) * (rr + 0.42)));
  }
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 60, 0.07, 5, false), M.metal);
  rail.castShadow = true;
  stair.add(rail);

  return g;
}

/* ============================================================
   9. CAFÉ + SUNROOM
   ============================================================ */
let fanBlades = null;
const steamSprites = [];

function buildCafe() {
  const g = new THREE.Group();
  world.add(g);
  const y0 = TOP;
  const cx = 0, cz = -10;
  const W = 20, D = 15, H = 8.6;

  /* ---- shell: back + side walls (front stays open for the arches) ---- */
  const frontZ = cz + D / 2;
  X(g, W, H, 0.7, M.stucco, cx, y0 + H / 2, cz - D / 2 + 0.35, 0.14);
  [-1, 1].forEach(sd => {
    X(g, 0.7, H, D, M.stucco, cx + sd * (W / 2 - 0.35), y0 + H / 2, cz, 0.14);
    [0, 1].forEach(k => {
      const wz = cz - 3.8 + k * 6.6;
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.6), M.glassDeep);
      gm.position.set(cx + sd * (W / 2 - 0.02), y0 + 4.6, wz);
      gm.rotation.y = sd * Math.PI / 2;
      g.add(gm);
      X(g, 0.16, 3.0, 2.1, M.white, cx + sd * (W / 2 - 0.12), y0 + 4.6, wz, 0.06);
      X(g, 0.18, 0.2, 2.1, M.teal, cx + sd * (W / 2 - 0.05), y0 + 6.15, wz, 0.04);
    });
  });
  /* mosaic floor */
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.7, D - 0.7), M.mosaic);
  fl.rotation.x = -Math.PI / 2; fl.position.set(cx, y0 + 0.24, cz); fl.receiveShadow = true;
  g.add(fl);
  /* ceiling */
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.7, D - 0.7), toon(0xfaf0e0));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, y0 + H - 0.2, cz);
  g.add(ceil);
  /* deep teal accent wall at the back */
  X(g, W - 0.9, H - 0.6, 0.1, toon(0x2f6b74), cx, y0 + H / 2, cz - D / 2 + 0.86, 0.03);
  /* warm plaster strip + ceiling beams */
  X(g, W - 1.0, 1.5, 0.18, toon(0xe0c8a6), cx, y0 + 1.05, cz - D / 2 + 0.72, 0.04);
  for (let i = 0; i < 4; i++) {
    X(g, W - 1.2, 0.34, 0.4, M.woodDark, cx, y0 + H - 0.6, cz - 5.2 + i * 3.4, 0.05);
  }

  /* ---- arched facade ---- */
  const archW = 3.6, archH = 5.4, archTop = 1.9;
  const archXs = [-6.4, -2.1, 2.2, 6.5];
  const fz = frontZ - 0.35;

  /* piers between the arches */
  const gaps = [];
  let prev = cx - W / 2 + 0.3;
  archXs.forEach(ax => {
    gaps.push([prev, cx + ax - archW / 2]);
    prev = cx + ax + archW / 2;
  });
  gaps.push([prev, cx + W / 2 - 0.3]);
  gaps.forEach(([x0, x1]) => {
    const gm = X(g, x1 - x0, 6.0, 0.7, M.stucco, (x0 + x1) / 2, y0 + 3.0, fz, 0.08);
    outline(gm, 1.02);
  });
  /* arch rings + spandrel above */
  archXs.forEach(ax => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(archW / 2, 0.2, 6, 18, Math.PI), M.white);
    ring.position.set(cx + ax, y0 + 0.6 + archH, frontZ - 0.02);
    ring.scale.y = archTop / (archW / 2);
    g.add(ring);
    /* glass inside the arch */
    const shape = archShape(archW, archH + archTop, archTop);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
    const gm = new THREE.Mesh(geo, M.windowGlass);
    gm.position.set(cx + ax, y0 + 0.6, frontZ - 0.62);
    gm.renderOrder = 5;
    g.add(gm);
    /* slim mullions */
    X(g, 0.14, archH, 0.16, M.white, cx + ax, y0 + 0.6 + archH / 2, frontZ - 0.3, 0.03);
    X(g, archW, 0.14, 0.16, M.white, cx + ax, y0 + 3.2, frontZ - 0.3, 0.03);
  });
  /* spandrel / frieze above the arches */
  X(g, W, H - 7.9, 0.7, M.stucco, cx, y0 + 7.9 + (H - 7.9) / 2, fz, 0.08);
  /* teal trim band */
  X(g, W + 0.3, 0.42, 0.86, M.teal, cx, y0 + 7.95, fz, 0.06);
  /* plinth */
  X(g, W + 0.5, 0.6, 0.9, M.white, cx, y0 + 0.3, fz, 0.08);


  /* ---- terracotta roof ---- */
  const roof = X(g, W + 1.6, 1.1, D + 1.6, M.tile, cx, y0 + H + 0.55, cz, 0.3);
  outline(roof, 1.02);
  /* ridge */
  Cy(g, 0.5, 0.5, W + 1.2, 8, M.terra, cx, y0 + H + 1.3, cz, 0, 0, Math.PI / 2);
  /* eave brackets */
  for (let i = 0; i < 8; i++) {
    X(g, 0.3, 0.9, 0.3, M.white, cx - W / 2 + 1.2 + i * 2.4, y0 + H - 0.35, frontZ + 0.7);
  }

  /* ---- sunroom (glass) ---- */
  const sr = new THREE.Group();
  sr.position.set(13.5, y0, -8);
  g.add(sr);
  const SW = 12, SD = 13, SH = 6.2;
  X(sr, SW, 0.9, SD, M.white, 0, 0.45, 0, 0.16);
  const srFloor = new THREE.Mesh(new THREE.PlaneGeometry(SW - 0.6, SD - 0.6), M.mosaic);
  srFloor.rotation.x = -Math.PI / 2; srFloor.position.set(0, 0.92, 0); sr.add(srFloor);
  /* frame posts */
  [[-SW/2+0.3, -SD/2+0.3], [SW/2-0.3, -SD/2+0.3], [-SW/2+0.3, SD/2-0.3], [SW/2-0.3, SD/2-0.3],
   [0, SD/2-0.3], [0, -SD/2+0.3], [-SW/2+0.3, 0], [SW/2-0.3, 0]].forEach(([x, z]) => {
    X(sr, 0.26, SH, 0.26, M.white, x, 0.9 + SH / 2, z, 0.05);
  });
  /* glass walls */
  [[SW - 0.6, SH, 0, 0.9 + SH/2, SD/2 - 0.3, 0],
   [SW - 0.6, SH, 0, 0.9 + SH/2, -SD/2 + 0.3, 0],
   [SD, SH, SW/2 - 0.3, 0.9 + SH/2, 0, Math.PI/2],
   [SD, SH, -SW/2 + 0.3, 0.9 + SH/2, 0, Math.PI/2]].forEach(([w, h, x, y, z, ry]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    p.position.set(x, y, z); p.rotation.y = ry; p.renderOrder = 5;
    sr.add(p);
  });
  /* glass barrel roof */
  const srRoof = new THREE.Mesh(new THREE.CylinderGeometry(SD / 2 - 0.2, SD / 2 - 0.2, SW - 0.4, 16, 1, true, 0, Math.PI), M.glass);
  srRoof.rotation.z = Math.PI / 2;
  srRoof.position.set(0, 0.9 + SH, 0);
  srRoof.renderOrder = 5;
  sr.add(srRoof);
  for (let i = 0; i <= 5; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(SD / 2 - 0.2, 0.08, 5, 14, Math.PI), M.white);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(-SW / 2 + 0.4 + i * (SW - 0.8) / 5, 0.9 + SH, 0);
    sr.add(rib);
  }
  X(sr, SW - 0.4, 0.2, 0.22, M.white, 0, 0.9 + SH + SD / 2 - 0.3, 0, 0.04);

  /* ---- interior: bar counter facing the windows ---- */
  const barX = cx - 1, barZ = cz + 2.6;
  X(g, 9.0, 0.3, 1.7, M.wood, barX, y0 + 2.5, barZ, 0.08);
  X(g, 8.6, 2.2, 1.4, M.teal, barX, y0 + 1.35, barZ, 0.08);
  X(g, 9.2, 0.2, 1.9, M.white, barX, y0 + 2.68, barZ, 0.06);
  /* stools */
  for (let i = 0; i < 4; i++) {
    const sx = barX - 3.2 + i * 2.1;
    Cy(g, 0.55, 0.52, 0.24, 12, M.wood, sx, y0 + 2.0, barZ + 1.6);
    Cy(g, 0.09, 0.09, 1.7, 6, M.metal, sx, y0 + 1.05, barZ + 1.6);
    Cy(g, 0.55, 0.6, 0.12, 12, M.metal, sx, y0 + 0.3, barZ + 1.6);
  }

  /* espresso machine */
  X(g, 2.4, 1.0, 1.4, M.brass, barX + 3.0, y0 + 3.15, barZ, 0.16);
  X(g, 2.0, 0.7, 0.6, M.metal, barX + 3.0, y0 + 3.85, barZ, 0.1);
  Cy(g, 0.22, 0.22, 0.5, 10, M.metal, barX + 2.4, y0 + 2.9, barZ + 0.6);
  Cy(g, 0.22, 0.22, 0.5, 10, M.metal, barX + 3.6, y0 + 2.9, barZ + 0.6);
  X(g, 0.5, 0.12, 0.5, M.brass, barX + 2.4, y0 + 2.7, barZ + 0.7, 0.04);
  X(g, 0.5, 0.12, 0.5, M.brass, barX + 3.6, y0 + 2.7, barZ + 0.7, 0.04);

  /* display case */
  X(g, 3.4, 1.0, 1.4, M.white, barX - 2.4, y0 + 3.0, barZ, 0.06);
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 1.2), M.glass);
  caseGlass.position.set(barX - 2.4, y0 + 3.6, barZ);
  g.add(caseGlass);
  /* pastries */
  for (let i = 0; i < 6; i++) {
    const px = barX - 3.6 + (i % 3) * 1.0;
    const pz = barZ - 0.25 + Math.floor(i / 3) * 0.6;
    X(g, 0.6, 0.26, 0.42, toon(0xe0a85a), px, y0 + 3.2, pz, 0.1);
  }
  for (let i = 0; i < 2; i++) {
    Cy(g, 0.42, 0.42, 0.34, 12, toon(0xf0dcc0), barX - 3.2 + i * 1.4, y0 + 3.25, barZ + 0.1);
    Sp(g, 0.14, toon(0xe06a86), barX - 3.2 + i * 1.4, y0 + 3.45, barZ + 0.1, 1, 0.5, 1);
  }

  /* chalkboard menu on the back wall */
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2),
    new THREE.MeshBasicMaterial({ map: chalkTex }));
  menu.position.set(cx + 4.2, y0 + 4.6, cz - D / 2 + 1.02);
  g.add(menu);
  X(g, 2.9, 3.5, 0.16, M.woodDark, cx + 4.2, y0 + 4.6, cz - D / 2 + 0.94, 0.06);

  /* liquor shelf on the back wall */
  [3.4, 5.0, 6.4].forEach((sy, si) => {
    X(g, 12, 0.16, 1.0, M.wood, cx - 3, y0 + sy, cz - D / 2 + 0.9, 0.04);
    for (let i = 0; i < 14; i++) {
      const cols = [0xd9a441, 0x8fbf6a, 0xd96a5a, 0x7fa8d9, 0xe0d0a0];
      const c = cols[(i + si) % cols.length];
      Cy(g, 0.12, 0.15, 0.7 + Math.random() * 0.3, 7, toon(c), cx - 8.6 + i * 0.86, y0 + sy + 0.45, cz - D / 2 + 0.9);
    }
  });

  /* ceiling fan */
  const fan = new THREE.Group();
  fan.position.set(cx, y0 + H - 0.9, cz);
  g.add(fan);
  Cy(g, 0.09, 0.09, 0.9, 6, M.metal, cx, y0 + H - 0.45, cz);
  const blades = new THREE.Group();
  fan.add(blades);
  fanBlades = blades;
  Cy(blades, 0.36, 0.36, 0.3, 10, M.brass, 0, 0, 0);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * 6.283;
    const bl = X(blades, 2.2, 0.08, 0.5, M.wood, Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4, 0.04, 0, -a, 0);
    bl.castShadow = false;
  }

  /* hanging pendant lamps */
  [-6, 0, 6].forEach((px, i) => {
    Cy(g, 0.04, 0.04, 1.1, 5, M.metal, cx + px, y0 + H - 0.55, cz + 2.2);
    Cy(g, 0.44, 0.16, 0.4, 12, M.brass, cx + px, y0 + H - 1.2, cz + 2.2);
    Sp(g, 0.24, glowMat(2.6, 2.0, 1.2, 0.12, 1.1, i), cx + px, y0 + H - 1.45, cz + 2.2);
  });

  /* interior plants */
  [[-8.2, -3.4], [8.0, -4.2], [-8.4, 2.2], [7.8, 3.0]].forEach(([px, pz], i) => {
    Cy(g, 0.6, 0.7, 0.9, 10, M.terra, cx + px, y0 + 0.7, cz + pz);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.283;
      Sp(g, 0.62, i % 2 ? M.leaf : M.leafOlive,
        cx + px + Math.cos(a) * 0.6, y0 + 1.6 + Math.random() * 0.9, cz + pz + Math.sin(a) * 0.6,
        0.9, 1.15, 0.9);
    }
  });

  /* ---- sunroom interior: plants & tables ---- */
  [[-3, -3], [3.4, 2.6], [-2.6, 3.4]].forEach(([px, pz], i) => {
    Cy(sr, 0.7, 0.82, 1.1, 10, M.terra, px, 1.45, pz);
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * 6.283;
      Sp(sr, 0.72, k % 2 ? M.leafDeep : M.leaf,
        px + Math.cos(a) * 0.7, 2.4 + Math.random() * 1.4, pz + Math.sin(a) * 0.7, 1, 1.3, 1);
    }
  });
  [[2.2, -2.4], [-2.0, 0.6]].forEach(([px, pz]) => {
    Cy(sr, 0.72, 0.72, 0.14, 14, M.white, px, 2.5, pz);
    Cy(sr, 0.1, 0.1, 1.5, 6, M.metal, px, 1.75, pz);
    Cy(sr, 0.5, 0.55, 0.1, 12, M.metal, px, 1.0, pz);
  });

  return g;
}

/* ============================================================
   10. TERRACE PROPS
   ============================================================ */
const swayers = [];

function parasol(parent, x, y, z, sc) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(sc || 1);
  parent.add(g);
  Cy(g, 0.09, 0.11, 4.2, 8, M.white, 0, 2.1, 0);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.1, 12, 1, true), M.white);
  canopy.position.y = 4.2;
  canopy.castShadow = true;
  g.add(canopy);
  /* stripes */
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) continue;
    const a = i / 12 * 6.283;
    const seg = new THREE.Mesh(new THREE.ConeGeometry(3.12, 1.12, 12, 1, true, a, 6.283 / 12), M.teal);
    seg.position.y = 4.2;
    seg.material.side = THREE.DoubleSide;
    g.add(seg);
  }
  Sp(g, 0.16, M.woodDark, 0, 4.78, 0);
  swayers.push({ obj: g, amp: 0.028, speed: 1.1 + Math.random() * 0.5, phase: Math.random() * 6.28, axis: 'z', base: 0 });
  return g;
}

function tableSet(parent, x, y, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry || 0;
  parent.add(g);
  Cy(g, 1.25, 1.25, 0.14, 14, M.white, 0, 2.5, 0);
  Cy(g, 0.1, 0.12, 2.4, 8, M.metal, 0, 1.25, 0);
  Cy(g, 0.7, 0.8, 0.12, 12, M.metal, 0, 0.12, 0);
  /* cups */
  Cy(g, 0.16, 0.13, 0.22, 10, M.white, 0.4, 2.68, 0.3);
  Cy(g, 0.16, 0.13, 0.22, 10, M.white, -0.45, 2.68, -0.2);
  Sp(g, 0.2, toon(0xe0a85a), -0.1, 2.7, 0.5, 1.2, 0.7, 1);
  /* chairs */
  [0, 1, 2].forEach(i => {
    const a = i / 3 * 6.283 + 0.4;
    const ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 2.0, 0, Math.sin(a) * 2.0);
    ch.rotation.y = -a + Math.PI / 2;
    g.add(ch);
    X(ch, 1.1, 0.16, 1.1, M.wood, 0, 1.5, 0, 0.05);
    X(ch, 1.1, 1.1, 0.14, M.wood, 0, 2.1, -0.5, 0.05, -0.12);
    [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([dx, dz]) => {
      Cy(ch, 0.06, 0.06, 1.5, 5, M.woodDark, dx, 0.75, dz);
    });
  });
  return g;
}

function buildTerrace() {
  const g = new THREE.Group();
  world.add(g);
  const ty = TOP;

  /* terrace deck */
  const deck = X(g, 40, 0.5, 13, M.stuccoWarm, -1, ty - 0.2, 9.6, 0.14);
  deck.receiveShadow = true;
  /* deck paving lines */
  for (let i = 0; i < 9; i++) {
    X(g, 0.14, 0.06, 13, toon(0xdcc9ab), -20 + i * 4.6, ty + 0.06, 9.6);
  }

  /* white balustrade along the cliff edge */
  const balY = ty + 0.35, balZ = 15.4;
  X(g, 41, 0.4, 0.9, M.white, -1, balY, balZ, 0.1);
  X(g, 41, 0.34, 0.7, M.white, -1, balY + 1.5, balZ, 0.1);
  for (let i = 0; i < 21; i++) {
    const x = -20.5 + i * 2.0;
    Cy(g, 0.24, 0.28, 1.2, 10, M.white, x, balY + 0.85, balZ);
    Sp(g, 0.26, M.white, x, balY + 1.44, balZ, 1, 0.8, 1);
  }
  /* end piers */
  [-21.4, 19.4].forEach(x => {
    X(g, 1.4, 2.4, 1.4, M.white, x, balY + 1.1, balZ, 0.2);
    Sp(g, 0.6, M.white, x, balY + 2.5, balZ);
  });

  /* parasols + tables */
  parasol(g, -11, ty, 8.5, 1.05);
  parasol(g, -2.5, ty, 10.6, 1.0);
  parasol(g, 7.5, ty, 8.2, 0.95);
  tableSet(g, -11, ty, 8.5, 0.4);
  tableSet(g, -2.5, ty, 10.6, 1.2);
  tableSet(g, 7.5, ty, 8.2, 2.2);
  tableSet(g, 14.0, ty, 10.0, 0.8);

  /* potted plants along the balustrade */
  for (let i = 0; i < 6; i++) {
    const x = -18 + i * 7.2;
    Cy(g, 0.62, 0.72, 0.9, 10, M.terra, x, ty + 0.45, 14.2);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.283;
      Sp(g, 0.55, k % 2 ? M.leaf : M.pinkLight, x + Math.cos(a) * 0.55, ty + 1.2 + Math.random() * 0.5, 14.2 + Math.sin(a) * 0.55, 1, 0.9, 1);
    }
  }

  /* ---- red post box ---- */
  const pb = new THREE.Group();
  pb.position.set(-14.5, ty, 4.2);
  pb.rotation.y = 0.4;
  g.add(pb);
  Cy(pb, 0.55, 0.6, 2.4, 12, M.terra, 0, 1.2, 0);
  Cy(pb, 0.62, 0.62, 0.22, 12, toon(0xa8442e), 0, 2.45, 0);
  Sp(pb, 0.6, toon(0xa8442e), 0, 2.45, 0, 1, 0.55, 1);
  X(pb, 0.7, 0.16, 0.12, M.metal, 0, 1.9, 0.55);
  Cy(pb, 0.08, 0.08, 0.5, 6, M.metal, 0, 2.8, 0);

  /* ---- wooden signpost to the sea ---- */
  const sp = new THREE.Group();
  sp.position.set(-19, ty, 12.6);
  g.add(sp);
  Cy(sp, 0.14, 0.18, 3.6, 7, M.woodDark, 0, 1.8, 0);
  [[0, 0.4], [1, -0.5], [2, 0.9]].forEach(([i, ang]) => {
    const b = new THREE.Group();
    b.position.set(0, 3.1 - i * 0.55, 0);
    b.rotation.y = ang;
    sp.add(b);
    X(b, 2.4, 0.42, 0.1, M.wood, 1.2, 0, 0, 0.04);
    /* arrow tip */
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 3), M.wood);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(2.6, 0, 0);
    b.add(tip);
  });

  /* ---- stone steps down the cliff ---- */
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const sx = 12.5 + t * 6.5;
    const sy = ty - 0.4 - t * (ty - 1.2);
    const sz = 12 + t * 4.4;
    X(g, 3.4, 0.55, 1.7, M.stuccoWarm, sx, sy, sz, 0.1);
    if (i % 3 === 0) {
      X(g, 0.16, 1.2, 0.16, M.metal, sx + 1.5, sy + 0.6, sz);
    }
  }
  /* iron rail following the steps */
  const railPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    railPts.push(new THREE.Vector3(12.5 + t * 6.5 + 1.5, ty - 0.4 - t * (ty - 1.2) + 1.15, 12 + t * 4.4));
  }
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 30, 0.07, 5, false), M.metal);
  g.add(rail);

  /* ---- right-hand garden ---- */
  const gd = new THREE.Group();
  g.add(gd);
  /* stone path from the terrace to the garden */
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const px = 16 + t * 20;
    const pz = 11 - t * 8 + Math.sin(t * 5) * 1.2;
    Cy(gd, 1.1 + Math.random() * 0.3, 1.15, 0.16, 8, M.stuccoWarm, px, ty + 0.08, pz);
  }
  /* cypress trees */
  const cyp = [[30, -8], [34, 2], [26, -16], [37, -14], [22, -26], [33, -26], [40, -4]];
  cyp.forEach(([x, z], i) => {
    const cg = new THREE.Group();
    cg.position.set(x, ty, z);
    gd.add(cg);
    Cy(cg, 0.32, 0.5, 2.2, 7, M.woodDark, 0, 1.1, 0);
    const h = 6 + Math.random() * 5;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3 + Math.random() * 0.4, h, 9), i % 2 ? M.leafDeep : M.leaf);
    cone.position.y = 2.0 + h / 2;
    cone.castShadow = true; cone.receiveShadow = true;
    cg.add(cone);
    swayers.push({ obj: cone, amp: 0.02, speed: 0.7 + i * 0.08, phase: i, axis: 'z', base: 0 });
  });
  /* pergola with vines */
  const pg = new THREE.Group();
  pg.position.set(27, ty, 4);
  gd.add(pg);
  [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([x, z]) => {
    Cy(pg, 0.22, 0.26, 5.0, 6, M.woodDark, x, 2.5, z);
  });
  for (let i = 0; i < 7; i++) {
    X(pg, 6.8, 0.16, 0.3, M.wood, 0, 5.0, -3 + i, 0.04);
  }
  X(pg, 0.3, 0.16, 6.8, M.wood, -3, 5.15, 0, 0.04);
  X(pg, 0.3, 0.16, 6.8, M.wood, 3, 5.15, 0, 0.04);
  for (let i = 0; i < 26; i++) {
    Sp(pg, 0.5, i % 3 === 0 ? M.pink : M.leaf,
      (Math.random() - 0.5) * 6.4, 5.1 + Math.random() * 0.5, (Math.random() - 0.5) * 6.4, 1.2, 0.5, 1.2);
  }
  /* bench under the pergola */
  X(pg, 3.0, 0.2, 0.9, M.wood, 0, 1.1, 0, 0.06);
  X(pg, 3.0, 0.8, 0.16, M.wood, 0, 1.55, -0.42, 0.05, -0.12);
  [[-1.2, 0.3], [1.2, 0.3], [-1.2, -0.3], [1.2, -0.3]].forEach(([x, z]) => {
    Cy(pg, 0.07, 0.07, 1.0, 5, M.metal, x, 0.6, z);
  });
  /* flower bushes on the lawn */
  for (let i = 0; i < 14; i++) {
    const fx = 20 + Math.random() * 20;
    const fz = -24 + Math.random() * 34;
    if (fx > 24 && fx < 30 && fz > 1 && fz < 7) continue;
    Sp(gd, 1.0 + Math.random() * 0.6, i % 3 === 0 ? M.pinkLight : M.leaf,
      fx, ty + 0.5, fz, 1.2, 0.8, 1.2);
  }

  return g;
}

/* ============================================================
   11. JETTY + SAILBOAT + VESPA + BOUGAINVILLEA
   ============================================================ */
let boat = null;

function buildJetty() {
  const g = new THREE.Group();
  world.add(g);

  const jx = 15, jz = 20;
  /* posts */
  for (let i = 0; i < 5; i++) {
    for (let k = 0; k < 2; k++) {
      const px = jx - 6 + i * 3.0;
      const pz = jz - 1.8 + k * 5.2;
      Cy(g, 0.28, 0.32, 5.2, 7, M.woodDark, px, 1.6, pz);
      Sp(g, 0.3, M.woodDark, px, 4.2, pz, 1, 0.5, 1);
    }
  }
  /* deck planks */
  for (let i = 0; i < 9; i++) {
    X(g, 1.0, 0.18, 6.0, M.wood, jx - 6 + i * 1.15, 3.3, jz, 0.04);
  }
  X(g, 13, 0.2, 0.3, M.woodDark, jx - 0.4, 3.25, jz - 2.8);
  X(g, 13, 0.2, 0.3, M.woodDark, jx - 0.4, 3.25, jz + 2.8);
  /* ladder */
  [0, 1].forEach(i => {
    Cy(g, 0.1, 0.1, 3.2, 5, M.woodDark, jx + 5.6, 1.9, jz - 1.2 + i * 0.8);
  });
  for (let i = 0; i < 5; i++) {
    X(g, 0.14, 0.1, 0.8, M.woodDark, jx + 5.6, 0.6 + i * 0.62, jz - 0.8);
  }
  /* crates & barrel */
  X(g, 1.2, 1.2, 1.2, M.wood, jx - 4.5, 4.0, jz + 1.4, 0.08, 0, 0.3);
  Cy(g, 0.55, 0.6, 1.4, 10, M.wood, jx - 2.6, 4.1, jz + 1.6);

  /* ---- sailboat ---- */
  boat = new THREE.Group();
  boat.position.set(jx + 12.5, 0, jz - 2);
  boat.rotation.y = -0.5;
  g.add(boat);

  /* hull */
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-4.6, 0);
  hullShape.quadraticCurveTo(-5.0, 1.5, -3.4, 1.9);
  hullShape.lineTo(3.0, 1.9);
  hullShape.quadraticCurveTo(4.9, 1.5, 4.6, 0.1);
  hullShape.quadraticCurveTo(3.4, -0.5, 0, -0.6);
  hullShape.quadraticCurveTo(-3.6, -0.5, -4.6, 0);
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 2.9, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2 });
  const hull = new THREE.Mesh(hullGeo, M.white);
  hull.rotation.y = Math.PI / 2;
  hull.position.set(-1.45, 0.7, 0);
  hull.castShadow = true;
  boat.add(hull);
  /* waterline stripe */
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.3, 9.3), M.teal);
  stripe.position.set(0, 1.05, 0);
  boat.add(stripe);
  /* deck */
  X(boat, 2.8, 0.16, 9.0, M.wood, 0, 2.05, 0, 0.04);
  /* cabin */
  X(boat, 2.2, 1.1, 3.0, M.white, 0, 2.6, -0.6, 0.18);
  X(boat, 2.3, 0.2, 3.1, M.woodDark, 0, 3.2, -0.6, 0.06);
  /* mast */
  Cy(boat, 0.1, 0.13, 9.0, 7, M.woodDark, 0, 6.6, 1.4);
  Cy(boat, 0.07, 0.07, 4.4, 6, M.woodDark, 0, 9.4, 0.6, Math.PI / 2.4, 0, 0);
  /* sails */
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 6.4);
  sailShape.quadraticCurveTo(2.6, 3.0, 3.4, 0.2);
  sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshToonMaterial({
    color: 0xfbedd6, gradientMap: grad, side: THREE.DoubleSide
  }));
  sail.position.set(0, 3.4, 1.5);
  sail.rotation.y = Math.PI / 2;
  boat.add(sail);
  const jib = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshToonMaterial({
    color: 0xf6ead6, gradientMap: grad, side: THREE.DoubleSide
  }));
  jib.scale.setScalar(0.62);
  jib.position.set(0, 5.0, 1.5);
  jib.rotation.y = -Math.PI / 2;
  boat.add(jib);
  /* rigging */
  const rig = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 7.2, 4), M.metal);
  rig.position.set(0, 7.0, -0.4);
  rig.rotation.x = 0.5;
  boat.add(rig);

  return g;
}

function buildVespa() {
  const g = new THREE.Group();
  g.position.set(-17.5, TOP, 3.0);
  g.rotation.y = 1.15;
  world.add(g);
  const body = toon(0x7fb8c8);
  /* wheels */
  [[1.15, 0], [-1.15, 0]].forEach(([x]) => {
    To(g, 0.55, 0.18, M.metal, x, 0.55, 0, 0, Math.PI / 2, 0, 14);
    Cy(g, 0.5, 0.5, 0.2, 12, toon(0x3a3a3a), x, 0.55, 0, Math.PI / 2);
    Cy(g, 0.2, 0.2, 0.24, 10, M.metal, x, 0.55, 0, Math.PI / 2);
  });
  /* rear body */
  Sp(g, 0.85, body, -0.5, 1.1, 0, 1.1, 0.85, 0.62);
  X(g, 1.7, 0.9, 0.9, body, -0.5, 1.25, 0, 0.34);
  /* leg shield */
  const shield = X(g, 0.28, 1.5, 1.1, body, 0.72, 1.3, 0, 0.3);
  shield.rotation.z = -0.12;
  /* seat */
  X(g, 1.1, 0.22, 0.62, toon(0x5a4230), -0.8, 1.72, 0, 0.1);
  /* handlebar */
  Cy(g, 0.06, 0.06, 1.0, 6, M.metal, 0.72, 1.95, 0);
  X(g, 0.5, 0.06, 0.1, M.metal, 0.72, 2.32, 0);
  Cy(g, 0.1, 0.1, 0.18, 8, M.brass, 0.95, 2.2, 0, 0, 0, Math.PI / 2);
  /* mudguard */
  const mg = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.11, 5, 12, Math.PI), body);
  mg.position.set(1.15, 0.62, 0);
  mg.rotation.y = Math.PI / 2;
  mg.rotation.z = Math.PI;
  g.add(mg);
  /* kickstand */
  Cy(g, 0.04, 0.04, 0.7, 4, M.metal, -0.6, 0.35, 0.32, 0.3, 0, 0.3);
  /* basket */
  X(g, 0.6, 0.42, 0.5, M.wood, 0.95, 1.95, 0, 0.08);
  return g;
}

function buildBougainvillea() {
  const g = new THREE.Group();
  world.add(g);
  const spots = [
    [-9.9, TOP + 7.2, -2.5, 0.2], [9.9, TOP + 6.0, -3.2, Math.PI],
    [-9.9, TOP + 3.2, -14.5, 0.4], [21.0, TOP + 5.0, -8, Math.PI * 0.9]
  ];
  spots.forEach(([x, y, z, ry], si) => {
    const cl = new THREE.Group();
    cl.position.set(x, y, z);
    cl.rotation.y = ry;
    g.add(cl);
    /* vine stems */
    for (let i = 0; i < 5; i++) {
      const pts = [];
      for (let k = 0; k <= 5; k++) {
        const t = k / 5;
        pts.push(new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          -t * (3.0 + Math.random() * 2.5),
          (Math.random() - 0.5) * 0.7
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.06, 4, false), M.leafDeep);
      cl.add(stem);
    }
    /* flower clusters */
    for (let i = 0; i < 34; i++) {
      const px = (Math.random() - 0.5) * 3.0;
      const py = -Math.random() * 3.6;
      const pz = (Math.random() - 0.5) * 1.0;
      Sp(cl, 0.28 + Math.random() * 0.2, i % 3 === 0 ? M.pink : M.pinkLight, px, py, pz, 1, 0.85, 1);
    }
    /* leaves */
    for (let i = 0; i < 16; i++) {
      Sp(cl, 0.26, M.leaf, (Math.random() - 0.5) * 3.0, -Math.random() * 3.4, (Math.random() - 0.5) * 1.0, 1.3, 0.4, 1);
    }
    swayers.push({ obj: cl, amp: 0.05, speed: 0.9 + si * 0.15, phase: Math.random() * 6.28, axis: 'z', base: 0 });
  });

  /* climbing vine on the lighthouse */
  const vinePts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = t * 5.2;
    vinePts.push(new THREE.Vector3(-25 + Math.sin(a) * 5.1, TOP + 3.2 + t * 12, -14 + Math.cos(a) * 5.1));
  }
  const vine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vinePts), 48, 0.09, 5, false), M.leafDeep);
  g.add(vine);
  for (let i = 0; i < 22; i++) {
    const t = i / 22;
    const a = t * 5.2;
    Sp(g, 0.3, i % 3 === 0 ? M.pink : M.leaf,
      -25 + Math.sin(a) * 5.25, TOP + 3.2 + t * 12, -14 + Math.cos(a) * 5.25, 1, 0.8, 1);
  }

  return g;
}

/* ============================================================
   12. COFFEE STEAM + FAN + ANIMATION REFS
   ============================================================ */
function buildSteam() {
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.SpriteMaterial({
      map: softTex, color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.NormalBlending
    });
    const sp = new THREE.Sprite(mat);
    scene.add(sp);
    steamSprites.push({
      sp, life: Math.random() * 2.0, max: 1.8 + Math.random() * 1.2,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.7 + Math.random() * 0.4, (Math.random() - 0.5) * 0.25),
      size: 0.35 + Math.random() * 0.3
    });
  }
}

/* ============================================================
   13. BUILD
   ============================================================ */
buildBase();
buildLighthouse();
buildCafe();
buildTerrace();
buildJetty();
buildVespa();
buildBougainvillea();
buildSteam();

/* ============================================================
   14. POST — watercolour paper grade
   ============================================================ */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    uPaper: { value: paperTex },
    uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform sampler2D uPaper;
    uniform float time; uniform vec2 uRes;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      /* faint paper wobble so lines look hand drawn */
      vec2 puv = uv * uRes / 420.0;
      float wob = (texture2D(uPaper, puv * 0.35).r - 0.5) * 0.0018;
      uv += wob;

      vec3 col = texture2D(tDiffuse, uv).rgb;

      /* soft watercolour lift: raise shadows, keep highlights airy */
      col = col * 1.02 + 0.006;
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, 1.20);
      col = pow(max(col, 0.0), vec3(1.0));

      /* paper grain */
      float grain = texture2D(uPaper, uv * uRes / 512.0).r;
      col *= 0.90 + grain * 0.19;

      /* soft bloom-ish veil in the highlights */
      col = mix(col, vec3(1.0, 0.98, 0.94), smoothstep(0.93, 1.1, lum) * 0.10);

      /* vignette */
      float vig = smoothstep(1.32, 0.28, length((vUv - 0.5) * vec2(1.06, 1.0)));
      col *= mix(0.90, 1.0, vig);

      gl_FragColor = vec4(col, 1.0);
    }`
};

let composer = null, gradePass = null;
const NO_POST = _p.has('nopost');
try {
  if (NO_POST) throw new Error('off');
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.30, 0.55, 0.92));
  gradePass = new ShaderPass(GradeShader);
  composer.addPass(gradePass);
  composer.addPass(new OutputPass());
} catch (e) {
  composer = null;
  console.warn('post-processing unavailable', e);
}

/* ============================================================
   15. LOOP
   ============================================================ */
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  for (const p of pulses) {
    const k = 1 + Math.sin(elapsed * p.speed + p.phase) * p.amp;
    p.mat.color.setRGB(p.base.r * k, p.base.g * k, p.base.b * k);
  }

  /* sea + foam */
  if (seaTop) seaTop.material.uniforms.uTime.value = elapsed;
  for (const f of foamRings) {
    f.t += dt * 0.42;
    if (f.t > 1) {
      f.t -= 1;
      f.mesh.position.x = -34 + Math.random() * 66;
      f.mesh.position.z = 4.5 + Math.random() * 5;
    }
    const s = 0.5 + f.t * 2.6;
    f.mesh.scale.set(s, s, s);
    f.mesh.material.opacity = (1 - f.t) * 0.55 * Math.sin(f.t * Math.PI);
  }

  /* lighthouse beam */
  if (beamGroup) {
    beamGroup.rotation.y += dt * 0.55;
  }

  /* ceiling fan */
  if (fanBlades) fanBlades.rotation.y += dt * 1.9;

  /* terrace sway */
  for (const s of swayers) {
    s.obj.rotation[s.axis] = s.base + Math.sin(elapsed * s.speed + s.phase) * s.amp;
  }

  /* boat bobbing */
  if (boat) {
    boat.position.y = Math.sin(elapsed * 0.9) * 0.22 + Math.sin(elapsed * 1.7) * 0.08;
    boat.rotation.z = Math.sin(elapsed * 0.75) * 0.035;
    boat.rotation.x = Math.cos(elapsed * 0.6) * 0.02;
  }

  /* steam */
  for (const p of steamSprites) {
    p.life += dt;
    if (p.life > p.max) {
      p.life = 0;
      p.max = 1.6 + Math.random() * 1.2;
      p.sp.position.set(-1 + 3.0 + (Math.random() - 0.5) * 0.6, TOP + 3.3, -10 + (Math.random() - 0.5) * 0.6);
      p.vel.set((Math.random() - 0.5) * 0.25, 0.65 + Math.random() * 0.35, (Math.random() - 0.5) * 0.25);
      p.size = 0.3 + Math.random() * 0.25;
    }
    const t = p.life / p.max;
    p.sp.position.addScaledVector(p.vel, dt);
    p.sp.position.x += Math.sin(p.life * 1.6 + p.size * 9) * dt * 0.35;
    p.sp.scale.setScalar(p.size + t * 1.5);
    p.sp.material.opacity = Math.pow(1 - t, 1.5) * 0.42;
  }

  if (gradePass) gradePass.uniforms.time.value = elapsed;

  controls.update();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

/* ============================================================
   16. RESIZE
   ============================================================ */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  const a = w / h;
  camera.aspect = a;
  camera.fov = a < 1.45 ? THREE.MathUtils.clamp(33 / a * 1.06, 33, 60) : 33;
  camera.setViewOffset(w, h, 0, Math.round(h * 0.035), w, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (composer) composer.setSize(w, h);
  if (gradePass) gradePass.uniforms.uRes.value.set(w, h);
}
window.addEventListener('resize', onResize);
onResize();
