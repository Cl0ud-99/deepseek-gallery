// ═══════════════════════════════════════════════════════════════════════
//  04 — the object, the levitating offices, and 2,300 loose pages
// ═══════════════════════════════════════════════════════════════════════

// ── tiny geometry-merging forge (so the furniture stays cheap) ─────────
function transformPart(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz)
  );
  return { geo, mat, m };
}
function forgeParts(parts, name = '') {
  const buckets = new Map();
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    g.applyMatrix4(p.m);
    if (!buckets.has(p.mat)) buckets.set(p.mat, []);
    buckets.get(p.mat).push(g);
  }
  const root = new THREE.Group();
  root.name = name;
  for (const [mat, geos] of buckets) {
    let vCount = 0;
    for (const g of geos) vCount += g.attributes.position.count;
    const pos = new Float32Array(vCount * 3);
    const nor = new Float32Array(vCount * 3);
    const uv = new Float32Array(vCount * 2);
    let o = 0;
    for (const g of geos) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += n;
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const edge = outline(mesh, 35, inkSoft);
    edge.castShadow = false;
    root.add(mesh);
    for (const g of geos) g.dispose();
  }
  return root;
}

// ── the 1970s federal workstation, built once and cloned like a bad idea ─
function addChairParts(parts, ox, oy, oz, ry = 0, tipped = 0) {
  const seatY = .43, seatH = .07;
  const wood = M.woodDark, wood2 = M.wood;
  const frame = M.steelDark;
  // seat
  parts.push(transformPart(boxGeo(.63, seatH, .58), wood, ox, oy + seatY, oz, 0, ry, 0));
  // backrest
  parts.push(transformPart(boxGeo(.59, .44, .065), wood2, ox, oy + .77, oz + .27, -.12, ry, 0));
  parts.push(transformPart(boxGeo(.54, .035, .05), frame, ox, oy + .56, oz + .255, -.12, ry, 0));
  // armrests
  for (const s of [-1, 1]) {
    parts.push(transformPart(boxGeo(.035, .25, .42), frame, ox + s * .32, oy + .6, oz + .01, 0, ry, 0));
    parts.push(transformPart(boxGeo(.04, .035, .4), frame, ox + s * .32, oy + .72, oz + .02, 0, ry, 0));
  }
  // central pillar and five-star base
  parts.push(transformPart(cylGeo(.045, .045, .31, 8), frame, ox, oy + .24, oz, 0, 0, 0));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + .2;
    const len = .31;
    parts.push(transformPart(boxGeo(.045, .045, len), frame, ox + Math.cos(a) * len / 2, oy + .15, oz + Math.sin(a) * len / 2, .08, -a + Math.PI / 2, 0));
    parts.push(transformPart(sphGeo(.035, 6, 5), M.blackPlastic, ox + Math.cos(a) * len, oy + .08, oz + Math.sin(a) * len));
  }
  // little casters
  // chair can be angled by rotating the whole subassembly — parts carry their own transform
}
function makeChair(seed = 1) {
  const parts = [];
  addChairParts(parts, 0, 0, 0, 0);
  return forgeParts(parts, 'floating office chair');
}

