// ═══════════════════════════════════════════════════════════════════════
//  01 — the floating plinth and the tear in its foundation
// ═══════════════════════════════════════════════════════════════════════

const BASE = new THREE.Group();
BASE.name = 'Fractured federal plinth';
world.add(BASE);

function irregularRockGeo(radius = 1, seed = 3, detail = 1, squash = .8) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const pos = g.attributes.position;
  const r = rng(seed);
  const seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = pos.getX(i).toFixed(4) + ':' + pos.getY(i).toFixed(4) + ':' + pos.getZ(i).toFixed(4);
    if (!seen.has(k)) seen.set(k, .73 + r() * .52);
    const s = seen.get(k);
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * squash, pos.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
}

// a layer with a broken, chipped silhouette
function fracturedLayer({ w, d, thick, seed, mat, top, x = 0, z = 0, ry = 0, chip = .55 }) {
  const r = rng(seed);
  const shape = new THREE.Shape();
  const pts = [];
  const addSide = (ax, az, bx, bz, index) => {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const nx = dz / len, nz = -dx / len;
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = (i + .3) / count;
      let off = (r() - .5) * chip * 1.25;
      if (i === 2 && r() > .52) off = -rr(.28, chip * 1.7, r);
      if (i === 4 && r() > .45) off += rr(.1, .5, r);
      pts.push([ax + dx * t + nx * off, az + dz * t + nz * off]);
    }
  };
  // corners are lightly knocked off
  const c = .24;
  addSide(-w / 2 + c, -d / 2, w / 2 - c * 1.7, -d / 2, 0);
  addSide(w / 2, -d / 2 + c, w / 2, d / 2 - c * 1.4, 1);
  addSide(w / 2 - c, d / 2, -w / 2 + c * 1.3, d / 2, 2);
  addSide(-w / 2, d / 2 - c, -w / 2, -d / 2 + c, 3);
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, top - thick, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  outline(mesh, 22);
  BASE.add(mesh);
  return mesh;
}

// ── the cold, complete square tabletop ────────────────────────────────
const table = new THREE.Group();
BASE.add(table);

const slab = box(table, 27, .92, 27, M.base, 0, -.46, 0, 0, false);
slab.castShadow = true; slab.receiveShadow = true;
outline(slab, 25);
// a razor-thin shadow gap and lower lip
box(table, 27.16, .1, 27.16, M.steelDark, 0, -.96, 0);
box(table, 27.05, .2, 27.05, M.concreteDark, 0, -1.07, 0);

// seamless inset floor surface
const floorSurface = new THREE.Mesh(planeGeo(26.7, 26.7, 1, 1), M.floor);
floorSurface.rotation.x = -Math.PI / 2;
floorSurface.position.y = .012;
floorSurface.receiveShadow = true;
table.add(floorSurface);

// the clean square edge is deliberately uninterrupted — the corruption lives below
box(table, 27.02, .055, .045, M.steelDark, 0, -.06, 13.49);
box(table, 27.02, .055, .045, M.steelDark, 0, -.06, -13.49);
box(table, .045, .055, 27.02, M.steelDark, 13.49, -.06, 0);
box(table, .045, .055, 27.02, M.steelDark, -13.49, -.06, 0);

// a few cold expansion seams, only at the outer verge
const seamMat = new THREE.MeshBasicMaterial({ color: 0x5d6464, transparent: true, opacity: .22 });
for (let i = 0; i < 4; i++) {
  const a = i * Math.PI / 2 + .78;
  const s = new THREE.Mesh(planeGeo(1.1, .025), seamMat);
  s.rotation.x = -Math.PI / 2;
  s.rotation.z = a;
  s.position.set(Math.cos(a + Math.PI / 2) * 13.1, .02, Math.sin(a + Math.PI / 2) * 13.1);
  table.add(s);
}

