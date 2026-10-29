import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createSky } from './sky.js';
import { createCloudBase, BASE } from './cloudbase.js';
import { createWhale, DECK_Y } from './whale.js';
import { createAtelier } from './atelier.js';
import { createSilks, createBubbleField } from './silk.js';
import { createJellyfishSwarm } from './jellyfish.js';
import { createWishingTree } from './tree.js';
import { createDockAndBoat } from './boardwalk.js';
import { createDyeVatsAndBaskets } from './vats.js';
import { createFlora } from './flora.js';

// ─────────────────────────────────────────────────────────────
//  晚霞织梦染坊 · A miniature utopia you can turn in your hands.
// ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
const PIXEL_RATIO_CAP = 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = .98;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 220);
const HOME = new THREE.Vector3(17.4, 8.15, 28.1);
const LOOK = new THREE.Vector3(0, 2.72, .12);
camera.position.copy(HOME);

// ── painted sky & atmosphere
const sky = createSky(scene, renderer);

// ── light: a long peach afternoon, the last gold resting on everything
const hemi = new THREE.HemisphereLight('#ffeadb', '#9b9ed0', .64);
scene.add(hemi);

const key = new THREE.DirectionalLight('#ffe0b7', 1.5);
key.position.set(8.5, 18.5, 12.0);
key.target.position.set(0, 2.5, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -14;
key.shadow.camera.right = 14;
key.shadow.camera.top = 14;
key.shadow.camera.bottom = -14;
key.shadow.camera.near = 2;
key.shadow.camera.far = 55;
key.shadow.bias = -.0004;
key.shadow.normalBias = .035;
key.shadow.radius = 4.5;
scene.add(key, key.target);

const fill = new THREE.DirectionalLight('#b9c9ff', .38);
fill.position.set(-12, 7, 10);
scene.add(fill);

const rim = new THREE.DirectionalLight('#ffb98b', .46);
rim.position.set(-9, 10, -14);
scene.add(rim);

// warm light leaking up through the cotton cloud sea
const underA = new THREE.PointLight('#ffad91', 3.0, 13, 2);
underA.position.set(-2.2, -1.65, -.6);
scene.add(underA);
const underB = new THREE.PointLight('#ffd0ac', 2.0, 12, 2);
underB.position.set(5.2, -2.1, 3.6);
scene.add(underB);
const treeLight = new THREE.PointLight('#ffc58d', 3.1, 5.5, 2);
treeLight.position.set(-7.1, 4.0, -3.6);
scene.add(treeLight);

// ── the miniature
const base = createCloudBase();
scene.add(base.group);

const whale = createWhale();
scene.add(whale.group);

const atelier = createAtelier();
atelier.group.position.set(-.05, DECK_Y, .18);
whale.group.add(atelier.group);

const silks = createSilks(atelier.silkAnchors);
atelier.group.add(silks.group);

const vats = createDyeVatsAndBaskets();
whale.group.add(vats.group);

const dockAndBoat = createDockAndBoat();
whale.group.add(dockAndBoat.group);

const wishingTree = createWishingTree();
scene.add(wishingTree.group);

const jellies = createJellyfishSwarm();
scene.add(jellies.group);

const flora = createFlora();
scene.add(flora.group);

const bubbles = createBubbleField(vats.sources, 112);
scene.add(bubbles.group);

// a few tiny, near-camera dust fairies
const dustGroup = new THREE.Group();
const dustTex = sky.dust.material.map;
const rnd = (() => { let a=123456789; return ()=>{ a^=a<<13; a^=a>>>17; a^=a<<5; return ((a>>>0)/4294967296); }; })();
for (let i=0;i<26;i++){
  const m = new THREE.SpriteMaterial({ map: dustTex, color: i%2?'#ffe4b4':'#ffd2e0', transparent:true, opacity:.22, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false });
  const s = new THREE.Sprite(m);
  s.position.set((rnd()-.5)*24, -1+rnd()*12, (rnd()-.5)*24);
  s.scale.setScalar(.15+rnd()*.25);
  s.userData = { base: s.position.clone(), phase: rnd()*7 };
  dustGroup.add(s);
}
scene.add(dustGroup);

// little warm ground glow right at the deck edge
scene.add((() => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sky.dust.material.map, color:'#ffd5b1', transparent:true, opacity:.16,
    depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false
  }));
  s.position.set(-1.5, DECK_Y+.12, 2.2); s.scale.set(6,2.3,1);
  return s;
})());

// ── camera interaction — no HUD, just a living object
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(LOOK);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.enablePan = false;
controls.minDistance = 13.5;
controls.maxDistance = 48;
controls.minPolarAngle = .28;
controls.maxPolarAngle = Math.PI * .488;
controls.rotateSpeed = .62;
controls.zoomSpeed = .7;
controls.autoRotate = false;
controls.update();

// ── post procession: creamy bloom around only the truly luminous things
let composer;
let bloomPass;
function setupComposer() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: 2,
  });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .14, .38, 1.08);
  composer.addPass(bloomPass);
  const output = new OutputPass();
  composer.addPass(output);
}
setupComposer();

// Handy for visual tuning without exposing any interface chrome.
window.__dream = {
  THREE, scene, camera, renderer, controls, composer, bloomPass, sky,
  base, whale, atelier, jellies, wishingTree, dockAndBoat, vats, flora, bubbles,
  lights: { hemi, key, fill, rim, underA, underB, treeLight },
  home: HOME.clone(), look: LOOK.clone(),
};

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w,h);
  bloomPass?.setSize(w,h);
}
window.addEventListener('resize', onResize, { passive: true });

// ── animation
let elapsed = 0;
let first = true;
let lastFrame = performance.now();

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastFrame) / 1000, .05);
  lastFrame = now;
  elapsed += dt;
  const t = elapsed;

  sky.update(t);
  base.update(t);
  whale.update(t);
  atelier.update(t);
  silks.update(t);
  vats.update(t);
  dockAndBoat.update(t);
  wishingTree.update(t);
  jellies.update(t);
  flora.update(t);
  bubbles.update(t);

  dustGroup.children.forEach((s,i)=>{
    s.position.y = s.userData.base.y + Math.sin(t*.18 + s.userData.phase)*.45;
    s.position.x = s.userData.base.x + Math.cos(t*.12 + s.userData.phase)*.25;
    s.material.opacity = .10 + .13*(.5+.5*Math.sin(t*.5+i));
  });

  controls.update();
  composer.render();

  if (first) {
    first = false;
    canvas.classList.add('is-ready');
    document.documentElement.classList.add('ready');
  }
}
requestAnimationFrame(animate);

// pause shader work when the tab is hidden, resume cleanly
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
});