/* =========================================================
   props.js — 甲板上的天际航行道具
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;
  const P = (APP.Props = {});

  const M = {};

  function mats() {
    M.brass = U.std(0xc9a227, { metalness: 1, roughness: 0.28, env: 1.4 });
    M.brassD = U.std(0x8a6a22, { metalness: 1, roughness: 0.42 });
    M.copper = U.std(0x9c6b3a, { metalness: 1, roughness: 0.4 });
    M.iron = U.std(0x33383f, { metalness: 0.85, roughness: 0.5 });
    M.wood = U.toon(0xffffff, { map: U.tex(U.plankTex('#8f3b24', '#3d1409', 7), 2, 2) });
    M.woodDark = U.toon(0x4a1c10);
    M.rope = U.toon(0xb08a5a);
    M.canvas = U.toon(0xf2ead8);
    M.kraft = U.toon(0xffffff, { map: U.tex(U.kraftTex(), 1, 1) });
  }

  /* ---------------- 望远镜 ---------------- */
  function telescope() {
    const g = new THREE.Group();
    g.add(U.cyl(0.34, 0.4, 0.08, 12, M.woodDark, 0, 0.04, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = U.cyl(0.028, 0.04, 1.5, 6, M.woodDark, Math.cos(a) * 0.22, 0.75, Math.sin(a) * 0.22);
      leg.rotation.z = -Math.cos(a) * 0.18;
      leg.rotation.x = Math.sin(a) * 0.18;
      leg.castShadow = true;
      g.add(leg);
    }
    g.add(U.cyl(0.05, 0.07, 0.3, 8, M.brassD, 0, 1.6, 0));
    const head = new THREE.Group();
    head.position.set(0, 1.72, 0);
    head.rotation.x = -0.62;
    head.rotation.y = 0.5;
    head.add(U.cyl(0.11, 0.13, 1.05, 14, M.brass, 0, 0.2, 0));
    head.add(U.cyl(0.15, 0.15, 0.16, 14, M.brassD, 0, 0.72, 0));
    head.add(U.cyl(0.14, 0.14, 0.05, 14, M.copper, 0, 0.8, 0));
    head.add(U.cyl(0.08, 0.1, 0.3, 12, M.brass, 0, -0.32, 0));
    head.add(U.cyl(0.07, 0.07, 0.08, 12, M.iron, 0, -0.5, 0));
    head.add(U.tor(0.115, 0.022, M.brassD, 0, 0.55, 0));
    head.add(U.tor(0.115, 0.022, M.brassD, 0, -0.1, 0));
    // 目镜反光
    const lens = U.mesh(new THREE.CircleGeometry(0.065, 14), M.iron, 0, -0.545, 0);
    lens.rotation.x = Math.PI / 2;
    head.add(lens);
    g.add(head);
    P.telescopeHead = head;
    return g;
  }

  /* ---------------- 机械信天翁 ---------------- */
  function albatross() {
    const g = new THREE.Group();
    // 身体
    const body = U.sph(0.26, M.brass, 0, 0, 0, 1.55, 0.78, 0.78);
    g.add(body);
    g.add(U.sph(0.13, M.brass, 0.38, 0.09, 0));
    // 喙
    const beak = U.mesh(new THREE.ConeGeometry(0.045, 0.26, 6), M.copper, 0.58, 0.06, 0);
    beak.rotation.z = -Math.PI / 2;
    g.add(beak);
    // 眼
    for (const s of [-1, 1]) {
      g.add(U.sph(0.026, M.iron, 0.44, 0.12, s * 0.08));
    }
    // 翅膀
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.5, 0.16, 1.0, 0.02);
    wingShape.quadraticCurveTo(0.7, -0.12, 0.42, -0.2);
    wingShape.quadraticCurveTo(0.2, -0.18, 0, -0.12);
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.03, bevelEnabled: false });
    for (const s of [-1, 1]) {
      const holder = new THREE.Group();
      holder.position.set(-0.02, 0.12, s * 0.07);
      holder.rotation.x = -s * 0.3;
      holder.rotation.y = -s * 0.12;
      const w = new THREE.Mesh(wingGeo, M.brass);
      w.rotation.y = -s * Math.PI / 2;
      w.castShadow = true;
      holder.add(w);
      // 羽片分割线
      for (let i = 1; i < 4; i++) {
        const rib = U.box(0.012, 0.014, 0.34 - i * 0.03, M.brassD, 0.34 + i * 0.17, 0.005, 0);
        rib.rotation.y = 0;
        holder.add(rib);
      }
      g.add(holder);
    }
    // 尾
    const tail = U.box(0.3, 0.03, 0.22, M.brass, -0.42, 0.02, 0);
    g.add(tail);
    // 底座
    g.add(U.cyl(0.16, 0.2, 0.05, 10, M.brassD, 0, -0.22, 0));
    g.add(U.cyl(0.035, 0.035, 0.3, 6, M.brassD, 0, -0.36, 0));
    g.scale.set(1.15, 1.15, 1.15);
    return g;
  }

  /* ---------------- 风向袋 ---------------- */
  function windsock() {
    const g = new THREE.Group();
    const pole = U.cyl(0.05, 0.07, 3.1, 8, M.woodDark, 0, 1.55, 0);
    pole.castShadow = true;
    g.add(pole);
    g.add(U.sph(0.08, M.brass, 0, 3.12, 0));
    g.add(U.tor(0.16, 0.03, M.brassD, 0, 2.95, 0).rotateX(Math.PI / 2));

    const holder = new THREE.Group();
    holder.position.set(0, 2.9, 0);
    const seg = 12, rings = 8, len = 1.9;
    const r0 = 0.24, r1 = 0.1;
    const pos = [], col = [], idx = [];
    const cRed = new THREE.Color(0xc0442c), cWhite = new THREE.Color(0xf0e6cf), cGold = new THREE.Color(0xd8a33c);
    for (let i = 0; i <= rings; i++) {
      const t = i / rings;
      const r = r0 + (r1 - r0) * t;
      const x = t * len;
      const c = (i < 3) ? cRed : (i < 5 ? cWhite : (i < 7 ? cGold : cRed));
      for (let j = 0; j <= seg; j++) {
        const a = (j / seg) * Math.PI * 2;
        pos.push(x, Math.sin(a) * r, Math.cos(a) * r);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < seg; j++) {
        const a0 = i * (seg + 1) + j, b0 = (i + 1) * (seg + 1) + j;
        idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const sock = new THREE.Mesh(geo, new THREE.MeshToonMaterial({
      vertexColors: true, gradientMap: U.grad, side: THREE.DoubleSide
    }));
    sock.castShadow = true;
    holder.add(sock);
    holder.rotation.y = -0.7;
    holder.rotation.z = -0.12;
    g.add(holder);
    P.sock = { mesh: sock, base: new Float32Array(pos), rings: rings, seg: seg, len: len };
    return g;
  }

  /* ---------------- 风速仪 ---------------- */
  function anemometer() {
    const g = new THREE.Group();
    g.add(U.cyl(0.05, 0.07, 1.9, 8, M.woodDark, 0, 0.95, 0));
    g.add(U.cyl(0.22, 0.26, 0.06, 10, M.brassD, 0, 0.03, 0));
    const head = new THREE.Group();
    head.position.set(0, 1.95, 0);
    head.add(U.sph(0.08, M.brass, 0, 0, 0));
    const cupGeo = new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const arm = U.box(0.46, 0.022, 0.022, M.brassD, Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24);
      arm.rotation.y = -a;
      head.add(arm);
      const cup = new THREE.Mesh(cupGeo, M.brass);
      cup.position.set(Math.cos(a) * 0.48, 0, Math.sin(a) * 0.48);
      cup.rotation.y = -a + Math.PI / 2;
      cup.rotation.z = 0.2;
      head.add(cup);
    }
    g.add(head);
    // 风标尾
    const vane = new THREE.Group();
    vane.position.set(0, 1.55, 0);
    vane.add(U.box(0.7, 0.02, 0.02, M.brassD, 0.15, 0, 0));
    vane.add(U.mesh(new THREE.ConeGeometry(0.06, 0.16, 4), M.brass, 0.52, 0, 0).rotateZ(-Math.PI / 2));
    vane.add(U.box(0.18, 0.16, 0.01, M.brass, -0.18, 0, 0));
    g.add(vane);
    P.anemo = head;
    P.anemoVane = vane;
    return g;
  }

  /* ---------------- 燃油桶 ---------------- */
  function barrels() {
    const g = new THREE.Group();
    const bodyMat = U.toon(0x3f5a52);
    const bodyMat2 = U.toon(0x8a4a2c);
    const spots = [
      [0, 0, 0, 1], [0.52, 0, 0.1, 0], [0.24, 0, 0.55, 0], [-0.15, 0.72, 0.18, 0]
    ];
    spots.forEach((s, i) => {
      const b = new THREE.Group();
      const h = 0.72, r = 0.24;
      const body = U.cyl(r, r, h, 14, i === 0 ? bodyMat : bodyMat2, 0, h / 2, 0);
      body.castShadow = true;
      b.add(body);
      for (const yy of [0.2, 0.52]) {
        const ring = U.cyl(r + 0.012, r + 0.012, 0.045, 14, M.brassD, 0, yy, 0);
        b.add(ring);
      }
      b.add(U.cyl(r * 0.9, r * 0.9, 0.03, 14, M.brassD, 0, h, 0));
      b.add(U.cyl(0.04, 0.04, 0.05, 8, M.brass, 0.1, h + 0.03, 0));
      b.position.set(s[0], s[1], s[2]);
      if (i === 3) b.rotation.z = 0.1;
      g.add(b);
    });
    return g;
  }

  /* ---------------- 升降吊篮 ---------------- */
  function mailBasket() {
    const g = new THREE.Group();
    // 吊臂
    const post = U.cyl(0.1, 0.14, 2.4, 8, M.brassD, 0, 1.2, 0);
    post.castShadow = true;
    g.add(post);
    const arm = U.cyl(0.08, 0.09, 2.6, 8, M.brassD, 0, 2.35, -1.2);
    arm.rotation.x = Math.PI / 2;
    g.add(arm);
    const brace = U.cyl(0.05, 0.05, 1.7, 6, M.brassD, 0, 1.85, -0.62);
    brace.rotation.x = 0.9;
    g.add(brace);
    // 滑轮
    const pulley = U.cyl(0.16, 0.16, 0.08, 12, M.brass, 0, 2.3, -2.35);
    pulley.rotation.x = Math.PI / 2;
    g.add(pulley);
    g.add(U.tor(0.17, 0.02, M.iron, 0, 2.3, -2.35));

    // 吊篮（可晃动）
    const swing = new THREE.Group();
    swing.position.set(0, 2.28, -2.35);
    const ropeLen = 1.55;
    swing.add(U.cyl(0.015, 0.015, ropeLen, 4, M.rope, 0, -ropeLen / 2, 0));
    const basket = new THREE.Group();
    basket.position.set(0, -ropeLen, 0);
    // 篮体
    const bw = 0.95, bd = 0.7, bh = 0.62;
    for (let i = 0; i < 4; i++) {
      const y = -bh + 0.1 + i * (bh / 4);
      const s = 0.82 + i * 0.05;
      const slat = U.box(bw * s, bh / 4 - 0.03, bd * s, M.wood, 0, y, 0);
      basket.add(slat);
    }
    // 铜角
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        basket.add(U.box(0.05, bh, 0.05, M.brassD, sx * bw / 2, -bh / 2 + 0.06, sz * bd / 2));
      }
    }
    basket.add(U.box(bw + 0.06, 0.06, bd + 0.06, M.brassD, 0, 0.06, 0));
    // 邮包
    basket.add(U.box(0.4, 0.3, 0.34, M.kraft, -0.2, 0.24, 0));
    basket.add(U.box(0.32, 0.24, 0.3, M.kraft, 0.22, 0.2, 0.1).rotateY(0.3));
    basket.add(U.box(0.3, 0.2, 0.26, M.canvas, 0.05, 0.4, -0.12).rotateY(-0.2));
    for (let i = 0; i < 4; i++) {
      basket.add(U.box(0.24, 0.012, 0.16, U.toon(0xf2e8d2), -0.1 + i * 0.06, 0.44 + i * 0.015, 0.2).rotateY(i * 0.2));
    }
    // 吊索
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const a = new THREE.Vector3(sx * bw / 2, 0.06, sz * bd / 2);
        const b = new THREE.Vector3(0, ropeLen - 0.02, 0);
        const mid = a.clone().lerp(b, 0.5);
        const st = U.cyl(0.01, 0.01, a.distanceTo(b), 4, M.rope, 0, 0, 0);
        st.position.copy(mid);
        st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        basket.add(st);
      }
    }
    swing.add(basket);
    g.add(swing);
    P.swing = swing;
    return g;
  }

  /* ---------------- 甲板杂物 ---------------- */
  function deckJunk() {
    const g = new THREE.Group();
    // 绳圈
    for (const p of [[0.3, -2.1, 0.5], [1.0, -2.4, 0.3]]) {
      for (let i = 0; i < 3; i++) {
        const c = U.tor(0.22 - i * 0.02, 0.045, M.rope, p[0], 0.05 + i * 0.045, p[1]);
        c.rotation.x = Math.PI / 2;
        g.add(c);
      }
    }
    // 木箱
    const crates = [[-2.9, -2.6, 0.55, 0.5], [-2.4, -2.75, 0.42, 0.4], [-2.75, -2.5, 0.4, 0.9]];
    crates.forEach((c, i) => {
      const b = U.box(c[2], c[2] * 0.9, c[2], M.wood, c[0], c[2] * 0.45 + (i === 2 ? 0.5 : 0), c[1]);
      b.rotation.y = U.rr(-0.3, 0.3);
      b.castShadow = true;
      g.add(b);
      // 铁皮边
      g.add(U.box(c[2] * 1.02, 0.04, c[2] * 1.02, M.iron, c[0], c[2] * 0.9 + (i === 2 ? 0.5 : 0) - 0.03, c[1]).rotateY(b.rotation.y));
    });
    // 水桶
    const bucket = U.cyl(0.19, 0.15, 0.36, 10, M.wood, 4.6, 0.18, 1.5);
    g.add(bucket);
    g.add(U.cyl(0.2, 0.2, 0.04, 10, M.brassD, 4.6, 0.36, 1.5));
    g.add(U.tor(0.19, 0.015, M.brassD, 4.6, 0.28, 1.5).rotateX(Math.PI / 2));
    return g;
  }

  /* ---------------- 装配 ---------------- */
  P.build = function (root, scene) {
    mats();

    const tel = telescope();
    tel.position.set(5.9, 0.1, 1.9);
    tel.rotation.y = -0.9;
    root.add(tel);

    const alb = albatross();
    alb.position.set(2.4, 0.66, 2.85);
    alb.rotation.y = 0.5;
    root.add(alb);

    const ws = windsock();
    ws.position.set(-7.2, 0, 2.0);
    root.add(ws);

    const an = anemometer();
    an.position.set(7.0, 0, -1.5);
    root.add(an);

    const bar = barrels();
    bar.position.set(4.5, 0, -2.2);
    bar.rotation.y = 0.4;
    root.add(bar);

    const mb = mailBasket();
    mb.position.set(-4.2, 0, -1.4);
    root.add(mb);

    root.add(deckJunk());

    /* 系泊缆绳：飞艇 → 码头 */
    const dockY = APP.C.dockY;
    const moor = [
      [[-4.6, -0.3, -2.6], [-6.5, dockY + 1.0, -6.5]],
      [[4.6, -0.3, -2.6], [6.5, dockY + 1.0, -6.5]],
      [[-4.6, -0.3, 2.6], [-6.5, dockY + 1.0, 6.5]],
      [[4.6, -0.3, 2.6], [6.5, dockY + 1.0, 6.5]]
    ];
    moor.forEach((m) => {
      const a = new THREE.Vector3(m[0][0], m[0][1] + APP.C.hullDeckY, m[0][2]);
      const b = new THREE.Vector3(m[1][0], m[1][1], m[1][2]);
      const pts = [a];
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        const p = a.clone().lerp(b, t);
        p.y -= Math.sin(Math.PI * t) * 0.35;
        pts.push(p);
      }
      pts.push(b);
      scene.add(U.rope(pts, 0xb08a5c, 1, 0.034));
    });
  };

  /* ---------------- 动画 ---------------- */
  P.update = function (t) {
    // 风向袋
    if (P.sock) {
      const s = P.sock;
      const pos = s.mesh.geometry.attributes.position;
      const base = s.base;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
        const k = bx / s.len;
        const w = Math.sin(t * 5.5 - bx * 4.2) * 0.09 * k * k + Math.sin(t * 3.1 - bx * 2.0) * 0.05 * k;
        pos.setXYZ(i, bx, by + w * 0.8, bz + w);
      }
      pos.needsUpdate = true;
      s.mesh.geometry.computeVertexNormals();
    }
    // 风速仪
    if (P.anemo) P.anemo.rotation.y = t * 3.4;
    if (P.anemoVane) P.anemoVane.rotation.y = Math.sin(t * 0.5) * 0.25;
    // 吊篮
    if (P.swing) {
      P.swing.rotation.z = Math.sin(t * 0.9) * 0.045;
      P.swing.rotation.x = Math.cos(t * 0.7) * 0.035;
    }
  };
})();