// ── suspended, misaligned tectonic layers ─────────────────────────────
// four tectonic plates, each one slipping out of alignment, some wider than the tabletop above
fracturedLayer({ w: 28.6, d: 27.8, thick: .58, seed: 81, mat: M.concreteDark, top: -1.32, x: .55, z: -.28, ry: .033, chip: 1.15 });
fracturedLayer({ w: 26.8, d: 28.9, thick: .56, seed: 82, mat: M.concreteDeep, top: -2.08, x: -1.05, z: .82, ry: -.035, chip: 1.35 });
fracturedLayer({ w: 24.7, d: 24.2, thick: .5, seed: 83, mat: M.concreteDark, top: -2.87, x: 1.4, z: -.62, ry: .055, chip: 1.3 });
fracturedLayer({ w: 20.3, d: 21.5, thick: .44, seed: 84, mat: M.concreteDeep, top: -3.58, x: -.9, z: .78, ry: -.065, chip: 1.15 });
fracturedLayer({ w: 15.1, d: 16.2, thick: .38, seed: 85, mat: M.concreteBlack, top: -4.2, x: .45, z: -.45, ry: .09, chip: 1.15 });

// thin red warning lines trapped in the gaps between the sliding slabs
for (const line of [
  [15.3, .024, .05, .8, -1.92, 12.6],
  [10.5, .024, .05, 3.7, -2.68, 13.2],
  [.05, .022, 10.8, 12.0, -3.39, 1.8],
  [.05, .02, 8.2, 13.35, -2.73, -.5],
  [8.2, .02, .05, -3.8, -1.96, 13.46],
]) {
  const m = new THREE.Mesh(boxGeo(line[0], line[1], line[2]), M.stripRed);
  m.position.set(line[3], line[4], line[5]);
  BASE.add(m);
}
// little pins that seem to hold nothing
for (let i = 0; i < 7; i++) {
  const px = rr(-10.5, 10.5), pz = rr(-9.5, 12.7);
  const pin = new THREE.Mesh(cylGeo(.035, .035, rr(.2, .4), 5), M.steelDark);
  pin.position.set(px, -1.44, pz);
  BASE.add(pin);
}

// cantilevered fault plates, detached from the mass
const shardDefs = [
  [7.8, -1.15, 11.7, 3.7, .32, 3.1, -.13, 0.16],
  [-10.2, -2.0, 8.8, 4.0, .28, 2.2, .12, -0.31],
  [-8.9, -3.35, -8.2, 3.1, .26, 3.7, .05, 0.5],
  [9.2, -4.1, -6.8, 4.5, .3, 2.2, -.08, -0.2],
  [4.8, -5.6, 3.9, 2.9, .22, 2.6, .16, 0.68],
];
for (const s of shardDefs) {
  const p = box(BASE, s[3], s[4], s[5], M.concreteDeep, s[0], s[1], s[2], s[7], true, s[6], 0, 0);
  p.castShadow = true; p.receiveShadow = true;
  floaters.push({ obj: p, base: p.position.clone(), phase: rr(0, TAU), amp: .025, speed: .1 + Math.random() * .1, ry: p.rotation.y });
}

// fractured corner wedges that seem to have sheared off
for (let i = 0; i < 7; i++) {
  const g = new THREE.Group();
  const geo = irregularRockGeo(rr(.45, 1.25), 500 + i, 0, .45);
  const rock = new THREE.Mesh(geo, i % 3 === 0 ? M.concreteDark : M.concreteDeep);
  rock.castShadow = rock.receiveShadow = true;
  outline(rock, 18);
  g.add(rock);
  const side = i % 4;
  const ang = [.22, 1.4, 2.4, 3.6, 4.9, 5.4, 2.9][i];
  const rad = rr(9.5, 12.6);
  g.position.set(Math.sin(ang) * rad, rr(-5.2, -1.6), Math.cos(ang) * rad);
  g.rotation.set(rr(-.4, .4), rr(0, TAU), rr(-.4, .4));
  BASE.add(g);
  floaters.push({ obj: g, base: g.position.clone(), phase: rr(0, TAU), amp: .06, speed: .13, ry: g.rotation.y });
}

