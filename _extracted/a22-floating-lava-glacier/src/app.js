
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* =========================================================
   0. RENDERER / SCENE / CAMERA
   ========================================================= */
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x070d18, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, window.innerWidth/window.innerHeight, 0.5, 600);
camera.position.set(28.0, 23.5, 50.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0.4);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.85;
controls.enablePan = false;
controls.minDistance = 19;
controls.maxDistance = 78;
controls.minPolarAngle = 0.10;
controls.maxPolarAngle = Math.PI * 0.512;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.12;

let idleTimer = null;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  if (idleTimer) clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { controls.autoRotate = true; }, 7000);
});

// widen the framing on narrow / portrait screens
(function initialFit(){
  const a = window.innerWidth / window.innerHeight;
  if (a < 1.3){
    camera.fov = Math.min(56, 34 + (1.3 - a) * 24);
    camera.updateProjectionMatrix();
    const vFov = camera.fov * Math.PI/180;
    const hFov = 2*Math.atan(Math.tan(vFov/2) * a);
    const R = 17.2;
    const d = Math.max(R/Math.tan(vFov/2), R/Math.tan(hFov/2)) * 1.02;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, d);
    controls.maxDistance = Math.max(78, d*1.5);
  }
})();

/* =========================================================
   1. MATH / RANDOM / NOISE
   ========================================================= */
let _seed = 20261030;
function rnd(){ _seed = (_seed * 1664525 + 1013904223) % 4294967296; return _seed / 4294967296; }
function rr(a,b){ return a + (b-a)*rnd(); }
function ri(a,b){ return Math.floor(a + (b-a+1)*rnd()); }
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
function smoothstep(e0,e1,x){ const t = clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
const lerp = (a,b,t)=>a+(b-a)*t;

function h3(x,y,z){ const s = Math.sin(x*127.1 + y*311.7 + z*74.7) * 43758.5453; return s - Math.floor(s); }
function n3(x,y,z){
  const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
  const xf=x-xi, yf=y-yi, zf=z-zi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf);
  const c000=h3(xi,yi,zi),   c100=h3(xi+1,yi,zi),   c010=h3(xi,yi+1,zi),   c110=h3(xi+1,yi+1,zi);
  const c001=h3(xi,yi,zi+1), c101=h3(xi+1,yi,zi+1), c011=h3(xi,yi+1,zi+1), c111=h3(xi+1,yi+1,zi+1);
  const x00=lerp(c000,c100,u), x10=lerp(c010,c110,u), x01=lerp(c001,c101,u), x11=lerp(c011,c111,u);
  return lerp(lerp(x00,x10,v), lerp(x01,x11,v), w);
}
function fbm3(x,y,z){ let v=0,a=0.5,f=1; for(let i=0;i<3;i++){ v+=a*n3(x*f,y*f,z*f); f*=2.03; a*=0.5; } return v; }

/* =========================================================
   2. TOON / OUTLINE / PAINT
   ========================================================= */
function gradTex(vals){
  const d = new Uint8Array(vals);
  const t = new THREE.DataTexture(d, vals.length, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
const G4 = gradTex([98, 158, 214, 255]);
const G3 = gradTex([78, 166, 255]);

const MAT_TOON = new THREE.MeshToonMaterial({ vertexColors:true, gradientMap:G4 });

const outlineMat = new THREE.ShaderMaterial({
  uniforms: { uThick:{ value: 1.0 }, uColor:{ value: new THREE.Color(0x0b0814) } },
  vertexShader: `
    uniform float uThick;
    void main(){
      vec3 n = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      mv.xyz += n * uThick * 0.00175 * max(12.0, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }`,
  side: THREE.BackSide,
  polygonOffset: true,
  polygonOffsetFactor: 1.0,
  polygonOffsetUnits: 1.0
});

function addOutline(mesh, thick){
  const t = thick === undefined ? 1.0 : thick;
  const mat = t === 1.0 ? outlineMat : outlineMat.clone();
  if (t !== 1.0) mat.uniforms.uThick.value = t;
  const o = new THREE.Mesh(mesh.geometry, mat);
  o.castShadow = false; o.receiveShadow = false; o.renderOrder = -1;
  mesh.add(o);
  return o;
}

function paint(geo, hex, varr, hue){
  const vv = varr === undefined ? 0.07 : varr;
  const hh = hue === undefined ? 0.028 : hue;
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const col = new Float32Array(p.count*3);
  const c = new THREE.Color();
  for (let i=0;i<p.count;i+=3){
    c.set(hex);
    c.offsetHSL((rnd()-0.5)*hh, (rnd()-0.5)*0.035, (rnd()-0.5)*vv);
    for (let k=0;k<3;k++){ const o=(i+k)*3; col[o]=c.r; col[o+1]=c.g; col[o+2]=c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col,3));
  return g;
}

function toon(geo, hex, o){
  const opt = o || {};
  const g = paint(geo, hex, opt.varr, opt.hue);
  const m = new THREE.Mesh(g, opt.mat || MAT_TOON);
  if (opt.outline !== false) addOutline(m, opt.ow === undefined ? 1.0 : opt.ow);
  m.castShadow = opt.cast !== false;
  m.receiveShadow = opt.recv !== false;
  if (opt.pos) m.position.set(opt.pos[0], opt.pos[1], opt.pos[2]);
  if (opt.rot) m.rotation.set(opt.rot[0], opt.rot[1], opt.rot[2]);
  return m;
}

/* =========================================================
   3. SHADER CHUNKS
   ========================================================= */
const NOISE = `
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i);
  float b = hash21(i+vec2(1.0,0.0));
  float c = hash21(i+vec2(0.0,1.0));
  float d = hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<4;i++){ v += a*vnoise(p); p = p*2.02 + 1.7; a*=0.5; }
  return v;
}
`;

function flowMat(c1, c2, c3, o){
  const opt = o || {};
  const alpha = opt.alpha === undefined ? 1.0 : opt.alpha;
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime:{ value:0 },
      uC1:{ value:new THREE.Color(c1) },
      uC2:{ value:new THREE.Color(c2) },
      uC3:{ value:new THREE.Color(c3) },
      uSpeed:{ value: opt.speed === undefined ? 1.4 : opt.speed },
      uScale:{ value: opt.scale === undefined ? 1.6 : opt.scale },
      uUvX:{ value: opt.uvx === undefined ? 3.0 : opt.uvx },
      uUvY:{ value: opt.uvy === undefined ? 4.0 : opt.uvy },
      uRim:{ value: opt.rim === undefined ? 0.45 : opt.rim },
      uAlpha:{ value: alpha }
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE + `
      uniform float uTime, uSpeed, uScale, uUvX, uUvY, uRim, uAlpha;
      uniform vec3 uC1, uC2, uC3;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float t = uTime * uSpeed;
        vec2 p = vec2(vUv.x*uUvX, vUv.y*uUvY - t);
        float n  = fbm(p*uScale);
        float n2 = fbm(p*uScale*2.13 + vec2(3.7,1.3) - t*0.55);
        float m = smoothstep(0.26, 0.86, n*0.78 + n2*0.44);
        vec3 col = mix(uC1, uC2, m);
        col = mix(col, uC3, smoothstep(0.72, 1.0, m));
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        col += uC3 * fres * uRim;
        gl_FragColor = vec4(col, uAlpha);
      }`,
    transparent: alpha < 1.0,
    depthWrite: alpha >= 1.0,
    side: THREE.DoubleSide
  });
}

function iceSurfaceMat(alphaMul){
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime:{ value:0 },
      uFire:{ value:new THREE.Vector3(0.2, 0, 7.2) },
      uHole:{ value:2.4 },
      uTint:{ value:new THREE.Color(0x74d6ff) },
      uAlpha:{ value: alphaMul === undefined ? 1.0 : alphaMul }
    },
    vertexShader: `
      varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE + `
      uniform float uTime, uHole, uAlpha;
      uniform vec3 uFire, uTint;
      varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float fres = pow(1.0 - abs(dot(N,V)), 3.0);
        vec3 col = mix(vec3(0.015,0.055,0.115), uTint*0.72, fres*0.8);
        float ca = fbm(vW.xz*0.55 + vec2(uTime*0.045, -uTime*0.035));
        col += vec3(0.05,0.17,0.26) * ca * 0.42;
        float d = length(vW.xz - uFire.xz);
        float ring = 0.5 + 0.5*sin(d*2.7 - uTime*1.9);
        float g = smoothstep(uHole+5.6, uHole+0.1, d);
        col += vec3(1.0,0.34,0.06) * g * (0.28 + 0.55*ring);
        col += vec3(1.0,0.70,0.34) * smoothstep(uHole+1.0, uHole+0.05, d) * 0.5;
        float cr = abs(fbm(vW.xz*1.05 + 11.0) - 0.5);
        float crack = smoothstep(0.026, 0.0, cr);
        col += vec3(0.28,0.60,0.85) * crack * 0.75;
        float pat = fbm(vW.xz*0.34 + 4.0);
        float sp = smoothstep(0.60, 0.71, pat);
        col = mix(col, vec3(0.36,0.54,0.68), sp*0.38);
        float a = clamp(0.10 + fres*0.40, 0.0, 0.62);
        a *= mix(0.42, 1.0, smoothstep(uHole, uHole+2.4, d));
        a += sp*0.13 + crack*0.12;
        gl_FragColor = vec4(col, a*uAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide
  });
}

function glassMat(){
  return new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE + `
      uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float fres = pow(1.0 - abs(dot(N,V)), 2.6);
        float strata = fbm(vec2(vUv.x*2.2, vUv.y*8.0));
        vec3 col = mix(vec3(0.10,0.30,0.44), vec3(0.66,0.93,1.0), fres);
        col += vec3(0.24,0.55,0.70) * strata * 0.40;
        float a = 0.075 + fres*0.38 + strata*0.05;
        a += smoothstep(0.90,1.0,vUv.y) * 0.22;
        a += smoothstep(0.045,0.0,vUv.y) * 0.10;
        gl_FragColor = vec4(col, a);
      }`,
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide
  });
}

