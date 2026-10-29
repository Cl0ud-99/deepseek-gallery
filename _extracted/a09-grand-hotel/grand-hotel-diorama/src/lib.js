import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------ *
 *  PALETTE — Wes Anderson alpine pastel
 * ------------------------------------------------------------------ */
export const C = {
  pink:        0xf0a5b9,
  pinkDeep:    0xdd8099,
  pinkLight:   0xfad0da,
  blush:       0xf6bccb,
  cream:       0xfff2da,
  creamDeep:   0xf4dfb6,
  butter:      0xf7dd93,
  mint:        0x9edcc4,
  mintDeep:    0x6cbda3,
  mintPale:    0xd6f0e5,
  teal:        0x2b8b8b,
  turquoise:   0x3ab3a4,
  burgundy:    0x761d32,
  burgundyDeep:0x551222,
  red:         0xd22b34,
  redDeep:     0xa41d26,
  brass:       0xe6b45c,
  brassDeep:   0xb3873a,
  gold:        0xf8d072,
  lemon:       0xf6d548,
  lemonDeep:   0xd9b52f,
  wood:        0x8b5c3c,
  woodDark:    0x5c3a26,
  walnut:      0x6b4128,
  snow:        0xfffafd,
  snowShade:   0xe6dbe6,
  stone:       0xc6bcc4,
  stoneDark:   0x978b96,
  rock:        0x8b7f8d,
  rockDark:    0x675d6c,
  plum:        0x37202e,
  plumDeep:    0x241320,
  glass:       0xcdeef0,
  velvet:      0x8d2334,
  ink:         0x3a2130,
};

/* ------------------------------------------------------------------ *
 *  TOON MATERIALS
 * ------------------------------------------------------------------ */
let _grad = null;
export function gradientMap() {
  if (_grad) return _grad;
  const steps = new Uint8Array([56, 104, 158, 212, 255]);
  _grad = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  _grad.minFilter = THREE.NearestFilter;
  _grad.magFilter = THREE.NearestFilter;
  _grad.generateMipmaps = false;
  _grad.needsUpdate = true;
  return _grad;
}

const _cache = new Map();
/** cached flat toon material */
export function matc(color, extra = {}) {
  const key = color + '|' + JSON.stringify(extra);
  if (_cache.has(key)) return _cache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...extra });
  _cache.set(key, m);
  return m;
}

/** uncached toon material (textured / animated) */
export function mat(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...extra });
}

export function emissive(color, intensity = 1, base = 0x2a1c10) {
  return matc(color, { emissive: color, emissiveIntensity: intensity, color: base });
}

export const GLASS = new THREE.MeshBasicMaterial({
  color: 0xdcf3f4, transparent: true, opacity: 0.08,
  depthWrite: false, side: THREE.DoubleSide,
});
export const GLASS_SOFT = new THREE.MeshBasicMaterial({
  color: 0xe8f7f6, transparent: true, opacity: 0.18,
  depthWrite: false, side: THREE.DoubleSide,
});

/* ------------------------------------------------------------------ *
 *  GEOMETRY HELPERS
 * ------------------------------------------------------------------ */
export function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export const bx = (w, h, d, m, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
export const rbx = (w, h, d, r, m, x = 0, y = 0, z = 0, seg = 2) =>
  mesh(new RoundedBoxGeometry(w, h, d, seg, r), m, x, y, z);
export const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
export const sph = (r, m, x = 0, y = 0, z = 0, seg = 20) =>
  mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), m, x, y, z);
export const cone = (r, h, m, x = 0, y = 0, z = 0, seg = 20) =>
  mesh(new THREE.ConeGeometry(r, h, seg), m, x, y, z);
export const plane = (w, h, m, x = 0, y = 0, z = 0, rx = -Math.PI / 2) => {
  const p = mesh(new THREE.PlaneGeometry(w, h), m, x, y, z);
  p.rotation.x = rx;
  return p;
};
export function grp(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}
export function add(parent, ...kids) {
  for (const k of kids) if (k) parent.add(k);
  return parent;
}
export function noShadow(o) {
  o.traverse((c) => { c.castShadow = false; c.receiveShadow = false; });
  return o;
}
export function instanced(geo, material, list, cast = true) {
  const im = new THREE.InstancedMesh(geo, material, list.length);
  const d = new THREE.Object3D();
  list.forEach((it, i) => {
    d.position.set(it.p[0], it.p[1], it.p[2]);
    if (it.r) d.rotation.set(it.r[0], it.r[1], it.r[2]); else d.rotation.set(0, 0, 0);
    if (it.s) d.scale.set(it.s[0], it.s[1], it.s[2]); else d.scale.set(1, 1, 1);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  });
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = cast;
  im.receiveShadow = cast;
  return im;
}

/** half-torus arch, opening downward (top half of a circle) */
export function archRing(radius, tube, m, seg = 28) {
  const t = mesh(new THREE.TorusGeometry(radius, tube, 6, seg, Math.PI), m);
  return t;
}

/** flat ribbon strip along a straight line */
export function strip(w, l, m, x, y, z, rotY = 0) {
  const s = mesh(new THREE.BoxGeometry(w, 0.08, l), m, x, y, z);
  s.rotation.y = rotY;
  s.castShadow = false;
  return s;
}

export function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
  });
}

/** text sprite (used for tiny signage) */
export function textPlane(text, opts = {}) {
  const {
    w = 512, h = 128, font = 'bold 64px Georgia, serif',
    color = '#f6d548', bg = 'transparent', pad = 8,
  } = opts;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  if (bg !== 'transparent') { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = color;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + pad);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