// ── the non-Euclidean wound, under the front lip ──────────────────────
const VOID = new THREE.Group();
VOID.position.set(3.55, -2.28, 14.83);
VOID.scale.setScalar(1.18);
BASE.add(VOID);

function jaggedShape(points) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
  s.closePath();
  return s;
}
const mouthPts = [
  [-2.35, -.84], [-1.82, -1.06], [-.4, -1.12], [.68, -1.02], [2.12, -.72],
  [2.45, -.05], [1.86, .64], [1.22, .98], [.35, .84], [-.55, 1.04],
  [-1.48, .88], [-2.28, .46], [-2.5, -.2],
];
const mouth = new THREE.Mesh(new THREE.ShapeGeometry(jaggedShape(mouthPts)), M.voidBlack);
VOID.add(mouth);
// black teeth that bite over the concrete
for (let i = 0; i < 11; i++) {
  const px = rr(-2.5, 2.4), py = rr(-1.18, 1.08);
  const tooth = new THREE.Mesh(boxGeo(rr(.1, .4), rr(.04, .18), rr(.04, .16)), M.concreteBlack);
  tooth.position.set(px, py, .08 + Math.random() * .1);
  tooth.rotation.z = rr(-.4, .4);
  VOID.add(tooth);
}

const portalGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.65, .045, .02) });
const portalDim = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .012, .008) });
const portalLineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.25, .035, .015) });
// concentric fractures, sharp and irregular rather than a neat picture frame
for (let i = 0; i < 4; i++) {
  const s = 1 - i * .16;
  const z = .12 + i * .062;
  const pts = mouthPts.map((p, j) => [
    p[0] * s + (i % 2 ? .035 : -.02) + Math.sin(j * 2.1 + i) * .025,
    p[1] * s + (i % 2 ? -.015 : .02) + Math.cos(j * 1.7 + i) * .018,
  ]);
  for (let j = 0; j < pts.length; j++) {
    if (i === 3 && j % 4 === 0) continue;
    const a = v3(pts[j][0], pts[j][1], z);
    const b0 = pts[(j + 1) % pts.length];
    const b = v3(b0[0], b0[1], z);
    const rod = cylinderBetween(a, b, i === 0 ? .014 : .009, portalLineMat, 4);
    VOID.add(rod);
  }
}
// the impossible vertical slit, and its crooked echo
box(VOID, .035, 1.35, .03, portalGlow, .13, -.05, .43);
box(VOID, .12, .026, .03, portalGlow, .13, .62, .44);
box(VOID, .026, .98, .025, portalGlow, -.35, -.12, .32);
for (let i = 0; i < 3; i++) {
  const a = v3(-1.9 + i * .4, .72 - i * .2, .35);
  const b = v3(-.4 + i * .2, .3 + i * .22, .35);
  VOID.add(cylinderBetween(a, b, .007, portalLineMat, 4));
}
// a tiny inverted stair receding into nothing
for (let i = 0; i < 6; i++) {
  const s = .9 - i * .075;
  const step = new THREE.Group();
  step.position.set(.1 + i * .16, -.6 + i * .18, .64 + i * .04);
  step.rotation.z = .08 + i * .07;
  step.rotation.x = -.12;
  const b = box(step, s * 1.3, .1, .45 * s, M.concreteBlack, 0, 0, 0);
  outline(b, 20, inkRed);
  VOID.add(step);
}
const voidGlow = glowSprite(0xff2719, 1.9, .42);
voidGlow.position.set(.1, -.05, .55);
VOID.add(voidGlow);
redGlowMats.push(voidGlow.material);
const voidLight = new THREE.PointLight(0xff2418, 22, 7.2, 1.8);
voidLight.position.set(4.1, -2.45, 15.2);
scene.add(voidLight);
pulseLights.push({ light: voidLight, base: 18, phase: 2.2 });

