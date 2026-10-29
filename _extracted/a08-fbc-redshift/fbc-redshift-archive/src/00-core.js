import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════
//  FBC / RED SHIFT ARCHIVE
//  A levitating brutalist archive diorama, generated entirely in code.
//  00 — renderer, procedural surfaces, materials, light, helpers.
// ═══════════════════════════════════════════════════════════════════════

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const stage = document.getElementById('stage');

// ── deterministic dice ─────────────────────────────────────────────────
function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(19730413);
const rr = (a, b, r = rnd) => a + (b - a) * r();
const ri = (a, b, r = rnd) => Math.floor(rr(a, b + 1, r));
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const randOf = (a, r = rnd) => a[Math.floor(r() * a.length)];
const randSign = (r = rnd) => (r() < .5 ? -1 : 1);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));

// ── renderer / camera ──────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas: stage,
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
  stencil: false,
});
const IS_COARSE = window.matchMedia('(pointer: coarse)').matches;
const DPR = IS_COARSE
  ? Math.min(1.4, Math.max(1.1, window.devicePixelRatio || 1))
  : Math.min(1.55, Math.max(1.24, (window.devicePixelRatio || 1) * 1.05));
const START_ASPECT = innerWidth / innerHeight;
const MOBILE_FRAME = START_ASPECT < .88;
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x060606, 1);
renderer.debug.checkShaderErrors = true;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x090607, 0.0118);

const camera = new THREE.PerspectiveCamera(MOBILE_FRAME ? 45 : 36, innerWidth / innerHeight, 0.12, 240);
const CAM_TARGET = new THREE.Vector3(-0.15, MOBILE_FRAME ? 8.2 : 7.55, 0.15);
const HOME = MOBILE_FRAME
  ? { theta: 0.57, phi: 1.235, radius: 80 }
  : { theta: 0.63, phi: 1.265, radius: 61 };
const view = { theta: HOME.theta, phi: HOME.phi, radius: HOME.radius };
const goal = { theta: HOME.theta, phi: HOME.phi, radius: HOME.radius };
const pan = new THREE.Vector2();

function placeCamera() {
  const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
  camera.position.set(
    CAM_TARGET.x + view.radius * sp * Math.sin(view.theta),
    CAM_TARGET.y + view.radius * cp,
    CAM_TARGET.z + view.radius * sp * Math.cos(view.theta)
  );
  camera.lookAt(CAM_TARGET);
}
placeCamera();

const world = new THREE.Group();
scene.add(world);

// ── procedural canvas helpers ──────────────────────────────────────────
function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function canvasTexture(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

// periodic value noise, used for seamless concrete
function noiseGrid(n, seed) {
  const r = rng(seed);
  const g = new Float32Array(n * n);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return g;
}
function sampleGrid(g, n, x, y) {
  x = ((x % 1) + 1) % 1 * n;
  y = ((y % 1) + 1) % 1 * n;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = g[y0 * n + x0], b = g[y0 * n + x1];
  const c = g[y1 * n + x0], d = g[y1 * n + x1];
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
}
function fbm(gs, x, y) {
  let v = 0, amp = .54, tot = 0;
  for (let i = 0; i < gs.length; i++) {
    const n = gs[i].n;
    v += sampleGrid(gs[i].g, n, x * n, y * n) * amp;
    tot += amp; amp *= .5;
  }
  return v / tot;
}

function makeConcrete() {
  const N = 512;
  const [bc, bctx] = canvas2d(N, N);
  const [rc, rctx] = canvas2d(N, N);
  const grids = [
    { n: 4, g: noiseGrid(4, 21) }, { n: 9, g: noiseGrid(9, 22) },
    { n: 23, g: noiseGrid(23, 23) }, { n: 61, g: noiseGrid(61, 24) },
  ];
  const bi = bctx.createImageData(N, N);
  const rii = rctx.createImageData(N, N);
  const rp = rng(444);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    let n = fbm(grids, u, v);
    const cloud = fbm([{ n: 5, g: noiseGrid(5, 31) }, { n: 16, g: noiseGrid(16, 32) }], u, v);
    n = .5 + (n - .5) * .9;
    let c = 150 + (n - .5) * 36;
    c += (cloud - .5) * 18;
    // faint cold mineral mottling
    c += Math.sin((u * 5.3 + v * 1.7) * Math.PI) * 1.6;
    if (rp() > .936) c -= 22 + rp() * 34;
    if (rp() > .996) c += 18;
    const i = (y * N + x) * 4;
    const r = clamp(c + 6, 0, 255) | 0, g = clamp(c + 3, 0, 255) | 0, b = clamp(c, 0, 255) | 0;
    bi.data[i] = r; bi.data[i + 1] = g; bi.data[i + 2] = b; bi.data[i + 3] = 255;
    const rv = 215 + (n - .5) * 55 + (rp() - .5) * 10;
    rii.data[i] = rii.data[i + 1] = rii.data[i + 2] = clamp(rv, 0, 255) | 0;
    rii.data[i + 3] = 255;
  }
  bctx.putImageData(bi, 0, 0);
  rctx.putImageData(rii, 0, 0);
  // hairline pour seams and tiny form-tie ghosts — barely there
  bctx.globalAlpha = .055;
  for (let i = 0; i < 7; i++) {
    bctx.strokeStyle = rp() > .5 ? '#f2f2ec' : '#6d6f6a';
    bctx.lineWidth = .7;
    bctx.beginPath();
    const x = rr(0, N, rp);
    bctx.moveTo(x, 0); bctx.bezierCurveTo(x + rr(-20, 20, rp), N * .3, x + rr(-15, 15, rp), N * .7, x + rr(-25, 25, rp), N);
    bctx.stroke();
  }
  bctx.globalAlpha = 1;
  const map = canvasTexture(bc);
  const bump = canvasTexture(bc, false);
  const rough = canvasTexture(rc, false);
  map.repeat.set(2.1, 2.1); bump.repeat.copy(map.repeat); rough.repeat.copy(map.repeat);
  return { map, bump, rough };
}
const CONCRETE = makeConcrete();

