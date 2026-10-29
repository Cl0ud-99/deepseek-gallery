// ═══════════════════════════════════════════════════════════════════════
//  02 — the Federal Bureau of Control archive hall
// ═══════════════════════════════════════════════════════════════════════

const HALL = new THREE.Group();
HALL.name = 'FBC archive hall';
world.add(HALL);

const FLOOR_Y = .13;
const ROOF_Y = 17.72;

function architectural(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function cbox(parent, w, h, d, mat, x, y, z, ry = 0, ink = true) {
  return architectural(box(parent, w, h, d, mat, x, y, z, ry, ink));
}
function floorPlate(parent, w, d, t, mat, x, y, z, ink = true) {
  return architectural(box(parent, w, t, d, mat, x, y, z, 0, ink));
}

// ── floor / hall podium ────────────────────────────────────────────────
architectural(box(HALL, 17.6, .24, 8.9, M.floor, 0, .12, -.1, 0, true));
box(HALL, 17.9, .18, 9.2, M.concreteDeep, 0, -.02, -.1, 0, true);
box(HALL, 17.9, .07, .26, M.steelDark, 0, .24, 4.36);
box(HALL, .24, .07, 8.95, M.steelDark, 8.95, .24, -.1);
box(HALL, .24, .07, 8.95, M.steelDark, -8.95, .24, -.1);

// three shallow entrance steps
for (let i = 0; i < 3; i++) {
  architectural(box(HALL, 13.2 - i * .35, .1, .42, M.concreteDark, 0, .05 + i * .055, 4.56 + (2 - i) * .34, 0, true));
}

// circular FBC floor inlay, worn almost back into the concrete
(function floorSeal() {
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.25, 3.38, 64), M.steelDark);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(.1, .253, -.1);
  HALL.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.7, 2.74, 64), M.concreteBlack);
  ring2.rotation.x = -Math.PI / 2; ring2.position.set(.1, .254, -.1); HALL.add(ring2);
  const triShape = new THREE.Shape();
  const R = 2.32;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * TAU / 3;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (i === 0) triShape.moveTo(x, y); else triShape.lineTo(x, y);
  }
  triShape.closePath();
  const tri = new THREE.Mesh(new THREE.ShapeGeometry(triShape), new THREE.MeshBasicMaterial({ color: 0x171a1a, transparent: true, opacity: .42 }));
  tri.rotation.x = -Math.PI / 2; tri.position.set(.1, .255, -.1); HALL.add(tri);
  // hairline red fractures across the seal
  for (let i = 0; i < 6; i++) {
    const a = rr(0, TAU);
    const len = rr(2.1, 4.4);
    const s = new THREE.Mesh(boxGeo(.018, .006, len), M.stripRed);
    s.position.set(.1 + Math.cos(a) * len / 2, .258, -.1 + Math.sin(a) * len / 2);
    s.rotation.y = -a + Math.PI / 2;
    HALL.add(s);
  }
})();

// ── back archive wall ──────────────────────────────────────────────────
const backWall = cbox(HALL, 18.8, 17.5, 1.05, M.concrete, 0, 8.85, -4.55, 0, true);
architectural(box(HALL, 19.3, 1.0, 1.6, M.concreteCool, 0, .63, -4.5, 0, true));
architectural(box(HALL, 19.0, .7, 1.3, M.concreteDark, 0, 17.2, -4.5, 0, true));
// broad recessed band
box(HALL, 15.8, .25, .18, M.concreteDeep, 0, 7.55, -4.02);
box(HALL, 15.8, .1, .26, M.steelDark, 0, 7.7, -3.99);
// deep ribs: an oppressive colonnade in relief
for (const x of [-8.7, -7.2, -5.7, 5.7, 7.2, 8.7]) {
  architectural(box(HALL, .36, 16.6, .68, M.concrete, x, 8.35, -3.92, 0, true));
}
for (const x of [-8.15, -6.45, 6.45, 8.15]) {
  architectural(box(HALL, .55, 15.7, .3, M.concreteDark, x, 8.0, -3.78, 0, true));
}

