/* =========================================================
   04 · 售票亭 / 甜品小食摊 / CARNIVAL 霓虹拱门
   ========================================================= */
(function () {
  'use strict';
  const APP = window.APP;
  const { scene, mesh, G, M, C, toon, metal, gloss, srgb, outline, Bulbs, ringPoints } = APP;

  /* ---------------- 通用：四面玻璃小屋 ---------------- */
  function glassShell(w, d, h, bodyMat, trimMat, sillH) {
    const g = new THREE.Group();
    const sill = sillH === undefined ? 0.85 : sillH;
    const topH = 0.34;
    for (let k = 0; k < 4; k++) {
      const even = k % 2 === 0;
      const ww = even ? w : d;
      const dep = even ? d : w;
      const s = new THREE.Group();
      s.rotation.y = (k * Math.PI) / 2;
      const zz = dep / 2;

      // 下裙板
      const base = mesh(G.box(ww - 0.12, sill, 0.1), bodyMat, 0, sill / 2, zz - 0.05);
      s.add(base);
      outline(base, 0.02);
      // 金色腰线
      s.add(mesh(G.box(ww - 0.1, 0.06, 0.13), trimMat, 0, sill, zz - 0.05, false));
      // 上楣
      const top = mesh(G.box(ww - 0.12, topH, 0.1), bodyMat, 0, h - topH / 2, zz - 0.05);
      s.add(top);
      outline(top, 0.02);
      // 玻璃
      const gh = h - sill - topH;
      const gl = mesh(G.pla(ww - 0.3, gh), M.glass, 0, sill + gh / 2, zz - 0.02, false);
      gl.userData.skipOutline = true;
      s.add(gl);
      // 金色窗棂
      s.add(mesh(G.box(ww - 0.3, 0.045, 0.05), trimMat, 0, sill + gh * 0.62, zz - 0.02, false));
      s.add(mesh(G.box(0.045, gh, 0.05), trimMat, 0, sill + gh / 2, zz - 0.02, false));
      s.add(mesh(G.box(ww - 0.3, 0.05, 0.07), trimMat, 0, sill + gh + 0.02, zz - 0.02, false));
      g.add(s);
    }
    // 四角柱
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const post = mesh(G.box(0.16, h, 0.16), bodyMat, (sx * (w - 0.16)) / 2, h / 2, (sz * (d - 0.16)) / 2);
      g.add(post);
      outline(post, 0.02);
      // 柱头金饰
      g.add(mesh(G.box(0.22, 0.1, 0.22), trimMat, (sx * (w - 0.16)) / 2, h - 0.05, (sz * (d - 0.16)) / 2, false));
      g.add(mesh(G.sph(0.09, 8), trimMat, (sx * (w - 0.16)) / 2, h + 0.06, (sz * (d - 0.16)) / 2, false));
    });
    return g;
  }

  /* =========================================================
     售票亭
     ========================================================= */
  (function ticketBooth() {
    const g = new THREE.Group();
    g.position.set(-7.2, 0, 4.25);
    g.rotation.y = 0.62;
    scene.add(g);

    const W = 3.1,
      D = 2.6,
      H = 2.55;

    // 台基
    g.add(mesh(G.box(W + 0.4, 0.22, D + 0.4), M.woodDk, 0, 0.11, 0));
    g.add(mesh(G.box(W + 0.28, 0.08, D + 0.28), M.gold, 0, 0.25, 0, false));
    const deck = mesh(G.box(W + 0.2, 0.1, D + 0.2), M.wood, 0, 0.3, 0);
    g.add(deck);

    const body = glassShell(W, D, H, M.cream, M.gold);
    body.position.y = 0.34;
    g.add(body);

    // 内部：柜台
    g.add(mesh(G.box(W - 0.5, 0.09, 0.5), M.wood, 0, 0.34 + 0.95, D / 2 - 0.42));
    g.add(mesh(G.box(W - 0.44, 0.16, 0.56), M.gold, 0, 0.34 + 0.86, D / 2 - 0.42, false));

    // 内部：彩色入场券卷轴架
    (function rollRack() {
      const r = new THREE.Group();
      r.position.set(-0.78, 0.34, -0.5);
      g.add(r);
      // 黄铜框
      [-0.42, 0.42].forEach((x) => {
        r.add(mesh(G.cyl(0.028, 0.028, 1.1, 8), M.brass, x, 0.55, 0, false));
      });
      [0.15, 0.62, 1.06].forEach((y) => {
        const rod = mesh(G.cyl(0.022, 0.022, 0.86, 8), M.brass, 0, y, 0, false);
        rod.rotation.z = Math.PI / 2;
        r.add(rod);
      });
      // 券卷
      const cols = [0xff6f91, 0x5fd6c8, 0xffd166, 0xb59bff, 0xff9f6f];
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 4; i++) {
          const y = [0.15, 0.62, 1.06][row];
          const x = -0.33 + i * 0.22;
          const roll = mesh(G.cyl(0.075, 0.075, 0.19, 10), toon(cols[(row * 4 + i) % 5]), x, y, 0, false);
          roll.rotation.z = Math.PI / 2;
          r.add(roll);
          const paper = mesh(G.box(0.16, 0.02, 0.13), M.cream, x + 0.02, y - 0.09, 0.02, false);
          r.add(paper);
        }
      }
    })();

    // 内部：老式黄铜出票机
    (function machine() {
      const m = new THREE.Group();
      m.position.set(0.72, 0.34 + 0.99, 0.52);
      g.add(m);
      m.add(mesh(G.box(0.46, 0.34, 0.32), M.gold, 0, 0, 0));
      m.add(mesh(G.box(0.5, 0.06, 0.36), M.goldLt, 0, 0.19, 0, false));
      // 出票口
      m.add(mesh(G.box(0.26, 0.05, 0.02), M.navy, 0, -0.02, 0.17, false));
      const ticket = mesh(G.box(0.2, 0.11, 0.01), M.cream, 0, -0.09, 0.19, false);
      ticket.rotation.x = 0.35;
      m.add(ticket);
      // 摇柄
      m.add(mesh(G.cyl(0.02, 0.02, 0.2, 6), M.brass, 0.28, 0.02, 0, false));
      m.add(mesh(G.sph(0.05, 8), M.brass, 0.28, 0.14, 0, false));
      // 小圆表盘
      const dial = mesh(G.cyl(0.07, 0.07, 0.02, 12), M.cream, -0.1, 0.08, 0.17, false);
      dial.rotation.x = Math.PI / 2;
      m.add(dial);
    })();

    // 内部：毛绒玩具货架
    (function plush() {
      const s = new THREE.Group();
      s.position.set(0.1, 0.34, -0.72);
      g.add(s);
      // 背板
      s.add(mesh(G.box(1.5, 1.5, 0.06), M.pinkDk, 0, 0.78, -0.16, false));
      [0.12, 0.72, 1.32].forEach((y) => {
        s.add(mesh(G.box(1.5, 0.06, 0.3), M.wood, 0, y, 0, false));
        s.add(mesh(G.box(1.52, 0.03, 0.32), M.gold, 0, y + 0.03, 0, false));
      });

      const bear = (x, y, col, sc) => {
        const b = new THREE.Group();
        b.position.set(x, y, 0.02);
        b.scale.setScalar(sc || 1);
        const mat = toon(col);
        const body = mesh(G.sph(0.1, 10), mat, 0, 0.1, 0, false);
        body.scale.set(1, 1.1, 0.9);
        b.add(body);
        const head = mesh(G.sph(0.085, 10), mat, 0, 0.25, 0, false);
        b.add(head);
        [-1, 1].forEach((sz) => {
          b.add(mesh(G.sph(0.035, 8), mat, sz * 0.07, 0.31, 0, false));
          b.add(mesh(G.sph(0.04, 8), mat, sz * 0.09, 0.08, 0.02, false));
        });
        b.add(mesh(G.sph(0.03, 8), M.cream, 0, 0.235, 0.07, false));
        b.add(mesh(G.sph(0.014, 6), M.navy, 0.03, 0.27, 0.075, false));
        b.add(mesh(G.sph(0.014, 6), M.navy, -0.03, 0.27, 0.075, false));
        s.add(b);
      };
      const bunny = (x, y, col, sc) => {
        const b = new THREE.Group();
        b.position.set(x, y, 0.02);
        b.scale.setScalar(sc || 1);
        const mat = toon(col);
        const body = mesh(G.sph(0.09, 10), mat, 0, 0.09, 0, false);
        body.scale.set(1, 1.05, 0.9);
        b.add(body);
        b.add(mesh(G.sph(0.075, 10), mat, 0, 0.22, 0, false));
        [-1, 1].forEach((sz) => {
          const ear = mesh(G.cyl(0.022, 0.016, 0.16, 8), mat, sz * 0.035, 0.33, 0, false);
          ear.rotation.z = sz * 0.16;
          b.add(ear);
        });
        b.add(mesh(G.sph(0.026, 8), M.pink, 0, 0.205, 0.062, false));
        b.add(mesh(G.sph(0.012, 6), M.navy, 0.028, 0.24, 0.065, false));
        b.add(mesh(G.sph(0.012, 6), M.navy, -0.028, 0.24, 0.065, false));
        s.add(b);
      };

      bear(-0.55, 0.18, 0xb07a4a, 1);
      bear(-0.24, 0.18, 0xe8b0c0, 0.92);
      bunny(0.12, 0.18, 0xfff6ea, 1);
      bear(0.46, 0.18, 0x8fb8e0, 0.95);
      bear(-0.5, 0.78, 0xffd9a0, 1.1);
      bunny(-0.16, 0.78, 0xd8c0ff, 1.05);
      bear(0.26, 0.78, 0xf0a0a0, 0.9);
      bunny(0.56, 0.78, 0xa8e0d0, 0.95);
      bear(-0.36, 1.4, 0xf7c8dd, 1.2);
      bunny(0.06, 1.4, 0xfff0c8, 1.15);
      bear(0.46, 1.4, 0xc8b0f0, 1.1);
    })();

    // 屋顶：条纹尖顶
    const roofY = 0.34 + H;
    const roof = new THREE.Group();
    g.add(roof);
    const roofCone = mesh(
      G.cyl(0.16, 2.45, 1.55, 20, true),
      new THREE.MeshToonMaterial({
        map: APP.stripeTexture('#cf2f39', '#ffeccb', 20, true),
        gradientMap: APP.toonRamp
      }),
      0,
      roofY + 0.72,
      0
    );
    roof.add(roofCone);
    outline(roofCone, 0.04);
    // 屋檐金圈
    const eave = mesh(G.tor(2.45, 0.07, 8, 48), M.gold, 0, roofY - 0.02, 0);
    eave.rotation.x = Math.PI / 2;
    roof.add(eave);
    // 波浪垂帘
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const p = new THREE.Group();
      p.rotation.y = -a;
      const sc = mesh(G.sph(0.15, 8), i % 2 ? M.cream : M.red, 0, roofY - 0.16, 2.4, false);
      sc.scale.set(1, 0.75, 0.5);
      p.add(sc);
      roof.add(p);
    }
    // 顶饰
    roof.add(mesh(G.sph(0.15, 12), M.gold, 0, roofY + 1.55, 0));
    roof.add(mesh(G.cyl(0.05, 0.05, 0.4, 6), M.gold, 0, roofY + 1.8, 0, false));
    // 小旗
    const flag = mesh(G.pla(0.5, 0.3), toon(0xff6f91), 0.25, roofY + 1.95, 0, false);
    flag.material.side = THREE.DoubleSide;
    roof.add(flag);

    // 灯泡环
    const b1 = new Bulbs(ringPoints(24, 2.46, roofY - 0.05, 0, 0), 0.06, 0xffd28a);
    roof.add(b1.mesh);
    APP.bulbs.push(b1);

    // 招牌
    const sign = new THREE.Mesh(
      G.pla(1.85, 0.5),
      new THREE.MeshBasicMaterial({
        map: APP.textTexture('TICKETS', {
          w: 1024,
          h: 280,
          font: 'bold 150px Georgia, serif',
          color: '#fff6d8',
          glow: '#ff5fae',
          bg: '#20122e',
          border: '#e9b44e',
          letterSpacing: 6
        }),
        transparent: true,
        depthWrite: false
      })
    );
    sign.position.set(0, roofY - 0.45, 1.55);
    sign.rotation.x = -0.12;
    roof.add(sign);

    // 门口的立牌
    const board = new THREE.Group();
    board.position.set(1.1, 0, 1.55);
    board.rotation.y = -0.25;
    g.add(board);
    board.add(mesh(G.box(0.06, 0.9, 0.06), M.woodDk, -0.22, 0.45, 0, false));
    board.add(mesh(G.box(0.06, 0.9, 0.06), M.woodDk, 0.22, 0.45, 0, false));
    const boardFace = mesh(G.pla(0.62, 0.5), M.cream, 0, 0.72, 0.03, false);
    board.add(boardFace);
    board.add(mesh(G.box(0.68, 0.56, 0.04), M.gold, 0, 0.72, 0, false));

    APP.booth1 = g;
  })();

  /* =========================================================
     甜品 · 小食摊
     ========================================================= */
  (function sweetStand() {
    const g = new THREE.Group();
    g.position.set(7.0, 0, 4.6);
    g.rotation.y = -0.58;
    scene.add(g);

    const W = 3.4,
      D = 2.7,
      H = 2.5;

    g.add(mesh(G.box(W + 0.44, 0.24, D + 0.44), M.woodDk, 0, 0.12, 0));
    g.add(mesh(G.box(W + 0.3, 0.09, D + 0.3), M.gold, 0, 0.27, 0, false));

    const body = glassShell(W, D, H, M.pink, M.gold, 0.95);
    body.position.y = 0.32;
    g.add(body);

    // 内部：柜台
    const counterY = 0.32 + 0.95;
    g.add(mesh(G.box(W - 0.5, 0.1, 0.6), M.cream, 0, counterY, D / 2 - 0.5));
    g.add(mesh(G.box(W - 0.44, 0.12, 0.66), M.teal, 0, counterY - 0.1, D / 2 - 0.5, false));

    // 内部：玻璃展示柜
    (function display() {
      const c = new THREE.Group();
      c.position.set(-0.55, counterY + 0.05, D / 2 - 0.5);
      g.add(c);
      const cw = 1.9,
        ch = 0.75,
        cd = 0.55;
      // 底
      c.add(mesh(G.box(cw, 0.05, cd), M.cream, 0, 0.02, 0, false));
      // 玻璃罩
      c.add(mesh(G.box(cw, ch, 0.02), M.glass, 0, ch / 2, -cd / 2, false));
      c.add(mesh(G.box(cw, ch, 0.02), M.glass, 0, ch / 2, cd / 2, false));
      c.add(mesh(G.box(0.02, ch, cd), M.glass, -cw / 2, ch / 2, 0, false));
      c.add(mesh(G.box(0.02, ch, cd), M.glass, cw / 2, ch / 2, 0, false));
      c.add(mesh(G.box(cw, 0.02, cd), M.glass, 0, ch, 0, false));
      // 金色边框
      [-cw / 2, cw / 2].forEach((x) => {
        c.add(mesh(G.box(0.05, ch + 0.06, 0.05), M.gold, x, ch / 2, -cd / 2, false));
        c.add(mesh(G.box(0.05, ch + 0.06, 0.05), M.gold, x, ch / 2, cd / 2, false));
      });
      c.add(mesh(G.box(cw + 0.06, 0.05, cd + 0.06), M.gold, 0, ch + 0.02, 0, false));

      // 爆米花堆
      const pc = [0xffe9a8, 0xffd97a, 0xfff6d0];
      for (let i = 0; i < 48; i++) {
        const x = (Math.random() - 0.5) * (cw - 0.2);
        const z = (Math.random() - 0.5) * (cd - 0.2);
        const y = 0.06 + Math.random() * 0.2 * (1 - Math.abs(x) / (cw / 2));
        const s = 0.035 + Math.random() * 0.03;
        const p = mesh(G.sph(s, 6), toon(pc[i % 3]), x, y, z, false);
        p.scale.set(1, 0.85, 1);
        c.add(p);
      }
      // 苹果糖
      for (let i = 0; i < 7; i++) {
        const x = -0.72 + i * 0.24;
        const stick = mesh(G.cyl(0.012, 0.012, 0.3, 5), M.woodDk, x, 0.35, 0.14, false);
        c.add(stick);
        const apple = mesh(G.sph(0.085, 12), gloss(0xd21f3c, 0.08), x, 0.55, 0.14, false);
        c.add(apple);
        const shine = mesh(G.sph(0.022, 6), M.cream, x - 0.03, 0.6, 0.2, false);
        c.add(shine);
      }
      // 彩色冰沙机
      const ice = new THREE.Group();
      ice.position.set(0.62, 0, -0.05);
      c.add(ice);
      ice.add(mesh(G.cyl(0.13, 0.15, 0.3, 12), M.cream, 0, 0.15, 0, false));
      const dome = mesh(G.sph(0.15, 12), toon(0x9be3ff), 0, 0.34, 0, false);
      dome.scale.set(1, 0.7, 1);
      ice.add(dome);
      ice.add(mesh(G.cyl(0.03, 0.03, 0.22, 6), M.gold, 0, 0.5, 0, false));
      const sw = mesh(G.sph(0.05, 8), M.pink, 0.14, 0.28, 0.05, false);
      ice.add(sw);
    })();

    // 内部：爆米花机
    (function popper() {
      const p = new THREE.Group();
      p.position.set(1.0, counterY + 0.05, -0.55);
      g.add(p);
      p.add(mesh(G.box(0.7, 0.7, 0.7), M.red, 0, 0.35, 0));
      outline(p.children[0], 0.02);
      p.add(mesh(G.box(0.74, 0.06, 0.74), M.gold, 0, 0.72, 0, false));
      // 玻璃箱
      p.add(mesh(G.box(0.56, 0.5, 0.56), M.glass, 0, 0.5, 0, false));
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 0.44;
        const z = (Math.random() - 0.5) * 0.44;
        const y = 0.25 + Math.random() * 0.3;
        p.add(mesh(G.sph(0.03, 6), toon(0xffeaa8), x, y, z, false));
      }
      p.add(mesh(G.cyl(0.05, 0.05, 0.2, 8), M.gold, 0, 0.8, 0, false));
      p.add(mesh(G.sph(0.09, 8), M.goldLt, 0, 0.92, 0, false));
    })();

    // 内部：糖果罐货架
    (function jars() {
      const s = new THREE.Group();
      s.position.set(0, 0.32, -0.85);
      g.add(s);
      s.add(mesh(G.box(2.3, 0.07, 0.34), M.wood, 0, 1.35, 0, false));
      s.add(mesh(G.box(2.3, 0.07, 0.34), M.wood, 0, 0.85, 0, false));
      const cols = [0xff8fb8, 0x8fe0d0, 0xffd166, 0xb59bff, 0xff9f6f, 0x9be3ff];
      for (let i = 0; i < 6; i++) {
        const x = -0.95 + i * 0.38;
        [1.39, 0.89].forEach((y, row) => {
          const jar = new THREE.Group();
          jar.position.set(x, y, 0);
          s.add(jar);
          jar.add(mesh(G.cyl(0.1, 0.11, 0.2, 10), M.glassThick, 0, 0.1, 0, false));
          jar.add(mesh(G.cyl(0.085, 0.095, 0.14, 10), toon(cols[(i + row * 2) % 6]), 0, 0.09, 0, false));
          jar.add(mesh(G.cyl(0.105, 0.105, 0.03, 10), M.gold, 0, 0.21, 0, false));
        });
      }
    })();

    // 条纹遮阳篷（带布料弧度）
    const awn = new THREE.Group();
    awn.position.y = 0.32 + H;
    g.add(awn);
    const awnMat = new THREE.MeshToonMaterial({
      map: APP.stripeTexture('#e0679a', '#ffeccb', 12, true),
      gradientMap: APP.toonRamp,
      side: THREE.DoubleSide
    });
    const aw = W + 0.36,
      ad = 1.45,
      th = -0.78;
    const awnGeo = G.pla(aw, ad, 16, 6);
    const ap = awnGeo.attributes.position;
    for (let i = 0; i < ap.count; i++) {
      const x = ap.getX(i),
        y = ap.getY(i);
      const u = x / (aw / 2);
      ap.setZ(i, -0.1 * (1 - u * u) - Math.sin(((y + ad / 2) / ad) * Math.PI) * 0.035);
    }
    awnGeo.computeVertexNormals();
    const awnPlane = new THREE.Mesh(awnGeo, awnMat);
    awnPlane.position.set(0, 0.3, D / 2 + 0.42);
    awnPlane.rotation.x = th;
    awn.add(awnPlane);

    // 前缘垂幔
    const eY = 0.3 + Math.cos(th) * (-ad / 2);
    const eZ = D / 2 + 0.42 + Math.sin(-th) * (ad / 2);
    for (let i = 0; i < 20; i++) {
      const x = -(aw / 2) + (i + 0.5) * (aw / 20);
      const sc = mesh(G.sph(0.125, 8), i % 2 ? M.cream : M.pink, x, eY - 0.07, eZ, false);
      sc.scale.set(1, 0.9, 0.45);
      awn.add(sc);
    }
    // 篷骨
    for (let i = 1; i < 4; i++) {
      const x = -(aw / 2) + (i * aw) / 4;
      const rib = mesh(G.box(0.035, 0.035, ad), M.cream, x, 0.3, D / 2 + 0.42, false);
      rib.rotation.x = th;
      awn.add(rib);
    }

    // 顶盖
    awn.add(mesh(G.box(W + 0.3, 0.16, D + 0.3), M.cream, 0, 0.05, 0));
    // 屋顶金边（四条，不做整片金属板）
    [1, -1].forEach((sz) => {
      awn.add(mesh(G.box(W + 0.42, 0.07, 0.09), M.gold, 0, 0.15, (sz * (D + 0.36)) / 2, false));
      awn.add(mesh(G.box(0.09, 0.07, D + 0.42), M.gold, (sz * (W + 0.36)) / 2, 0.15, 0, false));
    });
    // 屋脊装饰
    awn.add(mesh(G.cyl(0.16, 0.2, 0.3, 12), M.gold, 0, 0.3, -D / 2 + 0.2, false));
    awn.add(mesh(G.sph(0.14, 12), M.goldLt, 0, 0.52, -D / 2 + 0.2, false));

    // 灯泡
    const pos = [];
    for (let i = 0; i < 18; i++) {
      const x = -(aw / 2) + (i + 0.5) * (aw / 18);
      pos.push({ x, y: eY + 0.02, z: eZ });
    }
    const b2 = new Bulbs(pos, 0.055, 0xffd28a);
    awn.add(b2.mesh);
    APP.bulbs.push(b2);

    // 吊挂招牌
    const sign = new THREE.Mesh(
      G.pla(1.55, 0.44),
      new THREE.MeshBasicMaterial({
        map: APP.textTexture('SWEETS', {
          w: 1024,
          h: 280,
          font: 'bold 150px Georgia, serif',
          color: '#fff6d8',
          glow: '#ff8fd0',
          letterSpacing: 6
        }),
        transparent: true,
        depthWrite: false
      })
    );
    sign.position.set(0, 2.42, D / 2 + 0.42);
    g.add(sign);
    [-1, 1].forEach((sx) => {
      g.add(mesh(G.cyl(0.012, 0.012, 0.28, 4), M.gold, sx * 0.66, 2.78, D / 2 + 0.42, false));
    });

    // 门口小黑板
    const board = new THREE.Group();
    board.position.set(-1.3, 0, 1.6);
    board.rotation.y = 0.3;
    g.add(board);
    board.add(mesh(G.box(0.7, 0.9, 0.05), M.woodDk, 0, 0.45, 0));
    board.add(mesh(G.pla(0.58, 0.76), toon(0x2a2438), 0, 0.45, 0.031, false));
    board.add(mesh(G.box(0.74, 0.08, 0.08), M.wood, 0, 0.9, 0, false));

    APP.booth2 = g;
  })();

  /* =========================================================
     CARNIVAL 霓虹拱门
     ========================================================= */
  (function arch() {
    const g = new THREE.Group();
    g.position.set(0, 0, 9.35);
    scene.add(g);

    const R = 3.35;
    const pillarH = 4.5;

    [-1, 1].forEach((sx) => {
      const p = new THREE.Group();
      p.position.set(sx * R, 0, 0);
      g.add(p);
      // 基座
      p.add(mesh(G.box(0.9, 0.3, 0.9), M.goldDk, 0, 0.15, 0));
      p.add(mesh(G.box(0.78, 0.14, 0.78), M.gold, 0, 0.37, 0, false));
      // 柱身
      const col = mesh(G.cyl(0.26, 0.3, pillarH - 0.4, 12), M.cream, 0, 0.44 + (pillarH - 0.4) / 2, 0);
      p.add(col);
      outline(col, 0.025);
      // 金色环
      for (let i = 0; i < 4; i++) {
        const ring = mesh(G.tor(0.3, 0.035, 6, 16), M.gold, 0, 0.9 + i * 0.95, 0, false);
        ring.rotation.x = Math.PI / 2;
        p.add(ring);
      }
      // 柱头
      p.add(mesh(G.box(0.62, 0.18, 0.62), M.gold, 0, pillarH - 0.06, 0, false));
      p.add(mesh(G.sph(0.16, 10), M.goldLt, 0, pillarH + 0.12, 0, false));
    });

    // 拱
    const arc = mesh(G.tor(R, 0.16, 8, 60, Math.PI), M.cream, 0, pillarH, 0);
    arc.rotation.z = 0;
    g.add(arc);
    outline(arc, 0.05);
    const arcGold = mesh(G.tor(R, 0.055, 6, 60, Math.PI), M.gold, 0, pillarH, 0.0);
    arcGold.scale.set(1, 1, 1);
    arcGold.position.z = 0.19;
    g.add(arcGold);
    const arcGold2 = mesh(G.tor(R, 0.055, 6, 60, Math.PI), M.gold, 0, pillarH, -0.19);
    g.add(arcGold2);

    // 霓虹灯管（内圈）
    const neonMat = APP.emissive(0xff5fae, 1.45);
    const neon = mesh(G.tor(R - 0.42, 0.045, 6, 60, Math.PI), neonMat, 0, pillarH, 0.2, false);
    g.add(neon);
    const neon2 = mesh(G.tor(R - 0.42, 0.045, 6, 60, Math.PI), neonMat, 0, pillarH, -0.2, false);
    g.add(neon2);

    // 拱上的灯泡
    const pos = [];
    for (let i = 0; i <= 26; i++) {
      const a = (i / 26) * Math.PI;
      pos.push({ x: Math.cos(a) * (R + 0.02), y: pillarH + Math.sin(a) * (R + 0.02), z: 0 });
    }
    const arcBulbs = new Bulbs(pos, 0.075, 0xffcf82);
    g.add(arcBulbs.mesh);
    APP.bulbs.push(arcBulbs);
    // 柱上的灯泡
    const pos2 = [];
    [-1, 1].forEach((sx) => {
      for (let i = 0; i < 9; i++) {
        pos2.push({ x: sx * (R + 0.32), y: 0.8 + i * 0.42, z: 0 });
      }
    });
    const colBulbs = new Bulbs(pos2, 0.065, 0xffb8e0);
    g.add(colBulbs.mesh);
    APP.bulbs.push(colBulbs);

    // CARNIVAL 文字
    const textMat = new THREE.MeshBasicMaterial({
      map: APP.textTexture('CARNIVAL', {
        w: 1400,
        h: 300,
        font: 'bold 180px Georgia, serif',
        color: '#fff6d8',
        glow: '#ff3f9e',
        bg: '#170e2c',
        border: '#e9b44e',
        letterSpacing: 10
      }),
      transparent: true,
      depthWrite: false
    });
    const txt = new THREE.Mesh(G.pla(4.2, 0.9), textMat);
    txt.position.set(0, pillarH + 2.25, 0.26);
    g.add(txt);
    const txt2 = txt.clone();
    txt2.position.z = -0.26;
    txt2.rotation.y = Math.PI;
    g.add(txt2);

    // 柱身垂幔
    [-1, 1].forEach((sx) => {
      const ban = mesh(G.pla(0.42, 1.5), toon(0xff6f91), sx * (R + 0.3), 3.2, 0, false);
      ban.material.side = THREE.DoubleSide;
      g.add(ban);
      const tip = new THREE.Mesh(
        new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array([-0.21, 0, 0, 0.21, 0, 0, 0, -0.4, 0]), 3)
        ),
        toon(0xff6f91)
      );
      tip.material.side = THREE.DoubleSide;
      tip.position.set(sx * (R + 0.3), 2.45, 0);
      g.add(tip);
    });

    // 拱顶旗
    g.add(mesh(G.cyl(0.04, 0.04, 0.9, 6), M.gold, 0, pillarH + R + 0.4, 0, false));
    const flag = mesh(G.pla(0.8, 0.5), toon(0xffd166), 0.4, pillarH + R + 0.65, 0, false);
    flag.material.side = THREE.DoubleSide;
    g.add(flag);

    APP.arch = g;
  })();
})();
