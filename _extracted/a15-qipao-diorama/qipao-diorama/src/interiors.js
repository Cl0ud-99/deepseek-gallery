/* =========================================================
   interiors.js — qipao atelier, gramophone shop, upstairs salon
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP, P = QP.PAL, B = QP.L.build;
  var glowTex = QP.Tex.glow();
  var starTex = QP.Tex.starGlow();
  var M = {};
  var anim = (QP.anim = QP.anim || { discs: [], curtains: [], flicker: [] });

  function add(parent, w, h, d, mat, x, y, z, o) {
    o = o || {};
    var m = QP.box(w, h, d, mat, o.outline !== undefined ? o.outline : false, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    if (o.receive !== false) m.receiveShadow = true;
    return m;
  }
  function cyl(parent, rt, rb, h, seg, mat, x, y, z, o) {
    o = o || {};
    var m = QP.cyl(rt, rb, h, seg, mat, o.outline !== undefined ? o.outline : false, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    return m;
  }
  function tube(parent, pts, rad, mat, segs) {
    var curve = new T.CatmullRomCurve3(pts);
    var m = new T.Mesh(new T.TubeGeometry(curve, segs || 22, rad, 6, false), mat);
    parent.add(m);
    return m;
  }
  function roundedCushion(w, h, d, r, mat) {
    var shape = QP.roundedRectShape(w, h, Math.min(r, h * .48));
    var geo = new T.ExtrudeGeometry(shape, {
      depth: d, bevelEnabled: true, bevelSize: r * .22, bevelThickness: r * .22,
      bevelSegments: 2, curveSegments: 8, steps: 1
    });
    geo.translate(0, 0, -d / 2);
    var m = new T.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  }
  function glow(parent, color, size, opacity, x, y, z) {
    return QP.addGlowSprite(parent, glowTex, color, size, opacity, x, y, z);
  }
  function lightPool(parent, color, w, d, opacity, x, y, z, ry) {
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({
      map: glowTex, color: color, transparent: true, opacity: opacity,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false
    }));
    m.rotation.x = -Math.PI / 2;
    if (ry) m.rotation.z = ry;
    m.position.set(x, y, z);
    m.renderOrder = 4;
    parent.add(m);
    return m;
  }
  function shadowBlob(parent, w, d, x, y, z, op) {
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({
      map: glowTex, color: 0x030202, transparent: true, opacity: op === undefined ? .38 : op,
      depthWrite: false, side: T.DoubleSide
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + .004, z);
    parent.add(m);
    return m;
  }
  function makeMaterials() {
    var walnut = QP.Tex.walnutDark();
    M.walnut = QP.std(0x4a2f1d, { map: QP.cloneTex(walnut, 1.3, 1.0), roughness: .38, metalness: .03, envMapIntensity: .55 });
    M.walnutLight = QP.std(0x6b4a2c, { map: QP.cloneTex(QP.Tex.walnut(), 1.5, 1), roughness: .34, metalness: .04, envMapIntensity: .65 });
    M.ebony = QP.std(0x161313, { roughness: .33, metalness: .12, envMapIntensity: .7 });
    M.brass = QP.brass(0xbf9445, .22);
    M.brassLight = QP.brass(0xd8b36a, .18);
    M.brassDark = QP.brass(0x785423, .36);
    M.iron = QP.iron(0x171819);
    M.ivory = QP.std(0xe2d5bd, { roughness: .32, metalness: .02 });
    M.porcelain = QP.std(0xf1e7d4, { roughness: .2, metalness: .02, envMapIntensity: .8 });
    M.cream = QP.toon(0xe6d3ae, { rim: .06, rimColor: 0xffe4b2 });
    M.greenGlass = QP.physical(0x23594d, { metalness: 0.0, roughness: .08, clearcoat: 1, transparent: true, opacity: .55, side: T.DoubleSide, envMapIntensity: 1.4 });
    M.velvet = QP.physical(0x541225, {
      roughness: .62, metalness: 0, sheen: 1, sheenColor: 0xca7489, sheenRoughness: .5, envMapIntensity: .3
    });
    M.velvetGold = QP.physical(0x9b6a2e, {
      roughness: .52, metalness: .08, sheen: .8, sheenColor: 0xf3d393, sheenRoughness: .4, envMapIntensity: .6
    });
    M.velvetJade = QP.physical(0x174d43, {
      roughness: .55, metalness: .02, sheen: 1, sheenColor: 0x65b49c, sheenRoughness: .5
    });
    M.leaves = QP.toon(0x244534, { rim: .05 });
    M.leaves2 = QP.toon(0x385c42, { rim: .05 });
    M.flowerWhite = QP.toon(0xeadfb9);
    M.flowerRose = QP.toon(0xb84c5e, { rim: .04 });
    M.gold = QP.brass(0xd8ad56, .2);
    M.blackLacquer = QP.std(0x0c0a09, { roughness: .19, metalness: .2, envMapIntensity: 1.2 });
    M.ceiling = QP.toon(0x2b1c16);
    M.redSilk = QP.physical(0x6b1728, { roughness: .4, sheen: .7, sheenColor: 0xd9768c });
    M.armchair = QP.physical(0x28392f, { roughness: .62, sheen: 1, sheenColor: 0x6e9e84 });
  }
  makeMaterials();

  /* ---------------- basic tailor fittings ---------------- */
  function makeMannequin(parent, x, floorY, z, opts) {
    opts = opts || {};
    var g = QP.group(parent, x, floorY, z);
    g.rotation.y = opts.ry || 0;
    g.name = 'qipao-mannequin';
    var baseMat = opts.baseMat || M.walnut;
    cyl(g, .28, .33, .06, 20, baseMat, 0, .03, 0, { outline: true, thick: .0018 });
    cyl(g, .27, .27, .025, 20, M.brassDark, 0, .073, 0, {});
    cyl(g, .018, .018, .34, 8, M.brass, 0, .24, 0, {});
    /* dress silhouette */
    var pts = [
      new T.Vector2(.30, 0.00), new T.Vector2(.31, .03), new T.Vector2(.295, .16),
      new T.Vector2(.265, .36), new T.Vector2(.235, .60), new T.Vector2(.225, .72),
      new T.Vector2(.26, .86), new T.Vector2(.30, 1.00), new T.Vector2(.292, 1.12),
      new T.Vector2(.245, 1.24), new T.Vector2(.195, 1.33), new T.Vector2(.12, 1.38)
    ];
    var geo = new T.LatheGeometry(pts, 24);
    geo.scale(1, 1, .68);
    var dress = new T.Mesh(geo, opts.mat);
    dress.position.y = .30;
    dress.castShadow = true;
    g.add(dress);
    /* high collar + gold piping */
    var collar = QP.cyl(.10, .115, .11, 16, opts.collarMat || opts.mat, false);
    QP.put(g, collar, 0, 1.72, 0);
    var collarRing = new T.Mesh(new T.TorusGeometry(.105, .009, 4, 18), M.gold);
    collarRing.rotation.x = Math.PI / 2; collarRing.position.y = 1.77; g.add(collarRing);
    /* neck & mannequin head */
    var neck = QP.cyl(.055, .065, .16, 10, M.ivory, false);
    QP.put(g, neck, 0, 1.81, 0);
    var head = QP.sphere(.135, 18, 12, M.ivory, false);
    head.scale.set(1, 1.22, .90); head.position.set(0, 2.01, .01); g.add(head);
    /* dark lacquered hair cap and low bun */
    var hairGeo = new T.SphereGeometry(.139, 16, 10, 0, Math.PI * 2, 0, Math.PI * .58);
    var hair = new T.Mesh(hairGeo, M.blackLacquer);
    hair.scale.set(1.02, 1.19, .95); hair.position.set(0, 2.035, -.012); g.add(hair);
    var bun = QP.sphere(.085, 10, 8, M.blackLacquer, false);
    bun.scale.set(1, .8, .8); bun.position.set(0, 2.055, -.13); g.add(bun);
    /* cap sleeves */
    for (var s = -1; s <= 1; s += 2) {
      var sleeve = QP.sphere(.15, 12, 8, opts.mat, false);
      sleeve.scale.set(.9, .38, .64); sleeve.position.set(s * .19, 1.58, 0); g.add(sleeve);
    }
    /* gold frog buttons down the front */
    for (var i = 0; i < 6; i++) {
      var yy = 1.62 - i * .105;
      var rad = i < 2 ? .12 : .18;
      var btn = QP.sphere(.018, 7, 5, M.gold, false);
      QP.put(g, btn, .015, yy, rad * .69 + .005);
      var bar = add(g, .05, .01, .012, M.gold, .015, yy, rad * .69 + .012, {});
    }
    /* gold trims at hem and waist */
    var hem = new T.Mesh(new T.TorusGeometry(.31, .009, 4, 26), M.gold);
    hem.rotation.x = Math.PI / 2; hem.scale.set(1, .68, 1); hem.position.y = .305; g.add(hem);
    var waist = new T.Mesh(new T.TorusGeometry(.228, .005, 4, 24), M.gold);
    waist.rotation.x = Math.PI / 2; waist.scale.set(1, .68, 1); waist.position.y = 1.02; g.add(waist);
    /* a fine side slit / gold seam */
    var slit = add(g, .009, .66, .012, M.gold, .245, .65, .05, { ry: -.2 });
    /* small price card */
    var cardC = QP.canvas(256, 160), cg = cardC.getContext('2d');
    cg.fillStyle = '#e8dcc2'; cg.fillRect(0, 0, 256, 160);
    cg.strokeStyle = '#805f3a'; cg.lineWidth = 2; cg.strokeRect(8, 8, 240, 144);
    cg.fillStyle = '#673e37'; cg.textAlign = 'center'; cg.font = '38px "PMingLiU",serif';
    cg.fillText(opts.label || '錦繡', 128, 76);
    cg.font = '14px "PMingLiU",serif'; cg.fillStyle = 'rgba(103,62,55,.58)';
    cg.fillText('高級定製 · 手繡', 128, 110);
    var card = new T.Mesh(new T.PlaneGeometry(.20, .125), QP.basic(0xffffff, { map: QP.texture(cardC) }));
    card.position.set(0, .34, .34); card.rotation.x = -.3; g.add(card);
    shadowBlob(parent, .95, .95, x, floorY + .008, z, .30);
    return g;
  }

  function dressMaterial(spec, seed) {
    var tx = QP.Tex.brocade(spec[0], spec[1], seed);
    return QP.physical(0xffffff, {
      map: tx, roughness: .29, metalness: .03,
      sheen: .9, sheenColor: spec[2] || 0xf2d59b, sheenRoughness: .38,
      envMapIntensity: .7
    });
  }

  /* ---------------- fabric wall ---------------- */
  function fabricWall(parent) {
    var root = QP.group(parent, 0, 0, 0);
    var specs = [
      ['#184d40', 'rgba(223,187,92,.9)', 0xb7e4d3],
      ['#6e1628', 'rgba(232,197,143,.85)', 0xf3c3bf],
      ['#172c50', 'rgba(215,179,94,.9)', 0xb5cce9],
      ['#8a5125', 'rgba(248,211,140,.9)', 0xf5d7a5],
      ['#582456', 'rgba(218,183,108,.85)', 0xe7c8e1],
      ['#d2b88c', 'rgba(94,49,41,.85)', 0xffe9c7],
      ['#8f2b30', 'rgba(224,197,125,.9)', 0xf6d0b7],
      ['#28423e', 'rgba(198,160,84,.9)', 0xaad1c7]
    ];
    var mats = [];
    for (var i = 0; i < specs.length; i++) {
      mats.push(QP.physical(0xffffff, {
        map: QP.Tex.brocade(specs[i][0], specs[i][1], 80 + i * 7),
        roughness: .34, metalness: .03, sheen: .7, sheenColor: specs[i][2], envMapIntensity: .55
      }));
    }
    var shelfMat = M.walnut;
    var x0 = -5.25, x1 = -2.00;
    for (var r = 0; r < 6; r++) {
      var y = .62 + r * .38;
      /* brass shelf rail */
      cyl(root, .012, .012, x1 - x0 + .05, 6, M.brassDark, (x0 + x1) / 2, y - .19, -2.69, { rz: Math.PI / 2 });
      for (var c = 0; c < 11; c++) {
        var rx = x0 + .11 + c * (x1 - x0 - .18) / 10;
        var t = (r * 11 + c * 3 + 1) % mats.length;
        var rad = .095 + ((r * 7 + c) % 5) * .007;
        var roll = new T.Mesh(QP.cylGeo(rad, rad, .74 + (c % 3) * .1, 14, false), mats[t]);
        roll.rotation.x = Math.PI / 2;
        roll.position.set(rx, y, -3.09 + (c % 2) * .035);
        roll.castShadow = true;
        root.add(roll);
        /* end cap ring and label */
        var ring = new T.Mesh(new T.TorusGeometry(rad * .93, .0075, 4, 14), M.gold);
        ring.rotation.x = 0; ring.position.set(rx, y, -2.69 + (c % 2) * .035); root.add(ring);
        if ((c + r) % 4 === 0) {
          var tag = add(root, .12, .055, .008, QP.toon(0xd7c7a2), rx, y - rad - .03, -2.67, { ry: 0, rx: .2 });
        }
      }
    }
    /* wooden stiles */
    for (var v = 0; v < 4; v++) {
      var vx = x0 - .06 + v * (x1 - x0 + .12) / 3;
      add(root, .055, 2.75, .10, M.walnut, vx, 1.75, -2.705, { outline: true, thick: .0015 });
    }
    add(root, x1 - x0 + .25, .14, .18, M.walnut, (x0 + x1) / 2, 2.83, -2.76, { outline: true, thick: .0018 });
    /* brass gallery over the top */
    cyl(root, .011, .011, x1 - x0 + .3, 6, M.brass, (x0 + x1) / 2, 2.96, -2.64, { rz: Math.PI / 2 });
    /* little step ladder */
    var lad = QP.group(parent, -4.95, .2, -2.15);
    lad.rotation.z = -.10;
    add(lad, .06, 2.4, .06, M.brassDark, -.27, 1.2, 0, {});
    add(lad, .06, 2.4, .06, M.brassDark, .27, 1.2, 0, {});
    for (var lr = 0; lr < 6; lr++) add(lad, .56, .035, .055, M.walnut, 0, .18 + lr * .36, 0, {});
    shadowBlob(root, .65, .35, -4.95, .012, -2.15, .2);
    return root;
  }

  /* ---------------- cutting table / sewing machine ---------------- */
  function makeScissors(parent, x, y, z, ry) {
    var g = QP.group(parent, x, y, z);
    g.rotation.y = ry || 0;
    for (var s = -1; s <= 1; s += 2) {
      var blade = add(g, .28, .008, .018, M.gold, 0, .01, s * .012, { rz: s * .11 });
      var handle = new T.Mesh(new T.TorusGeometry(.035, .011, 5, 12), M.gold);
      handle.position.set(-.14, .012, s * .033); handle.rotation.x = Math.PI / 2; g.add(handle);
    }
    return g;
  }
  function makeSewingMachine(parent, x, y, z) {
    var g = QP.group(parent, x, y, z);
    g.rotation.y = -.18;
    /* bed */
    add(g, .56, .035, .25, M.blackLacquer, 0, .017, 0, { outline: true, thick: .0016 });
    add(g, .54, .012, .02, M.gold, 0, .04, .115, {});
    /* ornate body: pillar + arm */
    add(g, .12, .28, .13, M.blackLacquer, -.16, .16, -.02, { outline: true, thick: .0015 });
    add(g, .52, .075, .12, M.blackLacquer, -.02, .315, -.02, { outline: true, thick: .0015 });
    var curved = new T.Mesh(new T.TorusGeometry(.12, .055, 6, 12, Math.PI * .95), M.blackLacquer);
    curved.rotation.y = Math.PI / 2; curved.rotation.z = .4; curved.position.set(-.14, .31, -.02); g.add(curved);
    add(g, .11, .17, .10, M.blackLacquer, .18, .22, -.02, { outline: true, thick: .0015 });
    /* gold decals */
    var dC = QP.canvas(512, 256), dg = dC.getContext('2d');
    dg.clearRect(0, 0, 512, 256); dg.strokeStyle = 'rgba(221,181,97,.92)'; dg.lineWidth = 2.4;
    for (var i = 0; i < 8; i++) {
      dg.beginPath(); dg.moveTo(80, 220);
      dg.bezierCurveTo(100 + i * 15, 160, 380 - i * 16, 160, 420 - i * 20, 208);
      dg.stroke();
    }
    dg.beginPath(); dg.arc(256, 115, 53, 0, 6.3); dg.stroke();
    dg.font = '26px "PMingLiU",serif'; dg.textAlign = 'center'; dg.fillStyle = 'rgba(232,199,122,.9)';
    dg.fillText('蝴蝶', 256, 123);
    dg.font = '11px Georgia,serif'; dg.fillText('SINGER', 256, 147);
    var dec = new T.Mesh(new T.PlaneGeometry(.44, .22), new T.MeshBasicMaterial({ map: QP.texture(dC), transparent: true, side: T.DoubleSide }));
    dec.position.set(-.01, .13, .063); g.add(dec);
    /* balance wheel */
    var wheel = new T.Mesh(new T.TorusGeometry(.085, .015, 5, 18), M.iron);
    wheel.rotation.y = Math.PI / 2; wheel.position.set(-.24, .17, .04); g.add(wheel);
    for (var w = 0; w < 6; w++) {
      var sp = add(g, .009, .15, .009, M.brass, -.24, .17, .04, { rz: w * Math.PI / 6 });
    }
    /* throat plate, needle and presser foot */
    add(g, .13, .012, .12, M.brass, .18, .048, .06, {});
    cyl(g, .008, .008, .12, 6, M.brassLight, .18, .10, .09, {});
    add(g, .025, .018, .075, M.iron, .18, .045, .09, {});
    /* spool pin */
    cyl(g, .007, .007, .08, 6, M.brass, -.10, .38, .02, {});
    var spool = cyl(g, .027, .027, .045, 10, M.redSilk, -.10, .40, .02, {});
    /* thread */
    tube(g, [new T.Vector3(-.10,.42,.02), new T.Vector3(-.02,.45,.05), new T.Vector3(.12,.38,.06), new T.Vector3(.18,.10,.09)], .0022, QP.basic(0xe6dcc2), 12);
    /* treadle iron wheel under the table */
    var tw = new T.Mesh(new T.TorusGeometry(.21, .018, 6, 22), M.iron);
    tw.rotation.y = Math.PI / 2; tw.position.set(-.22, -.52, .04); g.add(tw);
    for (var tws = 0; tws < 8; tws++) {
      add(g, .009, .38, .009, M.iron, -.22, -.52, .04, { rz: tws * Math.PI / 8 });
    }
    var pedal = QP.group(g, .05, -.90, .02);
    add(pedal, .34, .025, .16, QP.std(0x31312d, { metalness: .6, roughness: .45 }), 0, 0, 0, {});
    for (var pp = 0; pp < 5; pp++) add(pedal, .28, .014, .014, M.iron, 0, .02, -.06 + pp * .03, {});
    tube(g, [new T.Vector3(-.22,-.31,.04), new T.Vector3(-.22,-.65,.1), new T.Vector3(.05,-.88,.04)], .012, M.iron, 10);
    return g;
  }
  function cuttingTable(parent, x, z) {
    var floor = .195;
    var g = QP.group(parent, x, floor, z);
    g.rotation.y = .06;
    add(g, 1.92, .10, .88, M.walnut, 0, .82, 0, { outline: true, thick: .0018 });
    add(g, 1.82, .022, .76, QP.toon(0x1e3b31), 0, .883, 0, {});
    add(g, 1.88, .035, .04, M.brassDark, 0, .867, .42, {});
    add(g, 1.88, .035, .04, M.brassDark, 0, .867, -.42, {});
    /* turned legs */
    for (var sx = -1; sx <= 1; sx += 2) {
      for (var sz = -1; sz <= 1; sz += 2) {
        var leg = QP.cyl(.055, .075, .82, 10, M.walnut, true, .0015);
        QP.put(g, leg, sx * .82, .41, sz * .32);
        var knuckle = QP.sphere(.08, 10, 7, M.walnut, false);
        knuckle.scale.y = .7; QP.put(g, knuckle, sx * .82, .59, sz * .32);
        var foot = QP.cyl(.10, .11, .05, 10, M.ebony, false);
        QP.put(g, foot, sx * .82, .025, sz * .32);
      }
    }
    /* cross brace */
    add(g, 1.55, .055, .055, M.walnut, 0, .28, 0, {});
    /* green work mat, patterns, scissors, tape */
    add(g, .92, .01, .65, QP.toon(0x25463a), -.18, .90, .03, {});
    var paperC = QP.canvas(512, 640), pg = paperC.getContext('2d');
    pg.fillStyle = 'rgba(226,210,177,.88)'; pg.fillRect(0, 0, 512, 640);
    pg.strokeStyle = 'rgba(103,75,54,.38)'; pg.lineWidth = 2;
    for (var p = 0; p < 11; p++) {
      pg.beginPath(); pg.moveTo(72, 70 + p * 40);
      pg.bezierCurveTo(200, 50 + p * 40, 280, 100 + p * 40, 422, 80 + p * 40); pg.stroke();
    }
    pg.strokeStyle = 'rgba(124,45,51,.55)';
    pg.beginPath(); pg.moveTo(180, 66); pg.bezierCurveTo(150, 200, 300, 300, 260, 552); pg.stroke();
    pg.beginPath(); pg.arc(425, 150, 42, 0, 6.3); pg.stroke();
    pg.font = '22px "PMingLiU",serif'; pg.fillStyle = 'rgba(104,73,49,.68)'; pg.textAlign = 'center';
    pg.fillText('綺羅 · 秋裳', 256, 590);
    var paper = new T.Mesh(new T.PlaneGeometry(.54, .68), new T.MeshBasicMaterial({ map: QP.texture(paperC), transparent: true, side: T.DoubleSide }));
    paper.rotation.x = -Math.PI / 2; paper.rotation.z = .3; paper.position.set(.23, .906, -.02); g.add(paper);
    /* silk bolt */
    var boltMat = dressMaterial(['#6b1628', 'rgba(224,194,135,.8)', 0xe5b3b3], 91);
    var bolt = new T.Mesh(QP.cylGeo(.09, .09, .52, 14, false), boltMat);
    bolt.rotation.z = Math.PI / 2; bolt.position.set(-.72, .98, -.28); g.add(bolt);
    makeScissors(g, .52, .918, .24, -.3);
    var tapeC = [];
    for (var ti = 0; ti < 10; ti++) tapeC.push(new T.Vector3(-.74 + ti * .11, .915 + Math.sin(ti) * .003, .18 + Math.sin(ti * 1.2) * .11));
    tube(g, tapeC, .006, QP.toon(0xe3bd57), 18);
    /* pincushion and pins */
    var pinc = QP.sphere(.075, 12, 8, M.redSilk, false);
    pinc.scale.y = .55; QP.put(g, pinc, .77, .94, -.18);
    for (var pin = 0; pin < 6; pin++) {
      var px = .77 + (Math.random() - .5) * .10, pz = -.18 + (Math.random() - .5) * .08;
      cyl(g, .0025, .0025, .12, 4, M.brassLight, px, .99, pz);
      var headp = QP.sphere(.009, 6, 5, M.cream, false);
      QP.put(g, headp, px, 1.055, pz);
    }
    makeSewingMachine(g, -.22, .90, -.06);
    shadowBlob(parent, 2.2, 1.1, x, .202, z, .32);
    return g;
  }

  /* ---------------- mirror ---------------- */
  function standingMirror(parent, x, y, z, ry) {
    var g = QP.group(parent, x, y, z); g.rotation.y = ry || 0;
    var frame = add(g, 1.12, 2.0, .10, M.walnutLight, 0, 1.10, 0, { outline: true, thick: .002 });
    add(g, 1.26, .11, .18, M.gold, 0, 2.14, .02, { outline: true, thick: .0015 });
    add(g, 1.18, .09, .16, M.gold, 0, .08, .06, {});
    var mirror = new T.Mesh(new T.PlaneGeometry(.96, 1.82), new T.MeshBasicMaterial({
      map: QP.Tex.mirror(), color: 0x9eaaa6, transparent: true, opacity: .88
    }));
    mirror.position.set(0, 1.11, .065); g.add(mirror);
    var shine = new T.Mesh(new T.PlaneGeometry(.9, 1.72), new T.MeshBasicMaterial({
      map: glowTex, color: 0xcbe0dd, transparent: true, opacity: .12,
      blending: T.AdditiveBlending, depthWrite: false
    }));
    shine.position.set(0, 1.11, .075); g.add(shine);
    for (var s = -1; s <= 1; s += 2) {
      add(g, .10, 2.13, .14, M.walnut, s * .57, 1.12, 0, {});
      var foot = new T.Mesh(new T.TorusGeometry(.20, .022, 5, 14, Math.PI), M.walnut);
      foot.position.set(s * .48, .12, .03); foot.rotation.z = s > 0 ? -.2 : Math.PI + .2; g.add(foot);
    }
    shadowBlob(parent, 1.15, .5, x, y + .006, z, .28);
    return g;
  }

  /* ---------------- pendant lamps ---------------- */
  function pendant(parent, x, z, y, shadeMat, color, glowColor, ceilY, floorY) {
    ceilY = ceilY === undefined ? 3.14 : ceilY;
    floorY = floorY === undefined ? .215 : floorY;
    var g = QP.group(parent, x, 0, z);
    cyl(g, .008, .008, ceilY - y, 5, M.iron, 0, (ceilY + y) / 2, 0, {});
    var cap = QP.cyl(.10, .15, .10, 12, M.brassDark, true, .0015);
    QP.put(g, cap, 0, y + .08, 0);
    var shade = new T.Mesh(new T.CylinderGeometry(.10, .24, .22, 16, 1, true), shadeMat);
    QP.put(g, shade, 0, y - .04, 0);
    var bulb = QP.sphere(.075, 10, 8, QP.basic(color || 0xffdca6), false);
    QP.put(g, bulb, 0, y - .12, 0);
    glow(g, glowColor || 0xffbf6e, .85, .46, 0, y - .10, 0);
    if (floorY > 0) lightPool(parent, glowColor || 0xffbf6e, 1.9, 1.9, .10, x, floorY, z, 0);
    return g;
  }

  /* ---------------- record shop dressing ---------------- */
  function recordCover(i) {
    var W = 256, H = 256, c = QP.canvas(W, H), g = c.getContext('2d'), r = QP.rng(700 + i);
    var palettes = [['#18342e','#d2ab5d','#e5d1a1'],['#6a1b2b','#d9b36c','#f2dfb6'],['#1e2d4d','#d8b97d','#becadf'],['#9c6c31','#3a2522','#efd39d'],['#582d55','#d4b26b','#e5c6dd'],['#cfb993','#492c28','#f8ebd0']];
    var p = palettes[i % palettes.length];
    g.fillStyle = p[0]; g.fillRect(0, 0, W, H);
    g.strokeStyle = p[1]; g.lineWidth = 3; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = p[1];
    if (i % 3 === 0) {
      for (var k = 0; k < 4; k++) { g.beginPath(); g.arc(W / 2, 108, 22 + k * 18, Math.PI, 0); g.stroke(); }
    } else if (i % 3 === 1) {
      g.beginPath(); g.moveTo(W / 2, 42); g.lineTo(W - 52, 172); g.lineTo(52, 172); g.closePath(); g.stroke();
      g.beginPath(); g.arc(W / 2, 128, 44, 0, 6.3); g.stroke();
    } else {
      g.beginPath(); g.arc(W / 2, 122, 62, 0, 6.3); g.stroke();
      g.beginPath(); g.moveTo(42, 36); g.lineTo(214, 208); g.stroke();
      g.beginPath(); g.moveTo(214, 36); g.lineTo(42, 208); g.stroke();
    }
    g.textAlign = 'center'; g.fillStyle = p[2]; g.font = '28px "PMingLiU",serif';
    g.fillText(['夜上海','玫瑰玫瑰','藍色多瑙河','天涯歌女','秋水伊人','四季歌'][i % 6], W / 2, 218);
    g.font = '10px Georgia,serif'; g.fillStyle = p[1];
    g.fillText('PAI TAI RECORDS · 78 RPM · SHANGHAI', W / 2, 239);
    return QP.texture(c);
  }
  function recordSleeve(parent, x, y, z, ry, i, scale) {
    scale = scale || 1;
    var s = .42 * scale;
    var m = new T.Mesh(new T.PlaneGeometry(s, s), QP.basic(0xffffff, { map: recordCover(i), side: T.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry || 0;
    parent.add(m);
    return m;
  }
  function recordPlayer(parent, x, y, z, scale) {
    var g = QP.group(parent, x, y, z);
    g.scale.setScalar(scale || 1);
    var cab = add(g, .66, .68, .52, M.walnut, 0, .34, 0, { outline: true, thick: .0018 });
    add(g, .60, .08, .48, M.walnutLight, 0, .72, 0, {});
    /* turntable platter */
    var platter = QP.cyl(.215, .215, .025, 24, M.brassDark, false);
    QP.put(g, platter, -.06, .78, 0);
    var disc = new T.Group(); disc.position.set(-.06, .81, 0); g.add(disc);
    var vinyl = QP.cyl(.19, .19, .014, 32, QP.std(0x0a0909, { roughness: .16, metalness: .38, envMapIntensity: 1.5 }), false);
    QP.put(disc, vinyl, 0, 0, 0);
    var label = QP.cyl(.065, .065, .016, 20, QP.toon(0xb28a42), false);
    QP.put(disc, label, 0, .009, 0);
    var hole = QP.cyl(.006, .006, .02, 8, QP.basic(0x0a0808), false);
    QP.put(disc, hole, 0, .015, 0);
    /* groove rings */
    for (var rr = .10; rr < .18; rr += .017) {
      var gr = new T.Mesh(new T.TorusGeometry(rr, .0011, 3, 24), QP.basic(0x4a4a43));
      gr.rotation.x = Math.PI / 2; gr.position.y = .008; disc.add(gr);
    }
    /* tonearm */
    var armBase = QP.cyl(.035, .04, .05, 10, M.brass, false);
    QP.put(g, armBase, .20, .78, -.12);
    var arm = new T.Mesh(new T.CylinderGeometry(.009, .009, .32, 6), M.brassLight);
    arm.position.set(.08, .84, -.08); arm.rotation.z = -.35; arm.rotation.x = -.4; g.add(arm);
    var head = add(g, .04, .022, .045, M.brassDark, -.055, .805, .015, {});
    QP.spinDiscs.push({ obj: disc, speed: .55 });
    QP.anim.discs.push({ obj: disc, speed: .55 });
    /* horn */
    var hornG = QP.group(g, .20, .84, -.02);
    var dir = new T.Vector3(.16, .45, .88).normalize();
    hornG.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    var hornPts = [
      new T.Vector2(.022, 0), new T.Vector2(.05, .035), new T.Vector2(.09, .12),
      new T.Vector2(.15, .23), new T.Vector2(.23, .35), new T.Vector2(.31, .45),
      new T.Vector2(.36, .52), new T.Vector2(.37, .56)
    ];
    var horn = new T.Mesh(new T.LatheGeometry(hornPts, 24), M.brass);
    horn.castShadow = true; hornG.add(horn);
    var lip = new T.Mesh(new T.TorusGeometry(.37, .018, 6, 28), M.brassLight);
    lip.rotation.x = Math.PI / 2; lip.position.y = .56; hornG.add(lip);
    var inner = new T.Mesh(new T.CylinderGeometry(.34, .05, .53, 24, 1, true), QP.std(0x5b3e1b, { metalness: .7, roughness: .4, side: T.BackSide }));
    inner.position.y = .29; hornG.add(inner);
    tube(g, [new T.Vector3(.1, .76, -.12), new T.Vector3(.15, .92, -.13), new T.Vector3(.2, .90, -.05)], .028, M.brassDark, 12);
    glow(g, 0xffc57c, .8, .16, .20, 1.25, .12);
    QP.gramophones = QP.gramophones || [];
    QP.gramophones.push(g);
    return g;
  }

  function makeSideTable(parent, x, y, z, scale) {
    var g = QP.group(parent, x, y, z);
    g.scale.setScalar(scale || 1);
    var top = QP.cyl(.32, .32, .055, 20, M.walnutLight, true, .0015);
    QP.put(g, top, 0, .54, 0);
    var under = QP.cyl(.27, .27, .04, 18, M.walnut, false);
    QP.put(g, under, 0, .49, 0);
    cyl(g, .055, .085, .44, 10, M.walnut, 0, .25, 0, {});
    var bowl = QP.sphere(.15, 12, 8, M.walnut, false);
    bowl.scale.y = .28; QP.put(g, bowl, 0, .08, 0);
    var ring = new T.Mesh(new T.TorusGeometry(.14, .018, 5, 16), M.brassDark);
    ring.rotation.x = Math.PI / 2; ring.position.y = .12; g.add(ring);
    shadowBlob(parent, .7, .7, x, y + .008, z, .25);
    return g;
  }

  function rotaryPhone(parent, x, y, z, ry, scale) {
    var g = QP.group(parent, x, y, z); g.rotation.y = ry || 0; g.scale.setScalar(scale || 1);
    var base = roundedCushion(.34, .25, .095, .06, M.blackLacquer);
    base.rotation.x = -Math.PI / 2; base.rotation.z = 0; base.position.y = .06; g.add(base);
    /* dial */
    var dialC = QP.canvas(512, 512), dg = dialC.getContext('2d');
    dg.fillStyle = '#d9cbaa'; dg.beginPath(); dg.arc(256,256,248,0,6.3); dg.fill();
    dg.fillStyle = '#1b1b19'; dg.beginPath(); dg.arc(256,256,206,0,6.3); dg.fill();
    dg.fillStyle = '#dfd1b1'; dg.textAlign = 'center'; dg.textBaseline = 'middle'; dg.font = '30px Georgia,serif';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI * .72 + i / 10 * Math.PI * 1.55;
      dg.fillText(String((i + 1) % 10), 256 + Math.cos(a) * 142, 256 + Math.sin(a) * 142);
    }
    dg.strokeStyle = '#b7a67f'; dg.lineWidth = 3;
    for (var h = 0; h < 10; h++) {
      var a2 = -Math.PI * .72 + h / 10 * Math.PI * 1.55;
      dg.beginPath(); dg.arc(256 + Math.cos(a2) * 196, 256 + Math.sin(a2) * 196, 11, 0, 6.3); dg.stroke();
    }
    var dial = new T.Mesh(new T.CircleGeometry(.095, 24), QP.basic(0xffffff, { map: QP.texture(dialC) }));
    dial.rotation.x = -Math.PI / 2 + .12; dial.position.set(0, .12, .03); g.add(dial);
    /* handset: curved bar with ear cups */
    var hc = QP.group(g, 0, .20, -.03);
    for (var s = -1; s <= 1; s += 2) {
      var cup = QP.sphere(.045, 10, 7, M.blackLacquer, false);
      cup.scale.set(.8, .58, 1.2); cup.position.set(s * .17, 0, 0); hc.add(cup);
    }
    var curve = new T.CatmullRomCurve3([
      new T.Vector3(-.17, 0, 0), new T.Vector3(-.09, .075, 0),
      new T.Vector3(.09, .075, 0), new T.Vector3(.17, 0, 0)
    ]);
    var handle = new T.Mesh(new T.TubeGeometry(curve, 18, .023, 6, false), M.blackLacquer); hc.add(handle);
    /* coiled cord looping back to the body */
    var cordPts = [];
    for (var co = 0; co <= 18; co++) {
      var a = co / 18 * Math.PI * 3.2;
      cordPts.push(new T.Vector3(.24 + Math.cos(a) * .055 + co * .002, .12 + co * .004, -.09 + Math.sin(a) * .045));
    }
    var cord = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cordPts), 28, .008, 4, false), M.blackLacquer);
    g.add(cord);
    return g;
  }

  function tiffanyLamp(parent, x, y, z, scale) {
    var g = QP.group(parent, x, y, z); g.scale.setScalar(scale || 1);
    var foot = QP.cyl(.10, .17, .045, 12, QP.brassDark, false); QP.put(g, foot, 0, .03, 0);
    cyl(g, .018, .032, .32, 8, M.brass, 0, .20, 0, {});
    var node = QP.sphere(.045, 8, 6, M.brassDark, false); QP.put(g, node, 0, .37, 0);
    var shadeTex = QP.Tex.tiffany();
    var shadeMat = new T.MeshBasicMaterial({ map: shadeTex, color: 0xffe4b4, side: T.DoubleSide });
    shadeMat.color.setRGB(1.18, 1.05, .86);
    var shade = new T.Mesh(new T.CylinderGeometry(.075, .30, .26, 20, 1, true), shadeMat);
    shade.position.y = .55; g.add(shade);
    var rim = new T.Mesh(new T.TorusGeometry(.30, .012, 5, 20), M.brassDark);
    rim.rotation.x = Math.PI / 2; rim.position.y = .42; rim.scale.z = .82; g.add(rim);
    for (var f = 0; f < 18; f++) {
      var a = f / 18 * Math.PI * 2;
      var bead = QP.sphere(.012, 5, 4, M.gold, false);
      QP.put(g, bead, Math.cos(a) * .29, .405, Math.sin(a) * .24);
    }
    var bulb = QP.sphere(.06, 10, 7, QP.basic(0xffd18a), false);
    QP.put(g, bulb, 0, .43, 0);
    glow(g, 0xffc978, 1.45, .46, 0, .46, 0);
    if (y < 4) lightPool(parent, 0xffb66b, 1.0, 1.0, .12, x, .215, z, 0);
    return g;
  }

  /* ---------------- sofa & upstairs furniture ---------------- */
  function velvetSofa(parent, x, y, z, ry) {
    var g = QP.group(parent, x, y, z); g.rotation.y = ry || 0;
    var w = 2.05, d = .80, seatH = .42;
    /* plinth */
    add(g, w - .11, .16, d - .12, M.walnut, 0, .12, 0, { outline: true, thick: .0018 });
    for (var f = -1; f <= 1; f += 2) {
      for (var b = -1; b <= 1; b += 2) {
        var leg = cyl(g, .035, .052, .16, 8, M.brassDark, f * (w / 2 - .10), .08, b * (d / 2 - .10), {});
      }
    }
    /* deep seat base */
    var base = roundedCushion(w, d, .18, .09, M.velvet);
    base.rotation.x = -Math.PI / 2; base.position.y = .28; g.add(base);
    /* seat cushions */
    for (var s = -1; s <= 1; s += 2) {
      var cushion = roundedCushion(w / 2 - .09, d - .16, .20, .08, M.velvet);
      cushion.rotation.x = -Math.PI / 2; cushion.position.set(s * (w / 4 - .02), .43, .02);
      g.add(cushion);
    }
    /* tufted back */
    var back = roundedCushion(w, 1.15, .14, .09, M.velvet);
    back.position.set(0, .84, -.36); back.rotation.x = -.07; g.add(back);
    for (var b2 = 0; b2 < 3; b2++) {
      for (var row = 0; row < 2; row++) {
        var btn = QP.sphere(.025, 8, 6, M.velvetGold, false);
        QP.put(g, btn, -.63 + b2 * .63 + (row % 2) * .2, .62 + row * .32, -.285);
      }
    }
    /* arms: rolled velvet */
    for (var a = -1; a <= 1; a += 2) {
      var armBase = roundedCushion(.22, .60, d, .10, M.velvet);
      armBase.position.set(a * (w / 2 - .03), .54, 0); g.add(armBase);
      var roll = new T.Mesh(new T.CylinderGeometry(.11, .11, d - .02, 16), M.velvet);
      roll.rotation.x = Math.PI / 2; roll.position.set(a * (w / 2 - .03), .84, 0); g.add(roll);
      var end = QP.sphere(.11, 12, 8, M.velvet, false);
      end.scale.set(1, 1, .32); QP.put(g, end, a * (w / 2 - .03), .84, d / 2 - .01);
    }
    /* gold fringe */
    for (var fr = 0; fr < 19; fr++) {
      var fx = -w / 2 + .04 + fr * (w - .08) / 18;
      cyl(g, .004, .006, .16, 4, M.brassDark, fx, .09, d / 2 - .04, {});
      var knob = QP.sphere(.018, 6, 5, M.brass, false);
      QP.put(g, knob, fx, .02, d / 2 - .04);
      var tass = QP.cyl(.014, .003, .09, 5, M.velvetGold, false);
      QP.put(g, tass, fx, .16, d / 2 - .04);
    }
    /* patterned throw pillows */
    var pillowMats = [];
    for (var pm = 0; pm < 2; pm++) {
      pillowMats.push(QP.physical(0xffffff, {
        map: QP.Tex.brocade(pm ? '#1b4f43' : '#9a6b2d', pm ? 'rgba(216,184,106,.9)' : 'rgba(79,39,33,.8)', 60 + pm),
        roughness: .42, sheen: .8, sheenColor: 0xf0d69c
      }));
    }
    for (var p = 0; p < 3; p++) {
      var pil = roundedCushion(.44, .40, .14, .08, pillowMats[p % 2]);
      pil.position.set(-.62 + p * .62, .73, -.18); pil.rotation.z = (p - 1) * .18; pil.rotation.x = -.2; g.add(pil);
    }
    /* tasseled tie on arm */
    for (var t = -1; t <= 1; t += 2) {
      var knot = QP.sphere(.03, 7, 5, M.velvetGold, false);
      QP.put(g, knot, t * (w / 2 - .02), .70, .18);
      cyl(g, .014, .004, .18, 5, M.velvetGold, t * (w / 2 - .02), .61, .18, {});
    }
    shadowBlob(parent, 2.5, 1.25, x, y + .007, z, .3);
    return g;
  }

  function coffeeTable(parent, x, y, z) {
    var g = QP.group(parent, x, y, z);
    add(g, 1.05, .08, .62, M.walnutLight, 0, .33, 0, { outline: true, thick: .0016 });
    add(g, .90, .018, .50, QP.toon(0x1e3b34), 0, .38, 0, {});
    for (var sx = -1; sx <= 1; sx += 2) for (var sz = -1; sz <= 1; sz += 2) {
      add(g, .045, .3, .045, M.walnut, sx * .43, .16, sz * .22, {});
    }
    add(g, .80, .035, .06, M.brassDark, 0, .40, 0, {});
    /* tea set */
    var pot = QP.sphere(.10, 12, 8, M.porcelain, false); pot.scale.y = .65; QP.put(g, pot, -.12, .43, 0);
    var lid = QP.sphere(.06, 10, 5, M.porcelain, false); lid.scale.y = .4; QP.put(g, lid, -.12, .48, 0);
    var spout = new T.Mesh(new T.CylinderGeometry(.011, .019, .13, 6), M.porcelain);
    spout.rotation.z = -1.0; spout.position.set(-.21, .44, 0); g.add(spout);
    for (var c = 0; c < 3; c++) {
      var cup = QP.cyl(.035, .03, .045, 10, M.porcelain, false);
      QP.put(g, cup, .24 + (c % 2) * .12, .405, -.11 + c * .10);
    }
    shadowBlob(parent, 1.2, .8, x, y + .006, z, .22);
    return g;
  }

  function makeBlinds(parent, x, y, z, w, h, ry) {
    var g = QP.group(parent, x, y, z); g.rotation.y = ry || 0;
    var slatMat = QP.toon(0xc4b08e);
    var n = Math.floor(h / .085);
    for (var i = 0; i < n; i++) {
      var slat = add(g, w, .018, .075, slatMat, 0, -i * .085 + h / 2, 0, { rx: .42 });
    }
    for (var s = -1; s <= 1; s += 2) add(g, .025, h, .015, QP.toon(0x6b5d47), s * w * .32, 0, -.02, {});
    add(g, w + .04, .10, .17, M.walnut, 0, h / 2 + .05, 0, {});
    return g;
  }

  function sheerCurtain(parent, x, y, z, w, h, opts) {
    opts = opts || {};
    var segX = 24, segY = 14;
    var geo = new T.PlaneGeometry(w, h, segX, segY);
    var pos = geo.attributes.position;
    var base = [];
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i), py = pos.getY(i), u = (px + w / 2) / w, v = (py + h / 2) / h;
      var fold = Math.sin(u * Math.PI * 9 + .4) * .035 + Math.sin(u * 19) * .010;
      pos.setZ(i, fold * (0.35 + v * .65));
      base.push({ x: px, y: py, z: pos.getZ(i), u: u, v: v });
    }
    geo.computeVertexNormals();
    var mat = new T.MeshPhysicalMaterial({
      color: opts.color === undefined ? 0xd8c09a : opts.color,
      roughness: .86, metalness: 0, transmission: 0,
      transparent: true, opacity: opts.opacity === undefined ? .20 : opts.opacity,
      side: T.DoubleSide, depthWrite: false,
      sheen: .8, sheenColor: 0xf0d09d, sheenRoughness: .7,
      emissive: 0x301b0e, emissiveIntensity: .10
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (opts.ry) mesh.rotation.y = opts.ry;
    mesh.renderOrder = 14;
    parent.add(mesh);
    QP.anim.curtains.push({ mesh: mesh, base: base, amp: opts.amp || .05, speed: opts.speed || .7, phase: opts.phase || 0 });
    return mesh;
  }

  function flowerStand(parent, x, y, z) {
    var g = QP.group(parent, x, y, z);
    /* wrought iron three-tier stand */
    for (var sx = -1; sx <= 1; sx += 2) for (var sz = -1; sz <= 1; sz += 2) {
      add(g, .026, 1.18, .026, M.iron, sx * .34, .59, sz * .20, {});
    }
    for (var tier = 0; tier < 3; tier++) {
      var yy = .18 + tier * .38;
      add(g, .75, .035, .47, M.walnut, 0, yy, 0, {});
      add(g, .70, .02, .04, M.brassDark, 0, yy - .055, .22, {});
      var potX = tier === 1 ? 0 : (tier === 0 ? -.16 : .10);
      var potZ = tier === 1 ? .04 : 0;
      var pot = QP.cyl(.15, .11, .20, 14, QP.std(0x6c3d2b, { roughness: .5 }), true, .0015);
      QP.put(g, pot, potX, yy + .12, potZ);
      var rim = new T.Mesh(new T.TorusGeometry(.15, .012, 4, 14), M.brassDark);
      rim.rotation.x = Math.PI / 2; rim.position.set(potX, yy + .22, potZ); g.add(rim);
      /* stems and leaves */
      var r = QP.rng(330 + tier);
      for (var st = 0; st < 5; st++) {
        var ang = r() * 6.28, len = .28 + r() * .36;
        var baseP = new T.Vector3(potX, yy + .18, potZ);
        var topP = new T.Vector3(potX + Math.cos(ang) * .20, yy + .22 + len, potZ + Math.sin(ang) * .16);
        tube(g, [baseP, new T.Vector3((baseP.x + topP.x) / 2, topP.y - .12, (baseP.z + topP.z) / 2), topP], .006, M.leaves, 8);
        for (var lf = 0; lf < 3; lf++) {
          var leaf = QP.sphere(.075, 7, 5, lf % 2 ? M.leaves : M.leaves2, false);
          leaf.scale.set(.35, 1.3, .12);
          leaf.position.set(topP.x + Math.cos(ang + lf) * .08, topP.y - .06 - lf * .07, topP.z + Math.sin(ang + lf) * .08);
          leaf.rotation.set(r() * .5, ang, -.4 + r() * .8);
          g.add(leaf);
        }
        if (tier !== 1 || st < 3) {
          var flower = QP.sphere(.04, 7, 6, tier === 2 ? M.flowerRose : M.flowerWhite, false);
          flower.scale.set(1.2, .6, 1.2);
          flower.position.copy(topP);
          g.add(flower);
          var center = QP.sphere(.012, 5, 4, M.gold, false);
          center.position.copy(topP).add(new T.Vector3(0, .018, 0)); g.add(center);
        }
      }
    }
    /* ivy cascading over edge */
    for (var iv = 0; iv < 8; iv++) {
      var ix = .22 + (iv % 3) * .08, iy = .45 + iv * .045, iz = .18 + (iv % 2) * .06;
      var leaf = QP.sphere(.06, 5, 4, M.leaves2, false);
      leaf.scale.set(.28, 1.3, .1); leaf.position.set(ix, iy - iv * .02, iz); leaf.rotation.z = .8; g.add(leaf);
    }
    shadowBlob(parent, .9, .5, x, y + .008, z, .22);
    return g;
  }

  function balconyGramophone(parent, x, y, z) {
    var g = QP.group(parent, x, y, z);
    /* small lacquer table */
    var tab = QP.cyl(.34, .37, .055, 16, M.walnutLight, true, .0015);
    QP.put(g, tab, 0, .52, 0);
    cyl(g, .055, .07, .46, 8, M.walnut, 0, .25, 0, {});
    var tripod = QP.sphere(.16, 8, 6, M.walnut, false);
    tripod.scale.y = .25; QP.put(g, tripod, 0, .07, 0);
    /* gramophone */
    var gr = QP.group(g, -.10, .56, 0);
    gr.rotation.y = -.35;
    var box = add(gr, .47, .30, .34, M.walnut, 0, .15, 0, { outline: true, thick: .0018 });
    add(gr, .42, .022, .30, M.gold, 0, .31, 0, {});
    var disc = new T.Group(); disc.position.y = .325; gr.add(disc);
    QP.put(disc, QP.cyl(.17, .17, .012, 24, QP.std(0x0a0909, { metalness: .4, roughness: .18 }), false), 0, 0, 0);
    var lab = QP.cyl(.055, .055, .014, 16, QP.toon(0xb18842), false); QP.put(disc, lab, 0, .008, 0);
    QP.anim.discs.push({ obj: disc, speed: .38 });
    var arm = new T.Mesh(new T.CylinderGeometry(.009, .009, .28, 6), M.brass);
    arm.position.set(.11, .38, -.03); arm.rotation.z = .4; arm.rotation.x = .5; gr.add(arm);
    /* flaring horn */
    var hornG = QP.group(gr, .16, .32, 0);
    var dir = new T.Vector3(0.96, 0.62, 0.20).normalize();
    hornG.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    var pts = [new T.Vector2(.025,0), new T.Vector2(.06,.06), new T.Vector2(.13,.18), new T.Vector2(.23,.30), new T.Vector2(.35,.40), new T.Vector2(.43,.46)];
    var horn = new T.Mesh(new T.LatheGeometry(pts, 22), M.brass);
    hornG.add(horn);
    var lip = new T.Mesh(new T.TorusGeometry(.43, .018, 5, 24), M.brassLight);
    lip.rotation.x = Math.PI / 2; lip.position.y = .46; hornG.add(lip);
    var inner = new T.Mesh(new T.CylinderGeometry(.4, .05, .45, 20, 1, true), QP.std(0x573c1b, { metalness: .7, roughness: .38, side: T.BackSide }));
    inner.position.y = .23; hornG.add(inner);
    tube(g, [new T.Vector3(-.0,.88,.1), new T.Vector3(.08,.96,.22), new T.Vector3(.22,1.06,.28)], .03, M.brassDark, 10);
    glow(g, 0xffc078, 1.4, .27, .12, 1.15, .22);
    QP.anim.gramoBalcony = g;
    return g;
  }

  /* =========================================================
     BUILD ROOM SHELLS (called by building)
     ========================================================= */
  QP.buildRoomShells = function (parent, MAT) {
    var g = QP.group(parent, 0, 0, 0);
    var woodFloor = QP.std(0xffffff, {
      map: QP.cloneTex(QP.Tex.woodFloor(), 2.0, 2.4), roughness: 0.42,
      metalness: 0.03, envMapIntensity: 0.5
    });
    var wallMat = QP.toon(0xffffff, { map: QP.cloneTex(QP.Tex.wallpaper(), 2.2, 1.4), rim: 0.03 });
    function addShell(pp, w, h, d, mat, x, y, z, o) {
      o = o || {};
      var m = QP.box(w, h, d, mat, o.outline === undefined ? false : o.outline, o.thick);
      QP.put(pp, m, x, y, z, o.ry, o.rx, o.rz);
      if (o.cast) m.castShadow = true;
      if (o.receive !== false) m.receiveShadow = true;
      return m;
    }
    /* tailor floor / ceiling / back wall */
    var T0 = { x0: -5.55, x1: -1.82, z0: -3.55, z1: .61 };
    var tf = new T.Mesh(new T.PlaneGeometry(T0.x1 - T0.x0, T0.z1 - T0.z0), woodFloor);
    tf.rotation.x = -Math.PI / 2; tf.position.set((T0.x0 + T0.x1) / 2, .195, (T0.z0 + T0.z1) / 2); tf.receiveShadow = true; g.add(tf);
    var tc = new T.Mesh(new T.PlaneGeometry(T0.x1 - T0.x0, T0.z1 - T0.z0), QP.toon(0x31231b));
    tc.rotation.x = Math.PI / 2; tc.position.set((T0.x0 + T0.x1) / 2, 3.18, (T0.z0 + T0.z1) / 2); g.add(tc);
    var tw = new T.Mesh(new T.PlaneGeometry(T0.z1 - T0.z0, 3.0), wallMat);
    tw.rotation.y = Math.PI / 2; tw.position.set(T0.x0 + .03, 1.7, (T0.z0 + T0.z1) / 2); g.add(tw);
    var back = new T.Mesh(new T.PlaneGeometry(T0.x1 - T0.x0, 3.0), QP.toon(0x2f1c15, { rim: .035, rimColor: 0x8b5a3f }));
    back.position.set((T0.x0 + T0.x1) / 2, 1.71, T0.z0 + .03); g.add(back);
    addShell(parent, T0.x1 - T0.x0, .78, .08, QP.toon(0x3e2418), (T0.x0 + T0.x1) / 2, .57, T0.z0 + .06, {});
    for (var i = 0; i < 8; i++) addShell(parent, .024, 2.5, .02, MAT.brassDark, T0.x0 + .38 + i * .46, 1.75, T0.z0 + .08, {});
    glow(g, 0xffbd73, 2.2, .22, -3.55, 2.3, -2.9);

    var tailLight = new T.PointLight(0xffa65d, 5.8, 6.4, 2);
    tailLight.position.set(-3.65, 2.55, -1.1); g.add(tailLight);
    var tailBack = new T.PointLight(0xff9d55, 2.7, 4.2, 2);
    tailBack.position.set(-3.8, 2.25, -2.8); g.add(tailBack);
    QP.interiorLights = QP.interiorLights || [];
    QP.interiorLights.push(tailLight, tailBack);

    /* record room floor / walls */
    var R0 = { x0: -1.82, x1: 1.30, z0: -4.12, z1: .61 };
    var rf = new T.Mesh(new T.PlaneGeometry(R0.x1 - R0.x0, R0.z1 - R0.z0), woodFloor);
    rf.rotation.x = -Math.PI / 2; rf.position.set((R0.x0 + R0.x1) / 2, .195, (R0.z0 + R0.z1) / 2); g.add(rf);
    var rc = new T.Mesh(new T.PlaneGeometry(R0.x1 - R0.x0, R0.z1 - R0.z0), QP.toon(0x172820));
    rc.rotation.x = Math.PI / 2; rc.position.set((R0.x0 + R0.x1) / 2, 3.17, (R0.z0 + R0.z1) / 2); g.add(rc);
    var recBack = new T.Mesh(new T.PlaneGeometry(R0.x1 - R0.x0, 3.05), QP.toon(0x1a2b23, { rim: .05, rimColor: 0x3c7d68 }));
    recBack.position.set((R0.x0 + R0.x1) / 2, 1.72, R0.z0 + .03); g.add(recBack);
    var recWest = new T.Mesh(new T.PlaneGeometry(R0.z1 - R0.z0, 3.05), QP.toon(0x23342c));
    recWest.rotation.y = Math.PI / 2; recWest.position.set(R0.x0 + .03, 1.72, (R0.z0 + R0.z1) / 2); g.add(recWest);
    addShell(parent, .10, .90, R0.z1 - R0.z0, QP.toon(0x2a1b13), R0.x0 + .07, .60, (R0.z0 + R0.z1) / 2, {});
    var recLight = new T.PointLight(0xff9f52, 4.8, 5.8, 2);
    recLight.position.set(.15, 2.55, -1.6); g.add(recLight);
    var recLight2 = new T.PointLight(0xffc98d, 2.1, 4.0, 2);
    recLight2.position.set(.45, 2.0, .1); g.add(recLight2);
    QP.interiorLights.push(recLight, recLight2);

    /* upstairs floor / walls */
    var U0 = { x0: -5.28, x1: 1.16, z0: -4.35, z1: .58 };
    var uf = new T.Mesh(new T.PlaneGeometry(U0.x1 - U0.x0, U0.z1 - U0.z0), woodFloor);
    uf.rotation.x = -Math.PI / 2; uf.position.set((U0.x0 + U0.x1) / 2, 3.79, (U0.z0 + U0.z1) / 2); uf.receiveShadow = true; g.add(uf);
    var uc = new T.Mesh(new T.PlaneGeometry(U0.x1 - U0.x0, U0.z1 - U0.z0), QP.toon(0x30221b));
    uc.rotation.x = Math.PI / 2; uc.position.set((U0.x0 + U0.x1) / 2, 7.16, (U0.z0 + U0.z1) / 2); g.add(uc);
    var UR = new T.Mesh(new T.PlaneGeometry(U0.x1 - U0.x0, 3.32), QP.toon(0xffffff, { map: QP.cloneTex(QP.Tex.wallpaper(), 2.8, 1.3), rim: .035 }));
    UR.position.set((U0.x0 + U0.x1) / 2, 5.44, U0.z0 + .04); g.add(UR);
    var UW = new T.Mesh(new T.PlaneGeometry(U0.z1 - U0.z0, 3.32), QP.toon(0xffffff, { map: QP.cloneTex(QP.Tex.wallpaper(), 1.8, 1.3) }));
    UW.rotation.y = Math.PI / 2; UW.position.set(U0.x0 + .04, 5.44, (U0.z0 + U0.z1) / 2); g.add(UW);
    addShell(parent, U0.x1 - U0.x0, .18, .16, QP.toon(0x332217), (U0.x0 + U0.x1) / 2, 3.86, U0.z0 + .20, {});
    addShell(parent, U0.x1 - U0.x0, .10, .20, MAT.brassDark, (U0.x0 + U0.x1) / 2, 6.97, U0.z0 + .16, {});
    addShell(parent, .16, .10, U0.z1 - U0.z0, MAT.brassDark, U0.x0 + .12, 6.97, (U0.z0 + U0.z1) / 2, {});
    var upLight = new T.PointLight(0xffad66, 5.8, 7.0, 2);
    upLight.position.set(-2.4, 6.0, -1.45); g.add(upLight);
    var upLight2 = new T.PointLight(0xffc98d, 2.8, 4.8, 2);
    upLight2.position.set(-.35, 5.25, -1.6); g.add(upLight2);
    QP.interiorLights.push(upLight, upLight2);
    /* little warm fill for the rooms */
    var fill = new T.PointLight(0xffa563, 1.3, 8, 2);
    fill.position.set(-2.7, 6.7, .9); g.add(fill);
    QP.interiorLights.push(fill);
    return g;
  };

  /* =========================================================
     BUILD INTERIOR CONTENT
     ========================================================= */
  QP.buildInterior = function (world) {
    var g = QP.group(world, 0, 0, 0);
    g.name = 'interiors';
    QP.interiorGroup = g;
    QP.spinDiscs = QP.spinDiscs || [];

    /* ============ tailor shop ============ */
    var t = QP.group(g, 0, 0, 0);
    /* window stage */
    var stageMat = QP.toon(0x2b1a12);
    add(t, 1.34, .16, .86, stageMat, -4.77, .29, -.06, { outline: true, thick: .0016 });
    add(t, 1.16, .16, .82, stageMat, -2.40, .29, -.06, { outline: true, thick: .0016 });
    add(t, 1.31, .02, .83, QP.toon(0x4a2f1e), -4.77, .375, -.06, {});
    add(t, 1.13, .02, .79, QP.toon(0x4a2f1e), -2.40, .375, -.06, {});
    for (var st = 0; st < 6; st++) {
      var strip = new T.Mesh(new T.PlaneGeometry(.06, .015), QP.basic(0xffb363));
      strip.position.set(-4.77 + (st - 2.5) * .18, .382, .28); t.add(strip);
    }
    var jade = dressMaterial(['#0d4a3d', 'rgba(221,190,112,.9)', 0xb5dec7], 101);
    var claret = dressMaterial(['#5a1424', 'rgba(236,209,156,.85)', 0xe7b7ba], 111);
    var ivory = dressMaterial(['#b9a982', 'rgba(54,78,101,.82)', 0xe7dfc9], 121);
    makeMannequin(t, -4.78, .39, -.10, { mat: jade, label: '錦繡', ry: .12, collarMat: QP.toon(0x092f28) });
    makeMannequin(t, -2.38, .39, -.10, { mat: ivory, label: '月白', ry: -.14, collarMat: QP.toon(0x75765f) });
    makeMannequin(t, -4.10, .39, -.68, { mat: claret, label: '紅塵', ry: -.32, collarMat: QP.toon(0x360b13) });
    lightPool(t, 0xffc57b, 1.5, 1.4, .16, -4.65, .39, -.1, 0);
    lightPool(t, 0xffbb6f, 1.2, 1.1, .13, -2.42, .39, -.1, 0);
    /* rug */
    var rugMat = QP.std(0xffffff, { map: QP.Tex.rug(), roughness: .9, metalness: 0 });
    var rug = new T.Mesh(new T.PlaneGeometry(2.8, 2.0), rugMat);
    rug.rotation.x = -Math.PI / 2; rug.rotation.z = .04; rug.position.set(-3.65, .208, -1.45); t.add(rug);
    add(t, 2.95, .018, .06, QP.toon(0x7f5828), -3.65, .21, -.42, {});
    add(t, 2.95, .018, .06, QP.toon(0x7f5828), -3.65, .21, -2.48, {});
    fabricWall(t);
    cuttingTable(t, -4.02, -1.58);
    standingMirror(t, -2.1, .2, -2.34, -.65);
    /* pendants */
    pendant(t, -4.62, -.85, 2.38, M.greenGlass, 0xffd19b, 0xffb766);
    pendant(t, -2.62, -1.75, 2.38, M.greenGlass, 0xffd19b, 0xffb766);
    /* tailor wall art: calligraphy panel */
    var calC = QP.canvas(512, 1024), cg = calC.getContext('2d');
    cg.clearRect(0, 0, 512, 1024);
    cg.fillStyle = 'rgba(27,20,15,.42)'; cg.fillRect(0, 0, 512, 1024);
    cg.strokeStyle = 'rgba(204,172,112,.5)'; cg.lineWidth = 4; cg.strokeRect(25, 25, 462, 974);
    cg.fillStyle = 'rgba(223,195,139,.72)'; cg.textAlign = 'center'; cg.font = '110px "PMingLiU",serif';
    var call = ['天','衣','無','縫'];
    for (var ci = 0; ci < 4; ci++) cg.fillText(call[ci], 256, 210 + ci * 180);
    cg.font = '19px Georgia,serif'; cg.fillStyle = 'rgba(208,179,116,.44)';
    cg.fillText('THE ART OF QIPAO', 256, 930);
    var cal = new T.Mesh(new T.PlaneGeometry(.72, 1.44), QP.basic(0xffffff, { map: QP.texture(calC), transparent: true, opacity: .85 }));
    cal.position.set(-5.50, 1.88, -2.45); cal.rotation.y = Math.PI / 2; t.add(cal);

    /* ============ record shop ============ */
    var rec = QP.group(g, 0, 0, 0);
    var recWallMat = QP.basic(0xffffff, { map: QP.Tex.recordWall() });
    var backWall = new T.Mesh(new T.PlaneGeometry(2.94, 2.2), recWallMat);
    backWall.position.set(-.26, 1.58, -4.06); rec.add(backWall);
    add(rec, 3.10, .12, .12, M.walnut, -.26, 2.72, -4.08, { outline: true, thick: .0018 });
    add(rec, 3.10, .10, .10, M.walnut, -.26, .44, -4.08, {});
    add(rec, .10, 2.35, .10, M.walnut, -1.76, 1.58, -4.08, {});
    add(rec, .10, 2.35, .10, M.walnut, 1.24, 1.58, -4.08, {});
    var sideWall = new T.Mesh(new T.PlaneGeometry(2.55, 2.2), recWallMat);
    sideWall.rotation.y = Math.PI / 2; sideWall.position.set(-1.79, 1.58, -2.5); rec.add(sideWall);
    add(rec, .08, .12, 2.64, M.walnut, -1.79, 2.72, -2.5, {});
    /* physical sleeves in a bin */
    for (var rs = 0; rs < 9; rs++) {
      var ry = -.32 + (rs % 3) * .14;
      var m = recordSleeve(rec, -.78 + (rs % 3) * .28, .53 + (rs % 2) * .03, -3.30 + Math.floor(rs / 3) * .18, ry, rs, 1.0);
      m.rotation.x = -.42;
    }
    add(rec, 1.02, .36, .56, M.walnut, -.45, .27, -3.12, { outline: true, thick: .002 });
    add(rec, .94, .10, .48, M.walnut, -.45, .48, -3.12, {});
    for (var rb = 0; rb < 8; rb++) {
      var sl = .35;
      var slv = new T.Mesh(new T.PlaneGeometry(sl, sl), QP.basic(0xffffff, { map: recordCover(rb + 3), side: T.DoubleSide }));
      slv.position.set(-.83 + (rb % 4) * .14, .62 + (rb % 2) * .015, -3.38 + Math.floor(rb / 4) * .12);
      slv.rotation.y = -.36; slv.rotation.x = -.18; rec.add(slv);
    }
    var shopGramo = recordPlayer(rec, -.34, .2, -.03, 1.10);
    shopGramo.rotation.y = .52;
    /* counter + till */
    var counter = QP.group(rec, -.95, .2, -2.36);
    add(counter, 1.35, .92, .58, M.walnut, 0, .46, 0, { outline: true, thick: .0018 });
    add(counter, 1.46, .07, .68, M.walnutLight, 0, .95, 0, {});
    add(counter, 1.30, .035, .52, QP.toon(0x314236), 0, .99, 0, {});
    add(counter, 1.33, .35, .03, QP.toon(0x1b2a23), 0, .72, .30, {});
    for (var ck = 0; ck < 7; ck++) {
      var key = QP.cyl(.018, .018, .012, 8, M.brass, false);
      QP.put(counter, key, -.45 + (ck % 4) * .16, 1.01, .1 + Math.floor(ck / 4) * .12);
    }
    add(counter, .24, .10, .18, M.blackLacquer, .44, 1.05, -.08, {});
    add(counter, .18, .02, .12, M.brass, .44, 1.11, -.08, {});
    var lampSmall = QP.cyl(.10, .14, .16, 10, M.brassDark, true, .0015); QP.put(counter, lampSmall, -.38, 1.20, -.09);
    var lampBulb = QP.cyl(.095, .11, .05, 10, QP.basic(0xffca7c), false); QP.put(counter, lampBulb, -.38, 1.13, -.09);
    glow(counter, 0xffba6d, .85, .32, -.38, 1.12, -.09);
    /* chair */
    var chair = QP.group(rec, -1.2, .2, -1.55);
    add(chair, .55, .10, .50, M.velvetJade, 0, .47, 0, { outline: true, thick: .0015 });
    var cback = roundedCushion(.56, .58, .15, .08, M.velvetJade);
    cback.position.set(0, .78, -.26); cback.rotation.x = -.16; chair.add(cback);
    for (var ca = -1; ca <= 1; ca += 2) {
      var carm = roundedCushion(.12, .30, .5, .05, M.velvetJade);
      carm.position.set(ca * .29, .57, 0); chair.add(carm);
    }
    for (var cl = -1; cl <= 1; cl += 2) for (var c2 = -1; c2 <= 1; c2 += 2) {
      add(chair, .04, .46, .04, M.walnut, cl * .23, .23, c2 * .20, {});
    }
    /* green pendant lamps */
    pendant(rec, -.9, -1.55, 2.55, M.greenGlass, 0xffd19b, 0xffb35c);
    pendant(rec, .45, -2.35, 2.58, M.greenGlass, 0xffd19b, 0xffb35c);
    /* small interior neon */
    var nC = QP.canvas(384, 512), ng = nC.getContext('2d');
    ng.clearRect(0, 0, 384, 512); ng.textAlign = 'center'; ng.font = '700 96px "PMingLiU",serif';
    ng.shadowColor = '#4be6d5'; ng.shadowBlur = 18; ng.fillStyle = '#d8fff7';
    ng.fillText('留', 192, 205); ng.fillText('聲', 192, 330);
    ng.shadowBlur = 0; ng.strokeStyle = 'rgba(70,208,190,.7)'; ng.lineWidth = 4; ng.strokeRect(60, 80, 264, 340);
    var insideNeon = new T.Mesh(new T.PlaneGeometry(.52, .69), QP.basic(0xffffff, { map: QP.texture(nC), transparent: true }));
    insideNeon.position.set(-1.80, 1.82, -1.85); insideNeon.rotation.y = Math.PI / 2; rec.add(insideNeon);
    glow(rec, 0x52e3d1, 1.1, .2, -1.76, 1.82, -1.85);
    lightPool(rec, 0xffb25c, 2.0, 2.2, .11, -.3, .215, -1.8, .2);

    /* ============ upstairs salon ============ */
    var up = QP.group(g, 0, 0, 0);
    var rugU = new T.Mesh(new T.PlaneGeometry(3.6, 2.5), new T.MeshBasicMaterial({ map: QP.Tex.rug(), color: 0xcabda5 }));
    rugU.rotation.x = -Math.PI / 2; rugU.position.set(-2.55, 3.805, -1.6); up.add(rugU);
    velvetSofa(up, -2.55, 3.81, -1.58, 0);
    makeSideTable(up, -2.86, 3.81, -.33, .95);
    makeSideTable(up, -1.70, 3.81, -.34, .84);
    tiffanyLamp(up, -2.86, 4.32, -.33, 1.62);
    var tiffLight = new T.PointLight(0xffb46f, 2.3, 3.4, 2);
    tiffLight.position.set(-2.86, 4.98, -.33); up.add(tiffLight);
    rotaryPhone(up, -1.70, 4.25, -.34, .65, 1.42);
    /* little brass reading lamp beside the telephone */
    var readBase = QP.cyl(.065, .09, .035, 10, M.brassDark, false);
    QP.put(up, readBase, -1.90, 4.24, -.48);
    cyl(up, .01, .014, .24, 6, M.brass, -1.90, 4.38, -.48, {});
    var readShade = QP.cyl(.05, .13, .13, 12, QP.toon(0x2f4f43), true, .0012);
    QP.put(up, readShade, -1.90, 4.50, -.48);
    var readBulb = QP.sphere(.05, 8, 6, QP.basic(0xffd294), false);
    QP.put(up, readBulb, -1.90, 4.46, -.48);
    glow(up, 0xffb767, .8, .30, -1.90, 4.45, -.48);
    /* gramophone cabinet in far corner */
    recordPlayer(up, -.45, 3.81, -2.95, .82);
    /* framed art */
    var artC = QP.canvas(768, 512), ag = artC.getContext('2d');
    var agrd = ag.createLinearGradient(0, 0, 768, 512);
    agrd.addColorStop(0, '#b69b76'); agrd.addColorStop(.5, '#574938'); agrd.addColorStop(1, '#202d2b');
    ag.fillStyle = agrd; ag.fillRect(0, 0, 768, 512);
    ag.fillStyle = 'rgba(222,206,170,.6)';
    ag.beginPath(); ag.arc(550, 145, 74, 0, 6.3); ag.fill();
    ag.fillStyle = 'rgba(35,52,45,.8)';
    ag.beginPath(); ag.moveTo(0, 390); ag.bezierCurveTo(180, 260, 380, 360, 768, 220); ag.lineTo(768, 512); ag.lineTo(0, 512); ag.fill();
    ag.fillStyle = 'rgba(23,35,31,.7)';
    ag.beginPath(); ag.moveTo(0, 430); ag.bezierCurveTo(220, 310, 420, 380, 768, 300); ag.lineTo(768, 512); ag.lineTo(0, 512); ag.fill();
    ag.strokeStyle = 'rgba(236,218,181,.32)'; ag.lineWidth = 2;
    for (var artLine = 0; artLine < 5; artLine++) { ag.beginPath(); ag.moveTo(70, 100 + artLine * 25); ag.lineTo(300, 85 + artLine * 25); ag.stroke(); }
    var art = new T.Mesh(new T.PlaneGeometry(1.55, 1.03), QP.basic(0xffffff, { map: QP.texture(artC) }));
    art.position.set(-2.72, 5.98, -4.30); up.add(art);
    add(up, 1.72, .08, .09, M.gold, -2.72, 6.50, -4.27, {});
    add(up, 1.72, .08, .09, M.gold, -2.72, 5.47, -4.27, {});
    add(up, .08, 1.1, .09, M.gold, -3.55, 5.98, -4.27, {});
    add(up, .08, 1.1, .09, M.gold, -1.89, 5.98, -4.27, {});
    /* console with flowers */
    add(up, 1.35, .12, .43, M.walnutLight, .5, 4.70, -4.20, { outline: true, thick: .0015 });
    for (var cf = -1; cf <= 1; cf += 2) add(up, .06, .78, .06, M.walnut, .5 + cf * .55, 4.31, -4.20, {});
    var vase = QP.cyl(.11, .15, .34, 12, M.porcelain, true, .0015);
    QP.put(up, vase, .5, 4.92, -4.2);
    /* plant */
    var pl = QP.group(up, .78, 3.82, -.31);
    var plpot = QP.cyl(.18, .13, .28, 14, QP.std(0x6b3c2b, { roughness: .5 }), true, .0015); QP.put(pl, plpot, 0, .14, 0);
    for (var ps = 0; ps < 12; ps++) {
      var ang = ps * 2.3, lf = QP.sphere(.095, 6, 4, ps % 2 ? M.leaves : M.leaves2, false);
      lf.scale.set(.3, 1.5, .1);
      lf.position.set(Math.cos(ang) * .13, .46 + (ps % 4) * .10, Math.sin(ang) * .13);
      lf.rotation.set(.4, ang, -.5 + (ps % 3) * .3); pl.add(lf);
    }
    shadowBlob(up, .8, .55, .78, 3.815, -.31, .25);
    /* window dressing */
    var blind = makeBlinds(up, -2.47, 6.38, .48, 1.83, .82, 0);
    var blind2 = makeBlinds(EastUpperInterior(), 0, 0, 0, 1.2, .8, 0);
    function EastUpperInterior() {
      var eg = QP.group(up, 1.03, 5.92, -2.0); eg.rotation.y = Math.PI / 2; return eg;
    }
    /* curtains at the balcony threshold */
    sheerCurtain(up, -3.28, 5.37, .78, .36, 2.94, { opacity: .12, amp: .045, speed: .7, phase: .4, ry: 0 });
    sheerCurtain(up, -1.67, 5.37, .78, .36, 2.94, { opacity: .11, amp: .05, speed: .8, phase: 2.0, ry: 0 });
    /* curtain rod */
    var rod = QP.cyl(.022, .022, 2.0, 6, M.brassDark, -2.47, 6.83, .78, { rz: Math.PI / 2 });
    var fin1 = QP.sphere(.06, 8, 6, M.brass, false); QP.put(up, fin1, -3.5, 6.83, .78);
    var fin2 = QP.sphere(.06, 8, 6, M.brass, false); QP.put(up, fin2, -1.44, 6.83, .78);
    /* silk tiebacks */
    for (var tb = 0; tb < 2; tb++) {
      var side = tb ? -1 : 1;
      var tie = QP.sphere(.04, 8, 6, M.velvetGold, false);
      QP.put(up, tie, -2.47 + side * .57, 5.24, .82);
    }
    /* wall sconces and chandelier */
    pendant(up, -2.55, -1.7, 6.58, M.greenGlass, 0xffd3a0, 0xffbd78, 7.14, 3.815);
    var sl = QP.group(up, -4.95, 5.4, -3.4);
    /* candle sconce */
    add(sl, .06, .35, .12, M.brassDark, 0, 0, 0, {});
    var armC = new T.Mesh(new T.CylinderGeometry(.018, .018, .3, 6), M.brass);
    armC.rotation.z = -.6; armC.position.set(.12, .1, .04); sl.add(armC);
    var cup = QP.cyl(.065, .04, .06, 10, M.brass, false); QP.put(sl, cup, .25, .25, .04);
    var fl = QP.sphere(.035, 6, 5, QP.basic(0xffd9a0), false); QP.put(sl, fl, .25, .29, .04);
    glow(up, 0xffb56b, .7, .25, -4.95, 5.7, -3.38);

    /* ============ balcony ============ */
    var bal = QP.group(g, 0, 0, 0);
    /* 阳台上原本放着一台带大喇叭的留声机（balconyGramophone）。
       问题：喇叭口径约 0.86，而阳台进深只有 0.8 出头，整台机器从 z=0.73 一直伸到 1.72，
       等于把窗洞和栏杆全占了，从外面看就是"一台留声机卡在二楼窗台上"，不符合实景。
       留声机保留在一楼唱片行里（见上面那台），阳台只留花架与石瓮盆栽。
       函数定义仍然留着，想恢复直接取消下面这行注释即可。 */
    // balconyGramophone(bal, -0.18, 3.83, 1.07);
    flowerStand(bal, -4.55, 3.83, 1.13);
    /* potted sprays on the stone urns */
    function urnPlant(x) {
      var pg = QP.group(bal, x, 3.9, 1.42);
      for (var i = 0; i < 12; i++) {
        var a = i * 2.1, len = .3 + (i % 4) * .11;
        var lf = QP.sphere(.08, 6, 4, i % 2 ? M.leaves : M.leaves2, false);
        lf.scale.set(.35, 1.4, .12);
        lf.position.set(Math.cos(a) * .12, .26 + len * .4, Math.sin(a) * .1);
        lf.rotation.set(.4, a, -.3 + (i % 3) * .25); pg.add(lf);
        if (i % 4 === 0) {
          var flw = QP.sphere(.042, 6, 5, i % 8 ? M.flowerRose : M.flowerWhite, false);
          flw.scale.set(1.2, .55, 1.2); flw.position.set(Math.cos(a) * .17, .48 + (i % 3) * .07, Math.sin(a) * .13); pg.add(flw);
        }
      }
    }
    urnPlant(-5.23); urnPlant(.18);
    /* a small brass birdcage-like lantern? keep the composition quiet */
    /* exterior scented jasmine pot near record door */
    add(bal, .46, .06, .05, M.brassDark, -2.67, 4.33, 1.1, {});
    glow(bal, 0xffbd75, 1.2, .13, -2.5, 4.4, 1.0);

    /* indoor neon sign reflected on ceiling maybe */
    glow(up, 0xffc074, 2.0, .09, -2.6, 6.9, -1.0);

    /* update stats */
    QP.triCount = 0;
    g.traverse(function (o) {
      if (o.isMesh && o.geometry && o.geometry.attributes.position) {
        QP.triCount += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      }
    });
    return g;
  };
})();
