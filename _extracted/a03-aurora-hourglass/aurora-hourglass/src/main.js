
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;

/* ============================================================
   0. 渲染器 / 相机 / 控制器
   ============================================================ */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080619, 0.0075);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(14.0, 10.7, 20.7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.75;
controls.panSpeed = 0.6;
controls.minDistance = 11;
controls.maxDistance = 46;
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = Math.PI * 0.492;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.22;
controls.enablePan = false;
renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });
renderer.domElement.addEventListener('wheel', () => { controls.autoRotate = false; }, { once: true });

/* ============================================================
   1. 通用工具
   ============================================================ */
const clock = new THREE.Clock();
const updaters = [];
const onFrame = (fn) => updaters.push(fn);
const rand = (a, b) => a + Math.random() * (b - a);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 三渲二 渐变贴图 */
function makeGradient(steps = 4) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    data[i] = Math.round(255 * (0.30 + 0.70 * Math.pow(t, 0.85)));
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const GRAD = makeGradient(4);
const toon = (color, extra = {}) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD }, extra));

/* 轮廓线（反向外壳） */
const OUTLINE_COLOR = new THREE.Color(0x241a3f);
function outline(mesh, thickness = 0.018) {
  const g = mesh.geometry;
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: thickness }, uC: { value: OUTLINE_COLOR } },
    vertexShader: `
      uniform float uT;
      void main(){
        vec3 p = position + normalize(normal) * uT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.0); }`,
    side: THREE.BackSide
  });
  const o = new THREE.Mesh(g, m);
  o.position.copy(mesh.position);
  o.rotation.copy(mesh.rotation);
  o.scale.copy(mesh.scale);
  o.renderOrder = -1;
  return o;
}

/* ============================================================
   2. 材质
   ============================================================ */
const M = {
  brass: new THREE.MeshStandardMaterial({ color: 0xf3bd63, metalness: 0.94, roughness: 0.26, emissive: 0x6a3a06, emissiveIntensity: 0.55, envMapIntensity: 1.9 }),
  brassDark: new THREE.MeshStandardMaterial({ color: 0xb8843a, metalness: 0.95, roughness: 0.38, emissive: 0x40230a, emissiveIntensity: 0.55, envMapIntensity: 1.5 }),
  brassGlow: new THREE.MeshStandardMaterial({ color: 0xffd98a, metalness: 0.9, roughness: 0.25, emissive: 0xffb347, emissiveIntensity: 1.35, envMapIntensity: 1.4 }),
  jade: new THREE.MeshStandardMaterial({ color: 0xeef2ff, roughness: 0.24, metalness: 0.05, emissive: 0x232a4a, emissiveIntensity: 0.14, envMapIntensity: 1.0 }),
  jadeGlow: new THREE.MeshStandardMaterial({ color: 0xe6f6ff, roughness: 0.3, metalness: 0.0, emissive: 0x7fd8ff, emissiveIntensity: 0.75, envMapIntensity: 1.0 }),
  jadeDim: new THREE.MeshStandardMaterial({ color: 0xdcd6f2, roughness: 0.45, metalness: 0.02, emissive: 0x2a2a55, emissiveIntensity: 0.2 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6f7bb0, roughness: 0.85, metalness: 0.05, emissive: 0x141a3a, emissiveIntensity: 0.4 }),
  velvet: new THREE.MeshStandardMaterial({ color: 0x1b2560, roughness: 0.95, metalness: 0.0, emissive: 0x0a1038, emissiveIntensity: 0.7 }),
  warmGlow: new THREE.MeshStandardMaterial({ color: 0xffe9bf, emissive: 0xffc46b, emissiveIntensity: 1.35, roughness: 0.4 }),
  nebulaCore: new THREE.MeshBasicMaterial({ color: 0xbfe6ff }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2540, metalness: 0.85, roughness: 0.45 })
};