const typedKeys = [];
function addTypewriterParts(parts, ox, oy, oz, ry = 0) {
  const black = M.blackPlastic, steel = M.steel;
  const b = .9;
  parts.push(transformPart(boxGeo(.5 * b, .15, .32 * b), black, ox, oy + .075, oz, 0, ry, 0));
  parts.push(transformPart(boxGeo(.48 * b, .1, .18 * b), black, ox, oy + .15, oz - .03, -.12, ry, 0));
  // roller
  parts.push(transformPart(cylGeo(.038, .038, .57 * b, 8), black, ox, oy + .23, oz - .15, 0, ry, Math.PI / 2));
  // paper
  parts.push(transformPart(boxGeo(.36 * b, .35, .012), M.paper, ox, oy + .4, oz - .17, -.06, ry, 0));
  // keys
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
    parts.push(transformPart(boxGeo(.04, .018, .035), steel,
      ox + (col - 3) * .052, oy + .165 + row * .012, oz + .09 - row * .04, 0, ry, 0));
  }
  // carriage knobs
  for (const s of [-1, 1]) {
    parts.push(transformPart(cylGeo(.045, .045, .045, 8), steel, ox + s * .30 * b, oy + .23, oz - .15, 0, ry, Math.PI / 2));
  }
  // return arm
  parts.push(transformPart(boxGeo(.04, .035, .18), steel, ox + .28, oy + .25, oz - .04, 0, ry, 0));
}
function addLampParts(parts, ox, oy, oz, ry = 0, lit = true) {
  parts.push(transformPart(cylGeo(.12, .15, .035, 14), M.steelDark, ox, oy + .02, oz));
  parts.push(transformPart(cylGeo(.017, .017, .37, 6), M.brass, ox, oy + .2, oz));
  parts.push(transformPart(cylGeo(.055, .04, .07, 10), M.brass, ox, oy + .38, oz, 0, ry, 0));
  // angular 70s shade
  parts.push(transformPart(cylGeo(.07, .19, .16, 12), M.lampGreen, ox, oy + .44, oz, 0, ry, 0));
  parts.push(transformPart(cylGeo(.13, .13, .015, 12), lit ? M.bulbAmber : M.blackPlastic, ox, oy + .36, oz, 0, ry, 0));
}
function addDeskParts(parts, seed, variant) {
  const r = rng(seed);
  const wood = variant === 1 ? M.woodDark : M.wood;
  const edge = M.woodDark;
  const metal = M.steelDark;
  const topY = .79;
  // top
  parts.push(transformPart(boxGeo(2.05, .09, .98), wood, 0, topY, 0));
  parts.push(transformPart(boxGeo(2.08, .028, .99), edge, 0, topY - .055, 0));
  // legs
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    parts.push(transformPart(boxGeo(.065, .71, .065), metal, sx * .88, .385, sz * .37));
    parts.push(transformPart(cylGeo(.004, .004, .01, 4), M.brass, sx * .88, .02, sz * .37));
  }
  // side drawer block
  const side = variant === 2 ? -1 : 1;
  parts.push(transformPart(boxGeo(.58, .48, .87), variant === 1 ? M.paintedGreen : wood, side * .66, .50, 0));
  for (let i = 0; i < 3; i++) {
    parts.push(transformPart(boxGeo(.55, .12, .025), edge, side * .66, .66 - i * .145, .446));
    parts.push(transformPart(boxGeo(.18, .025, .035), M.brass, side * .66, .66 - i * .145, .47));
  }
  // modesty panel
  parts.push(transformPart(boxGeo(1.25, .31, .035), wood, 0, .48, -.3));
  // stacks of paper on the top
  const paperCnt = 2 + Math.floor(r() * 3);
  for (let i = 0; i < paperCnt; i++) {
    const px = r() > .5 ? .5 : -.54;
    parts.push(transformPart(boxGeo(.4, .012, .53), r() > .55 ? M.paper : M.paperAged, px + (r() - .5) * .12, topY + .06 + i * .012, .05 + (r() - .5) * .22, 0, (r() - .5) * .2, (r() - .5) * .1));
  }
  // typewriter
  addTypewriterParts(parts, -.31, topY + .045, .02, (r() - .5) * .08);
  // lamp
  addLampParts(parts, .67, topY + .045, -.17, (r() - .5) * .2, r() > .2);
  // telephone / folders
  if (variant === 0) {
    parts.push(transformPart(boxGeo(.27, .09, .2), M.blackPlastic, .38, topY + .075, .33, 0, -.08, 0));
    parts.push(transformPart(boxGeo(.23, .06, .12), M.blackPlastic, .38, topY + .135, .33, -.08, -.08, 0));
    parts.push(transformPart(cylGeo(.018, .018, .06, 8), M.steel, .48, topY + .08, .41, 0, 0, 0));
  } else if (variant === 1) {
    for (let i = 0; i < 4; i++) parts.push(transformPart(boxGeo(.43, .025, .55), i % 2 ? M.paperAged : M.paper, -.3 + i * .008, topY + .07 + i * .025, -.08, 0, .02 * i, .01 * i));
    parts.push(transformPart(boxGeo(.16, .07, .11), M.blackPlastic, .55, topY + .06, .32, 0, .2, 0));
  } else {
    parts.push(transformPart(boxGeo(.34, .16, .43), M.steelRust, -.62, topY + .11, -.05, 0, .04, 0));
    for (let i = 0; i < 4; i++) parts.push(transformPart(boxGeo(.28, .03, .38), M.paper, -.62 + i * .004, topY + .2 + i * .03, -.05, 0, .1, 0));
  }
  // chair, slightly turned, tucked close to the kneehole
  addChairParts(parts, .25, 0, 1.28, (r() - .5) * .75 + Math.PI);
}
function makeDesk(seed, variant) {
  const parts = [];
  addDeskParts(parts, seed, variant);
  return forgeParts(parts, 'FBC desk');
}
const deskPrototypes = [makeDesk(19, 0), makeDesk(27, 1), makeDesk(44, 2)];
const chairPrototype = makeChair(1);
const typewriterBase = (() => { const p = []; addTypewriterParts(p, 0, 0, 0, 0); return forgeParts(p, 'floating typewriter'); })();
const lampBase = (() => { const p = []; addLampParts(p, 0, 0, 0, 0, true); return forgeParts(p, 'floating lamp'); })();

