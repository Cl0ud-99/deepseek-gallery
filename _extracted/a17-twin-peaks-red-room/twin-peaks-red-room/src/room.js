/* =========================================================
   room.js — half-cut Red Room, velvet curtains, corridor
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C, L = TP.L;
  var R = TP.Room = TP.Room || {};
  var Rm = L.room;
  TP.anim = TP.anim || { curtains: [] };

  function fringeTexture() {
    var W = 512, H = 128, cv = TP.canvas(W, H), g = cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    var r = TP.rng(91);
    for (var x = 0; x < W; x += 3) {
      var len = 55 + r() * 65;
      g.strokeStyle = 'rgba(208,165,86,' + (.5 + r() * .4) + ')';
      g.lineWidth = 1 + r() * 1.5;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 2, len); g.stroke();
      if (r() > .8) {
        g.fillStyle = 'rgba(237,196,115,.75)';
        g.beginPath(); g.arc(x, len, 1.5 + r() * 1.5, 0, 6.28); g.fill();
      }
    }
    g.fillStyle = 'rgba(180,138,71,.55)';
    g.fillRect(0, 0, W, 4);
    return TP.texture(cv, {});
  }
  var fringeTex = null;

  function makeValanceGeo(width, height, segs, swags, depth) {
    var pos = [], uv = [], idx = [];
    var rows = 4;
    for (var i = 0; i <= segs; i++) {
      var u = i / segs;
      var x = (u - .5) * width;
      for (var j = 0; j <= rows; j++) {
        var v = j / rows;
        var y = -v * height;
        if (v > .98) y += .055 * Math.sin(u * Math.PI * swags * 2) * Math.sign(Math.sin(u * Math.PI * swags * 2));
        var z = Math.sin(u * Math.PI * swags * 2 + .4) * depth * (.25 + .75 * v);
        z += Math.sin(u * 27 + v * 4) * depth * .18;
        pos.push(x, y, z);
        uv.push(u, v);
      }
    }
    for (var a = 0; a < segs; a++) {
      for (var b = 0; b < rows; b++) {
        var k = a * (rows + 1) + b;
        idx.push(k, k + 1, k + (rows + 1), k + 1, k + (rows + 1) + 1, k + (rows + 1));
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* curtain panel --------------------------------------------- */
  function makeCurtainGeo(width, height, sx, sy, folds, depth, phase, tie, options) {
    options = options || {};
    var geo = new T.PlaneGeometry(width, height, sx, sy);
    geo.translate(0, height / 2, 0);
    var pos = geo.attributes.position;
    var base = [];
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i);
      var u = x / width + .5, v = y / height;
      var tieFactor = 1;
      if (tie != null) {
        var tv = tie;
        tieFactor = 1 - .34 * Math.exp(-Math.pow((v - tv) / .115, 2));
      }
      var gather = 1 - .08 * Math.pow(Math.max(0, 1 - v), 2);
      var nx = x * tieFactor * gather;
      var fold = Math.sin(u * Math.PI * 2 * folds + phase) * depth +
                 Math.sin(u * Math.PI * 2 * folds * 2.17 + phase * 1.9) * depth * .28 +
                 Math.sin(u * Math.PI * 2 * folds * .47 + phase * .7) * depth * .2;
      var z = fold * (.28 + .72 * Math.sin(Math.PI * Math.min(1, v * 1.05)));
      z += Math.sin(v * 7.1 + phase) * depth * .09;
      var bx = nx + Math.sin(v * 4.0 + phase) * depth * .15;
      var by = y;
      if (v < .045) {
        by -= (1 - v / .045) * (.03 + .025 * Math.sin(u * 17 + phase));
        bx += Math.sin(u * 13 + phase) * .035;
        z += .06 * (1 - v / .045);
      }
      if (tie != null) {
        var q = Math.exp(-Math.pow((v - tie) / .13, 2));
        z += q * Math.sin(u * 33 + phase) * .035;
      }
      pos.setXYZ(i, bx, by, z);
      base.push(bx, by, z, u, v);
    }
    geo.userData.curtainBase = new Float32Array(base);
    geo.computeVertexNormals();
    return geo;
  }

  function addCurtain(parent, opts) {
    var geo = makeCurtainGeo(opts.width, opts.height, opts.sx || 34, opts.sy || 30, opts.folds || 5, opts.depth || .12, opts.phase || 0, opts.tie, opts);
    var mat = TP.toon(opts.color || 0xffffff, {
      map: opts.deep ? TP.Tex.velvetDeep() : TP.Tex.velvet(),
      gradientMap: TP.gradSoft,
      side: T.DoubleSide,
      emissive: 0x410008,
      emissiveIntensity: opts.emissive === undefined ? 1.02 : opts.emissive,
      rim: .18,
      rimColor: 0x7e2630,
      rimPower: 2.7
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.set(opts.x, opts.baseY === undefined ? Rm.floorY : opts.baseY, opts.z);
    if (opts.ry) mesh.rotation.y = opts.ry;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    TP.anim.curtains.push({
      mesh: mesh,
      geo: geo,
      base: geo.userData.curtainBase,
      phase: opts.phase || 0,
      amp: opts.amp === undefined ? .075 : opts.amp,
      tie: opts.tie
    });
    return mesh;
  }

  function tieback(parent, x, y, z, ry, scale) {
    var g = TP.group(parent, x, y, z);
    g.rotation.y = ry || 0;
    var gold = TP.brass(0xd4a95e, .25);
    var ring = new T.Mesh(new T.TorusGeometry(.22, .033, 6, 20), gold);
    ring.rotation.x = Math.PI / 2;
    ring.scale.x = 1.35;
    ring.position.y = .0;
    g.add(ring);
    var knot = new T.Mesh(new T.SphereGeometry(.095, 12, 8), gold);
    knot.scale.set(1.4, .8, .8);
    knot.position.set(.28, 0, .07);
    g.add(knot);
    for (var i = -1; i <= 1; i += 2) {
      var cord = new T.Mesh(new T.CylinderGeometry(.014, .022, .34, 5), gold);
      cord.position.set(.3 + i * .075, -.20, .08);
      cord.rotation.z = i * .08;
      g.add(cord);
      var tas = new T.Mesh(new T.CylinderGeometry(.045, .022, .35, 7), TP.toon(0xcf9c4d, {}));
      tas.position.set(.3 + i * .075, -.48, .08);
      g.add(tas);
      TP.ink(tas, .0022);
    }
    if (scale) g.scale.setScalar(scale);
    return g;
  }

  /* walls / stage --------------------------------------------- */
  R.build = function (scene) {
    fringeTex = fringeTexture();
    R.root = TP.group(scene, 0, 0, 0);
    var root = R.root;
    var winTop = Rm.topY - Rm.floorY;

    var blackStone = TP.physical(0x0c0f11, {
      map: TP.Tex.marbleBlack(), roughness: .28, metalness: .18,
      clearcoat: .75, clearcoatRoughness: .15, envMapIntensity: 1.3
    });
    var stageStone = TP.physical(0x181511, {
      map: TP.Tex.marbleBlack(), roughness: .38, metalness: .1,
      clearcoat: .5, clearcoatRoughness: .22, envMapIntensity: .9
    });
    var woodWall = TP.toon(0x5c4b3d, {
      map: TP.Tex.woodDark(), gradientMap: TP.gradSoft, rim: .14, rimColor: 0x7b7d68
    });
    woodWall.map.repeat.set(2.6, 1.7);
    var woodTrim = TP.toon(0x36271d, { map: TP.Tex.woodDark(), gradientMap: TP.gradSoft, rim: .1, rimColor: 0x7b6748 });
    var brass = TP.brass(0xa87c3c, .25);
    var gold = TP.gold(.18);
    var velvetM = TP.toon(0xffffff, {
      map: TP.Tex.velvet(), gradientMap: TP.gradSoft,
      side: T.DoubleSide, emissive: 0x170004, emissiveIntensity: .5,
      rim: .17, rimColor: 0x81242d
    });

    /* ===== stage foundation ===== */
    var stage = TP.group(root, 0, 0, 0);
    var tiers = [
      { w: 11.5, d: 9.9, h: .18, y: .13, mat: stageStone },
      { w: 11.1, d: 9.5, h: .26, y: .31, mat: blackStone },
      { w: 10.75, d: 9.15, h: .36, y: .57, mat: stageStone },
      { w: 10.35, d: 8.75, h: .16, y: .93, mat: blackStone }
    ];
    for (var ti = 0; ti < tiers.length; ti++) {
      var tr = tiers[ti];
      var slab = TP.box(tr.w, tr.h, tr.d, tr.mat, stage, 0, tr.y, Rm.cz, true, true, .002);
      slab.receiveShadow = true;
    }
    // thin brass lines around stage
    var bandY = [0.235, 0.78, 1.005];
    for (var bi = 0; bi < bandY.length; bi++) {
      var y = bandY[bi];
      var w = bi === 0 ? 11.52 : bi === 1 ? 10.78 : 10.37;
      var d = bi === 0 ? 9.92 : bi === 1 ? 9.17 : 8.77;
      TP.box(w, .017, .025, brass, stage, 0, y, Rm.cz + d / 2, false, false);
      TP.box(.025, .017, d, brass, stage, w / 2, y, Rm.cz, false, false);
    }
    // warm under-glow at cutaway lip
    var glowStripMat = new T.MeshBasicMaterial({ color: 0xbb2e24, toneMapped: false });
    TP.box(10.32, .022, .025, glowStripMat, stage, 0, 1.055, Rm.cz + 4.37, false, false);
    TP.box(.025, .022, 8.74, glowStripMat, stage, 5.17, 1.055, Rm.cz, false, false);
    var stripGlow = TP.addGlow(root, TP.Tex.glow(), 0xff3c2a, 6.6, .16, .2, 1.16, Rm.cz + 4.2, false);
    stripGlow.material.depthWrite = false;
    R.lipGlow = stripGlow;

    // mossy shadow creeping over stage edge
    var moss = TP.toon(0x2d4232, { map: TP.Tex.ground(), rim: .08, rimColor: 0x5f7e66 });
    for (var me = 0; me < 6; me++) {
      var ang = (me / 6) * Math.PI * 1.7 + .4;
      var mm = TP.mesh(TP.puddingGeo(1.1, .08, .7, .55, 12, 7), moss, stage,
        Math.cos(ang) * 5.1, 1.06 + .01, Rm.cz + Math.sin(ang) * 4.35);
      mm.scale.set(.7 + (me % 3) * .3, 1, .7);
      mm.castShadow = false; mm.receiveShadow = true;
    }

    /* ===== steps ===== */
    var stepMat = TP.physical(0x14171a, { map: TP.Tex.marbleBlack(), roughness: .25, metalness: .15, clearcoat: .8, envMapIntensity: 1.2 });
    var carpetMat = TP.toon(0x7e0c19, { map: TP.Tex.velvet(), gradientMap: TP.gradSoft, emissive: 0x140003, emissiveIntensity: .45, rim: .12, rimColor: 0x91242e });
    for (var s = 0; s < 4; s++) {
      var top = 1.03 - s * .235;
      var z = 4.0 + s * .40;
      var step = TP.box(3.8 - s * .16, .235, .42, stepMat, stage, 0, top - .1175, z, true, true, .002);
      step.receiveShadow = true;
      // gold nosing
      TP.box(3.82 - s * .16, .018, .035, brass, stage, 0, top + .004, z - .205, false, false);
      // red velvet runner
      var runner = TP.box(1.5, .012, .33, carpetMat, stage, 0, top + .009, z, false, false);
      runner.receiveShadow = true;
    }
    // side cheeks for staircase
    TP.box(.17, .7, 1.8, woodTrim, stage, -1.92, .70, 4.6, true, true, .0025);
    TP.box(.17, .7, 1.8, woodTrim, stage, 1.92, .70, 4.6, true, true, .0025);
    TP.box(.17, .16, 1.8, brass, stage, -1.92, 1.03, 4.6, false, false);
    TP.box(.17, .16, 1.8, brass, stage, 1.92, 1.03, 4.6, false, false);

    /* ===== floor ===== */
    var floorTex = TP.Tex.chevron();
    var floorMat = TP.physical(0xbfb7aa, {
      map: floorTex, roughness: .52, metalness: .02,
      clearcoat: .36, clearcoatRoughness: .28, envMapIntensity: .3
    });
    floorTex.repeat.set(1.35, 1.12);
    var floor = new T.Mesh(new T.PlaneGeometry(9.6, 7.85), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, Rm.floorY + .012, Rm.cz);
    floor.receiveShadow = true;
    root.add(floor);
    R.floor = floor;
    // black marble floor border
    var fbY = Rm.floorY + .026;
    TP.box(9.85, .045, .16, blackStone, root, 0, fbY, Rm.z1 - .02, false, false);
    TP.box(9.85, .045, .16, blackStone, root, 0, fbY, Rm.z0 + .02, false, false);
    TP.box(.16, .045, 7.92, blackStone, root, Rm.x0 + .02, fbY, Rm.cz, false, false);
    TP.box(.16, .045, 7.92, blackStone, root, Rm.x1 - .02, fbY, Rm.cz, false, false);
    TP.box(9.9, .018, .022, brass, root, 0, fbY + .022, Rm.z1 + .005, false, false);
    TP.box(.022, .018, 7.95, brass, root, Rm.x1 + .005, fbY + .022, Rm.cz, false, false);

    /* ===== walls ===== */
    var wallBottom = Rm.floorY;
    var wallH = Rm.topY - Rm.floorY;
    // back wall split around portal
    var portalW = 3.05, portalH = 4.65;
    var sideW = (9.7 - portalW) / 2;
    // back left and right
    TP.box(sideW, wallH, .32, woodWall, root, -(portalW / 2 + sideW / 2), wallBottom + wallH / 2, Rm.z0 - .14, true, true, .0023);
    TP.box(sideW, wallH, .32, woodWall, root, (portalW / 2 + sideW / 2), wallBottom + wallH / 2, Rm.z0 - .14, true, true, .0023);
    TP.box(portalW, wallH - portalH, .32, woodWall, root, 0, wallBottom + portalH + (wallH - portalH) / 2, Rm.z0 - .14, true, true, .0023);
    // left wall
    TP.box(.32, wallH, 7.95, woodWall, root, Rm.x0 - .16, wallBottom + wallH / 2, Rm.cz, true, true, .0023);
    // exterior board battens (back)
    for (var b = 0; b < 7; b++) {
      var bx = -4.5 + b * 1.5;
      if (Math.abs(bx) < 1.7) continue;
      TP.box(.09, wallH - .2, .07, woodTrim, root, bx, wallBottom + wallH / 2, Rm.z0 - .32, true, true, .0024);
    }
    // battens left outside
    for (var bl = 0; bl < 6; bl++) {
      var bz = -4.0 + bl * 1.45;
      TP.box(.07, wallH - .2, .09, woodTrim, root, Rm.x0 - .34, wallBottom + wallH / 2, bz, true, true, .0024);
    }

    /* corner posts and top cornice */
    var corners = [
      [Rm.x0 - .06, Rm.z0 + .06], [Rm.x1 + .06, Rm.z0 + .06],
      [Rm.x0 - .06, Rm.z1 - .06], [Rm.x1 + .06, Rm.z1 - .06]
    ];
    for (var c = 0; c < corners.length; c++) {
      var post = TP.box(.24, wallH + .32, .24, woodTrim, root, corners[c][0], wallBottom + wallH / 2 - .08, corners[c][1], true, true, .0026);
      TP.box(.32, .09, .32, brass, root, corners[c][0], wallBottom + .12, corners[c][1], false, false);
      TP.box(.34, .13, .34, woodTrim, root, corners[c][0], Rm.topY - .18, corners[c][1], true, true, .0026);
      TP.box(.30, .035, .30, brass, root, corners[c][0], Rm.topY - .07, corners[c][1], false, false);
    }
    // top perimeter beam
    var beamY = Rm.topY - .14;
    // Only the two closed walls carry a cornice; the cutaway edges stay open.
    TP.box(9.92, .24, .18, woodTrim, root, 0, beamY, Rm.z0 - .06, true, true, .0025);
    TP.box(.18, .24, 8.0, woodTrim, root, Rm.x0 - .06, beamY, Rm.cz, true, true, .0025);
    TP.box(10.0, .032, .03, brass, root, 0, beamY + .135, Rm.z0 - .06, false, false);

    /* ===== curtains ===== */
    var top = Rm.topY - .10;
    var curtainH = top - Rm.floorY - .06;
    var backZ = Rm.z0 + .22;
    // back wall curtains (left / right of portal)
    addCurtain(root, { width: sideW - .1, height: curtainH, x: -(portalW / 2 + sideW / 2), z: backZ, folds: 5.6, depth: .18, phase: .7, amp: .075, deep: false, sy: 34 });
    addCurtain(root, { width: sideW - .1, height: curtainH, x: (portalW / 2 + sideW / 2), z: backZ, folds: 5.2, depth: .19, phase: 1.9, amp: .07, deep: true, sy: 34 });
    // left wall
    addCurtain(root, { width: 7.55, height: curtainH, x: Rm.x0 + .22, z: Rm.cz, ry: Math.PI / 2, folds: 9.5, depth: .17, phase: 2.6, amp: .075, deep: false, sx: 52 });
    // right wall (only back half, front half open)
    addCurtain(root, { width: 3.15, height: curtainH, x: Rm.x1 - .20, z: -2.92, ry: -Math.PI / 2, folds: 4.3, depth: .17, phase: 4.1, amp: .08, deep: true, sx: 30 });
    // right front gathered curtain beside the cut
    var rightCurtain = addCurtain(root, {
      width: .95, height: curtainH, x: Rm.x1 - .30, z: .70, ry: -Math.PI / 2,
      folds: 3.4, depth: .18, phase: 5.0, amp: .06, deep: false, tie: .52, sx: 16
    });
    tieback(root, Rm.x1 - .50, Rm.floorY + curtainH * .52, .70, -Math.PI / 2, .76);
    // small gathered inner curtain returns at portal
    addCurtain(root, { width: 1.18, height: curtainH, x: -2.18, z: backZ - .08, folds: 3.3, depth: .20, phase: 3.3, amp: .05, deep: false, tie: .50, sx: 18 });
    addCurtain(root, { width: 1.18, height: curtainH, x: 2.18, z: backZ - .08, folds: 3.5, depth: .20, phase: 3.8, amp: .05, deep: true, tie: .50, sx: 18 });
    tieback(root, -1.84, Rm.floorY + curtainH * .50, backZ - .14, 0, .78);
    tieback(root, 1.84, Rm.floorY + curtainH * .50, backZ - .14, 0, .78);
    // header curtain above portal
    addCurtain(root, {
      width: portalW + .25, height: top - (Rm.floorY + portalH) + .10,
      x: 0, z: backZ - .03, baseY: Rm.floorY + portalH - .04,
      folds: 3.6, depth: .1, phase: 4.9, amp: .025, deep: true, sy: 12
    });

    // front heavy curtains tied back at corners
    var frontZ = Rm.z1 - .10;
    var lf = addCurtain(root, { width: 1.35, height: curtainH, x: -4.16, z: frontZ, ry: .08, folds: 4.2, depth: .22, phase: 1.2, amp: .105, deep: false, tie: .48, sx: 18 });
    var rf = addCurtain(root, { width: 1.0, height: curtainH, x: 4.45, z: frontZ, ry: -.08, folds: 3.9, depth: .21, phase: 2.8, amp: .105, deep: false, tie: .48, sx: 16 });
    tieback(root, -4.16, Rm.floorY + curtainH * .48, frontZ + .16, 0, .92);
    tieback(root, 4.45, Rm.floorY + curtainH * .48, frontZ + .14, 0, .82);

    // curtain pools at the foot
    var poolMat = TP.toon(0xffffff, { map: TP.Tex.velvet(), gradientMap: TP.Tex ? TP.gradSoft : TP.gradSoft, emissive: 0x110003, emissiveIntensity: .45, rim: .08, rimColor: 0x6d1a24 });
    for (var p = 0; p < 7; p++) {
      var px = [-3.85, 3.85, -3.2, 3.3, -4.5, 4.4, 0][p];
      var pz = [3.02, 3.0, 3.14, 3.12, -2.2, -2.1, -4.04][p];
      var pool = TP.mesh(TP.puddingGeo(.65 + (p % 3) * .18, .12, .42, .55, 12, 7), poolMat, root, px, Rm.floorY + .045, pz);
      pool.rotation.y = (p * 1.7) % 3.14;
      pool.castShadow = false; pool.receiveShadow = true;
    }

    /* valance and rails */
    var valMat = TP.toon(0xffffff, {
      map: TP.Tex.velvetDeep(), gradientMap: TP.gradSoft, side: T.DoubleSide,
      emissive: 0x130003, emissiveIntensity: .5, rim: .15, rimColor: 0x76212b
    });
    function addValance(x, y, z, w, h, swags, ry) {
      var geo = makeValanceGeo(w, h, 54, swags, .12);
      var mesh = new T.Mesh(geo, valMat);
      mesh.position.set(x, y, z);
      if (ry) mesh.rotation.y = ry;
      mesh.castShadow = false; mesh.receiveShadow = true;
      root.add(mesh);
      // fringe strip
      var fringe = new T.Mesh(new T.PlaneGeometry(w, .23), new T.MeshBasicMaterial({
        map: fringeTex, transparent: true, alphaTest: .22, side: T.DoubleSide, depthWrite: false, toneMapped: false, color: 0xd1a456
      }));
      fringe.position.set(x, y - h - .02, z + (ry ? 0 : .09));
      if (ry === Math.PI / 2) fringe.position.x = x + .09;
      if (ry === -Math.PI / 2) fringe.position.x = x - .09;
      fringe.rotation.y = ry || 0;
      fringe.renderOrder = 3;
      root.add(fringe);
      // tassels at gentle scallop dips
      for (var q = 0; q < swags; q++) {
        var tx = (q + .5) / swags;
        var lx = (tx - .5) * w;
        var tassel = TP.group(root, x, y - h + .01, z);
        if (ry === Math.PI / 2) { tassel.position.set(x + .09, y - h + .01, z - lx); tassel.rotation.y = -Math.PI / 2; }
        else if (ry === -Math.PI / 2) { tassel.position.set(x - .09, y - h + .01, z + lx); tassel.rotation.y = Math.PI / 2; }
        else tassel.position.x += lx;
        if (ry === Math.PI / 2 || ry === -Math.PI / 2) {
          // position already set
        }
        var knot = new T.Mesh(new T.SphereGeometry(.045, 8, 6), gold);
        knot.position.y = -.03; tassel.add(knot);
        var skirt = new T.Mesh(new T.CylinderGeometry(.055, .032, .25, 7), TP.toon(0xc99b4d, {}));
        skirt.position.y = -.17; tassel.add(skirt);
        TP.ink(skirt, .0018);
      }
      return mesh;
    }
    // The side walls' brass rails are dressed with pinned-back fabric; no pelmet
    // crosses the open cutaway, so the interior stays legible from above.

    // curtain rods
    var rodMat = TP.brass(0xb58a45, .22);
    function rod(x1, z1, x2, z2, y) {
      var a = new T.Vector3(x1, y, z1), b = new T.Vector3(x2, y, z2);
      var m = new T.Mesh(new T.CylinderGeometry(.035, .035, a.distanceTo(b), 8), rodMat);
      m.position.copy(a).add(b).multiplyScalar(.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      m.castShadow = false; root.add(m);
      TP.ink(m, .0022);
      var cap = new T.Mesh(new T.SphereGeometry(.075, 10, 8), rodMat);
      cap.position.copy(b); root.add(cap);
      TP.ink(cap, .0023);
      var cap2 = new T.Mesh(new T.SphereGeometry(.075, 10, 8), rodMat);
      cap2.position.copy(a); root.add(cap2);
      TP.ink(cap2, .0023);
    }
    rod(Rm.x0 - .02, Rm.z0 + .08, Rm.x1 + .02, Rm.z0 + .08, top + .08);
    rod(Rm.x0 + .02, Rm.z1 + .02, Rm.x1 - .02, Rm.z1 + .02, top + .08);
    rod(Rm.x0 + .02, Rm.z0 + .05, Rm.x0 + .02, Rm.z1 - .02, top + .08);
    rod(Rm.x1 - .02, Rm.z0 + .05, Rm.x1 - .02, Rm.z1 - .02, top + .08);

    /* ===== portal / corridor ===== */
    R.buildPortal = function () {
      var pg = TP.group(root, 0, 0, 0);
      var portalTop = Rm.floorY + portalH;
      var backZ = Rm.z0;
      // portal frame
      TP.box(.26, portalH + .75, .22, woodTrim, pg, -portalW / 2 - .14, Rm.floorY + (portalH + .1) / 2, backZ + .12, true, true, .0025);
      TP.box(.26, portalH + .75, .22, woodTrim, pg, portalW / 2 + .14, Rm.floorY + (portalH + .1) / 2, backZ + .12, true, true, .0025);
      TP.box(portalW + .55, .25, .22, woodTrim, pg, 0, portalTop + .2, backZ + .12, true, true, .0025);
      TP.box(portalW + .7, .055, .2, brass, pg, 0, portalTop + .36, backZ + .12, false, false);
      TP.box(portalW + .7, .055, .2, brass, pg, 0, portalTop + .02, backZ + .12, false, false);
      var headGlow = TP.addGlow(pg, TP.Tex.glow(), 0xff4a30, 3.5, .20, 0, portalTop - .2, backZ + .3, false);
      headGlow.material.depthWrite = false;

      // corridor stage support
      var corridorFloorY = Rm.floorY - .02;
      var corr = TP.group(pg, 0, 0, 0);
      var corrW = 3.0, corrD = 2.8, corrBack = backZ - corrD;
      var corrMat = TP.physical(0x101214, { map: TP.Tex.marbleBlack(), roughness: .35, metalness: .1, clearcoat: .5, envMapIntensity: .6 });
      TP.box(corrW + .5, .85, corrD + .3, corrMat, corr, 0, .54, backZ - corrD / 2 - .1, true, true, .002);
      var cf = new T.Mesh(new T.PlaneGeometry(corrW, corrD), floorMat);
      cf.rotation.x = -Math.PI / 2;
      cf.position.set(0, corridorFloorY + .02, backZ - corrD / 2);
      cf.receiveShadow = true;
      corr.add(cf);
      // corridor walls, lined with dark curtains
      addCurtain(corr, { width: corrD, height: portalH - .15, x: -corrW / 2 + .04, z: backZ - corrD / 2, ry: Math.PI / 2, folds: 3.1, depth: .13, phase: 5.3, amp: .018, deep: true, sx: 18, sy: 24 });
      addCurtain(corr, { width: corrD, height: portalH - .15, x: corrW / 2 - .04, z: backZ - corrD / 2, ry: -Math.PI / 2, folds: 3.4, depth: .13, phase: 2.2, amp: .018, deep: true, sx: 18, sy: 24 });
      // ceiling drape
      var ceil = new T.Mesh(makeCurtainGeo(corrW, 1.7, 14, 8, 3, .09, 1.4, null), valMat);
      ceil.rotation.x = -Math.PI / 2;
      ceil.rotation.z = Math.PI;
      ceil.position.set(0, portalTop - .05, backZ - .2);
      corr.add(ceil);
      // golden ribs / portal frames receding
      for (var i = 0; i < 3; i++) {
        var z = backZ - .1 - i * .85;
        var sc = 1 - i * .10;
        TP.box(.10, portalH * sc, .10, brass, corr, -corrW / 2 * sc, corridorFloorY + portalH * sc / 2, z, false, false);
        TP.box(.10, portalH * sc, .10, brass, corr, corrW / 2 * sc, corridorFloorY + portalH * sc / 2, z, false, false);
        TP.box(corrW * sc + .16, .10, .10, brass, corr, 0, corridorFloorY + portalH * sc, z, false, false);
      }
      // far red glow and curtains
      var farGlowMat = new T.MeshBasicMaterial({ color: 0x5b080b, toneMapped: false });
      var farGlow = new T.Mesh(new T.PlaneGeometry(corrW - .3, portalH - .4), farGlowMat);
      farGlow.position.set(0, corridorFloorY + portalH / 2, corrBack + .12);
      corr.add(farGlow);
      TP.addGlow(corr, TP.Tex.glow(), 0xff2b20, 3.4, .58, 0, corridorFloorY + portalH * .55, corrBack + .5, false);
      // far curtains pulled apart
      addCurtain(corr, { width: .72, height: portalH - .25, x: -.85, z: corrBack + .28, folds: 2.4, depth: .12, phase: 4.8, amp: .02, deep: true, sx: 12, sy: 22 });
      addCurtain(corr, { width: .72, height: portalH - .25, x: .85, z: corrBack + .28, folds: 2.6, depth: .12, phase: 4.1, amp: .02, deep: true, sx: 12, sy: 22 });
      var farLight = new T.PointLight(0xff3b28, 1.45, 5.5, 2);
      farLight.position.set(0, corridorFloorY + 2.4, corrBack + .65);
      corr.add(farLight);
      R.corridorLight = farLight;
      R.portal = corr;
      return corr;
    };
    R.buildPortal();

    /* open cutaway — no pane obscures the interior */
    R.glass = [];

    /* ===== lights ===== */
    var spot = new T.SpotLight(0xffd9aa, .52, 18, 1.03, .95, 1.35);
    spot.position.set(0, 9.0, 1.1);
    spot.target.position.set(0, 1.2, -.4);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -.0009;
    spot.shadow.normalBias = .018;
    root.add(spot); root.add(spot.target);
    var warmFill = new T.PointLight(0xffc38c, 1.25, 11, 2);
    warmFill.position.set(-.4, 4.4, 1.6);
    root.add(warmFill);
    var centerFill = new T.PointLight(0xffb579, .48, 8.5, 2);
    centerFill.position.set(.1, 2.9, -.3);
    root.add(centerFill);
    var furnitureFill = new T.PointLight(0xffd0a4, 1.05, 6.6, 2);
    furnitureFill.position.set(0, 2.05, 1.25);
    root.add(furnitureFill);
    var seatRim = new T.PointLight(0x9fc5be, .50, 7.5, 2);
    seatRim.position.set(.2, 3.2, 3.9);
    root.add(seatRim);
    var redFill = new T.PointLight(0xff344d, 1.28, 10.5, 2);
    redFill.position.set(-1.6, 4.2, -3.5);
    root.add(redFill);
    var redFill2 = new T.PointLight(0xff2937, .98, 9.0, 2);
    redFill2.position.set(3.2, 3.4, -3.4);
    root.add(redFill2);
    var spill = new T.PointLight(0xffa05f, 1.45, 10.5, 2);
    spill.position.set(.1, 2.1, 4.5);
    root.add(spill);
    R.lights = { spot: spot, warmFill: warmFill, redFill: redFill, redFill2: redFill2, spill: spill, centerFill: centerFill, furnitureFill: furnitureFill, seatRim: seatRim };

    // soft halos to sell the warm interior through the rain
    var glowTex = TP.Tex.glow();
    R.roomHalo = TP.addGlow(root, glowTex, 0xff9b5d, 12.0, .27, 0, 4.4, 2.5, false);
    R.roomHalo.material.depthWrite = false;
    R.roomHalo.renderOrder = 4;
    R.roomHalo2 = TP.addGlow(root, glowTex, 0xff4b32, 7.0, .18, 0, 3.4, -4.1, false);
    R.roomHalo2.material.depthWrite = false;

    // light pools on the chevron floor
    var poolTexture = TP.Tex.glow();
    var floorPoolMat = new T.MeshBasicMaterial({
      map: poolTexture, color: 0xffc16b, transparent: true, opacity: .10,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    var floorPool = new T.Mesh(new T.PlaneGeometry(7.2, 5.6), floorPoolMat);
    floorPool.rotation.x = -Math.PI / 2;
    floorPool.position.set(0, Rm.floorY + .032, -.2);
    root.add(floorPool);
    R.floorPool = floorPool;

    // two small brass sconces against the back curtains
    function addSconce(x, mirror) {
      var sg = TP.group(root, x, 4.9, -4.18);
      var plate = new T.Mesh(new T.SphereGeometry(.16, 12, 8), brass);
      plate.scale.set(1, 1.5, .36);
      plate.position.z = -.02;
      sg.add(plate); TP.ink(plate, .0022);
      var arm = TP.curveTube([
        new T.Vector3(0, -.1, 0),
        new T.Vector3(mirror * .10, -.22, .22),
        new T.Vector3(mirror * .16, -.02, .34)
      ], .024, brass, sg, 14, 5);
      TP.ink(arm, .002);
      var cup = new T.Mesh(new T.CylinderGeometry(.12, .075, .13, 12, 1, true), new T.MeshPhysicalMaterial({
        color: 0xffcf9b, roughness: .22, transparent: true, opacity: .68,
        emissive: 0xff8f45, emissiveIntensity: .9, side: T.DoubleSide, depthWrite: false
      }));
      cup.position.set(mirror * .16, .07, .34); sg.add(cup);
      var candle = new T.Mesh(new T.CylinderGeometry(.032, .038, .25, 8), TP.toon(0xe7d7b7, {}));
      candle.position.set(mirror * .16, .02, .34); sg.add(candle); TP.ink(candle, .0017);
      var flame = new T.Mesh(new T.SphereGeometry(.035, 8, 6), new T.MeshBasicMaterial({ color: new T.Color().setRGB(4.2, 1.8, .5), toneMapped: false }));
      flame.scale.y = 1.9; flame.position.set(mirror * .16, .21, .34); sg.add(flame);
      var g1 = TP.addGlow(sg, TP.Tex.glow(), 0xffa860, 1.8, .42, mirror * .16, .21, .34, false);
      var drip = new T.Mesh(new T.CylinderGeometry(.033, .020, .10, 6), TP.toon(0xd2bb94, {}));
      drip.position.set(mirror * .23, -.09, .34); sg.add(drip);
      return sg;
    }
    addSconce(-2.72, 1);
    addSconce(2.72, -1);

    return root;
  };
})();
