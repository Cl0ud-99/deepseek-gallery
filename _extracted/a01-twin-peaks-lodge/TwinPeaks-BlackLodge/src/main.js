import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { timeU, PAL, addOutline, softSprite } from './style.js';
import { L } from './layout.js';
import { PlanarReflector } from './reflect.js';
import { buildBase, buildSaplings, buildForestFloor, buildMist, makeFloor, makePuddle } from './base.js';
import { buildBuilding } from './building.js';
import { buildInterior } from './interior.js';
import { buildProps } from './props.js';
import { buildRain, buildWires, Spark, DripField, buildMotes } from './fx.js';

/* ------------------------------------------------------------------ *
 *  Renderer
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.85));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a0d);
scene.fog = new THREE.FogExp2(0x0d1418, 0.0115);

/* ------------------------------------------------------------------ *
 *  Camera + controls
 * ------------------------------------------------------------------ */
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(15.3, 9.4, 21.4);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0.2, 0.5, 0.6);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 11;
controls.maxDistance = 42;
controls.minPolarAngle = 0.14;
controls.maxPolarAngle = 1.43;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.75;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;
controls.update();

let idleTimer = 0;
let userActive = false;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  userActive = true;
  idleTimer = 0;
});
controls.addEventListener('end', () => {
  userActive = false;
});

