import * as THREE from 'three';
import { C, matc, mat, bx, rbx, cyl, sph, cone, plane, grp, add, instanced, GLASS_SOFT } from './lib.js';
import * as T from './textures.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function cylBetween(a, b, r, m, seg = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
  g.position.copy(a).addScaledVector(dir, 0.5);
  g.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
  g.castShadow = true;
  return g;
}

/* ------------------------------------------------------------------ *
 *  snow-laden alpine pine
 * ------------------------------------------------------------------ */
export function pine(x, z, h = 15) {
  const g = grp(x, 0, z);
  const trunk = matc(0x6a4630);
  const green = matc(0x2f6b5e);
  const greenDeep = matc(0x235247);
  const snow = matc(C.snow);
  g.add(cyl(0.36, 0.62, h * 0.22, trunk, 0, h * 0.11, 0, 8));
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers;
    const r = h * (0.31 - k * 0.088);
    const y0 = h * (0.10 + k * 0.285);
    const hh = h * 0.46;
    const c = cone(r, hh, i % 2 ? green : greenDeep, 0, y0 + hh / 2, 0, 12);
    g.add(c);
    const sc = cone(r * 0.50, hh * 0.45, snow, 0, y0 + hh * 0.775, 0, 12);
    g.add(sc);
    const cap = cone(r * 0.20, hh * 0.18, snow, 0, y0 + hh * 0.91, 0, 10);
    g.add(cap);
  }
  g.add(cone(h * 0.05, h * 0.14, snow, 0, h * 0.98, 0, 8));
  // snow drift at the foot
  const drift = sph(h * 0.16, snow, 0, 0.15, 0, 10);
  drift.scale.set(1.5, 0.28, 1.5);
  g.add(drift);
  return g;
}

/* ------------------------------------------------------------------ *
 *  vintage snow postal bus
 * ------------------------------------------------------------------ */
export function postalBus(x, z, ry = -0.5) {
  const g = grp(x, 0, z);
  g.rotation.y = ry;
  const lemon = matc(C.lemon);
  const cream = matc(C.cream);
  const teal = matc(0x2c4a52);
  const brass = matc(C.brass);
  const red = matc(C.red);
  const snow = matc(C.snow);

  g.add(rbx(21, 5.6, 7.6, 1.4, lemon, 0, 4.6, 0, 2));
  g.add(rbx(21.4, 1.5, 7.9, 0.5, cream, 0, 1.5, 0, 2));
  g.add(rbx(20.4, 1.0, 7.0, 0.5, cream, 0, 7.5, 0, 2));
  g.add(rbx(19.4, 0.5, 6.6, 0.25, snow, 0, 8.1, 0, 2));
  // red waistline
  g.add(bx(21.1, 0.5, 7.7, red, 0, 3.0, 0));
  // windows
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const w = rbx(3.3, 2.2, 0.2, 0.2, teal, -7.6 + i * 5.1, 5.5, s * 3.85, 1);
      g.add(w);
      g.add(bx(3.6, 0.22, 0.28, brass, -7.6 + i * 5.1, 6.7, s * 3.86));
    }
    // front + rear side lights
    g.add(sph(0.3, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), -10.2, 3.9, s * 3.5, 8));
  }
  // windshield
  g.add(rbx(0.3, 2.4, 6.0, 0.2, teal, 10.3, 5.6, 0, 1));
  g.add(bx(0.4, 2.8, 6.4, brass, 10.35, 5.6, 0));
  // grille
  for (let i = 0; i < 5; i++) {
    g.add(bx(0.2, 1.5, 5.6, brass, 10.6, 3.0, 0));
  }
  // headlights
  for (const s of [-1, 1]) {
    g.add(cyl(0.62, 0.62, 0.5, brass, 10.5, 2.9, s * 2.6, 12));
    const lens = cyl(0.45, 0.45, 0.12, new THREE.MeshBasicMaterial({ color: 0xffe9bd }), 10.78, 2.9, s * 2.6, 12);
    lens.rotation.z = Math.PI / 2;
    g.add(lens);
  }
  // wheels
  for (const s of [-1, 1]) {
    for (const wx of [-6.4, 6.4]) {
      const wh = cyl(1.5, 1.5, 0.9, matc(0x2b2028), wx, 1.5, s * 3.9, 16);
      wh.rotation.x = Math.PI / 2;
      g.add(wh);
      const hub = cyl(0.62, 0.62, 1.0, brass, wx, 1.5, s * 3.9, 12);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
      // snow chains
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 5, 16), matc(0xd8d0d6));
      ring.position.set(wx, 1.5, s * 4.35);
      g.add(ring);
    }
  }
  // roof rack + luggage
  for (const s of [-1, 1]) {
    g.add(bx(15, 0.16, 0.16, brass, 0, 8.5, s * 2.2));
  }
  g.add(rbx(4.4, 1.6, 3.0, 0.3, matc(0x7a4a2e), -4.2, 9.3, 0, 2));
  g.add(rbx(3.6, 1.3, 2.6, 0.3, matc(C.burgundy), 1.2, 9.2, 0, 2));
  g.add(bx(4.5, 0.22, 3.1, matc(0xe9dcc6), -4.2, 10.15, 0));
  // mail flag
  g.add(cyl(0.1, 0.1, 1.4, brass, -8.4, 8.8, 2.9, 6));
  g.add(bx(0.12, 0.9, 1.2, red, -8.4, 9.1, 3.4));
  // post horn emblem
  const horn1 = cyl(1.1, 1.1, 0.14, brass, 0, 4.6, 3.92, 18);
  horn1.rotation.x = Math.PI / 2; g.add(horn1);
  const horn2 = cyl(0.9, 0.9, 0.16, matc(C.lemon), 0, 4.6, 3.99, 18);
  horn2.rotation.x = Math.PI / 2; g.add(horn2);

  return g;
}

