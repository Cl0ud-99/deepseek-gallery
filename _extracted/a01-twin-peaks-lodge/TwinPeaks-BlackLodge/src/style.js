import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Shared clock
 * ------------------------------------------------------------------ */
export const timeU = { value: 0 };

/* ------------------------------------------------------------------ *
 *  Palette  (sRGB hex — three converts to linear working space)
 * ------------------------------------------------------------------ */
export const PAL = {
  velvet: 0x9c1428,
  velvetDeep: 0x4d060f,
  velvetLit: 0xa81a2c,
  velvetDark: 0x3a040b,
  bone: 0xe6dcc8,
  boneDim: 0xb9ae98,
  ink: 0x121011,
  fir: 0x16241d,
  firMid: 0x1e3327,
  firLit: 0x2b4633,
  moss: 0x26341f,
  soil: 0x181310,
  wood: 0x3a2a1e,
  woodDark: 0x22180f,
  woodLit: 0x5a4128,
  brass: 0xb5893f,
  brassDark: 0x6d4f21,
  marble: 0xefeade,
  marbleDim: 0xc9c2b1,
  leather: 0x161316,
  leatherLit: 0x2a252b,
  neon: 0xff2a3e,
  neonBlue: 0x63c8ff,
  warm: 0xffcf8a,
  warmDeep: 0xff9a3c,
  pale: 0xfff6e2,
  spark: 0xbfe9ff,
  glass: 0xa8cfd6,
  cream: 0xf2e6c8,
  cherry: 0xb3122a,
  emerald: 0x1f7a4d,
  gold: 0xd8a83c,
  teal: 0x2f5d55,
};

/* ------------------------------------------------------------------ *
 *  Toon ramp
 * ------------------------------------------------------------------ */
let _grad = null;
export function gradMap() {
  if (_grad) return _grad;
  const steps = 5;
  const vals = [26, 74, 128, 196, 255];
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    data[i * 4 + 0] = vals[i];
    data[i * 4 + 1] = vals[i];
    data[i * 4 + 2] = vals[i];
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  _grad = t;
  return t;
}

/* ------------------------------------------------------------------ *
 *  Materials
 * ------------------------------------------------------------------ */
export function M(color, extra = {}) {
  const o = Object.assign({}, extra);
  const flat = !!(o.flat || o.flatShading);
  delete o.flat;
  delete o.flatShading;
  const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: gradMap() }, o));
  m.userData.flat = flat;
  return m;
}
export function MB(color, extra = {}) {
  return new THREE.MeshBasicMaterial(Object.assign({ color }, extra));
}
/** HDR emissive-ish basic material for neon / bulbs / screens (feeds bloom) */
export function GLOW(color, boost = 2.0, extra = {}) {
  const c = new THREE.Color(color).multiplyScalar(boost);
  return new THREE.MeshBasicMaterial(Object.assign({ color: c }, extra));
}

/* ------------------------------------------------------------------ *
 *  Inverted-hull outline
 * ------------------------------------------------------------------ */
const _outlineCache = new Map();
export function outlineMat(thickness = 0.0028, color = 0x08070a, opacity = 1) {
  const key = thickness + '|' + color + '|' + opacity;
  if (_outlineCache.has(key)) return _outlineCache.get(key);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThick: { value: thickness },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */`
      uniform float uThick;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        float d = max(-mv.z, 0.001);
        mv.xyz += n * uThick * d;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() { gl_FragColor = vec4(uColor, uOpacity); }`,
    side: THREE.BackSide,
    transparent: opacity < 1,
    depthWrite: true,
  });
  _outlineCache.set(key, mat);
  return mat;
}

export function addOutline(mesh, thickness = 0.0028, color = 0x08070a) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(thickness, color));
  o.castShadow = false;
  o.receiveShadow = false;
  o.renderOrder = -1;
  mesh.add(o);
  mesh.userData.outline = o;
  return o;
}

/* ------------------------------------------------------------------ *
 *  Object helpers
 * ------------------------------------------------------------------ */
export function add(parent, geo, mat, o = {}) {
  let geometry = geo;
  if (mat.userData && mat.userData.flat && geometry.index) {
    geometry = geometry.toNonIndexed();
    geometry.computeVertexNormals();
  }
  const m = new THREE.Mesh(geometry, mat);
  if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  m.castShadow = o.castShadow !== undefined ? o.castShadow : true;
  m.receiveShadow = o.receiveShadow !== undefined ? o.receiveShadow : true;
  if (o.name) m.name = o.name;
  if (o.outline) addOutline(m, o.outline === true ? 0.0028 : o.outline);
  parent.add(m);
  return m;
}

