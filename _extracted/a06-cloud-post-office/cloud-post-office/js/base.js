/* =========================================================
   base.js — 云海底座 / 浮石 / 遗迹 / 泊船码头
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;
  const B = (APP.Base = {});

  APP.C = {
    baseSize: 24,
    cloudTop: 0.95,
    dockY: 2.4,
    hullDeckY: 7.2
  };

  /* ================= 云海底座 ================= */
  function superR(a, R, n) {
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return R / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
  }

  B.buildCloudSea = function (scene) {
    const size = APP.C.baseSize, R = size / 2;
    const H = 6.4, SEG = 96, RINGS = 16, CAP = 8;
    const pos = [], col = [], idx = [];
    const cTop = new THREE.Color(0xffe8bd);
    const cUp = new THREE.Color(0xe6f0ff);
    const cMid = new THREE.Color(0x9dbad9);
    const cBot = new THREE.Color(0x5d7b9c);
    const cDeep = new THREE.Color(0x3f587a);
    const tmp = new THREE.Color();

    const rings = [];
    for (let i = 0; i <= RINGS; i++) {
      const t = i / RINGS;
      const y = -5.1 + t * 5.45;
      const rs = 0.855 + 0.145 * Math.pow(t, 0.55);
      rings.push({ y: y, rs: rs, t: t });
    }

    function pushRing(rs, y, t, isCap) {
      const start = pos.length / 3;
      for (let j = 0; j <= SEG; j++) {
        const a = (j / SEG) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        let r = superR(a, R, 10) * rs;
        // 云体起伏：大尺度云瓣 + 小尺度蓬松
        const lobe = U.noise3(ca * 3.0 + 3.2, y * 0.50, sa * 3.0 + 3.2);
        const fine = U.noise3(ca * 7.4 + 9, y * 1.7, sa * 7.4 + 9);
        r *= 1 + 0.150 * lobe + 0.045 * fine;
        let yy = y
          + 0.62 * lobe * (0.30 + 0.70 * t) * (isCap ? 0.55 : 1)
          + 0.20 * fine * (0.30 + 0.70 * t) * (isCap ? 0.5 : 1);
        const px = ca * r, pz = sa * r;
        pos.push(px, yy, pz);

        // 颜色：顶暖白、侧冷蓝、底沉
        const hN = U.clamp((yy + 5.1) / 5.9, 0, 1);
        tmp.copy(cDeep).lerp(cBot, U.smooth(U.clamp(hN * 3.0, 0, 1)));
        tmp.lerp(cMid, U.smooth(U.clamp((hN - 0.25) * 2.4, 0, 1)));
        tmp.lerp(cUp, U.smooth(U.clamp((hN - 0.55) * 2.6, 0, 1)));
        tmp.lerp(cTop, U.smooth(U.clamp((hN - 0.86) * 4.0, 0, 1)));
        // 边缘提亮，像被晨光扫到
        const edge = U.clamp((r / R - 0.74) * 2.6, 0, 1);
        tmp.lerp(new THREE.Color(0xf4e6cf), edge * 0.5);
        col.push(tmp.r, tmp.g, tmp.b);
      }
      return start;
    }

    // 侧壁
    for (let i = 0; i <= RINGS; i++) pushRing(rings[i].rs, rings[i].y, rings[i].t, false);

    // 顶盖：向内收拢的隆起
    const topY = rings[RINGS].y;
    for (let k = 1; k <= CAP; k++) {
      const tt = k / CAP;
      const rs = 1 - Math.pow(tt, 1.6) * 0.995;
      const y = topY + 0.42 * Math.sin(tt * Math.PI * 0.5);
      pushRing(Math.max(rs, 0.05), y, 1, true);
    }
    // 顶心补点
    pos.push(0, topY + 0.42, 0);
    col.push(cTop.r, cTop.g, cTop.b);

    const ringLen = SEG + 1;
    const centerIdx = pos.length / 3 - 1;
    const lastRing = (RINGS + CAP - 1) * ringLen;
    for (let j = 0; j < SEG; j++) {
      idx.push(lastRing + j, centerIdx, lastRing + j + 1);
    }
    for (let i = 0; i < RINGS + CAP - 1; i++) {
      const a0 = i * ringLen, a1 = (i + 1) * ringLen;
      for (let j = 0; j < SEG; j++) {
        idx.push(a0 + j, a1 + j, a0 + j + 1);
        idx.push(a1 + j, a1 + j + 1, a0 + j + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mat = new THREE.MeshToonMaterial({
      vertexColors: true, gradientMap: U.gradSoft,
      transparent: true, opacity: 0.95
    });
    const bed = new THREE.Mesh(geo, mat);
    bed.castShadow = true;
    bed.receiveShadow = true;
    bed.userData.base = new Float32Array(pos);
    scene.add(bed);
    B.bed = bed;

    /* ---- 云团（蓬松感） ---- */
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    {
      const p = puffGeo.attributes.position, cols = [];
      const cT = new THREE.Color(0xffffff), cB = new THREE.Color(0xacc2dc), tc = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const ny = p.getY(i);
        tc.copy(cB).lerp(cT, U.smooth(U.clamp((ny + 0.95) / 1.7, 0, 1)));
        cols.push(tc.r, tc.g, tc.b);
      }
      puffGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    }
    const puffMat = new THREE.MeshToonMaterial({
      color: 0xffffff, vertexColors: true, gradientMap: U.gradSoft,
      transparent: true, opacity: 0.93, depthWrite: true
    });
    /* 云体由三层叠出：大云瓣打底 / 厚云环 / 边缘碎云 */
    const list = [];
    // ① 六朵大云瓣：制造高低错落的主轮廓
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + U.rr(-0.22, 0.22);
      const rr = superR(a, R, 10) * U.rr(0.52, 0.70);
      list.push([a, rr, U.rr(-2.4, -1.2), U.rr(4.0, 5.6), U.rr(0.70, 0.88)]);
    }
    // ② 厚云环：侧壁 + 顶缘，尺寸拉开
    for (let k = 0; k < 168; k++) {
      const a = U.rr(0, Math.PI * 2);
      const up = U.rnd();
      let r, y, sc;
      if (up < 0.44) {          // 侧壁
        r = superR(a, R, 10) * U.rr(0.80, 0.97);
        y = U.rr(-3.9, -0.9);
        sc = U.rr(1.5, 3.0);
      } else if (up < 0.72) {   // 顶缘翻卷
        r = superR(a, R, 10) * U.rr(0.66, 0.90);
        y = U.rr(-1.0, 0.15);
        sc = U.rr(2.2, 3.8);
      } else if (up < 0.90) {   // 顶面零星
        r = superR(a, R, 10) * U.rr(0.50, 0.80);
        y = U.rr(0.30, 0.85);
        sc = U.rr(0.9, 1.9);
      } else {                  // 顶缘外溢
        r = superR(a, R, 10) * U.rr(0.94, 1.04);
        y = U.rr(-2.2, -0.9);
        sc = U.rr(1.2, 2.2);
      }
      list.push([a, r, y, sc, U.rr(0.68, 0.94)]);
    }
    // ③ 底部拖尾
    for (let k = 0; k < 40; k++) {
      const a = U.rr(0, Math.PI * 2);
      list.push([a, superR(a, R, 10) * U.rr(0.04, 0.64), U.rr(-5.6, -3.6), U.rr(1.4, 2.8), U.rr(0.62, 0.88)]);
    }

    const N = list.length;
    const puffs = U.instanced(puffGeo, puffMat, N);
    puffs.renderOrder = 1;
    const data = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const cWarmP = new THREE.Color(0xfff0d4), cCoolP = new THREE.Color(0xd3e2f4), cTmp = new THREE.Color();
    const sunN = APP.Sky.sunDir.clone();
    for (let i = 0; i < N; i++) {
      const a = list[i][0], r = list[i][1], y = list[i][2], sc = list[i][3], squash = list[i][4];
      data.push({ a: a, r: r, y: y, sc: sc, ph: U.rr(0, 7), sp: U.rr(0.3, 0.9), rot: U.rr(0, 7) });
      v.set(Math.cos(a) * r, y, Math.sin(a) * r);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), U.rr(0, Math.PI * 2));
      s.set(sc, sc * squash, sc);
      m.compose(v, q, s);
      puffs.setMatrixAt(i, m);
      // 朝阳侧暖、背阳侧冷
      const dSun = new THREE.Vector3(Math.cos(a), y * 0.12, Math.sin(a)).normalize().dot(sunN);
      cTmp.copy(cCoolP).lerp(cWarmP, U.clamp(dSun * 0.9 + 0.55, 0, 1));
      cTmp.multiplyScalar(U.rr(0.93, 1.02));
      puffs.setColorAt(i, cTmp);
    }
    puffs.instanceMatrix.needsUpdate = true;
    if (puffs.instanceColor) puffs.instanceColor.needsUpdate = true;
    scene.add(puffs);
    B.puffs = puffs;
    B.puffData = data;

    /* ---- 云海底部飘散的碎云 ---- */
    const soft = U.tex(U.softTex(), 1, 1);
    const wisps = new THREE.Group();
    for (let i = 0; i < 26; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: soft, color: 0xf3f8ff, transparent: true,
        opacity: U.rr(0.12, 0.34), depthWrite: false
      }));
      const a = U.rr(0, 7), r = U.rr(5, 18);
      sp.position.set(Math.cos(a) * r, U.rr(-8.6, -4.6), Math.sin(a) * r);
      const sc = U.rr(7, 16);
      sp.scale.set(sc, sc * 0.55, 1);
      sp.userData = { y0: sp.position.y, ph: U.rr(0, 7) };
      wisps.add(sp);
    }
    scene.add(wisps);
    B.wisps = wisps;

    /* ---- 环绕浮云层：给箱庭制造景深与画框 ---- */
    const fgGrp = new THREE.Group();
    const fgData = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + U.rr(-0.16, 0.16);
      const r = U.rr(21, 33);
      const y = U.rr(-15.0, -8.0);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: soft, color: i % 3 === 0 ? 0xffe6c6 : 0xe8f1ff,
        transparent: true, opacity: U.rr(0.16, 0.30), depthWrite: false, fog: true
      }));
      sp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      const sc = U.rr(15, 26);
      sp.scale.set(sc, sc * U.rr(0.40, 0.62), 1);
      sp.userData = { y0: y, ph: U.rr(0, 7), sp: U.rr(0.10, 0.26) };
      fgGrp.add(sp);
      fgData.push(sp.userData);
    }
    scene.add(fgGrp);
    B.fgClouds = fgGrp;
    B.fgData = fgData;
  };

  /* ================= 浮石 ================= */
  B.rockGeom = function (r, rough) {
    const g = new THREE.IcosahedronGeometry(r, 2);
    U.deform(g, (v) => {
      const n = U.noise3(v.x * 0.9 + 11, v.y * 0.9, v.z * 0.9);
      const n2 = U.noise3(v.x * 2.4, v.y * 2.4 + 3, v.z * 2.4);
      const k = 1 + n * 0.30 * rough + n2 * 0.12 * rough;
      v.multiplyScalar(k);
      // 上宽下尖，像被拔起来的岩块
      const f = U.clamp((v.y / r + 1) * 0.5, 0, 1);
      v.x *= 0.55 + f * 0.75;
      v.z *= 0.55 + f * 0.75;
    });
    g.computeVertexNormals();   // 非索引几何 → 逐面法线，硬边块面
    return g;
  };

  B.buildRocks = function (scene) {
    const grp = new THREE.Group();
    const rockMat = new THREE.MeshToonMaterial({
      color: 0x9a9c9e, gradientMap: U.grad, vertexColors: true
    });
    const spots = [
      { x: -9.8, z: -7.6, y: -3.4, r: 3.6, s: 1 },
      { x: 9.6, z: -8.4, y: -3.8, r: 3.2, s: 2 },
      { x: -10.6, z: 7.2, y: -4.0, r: 3.0, s: 3 },
      { x: 10.8, z: 7.8, y: -3.2, r: 3.3, s: 4 },
      { x: -5.4, z: 11.6, y: -4.6, r: 2.4, s: 5 },
      { x: 6.0, z: -12.2, y: -4.8, r: 2.6, s: 6 },
      { x: 0.2, z: 13.0, y: -5.4, r: 2.1, s: 7 },
      { x: -13.0, z: -0.8, y: -5.2, r: 2.2, s: 8 },
      { x: -9.0, z: 11.8, y: 0.5, r: 1.1, s: 9 },
      { x: 13.6, z: 3.6, y: -0.2, r: 1.0, s: 10 },
      { x: -2.0, z: 14.2, y: -6.2, r: 1.6, s: 11 },
      { x: 12.8, z: -4.0, y: -5.6, r: 1.9, s: 12 }
    ];
    const rocks = [];
    spots.forEach((sp, i) => {
      const g = B.rockGeom(sp.r, 1);
      // 顶点色
      const p = g.attributes.position;
      const cols = [];
      const cTop = new THREE.Color(0xb0a99a), cBot = new THREE.Color(0x565d6e);
      const tc = new THREE.Color();
      for (let k = 0; k < p.count; k++) {
        const ny = (p.getY(k) / sp.r + 1) * 0.5;
        tc.copy(cBot).lerp(cTop, U.clamp(ny * 1.25, 0, 1));
        cols.push(tc.r, tc.g, tc.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const mesh = new THREE.Mesh(g, rockMat);
      mesh.position.set(sp.x, sp.y, sp.z);
      mesh.rotation.set(U.rr(-0.2, 0.2), U.rr(0, 7), U.rr(-0.2, 0.2));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { y0: sp.y, ph: U.rr(0, 7), amp: U.rr(0.12, 0.3) };
      U.ink(mesh, 0x1c2130, 0.35, 22);
      grp.add(mesh);
      rocks.push(mesh);
    });
    scene.add(grp);
    B.rocks = rocks;
  };

  /* ================= 云中遗迹石柱 ================= */
  B.buildRuins = function (scene) {
    const grp = new THREE.Group();
    const stone = U.toon(0xc8c0ad);
    const stoneD = U.toon(0xa79f8d);
    const moss = U.toon(0x7d8a6a);
    const spots = [
      { x: -12.6, z: 3.4, h: 3.2, tilt: 0.22 },
      { x: -12.2, z: 5.6, h: 1.8, tilt: -0.14 },
      { x: 12.9, z: -3.2, h: 2.6, tilt: -0.3 },
      { x: 11.4, z: 4.6, h: 1.4, tilt: 0.12 },
      { x: 2.6, z: 12.4, h: 2.2, tilt: 0.34 }
    ];
    spots.forEach((s) => {
      const g = new THREE.Group();
      const shaft = U.cyl(0.34, 0.42, s.h, 12, stone, 0, s.h / 2, 0);
      shaft.castShadow = true;
      U.ink(shaft, 0x2a2b33, 0.35, 40);
      g.add(shaft);
      // 柱头
      const cap = U.box(0.95, 0.22, 0.95, stoneD, 0, s.h + 0.1, 0);
      cap.castShadow = true;
      g.add(cap);
      const cap2 = U.box(0.72, 0.16, 0.72, stoneD, 0, s.h + 0.28, 0);
      g.add(cap2);
      // 断口
      const broke = U.cyl(0.3, 0.34, 0.3, 12, stone, 0.05, s.h + 0.46, 0.03);
      broke.rotation.z = 0.3;
      g.add(broke);
      // 苔痕
      const m = U.box(0.5, 0.06, 0.5, moss, 0, s.h + 0.01, 0);
      m.scale.set(1, 1, 1);
      g.add(m);
      // 基座
      const base = U.box(1.1, 0.35, 1.1, stoneD, 0, 0.1, 0);
      base.castShadow = true;
      g.add(base);
      g.position.set(s.x, U.rr(-1.6, -0.8), s.z);
      g.rotation.set(s.tilt * 0.3, U.rr(0, 7), s.tilt);
      grp.add(g);
    });
    scene.add(grp);
    B.ruins = grp;
  };

  /* ================= 泊船码头 ================= */
  B.buildDock = function (scene) {
    const grp = new THREE.Group();
    const S = 13.5;
    const half = S / 2 - 0.35;
    const woodTex = U.tex(U.plankTex('#7d6350', '#33271b', 9), 4, 4);
    const woodMat = U.toon(0xffffff, { map: woodTex });
    const beamMat = U.toon(0x4a2c1c);
    const brass = U.std(0xc49a33, { metalness: 1, roughness: 0.32, env: 1.2 });
    const brassD = U.std(0x8a6a22, { metalness: 1, roughness: 0.45 });
    const iron = U.std(0x3b3f48, { metalness: 0.85, roughness: 0.5 });

    // 甲板
    const deck = U.box(S, 0.55, S, woodMat, 0, APP.C.dockY, 0);
    deck.castShadow = true; deck.receiveShadow = true;
    U.ink(deck, 0x1d130c, 0.6, 20);
    grp.add(deck);

    // 边缘包边
    const trimY = APP.C.dockY + 0.28;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach((d) => {
      const t = d[0] !== 0 ? U.box(0.28, 0.14, S, brassD, d[0] * S / 2, trimY, 0)
        : U.box(S, 0.14, 0.28, brassD, 0, trimY, d[1] * S / 2);
      grp.add(t);
    });

    // 底部支撑梁 + 斜撑
    for (let i = -2; i <= 2; i++) {
      const b = U.box(S * 0.96, 0.4, 0.5, beamMat, 0, APP.C.dockY - 0.46, i * (S / 5.4));
      b.castShadow = true;
      grp.add(b);
    }
    // 中央支柱扎进云里
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const r = S * 0.33;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      const leg = U.cyl(0.22, 0.36, 4.6, 8, beamMat, px, APP.C.dockY - 2.5, pz);
      leg.rotation.z = Math.cos(a) * 0.2;
      leg.rotation.x = -Math.sin(a) * 0.2;
      leg.castShadow = true;
      grp.add(leg);
      const ring = U.cyl(0.3, 0.3, 0.16, 8, brass, px, APP.C.dockY - 1.2, pz);
      grp.add(ring);
    }

    // 栏杆
    const railMat = U.toon(0x5e3320);
    const railH = 1.1;
    const posts = [];
    const addPost = (x, z) => {
      const p = U.cyl(0.085, 0.105, railH, 8, railMat, x, APP.C.dockY + 0.28 + railH / 2, z);
      p.castShadow = true;
      grp.add(p);
      grp.add(U.sph(0.12, brass, x, APP.C.dockY + 0.28 + railH + 0.05, z));
      posts.push({ x: x, z: z });
    };
    for (let i = -3; i <= 3; i++) {
      const t = (i / 3) * half;
      if (Math.abs(i) !== 3) { addPost(t, -half); addPost(t, half); }
      if (Math.abs(i) !== 3) { addPost(-half, t); addPost(half, t); }
    }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c) => addPost(c[0] * half, c[1] * half));

    // 绳索垂弧
    const railTop = APP.C.dockY + 0.28 + railH;
    const linkRope = (a, b) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(new THREE.Vector3(
          U.lerp(a.x, b.x, t),
          railTop - 0.1 - Math.sin(Math.PI * t) * 0.26,
          U.lerp(a.z, b.z, t)
        ));
      }
      grp.add(U.rope(pts, 0xb08a5a, 1, 0.032));
    };
    for (const side of [-1, 1]) {
      const zs = posts.filter(p => Math.abs(p.z - side * half) < 0.01).sort((a, b) => a.x - b.x);
      for (let i = 0; i < zs.length - 1; i++) linkRope(zs[i], zs[i + 1]);
      const xs = posts.filter(p => Math.abs(p.x - side * half) < 0.01).sort((a, b) => a.z - b.z);
      for (let i = 0; i < xs.length - 1; i++) linkRope(xs[i], xs[i + 1]);
    }

    // 系缆桩
    const bollards = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]];
    bollards.forEach((b) => {
      const x = b[0] * half * 0.94, z = b[1] * half * 0.94;
      const post = U.cyl(0.26, 0.32, 0.7, 12, brass, x, APP.C.dockY + 0.63, z);
      post.castShadow = true;
      grp.add(post);
      grp.add(U.cyl(0.4, 0.34, 0.14, 12, brass, x, APP.C.dockY + 1.02, z));
      for (let i = 0; i < 3; i++) {
        const coil = U.tor(0.34, 0.05, U.toon(0xb08a5a), x, APP.C.dockY + 0.44 + i * 0.1, z);
        coil.rotation.x = Math.PI / 2;
        grp.add(coil);
      }
    });

    // 灯柱
    const lampPosts = [[-1, 0.42], [1, -0.42], [-0.42, -1], [0.42, 1]];
    lampPosts.forEach((p) => {
      const px = p[0] * half * 0.9, pz = p[1] * half * 0.9;
      const pole = U.cyl(0.07, 0.095, 2.4, 8, iron, px, APP.C.dockY + 1.5, pz);
      pole.castShadow = true;
      grp.add(pole);
      const dir = p[0] !== 0 ? -Math.sign(p[0]) : 0;
      const dirZ = p[0] === 0 ? -Math.sign(p[1]) : 0;
      const arm = U.box(dir !== 0 ? 0.85 : 0.09, 0.09, dirZ !== 0 ? 0.85 : 0.09, iron,
        px + dir * 0.38, APP.C.dockY + 2.68, pz + dirZ * 0.38);
      grp.add(arm);
      const lx = px + dir * 0.76, lz = pz + dirZ * 0.76;
      grp.add(U.cyl(0.16, 0.2, 0.34, 8, brassD, lx, APP.C.dockY + 2.46, lz));
      grp.add(U.sph(0.11, new THREE.MeshStandardMaterial({
        color: 0xffdca0, emissive: 0xffb45c, emissiveIntensity: 3.2, roughness: 0.4
      }), lx, APP.C.dockY + 2.44, lz));
      const gl = U.glow(0xffb45c, 2.0, 0.5);
      gl.position.set(lx, APP.C.dockY + 2.44, lz);
      grp.add(gl);
    });

    scene.add(grp);
    B.dock = grp;

    /* ---- 码头杂物 ---- */
    const junk = new THREE.Group();
    const kraft = U.toon(0xffffff, { map: U.tex(U.kraftTex(), 1, 1) });
    const canvasM = U.toon(0xd9cfb6);
    const ropeM = U.toon(0xb08a5a);
    const y0 = APP.C.dockY + 0.28;

    // 货箱堆
    const crates = [
      [3.6, -4.4, 0.95, 0.85, 0.1], [4.5, -3.9, 0.75, 0.7, -0.25],
      [3.8, -3.6, 0.8, 0.75, 0.3], [3.75, -4.35, 0.7, 1.7, 0.15]
    ];
    crates.forEach((c) => {
      const b = U.box(c[2], c[2] * 0.95, c[2], woodMat, c[0], y0 + c[3], c[1]);
      b.rotation.y = c[4];
      b.castShadow = true;
      junk.add(b);
      const band = U.box(c[2] * 1.02, 0.05, c[2] * 1.02, brassD, c[0], y0 + c[3] + c[2] * 0.3, c[1]);
      band.rotation.y = c[4];
      junk.add(band);
    });

    // 油桶
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const bx = 4.3 + Math.cos(a) * 0.34, bz = 3.9 + Math.sin(a) * 0.34;
      const b = U.cyl(0.24, 0.24, 0.72, 12, U.toon(i % 2 ? 0x3f5a52 : 0x7d3a26), bx, y0 + 0.36, bz);
      b.castShadow = true;
      junk.add(b);
      junk.add(U.cyl(0.25, 0.25, 0.04, 12, brassD, bx, y0 + 0.2, bz));
      junk.add(U.cyl(0.25, 0.25, 0.04, 12, brassD, bx, y0 + 0.54, bz));
    }

    // 邮袋堆
    for (let i = 0; i < 5; i++) {
      const sx = -4.0 + (i % 3) * 0.55 + (i > 2 ? 0.28 : 0);
      const sy = y0 + (i > 2 ? 0.42 : 0) + 0.28;
      const sz = 3.8 + (i % 2) * 0.5;
      const bag = U.sph(0.3, kraft, sx, sy, sz, 1.1, 0.9, 0.85);
      bag.rotation.y = U.rr(0, 3);
      bag.castShadow = true;
      junk.add(bag);
      junk.add(U.cyl(0.06, 0.06, 0.1, 6, ropeM, sx, sy + 0.28, sz));
    }

    // 绞盘
    const winch = new THREE.Group();
    winch.position.set(-4.6, y0, -4.0);
    winch.add(U.box(1.0, 0.16, 0.9, beamMat, 0, 0.08, 0));
    for (const s of [-1, 1]) {
      winch.add(U.box(0.16, 0.85, 0.16, beamMat, s * 0.38, 0.5, 0));
      winch.add(U.box(0.16, 0.85, 0.16, beamMat, s * 0.38, 0.5, -0.3));
    }
    const drum = U.cyl(0.26, 0.26, 0.72, 12, brassD, 0, 0.6, -0.15);
    drum.rotation.z = Math.PI / 2;
    winch.add(drum);
    for (let i = 0; i < 5; i++) {
      const c = U.tor(0.28, 0.05, ropeM, -0.24 + i * 0.12, 0.6, -0.15);
      c.rotation.y = Math.PI / 2;
      winch.add(c);
    }
    const crank = U.box(0.05, 0.05, 0.42, brass, 0.44, 0.6, -0.15);
    crank.rotation.x = 0.4;
    winch.add(crank);
    winch.add(U.cyl(0.04, 0.04, 0.2, 6, brass, 0.44, 0.42, -0.35));
    junk.add(winch);

    // 缆桩上的盘绳 + 木牌
    const signPost = new THREE.Group();
    signPost.position.set(-0.4, y0, -5.4);
    signPost.add(U.cyl(0.07, 0.09, 1.5, 8, beamMat, 0, 0.75, 0));
    const board = U.box(0.9, 0.42, 0.06, U.toon(0x6d4a2e), 0, 1.35, 0.03);
    signPost.add(board);
    signPost.add(U.box(0.94, 0.05, 0.07, brass, 0, 1.57, 0.03));
    signPost.add(U.box(0.94, 0.05, 0.07, brass, 0, 1.13, 0.03));
    junk.add(signPost);

    // 木板堆
    for (let i = 0; i < 4; i++) {
      const p = U.box(2.2, 0.09, 0.34, woodMat, 1.2, y0 + 0.06 + i * 0.1, 5.0 + i * 0.06);
      p.rotation.y = 0.06 * i;
      junk.add(p);
    }
    grp.add(junk);

    // 铁索 → 浮石
    const anchors = [
      [[-half * 0.94, APP.C.dockY - 0.1, -half * 0.94], [-10.5, -0.6, -8.4]],
      [[half * 0.94, APP.C.dockY - 0.1, -half * 0.94], [10.2, -1.2, -9.0]],
      [[-half * 0.94, APP.C.dockY - 0.1, half * 0.94], [-11.4, -1.6, 7.6]],
      [[half * 0.94, APP.C.dockY - 0.1, half * 0.94], [11.6, -0.2, 8.2]]
    ];
    anchors.forEach((a) => {
      const c = U.chain(
        new THREE.Vector3(a[0][0], a[0][1], a[0][2]),
        new THREE.Vector3(a[1][0], a[1][1], a[1][2]),
        26, brassD, 0.7
      );
      scene.add(c);
      const ring = U.tor(0.3, 0.06, brassD, a[1][0], a[1][1], a[1][2]);
      ring.rotation.y = 0.6;
      scene.add(ring);
    });
  };
})();
