import * as THREE from 'three';
import { C, matc, mat, bx, rbx, cyl, sph, cone, plane, grp, add, instanced, strip } from './lib.js';
import * as T from './textures.js';

const S = 60;      // half footprint
const ROCK_BOT = -26;
const ROCK_TOP = -4;

/* ================================================================== *
 *  BASE : plinth · alpine rock · tunnel · parquet plaza · belvedere
 * ================================================================== */
export function createBase() {
  const g = grp();
  const stoneTex = T.stone();
  stoneTex.repeat.set(3, 1.3);
  const stoneMat = mat(0xbdb2ba, { map: stoneTex });

  /* ---------------- wooden plinth ---------------- */
  const plinth = rbx(129, 4.2, 129, 0.55, matc(0x3d2230), 0, -28.1, 0, 2);
  g.add(plinth);
  g.add(bx(121.5, 0.5, 121.5, matc(C.brass), 0, -26.1, 0));
  // brass plaque
  const plaqueTex = T.plaque();
  const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.1), plaqueMat);
  pl.position.set(0, -28.2, 64.56);
  g.add(pl);

  /* ---------------- rock body ---------------- */
  const body = bx(120, 22, 112, stoneMat, 0, -15, -4);
  g.add(body);

  /* ---------------- front facade with tunnel arch ---------------- */
  const facadeTex = T.stone();
  facadeTex.repeat.set(0.05, 0.14);
  const facadeMat = mat(0xc4b9c1, { map: facadeTex });

  const shape = new THREE.Shape();
  shape.moveTo(-S, 0); shape.lineTo(S, 0); shape.lineTo(S, 22); shape.lineTo(-S, 22); shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-9, 6);
  hole.lineTo(-9, 10);
  hole.absarc(0, 10, 9, Math.PI, 0, true);
  hole.lineTo(9, 6);
  hole.closePath();
  shape.holes.push(hole);
  const facadeGeo = new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false, curveSegments: 32 });
  const facade = new THREE.Mesh(facadeGeo, facadeMat);
  facade.position.set(0, ROCK_BOT, 52);
  facade.castShadow = true; facade.receiveShadow = true;
  g.add(facade);

  /* ---------------- voussoirs + keystone ---------------- */
  const vsMat = matc(0xd8ccd2);
  const vous = [];
  for (let i = 0; i <= 21; i++) {
    const a = (i / 21) * Math.PI;
    const r = 10.4;
    vous.push({
      p: [Math.cos(a) * r, ROCK_BOT + 10 + Math.sin(a) * r, 60.3],
      r: [0, 0, a - Math.PI / 2],
    });
  }
  const vousGeo = new THREE.BoxGeometry(1.45, 2.0, 1.5);
  g.add(instanced(vousGeo, vsMat, vous));
  // keystone
  const key = bx(2.8, 3.6, 2.6, matc(0xe6dbe0), 0, ROCK_BOT + 20.4, 60.5);
  g.add(key);
  g.add(bx(2.4, 1.0, 0.5, matc(C.brass), 0, ROCK_BOT + 20.9, 61.9));

  // impost blocks
  for (const s of [-1, 1]) {
    g.add(bx(3.2, 1.2, 2.2, matc(0xd8ccd2), s * 10.6, ROCK_BOT + 10, 60.4));
  }

  /* ---------------- tunnel interior ---------------- */
  const tunMat = new THREE.MeshBasicMaterial({ color: 0x1b1018, side: THREE.BackSide });
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(18.2, 15.0, 24), tunMat);
  tunnel.position.set(0, ROCK_BOT + 8.4, 46);
  g.add(tunnel);
  // warm tunnel lamps
  for (const z of [49.5, 44]) {
    const bulb = sph(0.5, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0, ROCK_BOT + 12.6, z, 10);
    g.add(bulb);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({
      map: T.glowTexture(), color: 0xffa95e, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    gl.scale.set(9, 9, 1);
    gl.position.set(0, ROCK_BOT + 12.2, z);
    g.add(gl);
  }
  const tunnelLight = new THREE.PointLight(0xffa860, 26, 34, 1.2);
  tunnelLight.position.set(0, ROCK_BOT + 10, 47);
  g.add(tunnelLight);

  /* ---------------- track + apron ---------------- */
  const railMat = matc(0x5a4a52);
  const sleeperMat = matc(C.woodDark);
  const ballastMat = matc(0x7a6f7a);
  const trackY = ROCK_BOT + 6.0;   // -20

  g.add(bx(11.5, 0.9, 25, ballastMat, 0, trackY - 0.45, 52.5));
  // apron slab outside the portal
  const apron = bx(26, 1.5, 7.2, matc(0xb9aeb7), 0, trackY - 0.75, 63.2);
  g.add(apron);
  for (const s of [-1, 1]) {
    g.add(bx(3.0, 2.2, 1.6, matc(0xa398a2), s * 10, trackY - 1.5, 65.4));
  }
  // rails
  for (const s of [-1, 1]) {
    g.add(bx(0.42, 0.42, 25, railMat, s * 2.75, trackY + 0.25, 52.5));
  }
  // sleepers
  const sleepers = [];
  for (let i = 0; i < 15; i++) sleepers.push({ p: [0, trackY + 0.02, 41 + i * 1.72] });
  g.add(instanced(new THREE.BoxGeometry(9.2, 0.34, 1.1), sleeperMat, sleepers));
  // rack rail teeth
  const teeth = [];
  for (let i = 0; i < 44; i++) teeth.push({ p: [0, trackY + 0.26, 41.6 + i * 0.56] });
  g.add(instanced(new THREE.BoxGeometry(1.5, 0.44, 0.26), railMat, teeth));
  g.add(bx(0.5, 0.5, 25, railMat, 0, trackY + 0.02, 52.5));

  /* ---------------- rock buttresses around the cliff ---------------- */
  const buttMat = matc(0xa89bab);
  const buttSnow = matc(C.snow);
  const addButt = (x, z, w, d) => {
    g.add(rbx(w, 21.5, d, 0.7, buttMat, x, -15.2, z, 1));
    g.add(rbx(w * 0.9, 0.7, d * 0.9, 0.3, buttSnow, x, -4.6, z, 1));
  };
  for (const x of [-45, -24.5, 24.5, 45]) addButt(x, 60.4, 5.0, 2.6);
  for (const z of [-45, -24.5, 24.5, 45]) {
    addButt(60.4, z, 2.6, 5.0);
    addButt(-60.4, z, 2.6, 5.0);
  }
  // icicles under the cornice
  const iceMat2 = new THREE.MeshToonMaterial({ color: 0xe2f3f5, gradientMap: matc(0xffffff).gradientMap, transparent: true, opacity: 0.9 });
  for (const s2 of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = -46 + i * 11 + (i % 3) * 2.4;
      const h = 1.0 + ((i * 5) % 4) * 0.55;
      const ic = cone(0.26, h, iceMat2, s2 * 60.1, -5.2 - h / 2, z, 6);
      ic.rotation.x = Math.PI;
      ic.castShadow = false;
      g.add(ic);
    }
  }

  /* ---------------- plaza slab ---------------- */
  const plazaSide = matc(0xc9bec6);
  g.add(bx(120, 4, 120, plazaSide, 0, -2, 0));
  const parquetTex = T.parquet();
  const parquetMat = mat(0xffffff, { map: parquetTex });
  const plaza = plane(120, 120, parquetMat, 0, 0.02, 0);
  plaza.receiveShadow = true;
  g.add(plaza);

  // brass inlay frame
  const brass = matc(C.brass);
  for (const s of [-1, 1]) {
    g.add(strip(108, 0.55, brass, 0, 0.09, s * 54, 0));
    g.add(strip(0.55, 108, brass, s * 54, 0.09, 0, 0));
  }
  // axial strips leading to the terrace
  for (const s of [-1, 1]) {
    g.add(strip(0.42, 38, brass, s * 2.6, 0.09, 33));
  }

  // compass medallion in the forecourt
  const medMat = new THREE.MeshBasicMaterial({ map: T.medallion(), transparent: true });
  const med = plane(19, 19, medMat, 0, 0.14, 32);
  g.add(med);

  // stone kerb along the edges
  const kerb = matc(0xd6cbd2);
  for (const s of [-1, 1]) {
    g.add(bx(1.6, 0.55, 118, kerb, s * 58.6, 0.25, 0));
    g.add(bx(118, 0.55, 1.6, kerb, 0, 0.25, s * 58.6));
  }

  /* ---------------- snow cornice on the rock ---------------- */
  const snow = matc(C.snow);
  for (const s of [-1, 1]) {
    g.add(rbx(2.6, 1.5, 121, 0.6, snow, s * 59.2, -4.6, 0));
    g.add(rbx(121, 1.5, 2.6, 0.6, snow, 0, -4.6, s * 59.2));
  }
  // icicles under the front cornice
  const iceMat = new THREE.MeshToonMaterial({ color: 0xdff2f4, gradientMap: matc(0xffffff).gradientMap, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 16; i++) {
    const x = -52 + i * 7 + (i % 3) * 1.2;
    const h = 1.2 + ((i * 7) % 5) * 0.55;
    const ic = cone(0.28, h, iceMat, x, -5.3 - h / 2, 60.2, 6);
    ic.rotation.x = Math.PI;
    ic.castShadow = false;
    g.add(ic);
  }

  // snow banks on the plaza rim
  const bank = matc(C.snow);
  for (const s of [-1, 1]) {
    g.add(rbx(3.4, 1.1, 104, 1.5, bank, s * 56.2, 0.35, -2));
    g.add(rbx(104, 1.1, 3.4, 1.5, bank, 0, 0.35, s * 56.2 - 2));
  }

  /* ---------------- rock outcrops + snow ledges ---------------- */
  const rockMat = matc(0x9a8d9c);
  const ledgeSnow = matc(C.snow);
  function outcrop(x, y, z, w, h, d, ry = 0, rx = 0) {
    const grpL = grp(x, y, z);
    grpL.rotation.y = ry;
    grpL.rotation.x = rx;
    const b = rbx(w, h, d, 0.7, rockMat, 0, 0, 0, 1);
    grpL.add(b);
    grpL.add(rbx(w * 0.98, h * 0.3, d * 0.98, 0.5, ledgeSnow, 0, h * 0.42, 0, 1));
    return grpL;
  }
  // vertical rock buttresses at the corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const bt = rbx(7, 21, 7, 1.0, rockMat, sx * 57.5, -15.5, sz * 57.5, 1);
    g.add(bt);
    g.add(rbx(7.6, 1.6, 7.6, 0.6, ledgeSnow, sx * 57.5, -5.4, sz * 57.5, 1));
  }
  // snow drift where the rock meets the plinth
  for (const s2 of [-1, 1]) {
    g.add(rbx(112, 1.4, 3.0, 0.7, ledgeSnow, 0, -25.2, s2 * 58.6, 1));
    g.add(rbx(3.0, 1.4, 112, 0.7, ledgeSnow, s2 * 58.6, -25.2, 0, 1));
  }

  /* ---------------- hotel steps ---------------- */
  for (let i = 0; i < 4; i++) {
    g.add(bx(29 - i * 1.3, 0.3, 1.6, matc(0xe7dcd6), 0, 0.15 + i * 0.3, 18.6 - i * 1.35));
    g.add(bx(29 - i * 1.3, 0.06, 0.5, brass, 0, 0.31 + i * 0.3, 18.0 - i * 1.35));
  }

  /* ---------------- front parapet ---------------- */
  for (const s2 of [-1, 1]) {
    g.add(bx(50, 1.3, 1.4, matc(0xd9ced5), s2 * 31, 0.65, 58.8));
    g.add(bx(50, 0.22, 1.7, matc(C.cream), s2 * 31, 1.35, 58.8));
    g.add(bx(50, 0.2, 0.2, matc(C.brass), s2 * 31, 2.6, 58.8));
    const bars = [];
    for (let i = 0; i < 22; i++) bars.push({ p: [s2 * 31 - s2 * 24 + i * 2.3 * s2, 1.95, 58.8] });
    g.add(instanced(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), matc(C.brass), bars));
    g.add(rbx(50, 0.25, 1.7, 0.1, matc(C.snow), s2 * 31, 1.5, 58.8, 1));
  }

  /* ---------------- cliff belvedere ---------------- */
  const bel = grp();
  bel.rotation.y = Math.PI / 2;
  g.add(bel);

  const deck = rbx(44, 1.3, 15, 0.25, matc(0xd9ced5), 0, -0.65, 58.6, 2);
  bel.add(deck);
  // deck parquet top
  const deckTop = plane(43.2, 14.2, mat(0xf2e2cb), 0, 0.03, 58.6);
  bel.add(deckTop);
  // brackets
  for (const s of [-1, 1]) {
    const br = bx(6, 3.4, 9, matc(0xb9aeb7), s * 13, -2.6, 61.5);
    br.rotation.x = -0.22;
    bel.add(br);
  }
  // railing
  const postMat = matc(C.mintDeep);
  const railMat2 = matc(C.brass);
  const posts = [];
  const bars = [];
  const railY = 3.2;
  const edges = [
    { from: [-21, 51.4], to: [21, 51.4], skip: true },
    { from: [-21, 51.4], to: [-21, 65.8] },
    { from: [21, 51.4], to: [21, 65.8] },
    { from: [-21, 65.8], to: [21, 65.8] },
  ];
  for (const e of edges) {
    if (e.skip) continue;
    const dx = e.to[0] - e.from[0], dz = e.to[1] - e.from[1];
    const len = Math.hypot(dx, dz);
    const n = Math.max(2, Math.round(len / 2.6));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      posts.push({ p: [e.from[0] + dx * t, railY / 2, e.from[1] + dz * t] });
    }
    // vertical bars
    const nb = Math.round(len / 0.55);
    for (let i = 1; i < nb; i++) {
      const t = i / nb;
      bars.push({ p: [e.from[0] + dx * t, railY / 2 - 0.1, e.from[1] + dz * t] });
    }
    // top rail
    const rail = bx(0.22, 0.22, len, railMat2, (e.from[0] + e.to[0]) / 2, railY, (e.from[1] + e.to[1]) / 2);
    rail.rotation.y = Math.atan2(dx, dz);
    bel.add(rail);
    const rail2 = bx(0.16, 0.16, len, railMat2, (e.from[0] + e.to[0]) / 2, 0.35, (e.from[1] + e.to[1]) / 2);
    rail2.rotation.y = Math.atan2(dx, dz);
    bel.add(rail2);
  }
  bel.add(instanced(new THREE.CylinderGeometry(0.26, 0.3, railY, 8), postMat, posts));
  bel.add(instanced(new THREE.CylinderGeometry(0.06, 0.06, railY - 0.5, 6), railMat2, bars));
  // post finials
  const finials = posts.map((p) => ({ p: [p.p[0], railY + 0.16, p.p[2]] }));
  bel.add(instanced(new THREE.SphereGeometry(0.24, 8, 6), railMat2, finials));

  // snow dusting on the deck rail
  for (const s of [-1, 1]) {
    bel.add(rbx(0.4, 0.16, 14.4, 0.08, snow, s * 21, railY + 0.2, 58.6));
  }
  bel.add(rbx(43, 0.16, 0.4, 0.08, snow, 0, railY + 0.2, 65.8));

  // soft alpine mist around the plinth
  const mistTex = T.glowTexture();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mistTex, color: 0xe6a8c0, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(64, 26, 1);
    sp.position.set(Math.cos(a) * 52, -25, Math.sin(a) * 52);
    g.add(sp);
  }

  return g;
}

export const BASE = { S, ROCK_BOT, ROCK_TOP };
