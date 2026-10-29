/* =========================================================
   building.js — 云海邮政局 / 领航员塔楼 + 室内
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;
  const BD = (APP.Building = {});

  const W = 6.2, D = 4.8, R1 = 2.55, R2 = 2.3;
  const ZC = -0.35;          // 弧形bay圆心 z
  const H1 = 3.8, H2 = 3.3;  // 层高
  const F1 = 0.28;           // 一层地面
  const F2 = F1 + H1;        // 二层地面
  const ROOF = F2 + H2;

  const M = {};

  function initMats() {
    const deckTex = U.tex(U.plankTex('#8f3b24', '#3d1409', 10), 3, 3);
    const wallTex = U.tex(U.plankTex('#6d3823', '#2c1009', 7), 2, 2);
    M.wood = U.toon(0xffffff, { map: wallTex });
    M.deck = U.toon(0xffffff, { map: deckTex });
    M.woodDark = U.toon(0x3a2015);
    M.woodMid = U.toon(0x7d4429);
    M.woodLight = U.toon(0xa8703f);
    M.brass = U.std(0xc9a227, { metalness: 1, roughness: 0.28, env: 1.4 });
    M.brassD = U.std(0x8a6a22, { metalness: 1, roughness: 0.42 });
    M.copper = U.std(0x4f8a76, { metalness: 0.9, roughness: 0.45, env: 0.9 });
    M.iron = U.std(0x33383f, { metalness: 0.8, roughness: 0.55 });
    M.glass = U.glass(0xcfe6f7, 0.15);
    M.kraft = U.toon(0xffffff, { map: U.tex(U.kraftTex(), 1, 1) });
    M.paper = U.toon(0xf2e8d2);
    M.wax = U.toon(0x9c1f22);
    M.dark = U.toon(0x241611);
    M.leather = U.toon(0x4a2a1c);
    M.cream = U.toon(0xdcc6a2);
    M.creamD = U.toon(0xb9a681);
    M.lamp = new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb45c, emissiveIntensity: 3.6, roughness: 0.35 });
    M.lampGlow = U.glowMat(0xffb45c, 0.85);
  }

  /* ---------- 通用：弧形玻璃墙 ---------- */
  function arcWall(r, h, len, y, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const seg = 44;
    const full = len >= Math.PI * 1.99;
    const geo = new THREE.CylinderGeometry(r, r, h, seg, 1, true, -len / 2, len);
    const glass = new THREE.Mesh(geo, M.glass);
    glass.position.set(0, y + h / 2, ZC);
    glass.renderOrder = 5;
    g.add(glass);

    // 竖框
    const n = opts.mullions || 7;
    for (let i = 0; i < (full ? n : n + 1); i++) {
      const a = -len / 2 + (i / n) * len;
      const x = Math.sin(a) * r, z = ZC + Math.cos(a) * r;
      const bar = U.box(0.075, h, 0.075, M.brassD, x, y + h / 2, z);
      bar.rotation.y = a;
      g.add(bar);
    }
    // 上下横档 / 中横档
    const rails = [y + 0.04, y + h - 0.04];
    if (opts.mid) rails.push(y + h * 0.62);
    rails.forEach((yy, ri) => {
      const rad = ri === 2 ? 0.04 : 0.055;
      if (full) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(r, rad, 6, 72), M.brassD);
        t.rotation.x = Math.PI / 2;
        t.position.set(0, yy, ZC);
        g.add(t);
      } else {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const a = -len / 2 + (i / 20) * len;
          pts.push(new THREE.Vector3(Math.sin(a) * r, yy, ZC + Math.cos(a) * r));
        }
        const c = new THREE.CatmullRomCurve3(pts);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, rad, 6, false), M.brassD));
      }
    });
    return g;
  }

  /* ---------- 室内：一层邮政大厅 ---------- */
  function groundFloor() {
    const g = new THREE.Group();
    const fy = F1;

    // 地板
    const floorMesh = U.cyl(R1 * 0.98, R1 * 0.98, 0.06, 40, M.deck, 0, fy - 0.03, ZC);
    g.add(floorMesh);
    g.add(U.box(W - 0.2, 0.06, 2.3, M.deck, 0, fy - 0.03, -1.5));
    // 地毯
    const rug = U.cyl(1.15, 1.15, 0.015, 28, U.toon(0x7d2b24), 0, fy + 0.01, 0.55);
    g.add(rug);
    const rug2 = U.cyl(0.85, 0.85, 0.018, 28, U.toon(0xa8452f), 0, fy + 0.012, 0.55);
    g.add(rug2);

    // 背墙 + 护墙板
    const back = U.box(W - 0.24, H1, 0.14, M.cream, 0, fy + H1 / 2, -2.42);
    g.add(back);
    const wain = U.box(W - 0.3, 1.0, 0.06, M.woodDark, 0, fy + 0.5, -2.33);
    g.add(wain);
    // 背墙木裙线
    for (const s of [-1, 1]) {
      g.add(U.box(0.12, 1.05, 2.2, M.woodDark, s * (W / 2 - 0.1), fy + 0.52, -1.45));
    }
    // 顶部横梁
    const beamY = fy + H1 - 0.12;
    const cb = U.box(W - 0.1, 0.18, 0.22, M.woodDark, 0, beamY, 0.9);
    g.add(cb);

    /* --- 信件分拣格 --- */
    const cabX = -1.05, cabW = 2.3, cabH = 2.45, cabZ = -2.28;
    const cab = U.box(cabW, cabH, 0.46, M.woodDark, cabX, fy + cabH / 2, cabZ);
    g.add(cab);
    const cav = U.box(cabW - 0.12, cabH - 0.12, 0.4, U.toon(0x2a1710), cabX, fy + cabH / 2, cabZ + 0.04);
    g.add(cav);
    const cols = 5, rows = 6;
    const cw = (cabW - 0.18) / cols, ch = (cabH - 0.18) / rows;
    for (let i = 1; i < cols; i++) {
      g.add(U.box(0.035, cabH - 0.14, 0.42, M.woodMid, cabX - (cabW - 0.18) / 2 + i * cw, fy + cabH / 2, cabZ + 0.04));
    }
    for (let j = 1; j < rows; j++) {
      g.add(U.box(cabW - 0.14, 0.035, 0.42, M.woodMid, cabX, fy + 0.09 + j * ch, cabZ + 0.04));
    }
    // 格里塞信
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (U.rnd() > 0.55) {
          const ex = cabX - (cabW - 0.18) / 2 + (i + 0.5) * cw;
          const ey = fy + 0.09 + (j + 0.5) * ch;
          const env = U.box(cw * 0.72, ch * 0.55, 0.02, U.toon(U.rpick([0xf2e8d2, 0xe8d9b8, 0xf7f0e0])), ex, ey, cabZ + 0.2);
          env.rotation.z = U.rr(-0.12, 0.12);
          g.add(env);
        }
      }
    }
    // 铜标牌
    const plate = U.box(1.2, 0.22, 0.03, M.brass, cabX, fy + cabH + 0.2, cabZ + 0.16);
    g.add(plate);

    /* --- 柜台 --- */
    const counter = U.box(3.0, 0.9, 0.55, M.wood, 0, fy + 0.45, 1.05);
    g.add(counter);
    const ctop = U.box(3.1, 0.08, 0.66, M.woodDark, 0, fy + 0.92, 1.05);
    g.add(ctop);
    const ctrim = U.box(3.12, 0.05, 0.68, M.brass, 0, fy + 0.87, 1.05);
    g.add(ctrim);
    // 柜台上的黄铜天平
    const sc = new THREE.Group();
    sc.position.set(0.85, fy + 0.96, 1.05);
    sc.add(U.cyl(0.1, 0.13, 0.05, 12, M.brass, 0, 0.02, 0));
    sc.add(U.cyl(0.02, 0.02, 0.4, 6, M.brass, 0, 0.24, 0));
    const beamS = U.box(0.62, 0.02, 0.03, M.brass, 0, 0.44, 0);
    sc.add(beamS);
    for (const s of [-1, 1]) {
      sc.add(U.cyl(0.005, 0.005, 0.16, 4, M.brassD, s * 0.28, 0.36, 0));
      const pan = U.cyl(0.09, 0.07, 0.03, 10, M.brass, s * 0.28, 0.27, 0);
      sc.add(pan);
    }
    g.add(sc);
    // 铜铃
    const bell = U.mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), M.brass, -0.9, fy + 0.99, 1.15);
    g.add(bell);
    g.add(U.cyl(0.012, 0.012, 0.08, 6, M.brassD, -0.9, fy + 1.06, 1.15));

    /* --- 火漆印章台 --- */
    const t = new THREE.Group();
    t.position.set(-1.75, fy, 0.35);
    t.add(U.box(0.9, 0.06, 0.62, M.woodDark, 0, 0.72, 0));
    for (const p of [[-0.38, -0.24], [0.38, -0.24], [-0.38, 0.24], [0.38, 0.24]]) {
      t.add(U.cyl(0.03, 0.03, 0.7, 6, M.woodDark, p[0], 0.35, p[1]));
    }
    // 火漆块
    const waxBlob = U.sph(0.1, M.wax, 0.12, 0.78, 0.02, 1.5, 0.42, 1.5);
    t.add(waxBlob);
    // 印章
    t.add(U.cyl(0.05, 0.06, 0.2, 10, M.brass, 0.12, 0.88, 0.02));
    t.add(U.cyl(0.02, 0.02, 0.12, 6, M.woodDark, 0.12, 1.02, 0.02));
    t.add(U.sph(0.05, M.woodDark, 0.12, 1.09, 0.02));
    // 信封
    for (let i = 0; i < 3; i++) {
      const e = U.box(0.34, 0.012, 0.22, M.paper, -0.22 + i * 0.05, 0.76 + i * 0.014, -0.16 + i * 0.02);
      e.rotation.y = 0.15 + i * 0.1;
      t.add(e);
    }
    // 蜡烛
    t.add(U.cyl(0.035, 0.035, 0.18, 8, M.cream, -0.34, 0.84, 0.18));
    const flame = U.sph(0.03, M.lamp, -0.34, 0.95, 0.18, 1, 1.7, 1);
    t.add(flame);
    const fl = U.glow(0xffb45c, 0.55, 0.7);
    fl.position.set(-0.34, 0.96, 0.18);
    t.add(fl);
    g.add(t);

    /* --- 牛皮纸包裹堆 --- */
    const pileG = new THREE.Group();
    pileG.position.set(1.55, fy, -1.35);
    const pileSpots = [
      [0, 0, 0, 0.62, 0.34, 0.5, 0],
      [0.55, 0, 0.25, 0.5, 0.28, 0.42, 0.2],
      [-0.45, 0, 0.3, 0.44, 0.3, 0.4, -0.15],
      [0.1, 0.34, 0.02, 0.5, 0.3, 0.44, 0.1],
      [0.6, 0.28, 0.2, 0.38, 0.24, 0.34, -0.3],
      [-0.4, 0.3, 0.22, 0.36, 0.26, 0.32, 0.25],
      [0.05, 0.64, 0.06, 0.42, 0.26, 0.38, 0.18],
      [-0.2, 0.02, -0.45, 0.46, 0.3, 0.36, 0.5],
      [0.4, 0.02, -0.4, 0.4, 0.34, 0.3, -0.4],
      [0.15, 0.92, 0.1, 0.3, 0.2, 0.26, 0.4]
    ];
    pileSpots.forEach((p) => {
      const b = U.box(p[3], p[4], p[5], M.kraft, p[0], p[1] + p[4] / 2, p[2]);
      b.rotation.y = p[6];
      b.castShadow = true;
      pileG.add(b);
      // 捆绳
      const tw = U.box(p[3] * 1.01, 0.012, 0.012, M.woodDark, p[0], p[1] + p[4] * 0.55, p[2] + p[5] * 0.51);
      tw.rotation.y = p[6];
      pileG.add(tw);
      const tw2 = U.box(0.012, 0.012, p[5] * 1.01, M.woodDark, p[0] + p[3] * 0.3, p[1] + p[4] * 0.55, p[2]);
      tw2.rotation.y = p[6];
      pileG.add(tw2);
    });
    g.add(pileG);

    /* --- 打字机桌 --- */
    const desk = new THREE.Group();
    desk.position.set(2.0, fy, 0.35);
    desk.add(U.box(0.72, 0.05, 0.5, M.woodDark, 0, 0.72, 0));
    for (const p of [[-0.3, -0.19], [0.3, -0.19], [-0.3, 0.19], [0.3, 0.19]]) {
      desk.add(U.cyl(0.025, 0.025, 0.7, 5, M.woodDark, p[0], 0.35, p[1]));
    }
    // 打字机
    const tw = new THREE.Group();
    tw.position.set(0, 0.75, 0);
    tw.rotation.y = -0.35;
    tw.add(U.box(0.34, 0.07, 0.24, M.iron, 0, 0.05, 0));
    tw.add(U.box(0.3, 0.06, 0.1, M.iron, 0, 0.11, -0.06));
    tw.add(U.cyl(0.045, 0.045, 0.3, 8, M.iron, 0, 0.16, -0.1));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const k = U.cyl(0.012, 0.012, 0.012, 5, M.cream, -0.11 + c * 0.045, 0.095 - r * 0.018, 0.02 + r * 0.03);
        tw.add(k);
      }
    }
    // 纸
    const paper = U.box(0.22, 0.004, 0.24, M.paper, 0, 0.2, -0.14);
    paper.rotation.x = -0.4;
    tw.add(paper);
    desk.add(tw);
    // 羽毛笔 + 墨水瓶
    desk.add(U.cyl(0.04, 0.05, 0.07, 8, M.dark, 0.28, 0.78, 0.14));
    const quill = U.cyl(0.004, 0.012, 0.42, 5, M.cream, 0.3, 0.98, 0.16);
    quill.rotation.z = 0.22; quill.rotation.x = -0.18;
    desk.add(quill);
    const feather = U.box(0.05, 0.2, 0.006, M.paper, 0.34, 1.12, 0.2);
    feather.rotation.z = 0.28;
    desk.add(feather);
    g.add(desk);

    /* --- 黄铜气压管道 --- */
    const tubeMat = M.brass;
    const ty = fy + H1 - 0.32;
    const pipe1 = U.cyl(0.06, 0.06, 3.4, 8, tubeMat, -0.3, ty, 0.55);
    pipe1.rotation.z = Math.PI / 2;
    g.add(pipe1);
    const pipe2 = U.cyl(0.06, 0.06, 1.9, 8, tubeMat, -2.0, ty, -0.4);
    pipe2.rotation.x = Math.PI / 2;
    g.add(pipe2);
    g.add(U.sph(0.075, tubeMat, -2.0, ty, 0.55));
    g.add(U.sph(0.075, tubeMat, 1.4, ty, 0.55));
    const drop = U.cyl(0.055, 0.055, 1.5, 8, tubeMat, 1.4, ty - 0.75, 0.55);
    g.add(drop);
    g.add(U.sph(0.075, tubeMat, 1.4, ty - 1.5, 0.55));
    // 传输罐
    const can = U.cyl(0.09, 0.09, 0.26, 10, M.brassD, 1.4, ty - 1.75, 0.55);
    g.add(can);
    g.add(U.cyl(0.1, 0.1, 0.04, 10, M.copper, 1.4, ty - 1.62, 0.55));
    // 指示灯
    const lights = [];
    for (let i = 0; i < 4; i++) {
      const lm = new THREE.MeshStandardMaterial({
        color: 0xffc978, emissive: 0xff9a3c, emissiveIntensity: 2, roughness: 0.4
      });
      const b = U.sph(0.055, lm, -1.7 + i * 0.55, ty + 0.14, 0.62);
      g.add(b);
      lights.push({ m: lm, ph: i * 1.7 });
    }
    // 表盘
    const dial = U.cyl(0.16, 0.16, 0.04, 20, M.brassD, -0.2, ty - 0.18, 0.55);
    dial.rotation.x = Math.PI / 2;
    g.add(dial);
    BD.pipeLights = lights;

    /* --- 吊灯 --- */
    for (const lx of [-0.9, 0.9]) {
      const rod = U.cyl(0.012, 0.012, 0.5, 5, M.brassD, lx, fy + H1 - 0.55, 0.2);
      g.add(rod);
      const shade = U.mesh(new THREE.ConeGeometry(0.19, 0.2, 12, 1, true),
        new THREE.MeshToonMaterial({ color: 0xc9a227, gradientMap: U.grad, side: THREE.DoubleSide }),
        lx, fy + H1 - 0.9, 0.2);
      g.add(shade);
      const bulb = U.sph(0.075, M.lamp, lx, fy + H1 - 1.0, 0.2);
      g.add(bulb);
      const gl = U.glow(0xffb45c, 1.5, 0.7);
      gl.position.set(lx, fy + H1 - 1.0, 0.2);
      g.add(gl);
    }

    /* --- 墙钟 --- */
    const clock = U.cyl(0.26, 0.26, 0.06, 20, M.brassD, 1.7, fy + 2.2, -2.32);
    clock.rotation.x = Math.PI / 2;
    g.add(clock);
    const face = U.mesh(new THREE.CircleGeometry(0.23, 20), M.cream, 1.7, fy + 2.2, -2.28);
    g.add(face);
    g.add(U.box(0.02, 0.13, 0.01, M.dark, 1.7, fy + 2.25, -2.26));
    g.add(U.box(0.09, 0.02, 0.01, M.dark, 1.74, fy + 2.2, -2.26));

    /* --- 室内暖光 --- */
    const pl = new THREE.PointLight(0xffa858, 78, 11, 2);
    pl.position.set(0, fy + 2.4, 0.1);
    g.add(pl);

    return g;
  }

  /* ---------- 室内：二层领航室 ---------- */
  function upperFloor() {
    const g = new THREE.Group();
    const fy = F2 + 0.04;

    // 地板
    g.add(U.cyl(R2 * 0.98, R2 * 0.98, 0.06, 36, M.deck, 0, fy - 0.03, ZC));
    g.add(U.box(W - 0.4, 0.06, 2.2, M.deck, 0, fy - 0.03, -1.4));

    // 弧形背墙（只挡后半圈）
    const backWall = new THREE.Mesh(
      new THREE.CylinderGeometry(R2 - 0.05, R2 - 0.05, H2, 28, 1, true, Math.PI * 0.72, Math.PI * 0.56),
      new THREE.MeshToonMaterial({ color: 0xe9dcbe, gradientMap: U.grad, side: THREE.DoubleSide })
    );
    backWall.position.set(0, fy + H2 / 2, ZC);
    g.add(backWall);
    // 护墙板
    const wains = new THREE.Mesh(
      new THREE.CylinderGeometry(R2 - 0.1, R2 - 0.1, 1.05, 28, 1, true, Math.PI * 0.68, Math.PI * 0.64),
      new THREE.MeshToonMaterial({ color: 0x4a2c1c, gradientMap: U.grad, side: THREE.DoubleSide })
    );
    wains.position.set(0, fy + 0.52, ZC);
    g.add(wains);
    // 天花
    const ceil = U.cyl(R2 * 0.95, R2 * 0.95, 0.08, 32, M.creamD, 0, fy + H2 - 0.04, ZC);
    g.add(ceil);
    g.add(U.box(W - 0.3, 0.08, 2.2, M.creamD, 0, fy + H2 - 0.04, -1.4));

    /* --- 船舵 --- */
    const wheel = new THREE.Group();
    wheel.position.set(0, fy + 1.0, 1.15);
    wheel.rotation.x = -0.18;
    const rim = U.tor(0.62, 0.055, M.woodDark, 0, 0, 0);
    wheel.add(rim);
    const rim2 = U.tor(0.55, 0.03, M.brassD, 0, 0, 0);
    wheel.add(rim2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sp = U.box(0.055, 1.16, 0.05, M.woodMid, 0, 0, 0);
      sp.rotation.z = a;
      wheel.add(sp);
      const hd = U.cyl(0.03, 0.045, 0.26, 6, M.woodDark, Math.sin(a) * 0.76, Math.cos(a) * 0.76, 0);
      hd.rotation.z = -a;
      wheel.add(hd);
    }
    wheel.add(U.cyl(0.13, 0.13, 0.14, 12, M.brass, 0, 0, 0).rotateX(Math.PI / 2));
    g.add(wheel);
    // 舵座
    g.add(U.cyl(0.1, 0.2, 0.9, 10, M.woodDark, 0, fy + 0.45, 1.2));
    g.add(U.cyl(0.22, 0.22, 0.08, 12, M.brassD, 0, fy + 0.06, 1.2));

    /* --- 悬浮星图 --- */
    const sm = new THREE.Group();
    sm.position.set(-0.05, fy + 1.72, -0.55);
    sm.userData.y0 = fy + 1.72;
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0x8fd4ff, wireframe: true, transparent: true, opacity: 0.28 })
    );
    sm.add(wire);
    const pts = [];
    for (let i = 0; i < 130; i++) {
      const u = U.rr(-1, 1), a = U.rr(0, 7);
      const r = 0.6, s = Math.sqrt(1 - u * u);
      pts.push(Math.cos(a) * s * r, u * r, Math.sin(a) * s * r);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const stars = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0xffe9b0, size: 0.05, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sm.add(stars);
    const core = U.sph(0.13, new THREE.MeshStandardMaterial({
      color: 0xfff0c0, emissive: 0xffc060, emissiveIntensity: 4, roughness: 0.2
    }), 0, 0, 0);
    sm.add(core);
    const gl = U.glow(0xffc070, 1.6, 0.55);
    sm.add(gl);
    for (const rr of [0.76, 0.88]) {
      const ring = U.tor(rr, 0.012, M.brassD, 0, 0, 0);
      ring.rotation.x = U.rr(0.4, 1.2);
      ring.rotation.z = U.rr(0, 3);
      sm.add(ring);
    }
    g.add(sm);
    // 星图底座
    const base = new THREE.Group();
    base.position.set(-0.05, fy + 0.55, -0.55);
    base.add(U.tor(0.34, 0.045, M.brass, 0, 0, 0));
    base.children[0].rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      base.add(U.box(0.04, 0.5, 0.04, M.brassD, Math.cos(a) * 0.24, -0.2, Math.sin(a) * 0.24));
    }
    base.add(U.cyl(0.2, 0.24, 0.06, 12, M.woodDark, 0, -0.46, 0));
    g.add(base);

    /* --- 气压罗盘 --- */
    const comp = new THREE.Group();
    comp.position.set(1.42, fy, -1.35);
    comp.add(U.cyl(0.06, 0.09, 0.62, 8, M.woodDark, 0, 0.31, 0));
    comp.add(U.cyl(0.3, 0.32, 0.06, 16, M.woodDark, 0, 0.03, 0));
    const dialM = new THREE.MeshStandardMaterial({
      map: U.tex(U.dialTex(), 1, 1), roughness: 0.7, metalness: 0
    });
    const disc = U.mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24), dialM, 0, 0.66, 0);
    disc.rotation.x = Math.PI / 2;
    comp.add(disc);
    const ringB = U.tor(0.27, 0.03, M.brass, 0, 0.66, 0);
    comp.add(ringB);
    // 指针
    comp.add(U.box(0.012, 0.18, 0.006, M.wax, 0, 0.7, 0.03));
    comp.add(U.box(0.012, 0.1, 0.006, M.dark, 0, 0.63, 0.03).rotateZ(0.5));
    g.add(comp);

    /* --- 风镜 + 皮夹克 --- */
    const wallZ = -2.3;
    // 皮夹克
    const jk = new THREE.Group();
    jk.position.set(-1.5, fy + 1.75, wallZ);
    const torso = U.box(0.62, 0.78, 0.12, M.leather, 0, 0, 0);
    jk.add(torso);
    for (const s of [-1, 1]) {
      const sl = U.box(0.16, 0.62, 0.12, M.leather, s * 0.36, -0.08, 0);
      sl.rotation.z = s * 0.22;
      jk.add(sl);
    }
    const collar = U.tor(0.2, 0.055, M.leather, 0, 0.36, 0.02);
    collar.rotation.x = Math.PI / 2.4;
    jk.add(collar);
    for (let i = 0; i < 3; i++) jk.add(U.sph(0.022, M.brass, 0, 0.2 - i * 0.18, 0.07));
    // 皮带
    jk.add(U.box(0.64, 0.07, 0.13, M.woodDark, 0, -0.24, 0.005));
    g.add(jk);
    // 风镜
    const gog = new THREE.Group();
    gog.position.set(-0.62, fy + 2.28, wallZ);
    gog.rotation.x = -0.08;
    for (const s of [-1, 1]) {
      const rg = U.tor(0.085, 0.022, M.brass, s * 0.1, 0, 0);
      gog.add(rg);
      const lens = U.mesh(new THREE.CircleGeometry(0.075, 14), M.glass, s * 0.1, 0, 0.01);
      gog.add(lens);
    }
    gog.add(U.box(0.22, 0.035, 0.03, M.leather, 0, 0.02, 0));
    gog.add(U.box(0.5, 0.06, 0.03, M.leather, 0.3, 0, -0.02).rotateY(0.2));
    g.add(gog);
    // 挂钩
    g.add(U.cyl(0.015, 0.015, 0.1, 5, M.brassD, -1.5, fy + 2.22, wallZ + 0.02));

    /* --- 酒精炉 + 咖啡 --- */
    const stove = new THREE.Group();
    stove.position.set(-1.85, fy, -1.55);
    stove.add(U.cyl(0.3, 0.32, 0.06, 12, M.brassD, 0, 0.03, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      stove.add(U.cyl(0.022, 0.022, 0.36, 5, M.brassD, Math.cos(a) * 0.2, 0.24, Math.sin(a) * 0.2));
    }
    stove.add(U.cyl(0.19, 0.21, 0.26, 12, M.brass, 0, 0.5, 0));
    stove.add(U.cyl(0.16, 0.16, 0.04, 12, M.copper, 0, 0.64, 0));
    // 火焰
    const fire = U.mesh(new THREE.ConeGeometry(0.1, 0.22, 8), new THREE.MeshStandardMaterial({
      color: 0x8fd0ff, emissive: 0x6fb8ff, emissiveIntensity: 4, transparent: true, opacity: 0.85
    }), 0, 0.7, 0);
    stove.add(fire);
    // 咖啡壶
    stove.add(U.cyl(0.13, 0.15, 0.22, 12, M.copper, 0, 0.82, 0));
    stove.add(U.cyl(0.11, 0.13, 0.05, 12, M.brassD, 0, 0.95, 0));
    stove.add(U.sph(0.03, M.brass, 0, 0.99, 0));
    const spout = U.cyl(0.02, 0.035, 0.22, 6, M.copper, 0.16, 0.86, 0);
    spout.rotation.z = -0.7;
    stove.add(spout);
    const handle = U.tor(0.09, 0.014, M.brassD, -0.15, 0.84, 0, Math.PI * 1.2);
    handle.rotation.y = Math.PI / 2;
    stove.add(handle);
    // 杯子
    stove.add(U.cyl(0.045, 0.038, 0.07, 10, M.cream, 0.3, 0.035, 0.14));
    g.add(stove);

    // 蒸汽
    const steam = [];
    for (let i = 0; i < 7; i++) {
      const sm2 = new THREE.MeshBasicMaterial({
        color: 0xfff4e0, transparent: true, opacity: 0.3, depthWrite: false
      });
      const s = U.sph(0.05 + i * 0.008, sm2, -1.85 + U.rr(-0.03, 0.03), fy + 1.05, -1.55);
      s.userData = { t: i / 7, base: -1.85, y0: fy + 1.05 };
      g.add(s);
      steam.push(s);
    }
    BD.steam = steam;

    /* --- 航海图桌 --- */
    const mapDesk = new THREE.Group();
    mapDesk.position.set(1.55, fy, 0.05);
    mapDesk.add(U.box(0.8, 0.05, 0.55, M.woodDark, 0, 0.68, 0));
    for (const p of [[-0.34, -0.2], [0.34, -0.2], [-0.34, 0.2], [0.34, 0.2]]) {
      mapDesk.add(U.cyl(0.024, 0.024, 0.66, 5, M.woodDark, p[0], 0.33, p[1]));
    }
    const chart = U.box(0.62, 0.008, 0.42, M.paper, 0, 0.71, 0);
    chart.rotation.y = 0.2;
    mapDesk.add(chart);
    // 图上墨线
    for (let i = 0; i < 3; i++) {
      mapDesk.add(U.box(0.4 - i * 0.08, 0.002, 0.006, M.dark, 0.02, 0.716, -0.1 + i * 0.09).rotateY(0.2));
    }
    // 圆规
    mapDesk.add(U.box(0.012, 0.16, 0.012, M.brass, 0.22, 0.78, 0.1).rotateZ(0.3));
    mapDesk.add(U.box(0.012, 0.16, 0.012, M.brass, 0.26, 0.78, 0.1).rotateZ(-0.3));
    g.add(mapDesk);

    /* --- 望远镜（朝窗外） --- */
    const tel = new THREE.Group();
    tel.position.set(1.1, fy, 1.05);
    tel.add(U.cyl(0.24, 0.28, 0.05, 12, M.woodDark, 0, 0.03, 0));
    tel.add(U.cyl(0.035, 0.045, 0.7, 8, M.brassD, 0, 0.38, 0));
    const scope = new THREE.Group();
    scope.position.set(0, 0.72, 0);
    scope.rotation.x = -0.55;
    scope.rotation.y = 0.4;
    scope.add(U.cyl(0.075, 0.09, 0.7, 12, M.brass, 0, 0.1, 0));
    scope.add(U.cyl(0.1, 0.1, 0.16, 12, M.brassD, 0, 0.46, 0));
    scope.add(U.cyl(0.06, 0.075, 0.22, 10, M.brass, 0, -0.28, 0));
    scope.add(U.cyl(0.055, 0.055, 0.05, 10, M.iron, 0, -0.41, 0));
    tel.add(scope);
    g.add(tel);

    /* --- 暖光 --- */
    const pl = new THREE.PointLight(0xffa858, 60, 10, 2);
    pl.position.set(0, fy + 1.9, -0.2);
    g.add(pl);

    BD.wheel = wheel;
    BD.starmap = sm;
    return g;
  }

  /* ---------- 外壳 ---------- */
  BD.build = function (parent) {
    initMats();
    const g = new THREE.Group();
    g.position.set(0.6, 0, 0);

    // 基座
    const plinth = U.box(6.0, 0.3, 5.0, M.woodDark, 0, 0.15, -0.3);
    plinth.castShadow = true; plinth.receiveShadow = true;
    g.add(plinth);
    g.add(U.box(6.1, 0.06, 5.1, M.brassD, 0, 0.31, -0.3));
    // 台阶
    g.add(U.box(1.3, 0.14, 0.5, M.wood, 0, 0.1, 2.2));
    g.add(U.box(1.3, 0.07, 0.3, M.wood, 0, 0.05, 2.55));

    /* 一层墙体 */
    // 后墙
    g.add(U.box(W, H1, 0.18, M.wood, 0, F1 + H1 / 2, -2.55));
    // 侧墙（大面玻璃 + 木框）
    for (const s of [-1, 1]) {
      g.add(U.box(0.05, H1 - 0.42, 2.06, M.glass, s * (W / 2 - 0.09), F1 + H1 / 2, -1.45));
      // 木构架
      g.add(U.box(0.22, H1, 0.16, M.woodDark, s * (W / 2 - 0.09), F1 + H1 / 2, -0.42));
      g.add(U.box(0.22, H1, 0.16, M.woodDark, s * (W / 2 - 0.09), F1 + H1 / 2, -2.48));
      g.add(U.box(0.14, H1, 0.1, M.brassD, s * (W / 2 - 0.09), F1 + H1 / 2, -1.45));
      g.add(U.box(0.22, 0.16, 2.1, M.woodDark, s * (W / 2 - 0.09), F1 + 0.06, -1.45));
      g.add(U.box(0.22, 0.16, 2.1, M.woodDark, s * (W / 2 - 0.09), F1 + H1 - 0.08, -1.45));
    }
    // 转角柱
    for (const s of [-1, 1]) {
      const post = U.box(0.2, H1 + 0.1, 0.2, M.woodDark, s * (W / 2 - 0.06), F1 + H1 / 2, -0.42);
      g.add(post);
      const cap = U.box(0.3, 0.1, 0.3, M.brassD, s * (W / 2 - 0.06), F1 + H1, -0.42);
      g.add(cap);
    }
    // 弧形玻璃（一层）
    const a1 = arcWall(R1, H1 - 0.1, Math.PI * 0.86, F1 + 0.05, { mullions: 7, mid: true });
    g.add(a1);

    // 一层楣板（弧形木檐）
    const fascia = new THREE.Mesh(
      new THREE.CylinderGeometry(R1 + 0.09, R1 + 0.09, 0.3, 40, 1, true, -Math.PI * 0.43, Math.PI * 0.86),
      M.cream
    );
    fascia.position.set(0, F1 + H1 - 0.05, ZC);
    g.add(fascia);

    /* 二层楼板 / 挑台 */
    const slab = U.box(W + 0.1, 0.2, 2.4, M.woodDark, 0, F2 - 0.06, -1.45);
    slab.castShadow = true;
    g.add(slab);
    const slabArc = U.cyl(R1 + 0.12, R1 + 0.12, 0.2, 40, M.woodDark, 0, F2 - 0.06, ZC);
    g.add(slabArc);
    // 挑台（外沿）
    const balc = U.cyl(R1 + 0.52, R1 + 0.52, 0.16, 40, M.wood, 0, F2 - 0.16, ZC);
    balc.scale.z = 1;
    g.add(balc);
    g.add(U.box(W + 0.9, 0.16, 0.9, M.wood, 0, F2 - 0.16, -1.45));
    // 挑台支撑
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.38 + (i / 4) * Math.PI * 0.76;
      const bx = Math.sin(a) * (R1 + 0.35), bz = ZC + Math.cos(a) * (R1 + 0.35);
      const br = U.box(0.09, 0.09, 0.75, M.woodDark, bx * 0.92, F2 - 0.5, bz * 0.92);
      br.lookAt(0, F2 - 0.5, ZC);
      br.rotation.x += 0.7;
      g.add(br);
    }

    // 二层栏杆
    const railR = R1 + 0.46;
    const railY = F2 + 0.05;
    const posts = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.42 + (i / 10) * Math.PI * 0.84;
      const px = Math.sin(a) * railR, pz = ZC + Math.cos(a) * railR;
      g.add(U.cyl(0.035, 0.04, 0.75, 6, M.woodDark, px, railY + 0.37, pz));
      posts.push(new THREE.Vector3(px, railY + 0.75, pz));
    }
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        g.add(U.cyl(0.035, 0.04, 0.75, 6, M.woodDark, s * (W / 2 + 0.34), railY + 0.37, -0.5 - i * 0.7));
      }
    }
    const railCurve = new THREE.CatmullRomCurve3(posts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 60, 0.045, 6, false), M.brass));
    // 侧栏杆
    for (const s of [-1, 1]) {
      const pts = [
        new THREE.Vector3(s * (W / 2 + 0.34), railY + 0.75, -0.4),
        new THREE.Vector3(s * (W / 2 + 0.34), railY + 0.75, -1.9)
      ];
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.045, 6, false), M.brass));
    }

    /* 二层墙体 */
    const a2 = arcWall(R2, H2 - 0.06, Math.PI * 2, F2 + 0.02, { mullions: 11, mid: true });
    g.add(a2);

    // 二层檐口
    const cornice = new THREE.Mesh(
      new THREE.CylinderGeometry(R2 + 0.1, R2 + 0.1, 0.24, 36, 1, true, -Math.PI * 0.4, Math.PI * 0.8),
      M.cream
    );
    cornice.position.set(0, ROOF - 0.02, ZC);
    g.add(cornice);
    g.add(U.box(W - 0.1, 0.24, 2.3, M.cream, 0, ROOF - 0.02, -1.35));

    /* 屋顶：玻璃穹顶 + 铜肋 */
    const domeR = 2.5;
    const domeGeo = new THREE.SphereGeometry(domeR, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const dome = new THREE.Mesh(domeGeo, U.glass(0xcfe8f7, 0.13));
    dome.scale.set(1, 0.85, 0.9);
    dome.position.set(0, ROOF + 0.02, ZC);
    dome.renderOrder = 5;
    g.add(dome);
    // 铜肋
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const th = (k / 12) * Math.PI * 0.42;
        pts.push(new THREE.Vector3(
          Math.sin(th) * Math.sin(a) * domeR,
          ROOF + 0.02 + Math.cos(th) * domeR * 0.85,
          ZC + Math.sin(th) * Math.cos(a) * domeR * 0.9
        ));
      }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.032, 5, false), M.copper));
    }
    // 顶环
    const topY = ROOF + 0.02 + domeR * 0.85 * Math.cos(Math.PI * 0.42);
    const topR = domeR * Math.sin(Math.PI * 0.42);
    const ringTop = U.tor(topR, 0.06, M.brass, 0, topY, ZC);
    ringTop.rotation.x = Math.PI / 2;
    ringTop.scale.z = 0.9;
    g.add(ringTop);

    /* 塔顶小灯室 */
    const lantern = new THREE.Group();
    lantern.position.set(0, topY, ZC);
    lantern.add(U.cyl(topR * 0.75, topR * 0.75, 0.12, 12, M.brassD, 0, 0.06, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      lantern.add(U.cyl(0.03, 0.03, 0.5, 5, M.brassD, Math.cos(a) * topR * 0.62, 0.35, Math.sin(a) * topR * 0.62));
    }
    const lg = U.cyl(topR * 0.66, topR * 0.66, 0.5, 12, M.glass, 0, 0.35, 0);
    lantern.add(lg);
    const lb = U.sph(0.12, M.lamp, 0, 0.34, 0);
    lantern.add(lb);
    const lgl = U.glow(0xffc070, 2.0, 0.75);
    lgl.position.set(0, 0.34, 0);
    lantern.add(lgl);
    lantern.add(U.mesh(new THREE.ConeGeometry(topR * 0.86, 0.55, 12), M.copper, 0, 0.88, 0));
    // 风向标
    lantern.add(U.cyl(0.02, 0.02, 1.3, 6, M.brass, 0, 1.55, 0));
    const vane = new THREE.Group();
    vane.position.set(0, 1.95, 0);
    const arrow = U.box(0.5, 0.02, 0.02, M.brass, 0.1, 0, 0);
    vane.add(arrow);
    const arrowHead = U.mesh(new THREE.ConeGeometry(0.07, 0.16, 4), M.brass, 0.38, 0, 0);
    arrowHead.rotation.z = -Math.PI / 2;
    vane.add(arrowHead);
    vane.add(U.box(0.2, 0.18, 0.012, M.brass, -0.2, 0, 0));
    lantern.add(vane);
    BD.vane = vane;
    g.add(lantern);

    // 旗
    const flagPole = U.cyl(0.018, 0.018, 1.0, 6, M.brass, 0, topY + 1.55, ZC);
    g.add(flagPole);
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.9, -0.16);
    flagShape.lineTo(0.86, -0.3);
    flagShape.lineTo(0, -0.42);
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(flagShape), U.toon(0xb8402c, { side: THREE.DoubleSide }));
    flag.position.set(0.03, topY + 2.0, ZC);
    g.add(flag);
    BD.flag = flag;

    /* 窗口溢出的暖光 */
    const spill1 = new THREE.PointLight(0xffa04a, 26, 9, 2);
    spill1.position.set(0, F1 + 1.9, ZC + R1 + 1.0);
    g.add(spill1);
    const spill2 = new THREE.PointLight(0xffab55, 18, 7.5, 2);
    spill2.position.set(0, F2 + 1.8, ZC + R2 + 0.9);
    g.add(spill2);

    /* 室内透出的暖光雾 */
    const warmHalo = U.glow(0xffa64d, 7.6, 0.42);
    warmHalo.position.set(0, F2 - 0.6, ZC + 0.4);
    g.add(warmHalo);
    const warmHalo2 = U.glow(0xffb35c, 6.4, 0.36);
    warmHalo2.position.set(0, F2 + 1.4, ZC + 0.3);
    g.add(warmHalo2);

    /* 招牌 */
    const signTex = U.tex(U.signTex('云海邮政局', 'CLOUD POST OFFICE · EST. 1897'), 1, 1);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.65, metalness: 0.05 }));
    sign.position.set(0, F2 - 0.72, ZC + R1 + 0.53);
    sign.rotation.x = -0.06;
    g.add(sign);
    const signFrame = U.box(2.56, 1.34, 0.06, M.woodDark, 0, F2 - 0.72, ZC + R1 + 0.5);
    g.add(signFrame);
    // 吊链
    for (const s of [-1, 1]) {
      g.add(U.cyl(0.012, 0.012, 0.3, 4, M.brassD, s * 1.05, F2 - 0.02, ZC + R1 + 0.5));
    }

    /* 侧门 + 雨棚 */
    const doorG = new THREE.Group();
    doorG.position.set(W / 2, F1, -1.45);
    doorG.add(U.box(0.06, 1.9, 0.95, M.woodDark, 0.02, 0.95, 0));
    const doorLeaf = U.box(0.04, 1.74, 0.78, M.wood, 0.05, 0.9, 0);
    doorG.add(doorLeaf);
    doorG.add(U.box(0.05, 0.7, 0.5, U.toon(0x2a1a12), 0.07, 1.15, 0));
    doorG.add(U.sph(0.04, M.brass, 0.09, 0.95, 0.3));
    // 雨棚
    doorG.add(U.box(1.0, 0.07, 1.15, M.woodDark, 0.5, 2.1, 0).rotateZ(0.12));
    doorG.add(U.box(1.0, 0.04, 1.15, M.copper, 0.5, 2.17, 0).rotateZ(0.12));
    for (const s of [-1, 1]) {
      const br = U.box(0.05, 0.05, 0.95, M.brassD, 0.55, 1.98, s * 0.45);
      br.rotation.z = -0.6;
      doorG.add(br);
    }
    g.add(doorG);

    // 邮筒
    const box = new THREE.Group();
    box.position.set(W / 2 + 0.75, 0.32, 0.3);
    box.add(U.cyl(0.19, 0.19, 0.62, 12, M.wax, 0, 0.31, 0));
    box.add(U.sph(0.19, M.wax, 0, 0.62, 0, 1, 0.6, 1));
    box.add(U.box(0.24, 0.03, 0.05, M.dark, 0, 0.5, 0.17));
    box.add(U.box(0.16, 0.1, 0.02, M.brass, 0, 0.33, 0.185));
    box.add(U.cyl(0.02, 0.02, 0.6, 5, M.iron, 0, 0.02, 0));
    g.add(box);

    /* 室内 */
    g.add(groundFloor());
    g.add(upperFloor());

    parent.add(g);
    BD.group = g;
    return g;
  };
})();
