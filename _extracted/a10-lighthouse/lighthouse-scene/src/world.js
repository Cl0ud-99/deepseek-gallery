import * as THREE from 'three';
import {
  soilTexture, rockTexture, towerTexture, woodTexture, labelTexture,
  makeArcWall, makeArcSurface, makeCrate, mulberry32,
} from './lib.js';

export const DIM = {
  baseHalf: 5.4,
  notch: 1.95,
  soilBottom: -2.05,
  rockTop: 0.62,
  wallBottom: 1.44,
  wallTop: 9.2,
  rBottom: 2.12,
  rTop: 1.40,
  deckY: 9.2,
  deckTop: 9.38,
  glassBottom: 9.68,
  glassTop: 11.98,
  lensY: 10.72,
  roofTop: 13.0,
  topY: 14.3,
};

export function makeMaterials() {
  const soil = soilTexture();
  const rock = rockTexture();
  const towerTex = towerTexture();
  const wood = woodTexture();

  const M = {};
  M.soilTex = soil;
  M.rockTex = rock;
  M.woodTex = wood;

  M.iron = new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.52, metalness: 0.82, envMapIntensity: 0.7 });
  M.ironRough = new THREE.MeshStandardMaterial({ color: 0x232528, roughness: 0.78, metalness: 0.55, envMapIntensity: 0.5 });
  M.ironBlack = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.62, metalness: 0.7, envMapIntensity: 0.4 });
  M.brass = new THREE.MeshStandardMaterial({ color: 0xc39a52, roughness: 0.28, metalness: 1.0, envMapIntensity: 1.1 });
  M.brassDark = new THREE.MeshStandardMaterial({ color: 0x7a5c2c, roughness: 0.45, metalness: 0.95, envMapIntensity: 0.8 });
  M.stone = new THREE.MeshStandardMaterial({ color: 0x6f6d68, roughness: 0.94, metalness: 0.04, map: rock.clone(), envMapIntensity: 0.3 });
  M.stone.map.repeat.set(2, 2);
  M.wood = new THREE.MeshStandardMaterial({ color: 0x8a6d4a, roughness: 0.85, metalness: 0.05, map: wood, envMapIntensity: 0.35 });
  M.slat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9, metalness: 0.05, map: wood, envMapIntensity: 0.3 });
  M.towerWall = new THREE.MeshStandardMaterial({ color: 0xa9a49a, roughness: 0.92, metalness: 0.03, map: towerTex, side: THREE.DoubleSide, envMapIntensity: 0.35 });
  M.towerWall.map.repeat.set(1, 1);
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfdae6, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.16,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  M.glassWarm = new THREE.MeshStandardMaterial({
    color: 0xffe9c0, emissive: 0xffdfa0, emissiveIntensity: 0.35, roughness: 0.15, metalness: 0,
    transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false,
  });
  M.lens = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 0.42, roughness: 0.12, metalness: 0.0,
    transparent: true, opacity: 0.94, envMapIntensity: 2.0,
  });
  M.lensCore = new THREE.MeshBasicMaterial({ color: 0xffffff });
  M.paper = new THREE.MeshStandardMaterial({ color: 0xd9d2bd, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  M.leather = new THREE.MeshStandardMaterial({ color: 0x6b4c33, roughness: 0.95, metalness: 0 });
  M.bottle = new THREE.MeshStandardMaterial({ color: 0x2c3a2a, roughness: 0.18, metalness: 0.1, envMapIntensity: 1.2 });
  M.cork = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.95 });
  M.rope = new THREE.MeshStandardMaterial({ color: 0xb9b09c, roughness: 0.98, metalness: 0 });
  M.gull = new THREE.MeshStandardMaterial({ color: 0xa8a8a2, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });

  const labels = [
    ['LUNDY', 'RESERVE CASK'],
    ['OLD HARBOUR', 'RYE WHISKEY'],
    ['NORTH LIGHT', 'SINGLE MALT'],
    ['KEEPER\u2019S', 'PRIVATE STOCK'],
  ];
  M.labelMats = labels.map(([a, b], i) => new THREE.MeshStandardMaterial({
    map: labelTexture(a, b, i), roughness: 0.9, metalness: 0,
  }));
  return M;
}