function makeWood() {
  const N = 512;
  const [c, x] = canvas2d(N, N);
  const r = rng(51);
  x.fillStyle = '#71553e'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 360; i++) {
    const y = r() * N;
    x.strokeStyle = `rgba(${40 + r() * 40},${23 + r() * 25},${15 + r() * 18},${.04 + r() * .12})`;
    x.lineWidth = .4 + r() * 3.2;
    x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= N; px += 32) x.lineTo(px, y + Math.sin(px * .018 + i) * 2.8 + (r() - .5) * 3);
    x.stroke();
  }
  x.globalAlpha = .18;
  for (let i = 0; i < 25; i++) {
    x.fillStyle = '#26170f';
    x.beginPath();
    x.ellipse(r() * N, r() * N, 1.5 + r() * 5, .5 + r() * 1.4, r() * .5, 0, TAU);
    x.fill();
  }
  x.globalAlpha = 1;
  const t = canvasTexture(c);
  t.repeat.set(1.6, 1.3);
  return t;
}
const WOOD_TEX = makeWood();

function makePaperTex() {
  const N = 256;
  const [c, x] = canvas2d(N, N);
  x.fillStyle = '#d8d0bb'; x.fillRect(0, 0, N, N);
  const r = rng(88);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = r() > .5 ? 'rgba(71,62,50,.08)' : 'rgba(255,249,228,.1)';
    x.fillRect(r() * N, r() * N, .6 + r() * 1.8, .5 + r() * 1.2);
  }
  x.strokeStyle = 'rgba(42,38,30,.25)'; x.lineWidth = .65;
  for (let i = 0; i < 9; i++) {
    x.beginPath();
    const y = 18 + i * 12;
    x.moveTo(18, y); x.lineTo(N - 22 - r() * 50, y);
    x.stroke();
  }
  x.fillStyle = 'rgba(130,20,16,.42)';
  x.font = 'bold 12px monospace';
  x.fillText('FBC / ARCHIVE', 18, 230);
  const t = canvasTexture(c);
  return t;
}
const PAPER_TEX = makePaperTex();

function makeGlowTexture() {
  const N = 128;
  const [c, x] = canvas2d(N, N);
  const g = x.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.14, 'rgba(255,255,255,.9)');
  g.addColorStop(.42, 'rgba(255,255,255,.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, N, N);
  return canvasTexture(c, false);
}
const GLOW_TEX = makeGlowTexture();