/* ------------------------------------------------------------------ *
 *  luggage trolley with stickered trunks
 * ------------------------------------------------------------------ */
export function luggageCart(x, z, ry = 0.45) {
  const g = grp(x, 0, z);
  g.rotation.y = ry;
  const brass = matc(C.brass);
  const wood = matc(C.woodDark);

  g.add(bx(8.4, 0.36, 5.0, wood, 0, 1.5, 0));
  g.add(bx(8.8, 0.16, 5.4, brass, 0, 1.32, 0));
  for (const s of [-1, 1]) {
    const wh = cyl(1.35, 1.35, 0.3, matc(0x2b2028), 2.6, 1.35, s * 2.55, 16);
    wh.rotation.x = Math.PI / 2;
    g.add(wh);
    const hub = cyl(0.55, 0.55, 0.36, brass, 2.6, 1.35, s * 2.55, 12);
    hub.rotation.x = Math.PI / 2; g.add(hub);
    const caster = cyl(0.5, 0.5, 0.3, matc(0x2b2028), -2.9, 0.5, s * 2.2, 12);
    caster.rotation.x = Math.PI / 2; g.add(caster);
  }
  // handle
  for (const s of [-1, 1]) {
    const h = cyl(0.13, 0.13, 6.2, brass, -4.1, 4.5, s * 2.0, 8);
    h.rotation.z = 0.12;
    g.add(h);
  }
  g.add(bx(0.18, 0.18, 4.2, brass, -4.45, 7.55, 0));
  g.add(bx(0.5, 1.0, 4.4, matc(C.burgundy), -4.4, 7.1, 0));

  // trunks
  const leather = mat(0xffffff, { map: T.stickers() });
  const zebraMat = mat(0xffffff, { map: T.zebra() });
  const t1 = rbx(5.6, 2.3, 3.4, 0.22, leather, 0, 2.9, 0, 2);
  g.add(t1);
  const t2 = rbx(4.7, 1.9, 3.0, 0.2, zebraMat, -0.2, 5.0, 0, 2);
  g.add(t2);
  const t3 = rbx(3.5, 1.5, 2.4, 0.2, matc(C.burgundy), 0.2, 6.7, 0, 2);
  g.add(t3);
  g.add(cyl(1.0, 1.0, 1.0, matc(C.cream), 0.2, 8.0, 0, 14));
  g.add(cyl(1.02, 1.02, 0.14, matc(C.red), 0.2, 8.2, 0, 14));
  // straps + corners
  for (const t of [[5.6, 2.3, 3.4, 0, 2.9], [4.7, 1.9, 3.0, -0.2, 5.0]]) {
    g.add(bx(0.24, t[1] + 0.1, t[2] + 0.1, matc(0x5a3a26), t[3] - t[0] * 0.28, t[4], 0));
    g.add(bx(0.24, t[1] + 0.1, t[2] + 0.1, matc(0x5a3a26), t[3] + t[0] * 0.28, t[4], 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(bx(0.3, 0.3, 0.3, matc(C.brass), t[3] + sx * t[0] / 2, t[4] + sz * t[1] / 2, sz * t[2] / 2));
    }
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  royal ski rack
 * ------------------------------------------------------------------ */
export function skiRack(x, z, ry = 0, sc = 1) {
  const g = grp(x, 0, z);
  g.rotation.y = ry;
  g.scale.setScalar(sc);
  const red = matc(C.red);
  const brass = matc(C.brass);
  for (const s of [-1, 1]) {
    const p1 = cyl(0.16, 0.16, 5.4, red, s * 2.6, 2.6, -0.9, 8);
    p1.rotation.x = 0.18; g.add(p1);
    const p2 = cyl(0.16, 0.16, 5.4, red, s * 2.6, 2.6, 0.9, 8);
    p2.rotation.x = -0.18; g.add(p2);
    g.add(sph(0.22, brass, s * 2.6, 5.3, 0, 8));
  }
  g.add(bx(5.6, 0.2, 0.2, red, 0, 3.9, 0));
  g.add(bx(5.6, 0.2, 0.2, red, 0, 1.2, 0));
  // skis
  const cols = [C.cream, C.red, C.mint, C.butter];
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const sk = bx(0.46, 8.4, 0.22, matc(cols[(i + (s > 0 ? 1 : 0)) % 4]), -1.6 + i * 1.1, 4.3, s * 0.6);
      sk.rotation.z = (i - 1.5) * 0.04;
      g.add(sk);
      const tip = bx(0.46, 0.9, 0.22, matc(cols[i % 4]), -1.6 + i * 1.1, 8.6, s * 0.6);
      tip.rotation.x = s * 0.5;
      g.add(tip);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  mint cast-iron telescope
 * ------------------------------------------------------------------ */
export function telescope(x, z, ry = 0) {
  const g = grp(x, 0, z);
  g.rotation.y = ry;
  const mint = matc(C.mintDeep);
  const brass = matc(C.brass);
  g.add(cyl(1.1, 1.3, 0.35, mint, 0, 0.17, 0, 16));
  g.add(cyl(0.55, 0.85, 1.4, mint, 0, 1.0, 0, 16));
  g.add(cyl(0.34, 0.34, 3.6, mint, 0, 3.4, 0, 14));
  g.add(cyl(0.42, 0.42, 0.3, brass, 0, 5.15, 0, 14));
  g.add(bx(1.9, 0.34, 0.34, brass, 0, 5.45, 0));
  const barrel = grp(0, 5.6, 0);
  barrel.rotation.x = -0.42;
  barrel.add(cyl(0.52, 0.42, 3.6, brass, 0, 0.35, 0, 16));
  barrel.add(cyl(0.56, 0.56, 0.4, mint, 0, -1.1, 0, 16));
  barrel.add(cyl(0.62, 0.62, 0.25, mint, 0, 1.9, 0, 16));
  barrel.add(cyl(0.3, 0.3, 0.5, matc(0x2b2028), 0, -1.55, 0, 12));
  g.add(barrel);
  g.add(bx(0.9, 0.55, 0.9, brass, 0, 3.0, 0.62));
  return g;
}

/* ------------------------------------------------------------------ *
 *  park bench
 * ------------------------------------------------------------------ */
export function bench(x, z, ry = 0) {
  const g = grp(x, 0, z);
  g.rotation.y = ry;
  const mint = matc(C.mintDeep);
  const brass = matc(C.brass);
  for (const s of [-1, 1]) {
    g.add(bx(0.2, 1.4, 0.2, brass, s * 2.4, 0.7, -0.7));
    g.add(bx(0.2, 1.4, 0.2, brass, s * 2.4, 0.7, 0.7));
    g.add(bx(0.2, 2.0, 0.2, brass, s * 2.4, 1.6, 1.0));
  }
  for (let i = 0; i < 4; i++) {
    g.add(bx(5.4, 0.18, 0.5, mint, 0, 1.42, -0.75 + i * 0.5));
  }
  for (let i = 0; i < 3; i++) {
    g.add(bx(5.4, 0.4, 0.16, mint, 0, 1.8 + i * 0.55, 1.02));
  }
  g.add(rbx(5.5, 0.14, 1.7, 0.06, matc(C.snow), 0, 1.53, 0));
  return g;
}

/* ------------------------------------------------------------------ *
 *  lamp post
 * ------------------------------------------------------------------ */
export function lampPost(x, z) {
  const g = grp(x, 0, z);
  const mint = matc(C.mintDeep);
  const brass = matc(C.brass);
  g.add(cyl(0.85, 1.05, 0.4, mint, 0, 0.2, 0, 12));
  g.add(cyl(0.26, 0.34, 8.2, mint, 0, 4.3, 0, 12));
  g.add(cyl(0.5, 0.5, 0.3, brass, 0, 8.5, 0, 12));
  // lantern
  g.add(bx(1.5, 0.25, 1.5, brass, 0, 8.75, 0));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.9, 1.35), GLASS_SOFT);
  glass.position.y = 9.8;
  glass.userData.glass = true;
  g.add(glass);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(bx(0.12, 2.0, 0.12, brass, sx * 0.68, 9.8, sz * 0.68));
  }
  g.add(sph(0.32, new THREE.MeshBasicMaterial({ color: 0xffdda8 }), 0, 9.8, 0, 10));
  const cap = cone(1.25, 0.85, mint, 0, 11.1, 0, 4);
  cap.rotation.y = Math.PI / 4; g.add(cap);
  g.add(sph(0.2, brass, 0, 11.65, 0, 8));
  g.add(rbx(1.5, 0.18, 1.5, 0.08, matc(C.snow), 0, 11.48, 0));
  return g;
}

/* ------------------------------------------------------------------ *
 *  aerial cable car  (station + pylon + swaying cabin)
 * ------------------------------------------------------------------ */
export function cableCar() {
  const g = grp();
  const mint = matc(C.mintDeep);
  const brass = matc(C.brass);
  const red = matc(C.red);

  const A = V3(-32.0, 31.0, -1.0);
  const B = V3(-53.5, 23.4, 21.0);

  /* ---- station grafted on the hotel's left flank ---- */
  const st = grp(A.x, A.y, A.z);
  st.add(bx(8.4, 0.55, 10.0, matc(0xcfc4cc), 3.4, -0.3, 0));
  st.add(bx(0.5, 4.4, 10.0, mint, 7.2, 1.9, 0));
  st.add(bx(8.8, 0.6, 10.6, matc(C.cream), 3.4, 4.0, 0));
  st.add(bx(9.0, 0.22, 10.8, brass, 3.4, 4.35, 0));
  st.add(rbx(9.0, 0.3, 10.8, 0.1, matc(C.snow), 3.4, 4.6, 0));
  // canopy posts
  for (const sz of [-4.6, 4.6]) st.add(cyl(0.16, 0.16, 4.0, mint, 1.0, 2.0, sz, 8));
  // big wheel
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.24, 6, 22), brass);
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(0, 0, 0);
  st.add(wheel);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = cyl(0.09, 0.09, 4.4, brass, 0, 0, 0, 6);
    sp.rotation.x = a;
    st.add(sp);
  }
  // diagonal braces back to the hotel wall
  for (const sz of [-3.6, 3.6]) {
    const br = cylBetween(V3(A.x + 5.6, A.y - 5.4, A.z + sz), V3(A.x + 2.0, A.y - 0.4, A.z + sz), 0.16, mint, 6);
    g.add(br);
  }
  g.add(st);

  /* ---- lattice pylon at the base edge ---- */
  const py = grp(-53.5, 0, 21);
  py.add(bx(5.0, 1.2, 5.0, matc(0xb9aeb7), 0, 0.6, 0));
  py.add(rbx(5.4, 0.3, 5.4, 0.1, matc(C.snow), 0, 1.28, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = cyl(0.22, 0.34, 21, mint, sx * 1.8, 10.5, sz * 1.8, 8);
    leg.rotation.x = sz * 0.045;
    leg.rotation.z = -sx * 0.045;
    py.add(leg);
  }
  for (let i = 0; i < 6; i++) {
    const y = 2.6 + i * 3.2;
    const s = 3.6 - i * 0.28;
    for (const sz of [-1, 1]) py.add(bx(s, 0.14, 0.14, mint, 0, y, sz * (1.8 - i * 0.1)));
    for (const sx of [-1, 1]) py.add(bx(0.14, 0.14, s, mint, sx * (1.8 - i * 0.1), y, 0));
    // diagonal
    const dg = cyl(0.1, 0.1, s * 1.4, mint, 0, y + 1.6, s * 0.9, 5);
    dg.rotation.z = 0.7;
    py.add(dg);
  }
  py.add(bx(4.6, 0.5, 1.0, mint, 0, 21.2, 0));
  py.add(bx(6.2, 0.45, 0.6, brass, 0, 21.9, 0));
  const wheel2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.2, 6, 18), brass);
  wheel2.rotation.y = Math.PI / 2;
  wheel2.position.set(0, 22.4, 0);
  py.add(wheel2);
  py.add(rbx(3.0, 0.28, 3.0, 0.1, matc(C.snow), 0, 22.5, 0));
  g.add(py);

  /* ---- cables ---- */
  for (const off of [-0.42, 0.42]) {
    const a = A.clone().add(V3(0, 0, off));
    const b = B.clone().add(V3(0, 0, off));
    const cable = cylBetween(a, b, 0.09, red, 5);
    cable.castShadow = false;
    g.add(cable);
  }

  /* ---- cabin ---- */
  const t = 0.5;
  const anchor = A.clone().lerp(B, t);
  const sway = grp(anchor.x, anchor.y, anchor.z);
  // hanger
  sway.add(bx(0.4, 3.4, 0.4, brass, 0, -1.7, 0));
  sway.add(bx(2.2, 0.3, 0.5, brass, 0, -3.2, 0));
  const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 5, 12), brass);
  pulley.rotation.y = Math.PI / 2;
  pulley.position.y = 0.2;
  sway.add(pulley);

  const cab = grp(0, -6.1, 0);
  cab.add(rbx(7.4, 4.6, 6.6, 0.9, matc(C.lemon), 0, 0, 0, 2));
  cab.add(rbx(7.8, 0.6, 7.0, 0.25, matc(C.cream), 0, 2.35, 0, 2));
  cab.add(rbx(6.6, 0.5, 6.0, 0.2, matc(C.cream), 0, -2.3, 0, 2));
  cab.add(rbx(7.6, 0.22, 6.8, 0.1, matc(C.snow), 0, 2.72, 0, 2));
  // windows
  for (const s of [-1, 1]) {
    cab.add(rbx(5.6, 2.2, 0.18, 0.12, matc(0x2c4a52), 0, 0.5, s * 3.32, 1));
    cab.add(rbx(0.18, 2.2, 4.8, 0.12, matc(0x2c4a52), s * 3.72, 0.5, 0, 1));
    cab.add(bx(6.0, 0.16, 0.24, brass, 0, 1.65, s * 3.35));
    cab.add(bx(6.0, 0.16, 0.24, brass, 0, -0.62, s * 3.35));
    // warm interior
    cab.add(sph(0.35, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0, 0.5, s * 2.6, 8));
  }
  cab.add(bx(0.2, 4.2, 6.2, brass, 0, 0, 0));
  cab.add(bx(7.6, 0.18, 0.18, brass, 0, 2.05, 0));
  cab.add(bx(7.6, 0.18, 0.18, brass, 0, -1.05, 0));
  // door
  cab.add(bx(1.8, 3.4, 0.14, matc(C.lemonDeep), 0, -0.2, 3.4));
  sway.add(cab);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: T.glowTexture(), color: 0xffc06a, transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.set(10, 10, 1);
  glow.position.set(0, -6.1, 0);
  sway.add(glow);

  g.add(sway);
  return { group: g, sway, anchor };
}

