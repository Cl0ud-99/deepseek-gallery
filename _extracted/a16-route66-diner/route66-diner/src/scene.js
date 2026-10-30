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
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.5, 2200);
camera.position.set(105, 90, 118);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.65;
controls.screenSpacePanning = false;
controls.minDistance = 20;
controls.maxDistance = 320;
controls.minPolarAngle = 0.10;
controls.maxPolarAngle = 1.36;
controls.update();

/* optional camera override, e.g. ?cam=110,60,90,0,9,-2 */
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
   1. SKY
   ============================================================ */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {
    cTop:    { value: new THREE.Color('#178b88') },
    cMid:    { value: new THREE.Color('#4cbcae') },
    cBottom: { value: new THREE.Color('#ffd49b') },
    sunDir:  { value: new THREE.Vector3(0.55, 0.62, 0.42).normalize() },
    cSun:    { value: new THREE.Color('#fff0c8') }
  },
  vertexShader: `
    varying vec3 vW;
    void main(){
      vW = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`,
  fragmentShader: `
    uniform vec3 cTop, cMid, cBottom, cSun, sunDir;
    varying vec3 vW;
    void main(){
      vec3 d = normalize(vW);
      float t = smoothstep(-0.95, 0.36, d.y);
      vec3 col = mix(cBottom, cMid, smoothstep(0.0, 0.52, t));
      col = mix(col, cTop, smoothstep(0.46, 1.0, t));
      float s = max(dot(d, normalize(sunDir)), 0.0);
      col += cSun * pow(s, 70.0) * 1.2;
      col += cSun * pow(s, 7.0) * 0.10;
      col += cSun * exp(-abs(d.y + 0.12) * 7.0) * 0.10;
      gl_FragColor = vec4(col, 1.0);
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(950, 40, 26), skyMat);
sky.frustumCulled = false;
scene.add(sky);

/* ============================================================
   2. LIGHTS
   ============================================================ */
const hemi = new THREE.HemisphereLight(0xa8e6dc, 0x94401f, 0.52);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0cc, 2.9);
sun.position.set(104, 104, 62);
sun.target.position.set(0, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 1;
sun.shadow.camera.left = -84;
sun.shadow.camera.right = 84;
sun.shadow.camera.top = 84;
sun.shadow.camera.bottom = -84;
sun.shadow.camera.near = 50;
sun.shadow.camera.far = 330;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.055;
scene.add(sun);
scene.add(sun.target);

const rim = new THREE.DirectionalLight(0x8fd0ff, 0.55);
rim.position.set(-80, 46, -70);
scene.add(rim);

scene.add(new THREE.AmbientLight(0xffd8b4, 0.12));

/* warm interior practicals */
const dinerLight = new THREE.PointLight(0xffd39a, 26, 26, 2);
dinerLight.position.set(8.6, 8.3, -7.0);
scene.add(dinerLight);
const garageLight = new THREE.PointLight(0xfff0cc, 18, 22, 2);
garageLight.position.set(25.4, 8.3, -7.0);
scene.add(garageLight);

/* ============================================================
   3. TEXTURES (procedural canvas)
   ============================================================ */
const MAXANISO = renderer.capabilities.getMaxAnisotropy();

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

const R = Math.random;

/* --- desert sand --- */
const sandTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#c25c3a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(208,118,80,0.20)' : 'rgba(148,60,38,0.18)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 40+R()*150, 30+R()*110, R()*3, 0, 6.283); ctx.fill();
  }
  /* coarse mottling that survives at diorama scale */
  for (let i = 0; i < 220; i++) {
    const k = R();
    ctx.fillStyle = k < 0.42 ? 'rgba(168,74,46,0.30)'
                  : k < 0.76 ? 'rgba(222,140,100,0.24)'
                  : 'rgba(120,48,30,0.26)';
    ctx.beginPath();
    ctx.ellipse(R()*w, R()*h, 6 + R()*34, 5 + R()*26, R()*3, 0, 6.283);
    ctx.fill();
  }
  /* wind ripples */
  ctx.strokeStyle = 'rgba(150,62,40,0.16)'; ctx.lineWidth = 6;
  for (let i = 0; i < 26; i++) {
    const y0 = R()*h, ph = R()*6;
    ctx.beginPath(); ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 12) ctx.lineTo(x, y0 + Math.sin(x*0.018 + ph) * 12);
    ctx.stroke();
  }
  for (let i = 0; i < 7000; i++) {
    const x = R()*w, y = R()*h, r = R()*2.3 + 0.35, k = R();
    ctx.fillStyle = k < 0.44 ? 'rgba(168,72,46,0.55)'
                  : k < 0.78 ? 'rgba(230,146,110,0.36)'
                  : 'rgba(122,48,32,0.45)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(148,62,40,0.20)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 34; i++) {
    const y0 = R()*h, ph = R()*6;
    ctx.beginPath(); ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 14) ctx.lineTo(x, y0 + Math.sin(x*0.022 + ph) * 9);
    ctx.stroke();
  }
  for (let i = 0; i < 260; i++) {
    const x = R()*w, y = R()*h, r = R()*3.2 + 0.9;
    ctx.fillStyle = R() < 0.5 ? 'rgba(92,40,28,0.72)' : 'rgba(206,180,150,0.55)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r*0.68, R()*3, 0, 6.283); ctx.fill();
  }
}, [14, 14]);

/* --- asphalt --- */
const asphaltTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#38342f'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) {
    const x = R()*w, y = R()*h, r = R()*1.9 + 0.3, k = R();
    ctx.fillStyle = k < 0.4 ? 'rgba(96,92,86,0.45)'
                  : k < 0.72 ? 'rgba(26,24,22,0.6)'
                  : 'rgba(146,138,126,0.22)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = 'rgba(70,66,60,0.35)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 26+R()*70, 18+R()*50, R()*3, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(20,18,16,0.85)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    let x = R()*w, y = R()*h;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) { x += (R()-0.5)*60; y += (R()-0.5)*60; ctx.lineTo(x, y); }
    ctx.stroke();
  }
}, [4, 4]);

/* --- checker diner floor --- */
const checkerTex = makeTex(256, 256, (ctx, w, h) => {
  const n = 4, s = w / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    ctx.fillStyle = ((x + y) % 2 === 0) ? '#f2e9d8' : '#2c2522';
    ctx.fillRect(x*s, y*s, s, s);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1.5;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath(); ctx.moveTo(i*s, 0); ctx.lineTo(i*s, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*s); ctx.lineTo(w, i*s); ctx.stroke();
  }
}, [7, 7]);

/* --- concrete --- */
const concreteTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#b9ac95'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) {
    const k = R();
    ctx.fillStyle = k < 0.5 ? 'rgba(154,142,124,0.4)' : 'rgba(214,204,186,0.4)';
    ctx.beginPath(); ctx.arc(R()*w, R()*h, R()*2 + 0.3, 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = 'rgba(88,78,66,0.13)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 20 + R()*54, 14 + R()*38, R()*3, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,110,96,0.55)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    let x = R()*w, y = R()*h;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 7; s++) { x += (R()-0.5)*70; y += (R()-0.5)*70; ctx.lineTo(x, y); }
    ctx.stroke();
  }
}, [3, 3]);

/* --- roof tar / gravel --- */
const roofTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#9c9281'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3200; i++) {
    const k = R();
    ctx.fillStyle = k < 0.45 ? 'rgba(110,102,90,0.55)' : k < 0.8 ? 'rgba(158,148,132,0.45)' : 'rgba(72,66,58,0.4)';
    ctx.beginPath(); ctx.arc(R()*w, R()*h, R()*2.6 + 0.4, 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(96,88,76,0.16)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, 18 + R()*40, 14 + R()*30, R()*3, 0, 6.283); ctx.fill();
  }
}, [4, 2]);

/* --- rust --- */
const rustTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#8d4b2b'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    const k = R();
    ctx.fillStyle = k < 0.28 ? 'rgba(180,104,54,0.55)'
                  : k < 0.54 ? 'rgba(104,50,24,0.55)'
                  : k < 0.78 ? 'rgba(206,140,84,0.35)'
                  : 'rgba(62,30,16,0.5)';
    ctx.beginPath(); ctx.ellipse(R()*w, R()*h, R()*13 + 2, R()*10 + 2, R()*3, 0, 6.283); ctx.fill();
  }
}, [2, 2]);

/* --- wood --- */
const woodTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#9b7a4e'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) {
    ctx.strokeStyle = R() < 0.5 ? 'rgba(120,92,58,0.35)' : 'rgba(186,156,112,0.28)';
    ctx.lineWidth = R()*2.4 + 0.5;
    const x = R()*w;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y <= h; y += 20) ctx.lineTo(x + Math.sin(y*0.03 + x)*3.4, y);
    ctx.stroke();
  }
}, [2, 2]);

/* --- pegboard --- */
const pegTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#c8b79b'; ctx.fillRect(0, 0, w, h);
  for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) {
    ctx.fillStyle = 'rgba(70,58,44,0.75)';
    ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,246,228,0.35)';
    ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.6, 0, 6.283); ctx.fill();
  }
}, [3, 2]);

/* --- soft radial (smoke / dust) --- */
const softTex = makeTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

/* --- neon text --- */
function mixWhite(hex, t) {
  const c = new THREE.Color(hex);
  const r = c.r + (1 - c.r) * t, g = c.g + (1 - c.g) * t, b = c.b + (1 - c.b) * t;
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
function neonTex(text, color, size, w, h) {
  return makeTex(w || 512, h || 256, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    const px = size || 130;
    ctx.font = `bold ${px}px "Arial Black", "Impact", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.shadowBlur = 22;
    ctx.globalAlpha = 0.38;
    ctx.fillText(text, cw/2, ch/2);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillText(text, cw/2, ch/2);
    ctx.lineWidth = Math.max(1.5, px * 0.018);
    ctx.strokeStyle = mixWhite(color, 0.45);
    ctx.strokeText(text, cw/2, ch/2);
  });
}

/* --- painted sign faces --- */
function paintedSign(bg, fg, text, sub) {
  return makeTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg; ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = fg;
    ctx.font = 'bold 150px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w/2, h/2 - 24);
    if (sub) {
      ctx.font = 'bold 46px "Arial Black", Impact, sans-serif';
      ctx.fillText(sub, w/2, h - 66);
    }
  });
}

/* --- retro garage posters --- */
function posterTex(bg, fg, title, body) {
  return makeTex(256, 352, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(w/2, 118, 60, 0, 6.283); ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(w/2, 118, 42, 0, 6.283); ctx.fill();
    ctx.fillStyle = fg;
    ctx.fillRect(w*0.2, 196, w*0.6, 7);
    ctx.font = 'bold 40px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w/2, 250);
    ctx.font = 'bold 19px Arial, sans-serif';
    ctx.fillText(body, w/2, 288);
    ctx.fillWidth = 0;
  });
}

/* ============================================================
   4. MATERIALS
   ============================================================ */
