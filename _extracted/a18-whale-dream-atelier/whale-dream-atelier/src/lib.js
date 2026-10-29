import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ── tiny deterministic RNG ───────────────────────────────────
export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rnd = rng(20241029);
export const rr = (a, b, r = Math.random) => a + (b - a) * r();
export const lerp = THREE.MathUtils.lerp;
export const clamp = THREE.MathUtils.clamp;

export function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

// ── canvas texture helpers ──────────────────────────────────
export function canvasTexture(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  t.anisotropy = 8;
  return t;
}

export function roundedRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeGlowTexture(size = 128, inner = 'rgba(255,255,255,1)', mid = 'rgba(255,215,210,.42)') {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.18, 'rgba(255,247,232,.82)');
  g.addColorStop(0.42, mid);
  g.addColorStop(1, 'rgba(255,190,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeSoftCloudTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const blob = (x, y, r, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,252,247,${a})`);
    g.addColorStop(0.45, `rgba(255,232,232,${a * 0.58})`);
    g.addColorStop(1, 'rgba(255,220,230,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(size*0.45, size*0.55, size*0.46, 0.55);
  blob(size*0.28, size*0.8, size*0.3, 0.4);
  blob(size*0.7, size*0.42, size*0.33, 0.46);
  blob(size*0.6, size*0.82, size*0.26, 0.34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeStarTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.25,'rgba(255,240,200,.75)');
  g.addColorStop(1,'rgba(255,220,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,size,size);
  ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(size/2, size*.1); ctx.lineTo(size/2, size*.9);
  ctx.moveTo(size*.1, size/2); ctx.lineTo(size*.9, size/2);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makePetalTexture(size = 256) {
  return canvasTexture(size, size, (ctx,w,h) => {
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#fff4e8');
    g.addColorStop(.4,'#ffd7d6');
    g.addColorStop(1,'#c6c7ff');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.22;
    for(let i=0;i<60;i++){ ctx.fillStyle=i%2?'#fff':'#ac9cff'; ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h,Math.random()*3+1,0,7); ctx.fill(); }
  }, {repeat:[3,3]});
}

// ── geometry constructors ───────────────────────────────────
export function rBox(w, h, d, r = 0.06, seg = 3) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w * .45, h * .45, d * .45));
}
export function sphere(r = 1, w = 16, h = 12) { return new THREE.SphereGeometry(r, w, h); }
export function ico(r = 1, detail = 1) { return new THREE.IcosahedronGeometry(r, detail); }
export function cyl(rt, rb, h, seg = 16) { return new THREE.CylinderGeometry(rt, rb, h, seg); }
export function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
export function plane(w, h, ws = 1, hs = 1) { return new THREE.PlaneGeometry(w, h, ws, hs); }

export function mesh(geo, mat, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (opts.pos) m.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
  if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  if (opts.scale) m.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
  m.castShadow = opts.castShadow ?? true;
  m.receiveShadow = opts.receiveShadow ?? true;
  if (opts.name) m.name = opts.name;
  if (opts.renderOrder != null) m.renderOrder = opts.renderOrder;
  return m;
}

export function groupAdd(parent, ...children) {
  for (const c of children) parent.add(c);
  return parent;
}

export function cylinderBetween(a, b, r, mat, seg = 10, radial = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, radial, 1, false);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function tube(points, radius, mat, segments = 48, radial = 6, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p instanceof THREE.Vector3 ? p : v3(...p)), closed);
  const geo = new THREE.TubeGeometry(curve, segments, radius, radial, closed);
  return new THREE.Mesh(geo, mat);
}

export function aroundY(radius, angle, y = 0) {
  return v3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

// ── arch cut-out helpers ───────────────────────────────────
export function archHole(cx, bottom, width, height, yBase = 0) {
  const r = width / 2;
  const spring = bottom + height - r;
  const p = new THREE.Path();
  p.moveTo(cx - r, bottom - yBase);
  p.lineTo(cx - r, spring - yBase);
  p.absarc(cx, spring - yBase, r, Math.PI, 0, true);
  p.lineTo(cx + r, bottom - yBase);
  p.closePath();
  return p;
}

export function archOutline(cx, bottom, width, height, z = 0) {
  const r = width / 2;
  const spring = bottom + height - r;
  const pts = [];
  pts.push(v3(cx - r, bottom, z));
  pts.push(v3(cx - r, spring, z));
  for (let i = 1; i <= 14; i++) {
    const a = Math.PI - i / 14 * Math.PI;
    pts.push(v3(cx + Math.cos(a) * r, spring + Math.sin(a) * r, z));
  }
  pts.push(v3(cx + r, bottom, z));
  return pts;
}

// ── inverted-hull ink lines ────────────────────────────────
const outlineCache = new Map();
export function outlineMaterial(color = '#6d536a', thickness = 0.018, opacity = 1) {
  const key = color + '|' + thickness + '|' + opacity;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uThickness: { value: thickness },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      uniform float uThickness;
      void main() {
        vec3 p = position + normal * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity);
      }
    `,
    side: THREE.BackSide,
    transparent: opacity < 0.999,
    depthWrite: opacity >= 0.999,
  });
  outlineCache.set(key, mat);
  return mat;
}

export function inkOutline(object, color = '#6d536a', thickness = 0.018, opacity = 1) {
  if (!object.isMesh) return;
  const o = new THREE.Mesh(object.geometry, outlineMaterial(color, thickness, opacity));
  o.name = (object.name || 'mesh') + '_ink';
  o.userData.isOutline = true;
  o.castShadow = false;
  o.receiveShadow = false;
  o.renderOrder = -1;
  object.add(o);
  return o;
}

// ── shadow / contact decal ─────────────────────────────────
let contactMat = null;
export function contactShadowTexture() {
  return canvasTexture(256, 256, (ctx,w,h) => {
    const g = ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.5);
    g.addColorStop(0,'rgba(68,40,58,.46)');
    g.addColorStop(.38,'rgba(88,53,72,.26)');
    g.addColorStop(1,'rgba(100,70,90,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  });
}
export function softShadowPlane(w, h, opacity = 1) {
  if (!contactMat) contactMat = new THREE.MeshBasicMaterial({
    map: contactShadowTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), contactMat.clone());
  m.material.opacity = opacity;
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

// ── misc ───────────────────────────────────────────────────
export function makePointsMaterial(color = '#fff1c9', size = 0.1, opacity = 0.9) {
  return new THREE.PointsMaterial({
    color, size, transparent: true, opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true, toneMapped: false,
  });
}

export function disposeDeep(obj) {
  obj.traverse?.(o => {
    if (o.isMesh) {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.()); else o.material?.dispose?.();
    }
  });
}

export const TAU = Math.PI * 2;
