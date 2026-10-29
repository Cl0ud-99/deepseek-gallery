/* =========================================================
   ground.js — plinth, terrain, wet road, muddy path
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C;
  var G = TP.Ground = {};

  TP.L = {
    half: 12.6,
    groundY: .065,
    roadY: .155,
    pathY: .145,
    room: {
      cx: 0, cz: -.82,
      x0: -4.85, x1: 4.85,
      z0: -4.58, z1: 3.38,
      floorY: 1.06,
      topY: 7.78,
      stageH: 1.0
    }
  };

  var L = TP.L;

  function roundedRectShape(w, d, r) {
    var s = new T.Shape();
    var x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function slabGeo(w, d, h, r, bevel) {
    var shape = roundedRectShape(w, d, r);
    var geo = new T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bevel === undefined ? .065 : bevel,
      bevelThickness: bevel === undefined ? .05 : bevel,
      curveSegments: 5
    });
    geo.rotateX(-Math.PI / 2);
    // Extrude goes +Z; after rotate it occupies y 0..h, z flipped.
    geo.translate(0, 0, 0);
    return geo;
  }

  /* road centerline ------------------------------------------- */
  G.roadPoints = [
    new T.Vector3(-11.95, L.roadY, 9.95),
    new T.Vector3(-8.5, L.roadY, 9.85),
    new T.Vector3(-4.0, L.roadY, 9.7),
    new T.Vector3(1.7, L.roadY, 9.35),
    new T.Vector3(6.9, L.roadY, 8.05),
    new T.Vector3(9.8, L.roadY, 4.95),
    new T.Vector3(10.55, L.roadY, .3),
    new T.Vector3(10.55, L.roadY, -12.15)
  ];
  G.roadCurve = new T.CatmullRomCurve3(G.roadPoints, false, 'centripetal');

  function offsetRibbonGeo(points, offset, width, segments, uvV) {
    var curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    var n = segments || 180;
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = curve.getPoint(t), tan = curve.getTangent(t);
      var sx = tan.z, sz = -tan.x;
      var sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
      for (var j = 0; j <= 1; j++) {
        var u = j;
        var off = offset + (u - .5) * width;
        pos.push(p.x + sx * off, p.y, p.z + sz * off);
        uv.push(u, t * (uvV === undefined ? 15 : uvV));
      }
    }
    for (var ii = 0; ii < n; ii++) {
      var a = ii * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function makeDashedLineGeo(points, width, dash, gap, segments) {
    var curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    var pos = [], uv = [], idx = [];
    var count = 0;
    var total = segments || 260;
    var i = 0;
    while (i < total) {
      var start = i / total;
      var end = Math.min(1, (i + dash) / total);
      var sub = new T.CatmullRomCurve3([curve.getPoint(start), curve.getPoint((start + end) / 2), curve.getPoint(end)]);
      for (var k = 0; k <= 4; k++) {
        var tt = k / 4, p = sub.getPoint(tt), tan = sub.getTangent(tt);
        var sx = tan.z, sz = -tan.x, sl = Math.hypot(sx, sz) || 1;
        sx /= sl; sz /= sl;
        for (var j = 0; j <= 1; j++) {
          var off = (j - .5) * width;
          pos.push(p.x + sx * off, p.y, p.z + sz * off);
          uv.push(j, tt);
        }
      }
      for (var q = 0; q < 4; q++) {
        var a = (count * 5 + q) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      count++;
      i += dash + gap;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* build base ------------------------------------------------- */
  G.buildBase = function (scene) {
    var root = TP.group(scene, 0, 0, 0);
    G.root = root;
    var woodMat = TP.std(0x6a5b48, {
      map: TP.Tex.woodDark(), roughness: .66, metalness: .06, envMapIntensity: .5
    });
    woodMat.map.repeat.set(2.2, 1.8);
    var bodyMat = TP.std(0x272622, { roughness: .48, metalness: .16, envMapIntensity: .8 });
    var brassMat = TP.brass(0x8f6a33, .3);
    var wineMat = TP.physical(C.wineDeep, { roughness: .5, metalness: .02, clearcoat: .15, envMapIntensity: .35 });

    // lower foot
    var foot = new T.Mesh(slabGeo(26.15, 26.15, .3, .30, .06), bodyMat);
    foot.position.y = -1.5;
    foot.receiveShadow = true; foot.castShadow = true;
    root.add(foot);

    // main wooden body
    var body = new T.Mesh(slabGeo(25.35, 25.35, .88, .26, .07), woodMat);
    body.position.y = -1.2;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // red felt inlay band
    var bandH = .10;
    var bandY = -.86;
    var north = TP.box(25.25, bandH, .022, wineMat, root, 0, bandY, 12.55, false, false);
    var south = TP.box(25.25, bandH, .022, wineMat, root, 0, bandY, -12.55, false, false);
    var east = TP.box(.022, bandH, 25.25, wineMat, root, 12.55, bandY, 0, false, false);
    var west = TP.box(.022, bandH, 25.25, wineMat, root, -12.55, bandY, 0, false, false);

    // brass pin-stripes
    var stripY1 = -.28, stripY2 = -1.215;
    function perimeterStrip(y, thick, depth, mat) {
      TP.box(25.35, thick, depth, mat, root, 0, y, 12.68 - depth / 2, false, false);
      TP.box(25.35, thick, depth, mat, root, 0, y, -12.68 + depth / 2, false, false);
      TP.box(depth, thick, 25.35, mat, root, 12.68 - depth / 2, y, 0, false, false);
      TP.box(depth, thick, 25.35, mat, root, -12.68 + depth / 2, y, 0, false, false);
    }
    perimeterStrip(stripY1, .045, .035, brassMat);
    perimeterStrip(stripY2, .035, .025, brassMat);

    // upper cap slab
    var capMat = TP.std(0x1e2423, { roughness: .42, metalness: .18, envMapIntensity: .9 });
    var cap = new T.Mesh(slabGeo(25.70, 25.70, .28, .25, .065), capMat);
    cap.position.y = -.27;
    cap.castShadow = true; cap.receiveShadow = true;
    root.add(cap);

    // top rim brass (thin)
    perimeterStrip(-.045, .025, .09, brassMat);

    // plaque on the front face
    var plaqueGrp = TP.group(root, 0, -.72, 12.72);
    var plaqueBack = TP.box(3.55, 1.16, .09, TP.physical(0x101112, { roughness: .3, metalness: .5, envMapIntensity: 1.2 }), plaqueGrp, 0, 0, 0, false, true, .0025);
    var plaque = TP.plane(3.30, 1.02, TP.basic(0xffffff, { map: TP.Tex.plaque(), transparent: false }));
    plaque.position.set(0, 0, .052); plaqueGrp.add(plaque);
    plaqueGrp.rotation.x = 0;

    // little brass feet / corner studs
    for (var i = 0; i < 4; i++) {
      var sx = i % 2 ? 11.6 : -11.6;
      var sz = i < 2 ? 11.6 : -11.6;
      var stud = TP.cyl(.12, .12, .07, 12, brassMat, root, sx, -1.5, sz, true, true, .0025);
      stud.rotation.x = Math.PI / 2;
      stud.position.y = -1.53;
      stud.rotation.z = 0;
    }

    // stone/soil lip around the terrain
    var soilMat = TP.std(0x2e2a21, { map: TP.Tex.woodDark(), roughness: .92, metalness: .02, envMapIntensity: .2 });
    soilMat.map.repeat.set(3, 1);
    var soil = new T.Mesh(slabGeo(24.65, 24.65, .15, .18, .035), soilMat);
    soil.position.y = -.10;
    soil.receiveShadow = true;
    root.add(soil);

    // actual mossy ground
    var gtex = TP.Tex.ground();
    var gmat = TP.std(0xffffff, {
      map: gtex, roughness: .83, metalness: .02, envMapIntensity: .28
    });
    var ground = new T.Mesh(new T.PlaneGeometry(24.28, 24.28, 1, 1), gmat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = L.groundY;
    ground.receiveShadow = true;
    root.add(ground);
    G.ground = ground;

    // a low stone curb; interrupted by the road on the right
    var curbMat = TP.std(0x81877a, { roughness: .48, metalness: .08, envMapIntensity: .9, emissive: 0x0a0d0a, emissiveIntensity: .25 });
    var goldLine = TP.std(0x6f5a31, { metalness: .6, roughness: .34, envMapIntensity: 1.0 });
    var curbY = L.groundY + .025;
    function curb(w, d, x, z) {
      TP.box(w, .09, d, curbMat, root, x, curbY, z, true, true, .002);
      TP.box(w * .97, .012, d * .45, goldLine, root, x, curbY + .052, z - d * .26, false, false);
    }
    curb(24.45, .34, 0, -12.0);              // rear rim
    curb(.34, 24.45, -12.0, 0);              // west rim
    curb(23.2, .34, -.8, 12.0);              // front rim, winding up before the road turn
    curb(.28, 9.0, 12.18, 7.4);              // narrow east curb beyond the asphalt shoulder
    // moss spilling over the curb
    var curbMoss = TP.toon(0x344b39, { map: gtex, rim: .08, rimColor: 0x67836b });
    for (var cm = 0; cm < 18; cm++) {
      var side = cm % 3;
      var cx = side === 0 ? -11.6 + (cm * 1.33) % 22.6 : (side === 1 ? -12.0 : (cm % 2 ? -8.0 : 9.0));
      var cz = side === 0 ? -12.0 : (side === 1 ? -10.2 + (cm * 1.16) % 21.6 : 12.0);
      var mossClump = TP.mesh(TP.puddingGeo(.5 + (cm % 4) * .2, .06, .28, .55, 8, 5), curbMoss, root, cx, curbY + .05, cz);
      mossClump.castShadow = false;
    }

    // broad irregular moss/earth mounds around the rim (subtle relief)
    var r = TP.rng(109);
    var moundMat = TP.toon(0x354a37, { map: gtex, rim: .10, rimColor: 0x66847b });
    for (var m = 0; m < 18; m++) {
      var a = (m / 18) * Math.PI * 2 + r() * .2;
      var rad = 10.1 + r() * 1.9;
      var x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      var wid = 1.2 + r() * 2.5;
      var mound = TP.mesh(TP.puddingGeo(wid, .16 + r() * .18, wid * (.6 + r() * .4), .55, 14, 8), moundMat, root, x, L.groundY + .03, z);
      mound.rotation.y = r() * 6.28;
      mound.castShadow = false; mound.receiveShadow = true;
    }

    // a few flat rocks at perimeter to mask the perfect square
    return root;
  };

  /* build road ------------------------------------------------- */
  G.buildRoad = function (root) {
    var asphalt = TP.Tex.asphalt();
    var roadMat = TP.std(0x929c99, {
      map: asphalt.map, roughnessMap: asphalt.rough,
      roughness: .82, metalness: .05,
      envMapIntensity: .25
    });
    roadMat.map.repeat.set(1, 1);
    asphalt.map.wrapS = asphalt.map.wrapT = T.RepeatWrapping;
    asphalt.rough.wrapS = asphalt.rough.wrapT = T.RepeatWrapping;

    var segs = 220;
    var roadGeo = TP.ribbonGeo(G.roadPoints, 3.72, segs, 24);
    var road = new T.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    road.renderOrder = 1;
    root.add(road);
    G.road = road;

    // gravel shoulder under the road
    var shoulderMat = TP.std(0x3f382d, { map: TP.Tex.mud(), roughness: .88, metalness: .02, envMapIntensity: .15 });
    shoulderMat.map.repeat.set(1.4, 1);
    var shoulder = new T.Mesh(TP.ribbonGeo(G.roadPoints, 4.55, segs, 24), shoulderMat);
    shoulder.position.y = -.015;
    shoulder.receiveShadow = true;
    root.add(shoulder);

    var lineMat = TP.std(0x77756b, {
      roughness: .82, metalness: .01,
      emissive: 0x070705, emissiveIntensity: .12, envMapIntensity: .08
    });
    var lineInner = new T.Mesh(offsetRibbonGeo(G.roadPoints, 1.60, .045, segs, 1), lineMat);
    var lineOuter = new T.Mesh(offsetRibbonGeo(G.roadPoints, -1.60, .045, segs, 1), lineMat);
    lineInner.position.y = .008; lineOuter.position.y = .008;
    lineInner.receiveShadow = lineOuter.receiveShadow = true;
    root.add(lineInner); root.add(lineOuter);

    var dashes = new T.Mesh(makeDashedLineGeo(G.roadPoints, .045, 7, 12, 380), TP.std(0x676152, {
      roughness: .82, metalness: .01, emissive: 0x050504, emissiveIntensity: .1, envMapIntensity: .08
    }));
    dashes.position.y = .007;
    root.add(dashes);

    // dark tar seams & patches near the curve
    var tarMat = TP.std(0x0a0d0d, { roughness: .34, metalness: .12, envMapIntensity: .9 });
    var r = TP.rng(292);
    for (var p = 0; p < 13; p++) {
      var t = .12 + r() * .78;
      var pt = G.roadCurve.getPoint(t);
      var tan = G.roadCurve.getTangent(t);
      var sx = tan.z, sz = -tan.x;
      var patch = TP.mesh(TP.puddingGeo(.35 + r() * .9, .008, .22 + r() * .5, .4, 12, 6), tarMat, root,
        pt.x + sx * (r() - .5) * 2.4, L.roadY + .012, pt.z + sz * (r() - .5) * 2.4);
      patch.rotation.y = r() * 6.28;
      patch.castShadow = false; patch.receiveShadow = true;
    }
    return road;
  };

  /* muddy path to the woods ------------------------------------ */
  G.buildPath = function (root) {
    var pts = [
      new T.Vector3(-7.55, L.pathY, 8.8),
      new T.Vector3(-7.9, L.pathY, 6.8),
      new T.Vector3(-8.25, L.pathY, 4.7),
      new T.Vector3(-8.45, L.pathY, 2.45),
      new T.Vector3(-8.9, L.pathY, -.6),
      new T.Vector3(-9.15, L.pathY, -3.2),
      new T.Vector3(-9.5, L.pathY, -5.6),
      new T.Vector3(-9.35, L.pathY, -8.1)
    ];
    G.pathPoints = pts;
    var under = TP.physical(0x322a1e, {
      map: TP.Tex.mud(), roughness: .46, metalness: .06,
      clearcoat: .55, clearcoatRoughness: .15, envMapIntensity: .9
    });
    under.map.repeat.set(1.2, 1.2);
    var underMesh = new T.Mesh(TP.ribbonGeo(pts, 2.20, 100, 9), under);
    underMesh.position.y = .005; underMesh.receiveShadow = true;
    root.add(underMesh);

    var mudMat = TP.physical(0x665744, {
      map: TP.Tex.mud(), roughness: .48, metalness: .03,
      clearcoat: .5, clearcoatRoughness: .18, envMapIntensity: 1.1
    });
    mudMat.map.repeat.set(1, 2.5);
    var path = new T.Mesh(TP.ribbonGeo(pts, 1.35, 100, 9), mudMat);
    path.position.y = .018; path.receiveShadow = true;
    root.add(path);
    G.path = path;

    // stepping stones
    var stoneMat = TP.std(0x53554c, { roughness: .53, metalness: .02, envMapIntensity: .55 });
    var r = TP.rng(18);
    var curve = new T.CatmullRomCurve3(pts);
    for (var i = 0; i < 13; i++) {
      var t = .05 + i / 14;
      var p = curve.getPoint(t);
      var s = TP.mesh(TP.puddingGeo(.34 + r() * .22, .05, .25 + r() * .18, .4, 9, 5), stoneMat, root,
        p.x + (r() - .5) * .7, L.pathY + .035, p.z + (r() - .5) * .45);
      s.rotation.y = r() * 6.28; s.receiveShadow = true;
    }

    // shallow ditch alongside the path
    var ditchPts = [
      new T.Vector3(-6.35, .09, 7.35),
      new T.Vector3(-6.75, .08, 6.35),
      new T.Vector3(-7.1, .08, 5.35),
      new T.Vector3(-7.65, .07, 4.45)
    ];
    var ditchBed = TP.physical(0x141b16, { roughness: .25, metalness: .1, clearcoat: .8, envMapIntensity: 1.1 });
    var ditch = new T.Mesh(TP.ribbonGeo(ditchPts, .48, 28, 2), ditchBed);
    ditch.receiveShadow = true;
    root.add(ditch);
    var water = new T.Mesh(TP.ribbonGeo(ditchPts, .33, 28, 2), TP.physical(0x0d1719, {
      roughness: .10, metalness: .35, clearcoat: 1, clearcoatRoughness: .03,
      transparent: true, opacity: .72, envMapIntensity: 2.2
    }));
    water.position.y = .015; water.receiveShadow = true;
    root.add(water);
    G.ditchWater = water;
    var pipeMat = TP.std(0x3e3b31, { roughness: .48, metalness: .55, envMapIntensity: 1.2 });
    var pipe = new T.Mesh(new T.CylinderGeometry(.20, .22, .34, 12, 1, true), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.rotation.y = -.5;
    pipe.position.set(-7.45, .10, 4.62);
    root.add(pipe);
    TP.ink(pipe, .0025);

    // low banks of reeds along the ditch
    return path;
  };

  G.build = function (scene) {
    var root = G.buildBase(scene);
    G.buildRoad(root);
    G.buildPath(root);
    return root;
  };
})();