// ── environment reflections: a dim red studio ─────────────────────────
(function makeEnvironment() {
  const [c, x] = canvas2d(512, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#14181b');
  g.addColorStop(.42, '#242729');
  g.addColorStop(.55, '#3b1717');
  g.addColorStop(.68, '#130c0c');
  g.addColorStop(1, '#050606');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  const glow = x.createRadialGradient(382, 125, 2, 382, 125, 80);
  glow.addColorStop(0, 'rgba(255,88,48,.75)');
  glow.addColorStop(.4, 'rgba(159,39,24,.20)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = glow; x.fillRect(300, 60, 170, 140);
  const cool = x.createRadialGradient(90, 70, 2, 90, 70, 90);
  cool.addColorStop(0, 'rgba(118,147,160,.34)');
  cool.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = cool; x.fillRect(0, 0, 200, 170);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(t).texture;
  scene.environmentIntensity = .62;
  t.dispose(); pmrem.dispose();
})();

// ── materials ─────────────────────────────────────────────────────────
const concreteMap = CONCRETE.map;
const concreteBump = CONCRETE.bump;
const concreteRough = CONCRETE.rough;

function concrete(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, map: concreteMap, bumpMap: concreteBump, bumpScale: opts.bump ?? .04,
    roughnessMap: concreteRough, roughness: opts.rough ?? .88,
    metalness: opts.metal ?? .035, envMapIntensity: .35,
  });
}

const M = {
  concrete: concrete(0xacb4b4),
  concreteCool: concrete(0x99a4a5, { rough: .92 }),
  concreteDark: concrete(0x646b6c, { rough: .9 }),
  concreteDeep: concrete(0x444a4b, { rough: .94 }),
  concreteBlack: concrete(0x242728, { rough: .82, metal: .08 }),
  base: concrete(0xa7b0b0, { rough: .8, metal: .06 }),
  floor: new THREE.MeshStandardMaterial({
    color: 0xaeb5b4, map: concreteMap, bumpMap: concreteBump, bumpScale: .016,
    roughnessMap: concreteRough, roughness: .64, metalness: .14, envMapIntensity: .55,
  }),
  voidBlack: new THREE.MeshStandardMaterial({ color: 0x020203, roughness: .34, metalness: .58, envMapIntensity: .15 }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x070708, roughness: .49, metalness: .32, flatShading: true,
    bumpMap: concreteBump, bumpScale: .08, envMapIntensity: .7,
  }),
  steel: new THREE.MeshStandardMaterial({ color: 0x262a2b, roughness: .5, metalness: .68, envMapIntensity: .6 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x101313, roughness: .42, metalness: .76, envMapIntensity: .48 }),
  steelRust: new THREE.MeshStandardMaterial({ color: 0x4a2e21, roughness: .87, metalness: .36 }),
  paintedGreen: new THREE.MeshStandardMaterial({ color: 0x3d4a42, roughness: .76, metalness: .18 }),
  paintedOchre: new THREE.MeshStandardMaterial({ color: 0x77644a, roughness: .8, metalness: .08 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xb08a64, map: WOOD_TEX, roughness: .72, metalness: .02 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x6c4f3c, map: WOOD_TEX, roughness: .8, metalness: .02 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xd2c9b0, map: PAPER_TEX, roughness: .92, metalness: 0, side: THREE.DoubleSide }),
  paperPlain: new THREE.MeshStandardMaterial({ color: 0xcfc8b3, roughness: .94, metalness: 0, side: THREE.DoubleSide }),
  paperAged: new THREE.MeshStandardMaterial({ color: 0xaa9e7f, roughness: .95, metalness: 0, side: THREE.DoubleSide }),
  folder: new THREE.MeshStandardMaterial({ color: 0x726b55, roughness: .9 }),
  black: new THREE.MeshStandardMaterial({ color: 0x090a0a, roughness: .8 }),
  blackPlastic: new THREE.MeshStandardMaterial({ color: 0x121414, roughness: .38, metalness: .08 }),
  beige: new THREE.MeshStandardMaterial({ color: 0x8b8271, roughness: .66, metalness: .05 }),
  crtBody: new THREE.MeshStandardMaterial({ color: 0x4d4a42, roughness: .63, metalness: .12 }),
  crtBodyDark: new THREE.MeshStandardMaterial({ color: 0x242523, roughness: .54, metalness: .2 }),
  crtScreen: new THREE.MeshBasicMaterial({ color: 0x0a120d }),
  glass: new THREE.MeshStandardMaterial({ color: 0x0d1415, transparent: true, opacity: .6, roughness: .12, metalness: .65, envMapIntensity: 1.1 }),
  redMetal: new THREE.MeshStandardMaterial({ color: 0x5c1111, roughness: .55, metalness: .3, emissive: 0x280000, emissiveIntensity: .4 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x7e6a45, roughness: .42, metalness: .8 }),
  lampGreen: new THREE.MeshStandardMaterial({ color: 0x24392c, roughness: .3, metalness: .4, emissive: 0x1a402b, emissiveIntensity: .7 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0x2b0808, emissive: 0xff2a22, emissiveIntensity: 4.2, roughness: .25 }),
  bulbAmber: new THREE.MeshStandardMaterial({ color: 0x24140a, emissive: 0xff8a3b, emissiveIntensity: 1.5, roughness: .3 }),
  stripRed: new THREE.MeshBasicMaterial({ color: 0xff241e }),
  stripWhite: new THREE.MeshBasicMaterial({ color: 0xb8d2d7 }),
  stripGreen: new THREE.MeshBasicMaterial({ color: 0x5aff9c }),
};