const gradData = new Uint8Array([68, 132, 198, 255]);
const grad = new THREE.DataTexture(gradData, gradData.length, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter;
grad.generateMipmaps = false;
grad.needsUpdate = true;

const toon = (color, opts = {}) => new THREE.MeshToonMaterial(
  Object.assign({ color, gradientMap: grad }, opts)
);
const toonM = (map, opts = {}) => new THREE.MeshToonMaterial(
  Object.assign({ map, gradientMap: grad }, opts)
);

const M = {
  sand:        new THREE.MeshToonMaterial({ map: sandTex, gradientMap: grad }),
  earth:       toon(0x7c3b26),
  earthDark:   toon(0x4b2015),
  asphalt:     new THREE.MeshToonMaterial({ map: asphaltTex, gradientMap: grad }),
  concrete:    new THREE.MeshToonMaterial({ map: concreteTex, gradientMap: grad }),
  roof:        new THREE.MeshToonMaterial({ map: roofTex, gradientMap: grad }),
  tile:        toonM(checkerTex),
  cream:       toon(0xf0dbb0),
  creamDark:   toon(0xe4cfa6),
  white:       toon(0xf6eeda),
  turquoise:   toon(0x2fb3a2),
  turquoiseD:  toon(0x1a8880),
  mint:        toon(0x8fdccd),
  yellow:      toon(0xf5bd4a),
  yellowD:     toon(0xd09422),
  red:         toon(0xd64230),
  redD:        toon(0x9e2a1c),
  maroon:      toon(0x7a2316),
  black:       toon(0x2b2521),
  dark:        toon(0x3b3430),
  chrome:      new THREE.MeshPhongMaterial({ color: 0xdde7e9, shininess: 150, specular: 0xffffff }),
  steel:       new THREE.MeshPhongMaterial({ color: 0x9ea8aa, shininess: 70, specular: 0xdddddd }),
  darkSteel:   new THREE.MeshPhongMaterial({ color: 0x4b5355, shininess: 45, specular: 0xaaaaaa }),
  rust:        new THREE.MeshToonMaterial({ map: rustTex, gradientMap: grad }),
  drum:        toon(0x8d4a29),
  drumAlt:     toon(0x9d6238),
  wood:        new THREE.MeshToonMaterial({ map: woodTex, gradientMap: grad }),
  woodDark:    toon(0x6d5334),
  peg:         new THREE.MeshToonMaterial({ map: pegTex, gradientMap: grad }),
  cactus:      toon(0x4a8f55),
  cactusD:     toon(0x366b41),
  brush:       toon(0x8a6a3c),
  rubber:      toon(0x24211f),
  glass: new THREE.MeshPhongMaterial({
    color: 0xa8ece4, transparent: true, opacity: 0.10,
    shininess: 220, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false
  }),
  glassDark: new THREE.MeshPhongMaterial({
    color: 0x1d3b3c, transparent: true, opacity: 0.62,
    shininess: 200, specular: 0xffffff, side: THREE.DoubleSide
  })
};

/* neon materials registry (flicker) */
const neonList = [];
const JUKE_BULBS = [];
const SPINNERS = [];
function neonMat(r, g, b, flicker = 0) {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.color.setRGB(r, g, b);
  m.userData.base = { r, g, b };
  m.userData.flicker = flicker;
  m.userData.seed = Math.random() * 100;
  neonList.push(m);
  return m;
}
const N_PINK = () => neonMat(3.2, 0.9, 1.9, 1);
const N_CYAN = () => neonMat(0.8, 3.0, 2.6, 1);
const N_AMBER = () => neonMat(3.2, 1.9, 0.55, 0);
const N_RED = () => neonMat(3.1, 0.55, 0.5, 1);
const N_WARM = () => neonMat(3.0, 2.3, 1.4, 0);

/* ============================================================
   5. GEOMETRY HELPERS
   ============================================================ */
function mkBox(w, h, d, mat, r = 0, seg = 1) {
  let geo;
  if (r > 0) {
    const rr = Math.min(r, w * 0.48, h * 0.48, d * 0.48);
    geo = new RoundedBoxGeometry(w, h, d, seg, rr);
  } else {
    geo = new THREE.BoxGeometry(w, h, d);
  }
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function mkCyl(rt, rb, h, seg, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function mkSph(r, mat, seg) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, (seg || 16) * 0.6), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function mkTor(r, t, mat, seg) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg || 24), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function place(p, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  p.add(m);
  return m;
}
/* shorthands */
const B = (p, w, h, d, m, x, y, z, r = 0, rx = 0, ry = 0, rz = 0) =>
  place(p, mkBox(w, h, d, m, r), x, y, z, rx, ry, rz);
const C = (p, rt, rb, h, sg, m, x, y, z, rx = 0, ry = 0, rz = 0) =>
  place(p, mkCyl(rt, rb, h, sg, m), x, y, z, rx, ry, rz);
const S = (p, r, m, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const s = mkSph(r, m);
  s.scale.set(sx, sy, sz);
  return place(p, s, x, y, z);
};
const T = (p, r, t, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 22) =>
  place(p, mkTor(r, t, m, seg), x, y, z, rx, ry, rz);

function glowPlane(parent, tex, w, h, x, y, z, ry = 0, rx = 0, bright = 1) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: tex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
      color: new THREE.Color(bright, bright, bright)
    })
  );
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, 0);
  parent.add(m);
  return m;
}

/* shared geometry pools */
const GEO = {
  tire: new THREE.TorusGeometry(0.86, 0.34, 8, 20),
  tireHub: new THREE.CylinderGeometry(0.55, 0.55, 0.30, 14)
};

/* ============================================================
   6. GROUND
   ============================================================ */
function buildGround() {
  const g = new THREE.Group();
  world.add(g);

  /* base slab — rounded display pedestal */
  const baseMatSide = toon(0x6b3323);
  const slab = new THREE.Mesh(
    new RoundedBoxGeometry(100, 7, 100, 3, 1.7),
    [baseMatSide, baseMatSide, M.sand, M.earthDark, baseMatSide, baseMatSide]
  );
  slab.position.y = -3.5;
  slab.receiveShadow = true;
  g.add(slab);

  /* collectible display plinth */
  const plinth = new THREE.Mesh(
    new RoundedBoxGeometry(103.6, 3.0, 103.6, 2, 0.55),
    toon(0x3d2417)
  );
  plinth.position.y = -8.4;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  g.add(plinth);
  /* brass trim line */
  B(g, 103.8, 0.14, 103.8, toon(0x8a6a33), 0, -6.95, 0, 0.04);

  /* highway (N-S) */
  B(g, 16, 0.62, 92, M.asphalt, -32, -0.09, 0);
  /* side road (E-W) */
  B(g, 70, 0.62, 12, M.asphalt, 11, -0.13, 30);

  /* lane markings */
  const dash = toon(0xf2c14e);
  for (let z = -44; z <= 44; z += 10) B(g, 0.5, 0.06, 4.2, dash, -32, 0.235, z);
  for (let x = -21; x <= 41; x += 10) B(g, 4.2, 0.06, 0.5, dash, x, 0.195, 30);

  /* edge lines */
  const line = toon(0xe6dcc6);
  B(g, 0.34, 0.06, 92, line, -39.4, 0.235, 0);
  B(g, 0.34, 0.06, 92, line, -24.6, 0.235, 0);
  B(g, 68, 0.06, 0.34, line, 10, 0.195, 24.4);
  B(g, 68, 0.06, 0.34, line, 10, 0.195, 35.6);

  /* patched asphalt / tar snakes */
  const patch = toon(0x2c2926);
  B(g, 3.2, 0.07, 1.4, patch, -35.4, 0.24, 12, 0, 0, 0.2);
  B(g, 1.6, 0.07, 2.6, patch, -29.2, 0.24, -18, 0, 0, -0.3);
  B(g, 2.4, 0.07, 1.1, patch, 4, 0.20, 33.6, 0, 0, 0.1);

  /* curbs along desert side of highway */
  const curb = toon(0xd8cdb4);
  for (let z = -46; z < 22; z += 8) B(g, 0.7, 0.5, 7.4, curb, -23.5, 0.28, z);
  for (let z = 39; z < 47; z += 8) B(g, 0.7, 0.5, 7.4, curb, -23.5, 0.28, z);

  /* forecourt concrete apron */
  B(g, 58, 0.62, 24, M.concrete, 17, -0.10, 12);

  /* forecourt cracks & oil stains */
  const stain = new THREE.MeshToonMaterial({ color: 0x3d3229, gradientMap: grad, transparent: true, opacity: 0.45 });
  const s1 = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18), stain);
  s1.rotation.x = -Math.PI / 2; s1.position.set(9, 0.222, 13); g.add(s1);
  const s2 = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), stain);
  s2.rotation.x = -Math.PI / 2; s2.position.set(19.5, 0.222, 9.5); g.add(s2);

  /* painted parking / pump lane lines */
  const paint = toon(0xf0e6cd);
  for (let i = 0; i < 3; i++) B(g, 0.28, 0.04, 6, paint, 3 + i * 5, 0.225, 22.6);

  /* kerb ring around forecourt */
  B(g, 58, 0.4, 0.7, curb, 17, 0.24, 0.1);

  /* ---- desert surface variation ---- */
  /* tyre tracks in the sand leading off the side road */
  const track = new THREE.MeshToonMaterial({ color: 0x9c452c, gradientMap: grad, transparent: true, opacity: 0.5, depthWrite: false });
  [-0.55, 0.55].forEach(dz => {
    B(g, 18, 0.02, 0.55, track, 34, 0.03, 20 + dz, 0, 0, 0.34);
  });

  /* faded painted shield on the asphalt */
  const shield = makeTex(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(240,230,205,0.55)'; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(60, 50); ctx.lineTo(196, 50); ctx.lineTo(196, 150);
    ctx.quadraticCurveTo(150, 210, 128, 215);
    ctx.quadraticCurveTo(106, 210, 60, 150);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(240,230,205,0.6)';
    ctx.font = 'bold 62px "Arial Black", Impact'; ctx.textAlign = 'center';
    ctx.fillText('66', 128, 140);
  });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: shield, transparent: true, depthWrite: false, toneMapped: false }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.set(-32, 0.245, 8);
  g.add(sh);
}

/* ============================================================
   7. BUILDING SHELL
   ============================================================ */
const BLD = { x0: 0, x1: 34, z0: -15, z1: 0, h: 10.4 };