// ── stationary government work, still waiting ──────────────────────────
function placeDesk(x, y, z, ry, variant = 0, scale = 1) {
  const proto = deskPrototypes[variant % deskPrototypes.length];
  const g = proto.clone();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  g.scale.setScalar(scale);
  HALL.add(g);
  return g;
}
placeDesk(-6.05, .25, -1.15, .36, 0, .94);
placeDesk(-4.35, .25, 1.42, -.52, 1, .9);
placeDesk(3.0, .25, 2.15, -2.52, 2, .92);
placeDesk(5.75, .25, -.95, 2.31, 0, .96);
placeDesk(-1.0, .25, 3.18, .7, 1, .86);
placeDesk(-6.0, 5.82, -2.33, .23, 2, .82);
placeDesk(-7.35, 5.82, .38, .94, 1, .8);
placeDesk(5.25, 5.82, -1.15, -.45, 0, .84);
placeDesk(6.2, 10.32, -2.5, -.7, 1, .74);
placeDesk(-5.4, 14.34, -2.2, .12, 0, .66);
placeDesk(10.15, 13.77, -.4, -.9, 2, .62);
// a chair on its own, contemplating the void
for (let i = 0; i < 7; i++) {
  const c = chairPrototype.clone();
  c.position.set(rr(-7.2, 7.2), rr(1.0, 15.6), rr(-2.6, 3.6));
  c.rotation.set(rr(-.4, .4), rr(0, TAU), rr(-.4, .4));
  c.scale.setScalar(rr(.72, 1.0));
  HALL.add(c);
  deskFloat.push({
    obj: c, base: c.position.clone(), phase: rr(0, TAU), ax: rr(.08, .28), ay: rr(.08, .3), az: rr(.06, .2),
    ry0: c.rotation.y, rx0: c.rotation.x, rz0: c.rotation.z, speed: rr(.07, .16),
  });
}