// lower archive niche in the back wall
box(HALL, 8.4, 3.3, .3, M.voidBlack, .2, 2.05, -4.01);
cbox(HALL, 8.9, .36, .72, M.concreteDark, .2, 3.85, -3.95, 0, true);
cbox(HALL, .34, 3.6, .75, M.concreteDark, -4.04, 2.18, -3.95, 0, true);
cbox(HALL, .34, 3.6, .75, M.concreteDark, 4.44, 2.18, -3.95, 0, true);
// narrow lit slots through the archive wall
for (const x of [-7.55, -6.15, -3.35, 3.75, 5.15, 6.55, 7.95]) {
  const y = 12.25 + (x < 0 ? .2 : -.1);
  const lit = new THREE.Mesh(boxGeo(1.03, 4.8, .12), M.voidBlack);
  lit.position.set(x, y, -4.005);
  HALL.add(lit);
  const glassPane = new THREE.Mesh(boxGeo(.82, 4.5, .035), new THREE.MeshBasicMaterial({ color: 0x130607 }));
  glassPane.position.set(x, y, -3.93);
  HALL.add(glassPane);
  const glowLine = new THREE.Mesh(boxGeo(.56, 4.15, .018), new THREE.MeshBasicMaterial({ color: new THREE.Color(.45, .025, .015) }));
  glowLine.position.set(x, y, -3.89);
  HALL.add(glowLine);
  box(HALL, 1.25, .16, .32, M.concreteDark, x, y + 2.42, -3.9, 0, true);
  box(HALL, 1.25, .16, .32, M.concreteDark, x, y - 2.42, -3.9, 0, true);
}
// a black, aggressive logo relief carved into the wall
(function wallEmblem() {
  const g = groupAt(HALL, 3.15, 11.4, -3.84);
  const mat = M.concreteBlack;
  const circle = new THREE.Mesh(new THREE.TorusGeometry(1.45, .10, 6, 48), mat);
  g.add(circle);
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * TAU / 3;
    pts.push(new THREE.Vector3(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0));
  }
  for (let i = 0; i < 3; i++) {
    const a = pts[i], b = pts[(i + 1) % 3];
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(cylGeo(.085, .085, len, 5), mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(m);
  }
  const dot = new THREE.Mesh(cylGeo(.31, .31, .13, 24), mat);
  dot.rotation.x = Math.PI / 2;
  dot.position.z = .02;
  g.add(dot);
  const ringLine = new THREE.Mesh(new THREE.RingGeometry(2.5, 2.56, 64), M.steelDark);
  ringLine.position.z = -.03;
  g.add(ringLine);
})();


// ── the service face: loading dock, blind windows, redundant doors ─────
(function rearFacade() {
  const RZ = -5.1;
  // loading dock canopy and door
  box(HALL, 4.5, 4.15, .22, M.voidBlack, 3.6, 2.36, RZ - .01);
  cbox(HALL, 5.35, .46, .52, M.concreteDark, 3.6, 4.62, RZ - .14, 0, true);
  cbox(HALL, .48, 4.75, .52, M.concreteDark, 1.13, 2.42, RZ - .14, 0, true);
  cbox(HALL, .48, 4.75, .52, M.concreteDark, 6.07, 2.42, RZ - .14, 0, true);
  // partially lowered steel shutter
  for (let i = 0; i < 8; i++) {
    box(HALL, 4.05, .068, .07, M.steelRust, 3.6, 4.24 - i * .1, RZ - .1);
  }
  box(HALL, 4.65, .08, .18, M.steelDark, 3.6, 3.32, RZ - .1);
  box(HALL, .24, .12, .12, M.steel, 3.6, 3.14, RZ - .18);
  // dock slab and steps
  cbox(HALL, 6.2, .36, 2.15, M.concreteDark, 3.6, .22, -6.15, 0, true);
  cbox(HALL, 6.6, .16, .55, M.concrete, 3.6, .07, -7.38, 0, true);
  cbox(HALL, 5.8, .16, .5, M.concreteDeep, 3.6, .19, -6.95, 0, true);
  // a cold canopy above
  cbox(HALL, 6.8, .34, 1.7, M.concreteCool, 3.6, 5.05, -5.9, 0, true);
  for (const x of [1.1, 6.1]) {
    cbox(HALL, .3, 1.3, .3, M.concreteDark, x, 4.4, -5.3, 0, true);
  }
  // windows blind on the back, like eyes sewn shut
  for (const x of [-7.15, -4.85, -2.55, 2.55, 4.85, 7.15]) {
    box(HALL, .76, 6.1, .20, M.voidBlack, x, 12.25, RZ - .02);
    box(HALL, .5, 5.7, .035, new THREE.MeshBasicMaterial({ color: 0x160706 }), x, 12.25, RZ - .13);
    const slit = new THREE.Mesh(boxGeo(.24, 5.3, .015), new THREE.MeshBasicMaterial({ color: 0x2b0706 }));
    slit.position.set(x, 12.25, RZ - .15); HALL.add(slit);
    cbox(HALL, 1.15, .22, .42, M.concreteDark, x, 15.42, RZ - .14, 0, true);
    cbox(HALL, 1.15, .22, .42, M.concreteDark, x, 9.08, RZ - .14, 0, true);
  }
  // vertical concrete teeth
  for (const x of [-8.55, -6.0, -3.55, 0, 3.55, 6.0, 8.55]) {
    cbox(HALL, .38, 17.1, .56, M.concrete, x, 8.55, RZ - .24, 0, true);
  }
  // rear emblem, a stamped bureaucratic seal
  const eg = groupAt(HALL, -5.1, 7.0, RZ - .32, Math.PI);
  const egMat = M.concreteBlack;
  const eCircle = new THREE.Mesh(new THREE.TorusGeometry(1.75, .11, 5, 40), egMat);
  eg.add(eCircle);
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * TAU / 3;
    const p = v3(Math.cos(a) * 1.95, Math.sin(a) * 1.95, 0);
    const p2 = v3(Math.cos(a + TAU / 3) * 1.95, Math.sin(a + TAU / 3) * 1.95, 0);
    const len = p.distanceTo(p2);
    const tri = new THREE.Mesh(cylGeo(.09, .09, len, 4), egMat);
    tri.position.copy(p).add(p2).multiplyScalar(.5);
    tri.quaternion.setFromUnitVectors(v3(0, 1, 0), p2.clone().sub(p).normalize());
    eg.add(tri);
  }
  const eBar = new THREE.Mesh(boxGeo(.22, 1.1, .12), egMat);
  eBar.position.set(0, -.25, .02); eg.add(eBar);
  // rear pipes and cable trays
  tube(HALL, [v3(6.8, 17.1, -5.1), v3(6.8, 9.2, -5.34), v3(8.1, 8.9, -5.34), v3(8.1, 5.2, -5.25), v3(7.0, 4.4, -5.3)], .09, M.steelRust, 28, 7);
  tube(HALL, [v3(-8.9, 16.9, -5.1), v3(-8.9, 4.0, -5.3), v3(-7.7, 3.2, -5.3), v3(-7.7, .5, -6.1)], .075, M.steelDark, 28, 6);
  for (let i = 0; i < 8; i++) {
    box(HALL, .15, .08, .5, M.steelDark, 6.8, 16.4 - i * 1.35, -5.25);
  }
  // a crack instead of a welcome mat
  const crackPts = [v3(8.8, 15.2, RZ - .03), v3(8.15, 13.4, RZ - .03), v3(8.45, 11.5, RZ - .03), v3(7.6, 9.4, RZ - .03), v3(7.8, 7.9, RZ - .03)];
  const crack = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crackPts), 20, .022, 4, false), M.stripRed);
  HALL.add(crack);
})();

