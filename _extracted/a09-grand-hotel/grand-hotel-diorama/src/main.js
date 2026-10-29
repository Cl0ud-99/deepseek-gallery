import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createBase } from './base.js';
import { createHotel } from './hotel.js';
import { createProps } from './props.js';
import { createSky, createSnow, SteamSystem } from './atmosphere.js';

/* ================================================================== *
 *  renderer / scene / camera
 * ================================================================== */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcf93aa, 0.0009);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1400);
camera.position.set(163, 138, 163);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 70;
controls.maxDistance = 430;
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = 1.50;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.85;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

let idleTimer = null;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  if (idleTimer) clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { controls.autoRotate = true; }, 7000);
});

/* ================================================================== *
 *  lighting
 * ================================================================== */
scene.add(new THREE.HemisphereLight(0xffc9dd, 0x6b4d63, 0.38));
scene.add(new THREE.AmbientLight(0xffd9e6, 0.06));

const key = new THREE.DirectionalLight(0xfff0d8, 1.86);
key.position.set(72, 128, 96);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -92;
key.shadow.camera.right = 92;
key.shadow.camera.top = 96;
key.shadow.camera.bottom = -78;
key.shadow.camera.near = 1;
key.shadow.camera.far = 420;
key.shadow.bias = -0.0009;
key.shadow.normalBias = 0.9;
key.shadow.radius = 2.4;
scene.add(key);
scene.add(key.target);
key.target.position.set(0, 2, 0);

const fill = new THREE.DirectionalLight(0xbcd9ff, 0.30);
fill.position.set(-96, 62, -54);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffb083, 0.42);
rim.position.set(-40, 46, -120);
scene.add(rim);

const cliffFill = new THREE.DirectionalLight(0xffd9e4, 0.55);
cliffFill.position.set(10, -6, 190);
cliffFill.target.position.set(0, -18, 40);
scene.add(cliffFill);
scene.add(cliffFill.target);

/* ================================================================== *
 *  the diorama
 * ================================================================== */
const sky = createSky();
sky.userData.noPrepass = true;
scene.add(sky);

const base = createBase();
scene.add(base);

const hotel = createHotel();
hotel.group.scale.setScalar(1.18);
scene.add(hotel.group);

const props = createProps();
scene.add(props.group);

const snow = createSnow(3200);
scene.add(snow.points);

const steam = new SteamSystem(54);
for (const p of steam.pool) scene.add(p.s);

/* ================================================================== *
 *  post processing — cel outline / bloom / film
 * ================================================================== */
const size = new THREE.Vector2();
renderer.getDrawingBufferSize(size);

let depthTex = new THREE.DepthTexture(size.x, size.y, THREE.UnsignedIntType);
depthTex.format = THREE.DepthFormat;
let normalRT = new THREE.WebGLRenderTarget(size.x, size.y, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  depthBuffer: true,
  depthTexture: depthTex,
});
const normalMat = new THREE.MeshNormalMaterial();

const OutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tNormal: { value: normalRT.texture },
    tDepth: { value: depthTex },
    resolution: { value: new THREE.Vector2(size.x, size.y) },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
    lineColor: { value: new THREE.Color(0x452637) },
    strength: { value: 0.92 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D tNormal;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec3 lineColor;
    uniform float strength;
    varying vec2 vUv;

    float linDepth(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      float z = d * 2.0 - 1.0;
      return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
    }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }

    void main(){
      vec2 px = 1.7 / resolution;
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      float d0 = linDepth(vUv);
      vec3 n0 = nrm(vUv);

      float dl = linDepth(vUv - vec2(px.x, 0.0));
      float dr = linDepth(vUv + vec2(px.x, 0.0));
      float du = linDepth(vUv - vec2(0.0, px.y));
      float dd = linDepth(vUv + vec2(0.0, px.y));
      float lap = abs(dl + dr - 2.0 * d0) + abs(du + dd - 2.0 * d0);
      float edgeD = smoothstep(0.34, 1.5, lap / max(d0 * 0.055, 1.0));

      float nd = max(max(1.0 - dot(n0, nrm(vUv - vec2(px.x,0.0))), 1.0 - dot(n0, nrm(vUv + vec2(px.x,0.0)))),
                     max(1.0 - dot(n0, nrm(vUv - vec2(0.0,px.y))), 1.0 - dot(n0, nrm(vUv + vec2(0.0,px.y)))));
      float edgeN = smoothstep(0.16, 0.42, nd);

      float e = clamp(max(edgeD, edgeN) * strength, 0.0, 1.0);
      gl_FragColor = vec4(mix(base, lineColor, e), 1.0);
    }`,
};

const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.045 },
    vignette: { value: 0.62 },
    sat: { value: 1.26 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float vignette;
    uniform float sat;
    uniform vec2 resolution;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, sat);
      c = (c - 0.5) * 1.10 + 0.5;
      float d = distance(vUv, vec2(0.5));
      c *= 1.0 - vignette * smoothstep(0.28, 0.92, d) * 0.85;
      float g = hash(vUv * resolution.xy + fract(time) * 91.7) - 0.5;
      c += g * amount;
      // warm film tint
      c *= vec3(1.02, 1.0, 1.015);
      gl_FragColor = vec4(c, 1.0);
    }`,
};
FilmShader.uniforms.resolution = { value: new THREE.Vector2(size.x, size.y) };

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new ShaderPass(OutlineShader);
composer.addPass(outlinePass);
const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.30, 0.68, 1.02);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const filmPass = new ShaderPass(FilmShader);
filmPass.renderToScreen = true;
composer.addPass(filmPass);

