/* =========================================================================
   ASHTRAY MAZE — architecture, maze machinery, gantry, security, industry
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  var AM = window.AM;
  var M, TEX, L;
  var root;
  AM.fixtures = AM.fixtures || [];
  AM.movingWalls = AM.movingWalls || [];
  AM.steamVents = AM.steamVents || [];
  AM.suspended = AM.suspended || [];
  AM.beacons = AM.beacons || [];
  AM.glitchBits = AM.glitchBits || [];

  function shadow(g, cast, receive) {
    g.traverse(function (o) {
      if (o.isMesh && !o.userData.isOutline) {
        o.castShadow = cast !== false;
        o.receiveShadow = receive !== false;
      }
    });
    return g;
  }
  function noOutlineShadow(g) {
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return g;
  }
  function strut(a, b, r, mat, segs) {
    var d = new T.Vector3().subVectors(b, a);
    var len = d.length();
    var m = AM.cyl(r, r, len, segs || 6, mat, false);
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    m.castShadow = true;
    return m;
  }
  function cable(points, r, mat, segs) {
    var m = AM.tube(points, r || .012, mat || M.cable, segs || 24, 5);
    noOutlineShadow(m);
    return m;
  }
  function rig(g, cast, receive) { shadow(g, cast, receive); return g; }

  function addDecal(parent, tex, w, h, x, y, z, face, opacity) {
    var d = AM.decal(w, h, tex, { opacity: opacity === undefined ? 1 : opacity, fog: false });
    d.position.set(x, y, z);
    if (face === 'back') d.rotation.y = Math.PI;
    else if (face === 'right') d.rotation.y = Math.PI * .5;
    else if (face === 'left') d.rotation.y = -Math.PI * .5;
    else if (face === 'up') { d.rotation.x = -Math.PI * .5; }
    parent.add(d);
    return d;
  }

  function signPlate(parent, tex, w, h, x, y, z, ry, opts) {
    opts = opts || {};
    var g = new T.Group();
    g.position.set(x, y, z);
    if (ry) g.rotation.y = ry;
    var back = AM.box(w, h, opts.depth || .035, opts.frameMat || M.steelDark, true, .0016);
    back.castShadow = true;
    g.add(back);
    var f = AM.decal(w - .025, h - .025, tex, { fog: false });
    f.position.z = (opts.depth || .035) * .5 + .002;
    g.add(f);
    if (opts.frame !== false) {
      var lip = AM.box(w + .035, .024, .06, M.steelDark, false);
      lip.position.set(0, h * .5 + .01, 0); g.add(lip);
      var lip2 = lip.clone(); lip2.position.y = -h * .5 - .01; g.add(lip2);
    }
    if (opts.lit) {
      var halo = AM.sprite(g, TEX.glowGreen, opts.glowColor || 0xe6f5b0, Math.max(w, h) * 1.45, .20);
      halo.position.z = -.02;
    }
    if (opts.brackets) {
      [-1, 1].forEach(function (s) {
        var br = AM.box(.05, .05, .22, M.steelDark, false);
        br.position.set(s * w * .36, h * .5 + .08, -.09); g.add(br);
        var rod = AM.cyl(.015, .015, .34, 6, M.steelDark, false);
        rod.position.set(s * w * .36, h * .5 + .21, -.16); g.add(rod);
      });
    }
    parent.add(g);
    return g;
  }

  /* -----------------------------------------------------------------------
     wall block
     ----------------------------------------------------------------------- */
  function makeWall(o) {
    var w = o.w, d = o.d, h = o.h;
    var g = new T.Group();
    g.position.set(o.x, o.y || 0, o.z);
    if (o.ry) g.rotation.y = o.ry;
    var geo = new T.BoxGeometry(w, h, d);
    AM.worldUVBox(geo, o.uvScale || .29, o.uvX || 0, o.uvY || 0);
    var body = new T.Mesh(geo, o.mat || M.concrete);
    body.position.y = h * .5;
    body.castShadow = true; body.receiveShadow = true;
    AM.outline(body, o.outlineThick || .0025);
    g.add(body);

    // A recessed footing makes the slab feel set into the deck.
    var footMat = o.footMat || M.blackMetal;
    var foot = AM.box(w + .075, .105, d + .075, footMat, false);
    foot.position.y = .055; foot.receiveShadow = true; g.add(foot);
    var footTop = AM.box(w + .02, .028, d + .02, M.concreteDark, false);
    footTop.position.y = .12; g.add(footTop);

    // Heavy chamfered cap.
    var cap = AM.box(w + .055, .095, d + .055, o.capMat || M.concreteB, true, .0017);
    cap.position.y = h - .008;
    cap.castShadow = true; cap.receiveShadow = true;
    g.add(cap);

    // Board-form vertical shadows, just proud of the faces.
    var seamMat = M.blackPlastic;
    var seamH = h * .82;
    var seamPositions = o.seams === undefined ? [.28] : o.seams;
    seamPositions.forEach(function (u) {
      var sx = w * u;
      [-1, 1].forEach(function (s) {
        var seam = AM.box(.022, seamH, .010, seamMat, false);
        seam.position.set(sx * s, h * .47, s * (d * .5 + .006));
        g.add(seam);
      });
      [-1, 1].forEach(function (s) {
        var seam = AM.box(.010, seamH, .022, seamMat, false);
        seam.position.set(s * (w * .5 + .006), h * .47, sx);
        g.add(seam);
      });
    });

    // Deep reveal at the base.
    var skirting = AM.box(w + .01, .055, .018, seamMat, false);
    skirting.position.set(0, .20, d * .5 + .011); g.add(skirting);
    var skirting2 = skirting.clone(); skirting2.position.z = -(d * .5 + .011); g.add(skirting2);

    // Top corner steel repair / clamp.
    if (o.clamp) {
      [-1, 1].forEach(function (s) {
        var c = AM.box(.13, .07, d + .08, M.steelDark, false);
        c.position.set(s * (w * .5 - .10), h - .13, 0); g.add(c);
        var b = AM.cyl(.023, .023, .14, 6, M.brass, false);
        b.rotation.z = Math.PI * .5; b.position.set(s * (w * .5 - .10), h - .13, d * .5 + .05); g.add(b);
      });
    }

    // Warning stripe at the base of moving blocks / dangerous thresholds.
    if (o.hazard) {
      var hzMat = M.hazardStripe || (M.hazardStripe = AM.toon(0xffffff, { map: (function () {
        var tx = TEX.hazard.clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(Math.max(2, Math.round(w * 2.8)), 1); return tx;
      })(), gradientMap: AM.grad, rim: 0 }));
      var strip = AM.box(w + .01, .16, .014, hzMat, false);
      strip.position.set(0, .25, d * .5 + .013); g.add(strip);
      var strip2 = strip.clone(); strip2.position.z = -(d * .5 + .013); g.add(strip2);
      var strip3 = AM.box(.014, .16, d, hzMat, false);
      strip3.position.set(w * .5 + .013, .25, 0); g.add(strip3);
      var strip4 = strip3.clone(); strip4.position.x = -(w * .5 + .013); g.add(strip4);
    }

    // Raw cut end with aggregate and rebar.
    if (o.cut) {
      var side = o.cut === -1 ? -1 : 1;
      var cutMat = M.concreteSoot;
      var face = AM.box(.045, h * .9, d * .92, cutMat, false);
      face.position.set(side * (w * .5 + .008), h * .48, 0); g.add(face);
      var rebarMat = M.rust;
      for (var r = 0; r < 3; r++) {
        var rebar = AM.cyl(.018, .018, .22, 5, rebarMat, false);
        rebar.rotation.z = Math.PI * .5;
        rebar.position.set(side * (w * .5 + .12), h * (.55 + r * .09), (r - 1) * d * .24);
        g.add(rebar);
      }
      // exposed aggregate lumps at the cut edge
      var rnd = AM.rng((o.seed || 4) + 18);
      for (var rr = 0; rr < 8; rr++) {
        var rock = new T.Mesh(new T.DodecahedronGeometry(.03 + rnd() * .055, 0), M.concreteDark);
        rock.position.set(side * (w * .5 + .015), .18 + rnd() * (h - .3), (rnd() - .5) * d * .8);
        rock.scale.set(.6 + rnd(), .5 + rnd() * .7, .6 + rnd());
        rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        g.add(rock);
      }
    }

    // Add any face decals defined by the caller.
    if (o.decals) {
      o.decals.forEach(function (dd) {
        var dz = dd.face === 'front' ? d * .5 + .007 : dd.face === 'back' ? -d * .5 - .007 : 0;
        var dx = dd.face === 'right' ? w * .5 + .007 : dd.face === 'left' ? -w * .5 - .007 : 0;
        addDecal(g, dd.tex, dd.w, dd.h, dd.x || dx || 0, dd.y, dd.z || dz || 0,
          dd.face === 'front' ? null : dd.face, dd.opacity === undefined ? .7 : dd.opacity);
      });
    }
    root.add(g);
    return g;
  }

  /* -----------------------------------------------------------------------
     light fixture
     ----------------------------------------------------------------------- */
  function makeFixture(o) {
    var g = new T.Group();
    g.position.set(o.x, o.y, o.z);
    if (o.ry) g.rotation.y = o.ry;
    var len = o.len || 1.35;
    var colorHex = o.color === undefined ? 0xd4ec8c : o.color;
    var tint = new T.Color(colorHex);
    var tubeMat = new T.MeshBasicMaterial({ color: tint.clone(), toneMapped: false });
    var tubeMat2 = new T.MeshBasicMaterial({ color: tint.clone(), toneMapped: false });
    var tubes = [];
    [-1, 1].forEach(function (s, idx) {
      var tube = new T.Mesh(AM.G.cyl(.028, .028, len, 10, false), idx ? tubeMat2 : tubeMat);
      tube.rotation.z = Math.PI * .5;
      tube.position.z = s * .075;
      g.add(tube); tubes.push(tube);
    });
    // slim metal reflector/channel
    var hood = AM.box(len + .12, .045, .30, M.steelPale, true, .0015);
    hood.position.y = .095; hood.castShadow = true; g.add(hood);
    var capGeo = AM.G.cyl(.045, .045, .14, 8, false);
    [-1, 1].forEach(function (s) {
      var c = new T.Mesh(capGeo, M.steelDark); c.rotation.z = Math.PI * .5;
      c.position.set(s * (len * .5 + .035), -.005, 0); g.add(c);
    });
    [-1, 1].forEach(function (s) {
      var c = new T.Mesh(capGeo, M.steelDark); c.rotation.z = Math.PI * .5;
      c.position.set(s * (len * .5 + .035), -.005, .15); g.add(c);
    });
    // ballast box
    var ballast = AM.box(.22, .08, .18, M.steelDark, false);
    ballast.position.set(len * .25, .16, 0); g.add(ballast);
    // suspension rods back to an anchor line
    if (o.anchorY !== undefined) {
      var drop = o.anchorY - o.y - .11;
      if (drop > .1) {
        [-1, 1].forEach(function (s) {
          var rod = AM.cyl(.011, .011, drop, 5, M.steelDark, false);
          rod.position.set(s * len * .35, .11 + drop * .5, 0); g.add(rod);
          var clamp = AM.box(.055, .028, .055, M.steelDark, false);
          clamp.position.set(s * len * .35, o.anchorY - o.y, 0); g.add(clamp);
        });
      }
    }
    // soft halos; these are intentionally quiet
    var halo = AM.sprite(g, TEX.glowGreen, colorHex, len * 1.55, o.halo === undefined ? .16 : o.halo);
    halo.position.y = -.01;
    if (o.halo !== false) g.add(halo);

    var pl = null;
    if (o.light) {
      pl = new T.PointLight(o.lightColor === undefined ? 0xbfdc82 : o.lightColor, o.intensity === undefined ? 1.0 : o.intensity, o.distance || 8, 2);
      pl.position.set(0, -.18, 0);
      g.add(pl);
    }
    root.add(g);
    AM.fixtures.push({
      group: g, tubes: tubes, mats: [tubeMat, tubeMat2],
      colors: [new T.Color(tint), new T.Color(tint)], light: pl,
      seed: o.seed || 1, baseIntensity: o.flicker ? 1 : 0,
      flicker: !!o.flicker, baseLightIntensity: o.intensity || 0, warm: o.warm || false
    });
    return g;
  }

  /* -----------------------------------------------------------------------
     sliding concrete block
     ----------------------------------------------------------------------- */
  function makeMovingWall(o) {
    var g = new T.Group();
    var base = new T.Group();
    root.add(g);
    g.add(base);
    base.position.set(o.x, 0, o.z);
    if (o.ry) base.rotation.y = o.ry;
    // build the wall centered at origin by temporarily treating placement as 0
    var holder = new T.Group();
    holder.position.set(0, 0, 0);
    base.add(holder);
    var w = o.w, d = o.d, h = o.h;
    var geo = new T.BoxGeometry(w, h, d);
    AM.worldUVBox(geo, .30, o.uvX || 0, o.uvY || 0);
    var body = new T.Mesh(geo, o.mat || M.concrete);
    body.position.y = h * .5 + .05;
    body.castShadow = true; body.receiveShadow = true;
    AM.outline(body, .0025);
    holder.add(body);
    var cap = AM.box(w + .06, .10, d + .06, M.concreteB, true, .0017);
    cap.position.y = h + .01; cap.castShadow = true; holder.add(cap);
    // steel skid / rail shoe
    var shoe = AM.box(w + .05, .10, d + .04, M.steelDark, false);
    shoe.position.y = .06; holder.add(shoe);
    var hzM = M.hazardStripe;
    var strip = AM.box(w + .01, .16, .015, hzM, false);
    strip.position.set(0, .50, d * .5 + .008); holder.add(strip);
    var stripB = strip.clone(); stripB.position.z = -d * .5 - .008; holder.add(stripB);
    var stripS = AM.box(.015, .16, d, hzM, false);
    stripS.position.set(w * .5 + .008, .50, 0); holder.add(stripS);
    var stripS2 = stripS.clone(); stripS2.position.x = -w * .5 - .008; holder.add(stripS2);
    // top warning lamp housing
    var lamp = AM.box(.10, .055, .10, M.steelDark, false);
    lamp.position.set(w * .38, h + .09, d * .32); holder.add(lamp);
    var led = AM.sphere(.035, 8, 5, M.ledAmber, false);
    led.position.set(w * .38, h + .14, d * .32); holder.add(led);
    // vertical edge straps
    [-1, 1].forEach(function (s) {
      var st = AM.box(.045, h * .78, .04, M.steelDark, false);
      st.position.set(s * (w * .5 - .08), h * .5, d * .5 + .012); holder.add(st);
    });
    // mottled edge stencil
    var mark = addDecal(holder, TEX.stencil07, .48, .48, w * .23, h * .62, d * .5 + .02, null, .25);
    mark.renderOrder = 3;
    var mw = {
      group: base, holder: holder, baseX: o.x, baseZ: o.z,
      axis: o.axis || 'x', amp: o.amp || .6, period: o.period || 44,
      phase: o.phase || 0, dirSign: o.dirSign || 1,
      baseRy: o.ry || 0, lastOffset: 0, seed: o.seed || 2
    };
    AM.movingWalls.push(mw);
    return base;
  }

  /* -----------------------------------------------------------------------
     environment props
     ----------------------------------------------------------------------- */
  function cone(parent, x, z, scale, color) {
    var g = new T.Group();
    var c = new T.Mesh(new T.CylinderGeometry(.035 * (scale || 1), .15 * (scale || 1), .58 * (scale || 1), 12, 1), M.redPaint);
    c.position.y = .29 * (scale || 1); c.castShadow = true; AM.outline(c, .0018);
    g.add(c);
    var band = AM.cyl(.074 * (scale || 1), .094 * (scale || 1), .09 * (scale || 1), 12, M.white, false);
    band.position.y = .32 * (scale || 1); g.add(band);
    var base = AM.box(.32 * (scale || 1), .045, .32 * (scale || 1), M.blackPlastic, false);
    base.position.y = .02; g.add(base);
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function barrel(parent, x, z, height, color, seed) {
    var r = .20;
    var h = height || .52;
    var mat = color === 'blue' ? AM.toon(0x455b59, { rim: .15, rimColor: 0x839f96, gradientMap: AM.gradHard }) : AM.toon(0x7b4d35, { rim: .12, rimColor: 0xb27f58, gradientMap: AM.gradHard });
    var g = new T.Group();
    var body = new T.Mesh(new T.CylinderGeometry(r, r, h, 14, 1), mat);
    body.position.y = h * .5; body.castShadow = true; body.receiveShadow = true; AM.outline(body, .0018);
    g.add(body);
    for (var i = 0; i < 3; i++) {
      var ring = new T.Mesh(new T.TorusGeometry(r + .006, .012, 5, 18), M.steelDark);
      ring.rotation.x = Math.PI * .5; ring.position.y = .08 + i * (h - .16) / 2; g.add(ring);
    }
    var top = AM.cyl(r * .83, r * .83, .02, 14, M.steelDark, false);
    top.position.y = h + .005; g.add(top);
    var cap = AM.cyl(.045, .045, .03, 8, M.brass, false); cap.position.set(.10, h + .02, 0); g.add(cap);
    var rnd = AM.rng(seed || 4);
    for (var s = 0; s < 4; s++) {
      var st = AM.decal(.22, .28, TEX.rust, { opacity: .42, fog: false });
      st.position.set((rnd() - .5) * .2, .1 + rnd() * (h - .2), r + .012);
      g.add(st);
    }
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function crate(parent, x, z, w, h, d, ry, seed) {
    var g = new T.Group();
    var b = AM.box(w, h, d, M.woodDark, true, .0018, { worldUV: true, uvScale: .6 });
    b.position.y = h * .5; b.castShadow = true; b.receiveShadow = true; g.add(b);
    var frameMat = M.steelDark;
    [-1, 1].forEach(function (s) {
      var r = AM.box(w + .015, .035, .035, frameMat, false);
      r.position.set(0, .07, s * (d * .5 + .004)); g.add(r);
      var r2 = r.clone(); r2.position.y = h - .06; g.add(r2);
      var v = AM.box(.035, h - .1, .035, frameMat, false);
      v.position.set(s * (w * .5 + .004), h * .5, d * .5 + .004); g.add(v);
    });
    var st = AM.decal(.3, .18, TEX.signCaution, { opacity: .7, fog: false });
    st.position.set(0, h * .55, d * .5 + .012); g.add(st);
    g.position.set(x, 0, z);
    if (ry) g.rotation.y = ry;
    parent.add(g);
    return g;
  }

  function trafficCone(parent, x, z) { return cone(parent, x, z, 1, 0); }

  function warningLamp(parent, x, y, z, color, scale) {
    var g = new T.Group();
    var base = AM.cyl(.055 * (scale || 1), .065 * (scale || 1), .06, 8, M.steelDark, false);
    base.position.y = 0; g.add(base);
    var l = AM.sphere(.055 * (scale || 1), 10, 7, AM.basic(color === undefined ? 0xff5a39 : color, { toneMapped: false }), false);
    l.position.y = .09; g.add(l);
    var halo = AM.sprite(g, TEX.glowRed, color === undefined ? 0xff623f : color, .8 * (scale || 1), .38);
    halo.position.y = .09;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }

  /* -----------------------------------------------------------------------
     pipe & duct details
     ----------------------------------------------------------------------- */
  function pipeRun(parent, pts, radius, mat, collars) {
    var g = new T.Group();
    var p = AM.pipe(g, pts, radius, mat, Math.max(16, pts.length * 8));
    p.castShadow = true;
    if (collars) {
      for (var i = 1; i < pts.length - 1; i++) {
        var c = AM.cyl(radius * 1.4, radius * 1.4, .045, 8, M.steelDark, false);
        c.position.copy(pts[i]);
        c.lookAt(pts[i + 1]);
        c.rotation.x = Math.PI * .5;
        g.add(c);
      }
    }
    parent.add(g);
    return g;
  }

  function valveWheel(parent, x, y, z, ry, size) {
    var g = new T.Group();
    var ring = new T.Mesh(new T.TorusGeometry(.15 * (size || 1), .018, 6, 20), M.redPaint);
    g.add(ring);
    for (var i = 0; i < 3; i++) {
      var spoke = AM.cyl(.012, .012, .28 * (size || 1), 5, M.redPaint, false);
      spoke.rotation.z = i * Math.PI / 3;
      g.add(spoke);
    }
    var hub = AM.cyl(.045, .045, .05, 8, M.brass, false);
    hub.rotation.x = Math.PI * .5; g.add(hub);
    var stem = AM.cyl(.035, .035, .22, 8, M.steelDark, false);
    stem.rotation.x = Math.PI * .5; stem.position.z = -.11; g.add(stem);
    g.position.set(x, y, z);
    g.rotation.y = ry || 0;
    parent.add(g);
    return g;
  }

  function ventBlock(parent, x, y, z, w, h, d, face, seed) {
    var g = new T.Group();
    var rim = AM.box(w + .08, h + .08, d, M.steelDark, true, .0015);
    g.add(rim);
    var recess = AM.box(w, h, .05, M.blackPlastic, false);
    recess.position.z = -d * .3; g.add(recess);
    var louv = AM.louver(g, w - .10, h - .10, .045, M.steelPale, .5);
    louv.position.z = d * .2;
    var frame = AM.box(w + .15, .035, d + .1, M.steelDark, false);
    frame.position.y = h * .5 + .05; g.add(frame);
    g.position.set(x, y, z);
    if (face === 'right') g.rotation.y = Math.PI * .5;
    else if (face === 'left') g.rotation.y = -Math.PI * .5;
    else if (face === 'back') g.rotation.y = Math.PI;
    g.castShadow = true;
    parent.add(g);
    return g;
  }

  /* -----------------------------------------------------------------------
     static architecture + hidden gate
     ----------------------------------------------------------------------- */
  function buildStandingStructure() {
    var arch = new T.Group(); root.add(arch);

    // Back left, tall. This carries the large enamel ASH TRAY MAZE sign.
    var wBL = makeWall({
      x: -3.65, z: -4.82, w: 3.55, d: .64, h: 4.38, mat: M.concreteB,
      uvScale: .31, seams: [.31], cut: 1, clamp: true, seed: 9
    });
    signPlate(wBL, TEX.signMaze, 2.34, 1.17, .06, 3.28, .37, 0, { lit: true, brackets: true, frameMat: M.steelDark });
    addDecal(wBL, TEX.stencilMaze, 1.2, .6, -.8, 1.55, .326, 'front', .12);
    addDecal(wBL, TEX.rust, .75, 1.15, 1.28, 1.1, .326, 'front', .3);
    warningLamp(wBL, 1.55, 2.1, .36, 0xffb35b, 1);

    // Back right, slightly lower, broken shoulder.
    var wBR = makeWall({
      x: 2.7, z: -4.82, w: 3.55, d: .64, h: 3.6, mat: M.concrete,
      uvScale: .31, seams: [.34], cut: -1, seed: 13
    });
    addDecal(wBR, TEX.sealPaint, 1.35, 1.35, .5, 1.75, .327, 'front', .28);
    addDecal(wBR, TEX.stencil07, 1.1, 1.1, -1.2, 1.55, .327, 'front', .32);
    var ventBR = ventBlock(wBR, 1.25, 2.55, .33, .86, .5, .08, 'front', 41);
    // a bracket and utility box
    var utilBox = AM.box(.36, .5, .17, M.steelPale, true, .0015);
    utilBox.position.set(-.55, 1.1, .41); wBR.add(utilBox);
    addDecal(wBR, TEX.signCaution, .32, .16, -.55, 1.18, .505, 'front', .8);

    // Concealed AWE gate in the gap between the rear blocks.
    var gateBack = new T.Group(); arch.add(gateBack);
    var dark = new T.Mesh(new T.PlaneGeometry(2.35, 2.65), new T.MeshBasicMaterial({ color: 0x030605, fog: false }));
    dark.position.set(-.45, 1.42, -5.10); gateBack.add(dark);
    // corridor sides and lintel
    var jambL = AM.box(.35, 2.72, .85, M.concreteDark, true, .002);
    jambL.position.set(-1.80, 1.36, -4.78); gateBack.add(jambL);
    var jambR = AM.box(.35, 2.72, .85, M.concreteDark, true, .002);
    jambR.position.set(.90, 1.36, -4.78); gateBack.add(jambR);
    var lintel = AM.box(3.0, .56, .95, M.concreteB, true, .0022);
    lintel.position.set(-.45, 2.99, -4.77); gateBack.add(lintel);
    signPlate(gateBack, TEX.signGate, 1.5, .72, -.45, 3.15, -4.29, 0, { brackets: false, lit: true, glowColor: 0xe7ba82 });
    // steel scanning arch inside the dark mouth
    var scanMat = M.steelPale;
    var archL = AM.box(.09, 2.0, .10, scanMat, true, .0013);
    archL.position.set(-1.14, 1.12, -4.83); gateBack.add(archL);
    var archR = archL.clone(); archR.position.x = .25; gateBack.add(archR);
    var archT = AM.box(1.48, .09, .10, scanMat, true, .0013);
    archT.position.set(-.45, 2.13, -4.83); gateBack.add(archT);
    var scanBar = AM.box(1.25, .022, .022, M.ledGreen, false);
    scanBar.position.set(-.45, 1.7, -4.8); gateBack.add(scanBar);
    // heavy gate leaf, ajar and lit by a green slit
    var leaf = AM.box(1.0, 2.20, .11, M.steelDark, true, .0018);
    leaf.position.set(-.98, 1.15, -4.83); leaf.rotation.y = -.12; gateBack.add(leaf);
    var slit = AM.box(1.5, .025, .02, M.ledGreen, false);
    slit.position.set(-.45, 2.23, -4.75); gateBack.add(slit);
    var gateHalo = AM.sprite(gateBack, TEX.glowGreen, 0xb8dd87, 1.8, .16);
    gateHalo.position.set(-.45, 1.5, -4.5);
    // little bell / intercom and red bulb
    var intercom = AM.box(.12, .28, .06, M.steelPale, false);
    intercom.position.set(1.14, 1.35, -4.58); gateBack.add(intercom);
    for (var ib = 0; ib < 4; ib++) {
      var btn = AM.cyl(.018, .018, .014, 6, M.ledAmber, false);
      btn.rotation.x = Math.PI * .5; btn.position.set(1.11, 1.26 + ib * .035, -4.55); gateBack.add(btn);
    }
    warningLamp(gateBack, 1.18, 2.46, -4.6, 0xff5735, 1.05);
    // floor threshold strip
    var threshold = AM.box(2.1, .025, .18, M.ledGreen, false);
    threshold.position.set(-.45, .025, -4.36); gateBack.add(threshold);

    // Left flank wall. The visible face gets the large painted 07.
    var wL = makeWall({
      x: -6.04, z: -1.25, w: .68, d: 5.5, h: 3.42, mat: M.concreteCool,
      uvScale: .31, seams: [.36], cut: 1, clamp: true, seed: 3
    });
    addDecal(wL, TEX.stencil07, 1.28, 1.28, .345, 1.78, -.9, 'right', .34);
    addDecal(wL, TEX.stencilMaze, 1.3, .65, .345, 2.6, -3.15, 'right', .16);
    addDecal(wL, TEX.rust, .9, 1.35, .345, .85, 1.4, 'right', .38);
    var sconce = warningLamp(wL, .42, 2.35, .3, 0xffc880, 1.2);

    // horizontal formwork joints and tie holes on the visible flank face
    for (var fj = 0; fj < 4; fj++) {
      var joint = AM.box(.012, .012, 5.0, M.blackPlastic, false);
      joint.position.set(.345, 1.10 + fj * .55, -.1); wL.add(joint);
    }
    for (var th = 0; th < 9; th++) {
      var hole = AM.cyl(.028, .028, .012, 8, M.blackPlastic, false);
      hole.rotation.z = Math.PI * .5;
      hole.position.set(.347, .42 + (th % 3) * .72, -1.4 + Math.floor(th / 3) * 1.05);
      wL.add(hole);
    }
    // vertical conduit + junction box
    var conduit = AM.cyl(.028, .028, 2.4, 6, M.pipeRust, false);
    conduit.position.set(.36, 1.42, 1.18); wL.add(conduit);
    var jbox = AM.box(.25, .34, .15, M.steelPale, true, .0012);
    jbox.position.set(.43, 1.05, 1.18); wL.add(jbox);
    var jdecal = AM.decal(.16, .09, TEX.signCaution, { opacity: .8, fog: false });
    jdecal.position.set(.51, 1.08, 1.18); jdecal.rotation.y = Math.PI * .5; wL.add(jdecal);
    var alarm = new T.Group();
    var bell = new T.Mesh(new T.CylinderGeometry(.09, .13, .10, 12), M.redPaint);
    bell.rotation.z = Math.PI * .5; alarm.add(bell);
    var alarmBox = AM.box(.12, .20, .17, M.steelDark, false); alarmBox.position.x = -.06; alarm.add(alarmBox);
    alarm.position.set(.45, 1.75, .75); wL.add(alarm);
    var patch = AM.decal(.65, .95, TEX.rust, { opacity: .33, fog: false });
    patch.position.set(.346, .65, -2.5); patch.rotation.y = Math.PI * .5; wL.add(patch);


    // Left front wing: an angled broken end.
    var wLF = makeWall({
      x: -5.62, z: 3.12, w: 2.45, d: .52, h: 2.22, ry: .47,
      mat: M.concreteB, uvScale: .31, seams: [.35], cut: 1, seed: 15
    });
    addDecal(wLF, TEX.stencilControl, 1.32, .7, -.58, 1.58, .272, 'front', .22);
    addDecal(wLF, TEX.rust, .75, .9, .83, .55, .273, 'front', .35);
    // a small sign bracket
    signPlate(wLF, TEX.signAuth, .85, .43, .22, 1.72, .30, 0, { depth: .025, frame: false });

    // Low broken barrier, far left front, hazard strip and lamp.
    var wBar = makeWall({
      x: -3.0, z: 4.97, w: 2.15, d: .34, h: .88, ry: -.13,
      mat: M.concreteDark, uvScale: .36, seams: [.3], cut: -1, hazard: true, seed: 19
    });
    addDecal(wBar, TEX.stencilFire, .55, .28, -.55, .58, .18, 'front', .62);
    trafficCone(root, -4.15, 5.48);
    trafficCone(root, -1.8, 5.17);

    // Right rear long wall, cut and deformed.
    var wRR = makeWall({
      x: 5.02, z: -3.30, w: 2.55, d: .48, h: 2.82, ry: -.16,
      mat: M.concrete, uvScale: .30, seams: [.33], cut: 1, seed: 22
    });
    addDecal(wRR, TEX.directory, .78, 1.17, -.55, 1.6, .25, 'front', .88);
    var warn = warningLamp(wRR, .90, 2.15, .28, 0xffc061, .95);

    // Right-side low wall, one of several stacked planes. It guards the gate lane.
    var wRL = makeWall({
      x: 7.45, z: -.65, w: .42, d: 3.35, h: 1.22, mat: M.concreteB,
      uvScale: .36, seams: [.28], cut: -1, hazard: true, seed: 27
    });
    addDecal(wRL, TEX.stencil07, .52, .52, .22, .80, .75, 'right', .26);

    // A short low wall on the right apron.
    var wRF = makeWall({
      x: 4.36, z: 4.12, w: 2.45, d: .35, h: .98, ry: .1,
      mat: M.concreteDark, uvScale: .35, seams: [.3], cut: 1, hazard: true, seed: 31
    });
    addDecal(wRF, TEX.signCaution, .9, .45, -.35, .62, .183, 'front', .9);
    ventBlock(wRF, -.85, .55, .20, .58, .34, .06, 'front', 12);

    // The visible right-hand security checkpoint set into a concrete pylon.
    buildCheckpoint();

    return { backLeft: wBL, backRight: wBR, left: wL };
  }

  function buildCheckpoint() {
    var x = 6.55, z = 1.35;
    var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = -.14; root.add(g);
    var w = makeWall({
      x: 0, z: 0, w: 1.92, d: 1.55, h: 3.05, mat: M.concreteB,
      uvScale: .32, seams: [.30], clamp: true, seed: 43
    });
    // makeWall always adds to root with its own x,z; relocate it into this group for shared rotation
    root.remove(w);
    w.position.set(0, 0, 0);
    w.rotation.y = 0;
    g.add(w);

    // recessed heavy door on the +z face
    var recess = AM.box(1.28, 2.15, .18, M.blackPlastic, false);
    recess.position.set(-.18, 1.08, .79); g.add(recess);
    var frame = AM.box(1.42, 2.30, .12, M.steelDark, true, .0018);
    frame.position.set(-.18, 1.15, .81); g.add(frame);
    var hole = AM.box(1.22, 2.08, .14, M.blackPlastic, false);
    hole.position.set(-.18, 1.14, .84); g.add(hole);
    var door = AM.box(1.10, 1.95, .09, M.steelPale, true, .0018);
    door.position.set(-.18, 1.05, .89); g.add(door);
    // door ribs and warning stripes
    for (var r = 0; r < 5; r++) {
      var rib = AM.box(1.03, .028, .025, M.steelDark, false);
      rib.position.set(-.18, .23 + r * .35, .945); g.add(rib);
    }
    var stripe = AM.box(1.10, .20, .012, M.hazardStripe, false);
    stripe.position.set(-.18, .24, .94); g.add(stripe);
    var handle = AM.box(.08, .22, .06, M.brass, false);
    handle.position.set(.28, 1.05, .95); g.add(handle);
    var scan = AM.box(1.30, .035, .35, M.steelDark, true, .0014);
    scan.position.set(-.18, 2.26, .88); g.add(scan);
    var scanGlow = AM.box(1.08, .014, .24, M.ledGreen, false);
    scanGlow.position.set(-.18, 2.24, .86); g.add(scanGlow);
    var keypad = new T.Mesh(new T.PlaneGeometry(.20, .34), new T.MeshBasicMaterial({ map: TEX.keypad, transparent: false, toneMapped: false }));
    keypad.position.set(.76, 1.10, .867); g.add(keypad);
    var lamp = warningLamp(g, .55, 2.54, .82, 0xff4d2f, 1.25);
    var sign = signPlate(g, TEX.signGate, 1.32, .63, -.18, 2.59, .90, 0, { lit: true, brackets: false, glowColor: 0xffca8b });
    var cctv = cameraRig(g, .72, 2.20, .9, -.55, 1);
    // vent louvre on the side
    ventBlock(g, .98, 1.7, .02, .44, .54, .05, 'right', 33);
    // top exhaust stack
    var stack = AM.cyl(.10, .13, .8, 10, M.steelDark, true, .0015);
    stack.position.set(-.55, 3.45, -.3); g.add(stack);
    var cap = AM.cyl(.16, .16, .04, 10, M.steelPale, false);
    cap.position.set(-.55, 3.86, -.3); g.add(cap);
    // safety lamp glow
    var halo = AM.sprite(g, TEX.glowRed, 0xff5e44, 1.0, .25);
    halo.position.set(.55, 2.72, .84);
    // step / threshold
    var step = AM.box(1.9, .12, .5, M.concreteDark, true, .0015);
    step.position.set(-.18, .06, 1.0); g.add(step);
    // hazard lane
    var laneMat = M.hazardLane || (M.hazardLane = AM.toon(0xffffff, { map: (function () {
      var tt = TEX.hazard.clone(); tt.needsUpdate = true; tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(4, 1); return tt;
    })(), gradientMap: AM.grad, rim: 0 }));
    var lane = new T.Mesh(new T.PlaneGeometry(2.2, .26), laneMat);
    lane.rotation.x = -Math.PI * .5; lane.position.set(-.18, .012, 1.35); g.add(lane);
    // service ladder and exterior pipework up the blind side
    var ladder = AM.ladder(g, -1.08, .08, .45, 2.5, .38, M.steelDark, 0);
    var extPipe = AM.cyl(.055, .055, 2.4, 7, M.pipeRust, false);
    extPipe.position.set(1.06, 1.20, -.18); g.add(extPipe);
    for (var pj = 0; pj < 3; pj++) {
      var clamp = AM.cyl(.075, .075, .035, 8, M.steelDark, false);
      clamp.position.set(1.06, .50 + pj * .78, -.18); g.add(clamp);
    }
    // route sign / small directory
    var dir = new T.Mesh(new T.PlaneGeometry(.55, .82), new T.MeshBasicMaterial({ map: TEX.directory, toneMapped: false }));
    dir.position.set(.54, 1.6, .868); dir.rotation.y = 0; g.add(dir);

    // chain fall to gantry
    var hookCable = cable([new T.Vector3(x + .4, 5.55, z - .2), new T.Vector3(x + .35, 4.75, z - .2), new T.Vector3(x + .4, 4.2, z + .15)], .010, M.cable, 12);
    root.add(hookCable);

    return g;
  }

  function cameraRig(parent, x, y, z, yaw, scale) {
    var g = new T.Group();
    var bracket = AM.box(.06, .22, .06, M.steelDark, false);
    bracket.position.y = -.1; g.add(bracket);
    var arm = AM.box(.06, .06, .28, M.steelDark, false);
    arm.position.set(0, -.04, .12); g.add(arm);
    var body = AM.cyl(.10 * (scale || 1), .13 * (scale || 1), .30, 10, M.steelPale, true, .0014);
    body.rotation.x = Math.PI * .5; body.position.set(0, 0, .30); g.add(body);
    var lens = AM.cyl(.075, .09, .06, 10, M.blackPlastic, false);
    lens.rotation.x = Math.PI * .5; lens.position.set(0, 0, .49); g.add(lens);
    var eye = AM.sphere(.018, 6, 4, M.ledRed, false); eye.position.set(0, .09, .32); g.add(eye);
    var halo = AM.sprite(g, TEX.glowRed, 0xff4d2e, .24, .35); halo.position.set(0, .09, .32);
    g.position.set(x, y, z); g.rotation.y = yaw || 0;
    parent.add(g);
    return g;
  }

  /* -----------------------------------------------------------------------
     moving concrete blocks
     ----------------------------------------------------------------------- */
  function buildMovingWalls() {
    // Shared warning strip material for the sliding blocks.
    var hz = TEX.hazard.clone(); hz.needsUpdate = true;
    hz.wrapS = hz.wrapT = T.RepeatWrapping; hz.repeat.set(4, 1);
    M.hazardStripe = AM.toon(0xffffff, { map: hz, gradientMap: AM.grad, rim: 0 });
    makeMovingWall({ x: -4.2, z: 2.4, w: .44, d: 1.55, h: 2.62, axis: 'z', amp: .65, period: 47, phase: .31, cut: 1, seed: 6, mat: M.concreteB });
    // add the cut detail to the moving block builder manually: rear block gets a raw back edge
    var mv2 = makeMovingWall({ x: 4.6, z: 1.90, w: 1.55, d: .40, h: 1.48, axis: 'x', amp: .62, period: 39, phase: .67, seed: 8, mat: M.concrete });
    var mv3 = makeMovingWall({ x: -4.2, z: -3.6, w: 1.62, d: .40, h: 2.36, axis: 'x', amp: .55, period: 61, phase: .48, seed: 10, mat: M.concreteCool });
    // open the visible face of the low moving block with a few hazard bolts
    var low = mv2.children[0]; // holder
    // A foreground guide wall slowly crosses the apron, giving the maze a visible
    // front layer and a strong silhouette. Its seam pulses with green light.
    var fg = makeMovingWall({ x: -2.95, z: 6.35, w: 2.35, d: .48, h: 2.42, axis: 'x', amp: .55, period: 56, phase: .16, seed: 14, mat: M.concreteCool });
    var fgHolder = fg.children[0];
    // horizontal formwork shadows on the face
    [.62, 1.22, 1.84].forEach(function (yy) {
      var seam = AM.box(2.28, .018, .012, M.blackPlastic, false);
      seam.position.set(0, yy, .247); fgHolder.add(seam);
    });
    // green light fracture / impossible seam
    var seamMat = AM.basic(0xc4f279, { transparent: true, opacity: .9, blending: T.AdditiveBlending, toneMapped: false });
    var seam = new T.Mesh(new T.PlaneGeometry(.032, 1.9), seamMat);
    seam.position.set(.32, 1.25, .248); fgHolder.add(seam);
    var seamGlow = AM.sprite(fgHolder, TEX.glowGreen, 0xb9e77f, 1.35, .2);
    seamGlow.position.set(.32, 1.3, .27);
    AM.foregroundSeam = seamMat;
    // large stencil and rust on the foreground face
    var fgArrow = AM.decal(1.35, .65, TEX.stencilArrow, { opacity: .35, fog: false });
    fgArrow.position.set(-.22, 1.08, .249); fgHolder.add(fgArrow);
    var fgSeal = AM.decal(.78, .78, TEX.sealPaint, { opacity: .3, fog: false });
    fgSeal.position.set(.55, 1.72, .249); fgHolder.add(fgSeal);
    var fgRust = AM.decal(.95, .55, TEX.rust, { opacity: .45, fog: false });
    fgRust.position.set(-.70, .42, .249); fgHolder.add(fgRust);
    var fgRust2 = AM.decal(.55, .9, TEX.rust, { opacity: .34, fog: false });
    fgRust2.position.set(.86, .75, .249); fgHolder.add(fgRust2);
    // piston/skid detail on the hidden side
    for (var pg = 0; pg < 2; pg++) {
      var piston = AM.cyl(.045, .045, .45, 8, M.steelPale, false);
      piston.rotation.x = Math.PI * .5;
      piston.position.set(-.65 + pg * 1.25, .18, -.28); fgHolder.add(piston);
    }
    // stencils and ID
    var fgMark = AM.decal(.82, .4, TEX.signCaution, { opacity: .75, fog: false });
    fgMark.position.set(-.48, 1.68, .248); fgHolder.add(fgMark);
    var fgNum = AM.decal(.55, .55, TEX.stencil07, { opacity: .22, fog: false });
    fgNum.position.set(.62, .9, .248); fgHolder.add(fgNum);
    // exposed rebar stubs at the right cut edge
    for (var fr = 0; fr < 3; fr++) {
      var fbar = AM.cyl(.013, .013, .18, 5, M.rust, false);
      fbar.rotation.z = Math.PI * .5;
      fbar.position.set(1.25, 1.4 + fr * .22, -.08 + fr * .05); fgHolder.add(fbar);
    }
    // top beacon + small protective cage
    var fLamp = new T.Group();
    var cage = AM.cyl(.08, .10, .12, 8, M.steelDark, true, .0011); cage.position.y = .06; fLamp.add(cage);
    var fBulb = AM.sphere(.045, 8, 6, M.ledAmber, false); fBulb.position.y = .08; fLamp.add(fBulb);
    var fHalo = AM.sprite(fLamp, TEX.glowWarm, 0xffc46e, .6, .22); fHalo.position.y = .08;
    fLamp.position.set(-.86, 2.52, .05); fgHolder.add(fLamp);
    AM.guideWall = fg;
    AM.guideSeam = seamMat;
    AM.guideBeacon = fHalo;
    // add a red track beacon at each moving wall foot
    AM.movingWalls.forEach(function (mw, i) {
      var p = new T.Group();
      var socket = AM.box(.13, .08, .13, M.steelDark, false); socket.position.y = .06; p.add(socket);
      var glow = AM.sphere(.036, 6, 4, M.ledAmber, false); glow.position.y = .13; p.add(glow);
      var spr = AM.sprite(p, TEX.glowRed, 0xff9b53, .55, .2); spr.position.y = .14;
      p.position.set(mw.baseX + (i === 1 ? -1.1 : .9), .02, mw.baseZ + (i === 0 ? .9 : .7));
      root.add(p);
    });
    return M.hazardStripe;
  }

  /* -----------------------------------------------------------------------
     gantry, catwalk & overhead
     ----------------------------------------------------------------------- */
  function buildGantry() {
    var g = new T.Group(); root.add(g);
    var beamY = 6.16, beamZ = -1.02;
    // Columns: two built-up steel piers.
    [-1, 1].forEach(function (s) {
      var x = s * 6.62;
      var col = new T.Group();
      var basePad = AM.box(1.0, .12, 1.0, M.concreteDark, true, .0018);
      basePad.position.set(x, .06, beamZ); col.add(basePad);
      var web = AM.box(.18, 6.2, .18, M.steelDark, true, .0020);
      web.position.set(x, 3.14, beamZ); col.add(web);
      [-1, 1].forEach(function (f) {
        var flange = AM.box(.42, 6.2, .055, M.steel, true, .0017);
        flange.position.set(x + f * .12, 3.14, beamZ); col.add(flange);
        var flange2 = AM.box(.055, 6.2, .36, M.steel, true, .0017);
        flange2.position.set(x, 3.14, beamZ + f * .14); col.add(flange2);
      });
      // foot bolts & diagonal brace back to the base
      for (var b = 0; b < 4; b++) {
        var bolt = AM.cyl(.045, .045, .05, 6, M.brass, false);
        bolt.rotation.x = Math.PI * .5;
        bolt.position.set(x + (b % 2 ? .32 : -.32), .16, beamZ + (b > 1 ? .3 : -.3));
        col.add(bolt);
      }
      var brace = strut(new T.Vector3(x, .35, beamZ + 3.1), new T.Vector3(x, 2.9, beamZ + .15), .035, M.steelDark, 6);
      col.add(brace);
      g.add(col);
    });
    // Main beam across the whole composition.
    var beam = AM.iBeam(13.5, .58, .46, M.steel, true);
    beam.position.set(0, beamY, beamZ);
    beam.castShadow = true; beam.receiveShadow = true;
    g.add(beam);
    // Beam cap plates / rivet rows
    [-1, 1].forEach(function (s) {
      var cap = AM.box(.3, .68, .52, M.steelDark, true, .0017);
      cap.position.set(s * 6.76, beamY, beamZ); g.add(cap);
      for (var b = 0; b < 4; b++) {
        var bolt = AM.cyl(.026, .026, .05, 6, M.brass, false);
        bolt.rotation.z = Math.PI * .5;
        bolt.position.set(s * (6.35 + b * .18), beamY + .2, beamZ + .26); g.add(bolt);
      }
    });
    // Under-slung pipe + cable tray.
    pipeRun(g, [new T.Vector3(-6.2, beamY - .36, beamZ + .28), new T.Vector3(-1, beamY - .42, beamZ + .28), new T.Vector3(4.8, beamY - .39, beamZ + .28), new T.Vector3(6.3, beamY - .44, beamZ + .28)], .045, M.pipeRust, true);
    var tray = AM.box(11.2, .04, .16, M.steelDark, false);
    tray.position.set(0, beamY - .32, beamZ - .28); g.add(tray);
    for (var i = 0; i < 12; i++) {
      var br = AM.box(.06, .10, .25, M.steelDark, false);
      br.position.set(-5.2 + i * .95, beamY - .26, beamZ - .28); g.add(br);
    }
    // A small chain hoist / trolley above the observation room.
    var trolley = new T.Group();
    trolley.position.set(2.7, beamY + .1, beamZ);
    var trolleyBody = AM.box(.52, .26, .46, M.steelDark, true, .0015);
    trolleyBody.castShadow = true; trolley.add(trolleyBody);
    var wheel1 = AM.cyl(.075, .075, .06, 10, M.steelPale, false);
    wheel1.rotation.z = Math.PI * .5; wheel1.position.set(0, .03, .28); trolley.add(wheel1);
    var wheel2 = wheel1.clone(); wheel2.position.z = -.28; trolley.add(wheel2);
    var chain = AM.cyl(.022, .022, 1.45, 5, M.steelDark, false);
    chain.position.set(0, -.73, 0); trolley.add(chain);
    var hook = new T.Mesh(new T.TorusGeometry(.12, .025, 5, 10, Math.PI * 1.55), M.steelPale);
    hook.position.set(0, -1.48, 0); hook.rotation.x = Math.PI * .5; hook.rotation.z = .3; trolley.add(hook);
    g.add(trolley);
    AM.craneTrolley = trolley;

    // hanging enamel banner under the crane beam
    var banner = signPlate(root, TEX.signMaze, 2.20, 1.08, -3.55, 5.12, beamZ + .20, 0, { brackets: true, lit: true, glowColor: 0xddeeb0 });
    banner.rotation.z = .045;
    var chainL = AM.cyl(.012, .012, .34, 5, M.steelDark, false);
    chainL.position.set(-4.45, 5.83, beamZ + .08); root.add(chainL);
    var chainR = chainL.clone(); chainR.position.x = -2.65; root.add(chainR);
    var bannerLamp = AM.sphere(.04, 8, 5, M.ledAmber, false);
    bannerLamp.position.set(-4.55, 4.65, beamZ + .28); root.add(bannerLamp);

    // hanging fluorescent fixtures. Two are physical light sources; they read as mercury green.
    makeFixture({ x: -2.65, y: 5.05, z: beamZ + .02, len: 1.65, anchorY: beamY - .28, color: 0x8fd33d, light: true, lightColor: 0x7db43a, intensity: .75, distance: 6.0, flicker: true, seed: 3, halo: .26 });
    makeFixture({ x: 1.15, y: 5.02, z: beamZ - .02, len: 1.38, anchorY: beamY - .28, color: 0x9fdb51, light: true, lightColor: 0x87b547, intensity: .55, distance: 6.0, flicker: false, seed: 8, halo: .2 });
    makeFixture({ x: 4.72, y: 4.92, z: beamZ + .12, len: 1.05, anchorY: beamY - .28, color: 0x7fc63c, light: false, flicker: true, seed: 12, halo: .17 });
    // old cables and thin drop rods to room roof
    var cableMat = M.cable;
    root.add(cable([new T.Vector3(-5.5, beamY - .25, beamZ + .2), new T.Vector3(-3.9, 5.8, beamZ - .1), new T.Vector3(-2.5, 4.1, -1.8), new T.Vector3(-1.2, 4.04, -1.5)], .012, cableMat, 20));
    root.add(cable([new T.Vector3(3.3, beamY - .3, beamZ + .15), new T.Vector3(4.15, 5.1, -.4), new T.Vector3(4.6, 4.3, .4)], .011, cableMat, 16));
    // warning stripes wrapped around the beam ends
    [-1, 1].forEach(function (s) {
      var band = AM.box(.72, .60, .49, M.hazardStripe, false);
      band.position.set(s * 6.1, beamY, beamZ); g.add(band);
    });

    // A pair of hanging light shades on the left wing wall (bracket lamps).
    var bracketLamp = new T.Group();
    var arm = AM.box(.45, .055, .055, M.steelDark, false);
    arm.position.set(0, 0, 0); bracketLamp.add(arm);
    var shade = new T.Mesh(new T.CylinderGeometry(.16, .06, .16, 10, 1, true), M.steelDark);
    shade.position.set(.34, -.13, 0); shade.rotation.z = .15; bracketLamp.add(shade);
    var bulb = AM.sphere(.055, 8, 6, AM.basic(0xffce8d, { toneMapped: false }), false);
    bulb.position.set(.34, -.19, 0); bracketLamp.add(bulb);
    var halo = AM.sprite(bracketLamp, TEX.glowWarm, 0xffbc75, .75, .22); halo.position.set(.34, -.22, 0);
    bracketLamp.position.set(-5.7, 2.9, 3.1);
    bracketLamp.rotation.y = .35;
    root.add(bracketLamp);

    // Industrial work light on tripod in the near-left apron.
    buildWorkLight();

    return g;
  }

  function buildWorkLight() {
    var g = new T.Group(); g.position.set(-.35, 0, 6.55); g.rotation.y = -.1; root.add(g);
    var legMat = M.steelDark;
    for (var i = 0; i < 3; i++) {
      var a = i * Math.PI * 2 / 3;
      var foot = new T.Vector3(Math.cos(a) * .42, .025, Math.sin(a) * .42);
      var top = new T.Vector3(Math.cos(a) * .10, 1.85, Math.sin(a) * .10);
      g.add(strut(foot, top, .016, legMat, 5));
    }
    var mast = AM.cyl(.023, .026, 2.42, 6, M.steelDark, false);
    mast.position.y = 1.22; g.add(mast);
    var cross = AM.box(1.0, .05, .05, M.steelDark, false);
    cross.position.y = 2.35; g.add(cross);
    var heads = [];
    [-1, 1].forEach(function (s) {
      var h = new T.Group();
      var can = new T.Mesh(new T.CylinderGeometry(.15, .19, .22, 12, 1, false), M.steelPale);
      can.rotation.x = Math.PI * .5; can.position.z = .07; h.add(can);
      var lens = AM.sphere(.11, 10, 8, AM.basic(0xffd59a, { toneMapped: false }), false);
      lens.scale.z = .45; lens.position.z = .17; h.add(lens);
      var glow = AM.sprite(h, TEX.glowWarm, 0xffc889, 1.0, .25); glow.position.z = .22;
      h.position.set(s * .44, 2.23, 0);
      h.rotation.y = s * .24;
      g.add(h); heads.push(h);
    });
    // one physical warm fill; useful to pick out the concrete floor.
    var pl = new T.PointLight(0xffca8a, 1.15, 7.5, 2);
    pl.position.set(0, 2.15, .1); g.add(pl);
    AM.workLight = g;
    var cableCoil = new T.Group();
    for (var c = 0; c < 3; c++) {
      var ring = new T.Mesh(new T.TorusGeometry(.30 + c * .02, .014, 5, 20), M.cable);
      ring.rotation.x = Math.PI * .5; ring.position.y = .03 + c * .02; cableCoil.add(ring);
    }
    cableCoil.position.set(-.7, 0, .35); g.add(cableCoil);
    // electrical box and a lead
    var box = AM.box(.28, .35, .14, M.steelPale, true, .0015);
    box.position.set(.65, .18, .35); box.rotation.y = .35; g.add(box);
    var lead = cable([new T.Vector3(0, .02, 0), new T.Vector3(.5, .01, .7), new T.Vector3(1.2, .005, 1.1)], .014, M.cable, 12);
    g.add(lead);
  }

  function buildCatwalk() {
    var g = new T.Group(); g.position.y = 3.34; root.add(g);
    var len = 9.8, cx = -1.1, cz = -3.58;
    var deckMat = M.grate;
    var deck = AM.box(len, .075, .82, deckMat, true, .0015);
    deck.position.set(cx, 0, cz);
    deck.castShadow = true; deck.receiveShadow = true;
    g.add(deck);
    // underside beam and edge channels
    var beam = AM.iBeam(len, .22, .18, M.steelDark, false);
    beam.position.set(cx, -.16, cz); g.add(beam);
    [-1, 1].forEach(function (s) {
      var edge = AM.box(len, .12, .035, M.steelDark, false);
      edge.position.set(cx, .02, cz + s * .43); g.add(edge);
    });
    // railings, set just inside deck edges
    [-1, 1].forEach(function (s) {
      var rail = AM.railing(g, len, .96, M.steelDark);
      rail.position.set(cx, .04, cz + s * .40);
    });
    // support columns, laced behind the room.
    [-4.7, -.9, 3.1].forEach(function (x, idx) {
      var col = AM.box(.16, 3.38, .16, M.steelDark, true, .0017);
      col.position.set(x, -1.69, cz - .34); g.add(col);
      var bplate = AM.box(.4, .06, .4, M.steelDark, false);
      bplate.position.set(x, -3.30, cz - .34); g.add(bplate);
      var diag = strut(new T.Vector3(x, -3.25, cz - .35), new T.Vector3(x + .8, -.4, cz - .35), .026, M.steelDark, 5);
      g.add(diag);
      if (idx < 2) {
        var lampMat = AM.basic(0xffbd7a, { toneMapped: false });
        var cage = new T.Group();
        var bulb = AM.sphere(.08, 8, 6, lampMat, false); cage.add(bulb);
        var guard = new T.Mesh(new T.TorusGeometry(.115, .012, 4, 12), M.steelDark); guard.rotation.x = Math.PI * .5; cage.add(guard);
        var guard2 = guard.clone(); guard2.rotation.z = Math.PI * .5; cage.add(guard2);
        cage.position.set(x, -.55, cz + .1); g.add(cage);
        var halo = AM.sprite(g, TEX.glowWarm, 0xffb56e, .8, .17); halo.position.set(x, -.55, cz + .1);
      }
    });
    // ladder at the right end
    var lad = AM.ladder(g, cx + len * .5 - .15, -3.32, cz + .38, 3.2, .44, M.steelDark);
    // small warning sign
    var sign = AM.decal(.6, .3, TEX.signCaution, { opacity: .85, fog: false });
    sign.position.set(cx + 2.4, -.35, cz + .43); g.add(sign);
    // cable run along the walkway
    root.add(cable([new T.Vector3(-5.2, 3.72, -3.35), new T.Vector3(-2.0, 3.58, -3.36), new T.Vector3(2.4, 3.65, -3.32), new T.Vector3(4.2, 3.42, -3.2)], .014, M.cable, 28));
    AM.catwalk = g;
    return g;
  }

  function buildSearchlight() {
    var g = new T.Group(); g.position.set(-7.15, 0, -6.55); root.add(g);
    var h = 6.8, topR = .32, botR = .74;
    var feet = [
      new T.Vector3(-botR, 0, -botR), new T.Vector3(botR, 0, -botR),
      new T.Vector3(-botR, 0, botR), new T.Vector3(botR, 0, botR)
    ];
    var tops = [
      new T.Vector3(-topR, h, -topR), new T.Vector3(topR, h, -topR),
      new T.Vector3(-topR, h, topR), new T.Vector3(topR, h, topR)
    ];
    for (var i = 0; i < 4; i++) {
      g.add(strut(feet[i], tops[i], .035, M.steelDark, 6));
    }
    var levels = [.85, 1.9, 3.0, 4.15, 5.3, 6.35];
    levels.forEach(function (ly) {
      var t = ly / h;
      var rr = AM.lerp(botR, topR, t);
      var corners = [
        new T.Vector3(-rr, ly, -rr), new T.Vector3(rr, ly, -rr),
        new T.Vector3(-rr, ly, rr), new T.Vector3(rr, ly, rr)
      ];
      // horizontal ring
      g.add(strut(corners[0], corners[1], .018, M.steelDark, 5));
      g.add(strut(corners[1], corners[3], .018, M.steelDark, 5));
      g.add(strut(corners[3], corners[2], .018, M.steelDark, 5));
      g.add(strut(corners[2], corners[0], .018, M.steelDark, 5));
      // X-bracing on visible faces
      g.add(strut(corners[0], new T.Vector3(rr, ly - .85, -rr), .014, M.steelDark, 4));
      g.add(strut(corners[1], new T.Vector3(-rr, ly - .85, -rr), .014, M.steelDark, 4));
      g.add(strut(corners[3], new T.Vector3(rr, ly - .85, -rr), .014, M.steelDark, 4));
    });
    var platform = AM.box(1.35, .12, 1.35, M.steelDark, true, .0018);
    platform.position.y = h; platform.castShadow = true; g.add(platform);
    var rail = AM.railing(g, 1.3, .8, M.steelDark);
    rail.position.set(0, h + .06, .62);
    var rail2 = AM.railing(g, 1.3, .8, M.steelDark);
    rail2.position.set(-.62, h + .06, 0); rail2.rotation.y = Math.PI * .5;
    var housing = new T.Group();
    housing.position.set(0, h + .72, 0);
    var yoke = new T.Group();
    var forkL = AM.box(.08, .62, .08, M.steelDark, false); forkL.position.set(-.38, -.1, 0); yoke.add(forkL);
    var forkR = forkL.clone(); forkR.position.x = .38; yoke.add(forkR);
    var head = new T.Group();
    var barrel = new T.Mesh(new T.CylinderGeometry(.28, .36, .58, 16, 1, false), M.steelPale);
    barrel.rotation.x = Math.PI * .5; barrel.position.z = .1; AM.outline(barrel, .0018); head.add(barrel);
    var cowl = new T.Mesh(new T.CylinderGeometry(.44, .32, .30, 16, 1, true), M.steelDark);
    cowl.rotation.x = Math.PI * .5; cowl.position.z = .46; head.add(cowl);
    var lens = AM.ellipse ? null : AM.sphere(.25, 16, 10, AM.basic(0xfff1cc, { toneMapped: false }), false);
    lens.scale.z = .18; lens.position.z = .60; head.add(lens);
    var lensHalo = AM.sprite(head, TEX.glowWarm, 0xffe7b2, 1.5, .44); lensHalo.position.z = .64;
    var glassRing = new T.Mesh(new T.TorusGeometry(.33, .024, 6, 20), M.steelDark);
    glassRing.position.z = .60; head.add(glassRing);
    yoke.add(head);
    var pivot = AM.cyl(.075, .075, .95, 8, M.steelDark, false);
    pivot.rotation.z = Math.PI * .5; pivot.position.y = -.28; yoke.add(pivot);
    housing.add(yoke);
    // small motor/gearbox on the housing
    var gear = AM.box(.3, .28, .34, M.steelDark, true, .0015);
    gear.position.set(-.35, -.32, -.1); housing.add(gear);
    // aim the housing down over the model, then add a visible cone.
    housing.rotation.y = .82;
    housing.rotation.x = -.34;
    var beam = makeBeam(0xffe0ac, 16.5, .10, 1.65, .075);
    beam.rotation.x = -Math.PI * .5 - .08;
    // Beam's geometry points along +Z; the housing's local z is its optical axis.
    // We parent the beam at the lens and let the housing rotation aim it.
    beam.position.set(0, 0, .6);
    beam.rotation.set(0, 0, 0);
    head.add(beam);
    g.add(housing);
    // ladders and cable loops
    var lad = AM.ladder(g, .62, .2, .3, 6.2, .34, M.steelDark, .3);
    root.add(cable([new T.Vector3(-6.9, 6.8, -6.2), new T.Vector3(-5.4, 5.9, -5.6), new T.Vector3(-4.5, 4.2, -4.8)], .013, M.cable, 20));
    // PA horn mounted below the platform, aimed into the atrium.
    var horn = new T.Group();
    var stem = AM.cyl(.035, .035, .65, 6, M.steelDark, false); stem.position.y = -.32; horn.add(stem);
    var bell = new T.Mesh(new T.CylinderGeometry(.32, .07, .48, 16, 1, true), M.steelDark);
    bell.rotation.x = Math.PI * .42; bell.position.set(0, -.65, .25); horn.add(bell);
    var mouth = AM.cyl(.25, .25, .02, 16, M.blackPlastic, false);
    mouth.rotation.x = Math.PI * .42; mouth.position.set(0, -.65, .48); horn.add(mouth);
    var hornLed = AM.sphere(.018, 6, 4, M.ledGreen, false); hornLed.position.set(.11, -.5, .12); horn.add(hornLed);
    horn.position.set(-.55, h - .2, .1);
    g.add(horn);
    AM.soundSource = new T.Vector3(-7.7, 6.3, -6.3);
    AM.searchlight = { group: g, head: head, housing: housing, beam: beam };
    // gentle sweep driver
    var baseRotY = housing.rotation.y, baseRotX = housing.rotation.x;
    AM.addUpdater(function (dt, time) {
      housing.rotation.y = baseRotY + Math.sin(time * .045) * .16;
      housing.rotation.x = baseRotX + Math.sin(time * .033 + .7) * .045;
    });
    return g;
  }

  function makeBeam(color, length, radiusNear, radiusFar, opacity) {
    var geo = new T.CylinderGeometry(radiusFar, radiusNear, length, 28, 1, true);
    geo.rotateX(Math.PI * .5);
    geo.translate(0, 0, length * .5);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: {
        uColor: { value: new T.Color(color) }, uOpacity: { value: opacity }, uTime: { value: 0 }
      },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vP=-mv.xyz; gl_Position=projectionMatrix*mv; }',
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vP;',
        'uniform vec3 uColor; uniform float uOpacity,uTime;',
        'void main(){',
        '  float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vP))), 1.35);',
        '  float fade = smoothstep(0.0,.10,vUv.y) * pow(max(0.0,1.0-vUv.y),1.6);',
        '  float grain = .88 + .12 * sin(vUv.y*80.0 - uTime*1.7 + vUv.x*10.0);',
        '  float a = edge * fade * uOpacity * grain;',
        '  gl_FragColor = vec4(uColor * a * 2.2, a);',
        '}'
      ].join('\n')
    });
    var beam = new T.Mesh(geo, mat);
    beam.userData.noOutline = true;
    AM.addUpdater(function (dt, t) { mat.uniforms.uTime.value = t; });
    return beam;
  }

  /* -----------------------------------------------------------------------
     industrial clutter
     ----------------------------------------------------------------------- */
  function buildIndustry() {
    // Pipework running behind the left flank.
    pipeRun(root, [
      new T.Vector3(-8.25, .48, 5.35), new T.Vector3(-8.25, .48, 2.2),
      new T.Vector3(-8.25, .48, -1.5), new T.Vector3(-8.25, 1.1, -1.5),
      new T.Vector3(-8.25, 1.1, -4.2), new T.Vector3(-7.1, 1.1, -4.6)
    ], .072, M.pipeGreen, true);
    pipeRun(root, [
      new T.Vector3(-8.0, .26, 6.3), new T.Vector3(-8.0, .26, -2.2),
      new T.Vector3(-8.0, .26, -5.3), new T.Vector3(-6.6, .26, -5.9)
    ], .045, M.pipeRust, true);
    valveWheel(root, -8.2, 1.1, 1.0, Math.PI * .5, 1.0);
    // Pipe supports
    for (var i = 0; i < 4; i++) {
      var z = 4.4 - i * 1.9;
      var bracket = AM.box(.58, .06, .08, M.steelDark, false);
      bracket.position.set(-8.25, .37, z); root.add(bracket);
      var bolt = AM.cyl(.018, .018, .10, 5, M.brass, false);
      bolt.position.set(-8.0, .43, z); root.add(bolt);
    }
    // A duct climb behind the room on the right.
    var ductMat = M.duct;
    var duct = new T.Group();
    var vert = AM.box(.44, 3.3, .36, ductMat, true, .0018);
    vert.position.set(3.8, 1.7, -4.3); duct.add(vert);
    for (var b = 0; b < 6; b++) {
      var band = AM.box(.50, .035, .42, M.steelDark, false);
      band.position.set(3.8, .3 + b * .55, -4.3); duct.add(band);
    }
    var elbow = AM.box(.44, .42, .62, ductMat, true, .0018);
    elbow.position.set(3.8, 3.44, -4.0); duct.add(elbow);
    var horiz = AM.box(.44, .36, 2.0, ductMat, true, .0018);
    horiz.position.set(3.8, 3.44, -3.0); duct.add(horiz);
    var mouth = AM.box(.62, .54, .08, M.steelDark, false);
    mouth.position.set(3.8, 3.44, -2.0); duct.add(mouth);
    AM.louver(duct, .50, .4, .04, M.steelPale, .28).position.set(3.8, 3.44, -1.97);
    root.add(duct);
    // Small side pipe with a pressure gauge near the hidden door.
    var gauge = new T.Group();
    var dial = AM.cyl(.10, .10, .035, 16, M.cream, true, .001);
    dial.rotation.x = Math.PI * .5; gauge.add(dial);
    var needle = AM.box(.012, .07, .008, M.redPaint, false); needle.position.z = .022; needle.rotation.z = -.7; gauge.add(needle);
    var ring = new T.Mesh(new T.TorusGeometry(.105, .012, 5, 16), M.brass); ring.rotation.x = Math.PI * .5; ring.position.z = .018; gauge.add(ring);
    gauge.position.set(-5.18, 2.35, -4.6); gauge.rotation.y = .24; root.add(gauge);
    // Barrel farm / crates tucked behind the right wall.
    barrel(root, 7.55, -4.0, .62, 'rust', 5);
    barrel(root, 7.18, -4.16, .55, 'blue', 7);
    crate(root, 4.8, -5.6, .8, .6, .63, .45, 8);
    crate(root, 7.95, 3.15, .9, .7, .74, -.18, 9);
    crate(root, -6.95, -3.55, .7, .52, .56, .3, 10);
    // A few cables on the concrete.
    root.add(cable([new T.Vector3(3.8, .03, 2.8), new T.Vector3(3.3, .025, 3.9), new T.Vector3(2.4, .025, 4.5), new T.Vector3(1.6, .02, 4.4)], .018, M.cable, 18));
    root.add(cable([new T.Vector3(-5.55, .03, 2.55), new T.Vector3(-4.8, .02, 3.2), new T.Vector3(-4.1, .015, 3.5)], .015, M.cable, 12));
    // Steam vents: add visible mouths; effects.js will animate puffs.
    var ventPositions = [
      { p: new T.Vector3(5.1, .82, 3.3), q: new T.Vector3(0, .2, 0) },
      { p: new T.Vector3(-5.68, .5, 3.15), q: new T.Vector3(0, .1, 0) },
      { p: new T.Vector3(3.62, .48, -1.42), q: new T.Vector3(0, .1, 0) }
    ];
    ventPositions.forEach(function (v, idx) {
      AM.steamVents.push({ position: v.p, drift: v.q, seed: idx * 7 + 5 });
    });
    // A floor level grate hissing under the near-side catwalk.
    var steamGrate = AM.box(.62, .04, .34, M.grate, false);
    steamGrate.position.set(2.5, .025, 3.95); root.add(steamGrate);
    AM.steamVents.push({ position: new T.Vector3(2.5, .10, 3.95), drift: new T.Vector3(.05, .15, .02), seed: 31 });
    // Fallen tube / scrap detail
    var tube = new T.Mesh(new T.CylinderGeometry(.035, .035, .95, 8, 1, false), M.steelPale);
    tube.rotation.z = Math.PI * .5; tube.rotation.y = .7; tube.position.set(-1.9, .07, 5.55); root.add(tube);
    for (var s = 0; s < 4; s++) {
      var bit = new T.Mesh(new T.DodecahedronGeometry(.09, 0), M.concreteDark);
      bit.position.set(-3.6 + s * .18, .08, 4.65 + s * .08);
      bit.rotation.set(s, s * 2, .2); bit.castShadow = true; root.add(bit);
    }
    // small puddle with an oily reflection, purely graphic.
    var puddle = new T.Mesh(new T.CircleGeometry(.55, 24), new T.MeshBasicMaterial({ color: 0x172321, transparent: true, opacity: .45, depthWrite: false }));
    puddle.rotation.x = -Math.PI * .5; puddle.scale.set(1.3, .62, 1); puddle.position.set(4.35, .0075, 3.3); root.add(puddle);
    // Hanging red cable loops from overhead.
    root.add(cable([new T.Vector3(4.95, 6.0, -1.5), new T.Vector3(5.1, 5.2, -2.3), new T.Vector3(5.0, 4.0, -3.0)], .014, M.cable, 20));
    root.add(cable([new T.Vector3(-3.2, 4.2, -4.4), new T.Vector3(-4.2, 3.6, -4.0), new T.Vector3(-5.2, 3.9, -3.3)], .012, M.cable, 16));
    // utility junction boxes on the tall left wall
    for (var u = 0; u < 2; u++) {
      var bx = AM.box(.30, .42, .12, M.steelPale, true, .0014);
      bx.position.set(-5.66, 1.35 + u * .55, .9 - u * 1.3); root.add(bx);
      var conduit = AM.cyl(.018, .018, 1.1, 5, M.pipeRust, false);
      conduit.position.set(-5.65, .55, 1.35 - u * 1.3); root.add(conduit);
    }
    // pipe crossing the lower right wall into the slab
    pipeRun(root, [
      new T.Vector3(7.62, .48, 2.15), new T.Vector3(6.8, .48, 2.15),
      new T.Vector3(6.15, .48, 2.15), new T.Vector3(6.15, .18, 2.15)
    ], .055, M.pipeRust, true);
    // simple yellow-black ground barricade at the edge of the moving rail
    var rail = new T.Group();
    var legA = AM.box(.06, .5, .06, M.steelDark, false); legA.position.set(-.55, .25, 0);
    var legB = legA.clone(); legB.position.x = .55;
    var bar = AM.box(1.65, .12, .07, M.hazardStripe, false); bar.position.y = .47;
    rail.add(legA, legB, bar); rail.position.set(6.3, 0, 4.45); rail.rotation.y = .1; root.add(rail);
  }

  /* -----------------------------------------------------------------------
     suspended fragment / impossible geometry
     ----------------------------------------------------------------------- */
  function buildSuspendedFragment() {
    var g = new T.Group();
    g.position.set(3.85, 4.24, .25);
    root.add(g);
    // a thick broken concrete leaf, suspended by four cables from the gantry
    var body = AM.box(1.78, .42, 1.12, M.concreteB, true, .0023, { worldUV: true, uvScale: .34 });
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    var lip = AM.box(1.84, .06, 1.18, M.concrete, true, .0015);
    lip.position.y = .22; g.add(lip);
    var raw = AM.box(.08, .35, 1.0, M.concreteSoot, false);
    raw.position.x = .92; g.add(raw);
    // exposed bars
    for (var r = 0; r < 3; r++) {
      var bar = AM.cyl(.016, .016, .38, 5, M.rust, false);
      bar.rotation.z = Math.PI * .5; bar.position.set(1.04, (r - 1) * .10, 0); g.add(bar);
    }
    // hot impossible seam on the underside
    var seam = new T.Mesh(new T.PlaneGeometry(1.5, .035), AM.glow(0xcce98e, .8, { blending: T.AdditiveBlending }));
    seam.rotation.x = Math.PI * .5; seam.position.set(0, -.225, 0); g.add(seam);
    var seamHalo = AM.sprite(g, TEX.glowGreen, 0xd9ff9b, 2.1, .22); seamHalo.position.y = -.34;
    // suspension cables
    var anchors = [
      new T.Vector3(-.75, 1.90, -.44), new T.Vector3(.75, 1.90, -.44),
      new T.Vector3(-.75, 1.90, .44), new T.Vector3(.75, 1.90, .44)
    ];
    anchors.forEach(function (a) {
      var top = new T.Vector3(a.x * .92 + 1.2, a.y, a.z - 1.3);
      var c = cable([new T.Vector3(a.x, .22, a.z), new T.Vector3(a.x * .96 + .1, .95, a.z - .4), top], .015, M.cable, 16);
      g.add(c);
      var clamp = AM.box(.1, .055, .1, M.steelDark, false);
      clamp.position.copy(a).multiplyScalar(1); clamp.position.y = .25; g.add(clamp);
    });
    // little warning plate on the fragment
    var warn = AM.decal(.62, .31, TEX.signCaution, { opacity: .8, fog: false });
    warn.position.set(-.08, 0, .567); g.add(warn);
    // orbiting fragments
    var bits = [];
    var rnd = AM.rng(70);
    for (var i = 0; i < 5; i++) {
      var bit = new T.Mesh(new T.DodecahedronGeometry(.08 + rnd() * .06, 0), M.concreteDark);
      bit.userData = { angle: rnd() * Math.PI * 2, radius: 1.25 + rnd() * .7, y: (rnd() - .5) * .9, speed: .05 + rnd() * .09 };
      root.add(bit); bits.push(bit);
    }
    AM.suspended.push({ group: g, baseY: 4.24, seam: seam, seed: 4 });
    AM.addUpdater(function (dt, t) {
      g.position.y = 4.24 + Math.sin(t * .33) * .035;
      g.rotation.y = .10 + Math.sin(t * .11) * .012;
      g.rotation.z = Math.sin(t * .19 + .3) * .006;
      seam.material.opacity = .55 + .28 * (0.5 + 0.5 * Math.sin(t * .91));
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i], u = b.userData;
        var a = u.angle + t * u.speed;
        b.position.set(3.85 + Math.cos(a) * u.radius, 4.24 + u.y + Math.sin(t * .6 + i) * .10, .25 + Math.sin(a) * u.radius);
        b.rotation.x = t * .12 + i; b.rotation.y = t * .15;
      }
    });
  }

  /* -----------------------------------------------------------------------
     atmosphere-adjacent props & control room staging
     ----------------------------------------------------------------------- */
  function buildThresholds() {
    // safety rail crossing over the sliding floor track
    var g = new T.Group(); root.add(g);
    var postGeo = new T.CylinderGeometry(.035, .045, 1.0, 6);
    for (var i = 0; i < 3; i++) {
      var post = new T.Mesh(postGeo, M.steelPale); post.position.set(1.65 + i * 1.1, .5, 2.6); post.castShadow = true; g.add(post);
    }
    var line = AM.cyl(.03, .03, 2.3, 6, M.steelPale, false);
    line.rotation.z = Math.PI * .5; line.position.set(2.75, .96, 2.6); g.add(line);
    var line2 = line.clone(); line2.position.y = .62; line2.material = M.hazardStripe; g.add(line2);
    addDecal(root, TEX.stencilArrow, .95, .45, 1.95, .02, 3.05, 'up', .65).rotation.z = -Math.PI * .5;
    // sign leaning against the rail
    var lean = signPlate(root, TEX.signAuth, 1.05, .53, 1.22, .34, 3.45, .35, { frame: true, depth: .04 });
    lean.rotation.x = -.18; lean.rotation.z = .05;
    return g;
  }


  /* -----------------------------------------------------------------------
     forecourt: sector pylon, service trench, wall plant
     ----------------------------------------------------------------------- */
  function buildForecourt() {
    var g = new T.Group(); root.add(g);

    // --- sector pylon / sign monolith ------------------------------------
    var pyl = new T.Group();
    pyl.position.set(-5.15, 0, 5.45);
    pyl.rotation.y = .42;
    g.add(pyl);
    var foot = AM.box(1.38, .13, .92, M.blackMetal, false);
    foot.position.y = .065; foot.receiveShadow = true; pyl.add(foot);
    var body = AM.box(1.18, 2.82, .62, M.concreteB, true, .0024, { worldUV: true, uvScale: .35 });
    body.position.y = 1.46; body.castShadow = true; body.receiveShadow = true; pyl.add(body);
    var cap = AM.box(1.28, .12, .72, M.concrete, true, .0018);
    cap.position.y = 2.93; cap.castShadow = true; pyl.add(cap);
    // blade-like shoulder
    var shoulder = AM.box(1.24, .42, .66, M.concreteDark, true, .0018);
    shoulder.position.set(0, 3.16, -.01); shoulder.castShadow = true; pyl.add(shoulder);
    var top = AM.box(1.02, .13, .55, M.steelDark, false);
    top.position.y = 3.43; pyl.add(top);
    // base hazard band and bolts
    var hz = AM.box(1.20, .18, .015, M.hazardStripe, false);
    hz.position.set(0, .34, .318); pyl.add(hz);
    [-1, 1].forEach(function (s) {
      for (var b = 0; b < 4; b++) {
        var bolt = AM.cyl(.022, .022, .025, 6, M.brass, false);
        bolt.rotation.x = Math.PI * .5; bolt.position.set(s * .42, .72 + b * .5, .323); pyl.add(bolt);
      }
    });
    // large enamel sign
    var plate = AM.box(1.44, .74, .075, M.steelDark, true, .0018);
    plate.position.set(0, 1.98, .36); plate.castShadow = true; pyl.add(plate);
    var sign = AM.decal(1.36, .66, TEX.signMaze, { opacity: 1, fog: false });
    sign.position.set(0, 1.98, .402); pyl.add(sign);
    var signHalo = AM.sprite(pyl, TEX.glowGreen, 0xdcf3a5, 1.5, .10);
    signHalo.position.set(0, 1.98, .39);
    // additional stencilled instruction
    var route = AM.decal(.82, .34, TEX.stencilArrow, { opacity: .5, fog: false });
    route.position.set(0, 1.10, .323); pyl.add(route);
    var noEntry = AM.decal(.55, .24, TEX.signAuth, { opacity: .75, fog: false });
    noEntry.position.set(0, 2.62, .323); pyl.add(noEntry);
    // little roof lamp on a bracket
    var lampArm = AM.box(.08, .08, .48, M.steelDark, false);
    lampArm.position.set(.44, 3.28, .28); pyl.add(lampArm);
    var lampShade = new T.Mesh(new T.CylinderGeometry(.16, .08, .15, 12, 1, true), M.steelDark);
    lampShade.position.set(.44, 3.15, .48); lampShade.rotation.x = .3; pyl.add(lampShade);
    var lampBulb = AM.sphere(.055, 8, 6, AM.basic(0xffcd8d, { toneMapped: false }), false);
    lampBulb.position.set(.44, 3.10, .50); pyl.add(lampBulb);
    var lampGlow = AM.sprite(pyl, TEX.glowWarm, 0xffbe7b, .85, .24);
    lampGlow.position.set(.44, 3.07, .52);
    // rust streaks and service cable
    var stain = AM.decal(.58, .75, TEX.rust, { opacity: .4, fog: false });
    stain.position.set(-.38, .84, .324); pyl.add(stain);
    var cableRun = cable([new T.Vector3(-.55, .02, 2.6), new T.Vector3(-.45, .015, 3.6), new T.Vector3(.1, .02, 4.25)], .014, M.cable, 16);
    g.add(cableRun);
    AM.pylon = pyl;

    // --- service trench ---------------------------------------------------
    var tr = new T.Group();
    tr.position.set(1.55, 0, 5.82);
    tr.rotation.y = .08;
    g.add(tr);
    var tw = 3.15, td = .92;
    // raised metal-edged kerb
    var kerbMat = M.steelDark;
    [[0, td * .5 + .05, tw + .18, .12], [0, -td * .5 - .05, tw + .18, .12]].forEach(function (p) {
      var k = AM.box(p[2], .075, p[3], kerbMat, false);
      k.position.set(p[0], .037, p[1]); tr.add(k);
    });
    [[tw * .5 + .05, 0, td + .18], [-tw * .5 - .05, 0, td + .18]].forEach(function (p) {
      var k = AM.box(.12, .075, p[2], kerbMat, false);
      k.position.set(p[0], .037, p[1]); tr.add(k);
    });
    var dark = AM.box(tw, .035, td, M.blackPlastic, false);
    dark.position.y = .025; tr.add(dark);
    // interior pipes and a faint green machine glow
    var pipeA = AM.cyl(.055, .055, tw - .18, 8, M.pipeGreen, false);
    pipeA.rotation.z = Math.PI * .5; pipeA.position.set(0, .055, .20); tr.add(pipeA);
    var pipeB = AM.cyl(.035, .035, tw - .18, 8, M.pipeRust, false);
    pipeB.rotation.z = Math.PI * .5; pipeB.position.set(0, .07, -.18); tr.add(pipeB);
    var glowBar = new T.Mesh(new T.CylinderGeometry(.012, .012, tw - .3, 5), AM.basic(0xbcdb83, { toneMapped: false }));
    glowBar.rotation.z = Math.PI * .5; glowBar.position.set(0, .09, -.34); tr.add(glowBar);
    var trenchGlow = AM.sprite(tr, TEX.glowGreen, 0xa8c67d, 2.2, .12); trenchGlow.position.y = .15;
    // grating: a full map plus real cross straps
    var gtex = TEX.grate.clone(); gtex.needsUpdate = true; gtex.wrapS = gtex.wrapT = T.RepeatWrapping; gtex.repeat.set(5, 2);
    var gmat = AM.toon(0xffffff, { map: gtex, gradientMap: AM.gradHard, rim: .02 });
    var grate = new T.Mesh(new T.PlaneGeometry(tw - .15, td - .12), gmat);
    grate.rotation.x = -Math.PI * .5; grate.position.y = .085; tr.add(grate);
    for (var gb = 0; gb < 3; gb++) {
      var strap = AM.box(tw - .16, .018, .025, M.steelDark, false);
      strap.position.set(0, .092, -.26 + gb * .26); tr.add(strap);
    }
    // hazard edges and caution plates
    var hEdge = AM.box(tw, .010, .13, M.hazardStripe, false);
    hEdge.position.set(0, .09, td * .5 + .10); tr.add(hEdge);
    var hEdge2 = hEdge.clone(); hEdge2.position.z = -td * .5 - .10; tr.add(hEdge2);
    var edgeGlow = AM.sprite(tr, TEX.glowWarm, 0xffba70, 1.1, .10); edgeGlow.position.set(-1.2, .18, .52);
    // two little service lamps on the kerb
    warningLamp(tr, -1.45, .14, .68, 0xffa45a, .7);
    warningLamp(tr, 1.45, .14, .68, 0xff5a3c, .7);
    // a louvered vent at the trench edge, to motivate the steam
    var vent = ventBlock(tr, -.8, .3, -.64, .50, .26, .07, 'front', 44);
    // dark service puddle / leak
    var puddle = new T.Mesh(new T.CircleGeometry(.38, 18), new T.MeshBasicMaterial({ color: 0x0b1210, transparent: true, opacity: .5, depthWrite: false }));
    puddle.rotation.x = -Math.PI * .5; puddle.scale.set(1.6, .55, 1); puddle.position.set(-2.1, .008, .38); tr.add(puddle);
    AM.steamVents.push({ position: new T.Vector3(1.55 - .8, .18, 5.82 - .64), drift: new T.Vector3(.08, .14, .05), seed: 51 });
    AM.steamVents.push({ position: new T.Vector3(1.55 + .9, .16, 5.82 + .1), drift: new T.Vector3(-.04, .13, .06), seed: 57 });
    AM.trench = tr;

    // bollards along the clean edge of the apron
    [-1.1, .55, 2.2].forEach(function (x, i) {
      var bol = new T.Group();
      var post = AM.cyl(.045, .055, .68, 8, M.steelDark, true, .0013);
      post.position.y = .34; bol.add(post);
      var cap = AM.cyl(.06, .06, .04, 8, M.hazardStripe, false);
      cap.position.y = .70; bol.add(cap);
      var refl = AM.sphere(.026, 6, 4, M.ledAmber, false); refl.position.y = .62; bol.add(refl);
      bol.position.set(x, 0, 7.05); root.add(bol);
    });

    // --- large exhaust fan on the flank wall ------------------------------
    var fanG = new T.Group();
    fanG.position.set(-5.69, 2.30, .70);
    fanG.rotation.y = Math.PI * .5;
    g.add(fanG);
    var plate = AM.box(1.25, 1.15, .10, M.steelDark, true, .0018);
    plate.castShadow = true; fanG.add(plate);
    var hole = AM.cyl(.52, .52, .03, 32, M.blackPlastic, false);
    hole.rotation.x = Math.PI * .5; hole.position.z = .065; fanG.add(hole);
    var rim = new T.Mesh(new T.TorusGeometry(.53, .045, 8, 36), M.steelPale);
    rim.position.z = .09; fanG.add(rim);
    var rim2 = new T.Mesh(new T.TorusGeometry(.46, .012, 5, 28), M.steelDark);
    rim2.position.z = .12; fanG.add(rim2);
    var fanPivot = new T.Group(); fanPivot.position.z = .075; fanG.add(fanPivot);
    for (var fb = 0; fb < 6; fb++) {
      var blade = AM.box(.38, .30, .018, M.steelPale, false);
      blade.position.set(.16, 0, .02);
      blade.rotation.z = fb * Math.PI / 3 + .3;
      blade.rotation.y = .45;
      var bHolder = new T.Group(); bHolder.rotation.z = fb * Math.PI / 3;
      var bl = AM.box(.40, .27, .015, M.steelPale, false);
      bl.position.x = .17; bl.rotation.y = .5; bHolder.add(bl);
      fanPivot.add(bHolder);
    }
    var hub = AM.cyl(.11, .11, .08, 12, M.steelDark, false);
    hub.rotation.x = Math.PI * .5; hub.position.z = .07; fanPivot.add(hub);
    // protective cage: concentric rings + spokes
    var cage = new T.Group(); fanG.add(cage);
    [.52, .38, .23].forEach(function (r) {
      var ring = new T.Mesh(new T.TorusGeometry(r, .008, 4, 32), M.steelDark);
      ring.position.z = .16; cage.add(ring);
    });
    for (var spk = 0; spk < 8; spk++) {
      var sp = AM.cyl(.007, .007, 1.04, 4, M.steelDark, false);
      sp.rotation.z = spk * Math.PI / 4; sp.position.z = .16; cage.add(sp);
    }
    var fanStain = AM.decal(.52, .34, TEX.rust, { opacity: .4, fog: false });
    fanStain.position.set(-.35, -.40, .061); fanG.add(fanStain);
    var fanSwitch = AM.box(.20, .30, .16, M.steelPale, true, .0011);
    fanSwitch.position.set(.78, -.30, .10); fanG.add(fanSwitch);
    var swLabel = AM.decal(.16, .09, TEX.signCaution, { opacity: .9, fog: false });
    swLabel.position.set(.78, -.25, .185); fanG.add(swLabel);
    // duct rising to the catwalk, with a rain cap
    var duct = new T.Group(); fanG.add(duct);
    var ductBody = AM.box(.42, 2.1, .38, M.duct, true, .0016);
    ductBody.position.set(.42, 1.58, .0); duct.add(ductBody);
    for (var db = 0; db < 4; db++) {
      var band = AM.box(.48, .035, .44, M.steelDark, false);
      band.position.set(.42, .75 + db * .55, .0); duct.add(band);
    }
    var rainCap = AM.box(.62, .06, .55, M.steelDark, false);
    rainCap.position.set(.42, 2.65, .0); duct.add(rainCap);
    AM.wallFan = fanPivot;
    AM.addUpdater(function (dt, t) { if (fanPivot) fanPivot.rotation.z = t * 1.85; });

    // --- floor banner / directional paint ---------------------------------
    var floorArrow = AM.decal(1.2, .6, TEX.stencilArrow, { opacity: .5, fog: false });
    floorArrow.rotation.x = -Math.PI * .5; floorArrow.rotation.z = -.25;
    floorArrow.position.set(2.35, .021, 4.72); g.add(floorArrow);
    var floorMaze = AM.decal(1.35, .68, TEX.stencilMaze, { opacity: .22, fog: false });
    floorMaze.rotation.x = -Math.PI * .5;
    floorMaze.position.set(-2.25, .022, 6.85); g.add(floorMaze);


    // green fluorescent wash at the entrance — cold institutional light
    makeFixture({
      x: -1.72, y: 2.97, z: 2.22, len: 1.45, color: 0x85ce36,
      anchorY: 3.72, light: true, lightColor: 0x77ab38,
      intensity: .55, distance: 3.2, flicker: true, seed: 77, halo: .30
    });
    // green tube along the flank wall, above the fan
    makeFixture({
      x: -5.28, y: 2.85, z: .72, len: 1.55, ry: Math.PI * .5,
      color: 0x80c33d, anchorY: 3.35, light: true, lightColor: 0x70a33a,
      intensity: .45, distance: 4.0, flicker: true, seed: 23, halo: .24
    });

    AM.forecourt = g;
  }


  /* -----------------------------------------------------------------------
     containment field paint on the apron
     ----------------------------------------------------------------------- */
  function buildContainmentGraphics() {
    var S = 2048, c = AM.canvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.translate(S * .5, S * .5);
    var rnd = AM.rng(251);
    var paint = 'rgba(234,220,164,.78)';
    var dim = 'rgba(220,211,169,.43)';
    var red = 'rgba(196,68,42,.53)';
    // big broken containment ring
    g.strokeStyle = paint; g.lineWidth = 10; g.setLineDash([46, 28, 16, 28]);
    g.beginPath(); g.arc(0, 0, 790, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = dim; g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 818, 0, Math.PI * 2); g.stroke();
    // secondary rings with gaps
    g.setLineDash([110, 54]);
    g.strokeStyle = dim; g.lineWidth = 7;
    g.beginPath(); g.arc(0, 0, 690, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = paint; g.lineWidth = 14;
    g.setLineDash([24, 22]);
    g.beginPath(); g.arc(0, 0, 648, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    // tick ring
    for (var i = 0; i < 48; i++) {
      var a = i / 48 * Math.PI * 2;
      var long = i % 6 === 0;
      g.strokeStyle = i % 4 === 0 ? paint : dim; g.lineWidth = long ? 7 : 4;
      g.beginPath();
      g.moveTo(Math.cos(a) * (long ? 560 : 588), Math.sin(a) * (long ? 560 : 588));
      g.lineTo(Math.cos(a) * 622, Math.sin(a) * 622);
      g.stroke();
    }
    // radial crosshairs
    g.strokeStyle = dim; g.lineWidth = 2;
    [0, Math.PI * .5, Math.PI, Math.PI * 1.5].forEach(function (a) {
      g.beginPath();
      g.moveTo(Math.cos(a) * 150, Math.sin(a) * 150);
      g.lineTo(Math.cos(a) * 540, Math.sin(a) * 540); g.stroke();
    });
    // big inverted FBC triangle around the complex
    g.strokeStyle = 'rgba(220,208,161,.42)'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(-420, -170); g.lineTo(420, -170); g.lineTo(0, 440); g.closePath(); g.stroke();
    // segmented hazard arcs at four quadrants
    for (var q = 0; q < 4; q++) {
      var a0 = q * Math.PI * .5 + .20, a1 = a0 + .42;
      g.strokeStyle = q % 2 ? red : paint;
      g.lineWidth = 27;
      g.beginPath(); g.arc(0, 0, 745, a0, a1); g.stroke();
      g.strokeStyle = 'rgba(33,32,26,.55)'; g.lineWidth = 9;
      g.beginPath(); g.arc(0, 0, 745, a0, a1); g.stroke();
    }
    // inward chevrons at cardinal points
    function chevron(angle, r, size, color) {
      g.save(); g.translate(Math.cos(angle) * r, Math.sin(angle) * r); g.rotate(angle + Math.PI * .5);
      g.strokeStyle = color; g.lineWidth = 11;
      g.beginPath(); g.moveTo(-size, 0); g.lineTo(0, size * .66); g.lineTo(size, 0); g.stroke();
      g.restore();
    }
    chevron(-Math.PI * .5, 862, 34, paint);
    chevron(Math.PI * .5, 862, 34, paint);
    chevron(0, 862, 34, paint);
    chevron(Math.PI, 862, 34, paint);
    // labels, oriented toward the front of the base
    g.fillStyle = paint;
    g.font = '700 40px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    g.textAlign = 'center';
    g.fillText('F E D E R A L   B U R E A U   O F   C O N T R O L', 0, 596);
    g.font = '600 30px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    g.fillStyle = dim;
    g.fillText('A - 0 7   /   C O N T A I N M E N T   F I E L D   /   R E C O N F I G U R A T I O N', 0, 640);
    g.fillStyle = red;
    g.font = '700 26px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    g.fillText('AUTHORIZED PERSONNEL ONLY — DO NOT STEP INSIDE THE MARKED FIELD', 0, 682);
    // small survey marks
    for (var m = 0; m < 18; m++) {
      var ma = rnd() * Math.PI * 2, mr = 660 + rnd() * 220;
      g.strokeStyle = 'rgba(204,195,151,.28)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(Math.cos(ma) * mr - 5, Math.sin(ma) * mr);
      g.lineTo(Math.cos(ma) * mr + 5, Math.sin(ma) * mr);
      g.moveTo(Math.cos(ma) * mr, Math.sin(ma) * mr - 5);
      g.lineTo(Math.cos(ma) * mr, Math.sin(ma) * mr + 5); g.stroke();
    }
    // wear and scuffing
    g.globalCompositeOperation = 'destination-out';
    for (var w = 0; w < 600; w++) {
      var wx = (rnd() - .5) * 1750, wy = (rnd() - .5) * 1750;
      g.fillStyle = 'rgba(0,0,0,' + (.2 + rnd() * .7) + ')';
      g.fillRect(wx, wy, 1 + rnd() * 16, 1 + rnd() * 3);
    }
    for (var d2 = 0; d2 < 160; d2++) {
      g.beginPath(); g.arc((rnd() - .5) * 1750, (rnd() - .5) * 1750, .5 + rnd() * 5, 0, Math.PI * 2); g.fillStyle = 'rgba(0,0,0,.8)'; g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    var tx = AM.tex(c, { aniso: 8 });
    var dec = AM.decal(13.4, 13.4, tx, { opacity: .96, fog: false });
    dec.rotation.x = -Math.PI * .5;
    dec.position.set(AM.L.room.cx, .0065, AM.L.room.cz);
    root.add(dec);
    // a second, tighter caution arc at the immediate threshold of the room
    var ring = new T.Mesh(new T.RingGeometry(3.25, 3.32, 80, 1, 0.12, 1.85), new T.MeshBasicMaterial({
      color: 0xb7a76d, transparent: true, opacity: .16, side: T.DoubleSide,
      depthWrite: false, blending: T.AdditiveBlending, toneMapped: false
    }));
    ring.rotation.x = -Math.PI * .5; ring.position.set(AM.L.room.cx, .018, AM.L.room.cz); root.add(ring);
    AM.containmentPaint = dec;
  }

  /* -----------------------------------------------------------------------
     transformer station / right forecourt mass
     ----------------------------------------------------------------------- */
  function buildTransformer() {
    var g = new T.Group(); g.position.set(7.55, 0, 4.65); g.rotation.y = -.14; root.add(g);
    var pad = AM.box(2.05, .12, 1.42, M.concreteDark, true, .0018, { worldUV: true, uvScale: .5 });
    pad.position.y = .06; pad.receiveShadow = true; pad.castShadow = true; g.add(pad);
    var hz = AM.box(1.95, .12, .02, M.hazardStripe, false);
    hz.position.set(0, .13, .72); g.add(hz);
    // main tank body with cooling fins
    var body = AM.box(1.45, .94, .92, M.pipeGreen, true, .0020, { worldUV: false });
    body.position.y = .62; body.castShadow = true; body.receiveShadow = true; g.add(body);
    for (var f = 0; f < 7; f++) {
      var finL = AM.box(.04, .72, .80, M.steelDark, false);
      finL.position.set(-.78 - f * .035, .62, 0); g.add(finL);
      var finR = finL.clone(); finR.position.x = .78 + f * .035; g.add(finR);
    }
    var top = AM.box(1.54, .07, 1.0, M.steelDark, true, .0015);
    top.position.y = 1.11; g.add(top);
    // front panel details
    var panel = AM.box(.92, .62, .025, M.steelPale, false);
    panel.position.set(-.10, .62, .47); g.add(panel);
    var vent = AM.louver(g, .58, .30, .025, M.steelDark, .35);
    vent.position.set(.22, .78, .49);
    for (var b = 0; b < 4; b++) {
      var bolt = AM.cyl(.024, .024, .02, 6, M.brass, false);
      bolt.rotation.x = Math.PI * .5; bolt.position.set(-.50 + (b % 2) * .78, .34 + Math.floor(b / 2) * .52, .485); g.add(bolt);
    }
    var sign = AM.decal(.45, .30, TEX.signCaution, { opacity: .95, fog: false });
    sign.position.set(-.33, .67, .486); g.add(sign);
    // red indicator lamp and a hot cable
    var red = AM.sphere(.035, 8, 5, M.ledRed, false);
    red.position.set(.55, .38, .49); g.add(red);
    var redHalo = AM.sprite(g, TEX.glowRed, 0xff5a3b, .55, .2); redHalo.position.set(.55, .38, .50);
    // ceramic insulators
    [-.45, 0, .45].forEach(function (ix, idx) {
      var stack = new T.Group(); stack.position.set(ix, 1.18, 0);
      for (var s = 0; s < 3; s++) {
        var disc = AM.cyl(.09 - s * .008, .12 - s * .008, .045, 10, M.ceramic, false);
        disc.position.y = s * .07; stack.add(disc);
      }
      var term = AM.cyl(.028, .035, .14, 6, M.brass, false); term.position.y = .22; stack.add(term);
      g.add(stack);
    });
    // lightning mast
    var mast = AM.cyl(.035, .048, 2.3, 8, M.steelDark, false);
    mast.position.set(.82, 1.18 + 1.15, -.25); mast.castShadow = true; g.add(mast);
    var arm = AM.box(.55, .035, .035, M.steelPale, false);
    arm.position.set(.55, 2.70, -.25); g.add(arm);
    var beacon = AM.sphere(.045, 8, 6, M.ledRed, false);
    beacon.position.set(.82, 3.52, -.25); g.add(beacon);
    var beaconGlow = AM.sprite(g, TEX.glowRed, 0xff4f32, .8, .26); beaconGlow.position.set(.82, 3.52, -.25);
    // thick cables to the gatehouse
    var c1 = cable([new T.Vector3(.45, 1.3, -.15), new T.Vector3(-.4, 1.7, -1.6), new T.Vector3(-1.1, 2.0, -2.8), new T.Vector3(-1.4, 2.25, -3.3)], .020, M.cable, 26);
    g.add(c1);
    var c2 = cable([new T.Vector3(.0, 1.3, -.2), new T.Vector3(-.65, 1.18, -.9), new T.Vector3(-1.1, .2, -1.4), new T.Vector3(-1.15, .03, -1.6)], .016, M.cable, 22);
    g.add(c2);
    // ground coil / spare cable
    for (var c = 0; c < 3; c++) {
      var coil = new T.Mesh(new T.TorusGeometry(.28 + c * .015, .012, 4, 18), M.cable);
      coil.rotation.x = Math.PI * .5; coil.position.set(-.82, .04 + c * .02, 1.0); g.add(coil);
    }
    // warning barrier
    var bar = new T.Group();
    var legA = AM.box(.05, .62, .05, M.steelDark, false); legA.position.set(-.7, .31, 1.2);
    var legB = legA.clone(); legB.position.x = .7;
    var stripe = AM.box(1.55, .12, .06, M.hazardStripe, false); stripe.position.set(0, .57, 1.2);
    bar.add(legA, legB, stripe); g.add(bar);
    // low step and hazard decal
    var padStencil = AM.decal(1.3, .55, TEX.stencilFire, { opacity: .38, fog: false });
    padStencil.rotation.x = -Math.PI * .5; padStencil.position.set(0, .013, .95); g.add(padStencil);
    AM.transformer = g;
    return g;
  }


  /* -----------------------------------------------------------------------
     rear service chimney / back plant
     ----------------------------------------------------------------------- */
  function buildRearPlant() {
    var g = new T.Group(); g.position.set(7.25, 0, -5.35); root.add(g);
    var pad = AM.box(1.45, .18, 1.35, M.concreteDark, true, .0018, { worldUV: true, uvScale: .5 });
    pad.position.y = .09; pad.castShadow = true; pad.receiveShadow = true; g.add(pad);
    var base = AM.box(1.05, 1.25, 1.05, M.concreteB, true, .0022, { worldUV: true, uvScale: .38 });
    base.position.y = .80; base.castShadow = true; base.receiveShadow = true; g.add(base);
    var mid = AM.box(.84, 1.25, .84, M.concreteB, true, .0022, { worldUV: true, uvScale: .38 });
    mid.position.y = 1.98; mid.castShadow = true; mid.receiveShadow = true; g.add(mid);
    var top = AM.box(.63, 1.00, .63, M.concrete, true, .0022, { worldUV: true, uvScale: .38 });
    top.position.y = 3.08; top.castShadow = true; top.receiveShadow = true; g.add(top);
    var lip = AM.box(.80, .12, .80, M.steelDark, true, .0015);
    lip.position.y = 3.63; g.add(lip);
    var mouth = AM.cyl(.25, .32, .43, 12, M.blackPlastic, false);
    mouth.position.y = 3.86; g.add(mouth);
    var mouthRim = new T.Mesh(new T.TorusGeometry(.32, .035, 5, 18), M.steelPale);
    mouthRim.rotation.x = Math.PI * .5; mouthRim.position.y = 4.08; g.add(mouthRim);
    // steel bands and ladder rungs
    for (var b = 0; b < 5; b++) {
      var band = AM.box(1.08 - b * .09, .035, 1.08 - b * .09, M.steelDark, false);
      band.position.y = .72 + b * .68; g.add(band);
    }
    var lad = AM.ladder(g, -.59, .35, .35, 3.1, .30, M.steelDark, 0);
    // hot-air / exhaust pipe from the rear wall
    var pipe = AM.cyl(.10, .10, 2.0, 8, M.pipeRust, false);
    pipe.rotation.z = Math.PI * .5; pipe.position.set(-1.20, 1.55, -.10); g.add(pipe);
    var elbow = new T.Mesh(new T.TorusGeometry(.22, .10, 6, 12, Math.PI * .5), M.pipeRust);
    elbow.rotation.y = Math.PI * .5; elbow.position.set(-.72, 1.55, -.10); g.add(elbow);
    var beacon = AM.sphere(.055, 8, 6, M.ledRed, false);
    beacon.position.set(.66, 4.06, .0); g.add(beacon);
    var bhalo = AM.sprite(g, TEX.glowRed, 0xff4a31, .8, .27); bhalo.position.set(.66, 4.06, .0);
    var stackSign = AM.decal(.48, .24, TEX.signCaution, { opacity: .8, fog: false });
    stackSign.position.set(0, 1.7, .54); g.add(stackSign);
    var stackSeal = AM.decal(.27, .27, TEX.sealPaint, { opacity: .4, fog: false });
    stackSeal.position.set(0, 2.55, .44); g.add(stackSeal);
    var vent = ventBlock(g, .46, 2.2, .50, .35, .60, .06, 'front', 29);
    // scaffold/ladder rail and a drip stain
    var stain = AM.decal(.42, .8, TEX.rust, { opacity: .4, fog: false });
    stain.position.set(-.36, .8, .53); g.add(stain);
    AM.steamVents.push({ position: new T.Vector3(7.25, 4.15, -5.35), drift: new T.Vector3(.03, .4, .01), seed: 63 });
    AM.rearPlant = g;
    // service conduit across the ground to the transformer
    root.add(AM.tube([new T.Vector3(7.1, .03, -4.7), new T.Vector3(7.0, .035, -2.4), new T.Vector3(7.35, .03, 1.8), new T.Vector3(7.55, .03, 3.8)], .025, M.cable, 30, 5));
  }

  /* -----------------------------------------------------------------------
     assembly + animation
     ----------------------------------------------------------------------- */
  AM.buildMaze = function (scene) {
    M = AM.mats; TEX = AM.TEX; L = AM.L;
    root = new T.Group(); root.name = 'MAZE';
    scene.add(root);
    var structures = buildStandingStructure();
    buildMovingWalls();
    buildGantry();
    buildCatwalk();
    buildSearchlight();
    buildSuspendedFragment();
    buildIndustry();
    buildThresholds();
    buildForecourt();
    buildContainmentGraphics();
    buildTransformer();
    buildRearPlant();

    // Clean boundary light fixtures & a further hidden exit at the rear.
    // A couple of low warm markers help the eye trace the maze circulation.
    warningLamp(root, -1.55, .14, 4.55, 0xffc26c, .8);
    warningLamp(root, 5.4, .14, -2.9, 0xff633e, .8);

    // Moving walls: mechanically slow, with long dwells; never on a metronome.
    AM.addUpdater(function (dt, t) {
      for (var i = 0; i < AM.movingWalls.length; i++) {
        var mw = AM.movingWalls[i];
        var s = AM.mechanical(t, mw.period, mw.phase);
        var off = (s - .5) * 2 * mw.amp;
        mw.lastOffset = off;
        if (mw.axis === 'x') {
          mw.group.position.x = mw.baseX + off;
          mw.group.position.z = mw.baseZ;
        } else {
          mw.group.position.z = mw.baseZ + off;
          mw.group.position.x = mw.baseX;
        }
        // Faint mechanical judder only while travelling.
        var moving = Math.sin((AM.mod(t / mw.period + mw.phase, 1) - .06) / .29) > .02;
        if (moving) {
          mw.group.position.y = Math.sin(t * 23.0 + i * 2.3) * .0018;
        } else {
          mw.group.position.y = 0;
        }
      }
      // searchlight lens is a slow breathing star
      if (AM.lights.searchLamp) AM.lights.searchLamp.intensity = 1.2 + Math.sin(t * .5) * .15;
      if (AM.lights.redLamp) AM.lights.redLamp.intensity = .55 + (Math.sin(t * 1.25) > .65 ? .4 : 0);
      // red beacons turning
      AM.beacons.forEach(function (b) {
        if (b.cone) b.cone.rotation.y = t * 1.1;
        if (b.light) b.light.intensity = .6 + .3 * Math.sin(t * 2.0);
      });
      // ashtray ember breathing
      if (AM.ashtrayGlow) AM.ashtrayGlow.material.opacity = .15 + .10 * (0.5 + 0.5 * Math.sin(t * .8));
      if (AM.guideSeam) {
        var gv = .52 + .22 * Math.sin(t * 1.6) + (AM.hash2(19, Math.floor(t * 7.0)) > .94 ? -.28 : 0);
        AM.guideSeam.opacity = Math.max(.16, gv);
        if (AM.guideBeacon) AM.guideBeacon.material.opacity = .24 + .18 * (0.5 + 0.5 * Math.sin(t * 2.1 + 1.2));
      }
    });
    return root;
  };
})();
