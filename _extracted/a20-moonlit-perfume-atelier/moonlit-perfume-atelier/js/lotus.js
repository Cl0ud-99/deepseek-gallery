/* =========================================================================
   水晶莲花 + 双层花灵香水蒸馏工坊
   ========================================================================= */

const lotusRoot = new THREE.Group();
scene.add(lotusRoot);

const FLOOR_Y = 2.17;      // 工坊一层地面
const Y2 = 4.02;           // 二层花蕊露台

/* ------------------------------------------------------------ 材质定义 */
const petalMat = toonMat({
  color: 0xffb6d2, shade: 0x7d3f66, rim: 0xfff2fa, rimPow: 2.4, rimStr: 0.32,
  grad: 0xfff2f9, gradAmt: 0.42, vein: 0.55, emissive: 0.02, ao: 0.62,
  spec: 0xffffff, specStr: 0.35, transparent: true, opacity: 0.96, side: THREE.DoubleSide
});
const petalMatInner = toonMat({
  color: 0xffc8e0, shade: 0x8c4c76, rim: 0xfff8fd, rimPow: 2.4, rimStr: 0.34,
  grad: 0xfff8fc, gradAmt: 0.40, vein: 0.60, emissive: 0.03, ao: 0.66,
  spec: 0xffffff, specStr: 0.4, transparent: true, opacity: 0.96, side: THREE.DoubleSide
});
const goldMat = toonMat({
  color: 0xe8b96a, shade: 0x7a5218, rim: 0xffe0a8, rimPow: 2.8, rimStr: 0.26,
  spec: 0xfff0c8, specStr: 0.85, emissive: 0.05
});
const goldGlowMat = toonMat({
  color: 0xffc87a, shade: 0x8a5c1e, rim: 0xffe6b8, rimStr: 0.30,
  spec: 0xffffff, specStr: 0.8, emissive: 0.55
});
const pearlMat = toonMat({
  color: 0xf0dfe8, shade: 0x8a6f80, rim: 0xffffff, rimStr: 0.5,
  spec: 0xffffff, specStr: 0.8, emissive: 0.04
});
const shellGlass = glassMat({ color: 0xf2fbff, opacity: 0.06, spec: 2.4, irid: 0.6, side: THREE.FrontSide });
const amberGlass = glassMat({ color: 0xffc98a, opacity: 0.22, spec: 1.0, irid: 0.4 });

