/* =========================================================
   textures.js — every surface is painted at runtime
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP;
  var Tex = (QP.Tex = {});
  var CJK = '"Microsoft JhengHei","PMingLiU","MingLiU","Microsoft YaHei","SimSun",serif';
  var CJK_SERIF = '"PMingLiU","MingLiU","SimSun","Microsoft JhengHei",serif';
  Tex.font = CJK;

  function cv(w, h) { return QP.canvas(w, h); }
  function ctx(c) { return c.getContext('2d'); }
  function noise(g, w, h, alpha, seed) {
    var r = QP.rng(seed || 7);
    g.globalAlpha = alpha === undefined ? 0.08 : alpha;
    for (var i = 0; i < w * h * 0.045; i++) {
      var v = (r() * 50) | 0;
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      g.fillRect((r() * w) | 0, (r() * h) | 0, 1 + r() * 2, 1 + r() * 2);
    }
    g.globalAlpha = 1;
  }
  function rounded(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function stars(g, w, h, n, color, maxR, seed) {
    var r = QP.rng(seed || 3);
    g.fillStyle = color;
    for (var i = 0; i < n; i++) {
      g.globalAlpha = 0.12 + r() * 0.4;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.4 + r() * maxR, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  function tex(c, opts) {
    opts = opts || {};
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = opts.wrap || T.RepeatWrapping;
    t.anisotropy = opts.aniso || 8;
    t.encoding = opts.srgb === false ? T.LinearEncoding : T.sRGBEncoding;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    t.needsUpdate = true;
    return t;
  }
  Tex.tex = tex;

  /* ---------------- bricks ---------------- */
  var brickCache = null;
  Tex.brick = function () {
    if (brickCache) return brickCache;
    var W = 512, H = 512;
    var c = cv(W, H), g = ctx(c);
    var b = cv(W, H), gb = ctx(b);
    var r = QP.rng(41);
    g.fillStyle = '#241817'; g.fillRect(0, 0, W, H);
    gb.fillStyle = '#181616'; gb.fillRect(0, 0, W, H);
    var rows = 11, bh = H / rows, bw = W / 5.0;
    for (var y = 0; y < rows; y++) {
      var off = (y % 2) * bw * 0.5;
      for (var i = -1; i < 6; i++) {
        var x = i * bw + off + r() * 5;
        var w = bw - 6 - r() * 8;
        var h = bh - 5;
        var rr = 78 + r() * 44, gg = 40 + r() * 22, bb = 34 + r() * 18;
        var wet = r() < 0.26;
        if (wet) { rr *= 0.68; gg *= 0.72; bb *= 0.78; }
        g.fillStyle = 'rgb(' + (rr | 0) + ',' + (gg | 0) + ',' + (bb | 0) + ')';
        rounded(g, x, y * bh + 3, w, h, 2.5); g.fill();
        g.fillStyle = 'rgba(255,170,128,' + (0.035 + r() * 0.07) + ')';
        g.fillRect(x + 3, y * bh + 4, w - 6, 2);
        g.fillStyle = 'rgba(20,12,12,.22)';
        g.fillRect(x + 3, y * bh + h - 1, w - 6, 3);
        if (r() < 0.22) {
          g.fillStyle = 'rgba(30,34,26,.22)';
          g.beginPath(); g.ellipse(x + w * r(), y * bh + h * r(), 6 + r() * 18, 2 + r() * 7, r() * 3, 0, 6.3); g.fill();
        }
        var bv = 115 + r() * 75;
        gb.fillStyle = 'rgb(' + (bv | 0) + ',' + (bv | 0) + ',' + (bv | 0) + ')';
        rounded(gb, x, y * bh + 3, w, h, 2.5); gb.fill();
      }
    }
    noise(g, W, H, 0.06, 8);
    noise(gb, W, H, 0.16, 9);
    var map = tex(c, { repeat: [1, 1] });
    var bump = tex(b, { srgb: false });
    brickCache = { map: map, bump: bump, canvas: c };
    return brickCache;
  };

  /* ---------------- stone / cobbles ---------------- */
  var cobbleCache = null;
  Tex.cobble = function () {
    if (cobbleCache) return cobbleCache;
    var W = 768, H = 768;
    var c = cv(W, H), g = ctx(c);
    var b = cv(W, H), gb = ctx(b);
    var r = QP.rng(103);
    g.fillStyle = '#20242a'; g.fillRect(0, 0, W, H);
    gb.fillStyle = '#141414'; gb.fillRect(0, 0, W, H);
    var rows = 15, sw = W / 9.5, sh = H / rows;
    for (var row = -1; row <= rows + 1; row++) {
      var off = (row % 2) * sw * 0.52;
      for (var i = -1; i < 11; i++) {
        var x = i * sw + off + (r() - 0.5) * 9;
        var y = row * sh + (r() - 0.5) * 5;
        var w = sw - 6 - r() * 8, h = sh - 6 - r() * 5;
        var g0 = 62 + r() * 24;
        var warm = r() < 0.20 ? 12 : 0;
        g.fillStyle = 'rgb(' + ((g0 + warm * 1.7) | 0) + ',' + ((g0 + warm) | 0) + ',' + ((g0 + 1) | 0) + ')';
        rounded(g, x, y, w, h, 5 + r() * 5); g.fill();
        g.strokeStyle = 'rgba(170,185,194,' + (0.16 + r() * 0.18) + ')';
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(x + 4, y + 3); g.lineTo(x + w - 5, y + 3); g.stroke();
        g.fillStyle = 'rgba(8,11,14,' + (0.24 + r() * 0.24) + ')';
        g.fillRect(x + 3, y + h - 3, w - 5, 3);
        g.fillStyle = 'rgba(190,205,210,.05)';
        if (r() < 0.5) g.fillRect(x + 5, y + 6, w * 0.4, 3);
        var bv = 120 + r() * 95;
        gb.fillStyle = 'rgb(' + bv + ',' + bv + ',' + bv + ')';
        rounded(gb, x, y, w, h, 5 + r() * 5); gb.fill();
      }
    }
    noise(g, W, H, 0.07, 19);
    noise(gb, W, H, 0.18, 23);
    /* cold wet bloom */
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, 'rgba(55,78,96,.07)');
    grd.addColorStop(0.45, 'rgba(3,8,14,.08)');
    grd.addColorStop(1, 'rgba(63,44,55,.06)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    var map = tex(c, { repeat: [5.4, 5.4] });
    var bump = tex(b, { srgb: false, repeat: [5.4, 5.4] });
    cobbleCache = { map: map, bump: bump };
    return cobbleCache;
  };

  var paveCache = null;
  Tex.pavement = function () {
    if (paveCache) return paveCache;
    var W = 512, H = 512, c = cv(W, H), g = ctx(c);
    var r = QP.rng(66);
    g.fillStyle = '#1a1e22'; g.fillRect(0, 0, W, H);
    for (var row = 0; row < 8; row++) {
      var off = (row % 2) * 34;
      for (var i = -1; i < 9; i++) {
        var x = i * 68 + off + (r() - 0.5) * 4, y = row * 64;
        var v = 60 + r() * 20;
        g.fillStyle = 'rgb(' + ((v + 8) | 0) + ',' + ((v + 10) | 0) + ',' + ((v + 12) | 0) + ')';
        rounded(g, x + 2, y + 2, 64 - r() * 5, 60, 3); g.fill();
        g.strokeStyle = 'rgba(200,206,205,.10)'; g.lineWidth = 1; g.stroke();
        g.fillStyle = 'rgba(5,8,10,.25)'; g.fillRect(x + 4, y + 58, 60, 3);
      }
    }
    noise(g, W, H, 0.07, 72);
    var t = tex(c, { repeat: [2, 2] });
    paveCache = { map: t };
    return paveCache;
  };

  /* ---------------- woods ---------------- */
  function wood(base, line, seed, vertical) {
    var W = 512, H = 512, c = cv(W, H), g = ctx(c);
    var r = QP.rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 160; i++) {
      var x = r() * W, y = r() * H;
      g.strokeStyle = 'rgba(' + line + ',' + (0.035 + r() * 0.11) + ')';
      g.lineWidth = 0.6 + r() * 2.0;
      g.beginPath();
      if (vertical) {
        g.moveTo(x, 0);
        g.bezierCurveTo(x + (r() - 0.5) * 30, H * .35, x + (r() - 0.5) * 34, H * .7, x + (r() - 0.5) * 20, H);
      } else {
        g.moveTo(0, y);
        g.bezierCurveTo(W * .35, y + (r() - 0.5) * 24, W * .7, y + (r() - 0.5) * 24, W, y + (r() - 0.5) * 15);
      }
      g.stroke();
    }
    for (var j = 0; j < 9; j++) {
      var yy = r() * H;
      g.strokeStyle = 'rgba(15,8,5,.22)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy + (r() - .5) * 12); g.stroke();
    }
    noise(g, W, H, 0.045, seed + 2);
    return c;
  }
  var woodCache = {};
  Tex.walnut = function () {
    if (!woodCache.walnut) woodCache.walnut = tex(wood('#452b1d', '22,12,8', 404, false), { repeat: [2, 1] });
    return woodCache.walnut;
  };
  Tex.walnutDark = function () {
    if (!woodCache.dark) woodCache.dark = tex(wood('#281913', '8,5,4', 504, true), { repeat: [1, 1] });
    return woodCache.dark;
  };
  Tex.woodFloor = function () {
    if (woodCache.floor) return woodCache.floor;
    var W = 768, H = 768, c = cv(W, H), g = ctx(c);
    var r = QP.rng(77);
    g.fillStyle = '#2b1c15'; g.fillRect(0, 0, W, H);
    var ph = H / 6;
    for (var i = 0; i < 6; i++) {
      var y = i * ph;
      var v = 46 + r() * 20;
      g.fillStyle = 'rgb(' + ((v + 20) | 0) + ',' + ((v + 5) | 0) + ',' + ((v) | 0) + ')';
      g.fillRect(0, y + 2, W, ph - 4);
      for (var j = 0; j < 24; j++) {
        g.strokeStyle = 'rgba(15,8,6,' + (0.05 + r() * 0.12) + ')';
        g.lineWidth = 1;
        var yy = y + 4 + r() * (ph - 8);
        g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(W * .3, yy + 3, W * .7, yy - 4, W, yy + 2); g.stroke();
      }
      g.fillStyle = 'rgba(4,3,3,.5)'; g.fillRect(0, y, W, 3);
      g.fillStyle = 'rgba(210,160,100,.05)'; g.fillRect(0, y + 3, W, 1);
      var nx = (r() * W) | 0;
      g.strokeStyle = 'rgba(4,3,3,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx, y); g.lineTo(nx, y + ph); g.stroke();
    }
    noise(g, W, H, 0.035, 81);
    woodCache.floor = tex(c, { repeat: [2, 2] });
    return woodCache.floor;
  };
  Tex.woodPanel = function () {
    if (woodCache.panel) return woodCache.panel;
    var c = cv(512, 512), g = ctx(c), r = QP.rng(211);
    g.fillStyle = '#2d1d15'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 4; i++) {
      var y = i * 128;
      g.fillStyle = 'rgba(' + (46 + i * 2) + ',' + (29 + i) + ',20,1)'; g.fillRect(0, y, 512, 124);
      for (var j = 0; j < 30; j++) {
        g.strokeStyle = 'rgba(8,5,4,' + (0.05 + r() * 0.14) + ')';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, y + 8 + r() * 108); g.bezierCurveTo(180, y + r() * 120, 340, y + r() * 120, 512, y + r() * 120); g.stroke();
      }
      g.strokeStyle = '#0b0806'; g.lineWidth = 3; g.strokeRect(0, y, 512, 128);
      g.strokeStyle = 'rgba(196,137,70,.18)'; g.lineWidth = 1; g.strokeRect(3, y + 3, 506, 122);
      g.fillStyle = 'rgba(200,143,77,.28)';
      g.fillRect(14, y + 14, 3, 100); g.fillRect(495, y + 14, 3, 100);
    }
    woodCache.panel = tex(c, { repeat: [2, 1] });
    return woodCache.panel;
  };

  /* ---------------- wallpaper / rug ---------------- */
  Tex.wallpaper = function () {
    if (woodCache.wall) return woodCache.wall;
    var W = 512, H = 512, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#26382f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(189,161,98,.22)';
    g.lineWidth = 1.5;
    for (var y = -64; y < H + 64; y += 88) {
      for (var x = -64; x < W + 64; x += 88) {
        g.beginPath();
        g.moveTo(x + 44, y + 4);
        g.bezierCurveTo(x + 20, y + 25, x + 22, y + 62, x + 44, y + 79);
        g.bezierCurveTo(x + 66, y + 62, x + 68, y + 25, x + 44, y + 4);
        g.stroke();
        g.beginPath(); g.arc(x + 44, y + 42, 5, 0, 6.3); g.stroke();
        g.beginPath(); g.moveTo(x + 44, y + 6); g.lineTo(x + 44, y + 25); g.stroke();
        g.beginPath(); g.moveTo(x + 30, y + 42); g.lineTo(x + 58, y + 42); g.stroke();
        g.beginPath(); g.arc(x + 44, y + 42, 15, 0, 6.3); g.stroke();
      }
    }
    var vertical = g.createLinearGradient(0, 0, W, 0);
    vertical.addColorStop(0, 'rgba(5,8,7,.2)');
    vertical.addColorStop(.25, 'rgba(255,220,160,.035)');
    vertical.addColorStop(.5, 'rgba(5,8,7,.04)');
    vertical.addColorStop(.75, 'rgba(255,220,160,.04)');
    vertical.addColorStop(1, 'rgba(5,8,7,.2)');
    g.fillStyle = vertical; g.fillRect(0, 0, W, H);
    noise(g, W, H, 0.05, 32);
    woodCache.wall = tex(c, { repeat: [2, 2] });
    return woodCache.wall;
  };

  Tex.rug = function () {
    if (woodCache.rug) return woodCache.rug;
    var W = 768, H = 512, c = cv(W, H), g = ctx(c), r = QP.rng(87);
    g.fillStyle = '#43101a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#b78a4c'; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 28);
    g.strokeStyle = '#7b2332'; g.lineWidth = 10; g.strokeRect(28, 28, W - 56, H - 56);
    for (var i = 0; i < 60; i++) {
      g.strokeStyle = i % 3 ? 'rgba(190,148,88,.5)' : 'rgba(93,155,136,.45)';
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(W / 2, H / 2, 55 + i * 3.2, 0.4 + i * .08, 2.6 + i * .08); g.stroke();
    }
    g.strokeStyle = 'rgba(218,181,112,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(W/2, 70); g.lineTo(W/2+100,H/2); g.lineTo(W/2,H-70); g.lineTo(W/2-100,H/2); g.closePath(); g.stroke();
    g.beginPath(); g.arc(W/2, H/2, 44, 0, 6.3); g.stroke();
    for (var x = 50; x < W - 30; x += 56) {
      g.fillStyle = x % 112 ? '#9a7040' : '#4f8a79';
      g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 12, 26); g.lineTo(x, 38); g.lineTo(x - 12, 26); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x, H - 14); g.lineTo(x + 12, H - 26); g.lineTo(x, H - 38); g.lineTo(x - 12, H - 26); g.closePath(); g.fill();
    }
    noise(g, W, H, 0.12, 91);
    woodCache.rug = tex(c, { repeat: [1, 1] });
    return woodCache.rug;
  };

  /* ---------------- silks & brocades ---------------- */
  Tex.brocade = function (base, motif, seed) {
    var W = 512, H = 512, c = cv(W, H), g = ctx(c), r = QP.rng(seed || 5);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, 'rgba(255,255,255,.09)');
    grd.addColorStop(.4, 'rgba(255,255,255,0)');
    grd.addColorStop(1, 'rgba(0,0,0,.17)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = motif; g.fillStyle = motif;
    for (var y = -40; y < H + 60; y += 128) {
      for (var x = -40; x < W + 60; x += 170) {
        var ox = x + (r() - 0.5) * 8, oy = y + (r() - 0.5) * 8;
        g.globalAlpha = 0.55;
        g.lineWidth = 2.2;
        g.beginPath();
        g.moveTo(ox + 38, oy + 4);
        g.bezierCurveTo(ox + 70, oy + 16, ox + 75, oy + 52, ox + 46, oy + 67);
        g.bezierCurveTo(ox + 18, oy + 78, ox - 2, oy + 52, ox + 7, oy + 30);
        g.bezierCurveTo(ox + 12, oy + 17, ox + 24, oy + 9, ox + 38, oy + 4);
        g.stroke();
        for (var k = 0; k < 5; k++) {
          var a = k / 5 * 6.283;
          g.beginPath();
          g.ellipse(ox + 38 + Math.cos(a) * 23, oy + 38 + Math.sin(a) * 21, 10, 4.5, a, 0, 6.3);
          g.stroke();
        }
        g.globalAlpha = 0.6;
        g.beginPath(); g.arc(ox + 38, oy + 38, 5, 0, 6.3); g.fill();
        g.globalAlpha = 0.22;
        for (var v = 0; v < 9; v++) {
          g.beginPath();
          g.arc(ox + 38, oy + 39, 44 + v * 9, 0.3, 2.9);
          g.lineWidth = 0.8;
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    g.globalAlpha = 0.30;
    for (var j = 0; j < 12; j++) {
      g.strokeStyle = j % 2 ? 'rgba(242,213,150,.7)' : 'rgba(255,255,255,.3)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, j * 41);
      g.bezierCurveTo(180, j * 41 + 13, 320, j * 41 - 15, 512, j * 41 + 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    noise(g, W, H, 0.045, seed + 20);
    var t = tex(c, { repeat: [1.2, 1.2] });
    return t;
  };

  Tex.silkPanel = function (base, motif, seed) {
    var W = 512, H = 512, c = cv(W, H), g = ctx(c);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, 'rgba(255,255,255,.11)');
    grd.addColorStop(.45, 'rgba(255,255,255,.01)');
    grd.addColorStop(1, 'rgba(0,0,0,.23)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    var r = QP.rng(seed);
    g.strokeStyle = motif; g.globalAlpha = .65;
    for (var i = 0; i < 30; i++) {
      var x = r() * W, y = r() * H;
      g.lineWidth = .8 + r() * 1.4;
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x + 30, y - 60, x + 90, y + 20, x + 30, y + 60);
      g.stroke();
      g.beginPath(); g.arc(x + 18, y + 4, 2 + r() * 3, 0, 6.3); g.fill();
    }
    g.globalAlpha = .35;
    for (var y2 = 0; y2 < H; y2 += 54) {
      g.strokeStyle = 'rgba(255,240,190,.3)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y2); g.lineTo(W, y2 + 3); g.stroke();
    }
    g.globalAlpha = 1;
    noise(g, W, H, .04, seed + 1);
    return tex(c, { repeat: [1, 1] });
  };

  /* ---------------- stained glass ---------------- */
  Tex.stained = function (seed, warm) {
    seed = seed || 3;
    var W = 512, H = 1024, c = cv(W, H), g = ctx(c), r = QP.rng(seed);
    g.clearRect(0, 0, W, H);
    var palette = warm ? ['#e5a33d', '#f6d581', '#d95f45', '#3f8d91', '#4c5ba6', '#f2e7b4', '#9e334b']
                       : ['#4862a8', '#3a8c83', '#d4a341', '#b44a53', '#6b4b8a', '#9ec7ad', '#e8d8a3'];
    g.fillStyle = 'rgba(8,15,23,.80)';
    g.fillRect(0, 0, W, H);
    function pane(pts, color, alpha) {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.globalAlpha = alpha;
      g.fillStyle = color; g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 7; g.strokeStyle = 'rgba(5,8,12,.95)'; g.stroke();
      g.lineWidth = 1.4; g.strokeStyle = 'rgba(245,228,184,.16)'; g.stroke();
    }
    /* border panes */
    pane([[0,0],[W,0],[W,70],[0,70]], palette[3], 0.82);
    pane([[0,H-80],[W,H-80],[W,H],[0,H]], palette[3], 0.82);
    pane([[0,0],[60,0],[60,H],[0,H]], palette[2], 0.72);
    pane([[W-60,0],[W,0],[W,H],[W-60,H]], palette[2], 0.72);
    /* tall art deco fan */
    var cx = W / 2, cy = H * .42;
    pane([[cx,110],[cx+126,cy-90],[cx+156,H*.64],[cx, H*.73]], palette[0], 0.66);
    pane([[cx,110],[cx-126,cy-90],[cx-156,H*.64],[cx,H*.73]], palette[1], 0.62);
    pane([[cx-126,cy-90],[cx,cy-190],[cx+126,cy-90],[cx,cy+30]], palette[4], 0.64);
    pane([[cx,cy-190],[cx+200,cy-110],[cx+156,H*.64],[cx,cy+30]], palette[5], 0.52);
    pane([[cx,cy-190],[cx-200,cy-110],[cx-156,H*.64],[cx,cy+30]], palette[6], 0.52);
    pane([[cx-156,H*.64],[cx, H*.73],[cx+156,H*.64],[cx+128,H*.91],[cx-128,H*.91]], palette[2], 0.72);
    pane([[cx-128,H*.91],[cx+128,H*.91],[cx+76,H-82],[cx-76,H-82]], palette[0], 0.60);
    /* sun rays */
    g.globalAlpha = 0.52;
    for (var i = 0; i < 18; i++) {
      var a0 = -1.1 + i * .115, a1 = a0 + .055;
      g.beginPath();
      g.moveTo(cx, cy + 45);
      g.lineTo(cx + Math.sin(a0) * 620, cy + 45 - Math.cos(a0) * 620);
      g.lineTo(cx + Math.sin(a1) * 620, cy + 45 - Math.cos(a1) * 620);
      g.closePath();
      g.fillStyle = i % 2 ? 'rgba(246,224,152,.16)' : 'rgba(112,193,187,.13)';
      g.fill();
    }
    g.globalAlpha = 1;
    /* central jewel */
    for (var k = 0; k < 12; k++) {
      var a = k / 12 * 6.283;
      var x = cx + Math.cos(a) * 38, y = cy + 35 + Math.sin(a) * 38;
      g.fillStyle = k % 3 === 0 ? '#f2dfa4' : k % 2 ? '#d65e53' : '#69a89c';
      g.globalAlpha = .8;
      g.beginPath(); g.arc(x, y, 8 + (k % 3) * 3, 0, 6.3); g.fill();
    }
    g.globalAlpha = 1;
    g.beginPath(); g.arc(cx, cy + 35, 27, 0, 6.3);
    g.fillStyle = 'rgba(248,211,118,.9)'; g.fill();
    g.lineWidth = 5; g.strokeStyle = 'rgba(8,10,14,.9)'; g.stroke();
    /* crisp leading */
    g.strokeStyle = 'rgba(10,14,18,.88)';
    g.lineWidth = 9;
    for (var yy = 0; yy < H; yy += 128) {
      g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
      g.beginPath(); g.moveTo(yy, 0); g.lineTo(yy, H); g.stroke();
    }
    g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy + 35, 160, 0, 6.3); g.stroke();
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
    /* tiny bubbles / wet light */
    stars(g, W, H, 40, 'rgba(244,228,189,.55)', 1.2, seed + 2);
    var t = tex(c, { repeat: [1, 1] });
    return t;
  };

  Tex.stainedSmall = function (seed) {
    var t = Tex.stained(seed || 11, true);
    return t;
  };

  /* ---------------- tiffany lamp mosaic ---------------- */
  Tex.tiffany = function () {
    var W = 512, H = 256, c = cv(W, H), g = ctx(c), r = QP.rng(441);
    g.fillStyle = '#192c25'; g.fillRect(0, 0, W, H);
    var cols = ['#d6a64f', '#4e9a87', '#a23c4d', '#5966a4', '#e0c787', '#2f6154'];
    for (var i = 0; i < 230; i++) {
      var x = r() * W, y = r() * H, s = 8 + r() * 18;
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.globalAlpha = .5 + r() * .5;
      g.beginPath();
      g.moveTo(x, y - s * .5); g.lineTo(x + s * .5, y); g.lineTo(x, y + s * .5); g.lineTo(x - s * .5, y); g.closePath(); g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(18,15,12,.85)'; g.lineWidth = 2; g.stroke();
    }
    for (var y = 0; y < H; y += 22) {
      g.strokeStyle = 'rgba(20,17,13,.35)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    return tex(c, { repeat: [1, 1] });
  };

  /* ---------------- neon canvas ---------------- */
  function neonText(g, text, x, y, size, color, glow, font) {
    g.save();
    g.font = '700 ' + size + 'px ' + (font || CJK_SERIF);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = glow || color;
    g.shadowBlur = 26;
    g.fillStyle = color;
    g.fillText(text, x, y);
    g.shadowBlur = 10;
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.globalAlpha = .55;
    g.fillText(text, x, y);
    g.globalAlpha = 1;
    g.restore();
  }
  Tex.neonSign = function (kind) {
    var isRecord = kind === 'record';
    var W = 384, H = isRecord ? 768 : 1280;
    var c = cv(W, H), g = ctx(c);
    g.fillStyle = '#0b1217'; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, isRecord ? 'rgba(22,74,70,.24)' : 'rgba(90,27,49,.23)');
    grd.addColorStop(.5, 'rgba(3,7,10,.05)');
    grd.addColorStop(1, 'rgba(5,6,7,.5)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    /* faint art-deco corner ornament */
    g.strokeStyle = 'rgba(213,176,100,.22)'; g.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
      var m = 18 + i * 7;
      g.beginPath(); g.moveTo(m, m + 40); g.lineTo(m + 40, m); g.moveTo(m, H - m - 40); g.lineTo(m + 40, H - m); g.stroke();
    }
    var chars = isRecord ? ['百','代','留','聲'] : ['綺','羅','旗','袍'];
    var col = isRecord ? '#61f4e2' : '#ff4f91';
    var step = isRecord ? 126 : 208;
    var start = isRecord ? 178 : 248;
    for (var k = 0; k < chars.length; k++) {
      neonText(g, chars[k], W / 2, start + k * step, isRecord ? 162 : 186, '#fff2f6', col);
      g.strokeStyle = col;
      g.globalAlpha = .8; g.lineWidth = 2;
      g.strokeRect(54, start + k * step - 82, W - 108, 164);
      g.globalAlpha = 1;
    }
    neonText(g, isRecord ? 'GRAMOPHONE' : 'QIPAO', W / 2, H - 94, 27, '#f8dba3', isRecord ? '#49d4c5' : '#ff8dac', 'Georgia,serif');
    neonText(g, isRecord ? '黑 膠 唱 片' : '滬 上 名 裁', W / 2, isRecord ? H - 38 : H - 38, 19, '#dce9df', isRecord ? '#49d4c5' : '#ff7d9e', CJK_SERIF);
    /* rain grime */
    g.globalAlpha = .08;
    for (var j = 0; j < 28; j++) {
      g.fillStyle = '#b8d4ce';
      g.fillRect(20 + Math.random() * (W - 40), 20 + Math.random() * (H - 40), 1 + Math.random() * 3, 30 + Math.random() * 220);
    }
    g.globalAlpha = 1;
    return tex(c, { repeat: [1, 1] });
  };

  Tex.fascia = function (kind) {
    var isRec = kind === 'record';
    var W = 1024, H = 256, c = cv(W, H), g = ctx(c);
    g.fillStyle = isRec ? '#1a2520' : '#271219'; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,220,170,.14)');
    grd.addColorStop(.5, 'rgba(0,0,0,.04)');
    grd.addColorStop(1, 'rgba(0,0,0,.4)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a87b3c'; g.lineWidth = 3;
    g.strokeRect(18, 18, W - 36, H - 36);
    g.strokeStyle = 'rgba(221,180,104,.38)'; g.lineWidth = 1;
    g.strokeRect(28, 28, W - 56, H - 56);
    for (var x = 44; x < W - 30; x += 42) {
      g.fillStyle = 'rgba(219,178,100,.32)';
      g.beginPath(); g.moveTo(x, 30); g.lineTo(x + 7, 38); g.lineTo(x, 46); g.lineTo(x - 7, 38); g.closePath(); g.fill();
    }
    var title = isRec ? '百 代 留 聲' : '綺 羅 旗 袍';
    var sub = isRec ? '黑 膠 唱 片  ·  古 董 留 聲 機' : '高 級 定 製  ·  海 派 傳 承';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 88px ' + CJK_SERIF;
    g.fillStyle = 'rgba(20,8,9,.8)'; g.fillText(title, W / 2 + 4, 112 + 4);
    g.fillStyle = '#e7c67e'; g.fillText(title, W / 2, 112);
    g.strokeStyle = 'rgba(248,222,159,.65)'; g.lineWidth = 1;
    g.strokeText(title, W / 2, 112);
    g.font = '400 24px ' + CJK;
    g.fillStyle = isRec ? '#a9d8c7' : '#e3b5a7';
    g.fillText(sub, W / 2, 190);
    g.font = 'italic 18px Georgia,serif'; g.fillStyle = 'rgba(228,202,155,.55)';
    g.fillText(isRec ? 'PAI TAI RECORDS  ·  SHANGHAI' : 'CHI LO QIPAO  ·  SHANGHAI 1936', W / 2, 222);
    return tex(c, { repeat: [1, 1] });
  };

  /* ---------------- tram & posters ---------------- */
  Tex.tramDest = function () {
    var W = 512, H = 128, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#11130d'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#463b24'; g.lineWidth = 5; g.strokeRect(4, 4, W - 8, H - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 58px ' + CJK;
    g.fillStyle = '#f7d99a';
    g.shadowColor = '#ffbe5d'; g.shadowBlur = 16;
    g.fillText('靜 安 寺', W / 2 - 42, 66);
    g.font = '700 60px Georgia,serif';
    g.fillStyle = '#f4e1b4'; g.fillText('8', W - 68, 66);
    g.shadowBlur = 0;
    g.font = '16px Georgia,serif'; g.fillStyle = 'rgba(246,215,157,.6)';
    g.fillText('TZINGAN TEMPLE', W / 2 - 40, 105);
    return tex(c, { repeat: [1, 1] });
  };
  Tex.tramAd = function () {
    var W = 512, H = 256, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#ead8b2'; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#f2dfb7'); grd.addColorStop(1, '#c7ac81');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#502729'; g.lineWidth = 10; g.strokeRect(10, 10, W - 20, H - 20);
    g.strokeStyle = '#b98a4c'; g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
    g.fillStyle = '#69372c';
    g.textAlign = 'center';
    g.font = '700 48px ' + CJK_SERIF;
    g.fillText('雙 妹 牌', W / 2, 78);
    g.font = '400 22px ' + CJK;
    g.fillStyle = '#493327'; g.fillText('雪 花 膏  ·  秋 季 新 裝', W / 2, 118);
    /* art deco flowers */
    for (var i = 0; i < 7; i++) {
      var x = 80 + i * 58, y = 182 + Math.sin(i) * 12;
      g.strokeStyle = 'rgba(82,40,44,.6)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, 18 + (i % 3) * 5, 0, 6.3); g.stroke();
      g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.stroke();
      for (var k = 0; k < 5; k++) {
        var a = k / 5 * 6.283;
        g.beginPath(); g.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 8, 3.2, a, 0, 6.3); g.stroke();
      }
    }
    g.fillStyle = '#5b3021'; g.font = 'italic 16px Georgia,serif';
    g.fillText('SHANGHAI  ·  SINCE 1918', W / 2, 230);
    return tex(c, { repeat: [1, 1] });
  };

  Tex.calendarPoster = function () {
    var W = 512, H = 768, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#e9dcc2'; g.fillRect(0, 0, W, H);
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#f0e3c9'); grd.addColorStop(.6, '#d8c3a2'); grd.addColorStop(1, '#bca482');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#7b2a36'; g.lineWidth = 14; g.strokeRect(18, 18, W - 36, H - 36);
    g.strokeStyle = '#b88c4d'; g.lineWidth = 2; g.strokeRect(34, 34, W - 68, H - 68);
    /* lantern/plum branches */
    g.strokeStyle = '#4a3128'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(92, 55); g.bezierCurveTo(156, 140, 112, 220, 185, 294); g.stroke();
    g.lineWidth = 2.4;
    for (var i = 0; i < 9; i++) {
      var x = 125 + i * 14, y = 100 + i * 22;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 48, y - 35, x + 70, y - 60); g.stroke();
      g.fillStyle = 'rgba(173,52,58,.82)';
      g.beginPath(); g.arc(x + 70, y - 60, 8, 0, 6.3); g.fill();
      g.fillStyle = 'rgba(235,196,155,.9)';
      g.beginPath(); g.arc(x + 64, y - 64, 3, 0, 6.3); g.fill();
    }
    /* central motif: qipao silhouette? keep poster abstract, no live figures */
    g.fillStyle = 'rgba(248,240,215,.58)';
    rounded(g, 154, 198, 206, 300, 28); g.fill();
    g.strokeStyle = '#7d3942'; g.lineWidth = 3; g.stroke();
    /* perfume bottle */
    g.fillStyle = 'rgba(75,34,40,.82)';
    rounded(g, 226, 288, 64, 112, 12); g.fill();
    g.fillStyle = 'rgba(214,176,100,.86)';
    g.fillRect(250, 263, 16, 28); rounded(g, 242, 252, 32, 18, 4); g.fill();
    g.strokeStyle = 'rgba(242,215,160,.6)'; g.lineWidth = 1.4;
    for (var j = 0; j < 5; j++) { g.beginPath(); g.arc(258, 318, 24 + j * 12, 0, 6.3); g.stroke(); }
    g.strokeStyle = '#694231'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(190, 458); g.quadraticCurveTo(258, 406, 326, 458); g.stroke();
    g.beginPath(); g.moveTo(180, 472); g.quadraticCurveTo(258, 420, 336, 472); g.stroke();
    /* plum seal */
    g.fillStyle = 'rgba(125,34,45,.85)';
    g.fillRect(390, 490, 52, 52);
    g.fillStyle = 'rgba(233,209,162,.9)';
    g.font = '26px ' + CJK_SERIF; g.textAlign = 'center';
    g.fillText('月', 416, 518); g.fillText('份', 416, 540);
    g.fillStyle = '#5c2c2c'; g.textAlign = 'center';
    g.font = '700 43px ' + CJK_SERIF; g.fillText('海 上 名 媛', 256, 568);
    g.font = '400 23px ' + CJK; g.fillStyle = '#6d4831';
    g.fillText('花 露 水  ·  蝶 戀 花 香', 256, 605);
    g.strokeStyle = 'rgba(108,68,46,.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(90, 625); g.lineTo(422, 625); g.stroke();
    /* calendar grid */
    g.font = '400 17px Georgia,serif'; g.fillStyle = 'rgba(75,51,38,.85)';
    var months = ['SEP', 'OCT', 'NOV'];
    for (var m = 0; m < 3; m++) {
      var bx = 74 + m * 124;
      g.fillStyle = 'rgba(120,46,50,.82)'; g.fillRect(bx, 650, 106, 24);
      g.fillStyle = '#eedebd'; g.font = '14px Georgia,serif'; g.textAlign = 'center';
      g.fillText(months[m] + ' / 1934', bx + 53, 666);
      g.fillStyle = 'rgba(75,51,38,.62)'; g.font = '11px Georgia,serif';
      for (var d = 0; d < 15; d++) {
        var dx = bx + 8 + (d % 5) * 19, dy = 688 + Math.floor(d / 5) * 14;
        g.fillText(String(d + 1 + m * 10), dx, dy);
      }
    }
    g.fillStyle = '#633832'; g.font = '400 16px ' + CJK; g.textAlign = 'left';
    g.fillText('民國廿三年 · 秋', 58, H - 54);
    g.textAlign = 'right'; g.font = 'italic 14px Georgia,serif';
    g.fillText('THE MODERN GIRL · SHANGHAI', W - 58, H - 54);
    g.strokeStyle = 'rgba(96,45,43,.5)'; g.lineWidth = 1;
    g.strokeRect(46, 46, W - 92, H - 92);
    noise(g, W, H, .035, 33);
    return tex(c, { repeat: [1, 1] });
  };

  Tex.recordWall = function () {
    var W = 1024, H = 640, c = cv(W, H), g = ctx(c), r = QP.rng(119);
    g.fillStyle = '#1d1411'; g.fillRect(0, 0, W, H);
    var cols = 10, rows = 5, cw = W / cols, ch = H / rows;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var px = x * cw + 5, py = y * ch + 6, pw = cw - 10, ph = ch - 12;
        g.fillStyle = 'rgba(0,0,0,.45)';
        g.fillRect(px + 3, py + 4, pw, ph);
        var style = (r() * 7) | 0;
        var pcols = [
          ['#213a35', '#e4c477'], ['#6e2430', '#d8b875'], ['#20314f', '#dacb9a'],
          ['#a16732', '#f0d59a'], ['#4e2d4d', '#d1b36d'], ['#d6c3a0', '#4a2b26'],
          ['#1c303a', '#cf7b54']
        ][style];
        g.fillStyle = pcols[0]; g.fillRect(px, py, pw, ph);
        g.strokeStyle = 'rgba(239,211,151,.24)'; g.lineWidth = 1; g.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
        g.strokeStyle = pcols[1]; g.fillStyle = pcols[1];
        g.lineWidth = 1.5;
        if (style === 0) {
          for (var i = 0; i < 5; i++) { g.beginPath(); g.arc(px + pw / 2, py + ph * .43, 9 + i * 8, 0, 6.3); g.stroke(); }
          g.fillRect(px + pw * .3, py + ph * .72, pw * .4, 3);
        } else if (style === 1) {
          g.beginPath(); g.moveTo(px + 16, py + ph - 20); g.lineTo(px + pw / 2, py + 20); g.lineTo(px + pw - 16, py + ph - 20); g.stroke();
          g.beginPath(); g.arc(px + pw / 2, py + ph * .52, pw * .16, 0, 6.3); g.stroke();
        } else if (style === 2) {
          g.beginPath(); g.moveTo(px + 10, py + 10); g.lineTo(px + pw - 10, py + ph - 10); g.stroke();
          g.beginPath(); g.moveTo(px + pw - 10, py + 10); g.lineTo(px + 10, py + ph - 10); g.stroke();
          g.strokeRect(px + pw * .2, py + ph * .2, pw * .6, ph * .6);
        } else if (style === 3) {
          g.beginPath(); g.arc(px + pw / 2, py + ph * .4, pw * .22, 0, 6.3); g.stroke();
          g.fillStyle = 'rgba(240,213,154,.12)'; g.fillRect(px + 12, py + 12, pw - 24, ph - 24);
        } else if (style === 4) {
          for (var k = 0; k < 8; k++) {
            g.beginPath(); g.moveTo(px + 8, py + ph - 14 - k * 7); g.lineTo(px + pw - 8, py + ph - 20 - k * 7); g.stroke();
          }
        } else if (style === 5) {
          g.fillStyle = '#7f2f39'; g.beginPath(); g.arc(px + pw / 2, py + ph * .4, pw * .2, 0, 6.3); g.fill();
          g.fillStyle = pcols[1]; g.beginPath(); g.arc(px + pw / 2, py + ph * .4, pw * .08, 0, 6.3); g.fill();
        } else {
          for (var s = 0; s < 4; s++) {
            g.strokeStyle = s % 2 ? pcols[1] : 'rgba(247,217,156,.45)';
            g.beginPath(); g.arc(px + pw * .5, py + ph * .5, 10 + s * 12, s * .8, 5.6); g.stroke();
          }
        }
        g.fillStyle = 'rgba(243,227,187,.7)'; g.font = '10px Georgia,serif'; g.textAlign = 'center';
        g.fillText(['藍色多瑙河', '夜上海', '玫瑰人生', '天涯歌女', '四季歌', '秋水伊人', '香格里拉'][style], px + pw / 2, py + ph - 9);
        g.font = '7px Georgia,serif'; g.fillStyle = 'rgba(235,212,166,.35)';
        g.fillText(['VOL.1', 'HIS MASTER', '78 RPM', 'SHANGHAI', 'RCA', 'PAI TAI', 'ODEON'][style], px + pw / 2, py + 13);
      }
      g.fillStyle = 'rgba(151,104,61,.34)'; g.fillRect(0, y * ch + ch - 4, W, 4);
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, y * ch + ch, W, 4);
    }
    var sh = g.createLinearGradient(0, 0, 0, H);
    sh.addColorStop(0, 'rgba(255,207,136,.09)');
    sh.addColorStop(.55, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H);
    return tex(c, { repeat: [1, 1] });
  };

  /* ---------------- mirror fake reflection ---------------- */
  Tex.mirror = function () {
    var W = 256, H = 512, c = cv(W, H), g = ctx(c);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#5d503d');
    grd.addColorStop(.35, '#bd9c64');
    grd.addColorStop(.55, '#5c3d35');
    grd.addColorStop(1, '#161b1d');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.globalAlpha = .35;
    for (var i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#e4bd76' : '#8f3942';
      g.fillRect(15 + i * 28, 40 + i * 15, 8, 280);
    }
    g.globalAlpha = .22;
    g.fillStyle = '#d7eff4';
    g.beginPath(); g.moveTo(35, 0); g.lineTo(90, 0); g.lineTo(140, H); g.lineTo(60, H); g.closePath(); g.fill();
    g.globalAlpha = 1;
    stars(g, W, H, 24, 'rgba(255,241,208,.4)', 2.2, 44);
    return tex(c, { repeat: [1, 1] });
  };

  Tex.shopSignBrass = function () {
    var W = 512, H = 128, c = cv(W, H), g = ctx(c);
    var grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#4b341a'); grd.addColorStop(.25, '#c39b57'); grd.addColorStop(.5, '#8a6630');
    grd.addColorStop(.7, '#e8c87e'); grd.addColorStop(1, '#5d401e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.font = '700 42px ' + CJK_SERIF;
    g.fillStyle = 'rgba(41,24,9,.75)'; g.fillText('綺 羅 旗 袍', W / 2 + 2, 68 + 2);
    g.fillStyle = '#f2dcab'; g.fillText('綺 羅 旗 袍', W / 2, 68);
    g.font = '12px Georgia,serif'; g.fillStyle = 'rgba(35,21,8,.65)';
    g.fillText('FINE QIPAO ATELIER  ·  EST. 1928', W / 2, 96);
    return tex(c, { repeat: [1, 1] });
  };

  Tex.enamelSign = function (text, sub, bg, fg) {
    var W = 512, H = 160, c = cv(W, H), g = ctx(c);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(235,223,193,.7)'; g.lineWidth = 5; g.strokeRect(9, 9, W - 18, H - 18);
    g.strokeStyle = 'rgba(10,14,16,.28)'; g.lineWidth = 2; g.strokeRect(18, 18, W - 36, H - 36);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = fg; g.font = '700 65px ' + CJK; g.fillText(text, W / 2, 76);
    g.font = '18px Georgia,serif'; g.globalAlpha = .8; g.fillText(sub, W / 2, 126); g.globalAlpha = 1;
    g.globalAlpha = .12;
    for (var i = 0; i < 25; i++) { g.fillStyle = '#f5efe0'; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 8, 1); }
    g.globalAlpha = 1;
    return tex(c, { repeat: [1, 1] });
  };

  /* ---------------- roof tiles ---------------- */
  Tex.roof = function () {
    if (woodCache.roof) return woodCache.roof;
    var W = 512, H = 512, c = cv(W, H), g = ctx(c), r = QP.rng(202);
    g.fillStyle = '#172021'; g.fillRect(0, 0, W, H);
    var rows = 12, tileH = H / rows;
    for (var y = 0; y < rows; y++) {
      var off = (y % 2) * 20;
      for (var x = -1; x < 10; x++) {
        var px = x * 56 + off, py = y * tileH;
        var v = 29 + r() * 20;
        g.fillStyle = 'rgb(' + (v) + ',' + ((v + 17) | 0) + ',' + ((v + 18) | 0) + ')';
        g.beginPath();
        g.ellipse(px + 28, py + tileH * .55, 28, tileH * .62, 0, Math.PI, 0);
        g.lineTo(px + 56, py + tileH);
        g.lineTo(px, py + tileH);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(9,16,17,.75)'; g.lineWidth = 2; g.stroke();
        g.strokeStyle = 'rgba(134,170,165,.18)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(px + 5, py + 4); g.quadraticCurveTo(px + 28, py - 5, px + 51, py + 4); g.stroke();
      }
      g.fillStyle = 'rgba(2,7,8,.34)'; g.fillRect(0, y * tileH, W, 2);
    }
    noise(g, W, H, .06, 208);
    woodCache.roof = tex(c, { repeat: [4, 3] });
    return woodCache.roof;
  };

  /* ---------------- glow / particles ---------------- */
  Tex.glow = function (hard) {
    var W = 256, c = cv(W, W), g = ctx(c);
    var grd = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(hard ? 0.08 : 0.16, 'rgba(255,255,255,.79)');
    grd.addColorStop(0.4, 'rgba(255,255,255,.20)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, W);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.needsUpdate = true;
    return t;
  };
  Tex.starGlow = function () {
    var W = 256, c = cv(W, W), g = ctx(c);
    var grd = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W * .18);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(.35, 'rgba(255,239,207,.7)');
    grd.addColorStop(1, 'rgba(255,190,100,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, W);
    var lg = g.createLinearGradient(0, W / 2, W, W / 2);
    lg.addColorStop(0, 'rgba(255,216,154,0)');
    lg.addColorStop(.42, 'rgba(255,240,208,.6)');
    lg.addColorStop(.5, 'rgba(255,255,249,1)');
    lg.addColorStop(.58, 'rgba(255,240,208,.6)');
    lg.addColorStop(1, 'rgba(255,216,154,0)');
    g.fillStyle = lg; g.fillRect(0, W / 2 - 3, W, 6);
    var lv = g.createLinearGradient(W / 2, 0, W / 2, W);
    lv.addColorStop(0, 'rgba(255,231,180,0)');
    lv.addColorStop(.44, 'rgba(255,245,220,.3)');
    lv.addColorStop(.5, 'rgba(255,255,250,.8)');
    lv.addColorStop(.56, 'rgba(255,245,220,.3)');
    lv.addColorStop(1, 'rgba(255,231,180,0)');
    g.fillStyle = lv; g.fillRect(W / 2 - 2, 0, 4, W);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.needsUpdate = true;
    return t;
  };
  Tex.puddleMask = function () {
    var W = 512, c = cv(W, W), g = ctx(c);
    g.clearRect(0, 0, W, W);
    g.fillStyle = '#fff';
    var r = QP.rng(222);
    g.beginPath();
    var n = 22;
    for (var i = 0; i <= n; i++) {
      var a = i / n * 6.283;
      var rad = W * (.24 + Math.sin(i * 2.1) * .045 + r() * .048);
      var x = W / 2 + Math.cos(a) * rad * 1.22;
      var y = W / 2 + Math.sin(a) * rad * .64;
      if (i === 0) g.moveTo(x, y); else g.quadraticCurveTo(W / 2 + Math.cos(a - .15) * rad * 1.28, W / 2 + Math.sin(a - .15) * rad * .7, x, y);
    }
    g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (var j = 0; j < 12; j++) {
      g.beginPath(); g.arc(r() * W, r() * W, 4 + r() * 22, 0, 6.3); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    var t = new T.CanvasTexture(c); t.needsUpdate = true;
    return t;
  };
  Tex.rainStreak = function () {
    var W = 16, H = 128, c = cv(W, H), g = ctx(c);
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(.35, 'rgba(220,238,255,.35)');
    grd.addColorStop(.92, 'rgba(228,243,255,.85)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(W * .42, 0, W * .16, H);
    var t = new T.CanvasTexture(c); t.needsUpdate = true;
    return t;
  };
  Tex.smoke = function () {
    var W = 128, c = cv(W, W), g = ctx(c);
    for (var i = 0; i < 18; i++) {
      var x = W * (.5 + (Math.random() - .5) * .4), y = W * (.5 + (Math.random() - .5) * .4);
      var grd = g.createRadialGradient(x, y, 0, x, y, W * .2);
      grd.addColorStop(0, 'rgba(220,226,232,.08)');
      grd.addColorStop(1, 'rgba(220,226,232,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, W * .2, 0, 6.3); g.fill();
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.needsUpdate = true;
    return t;
  };
  Tex.spark = function () {
    var W = 128, c = cv(W, W), g = ctx(c);
    var grd = g.createRadialGradient(W/2,W/2,0,W/2,W/2,W/2);
    grd.addColorStop(0,'rgba(255,255,255,1)');
    grd.addColorStop(.18,'rgba(188,226,255,.95)');
    grd.addColorStop(.45,'rgba(87,164,255,.3)');
    grd.addColorStop(1,'rgba(80,150,255,0)');
    g.fillStyle = grd; g.fillRect(0,0,W,W);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.needsUpdate = true;
    return t;
  };

  /* ---------------- small decals / metadata ---------------- */
  Tex.paperTag = function (text, color) {
    var W = 256, H = 128, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#e1d2b1'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(104,71,42,.55)'; g.lineWidth = 2; g.strokeRect(7, 7, W - 14, H - 14);
    g.textAlign = 'center'; g.fillStyle = color || '#68272c'; g.font = '700 44px ' + CJK;
    g.fillText(text, W / 2, 72);
    g.strokeStyle = 'rgba(137,45,50,.38)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(24, H - 28); g.lineTo(W - 24, H - 28); g.stroke();
    return tex(c, { repeat: [1, 1] });
  };
  Tex.postboxLabel = function () {
    var W = 512, H = 256, c = cv(W, H), g = ctx(c);
    g.fillStyle = '#161b1c'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#9b7c48'; g.lineWidth = 4; g.strokeRect(8, 8, W - 16, H - 16);
    g.textAlign = 'center'; g.fillStyle = '#d8b66b';
    g.font = '700 57px ' + CJK; g.fillText('上 海 郵 政', W / 2, 88);
    g.font = '19px Georgia,serif'; g.globalAlpha = .65;
    g.fillText('SHANGHAI POST  ·  LETTER BOX', W / 2, 125);
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(217,182,107,.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(190, 150); g.lineTo(322, 150); g.stroke();
    g.font = '15px Georgia,serif'; g.fillStyle = 'rgba(216,182,107,.58)';
    g.fillText('NEXT COLLECTION  7:30 A.M.', W / 2, 155);
    g.font = '400 19px ' + CJK; g.fillStyle = 'rgba(212,183,120,.7)';
    g.fillText('收 信 時 間  下 午 六 時', W / 2, 200);
    return tex(c, { repeat: [1, 1] });
  };
  Tex.stone = function () {
    var W = 512, H = 512, c = cv(W, H), g = ctx(c), r = QP.rng(661);
    g.fillStyle = '#6f695e'; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 120; i++) {
      var x = r() * W, y = r() * H, rad = 14 + r() * 70;
      var v = 90 + r() * 80;
      g.globalAlpha = .035 + r() * .11;
      g.fillStyle = 'rgb(' + ((v + 7) | 0) + ',' + ((v + 3) | 0) + ',' + ((v - 5) | 0) + ')';
      g.beginPath(); g.ellipse(x, y, rad, rad * (.25 + r() * .55), r() * 3, 0, 6.3); g.fill();
    }
    g.globalAlpha = 1;
    /* thin ashlar joints and hairline cracks */
    g.strokeStyle = 'rgba(45,40,34,.22)'; g.lineWidth = 1;
    for (var y2 = 64; y2 < H; y2 += 128) {
      g.beginPath(); g.moveTo(0, y2); g.lineTo(W, y2 + (r() - .5) * 3); g.stroke();
      var off = (y2 / 128) % 2 ? 110 : 0;
      for (var x2 = off; x2 < W; x2 += 220) {
        g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + (r() - .5) * 4, y2 + 128); g.stroke();
      }
    }
    for (var c2 = 0; c2 < 18; c2++) {
      g.strokeStyle = 'rgba(49,43,35,' + (.05 + r() * .13) + ')'; g.lineWidth = .6 + r() * 1.2;
      var sx = r() * W, sy = r() * H;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 10 + r() * 40, sy + 10 + r() * 30); g.stroke();
    }
    noise(g, W, H, .04, 667);
    return tex(c, { repeat: [1.4, 1.4] });
  };

  Tex.fan = function () {
    var W = 512, H = 256, c = cv(W, H), g = ctx(c);
    g.clearRect(0,0,W,H);
    for (var i = 0; i < 16; i++) {
      var a0 = -Math.PI * .92 + i * .12, a1 = a0 + .06;
      g.beginPath();
      g.moveTo(W/2, H);
      g.lineTo(W/2 + Math.cos(a0) * W * .55, H + Math.sin(a0) * W * .55);
      g.lineTo(W/2 + Math.cos(a1) * W * .55, H + Math.sin(a1) * W * .55);
      g.closePath();
      g.fillStyle = i % 3 ? 'rgba(206,183,137,.25)' : 'rgba(245,221,170,.38)';
      g.fill();
    }
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(10,8,7,.2)');
    grd.addColorStop(1, 'rgba(10,8,7,.7)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    return tex(c, { repeat: [1, 1] });
  };
  return;
})();