// materials that breathe with the emergency circuit
const pulseMats = [];
const redGlowMats = [];
const greenGlowMats = [];

// ── sharp little geometry kit ──────────────────────────────────────────
const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const planeGeo = (w, h, a = 1, b = 1) => new THREE.PlaneGeometry(w, h, a, b);
const cylGeo = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sphGeo = (r = 1, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const inkMat = new THREE.LineBasicMaterial({ color: 0x050606, transparent: true, opacity: .72 });
const inkSoft = new THREE.LineBasicMaterial({ color: 0x080909, transparent: true, opacity: .46 });
const inkRed = new THREE.LineBasicMaterial({ color: 0x8d1a17, transparent: true, opacity: .65 });
const edgeCache = new Map();
function edgesFor(geo, angle = 32) {
  const key = geo.uuid + ':' + angle;
  if (!edgeCache.has(key)) edgeCache.set(key, new THREE.EdgesGeometry(geo, angle));
  return edgeCache.get(key);
}
function outline(mesh, angle = 32, mat = inkMat) {
  const l = new THREE.LineSegments(edgesFor(mesh.geometry, angle), mat);
  l.scale.setScalar(1.0025);
  l.renderOrder = 4;
  mesh.add(l);
  return l;
}
function put(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}
function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, ry = 0, ink = false, sx = 0, sy = 0, sz = 0) {
  const m = put(parent, boxGeo(w, h, d), mat, x, y, z, sx, ry, sz);
  if (ink) outline(m, 26);
  return m;
}
function groupAt(parent, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = ry;
  parent.add(g); return g;
}
function cylinderBetween(a, b, radius, mat, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const m = new THREE.Mesh(cylGeo(radius, radius, len, seg), mat);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize());
  return m;
}
function tube(parent, points, radius, mat, seg = 24, radial = 5) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : v3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, radial, false), mat);
  parent.add(m); return m;
}
function railing(parent, length, x, y, z, horizontal = true, height = .95) {
  // one merged-ish group: top rail, bottom rail, sparse uprights
  const g = groupAt(parent, x, y, z, horizontal ? 0 : Math.PI / 2);
  const n = Math.max(3, Math.round(length / .55));
  box(g, length, .055, .055, M.steelDark, 0, height, 0);
  box(g, length, .035, .035, M.steelDark, 0, .1, 0);
  for (let i = 0; i < n; i++) {
    const px = -length / 2 + (i + .5) * (length / n);
    box(g, .045, height, .045, M.steelDark, px, height / 2, 0);
  }
  return g;
}
function crackLine(parent, points, radius = .025, mat = M.stripRed) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : v3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 4, false), mat);
}

// ── light ──────────────────────────────────────────────────────────────
const hemi = new THREE.HemisphereLight(0x96b1bc, 0x1b0b09, .84);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xc9dbe3, 3.12);
key.position.set(-14, 27, 17);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -20; key.shadow.camera.right = 20;
key.shadow.camera.top = 26; key.shadow.camera.bottom = -10;
key.shadow.camera.near = .5; key.shadow.camera.far = 70;
key.shadow.bias = -.00035;
key.shadow.normalBias = .035;
key.shadow.radius = 2.4;
scene.add(key);

const rimRed = new THREE.DirectionalLight(0xff2218, 1.78);
rimRed.position.set(17, 8, -15);
scene.add(rimRed);

const sideRed = new THREE.DirectionalLight(0xff3826, .86);
sideRed.position.set(-16, 5, 4);
scene.add(sideRed);

const coolFill = new THREE.DirectionalLight(0x5f8194, 1.55);
coolFill.position.set(12, 14, 20);
scene.add(coolFill);