// ── the object in the middle of the hall ──────────────────────────────
function monolithGeometry() {
  const rings = 9;
  const sides = 11;
  const pts = [];
  const r = rng(977);
  for (let j = 0; j < rings; j++) {
    const v = j / (rings - 1);
    const y = -1.25 + v * 2.5;
    // a mass that is broad at one shoulder, pinched at the waist, sheared at the other
    const profile = .55 + Math.sin(v * Math.PI) * .72 + Math.sin(v * 5.1 + 1.2) * .075;
    const shear = Math.sin(v * 2.2) * .15;
    const row = [];
    for (let i = 0; i < sides; i++) {
      const a = i / sides * TAU + Math.sin(v * 4.4 + j * 1.7) * .09;
      const rad = profile * (.83 + r() * .28);
      row.push(new THREE.Vector3(Math.cos(a) * rad + shear, y + (r() - .5) * .11, Math.sin(a) * rad * .72));
    }
    pts.push(row);
  }
  const verts = [];
  const pushTri = (a, b, c) => { verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); };
  for (let j = 0; j < rings - 1; j++) {
    const A = pts[j], B = pts[j + 1];
    for (let i = 0; i < sides; i++) {
      const i2 = (i + 1) % sides;
      pushTri(A[i], B[i2], A[i2]);
      pushTri(A[i], B[i], B[i2]);
    }
  }
  // top and bottom caps, broken into triangles for flat facets
  for (const row of [pts[0], pts[rings - 1]]) {
    const c = new THREE.Vector3();
    for (const p of row) c.add(p);
    c.multiplyScalar(1 / sides);
    for (let i = 0; i < sides; i++) pushTri(c, row[i], row[(i + 1) % sides]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

const OBJECT = new THREE.Group();
OBJECT.position.set(.25, 9.35, .62);
OBJECT.rotation.set(.03, .22, -.055);
OBJECT.scale.setScalar(2.5);
HALL.add(OBJECT);
const objectGeo = monolithGeometry();
const objectMesh = new THREE.Mesh(objectGeo, new THREE.MeshStandardMaterial({
  color: 0x07070a, roughness: .36, metalness: .48, flatShading: true,
  bumpMap: concreteBump, bumpScale: .055, envMapIntensity: 1.15,
}));
objectMesh.castShadow = true; objectMesh.receiveShadow = true;
OBJECT.add(objectMesh);
// thin silhouette lines only at the harshest edges
const objEdge = new THREE.LineSegments(new THREE.EdgesGeometry(objectGeo, 42), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .85 }));
objEdge.scale.setScalar(1.003);
OBJECT.add(objEdge);

// angular shards embedded in the mass, like anti-gravity rebar
for (let i = 0; i < 6; i++) {
  const a = rr(0, TAU), rad = rr(1.0, 1.7), y = rr(-.8, .9);
  const shard = new THREE.Mesh(boxGeo(rr(.2, .5), rr(.8, 1.8), rr(.1, .3)), M.black);
  shard.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad * .7);
  shard.rotation.set(rr(-.4, .4), rr(0, TAU), rr(-.5, .5));
  shard.castShadow = true;
  OBJECT.add(shard);
}

// hot red seams
const fissureMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.9, .06, .025) });
const fissurePaths = [
  [[.2, -1.05, 1.04], [.18, -.8, 1.24], [-.08, -.5, 1.4], [-.1, -.15, 1.48], [-.4, .13, 1.39], [-.65, .36, 1.3]],
  [[.96, -.4, .75], [.82, -.2, .98], [.6, .02, 1.16], [.35, .22, 1.27], [.1, .5, 1.3]],
  [[-.95, .55, .85], [-.72, .7, 1.02], [-.52, .9, 1.08], [-.25, 1.0, .96]],
];
for (const path of fissurePaths) {
  const curve = new THREE.CatmullRomCurve3(path.map(p => v3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, 16, .025, 4, false);
  const crack = new THREE.Mesh(geo, fissureMat);
  crack.scale.set(1.2, 1.15, 1);
  OBJECT.add(crack);
  // dark scorched edges
  const scorch = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .08, 4, false), M.voidBlack);
  scorch.scale.set(1.1, 1.1, 1);
  scorch.position.z = -.02;
  OBJECT.add(scorch);
}
// the light it refuses to explain
const objectGlow = glowSprite(0xff2a1e, 6.4, .18);
objectGlow.position.set(0, -.8, .8);
OBJECT.add(objectGlow);
redGlowMats.push(objectGlow.material);
const objectLight = new THREE.PointLight(0xff251a, 36, 10, 1.7);
objectLight.position.set(.25, 7.0, 1.1);
HALL.add(objectLight);
pulseLights.push({ light: objectLight, base: 36, phase: 1.2 });
// define the silhouette from inside the hall and from the red dark behind
const objectKey = new THREE.SpotLight(0xc2d6de, 430, 24, .34, .82, 1.65);
objectKey.position.set(3.4, 15.9, 4.4);
objectKey.target.position.set(.25, 9.4, .4);
HALL.add(objectKey); HALL.add(objectKey.target);
const objectRim = new THREE.SpotLight(0xff2b18, 330, 20, .52, .9, 1.7);
objectRim.position.set(1.0, 13.3, -3.6);
objectRim.target.position.set(.25, 9.2, .6);
HALL.add(objectRim); HALL.add(objectRim.target);
const halo = glowSprite(0xff2719, 9.2, .15);
halo.position.set(.1, 9.55, -3.92);
HALL.add(halo);
redGlowMats.push(halo.material);