// ── portico: front piers, massive lintel ───────────────────────────────
function frontPier(x) {
  const g = new THREE.Group();
  HALL.add(g);
  architectural(box(g, 2.2, 17.55, 3.0, M.concrete, 0, 8.78, 0, 0, true));
  architectural(box(g, 2.55, 1.4, 3.4, M.concreteDark, 0, 1.1, 0, 0, true));
  architectural(box(g, 2.4, .55, 3.9, M.concreteCool, 0, 16.35, .1, 0, true));
  // dark vertical reveal
  box(g, .42, 12.4, .12, M.voidBlack, -.48, 8.1, 1.54);
  box(g, .12, 12.4, .22, M.concreteDeep, .6, 8.1, 1.56);
  // service hatch and red beacon backplate
  box(g, .58, 1.0, .13, M.steelDark, .35, 5.15, 1.54);
  for (let i = 0; i < 4; i++) box(g, .37, .035, .035, M.steel, .35, 4.82 + i * .18, 1.61);
  g.position.set(x, 0, 3.1);
  return g;
}
const pierL = frontPier(-8.35);
const pierR = frontPier(8.35);
// a beam demanding to be looked at
architectural(box(HALL, 18.9, 1.65, 1.7, M.concrete, 0, 16.32, 3.1, 0, true));
architectural(box(HALL, 19.4, .38, 2.2, M.concreteDark, 0, 17.3, 3.1, 0, true));
box(HALL, 17.4, .26, .16, M.concreteDeep, 0, 15.49, 3.96);
// sign plate under the lintel
architectural(box(HALL, 6.25, 1.22, .20, M.steelDark, -.2, 15.46, 3.96, 0, true));
const signCanvas = (() => {
  const [c, x] = canvas2d(1200, 250);
  x.fillStyle = '#0b0c0c'; x.fillRect(0, 0, 1200, 250);
  x.strokeStyle = '#5b5e5b'; x.lineWidth = 3; x.strokeRect(10, 10, 1180, 230);
  x.fillStyle = '#a71616'; x.fillRect(34, 34, 8, 182);
  x.fillStyle = '#c7c6bc';
  x.font = '600 28px "Arial Narrow", "Helvetica Neue", sans-serif';
  x.letterSpacing = '8px';
  x.fillText('FEDERAL BUREAU OF CONTROL', 82, 70);
  x.fillStyle = '#aa1b18';
  x.font = '900 138px "Arial Black", Impact, sans-serif';
  x.fillText('FBC', 66, 204);
  x.fillStyle = '#e0ddd2';
  x.font = '900 75px "Arial Black", Impact, sans-serif';
  x.fillText('PARANORMAL', 390, 155);
  x.fillText('ARCHIVE 07', 390, 225);
  x.fillStyle = '#b32222';
  x.font = '700 22px ui-monospace, monospace';
  x.fillText('SECTOR 07  //  LEVEL 04  //  1964', 888, 70);
  x.fillStyle = '#6e6d66';
  x.font = '17px ui-monospace, monospace';
  x.fillText('CONCRETE DIVISION / FBC-77', 932, 232);
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
})();
const signPlane = new THREE.Mesh(planeGeo(6.08, 1.28), new THREE.MeshBasicMaterial({ map: signCanvas, color: 0xffffff }));
signPlane.position.set(-.2, 15.46, 4.066);
HALL.add(signPlane);
box(HALL, 6.4, .06, .12, M.steel, -.2, 14.82, 4.04);