function crystalMat(tipHex, baseHex, glow){
  return new THREE.ShaderMaterial({
    uniforms: {
      uTip:{ value:new THREE.Color(tipHex) },
      uBase:{ value:new THREE.Color(baseHex) },
      uLight:{ value:new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
      uGlow:{ value: glow === undefined ? 0.0 : glow }
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vH;
      void main(){
        vH = position.y;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uTip, uBase, uLight;
      uniform float uGlow;
      varying vec3 vN; varying vec3 vV; varying float vH;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float d = dot(N, uLight);
        float band = d > 0.55 ? 1.0 : (d > 0.02 ? 0.74 : 0.48);
        vec3 base = mix(uBase, uTip, clamp(vH, 0.0, 1.0));
        vec3 col = base * band;
        float fres = pow(1.0 - abs(dot(N,V)), 2.2);
        col += vec3(0.55,0.86,1.0) * fres * 0.55;
        col += uTip * uGlow;
        gl_FragColor = vec4(col, 0.95);
      }`,
    transparent:true,
    depthWrite:true
  });
}

/* glacier wall - vertical ice strata */
function wallMat(){
  return new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 } },
    vertexShader: `
      varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE + `
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        vec3 L = normalize(vec3(0.55,0.72,0.42));
        float d = dot(N,L);
        float band = d > 0.62 ? 0.95 : (d > 0.20 ? 0.76 : (d > -0.18 ? 0.54 : 0.36));
        float h = clamp((vW.y + 1.4) / 8.2, 0.0, 1.0);
        vec3 base = mix(vec3(0.012,0.060,0.150), vec3(0.16,0.52,0.78), h*0.92 + 0.08);
        float st = fbm(vec2(vW.x*0.42, vW.y*0.06));
        base *= 0.66 + st*0.66;
        float layer = 0.5 + 0.5*sin(vW.y*4.1 + fbm(vec2(vW.x*0.22, vW.y*0.25))*3.2);
        base *= 0.88 + layer*0.20;
        float crev = smoothstep(0.60, 0.90, fbm(vec2(vW.x*0.75+7.0, vW.y*0.05)));
        base *= 1.0 - crev*0.38;
        vec3 col = base * band;
        float fres = pow(1.0 - abs(dot(N,V)), 3.0);
        col += vec3(0.26,0.72,1.0) * fres * 0.62;
        gl_FragColor = vec4(col, 0.98);
      }`,
    transparent:true,
    depthWrite:true,
    side:THREE.DoubleSide
  });
}

function hazeMat(color, o){
  const opt = o || {};
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime:{ value:0 },
      uColor:{ value:new THREE.Color(color) },
      uOpacity:{ value: opt.opacity === undefined ? 0.35 : opt.opacity },
      uSpeed:{ value: opt.speed === undefined ? 1.1 : opt.speed },
      uScale:{ value: opt.scale === undefined ? 2.0 : opt.scale }
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE + `
      uniform float uTime, uOpacity, uSpeed, uScale;
      uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float n = fbm(vec2(vUv.x*5.0, vUv.y*2.4 - uTime*uSpeed));
        float edge = smoothstep(0.0,0.16,vUv.y) * smoothstep(1.0,0.55,vUv.y);
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);
        float a = (0.22 + 0.65*n) * edge * (0.25 + fres) * uOpacity;
        gl_FragColor = vec4(uColor*(0.55+n*0.9), a);
      }`,
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide
  });
}

/* =========================================================
   4. PROCEDURAL TEXTURES
   ========================================================= */
