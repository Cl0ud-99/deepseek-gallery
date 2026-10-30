/* =========================================================
   03 · 主角：双层华丽旋转木马亭
   ========================================================= */
(function () {
  'use strict';
  const APP = window.APP;
  const { scene, mesh, G, M, C, toon, metal, gloss, srgb, outline, Bulbs, ringPoints } = APP;

  const root = new THREE.Group();
  root.position.set(0, 0, -1.2);
  scene.add(root);

  const spin = new THREE.Group(); // 会旋转的整体
  root.add(spin);

  const DECK1 = 0.74;
  const DECK2 = 3.12;
  const CANOPY_Y = 5.56;
  const R_OUT = 4.72;

  /* ================= 静止底盘 ================= */
  const plinth = new THREE.Group();
  root.add(plinth);

  // 台座
  const plinthBody = mesh(G.cyl(5.08, 5.22, 0.44, 48), M.goldDk, 0, 0.22, 0);
  plinth.add(plinthBody);
  const plinthRing = mesh(G.tor(5.2, 0.06, 8, 56), M.gold, 0, 0.4, 0);
  plinthRing.rotation.x = Math.PI / 2;
  plinth.add(plinthRing);

  const rimTop = mesh(G.tor(5.14, 0.075, 8, 64), M.goldLt, 0, 0.45, 0);
  rimTop.rotation.x = Math.PI / 2;
  plinth.add(rimTop);
  const rimBot = mesh(G.tor(5.2, 0.06, 8, 64), M.gold, 0, 0.04, 0);
  rimBot.rotation.x = Math.PI / 2;
  plinth.add(rimBot);

  // 镜面裙板
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const panel = mesh(G.box(0.62, 0.26, 0.05), M.chrome, 0, 0.24, 5.19);
    p.add(panel);
    const frame = mesh(G.box(0.72, 0.34, 0.04), M.gold, 0, 0.24, 5.16);
    p.add(frame);
    plinth.add(p);
  }

  /* ================= 一层地板 ================= */
  const floor1 = mesh(G.cyl(R_OUT, R_OUT, 0.2, 56), toon(0xd8b98a), 0, DECK1 - 0.1, 0);
  spin.add(floor1);
  // 地板放射拼花
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const strip = mesh(G.box(0.42, 0.03, 2.3), i % 2 ? M.pink : M.teal, 0, DECK1 + 0.01, 3.4, false);
    p.add(strip);
    spin.add(p);
  }
  const edge1 = mesh(G.tor(R_OUT + 0.02, 0.09, 8, 64), M.gold, 0, DECK1 + 0.02, 0);
  edge1.rotation.x = Math.PI / 2;
  spin.add(edge1);
  // 裙边
  const skirtMat = new THREE.MeshToonMaterial({
    map: APP.stripeTexture('#c22a3c', '#fff0d4', 32, true),
    gradientMap: APP.toonRamp
  });
  const skirt = mesh(G.cyl(R_OUT + 0.02, R_OUT + 0.02, 0.36, 56, true), skirtMat, 0, DECK1 - 0.28, 0);
  spin.add(skirt);

  /* ================= 二层环形地板 ================= */
  const deck2 = new THREE.Group();
  spin.add(deck2);
  const plankN = 40;
  const rIn = 2.05,
    rOut = R_OUT - 0.06;
  for (let i = 0; i < plankN; i++) {
    const a = (i / plankN) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const len = rOut - rIn;
    const pl = mesh(
      G.box(0.52, 0.14, len),
      i % 2 ? toon(0xc08d55) : toon(0xd6a468),
      0,
      DECK2 - 0.07,
      rIn + len / 2,
      false
    );
    p.add(pl);
    deck2.add(p);
  }
  const inRim = mesh(G.tor(rIn, 0.07, 8, 48), M.gold, 0, DECK2, 0);
  inRim.rotation.x = Math.PI / 2;
  deck2.add(inRim);
  const outRim = mesh(G.tor(rOut + 0.04, 0.08, 8, 64), M.gold, 0, DECK2, 0);
  outRim.rotation.x = Math.PI / 2;
  deck2.add(outRim);

  // 二层护栏（细金柱 + 双横杆）
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    p.add(mesh(G.cyl(0.026, 0.026, 0.5, 6), M.gold, 0, DECK2 + 0.25, rOut - 0.12, false));
    deck2.add(p);
  }
  [0.16, 0.46].forEach((h) => {
    const rail = mesh(G.tor(rOut - 0.12, 0.035, 6, 72), M.goldLt, 0, DECK2 + h, 0);
    rail.rotation.x = Math.PI / 2;
    deck2.add(rail);
  });

  /* ================= 中央镜面立柱 ================= */
  const column = new THREE.Group();
  spin.add(column);
  const colH = CANOPY_Y - DECK1 + 0.1;
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: srgb(0xdfe8ff),
    metalness: 1.0,
    roughness: 0.08,
    envMapIntensity: 2.2,
    emissive: srgb(0x2a3358),
    emissiveIntensity: 0.55
  });
  const colBody = mesh(G.cyl(0.62, 0.7, colH, 32), M.gold, 0, DECK1 + colH / 2, 0);
  column.add(colBody);
  // 金色竖肋 + 之间的镜面嵌板
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    p.add(mesh(G.box(0.1, colH, 0.16), M.goldLt, 0, DECK1 + colH / 2, 0.68));
    const mir = mesh(G.box(0.44, colH * 0.86, 0.06), mirrorMat, 0, DECK1 + colH / 2, 0.66, false);
    p.add(mir);
    column.add(p);
  }
  // 金色环箍
  [1.5, 2.6, 3.7, 4.8].forEach((h) => {
    const ring = mesh(G.tor(0.72, 0.055, 8, 40), M.gold, 0, h, 0);
    ring.rotation.x = Math.PI / 2;
    column.add(ring);
  });
  // 柱础 & 柱头
  column.add(mesh(G.cyl(1.0, 1.15, 0.22, 24), M.gold, 0, DECK1 + 0.1, 0));
  column.add(mesh(G.cyl(1.05, 0.9, 0.28, 24), M.gold, 0, CANOPY_Y - 0.18, 0));
  // 柱头花饰
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    p.add(mesh(G.sph(0.16, 10), M.goldLt, 0, CANOPY_Y - 0.42, 0.92));
    column.add(p);
  }

  /* ================= 螺旋楼梯 ================= */
  (function stairs() {
    const g = new THREE.Group();
    spin.add(g);
    const steps = 18;
    const y0 = DECK1 + 0.06;
    const y1 = DECK2 + 0.02;
    const a0 = 0.5,
      a1 = 0.5 + Math.PI * 1.15;
    const railPts = [];
    for (let i = 0; i < steps; i++) {
      const k = i / (steps - 1);
      const a = a0 + (a1 - a0) * k;
      const y = y0 + (y1 - y0) * k;
      const r = 1.38;
      const p = new THREE.Group();
      p.rotation.y = -a;
      const step = mesh(G.box(1.15, 0.09, 0.44), i % 2 ? M.goldLt : M.gold, 0, y, r, false);
      p.add(step);
      // 踏步下的雕花托
      p.add(mesh(G.sph(0.11, 8), M.goldDk, 0, y - 0.14, r, false));
      g.add(p);
      railPts.push(new THREE.Vector3(-Math.sin(a) * (r + 0.5), y + 0.82, Math.cos(a) * (r + 0.5)));
      // 栏杆柱
      const post = mesh(G.cyl(0.028, 0.028, 0.8, 6), M.gold, 0, y + 0.4, r + 0.5, false);
      const pg = new THREE.Group();
      pg.rotation.y = -a;
      pg.add(post);
      g.add(pg);
    }
    const curve = new THREE.CatmullRomCurve3(railPts);
    const railGeo = new THREE.TubeGeometry(curve, 60, 0.045, 6, false);
    g.add(mesh(railGeo, M.goldLt, 0, 0, 0, false));
    // 楼梯底部的弧形收边
    const base = mesh(G.tor(1.55, 0.05, 6, 40, Math.PI * 1.15), M.gold, 0, DECK1 + 0.02, 0);
    base.rotation.x = Math.PI / 2;
    base.rotation.z = a0;
    g.add(base);
  })();

  /* ================= 黄铜杆 + 花环 ================= */
  const poleTop = CANOPY_Y - 0.06;
  function addPole(r, a, yFrom) {
    const p = new THREE.Group();
    p.rotation.y = -a;
    const h = poleTop - yFrom;
    p.add(mesh(G.cyl(0.052, 0.052, h, 10), M.brass, 0, yFrom + h / 2, r, false));
    p.add(mesh(G.sph(0.09, 10), M.gold, 0, poleTop, r, false));
    spin.add(p);
    return p;
  }
  function addFlowers(parent, r, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = mesh(G.sph(0.075, 8), i % 3 === 0 ? M.cream : col, Math.cos(a) * 0.12, y + Math.sin(a * 2) * 0.05, r + Math.sin(a) * 0.12, false);
      parent.add(s);
      parent.add(mesh(G.sph(0.05, 6), toon(0x5fae63), Math.cos(a + 0.6) * 0.2, y - 0.06, r + Math.sin(a + 0.6) * 0.2, false));
    }
  }

  /* ================= 木马 ================= */
  function makeHorse(scale, gold) {
    const g = new THREE.Group();
    const body = gold ? M.gold : toon(0xfffaf0);
    const trim = gold ? M.goldLt : M.gold;
    const s = scale || 1;

    // 躯干
    const b = mesh(G.sph(0.26, 18), body, 0, 0.8, 0);
    b.scale.set(1.78, 0.94, 0.84);
    g.add(b);
    outline(b, 0.032);

    const chest = mesh(G.sph(0.225, 14), body, 0.4, 0.82, 0);
    chest.scale.set(1.0, 1.04, 0.88);
    g.add(chest);

    const hip = mesh(G.sph(0.235, 14), body, -0.44, 0.84, 0);
    hip.scale.set(1.0, 0.98, 0.9);
    g.add(hip);

    // 脖子
    const neck = new THREE.Group();
    neck.position.set(0.42, 0.94, 0);
    neck.rotation.z = -0.52;
    const nm = mesh(G.cyl(0.112, 0.19, 0.52, 12), body, 0, 0.23, 0);
    neck.add(nm);
    outline(nm, 0.018);
    // 鬃毛
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const m = mesh(G.sph(0.075, 8), trim, -0.11 - k * 0.02, 0.06 + k * 0.42, 0, false);
      m.scale.set(0.7, 1.25, 0.5);
      m.rotation.z = -0.35;
      neck.add(m);
    }
    g.add(neck);

    // 头
    const head = new THREE.Group();
    head.position.set(0.72, 1.42, 0);
    head.rotation.z = -0.42;
    const hm = mesh(G.sph(0.155, 16), body, 0, 0, 0);
    hm.scale.set(1.5, 0.95, 0.82);
    head.add(hm);
    outline(hm, 0.018);
    const muzzle = mesh(G.sph(0.105, 12), body, 0.19, -0.045, 0);
    muzzle.scale.set(1.2, 0.82, 0.78);
    head.add(muzzle);
    head.add(mesh(G.sph(0.032, 8), M.navy, 0.06, 0.055, 0.095, false));
    head.add(mesh(G.sph(0.032, 8), M.navy, 0.06, 0.055, -0.095, false));
    [-1, 1].forEach((sz) => {
      const ear = mesh(G.con(0.042, 0.13, 8), body, -0.05, 0.15, sz * 0.07);
      ear.rotation.z = 0.16;
      head.add(ear);
    });
    head.add(mesh(G.sph(0.045, 8), trim, -0.01, 0.12, 0, false));
    g.add(head);

    // 尾巴
    const tail = new THREE.Group();
    tail.position.set(-0.6, 0.9, 0);
    tail.rotation.z = 1.05;
    for (let i = 0; i < 6; i++) {
      const t = mesh(G.sph(0.072 - i * 0.007, 8), trim, 0, -i * 0.105, 0, false);
      t.scale.set(1, 1.3, 0.75);
      tail.add(t);
    }
    g.add(tail);

    // 四肢
    const legs = [
      [0.34, 0.155, 0.16, 1],
      [0.34, -0.155, 0.16, 1],
      [-0.38, 0.155, -0.2, -1],
      [-0.38, -0.155, -0.2, -1]
    ];
    legs.forEach(([x, z, lean, dir]) => {
      const lg = new THREE.Group();
      lg.position.set(x, 0.72, z);
      lg.rotation.z = lean;
      const up = mesh(G.cyl(0.062, 0.05, 0.36, 8), body, 0, -0.18, 0);
      lg.add(up);
      const knee = mesh(G.sph(0.052, 8), body, 0.01, -0.36, 0, false);
      lg.add(knee);
      const lo = mesh(G.cyl(0.048, 0.042, 0.32, 8), body, 0.015, -0.53, 0);
      lg.add(lo);
      const hoof = mesh(G.cyl(0.056, 0.05, 0.08, 8), trim, 0.02, -0.72, 0);
      lg.add(hoof);
      g.add(lg);
    });

    // 鞍座
    const saddle = mesh(G.sph(0.22, 14), M.velvet, -0.02, 0.98, 0);
    saddle.scale.set(1.45, 0.5, 1.05);
    g.add(saddle);
    const skirtPlate = mesh(G.cyl(0.25, 0.28, 0.13, 16), trim, -0.02, 0.93, 0);
    skirtPlate.scale.set(1.2, 1, 1.0);
    g.add(skirtPlate);
    // 胸带
    const strap = mesh(G.tor(0.245, 0.03, 6, 20), trim, 0.34, 0.82, 0, false);
    strap.rotation.y = Math.PI / 2;
    strap.scale.set(1, 1.2, 1);
    g.add(strap);
    // 马镫
    [-1, 1].forEach((sz) => {
      g.add(mesh(G.tor(0.055, 0.016, 5, 12), M.goldLt, 0.0, 0.72, sz * 0.27, false));
    });

    if (gold) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(0.08, 0.2, 0.34, 0.36, 0.62, 0.34);
      wingShape.bezierCurveTo(0.5, 0.2, 0.42, 0.02, 0.3, -0.08);
      wingShape.bezierCurveTo(0.2, 0.02, 0.1, -0.02, 0, 0);
      const wg = new THREE.ExtrudeGeometry(wingShape, { depth: 0.035, bevelEnabled: false });
      [-1, 1].forEach((sz) => {
        const w = mesh(wg, M.goldLt, 0.0, 1.02, sz * 0.19, false);
        w.rotation.y = sz * -1.15;
        w.rotation.z = 0.15;
        g.add(w);
      });
    }

    g.scale.setScalar(s);
    return g;
  }

  APP.makeHorse = makeHorse;

  /* ================= 南瓜马车 ================= */
  function makeCarriage() {
    const g = new THREE.Group();
    // 底盘
    g.add(mesh(G.box(1.2, 0.1, 0.86), M.gold, 0, 0.16, 0));
    g.add(mesh(G.box(1.24, 0.06, 0.9), M.goldLt, 0, 0.09, 0));

    // 南瓜体
    const p = mesh(G.sph(0.46, 20), M.orange, 0, 0.62, 0);
    p.scale.set(1.18, 0.95, 1.0);
    g.add(p);
    outline(p, 0.024);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rg = mesh(G.tor(0.455, 0.018, 5, 24, Math.PI), M.goldLt, 0, 0.62, 0, false);
      rg.rotation.y = a;
      rg.scale.set(1.18, 0.95, 1);
      g.add(rg);
    }
    // 顶冠
    g.add(mesh(G.cyl(0.13, 0.18, 0.1, 12), M.gold, 0, 1.06, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sp = mesh(G.con(0.035, 0.16, 6), M.goldLt, Math.cos(a) * 0.13, 1.16, Math.sin(a) * 0.13, false);
      g.add(sp);
    }
    // 车门
    const door = mesh(G.box(0.06, 0.52, 0.42), M.redDk, 0.54, 0.62, 0);
    g.add(door);
    g.add(mesh(G.tor(0.2, 0.028, 5, 16, Math.PI), M.gold, 0.56, 0.78, 0, false));
    // 车窗
    const win = mesh(G.box(0.03, 0.26, 0.24), M.goldLt, 0.58, 0.68, 0);
    g.add(win);
    // 轮子
    [[-0.42, 0.46], [0.42, 0.46], [-0.42, -0.46], [0.42, -0.46]].forEach(([x, z]) => {
      const w = new THREE.Group();
      w.position.set(x, 0.3, z);
      w.rotation.y = Math.PI / 2;
      w.add(mesh(G.tor(0.28, 0.045, 6, 20), M.gold, 0, 0, 0));
      w.add(mesh(G.tor(0.1, 0.03, 5, 14), M.goldDk, 0, 0, 0));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        const sp = mesh(G.box(0.026, 0.52, 0.026), M.goldLt, 0, 0, 0, false);
        sp.rotation.z = a;
        w.add(sp);
      }
      g.add(w);
    });
    // 座位
    const seat = mesh(G.sph(0.24, 12), M.velvet, 0, 0.86, 0);
    seat.scale.set(1.4, 0.5, 0.9);
    g.add(seat);
    return g;
  }

  /* ================= 天鹅座椅 ================= */
  function makeSwan() {
    const g = new THREE.Group();
    g.add(mesh(G.cyl(0.5, 0.56, 0.1, 16), M.gold, 0, 0.05, 0));
    const body = mesh(G.sph(0.4, 18), M.white, 0, 0.42, 0);
    body.scale.set(1.35, 0.85, 0.95);
    g.add(body);
    outline(body, 0.022);
    // 翅膀
    [-1, 1].forEach((sz) => {
      const w = mesh(G.sph(0.3, 14), M.cream, -0.02, 0.5, sz * 0.22);
      w.scale.set(1.25, 0.55, 0.45);
      w.rotation.y = sz * 0.2;
      g.add(w);
    });
    // 长颈
    const neckPts = [];
    for (let i = 0; i <= 6; i++) {
      const k = i / 6;
      neckPts.push(new THREE.Vector3(0.42 + Math.sin(k * 1.5) * 0.12, 0.62 + k * 0.62, 0));
    }
    for (let i = 0; i <= 6; i++) {
      const s = mesh(G.sph(0.095 - i * 0.006, 10), M.white, neckPts[i].x, neckPts[i].y, neckPts[i].z, false);
      g.add(s);
    }
    // 头
    const head = mesh(G.sph(0.13, 12), M.white, 0.62, 1.3, 0);
    head.scale.set(1.2, 0.9, 0.85);
    g.add(head);
    const beak = mesh(G.con(0.055, 0.18, 8), M.gold, 0.77, 1.28, 0, false);
    beak.rotation.z = -Math.PI / 2;
    g.add(beak);
    g.add(mesh(G.sph(0.026, 6), M.navy, 0.62, 1.34, 0.09, false));
    // 冠
    g.add(mesh(G.cyl(0.06, 0.07, 0.05, 8), M.goldLt, 0.55, 1.42, 0, false));
    // 靠背
    const back = mesh(G.tor(0.42, 0.06, 6, 20, Math.PI), M.velvet, -0.1, 0.62, 0, false);
    back.rotation.x = Math.PI / 2;
    back.rotation.z = Math.PI * 0.5;
    g.add(back);
    g.add(mesh(G.sph(0.2, 10), M.pinkDk, -0.05, 0.62, 0, false));
    return g;
  }

  /* ================= 装配木马 & 座椅 ================= */
  const horses = [];
  const R1 = 3.55,
    R2 = 3.42;

  // 一层：6 匹马 + 马车 + 天鹅
  const deck1Items = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    let obj;
    if (i === 3) obj = makeCarriage();
    else if (i === 6) obj = makeSwan();
    else obj = makeHorse(1.0, false);
    const holder = new THREE.Group();
    holder.rotation.y = -a + Math.PI / 2; // 面向切线方向
    holder.position.set(Math.cos(a) * R1, DECK1, Math.sin(a) * R1);
    // 朝向：让马头朝外侧切线
    holder.rotation.y = -a;
    const inner = new THREE.Group();
    inner.rotation.y = -Math.PI / 2;
    inner.add(obj);
    holder.add(inner);
    spin.add(holder);
    if (i !== 3 && i !== 6) horses.push({ obj, holder, phase: Math.random() * 6.28, base: DECK1 });
  }

  // 二层：6 匹马
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    const obj = makeHorse(0.92, false);
    const holder = new THREE.Group();
    holder.rotation.y = -a;
    holder.position.set(Math.cos(a) * R2, DECK2, Math.sin(a) * R2);
    const inner = new THREE.Group();
    inner.rotation.y = -Math.PI / 2;
    inner.add(obj);
    holder.add(inner);
    spin.add(holder);
    horses.push({ obj, holder, phase: Math.random() * 6.28, base: DECK2 });
  }

  // 黄铜杆
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addPole(R1, a, DECK1 - 0.05);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    addPole(R2, a, DECK2 - 0.05);
  }
  // 杆上的花环
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    addFlowers(p, R1, 2.52, 7, M.pink);
    addFlowers(p, R1, 2.86, 6, M.lilac);
    spin.add(p);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    const p = new THREE.Group();
    p.rotation.y = -a;
    addFlowers(p, R2, 4.92, 6, M.pink);
    spin.add(p);
  }

  /* ================= 华盖 ================= */
  const canopy = new THREE.Group();
  spin.add(canopy);

  const coneMat = new THREE.MeshToonMaterial({
    map: APP.stripeTexture('#f3d9a8', '#cf4a7d', 40, true),
    gradientMap: APP.toonRamp,
    side: THREE.FrontSide
  });
  const coneGeo = G.cyl(0.62, 5.1, 1.62, 48, true);
  const cone = mesh(coneGeo, coneMat, 0, CANOPY_Y + 0.81, 0);
  canopy.add(cone);
  outline(cone, 0.05);

  // 内侧顶棚
  const innerCone = mesh(
    G.cyl(0.6, 5.0, 1.6, 48, true),
    new THREE.MeshToonMaterial({
      color: srgb(0xffe6bd),
      gradientMap: APP.toonRamp,
      side: THREE.BackSide
    }),
    0,
    CANOPY_Y + 0.81,
    0
  );
  innerCone.castShadow = false;
  canopy.add(innerCone);

  // 华盖上的镀金肋条
  const ribLen = Math.hypot(5.1 - 0.62, 1.62);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.1;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const rib = mesh(G.box(0.085, ribLen, 0.12), M.gold, 0, CANOPY_Y + 0.81, 2.86, false);
    rib.rotation.x = -Math.atan2(4.48, 1.62);
    p.add(rib);
    // 肋条上的小铆钉
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      const rr = 5.1 + (0.62 - 5.1) * t;
      const yy = CANOPY_Y + 1.62 * t;
      p.add(mesh(G.sph(0.045, 6), M.goldLt, 0, yy, rr, false));
    }
    canopy.add(p);
  }

  // 华盖金边 + 波浪垂帘
  const canopyRim = mesh(G.tor(5.1, 0.1, 8, 72), M.gold, 0, CANOPY_Y, 0);
  canopyRim.rotation.x = Math.PI / 2;
  canopy.add(canopyRim);
  const canopyRim2 = mesh(G.tor(4.95, 0.06, 8, 72), M.goldLt, 0, CANOPY_Y - 0.16, 0);
  canopyRim2.rotation.x = Math.PI / 2;
  canopy.add(canopyRim2);

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const scallop = mesh(G.sph(0.16, 8), i % 2 ? M.cream : M.pink, 0, CANOPY_Y - 0.22, 5.0, false);
    scallop.scale.set(1, 0.8, 0.55);
    p.add(scallop);
    canopy.add(p);
  }

  // 华盖上的小灯泡环
  const canopyBulbs = [];
  [
    [5.0, CANOPY_Y - 0.06, 44],
    [3.66, CANOPY_Y + 0.46, 34],
    [2.27, CANOPY_Y + 0.96, 24],
    [1.16, CANOPY_Y + 1.36, 14]
  ].forEach(([r, y, n]) => {
    const b = new Bulbs(ringPoints(n, r, y, 0, 0), 0.075, 0xffd08a);
    canopy.add(b.mesh);
    APP.bulbs.push(b);
    canopyBulbs.push(b);
  });

  // 华盖上的彩绘小圆窗
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const y = CANOPY_Y + 0.34;
    const disc = mesh(G.cyl(0.2, 0.2, 0.05, 12), i % 3 === 0 ? M.teal : M.cream, 0, y, 4.3, false);
    disc.rotation.x = Math.PI / 2;
    p.add(disc);
    const ring = mesh(G.tor(0.21, 0.03, 6, 16), M.gold, 0, y, 4.3, false);
    p.add(ring);
    canopy.add(p);
  }

  /* ================= 皇冠 + 旋转飞马 ================= */
  const crown = new THREE.Group();
  crown.position.y = CANOPY_Y + 1.62;
  canopy.add(crown);
  crown.add(mesh(G.cyl(0.66, 0.72, 0.16, 24), M.gold, 0, 0.08, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    const spike = mesh(G.con(0.085, 0.42, 8), M.goldLt, 0, 0.36, 0.6, false);
    p.add(spike);
    p.add(mesh(G.sph(0.075, 8), M.gold, 0, 0.6, 0.6, false));
    crown.add(p);
  }
  const crownBulbs = new Bulbs(ringPoints(20, 0.69, 0.2, 0, 0), 0.055, 0xffe0a8);
  crown.add(crownBulbs.mesh);
  APP.bulbs.push(crownBulbs);

  const topHorse = new THREE.Group();
  topHorse.position.y = 0.72;
  topHorse.scale.setScalar(0.78);
  const th = makeHorse(1, true);
  th.rotation.y = -Math.PI / 2;
  topHorse.add(th);
  crown.add(topHorse);

  /* ================= 华盖下的环形吊灯 ================= */
  const chand = new THREE.Group();
  chand.position.y = CANOPY_Y - 0.62;
  spin.add(chand);
  const chandRing = mesh(G.tor(1.95, 0.035, 6, 40), M.gold, 0, 0, 0);
  chandRing.rotation.x = Math.PI / 2;
  chand.add(chandRing);
  const chandRing2 = mesh(G.tor(1.78, 0.02, 6, 40), M.goldLt, 0, -0.16, 0);
  chandRing2.rotation.x = Math.PI / 2;
  chand.add(chandRing2);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const chain = mesh(G.cyl(0.012, 0.012, 1.72, 5), M.gold, Math.cos(a) * 1.95, 0.86, Math.sin(a) * 1.95, false);
    chand.add(chain);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const p = new THREE.Group();
    p.rotation.y = -a;
    p.add(mesh(G.sph(0.07, 8), M.cream, 0, 0.04, 1.95, false));
    const flame = new THREE.Mesh(G.con(0.032, 0.1, 6), APP.emissive(0xffd9a0, 1.6));
    flame.position.set(0, 0.12, 1.95);
    p.add(flame);
    chand.add(p);
  }

  /* ================= 动画 ================= */
  APP.onFrame((t, dt) => {
    spin.rotation.y += dt * 0.16; // 缓慢匀速旋转
    topHorse.rotation.y -= dt * 0.55; // 顶部飞马反向旋转
    crownBulbs.update(t);

    // 木马上下起伏
    for (let i = 0; i < horses.length; i++) {
      const h = horses[i];
      const y = Math.sin(t * 1.15 + h.phase) * 0.19;
      h.holder.position.y = h.base + y;
      h.obj.rotation.z = Math.sin(t * 1.15 + h.phase + 1.2) * 0.05;
    }
    // 吊灯轻晃
    chand.rotation.y = Math.sin(t * 0.6) * 0.06;
  });

  APP.carousel = { root, spin, horses, height: CANOPY_Y + 2.4 };
})();