// concrete ribs torn around the wound
const ribMat = M.concreteDark;
for (let i = 0; i < 8; i++) {
  const w = rr(.45, 1.15), h = rr(.22, .52);
  const rib = box(VOID, w, h, rr(.3, .8), ribMat, rr(-2.8, 2.7), rr(-1.35, 1.25), rr(-.45, -.1), rr(-.5, .5), true, rr(-.2, .2), 0, rr(-.4, .4));
  rib.castShadow = true;
}
// exposed rebar
for (let i = 0; i < 6; i++) {
  const a = v3(rr(-2.2, 2.2), rr(-1.2, 1.1), .16);
  const b = a.clone().add(v3(rr(-.6, .6), rr(-.2, .8), rr(-.5, -.1)));
  const rod = cylinderBetween(a, b, .014, M.steelRust, 5);
  VOID.add(rod);
}

// a secondary tear on the right flank
const SIDE_VOID = new THREE.Group();
SIDE_VOID.position.set(14.46, -2.45, -2.15);
SIDE_VOID.rotation.y = Math.PI / 2;
BASE.add(SIDE_VOID);
const sidePts = [
  [-1.5, -.45], [-.7, -.68], [.51, -.58], [1.1, -.28], [1.42, .14], [.99, .58], [.18, .66], [-.64, .57], [-1.24, .23],
];
const sideMouth = new THREE.Mesh(new THREE.ShapeGeometry(jaggedShape(sidePts)), M.voidBlack);
SIDE_VOID.add(sideMouth);
for (let i = 0; i < 3; i++) {
  const s = 1 - i * .2;
  const z = .08 + i * .06;
  for (let j = 0; j < sidePts.length; j++) {
    if (i === 2 && j % 3 === 0) continue;
    const a = v3(sidePts[j][0] * s, sidePts[j][1] * s, z);
    const b0 = sidePts[(j + 1) % sidePts.length];
    const b = v3(b0[0] * s, b0[1] * s, z);
    SIDE_VOID.add(cylinderBetween(a, b, .011, portalLineMat, 4));
  }
}
const sideGlow = glowSprite(0xff2719, 1.1, .35);
sideGlow.position.set(0, 0, .3);
SIDE_VOID.add(sideGlow);
redGlowMats.push(sideGlow.material);

// underlight catching the lip of the tabletop
const lipGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, .06, .04) });
const lipGlow = new THREE.Mesh(boxGeo(26.6, .028, .028), lipGlowMat);
lipGlow.position.set(0, -1.0, 13.58);
BASE.add(lipGlow);
const lipGlow2 = lipGlow.clone();
lipGlow2.rotation.y = Math.PI / 2;
lipGlow2.position.set(13.58, -1.0, 0);
BASE.add(lipGlow2);
// escaping red light below the displaced plates
for (const s of [[8.5, -1.44, 13.7], [13.9, -1.86, 8.4], [6.4, -2.72, 14.55], [-3.2, -3.4, 12.2]]) {
  const g = glowSprite(0xff281b, 2.8, .16);
  g.position.set(s[0], s[1], s[2]);
  BASE.add(g);
  redGlowMats.push(g.material);
}

// fine cracks spreading from the lower void into the concrete
const crackMat = new THREE.MeshBasicMaterial({ color: 0x8d1713, transparent: true, opacity: .8 });
for (let c = 0; c < 5; c++) {
  const points = [];
  let p = v3(3.85 + rr(-1.7, 1.7), -1.75, 14.22);
  points.push(p.clone());
  for (let i = 0; i < 5; i++) {
    p = p.clone().add(v3(rr(-.55, .55), rr(-.32, -.02), rr(-.02, .1)));
    points.push(p.clone());
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, .014, 4, false), crackMat);
  BASE.add(line);
}


