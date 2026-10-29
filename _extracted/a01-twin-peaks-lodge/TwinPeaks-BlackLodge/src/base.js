import * as THREE from 'three';
import { PAL, M, MB, GLOW, add, box, cyl, plane, timeU, rand, glow, lathe } from './style.js';
import { chevronTexture, soilTexture, woodTexture, barkTexture, fernTexture, leafCluster, mistTexture } from './textures.js';
import { L } from './layout.js';

/* ------------------------------------------------------------------ *
 *  Wet chevron floor with live planar reflection
 * ------------------------------------------------------------------ */
export function makeFloor(reflector) {
  const uniforms = {
    uRefl: { value: reflector.texture },
    uTexMatrix: { value: reflector.textureMatrix },
    uTime: timeU,
    uWet: { value: 1.0 },
    uReflTint: { value: new THREE.Color(1.0, 0.94, 0.95) },
  };

  const mat = M(0x9e9684, { map: chevronTexture() });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRefl = uniforms.uRefl;
    shader.uniforms.uTexMatrix = uniforms.uTexMatrix;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWet = uniforms.uWet;
    shader.uniforms.uReflTint = uniforms.uReflTint;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform mat4 uTexMatrix;
        varying vec3 vWPos;
        varying vec4 vReflUv;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vReflUv = uTexMatrix * vec4(vWPos, 1.0);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uRefl;
        uniform float uTime;
        uniform float uWet;
        uniform vec3 uReflTint;
        varying vec3 vWPos;
        varying vec4 vReflUv;

        float fHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float fNoise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(mix(fHash(i), fHash(i+vec2(1,0)), f.x),
                     mix(fHash(i+vec2(0,1)), fHash(i+vec2(1,1)), f.x), f.y);
        }
        vec2 rippleOffset(vec2 p){
          vec2 acc = vec2(0.0);
          vec2 gv = p * 1.9;
          vec2 id = floor(gv);
          vec2 f = fract(gv) - 0.5;
          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 cell = id + o;
              float rnd = fHash(cell);
              float ph = fract(uTime * 0.62 + rnd);
              float r = ph * 0.5;
              vec2 c = o + (vec2(fHash(cell + 3.3), fHash(cell + 8.7)) - 0.5) * 0.35;
              float d = length(f - c);
              float ring = smoothstep(0.055, 0.0, abs(d - r)) * (1.0 - ph);
              acc += normalize(f - c + 1e-4) * ring;
            }
          }
          return acc;
        }`
      )
      .replace(
        '#include <opaque_fragment>',
        `{
          vec2 ruv = vReflUv.xy / max(vReflUv.w, 0.0001);
          vec2 rip = rippleOffset(vWPos.xz);
          float wob = fNoise(vWPos.xz * 3.1 + vec2(uTime * 0.05, 0.0));
          ruv += rip * 0.0075 + (wob - 0.5) * 0.005;
          ruv = clamp(ruv, vec2(0.002), vec2(0.998));
          vec3 refl = texture2D(uRefl, ruv).rgb;
          float grainN = fNoise(vWPos.xz * 0.42);
          float wet = (0.40 + 0.18 * grainN) * uWet;
          float lum = dot(diffuseColor.rgb, vec3(0.32));
          wet *= mix(1.24, 0.86, smoothstep(0.0, 0.5, lum));
          float fres = pow(1.0 - clamp(normalize(cameraPosition - vWPos).y, 0.0, 1.0), 2.4);
          wet = clamp(wet * (0.55 + 0.95 * fres), 0.0, 0.86);
          outgoingLight = mix(outgoingLight, refl * uReflTint, wet);
          vec3 Nf = vec3(0.0, 1.0, 0.0);
          vec3 Vf = normalize(cameraPosition - vWPos);
          vec3 Lf = normalize(vec3(-0.42, 0.78, 0.46));
          float spec = pow(max(dot(reflect(-Lf, Nf), Vf), 0.0), 22.0);
          outgoingLight += vec3(0.58, 0.68, 0.82) * spec * 0.55 * wet;
          outgoingLight += vec3(0.55, 0.62, 0.7) * (rip.x * 0.12 + rip.y * 0.12) * 0.25;
        }
        #include <opaque_fragment>`
      );
  };
  mat.customProgramCacheKey = () => 'wetfloor';

  const geo = new THREE.PlaneGeometry(L.plaza, L.plaza, 1, 1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.006;
  mesh.receiveShadow = true;
  mesh.name = 'chevronFloor';
  mesh.userData.uniforms = uniforms;
  return mesh;
}