/* ------------------------------------------------------------------ *
 *  mint-green rack railway engine
 * ------------------------------------------------------------------ */
export function rackTrain() {
  const g = grp(0, -19.55, 55.0);
  g.scale.setScalar(1.34);
  const mint = matc(C.mint);
  const mintDeep = matc(C.mintDeep);
  const brass = matc(C.brass);
  const red = matc(C.red);
  const dark = matc(0x2b2028);

  // wheels
  for (const s of [-1, 1]) {
    for (const z of [-3.4, -0.2, 3.0]) {
      const wh = cyl(1.15, 1.15, 0.5, dark, s * 2.5, 1.15, z, 14);
      wh.rotation.z = Math.PI / 2;
      g.add(wh);
      const hub = cyl(0.42, 0.42, 0.56, red, s * 2.5, 1.15, z, 10);
      hub.rotation.z = Math.PI / 2;
      g.add(hub);
      const spoke = bx(0.14, 1.8, 0.14, brass, s * 2.5, 1.15, z);
      g.add(spoke);
    }
  }
  // frame
  g.add(bx(5.4, 0.8, 11.6, dark, 0, 2.1, 0));
  g.add(bx(6.2, 0.4, 12.2, red, 0, 1.6, 0));
  // boiler
  const boiler = cyl(2.0, 2.0, 7.4, mint, 0, 3.6, 2.4, 20);
  boiler.rotation.x = Math.PI / 2;
  g.add(boiler);
  for (const z of [-0.8, 1.6, 4.0]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.11, 5, 20), brass);
    band.position.set(0, 3.6, z);
    g.add(band);
  }
  // smokebox
  const sb = cyl(2.1, 2.1, 1.2, mintDeep, 0, 3.6, 6.2, 20);
  sb.rotation.x = Math.PI / 2;
  g.add(sb);
  // chimney
  g.add(cyl(0.62, 0.62, 2.2, dark, 0, 5.9, 6.0, 14));
  g.add(cyl(0.95, 0.72, 0.6, brass, 0, 7.1, 6.0, 14));
  g.add(cyl(0.62, 0.62, 0.3, matc(0x1a1218), 0, 7.35, 6.0, 14));
  // dome + whistle
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass);
  dome.position.set(0, 5.5, 2.2);
  g.add(dome);
  g.add(cyl(0.14, 0.14, 1.1, brass, 0.8, 6.1, 0.4, 8));
  // cab
  g.add(rbx(6.2, 5.0, 5.0, 0.35, mint, 0, 4.9, -4.2, 2));
  g.add(rbx(6.6, 0.4, 5.4, 0.2, brass, 0, 7.35, -4.2, 2));
  g.add(rbx(6.8, 0.3, 5.6, 0.12, matc(C.snow), 0, 7.6, -4.2, 2));
  for (const s of [-1, 1]) {
    g.add(rbx(2.0, 1.7, 0.18, 0.1, matc(0x2c4a52), s * 1.5, 5.6, -1.7, 1));
  }
  g.add(rbx(5.0, 1.6, 0.18, 0.1, matc(0x2c4a52), 0, 5.7, -6.72, 1));
  // cowcatcher
  const cow = bx(6.4, 1.4, 2.4, red, 0, 1.7, 7.4);
  cow.rotation.x = 0.3;
  g.add(cow);
  g.add(bx(6.6, 0.35, 0.35, brass, 0, 2.4, 8.2));
  // headlamp
  const lampBody = cyl(0.5, 0.5, 0.8, brass, 0, 5.2, 6.9, 12);
  lampBody.rotation.x = Math.PI / 2; g.add(lampBody);
  const lens = cyl(0.38, 0.38, 0.14, new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), 0, 5.2, 7.32, 12);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  // number plate
  g.add(bx(1.4, 0.7, 0.12, brass, 0, 3.6, 7.05));

  return g;
}