// a soft dark spot, like a shadow with no object willing to cast it
(function shadowBeneathObject() {
  const [c, x] = canvas2d(256, 256);
  const g = x.createRadialGradient(128, 128, 2, 128, 128, 126);
  g.addColorStop(0, 'rgba(0,0,0,.82)');
  g.addColorStop(.4, 'rgba(0,0,0,.48)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  const shadow = new THREE.Mesh(planeGeo(9.5, 8.0), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: .8, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(.25, .262, .2);
  HALL.add(shadow);
})();

// concrete skin coming off the object and drifting upward
const chipData = [];
const chipGeo = irregularRockGeo(1, 1907, 0, .68);
const chipMat = new THREE.MeshStandardMaterial({ color: 0x8b9091, roughness: .9, metalness: .08, flatShading: true });
const chips = new THREE.InstancedMesh(chipGeo, chipMat, 92);
chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
chips.castShadow = false; chips.receiveShadow = false;
chips.frustumCulled = false;
HALL.add(chips);
for (let i = 0; i < 92; i++) {
  chipData.push({
    a: rr(0, TAU), r: rr(3.3, 4.9), h: rr(-3.2, 2.2), rise: rr(.6, 2.9),
    speed: rr(.012, .04), phase: rr(0, 1), s: i % 9 === 0 ? rr(.23, .4) : rr(.05, .16), spin: rr(-.7, .7), tilt: rr(0, TAU), sy: rr(.55, 1.0),
  });
}
const emberGeo = new THREE.TetrahedronGeometry(1, 0);
const emberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .06, .03) });
const embers = new THREE.InstancedMesh(emberGeo, emberMat, 22);
embers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
embers.frustumCulled = false;
HALL.add(embers);
const emberData = [];
for (let i = 0; i < 22; i++) {
  emberData.push({ a: rr(0, TAU), r: rr(2.6, 4.9), h: rr(-2.7, 1.8), rise: rr(.8, 3.2), speed: rr(.03, .07), phase: rr(0, 1), s: rr(.02, .075) });
}

