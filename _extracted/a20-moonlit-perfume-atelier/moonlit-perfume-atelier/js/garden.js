/* =========================================================================
   妖精秘境：蝶翼风车 / 铃兰铜管 / 王莲步道 / 蒲公英灯 / 藤蔓彩窗拱桥 / 天鹅船 / 紫藤花瀑
   ========================================================================= */

const gardenRoot = new THREE.Group();
scene.add(gardenRoot);

const texWing = wingTexture(1, 0, 0);
const wingMat = new THREE.MeshBasicMaterial({
  map: texWing, transparent: true, alphaTest: 0.03, side: THREE.DoubleSide,
  blending: THREE.NormalBlending, depthWrite: false, opacity: 0.96
});
const wingMatSolid = new THREE.MeshBasicMaterial({
  map: texWing, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, depthWrite: false, opacity: 0.92
});

/* ------------------------------------------------------- 蓝闪蝶翼旋转风车 */
const windmill = new THREE.Group();
windmill.position.set(-8.15, 0, -2.45);
gardenRoot.add(windmill);

(function buildWindmill() {
  const poleMat = toonMat({ color: 0xe6f2f0, shade: 0x7d9aa2, rim: 0xd8fff8, rimStr: 0.8, spec: 0xffffff, specStr: 0.6, emissive: 0.05 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.24, 5.30, 10), poleMat);
  pole.position.y = 2.65;
  windmill.add(addOutline(pole, 1.04, 0x123040));

  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16 + i * 0.005, 0.025, 5, 16), goldMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.5 + i * 1.1;
    windmill.add(ring);
  }
  // 底座藤蔓
  const vine = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = t * TAU * 1.6;
    vine.push(new THREE.Vector3(Math.cos(a) * (0.28 - t * 0.12), t * 1.4, Math.sin(a) * (0.28 - t * 0.12)));
  }
  windmill.add(tubeOf(vine, 0.022, goldMat, 60, 4));

  // 轮盘
  const wheel = new THREE.Group();
  wheel.position.set(0, 5.05, 0);
  wheel.rotation.y = 0.34;
  windmill.add(wheel);
  windmill.userData.wheel = wheel;

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.26, 12), goldMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  const hubGlow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), glowMat(0x9fe8ff, 0.95));
  hubGlow.position.z = 0.16;
  wheel.add(hubGlow);
  const hubHalo = glowSprite(0x8fe0ff, 1.6, 0.55);
  hubHalo.position.z = 0.2;
  wheel.add(hubHalo);

  // 一对巨大蝶翼
  for (let i = 0; i < 2; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = i * Math.PI;
    wheel.add(arm);
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(3.30, 3.30), wingMatSolid);
    blade.geometry.translate(1.68, 0, 0);
    blade.rotation.x = 0.30;
    blade.position.z = 0.10;
    blade.renderOrder = 12;
    arm.add(blade);
    // 翼骨
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.012, 3.1, 5), goldMat);
    bone.rotation.z = -Math.PI / 2;
    bone.position.set(1.55, 0, 0.12);
    arm.add(bone);
    for (let k = 1; k <= 3; k++) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.9, 4), goldGlowMat);
      rib.position.set(0.5 + k * 0.42, 0.42 - k * 0.14, 0.12);
      rib.rotation.z = -1.15 + k * 0.12;
      arm.add(rib);
    }
  }

  // 小灯笼
  const lantern = new THREE.Group();
  lantern.position.set(0, 3.55, 0.34);
  windmill.add(lantern);
  const lbody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glassMat({ color: 0xffd9a0, opacity: 0.35, spec: 1.2 }));
  lantern.add(lbody);
  const lcore = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glowMat(0xffc46a, 1));
  lantern.add(lcore);
  const lhalo = glowSprite(0xffc46a, 1.3, 0.6);
  lantern.add(lhalo);
})();

