/* =========================================================================
   ASHTRAY MAZE — procedural surface library
   Every texture is generated at runtime; no external image assets.
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  var AM = window.AM;
  var TEX = (AM.TEX = {});
  var PAL = AM.PAL;
  var FONT_COND = '"Bahnschrift Condensed", "Arial Narrow", "Roboto Condensed", sans-serif';
  var FONT_MONO = '"Consolas", "Lucida Console", monospace';
  var FONT_SERIF = '"Times New Roman", "Georgia", serif';

  /* ---------- seeded value noise (wrapped) ---------- */
  function periodicGrid(seed, res) {
    var rnd = AM.rng(seed), v = new Float32Array(res * res);
    for (var i = 0; i < v.length; i++) v[i] = rnd();
    return function (x, y) {
      var fx = x * res, fy = y * res;
      var ix = Math.floor(fx), iy = Math.floor(fy);
      var tx = fx - ix, ty = fy - iy;
      var sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      var x0 = ((ix % res) + res) % res, x1 = (x0 + 1) % res;
      var y0 = ((iy % res) + res) % res, y1 = (y0 + 1) % res;
      var a = v[y0 * res + x0], b = v[y0 * res + x1];
      var c = v[y1 * res + x0], d = v[y1 * res + x1];
      return AM.lerp(AM.lerp(a, b, sx), AM.lerp(c, d, sx), sy);
    };
  }
  function fbm(seed, x, y) {
    if (!fbm.cache) fbm.cache = {};
    var key = seed;
    if (!fbm.cache[key]) {
      fbm.cache[key] = [periodicGrid(seed, 3), periodicGrid(seed + 7, 7), periodicGrid(seed + 17, 17), periodicGrid(seed + 31, 43), periodicGrid(seed + 47, 89)];
    }
    var g = fbm.cache[key];
    return g[0](x, y) * .4 + g[1](x, y) * .25 + g[2](x, y) * .18 + g[3](x, y) * .11 + g[4](x, y) * .06;
  }

  /* ---------- canvas drawing utilities ---------- */
  function makeCanvas(w, h) { return AM.canvas(w, h); }
  function setFont(ctx, size, weight, family) {
    ctx.font = (weight || 700) + ' ' + size + 'px ' + (family || FONT_COND);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function spacedText(ctx, text, x, y, spacing) {
    var chars = String(text).split('');
    var widths = [], total = 0;
    for (var i = 0; i < chars.length; i++) { var w = ctx.measureText(chars[i]).width; widths.push(w); total += w + spacing; }
    var cx = x;
    for (var j = 0; j < chars.length; j++) { ctx.fillText(chars[j], cx, y); cx += widths[j] + spacing; }
    return total - spacing;
  }
  function centerSpaced(ctx, text, cx, y, spacing, fill) {
    var old = ctx.fillStyle;
    var chars = String(text).split(''), widths = [], total = 0;
    for (var i = 0; i < chars.length; i++) { var w = ctx.measureText(chars[i]).width; widths.push(w); total += w + spacing; }
    total -= spacing;
    if (fill) ctx.fillStyle = fill;
    var x = cx - total * .5;
    for (var j = 0; j < chars.length; j++) { ctx.fillText(chars[j], x, y); x += widths[j] + spacing; }
    ctx.fillStyle = old;
  }
  function roundRect(ctx, x, y, w, h, r) { AM.roundRect(ctx, x, y, w, h, r); }
  function grunge(ctx, w, h, seed, amount, color) {
    var rnd = AM.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (var i = 0; i < amount; i++) {
      ctx.fillStyle = color || 'rgba(22,20,15,' + (.02 + rnd() * .05) + ')';
      var x = rnd() * w, y = rnd() * h, rw = 1 + rnd() * 28, rh = 1 + rnd() * 7;
      ctx.fillRect(x, y, rw, rh);
    }
    ctx.restore();
  }
  function vignette(ctx, w, h, strength) {
    var g = ctx.createRadialGradient(w * .5, h * .5, w * .12, w * .5, h * .5, w * .72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength === undefined ? .45 : strength) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function drawTriangleSeal(ctx, cx, cy, r, ink, line, filled) {
    ctx.save();
    ctx.strokeStyle = line; ctx.fillStyle = ink;
    ctx.lineWidth = Math.max(2, r * .045);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * .83, 0, Math.PI * 2); ctx.stroke();
    var tri = r * .56;
    ctx.beginPath();
    ctx.moveTo(cx, cy + tri);
    ctx.lineTo(cx - tri * .866, cy - tri * .5);
    ctx.lineTo(cx + tri * .866, cy - tri * .5);
    ctx.closePath();
    if (filled !== false) ctx.fill(); else ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + tri * .12, r * .12, 0, Math.PI * 2);
    ctx.fillStyle = line; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - r * .46, cy + r * .4); ctx.lineTo(cx + r * .46, cy + r * .4); ctx.stroke();
    ctx.restore();
  }

  /* =======================================================================
     CONCRETE
     ======================================================================= */
  function concreteTexture(seed, tone) {
    var S = 512;
    var c = makeCanvas(S, S), g = c.getContext('2d');
    var img = g.createImageData(S, S), d = img.data;
    var warm = tone === 'warm';
    var rnd = AM.rng(seed * 77 + 13);
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var u = x / S, v = y / S;
        var n = fbm(seed, u, v);
        var n2 = fbm(seed + 103, u * 1.3, v * .72);
        var grain = (AM.hash2(x + seed * 17, y - seed * 31) - .5) * .055;
        var l = .63 + (n - .5) * .17 + (n2 - .5) * .10 + grain;
        // occasional dark aggregate flecks and lime blooms
        if (AM.hash2(x * .73 + 9, y * 1.13 - seed * 3) > .987) l -= .10;
        if (AM.hash2(x * .31 - 4, y * .53 + seed * 9) > .994) l += .08;
        var r = l * (warm ? 1.075 : 1.0);
        var gg = l * (warm ? 1.02 : 1.0);
        var b = l * (warm ? .86 : .94);
        var i = (y * S + x) * 4;
        d[i] = Math.round(AM.clamp(r, 0, 1) * 255);
        d[i + 1] = Math.round(AM.clamp(gg, 0, 1) * 255);
        d[i + 2] = Math.round(AM.clamp(b, 0, 1) * 255);
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    // broad soot and damp patches
    for (var i = 0; i < 14; i++) {
      var cx = rnd() * S, cy = rnd() * S, rr = 25 + rnd() * 125;
      var gr = g.createRadialGradient(cx, cy, 1, cx, cy, rr);
      var dark = rnd() < .55;
      gr.addColorStop(0, dark ? 'rgba(24,30,26,' + (.035 + rnd() * .08) + ')' : 'rgba(226,220,197,' + (.025 + rnd() * .045) + ')');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    }
    // formwork/pour tide-lines
    g.save();
    g.globalCompositeOperation = 'multiply';
    for (var line = 0; line < 4; line++) {
      var yy = 60 + line * 123 + rnd() * 30;
      g.strokeStyle = 'rgba(73,77,69,' + (.045 + rnd() * .04) + ')';
      g.lineWidth = 1 + rnd() * 1.5;
      g.beginPath();
      for (var xx = 0; xx <= S; xx += 16) {
        g.lineTo(xx, yy + Math.sin(xx * .04 + line) * 1.7);
      }
      g.stroke();
    }
    g.restore();

    // hairline cracks
    g.save();
    g.strokeStyle = 'rgba(50,54,50,.18)';
    for (var k = 0; k < 6; k++) {
      var sx = rnd() * S, sy = rnd() * S, ang = rnd() * Math.PI * 2;
      g.lineWidth = .7 + rnd() * .7;
      g.beginPath(); g.moveTo(sx, sy);
      for (var seg = 0; seg < 6; seg++) {
        ang += (rnd() - .5) * .8;
        var len = 4 + rnd() * 20;
        sx += Math.cos(ang) * len; sy += Math.sin(ang) * len;
        g.lineTo(sx, sy);
      }
      g.stroke();
    }
    g.restore();

    // small pores / pits
    for (var p = 0; p < 380; p++) {
      var px = rnd() * S, py = rnd() * S, pr = .35 + rnd() * 1.25;
      g.fillStyle = 'rgba(39,43,38,' + (.06 + rnd() * .14) + ')';
      g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fill();
    }
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 8 });
  }

  /* =======================================================================
     METAL / WOOD / FABRIC / SMALL MATERIAL PLATES
     ======================================================================= */
  function metalTexture(seed) {
    var W = 512, H = 256;
    var c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#747b76'; g.fillRect(0, 0, W, H);
    var rnd = AM.rng(seed || 9);
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,255,245,.09)');
    grd.addColorStop(.44, 'rgba(255,255,245,.01)');
    grd.addColorStop(1, 'rgba(8,12,12,.2)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 1700; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < .5 ? '210,216,205' : '29,36,35') + ',' + (.025 + rnd() * .10) + ')';
      g.lineWidth = .6 + rnd() * 1.1;
      var y = rnd() * H;
      g.beginPath(); g.moveTo(rnd() * W, y); g.lineTo(rnd() * W, y + (rnd() - .5) * 2); g.stroke();
    }
    // scratches / wiped oil
    for (var s = 0; s < 26; s++) {
      g.strokeStyle = 'rgba(215,218,205,' + (.04 + rnd() * .12) + ')';
      g.lineWidth = .5 + rnd();
      g.beginPath();
      var x = rnd() * W, y = rnd() * H;
      g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 90, y + (rnd() - .5) * 8); g.stroke();
    }
    for (var d = 0; d < 50; d++) {
      var x2 = rnd() * W, y2 = rnd() * H;
      var gr = g.createRadialGradient(x2, y2, 0, x2, y2, 4 + rnd() * 24);
      gr.addColorStop(0, 'rgba(24,34,30,' + (.03 + rnd() * .08) + ')');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 8 });
  }

  function woodTexture(seed) {
    var S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#735238'; g.fillRect(0, 0, S, S);
    var rnd = AM.rng(seed || 41);
    for (var i = 0; i < 300; i++) {
      var y = rnd() * S;
      g.strokeStyle = 'rgba(' + (rnd() < .5 ? '42,27,18' : '187,146,96') + ',' + (.035 + rnd() * .11) + ')';
      g.lineWidth = .7 + rnd() * 3.0;
      g.beginPath();
      for (var x = 0; x <= S; x += 20) {
        g.lineTo(x, y + Math.sin(x * .018 + i) * (2 + rnd() * 6) + Math.sin(x * .05) * 1.3);
      }
      g.stroke();
    }
    for (var k = 0; k < 5; k++) {
      var cx = rnd() * S, cy = rnd() * S;
      for (var r = 2; r < 12; r += 2) {
        g.strokeStyle = 'rgba(39,24,15,.16)';
        g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(cx, cy, r * 1.7, r, .2, 0, Math.PI * 2); g.stroke();
      }
    }
    grunge(g, S, S, seed + 8, 130, 'rgba(27,18,13,.05)');
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 8 });
  }

  function floorTileTexture(seed) {
    var S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
    var rnd = AM.rng(seed || 23);
    var n = 4, cell = S / n;
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var alt = (x + y) % 2 === 0;
        g.fillStyle = alt ? '#a99e88' : '#4c544b';
        g.fillRect(x * cell, y * cell, cell, cell);
        g.fillStyle = alt ? 'rgba(238,230,205,.055)' : 'rgba(12,18,15,.08)';
        for (var sp = 0; sp < 80; sp++) {
          g.fillRect(x * cell + rnd() * cell, y * cell + rnd() * cell, 1 + rnd() * 3, 1 + rnd() * 2);
        }
        // scuffs
        for (var sc = 0; sc < 3; sc++) {
          g.strokeStyle = 'rgba(35,38,30,' + (.02 + rnd() * .035) + ')';
          g.lineWidth = 1 + rnd() * 2;
          g.beginPath();
          var sx = x * cell + rnd() * cell, sy = y * cell + rnd() * cell;
          g.moveTo(sx, sy); g.quadraticCurveTo(sx + 20, sy + rnd() * 16 - 8, sx + 30 + rnd() * cell * .4, sy + rnd() * 14 - 7); g.stroke();
        }
      }
    }
    g.strokeStyle = 'rgba(29,33,27,.44)'; g.lineWidth = 2;
    for (var i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, S); g.stroke();
      g.beginPath(); g.moveTo(0, i * cell); g.lineTo(S, i * cell); g.stroke();
    }
    grunge(g, S, S, seed + 12, 160, 'rgba(30,32,23,.04)');
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 8 });
  }

  function carpetTexture() {
    var S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#1d322d'; g.fillRect(0, 0, S, S);
    var rnd = AM.rng(92);
    for (var y = 0; y < S; y += 3) {
      for (var x = 0; x < S; x += 3) {
        g.fillStyle = 'rgba(' + (rnd() < .5 ? '116,129,94' : '10,22,20') + ',' + (.02 + rnd() * .11) + ')';
        g.fillRect(x, y, 1.8, 1.4);
      }
    }
    g.strokeStyle = 'rgba(185,151,83,.5)'; g.lineWidth = 13;
    g.strokeRect(26, 26, S - 52, S - 52);
    g.strokeStyle = 'rgba(185,151,83,.28)'; g.lineWidth = 3;
    g.strokeRect(50, 50, S - 100, S - 100);
    // central geometric mark
    g.save(); g.translate(S / 2, S / 2);
    g.strokeStyle = 'rgba(203,176,105,.20)'; g.lineWidth = 4;
    for (var k = 0; k < 4; k++) {
      g.rotate(Math.PI / 2);
      g.strokeRect(-64, -64, 128, 128);
    }
    g.restore();
    grunge(g, S, S, 43, 180, 'rgba(8,16,13,.07)');
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 8 });
  }

  function hazardTexture(seed) {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#d3ad45'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#171b17'; g.lineWidth = 58;
    for (var i = -S; i < S * 2; i += 110) {
      g.beginPath(); g.moveTo(i, S + 30); g.lineTo(i + S + 50, -30); g.stroke();
    }
    var rnd = AM.rng(seed || 5);
    for (var k = 0; k < 100; k++) {
      g.fillStyle = 'rgba(49,42,22,' + (.03 + rnd() * .10) + ')';
      g.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 20, 1 + rnd() * 4);
    }
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 6 });
  }

  function gratingTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#141b19'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#67716b'; g.lineWidth = 8;
    for (var i = -S; i < S * 2; i += 36) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
      g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke();
    }
    g.strokeStyle = '#3f4b45'; g.lineWidth = 3;
    for (var y = 0; y <= S; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    grunge(g, S, S, 18, 80, 'rgba(1,3,2,.20)');
    return AM.tex(c, { wrap: T.RepeatWrapping, aniso: 6 });
  }

  function smokeTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    var rnd = AM.rng(71);
    for (var i = 0; i < 34; i++) {
      var cx = S * .5 + (rnd() - .5) * S * .55;
      var cy = S * .5 + (rnd() - .5) * S * .55;
      var r = S * (.08 + rnd() * .24);
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, 'rgba(255,255,250,' + (.04 + rnd() * .05) + ')');
      gr.addColorStop(.55, 'rgba(240,240,230,' + (.015 + rnd() * .028) + ')');
      gr.addColorStop(1, 'rgba(240,240,230,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    }
    return AM.tex(c, { aniso: 4 });
  }

  function glowTexture(colorInner, colorOuter) {
    var S = 128, c = makeCanvas(S, S), g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, colorInner || 'rgba(255,255,240,1)');
    gr.addColorStop(.18, colorOuter || 'rgba(255,200,120,.6)');
    gr.addColorStop(.62, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return AM.tex(c, { aniso: 2 });
  }

  function glassGlintTexture() {
    var W = 512, H = 512, c = makeCanvas(W, H), g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    var grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(.05, 'rgba(255,255,255,0)');
    grad.addColorStop(.35, 'rgba(229,242,228,.10)');
    grad.addColorStop(.41, 'rgba(251,255,241,.24)');
    grad.addColorStop(.44, 'rgba(255,255,255,0)');
    grad.addColorStop(.7, 'rgba(255,255,255,.04)');
    grad.addColorStop(.79, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    var rnd = AM.rng(55);
    for (var i = 0; i < 30; i++) {
      g.strokeStyle = 'rgba(238,246,229,' + (.02 + rnd() * .055) + ')';
      g.lineWidth = .6 + rnd() * 1.4;
      g.beginPath();
      var x = rnd() * W, y = rnd() * H;
      g.moveTo(x, y); g.lineTo(x + (rnd() - .2) * 120, y - 15 - rnd() * 90); g.stroke();
    }
    for (var k = 0; k < 8; k++) {
      var cx = rnd() * W, cy = rnd() * H, r = 12 + rnd() * 60;
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, 'rgba(210,220,200,.025)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    return AM.tex(c, { aniso: 4 });
  }

  function crackedGlassTexture() {
    var S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.strokeStyle = 'rgba(236,247,232,.65)';
    g.lineWidth = 1.2;
    g.beginPath(); g.arc(S * .58, S * .42, 8, 0, Math.PI * 2); g.stroke();
    var rnd = AM.rng(120);
    for (var i = 0; i < 19; i++) {
      var a = rnd() * Math.PI * 2;
      var len = 25 + rnd() * 190;
      var x0 = S * .58, y0 = S * .42;
      g.beginPath(); g.moveTo(x0 + Math.cos(a) * 7, y0 + Math.sin(a) * 7);
      var segs = 4 + Math.floor(rnd() * 4);
      for (var s = 0; s < segs; s++) {
        a += (rnd() - .5) * .45;
        x0 += Math.cos(a) * len / segs;
        y0 += Math.sin(a) * len / segs;
        g.lineTo(x0, y0);
      }
      g.strokeStyle = 'rgba(235,247,232,' + (.16 + rnd() * .3) + ')';
      g.stroke();
    }
    return AM.tex(c, { aniso: 4 });
  }

  /* =======================================================================
     SIGNS, PLAQUES, STENCILS
     ======================================================================= */
  function signPanel(opts) {
    var W = 1024, H = 512;
    var c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = opts.bg || '#141915'; g.fillRect(0, 0, W, H);
    var rnd = AM.rng(opts.seed || 1);
    // brushed metal grain / paint tooth
    for (var i = 0; i < 1600; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (rnd() * .012) + ')';
      g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 12, 1);
    }
    // border
    if (opts.border !== false) {
      g.strokeStyle = opts.borderColor || 'rgba(196,184,145,.48)';
      g.lineWidth = 5;
      g.strokeRect(24, 24, W - 48, H - 48);
      g.lineWidth = 1.5;
      g.strokeRect(38, 38, W - 76, H - 76);
    }
    // header strip
    if (opts.stripe) {
      g.fillStyle = opts.stripe;
      g.fillRect(24, 24, W - 48, 54);
      g.fillStyle = opts.stripeText || '#171b16';
      setFont(g, 32, 700, FONT_COND);
      spacedText(g, opts.stripeLabel || '', 52, 63, 3.4);
    }
    // hazard band
    if (opts.hazard) {
      g.save();
      g.beginPath(); g.rect(24, H - 96, W - 48, 54); g.clip();
      g.fillStyle = '#d6ad3f'; g.fillRect(24, H - 96, W - 48, 54);
      for (var x = -100; x < W + 100; x += 84) {
        g.fillStyle = '#171a16';
        g.beginPath(); g.moveTo(x, H - 42); g.lineTo(x + 46, H - 96); g.lineTo(x + 84, H - 96); g.lineTo(x + 38, H - 42); g.closePath(); g.fill();
      }
      g.restore();
    }
    var y = opts.titleY || 185;
    if (opts.kicker) {
      g.fillStyle = opts.kickerColor || '#aab59c';
      setFont(g, 28, 600, FONT_COND);
      spacedText(g, opts.kicker, 60, y - 78, 4.5);
    }
    if (opts.title) {
      g.fillStyle = opts.titleColor || '#e2dcc4';
      setFont(g, opts.titleSize || 112, 800, FONT_COND);
      g.fillText(opts.title, 58, y);
      if (opts.title2) g.fillText(opts.title2, 58, y + (opts.title2Offset || 104));
    }
    if (opts.subtitle) {
      var lines = [].concat(opts.subtitle);
      g.fillStyle = opts.subtitleColor || 'rgba(214,208,182,.8)';
      setFont(g, 27, 500, FONT_COND);
      var subY = y + (opts.title2 ? 190 : (opts.subtitleOffset || 78));
      for (var l = 0; l < lines.length; l++) {
        spacedText(g, lines[l], 60, subY + l * 38, 2.2);
      }
    }
    // seal / symbol on the right
    if (opts.seal) {
      drawTriangleSeal(g, W - 183, y - 35, 110, 'rgba(0,0,0,0)', 'rgba(198,187,147,.6)', false);
      g.fillStyle = 'rgba(0,0,0,0)';
    }
    if (opts.icon === 'warn') {
      g.save();
      g.translate(838, 260);
      g.fillStyle = '#d5ad3f';
      g.beginPath(); g.moveTo(0, -92); g.lineTo(92, 76); g.lineTo(-92, 76); g.closePath(); g.fill();
      g.fillStyle = '#141814'; setFont(g, 132, 800, FONT_COND); g.textAlign = 'center'; g.fillText('!', 0, 52); g.textAlign = 'left';
      g.restore();
    }
    if (opts.icon === 'arrow') {
      g.save();
      g.strokeStyle = '#d5ad3f'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(780, 268); g.lineTo(930, 268); g.stroke();
      g.beginPath(); g.moveTo(892, 224); g.lineTo(946, 268); g.lineTo(892, 312); g.stroke();
      g.restore();
    }
    if (opts.footer) {
      g.fillStyle = 'rgba(189,184,155,.62)';
      setFont(g, 23, 500, FONT_COND);
      spacedText(g, opts.footer, 60, H - 54, 2.6);
    }
    if (opts.screws !== false) {
      var pts = [[27, 27], [W - 27, 27], [27, H - 27], [W - 27, H - 27]];
      for (var p = 0; p < pts.length; p++) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(pts[p][0], pts[p][1], 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(191,190,170,.4)'; g.beginPath(); g.arc(pts[p][0] - 1, pts[p][1] - 1, 4, 0, Math.PI * 2); g.fill();
      }
    }
    grunge(g, W, H, (opts.seed || 1) + 8, 180, 'rgba(20,18,12,.05)');
    return AM.tex(c, { aniso: 8 });
  }

  function stencilTexture(text, opts) {
    opts = opts || {};
    var W = 1024, H = opts.h || 512;
    var c = makeCanvas(W, H), g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = opts.color || 'rgba(221,212,182,.85)';
    var size = opts.size || 300;
    setFont(g, size, 800, FONT_COND);
    var tw = g.measureText(text).width;
    var scale = Math.min(1, (W - 80) / tw);
    g.save();
    g.translate(W / 2, H / 2);
    g.scale(scale, 1);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (opts.letterspace) {
      centerSpaced(g, text, 0, 0, opts.letterspace, opts.color || 'rgba(221,212,182,.85)');
    } else {
      g.fillText(text, 0, 0);
    }
    g.restore();
    if (opts.sub) {
      g.fillStyle = opts.subColor || opts.color || 'rgba(221,212,182,.65)';
      setFont(g, 54, 500, FONT_COND);
      g.textAlign = 'center'; g.fillText(opts.sub, W / 2, H * .82); g.textAlign = 'left';
    }
    // stencil bridges / chipped paint
    g.globalCompositeOperation = 'destination-out';
    var rnd = AM.rng(opts.seed || 44);
    g.fillStyle = 'rgba(0,0,0,1)';
    if (opts.stencilBridges) {
      for (var b = 0; b < 7; b++) g.fillRect(80 + rnd() * (W - 160), 40 + rnd() * (H - 80), 5 + rnd() * 14, H * .1 + rnd() * 60);
    }
    var holes = opts.wear === undefined ? 380 : opts.wear;
    for (var i = 0; i < holes; i++) {
      g.beginPath();
      g.arc(rnd() * W, rnd() * H, .5 + rnd() * (opts.wearSize || 2.2), 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    return AM.tex(c, { aniso: 4 });
  }

  function plaqueTexture() {
    var W = 1024, H = 256;
    var c = makeCanvas(W, H), g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#8b6f3d');
    grad.addColorStop(.25, '#c4a460');
    grad.addColorStop(.6, '#9f8049');
    grad.addColorStop(1, '#6d5228');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(52,37,16,.75)'; g.lineWidth = 5; g.strokeRect(20, 20, W - 40, H - 40);
    g.strokeStyle = 'rgba(236,207,143,.45)'; g.lineWidth = 1.5; g.strokeRect(33, 33, W - 66, H - 66);
    g.fillStyle = '#2d2110';
    setFont(g, 34, 700, FONT_COND);
    spacedText(g, 'FEDERAL BUREAU OF CONTROL', 64, 78, 5.5);
    setFont(g, 78, 800, FONT_COND);
    spacedText(g, 'ASH TRAY MAZE', 62, 157, 2.5);
    setFont(g, 28, 600, FONT_COND);
    g.fillStyle = 'rgba(44,32,15,.85)';
    spacedText(g, 'OBSERVATION MODEL  ·  SECTOR A-07  ·  REV. IV', 64, 208, 3.2);
    drawTriangleSeal(g, W - 118, 124, 66, 'rgba(0,0,0,0)', 'rgba(55,40,18,.85)', false);
    // screws
    [[31, 31], [W - 31, 31], [31, H - 31], [W - 31, H - 31]].forEach(function (p) {
      g.fillStyle = 'rgba(31,23,11,.8)'; g.beginPath(); g.arc(p[0], p[1], 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(220,192,130,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0] - 5, p[1]); g.lineTo(p[0] + 5, p[1]); g.stroke();
    });
    grunge(g, W, H, 6, 80, 'rgba(25,15,4,.05)');
    return AM.tex(c, { aniso: 8 });
  }

  function yellowStickerTexture(text, sub, seed) {
    var W = 512, H = 512, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#d3ad3d'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(24,27,21,.7)'; g.lineWidth = 8; g.strokeRect(18, 18, W - 36, H - 36);
    g.fillStyle = '#1a1e18';
    setFont(g, 92, 800, FONT_COND);
    g.textAlign = 'center'; g.fillText(text, W / 2, H * .48);
    setFont(g, 42, 600, FONT_COND);
    g.fillText(sub || '', W / 2, H * .67);
    g.textAlign = 'left';
    grunge(g, W, H, seed || 4, 120, 'rgba(33,29,16,.06)');
    return AM.tex(c, { aniso: 4 });
  }

  function noSmokingTexture() {
    var W = 512, H = 512, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#d8d1b7'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#34382e'; g.lineWidth = 8; g.strokeRect(18, 18, W - 36, H - 36);
    g.fillStyle = '#282d24';
    setFont(g, 68, 800, FONT_COND); g.textAlign = 'center';
    g.fillText('NO', W / 2, 100);
    g.fillText('SMOKING', W / 2, 174);
    // cigarette + ban ring
    g.save(); g.translate(W / 2, 312);
    g.strokeStyle = '#9b3a2a'; g.lineWidth = 18;
    g.beginPath(); g.arc(0, 0, 114, 0, Math.PI * 2); g.stroke();
    g.rotate(-.45);
    g.fillStyle = '#e6ddc2'; g.fillRect(-102, -16, 204, 32);
    g.fillStyle = '#a66e36'; g.fillRect(-102, -16, 42, 32);
    g.fillStyle = '#a73b2a'; g.fillRect(66, -16, 36, 32);
    g.restore();
    g.strokeStyle = '#9b3a2a'; g.lineWidth = 14; g.beginPath(); g.moveTo(W / 2 - 82, 230); g.lineTo(W / 2 + 82, 394); g.stroke();
    g.fillStyle = '#3a3e33'; setFont(g, 36, 500, FONT_COND);
    g.fillText('THANK YOU FOR NOT SMOKING', W / 2, 472);
    g.textAlign = 'left';
    grunge(g, W, H, 57, 140, 'rgba(50,40,22,.05)');
    return AM.tex(c, { aniso: 4 });
  }

  function directoryTexture() {
    var W = 512, H = 768, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#17201b'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(177,190,151,.4)'; g.lineWidth = 3; g.strokeRect(18, 18, W - 36, H - 36);
    g.fillStyle = 'rgba(199,212,172,.8)';
    setFont(g, 32, 700, FONT_COND);
    spacedText(g, 'DIRECTORY', 44, 76, 5);
    g.fillStyle = 'rgba(211,195,127,.7)'; g.fillRect(44, 104, W - 88, 2);
    var rows = [
      ['A-01', 'ATRIUM / TRANSIT'],
      ['A-02', 'CONCRETE LAB'],
      ['A-03', 'A.W.E. ARCHIVE'],
      ['A-04', 'THERMAL PLANT'],
      ['A-05', 'DEAD MAIL'],
      ['A-06', 'LATENCY'],
      ['A-07', 'OBSERVATION'],
      ['A-08', 'NO ACCESS'],
      ['A-09', 'NO ACCESS']
    ];
    for (var i = 0; i < rows.length; i++) {
      var y = 170 + i * 61;
      g.fillStyle = i === 6 ? 'rgba(246,205,113,.92)' : 'rgba(194,204,172,.62)';
      setFont(g, 34, 600, FONT_MONO);
      g.fillText(rows[i][0], 46, y);
      setFont(g, 28, 500, FONT_COND);
      g.fillText(rows[i][1], 200, y);
      g.fillStyle = 'rgba(164,187,153,.16)'; g.fillRect(44, y + 20, W - 88, 1);
    }
    g.fillStyle = 'rgba(191,177,127,.75)'; setFont(g, 26, 600, FONT_COND);
    g.fillText('MAZE RECONFIGURATION IN PROGRESS', 44, H - 54);
    g.strokeStyle = 'rgba(203,170,83,.5)'; g.lineWidth = 2; g.strokeRect(44, H - 86, W - 88, 44);
    vignette(g, W, H, .4);
    return AM.tex(c, { aniso: 4 });
  }

  /* =======================================================================
     FBC SEALS / DECALS / BOX LABELS
     ======================================================================= */
  function sealTexture(bg, ink, line, transparent) {
    var S = 1024, c = makeCanvas(S, S), g = c.getContext('2d');
    if (!transparent) { g.fillStyle = bg || '#141814'; g.fillRect(0, 0, S, S); }
    else g.clearRect(0, 0, S, S);
    drawTriangleSeal(g, S / 2, S / 2 - 20, 360, ink || '#171b17', line || 'rgba(201,188,145,.8)', true);
    g.textAlign = 'center';
    g.fillStyle = line || 'rgba(201,188,145,.8)';
    setFont(g, 42, 700, FONT_COND);
    spacedText(g, 'FEDERAL BUREAU OF CONTROL', S / 2 - 310, S - 88, 3.1);
    setFont(g, 28, 500, FONT_COND);
    g.fillStyle = line || 'rgba(201,188,145,.55)';
    g.fillText('A  W  E   /   D I V I S I O N   O F   C O N T R O L', S / 2, S - 42);
    g.textAlign = 'left';
    grunge(g, S, S, 31, 230, 'rgba(15,18,14,.05)');
    return AM.tex(c, { aniso: 8 });
  }

  function boxLabelTexture(variant) {
    var S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#d3c8a5'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(49,45,34,.5)'; g.lineWidth = 3; g.strokeRect(18, 18, S - 36, S - 36);
    g.fillStyle = '#28291f'; setFont(g, 36, 800, FONT_COND);
    g.fillText('F.B.C.  /  A.W.E.', 34, 68);
    g.fillStyle = '#8e2d22'; g.fillRect(34, 86, S - 68, 12);
    g.fillStyle = '#25271e'; setFont(g, 28, 600, FONT_MONO);
    g.fillText('CASE ' + (4000 + variant * 137 + 19), 34, 136);
    g.fillText('CLEARANCE  /  Δ4', 34, 174);
    g.fillText('DO NOT OPEN', 34, 212);
    // redaction
    g.fillStyle = '#1d211a'; g.fillRect(34, 244, 260 + variant * 20, 30);
    // occult glyph
    g.save(); g.translate(S * .5, S * .72);
    g.strokeStyle = '#24271e'; g.lineWidth = 6;
    if (variant === 0) {
      for (var r = 25; r < 150; r += 22) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
      g.beginPath(); g.moveTo(0, -150); g.lineTo(130, 80); g.lineTo(-130, 80); g.closePath(); g.stroke();
    } else if (variant === 1) {
      for (var i = 0; i < 8; i++) {
        g.rotate(Math.PI / 4);
        g.beginPath(); g.ellipse(0, 0, 150, 42, 0, 0, Math.PI * 2); g.stroke();
      }
    } else if (variant === 2) {
      for (var j = 0; j < 5; j++) {
        g.beginPath();
        var a0 = j * 1.35, rr = 140 - j * 18;
        for (var s = 0; s < 3; s++) {
          var a = a0 + s * 2.1;
          g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.closePath(); g.stroke();
      }
      g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fillStyle = '#24271e'; g.fill();
    } else {
      g.beginPath();
      for (var k = 0; k < 24; k++) {
        var a2 = k * .62, rr2 = k % 2 === 0 ? 150 : 17;
        g.lineTo(Math.cos(a2) * rr2, Math.sin(a2) * rr2);
      }
      g.closePath(); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(28,30,23,.6)'; setFont(g, 20, 500, FONT_MONO);
    g.fillText('/ / /  RESTRICTED  / / /', 34, S - 30);
    grunge(g, S, S, 70 + variant, 80, 'rgba(48,41,25,.06)');
    return AM.tex(c, { aniso: 8 });
  }

  function paperTexture(variant) {
    var W = 512, H = 680, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = variant === 2 ? '#c5c7b1' : '#d8d1ba'; g.fillRect(0, 0, W, H);
    var rnd = AM.rng(10 + variant * 31);
    g.strokeStyle = 'rgba(48,51,42,.32)'; g.lineWidth = 2;
    g.strokeRect(38, 38, W - 76, H - 76);
    g.fillStyle = 'rgba(47,49,39,.8)';
    setFont(g, 30, 700, FONT_MONO);
    var header = ['FORM 37-A / INCIDENT', 'AWE OBSERVATION LOG', 'REQUISITION / OPTICS'][variant % 3];
    g.fillText(header, 58, 92);
    g.fillStyle = 'rgba(151,53,40,.8)'; g.fillRect(58, 110, 170, 9);
    g.fillStyle = 'rgba(55,58,45,.55)'; setFont(g, 18, 500, FONT_MONO);
    for (var i = 0; i < 18; i++) {
      var y = 158 + i * 26;
      var len = 260 + rnd() * 160;
      g.fillRect(58, y, len, 2);
    }
    // red stamp
    g.save();
    g.translate(W - 142, H - 148); g.rotate(-.18);
    g.strokeStyle = 'rgba(154,54,39,.7)'; g.lineWidth = 6;
    g.strokeRect(-98, -34, 196, 68);
    g.fillStyle = 'rgba(154,54,39,.7)'; setFont(g, 28, 800, FONT_COND);
    g.textAlign = 'center'; g.fillText(variant === 1 ? 'REVIEWED' : 'CLASSIFIED', 0, 10);
    g.textAlign = 'left'; g.restore();
    // punch holes
    g.fillStyle = 'rgba(38,39,31,.24)';
    for (var h = 0; h < 3; h++) { g.beginPath(); g.arc(W - 72, 120 + h * 54, 9, 0, Math.PI * 2); g.fill(); }
    grunge(g, W, H, 22 + variant, 100, 'rgba(45,42,27,.05)');
    return AM.tex(c, { aniso: 4 });
  }

  function punchCardTexture() {
    var W = 320, H = 190, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#cfc2a1'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(43,47,36,.6)';
    g.fillRect(0, 18, W, 2); g.fillRect(0, H - 28, W, 2);
    g.fillStyle = 'rgba(40,43,34,.72)'; setFont(g, 13, 600, FONT_MONO);
    g.fillText('FBC / A-07 / SEQUENCE', 12, 13);
    var rnd = AM.rng(77);
    for (var y = 0; y < 7; y++) {
      for (var x = 0; x < 28; x++) {
        if (rnd() > .78) {
          g.fillStyle = 'rgba(25,27,21,.9)';
          g.fillRect(12 + x * 10.6, 38 + y * 16, 4, 7);
        }
      }
    }
    return AM.tex(c, { aniso: 2 });
  }

  function cardLabelTexture(name, color) {
    var W = 512, H = 256, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = color || '#9f8a55'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(38,34,24,.86)'; setFont(g, 58, 800, FONT_COND);
    g.fillText(name, 32, 104);
    g.fillStyle = 'rgba(37,34,25,.45)'; g.fillRect(32, 132, W - 64, 3);
    g.fillStyle = 'rgba(37,34,25,.64)'; setFont(g, 30, 500, FONT_MONO);
    g.fillText('F.B.C.  ARCHIVE', 32, 190);
    return AM.tex(c, { aniso: 4 });
  }

  /* =======================================================================
     CRT CONTENT + SHADER
     ======================================================================= */
  function crtBase(variant) {
    var W = 512, H = 384, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#07100c'; g.fillRect(0, 0, W, H);
    var rnd = AM.rng(100 + variant * 17);
    if (variant === 0) {
      // maze plan
      g.strokeStyle = 'rgba(104,196,119,.20)'; g.lineWidth = 1;
      for (var x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (var y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.strokeStyle = 'rgba(154,238,157,.9)'; g.lineWidth = 5;
      var walls = [[50, 70, 280, 70], [280, 70, 280, 210], [280, 210, 390, 210], [390, 210, 390, 310], [390, 310, 120, 310], [120, 310, 120, 190], [120, 190, 210, 190], [210, 190, 210, 130], [210, 130, 50, 130], [50, 130, 50, 70]];
      g.beginPath(); walls.forEach(function (w, i) { if (i === 0) g.moveTo(w[0], w[1]); else g.lineTo(w[0], w[1]); }); g.stroke();
      g.strokeStyle = 'rgba(190,71,49,.9)'; g.lineWidth = 2;
      g.beginPath(); g.arc(212, 190, 26, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(154,238,157,.9)'; setFont(g, 24, 600, FONT_MONO);
      g.fillText('A-07 / MAZE PLAN', 28, 36);
      g.textAlign = 'right'; g.fillText('LIVE', W - 28, 36); g.textAlign = 'left';
      g.fillStyle = 'rgba(189,236,160,.45)'; setFont(g, 15, 500, FONT_MONO);
      g.fillText('ELEV  -04.20', 28, H - 28);
      g.fillText('RECIRC  7.377Hz', W - 168, H - 28);
    } else if (variant === 1) {
      // security feed of a slot corridor
      var grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, 'rgba(40,58,42,.36)');
      grd.addColorStop(.4, 'rgba(9,18,12,.1)');
      grd.addColorStop(1, 'rgba(4,9,7,.1)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(165,204,156,.26)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(208, 118); g.lineTo(208, 284); g.lineTo(0, H); g.stroke();
      g.beginPath(); g.moveTo(W, 0); g.lineTo(310, 128); g.lineTo(310, 262); g.lineTo(W, H); g.stroke();
      g.fillStyle = 'rgba(203,223,164,.1)';
      g.fillRect(208, 128, 102, 112);
      g.strokeStyle = 'rgba(217,231,178,.65)'; g.lineWidth = 3;
      g.strokeRect(218, 156, 82, 164);
      g.strokeStyle = 'rgba(166,206,150,.22)';
      for (var i = 0; i < 7; i++) { g.beginPath(); g.moveTo(220 + i * 13, 0); g.lineTo(220 + i * 13, H); g.stroke(); }
      var gr = g.createRadialGradient(262, 205, 5, 262, 205, 120);
      gr.addColorStop(0, 'rgba(230,244,194,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(190,231,167,.75)'; setFont(g, 19, 600, FONT_MONO);
      g.fillText('CAM 03   B-04', 24, 32);
      g.fillText('00:03:16:07', W - 160, H - 26);
      g.strokeStyle = 'rgba(196,227,152,.25)'; g.strokeRect(24, 48, W - 48, H - 88);
      for (var n = 0; n < 500; n++) { g.fillStyle = 'rgba(185,225,170,' + (rnd() * .06) + ')'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1); }
    } else if (variant === 2) {
      // oscilloscope
      g.fillStyle = '#11160b'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(153,189,89,.18)'; g.lineWidth = 1;
      for (var x2 = 0; x2 < W; x2 += 32) { g.beginPath(); g.moveTo(x2, 0); g.lineTo(x2, H); g.stroke(); }
      for (var y2 = 0; y2 < H; y2 += 32) { g.beginPath(); g.moveTo(0, y2); g.lineTo(W, y2); g.stroke(); }
      g.strokeStyle = 'rgba(196,235,131,.85)'; g.lineWidth = 3;
      g.beginPath();
      for (var px = 0; px < W; px++) {
        var amp = Math.sin(px * .022) * 52 + Math.sin(px * .073 + 1.2) * 19 + (AM.hash2(px, 2) - .5) * 5;
        g.lineTo(px, H * .5 + amp);
      }
      g.stroke();
      g.strokeStyle = 'rgba(216,76,48,.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, H * .3); g.lineTo(W, H * .3); g.stroke();
      g.fillStyle = 'rgba(197,226,137,.8)'; setFont(g, 19, 600, FONT_MONO);
      g.fillText('Δ FOURIER / 7.377 Hz', 24, 30);
      g.textAlign = 'right'; g.fillText('RANGE ±40', W - 24, H - 24); g.textAlign = 'left';
    } else if (variant === 3) {
      // terminal log
      g.fillStyle = '#071009'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(178,230,153,.86)';
      setFont(g, 17, 500, FONT_MONO);
      var lines = [
        'FBC // AWE OPERATIONS',
        '> SECTOR A-07  MAZE DAEMON',
        '> HANDSHAKE ............ OK',
        '> CONCRETE ARRAY  14/14',
        '> GEOMETRY DRIFT  +0.043',
        '> HALL SHIFT PENDING 03',
        '> HOTLINE ................ 5',
        '> OBSERVATION DOOR ..... OPEN',
        '> WARNING: RECURSIVE LOOP',
        '> REROUTE / REROUTE / ...',
        '> NODE 07  AWAITING ORDER',
        '> PLAYBACK  [|||||||||--]',
        '> PLAY  SIDE B',
        '> END OF RECORD'
      ];
      for (var l = 0; l < lines.length; l++) {
        g.fillStyle = l === lines.length - 1 ? 'rgba(220,159,89,.9)' : 'rgba(178,230,153,' + (.5 + (l % 3) * .1) + ')';
        g.fillText(lines[l], 28, 55 + l * 24);
      }
      g.fillStyle = 'rgba(180,228,147,.72)'; g.fillRect(28, H - 52, 176, 18);
      g.fillStyle = '#08100a'; g.fillRect(32, H - 49, 86, 12);
    } else if (variant === 4) {
      // impossible geometry study
      g.fillStyle = '#070d0d'; g.fillRect(0, 0, W, H);
      g.save(); g.translate(W * .5, H * .5);
      g.strokeStyle = 'rgba(194,227,155,.52)'; g.lineWidth = 2;
      for (var ring = 0; ring < 5; ring++) {
        g.beginPath(); g.ellipse(0, 0, 105 + ring * 22, 28 + ring * 6, ring * .23, 0, Math.PI * 2); g.stroke();
      }
      g.strokeStyle = 'rgba(224,185,112,.75)'; g.lineWidth = 3;
      var bh = 98;
      var pts = [[0, -bh], [86, bh * .6], [-86, bh * .6]];
      for (var e = 0; e < 3; e++) {
        g.beginPath(); g.moveTo(pts[e][0], pts[e][1]); g.lineTo(pts[(e + 1) % 3][0], pts[(e + 1) % 3][1]); g.stroke();
        g.beginPath(); g.moveTo(0, 0); g.lineTo(pts[e][0], pts[e][1]); g.stroke();
      }
      g.beginPath(); g.arc(0, 0, 13, 0, Math.PI * 2); g.stroke();
      g.restore();
      g.fillStyle = 'rgba(191,224,162,.6)'; setFont(g, 18, 600, FONT_MONO);
      g.fillText('GEOMETRY / NON-EUCLIDEAN', 22, 28);
      g.textAlign = 'right'; g.fillText('PLATE 19', W - 22, H - 22); g.textAlign = 'left';
    } else {
      // dead channel
      for (var sx = 0; sx < W; sx += 2) {
        for (var sy = 0; sy < H; sy += 2) {
          var v = 30 + Math.floor(rnd() * 120);
          g.fillStyle = 'rgb(' + v + ',' + (v + 4) + ',' + (v - 2) + ')';
          g.fillRect(sx, sy, 2, 2);
        }
      }
      g.fillStyle = 'rgba(235,235,215,.6)'; setFont(g, 28, 600, FONT_MONO);
      g.fillText('NO SIGNAL', 24, 45);
      g.fillStyle = 'rgba(221,87,55,.8)'; g.beginPath(); g.arc(W - 32, 34, 8, 0, Math.PI * 2); g.fill();
    }
    vignette(g, W, H, .5);
    return AM.tex(c, { aniso: 2, srgb: false });
  }

  function crtMaterial(texture, opts) {
    opts = opts || {};
    var mat = new T.ShaderMaterial({
      uniforms: {
        tMap: { value: texture },
        uTime: { value: 0 },
        uSeed: { value: opts.seed || 1 },
        uPower: { value: opts.power === undefined ? 1.25 : opts.power },
        uTint: { value: new T.Color(opts.tint === undefined ? 0xffffff : opts.tint) },
        uScan: { value: opts.scan === undefined ? .16 : opts.scan }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform sampler2D tMap;',
        'uniform float uTime,uSeed,uPower,uScan;',
        'uniform vec3 uTint;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'void main(){',
        '  vec2 uv = vUv;',
        '  float tick = floor(uTime * 16.0 + uSeed * 3.0);',
        '  float glitch = step(.965, hash(vec2(tick, uSeed)));',
        '  float band = step(.968, hash(vec2(floor(uTime * 2.0), uSeed + 8.0)));',
        '  if(glitch > .5){',
        '    float line = step(.82, hash(vec2(floor(uv.y * 38.0), tick)));',
        '    uv.x += line * (.003 + .012 * band);',
        '  }',
        '  vec3 col = texture2D(tMap, uv).rgb * uTint;',
        '  float flicker = .93 + .07 * hash(vec2(floor(uTime*10.0), uSeed + 1.0));',
        '  float scan = .82 + uScan * sin(uv.y * 520.0 + uTime * 2.0);',
        '  float roll = smoothstep(.955, 1.0, fract(uv.y * .64 - uTime * .078 + uSeed * .17));',
        '  col *= flicker * scan;',
        '  col += col * roll * .34;',
        '  vec2 q = uv - .5;',
        '  col *= 1.0 - dot(q, q) * .9;',
        '  col += vec3(.02,.035,.022) * (1.0 - smoothstep(.0,.34,length(q)));',
        '  gl_FragColor = vec4(col * uPower, 1.0);',
        '}'
      ].join('\n'),
      toneMapped: false,
      fog: false,
      depthWrite: true
    });
    AM.screenMats.push(mat);
    return mat;
  }
  AM.crtMaterial = crtMaterial;

  /* =======================================================================
     SMALL DETAIL DECALS
     ======================================================================= */
  function tapeLabelTexture(text) {
    var W = 256, H = 128, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#c1b18c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1e211a'; setFont(g, 34, 700, FONT_MONO);
    g.fillText(text || 'SIDE A', 18, 48);
    g.fillStyle = 'rgba(32,35,28,.5)'; setFont(g, 21, 500, FONT_COND);
    g.fillText('F.B.C. / RECOLLECTION', 18, 84);
    g.fillStyle = 'rgba(142,47,34,.8)'; g.fillRect(18, 96, 120, 5);
    return AM.tex(c, { aniso: 2 });
  }

  function keypadTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#242b27'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(214,184,99,.4)'; g.lineWidth = 2; g.strokeRect(8, 8, S - 16, S - 16);
    for (var r = 0; r < 4; r++) {
      for (var cI = 0; cI < 3; cI++) {
        var x = 36 + cI * 64, y = 36 + r * 48;
        g.fillStyle = '#a8a08a'; roundRect(g, x, y, 44, 34, 5); g.fill();
        g.fillStyle = 'rgba(33,36,28,.5)'; g.fillRect(x + 6, y + 10, 32, 3);
      }
    }
    g.fillStyle = 'rgba(193,224,149,.5)'; g.fillRect(36, 12, 58, 12);
    return AM.tex(c, { aniso: 2 });
  }

  function arrowTexture(label) {
    var W = 512, H = 256, c = makeCanvas(W, H), g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(217,184,94,.82)'; g.fillStyle = 'rgba(217,184,94,.82)'; g.lineWidth = 12;
    g.beginPath(); g.moveTo(76, 128); g.lineTo(336, 128); g.stroke();
    g.beginPath(); g.moveTo(300, 58); g.lineTo(398, 128); g.lineTo(300, 198); g.stroke();
    if (label) {
      setFont(g, 42, 700, FONT_COND); g.textAlign = 'center';
      g.fillText(label, 210, 70);
      g.textAlign = 'left';
    }
    var rnd = AM.rng(4);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 100; i++) { g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 8, 0, Math.PI * 2); g.fill(); }
    return AM.tex(c, { aniso: 4 });
  }

  function numberStencilTexture(text) {
    var W = 512, H = 512, c = makeCanvas(W, H), g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(217,204,164,.6)';
    setFont(g, 430, 800, FONT_COND);
    g.textAlign = 'center'; g.fillText(text, W / 2, H * .72); g.textAlign = 'left';
    g.globalCompositeOperation = 'destination-out';
    var rnd = AM.rng(3);
    for (var i = 0; i < 280; i++) { g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 7, 0, Math.PI * 2); g.fill(); }
    return AM.tex(c, { aniso: 4 });
  }

  function rustStainTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    var rnd = AM.rng(61);
    for (var i = 0; i < 26; i++) {
      var x = S * .5 + (rnd() - .5) * 90, y = S * .38 + (rnd() - .5) * 80;
      var r = 8 + rnd() * 42;
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(' + (72 + rnd() * 38) + ',' + (41 + rnd() * 22) + ',24,' + (.08 + rnd() * .14) + ')');
      gr.addColorStop(1, 'rgba(80,45,25,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    }
    return AM.tex(c, { aniso: 4 });
  }

  function noteTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,214,136,.9)';
    g.fillStyle = 'rgba(255,214,136,.9)';
    g.lineWidth = 8;
    g.beginPath(); g.ellipse(S * .38, S * .67, 30, 21, -.28, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(S * .57, S * .64); g.lineTo(S * .57, S * .2); g.stroke();
    g.beginPath();
    g.moveTo(S * .57, S * .2);
    g.bezierCurveTo(S * .82, S * .24, S * .82, S * .42, S * .57, S * .5);
    g.stroke();
    var gr = g.createRadialGradient(S * .5, S * .5, 2, S * .5, S * .5, S * .5);
    gr.addColorStop(0, 'rgba(255,207,122,.18)'); gr.addColorStop(1, 'rgba(255,177,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return AM.tex(c, { aniso: 4 });
  }

  function fluorescentLabelTexture() {
    var W = 512, H = 160, c = makeCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#161d17'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(200,219,147,.4)'; g.lineWidth = 2; g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = 'rgba(213,235,160,.85)'; setFont(g, 54, 700, FONT_COND);
    spacedText(g, 'OBSERVATION  A-07', 28, 95, 3);
    g.fillStyle = 'rgba(213,235,160,.4)'; setFont(g, 22, 500, FONT_COND);
    g.fillText('FEDERAL BUREAU OF CONTROL  /  RESTRICTED', 30, 128);
    return AM.tex(c, { aniso: 4 });
  }

  /* =======================================================================
     BUILD
     ======================================================================= */
  AM.buildTextures = function () {
    AM.screenMats = [];
    TEX.concrete = concreteTexture(31, 'cool');
    TEX.concreteB = concreteTexture(77, 'warm');
    TEX.metal = metalTexture(9);
    TEX.wood = woodTexture(88);
    TEX.interiorFloor = floorTileTexture(16);
    TEX.carpet = carpetTexture();
    TEX.hazard = hazardTexture(5);
    TEX.grate = gratingTexture();
    TEX.smoke = smokeTexture();
    TEX.glowWarm = glowTexture('rgba(255,244,211,1)', 'rgba(255,173,92,.56)');
    TEX.glowGreen = glowTexture('rgba(236,255,202,1)', 'rgba(169,208,105,.40)');
    TEX.glowRed = glowTexture('rgba(255,236,210,1)', 'rgba(232,73,45,.48)');
    TEX.glassGlint = glassGlintTexture();
    TEX.glassCrack = crackedGlassTexture();
    TEX.sealDark = sealTexture('#141814', '#171b17', 'rgba(202,192,155,.72)', true);
    TEX.sealPaint = sealTexture(null, 'rgba(17,22,18,.85)', 'rgba(169,162,126,.35)', true);
    TEX.plaque = plaqueTexture();
    TEX.signMaze = signPanel({
      seed: 12, bg: '#111613', stripe: '#cbb069', stripeLabel: 'FEDERAL BUREAU OF CONTROL',
      stripeText: '#121712', kicker: 'SECTOR A-07 / CONCRETE ARRAY',
      title: 'ASH TRAY', title2: 'MAZE', title2Offset: 96, titleSize: 112,
      subtitle: ['RECONFIGURATION ACTIVE', 'AUTHORIZED PERSONNEL ONLY'],
      seal: true, footer: 'FBC PROPERTY  ·  DO NOT REARRANGE'
    });
    TEX.signCaution = signPanel({
      seed: 19, bg: '#d1aa3e', borderColor: 'rgba(26,29,22,.8)',
      kicker: 'BUREAU SAFETY DIRECTIVE 4-C', kickerColor: 'rgba(31,33,25,.8)',
      title: 'CAUTION', titleColor: '#1a1d16', titleSize: 132,
      subtitle: ['MOVING STRUCTURES', 'REMAIN CLEAR OF MASONRY'],
      subtitleColor: 'rgba(30,32,24,.8)', hazard: false, icon: 'warn', footer: 'MAZE WILL REARRANGE WITHOUT NOTICE',
      footerColor: '#1b1e17', screws: false
    });
    TEX.signAuth = signPanel({
      seed: 22, bg: '#1b211c', stripe: '#8a9c76', stripeLabel: 'SECURITY DIRECTIVE',
      stripeText: '#121611', title: 'RESTRICTED', titleSize: 112, titleColor: '#d8d2b4',
      subtitle: ['AUTHORIZED PERSONNEL ONLY', 'LEVEL 4 CLEARANCE REQUIRED'],
      icon: 'none', footer: 'A.W.E. OBSERVATION CONTROL  /  A-07', seal: true
    });
    TEX.signGate = signPanel({
      seed: 26, bg: '#21231d', stripe: '#aa3e2c', stripeLabel: 'DEAD MAIL / SECURE',
      stripeText: '#e3d8bf', title: 'AWE GATE', titleSize: 106, titleColor: '#d8d1b7',
      subtitle: ['AUTHORIZED ACCESS ONLY', 'ALL TRANSIT IS RECORDED'], footer: 'SERVICE LIFT  07  ·  NO PUBLIC ENTRY',
      seal: true, icon: 'arrow'
    });
    TEX.signControl = fluorescentLabelTexture();
    TEX.signNoSmoking = noSmokingTexture();
    TEX.directory = directoryTexture();
    TEX.stencilMaze = stencilTexture('MAZE', { color: 'rgba(221,207,162,.66)', size: 280, sub: 'A-07   /   RECIRCULATION', seed: 5, wear: 460, stencilBridges: true });
    TEX.stencilControl = stencilTexture('CONTROL', { color: 'rgba(216,201,156,.53)', size: 190, seed: 8, wear: 520, h: 384 });
    TEX.stencil07 = numberStencilTexture('07');
    TEX.stencilArrow = arrowTexture('CONTROL');
    TEX.stencilArrowPlain = arrowTexture('MAZE');
    TEX.stencilFire = stencilTexture('FIRE POINT', { color: 'rgba(193,64,44,.75)', size: 170, seed: 12, wear: 240, h: 256 });
    TEX.boxLabels = [0, 1, 2, 3].map(boxLabelTexture);
    TEX.papers = [0, 1, 2].map(paperTexture);
    TEX.punchCard = punchCardTexture();
    TEX.cardLabels = [cardLabelTexture('TAPES', '#a5905a'), cardLabelTexture('ARCHIVE', '#7d8c68'), cardLabelTexture('AWE', '#b78e57'), cardLabelTexture('OBSERVE', '#8e9b84')];
    TEX.crt = [];
    for (var i = 0; i < 6; i++) TEX.crt.push(crtBase(i));
    TEX.keypad = keypadTexture();
    TEX.note = noteTexture();
    TEX.rust = rustStainTexture();
    TEX.tapeLabels = [tapeLabelTexture('A / 01'), tapeLabelTexture('SIDE B'), tapeLabelTexture('LOOP 7'), tapeLabelTexture('RECOLLECT')];
    TEX.glowSpark = glowTexture('rgba(255,250,230,1)', 'rgba(255,207,132,.5)');
  };

  /* =======================================================================
     MATERIAL KIT
     ======================================================================= */
  AM.buildMaterials = function () {
    var M = (AM.mats = {});
    M.concrete = AM.toon(0xd9d5c7, {
      map: TEX.concrete, bumpMap: TEX.concrete, bumpScale: .075,
      rim: .10, rimColor: 0x95a8a0, rimPower: 3.2, gradientMap: AM.grad
    });
    M.concreteB = AM.toon(0xacb1a8, {
      map: TEX.concreteB, bumpMap: TEX.concreteB, bumpScale: .08,
      rim: .10, rimColor: 0x9baba0, rimPower: 3.1, gradientMap: AM.grad
    });
    M.concreteCool = AM.toon(0x899590, {
      map: TEX.concrete, bumpMap: TEX.concrete, bumpScale: .07,
      rim: .13, rimColor: 0x8ca4a2, rimPower: 3.0, gradientMap: AM.gradInk
    });
    M.concreteWarm = AM.toon(0xbfae95, {
      map: TEX.concreteB, bumpMap: TEX.concreteB, bumpScale: .06,
      rim: .10, rimColor: 0xc2ad8f, rimPower: 3.2, gradientMap: AM.gradWarm
    });
    M.concreteDark = AM.toon(0x697068, {
      map: TEX.concrete, bumpMap: TEX.concrete, bumpScale: .07,
      rim: .09, rimColor: 0x7f969a, rimPower: 3.2, gradientMap: AM.gradHard
    });
    M.concreteSoot = AM.toon(0x4c534d, {
      map: TEX.concreteB, bumpMap: TEX.concreteB, bumpScale: .06,
      rim: .12, rimColor: 0x788b8d, rimPower: 3.4, gradientMap: AM.gradHard
    });
    M.steel = AM.toon(0x66736d, {
      map: TEX.metal, rim: .24, rimColor: 0xa1bcba, rimPower: 2.6, gradientMap: AM.gradHard
    });
    M.steelHi = AM.toon(0x8c978e, {
      map: TEX.metal, rim: .24, rimColor: 0xc8cdb3, rimPower: 2.4, gradientMap: AM.gradHard
    });
    M.steelDark = AM.toon(0x313b36, {
      map: TEX.metal, rim: .20, rimColor: 0x6d898a, rimPower: 3.0, gradientMap: AM.gradHard
    });
    M.steelPale = AM.toon(0x7f8b83, {
      map: TEX.metal, rim: .18, rimColor: 0xacc1b9, rimPower: 2.8, gradientMap: AM.grad
    });
    M.rust = AM.toon(0x9a6a4e, {
      map: TEX.metal, rim: .12, rimColor: 0xc2875e, rimPower: 3.0, gradientMap: AM.gradHard
    });
    M.brass = AM.toon(0xc0a163, {
      rim: .25, rimColor: 0xf3d597, rimPower: 2.2, gradientMap: AM.gradHard
    });
    M.rubber = AM.toon(0x1d2521, { rim: .10, rimColor: 0x536866, rimPower: 3.1, gradientMap: AM.gradHard });
    M.blackMetal = AM.toon(0x2b312d, { map: TEX.metal, rim: .13, rimColor: 0x677873, rimPower: 3.2, gradientMap: AM.gradHard });
    M.wood = AM.toon(0x84684c, { map: TEX.wood, rim: .09, rimColor: 0xc8a879, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.woodDark = AM.toon(0x483326, { map: TEX.wood, rim: .09, rimColor: 0xb48a67, rimPower: 3.2, gradientMap: AM.gradWarm });
    M.interiorWall = AM.toon(0x867258, { rim: .07, rimColor: 0xffcf8d, rimPower: 3.2, gradientMap: AM.gradWarm });
    M.ceiling = AM.toon(0x7c6e5a, { rim: .05, rimColor: 0xffd29c, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.floorInterior = AM.toon(0xffffff, { map: TEX.interiorFloor, rim: .05, rimColor: 0xffcb86, rimPower: 3.4, gradientMap: AM.gradWarm });
    M.carpet = AM.toon(0xffffff, { map: TEX.carpet, rim: .04, rimColor: 0x9cb18e, rimPower: 3.4, gradientMap: AM.gradWarm });
    M.cream = AM.toon(0x9b8d72, { rim: .08, rimColor: 0xffddab, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.paper = AM.toon(0xc9c0aa, { rim: .03, rimColor: 0xffedc2, rimPower: 3.0, gradientMap: AM.gradSoft });
    M.tapeBrown = AM.toon(0x4d3628, { rim: .10, rimColor: 0x9e754d, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.tapeBrown2 = AM.toon(0x6d4b34, { rim: .08, rimColor: 0xb88456, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.circuitGreen = AM.toon(0x798665, { rim: .10, rimColor: 0xbcdc8f, rimPower: 3.0, gradientMap: AM.gradHard });
    M.circuitDark = AM.toon(0x252e25, { rim: .10, rimColor: 0x789b70, rimPower: 3.0, gradientMap: AM.gradHard });
    M.red = AM.toon(0x9e382c, { rim: .13, rimColor: 0xe06b4d, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.redDark = AM.toon(0x552520, { rim: .10, rimColor: 0xae4e34, rimPower: 3.0, gradientMap: AM.gradHard });
    M.redPaint = AM.toon(0xb64534, { rim: .17, rimColor: 0xe87b5d, rimPower: 2.8, gradientMap: AM.gradHard });
    M.leather = AM.toon(0x4e3b2d, { rim: .12, rimColor: 0xb28458, rimPower: 2.8, gradientMap: AM.gradWarm });
    M.fabric = AM.toon(0x6a705d, { rim: .05, rimColor: 0xc2b98d, rimPower: 3.2, gradientMap: AM.gradSoft });
    M.plasticGrey = AM.toon(0x777a6d, { rim: .08, rimColor: 0xb5c2b4, rimPower: 3.1, gradientMap: AM.grad });
    M.buttons = AM.toon(0xc9b98f, { rim: .08, rimColor: 0xffdf9c, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.hazard = AM.toon(0xffffff, { map: TEX.hazard, rim: .04, rimColor: 0xffffea, rimPower: 3.0, gradientMap: AM.grad });
    M.grate = AM.toon(0xffffff, { map: TEX.grate, rim: .0, gradientMap: AM.gradHard });
    M.pipeGreen = AM.toon(0x5f796a, { rim: .13, rimColor: 0x9cc7a5, rimPower: 3.0, gradientMap: AM.gradHard });
    M.pipeRust = AM.toon(0x86603e, { rim: .12, rimColor: 0xb88c64, rimPower: 3.0, gradientMap: AM.gradHard });
    M.duct = AM.toon(0x818a80, { map: TEX.metal, rim: .1, rimColor: 0xadbdba, rimPower: 3.1, gradientMap: AM.grad });

    // Emissive / translucent materials
    M.glowGreen = AM.basic(0xd9f0a8, { toneMapped: false });
    M.glowAmber = AM.basic(0xffcb82, { toneMapped: false });
    M.glowRed = AM.basic(0xff5b3a, { toneMapped: false });
    M.glowWhite = AM.basic(0xe9f3da, { toneMapped: false });
    M.ledGreen = AM.basic(0x9bff8c, { toneMapped: false });
    M.ledRed = AM.basic(0xff402a, { toneMapped: false });
    M.ledAmber = AM.basic(0xffb24d, { toneMapped: false });
    M.screenGlass = AM.phys(0x5c7564, { transparent: true, opacity: .16, roughness: .04, clearcoat: 1, depthWrite: false, envMapIntensity: 1.8 });
    M.glass = AM.glass(0x9fb4a2, .14);
    M.glassDark = AM.glass(0x69877e, .23);
    M.glassDoor = AM.glass(0x8ea99a, .18);
    M.decalGlint = AM.glow(0xffffff, .6, { map: TEX.glassGlint, side: T.DoubleSide });
    M.decalCrack = AM.basic(0xffffff, { map: TEX.glassCrack, transparent: true, opacity: .9, depthWrite: false, side: T.DoubleSide });
    M.ceramic = AM.toon(0xc9c2ad, { rim: .11, rimColor: 0xf1d2a1, rimPower: 3.0, gradientMap: AM.gradWarm });
    M.ashtray = AM.toon(0x303832, { rim: .13, rimColor: 0x708879, rimPower: 2.8, gradientMap: AM.gradHard });
    M.ash = AM.toon(0x6a685b, { rim: 0, gradientMap: AM.gradSoft });
    M.ember = AM.basic(0xf07d3f, { toneMapped: false });
    M.cable = AM.toon(0x202825, { rim: .08, rimColor: 0x5a726a, rimPower: 3.0, gradientMap: AM.gradHard });
    M.white = AM.toon(0xdedbcf, { rim: .05, rimColor: 0xfff3cf, rimPower: 3.0, gradientMap: AM.gradSoft });
    M.blackPlastic = AM.toon(0x242923, { rim: .08, rimColor: 0x5d7262, rimPower: 3.0, gradientMap: AM.gradHard });
  };
})();