function buildShell() {
  const g = new THREE.Group();
  world.add(g);
  const W = 0.62;
  const mid = 17;

  /* floors */
  const dinerFloor = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 14.6), M.tile);
  dinerFloor.rotation.x = -Math.PI / 2;
  dinerFloor.position.set(8.6, 0.27, -7.5);
  dinerFloor.receiveShadow = true;
  g.add(dinerFloor);

  const garageFloor = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 14.6), M.concrete);
  garageFloor.rotation.x = -Math.PI / 2;
  garageFloor.position.set(25.4, 0.27, -7.5);
  garageFloor.receiveShadow = true;
  g.add(garageFloor);

  /* walls */
  B(g, 34, BLD.h, W, M.cream, 17, BLD.h/2 + 0.26, -14.7);       // back
  B(g, W, BLD.h, 15, M.turquoiseD, 0.31, BLD.h/2 + 0.26, -7.5); // left (exterior)
  B(g, W, BLD.h, 15, M.creamDark, 33.69, BLD.h/2 + 0.26, -7.5); // right
  B(g, W, BLD.h, 15, M.cream, 17, BLD.h/2 + 0.26, -7.5);        // divider

  /* interior wainscot bands */
  B(g, 0.12, 2.2, 14.6, M.turquoise, 0.68, 1.36, -7.5);
  B(g, 0.12, 2.2, 14.6, M.yellow, 33.3, 1.36, -7.5);
  B(g, 16.4, 2.2, 0.12, M.red, 8.6, 1.36, -14.35);
  B(g, 16.4, 2.2, 0.12, M.yellowD, 25.4, 1.36, -14.35);

  /* ceilings */
  const dinerCeil = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 14.6), toon(0xc8b18a));
  dinerCeil.rotation.x = Math.PI / 2;
  dinerCeil.position.set(8.6, 10.15, -7.5);
  g.add(dinerCeil);
  const garageCeil = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 14.6), toon(0x6f6a5c));
  garageCeil.rotation.x = Math.PI / 2;
  garageCeil.position.set(25.4, 10.15, -7.5);
  g.add(garageCeil);

  /* roof */
  B(g, 35.6, 0.8, 16.6, M.roof, 17, 10.66, -7.5, 0.12);
  /* parapet */
  B(g, 35.6, 1.3, 0.55, M.cream, 17, 11.7, 0.15, 0.1);
  B(g, 35.6, 1.3, 0.55, M.cream, 17, 11.7, -15.15, 0.1);
  B(g, 0.55, 1.3, 16.6, M.cream, 0.15, 11.7, -7.5, 0.1);
  B(g, 0.55, 1.3, 16.6, M.cream, 33.85, 11.7, -7.5, 0.1);
  /* parapet cap */
  B(g, 35.9, 0.2, 0.8, M.turquoise, 17, 12.4, 0.15, 0.06);
  B(g, 35.9, 0.2, 0.8, M.turquoise, 17, 12.4, -15.15, 0.06);

  /* front fascia band above glass */
  B(g, 34, 1.6, 0.62, M.turquoise, 17, 9.85, -0.05, 0.06);
  B(g, 34.2, 0.42, 0.7, M.turquoise, 17, 9.2, -0.03, 0.05);
  B(g, 34.2, 0.3, 0.7, M.red, 17, 10.5, -0.03, 0.05);

  /* base plinth */
  B(g, 34, 1.3, 0.55, M.turquoiseD, 17, 0.92, 0, 0.05);

  /* structural columns on facade */
  const cols = [0.35, 5.7, 11.3, 17, 22.6, 28.2, 33.65];
  cols.forEach(x => {
    B(g, 0.85, BLD.h, 0.9, M.turquoise, x, BLD.h/2 + 0.26, -0.1, 0.08);
    B(g, 1.0, 0.55, 1.05, M.turquoise, x, 1.55, -0.1, 0.06);
  });

  /* glass panes (full transparency) */
  const glassPane = (x, w) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 7.5), M.glass);
    p.position.set(x, 5.3, -0.32);
    p.renderOrder = 6;
    g.add(p);
    /* interior shade so the room reads as an interior, not an open facade */
    const t = new THREE.Mesh(new THREE.PlaneGeometry(w, 7.5),
      new THREE.MeshBasicMaterial({
        color: 0x2a1a10, transparent: true, opacity: 0.30,
        depthWrite: false, toneMapped: false, side: THREE.DoubleSide
      }));
    t.position.set(x, 5.3, -0.44);
    t.renderOrder = 5;
    g.add(t);
  };
  glassPane(3.0, 4.4);
  glassPane(8.5, 4.6);
  glassPane(14.15, 4.6);
  glassPane(19.8, 4.6);
  glassPane(25.4, 4.6);
  glassPane(31.0, 4.6);

  /* horizontal mullions */
  B(g, 33.4, 0.24, 0.34, M.cream, 17, 3.9, -0.15, 0.04);
  B(g, 33.4, 0.18, 0.3, M.turquoise, 17, 6.1, -0.15, 0.04);

  /* diner entrance doors */
  B(g, 4.6, 0.3, 0.4, M.chrome, 8.5, 8.2, -0.3, 0.05);
  B(g, 0.2, 6.7, 0.32, M.chrome, 6.3, 4.85, -0.3, 0.03);
  B(g, 0.2, 6.7, 0.32, M.chrome, 10.7, 4.85, -0.3, 0.03);
  B(g, 4.4, 0.2, 0.34, M.chrome, 8.5, 1.55, -0.3, 0.03);
  B(g, 1.5, 0.16, 0.16, M.chrome, 7.6, 3.4, -0.42, 0.04);
  B(g, 1.5, 0.16, 0.16, M.chrome, 9.4, 3.4, -0.42, 0.04);

  /* marquee above facade */
  B(g, 35.6, 0.62, 4.4, M.roof, 17, 9.55, 2.0, 0.16);
  B(g, 35.9, 0.78, 0.55, M.cream, 17, 9.5, 4.18, 0.1);
  B(g, 36.0, 0.22, 0.64, M.red, 17, 9.84, 4.18, 0.06);
  B(g, 35.6, 0.16, 4.2, M.turquoise, 17, 9.21, 2.0, 0.05);
  /* marquee downlights */
  for (let i = 0; i < 7; i++) {
    C(g, 0.24, 0.24, 0.16, 12, N_WARM(), 1.6 + i * 5.2, 9.16, 3.4);
  }
  /* marquee struts */
  [-11, 11].forEach(dx => {
    B(g, 0.3, 0.3, 3.2, M.chrome, 17 + dx, 8.2, 1.2, 0.06, -0.42);
  });

  /* right exterior wall — painted mural sign */
  const mural = makeTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2fb3a2'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f7e7c6';
    ctx.beginPath(); ctx.arc(150, 128, 92, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#d64230';
    ctx.beginPath(); ctx.arc(150, 128, 66, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#f7e7c6';
    ctx.font = 'bold 96px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GAS', 150, 132);
    ctx.font = 'bold 54px "Arial Black", Impact, sans-serif';
    ctx.fillText('SERVICE · ICE', 350, 100);
    ctx.fillText('COLD DRINKS', 350, 168);
  });
  glowPlane(g, mural, 10, 5, 34.05, 6.2, -7.5, Math.PI / 2);
  /* turn glowPlane material into opaque-ish painted surface */
  const mm = g.children[g.children.length - 1].material;
  mm.blending = THREE.NormalBlending;
  mm.transparent = false;

  return g;
}

/* ============================================================
   8. DINER INTERIOR
   ============================================================ */
function buildDiner() {
  const g = new THREE.Group();
  world.add(g);

  /* --- back bar --- */
  B(g, 13.5, 3.2, 1.5, M.wood, 9.2, 1.86, -13.9, 0.08);
  B(g, 13.9, 0.24, 1.8, M.chrome, 9.2, 3.55, -13.9, 0.06);
  /* shelves */
  B(g, 12, 0.2, 0.9, M.woodDark, 9.2, 6.0, -14.35, 0.04);
  B(g, 12, 0.2, 0.9, M.woodDark, 9.2, 7.4, -14.35, 0.04);
  /* mirror behind bar */
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 3.4),
    new THREE.MeshPhongMaterial({ color: 0xb9d4d0, shininess: 240, specular: 0xffffff }));
  mirror.position.set(9.2, 5.2, -14.36);
  g.add(mirror);

  /* bottles */
  const bottleCols = [0x3f7d5a, 0xb2643a, 0xd9b45a, 0x5f8fa8, 0xa8452f];
  for (let i = 0; i < 11; i++) {
    const mat = toon(bottleCols[i % bottleCols.length]);
    C(g, 0.13, 0.16, 0.75, 8, mat, 3.9 + i * 1.05, 6.5, -14.32);
    C(g, 0.07, 0.07, 0.3, 8, mat, 3.9 + i * 1.05, 6.98, -14.32);
    if (i < 8) {
      C(g, 0.14, 0.17, 0.8, 8, mat, 4.6 + i * 1.2, 7.9, -14.32);
    }
  }

  /* --- counter --- */
  B(g, 1.7, 3.0, 10.4, M.cream, 12.6, 1.76, -7.2, 0.1);
  B(g, 1.66, 0.36, 10.4, M.turquoise, 12.6, 0.62, -7.2, 0.04);
  B(g, 2.2, 0.26, 10.9, M.chrome, 12.6, 3.4, -7.2, 0.07);
  /* counter front ribs */
  for (let i = 0; i < 9; i++) {
    B(g, 0.1, 2.1, 0.32, M.creamDark, 11.72, 1.5, -11.5 + i * 1.16, 0.03);
  }

  /* stools */
  for (let i = 0; i < 5; i++) {
    const z = -11.2 + i * 2.0;
    C(g, 0.62, 0.7, 0.16, 14, M.chrome, 10.3, 0.36, z);
    C(g, 0.11, 0.11, 2.05, 10, M.chrome, 10.3, 1.4, z);
    T(g, 0.55, 0.07, M.chrome, 10.3, 2.4, z, Math.PI / 2);
    C(g, 0.66, 0.6, 0.3, 16, M.red, 10.3, 2.56, z);
  }

  /* --- counter appliances --- */
  /* milkshake machine */
  B(g, 1.3, 0.5, 0.9, M.chrome, 5.4, 3.78, -7.2, 0.1);
  for (let i = 0; i < 2; i++) {
    const x = 5.0 + i * 0.8;
    C(g, 0.09, 0.09, 1.2, 8, M.chrome, x, 4.5, -7.2);
    C(g, 0.16, 0.2, 0.5, 10, M.steel, x, 5.15, -7.2);
    C(g, 0.22, 0.16, 0.5, 12, M.mint, x, 3.9, -7.2);
  }
  /* burger warmer case */
  B(g, 1.9, 0.14, 1.2, M.chrome, 8.6, 3.62, -7.2, 0.04);
  const warmerGlass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 1.2), M.glass);
  warmerGlass.position.set(8.6, 4.3, -7.2);
  g.add(warmerGlass);
  B(g, 1.9, 0.12, 1.2, M.chrome, 8.6, 4.9, -7.2, 0.04);
  const warmGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.95, 0.45), toneMapped: false, side: THREE.DoubleSide }));
  warmGlow.position.set(8.6, 4.3, -7.72); g.add(warmGlow);
  for (let i = 0; i < 3; i++) {
    S(g, 0.34, toon(0xd99a52), 8.6, 3.85 + i * 0.34, -7.2, 1, 0.55, 1);
    C(g, 0.36, 0.36, 0.11, 12, toon(0x5a3320), 8.6, 4.0 + i * 0.34, -7.2);
  }
  /* register */
  B(g, 0.9, 0.6, 0.8, M.chrome, 14.0, 3.85, -7.2, 0.1);
  B(g, 0.7, 0.35, 0.6, M.darkSteel, 14.0, 4.3, -7.2, 0.06);
  /* pie stand */
  C(g, 0.45, 0.5, 0.1, 16, M.chrome, 11.3, 3.6, -5.2);
  C(g, 0.06, 0.06, 0.7, 8, M.chrome, 11.3, 3.95, -5.2);
  for (let i = 0; i < 3; i++) {
    C(g, 0.42, 0.42, 0.16, 16, toon(0xe0b579), 11.3, 3.7 + i * 0.28, -5.2);
  }

  /* --- booths --- */
  booth(g, 3.2, -11.0, Math.PI / 2);
  booth(g, 3.2, -5.4, Math.PI / 2);

  /* --- jukebox --- */
  const juke = new THREE.Group();
  juke.position.set(2.9, 0.28, -1.9);
  juke.rotation.y = 0.5;
  g.add(juke);
  B(juke, 2.0, 1.0, 1.3, M.woodDark, 0, 0.5, 0, 0.14);
  B(juke, 2.05, 0.22, 1.36, M.chrome, 0, 1.06, 0, 0.06);
  /* arch body */
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.3, 20, 1, false, 0, Math.PI), M.red);
  arch.rotation.x = Math.PI / 2;
  arch.rotation.z = Math.PI;
  arch.position.set(0, 1.05, 0);
  juke.add(arch);
  B(juke, 2.05, 1.5, 0.3, M.woodDark, 0, 1.6, -0.5, 0.1);
  /* chrome arch trim */
  const archTrim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.06, 6, 26, Math.PI), M.chrome);
  archTrim.position.set(0, 1.05, 0.66); juke.add(archTrim);
  /* glowing arch strip */
  const jukeBulbs = [];
  for (let i = 0; i < 13; i++) {
    const a = Math.PI * (i / 12);
    const m = new THREE.MeshBasicMaterial({ toneMapped: false });
    m.color.setRGB(3, 1.4, 1.6);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), m);
    b.position.set(Math.cos(a) * 1.02, 1.05 + Math.sin(a) * 1.02, 0.66);
    juke.add(b);
    jukeBulbs.push(m);
  }
  /* speaker grille */
  const grille = makeTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2b2521'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(0, i * 10); ctx.lineTo(w, i * 10); ctx.stroke(); }
  });
  glowPlane(juke, grille, 1.7, 0.9, 0, 0.55, 0.67).material.blending = THREE.NormalBlending;
  JUKE_BULBS.push(...jukeBulbs);

  /* --- neon "EAT" on back wall --- */
  glowPlane(g, neonTex('EAT', '#ff3355', 150, 512, 220), 5.2, 2.2, 9.2, 8.4, -14.3, 0, 0, 1.05);
  /* --- menu board --- */
  const menu = makeTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a2420'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f7e7c6'; ctx.lineWidth = 8; ctx.strokeRect(10, 10, w-20, h-20);
    ctx.fillStyle = '#f7e7c6';
    ctx.font = 'bold 44px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("TODAY'S SPECIAL", w/2, 62);
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillStyle = '#f5bd4a';
    ctx.fillText('BURGER .......... 25¢', w/2, 122);
    ctx.fillText('SHAKE ........... 15¢', w/2, 166);
    ctx.fillText('COFFEE .......... 05¢', w/2, 210);
  });
  glowPlane(g, menu, 3.4, 1.7, 3.6, 7.9, -14.32).material.blending = THREE.NormalBlending;

  /* clock */
  C(g, 0.62, 0.62, 0.16, 20, M.cream, 14.4, 8.3, -14.3, Math.PI / 2);
  T(g, 0.64, 0.06, M.red, 14.4, 8.3, -14.22);
  B(g, 0.05, 0.42, 0.05, M.black, 14.4, 8.5, -14.2);
  B(g, 0.3, 0.05, 0.05, M.black, 14.55, 8.3, -14.2);

  /* --- pendant lights over counter --- */
  for (let i = 0; i < 4; i++) {
    const z = -11.0 + i * 2.6;
    C(g, 0.03, 0.03, 1.4, 6, M.black, 12.6, 9.4, z);
    C(g, 0.52, 0.18, 0.42, 14, M.turquoise, 12.6, 8.6, z);
    S(g, 0.2, N_WARM(), 12.6, 8.35, z);
  }

  /* ceiling light discs */
  for (let i = 0; i < 6; i++) {
    const x = 3.5 + (i % 3) * 5.2, z = -11 + Math.floor(i / 3) * 5.5;
    C(g, 0.75, 0.75, 0.12, 14, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.3), toneMapped: false }), x, 10.1, z);
  }

  /* picture frames on left wall */
  [0x3f7d5a, 0xd64230].forEach((c, i) => {
    B(g, 0.1, 1.5, 2.0, M.woodDark, 0.72, 6.6, -9 + i * -3.6);
    B(g, 0.06, 1.2, 1.7, toon(c), 0.79, 6.6, -9 + i * -3.6);
  });

  return g;
}