// ── dozens of abandoned desks, still keeping office hours ──────────────
function floatDesk(x, y, z, ry, variant, scale = 1, inverted = false) {
  const g = deskPrototypes[variant % deskPrototypes.length].clone();
  g.scale.setScalar(scale);
  g.position.set(x, y, z);
  g.rotation.order = 'YXZ';
  g.rotation.set(inverted ? Math.PI : rr(-.08, .08), ry, inverted ? rr(-.12, .12) : rr(-.1, .1));
  HALL.add(g);
  deskFloat.push({
    obj: g, base: g.position.clone(), phase: rr(0, TAU),
    ax: rr(.05, .27), ay: rr(.05, .25), az: rr(.05, .22),
    ry0: g.rotation.y, rx0: g.rotation.x, rz0: g.rotation.z, speed: rr(.055, .14),
    inverted,
  });
  return g;
}
// low, ghostly office hours under the mezzanine
floatDesk(-6.05, 4.1, 2.15, .45, 0, .84);
floatDesk(4.9, 3.7, 3.15, -.66, 1, .86);
floatDesk(-2.75, 3.25, 3.6, .16, 2, .8);
floatDesk(2.15, 2.9, 4.2, -.32, 0, .82);
floatDesk(-4.15, 2.7, 4.55, 1.2, 1, .88);
floatDesk(5.95, 4.55, 1.45, -1.2, 2, .8);
// mid-air strata
floatDesk(-5.7, 7.2, 2.4, .16, 1, .94);
floatDesk(-3.9, 8.5, 3.7, -1.0, 0, .86);
floatDesk(-1.25, 7.0, 4.45, .7, 2, .82);
floatDesk(1.2, 7.9, 3.75, -.25, 0, .92);
floatDesk(3.1, 8.85, 2.55, -1.5, 1, .9);
floatDesk(5.75, 7.35, 2.9, .53, 2, .84);
floatDesk(4.9, 6.75, -.4, 2.0, 0, .9);
floatDesk(-5.2, 8.95, -.6, 1.8, 2, .88);
floatDesk(.2, 9.65, 3.65, .08, 1, .9);
floatDesk(-2.2, 8.7, 1.1, -.9, 0, .84);
// upper archive air
floatDesk(-6.8, 12.1, 1.0, 1.0, 0, .84, true);
floatDesk(-4.55, 11.6, 3.2, .4, 2, .8);
floatDesk(-1.3, 12.55, 4.7, -.5, 1, .86);
floatDesk(2.1, 11.8, 4.1, .9, 0, .78);
floatDesk(4.9, 12.4, 1.9, -.2, 1, .88);
floatDesk(6.5, 13.25, 3.7, 1.7, 2, .83);
floatDesk(-7.1, 15.7, 2.2, -.9, 0, .78);
floatDesk(-4.1, 15.05, 4.3, .3, 2, .78, true);
floatDesk(.8, 15.8, 3.45, -1.3, 1, .8);
floatDesk(4.15, 16.0, .6, .8, 0, .76);
floatDesk(6.6, 15.2, -1.4, -.4, 2, .74);
floatDesk(-6.2, 6.1, 5.45, .8, 1, .75);
// above the roof, in the red weather
floatDesk(-1.6, 20.2, 1.9, .2, 0, .82);
floatDesk(2.9, 20.9, -1.0, -.8, 2, .8);
floatDesk(6.0, 21.7, 2.9, 1.0, 1, .76);
floatDesk(-7.4, 20.4, -1.2, -.2, 2, .72, true);
floatDesk(8.1, 19.65, 5.2, -1.0, 0, .7);
// detached office equipment
for (let i = 0; i < 8; i++) {
  const obj = typewriterBase.clone();
  obj.position.set(rr(-7.0, 7.0), rr(2.5, 16.0), rr(-2.0, 4.6));
  obj.rotation.set(rr(-.8, .8), rr(0, TAU), rr(-.8, .8));
  obj.scale.setScalar(rr(.7, 1.15));
  HALL.add(obj);
  deskFloat.push({ obj, base: obj.position.clone(), phase: rr(0, TAU), ax: rr(.1, .35), ay: rr(.12, .35), az: rr(.1, .3), ry0: obj.rotation.y, rx0: obj.rotation.x, rz0: obj.rotation.z, speed: rr(.06, .15) });
}
for (let i = 0; i < 6; i++) {
  const obj = lampBase.clone();
  obj.position.set(rr(-7.4, 7.4), rr(3.0, 17.0), rr(-2.5, 4.4));
  obj.rotation.set(rr(-.3, .3), rr(0, TAU), rr(-.3, .3));
  obj.scale.setScalar(rr(1.0, 1.6));
  HALL.add(obj);
  deskFloat.push({ obj, base: obj.position.clone(), phase: rr(0, TAU), ax: rr(.15, .4), ay: rr(.15, .4), az: rr(.12, .35), ry0: obj.rotation.y, rx0: obj.rotation.x, rz0: obj.rotation.z, speed: rr(.09, .18) });
}