function radialTexture(size, inner, mid, outer){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  g.addColorStop(0, inner);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = radialTexture(128, 'rgba(255,255,255,1)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)');
const softTex = radialTexture(128, 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)');

function cloudTexture(size){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  for (let i=0;i<30;i++){
    const r = size*(0.07 + Math.random()*0.15);
    const x = size/2 + (Math.random()-0.5)*size*0.52;
    const y = size/2 + (Math.random()-0.5)*size*0.40;
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, 'rgba(255,255,255,0.30)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const cloudTex = cloudTexture(256);

function bubbleTexture(size){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size*0.5,size*0.5,size*0.18,size*0.5,size*0.5,size*0.46);
  g.addColorStop(0,'rgba(200,245,255,0.0)');
  g.addColorStop(0.72,'rgba(190,240,255,0.30)');
  g.addColorStop(0.92,'rgba(235,255,255,0.85)');
  g.addColorStop(1,'rgba(235,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(size/2,size/2,size*0.46,0,Math.PI*2); ctx.fill();
  const h = ctx.createRadialGradient(size*0.38,size*0.34,0,size*0.38,size*0.34,size*0.12);
  h.addColorStop(0,'rgba(255,255,255,0.95)');
  h.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = h; ctx.beginPath(); ctx.arc(size*0.38,size*0.34,size*0.12,0,Math.PI*2); ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const bubbleTex = bubbleTexture(64);

/* =========================================================
   5. SKY + LIGHTS
   ========================================================= */
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    uTop:{ value:new THREE.Color(0x060911) },
    uMid:{ value:new THREE.Color(0x123a52) },
    uBot:{ value:new THREE.Color(0x02040a) }
  },
  vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 uTop, uMid, uBot;
    varying vec3 vP;
    void main(){
      float h = normalize(vP).y;
      vec3 c = mix(uBot, uMid, smoothstep(-0.55, 0.02, h));
      c = mix(c, uTop, smoothstep(0.0, 0.8, h));
      gl_FragColor = vec4(c, 1.0);
    }`,
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 32, 20), skyMat);
sky.renderOrder = -100;
scene.add(sky);

const hemi = new THREE.HemisphereLight(0x9ec8ff, 0x2b2450, 0.66);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xd8ebff, 1.35);
keyLight.position.set(17, 27, 19);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -24;
keyLight.shadow.camera.right = 24;
keyLight.shadow.camera.top = 26;
keyLight.shadow.camera.bottom = -24;
keyLight.shadow.camera.near = 6;
keyLight.shadow.camera.far = 80;
keyLight.shadow.bias = -0.0007;
keyLight.shadow.normalBias = 0.035;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x5a7dff, 0.9);
rimLight.position.set(-20, 11, -18);
scene.add(rimLight);

const lavaLight = new THREE.PointLight(0xff5f14, 78, 24, 2);
lavaLight.position.set(0.3, 7.2, 7.0);
scene.add(lavaLight);

const craterLight = new THREE.PointLight(0xff7a22, 90, 28, 2);
craterLight.position.set(-1.0, 16.4, 2.3);
scene.add(craterLight);

const iceLight = new THREE.PointLight(0x3cd9ff, 165, 28, 2);
iceLight.position.set(-1.0, -3.0, 9.0);
scene.add(iceLight);

const poolLight = new THREE.PointLight(0xff9a3c, 135, 22, 2);
poolLight.position.set(0.2, -4.5, 7.2);
scene.add(poolLight);

const impactLight = new THREE.PointLight(0xff8a2e, 85, 13, 2);
impactLight.position.set(0.2, 0.2, 7.2);
scene.add(impactLight);

const fillLight = new THREE.DirectionalLight(0x86a8ff, 0.42);
fillLight.position.set(-16, 9, 22);
scene.add(fillLight);

const cliffLight = new THREE.PointLight(0x74c8ff, 55, 22, 2);
cliffLight.position.set(-9, 7.4, -3.0);
scene.add(cliffLight);

/* =========================================================
   6. GEOMETRY BUILDERS
   ========================================================= */
function taperedTube(curve, r0, r1, seg, rad, rf){
  const frames = curve.computeFrenetFrames(seg, false);
  const pts = curve.getSpacedPoints(seg);
  const pos = [], nor = [], uvs = [], idx = [];
  const nrm = new THREE.Vector3();
  for (let i=0;i<=seg;i++){
    const t = i/seg;
    const r = rf ? rf(t) : r0 + (r1-r0)*t;
    const P = pts[i], N = frames.normals[i], B = frames.binormals[i];
    for (let j=0;j<=rad;j++){
      const v = j/rad*Math.PI*2;
      const cx = Math.cos(v), cy = Math.sin(v);
      nrm.set(N.x*cx + B.x*cy, N.y*cx + B.y*cy, N.z*cx + B.z*cy).normalize();
      pos.push(P.x + nrm.x*r, P.y + nrm.y*r, P.z + nrm.z*r);
      nor.push(nrm.x, nrm.y, nrm.z);
      uvs.push(j/rad, t);
    }
  }
  for (let i=0;i<seg;i++){
    for (let j=0;j<rad;j++){
      const a = i*(rad+1)+j, b = a+1, c = a+rad+1, d = c+1;
      idx.push(a,b,d, a,d,c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(idx);
  return g;
}

function rockGeo(radius, detail, amp, seed, squashY){
  const g = new THREE.IcosahedronGeometry(radius, detail === undefined ? 1 : detail);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const sq = squashY === undefined ? 1 : squashY;
  for (let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    const n = n3(v.x*1.1 + seed, v.y*1.1 + seed*2.3, v.z*1.1 + seed*1.7) - 0.5;
    v.multiplyScalar(1 + n*2*(amp === undefined ? 0.32 : amp));
    v.y *= sq;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/* spike: local y from 0 (base) to 1 (tip), flat-shaded */
function spikeGeo(sides, jag){
  const g = new THREE.ConeGeometry(1, 1, sides, 3, false);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    if (v.y > 0.02 && v.y < 0.98){
      const a = Math.atan2(v.z, v.x);
      const k = 1 + (n3(Math.cos(a)*2.2, v.y*3.0, Math.sin(a)*2.2)-0.5)*(jag === undefined ? 0.45 : jag);
      v.x *= k; v.z *= k;
      v.y += (n3(v.x*3.0, v.y*4.0, v.z*3.0)-0.5)*0.06;
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  const ng = g.toNonIndexed();
  ng.computeVertexNormals();
  return ng;
}

function terrainGeo(w, d, sw, sd, hf){
  const g = new THREE.PlaneGeometry(w, d, sw, sd);
  g.rotateX(-Math.PI/2);
  const p = g.attributes.position;
  for (let i=0;i<p.count;i++){
    p.setY(i, hf(p.getX(i), p.getZ(i)));
  }
  g.computeVertexNormals();
  return g;
}

function paintTerrain(geo, snowHex, rockHex, snowT){
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const col = new Float32Array(p.count*3);
  const cs = new THREE.Color(snowHex), cr = new THREE.Color(rockHex), c = new THREE.Color();
  for (let i=0;i<p.count;i+=3){
    const ny = (n.getY(i)+n.getY(i+1)+n.getY(i+2))/3;
    const t = smoothstep(0.32, 0.80, ny + (n3(p.getX(i)*0.4, 0, p.getZ(i)*0.4)-0.5)*0.35);
    const patch = n3(p.getX(i)*0.115, 7.0, p.getZ(i)*0.115);
    const rockPatch = smoothstep(0.50, 0.66, patch);
    c.copy(cr).lerp(cs, clamp(t*(1-rockPatch*0.92)*(snowT===undefined?1:snowT),0,1));
    c.offsetHSL(0, 0, (rnd()-0.5)*0.05);
    for (let k=0;k<3;k++){ const o=(i+k)*3; col[o]=c.r; col[o+1]=c.g; col[o+2]=c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col,3));
  return g;
}

/* =========================================================
   7. SCENE CONSTANTS
   ========================================================= */
const LZ = 7.2;             // lake centre (z)
const CFG = {
  lakeX0: -10.4, lakeX1: 10.4,
  lakeZ0: 0.55, lakeZ1: 12.6,
  iceY: -0.72,
  floorY: -5.2,
  holeX: 0.2, holeZ: LZ, holeR: 2.4,
  cliffTop: 6.4,
  islandX: -1.0, islandY: 10.8, islandZ: 2.2,
  cliffZ: -6.3
};

const anim = {
  flowMats: [],
  hazeMats: [],
  iceMats: [],
  glowMats: [],
  floaters: [],
  clouds: [],
  rings: [],
  steam: [],
  debris: []
};

const world = new THREE.Group();
scene.add(world);
const baseGroup = new THREE.Group();
world.add(baseGroup);

/* =========================================================
   8. BASE PLINTH
   ========================================================= */
{
  const plinth = toon(new THREE.BoxGeometry(27.6, 1.5, 27.6, 1, 1, 1), 0x2c2643, { varr:0.05, ow:1.15 });
  plinth.position.y = -6.75;
  baseGroup.add(plinth);

  const trim = toon(new THREE.BoxGeometry(27.05, 0.24, 27.05, 1, 1, 1), 0x6d5330, { varr:0.02, hue:0.01, outline:false, cast:false });
  trim.position.y = -5.94;
  baseGroup.add(trim);

  const backMass = toon(new THREE.BoxGeometry(26, 6.0, 13.4, 1, 1, 1), 0x352d52, { varr:0.05, ow:1.1 });
  backMass.position.set(0, -3.0, CFG.cliffZ);
  baseGroup.add(backMass);

  [-1, 1].forEach(s => {
    const sb = toon(new THREE.BoxGeometry(2.6, 6.0, 12.7, 1, 1, 1), 0x352d52, { varr:0.05, ow:1.1 });
    sb.position.set(s*11.7, -3.0, 6.85);
    baseGroup.add(sb);

    for (let k=0;k<7;k++){
      const rk = toon(rockGeo(rr(0.3,0.7), 1, 0.4, k*3.1+s*2), 0x6f9cba, { varr:0.09, ow:0.55, cast:false });
      rk.position.set(s*(11.7+rr(-0.6,0.6)), 0.05, rr(1.2,12.2));
      rk.scale.y = 0.5;
      baseGroup.add(rk);
    }
  });

  const floorSlab = toon(new THREE.BoxGeometry(20.8, 0.9, 12.7, 1, 1, 1), 0x171426, { varr:0.05, ow:1.0 });
  floorSlab.position.set(0, -5.65, 6.85);
  baseGroup.add(floorSlab);

  const glassPanel = new THREE.Mesh(new THREE.PlaneGeometry(20.8, 6.0, 1, 1), glassMat());
  glassPanel.position.set(0, -3.0, 13.18);
  glassPanel.renderOrder = 20;
  baseGroup.add(glassPanel);

  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(20.9, 0.14, 0.5),
    new THREE.MeshBasicMaterial({ color:0x9fe8ff, transparent:true, opacity:0.5 })
  );
  lip.position.set(0, 0.01, 13.16);
  lip.renderOrder = 21;
  baseGroup.add(lip);
}

/* =========================================================
   9. CLIFF MASSIF
   ========================================================= */
function cliffProfile(x){
  const c = Math.exp(-Math.pow(x/7.0, 2)) * 2.55;
  const n = (n3(x*0.33, 3.3, 0.5) - 0.5) * 1.45;
  return CFG.cliffTop + Math.max(0.05, c + n);
}
function cliffHeight(x, z){
  const mx = smoothstep(13.0, 9.6, Math.abs(x));
  const mz = smoothstep(0.4, -3.0, z);
  const front = cliffProfile(x) - CFG.cliffTop;
  let inland = 0;
  inland += (fbm3(x*0.14 + 3.1, 0.5, z*0.14 - 1.7) - 0.42) * 2.3;
  inland += Math.max(0, n3(x*0.085 + 8, 2.0, z*0.085) - 0.54) * 5.4;
  inland += 0.32;
  return front*mx + clamp(inland, 0, 2.1) * mx * mz;
}

{
  const cliffCore = toon(new THREE.BoxGeometry(26, 6.4, 13.4, 1, 1, 1), 0x36305a, { varr:0.05, ow:1.15 });
  cliffCore.position.set(0, 3.2, CFG.cliffZ);
  baseGroup.add(cliffCore);

  const cliffTopGeo = terrainGeo(25.9, 13.3, 42, 24, (x,z) => CFG.cliffTop + cliffHeight(x, z + CFG.cliffZ));
  const cliffTopMesh = new THREE.Mesh(paintTerrain(cliffTopGeo, 0x8fb4d2, 0x2e2748, 1.0), MAT_TOON);
  cliffTopMesh.position.set(0, 0, CFG.cliffZ);
  cliffTopMesh.castShadow = true;
  cliffTopMesh.receiveShadow = true;
  baseGroup.add(cliffTopMesh);

  // rock chunks along the front edge to break the mesa line
  for (let i=0;i<16;i++){
    const x = -12.4 + i*1.65 + rr(-0.35,0.35);
    const rk = toon(rockGeo(rr(0.45,0.95), 1, 0.4, i*3.3), 0x3f3760, { varr:0.09, ow:0.7 });
    rk.position.set(x, cliffProfile(x) + rr(-0.2,0.2), 0.3 + rr(-0.25,0.25));
    rk.scale.y = 0.7;
    baseGroup.add(rk);
  }
}

/* glacier cliff face - stacked ice boulders */
{
  const wallGroup = new THREE.Group();
  baseGroup.add(wallGroup);
  const cRock = new THREE.Color(0x2a2344);
  const cIce  = new THREE.Color(0x3f7fa8);
  const cDeep = new THREE.Color(0x1f4a70);
  const tmp = new THREE.Color();
  for (let i=0;i<48;i++){
    const x = rr(-12.6, 12.6);
    const y = rr(-1.3, cliffProfile(x) - 1.1);
    const z = rr(0.35, 2.7);
    const r = rr(0.6, 1.95);
    const icy = clamp((y + 1.2) / 6.0, 0, 1);
    tmp.copy(cRock).lerp(cIce, icy*0.42);
    if (rnd() < 0.30) tmp.lerp(cDeep, rr(0.2,0.55));
    if (rnd() < 0.16) tmp.offsetHSL(0, 0.05, -0.12);
    const g = rockGeo(r, 0, 0.58, i*4.7, rr(0.62,1.0));
    const m = toon(g, tmp.getHex(), { varr:0.08, ow:0.9 });
    m.position.set(x, y, z);
    m.scale.set(rr(0.8,1.5), rr(0.7,1.35), rr(0.6,1.0));
    m.rotation.set(rr(0,3.14), rr(0,3.14), rr(0,3.14));
    wallGroup.add(m);
  }
  // solid backdrop so no sky shows through the boulder mass
  {
    const COLS = 36, ROWS = 4, X0 = -13.05, X1 = 13.05, Y0 = -1.45;
    const pos = [], uvs = [], idx = [];
    for (let i=0;i<=COLS;i++){
      const x = X0 + (X1-X0)*i/COLS;
      const top = cliffProfile(x) + 0.05;
      for (let j=0;j<=ROWS;j++){
        const v = j/ROWS;
        pos.push(x, Y0 + (top-Y0)*v, 0.30);
        uvs.push(i/COLS, v);
      }
    }
    for (let i=0;i<COLS;i++){
      for (let j=0;j<ROWS;j++){
        const a = i*(ROWS+1)+j, b = a+1, c = a+(ROWS+1), d = c+1;
        idx.push(a,c,d, a,d,b);
      }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    bg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
    bg.setIndex(idx);
    bg.computeVertexNormals();
    const bm = toon(bg, 0x231e3c, { varr:0.06, outline:false, cast:false });
    baseGroup.add(bm);
  }

  // outcrops on the plateau
  for (let i=0;i<10;i++){
    const x = rr(3.5, 12.0);
    const z = rr(-9.5, -2.0);
    const rk = toon(rockGeo(rr(0.6,1.4), 0, 0.5, i*7.7), 0x2f2950, { varr:0.1, ow:0.8 });
    rk.position.set(x, CFG.cliffTop + cliffHeight(x, z) + rr(-0.1,0.2), z);
    rk.scale.y = rr(0.6,0.9);
    baseGroup.add(rk);
  }

  // big fallen blocks along the shoreline
  for (let i=0;i<9;i++){
    const x = rr(-11.5, 11.5);
    const rk = toon(rockGeo(rr(1.0,1.9), 0, 0.45, i*8.3), 0x241f3a, { varr:0.09, ow:1.0 });
    rk.position.set(x, rr(-1.1, 0.5), rr(2.0, 3.3));
    rk.scale.set(rr(1,1.4), rr(0.55,0.85), rr(0.7,1.0));
    wallGroup.add(rk);
  }

  const im = crystalMat(0xdff7ff, 0x3f88b8, 0.0);

  // ice crown along the crest
  for (let i=0;i<9;i++){
    const sx = rr(-12.0, 12.0);
    const h = rr(1.2, 3.4);
    const m = new THREE.Mesh(spikeGeo(ri(4,6), 0.3), im);
    m.scale.set(rr(0.20,0.55), h, rr(0.20,0.55));
    m.position.set(sx, cliffProfile(sx) - 0.8, rr(0.4,1.9));
    m.rotation.z = rr(-0.18,0.18);
    m.rotation.x = rr(-0.12,0.12);
    wallGroup.add(m);
    addOutline(m, 0.6);
  }


}

/* =========================================================
   10. LAKE ICE
   ========================================================= */
{
  const shape = new THREE.Shape();
  shape.moveTo(CFG.lakeX0, -CFG.lakeZ1);
  shape.lineTo(CFG.lakeX1, -CFG.lakeZ1);
  shape.lineTo(CFG.lakeX1, -CFG.lakeZ0);
  shape.lineTo(CFG.lakeX0, -CFG.lakeZ0);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(CFG.holeX, -CFG.holeZ, CFG.holeR, 0, Math.PI*2, true);
  shape.holes.push(hole);

  const geo = new THREE.ShapeGeometry(shape, 64);

  const m1 = iceSurfaceMat(1.0);
  const ice = new THREE.Mesh(geo, m1);
  ice.rotation.x = -Math.PI/2;
  ice.position.y = CFG.iceY;
  ice.renderOrder = 10;
  baseGroup.add(ice);
  anim.iceMats.push(m1);

  const m2 = iceSurfaceMat(0.28);
  const under = new THREE.Mesh(geo.clone(), m2);
  under.rotation.x = Math.PI/2;
  under.position.y = CFG.iceY - 0.06;
  under.renderOrder = 9;
  baseGroup.add(under);
  anim.iceMats.push(m2);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(CFG.holeR, 0.13, 8, 64),
    new THREE.MeshBasicMaterial({ color:0xff9a44, transparent:true, opacity:0.62 })
  );
  rim.rotation.x = Math.PI/2;
  rim.position.set(CFG.holeX, CFG.iceY + 0.02, CFG.holeZ);
  rim.renderOrder = 11;
  baseGroup.add(rim);
  anim.holeRim = rim;

  const holeWall = new THREE.Mesh(
    new THREE.CylinderGeometry(CFG.holeR, CFG.holeR*0.96, 0.44, 56, 1, true),
    new THREE.MeshBasicMaterial({ color:0x9fe8ff, transparent:true, opacity:0.5, side:THREE.DoubleSide })
  );
  holeWall.position.set(CFG.holeX, CFG.iceY - 0.21, CFG.holeZ);
  holeWall.renderOrder = 11;
  baseGroup.add(holeWall);
}

/* =========================================================
   11. UNDERWATER WORLD
   ========================================================= */
const underGroup = new THREE.Group();
baseGroup.add(underGroup);

/* back wall */
{
  const g = new THREE.PlaneGeometry(20.8, 5.3, 30, 12);
  const p = g.attributes.position;
  for (let i=0;i<p.count;i++){
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, (n3(x*0.45, y*0.45, 3.3)-0.5)*0.55 + (n3(x*1.4, y*1.4, 9.1)-0.5)*0.16);
  }
  g.computeVertexNormals();
  const m = toon(g, 0x2c3b62, { varr:0.10, outline:false, cast:false });
  m.position.set(0, -2.65, 0.42);
  underGroup.add(m);
}

/* side walls */
[-1,1].forEach(s => {
  const g = new THREE.PlaneGeometry(12.7, 5.3, 20, 12);
  const p = g.attributes.position;
  for (let i=0;i<p.count;i++){
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, (n3(x*0.5+s*9, y*0.5, 5.3)-0.5)*0.45);
  }
  g.computeVertexNormals();
  const m = toon(g, 0x212c4c, { varr:0.10, outline:false, cast:false });
  m.position.set(s*10.36, -2.65, 6.85);
  m.rotation.y = -s*Math.PI/2;
  underGroup.add(m);
});

/* cave mouths */
const caveMat = new THREE.MeshBasicMaterial({ color:0x050a18 });
const caves = [ [-6.4, -3.4, 1.5], [0.9, -3.8, 1.8], [6.6, -3.3, 1.3], [-9.1, -4.1, 0.95] ];
caves.forEach(c => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), caveMat);
  m.scale.set(c[2]*1.35, c[2]*0.85, 0.55);
  m.position.set(c[0], c[1], 0.55);
  underGroup.add(m);
  for (let i=0;i<5;i++){
    const a = -0.6 + i*0.3;
    const rk = toon(rockGeo(rr(0.28,0.5), 0, 0.3, i*4+c[0]), 0x232a44, { varr:0.1, ow:0.6, cast:false });
    rk.position.set(c[0] + Math.cos(a)*c[2]*1.35, c[1] + Math.sin(a)*c[2]*0.85 + rr(-0.1,0.1), 0.62);
    rk.scale.set(1, 1, 0.6);
    underGroup.add(rk);
  }
});

/* bed rubble */
for (let i=0;i<24;i++){
  const r = rr(0.25, 0.8);
  const rk = toon(rockGeo(r, 0, 0.4, i*3.7), 0x1e2540, { varr:0.12, ow:0.5, cast:false });
  rk.position.set(rr(-9.6,9.6), CFG.floorY + r*0.32, rr(1.2,12.0));
  rk.scale.y = 0.55;
  underGroup.add(rk);
}

/* lava column */
{
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, -0.55, LZ),
    new THREE.Vector3(0.26, -2.0, LZ),
    new THREE.Vector3(0.22, -3.6, LZ+0.02),
    new THREE.Vector3(0.2, -5.05, LZ)
  ]);
  const cm = flowMat(0x8a1b02, 0xff5a10, 0xffd98a, { speed:1.9, scale:2.6, uvx:3, uvy:5, rim:0.55 });
  const col = new THREE.Mesh(taperedTube(curve, 0.55, 0.42, 40, 12), cm);
  col.renderOrder = 2;
  underGroup.add(col);
  anim.flowMats.push(cm);

  const gm = hazeMat(0xff6a1e, { opacity:0.45, speed:1.6, scale:2.4 });
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.4, 4.6, 18, 1, true), gm);
  glow.position.set(0.2, -2.85, LZ);
  glow.renderOrder = 3;
  underGroup.add(glow);
  anim.hazeMats.push(gm);

  const shaftM = hazeMat(0xff8a3a, { opacity:0.16, speed:0.8, scale:1.6 });
  const shaft = new THREE.Mesh(new THREE.ConeGeometry(2.7, 4.4, 20, 1, true), shaftM);
  shaft.position.set(0.2, -2.9, LZ);
  shaft.renderOrder = 3;
  underGroup.add(shaft);
  anim.hazeMats.push(shaftM);
}

/* lava pool */
{
  const pm = new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 }, uC1:{ value:new THREE.Color(0x7a1400) }, uC2:{ value:new THREE.Color(0xff6a16) }, uC3:{ value:new THREE.Color(0xffdda0) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: NOISE + `
      uniform float uTime; uniform vec3 uC1,uC2,uC3; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float d = length(p)*2.0;
        float n = fbm(vUv*7.0 + vec2(uTime*0.35, -uTime*0.22));
        float n2 = fbm(vUv*15.0 - vec2(uTime*0.5, uTime*0.3));
        float m = smoothstep(0.35,0.9, n*0.8+n2*0.4);
        vec3 col = mix(uC1, uC2, m);
        col = mix(col, uC3, smoothstep(0.7,1.0,m)*(1.0-d*0.5));
        float fade = smoothstep(1.0, 0.55, d);
        gl_FragColor = vec4(col*(1.15-d*0.35), fade);
      }`,
    transparent:true, depthWrite:false, side:THREE.DoubleSide
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.0, 48), pm);
  pool.rotation.x = -Math.PI/2;
  pool.position.set(0.2, CFG.floorY + 0.06, LZ);
  pool.renderOrder = 3;
  underGroup.add(pool);
  anim.flowMats.push(pm);
}

/* cooling rim */
for (let i=0;i<12;i++){
  const a = i/12*Math.PI*2 + rr(-0.1,0.1);
  const rk = toon(rockGeo(rr(0.3,0.62), 0, 0.45, i*5.1), 0x2a1c26, { varr:0.1, ow:0.6, cast:false });
  rk.position.set(0.2 + Math.cos(a)*rr(2.8,3.4), CFG.floorY + 0.2, LZ + Math.sin(a)*rr(2.8,3.4));
  rk.scale.y = 0.6;
  underGroup.add(rk);
}

/* maze walls */
const maze = [
  [-4.6, 4.6, 3.4, 2.3, 0.55,  0.55],
  [-7.1, 7.6, 2.8, 1.7, 0.50, -0.35],
  [-4.2, 10.8, 3.0, 2.0, 0.50,  0.95],
  [ 4.6, 4.2, 3.2, 2.5, 0.55, -0.60],
  [ 7.4, 7.2, 2.6, 1.6, 0.50,  0.25],
  [ 4.4, 10.9, 3.1, 2.1, 0.50, -1.00],
  [ 0.2, 2.5, 3.4, 1.8, 0.50,  0.15],
  [-1.2, 11.6, 2.6, 1.5, 0.45,  1.20]
];
maze.forEach((w, i) => {
  const g = new THREE.BoxGeometry(w[2], w[3], w[4], 4, 4, 2);
  const p = g.attributes.position;
  for (let k=0;k<p.count;k++){
    const px = p.getX(k), py = p.getY(k), pz = p.getZ(k);
    p.setX(k, px + (n3(px*0.8+i, py*0.7, pz*0.8)-0.5)*0.32);
    p.setZ(k, pz + (n3(px*0.8+i*3, py*0.7, pz*0.8)-0.5)*0.26);
    p.setY(k, py + (n3(px*0.9, py*0.9+i, pz*0.9)-0.5)*0.22);
  }
  const ng = g.toNonIndexed();
  ng.computeVertexNormals();
  const m = toon(ng, 0x353c68, { varr:0.11, ow:0.85, cast:false });
  m.position.set(w[0], CFG.floorY + w[3]/2 - 0.1, w[1]);
  m.rotation.y = w[5];
  underGroup.add(m);

  for (let v=0; v<2; v++){
    const vm = new THREE.MeshBasicMaterial({ color: v===0 ? 0x59e6ff : 0xff9a44, transparent:true, opacity:0.8 });
    const ve = new THREE.Mesh(new THREE.BoxGeometry(w[2]*rr(0.35,0.7), 0.055, 0.055), vm);
    ve.position.set(w[0] + rr(-0.3,0.3), CFG.floorY + rr(0.4, w[3]-0.3), w[1] + (w[4]/2 + 0.05)*Math.cos(w[5]));
    ve.rotation.y = w[5];
    ve.renderOrder = 4;
    underGroup.add(ve);
    anim.glowMats.push({ mat: vm, base: 0.55, amp: 0.32, sp: rr(0.6,1.4), ph: rr(0,6.28) });
  }
});

/* crystal veins on the bed */
for (let i=0;i<5;i++){
  const pts = [];
  let x = rr(-8,8), z = rr(2.5,11);
  for (let k=0;k<5;k++){
    pts.push(new THREE.Vector3(x, CFG.floorY + 0.05, z));
    x += rr(-1.6,1.6); z += rr(-1.6,1.6);
  }
  const cv = new THREE.CatmullRomCurve3(pts);
  const vm = new THREE.MeshBasicMaterial({ color: i%2 ? 0x66f0ff : 0xffb15a, transparent:true, opacity:0.7 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(cv, 30, 0.05, 5, false), vm);
  tube.renderOrder = 4;
  underGroup.add(tube);
  anim.glowMats.push({ mat: vm, base: 0.45, amp: 0.32, sp: rr(0.4,1.0), ph: rr(0,6.28) });
}

/* glassy fire stones */
for (let i=0;i<16;i++){
  const a = rr(0,Math.PI*2), r = rr(2.3,4.8);
  const g = rockGeo(rr(0.16,0.38), 0, 0.35, i*7.3);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: i%3===0 ? 0xffc070 : 0xff7a22, transparent:true, opacity:0.9 }));
  m.position.set(0.2 + Math.cos(a)*r, CFG.floorY + 0.12, LZ + Math.sin(a)*r*0.8);
  m.renderOrder = 4;
  underGroup.add(m);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xff7a22, transparent:true, opacity:0.45, depthWrite:false, blending:THREE.AdditiveBlending }));
  gl.scale.setScalar(rr(0.8,1.6));
  gl.position.copy(m.position);
  gl.renderOrder = 4;
  underGroup.add(gl);
}

/* ancient beast skeleton */
const boneMat = new THREE.MeshToonMaterial({ color:0xeef6ff, emissive:0x5fc0e0, emissiveIntensity:1.5, gradientMap:G4 });
{
  const sk = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8.3, CFG.floorY + 0.32, 5.9),
    new THREE.Vector3(-6.5, CFG.floorY + 0.30, 4.6),
    new THREE.Vector3(-4.5, CFG.floorY + 0.28, 4.2),
    new THREE.Vector3(-2.7, CFG.floorY + 0.30, 4.7),
    new THREE.Vector3(-1.5, CFG.floorY + 0.32, 6.0)
  ]);
  const N = 9;
  const up = new THREE.Vector3(0,1,0);
  for (let i=0;i<=N;i++){
    const t = i/N;
    const P = curve.getPoint(t);
    const T = curve.getTangent(t).normalize();
    const side = new THREE.Vector3().crossVectors(T, up).normalize();
    const k = Math.sin(t*Math.PI);

    const vm = new THREE.Mesh(new THREE.SphereGeometry(0.115 + 0.05*k, 8, 6), boneMat);
    vm.position.copy(P);
    sk.add(vm);

    if (i%2===0){
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34 + 0.12*k, 5), boneMat);
      sp.position.copy(P).addScaledVector(up, 0.2);
      sk.add(sp);
    }
    if (i>=1 && i<=N-1){
      const hR = 0.62 + 0.78*k;
      const A = P.clone().addScaledVector(side, 0.46 + 0.25*k).addScaledVector(up, 0.04);
      const B = P.clone().addScaledVector(up, hR);
      const C = P.clone().addScaledVector(side, -(0.46 + 0.25*k)).addScaledVector(up, 0.04);
      const ribCurve = new THREE.QuadraticBezierCurve3(A, B, C);
      sk.add(new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 8, 0.042, 5, false), boneMat));
    }
  }

  const skull = new THREE.Group();
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), boneMat);
  cranium.scale.set(1.0, 0.85, 1.35);
  skull.add(cranium);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.75), boneMat);
  snout.position.set(0, -0.06, 0.62);
  skull.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.72), boneMat);
  jaw.position.set(0, -0.24, 0.58);
  jaw.rotation.x = 0.18;
  skull.add(jaw);
  [-1,1].forEach(s => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.85, 5), boneMat);
    horn.position.set(s*0.26, 0.30, 0.05);
    horn.rotation.set(-0.55, 0, s*0.45);
    skull.add(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), new THREE.MeshBasicMaterial({ color:0x8ff4ff }));
    eye.position.set(s*0.20, 0.05, 0.44);
    skull.add(eye);
  });
  skull.position.set(-8.75, CFG.floorY + 0.44, 6.3);
  skull.rotation.y = -2.30;
  sk.add(skull);
  underGroup.add(sk);

  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0x63e6ff, transparent:true, opacity:0.28, depthWrite:false, blending:THREE.AdditiveBlending }));
  gl.scale.set(9, 5, 1);
  gl.position.set(-5.0, CFG.floorY + 0.9, 5.0);
  gl.renderOrder = 4;
  underGroup.add(gl);
}

/* jellyfish crystals */
const jellyMats = [];
function jellyfish(x, y, z, s){
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color:0x9ff6ff, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false });
  jellyMats.push({ mat, base:0.8, amp:0.2, sp:rr(0.5,1.3), ph:rr(0,6.28) });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 7, 0, Math.PI*2, 0, Math.PI*0.55), mat);
  bell.scale.set(1, 0.85, 1);
  g.add(bell);
  for (let i=0;i<6;i++){
    const a = i/6*Math.PI*2;
    const len = rr(0.35,0.8);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, len, 4), mat);
    t.position.set(Math.cos(a)*0.10, -len/2 - 0.02, Math.sin(a)*0.10);
    t.rotation.z = Math.cos(a)*0.22;
    t.rotation.x = Math.sin(a)*0.22;
    g.add(t);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0x7fe8ff, transparent:true, opacity:0.45, depthWrite:false, blending:THREE.AdditiveBlending }));
  sp.scale.setScalar(1.1);
  g.add(sp);
  g.position.set(x, y, z);
  g.scale.setScalar(s*2.5);
  g.renderOrder = 4;
  underGroup.add(g);
}
const jellySpots = [
  [-6.4, -3.5, 1.15, 1.0], [-5.4, -2.9, 1.3, 0.8], [-7.3, -4.1, 1.2, 0.7],
  [0.9, -3.9, 1.35, 1.15], [0.0, -3.3, 1.3, 0.8], [1.9, -4.2, 1.3, 0.75],
  [6.6, -3.4, 1.0, 0.95], [5.7, -2.8, 1.2, 0.75], [7.6, -3.9, 1.1, 0.8],
  [-9.1, -4.2, 0.95, 0.9], [-8.4, -3.6, 1.1, 0.65],
  [-2.4, -4.6, 4.0, 0.7], [3.2, -4.7, 4.6, 0.6], [-8.2, -4.5, 8.0, 0.65],
  [-5.6, -2.6, 10.4, 0.85], [-1.2, -2.1, 11.2, 0.7], [3.4, -2.8, 10.8, 0.8],
  [7.2, -2.3, 9.8, 0.7], [-8.6, -1.9, 10.9, 0.75]
];
jellySpots.forEach(j => jellyfish(j[0], j[1], j[2], j[3]));

/* coins */
{
  const coinGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.028, 9);
  const coinMat = new THREE.MeshToonMaterial({ color:0xffcf72, emissive:0x6b3f08, emissiveIntensity:0.55, gradientMap:G3 });
  const coins = new THREE.InstancedMesh(coinGeo, coinMat, 64);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i=0;i<64;i++){
    const a = rr(0,Math.PI*2), r = rr(1.9, 9.2);
    pos.set(0.2 + Math.cos(a)*r, CFG.floorY + 0.03, LZ + Math.sin(a)*r*0.62);
    e.set(rr(-0.2,0.2), rr(0,6.28), rr(-0.2,0.2));
    q.setFromEuler(e);
    sc.setScalar(rr(0.8,1.5));
    mtx.compose(pos, q, sc);
    coins.setMatrixAt(i, mtx);
  }
  coins.instanceMatrix.needsUpdate = true;
  coins.castShadow = false;
  underGroup.add(coins);
}

/* bubbles */
{
  const count = 240;
  const pos = new Float32Array(count*3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i=0;i<count;i++){
    const a = rr(0,Math.PI*2), r = rr(0.4, 7.4);
    pos[i*3] = 0.2 + Math.cos(a)*r * (r<2.8?0.55:1);
    pos[i*3+1] = rr(CFG.floorY, CFG.iceY);
    pos[i*3+2] = LZ + Math.sin(a)*r*0.72;
    seed[i] = rnd();
    size[i] = rr(2.0, 7.0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));
  g.setAttribute('aSize', new THREE.BufferAttribute(size,1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 }, uTex:{ value:bubbleTex }, uTop:{ value:CFG.iceY }, uBot:{ value:CFG.floorY } },
    vertexShader: `
      attribute float aSeed; attribute float aSize;
      uniform float uTime, uTop, uBot;
      varying float vA;
      void main(){
        vec3 p = position;
        float span = uTop - uBot;
        float sp = 0.32 + aSeed*0.55;
        float y = mod(p.y - uBot + uTime*sp, span);
        p.y = uBot + y;
        p.x += sin(uTime*0.7 + aSeed*18.0) * 0.16;
        p.z += cos(uTime*0.55 + aSeed*11.0) * 0.16;
        vA = smoothstep(0.0, 0.55, y/span) * smoothstep(1.0, 0.82, y/span);
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = aSize * (26.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex;
      varying float vA;
      void main(){
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(t.rgb, t.a * vA * 0.95);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = 1;
  underGroup.add(pts);
  anim.bubbles = m;
}

/* =========================================================
   12. FLOATING VOLCANO ISLAND
   ========================================================= */
const islandGroup = new THREE.Group();
islandGroup.position.set(CFG.islandX, CFG.islandY, CFG.islandZ);
world.add(islandGroup);
anim.islandGroup = islandGroup;
anim.islandBaseY = CFG.islandY;

/* body */
{
  const g = new THREE.CylinderGeometry(4.5, 1.05, 5.2, 15, 6, false);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    const rad = Math.hypot(v.x, v.z);
    if (rad > 0.05){
      const a = Math.atan2(v.z, v.x);
      const k = 1 + (n3(Math.cos(a)*2.4+3, v.y*0.9, Math.sin(a)*2.4-1)-0.5)*0.62;
      v.x *= k; v.z *= k;
      v.y += (n3(v.x*0.7, v.y*0.7+5, v.z*0.7)-0.5)*0.42;
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const body = toon(g, 0x3b2f4c, { varr:0.10, ow:1.25 });
  islandGroup.add(body);

  for (let i=0;i<10;i++){
    const a = i/10*Math.PI*2 + rr(-0.2,0.2);
    const r = rr(0.4, 2.4);
    const h = rr(1.6, 4.4);
    const sp = toon(spikeGeo(6, 0.35), 0x2a2138, { varr:0.09, ow:0.9 });
    sp.scale.set(rr(0.5,1.1), h, rr(0.5,1.1));
    sp.rotation.x = Math.PI;
    sp.position.set(Math.cos(a)*r, -2.55 - h*0.42, Math.sin(a)*r);
    islandGroup.add(sp);
  }
}

/* top dome */
{
  const g = new THREE.SphereGeometry(4.5, 20, 8, 0, Math.PI*2, 0, Math.PI*0.30);
  g.translate(0, -4.5*Math.cos(Math.PI*0.30), 0);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    v.y *= 0.42;
    v.x *= 1 + (n3(v.x*0.6, 1, v.z*0.6)-0.5)*0.06;
    v.z *= 1 + (n3(v.x*0.6, 3, v.z*0.6)-0.5)*0.06;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const dome = toon(g, 0x45344a, { varr:0.12, ow:1.0 });
  dome.position.y = 2.58;
  islandGroup.add(dome);

  for (let i=0;i<5;i++){
    const pts = [];
    let x = rr(-2.6,2.6), z = rr(-2.6,2.6);
    for (let k=0;k<4;k++){
      pts.push(new THREE.Vector3(x, 2.35 + rr(0,0.12), z));
      x += rr(-1.2,1.2); z += rr(-1.2,1.2);
    }
    const c = new THREE.CatmullRomCurve3(pts);
    const vm = new THREE.MeshBasicMaterial({ color:0xff7a2a, transparent:true, opacity:0.9 });
    const tb = new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.055, 5, false), vm);
    islandGroup.add(tb);
    anim.glowMats.push({ mat:vm, base:0.5, amp:0.38, sp:rr(0.6,1.6), ph:rr(0,6.28) });
  }
}

/* volcano cone */
{
  const g = new THREE.CylinderGeometry(0.52, 2.5, 2.7, 11, 3, false);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    const rad = Math.hypot(v.x, v.z);
    if (rad > 0.02){
      const a = Math.atan2(v.z, v.x);
      const k = 1 + (n3(Math.cos(a)*3+7, v.y*1.4, Math.sin(a)*3)-0.5)*0.16;
      v.x *= k; v.z *= k;
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const cone = toon(g, 0x241c2c, { varr:0.08, ow:1.15 });
  cone.position.y = 3.95;
  islandGroup.add(cone);

  const rimM = toon(new THREE.TorusGeometry(0.56, 0.13, 6, 18), 0x1e1726, { varr:0.08, ow:0.8 });
  rimM.rotation.x = Math.PI/2;
  rimM.position.y = 5.32;
  islandGroup.add(rimM);

  const lavaTop = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color:0xffc06a }));
  lavaTop.rotation.x = -Math.PI/2;
  lavaTop.position.y = 5.30;
  islandGroup.add(lavaTop);

  const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xff8a2a, transparent:true, opacity:0.55, depthWrite:false, blending:THREE.AdditiveBlending }));
  lg.scale.setScalar(2.8);
  lg.position.y = 5.45;
  islandGroup.add(lg);
  anim.craterGlow = lg;
}