function booth(parent, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0.28, z);
  g.rotation.y = ry;
  parent.add(g);

  /* table */
  C(g, 1.25, 1.25, 0.16, 20, M.cream, 0, 2.44, 0);
  T(g, 1.25, 0.07, M.chrome, 0, 2.36, 0, Math.PI / 2);
  C(g, 0.1, 0.1, 2.2, 8, M.chrome, 0, 1.3, 0);
  C(g, 0.72, 0.8, 0.14, 16, M.chrome, 0, 0.3, 0);

  /* condiments */
  C(g, 0.1, 0.12, 0.34, 8, M.red, 0.3, 2.69, 0.2);
  B(g, 0.22, 0.26, 0.22, M.chrome, -0.28, 2.65, -0.15, 0.04);

  bench(g, 0, 1.85, 0);
  bench(g, 0, -1.85, Math.PI);

  /* napkin / salt */
  return g;
}

function bench(parent, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  B(g, 2.9, 0.9, 1.15, M.creamDark, 0, 0.55, 0, 0.08);
  B(g, 2.9, 0.3, 1.2, M.red, 0, 1.14, 0, 0.12);
  B(g, 2.9, 1.4, 0.3, M.red, 0, 1.9, -0.52, 0.12, -0.14);
  B(g, 2.95, 1.55, 0.16, M.creamDark, 0, 1.95, -0.72, 0.06);
  /* tufting seams */
  for (let i = 0; i < 3; i++) {
    B(g, 0.06, 1.3, 0.06, M.redD, -0.95 + i * 0.95, 1.9, -0.35, 0.03);
  }
}

/* ============================================================
   9. GARAGE INTERIOR
   ============================================================ */
function buildGarage() {
  const g = new THREE.Group();
  world.add(g);
  const F = 0.28;

  /* --- two-post lift --- */
  const liftX = 23.5, liftZ = -6.5;
  [-2.6, 2.6].forEach(dx => {
    B(g, 0.75, 4.3, 0.75, M.yellow, liftX + dx, 2.35, liftZ, 0.06);
    B(g, 1.1, 0.25, 1.1, M.darkSteel, liftX + dx, F + 0.1, liftZ, 0.04);
    /* arms */
    B(g, 1.9, 0.2, 0.32, M.darkSteel, liftX + dx - Math.sign(dx) * 1.2, 0.9, liftZ + 1.2);
    B(g, 1.9, 0.2, 0.32, M.darkSteel, liftX + dx - Math.sign(dx) * 1.2, 0.9, liftZ - 1.2);
    B(g, 0.5, 0.5, 0.2, M.red, liftX + dx, 3.9, liftZ + 0.45);
  });
  B(g, 6.0, 0.4, 0.4, M.yellowD, liftX, 4.5, liftZ, 0.05);
  /* cables */
  C(g, 0.05, 0.05, 3.0, 6, M.darkSteel, liftX - 1.4, 3.0, liftZ + 0.42);
  C(g, 0.05, 0.05, 3.0, 6, M.darkSteel, liftX + 1.4, 3.0, liftZ + 0.42);

  /* oil pan under lift */
  B(g, 1.5, 0.18, 1.0, M.darkSteel, liftX, F + 0.1, liftZ, 0.06);

  /* --- pegboard on divider wall (+X face) --- */
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.6), M.peg);
  peg.rotation.y = Math.PI / 2;
  peg.position.set(17.36, 4.4, -8.6);
  g.add(peg);
  B(g, 0.08, 3.9, 8.7, M.woodDark, 17.3, 4.4, -8.6);

  /* wrenches hanging */
  const wrenchGeo = new THREE.TorusGeometry(0.19, 0.055, 6, 12);
  for (let i = 0; i < 6; i++) {
    const z = -11.4 + i * 1.1;
    const s = 0.9 + Math.sin(i * 1.7) * 0.35;
    B(g, 0.1, 1.05 * s, 0.1, M.steel, 17.46, 4.3 + 0.1, z, 0.04);
    place(g, new THREE.Mesh(wrenchGeo, M.steel), 17.46, 4.3 - 0.62 * s, z, 0, Math.PI / 2, 0);
    place(g, new THREE.Mesh(wrenchGeo, M.steel), 17.46, 4.3 + 0.68, z, 0, Math.PI / 2, 0.4);
  }
  for (let i = 0; i < 5; i++) {
    const z = -11.0 + i * 1.2;
    B(g, 0.09, 0.85, 0.09, M.darkSteel, 17.46, 3.05, z, 0.03);
    place(g, new THREE.Mesh(wrenchGeo, M.darkSteel), 17.46, 2.55, z, 0, Math.PI / 2, 0);
  }
  /* screwdrivers rack */
  for (let i = 0; i < 5; i++) {
    C(g, 0.05, 0.05, 0.7, 6, i % 2 ? M.red : M.yellow, 17.46, 3.0, -5.6 - i * 0.28, 0, 0, 0);
  }

  /* --- workbench along back wall --- */
  B(g, 9.5, 0.3, 1.7, M.wood, 24.5, 3.0, -14.0, 0.05);
  [-4.2, 4.2].forEach(dx => {
    B(g, 0.22, 2.9, 0.22, M.darkSteel, 24.5 + dx, 1.5, -13.6);
    B(g, 0.22, 2.9, 0.22, M.darkSteel, 24.5 + dx, 1.5, -14.35);
  });
  B(g, 9.2, 0.14, 1.5, M.darkSteel, 24.5, 1.1, -14.0, 0.03);
  /* vise */
  B(g, 0.8, 0.5, 0.7, M.darkSteel, 20.6, 3.4, -13.9, 0.06);
  B(g, 0.35, 0.3, 0.9, M.steel, 20.6, 3.65, -13.9, 0.04, 0, 0.3);
  C(g, 0.07, 0.07, 0.9, 6, M.steel, 20.6, 3.4, -13.9, 0, 0, Math.PI / 2);
  /* toolbox */
  B(g, 1.8, 1.0, 1.0, M.red, 26.4, 3.65, -14.0, 0.08);
  B(g, 1.85, 0.16, 1.05, M.redD, 26.4, 4.22, -14.0, 0.05);
  B(g, 1.0, 0.1, 0.16, M.chrome, 26.4, 4.4, -14.0, 0.03);
  /* parts & cans */
  for (let i = 0; i < 6; i++) {
    C(g, 0.16, 0.18, 0.5, 8, i % 3 === 0 ? M.yellowD : M.darkSteel, 22.2 + i * 0.42, 3.4, -13.9);
  }
  /* bench grinder */
  B(g, 0.9, 0.5, 0.6, M.darkSteel, 28.6, 3.4, -14.0, 0.06);
  C(g, 0.35, 0.35, 0.22, 14, M.steel, 28.6, 3.75, -13.9, Math.PI / 2);

  /* --- posters on back wall --- */
  const posters = [
    posterTex('#f5eddc', '#d64230', 'V8', 'POWER · SPEED'),
    posterTex('#2fb3a2', '#f7e7c6', 'OIL', 'CHANGE 10¢'),
    posterTex('#f5bd4a', '#7a2316', 'TIRES', 'GUARANTEED')
  ];
  posters.forEach((t, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.34),
      new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    p.position.set(19.2 + i * 2.2, 7.2, -14.36);
    g.add(p);
  });

  /* --- oil drums --- */
  drum(g, 31.2, -12.6, 0);
  drum(g, 32.4, -11.4, 0.4);
  drum(g, 30.6, -10.2, 1.2);
  /* drum on its side */
  const dside = new THREE.Group();
  dside.position.set(29.4, 1.15, -12.4);
  dside.rotation.z = Math.PI / 2;
  dside.rotation.y = 0.3;
  g.add(dside);
  drum(dside, 0, 0, 0);

  /* --- tire stack inside --- */
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(GEO.tire, M.rubber);
    t.rotation.x = Math.PI / 2;
    t.position.set(19.6, 0.62 + i * 0.66, -12.6);
    t.rotation.z = i * 0.4;
    t.castShadow = true;
    g.add(t);
  }

  /* --- shelving with cans --- */
  B(g, 0.25, 4.4, 4.2, M.woodDark, 17.5, 2.5, -2.6);
  for (let s = 0; s < 3; s++) {
    B(g, 1.0, 0.14, 4.0, M.steel, 17.95, 1.3 + s * 1.3, -2.6, 0.03);
    for (let i = 0; i < 7; i++) {
      C(g, 0.14, 0.14, 0.42, 8, i % 2 ? M.red : M.mint, 17.95, 1.6 + s * 1.3, -4.3 + i * 0.55);
    }
  }

  /* --- drop light --- */
  C(g, 0.03, 0.03, 2.4, 6, M.black, 24.5, 8.3, -9.0);
  C(g, 0.36, 0.16, 0.36, 12, M.darkSteel, 24.5, 6.9, -9.0);
  S(g, 0.17, N_WARM(), 24.5, 6.66, -9.0);

  /* --- floor jack --- */
  B(g, 1.6, 0.2, 0.7, M.red, 21.5, 0.5, -11.6, 0.05);
  B(g, 0.2, 1.1, 0.2, M.darkSteel, 21.0, 1.0, -11.6, 0.03);
  B(g, 0.9, 0.14, 0.14, M.chrome, 22.0, 1.55, -11.6);
  C(g, 0.18, 0.18, 0.14, 10, M.darkSteel, 20.7, 0.3, -11.9, Math.PI / 2);
  C(g, 0.18, 0.18, 0.14, 10, M.darkSteel, 20.7, 0.3, -11.3, Math.PI / 2);

  return g;
}

function drum(parent, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0.28, z);
  g.rotation.y = ry;
  parent.add(g);
  C(g, 0.86, 0.86, 2.4, 16, M.drum, 0, 1.2, 0);
  T(g, 0.87, 0.09, M.drumAlt, 0, 0.6, 0, Math.PI / 2);
  T(g, 0.87, 0.09, M.drumAlt, 0, 1.8, 0, Math.PI / 2);
  C(g, 0.9, 0.9, 0.1, 16, M.darkSteel, 0, 2.45, 0);
  C(g, 0.88, 0.88, 0.1, 16, M.darkSteel, 0, 0.06, 0);
  return g;
}

/* ============================================================
   10. CANOPY + PUMPS
   ============================================================ */
