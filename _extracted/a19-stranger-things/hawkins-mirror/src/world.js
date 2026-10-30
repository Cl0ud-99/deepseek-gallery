/* =========================================================
   world.js — 底座 / 街道 / 建筑外壳 / 街道道具
   坐标约定：y=0 为地面，x+ 为东，z+ 为南（临街）
   ========================================================= */
(function () {
  'use strict';
  var ST = window.ST;

  ST.BASE_H = 0.56;

  ST.GEO = {
    HALF: 6.6,
    ROAD: 2.8,
    WALK: 2.0,
    ARC: { x0: -1.7, x1: 2.0, z0: -4.0, z1: 2.0, h: 3.3 },
    HSE: { x0: -5.5, x1: -1.8, z0: -4.0, z1: 0.9, h: 2.75 },
    ALLEY: { x0: -6.6, x1: -5.6 }
  };

  /* 三角形棱柱（沿 X 挤出），pts 为 [z,y] 序列 */
  ST.prismX = function (p, mat, pts, x0, x1, opt) {
    opt = opt || {};
    var s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: Math.abs(x1 - x0), bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(x1, 0, 0);
    var m = new THREE.Mesh(g, mat);
    p.add(m);
    if (opt.ol) ST.outline(m, opt.ol);
    return m;
  };

  /* ---------------- 底座（只建一次，不镜像） ---------------- */
  ST.buildBase = function () {
    var g = new THREE.Group();
    g.name = 'base';
    var H = ST.GEO.HALF;

    var stoneTop = ST.toon(0x1a1d25, {});
    var stoneBot = ST.toon(0x14161c, {});
    var coreMat = ST.toon(0x1e0d10, { emissive: 0x3a0806, ei: 0.4 });
    var capMat = ST.toon(0x2e3138, {});

    // 上层底板
    ST.bx(g, stoneTop, [-H, H], [-0.18, 0], [-H, H], { ol: false });
    // 夹心层（岩层 + 红光矿脉）
    ST.bx(g, coreMat, [-H + 0.1, H - 0.1], [-0.40, -0.18], [-H + 0.1, H - 0.1], { ol: false });
    // 下层底板
    ST.bx(g, stoneBot, [-H, H], [-0.56, -0.40], [-H, H], { ol: false });

    // 上下沿口亮线（模型切边）
    var edge = ST.toon(0x262b34, { emissive: 0x0c1420, ei: 0.5 });
    ST.bx(g, edge, [-H - 0.015, H + 0.015], [-0.03, 0.0], [-H - 0.015, -H + 0.02], { ol: false });
    ST.bx(g, edge, [-H - 0.015, H + 0.015], [-0.03, 0.0], [H - 0.02, H + 0.015], { ol: false });
    ST.bx(g, edge, [-H - 0.015, -H + 0.02], [-0.03, 0.0], [-H, H], { ol: false });
    ST.bx(g, edge, [H - 0.02, H + 0.015], [-0.03, 0.0], [-H, H], { ol: false });

    var edge2 = ST.toon(0x24090c, { emissive: 0x3a0a06, ei: 0.55 });
    ST.bx(g, edge2, [-H - 0.015, H + 0.015], [-0.58, -0.55], [-H - 0.015, -H + 0.02], { ol: false });
    ST.bx(g, edge2, [-H - 0.015, H + 0.015], [-0.58, -0.55], [H - 0.02, H + 0.015], { ol: false });
    ST.bx(g, edge2, [-H - 0.015, -H + 0.02], [-0.58, -0.55], [-H, H], { ol: false });
    ST.bx(g, edge2, [H - 0.02, H + 0.015], [-0.58, -0.55], [-H, H], { ol: false });

    // 夹心层外露矿脉
    var veinMat = ST.toon(0xff3a18, { emissive: 0xff2a10, ei: 1.4 });
    for (var i = 0; i < 26; i++) {
      var s = ST.rr(0.4, 1.6);
      var y = ST.rr(-0.38, -0.20);
      if (ST.chance(0.5)) {
        var zz = ST.rr(-H + 0.4, H - 0.4);
        ST.bx(g, veinMat, [-H + 0.1, -H + 0.14], [y, y + 0.035], [zz, zz + s], { ol: false });
      } else {
        var xx = ST.rr(-H + 0.4, H - 0.4);
        ST.bx(g, veinMat, [xx, xx + s], [y, y + 0.035], [H - 0.14, H - 0.1], { ol: false });
      }
    }
    return g;
  };

  /* ---------------- 上下交界处的裂缝 / 垂藤 ---------------- */
  ST.buildSeam = function () {
    var g = new THREE.Group();
    var H = ST.GEO.HALF;
    var crackMat = new THREE.MeshBasicMaterial({
      color: 0xff3a18, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    ST.riftMats = ST.riftMats || [];
    ST.riftMats.push(crackMat);

    var starts = [[3.4, 3.4], [5.6, 3.2], [3.2, 5.8], [6.0, 5.4], [4.4, 4.6], [2.9, 4.4], [5.2, 2.6], [-5.8, 3.6], [-1.2, 3.4]];
    for (var i = 0; i < starts.length; i++) {
      var a = ST.rand() * 6.283;
      var len = ST.rr(1.6, 3.4);
      var pts = [new THREE.Vector3(starts[i][0], -0.572, starts[i][1])];
      for (var k = 1; k <= 6; k++) {
        var t = k / 6;
        pts.push(new THREE.Vector3(
          starts[i][0] + Math.cos(a) * len * t + ST.rr(-0.45, 0.45),
          -0.572,
          starts[i][1] + Math.sin(a) * len * t + ST.rr(-0.45, 0.45)
        ));
      }
      var curve = new THREE.CatmullRomCurve3(pts);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, ST.rr(0.018, 0.05), 3, false), crackMat);
      g.add(tube);
    }
    // 裂缝处红光
    for (var r = 0; r < 24; r++) {
      var rx = ST.chance(0.5) ? ST.rr(3.0, 6.3) : ST.rr(-6.3, 2.0);
      var rz = ST.chance(0.5) ? ST.rr(3.0, 6.3) : ST.rr(-6.3, 2.0);
      ST.glow(g, 0xff2a10, ST.rr(0.5, 1.3), rx, -0.586, rz, 0.45);
    }
    // 底面上的菌毯斑块
    var fm = ST.toon(0x3a1210, { emissive: 0x1a0404, ei: 0.3 });
    for (var fb = 0; fb < 26; fb++) {
      var fx2 = ST.chance(0.5) ? ST.rr(2.95, 6.4) : ST.rr(-6.4, 1.9);
      var fz2 = ST.chance(0.5) ? ST.rr(2.95, 6.4) : ST.rr(-6.4, 1.9);
      var bl = ST.sph(g, fm, ST.rr(0.16, 0.5), fx2, -0.572, fz2, { sy: 0.1, seg: 7, ol: false });
      bl.rotation.y = ST.rand() * 3;
    }
    // 从底座边缘垂落的藤蔓
    var vineMat = ST.toon(0x0e1116, {});
    for (var v = 0; v < 26; v++) {
      var side = ST.ri(0, 3);
      var sx, sz;
      if (side === 0) { sx = ST.rr(-H, H); sz = -H + 0.15; }
      else if (side === 1) { sx = ST.rr(-H, H); sz = H - 0.15; }
      else if (side === 2) { sx = -H + 0.15; sz = ST.rr(-H, H); }
      else { sx = H - 0.15; sz = ST.rr(-H, H); }
      var pts2 = [new THREE.Vector3(sx, -0.57, sz)];
      for (var q = 0; q < 4; q++) {
        pts2.push(new THREE.Vector3(sx + ST.rr(-0.25, 0.25), -0.57 - (q + 1) * ST.rr(0.25, 0.55), sz + ST.rr(-0.25, 0.25)));
      }
      var c2 = new THREE.CatmullRomCurve3(pts2);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c2, 14, ST.rr(0.014, 0.032), 4, false), vineMat));
    }
    // 侧面脉动红光（从任何角度都能看到的裂缝）
    var seamMat = new THREE.MeshBasicMaterial({
      color: 0xff3a14, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    ST.riftMats.push(seamMat);
    for (var sI = 0; sI < 4; sI++) {
      for (var sK = 0; sK < 9; sK++) {
        var pos = -H + 0.5 + sK * 1.45;
        var yy = -0.29 + ST.rr(-0.07, 0.07);
        var len = ST.rr(0.2, 0.85);
        var mesh;
        if (sI < 2) {
          var zz2 = sI === 0 ? H + 0.02 : -H - 0.02;
          mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.022), seamMat);
          mesh.position.set(pos, yy, zz2);
        } else {
          var xx2 = sI === 2 ? H + 0.02 : -H - 0.02;
          mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.022), seamMat);
          mesh.position.set(xx2, yy, pos);
          mesh.rotation.y = Math.PI / 2;
        }
        g.add(mesh);
      }
    }
    // 脉动红光
    var pl = new THREE.PointLight(0xff2a10, 1.6, 9, 2);
    pl.position.set(0, -0.9, 0);
    g.add(pl);
    ST.seamLight = pl;
    return g;
  };

  /* ---------------- 地面 / 街道 ---------------- */
  function buildGround(p) {
    var M = ST.mats, H = ST.GEO.HALF, R = ST.GEO.ROAD, W = ST.GEO.WALK;

    // 沥青
    ST.plane(p, M.road, H * 2, H * 2, 0, 0.004, 0, { rx: -Math.PI / 2 });

    // 人行道（L 形）
    ST.bx(p, M.walkTex, [-H, R], [0, 0.15], [W, R], { ol: 0.014 });
    ST.bx(p, M.walkTex, [W, R], [0, 0.15], [-H, W], { ol: 0.014 });

    // 路缘石
    ST.bx(p, M.curb, [-H, R + 0.02], [0, 0.17], [R, R + 0.12], { ol: 0.012 });
    ST.bx(p, M.curb, [R, R + 0.12], [0, 0.17], [-H, R], { ol: 0.012 });

    // 车道虚线
    var lineMat = M.line;
    for (var i = 0; i < 9; i++) {
      var x = -H + 0.7 + i * 1.5;
      ST.plane(p, lineMat, 0.75, 0.09, x, 0.008, 4.72, { rx: -Math.PI / 2 });
    }
    for (var j = 0; j < 8; j++) {
      var z = -H + 0.8 + j * 1.5;
      ST.plane(p, lineMat, 0.09, 0.75, 4.72, 0.008, z, { rx: -Math.PI / 2 });
    }

    // 斑马线
    for (var k = 0; k < 7; k++) {
      ST.plane(p, lineMat, 1.75, 0.36, 1.15, 0.009, 3.16 + k * 0.62, { rx: -Math.PI / 2 });
    }

    // 停车位标线（右侧路缘）
    for (var m = 0; m < 3; m++) {
      var zz = -1.2 - m * 2.1;
      ST.plane(p, lineMat, 1.5, 0.075, 3.72, 0.008, zz, { rx: -Math.PI / 2 });
      ST.plane(p, lineMat, 0.075, 1.5, 3.0, 0.008, zz + 1.05, { rx: -Math.PI / 2 });
    }

    // 井盖 / 雨水篦子
    var grate = ST.toon(0x2a2e36, {});
    ST.cyl(p, grate, 0.26, 0.26, 0.03, -2.1, 0.02, 4.25, { seg: 14, ol: 0.008 });
    for (var q = 0; q < 5; q++) {
      ST.bx(p, ST.toon(0x0a0c10, {}), [-2.3, -1.9], [0.03, 0.045], [4.05 + q * 0.1, 4.09 + q * 0.1], { ol: false });
    }
    ST.bx(p, ST.toon(0x16181e, {}), [1.55, 2.05], [0.15, 0.19], [R - 0.1, R + 0.02], { ol: 0.008 });
    for (var r = 0; r < 4; r++) {
      ST.bx(p, ST.toon(0x05060a, {}), [1.6, 2.0], [0.191, 0.2], [R - 0.08 + r * 0.02, R - 0.06 + r * 0.02], { ol: false });
    }

    // 积水
    var pud = ST.toon(M.puddle.color, { emissive: 0x0a1a2e, ei: 0.35, transparent: true, opacity: 0.85 });
    var puddles = [[-3.2, 3.6, 1.5, 0.8], [0.4, 5.4, 1.1, 0.6], [4.4, -2.4, 1.2, 1.9], [-4.8, 2.45, 1.4, 0.5], [3.4, 2.5, 0.9, 0.45]];
    puddles.forEach(function (pd) {
      ST.plane(p, pud, pd[2], pd[3], pd[0], 0.011, pd[1], { rx: -Math.PI / 2 });
    });

    // 小巷地面
    ST.bx(p, ST.toon(0x22242c, {}), [ST.GEO.ALLEY.x0, ST.GEO.ALLEY.x1], [0, 0.06], [-H, 2.0], { ol: false });

    // 草地（后院 / 院子）
    ST.bx(p, M.grass, [-5.5, 2.0], [0, 0.08], [-H + 0.2, -4.0], { ol: false });
    ST.bx(p, M.grass, [-5.5, -1.8], [0, 0.08], [1.68, 2.0], { ol: false });
  }

  /* ---------------- 皇宫街机厅外壳 ---------------- */
  function buildArcadeShell(p) {
    var M = ST.mats, A = ST.GEO.ARC;
    var x0 = A.x0, x1 = A.x1, z0 = A.z0, z1 = A.z1, h = A.h, t = 0.2;

    // 室内地板
    ST.bx(p, M.tile, [x0, x1], [0, 0.1], [z0, z1], { ol: false });

    // 后墙 / 左墙
    ST.bx(p, M.brickIn, [x0, x1], [0.1, h], [z0, z0 + t], { cs: true, rs: true });
    ST.bx(p, M.brickIn, [x0, x0 + t], [0.1, h], [z0, z1], { cs: true, rs: true });

    // 前立面：踢脚 / 招牌带
    ST.bx(p, M.stucco, [x0, x1], [0.1, 0.5], [z1 - t, z1], { cs: true });
    ST.bx(p, M.stucco, [x0, x1], [2.5, h], [z1 - t, z1], { cs: true });
    // 右立面
    ST.bx(p, M.stucco, [x1 - t, x1], [0.1, 0.5], [z0, z1 - t], { cs: true });
    ST.bx(p, M.stucco, [x1 - t, x1], [2.5, h], [z0, z1 - t], { cs: true });

    // 转角柱
    ST.bx(p, M.stucco2, [x1 - t, x1], [0.1, h], [z1 - t, z1], { cs: true });

    // 玻璃幕墙
    var glassY = [0.5, 2.5];
    // 前
    ST.bx(p, M.glass, [x0 + 0.02, x1 - t], glassY, [z1 - 0.11, z1 - 0.06], { ol: false });
    // 右
    ST.bx(p, M.glass, [x1 - 0.11, x1 - 0.06], glassY, [z0 + 0.02, z1 - t], { ol: false });

    // 竖框
    var mull = M.trim;
    [-1.48, -0.75, -0.02, 0.72, 1.45].forEach(function (x) {
      ST.bx(p, mull, [x - 0.026, x + 0.026], [0.5, 2.5], [z1 - 0.15, z1 - 0.02], { ol: 0.006 });
    });
    [1.62, 0.86, 0.1, -0.66, -1.42, -2.18, -2.94, -3.7].forEach(function (z) {
      ST.bx(p, mull, [x1 - 0.15, x1 - 0.02], [0.5, 2.5], [z - 0.026, z + 0.026], { ol: 0.006 });
    });
    // 横档
    ST.bx(p, mull, [x0, x1 - t], [2.12, 2.18], [z1 - 0.16, z1 - 0.02], { ol: 0.007 });
    ST.bx(p, mull, [x1 - 0.16, x1 - 0.02], [2.12, 2.18], [z0, z1 - t], { ol: 0.007 });

    // 女儿墙 + 剖面切边
    var cap = M.trim;
    ST.bx(p, M.stucco, [x0, x1], [h, h + 0.24], [z0, z0 + 0.16], { ol: 0.012 });
    ST.bx(p, M.stucco, [x0, x0 + 0.16], [h, h + 0.24], [z0, z1], { ol: 0.012 });
    ST.bx(p, M.stucco, [x0, x1], [h, h + 0.24], [z1 - 0.16, z1], { ol: 0.012 });
    ST.bx(p, M.stucco, [x1 - 0.16, x1], [h, h + 0.24], [z0, z1], { ol: 0.012 });
    ST.bx(p, cap, [x0 - 0.03, x1 + 0.03], [h + 0.24, h + 0.31], [z0 - 0.03, z0 + 0.19], { ol: 0.008 });
    ST.bx(p, cap, [x0 - 0.03, x0 + 0.19], [h + 0.24, h + 0.31], [z0, z1 + 0.03], { ol: 0.008 });
    ST.bx(p, cap, [x0 - 0.03, x1 + 0.03], [h + 0.24, h + 0.31], [z1 - 0.19, z1 + 0.03], { ol: 0.008 });
    ST.bx(p, cap, [x1 - 0.19, x1 + 0.03], [h + 0.24, h + 0.31], [z0, z1 + 0.03], { ol: 0.008 });

    // 雨棚（前立面）
    var awn = ST.grp(p, 0, 0, 0);
    ST.bx(awn, M.awning, [x0 + 0.1, 0.9], [2.42, 2.52], [z1, z1 + 0.62], { rx: 0.14, ol: 0.01 });
    for (var i = 0; i < 6; i++) {
      ST.bx(awn, M.awning2, [x0 + 0.1 + i * 0.45, x0 + 0.32 + i * 0.45], [2.44, 2.54], [z1, z1 + 0.62], { rx: 0.14, ol: false });
    }
    // 雨棚灯泡
    for (var b = 0; b < 7; b++) {
      ST.sph(awn, M.bulb, 0.045, x0 + 0.2 + b * 0.44, 2.3, z1 + 0.55, { ol: false });
      if (ST.theme === 'real') ST.glow(awn, 0xffc98a, 0.42, x0 + 0.2 + b * 0.44, 2.3, z1 + 0.55, 0.5);
    }

    // 入口门把手
    ST.cyl(p, M.chrome, 0.022, 0.022, 0.5, 1.1, 1.25, z1 - 0.2, { rx: Math.PI / 2, ol: false });

    // 门口地垫
    ST.bx(p, ST.toon(0x3a2a2a, {}), [0.55, 1.65], [0.005, 0.035], [2.02, 2.55], { ol: 0.008 });

    /* ---- 霓虹招牌 ---- */
    var up = ST.theme === 'up';
    // 主招牌底板
    ST.bx(p, ST.toon(0x12101a, {}), [x0 + 0.04, x1 - 0.06], [2.56, 3.24], [z1 - 0.02, z1 + 0.03], { ol: 0.008 });
    ST.neon(p, 'PALACE ARCADE', '#ff3fa4', 3.3, 0.82, -0.15, 2.92, z1 + 0.05, 0, { size: 104, tw: 1024, th: 256, gs: 1.7 });
    // 招牌外框灯管
    var tubeMat = ST.toon(up ? 0x2a1a22 : 0xff3fa4, { emissive: up ? 0x14060a : 0xff3fa4, ei: up ? 0.2 : 1.0 });
    ST.bx(p, tubeMat, [x0 + 0.06, x1 - 0.08], [2.58, 2.61], [z1 + 0.03, z1 + 0.06], { ol: false });
    ST.bx(p, tubeMat, [x0 + 0.06, x1 - 0.08], [3.19, 3.22], [z1 + 0.03, z1 + 0.06], { ol: false });

    // 转角刀旗
    ST.bx(p, ST.toon(0x12101a, {}), [2.02, 2.94], [2.42, 3.94], [1.54, 1.70], { ol: 0.01 });
    var vtex = ST.texNeonVert(up ? 'A  A  E' : 'ARCADE', '#4fe4ff');
    [1.705, 1.535].forEach(function (zz) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.3), new THREE.MeshBasicMaterial({
        map: vtex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, opacity: up ? 0.45 : 1
      }));
      m.position.set(2.48, 3.16, zz);
      p.add(m);
    });
    if (!up) {
      ST.glow(p, 0x4fe4ff, 2.0, 2.48, 3.16, 1.7, 0.35);
      ST.glow(p, 0xff3fa4, 3.6, -0.15, 2.92, 2.2, 0.32);
    }

    // 橱窗 OPEN 霓虹
    ST.neon(p, 'OPEN', '#ffb04a', 0.62, 0.24, 0.62, 1.82, z1 + 0.045, 0, { size: 150, tw: 512, th: 200, gs: 1.2 });
  }

  /* ---------------- 拜尔斯老屋外壳 ---------------- */
  function buildHouseShell(p) {
    var M = ST.mats, Hh = ST.GEO.HSE;
    var x0 = Hh.x0, x1 = Hh.x1, z0 = Hh.z0, z1 = Hh.z1, h = Hh.h, t = 0.16;

    // 地板
    ST.bx(p, M.floorWood, [x0, x1], [0, 0.1], [z0, z1], { ol: false });

    // 后墙 / 左墙 / 右墙
    ST.bx(p, M.woodTex, [x0, x1], [0.1, h], [z0, z0 + t], { cs: true, rs: true });
    ST.bx(p, M.woodTex, [x0, x0 + t], [0.1, h], [z0, z1], { cs: true, rs: true });
    ST.bx(p, M.woodTex, [x1 - t, x1], [0.1, h], [z0, z1], { cs: true });

    // 前墙分段：门洞 -5.35..-4.55，窗 A -4.2..-3.15，窗 B -2.85..-2.05
    var fz = [z1 - t, z1];
    ST.bx(p, M.woodTex, [x0, -5.35], [0.1, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-4.55, -4.2], [0.1, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-3.15, -2.85], [0.1, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-2.05, x1], [0.1, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-5.35, -4.55], [2.05, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-4.2, -3.15], [0.1, 0.85], fz, { cs: true });
    ST.bx(p, M.woodTex, [-4.2, -3.15], [1.95, h], fz, { cs: true });
    ST.bx(p, M.woodTex, [-2.85, -2.05], [0.1, 0.85], fz, { cs: true });
    ST.bx(p, M.woodTex, [-2.85, -2.05], [1.95, h], fz, { cs: true });

    // 窗框 + 玻璃
    function win(a, b, c, d) {
      ST.bx(p, M.trim, [a - 0.06, b + 0.06], [c - 0.06, c + 0.02], fz, { ol: 0.008 });
      ST.bx(p, M.trim, [a - 0.06, b + 0.06], [d - 0.02, d + 0.06], fz, { ol: 0.008 });
      ST.bx(p, M.trim, [a - 0.06, a + 0.02], [c, d], fz, { ol: 0.008 });
      ST.bx(p, M.trim, [b - 0.02, b + 0.06], [c, d], fz, { ol: 0.008 });
      ST.bx(p, M.trim, [(a + b) / 2 - 0.02, (a + b) / 2 + 0.02], [c, d], fz, { ol: 0.006 });
      ST.bx(p, M.glass, [a, b], [c, d], [z1 - 0.1, z1 - 0.07], { ol: false });
    }
    win(-4.2, -3.15, 0.85, 1.95);
    win(-2.85, -2.05, 0.85, 1.95);

    // 纱门
    ST.bx(p, M.woodDark, [-5.32, -4.58], [0.12, 2.02], [z1 - 0.12, z1 - 0.06], { ol: 0.01 });
    ST.bx(p, ST.toon(0x1a1a1a, { transparent: true, opacity: 0.55 }), [-5.24, -4.66], [0.28, 1.86], [z1 - 0.05, z1 - 0.02], { ol: false });
    ST.cyl(p, M.chrome, 0.018, 0.018, 0.18, -4.68, 1.05, z1 + 0.01, { rz: Math.PI / 2, ol: false });

    // 屋顶（仅后半段，前半段为剖面切开）
    var ry0 = 2.75, ridge = 3.85, rz = -2.45;
    ST.bx(p, M.shingle, [x0 - 0.16, x1 + 0.16], [ry0 - 0.1, ry0 + 0.06], [z0 - 0.18, rz], { rx: -0.6, ol: 0.014 });
    ST.bx(p, M.shingle, [x0 - 0.16, x1 + 0.16], [ry0 - 0.1, ry0 + 0.06], [rz, -1.0], { rx: 0.6, ol: 0.014 });
    // 屋脊
    ST.bx(p, M.woodDark, [x0 - 0.18, x1 + 0.18], [ridge - 0.06, ridge + 0.08], [rz - 0.09, rz + 0.09], { ol: 0.012 });
    // 山墙（剖面）
    ST.prismX(p, M.woodTex, [[z0, ry0], [-1.0, ry0], [rz, ridge]], x0, x1, { ol: 0.012 });
    // 剖面切边
    ST.bx(p, M.trim, [x0 - 0.05, x1 + 0.05], [ry0 - 0.02, ry0 + 0.06], [-1.06, -0.98], { ol: 0.008 });

    // 墙顶压条（开顶部分）
    ST.bx(p, M.trim, [x0 - 0.05, x0 + 0.2], [h - 0.02, h + 0.06], [-1.0, z1], { ol: 0.008 });
    ST.bx(p, M.trim, [x1 - 0.2, x1 + 0.05], [h - 0.02, h + 0.06], [-1.0, z1], { ol: 0.008 });
    ST.bx(p, M.trim, [x0 - 0.05, x1 + 0.05], [h - 0.02, h + 0.06], [z1 - 0.18, z1 + 0.04], { ol: 0.008 });

    // 门廊
    var px0 = -5.42, px1 = -2.0, pz0 = 0.9, pz1 = 1.72;
    ST.bx(p, M.woodLight, [px0, px1], [0.02, 0.18], [pz0, pz1], { ol: 0.012, cs: true });
    // 台阶
    ST.bx(p, M.woodLight, [px0 + 0.1, px1 - 0.1], [0.0, 0.11], [pz1, pz1 + 0.22], { ol: 0.01 });
    // 立柱
    ST.cyl(p, M.trim, 0.055, 0.065, 2.3, px0 + 0.1, 1.33, pz1 - 0.08, { ol: 0.008, cs: true });
    ST.cyl(p, M.trim, 0.055, 0.065, 2.3, px1 - 0.1, 1.33, pz1 - 0.08, { ol: 0.008, cs: true });
    // 门廊顶（雨檐）
    ST.bx(p, M.shingle, [px0 - 0.1, px1 + 0.1], [2.44, 2.53], [pz0 - 0.05, pz1 - 0.18], { rx: 0.16, ol: 0.012, cs: true });
    ST.bx(p, M.trim, [px0 - 0.12, px1 + 0.12], [2.36, 2.43], [pz1 - 0.24, pz1 - 0.14], { ol: 0.008 });
    // 栏杆
    ST.bx(p, M.trim, [px0, px1], [1.02, 1.09], [pz1 - 0.06, pz1], { ol: 0.008 });
    for (var i = 0; i < 12; i++) {
      ST.cyl(p, M.trim, 0.016, 0.016, 0.84, px0 + 0.14 + i * 0.28, 0.6, pz1 - 0.03, { ol: false });
    }
    // 摇椅
    var chair = ST.grp(p, -3.1, 0.18, 1.28);
    ST.bx(chair, M.woodDark, [-0.24, 0.24], [0.32, 0.4], [-0.24, 0.24], { ol: 0.008 });
    ST.bx(chair, M.woodDark, [-0.24, 0.24], [0.4, 0.95], [-0.26, -0.18], { ol: 0.008 });
    ST.bx(chair, M.woodDark, [-0.26, -0.2], [0.0, 0.34], [-0.2, 0.2], { ol: 0.006 });
    ST.bx(chair, M.woodDark, [0.2, 0.26], [0.0, 0.34], [-0.2, 0.2], { ol: 0.006 });

    // 门廊灯
    ST.bx(p, ST.toon(0x1a1a1a, {}), [-4.5, -4.34], [2.18, 2.3], [z1 - 0.02, z1 + 0.14], { ol: 0.006 });
    ST.sph(p, M.bulb, 0.055, -4.42, 2.12, z1 + 0.1, { ol: false });
    if (ST.theme === 'real') {
      ST.glow(p, 0xffb066, 0.85, -4.42, 2.1, z1 + 0.12, 0.55);
      var porchL = new THREE.PointLight(0xffa860, 0.75, 4.2, 2);
      porchL.position.set(-4.42, 2.05, z1 + 0.2);
      p.add(porchL);
    }

    // 门牌
    ST.bx(p, M.trim, [-4.5, -4.28], [1.9, 2.06], [z1 - 0.02, z1 + 0.02], { ol: 0.006 });

    // 信箱
    ST.cyl(p, M.metal, 0.03, 0.03, 0.9, -5.62, 0.45, 1.86, { ol: 0.006 });
    ST.bx(p, M.metal, [-5.78, -5.46], [0.86, 1.06], [1.78, 2.0], { ol: 0.008 });
  }

  /* ---------------- 街道路灯 / 电线杆 ---------------- */
  function buildPoles(p) {
    var M = ST.mats;

    /* 路灯 */
    var lp = ST.grp(p, -3.6, 0, 2.55);
    ST.cyl(lp, M.metal, 0.055, 0.085, 3.9, 0, 1.95, 0, { ol: 0.01, cs: true });
    ST.bx(lp, M.metal, [-0.08, 0.08], [0.0, 0.16], [-0.08, 0.08], { ol: 0.006 });
    // 弯臂
    ST.tube(lp, M.metal, [
      new THREE.Vector3(0, 3.86, 0),
      new THREE.Vector3(0, 4.02, 0.35),
      new THREE.Vector3(0, 4.02, 0.85)
    ], 0.045, 16, { ol: 0.008 });
    // 灯头
    ST.bx(lp, M.metal, [-0.13, 0.13], [3.9, 4.0], [0.76, 1.0], { ol: 0.008 });
    ST.bx(lp, M.bulb, [-0.1, 0.1], [3.84, 3.9], [0.8, 0.96], { ol: false });
    var upT = ST.theme === 'up';
    ST.glow(lp, upT ? 0xff4a32 : 0xffc98a, upT ? 1.3 : 1.9, 0, 3.78, 0.88, upT ? 0.4 : 0.75);
    var lampLight = new THREE.PointLight(upT ? 0xff5a3a : 0xffb877, upT ? 0.55 : 1.15, 8.0, 2);
    lampLight.position.set(0, 3.7, 0.88);
    lp.add(lampLight);
    lp.userData.flicker = lampLight;

    /* 电线杆 */
    var up = ST.grp(p, 2.5, 0, -0.55);
    ST.cyl(up, M.woodDark, 0.1, 0.13, 5.4, 0, 2.7, 0, { seg: 8, ol: 0.012, cs: true });
    ST.bx(up, M.woodDark, [-0.7, 0.7], [4.9, 5.0], [-0.04, 0.04], { ol: 0.008 });
    ST.bx(up, M.woodDark, [-0.5, 0.5], [4.3, 4.4], [-0.04, 0.04], { ol: 0.008 });
    for (var i = 0; i < 4; i++) {
      ST.cyl(up, ST.toon(0x6a7a8a, {}), 0.035, 0.035, 0.1, -0.6 + i * 0.4, 5.05, 0, { ol: false });
    }
    // 变压器
    ST.cyl(up, M.metal, 0.16, 0.16, 0.5, 0.28, 3.9, 0.16, { seg: 10, ol: 0.008 });

    // 电线
    function wire(a, b, sag, col, r) {
      var pts = [];
      for (var t = 0; t <= 10; t++) {
        var k = t / 10;
        var x = a.x + (b.x - a.x) * k;
        var y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * sag;
        var z = a.z + (b.z - a.z) * k;
        pts.push(new THREE.Vector3(x, y, z));
      }
      var c = new THREE.CatmullRomCurve3(pts);
      var m = new THREE.Mesh(new THREE.TubeGeometry(c, 22, r || 0.018, 4, false), ST.toon(col, {}));
      p.add(m);
    }
    var top = new THREE.Vector3(2.5, 5.28, -0.55);
    wire(top, new THREE.Vector3(-6.6, 4.9, -0.55), 0.5, 0x0c0e12);
    wire(top, new THREE.Vector3(6.6, 4.6, -0.55), 0.6, 0x0c0e12);
    wire(new THREE.Vector3(2.5, 5.28, -0.55), new THREE.Vector3(-3.6, 4.3, 2.55), 0.42, 0x0c0e12);
    wire(new THREE.Vector3(1.9, 4.95, -0.55), new THREE.Vector3(-5.0, 3.1, 0.9), 0.35, 0x0c0e12);
    wire(new THREE.Vector3(2.5, 5.28, -0.55), new THREE.Vector3(2.5, 4.2, 6.6), 0.55, 0x0c0e12);

    /* Hawkins 路牌 */
    var sp = ST.grp(p, 2.9, 0, 2.9);
    ST.cyl(sp, M.metal, 0.045, 0.05, 2.8, 0, 1.4, 0, { ol: 0.008 });
    var s1 = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.26), new THREE.MeshBasicMaterial({
      map: ST.texStreetSign(), transparent: true, side: THREE.DoubleSide
    }));
    s1.position.set(-0.52, 2.62, 0); s1.rotation.y = 0.02;
    sp.add(s1);
    var s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.26), new THREE.MeshBasicMaterial({
      map: ST.texStreetSign2(), transparent: true, side: THREE.DoubleSide
    }));
    s2.position.set(0, 2.34, 0.52); s2.rotation.y = Math.PI / 2;
    sp.add(s2);
    ST.bx(sp, M.metal, [-0.06, 0.06], [2.76, 2.82], [-0.06, 0.06], { ol: false });
  }

  /* ---------------- 街道道具 ---------------- */
  function buildProps(p) {
    var M = ST.mats, up = ST.theme === 'up';

    /* --- 黄色公用电话亭 --- */
    var tb = ST.grp(p, -4.85, 0.15, 2.35);
    var yellow = ST.toon(M.phoneBooth.color, {});
    var yDark = ST.toon(M.phoneBoothDark.color, {});
    ST.bx(tb, yDark, [-0.42, 0.42], [0, 0.1], [-0.38, 0.38], { ol: 0.01 });
    ST.bx(tb, yellow, [-0.42, 0.42], [0.1, 2.3], [-0.38, -0.3], { ol: 0.01, cs: true });
    ST.bx(tb, yellow, [-0.42, -0.34], [0.1, 2.3], [-0.3, 0.38], { ol: 0.01 });
    ST.bx(tb, yellow, [0.34, 0.42], [0.1, 2.3], [-0.3, 0.38], { ol: 0.01 });
    ST.bx(tb, yellow, [-0.42, 0.42], [2.16, 2.34], [-0.38, 0.38], { ol: 0.01 });
    // 顶部灯箱
    ST.bx(tb, ST.toon(up ? 0x1a1410 : 0xfff0c0, { emissive: up ? 0x100804 : 0xffd89a, ei: up ? 0.2 : 1.2 }), [-0.34, 0.34], [2.34, 2.6], [-0.3, 0.3], { ol: 0.01 });
    // 玻璃
    ST.bx(tb, M.glass, [-0.34, 0.34], [0.24, 2.1], [-0.3, -0.26], { ol: false });
    ST.bx(tb, M.glass, [-0.42, -0.38], [0.24, 2.1], [-0.3, 0.34], { ol: false });
    ST.bx(tb, M.glass, [0.38, 0.42], [0.24, 2.1], [-0.3, 0.34], { ol: false });
    ST.bx(tb, M.glass, [-0.36, 0.36], [0.24, 2.1], [0.34, 0.38], { ol: false });
    // 电话机
    ST.bx(tb, ST.toon(0x14161c, {}), [-0.1, 0.16], [1.05, 1.42], [-0.24, -0.16], { ol: 0.006 });
    ST.bx(tb, ST.toon(up ? 0x2a2a2a : 0x2a2e36, {}), [-0.06, 0.12], [1.1, 1.3], [-0.17, -0.13], { ol: false });
    // 门缝线
    ST.bx(tb, yDark, [-0.02, 0.02], [0.15, 2.1], [0.35, 0.39], { ol: false });
    if (up) {
      // 碎裂玻璃片
      for (var s = 0; s < 5; s++) {
        ST.bx(tb, ST.toon(0x5a6a7a, { transparent: true, opacity: 0.45 }), [-0.3 + ST.rand() * 0.6, -0.1 + ST.rand() * 0.6], [0.5 + ST.rand() * 1.2, 0.9 + ST.rand() * 1.4], [0.4, 0.42], { rz: ST.rr(-0.6, 0.6), ol: false });
      }
    }

    /* --- 可乐自动贩卖机 --- */
    var vm = ST.grp(p, -1.15, 0.15, 2.22);
    ST.bx(vm, ST.toon(0x1a1a20, {}), [-0.3, 0.3], [0, 1.7], [-0.26, 0.26], { ol: 0.01, cs: true });
    var vface = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.62), new THREE.MeshBasicMaterial({
      map: ST.texVending(ST.theme), transparent: false
    }));
    vface.position.set(0, 0.86, 0.265);
    vm.add(vface);
    if (!up) {
      ST.glow(vm, 0xff4040, 1.5, 0, 0.9, 0.35, 0.45);
      var vl = new THREE.PointLight(0xff5a4a, 0.38, 2.4, 2);
      vl.position.set(0, 0.9, 0.4); vm.add(vl);
    }

    /* --- BMX 自行车 --- */
    var bike = ST.grp(p, 1.15, 0.15, 2.28);
    bike.rotation.y = -0.28;
    bike.scale.setScalar(0.62);
    var frameMat = ST.toon(up ? 0x3a2a22 : 0xd83a4a, {});
    var tireMat = ST.toon(up ? 0x141210 : 0x1a1c22, {});
    var rimMat = ST.toon(up ? 0x2a2a2a : 0xc8ced8, {});
    function wheel(x) {
      var w = ST.grp(bike, x, 0.32, 0);
      var t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.038, 8, 18), tireMat);
      t.rotation.y = Math.PI / 2; w.add(t);
      var r = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 18), rimMat);
      r.rotation.y = Math.PI / 2; w.add(r);
      for (var k = 0; k < 6; k++) {
        var sp = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.5, 0.008), rimMat);
        sp.rotation.x = k * Math.PI / 6; w.add(sp);
      }
      return w;
    }
    wheel(-0.52); wheel(0.52);
    // 车架
    ST.tube(bike, frameMat, [
      new THREE.Vector3(-0.52, 0.32, 0), new THREE.Vector3(-0.1, 0.62, 0),
      new THREE.Vector3(0.18, 0.58, 0), new THREE.Vector3(0.5, 0.34, 0)
    ], 0.022, 20, { ol: 0.006 });
    ST.tube(bike, frameMat, [
      new THREE.Vector3(-0.1, 0.62, 0), new THREE.Vector3(0.5, 0.34, 0)
    ], 0.02, 8, { ol: 0.006 });
    ST.tube(bike, frameMat, [
      new THREE.Vector3(-0.1, 0.62, 0), new THREE.Vector3(-0.14, 0.3, 0)
    ], 0.018, 8, { ol: false });
    // 车座 / 车把
    ST.bx(bike, ST.toon(0x14161c, {}), [-0.22, -0.02], [0.66, 0.72], [-0.05, 0.05], { ol: 0.006 });
    ST.tube(bike, rimMat, [
      new THREE.Vector3(0.5, 0.34, 0), new THREE.Vector3(0.55, 0.68, 0)
    ], 0.018, 8, { ol: false });
    ST.bx(bike, rimMat, [0.52, 0.58], [0.68, 0.72], [-0.22, 0.22], { ol: 0.006 });
    if (up) { bike.rotation.z = 1.28; bike.rotation.y = 0.9; bike.position.y = 0.42; }

    /* --- 垃圾桶 --- */
    var tc = ST.grp(p, -2.55, 0.15, 2.45);
    ST.cyl(tc, ST.toon(up ? 0x1a1c1c : 0x2f6a52, {}), 0.24, 0.2, 0.72, 0, 0.36, 0, { seg: 10, ol: 0.01, cs: true });
    ST.cyl(tc, ST.toon(up ? 0x141414 : 0x24503f, {}), 0.26, 0.26, 0.07, 0, 0.74, 0, { seg: 10, ol: 0.008 });
    for (var g2 = 0; g2 < 3; g2++) {
      ST.bx(tc, ST.toon(0x0c0e10, {}), [-0.2, 0.2], [0.1 + g2 * 0.22, 0.14 + g2 * 0.22], [-0.26, 0.26], { ol: false });
    }

    /* --- 公告栏（寻人启事） --- */
    var bb = ST.grp(p, -4.6, 0.15, 1.95);
    ST.bx(bb, M.woodDark, [-0.62, 0.62], [0.0, 0.08], [-0.06, 0.06], { ol: 0.008 });
    ST.cyl(bb, M.woodDark, 0.035, 0.035, 1.2, -0.5, 0.6, 0, { ol: false });
    ST.cyl(bb, M.woodDark, 0.035, 0.035, 1.2, 0.5, 0.6, 0, { ol: false });
    ST.bx(bb, M.woodDark, [-0.66, 0.66], [1.1, 1.72], [-0.05, 0.05], { ol: 0.01, cs: true });
    var bface = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.56), new THREE.MeshBasicMaterial({ map: ST.texBulletin() }));
    bface.position.set(0, 1.41, 0.052); bb.add(bface);
    if (!up) {
      ST.bx(bb, ST.toon(0xfff0c0, { emissive: 0xffe0a0, ei: 0.8 }), [-0.62, 0.62], [1.74, 1.78], [0.0, 0.04], { ol: false });
    }

    /* --- 街角护栏 --- */
    var gr = ST.grp(p, 2.72, 0.15, 0);
    for (var i2 = 0; i2 < 3; i2++) {
      ST.cyl(gr, M.chrome, 0.028, 0.028, 0.78, 0, 0.39, 1.55 + i2 * 0.58, { ol: 0.006 });
    }
    ST.bx(gr, M.chrome, [-0.026, 0.026], [0.66, 0.71], [1.55, 2.72], { ol: 0.008 });
    ST.bx(gr, M.chrome, [-0.026, 0.026], [0.34, 0.39], [1.55, 2.72], { ol: 0.008 });

    /* --- 消防栓 --- */
    var fh = ST.grp(p, 2.45, 0.15, 1.15);
    ST.cyl(fh, ST.toon(up ? 0x2a1a1a : 0xc23a2a, {}), 0.075, 0.09, 0.42, 0, 0.21, 0, { ol: 0.008 });
    ST.sph(fh, ST.toon(up ? 0x2a1a1a : 0xc23a2a, {}), 0.08, 0, 0.44, 0, { ol: 0.006 });
    ST.bx(fh, ST.toon(0x2a2a2a, {}), [-0.14, 0.14], [0.28, 0.34], [-0.04, 0.04], { ol: false });

    /* --- 停车计时器 --- */
    for (var pm = 0; pm < 2; pm++) {
      var mtr = ST.grp(p, 2.4, 0.15, -1.9 - pm * 2.1);
      ST.cyl(mtr, M.metal, 0.028, 0.028, 1.05, 0, 0.52, 0, { ol: 0.005 });
      ST.bx(mtr, ST.toon(up ? 0x1a1c1c : 0x3a5a44, {}), [-0.075, 0.075], [1.05, 1.3], [-0.05, 0.05], { ol: 0.006 });
      ST.bx(mtr, ST.toon(0x0a0c10, {}), [-0.05, 0.05], [1.12, 1.2], [0.05, 0.06], { ol: false });
    }

    /* --- 空调外机 --- */
    function acUnit(x, y, z, ry) {
      var a = ST.grp(p, x, y, z);
      a.rotation.y = ry || 0;
      ST.bx(a, ST.toon(up ? 0x1e2020 : 0x9aa0a8, {}), [-0.32, 0.32], [-0.22, 0.22], [-0.18, 0.18], { ol: 0.008 });
      var fan = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 6, 14), ST.toon(0x14161a, {}));
      fan.position.set(0.1, 0, 0.19); a.add(fan);
      for (var b = 0; b < 4; b++) {
        var bl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.012), ST.toon(0x2a2c30, {}));
        bl.position.set(0.1, 0, 0.19); bl.rotation.z = b * Math.PI / 4; a.add(bl);
      }
      ST.bx(a, ST.toon(0x2a2c30, {}), [-0.3, -0.24], [-0.2, 0.2], [0.18, 0.22], { ol: false });
    }
    acUnit(-1.62, 1.75, -1.2, Math.PI / 2);
    acUnit(0.4, 0.35, -4.12, 0);

    /* --- 后院杂物 --- */
    var dump = ST.grp(p, 0.6, 0.08, -4.75);
    ST.bx(dump, ST.toon(up ? 0x1a1c1c : 0x2f4a3a, {}), [-0.55, 0.55], [0, 0.62], [-0.36, 0.36], { ol: 0.012, cs: true });
    ST.bx(dump, ST.toon(up ? 0x141616 : 0x264034, {}), [-0.58, 0.58], [0.62, 0.7], [-0.38, 0.38], { rx: -0.06, ol: 0.01 });
    ST.bx(dump, ST.toon(0x0a0c10, {}), [-0.5, 0.5], [0.3, 0.34], [0.36, 0.38], { ol: false });

    // 后门 + 灯泡
    ST.bx(p, M.woodDark, [1.05, 1.55], [0.1, 1.95], [-4.02, -3.98], { ol: 0.008 });
    ST.sph(p, M.bulb, 0.05, 1.3, 2.15, -3.9, { ol: false });
    if (ST.theme === 'real') ST.glow(p, 0xffc070, 0.7, 1.3, 2.15, -3.85, 0.5);

    // 垃圾桶旁的垃圾袋
    for (var bg = 0; bg < 3; bg++) {
      ST.sph(p, ST.toon(up ? 0x141414 : 0x2a2c30, {}), 0.13, -2.9 + bg * 0.22, 0.13, 2.3 + ST.rr(-0.1, 0.1), { sy: 0.8, ol: 0.006 });
    }

    /* --- 铁丝网围栏 --- */
    function fence(x0, x1, z, h) {
      var f = ST.grp(p, 0, 0, 0);
      var postMat = ST.toon(up ? 0x1e1e1e : 0x6a7078, {});
      for (var i = x0; i <= x1; i += 1.1) {
        ST.cyl(f, postMat, 0.028, 0.028, h, i, h / 2, z, { ol: 0.005 });
      }
      ST.bx(f, postMat, [x0, x1], [h - 0.04, h], [z - 0.012, z + 0.012], { ol: false });
      ST.bx(f, postMat, [x0, x1], [0.05, 0.09], [z - 0.012, z + 0.012], { ol: false });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, h - 0.1), new THREE.MeshBasicMaterial({
        color: 0x8a929c, wireframe: true, transparent: true, opacity: up ? 0.18 : 0.3
      }));
      mesh.position.set((x0 + x1) / 2, h / 2, z);
      f.add(mesh);
    }
    fence(-5.5, -3.5, 1.98, 1.15);
    fence(-5.4, 2.0, -6.45, 1.5);

    /* --- 立面细节 --- */
    var up2 = ST.theme === 'up';
    // 落水管
    function downspout(x, z, h) {
      ST.cyl(p, M.metal, 0.045, 0.045, h, x, h / 2, z, { seg: 8, ol: 0.006 });
      ST.cyl(p, M.metal, 0.045, 0.045, 0.5, x, 0.25, z + 0.2, { rx: Math.PI / 2, seg: 8, ol: 0.006 });
      for (var i = 1; i < 4; i++) {
        ST.bx(p, M.metal, [x - 0.06, x + 0.06], [h * i / 4 - 0.02, h * i / 4 + 0.02], [z - 0.06, z + 0.06], { ol: false });
      }
    }
    downspout(-1.62, 1.9, 3.2);
    downspout(-5.42, 0.78, 2.7);
    // 电线管
    ST.cyl(p, M.metal, 0.03, 0.03, 3.2, 1.86, 1.6, 1.86, { seg: 6, ol: false });
    ST.bx(p, M.metal, [1.84, 1.88], [0.1, 0.2], [1.5, 1.9], { ol: false });
    // 墙面海报（街机厅右墙）
    var po1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), new THREE.MeshBasicMaterial({ map: ST.texPoster(ST.theme) }));
    po1.position.set(2.005, 1.55, -0.35); po1.rotation.y = Math.PI / 2; p.add(po1);
    var po2 = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), new THREE.MeshBasicMaterial({ map: ST.texPoster(ST.theme) }));
    po2.position.set(2.005, 1.5, -1.0); po2.rotation.y = Math.PI / 2; po2.rotation.z = 0.03; p.add(po2);
    // 墙面壁灯
    var wl = ST.grp(p, 2.05, 2.55, -2.2);
    ST.bx(wl, ST.toon(0x1a1a1a, {}), [-0.12, 0.02], [-0.06, 0.06], [-0.06, 0.06], { ol: 0.004 });
    ST.cyl(wl, ST.toon(0x2a2a2a, {}), 0.09, 0.13, 0.12, -0.14, -0.06, 0, { seg: 8, open: true, ol: 0.004 });
    if (!up2) {
      ST.glow(wl, 0xffc070, 0.7, -0.14, -0.16, 0, 0.5);
      var wll = new THREE.PointLight(0xffb066, 0.45, 2.4, 2);
      wll.position.set(-0.2, -0.2, 0); wl.add(wll);
    }

    // 报刊箱
    var nb = ST.grp(p, 2.42, 0.15, 0.35);
    ST.bx(nb, ST.toon(up2 ? 0x1a1c22 : 0x2a5a8a, {}), [-0.16, 0.16], [0, 0.55], [-0.13, 0.13], { ol: 0.008, cs: true });
    ST.bx(nb, ST.toon(0x0a0c10, {}), [-0.11, 0.11], [0.3, 0.45], [0.13, 0.15], { ol: false });
    ST.bx(nb, ST.toon(up2 ? 0x24262a : 0xc8ccd4, {}), [-0.14, 0.14], [0.55, 0.6], [-0.11, 0.11], { ol: 0.006 });

    // 路锥
    var cone = ST.grp(p, 3.35, 0.02, 2.1);
    ST.cyl(cone, ST.toon(up2 ? 0x2a1a14 : 0xd85a2a, {}), 0.04, 0.13, 0.42, 0, 0.21, 0, { seg: 8, ol: 0.006 });
    ST.bx(cone, ST.toon(0x2a2a2a, {}), [-0.15, 0.15], [0, 0.03], [-0.15, 0.15], { ol: 0.004 });

    // 老屋窗台花箱
    ST.bx(p, M.woodDark, [-4.22, -3.13], [0.78, 0.9], [0.9, 1.06], { ol: 0.008 });
    for (var wb = 0; wb < 6; wb++) {
      ST.sph(p, ST.toon(up2 ? 0x1a1414 : 0x2a4a2a, {}), 0.07, -4.12 + wb * 0.19, 0.94, 0.98, { sy: 0.7, ol: false });
    }

    /* --- 树 --- */
    function tree(x, z, h, seedR, bare) {
      var t = ST.grp(p, x, 0.05, z);
      t.rotation.y = ST.rr(0, 6.28);
      var bark = ST.toon(M.bark.color, {});
      ST.cyl(t, bark, 0.055, 0.11, h * 0.62, 0, h * 0.31, 0, { seg: 7, ol: 0.008 });
      var n = bare ? 5 : 4;
      for (var i = 0; i < n; i++) {
        var a = ST.rr(0, 6.28), r = ST.rr(0.18, 0.42);
        var pts = [
          new THREE.Vector3(0, h * 0.45, 0),
          new THREE.Vector3(Math.cos(a) * r, h * 0.62, Math.sin(a) * r),
          new THREE.Vector3(Math.cos(a) * r * 1.9, h * 0.8, Math.sin(a) * r * 1.9)
        ];
        ST.tube(t, bark, pts, 0.035, 10, { ol: 0.006 });
        if (!bare) {
          ST.sph(t, ST.toon(M.leaf.color, {}), ST.rr(0.24, 0.36), Math.cos(a) * r * 2, h * 0.82, Math.sin(a) * r * 2, { sy: 0.8, ol: 0.008 });
        } else {
          for (var k = 0; k < 3; k++) {
            var pts2 = [
              new THREE.Vector3(Math.cos(a) * r * 1.9, h * 0.8, Math.sin(a) * r * 1.9),
              new THREE.Vector3(Math.cos(a + 0.5) * r * 2.6, h * 0.95, Math.sin(a + 0.5) * r * 2.6)
            ];
            ST.tube(t, bark, pts2, 0.02, 6, {});
          }
        }
      }
      return t;
    }
    tree(-6.15, -1.2, 2.9, 1, up);
    tree(-6.2, -5.4, 2.4, 2, up);
    tree(-1.0, -6.0, 2.2, 3, up);
    tree(-4.3, -5.9, 2.6, 4, up);
    if (!up) {
      tree(-6.1, -3.3, 2.2, 5, false);
    }
  }

  /* ---------------- 建筑内部（在 interior.js 中实现） ---------------- */
  ST.buildWorld = function (theme) {
    ST.theme = theme;
    ST.mats = ST.buildMats(theme);
    ST.setSeed(1983);

    var g = new THREE.Group();
    g.name = theme;

    buildGround(g);
    buildArcadeShell(g);
    buildHouseShell(g);
    buildPoles(g);
    buildProps(g);
    if (ST.buildInteriors) ST.buildInteriors(g);
    if (theme === 'real' && ST.addWetReflections) ST.addWetReflections(g);
    if (ST.corruptPass && theme === 'up') ST.corruptPass(g);
    return g;
  };
})();