/* lava river + fire waterfall : ONE continuous stream */
const lavaCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.30, 5.22, 0.40),
  new THREE.Vector3(0.85, 4.62, 1.45),
  new THREE.Vector3(1.45, 3.62, 2.60),
  new THREE.Vector3(1.62, 3.02, 3.85),
  new THREE.Vector3(1.60, 2.78, 4.60),
  new THREE.Vector3(1.63, 2.58, 5.30),
  new THREE.Vector3(1.62, 2.42, 5.92),
  new THREE.Vector3(1.63, 2.10, 5.96),
  new THREE.Vector3(1.62, 1.20, 5.86),
  new THREE.Vector3(1.66, -0.70, 5.46),
  new THREE.Vector3(1.16, -3.40, 5.32),
  new THREE.Vector3(0.82, -6.60, 5.14),
  new THREE.Vector3(0.98, -9.80, 5.04),
  new THREE.Vector3(1.20, -11.85, 5.00)
]);
const fallOnly = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.63, 2.02, 5.97),
  new THREE.Vector3(1.62, 1.20, 5.86),
  new THREE.Vector3(1.66, -0.70, 5.46),
  new THREE.Vector3(1.16, -3.40, 5.32),
  new THREE.Vector3(0.82, -6.60, 5.14),
  new THREE.Vector3(0.98, -9.80, 5.04),
  new THREE.Vector3(1.20, -11.85, 5.00)
]);
{
  const rm = flowMat(0x4a0e00, 0xff5a10, 0xffe6b8, { speed:2.1, scale:2.0, uvx:3, uvy:13, rim:0.62 });
  const lavaR = (t) => {
    let r;
    if (t < 0.345){
      r = 0.13 + 0.09 * (t / 0.345);
    } else {
      const u = (t - 0.345) / 0.655;
      r = 0.22 + 0.055*Math.sin(u*Math.PI) + 0.30*smoothstep(0.60, 1.0, u);
    }
    const wob = 1 + Math.sin(t*52.0) * 0.030 * smoothstep(0.345, 0.42, t);
    return r * wob;
  };
  const lava = new THREE.Mesh(taperedTube(lavaCurve, 0.2, 0.2, 210, 16, lavaR), rm);
  lava.renderOrder = 8;
  islandGroup.add(lava);
  anim.flowMats.push(rm);

  // rock lip the lava pours over
  {
    const lip = toon(rockGeo(1.0, 1, 0.34, 91, 0.35), 0x3e3254, { varr:0.10, ow:1.0 });
    lip.position.set(1.52, 1.96, 4.86);
    lip.scale.set(1.45, 0.46, 0.78);
    lip.rotation.set(-0.04, 0.10, 0.03);
    islandGroup.add(lip);

    const lip2 = toon(rockGeo(0.66, 0, 0.45, 41), 0x362b4a, { varr:0.10, ow:0.85 });
    lip2.position.set(1.50, 1.96, 3.95);
    lip2.scale.set(1.15, 0.68, 0.82);
    islandGroup.add(lip2);

  }

  const rg = hazeMat(0xff6a1e, { opacity:0.20, speed:1.2, scale:1.8 });
  const rgl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 4.4, 12, 1, true), rg);
  rgl.rotation.z = 0.34;
  rgl.position.set(1.2, 3.5, 2.6);
  rgl.renderOrder = 5;
  islandGroup.add(rgl);
  anim.hazeMats.push(rg);
}