function buildCanopy() {
  const g = new THREE.Group();
  world.add(g);

  const cx = 12, cz = 12.5, w = 24, d = 18;

  /* slab */
  B(g, w, 0.55, d, M.yellow, cx, 11.5, cz, 0.24);
  B(g, w - 0.6, 0.14, d - 0.6, M.turquoise, cx, 11.19, cz, 0.05);
  /* fascia skirt (sits below the roof plate) */
  B(g, w + 0.5, 0.72, d + 0.5, M.turquoise, cx, 11.32, cz, 0.18);
  B(g, w + 0.7, 0.2, d + 0.7, M.cream, cx, 10.98, cz, 0.08);
  /* red rim on the top edge */
  B(g, w + 0.6, 0.2, 0.5, M.red, cx, 11.76, cz - d/2, 0.05);
  B(g, w + 0.6, 0.2, 0.5, M.red, cx, 11.76, cz + d/2, 0.05);
  B(g, 0.5, 0.2, d + 0.6, M.red, cx - w/2, 11.76, cz, 0.05);
  B(g, 0.5, 0.2, d + 0.6, M.red, cx + w/2, 11.76, cz, 0.05);
  /* underside ribs */
  for (let i = 0; i < 5; i++) {
    B(g, w - 1.4, 0.1, 0.32, M.creamDark, cx, 11.15, cz - d/2 + 1.6 + i * 3.7);
  }
  /* downlights */
  for (let i = 0; i < 4; i++) {
    C(g, 0.3, 0.3, 0.14, 12, N_WARM(), cx - 7.5 + i * 5, 11.12, cz - 4.4);
    C(g, 0.3, 0.3, 0.14, 12, N_WARM(), cx - 7.5 + i * 5, 11.12, cz + 4.4);
  }

  /* columns */
  const colPos = [[cx - 9.6, cz - 7.2], [cx + 9.6, cz - 7.2], [cx - 9.6, cz + 7.2], [cx + 9.6, cz + 7.2]];
  colPos.forEach(([x, z]) => {
    B(g, 1.1, 0.4, 1.1, M.creamDark, x, 0.42, z, 0.1);
    C(g, 0.42, 0.46, 10.3, 14, M.chrome, x, 5.6, z);
    for (let i = 0; i < 3; i++) {
      T(g, 0.46, 0.09, M.red, x, 2.4 + i * 3.0, z, Math.PI / 2);
    }
  });

  /* painted logo on canopy roof */
  const canLogo = makeTex(512, 384, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(200,52,38,0.95)';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 === 0 ? 74 : 31;
      const x = cw/2 + Math.cos(a) * rr, y = 104 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(20,120,113,0.96)';
    ctx.font = 'bold 132px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAS', cw/2, 268);
    ctx.font = 'bold 34px "Arial Black", Impact, sans-serif';
    ctx.fillText('SERVICE · ICE · EAT', cw/2, 340);
  });
  const canPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 9),
    new THREE.MeshBasicMaterial({ map: canLogo, transparent: true, depthWrite: false, toneMapped: false }));
  canPlane.rotation.x = -Math.PI / 2;
  canPlane.position.set(cx, 11.79, cz);
  g.add(canPlane);

  /* canopy neon strip on fascia */
  glowPlane(g, neonTex('GAS · FOOD · LODGING', '#28e2d2', 58, 1024, 128), 16, 1.9, cx, 11.42, cz + d/2 + 0.42, 0, 0, 0.95);

  /* --- pump islands --- */
  island(g, 5.2);
  island(g, 17.2);

  return g;
}

function island(parent, x) {
  const g = new THREE.Group();
  parent.add(g);
  /* curb */
  B(g, 2.9, 0.5, 9.4, M.creamDark, x, 0.35, 12.2, 0.14);
  B(g, 2.5, 0.12, 9.0, M.concrete, x, 0.62, 12.2, 0.04);
  /* bollards */
  [8.0, 16.4].forEach(z => {
    C(g, 0.2, 0.24, 1.3, 10, M.yellow, x, 1.3, z);
    C(g, 0.22, 0.22, 0.16, 10, M.red, x, 1.75, z);
  });
  /* pumps */
  [9.7, 12.2, 14.7].forEach(z => {
    pump(g, x, z, Math.PI / 2);
  });
  /* trash can */
  C(g, 0.48, 0.42, 1.2, 12, M.turquoiseD, x + 0.85, 1.2, 15.9);
  C(g, 0.52, 0.52, 0.12, 12, M.chrome, x + 0.85, 1.86, 15.9);
}

function pump(parent, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0.68, z);
  g.rotation.y = ry;
  parent.add(g);

  B(g, 1.6, 0.4, 1.6, M.darkSteel, 0, 0.2, 0, 0.06);
  B(g, 1.42, 3.3, 1.2, M.cream, 0, 1.95, 0, 0.2);
  B(g, 1.46, 0.8, 1.24, M.turquoise, 0, 1.05, 0, 0.1);
  B(g, 1.46, 0.4, 1.24, M.red, 0, 3.5, 0, 0.1);
  B(g, 1.2, 0.14, 1.0, M.chrome, 0, 3.68, 0, 0.05);

  /* both faces so the pump reads from any angle */
  [-1, 1].forEach(sd => {
    const zf = sd * 0.62;
    const gauge = makeTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#f6efdf'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2b2521'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(w/2, h*0.78, 44, Math.PI * 1.16, Math.PI * 1.84); ctx.stroke();
      ctx.fillStyle = '#d64230'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
      ctx.fillText('GAL', w/2, h*0.36);
      ctx.fillStyle = '#2b2521'; ctx.font = 'bold 18px Arial';
      ctx.fillText('9.9', w*0.32, h*0.72); ctx.fillText('0', w*0.62, h*0.72);
      ctx.strokeStyle = '#d64230'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w/2, h*0.78); ctx.lineTo(w*0.62, h*0.66); ctx.stroke();
    });
    B(g, 0.94, 0.98, 0.06, M.chrome, 0, 2.42, zf);
    const gp = glowPlane(g, gauge, 0.8, 0.8, 0, 2.42, zf + sd * 0.035);
    gp.material.blending = THREE.NormalBlending;
    if (sd < 0) gp.rotation.y = Math.PI;

    /* hose + nozzle */
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.74 * sd, 2.7, 0.1 * sd),
      new THREE.Vector3(1.02 * sd, 2.05, 0.3 * sd),
      new THREE.Vector3(1.08 * sd, 1.25, 0.14 * sd),
      new THREE.Vector3(0.78 * sd, 0.95, -0.1 * sd)
    ]);
    const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 14, 0.075, 6, false), M.black);
    hose.castShadow = true;
    g.add(hose);
    B(g, 0.18, 0.52, 0.18, M.chrome, 0.74 * sd, 0.94, -0.1 * sd, 0.05, 0, 0, 0.4 * sd);
  });

  /* globe */
  C(g, 0.3, 0.42, 0.34, 12, M.chrome, 0, 3.78, 0);
  S(g, 0.48, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.8, 1.6), toneMapped: false }), 0, 4.2, 0);
  T(g, 0.48, 0.06, M.red, 0, 4.2, 0, Math.PI / 2);
  return g;
}

/* ============================================================
   11. CLASSIC CAR (hood open)
   ============================================================ */
function buildCar() {
  const g = new THREE.Group();
  g.position.set(28.5, 0.24, 13.4);
  g.rotation.y = -0.62;
  g.scale.setScalar(1.06);
  world.add(g);

  const bodyMat = M.turquoise;
  const creamMat = M.cream;

  /* chassis / lower body */
  B(g, 8.6, 1.15, 3.3, M.turquoiseD, 0, 1.02, 0, 0.4, 0, 0, 0);
  /* main body (rear cowl) */
  B(g, 6.5, 1.15, 3.34, bodyMat, -0.85, 1.72, 0, 0.45);
  /* front fenders — engine bay left open between them */
  [-1, 1].forEach(s => {
    B(g, 2.0, 1.02, 0.92, bodyMat, 3.18, 1.72, s * 1.26, 0.32);
    B(g, 1.5, 0.34, 1.0, bodyMat, 3.2, 2.16, s * 1.26, 0.16);
  });
  /* front lower pan */
  B(g, 1.95, 0.64, 2.7, bodyMat, 3.18, 1.44, 0, 0.18);
  /* firewall + bay floor */
  B(g, 0.18, 1.05, 2.6, M.darkSteel, 2.38, 1.92, 0, 0.03);
  B(g, 1.7, 0.12, 2.42, M.dark, 3.2, 1.79, 0, 0.02);
  /* rear haunch */
  B(g, 2.6, 1.0, 3.3, bodyMat, -3.1, 1.95, 0, 0.4);
  /* fins */
  [-1, 1].forEach(s => {
    const fin = B(g, 1.5, 0.85, 0.3, bodyMat, -3.75, 2.35, s * 1.55, 0.12, 0, 0, s * 0.12);
    B(g, 1.5, 0.12, 0.12, M.chrome, -3.75, 2.78, s * 1.55, 0.05, 0, 0, s * 0.12);
  });

  /* cabin: beltline + glasshouse + pillars + roof */
  B(g, 4.75, 0.62, 3.06, bodyMat, -0.55, 2.3, 0, 0.22);
  B(g, 4.2, 1.2, 2.72, M.glassDark, -0.5, 3.05, 0, 0.16);
  B(g, 0.22, 1.34, 0.22, creamMat, 1.5, 3.1, 1.34, 0.05);
  B(g, 0.22, 1.34, 0.22, creamMat, 1.5, 3.1, -1.34, 0.05);
  B(g, 0.22, 1.34, 0.22, creamMat, -2.5, 3.1, 1.34, 0.05);
  B(g, 0.22, 1.34, 0.22, creamMat, -2.5, 3.1, -1.34, 0.05);
  B(g, 4.55, 0.34, 2.72, creamMat, -0.5, 3.7, 0, 0.24);
  B(g, 4.15, 0.1, 2.5, M.chrome, -0.5, 3.9, 0, 0.04);
  B(g, 4.2, 0.09, 2.9, M.chrome, -0.5, 2.6, 0, 0.04);
  /* windshield chrome A-pillars + header */
  B(g, 0.11, 1.34, 0.14, M.chrome, 1.6, 3.1, 1.3, 0.03, 0, 0, -0.16);
  B(g, 0.11, 1.34, 0.14, M.chrome, 1.6, 3.1, -1.3, 0.03, 0, 0, -0.16);
  B(g, 0.13, 0.13, 2.55, M.chrome, 1.5, 3.72, 0, 0.03);

  /* chrome side trim */
  [-1, 1].forEach(s => {
    B(g, 7.6, 0.1, 0.09, M.chrome, -0.1, 2.12, s * 1.68);
    B(g, 6.6, 0.06, 0.07, M.chrome, -0.1, 1.5, s * 1.7);
  });

  /* bumpers */
  B(g, 0.6, 0.55, 3.5, M.chrome, 4.4, 1.35, 0, 0.22);
  B(g, 0.6, 0.55, 3.5, M.chrome, -4.4, 1.35, 0, 0.22);
  [-1, 1].forEach(s => {
    B(g, 0.5, 0.4, 0.5, M.chrome, 4.42, 1.05, s * 1.5, 0.1);
  });

  /* grille */
  B(g, 0.16, 0.95, 2.25, M.darkSteel, 4.15, 1.85, 0, 0.05);
  for (let i = 0; i < 5; i++) {
    B(g, 0.1, 0.06, 2.1, M.chrome, 4.22, 1.5 + i * 0.19, 0);
  }

  /* headlights */
  [-1, 1].forEach(s => {
    C(g, 0.33, 0.33, 0.28, 14, M.chrome, 4.05, 2.1, s * 1.12, 0, 0, Math.PI / 2);
    C(g, 0.25, 0.25, 0.12, 14, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.5, 2.1), toneMapped: false }), 4.18, 2.1, s * 1.12, 0, 0, Math.PI / 2);
  });
  /* hood ornament */
  C(g, 0.06, 0.1, 0.5, 8, M.chrome, 4.0, 2.4, 0);

  /* engine bay contents */
  B(g, 1.5, 0.7, 1.3, M.redD, 3.05, 2.24, 0, 0.1);
  B(g, 1.34, 0.24, 1.2, M.chrome, 3.05, 2.62, 0, 0.06);
  C(g, 0.36, 0.36, 0.16, 12, M.chrome, 3.05, 2.78, 0);
  C(g, 0.3, 0.3, 0.12, 12, M.darkSteel, 2.65, 2.72, 0.4, 0, 0, 0.3);
  B(g, 0.5, 0.42, 0.5, M.darkSteel, 3.55, 2.24, 0.68, 0.05);
  B(g, 0.45, 0.35, 0.35, M.yellow, 3.45, 2.2, -0.72, 0.05);
  /* hoses */
  const hc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.45, 2.45, 0.6), new THREE.Vector3(2.9, 2.8, 0.85),
    new THREE.Vector3(3.6, 2.6, 0.85), new THREE.Vector3(3.85, 2.3, 0.5)
  ]);
  const hoseMesh = new THREE.Mesh(new THREE.TubeGeometry(hc, 12, 0.07, 6, false), M.black);
  hoseMesh.castShadow = true; g.add(hoseMesh);

  /* open hood (hinged at cowl) */
  const hoodPivot = new THREE.Group();
  hoodPivot.position.set(2.25, 2.44, 0);
  hoodPivot.rotation.z = 0.82;
  g.add(hoodPivot);
  B(hoodPivot, 2.05, 0.14, 2.72, bodyMat, 1.02, 0, 0, 0.06);
  B(hoodPivot, 1.9, 0.06, 2.46, M.turquoiseD, 1.02, -0.1, 0, 0.04);
  B(hoodPivot, 0.1, 0.22, 2.5, M.chrome, 2.0, 0.02, 0, 0.03);

  /* wheels */
  const wheel = (x, z) => {
    C(g, 1.12, 1.12, 0.62, 20, M.rubber, x, 1.12, z, Math.PI / 2);
    C(g, 0.82, 0.82, 0.66, 20, M.white, x, 1.12, z, Math.PI / 2);
    C(g, 0.78, 0.78, 0.68, 20, M.rubber, x, 1.12, z, Math.PI / 2);
    C(g, 0.44, 0.44, 0.72, 16, M.chrome, x, 1.12, z, Math.PI / 2);
    S(g, 0.16, M.chrome, x + 0.02, 1.12, z, 1, 1, 0.7);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      B(g, 0.06, 0.32, 0.06, M.chrome, x + 0.03, 1.12 + Math.sin(a) * 0.28, z + Math.cos(a) * 0.28);
    }
  };
  wheel(2.75, 1.62); wheel(2.75, -1.62);
  wheel(-2.7, 1.62); wheel(-2.7, -1.62);

  /* smoke anchor */
  const anchor = new THREE.Object3D();
  anchor.position.set(3.15, 2.95, 0);
  g.add(anchor);

  /* small puddle under car */
  const pud = new THREE.Mesh(new THREE.CircleGeometry(1.2, 16),
    new THREE.MeshToonMaterial({ color: 0x2e2620, gradientMap: grad, transparent: true, opacity: 0.5 }));
  pud.rotation.x = -Math.PI / 2; pud.position.set(0.6, 0.02, 0.8); g.add(pud);

  return { group: g, anchor };
}

