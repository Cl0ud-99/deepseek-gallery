/* =========================================================
   ground.js — collectible plinth, wet stone street, tram rails
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP, L = QP.L, P = QP.PAL;
  function cloneTex(t, rx, ry) {
    var c = t.clone();
    c.needsUpdate = true;
    c.wrapS = c.wrapT = T.RepeatWrapping;
    c.repeat.set(rx, ry);
    return c;
  }
  QP.cloneTex = cloneTex;

  QP.buildGround = function (world) {
    var g = QP.group(world, 0, 0, 0);
    g.name = 'street-base';
    var half = L.half;

    /* ---------------- wooden collector plinth ---------------- */
    var plinthMat = QP.std(0xffffff, {
      map: cloneTex(QP.Tex.walnutDark(), 4, 1),
      roughness: 0.34, metalness: 0.03, envMapIntensity: 0.8
    });
    var plinth = QP.box(half * 2 + 0.38, 0.86, half * 2 + 0.38, plinthMat, true, 0.0034);
    QP.put(g, plinth, 0, -0.48, 0);
    /* bottom reveal */
    var footMat = QP.std(0x15100d, { metalness: 0.15, roughness: 0.55 });
    QP.put(g, QP.box(half * 2 + 0.06, 0.16, half * 2 + 0.06, footMat, true, 0.003), 0, -0.97, 0);
    /* thin brass band around the base */
    var brassMat = QP.brass(0xa87937, 0.24);
    var trimY = -0.10, out = half + 0.195;
    QP.put(g, QP.box(half * 2 + 0.4, 0.035, 0.045, brassMat, false), 0, trimY, out);
    QP.put(g, QP.box(half * 2 + 0.4, 0.035, 0.045, brassMat, false), 0, trimY, -out);
    QP.put(g, QP.box(0.045, 0.035, half * 2 + 0.4, brassMat, false), out, trimY, 0);
    QP.put(g, QP.box(0.045, 0.035, half * 2 + 0.4, brassMat, false), -out, trimY, 0);
    /* corner brass rivets */
    for (var sx = -1; sx <= 1; sx += 2) {
      for (var sz = -1; sz <= 1; sz += 2) {
        var rivet = QP.cyl(0.048, 0.052, 0.024, 10, brassMat, false);
        rivet.rotation.x = Math.PI / 2;
        QP.put(g, rivet, sx * (out - 0.08), trimY, sz * (out + 0.012));
        var rivet2 = QP.cyl(0.038, 0.04, 0.02, 10, brassMat, false);
        rivet2.rotation.z = Math.PI / 2;
        QP.put(g, rivet2, sx * (out + 0.012), trimY, sz * (out - 0.10));
      }
    }
    /* little brass title plaque on the front edge */
    var pc = QP.canvas(768, 180), pg = pc.getContext('2d');
    var bg = pg.createLinearGradient(0, 0, 768, 180);
    bg.addColorStop(0, '#6e5124'); bg.addColorStop(.22, '#c8a45f'); bg.addColorStop(.5, '#886734');
    bg.addColorStop(.72, '#e1c382'); bg.addColorStop(1, '#5f441e');
    pg.fillStyle = bg; pg.fillRect(0, 0, 768, 180);
    pg.strokeStyle = 'rgba(50,31,10,.65)'; pg.lineWidth = 5; pg.strokeRect(15, 15, 738, 150);
    pg.textAlign = 'center'; pg.fillStyle = '#2e1d0b';
    pg.font = '600 53px "PMingLiU","MingLiU","Microsoft JhengHei",serif';
    pg.fillText('綺 羅 弄  ·  上 海  1936', 384, 86);
    pg.font = '400 21px Georgia,serif'; pg.fillStyle = 'rgba(43,26,8,.72)';
    pg.fillText('A MINIATURE OF OLD SHANGHAI  ·  QIPAO ATELIER & GRAMOPHONE', 384, 128);
    var plaqueMat = QP.basic(0xffffff, { map: QP.texture(pc, { repeat: [1, 1] }) });
    var plaque = new T.Mesh(new T.PlaneGeometry(3.4, 0.8), plaqueMat);
    plaque.position.set(0, -0.47, half + 0.235);
    g.add(plaque);
    /* top rim bevel / brass lip around street */
    var lip = QP.brass(0x8f6a32, 0.28);
    QP.put(g, QP.box(half * 2 + 0.16, 0.035, 0.10, lip, true, 0.0028), 0, -0.035, half + 0.08);
    QP.put(g, QP.box(half * 2 + 0.16, 0.035, 0.10, lip, true, 0.0028), 0, -0.035, -half - 0.08);
    QP.put(g, QP.box(0.10, 0.035, half * 2 + 0.16, lip, true, 0.0028), half + 0.08, -0.035, 0);
    QP.put(g, QP.box(0.10, 0.035, half * 2 + 0.16, lip, true, 0.0028), -half - 0.08, -0.035, 0);

    /* ---------------- cobblestone street ---------------- */
    var cob = QP.Tex.cobble();
    var cobMap = cloneTex(cob.map, 5.8, 5.8);
    var cobBump = cloneTex(cob.bump, 5.8, 5.8);
    var roadMat = QP.std(0xbeb9b0, {
      map: cobMap, bumpMap: cobBump, bumpScale: 0.008,
      roughness: 0.58, metalness: 0.012, envMapIntensity: 0.16
    });
    var road = new T.Mesh(new T.PlaneGeometry(half * 2, half * 2, 1, 1), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.003;
    road.receiveShadow = true;
    g.add(road);

    /* a few darker wet patches so the paving reads uneven */
    var wetMat = new T.MeshBasicMaterial({
      color: 0x0b1116, transparent: true, opacity: 0.38, depthWrite: false,
      map: QP.Tex.puddleMask()
    });
    for (var wp = 0; wp < 10; wp++) {
      var wm = new T.Mesh(new T.PlaneGeometry(2.8 + Math.random() * 3.8, 2.1 + Math.random() * 4.5), wetMat);
      wm.rotation.x = -Math.PI / 2;
      wm.rotation.z = Math.random() * 6.28;
      wm.position.set(-7 + Math.random() * 14, 0.012, -7 + Math.random() * 14);
      wm.renderOrder = 2;
      g.add(wm);
    }

    /* ---------------- raised sidewalks ---------------- */
    var pave = QP.Tex.pavement();
    var paveMat = QP.std(0xc3c7c4, {
      map: cloneTex(pave.map, 4.2, 1.3), roughness: 0.44, metalness: 0.07, envMapIntensity: 0.5
    });
    var curbMat = QP.std(0x77766e, { roughness: 0.42, metalness: 0.08, envMapIntensity: 0.5 });
    var sideMat = QP.std(0x45433c, { roughness: 0.54 });
    function sidewalk(x, z, w, d) {
      var grp = QP.group(g, x, 0, z);
      var side = QP.box(w, 0.14, d, sideMat, true, 0.0022);
      QP.put(grp, side, 0, 0.07, 0);
      var top = new T.Mesh(new T.PlaneGeometry(w - 0.03, d - 0.03), paveMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.143;
      top.receiveShadow = true;
      grp.add(top);
      return grp;
    }
    sidewalk(-2.525, 1.26, 11.45, 1.28);      // south block
    sidewalk(2.235, -3.79, 1.83, 8.82);       // east block
    /* curbs: pale stone with dark shadow line */
    function curb(x, z, w, d) {
      var c = QP.box(w, 0.18, d, curbMat, true, 0.0025);
      QP.put(g, c, x, 0.09, z);
      var shadow = QP.box(w * .99, 0.02, d * .99, QP.basic(0x0b0e11), false);
      QP.put(g, shadow, x, 0.005, z);
      return c;
    }
    curb(-2.46, 1.91, 11.58, 0.16);
    curb(3.16, -3.75, 0.16, 8.63);
    /* curb return at the corner */
    QP.put(g, QP.cyl(0.08, 0.08, 0.18, 12, curbMat, true, 0.002), 3.16, 0.09, 1.91);
    /* tactile / inset stone border on sidewalk edge */
    for (var tx = -7.9; tx < 3.0; tx += 0.42) {
      var s = QP.box(0.22, 0.018, 0.07, QP.std(0x8e8a7f, { roughness: .5 }), false);
      QP.put(g, s, tx, 0.15, 1.78);
    }
    for (var tz = -7.9; tz < 0.5; tz += 0.42) {
      var s2 = QP.box(0.07, 0.018, 0.22, QP.std(0x8e8a7f, { roughness: .5 }), false);
      QP.put(g, s2, 3.04, 0.15, tz);
    }

    /* stepped threshold stones hugging the shopfront */
    var thresholdMat = QP.std(0x8f8778, { roughness: .38, metalness: .06 });
    QP.put(g, QP.box(6.95, 0.08, 0.34, thresholdMat, true, 0.0025), -2.30, 0.18, 0.80);
    QP.put(g, QP.box(0.34, 0.08, 4.55, thresholdMat, true, 0.0025), 1.50, 0.18, -1.65);

    /* ---------------- tram track ---------------- */
    var track = QP.group(g, 0, 0, 0);
    track.name = 'tram-tracks';
    var railMat = QP.std(0x7d888c, {
      metalness: 0.92, roughness: 0.25, envMapIntensity: 1.25
    });
    var railDark = QP.std(0x24292c, { metalness: 0.88, roughness: 0.34, envMapIntensity: 1.2 });
    var grooveMat = QP.std(0x101417, { metalness: 0.55, roughness: 0.4 });
    function railX(z, len, x, raised) {
      var off = QP.box(len, 0.045, 0.34, grooveMat, false);
      QP.put(track, off, x, 0.024, z);
      var web = QP.box(len, 0.055, 0.12, railDark, false);
      QP.put(track, web, x, 0.058, z);
      var cap = QP.box(len, 0.022, 0.085, railMat, false);
      QP.put(track, cap, x, 0.095 + (raised || 0), z);
      var shine = QP.box(len, 0.006, 0.028, QP.basic(0xbcc7c7), false);
      QP.put(track, shine, x, 0.108 + (raised || 0), z - 0.024);
    }
    function railZ(x, len, z, raised) {
      var off = QP.box(0.34, 0.045, len, grooveMat, false);
      QP.put(track, off, x, 0.024, z);
      var web = QP.box(0.12, 0.055, len, railDark, false);
      QP.put(track, web, x, 0.058, z);
      var cap = QP.box(0.085, 0.022, len, railMat, false);
      QP.put(track, cap, x, 0.095 + (raised || 0), z);
      var shine = QP.box(0.028, 0.006, len, QP.basic(0xbcc7c7), false);
      QP.put(track, shine, x - 0.024, 0.108 + (raised || 0), z);
    }
    var mainZ = L.trackZ;
    railX(mainZ - L.gauge / 2, 16.9, 0, 0);
    railX(mainZ + L.gauge / 2, 16.9, 0, 0);
    /* cross track: at the right of the diorama */
    railZ(6.55 - L.gauge / 2, 16.9, 0, 0.002);
    railZ(6.55 + L.gauge / 2, 16.9, 0, 0.002);
    /* crossing wear plates */
    for (var a = -1; a <= 1; a += 2) {
      for (var b = -1; b <= 1; b += 2) {
        var cp = QP.box(0.72, 0.02, 0.72, QP.std(0x3b3a33, { metalness: 0.75, roughness: 0.3 }), false);
        QP.put(track, cp, 6.55 + a * L.gauge / 2, 0.04, mainZ + b * L.gauge / 2);
      }
    }
    /* expansion joints, small dark seams */
    for (var jx = -8; jx <= 8; jx += 2.2) {
      for (var q = -1; q <= 1; q += 2) {
        var seam = QP.box(0.025, 0.032, 0.36, QP.basic(0x090b0c), false);
        QP.put(track, seam, jx, 0.055, mainZ + q * L.gauge / 2);
      }
    }
    /* track bed gutter stones */
    for (var gz = -1; gz <= 1; gz += 2) {
      var bed = QP.box(16.8, 0.018, 0.16, QP.std(0x333536, { roughness: .5 }), false);
      QP.put(track, bed, 0, 0.025, mainZ + gz * 1.06);
    }
    var bed2 = QP.box(0.16, 0.018, 16.8, QP.std(0x333536, { roughness: .5 }), false);
    QP.put(track, bed2, 6.55 + 1.06, 0.025, 0);
    var bed3 = QP.box(0.16, 0.018, 16.8, QP.std(0x333536, { roughness: .5 }), false);
    QP.put(track, bed3, 6.55 - 1.06, 0.025, 0);

    /* rail power conduit between tracks */
    var conduit = QP.cyl(0.026, 0.026, 15.5, 6, QP.iron(0x151819), false);
    conduit.rotation.z = Math.PI / 2;
    QP.put(track, conduit, 0, 0.045, mainZ);

    /* ---------------- drains & covers ---------------- */
    function manhole(x, z, r, label) {
      var m = QP.group(g, x, 0, z);
      var base = QP.cyl(r, r, 0.03, 24, QP.std(0x262627, { metalness: 0.7, roughness: .38 }), true, 0.0022);
      QP.put(m, base, 0, 0.025, 0);
      var ring = new T.Mesh(new T.TorusGeometry(r * .92, 0.014, 5, 24), QP.brass(0x6e6653, .35));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.046; m.add(ring);
      var cc = QP.canvas(128, 128), cg = cc.getContext('2d');
      cg.fillStyle = '#202224'; cg.beginPath(); cg.arc(64, 64, 62, 0, 6.3); cg.fill();
      cg.strokeStyle = '#706a58'; cg.lineWidth = 2;
      for (var rr = 10; rr < 62; rr += 10) { cg.beginPath(); cg.arc(64, 64, rr, 0, 6.3); cg.stroke(); }
      cg.fillStyle = '#8c836a'; cg.font = '700 14px "Microsoft JhengHei",sans-serif'; cg.textAlign = 'center';
      cg.fillText(label || '上海工部局', 64, 58); cg.font = '9px Georgia,serif'; cg.fillText('S.M.C. 1932', 64, 75);
      var mm = new T.Mesh(new T.CircleGeometry(r * .9, 24), QP.basic(0xffffff, { map: QP.texture(cc) }));
      mm.rotation.x = -Math.PI / 2; mm.position.y = 0.047; m.add(mm);
      return m;
    }
    manhole(-1.35, 2.25, 0.38, '上海工部局');
    manhole(5.15, 1.15, 0.31, '下水道');
    /* drain grate near curb */
    var grate = QP.group(g, 1.75, 0, 2.06);
    QP.put(grate, QP.box(0.55, 0.025, 0.26, QP.std(0x1a1d1d, { metalness: .7, roughness: .4 }), false), 0, 0.022, 0);
    for (var dg = 0; dg < 7; dg++) {
      QP.put(grate, QP.box(0.035, 0.012, 0.22, QP.iron(0x54564e), false), -0.23 + dg * .075, 0.04, 0);
    }
    /* old coal hole in sidewalk */
    var coal = QP.cyl(0.18, 0.18, 0.018, 18, QP.iron(0x242323), true, 0.002);
    QP.put(g, coal, -4.6, 0.157, 1.38);
    var coalRim = new T.Mesh(new T.TorusGeometry(0.18, 0.014, 5, 18), QP.iron(0x5d523a));
    coalRim.rotation.x = Math.PI / 2; coalRim.position.set(-4.6, 0.17, 1.38); g.add(coalRim);

    /* ---------------- autumn leaves ---------------- */
    var leafMat = QP.std(0x8a5d2e, { roughness: .8, side: T.DoubleSide });
    var leafDark = QP.std(0x684a2c, { roughness: .8, side: T.DoubleSide });
    var lg = new T.PlaneGeometry(0.09, 0.19);
    for (var lf = 0; lf < 44; lf++) {
      var leaf = new T.Mesh(lg, lf % 3 ? leafMat : leafDark);
      var lx = -7.7 + Math.random() * 15.2;
      var lz = -7.7 + Math.random() * 15.2;
      if (lz > 0.62 && lz < 1.95 && lx < 3.2) lz = 2.1 + Math.random() * 5.5;
      if (lx > 1.3 && lx < 3.2 && lz < 0.62) lx = 3.3 + Math.random() * 4.2;
      leaf.position.set(lx, lz > 0.62 && lz < 2 && lx < 3.2 ? 0.152 : 0.016, lz);
      leaf.rotation.x = -Math.PI / 2 + (Math.random() - .5) * .16;
      leaf.rotation.z = Math.random() * 6.28;
      leaf.castShadow = false;
      g.add(leaf);
    }

    /* ---------------- wet street mirror strips (static base of reflections) ---------------- */
    var puddleMask = QP.Tex.puddleMask();
    var puddleGlass = QP.physical(0x202a2e, {
      metalness: 0.04, roughness: 0.06, transparent: true, opacity: 0.60,
      clearcoat: 1, clearcoatRoughness: 0.02, side: T.DoubleSide, depthWrite: false,
      envMapIntensity: 0.55, alphaMap: puddleMask, alphaTest: 0.02
    });
    var puddleList = [
      [2.3, 2.06, 2.5, 0.85, 0.5], [4.7, 5.55, 3.3, 1.6, -0.2], [-4.6, 4.1, 2.9, 1.45, 0.4],
      [6.3, 0.0, 1.8, 3.2, 0.1], [-1.1, 6.6, 2.7, 1.5, -0.5], [1.7, 1.13, 1.15, 0.5, 0.0],
      [7.3, 6.7, 1.5, 1.2, 0.8], [-5.8, 5.7, 1.8, 1.1, 0.3]
    ];
    var puddles = [];
    for (var pi = 0; pi < puddleList.length; pi++) {
      var pd = puddleList[pi];
      var pm = new T.Mesh(new T.PlaneGeometry(pd[2], pd[3]), puddleGlass);
      pm.rotation.x = -Math.PI / 2;
      pm.rotation.z = pd[4];
      pm.position.set(pd[0], pd[1] > 1.0 ? 0.153 : 0.018, pd[1]);
      pm.renderOrder = 3;
      g.add(pm);
      puddles.push(pm);
      var dark = new T.Mesh(new T.PlaneGeometry(pd[2] * 1.02, pd[3] * 1.02), new T.MeshBasicMaterial({
        color: 0x060b10, transparent: true, opacity: 0.58, alphaMap: puddleMask, alphaTest: 0.02, depthWrite: false
      }));
      dark.rotation.x = -Math.PI / 2;
      dark.rotation.z = pd[4] + .4;
      dark.position.set(pd[0], (pd[1] > 1.0 ? 0.152 : 0.014), pd[1]);
      dark.renderOrder = 2;
      g.add(dark);
    }
    QP.puddleMeshes = puddles;

    /* tiny curb-side puddle streaks */
    var wetlineMat = QP.basic(0x92a8b4, { transparent: true, opacity: 0.07, blending: T.AdditiveBlending });
    for (var wl = 0; wl < 7; wl++) {
      var strip = new T.Mesh(new T.PlaneGeometry(1.2 + Math.random() * 2.2, 0.04), wetlineMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(-6 + Math.random() * 12, 0.03, 2.00 + Math.random() * 0.4);
      g.add(strip);
    }

    QP.ground = g;
    return g;
  };
})();