// ── side structure / deep cross beams ──────────────────────────────────
for (const s of [-1, 1]) {
  const x = s * 8.55;
  architectural(box(HALL, .95, 1.15, 8.95, M.concreteDark, x, 7.65, -.45, 0, true));
  architectural(box(HALL, .8, .85, 8.4, M.concrete, x, 12.85, -.7, 0, true));
  // upper side infill, with slits
  architectural(box(HALL, .58, 4.3, 6.4, M.concreteCool, x + s * .2, 15.15, -.75, 0, true));
  for (let i = -1; i <= 2; i++) {
    box(HALL, .07, 2.1, .72, M.voidBlack, x + s * .51, 15.2, -.75 + i * 1.25);
  }
  // rear lower side infill
  architectural(box(HALL, .7, 6.0, 2.8, M.concrete, x + s * .15, 3.15, -3.15, 0, true));
  box(HALL, .05, 1.5, 1.35, M.voidBlack, x + s * .52, 3.0, -3.1);
  // steel corner columns at rear
  architectural(box(HALL, 1.3, 16.85, 1.15, M.concreteDeep, s * 8.9, 8.45, -4.1, 0, true));
}
// ── unsupported concrete tongues, reaching over the void ──────────────
(function cantilevers() {
  // west observation tray, level 02
  architectural(box(HALL, 3.45, .36, 4.5, M.concreteCool, -10.35, 10.2, -.3, 0, true));
  architectural(box(HALL, 3.9, .22, .55, M.concreteDark, -10.35, 10.0, -2.35, 0, true));
  architectural(box(HALL, .24, .78, 4.5, M.concrete, -12.0, 10.55, -.3, 0, true));
  architectural(box(HALL, 3.45, .78, .23, M.concrete, -10.35, 10.55, 1.88, 0, true));
  railing(HALL, 4.1, -10.35, 10.6, -2.25, true, .85);
  // east dead-letter terrace, level 03
  architectural(box(HALL, 3.35, .34, 4.25, M.concrete, 10.35, 13.6, -1.2, 0, true));
  architectural(box(HALL, 3.8, .2, .45, M.concreteDark, 10.35, 13.4, -3.24, 0, true));
  architectural(box(HALL, 3.35, .68, .22, M.concreteCool, 10.35, 13.95, -3.22, 0, true));
  architectural(box(HALL, .22, .68, 4.25, M.concrete, 11.95, 13.95, -1.2, 0, true));
  railing(HALL, 3.8, 10.35, 14.0, .85, true, .8);
  // raw cut ends, steel fibre bristling
  for (let i = 0; i < 7; i++) {
    const a = v3(-11.8 + rr(-.2, .2), 10.25 + rr(-.1, .15), rr(-2.0, 1.5));
    const b = a.clone().add(v3(rr(-.35, .1), rr(-.05, .15), rr(-.12, .12)));
    HALL.add(cylinderBetween(a, b, .012, M.steelRust, 4));
  }
  for (let i = 0; i < 5; i++) {
    const a = v3(11.8 + rr(-.15, .2), 13.65 + rr(-.08, .12), rr(-3.0, .7));
    const b = a.clone().add(v3(rr(-.1, .35), rr(-.05, .12), rr(-.12, .12)));
    HALL.add(cylinderBetween(a, b, .011, M.steelRust, 4));
  }
})();

// interior columns that stitch every floor together
for (const x of [-4.35, 4.35]) {
  architectural(box(HALL, .52, 16.2, .52, M.concreteDeep, x, 8.1, -3.75, 0, true));
  box(HALL, .62, .14, .62, M.steelDark, x, 5.55, -3.75);
  box(HALL, .62, .14, .62, M.steelDark, x, 10.05, -3.75);
}