/* ---------------- hide fx + glass from the outline prepass ---------------- */
const prepassHidden = [];
scene.traverse((o) => {
  if (o.isSprite || o.isPoints || o.userData.glass || o.userData.noPrepass) prepassHidden.push(o);
});
function hideForPrepass(hide) {
  for (const o of prepassHidden) {
    if (hide) { o.userData._vis = o.visible; o.visible = false; }
    else { o.visible = o.userData._vis !== false; }
  }
}

/* ================================================================== *
 *  animation
 * ================================================================== */
const clock = new THREE.Clock();
let steamTimer = 0;
let bathTimer = 0;
const trainMouth = new THREE.Vector3(0, -10.6, 62.4);
const bathMouth = hotel.anim.bath.clone().multiplyScalar(1.18);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // elevators
  for (const e of hotel.anim.elevators) {
    const k = Math.sin(t * 0.42 + e.phase) * 0.5 + 0.5;
    e.obj.position.y = 0.5 + k * 4.6;
  }
  // revolving door
  if (hotel.anim.door) hotel.anim.door.rotation.y = t * 0.62;
  // flag
  const fg = hotel.anim.flagGeo;
  if (fg) {
    const pos = fg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const k = Math.min(1, Math.max(0, (x + 4.75) / 9.5));
      pos.setZ(i, Math.sin(k * 6.2 - t * 4.4) * 1.15 * k + Math.sin(k * 2.7 - t * 2.6) * 0.4 * k);
    }
    pos.needsUpdate = true;
    fg.computeVertexNormals();
  }
  // switchboard lamps
  for (const l of hotel.anim.switchLights) {
    const on = Math.sin(t * 2.6 + l.phase) > -0.15;
    l.mat.color.setRGB(on ? 1.0 : 0.22, on ? 0.82 : 0.16, on ? 0.30 : 0.10);
  }
  // cable car sway
  const sway = props.cable.sway;
  sway.rotation.z = Math.sin(t * 0.78) * 0.032 + Math.sin(t * 0.31) * 0.012;
  sway.rotation.x = Math.sin(t * 0.61 + 1.2) * 0.022;

  // steam
  steamTimer += dt;
  if (steamTimer > 0.2) {
    steamTimer = 0;
    steam.spawn(trainMouth, { life: 2.2, rise: 2.2, spread: 0.6, size: 1.7, grow: 4.6, opacity: 0.8 });
  }
  bathTimer += dt;
  if (bathTimer > 0.5) {
    bathTimer = 0;
    steam.spawn(bathMouth, { life: 3.0, rise: 0.9, spread: 1.6, size: 1.4, grow: 3.4, opacity: 0.42 });
  }
  steam.update(dt);
  snow.update(dt);

  controls.update();

  // outline prepass
  hideForPrepass(true);
  scene.overrideMaterial = normalMat;
  renderer.setRenderTarget(normalRT);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  scene.overrideMaterial = null;
  hideForPrepass(false);

  filmPass.uniforms.time.value = t;
  composer.render();
  _frames++;
}