const frontFill = new THREE.DirectionalLight(0x89a3b0, 1.1);
frontFill.position.set(-8, 8, 28);
scene.add(frontFill);

// unseen skylight wash: a cold current running against the red emergency flood
const skyFill = new THREE.SpotLight(0xa8c9d8, 670, 44, .8, .94, 1.35);
skyFill.position.set(2.5, 28, 2);
skyFill.target.position.set(0, 3.0, 0);
scene.add(skyFill);
scene.add(skyFill.target);

// very low bounce, so the broken plates reveal their undersides
const underFill = new THREE.DirectionalLight(0x6f91a4, .8);
underFill.position.set(4, -14, 20);
scene.add(underFill);
const baseRim = new THREE.PointLight(0x8bb7c8, 34, 12, 1.7);
baseRim.position.set(-7.1, -2.6, 15.2);
scene.add(baseRim);
const underRed = new THREE.PointLight(0xff3524, 32, 14, 1.6);
underRed.position.set(1.2, -1.55, 16.0);
scene.add(underRed);
const underRed2 = new THREE.PointLight(0xff2b1c, 22, 11, 1.6);
underRed2.position.set(-7.4, -2.1, 13.0);
scene.add(underRed2);

// a clean cold edge, opposite the emergency red
const coldRim = new THREE.DirectionalLight(0x83b6cc, .78);
coldRim.position.set(-12, 9, -17);
scene.add(coldRim);

const pulseLights = [
  { light: underRed, base: 32, phase: 3.9 },
  { light: underRed2, base: 22, phase: 4.7 },
];
function addRedLight(x, y, z, intensity = 38, distance = 16, phase = 0) {
  const l = new THREE.PointLight(0xff1b13, intensity, distance, 1.85);
  l.position.set(x, y, z);
  scene.add(l);
  pulseLights.push({ light: l, base: intensity, phase });
  return l;
}
addRedLight(0, 13.8, 1.0, 70, 25, 0);
addRedLight(-8.6, 5.9, 4.5, 42, 18, .8);
addRedLight(8.6, 10.6, 2.4, 40, 18, 1.9);
addRedLight(0, -2.0, 8.0, 33, 12, 2.7);
addRedLight(8.0, 2.4, -4.0, 31, 14, .35);

const crtLight = new THREE.PointLight(0x64ffa8, 17, 11, 1.8);
crtLight.position.set(-9.7, 3.1, 7.1);
scene.add(crtLight);

function glowSprite(color, scale, opacity = .6) {
  const mat = new THREE.SpriteMaterial({
    map: GLOW_TEX, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

// ── shared animation registries ────────────────────────────────────────
const floaters = [];
const deskFloat = [];
const screens = [];

// ── camera interaction: drag, wheel, pinch — no interface ───────────────
const pointers = new Map();
let dragging = false;
let lastX = 0, lastY = 0;
let pinchDist = 0;
let userActiveAt = -100;
let vTheta = 0, vPhi = 0;

function markActive() { userActiveAt = clockTime; }
stage.addEventListener('pointerdown', e => {
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    stage.classList.add('grabbing');
  } else if (pointers.size === 2) {
    const ps = [...pointers.values()];
    pinchDist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
  }
  markActive();
});
stage.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const ps = [...pointers.values()];
    const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    if (pinchDist > 0) {
      goal.radius = clamp(goal.radius * (pinchDist / Math.max(d, 1)), 18, 140);
    }
    pinchDist = d;
    markActive();
    return;
  }
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  goal.theta -= dx * .0042;
  goal.phi = clamp(goal.phi - dy * .0031, .58, 1.47);
  vTheta = -dx * .0042;
  vPhi = -dy * .0031;
  markActive();
});
function releasePointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size === 1) {
    const p = [...pointers.values()][0];
    lastX = p.x; lastY = p.y; dragging = true;
  } else if (pointers.size === 0) {
    dragging = false; stage.classList.remove('grabbing');
  }
  if (pointers.size < 2) pinchDist = 0;
}
stage.addEventListener('pointerup', releasePointer);
stage.addEventListener('pointercancel', releasePointer);
stage.addEventListener('wheel', e => {
  e.preventDefault();
  goal.radius = clamp(goal.radius * Math.exp(e.deltaY * .00092), 18, 140);
  markActive();
}, { passive: false });
stage.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (typeof resizePost === 'function') resizePost();
});

// the simulation clock is used by interaction bookkeeping too
let clockTime = 0;