/* heat spirals */
for (let i=0;i<3;i++){
  const pts = [];
  for (let k=0;k<=40;k++){
    const t = k/40;
    const a = t*Math.PI*2.4 + i*2.1;
    const r = 1.0 + t*2.3;
    pts.push(new THREE.Vector3(Math.cos(a)*r, 2.4 + t*3.2, Math.sin(a)*r));
  }
  const c = new THREE.CatmullRomCurve3(pts);
  const hm = hazeMat(0xff4a12, { opacity:0.12, speed:0.6, scale:2.6 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.10, 6, false), hm);
  tube.renderOrder = 6;
  islandGroup.add(tube);
  anim.hazeMats.push(hm);
}

/* floating debris */
for (let i=0;i<6;i++){
  const a = rr(0,Math.PI*2);
  const rad = rr(6.4, 9.2);
  const m = toon(rockGeo(rr(0.55,1.35), 1, 0.38, i*9.1), i%2 ? 0x3b3050 : 0x453a5c, { varr:0.09, ow:0.85 });
  m.position.set(CFG.islandX + Math.cos(a)*rad, CFG.islandY + rr(-3.4, 4.4), CFG.islandZ + Math.sin(a)*rad*0.85);
  m.rotation.set(rr(0,3), rr(0,3), rr(0,3));
  world.add(m);
  anim.debris.push({ mesh:m, baseY:m.position.y, ph:rr(0,6.28), amp:rr(0.10,0.28), sp:rr(0.3,0.7) });

  if (i%3===0){
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xff7a2a, transparent:true, opacity:0.4, depthWrite:false, blending:THREE.AdditiveBlending }));
    gl.scale.setScalar(rr(1.6,2.6));
    gl.position.copy(m.position).add(new THREE.Vector3(0,-0.6,0));
    world.add(gl);
  }
}