// ── worn federal markings on the cold apron ───────────────────────────
(function forecourtStencil() {
  const W = 1400, H = 740;
  const [c, x] = canvas2d(W, H);
  const r = rng(33317);
  x.clearRect(0, 0, W, H);
  x.save();
  x.translate(W / 2, H / 2);
  // huge broken warning ring
  x.strokeStyle = 'rgba(54,35,31,.72)';
  x.lineWidth = 11;
  x.beginPath(); x.arc(0, 0, 325, 0, TAU); x.stroke();
  x.strokeStyle = 'rgba(122,26,22,.64)';
  x.lineWidth = 5;
  x.beginPath(); x.arc(0, 0, 296, .1, 2.15); x.stroke();
  x.beginPath(); x.arc(0, 0, 296, 2.8, 5.9); x.stroke();
  // central pyramid mark
  x.strokeStyle = 'rgba(44,32,29,.7)'; x.lineWidth = 15;
  x.beginPath(); x.moveTo(0, -235); x.lineTo(247, 178); x.lineTo(-247, 178); x.closePath(); x.stroke();
  x.strokeStyle = 'rgba(120,26,22,.5)'; x.lineWidth = 5;
  x.beginPath(); x.arc(0, 70, 116, 0, TAU); x.stroke();
  // date bars
  for (let i = 0; i < 13; i++) {
    x.fillStyle = i % 4 ? 'rgba(37,34,30,.55)' : 'rgba(120,26,22,.55)';
    x.fillRect(-205 + i * 34, 244, 4 + r() * 15, 29);
  }
  x.restore();
  x.fillStyle = 'rgba(44,34,30,.76)';
  x.font = '900 94px "Arial Narrow", Impact, sans-serif';
  x.fillText('RESTRICTED', 60, 122);
  x.fillStyle = 'rgba(120,26,22,.7)';
  x.font = '700 34px ui-monospace, monospace';
  x.fillText('FEDERAL BUREAU OF CONTROL / ARCHIVE 07', 64, 180);
  x.fillStyle = 'rgba(39,34,29,.7)';
  x.font = '900 170px "Arial Black", Impact, sans-serif';
  x.fillText('07', 1058, 637);
  x.font = '700 26px ui-monospace, monospace';
  x.fillText('NO ENTRY // NO RETURN', 64, 660);
  // stencil chevrons
  x.strokeStyle = 'rgba(128,32,25,.62)'; x.lineWidth = 15;
  for (let i = 0; i < 4; i++) {
    x.beginPath();
    x.moveTo(890 + i * 44, 218);
    x.lineTo(970 + i * 44, 282);
    x.lineTo(890 + i * 44, 346);
    x.stroke();
  }
  // weathering: erase the paint in irregular streaks
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 520; i++) {
    x.fillStyle = 'rgba(0,0,0,' + (0.08 + r() * .7) + ')';
    x.beginPath();
    x.ellipse(r() * W, r() * H, 2 + r() * 38, 1 + r() * 4, r() * TAU, 0, TAU);
    x.fill();
  }
  x.globalCompositeOperation = 'source-over';
  const tex = canvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: .8, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const plane = new THREE.Mesh(planeGeo(11.2, 5.9), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.rotation.z = .025;
  plane.position.set(-2.75, .031, 8.75);
  BASE.add(plane);
  // a second, quieter line at the foot of the steps
  const sub = new THREE.Mesh(planeGeo(5.4, .9), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: .17, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  sub.rotation.x = -Math.PI / 2;
  sub.position.set(-4.8, .032, 5.55);
  BASE.add(sub);
})();

// scattered field evidence, caught in the open air of the forecourt
// (instanced fields are created in part 04)

// cold dust collection at the lip
for (let i = 0; i < 22; i++) {
  const d = box(BASE, rr(.2, .9), rr(.015, .05), rr(.15, .7), M.concreteDark,
    rr(-12.7, 12.7), .014, rr(-12.7, 12.7), rr(0, TAU));
  d.castShadow = false;
}
