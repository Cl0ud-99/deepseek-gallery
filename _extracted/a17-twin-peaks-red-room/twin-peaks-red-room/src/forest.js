/* =========================================================
   forest.js — twelve sycamores, understory, owl
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C, L = TP.L;
  var F = TP.Forest = TP.Forest || {};
  F.trees = [];

  function addColorAttr(g) {
    if (g.attributes.color) return g;
    var n = g.attributes.position.count;
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { arr[i * 3] = 1; arr[i * 3 + 1] = 1; arr[i * 3 + 2] = 1; }
    g.setAttribute('color', new T.BufferAttribute(arr, 3));
    return g;
  }

  function mergeGeos(list) {
    var pos = [], norm = [], uv = [];
    var total = 0;
    var converted = [];
    for (var i = 0; i < list.length; i++) {
      var g = list[i].index ? list[i].toNonIndexed() : list[i];
      converted.push(g);
      total += g.attributes.position.count;
    }
    var P = new Float32Array(total * 3), N = new Float32Array(total * 3), U = new Float32Array(total * 2);
    var off = 0;
    for (var k = 0; k < converted.length; k++) {
      var gg = converted[k];
      var pp = gg.attributes.position.array, nn = gg.attributes.normal ? gg.attributes.normal.array : null;
      var uu = gg.attributes.uv ? gg.attributes.uv.array : null;
      var cnt = gg.attributes.position.count;
      for (var a = 0; a < cnt; a++) {
        P[(off + a) * 3] = pp[a * 3]; P[(off + a) * 3 + 1] = pp[a * 3 + 1]; P[(off + a) * 3 + 2] = pp[a * 3 + 2];
        if (nn) { N[(off + a) * 3] = nn[a * 3]; N[(off + a) * 3 + 1] = nn[a * 3 + 1]; N[(off + a) * 3 + 2] = nn[a * 3 + 2]; }
        if (uu) { U[(off + a) * 2] = uu[a * 2]; U[(off + a) * 2 + 1] = uu[a * 2 + 1]; }
      }
      off += cnt;
    }
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(P, 3));
    out.setAttribute('normal', new T.BufferAttribute(N, 3));
    out.setAttribute('uv', new T.BufferAttribute(U, 2));
    return out;
  }

  function cylBetween(list, a, b, rb, rt, radial) {
    var d = new T.Vector3().subVectors(b, a);
    var len = d.length();
    if (len < .0001) return;
    var g = new T.CylinderGeometry(rt, rb, len, radial || 7, 1, false);
    var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    var m = new T.Matrix4().compose(a.clone().addScaledVector(d, .5), q, new T.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    list.push(g);
  }

  function treeData(i) {
    var defs = [
      { deg: 15, r: 8.88, h: 8.4, lean: .25 },
      { deg: 70, r: 8.6, h: 9.2, lean: -.35 },
      { deg: 95, r: 9.25, h: 8.0, lean: .28 },
      { deg: 120, r: 8.92, h: 9.7, lean: .18 },
      { deg: 145, r: 9.42, h: 7.7, lean: -.4 },
      { deg: 170, r: 8.72, h: 9.2, lean: .32 },
      { deg: 195, r: 9.20, h: 8.7, lean: -.22 },
      { deg: 220, r: 8.85, h: 9.8, lean: .38 },
      { deg: 245, r: 9.35, h: 7.6, lean: -.28 },
      { deg: 270, r: 8.98, h: 9.2, lean: .2 },
      { deg: 300, r: 8.65, h: 8.3, lean: -.3 },
      { deg: 335, r: 9.12, h: 9.4, lean: .24 }
    ];
    return defs[i];
  }

  function makeSycamore(index, def) {
    var ang = def.deg * Math.PI / 180;
    var cx = Math.sin(ang) * def.r;
    var cz = -.8 + Math.cos(ang) * def.r;
    var r = TP.rng(7919 + index * 313);
    var h = def.h;
    var group = TP.group(TP.world, cx, L.groundY, cz);
    var worldOut = Math.atan2(cx, cz + .8);
    group.rotation.y = r() * 6.28;
    var localOut = worldOut - group.rotation.y;
    var parts = [];
    var leafTips = [];
    var branchPts = [];
    var leanX = (def.lean + (r() - .5) * .45);
    var leanZ = (r() - .5) * .42;
    // trunk curves
    var pts = [
      new T.Vector3(0, 0, 0),
      new T.Vector3(leanX * .08, h * .21, leanZ * .06),
      new T.Vector3(leanX * .3 + (r() - .5) * .12, h * .42, leanZ * .25),
      new T.Vector3(leanX * .6 + (r() - .5) * .18, h * .60, leanZ * .52),
      new T.Vector3(leanX * .95, h * .78, leanZ * .8)
    ];
    var trunkRad = [.31 * (def.h / 7.7), .26, .18, .12, .06];
    for (var s = 0; s < pts.length - 1; s++) {
      cylBetween(parts, pts[s], pts[s + 1], trunkRad[s], trunkRad[s + 1], 8);
    }
    // root flares
    for (var rt = 0; rt < 5; rt++) {
      var aa = rt / 5 * TAU + r() * .4;
      var start = new T.Vector3(0, .38, 0);
      var end = new T.Vector3(Math.cos(aa) * (.55 + r() * .5), .04, Math.sin(aa) * (.55 + r() * .5));
      cylBetween(parts, start, end, .18, .03, 5);
    }
    // primary limbs — slim, high branching habit
    var branchCount = 3;
    for (var b = 0; b < branchCount; b++) {
      var t = .56 + b * .09 + r() * .035;
      var idx = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      var base = pts[idx].clone().lerp(pts[idx + 1], (t * (pts.length - 1)) - idx);
      var ba = localOut + (b - 1) * .86 + (r() - .5) * .55;
      var up = .62 + r() * .45;
      var len = (1.85 + r() * 1.05) * (def.h / 8.5);
      var dir = new T.Vector3(Math.cos(ba), up, Math.sin(ba)).normalize();
      var mid = base.clone().addScaledVector(dir, len * .46);
      mid.x += (r() - .5) * .38; mid.z += (r() - .5) * .38;
      var end = base.clone().addScaledVector(dir, len);
      end.y += .6 + r() * .45;
      end.x += (r() - .5) * .45; end.z += (r() - .5) * .45;
      cylBetween(parts, base, mid, .15, .08, 6);
      cylBetween(parts, mid, end, .08, .03, 5);
      branchPts.push({ base: base, end: end, mid: mid });
      // split twigs
      var twigN = 2;
      for (var tw = 0; tw < twigN; tw++) {
        var twa = ba + (tw - .5) * .75 + (r() - .5) * .35;
        var twl = .8 + r() * .7;
        var twEnd = end.clone().add(new T.Vector3(Math.cos(twa) * twl, .36 + r() * .6, Math.sin(twa) * twl));
        cylBetween(parts, end, twEnd, .027, .009, 4);
        leafTips.push(twEnd.clone());
        branchPts.push({ base: end, end: twEnd, twig: true });
      }
      leafTips.push(end.clone());
    }
    // leader crown
    var top = pts[pts.length - 1].clone();
    var leader = top.clone().add(new T.Vector3(Math.cos(localOut) * .35, .9 + r() * .5, Math.sin(localOut) * .35));
    cylBetween(parts, top, leader, .055, .012, 4);
    leafTips.push(leader);
    for (var lf = 0; lf < 2; lf++) {
      var la = localOut + (lf ? 1 : -1) * (.55 + r() * .35);
      var lend = top.clone().add(new T.Vector3(Math.cos(la) * (.7 + r() * .6), .8 + r() * .55, Math.sin(la) * (.7 + r() * .6)));
      cylBetween(parts, top, lend, .042, .008, 4);
      leafTips.push(lend);
    }

    var bark = TP.Tex.bark();
    var barkMat = TP.toon(0xa9ada0, {
      map: bark, gradientMap: TP.gradSoft, rim: .22, rimColor: 0x7fa09a, rimPower: 2.5
    });
    var merged = mergeGeos(parts);
    var treeMesh = new T.Mesh(merged, barkMat);
    treeMesh.castShadow = true; treeMesh.receiveShadow = true;
    TP.ink(treeMesh, .0024);
    group.add(treeMesh);
    var data = {
      index: index, group: group, base: new T.Vector3(cx, L.groundY, cz),
      height: h, leafTips: leafTips, branchPts: branchPts, top: group.localToWorld(leader.clone()),
      radius: def.r, angle: ang, barkMat: barkMat
    };

    // ===== foliage clusters, collected globally =====
    var clusters = [];
    var palette = [0x1d3024, 0x243b2d, 0x2d4633, 0x18291f, 0x354d37, 0x223528];
    function maybeAddCluster(p, sx, sy, sz) {
      var wp = tpWorld(p, group);
      var rad = Math.hypot(wp.x, wp.z + .8);
      // leave a breathing hole over the cutaway room
      if (rad < 6.15) return;
      // open a clear sightline into the room from the default viewing gap
      var ang = Math.atan2(wp.x, wp.z + .8);
      var diff = Math.abs(Math.atan2(Math.sin(ang - .60), Math.cos(ang - .60)));
      if (diff < .80 && rad < 14.7 && wp.y < 8.45) return;
      // keep low leaves out of the front sightline
      if (wp.z > 2.2 && wp.y < 6.1 && Math.abs(wp.x) < 8.2) return;
      clusters.push({
        p: wp, sx: sx, sy: sy, sz: sz,
        color: palette[(r() * palette.length) | 0],
        rot: r() * 6.28
      });
    }
    for (var q = 0; q < leafTips.length; q++) {
      var tip = leafTips[q].clone();
      var n = 3 + (q % 2);
      for (var c = 0; c < n; c++) {
        var cp = tip.clone().add(new T.Vector3((r() - .5) * .58, (r() - .5) * .42 + .04, (r() - .5) * .58));
        maybeAddCluster(cp, .36 + r() * .34, .27 + r() * .23, .36 + r() * .34);
      }
    }
    // crown mass
    for (var cm = 0; cm < 3; cm++) {
      var cp2 = new T.Vector3(Math.cos(localOut) * (r() * 1.0) + (r() - .5) * .9, h * .83 + (r() - .5) * .9, Math.sin(localOut) * (r() * 1.0) + (r() - .5) * .9);
      maybeAddCluster(cp2, .65 + r() * .45, .42 + r() * .28, .65 + r() * .45);
    }
    data.clusters = clusters;
    F.leafClusters = F.leafClusters || [];
    for (var ci = 0; ci < clusters.length; ci++) F.leafClusters.push(clusters[ci]);
    F.trees.push(data);
    return group;
  }

  var TAU = Math.PI * 2;
  var _m = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3();
  function tpWorld(local, group) {
    group.updateMatrixWorld(true);
    return group.localToWorld(local.clone());
  }

  /* leaf cards from clusters ------------------------------- */
  function buildFoliage() {
    var clusters = F.leafClusters || [];
    var blobGeo = new T.SphereGeometry(1, 11, 8);
    var bp = blobGeo.attributes.position;
    for (var bj = 0; bj < bp.count; bj++) {
      var bx = bp.getX(bj), by = bp.getY(bj), bz = bp.getZ(bj);
      var jitter = 1 + (Math.sin(bx * 9.3 + by * 7.1) * .10 + Math.sin(bz * 11.7 - bx * 4.1) * .08);
      bp.setXYZ(bj, bx * jitter, by * jitter, bz * jitter);
    }
    blobGeo.computeVertexNormals();
    addColorAttr(blobGeo);
    var blobMat = TP.toon(0xffffff, {
      map: TP.Tex.foliage(), gradientMap: TP.gradSoft, rim: .42, rimColor: 0xa8c2b5, rimPower: 2.2,
      emissive: 0x09130c, emissiveIntensity: .45
    });
    blobMat.vertexColors = true;
    var blobs = new T.InstancedMesh(blobGeo, blobMat, clusters.length);
    blobs.castShadow = true; blobs.receiveShadow = true;
    blobs.frustumCulled = false;
    var dummy = new T.Object3D();
    var col = new T.Color();
    for (var i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      dummy.position.copy(c.p);
      dummy.rotation.set(.2 + (i % 5) * .1, c.rot, .1);
      dummy.scale.set(c.sx, c.sy, c.sz);
      dummy.updateMatrix();
      blobs.setMatrixAt(i, dummy.matrix);
      col.setHex(c.color);
      // lift and tint to fit the cold night
      col.offsetHSL((i % 7 - 3) * .003, .02, .015 * ((i % 5) - 2));
      blobs.setColorAt(i, col);
    }
    blobs.instanceMatrix.needsUpdate = true;
    if (blobs.instanceColor) blobs.instanceColor.needsUpdate = true;
    TP.world.add(blobs);
    F.blobs = blobs;

    // leaf cards
    var cardGeo = new T.PlaneGeometry(1, 1);
    addColorAttr(cardGeo);
    var leafMat = TP.toon(0xffffff, {
      map: TP.Tex.leaf(), alphaTest: .34, side: T.DoubleSide,
      emissive: 0x0a120c, emissiveIntensity: .2, rim: .28, rimColor: 0x93aaa0
    });
    leafMat.vertexColors = true;
    var cardCount = 0;
    var maxCards = 9000;
    var r = TP.rng(4471);
    var cards = new T.InstancedMesh(cardGeo, leafMat, maxCards);
    cards.castShadow = false; cards.receiveShadow = false;
    cards.frustumCulled = false;
    var palette = [0x607762, 0x4e6c58, 0x405c4a, 0x728873, 0x35503f, 0x59745e];
    for (var ci = 0; ci < clusters.length; ci++) {
      var cl = clusters[ci];
      var cc = 10 + (ci % 4);
      for (var j = 0; j < cc && cardCount < maxCards; j++) {
        var phi = r() * Math.PI * 2, cos = r() * 2 - 1, sin = Math.sqrt(1 - cos * cos);
        var rad = .92 + r() * .55;
        var pos = cl.p.clone().add(new T.Vector3(Math.cos(phi) * sin * rad * cl.sx, cos * rad * cl.sy, Math.sin(phi) * sin * rad * cl.sz));
        dummy.position.copy(pos);
        dummy.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
        var sc = .22 + r() * .25;
        dummy.scale.set(sc, sc * (.78 + r() * .34), sc);
        dummy.updateMatrix();
        cards.setMatrixAt(cardCount, dummy.matrix);
        col.setHex(palette[(r() * palette.length) | 0]);
        cards.setColorAt(cardCount, col);
        cardCount++;
      }
    }
    cards.count = cardCount;
    cards.instanceMatrix.needsUpdate = true;
    if (cards.instanceColor) cards.instanceColor.needsUpdate = true;
    TP.world.add(cards);
    F.leafCards = cards;

    // larger leaf sprays break up the silhouettes of the round crowns
    var sprayGeo = new T.PlaneGeometry(1, 1);
    addColorAttr(sprayGeo);
    var sprayMat = TP.toon(0xffffff, {
      map: TP.Tex.leafSpray(), alphaTest: .28, side: T.DoubleSide,
      emissive: 0x0a130c, emissiveIntensity: .28, rim: .20, rimColor: 0x8fa99a
    });
    sprayMat.vertexColors = true;
    var maxSpray = 2200;
    var sprays = new T.InstancedMesh(sprayGeo, sprayMat, maxSpray);
    sprays.castShadow = false; sprays.frustumCulled = false;
    var spCount = 0;
    var spPalette = [0x475f4c, 0x52694f, 0x3b5343, 0x687d5d, 0x345040, 0x5d7354];
    for (var si = 0; si < clusters.length; si++) {
      var scl = clusters[si];
      var nSp = 2 + (si % 2);
      for (var sj = 0; sj < nSp && spCount < maxSpray; sj++) {
        var sphi = r() * Math.PI * 2, scos = r() * 2 - 1, ssin = Math.sqrt(1 - scos * scos);
        var srad = 1.05 + r() * .35;
        var spos = scl.p.clone().add(new T.Vector3(Math.cos(sphi) * ssin * srad * scl.sx, scos * srad * scl.sy * .9, Math.sin(sphi) * ssin * srad * scl.sz));
        dummy.position.copy(spos);
        dummy.rotation.set(r() * 6.28, r() * 6.28, r() * 6.28);
        var ssz = .44 + r() * .38;
        dummy.scale.set(ssz, ssz * (.8 + r() * .4), ssz);
        dummy.updateMatrix();
        sprays.setMatrixAt(spCount, dummy.matrix);
        col.setHex(spPalette[(r() * spPalette.length) | 0]);
        sprays.setColorAt(spCount, col);
        spCount++;
      }
    }
    sprays.count = spCount;
    sprays.instanceMatrix.needsUpdate = true;
    if (sprays.instanceColor) sprays.instanceColor.needsUpdate = true;
    TP.world.add(sprays);
    F.leafSprays = sprays;
  }

  /* owl -------------------------------------------------------- */
  function makeOwl() {
    // perched in the 70-degree sycamore, facing the entrance
    var pos = new T.Vector3(7.15, 4.53, 3.35);
    var g = TP.group(TP.world, pos.x, pos.y, pos.z);
    var bodyMat = TP.toon(0x181513, { rim: .18, rimColor: 0x8c8e78, gradientMap: TP.gradSoft });
    var featherMat = TP.toon(0x2b2620, { rim: .12, rimColor: 0xa39470 });
    var body = TP.mesh(TP.puddingGeo(.34, .54, .3, .65, 12, 10), bodyMat, g, 0, .22, 0);
    body.rotation.x = -.12;
    TP.ink(body, .003);
    var head = TP.mesh(TP.sphereGeo(.19, 12, 8), bodyMat, g, 0, .52, -.015);
    head.scale.set(1.05, .94, .95);
    TP.ink(head, .003);
    // ear tufts
    for (var e = -1; e <= 1; e += 2) {
      var tuft = TP.mesh(new T.ConeGeometry(.08, .20, 5), featherMat, g, e * .13, .66, 0);
      tuft.rotation.z = -e * .2;
    }
    // folded wings
    for (var w = -1; w <= 1; w += 2) {
      var wing = TP.mesh(TP.puddingGeo(.12, .38, .18, .5, 10, 8), featherMat, g, w * .15, .25, .04);
      wing.rotation.z = w * .25;
      TP.ink(wing, .0025);
    }
    // eyes (glow discs + halo sprites)
    var eyeMat = new T.MeshBasicMaterial({ color: 0xffc25d, toneMapped: false });
    var glowTex = TP.Tex.glow();
    var eyes = [];
    for (var s = -1; s <= 1; s += 2) {
      var eye = new T.Mesh(new T.SphereGeometry(.045, 10, 8), eyeMat);
      eye.position.set(s * .085, .55, -.176);
      g.add(eye);
      var halo = new T.Sprite(new T.SpriteMaterial({
        map: glowTex, color: 0xffb44d, transparent: true, opacity: .0,
        blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
      }));
      halo.scale.set(.55, .55, 1);
      halo.position.set(s * .085, .56, -.20);
      g.add(halo);
      eyes.push({ eye: eye, halo: halo });
    }
    // beak
    var beak = new T.Mesh(new T.ConeGeometry(.055, .12, 4), featherMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, .49, -.19);
    g.add(beak);
    // feet
    var clawMat = TP.std(0x2f2b23, { roughness: .7 });
    for (var f = -1; f <= 1; f += 2) {
      var foot = new T.Mesh(new T.CylinderGeometry(.018, .03, .16, 5), clawMat);
      foot.position.set(f * .1, .03, -.02);
      g.add(foot);
    }
    // dead perch branch from the tree
    var branchMat = F.trees[1].barkMat;
    var perch = new T.Mesh(new T.CylinderGeometry(.055, .11, 2.6, 6), branchMat);
    perch.rotation.z = Math.PI / 2;
    perch.rotation.y = -.35;
    perch.position.set(-1.0, -.08, -.4);
    perch.castShadow = true;
    g.add(perch);
    TP.ink(perch, .0024);
    g.rotation.y = 1.95;
    g.rotation.x = -.03;
    F.owl = {
      group: g, eyes: eyes, eyeMat: eyeMat,
      nextFlash: 2.5, flashT: 0, level: 0
    };
  }

  /* undergrowth ------------------------------------------------ */
  function crossedGeo(w, h, planes) {
    var geos = [];
    for (var i = 0; i < planes; i++) {
      var g = new T.PlaneGeometry(w, h, 1, 1);
      g.translate(0, h / 2, 0);
      g.rotateY(i / planes * Math.PI);
      geos.push(g);
    }
    return mergeGeos(geos);
  }

  function nearRoad(x, z, margin) {
    var best = 1e9;
    for (var i = 0; i <= 100; i++) {
      var p = TP.Ground.roadCurve.getPoint(i / 100);
      var d = Math.hypot(x - p.x, z - p.z);
      if (d < best) best = d;
    }
    return best < (margin === undefined ? 2.35 : margin);
  }
  var _pathCurve = null;
  function nearPath(x, z, margin) {
    if (!TP.Ground.pathPoints) return false;
    if (!_pathCurve) _pathCurve = new T.CatmullRomCurve3(TP.Ground.pathPoints);
    var best = 1e9;
    for (var i = 0; i <= 60; i++) {
      var p = _pathCurve.getPoint(i / 60);
      var d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
      if (d < best) best = d;
    }
    return Math.sqrt(best) < margin;
  }
  F.nearRoad = nearRoad; F.nearPath = nearPath;

  function inRoom(x, z) {
    var R = L.room;
    return x > R.x0 - .9 && x < R.x1 + .9 && z > R.z0 - .9 && z < R.z1 + 1.5;
  }

  function buildUndergrowth() {
    var dummy = new T.Object3D(), col = new T.Color();
    var r = TP.rng(2477);
    var groundY = L.groundY + .01;

    // ferns
    var fernGeo = crossedGeo(.95, .92, 3);
    addColorAttr(fernGeo);
    var fernMat = TP.toon(0xffffff, {
      map: TP.Tex.fern(), alphaTest: .36, side: T.DoubleSide,
      emissive: 0x0b140d, emissiveIntensity: .22, rim: .17, rimColor: 0x7e9c86
    });
    fernMat.vertexColors = true;
    var fernCount = 70;
    var ferns = new T.InstancedMesh(fernGeo, fernMat, fernCount);
    ferns.frustumCulled = false;
    var fi = 0, tries = 0;
    while (fi < fernCount && tries < 1400) {
      tries++;
      var a = r() * TAU, rad = 6.8 + r() * 4.9;
      var x = Math.cos(a) * rad, z = -.8 + Math.sin(a) * rad;
      if (x < -11.9 || x > 11.9 || z < -11.9 || z > 11.9) continue;
      if (nearRoad(x, z, 2.5) || inRoom(x, z) || nearPath(x, z, 1.1)) continue;
      // cluster more close to trunks
      dummy.position.set(x, groundY + .01, z);
      dummy.rotation.set(0, r() * TAU, (r() - .5) * .12);
      var s = .55 + r() * .75;
      dummy.scale.set(s, s * (.8 + r() * .5), s);
      dummy.updateMatrix();
      ferns.setMatrixAt(fi, dummy.matrix);
      col.setHSL(.28 + r() * .04, .12 + r() * .13, .17 + r() * .12);
      ferns.setColorAt(fi, col);
      fi++;
    }
    ferns.count = fi;
    ferns.instanceMatrix.needsUpdate = true;
    if (ferns.instanceColor) ferns.instanceColor.needsUpdate = true;
    ferns.castShadow = false; ferns.receiveShadow = true;
    TP.world.add(ferns);
    F.ferns = ferns;

    // grass
    var grassGeo = crossedGeo(.7, .58, 2);
    addColorAttr(grassGeo);
    var grassMat = TP.toon(0xffffff, {
      map: TP.Tex.grass(), alphaTest: .32, side: T.DoubleSide,
      emissive: 0x0b120d, emissiveIntensity: .22, rim: .12, rimColor: 0x87a189
    });
    grassMat.vertexColors = true;
    var grassCount = 430;
    var grass = new T.InstancedMesh(grassGeo, grassMat, grassCount);
    grass.frustumCulled = false;
    var gi = 0; tries = 0;
    while (gi < grassCount && tries < 4000) {
      tries++;
      var gx = (r() - .5) * 24.0, gz = (r() - .5) * 24.0;
      if (nearRoad(gx, gz, 2.0) || inRoom(gx, gz)) continue;
      // avoid path center mostly
      if (nearPath(gx, gz, .7)) continue;
      dummy.position.set(gx, groundY, gz);
      dummy.rotation.set(0, r() * TAU, (r() - .5) * .18);
      var gs = .5 + r() * .9;
      dummy.scale.set(gs, gs * (.7 + r() * .7), gs);
      dummy.updateMatrix();
      grass.setMatrixAt(gi, dummy.matrix);
      col.setHSL(.25 + r() * .05, .12 + r() * .12, .20 + r() * .14);
      grass.setColorAt(gi, col);
      gi++;
    }
    grass.count = gi;
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    grass.castShadow = false; grass.receiveShadow = true;
    TP.world.add(grass);
    F.grass = grass;

    // fallen leaves, low on the floor
    var lfGeo = new T.PlaneGeometry(1, 1);
    addColorAttr(lfGeo); lfGeo.rotateX(-Math.PI / 2);
    var lfMat = TP.toon(0xffffff, {
      map: TP.Tex.leaf(), alphaTest: .35, side: T.DoubleSide,
      emissive: 0x0b110b, emissiveIntensity: .35
    });
    lfMat.vertexColors = true;
    var lfCount = 330;
    var leaves = new T.InstancedMesh(lfGeo, lfMat, lfCount);
    leaves.frustumCulled = false;
    var li = 0; tries = 0;
    while (li < lfCount && tries < 3000) {
      tries++;
      var lx = (r() - .5) * 23.8, lz = (r() - .5) * 23.8;
      if (inRoom(lx, lz)) continue;
      if (nearRoad(lx, lz, 1.5)) continue;
      dummy.position.set(lx, groundY + .014, lz);
      dummy.rotation.set(0, r() * TAU, 0);
      var ls = .15 + r() * .27;
      dummy.scale.set(ls, ls, ls);
      dummy.updateMatrix();
      leaves.setMatrixAt(li, dummy.matrix);
      col.setHSL(.12 + r() * .11, .14 + r() * .22, .22 + r() * .24);
      leaves.setColorAt(li, col);
      li++;
    }
    leaves.count = li;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.castShadow = false;
    TP.world.add(leaves);

    // mossy clumps / low shrubs
    var mossGeo = TP.puddingGeo(1.1, .26, .8, .45, 10, 6);
    addColorAttr(mossGeo);
    var mossMat = TP.toon(0xffffff, { map: TP.Tex.ground(), rim: .12, rimColor: 0x6f8b76 });
    mossMat.vertexColors = true;
    var mossCount = 110;
    var moss = new T.InstancedMesh(mossGeo, mossMat, mossCount);
    moss.frustumCulled = false;
    var mi = 0; tries = 0;
    while (mi < mossCount && tries < 2100) {
      tries++;
      var mx = (r() - .5) * 24.3, mz = (r() - .5) * 24.3;
      if (nearRoad(mx, mz, 1.9) || inRoom(mx, mz)) continue;
      dummy.position.set(mx, L.groundY + .005, mz);
      dummy.rotation.set(0, r() * TAU, 0);
      var ms = .4 + r() * 1.25;
      dummy.scale.set(ms, .5 + r() * .8, ms * (.65 + r() * .7));
      dummy.updateMatrix();
      moss.setMatrixAt(mi, dummy.matrix);
      col.setHSL(.28 + (r() - .5) * .07, .16 + r() * .14, .16 + r() * .16);
      moss.setColorAt(mi, col);
      mi++;
    }
    moss.count = mi;
    moss.instanceMatrix.needsUpdate = true;
    if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
    moss.castShadow = false; moss.receiveShadow = true;
    TP.world.add(moss);
  }

  /* mushrooms and fallen logs -------------------------------- */
  function buildSmallFlora() {
    var r = TP.rng(612);
    var capMat = TP.toon(0x8f3d2b, { rim: .1, rimColor: 0xb36a4e });
    var capMat2 = TP.toon(0xb29a75, { rim: .08, rimColor: 0xcbb18c });
    var stemMat = TP.toon(0xcfc4a9, {});
    var spotMat = TP.basic(0xe9dfc8);
    for (var i = 0; i < 10; i++) {
      var a = r() * TAU, rad = 7.2 + r() * 3.8;
      var bx = Math.cos(a) * rad, bz = -.8 + Math.sin(a) * rad;
      if (nearRoad(bx, bz, 2.3) || inRoom(bx, bz)) continue;
      for (var j = 0; j < 2 + ((r() * 4) | 0); j++) {
        var x = bx + (r() - .5) * .9, z = bz + (r() - .5) * .9;
        var h = .16 + r() * .22;
        var stem = TP.mesh(TP.cylGeo(.022, .032, h, 6, false), stemMat, TP.world, x, L.groundY + h / 2, z);
        TP.ink(stem, .0022);
        var cap = new T.Mesh(new T.SphereGeometry(.085 + r() * .05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), r() > .35 ? capMat : capMat2);
        cap.scale.y = .55;
        cap.position.set(x, L.groundY + h, z);
        cap.castShadow = true;
        TP.ink(cap, .0022);
        TP.world.add(cap);
        for (var s = 0; s < 3; s++) {
          var spot = new T.Mesh(new T.SphereGeometry(.009 + r() * .007, 5, 4), spotMat);
          var sa = r() * TAU, sr = r() * .06;
          spot.position.set(x + Math.cos(sa) * sr, L.groundY + h + .038, z + Math.sin(sa) * sr);
          TP.world.add(spot);
        }
      }
    }

    // fallen logs
    var logMat = TP.toon(0x4a3a2a, { map: TP.Tex.bark(), rim: .12, rimColor: 0x6f8e7a });
    var logPositions = [
      { a: [-9.8, .19, .2], b: [-7.1, .16, -1.6], rad: .25 },
      { a: [3.9, .16, -9.2], b: [1.4, .16, -8.1], rad: .21 }
    ];
    for (var l = 0; l < logPositions.length; l++) {
      var def = logPositions[l];
      var a = new T.Vector3().fromArray(def.a), b = new T.Vector3().fromArray(def.b);
      var dir = new T.Vector3().subVectors(b, a);
      var len = dir.length();
      var log = new T.Mesh(new T.CylinderGeometry(def.rad, def.rad * 1.14, len, 9, 1), logMat);
      log.position.copy(a).addScaledVector(dir, .5);
      log.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
      log.castShadow = true; log.receiveShadow = true;
      TP.ink(log, .0025);
      TP.world.add(log);
      // moss cap
      var moss = new T.Mesh(TP.puddingGeo(.75, .12, .33, .5, 10, 6), TP.toon(0x476445, { rim: .1, rimColor: 0x759775 }));
      moss.position.copy(log.position); moss.position.y += def.rad * .82;
      moss.rotation.copy(log.rotation);
      moss.rotation.z += .1;
      TP.world.add(moss);
    }
  }

  /* forest build ----------------------------------------------- */
  F.build = function (scene) {
    F.leafClusters = [];
    for (var i = 0; i < 12; i++) makeSycamore(i, treeData(i));
    buildFoliage();
    buildUndergrowth();
    buildSmallFlora();
    makeOwl();
    return F.trees;
  };
})();