const glassMats = [];
function makeGlass(tint, edge, base = 0.055, alphaK = 0.48) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(tint) },
      uEdge: { value: new THREE.Color(edge) },
      uBase: { value: base },
      uAlphaK: { value: alphaK }
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vP = position;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uTint; uniform vec3 uEdge; uniform float uBase; uniform float uAlphaK;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);
        float f = pow(1.0 - abs(dot(N, V)), 4.6);
        float streak = 0.5 + 0.5 * sin(vP.y * 26.0 + vP.x * 3.0 + uTime * 0.5);
        vec3 col = mix(uTint, uEdge, f);
        col += vec3(0.9, 0.95, 1.0) * pow(streak, 8.0) * 0.06;
        float spec = pow(max(dot(reflect(-V, N), normalize(vec3(0.55, 0.9, 0.35))), 0.0), 46.0);
        col += vec3(1.0, 0.94, 0.82) * spec * 1.4;
        float a = uBase + f * uAlphaK + spec * 0.34;
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.96));
      }`,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  glassMats.push(m);
  return m;
}
const GLASS_COOL = makeGlass(0xa9dcff, 0xcff8ff, 0.014, 0.38);
const GLASS_WARM = makeGlass(0xd8ffe8, 0xdfffe8, 0.022, 0.34);
const GLASS_VIAL = makeGlass(0xcdeeff, 0xaee6ff, 0.06, 0.55);

/* ============================================================
   3. 环境光照 + 反射环境
   ============================================================ */
scene.add(new THREE.HemisphereLight(0x6f8cff, 0x1a1030, 0.50));
const key = new THREE.DirectionalLight(0xffe4c2, 1.25);
key.position.set(9, 14, 7);
scene.add(key);
const rimA = new THREE.DirectionalLight(0x6fe6ff, 0.80);
rimA.position.set(-11, 7, -8);
scene.add(rimA);
const rimB = new THREE.DirectionalLight(0xb47bff, 0.62);
rimB.position.set(6, 4, -12);
scene.add(rimB);
const innerWarm = new THREE.PointLight(0xffb861, 13.0, 8.5, 2);
innerWarm.position.set(0, 2.1, 0);
scene.add(innerWarm);
const innerCool = new THREE.PointLight(0x9fd8ff, 5.5, 7, 2);
innerCool.position.set(0, 5.1, 0);
scene.add(innerCool);
const greenLight = new THREE.PointLight(0xffd08a, 2.0, 5.5, 2);
greenLight.position.set(4.6, 1.6, 1.9);
scene.add(greenLight);

/* 等距柱状环境贴图（供金属反射） */
const envCanvas = canvasTex(1024, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.00, '#05030f');
  g.addColorStop(0.30, '#1b1040');
  g.addColorStop(0.46, '#40246b');
  g.addColorStop(0.56, '#7b4a7e');
  g.addColorStop(0.62, '#e2a55c');
  g.addColorStop(0.66, '#6a3f74');
  g.addColorStop(0.78, '#1a1440');
  g.addColorStop(1.00, '#04030c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const blobs = [
    [0.18, 0.60, 90, 'rgba(255,210,140,0.95)'],
    [0.62, 0.58, 120, 'rgba(120,230,255,0.55)'],
    [0.85, 0.52, 80, 'rgba(190,130,255,0.55)'],
    [0.42, 0.55, 60, 'rgba(255,245,220,0.85)']
  ];
  blobs.forEach(([x, y, r, c]) => {
    const rg = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r);
    rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  });
});
envCanvas.mapping = THREE.EquirectangularReflectionMapping;
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
scene.environment = pmrem.fromEquirectangular(envCanvas).texture;

/* ============================================================
   4. 星空穹顶
   ============================================================ */
function buildSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vDir;
      float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y);
        float b = mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y);
        return mix(a, b, f.z);
      }
      float fbm(vec3 p){
        float v = 0.0, a = 0.5;
        for(int i = 0; i < 5; i++){ v += a * n3(p); p *= 2.03; a *= 0.5; }
        return v;
      }
      void main(){
        vec3 d = normalize(vDir);
        float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(vec3(0.010, 0.008, 0.030), vec3(0.045, 0.030, 0.115), smoothstep(0.15, 0.95, t));

        float neb = fbm(d * 2.6 + vec3(0.0, uTime * 0.004, 0.0));
        float neb2 = fbm(d * 5.4 + 9.3);
        vec3 nebCol = mix(vec3(0.36, 0.12, 0.62), vec3(0.08, 0.52, 0.70), neb2);
        col += nebCol * pow(max(neb - 0.42, 0.0), 1.55) * 1.35;
        col += vec3(0.55, 0.28, 0.85) * pow(max(neb2 - 0.55, 0.0), 2.0) * 0.7;

        float bandPos = sin(d.x * 2.6 + d.z * 1.8 + uTime * 0.06);
        float curtainMask = smoothstep(-0.06, 0.20, d.y) * (1.0 - smoothstep(0.34, 0.70, d.y));
        float streak = 0.5 + 0.5 * sin(d.x * 26.0 + d.z * 16.0 + fbm(d * 2.6 + uTime * 0.02) * 14.0 + uTime * 0.16);
        float aur = curtainMask * smoothstep(0.34, 0.94, streak);
        vec3 aurCol = mix(vec3(0.10, 0.92, 0.68), vec3(0.52, 0.24, 0.95), 0.5 + 0.5 * bandPos);
        col += aurCol * aur * (0.62 + 0.35 * bandPos);
        col += vec3(0.10, 0.55, 0.55) * curtainMask * smoothstep(0.75, 1.0, streak) * 0.30;

        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(320, 48, 32), mat);
  scene.add(sky);
  onFrame((t) => { mat.uniforms.uTime.value = t; });
}
buildSky();

/* 星点 */
function buildStars() {
  const N = 2600;
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const tint = new Float32Array(N * 3);
  const palette = [[1, 1, 1], [0.72, 0.9, 1], [1, 0.9, 0.72], [0.85, 0.75, 1]];
  for (let i = 0; i < N; i++) {
    const r = 150 + Math.random() * 60;
    const th = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const ph = Math.random() * TAU;
    pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
    pos[i * 3 + 1] = r * Math.cos(th);
    pos[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph);
    size[i] = rand(0.6, 3.4);
    phase[i] = Math.random() * TAU;
    const c = palette[Math.floor(Math.random() * palette.length)];
    tint[i * 3] = c[0]; tint[i * 3 + 1] = c[1]; tint[i * 3 + 2] = c[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aTint;
      uniform float uTime; uniform float uPR;
      varying float vA; varying vec3 vC;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (240.0 / max(-mv.z, 1.0));
        vA = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase);
        vC = aTint;
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 2.2);
        gl_FragColor = vec4(vC * (0.9 + vA * 0.8), a * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  onFrame((t) => { m.uniforms.uTime.value = t; });
}
buildStars();

/* ============================================================
   5. 正方形双层底座
   ============================================================ */
const WORLD = new THREE.Group();
scene.add(WORLD);

function buildBase() {
  const g = new THREE.Group();
  WORLD.add(g);

  /* --- 侧面：幽蓝陨石层 + 金色星轨齿轮 --- */
  const sideTex = canvasTex(1024, 176, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#152255');
    grd.addColorStop(0.45, '#0a1035');
    grd.addColorStop(1, '#05081f');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      ctx.fillStyle = `rgba(190,225,255,${Math.random() * 0.55})`;
      ctx.fillRect(x, y, rand(1, 2.4), rand(1, 2.4));
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rand(10, 42));
      rg.addColorStop(0, 'rgba(120,180,255,0.30)');
      rg.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - 50, y - 50, 100, 100);
    }
    const gear = (cx, cy, R, teeth) => {
      ctx.save(); ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(228,181,92,0.9)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.70, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, TAU); ctx.stroke();
      for (let i = 0; i < teeth; i++) {
        const a = i / teeth * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.lineTo(Math.cos(a) * R * 1.14, Math.sin(a) * R * 1.14);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 0.24, Math.sin(a) * R * 0.24);
        ctx.lineTo(Math.cos(a) * R * 0.68, Math.sin(a) * R * 0.68);
        ctx.stroke();
      }
      ctx.restore();
    };
    gear(w * 0.10, h * 0.55, h * 0.33, 20);
    gear(w * 0.235, h * 0.5, h * 0.20, 14);
    gear(w * 0.44, h * 0.6, h * 0.28, 18);
    gear(w * 0.62, h * 0.45, h * 0.17, 12);
    gear(w * 0.78, h * 0.58, h * 0.31, 22);
    gear(w * 0.93, h * 0.5, h * 0.19, 14);
    ctx.strokeStyle = 'rgba(180,220,255,0.35)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const y0 = rand(10, h - 10);
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(w * 0.3, y0 - rand(10, 40), w * 0.6, y0 + rand(10, 40), w, y0);
      ctx.stroke();
    }
  });

  const matSide = new THREE.MeshStandardMaterial({
    map: sideTex, roughness: 0.5, metalness: 0.55,
    emissive: 0x14225c, emissiveIntensity: 1.15, envMapIntensity: 1.2
  });
  const matTop = new THREE.MeshStandardMaterial({ color: 0x070c22, roughness: 0.3, metalness: 0.7, emissive: 0x060c28, emissiveIntensity: 0.6 });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(15, 1.7, 15), [matSide, matSide, matTop, matTop, matSide, matSide]);
  slab.position.y = -1.03;
  g.add(slab);

  /* 底座下沿白玉薄板 */
  const under = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.34, 15.5), M.jadeDim);
  under.position.y = -2.05;
  g.add(under);
  const underTrim = new THREE.Mesh(new THREE.BoxGeometry(15.62, 0.06, 15.62), M.brass);
  underTrim.position.y = -1.88;
  g.add(underTrim);
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(15.1, 0.05, 15.1), M.brassDark);
  topTrim.position.y = -0.185;
  g.add(topTrim);

  /* --- 水面 --- */
  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x0a1748) },
      uAuroraA: { value: new THREE.Color(0x2fffd6) },
      uAuroraB: { value: new THREE.Color(0x9b5cff) },
      uGold: { value: new THREE.Color(0xffd489) }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep, uAuroraA, uAuroraB, uGold;
      varying vec3 vWorld;
      float h21(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      void main(){
        vec3 V = normalize(cameraPosition - vWorld);
        vec2 uv = vWorld.xz;

        float n1 = sin(uv.x * 1.7 + uTime * 0.55) * sin(uv.y * 2.1 - uTime * 0.42);
        float n2 = sin(uv.x * 3.3 - uTime * 0.80 + 1.7) * sin(uv.y * 2.9 + uTime * 0.62);
        vec3 N = normalize(vec3((n1 * 0.55 + n2 * 0.45) * 0.085, 1.0, (n2 * 0.55 - n1 * 0.45) * 0.085));

        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        vec3 R = reflect(-V, N);

        vec2 q = uv * 0.50 + R.xz * 1.3;
        float b1 = sin(q.x * 4.6 + q.y * 1.9 + uTime * 0.38 + sin(q.y * 2.8 + uTime * 0.26) * 2.2);
        float band1 = pow(smoothstep(0.42, 1.0, b1 * 0.5 + 0.5), 1.7);
        float b2 = sin(q.y * 5.4 - q.x * 1.7 - uTime * 0.30 + cos(q.x * 3.4 - uTime * 0.18) * 2.0);
        float band2 = pow(smoothstep(0.48, 1.0, b2 * 0.5 + 0.5), 1.6);

        vec2 sc = uv * 22.0;
        vec2 cellId = floor(sc);
        vec2 cellUv = fract(sc) - 0.5;
        float hs = h21(cellId);
        float tw = 0.55 + 0.45 * sin(uTime * 2.4 + hs * 60.0);
        float star = smoothstep(0.978, 1.0, hs) * tw * smoothstep(0.42, 0.02, length(cellUv));
        float starGlow = smoothstep(0.9955, 1.0, hs) * (0.6 + 0.4 * sin(uTime * 1.7 + hs * 30.0));

        vec3 col = uDeep * (0.30 + 0.22 * (n1 * 0.5 + 0.5));
        col += uAuroraA * band1 * (0.34 + fres * 0.26);
        col += uAuroraB * band2 * (0.28 + fres * 0.22);
        col += vec3(0.65, 0.35, 1.0) * pow(band2 * band1, 1.5) * 0.22;
        col += uGold * star * 3.4;
        col += uGold * starGlow * 0.9;
        col += uGold * pow(max(n1, 0.0), 8.0) * 0.22;
        float fine = sin(uv.x * 9.0 + uTime * 1.05) * sin(uv.y * 11.0 - uTime * 0.85);
        col += uGold * pow(max(fine, 0.0), 14.0) * 0.10;
        col += uAuroraA * pow(max(fine, 0.0), 20.0) * 0.14;
        float rr = length(uv);
        float ring = sin(rr * 6.0 - uTime * 0.9);
        col += (uAuroraA * 0.55 + uGold * 0.35) * pow(max(ring, 0.0), 26.0) * smoothstep(7.2, 2.2, rr) * 0.22;

        col = mix(col, vec3(0.09, 0.15, 0.42), fres * 0.55);
        col += uAuroraA * fres * 0.10;
        float alpha = 0.94;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 14.5, 1, 1), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.0;
  water.renderOrder = 3;
  g.add(water);
  onFrame((t) => { waterMat.uniforms.uTime.value = t; });

  /* 水面光晕 */
  const glowTex = canvasTex(256, 256, (ctx, w, h) => {
    const rg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,214,150,0.55)');
    rg.addColorStop(0.35, 'rgba(140,210,255,0.20)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.08 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.012;
  glow.renderOrder = 4;
  g.add(glow);

  const spillTex = canvasTex(256, 256, (ctx, w, h) => {
    const rg = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.5);
    rg.addColorStop(0, 'rgba(255,190,120,0)');
    rg.addColorStop(0.45, 'rgba(255,196,130,0.55)');
    rg.addColorStop(1, 'rgba(255,180,110,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  });
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(13.2, 13.2),
    new THREE.MeshBasicMaterial({ map: spillTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 })
  );
  spill.rotation.x = -Math.PI / 2;
  spill.position.y = 0.015;
  spill.renderOrder = 4;
  g.add(spill);

  /* --- 白玉围边 --- */
  const rimH = 0.46, rimT = 0.52, S = 15.55, inner = 7.25;
  const rimGeoLong = new THREE.BoxGeometry(S, rimH, rimT);
  const rimGeoShort = new THREE.BoxGeometry(rimT, rimH, S - rimT * 2);
  const mk = (geo, x, z) => {
    const m = new THREE.Mesh(geo, M.jade);
    m.position.set(x, rimH / 2 - 0.02, z);
    g.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(geo.parameters.width + 0.06, 0.035, geo.parameters.depth + 0.06), M.brassDark);
    cap.position.set(x, rimH - 0.02, z);
    g.add(cap);
  };
  mk(rimGeoLong, 0, inner);
  mk(rimGeoLong, 0, -inner);
  mk(rimGeoShort, inner, 0);
  mk(rimGeoShort, -inner, 0);

  /* --- 白玉星盘 --- */
  const chartTex = canvasTex(1024, 1024, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    bg.addColorStop(0, '#f2eeff');
    bg.addColorStop(0.42, '#cdc4f0');
    bg.addColorStop(0.78, '#7d6fc0');
    bg.addColorStop(1, '#4b3f8c');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, TAU); ctx.fill();

    ctx.strokeStyle = 'rgba(160,108,30,0.95)';
    for (let i = 0; i < 5; i++) {
      ctx.lineWidth = i === 0 ? 5 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, w * (0.14 + i * 0.085), 0, TAU); ctx.stroke();
    }
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(150,130,220,0.55)';
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * w * 0.14, cy + Math.sin(a) * w * 0.14);
      ctx.lineTo(cx + Math.cos(a) * w * 0.46, cy + Math.sin(a) * w * 0.46);
      ctx.stroke();
    }
    // 星座连线
    ctx.strokeStyle = 'rgba(150,98,26,0.95)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 7; k++) {
      const baseA = rand(0, TAU), baseR = rand(w * 0.18, w * 0.40);
      const n = 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = baseA + i * rand(0.16, 0.34);
        const r = baseR + rand(-w * 0.05, w * 0.05);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < n; i++) {
        const a = baseA + i * 0.22;
        const r = baseR;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.2, 0, TAU);
        ctx.fillStyle = 'rgba(240,196,110,0.95)';
        ctx.fill();
      }
    }
    for (let i = 0; i < 120; i++) {
      const a = rand(0, TAU), r = rand(w * 0.34, w * 0.48);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, rand(1.4, 3.4), 0, TAU);
      ctx.fillStyle = `rgba(255,226,168,${rand(0.5, 0.95)})`;
      ctx.fill();
    }
    for (let i = 0; i < 220; i++) {
      const a = rand(0, TAU), r = rand(0, w * 0.47);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, rand(0.8, 2.4), 0, TAU);
      ctx.fillStyle = `rgba(120,110,190,${rand(0.15, 0.5)})`;
      ctx.fill();
    }
  });
  const chartMat = new THREE.MeshStandardMaterial({ map: chartTex, roughness: 0.26, metalness: 0.12, emissive: 0x4a4488, emissiveIntensity: 0.35, envMapIntensity: 1.1 });
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.58, 0.62, 96), [M.jade, chartMat, M.jadeDim]);
  platform.position.y = 0.24;
  g.add(platform);

  const pSideBand = new THREE.Mesh(new THREE.CylinderGeometry(4.50, 4.56, 0.09, 96, 1, true), M.brass);
  pSideBand.position.y = 0.16;
  g.add(pSideBand);

  const pTrim = new THREE.Mesh(new THREE.TorusGeometry(4.42, 0.055, 8, 120), M.brass);
  pTrim.rotation.x = -Math.PI / 2;
  pTrim.position.y = 0.55;
  g.add(pTrim);

  const pGlowRing = new THREE.Mesh(
    new THREE.RingGeometry(3.2, 3.34, 96),
    new THREE.MeshBasicMaterial({ color: 0x7fe6ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  pGlowRing.rotation.x = -Math.PI / 2;
  pGlowRing.position.y = 0.557;
  g.add(pGlowRing);

  /* --- 白玉石阶 + 桥 --- */
  const stepN = 6;
  for (let i = 0; i < stepN; i++) {
    const z = 7.05 - i * 0.46;
    const y = 0.10 + i * 0.072;
    const st = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.5), M.jade);
    st.position.set(0, y, z);
    g.add(st);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.03, 0.52), M.jadeGlow);
    lip.position.set(0, y + 0.082, z);
    g.add(lip);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.9), M.jade);
  deck.position.set(0, 0.50, 4.62);
  g.add(deck);

  /* 桥栏 */
  const postGeo = new THREE.CylinderGeometry(0.034, 0.05, 0.52, 8);
  for (let i = 0; i < 4; i++) {
    const z = 6.9 - i * 0.72;
    const y = 0.22 + i * 0.055;
    [-1.24, 1.24].forEach((x) => {
      const p = new THREE.Mesh(postGeo, M.jade);
      p.position.set(x, y + 0.26, z);
      g.add(p);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.brassGlow);
      ball.position.set(x, y + 0.55, z);
      g.add(ball);
    });
  }
  [-1.28, 1.28].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.0), M.jade);
    rail.position.set(x, 0.86, 5.55);
    rail.rotation.x = -0.075;
    g.add(rail);
  });

  /* --- 环形白玉栏杆（后侧） --- */
  const balR = 4.28;
  for (let i = 0; i < 13; i++) {
    const a = THREE.MathUtils.degToRad(198 + i * 11.5);
    const x = Math.cos(a) * balR, z = Math.sin(a) * balR;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.58, 8), M.jade);
    post.position.set(x, 0.86, z);
    g.add(post);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), M.brassGlow);
    orb.position.set(x, 1.17, z);
    g.add(orb);
  }
  const railCurve = new THREE.CurvePath();
  const railPts = [];
  for (let i = 0; i <= 40; i++) {
    const a = THREE.MathUtils.degToRad(198 + i * (11.5 * 12 / 40));
    railPts.push(new THREE.Vector3(Math.cos(a) * balR, 1.06, Math.sin(a) * balR));
  }
  const railTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 90, 0.032, 6, false), M.jade);
  g.add(railTube);
  const railTube2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts.map(p => p.clone().setY(0.70))), 90, 0.022, 6, false), M.jade);
  g.add(railTube2);

  return g;
}
buildBase();

/* ============================================================
   6. 倒置沙漏水晶天文台
   ============================================================ */
const OBS = new THREE.Group();
OBS.position.y = 0.55;
WORLD.add(OBS);

/* 微型星云着色器（许愿瓶内） */
function nebulaMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aCol;
      varying vec3 vP; varying vec3 vC;
      void main(){
        vP = position;
        vC = aCol;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vP; varying vec3 vC;
      void main(){
        vec3 p = normalize(vP);
        float n = sin(p.x * 7.0 + uTime * 1.3) * sin(p.y * 6.0 - uTime * 0.95) * sin(p.z * 8.0 + uTime * 0.65);
        float n2 = sin(p.y * 12.0 + uTime * 1.7) * 0.5 + 0.5;
        vec3 c = vC * (1.05 + 0.85 * n) + vec3(1.0, 0.97, 0.9) * pow(n2, 3.0) * 0.55;
        gl_FragColor = vec4(c * 2.4, 1.0);
      }`
  });
}