/* ------------------------------------------------- 巨型铃兰 + 金色螺旋铜管 */
const dewSources = [];
const lilyRoot = new THREE.Group();
lilyRoot.position.set(6.35, 0, -5.85);
gardenRoot.add(lilyRoot);

(function buildLily() {
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1),
    toonMat({ color: 0x3d7f5f, shade: 0x16402c, rim: 0xa8ffd0, rimStr: 0.3, emissive: 0.05 }));
  rock.scale.set(1, 0.55, 1);
  rock.position.y = 0.05;
  lilyRoot.add(addOutline(rock, 1.03, 0x0a2018));

  const stemMat = toonMat({ color: 0xc9f0d8, shade: 0x4e7f66, rim: 0xd8fff0, rimStr: 0.8, emissive: 0.10 });
  const bellMat = toonMat({
    color: 0xfdf3fa, shade: 0xb99ab8, rim: 0xffe8f8, rimPow: 2.2, rimStr: 0.3,
    grad: 0xfff4fb, gradAmt: 0.55, emissive: 0.10, transparent: true, opacity: 0.94, side: THREE.DoubleSide
  });

  const bellProfile = [[0, 0], [0.05, -0.02], [0.10, -0.09], [0.15, -0.20], [0.19, -0.31], [0.20, -0.39], [0.185, -0.41]];
  const bellGeo = lathe(bellProfile, 14);

  const stems = [
    { ang: 0.2, h: 2.55, lean: 0.55 },
    { ang: 2.5, h: 2.15, lean: 0.45 },
    { ang: 4.4, h: 2.75, lean: 0.62 }
  ];
  stems.forEach((s, si) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(new THREE.Vector3(
        Math.cos(s.ang) * (0.2 + s.lean * t * t) + Math.sin(t * 5 + si) * 0.03,
        t * s.h,
        Math.sin(s.ang) * (0.2 + s.lean * t * t)
      ));
    }
    lilyRoot.add(tubeOf(pts, 0.035, stemMat, 30, 6));

    // 顶端铃兰串
    const tip = pts[10];
    const nBells = 6;
    for (let b = 0; b < nBells; b++) {
      const t = b / (nBells - 1);
      const hang = new THREE.Group();
      hang.position.set(
        tip.x + Math.cos(s.ang + 1.2) * (0.10 + t * 0.34) + Math.sin(b * 2.1) * 0.06,
        tip.y - t * 0.62 + 0.10,
        tip.z + Math.sin(s.ang + 1.2) * (0.10 + t * 0.34)
      );
      hang.rotation.z = rnd(-0.22, 0.22);
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.scale.setScalar(rnd(1.15, 1.65));
      hang.add(bell);
      const gl = glowSprite(0xffe0f0, 0.75, 0.45);
      gl.position.y = -0.2;
      hang.add(gl);
      lilyRoot.add(hang);
      if (si === 0 && b === nBells - 1) {
        hang.updateWorldMatrix(true, false);
        const wp = new THREE.Vector3();
        bell.getWorldPosition(wp);
        wp.y -= 0.36;
        dewSources.push(wp.clone());
      }
    }
  });

  // 金色螺旋铜管（从铃兰引向工坊）
  const path = [
    new THREE.Vector3(0.35, 1.95, 0.15),
    new THREE.Vector3(-0.5, 2.85, 0.55),
    new THREE.Vector3(-1.85, 3.75, 1.25),
    new THREE.Vector3(-3.35, 4.05, 2.05),
    new THREE.Vector3(-4.15, 3.75, 2.55)
  ];
  lilyRoot.add(coilOf(path, 0.13, 15, 0.024, goldMat, 300));

  // 铜管支撑
  for (let i = 1; i <= 2; i++) {
    const p = path[i];
    const leg = tubeOf([
      new THREE.Vector3(p.x, p.y - 0.2, p.z),
      new THREE.Vector3(p.x + 0.1, p.y - 1.0, p.z + 0.1),
      new THREE.Vector3(p.x + 0.15, 0.0, p.z + 0.15)
    ], 0.022, goldMat, 20, 4);
    lilyRoot.add(leg);
  }
})();

