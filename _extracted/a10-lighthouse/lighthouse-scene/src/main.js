import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

import { envTexture } from './lib.js';
import { makeMaterials, buildBase, buildTower } from './world.js';
import { buildLantern } from './lens.js';
import { buildEnvironment } from './env.js';

/* ------------------------------------------------------------------ */
/*  renderer / scene                                                   */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090c, 0.0105);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 400);
camera.position.set(26.0, 20.2, 5.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5.4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 13;
controls.maxDistance = 48;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = 1.60;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.8;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.55;

/* environment reflections */
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envRT = pmrem.fromEquirectangular(envTexture());
scene.environment = envRT.texture;

/* ------------------------------------------------------------------ */
/*  lights                                                             */
/* ------------------------------------------------------------------ */

const hemi = new THREE.HemisphereLight(0x93a8c0, 0x0a0b0d, 0.95);
scene.add(hemi);

const moonLight = new THREE.DirectionalLight(0xbcd0e6, 2.1);
moonLight.position.set(-16, 26, -13);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 90;
moonLight.shadow.camera.left = -15;
moonLight.shadow.camera.right = 15;
moonLight.shadow.camera.top = 22;
moonLight.shadow.camera.bottom = -8;
moonLight.shadow.bias = -0.0008;
moonLight.shadow.normalBias = 0.03;
scene.add(moonLight);
scene.add(moonLight.target);
moonLight.target.position.set(0, 6, 0);

const fill = new THREE.DirectionalLight(0x8aa2bd, 1.0);
fill.position.set(14, 9, 16);
scene.add(fill);

const key = new THREE.DirectionalLight(0xd6e2f0, 1.95);
key.position.set(-9, 19, 17);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 90;
key.shadow.camera.left = -14;
key.shadow.camera.right = 14;
key.shadow.camera.top = 22;
key.shadow.camera.bottom = -8;
key.shadow.bias = -0.0008;
key.shadow.normalBias = 0.03;
scene.add(key);
scene.add(key.target);
key.target.position.set(0, 6, 0);

const rim = new THREE.DirectionalLight(0xdfe8f5, 0.75);
rim.position.set(4, 18, -18);
scene.add(rim);

/* ------------------------------------------------------------------ */
/*  world                                                              */
/* ------------------------------------------------------------------ */

const M = makeMaterials();
buildBase(scene, M);
const tower = buildTower(scene, M);
const lantern = buildLantern(scene, M);
const env = buildEnvironment(scene, M, camera);

/* ------------------------------------------------------------------ */
/*  post production — monochrome film, ink outlines, halation           */
/* ------------------------------------------------------------------ */

const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uNear: { value: camera.near },
    uFar: { value: camera.far },
    uEdge: { value: 1.3 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uRes;
    uniform float uNear;
    uniform float uFar;
    uniform float uEdge;
    varying vec2 vUv;

    float lin(float d){
      float z = d * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
    }
    float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    void main(){
      vec2 px = 1.0 / uRes;
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = lum(c);

      float d0 = lin(texture2D(tDepth, vUv).x);
      float d1 = lin(texture2D(tDepth, vUv + vec2(px.x, 0.0)).x);
      float d2 = lin(texture2D(tDepth, vUv - vec2(px.x, 0.0)).x);
      float d3 = lin(texture2D(tDepth, vUv + vec2(0.0, px.y)).x);
      float d4 = lin(texture2D(tDepth, vUv - vec2(0.0, px.y)).x);

      float e = 0.0;
      e = max(e, abs(d0 - d1) / max(min(d0, d1), 0.4));
      e = max(e, abs(d0 - d2) / max(min(d0, d2), 0.4));
      e = max(e, abs(d0 - d3) / max(min(d0, d3), 0.4));
      e = max(e, abs(d0 - d4) / max(min(d0, d4), 0.4));
      float edge = smoothstep(0.021, 0.078, e) * uEdge;

      float l1 = lum(texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb);
      float l2 = lum(texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb);
      float l3 = lum(texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb);
      float l4 = lum(texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb);
      float le = abs(l - l1) + abs(l - l2) + abs(l - l3) + abs(l - l4);
      edge = max(edge, smoothstep(0.32, 0.85, le) * 0.5);

      l = mix(l, 0.0, clamp(edge, 0.0, 1.0) * 0.95);
      gl_FragColor = vec4(vec3(max(l, 0.0)), 1.0);
    }
  `,
};

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uFlash: { value: 0 },
    uFlicker: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uFlash;
    uniform float uFlicker;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    void main(){
      vec2 uv = vUv + vec2(sin(uTime * 0.63) * 0.00045, cos(uTime * 0.81) * 0.0006);
      float l = texture2D(tDiffuse, uv).r;

      l = 1.0 - exp(-l * 1.95);
      l = pow(l, 1.18);
      l = clamp((l - 0.018) / 0.94, 0.0, 1.0);
      l = mix(l, smoothstep(0.06, 0.94, l), 0.6);
      l *= 1.0 + uFlicker;
      l = pow(clamp(l, 0.0, 1.0), 1.0 / 2.2);

      float g = hash(vUv * uRes + fract(uTime) * 137.0) - 0.5;
      l += g * 0.09 * (1.0 - l * 0.3);

      vec2 q = vUv - 0.5;
      float vig = smoothstep(0.88, 0.26, length(q * vec2(1.03, 1.0)));
      l *= mix(0.26, 1.0, vig);

      l += uFlash * 0.16;
      gl_FragColor = vec4(vec3(clamp(l, 0.0, 1.0)), 1.0);
    }
  `,
};

const bufSize = renderer.getDrawingBufferSize(new THREE.Vector2());
const sceneRT = new THREE.WebGLRenderTarget(bufSize.x, bufSize.y, {
  type: THREE.HalfFloatType,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
  depthTexture: new THREE.DepthTexture(bufSize.x, bufSize.y, THREE.UnsignedIntType),
  stencilBuffer: false,
});

const filmMat = new THREE.ShaderMaterial({
  uniforms: FilmShader.uniforms,
  vertexShader: FilmShader.vertexShader,
  fragmentShader: FilmShader.fragmentShader,
  depthTest: false, depthWrite: false,
});

class SceneFilmPass extends Pass {
  constructor() {
    super();
    this.fsQuad = new FullScreenQuad(filmMat);
    this.needsSwap = true;
  }
  render(renderer, writeBuffer, readBuffer) {
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);
    filmMat.uniforms.tDiffuse.value = sceneRT.texture;
    filmMat.uniforms.tDepth.value = sceneRT.depthTexture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.fsQuad.render(renderer);
  }
}