/* ------------------------------------------------------------------ *
 *  Sky dome
 * ------------------------------------------------------------------ */
{
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x080c12) },
      uBot: { value: new THREE.Color(0x121b1f) },
      uGlow: { value: new THREE.Color(0x2a1016) },
      uTime: timeU,
    },
    vertexShader: /* glsl */`
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uBot, uGlow;
      uniform float uTime;
      varying vec3 vP;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n2(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        for(int i=0;i<5;i++){ s += a * n2(p); p *= 2.07; a *= 0.5; }
        return s;
      }
      void main(){
        vec3 n = normalize(vP);
        float h = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBot, uTop, pow(h, 0.85));
        float glow = pow(max(0.0, dot(normalize(vec3(n.x, 0.0, n.z)), normalize(vec3(0.35, 0.0, 0.94)))), 2.5);
        col += uGlow * glow * (1.0 - h) * 0.3;

        // drifting rain clouds
        float ang = atan(n.z, n.x);
        vec2 cp = vec2(ang * 1.9 + uTime * 0.004, n.y * 3.4);
        float cl = fbm(cp * 1.6 + vec2(0.0, uTime * 0.006));
        float cl2 = fbm(cp * 3.4 - vec2(uTime * 0.004, 0.0));
        float mask = smoothstep(0.42, 0.92, cl * 0.65 + cl2 * 0.35) * smoothstep(-0.05, 0.35, n.y);
        col += vec3(0.055, 0.07, 0.085) * mask * 0.85;
        col += vec3(0.10, 0.05, 0.06) * mask * glow * 0.5;

        // a few cold stars punching through
        vec2 sp = vec2(ang * 26.0, n.y * 34.0);
        vec2 id = floor(sp);
        float st = step(0.982, h21(id));
        float d = length(fract(sp) - 0.5);
        col += vec3(0.5, 0.62, 0.85) * st * smoothstep(0.16, 0.0, d) * smoothstep(0.15, 0.6, n.y) * 0.55;

        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 20), skyMat);
  scene.add(sky);
}

/* ------------------------------------------------------------------ *
 *  Lights
 * ------------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(0x7d9db4, 0x201f18, 2.6);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xc0d8e8, 4.4);
moon.position.set(-13, 17, 9);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -17;
moon.shadow.camera.right = 17;
moon.shadow.camera.top = 17;
moon.shadow.camera.bottom = -17;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 55;
moon.shadow.bias = -0.0009;
moon.shadow.normalBias = 0.02;
moon.target.position.set(0, 0, 0);
scene.add(moon);
scene.add(moon.target);

const rim = new THREE.DirectionalLight(0x8fc8e8, 1.15);
rim.position.set(-9, 7, -14);
scene.add(rim);

const fill = new THREE.DirectionalLight(0x7d9cb4, 0.95);
fill.position.set(11, 7, 15);
scene.add(fill);

// warm bounce from the lodge
const interior1 = new THREE.PointLight(0xffa25c, 52, 19, 2);
interior1.position.set(-3.4, 2.85, -2.4);
scene.add(interior1);

const interior2 = new THREE.PointLight(0xff8f4a, 38, 17, 2);
interior2.position.set(0.4, 2.7, -5.6);
scene.add(interior2);

const cornerLamp = new THREE.PointLight(0xffc98a, 4.2, 7, 2);
cornerLamp.position.set(2.45, 1.9, 0.95);
scene.add(cornerLamp);

const streetLamp = new THREE.PointLight(0xffd2a0, 6.0, 17, 1.6);
streetLamp.position.set(L.lamp.x, 3.5, L.lamp.z);
scene.add(streetLamp);

const vendGlow = new THREE.PointLight(0xff7a4a, 2.6, 3.6, 2);
vendGlow.position.set(3.35, 1.3, -1.9);
scene.add(vendGlow);

const entryLight = new THREE.PointLight(0xffb070, 12, 7, 2);
entryLight.position.set(-1.6, 2.0, -0.6);
scene.add(entryLight);

// soft red spill inside the parted curtains at the back of the room
const corridorLight = new THREE.PointLight(0xff3a2a, 7, 5.5, 2);
corridorLight.position.set(0.0, 1.6, -7.5);
scene.add(corridorLight);

const windowLight = new THREE.PointLight(0xffbe80, 24, 11, 2);
windowLight.position.set(-4.6, 2.5, 0.1);
scene.add(windowLight);

const porchLight = new THREE.PointLight(0xffb877, 12, 9, 2);
porchLight.position.set(-1.3, 2.7, 2.2);
scene.add(porchLight);

const cornerPorch = new THREE.PointLight(0xffb877, 6, 8, 2);
cornerPorch.position.set(2.9, 2.7, 1.7);
scene.add(cornerPorch);

const strobeLight = new THREE.PointLight(0xfff3e0, 0, 10, 2);
strobeLight.position.set(2.45, 1.85, 0.95);
scene.add(strobeLight);

/* ------------------------------------------------------------------ *
 *  Build the world
 * ------------------------------------------------------------------ */
const baseGroup = buildBase(scene);

const reflector = new PlanarReflector(renderer, scene, camera, { size: 768, planeY: 0 });
const floor = makeFloor(reflector);
scene.add(floor);
reflector.exclude.push(floor, baseGroup);

const puddle = makePuddle(reflector);
scene.add(puddle);
reflector.exclude.push(puddle);

buildSaplings(scene);
buildForestFloor(scene);
const mist = buildMist(scene);

const building = buildBuilding(scene);
const interior = buildInterior(scene);
const props = buildProps(scene);

/* global inverted-hull outlines for the toon look */
function addSceneOutlines(root) {
  const targets = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.outline) return;
    if (!o.material || !o.material.isMeshToonMaterial) return;
    if (o.material.transparent) return;
    if (o.name === 'chevronFloor' || o.name === 'puddle') return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const bs = o.geometry.boundingSphere;
    if (!bs) return;
    const sc = Math.max(Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
    const r = bs.radius * sc;
    if (r < 0.46) return;
    targets.push([o, r]);
  });
  for (const [o, r] of targets) {
    addOutline(o, r > 3 ? 0.0016 : r > 1 ? 0.0022 : 0.0030);
    o.userData.hasOutline = true;
  }
}
addSceneOutlines(scene);

// small props don't need to cast shadows — big win for the shadow pass
scene.traverse((o) => {
  if (!o.isMesh || o.userData.outline) return;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const bs = o.geometry.boundingSphere;
  if (!bs) return;
  const sc = Math.max(Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
  if (bs.radius * sc < 0.34) o.castShadow = false;
});

// shadow map refresh cadence
renderer.shadowMap.autoUpdate = false;
streetLamp.position.copy(props.lampPos);

buildRain(scene);
buildMotes(scene);
const wires = buildWires(scene, props.poleTop);

// drips from the awning edge
const dripPts = [];
for (let i = 0; i < 12; i++) {
  const t = i / 11;
  dripPts.push([-7.4 + t * 11.4, L.awningY - 0.55, L.bld.z1 + 1.42]);
}
for (let i = 0; i < 4; i++) dripPts.push([L.bld.x1 + 1.4, L.awningY - 0.55, 1.0 - i * 2.2]);
const drips = new DripField(scene, dripPts);

// sparks on the power line
const spark1 = new Spark(scene, [-7.1, 7.0, 4.5], [-6.0, 6.35, 3.5], { count: 8, scale: 1.1 });
const spark2 = new Spark(scene, [L.pole.x + 0.5, 3.45, L.pole.z], [L.pole.x + 0.85, 3.2, L.pole.z + 0.3], { count: 5, scale: 0.5 });

/* ------------------------------------------------------------------ *
 *  Post processing
 * ------------------------------------------------------------------ */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.85));
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.6, 0.86);
composer.addPass(bloom);

const gradePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.8 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = vUv - 0.5;
      float d = length(p * vec2(1.06, 1.0));
      float v = smoothstep(0.86, 0.28, d);
      c.rgb *= mix(uVignette, 1.0, v);
      // cool the shadows a touch, keep the reds warm
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += vec3(-0.006, 0.0, 0.010) * (1.0 - smoothstep(0.0, 0.35, l));
      c.rgb = mix(vec3(l), c.rgb, 1.06);
      gl_FragColor = c;
    }`,
});
composer.addPass(gradePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

/* ------------------------------------------------------------------ *
 *  Animation state
 * ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let t = 0;
let shadowTick = 0;

// door cycle
let doorTimer = 3.6;
let doorOpen = 1;
let doorPhase = 'open';
const doorTravel = (L.door.x1 - L.door.x0) / 2 - 0.04;

// strobe
let strobeNext = 4.5;
let strobeActive = 0;
let strobeFrames = 0;

// light spill plane under the door (soft radial falloff, no hard edge)
let spillMesh = null;
const spillMat = new THREE.MeshBasicMaterial({
  map: softSprite('rgba(255,196,130,1)', 'rgba(255,140,60,0)'),
  color: 0xffb060,
  transparent: true,
  opacity: 0.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
{
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 6.4), spillMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(-1.4, 0.018, L.bld.z1 + 1.5);
  spill.renderOrder = 2;
  scene.add(spill);
  spillMesh = spill;
}

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/* ------------------------------------------------------------------ *
 *  Loop
 * ------------------------------------------------------------------ */
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;
  timeU.value = t;

  // idle auto-rotate
  if (!userActive) {
    idleTimer += dt;
    if (idleTimer > 9) controls.autoRotate = true;
  }

  // door
  doorTimer -= dt;
  if (doorPhase === 'closed' && doorTimer <= 0) {
    doorPhase = 'opening';
    doorTimer = 1.5;
  } else if (doorPhase === 'opening') {
    doorOpen = Math.min(1, doorOpen + dt / 1.3);
    if (doorOpen >= 1) { doorPhase = 'open'; doorTimer = 6.0; }
  } else if (doorPhase === 'open' && doorTimer <= 0) {
    doorPhase = 'closing';
  } else if (doorPhase === 'closing') {
    doorOpen = Math.max(0, doorOpen - dt / 1.5);
    if (doorOpen <= 0) { doorPhase = 'closed'; doorTimer = 4.0 + Math.random() * 3.5; }
  }
  const e = easeInOut(doorOpen);
  building.doorL.position.x = building.doorHomeL - e * doorTravel;
  building.doorR.position.x = building.doorHomeR + e * doorTravel;
  if (spillMesh) spillMesh.material.opacity = 0.12 + e * 0.3;

  // strobe
  if (strobeActive > 0) {
    strobeActive -= dt;
    strobeFrames -= dt;
    const on = Math.random() > 0.45;
    strobeLight.intensity = on ? 9 + Math.random() * 12 : 0;
    cornerLamp.intensity = on ? 3 : 9;
    if (strobeFrames <= 0) {
      strobeActive = 0;
      strobeLight.intensity = 0;
      cornerLamp.intensity = 9;
      strobeNext = 4 + Math.random() * 7;
    }
  } else {
    strobeNext -= dt;
    if (strobeNext <= 0) {
      strobeActive = 0.36 + Math.random() * 0.3;
      strobeFrames = strobeActive;
    }
  }

  // tv snow
  if (interior.tv.userData.snowTex) {
    const tex = interior.tv.userData.snowTex;
    tex.offset.x = Math.random() * 0.5;
    tex.offset.y = Math.random() * 0.5;
  }

  // steam
  const steam = interior.drip.userData.steam;
  if (steam) {
    steam.material.opacity = 0.14 + Math.sin(t * 1.1) * 0.06 + Math.random() * 0.03;
    steam.position.y = 0.46 + Math.sin(t * 0.6) * 0.02;
  }
  const mistSp = interior.freezer.userData.mist;
  if (mistSp) mistSp.material.opacity = 0.2 + Math.sin(t * 0.8) * 0.08;

  // mist drift
  mist.rotation.y = t * 0.012;
  mist.children.forEach((m, i) => {
    m.position.x += Math.sin(t * 0.1 + i) * 0.0016;
    m.material.opacity = 0.14 + Math.sin(t * 0.25 + i * 1.7) * 0.05;
  });

  // fx
  drips.update(t, dt);
  spark1.update(t, dt);
  spark2.update(t, dt);

  // owl eye pulse
  building.owl.rotation.z = Math.sin(t * 0.5) * 0.02;

  controls.update();

  // reflection then render
  reflector.update();
  shadowTick = (shadowTick + 1) % 2;
  if (shadowTick === 0) renderer.shadowMap.needsUpdate = true;
  composer.render();
}

/* ------------------------------------------------------------------ *
 *  Resize
 * ------------------------------------------------------------------ */
// keep the diorama framed across aspect ratios (constant horizontal FOV)
function fitFov() {
  const aspect = window.innerWidth / window.innerHeight;
  const targetH = (55 * Math.PI) / 180;
  let v = 2 * Math.atan(Math.tan(targetH / 2) / aspect);
  v = Math.min(Math.max((v * 180) / Math.PI, 32), 64);
  camera.fov = v;
  camera.updateProjectionMatrix();
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  fitFov();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
}
fitFov();
window.addEventListener('resize', onResize);

/* ------------------------------------------------------------------ *
 *  Boot
 * ------------------------------------------------------------------ */
animate();

// fade in
const fade = document.getElementById('fade');
if (fade) {
  requestAnimationFrame(() => {
    fade.style.opacity = '0';
    setTimeout(() => fade.remove(), 1600);
  });
}