// ── floor plates: an irrational vertical order ─────────────────────────
function parapet(x, z, width, depth, y, ry = 0) {
  const g = groupAt(HALL, x, y, z, ry);
  architectural(box(g, width, .72, .22, M.concrete, 0, .36, 0, 0, true));
  box(g, width + .1, .06, .3, M.concreteDark, 0, .74, 0);
  return g;
}
// level one
floorPlate(HALL, 6.6, 5.8, .4, M.concreteCool, -5.5, 5.62, -1.3);
floorPlate(HALL, 6.5, 6.9, .4, M.concrete, 5.55, 5.62, -.75);
architectural(box(HALL, 6.2, .3, .5, M.concreteDark, -5.5, 5.29, -1.8, 0, true));
architectural(box(HALL, 6.1, .3, .5, M.concreteDark, 5.55, 5.29, -.2, 0, true));
parapet(-2.2, -1.3, .22, 5.9, 5.82);
parapet(-5.5, 1.64, 6.8, .22, 5.82);
parapet(2.3, -.75, .22, 6.9, 5.82);
parapet(5.55, 2.7, 6.6, .22, 5.82);
railing(HALL, 2.1, -7.4, 5.83, 1.64, true);
// level two
floorPlate(HALL, 17.7, 2.2, .42, M.concrete, 0, 10.11, -3.15);
floorPlate(HALL, 4.5, 3.1, .4, M.concreteCool, 6.55, 10.11, -.9);
floorPlate(HALL, 3.3, 2.4, .38, M.concreteDark, -7.0, 10.11, -.95);
parapet(-4.7, -2.0, 8.2, .22, 10.32);
parapet(4.6, -2.0, .24, 2.4, 10.32);
parapet(4.25, -1.2, 4.6, .22, 10.32);
parapet(6.55, .62, 4.5, .2, 10.32);
railing(HALL, 4.2, 6.55, 10.33, .66, true, .9);
// level three
floorPlate(HALL, 6.0, 2.0, .32, M.concreteDeep, -5.6, 14.18, -2.25);
floorPlate(HALL, 3.5, 2.0, .32, M.concrete, 6.95, 14.18, .05);
floorPlate(HALL, 3.2, 1.4, .3, M.concreteCool, 5.4, 14.18, -3.1);
parapet(-8.55, -2.25, .18, 2.0, 14.34);
parapet(-5.6, -1.28, 6.0, .18, 14.34);
railing(HALL, 5.6, -5.6, 14.35, -1.3, true, .8);
railing(HALL, 3.1, 6.95, 14.35, .98, true, .8);
// deep structural ribs under floor plates
for (const x of [-7.1, -4.0]) {
  architectural(box(HALL, .5, .7, 4.9, M.concreteDark, x, 5.15, -1.4, 0, true));
}
for (const x of [3.7, 7.3]) {
  architectural(box(HALL, .5, .7, 5.8, M.concreteDark, x, 5.15, -.9, 0, true));
}

// ── a service stair gripping the east flank ────────────────────────────
(function serviceStair() {
  const g = new THREE.Group();
  HALL.add(g);
  const stairs = 15;
  const x = 10.25;
  const z0 = 3.2;
  const totalRise = 5.0;
  const run = 5.6;
  for (let i = 0; i < stairs; i++) {
    const t = i / (stairs - 1);
    const step = architectural(box(g, 1.65, .3, .5, i % 2 ? M.concreteCool : M.concrete, x, .2 + t * totalRise, z0 - t * run, 0, true));
    step.castShadow = true;
  }
  // sloped stringer
  const angle = Math.atan2(totalRise, run);
  const stringer = architectural(box(g, 1.82, .22, Math.hypot(totalRise, run) + .6, M.concreteDark, x, .12 + totalRise / 2, z0 - run / 2, 0, true));
  stringer.rotation.x = angle;
  // rail posts + sloping top rail
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const y = .65 + t * totalRise;
    const z = z0 - t * run;
    box(g, .045, .9, .045, M.steelDark, x + .8, y, z);
    if (i < 5) {
      const t2 = (i + 1) / 5;
      const y2 = .65 + t2 * totalRise;
      const z2 = z0 - t2 * run;
      const a = v3(x + .8, y + .85, z), b = v3(x + .8, y2 + .85, z2);
      g.add(cylinderBetween(a, b, .026, M.steelDark, 6));
    }
  }
  // landing and a black doorway into the mezzanine
  architectural(box(g, 2.0, .3, 1.5, M.concrete, 8.95, 5.18, -2.4, 0, true));
  box(g, .06, 2.4, 1.2, M.voidBlack, 8.98, 6.35, -2.4);
})();

// ── the roof, cut open over the impossible object ──────────────────────
const roofY = 18.0;
architectural(box(HALL, 20.2, 1.15, 11.4, M.concrete, 0, roofY, -.5, 0, true));
// carve a skylight by constructing the roof as four thick slabs
HALL.remove(HALL.children[HALL.children.length - 1]);
function roofSpan(w, d, x, z) {
  architectural(box(HALL, w, 1.15, d, M.concrete, x, roofY, z, 0, true));
}
roofSpan(5.5, 11.4, -7.25, -.5);
roofSpan(5.5, 11.4, 7.25, -.5);
roofSpan(9.0, 2.6, 0, -4.75);
roofSpan(9.0, 3.1, 0, 3.55);
// black metal skylight lip
box(HALL, 9.2, .1, .22, M.steelDark, 0, 18.64, -3.35);
box(HALL, 9.2, .1, .22, M.steelDark, 0, 18.64, 2.1);
box(HALL, .22, .1, 5.7, M.steelDark, -4.6, 18.64, -.6);
box(HALL, .22, .1, 5.7, M.steelDark, 4.6, 18.64, -.6);
// roof edge parapet
box(HALL, 20.4, .55, .26, M.concreteDark, 0, 18.85, -6.2);
box(HALL, 20.4, .55, .26, M.concreteDark, 0, 18.85, 5.2);
box(HALL, .26, .55, 11.6, M.concreteDark, -10.15, 18.85, -.5);
box(HALL, .26, .55, 11.6, M.concreteDark, 10.15, 18.85, -.5);
// deep underside ribs around the aperture
for (const x of [-8.0, -5.6, 5.6, 8.0]) {
  architectural(box(HALL, .32, .62, 10.6, M.concreteDark, x, 17.3, -.5, 0, true));
}
for (const z of [-4.9, 3.6]) {
  architectural(box(HALL, 19.7, .62, .32, M.concreteDark, 0, 17.3, z, 0, true));
}