// ── 2,300 pages, held in the air by an administrative error ─────────────
function bentPaperGeometry() {
  const g = planeGeo(.34, .46, 2, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.sin(x * 11 + y * 4) * .028 + Math.cos(y * 7) * .016);
  }
  g.computeVertexNormals();
  return g;
}
const paperGeo = bentPaperGeometry();
const paperMeshProps = [];
function createPaperField(count, seed, kind) {
  const rrng = rng(seed);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: .94, metalness: 0, side: THREE.DoubleSide,
    transparent: false,
  });
  const mesh = new THREE.InstancedMesh(paperGeo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = false; mesh.receiveShadow = false;
  HALL.add(mesh);
  const data = [];
  const centers = [];
  for (let c = 0; c < 28; c++) {
    centers.push(v3(
      rrng(-7.4, 7.4),
      rrng(2.0, 17.0),
      rrng(-3.2, 4.8)
    ));
  }
  const outdoor = kind === 2;
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scale = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const palette = kind === 0
    ? ['#e0dac9', '#d1cab7', '#c4bea9', '#ebe5d3', '#b9b29f']
    : kind === 2
      ? ['#d8d0bd', '#bfb59f', '#aaa087', '#e2dbc9', '#8f8670']
      : ['#b09f7d', '#9d8e6f', '#c1b393', '#8d836a', '#d0c2a0'];
  const cc = new THREE.Color();
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (outdoor) {
      x = rrng(-9.4, 9.4);
      y = rrng(.55, 7.0);
      z = rrng() < .26 ? rrng(-12.0, -5.2) : rrng(4.8, 11.8);
    } else if (rrng() < .68) {
      const c = centers[Math.floor(rrng() * centers.length)];
      const rad = rrng(0, 2.3);
      const a = rrng(0, TAU);
      x = c.x + Math.cos(a) * rad;
      y = c.y + rrng(-1.1, 1.1);
      z = c.z + Math.sin(a) * rad;
    } else {
      x = rrng(-8.2, 8.2);
      y = rrng(1.0, 18.2);
      z = rrng(-3.8, 5.7);
    }
    // keep the pages from collapsing into a solid cube
    if (y < .45) y = rrng(.45, 2.2);
    const s = outdoor ? rrng(.7, 1.75) : rrng(.55, 1.35);
    euler.set(rrng(-Math.PI, Math.PI), rrng(-Math.PI, Math.PI), rrng(-Math.PI, Math.PI));
    quat.setFromEuler(euler);
    pos.set(x, y, z);
    scale.set(s, s, s);
    m.compose(pos, quat, scale);
    mesh.setMatrixAt(i, m);
    cc.set(palette[Math.floor(rrng() * palette.length)]);
    mesh.setColorAt(i, cc);
    data.push({
      bx: x, by: y, bz: z, x, y, z,
      phase: rrng(0, TAU), speed: rrng(.035, .105),
      ax: rrng(.03, .26), ay: rrng(.04, .32), az: rrng(.03, .26),
      qx: quat.x, qy: quat.y, qz: quat.z, qw: quat.w,
      spin: rrng(-.07, .07), s,
    });
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  paperMeshProps.push({ mesh, data });
}
createPaperField(1600, 661, 0);
createPaperField(760, 662, 1);
createPaperField(470, 663, 2);

// ── geometric motes / static dust ──────────────────────────────────────
const moteData = [];
const moteGeo = new THREE.TetrahedronGeometry(1, 0);
const moteMat = new THREE.MeshStandardMaterial({ color: 0xf1ddcd, roughness: .5, metalness: .3, emissive: 0x180403, emissiveIntensity: .25 });
const motes = new THREE.InstancedMesh(moteGeo, moteMat, 320);
motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
motes.frustumCulled = false;
motes.castShadow = false;
HALL.add(motes);
for (let i = 0; i < 320; i++) {
  const a = rr(0, TAU), rad = Math.sqrt(rnd()) * 9.5;
  moteData.push({
    bx: Math.cos(a) * rad, by: rr(1.0, 18.0), bz: Math.sin(a) * rad * .7,
    phase: rr(0, TAU), amp: rr(.03, .17), size: rr(.012, .047), speed: rr(.3, 1.4), spin: rr(0, TAU),
  });
}

// fine dust light-catching points
(function dustPoints() {
  const count = 720;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = rr(0, TAU), rad = Math.sqrt(rnd()) * 10.5;
    pos[i * 3] = Math.cos(a) * rad;
    pos[i * 3 + 1] = rr(.4, 19.2);
    pos[i * 3 + 2] = Math.sin(a) * rad * .75;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: GLOW_TEX, color: 0xc5a08d, size: .035, sizeAttenuation: true,
    transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(g, mat);
  HALL.add(points);
  // slow breathing of dust is updated in the animation loop
  window.__dustPoints = points;
})();