/* ============================================================
   12. PYLON NEON SIGN
   ============================================================ */
function buildSign() {
  const g = new THREE.Group();
  g.position.set(-13.5, 0.24, 12.5);
  world.add(g);

  B(g, 3.6, 1.0, 3.2, M.concrete, 0, 0.5, 0, 0.2);
  B(g, 4.0, 0.35, 3.6, M.creamDark, 0, 1.12, 0, 0.1);

  /* legs */
  [-1.1, 1.1].forEach(dz => {
    C(g, 0.34, 0.5, 13.5, 10, M.rust, 0, 8.2, dz);
    C(g, 0.5, 0.5, 0.2, 10, M.darkSteel, 0, 1.4, dz);
  });
  /* cross braces */
  for (let i = 0; i < 3; i++) {
    B(g, 0.18, 0.18, 2.4, M.rust, 0, 3.4 + i * 3.4, 0, 0.05, 0, 0, 0.5);
    B(g, 0.18, 0.18, 2.4, M.rust, 0, 3.4 + i * 3.4, 0, 0.05, 0, 0, -0.5);
  }

  /* sign box */
  const boxY = 19.4;
  B(g, 9.2, 7.0, 1.5, M.cream, 0, boxY, 0, 0.45);
  B(g, 9.5, 0.5, 1.7, M.red, 0, boxY + 3.55, 0, 0.16);
  B(g, 9.5, 0.5, 1.7, M.red, 0, boxY - 3.55, 0, 0.16);
  B(g, 0.5, 7.2, 1.7, M.red, -4.55, boxY, 0, 0.16);
  B(g, 0.5, 7.2, 1.7, M.red, 4.55, boxY, 0, 0.16);

  /* painted faces */
  const faceTex = paintedSign('#f7e7c6', '#d64230', 'GAS', '★  EAT  ★');
  glowPlane(g, faceTex, 8.2, 6.0, 0, boxY, 0.78).material.blending = THREE.NormalBlending;
  glowPlane(g, faceTex, 8.2, 6.0, 0, boxY, -0.78, Math.PI).material.blending = THREE.NormalBlending;

  /* neon tubes around box */
  const nm = N_CYAN();
  const nm2 = N_RED();
  B(g, 8.6, 0.16, 0.16, nm, 0, boxY + 3.2, 0.84);
  B(g, 8.6, 0.16, 0.16, nm, 0, boxY - 3.2, 0.84);
  B(g, 0.16, 6.5, 0.16, nm, -4.3, boxY, 0.84);
  B(g, 0.16, 6.5, 0.16, nm, 4.3, boxY, 0.84);
  B(g, 6.0, 0.12, 0.12, nm2, 0, boxY + 1.65, 0.86);
  B(g, 6.0, 0.12, 0.12, nm2, 0, boxY - 1.65, 0.86);

  /* marquee bulbs around box */
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    S(g, 0.13, N_WARM(), -4.2 + t * 8.4, boxY + 3.35, 0.86);
    S(g, 0.13, N_WARM(), -4.2 + t * 8.4, boxY - 3.35, 0.86);
  }

  /* arrow on top */
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 1.6);
  arrowShape.lineTo(2.6, 0);
  arrowShape.lineTo(1.0, 0);
  arrowShape.lineTo(1.0, -1.4);
  arrowShape.lineTo(-1.0, -1.4);
  arrowShape.lineTo(-1.0, 0);
  arrowShape.lineTo(-2.6, 0);
  arrowShape.closePath();
  const arrow = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arrowShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.7, 0.4), toneMapped: false })
  );
  arrow.position.set(0, boxY + 5.4, -0.25);
  g.add(arrow);

  /* star on very top */
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? 1.5 : 0.62;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape, { depth: 0.35, bevelEnabled: false }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 0.7), toneMapped: false })
  );
  star.position.set(0, boxY + 8.6, -0.17);
  g.add(star);

  /* guy wires */
  [-1, 1].forEach(s => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, boxY - 3.0, s * 0.7),
      new THREE.Vector3(3.2, 8, s * 2.2),
      new THREE.Vector3(5.4, 0.3, s * 3.2)
    ]);
    const w = new THREE.Mesh(new THREE.TubeGeometry(c, 10, 0.045, 5, false), M.darkSteel);
    g.add(w);
  });

  return g;
}

/* ============================================================
   13. ROOF: BURGER + WINDMILL WATER TOWER
   ============================================================ */
function buildRoofProps() {
  const g = new THREE.Group();
  world.add(g);
  const roofY = 11.25;

  /* ---------- giant burger ---------- */
  const burger = new THREE.Group();
  burger.position.set(8.5, roofY, -9.5);
  g.add(burger);

  C(burger, 0.4, 0.55, 2.0, 12, M.chrome, 0, 1.0, 0);
  C(burger, 1.1, 1.3, 0.4, 16, M.creamDark, 0, 0.2, 0);

  const spin = new THREE.Group();
  spin.position.y = 2.3;
  burger.add(spin);

  /* bottom bun */
  const bunMat = toon(0xe2a25c);
  S(spin, 2.05, bunMat, 0, 0.35, 0, 1, 0.55, 1);
  /* patty */
  C(spin, 1.95, 1.95, 0.55, 22, toon(0x5c3320), 0, 0.95, 0);
  /* cheese */
  const cheese = C(spin, 2.05, 2.05, 0.12, 4, toon(0xf2b53c), 0, 1.28, 0, 0, Math.PI / 4);
  /* lettuce (two ruffled rings) */
  T(spin, 1.95, 0.36, toon(0x6aa83f), 0, 1.5, 0, Math.PI / 2, 0, 0, 26);
  T(spin, 1.72, 0.3, toon(0x54932f), 0, 1.62, 0, Math.PI / 2, 0.4, 0, 22);
  /* tomato */
  C(spin, 1.6, 1.6, 0.22, 22, toon(0xc93a26), 0, 1.78, 0);
  /* onion ring */
  T(spin, 1.15, 0.16, toon(0xe8d7bb), 0, 1.95, 0, Math.PI / 2, 0, 0, 20);
  /* top bun */
  const topBun = S(spin, 2.05, bunMat, 0, 2.1, 0, 1, 0.72, 1);
  /* sesame seeds */
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.random() * 1.45;
    S(spin, 0.11, toon(0xf7eccf),
      Math.cos(a) * rr, 2.35 + Math.cos(rr / 2.05 * 1.1) * 0.6, Math.sin(a) * rr, 1, 0.6, 1);
  }
  burger.userData.spin = spin;
  SPINNERS.push({ obj: spin, axis: 'y', speed: 0.34 });

  /* ---------- windmill water tower ---------- */
  const tower = new THREE.Group();
  tower.position.set(26.5, roofY, -9.5);
  g.add(tower);

  const hgt = 5.0;
  /* lattice legs */
  const legPos = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  legPos.forEach(([x, z]) => {
    B(tower, 0.15, hgt, 0.15, M.steel, x * 0.8, hgt/2, z * 0.8, 0,
      z * 0.045, 0, -x * 0.045);
  });
  /* rings + X braces */
  for (let i = 0; i < 3; i++) {
    const y = 0.9 + i * 1.85;
    const sz = 1.66 - i * 0.30;
    B(tower, sz, 0.08, 0.08, M.steel, 0, y, -sz/2 + 0.12);
    B(tower, sz, 0.08, 0.08, M.steel, 0, y, sz/2 - 0.12);
    B(tower, 0.08, 0.08, sz, M.steel, -sz/2 + 0.12, y, 0);
    B(tower, 0.08, 0.08, sz, M.steel, sz/2 - 0.12, y, 0);
    if (i < 2) {
      B(tower, 2.1, 0.07, 0.07, M.steel, -sz/2 + 0.2, y + 0.92, -sz/2 + 0.2, 0, 0.5);
      B(tower, 2.1, 0.07, 0.07, M.steel, sz/2 - 0.2, y + 0.92, -sz/2 + 0.2, 0, -0.5);
      B(tower, 2.1, 0.07, 0.07, M.steel, -sz/2 + 0.2, y + 0.92, sz/2 - 0.2, 0, 0.5);
    }
  }
  /* platform */
  B(tower, 2.4, 0.14, 2.4, M.woodDark, 0, hgt - 0.1, 0, 0.03);

  /* tank */
  C(tower, 1.85, 1.85, 2.3, 18, M.drum, 0, hgt + 1.15, 0);
  C(tower, 1.92, 1.92, 0.14, 18, M.darkSteel, 0, hgt + 2.3, 0);
  C(tower, 1.92, 1.92, 0.14, 18, M.darkSteel, 0, hgt + 0.02, 0);
  const coneTop = new THREE.Mesh(new THREE.SphereGeometry(1.86, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.steel);
  coneTop.position.set(0, hgt + 2.36, 0);
  coneTop.scale.y = 0.5;
  coneTop.castShadow = true;
  tower.add(coneTop);
  C(tower, 0.35, 0.45, 1.2, 10, M.drum, 0, hgt + 0.2, 0);

  /* windmill head */
  const mill = new THREE.Group();
  mill.position.set(0, hgt + 2.7, 0);
  tower.add(mill);
  C(mill, 0.22, 0.28, 0.7, 10, M.steel, 0, 0.25, 0);
  /* tail vane */
  B(mill, 1.5, 0.8, 0.08, M.drumAlt, 0, 0.55, -1.35, 0.04);
  B(mill, 1.9, 0.05, 0.9, M.steel, 0, 0.25, -0.75);
  /* fan */
  const fan = new THREE.Group();
  fan.position.set(0, 0.55, 0.42);
  mill.add(fan);
  C(fan, 0.22, 0.22, 0.3, 10, M.steel, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const blade = B(fan, 1.75, 0.16, 0.62, M.steel, Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0, 0.02);
    blade.rotation.z = a;
  }
  T(fan, 1.95, 0.07, M.rust, 0, 0, 0.06);
  tower.userData.fan = fan;
  SPINNERS.push({ obj: fan, axis: 'z', speed: 1.15 });

  /* ---------- roof clutter ---------- */
  B(g, 2.6, 1.3, 2.0, M.steel, 2.0, roofY + 0.65, -13.2, 0.1);
  for (let i = 0; i < 5; i++) B(g, 0.1, 1.0, 1.8, M.darkSteel, 1.0 + i * 0.5, roofY + 0.65, -13.2);
  C(g, 1.3, 1.3, 1.6, 12, M.darkSteel, 31.2, roofY + 0.8, -13.0);
  C(g, 1.4, 1.4, 0.16, 12, M.steel, 31.2, roofY + 1.6, -13.0);
  /* vent pipes */
  C(g, 0.18, 0.18, 1.6, 10, M.steel, 20.0, roofY + 0.8, -1.6);
  C(g, 0.18, 0.18, 1.6, 10, M.steel, 29.0, roofY + 0.8, -1.6);
  B(g, 2.2, 0.16, 0.16, M.steel, 24.5, roofY + 0.1, -1.6);

  /* roof neon "DINER" — housed sign on the parapet */
  B(g, 9.4, 3.1, 0.5, M.cream, 8.5, roofY + 2.55, 0.55, 0.14);
  B(g, 9.7, 0.26, 0.62, M.red, 8.5, roofY + 4.15, 0.55, 0.06);
  B(g, 9.7, 0.26, 0.62, M.red, 8.5, roofY + 0.95, 0.55, 0.06);
  B(g, 9.7, 0.2, 0.62, M.turquoise, 8.5, roofY + 1.18, 0.55, 0.05);
  glowPlane(g, neonTex('DINER', '#ff4d80', 150, 768, 256), 8.6, 2.7, 8.5, roofY + 2.55, 0.83, 0, 0, 1.0);

  return g;
}