/* 塔罗牌贴图 */
function tarotTex(kind) {
  return canvasTex(256, 400, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(86,74,178,0.98)');
    bg.addColorStop(1, 'rgba(44,34,120,0.98)');
    ctx.fillStyle = bg;
    rr(ctx, 5, 5, w - 10, h - 10, 20); ctx.fill();
    ctx.strokeStyle = '#e6c179'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = 'rgba(150,220,255,0.85)'; ctx.lineWidth = 1.8;
    rr(ctx, 20, 20, w - 40, h - 40, 14); ctx.stroke();
    ctx.save();
    ctx.translate(w / 2, h / 2 - 8);
    ctx.strokeStyle = '#ffe9b8';
    ctx.fillStyle = 'rgba(255,232,180,1)';
    ctx.lineWidth = 4.5;
    ctx.shadowColor = 'rgba(255,214,140,0.9)';
    ctx.shadowBlur = 14;
    if (kind === 0) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 62 : 25;
        const a = i / 10 * TAU - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    } else if (kind === 1) {
      ctx.beginPath(); ctx.arc(0, 0, 58, 0.5, Math.PI * 2 - 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(20, -12, 50, 0.6, Math.PI * 2 - 0.6); ctx.stroke();
    } else if (kind === 2) {
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 42, Math.sin(a) * 42);
        ctx.lineTo(Math.cos(a) * 62, Math.sin(a) * 62);
        ctx.stroke();
      }
    } else if (kind === 3) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 62, 34, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
    } else if (kind === 4) {
      ctx.beginPath();
      ctx.moveTo(0, -62); ctx.lineTo(0, 50);
      ctx.moveTo(-30, 30); ctx.lineTo(0, 62); ctx.lineTo(30, 30);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -62, 13, 0, TAU); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-42, -50); ctx.lineTo(42, -50);
      ctx.moveTo(-42, 50); ctx.lineTo(42, 50);
      ctx.moveTo(-26, -50); ctx.bezierCurveTo(-40, -10, -10, 10, -16, 40);
      ctx.moveTo(26, -50); ctx.bezierCurveTo(40, -10, 10, 10, 16, 40);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(200,230,255,0.75)';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(rand(30, w - 30), rand(30, h - 30), rand(0.8, 2.0), 0, TAU);
      ctx.fill();
    }
  });
}