/* ---------------------------------------------------------------- 莲花 */
const lotusPetals = [];
(function buildLotus() {
  const rings = [
    { n: 9, len: 5.50, wid: 1.95, cup: 0.62, rise: 0.090, tilt: 0.26, y: 0.32, r0: 0.75, mat: petalMat, ph: 0.0 },
    { n: 8, len: 4.70, wid: 1.80, cup: 0.66, rise: 0.090, tilt: 0.34, y: 0.55, r0: 0.65, mat: petalMat, ph: 0.4 },
    { n: 8, len: 3.40, wid: 1.52, cup: 0.72, rise: 0.090, tilt: 0.42, y: 0.72, r0: 0.50, mat: petalMat, ph: 0.9 },
    { n: 7, len: 2.40, wid: 1.18, cup: 0.80, rise: 0.090, tilt: 0.40, y: 0.85, r0: 0.40, mat: petalMatInner, ph: 1.4 },
    { n: 6, len: 1.80, wid: 0.96, cup: 0.88, rise: 0.090, tilt: 0.35, y: 1.05, r0: 0.30, mat: petalMatInner, ph: 1.9 }
  ];

  rings.forEach((ring, ri) => {
    const geo = petalGeometry(ring.len, ring.wid, ring.cup, ring.rise, 22, 12);
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * TAU + ring.ph;
      const m = new THREE.Mesh(geo, ring.mat);
      m.rotation.order = 'YXZ';
      m.rotation.y = a;
      m.rotation.x = -ring.tilt;
      m.position.set(Math.sin(a) * ring.r0, ring.y, Math.cos(a) * ring.r0);
      m.renderOrder = 3;
      lotusRoot.add(m);
      lotusPetals.push({ mesh: m, baseX: -ring.tilt, baseY: a, phase: i * 1.7 + ri * 0.9, ring: ri });
    }
  });

  // 花心承托
  const core = new THREE.Mesh(
    lathe([[0, 0], [1.9, 0.05], [2.5, 0.45], [2.85, 0.95], [2.95, 1.30], [2.8, 1.42], [0, 1.44]], 40),
    toonMat({ color: 0xf7d7e6, shade: 0xc07ba0, rim: 0xffffff, rimStr: 0.8, emissive: 0.10 })
  );
  core.position.y = 0.62;
  lotusRoot.add(core);

  // 金色花蕊
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU + 0.12;
    const r = 3.28 + (i % 3) * 0.16;
    const h = 0.30 + Math.random() * 0.22;
    const pts = [];
    for (let j = 0; j <= 4; j++) {
      const t = j / 4;
      pts.push(new THREE.Vector3(
        Math.sin(a) * (r + t * 0.10),
        1.72 + Math.sin(t * Math.PI * 0.5) * h,
        Math.cos(a) * (r + t * 0.10)
      ));
    }
    lotusRoot.add(tubeOf(pts, 0.018, goldMat, 12, 4));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), goldGlowMat);
    tip.position.copy(pts[4]);
    lotusRoot.add(tip);
    const gl = glowSprite(0xffe0a0, 0.28, 0.30);
    gl.position.copy(pts[4]);
    lotusRoot.add(gl);
  }

  // 水面上的浮光花瓣
  for (let i = 0; i < 10; i++) {
    const a = rnd(0, TAU), r = rnd(6.9, 9.2);
    const m = new THREE.Mesh(petalGeometry(0.7, 0.36, 0.7, 0.1, 10, 6), petalMat);
    m.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r);
    m.rotation.set(-Math.PI / 2 + rnd(-0.2, 0.2), rnd(0, TAU), rnd(-0.3, 0.3));
    m.scale.setScalar(rnd(0.8, 1.3));
    lotusRoot.add(m);
  }
})();

/* ------------------------------------------------------------ 工坊外壳 */
const workshop = new THREE.Group();
lotusRoot.add(workshop);

