/* =========================================================
   textures.js — all surface art is painted procedurally
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C;
  var Tex = TP.Tex = {};

  function tt(cv, opts) { return TP.texture(cv, opts || {}); }

  /* soft glow -------------------------------------------------- */
  Tex.glow = (function () {
    var done;
    return function () {
      if (done) return done;
      var cv = TP.canvas(256, 256), g = cv.getContext('2d');
      var grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(.10, 'rgba(255,255,255,.92)');
      grd.addColorStop(.30, 'rgba(255,255,255,.38)');
      grd.addColorStop(.62, 'rgba(255,255,255,.08)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
      done = tt(cv);
      return done;
    };
  })();

  /* soft haze / mist texture ---------------------------------- */
  Tex.smoke = (function () {
    var done;
    return function () {
      if (done) return done;
      var cv = TP.canvas(320, 320), g = cv.getContext('2d');
      var r = TP.rng(7331);
      g.clearRect(0, 0, 320, 320);
      for (var i = 0; i < 38; i++) {
        var x = 80 + r() * 160, y = 110 + r() * 100;
        var rad = 18 + r() * 72;
        var grd = g.createRadialGradient(x, y, 0, x, y, rad);
        var a = .045 + r() * .085;
        grd.addColorStop(0, 'rgba(220,236,230,' + a.toFixed(3) + ')');
        grd.addColorStop(.55, 'rgba(190,212,204,' + (a * .60).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(170,190,185,0)');
        g.fillStyle = grd;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // veil-like horizontal wisps
      g.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 14; j++) {
        var yy = 120 + r() * 80;
        var x2 = 10 + r() * 260;
        var grd2 = g.createRadialGradient(x2, yy, 0, x2, yy, 65 + r() * 40);
        grd2.addColorStop(0, 'rgba(200,224,218,.035)');
        grd2.addColorStop(1, 'rgba(200,224,218,0)');
        g.fillStyle = grd2;
        g.fillRect(0, yy - 50, 320, 100);
      }
      done = tt(cv);
      return done;
    };
  })();

  /* sycamore leaf card --------------------------------------- */
  Tex.leaf = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 256, cv = TP.canvas(S, S), g = cv.getContext('2d');
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S / 2 + 4);
      // five-lobed sycamore/maple-ish leaf
      g.beginPath();
      g.moveTo(0, 104);
      g.bezierCurveTo(-8, 70, -16, 50, -43, 52);
      g.bezierCurveTo(-82, 54, -105, 15, -72, -8);
      g.bezierCurveTo(-92, -42, -55, -77, -22, -56);
      g.bezierCurveTo(-16, -98, 20, -108, 34, -63);
      g.bezierCurveTo(67, -91, 103, -49, 72, -14);
      g.bezierCurveTo(115, 8, 88, 58, 46, 50);
      g.bezierCurveTo(23, 49, 12, 70, 8, 104);
      g.closePath();
      var grd = g.createLinearGradient(-70, -80, 80, 100);
      grd.addColorStop(0, '#c7d7b6');
      grd.addColorStop(.5, '#91ad8c');
      grd.addColorStop(1, '#4b6c58');
      g.fillStyle = grd; g.fill();
      g.lineWidth = 5; g.strokeStyle = 'rgba(31,55,43,.9)'; g.stroke();
      // veins
      g.strokeStyle = 'rgba(44,74,56,.72)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 95); g.lineTo(2, -50); g.stroke();
      var veins = [[-4, 18, -72, 4], [0, 26, 64, 2], [-2, -14, -48, -53], [-4, -30, 54, -52], [0, 56, -32, 58], [0, 52, 25, 70]];
      for (var i = 0; i < veins.length; i++) {
        g.beginPath(); g.moveTo(veins[i][0], veins[i][1]);
        g.quadraticCurveTo((veins[i][0] + veins[i][2]) * .5, (veins[i][1] + veins[i][3]) * .5 + 10, veins[i][2], veins[i][3]);
        g.stroke();
      }
      // speckled sycamore-leaf blight
      g.globalAlpha = .35;
      for (var k = 0; k < 12; k++) {
        g.fillStyle = '#7e5a35';
        g.beginPath();
        g.arc(-50 + Math.random() * 100, -60 + Math.random() * 120, 2 + Math.random() * 5, 0, 6.28);
        g.fill();
      }
      g.globalAlpha = 1;
      // stem
      g.strokeStyle = '#344b3a'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 95); g.lineTo(5, 128); g.stroke();
      done = tt(cv);
      return done;
    };
  })();

  /* fern card -------------------------------------------------- */
  Tex.fern = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(772);
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S - 26);
      var colors = ['#4f6e4d', '#68855d', '#395946', '#7e9668', '#2e4a3b'];
      for (var f = 0; f < 11; f++) {
        var ang = -Math.PI * .5 + (f / 10 - .5) * 1.85;
        var len = 160 + r() * 180;
        var bend = (r() - .5) * .35;
        var col = colors[(r() * colors.length) | 0];
        g.save();
        g.rotate(ang);
        g.strokeStyle = col; g.fillStyle = col;
        g.lineWidth = 2.4 + r() * 1.6;
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(bend * len, -len * .55, bend * len * .2, -len);
        g.stroke();
        // leaflets
        for (var i = 1; i < 16; i++) {
          var t = i / 16;
          var x = bend * len * t * (.6 + .4 * t);
          var y = -len * t;
          var ll = (1 - t) * (18 + r() * 13) + 3;
          g.lineWidth = 2 + (1 - t) * 2;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - ll, y + ll * .7); g.stroke();
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + ll, y + ll * .7); g.stroke();
          if (i % 3 === 0) {
            g.globalAlpha = .3;
            g.beginPath(); g.ellipse(x - ll * .55, y + ll * .4, ll * .42, ll * .16, .6, 0, 6.28); g.fill();
            g.beginPath(); g.ellipse(x + ll * .55, y + ll * .4, ll * .42, ll * .16, -.6, 0, 6.28); g.fill();
            g.globalAlpha = 1;
          }
        }
        g.restore();
      }
      done = tt(cv);
      return done;
    };
  })();

  /* grass tuft card ------------------------------------------- */
  Tex.grass = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 256, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(191);
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S - 8);
      var cols = ['#68805d', '#4d6a52', '#7d9068', '#394f40', '#899b74'];
      for (var i = 0; i < 48; i++) {
        var x = (r() - .5) * 190;
        var top = -50 - r() * 170;
        var w = 1.5 + r() * 3.4;
        var col = cols[(r() * cols.length) | 0];
        g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, 0);
        g.quadraticCurveTo(x + (r() - .5) * 42, top * .55, x + (r() - .5) * 75, top);
        g.stroke();
      }
      done = tt(cv);
      return done;
    };
  })();

  /* foliage skin ---------------------------------------------- */
  Tex.foliage = (function () {
    var d;
    return function () {
      if (d) return d;
      var S = 256, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(815);
      g.fillStyle = '#5f7463'; g.fillRect(0, 0, S, S);
      for (var i = 0; i < 180; i++) {
        var x = r() * S, y = r() * S, w = 3 + r() * 18, h = 2 + r() * 10;
        g.fillStyle = ['#435b49', '#6b806a', '#7d9277', '#364d3d', '#526b57'][(r() * 5) | 0];
        g.globalAlpha = .22 + r() * .4;
        g.beginPath(); g.ellipse(x, y, w, h, r() * 6.28, 0, 6.28); g.fill();
      }
      // fine leaf flecks
      for (var n = 0; n < 900; n++) {
        g.globalAlpha = .15 + r() * .35;
        g.fillStyle = r() > .45 ? '#9aab8f' : '#2c4235';
        g.beginPath(); g.ellipse(r() * S, r() * S, 1 + r() * 4, .5 + r() * 2, r() * 6.28, 0, 6.28); g.fill();
      }
      g.globalAlpha = 1;
      d = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      return d;
    };
  })();

  /* clustered leaf spray card --------------------------------- */
  Tex.leafSpray = (function () {
    var d;
    return function () {
      if (d) return d;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(1907);
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S / 2);
      // woody twig
      g.strokeStyle = 'rgba(87,74,48,.95)'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-8, 210); g.bezierCurveTo(4, 80, -15, -50, 8, -205); g.stroke();
      function leaf(x, y, len, ang, tint) {
        g.save(); g.translate(x, y); g.rotate(ang);
        g.beginPath();
        g.moveTo(0, len * .5);
        g.bezierCurveTo(-len * .55, len * .22, -len * .58, -len * .34, 0, -len * .5);
        g.bezierCurveTo(len * .58, -len * .34, len * .55, len * .22, 0, len * .5);
        g.closePath();
        var grd = g.createLinearGradient(0, -len * .5, 0, len * .5);
        grd.addColorStop(0, tint[0]); grd.addColorStop(.55, tint[1]); grd.addColorStop(1, tint[2]);
        g.fillStyle = grd; g.fill();
        g.lineWidth = 2.5; g.strokeStyle = 'rgba(34,58,41,.8)'; g.stroke();
        g.strokeStyle = 'rgba(42,70,49,.7)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, len * .40); g.lineTo(0, -len * .34); g.stroke();
        for (var v = -2; v <= 2; v++) {
          g.beginPath(); g.moveTo(0, v * len * .10); g.lineTo(v * len * .25, v * len * .10 + len * .15); g.stroke();
          g.beginPath(); g.moveTo(0, v * len * .10); g.lineTo(-v * len * .23, v * len * .10 + len * .13); g.stroke();
        }
        g.restore();
      }
      var tints = [
        ['#d4ddc5', '#91aa87', '#53715b'],
        ['#c2cfb5', '#7f9b77', '#4b6753'],
        ['#dde2cd', '#a7b99b', '#627b62'],
        ['#b8c9b0', '#78946f', '#3e5949']
      ];
      for (var i = 0; i < 7; i++) {
        var t = i / 6;
        var x = Math.sin(t * 5.0) * 92 + (r() - .5) * 45;
        var y = -175 + t * 340;
        var ang = (i % 2 ? 1 : -1) * (1.05 + r() * .4);
        leaf(x, y, 110 + r() * 55, ang, tints[(r() * tints.length) | 0]);
      }
      // little hanging leaflets
      for (var j = 0; j < 8; j++) {
        var x2 = (r() - .5) * 320, y2 = 120 + r() * 130;
        leaf(x2, y2, 45 + r() * 35, (r() - .5) * 2.6, tints[(r() * tints.length) | 0]);
      }
      d = tt(cv);
      return d;
    };
  })();

  /* sycamore bark --------------------------------------------- */
  Tex.bark = (function () {
    var done;
    return function () {
      if (done) return done;
      var W = 512, H = 1024, cv = TP.canvas(W, H), g = cv.getContext('2d');
      var r = TP.rng(9123);
      g.fillStyle = '#a8a692'; g.fillRect(0, 0, W, H);
      // mottled camouflage peeling bark
      var cols = ['#d9d4be', '#c4c1ab', '#8e9785', '#6d7d6c', '#b0a58e', '#7d8171', '#d4cdb5', '#596c5b'];
      for (var i = 0; i < 280; i++) {
        var x = r() * W, y = r() * H;
        var w = 18 + r() * 80, h = 24 + r() * 160;
        g.globalAlpha = .25 + r() * .55;
        g.fillStyle = cols[(r() * cols.length) | 0];
        g.beginPath();
        g.moveTo(x, y);
        for (var p = 0; p < 7; p++) {
          var a = p / 7 * Math.PI * 2;
          g.lineTo(x + Math.cos(a) * w * (.5 + r() * .5), y + Math.sin(a) * h * (.5 + r() * .5));
        }
        g.closePath(); g.fill();
      }
      // peeling strips / vertical cracks
      g.globalAlpha = .9;
      for (var k = 0; k < 58; k++) {
        var xx = r() * W, yy = r() * H, hh = 20 + r() * 170;
        g.strokeStyle = r() > .55 ? 'rgba(40,46,39,.55)' : 'rgba(225,218,196,.32)';
        g.lineWidth = 1 + r() * 5;
        g.beginPath(); g.moveTo(xx, yy);
        g.bezierCurveTo(xx + (r() - .5) * 18, yy + hh * .3, xx + (r() - .5) * 25, yy + hh * .7, xx + (r() - .5) * 16, yy + hh);
        g.stroke();
      }
      // damp base lichen
      var grd = g.createLinearGradient(0, H * .64, 0, H);
      grd.addColorStop(0, 'rgba(29,44,33,0)');
      grd.addColorStop(.6, 'rgba(39,56,39,.45)');
      grd.addColorStop(1, 'rgba(19,31,23,.88)');
      g.fillStyle = grd; g.fillRect(0, H * .6, W, H * .4);
      g.globalAlpha = .25;
      for (var m = 0; m < 180; m++) {
        g.fillStyle = r() > .5 ? '#6d8062' : '#3d593e';
        var mx = r() * W, my = H * .58 + r() * H * .42;
        g.beginPath(); g.arc(mx, my, 2 + r() * 16, 0, 6.28); g.fill();
      }
      // fine vertical grain
      g.globalAlpha = .10;
      for (var v = 0; v < 700; v++) {
        g.strokeStyle = '#e7e0cb';
        g.lineWidth = .6 + r() * 1.3;
        var vx = r() * W;
        g.beginPath(); g.moveTo(vx, r() * H); g.lineTo(vx + (r() - .5) * 7, r() * H); g.stroke();
      }
      // soften the mottling so the trunks read as sycamore, not zebra
      g.globalAlpha = .38;
      g.fillStyle = '#8e9184';
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      done = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping, repeat: [1, 1.0] });
      return done;
    };
  })();

  /* forest floor ---------------------------------------------- */
  Tex.ground = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 1024, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(4021);
      g.fillStyle = '#17231c'; g.fillRect(0, 0, S, S);
      // broad damp moss patches
      for (var i = 0; i < 180; i++) {
        var x = r() * S, y = r() * S, rad = 18 + r() * 150;
        var grd = g.createRadialGradient(x, y, 0, x, y, rad);
        var cols = ['rgba(49,73,52,.46)', 'rgba(36,57,43,.40)', 'rgba(71,68,43,.25)', 'rgba(16,26,19,.55)', 'rgba(85,79,48,.16)'];
        grd.addColorStop(0, cols[(r() * cols.length) | 0]);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // wet black mud patches
      for (var m = 0; m < 35; m++) {
        var mx = r() * S, my = r() * S, mr = 25 + r() * 105;
        var grd2 = g.createRadialGradient(mx, my, 0, mx, my, mr);
        grd2.addColorStop(0, 'rgba(7,12,10,.62)');
        grd2.addColorStop(.7, 'rgba(11,18,13,.22)');
        grd2.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd2; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      }
      // pine needles and leaf litter
      for (var n = 0; n < 3300; n++) {
        var lx = r() * S, ly = r() * S;
        var c = r();
        g.globalAlpha = .25 + r() * .55;
        if (c < .42) {
          g.strokeStyle = ['#725f3f', '#8a7046', '#51452f'][(r() * 3) | 0];
          g.lineWidth = .7 + r() * 1.6;
          g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 4 + r() * 15, ly + (r() - .5) * 7); g.stroke();
        } else if (c < .72) {
          g.fillStyle = ['#78905c', '#526e48', '#95a077', '#3f5d42'][(r() * 4) | 0];
          g.beginPath(); g.ellipse(lx, ly, 1 + r() * 6, .5 + r() * 2.6, r() * 6.28, 0, 6.28); g.fill();
        } else {
          g.fillStyle = ['#3c3528', '#61573f', '#272d23', '#9b8d68'][(r() * 4) | 0];
          g.beginPath(); g.arc(lx, ly, .5 + r() * 2.2, 0, 6.28); g.fill();
        }
      }
      // tiny wet glints
      g.globalAlpha = .14;
      for (var w = 0; w < 500; w++) {
        g.fillStyle = '#c4d7c3';
        g.beginPath(); g.arc(r() * S, r() * S, .5 + r() * 1.6, 0, 6.28); g.fill();
      }
      g.globalAlpha = 1;
      done = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping, repeat: [4, 4] });
      return done;
    };
  })();

  /* asphalt with roughness map -------------------------------- */
  Tex.asphalt = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var rc = TP.canvas(S, S), rg = rc.getContext('2d');
      var r = TP.rng(614);
      g.fillStyle = '#20272a'; g.fillRect(0, 0, S, S);
      rg.fillStyle = '#7d7d7d'; rg.fillRect(0, 0, S, S);
      // mottled damp patches
      for (var i = 0; i < 120; i++) {
        var x = r() * S, y = r() * S, rad = 8 + r() * 90;
        var grd = g.createRadialGradient(x, y, 0, x, y, rad);
        var dark = r() > .42;
        grd.addColorStop(0, dark ? 'rgba(6,10,12,.55)' : 'rgba(63,72,74,.27)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        var grd2 = rg.createRadialGradient(x, y, 0, x, y, rad);
        grd2.addColorStop(0, dark ? 'rgba(22,22,22,.8)' : 'rgba(200,200,200,.18)');
        grd2.addColorStop(1, 'rgba(128,128,128,0)');
        rg.fillStyle = grd2; rg.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // tire wear bands
      var band = g.createLinearGradient(0, 0, S, 0);
      band.addColorStop(0, 'rgba(70,78,79,0)');
      band.addColorStop(.16, 'rgba(12,18,20,.28)');
      band.addColorStop(.32, 'rgba(12,18,20,.05)');
      band.addColorStop(.48, 'rgba(78,86,86,.10)');
      band.addColorStop(.64, 'rgba(12,18,20,.20)');
      band.addColorStop(.82, 'rgba(8,13,15,.32)');
      band.addColorStop(1, 'rgba(60,68,70,0)');
      g.fillStyle = band; g.fillRect(0, 0, S, S);
      // aggregate
      for (var n = 0; n < 5200; n++) {
        g.fillStyle = 'rgba(' + (90 + r() * 80 | 0) + ',' + (95 + r() * 70 | 0) + ',' + (94 + r() * 65 | 0) + ',' + (.08 + r() * .24) + ')';
        g.fillRect(r() * S, r() * S, .6 + r() * 2, .6 + r() * 2);
      }
      // cracks
      g.strokeStyle = 'rgba(4,7,8,.62)'; g.lineWidth = 1.2;
      for (var c = 0; c < 22; c++) {
        var xx = r() * S, yy = r() * S;
        g.beginPath(); g.moveTo(xx, yy);
        for (var s = 0; s < 5; s++) {
          xx += (r() - .5) * 40; yy += 8 + r() * 35;
          g.lineTo(xx, yy);
        }
        g.stroke();
      }
      // puddle fills: smooth in roughness, darker in color
      var wet = [[.22, .64, .14], [.72, .3, .11], [.5, .85, .17], [.87, .69, .09]];
      for (var w = 0; w < wet.length; w++) {
        var px = wet[w][0] * S, py = wet[w][1] * S, pr = wet[w][2] * S;
        var pg = g.createRadialGradient(px, py, 0, px, py, pr);
        pg.addColorStop(0, 'rgba(4,9,11,.72)');
        pg.addColorStop(.7, 'rgba(6,12,14,.33)');
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = pg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
        var rr = rg.createRadialGradient(px, py, 0, px, py, pr);
        rr.addColorStop(0, 'rgba(10,10,10,.9)');
        rr.addColorStop(.6, 'rgba(70,70,70,.4)');
        rr.addColorStop(1, 'rgba(125,125,125,0)');
        rg.fillStyle = rr; rg.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      // one long wet streak
      var street = g.createLinearGradient(0, 0, 0, S);
      street.addColorStop(0, 'rgba(80,90,90,0)');
      street.addColorStop(.2, 'rgba(10,16,18,.1)');
      street.addColorStop(.5, 'rgba(5,10,12,.32)');
      street.addColorStop(.8, 'rgba(10,16,18,.1)');
      street.addColorStop(1, 'rgba(80,90,90,0)');
      g.fillStyle = street; g.fillRect(0, 0, S, S);
      var map = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      var rough = tt(rc, { linear: true, wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      done = { map: map, rough: rough };
      return done;
    };
  })();

  /* churned mud path ------------------------------------------ */
  Tex.mud = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(5115);
      g.fillStyle = '#2b241a'; g.fillRect(0, 0, S, S);
      for (var i = 0; i < 160; i++) {
        var x = r() * S, y = r() * S, rad = 8 + r() * 60;
        var grd = g.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, r() > .5 ? 'rgba(80,66,45,.36)' : 'rgba(13,17,12,.44)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // boot / hoof marks
      for (var f = 0; f < 18; f++) {
        var fx = r() * S, fy = r() * S;
        g.save(); g.translate(fx, fy); g.rotate((r() - .5) * .8);
        g.fillStyle = 'rgba(10,12,9,.24)';
        g.beginPath(); g.ellipse(0, 0, 7 + r() * 4, 17 + r() * 8, 0, 0, 6.28); g.fill();
        g.restore();
      }
      for (var n = 0; n < 1300; n++) {
        g.fillStyle = 'rgba(' + (35 + r() * 80 | 0) + ',' + (30 + r() * 65 | 0) + ',' + (18 + r() * 40 | 0) + ',' + (.2 + r() * .4) + ')';
        g.fillRect(r() * S, r() * S, .8 + r() * 4, .8 + r() * 4);
      }
      done = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      return done;
    };
  })();

  /* chevron floor --------------------------------------------- */
  Tex.chevron = (function () {
    var done;
    return function () {
      if (done) return done;
      var S = 1024, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(1989);
      g.fillStyle = '#151619'; g.fillRect(0, 0, S, S);
      // continuous zigzag ribbons covering the whole parquet
      var period = 248, amp = 46, spacing = 82, thick = 84;
      for (var band = -2; band < 16; band++) {
        var y0 = band * spacing - 18;
        var dark = (band % 2 === 0);
        g.strokeStyle = dark ? '#111216' : '#e9e3d3';
        g.lineWidth = thick;
        g.lineJoin = 'miter';
        g.lineCap = 'butt';
        g.beginPath();
        g.moveTo(-90, y0 + amp);
        var x = -90, up = false;
        while (x < S + 90) {
          x += period / 2;
          var y = up ? y0 + amp : y0 - amp;
          g.lineTo(x, y);
          up = !up;
        }
        g.stroke();
        // painted border / bevel
        g.strokeStyle = dark ? 'rgba(206,198,177,.20)' : 'rgba(26,24,23,.28)';
        g.lineWidth = 2;
        g.stroke();
      }
      // subtle floor grain and scuffs
      g.globalAlpha = .13;
      for (var n = 0; n < 3500; n++) {
        g.fillStyle = r() > .5 ? '#1b1a18' : '#fffaf0';
        g.fillRect(r() * S, r() * S, .5 + r() * 3, .5 + r() * 3);
      }
      g.globalAlpha = .12;
      for (var sc = 0; sc < 40; sc++) {
        g.strokeStyle = '#0b0c0d'; g.lineWidth = .7 + r() * 2;
        var x1 = r() * S, y1 = r() * S;
        g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(x1 + 30, y1 + 15, x1 + 70 + r() * 70, y1 + (r() - .5) * 40); g.stroke();
      }
      // long glossy reflections
      g.globalAlpha = .09;
      for (var gl = 0; gl < 15; gl++) {
        var gx = r() * S;
        var grd = g.createLinearGradient(gx, 0, gx + 40, S);
        grd.addColorStop(0, 'rgba(255,245,220,0)');
        grd.addColorStop(.4, 'rgba(255,245,220,.8)');
        grd.addColorStop(1, 'rgba(255,245,220,0)');
        g.fillStyle = grd; g.fillRect(gx, 0, 20 + r() * 90, S);
      }
      g.globalAlpha = 1;
      done = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      return done;
    };
  })();

  /* velvet ---------------------------------------------------- */
  function velvetTexture(seed, deep) {
    var W = 512, H = 1024, cv = TP.canvas(W, H), g = cv.getContext('2d');
    var r = TP.rng(seed);
    g.fillStyle = deep ? '#2b0308' : '#3a0710'; g.fillRect(0, 0, W, H);
    // broad woven vertical folds
    for (var i = 0; i < 22; i++) {
      var x = r() * W, w = 12 + r() * 75;
      var grd = g.createLinearGradient(x - w, 0, x + w, 0);
      grd.addColorStop(0, 'rgba(5,0,2,0)');
      grd.addColorStop(.32, 'rgba(10,0,2,.34)');
      grd.addColorStop(.5, 'rgba(170,35,48,' + (.06 + r() * .15) + ')');
      grd.addColorStop(.68, 'rgba(8,0,2,.36)');
      grd.addColorStop(1, 'rgba(5,0,2,0)');
      g.fillStyle = grd; g.fillRect(x - w, 0, w * 2, H);
    }
    // fine velvet pile
    for (var n = 0; n < 16000; n++) {
      var c = r();
      g.strokeStyle = c > .58 ? 'rgba(205,80,85,.10)' : c > .26 ? 'rgba(27,0,4,.16)' : 'rgba(118,22,31,.12)';
      var x2 = r() * W, y2 = r() * H;
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + (r() - .5) * 2, y2 + 1 + r() * 4); g.stroke();
    }
    // subtle sheen bands
    for (var s = 0; s < 7; s++) {
      var gx = r() * W;
      var grd2 = g.createLinearGradient(gx, 0, gx + 35, 0);
      grd2.addColorStop(0, 'rgba(255,150,140,0)');
      grd2.addColorStop(.5, 'rgba(255,150,140,.055)');
      grd2.addColorStop(1, 'rgba(255,150,140,0)');
      g.fillStyle = grd2; g.fillRect(gx, 0, 35, H);
    }
    return tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
  }
  Tex.velvet = (function () { var done; return function () { return done || (done = velvetTexture(831, false)); }; })();
  Tex.velvetDeep = (function () { var done; return function () { return done || (done = velvetTexture(555, true)); }; })();

  /* marble ---------------------------------------------------- */
  function marbleTexture(seed, dark, goldVein) {
    var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
    var r = TP.rng(seed);
    if (dark) {
      g.fillStyle = '#090c0d'; g.fillRect(0, 0, S, S);
    } else {
      var bg = g.createLinearGradient(0, 0, S, S);
      bg.addColorStop(0, '#e3ded2');
      bg.addColorStop(.55, '#f0eadc');
      bg.addColorStop(1, '#d9d3c6');
      g.fillStyle = bg; g.fillRect(0, 0, S, S);
    }
    // soft cloudy shadows
    for (var c = 0; c < 30; c++) {
      var cx = r() * S, cy = r() * S, cr = 20 + r() * 130;
      var cg = g.createRadialGradient(cx, cy, 0, cx, cy, cr);
      cg.addColorStop(0, dark ? 'rgba(62,68,67,.12)' : 'rgba(138,135,126,.12)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cg; g.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
    }
    // meandering veins
    for (var i = 0; i < (dark ? 15 : 20); i++) {
      var x = r() * S, y = -30;
      g.strokeStyle = goldVein ? 'rgba(188,144,76,' + (.10 + r() * .25) + ')' : (dark ? 'rgba(152,164,159,' + (.07 + r() * .15) + ')' : 'rgba(103,103,96,' + (.08 + r() * .20) + ')');
      g.lineWidth = .6 + r() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      while (y < S + 20) {
        x += (r() - .5) * 50; y += 20 + r() * 60;
        g.quadraticCurveTo(x + (r() - .5) * 40, y - 30, x, y);
      }
      g.stroke();
      // thin branch
      g.strokeStyle = goldVein ? 'rgba(234,190,117,.10)' : 'rgba(230,225,211,.11)';
      g.lineWidth = .5 + r();
      g.beginPath(); g.moveTo(x, y * .5); g.lineTo(x + (r() - .5) * 180, y * .5 + 100); g.stroke();
    }
    return tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
  }
  Tex.marbleWhite = (function () { var d; return function () { return d || (d = marbleTexture(44, false, false)); }; })();
  Tex.marbleBlack = (function () { var d; return function () { return d || (d = marbleTexture(47, true, true)); }; })();

  /* wood ------------------------------------------------------ */
  function woodTexture(seed, dark, horizontal) {
    var W = 512, H = 512, cv = TP.canvas(W, H), g = cv.getContext('2d');
    var r = TP.rng(seed);
    g.fillStyle = dark ? '#1e1712' : '#4d3825'; g.fillRect(0, 0, W, H);
    var plank = 64;
    for (var p = 0; p < H / plank; p++) {
      var y = p * plank;
      g.fillStyle = dark ? ['#241b15', '#1d1611', '#2b2018', '#17110d'][(r() * 4) | 0] : ['#5b422b', '#4a3422', '#6a4c30', '#3d2b1b'][(r() * 4) | 0];
      g.fillRect(0, y, W, plank - 1);
      g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(0, y + plank - 2, W, 2);
      // grain
      for (var n = 0; n < 28; n++) {
        g.strokeStyle = dark ? 'rgba(5,3,2,.32)' : 'rgba(25,15,8,.24)';
        g.lineWidth = .5 + r() * 1.5;
        var yy = y + r() * plank;
        g.beginPath(); g.moveTo(0, yy);
        g.bezierCurveTo(W * .3, yy + (r() - .5) * 8, W * .6, yy + (r() - .5) * 12, W, yy + (r() - .5) * 5);
        g.stroke();
      }
      if (r() > .54) {
        var kx = r() * W, ky = y + plank * .5;
        g.strokeStyle = dark ? 'rgba(0,0,0,.52)' : 'rgba(19,10,5,.45)';
        g.lineWidth = 1.2;
        for (var kk = 1; kk < 4; kk++) {
          g.beginPath(); g.ellipse(kx, ky, 6 + kk * 5, 3 + kk * 2.4, (r() - .5) * .3, 0, 6.28); g.stroke();
        }
      }
    }
    // damp stains and worn edges
    for (var s = 0; s < 20; s++) {
      var x = r() * W, yy2 = r() * H;
      var cg = g.createRadialGradient(x, yy2, 0, x, yy2, 20 + r() * 90);
      cg.addColorStop(0, 'rgba(8,12,9,.25)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cg; g.fillRect(x - 100, yy2 - 100, 200, 200);
    }
    if (horizontal) {
      var out = TP.canvas(H, W);
      out.getContext('2d').drawImage(cv, 0, 0);
      var tmp = TP.canvas(W, H);
      var tg = tmp.getContext('2d');
      tg.translate(W, 0); tg.rotate(Math.PI / 2); tg.drawImage(cv, 0, 0); 
      cv = tmp;
    }
    return tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
  }
  Tex.woodDark = (function () { var d; return function () { return d || (d = woodTexture(132, true, false)); }; })();
  Tex.woodLight = (function () { var d; return function () { return d || (d = woodTexture(135, false, false)); }; })();

  /* grove sign ------------------------------------------------ */
  Tex.sign = (function () {
    var d;
    return function () {
      if (d) return d;
      var W = 1024, H = 512, cv = TP.canvas(W, H), g = cv.getContext('2d');
      var r = TP.rng(1962);
      g.fillStyle = '#3c3023'; g.fillRect(0, 0, W, H);
      // planks
      for (var p = 0; p < 4; p++) {
        var y = p * H / 4;
        g.fillStyle = ['#59442f', '#4d3a27', '#604832', '#452f20'][p];
        g.fillRect(0, y, W, H / 4 - 5);
        g.fillStyle = 'rgba(9,7,4,.65)'; g.fillRect(0, y + H / 4 - 5, W, 5);
        for (var n = 0; n < 60; n++) {
          g.strokeStyle = 'rgba(18,11,5,.2)'; g.lineWidth = .5 + r() * 1.8;
          var yy = y + r() * H / 4;
          g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(W * .35, yy + (r() - .5) * 16, W * .7, yy + (r() - .5) * 20, W, yy + (r() - .5) * 6); g.stroke();
        }
      }
      // border / nails
      g.strokeStyle = 'rgba(208,190,152,.16)'; g.lineWidth = 8; g.strokeRect(20, 20, W - 40, H - 40);
      g.fillStyle = 'rgba(23,14,8,.8)';
      for (var q = 0; q < 4; q++) {
        g.beginPath(); g.arc(42 + q % 2 * (W - 84), 42 + Math.floor(q / 2) * (H - 84), 9, 0, 6.28); g.fill();
      }
      // lettering
      g.save();
      g.translate(W / 2, 245);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(228,215,184,.95)';
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3;
      g.font = '700 118px Georgia, "Times New Roman", serif';
      g.fillText('GLASTONBURY', 0, -68);
      g.font = '700 152px Georgia, "Times New Roman", serif';
      g.fillText('GROVE', 0, 76);
      g.font = '28px Georgia, "Times New Roman", serif';
      g.fillStyle = 'rgba(219,203,171,.86)';
      g.fillText('T W I N   P E A K S   ·   W A S H I N G T O N', 0, 169);
      g.restore();
      // weathering scratches over lettering
      g.globalCompositeOperation = 'destination-out';
      for (var s = 0; s < 150; s++) {
        g.globalAlpha = .10 + r() * .35;
        g.fillStyle = 'rgba(0,0,0,1)';
        g.fillRect(r() * W, r() * H, .5 + r() * 2.5, 1 + r() * 13);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      // dark grime
      var grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(4,7,5,.45)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      d = tt(cv);
      return d;
    };
  })();

  /* clippings ------------------------------------------------- */
  function makeClipping(seed, headline, tag) {
    var W = 384, H = 512, cv = TP.canvas(W, H), g = cv.getContext('2d');
    var r = TP.rng(seed);
    g.fillStyle = '#cdbb96'; g.fillRect(0, 0, W, H);
    // aged paper stains
    for (var i = 0; i < 70; i++) {
      var x = r() * W, y = r() * H, rad = 3 + r() * 55;
      var grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, 'rgba(114,84,48,.10)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.strokeStyle = 'rgba(58,44,30,.36)'; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28);
    g.fillStyle = '#2b2118';
    g.textAlign = 'center';
    g.font = '700 17px "Times New Roman", Georgia, serif';
    g.fillText('THE TWIN PEAKS GAZETTE', W / 2, 48);
    g.font = '11px "Times New Roman", serif';
    g.fillText('WEDNESDAY, FEBRUARY 26, 1989   ·   TEN CENTS', W / 2, 68);
    g.strokeStyle = 'rgba(46,34,23,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(20, 80); g.lineTo(W - 20, 80); g.stroke();
    g.font = '900 48px Georgia, "Times New Roman", serif';
    g.fillStyle = '#181410';
    g.fillText(headline, W / 2, 138);
    g.font = 'italic 17px "Times New Roman", serif';
    g.fillStyle = 'rgba(32,25,18,.88)';
    g.fillText(tag, W / 2, 165);
    // halftone portrait
    g.save();
    g.beginPath(); g.ellipse(W / 2, 272, 85, 104, 0, 0, 6.28); g.clip();
    g.fillStyle = '#898274'; g.fillRect(W / 2 - 90, 164, 180, 210);
    var hg = g.createRadialGradient(W / 2 - 20, 230, 10, W / 2, 260, 105);
    hg.addColorStop(0, '#3c3b36'); hg.addColorStop(.55, '#6c685d'); hg.addColorStop(1, '#24231f');
    g.fillStyle = hg; g.beginPath(); g.ellipse(W / 2, 258, 57, 76, 0, 0, 6.28); g.fill();
    // shoulders and hair
    g.fillStyle = '#23211d'; g.beginPath(); g.ellipse(W / 2, 352, 120, 74, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#292722'; g.beginPath(); g.ellipse(W / 2, 216, 70, 52, 0, Math.PI, 0); g.fill();
    // highlight face
    g.fillStyle = '#a39b88'; g.beginPath(); g.ellipse(W / 2, 271, 38, 56, 0, 0, 6.28); g.fill();
    g.fillStyle = '#20201c'; g.beginPath(); g.arc(W / 2 - 16, 260, 3.2, 0, 6.28); g.arc(W / 2 + 16, 260, 3.2, 0, 6.28); g.fill();
    // scanlines
    g.globalAlpha = .15;
    for (var sy = 160; sy < 380; sy += 4) { g.fillStyle = '#1c1c18'; g.fillRect(W / 2 - 90, sy, 180, 1); }
    g.restore();
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(30,23,16,.7)'; g.lineWidth = 1; g.beginPath(); g.ellipse(W / 2, 272, 85, 104, 0, 0, 6.28); g.stroke();
    g.fillStyle = '#211b14';
    g.font = '11.5px "Times New Roman", serif'; g.textAlign = 'left';
    var paras = [
      'A routine evening at the Great',
      'Northern Hotel ended in silence.',
      'The room was found empty. A cup',
      'of black coffee was still warm.',
      'Investigators report no signs of a',
      'struggle. The forest keeps what it',
      'takes, said a local resident.'
    ];
    for (var p = 0; p < paras.length; p++) g.fillText(paras[p], 30, 404 + p * 17);
    g.textAlign = 'center';
    g.font = '700 12px "Times New Roman", serif';
    g.fillStyle = 'rgba(53,38,23,.75)';
    g.fillText('— CONTINUED ON PAGE 4 —', W / 2, 492);
    // torn edge
    g.globalCompositeOperation = 'destination-out';
    for (var t = 0; t < 26; t++) {
      var tx = (t / 25) * W;
      g.beginPath(); g.arc(tx, H, 5 + r() * 15, 0, 6.28); g.fill();
    }
    return tt(cv);
  }
  Tex.clippings = (function () {
    var d;
    return function () {
      if (!d) d = [
        makeClipping(2017, 'MISSING', 'NO TRACE OF AGENT AFTER LAST CALL'),
        makeClipping(1989, 'THE ROOM', 'A NIGHT NOBODY CAN EXPLAIN'),
        makeClipping(1962, 'THE OWLS', 'WOODS HOLD THEIR SECRETS CLOSE')
      ];
      return d;
    };
  })();

  /* owl cave petroglyph --------------------------------------- */
  Tex.owlCave = (function () {
    var d;
    return function () {
      if (d) return d;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(1313);
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S / 2);
      g.strokeStyle = 'rgba(209,174,113,.95)';
      g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
      g.shadowColor = 'rgba(255,187,111,.28)'; g.shadowBlur = 12;
      // outer carved circle
      g.beginPath(); g.arc(0, 0, 196, 0, 6.28); g.stroke();
      // owl face
      g.beginPath(); g.arc(-68, -60, 62, 0, 6.28); g.stroke();
      g.beginPath(); g.arc(68, -60, 62, 0, 6.28); g.stroke();
      g.beginPath(); g.moveTo(-50, 2); g.lineTo(0, 58); g.lineTo(50, 2); g.stroke();
      g.beginPath(); g.moveTo(-10, 62); g.lineTo(0, 92); g.lineTo(10, 62); g.stroke();
      // brow / sigil
      g.lineWidth = 7;
      g.beginPath(); g.moveTo(-170, -55); g.quadraticCurveTo(-125, -145, -68, -143); g.quadraticCurveTo(-15, -142, 0, -190); g.quadraticCurveTo(15, -142, 68, -143); g.quadraticCurveTo(125, -145, 170, -55); g.stroke();
      // feather wings
      for (var s = -1; s <= 1; s += 2) {
        for (var i = 0; i < 4; i++) {
          g.lineWidth = 5;
          g.beginPath();
          g.moveTo(s * (60 + i * 14), 95 + i * 4);
          g.quadraticCurveTo(s * (130 + i * 22), 130 + i * 14, s * (168 + i * 6), 66 + i * 6);
          g.stroke();
        }
      }
      // small satellite nodes
      g.lineWidth = 5;
      g.beginPath(); g.arc(-142, 126, 18, 0, 6.28); g.stroke();
      g.beginPath(); g.arc(142, 126, 18, 0, 6.28); g.stroke();
      // chipped spots
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(245,205,146,.4)';
      for (var n = 0; n < 22; n++) {
        var a = r() * 6.28, rr = 100 + r() * 110;
        g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1 + r() * 4, 0, 6.28); g.stroke();
      }
      d = tt(cv);
      return d;
    };
  })();

  /* clock face ------------------------------------------------ */
  Tex.clock = (function () {
    var d;
    return function () {
      if (d) return d;
      var S = 512, cv = TP.canvas(S, S), g = cv.getContext('2d');
      var r = TP.rng(810);
      g.clearRect(0, 0, S, S);
      g.translate(S / 2, S / 2);
      var bg = g.createRadialGradient(-30, -30, 20, 0, 0, 245);
      bg.addColorStop(0, '#f0e7d1'); bg.addColorStop(.7, '#d6c7a8'); bg.addColorStop(1, '#b5a384');
      g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 242, 0, 6.28); g.fill();
      g.strokeStyle = '#5e4529'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 238, 0, 6.28); g.stroke();
      g.strokeStyle = 'rgba(92,68,42,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 218, 0, 6.28); g.stroke();
      // minute ticks
      for (var i = 0; i < 60; i++) {
        var a = i / 60 * Math.PI * 2;
        var r1 = i % 5 === 0 ? 196 : 210;
        var r2 = 225;
        g.strokeStyle = i % 5 === 0 ? '#3e3325' : 'rgba(62,51,37,.64)';
        g.lineWidth = i % 5 === 0 ? 5 : 2;
        g.beginPath(); g.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2); g.stroke();
      }
      // roman numerals
      var nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      g.fillStyle = '#332b20'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (var n = 0; n < 12; n++) {
        var ang = n / 12 * Math.PI * 2;
        g.save(); g.rotate(ang);
        g.font = '700 ' + (n % 3 === 0 ? 40 : 33) + 'px Georgia, "Times New Roman", serif';
        g.fillText(nums[n], 0, -166);
        g.restore();
      }
      // brand and aged stains
      g.fillStyle = 'rgba(67,50,31,.75)'; g.font = 'italic 23px Georgia, serif'; g.fillText('Twin Peaks', 0, 53);
      g.font = '11px "Arial Narrow", sans-serif'; g.fillText('LODGE TIME', 0, 74);
      for (var s = 0; s < 24; s++) {
        var rr = 40 + r() * 170, aa = r() * 6.28;
        g.fillStyle = 'rgba(90,66,37,' + (.02 + r() * .08) + ')';
        g.beginPath(); g.arc(Math.cos(aa) * rr, Math.sin(aa) * rr, 2 + r() * 14, 0, 6.28); g.fill();
      }
      for (var c = 0; c < 8; c++) {
        g.strokeStyle = 'rgba(73,51,28,.12)'; g.lineWidth = 1;
        var x0 = (r() - .5) * 300, y0 = (r() - .5) * 300;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 30, y0 + 20, x0 + 80 + r() * 70, y0 + (r() - .5) * 90); g.stroke();
      }
      d = tt(cv);
      return d;
    };
  })();

  /* police tape ----------------------------------------------- */
  Tex.tape = (function () {
    var d;
    return function () {
      if (d) return d;
      var W = 1024, H = 128, cv = TP.canvas(W, H), g = cv.getContext('2d');
      var r = TP.rng(901);
      g.fillStyle = '#d3a627'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(76,56,10,.92)';
      g.font = '900 52px "Arial Narrow", Impact, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('POLICE LINE', W / 2, H / 2 - 2);
      g.font = '20px "Arial Narrow", sans-serif';
      g.fillText('DO  NOT  CROSS', W / 2, H - 23);
      // crease / wear
      g.globalAlpha = .18;
      for (var i = 0; i < 60; i++) {
        g.fillStyle = r() > .5 ? '#5f4e17' : '#f4e8b5';
        g.fillRect(r() * W, r() * H, 1 + r() * 30, 1 + r() * 3);
      }
      g.globalAlpha = .2;
      for (var c = 0; c < 8; c++) {
        g.strokeStyle = '#5e4914'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(r() * W, 0); g.lineTo(r() * W, H); g.stroke();
      }
      g.globalAlpha = 1;
      d = tt(cv, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
      return d;
    };
  })();

  /* plinth plaque --------------------------------------------- */
  Tex.plaque = (function () {
    var d;
    return function () {
      if (d) return d;
      var W = 512, H = 190, cv = TP.canvas(W, H), g = cv.getContext('2d');
      g.fillStyle = '#151311'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(201,163,96,.7)'; g.lineWidth = 4; g.strokeRect(9, 9, W - 18, H - 18);
      g.strokeStyle = 'rgba(201,163,96,.25)'; g.lineWidth = 1; g.strokeRect(17, 17, W - 34, H - 34);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(222,190,128,.92)';
      g.font = '700 31px Georgia, serif';
      g.fillText('GLASTONBURY GROVE', W / 2, 69);
      g.font = '14px "Arial Narrow", sans-serif';
      g.fillStyle = 'rgba(194,161,105,.78)';
      g.fillText('T H E   R E D   R O O M   ·   T W I N   P E A K S', W / 2, 108);
      g.font = '10px "Arial Narrow", sans-serif';
      g.fillStyle = 'rgba(150,125,82,.55)';
      g.fillText('NIGHT STUDY  /  NO. 12', W / 2, 140);
      // brass aging
      var r = TP.rng(57);
      for (var i = 0; i < 70; i++) {
        g.fillStyle = 'rgba(' + (120 + r() * 80 | 0) + ',' + (90 + r() * 60 | 0) + ',' + (40 + r() * 30 | 0) + ',' + (r() * .07) + ')';
        g.fillRect(r() * W, r() * H, 1 + r() * 14, 1 + r() * 8);
      }
      d = tt(cv);
      return d;
    };
  })();

  /* small paper litter --------------------------------------- */
  Tex.paperScrap = (function () {
    var d;
    return function () {
      if (d) return d;
      var W = 256, H = 320, cv = TP.canvas(W, H), g = cv.getContext('2d');
      var r = TP.rng(33);
      g.fillStyle = '#b8a884'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(50,38,24,.6)'; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28);
      g.fillStyle = '#33281d'; g.textAlign = 'center';
      g.font = '700 30px Georgia, serif'; g.fillText('MISSING', W / 2, 60);
      g.fillStyle = 'rgba(72,57,40,.4)'; g.fillRect(36, 85, W - 72, 145);
      g.strokeStyle = 'rgba(50,38,24,.4)';
      for (var i = 0; i < 8; i++) { g.beginPath(); g.moveTo(34, 250 + i * 7); g.lineTo(W - 34, 250 + i * 7); g.stroke(); }
      for (var s = 0; s < 50; s++) { g.fillStyle = 'rgba(80,60,34,.1)'; g.fillRect(r() * W, r() * H, 1 + r() * 20, 1 + r() * 10); }
      d = tt(cv);
      return d;
    };
  })();
})();