const composer = new EffectComposer(renderer);
composer.addPass(new SceneFilmPass());

const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.62, 0.62, 0.80);
composer.addPass(bloom);

const finalPass = new ShaderPass(FinalShader);
composer.addPass(finalPass);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const aspect = w / h;
  camera.aspect = aspect;
  camera.fov = aspect < 1.0 ? 40 + (1.0 - aspect) * 26 : 40;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  const s = renderer.getDrawingBufferSize(new THREE.Vector2());
  sceneRT.setSize(s.x, s.y);
  filmMat.uniforms.uRes.value.set(s.x, s.y);
  finalPass.uniforms.uRes.value.set(s.x, s.y);
}
window.addEventListener('resize', resize);
resize();

/* ------------------------------------------------------------------ */
/*  interaction — gentle auto orbit, resumes when the viewer rests      */
/* ------------------------------------------------------------------ */

let idle = 0;
controls.addEventListener('start', () => { controls.autoRotate = false; idle = 0; });
controls.addEventListener('end', () => { idle = 0; });

/* debug hooks */
window.__cam = (x, y, z, tx, ty, tz) => {
  camera.position.set(x, y, z);
  controls.target.set(tx, ty, tz);
  controls.autoRotate = false;
  controls.update();
};
window.__strike = () => env.strike();
window.__scene = scene;
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geo: renderer.info.memory.geometries, tex: renderer.info.memory.textures });
let frames = 0, fpsT = performance.now();
window.__fps = () => Math.round(frames / ((performance.now() - fpsT) / 1000));

/* ------------------------------------------------------------------ */
/*  loop                                                               */
/* ------------------------------------------------------------------ */

const clock = new THREE.Clock();
let time = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  frames++;

  if (!controls.autoRotate) {
    idle += dt;
    if (idle > 6.0) controls.autoRotate = true;
  }
  controls.update();

  tower.update(time);
  lantern.update(time, dt);
  env.update(time, dt);

  filmMat.uniforms.uNear.value = camera.near;
  filmMat.uniforms.uFar.value = camera.far;
  finalPass.uniforms.uTime.value = time;
  finalPass.uniforms.uFlash.value = env.flash;
  finalPass.uniforms.uFlicker.value = 0.012 * Math.sin(time * 13.7) + 0.008 * Math.sin(time * 31.1);

  composer.render();
  requestAnimationFrame(animate);
}

animate();