/* ============================================================
   14. EXTERIOR PROPS
   ============================================================ */
function tireStack(parent, x, z, n, scale) {
  const s = scale || 1;
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(GEO.tire, M.rubber);
    t.scale.setScalar(s);
    t.rotation.x = Math.PI / 2;
    t.rotation.z = i * 0.7 + 0.3;
    t.position.set(x + Math.sin(i * 2.1) * 0.12, 0.28 + i * 0.68 * s + 0.36, z + Math.cos(i * 1.9) * 0.12);
    t.castShadow = true; t.receiveShadow = true;
    parent.add(t);
  }
}

function buildProps() {
  const g = new THREE.Group();
  world.add(g);

  /* --- tire stacks --- */
  tireStack(g, 37.5, 6.5, 5, 1.0);
  tireStack(g, 39.6, 4.0, 3, 0.9);
  tireStack(g, 35.6, 3.0, 2, 0.85);
  /* single tires leaning */
  [[33.8, 9.6], [36.4, 10.8]].forEach(([x, z]) => {
    const t = new THREE.Mesh(GEO.tire, M.rubber);
    t.position.set(x, 1.1, z);
    t.rotation.set(0.1, 0.5, 0.25);
    t.castShadow = true;
    g.add(t);
  });

  /* --- oil drums outside --- */
  drum(g, 34.2, -3.0, 0.3);
  drum(g, 35.9, -1.4, 1.1);
  drum(g, 36.6, -4.4, 0.7);
  const ds = new THREE.Group();
  ds.position.set(33.4, 1.15, -5.6); ds.rotation.z = Math.PI / 2; ds.rotation.y = 0.9;
  g.add(ds); drum(ds, 0, 0, 0);

  /* --- phone booth --- */
  const pb = new THREE.Group();
  pb.position.set(38.5, 0.26, 17.5);
  pb.rotation.y = -0.35;
  g.add(pb);
  B(pb, 2.3, 0.32, 2.3, M.concrete, 0, 0.16, 0, 0.06);
  B(pb, 2.1, 1.0, 2.1, M.redD, 0, 0.85, 0, 0.08);
  /* four corner posts */
  [[-0.92, -0.92], [0.92, -0.92], [-0.92, 0.92], [0.92, 0.92]].forEach(([x, z]) => {
    B(pb, 0.24, 5.6, 0.24, M.red, x, 3.9, z, 0.05);
  });
  /* glass on three sides */
  [[0, 1.02, 0], [1.02, 0, Math.PI / 2], [-1.02, 0, Math.PI / 2]].forEach(([x, z, ry]) => {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 4.5), M.glass);
    gl.position.set(x, 4.2, z);
    gl.rotation.y = ry;
    gl.renderOrder = 4;
    pb.add(gl);
  });
  /* phone unit on the back wall */
  B(pb, 1.5, 0.9, 0.22, M.darkSteel, 0, 4.3, -0.95, 0.05);
  B(pb, 0.5, 0.85, 0.32, M.black, 0, 4.55, -0.78, 0.06);
  B(pb, 0.16, 0.42, 0.16, M.chrome, 0.34, 4.5, -0.76, 0.05);
  B(pb, 1.2, 0.14, 0.3, M.chrome, 0, 3.85, -0.85, 0.04);
  /* roof */
  B(pb, 2.4, 0.42, 2.4, M.red, 0, 7.02, 0, 0.1);
  B(pb, 2.2, 0.22, 2.2, M.cream, 0, 7.35, 0, 0.06);
  B(pb, 2.5, 0.14, 2.5, M.redD, 0, 6.78, 0, 0.05);
  glowPlane(pb, neonTex('PHONE', '#a8f0ff', 46, 512, 128), 1.9, 0.5, 0, 6.5, 1.02, 0, 0, 0.95);
  /* door handle */
  B(pb, 0.12, 0.55, 0.12, M.chrome, 0.78, 3.4, 1.05, 0.04);

  /* --- mile marker --- */
  const mm = new THREE.Group();
  mm.position.set(-21.2, 0.26, 21.4);
  g.add(mm);
  C(mm, 0.1, 0.12, 3.4, 8, M.steel, 0, 1.7, 0);
  B(mm, 1.1, 1.3, 0.12, M.cream, 0, 3.3, 0, 0.05);
  const mmTex = makeTex(128, 152, (ctx, w, h) => {
    ctx.fillStyle = '#f6efe0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b2521';
    ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center';
    ctx.fillText('ROUTE', w/2, 44);
    ctx.font = 'bold 62px "Arial Black", Impact'; ctx.fillText('66', w/2, 108);
    ctx.font = 'bold 18px Arial'; ctx.fillText('CALIF', w/2, 138);
  });
  glowPlane(g, mmTex, 1.05, 1.25, -21.2, 3.3, 21.47).material.blending = THREE.NormalBlending;

  /* --- utility poles + wires --- */
  const poleZ = [-42, -20, 2, 24, 44];
  poleZ.forEach((z, i) => {
    const x = -20.6;
    C(g, 0.4, 0.55, 13.5, 8, M.wood, x, 6.9, z);
    B(g, 4.2, 0.28, 0.28, M.woodDark, x, 12.4, z);
    B(g, 3.0, 0.24, 0.24, M.woodDark, x, 11.2, z);
    for (let k = -1; k <= 1; k += 1) {
      C(g, 0.13, 0.16, 0.36, 6, M.mint, x + k * 1.9, 12.72, z);
    }
    C(g, 0.09, 0.09, 0.5, 6, M.mint, x, 11.55, z);
    /* transformer on second pole */
    if (i === 2) {
      C(g, 0.55, 0.55, 1.4, 12, M.steel, x + 0.75, 10.3, z);
      C(g, 0.6, 0.6, 0.12, 12, M.darkSteel, x + 0.75, 11.0, z);
    }
  });
  /* wires */
  const wireMat = new THREE.LineBasicMaterial({ color: 0x2a2420, transparent: true, opacity: 0.85 });
  for (let i = 0; i < poleZ.length - 1; i++) {
    for (let k = -1; k <= 1; k++) {
      const a = new THREE.Vector3(-20.6 + k * 1.9, 12.72, poleZ[i]);
      const b = new THREE.Vector3(-20.6 + k * 1.9, 12.72, poleZ[i + 1]);
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= 1.5;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(14));
      g.add(new THREE.Line(geo, wireMat));
    }
  }
  /* service drop to building */
  const sd = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-20.6, 11.4, 2),
    new THREE.Vector3(-8, 12.5, 4),
    new THREE.Vector3(0.4, 11.2, 1.5)
  );
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(sd.getPoints(18)), wireMat));

  /* --- cacti --- */
  cactus(g, 42.5, -18.5, 1.15, 0.7);
  cactus(g, 44.5, -6.0, 0.95, 2.1);
  cactus(g, 40.0, -30.0, 1.3, 1.3);
  cactus(g, 30.0, 42.0, 1.05, 0.4);
  cactus(g, -12.0, -34.0, 1.2, 1.9);
  cactus(g, 8.0, -38.0, 0.9, 0.9);
  cactus(g, -44.0, 8.0, 1.1, 2.4);

  /* --- dead brush / tumbleweeds resting --- */
  [[41.0, 18.0, 1.3], [36.0, 24.0, 1.1], [-14.0, 34.0, 1.2], [46.0, 28.0, 1.0],
   [-34.0, -18.0, 1.4], [12.0, -30.0, 1.2], [24.0, 40.0, 1.0]].forEach(([x, z, s]) => {
    const t = makeTumbleweed(1.05);
    t.scale.setScalar(s);
    t.position.set(x, 1.05 * s, z);
    t.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(t);
  });

  /* --- dead wood / driftwood --- */
  const deadWood = (x, z, sc, ry) => {
    const t = new THREE.Group();
    t.position.set(x, 0.24, z);
    t.rotation.y = ry;
    t.scale.setScalar(sc);
    g.add(t);
    C(t, 0.16, 0.32, 2.2, 6, M.woodDark, 0, 1.1, 0, 0.14);
    const br = [[0.9, 0.5, 1.4, 0.6], [-0.8, 0.55, 1.2, -0.7], [0.3, 0.9, 1.6, 0.2], [-0.5, 0.35, 1.0, -0.3]];
    br.forEach(([bx, by, len, tilt], i) => {
      const c = new THREE.Group();
      c.position.set(0, by * 1.6, 0);
      c.rotation.set(tilt * 0.4, i * 1.6, tilt * 0.9);
      t.add(c);
      C(c, 0.05, 0.12, len, 5, M.woodDark, 0, len / 2, 0);
    });
    return t;
  };
  deadWood(45.5, -12.0, 1.0, 0.6);
  deadWood(38.0, -24.0, 0.8, 2.1);
  deadWood(-16.0, -12.0, 1.1, 1.2);
  deadWood(-30.0, 40.0, 0.9, 0.3);
  deadWood(22.0, -32.0, 1.0, 2.8);
  deadWood(-8.0, 40.0, 0.75, 1.7);

  /* --- rocks --- */
  const rockMat = toon(0x8a4a34);
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 14 + Math.random() * 38;
    let x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (x > -6 && x < 46 && z > -16 && z < 26) continue;
    const s = 0.35 + Math.random() * 0.9;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockMat);
    rock.position.set(x, s * 0.42, z);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.scale.y = 0.6;
    rock.castShadow = true; rock.receiveShadow = true;
    g.add(rock);
  }

  /* --- wooden fence (back) --- */
  for (let i = 0; i < 12; i++) {
    const x = -6 + i * 3.0;
    B(g, 0.22, 3.0, 0.22, M.wood, x, 1.6, -44, 0.03, 0, Math.random() * 0.2, Math.random() * 0.12 - 0.06);
  }
  B(g, 36, 0.2, 0.14, M.wood, 10.5, 2.2, -44);
  B(g, 36, 0.2, 0.14, M.wood, 10.5, 1.3, -44);

  /* --- "OPEN 24 HRS" neon in diner window --- */
  glowPlane(g, neonTex('OPEN 24 HRS', '#28e2d2', 44, 1024, 128), 4.2, 0.52, 3.0, 7.6, -0.62, 0, 0, 0.95);

  /* --- bench outside --- */
  const benchG = new THREE.Group();
  benchG.position.set(-4.5, 0.26, 6.0);
  benchG.rotation.y = 0.15;
  g.add(benchG);
  B(benchG, 4.0, 0.2, 1.2, M.wood, 0, 1.3, 0, 0.05);
  B(benchG, 4.0, 0.9, 0.16, M.wood, 0, 1.85, -0.5, 0.05, -0.14);
  [-1.6, 1.6].forEach(dx => {
    B(benchG, 0.16, 1.3, 0.16, M.darkSteel, dx, 0.65, 0.4);
    B(benchG, 0.16, 1.3, 0.16, M.darkSteel, dx, 0.65, -0.4);
  });

  /* --- ice machine & vending --- */
  const ice = new THREE.Group();
  ice.position.set(33.2, 0.26, 4.0);
  g.add(ice);
  B(ice, 1.8, 3.2, 1.5, M.cream, 0, 1.6, 0, 0.1);
  B(ice, 1.5, 1.2, 0.1, M.turquoise, 0, 2.0, 0.76, 0.04);
  const iceTex = makeTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2fb3a2'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f7e7c6';
    ctx.font = 'bold 44px "Arial Black", Impact'; ctx.textAlign = 'center';
    ctx.fillText('ICE', w/2, h/2 - 4);
    ctx.font = 'bold 18px Arial'; ctx.fillText('COLD', w/2, h/2 + 30);
  });
  glowPlane(g, iceTex, 1.3, 1.0, 33.2, 2.1, 4.77).material.blending = THREE.NormalBlending;

  return g;
}