const SHELL = [[3.00, FLOOR_Y], [3.22, 2.62], [3.42, 3.30], [3.60, Y2], [4.05, 4.72], [4.72, 5.32], [5.35, 5.72]];
function shellR(y) {
  for (let i = 0; i < SHELL.length - 1; i++) {
    const a = SHELL[i], b = SHELL[i + 1];
    if (y >= a[1] && y <= b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return SHELL[SHELL.length - 1][0];
}

(function buildShell() {
  const N = 8;
  const arc = TAU / N;
  const panelArc = arc * 0.80;

  // 玻璃花萼（八片弧形玻璃）
  for (let i = 0; i < N; i++) {
    const phiStart = i * arc + (arc - panelArc) / 2;
    const geo = lathe(SHELL, 22, phiStart, panelArc);
    const p = new THREE.Mesh(geo, shellGlass);
    p.renderOrder = 4;
    workshop.add(p);
  }

  // 金丝肋骨
  for (let i = 0; i < N; i++) {
    const a = i * arc + arc / 2;
    const pts = SHELL.map(([r, y]) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    workshop.add(tubeOf(pts, 0.040, goldMat, 60, 6));
    // 肋顶小尖
    const top = pts[pts.length - 1];
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 5), goldGlowMat);
    spike.position.copy(top).add(new THREE.Vector3(0, 0.18, 0));
    workshop.add(spike);
  }

  // 横向金环
  for (const y of [2.62, Y2, 5.72]) {
    const r = shellR(y);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.040, 6, 72), goldMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = y;
    workshop.add(ring);
  }

  // 镂空金丝藤蔓（缠绕外壳）
  for (let v = 0; v < 3; v++) {
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const y = lerp(2.30, 6.05, t);
      const a = v * 2.1 + t * TAU * 1.45;
      const r = shellR(y) + 0.10 + Math.sin(t * 12 + v) * 0.03;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    workshop.add(tubeOf(pts, 0.020, goldMat, 200, 4));
    // 藤蔓叶片
    for (let i = 6; i < 90; i += 11) {
      const p = pts[i];
      const leaf = new THREE.Mesh(petalGeometry(0.26, 0.13, 0.5, 0.1, 6, 4),
        toonMat({ color: 0xbfe8cf, shade: 0x4a7f66, rim: 0xd8fff0, rimStr: 0.7, emissive: 0.10, side: THREE.DoubleSide }));
      leaf.position.copy(p);
      leaf.rotation.set(rnd(-0.6, 0.6), rnd(0, TAU), rnd(-0.6, 0.6));
      workshop.add(leaf);
    }
    // 藤蔓花蕾
    for (let i = 18; i < 90; i += 26) {
      const p = pts[i];
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), glowMat(0xffd0e8, 0.95));
      bud.position.copy(p);
      workshop.add(bud);
      const g = glowSprite(0xffb8dc, 0.45, 0.34);
      g.position.copy(p);
      workshop.add(g);
    }
  }

  // 穹顶悬挂的水晶吊坠
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.15;
    const rr = 2.0 + (i % 3) * 0.55;
    const yy = 5.15 + (i % 4) * 0.16;
    const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.10 + (i % 3) * 0.03, 0), glowMat(i % 2 ? 0xffd9a0 : 0xa8f0ff, 0.9));
    drop.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr);
    workshop.add(drop);
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 3), goldMat);
    thread.position.set(Math.cos(a) * rr, yy + 0.32, Math.sin(a) * rr);
    workshop.add(thread);
  }

  // 顶部水晶冠
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.2;
    const h = 0.75 + (i % 3) * 0.28;
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, h, 5),
      toonMat({ color: 0xdff4ff, shade: 0x7fb8d4, rim: 0xffffff, rimStr: 0.7, spec: 0xffffff, specStr: 1.0, emissive: 0.22, transparent: true, opacity: 0.9 })
    );
    shard.position.set(Math.cos(a) * 5.22, 5.72 + h * 0.42, Math.sin(a) * 5.22);
    shard.rotation.set(rnd(-0.3, 0.3), a, rnd(-0.3, 0.3));
    workshop.add(shard);
  }
})();