/* ================================================================== *
 *  resize
 * ================================================================== */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  renderer.getDrawingBufferSize(size);
  if (normalRT.width !== size.x || normalRT.height !== size.y) {
    normalRT.dispose();
    depthTex.dispose();
    depthTex = new THREE.DepthTexture(size.x, size.y, THREE.UnsignedIntType);
    depthTex.format = THREE.DepthFormat;
    normalRT = new THREE.WebGLRenderTarget(size.x, size.y, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      depthBuffer: true, depthTexture: depthTex,
    });
    outlinePass.uniforms.tNormal.value = normalRT.texture;
    outlinePass.uniforms.tDepth.value = depthTex;
  }
  outlinePass.uniforms.resolution.value.set(size.x, size.y);
  FilmShader.uniforms.resolution.value.set(size.x, size.y);
  filmPass.uniforms.resolution.value.set(size.x, size.y);
  bloom.setSize(size.x, size.y);
}
window.addEventListener('resize', onResize);

/* ---------------- debug hooks ---------------- */
window.__cam = (v) => {
  camera.position.set(v[0], v[1], v[2]);
  controls.target.set(v[3] ?? 0, v[4] ?? 8, v[5] ?? 0);
  controls.update();
};
window.__pick = (nx, ny) => {
  const rc = new THREE.Raycaster();
  rc.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hits = rc.intersectObjects(scene.children, true).slice(0, 3);
  return hits.map((h) => {
    const o = h.object;
    const p = new THREE.Vector3();
    o.getWorldPosition(p);
    return {
      type: o.type, geo: o.geometry?.type,
      color: o.material?.color?.getHexString?.() ?? null,
      pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)],
      dist: +h.distance.toFixed(1),
      parent: o.parent?.type + '/' + (o.parent?.children?.length ?? 0),
    };
  });
};
window.__frame = () => {
  const box = new THREE.Box3();
  for (const g of [base, hotel.group, props.group]) box.expandByObject(g);
  const pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    pts.push(new THREE.Vector3(x, y, z).project(camera));
  }
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return {
    min: [box.min.x.toFixed(1), box.min.y.toFixed(1), box.min.z.toFixed(1)],
    max: [box.max.x.toFixed(1), box.max.y.toFixed(1), box.max.z.toFixed(1)],
    ndc: [Math.min(...xs).toFixed(2), Math.max(...xs).toFixed(2), Math.min(...ys).toFixed(2), Math.max(...ys).toFixed(2)],
    cam: camera.position.toArray().map((v) => +v.toFixed(1)),
    tgt: controls.target.toArray().map((v) => +v.toFixed(1)),
  };
};
window.__steam = () => steam.pool.filter((p) => p.s.visible).map((p) => ({
  pos: p.s.position.toArray().map((v) => +v.toFixed(1)),
  sc: +p.s.scale.x.toFixed(2),
  op: +p.s.material.opacity.toFixed(3),
  life: +p.life.toFixed(2),
}));
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geo: renderer.info.memory.geometries, tex: renderer.info.memory.textures });
window.__anim = () => ({
  elev: hotel.anim.elevators.map((e) => +e.obj.position.y.toFixed(2)),
  door: +hotel.anim.door.rotation.y.toFixed(2),
  flag: +hotel.anim.flagGeo.attributes.position.getZ(40).toFixed(2),
  lamp: hotel.anim.switchLights[0].mat.color.getHexString(),
  sway: +props.cable.sway.rotation.z.toFixed(3),
  steam: steam.pool.filter((p) => p.s.visible).length,
  snow: +snow.points.geometry.attributes.position.array[1].toFixed(1),
});
window.__outline = (v) => { outlinePass.uniforms.strength.value = v; };
window.__bloom = (v) => { bloom.strength = v; };
let _frames = 0, _t0 = performance.now();
window.__fps = 0;
setInterval(() => {
  const now = performance.now();
  window.__fps = Math.round((_frames * 1000) / (now - _t0));
  _frames = 0; _t0 = now;
}, 1000);

/* ================================================================== *
 *  go
 * ================================================================== */
renderer.compile(scene, camera);
animate();
window.__ready = true;
setTimeout(() => {
  const veil = document.getElementById('veil');
  if (veil) { veil.style.opacity = '0'; setTimeout(() => veil.remove(), 1400); }
}, 240);