function cactus(parent, x, z, s, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0.24, z);
  g.rotation.y = ry;
  g.scale.setScalar(s);
  parent.add(g);

  const h = 6.5;
  C(g, 0.55, 0.72, h, 8, M.cactus, 0, h/2, 0);
  S(g, 0.55, M.cactus, 0, h, 0, 1, 0.5, 1);
  /* ribs */
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    B(g, 0.1, h - 0.4, 0.1, M.cactusD, Math.cos(a) * 0.6, h/2, Math.sin(a) * 0.6);
  }
  /* arms */
  const arm = (y, dir, len) => {
    const a = new THREE.Group();
    a.position.set(0, y, 0);
    a.rotation.y = dir;
    g.add(a);
    C(a, 0.38, 0.38, 1.5, 8, M.cactus, 0.75, 0, 0, 0, 0, Math.PI / 2);
    C(a, 0.36, 0.44, len, 8, M.cactus, 1.45, len/2, 0);
    S(a, 0.36, M.cactus, 1.45, len, 0, 1, 0.6, 1);
  };
  arm(h * 0.5, 0.3, 2.6);
  arm(h * 0.66, Math.PI + 0.4, 2.1);
  return g;
}

function makeTumbleweed(radius) {
  const pts = [];
  for (let i = 0; i < 240; i++) {
    const a = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.5 + Math.random() * 0.5));
    const b = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.5 + Math.random() * 0.5));
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.add(new THREE.Vector3().randomDirection().multiplyScalar(radius * 0.45));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const ps = curve.getPoints(4);
    for (let j = 0; j < ps.length - 1; j++) pts.push(ps[j], ps[j + 1]);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0xb08a58, transparent: true, opacity: 0.95 });
  const grp = new THREE.Group();
  grp.add(new THREE.LineSegments(geo, mat));
  const twigMat = toon(0x9c7745);
  for (let i = 0; i < 14; i++) {
    const a = new THREE.Vector3().randomDirection().multiplyScalar(radius * 0.45);
    const b = new THREE.Vector3().randomDirection().multiplyScalar(radius * 0.92);
    const mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3().randomDirection().multiplyScalar(radius * 0.3));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 5, 0.05, 4, false), twigMat);
    grp.add(t);
  }
  return grp;
}

/* ============================================================
   15. PARTICLES — smoke, dust, tumbleweed runner
   ============================================================ */
const carRef = {};
const smokePuffs = [];
let dustPoints, tumbleGroup;

function initSmoke(anchor) {
  for (let i = 0; i < 26; i++) {
    const mat = new THREE.SpriteMaterial({
      map: softTex, color: 0xd4dada, transparent: true,
      opacity: 0, depthWrite: false, blending: THREE.NormalBlending
    });
    const sp = new THREE.Sprite(mat);
    const maxLife = 2.2 + Math.random() * 1.4;
    sp.scale.setScalar(0.8);
    scene.add(sp);
    const p = {
      sp, life: Math.random() * maxLife, max: maxLife,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.1 + Math.random() * 0.8, (Math.random() - 0.5) * 0.5),
      size: 0.75 + Math.random() * 0.6,
      anchor
    };
    anchor.getWorldPosition(sp.position);
    sp.position.x += (Math.random() - 0.5) * 0.9;
    sp.position.z += (Math.random() - 0.5) * 0.9;
    sp.position.y += Math.random() * 1.6;
    /* pre-age so the column is already established on frame 1 */
    sp.position.y += p.life * 1.4;
    smokePuffs.push(p);
  }
}

const tmpV = new THREE.Vector3();

function updateSmoke(dt) {
  for (const p of smokePuffs) {
    p.life += dt;
    if (p.life > p.max) {
      p.life = 0;
      p.max = 2.2 + Math.random() * 1.6;
      p.anchor.getWorldPosition(p.sp.position);
      p.sp.position.x += (Math.random() - 0.5) * 0.6;
      p.sp.position.z += (Math.random() - 0.5) * 0.6;
      p.vel.set((Math.random() - 0.5) * 0.5, 1.0 + Math.random() * 0.8, (Math.random() - 0.5) * 0.5);
      p.size = 0.75 + Math.random() * 0.6;
    }
    const t = p.life / p.max;
    p.sp.position.addScaledVector(p.vel, dt);
    p.vel.multiplyScalar(1 - dt * 0.6);
    p.sp.position.x += Math.sin(p.life * 1.7 + p.size * 10) * dt * 0.5;
    p.sp.scale.setScalar(p.size + t * 3.6);
    p.sp.material.opacity = Math.pow(1 - t, 1.5) * 0.78;
    p.sp.material.rotation += dt * 0.35;
  }
}

function initDust() {
  const N = 360;
  const pos = new Float32Array(N * 3);
  const spd = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 100;
    pos[i * 3 + 1] = Math.random() * 22;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    spd[i * 2] = 1.0 + Math.random() * 3.2;
    spd[i * 2 + 1] = 0.2 + Math.random() * 0.8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData.spd = spd;
  const mat = new THREE.PointsMaterial({
    size: 0.42, map: softTex, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
    color: 0xe8b48c, sizeAttenuation: true
  });
  dustPoints = new THREE.Points(geo, mat);
  dustPoints.frustumCulled = false;
  world.add(dustPoints);
}

function updateDust(dt) {
  const pos = dustPoints.geometry.attributes.position.array;
  const spd = dustPoints.geometry.userData.spd;
  for (let i = 0; i < pos.length / 3; i++) {
    pos[i * 3] += spd[i * 2] * dt;
    pos[i * 3 + 1] += spd[i * 2 + 1] * dt * 0.55;
    if (pos[i * 3] > 51) { pos[i * 3] = -51; pos[i * 3 + 2] = (Math.random() - 0.5) * 100; pos[i * 3 + 1] = Math.random() * 6; }
    if (pos[i * 3 + 1] > 26) pos[i * 3 + 1] = 0.4;
  }
  dustPoints.geometry.attributes.position.needsUpdate = true;
}

function initTumbleweed() {
  tumbleGroup = new THREE.Group();
  const tw = makeTumbleweed(1.45);
  tw.rotation.z = 0.2;
  tumbleGroup.add(tw);
  tumbleGroup.userData.tw = tw;
  tumbleGroup.position.set(-46, 1.4, 31);
  world.add(tumbleGroup);
}

function updateTumbleweed(dt, t) {
  tumbleGroup.position.x += dt * 5.2;
  if (tumbleGroup.position.x > 47) {
    tumbleGroup.position.x = -47;
    tumbleGroup.position.z = 27 + Math.random() * 8;
  }
  tumbleGroup.position.y = 1.3 + Math.abs(Math.sin(t * 2.4)) * 0.5;
  tumbleGroup.userData.tw.rotation.z -= dt * 4.4;
  tumbleGroup.userData.tw.rotation.x += dt * 0.7;
}

/* ============================================================
   16. BUILD ALL
   ============================================================ */
buildGround();
buildShell();
buildDiner();
buildGarage();
buildCanopy();
const carData = buildCar();
buildSign();
buildRoofProps();
buildProps();

initSmoke(carData.anchor);
initDust();
initTumbleweed();

/* ============================================================
   17. POST PROCESSING
   ============================================================ */
const HeatHazeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f = f*f*(3.0-2.0*f);
      float a = hash(i), b = hash(i+vec2(1.0,0.0));
      float c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
      return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
    }
    void main(){
      vec2 uv = vUv;
      float band = 1.0 - smoothstep(0.10, 0.72, vUv.y);
      float amp = 0.0024 * (0.30 + 0.70 * band);
      float n1 = noise(vec2(vUv.x * 26.0, vUv.y * 12.0 - time * 0.55));
      float n2 = noise(vec2(vUv.x * 58.0 + 13.0, vUv.y * 26.0 - time * 0.95));
      uv.x += (n1 - 0.5) * amp;
      uv.y += (n2 - 0.5) * amp * 0.85;
      vec3 col = texture2D(tDiffuse, uv).rgb;
      /* saturation + gentle contrast lift for the retro poster look */
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, 1.16);
      col = max(col, vec3(0.0));
      col = pow(col * 1.02, vec3(1.10));
      float vig = smoothstep(1.32, 0.28, length((vUv - 0.5) * vec2(1.12, 1.0)));
      col *= mix(0.74, 1.0, vig);
      gl_FragColor = vec4(col, 1.0);
    }`
};

let composer = null;
let hazePass = null;
let bloomPass = null;
const NO_POST = new URLSearchParams(location.search).has('nopost');
try {
  if (NO_POST) throw new Error('disabled');
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.24, 0.40, 1.0
  );
  composer.addPass(bloomPass);
  hazePass = new ShaderPass(HeatHazeShader);
  composer.addPass(hazePass);
  composer.addPass(new OutputPass());
} catch (e) {
  composer = null;
  console.warn('post-processing unavailable, falling back', e);
}

/* ============================================================
   18. LOOP
   ============================================================ */
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  /* neon flicker */
  for (const m of neonList) {
    const b = m.userData.base;
    const f = m.userData.flicker;
    let k = 1;
    if (f > 0) {
      const s = m.userData.seed;
      const slow = 0.86 + 0.14 * Math.sin(elapsed * 2.1 + s);
      const fast = Math.sin(elapsed * 37.0 + s * 3.1) > 0.86 ? 0.35 : 1.0;
      const burst = (Math.sin(elapsed * 0.7 + s) > 0.965) ? 0.25 : 1.0;
      k = slow * fast * burst;
    }
    m.color.setRGB(b.r * k, b.g * k, b.b * k);
  }

  /* jukebox chase lights */
  for (let i = 0; i < JUKE_BULBS.length; i++) {
    const p = (Math.sin(elapsed * 3.4 - i * 0.55) + 1) * 0.5;
    const c = 0.5 + p * 2.9;
    JUKE_BULBS[i].color.setRGB(c, c * 0.24, c * 0.42);
  }

  /* rotating roof props */
  for (let i = 0; i < SPINNERS.length; i++) {
    const s = SPINNERS[i];
    s.obj.rotation[s.axis] += dt * s.speed;
  }

  updateSmoke(dt);
  updateDust(dt);
  updateTumbleweed(dt, elapsed);

  if (hazePass) hazePass.uniforms.time.value = elapsed;

  controls.update();

  if (composer) composer.render();
  else renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

/* ============================================================
   19. RESIZE
   ============================================================ */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  const a = w / h;
  camera.aspect = a;
  camera.fov = a < 1.45 ? THREE.MathUtils.clamp(35 / a * 1.08, 35, 64) : 35;
  /* gentle vertical lens shift so the diorama sits centred rather than low */
  camera.setViewOffset(w, h, 0, Math.round(h * 0.115), w, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (composer) composer.setSize(w, h);
}
window.addEventListener('resize', onResize);
onResize();