/* ------------------------------------------------------------ 一层空间 */
(function buildGroundFloor() {
  // 地面
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 0.16, 56),
    toonMat({ color: 0xe6cbd9, shade: 0x8d6678, rim: 0xfff6fb, rimStr: 0.7, spec: 0xffffff, specStr: 0.5, emissive: 0.06 })
  );
  floor.position.y = FLOOR_Y - 0.08;
  workshop.add(floor);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.045, 6, 64), goldMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = FLOOR_Y;
  workshop.add(rim);

  // 地面发光镶嵌
  for (const r of [0.75, 1.35, 2.15]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 4, 64), glowMat(0xffd9a0, 0.55));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = FLOOR_Y + 0.005;
    workshop.add(ring);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.008, 0.014), glowMat(0xffd9a0, 0.4));
    bar.position.set(Math.cos(a) * 1.75, FLOOR_Y + 0.005, Math.sin(a) * 1.75);
    bar.rotation.y = -a;
    workshop.add(bar);
  }

  /* ---------------- 螺旋玻璃香水蒸馏器 ---------------- */
  const still = new THREE.Group();
  still.position.y = FLOOR_Y;
  workshop.add(still);

  // 三足金座
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const t = j / 6;
      pts.push(new THREE.Vector3(
        Math.cos(a) * (0.95 - t * 0.62) * (1 + Math.sin(t * 2.2) * 0.10),
        0.02 + t * 0.40,
        Math.sin(a) * (0.95 - t * 0.62) * (1 + Math.sin(t * 2.2) * 0.10)
      ));
    }
    still.add(tubeOf(pts, 0.035, goldMat, 16, 5));
  }
  const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 24), goldMat);
  cradle.rotation.x = -Math.PI / 2;
  cradle.position.y = 0.42;
  still.add(cradle);

  // 中央玻璃球
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.52, 26, 20), amberGlass);
  bulb.position.y = 0.92;
  bulb.renderOrder = 6;
  still.add(bulb);
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 22, 16, 0, TAU, Math.PI * 0.36, Math.PI * 0.64),
    toonMat({ color: 0xff9f2e, shade: 0xc05a12, rim: 0xffe2a0, rimStr: 1.0, emissive: 0.55, transparent: true, opacity: 0.95 })
  );
  liquid.position.y = 0.92;
  still.add(liquid);
  const bulbGlow = glowSprite(0xffa53c, 1.2, 0.16);
  bulbGlow.position.y = 0.92;
  still.add(bulbGlow);

  // 螺旋玻璃管 + 内部流动花露
  const helix = helixPts(0.74, 0.42, 1.75, 2.3, 150);
  const helixCurve = new THREE.CatmullRomCurve3(helix);
  const glassTube = new THREE.Mesh(new THREE.TubeGeometry(helixCurve, 200, 0.072, 8, false), glassMat({ color: 0xffe0b0, opacity: 0.34, spec: 1.6, irid: 0.6 }));
  glassTube.renderOrder = 6;
  still.add(glassTube);
  const juiceTube = new THREE.Mesh(
    new THREE.TubeGeometry(helixCurve, 200, 0.040, 6, false),
    toonMat({ color: 0xffab3a, shade: 0xd06a10, rim: 0xfff0c8, rimStr: 0.6, emissive: 1.05 })
  );
  still.add(juiceTube);

  // 冷凝器
  const cond = helixPts(0.30, 1.75, 2.02, 2.0, 80);
  still.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cond), 90, 0.040, 6, false),
    glassMat({ color: 0xd8f0ff, opacity: 0.34, spec: 1.2 })));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 10), goldMat);
  cap.position.y = 2.06;
  still.add(cap);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), goldGlowMat);
  finial.position.y = 2.26;
  still.add(finial);

  // 出液口（滴落金色花露）
  const spoutPts = [
    new THREE.Vector3(0.28, 1.98, 0),
    new THREE.Vector3(0.72, 1.90, 0.10),
    new THREE.Vector3(0.95, 1.62, 0.18),
    new THREE.Vector3(0.95, 1.42, 0.18)
  ];
  still.add(tubeOf(spoutPts, 0.032, goldMat, 30, 6));
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 6), goldGlowMat);
  nozzle.position.copy(spoutPts[3]);
  nozzle.rotation.x = Math.PI;
  still.add(nozzle);
  const dropGlow = glowSprite(0xffc46a, 0.38, 0.55);
  dropGlow.position.copy(spoutPts[3]).add(new THREE.Vector3(0, -0.06, 0));
  still.add(dropGlow);

  // 承接的小水晶瓶
  const vial = new THREE.Mesh(
    lathe([[0, 0], [0.20, 0.0], [0.22, 0.05], [0.20, 0.34], [0.10, 0.44], [0.09, 0.50], [0.13, 0.55], [0.13, 0.60], [0, 0.60]], 20),
    glassMat({ color: 0xffd9a8, opacity: 0.30, spec: 1.2 })
  );
  vial.position.set(0.95, 0.0, 0.18);
  vial.renderOrder = 7;
  still.add(vial);
  const vialLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.20, 16), toonMat({ color: 0xffb347, shade: 0xc05a12, rim: 0xffe2a0, emissive: 1.2 }));
  vialLiquid.position.set(0.95, 0.11, 0.18);
  still.add(vialLiquid);

  // 冒泡
  const bubbles = makePoints(28, { color: 0xffd08a, size: 0.055 });
  const bp = bubbles.geometry.attributes.position;
  for (let i = 0; i < 28; i++) {
    const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 0.38;
    bp.setXYZ(i, Math.cos(a) * r, 0.60 + Math.random() * 0.62, Math.sin(a) * r);
  }
  still.add(bubbles);
  still.userData.bubbles = bubbles;

  /* ---------------- 环形陈列台 ---------------- */
  const counter = new THREE.Group();
  workshop.add(counter);
  const cBase = new THREE.Mesh(new THREE.CylinderGeometry(2.06, 2.06, 0.26, 48, 1, true), goldMat);
  cBase.position.y = FLOOR_Y + 0.13;
  counter.add(cBase);
  const cTop = new THREE.Mesh(new THREE.RingGeometry(1.30, 2.06, 56), toonMat({
    color: 0xe8cda8, shade: 0x8a6438, rim: 0xfff8e8, rimStr: 0.8, spec: 0xffffff, specStr: 0.8, emissive: 0.10, side: THREE.DoubleSide
  }));
  cTop.rotation.x = -Math.PI / 2;
  cTop.position.y = FLOOR_Y + 0.265;
  counter.add(cTop);
  for (const r of [1.30, 2.06]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.030, 6, 56), goldMat);
    t.rotation.x = -Math.PI / 2;
    t.position.y = FLOOR_Y + 0.265;
    counter.add(t);
  }

  // 数百只微型琉璃香水瓶
  const bottleGeo = lathe([[0, 0], [0.085, 0], [0.095, 0.02], [0.095, 0.15], [0.055, 0.21], [0.048, 0.25], [0.062, 0.275], [0.05, 0.30], [0, 0.30]], 10);
  const bottleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 0.15, roughness: 0.10, transparent: true, opacity: 0.95,
    emissive: 0x553311, emissiveIntensity: 0.30
  });
  const BN = 380;
  const bottles = new THREE.InstancedMesh(bottleGeo, bottleMat, BN);
  const pal = [0xff8fc4, 0x4fc0ea, 0xffc44f, 0x9a7cf5, 0x45d69a, 0xff7f96, 0xfff0dc, 0xffa14f];
  const dm = new THREE.Object3D();
  for (let i = 0; i < BN; i++) {
    const a = rnd(0, TAU);
    const r = rnd(1.38, 1.98);
    const s = rnd(0.7, 1.5);
    dm.position.set(Math.cos(a) * r, FLOOR_Y + 0.27, Math.sin(a) * r);
    dm.rotation.set(0, rnd(0, TAU), 0);
    dm.scale.set(s, s * rnd(0.85, 1.4), s);
    dm.updateMatrix();
    bottles.setMatrixAt(i, dm.matrix);
    bottles.setColorAt(i, new THREE.Color(pick(pal)));
  }
  bottles.instanceMatrix.needsUpdate = true;
  counter.add(bottles);

  // 柜台上的光点
  for (let i = 0; i < 14; i++) {
    const a = rnd(0, TAU), r = rnd(1.4, 1.95);
    const g = glowSprite(pick([0xffd9f0, 0xa8e8ff, 0xffe6a8, 0xc8b4ff]), 0.38, 0.32);
    g.position.set(Math.cos(a) * r, FLOOR_Y + 0.42, Math.sin(a) * r);
    counter.add(g);
  }

  /* ---------------- 银盘花瓣 ---------------- */
  const trayMat = toonMat({ color: 0xe8eef2, shade: 0x8b9aa4, rim: 0xffffff, rimStr: 1.0, spec: 0xffffff, specStr: 1.3 });
  const petalSmall = petalGeometry(0.16, 0.10, 0.9, 0.15, 6, 4);
  const petalRose = toonMat({ color: 0xffc2d8, shade: 0xd06a92, rim: 0xfff0f6, rimStr: 0.7, emissive: 0.12, side: THREE.DoubleSide });
  const petalJas = toonMat({ color: 0xfff6e8, shade: 0xd9c3a8, rim: 0xffffff, rimStr: 0.7, emissive: 0.12, side: THREE.DoubleSide });
  [[1.55, -1.35], [-1.70, -0.95], [-0.30, 1.95]].forEach(([x, z], ti) => {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.26, 0.04, 20), trayMat);
    tray.position.set(x, FLOOR_Y + 0.28, z);
    workshop.add(tray);
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(petalSmall, ti === 2 ? petalJas : petalRose);
      const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 0.22;
      p.position.set(x + Math.cos(a) * r, FLOOR_Y + 0.30 + Math.random() * 0.07, z + Math.sin(a) * r);
      p.rotation.set(-Math.PI / 2 + rnd(-0.6, 0.6), rnd(0, TAU), rnd(-0.5, 0.5));
      workshop.add(p);
    }
  });

  /* ---------------- 金色天平 ---------------- */
  const scale = new THREE.Group();
  scale.position.set(-1.62, FLOOR_Y + 0.27, 1.02);
  workshop.add(scale);
  const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.05, 16), goldMat);
  scale.add(sBase);
  const sPost = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.60, 8), goldMat);
  sPost.position.y = 0.32;
  scale.add(sPost);
  const beam = new THREE.Group();
  beam.position.y = 0.62;
  scale.add(beam);
  const beamBar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.026, 0.026), goldMat);
  beam.add(beamBar);
  const sKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), goldGlowMat);
  sKnob.position.y = 0.04;
  beam.add(sKnob);
  for (const sx of [-1, 1]) {
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.018, 16), goldMat);
    pan.position.set(sx * 0.34, -0.30, 0);
    beam.add(pan);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      const th = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.30, 3), goldMat);
      th.position.set(sx * 0.34 + Math.cos(a) * 0.10, -0.15, Math.sin(a) * 0.10);
      beam.add(th);
    }
  }
  scale.userData.beam = beam;
})();

