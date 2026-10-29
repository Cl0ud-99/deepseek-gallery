/* =========================================================================
   ASHTRAY MAZE — the concrete survey plinth
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  var AM = window.AM;
  var M, TEX;
  var H = 9.0;

  function shadowMesh(mesh, cast, receive) {
    mesh.castShadow = !!cast;
    mesh.receiveShadow = receive !== false;
    mesh.traverse(function (o) { if (o.isOutline) { o.castShadow = false; o.receiveShadow = false; } });
    return mesh;
  }

  function floorJoint(parent, w, d, x, z, ry) {
    var mat = AM.mats.blackPlastic;
    var g = new T.Group();
    var bar1 = AM.box(w, .013, .022, mat, false);
    bar1.position.y = .009;
    g.add(bar1);
    var bar2 = AM.box(.022, .013, d, mat, false);
    bar2.position.set(x || 0, .009, z || 0);
    g.add(bar2);
    if (ry) g.rotation.y = ry;
    parent.add(g);
    return g;
  }

  AM.buildBase = function (scene) {
    M = AM.mats; TEX = AM.TEX;
    var root = new T.Group();
    root.name = 'PLINTH';
    scene.add(root);

    var W = 18.5, mainW = 18.3, topBandW = 18.56, fieldW = 17.9;
    var concrete = M.concreteB;
    var bodyMat = M.concreteCool;

    // Bottom foundation and recessed shadow course.
    var bottom = AM.box(W, .30, W, bodyMat, true, .0024, { worldUV: true, uvScale: .36 });
    bottom.position.y = -1.86;
    shadowMesh(bottom, false, false);
    root.add(bottom);

    var shadowCourse = AM.box(17.95, .18, 17.95, M.concreteSoot, true, .0022, { worldUV: true, uvScale: .42 });
    shadowCourse.position.y = -1.59;
    shadowMesh(shadowCourse, false, false);
    root.add(shadowCourse);

    // Main mass. A shallow chamfer is implied by the lip above and the dark reveal.
    var body = AM.box(mainW, 1.10, mainW, concrete, true, .0025, { worldUV: true, uvScale: .32 });
    body.position.y = -.95;
    shadowMesh(body, true, true);
    root.add(body);

    // The exposed lip is a perimeter frame, not a solid lid: the recessed work
    // deck and its painted markings must remain visible.
    var capFrame = .36;
    var capZ = AM.box(topBandW, .26, capFrame, bodyMat, true, .0025, { worldUV: true, uvScale: .34 });
    capZ.position.set(0, -.05, topBandW * .5 - capFrame * .5);
    shadowMesh(capZ, true, true); root.add(capZ);
    var capZ2 = capZ.clone(); capZ2.position.z = -(topBandW * .5 - capFrame * .5); root.add(capZ2);
    var capX = AM.box(capFrame, .26, topBandW - capFrame * 2, bodyMat, true, .0025, { worldUV: true, uvScale: .34 });
    capX.position.set(topBandW * .5 - capFrame * .5, -.05, 0);
    shadowMesh(capX, true, true); root.add(capX);
    var capX2 = capX.clone(); capX2.position.x = -(topBandW * .5 - capFrame * .5); root.add(capX2);
    // ensure the new clones keep shadows consistent
    root.traverse(function (o) { if (o.isMesh && o.material === bodyMat) o.receiveShadow = true; });

    // Recessed working deck. Objects stand on y = 0.
    var field = AM.box(fieldW, .18, fieldW, M.concreteB, false, .002, { worldUV: true, uvScale: .42 });
    field.position.y = -.09;
    shadowMesh(field, false, true);
    root.add(field);

    // A grimy poured-slab deck. The texture is tiled in world-scale units so the
    // floor reads as cast concrete rather than a smooth beige plane.
    var deckTex = TEX.concreteB.clone();
    deckTex.needsUpdate = true;
    deckTex.wrapS = deckTex.wrapT = T.RepeatWrapping;
    deckTex.repeat.set(4.4, 4.4);
    deckTex.anisotropy = 8;
    var surfaceMat = new T.MeshToonMaterial({
      color: 0x7f8a84, map: deckTex, bumpMap: deckTex, bumpScale: .04,
      gradientMap: AM.gradInk, rim: .05, rimColor: 0x7c8f8d
    });
    var surface = new T.Mesh(new T.PlaneGeometry(fieldW - .12, fieldW - .12), surfaceMat);
    surface.rotation.x = -Math.PI * .5;
    surface.position.y = .0012;
    surface.receiveShadow = true;
    root.add(surface);
    AM.plinthSurface = surface;
    AM.plinthSurfaceMat = surfaceMat;
    // dark perimeter shadow inside the lip; helps the deck sit into the base
    var insetShadow = new T.Mesh(new T.PlaneGeometry(fieldW - .14, fieldW - .14), new T.MeshBasicMaterial({
      color: 0x0a0d0b, transparent: true, opacity: .18, depthWrite: false, side: T.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1
    }));
    insetShadow.rotation.x = -Math.PI * .5; insetShadow.position.y = .0016;
    insetShadow.material.alphaMap = (function () {
      var cc = AM.canvas(256, 256), gg = cc.getContext('2d');
      gg.fillStyle = '#000'; gg.fillRect(0, 0, 256, 256);
      var gr = gg.createRadialGradient(128, 128, 30, 128, 128, 128);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(.62, 'rgba(0,0,0,1)');
      gr.addColorStop(.93, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,1)');
      gg.fillStyle = gr; gg.fillRect(0, 0, 256, 256);
      return AM.tex(cc, { srgb: false });
    })();
    root.add(insetShadow);

    // Fine expansion joints across the slab. Irregular spacing avoids a game-board read.
    var jointMat = M.blackPlastic;
    var jointsX = [-6.4, -2.6, 1.85, 5.25, 7.85];
    var jointsZ = [-6.9, -3.1, .35, 4.1, 7.2];
    // Use single long grooves so the deck reads as large poured panels.
    for (var j = 0; j < jointsX.length; j++) {
      var gx = jointsX[j];
      var bx = AM.box(.018, .009, fieldW - .5, jointMat, false);
      bx.position.set(gx, .009, 0);
      root.add(bx);
    }
    for (var k = 0; k < jointsZ.length; k++) {
      var gz = jointsZ[k];
      var bz = AM.box(fieldW - .5, .009, .018, jointMat, false);
      bz.position.set(0, .010, gz);
      root.add(bz);
    }

    // Perimeter reveal line and service border.
    var borderMat = M.steelDark;
    var inset = fieldW * .5 - .22;
    [-1, 1].forEach(function (s) {
      var a = AM.box(fieldW - .46, .05, .045, borderMat, false);
      a.position.set(0, .018, s * inset); root.add(a);
      var b = AM.box(.045, .05, fieldW - .46, borderMat, false);
      b.position.set(s * inset, .018, 0); root.add(b);
    });

    // Engraved saw-cut border just inside the lip.
    var cutMat = AM.toon(0x363e38, { rim: 0, gradientMap: AM.gradHard });
    var cut = .35;
    var cA = AM.box(fieldW - cut * 2, .008, .026, cutMat, false);
    cA.position.set(0, .013, fieldW * .5 - cut); root.add(cA);
    var cB = cA.clone(); cB.position.z = -(fieldW * .5 - cut); root.add(cB);
    var cC = AM.box(.026, .008, fieldW - cut * 2, cutMat, false);
    cC.position.set(fieldW * .5 - cut, .013, 0); root.add(cC);
    var cD = cC.clone(); cD.position.x = -(fieldW * .5 - cut); root.add(cD);

    // Vertical board-form seams and tie recesses on all four faces.
    function seam(x, z, w, d) {
      var m = AM.box(w, .92, d, jointMat, false);
      m.position.set(x, -.92, z);
      root.add(m);
    }
    var faceZ = mainW * .5 + .008;
    for (var i = -8; i <= 8; i += 1.15) {
      if (Math.abs(i) < .5) continue;
      seam(i, faceZ, .019, .014);
      seam(i, -faceZ, .019, .014);
      seam(faceZ, i, .014, .019);
      seam(-faceZ, i, .014, .019);
    }
    // horizontal reveal under the lip
    var revealMat = M.blackMetal;
    [-1, 1].forEach(function (s) {
      var r1 = AM.box(W, .035, .035, revealMat, false); r1.position.set(0, -1.43, s * (mainW * .5 + .006)); root.add(r1);
      var r2 = AM.box(.035, .035, W, revealMat, false); r2.position.set(s * (mainW * .5 + .006), -1.43, 0); root.add(r2);
    });

    // Corner armour plates. Small rivets read as cast-in anchors at model scale.
    var boltGeo = AM.G.sphere(.028, 6, 4);
    function cornerPlate(sx, sz) {
      var g = new T.Group();
      var p1 = AM.box(.55, 1.05, .035, M.steelDark, true, .0018);
      p1.position.set(sx * (mainW * .5 + .022), -.86, sz * (mainW * .5 - .32));
      p1.rotation.y = sx > 0 ? -Math.PI * .5 : Math.PI * .5;
      g.add(p1);
      var p2 = AM.box(.035, 1.05, .55, M.steelDark, true, .0018);
      p2.position.set(sx * (mainW * .5 - .32), -.86, sz * (mainW * .5 + .022));
      g.add(p2);
      for (var a = 0; a < 3; a++) {
        var b1 = new T.Mesh(boltGeo, M.brass);
        b1.position.set(sx * (mainW * .5 + .043), -.55 - a * .24, sz * (mainW * .5 - .32));
        g.add(b1);
        var b2 = new T.Mesh(boltGeo, M.brass);
        b2.position.set(sx * (mainW * .5 - .32), -.55 - a * .24, sz * (mainW * .5 + .043));
        g.add(b2);
      }
      root.add(g);
    }
    cornerPlate(1, 1); cornerPlate(-1, 1); cornerPlate(1, -1); cornerPlate(-1, -1);

    // Steel protective nosing strips along the top edge.
    var noseMat = M.steelDk || M.steelDark;
    [-1, 1].forEach(function (s) {
      var n1 = AM.box(topBandW - .06, .055, .20, M.steelDark, true, .0017);
      n1.position.set(0, .068, s * (topBandW * .5 - .10)); root.add(n1);
      var n2 = AM.box(.20, .055, topBandW - .06, M.steelDark, true, .0017);
      n2.position.set(s * (topBandW * .5 - .10), .068, 0); root.add(n2);
    });

    // Heavy brass model plaque on the near face.
    var plqFrame = AM.box(2.52, .75, .045, M.brass, true, .0022);
    plqFrame.position.set(4.2, -.78, mainW * .5 + .055);
    shadowMesh(plqFrame, false, true);
    root.add(plqFrame);
    var plqBack = AM.box(2.36, .59, .035, M.blackMetal, false);
    plqBack.position.set(4.2, -.78, mainW * .5 + .083);
    root.add(plqBack);
    var plq = AM.decal(2.24, .56, TEX.plaque, { opacity: 1, fog: false });
    plq.position.set(4.2, -.78, mainW * .5 + .102);
    root.add(plq);

    // Archive stencil on the far face, and a small data plate on the right face.
    var st = AM.decal(2.05, 1.02, TEX.stencilMaze, { opacity: .48 });
    st.rotation.y = Math.PI;
    st.position.set(-4.0, -.88, -mainW * .5 - .012);
    root.add(st);
    var dplate = AM.decal(.78, .38, TEX.signCaution, { opacity: .75, fog: false });
    dplate.rotation.y = -Math.PI * .5;
    dplate.position.set(mainW * .5 + .012, -.8, 3.5);
    dplate.scale.set(.86, .86, 1);
    root.add(dplate);

    // FBC medallion in the front-right apron.
    var med = new T.Group();
    var ringGeo = new T.TorusGeometry(1.52, .028, 8, 64);
    var ring = new T.Mesh(ringGeo, M.brass);
    ring.rotation.x = -Math.PI * .5;
    ring.position.y = .022;
    med.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(1.38, .012, 6, 64), M.steelDark);
    ring2.rotation.x = -Math.PI * .5; ring2.position.y = .022; med.add(ring2);
    var seal = AM.decal(2.72, 2.72, TEX.sealPaint, { opacity: .74, fog: false });
    seal.rotation.x = -Math.PI * .5;
    seal.position.y = .016;
    med.add(seal);
    // four inlaid anchor studs
    for (var q = 0; q < 4; q++) {
      var a = q * Math.PI * .5 + Math.PI * .25;
      var stud = AM.cyl(.065, .075, .022, 8, M.brass, true, .0015);
      stud.position.set(Math.cos(a) * 1.45, .022, Math.sin(a) * 1.45);
      med.add(stud);
    }
    med.position.set(3.1, 0, 3.5);
    root.add(med);

    // Painted route / stencils / arrows on the deck.
    var arrow = AM.decal(1.45, .72, TEX.stencilArrow, { opacity: .78, fog: false });
    arrow.rotation.x = -Math.PI * .5;
    arrow.rotation.z = -.2;
    arrow.position.set(-2.4, .018, 5.3);
    root.add(arrow);

    var arrow2 = AM.decal(1.25, .62, TEX.stencilArrowPlain, { opacity: .55, fog: false });
    arrow2.rotation.x = -Math.PI * .5;
    arrow2.rotation.z = 1.1;
    arrow2.position.set(-5.45, .019, 1.25);
    root.add(arrow2);

    var stencilControl = AM.decal(1.75, 1.0, TEX.stencilControl, { opacity: .43, fog: false });
    stencilControl.rotation.x = -Math.PI * .5;
    stencilControl.rotation.z = Math.PI * .5;
    stencilControl.position.set(6.4, .019, 1.0);
    root.add(stencilControl);

    var stencil07 = AM.decal(2.1, 2.1, TEX.stencil07, { opacity: .43, fog: false });
    stencil07.rotation.x = -Math.PI * .5;
    stencil07.rotation.z = -.2;
    stencil07.position.set(-6.55, .019, -5.4);
    root.add(stencil07);

    // A yellow safety walk line threads from the loading edge toward the maze.
    var lineMat = M.hazard.clone();
    lineMat.map = TEX.hazard.clone();
    lineMat.map.needsUpdate = true;
    lineMat.map.wrapS = lineMat.map.wrapT = T.RepeatWrapping;
    lineMat.map.repeat.set(5.2, 1);
    lineMat.map.anisotropy = 8;
    var walkLine = new T.Mesh(new T.PlaneGeometry(5.1, .16), lineMat);
    walkLine.rotation.x = -Math.PI * .5; walkLine.rotation.z = .17;
    walkLine.position.set(1.6, .016, 6.9);
    walkLine.receiveShadow = true;
    root.add(walkLine);
    AM.walkLineMat = lineMat;

    // A second hazard margin at the moving-wall threshold.
    var hz1 = AM.plane(2.2, .2, lineMat);
    hz1.rotation.x = -Math.PI * .5; hz1.position.set(-4.9, .017, 2.55); root.add(hz1);

    // Sliding tracks recessed into the slab.
    function track(x, z, len, ry) {
      var g = new T.Group();
      var bed = AM.box(len, .055, .46, M.blackMetal, false);
      bed.position.y = .015; bed.receiveShadow = true; g.add(bed);
      var railMat = M.steelPale;
      [-1, 1].forEach(function (s) {
        var rail = AM.box(len, .032, .052, railMat, true, .0012);
        rail.position.set(0, .047, s * .16); g.add(rail);
        var inner = AM.box(len - .16, .024, .022, M.steelDark, false);
        inner.position.set(0, .061, s * .16); g.add(inner);
      });
      // sleepers / bolt rhythm
      var sleepers = Math.floor(len / .52);
      for (var i = 0; i <= sleepers; i++) {
        var sl = AM.box(.085, .015, .37, M.steelDark, false);
        sl.position.set(-len * .5 + i * (len / Math.max(1, sleepers)), .058, 0);
        g.add(sl);
      }
      g.position.set(x, 0, z);
      if (ry) g.rotation.y = ry;
      root.add(g);
      return g;
    }
    track(-4.2, 2.4, 4.2, Math.PI * .5);
    track(4.6, 1.9, 3.8, 0);
    track(-4.2, -3.6, 3.2, .03);
    track(-2.95, 6.35, 3.5, 0);

    // Drains, grates and small service pits.
    function grate(x, z, w, d, ry) {
      var g = new T.Group();
      var rim = AM.box(w + .12, .05, d + .12, M.steelDark, false);
      rim.position.y = .02; rim.receiveShadow = true; g.add(rim);
      var black = AM.box(w, .03, d, M.blackPlastic, false);
      black.position.y = .04; g.add(black);
      var bars = AM.box(w, .02, d * .92, M.grate, false);
      bars.position.y = .052; g.add(bars);
      g.position.set(x, 0, z);
      if (ry) g.rotation.y = ry;
      root.add(g);
    }
    grate(5.55, 5.45, 1.15, .62, .06);
    grate(-7.55, 3.95, .6, .9, .0);
    grate(7.4, -.2, .45, .72, .0);

    var manhole = new T.Group();
    var mh = AM.cyl(.42, .42, .03, 24, M.steelDark, true, .0015);
    mh.position.y = .025; manhole.add(mh);
    var mhTop = AM.cyl(.34, .34, .012, 24, M.steelPale, false);
    mhTop.position.y = .046; manhole.add(mhTop);
    for (var mi = 0; mi < 8; mi++) {
      var ang = mi * Math.PI / 4;
      var slot = AM.box(.27, .008, .028, M.blackPlastic, false);
      slot.position.set(Math.cos(ang) * .17, .055, Math.sin(ang) * .17);
      slot.rotation.y = -ang; manhole.add(slot);
    }
    manhole.position.set(1.5, 0, 6.1);
    root.add(manhole);

    // Ground rust halo & water stains near service points.
    function stain(x, z, size, opacity, ry) {
      var mat = new T.MeshBasicMaterial({
        map: TEX.rust, transparent: true, opacity: opacity, depthWrite: false,
        side: T.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2
      });
      var m = new T.Mesh(new T.PlaneGeometry(size, size), mat);
      m.rotation.x = -Math.PI * .5;
      m.rotation.z = ry || 0;
      m.position.set(x, .008, z);
      m.renderOrder = 1;
      root.add(m);
    }
    stain(7.2, 4.1, 2.2, .38, .3);
    stain(-6.1, 5.7, 1.8, .35, 1.5);
    stain(4.1, -5.8, 2.4, .3, -.4);
    stain(-4.2, -6.5, 1.1, .4, .2);

    // Cast aggregate chips scattered along the plinth edge.
    var stoneMat = M.concreteDark;
    var rnd = AM.rng(842);
    var stoneGeo = new T.DodecahedronGeometry(.05, 0);
    for (var s = 0; s < 22; s++) {
      var stone = new T.Mesh(stoneGeo, stoneMat);
      stone.position.set((rnd() - .5) * 17.2, .025 + rnd() * .02, (rnd() - .5) * 17.2);
      stone.scale.set(.5 + rnd() * 1.6, .25 + rnd() * .5, .5 + rnd() * 1.4);
      stone.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      stone.castShadow = true;
      root.add(stone);
    }

    // Corner site markers / anchor pads.
    var anchorMat = M.steelDark;
    [[-8.35, 8.35], [8.35, 8.35], [-8.35, -8.35], [8.35, -8.35]].forEach(function (p, idx) {
      var pad = AM.cyl(.23, .26, .05, 8, anchorMat, true, .0015);
      pad.position.set(p[0], .03, p[1]);
      root.add(pad);
      var disc = AM.cyl(.14, .14, .02, 8, M.brass, false);
      disc.position.set(p[0], .065, p[1]);
      root.add(disc);
    });

    // A lone oversized steel ashtray, half hidden by the loading edge.
    var ash = new T.Group();
    var bowl = new T.Mesh(new T.CylinderGeometry(.36, .27, .22, 22, 1, false), M.ashtray);
    bowl.position.y = .12; bowl.castShadow = true; AM.outline(bowl, .002);
    ash.add(bowl);
    var rim = new T.Mesh(new T.TorusGeometry(.35, .024, 6, 22), M.steelPale);
    rim.rotation.x = Math.PI * .5; rim.position.y = .23; ash.add(rim);
    var ashFill = AM.cyl(.29, .29, .04, 20, M.ash, false);
    ashFill.position.y = .21; ash.add(ashFill);
    var rnd2 = AM.rng(13);
    for (var c = 0; c < 5; c++) {
      var cig = AM.cyl(.018, .02, .18 + rnd2() * .06, 5, M.paper, false);
      cig.rotation.z = Math.PI * .5 + (rnd2() - .5) * .8;
      cig.rotation.y = rnd2() * 6.28;
      cig.position.set((rnd2() - .5) * .34, .235, (rnd2() - .5) * .34);
      ash.add(cig);
      var ember = AM.sphere(.018, 6, 4, M.ember, false);
      ember.position.copy(cig.position); ember.position.y += .01; ash.add(ember);
    }
    var emberGlow = AM.sprite(ash, TEX.glowRed, 0xff8844, .72, .28);
    emberGlow.position.y = .35;
    ash.position.set(7.3, 0, 6.0);
    ash.rotation.y = -.5;
    root.add(ash);
    AM.ashtrayGlow = emberGlow;

    // Clip the base into the atmosphere with a very soft ambient shadow plane.
    var contact = new T.Mesh(new T.PlaneGeometry(22, 22), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uColor: { value: new T.Color(0x020302) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform vec3 uColor; void main(){ vec2 p=vUv-.5; float d=length(p)*2.0; float a=smoothstep(1.0,.36,d)*.62; gl_FragColor=vec4(uColor,a); }'
    }));
    contact.rotation.x = -Math.PI * .5;
    contact.position.y = -.185;
    contact.renderOrder = -10;
    scene.add(contact);

    AM.baseRoot = root;
    return root;
  };
})();
