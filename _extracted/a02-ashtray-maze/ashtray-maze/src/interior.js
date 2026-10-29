/* =========================================================================
   ASHTRAY MAZE — observation control room (shell, glass, roof, exhibits)
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  var AM = window.AM;
  var M, TEX, ITEX;
  var root;
  var FLOOR = .64, TOP = 3.84, ROOF = 4.02;
  var X0 = -3.225, X1 = 2.125, Z0 = -2.675, Z1 = 1.575;
  var CX = (X0 + X1) * .5, CZ = (Z0 + Z1) * .5;
  var W = X1 - X0, D = Z1 - Z0;
  AM.interiorSmoke = AM.interiorSmoke || [];
  AM.reels = AM.reels || [];
  AM.screenMeshes = AM.screenMeshes || [];

  function shadow(g, cast, receive) {
    g.traverse(function (o) {
      if (o.isMesh && !o.userData.isOutline) {
        o.castShadow = cast !== false;
        o.receiveShadow = receive !== false;
      }
    });
    return g;
  }
  function noShadow(g) {
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return g;
  }
  function makeCanvas(w, h) { return AM.canvas(w, h); }
  function tex(c, opts) { return AM.tex(c, opts); }
  function cable(points, r, mat, segs) {
    var m = AM.tube(points, r || .012, mat || M.cable, segs || 24, 5);
    noShadow(m);
    return m;
  }

  function addBox(parent, w, h, d, mat, x, y, z, outline, thick, opts) {
    var m = AM.box(w, h, d, mat, outline === undefined ? false : outline, thick, opts);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function addCyl(parent, rt, rb, h, seg, mat, x, y, z, outline) {
    var m = AM.cyl(rt, rb, h, seg, mat, !!outline, .0014);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  /* -----------------------------------------------------------------------
     interior graphic pieces (generated here, not in the surface atlas)
     ----------------------------------------------------------------------- */
  function makeControlPanel(seed, variant) {
    var C = makeCanvas(1024, 512), g = C.getContext('2d');
    var rnd = AM.rng(seed);
    g.fillStyle = variant === 1 ? '#242b25' : '#1b211c'; g.fillRect(0, 0, 1024, 512);
    // brushed metal and fine dirt
    for (var i = 0; i < 1200; i++) {
      g.fillStyle = 'rgba(226,232,207,' + (rnd() * .025) + ')';
      g.fillRect(rnd() * 1024, rnd() * 512, 1 + rnd() * 18, 1);
    }
    g.strokeStyle = 'rgba(156,166,136,.35)'; g.lineWidth = 3; g.strokeRect(20, 20, 984, 472);
    g.strokeStyle = 'rgba(156,166,136,.14)'; g.lineWidth = 1;
    // panel divisions
    for (var c = 1; c < 5; c++) { g.beginPath(); g.moveTo(c * 200, 34); g.lineTo(c * 200, 480); g.stroke(); }
    g.beginPath(); g.moveTo(34, 246); g.lineTo(990, 246); g.stroke();
    // headers
    g.fillStyle = 'rgba(206,207,174,.66)';
    g.font = '600 17px "Consolas", monospace';
    var headers = ['ARRAY', 'SHIFT', 'AWE', 'PLAYBACK', 'MONITOR'];
    for (var h = 0; h < 5; h++) {
      g.fillText(headers[h], 42 + h * 200, 62);
      g.fillStyle = h === 3 ? 'rgba(226,157,90,.65)' : 'rgba(149,203,139,.5)';
      g.fillRect(42 + h * 200, 72, 48, 3);
      g.fillStyle = 'rgba(206,207,174,.66)';
    }
    // switch bank
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var bx = 46 + col * 44, by = 96 + row * 46;
        g.fillStyle = variant === 1 && col === 2 ? '#b5c776' : '#b6ac8c';
        AM.roundRect(g, bx, by, 25, 26, 4); g.fill();
        g.fillStyle = 'rgba(29,33,24,.55)'; g.fillRect(bx + 5, by + 11, 15, 4);
      }
    }
    // rotary knobs
    for (var k = 0; k < 5; k++) {
      var kx = 254 + k * 36, ky = 126;
      g.strokeStyle = 'rgba(218,197,140,.65)'; g.lineWidth = 3; g.beginPath(); g.arc(kx, ky, 12, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + 8, ky - 7); g.stroke();
    }
    // two analog strips
    for (var sl = 0; sl < 3; sl++) {
      var sx = 650 + sl * 74;
      g.fillStyle = '#0d120d'; AM.roundRect(g, sx, 90, 46, 204, 8); g.fill();
      g.fillStyle = 'rgba(148,196,124,.22)';
      for (var tick = 0; tick < 8; tick++) g.fillRect(sx + 7, 108 + tick * 24, 32, 2);
      g.fillStyle = sl === 2 ? '#df9e58' : '#a5d587';
      var fader = 90 + rnd() * 160;
      g.fillRect(sx + 10, fader, 26, 9);
    }
    // gauge
    var gx = 100, gy = 362;
    g.fillStyle = '#0b100c'; g.beginPath(); g.arc(gx, gy, 53, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(198,208,167,.5)'; g.lineWidth = 3;
    for (var a = 0; a < 10; a++) {
      var ang = Math.PI * .78 + a / 9 * Math.PI * 1.44;
      g.beginPath(); g.moveTo(gx + Math.cos(ang) * 36, gy + Math.sin(ang) * 36);
      g.lineTo(gx + Math.cos(ang) * 44, gy + Math.sin(ang) * 44); g.stroke();
    }
    g.strokeStyle = '#d48d56'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 29, gy - 24); g.stroke();
    g.fillStyle = 'rgba(205,213,177,.7)'; g.font = '700 16px "Bahnschrift Condensed", sans-serif';
    g.fillText('GEOMETRY', 72, 435);
    g.fillText('DRIFT', 72, 454);
    // label strips, warning icons, small text
    g.fillStyle = 'rgba(209,186,111,.8)';
    g.fillRect(390, 368, 196, 27);
    g.fillStyle = '#20241b'; g.font = '700 16px "Bahnschrift Condensed", sans-serif';
    g.fillText('HANDSHAKE / HOLD', 400, 387);
    g.fillStyle = 'rgba(177,204,155,.75)'; g.font = '500 14px "Consolas", monospace';
    var small = ['A-07', 'RELAY', 'TAPE LOOP', 'MAG>OPTIC', '4.002', 'NO SMOKING'];
    for (var s2 = 0; s2 < small.length; s2++) g.fillText(small[s2], 410 + (s2 % 3) * 180, 280 + Math.floor(s2 / 3) * 34);
    // amber and red indicators
    for (var li = 0; li < 26; li++) {
      var lx = 44 + (li % 13) * 68, ly = 440 + Math.floor(li / 13) * 22;
      g.fillStyle = li % 7 === 0 ? '#ce5b37' : (li % 3 === 0 ? '#d1a75a' : '#8db26d');
      g.beginPath(); g.arc(lx, ly, 4.2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(22,26,19,.8)'; g.lineWidth = 1; g.stroke();
    }
    // hazard corner
    g.save(); g.beginPath(); g.rect(870, 34, 118, 50); g.clip(); g.fillStyle = '#c6a23b'; g.fillRect(870, 34, 118, 50);
    for (var hz = -60; hz < 180; hz += 34) { g.fillStyle = '#1b2018'; g.beginPath(); g.moveTo(870 + hz, 84); g.lineTo(870 + hz + 22, 34); g.lineTo(870 + hz + 40, 34); g.lineTo(870 + hz + 18, 84); g.fill(); }
    g.restore();
    // scratches
    for (var st = 0; st < 40; st++) {
      g.strokeStyle = 'rgba(213,211,174,' + (rnd() * .10) + ')'; g.lineWidth = .6 + rnd();
      g.beginPath(); g.moveTo(rnd() * 980 + 22, rnd() * 470 + 22); g.lineTo(rnd() * 980 + 22, rnd() * 470 + 22); g.stroke();
    }
    return tex(C, { aniso: 8 });
  }

  function makeKeyboard(variant) {
    var C = makeCanvas(512, 224), g = C.getContext('2d');
    g.fillStyle = '#1d231d'; g.fillRect(0, 0, 512, 224);
    var keyFill = variant ? '#c4bca4' : '#a9aa95';
    var keyDark = '#2c3128';
    for (var row = 0; row < 5; row++) {
      var count = row === 0 ? 13 : (row === 4 ? 7 : 12);
      for (var col = 0; col < count; col++) {
        var w = row === 0 ? 30 : (row === 4 && col === 3 ? 190 : 30);
        var x = 26 + col * 35 + (row === 4 && col > 3 ? 130 : 0);
        var y = 22 + row * 35;
        g.fillStyle = keyFill;
        AM.roundRect(g, x, y, w, 26, 4); g.fill();
        g.fillStyle = 'rgba(34,37,29,.6)'; g.fillRect(x + 5, y + 7, w - 10, 2);
        g.fillStyle = 'rgba(33,36,28,.75)'; g.font = '700 11px "Consolas", monospace';
        if (row === 0 && col < count - 1) g.fillText('F' + (col + 1), x + 7, y + 18);
      }
    }
    g.fillStyle = 'rgba(219,207,159,.6)'; g.font = '600 13px "Bahnschrift Condensed", sans-serif';
    g.fillText('FBC  CONSOLIDATED  /  KEYBOARD  07', 28, 208);
    return tex(C, { aniso: 4 });
  }

  function makeClock() {
    var S = 512, C = makeCanvas(S, S), g = C.getContext('2d');
    g.fillStyle = '#d1c7a9'; g.beginPath(); g.arc(256, 256, 240, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2d3128'; g.lineWidth = 14; g.stroke();
    g.strokeStyle = 'rgba(50,53,42,.55)'; g.lineWidth = 4; g.beginPath(); g.arc(256, 256, 207, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#282c23'; g.textAlign = 'center'; g.font = '700 43px "Bahnschrift Condensed", sans-serif';
    var nums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2 - Math.PI / 2;
      g.save(); g.translate(256 + Math.cos(a) * 164, 256 + Math.sin(a) * 164); g.rotate(a + Math.PI / 2);
      g.fillText(nums[i], 0, 14); g.restore();
      g.strokeStyle = 'rgba(40,44,34,.7)'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(256 + Math.cos(a) * 194, 256 + Math.sin(a) * 194); g.lineTo(256 + Math.cos(a) * 210, 256 + Math.sin(a) * 210); g.stroke();
    }
    // hands at 3:33 (fixed)
    g.strokeStyle = '#24271f'; g.lineCap = 'round';
    g.lineWidth = 13; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(.38) * 120, 256 + Math.sin(.38) * 120); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(2.75) * 165, 256 + Math.sin(2.75) * 165); g.stroke();
    g.lineWidth = 4; g.strokeStyle = '#a74932'; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(1.10) * 180, 256 + Math.sin(1.10) * 180); g.stroke();
    g.fillStyle = '#2a2d24'; g.beginPath(); g.arc(256, 256, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(46,48,37,.6)'; g.font = '600 22px "Bahnschrift Condensed", sans-serif';
    g.fillText('FBC / A-07', 256, 342);
    // dust
    var rnd = AM.rng(4);
    for (var d = 0; d < 70; d++) { g.fillStyle = 'rgba(50,45,29,' + (rnd() * .03) + ')'; g.fillRect(rnd() * S, rnd() * S, rnd() * 10, rnd() * 3); }
    return tex(C, { aniso: 8 });
  }

  function makeBlueprint() {
    var C = makeCanvas(768, 1024), g = C.getContext('2d');
    g.fillStyle = '#17231f'; g.fillRect(0, 0, 768, 1024);
    for (var i = 0; i < 1200; i++) {
      g.fillStyle = 'rgba(201,222,185,' + (Math.random() * .018) + ')';
      g.fillRect(Math.random() * 768, Math.random() * 1024, 1 + Math.random() * 4, 1);
    }
    g.strokeStyle = 'rgba(162,195,164,.15)'; g.lineWidth = 1;
    for (var gx = 72; gx < 700; gx += 36) { g.beginPath(); g.moveTo(gx, 110); g.lineTo(gx, 900); g.stroke(); }
    for (var gy = 110; gy < 900; gy += 36) { g.beginPath(); g.moveTo(72, gy); g.lineTo(700, gy); g.stroke(); }
    g.strokeStyle = 'rgba(214,226,184,.75)'; g.lineWidth = 4;
    g.strokeRect(72, 110, 624, 790);
    g.strokeStyle = 'rgba(201,219,174,.62)'; g.lineWidth = 2;
    // maze plan
    var plan = [
      [160, 200, 470, 200], [470, 200, 470, 380], [470, 380, 610, 380], [610, 380, 610, 600],
      [610, 600, 240, 600], [240, 600, 240, 430], [240, 430, 360, 430], [360, 430, 360, 310],
      [360, 310, 160, 310], [160, 310, 160, 200]
    ];
    g.beginPath(); plan.forEach(function (p, idx) { if (!idx) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); g.stroke();
    g.strokeStyle = 'rgba(223,119,82,.72)';
    g.beginPath(); g.arc(370, 400, 48, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(370, 352); g.lineTo(370, 448); g.moveTo(322, 400); g.lineTo(418, 400); g.stroke();
    g.strokeStyle = 'rgba(200,215,166,.42)';
    g.beginPath(); g.moveTo(120, 748); g.lineTo(650, 748); g.stroke();
    g.fillStyle = 'rgba(216,226,185,.8)';
    g.font = '700 30px "Bahnschrift Condensed", sans-serif';
    g.fillText('A-07  /  MAZE ARRAY', 72, 78);
    g.font = '600 16px "Consolas", monospace';
    g.fillStyle = 'rgba(193,211,171,.65)';
    g.fillText('SHIFT SEQUENCE  /  CONCRETE + STEEL + AWE', 72, 944);
    g.fillText('DRAWN: 09.04.63   REV: 04   FBC INTERNAL', 72, 972);
    g.fillStyle = 'rgba(216,187,114,.65)'; g.font = '700 120px "Bahnschrift Condensed", sans-serif';
    g.fillText('07', 560, 940);
    // folds and stains
    g.fillStyle = 'rgba(4,8,6,.15)'; g.fillRect(386, 0, 3, 1024); g.fillRect(0, 512, 768, 3);
    for (var s = 0; s < 8; s++) {
      var cx = Math.random() * 768, cy = Math.random() * 1024, r = 30 + Math.random() * 100;
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, 'rgba(45,38,22,.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 768, 1024);
    }
    return tex(C, { aniso: 8 });
  }

  function makePinboard() {
    var C = makeCanvas(768, 512), g = C.getContext('2d');
    g.fillStyle = '#6e5f47'; g.fillRect(0, 0, 768, 512);
    var rnd = AM.rng(15);
    for (var n = 0; n < 1600; n++) {
      g.fillStyle = 'rgba(24,19,12,' + (rnd() * .045) + ')';
      g.fillRect(rnd() * 768, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    g.strokeStyle = 'rgba(208,182,127,.55)'; g.lineWidth = 18; g.strokeRect(14, 14, 740, 484);
    g.strokeStyle = 'rgba(213,198,160,.5)'; g.lineWidth = 1.5;
    for (var p = 0; p < 7; p++) {
      var x = 70 + rnd() * 520, y = 70 + rnd() * 290, pw = 90 + rnd() * 120, ph = 65 + rnd() * 90;
      g.save(); g.translate(x, y); g.rotate((rnd() - .5) * .18);
      g.fillStyle = 'rgba(216,205,178,.9)'; g.fillRect(0, 0, pw, ph);
      g.fillStyle = 'rgba(51,50,39,.5)';
      for (var l = 0; l < 6; l++) g.fillRect(9, 16 + l * 9, pw * (.3 + rnd() * .5), 2);
      g.fillStyle = '#ba4933'; g.beginPath(); g.arc(9, 6, 4, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.strokeStyle = 'rgba(169,58,42,.7)'; g.lineWidth = 3;
    var pts = [[120, 130], [310, 220], [470, 120], [560, 300], [270, 390]];
    g.beginPath(); pts.forEach(function (p2, idx) { if (!idx) g.moveTo(p2[0], p2[1]); else g.lineTo(p2[0], p2[1]); }); g.stroke();
    return tex(C, { aniso: 8 });
  }

  function makeExitSign() {
    var C = makeCanvas(512, 160), g = C.getContext('2d');
    g.fillStyle = '#1a241b'; g.fillRect(0, 0, 512, 160);
    g.strokeStyle = 'rgba(176,221,152,.4)'; g.lineWidth = 3; g.strokeRect(8, 8, 496, 144);
    g.fillStyle = 'rgba(199,243,167,.95)';
    g.font = '700 86px "Bahnschrift Condensed", sans-serif';
    g.fillText('EXIT', 118, 112);
    g.strokeStyle = 'rgba(199,243,167,.95)'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(380, 80); g.lineTo(462, 80); g.stroke();
    g.beginPath(); g.moveTo(430, 50); g.lineTo(462, 80); g.lineTo(430, 110); g.stroke();
    return tex(C, { aniso: 4 });
  }

  function makePegboard() {
    var C = makeCanvas(512, 512), g = C.getContext('2d');
    g.fillStyle = '#49533f'; g.fillRect(0, 0, 512, 512);
    for (var x = 18; x < 512; x += 30) for (var y = 18; y < 512; y += 30) {
      g.fillStyle = 'rgba(18,24,17,.4)'; g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(186,176,132,.35)'; g.lineWidth = 2;
    g.strokeRect(6, 6, 500, 500);
    var rnd = AM.rng(7);
    for (var i = 0; i < 18; i++) {
      g.fillStyle = 'rgba(197,185,149,' + (.3 + rnd() * .45) + ')';
      g.fillRect(15 + rnd() * 470, 15 + rnd() * 470, 18 + rnd() * 60, 3 + rnd() * 10);
    }
    return tex(C, { aniso: 4 });
  }

  function finishITex() {
    ITEX = AM.ITEX = {
      panelA: makeControlPanel(11, 0),
      panelB: makeControlPanel(29, 1),
      keyboardA: makeKeyboard(0),
      keyboardB: makeKeyboard(1),
      clock: makeClock(),
      blueprint: makeBlueprint(),
      pinboard: makePinboard(),
      exit: makeExitSign(),
      pegboard: makePegboard()
    };
  }

  /* -----------------------------------------------------------------------
     platform
     ----------------------------------------------------------------------- */
  function buildPlatform() {
    var g = new T.Group(); root.add(g);
    var b1 = AM.box(6.42, .22, 5.35, M.concreteB, true, .0024, { worldUV: true, uvScale: .36 });
    b1.position.set(CX, .11, CZ); shadow(b1, true, true); g.add(b1);
    var b2 = AM.box(6.15, .22, 5.1, M.concreteCool, true, .0022, { worldUV: true, uvScale: .34 });
    b2.position.set(CX, .32, CZ); shadow(b2, true, true); g.add(b2);
    var b3 = AM.box(5.72, .22, 4.65, M.concreteB, true, .0022, { worldUV: true, uvScale: .32 });
    b3.position.set(CX, .53, CZ); shadow(b3, true, true); g.add(b3);
    // soft lip / reveal bands
    [.2, .42].forEach(function (yy, idx) {
      var lip = AM.box(idx ? 6.28 : 6.56, .035, idx ? 5.23 : 5.48, M.blackMetal, false);
      lip.position.set(CX, yy, CZ); g.add(lip);
    });
    // threshold stair
    var stepW = 2.12, stepX = -1.85;
    for (var s = 0; s < 3; s++) {
      var top = .16 + s * .16;
      var h = top;
      var st = AM.box(stepW, h, .38, M.concreteB, true, .0018, { worldUV: true, uvScale: .5 });
      st.position.set(stepX, h * .5, 2.65 - s * .37);
      st.castShadow = true; st.receiveShadow = true;
      g.add(st);
      var nose = AM.box(stepW + .02, .035, .035, M.hazardStripe, false);
      nose.position.set(stepX, h + .012, 2.65 - s * .37 + .19); g.add(nose);
    }
    // stair cheek walls
    [-1, 1].forEach(function (sd) {
      var cheek = AM.box(.16, .64, 1.24, M.concreteDark, true, .0018);
      cheek.position.set(stepX + sd * (stepW * .5 + .08), .32, 2.12);
      cheek.castShadow = true; cheek.receiveShadow = true; g.add(cheek);
    });
    // handrails
    [-1, 1].forEach(function (sd) {
      var railX = stepX + sd * (stepW * .5 + .08);
      [[2.66, .52], [2.37, .68], [2.08, .84]].forEach(function (p) {
        var post = AM.cyl(.023, .023, p[1], 6, M.steelDark, false);
        post.position.set(railX, .32 + p[1] * .5, p[0]); g.add(post);
      });
      var a = new T.Vector3(railX, .88, 2.79), b = new T.Vector3(railX, 1.20, 1.97);
      var d = new T.Vector3().subVectors(b, a); var len = d.length();
      var handle = AM.cyl(.026, .026, len, 6, M.steelPale, false);
      handle.position.copy(a).addScaledVector(d, .5);
      handle.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
      g.add(handle);
    });
    // small landing at the threshold
    var landing = AM.box(2.55, .16, .52, M.concrete, true, .0018, { worldUV: true, uvScale: .45 });
    landing.position.set(stepX, .56, 1.88); landing.castShadow = true; landing.receiveShadow = true; g.add(landing);
    var mat = AM.decal(1.25, .55, TEX.stencil07, { opacity: .25, fog: false });
    mat.rotation.x = -Math.PI * .5; mat.position.set(stepX, .673, 1.85); g.add(mat);
    // door-track warning strip in front of the landing
    var lane = new T.Mesh(new T.PlaneGeometry(1.9, .16), M.hazardLane || M.hazardStripe);
    lane.rotation.x = -Math.PI * .5; lane.position.set(stepX, .675, 1.67); g.add(lane);
    // exterior sill / plugged service pass-through
    var sill = AM.box(2.75, .055, .10, M.brass, false);
    sill.position.set(stepX, .72, 1.58); g.add(sill);
    AM.roomFoundation = g;
  }

  /* -----------------------------------------------------------------------
     shell
     ----------------------------------------------------------------------- */
  function buildShell() {
    var g = new T.Group(); root.add(g);
    var wallH = TOP - FLOOR;
    var ext = M.concreteCool, inn = M.interiorWall;

    // back wall with warm interior face
    var backGeo = new T.BoxGeometry(W, wallH, .30);
    AM.worldUVBox(backGeo, .30);
    var back = new T.Mesh(backGeo, [ext, ext, ext, ext, inn, ext]);
    back.position.set(CX, FLOOR + wallH * .5, Z0 + .15);
    back.castShadow = true; back.receiveShadow = true; AM.outline(back, .0025);
    g.add(back);
    var backCap = AM.box(W + .06, .10, .38, M.concreteB, true, .0018);
    backCap.position.set(CX, TOP + .02, Z0 + .15); g.add(backCap);

    // left wall with warm interior face (+x)
    var leftGeo = new T.BoxGeometry(.30, wallH, D);
    AM.worldUVBox(leftGeo, .30);
    var left = new T.Mesh(leftGeo, [inn, ext, ext, ext, ext, ext]);
    left.position.set(X0 + .15, FLOOR + wallH * .5, CZ);
    left.castShadow = true; left.receiveShadow = true; AM.outline(left, .0025);
    g.add(left);
    var leftCap = AM.box(.38, .10, D + .06, M.concreteB, true, .0018);
    leftCap.position.set(X0 + .15, TOP + .02, CZ); g.add(leftCap);

    // corner piers, exterior and interior
    var corners = [
      [X0 + .16, Z0 + .16], [X1 - .16, Z0 + .16],
      [X0 + .16, Z1 - .16], [X1 - .16, Z1 - .16]
    ];
    corners.forEach(function (p, idx) {
      var colMat = idx === 3 ? M.steelDark : M.concrete;
      var col = AM.box(.34, wallH + .22, .34, colMat, true, .0022, { worldUV: true, uvScale: .5 });
      col.position.set(p[0], FLOOR + (wallH + .22) * .5, p[1]);
      col.castShadow = true; col.receiveShadow = true; g.add(col);
      // anchor plate
      var plate = AM.box(.5, .05, .5, M.steelDark, false);
      plate.position.set(p[0], FLOOR + .025, p[1]); g.add(plate);
      for (var b = 0; b < 4; b++) {
        var bolt = AM.cyl(.022, .022, .06, 6, M.brass, false);
        bolt.position.set(p[0] + (b % 2 ? .16 : -.16), FLOOR + .065, p[1] + (b > 1 ? .16 : -.16)); g.add(bolt);
      }
    });

    // low blast-glass parapets
    var pFrontRight = AM.box(W - .775, .46, .28, M.concreteB, true, .002, { worldUV: true, uvScale: .5 });
    pFrontRight.position.set(-.3625, FLOOR + .23, Z1 - .06); pFrontRight.castShadow = true; pFrontRight.receiveShadow = true; g.add(pFrontRight);
    var pFrontLeft = AM.box(.775, .46, .28, M.concreteB, true, .002, { worldUV: true, uvScale: .5 });
    pFrontLeft.position.set(-2.8375, FLOOR + .23, Z1 - .06); pFrontLeft.castShadow = true; pFrontLeft.receiveShadow = true; g.add(pFrontLeft);
    var pSide = AM.box(.28, .46, D, M.concreteB, true, .002, { worldUV: true, uvScale: .5 });
    pSide.position.set(X1 - .06, FLOOR + .23, CZ); pSide.castShadow = true; pSide.receiveShadow = true; g.add(pSide);
    // thin dark sill on the parapets
    [[-.3625, Z1 - .06, W - .78], [-2.8375, Z1 - .06, .78]].forEach(function (p) {
      var sill = AM.box(p[2], .035, .30, M.blackMetal, false);
      sill.position.set(p[0], FLOOR + .475, p[1]); g.add(sill);
    });
    var sill2 = AM.box(.30, .035, D, M.blackMetal, false);
    sill2.position.set(X1 - .06, FLOOR + .475, CZ); g.add(sill2);

    // interior wall base trim
    var trimBack = AM.box(W - .2, .13, .055, M.woodDark, false);
    trimBack.position.set(CX, FLOOR + .075, Z0 + .32); g.add(trimBack);
    var trimLeft = AM.box(.055, .13, D - .2, M.woodDark, false);
    trimLeft.position.set(X0 + .33, FLOOR + .075, CZ); g.add(trimLeft);

    // interior acoustic panels on the back wall
    addBox(g, 4.55, .92, .06, M.circuitDark, CX - .10, FLOOR + .82, Z0 + .315, false);
    for (var i = 0; i < 9; i++) {
      var batten = AM.box(.035, .88, .025, M.woodDark, false);
      batten.position.set(CX - 2.2 + i * .55, FLOOR + .82, Z0 + .35); g.add(batten);
    }
    var rail = AM.box(4.65, .07, .10, M.brass, false);
    rail.position.set(CX - .10, FLOOR + 1.33, Z0 + .33); g.add(rail);

    // exterior service conduit on the back-left
    var conduit = AM.cyl(.035, .035, 2.9, 6, M.pipeRust, false);
    conduit.position.set(X0 + .02, FLOOR + 1.45, Z0 + .75); g.add(conduit);
    // a little rain stain / crack decal on the low front wall
    var stain = AM.decal(.8, .35, TEX.rust, { opacity: .45, fog: false });
    stain.position.set(-.7, FLOOR + .25, Z1 + .075); g.add(stain);

    AM.shell = g;
  }

  /* -----------------------------------------------------------------------
     facade, glazing and door
     ----------------------------------------------------------------------- */
  function addGlassPanel(parent, w, h, x, y, z, ry, opacity) {
    var geo = new T.BoxGeometry(w, h, .028);
    var mat = AM.glass(0x9bb6a6, opacity === undefined ? .095 : opacity);
    var m = new T.Mesh(geo, mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = false; m.renderOrder = 4;
    m.userData.noOutline = true;
    parent.add(m);
    return m;
  }
  function addGlassFrame(parent, w, h, d, mat, x, y, z, ry) {
    var m = AM.box(w, h, d, mat, true, .0016);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function boltRow(parent, count, x0, x1, y, z, axis) {
    for (var i = 0; i < count; i++) {
      var b = AM.cyl(.020, .020, .035, 6, M.brass, false);
      if (axis === 'x') { b.position.set(x0 + (x1 - x0) * i / Math.max(1, count - 1), y, z); b.rotation.x = Math.PI * .5; }
      else { b.position.set(x0, y, z + (x1 - z) * i / Math.max(1, count - 1)); b.rotation.z = Math.PI * .5; }
      parent.add(b);
    }
  }

  function buildFacade() {
    var g = new T.Group(); root.add(g);
    var glassBottom = FLOOR + .48, glassTop = TOP - .20, mid = 2.42;
    var glassMid = (glassBottom + glassTop) * .5;
    var glassHeight = glassTop - glassBottom - .04;
    var frontZ = Z1 - .06, sideX = X1 - .06;
    var frameMat = M.steelDark, hiMat = M.steelPale;

    // front glazing bays to the right of the door
    var mullions = [-1.25, -.10, 1.02, X1 - .16];
    for (var i = 0; i < mullions.length; i++) {
      var mx = mullions[i];
      var post = AM.box(.085, glassTop - glassBottom + .12, .14, frameMat, true, .0015);
      post.position.set(mx, (glassTop + glassBottom) * .5, frontZ + .01);
      post.castShadow = true; g.add(post);
      var face = AM.box(.045, glassTop - glassBottom - .05, .02, hiMat, false);
      face.position.set(mx - .03, (glassTop + glassBottom) * .5, frontZ + .09); g.add(face);
      // bolts at intervals
      for (var b = 0; b < 3; b++) {
        var bolt = AM.cyl(.018, .018, .03, 6, M.brass, false);
        bolt.rotation.x = Math.PI * .5; bolt.position.set(mx, glassBottom + .22 + b * 1.0, frontZ + .095); g.add(bolt);
      }
    }
    // left small bay post at door / left corner
    var leftPost = AM.box(.085, glassTop - glassBottom + .12, .14, frameMat, true, .0015);
    leftPost.position.set(-2.45, (glassTop + glassBottom) * .5, frontZ + .01); g.add(leftPost);
    var extremeLeft = AM.box(.085, glassTop - glassBottom + .12, .14, frameMat, true, .0015);
    extremeLeft.position.set(X0 + .18, (glassTop + glassBottom) * .5, frontZ + .01); g.add(extremeLeft);
    // horizontal transom on the front
    var transom = AM.box(W - .52, .065, .16, frameMat, true, .0015);
    transom.position.set(CX, mid, frontZ + .005); g.add(transom);
    var transomHi = AM.box(W - .58, .022, .035, hiMat, false);
    transomHi.position.set(CX, mid + .04, frontZ + .09); g.add(transomHi);
    // top & bottom rails
    var head = AM.box(W + .04, .24, .30, frameMat, true, .0017);
    head.position.set(CX, glassTop + .12, frontZ + .02); head.castShadow = true; g.add(head);
    var headHi = AM.box(W - .1, .045, .035, hiMat, false);
    headHi.position.set(CX, glassTop + .20, frontZ + .17); g.add(headHi);
    var railBottom = AM.box(W - .52, .07, .18, frameMat, true, .0013);
    railBottom.position.set(CX, glassBottom - .01, frontZ + .01); g.add(railBottom);
    // big brassy bolts along head
    boltRow(g, 9, X0 + .55, X1 - .55, glassTop + .15, frontZ + .18, 'x');

    // front panes (right of door + small left bay)
    var spans = [[-1.25, -.10], [-.10, 1.02], [1.02, X1 - .16]];
    spans.forEach(function (sp) {
      var w = sp[1] - sp[0];
      addGlassPanel(g, w - .04, glassHeight, (sp[0] + sp[1]) * .5, glassMid, frontZ + .055, 0, .085);
    });
    addGlassPanel(g, .56, glassHeight, (X0 + .18 - 2.45) * .5, glassMid, frontZ + .055, 0, .10);

    // right glazing, rotated
    var zPosts = [Z0 + .18, -1.38, .12, Z1 - .16];
    zPosts.forEach(function (pz, idx) {
      var post = AM.box(.14, glassTop - glassBottom + .12, .085, frameMat, true, .0015);
      post.position.set(sideX + .01, (glassTop + glassBottom) * .5, pz);
      post.castShadow = true; g.add(post);
      var face = AM.box(.02, glassTop - glassBottom - .05, .045, hiMat, false);
      face.position.set(sideX + .09, (glassTop + glassBottom) * .5, pz + .03); g.add(face);
    });
    var transomR = AM.box(.16, .065, D - .52, frameMat, true, .0015);
    transomR.position.set(sideX + .005, mid, CZ); g.add(transomR);
    var headR = AM.box(.30, .24, D + .04, frameMat, true, .0017);
    headR.position.set(sideX + .02, glassTop + .12, CZ); headR.castShadow = true; g.add(headR);
    var topHiR = AM.box(.035, .045, D - .1, hiMat, false);
    topHiR.position.set(sideX + .17, glassTop + .20, CZ); g.add(topHiR);
    var railBottomR = AM.box(.18, .07, D - .52, frameMat, true, .0013);
    railBottomR.position.set(sideX + .01, glassBottom - .01, CZ); g.add(railBottomR);
    // right panes
    var zSpans = [[Z0 + .18, -1.38], [-1.38, .12], [.12, Z1 - .16]];
    zSpans.forEach(function (sp) {
      var d = sp[1] - sp[0];
      addGlassPanel(g, d - .04, glassHeight, sideX + .055, glassMid, (sp[0] + sp[1]) * .5, Math.PI * .5, .085);
    });

    // corner glint strips / blast-glass edge shine
    var glintFront = new T.Mesh(new T.PlaneGeometry(3.5, 2.35), new T.MeshBasicMaterial({ map: TEX.glassGlint, transparent: true, opacity: .28, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    glintFront.position.set(.55, 2.28, frontZ + .085); glintFront.renderOrder = 5; g.add(glintFront);
    var glintSide = new T.Mesh(new T.PlaneGeometry(4.0, 2.35), new T.MeshBasicMaterial({ map: TEX.glassGlint, transparent: true, opacity: .20, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    glintSide.rotation.y = Math.PI * .5; glintSide.position.set(sideX + .085, 2.22, -.5); glintSide.renderOrder = 5; g.add(glintSide);
    var crack = new T.Mesh(new T.PlaneGeometry(.65, .65), M.decalCrack);
    crack.position.set(1.63, 3.2, frontZ + .10); g.add(crack);
    // etched corner mark
    var etch = AM.decal(.26, .26, TEX.stencil07, { opacity: .18, fog: false });
    etch.position.set(1.95, 1.44, frontZ + .102); g.add(etch);

    // front entrance portal
    var doorX = -1.85, doorW = 1.20;
    var jambL = AM.box(.12, glassTop - FLOOR + .06, .28, M.concreteDark, true, .0018);
    jambL.position.set(-2.45, (glassTop + FLOOR) * .5, frontZ + .05); jambL.castShadow = true; g.add(jambL);
    var jambR = jambL.clone(); jambR.position.x = -1.25; g.add(jambR);
    var doorHeader = AM.box(1.42, .14, .32, M.steelDark, true, .0017);
    doorHeader.position.set(doorX, FLOOR + 2.47, frontZ + .08); g.add(doorHeader);
    var doorSign = AM.decal(.82, .17, TEX.signControl, { opacity: .9, fog: false });
    doorSign.position.set(doorX, FLOOR + 2.58, frontZ + .12); g.add(doorSign);
    // transom glass above door
    addGlassPanel(g, 1.08, .52, doorX, FLOOR + 2.80, frontZ + .055, 0, .075);
    // warm interior spill through the open door
    var spill = new T.Mesh(new T.PlaneGeometry(1.5, 2.35), new T.MeshBasicMaterial({ map: TEX.glowWarm, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
    spill.position.set(doorX, FLOOR + 1.45, frontZ + .04); g.add(spill);

    // glazed door leaf, open outward toward the camera
    var hinge = new T.Group();
    hinge.position.set(-2.45, FLOOR + .05, frontZ + .12);
    hinge.rotation.y = -.48;
    g.add(hinge);
    var leaf = new T.Group();
    leaf.position.set(doorW * .5, 0, 0);
    hinge.add(leaf);
    var doorPlate = AM.box(doorW, 2.42, .085, M.steelDark, true, .0022);
    doorPlate.position.y = 1.21; leaf.add(doorPlate);
    var doorGlass = new T.Mesh(new T.BoxGeometry(doorW - .30, 1.12, .03), AM.glass(0x849f90, .22));
    doorGlass.position.set(0, 1.47, .056); doorGlass.renderOrder = 4; leaf.add(doorGlass);
    var doorGlassUpper = new T.Mesh(new T.BoxGeometry(doorW - .36, .56, .03), AM.glass(0x849f90, .19));
    doorGlassUpper.position.set(0, 2.44, .056); doorGlassUpper.renderOrder = 4; leaf.add(doorGlassUpper);
    var doorHoriz = AM.box(doorW - .18, .08, .11, M.steelPale, false);
    doorHoriz.position.set(0, 2.08, .06); leaf.add(doorHoriz);
    var hazardBand = AM.box(doorW - .12, .18, .02, M.hazardStripe, false);
    hazardBand.position.set(0, .31, .052); leaf.add(hazardBand);
    var pushBar = AM.cyl(.045, .045, .80, 8, M.brass, false);
    pushBar.rotation.z = Math.PI * .5; pushBar.position.set(-.2, 1.18, .15); leaf.add(pushBar);
    var doorLabel = AM.decal(.56, .28, TEX.signCaution, { opacity: .86, fog: false });
    doorLabel.position.set(0, .78, .061); leaf.add(doorLabel);
    var hingeA = AM.cyl(.07, .07, .25, 8, M.brass, false); hingeA.rotation.z = Math.PI * .5; hingeA.position.set(-.49, 1.7, 0); leaf.add(hingeA);
    var hingeB = hingeA.clone(); hingeB.position.y = .55; leaf.add(hingeB);
    var strut = AM.cyl(.03, .03, .75, 6, M.steelPale, false);
    strut.position.set(-.38, 2.2, .06); strut.rotation.z = .7; leaf.add(strut);
    // threshold strip
    var threshold = AM.box(1.3, .035, .22, M.brass, false);
    threshold.position.set(doorX, FLOOR + .025, frontZ + .1); g.add(threshold);
    var exitGlow = new T.Mesh(new T.PlaneGeometry(.8, .26), new T.MeshBasicMaterial({ map: ITEX.exit, transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
    exitGlow.position.set(doorX, FLOOR + 2.47, Z0 + .36); g.add(exitGlow);

    // heavy entrance bunker: two deep piers + a massive lintel/canopy.
    // This is the piece that makes the glass pavilion read as fortified FBC architecture.
    var portalZ = 1.95;
    var pierMat = M.concreteB;
    var portalG = new T.Group(); g.add(portalG);
    [-2.78, -.92].forEach(function (px, pi) {
      var pier = AM.box(.44, 3.08, .82, pierMat, true, .0024, { worldUV: true, uvScale: .45 });
      pier.position.set(px, FLOOR + 1.54, portalZ);
      pier.castShadow = true; pier.receiveShadow = true; portalG.add(pier);
      var cap = AM.box(.50, .10, .88, M.concrete, true, .0017);
      cap.position.set(px, FLOOR + 3.08, portalZ); portalG.add(cap);
      // dark base shoe + hazard band
      var shoe = AM.box(.48, .16, .86, M.steelDark, false);
      shoe.position.set(px, FLOOR + .08, portalZ); portalG.add(shoe);
      var hz = AM.box(.45, .18, .02, M.hazardStripe, false);
      hz.position.set(px, FLOOR + .25, portalZ + .43); portalG.add(hz);
      // tie holes / plate detail
      for (var b = 0; b < 3; b++) {
        var bolt = AM.cyl(.022, .022, .025, 6, M.brass, false);
        bolt.rotation.x = Math.PI * .5; bolt.position.set(px, FLOOR + 1.2 + b * .5, portalZ + .435); portalG.add(bolt);
      }
      // protruding steel clamp at the top
      var clamp = AM.box(.48, .06, .90, M.steelPale, false);
      clamp.position.set(px, FLOOR + 2.96, portalZ); portalG.add(clamp);
      // caged lamp on the front of each pier
      var lampG = new T.Group();
      var arm = AM.box(.26, .035, .035, M.steelDark, false); lampG.add(arm);
      var cage = AM.cyl(.10, .13, .15, 10, M.steelDark, true, .0012); cage.position.set(0, -.10, 0); lampG.add(cage);
      var bulb = AM.sphere(.07, 8, 6, AM.basic(0xffc17c, { toneMapped: false }), false); bulb.position.set(0, -.13, 0); lampG.add(bulb);
      var halo = AM.sprite(lampG, TEX.glowWarm, 0xffb975, .7, .23); halo.position.set(0, -.13, 0);
      lampG.position.set(px, FLOOR + 2.55, portalZ + .47);
      portalG.add(lampG);
    });
    var lintel = AM.box(2.34, .42, .92, pierMat, true, .0025, { worldUV: true, uvScale: .4 });
    lintel.position.set(-1.85, FLOOR + 2.86, portalZ);
    lintel.castShadow = true; lintel.receiveShadow = true; portalG.add(lintel);
    var lintelCap = AM.box(2.42, .09, 1.00, M.steelDark, true, .0017);
    lintelCap.position.set(-1.85, FLOOR + 3.11, portalZ); portalG.add(lintelCap);
    // deep cantilevered slab / canopy
    var canopy = AM.box(2.68, .18, 1.40, M.concrete, true, .0023, { worldUV: true, uvScale: .38 });
    canopy.position.set(-1.85, FLOOR + 3.22, portalZ + .20);
    canopy.castShadow = true; canopy.receiveShadow = true; portalG.add(canopy);
    var canopySoffit = AM.box(2.50, .035, 1.27, M.blackMetal, false);
    canopySoffit.position.set(-1.85, FLOOR + 3.12, portalZ + .20); portalG.add(canopySoffit);
    // exposed rebar at the cut edge of the canopy
    for (var pr = 0; pr < 5; pr++) {
      var bar = AM.cyl(.012, .012, .20, 5, M.rust, false);
      bar.rotation.x = Math.PI * .5;
      bar.position.set(-2.90 + pr * .52, FLOOR + 3.22, portalZ + .92); portalG.add(bar);
    }
    // new sign, smaller and tucked above the door so the observation glass stays clear
    var plate = AM.box(2.05, .52, .08, M.blackMetal, true, .0018);
    plate.position.set(-1.85, FLOOR + 3.30, portalZ + .94); portalG.add(plate);
    var sign = AM.decal(1.96, .44, TEX.signControl, { opacity: 1, fog: false });
    sign.position.set(-1.85, FLOOR + 3.30, portalZ + .985); portalG.add(sign);
    var signHalo = AM.sprite(portalG, TEX.glowGreen, 0xdcf6ad, 2.1, .15);
    signHalo.position.set(-1.85, FLOOR + 3.30, portalZ + .96);
    // under-canopy warm downlights
    [-2.6, -1.1].forEach(function (lx) {
      var down = AM.cyl(.07, .08, .025, 10, AM.basic(0xffc88a, { toneMapped: false }), false);
      down.rotation.x = Math.PI * .5; down.position.set(lx, FLOOR + 3.10, portalZ + .36); portalG.add(down);
      var dg = AM.sprite(portalG, TEX.glowWarm, 0xffb874, .55, .18); dg.position.set(lx, FLOOR + 3.05, portalZ + .36);
    });
    // door-side warning / ID plaques on lintel
    var idPlaque = AM.decal(.96, .24, TEX.signAuth, { opacity: .95, fog: false });
    idPlaque.position.set(-1.85, FLOOR + 2.58, portalZ + .47); portalG.add(idPlaque);

    // A rolling blast shutter drum above the observation glazing, stopped halfway.
    var drum = new T.Mesh(new T.CylinderGeometry(.14, .14, 2.5, 14), M.steelDark);
    drum.rotation.z = Math.PI * .5; drum.position.set(.62, 3.44, frontZ + .13); drum.castShadow = true; g.add(drum);
    [-1, 1].forEach(function (s) {
      var cap = AM.cyl(.16, .16, .06, 12, M.steelPale, false);
      cap.rotation.z = Math.PI * .5; cap.position.set(.62 + s * 1.28, 3.44, frontZ + .13); g.add(cap);
      var motor = AM.box(.18, .22, .20, M.steelDark, false);
      motor.position.set(.62 + s * 1.38, 3.35, frontZ + .13); g.add(motor);
    });
    var shutterPanel = AM.box(2.34, .30, .035, M.steelDark, false);
    shutterPanel.position.set(.62, 3.25, frontZ + .15); g.add(shutterPanel);
    for (var sr = 0; sr < 5; sr++) {
      var rib = AM.box(2.30, .012, .04, M.steelPale, false);
      rib.position.set(.62, 3.13 + sr * .055, frontZ + .17); g.add(rib);
    }
    var strip = AM.box(2.34, .045, .04, M.hazardStripe, false);
    strip.position.set(.62, 3.095, frontZ + .17); g.add(strip);
    // a sickly green exterior tube under the shutter, to keep the glass alive at night
    var facadeTubeMat = new T.MeshBasicMaterial({ color: 0xd9eea1, toneMapped: false });
    var ftube = new T.Mesh(new T.CylinderGeometry(.021, .021, 2.15, 8), facadeTubeMat);
    ftube.rotation.z = Math.PI * .5; ftube.position.set(.62, 3.04, frontZ + .18); g.add(ftube);
    var ftubeHood = AM.box(2.28, .035, .10, M.steelDark, false);
    ftubeHood.position.set(.62, 3.08, frontZ + .14); g.add(ftubeHood);
    var ftHalo = AM.sprite(g, TEX.glowGreen, 0xd4eca0, 2.6, .16);
    ftHalo.position.set(.62, 3.01, frontZ + .20);
    AM.facadeTube = facadeTubeMat;
    AM.facadeTubeHalo = ftHalo;
    var doorSpillLight = new T.PointLight(0xffb776, .45, 3.8, 2);
    doorSpillLight.position.set(-1.85, 2.55, 2.30); g.add(doorSpillLight);

    // FBC seal on the front parapet left of door
    var seal = AM.decal(.58, .58, TEX.sealPaint, { opacity: .55, fog: false });
    seal.position.set(-2.82, FLOOR + .26, frontZ + .085); g.add(seal);

    // exterior right-wall service box and camera
    var svc = AM.box(.34, .46, .14, M.steelPale, true, .0013);
    svc.position.set(sideX + .17, FLOOR + 1.3, -1.85); g.add(svc);
    var svcDecal = AM.decal(.24, .15, TEX.signCaution, { opacity: .8, fog: false });
    svcDecal.rotation.y = Math.PI * .5; svcDecal.position.set(sideX + .25, FLOOR + 1.32, -1.85); g.add(svcDecal);
    // small security camera above door
    var camM = new T.Group();
    var camArm = AM.box(.06, .06, .32, M.steelDark, false); camArm.position.set(0, 0, .15); camM.add(camArm);
    var camBody = AM.cyl(.10, .13, .28, 10, M.steelPale, true, .0012); camBody.rotation.x = Math.PI * .5; camBody.position.set(0, -.03, .35); camM.add(camBody);
    var camLens = AM.sphere(.07, 10, 6, M.blackPlastic, false); camLens.position.set(0, -.03, .49); camM.add(camLens);
    var camLed = AM.sphere(.017, 6, 4, M.ledRed, false); camLed.position.set(0, .05, .40); camM.add(camLed);
    camM.position.set(-1.25, 3.25, frontZ + .18); g.add(camM);

    AM.facade = g;
  }

  function addsd(g, glassBottom, glassTop, frontZ) {
    // transom above the front glass door / central bays shares the steel header
  }



  /* -----------------------------------------------------------------------
     monitor bank / credenza
     ----------------------------------------------------------------------- */
  function makeMonitor(idx, opts) {
    opts = opts || {};
    var g = new T.Group();
    var w = opts.w || .64, h = opts.h || .50, d = opts.d || .34;
    var body = AM.box(w, h, d, opts.bodyMat || M.plasticGrey, true, .0015);
    g.add(body);
    var bezel = AM.box(w * .90, h * .84, .045, M.blackPlastic, false);
    bezel.position.z = d * .5 + .021; g.add(bezel);
    var mat = AM.crtMaterial(TEX.crt[idx % TEX.crt.length], {
      seed: (opts.seed || idx * 13 + 4),
      power: opts.power || 1.1,
      tint: opts.tint === undefined ? 0xffffff : opts.tint,
      scan: .18
    });
    var sw = w * .72, sh = h * .60;
    var screen = new T.Mesh(new T.PlaneGeometry(sw, sh), mat);
    screen.position.z = d * .5 + .047; g.add(screen);
    // glass reflection over CRT face
    var glass = new T.Mesh(new T.PlaneGeometry(sw + .03, sh + .03), new T.MeshPhysicalMaterial({
      color: 0x7d8f7e, transparent: true, opacity: .08, roughness: .08, clearcoat: 1,
      depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.2
    }));
    glass.position.z = d * .5 + .055; glass.renderOrder = 5; g.add(glass);
    // dark inset line around screen
    var topBezel = AM.box(w * .96, .045, .035, M.blackPlastic, false);
    topBezel.position.set(0, h * .44, d * .5 + .045); g.add(topBezel);
    var botBezel = topBezel.clone(); botBezel.position.y = -h * .44; g.add(botBezel);
    // knobs and LEDs
    for (var k = 0; k < 2; k++) {
      var knob = AM.cyl(.022, .025, .035, 8, k ? M.brass : M.steelPale, false);
      knob.rotation.x = Math.PI * .5;
      knob.position.set(-w * .28 + k * .10, -h * .35, d * .5 + .06);
      g.add(knob);
    }
    var led = AM.sphere(.013, 6, 4, idx % 3 === 0 ? M.ledAmber : M.ledGreen, false);
    led.position.set(w * .30, -h * .36, d * .5 + .059); g.add(led);
    // label plate
    var label = AM.box(w * .48, .035, .012, idx % 2 ? M.steelPale : M.cream, false);
    label.position.set(0, h * .28, d * .5 + .052); g.add(label);
    var labelStripe = AM.box(w * .22, .012, .013, M.redDark, false);
    labelStripe.position.set(w * .20, h * .28, d * .5 + .06); g.add(labelStripe);
    // soft screen bloom halo
    var tint = new T.Color(opts.halo === undefined ? 0xaee58b : opts.halo);
    var halo = AM.sprite(g, TEX.glowGreen, tint, Math.max(w, h) * 1.55, .14);
    halo.position.z = d * .5 + .08;
    // feet
    if (opts.feet !== false) {
      [-1, 1].forEach(function (s) {
        var foot = AM.box(.07, .025, .16, M.steelDark, false);
        foot.position.set(s * w * .30, -h * .5 - .012, .02); g.add(foot);
      });
    }
    g.userData.screenMaterial = mat;
    g.userData.screenMesh = screen;
    g.userData.screenGlow = halo;
    AM.screenMeshes.push(g);
    return g;
  }

  function buildMonitorBank() {
    var g = new T.Group(); root.add(g);
    var bx = -1.04, zBack = Z0 + .34, zMon = zBack + .17;
    // rack backboard & frame
    var backboard = AM.box(2.98, 1.58, .075, M.blackMetal, true, .0016);
    backboard.position.set(bx, FLOOR + 1.78, zBack); backboard.castShadow = true; g.add(backboard);
    var topRail = AM.box(3.05, .08, .13, M.steelDark, true, .0012);
    topRail.position.set(bx, FLOOR + 2.58, zBack + .07); g.add(topRail);
    var botRail = topRail.clone(); botRail.position.y = FLOOR + .98; g.add(botRail);
    [-1.48, -.72, .04, .80, 1.50].forEach(function (x) {
      var v = AM.box(.045, 1.62, .10, M.steelDark, false);
      v.position.set(bx + x, FLOOR + 1.78, zBack + .07); g.add(v);
    });
    // six CRT monitors
    var cols = [-.95, 0, .95], rows = [1.40, 2.12];
    var idx = 0;
    var tints = [0xffffff, 0xf8d99d, 0xdff6b1, 0xd8f4b0, 0xffd2a0, 0xe4f5d0];
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < cols.length; c++) {
        var mon = makeMonitor(idx, { w: .79, h: .60, d: .35, seed: idx * 17 + 5, tint: tints[idx], power: 1.28 + (idx % 3) * .08 });
        mon.position.set(bx + cols[c], FLOOR + rows[r], zMon);
        g.add(mon);
        // little under-monitor label strip
        var strip = AM.box(.48, .026, .012, idx === 2 ? M.ledAmber : M.steelPale, false);
        strip.position.set(bx + cols[c], FLOOR + rows[r] - .35, zMon + .19); g.add(strip);
        idx++;
      }
    }
    // warm task light bar over the rack
    var bar = new T.Mesh(new T.CylinderGeometry(.022, .022, 2.7, 8), AM.basic(0xffd39a, { toneMapped: false }));
    bar.rotation.z = Math.PI * .5; bar.position.set(bx, FLOOR + 2.76, zBack + .23); g.add(bar);
    var barHood = AM.box(2.85, .045, .16, M.steelDark, false);
    barHood.position.set(bx, FLOOR + 2.83, zBack + .21); g.add(barHood);
    var barHalo = AM.sprite(g, TEX.glowWarm, 0xffc687, 2.8, .14);
    barHalo.position.set(bx, FLOOR + 2.74, zBack + .25);
    // cables dropping from monitors
    for (var cc = 0; cc < 3; cc++) {
      var cx = bx + [-.95, 0, .95][cc];
      g.add(AM.tube([new T.Vector3(cx, FLOOR + 1.1, zMon + .15), new T.Vector3(cx + .15, FLOOR + .85, zMon + .25), new T.Vector3(cx + .05, FLOOR + .62, zMon + .26)], .010, M.cable, 12, 5));
    }
    // period-correct credenza underneath
    var cred = AM.box(2.98, .86, .56, M.wood, true, .0020);
    cred.position.set(bx, FLOOR + .43, zBack + .27); cred.castShadow = true; cred.receiveShadow = true; g.add(cred);
    var credTop = AM.box(3.04, .05, .62, M.woodDark, false);
    credTop.position.set(bx, FLOOR + .88, zBack + .28); g.add(credTop);
    // cabinet doors with handles
    for (var cd = 0; cd < 3; cd++) {
      var door = AM.box(.88, .66, .035, M.woodDark, false);
      door.position.set(bx - .96 + cd * .96, FLOOR + .44, zBack + .56); g.add(door);
      var handle = AM.box(.22, .025, .035, M.brass, false);
      handle.position.set(bx - .96 + cd * .96, FLOOR + .62, zBack + .59); g.add(handle);
      var plate = AM.decal(.24, .10, TEX.tapeLabels[cd], { opacity: .9, fog: false });
      plate.position.set(bx - .96 + cd * .96, FLOOR + .30, zBack + .581); g.add(plate);
    }
    // items on the credenza
    var deskTerm = makeMonitor(3, { w: .45, h: .36, d: .30, bodyMat: M.cream, seed: 85, tint: 0xe6f7c4, halo: 0xd7f3a4 });
    deskTerm.position.set(bx - .88, FLOOR + 1.09, zBack + .28);
    deskTerm.rotation.y = .18; g.add(deskTerm);
    var deck = makeTapeDeck(11, { scale: .95 });
    deck.position.set(bx + .25, FLOOR + .93, zBack + .29);
    g.add(deck);
    // paper & folder
    for (var pp = 0; pp < 3; pp++) {
      var p = AM.decal(.28, .38, TEX.papers[pp % 3], { opacity: .96, fog: false });
      p.rotation.x = -Math.PI * .5; p.rotation.z = (pp - 1) * .09;
      p.position.set(bx + 1.0, FLOOR + .91 + pp * .004, zBack + .25 + pp * .05);
      g.add(p);
    }
    // old telephone
    var phone = new T.Group();
    var phBody = AM.box(.18, .08, .15, M.blackPlastic, true, .0009); phone.add(phBody);
    var handset = AM.box(.22, .055, .06, M.blackPlastic, false);
    handset.position.y = .09; handset.rotation.z = .08; phone.add(handset);
    var dial = AM.cyl(.05, .05, .02, 12, M.cream, false); dial.rotation.x = Math.PI * .5; dial.position.set(0, .0, .08); phone.add(dial);
    phone.position.set(bx + 1.25, FLOOR + .94, zBack + .31); phone.rotation.y = -.25; g.add(phone);
    // a small banker's lamp
    var lamp = new T.Group();
    var stem = AM.cyl(.014, .018, .28, 6, M.brass, false); stem.position.y = .14; lamp.add(stem);
    var shade = new T.Mesh(new T.CylinderGeometry(.12, .16, .11, 12, 1, true), M.brass);
    shade.position.y = .31; shade.rotation.z = .05; lamp.add(shade);
    var bulb = AM.sphere(.035, 8, 6, AM.basic(0xffd397, { toneMapped: false }), false);
    bulb.position.y = .28; lamp.add(bulb);
    var lglow = AM.sprite(lamp, TEX.glowWarm, 0xffbc73, .55, .25); lglow.position.y = .32;
    lamp.position.set(bx - 1.45, FLOOR + .92, zBack + .34); g.add(lamp);
    // wall clock above bank
    var clockBody = AM.cyl(.24, .24, .035, 24, M.steelDark, false);
    clockBody.rotation.x = Math.PI * .5; clockBody.position.set(bx, FLOOR + 2.86, zBack + .06); g.add(clockBody);
    var clockFace = new T.Mesh(new T.CircleGeometry(.205, 32), new T.MeshBasicMaterial({ map: ITEX.clock, toneMapped: false }));
    clockFace.position.set(bx, FLOOR + 2.86, zBack + .083); g.add(clockFace);
    var clockRim = new T.Mesh(new T.TorusGeometry(.218, .014, 5, 32), M.brass);
    clockRim.position.set(bx, FLOOR + 2.86, zBack + .083); g.add(clockRim);

    // blueprint poster to the right of the bank
    var bpFrame = AM.box(.92, 1.28, .055, M.steelDark, true, .0017);
    bpFrame.position.set(1.16, FLOOR + 2.00, Z0 + .315); bpFrame.castShadow = true; g.add(bpFrame);
    var bp = new T.Mesh(new T.PlaneGeometry(.84, 1.18), new T.MeshBasicMaterial({ map: ITEX.blueprint, toneMapped: false }));
    bp.position.set(1.16, FLOOR + 2.00, Z0 + .345); g.add(bp);
    var bpGlint = new T.Mesh(new T.PlaneGeometry(.84, 1.18), new T.MeshBasicMaterial({ map: TEX.glassGlint, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    bpGlint.position.set(1.16, FLOOR + 2.00, Z0 + .349); g.add(bpGlint);
    // pinboard on the remaining right wall
    var pinboard = AM.box(.72, .62, .045, M.woodDark, true, .0014);
    pinboard.position.set(1.16, FLOOR + .95, Z0 + .31); g.add(pinboard);
    var pin = new T.Mesh(new T.PlaneGeometry(.64, .54), new T.MeshBasicMaterial({ map: ITEX.pinboard, toneMapped: false }));
    pin.position.set(1.16, FLOOR + .95, Z0 + .336); g.add(pin);
    AM.monitorBank = g;
  }

  /* -----------------------------------------------------------------------
     reel-to-reel decks, walkmans & the tape wall
     ----------------------------------------------------------------------- */
  function makeReel(parent, x, y, z, scale, spin, speed) {
    var reel = new T.Group();
    var r = .075 * (scale || 1);
    var pack = new T.Mesh(new T.CylinderGeometry(r, r, .018, 18), M.tapeBrown2);
    pack.rotation.x = Math.PI * .5; reel.add(pack);
    var rim = new T.Mesh(new T.TorusGeometry(r, .009, 5, 20), M.cream);
    rim.position.z = .008; reel.add(rim);
    var hub = AM.cyl(r * .22, r * .22, .028, 8, M.brass, false);
    hub.rotation.x = Math.PI * .5; hub.position.z = .015; reel.add(hub);
    for (var s = 0; s < 3; s++) {
      var spoke = AM.box(r * .15, r * 1.1, .01, M.cream, false);
      spoke.position.z = .014; spoke.rotation.z = s * Math.PI / 3; reel.add(spoke);
    }
    reel.position.set(x, y, z);
    parent.add(reel);
    if (spin) AM.reels.push({ object: reel, speed: speed || .5, axis: 'z' });
    return reel;
  }

  function makeTapeDeck(seed, opts) {
    opts = opts || {};
    var g = new T.Group();
    var w = .40 * (opts.scale || 1), h = .25 * (opts.scale || 1), d = .22 * (opts.scale || 1);
    var body = AM.box(w, h, d, opts.bodyMat || M.plasticGrey, true, .0014);
    body.castShadow = true; g.add(body);
    var face = AM.box(w * .94, h * .88, .018, M.blackPlastic, false);
    face.position.z = d * .5 + .007; g.add(face);
    var topPlate = AM.box(w * .92, .018, d * .57, M.steelPale, false);
    topPlate.position.set(0, h * .5 + .005, -.01); topPlate.rotation.x = -.09; g.add(topPlate);
    // reel seat / window
    var window = AM.box(w * .72, h * .48, .012, M.circuitDark, false);
    window.position.set(0, h * .10, d * .5 + .017); g.add(window);
    var r1 = makeReel(g, -w * .18, h * .10, d * .5 + .03, w * 1.7, true, .45 + (seed % 4) * .07);
    var r2 = makeReel(g, w * .18, h * .10, d * .5 + .03, w * 1.7, true, .37 + (seed % 3) * .06);
    // head cover + tape path
    var head = AM.box(w * .20, h * .16, .018, M.steelDark, false);
    head.position.set(0, -.02, d * .5 + .027); g.add(head);
    var guard = AM.box(.018, .012, .05, M.cream, false);
    guard.position.set(-w * .05, .0, d * .5 + .045); g.add(guard);
    // button bank
    for (var b = 0; b < 6; b++) {
      var btn = AM.box(.028, .022, .014, b === 3 ? M.redPaint : M.steelPale, false);
      btn.position.set(-w * .30 + b * .052, -h * .35, d * .5 + .016); g.add(btn);
    }
    // vu meters
    var vuFrame = AM.box(.10, .055, .012, M.steelDark, false);
    vuFrame.position.set(w * .30, -h * .19, d * .5 + .017); g.add(vuFrame);
    var vu = new T.Mesh(new T.PlaneGeometry(.078, .036), AM.basic(0x8ebf78, { transparent: true, opacity: .9 }));
    vu.position.set(w * .30, -h * .19, d * .5 + .026); g.add(vu);
    var vuNeedle = AM.box(.003, .025, .005, M.redDark, false);
    vuNeedle.position.set(w * .30 + .010, -h * .18, d * .5 + .032); vuNeedle.rotation.z = -.5; g.add(vuNeedle);
    // label
    var label = AM.decal(w * .52, h * .17, TEX.tapeLabels[seed % TEX.tapeLabels.length], { opacity: .92, fog: false });
    label.position.set(0, h * .43, d * .5 + .018); g.add(label);
    // feet
    [-1, 1].forEach(function (s) {
      var foot = AM.box(.06, .028, .06, M.steelDark, false);
      foot.position.set(s * w * .35, -h * .5 - .012, .02); g.add(foot);
    });
    g.userData.seed = seed;
    return g;
  }

  function makeWalkman(seed) {
    var g = new T.Group();
    var bodyMat = [M.blackPlastic, M.redPaint, M.steelPale, M.plasticGrey][seed % 4];
    var body = AM.box(.105, .17, .042, bodyMat, true, .0010);
    body.castShadow = true; g.add(body);
    var win = AM.box(.068, .060, .008, M.circuitDark, false);
    win.position.set(0, .030, .024); g.add(win);
    // tiny cassette reels
    var rr = .017;
    for (var i = 0; i < 2; i++) {
      var reel = AM.cyl(rr, rr, .006, 10, M.tapeBrown, false);
      reel.rotation.x = Math.PI * .5; reel.position.set(-.018 + i * .036, .03, .033); g.add(reel);
    }
    for (var b = 0; b < 4; b++) {
      var btn = AM.box(.018, .010, .010, M.steelPale, false);
      btn.position.set(-.034 + b * .023, -.055, .025); g.add(btn);
    }
    var jack = AM.cyl(.006, .006, .02, 6, M.brass, false);
    jack.rotation.z = Math.PI * .5; jack.position.set(-.058, -.065, 0); g.add(jack);
    var label = AM.box(.075, .018, .008, M.cream, false);
    label.position.set(0, -.085, .024); g.add(label);
    g.userData.seed = seed;
    return g;
  }


  function makePunchCardMachine() {
    var g = new T.Group();
    var bodyMat = M.cream;
    var body = AM.box(.38, .27, .32, bodyMat, true, .0012);
    body.position.y = .135; body.castShadow = true; g.add(body);
    var top = AM.box(.40, .035, .34, M.plasticGrey, false);
    top.position.y = .285; g.add(top);
    var front = AM.box(.34, .20, .02, M.steelPale, false);
    front.position.set(0, .14, .17); g.add(front);
    // card slot and an inserted punch card
    var slot = AM.box(.26, .025, .025, M.blackPlastic, false);
    slot.position.set(0, .21, .184); g.add(slot);
    var card = AM.decal(.18, .11, TEX.punchCard, { opacity: .95, fog: false });
    card.position.set(0, .22, .191); g.add(card);
    // little mechanical keyboard
    var kb = new T.Mesh(new T.PlaneGeometry(.24, .10), new T.MeshBasicMaterial({ map: ITEX.keyboardB, toneMapped: false }));
    kb.position.set(0, .155, .184); g.add(kb);
    // crank and toggle
    var crank = AM.cyl(.035, .035, .02, 8, M.brass, false);
    crank.rotation.x = Math.PI * .5; crank.position.set(.20, .14, .12); g.add(crank);
    var lever = AM.box(.04, .12, .025, M.steelDark, false);
    lever.position.set(-.13, .27, .02); lever.rotation.z = -.20; g.add(lever);
    var indicator = AM.sphere(.012, 6, 4, M.ledAmber, false);
    indicator.position.set(.10, .27, .18); g.add(indicator);
    // small tray of punched cards at the side
    var tray = AM.box(.16, .05, .22, M.steelDark, false);
    tray.position.set(.28, .07, .02); g.add(tray);
    for (var c = 0; c < 4; c++) {
      var cd = AM.decal(.13, .08, TEX.punchCard, { opacity: .9, fog: false });
      cd.rotation.x = -Math.PI * .5; cd.rotation.z = (c - 1.5) * .05;
      cd.position.set(.28, .10 + c * .004, .02); g.add(cd);
    }
    return g;
  }

  function makeHeadphones() {
    var g = new T.Group();
    var bandMat = M.blackPlastic;
    var band = new T.Mesh(new T.TorusGeometry(.16, .018, 6, 20, Math.PI), bandMat);
    band.position.y = .12; g.add(band);
    [-1, 1].forEach(function (s) {
      var cup = AM.cyl(.055, .06, .035, 12, M.leather, false);
      cup.rotation.z = Math.PI * .5; cup.position.set(s * .16, .02, 0); g.add(cup);
      var pad = AM.cyl(.045, .045, .012, 12, M.rubber, false);
      pad.rotation.z = Math.PI * .5; pad.position.set(s * .185, .02, 0); g.add(pad);
    });
    var wire = cable([new T.Vector3(0, .18, 0), new T.Vector3(0, .30, .05), new T.Vector3(.05, .42, .02), new T.Vector3(.1, .48, -.02)], .006, M.cable, 16);
    noShadow(wire); g.add(wire);
    return g;
  }

  function buildTapeWall() {
    var g = new T.Group(); root.add(g);
    var xWall = X0 + .32, xFront = xWall + .36;
    var zMid = -.70, len = 2.30;
    var zA = zMid - len * .5, zB = zMid + len * .5;
    // pegboard backing
    var peg = new T.Mesh(new T.PlaneGeometry(len, 2.5), new T.MeshBasicMaterial({ map: ITEX.pegboard, toneMapped: false }));
    peg.rotation.y = Math.PI * .5; peg.position.set(xWall + .02, FLOOR + 1.82, zMid); g.add(peg);
    // uprights
    [zA, zB].forEach(function (z) {
      var up = AM.box(.06, 2.6, .06, M.steelDark, true, .0012);
      up.position.set(xFront - .02, FLOOR + 1.78, z); g.add(up);
    });
    var topBar = AM.box(.42, .055, .055, M.steelDark, false);
    topBar.position.set(xFront - .10, FLOOR + 3.10, zMid); g.add(topBar);
    // shelves & contents
    var shelfYs = [1.02, 1.67, 2.32, 2.97];
    shelfYs.forEach(function (sy, idx) {
      var shelf = AM.box(.52, .055, len + .10, M.wood, true, .0016);
      shelf.position.set(xFront - .14, FLOOR + sy, zMid);
      shelf.castShadow = true; shelf.receiveShadow = true; g.add(shelf);
      var lip = AM.box(.035, .025, len + .13, M.brass, false);
      lip.position.set(xFront + .055, FLOOR + sy + .025, zMid); g.add(lip);
      var under = new T.Mesh(new T.CylinderGeometry(.012, .012, len * .86, 6), AM.basic(0xffc783, { toneMapped: false }));
      under.rotation.x = Math.PI * .5; under.position.set(xFront + .02, FLOOR + sy - .035, zMid); g.add(under);
      var underHalo = AM.sprite(g, TEX.glowWarm, 0xffb96e, 1.9, .055);
      underHalo.position.set(xFront + .06, FLOOR + sy - .06, zMid);
    });
    // objects per shelf
    var deckPos = [
      { y: 2.97, z: -1.48, s: 1.0, seed: 3, rot: .03 },
      { y: 2.97, z: -.91, s: .92, seed: 8, rot: -.02 },
      { y: 2.97, z: -.38, s: 1.03, seed: 5, rot: .0 },
      { y: 2.32, z: -1.30, s: .95, seed: 12, rot: .04 },
      { y: 2.32, z: -.55, s: 1.08, seed: 1, rot: -.03 },
      { y: 1.67, z: -.95, s: .88, seed: 15, rot: .02 }
    ];
    deckPos.forEach(function (p, idx) {
      var deck = makeTapeDeck(p.seed + idx, { scale: p.s });
      deck.rotation.y = Math.PI * .5;
      deck.position.set(xFront - .18, FLOOR + p.y + .035 + .15 * p.s, p.z);
      g.add(deck);
    });
    // walkmans on lower shelves
    for (var wwk = 0; wwk < 4; wwk++) {
      var walk = makeWalkman(wwk + 2);
      walk.rotation.y = Math.PI * .5;
      walk.rotation.x = -.10;
      walk.position.set(xFront - .10 + (wwk % 2) * .13, FLOOR + 1.67 + .035 + .11, -.95 + Math.floor(wwk / 2) * .50 - .16 + .27);
      g.add(walk);
    }
    // cassettes / cases around the pegboard
    var caseMats = [M.cream, M.redPaint, M.steelPale, M.plasticGrey, M.woodDark];
    var rnd = AM.rng(74);
    for (var cy = 0; cy < 5; cy++) {
      for (var cz = 0; cz < 7; cz++) {
        if ((cy + cz) % 3 === 0) continue;
        var cassette = AM.box(.048, .105, .16, caseMats[(cy * 3 + cz) % caseMats.length], false);
        cassette.position.set(xWall + .06, FLOOR + 2.52 + cy * .105, zB - .22 - cz * .26);
        cassette.rotation.z = (rnd() - .5) * .08;
        g.add(cassette);
        var label = AM.box(.011, .048, .11, (cy + cz) % 2 ? M.cream : M.tapeBrown, false);
        label.position.set(xWall + .088, FLOOR + 2.54 + cy * .105, zB - .22 - cz * .26); g.add(label);
      }
    }
    // bottom shelf: reels, boxes, punch-card stack
    var reelStack = new T.Group();
    for (var rs = 0; rs < 4; rs++) {
      var rr = new T.Mesh(new T.CylinderGeometry(.22 - rs * .004, .22 - rs * .004, .045, 24), M.tapeBrown);
      rr.rotation.x = Math.PI * .5; rr.position.set(xFront - .10, FLOOR + 1.06 + rs * .042, zB - .52); reelStack.add(rr);
    }
    g.add(reelStack);
    var punchMachine = makePunchCardMachine();
    punchMachine.rotation.y = Math.PI * .5;
    punchMachine.position.set(xFront - .10, FLOOR + 1.05, zA + .48);
    g.add(punchMachine);
    // headphones hanging from the side upright
    var hp = makeHeadphones();
    hp.rotation.y = Math.PI * .5;
    hp.position.set(xFront - .28, FLOOR + 2.05, zB + .10);
    g.add(hp);
    // a paper inventory list
    var list = AM.decal(.25, .34, TEX.papers[1], { opacity: .9, fog: false });
    list.rotation.y = Math.PI * .5; list.position.set(xFront + .07, FLOOR + 1.22, zA + .9); g.add(list);
    AM.tapeWall = g;
  }

  /* -----------------------------------------------------------------------
     the dynamic geometry sand table
     ----------------------------------------------------------------------- */
  var sandMat = null;
  function buildSandTable() {
    var g = new T.Group(); g.position.set(-.94, FLOOR, -.40); root.add(g);
    var baseMat = M.steelDark;
    var foot = AM.cyl(.43, .48, .09, 8, baseMat, true, .0018);
    foot.position.y = .045; foot.castShadow = true; g.add(foot);
    var column = AM.cyl(.20, .26, .54, 8, M.steelPale, true, .0017);
    column.position.y = .33; column.castShadow = true; g.add(column);
    var collar = AM.cyl(.34, .30, .16, 12, M.brass, true, .0015);
    collar.position.y = .67; g.add(collar);
    var drum = AM.cyl(.66, .58, .14, 24, M.steelDark, true, .0016);
    drum.position.y = .78; g.add(drum);
    var tableTop = AM.cyl(.75, .75, .075, 24, M.blackMetal, true, .0018);
    tableTop.position.y = .87; tableTop.castShadow = true; g.add(tableTop);
    var lip = new T.Mesh(new T.TorusGeometry(.735, .028, 6, 40), M.brass);
    lip.rotation.x = Math.PI * .5; lip.position.y = .915; g.add(lip);
    // little bolts around rim
    for (var b = 0; b < 8; b++) {
      var a = b / 8 * Math.PI * 2;
      var bolt = AM.cyl(.018, .018, .022, 6, M.steelPale, false);
      bolt.position.set(Math.cos(a) * .685, .93, Math.sin(a) * .685); g.add(bolt);
    }
    // animated sand / tactical surface
    sandMat = new T.ShaderMaterial({
      transparent: false, depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uA: { value: new T.Color(0x16211a) },
        uB: { value: new T.Color(0x8d9c68) },
        uC: { value: new T.Color(0xd6c37d) }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime; uniform vec3 uA,uB,uC;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'void main(){',
        '  vec2 p=(vUv-.5)*2.0;',
        '  float r=length(p);',
        '  float a=atan(p.y,p.x);',
        '  if(r>1.0) discard;',
        '  float grid = smoothstep(.92,1.0,abs(sin(a*12.0)))*.28 + smoothstep(.92,1.0,abs(sin(r*15.0 - .3)))*.22;',
        '  float contour = smoothstep(.86,.96,sin(r*38.0 - uTime*.9)*.5+.5) * (1.0-smoothstep(.75,1.0,r));',
        '  float sweep = exp(-pow((mod(a - uTime*.42, 6.28318)-3.14159)*1.8,2.0)) * smoothstep(0.,.9,r);',
        '  vec2 q = p*14.0; q += vec2(uTime*.04, -uTime*.02);',
        '  float noise = hash(floor(q))*.5 + hash(floor(q*2.0))*.25;',
        '  float grain = .90 + noise*.16;',
        '  vec3 col = mix(uA, uB, .20 + contour*.6 + grid*.22);',
        '  col += uC * (contour*.22 + sweep*.38);',
        '  float vign = smoothstep(1.0,.64,r);',
        '  col *= vign * grain;',
        '  gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n'),
      toneMapped: false
    });
    var surf = new T.Mesh(new T.CircleGeometry(.64, 48), sandMat);
    surf.rotation.x = -Math.PI * .5; surf.position.y = .916; g.add(surf);
    // tiny model of the maze on the sand table
    var miniBlocks = [
      [-.30, -.04, .26, .05, .17, .08], [-.10, -.23, .30, .04, .18, .11],
      [.18, -.20, .08, .05, .22, .08], [.28, .06, .18, .04, .16, .09],
      [.02, .19, .34, .035, .12, .07], [-.24, .22, .32, .045, .16, .06]
    ];
    miniBlocks.forEach(function (m, i) {
      var blk = AM.box(m[2], m[4], m[5], i % 2 ? M.concreteDark : M.steelPale, false);
      blk.position.set(m[0], .94 + m[4] * .5, m[1]); g.add(blk);
    });
    // little brass paths and ring
    var path = new T.Mesh(new T.RingGeometry(.25, .28, 32, 1, 0, Math.PI * 1.4), AM.glow(0xd7e5a1, .55));
    path.rotation.x = -Math.PI * .5; path.position.y = .952; path.rotation.z = .5; g.add(path);
    // floating inverted pyramid
    var pyramid = new T.Group();
    var coneGeo = new T.ConeGeometry(.285, .48, 4, 1, false);
    coneGeo.rotateX(Math.PI);
    var pyrMat = AM.toon(0x111713, { gradientMap: AM.gradHard, rim: .35, rimColor: 0xc6dfa2, rimPower: 2.4, flatShading: true });
    var cone = new T.Mesh(coneGeo, pyrMat);
    AM.outline(cone, .0022);
    pyramid.add(cone);
    // glowing edges
    var glowMat2 = AM.basic(0xd9efa8, { transparent: true, opacity: .95, toneMapped: false });
    var baseY = .24, apexY = -.24, rr = .285;
    var corners = [
      new T.Vector3(rr, baseY, 0), new T.Vector3(0, baseY, rr),
      new T.Vector3(-rr, baseY, 0), new T.Vector3(0, baseY, -rr)
    ];
    for (var e = 0; e < 4; e++) {
      var a = corners[e], b = corners[(e + 1) % 4];
      g.add(strutPyramid(pyramid, a, b, .007, glowMat2));
      g.add(strutPyramid(pyramid, a, new T.Vector3(0, apexY, 0), .007, glowMat2));
    }
    var orbitRings = [];
    [-.10, .18].forEach(function (oy, oi) {
      var ring = new T.Mesh(new T.TorusGeometry(.42 + oi * .10, .008, 5, 32), M.brass);
      ring.rotation.x = Math.PI * .5 + .35 + oi * .16; ring.rotation.z = .4;
      ring.position.y = oy; pyramid.add(ring); orbitRings.push(ring);
    });
    var glowRing = new T.Mesh(new T.TorusGeometry(.36, .006, 4, 32), AM.glow(0xd8f4a7, .6, { blending: T.AdditiveBlending }));
    glowRing.rotation.x = Math.PI * .5 + .2; glowRing.position.y = -.08; pyramid.add(glowRing);
    pyramid.position.y = 1.58; g.add(pyramid);
    var halo = AM.sprite(g, TEX.glowGreen, 0xd7f1a6, 1.5, .22); halo.position.y = 1.65;
    var underHalo = AM.sprite(g, TEX.glowGreen, 0xb4d48b, .8, .24); underHalo.position.y = .95;
    // floating shards
    var shards = [];
    for (var sh = 0; sh < 5; sh++) {
      var bit = new T.Mesh(new T.TetrahedronGeometry(.04 + sh * .008, 0), M.steelPale);
      bit.position.set((sh - 2) * .12, 1.35 + sh * .06, -.16 + (sh % 2) * .12);
      g.add(bit); shards.push(bit);
    }
    // small hanging task light above table
    var cord = AM.cyl(.008, .008, 1.0, 5, M.cable, false);
    cord.position.set(.18, 3.2, -.12); g.add(cord);
    var shade = new T.Mesh(new T.CylinderGeometry(.22, .11, .15, 16, 1, true), M.steelDark);
    shade.position.set(.18, 2.67, -.12); g.add(shade);
    var bulb = AM.sphere(.055, 8, 6, AM.basic(0xffd4a2, { toneMapped: false }), false);
    bulb.position.set(.18, 2.59, -.12); g.add(bulb);
    var shadeGlow = AM.sprite(g, TEX.glowWarm, 0xffc27e, 1.1, .2); shadeGlow.position.set(.18, 2.55, -.12);
    AM.sand = {
      group: g, surface: sandMat, pyramid: pyramid, rings: orbitRings, glowRing: glowRing,
      shards: shards, halo: halo, underHalo: underHalo, glowMat: glowMat2
    };
    AM.lights.tableGlow.position.set(-.94, 1.9, -.40);
    AM.lights.tableGlow.color.setHex(0xd5e99c);
    AM.lights.tableGlow.intensity = .08;
    return g;
  }
  function strutPyramid(parent, a, b, r, mat) {
    var d = new T.Vector3().subVectors(b, a);
    var len = d.length();
    var m = AM.cyl(r, r, len, 5, mat, false);
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    parent.add(m);
    return m;
  }

  /* -----------------------------------------------------------------------
     roof / skylight / rooftop plant
     ----------------------------------------------------------------------- */
  function buildRoof() {
    var g = new T.Group(); root.add(g);
    // perimeter roof fascia
    var fFront = AM.box(W + .16, .26, .36, M.concreteB, true, .002, { worldUV: true, uvScale: .45 });
    fFront.position.set(CX, TOP + .16, Z1 - .12); fFront.castShadow = true; fFront.receiveShadow = true; g.add(fFront);
    var fBack = fFront.clone(); fBack.position.z = Z0 + .12; g.add(fBack);
    var fRight = AM.box(.36, .26, D + .16, M.concreteB, true, .002, { worldUV: true, uvScale: .45 });
    fRight.position.set(X1 - .12, TOP + .16, CZ); fRight.castShadow = true; fRight.receiveShadow = true; g.add(fRight);
    var fLeft = fRight.clone(); fLeft.position.x = X0 + .12; g.add(fLeft);
    // dark drip / shadow reveal below roof
    var revealMat = M.blackMetal;
    [[CX, Z1 - .12, W + .18, .06, .38], [CX, Z0 + .12, W + .18, .06, .38]].forEach(function (p) {
      var e = AM.box(p[2], p[3], p[4], revealMat, false);
      e.position.set(p[0], TOP + .012, p[1]); g.add(e);
    });
    [[X1 - .12, CZ], [X0 + .12, CZ]].forEach(function (p) {
      var e = AM.box(.38, .06, D + .18, revealMat, false);
      e.position.set(p[0], TOP + .012, p[1]); g.add(e);
    });

    // fixed solid strip at the back; rest of the roof is walkable blast glass
    var slab = AM.box(W - .30, .22, 1.28, M.concrete, true, .0022, { worldUV: true, uvScale: .36 });
    slab.position.set(CX, TOP + .25, Z0 + .78); slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
    // exposed edge of the solid slab with rebar stubs
    var cut = AM.box(W - .30, .23, .035, M.concreteSoot, false);
    cut.position.set(CX, TOP + .25, Z0 + 1.42); g.add(cut);
    for (var re = 0; re < 7; re++) {
      var rod = AM.cyl(.015, .015, .22, 5, M.rust, false);
      rod.rotation.x = Math.PI * .5; rod.position.set(CX - 2.4 + re * .8, TOP + .22, Z0 + 1.48); g.add(rod);
    }
    // The dollhouse cut: the central roof is absent. A transparent shadow caster
    // keeps the room from being flooded by the sun while leaving the interior visible.
    var glassY = TOP + .23;
    var xA = X0 + .28, xB = X1 - .28, zA = Z0 + 1.52, zB = Z1 - .30;
    var shadowRoofMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    var shadowRoof = new T.Mesh(new T.PlaneGeometry(xB - xA, zB - zA), shadowRoofMat);
    shadowRoof.rotation.x = -Math.PI * .5;
    shadowRoof.position.set((xA + xB) * .5, glassY, (zA + zB) * .5);
    shadowRoof.castShadow = true; shadowRoof.receiveShadow = false;
    shadowRoof.userData.noOutline = true;
    g.add(shadowRoof); AM.shadowRoof = shadowRoof;
    // only a light steel cage crosses the opening
    var barMat = M.steelDark;
    var beamsX = [-1.15, .55];
    beamsX.forEach(function (x) {
      var b = AM.box(.07, .10, zB - zA + .10, barMat, true, .0015);
      b.position.set(x, glassY + .02, (zA + zB) * .5); b.castShadow = true; g.add(b);
    });
    var beamsZ = [Z0 + 2.05, Z1 - .42];
    beamsZ.forEach(function (z) {
      var b = AM.box(xB - xA + .10, .10, .07, barMat, true, .0015);
      b.position.set((xA + xB) * .5, glassY + .02, z); b.castShadow = true; g.add(b);
    });
    var perimeterBar = AM.box(xB - xA + .22, .12, .10, M.steelPale, true, .0016);
    perimeterBar.position.set((xA + xB) * .5, glassY + .02, zA - .04); g.add(perimeterBar);
    var perimeterBar2 = perimeterBar.clone(); perimeterBar2.position.z = zB + .04; g.add(perimeterBar2);
    // steel edge trim around the cut
    var trim = AM.box(xB - xA + .14, .05, .06, M.steelPale, false);
    trim.position.set((xA + xB) * .5, glassY + .04, zB + .04); g.add(trim);
    // rebar teeth along the opened slab edge
    for (var cr = 0; cr < 10; cr++) {
      var cutBar = AM.cyl(.014, .014, .24, 5, M.rust, false);
      cutBar.rotation.z = Math.PI * .5 + (cr % 2 ? .1 : -.1);
      cutBar.position.set(X0 + .7 + cr * .55, TOP + .26, Z1 - .42); g.add(cutBar);
    }
    for (var cr2 = 0; cr2 < 4; cr2++) {
      var cutBar2 = AM.cyl(.014, .014, .24, 5, M.rust, false);
      cutBar2.rotation.x = Math.PI * .5;
      cutBar2.position.set(X1 - .40, TOP + .26, Z0 + 2.0 + cr2 * .5); g.add(cutBar2);
    }

    // rooftop AC / vent plant on the back strip
    var ac = new T.Group(); ac.position.set(.85, TOP + .36, Z0 + .75); g.add(ac);
    var acBody = AM.box(.92, .48, .66, M.steelPale, true, .0018); acBody.castShadow = true; ac.add(acBody);
    var acTop = AM.box(.84, .04, .58, M.steelDark, false); acTop.position.y = .25; ac.add(acTop);
    var fanRing = new T.Mesh(new T.TorusGeometry(.20, .022, 6, 20), M.steelDark);
    fanRing.rotation.x = Math.PI * .5; fanRing.position.y = .27; ac.add(fanRing);
    var fan = new T.Group(); fan.position.y = .27;
    for (var fb = 0; fb < 4; fb++) {
      var blade = AM.box(.30, .012, .055, M.steelDark, false);
      blade.rotation.y = fb * Math.PI / 2; blade.position.set(Math.cos(fb * Math.PI / 2) * .10, 0, Math.sin(fb * Math.PI / 2) * .10);
      fan.add(blade);
    }
    ac.add(fan); AM.roofFan = fan;
    var louv = AM.louver(ac, .70, .28, .04, M.steelDark, .4);
    louv.position.set(0, -.05, .345);
    var acLabel = AM.decal(.34, .16, TEX.signCaution, { opacity: .65, fog: false });
    acLabel.position.set(-.22, .06, .355); ac.add(acLabel);
    // copper lines from AC down the back
    var pipe = AM.cyl(.026, .026, .9, 6, M.pipeRust, false);
    pipe.position.set(-2.2, TOP + .48, Z0 + .3); g.add(pipe);
    var ventStack = AM.cyl(.12, .15, .72, 12, M.steelDark, true, .0015);
    ventStack.position.set(-2.45, TOP + .50, Z0 + .65); ventStack.castShadow = true; g.add(ventStack);
    var ventCap = AM.cyl(.20, .20, .045, 12, M.steelPale, false);
    ventCap.position.set(-2.45, TOP + .88, Z0 + .65); g.add(ventCap);
    // roof hatch
    var hatch = AM.box(.58, .12, .58, M.steelDark, true, .0015);
    hatch.position.set(-1.25, TOP + .40, Z0 + .58); g.add(hatch);
    var hatchHandle = new T.Mesh(new T.TorusGeometry(.13, .025, 5, 12, Math.PI * 1.5), M.steelPale);
    hatchHandle.position.set(-1.25, TOP + .47, Z0 + .58); hatchHandle.rotation.x = Math.PI * .5; g.add(hatchHandle);
    // small antenna mast with red aircraft lamp
    var mast = AM.cyl(.025, .025, 1.7, 6, M.steelDark, false);
    mast.position.set(X0 + .55, TOP + 1.05, Z0 + .5); g.add(mast);
    var mastArm = AM.box(.68, .025, .025, M.steelPale, false);
    mastArm.position.set(X0 + .55, TOP + 1.42, Z0 + .5); g.add(mastArm);
    var beacon = AM.sphere(.045, 8, 5, M.ledRed, false);
    beacon.position.set(X0 + .55, TOP + 1.92, Z0 + .5); g.add(beacon);
    var beaconHalo = AM.sprite(g, TEX.glowRed, 0xff4a31, .75, .28);
    beaconHalo.position.set(X0 + .55, TOP + 1.92, Z0 + .5);
    // roof cable
    root.add(AM.tube([new T.Vector3(X0 + .45, TOP + .32, Z0 + .3), new T.Vector3(X0 + 1.3, TOP + .28, Z0 + .6), new T.Vector3(X1 - .8, TOP + .30, Z0 + .2)], .012, M.cable, 20, 5));
    // small roof lip at the front edge; catches the light
    var nose = AM.box(W + .1, .05, .10, M.steelPale, false);
    nose.position.set(CX, TOP + .30, Z1 - .01); g.add(nose);

    // two interior cross-members, visible through the glass roof
    [Z0 + 1.85, Z0 + 3.2].forEach(function (z) {
      var b = AM.iBeam(W - .5, .16, .12, M.steelDark, true);
      b.position.set(CX, TOP - .08, z); b.castShadow = true; g.add(b);
    });
    AM.roof = g;
  }

  /* -----------------------------------------------------------------------
     interior floor / base surfaces
     ----------------------------------------------------------------------- */
  function buildInteriorFloor() {
    var g = new T.Group(); root.add(g);
    var floorTex = TEX.interiorFloor.clone();
    floorTex.needsUpdate = true;
    floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping;
    floorTex.repeat.set(2.5, 1.9);
    floorTex.anisotropy = 8;
    var floorMat = AM.toon(0x94856a, { map: floorTex, gradientMap: AM.gradWarm, rim: .04, rimColor: 0xffcb86, rimPower: 3.2 });
    M.roomFloor = floorMat;
    var floor = new T.Mesh(new T.PlaneGeometry(W - .42, D - .42), floorMat);
    floor.rotation.x = -Math.PI * .5;
    floor.position.set(CX, FLOOR + .006, CZ);
    floor.receiveShadow = true; g.add(floor);
    // rim threshold
    var lipMat = M.steelDark;
    [[CX, Z0 + .27, W - .42], [CX, Z1 - .27, W - .42]].forEach(function (p) {
      var l = AM.box(p[2], .04, .045, lipMat, false);
      l.position.set(p[0], FLOOR + .022, p[1]); g.add(l);
    });
    [[X0 + .27, CZ], [X1 - .27, CZ]].forEach(function (p) {
      var l = AM.box(.045, .04, D - .42, lipMat, false);
      l.position.set(p[0], FLOOR + .022, p[1]); g.add(l);
    });
    // carpet runner from door into the room
    var carpetTex = TEX.carpet.clone(); carpetTex.needsUpdate = true;
    carpetTex.wrapS = carpetTex.wrapT = T.RepeatWrapping; carpetTex.repeat.set(1.2, 2.2);
    var carpetMat = AM.toon(0xffffff, { map: carpetTex, gradientMap: AM.gradWarm, rim: .02 });
    var runner = new T.Mesh(new T.PlaneGeometry(1.05, 2.65), carpetMat);
    runner.rotation.x = -Math.PI * .5; runner.rotation.z = .02;
    runner.position.set(-1.38, FLOOR + .013, .1);
    runner.receiveShadow = true; g.add(runner);
    var border = AM.box(1.18, .012, 2.76, M.brass, false);
    border.position.set(-1.38, FLOOR + .008, .1); g.add(border);
    // circular brass marker under the sand table
    var circle = new T.Mesh(new T.TorusGeometry(1.02, .014, 5, 40), M.brass);
    circle.rotation.x = Math.PI * .5; circle.position.set(-.92, FLOOR + .018, -.40); g.add(circle);
    var circle2 = new T.Mesh(new T.TorusGeometry(.88, .006, 4, 40), M.steelPale);
    circle2.rotation.x = Math.PI * .5; circle2.position.set(-.92, FLOOR + .018, -.40); g.add(circle2);
    // paper scraps / scuffs
    var rnd = AM.rng(51);
    for (var i = 0; i < 5; i++) {
      var scrap = new T.Mesh(new T.PlaneGeometry(.12 + rnd() * .10, .08 + rnd() * .14), AM.basic(0xd6cfb9, { toneMapped: true }));
      scrap.rotation.x = -Math.PI * .5; scrap.rotation.z = rnd() * 6.28;
      scrap.position.set(-2.6 + rnd() * 3.8, FLOOR + .016, -1.6 + rnd() * 2.6);
      g.add(scrap);
    }
    AM.roomFloorGroup = g;
  }


  /* -----------------------------------------------------------------------
     the working console (L-shaped, sloped panels, period hardware)
     ----------------------------------------------------------------------- */
  function makeKeyboardTop(w, d, variant) {
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: variant ? ITEX.keyboardB : ITEX.keyboardA, toneMapped: false }));
    m.rotation.x = -Math.PI * .5;
    return m;
  }

  function makePaper(parent, texIdx, w, h, x, y, z, ry) {
    var p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: TEX.papers[texIdx % TEX.papers.length], toneMapped: false }));
    p.rotation.x = -Math.PI * .5; p.rotation.z = ry || 0;
    p.position.set(x, y, z);
    parent.add(p);
    return p;
  }

  function makePhone(red) {
    var g = new T.Group();
    var mat = red ? M.redPaint : M.blackPlastic;
    var body = AM.box(.21, .075, .16, mat, true, .0009); g.add(body);
    var handset = AM.box(.25, .06, .065, mat, false);
    handset.position.set(0, .095, -.01); handset.rotation.z = .07; g.add(handset);
    var earpiece = AM.cyl(.028, .028, .07, 8, mat, false);
    earpiece.rotation.x = Math.PI * .5; earpiece.position.set(-.10, .095, -.01); g.add(earpiece);
    var mouthpiece = earpiece.clone(); mouthpiece.position.x = .10; g.add(mouthpiece);
    var dial = AM.cyl(.05, .05, .018, 12, M.cream, false);
    dial.rotation.x = Math.PI * .5; dial.position.set(0, .02, .083); g.add(dial);
    for (var h = 0; h < 8; h++) {
      var hole = AM.cyl(.005, .005, .01, 5, M.blackPlastic, false);
      var a = h / 8 * Math.PI * 2;
      hole.rotation.x = Math.PI * .5; hole.position.set(Math.cos(a) * .032, .02 + Math.sin(a) * .032, .092); g.add(hole);
    }
    // coiled cord
    for (var c = 0; c < 8; c++) {
      var ring = new T.Mesh(new T.TorusGeometry(.05, .005, 4, 10), M.cable);
      ring.position.set(-.24 - c * .015, -.01, .02 - c * .012);
      ring.rotation.x = .5 + c * .2; ring.rotation.y = .3;
      g.add(ring);
    }
    return g;
  }

  function makeMug() {
    var g = new T.Group();
    var body = new T.Mesh(new T.CylinderGeometry(.048, .042, .095, 14, 1, false), M.ceramic);
    body.position.y = .047; g.add(body);
    var coffee = AM.cyl(.043, .043, .006, 14, M.woodDark, false);
    coffee.position.y = .092; g.add(coffee);
    var handle = new T.Mesh(new T.TorusGeometry(.034, .008, 5, 10, Math.PI * 1.4), M.ceramic);
    handle.position.set(.052, .048, 0); handle.rotation.z = -.6; g.add(handle);
    return g;
  }

  function makeAshtray() {
    var g = new T.Group();
    var tray = new T.Mesh(new T.CylinderGeometry(.10, .085, .035, 14, 1, false), M.blackMetal);
    tray.position.y = .018; AM.outline(tray, .0012); g.add(tray);
    var bowl = AM.cyl(.085, .075, .015, 14, M.ash, false);
    bowl.position.y = .034; g.add(bowl);
    var cig = AM.cyl(.009, .010, .13, 5, M.paper, false);
    cig.rotation.z = Math.PI * .5 + .2; cig.rotation.y = .4;
    cig.position.set(.01, .046, -.02); g.add(cig);
    var ember = AM.sphere(.012, 6, 4, M.ember, false);
    ember.position.set(.07, .046, -.03); g.add(ember);
    var glow = AM.sprite(g, TEX.glowRed, 0xff7e46, .38, .32); glow.position.set(.07, .07, -.03);
    return g;
  }

  function buildConsole() {
    var g = new T.Group(); root.add(g);
    var topY = FLOOR + .76;
    // L desk front run
    var cw = 2.14, cd = .56, cx = .56, cz = 1.04;
    var top = AM.box(cw, .065, cd, M.wood, true, .0018);
    top.position.set(cx, topY, cz); top.castShadow = true; top.receiveShadow = true; g.add(top);
    var topEdge = AM.box(cw + .03, .025, .035, M.brass, false);
    topEdge.position.set(cx, topY + .038, cz + cd * .5); g.add(topEdge);
    var apron = AM.box(cw, .10, .04, M.woodDark, false);
    apron.position.set(cx, topY - .07, cz + cd * .5 + .01); g.add(apron);
    // front modesty / equipment bay
    var modesty = AM.box(cw, .64, .055, M.steelDark, true, .0018);
    modesty.position.set(cx, FLOOR + .36, cz + cd * .5 + .02); modesty.castShadow = true; g.add(modesty);
    for (var mv = 0; mv < 4; mv++) {
      var louv = AM.louver(g, .28, .16, .018, M.steelPale, .55);
      louv.position.set(cx - .72 + mv * .48, FLOOR + .40, cz + cd * .5 + .055);
    }
    for (var dr = 0; dr < 2; dr++) {
      var handle = AM.box(.15, .022, .03, M.brass, false);
      handle.position.set(cx - .45 + dr * .88, FLOOR + .56, cz + cd * .5 + .055); g.add(handle);
    }
    var decal = AM.decal(.44, .14, TEX.signCaution, { opacity: .74, fog: false });
    decal.position.set(cx - .95, FLOOR + .27, cz + cd * .5 + .056); g.add(decal);
    // legs / pedestals
    [-1, 1].forEach(function (s) {
      var ped = AM.box(.44, .72, .40, M.steelDark, true, .0015);
      ped.position.set(cx + s * .76, FLOOR + .36, cz - .01); g.add(ped);
      var foot = AM.box(.50, .035, .44, M.blackMetal, false);
      foot.position.set(cx + s * .76, FLOOR + .018, cz - .01); g.add(foot);
    });
    // side return along the right glass
    var sx = 1.56, sz = -.05, sw = .52, sd = 1.55;
    var stop = AM.box(sw, .065, sd, M.wood, true, .0018);
    stop.position.set(sx, topY, sz); stop.castShadow = true; g.add(stop);
    var sEdge = AM.box(.035, .025, sd + .03, M.brass, false);
    sEdge.position.set(sx + sw * .5, topY + .038, sz); g.add(sEdge);
    var sMod = AM.box(.055, .62, sd, M.steelDark, true, .0016);
    sMod.position.set(sx + sw * .5 + .02, FLOOR + .35, sz); g.add(sMod);
    var sLeg = AM.box(.10, .70, .10, M.steelDark, false);
    sLeg.position.set(sx, FLOOR + .35, sz + sd * .42); g.add(sLeg);
    var sLeg2 = sLeg.clone(); sLeg2.position.z = sz - sd * .42; g.add(sLeg2);
    // front controller / sloping panel
    function addPanel(px, pz, w, variant, yRot) {
      var pg = new T.Group();
      pg.position.set(px, topY + .06, pz);
      pg.rotation.x = -.12;
      if (yRot) pg.rotation.y = yRot;
      var panelMat = AM.toon(0xffffff, { map: variant ? ITEX.panelB : ITEX.panelA, gradientMap: AM.gradWarm, rim: .05, rimColor: 0xffc77e });
      var pl = new T.Mesh(new T.BoxGeometry(w, .035, .39), panelMat);
      pl.castShadow = true; pl.receiveShadow = true; pg.add(pl);
      var rim = AM.box(w + .035, .055, .41, M.steelDark, false);
      rim.position.y = -.03; pg.add(rim);
      // physical controls
      for (var i = 0; i < 5; i++) {
        var b = AM.cyl(.012, .012, .012, 6, i === 1 ? M.ledAmber : (i === 3 ? M.ledGreen : M.buttons), false);
        b.position.set(-w * .40 + i * .16, .026, .055); pg.add(b);
      }
      var joyBase = AM.cyl(.045, .05, .03, 8, M.steelDark, false);
      joyBase.position.set(w * .34, .024, -.03); pg.add(joyBase);
      var stick = AM.cyl(.012, .014, .10, 6, M.steelPale, false);
      stick.position.set(w * .34, .07, -.03); stick.rotation.z = -.22; pg.add(stick);
      var ball = AM.sphere(.035, 8, 6, M.redPaint, false);
      ball.position.set(w * .34 + .015, .125, -.03); pg.add(ball);
      g.add(pg);
      return pg;
    }
    addPanel(cx - .42, cz + .02, 1.02, 0, 0);
    addPanel(cx + .48, cz + .02, .82, 1, 0);
    // embedded tiny status monitor on the console
    var statusScr = makeMonitor(0, { w: .40, h: .31, d: .26, bodyMat: M.blackPlastic, seed: 94, tint: 0xcfefa7, power: 1.2, halo: 0xb3d77f });
    statusScr.position.set(cx + .72, topY + .28, cz - .03);
    statusScr.rotation.y = -.52; statusScr.rotation.x = .08;
    g.add(statusScr);
    var kb = makeKeyboardTop(.42, .20, 0);
    kb.rotation.x = -Math.PI * .5;
    kb.rotation.z = -.03;
    kb.position.set(cx + .52, topY + .040, cz + .24); g.add(kb);
    // keyboard on the side return
    var kb2 = makeKeyboardTop(.36, .18, 1);
    kb2.rotation.x = -Math.PI * .5;
    kb2.rotation.z = 1.57;
    kb2.position.set(sx - .08, topY + .040, sz + .10); g.add(kb2);
    // desk lamp with green glass shade
    var lamp = new T.Group();
    var lampBase = AM.cyl(.09, .11, .03, 12, M.brass, true, .0010); lamp.add(lampBase);
    var stemL = AM.cyl(.013, .016, .31, 6, M.brass, false); stemL.position.set(.01, .17, 0); stemL.rotation.z = .10; lamp.add(stemL);
    var shade = new T.Mesh(new T.CylinderGeometry(.17, .08, .12, 12, 1, true), AM.toon(0x4e6a4e, { side: T.DoubleSide, rim: .22, rimColor: 0xc9e19a }));
    shade.position.set(.02, .34, 0); shade.rotation.x = .15; lamp.add(shade);
    var bulbL = AM.sphere(.035, 8, 6, AM.basic(0xffe2ab, { toneMapped: false }), false);
    bulbL.position.set(.02, .29, 0); lamp.add(bulbL);
    var glowL = AM.sprite(lamp, TEX.glowWarm, 0xffc988, .52, .2); glowL.position.set(.02, .31, 0);
    lamp.position.set(cx - .83, topY + .04, cz + .13); lamp.rotation.y = .45; g.add(lamp);
    // ashtray, mug, papers, phone, and the smell of old carpet
    var ashtray = makeAshtray();
    ashtray.position.set(cx + .04, topY + .04, cz - .05); ashtray.rotation.y = .4; g.add(ashtray);
    AM.interiorSmoke.push({ local: 'console', position: new T.Vector3(cx + .10, topY + .18, cz - .03), seed: 3 });
    var mug = makeMug();
    mug.position.set(cx - .54, topY + .04, cz + .10); mug.rotation.y = .8; g.add(mug);
    var phone = makePhone(true);
    phone.position.set(cx + 1.0, topY + .04, cz - .12); phone.rotation.y = -.42; g.add(phone);
    makePaper(g, 0, .28, .39, cx + .19, topY + .043, cz + .12, -.06);
    makePaper(g, 1, .26, .36, cx + .26, topY + .046, cz + .14, .06);
    var doc = AM.decal(.26, .34, TEX.papers[2], { opacity: .95, fog: false });
    doc.rotation.x = -Math.PI * .5; doc.rotation.z = .4;
    doc.position.set(sx - .04, topY + .043, sz - .23); g.add(doc);
    // control cards & hand tools
    var card = AM.decal(.16, .10, TEX.punchCard, { opacity: .95, fog: false });
    card.rotation.x = -Math.PI * .5; card.rotation.z = .1;
    card.position.set(cx - .22, topY + .043, cz + .23); g.add(card);
    // under-desk cables
    g.add(cable([new T.Vector3(cx - .95, FLOOR + .2, cz + .35), new T.Vector3(cx - .3, FLOOR + .03, cz + .62), new T.Vector3(cx + .8, FLOOR + .02, cz + .55), new T.Vector3(sx, FLOOR + .04, sz + .45)], .014, M.cable, 26));
    // equipment on the side return: tape deck, paper tray, red handset
    var sideDeck = makeTapeDeck(21, { scale: 1.0 });
    sideDeck.position.set(sx - .05, topY + .14, sz - .25);
    sideDeck.rotation.y = -.1; g.add(sideDeck);
    var tray = AM.box(.30, .055, .38, M.steelPale, true, .0010);
    tray.position.set(sx - .05, topY + .05, sz + .33); g.add(tray);
    for (var tr = 0; tr < 3; tr++) {
      var pd = AM.decal(.24, .30, TEX.papers[tr], { opacity: .95, fog: false });
      pd.rotation.x = -Math.PI * .5; pd.rotation.z = (tr - 1) * .08;
      pd.position.set(sx - .05, topY + .08 + tr * .004, sz + .33); g.add(pd);
    }
    var sidePhone = makePhone(false);
    sidePhone.position.set(sx - .06, topY + .04, sz + .58); sidePhone.rotation.y = .5; g.add(sidePhone);
    AM.console = g;
  }

  /* -----------------------------------------------------------------------
     empty chair / intimate scale
     ----------------------------------------------------------------------- */
  function makeOfficeChair() {
    var g = new T.Group();
    var chrome = M.steelPale;
    // five-star base
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2;
      var leg = AM.box(.34, .035, .045, M.steelDark, false);
      leg.position.set(Math.cos(a) * .18, .06, Math.sin(a) * .18);
      leg.rotation.y = -a;
      g.add(leg);
      var wheel = AM.cyl(.045, .045, .035, 8, M.rubber, false);
      wheel.rotation.z = Math.PI * .5;
      wheel.position.set(Math.cos(a) * .33, .045, Math.sin(a) * .33); g.add(wheel);
      var caster = AM.box(.05, .08, .05, chrome, false);
      caster.position.set(Math.cos(a) * .33, .09, Math.sin(a) * .33); g.add(caster);
    }
    var hub = AM.cyl(.07, .07, .06, 8, chrome, false); hub.position.y = .10; g.add(hub);
    var gas = AM.cyl(.035, .045, .29, 8, M.steelDark, false); gas.position.y = .26; g.add(gas);
    var seat = AM.box(.47, .12, .44, M.leather, true, .0018);
    seat.position.y = .46; seat.castShadow = true; g.add(seat);
    var seam = AM.box(.43, .014, .05, M.woodDark, false); seam.position.set(0, .525, .0);
    g.add(seam);
    var back = AM.box(.44, .64, .11, M.leather, true, .0018);
    back.position.set(0, .82, -.21); back.rotation.x = -.12; back.castShadow = true; g.add(back);
    var head = AM.box(.34, .17, .12, M.leather, false);
    head.position.set(0, 1.16, -.24); head.rotation.x = -.12; g.add(head);
    var spine = AM.box(.055, .52, .055, chrome, false); spine.position.set(0, .74, -.28); spine.rotation.x = -.12; g.add(spine);
    [-1, 1].forEach(function (s) {
      var arm = AM.box(.055, .055, .38, chrome, false);
      arm.position.set(s * .28, .63, -.02); g.add(arm);
      var armRest = AM.box(.07, .045, .28, M.leather, false);
      armRest.position.set(s * .28, .68, .03); g.add(armRest);
      var armPost = AM.box(.045, .19, .045, chrome, false);
      armPost.position.set(s * .28, .54, -.13); g.add(armPost);
    });
    var logo = AM.decal(.09, .09, TEX.sealPaint, { opacity: .28, fog: false });
    logo.position.set(0, .89, -.155); g.add(logo);
    return g;
  }

  function buildChairs() {
    var chairGroup = new T.Group(); root.add(chairGroup); AM.chairsGroup = chairGroup;
    var chair = makeOfficeChair();
    chair.position.set(.58, FLOOR, .34);
    chair.rotation.y = Math.PI + .18;
    chairGroup.add(chair); AM.chair = chair;
    // a second chair tucked by the left end of the side return
    var chair2 = makeOfficeChair();
    chair2.position.set(1.16, FLOOR, -.22);
    chair2.rotation.y = -1.0;
    chair2.scale.set(.92, .92, .92);
    chairGroup.add(chair2);
    // old metal stool by the tape shelves
    var stool = new T.Group();
    var seat = AM.cyl(.18, .18, .045, 12, M.leather, true, .0012);
    seat.position.y = .58; stool.add(seat);
    var column = AM.cyl(.025, .035, .54, 6, M.steelDark, false);
    column.position.y = .29; stool.add(column);
    for (var i = 0; i < 3; i++) {
      var a = i / 3 * Math.PI * 2;
      var leg = AM.box(.035, .58, .035, M.steelDark, false);
      leg.position.set(Math.cos(a) * .13, .28, Math.sin(a) * .13);
      leg.rotation.z = Math.cos(a) * .12; leg.rotation.x = Math.sin(a) * .12;
      stool.add(leg);
    }
    stool.position.set(-2.25, FLOOR, 1.18);
    chairGroup.add(stool);
  }

  /* -----------------------------------------------------------------------
     classified archives, safe, specimen & plant
     ----------------------------------------------------------------------- */
  function makeArchiveBox(variant, w, h, d) {
    var g = new T.Group();
    w = w || .34; h = h || .27; d = d || .26;
    var body = AM.box(w, h, d, M.cream, true, .0011);
    body.castShadow = true; g.add(body);
    var lid = AM.box(w + .01, .055, d + .01, M.cream, false);
    lid.position.y = h * .5 + .017; g.add(lid);
    var tape = AM.box(w * .08, .018, d + .012, M.hazardStripe, false);
    tape.position.set(w * .22, h * .5 + .047, 0); g.add(tape);
    var face = AM.decal(w * .88, h * .82, TEX.boxLabels[variant % TEX.boxLabels.length], { opacity: .98, fog: false });
    face.position.set(0, -.005, d * .5 + .008); g.add(face);
    var handle = AM.box(w * .22, .025, .03, M.blackPlastic, false);
    handle.position.set(0, h * .5 - .01, d * .5 + .02); g.add(handle);
    return g;
  }

  function buildArchiveCorner() {
    var g = new T.Group(); root.add(g);
    // heavy green safe
    var safe = new T.Group();
    var safeBody = AM.box(.66, .88, .54, M.pipeGreen, true, .0020);
    safeBody.position.y = .44; safeBody.castShadow = true; safe.add(safeBody);
    var top = AM.box(.70, .06, .58, M.steelDark, false); top.position.y = .90; safe.add(top);
    var door = AM.box(.53, .69, .035, M.circuitDark, false); door.position.set(.01, .46, .283); safe.add(door);
    var dial = AM.cyl(.10, .10, .025, 16, M.brass, true, .0010);
    dial.rotation.x = Math.PI * .5; dial.position.set(-.08, .55, .315); safe.add(dial);
    var dialInner = AM.cyl(.055, .055, .02, 12, M.steelPale, false);
    dialInner.rotation.x = Math.PI * .5; dialInner.position.set(-.08, .55, .332); safe.add(dialInner);
    var spokes = new T.Group(); spokes.position.set(-.08, .55, .335);
    for (var sp = 0; sp < 3; sp++) {
      var spoke = AM.box(.15, .012, .01, M.brass, false); spoke.rotation.z = sp * Math.PI / 3; spokes.add(spoke);
    }
    safe.add(spokes);
    var handle = AM.cyl(.018, .018, .16, 6, M.steelPale, false); handle.position.set(.15, .38, .32); safe.add(handle);
    var sealSafe = AM.decal(.18, .18, TEX.sealPaint, { opacity: .7, fog: false });
    sealSafe.position.set(.13, .68, .303); safe.add(sealSafe);
    var safeLabel = AM.decal(.23, .12, TEX.signCaution, { opacity: .8, fog: false });
    safeLabel.position.set(-.12, .27, .304); safe.add(safeLabel);
    safe.position.set(1.56, FLOOR, -1.86); safe.rotation.y = -.12; g.add(safe);
    // filing cabinet
    var cab = new T.Group();
    var cabBody = AM.box(.52, 1.02, .48, M.steelPale, true, .0017);
    cabBody.position.y = .51; cabBody.castShadow = true; cab.add(cabBody);
    for (var dr = 0; dr < 3; dr++) {
      var drawer = AM.box(.45, .26, .035, M.cream, false);
      drawer.position.set(0, .22 + dr * .31, .255); cab.add(drawer);
      var hdl = AM.box(.16, .025, .035, M.steelDark, false);
      hdl.position.set(0, .25 + dr * .31, .278); cab.add(hdl);
      var lbl = AM.box(.16, .055, .012, M.steelDark, false);
      lbl.position.set(0, .36 + dr * .31, .268); cab.add(lbl);
    }
    cab.position.set(.74, FLOOR, -1.96); cab.rotation.y = .04; g.add(cab);
    // archive boxes on and around the cabinet
    var floorBoxes = [
      { v: 0, x: .08, z: -1.66, y: FLOOR + .14, w: .34, h: .27, ry: .18 },
      { v: 2, x: .14, z: -1.43, y: FLOOR + .40, w: .30, h: .24, ry: -.10 },
      { v: 3, x: -.08, z: -1.23, y: FLOOR + .13, w: .31, h: .25, ry: .40 },
      { v: 1, x: 1.15, z: -1.55, y: FLOOR + .13, w: .32, h: .26, ry: -.25 }
    ];
    floorBoxes.forEach(function (b) {
      var bx = makeArchiveBox(b.v, b.w, b.h, .25);
      bx.position.set(b.x, b.y, b.z);
      bx.rotation.y = b.ry;
      g.add(bx);
    });
    // one narrower file box perched on the side return
    var perchBox = makeArchiveBox(2, .28, .23, .22);
    perchBox.position.set(1.58, FLOOR + .80, .66);
    perchBox.rotation.y = .22;
    g.add(perchBox);
    // anomalous specimen on the safe
    var spec = new T.Group(); spec.position.set(1.44, FLOOR + .92, -1.82);
    var caseMat = AM.phys(0xa9bfa4, { transparent: true, opacity: .14, roughness: .05, clearcoat: 1, depthWrite: false, envMapIntensity: 1.6 });
    var glassCase = new T.Mesh(new T.BoxGeometry(.28, .34, .28), caseMat);
    glassCase.position.y = .17; glassCase.renderOrder = 4; spec.add(glassCase);
    var frameMat = M.brass;
    for (var e = 0; e < 4; e++) {
      var edge = AM.box(.018, .34, .018, frameMat, false);
      edge.position.set((e % 2 ? .14 : -.14), .17, (e > 1 ? .14 : -.14)); spec.add(edge);
    }
    var capT = AM.box(.30, .018, .30, frameMat, false); capT.position.y = .345; spec.add(capT);
    var ped = AM.cyl(.10, .13, .035, 10, M.steelDark, false); ped.position.y = .018; spec.add(ped);
    var anomaly = new T.Mesh(new T.OctahedronGeometry(.075, 0), AM.toon(0x1b2019, { rim: .5, rimColor: 0xc4e08d, rimPower: 2.0, flatShading: true }));
    anomaly.position.y = .20; spec.add(anomaly);
    var anomGlow = AM.sprite(spec, TEX.glowGreen, 0xcceb9e, .55, .30); anomGlow.position.y = .20;
    g.add(spec);
    AM.anomaly = anomaly;
    // small placard
    var placard = AM.decal(.16, .07, TEX.signCaution, { opacity: .8, fog: false });
    placard.position.set(1.44, FLOOR + .97, -1.68); g.add(placard);
    // sansevieria plant on the filing cabinet
    var plant = new T.Group(); plant.position.set(.76, FLOOR + 1.06, -1.96);
    var pot = AM.cyl(.11, .085, .15, 10, M.ceramic, true, .0011); pot.position.y = .075; plant.add(pot);
    var soil = AM.cyl(.09, .09, .01, 10, M.woodDark, false); soil.position.y = .155; plant.add(soil);
    for (var lf = 0; lf < 7; lf++) {
      var a2 = lf / 7 * Math.PI * 2;
      var leaf = new T.Mesh(new T.ConeGeometry(.045, .42 + (lf % 3) * .08, 4), M.circuitGreen);
      leaf.position.set(Math.cos(a2) * .04, .34, Math.sin(a2) * .04);
      leaf.rotation.z = Math.cos(a2) * .20;
      leaf.rotation.x = Math.sin(a2) * .18;
      leaf.castShadow = true;
      plant.add(leaf);
    }
    g.add(plant);
    // fire extinguisher by the front door
    var extG = new T.Group();
    var ext = AM.cyl(.055, .07, .38, 10, M.redPaint, true, .0014);
    ext.position.y = .22; extG.add(ext);
    var extTop = AM.cyl(.03, .04, .08, 8, M.steelDark, false); extTop.position.y = .45; extG.add(extTop);
    var extHose = cable([new T.Vector3(0, .35, .03), new T.Vector3(.04, .24, .14), new T.Vector3(-.02, .10, .18)], .008, M.cable, 10);
    extG.add(extHose);
    extG.position.set(-2.63, FLOOR, 1.05);
    root.add(extG);

    // wastepaper basket with crumpled paper
    var waste = new T.Group();
    var bin = new T.Mesh(new T.CylinderGeometry(.15, .12, .32, 12, 1, true), M.steelPale);
    bin.position.y = .16; waste.add(bin);
    for (var w = 0; w < 3; w++) {
      var ball = new T.Mesh(new T.IcosahedronGeometry(.055, 0), M.paper);
      ball.position.set((w - 1) * .045, .33 + (w % 2) * .03, 0);
      waste.add(ball);
    }
    waste.position.set(-.13, FLOOR, .52); root.add(waste);
    // floor paper
    makePaper(g, 1, .22, .30, -.4, FLOOR + .017, .26, .3);
    AM.archiveGroup = g;
  }

  /* -----------------------------------------------------------------------
     room lights / ceiling details
     ----------------------------------------------------------------------- */
  function makeCeilingTube(x, z, len, colorHex, warm, seedKey) {
    var g = new T.Group(); root.add(g);
    var y = FLOOR + 2.70;
    var mat = new T.MeshBasicMaterial({ color: colorHex, toneMapped: false });
    var tube = new T.Mesh(new T.CylinderGeometry(.025, .025, len, 8, 1, false), mat);
    tube.rotation.z = Math.PI * .5; g.add(tube);
    var hood = AM.box(len + .16, .055, .22, M.steelDark, true, .0013);
    hood.position.y = .10; hood.castShadow = true; g.add(hood);
    [-1, 1].forEach(function (s) {
      var cap = AM.cyl(.040, .040, .08, 8, M.steelPale, false);
      cap.rotation.z = Math.PI * .5; cap.position.set(s * (len * .5 + .04), 0, 0); g.add(cap);
      var rod = AM.cyl(.008, .008, .48, 5, M.steelDark, false);
      rod.position.set(s * len * .35, .36, 0); g.add(rod);
    });
    var halo = AM.sprite(g, warm ? TEX.glowWarm : TEX.glowGreen, colorHex, len * 1.32, .16);
    halo.position.y = -.03;
    g.position.set(x, y, z);
    AM.interiorFixtures = AM.interiorFixtures || [];
    AM.interiorFixtures.push({ group: g, mats: [mat], light: null, seed: seedKey || 1, color: new T.Color(colorHex), flicker: true, base: 1 });
    return g;
  }

  function buildRoomLights() {
    // two suspended work tubes; one is deliberately a little unreliable
    makeCeilingTube(-.85, -1.08, 2.1, 0xffb766, true, 2);
    makeCeilingTube(-.55, .64, 1.8, 0xbbe86b, false, 5);
    // pendant lamp over the sand table
    var g = new T.Group(); root.add(g);
    var wire = AM.cyl(.010, .010, .86, 5, M.cable, false);
    wire.position.set(-.94, FLOOR + 3.07, -.40); g.add(wire);
    var shade = new T.Mesh(new T.CylinderGeometry(.26, .12, .19, 16, 1, true), M.steelDark);
    shade.position.set(-.94, FLOOR + 2.64, -.40); g.add(shade);
    var shadeInner = new T.Mesh(new T.CircleGeometry(.24, 16), AM.basic(0xffcb8a, { toneMapped: false }));
    shadeInner.rotation.x = Math.PI * .5; shadeInner.position.set(-.94, FLOOR + 2.55, -.40); g.add(shadeInner);
    var bulb = AM.sphere(.09, 10, 6, AM.basic(0xffe5b8, { toneMapped: false }), false);
    bulb.position.set(-.94, FLOOR + 2.52, -.40); g.add(bulb);
    var halo = AM.sprite(g, TEX.glowWarm, 0xffca88, 1.6, .27);
    halo.position.set(-.94, FLOOR + 2.48, -.40);
    AM.pendantGroup = g;
    // caged red lamp above the safe
    var em = new T.Group();
    var stem = AM.cyl(.018, .018, .34, 6, M.steelDark, false); stem.position.y = .17; em.add(stem);
    var cage = new T.Mesh(new T.SphereGeometry(.075, 8, 6), new T.MeshBasicMaterial({ color: 0x5f1b14, wireframe: true }));
    cage.position.y = .0; em.add(cage);
    var redBulb = AM.sphere(.05, 8, 6, M.ledRed, false); redBulb.position.y = .0; em.add(redBulb);
    var redHalo = AM.sprite(em, TEX.glowRed, 0xff4b32, .48, .30); redHalo.position.y = .0;
    em.position.set(1.72, FLOOR + 2.3, -2.02);
    root.add(em); AM.emergencyGroup = em;
    // emergency box / wall hotline
    var hook = new T.Group();
    var box = AM.box(.22, .30, .10, M.redPaint, true, .0012); hook.add(box);
    var handset = AM.box(.09, .20, .06, M.blackPlastic, false);
    handset.position.set(0, .01, .08); hook.add(handset);
    var label = AM.decal(.16, .055, TEX.signCaution, { opacity: .85, fog: false });
    label.position.set(0, .10, .053); hook.add(label);
    hook.position.set(1.88, FLOOR + 1.55, Z0 + .36);
    hook.rotation.y = -.0;
    root.add(hook); AM.hotlineGroup = hook;
    // adjust the existing interior point lights
    if (AM.lights.warm) {
      AM.lights.warm.color.setHex(0xff9b4f);
      AM.lights.warm.intensity = .14;
      AM.lights.warm.distance = 7.6;
      AM.lights.warm.position.set(-.65, 3.0, .30);
    }
    if (AM.lights.warm2) {
      AM.lights.warm2.color.setHex(0xffb46d);
      AM.lights.warm2.intensity = .06;
      AM.lights.warm2.distance = 5.4;
      AM.lights.warm2.position.set(1.0, 1.95, .55);
    }
    if (AM.lights.monitor) {
      AM.lights.monitor.color.setHex(0x8cc95c);
      AM.lights.monitor.intensity = .28;
      AM.lights.monitor.distance = 4.8;
      AM.lights.monitor.position.set(-1.0, 1.96, -1.85);
    }
    if (AM.lights.tableGlow) {
      AM.lights.tableGlow.color.setHex(0xc6e583);
      AM.lights.tableGlow.intensity = .08;
      AM.lights.tableGlow.distance = 3.4;
      AM.lights.tableGlow.position.set(-.94, 1.8, -.40);
    }
    if (AM.lights.redLamp) {
      AM.lights.redLamp.intensity = .45;
      AM.lights.redLamp.distance = 3.6;
      AM.lights.redLamp.position.set(1.72, 2.7, -1.9);
    }
    var deskLight = new T.PointLight(0xffbf7a, .22, 2.5, 2);
    deskLight.position.set(-.18, FLOOR + 1.18, 1.28);
    root.add(deskLight);
    AM.lights.desk = deskLight;
    AM.interiorPointLights = [AM.lights.warm, AM.lights.warm2, AM.lights.monitor, AM.lights.tableGlow, deskLight];
  }

  /* -----------------------------------------------------------------------
     wall dressing & interior atmosphere
     ----------------------------------------------------------------------- */
  function buildInteriorDressing() {
    var g = new T.Group(); root.add(g);
    // stack of reels on the credenza etc are already there; add ceiling duct
    var duct = AM.box(1.55, .22, .26, M.duct, true, .0014);
    duct.position.set(.70, FLOOR + 3.22, Z0 + .45); duct.castShadow = true; g.add(duct);
    for (var b = 0; b < 4; b++) {
      var band = AM.box(1.60, .03, .30, M.steelDark, false);
      band.position.set(.70, FLOOR + 3.12 + b * .065, Z0 + .45); g.add(band);
    }
    var louvInt = AM.louver(g, 1.10, .14, .02, M.steelPale, .4);
    louvInt.position.set(.70, FLOOR + 3.22, Z0 + .59);
    // hanging cable conduit
    var conduit = AM.cyl(.024, .024, 2.45, 6, M.pipeRust, false);
    conduit.rotation.z = Math.PI * .5; conduit.position.set(.3, FLOOR + 3.5, Z0 + .5); g.add(conduit);
    // pinup notes near the door
    var notes = [0, 1, 2];
    notes.forEach(function (n) {
      var note = AM.decal(.19, .25, TEX.papers[n], { opacity: .9, fog: false });
      note.rotation.y = Math.PI * .5;
      note.position.set(X0 + .325, FLOOR + 1.72 + n * .31, .68 + n * .10);
      g.add(note);
    });
    // hazard yellow line on floor at doorway
    var lane = new T.Mesh(new T.PlaneGeometry(1.1, .12), M.hazardStripe);
    lane.rotation.x = -Math.PI * .5; lane.position.set(-1.85, FLOOR + .026, 1.28); g.add(lane);
    // FBC seal floor mat just inside
    var mat = AM.cyl(.34, .34, .025, 32, M.leather, true, .0012);
    mat.position.set(-1.85, FLOOR + .035, .94); g.add(mat);
    var matSeal = AM.decal(.48, .48, TEX.sealPaint, { opacity: .4, fog: false });
    matSeal.rotation.x = -Math.PI * .5; matSeal.position.set(-1.85, FLOOR + .052, .94); g.add(matSeal);
    // a small floor lamp in the corner for warmth
    var fl = new T.Group();
    var flBase = AM.cyl(.13, .17, .03, 12, M.steelDark, false); fl.add(flBase);
    var flStem = AM.cyl(.012, .016, .92, 6, M.brass, false); flStem.position.y = .48; fl.add(flStem);
    var flShade = new T.Mesh(new T.CylinderGeometry(.16, .10, .18, 12, 1, true), M.ceramic); flShade.position.y = .98; fl.add(flShade);
    var flBulb = AM.sphere(.045, 8, 6, AM.basic(0xffd3a0, { toneMapped: false }), false); flBulb.position.y = .94; fl.add(flBulb);
    var flGlow = AM.sprite(fl, TEX.glowWarm, 0xffbd7e, .6, .17); flGlow.position.y = .97;
    fl.position.set(-2.70, FLOOR + .02, 1.26);
    g.add(fl);
    // ceiling sprinkler line / small red pipe
    var spr = AM.cyl(.020, .020, 4.2, 6, M.redDark, false);
    spr.rotation.z = Math.PI * .5; spr.position.set(CX, FLOOR + 3.48, Z0 + .56); g.add(spr);
    for (var sp = 0; sp < 4; sp++) {
      var head = AM.cyl(.017, .024, .08, 6, M.brass, false);
      head.position.set(CX - 1.6 + sp * 1.05, FLOOR + 3.36, Z0 + .56); g.add(head);
    }
    // room label plaque above the inside of the door
    var insideSign = AM.decal(.54, .26, TEX.signControl, { opacity: .8, fog: false });
    insideSign.position.set(-1.85, FLOOR + 2.68, Z0 + .37); g.add(insideSign);
    // not a sign; a small overhead speaker
    var spk = AM.box(.18, .13, .12, M.blackPlastic, true, .0010);
    spk.position.set(-1.0, FLOOR + 3.1, -.6); g.add(spk);
    var spkL = AM.louver(g, .14, .08, .01, M.steelPale, .25);
    spkL.position.set(-1.0, FLOOR + 3.1, -.535);
    // scatter a few cigarette butts near the ashtray area
    var rnd = AM.rng(17);
    for (var c = 0; c < 4; c++) {
      var cig = AM.cyl(.006, .007, .06, 4, M.paper, false);
      cig.rotation.z = Math.PI * .5;
      cig.rotation.y = rnd() * 6.28;
      cig.position.set(-.4 + rnd() * .8, FLOOR + .018, -.5 + rnd() * .8);
      g.add(cig);
    }
    AM.dressing = g;
    AM.dressing.visible = true;
  }

  function updateInterior(dt, t) {
    if (AM.screenMats) {
      for (var i = 0; i < AM.screenMats.length; i++) {
        AM.screenMats[i].uniforms.uTime.value = t + i * .37;
      }
    }
    if (AM.sand) {
      AM.sand.surface.uniforms.uTime.value = t;
      AM.sand.pyramid.rotation.y = t * .16;
      AM.sand.pyramid.position.y = 1.58 + Math.sin(t * .55) * .025;
      AM.sand.rings[0].rotation.z = t * .12;
      AM.sand.rings[1].rotation.z = -t * .09;
      AM.sand.glowRing.rotation.z = t * .22;
      AM.sand.halo.material.opacity = .16 + .06 * (.5 + .5 * Math.sin(t * .8));
      AM.sand.underHalo.material.opacity = .18 + .05 * (.5 + .5 * Math.sin(t * 1.13 + 1.0));
      for (var s = 0; s < AM.sand.shards.length; s++) {
        var sh = AM.sand.shards[s];
        sh.position.y = 1.35 + s * .06 + Math.sin(t * .7 + s) * .035;
        sh.rotation.x = t * .2 + s; sh.rotation.y = t * .25 + s;
      }
    }
    if (AM.anomaly) {
      AM.anomaly.rotation.y = t * .45;
      AM.anomaly.rotation.x = Math.sin(t * .27) * .2;
    }
    for (var r = 0; r < AM.reels.length; r++) {
      var reel = AM.reels[r];
      reel.object.rotation.z += dt * reel.speed;
      if (AM.freezeTime !== null) reel.object.rotation.z = t * reel.speed;
    }
    if (AM.interiorFixtures) {
      for (var f = 0; f < AM.interiorFixtures.length; f++) {
        var fx = AM.interiorFixtures[f];
        var v = 1;
        var ph = AM.hash2(fx.seed, Math.floor(t * 9.0));
        if (ph > .976) v = .15 + .55 * AM.hash2(fx.seed + 4, Math.floor(t * 31.0));
        for (var m = 0; m < fx.mats.length; m++) {
          fx.mats[m].color.copy(fx.color).multiplyScalar(v);
        }
      }
    }
    if (AM.lights.monitor) {
      var fl = 1 + .08 * Math.sin(t * 1.7) + (AM.hash2(4, Math.floor(t * 12.0)) > .96 ? -.35 : 0);
      AM.lights.monitor.intensity = Math.max(.08, .18 * fl);
    }
    if (AM.screenMeshes) {
      for (var sm = 0; sm < AM.screenMeshes.length; sm++) {
        var sObj = AM.screenMeshes[sm];
        if (sObj.userData.screenGlow) {
          sObj.userData.screenGlow.material.opacity = .10 + .05 * (0.5 + 0.5 * Math.sin(t * (1.3 + sm * .07) + sm));
        }
      }
    }
    if (AM.roofFan) AM.roofFan.rotation.y = t * .6;
  }

  AM.buildInterior = function (scene) {
    M = AM.mats; TEX = AM.TEX;
    finishITex();
    root = new T.Group(); root.name = 'OBSERVATION_CONTROL';
    scene.add(root);
    buildPlatform();
    buildShell();
    buildFacade();
    buildRoof();
    buildInteriorFloor();
    buildMonitorBank();
    buildTapeWall();
    buildSandTable();
    buildConsole();
    buildChairs();
    buildArchiveCorner();
    buildRoomLights();
    buildInteriorDressing();
    AM.addUpdater(updateInterior);
    AM.interiorRoot = root;
    return root;
  };
})();
