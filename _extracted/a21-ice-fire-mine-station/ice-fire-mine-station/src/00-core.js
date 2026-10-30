import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ============================================================
   00 · CORE — 渲染器 / 相机 / 灯光 / 材质 / 通用构件
   ============================================================ */

/* ---------- 确定性随机 ---------- */
let _seed = 20261030;
function srnd() { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; }
const rnd = (a, b) => a + srnd() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(srnd() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- 渲染器 ---------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const BASE_DPR = Math.min(window.devicePixelRatio || 1, 1.6);
let curDPR = BASE_DPR;
renderer.setPixelRatio(curDPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1424, 0.021);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-8.3, 9.5, 13.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.15, 0.92, 0.3);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.6;
controls.minDistance = 7.5;
controls.maxDistance = 30;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = Math.PI * 0.495;
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.22;
let userTouched = false;
const stopAuto = () => { if (!userTouched) { userTouched = true; controls.autoRotate = false; } };
renderer.domElement.addEventListener('pointerdown', stopAuto, { once: true });
/* 调试相机参数 */
{
  const q = new URLSearchParams(location.search);
  if (q.get('cam')) { const v = q.get('cam').split(',').map(Number); camera.position.set(v[0], v[1], v[2]); }
  if (q.get('tgt')) { const v = q.get('tgt').split(',').map(Number); controls.target.set(v[0], v[1], v[2]); }
  if (q.get('cam') || q.get('tgt')) { controls.autoRotate = false; userTouched = true; }
}
renderer.domElement.addEventListener('wheel', stopAuto, { once: true, passive: true });
renderer.domElement.addEventListener('touchstart', stopAuto, { once: true, passive: true });

/* 限制平移范围，别把模型推出画面 */
const _tgt = new THREE.Vector3();
controls.addEventListener('change', () => {
  _tgt.copy(controls.target);
  _tgt.x = THREE.MathUtils.clamp(_tgt.x, -2.6, 2.6);
  _tgt.y = THREE.MathUtils.clamp(_tgt.y, -0.2, 3.4);
  _tgt.z = THREE.MathUtils.clamp(_tgt.z, -2.6, 2.6);
  controls.target.copy(_tgt);
});

/* ---------- 背景穹顶（夜色渐变） ---------- */
{
  const geo = new THREE.SphereGeometry(60, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      cTop: { value: new THREE.Color(0x0b1730) },
      cMid: { value: new THREE.Color(0x142a44) },
      cBot: { value: new THREE.Color(0x05070d) },
      cWarm: { value: new THREE.Color(0x3a1c18) }
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 cTop,cMid,cBot,cWarm;
      void main(){
        float h = clamp(normalize(vP).y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(cBot, cMid, smoothstep(0.30, 0.62, h));
        c = mix(c, cTop, smoothstep(0.58, 1.0, h));
        float warm = smoothstep(0.42, 0.0, abs(h - 0.46)) * smoothstep(0.55, 1.0, normalize(vP).x * -0.5 + 0.5);
        c += cWarm * warm * 0.55;
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  scene.add(sky);
}

/* ---------- 灯光 ---------- */
const hemi = new THREE.HemisphereLight(0xa6c6f2, 0x6a4228, 1.2);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffe6c8, 3.3);
keyLight.position.set(8.5, 13, 7.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -9; keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9; keyLight.shadow.camera.bottom = -9;
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 42;
keyLight.shadow.bias = -0.0009;
keyLight.shadow.normalBias = 0.022;
keyLight.shadow.radius = 2.2;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x74b4ff, 1.75);
rimLight.position.set(-9, 6.5, -8);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xff9a5c, 1.15);
fillLight.position.set(-4, 2, 9);
scene.add(fillLight);

const amb = new THREE.AmbientLight(0x475a78, 0.75);
scene.add(amb);

/* ---------- 色板 ---------- */
const PAL = {
  woodDark: 0x4d3122, wood: 0x6b452d, woodLite: 0x8a5c3b, woodWarm: 0xa8724a,
  iron: 0x2b2f38, ironLite: 0x474e5b, ironRust: 0x5c3a2c, brass: 0xc08a45, copper: 0x8f5a34,
  stone: 0x565f6b, stoneDark: 0x3a4149, stoneLite: 0x717c88,
  snow: 0xe8f3ff, snowShade: 0xc2d8ee, ash: 0x24242a,
  ice: 0x8ee2ff, iceDeep: 0x2f7ba8, iceDark: 0x1d4a6b,
  lava: 0xff5a1c, lavaHot: 0xffc25a, lavaDark: 0x8a1f0c,
  crys: 0xa96bff, gold: 0xffd070, teal: 0x3fd8c8,
  warm: 0xffb266, warmHot: 0xffd9a0,
  leaf: 0x2f5b46
};

/* ---------- 材质工厂 ---------- */
function makeGradient(steps) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round(lerp(88, 255, i / (steps - 1)));
  const t = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}
const GRAD = makeGradient(4);

const _matCache = new Map();
function tm(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (!_matCache.has(key)) {
    _matCache.set(key, new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD }, opts)));
  }
  return _matCache.get(key);
}
function em(color, intensity = 1.8, base = 0x0a0a12) {
  return tm(base, { emissive: color, emissiveIntensity: intensity });
}

/* 发光贴图（径向渐变） */
function radialTex(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)', size = 128) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.42, mid);
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const TEX_GLOW = radialTex();
const TEX_SOFT = radialTex('rgba(255,255,255,0.85)', 'rgba(255,255,255,0.22)', 128);