/* ------------------------------------------------------------------ *
 *  scene dressing
 * ------------------------------------------------------------------ */
export function createProps() {
  const g = grp();

  // symmetric pines
  const trees = [
    [-29, 19, 15], [29, 19, 15],
    [-44, 17, 17], [44, 17, 17],
    [-44, 44, 13], [44, 44, 13],
    [-41, -8, 14], [41, -8, 14],
    [-40, -34, 16], [40, -34, 16],
    [-14, -42, 12], [14, -42, 12],
    [-27, -46, 15], [27, -46, 15],
  ];
  for (const [x, z, h] of trees) g.add(pine(x, z, h));

  g.add(postalBus(29, 34, -0.52));
  g.add(luggageCart(-29, 33, 0.55));
  g.add(skiRack(-13.5, 20.5, 0));
  g.add(skiRack(13.5, 20.5, 0));
  g.add(telescope(-10.5, 62, 0.35));
  g.add(telescope(10.5, 62, -0.35));
  g.add(bench(-16.5, 56.5, Math.PI));
  g.add(bench(16.5, 56.5, Math.PI));

  for (const [x, z] of [[-46, 34], [46, 34], [-46, 6], [46, 6], [-34, -38], [34, -38]]) {
    g.add(lampPost(x, z));
  }

  const cable = cableCar();
  g.add(cable.group);
  g.add(rackTrain());

  return { group: g, cable };
}