/* --------------------------------------------------------- 巨型王莲步道 */
const leafBoats = [];
(function buildLeafWalk() {
  const spots = [
    [0.20, 8.20, 1.55],
    [-2.05, 7.80, 1.45],
    [-4.20, 7.15, 1.60],
    [-6.35, 6.55, 1.35],
    [-8.30, 5.55, 1.15]
  ];
  const leafMat = toonMat({
    color: 0x2f8a58, shade: 0x14432c, rim: 0x9fffc0, rimPow: 2.2, rimStr: 0.28,
    spec: 0xccffe0, specStr: 0.55, emissive: 0.06, side: THREE.DoubleSide
  });
  const profile = [[0, 0.00], [0.35, 0.01], [0.7, 0.02], [0.9, 0.045], [0.98, 0.09], [1.0, 0.16], [1.02, 0.22]];

  spots.forEach(([x, z, s], idx) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);
    g.rotation.y = rnd(0, TAU);
    gardenRoot.add(g);

    const geo = lathe(profile, 40);
    geo.scale(s, s, s);
    const leaf = new THREE.Mesh(geo, leafMat);
    g.add(leaf);

    // 叶脉
    const veinPts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      veinPts.push(0, 0.03, 0, Math.cos(a) * s * 0.95, 0.055 * s, Math.sin(a) * s * 0.95);
    }
    const vg = new THREE.BufferGeometry();
    vg.setAttribute('position', new THREE.Float32BufferAttribute(veinPts, 3));
    g.add(new THREE.LineSegments(vg, new THREE.LineBasicMaterial({
      color: 0xcfffe4, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false
    })));

    const rim = new THREE.Mesh(new THREE.TorusGeometry(s * 1.0, 0.018, 4, 48), glowMat(0x9fffd0, 0.45));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = s * 0.20;
    g.add(rim);

    // 叶片上的小灯
    if (idx % 2 === 0) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glowMat(0xd8fff0, 0.95));
      lamp.position.set(s * 0.35, s * 0.30, s * 0.2);
      g.add(lamp);
      const gh = glowSprite(0xa8ffe0, 1.1, 0.55);
      gh.position.copy(lamp.position);
      g.add(gh);
    }
    leafBoats.push({ obj: g, baseY: 0.05, phase: rnd(0, TAU) });
  });
})();

/* ------------------------------------------------------- 巨型蒲公英绒球灯 */
const dandelion = new THREE.Group();
dandelion.position.set(-8.55, 0, 2.55);
gardenRoot.add(dandelion);

(function buildDandelion() {
  const stemMat = toonMat({ color: 0xd8f0e0, shade: 0x6b8f7c, rim: 0xe8fff0, rimStr: 0.7, emissive: 0.12 });
  const pts = [
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 0.9, -0.05),
    new THREE.Vector3(0.05, 1.85, 0.05), new THREE.Vector3(-0.10, 2.45, 0.10)
  ];
  dandelion.add(tubeOf(pts, 0.038, stemMat, 30, 6));
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(petalGeometry(0.9, 0.22, 0.5, 0.2, 8, 5), stemMat);
    leaf.position.set(rnd(-0.1, 0.1), 0.1, rnd(-0.1, 0.1));
    leaf.rotation.set(rnd(-0.5, 0.1), (i / 3) * TAU, rnd(-0.3, 0.3));
    dandelion.add(leaf);
  }

  const head = new THREE.Group();
  head.position.set(-0.10, 2.62, 0.10);
  dandelion.add(head);
  dandelion.userData.head = head;

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), glowMat(0xfff2c8, 0.95));
  head.add(core);
  const coreGlow = glowSprite(0xffe8b0, 2.6, 0.55);
  head.add(coreGlow);

  const filPts = [];
  const tipPos = [];
  const N = 90;
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.75 + 0.12;
    v.normalize();
    const L = 0.95 + Math.random() * 0.35;
    filPts.push(v.x * 0.16, v.y * 0.16, v.z * 0.16, v.x * L, v.y * L, v.z * L);
    tipPos.push(v.x * L * 1.03, v.y * L * 1.03, v.z * L * 1.03);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(filPts, 3));
  head.add(new THREE.LineSegments(fg, new THREE.LineBasicMaterial({
    color: 0xfff4d8, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false
  })));

  const tips = makePoints(N, { color: 0xfff0c0, size: 0.10 });
  const tp = tips.geometry.attributes.position;
  for (let i = 0; i < N; i++) tp.setXYZ(i, tipPos[i * 3], tipPos[i * 3 + 1], tipPos[i * 3 + 2]);
  head.add(tips);
  dandelion.userData.tips = tips;
})();