// ── rooftop archive tower / brutalist neck ─────────────────────────────
const TOWER = new THREE.Group();
HALL.add(TOWER);
architectural(box(TOWER, 5.6, 2.6, 5.0, M.concreteCool, -5.0, 19.45, -2.65, 0, true));
architectural(box(TOWER, 4.7, 2.15, 4.0, M.concrete, -4.15, 21.8, -3.05, 0, true));
architectural(box(TOWER, 4.9, .22, 4.2, M.concreteDark, -4.15, 20.85, -3.05, 0, true));
// black vertical cuts in the tower
for (let i = 0; i < 5; i++) {
  box(TOWER, .16, 1.6, .05, M.voidBlack, -6.7 + i * .8, 19.85, -.13);
}
for (let i = 0; i < 4; i++) {
  box(TOWER, .14, 1.15, .05, M.voidBlack, -5.85 + i * .85, 21.95, -1.03);
}
// thin red slit at the tower throat
const towerSlit = new THREE.Mesh(boxGeo(3.1, .05, .06), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.1, .04, .02) }));
towerSlit.position.set(-4.35, 22.65, -1.48);
TOWER.add(towerSlit);
// antenna mast
const mast = cylinderBetween(v3(-3.65, 22.85, -3.35), v3(-3.65, 24.75, -3.35), .035, M.steelDark, 5);
TOWER.add(mast);
box(TOWER, 1.0, .035, .035, M.steelDark, -3.65, 24.4, -3.35);
box(TOWER, .035, .035, .65, M.steelDark, -3.65, 24.05, -3.35);
const mastTip = new THREE.Mesh(sphGeo(.085, 8, 8), M.bulb);
mastTip.position.set(-3.65, 24.77, -3.35);
TOWER.add(mastTip);
const mastGlow = glowSprite(0xff2a20, 1.0, .35);
mastGlow.position.copy(mastTip.position);
TOWER.add(mastGlow);
redGlowMats.push(mastGlow.material);
// low rooftop mechanical mass
architectural(box(TOWER, 3.2, 1.8, 2.7, M.concreteDark, 5.25, 19.35, -2.3, 0, true));
architectural(box(TOWER, 2.7, .7, 2.2, M.steelRust, 5.2, 20.55, -2.2, 0, true));
for (let i = 0; i < 7; i++) box(TOWER, 1.9, .04, .04, M.steelDark, 5.2, 18.6 + i * .1, -1.1);
// exposed rooftop duct
(function roofDuct() {
  const pts = [v3(-6.6, 19.0, -1.4), v3(-2.4, 19.2, -1.0), v3(2.0, 19.1, -.8), v3(4.3, 19.3, -1.3), v3(4.7, 19.3, -1.8)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .23, 10, false), M.steelRust);
  m.castShadow = true; TOWER.add(m);
  for (const p of [pts[1], pts[3]]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.28, .045, 5, 12), M.steelDark);
    collar.position.copy(p);
    collar.rotation.x = Math.PI / 2;
    TOWER.add(collar);
  }
})();