/* 羽毛贴图 */
const featherTex = canvasTex(128, 512, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.translate(w / 2, 0);
  ctx.strokeStyle = 'rgba(255,236,200,0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(10, h * 0.5, -6, h - 8); ctx.stroke();
  for (let i = 0; i < 46; i++) {
    const t = i / 46;
    const y = 20 + t * (h - 60);
    const len = Math.sin(t * Math.PI) * 52 + 4;
    ctx.strokeStyle = `rgba(${255 - t * 30},${226 - t * 40},${180 + t * 40},${0.55 + 0.4 * Math.sin(t * Math.PI)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(-len * 0.6, y + 14, -len, y + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(len * 0.6, y + 14, len, y + 26);
    ctx.stroke();
  }
});

function buildObservatory() {
  const g = OBS;

  /* ---------- 玻璃外壳 ---------- */
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 3.05, 3.3, 72, 1, true), GLASS_COOL);
  lower.position.y = 1.65;
  lower.renderOrder = 6;
  g.add(lower);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 1.86, 2.8, 72, 1, true), GLASS_COOL);
  upper.position.y = 4.7;
  upper.renderOrder = 6;
  g.add(upper);

  const domeGeo = new THREE.SphereGeometry(3.05, 64, 28, 0, TAU, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, GLASS_COOL);
  dome.position.y = 6.1;
  dome.scale.y = 0.50;
  dome.renderOrder = 6;
  g.add(dome);

  /* ---------- 黄铜骨架 ---------- */
  const ribGeos = [];
  const prof = [[3.05, 0.0], [2.72, 0.9], [2.28, 1.9], [1.94, 2.9], [1.86, 3.3], [2.02, 3.95], [2.48, 4.75], [2.92, 5.55], [3.05, 6.1]];
  for (let i = 0; i < 16; i++) {
    const ang = i / 16 * TAU;
    const pts = prof.map(([r, y]) => new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r));
    for (let k = 1; k <= 8; k++) {
      const a = (k / 8) * (Math.PI / 2);
      const r = 3.05 * Math.cos(a);
      pts.push(new THREE.Vector3(Math.cos(ang) * r, 6.1 + 3.05 * 0.50 * Math.sin(a), Math.sin(ang) * r));
    }
    ribGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.030, 5, false));
  }
  const ribs = new THREE.Mesh(BGU.mergeGeometries(ribGeos), M.brass);
  g.add(ribs);

  /* 水平星环 */
  const ringDef = [[0.05, 3.06, 0.075], [1.05, 2.60, 0.05], [2.10, 2.16, 0.045], [3.30, 1.93, 0.105], [4.25, 2.34, 0.05], [5.25, 2.82, 0.055], [6.10, 3.07, 0.085]];
  ringDef.forEach(([y, r, tube]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 96), M.brass);
    t.rotation.x = -Math.PI / 2;
    t.position.y = y;
    g.add(t);
  });

  /* 腰环装饰 */
  const waistDeco = new THREE.Mesh(new THREE.TorusGeometry(1.99, 0.055, 6, 72), M.brassGlow);
  waistDeco.rotation.x = -Math.PI / 2;
  waistDeco.position.y = 3.30;
  g.add(waistDeco);

  /* 基座环 */
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(3.12, 3.22, 0.14, 96), M.brass);
  baseRing.position.y = 0.07;
  g.add(baseRing);

  /* 穹顶顶饰 */
  const finial = new THREE.Group();
  finial.position.y = 7.38;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), M.brassGlow);
  finial.add(ball);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.6, 8), M.brass);
  spike.position.y = 0.34;
  finial.add(spike);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 5, 24, Math.PI * 0.8), M.brass);
    arm.rotation.set(Math.PI / 2, 0, a);
    arm.position.y = 0.12;
    finial.add(arm);
  }
  const topCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0xd9c4ff, emissive: 0x9a6bff, emissiveIntensity: 1.35, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 }));
  topCrystal.position.y = 1.0;
  finial.add(topCrystal);
  g.add(finial);
  onFrame((t) => {
    topCrystal.rotation.y = t * 0.6;
    topCrystal.rotation.x = Math.sin(t * 0.5) * 0.3;
    topCrystal.position.y = 1.0 + Math.sin(t * 1.1) * 0.06;
  });

  /* ---------- 一层地面 ---------- */
  const floorTex = canvasTex(512, 512, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    rg.addColorStop(0, '#1a2a6e');
    rg.addColorStop(0.7, '#0e1440');
    rg.addColorStop(1, '#070a24');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(226,180,92,0.85)';
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = i === 0 ? 4 : 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, w * (0.16 + i * 0.11), 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(150,200,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * w * 0.16, cy + Math.sin(a) * w * 0.16);
      ctx.lineTo(cx + Math.cos(a) * w * 0.47, cy + Math.sin(a) * w * 0.47);
      ctx.stroke();
    }
    for (let i = 0; i < 80; i++) {
      const a = rand(0, TAU), r = rand(w * 0.05, w * 0.46);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, rand(1, 2.6), 0, TAU);
      ctx.fillStyle = 'rgba(255,214,140,0.75)';
      ctx.fill();
    }
  });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.35, emissive: 0x4a3a70, emissiveIntensity: 1.0, envMapIntensity: 1.2 });
  const floor1 = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 0.14, 72), [M.brassDark, floorMat, M.brassDark]);
  floor1.position.y = 0.08;
  g.add(floor1);

  const warmRing = new THREE.Mesh(
    new THREE.RingGeometry(1.98, 2.28, 72),
    new THREE.MeshBasicMaterial({ color: 0xffa860, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  warmRing.rotation.x = -Math.PI / 2;
  warmRing.position.y = 0.16;
  g.add(warmRing);

  /* ---------- 二层楼板 ---------- */
  const floor2 = new THREE.Mesh(new THREE.CylinderGeometry(2.52, 2.40, 0.10, 72), [M.jadeDim, M.darkMetal, M.brassDark]);
  floor2.position.y = 3.92;
  g.add(floor2);
  const f2ring = new THREE.Mesh(new THREE.TorusGeometry(2.53, 0.04, 6, 96), M.brass);
  f2ring.rotation.x = -Math.PI / 2;
  f2ring.position.y = 4.0;
  g.add(f2ring);
  const f2light = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.16, 64),
    new THREE.MeshBasicMaterial({ color: 0xffd79a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  f2light.rotation.x = -Math.PI / 2;
  f2light.position.y = 4.005;
  g.add(f2light);

  /* ---------- 中央巨型沙漏核心 ---------- */
  const core = new THREE.Group();
  core.position.y = 0.15;
  g.add(core);

  const profile = [
    [0.02, 0.02], [0.42, 0.10], [0.55, 0.42], [0.52, 0.80], [0.34, 1.18],
    [0.12, 1.48], [0.10, 1.58], [0.12, 1.68], [0.34, 1.98], [0.52, 2.36],
    [0.55, 2.74], [0.42, 3.02], [0.02, 3.10]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), makeGlass(0xbfeaff, 0xa8f0ff, 0.07));
  bulb.renderOrder = 5;
  core.add(bulb);

  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.10, 32), M.brass);
  capTop.position.y = 3.14;
  core.add(capTop);
  const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.10, 32), M.brass);
  capBot.position.y = 0.0;
  core.add(capBot);

  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 8), M.brass);
    post.position.set(Math.cos(a) * 0.72, 1.57, Math.sin(a) * 0.72);
    core.add(post);
  }
  [0.12, 3.04].forEach((y) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 32), M.brass);
    r.rotation.x = -Math.PI / 2;
    r.position.y = y;
    core.add(r);
  });

  /* 星沙 */
  const SN = 320;
  const sPos = new Float32Array(SN * 3);
  const sSeed = new Float32Array(SN);
  for (let i = 0; i < SN; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * 0.38;
    sPos[i * 3] = Math.cos(a) * r;
    sPos[i * 3 + 1] = rand(0.1, 3.05);
    sPos[i * 3 + 2] = Math.sin(a) * r;
    sSeed[i] = rand(0.3, 1.0);
  }
  const sandGeo = new THREE.BufferGeometry();
  sandGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const sparkTex = canvasTex(64, 64, (ctx, w, h) => {
    const rg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,255,240,1)');
    rg.addColorStop(0.35, 'rgba(255,214,140,0.9)');
    rg.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  });
  const sandMat = new THREE.PointsMaterial({
    size: 0.20, map: sparkTex, color: 0xffe2a0, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const sand = new THREE.Points(sandGeo, sandMat);
  sand.renderOrder = 8;
  core.add(sand);

  const sandLight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3.0, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc978, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  sandLight.position.y = 1.55;
  core.add(sandLight);

  onFrame((t, dt) => {
    const arr = sandGeo.attributes.position.array;
    for (let i = 0; i < SN; i++) {
      const iy = i * 3 + 1;
      arr[iy] += dt * (0.16 + sSeed[i] * 0.30);
      if (arr[iy] > 3.06) arr[iy] = 0.08;
      const ang = t * 0.5 + i;
      arr[i * 3] = Math.cos(ang) * (0.10 + (arr[iy] % 1.0) * 0.22);
      arr[i * 3 + 2] = Math.sin(ang) * (0.10 + (arr[iy] % 1.0) * 0.22);
    }
    sandGeo.attributes.position.needsUpdate = true;
    sandMat.opacity = 0.75 + Math.sin(t * 2.0) * 0.15;
  });

  /* 室内体积光 */
  const upperGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide })
  );
  upperGlow.position.y = 5.0;
  upperGlow.renderOrder = 6;
  g.add(upperGlow);

  /* ---------- 弧形许愿瓶高架 ---------- */
  const bottlePalette = [0xff7bd0, 0x7be8ff, 0xffd27a, 0xb98cff, 0x7bffc4, 0xff9b6b];
  const arcs = [
    { a0: 0.55, len: 1.05 },
    { a0: 0.55 + Math.PI, len: 1.05 }
  ];
  const shelfLevels = [0.80, 1.36, 1.92];
  const bottleGeos = [];
  const nebGeos = [];

  shelfLevels.forEach((y, li) => {
    arcs.forEach((arc) => {
      const shelf = new THREE.Mesh(
        new THREE.RingGeometry(1.72, 2.14, 36, 1, arc.a0, arc.len),
        M.brass
      );
      shelf.rotation.x = -Math.PI / 2;
      shelf.position.y = y;
      g.add(shelf);

      const under = new THREE.Mesh(
        new THREE.RingGeometry(1.74, 2.12, 36, 1, arc.a0, arc.len),
        new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
      );
      under.rotation.x = -Math.PI / 2;
      under.position.y = y - 0.012;
      under.renderOrder = 6;
      g.add(under);

      const lip = new THREE.Mesh(
        new THREE.RingGeometry(2.10, 2.15, 36, 1, arc.a0, arc.len),
        M.brassGlow
      );
      lip.rotation.x = -Math.PI / 2;
      lip.position.y = y + 0.012;
      g.add(lip);

      for (let k = 0; k < 5; k++) {
        const a = arc.a0 + (k + 0.5) / 5 * arc.len;
        const bx = Math.cos(a) * 1.94, bz = -Math.sin(a) * 1.94;
        const col = bottlePalette[(li * 5 + k) % bottlePalette.length];

        const body = new THREE.CylinderGeometry(0.078, 0.086, 0.23, 12, 1, true);
        body.translate(bx, y + 0.13, bz);
        bottleGeos.push(body);
        const neck = new THREE.CylinderGeometry(0.032, 0.05, 0.06, 10, 1, true);
        neck.translate(bx, y + 0.26, bz);
        bottleGeos.push(neck);
        const cork = new THREE.CylinderGeometry(0.036, 0.036, 0.03, 8);
        cork.translate(bx, y + 0.30, bz);
        bottleGeos.push(cork);

        const neb = new THREE.SphereGeometry(0.072, 14, 10);
        neb.translate(bx, y + 0.13, bz);
        const cnt = neb.attributes.position.count;
        const arr = new Float32Array(cnt * 3);
        const c = new THREE.Color(col);
        for (let i = 0; i < cnt; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
        neb.setAttribute('aCol', new THREE.BufferAttribute(arr, 3));
        nebGeos.push(neb);
      }
    });
  });

  const fairyGeos = [];
  shelfLevels.forEach((y) => {
    arcs.forEach((arc) => {
      for (let k = 0; k < 7; k++) {
        const a = arc.a0 + (k / 6) * arc.len;
        const sp2 = new THREE.SphereGeometry(0.032, 8, 6);
        sp2.translate(Math.cos(a) * 2.13, y + 0.05, -Math.sin(a) * 2.13);
        fairyGeos.push(sp2);
      }
    });
  });
  const fairy = new THREE.Mesh(BGU.mergeGeometries(fairyGeos), new THREE.MeshBasicMaterial({ color: 0xffd08a, toneMapped: false }));
  g.add(fairy);

  const bottles = new THREE.Mesh(BGU.mergeGeometries(bottleGeos), GLASS_VIAL);
  bottles.renderOrder = 5;
  g.add(bottles);
  const nebs = new THREE.Mesh(BGU.mergeGeometries(nebGeos), nebulaMat());
  nebs.renderOrder = 7;
  g.add(nebs);
  onFrame((t) => { nebs.material.uniforms.uTime.value = t; });

  /* 悬浮塔罗牌 */
  const cards = [];
  for (let i = 0; i < 6; i++) {
    const tex = tarotTex(i);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.375), mat);
    const a = i / 6 * TAU + 0.4;
    card.renderOrder = 7;
    card.userData = { a, r: rand(1.0, 1.35), y: rand(1.35, 2.65), sp: rand(0.15, 0.35), ph: rand(0, TAU) };
    g.add(card);
    cards.push(card);
  }
  onFrame((t) => {
    cards.forEach((c) => {
      const u = c.userData;
      const a = u.a + t * u.sp * 0.35;
      c.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.8 + u.ph) * 0.09, Math.sin(a) * u.r);
      c.rotation.y = -a + Math.PI / 2 + Math.sin(t * 0.6 + u.ph) * 0.3;
      c.rotation.z = Math.sin(t * 0.5 + u.ph) * 0.15;
    });
  });

  /* 悬浮羽毛笔账本 */
  const ledger = new THREE.Group();
  ledger.position.set(0.95, 1.75, 0.55);
  const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.26), new THREE.MeshStandardMaterial({ color: 0x3a2060, roughness: 0.6, metalness: 0.2, emissive: 0x2a1050, emissiveIntensity: 0.6 }));
  ledger.add(bookCover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffcf8a, emissiveIntensity: 1.1, roughness: 0.8 }));
  pages.position.y = 0.03;
  ledger.add(pages);
  const quill = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.75), new THREE.MeshBasicMaterial({ map: featherTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  quill.position.set(0.1, 0.42, 0);
  quill.rotation.z = -0.35;
  ledger.add(quill);
  g.add(ledger);
  onFrame((t) => {
    ledger.position.y = 1.75 + Math.sin(t * 0.9) * 0.05;
    ledger.rotation.y = Math.sin(t * 0.4) * 0.35;
    quill.rotation.z = -0.35 + Math.sin(t * 1.3) * 0.08;
  });

  /* ---------- 二层：全息星图桌 ---------- */
  const tableG = new THREE.Group();
  tableG.position.set(0, 3.99, 0);
  const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.12, 32), M.brass);
  tBase.position.y = 0.06;
  tableG.add(tBase);
  const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 16), M.brassDark);
  tStem.position.y = 0.3;
  tableG.add(tStem);
  const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.78, 0.07, 48), M.brass);
  tTop.position.y = 0.55;
  tableG.add(tTop);
  const tGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.02, 48), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.75 }));
  tGlass.position.y = 0.59;
  tableG.add(tGlass);

  const holo = new THREE.Group();
  holo.position.y = 1.28;
  const holoCore = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0c8 }));
  holo.add(holoCore);
  const holoSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshBasicMaterial({ color: 0x7fe0ff, wireframe: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  holo.add(holoSphere);
  const holoRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.006, 4, 64), new THREE.MeshBasicMaterial({ color: 0xbfa4ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  holoRing1.rotation.x = Math.PI / 2.4;
  holo.add(holoRing1);
  const holoRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.005, 4, 64), new THREE.MeshBasicMaterial({ color: 0x8affd8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  holoRing2.rotation.set(Math.PI / 3, 0.6, 0);
  holo.add(holoRing2);

  const holoPts = [];
  for (let i = 0; i < 140; i++) {
    const th = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const ph = Math.random() * TAU;
    const r = 0.44;
    holoPts.push(new THREE.Vector3(Math.sin(th) * Math.cos(ph) * r, Math.cos(th) * r * 0.7, Math.sin(th) * Math.sin(ph) * r));
  }
  const holoGeo = new THREE.BufferGeometry().setFromPoints(holoPts);
  const holoStars = new THREE.Points(holoGeo, new THREE.PointsMaterial({ color: 0xdff6ff, size: 0.032, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  holo.add(holoStars);

  /* 立体全息银河 */
  const galN = 1400;
  const gp = new Float32Array(galN * 3);
  const gc = new Float32Array(galN * 3);
  const armCols = [[0.72, 0.86, 1.0], [1.0, 0.72, 0.94], [1.0, 0.88, 0.62]];
  for (let i = 0; i < galN; i++) {
    const arm = i % 3;
    const t = Math.pow(Math.random(), 0.55);
    const r = 0.14 + t * 1.12;
    const a = arm * TAU / 3 + t * 3.8 + rand(-0.24, 0.24);
    gp[i * 3] = Math.cos(a) * r;
    gp[i * 3 + 1] = rand(-0.05, 0.05) * (1.25 - t) + Math.sin(a * 3.0) * 0.02;
    gp[i * 3 + 2] = Math.sin(a) * r;
    const c = armCols[arm];
    const k = 0.5 + Math.random() * 0.75;
    gc[i * 3] = c[0] * k; gc[i * 3 + 1] = c[1] * k; gc[i * 3 + 2] = c[2] * k;
  }
  const galGeo = new THREE.BufferGeometry();
  galGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  galGeo.setAttribute('color', new THREE.BufferAttribute(gc, 3));
  const galaxy = new THREE.Points(galGeo, new THREE.PointsMaterial({
    size: 0.024, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  galaxy.position.set(0, 1.36, 0);
  galaxy.rotation.x = 0.62;
  galaxy.rotation.z = 0.18;
  holo.add(galaxy);

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.72, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 0.86;
  beam.rotation.x = Math.PI;
  tableG.add(beam);
  tableG.add(holo);
  g.add(tableG);
  onFrame((t) => {
    holo.rotation.y = t * 0.35;
    holoSphere.rotation.y = -t * 0.2;
    holoSphere.rotation.x = t * 0.12;
    holoRing1.rotation.z = t * 0.4;
    holoRing2.rotation.y = t * 0.5;
    holo.position.y = 1.28 + Math.sin(t * 0.8) * 0.04;
  });

  /* ---------- 二层：紫水晶望远镜 ---------- */
  const scope = new THREE.Group();
  scope.position.set(-1.25, 4.0, 0.25);
  scope.scale.setScalar(1.18);
  scope.rotation.y = -0.5;

  const tripod = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.85, 8), M.brass);
    leg.position.set(Math.cos(a) * 0.16, 0.42, Math.sin(a) * 0.16);
    leg.rotation.z = Math.cos(a) * 0.22;
    leg.rotation.x = -Math.sin(a) * 0.22;
    tripod.add(leg);
  }
  scope.add(tripod);

  const mount = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), M.brass);
  mount.position.y = 0.85;
  scope.add(mount);

  const barrel = new THREE.Group();
  barrel.position.y = 0.9;
  barrel.rotation.z = -0.62;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 1.5, 24, 1, true), M.brass);
  tube.position.y = 0.7;
  barrel.add(tube);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 1.46, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1440, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }));
  inner.position.y = 0.7;
  barrel.add(inner);
  [0.05, 0.55, 1.35].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 6, 32), M.brassGlow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    barrel.add(ring);
  });
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.165, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: 0xb98cff, emissive: 0x8a4dff, emissiveIntensity: 1.0, metalness: 0.4, roughness: 0.08, transparent: true, opacity: 0.92 })
  );
  lens.position.y = 1.45;
  barrel.add(lens);
  const lensGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.15, 32),
    new THREE.MeshBasicMaterial({ color: 0xd6b8ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  lensGlow.rotation.x = -Math.PI / 2;
  lensGlow.position.y = 1.48;
  barrel.add(lensGlow);
  scope.add(barrel);
  g.add(scope);
  onFrame((t) => {
    barrel.rotation.z = -0.62 + Math.sin(t * 0.3) * 0.05;
    scope.rotation.y = -0.5 + Math.sin(t * 0.22) * 0.12;
  });

  /* ---------- 二层：月亮躺椅 ---------- */
  const moonShape = (() => {
    const R = 0.62, r = 0.54, d = 0.19;
    const y = (R * R - r * r + d * d) / (2 * d);
    const x = Math.sqrt(Math.max(0.0001, R * R - y * y));
    const a0 = Math.atan2(y, x), a1 = Math.PI - a0;
    const pts = [];
    const seg = 40;
    const sweepA = -(TAU - (a1 - a0));
    for (let i = 0; i <= seg; i++) {
      const a = a0 + sweepA * (i / seg);
      pts.push(new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R));
    }
    const b0 = Math.atan2(y - d, x), b1 = Math.atan2(y - d, -x);
    const sweepB = (TAU - (b1 - b0));
    for (let i = 0; i <= seg; i++) {
      const a = b1 + sweepB * (i / seg);
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r + d));
    }
    return new THREE.Shape(pts);
  })();

  const chair = new THREE.Group();
  chair.position.set(1.2, 3.99, -0.95);
  chair.scale.setScalar(1.18);
  chair.rotation.y = 2.3;
  const chairGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 0.34, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 24 });
  chairGeo.center();
  const chairMesh = new THREE.Mesh(chairGeo, toon(0x2b3a86));
  chairMesh.rotation.x = -Math.PI / 2;
  chairMesh.position.y = 0.2;
  chair.add(chairMesh);

  const cushionGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 24 });
  cushionGeo.scale(0.86, 0.86, 1);
  cushionGeo.center();
  const cushion = new THREE.Mesh(cushionGeo, new THREE.MeshStandardMaterial({ color: 0x1a2560, roughness: 0.95, metalness: 0.0, emissive: 0x1a2a6a, emissiveIntensity: 0.5 }));
  cushion.rotation.x = -Math.PI / 2;
  cushion.position.y = 0.38;
  chair.add(cushion);
  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb35c, emissiveIntensity: 0.55, roughness: 0.9 }));
  pillow.scale.set(1.3, 0.55, 0.9);
  pillow.position.set(0.3, 0.47, 0.02);
  chair.add(pillow);
  g.add(chair);

  /* ---------- 穹顶垂挂星灯 ---------- */
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + 0.4;
    const rr2 = 1.05 + (i % 3) * 0.32;
    const hx = Math.cos(a) * rr2, hz = Math.sin(a) * rr2;
    const hy = 5.55 + (i % 2) * 0.35;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 6.35 - hy, 3), new THREE.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: 0.30 }));
    cord.position.set(hx, (6.35 + hy) / 2, hz);
    g.add(cord);
    const lampStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075, 0),
      new THREE.MeshStandardMaterial({ color: 0xfff0cc, emissive: 0xffc06a, emissiveIntensity: 1.6, roughness: 0.25, transparent: true, opacity: 0.92 })
    );
    lampStar.position.set(hx, hy, hz);
    lampStar.scale.y = 1.5;
    g.add(lampStar);
  }

  /* ---------- 穹顶吊饰小星轨仪 ---------- */
  const orrery = new THREE.Group();
  orrery.position.set(0, 6.05, 0);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
  orrery.add(sun);
  for (let i = 0; i < 3; i++) {
    const rr2 = 0.34 + i * 0.2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr2, 0.008, 4, 64), M.brass);
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.45;
    ring.rotation.y = i * 0.7;
    orrery.add(ring);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045 + i * 0.012, 12, 10), new THREE.MeshStandardMaterial({ color: [0x9fe8ff, 0xffb0e0, 0xc4a6ff][i], emissive: [0x4fd8ff, 0xff6bb0, 0x8a5cff][i], emissiveIntensity: 1.4, roughness: 0.4 }));
    p.position.set(Math.cos(i * 2.1) * rr2, 0, Math.sin(i * 2.1) * rr2);
    orrery.add(p);
  }
  const hang = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 4), M.brassDark);
  hang.position.y = 0.55;
  orrery.add(hang);
  g.add(orrery);
  onFrame((t) => {
    orrery.rotation.y = t * 0.25;
    orrery.children.forEach((c, i) => {
      if (c.geometry && c.geometry.type === 'SphereGeometry' && i > 0) {
        const a = t * (0.4 + i * 0.15) + i * 2.1;
        const rr2 = 0.34 + (i - 1) * 0.2;
        c.position.set(Math.cos(a) * rr2, Math.sin(a * 0.6) * 0.08, Math.sin(a) * rr2);
      }
    });
  });

  return g;
}
buildObservatory();

/* ============================================================
   7. 星座连线玻璃捕星花房
   ============================================================ */
const GREEN = new THREE.Group();
GREEN.position.set(4.62, 0.55, 1.9);
WORLD.add(GREEN);

function buildGreenhouse() {
  /* 支撑平台 */
  const lobe = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 2.04, 0.56, 64), [M.jade, M.jadeDim, M.jadeDim]);
  lobe.position.set(4.62, 0.27, 1.9);
  WORLD.add(lobe);
  const lobeTrim = new THREE.Mesh(new THREE.TorusGeometry(1.94, 0.045, 6, 72), M.brass);
  lobeTrim.rotation.x = -Math.PI / 2;
  lobeTrim.position.set(4.62, 0.55, 1.9);
  WORLD.add(lobeTrim);

  const g = GREEN;

  /* 穹顶玻璃 */
  const domeR = 1.68;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(domeR, 48, 26, 0, TAU, 0, Math.PI / 2), GLASS_WARM);
  dome.scale.y = 0.86;
  dome.renderOrder = 6;
  g.add(dome);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(domeR, domeR, 0.42, 48, 1, true), GLASS_WARM);
  skirt.position.y = 0.21;
  skirt.renderOrder = 6;
  g.add(skirt);

  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(domeR + 0.06, domeR + 0.1, 0.1, 48), M.brass);
  baseRing.position.y = 0.05;
  g.add(baseRing);

  /* 黄铜肋 */
  const ribs = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const th = (k / 10) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        Math.cos(a) * Math.cos(th) * domeR,
        Math.sin(th) * domeR * 0.86,
        Math.sin(a) * Math.cos(th) * domeR
      ));
    }
    ribs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.022, 5, false));
  }
  [0.42, 0.68].forEach((y) => {
    const rr2 = Math.sqrt(Math.max(0, domeR * domeR - (y / 0.86) * (y / 0.86)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr2, 0.022, 6, 64), M.brass);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = y;
    ribs.push(ring.geometry.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).applyMatrix4(new THREE.Matrix4().makeTranslation(0, y, 0)));
  });
  const ribMesh = new THREE.Mesh(BGU.mergeGeometries(ribs), M.brass);
  g.add(ribMesh);

  /* 星座连线造型 */
  const nodes = [
    [0.9, 2.05, 0.4], [1.6, 1.78, -0.35], [0.2, 2.35, -0.75],
    [-0.85, 2.1, 0.15], [-0.4, 2.55, 0.9], [0.6, 2.6, -1.05]
  ];
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0xd9c8ff, emissive: 0x9a7bff, emissiveIntensity: 1.5, roughness: 0.2 });
  nodes.forEach(([x, y, z]) => {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), nodeMat);
    s.position.set(x, y, z);
    g.add(s);
  });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xa9e8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const linkIdx = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4]];
  const lineGeo = new THREE.BufferGeometry();
  const lp = [];
  linkIdx.forEach(([a, b]) => {
    lp.push(new THREE.Vector3(...nodes[a]), new THREE.Vector3(...nodes[b]));
  });
  lineGeo.setFromPoints(lp);
  const links = new THREE.LineSegments(lineGeo, lineMat);
  g.add(links);

  /* 玻璃走廊 */
  const corridor = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.0, 24, 1, true), GLASS_WARM);
  corridor.rotation.z = Math.PI / 2;
  corridor.position.set(-1.2, 0.6, 0);
  corridor.rotation.y = 0.0;
  g.add(corridor);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.025, 6, 24), M.brass);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-1.7 + i * 0.5, 0.6, 0);
    g.add(ring);
  }

  /* 太阳花 */
  const flowerCols = [0xffd27a, 0xffb35c, 0xffe8b0, 0xffc46b];
  for (let i = 0; i < 9; i++) {
    const a = rand(0, TAU), r = rand(0.25, 1.28);
    const fx = Math.cos(a) * r, fz = Math.sin(a) * r;
    const fh = rand(0.35, 0.72);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, fh, 6), new THREE.MeshStandardMaterial({ color: 0x5fa87a, roughness: 0.8, emissive: 0x1a4a30, emissiveIntensity: 0.4 }));
    stem.position.set(fx, fh / 2, fz);
    g.add(stem);

    const head = new THREE.Group();
    head.position.set(fx, fh, fz);
    const petalMat = new THREE.MeshStandardMaterial({ color: flowerCols[i % 4], emissive: 0xffb347, emissiveIntensity: 0.85, roughness: 0.35, transparent: true, opacity: 0.92 });
    const np = 7;
    for (let k = 0; k < np; k++) {
      const pa = k / np * TAU;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), petalMat);
      petal.scale.set(1.5, 0.4, 0.8);
      petal.position.set(Math.cos(pa) * 0.1, 0, Math.sin(pa) * 0.1);
      petal.rotation.y = -pa;
      head.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), M.warmGlow);
    head.add(heart);
    g.add(head);
  }

  /* 垂挂玻璃星星风铃草 */
  for (let i = 0; i < 14; i++) {
    const a = rand(0, TAU), r = rand(0.2, 1.45);
    const hx = Math.cos(a) * r, hz = Math.sin(a) * r;
    const hy = rand(0.95, 1.62);
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.85 - hy, 3), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.45 }));
    thread.position.set(hx, (1.85 + hy) / 2, hz);
    g.add(thread);

    const st = new THREE.Shape();
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 === 0 ? 0.075 : 0.032;
      const aa = k / 10 * TAU - Math.PI / 2;
      const x = Math.cos(aa) * rad, y = Math.sin(aa) * rad;
      if (k === 0) st.moveTo(x, y); else st.lineTo(x, y);
    }
    st.closePath();
    const star = new THREE.Mesh(
      new THREE.ExtrudeGeometry(st, { depth: 0.02, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffb75c, emissiveIntensity: 1.05, roughness: 0.25, transparent: true, opacity: 0.9 })
    );
    star.position.set(hx, hy, hz);
    star.userData = { ph: rand(0, TAU), hx, hz, hy };
    g.add(star);
  }

  /* 花房内微光 */
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), M.warmGlow);
  lamp.position.set(0, 1.5, 0);
  g.add(lamp);

  onFrame((t) => {
    g.rotation.y = Math.sin(t * 0.12) * 0.03;
    links.material.opacity = 0.42 + Math.sin(t * 1.4) * 0.18;
  });
}
buildGreenhouse();

/* ============================================================
   8. 星际童话外景道具
   ============================================================ */
const PROPS = new THREE.Group();
WORLD.add(PROPS);

/* ---------- 巨大黄铜浑天仪星环 ---------- */
function buildArmillary() {
  const defs = [
    { r: 3.52, tilt: 0.20, yaw: 0.4, sp: 0.055, wob: 0.03 },
    { r: 3.90, tilt: 0.37, yaw: 1.9, sp: -0.043, wob: 0.04 },
    { r: 4.28, tilt: 0.50, yaw: 3.4, sp: 0.034, wob: 0.025 },
    { r: 4.64, tilt: 0.56, yaw: 5.0, sp: -0.027, wob: 0.035 }
  ];
  const pivots = [];
  defs.forEach((d, idx) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 5.05, 0);
    PROPS.add(pivot);

    const tilt = new THREE.Group();
    tilt.rotation.x = d.tilt;
    tilt.rotation.y = d.yaw;
    pivot.add(tilt);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.045, 8, 128), M.brass);
    ring.rotation.x = -Math.PI / 2;
    tilt.add(ring);

    /* 环上刻度珠 */
    const beads = [];
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU;
      const b = new THREE.SphereGeometry(i % 6 === 0 ? 0.085 : 0.045, 8, 6);
      b.translate(Math.cos(a) * d.r, 0, Math.sin(a) * d.r);
      beads.push(b);
    }
    const beadMesh = new THREE.Mesh(BGU.mergeGeometries(beads), idx % 2 === 0 ? M.brassGlow : M.brass);
    tilt.add(beadMesh);

    /* 环上星芒 */
    if (idx === 1 || idx === 3) {
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU + 0.7;
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, emissive: 0x9fd8ff, emissiveIntensity: 1.3, roughness: 0.1 }));
        star.position.set(Math.cos(a) * d.r, 0, Math.sin(a) * d.r);
        tilt.add(star);
      }
    }
    pivots.push({ pivot, tilt, sp: d.sp, wob: d.wob, base: d.tilt, ph: idx * 1.7 });
  });
  onFrame((t, dt) => {
    pivots.forEach((p) => {
      p.pivot.rotation.y += p.sp * dt;
      p.tilt.rotation.x = p.base + Math.sin(t * 0.18 + p.ph) * p.wob;
    });
  });
}
buildArmillary();

/* ---------- 新月小舟 ---------- */
function crescentGeo(R, r, d, depth) {
  const y = (R * R - r * r + d * d) / (2 * d);
  const x = Math.sqrt(Math.max(0.0001, R * R - y * y));
  const a0 = Math.atan2(y, x), a1 = Math.PI - a0;
  const pts = [];
  const seg = 48;
  const sweepA = -(TAU - (a1 - a0));
  for (let i = 0; i <= seg; i++) {
    const a = a0 + sweepA * (i / seg);
    pts.push(new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R));
  }
  const b0 = Math.atan2(y - d, x), b1 = Math.atan2(y - d, -x);
  const sweepB = (TAU - (b1 - b0));
  for (let i = 0; i <= seg; i++) {
    const a = b1 + sweepB * (i / seg);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r + d));
  }
  const shape = new THREE.Shape(pts);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 8 });
}

function buildBoat() {
  const boat = new THREE.Group();
  boat.position.set(-4.85, 0.24, 3.55);
  boat.rotation.y = -0.55;
  const geo = crescentGeo(0.95, 0.80, 0.30, 0.44);
  geo.center();
  const hull = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xdfe2f7, roughness: 0.18, metalness: 0.12, emissive: 0x6d7fd8, emissiveIntensity: 0.45, envMapIntensity: 1.4 }));
  hull.rotation.x = -Math.PI / 2;
  boat.add(hull);
  boat.add(outline(hull, 0.012));

  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.022, 6, 64, Math.PI * 1.15), M.brassGlow);
  trim.rotation.x = -Math.PI / 2;
  trim.rotation.z = Math.PI * 0.425;
  trim.position.y = 0.19;
  trim.scale.set(1, 1, 0.5);
  boat.add(trim);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.95, 8), M.brass);
  mast.position.set(0, 0.66, 0.06);
  boat.add(mast);

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), M.warmGlow);
  lantern.position.set(0, 1.12, 0.06);
  boat.add(lantern);
  const lanternHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcf8a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  lanternHalo.position.copy(lantern.position);
  boat.add(lanternHalo);

  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.72, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  sail.position.set(0.3, 0.72, 0.06);
  sail.rotation.y = Math.PI / 2;
  boat.add(sail);

  const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x2a3a8a, emissive: 0x3a4aa0, emissiveIntensity: 0.5, roughness: 0.9 }));
  cushion.scale.set(1.5, 0.5, 1.0);
  cushion.position.set(-0.25, 0.12, 0.02);
  boat.add(cushion);

  PROPS.add(boat);
  onFrame((t) => {
    boat.position.y = 0.24 + Math.sin(t * 0.75) * 0.045;
    boat.rotation.z = Math.sin(t * 0.55) * 0.035;
    boat.rotation.x = Math.cos(t * 0.62) * 0.025;
    lanternHalo.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
    sail.rotation.y = Math.PI / 2 + Math.sin(t * 0.8) * 0.15;
  });
}
buildBoat();

/* ---------- 捕梦网路灯 ---------- */
function buildLamps() {
  const spots = [[-6.15, -1.35], [5.55, -4.35], [-1.55, -6.35]];
  spots.forEach(([x, z], idx) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const H = 1.95;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, H, 8), M.brass);
    pole.position.y = H / 2;
    g.add(pole);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 12), M.jade);
    foot.position.y = 0.06;
    g.add(foot);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 6, 24, Math.PI), M.brass);
    hook.position.set(0.18, H - 0.02, 0);
    hook.rotation.z = Math.PI / 2;
    g.add(hook);

    const ringR = 0.32;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.024, 6, 40), M.brassGlow);
    ring.position.set(0.36, H - 0.12, 0);
    g.add(ring);

    /* 网 */
    const pts = [];
    const cx = 0.36, cy = H - 0.12;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const x1 = cx + Math.cos(a) * ringR, y1 = cy + Math.sin(a) * ringR;
      const a2 = (i + 5) / 12 * TAU;
      const x2 = cx + Math.cos(a2) * ringR * 0.45, y2 = cy + Math.sin(a2) * ringR * 0.45;
      pts.push(new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0));
      pts.push(new THREE.Vector3(x2, y2, 0), new THREE.Vector3(cx, cy, 0));
    }
    const webGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const web = new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({ color: 0xd9f2ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(web);

    /* 垂线 + 星珠 */
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      const px = cx + Math.cos(a) * ringR * 0.82;
      const py = cy + Math.sin(a) * ringR * 0.82;
      const drop = rand(0.25, 0.62);
      const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, drop, 3), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35 }));
      thread.position.set(px, py - drop / 2, 0);
      g.add(thread);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb75c, emissiveIntensity: 1.45, roughness: 0.3 }));
      bead.position.set(px, py - drop, 0);
      g.add(bead);
    }

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M.warmGlow);
    core.position.set(cx, cy, 0);
    g.add(core);

    PROPS.add(g);
    onFrame((t) => {
      g.rotation.y = Math.sin(t * 0.25 + idx) * 0.06;
      web.material.opacity = 0.45 + Math.sin(t * 1.1 + idx) * 0.18;
    });
  });
}
buildLamps();

/* ---------- 星尘花坛 ---------- */
function buildFlowerBed(x, z, scale = 1, inWater = false) {
  const g = new THREE.Group();
  g.position.set(x, inWater ? 0.05 : 0.55, z);
  g.scale.setScalar(scale);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.36, 0.28, 20), M.jade);
  pot.position.y = 0.15;
  g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0x1a1a4a, roughness: 1, emissive: 0x2a2a6a, emissiveIntensity: 0.5 }));
  soil.position.y = 0.3;
  g.add(soil);

  const cols = [0x8affd8, 0xffa8e8, 0xffd98a, 0xa8b8ff];
  for (let i = 0; i < 11; i++) {
    const a = rand(0, TAU), r = rand(0.04, 0.34);
    const fx = Math.cos(a) * r, fz = Math.sin(a) * r;
    const h = rand(0.38, 0.72);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, h, 4), new THREE.MeshStandardMaterial({ color: 0x8fd8c0, emissive: 0x2a6a5a, emissiveIntensity: 0.6, roughness: 0.6 }));
    stem.position.set(fx, 0.3 + h / 2, fz);
    g.add(stem);
    const col = cols[i % cols.length];
    const petalMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.5, roughness: 0.2, transparent: true, opacity: 0.85 });
    const head = new THREE.Group();
    head.position.set(fx, 0.3 + h, fz);
    for (let k = 0; k < 5; k++) {
      const pa = k / 5 * TAU;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.088, 8, 6), petalMat);
      petal.scale.set(1.5, 0.35, 0.75);
      petal.position.set(Math.cos(pa) * 0.085, 0, Math.sin(pa) * 0.085);
      petal.rotation.y = -pa;
      head.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff6dd }));
    head.add(heart);
    g.add(head);
  }
  PROPS.add(g);
  return g;
}
buildFlowerBed(3.25, -2.45, 1.0);
buildFlowerBed(-3.55, -1.75, 0.85);
buildFlowerBed(-5.5, -4.35, 0.8, true);

/* ---------- 星座路牌 ---------- */
function buildSignpost() {
  const g = new THREE.Group();
  g.position.set(-3.55, 0.55, 2.35);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.75, 10), M.brassDark);
  pole.position.y = 0.875;
  g.add(pole);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.brassGlow);
  cap.position.y = 1.78;
  g.add(cap);

  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, -0.085);
  arrowShape.lineTo(0.46, -0.085);
  arrowShape.lineTo(0.62, 0);
  arrowShape.lineTo(0.46, 0.085);
  arrowShape.lineTo(0, 0.085);
  arrowShape.closePath();
  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });

  const info = [
    { y: 1.42, rot: 0.35, col: 0x9fe8ff },
    { y: 1.16, rot: 2.3, col: 0xffb8e8 },
    { y: 0.90, rot: 4.1, col: 0xffd98a }
  ];
  info.forEach((it) => {
    const arrow = new THREE.Mesh(arrowGeo, M.brass);
    arrow.position.set(0, it.y, 0);
    arrow.rotation.y = it.rot;
    g.add(arrow);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: it.col, toneMapped: false }));
    dot.position.set(Math.cos(it.rot) * 0.18, it.y, -Math.sin(it.rot) * 0.18);
    dot.rotation.y = it.rot;
    g.add(dot);
  });
  PROPS.add(g);
}
buildSignpost();

/* ---------- 自动记录星轨的羽毛笔石台 ---------- */
function buildStoneTable() {
  const g = new THREE.Group();
  g.position.set(2.55, 0.55, -3.05);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.78, 12), M.stone);
  leg.position.y = 0.39;
  g.add(leg);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.08, 28), M.jade);
  top.position.y = 0.81;
  g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.455, 0.02, 5, 32), M.brass);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.85;
  g.add(rim);

  const page = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshStandardMaterial({ color: 0xfff4d8, emissive: 0xffd08a, emissiveIntensity: 0.9, roughness: 0.9, side: THREE.DoubleSide }));
  page.rotation.x = -Math.PI / 2;
  page.position.y = 0.856;
  g.add(page);

  const quill = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.6), new THREE.MeshBasicMaterial({ map: featherTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  quill.position.set(0.04, 1.14, 0);
  quill.rotation.z = 0.28;
  g.add(quill);

  PROPS.add(g);
  onFrame((t) => {
    quill.rotation.z = 0.28 + Math.sin(t * 1.6) * 0.06;
    quill.position.y = 1.14 + Math.sin(t * 1.2) * 0.02;
    page.material.emissiveIntensity = 0.8 + Math.sin(t * 1.4) * 0.2;
  });
}
buildStoneTable();

/* ---------- 镜面浅水中的陨石碎片与流星结晶 ---------- */
function buildDebris() {
  const spots = [
    [-5.9, 1.4, 0.5], [5.2, 3.6, 0.4], [3.4, 5.6, 0.55], [-3.2, 5.9, 0.4],
    [6.3, 0.6, 0.45], [-6.6, 3.4, 0.35], [1.9, -5.9, 0.5], [-4.4, -5.2, 0.4],
    [6.0, -2.2, 0.38], [-2.1, 6.4, 0.45]
  ];
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2b2a5c, roughness: 0.55, metalness: 0.35, emissive: 0x1a2a6a, emissiveIntensity: 0.9, flatShading: true });
  spots.forEach(([x, z, s], i) => {
    const g = new THREE.Group();
    g.position.set(x, 0.02, z);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 * s * 2, 0), rockMat);
    rock.scale.set(1, rand(0.5, 0.8), rand(0.8, 1.2));
    rock.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
    g.add(rock);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1 * s * 2, 0),
      new THREE.MeshStandardMaterial({ color: 0xd8f4ff, emissive: 0x6fe0ff, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.95 })
    );
    crystal.position.set(rand(-0.12, 0.12), 0.18 * s * 2, rand(-0.12, 0.12));
    crystal.scale.y = 1.6;
    g.add(crystal);

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.42 * s, 20),
      new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.005;
    g.add(halo);

    PROPS.add(g);
    onFrame((t) => {
      crystal.rotation.y = t * (0.3 + i * 0.05);
      crystal.position.y = (0.18 + Math.sin(t * 1.2 + i) * 0.03) * s * 2;
      halo.material.opacity = 0.12 + Math.sin(t * 1.6 + i) * 0.06;
    });
  });
}
buildDebris();

/* ---------- 升腾的金色星尘 ---------- */
function buildDust() {
  const N = 700;
  const pos = new Float32Array(N * 3);
  const spd = new Float32Array(N);
  const sz = new Float32Array(N);
  const ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * 7.0;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = rand(0, 10);
    pos[i * 3 + 2] = Math.sin(a) * r;
    spd[i] = rand(0.08, 0.34);
    sz[i] = rand(0.5, 2.2);
    ph[i] = Math.random() * TAU;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));

  const tex = canvasTex(64, 64, (ctx, w, h) => {
    const rg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,250,230,1)');
    rg.addColorStop(0.3, 'rgba(255,214,140,0.85)');
    rg.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  });

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aSize; attribute float aPhase;
      uniform float uTime; uniform float uPR;
      varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (92.0 / max(-mv.z, 1.0));
        vA = 0.35 + 0.65 * abs(sin(uTime * 0.9 + aPhase));
      }`,
    fragmentShader: `
      uniform sampler2D uTex;
      varying float vA;
      void main(){
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(t.rgb * 1.15, t.a * vA * 0.55);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  WORLD.add(pts);

  onFrame((t, dt) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] += spd[i] * dt;
      arr[i * 3] += Math.sin(t * 0.4 + ph[i]) * dt * 0.06;
      arr[i * 3 + 2] += Math.cos(t * 0.35 + ph[i]) * dt * 0.06;
      if (arr[i * 3 + 1] > 10.2) {
        arr[i * 3 + 1] = -0.1;
        const a = Math.random() * TAU;
        const r = Math.sqrt(Math.random()) * 7.0;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 2] = Math.sin(a) * r;
      }
    }
    geo.attributes.position.needsUpdate = true;
    mat.uniforms.uTime.value = t;
  });
}
buildDust();

/* ============================================================
   9. 后期处理
   ============================================================ */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.34, 0.58, 0.90);
composer.addPass(bloom);

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      vec2 d = uv - 0.5;
      float r2 = dot(d, d);
      float ca = r2 * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + d * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - d * ca).b;
      float vig = smoothstep(1.05, 0.32, length(d) * 1.35);
      col *= mix(0.55, 1.0, vig);
      col = mix(col, col * vec3(1.03, 0.98, 1.09), 0.35);
      gl_FragColor = vec4(col, 1.0);
    }`
};
const gradePass = new ShaderPass(GradeShader);
composer.addPass(gradePass);
composer.addPass(new OutputPass());

/* ============================================================
   10. 主循环
   ============================================================ */
const T = { time: 0 };
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  T.time += dt;
  const t = T.time;

  updaters.forEach((fn) => fn(t, dt));
  glassMats.forEach((m) => { m.uniforms.uTime.value = t; });
  innerWarm.intensity = 12.0 + Math.sin(t * 1.7) * 1.2;
  innerCool.intensity = 5.0 + Math.sin(t * 1.1 + 1.0) * 0.7;
  greenLight.intensity = 1.9 + Math.sin(t * 1.9 + 2.0) * 0.35;

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.resolution.set(window.innerWidth, window.innerHeight);
});