/* ------------------------------------------------ 树藤 + 彩绘玻璃精灵拱桥 */
(function buildBridge() {
  const A = new THREE.Vector3(4.95, 0.10, 7.85);
  const B = new THREE.Vector3(1.95, 0.10, 8.55);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const peak = 1.85;

  const bridge = new THREE.Group();
  gardenRoot.add(bridge);

  const archPoint = (t, yOff = 0) => new THREE.Vector3().lerpVectors(A, B, t)
    .add(new THREE.Vector3(0, Math.sin(t * Math.PI) * peak + yOff, 0));

  // 主拱藤
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(archPoint(t).addScaledVector(side, s * 0.50));
    }
    bridge.add(tubeOf(pts, 0.055, toonMat({ color: 0x9d8b66, shade: 0x4a3a24, rim: 0xd8ffe0, rimStr: 0.25, emissive: 0.05 }), 50, 6));
    // 缠绕的细藤
    const coilPts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const p = archPoint(t).addScaledVector(side, s * 0.50);
      coilPts.push(p.clone().add(new THREE.Vector3(0, Math.sin(t * TAU * 6) * 0.06, 0)).addScaledVector(side, Math.cos(t * TAU * 6) * 0.06));
    }
    bridge.add(tubeOf(coilPts, 0.016, goldMat, 90, 4));
  }

  // 桥面（连续曲面）
  const NSEG = 24;
  const dpos = [], didx = [], duv = [];
  for (let i = 0; i <= NSEG; i++) {
    const t = i / NSEG;
    const p = archPoint(t, 0.04);
    dpos.push(p.x - side.x * 0.52, p.y, p.z - side.z * 0.52);
    dpos.push(p.x + side.x * 0.52, p.y, p.z + side.z * 0.52);
    duv.push(0, t * 6, 1, t * 6);
  }
  for (let i = 0; i < NSEG; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    didx.push(a, c, b, b, c, d);
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3));
  dgeo.setAttribute('uv', new THREE.Float32BufferAttribute(duv, 2));
  dgeo.setIndex(didx);
  dgeo.computeVertexNormals();
  const deckMesh = new THREE.Mesh(dgeo, toonMat({
    color: 0xd8bfa0, shade: 0x6b5236, rim: 0xfff0d0, rimStr: 0.5, spec: 0xfff8e8, specStr: 0.4, emissive: 0.05, side: THREE.DoubleSide
  }));
  bridge.add(deckMesh);

  // 桥板纹路
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const p = archPoint(t, 0.065);
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.012, 0.03), toonMat({ color: 0x9a7a56, shade: 0x4a3520, rim: 0xc9a87e, rimStr: 0.3 }));
    line.position.copy(p);
    line.rotation.y = Math.atan2(dir.x, dir.z);
    bridge.add(line);
  }

  // 彩绘玻璃栏板
  const glassPanel = new THREE.MeshBasicMaterial({
    map: stainedTex, transparent: true, opacity: 0.72, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.NormalBlending
  });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const t = 0.12 + i * 0.25;
      const p = archPoint(t, 0.52).addScaledVector(side, s * 0.50);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.62), glassPanel);
      panel.position.copy(p);
      panel.rotation.y = Math.atan2(side.x * s, side.z * s);
      panel.renderOrder = 11;
      bridge.add(panel);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.045, 0.045), goldMat);
      frame.position.copy(p).add(new THREE.Vector3(0, 0.34, 0));
      frame.rotation.y = panel.rotation.y;
      bridge.add(frame);
      const frame2 = frame.clone();
      frame2.position.copy(p).add(new THREE.Vector3(0, -0.34, 0));
      bridge.add(frame2);
    }
  }

  // 桥头灯与花
  for (const s of [-1, 1]) {
    const p = archPoint(s > 0 ? 0 : 1, 0.85).addScaledVector(side, s * 0.52);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.85, 6), goldMat);
    post.position.copy(p).add(new THREE.Vector3(0, -0.42, 0));
    bridge.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), glowMat(0xffd08a, 0.95));
    lamp.position.copy(p);
    bridge.add(lamp);
    const gh = glowSprite(0xffc46a, 0.9, 0.42);
    gh.position.copy(p);
    bridge.add(gh);
  }

  // 桥上小花
  for (let i = 0; i < 16; i++) {
    const t = Math.random();
    const p = archPoint(t, 0.10).addScaledVector(side, rnd(-0.55, 0.55));
    const f = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.04, 0.07), 6, 5), glowMat(pick([0xffc2e0, 0xc8f0ff, 0xfff0c0]), 0.9));
    f.position.copy(p);
    bridge.add(f);
  }
})();