export function box(parent, w, h, d, mat, o = {}) {
  return add(parent, new THREE.BoxGeometry(w, h, d), mat, o);
}
export function cyl(parent, rt, rb, h, seg, mat, o = {}) {
  return add(parent, new THREE.CylinderGeometry(rt, rb, h, seg), mat, o);
}
export function sph(parent, r, mat, o = {}) {
  return add(parent, new THREE.SphereGeometry(r, o.seg || 16, o.seg2 || 12), mat, o);
}
export function plane(parent, w, h, mat, o = {}) {
  return add(parent, new THREE.PlaneGeometry(w, h, o.sw || 1, o.sh || 1), mat, o);
}

const _up = new THREE.Vector3(0, 1, 0);
export function tubeBetween(parent, a, b, r, mat, o = {}) {
  const A = new THREE.Vector3(a[0], a[1], a[2]);
  const B = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r, r, len, o.seg || 6, 1, false);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(A).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  m.castShadow = o.castShadow !== undefined ? o.castShadow : true;
  m.receiveShadow = true;
  if (o.outline) addOutline(m, o.outline === true ? 0.0028 : o.outline);
  parent.add(m);
  return m;
}

export function lathe(parent, pts, seg, mat, o = {}) {
  const v = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  return add(parent, new THREE.LatheGeometry(v, seg), mat, o);
}

/* ------------------------------------------------------------------ *
 *  Soft sprite textures
 * ------------------------------------------------------------------ */
const _spriteCache = new Map();
export function softSprite(inner = 'rgba(255,240,214,1)', outer = 'rgba(255,200,120,0)') {
  const key = inner + outer;
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(0.6, outer.replace(/[\d.]+\)$/, '0.16)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  _spriteCache.set(key, t);
  return t;
}

export function glow(parent, color, size, opacity = 1, p = [0, 0, 0]) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softSprite(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  s.scale.set(size, size, 1);
  s.position.set(p[0], p[1], p[2]);
  parent.add(s);
  return s;
}

/* ------------------------------------------------------------------ *
 *  Curtain geometry — velvet folds baked into geometry + vertex colours
 * ------------------------------------------------------------------ */
export function curtainGeometry(w, h, folds = 9, amp = 0.085, segY = 10, sag = 0.0) {
  const nx = Math.max(8, folds * 6);
  const ny = segY;
  const pos = [];
  const col = [];
  const uv = [];
  const idx = [];
  const c = new THREE.Color();
  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    const y = v * h - sag * Math.sin(v * Math.PI);
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const phase = u * Math.PI * 2 * folds;
      const ampScale = 0.55 + 0.45 * (1 - v * 0.6);
      const z = Math.sin(phase) * amp * ampScale + Math.sin(phase * 0.5 + 1.1) * amp * 0.35;
      pos.push((u - 0.5) * w, y, z);
      uv.push(u, v);
      // fold shading: crest bright, trough dark
      const s = 0.5 + 0.5 * Math.cos(phase);
      const shade = 0.34 + 0.66 * Math.pow(s, 0.85);
      const ao = 0.78 + 0.22 * (1 - v * 0.35);
      c.setRGB(shade * ao, shade * ao * 0.96, shade * ao * 0.94);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const d = a + (nx + 1);
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** velvet material with a gentle wind sway injected into the vertex stage */
export function velvetMat(color = PAL.velvet, opts = {}) {
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradMap(),
    vertexColors: true,
    side: opts.side || THREE.DoubleSide,
  });
  if (opts.emissive !== undefined) {
    mat.emissive = new THREE.Color(opts.emissive);
    mat.emissiveIntensity = opts.emissiveIntensity === undefined ? 1 : opts.emissiveIntensity;
  }
  const amp = opts.sway === undefined ? 0.022 : opts.sway;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeU;
    shader.uniforms.uSway = { value: amp };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uSway;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */`
        #include <begin_vertex>
        float swayF = smoothstep(0.0, 1.4, position.y);
        transformed.z += sin(uTime * 0.55 + position.y * 1.1 + position.x * 0.7) * uSway * swayF;
        transformed.x += sin(uTime * 0.37 + position.y * 0.8 + 2.0) * uSway * 0.45 * swayF;
        `
      );
  };
  mat.customProgramCacheKey = () => 'velvet' + amp;
  return mat;
}

/* ------------------------------------------------------------------ *
 *  Misc
 * ------------------------------------------------------------------ */
export function rand(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function catenary(a, b, sag, seg = 16) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = new THREE.Vector3().lerpVectors(A, B, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}