/* ------------------------------------------------------------ 二层露台 */
(function buildUpperFloor() {
  // C 形花蕊露台（留出正面缺口以便俯瞰一层）
  const deckGeo = new THREE.RingGeometry(1.55, 2.92, 64, 1, Math.PI * 0.22, Math.PI * 1.56);
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(deckGeo, toonMat({
    color: 0xe2c6d6, shade: 0x8a6072, rim: 0xfff8fd, rimStr: 0.7, spec: 0xffffff, specStr: 0.6, emissive: 0.06, side: THREE.DoubleSide
  }));
  deck.position.y = Y2;
  deck.rotation.y = -Math.PI / 2;
  workshop.add(deck);

  const edgeGeo = new THREE.RingGeometry(2.86, 2.94, 64, 1, Math.PI * 0.22, Math.PI * 1.56);
  edgeGeo.rotateX(-Math.PI / 2);
  const edge = new THREE.Mesh(edgeGeo, goldMat);
  edge.position.y = Y2 + 0.01;
  edge.rotation.y = -Math.PI / 2;
  workshop.add(edge);

  const innerEdge = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.028, 6, 48, Math.PI * 1.56), goldMat);
  innerEdge.rotation.x = -Math.PI / 2;
  innerEdge.rotation.z = -Math.PI * 0.22;
  innerEdge.position.y = Y2 + 0.01;
  workshop.add(innerEdge);

  // 栏杆
  const railR = 2.80;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(railR, 0.022, 5, 60, Math.PI * 1.52), goldMat);
  rail.rotation.x = -Math.PI / 2;
  rail.rotation.z = Math.PI * 0.24;
  rail.position.y = Y2 + 0.44;
  workshop.add(rail);
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * 0.26 + (i / 21) * Math.PI * 1.48;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 4), goldMat);
    post.position.set(Math.cos(a) * railR, Y2 + 0.22, -Math.sin(a) * railR);
    workshop.add(post);
  }

  // 螺旋楼梯
  const stair = new THREE.Group();
  workshop.add(stair);
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = -0.4 + t * Math.PI * 1.35;
    const r = 2.88 - t * 0.06;
    const y = lerp(FLOOR_Y + 0.10, Y2 + 0.02, t);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.30), pearlMat);
    st.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    st.rotation.y = -a;
    stair.add(st);
    if (i % 2 === 0) {
      const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 3), goldMat);
      bal.position.set(Math.cos(a) * (r - 0.18), y + 0.20, Math.sin(a) * (r - 0.18));
      stair.add(bal);
    }
  }
  const handrail = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = -0.4 + t * Math.PI * 1.35;
    const r = 2.88 - t * 0.06;
    handrail.push(new THREE.Vector3(Math.cos(a) * (r - 0.18), lerp(FLOOR_Y + 0.48, Y2 + 0.40, t), Math.sin(a) * (r - 0.18)));
  }
  stair.add(tubeOf(handrail, 0.014, goldMat, 60, 4));

  /* ---------------- 花瓣贵妃榻 ---------------- */
  const chaise = new THREE.Group();
  chaise.position.set(0.15, Y2 + 0.02, -1.95);
  chaise.rotation.y = 0.55;
  workshop.add(chaise);
  const velvet = toonMat({ color: 0xe8a7c6, shade: 0x8d4a6c, rim: 0xffd9ea, rimStr: 0.8, spec: 0xffe6f2, specStr: 0.8, emissive: 0.10, side: THREE.DoubleSide });
  const seat = new THREE.Mesh(petalGeometry(1.55, 0.62, 1.1, 0.35, 16, 10), velvet);
  seat.rotation.set(-Math.PI * 0.46, 0, 0);
  seat.position.set(0, 0.30, -0.1);
  chaise.add(seat);
  const back = new THREE.Mesh(petalGeometry(0.95, 0.55, 1.3, 0.6, 14, 10), velvet);
  back.rotation.set(-Math.PI * 0.12, 0, 0);
  back.position.set(0, 0.34, -0.75);
  chaise.add(back);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.30, 6), goldMat);
      leg.position.set(sx * 0.34, 0.15, sz * 0.38);
      leg.rotation.z = sx * 0.10;
      chaise.add(leg);
    }
  }
  const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), velvet);
  cushion.scale.set(1.2, 0.7, 0.9);
  cushion.position.set(0.1, 0.42, -0.45);
  chaise.add(cushion);

  /* ---------------- 竖琴 ---------------- */
  const harp = new THREE.Group();
  harp.position.set(-2.05, Y2 + 0.02, 0.55);
  harp.rotation.y = 1.15;
  workshop.add(harp);
  const harpPts = [
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.02, 0.55, 0),
    new THREE.Vector3(0.16, 1.05, 0), new THREE.Vector3(0.52, 1.30, 0)
  ];
  harp.add(tubeOf(harpPts, 0.036, goldMat, 30, 6));
  const pillar = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.30, 0.10, 0), new THREE.Vector3(0.50, 0.70, 0), new THREE.Vector3(0.52, 1.30, 0)];
  harp.add(tubeOf(pillar, 0.030, goldMat, 30, 6));
  const soundboard = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.28, 0.20), pearlMat);
  soundboard.position.set(0.03, 0.64, 0);
  harp.add(soundboard);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const y = 0.22 + t * 1.02;
    const x = lerp(0.12, 0.44, t);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.30 + t * 0.55, 3), glowMat(0xfff0c8, 0.85));
    str.position.set(x, y + 0.15, 0);
    str.rotation.z = -0.12;
    harp.add(str);
  }

  /* ---------------- 蛛网挂毯 ---------------- */
  const web = new THREE.Group();
  web.position.set(1.95, Y2 + 0.02, 1.35);
  web.rotation.y = -0.85;
  workshop.add(web);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.10, 6), goldMat);
    post.position.set(sx * 0.55, 0.55, 0);
    web.add(post);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), goldGlowMat);
    knob.position.set(sx * 0.55, 1.12, 0);
    web.add(knob);
  }
  const webPts = [];
  const spokes = 9;
  const cx = 0, cy = 0.66, R = 0.52;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU;
    webPts.push(cx, cy, 0, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.95, 0);
  }
  for (let ringI = 1; ringI <= 4; ringI++) {
    const rr = (ringI / 4) * R;
    for (let i = 0; i < spokes; i++) {
      const a0 = (i / spokes) * TAU, a1 = ((i + 1) / spokes) * TAU;
      webPts.push(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr * 0.95, 0,
        cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr * 0.95, 0);
    }
  }
  const webGeo = new THREE.BufferGeometry();
  webGeo.setAttribute('position', new THREE.Float32BufferAttribute(webPts, 3));
  const webLines = new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({
    color: 0xd8f4ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  web.add(webLines);
  for (let i = 0; i < 12; i++) {
    const a = rnd(0, TAU), rr = rnd(0.2, 0.5);
    const dew = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.018, 0.034), 6, 5),
      toonMat({ color: 0xffffff, shade: 0x9fd8f0, rim: 0xffffff, rimStr: 1.4, spec: 0xffffff, specStr: 1.4, emissive: 0.35 }));
    dew.position.set(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.95, 0.02);
    web.add(dew);
  }

  /* ---------------- 萤火虫玻璃吊灯 ---------------- */
  const lamp = new THREE.Group();
  lamp.position.set(0, 5.20, 0);
  workshop.add(lamp);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.90, 4), goldMat);
  chain.position.y = 0.55;
  lamp.add(chain);
  const cage = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), glassMat({ color: 0xffe6b8, opacity: 0.20, spec: 1.2 }));
  lamp.add(cage);
  const cageRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.018, 5, 24), goldMat);
  cageRing.rotation.x = -Math.PI / 2;
  lamp.add(cageRing);
  const cageRing2 = cageRing.clone();
  cageRing2.rotation.x = 0;
  lamp.add(cageRing2);
  const cageCap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 8), goldMat);
  cageCap.position.y = 0.48;
  lamp.add(cageCap);
  const fireflies = makePoints(26, { color: 0xffd27f, size: 0.10 });
  const fp = fireflies.geometry.attributes.position;
  for (let i = 0; i < 26; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(0.05, 0.36));
    fp.setXYZ(i, v.x, v.y, v.z);
  }
  lamp.add(fireflies);
  lamp.userData.fireflies = fireflies;
  const lampGlow = glowSprite(0xffc46a, 1.9, 0.26);
  lamp.add(lampGlow);
  workshop.userData.lampGlow = lampGlow;
})();