function glowSprite(color, size, opacity, x, y, z, parent) {
  const m = new THREE.SpriteMaterial({
    map: TEX_SOFT, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  s.position.set(x, y, z);
  (parent || world).add(s);
  return s;
}

/* ---------- 场景根 ---------- */
const world = new THREE.Group();
scene.add(world);

/* ---------- 构件助手（y 为底面高度） ---------- */
const G = (parent) => { const g = new THREE.Group(); (parent || world).add(g); return g; };

function B(w, h, d, mat, x, yb, z, parent, outline = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, yb + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.outline = outline;
  (parent || world).add(m);
  return m;
}
function C(rt, rb, h, seg, mat, x, yb, z, parent, outline = true) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, yb + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.outline = outline;
  (parent || world).add(m);
  return m;
}
function S(r, seg, mat, x, y, z, parent, outline = false) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1)), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.outline = outline;
  (parent || world).add(m);
  return m;
}
function Plane(w, h, mat, x, y, z, parent, outline = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.userData.outline = outline;
  (parent || world).add(m);
  return m;
}
/* 两点之间的圆柱（线缆 / 管道 / 扶手） */
function beam(a, b, r, mat, parent, seg = 6) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(Bv, A);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg, 1, false), mat);
  m.position.copy(A).add(Bv).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  m.userData.outline = false;
  (parent || world).add(m);
  return m;
}
/* 低模岩石 */
const _rockGeoCache = [];
function rockGeo(radius = 1, detail = 0, jitter = 0.26, seed = 0) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const s = seed * 7.13 + 1.7;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 3.1 + s) * Math.cos(v.y * 2.7 + s * 1.7) * Math.sin(v.z * 3.5 + s * 2.3);
    v.multiplyScalar(1 + n * jitter);
    v.y *= 0.78;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
function rock(r, mat, x, y, z, parent, jitter = 0.28, seed = rnd(0, 99), detail = 0) {
  const m = new THREE.Mesh(rockGeo(r, detail, jitter, seed), mat);
  m.position.set(x, y, z);
  m.rotation.set(rnd(-0.3, 0.3), rnd(0, 6.28), rnd(-0.3, 0.3));
  m.castShadow = true; m.receiveShadow = true;
  m.userData.outline = true;
  (parent || world).add(m);
  return m;
}
/* 尖晶 / 晶体 */
function crystalGeo(r, h, sides = 6) {
  const g = new THREE.ConeGeometry(r, h, sides, 1);
  // 削成双锥：上半保留，底部收一点
  return g;
}
function crystal(r, h, mat, x, y, z, parent, tilt = 0) {
  const m = new THREE.Mesh(crystalGeo(r, h, 6), mat);
  m.position.set(x, y + h / 2, z);
  m.rotation.set(rnd(-0.12, 0.12) + tilt, rnd(0, 6.28), rnd(-0.12, 0.12));
  m.castShadow = true;
  m.userData.outline = true;
  (parent || world).add(m);
  return m;
}

/* ---------- 画布文字贴图 ---------- */
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function signMat(tex, emissive = 0x000000, ei = 0) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: true, side: THREE.DoubleSide });
}

/* ---------- 轮廓线收集 ---------- */
const OUTLINE_T = 0.021;
function buildOutlines() {
  const geos = [];
  world.updateMatrixWorld(true);
  world.traverse((o) => {
    if (o.isMesh && o.userData.outline && o.geometry) {
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) {
        if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      if (g.attributes.position.count < 3000) geos.push(g);
    }
  });
  const merged = mergeGeometries(geos, false);
  if (!merged) return;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x0a0c14) }, uT: { value: OUTLINE_T } },
    vertexShader: `
      uniform float uT;
      void main(){
        vec3 p = position + normalize(normal) * uT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }`,
    side: THREE.BackSide
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  scene.add(mesh);
}
/* 动态物体的子级轮廓 */
const outlineMatChild = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(0x0a0c14) }, uT: { value: 0.02 } },
  vertexShader: `
    uniform float uT;
    void main(){
      vec3 p = position + normalize(normal) * uT;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }`,
  side: THREE.BackSide
});
function childOutline(mesh, t = 0.02) {
  const m = new THREE.Mesh(mesh.geometry, outlineMatChild.clone());
  m.material.uniforms.uT.value = t;
  m.scale.setScalar(1.0);
  mesh.add(m);
  return m;
}

/* ---------- 后期 ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.6, window.innerHeight * 0.6), 0.32, 0.52, 1.02);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth * 0.6, window.innerHeight * 0.6);
}
window.addEventListener('resize', onResize);

/* ---------- 自适应画质 ---------- */
let _ft = 0, _fn = 0, _adapt = 0;
function adaptQuality(dt) {
  if (_adapt > 2) return;
  _ft += dt; _fn++;
  if (_fn < 90) return;
  const avg = _ft / _fn;
  _ft = 0; _fn = 0;
  if (avg > 0.034 && curDPR > 0.85) {
    curDPR = Math.max(0.85, curDPR - 0.3);
    renderer.setPixelRatio(curDPR);
    composer.setSize(window.innerWidth, window.innerHeight);
    _adapt++;
  } else {
    _adapt = 3;
  }
}

/* ---------- 时间与动画注册 ---------- */
const clock = new THREE.Clock();
const updaters = [];
const onFrame = (fn) => updaters.push(fn);
