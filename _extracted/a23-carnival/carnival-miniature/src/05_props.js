/* =========================================================
   05 · 外围陈设：围栏 / 气球 / 推车 / 杂项
   ========================================================= */
(function () {
  'use strict';
  const APP = window.APP;
  const { scene, mesh, G, M, C, toon, metal, gloss, srgb, outline, Bulbs, ringPoints } = APP;

  /* =========================================================
     白色铁艺围栏（沿广场四周，正面留门）
     ========================================================= */
  (function fence() {
    const FX = 9.55;
    const FZ_FRONT = 8.35;
    const FZ_BACK = -9.55;
    const g = new THREE.Group();
    scene.add(g);

    function railSegment(x1, z1, x2, z2) {
      const dx = x2 - x1,
        dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const ang = Math.atan2(dz, dx);
      const s = new THREE.Group();
      s.position.set(x1, 0, z1);
      s.rotation.y = -ang;
      // 上下横杆
      [0.28, 0.92].forEach((y) => {
        const rail = mesh(G.cyl(0.035, 0.035, len, 6), M.white, len / 2, y, 0, false);
        rail.rotation.z = Math.PI / 2;
        s.add(rail);
      });
      // 竖条
      const n = Math.max(2, Math.round(len / 0.28));
      for (let i = 1; i < n; i++) {
        const x = (i / n) * len;
        s.add(mesh(G.cyl(0.016, 0.016, 0.68, 5), M.white, x, 0.6, 0, false));
      }
      // 顶部小弧
      const arcs = Math.max(1, Math.round(len / 0.85));
      for (let i = 0; i < arcs; i++) {
        const x = (i + 0.5) * (len / arcs);
        const a = mesh(G.tor(0.14, 0.018, 5, 14, Math.PI), M.white, x, 0.95, 0, false);
        s.add(a);
      }
      // 立柱
      s.add(mesh(G.box(0.1, 1.1, 0.1), M.white, 0, 0.55, 0));
      const finial = mesh(G.sph(0.075, 8), M.white, 0, 1.15, 0);
      s.add(finial);
      s.add(mesh(G.box(0.13, 0.05, 0.13), M.gold, 0, 1.08, 0, false));
      g.add(s);
      return s;
    }

    // 正面两段（中间留门）
    railSegment(-FX, FZ_FRONT, -3.7, FZ_FRONT);
    railSegment(3.7, FZ_FRONT, FX, FZ_FRONT);
    // 两侧
    railSegment(-FX, FZ_FRONT, -FX, FZ_BACK);
    railSegment(FX, FZ_FRONT, FX, FZ_BACK);
    // 背面
    railSegment(-FX, FZ_BACK, FX, FZ_BACK);

    APP.fenceX = FX;
  })();

  /* =========================================================
     气球束
     ========================================================= */
  const balloonSets = [];
  (function balloons() {
    const spots = [
      [-9.55, 2.6, 0.1],
      [-9.55, -3.4, 0.2],
      [9.55, 0.8, -0.15],
      [9.55, -5.2, 0.25],
      [-5.4, -9.55, -0.1],
      [5.4, -9.55, 0.15]
    ];
    const palettes = [
      [0xff6f91, 0xffd166, 0x7be0d0, 0xb59bff, 0xff9f6f],
      [0x7be0d0, 0xff8fb8, 0xfff0c8, 0x9b8cff, 0xffb3c8],
      [0xffd166, 0xff6f91, 0x8fd0ff, 0xfff0c8, 0xc8a0ff]
    ];
    spots.forEach(([x, z, rot], si) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.2, z);
      scene.add(pivot);
      const pal = palettes[si % 3];
      const n = 5 + (si % 2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + si;
        const r = 0.18 + (i % 2) * 0.12;
        const bx = Math.cos(a) * r;
        const bz = Math.sin(a) * r;
        const by = 1.0 + (i % 3) * 0.28;
        const col = pal[i % pal.length];
        const b = mesh(G.sph(0.155, 14), gloss(col, 0.16), bx, by, bz, false);
        b.scale.set(1, 1.2, 1);
        b.rotation.z = bx * 0.4;
        b.rotation.x = bz * 0.4;
        pivot.add(b);
        // 结
        pivot.add(mesh(G.con(0.04, 0.08, 6), gloss(col, 0.16), bx, by - 0.2, bz, false));
        // 细绳
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          pts.push(
            new THREE.Vector3(
              bx * (1 - t) * 0.9,
              (by - 0.28) * (1 - t) - t * 0.0,
              bz * (1 - t) * 0.9
            )
          );
        }
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: srgb(0xf0e6d0), transparent: true, opacity: 0.55 })
        );
        pivot.add(line);
      }
      balloonSets.push({ pivot, phase: Math.random() * 6.28, amp: 0.06 + Math.random() * 0.03 });
    });
    APP.onFrame((t) => {
      for (const b of balloonSets) {
        b.pivot.rotation.z = Math.sin(t * 0.9 + b.phase) * b.amp;
        b.pivot.rotation.x = Math.cos(t * 0.7 + b.phase * 1.3) * b.amp * 0.8;
        b.pivot.position.y = 1.2 + Math.sin(t * 1.1 + b.phase) * 0.04;
      }
    });
  })();

  /* =========================================================
     爆米花推车
     ========================================================= */
  const popcornBits = [];
  const steamPuffs = [];
  (function popcornCart() {
    const g = new THREE.Group();
    g.position.set(-2.95, 0, 6.35);
    g.rotation.y = 2.35;
    scene.add(g);

    const stripeMat = new THREE.MeshToonMaterial({
      map: APP.stripeTexture('#d9383f', '#fff1d6', 10, true),
      gradientMap: APP.toonRamp
    });

    // 车身
    const body = mesh(G.box(1.6, 0.85, 0.95), stripeMat, 0, 0.82, 0);
    g.add(body);
    outline(body, 0.03);
    g.add(mesh(G.box(1.66, 0.09, 1.0), M.gold, 0, 1.27, 0, false));
    g.add(mesh(G.box(1.66, 0.09, 1.0), M.gold, 0, 0.38, 0, false));
    // 玻璃箱
    const box = new THREE.Group();
    box.position.y = 1.3;
    g.add(box);
    box.add(mesh(G.box(1.25, 0.72, 0.72), M.glass, 0, 0.36, 0, false));
    box.add(mesh(G.box(1.3, 0.06, 0.77), M.gold, 0, 0.73, 0, false));
    box.add(mesh(G.box(1.3, 0.05, 0.77), M.gold, 0, 0.0, 0, false));
    // 四角金柱
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      box.add(mesh(G.box(0.05, 0.75, 0.05), M.gold, sx * 0.62, 0.36, sz * 0.36, false));
    });
    // 爆米花堆
    for (let i = 0; i < 42; i++) {
      const x = (Math.random() - 0.5) * 1.1;
      const z = (Math.random() - 0.5) * 0.6;
      const y = 0.06 + Math.random() * 0.26 * (1 - Math.abs(x) / 0.6);
      const p = mesh(G.sph(0.045 + Math.random() * 0.025, 6), toon(0xffe9a8), x, y, z, false);
      p.scale.set(1, 0.8, 1);
      box.add(p);
    }
    // 轮子
    [-1, 1].forEach((sz) => {
      const w = new THREE.Group();
      w.position.set(-0.35, 0.36, sz * 0.55);
      w.rotation.y = Math.PI / 2;
      w.add(mesh(G.tor(0.34, 0.05, 6, 20), M.goldDk, 0, 0, 0));
      const hub = mesh(G.cyl(0.06, 0.06, 0.1, 8), M.gold, 0, 0, 0, false);
      hub.rotation.x = Math.PI / 2;
      w.add(hub);
      for (let i = 0; i < 4; i++) {
        const sp = mesh(G.box(0.025, 0.62, 0.025), M.goldLt, 0, 0, 0, false);
        sp.rotation.z = (i / 4) * Math.PI;
        w.add(sp);
      }
      g.add(w);
    });
    // 推柄
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, 0.95, 0.3),
      new THREE.Vector3(-1.15, 1.05, 0.34),
      new THREE.Vector3(-1.3, 0.9, 0.36)
    ]);
    g.add(mesh(new THREE.TubeGeometry(handleCurve, 12, 0.035, 6, false), M.gold, 0, 0, 0, false));
    // 小旗
    g.add(mesh(G.cyl(0.02, 0.02, 0.7, 5), M.gold, 0.62, 1.7, 0, false));
    const fl = mesh(G.pla(0.34, 0.22), toon(0xff6f91), 0.79, 1.95, 0, false);
    fl.material.side = THREE.DoubleSide;
    g.add(fl);

    // 蹦出来的爆米花
    for (let i = 0; i < 7; i++) {
      const p = mesh(G.sph(0.055, 6), toon(0xfff0c0), 0, 1.6, 0, false);
      p.scale.set(1, 0.85, 1);
      g.add(p);
      popcornBits.push({
        mesh: p,
        t: Math.random() * 2,
        dur: 1.5 + Math.random() * 0.9,
        x: (Math.random() - 0.5) * 0.7,
        z: (Math.random() - 0.5) * 0.4,
        h: 0.5 + Math.random() * 0.55
      });
    }

    // 香气白雾
    const steamTex = APP.glowTexture('rgba(255,248,235,0.55)', 'rgba(255,230,200,0.18)');
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: steamTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      sp.scale.setScalar(0.7);
      sp.position.set(0, 2.1, 0);
      g.add(sp);
      steamPuffs.push({ sp, t: i / 6, x: (Math.random() - 0.5) * 0.5, z: (Math.random() - 0.5) * 0.3 });
    }

    APP.onFrame((t, dt) => {
      // 爆米花弹跳
      for (const p of popcornBits) {
        p.t += dt;
        const k = (p.t % p.dur) / p.dur;
        const up = Math.sin(k * Math.PI);
        p.mesh.position.set(p.x * (1 - k * 0.2), 1.65 + up * p.h, p.z * (1 - k * 0.2));
        p.mesh.rotation.x += dt * 2.5;
        p.mesh.rotation.z += dt * 1.8;
        p.mesh.visible = k > 0.05;
      }
      // 蒸汽
      for (const s of steamPuffs) {
        s.t += dt * 0.28;
        const k = s.t % 1;
        s.sp.position.set(s.x * (0.4 + k * 1.6), 1.95 + k * 1.5, s.z * (0.4 + k * 1.6));
        s.sp.scale.setScalar(0.55 + k * 1.5);
        s.sp.material.opacity = Math.sin(k * Math.PI) * 0.35;
      }
    });
  })();

  /* =========================================================
     棉花糖机小推车
     ========================================================= */
  (function cottonCandy() {
    const g = new THREE.Group();
    g.position.set(8.75, 0, -2.0);
    g.rotation.y = -1.2;
    scene.add(g);

    g.add(mesh(G.box(1.05, 0.75, 0.8), M.teal, 0, 0.62, 0));
    outline(g.children[0], 0.025);
    g.add(mesh(G.box(1.1, 0.07, 0.85), M.gold, 0, 1.0, 0, false));
    g.add(mesh(G.box(1.1, 0.07, 0.85), M.cream, 0, 0.25, 0, false));
    // 轮
    [-1, 1].forEach((sz) => {
      const w = mesh(G.tor(0.22, 0.045, 6, 16), M.goldDk, -0.28, 0.24, sz * 0.45, false);
      w.rotation.y = Math.PI / 2;
      g.add(w);
    });
    // 机器
    g.add(mesh(G.cyl(0.3, 0.34, 0.16, 16), M.chrome, 0, 1.1, 0, false));
    g.add(mesh(G.cyl(0.24, 0.28, 0.14, 16), M.gold, 0, 1.2, 0, false));
    // 旋转糖丝
    const puff = new THREE.Group();
    puff.position.y = 1.62;
    g.add(puff);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.3;
      const s = mesh(G.sph(0.09 + Math.random() * 0.08, 7), gloss(0xffb8d8, 0.5), Math.cos(a) * r, (Math.random() - 0.5) * 0.3, Math.sin(a) * r, false);
      puff.add(s);
    }
    // 纸棒
    g.add(mesh(G.cyl(0.015, 0.015, 0.9, 5), M.cream, 0.34, 1.5, 0.1, false));
    // 招牌
    g.add(mesh(G.cyl(0.02, 0.02, 0.8, 5), M.gold, -0.4, 1.4, 0.3, false));
    const sign = new THREE.Mesh(
      G.pla(0.62, 0.26),
      new THREE.MeshBasicMaterial({
        map: APP.textTexture('COTTON', { w: 640, h: 260, font: 'bold 120px Georgia, serif', color: '#fff0d8', glow: '#7be0d0' }),
        transparent: true,
        depthWrite: false
      })
    );
    sign.position.set(-0.4, 1.75, 0.3);
    g.add(sign);

    APP.onFrame((t, dt) => {
      puff.rotation.y += dt * 1.1;
      puff.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
    });
  })();

  /* =========================================================
     小丑占卜机
     ========================================================= */
  (function clownMachine() {
    const g = new THREE.Group();
    g.position.set(-4.9, 0, -8.5);
    g.rotation.y = 0.12;
    scene.add(g);

    // 柜体
    const body = mesh(G.box(1.05, 2.05, 0.62), M.redDk, 0, 1.05, 0);
    g.add(body);
    outline(body, 0.03);
    g.add(mesh(G.box(1.12, 0.12, 0.7), M.gold, 0, 2.1, 0, false));
    g.add(mesh(G.box(1.12, 0.14, 0.7), M.gold, 0, 0.1, 0, false));
    // 玻璃面
    g.add(mesh(G.box(0.86, 1.4, 0.02), M.glass, 0, 1.28, 0.32, false));
    // 内部：小丑
    const c = new THREE.Group();
    c.position.set(0, 1.28, 0.1);
    g.add(c);
    // 脸
    const face = mesh(G.sph(0.28, 16), M.ivory, 0, 0.1, 0.06);
    face.scale.set(1, 1.05, 0.8);
    c.add(face);
    outline(face, 0.02);
    // 鼻子
    c.add(mesh(G.sph(0.075, 10), gloss(0xe01f3c, 0.2), 0, 0.08, 0.28, false));
    // 眼睛
    [-1, 1].forEach((sx) => {
      c.add(mesh(G.sph(0.04, 8), M.navy, sx * 0.1, 0.2, 0.25, false));
      // 眼周彩绘
      const eye = mesh(G.sph(0.055, 8), M.white, sx * 0.1, 0.2, 0.235, false);
      eye.scale.set(1.4, 1.2, 0.4);
      c.add(eye);
      // 腮红
      const ch = mesh(G.sph(0.07, 8), gloss(0xff6f91, 0.4), sx * 0.18, 0.02, 0.22, false);
      ch.scale.set(1, 0.7, 0.3);
      c.add(ch);
    });
    // 笑嘴
    const mouth = mesh(G.tor(0.11, 0.022, 5, 14, Math.PI), gloss(0xd21f3c, 0.3), 0, 0.0, 0.24, false);
    mouth.rotation.z = Math.PI;
    c.add(mouth);
    // 帽子
    const hat = mesh(G.con(0.17, 0.42, 12), toon(0x5fd6c8), 0, 0.46, 0.02);
    hat.rotation.z = 0.12;
    c.add(hat);
    c.add(mesh(G.sph(0.05, 8), M.gold, 0.05, 0.68, 0.02, false));
    // 卷发
    for (let i = 0; i < 7; i++) {
      const a = -0.9 + i * 0.3;
      c.add(mesh(G.sph(0.07, 8), toon(0xff9f6f), Math.sin(a) * 0.28, -0.02 + Math.cos(a) * 0.06, 0.02, false));
    }
    // 领结
    c.add(mesh(G.box(0.24, 0.1, 0.06), M.pink, 0, -0.24, 0.2, false));
    // 投币口 & 摇柄
    g.add(mesh(G.box(0.16, 0.05, 0.03), M.gold, 0.34, 0.86, 0.32, false));
    const crank = mesh(G.cyl(0.025, 0.025, 0.26, 6), M.brass, 0.6, 0.86, 0.05, false);
    crank.rotation.z = Math.PI / 2;
    g.add(crank);
    g.add(mesh(G.sph(0.05, 8), M.brass, 0.72, 0.86, 0.05, false));
    // 顶部招牌
    const topSign = new THREE.Mesh(
      G.pla(0.9, 0.34),
      new THREE.MeshBasicMaterial({
        map: APP.textTexture('FORTUNE', { w: 800, h: 260, font: 'bold 110px Georgia, serif', color: '#fff2cf', glow: '#ffb84f', letterSpacing: 3 }),
        transparent: true,
        depthWrite: false
      })
    );
    topSign.position.set(0, 2.35, 0.2);
    g.add(topSign);
    // 出签口
    g.add(mesh(G.box(0.3, 0.05, 0.04), M.navy, -0.2, 0.55, 0.32, false));
  })();

  /* =========================================================
     哈哈镜
     ========================================================= */
  (function funMirror() {
    const g = new THREE.Group();
    g.position.set(5.1, 0, -8.4);
    g.rotation.y = -0.16;
    scene.add(g);

    g.add(mesh(G.box(1.15, 0.18, 0.7), M.gold, 0, 0.09, 0));
    // 镜面（波浪）
    const geo = new THREE.PlaneGeometry(0.92, 2.05, 14, 26);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(y * 3.4) * 0.07 + Math.cos(x * 6.0) * 0.035);
    }
    geo.computeVertexNormals();
    const mir = new THREE.Mesh(geo, metal(0xdfe8ff, 0.02, 1.0));
    mir.position.set(0, 1.25, 0.12);
    g.add(mir);
    // 金框
    const frameMat = M.gold;
    g.add(mesh(G.box(1.06, 2.2, 0.08), frameMat, 0, 1.25, 0.05));
    // 拱形顶
    const archTop = mesh(G.tor(0.53, 0.07, 6, 24, Math.PI), M.gold, 0, 2.32, 0.05, false);
    g.add(archTop);
    // 两侧立柱
    [-1, 1].forEach((sx) => {
      g.add(mesh(G.box(0.1, 2.3, 0.16), M.gold, sx * 0.53, 1.2, 0.05));
      g.add(mesh(G.sph(0.09, 10), M.goldLt, sx * 0.53, 2.42, 0.05, false));
    });
    // 顶部小丑帽饰
    g.add(mesh(G.con(0.12, 0.3, 8), M.pink, 0, 2.55, 0.05, false));
  })();

  /* =========================================================
     木长椅 ×2
     ========================================================= */
  function bench(x, z, rot) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    const wood = M.wood;
    // 座板
    for (let i = 0; i < 3; i++) {
      g.add(mesh(G.box(1.9, 0.07, 0.15), wood, 0, 0.52, -0.18 + i * 0.17));
    }
    // 靠背
    for (let i = 0; i < 3; i++) {
      const b = mesh(G.box(1.9, 0.13, 0.07), wood, 0, 0.78 + i * 0.18, -0.3);
      b.rotation.x = -0.12;
      g.add(b);
    }
    // 铸铁腿
    [-1, 1].forEach((sx) => {
      g.add(mesh(G.box(0.08, 0.52, 0.08), M.iron, sx * 0.78, 0.26, 0.12));
      g.add(mesh(G.box(0.08, 0.52, 0.08), M.iron, sx * 0.78, 0.26, -0.26));
      const arm = mesh(G.tor(0.24, 0.035, 5, 12, Math.PI * 0.5), M.iron, sx * 0.78, 0.66, 0.1, false);
      g.add(arm);
      g.add(mesh(G.box(0.06, 0.5, 0.06), M.iron, sx * 0.78, 0.8, -0.3));
    });
    g.add(mesh(G.box(1.72, 0.05, 0.05), M.iron, 0, 0.2, 0.12, false));
    return g;
  }
  bench(-1.2, -9.0, 0.05);
  bench(4.3, 6.7, -2.5);

  /* =========================================================
     灯柱 + 三角彩旗
     ========================================================= */
  const lampPosts = [];
  function lampPost(x, z, h) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    const H = h || 3.3;
    g.add(mesh(G.cyl(0.14, 0.2, 0.36, 10), M.iron, 0, 0.18, 0));
    g.add(mesh(G.cyl(0.05, 0.09, H, 10), M.iron, 0, H / 2 + 0.2, 0));
    g.add(mesh(G.tor(0.11, 0.025, 5, 14), M.gold, 0, H * 0.42, 0, false));
    // 顶部灯球
    const globeMat = new THREE.MeshBasicMaterial({ color: srgb(0xffe0a8).multiplyScalar(1.9) });
    const globe = mesh(G.sph(0.17, 14), globeMat, 0, H + 0.32, 0, false);
    g.add(globe);
    g.add(mesh(G.cyl(0.06, 0.12, 0.14, 8), M.gold, 0, H + 0.16, 0, false));
    g.add(mesh(G.con(0.2, 0.16, 10), M.gold, 0, H + 0.5, 0, false));
    g.add(mesh(G.sph(0.05, 8), M.goldLt, 0, H + 0.6, 0, false));
    // 侧灯
    [-1, 1].forEach((sx) => {
      const arm = mesh(G.tor(0.22, 0.02, 5, 10, Math.PI * 0.55), M.iron, sx * 0.2, H - 0.05, 0, false);
      arm.rotation.z = sx > 0 ? -0.4 : Math.PI + 0.4;
      g.add(arm);
      const g2 = mesh(G.sph(0.1, 10), globeMat, sx * 0.42, H - 0.2, 0, false);
      g.add(g2);
    });
    // 底座装饰
    g.add(mesh(G.tor(0.16, 0.03, 5, 14), M.gold, 0, 0.4, 0, false));
    lampPosts.push(g);
    return g;
  }
  lampPost(-9.0, 5.6, 3.3);
  lampPost(9.0, 5.2, 3.3);
  lampPost(-2.5, -9.25, 3.1);
  lampPost(2.7, -9.25, 3.1);
  lampPost(-10.4, 9.9, 3.0);
  lampPost(10.5, 9.6, 3.0);

  /* 彩旗串 */
  (function bunting() {
    const flagColors = [0xff6f91, 0xffd166, 0x7be0d0, 0xb59bff, 0xfff0c8, 0xff9f6f];
    const mats = flagColors.map(
      (c) =>
        new THREE.MeshToonMaterial({
          color: srgb(c),
          gradientMap: APP.toonRamp,
          emissive: srgb(c).multiplyScalar(0.4),
          side: THREE.DoubleSide
        })
    );
    function line(a, b, sag, count, yOff) {
      const A = new THREE.Vector3(...a);
      const B = new THREE.Vector3(...b);
      const mid = A.clone().lerp(B, 0.5);
      mid.y -= sag;
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      // 绳
      const pts = curve.getPoints(30);
      const rope = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: srgb(0x2a2438) })
      );
      scene.add(rope);
      // 旗
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const p = curve.getPoint(t);
        const tan = curve.getTangent(t);
        const f = new THREE.Mesh(new THREE.BufferGeometry(), mats[i % mats.length]);
        const w = 0.23,
          h = 0.32;
        const g2 = new THREE.BufferGeometry();
        g2.setAttribute(
          'position',
          new THREE.BufferAttribute(
            new Float32Array([-w / 2, 0, 0, w / 2, 0, 0, 0, -h, 0]),
            3
          )
        );
        g2.computeVertexNormals();
        f.geometry = g2;
        f.position.copy(p);
        f.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
        f.material.side = THREE.DoubleSide;
        scene.add(f);
      }
    }
    line([-9.0, 3.5, 5.6], [9.0, 3.5, 5.2], 1.5, 26);
    line([-9.0, 3.4, 5.6], [-2.5, 3.3, -9.25], 1.9, 22);
    line([9.0, 3.4, 5.2], [2.7, 3.3, -9.25], 1.9, 22);
    line([-2.5, 3.2, -9.25], [2.7, 3.2, -9.25], 1.2, 14);
  })();

  /* =========================================================
     铸铁垃圾桶
     ========================================================= */
  function trashCan(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    g.add(mesh(G.cyl(0.26, 0.3, 0.62, 14), M.iron, 0, 0.31, 0));
    // 竖条
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.add(mesh(G.box(0.03, 0.6, 0.03), M.iron, Math.cos(a) * 0.28, 0.31, Math.sin(a) * 0.28, false));
    }
    g.add(mesh(G.tor(0.29, 0.035, 5, 18), M.gold, 0, 0.6, 0, false));
    g.add(mesh(G.tor(0.28, 0.03, 5, 18), M.gold, 0, 0.08, 0, false));
    g.add(mesh(G.cyl(0.3, 0.3, 0.06, 14), M.iron, 0, 0.66, 0));
    g.add(mesh(G.sph(0.1, 10), M.iron, 0, 0.73, 0, false));
    return g;
  }
  trashCan(-5.5, 6.9);
  trashCan(4.7, 6.3);

  /* =========================================================
     海边投币望远镜
     ========================================================= */
  (function telescope() {
    const g = new THREE.Group();
    g.position.set(-6.2, 0, 10.5);
    g.rotation.y = Math.PI + 0.35;
    scene.add(g);

    // 三脚架
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = mesh(G.cyl(0.035, 0.05, 1.15, 8), M.iron, Math.cos(a) * 0.22, 0.55, Math.sin(a) * 0.22);
      leg.rotation.x = Math.sin(a) * 0.26;
      leg.rotation.z = -Math.cos(a) * 0.26;
      g.add(leg);
    }
    g.add(mesh(G.cyl(0.09, 0.11, 0.12, 10), M.iron, 0, 1.12, 0));
    // 转台
    const head = new THREE.Group();
    head.position.y = 1.2;
    head.rotation.x = -0.28;
    g.add(head);
    // 镜筒
    const tube = mesh(G.cyl(0.15, 0.19, 0.95, 16), M.gold, 0, 0, 0);
    tube.rotation.x = Math.PI / 2;
    head.add(tube);
    outline(tube, 0.02);
    // 前圈
    const lens = mesh(G.cyl(0.2, 0.2, 0.1, 16), M.goldDk, 0, 0, 0.48, false);
    lens.rotation.x = Math.PI / 2;
    head.add(lens);
    const glassLens = mesh(G.cyl(0.16, 0.16, 0.03, 16), metal(0x9fd8ff, 0.05, 1.0), 0, 0, 0.53, false);
    glassLens.rotation.x = Math.PI / 2;
    head.add(glassLens);
    // 目镜
    const eye = mesh(G.cyl(0.09, 0.07, 0.14, 12), M.goldDk, 0, 0, -0.52, false);
    eye.rotation.x = Math.PI / 2;
    head.add(eye);
    // 投币盒
    head.add(mesh(G.box(0.2, 0.16, 0.12), M.iron, 0, -0.22, 0.1, false));
    head.add(mesh(G.box(0.1, 0.03, 0.03), M.goldLt, 0, -0.2, 0.17, false));
    // 把手
    [-1, 1].forEach((sx) => {
      const hd = mesh(G.cyl(0.03, 0.03, 0.2, 6), M.brass, sx * 0.2, -0.1, -0.3, false);
      head.add(hd);
    });

    // 望远镜里漏出的微光
    const beam = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: APP.glowTexture('rgba(190,230,255,0.5)', 'rgba(120,180,255,0.12)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    beam.scale.setScalar(1.2);
    beam.position.set(0, 0, 0.7);
    head.add(beam);
    g.scale.setScalar(1.28);
  })();

  /* =========================================================
     栈道杂物：木箱 / 酒桶 / 救生圈
     ========================================================= */
  (function boardwalkProps() {
    function crate(x, y, z, s, rot) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rot || 0;
      g.scale.setScalar(s || 1);
      const b = mesh(G.box(0.72, 0.72, 0.72), M.wood, 0, 0.36, 0);
      g.add(b);
      outline(b, 0.018);
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        g.add(mesh(G.box(0.05, 0.76, 0.76), M.woodDk, sx * 0.24, 0.36, 0, false));
      });
      g.add(mesh(G.box(0.76, 0.05, 0.76), M.woodDk, 0, 0.72, 0, false));
      g.add(mesh(G.box(0.76, 0.05, 0.76), M.woodDk, 0, 0.04, 0, false));
      scene.add(g);
      return g;
    }
    crate(9.4, 0, 10.6, 1, 0.4);
    crate(9.5, 0.74, 10.5, 0.8, -0.25);
    crate(-10.4, 0, 10.9, 0.9, 0.9);

    // 酒桶
    (function barrel() {
      const g = new THREE.Group();
      g.position.set(8.35, 0, 11.1);
      scene.add(g);
      const b = mesh(G.cyl(0.3, 0.34, 0.85, 14), M.wood, 0, 0.42, 0);
      g.add(b);
      outline(b, 0.02);
      [0.12, 0.42, 0.72].forEach((y) => {
        const r = mesh(G.tor(0.33, 0.03, 5, 16), M.goldDk, 0, y, 0, false);
        r.rotation.x = Math.PI / 2;
        g.add(r);
      });
      g.add(mesh(G.cyl(0.3, 0.3, 0.05, 14), M.woodDk, 0, 0.86, 0, false));
    })();

    // 救生圈
    (function ring() {
      const g = new THREE.Group();
      g.position.set(7.6, 1.0, 8.46);
      g.rotation.x = -0.12;
      scene.add(g);
      g.add(mesh(G.tor(0.3, 0.1, 8, 24), M.cream, 0, 0, 0, false));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const seg = mesh(G.tor(0.3, 0.105, 6, 8, Math.PI / 4), M.red, 0, 0, 0, false);
        seg.rotation.z = a;
        g.add(seg);
      }
    })();
  })();

  /* =========================================================
     拱门旁的花盆
     ========================================================= */
  [[-3.95, 8.0], [3.95, 8.0], [-8.6, 6.9], [8.6, 6.6]].forEach(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    g.add(mesh(G.cyl(0.28, 0.22, 0.42, 12), M.cream, 0, 0.21, 0));
    g.add(mesh(G.tor(0.28, 0.04, 5, 14), M.gold, 0, 0.42, 0, false));
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.2;
      const h = 0.5 + Math.random() * 0.3;
      g.add(mesh(G.sph(0.06, 6), toon(0x5fae63), Math.cos(a) * r, h, Math.sin(a) * r, false));
      if (i % 3 === 0) {
        g.add(mesh(G.sph(0.055, 6), i % 2 ? M.pink : M.cream, Math.cos(a) * r * 1.3, h + 0.12, Math.sin(a) * r * 1.3, false));
      }
    }
  });
})();