/* =========================================================
   13. FIRE WATERFALL
   ========================================================= */
{
  const sm = hazeMat(0xff7a24, { opacity:0.10, speed:1.8, scale:2.2 });
  const spray = new THREE.Mesh(taperedTube(fallOnly, 0.62, 1.15, 80, 14), sm);
  spray.renderOrder = 8;
  islandGroup.add(spray);
  anim.hazeMats.push(sm);

  const cm = flowMat(0xff9a3a, 0xffd88a, 0xffffff, { speed:3.0, scale:3.6, uvx:2, uvy:18, rim:0.4, alpha:0.62 });
  const core = new THREE.Mesh(taperedTube(fallOnly, 0.09, 0.19, 80, 10), cm);
  core.renderOrder = 9;
  islandGroup.add(core);
  anim.flowMats.push(cm);
}

const lavaDrops = [];
{
  const dg = new THREE.SphereGeometry(0.085, 6, 5);
  for (let i=0;i<18;i++){
    const m = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color:0xffc070, transparent:true, opacity:0.9 }));
    m.userData.ph = rnd();
    m.userData.sp = rr(0.10, 0.20);
    m.userData.off = new THREE.Vector3(rr(-0.55,0.55), rr(-0.2,0.2), rr(-0.45,0.45));
    m.renderOrder = 9;
    islandGroup.add(m);
    lavaDrops.push(m);
  }
}