/* ------------------------------------------------------------------ */
/*  square rock base + soil cross-section + buried whiskey             */
/* ------------------------------------------------------------------ */

function faceMaterials(tex, w, h, d, opts = {}) {
  const mk = (rx, ry, extra = {}) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.96, metalness: 0.02, envMapIntensity: 0.3, ...opts, ...extra });
  };
  const px = mk(d / 3.0, h / 3.0);
  const nx = mk(d / 3.0, h / 3.0);
  const py = mk(w / 3.0, d / 3.0, { roughness: 0.9 });
  const ny = mk(w / 3.0, d / 3.0);
  const pz = mk(w / 3.0, h / 3.0);
  const nz = mk(w / 3.0, h / 3.0);
  return [px, nx, py, ny, pz, nz];
}

export function buildBase(scene, M) {
  const g = new THREE.Group();
  const H = DIM.baseHalf, N = DIM.notch, BOT = DIM.soilBottom;
  const r = mulberry32(4242);

  const addBlock = (x0, x1, z0, z1, y0, y1, tex, opts) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mats = faceMaterials(tex, w, h, d, opts);
    const m = new THREE.Mesh(geo, mats);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // soil (two slabs forming an L, corner removed)
  addBlock(-H, N, -H, H, BOT, 0, M.soilTex);
  addBlock(N + 0.002, H, -H, N + 0.002, BOT, 0, M.soilTex);
  // rock cap
  addBlock(-H, N, -H, H, 0, DIM.rockTop, M.rockTex, { roughness: 0.88 });
  addBlock(N + 0.002, H, -H, N + 0.002, 0, DIM.rockTop, M.rockTex, { roughness: 0.88 });
  // bottom plate
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(H * 2 + 0.04, 0.12, H * 2 + 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9, metalness: 0.1 })
  );
  plate.position.y = BOT - 0.06;
  plate.receiveShadow = true;
  g.add(plate);

  /* --- crates of whiskey buried in the cut-away corner --- */
  const crateW = 1.02, crateH = 0.7, crateD = 0.86;
  const baseY = BOT + 0.03;
  const rows = [
    [2.55, 2.60], [3.62, 2.58], [4.69, 2.62],
    [2.57, 3.56], [3.64, 3.54], [4.71, 3.58],
    [2.60, 4.52], [3.67, 4.50], [4.74, 4.54],
  ];
  const stack = [
    ...rows.map(([x, z]) => [x, z, 0, (r() - 0.5) * 0.06]),
    [3.08, 3.06, 1, 0.05], [4.16, 3.08, 1, -0.04], [3.12, 4.03, 1, 0.03],
    [4.20, 4.02, 1, 0.06], [3.60, 3.55, 2, 0.02],
  ];
  stack.forEach(([x, z, layer, rot], i) => {
    const crate = makeCrate({
      w: crateW, h: crateH, d: crateD,
      wood: M.wood, slat: M.slat,
      labelMat: M.labelMats[i % M.labelMats.length],
      bottleMat: M.bottle, corkMat: M.cork,
      open: i === stack.length - 1,
    });
    crate.position.set(x, baseY + crateH / 2 + layer * (crateH + 0.015), z);
    crate.rotation.y = rot;
    crate.rotation.z = (r() - 0.5) * 0.03;
    g.add(crate);
  });
  // a couple of loose bottles leaning on the pile
  for (const [x, z, rot] of [[2.28, 4.95, 1.1], [5.05, 2.25, 0.4]]) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.32, 8), M.bottle);
    b.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.055, 0.14, 8), M.bottle);
    neck.position.y = 0.21; b.add(neck);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.055, 6), M.cork);
    cork.position.y = 0.3; b.add(cork);
    b.position.set(x, baseY + 0.1, z);
    b.rotation.set(0, rot, Math.PI / 2 - 0.1);
    g.add(b);
  }
  // soil spilling over the crates
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + r() * 0.2, 10, 6),
      new THREE.MeshStandardMaterial({ map: M.soilTex, color: 0x8a8378, roughness: 0.98 })
    );
    s.position.set(2.15 + r() * 0.5, BOT + 0.1 + r() * 0.2, 4.4 + r() * 0.6);
    s.scale.set(1, 0.42 + r() * 0.3, 1);
    s.castShadow = true;
    g.add(s);
  }
  const fill = new THREE.PointLight(0xa8bfd8, 6.5, 6, 2);
  fill.position.set(3.4, 0.35, 3.4);
  g.add(fill);

  /* --- rocks on top of the plinth --- */
  const rockMat = new THREE.MeshStandardMaterial({
    map: M.rockTex, color: 0x4e4e52, roughness: 0.85, metalness: 0.08, envMapIntensity: 0.5,
  });
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 64);
  rocks.castShadow = true; rocks.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let idx = 0;
  // a few boulders hugging the tower foot, keeping the section corner clear
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.18;
    const rad = 2.5 + r() * 0.75;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (x > 1.95 && z > 1.95) continue;
    const s2 = 0.2 + r() * 0.34;
    dummy.position.set(x, DIM.rockTop + s2 * 0.12, z);
    dummy.rotation.set(r() * 3, r() * 3, r() * 3);
    dummy.scale.set(s2 * (1 + r() * 0.5), s2 * (0.55 + r() * 0.35), s2 * (1 + r() * 0.5));
    dummy.updateMatrix(); rocks.setMatrixAt(idx++, dummy.matrix);
  }
  // larger outcrops hugging the tower
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const rad = 2.35 + r() * 0.5;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (x > 1.9 && z > 1.9) continue;
    const s3 = 0.42 + r() * 0.45;
    dummy.position.set(x, DIM.rockTop + s3 * 0.16, z);
    dummy.rotation.set(r() * 3, r() * 3, r() * 3);
    dummy.scale.set(s3 * (1.1 + r() * 0.5), s3 * (0.55 + r() * 0.4), s3 * (1.1 + r() * 0.5));
    dummy.updateMatrix(); rocks.setMatrixAt(idx++, dummy.matrix);
  }
  // small stones along the square rim
  for (let i = 0; i < 20; i++) {
    const side = Math.floor(r() * 4);
    const t = -H + 0.3 + r() * (H * 2 - 0.6);
    const e = H - 0.18 - r() * 0.28;
    const s2 = 0.14 + r() * 0.3;
    const pos = side === 0 ? [t, e] : side === 1 ? [t, -e] : side === 2 ? [e, t] : [-e, t];
    dummy.position.set(pos[0], DIM.rockTop + s2 * 0.1, pos[1]);
    dummy.rotation.set(r() * 3, r() * 3, r() * 3);
    dummy.scale.set(s2 * (1 + r() * 0.6), s2 * (0.5 + r() * 0.4), s2 * (1 + r() * 0.6));
    dummy.updateMatrix(); rocks.setMatrixAt(idx++, dummy.matrix);
  }
  rocks.count = idx;
  g.add(rocks);

  scene.add(g);
  return { group: g, update() {} };
}