/* --------------------------------------------------------- 桥头苔石小岛 */
(function buildIslet() {
  const rockMat = toonMat({ color: 0x35705a, shade: 0x143528, rim: 0x8fe8b8, rimStr: 0.25, spec: 0x9fe8cc, specStr: 0.2, emissive: 0.02 });
  const g = new THREE.Group();
  g.position.set(1.95, 0, 8.55);
  gardenRoot.add(g);

  const base = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), rockMat);
  base.scale.set(1.15, 0.55, 1.05);
  base.position.y = 0.10;
  g.add(addOutline(base, 1.03, 0x081c18));

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 1.0, 0.16, 14), rockMat);
  top.position.y = 0.42;
  g.add(top);

  for (let i = 0; i < 22; i++) {
    const a = rnd(0, TAU), r = rnd(0, 0.85);
    const s = rnd(0.06, 0.15);
    const t = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 5), toonMat({ color: 0x2c6b4b, shade: 0x0a2116, rim: 0x7bffb8, rimStr: 0.5 }));
    t.position.set(Math.cos(a) * r, 0.48, Math.sin(a) * r);
    t.scale.y = 0.6;
    g.add(t);
  }
  // 小灯笼柱
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.85, 6), goldMat);
  post.position.set(0.42, 0.85, -0.1);
  g.add(post);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), glowMat(0xffd08a, 0.95));
  lamp.position.set(0.42, 1.34, -0.1);
  g.add(lamp);
  const lh = glowSprite(0xffc46a, 1.8, 0.32);
  lh.position.copy(lamp.position);
  g.add(lh);
  for (let i = 0; i < 10; i++) {
    const a = rnd(0, TAU), r = rnd(0.15, 0.8);
    const f = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.035, 0.06), 6, 5), glowMat(pick([0xffc2e0, 0xc8f0ff, 0xfff0c0]), 0.85));
    f.position.set(Math.cos(a) * r, 0.5 + rnd(0, 0.1), Math.sin(a) * r);
    g.add(f);
  }
})();

/* ------------------------------------------------------------ 天鹅小船 */
const swan = new THREE.Group();
swan.position.set(4.25, 0.02, 3.30);
swan.rotation.y = -0.9;
gardenRoot.add(swan);