/* impact */
const impact = new THREE.Vector3(CFG.holeX, CFG.iceY + 0.05, CFG.holeZ);

{
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xff8a3a, transparent:true, opacity:0.34, depthWrite:false, blending:THREE.AdditiveBlending }));
  sp.scale.set(6.5, 6.5, 1);
  sp.position.set(impact.x, impact.y + 0.6, impact.z);
  sp.renderOrder = 12;
  world.add(sp);
}

{
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1.95, 40),
    new THREE.MeshBasicMaterial({ map:glowTex, color:0xffa860, transparent:true, opacity:0.72, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  m.rotation.x = -Math.PI/2;
  m.position.copy(impact);
  m.renderOrder = 12;
  world.add(m);
  anim.splashDisc = m;
}

for (let i=0;i<3;i++){
  const mat = new THREE.MeshBasicMaterial({ color:0xffc08a, transparent:true, opacity:0.0, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.055, 6, 60), mat);
  ring.rotation.x = Math.PI/2;
  ring.position.copy(impact).add(new THREE.Vector3(0, 0.04, 0));
  ring.renderOrder = 13;
  world.add(ring);
  anim.rings.push({ mesh:ring, mat, ph:i/3, speed:0.34 });
}

for (let i=0;i<18;i++){
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:cloudTex, color:0xffd2b0, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }));
  sp.position.copy(impact);
  sp.scale.setScalar(1);
  sp.renderOrder = 13;
  world.add(sp);
  anim.steam.push({ sp, ph:rnd(), speed:rr(0.18,0.34), amp:rr(0.6,1.6), rot:rr(0,6.28) });
}

{
  const count = 60;
  const pos = new Float32Array(count*3);
  const seed = new Float32Array(count);
  for (let i=0;i<count;i++){ pos[i*3]=0; pos[i*3+1]=0; pos[i*3+2]=0; seed[i]=rnd(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 }, uOrigin:{ value: impact.clone() }, uTex:{ value:softTex } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime; uniform vec3 uOrigin;
      varying float vA;
      void main(){
        float life = fract(uTime*0.42 + aSeed);
        vec3 p = uOrigin;
        float a = aSeed*6.2831;
        float r = 0.3 + life*2.6;
        p.x += cos(a)*r*(0.6+aSeed*0.5);
        p.z += sin(a)*r*(0.6+aSeed*0.5);
        p.y += life*3.4 - life*life*1.1;
        vA = (1.0-life)*0.95;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = (2.0 + aSeed*4.0) * (60.0 / max(1.0,-mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; varying float vA;
      void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(1.0,0.62,0.22), t.a*vA); }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = 13;
  world.add(pts);
  anim.sparks = m;
}

/* =========================================================
   14. ICE SPIKES / TREES / CHAINS / SHARDS
   ========================================================= */
const spikeMatA = crystalMat(0xe8fbff, 0x3f8fc4, 0.03);
const spikeMatB = crystalMat(0xd6f4ff, 0x2a6fa8, 0.05);

for (let i=0;i<9;i++){
  const x = rr(-10.5, 10.5);
  const z = rr(-11.5, -1.2);
  const h = rr(1.8, 4.6);
  const m = new THREE.Mesh(spikeGeo(ri(4,6), 0.35), i%2 ? spikeMatA : spikeMatB);
  m.scale.set(rr(0.42,0.95), h, rr(0.42,0.95));
  m.position.set(x, CFG.cliffTop + cliffHeight(x,z) - 0.12, z);
  m.rotation.z = rr(-0.10,0.10);
  m.rotation.x = rr(-0.10,0.10);
  m.castShadow = true;
  baseGroup.add(m);
  addOutline(m, 0.7);
}

for (let i=0;i<10;i++){
  const side = i%2 ? 1 : -1;
  const x = side * rr(6.4, 10.0);
  const z = rr(1.8, 11.8);
  const h = rr(0.7, 2.0);
  const m = new THREE.Mesh(spikeGeo(ri(4,6), 0.4), i%3 ? spikeMatB : spikeMatA);
  m.scale.set(rr(0.22,0.48), h, rr(0.22,0.48));
  m.position.set(x, CFG.iceY - 0.05, z);
  m.rotation.z = rr(-0.2,0.2);
  baseGroup.add(m);
  addOutline(m, 0.5);
}

for (let i=0;i<12;i++){
  const side = i%2 ? 1 : -1;
  const x = side * rr(7.0, 10.2);
  const z = rr(1.2, 12.0);
  const m = toon(new THREE.CylinderGeometry(rr(0.6,1.5), rr(0.5,1.3), 0.10, 7, 1), 0x93c2da, { varr:0.05, ow:0.5, cast:false });
  m.position.set(x, CFG.iceY + 0.02, z);
  m.rotation.y = rr(0,3);
  baseGroup.add(m);
}

for (let i=0;i<20;i++){
  const a = rr(0,Math.PI*2);
  const r = rr(2.9, 9.6);
  const m = toon(spikeGeo(ri(3,5), 0.5), 0x151022, { varr:0.06, hue:0.02, ow:0.6 });
  m.scale.set(rr(0.10,0.26), rr(0.28,0.75), rr(0.10,0.26));
  m.position.set(CFG.holeX + Math.cos(a)*r, CFG.iceY + 0.02, LZ + Math.sin(a)*r*0.78);
  m.rotation.set(rr(-0.25,0.25), rr(0,6.28), rr(-0.25,0.25));
  m.castShadow = false;
  baseGroup.add(m);
}

/* crystal trees */
function crystalTree(x, z, baseY, scale, mirror){
  const grp = new THREE.Group();
  const trunkPts = [];
  let tx = 0, tz = 0;
  for (let k=0;k<4;k++){
    trunkPts.push(new THREE.Vector3(tx, k*0.62, tz));
    tx += rr(-0.16,0.16); tz += rr(-0.16,0.16);
  }
  const tc = new THREE.CatmullRomCurve3(trunkPts);
  grp.add(toon(taperedTube(tc, 0.20, 0.08, 20, 7), 0x2b2138, { varr:0.08, ow:0.8 }));

  const warmMat = new THREE.MeshBasicMaterial({ color:0xff8a2e, transparent:true, opacity:0.95 });
  const coolMat = new THREE.MeshBasicMaterial({ color:0x7ff0ff, transparent:true, opacity:0.95 });
  anim.glowMats.push({ mat:warmMat, base:0.75, amp:0.25, sp:rr(0.5,1.1), ph:rr(0,6.28) });
  anim.glowMats.push({ mat:coolMat, base:0.75, amp:0.25, sp:rr(0.5,1.1), ph:rr(0,6.28) });

  const n = 9;
  for (let i=0;i<n;i++){
    const a = (i/n)*Math.PI*2 + rr(-0.3,0.3);
    const isWarm = (Math.cos(a)*mirror > 0);
    const len = rr(0.7,1.5);
    const m = new THREE.Mesh(spikeGeo(ri(3,5), 0.45), isWarm ? warmMat : coolMat);
    m.scale.set(rr(0.09,0.16), len, rr(0.09,0.16));
    m.position.set(Math.cos(a)*rr(0.1,0.42), rr(1.6,2.4), Math.sin(a)*rr(0.1,0.42));
    m.rotation.z = -Math.cos(a)*rr(0.5,1.0);
    m.rotation.x = Math.sin(a)*rr(0.5,1.0);
    grp.add(m);
  }
  const tm = new THREE.Mesh(spikeGeo(5, 0.3), new THREE.MeshBasicMaterial({ color:0xffd9a0 }));
  tm.scale.set(0.14, 1.7, 0.14);
  tm.position.y = 2.35;
  grp.add(tm);

  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xffb070, transparent:true, opacity:0.38, depthWrite:false, blending:THREE.AdditiveBlending }));
  gl.scale.setScalar(3.4);
  gl.position.y = 1.9;
  grp.add(gl);

  grp.position.set(x, baseY, z);
  grp.scale.setScalar(scale);
  baseGroup.add(grp);
}
crystalTree(-8.6, 10.4, CFG.iceY + 0.05, 1.0, 1);
crystalTree(8.4, 8.8, CFG.iceY + 0.05, 0.85, -1);
crystalTree(-7.2, 2.2, CFG.iceY + 0.05, 0.7, -1);

/* frozen chains */
function makeChain(a, b, sag, links, scale){
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const c = new THREE.CatmullRomCurve3([a, mid, b]);
  const mat = new THREE.MeshToonMaterial({ color:0xbfeaff, emissive:0x1f6f96, emissiveIntensity:0.8, gradientMap:G3 });
  const geo = new THREE.TorusGeometry(0.17*scale, 0.055*scale, 6, 12);
  const grp = new THREE.Group();
  const up = new THREE.Vector3(0,0,1);
  for (let i=0;i<links;i++){
    const t = i/(links-1);
    const P = c.getPoint(t);
    const T = c.getTangent(t).normalize();
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(P);
    m.quaternion.setFromUnitVectors(up, T);
    m.rotateZ((i%2) * Math.PI/2 + Math.PI/2);
    grp.add(m);
  }
  baseGroup.add(grp);
}
makeChain(new THREE.Vector3(-8.6, 6.35, -0.6), new THREE.Vector3(-5.55, 12.85, 2.15), 1.35, 26, 1.0);
makeChain(new THREE.Vector3(6.6, 6.6, -2.2), new THREE.Vector3(3.55, 12.80, 5.05), 1.1, 20, 0.85);