/* ------------------------------------------------------------------ *
 *  Oil puddle reflecting a starfield
 * ------------------------------------------------------------------ */
export function makePuddle(reflector) {
  const uniforms = {
    uTime: timeU,
    uCenter: { value: new THREE.Vector2(L.puddle.x, L.puddle.z) },
    uRadius: { value: L.puddle.r },
    uRefl: { value: reflector ? reflector.texture : null },
    uTexMatrix: { value: reflector ? reflector.textureMatrix : new THREE.Matrix4() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform mat4 uTexMatrix;
      varying vec3 vW;
      varying vec2 vUv;
      varying vec4 vReflUv;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vReflUv = uTexMatrix * wp;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec2 uCenter;
      uniform float uRadius;
      uniform sampler2D uRefl;
      varying vec3 vW;
      varying vec2 vUv;
      varying vec4 vReflUv;

      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n2(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        for(int i=0;i<4;i++){ s += a * n2(p); p *= 2.03; a *= 0.5; }
        return s;
      }

      void main(){
        vec2 p = vW.xz - uCenter;
        float ang = atan(p.y, p.x);
        float r = length(p) / uRadius;
        float wobble = 0.075 * sin(ang * 3.0 + 1.2) + 0.045 * sin(ang * 7.0 + 2.4)
                     + 0.026 * sin(ang * 11.0 - 0.7);
        float edge = 1.0 + wobble;
        float mask = smoothstep(edge, edge - 0.24, r);
        if (mask <= 0.002) discard;

        // star reflections (surface-locked so they read at diorama scale)
        vec2 st = vUv * 30.0;
        vec2 id = floor(st);
        vec2 f = fract(st) - 0.5;
        float h = h21(id);
        vec2 off = (vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5) * 0.62;
        float d = length(f - off);
        float tw = 0.62 + 0.38 * sin(uTime * 1.7 + h * 43.0);
        float star = smoothstep(0.155, 0.0, d) * step(0.80, h) * tw;

        vec2 st2 = vUv * 9.5;
        vec2 id2 = floor(st2);
        vec2 f2 = fract(st2) - 0.5;
        float h2 = h21(id2 + 11.0);
        vec2 off2 = (vec2(h21(id2 + 2.0), h21(id2 + 5.0)) - 0.5) * 0.55;
        float star2 = smoothstep(0.21, 0.0, length(f2 - off2)) * step(0.84, h2)
                    * (0.7 + 0.3 * sin(uTime * 2.1 + h2 * 23.0));

        // mirror the lodge in the oil, then drown it in stars
        vec2 ruv = vReflUv.xy / max(vReflUv.w, 0.0001);
        ruv += vec2(sin(ang * 6.0 + uTime * 0.4), cos(ang * 5.0 - uTime * 0.3)) * 0.0035;
        vec3 refl = texture2D(uRefl, clamp(ruv, vec2(0.002), vec2(0.998))).rgb;

        vec3 col = vec3(0.004, 0.006, 0.012) + refl * 0.26;
        col += vec3(0.66, 0.78, 1.0) * (star * 0.55 + star2 * 0.85);

        // faint oily sheen
        col += vec3(0.006, 0.007, 0.008) * (0.3 + 0.7 * fbm(vUv * 5.0));

        // inverse-shrinking ripples
        float rip = 0.0;
        for (int i = 0; i < 3; i++) {
          float tt = fract(uTime * 0.13 + float(i) * 0.333);
          float rr = (1.0 - tt) * 0.84 + 0.02 * sin(ang * 4.0 + tt * 6.0);
          rip += smoothstep(0.022, 0.0, abs(r - rr)) * (1.0 - tt);
        }
        col += vec3(0.26, 0.36, 0.5) * rip * 0.055;

        // oil film iridescence
        float film = sin(r * 30.0 + fbm(p * 2.0) * 7.0 + uTime * 0.15);
        vec3 irid = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + film * 2.1);
        col += irid * 0.005 * smoothstep(0.35, 1.0, r);

        col *= mix(1.0, 0.62, smoothstep(0.55, 1.0, r));
        gl_FragColor = vec4(col, mask * 0.97);
      }`,
  });
  const g = new THREE.PlaneGeometry(L.puddle.r * 2.3, L.puddle.r * 2.3, 1, 1);
  const m = new THREE.Mesh(g, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(L.puddle.x, 0.012, L.puddle.z);
  m.renderOrder = 3;
  m.name = 'puddle';
  return m;
}

/* ------------------------------------------------------------------ *
 *  Base / plinth / soil / trees
 * ------------------------------------------------------------------ */
export function buildBase(scene) {
  const g = new THREE.Group();
  g.name = 'base';

  const soilTex = soilTexture();
  const wood = woodTexture('#6b4a2c', '#3d2917', 3, [2, 2]);

  // terrain slab
  const soilMat = M(0xd8cfbc, { map: soilTex });
  const slab = box(g, L.base, 0.36, L.base, soilMat, { p: [0, -0.18, 0], castShadow: false });
  slab.material.map.repeat.set(4, 4);

  // wooden plinth
  box(g, L.base + 0.6, 1.14, L.base + 0.6, M(0xffffff, { map: wood }), { p: [0, -0.93, 0], castShadow: false });
  // brass inlay
  const brass = M(0x6a5230, { emissive: 0x0e0903 });
  box(g, L.base + 0.42, 0.03, L.base + 0.42, brass, { p: [0, -0.38, 0], castShadow: false });
  box(g, L.base + 0.42, 0.03, L.base + 0.42, brass, { p: [0, -1.44, 0], castShadow: false });
  // foot
  box(g, L.base - 0.6, 0.14, L.base - 0.6, M(0x0d0b0a), { p: [0, -1.56, 0], castShadow: false });

  // chevron plaza sits on top; the reflection mesh is added by the caller
  // stone border framing the chevron square
  const stone = M(0x4a4741, { flatShading: true });
  const half = L.plaza / 2;
  const bw = 0.3;
  box(g, L.plaza + bw * 2, 0.1, bw, stone, { p: [0, 0.03, -half - bw / 2], castShadow: false });
  box(g, L.plaza + bw * 2, 0.1, bw, stone, { p: [0, 0.03, half + bw / 2], castShadow: false });
  box(g, bw, 0.1, L.plaza, stone, { p: [-half - bw / 2, 0.03, 0], castShadow: false });
  box(g, bw, 0.1, L.plaza, stone, { p: [half + bw / 2, 0.03, 0], castShadow: false });

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Sycamore sapling
 * ------------------------------------------------------------------ */
export function buildSaplings(parent) {
  const rnd = rand(77);
  const barkTex = barkTexture('#ded7c2', '#7a7462', '#f2ecd8');
  const barkMat = M(0xffffff, { map: barkTex, emissive: 0x121310 });
  const leafTex = leafCluster();
  const leafMat = new THREE.MeshToonMaterial({
    map: leafTex,
    transparent: true,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
  });
  const leafMat2 = M(0xb9c4a4, {
    map: leafTex,
    transparent: true,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    emissive: 0x0e1208,
  });

  const group = new THREE.Group();
  group.name = 'sycamores';

  // two of the twelve ring positions fall inside the lodge / awning footprint
  // (they used to poke through the back curtains) — move them to clear ground
  const relocate = [
    [-8.5, -6.3],
    [8.35, -6.3],
  ];
  let relocIdx = 0;

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    const rad = 8.55 + (rnd() - 0.5) * 0.6;
    let x = Math.cos(a) * rad;
    let z = Math.sin(a) * rad;
    // exclusion box = building + awning overhang, with a small margin
    if (x > -8.2 && x < 4.6 && z > -9.3 && z < 2.1) {
      const spot = relocate[relocIdx++ % relocate.length];
      x = spot[0] + (rnd() - 0.5) * 0.25;
      z = spot[1] + (rnd() - 0.5) * 0.25;
    }
    const h = 2.0 + rnd() * 1.4;
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.rotation.y = rnd() * Math.PI * 2;
    const lean = (rnd() - 0.5) * 0.16;
    t.rotation.z = lean;
    t.rotation.x = (rnd() - 0.5) * 0.14;

    // soil mound
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, 7, 0, 1.2), M(0x1b1611, { flatShading: true }));
    mound.scale.set(1, 0.32, 1);
    mound.position.y = 0.0;
    mound.receiveShadow = true;
    t.add(mound);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.105, h, 7, 3), barkMat);
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    // gentle S curve
    const pos = trunk.geometry.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      const k = (y + h / 2) / h;
      pos.setX(v, pos.getX(v) + Math.sin(k * 2.2) * 0.075 * k);
    }
    pos.needsUpdate = true;
    trunk.geometry.computeVertexNormals();
    t.add(trunk);

    // branches
    const nb = 3 + ((rnd() * 3) | 0);
    for (let b = 0; b < nb; b++) {
      const by = h * (0.52 + rnd() * 0.44);
      const ang = rnd() * Math.PI * 2;
      const len = 0.35 + rnd() * 0.5;
      const ex = Math.cos(ang) * len;
      const ez = Math.sin(ang) * len;
      const ey = by + len * (0.5 + rnd() * 0.5);
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.028, 1, 5), barkMat);
      const dir = new THREE.Vector3(ex, ey - by, ez);
      br.position.set(ex * 0.5, (by + ey) / 2, ez * 0.5);
      br.scale.y = dir.length();
      br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      br.castShadow = true;
      t.add(br);

      if (rnd() > 0.28) {
        const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), rnd() > 0.4 ? leafMat2 : leafMat);
        lf.position.set(ex, ey, ez);
        lf.rotation.set(rnd() * 1.4 - 0.7, rnd() * 3, rnd() * 0.8 - 0.4);
        lf.castShadow = false;
        t.add(lf);
      }
    }
    // crown leaves
    for (let l = 0; l < 7; l++) {
      const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), l % 2 ? leafMat : leafMat2);
      lf.position.set((rnd() - 0.5) * 0.8, h * (0.72 + rnd() * 0.3), (rnd() - 0.5) * 0.8);
      lf.rotation.set(rnd() * 1.2 - 0.6, rnd() * 3.14, rnd() * 1.2 - 0.6);
      t.add(lf);
    }

    group.add(t);
  }
  parent.add(group);
  return group;
}

/* ------------------------------------------------------------------ *
 *  Forest floor dressing
 * ------------------------------------------------------------------ */
export function buildForestFloor(parent) {
  const rnd = rand(991);
  const g = new THREE.Group();
  g.name = 'forestFloor';

  // nothing grows under the lodge or its awning overhang
  const inLodge = (x, z) => x > -8.25 && x < 4.65 && z > -9.35 && z < 2.15;

  const fernTex = fernTexture();
  const fernMat = M(0xffffff, {
    map: fernTex,
    transparent: true,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
  });

  const mossMat = M(0x1b2a18, { flat: true });
  const rockMat = M(0x33322e, { flatShading: true });
  const darkRock = M(0x211f1d, { flatShading: true });

  // ring of undergrowth between plaza edge and base rim
  for (let i = 0; i < 78; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 7.6 + rnd() * 1.85;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 7.65 && Math.abs(z) < 7.65) continue;
    if (inLodge(x, z)) continue;
    const s = 0.5 + rnd() * 0.8;
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 0.9 * s), fernMat);
      f.position.set(x + (rnd() - 0.5) * 0.4, 0.34 * s, z + (rnd() - 0.5) * 0.4);
      f.rotation.set(-0.18 + rnd() * 0.2, (k / 3) * Math.PI + rnd() * 0.5, 0);
      f.castShadow = false;
      g.add(f);
    }
  }

  // moss / rocks
  for (let i = 0; i < 52; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 7.7 + rnd() * 1.75;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 7.65 && Math.abs(z) < 7.65) continue;
    if (inLodge(x, z)) continue;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + rnd() * 0.42, 0), rnd() > 0.55 ? rockMat : darkRock);
    m.position.set(x, 0.02 + rnd() * 0.06, z);
    m.scale.set(1 + rnd(), 0.55 + rnd() * 0.4, 1 + rnd() * 0.7);
    m.rotation.set(rnd(), rnd(), rnd());
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  for (let i = 0; i < 44; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 7.75 + rnd() * 1.7;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 7.65 && Math.abs(z) < 7.65) continue;
    if (inLodge(x, z)) continue;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.24 + rnd() * 0.38, 8, 5), mossMat);
    m.position.set(x, 0.01, z);
    m.scale.set(1.2, 0.1, 1.0);
    m.receiveShadow = true;
    g.add(m);
  }

  // stray fallen fir boughs
  const boughMat = M(0x1c2a20, { flatShading: true });
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 7.85 + rnd() * 1.6;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 7.65 && Math.abs(z) < 7.65) continue;
    if (inLodge(x, z)) continue;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 1.2 + rnd(), 4), boughMat);
    b.position.set(x, 0.09, z);
    b.rotation.set(Math.PI / 2, 0, rnd() * 3.14);
    b.castShadow = true;
    g.add(b);
  }

  parent.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Ground mist
 * ------------------------------------------------------------------ */
export function buildMist(parent) {
  const tex = mistTexture();
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    color: 0x9fb6bd,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((Math.random() - 0.5) * 18, 0.5 + Math.random() * 1.4, (Math.random() - 0.5) * 18);
    m.renderOrder = 5;
    g.add(m);
  }
  parent.add(g);
  g.userData.mat = mat;
  return g;
}