(function buildSwan() {
  const white = toonMat({ color: 0xffffff, shade: 0xcbbfd0, rim: 0xffffff, rimPow: 2.2, rimStr: 0.45, spec: 0xffffff, specStr: 0.7, emissive: 0.08 });
  const goldTrim = goldMat;

  const hullGeo = lathe([[0, 0.0], [0.45, 0.02], [0.60, 0.10], [0.62, 0.22], [0.56, 0.30], [0.50, 0.30], [0.48, 0.22]], 32);
  hullGeo.scale(1, 1, 1.85);
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, white);
  swan.add(addOutline(hull, 1.02, 0x2a3a48));

  const deck = new THREE.Mesh(new THREE.CircleGeometry(0.50, 24), toonMat({ color: 0xc98f6a, shade: 0x5e3a24, rim: 0xffd9b0, rimStr: 0.5, emissive: 0.06 }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = 0.255;
  deck.scale.y = 1.85;
  swan.add(deck);

  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.028, 6, 40), goldTrim);
  trim.rotation.x = -Math.PI / 2;
  trim.scale.z = 1.85;
  trim.position.y = 0.30;
  swan.add(trim);

  // 天鹅颈
  const neckPts = [
    new THREE.Vector3(0, 0.20, 1.05),
    new THREE.Vector3(0, 0.62, 1.22),
    new THREE.Vector3(0, 1.02, 1.16),
    new THREE.Vector3(0, 1.30, 0.95),
    new THREE.Vector3(0, 1.42, 0.78)
  ];
  const neck = tubeOf(neckPts, 0.115, white, 40, 10);
  swan.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), white);
  head.scale.set(0.9, 0.95, 1.25);
  head.position.set(0, 1.44, 0.72);
  swan.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.30, 8), goldTrim);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.40, 0.95);
  swan.add(beak);
  // 小皇冠
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.10, 4), goldGlowMat);
    sp.position.set((i - 1) * 0.055, 1.58, 0.70);
    swan.add(sp);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101820 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), eyeMat);
    e.position.set(sx * 0.12, 1.47, 0.80);
    swan.add(e);
  }

  // 双翼
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(petalGeometry(1.05, 0.52, 1.2, 0.45, 14, 10), white);
    w.position.set(sx * 0.30, 0.26, -0.15);
    w.rotation.set(-Math.PI * 0.42, sx * 0.55, sx * 0.25);
    w.scale.set(1, 1, sx);
    swan.add(w);
  }

  // 船头灯
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), glowMat(0xffd9a0, 0.95));
  lamp.position.set(0, 0.62, -1.05);
  swan.add(lamp);
  const lh = glowSprite(0xffc46a, 1.5, 0.55);
  lh.position.copy(lamp.position);
  swan.add(lh);
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.40, 5), goldMat);
  lampPost.position.set(0, 0.42, -1.05);
  swan.add(lampPost);

  // 船内软垫
  const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 8), toonMat({
    color: 0xe8a7c6, shade: 0x8d4a6c, rim: 0xffd9ea, rimStr: 0.8, emissive: 0.10
  }));
  cushion.scale.set(0.9, 0.35, 1.4);
  cushion.position.set(0, 0.26, -0.15);
  swan.add(cushion);
})();

/* ------------------------------------------------------------ 紫藤花瀑 */
const wisteria = new THREE.Group();
wisteria.position.set(-5.55, 0, -7.15);
gardenRoot.add(wisteria);
const wisteriaStrands = [];