/* =========================================================
   15. CLOUD SEA
   ========================================================= */
{
  for (let i=0;i<18;i++){
    const mat = new THREE.SpriteMaterial({
      map: cloudTex,
      color: i%5===0 ? 0xffd0b0 : 0xbfe6ff,
      transparent: true,
      opacity: rr(0.05, 0.10),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sp = new THREE.Sprite(mat);
    const a = rr(0, Math.PI*2);
    const rad = rr(1.5, 8.5);
    sp.position.set(Math.cos(a)*rad, rr(9.0, 11.4), 3.8 + Math.sin(a)*rad*0.6);
    sp.scale.setScalar(rr(2.8, 6.0));
    sp.renderOrder = 30;
    world.add(sp);
    anim.clouds.push({ sprite: sp, baseX: sp.position.x, ph: rr(0,6.28), amp: rr(0.25,0.8), baseOp: mat.opacity, spd: rr(0.15,0.4) });
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0x1e6f9a, transparent:true, opacity:0.34, depthWrite:false, blending:THREE.AdditiveBlending }));
  halo.scale.set(70, 60, 1);
  halo.position.set(-4, 8, -26);
  halo.renderOrder = 29;
  world.add(halo);
}

/* =========================================================
   16. SNOW
   ========================================================= */
{
  const count = 620;
  const pos = new Float32Array(count*3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i=0;i<count;i++){
    pos[i*3] = rr(-17,17);
    pos[i*3+1] = rr(-8,20);
    pos[i*3+2] = rr(-17,17);
    seed[i] = rnd();
    size[i] = rr(1.2, 3.6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));
  g.setAttribute('aSize', new THREE.BufferAttribute(size,1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 }, uTex:{ value:softTex } },
    vertexShader: `
      attribute float aSeed; attribute float aSize;
      uniform float uTime;
      varying float vA;
      void main(){
        vec3 p = position;
        float sp = 0.35 + aSeed*0.55;
        p.y = mod(position.y + 8.0 - uTime*sp, 28.0) - 8.0;
        p.x += sin(uTime*0.5 + aSeed*22.0) * 0.55;
        p.z += cos(uTime*0.42 + aSeed*15.0) * 0.55;
        float d = length(p.xz - vec2(0.2, 7.2));
        float near = smoothstep(4.6, 1.1, d) * smoothstep(-1.0, 7.0, p.y);
        vA = 1.0 - near*0.96;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = aSize * (110.0 / max(1.0,-mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; varying float vA;
      void main(){
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(vec3(0.86,0.95,1.0), t.a * vA * 0.85);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = 25;
  world.add(pts);
  anim.snow = m;
}

/* =========================================================
   17. TWO-TONE STREAM ALONG BASE EDGE
   ========================================================= */
{
  const pts = [
    new THREE.Vector3(-12.05, 0.14, -11.6),
    new THREE.Vector3(-12.05, 0.14, -5.0),
    new THREE.Vector3(-12.05, 0.14, 1.5),
    new THREE.Vector3(-11.95, 0.12, 6.2),
    new THREE.Vector3(-11.2, 0.05, 9.4),
    new THREE.Vector3(-10.45, -0.38, 10.4)
  ];
  const c = new THREE.CatmullRomCurve3(pts);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime:{ value:0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: NOISE + `
      uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float t = vUv.y;
        vec3 cold = vec3(0.35,0.92,1.0);
        vec3 warm = vec3(1.0,0.42,0.10);
        vec3 col = mix(cold, warm, smoothstep(0.30, 0.88, t));
        float flow = fbm(vec2(vUv.x*4.0, vUv.y*10.0 - uTime*1.1));
        col *= 0.55 + flow*0.9;
        float edge = sin(vUv.x*3.14159);
        col += vec3(0.6,0.9,1.0) * pow(edge, 6.0) * 0.6;
        gl_FragColor = vec4(col, 0.92);
      }`,
    transparent:true, depthWrite:false, side:THREE.DoubleSide
  });
  const stream = new THREE.Mesh(taperedTube(c, 0.42, 0.30, 90, 10), mat);
  stream.renderOrder = 6;
  baseGroup.add(stream);
  anim.flowMats.push(mat);

  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:0xff8a3a, transparent:true, opacity:0.32, depthWrite:false, blending:THREE.AdditiveBlending }));
  gl.scale.set(5.0, 5.0, 1);
  gl.position.set(-11.4, 0.15, 7.4);
  baseGroup.add(gl);
}

/* small frozen pool on the right ledge */
{
  const pg = new THREE.CylinderGeometry(1.55, 1.4, 0.10, 9, 1);
  const pm = toon(pg, 0x8fc4dc, { varr:0.04, ow:0.5, cast:false });
  pm.position.set(11.7, 0.09, 9.4);
  baseGroup.add(pm);
  for (let i=0;i<5;i++){
    const rk = toon(rockGeo(rr(0.22,0.42), 0, 0.4, i*6.1), 0x6f9cba, { varr:0.08, ow:0.45, cast:false });
    rk.position.set(11.7 + Math.cos(i*1.3)*1.7, 0.07, 9.4 + Math.sin(i*1.3)*1.5);
    rk.scale.y = 0.45;
    baseGroup.add(rk);
  }
}

/* contact shadow */
{
  const sh = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshBasicMaterial({ map: glowTex, color:0x04040c, transparent:true, opacity:0.42, depthWrite:false })
  );
  sh.rotation.x = -Math.PI/2;
  sh.position.set(0.4, CFG.iceY + 0.02, LZ - 0.4);
  sh.renderOrder = 11;
  baseGroup.add(sh);
}

/* =========================================================
   18. POST PROCESSING
   ========================================================= */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.45, 0.92);
composer.addPass(bloom);

const vignette = new ShaderPass({
  uniforms: { tDiffuse:{ value:null }, uStrength:{ value:0.78 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uStrength; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(vec3(lum), c.rgb, 1.14);
      c.rgb += vec3(0.0015, 0.0026, 0.0080) * (1.0 - smoothstep(0.0, 0.22, lum));
      vec2 p = vUv - 0.5;
      float d = length(p * vec2(1.02, 1.0));
      float v = smoothstep(0.88, 0.22, d);
      c.rgb *= mix(1.0, v, uStrength);
      gl_FragColor = c;
    }`
});
composer.addPass(vignette);
composer.addPass(new OutputPass());

/* =========================================================
   19. ANIMATION
   ========================================================= */
const clock = new THREE.Clock();

function animate(){
  const t = clock.getElapsedTime();

  for (const m of anim.flowMats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
  for (const m of anim.hazeMats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
  for (const m of anim.iceMats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
  if (anim.bubbles) anim.bubbles.uniforms.uTime.value = t;
  if (anim.snow) anim.snow.uniforms.uTime.value = t;
  if (anim.sparks) anim.sparks.uniforms.uTime.value = t;

  const ig = anim.islandGroup;
  ig.position.y = anim.islandBaseY + Math.sin(t*0.55)*0.09;
  ig.rotation.z = Math.sin(t*0.31)*0.005;
  ig.rotation.x = Math.cos(t*0.26)*0.004;

  if (anim.craterGlow){
    const k = 1 + Math.sin(t*2.1)*0.06;
    anim.craterGlow.scale.set(4.2*k, 4.2*k, 1);
  }

  for (const d of anim.debris){
    d.mesh.position.y = d.baseY + Math.sin(t*d.sp + d.ph)*d.amp;
    d.mesh.rotation.y += 0.0012;
  }

  for (const g of anim.glowMats){
    if (g.mat.opacity !== undefined){
      g.mat.opacity = clamp(g.base * (1 + Math.sin(t*g.sp + g.ph)*g.amp), 0, 1);
    }
  }
  for (const j of jellyMats){
    j.mat.opacity = clamp(j.base * (1 + Math.sin(t*j.sp + j.ph)*j.amp), 0, 1);
  }

  for (const r of anim.rings){
    const k = ((t*r.speed) + r.ph) % 1;
    const s = 0.55 + k*3.2;
    r.mesh.scale.set(s, s, 1);
    r.mat.opacity = (1-k) * 0.18 * smoothstep(0.0, 0.12, k);
  }

  for (const s of anim.steam){
    const k = ((t*s.speed) + s.ph) % 1;
    s.sp.position.set(
      impact.x + Math.sin(t*0.6 + s.rot)*k*s.amp*1.3,
      impact.y + k*4.6,
      impact.z + Math.cos(t*0.5 + s.rot)*k*s.amp*1.3
    );
    const sc = 0.9 + k*3.4;
    s.sp.scale.set(sc, sc, 1);
    s.sp.material.opacity = (1-k)*0.34*smoothstep(0.0,0.2,k);
  }

  if (anim.splashDisc){
    const k = 1 + Math.sin(t*3.2)*0.05;
    anim.splashDisc.scale.set(k, k, 1);
  }

  for (const d of lavaDrops){
    const k = (t*d.userData.sp + d.userData.ph) % 1;
    const p = fallOnly.getPointAt(k);
    d.position.set(p.x + d.userData.off.x, p.y + d.userData.off.y, p.z + d.userData.off.z);
    d.scale.setScalar(0.55 + k*1.5);
    d.material.opacity = (1-k*0.85)*0.85;
  }

  for (const c of anim.clouds){
    c.sprite.position.x = c.baseX + Math.sin(t*c.spd*0.5 + c.ph)*c.amp;
    c.sprite.material.opacity = c.baseOp * (1 + Math.sin(t*c.spd*0.7 + c.ph)*0.18);
  }

  controls.update();
  composer.render();
}

// ---- warm-up: compile every shader and draw a few frames before showing ----
controls.update();
camera.updateMatrixWorld(true);
try { renderer.compile(scene, camera); } catch (e) { /* ignore */ }
composer.render();
composer.render();

const canvasEl = renderer.domElement;
requestAnimationFrame(() => {
  composer.render();
  canvasEl.style.opacity = '1';
  renderer.setAnimationLoop(animate);
});
// safety net: if rAF is throttled (hidden iframe/tab), still reveal the canvas
setTimeout(() => { canvasEl.style.opacity = '1'; }, 1200);

// ---- resize: update the canvas at once, rebuild post targets on a debounce ----
let rzTimer = null;
let rzW = window.innerWidth, rzH = window.innerHeight;
function applyResize(){
  rzTimer = null;
  const w = window.innerWidth, h = window.innerHeight;
  if (w === rzW && h === rzH) return;
  rzW = w; rzH = h;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w, h);
  composer.render();
}
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.render();            // never let a freshly-cleared buffer reach the screen
  if (rzTimer) clearTimeout(rzTimer);
  rzTimer = setTimeout(applyResize, 110);
});