/* ------------------------------------------------------------------ */
/*  tower shaft, spiral stair, gallery                                 */
/* ------------------------------------------------------------------ */

export function buildTower(scene, M) {
  const g = new THREE.Group();
  const { wallBottom, wallTop, rBottom, rTop, deckY, deckTop } = DIM;

  // stepped plinth
  const plinth = [
    [2.62, 0.34, 0.62], [2.42, 0.34, 0.96], [2.24, 0.26, 1.30],
  ];
  for (const [rad, h, y] of plinth) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.06, h, 56), M.stone);
    m.position.y = y - h / 2 + 0.18;
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }

  // wall with a 120 degree cut-away facing +X+Z and four glass slits
  const A0 = THREE.MathUtils.degToRad(95);
  const A1 = THREE.MathUtils.degToRad(355);
  const gaps = [[131, 139], [184, 192], [244, 252], [302, 310]].map(([a, b]) => [THREE.MathUtils.degToRad(a), THREE.MathUtils.degToRad(b)]);
  const spans = [];
  let cur = A0;
  for (const [a, b] of gaps) { spans.push([cur, a]); cur = b; }
  spans.push([cur, A1]);

  for (const [a, b] of spans) {
    const geo = makeArcWall({
      rb: rBottom, rt: rTop, y0: wallBottom, y1: wallTop, a0: a, a1: b,
      thickness: 0.30, segs: Math.max(6, Math.round((b - a) / 0.05)), uvScale: 3.0,
    });
    const m = new THREE.Mesh(geo, M.towerWall);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }
  // clean section-cut faces at the opening edges
  const cutMat = new THREE.MeshStandardMaterial({ color: 0x6f6b61, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide });
  for (const a of [A0, A1]) {
    const c = Math.cos(a), sn = Math.sin(a);
    const p = [
      (rBottom - 0.30) * c, wallBottom, (rBottom - 0.30) * sn,
      rBottom * c, wallBottom, rBottom * sn,
      rTop * c, wallTop, rTop * sn,
      (rTop - 0.30) * c, wallTop, (rTop - 0.30) * sn,
    ];
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    cg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    cg.setIndex([0, 1, 2, 0, 2, 3]);
    cg.computeVertexNormals();
    const cm = new THREE.Mesh(cg, cutMat);
    cm.receiveShadow = true;
    g.add(cm);
  }

  // glass in the slits
  for (const [a, b] of gaps) {
    const geo = makeArcSurface({ rb: rBottom - 0.15, rt: rTop - 0.15, y0: wallBottom, y1: wallTop, a0: a, a1: b, segs: 8 });
    const m = new THREE.Mesh(geo, M.glass);
    m.renderOrder = 4;
    g.add(m);
    // transom
    const mid = (a + b) / 2;
    const rad = rBottom - 0.15;
    const chord = 2 * rad * Math.sin((b - a) / 2);
    for (const yy of [wallBottom + 2.4, wallBottom + 4.8]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(chord * 1.05, 0.055, 0.07), M.iron);
      bar.position.set(Math.cos(mid) * rad, yy, Math.sin(mid) * rad);
      bar.rotation.y = -mid;
      g.add(bar);
    }
  }

  // door
  const doorA = THREE.MathUtils.degToRad(205);
  const dr = 2.11;
  const door = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.1), M.wood);
  panel.castShadow = true;
  door.add(panel);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.1, 16, 1, false, 0, Math.PI), M.wood);
  arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI;
  arch.position.y = 0.925;
  door.add(arch);
  for (const yy of [-0.55, 0.1, 0.7]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.07, 0.03), M.iron);
    strap.position.set(0, yy, 0.06);
    door.add(strap);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), M.brass);
  knob.position.set(0.34, -0.1, 0.09);
  door.add(knob);
  door.position.set(Math.cos(doorA) * dr, wallBottom + 0.95, Math.sin(doorA) * dr);
  door.rotation.y = -doorA + Math.PI / 2;
  g.add(door);

  // gallery deck + railing
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.48, 0.18, 56), M.ironRough);
  deck.position.y = deckY + 0.09;
  deck.castShadow = true; deck.receiveShadow = true;
  g.add(deck);
  const deckRing = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.055, 6, 56), M.iron);
  deckRing.rotation.x = Math.PI / 2;
  deckRing.position.y = deckTop;
  g.add(deckRing);
  // corbels
  const corbelGeo = new THREE.BoxGeometry(0.12, 0.34, 0.42);
  const corbels = new THREE.InstancedMesh(corbelGeo, M.iron, 20);
  const d2 = new THREE.Object3D();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    d2.position.set(Math.cos(a) * 2.42, deckY - 0.08, Math.sin(a) * 2.42);
    d2.rotation.set(0.35, -a, 0);
    d2.updateMatrix(); corbels.setMatrixAt(i, d2.matrix);
  }
  g.add(corbels);

  // railing
  const posts = 20, railR = 2.44;
  const postGeo = new THREE.CylinderGeometry(0.026, 0.032, 0.92, 6);
  const postInst = new THREE.InstancedMesh(postGeo, M.iron, posts);
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    d2.position.set(Math.cos(a) * railR, deckTop + 0.46, Math.sin(a) * railR);
    d2.rotation.set(0, 0, 0); d2.scale.set(1, 1, 1);
    d2.updateMatrix(); postInst.setMatrixAt(i, d2.matrix);
  }
  g.add(postInst);
  for (const [yy, tr] of [[deckTop + 0.9, 0.045], [deckTop + 0.48, 0.022], [deckTop + 0.12, 0.022]]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(railR, tr, 6, 72), M.iron);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = yy;
    g.add(rail);
  }

  /* ---------------- spiral stair ---------------- */
  const steps = 62, turns = 3.15;
  const y0 = 1.74, y1 = 8.86;
  const stepGeo = new THREE.BoxGeometry(1, 0.055, 0.44);
  const stepInst = new THREE.InstancedMesh(stepGeo, M.iron, steps);
  stepInst.castShadow = true; stepInst.receiveShadow = true;
  const rWall = (t) => (1.77 - 0.72 * t);
  const rIn = 0.30;
  const a0 = THREE.MathUtils.degToRad(35);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const pos = new THREE.Vector3(), scl = new THREE.Vector3();

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = a0 + t * turns * Math.PI * 2;
    const rw = rWall(t);
    const rad = (rIn + rw) / 2;
    pos.set(Math.cos(a) * rad, y0 + t * (y1 - y0), Math.sin(a) * rad);
    e.set(0, -a, 0); q.setFromEuler(e);
    scl.set(rw - rIn, 1, 1);
    mtx.compose(pos, q, scl);
    stepInst.setMatrixAt(i, mtx);
  }
  g.add(stepInst);

  // central newel
  const newel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.32, 7.6, 20), M.iron);
  newel.position.y = (1.5 + 9.1) / 2;
  newel.castShadow = true;
  g.add(newel);
  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 5, 20), M.ironBlack);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.9 + i * 1.0;
    g.add(ring);
  }

  // helical handrail + outer stringer
  const railPts = [], strPts = [];
  const NS = 220;
  for (let i = 0; i <= NS; i++) {
    const t = i / NS;
    const a = a0 + t * turns * Math.PI * 2;
    const rw = rWall(t);
    const y = y0 + t * (y1 - y0);
    railPts.push(new THREE.Vector3(Math.cos(a) * (rw - 0.04), y + 0.93, Math.sin(a) * (rw - 0.04)));
    strPts.push(new THREE.Vector3(Math.cos(a) * (rw + 0.01), y - 0.16, Math.sin(a) * (rw + 0.01)));
  }
  const railGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 320, 0.032, 6, false);
  const rail = new THREE.Mesh(railGeo, M.iron);
  rail.castShadow = true;
  g.add(rail);
  const strGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strPts), 320, 0.05, 5, false);
  g.add(new THREE.Mesh(strGeo, M.ironBlack));

  // balusters
  const balGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.93, 5);
  const balCount = 31;
  const balInst = new THREE.InstancedMesh(balGeo, M.iron, balCount);
  for (let i = 0; i < balCount; i++) {
    const t = (i * 2) / (steps - 1);
    const a = a0 + t * turns * Math.PI * 2;
    const rw = rWall(t) - 0.05;
    const y = y0 + t * (y1 - y0);
    d2.position.set(Math.cos(a) * rw, y + 0.47, Math.sin(a) * rw);
    d2.rotation.set(0, 0, 0); d2.scale.set(1, 1, 1);
    d2.updateMatrix(); balInst.setMatrixAt(i, d2.matrix);
  }
  g.add(balInst);

  /* ---------------- landing + keeper's props ---------------- */
  const landA = THREE.MathUtils.degToRad(52);
  const landT = 0.56;
  const landY = y0 + landT * (y1 - y0);
  const landR = (rIn + rWall(landT)) / 2;
  const landing = new THREE.Group();
  const plateM = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.8), M.iron);
  plateM.castShadow = true; plateM.receiveShadow = true;
  landing.add(plateM);
  for (let i = 0; i < 6; i++) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.012, 0.06), M.ironBlack);
    sl.position.set(0, 0.032, -0.33 + i * 0.132);
    landing.add(sl);
  }

  const barrel = new THREE.Group();
  const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.4, 14), M.brassDark);
  bBody.position.y = 0.2; bBody.castShadow = true;
  barrel.add(bBody);
  for (const yy of [0.06, 0.2, 0.34]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.014, 5, 16), M.brass);
    hoop.rotation.x = Math.PI / 2; hoop.position.y = yy;
    barrel.add(hoop);
  }
  const bTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 14), M.brass);
  bTop.position.y = 0.41; barrel.add(bTop);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6), M.brass);
  spout.position.set(0.13, 0.44, 0); spout.rotation.z = -0.5; barrel.add(spout);
  barrel.position.set(-0.28, 0.03, 0.18);
  landing.add(barrel);

  const cloth = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.34 - i * 0.03, 0.035, 0.26), M.leather);
    c.position.set(0.24, 0.03 + i * 0.035, 0.16 + i * 0.01);
    c.rotation.y = 0.2 - i * 0.12;
    c.castShadow = true;
    cloth.add(c);
  }
  landing.add(cloth);

  const toolbox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.2), M.ironRough);
  toolbox.position.set(0.22, 0.1, -0.22);
  toolbox.rotation.y = -0.25;
  toolbox.castShadow = true;
  landing.add(toolbox);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 5, 12, Math.PI), M.iron);
  handle.position.set(0.22, 0.17, -0.22); handle.rotation.y = -0.25;
  landing.add(handle);

  // fallen lantern
  const lantern = new THREE.Group();
  const lBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.16, 10), M.brassDark);
  lantern.add(lBody);
  const lGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.11, 10), M.glassWarm);
  lGlass.position.y = 0.11; lantern.add(lGlass);
  const lTop = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.07, 10), M.brass);
  lTop.position.y = 0.19; lantern.add(lTop);
  const lHandle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 4, 12, Math.PI), M.brass);
  lHandle.position.y = 0.2; lantern.add(lHandle);
  lantern.position.set(-0.1, 0.09, -0.24);
  lantern.rotation.set(0, 0.6, Math.PI / 2 - 0.12);
  landing.add(lantern);

  landing.position.set(Math.cos(landA) * landR, landY, Math.sin(landA) * landR);
  landing.rotation.y = -landA;
  g.add(landing);

  /* ---------------- counterweight chain ---------------- */
  const chainGroup = new THREE.Group();
  const linkGeo = new THREE.TorusGeometry(0.055, 0.014, 5, 9);
  const links = 34;
  const linkInst = new THREE.InstancedMesh(linkGeo, M.iron, links);
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.46, 12), M.ironBlack);
  weight.castShadow = true;
  chainGroup.add(linkInst, weight);
  const chainA = THREE.MathUtils.degToRad(15);
  chainGroup.position.set(Math.cos(chainA) * 0.78, 0, Math.sin(chainA) * 0.78);
  g.add(chainGroup);

  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3(1, 1, 1);
  function updateChain(time) {
    const bob = Math.sin(time * 0.32) * 0.28;
    const top = 8.65 + bob;
    for (let i = 0; i < links; i++) {
      const yy = top - i * 0.092;
      tmpV.set(0, yy, 0);
      tmpE.set(i % 2 ? Math.PI / 2 : 0, i % 2 ? 0 : Math.PI / 2, 0);
      tmpQ.setFromEuler(tmpE);
      tmpM.compose(tmpV, tmpQ, tmpS);
      linkInst.setMatrixAt(i, tmpM);
    }
    linkInst.instanceMatrix.needsUpdate = true;
    weight.position.y = top - links * 0.092 - 0.24;
  }

  // interior lights
  const inner = new THREE.PointLight(0x9db9d6, 13, 12, 2);
  inner.position.set(1.15, 4.4, 0.95);
  g.add(inner);
  const inner2 = new THREE.PointLight(0xa9c4de, 8, 10, 2);
  inner2.position.set(-1.0, 7.1, 0.9);
  g.add(inner2);
  const warm = new THREE.PointLight(0xffb070, 1.6, 5, 2);
  warm.position.set(Math.cos(landA) * landR, landY + 0.9, Math.sin(landA) * landR);
  g.add(warm);

  scene.add(g);
  return {
    group: g,
    update(time) { updateChain(time); },
  };
}
