/* =========================================================
   building.js — the red-brick corner house, shopfronts, neon
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP, P = QP.PAL, B = QP.L.build;
  var MAT = {};

  function add(parent, w, h, d, mat, x, y, z, o) {
    o = o || {};
    var m = QP.box(w, h, d, mat, o.outline === undefined ? false : o.outline, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    if (o.receive !== false) m.receiveShadow = true;
    return m;
  }
  function cylAt(parent, rt, rb, h, seg, mat, x, y, z, o) {
    o = o || {};
    var m = QP.cyl(rt, rb, h, seg, mat, o.outline === undefined ? false : o.outline, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    return m;
  }
  function rotZ(parent, w, h, d, mat, x, y, z, rz, o) {
    o = o || {};
    o.rz = rz;
    return add(parent, w, h, d, mat, x, y, z, o);
  }
  function rotX(parent, w, h, d, mat, x, y, z, rx, o) {
    o = o || {};
    o.rx = rx;
    return add(parent, w, h, d, mat, x, y, z, o);
  }

  QP.buildBuilding = function (world) {
    var g = QP.group(world, 0, 0, 0);
    g.name = 'red-brick-house';
    QP.building = g;
    var x0 = B.x0, x1 = B.x1, z0 = B.z0, z1 = B.z1, ch = B.chamfer;
    var BR = B.h1, BT = B.h2, UL = B.h3;
    var C = new T.Vector3(x1 - ch, 0, z1);
    var D = new T.Vector3(x1, 0, z1 - ch);
    var M = C.clone().add(D).multiplyScalar(0.5);
    var chW = C.distanceTo(D);
    var chRot = Math.PI / 4;

    /* ---------------- shared materials ---------------- */
    var brick = QP.Tex.brick();
    var brickMap = QP.cloneTex(brick.map, 2.6, 2.4);
    brickMap.offset.set(0.05, 0.08);
    var brickBump = QP.cloneTex(brick.bump, 2.6, 2.4);
    MAT.brick = QP.toon(0xffffff, { map: brickMap, bumpMap: brickBump, bumpScale: 0.035, rim: 0.035, rimColor: 0x9c6d68 });
    var brickMapS = QP.cloneTex(brick.map, 1.2, 1.5);
    MAT.brickSmall = QP.toon(0xffffff, { map: brickMapS, bumpMap: QP.cloneTex(brick.bump, 1.2, 1.5), bumpScale: 0.03, rim: 0.04 });
    var stoneTexBase = QP.Tex.stone();
    var stoneMap = QP.cloneTex(stoneTexBase, 1.4, 1.4);
    var stoneMap2 = QP.cloneTex(stoneTexBase, 1.2, 1.2);
    MAT.stone = QP.toon(0xc5baa5, { map: stoneMap, bumpMap: stoneMap, bumpScale: .012, rim: 0.04, rimColor: 0x8b765f });
    MAT.stoneLight = QP.toon(0xd4c8b0, { map: stoneMap2, bumpMap: stoneMap2, bumpScale: .008 });
    MAT.stoneDark = QP.toon(0x6c6354, { map: stoneMap2, bumpMap: stoneMap2, bumpScale: .01 });
    MAT.trim = QP.toon(0xbbb09b, { map: stoneMap2, rim: 0.03 });
    MAT.stucco = QP.toon(0x61584b);
    MAT.walnut = QP.std(0x40291a, { map: QP.cloneTex(QP.Tex.walnutDark(), 1.5, 1.2), roughness: 0.36, metalness: 0.04, envMapIntensity: 0.7 });
    MAT.walnutLight = QP.std(0x7d5736, { map: QP.cloneTex(QP.Tex.walnut(), 1.2, 1), roughness: 0.32, metalness: 0.05, envMapIntensity: 0.8 });
    MAT.brass = QP.brass(0xc49b4e, 0.24);
    MAT.brassDark = QP.brass(0x7d5b25, 0.36);
    MAT.iron = QP.iron(0x16191b);
    MAT.ironLight = QP.iron(0x2d3031);
    MAT.glass = QP.glass(0xa8c0cb, 0.10);
    MAT.glassWarm = QP.glass(0xb4c6c4, 0.055);
    MAT.glassDark = QP.glass(0x627a82, 0.22);
    MAT.led = new T.MeshBasicMaterial({ color: 0xffffff });
    MAT.led.color.setRGB(1.7, 1.4, 0.8);
    MAT.neonRed = QP.basic(0xff507e); MAT.neonRed.color.setRGB(1.8, 0.32, 0.58);
    MAT.neonPink = QP.basic(0xffa0b8); MAT.neonPink.color.setRGB(2.0, 0.9, 1.15);
    MAT.neonTeal = QP.basic(0x52e3d7); MAT.neonTeal.color.setRGB(0.35, 1.8, 1.65);
    var glowTex = QP.Tex.glow();
    var starGlow = QP.Tex.starGlow();

    MAT.interiorWall = QP.toon(0x5d4738);
    MAT.ceiling = QP.toon(0x3e2b21);

    var bodyZ = z1;
    var wallThick = 0.42;

    /* ---------------- rusticated base ---------------- */
    function stoneBaseSouth(xa, xb, zf) {
      var w = xb - xa;
      add(g, w, 0.28, 0.14, MAT.stoneDark, (xa + xb) / 2, 0.14, zf + 0.03, { receive: true });
      for (var x = xa + 0.10; x < xb; x += 0.62) {
        add(g, 0.025, 0.24, 0.155, QP.toon(0x423b31), x, 0.14, zf + 0.055, {});
      }
      add(g, w, 0.06, 0.17, MAT.stone, (xa + xb) / 2, 0.31, zf + 0.055, {});
    }
    stoneBaseSouth(x0, C.x, z1);
    /* east stone base */
    add(g, 0.14, 0.28, (z1 - z0), MAT.stoneDark, x1 + 0.03, 0.14, (z0 + z1) / 2, {});
    add(g, 0.06, 0.06, (z1 - z0), MAT.stone, x1 + 0.075, 0.31, (z0 + z1) / 2, {});
    /* back / west base */
    add(g, 0.14, 0.28, (z1 - z0), MAT.stoneDark, x0 - 0.03, 0.14, (z0 + z1) / 2, {});
    add(g, (x1 - x0), 0.28, 0.14, MAT.stoneDark, (x0 + x1) / 2, 0.14, z0 - 0.03, {});
    /* chamfer base */
    var chBase = QP.group(g, M.x, 0, M.z); chBase.rotation.y = chRot;
    add(chBase, chW, 0.28, 0.14, MAT.stoneDark, 0, 0.14, 0.03, {});
    add(chBase, chW, 0.06, 0.17, MAT.stone, 0, 0.31, 0.055, {});

    /* ---------------- ground floor, south shopfront ---------------- */
    var winY0 = 0.58, winY1 = 2.98;
    var piers = [
      { a: x0, b: -5.46, mat: 'brick' },
      { a: -4.10, b: -3.98, mat: 'wood' },
      { a: -3.10, b: -2.98, mat: 'wood' },
      { a: -1.84, b: -1.74, mat: 'wood' },
      { a: 0.21, b: C.x, mat: 'brick' }
    ];
    for (var p = 0; p < piers.length; p++) {
      var pp = piers[p];
      add(g, pp.b - pp.a, 2.82, 0.22, pp.mat === 'brick' ? MAT.brickSmall : MAT.walnut, (pp.a + pp.b) / 2, 1.59, z1 + 0.085, { outline: true, thick: 0.002 });
    }
    /* deep walnut sill panel under windows */
    function underPanel(xa, xb) {
      add(g, xb - xa, 0.40, 0.14, MAT.walnut, (xa + xb) / 2, 0.38, z1 + 0.06, { outline: true, thick: 0.002 });
      add(g, xb - xa, 0.035, 0.18, MAT.stoneLight, (xa + xb) / 2, 0.585, z1 + 0.075, {});
      /* brass grille */
      var n = Math.max(2, Math.round((xb - xa) / 0.26));
      for (var i = 0; i < n; i++) {
        add(g, 0.016, 0.29, 0.015, MAT.brassDark, xa + 0.10 + i * (xb - xa - 0.2) / (n - 1), 0.37, z1 + 0.142, {});
      }
      add(g, xb - xa - 0.16, 0.014, 0.015, MAT.brassDark, (xa + xb) / 2, 0.23, z1 + 0.142, {});
      add(g, xb - xa - 0.16, 0.014, 0.015, MAT.brassDark, (xa + xb) / 2, 0.51, z1 + 0.142, {});
    }
    underPanel(-5.46, -4.10);
    underPanel(-2.98, -1.84);
    underPanel(-1.74, 0.21);

    /* shop window glass + frames */
    function shopWindow(cx, w, kind) {
      var xa = cx - w / 2, y0 = winY0, y1 = winY1;
      add(g, 0.075, y1 - y0, 0.13, MAT.walnut, xa, (y0 + y1) / 2, z1 + 0.11, { outline: true, thick: 0.0024 });
      add(g, 0.075, y1 - y0, 0.13, MAT.walnut, xa + w, (y0 + y1) / 2, z1 + 0.11, { outline: true, thick: 0.0024 });
      add(g, w, 0.10, 0.16, MAT.walnut, cx, y1, z1 + 0.105, { outline: true, thick: 0.002 });
      add(g, w, 0.12, 0.16, MAT.walnut, cx, y0, z1 + 0.10, { outline: true, thick: 0.002 });
      /* transom rail */
      add(g, w, 0.065, 0.13, MAT.walnut, cx, 2.53, z1 + 0.11, {});
      add(g, w - 0.18, 0.018, 0.04, MAT.brass, cx, 2.565, z1 + 0.18, {});
      /* mullions */
      var panes = w > 2.2 ? 3 : 2;
      for (var i = 1; i < panes; i++) {
        add(g, 0.045, y1 - y0 - 0.12, 0.10, MAT.walnut, xa + i * w / panes, (y0 + y1) / 2, z1 + 0.12, {});
      }
      /* clear lower glass & mottled upper transom */
      var glassM = kind === 'record' ? MAT.glassWarm : MAT.glass;
      var gx = new T.Mesh(new T.PlaneGeometry(w - 0.13, y1 - y0 - 0.11), glassM);
      gx.position.set(cx, (y0 + y1) / 2, z1 + 0.045);
      gx.renderOrder = 12;
      g.add(gx);
      /* colored/etched transom: a delicate amber strip with lettering */
      var transC = QP.canvas(1024, 160), tg = transC.getContext('2d');
      tg.fillStyle = '#4c3826'; tg.fillRect(0, 0, 1024, 160);
      var tgr = tg.createLinearGradient(0, 0, 0, 160);
      tgr.addColorStop(0, 'rgba(255,205,125,.10)'); tgr.addColorStop(1, 'rgba(52,26,22,.35)');
      tg.fillStyle = tgr; tg.fillRect(0, 0, 1024, 160);
      tg.strokeStyle = 'rgba(212,173,98,.55)'; tg.lineWidth = 3; tg.strokeRect(12, 12, 1000, 136);
      tg.fillStyle = 'rgba(230,199,131,.84)'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      tg.font = '400 48px "PMingLiU","MingLiU","Microsoft JhengHei",serif';
      tg.fillText(kind === 'record' ? '百 代 留 聲' : '綺 羅 旗 袍', 512, 75);
      tg.font = '17px Georgia,serif'; tg.fillStyle = 'rgba(222,188,118,.48)';
      tg.fillText(kind === 'record' ? 'PAI TAI RECORDS' : 'CHI LO QIPAO ATELIER', 512, 118);
      var tm = new T.Mesh(new T.PlaneGeometry(w - 0.30, 0.30), QP.basic(0xffffff, { map: QP.texture(transC, { repeat: [1, 1] }), transparent: true, opacity: 0.9 }));
      tm.position.set(cx, 2.76, z1 + 0.062); g.add(tm);
      /* tiny brass name plate on lower frame */
      var bpC = QP.canvas(256, 64), bp = bpC.getContext('2d');
      bp.fillStyle = '#6f5324'; bp.fillRect(0, 0, 256, 64);
      bp.strokeStyle = '#d5b674'; bp.lineWidth = 2; bp.strokeRect(4, 4, 248, 56);
      bp.fillStyle = '#e7cd94'; bp.font = '20px "PMingLiU",serif'; bp.textAlign = 'center';
      bp.fillText(kind === 'record' ? '黑 膠 唱 片' : '高 級 定 製', 128, 40);
      var bpm = new T.Mesh(new T.PlaneGeometry(0.78, 0.19), QP.basic(0xffffff, { map: QP.texture(bpC, { repeat: [1, 1] }) }));
      bpm.position.set(cx, 0.34, z1 + 0.152); g.add(bpm);
      /* brass corner bolts */
      for (var s = -1; s <= 1; s += 2) {
        for (var yy = 0; yy <= 1; yy++) {
          var bolt = QP.cyl(0.026, 0.026, 0.018, 8, MAT.brass, false);
          bolt.rotation.x = Math.PI / 2;
          QP.put(g, bolt, cx + s * (w / 2 - 0.055), y0 + 0.06 + yy * (y1 - y0 - 0.12), z1 + 0.19);
        }
      }
      /* glass reflections */
      var refC = QP.canvas(512, 256), rg = refC.getContext('2d');
      rg.clearRect(0, 0, 512, 256);
      var grad = rg.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, 'rgba(150,194,215,0)');
      grad.addColorStop(.38, 'rgba(165,205,220,.18)');
      grad.addColorStop(.44, 'rgba(235,205,156,.12)');
      grad.addColorStop(.56, 'rgba(255,96,139,.14)');
      grad.addColorStop(.64, 'rgba(150,194,215,0)');
      grad.addColorStop(1, 'rgba(100,164,183,.06)');
      rg.fillStyle = grad; rg.fillRect(0, 0, 512, 256);
      for (var q = 0; q < 18; q++) {
        rg.fillStyle = 'rgba(205,224,235,' + (0.015 + Math.random() * .04) + ')';
        rg.fillRect(20 + Math.random() * 470, 8 + Math.random() * 170, 1 + Math.random() * 3, 40 + Math.random() * 120);
      }
      var rmat = QP.basic(0xffffff, { map: QP.texture(refC, { repeat: [1, 1] }), transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false });
      var refl = new T.Mesh(new T.PlaneGeometry(w - 0.12, y1 - y0 - 0.12), rmat);
      refl.position.set(cx, (y0 + y1) / 2, z1 + 0.20);
      refl.renderOrder = 13;
      g.add(refl);
      QP.storeGlassRefs = QP.storeGlassRefs || [];
      QP.storeGlassRefs.push(refl);
    }
    shopWindow(-4.78, 1.36, 'tailor');
    shopWindow(-2.41, 1.14, 'tailor');
    shopWindow(-0.765, 1.95, 'record');

    /* two entrance doors */
    function shopDoor(cx, w, kind, openAngle, hingeSide) {
      var y0 = 0.18, y1 = 2.98;
      add(g, 0.10, y1 - y0, 0.18, MAT.walnut, cx - w / 2, (y0 + y1) / 2, z1 + 0.105, { outline: true, thick: 0.002 });
      add(g, 0.10, y1 - y0, 0.18, MAT.walnut, cx + w / 2, (y0 + y1) / 2, z1 + 0.105, { outline: true, thick: 0.002 });
      add(g, w, 0.11, 0.20, MAT.walnut, cx, y1, z1 + 0.10, { outline: true, thick: 0.002 });
      /* warm transom above the door */
      var top = add(g, w - 0.1, 0.36, 0.055, MAT.glassWarm, cx, 2.79, z1 + 0.055, { receive: false });
      top.renderOrder = 12;
      /* door pivot */
      var pivot = QP.group(g, hingeSide > 0 ? cx + w / 2 - 0.04 : cx - w / 2 + 0.04, y0, z1 + 0.02);
      pivot.rotation.y = openAngle || 0;
      var dir = hingeSide > 0 ? -1 : 1;
      var dw = w - 0.12;
      function dp(wx, wy, wz, ww, wh, wd, mat, oo) {
        var m = add(pivot, ww, wh, wd, mat, wx, wy, wz, oo || {});
        return m;
      }
      dp(dir * dw / 2, 0.21, 0, dw, 0.42, 0.06, MAT.walnut, { outline: true, thick: 0.0018 });
      dp(dir * dw / 2, 1.6, 0, dw, 2.34, 0.035, MAT.glassWarm, { receive: false }).renderOrder = 12;
      dp(dir * dw / 2, 2.87, 0, dw, 0.20, 0.05, MAT.walnut, {});
      dp(0, 0, 0, 0.065, 2.8, 0.075, MAT.walnut, { outline: true, thick: 0.0018 });
      dp(dir * dw, 0, 0, 0.065, 2.8, 0.075, MAT.walnut, { outline: true, thick: 0.0018 });
      dp(dir * (dw - 0.06), 1.75, 0, 0.06, 2.1, 0.09, MAT.walnut, {});
      dp(dir * dw / 2, 0.7, 0, dw - 0.1, 0.07, 0.075, MAT.walnut, {});
      /* etched monogram */
      var ec = QP.canvas(256, 512), eg = ec.getContext('2d');
      eg.clearRect(0, 0, 256, 512);
      eg.strokeStyle = 'rgba(213,189,139,.55)'; eg.lineWidth = 2;
      eg.beginPath(); eg.arc(128, 170, 58, 0, 6.3); eg.stroke();
      eg.beginPath(); eg.arc(128, 170, 43, 0, 6.3); eg.stroke();
      eg.fillStyle = 'rgba(224,202,154,.55)'; eg.textAlign = 'center'; eg.font = '400 46px "PMingLiU",serif';
      eg.fillText(kind === 'record' ? '聲' : '裳', 128, 188);
      eg.strokeStyle = 'rgba(213,189,139,.35)';
      for (var v = 0; v < 4; v++) { eg.beginPath(); eg.moveTo(70, 255 + v * 30); eg.lineTo(186, 255 + v * 30); eg.stroke(); }
      var et = new T.Mesh(new T.PlaneGeometry(0.46, 1.0), QP.basic(0xffffff, { map: QP.texture(ec, { repeat: [1, 1] }), transparent: true, opacity: .9, depthWrite: false }));
      et.position.set(dir * dw / 2, 1.86, 0.03); et.rotation.y = dir > 0 ? 0 : Math.PI;
      pivot.add(et);
      /* brass pull */
      var pull = add(pivot, 0.035, 0.62, 0.035, MAT.brass, dir * (dw - 0.15), 1.42, 0.075, {});
      add(pivot, 0.10, 0.10, 0.07, MAT.brass, dir * (dw - 0.15), 1.15, 0.055, {});
      add(pivot, 0.10, 0.10, 0.07, MAT.brass, dir * (dw - 0.15), 1.69, 0.055, {});
      /* tiny hanging sign */
      var sc = QP.canvas(128, 256), sg = sc.getContext('2d');
      sg.fillStyle = '#1b1714'; sg.fillRect(0, 0, 128, 256);
      sg.strokeStyle = 'rgba(206,171,92,.75)'; sg.lineWidth = 2; sg.strokeRect(6, 6, 116, 244);
      sg.fillStyle = '#e0c481'; sg.textAlign = 'center'; sg.font = '36px "PMingLiU",serif';
      sg.fillText(kind === 'record' ? '唱' : '裁', 64, 88);
      sg.fillText(kind === 'record' ? '片' : '縫', 64, 142);
      sg.font = '11px Georgia,serif'; sg.fillStyle = 'rgba(218,182,103,.6)';
      sg.fillText(kind === 'record' ? 'OPEN' : 'ATELIER', 64, 210);
      var sm = new T.Mesh(new T.PlaneGeometry(0.22, 0.46), QP.basic(0xffffff, { map: QP.texture(sc, { repeat: [1, 1] }) }));
      sm.position.set(dir * (dw - 0.2), 2.32, 0.06); pivot.add(sm);
      /* step lamp warm spill */
    }
    shopDoor(-3.54, 0.88, 'tailor', 0.58, -1);

    /* ---------------- fascia / shop naming ---------------- */
    add(g, C.x - x0, 0.60, 0.22, MAT.walnut, (x0 + C.x) / 2, 3.30, z1 + 0.11, { outline: true, thick: 0.0023, cast: true });
    /* sign boards */
    function fasciaSign(tex, w, h, x, y, face, groupParent) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), QP.basic(0xffffff, { map: tex }));
      m.position.set(x, y, face);
      if (groupParent) groupParent.add(m); else g.add(m);
      /* brass frame */
      add(g, w + 0.16, 0.055, 0.04, MAT.brassDark, x, y + h / 2 + 0.02, face + 0.015, {});
      add(g, w + 0.16, 0.055, 0.04, MAT.brassDark, x, y - h / 2 - 0.02, face + 0.015, {});
      add(g, w, 0.035, 0.03, MAT.brassDark, x, y, face + 0.02, {});
      return m;
    }
    var tailorFascia = QP.Tex.fascia('tailor');
    var recordFascia = QP.Tex.fascia('record');
    fasciaSign(tailorFascia, 3.85, 0.51, -3.58, 3.32, z1 + 0.228, g);
    fasciaSign(recordFascia, 1.82, 0.51, -0.77, 3.32, z1 + 0.228, g);
    /* fascia little lamps */
    for (var fl = 0; fl < 4; fl++) {
      var fx = -5.05 + fl * 1.22;
      var arm = add(g, 0.02, 0.18, 0.05, MAT.brassDark, fx, 3.62, z1 + 0.28, {});
      var hood = add(g, 0.12, 0.08, 0.16, MAT.brass, fx, 3.68, z1 + 0.31, { outline: true, thick: 0.0015 });
      var bulb = QP.sphere(0.045, 8, 6, QP.basic(0xffdd9c, { transparency: false }), false);
      QP.put(g, bulb, fx, 3.61, z1 + 0.32);
      QP.addGlowSprite(g, glowTex, 0xffb965, 0.42, .55, fx, 3.60, z1 + 0.34);
    }

    /* ---------------- east shopfront ---------------- */
    var ex = x1 + 0.085;
    var eastGroup = QP.group(g, x1, 0, -2.18);
    eastGroup.rotation.y = Math.PI / 2;
    var eastW = 3.18;
    /* record shop east window: local +z outward = +x */
    function eastShopWindow() {
      var z0 = -eastW / 2, z1 = eastW / 2;
      add(eastGroup, 0.22, 2.82, 0.16, MAT.brickSmall, -1.79, 1.59, 0.08, { outline: true, thick: 0.002 });
      add(eastGroup, 0.22, 2.82, 0.16, MAT.brickSmall, 1.79, 1.59, 0.08, { outline: true, thick: 0.002 });
      add(eastGroup, eastW, 0.12, 0.16, MAT.walnut, 0, 0.58, 0.09, {});
      add(eastGroup, eastW, 0.10, 0.16, MAT.walnut, 0, 2.98, 0.09, {});
      add(eastGroup, eastW - 0.5, 0.40, 0.14, MAT.walnut, 0, 0.38, 0.06, {});
      var glass = new T.Mesh(new T.PlaneGeometry(eastW - 0.2, 2.3), MAT.glassWarm);
      glass.position.set(0, 1.78, 0.05); glass.rotation.y = 0; glass.renderOrder = 12; eastGroup.add(glass);
      for (var i = 1; i < 4; i++) add(eastGroup, 0.05, 2.35, 0.11, MAT.walnut, -eastW / 2 + i * eastW / 4, 1.78, 0.11, {});
      add(eastGroup, eastW - 0.12, 0.065, 0.12, MAT.walnut, 0, 2.52, 0.11, {});
      add(eastGroup, eastW - 0.12, 0.02, 0.04, MAT.brass, 0, 2.56, 0.17, {});
      /* transom lettering */
      var tc = QP.canvas(1024, 144), tg = tc.getContext('2d');
      tg.fillStyle = '#1f2a25'; tg.fillRect(0, 0, 1024, 144);
      tg.strokeStyle = 'rgba(175,210,183,.4)'; tg.lineWidth = 2; tg.strokeRect(10, 10, 1004, 124);
      tg.fillStyle = 'rgba(230,213,171,.8)'; tg.font = '40px "PMingLiU",serif'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      tg.fillText('百 代 留 聲 · 黑 膠 唱 片', 512, 72);
      var tx = new T.Mesh(new T.PlaneGeometry(eastW - 0.2, 0.27), QP.basic(0xffffff, { map: QP.texture(tc), transparent: true, opacity: .9 }));
      tx.position.set(0, 2.76, 0.065); eastGroup.add(tx);
      /* brass grill below */
      for (var q = 0; q < 12; q++) add(eastGroup, 0.014, 0.27, 0.018, MAT.brassDark, -eastW / 2 + 0.18 + q * (eastW - 0.35) / 11, 0.37, 0.14, {});
      /* name plate */
      var nC = QP.canvas(512, 100), ng = nC.getContext('2d');
      ng.fillStyle = '#604419'; ng.fillRect(0, 0, 512, 100); ng.strokeStyle = '#d3b572'; ng.lineWidth = 3; ng.strokeRect(4, 4, 504, 92);
      ng.fillStyle = '#ecd499'; ng.font = '30px "PMingLiU",serif'; ng.textAlign = 'center'; ng.fillText('PAI TAI  ·  1931', 256, 61);
      var np = new T.Mesh(new T.PlaneGeometry(1.2, 0.23), QP.basic(0xffffff, { map: QP.texture(nC) }));
      np.position.set(0, 0.33, 0.15); eastGroup.add(np);
    }
    eastShopWindow();
    /* east fascia sign */
    var eastSign = new T.Mesh(new T.PlaneGeometry(3.16, 0.51), QP.basic(0xffffff, { map: recordFascia }));
    eastSign.position.set(0.06, 3.32, 0.24); eastSign.rotation.y = 0; eastGroup.add(eastSign);
    add(eastGroup, 3.3, 0.60, 0.22, MAT.walnut, 0, 3.30, 0.11, { outline: true, thick: 0.002 });
    add(eastGroup, 3.32, 0.055, 0.04, MAT.brassDark, 0, 3.58, 0.245, {});
    add(eastGroup, 3.32, 0.055, 0.04, MAT.brassDark, 0, 3.05, 0.245, {});
    /* service end of east wall */
    add(g, 0.20, BR - 0.18, 2.3, MAT.brickSmall, x1 + 0.07, 1.90, -5.16, { outline: true, thick: 0.002 });
    var serviceDoor = add(g, 0.6, 1.8, 0.08, MAT.walnut, x1 + 0.185, 1.05, -5.35, { outline: true, thick: 0.002 });
    add(g, 0.035, 0.12, 0.035, MAT.brass, x1 + 0.24, 1.1, -5.0, {});
    add(g, 0.30, 0.025, 0.30, MAT.iron, x1 + 0.30, 3.03, -5.35, {});
    QP.addGlowSprite(g, glowTex, 0xffc075, 0.55, .45, x1 + 0.32, 2.8, -5.35);

    /* ---------------- chamfer door ---------------- */
    var chGroup = QP.group(g, M.x, 0, M.z);
    chGroup.rotation.y = chRot;
    var chDoorW = 0.94;
    /* side wall pieces */
    add(chGroup, 0.19, 2.82, 0.22, MAT.brickSmall, -chW / 2 + 0.095, 1.59, 0.09, { outline: true, thick: 0.002 });
    add(chGroup, 0.19, 2.82, 0.22, MAT.brickSmall, chW / 2 - 0.095, 1.59, 0.09, { outline: true, thick: 0.002 });
    add(chGroup, chW, 0.11, 0.20, MAT.walnut, 0, 2.96, 0.10, {});
    /* arched transom with colored glass */
    var archShape = new T.Shape();
    archShape.moveTo(-chDoorW / 2, 0); archShape.lineTo(chDoorW / 2, 0); archShape.lineTo(chDoorW / 2, 0.30);
    archShape.absarc(0, 0.30, chDoorW / 2, 0, Math.PI, false); archShape.lineTo(-chDoorW / 2, 0);
    var archG = new T.ShapeGeometry(archShape, 18);
    var archGlass = new T.Mesh(archG, new T.MeshBasicMaterial({
      map: QP.Tex.stained(19, true), transparent: true, opacity: .82, side: T.DoubleSide, toneMapped: false
    }));
    archGlass.position.set(0, 2.67, 0.055); chGroup.add(archGlass);
    add(chGroup, chW, 0.06, 0.12, MAT.walnut, 0, 2.67, 0.03, {});
    /* door frame + door */
    add(chGroup, 0.08, 2.38, 0.16, MAT.walnut, -chDoorW / 2, 1.37, 0.11, { outline: true, thick: 0.002 });
    add(chGroup, 0.08, 2.38, 0.16, MAT.walnut, chDoorW / 2, 1.37, 0.11, { outline: true, thick: 0.002 });
    add(chGroup, chDoorW, 0.10, 0.18, MAT.walnut, 0, 0.18, 0.11, {});
    var ceDoor = QP.group(chGroup, -chDoorW / 2 + 0.02, 0.2, 0.02);
    ceDoor.rotation.y = 0.22;
    add(ceDoor, chDoorW - 0.05, 0.34, 0.06, MAT.walnut, (chDoorW - 0.05) / 2, 0.19, 0, {});
    add(ceDoor, chDoorW - 0.05, 2.06, 0.03, MAT.glassWarm, (chDoorW - 0.05) / 2, 1.4, 0, { receive: false }).renderOrder = 12;
    add(ceDoor, 0.05, 2.36, 0.075, MAT.walnut, 0.03, 1.2, 0, {});
    add(ceDoor, 0.05, 2.36, 0.075, MAT.walnut, chDoorW - 0.08, 1.2, 0, {});
    add(ceDoor, 0.035, 0.55, 0.035, MAT.brass, chDoorW - 0.19, 1.15, 0.055, {});
    var cornerLamp = QP.group(chGroup, 0.58, 2.85, 0.14);
    var lampBody = QP.sphere(0.11, 10, 7, QP.basic(0xffdda2), false);
    cornerLamp.add(lampBody);
    QP.addGlowSprite(chGroup, glowTex, 0xffb867, 0.8, .6, 0.58, 2.85, 0.18);
    /* brass numerals above door */
    var numC = QP.canvas(256, 80), numG = numC.getContext('2d');
    numG.clearRect(0, 0, 256, 80); numG.fillStyle = 'rgba(219,184,110,.9)'; numG.font = 'bold 45px Georgia,serif'; numG.textAlign = 'center';
    numG.fillText('36', 128, 55);
    var numM = new T.Mesh(new T.PlaneGeometry(0.42, 0.13), QP.basic(0xffffff, { map: QP.texture(numC), transparent: true }));
    numM.position.set(0, 3.85, 0.17); chGroup.add(numM);
    /* corner transom sign */
    var chSignC = QP.canvas(768, 120), cs = chSignC.getContext('2d');
    cs.fillStyle = '#241b13'; cs.fillRect(0, 0, 768, 120);
    cs.strokeStyle = 'rgba(199,158,84,.65)'; cs.lineWidth = 3; cs.strokeRect(8, 8, 752, 104);
    cs.fillStyle = '#e5c989'; cs.font = '34px "PMingLiU",serif'; cs.textAlign = 'center'; cs.textBaseline = 'middle';
    cs.fillText('綺 羅 旗 袍  ·  百 代 留 聲', 384, 60);
    var chSign = new T.Mesh(new T.PlaneGeometry(1.62, 0.25), QP.basic(0xffffff, { map: QP.texture(chSignC) }));
    chSign.position.set(0, 3.30, 0.235); chGroup.add(chSign);

    /* ---------------- first-floor sign canopy ---------------- */
    function canopy(parent, width, xOff) {
      var cg = QP.group(parent, xOff, 0, 0);
      var depth = 0.98;
      var wallY = 3.02, frontY = 2.92;
      var glass = new T.Mesh(new T.PlaneGeometry(width, depth), QP.glass(0x7b98a2, 0.23));
      glass.rotation.x = -Math.PI / 2 + 0.10;
      glass.position.set(0, wallY - 0.05, 0.46);
      glass.renderOrder = 9;
      cg.add(glass);
      /* iron frame & rafters */
      var frame = MAT.iron;
      add(cg, width, 0.05, 0.07, frame, 0, wallY + 0.025, 0.04, { cast: true });
      add(cg, width, 0.045, 0.06, frame, 0, frontY + 0.02, 0.93, { cast: true });
      for (var x = -width / 2; x <= width / 2 + 0.01; x += width / Math.round(width / 0.52)) {
        rotX(cg, 0.045, 0.04, depth, frame, x, (wallY + frontY) / 2 + 0.02, 0.48, -0.10, { cast: true });
      }
      /* support scrolls */
      for (var bx = -width / 2 + 0.35; bx < width / 2 - 0.1; bx += 1.3) {
        var curvePts = [
          new T.Vector3(bx, 2.50, 0.02),
          new T.Vector3(bx, 2.72, 0.24),
          new T.Vector3(bx, 2.89, 0.68),
          new T.Vector3(bx, 2.94, 0.90)
        ];
        var curve = new T.CatmullRomCurve3(curvePts);
        var tube = new T.Mesh(new T.TubeGeometry(curve, 16, 0.028, 5, false), MAT.iron);
        cg.add(tube);
        /* little cast rosette */
        var rose = new T.Mesh(new T.TorusGeometry(0.075, 0.018, 5, 12), MAT.iron);
        rose.position.set(bx, 2.61, 0.31); rose.rotation.y = Math.PI / 2; cg.add(rose);
      }
      /* lanterns under canopy */
      for (var lx = -width / 2 + 0.6; lx < width / 2; lx += 1.45) {
        add(cg, 0.015, 0.20, 0.015, MAT.brassDark, lx, 2.83, 0.60, {});
        var cap = QP.cyl(0.11, 0.045, 0.11, 8, MAT.brassDark, true, 0.0018);
        QP.put(cg, cap, lx, 2.73, 0.60);
        var glb = QP.sphere(0.075, 10, 8, QP.basic(0xffdda1), false);
        QP.put(cg, glb, lx, 2.67, 0.60);
        QP.addGlowSprite(cg, glowTex, 0xffb25e, 0.55, .56, lx, 2.65, 0.62);
      }
      /* ornamental valance along outer edge */
      var n = Math.round(width / 0.31);
      for (var i = 0; i < n; i++) {
        var xx = -width / 2 + 0.15 + i * width / n;
        var arc = new T.Mesh(new T.TorusGeometry(0.13, 0.014, 4, 9, Math.PI), MAT.ironLight);
        arc.position.set(xx, 2.86, 0.90); arc.rotation.z = Math.PI; cg.add(arc);
        if (i % 2 === 0) {
          var spear = QP.cyl(0.008, 0.02, 0.16, 5, MAT.ironLight, false);
          QP.put(cg, spear, xx, 2.78, 0.90);
        }
      }
      /* brass crest */
      add(cg, 0.36, 0.20, 0.025, MAT.brass, 0, 3.10, 0.91, { outline: true, thick: 0.001 });
      return cg;
    }
    var southCanopy = canopy(g, 5.9, -2.65);
    southCanopy.position.set(0,0,0);
    southCanopy.position.set(-2.55, 0, z1); /* local z outward */
    var eastCanopy = QP.group(g, x1, 0, -2.2);
    eastCanopy.rotation.y = Math.PI / 2;
    canopy(eastCanopy, 3.55, 0);

    /* ---------------- upper facade ---------------- */
    var U0 = 3.82, U1 = 6.78;
    /* stone band and balcony support line */
    add(g, C.x - x0, 0.16, 0.30, MAT.stone, (x0 + C.x) / 2, 3.70, z1 + 0.12, { cast: true });
    add(g, 0.30, 0.16, (z1 - z0), MAT.stone, x1 + 0.12, 3.70, (z0 + z1) / 2, { cast: true });
    /* openings: A stained french doors, B open to room, C stained window */
    var A = { xa: -5.18, xb: -3.70, y0: 3.86, y1: 6.74 };
    var Bb = { xa: -3.42, xb: -1.52, y0: 3.84, y1: 6.74 };
    var Cc = { xa: -1.26, xb: -0.10, y0: 4.29, y1: 6.67 };
    /* wall chunks */
    function upWall(xa, xb, ya, yb) {
      if (xb - xa < 0.01 || yb - ya < 0.01) return;
      add(g, xb - xa, yb - ya, 0.34, MAT.brick, (xa + xb) / 2, (ya + yb) / 2, z1 + 0.16, { outline: true, thick: 0.0025, cast: true });
    }
    upWall(x0, A.xa, 3.78, BT);
    upWall(A.xb, Bb.xa, 3.78, BT);
    upWall(Bb.xb, Cc.xa, 3.78, BT);
    upWall(Cc.xb, C.x, 3.78, BT);
    upWall(x0, C.x, 6.78, BT);
    upWall(Cc.xa, Cc.xb, 3.78, Cc.y0);
    upWall(Cc.xa, Cc.xb, Cc.y1, BT);
    upWall(A.xa, A.xb, A.y1, BT);
    upWall(Bb.xa, Bb.xb, Bb.y1, BT);
    /* east upper wall */
    var EastUpper = QP.group(g, x1, 0, 0);
    EastUpper.rotation.y = Math.PI / 2;
    /* local x maps to -z; windows centres at local x = 2.1 and 4.35 */
    var Ew = 1.30, E0 = 4.34, E1 = 6.60;
    function eastWallChunk(xa, xb, ya, yb) {
      if (xb - xa < 0.01 || yb - ya < 0.01) return;
      var m = add(EastUpper, xb - xa, yb - ya, 0.34, MAT.brick, (xa + xb) / 2, (ya + yb) / 2, 0.16, { outline: true, thick: 0.0025, cast: true });
    }
    eastWallChunk(0.34, 0.82, 3.78, BT);
    eastWallChunk(2.05, 3.35, 3.78, BT);
    eastWallChunk(4.58, 6.45, 3.78, BT);
    eastWallChunk(0.82, 2.05, 3.78, E0);
    eastWallChunk(3.35, 4.58, 3.78, E0);
    eastWallChunk(0.82, 2.05, E1, BT);
    eastWallChunk(3.35, 4.58, E1, BT);

    /* chamfer upper wall */
    var chUpper = QP.group(g, M.x, 0, M.z); chUpper.rotation.y = chRot;
    add(chUpper, 0.22, BT - 3.78, 0.34, MAT.brick, -chW / 2 + 0.11, (3.78 + BT) / 2, 0.16, { outline: true, thick: 0.0025, cast: true });
    add(chUpper, 0.22, BT - 3.78, 0.34, MAT.brick, chW / 2 - 0.11, (3.78 + BT) / 2, 0.16, { outline: true, thick: 0.0025, cast: true });
    add(chUpper, chW, BT - 6.60, 0.34, MAT.brick, 0, (6.60 + BT) / 2, 0.16, { outline: true, thick: 0.0025, cast: true });
    add(chUpper, chW, 0.38, 0.34, MAT.brick, 0, 3.99, 0.16, { outline: true, thick: 0.0025, cast: true });
    /* vertical pilasters */
    var pil = [-5.34, -3.57, -1.39, 0.12];
    for (var pi = 0; pi < pil.length; pi++) {
      add(g, 0.18, 3.0, 0.22, MAT.stone, pil[pi], 5.32, z1 + 0.20, { outline: true, thick: 0.002 });
      add(g, 0.27, 0.10, 0.30, MAT.stoneLight, pil[pi], 6.71, z1 + 0.17, {});
      add(g, 0.24, 0.08, 0.27, MAT.stoneDark, pil[pi], 3.91, z1 + 0.17, {});
    }

    /* helper for stained-glass upper opening */
    function upperStainedWindow(xa, xb, y0, y1, seed, curvedTop, parent, localZ) {
      parent = parent || g;
      var w = xb - xa, cx = (xa + xb) / 2;
      var zf = localZ === undefined ? z1 + 0.17 : localZ;
      var surroundD = localZ === undefined ? 0.34 : 0.34;
      /* stone surround */
      add(parent, 0.20, y1 - y0 + 0.24, 0.36, MAT.stone, xa - 0.06, (y0 + y1) / 2, zf - 0.02, { outline: true, thick: 0.0025, cast: true });
      add(parent, 0.20, y1 - y0 + 0.24, 0.36, MAT.stone, xb + 0.06, (y0 + y1) / 2, zf - 0.02, { outline: true, thick: 0.0025, cast: true });
      add(parent, w + 0.34, 0.18, 0.40, MAT.stone, cx, y1 + 0.12, zf - 0.02, { outline: true, thick: 0.0025 });
      add(parent, w + 0.52, 0.10, 0.48, MAT.stoneLight, cx, y1 + 0.27, zf - 0.04, {});
      add(parent, w + 0.20, 0.14, 0.38, MAT.stone, cx, y0 - 0.10, zf + 0.02, {});
      if (curvedTop) {
        var arc = new T.Mesh(new T.TorusGeometry(w * 0.58, 0.06, 5, 20, Math.PI), MAT.stoneLight);
        arc.position.set(cx, y1 + 0.28, zf + 0.15); parent.add(arc);
        var rose = new T.Mesh(new T.TorusGeometry(0.11, 0.035, 5, 16), MAT.stoneLight);
        rose.position.set(cx, y1 + 0.36, zf + 0.16); rose.rotation.z = 0; parent.add(rose);
      }
      /* walnut inner frame */
      add(parent, 0.09, y1 - y0, 0.12, MAT.walnut, xa, (y0 + y1) / 2, zf + 0.05, {});
      add(parent, 0.09, y1 - y0, 0.12, MAT.walnut, xb, (y0 + y1) / 2, zf + 0.05, {});
      add(parent, w, 0.09, 0.12, MAT.walnut, cx, y1, zf + 0.05, {});
      add(parent, w, 0.11, 0.14, MAT.walnut, cx, y0, zf + 0.05, {});
      add(parent, w, 0.06, 0.10, MAT.walnut, cx, y0 + (y1 - y0) * .55, zf + 0.06, {});
      add(parent, 0.05, y1 - y0, 0.10, MAT.walnut, cx, (y0 + y1) / 2, zf + 0.06, {});
      /* stained glass */
      var tex = QP.Tex.stained(seed, seed % 2 === 0);
      var sm = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: .93, side: T.DoubleSide, toneMapped: false });
      var pane = new T.Mesh(new T.PlaneGeometry(w - 0.09, y1 - y0 - 0.10), sm);
      pane.position.set(cx, (y0 + y1) / 2, zf + 0.075);
      pane.renderOrder = 10;
      parent.add(pane);
      /* exterior lead muntins */
      for (var i = 1; i < 3; i++) add(parent, 0.025, y1 - y0 - 0.1, 0.026, MAT.iron, xa + i * w / 3, (y0 + y1) / 2, zf + 0.095, {});
      for (var j = 1; j < 3; j++) add(parent, w - 0.08, 0.018, 0.02, MAT.iron, cx, y0 + j * (y1 - y0) / 3, zf + 0.095, {});
      /* brass sill and flower box */
      add(parent, w + 0.26, 0.08, 0.24, MAT.brassDark, cx, y0 - 0.02, zf + 0.13, {});
      var box = add(parent, w * .75, 0.24, 0.20, MAT.walnut, cx, y0 - 0.20, zf + 0.18, { outline: true, thick: 0.0015 });
      return { pane: pane, xa: xa, xb: xb, y0: y0, y1: y1, z: zf };
    }
    upperStainedWindow(A.xa, A.xb, A.y0, A.y1, 5, true, g);
    upperStainedWindow(Cc.xa, Cc.xb, Cc.y0, Cc.y1, 8, false, g);

    /* open central balcony doorway B */
    var bCx = (Bb.xa + Bb.xb) / 2;
    add(g, 0.20, Bb.y1 - Bb.y0 + 0.30, 0.38, MAT.stone, Bb.xa - 0.07, (Bb.y0 + Bb.y1) / 2, z1 + 0.15, { outline: true, thick: 0.0025, cast: true });
    add(g, 0.20, Bb.y1 - Bb.y0 + 0.30, 0.38, MAT.stone, Bb.xb + 0.07, (Bb.y0 + Bb.y1) / 2, z1 + 0.15, { outline: true, thick: 0.0025, cast: true });
    add(g, Bb.xb - Bb.xa + 0.34, 0.18, 0.40, MAT.stone, bCx, Bb.y1 + 0.14, z1 + 0.16, { outline: true, thick: 0.0025 });
    add(g, Bb.xb - Bb.xa + 0.54, 0.10, 0.49, MAT.stoneLight, bCx, Bb.y1 + 0.31, z1 + 0.14, {});
    add(g, 0.20, 0.18, 0.24, MAT.stoneLight, Bb.xa - 0.50, 6.66, z1 + 0.18, {});
    add(g, 0.20, 0.18, 0.24, MAT.stoneLight, Bb.xb + 0.50, 6.66, z1 + 0.18, {});
    /* walnut frame opening */
    add(g, 0.12, Bb.y1 - Bb.y0, 0.18, MAT.walnut, Bb.xa, (Bb.y0 + Bb.y1) / 2, z1 + 0.12, {});
    add(g, 0.12, Bb.y1 - Bb.y0, 0.18, MAT.walnut, Bb.xb, (Bb.y0 + Bb.y1) / 2, z1 + 0.12, {});
    add(g, 0.12, Bb.y1 - Bb.y0, 0.18, MAT.walnut, bCx, (Bb.y0 + Bb.y1) / 2, z1 + 0.12, {});
    add(g, Bb.xb - Bb.xa, 0.12, 0.20, MAT.walnut, bCx, Bb.y1, z1 + 0.12, {});
    add(g, Bb.xb - Bb.xa, 0.11, 0.24, MAT.walnut, bCx, Bb.y0, z1 + 0.12, {});
    /* two open leaves swung inward */
    function openLeaf(hingeX, dirSign, w) {
      var leaf = QP.group(g, hingeX, Bb.y0, z1 + 0.03);
      leaf.rotation.y = dirSign * 1.15;
      var mw = w * 0.98;
      add(leaf, mw, 0.30, 0.055, MAT.walnut, dirSign * mw / 2, 0.15, 0, {});
      add(leaf, mw, Bb.y1 - Bb.y0 - 0.48, 0.028, MAT.glassWarm, dirSign * mw / 2, (Bb.y1 - Bb.y0) / 2 + 0.02, 0, { receive: false }).renderOrder = 11;
      add(leaf, 0.05, Bb.y1 - Bb.y0, 0.07, MAT.walnut, 0.025 * dirSign, (Bb.y1 - Bb.y0) / 2, 0, {});
      add(leaf, 0.05, Bb.y1 - Bb.y0, 0.07, MAT.walnut, dirSign * (mw - 0.025), (Bb.y1 - Bb.y0) / 2, 0, {});
      add(leaf, mw, 0.08, 0.075, MAT.walnut, dirSign * mw / 2, Bb.y1 - Bb.y0 - 0.12, 0, {});
      var knob = QP.cyl(0.045, 0.045, 0.03, 10, MAT.brass, false);
      knob.rotation.x = Math.PI / 2;
      QP.put(leaf, knob, dirSign * (mw - 0.16), 1.15, 0.06);
      /* colored upper corner panes */
      add(leaf, mw * .35, (Bb.y1 - Bb.y0) * .24, 0.02, new T.MeshBasicMaterial({ color: 0x272a2f }), dirSign * mw * .5, (Bb.y1 - Bb.y0) * .75, -0.04, { receive: false });
      return leaf;
    }
    openLeaf(Bb.xa, 1, (Bb.xb - Bb.xa) / 2);
    openLeaf(Bb.xb, -1, (Bb.xb - Bb.xa) / 2);

    /* east upper stained windows */
    var ew1 = { zA: -2.05, zB: -.82, y0: 4.30, y1: 6.58 };
    var ew2 = { zA: -4.58, zB: -3.35, y0: 4.30, y1: 6.58 };
    function eastWindow(zA, zB, y0, y1, seed) {
      var localA = -(zB), localB = -(zA);
      upperStainedWindow(localA, localB, y0, y1, seed, false, EastUpper, 0.17);
      /* little iron balconet */
      var bal = QP.group(EastUpper, (localA + localB) / 2, y0 - 0.10, 0.45);
      var rail = makeRail(1.3, 0.65, 0, 0.55);
      bal.add(rail);
      bal.rotation.y = 0;
    }
    eastWindow(ew1.zA, ew1.zB, ew1.y0, ew1.y1, 12);
    eastWindow(ew2.zA, ew2.zB, ew2.y0, ew2.y1, 17);

    /* chamfer upper stained window + balconet */
    add(chUpper, 0.22, BT - 3.8, 0.34, MAT.brick, -chW / 2 + .11, (BT + 3.8) / 2, 0.16, {});
    add(chUpper, chW - 0.22, BT - 4.22, 0.34, MAT.brick, 0, (BT + 6.72) / 2, 0.16, {});
    add(chUpper, chW - 0.22, 0.34, 0.34, MAT.brick, 0, 4.01, 0.16, {});
    var chWin = upperStainedWindow(-0.49, 0.49, 4.38, 6.60, 22, true, chUpper, 0.17);
    /* chamfer balconet */
    var chBal = QP.group(chUpper, 0, 0, 0.38);
    var chBalF = QP.group(chBal, 0, 0, 0);
    var chRail = makeRail(1.18, 0.55, 0, 0.5);
    chBalF.add(chRail);
    add(chUpper, 1.25, 0.10, 0.55, MAT.stoneLight, 0, 3.79, 0.30, {});
    add(chUpper, 1.12, 0.12, 0.06, MAT.brassDark, 0, 3.86, 0.58, {});

    /* ---------------- cornice + dentils ---------------- */
    add(g, C.x - x0 + 0.45, 0.20, 0.48, MAT.stoneLight, (x0 + C.x) / 2, BT + 0.02, z1 + 0.15, { outline: true, thick: 0.0025, cast: true });
    add(g, 0.48, 0.20, z1 - z0 + 0.30, MAT.stoneLight, x1 + 0.18, BT + 0.02, (z0 + z1) / 2, { outline: true, thick: 0.0025, cast: true });
    add(g, C.x - x0 + 0.55, 0.10, 0.62, MAT.stone, (x0 + C.x) / 2, BT + 0.16, z1 + 0.22, {});
    add(g, 0.62, 0.10, z1 - z0 + 0.4, MAT.stone, x1 + 0.24, BT + 0.16, (z0 + z1) / 2, {});
    for (var dx = x0 + 0.15; dx < C.x; dx += 0.25) {
      add(g, 0.10, 0.11, 0.24, MAT.stone, dx, BT - 0.03, z1 + 0.38, {});
    }
    for (var dz = z0 + 0.2; dz < z1; dz += 0.25) {
      add(g, 0.24, 0.11, 0.10, MAT.stone, x1 + 0.38, BT - 0.03, dz, {});
    }
    var cch = QP.group(g, M.x, 0, M.z); cch.rotation.y = chRot;
    add(cch, chW + 0.12, 0.20, 0.48, MAT.stoneLight, 0, BT + 0.02, 0.15, { outline: true, thick: 0.0025 });

    /* ---------------- main balcony ---------------- */
    var balf = QP.group(g, 0, 0, 0);
    balf.name = 'carved-balcony';
    var balX0 = -5.34, balX1 = 0.27, balZ0 = z1 + 0.02, balZ1 = z1 + 0.84;
    var balY = 3.80;
    add(balf, balX1 - balX0, 0.18, balZ1 - balZ0, MAT.stone, (balX0 + balX1) / 2, balY - 0.09, (balZ0 + balZ1) / 2, { outline: true, thick: 0.0028, cast: true });
    add(balf, balX1 - balX0 + 0.12, 0.06, balZ1 - balZ0 + 0.12, MAT.stoneLight, (balX0 + balX1) / 2, balY + 0.01, (balZ0 + balZ1) / 2, {});
    /* stone brackets under balcony */
    for (var bbx = balX0 + 0.55; bbx < balX1; bbx += 1.32) {
      add(balf, 0.22, 0.44, 0.55, MAT.stone, bbx, 3.53, z1 + 0.28, { outline: true, thick: 0.002 });
      add(balf, 0.12, 0.22, 0.34, MAT.stoneDark, bbx, 3.34, z1 + 0.12, {});
      var scroll = new T.Mesh(new T.TorusGeometry(0.16, 0.045, 5, 14, Math.PI * 1.2), MAT.stoneDark);
      scroll.position.set(bbx, 3.58, z1 + 0.58); scroll.rotation.y = Math.PI / 2; scroll.rotation.z = .3; balf.add(scroll);
    }
    /* balcony side returns */
    add(balf, 0.14, 0.20, balZ1 - balZ0, MAT.stone, balX0, balY - 0.10, (balZ0 + balZ1) / 2, {});
    add(balf, 0.14, 0.20, balZ1 - balZ0, MAT.stone, balX1, balY - 0.10, (balZ0 + balZ1) / 2, {});
    /* front stone shoe */
    add(balf, balX1 - balX0 + 0.16, 0.12, 0.18, MAT.stoneDark, (balX0 + balX1) / 2, balY + 0.06, balZ1, {});
    /* railing */
    var frontRail = makeRail(balX1 - balX0, 0.78, balY, 0.63);
    frontRail.position.set((balX0 + balX1) / 2, balY + 0.08, balZ1);
    balf.add(frontRail);
    var sideRailL = makeRail(balZ1 - balZ0, 0.78, balY, 0.63);
    sideRailL.rotation.y = Math.PI / 2;
    sideRailL.position.set(balX0 + 0.02, balY + 0.08, (balZ0 + balZ1) / 2);
    balf.add(sideRailL);
    var sideRailR = sideRailL.clone();
    sideRailR.position.x = balX1 - 0.02;
    balf.add(sideRailR);
    /* urns at ends */
    for (var u = 0; u < 2; u++) {
      var urn = makeUrn(0.22, MAT.stone, MAT.stoneDark);
      QP.put(balf, urn, u ? balX1 - 0.1 : balX0 + 0.1, balY + 0.08, balZ1);
    }
    /* central decorative iron medallion */
    var med = new T.Mesh(new T.TorusGeometry(0.22, 0.025, 5, 20), MAT.iron);
    med.position.set((balX0 + balX1) / 2, balY + 0.55, balZ1 + 0.01); balf.add(med);
    var med2 = new T.Mesh(new T.TorusGeometry(0.11, 0.018, 5, 16), MAT.brassDark);
    med2.position.copy(med.position); balf.add(med2);
    for (var mr = 0; mr < 8; mr++) {
      var a = mr / 8 * Math.PI * 2;
      var spoke = add(balf, 0.012, 0.21, 0.012, MAT.iron, med.position.x + Math.sin(a) * .16, med.position.y + Math.cos(a) * .16, balZ1 + .012, {});
      spoke.rotation.z = -a;
    }
    QP.addGlowSprite(balf, QP.Tex.glow(), 0xffbd70, 1.4, .11, -2.5, 4.6, 1.2);

    /* ---------------- half storey + roof ---------------- */
    var atticSet = 0.25;
    var attic = QP.group(g, 0, 0, 0);
    add(attic, (C.x - x0) - 0.60, 1.18, 0.34, MAT.brick, (x0 + C.x) / 2, 7.80, z1 - 0.34, { outline: true, thick: 0.0025, cast: true });
    add(attic, 0.34, 1.18, z1 - z0 - .6, MAT.brick, x1 - 0.30, 7.80, (z0 + z1) / 2, { outline: true, thick: 0.0025 });
    add(attic, 0.34, 1.18, z1 - z0 - .6, MAT.brick, x0 + 0.30, 7.80, (z0 + z1) / 2, { outline: true, thick: 0.0025 });
    add(attic, (x1 - x0) - .6, 1.18, .34, MAT.brick, (x0 + x1) / 2, 7.80, z0 + .30, { outline: true, thick: 0.0025 });
    /* little attic windows on south */
    for (var aw = 0; aw < 3; aw++) {
      var ax = -4.4 + aw * 1.85;
      add(attic, 0.78, 0.83, 0.12, MAT.walnut, ax, 7.86, z1 - 0.14, { outline: true, thick: 0.0018 });
      var awin = add(attic, 0.58, 0.64, 0.04, MAT.glassWarm, ax, 7.86, z1 - 0.20, { receive: false });
      awin.renderOrder = 9;
      add(attic, 0.09, 0.85, 0.14, MAT.stoneLight, ax - 0.48, 7.86, z1 - .12, {});
      add(attic, 0.09, 0.85, 0.14, MAT.stoneLight, ax + 0.48, 7.86, z1 - .12, {});
      add(attic, 0.98, 0.10, 0.18, MAT.stoneLight, ax, 8.30, z1 - .12, {});
    }
    /* central curved parapet over balcony */
    add(attic, 3.5, 0.16, 0.25, MAT.stone, -2.6, 7.22, z1 + 0.02, { outline: true, thick: 0.002, cast: true });
    var pedShape = new T.Shape();
    pedShape.moveTo(-1.55, 0); pedShape.lineTo(1.55, 0); pedShape.lineTo(1.55, 0.40);
    pedShape.bezierCurveTo(0.95, 0.98, 0.38, 1.20, 0, 1.20);
    pedShape.bezierCurveTo(-0.38, 1.20, -0.95, 0.98, -1.55, 0.40);
    pedShape.lineTo(-1.55, 0);
    var ped = new T.Mesh(new T.ExtrudeGeometry(pedShape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 18 }), MAT.stone);
    ped.position.set(-2.6, 7.28, z1 - 0.12); ped.castShadow = true; g.add(ped);
    var pedOval = new T.Mesh(new T.RingGeometry(0.18, 0.28, 20), MAT.brassDark);
    pedOval.position.set(-2.6, 7.98, z1 + 0.12); pedOval.rotation.x = -0.06; g.add(pedOval);
    var fin = QP.cyl(0.02, 0.02, 0.55, 6, MAT.brass, false);
    QP.put(g, fin, -2.6, 8.75, z1 - 0.02);
    var orb = QP.sphere(0.08, 8, 6, MAT.brass, false);
    QP.put(g, orb, -2.6, 9.03, z1 - 0.02);
    /* attic band cornice */
    add(attic, (C.x - x0) - .35, 0.13, 0.40, MAT.stone, (x0 + C.x) / 2, 8.40, z1 - .22, { outline: true, thick: 0.002 });
    add(attic, 0.40, 0.13, z1 - z0 - .35, MAT.stone, x1 - .18, 8.40, (z0 + z1) / 2, {});
    add(attic, 0.40, 0.13, z1 - z0 - .35, MAT.stone, x0 + .18, 8.40, (z0 + z1) / 2, {});
    add(attic, (x1 - x0) - .35, 0.13, .40, MAT.stone, (x0 + x1) / 2, 8.40, z0 + .2, {});

    /* roof */
    var eaveY = 8.36, ridgeY = 9.62;
    var rx0 = x0 - 0.05, rx1 = x1 + 0.05, rz0 = z0 - 0.05, rz1 = z1 + 0.05;
    function roofFace(verts, uvs) {
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(verts.flat(), 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uvs.flat(), 2));
      geo.setIndex([0,1,2, 0,2,3].slice(0, verts.length === 3 ? 3 : 6));
      geo.computeVertexNormals();
      var mat = QP.std(0xffffff, {
        map: QP.cloneTex(QP.Tex.roof(), 2.3, 2.4),
        roughness: 0.28, metalness: 0.14, envMapIntensity: 1.2,
        side: T.DoubleSide
      });
      var m = new T.Mesh(geo, mat);
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
    /* ridge along x */
    var ridgeA = new T.Vector3(-3.75, ridgeY, -2.92);
    var ridgeB = new T.Vector3(-0.65, ridgeY, -2.92);
    roofFace([[rx0, eaveY, rz1],[rx1, eaveY, rz1],[ridgeB.x, ridgeY, ridgeB.z],[ridgeA.x, ridgeY, ridgeA.z]],
             [[0,0],[1,0],[0.72,1],[0.28,1]]);
    roofFace([[rx1, eaveY, rz0],[rx0, eaveY, rz0],[ridgeA.x, ridgeY, ridgeA.z],[ridgeB.x, ridgeY, ridgeB.z]],
             [[0,0],[1,0],[0.28,1],[0.72,1]]);
    roofFace([[rx1, eaveY, rz1],[rx1, eaveY, rz0],[ridgeB.x, ridgeY, ridgeB.z]],
             [[0,0],[1,0],[0.5,1]]);
    roofFace([[rx0, eaveY, rz0],[rx0, eaveY, rz1],[ridgeA.x, ridgeY, ridgeA.z]],
             [[0,0],[1,0],[0.5,1]]);
    /* fascia boards / gutters */
    add(g, rx1 - rx0, 0.14, 0.20, MAT.walnut, 0, eaveY - 0.03, rz1, { outline: true, thick: 0.002 });
    add(g, rx1 - rx0, 0.14, 0.20, MAT.walnut, 0, eaveY - 0.03, rz0, { outline: true, thick: 0.002 });
    add(g, 0.20, 0.14, rz1 - rz0, MAT.walnut, rx0, eaveY - 0.03, (rz0 + rz1) / 2, { outline: true, thick: 0.002 });
    add(g, 0.20, 0.14, rz1 - rz0, MAT.walnut, rx1, eaveY - 0.03, (rz0 + rz1) / 2, { outline: true, thick: 0.002 });
    var gutterMat = QP.iron(0x31413e);
    add(g, rx1 - rx0, 0.07, 0.09, gutterMat, 0, eaveY - 0.09, rz1 + 0.07, {});
    add(g, 0.09, 0.07, rz1 - rz0, gutterMat, rx1 + 0.07, eaveY - 0.09, 0, {});
    /* ridge caps */
    var ridgeMat = QP.std(0x313b39, { metalness: 0.38, roughness: 0.35 });
    var ridge = QP.cyl(0.10, 0.10, (ridgeB.x - ridgeA.x) + 0.5, 8, ridgeMat, true, 0.002);
    ridge.rotation.z = Math.PI / 2; QP.put(g, ridge, (ridgeA.x + ridgeB.x) / 2, ridgeY + 0.04, ridgeA.z);
    var finial = new T.Mesh(new T.SphereGeometry(0.11, 10, 7), MAT.brass);
    finial.position.set(ridgeB.x, ridgeY + 0.10, ridgeB.z); g.add(finial);
    var finial2 = finial.clone(); finial2.position.x = ridgeA.x; g.add(finial2);
    /* roof corner caps, little upturned tips */
    for (var rc = 0; rc < 4; rc++) {
      var rcx = rc < 2 ? rx0 : rx1, rcz = rc % 2 ? rz1 : rz0;
      var cap = QP.cyl(0.08, 0.15, 0.32, 7, MAT.ironLight, true, 0.0018);
      QP.put(g, cap, rcx, eaveY - 0.04, rcz);
    }

    /* dormer windows in roof for the half-storey */
    function dormer(dx, dz, rot, seed) {
      var dgrp = QP.group(g, dx, 0, dz); dgrp.rotation.y = rot;
      add(dgrp, 1.28, 1.02, 0.68, MAT.brick, 0, 8.92, 0, { outline: true, thick: 0.0022, cast: true });
      var m = new T.Mesh(new T.PlaneGeometry(0.72, 0.64), new T.MeshBasicMaterial({ map: QP.Tex.stained(seed || 30, true), transparent: true, opacity: .86, toneMapped: false }));
      m.position.set(0, 8.95, 0.38); dgrp.add(m);
      add(dgrp, 0.10, 0.72, 0.12, MAT.stone, -.46, 8.96, 0.39, {});
      add(dgrp, 0.10, 0.72, 0.12, MAT.stone, .46, 8.96, 0.39, {});
      add(dgrp, 1.10, 0.10, 0.18, MAT.stone, 0, 9.30, 0.39, {});
      /* gabled tile hood, not a white box */
      var dormTile = QP.std(0xffffff, { map: QP.cloneTex(QP.Tex.roof(), 1.4, 1.2), roughness: .3, metalness: .1, side: T.DoubleSide });
      add(dgrp, 1.54, .06, .78, dormTile, -.40, 9.49, .02, { rz: .44 });
      add(dgrp, 1.54, .06, .78, dormTile, .40, 9.49, .02, { rz: -.44 });
      add(dgrp, .07, .08, .80, MAT.iron2, 0, 9.73, .02, {});
      add(dgrp, .10, .18, .10, MAT.stoneLight, 0, 9.60, .39, {});
      var orb = QP.sphere(.065, 8, 6, MAT.brass, false); QP.put(dgrp, orb, 0, 9.78, .39);
      return dgrp;
    }
    MAT.roofTile = QP.std(0xffffff, { map: QP.cloneTex(QP.Tex.roof(), 1.4, 1.2), roughness: .3, metalness: .1 });
    dormer(-2.25, 0.5, 0, 31);
    dormer(-0.85, -0.7, Math.PI / 2, 34);
    /* chimneys */
    function chimney(x, z, h, w) {
      var cg = QP.group(g, x, 0, z);
      add(cg, w, h, w, MAT.brick, 0, h / 2 + 8.2, 0, { outline: true, thick: 0.0024, cast: true });
      add(cg, w + .14, .13, w + .14, MAT.stone, 0, 8.2 + h, 0, {});
      for (var i = -1; i <= 1; i++) {
        var pot = QP.cyl(.09, .12, .35, 10, QP.toon(0x6e4c3e), true, 0.0018);
        QP.put(cg, pot, i * .30, 8.2 + h + .22, 0);
      }
      return cg;
    }
    chimney(-4.5, -3.4, 2.1, .72);
    chimney(0.6, -5.2, 1.6, .58);
    /* rain chain / downpipes */
    function downpipe(x, z, h, ry) {
      var dp = QP.group(g, x, 0, z); dp.rotation.y = ry || 0;
      QP.put(dp, QP.cyl(.045, .055, h, 8, QP.iron(0x4d3b28), true, 0.0018), 0, h / 2 + .2, 0);
      for (var i = 0; i < 4; i++) {
        var clamp = QP.cyl(.07, .07, .05, 8, MAT.iron, false);
        clamp.rotation.z = Math.PI / 2; QP.put(dp, clamp, .08, .8 + i * 1.35, 0);
      }
      var shoe = QP.cyl(.055, .10, .28, 8, MAT.iron, false);
      shoe.rotation.x = .35; QP.put(dp, shoe, 0, .40, .14);
      return dp;
    }
    downpipe(x1 - 0.08, z1 + 0.17, 7.0, 0);
    downpipe(x1 + 0.16, z1 - .9, 7.4, 0);
    downpipe(x0 + .16, z1 - 1.7, 7.1, 0);

    /* ---------------- quoins and stone dressings ---------------- */
    for (var qy = 0; qy < 8; qy++) {
      if (qy % 2 === 0) {
        add(g, 0.34, 0.27, 0.24, MAT.stoneLight, x0 + 0.03, 0.75 + qy * 0.44, z1 + 0.20, {});
      } else {
        add(g, 0.22, 0.27, 0.30, MAT.stoneLight, x0 + 0.08, 0.75 + qy * 0.44, z1 + 0.16, {});
      }
    }
    /* corner quoins belong on the masonry above the shop, not across the glazing */
    /* small stone date plaque above record sign */
    var dpC = QP.canvas(512, 128), dg = dpC.getContext('2d');
    dg.clearRect(0, 0, 512, 128);
    dg.strokeStyle = 'rgba(215,196,160,.65)'; dg.lineWidth = 2; dg.strokeRect(4, 4, 504, 120);
    dg.fillStyle = 'rgba(225,205,164,.8)'; dg.font = '22px Georgia,serif'; dg.textAlign = 'center';
    dg.fillText('A.D. 1931', 256, 58);
    dg.font = '16px "PMingLiU",serif'; dg.fillText('海上營造', 256, 88);
    var dpm = new T.Mesh(new T.PlaneGeometry(1.0, 0.25), QP.basic(0xffffff, { map: QP.texture(dpC), transparent: true }));
    dpm.position.set(-0.75, 3.86, z1 + 0.36); g.add(dpm);

    /* ---------------- neon vertical sign ---------------- */
    var neonC = QP.Tex.neonSign('qipao');
    var signGrp = QP.group(g, 1.38, 0, 1.30);
    signGrp.rotation.y = Math.PI / 4;
    var signY = 5.92, signH = 3.55, signW = 0.86;
    /* iron leaves / bracket */
    add(signGrp, 0.06, 3.7, 0.06, MAT.iron, 0, signY, -.04, {});
    var bracketCurve = new T.CatmullRomCurve3([
      new T.Vector3(0, 7.62, 0.02),
      new T.Vector3(0.02, 7.86, -0.25),
      new T.Vector3(0.18, 7.94, -0.72),
      new T.Vector3(0.48, 7.88, -1.20),
      new T.Vector3(0.64, 7.62, -1.31)
    ]);
    var arm1 = new T.Mesh(new T.TubeGeometry(bracketCurve, 22, .026, 5, false), MAT.iron); signGrp.add(arm1);
    var arm2 = arm1.clone(); arm2.position.z = -0.08; signGrp.add(arm2);
    var anchor = add(signGrp, 0.10, 0.55, 0.10, MAT.iron, 0.64, 7.62, -1.31, { outline: true, thick: 0.0015 });
    /* dark metal box */
    var board = add(signGrp, signW, signH, 0.12, MAT.iron, 0, signY, 0, { outline: true, thick: 0.003, cast: true });
    /* front & back glowing faces */
    var neonMat = QP.basic(0xffffff, { map: neonC });
    var faceF = new T.Mesh(new T.PlaneGeometry(signW - 0.06, signH - 0.06), neonMat);
    faceF.position.set(0, signY, 0.065); signGrp.add(faceF);
    var faceB = new T.Mesh(new T.PlaneGeometry(signW - 0.06, signH - 0.06), neonMat.clone());
    faceB.position.set(0, signY, -0.065); faceB.rotation.y = Math.PI; signGrp.add(faceB);
    /* glowing tube border / alternating */
    var tubeMatA = QP.basic(0xff4f83); tubeMatA.color.setRGB(1.9, .28, .55);
    var tubeMatB = QP.basic(0x5ce3d3); tubeMatB.color.setRGB(.32, 1.8, 1.6);
    function neonTube(parent, x, y, z, w, h, mat) {
      var m = QP.box(w, h, .025, mat, false);
      QP.put(parent, m, x, y, z);
      return m;
    }
    var signTubes = [];
    function addBorderTubes(parent, w, h, y, z, mat) {
      signTubes.push(neonTube(parent, -w / 2, y, z, .025, h, mat));
      signTubes.push(neonTube(parent, w / 2, y, z, .025, h, mat));
      signTubes.push(neonTube(parent, 0, y + h / 2, z, w, .025, mat));
      signTubes.push(neonTube(parent, 0, y - h / 2, z, w, .025, mat));
    }
    addBorderTubes(signGrp, signW + 0.04, signH - 0.05, signY, 0.075, tubeMatA);
    addBorderTubes(signGrp, signW * .48, 0.02, signY - 0.4, -0.075, tubeMatB);
    QP.addGlowSprite(signGrp, glowTex, 0xff4c83, 3.2, .35, 0, signY, 0.12);
    QP.addGlowSprite(signGrp, glowTex, 0xff4c83, 2.2, .22, 0, signY - 1.2, -0.12);
    /* pink light cast into street */
    var neonLight = new T.PointLight(0xff3f78, 2.3, 8.5, 2);
    neonLight.position.set(1.65, 5.7, 1.55); g.add(neonLight);
    var neonLight2 = new T.PointLight(0x44d9cb, 1.2, 5.2, 2);
    neonLight2.position.set(1.5, 4.4, 1.25); g.add(neonLight2);
    QP.neonRefs = {
      panelMats: [neonMat, faceB.material], tubeMats: [tubeMatA, tubeMatB],
      lights: [neonLight, neonLight2], signGrp: signGrp, signTubes: signTubes
    };

    /* ---------------- round record sign on east ---------------- */
    var roundC = QP.canvas(512, 512), rg = roundC.getContext('2d');
    rg.clearRect(0, 0, 512, 512);
    rg.fillStyle = '#0b1514'; rg.beginPath(); rg.arc(256, 256, 242, 0, 6.3); rg.fill();
    rg.strokeStyle = 'rgba(215,185,117,.9)'; rg.lineWidth = 8; rg.beginPath(); rg.arc(256, 256, 226, 0, 6.3); rg.stroke();
    rg.strokeStyle = 'rgba(91,225,211,.75)'; rg.lineWidth = 3; rg.beginPath(); rg.arc(256, 256, 202, 0, 6.3); rg.stroke();
    rg.fillStyle = '#cfece2'; rg.font = '700 104px "PMingLiU",serif'; rg.textAlign = 'center'; rg.textBaseline = 'middle';
    rg.shadowColor = '#5ce3d3'; rg.shadowBlur = 26;
    rg.fillText('留', 256, 190); rg.fillText('聲', 256, 318);
    rg.shadowBlur = 0; rg.font = '15px Georgia,serif'; rg.fillStyle = 'rgba(219,189,123,.7)';
    rg.fillText('GRAMOPHONE', 256, 414);
    var roundTex = QP.texture(roundC);
    var roundMat = QP.basic(0xffffff, { map: roundTex, transparent: true });
    var roundGrp = QP.group(g, x1 + 0.38, 3.57, -1.0);
    var disc = QP.cyl(0.51, 0.51, 0.055, 32, MAT.iron, true, 0.0018);
    disc.rotation.z = Math.PI / 2; QP.put(roundGrp, disc, 0, 0, 0);
    var rf = new T.Mesh(new T.CircleGeometry(0.48, 32), roundMat);
    rf.rotation.y = Math.PI / 2; rf.position.x = .031; roundGrp.add(rf);
    var rb2 = rf.clone(); rb2.rotation.y = -Math.PI / 2; rb2.position.x = -.031; roundGrp.add(rb2);
    add(roundGrp, .58, .06, .06, MAT.iron, -.21, .34, 0, {});
    add(roundGrp, .06, .40, .06, MAT.iron, .02, .15, 0, {});
    add(roundGrp, .06, .06, .36, MAT.iron, -.46, .34, 0, {});
    QP.addGlowSprite(roundGrp, glowTex, 0x5ce3d3, 1.5, .26, .05, 0, .05);
    QP.neonRefs.roundMats = [roundMat, roundMat];
    var roundLight = new T.PointLight(0x56dfd2, .9, 4.6, 2);
    roundLight.position.set(x1 + .35, 3.4, -1.0); g.add(roundLight);
    QP.neonRefs.lights.push(roundLight);

    /* ---------------- exterior sconces ---------------- */
    function sconce(x, y, z, ry) {
      var sg = QP.group(g, x, y, z); sg.rotation.y = ry || 0;
      add(sg, .06, .24, .12, MAT.iron, 0, .15, 0, {});
      var armC = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([
        new T.Vector3(0,0,0), new T.Vector3(0,.10,.16), new T.Vector3(0,.21,.26)
      ]), 8, .018, 5, false), MAT.iron);
      sg.add(armC);
      var cage = add(sg, .24, .27, .24, MAT.iron, 0, .24, .28, { outline: true, thick: 0.0015 });
      var pane = add(sg, .18, .21, .18, QP.basic(0xffdca1), 0, .24, .28, {});
      QP.addGlowSprite(sg, glowTex, 0xffb765, .8, .48, 0, .22, .28);
      return sg;
    }
    sconce(-5.40, 4.52, z1 + .14, 0);
    sconce(-.35, 4.52, z1 + .14, 0);
    sconce(x1 + .08, 4.60, -.64, Math.PI / 2);

    /* ---------------- side/rear dressing ---------------- */
    /* back facade windows */
    for (var bw = 0; bw < 4; bw++) {
      var bx = -4.8 + bw * 1.8;
      add(g, .72, 1.1, .10, MAT.walnut, bx, 4.9, z0 - .16, { outline: true, thick: 0.0015 });
      add(g, .55, .9, .03, MAT.glassWarm, bx, 4.9, z0 - .22, { receive: false }).renderOrder = 9;
      add(g, .9, .10, .22, MAT.stone, bx, 4.28, z0 - .20, {});
    }
    /* west wall - faded painted ad panel */
    var ghostC = QP.canvas(512, 768), gg = ghostC.getContext('2d');
    gg.fillStyle = 'rgba(55,43,38,.18)'; gg.fillRect(0, 0, 512, 768);
    gg.strokeStyle = 'rgba(206,186,151,.16)'; gg.lineWidth = 4; gg.strokeRect(18, 18, 476, 732);
    gg.fillStyle = 'rgba(204,184,150,.20)'; gg.textAlign = 'center';
    gg.font = '80px "PMingLiU",serif'; gg.fillText('綺', 256, 180); gg.fillText('羅', 256, 280); gg.fillText('旗', 256, 380); gg.fillText('袍', 256, 480);
    gg.font = '24px Georgia,serif'; gg.fillText('SINCE 1928', 256, 570);
    gg.font = '18px "PMingLiU",serif'; gg.fillText('滬上名裁 · 量身定製', 256, 620);
    var ghost = new T.Mesh(new T.PlaneGeometry(2.1, 3.1), QP.basic(0xffffff, { map: QP.texture(ghostC), transparent: true, opacity: .85, depthWrite: false }));
    ghost.rotation.y = -Math.PI / 2; ghost.position.set(x0 - .225, 5.4, -2.3); g.add(ghost);
    /* west wall service lamp + small door for orbit views */
    add(g, .08, 2.0, 1.1, MAT.walnut, x0 - .14, 1.0, -4.5, { outline: true, thick: 0.002 });
    add(g, .035, .15, .035, MAT.brass, x0 - .20, 1.1, -4.08, {});
    QP.addGlowSprite(g, glowTex, 0xffb765, .8, .3, x0 - .26, 2.3, -4.5);
    /* AC units / pipes */
    for (var ac = 0; ac < 2; ac++) {
      var ay = 5.5 + ac * 1.15;
      add(g, .72, .48, .38, MAT.stoneDark, x1 + .34, ay, -5.65, { outline: true, thick: 0.0015 });
      add(g, .55, .035, .30, MAT.iron, x1 + .36, ay - .17, -5.65, {});
      for (var fin = 0; fin < 5; fin++) add(g, .6, .02, .025, MAT.iron, x1 + .40, ay - .16 + fin * .065, -5.48, {});
    }

    /* ---------------- missing ground-floor envelope ---------------- */
    /* back wall */
    add(g, x1 - x0, BR - .18, 0.34, MAT.brick, (x0 + x1) / 2, (BR + .18) / 2, z0 - 0.17, { outline: true, thick: 0.0025, cast: true });
    add(g, x1 - x0, 2.7, 0.22, MAT.brickSmall, (x0 + x1) / 2, 1.50, z0 - 0.34, { outline: true, thick: 0.002 });
    /* rear service door */
    add(g, .86, 1.95, .09, MAT.walnut, -1.6, 1.16, z0 - .40, { outline: true, thick: 0.002 });
    add(g, .06, .45, .04, MAT.iron, -1.25, 1.2, z0 - .46, {});
    add(g, .20, .22, .08, MAT.brass, -1.25, 1.2, z0 - .50, {});
    QP.addGlowSprite(g, glowTex, 0xffb968, .8, .30, -1.15, 2.8, z0 - .34);
    /* rear windows with iron grilles */
    for (var rw = 0; rw < 3; rw++) {
      var wx = -4.7 + rw * 1.55;
      add(g, 1.0, .78, .06, MAT.walnut, wx, 5.0, z0 - .33, { outline: true, thick: 0.0015 });
      add(g, .83, .61, .03, MAT.glassWarm, wx, 5.0, z0 - .37, { receive: false }).renderOrder = 9;
      for (var gr = 0; gr < 5; gr++) add(g, .01, .58, .01, MAT.iron, wx - .32 + gr * .16, 5.0, z0 - .39, {});
    }
    /* west wall */
    add(g, .34, BR - .18, z1 - z0, MAT.brick, x0 - .17, (BR + .18) / 2, (z0 + z1) / 2, { outline: true, thick: 0.0025, cast: true });
    /* west service door */
    add(g, .09, 2.0, 1.1, MAT.walnut, x0 - .36, 1.0, -4.5, { outline: true, thick: 0.002 });
    add(g, .045, .15, .045, MAT.brass, x0 - .42, 1.18, -4.08, {});
    add(g, .18, .30, .42, MAT.iron, x0 - .52, 2.8, -4.5, {});
    QP.addGlowSprite(g, glowTex, 0xffb968, 1.0, .46, x0 - .47, 2.63, -4.5);
    add(g, .34, BT - 3.78, z1 - z0, MAT.brick, x0 - .17, (BT + 3.78) / 2, (z0 + z1) / 2, { outline: true, thick: 0.0025, cast: true });

    /* ---------------- interior-room shells ---------------- */
    /* these keep the warm interiors from spilling into the void */
    QP.buildRoomShells(g, MAT);

    /* subtle window reflections & rain streaks shared later */
    QP.buildingMats = MAT;
    return g;
  };

  /* ---------------- reusable pieces ---------------- */
  function makeRail(width, yBase, yPivot, railH) {
    /* built along local X, from -width/2..+width/2, vertical from yPivot */
    var g = QP.group(null, 0, 0, 0);
    var postMat = QP.iron(0x171b1c);
    var deco = QP.iron(0x242828);
    var yb = yPivot + 0.04;
    var yt = yPivot + railH;
    var top = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, width + 0.12, 8), postMat);
    top.rotation.z = Math.PI / 2; top.position.set(0, yt, 0); g.add(top);
    var top2 = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, width + 0.08, 6), postMat);
    top2.rotation.z = Math.PI / 2; top2.position.set(0, yt - 0.095, 0); g.add(top2);
    var bottom = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, width, 6), postMat);
    bottom.rotation.z = Math.PI / 2; bottom.position.set(0, yb + 0.08, 0); g.add(bottom);
    var n = Math.max(4, Math.round(width / 0.24));
    for (var i = 0; i <= n; i++) {
      var x = -width / 2 + i * width / n;
      var isPost = (i === 0 || i === n);
      var bar = new T.Mesh(new T.CylinderGeometry(isPost ? 0.037 : 0.015, isPost ? 0.041 : 0.018, railH - .08, 6), postMat);
      bar.position.set(x, (yb + yt) / 2 - .02, 0); g.add(bar);
      if (isPost) {
        var ball = new T.Mesh(new T.SphereGeometry(.088, 8, 6), postMat);
        ball.position.set(x, yt + .12, 0); g.add(ball);
        var spike = new T.Mesh(new T.ConeGeometry(.042, .17, 6), deco);
        spike.position.set(x, yt + .24, 0); g.add(spike);
      } else {
        var tip = new T.Mesh(new T.ConeGeometry(.023, .11, 5), deco);
        tip.position.set(x, yt - .01, 0); g.add(tip);
      }
    }
    for (var k = 0; k < Math.max(1, Math.round(width / 0.48)); k++) {
      var cx = -width / 2 + (k + .5) * width / Math.max(1, Math.round(width / .48));
      var r = Math.min(.13, width * .12);
      var ring = new T.Mesh(new T.TorusGeometry(r, .012, 4, 12), deco);
      ring.position.set(cx, yb + 0.38, 0); g.add(ring);
      var arcL = new T.Mesh(new T.TorusGeometry(r * .8, .009, 4, 10, Math.PI), deco);
      arcL.position.set(cx - r * .72, yb + .38, 0); arcL.rotation.z = .6; g.add(arcL);
      var arcR = arcL.clone(); arcR.position.x = cx + r * .72; arcR.rotation.z = Math.PI - .6; g.add(arcR);
    }
    return g;
  }
  QP.makeRail = makeRail;

  function makeUrn(size, matA, matB) {
    var g = QP.group(null, 0, 0, 0);
    var base = QP.cyl(size * .55, size * .7, size * .36, 12, matA, true, 0.0015);
    QP.put(g, base, 0, size * .15, 0);
    var body = new T.Mesh(new T.LatheGeometry([
      new T.Vector2(size * .55, size * .34), new T.Vector2(size * .7, size * .56),
      new T.Vector2(size * .82, size * .82), new T.Vector2(size * .60, size * 1.02),
      new T.Vector2(size * .44, size * 1.12), new T.Vector2(size * .46, size * 1.20)
    ], 14), matA);
    g.add(body);
    var rim = new T.Mesh(new T.TorusGeometry(size * .48, size * .035, 5, 14), matB);
    rim.rotation.x = Math.PI / 2; rim.position.y = size * 1.19; g.add(rim);
    var soil = QP.cyl(size * .42, size * .42, .02, 10, QP.toon(0x1c1912), false);
    QP.put(g, soil, 0, size * 1.16, 0);
    return g;
  }
  QP.makeUrn = makeUrn;
})();