/* ------------------------------------------------------------ 悬浮月露珠 */
const moonPearl = new THREE.Group();
moonPearl.position.set(0, 6.95, 0);
workshop.add(moonPearl);
(function buildPearl() {
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20, 1),
    toonMat({ color: 0xffffff, shade: 0xa8d8f0, rim: 0xffffff, rimStr: 1.6, spec: 0xffffff, specStr: 1.6, emissive: 1.6, transparent: true, opacity: 0.95 }));
  moonPearl.add(core);
  const halo = glowSprite(0xbfe8ff, 2.2, 0.24);
  moonPearl.add(halo);
  const halo2 = glowSprite(0xffe0b0, 1.5, 0.18);
  moonPearl.add(halo2);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42 + i * 0.13, 0.008, 3, 48), glowMat(0xd8f4ff, 0.5));
    ring.rotation.set(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU));
    moonPearl.add(ring);
  }
})();

/* 工坊暖光晕 */
(function workshopGlow() {
  const g1 = glowSprite(0xffb45e, 7.5, 0.07);
  g1.position.set(0, 3.3, 0);
  workshop.add(g1);
  const g3 = glowSprite(0xffa552, 5.0, 0.08);
  g3.position.set(0, 4.9, 0);
  workshop.add(g3);
  const g2 = glowSprite(0xffd9a0, 5.0, 0.06);
  g2.position.set(0, 2.6, 0);
  workshop.add(g2);
})();