(function buildWisteria() {
  const barkMat = toonMat({ color: 0x8a7358, shade: 0x3c2e20, rim: 0xc8e8b0, rimStr: 0.25, emissive: 0.03 });
  const trunkPts = [
    new THREE.Vector3(0, -0.2, 0),
    new THREE.Vector3(0.15, 1.1, 0.10),
    new THREE.Vector3(-0.10, 2.20, -0.15),
    new THREE.Vector3(0.55, 3.15, 0.10),
    new THREE.Vector3(1.45, 3.45, 0.35)
  ];
  wisteria.add(tubeOf(trunkPts, 0.20, barkMat, 40, 8));
  const branchPts = [
    new THREE.Vector3(-0.10, 2.20, -0.15),
    new THREE.Vector3(-0.75, 2.85, -0.35),
    new THREE.Vector3(-1.55, 3.05, -0.55)
  ];
  wisteria.add(tubeOf(branchPts, 0.12, barkMat, 24, 6));

  const strandColors = [0x9a6fe0, 0x8a5fd8, 0xb48ae8, 0x7fa8e8];
  for (let i = 0; i < 26; i++) {
    const t = Math.random();
    const base = new THREE.Vector3().lerpVectors(trunkPts[3], trunkPts[4], t);
    if (Math.random() < 0.4) base.lerp(new THREE.Vector3(-1.5, 3.0, -0.5), Math.random() * 0.85);
    base.x += rnd(-0.55, 0.35);
    base.z += rnd(-0.35, 0.45);
    base.y += rnd(-0.12, 0.10);

    const len = rnd(1.8, 3.3);
    const n = 20;
    const pts = [];
    const col = pick(strandColors);
    for (let k = 0; k < n; k++) {
      const tt = k / (n - 1);
      pts.push(new THREE.Vector3(
        Math.sin(tt * 2.2 + i) * 0.08,
        -tt * len,
        Math.cos(tt * 1.7 + i) * 0.06
      ));
    }
    const cloud = makePoints(n, { color: col, size: 0.17, additive: false });
    const cp = cloud.geometry.attributes.position;
    const ca = cloud.geometry.attributes.aAlpha;
    for (let k = 0; k < n; k++) {
      cp.setXYZ(k, pts[k].x, pts[k].y, pts[k].z);
      ca.setX(k, 0.55 + 0.45 * (1 - k / n));
    }
    const g = new THREE.Group();
    g.position.copy(base);
    g.add(cloud);
    const tail = glowSprite(col, rnd(0.7, 1.1), 0.42);
    tail.position.set(0, -len * 0.96, 0);
    g.add(tail);
    wisteria.add(g);
    wisteriaStrands.push({ obj: g, phase: rnd(0, TAU), amp: rnd(0.02, 0.06) });
  }

  // 花瀑下的光晕
  const halo = glowSprite(0xb98bff, 6.5, 0.30);
  halo.position.set(0.4, 1.4, 0);
  wisteria.add(halo);
})();

/* ------------------------------------------------------------ 水面接地投影 */
(function groundShadows() {
  const spots = [
    [-8.15, -2.45, 3.2, 0.38],   // 风车
    [6.35, -5.85, 3.4, 0.38],    // 铃兰
    [-8.55, 2.55, 2.6, 0.30],    // 蒲公英
    [-5.55, -7.15, 4.0, 0.36],   // 紫藤
    [4.25, 3.30, 2.6, 0.34],     // 天鹅船
    [1.95, 8.55, 2.4, 0.36],     // 桥头小岛
    [0.20, 8.20, 3.0, 0.28],
    [-2.05, 7.80, 2.9, 0.28],
    [-4.20, 7.15, 3.1, 0.28],
    [-6.35, 6.55, 2.7, 0.26],
    [-8.30, 5.55, 2.3, 0.26]
  ];
  for (const [x, z, s, o] of spots) {
    const d = shadowDecal(s, o);
    d.position.set(x - 0.35, 0.03, z - 0.45);
    d.renderOrder = 9;
    gardenRoot.add(d);
  }
  // 拱桥投影
  const bd = shadowDecal(4.2, 0.26);
  bd.position.set(3.4, 0.032, 8.2);
  bd.rotation.z = 0.4;
  bd.renderOrder = 9;
  gardenRoot.add(bd);
})();