// ── rooftop mechanics: the bureau watches the sky too ──────────────────
(function rooftopClutter() {
  // a cold parabolic ear
  const dish = new THREE.Group();
  dish.position.set(7.7, 18.6, 2.55);
  dish.rotation.y = -.55;
  TOWER.add(dish);
  const mast = cylinderBetween(v3(0, 0, 0), v3(0, 1.35, 0), .075, M.steelDark, 6);
  dish.add(mast);
  const yoke = new THREE.Group();
  yoke.position.y = 1.45;
  yoke.rotation.x = .78;
  yoke.rotation.z = -.18;
  dish.add(yoke);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.86, 18, 9, 0, TAU, 0, Math.PI / 2.25), new THREE.MeshStandardMaterial({
    color: 0xa7aaa2, roughness: .55, metalness: .38, side: THREE.DoubleSide,
  }));
  bowl.scale.y = .42;
  bowl.castShadow = true;
  yoke.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.837, .028, 5, 28), M.steelDark);
  rim.rotation.x = Math.PI / 2;
  rim.scale.y = .42;
  rim.position.y = .25;
  yoke.add(rim);
  const feed = cylinderBetween(v3(0, -.02, 0), v3(0, .7, 0), .018, M.steel, 4);
  yoke.add(feed);
  const feedTip = new THREE.Mesh(sphGeo(.055, 8, 6), M.steelDark);
  feedTip.position.y = .72; yoke.add(feedTip);
  // birdshit, inevitable
  for (let i = 0; i < 9; i++) {
    const dot = new THREE.Mesh(cylGeo(rr(.02, .055), rr(.01, .035), .01, 5), M.concrete);
    dot.position.set(Math.cos(rr(0, TAU)) * .55, .26, Math.sin(rr(0, TAU)) * .55);
    yoke.add(dot);
  }

  // breathing vents and mechanical boxes
  for (let i = 0; i < 3; i++) {
    const x = -8.8 + i * .65, z = 3.7 - i * .55;
    const up = cylinderBetween(v3(x, 18.55, z), v3(x, 19.65 + i * .25, z), .15, M.steelRust, 10);
    TOWER.add(up);
    const cap = new THREE.Mesh(cylGeo(.32, .3, .12, 10), M.steelDark);
    cap.position.set(x, 19.75 + i * .25, z);
    TOWER.add(cap);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(.22, .055, 5, 10, Math.PI * 1.25), M.steelRust);
    elbow.position.set(x, 19.86 + i * .25, z);
    elbow.rotation.y = 1 + i;
    TOWER.add(elbow);
  }
  for (let i = 0; i < 2; i++) {
    const x = fBCRandomX(i);
    architectural(box(TOWER, 1.6, .8, 1.2, M.concreteDark, 7.0 - i * 1.2, 19.25 + i * .85, -4.4 + i * 1.0, 0, true));
    for (let j = 0; j < 4; j++) {
      box(TOWER, 1.25, .06, .04, M.steelDark, 7.0 - i * 1.2, 19.02 + i * .85 + j * .14, -3.78 + i * 1.0);
    }
  }
  function fBCRandomX(i) { return 7 + i * .3; }

  // red aviation lights, old and unreliable
  for (const b of [[-9.35, 18.95, 4.7], [9.3, 18.95, 4.5], [9.25, 18.95, -5.5]]) {
    box(TOWER, .2, .2, .2, M.steelDark, b[0], b[1], b[2]);
    const bulb = new THREE.Mesh(sphGeo(.075, 8, 6), M.bulb);
    bulb.position.set(b[0], b[1] + .15, b[2]);
    TOWER.add(bulb);
    const halo = glowSprite(0xff2a1e, 1.2, .3);
    halo.position.copy(bulb.position);
    TOWER.add(halo);
    redGlowMats.push(halo.material);
  }

  // stencilled duty mark on the forehead of the tower
  const [c, x] = canvas2d(900, 360);
  x.clearRect(0, 0, 900, 360);
  x.fillStyle = 'rgba(112,23,19,.82)';
  x.font = '900 260px "Arial Black", Impact, sans-serif';
  x.fillText('07', 40, 272);
  x.fillStyle = 'rgba(45,39,34,.75)';
  x.font = '700 30px ui-monospace, monospace';
  x.fillText('FEDERAL BUREAU OF CONTROL', 450, 95);
  x.fillText('PARANORMAL STORAGE / TOWER B', 450, 140);
  x.strokeStyle = 'rgba(114,25,21,.6)'; x.lineWidth = 5;
  x.strokeRect(440, 175, 410, 106);
  x.font = '700 24px ui-monospace, monospace';
  x.fillStyle = 'rgba(46,39,34,.7)';
  x.fillText('NO OBSERVATION WITHOUT A WITNESS', 458, 214);
  x.fillText('DO NOT FEED THE ARCHIVE', 458, 250);
  // chipped paint
  x.globalCompositeOperation = 'destination-out';
  const r = rng(9913);
  for (let i = 0; i < 160; i++) {
    x.fillStyle = 'rgba(0,0,0,' + (.1 + r() * .7) + ')';
    x.beginPath(); x.ellipse(r() * 900, r() * 360, 1 + r() * 22, 1 + r() * 3, r() * TAU, 0, TAU); x.fill();
  }
  x.globalCompositeOperation = 'source-over';
  const tex = canvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mark = new THREE.Mesh(planeGeo(4.5, 1.8), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: .82, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  }));
  mark.position.set(-5.0, 19.4, -.13);
  TOWER.add(mark);
})();

