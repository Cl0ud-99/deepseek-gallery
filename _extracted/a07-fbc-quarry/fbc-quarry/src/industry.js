/* =========================================================================
   FBC QUARRY 07 — gantry crane, incline, mine rail, searchlights & plant
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE, Tex = FQ.Tex, PAL = FQ.PAL, L = FQ.L;
  var K = FQ.industry = {};
  var mats = {};
  var rng = FQ.rng(0xc4a9e);
  var updaters = [];
  var searchlights = [];
  var steamVents = [];
  var cartState = null;
  var beltMats = [];
  var craneState = null;
  var armState = null;
  var warningLamps = [];

  var P = { lift: L.plateauY, pitFloor: -3.1, pitLedges: [-0.58, -1.82, -3.10] };

  function cloneMap(map, rx, ry) {
    var t = map.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); return t;
  }

  function makeMaterials() {
    mats.concrete = FQ.toon(0xaead9f, {
      map: cloneMap(Tex.concrete, 2.0, 1.2), bumpMap: cloneMap(Tex.concrete, 2.0, 1.2), bumpScale: .027,
      gradientMap: FQ.gradSoft
    });
    mats.concreteDark = FQ.toon(0x747970, {
      map: cloneMap(Tex.concreteDark, 1.7, 1.0), bumpMap: cloneMap(Tex.concreteDark, 1.7, 1.0), bumpScale: .03,
      gradientMap: FQ.gradHard
    });
    mats.steel = FQ.steel(0x4b5555, .36);
    mats.steelLight = FQ.steel(0x75807d, .3);
    mats.iron = FQ.iron(0x1b2122, .47);
    mats.rust = FQ.toon(0x8f5c3e, { map: cloneMap(Tex.rust, 1.5, 1.1), bumpMap: cloneMap(Tex.rust, 1.5, 1.1), bumpScale: .03 });
    mats.rustDark = FQ.toon(0x52382a, { map: cloneMap(Tex.rust, 1.2, 1.2), gradientMap: FQ.gradHard });
    mats.yellow = FQ.toon(0x6a5c34, { gradientMap: FQ.gradHard, rim: .05, rimColor: 0xb69a4b });
    mats.craneSteel = FQ.toon(0x3f4640, { map: cloneMap(Tex.steel, 1.8, 1.8), bumpMap: cloneMap(Tex.steel, 1.8, 1.8), bumpScale: .012, gradientMap: FQ.gradHard, rim: .08, rimColor: 0xa88165 });
    mats.porcelain = FQ.toon(0x8e948a, { gradientMap: FQ.gradSoft });
    mats.excavator = FQ.toon(0xa28545, { map: cloneMap(Tex.rust, 1.1, .8), bumpMap: cloneMap(Tex.rust, 1.1, .8), bumpScale: .02, gradientMap: FQ.gradHard, rim: .12, rimColor: 0xd0a766 });
    mats.hazard = FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 2, .4), bumpMap: cloneMap(Tex.hazard, 2, .4), bumpScale: .006 });
    mats.rubber = FQ.std(0x101414, { roughness: .8, metalness: .1 });
    mats.cable = FQ.iron(0x101414, .65);
    mats.belt = FQ.toon(0x333733, { map: cloneMap(Tex.grate, 1.8, 8) });
    mats.belt.map.wrapS = mats.belt.map.wrapT = T.RepeatWrapping;
    beltMats.push(mats.belt);
    mats.amber = FQ.basic(0xffb66b, { transparent: true, opacity: .86, toneMapped: false });
    mats.amberSolid = FQ.basic(0xffc585, { toneMapped: false });
    mats.red = FQ.basic(0xff422a, { transparent: true, opacity: .82, blending: T.AdditiveBlending, toneMapped: false });
    mats.coldLamp = FQ.basic(0xd9eff5, { toneMapped: false });
    mats.warmGlass = new T.MeshPhysicalMaterial({ color: 0x3d3223, metalness: .1, roughness: .1, transparent: true, opacity: .5, clearcoat: 1, envMapIntensity: 1.1, side: T.DoubleSide, depthWrite: false });
    mats.tread = FQ.toon(0x161a1a, { gradientMap: FQ.gradHard });
    mats.steelDark = mats.iron;
    mats.black = FQ.toon(0x0b0f10, { gradientMap: FQ.gradHard });
    mats.cream = FQ.toon(0xc9c3b0, { gradientMap: FQ.gradSoft });
    mats.wood = FQ.toon(0x5c4935, { map: cloneMap(Tex.rust, 1, 1.4), gradientMap: FQ.gradHard });
    mats.grate = FQ.std(0x2c3433, { map: cloneMap(Tex.grate, 1.5, 2), metalness: .4, roughness: .5 });
    mats.glass = new T.MeshPhysicalMaterial({ color: 0x233434, metalness: .15, roughness: .06, transparent: true, opacity: .38, clearcoat: 1, envMapIntensity: 1.2, side: T.DoubleSide, depthWrite: false });
    mats.paper = FQ.toon(0xd3c9b2, { side: T.DoubleSide, gradientMap: FQ.gradSoft });
  }

  function tube(a, b, r, mat, seg) {
    var dir = b.clone().sub(a); var len = dir.length();
    var c = FQ.cyl(r, r, len, seg || 6, mat, false);
    c.position.copy(a).add(b).multiplyScalar(.5);
    c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    return c;
  }

  function longBox(a, b, w, h, mat, outline) {
    var dir = b.clone().sub(a); var len = dir.length();
    var m = new T.Mesh(new T.BoxGeometry(w, h, len), mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    var z = dir.clone().normalize();
    var up = new T.Vector3(0, 1, 0);
    if (Math.abs(z.dot(up)) > .97) up.set(0, 0, 1);
    var x = new T.Vector3().crossVectors(up, z).normalize();
    var y = new T.Vector3().crossVectors(z, x).normalize();
    m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
    if (outline) FQ.outline(m, .0014);
    return m;
  }

  function lattice(parent, a, b, width, thickness, mat, segs) {
    var dir = b.clone().sub(a); var len = dir.length();
    var g = new T.Group(); g.position.copy(a);
    g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
    parent.add(g);
    var h = width / 2;
    var corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
    for (var c = 0; c < 4; c++) {
      var post = new T.Mesh(new T.BoxGeometry(thickness, len, thickness), mat);
      post.position.set(corners[c][0], len / 2, corners[c][1]); g.add(post);
    }
    var n = segs || Math.max(3, Math.round(len / 1.1));
    for (var s = 0; s < n; s++) {
      var y0 = s / n * len, y1 = (s + 1) / n * len;
      for (var q = 0; q < 4; q++) {
        var a1 = new T.Vector3(corners[q][0], y0, corners[q][1]);
        var b1 = new T.Vector3(corners[(q + 1) % 4][0], y0, corners[(q + 1) % 4][1]);
        var c1 = new T.Vector3(corners[q][0], y1, corners[q][1]);
        g.add(tube(a1, b1, thickness * .45, mat, 4));
        g.add(tube(a1, new T.Vector3(corners[(q + 1) % 4][0], y1, corners[(q + 1) % 4][1]), thickness * .42, mat, 4));
      }
      var brace = new T.Mesh(new T.BoxGeometry(width + thickness, thickness * .7, thickness * .7), mat);
      brace.position.set(0, y0, 0); g.add(brace);
    }
    var cap = new T.Mesh(new T.BoxGeometry(width + thickness, thickness * .7, thickness * .7), mat);
    cap.position.set(0, len, 0); g.add(cap);
    return g;
  }

  function beamBetween(a, b, w, h, mat, outline) {
    return longBox(a, b, w, h, mat, outline);
  }

  /* ----------------------------------------------------------------- crane */
  function buildCrane(scene) {
    var g = new T.Group(); g.position.set(-9.4, P.lift, -3.6); scene.add(g);
    // crawler tracks
    for (var tr = -1; tr <= 1; tr += 2) {
      var tread = FQ.box(1.15, .56, 3.7, mats.tread, true, .0022);
      tread.position.set(tr * 1.22, .29, 0); g.add(tread);
      for (var cleat = 0; cleat < 12; cleat++) {
        var cl = FQ.box(1.24, .06, .17, mats.steelDark || mats.iron, false);
        cl.position.set(tr * 1.22, .52, -1.6 + cleat * .29); g.add(cl);
      }
      var hub = FQ.cyl(.26, .26, 1.36, 10, mats.rustDark, false);
      hub.rotation.z = Math.PI / 2; hub.position.set(tr * 1.22, .31, .65); g.add(hub);
    }
    var bed = FQ.box(3.0, .42, 2.3, mats.rust, true, .002); bed.position.y = .7; g.add(bed);
    var deck = FQ.box(2.55, .15, 2.1, mats.steelDark || mats.iron, false); deck.position.y = .98; g.add(deck);
    // operator cab
    var cab = FQ.box(1.28, 1.18, 1.28, mats.rust, true, .0017); cab.position.set(1.1, 1.66, -.7); g.add(cab);
    var cabGlass = FQ.box(1.0, .6, .035, mats.warmGlass, false); cabGlass.position.set(1.1, 1.78, -.045); g.add(cabGlass);
    var cabGlass2 = FQ.box(.035, .6, .85, mats.warmGlass, false); cabGlass2.position.set(1.755, 1.78, -.7); g.add(cabGlass2);
    var cabGlow = FQ.sprite(g, Tex.glow, 0xffb473, 1.0, .08); cabGlow.position.set(1.1, 1.75, -.25);
    // turntable + ladder
    var turntable = FQ.cyl(1.0, 1.15, .24, 16, mats.steel, true, .0015); turntable.position.y = 1.15; g.add(turntable);
    var mastBase = new T.Group(); mastBase.position.y = 1.22; g.add(mastBase);
    var mastTop = new T.Vector3(0, 7.55, 0);
    lattice(mastBase, new T.Vector3(0, 0, 0), mastTop, .82, .075, mats.craneSteel, 9);
    for (var hz = 0; hz < 3; hz++) {
      var band = FQ.box(.88, .16, .88, mats.hazard, false); band.position.y = .55 + hz * 2.1; mastBase.add(band);
    }
    // ladder rungs up the mast
    for (var r = 0; r < 18; r++) {
      var rung = FQ.box(.4, .025, .025, mats.iron, false);
      rung.position.set(-.57, .45 + r * .38, .0); mastBase.add(rung);
    }
    var topCap = FQ.box(1.12, .18, 1.12, mats.iron, true, .0015); topCap.position.y = 7.62; g.add(topCap);
    var apex = FQ.box(.5, .55, .5, mats.yellow, false); apex.position.y = 8.05; g.add(apex);
    // slow-swinging boom
    var boomPivot = new T.Group(); boomPivot.position.set(0, 7.75, 0);
    boomPivot.rotation.y = .82; g.add(boomPivot);
    var boomTipLocal = new T.Vector3(0, 1.5, 9.4);
    var boomBottom = new T.Vector3(0, 0, 0);
    var boom = lattice(boomPivot, boomBottom, boomTipLocal, .6, .07, mats.craneSteel, 7); boom.userData.noOutline = true;
    for (var bz = 0; bz < 4; bz++) {
      var bband = FQ.box(.64, .08, .14, mats.hazard, false); bband.position.set(0, .26 + bz * 2.2, .4 + bz * 2.2); bband.rotation.x = -.16; boomPivot.add(bband);
    }
    var boomCenter = boomBottom.clone().lerp(boomTipLocal, .5);
    // boom walkway and pulley housing
    var walk = new T.Mesh(new T.BoxGeometry(.55, .035, 8.9), mats.grate || mats.steel); walk.position.set(0, 1.1, 4.7); walk.rotation.x = -.16; boomPivot.add(walk);
    var head = FQ.box(.6, .8, .85, mats.iron, true, .0015); head.position.copy(boomTipLocal); boomPivot.add(head);
    var pulley = FQ.cyl(.23, .23, .72, 14, mats.steel, true, .001); pulley.rotation.z = Math.PI / 2; pulley.position.copy(boomTipLocal).add(new T.Vector3(0, -.45, 0)); boomPivot.add(pulley);
    // back stay cables
    var mastPeak = new T.Vector3(0, 9.0, 0);
    var stayMat = mats.cable;
    boomPivot.add(tube(new T.Vector3(0, 2.1, 8.9), new T.Vector3(0, 3.0, .2), .022, stayMat, 4));
    boomPivot.add(tube(new T.Vector3(0, 2.1, 8.9), new T.Vector3(-.45, 2.9, .2), .022, stayMat, 4));
    var apexTube = FQ.cyl(.08, .08, 2.6, 5, mats.iron, false); apexTube.position.set(0, 8.65, 0); boomPivot.add(apexTube);
    // counter-jib
    var cj = FQ.box(.5, .3, 3.2, mats.craneSteel, true, .0012); cj.position.set(0, 7.85, -2.15); boomPivot.add(cj);
    var cw = FQ.box(1.2, 1.15, .7, mats.concreteDark, true, .0018); cw.position.set(0, 7.45, -3.5); boomPivot.add(cw);
    // hanging hook and cable
    var hookPivot = new T.Group(); hookPivot.position.set(0, 1.4, 6.4); boomPivot.add(hookPivot);
    var cable = new T.Mesh(new T.CylinderGeometry(.014, .014, 4.4, 5), mats.cable); cable.position.y = -2.2; hookPivot.add(cable);
    var hookBlock = FQ.box(.28, .4, .22, mats.rust, true, .0012); hookBlock.position.y = -4.45; hookPivot.add(hookBlock);
    var hook = new T.Mesh(new T.TorusGeometry(.13, .035, 5, 12, Math.PI * 1.35), mats.steel); hook.rotation.z = .3; hook.position.set(.02, -4.9, 0); hookPivot.add(hook);
    // warning beacon on cab and mast
    var beaconA = FQ.sphere(.09, 8, 6, FQ.basic(0xff3a25), false); beaconA.position.set(1.1, 2.3, -.7); g.add(beaconA);
    warningLamps.push(beaconA);
    var workLight = FQ.box(.22, .15, .12, mats.iron, false); workLight.position.set(1.1, 2.1, -.02); g.add(workLight);
    var lampLens = FQ.box(.17, .1, .015, mats.amberSolid, false); lampLens.position.set(1.1, 2.1, .05); g.add(lampLens);
    var workGlow = FQ.sprite(g, Tex.glow, 0xffb46e, 1.6, .2); workGlow.position.set(1.1, 2.11, .16);
    // work lamp glow kept emissive only
    // a little sign on the crawler
    var sign = FQ.textPlane(.75, .32, makeTextTex('FBC 07', 'LIFT 14T', 512, 220, '#d1c7ad', '#1f2422'), {});
    sign.position.set(0, .94, 1.22); g.add(sign);
    // cable to hook from head
    var cable2 = tube(new T.Vector3(0, 1.4, 6.4), new T.Vector3(0, -.45, 8.8), .012, mats.cable, 3); boomPivot.add(cable2);

    var startRot = boomPivot.rotation.y;
    craneState = { group: g, boomPivot: boomPivot, hookPivot: hookPivot, rot: startRot };
    updaters.push(function (dt, t) {
      boomPivot.rotation.y = startRot + Math.sin(t * .033) * .055;
      hookPivot.rotation.z = Math.sin(t * .43 + 1.4) * .035;
      hookPivot.rotation.x = Math.cos(t * .31) * .022;
      beaconA.material.color.setHex(Math.sin(t * 1.7) > .35 ? 0xff3b26 : 0x461512);
    });
  }

  /* ------------------------------------------------------------ searchlights */
  function buildSearchlight(scene, pos, height, color, sweepCenter, beamColor, beamOpacity, label) {
    var g = new T.Group(); g.position.copy(pos); scene.add(g);
    var foot = FQ.box(1.2, .3, 1.2, mats.concreteDark, true, .002); foot.position.y = .15; g.add(foot);
    lattice(g, new T.Vector3(0, .3, 0), new T.Vector3(0, height, 0), .72, .063, mats.steel, Math.max(3, Math.round(height / 1.1)));
    var deck = FQ.box(1.25, .15, 1.25, mats.steel, true, .0013); deck.position.y = height; g.add(deck);
    for (var r = 0; r < 7; r++) {
      var railPost = FQ.box(.035, .65, .035, mats.iron, false); railPost.position.set(-.55 + r * .185, height + .33, .57); g.add(railPost);
    }
    var rail = FQ.box(1.2, .032, .032, mats.iron, false); rail.position.set(0, height + .63, .57); g.add(rail);
    var pivot = new T.Group(); pivot.position.y = height + .35; g.add(pivot);
    var yoke = FQ.box(1.5, .13, .34, mats.iron, true, .0011); yoke.position.y = 0; g.add(yoke);
    var lampHousing = FQ.box(1.25, .62, .45, mats.steelDark || mats.iron, true, .0014); lampHousing.position.set(0, .2, .35); pivot.add(lampHousing);
    for (var lx = -1; lx <= 1; lx += 2) {
      var lens = FQ.cyl(.155, .155, .06, 18, FQ.basic(0xcddfe1), true, .0006);
      lens.rotation.x = Math.PI / 2; lens.position.set(lx * .32, .22, .55); pivot.add(lens);
      var lensGlow = FQ.sprite(pivot, Tex.spark, color, .55, .18); lensGlow.position.set(lx * .32, .22, .65);
    }
    var back = FQ.box(1.2, .16, .12, mats.yellow, false); back.position.set(0, -.13, .35); pivot.add(back);
    // warning stripe on housing
    var stripe = FQ.box(1.1, .08, .02, mats.hazard, false); stripe.position.set(0, -.02, .58); pivot.add(stripe);
    // beam and actual light
    var beam = FQ.beamCone(beamColor, 1.7, .075, 11, beamOpacity);
    beam.rotation.x = Math.PI / 2; beam.position.set(0, .2, 7.3); pivot.add(beam);
    var cone2 = FQ.beamCone(beamColor, .45, .035, 10, beamOpacity * 1.4);
    cone2.rotation.x = Math.PI / 2; cone2.position.set(0, .2, 5.4); pivot.add(cone2);
    var spot = new T.SpotLight(color, 4.0, 34, .13, .78, 1.2);
    spot.position.set(0, .2, .5); pivot.add(spot);
    var target = new T.Object3D(); target.position.set(0, -7.5, 18); pivot.add(target); spot.target = target;
    var smallBeacon = FQ.sphere(.075, 8, 6, FQ.basic(0xff3b25), false); smallBeacon.position.set(0, height + 1.0, 0); g.add(smallBeacon);
    warningLamps.push(smallBeacon);
    var s = { group: g, pivot: pivot, spot: spot, target: target, beam: beam, cone2: cone2, base: sweepCenter || 0, amp: .35, speed: .035 + rng() * .018, phase: rng() * 6.28, tilt: (label && label.indexOf('NORTH') >= 0) ? .37 : .17 };
    searchlights.push(s);
    updaters.push(function (dt, t) {
      pivot.rotation.y = (sweepCenter || 0) + Math.sin(t * s.speed + s.phase) * s.amp;
      pivot.rotation.x = s.tilt + Math.sin(t * s.speed * .7 + s.phase) * .028;
      var fl = .91 + Math.sin(t * 8.0 + s.phase) * .05;
      beam.material.uniforms.uOpacity.value = beamOpacity * fl;
      cone2.material.uniforms.uOpacity.value = beamOpacity * 1.8 * fl;
      smallBeacon.material.color.setHex(Math.sin(t * 1.4 + s.phase) > .2 ? 0xff3e29 : 0x4a1612);
    });
    // little sign at base
    var sign = FQ.textPlane(.7, .45, makeTextTex('FLOOD 07', label || 'ARC / 220V', 384, 256, '#d0c7ae', '#202725'), {});
    sign.position.set(0, 1.0, .62); g.add(sign);
    return g;
  }

  /* ---------------------------------------------------------------- conveyor */
  function buildConveyor(scene) {
    var start = new T.Vector3(-4.1, P.pitFloor + .45, -2.6);
    var end = new T.Vector3(-9.7, 2.65, -6.4);
    var dir = end.clone().sub(start); var len = dir.length();
    var group = new T.Group(); group.position.copy(start);
    group.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir.clone().normalize());
    scene.add(group);
    // truss sides
    for (var side = -1; side <= 1; side += 2) {
      group.add(longLocal(new T.Vector3(side * .62, .15, 1.8), new T.Vector3(side * .62, .15, len - 1.9), .09, .09, mats.yellow));
      group.add(longLocal(new T.Vector3(side * .62, .85, 1.8), new T.Vector3(side * .62, .85, len - 1.9), .065, .065, mats.iron));
      for (var s = 0; s <= 8; s++) {
        var z = 1.8 + s * (len - 3.7) / 8;
        group.add(longLocal(new T.Vector3(side * .62, .15, z), new T.Vector3(side * .62, .85, z), .055, .055, mats.iron));
        if (s < 8) group.add(longLocal(new T.Vector3(side * .62, .85, z), new T.Vector3(side * .62, .15, z + (len - 3.7) / 8), .045, .045, mats.iron));
      }
    }
    for (var c = 0; c < 9; c++) {
      var zc = 1.8 + c * (len - 3.7) / 8;
      group.add(longLocal(new T.Vector3(-.62, .5, zc), new T.Vector3(.62, .5, zc), .07, .07, mats.iron));
    }
    // belt bed and belt surface
    var bed = new T.Mesh(new T.BoxGeometry(1.25, .2, len - 1.4), mats.iron); bed.position.set(0, .94, len / 2); group.add(bed);
    var belt = new T.Mesh(new T.BoxGeometry(1.02, .07, len - 1.8), mats.belt); belt.position.set(0, 1.055, len / 2); group.add(belt);
    // side skirts
    for (var sk = -1; sk <= 1; sk += 2) {
      var skirt = FQ.box(.04, .28, len - 1.6, mats.rust, false); skirt.position.set(sk * .59, 1.15, len / 2); group.add(skirt);
    }
    // support legs every few meters
    for (var l = 1; l < 6; l++) {
      var t = l / 6; var p = start.clone().lerp(end, t);
      var footY = t < .5 ? P.pitFloor : (t < .8 ? -1.82 : P.lift);
      var legH = p.y - footY;
      var leg = FQ.box(.12, legH, .12, mats.iron, true, .0012); leg.position.set(p.x, footY + legH / 2, p.z + .5); scene.add(leg);
      var cross = FQ.box(1.2, .07, .07, mats.iron, false); cross.position.set(p.x, p.y - .7, p.z + .5); group.add(cross);
    }
    // head house at the upper end
    var hs = new T.Group(); hs.position.copy(end); scene.add(hs);
    var hopper = FQ.box(2.1, 1.5, 1.9, mats.concreteDark, true, .0018); hopper.position.set(0, .75, .8); hs.add(hopper);
    var roof = FQ.box(2.3, .14, 2.1, mats.iron, true, .0012); roof.position.set(0, 1.55, .8); hs.add(roof);
    var chute = FQ.box(.8, .5, .9, mats.rust, true, .0014); chute.position.set(0, 1.1, 1.9); hs.add(chute);
    var window = FQ.box(.55, .34, .03, mats.warmGlass, false); window.position.set(-.55, 1.05, 1.76); hs.add(window);
    var light = FQ.sprite(hs, Tex.glow, 0xffb06b, 1.1, .12); light.position.set(-.55, 1.06, 1.84);
    // warning stripe at headhouse
    var stripe = FQ.box(1.8, .16, .02, mats.hazard, false); stripe.position.set(0, .3, 1.77); hs.add(stripe);
    // head-house glow kept emissive
    // belt animation
    updaters.push(function (dt, t) {
      mats.belt.map.offset.y = (t * .08) % 1;
    });
    // steam vent data at hopper
    steamVents.push({ pos: new T.Vector3(end.x + .6, end.y + 1.1, end.z + 1.0), dir: new T.Vector3(.1, 1, .1), size: 1.0, rate: .55, color: 0xc8d7d3 });
    var sign = FQ.textPlane(.9, .6, makeTextTex('CONVEYOR 04', 'ORE / CLASSIFIED', 512, 360, '#c8bea3', '#1b211e'), {});
    sign.position.set(1.07, 1.0, .8); sign.rotation.y = Math.PI / 2; hs.add(sign);
    return group;
  }

  function longLocal(a, b, w, h, mat) {
    var dir = b.clone().sub(a); var len = dir.length();
    var m = new T.Mesh(new T.BoxGeometry(w, h, len), mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir.normalize());
    return m;
  }

  /* --------------------------------------------------------------- mine rail */
  function buildRail(scene) {
    var x = 9.15;
    var z0 = -9.0, z1 = 8.7;
    var trackY = P.lift + .08;
    // portal structure at the back
    var portal = new T.Group(); portal.position.set(x, P.lift, z0 - .65); scene.add(portal);
    var surround = FQ.box(3.0, 2.7, .4, mats.concreteDark, true, .002); surround.position.set(0, 1.35, 0); portal.add(surround);
    var hole = FQ.box(1.92, 2.08, .1, mats.black || mats.steelDark, false); hole.position.set(0, 1.18, .24); portal.add(hole);
    var arch = new T.Mesh(new T.TorusGeometry(1.05, .09, 6, 28, Math.PI), mats.rust); arch.position.set(0, 1.9, .312); portal.add(arch);
    var lintel = FQ.box(2.6, .4, .25, mats.hazard, true, .0012); lintel.position.set(0, 2.4, .28); portal.add(lintel);
    var portalLamp = FQ.sphere(.09, 8, 6, FQ.basic(0xffa064), false); portalLamp.position.set(1.2, 2.4, .42); portal.add(portalLamp);
    warningLamps.push(portalLamp);
    var portalSign = FQ.textPlane(.95, .5, Tex.warnNoEntry, { side: T.FrontSide }); portalSign.position.set(-2.0, 1.55, .3); portalSign.rotation.y = -.2; portal.add(portalSign);
    // track ties and rails
    var tieCount = 30;
    var tieGeo = new T.BoxGeometry(1.7, .1, .22);
    var tieMesh = new T.InstancedMesh(tieGeo, mats.wood || mats.rustDark, tieCount);
    var mtx = new T.Matrix4();
    for (var i = 0; i < tieCount; i++) {
      mtx.makeTranslation(x, trackY, z0 + i * (z1 - z0) / (tieCount - 1));
      tieMesh.setMatrixAt(i, mtx);
    }
    tieMesh.castShadow = true; tieMesh.receiveShadow = true; scene.add(tieMesh);
    for (var side = -1; side <= 1; side += 2) {
      var rail = longBox(new T.Vector3(x + side * .46, trackY + .12, z0), new T.Vector3(x + side * .46, trackY + .12, z1), .075, .09, mats.steelLight, false);
      scene.add(rail);
    }
    // buffer stop at the front
    var buf = FQ.box(1.4, .42, .3, mats.rust, true, .0014); buf.position.set(x, trackY + .25, z1 - .1); scene.add(buf);
    for (var b = -1; b <= 1; b += 2) {
      var bpost = FQ.box(.13, .72, .13, mats.steel, false); bpost.position.set(x + b * .55, trackY + .38, z1 - .1); scene.add(bpost);
    }
    var bs = FQ.box(1.05, .13, .06, mats.hazard, false); bs.position.set(x, trackY + .62, z1 - .26); scene.add(bs);
    // mine cart
    var cart = buildMineCart(); cart.group.position.set(x, trackY + .17, z1 - 2.2); scene.add(cart.group);
    // cable / overhead wire along rail
    for (var pole = 0; pole < 3; pole++) {
      var pz = -5.7 + pole * 4.1;
      var poleGroup = new T.Group(); poleGroup.position.set(x + 1.5, P.lift, pz); scene.add(poleGroup);
      var mast = FQ.cyl(.08, .11, 2.7, 6, mats.rust, false); mast.position.y = 1.35; poleGroup.add(mast);
      var cross = FQ.box(.95, .07, .07, mats.iron, false); cross.position.set(-.4, 2.5, 0); poleGroup.add(cross);
      var ins = FQ.cyl(.06, .06, .08, 8, mats.porcelain, false); ins.position.set(-.55, 2.62, 0); poleGroup.add(ins);
    }
    // wire
    scene.add(FQ.tube([new T.Vector3(x + .95, P.lift + 2.58, -5.7), new T.Vector3(x + .95, P.lift + 2.32, -1.6), new T.Vector3(x + .95, P.lift + 2.58, 2.5), new T.Vector3(x + .95, P.lift + 2.32, 6.6)], .014, mats.cable, 40, 4));
    // warning sign on portal
    var sign = FQ.textPlane(1.35, .8, makeTextTex('RAIL 07', 'AUTHORIZED HAULAGE ONLY', 768, 384, '#d0c8af', '#222927'), {});
    sign.position.set(x - 2.0, 2.3, z0 - .2); sign.rotation.y = -.1; scene.add(sign);
    steamVents.push({ pos: new T.Vector3(x + .65, trackY + .7, z0 + .8), dir: new T.Vector3(.1, 1, 0), size: .7, rate: .9, color: 0xbfd4d0 });
    cartState = { cart: cart, z0: z0 + 1.8, z1: z1 - 3.2 };
    updaters.push(function (dt, t) {
      if (!cartState) return;
      var tt = (Math.sin(t * .055) * .5 + .5);
      var z = cartState.z0 + (cartState.z1 - cartState.z0) * tt;
      cart.group.position.z = z;
      cart.wheels.forEach(function (w) { w.rotation.x += dt * 1.1; });
      var dir = Math.cos(t * .055);
      cart.group.rotation.y = dir > 0 ? 0 : 0;
    });
  }

  function buildMineCart() {
    var g = new T.Group();
    var bed = FQ.box(1.15, .18, 1.5, mats.rustDark, true, .0013); bed.position.y = .05; g.add(bed);
    var body = FQ.box(1.0, .63, 1.35, mats.rust, true, .0016); body.position.y = .42; g.add(body);
    var inner = FQ.box(.83, .06, 1.16, mats.tread, false); inner.position.y = .72; g.add(inner);
    for (var side = -1; side <= 1; side += 2) {
      var rib = FQ.box(.045, .5, 1.25, mats.iron, false); rib.position.set(side * .5, .42, 0); g.add(rib);
      var rib2 = FQ.box(.045, .5, 1.25, mats.iron, false); rib2.position.set(side * .27, .42, 0); g.add(rib2);
    }
    var oreMat = mats.rustDark;
    for (var o = 0; o < 8; o++) {
      var chunk = new T.Mesh(new T.DodecahedronGeometry(.12 + rng() * .09, 0), oreMat);
      chunk.position.set((rng() - .5) * .65, .8 + rng() * .08, (rng() - .5) * .8);
      chunk.rotation.set(rng() * 3, rng() * 3, rng() * 3); g.add(chunk);
    }
    var lamp = FQ.box(.16, .12, .1, mats.iron, false); lamp.position.set(0, .78, .72); g.add(lamp);
    var lens = FQ.box(.12, .08, .02, mats.amberSolid, false); lens.position.set(0, .78, .78); g.add(lens);
    var glow = FQ.sprite(g, Tex.glow, 0xffa35f, .65, .18); glow.position.set(0, .78, .84);
    var wheels = [];
    for (var w = -1; w <= 1; w += 2) {
      for (var wz = -1; wz <= 1; wz += 2) {
        var wheel = FQ.cyl(.17, .17, .12, 12, mats.iron, true, .0008);
        wheel.rotation.z = Math.PI / 2; wheel.position.set(w * .55, .17, wz * .47); g.add(wheel); wheels.push(wheel);
      }
    }
    return { group: g, wheels: wheels };
  }

  /* --------------------------------------------------------------- transformer */
  function buildTransformer(scene) {
    var g = new T.Group(); g.position.set(9.1, P.lift, 4.3); scene.add(g);
    var pad = FQ.box(3.8, .22, 3.5, mats.concreteDark, true, .0018); pad.position.y = .11; g.add(pad);
    // chain link fence posts and wires around back
    for (var p = 0; p < 4; p++) {
      var px = -1.7 + (p % 2) * 3.4, pz = -1.55 + Math.floor(p / 2) * 3.1;
      var post = FQ.cyl(.04, .05, 1.5, 6, mats.steel, false); post.position.set(px, .95, pz); g.add(post);
    }
    var fenceMat = new T.LineBasicMaterial({ color: 0x4d5752, transparent: true, opacity: .4 });
    // transformers
    for (var i = 0; i < 3; i++) {
      var tx = -1.15 + i * 1.15;
      var tank = FQ.cyl(.42, .5, 1.65, 12, mats.rust, true, .0016); tank.position.set(tx, 1.05, -.25); g.add(tank);
      var lid = FQ.cyl(.55, .55, .12, 12, mats.steelDark || mats.iron, true, .0011); lid.position.set(tx, 1.94, -.25); g.add(lid);
      for (var fin = 0; fin < 4; fin++) {
        var f = FQ.box(.1, 1.25, .42, mats.rustDark, false);
        f.position.set(tx - .38 + fin * .25, 1.02, .35); g.add(f);
      }
      for (var ins = 0; ins < 3; ins++) {
        var bushing = FQ.cyl(.045, .065, .3, 8, mats.porcelain, false);
        bushing.position.set(tx - .18 + ins * .18, 2.18, -.3); g.add(bushing);
        var ring = FQ.cyl(.075, .075, .03, 8, mats.iron, false); ring.position.set(tx - .18 + ins * .18, 2.3, -.3); g.add(ring);
      }
      var hazard = FQ.box(.8, .18, .02, mats.hazard, false); hazard.position.set(tx, 1.02, .01); g.add(hazard);
    }
    // busbars / wires
    for (var b = 0; b < 3; b++) {
      var wire = FQ.tube([new T.Vector3(-1.15 + b * 1.15, 2.35, -.3), new T.Vector3(-1.15 + b * 1.15, 3.3, -.6), new T.Vector3(1.2, 3.1, -1.2), new T.Vector3(1.85, 2.65, -1.3)], .014, mats.cable, 20, 4);
      g.add(wire);
    }
    // high voltage warning sign
    var sign = FQ.textPlane(.95, 1.2, makeTextTex('HIGH VOLTAGE', 'FBC POWER / 13.8KV', 512, 640, '#1b1e1d', '#d1a62f'), {});
    sign.position.set(1.9, 1.15, .4); sign.rotation.y = -.68; g.add(sign);
    // crane-hung insulator / spark gap
    var insulator = FQ.group(g, 1.45, 2.05, .85);
    for (var u = 0; u < 5; u++) {
      var disc = FQ.cyl(.12, .12, .05, 12, mats.porcelain, false);
      disc.position.y = u * .13; insulator.add(disc);
    }
    var glow = FQ.sprite(g, Tex.spark, 0x9bd3e2, 1.0, .08); glow.position.set(1.45, 2.8, .85);
    var wire2 = FQ.tube([new T.Vector3(1.45, 2.8, .85), new T.Vector3(1.1, 3.4, -.1), new T.Vector3(-1.0, 3.0, -1.1)], .012, mats.cable, 18, 4); g.add(wire2);
    // oil drums and crates
    for (var d = 0; d < 3; d++) {
      var drum = FQ.cyl(.22, .22, .58, 10, d % 2 ? mats.rust : mats.concrete, true, .001); drum.position.set(-1.55 + d * .48, .57, 1.18); g.add(drum);
      var band = FQ.cyl(.235, .235, .04, 10, mats.iron, false); band.position.set(-1.55 + d * .48, .65, 1.18); g.add(band);
    }
    var sign2 = FQ.textPlane(.8, 1.0, Tex.warnContainment, { side: T.FrontSide }); sign2.position.set(-2.2, 1.4, .8); sign2.rotation.y = .25; g.add(sign2);
    // soft red warning light pole near pad
    var pole = FQ.cyl(.04, .04, 2.3, 6, mats.iron, false); pole.position.set(1.75, 1.15, 1.45); g.add(pole);
    var lamp = FQ.sphere(.07, 8, 6, FQ.basic(0xff4d2e), false); lamp.position.set(1.75, 2.3, 1.45); g.add(lamp);
    warningLamps.push(lamp);
    // transformer warning is emissive only
    updaters.push(function (dt, t) { lamp.material.color.setHex(Math.sin(t * 2.2 + .5) > .3 ? 0xff4d2e : 0x4b1a12); });
    steamVents.push({ pos: new T.Vector3(9.9, P.lift + 2.2, 3.2), dir: new T.Vector3(.6, 1, .1), size: .8, rate: .7, color: 0xbfd4d2 });
  }

  /* --------------------------------------------------------------- blast door */
  function buildBlastDoor(scene) {
    var g = new T.Group(); g.position.set(2.6, P.lift, -9.5); scene.add(g);
    var block = FQ.box(5.6, 3.6, 3.4, mats.concrete, true, .0022); block.position.y = 1.8; g.add(block);
    var cap = FQ.box(5.9, .2, 3.7, mats.concreteDark, true, .0018); cap.position.y = 3.68; g.add(cap);
    var doorWall = FQ.box(4.35, 3.25, .12, mats.concreteDark, true, .0015); doorWall.position.set(-.25, 1.62, 1.73); g.add(doorWall);
    // giant circular blast door
    var doorGroup = new T.Group(); doorGroup.position.set(-.4, 1.7, 1.82); g.add(doorGroup);
    var door = FQ.cyl(1.24, 1.24, .18, 32, mats.steelDark || mats.iron, true, .0018);
    door.rotation.x = Math.PI / 2; doorGroup.add(door);
    var ring = new T.Mesh(new T.TorusGeometry(1.3, .055, 6, 48), mats.rust);
    ring.position.z = .1; doorGroup.add(ring);
    var outerRing = new T.Mesh(new T.TorusGeometry(1.48, .04, 6, 48), mats.iron); outerRing.position.z = .03; doorGroup.add(outerRing);
    for (var b = 0; b < 12; b++) {
      var bolt = FQ.cyl(.04, .04, .08, 6, mats.brass, false); bolt.rotation.x = Math.PI / 2;
      var a = b * Math.PI / 6; bolt.position.set(Math.cos(a) * 1.16, Math.sin(a) * 1.16, .1); doorGroup.add(bolt);
    }
    // central wheel
    var wheel = new T.Group(); wheel.position.z = .18; doorGroup.add(wheel);
    var hub = FQ.cyl(.14, .14, .12, 12, mats.brass, false); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    for (var sp = 0; sp < 4; sp++) {
      var spoke = FQ.box(.08, 1.1, .06, mats.steel, false); spoke.rotation.z = sp * Math.PI / 2; wheel.add(spoke);
    }
    var glass = FQ.cyl(.13, .13, .02, 16, FQ.basic(0xd94a2f, { transparent: true, opacity: .55 }), false); glass.rotation.x = Math.PI / 2; glass.position.z = .2; wheel.add(glass);
    var warning = FQ.box(4.25, .32, .06, mats.hazard, false); warning.position.set(0, 3.34, 1.7); g.add(warning);
    var sign = FQ.textPlane(1.75, .85, makeTextTex('BLAST DOOR 04', 'PERMIT REQUIRED / FBC QUARRY 07', 1024, 512, '#d5c9ae', '#211f1d'), {});
    sign.position.set(1.55, 3.05, 1.81); g.add(sign);
    // red light and glowing slot
    var lamp = FQ.sphere(.11, 10, 8, FQ.basic(0xff3f25), false); lamp.position.set(-2.8, 3.2, 1.85); g.add(lamp); warningLamps.push(lamp);
    var lampGlow = FQ.sprite(g, Tex.glow, 0xff452c, 1.4, .28); lampGlow.position.set(-2.8, 3.2, 2.0);
    // blast-door warning is emissive only
    // pipes and vents leaving the bunker
    for (var p = 0; p < 3; p++) {
      var pipeStart = new T.Vector3(1.7 + p * .25, 3.5, .2);
      var pipeEnd = new T.Vector3(2.1 + p * .25, 3.5, -1.2);
      g.add(tube(pipeStart, pipeEnd, .07, mats.rust, 8));
      var elbow = new T.Mesh(new T.TorusGeometry(.22, .07, 6, 12, Math.PI / 2), mats.rust);
      elbow.rotation.x = Math.PI / 2; elbow.position.set(1.7 + p * .25, 3.5, .2); g.add(elbow);
    }
    var duct = FQ.box(.7, 1.4, .35, mats.steel, true, .0012); duct.position.set(2.35, 2.7, 1.82); g.add(duct);
    for (var v = 0; v < 5; v++) { var slat = FQ.box(.5, .04, .02, mats.iron, false); slat.position.set(2.35, 2.3 + v * .15, 2.0); g.add(slat); }
    // hazard step / walkway
    var step = FQ.box(4.0, .16, 1.0, mats.concreteDark, true, .0014); step.position.set(-.2, .11, 2.3); g.add(step);
    var stepHazard = FQ.box(3.4, .03, .22, mats.hazard, false); stepHazard.position.set(-.2, .21, 2.78); g.add(stepHazard);
    steamVents.push({ pos: new T.Vector3(2.0, P.lift + 3.6, -9.2), dir: new T.Vector3(.2, 1, .2), size: 1.0, rate: .8, color: 0xc2d2cf });
    var lamp2 = FQ.sphere(.08, 8, 6, FQ.basic(0xffb06d), false); lamp2.position.set(1.3, 1.4, 2.8); g.add(lamp2);
    var glow2 = FQ.sprite(g, Tex.glow, 0xffb165, 1.7, .15); glow2.position.set(1.3, 1.4, 2.9);
  }

  /* ---------------------------------------------------------------- staircase */
  function buildStairs(scene) {
    // main stair from west rim down to the first bench
    var start = new T.Vector3(-6.45, P.lift, -3.3);
    var end = new T.Vector3(-5.15, -.58, -3.3);
    var dir = end.clone().sub(start);
    var steps = 8;
    var g = new T.Group(); scene.add(g);
    for (var i = 0; i < steps; i++) {
      var ff = i / steps;
      var p = start.clone().lerp(end, ff);
      var step = FQ.box(1.1, .11, .38, mats.steel, true, .0011);
      step.position.set(p.x, p.y + .06, p.z + .19 + i * .38 * .0); g.add(step);
      step.position.z = start.z + .18 + i * .34;
      var support = FQ.box(1.0, .06, .06, mats.iron, false); support.position.set(p.x, p.y - .1, step.position.z); g.add(support);
      if (i % 2 === 0) {
        var post = FQ.box(.045, .85, .045, mats.iron, false); post.position.set(p.x - .58, p.y + .49, step.position.z); g.add(post);
        var post2 = post.clone(); post2.position.x = p.x + .58; g.add(post2);
      }
    }
    for (var side = -1; side <= 1; side += 2) {
      var rail = FQ.tube([new T.Vector3(start.x + side * .58, start.y + .9, start.z + .1), new T.Vector3(end.x + side * .58, end.y + .9, start.z + 2.8)], .033, mats.yellow, 12, 5);
      g.add(rail);
    }
    var platform = FQ.box(1.5, .16, 1.25, mats.steel, true, .0012); platform.position.set(end.x + .2, end.y + .03, end.z + 3.2); g.add(platform);
    // secondary stair on the east wall leading toward the water
    var start2 = new T.Vector3(5.25, -.58, 2.5), end2 = new T.Vector3(4.1, -1.82, 2.5);
    var g2 = new T.Group(); g2.position.set(0, 0, 0); scene.add(g2);
    for (var s2 = 0; s2 < 6; s2++) {
      var f2 = s2 / 6; var p2 = start2.clone().lerp(end2, f2);
      var st2 = FQ.box(.9, .1, .3, mats.rust, false); st2.position.set(p2.x, p2.y, p2.z + s2 * .32); g2.add(st2);
    }
    var ladder = FQ.group(g2, 4.0, -3.1, 2.1);
    for (var lr = 0; lr < 2; lr++) {
      var railPost = FQ.box(.04, 2.2, .04, mats.iron, false); railPost.position.set(lr * .55, 1.1, 0); ladder.add(railPost);
    }
    for (var lr2 = 0; lr2 < 8; lr2++) {
      var rung = FQ.box(.55, .03, .03, mats.iron, false); rung.position.set(.275, .25 + lr2 * .26, 0); ladder.add(rung);
    }
  }

  /* ----------------------------------------------------------------- excavator */
  function buildExcavator(scene) {
    var g = new T.Group(); g.position.set(-4.65, -1.8, 1.45); g.rotation.y = 1.36; scene.add(g);
    var under = FQ.box(2.1, .35, 1.15, mats.tread, true, .0015); under.position.y = .2; g.add(under);
    for (var t = -1; t <= 1; t += 2) {
      var track = FQ.box(.4, .5, 1.85, mats.tread, true, .0011); track.position.set(t * .85, .25, 0); g.add(track);
      for (var c = 0; c < 8; c++) { var ch = FQ.box(.44, .07, .13, mats.iron, false); ch.position.set(t * .85, .45, -.8 + c * .23); g.add(ch); }
    }
    var body = FQ.box(1.8, .9, 1.2, mats.excavator || mats.rust, true, .0018); body.position.set(-.15, .85, 0); g.add(body);
    var cab = FQ.box(.85, .85, .8, mats.excavator || mats.rust, true, .0014); cab.position.set(.55, 1.35, .05); g.add(cab);
    var cabGlass = FQ.box(.6, .46, .02, mats.warmGlass, false); cabGlass.position.set(.55, 1.45, .47); g.add(cabGlass);
    var beacon = FQ.sphere(.06, 8, 6, FQ.basic(0xff442a), false); beacon.position.set(.55, 1.87, .05); g.add(beacon); warningLamps.push(beacon);
    var boom = new T.Group(); boom.position.set(-1.2, 1.05, 0); g.add(boom);
    boom.add(FQ.box(2.1, .3, .34, mats.excavator, true, .0012)); 
    var boomMesh = boom.children[0]; boomMesh.position.set(-1.0, .22, 0); boomMesh.rotation.z = .22;
    var stick = new T.Group(); stick.position.set(-2.0, .35, 0); boom.add(stick);
    var stickMesh = FQ.box(1.8, .22, .3, mats.excavator, true, .0011); stickMesh.position.set(-.85, -.1, 0); stickMesh.rotation.z = -.46; stick.add(stickMesh);
    var bucket = new T.Group(); bucket.position.set(-1.75, -.42, 0); stick.add(bucket);
    var bmesh = FQ.box(.65, .5, .7, mats.rustDark, true, .0012); bmesh.position.set(-.2, -.2, 0); bucket.add(bmesh);
    for (var teeth = 0; teeth < 4; teeth++) {
      var tth = FQ.box(.22, .08, .08, mats.iron, false); tth.position.set(-.57, -.42, -.24 + teeth * .16); bucket.add(tth);
    }
    var hydraulic = FQ.cyl(.05, .05, 1.9, 6, mats.steel, false); hydraulic.position.set(-.9, .1, .22); hydraulic.rotation.z = .55; boom.add(hydraulic);
    var workLight = FQ.sprite(g, Tex.glow, 0xffb36a, 1.2, .16); workLight.position.set(.4, 1.6, .5);
    var headlamp = FQ.box(.16, .11, .04, mats.amberSolid, false); headlamp.position.set(-.9, 1.1, .6); g.add(headlamp);
    var headGlow = FQ.sprite(g, Tex.glow, 0xffb36a, .9, .2); headGlow.position.set(-.9, 1.1, .72);
    var armBeacon = FQ.sphere(.06, 6, 4, FQ.basic(0xff4128), false); armBeacon.position.set(-.2, 1.9, .0); g.add(armBeacon); warningLamps.push(armBeacon);
    // excavator work light kept emissive
    armState = { group: g, boom: boom, stick: stick, bucket: bucket };
    updaters.push(function (dt, t) {
      boom.rotation.z = Math.sin(t * .16) * .035;
      stick.rotation.z = .12 + Math.sin(t * .21 + 1.2) * .08;
      bucket.rotation.z = Math.sin(t * .25 + 2.6) * .12;
      beacon.material.color.setHex(Math.sin(t * 2.1 + 1) > .15 ? 0xff442a : 0x4b130e);
      point.intensity = .5 + Math.max(0, Math.sin(t * .16)) * .2;
    });
    // ore pile by excavator
    for (var o = 0; o < 10; o++) {
      var rock = new T.Mesh(new T.DodecahedronGeometry(.1 + rng() * .24, 0), mats.rustDark);
      rock.position.set(-1.2 + rng() * 1.4, -1.6 + rng() * .25, .8 + rng() * 1.1); rock.rotation.set(rng() * 3, rng() * 3, rng() * 3); g.add(rock);
    }
    return g;
  }

  /* -------------------------------------------------------------- pipe bridge */
  function buildPipes(scene) {
    // large pipe descending the back pit wall
    var mat = mats.rust;
    var pts = [
      new T.Vector3(-3.4, P.lift + .35, -6.35),
      new T.Vector3(-3.4, .0, -6.4),
      new T.Vector3(-3.4, -1.3, -6.3),
      new T.Vector3(-2.4, -1.9, -5.9),
      new T.Vector3(.9, -1.95, -5.55)
    ];
    var pipe = FQ.tube(pts, .17, mat, 40, 8); pipe.castShadow = true; scene.add(pipe);
    for (var i = 0; i < 4; i++) {
      var f = FQ.cyl(.23, .23, .12, 10, mats.iron, false);
      f.rotation.x = Math.PI / 2; f.position.set(-3.4, .5 - i * .85, -6.35); scene.add(f);
    }
    var valve = new T.Group(); valve.position.set(-2.4, -1.9, -5.9); scene.add(valve);
    var wheel = new T.Mesh(new T.TorusGeometry(.3, .035, 6, 20), mats.yellow); wheel.rotation.y = Math.PI / 2; valve.add(wheel);
    for (var s = 0; s < 3; s++) { var spoke = FQ.box(.6, .03, .03, mats.yellow, false); spoke.rotation.z = s * Math.PI / 3; valve.add(spoke); }
    // downward steam vent pipe at the elbow
    var vent = FQ.cyl(.1, .12, .5, 8, mats.iron, false); vent.rotation.z = Math.PI / 2; vent.position.set(-2.0, -2.1, -5.9); scene.add(vent);
    steamVents.push({ pos: new T.Vector3(-1.4, -1.95, -5.9), dir: new T.Vector3(1, .2, .1), size: 1.2, rate: 1.2, color: 0xd1dfdc });
    // horizontal pipe along right rim into the pit
    var pts2 = [new T.Vector3(7.1, P.lift + .3, 5.4), new T.Vector3(8.4, P.lift + .3, 5.4), new T.Vector3(8.4, .2, 5.4), new T.Vector3(8.4, -.1, 3.3)];
    scene.add(FQ.tube(pts2, .1, mats.steel, 28, 6));
    // small vertical vent stack on back apron
    var stack = FQ.group(scene, -7.8, P.lift, -8.9);
    var pipe2 = FQ.cyl(.24, .3, 3.6, 12, mats.rust, true, .0014); pipe2.position.y = 1.8; stack.add(pipe2);
    var cap = FQ.cyl(.38, .28, .28, 12, mats.iron, true, .001); cap.position.y = 3.62; stack.add(cap);
    for (var k = 0; k < 3; k++) {
      var band = FQ.cyl(.29, .29, .08, 12, mats.iron, false); band.position.y = .6 + k * 1.1; stack.add(band);
    }
    steamVents.push({ pos: new T.Vector3(-7.8, P.lift + 3.8, -8.9), dir: new T.Vector3(.1, 1, 0), size: 1.4, rate: .7, color: 0xc4d5d2 });
  }

  /* ---------------------------------------------------------------- props */
  function buildProps(scene) {
    // guard booth with a warm window on the back-left apron
    var b = new T.Group(); b.position.set(-9.0, P.lift, -8.55); scene.add(b);
    var booth = FQ.box(2.0, 2.1, 1.8, mats.concreteDark, true, .0016); booth.position.y = 1.05; b.add(booth);
    var roof = FQ.box(2.25, .14, 2.05, mats.iron, true, .0012); roof.position.y = 2.15; b.add(roof);
    var glass = FQ.box(1.1, .62, .035, mats.warmGlass, false); glass.position.set(0, 1.47, .92); b.add(glass);
    var glassSide = FQ.box(.035, .62, 1.1, mats.warmGlass, false); glassSide.position.set(1.02, 1.47, 0); b.add(glassSide);
    var glow = FQ.sprite(b, Tex.glow, 0xffb16d, 2.3, .16); glow.position.set(0, 1.5, 1.15);
    // booth light kept emissive
    var sign = FQ.textPlane(.8, .35, makeTextTex('WEIGH BOOTH 03', 'FBC / LOGISTICS', 512, 220, '#d0c5aa', '#1f2521'), {}); sign.position.set(0, .7, .93); b.add(sign);
    // concrete barriers + barrels on the front apron
    for (var i = 0; i < 4; i++) {
      var bar = FQ.box(1.8, .7, .5, mats.concrete, true, .0015); bar.position.set(-5.2 + i * 1.9, P.lift + .35, 10.2); scene.add(bar);
      var stripe = FQ.box(1.45, .2, .52, mats.hazard, false); stripe.position.set(-5.2 + i * 1.9, P.lift + .46, 10.2); scene.add(stripe);
    }
    for (var d = 0; d < 5; d++) {
      var drum = FQ.cyl(.23, .23, .62, 12, d % 2 ? mats.rust : mats.concreteDark, true, .0009);
      drum.position.set(-2.2 + d * .54, P.lift + .31, 9.2); scene.add(drum);
      var band = FQ.cyl(.24, .24, .04, 12, mats.iron, false); band.position.set(-2.2 + d * .54, P.lift + .38, 9.2); scene.add(band);
    }
    // cable spools near the west rim
    for (var sp = 0; sp < 2; sp++) {
      var spool = FQ.group(scene, -7.5 + sp * 1.2, P.lift + .3, 5.1);
      var disc1 = FQ.cyl(.52, .52, .09, 16, mats.wood || mats.rust, true, .0012); disc1.rotation.z = Math.PI / 2; disc1.position.x = -.25; spool.add(disc1);
      var disc2 = disc1.clone(); disc2.position.x = .25; spool.add(disc2);
      var hub = FQ.cyl(.24, .24, .55, 12, mats.iron, false); hub.rotation.z = Math.PI / 2; spool.add(hub);
    }
    // timber pallets and crates
    for (var c = 0; c < 3; c++) {
      var crate = FQ.box(.8, .48, .7, FQ.toon(c % 2 ? 0x7c6346 : 0x5b4c39, { map: cloneMap(Tex.rust, 1, 1), gradientMap: FQ.gradHard }), true, .0011);
      crate.position.set(6.8 + c * .5, P.lift + .24, -6.1 + c * .5); crate.rotation.y = c * .3; scene.add(crate);
    }
    // warning signs on posts
    var signPosts = [[-8.9, 8.8, Tex.warnNoEntry, .2], [6.3, 9.3, Tex.warnRestricted, -.3], [-5.9, -7.4, Tex.warnContainment, .1]];
    for (var s = 0; s < signPosts.length; s++) {
      var spost = FQ.cyl(.045, .055, 1.5, 6, mats.iron, false); spost.position.set(signPosts[s][0], P.lift + .75, signPosts[s][1]); scene.add(spost);
      var sgn = FQ.textPlane(.76, .76, signPosts[s][2], { side: T.FrontSide }); sgn.position.set(signPosts[s][0], P.lift + 1.55, signPosts[s][1] + .03); sgn.rotation.y = signPosts[s][3]; scene.add(sgn);
    }
    // a few floodlight strings on the eastern pit wall
    for (var f = 0; f < 3; f++) {
      var lampBox = FQ.box(.3, .2, .16, mats.iron, false); lampBox.position.set(5.5, -1.2 + f * 1.0, 4.9); scene.add(lampBox);
      var lens = FQ.box(.18, .11, .02, mats.amberSolid, false); lens.position.set(5.43, -1.2 + f * 1.0, 4.99); scene.add(lens);
    }
    // ore pile on the left pit ledge
    var oreMat = mats.rustDark;
    for (var o = 0; o < 24; o++) {
      var rock = new T.Mesh(new T.DodecahedronGeometry(.14 + rng() * .32, 0), o % 4 === 0 ? mats.rust : oreMat);
      rock.position.set(-4.6 + (rng() - .5) * 2.2, -.58 + rng() * .2, 3.4 + (rng() - .5) * 2.0);
      rock.rotation.set(rng() * 3, rng() * 3, rng() * 3); rock.scale.y *= .6; rock.castShadow = true; rock.receiveShadow = true; FQ.outline(rock, .0013); scene.add(rock);
    }
    // abandoned machinery silhouette on the far rim
    var pump = FQ.group(scene, -10.5, P.lift, 2.1);
    var skid = FQ.box(2.0, .25, 1.3, mats.iron, true, .0012); skid.position.y = .12; pump.add(skid);
    var cylinder = FQ.cyl(.42, .42, 1.3, 12, mats.rust, true, .0011); cylinder.rotation.z = Math.PI / 2; cylinder.position.y = .65; pump.add(cylinder);
    var topbox = FQ.box(.6, .5, .5, mats.rustDark, true, .001); topbox.position.set(-.2, 1.0, 0); pump.add(topbox);
    var wheel2 = new T.Mesh(new T.TorusGeometry(.3, .04, 6, 20), mats.yellow); wheel2.rotation.y = Math.PI / 2; wheel2.position.set(-.95, .8, 0); pump.add(wheel2);
  }

  function makeTextTex(title, sub, W, H, fg, bg) {
    W = W || 512; H = H || 256;
    var c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = bg || '#1b211e'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(205,189,153,.5)'; g.lineWidth = 4; g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = fg || '#d8cfb6'; g.textAlign = 'center';
    g.font = '700 ' + Math.round(H * .19) + 'px "Arial Narrow", Arial, sans-serif';
    g.fillText(title, W / 2, H * .46);
    g.fillStyle = 'rgba(184,169,138,.65)'; g.font = Math.round(H * .075) + 'px "Courier New", monospace';
    g.fillText(sub, W / 2, H * .7);
    g.fillStyle = 'rgba(160,54,43,.75)'; g.fillRect(W * .3, H * .78, W * .4, 3);
    return FQ.tex(c, {});
  }


  /* ---------------------------------------------------------------- headframe */
  function buildHeadframe(scene) {
    var g = new T.Group(); g.position.set(-4.75, P.lift, -9.15); scene.add(g);
    var pad = FQ.box(3.9, .32, 3.0, mats.concreteDark, true, .002); pad.position.y = .16; g.add(pad);
    // shaft collar and black opening
    var collar = FQ.box(2.2, .28, 1.3, mats.concrete, true, .0015); collar.position.set(0, .35, .75); g.add(collar);
    var hole = FQ.box(1.2, .06, .72, FQ.toon(0x050707), false); hole.position.set(0, .5, .82); g.add(hole);
    for (var bb = 0; bb < 2; bb++) {
      var rail = FQ.box(.07, .07, 2.0, mats.iron, false); rail.position.set(bb ? .42 : -.42, .56, 1.0); g.add(rail);
    }
    var hz = FQ.box(3.0, .12, .5, mats.hazard, false); hz.position.set(0, .56, -.1); g.add(hz);
    // four tapered legs
    var tops = [new T.Vector3(-.44, 6.1, -.32), new T.Vector3(.44, 6.1, -.32), new T.Vector3(.44, 6.1, .32), new T.Vector3(-.44, 6.1, .32)];
    var bases = [new T.Vector3(-1.28, .32, -1.0), new T.Vector3(1.28, .32, -1.0), new T.Vector3(1.28, .32, .7), new T.Vector3(-1.28, .32, .7)];
    for (var l = 0; l < 4; l++) {
      var leg = tube(bases[l], tops[l], .095, mats.craneSteel, 6); g.add(leg);
      var foot = FQ.box(.35, .22, .35, mats.rust, true, .001); foot.position.copy(bases[l]); foot.position.y = .45; g.add(foot);
    }
    // horizontal and diagonal bracing
    var levels = [1.2, 2.8, 4.5, 5.9];
    for (var lv = 0; lv < levels.length; lv++) {
      var y = levels[lv];
      var t = (y - .32) / (6.1 - .32);
      var scale = FQ.lerp(1.0, .44, t);
      for (var s = 0; s < 4; s++) {
        var pA = bases[s].clone().lerp(tops[s], t);
        var pB = bases[(s + 1) % 4].clone().lerp(tops[(s + 1) % 4], t);
        g.add(tube(pA, pB, .035, mats.craneSteel, 4));
        if (lv < levels.length - 1) {
          var t2 = (levels[lv + 1] - .32) / (6.1 - .32);
          var pC = bases[(s + 1) % 4].clone().lerp(tops[(s + 1) % 4], t2);
          var pD = bases[s].clone().lerp(tops[s], t2);
          g.add(tube(pA, pC, .028, mats.iron, 4));
          if (s % 2 === 0) g.add(tube(pA, pD, .024, mats.iron, 4));
        }
      }
      var band = FQ.box((1.4 * scale + .5), .05, (1.4 * scale + .5), mats.rust, false);
      band.position.y = y; g.add(band);
    }
    // platform and sheave frame
    var deck = FQ.box(1.5, .18, 1.2, mats.steel, true, .0013); deck.position.y = 6.25; g.add(deck);
    for (var st = -1; st <= 1; st += 2) {
      var support = FQ.box(.1, 1.2, .12, mats.steel, true, .001); support.position.set(st * .46, 6.95, 0); g.add(support);
    }
    var axle = FQ.cyl(.07, .07, 1.3, 8, mats.iron, false); axle.rotation.z = Math.PI / 2; axle.position.set(0, 7.1, -0.05); g.add(axle);
    var wheel = new T.Group(); wheel.position.set(0, 7.1, .12); g.add(wheel);
    var rim = new T.Mesh(new T.TorusGeometry(1.0, .07, 6, 36), mats.rust); wheel.add(rim);
    var rim2 = new T.Mesh(new T.TorusGeometry(.83, .03, 5, 30), mats.iron); wheel.add(rim2);
    for (var sp = 0; sp < 6; sp++) {
      var spoke = FQ.box(.055, 1.9, .035, mats.rust, false); spoke.rotation.z = sp * Math.PI / 6; wheel.add(spoke);
    }
    var hub = FQ.cyl(.16, .16, .2, 10, mats.iron, true, .0008); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    for (var wl = 0; wl < 3; wl++) {
      var lamp = FQ.sphere(.055, 6, 4, FQ.basic(0xffa365), false); lamp.position.set(-1.1 + wl * 1.1, 6.5, .48); g.add(lamp);
    }
    // hanging ore skip
    var skip = new T.Group(); skip.position.set(.42, 3.3, 1.15); g.add(skip);
    var chain = FQ.cyl(.016, .016, 4.2, 4, mats.iron, false); chain.position.y = 2.6; skip.add(chain);
    var skipBody = FQ.box(.8, .7, .68, mats.rust, true, .0012); skip.add(skipBody);
    var skipLip = FQ.box(.88, .07, .75, mats.iron, false); skipLip.position.y = .37; skip.add(skipLip);
    for (var o = 0; o < 5; o++) {
      var rock = new T.Mesh(new T.DodecahedronGeometry(.1 + rng() * .11, 0), mats.rustDark);
      rock.position.set((rng() - .5) * .52, .4, (rng() - .5) * .4); rock.rotation.set(rng() * 3, rng() * 3, rng() * 3); skip.add(rock);
    }
    // head house / winch room with warm lit window
    var house = FQ.group(g, -1.45, .32, -1.0);
    var hb = FQ.box(1.7, 1.5, 1.45, mats.concrete, true, .0015); hb.position.y = .75; house.add(hb);
    var hr = FQ.box(1.9, .1, 1.65, mats.iron, true, .001); hr.position.y = 1.55; house.add(hr);
    var hw = FQ.box(.65, .38, .025, mats.warmGlass, false); hw.position.set(.2, .84, .735); house.add(hw);
    var hglow = FQ.sprite(house, Tex.glow, 0xffb165, 1.2, .12); hglow.position.set(.2, .84, .8);
    var sign = FQ.textPlane(.85, .38, makeTextTex('SHAFT 02', 'HEADFRAME / FBC', 512, 220, '#d0c6ae', '#1f2422'), {});
    sign.position.set(-.2, 1.25, .75); house.add(sign);
    var beacon = FQ.sphere(.08, 8, 6, FQ.basic(0xff432b), false); beacon.position.set(-.6, 6.5, .35); g.add(beacon); warningLamps.push(beacon);
    // work lights
    // headframe work light kept emissive
    updaters.push(function (dt, t) {
      wheel.rotation.z += dt * .35;
      skip.position.y = 3.2 + Math.sin(t * .23) * .35;
      beacon.material.color.setHex(Math.sin(t * 1.9 + 1.1) > .35 ? 0xff432b : 0x48150e);
    });
    steamVents.push({ pos: new T.Vector3(-5.1, P.lift + 1.6, -8.25), dir: new T.Vector3(-.35, .8, .3), size: .8, rate: .55, color: 0xbfd2ce });
  }

  /* ------------------------------------------------------------- pit gantry */
  function buildPitGantry(scene) {
    var y = .55, z = -4.85, x0 = -6.7, x1 = 6.8;
    // walkway
    var walk = FQ.box(x1 - x0, .13, 1.0, mats.grate || mats.steel, true, .0015); walk.position.set((x0 + x1) / 2, y, z); scene.add(walk);
    for (var s = -1; s <= 1; s += 2) {
      var rail = FQ.box(x1 - x0, .04, .04, mats.iron, false); rail.position.set((x0 + x1) / 2, y + .62, z + s * .56); scene.add(rail);
      var rail2 = rail.clone(); rail2.position.y = y + .34; scene.add(rail2);
      for (var p = 0; p < 11; p++) {
        var post = FQ.box(.04, .65, .04, mats.iron, false); post.position.set(x0 + .3 + p * (x1 - x0 - .6) / 10, y + .33, z + s * .56); scene.add(post);
      }
      var truss = FQ.box(x1 - x0, .09, .09, mats.rust, true, .001); truss.position.set((x0 + x1) / 2, y - .22, z + s * .5); scene.add(truss);
    }
    // diagonal under-truss
    for (var d = 0; d < 10; d++) {
      var xx = x0 + (d + .5) * (x1 - x0) / 10;
      var brace = FQ.box(.06, .06, .8, mats.iron, false); brace.position.set(xx, y - .25, z); brace.rotation.y = Math.PI / 2; brace.rotation.z = (d % 2 ? .8 : -.8); scene.add(brace);
    }
    // pipe bundle under walkway
    for (var pp = 0; pp < 3; pp++) {
      var pipe = FQ.cyl(.07, .07, x1 - x0 - .4, 8, pp === 1 ? mats.rust : mats.iron, false);
      pipe.rotation.z = Math.PI / 2; pipe.position.set((x0 + x1) / 2, y - .4 - pp * .13, z - .12 + pp * .08); scene.add(pipe);
    }
    // support pylons down into the benches
    for (var sx = -1; sx <= 1; sx += 2) {
      var px = sx * 4.2;
      var ground = -0.58;
      var col = FQ.box(.24, y - ground, .24, mats.denail || mats.steel, false); col.position.set(px, (y + ground) / 2 - .1, z); scene.add(col);
      var foot = FQ.box(.65, .18, .65, mats.concreteDark, true, .0012); foot.position.set(px, -.52, z); scene.add(foot);
      var knee = longBox(new T.Vector3(px, -0.5, z), new T.Vector3(px + sx * -.8, y - .2, z), .12, .12, mats.rust, false); scene.add(knee);
    }
    // suspended hoist trolley
    var trolley = new T.Group(); trolley.position.set(1.7, y + .4, z); scene.add(trolley);
    var frame = FQ.box(1.2, .24, .7, mats.rust, true, .0012); trolley.add(frame);
    var cable = FQ.cyl(.012, .012, 2.0, 3, mats.cable, false); cable.position.y = -1.0; trolley.add(cable);
    var hook = new T.Mesh(new T.TorusGeometry(.11, .025, 4, 10, Math.PI * 1.4), mats.steel); hook.rotation.z = .3; hook.position.y = -2.05; trolley.add(hook);
    var beacon = FQ.sphere(.06, 6, 4, FQ.basic(0xffa463), false); beacon.position.set(-.7, .2, .3); trolley.add(beacon);
    var lamp = FQ.box(.2, .1, .12, mats.iron, false); lamp.position.set(.5, -.02, .36); trolley.add(lamp);
    var lens = FQ.box(.13, .06, .02, mats.amberSolid, false); lens.position.set(.5, -.02, .43); trolley.add(lens);
    // gantry work light is emissive only
    for (var gl = -1; gl <= 1; gl += 2) {
      var glow = FQ.sprite(scene, Tex.glow, 0xffab67, 1.2, .09); glow.position.set((x0 + x1) / 2 + gl * 3.2, y + .25, z + .4);
    }
    // hazard plates on walkway ends
    for (var he = -1; he <= 1; he += 2) {
      var hz = FQ.box(.8, .05, .9, mats.hazard, false); hz.position.set(he * 6.3, y + .08, z); scene.add(hz);
    }
    steamVents.push({ pos: new T.Vector3(-3.2, y - .35, z - .2), dir: new T.Vector3(.2, .4, .6), size: .6, rate: .7, color: 0xc5d8d4 });
  }

  /* ---------------------------------------------------------- water details */
  function buildPitWaterDetail(scene) {
    // half-sunk pump barge near the west wall
    var g = new T.Group(); g.position.set(-2.45, FQ.base.pit.waterY + .05, 2.05); scene.add(g);
    var pontoon = FQ.box(2.2, .22, 1.5, mats.rust, true, .0015); pontoon.position.y = .05; g.add(pontoon);
    for (var s = -1; s <= 1; s += 2) {
      var tank = FQ.cyl(.28, .28, .55, 12, mats.rustDark, true, .001); tank.position.set(s * .55, .38, 0); g.add(tank);
      var hoop = FQ.cyl(.3, .3, .035, 12, mats.iron, false); hoop.position.set(s * .55, .46, 0); g.add(hoop);
    }
    var pump = FQ.box(.55, .45, .55, mats.steel, true, .0012); pump.position.set(0, .3, .4); g.add(pump);
    var intake = FQ.cyl(.12, .16, .8, 8, mats.iron, false); intake.rotation.x = .4; intake.position.set(1.2, -.2, .35); g.add(intake);
    var gauge = FQ.cyl(.095, .095, .03, 12, mats.porcelain, false); gauge.rotation.x = Math.PI / 2; gauge.position.set(.0, .68, .49); g.add(gauge);
    var gaugeFace = FQ.cyl(.07, .07, .01, 12, mats.redGlow, false); gaugeFace.rotation.x = Math.PI / 2; gaugeFace.position.set(.0, .68, .51); g.add(gaugeFace);
    var lamp = FQ.sphere(.075, 8, 6, mats.amberSolid, false); lamp.position.set(-1.0, .7, .1); g.add(lamp);
    var glow = FQ.sprite(g, Tex.glow, 0xffad68, 1.2, .16); glow.position.set(-1.0, .72, .18);
    // pump light kept emissive
    // floating debris / boulders
    for (var i = 0; i < 9; i++) {
      var r = new T.Mesh(new T.DodecahedronGeometry(.12 + rng() * .3, 0), i % 3 === 0 ? mats.rustDark : mats.rock);
      r.position.set(-1.8 + rng() * 7.1, FQ.base.pit.waterY + .02 + rng() * .16, -1.0 + rng() * 4.6);
      r.scale.y = .4 + rng() * .35; r.rotation.set(rng() * 3, rng() * 3, rng() * 3); FQ.outline(r, .0012); scene.add(r);
    }
    // submerged steel beams / collapsed walkway
    var beam = longBox(new T.Vector3(-.8, FQ.base.pit.waterY + .12, 3.7), new T.Vector3(3.2, FQ.base.pit.waterY - .15, 2.7), .22, .15, mats.rust, true); scene.add(beam);
    var beam2 = longBox(new T.Vector3(1.5, FQ.base.pit.waterY - .05, -.3), new T.Vector3(2.3, FQ.base.pit.waterY + .2, 1.9), .13, .11, mats.iron, false); scene.add(beam2);
    // rim edge warning lamps around water
    for (var wl = 0; wl < 3; wl++) {
      var post = FQ.cyl(.035, .045, .55, 5, mats.iron, false); post.position.set(4.25, -.35, -1.2 + wl * 1.35); scene.add(post);
      var l = FQ.sphere(.06, 6, 4, FQ.basic(0xff4128), false); l.position.set(4.25, -.05, -1.2 + wl * 1.35); scene.add(l); warningLamps.push(l);
    }
    // cold reflected light off the water
    var waterLight = new T.PointLight(0x4f8996, 1.55, 8.0, 2); waterLight.position.set(1.2, -1.25, 1.0); scene.add(waterLight);
    // warm water reflection handled in shader
    // small steam / mist column at the water line
    steamVents.push({ pos: new T.Vector3(3.0, -.35, -1.0), dir: new T.Vector3(.1, .6, .25), size: .7, rate: .35, color: 0xc4d8d4 });
  }

  /* ---------------------------------------------------------- pit worklight */
  function buildPitWorklight(scene) {
    var fixture = FQ.group(scene, -1.4, 1.4, -4.3);
    var housing = FQ.box(.45, .28, .32, mats.steel, true, .001); fixture.add(housing);
    var lens = FQ.box(.3, .17, .025, mats.coldLamp, false); lens.position.set(0, 0, .18); fixture.add(lens);
    var pin = FQ.cyl(.035, .035, .35, 6, mats.iron, false); pin.rotation.z = Math.PI / 2; pin.position.set(0, .32, -.12); fixture.add(pin);
    var beam = FQ.beamCone(0xc8e0e4, 3.2, .14, 10.5, .055);
    beam.rotation.x = Math.PI / 2 - .48; beam.rotation.z = -.32;
    beam.position.set(.5, -1.9, 3.0); fixture.add(beam);
    var poolSpot = new T.SpotLight(0xa8d1d8, 5.2, 18, .34, .85, 1.2);
    poolSpot.position.set(0, 0, .2); fixture.add(poolSpot);
    var targ = new T.Object3D(); targ.position.set(2.2, -12.0, 8.0); fixture.add(targ); poolSpot.target = targ;
    var lightGlow = FQ.sprite(scene, Tex.glow, 0xb7dbe0, 1.0, .16); lightGlow.position.set(-1.4, 1.4, -4.1);
    // wall arm mount
    var arm = FQ.box(.1, .1, 1.1, mats.iron, false); arm.position.set(0, .2, -.75); fixture.add(arm);
    var bracket = FQ.box(.1, .1, .1, mats.iron, false); bracket.position.set(0, .2, -.1); fixture.add(bracket);
  }

  /* ------------------------------------------------------------ base accents */
  function buildBaseAccents(scene) {
    // cold guide strips set into the rim
    var stripMat = FQ.basic(0x6fa7b4, { transparent: true, opacity: .46, toneMapped: false });
    for (var a = 0; a < 4; a++) {
      var len = (a < 2 ? 13.8 : 13.2);
      var strip = FQ.box(len, .018, .035, stripMat, false);
      if (a === 0) strip.position.set(0, P.lift + .025, 6.98);
      if (a === 1) strip.position.set(0, P.lift + .025, -6.98);
      if (a === 2) { strip.geometry = FQ.boxGeo(.035, .018, len); strip.position.set(7.28, P.lift + .025, 0); }
      if (a === 3) { strip.geometry = FQ.boxGeo(.035, .018, len); strip.position.set(-7.28, P.lift + .025, 0); }
      scene.add(strip);
    }
    // faded walkway dashes around the west apron
    var dashMat = FQ.basic(0xd1cba9, { transparent: true, opacity: .33, depthWrite: false });
    for (var d = 0; d < 7; d++) {
      var dash = FQ.box(.05, .012, .58, dashMat, false); dash.position.set(-9.7, P.lift + .022, -5.7 + d * 1.6); scene.add(dash);
    }
    // big site numeral painted on the east apron
    var num = FQ.plane(4.8, 4.8, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .27, depthWrite: false }), 1, 1);
    num.rotation.x = -Math.PI / 2; num.rotation.z = 1.0; num.position.set(9.45, P.lift + .028, -5.6); scene.add(num);
    // red warning lamp poles at pit rim corners
    var corners = [[-6.75, -6.45], [6.75, -6.45], [-6.75, 6.45], [6.75, 6.45]];
    for (var c = 0; c < corners.length; c++) {
      var pole = FQ.cyl(.045, .045, 1.0, 6, mats.iron, false); pole.position.set(corners[c][0], P.lift + .5, corners[c][1]); scene.add(pole);
      var lamp = FQ.sphere(.065, 8, 6, FQ.basic(0xff3b26), false); lamp.position.set(corners[c][0], P.lift + 1.03, corners[c][1]); scene.add(lamp); warningLamps.push(lamp);
    }
    // a length of chain hung along the eastern rail
    for (var ch = 0; ch < 10; ch++) {
      var link = new T.Mesh(new T.TorusGeometry(.055, .012, 4, 8), mats.iron);
      link.rotation.x = Math.PI / 2; link.rotation.z = ch * .4; link.position.set(7.7, P.lift + .72 - ch * .025, 3.5 + ch * .18); scene.add(link);
    }
  }


  /* ------------------------------------------------------------------ haul ramp */
  function buildRamp(scene) {
    var a = new T.Vector3(-6.75, P.lift + .02, 4.75);
    var b = new T.Vector3(-3.05, -1.65, 4.75);
    var dir = b.clone().sub(a);
    var ramp = new T.Group(); ramp.position.set(0, 0, 0); scene.add(ramp);
    var deckMat = FQ.toon(0x797f79, { map: cloneMap(Tex.deck, 2.0, .8), bumpMap: cloneMap(Tex.deck, 2.0, .8), bumpScale: .03, gradientMap: FQ.gradHard });
    var top = longBox(a, b, 2.5, .16, deckMat, true); ramp.add(top);
    // side retaining curbs
    for (var side = -1; side <= 1; side += 2) {
      var aa = a.clone().add(new T.Vector3(0, .2, side * 1.24));
      var bb = b.clone().add(new T.Vector3(0, .2, side * 1.24));
      ramp.add(longBox(aa, bb, .16, .42, mats.concreteDark, true));
    }
    // tyre-worn dark bands on the ramp surface
    for (var t = 0; t < 2; t++) {
      var aa2 = a.clone().lerp(b, .03).add(new T.Vector3(0, .12, (t ? 1 : -1) * .4));
      var bb2 = a.clone().lerp(b, .97).add(new T.Vector3(0, .12, (t ? 1 : -1) * .4));
      ramp.add(longBox(aa2, bb2, .24, .015, FQ.toon(0x262b28, { gradientMap: FQ.gradHard }), false));
    }
    // guard posts and cables along the outer edge
    for (var side2 = -1; side2 <= 1; side2 += 2) {
      for (var k = 0; k <= 5; k++) {
        var t2 = k / 5;
        var p = a.clone().lerp(b, t2);
        var post = FQ.box(.045, .8, .045, mats.iron, false); post.position.set(p.x, p.y + .4, p.z + side2 * 1.18); ramp.add(post);
        var band = FQ.box(.055, .09, .055, mats.hazard, false); band.position.set(p.x, p.y + .67, p.z + side2 * 1.18); ramp.add(band);
      }
      var rail = longBox(a.clone().add(new T.Vector3(0, .78, side2 * 1.18)), b.clone().add(new T.Vector3(0, .78, side2 * 1.18)), .04, .04, mats.iron, false); ramp.add(rail);
    }
    // support ribs underneath down to the benches
    for (var s = 1; s <= 3; s++) {
      var t3 = s / 4;
      var p2 = a.clone().lerp(b, t3);
      var bottom = new T.Vector3(p2.x, -0.58 - Math.max(0, t3 - .35) * 1.7, p2.z);
      var col = FQ.box(.18, p2.y - bottom.y, .22, mats.concreteDark, false); col.position.set(p2.x, (p2.y + bottom.y) / 2, p2.z); ramp.add(col);
    }
    // top gate / checkpoint
    var gatePost = FQ.box(.22, 1.25, .22, mats.iron, true, .0012); gatePost.position.set(a.x + .15, a.y + .65, a.z + 1.25); ramp.add(gatePost);
    var gateArm = FQ.box(.14, .14, 2.1, mats.rust, true, .001); gateArm.position.set(a.x + .15, a.y + 1.05, a.z + .2); gateArm.rotation.x = .35; ramp.add(gateArm);
    var gateLamp = FQ.sphere(.08, 8, 6, FQ.basic(0xffa055), false); gateLamp.position.set(a.x + .15, a.y + 1.4, a.z + 1.25); ramp.add(gateLamp);
    var gateSign = FQ.textPlane(.8, .55, makeTextTex('HAUL ROAD', 'MAX 12 KM/H', 512, 340, '#d1c7ad', '#1e2421'), {});
    gateSign.position.set(a.x + .17, a.y + .95, a.z + 1.35); gateSign.rotation.y = -.1; ramp.add(gateSign);
    // amber bollard lights on the ramp
    for (var l = 0; l <= 3; l++) {
      var t4 = l / 3;
      var p3 = a.clone().lerp(b, t4);
      var post2 = FQ.cyl(.045, .045, .8, 5, mats.iron, false); post2.position.set(p3.x, p3.y + .4, p3.z - 1.25); ramp.add(post2);
      var bulb = FQ.sphere(.055, 6, 4, FQ.basic(0xffa464), false); bulb.position.set(p3.x, p3.y + .82, p3.z - 1.25); ramp.add(bulb);
      var glow = FQ.sprite(ramp, Tex.glow, 0xffb36d, .9, .1); glow.position.set(p3.x, p3.y + .82, p3.z - 1.25);
    }
    // emissive amber glow at the ramp foot
    var footGlow = FQ.sprite(ramp, Tex.glow, 0xff9b55, 2.2, .1); footGlow.position.set(b.x + .2, b.y + .55, b.z);
    // spilled ore / gravel at the base
    for (var o = 0; o < 12; o++) {
      var r = new T.Mesh(new T.DodecahedronGeometry(.08 + rng() * .24, 0), o % 4 ? mats.rock : mats.rust);
      r.position.set(b.x + (rng() - .5) * 1.8, b.y + .1 + rng() * .2, b.z + (rng() - .5) * 1.7);
      r.rotation.set(rng() * 3, rng() * 3, rng() * 3); FQ.outline(r, .0012); ramp.add(r);
    }
  }

  /* ------------------------------------------------------------- water outlet */
  function buildWaterfall(scene) {
    // a cracked discharge pipe on the lower east bench spills into the sump
    var x = 4.15, z = 1.15, yTop = -1.1, yBot = FQ.base.pit.waterY + .05;
    var g = new T.Group(); scene.add(g);
    var pipe = FQ.cyl(.1, .12, .6, 8, mats.rust, true, .001); pipe.rotation.z = Math.PI / 2; pipe.position.set(x + .4, yTop, z); g.add(pipe);
    var mouth = FQ.cyl(.13, .15, .12, 8, mats.iron, false); mouth.rotation.z = Math.PI / 2; mouth.position.set(x + .1, yTop, z); g.add(mouth);
    var fallMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(0xb6dadf) } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main(){float streak=.55+.45*sin(vUv.y*40.-uTime*9.0+vUv.x*20.);float a=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x)*(0.11+streak*.12);gl_FragColor=vec4(uColor,a);}'
    });
    var fall = new T.Mesh(new T.PlaneGeometry(.9, yTop - yBot), fallMat);
    fall.position.set(x - .05, (yTop + yBot) / 2, z); fall.rotation.y = 0; fall.renderOrder = 8; g.add(fall);
    FQ.updaters.push(function (dt, t) { fallMat.uniforms.uTime.value = t; });
    // splash glow / foam
    var splash = FQ.sprite(g, Tex.spark, 0xaed5da, .9, .18); splash.position.set(x, yBot + .08, z);
    var ring = new T.Mesh(new T.RingGeometry(.4, .48, 24), FQ.basic(0xb5d8dc, { transparent: true, opacity: .18, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, yBot + .02, z); g.add(ring);
    updaters.push(function (dt, t) { var s = .4 + (Math.sin(t * .8) * .5 + .5) * .7; ring.scale.set(s, s, s); ring.material.opacity = .09 + (1 - (s - .4) / .7) * .12; });
    // wet stain down the wall (simple dark plane)
    var stain = FQ.plane(.9, yTop - yBot, FQ.basic(0x0a1515, { transparent: true, opacity: .35, depthWrite: false }), 1, 1);
    stain.position.set(x + .03, (yTop + yBot) / 2, z - .02); stain.rotation.y = Math.PI / 2; g.add(stain);
  }

  /* -------------------------------------------------------------- final build */
  K.build = function (scene) {
    makeMaterials();
    buildCrane(scene);
    buildConveyor(scene);
    buildRail(scene);
    buildTransformer(scene);
    buildBlastDoor(scene);
    buildStairs(scene);
    buildExcavator(scene);
    buildPipes(scene);
    buildProps(scene);
    buildHeadframe(scene);
    buildPitGantry(scene);
    buildPitWaterDetail(scene);
    buildBaseAccents(scene);
    buildRamp(scene);
    buildWaterfall(scene);
    buildPitWorklight(scene);
    buildSearchlight(scene, new T.Vector3(-8.4, P.lift, 8.5), 5.4, 0xc8e3ef, 2.3, 0xeed1a8, .036, 'SWEEP / SOUTH');
    buildSearchlight(scene, new T.Vector3(8.1, P.lift, -8.2), 5.9, 0x93b4c2, -.82, 0xaedce9, .028, 'SWEEP / NORTH');
    // low work light near the west rim stairs
    var work = FQ.box(.4, .18, .24, mats.iron, false); work.position.set(-6.8, P.lift + .4, -3.5); scene.add(work);
    var lens = FQ.box(.22, .1, .02, mats.amberSolid, false); lens.position.set(-6.8, P.lift + .4, -3.25); scene.add(lens);
    // stair light is emissive only
    var glow = FQ.sprite(scene, Tex.glow, 0xffad67, 1.1, .12); glow.position.set(-6.8, P.lift + .4, -3.1);

    // register all updates into the frame engine
    FQ.updaters.push(function (dt, t) { for (var i = 0; i < updaters.length; i++) updaters[i](dt, t); });
    K.searchlights = searchlights;
    K.steamVents = steamVents;
    K.updaters = updaters;
    return K;
  };
})();