// ── suspended ceiling fixtures / red emergency spine ────────────────────
for (let i = 0; i < 5; i++) {
  const x = -6.5 + i * 3.2;
  box(HALL, .06, 1.2, .06, M.steelDark, x, 16.9, -.2);
  const shade = new THREE.Mesh(cylGeo(.22, .56, .26, 12), M.steelDark);
  shade.position.set(x, 16.25, -.2); HALL.add(shade);
  const bulb = new THREE.Mesh(sphGeo(.16, 10, 8), M.bulbAmber);
  bulb.position.set(x, 16.13, -.2); HALL.add(bulb);
  const g = glowSprite(0xff6b30, .8, .13); g.position.copy(bulb.position); HALL.add(g);
}
// red strips beneath upper floors
for (const s of [[-5.5, 5.4, -1.3, 5.7], [5.5, 5.4, -.75, 5.7], [0, 9.88, -3.15, 17.2]]) {
  const strip = new THREE.Mesh(boxGeo(s[3], .035, .035), M.stripRed);
  strip.position.set(s[0], s[1], s[2] + 1.0);
  HALL.add(strip);
}
// red atmospheric pressure, pooled under the roof
for (const x of [-5.4, 4.9]) {
  const haze = glowSprite(0xff2b1b, 1, .05);
  haze.scale.set(4.5, 15.5, 1);
  haze.position.set(x, 9.0, 1.8);
  HALL.add(haze);
  redGlowMats.push(haze.material);
}
const coldHaze = glowSprite(0x6fa9bf, 1, .035);
coldHaze.scale.set(7.5, 16.5, 1);
coldHaze.position.set(0, 9.8, -.5);
HALL.add(coldHaze);
greenGlowMats.push(coldHaze.material);

// wall-mounted service conduits
for (let i = 0; i < 3; i++) {
  const z = -3.7 + i * .23;
  tube(HALL, [v3(9.0, .7, z), v3(9.03, 6.0, z), v3(9.0, 10.4, z + .2), v3(9.0, 16.8, z + .2)], .025, M.steelDark, 22, 4);
}
// metal anchors / form-tie rhythm on the portico piers
for (const p of [pierL, pierR]) {
  for (let row = 0; row < 7; row++) for (let col = 0; col < 3; col++) {
    const dot = new THREE.Mesh(cylGeo(.035, .035, .04, 6), M.steelDark);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(-.78 + col * .75, 2.2 + row * 2.0, 1.53);
    p.add(dot);
  }
}

// ── red emergency cage lamps, distributed on the concrete ──────────────
function cageLamp(parent, x, y, z, face = 1, scale = 1) {
  const g = groupAt(parent, x, y, z, face > 0 ? 0 : Math.PI);
  box(g, .4, .48, .16, M.steelDark, 0, 0, .04);
  const bracket = cylinderBetween(v3(0, 0, .06), v3(0, 0, .42), .035, M.steelDark, 6);
  g.add(bracket);
  const housing = new THREE.Mesh(cylGeo(.15, .23, .24, 10), M.steelDark);
  housing.rotation.x = Math.PI / 2; housing.position.z = .47; g.add(housing);
  const bulb = new THREE.Mesh(sphGeo(.12, 10, 8), M.bulb);
  bulb.position.z = .55; g.add(bulb);
  for (let r = 0; r < 3; r++) {
    const cage = new THREE.Mesh(new THREE.TorusGeometry(.17 + r * .02, .009, 3, 12), M.steelDark);
    cage.position.z = .52; g.add(cage);
  }
  for (let a = 0; a < 4; a++) {
    const cage = cylinderBetween(v3(Math.cos(a * Math.PI / 2) * .17, Math.sin(a * Math.PI / 2) * .17, .4),
      v3(Math.cos(a * Math.PI / 2) * .17, Math.sin(a * Math.PI / 2) * .17, .66), .007, M.steelDark, 4);
    g.add(cage);
  }
  const glow = glowSprite(0xff241a, 2.1 * scale, .42);
  glow.position.z = .62; g.add(glow);
  redGlowMats.push(glow.material);
  const pupil = new THREE.Mesh(sphGeo(.09, 8, 6), M.bulb);
  pupil.position.z = .61; g.add(pupil);
  return g;
}
cageLamp(pierL, -.2, 10.8, 1.58, 1, 1.2);
cageLamp(pierR, -.2, 6.9, 1.58, 1, 1.0);
cageLamp(pierL, -.2, 3.7, 1.58, 1, .9);
cageLamp(HALL, -2.55, 6.5, 1.7, 1, .9);
cageLamp(HALL, 2.55, 11.2, -1.88, 1, .8);
cageLamp(HALL, 8.85, 13.2, 1.2, -1, .9);
cageLamp(HALL, -7.9, 8.5, -5.3, -1, .9);
cageLamp(HALL, 8.95, 5.3, -5.3, -1, .8);
// a red haze hugs the lintel rather than a hard volumetric cone
for (let i = 0; i < 3; i++) {
  const haze = glowSprite(0xff241a, 7.5 + i * 2.0, .045);
  haze.position.set(-3.5 + i * 3.3, 15.0 - i * .5, 4.15);
  HALL.add(haze);
  redGlowMats.push(haze.material);
}
