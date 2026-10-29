/* =========================================================================
   FBC QUARRY 07 — procedural canvas textures (no external images)
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE;
  var Tex = FQ.Tex = {};
  var R = FQ.rng(0x07fa11);

  function noiseCanvas(w, h, base, variance) {
    var c = FQ.canvas(w, h), g = c.getContext('2d');
    var img = g.createImageData(w, h), d = img.data;
    var col = new T.Color(base);
    var br = col.r * 255, bg = col.g * 255, bb = col.b * 255;
    for (var i = 0; i < w * h; i++) {
      var n = (R() - 0.5) * variance;
      d[i * 4] = FQ.clamp(br + n, 0, 255);
      d[i * 4 + 1] = FQ.clamp(bg + n, 0, 255);
      d[i * 4 + 2] = FQ.clamp(bb + n, 0, 255);
      d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function grime(g, w, h, count, alpha, color) {
    for (var i = 0; i < count; i++) {
      var x = R() * w, y = R() * h, rw = 3 + R() * w * 0.1, rh = 3 + R() * h * 0.055;
      var gr = g.createRadialGradient(x, y, 0, x, y, Math.max(rw, rh));
      gr.addColorStop(0, 'rgba(' + color + ',' + alpha * (0.3 + R() * 0.7) + ')');
      gr.addColorStop(1, 'rgba(' + color + ',0)');
      g.fillStyle = gr; g.fillRect(x - rw, y - rh, rw * 2, rh * 2);
    }
  }

  function streaks(g, w, h, n, dark) {
    for (var i = 0; i < n; i++) {
      var x = R() * w, y = R() * h * .9, len = h * (0.05 + R() * .28);
      var lg = g.createLinearGradient(x, y, x, y + len);
      lg.addColorStop(0, 'rgba(' + dark + ',0)');
      lg.addColorStop(.28, 'rgba(' + dark + ',' + (0.06 + R() * .11) + ')');
      lg.addColorStop(1, 'rgba(' + dark + ',0)');
      g.fillStyle = lg; g.fillRect(x, y, .5 + R() * 3.2, len);
    }
  }

  function concrete(base, variance, size, cells, tint) {
    size = size || 1024;
    var c = noiseCanvas(size, size, base, variance);
    var g = c.getContext('2d');
    var cloud = noiseCanvas(96, 96, 0x808080, 90);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .17;
    g.drawImage(cloud, 0, 0, size, size);
    g.globalAlpha = .09; g.drawImage(cloud, -size * .2, size * .2, size * 1.4, size * 1.2);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    for (var i = 0; i < size * 0.16; i++) {
      g.fillStyle = R() > .5 ? 'rgba(22,25,25,' + (.02 + R() * .05) + ')' : 'rgba(245,242,227,' + (.025 + R() * .05) + ')';
      var s = .5 + R() * 1.5; g.fillRect(R() * size, R() * size, s, s);
    }
    cells = cells || 2;
    var step = size / cells;
    for (var k = 0; k <= cells; k++) {
      var p = Math.round(k * step) + .5;
      g.strokeStyle = 'rgba(30,33,31,.36)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, p); g.lineTo(size, p); g.stroke();
      g.strokeStyle = 'rgba(244,241,226,.13)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, p + 2.5); g.lineTo(size, p + 2.5); g.stroke();
      g.strokeStyle = 'rgba(30,33,31,.23)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, size); g.stroke();
      g.strokeStyle = 'rgba(244,241,226,.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(p + 2, 0); g.lineTo(p + 2, size); g.stroke();
    }
    for (var tt = 0; tt < 9; tt++) {
      var tx = (tt % 3 + .5) * size / 3 + (R() - .5) * 30;
      var ty = (Math.floor(tt / 3) + .5) * size / 3 + (R() - .5) * 30;
      g.fillStyle = 'rgba(23,23,20,.42)'; g.beginPath(); g.arc(tx, ty, 4.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(243,238,223,.16)'; g.lineWidth = 1.2; g.beginPath(); g.arc(tx, ty - 1.1, 5.4, -2.4, .9); g.stroke();
    }
    streaks(g, size, size, 20, '24,26,23');
    grime(g, size, size, 20, .045, '23,24,21');
    g.strokeStyle = 'rgba(23,24,21,.34)';
    for (var cr = 0; cr < 5; cr++) {
      g.lineWidth = .6 + R(); g.beginPath();
      var cx = R() * size, cy = R() * size; g.moveTo(cx, cy);
      for (var seg = 0; seg < 6; seg++) { cx += (R() - .5) * 54; cy += 12 + R() * 42; g.lineTo(cx, cy); }
      g.stroke();
    }
    if (tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, size, size); g.globalCompositeOperation = 'source-over'; }
    return c;
  }

  function rockTexture(base, variance, size) {
    size = size || 1024;
    var c = noiseCanvas(size, size, base, variance);
    var g = c.getContext('2d');
    // broad sediment strata
    var y = 0;
    while (y < size) {
      var bandH = 8 + R() * 46;
      var shade = R();
      g.fillStyle = shade > .64 ? 'rgba(197,176,142,' + (.025 + R() * .07) + ')'
        : shade > .35 ? 'rgba(28,31,29,' + (.04 + R() * .12) + ')' : 'rgba(115,70,45,' + (.02 + R() * .08) + ')';
      g.fillRect(0, y, size, bandH);
      y += bandH;
      if (R() < .46) {
        g.strokeStyle = 'rgba(16,19,18,' + (.15 + R() * .3) + ')'; g.lineWidth = .6 + R() * 2.2;
        g.beginPath(); var yy = y + (R() - .5) * 5; g.moveTo(0, yy);
        for (var x = 0; x < size; x += 30 + R() * 80) g.lineTo(x, yy + (R() - .5) * 9);
        g.stroke();
      }
    }
    // angular fractures
    for (var f = 0; f < 46; f++) {
      g.strokeStyle = 'rgba(12,15,15,' + (.16 + R() * .35) + ')'; g.lineWidth = .5 + R() * 2;
      g.beginPath();
      var x0 = R() * size, y0 = R() * size; g.moveTo(x0, y0);
      for (var s = 0; s < 4; s++) { x0 += (R() - .5) * 130; y0 += (R() - .55) * 80; g.lineTo(x0, y0); }
      g.stroke();
      if (R() < .35) {
        g.strokeStyle = 'rgba(214,195,164,.08)'; g.lineWidth = .8; g.stroke();
      }
    }
    // fossil flecks / rubble
    for (var i = 0; i < 1800; i++) {
      var v = 50 + R() * 120;
      g.fillStyle = 'rgba(' + (v | 0) + ',' + ((v * .93) | 0) + ',' + ((v * .8) | 0) + ',' + (.08 + R() * .26) + ')';
      var r = .4 + R() * 3.4; g.fillRect(R() * size, R() * size, r, r);
    }
    // pale mineral blooms
    for (var mn = 0; mn < 32; mn++) {
      var mx = R() * size, my = R() * size, mr = 5 + R() * 30;
      var gr = g.createRadialGradient(mx, my, 0, mx, my, mr);
      gr.addColorStop(0, 'rgba(188,177,151,' + (.03 + R() * .08) + ')'); gr.addColorStop(1, 'rgba(188,177,151,0)');
      g.fillStyle = gr; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    }
    // damp lower darkening
    var lgr = g.createLinearGradient(0, size * .62, 0, size);
    lgr.addColorStop(0, 'rgba(7,12,12,0)'); lgr.addColorStop(1, 'rgba(7,12,12,.35)');
    g.fillStyle = lgr; g.fillRect(0, 0, size, size);
    return c;
  }

  function deckTexture() {
    var S = 1024, c = concrete(0x999a91, 22, S, 4);
    var g = c.getContext('2d');
    // expansion joints + stains + tire scuffs
    g.strokeStyle = 'rgba(19,22,21,.6)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, S * .53); g.lineTo(S, S * .5); g.stroke();
    g.strokeStyle = 'rgba(236,233,219,.1)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, S * .53 + 4); g.lineTo(S, S * .5 + 4); g.stroke();
    for (var i = 0; i < 130; i++) {
      g.fillStyle = 'rgba(25,26,24,' + (.02 + R() * .07) + ')';
      g.save(); g.translate(R() * S, R() * S); g.rotate(R() * 6.28);
      g.fillRect(0, 0, 12 + R() * 150, .6 + R() * 3.5); g.restore();
    }
    grime(g, S, S, 30, .13, '18,19,17');
    streaks(g, S, S, 22, '20,22,19');
    // faint drain grooves
    g.strokeStyle = 'rgba(22,24,22,.3)'; g.lineWidth = 1.4;
    for (var d = 0; d < 8; d++) { g.beginPath(); g.moveTo(0, 175 + d * 95); g.lineTo(S, 150 + d * 95); g.stroke(); }
    // faded yellow edge dashes
    for (var k = 0; k < 16; k++) {
      g.fillStyle = 'rgba(196,164,54,' + (.06 + R() * .12) + ')';
      g.fillRect(k * 64 + 8, 30, 34, 6);
    }
    return c;
  }

  function brushedSteel() {
    var S = 512, c = noiseCanvas(S, S, 0x434a4d, 22), g = c.getContext('2d');
    for (var i = 0; i < 2200; i++) {
      g.strokeStyle = 'rgba(' + (R() > .5 ? '220,229,226' : '12,16,16') + ',' + (.015 + R() * .08) + ')';
      g.lineWidth = .3 + R() * 1.1;
      var y = R() * S, x = R() * S;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + R() * 200, y + (R() - .5) * 2); g.stroke();
    }
    grime(g, S, S, 16, .08, '12,15,15');
    streaks(g, S, S, 16, '12,14,13');
    return c;
  }

  function rustSteel() {
    var S = 512, c = noiseCanvas(S, S, 0x5f4a3d, 36), g = c.getContext('2d');
    var cloud = noiseCanvas(80, 80, 0x808080, 110);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .22; g.drawImage(cloud, 0, 0, S, S);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (var i = 0; i < 80; i++) {
      var x = R() * S, y = R() * S, r = 2 + R() * 34;
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, R() < .5 ? 'rgba(117,56,27,.24)' : 'rgba(30,37,35,.28)');
      gr.addColorStop(1, 'rgba(60,35,20,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (var j = 0; j < 500; j++) {
      g.fillStyle = 'rgba(' + (85 + R() * 80) + ',' + (48 + R() * 34) + ',' + (24 + R() * 18) + ',' + (.08 + R() * .3) + ')';
      g.fillRect(R() * S, R() * S, .5 + R() * 4, .5 + R() * 3);
    }
    for (var s = 0; s < 30; s++) {
      g.strokeStyle = 'rgba(23,27,26,' + (.08 + R() * .2) + ')'; g.lineWidth = .5 + R() * 2;
      var x0 = R() * S, y0 = R() * S; g.beginPath(); g.moveTo(x0, y0);
      for (var k = 0; k < 3; k++) { x0 += (R() - .5) * 70; y0 += (R() - .5) * 50; g.lineTo(x0, y0); }
      g.stroke();
    }
    return c;
  }

  function hazard() {
    var S = 512, c = FQ.canvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#8f7028'; g.fillRect(0, 0, S, S);
    g.save(); g.translate(S / 2, S / 2); g.rotate(-Math.PI / 4);
    g.fillStyle = '#141819';
    for (var i = -S; i < S * 1.5; i += 120) g.fillRect(i, -S, 58, S * 2);
    g.restore();
    grime(g, S, S, 25, .22, '20,22,20');
    // worn edges
    for (var k = 0; k < 80; k++) {
      g.fillStyle = 'rgba(32,36,34,' + (.15 + R() * .4) + ')';
      g.fillRect(R() * S, R() * S, 1 + R() * 16, 1 + R() * 5);
    }
    return c;
  }

  function grateTexture() {
    var S = 512, c = FQ.canvas(S, S), g = c.getContext('2d');
    g.fillStyle = '#0d1112'; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#3c4444'; g.lineWidth = 10;
    for (var i = 0; i <= 16; i++) { var p = i * S / 16 + .5; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke(); }
    g.lineWidth = 4;
    for (var j = 0; j <= 40; j++) { var y = j * S / 40 + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    g.strokeStyle = 'rgba(224,235,230,.16)'; g.lineWidth = 1;
    for (var k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(k * S / 16 + 5, 0); g.lineTo(k * S / 16 + 5, S); g.stroke(); }
    grime(g, S, S, 20, .18, '18,20,18');
    return c;
  }

  function diamondPlate() {
    var S = 512, c = brushedSteel(), g = c.getContext('2d');
    g.strokeStyle = 'rgba(225,231,222,.13)'; g.lineWidth = 2;
    for (var y = 20; y < S; y += 56) {
      for (var x = 20; x < S; x += 62) {
        g.save(); g.translate(x, y); g.rotate(-.7); g.strokeRect(-14, -4, 28, 8); g.restore();
      }
    }
    g.strokeStyle = 'rgba(8,12,12,.22)'; g.lineWidth = 3;
    for (var yy = 23; yy < S; yy += 56) {
      for (var xx = 23; xx < S; xx += 62) {
        g.save(); g.translate(xx, yy); g.rotate(-.7); g.strokeRect(-14, -4, 28, 8); g.restore();
      }
    }
    return c;
  }

  function controlFloorTexture() {
    var S = 1024, c = concrete(0x6e7068, 17, S, 2), g = c.getContext('2d');
    // dark polished central field
    g.fillStyle = 'rgba(24,29,29,.44)'; g.fillRect(70, 70, S - 140, S - 140);
    g.strokeStyle = 'rgba(194,207,198,.54)'; g.lineWidth = 3;
    g.strokeRect(76, 76, S - 152, S - 152);
    // red guidance loop and arrow lines
    g.strokeStyle = 'rgba(158,42,37,.75)'; g.lineWidth = 8;
    g.beginPath(); g.arc(S / 2, S / 2, S * .27, -.7, 3.6); g.stroke();
    g.strokeStyle = 'rgba(185,158,82,.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(S / 2, S / 2, S * .315, 0, Math.PI * 1.35); g.stroke();
    g.strokeStyle = 'rgba(211,216,203,.32)'; g.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var y = 135 + i * 135;
      g.beginPath(); g.moveTo(110, y); g.lineTo(S - 110, y); g.stroke();
    }
    // big FBC ring logo
    g.strokeStyle = 'rgba(205,190,153,.26)'; g.lineWidth = 5;
    g.beginPath(); g.arc(S / 2, S / 2, 132, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, 118, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(205,190,153,.18)';
    g.beginPath(); g.moveTo(S / 2, S / 2 - 62); g.lineTo(S / 2 + 58, S / 2 + 42); g.lineTo(S / 2 - 58, S / 2 + 42); g.closePath(); g.fill();
    // caution hatch near one edge
    g.save(); g.beginPath(); g.rect(74, 835, S - 148, 42); g.clip();
    for (var h = -50; h < S; h += 38) { g.fillStyle = 'rgba(202,170,55,.45)'; g.save(); g.translate(h, 840); g.rotate(-.65); g.fillRect(0, 0, 19, 70); g.restore(); }
    g.restore();
    // scuff marks, dust, paper corners
    for (var sc = 0; sc < 75; sc++) {
      g.save(); g.translate(R() * S, R() * S); g.rotate(R() * 6.28);
      g.fillStyle = 'rgba(18,21,20,' + (.03 + R() * .09) + ')'; g.fillRect(0, 0, 8 + R() * 110, .6 + R() * 4); g.restore();
    }
    grime(g, S, S, 28, .12, '18,20,18');
    return c;
  }

  function controlWallTexture() {
    var S = 512, c = noiseCanvas(S, S, 0x73776f, 16), g = c.getContext('2d');
    var cloud = noiseCanvas(64, 64, 0x808080, 90);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .2; g.drawImage(cloud, 0, 0, S, S);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.strokeStyle = 'rgba(32,36,32,.4)'; g.lineWidth = 2;
    for (var i = 0; i <= 4; i++) {
      var p = i * S / 4 + .5;
      g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
    }
    grime(g, S, S, 22, .17, '25,28,23');
    streaks(g, S, S, 14, '20,24,20');
    for (var sc = 0; sc < 30; sc++) {
      g.fillStyle = 'rgba(38,43,37,' + (.16 + R() * .4) + ')';
      g.fillRect(R() * S, R() * S, 1 + R() * 10, 1 + R() * 4);
    }
    return c;
  }

  /* ----------------------- signage ----------------------- */
  function baseSignCanvas() {
    var W = 1024, H = 320, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#161b1c'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a7874b'; g.lineWidth = 7; g.strokeRect(13, 13, W - 26, H - 26);
    g.strokeStyle = 'rgba(219,209,183,.22)'; g.lineWidth = 1.5; g.strokeRect(28, 28, W - 56, H - 56);
    // red triangle emblem
    g.fillStyle = '#a92d28';
    g.beginPath(); g.moveTo(112, 82); g.lineTo(185, 206); g.lineTo(39, 206); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(230,220,194,.8)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(112, 112); g.lineTo(167, 202); g.lineTo(57, 202); g.closePath(); g.stroke();
    g.fillStyle = '#131718'; g.beginPath(); g.moveTo(112, 140); g.lineTo(150, 198); g.lineTo(74, 198); g.closePath(); g.fill();
    g.fillStyle = '#d8d1bf'; g.textAlign = 'left';
    g.font = '600 27px "Arial Narrow", Arial, sans-serif'; g.fillText('FEDERAL BUREAU OF CONTROL', 245, 92);
    g.font = '700 47px "Arial Narrow", Arial, sans-serif'; g.fillText('QUARRY SITE 07', 243, 146);
    g.fillStyle = '#a9a598'; g.font = '22px "Courier New", monospace';
    g.fillText('INDUSTRIAL CONTAINMENT // LEVEL -04', 245, 181);
    g.fillStyle = '#8e3d33'; g.fillRect(245, 207, 637, 2);
    g.fillStyle = '#c8b790'; g.font = '17px "Courier New", monospace';
    g.fillText('ORDINARY AWE  //  ACCESS UNDER DIRECTOR AUTHORIZATION', 245, 239);
    g.fillStyle = '#6e746d'; g.font = '14px "Courier New", monospace';
    g.fillText('MODEL 04-1972  ·  FBC PROPERTY', 245, 270);
    grime(g, W, H, 24, .16, '15,18,17');
    return c;
  }

  function warningSign(kind) {
    var W = 512, H = 512, c = FQ.canvas(W, H), g = c.getContext('2d');
    if (kind === 'restricted') {
      g.fillStyle = '#c9c4b2'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#181c1d'; g.fillRect(0, 0, W, 90);
      g.fillStyle = '#b12926'; g.fillRect(0, 90, W, 22);
      g.fillStyle = '#e6dfca'; g.textAlign = 'center';
      g.font = '700 42px "Arial Narrow", Arial, sans-serif'; g.fillText('RESTRICTED AREA', W / 2, 60);
      g.fillStyle = '#a92d28';
      g.beginPath(); g.moveTo(W / 2, 165); g.lineTo(W / 2 + 125, 365); g.lineTo(W / 2 - 125, 365); g.closePath(); g.fill();
      g.strokeStyle = '#1a1d1e'; g.lineWidth = 12; g.stroke();
      g.fillStyle = '#1a1d1e'; g.font = '700 92px "Arial Narrow", Arial, sans-serif'; g.fillText('!', W / 2, 344);
      g.font = '700 31px "Arial Narrow", Arial, sans-serif'; g.fillText('AUTHORIZED PERSONNEL', W / 2, 425);
      g.fillText('ONLY', W / 2, 462);
      g.fillStyle = '#9c332b'; g.font = '17px "Courier New", monospace'; g.fillText('FBC / QUARRY 07 / AWE-77', W / 2, 505);
      grime(g, W, H, 30, .14, '34,30,24');
    } else if (kind === 'containment') {
      g.fillStyle = '#171c1d'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#ddd4bd'; g.lineWidth = 6; g.strokeRect(22, 22, W - 44, H - 44);
      g.fillStyle = '#b6302c'; g.fillRect(22, 22, W - 44, 76);
      g.fillStyle = '#f0e7d3'; g.textAlign = 'center';
      g.font = '700 34px "Arial Narrow", Arial, sans-serif'; g.fillText('CONTAINMENT ZONE', W / 2, 72);
      // triangle line icon
      g.strokeStyle = '#d9cfb8'; g.lineWidth = 11;
      g.beginPath(); g.moveTo(W / 2, 150); g.lineTo(W / 2 + 145, 390); g.lineTo(W / 2 - 145, 390); g.closePath(); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2, 198); g.lineTo(W / 2 + 101, 355); g.lineTo(W / 2 - 101, 355); g.closePath(); g.stroke();
      g.fillStyle = '#b6302c'; g.beginPath(); g.moveTo(W / 2, 250); g.lineTo(W / 2 + 45, 334); g.lineTo(W / 2 - 45, 334); g.closePath(); g.fill();
      g.fillStyle = '#cfc7b3'; g.font = '700 30px "Arial Narrow", Arial, sans-serif'; g.fillText('ALTERED WORLD EVENT', W / 2, 438);
      g.font = '17px "Courier New", monospace'; g.fillStyle = '#8d948b'; g.fillText('NO PHOTOGRAPHY  ·  NO RECORDING', W / 2, 472);
      grime(g, W, H, 26, .12, '20,20,17');
    } else {
      // hazard no-entry
      g.fillStyle = '#d1a72f'; g.fillRect(0, 0, W, H);
      g.save(); g.translate(W / 2, H / 2); g.rotate(-.6);
      g.fillStyle = '#181c1d';
      for (var i = -W; i < W; i += 120) g.fillRect(i, -W, 52, W * 2);
      g.restore();
      g.fillStyle = 'rgba(23,26,26,.92)'; g.fillRect(52, 188, W - 104, 140);
      g.strokeStyle = '#d1a72f'; g.lineWidth = 4; g.strokeRect(63, 199, W - 126, 118);
      g.fillStyle = '#e7dcc0'; g.textAlign = 'center';
      g.font = '700 38px "Arial Narrow", Arial, sans-serif'; g.fillText('NO ENTRY', W / 2, 252);
      g.font = '16px "Courier New", monospace'; g.fillText('BLAST CLEARANCE REQUIRED', W / 2, 288);
      grime(g, W, H, 40, .2, '34,30,20');
    }
    return c;
  }

  function stencil07() {
    var S = 512, c = FQ.canvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.fillStyle = 'rgba(221,215,195,.78)';
    g.font = '800 360px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('07', S / 2, S / 2 + 14);
    // stencil breaks
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 24; i++) { g.fillStyle = 'rgba(0,0,0,' + (.3 + R() * .7) + ')'; g.fillRect(R() * S, R() * S, 2 + R() * 30, 1 + R() * 8); }
    g.globalCompositeOperation = 'destination-out';
    for (var k = 0; k < 5; k++) { g.fillRect(0, 104 + k * 70, S, 7); }
    g.globalCompositeOperation = 'source-over';
    // distressed edges
    g.globalCompositeOperation = 'destination-out';
    grime(g, S, S, 40, .4, '0,0,0');
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  function fbcLogoTexture() {
    var S = 512, c = FQ.canvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    g.strokeStyle = 'rgba(225,217,197,.9)'; g.lineWidth = 15;
    g.beginPath(); g.arc(S / 2, S / 2, 205, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(S / 2, S / 2, 178, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(178,46,38,.95)';
    g.beginPath(); g.moveTo(S / 2, 114); g.lineTo(S / 2 + 166, 376); g.lineTo(S / 2 - 166, 376); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,24,24,.92)';
    g.beginPath(); g.moveTo(S / 2, 172); g.lineTo(S / 2 + 111, 349); g.lineTo(S / 2 - 111, 349); g.closePath(); g.fill();
    g.fillStyle = 'rgba(224,215,193,.7)';
    g.font = '22px "Courier New", monospace'; g.textAlign = 'center';
    g.fillText('FEDERAL BUREAU', S / 2, 427); g.fillText('OF CONTROL', S / 2, 453);
    return c;
  }

  function plaqueTexture() {
    var W = 1024, H = 240, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#0c0f10'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a4874e'; g.lineWidth = 5; g.strokeRect(9, 9, W - 18, H - 18);
    g.strokeStyle = 'rgba(220,202,164,.25)'; g.lineWidth = 1.5; g.strokeRect(22, 22, W - 44, H - 44);
    g.textAlign = 'left'; g.fillStyle = '#b69a62';
    g.font = '600 20px "Courier New", monospace'; g.fillText('EXHIBIT 07 — THE QUARRY THAT LOOKED BACK', 48, 76);
    g.fillStyle = '#ded5c0';
    g.font = '700 43px "Arial Narrow", Arial, sans-serif'; g.fillText('ORDINARY AWE / FEDERAL QUARRY MODEL', 47, 128);
    g.fillStyle = '#7f8279'; g.font = '18px "Courier New", monospace';
    g.fillText('BRUTALIST EXTRACTION SITE  ·  CONTROL ROOM  ·  INVERTED MONUMENT', 48, 166);
    g.fillStyle = '#9f3d31'; g.font = '600 16px "Courier New", monospace';
    g.fillText('PROPERTY OF THE FEDERAL BUREAU OF CONTROL — DO NOT REMOVE', 48, 204);
    g.fillStyle = '#a4874e'; g.font = '700 18px "Courier New", monospace';
    g.fillText('FBC // 07', W - 170, 204);
    return c;
  }

  /* ----------------------- CRT screens ----------------------- */
  function screenBase(tint) {
    var W = 320, H = 240, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#06100c'; g.fillRect(0, 0, W, H);
    // glass vignette + noise
    var gr = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * .7);
    gr.addColorStop(0, 'rgba(20,50,40,.18)'); gr.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return { c: c, g: g, W: W, H: H, tint: tint || '#9ef1d2' };
  }
  function screenScanlines(g, W, H, alpha) {
    g.fillStyle = 'rgba(0,0,0,' + (alpha === undefined ? .22 : alpha) + ')';
    for (var y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
  }

  function screenCode(seed, tint, title) {
    var s = screenBase(tint), g = s.g, W = s.W, H = s.H;
    g.font = '9px "Courier New", monospace'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(155,242,197,.9)'; g.fillText(title || 'FBC SECURE TERMINAL / NODE 07', 12, 10);
    g.strokeStyle = 'rgba(140,220,185,.25)'; g.strokeRect(8, 7, W - 16, H - 14);
    var r = FQ.rng(seed);
    for (var l = 0; l < 19; l++) {
      var line = (l < 6 ? 'SYS> ' : l === 6 ? 'TRACE_START' : '    ');
      var n = 7 + (r() * 20 | 0);
      for (var k = 0; k < n; k++) {
        var chars = '0123456789ABCDEF#%&:/+-_<>[]{}';
        line += chars[(r() * chars.length) | 0];
      }
      g.fillStyle = l === 6 ? 'rgba(255,121,80,.95)' : 'rgba(144,238,201,' + (.40 + r() * .45) + ')';
      g.fillText(line, 14, 30 + l * 10);
    }
    g.fillStyle = 'rgba(156,245,207,.8)'; g.fillText('> _', 14, H - 28);
    screenScanlines(g, W, H, .18);
    grime(g, W, H, 4, .04, '0,0,0');
    return s.c;
  }

  function screenMap(seed) {
    var s = screenBase(), g = s.g, W = s.W, H = s.H, r = FQ.rng(seed);
    g.fillStyle = 'rgba(12,40,35,.85)'; g.fillRect(10, 24, W - 20, H - 54);
    g.strokeStyle = 'rgba(113,206,174,.3)'; g.lineWidth = 1;
    for (var i = 0; i < 9; i++) { g.beginPath(); g.moveTo(10 + i * 33, 24); g.lineTo(10 + i * 33, H - 30); g.stroke(); }
    for (var j = 0; j < 6; j++) { g.beginPath(); g.moveTo(10, 24 + j * 31); g.lineTo(W - 10, 24 + j * 31); g.stroke(); }
    // quarry plan
    g.strokeStyle = 'rgba(177,235,208,.8)'; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(63, 85); g.lineTo(100, 60); g.lineTo(238, 68); g.lineTo(265, 145); g.lineTo(220, 201); g.lineTo(104, 188); g.lineTo(72, 151); g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(151,214,191,.35)';
    for (var k = 1; k < 4; k++) {
      g.beginPath(); g.moveTo(84 + k * 8, 95 + k * 9); g.lineTo(102 + k * 4, 83 + k * 9); g.lineTo(223 - k * 4, 89 + k * 8); g.lineTo(248 - k * 8, 143 + k * 4); g.lineTo(212 - k * 3, 188 - k * 8); g.lineTo(110 + k * 5, 178 - k * 7); g.lineTo(89 + k * 4, 148 + k * 3); g.closePath(); g.stroke();
    }
    // inverted triangle
    g.fillStyle = 'rgba(202,56,42,.82)';
    g.beginPath(); g.moveTo(163, 105); g.lineTo(192, 161); g.lineTo(134, 161); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,134,105,.6)'; g.font = '10px "Courier New", monospace'; g.fillText('AWE-07', 145, 178);
    // blips
    for (var b = 0; b < 12; b++) {
      var x = 40 + r() * 235, y = 40 + r() * 150;
      g.strokeStyle = 'rgba(255,134,92,.75)'; g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, 3 + r() * 8, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,116,70,.8)'; g.fillRect(x - 1, y - 1, 2, 2);
    }
    g.fillStyle = 'rgba(148,238,205,.8)'; g.font = '10px "Courier New", monospace';
    g.fillText('SITE 07 / SECTOR C / LIVE', 13, 16);
    g.fillText('LAT 40.716  LON -73.998', 13, H - 22);
    screenScanlines(g, W, H, .2);
    return s.c;
  }

  function screenWave(seed) {
    var s = screenBase(), g = s.g, W = s.W, H = s.H, r = FQ.rng(seed);
    g.fillStyle = 'rgba(13,35,31,.72)'; g.fillRect(10, 24, W - 20, H - 50);
    g.strokeStyle = 'rgba(110,208,172,.27)'; g.lineWidth = 1;
    for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(14, 48 + i * 27); g.lineTo(W - 14, 48 + i * 27); g.stroke(); }
    g.strokeStyle = 'rgba(159,247,205,.9)'; g.lineWidth = 2; g.beginPath();
    for (var x = 0; x < W - 30; x++) {
      var y = H / 2 + Math.sin(x * .12 + r() * 2) * (10 + Math.sin(x * .031) * 17) + Math.sin(x * .43) * 3;
      if (x === 0) g.moveTo(15 + x, y); else g.lineTo(15 + x, y);
    }
    g.stroke();
    g.strokeStyle = 'rgba(255,100,70,.9)'; g.lineWidth = 1.5; g.beginPath();
    g.moveTo(15, 72 + r() * 30); g.lineTo(W - 15, 72 + r() * 30); g.stroke();
    g.fillStyle = 'rgba(163,247,211,.8)'; g.font = '10px "Courier New", monospace';
    g.fillText('RESONANCE / 19.47 HZ', 14, 16);
    g.fillText('SIGNAL: UNSTABLE', 214, 16);
    screenScanlines(g, W, H, .2);
    return s.c;
  }

  function screenRed() {
    var s = screenBase(), g = s.g, W = s.W, H = s.H;
    g.fillStyle = 'rgba(69,10,10,.56)'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255,126,92,.96)'; g.font = '700 17px "Courier New", monospace';
    g.fillText('CONTAINMENT', W / 2, 65); g.fillText('STATUS', W / 2, 88);
    g.fillStyle = 'rgba(225,71,54,.76)'; g.beginPath(); g.moveTo(W / 2, 112); g.lineTo(W / 2 + 57, 193); g.lineTo(W / 2 - 57, 193); g.closePath(); g.fill();
    g.fillStyle = 'rgba(18,10,10,.9)'; g.font = '800 54px "Arial";'; g.fillText('!', W / 2, 172);
    g.fillStyle = 'rgba(255,158,116,.8)'; g.font = '11px "Courier New", monospace';
    g.fillText('PASSIVE  ·  AWAITING INPUT', W / 2, 215);
    screenScanlines(g, W, H, .28);
    return s.c;
  }

  function screenSurveillance() {
    var s = screenBase(), g = s.g, W = s.W, H = s.H;
    g.fillStyle = '#0c1110'; g.fillRect(0, 0, W, H);
    // grainy quarry camera feed
    g.fillStyle = 'rgba(37,45,42,.68)'; g.fillRect(10, 26, W - 20, H - 46);
    g.fillStyle = 'rgba(13,16,15,.9)';
    g.beginPath(); g.moveTo(10, 97); g.lineTo(80, 48); g.lineTo(150, 72); g.lineTo(W - 10, 41); g.lineTo(W - 10, H - 20); g.lineTo(10, H - 20); g.closePath(); g.fill();
    // inverted pyramid silhouette
    g.fillStyle = 'rgba(100,116,108,.34)';
    g.beginPath(); g.moveTo(72, 106); g.lineTo(235, 106); g.lineTo(168, 199); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(207,229,216,.55)'; g.lineWidth = 2; g.stroke();
    // crosshair corners
    g.strokeStyle = 'rgba(225,239,225,.8)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(22, 47); g.lineTo(22, 33); g.lineTo(37, 33); g.stroke();
    g.beginPath(); g.moveTo(W - 22, 47); g.lineTo(W - 22, 33); g.lineTo(W - 37, 33); g.stroke();
    g.beginPath(); g.moveTo(22, H - 30); g.lineTo(22, H - 16); g.lineTo(37, H - 16); g.stroke();
    g.beginPath(); g.moveTo(W - 22, H - 30); g.lineTo(W - 22, H - 16); g.lineTo(W - 37, H - 16); g.stroke();
    g.fillStyle = 'rgba(226,239,226,.92)'; g.font = '10px "Courier New", monospace';
    g.fillText('CAM 04 / PIT NORTH', 30, 18);
    g.fillStyle = 'rgba(255,112,82,.96)'; g.beginPath(); g.arc(41, H - 40, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(226,239,226,.7)'; g.fillText('REC', 50, H - 36);
    for (var i = 0; i < 600; i++) { g.fillStyle = 'rgba(230,240,225,' + (R() * .055) + ')'; g.fillRect(R() * W, R() * H, 1, 1); }
    screenScanlines(g, W, H, .22);
    return s.c;
  }

  function monitorWallCanvas() {
    var W = 1024, H = 512, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#111616'; g.fillRect(0, 0, W, H);
    // brushed metal panel
    for (var i = 0; i < 1600; i++) {
      g.strokeStyle = 'rgba(' + (R() > .5 ? '175,185,178' : '12,16,16') + ',' + (.015 + R() * .035) + ')';
      g.beginPath(); g.moveTo(R() * W, R() * H); g.lineTo(R() * W + 30, R() * H + (R() - .5) * 2); g.stroke();
    }
    // heading
    g.fillStyle = '#c7c0ab'; g.font = '600 20px "Courier New", monospace'; g.textAlign = 'left';
    g.fillText('FEDERAL BUREAU OF CONTROL  /  INDUSTRIAL OVERSIGHT', 36, 39);
    g.fillStyle = '#99342c'; g.fillRect(36, 51, 952, 4);
    g.fillStyle = '#737c74'; g.font = '13px "Courier New", monospace';
    g.fillText('SITE 07 — QUARRY OPERATIONS & CONTAINMENT MONITORING', 36, 74);
    // 4x2 screens
    var screens = [
      { c: screenSurveillance(), label: 'CAM-04' },
      { c: screenMap(77), label: 'SITE MAP' },
      { c: screenCode(21, '#b6f1d6', 'NODE / 07-A'), label: 'ARCHIVE' },
      { c: screenWave(3), label: 'RESONANCE' },
      { c: screenCode(9, '#e5d9bd', 'HRA / CLEARANCE'), label: 'HRA' },
      { c: screenRed(), label: 'AWE STATUS' },
      { c: screenMap(34), label: 'MAGNETIC' },
      { c: screenCode(46, '#bce4ca', 'TRANSMIT / 19:03'), label: 'RELAY' }
    ];
    var cellW = (W - 72 - 3 * 12) / 4, cellH = 174, x0 = 36, y0 = 96;
    for (var k = 0; k < screens.length; k++) {
      var cx = x0 + (k % 4) * (cellW + 12), cy = y0 + Math.floor(k / 4) * (cellH + 50);
      g.fillStyle = '#070a0a'; g.fillRect(cx - 4, cy - 4, cellW + 8, cellH + 8);
      g.drawImage(screens[k].c, cx, cy, cellW, cellH - 16);
      g.strokeStyle = 'rgba(61,69,65,.8)'; g.lineWidth = 1.5; g.strokeRect(cx, cy, cellW, cellH - 16);
      g.fillStyle = 'rgba(151,156,144,.6)'; g.font = '11px "Courier New", monospace';
      g.fillText(screens[k].label, cx + 2, cy + cellH - 2);
      g.fillStyle = 'rgba(157,50,44,.7)'; g.fillRect(cx, cy, 28, 3);
    }
    // central warning strip below
    g.fillStyle = '#1d2423'; g.fillRect(36, 460, 952, 28);
    g.fillStyle = '#b59a60'; g.font = '14px "Courier New", monospace';
    g.fillText('AWE-77  /  SUSPENDED OBJECT  /  GRAVITY MASS 1.7×10⁵ T  /  STATUS: HOVER', 48, 479);
    g.fillStyle = '#9f3931'; g.beginPath(); g.arc(959, 474, 6, 0, Math.PI * 2); g.fill();
    // overall glass grime
    grime(g, W, H, 22, .08, '0,0,0');
    screenScanlines(g, W, H, .06);
    return c;
  }

  function crtBezelTexture() {
    var S = 256, c = noiseCanvas(S, S, 0x232a29, 16), g = c.getContext('2d');
    for (var i = 0; i < 1100; i++) {
      g.fillStyle = 'rgba(' + (R() > .5 ? '95,104,98' : '8,11,11') + ',' + (.01 + R() * .05) + ')';
      g.fillRect(R() * S, R() * S, .5 + R() * 3, .5 + R() * 1.8);
    }
    grime(g, S, S, 10, .08, '8,10,9');
    return c;
  }

  function punchedCardTexture() {
    var W = 256, H = 128, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#b5a37f'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1f1b14'; g.fillRect(0, 0, W, 17);
    g.fillStyle = '#e2d6ba'; g.font = '10px "Courier New", monospace'; g.fillText('FBC / PUNCH 07', 8, 12);
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 30; col++) {
        if (R() < .39) { g.fillStyle = 'rgba(20,17,12,.78)'; g.fillRect(10 + col * 8, 25 + row * 11, 3, 6); }
      }
    }
    // printed row labels
    g.fillStyle = 'rgba(38,30,18,.6)'; g.font = '7px monospace';
    g.fillText('AWE07//CARBON//LOAD', 8, H - 6);
    return c;
  }

  function documentTexture(seed) {
    var W = 512, H = 700, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#d4c8ac'; g.fillRect(0, 0, W, H);
    var r = FQ.rng(seed);
    g.fillStyle = '#a9a08a'; g.font = '16px "Courier New", monospace';
    g.fillText('FEDERAL BUREAU OF CONTROL', 34, 46);
    g.fillStyle = '#8d2f29'; g.fillRect(34, 58, W - 68, 3);
    g.fillStyle = '#38382f'; g.font = '700 27px "Courier New", monospace';
    g.fillText(seed % 2 ? 'INCIDENT REPORT' : 'AWE FIELD LOG', 34, 98);
    g.font = '14px "Courier New", monospace'; g.fillStyle = '#5d5b4c';
    for (var l = 0; l < 22; l++) {
      var x = 34, y = 142 + l * 22;
      while (x < W - 34) {
        var w = 25 + r() * 110;
        if (x + w > W - 34) w = W - 34 - x;
        if (r() < .12) {
          g.fillStyle = '#191b19'; g.fillRect(x, y - 8, w, 9);
        } else {
          g.fillStyle = 'rgba(69,68,57,' + (.55 + r() * .35) + ')'; g.fillRect(x, y, w, 1.5);
        }
        x += w + 12 + r() * 20;
      }
    }
    // pyramid stamp
    g.strokeStyle = 'rgba(146,45,38,.46)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(W - 138, 540); g.lineTo(W - 57, 668); g.lineTo(W - 219, 668); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(146,45,38,.34)'; g.font = '700 30px "Courier New", monospace';
    g.fillText('AWE', W - 178, 622);
    g.fillStyle = 'rgba(30,31,27,.15)';
    for (var n = 0; n < 100; n++) g.fillRect(r() * W, r() * H, 1 + r() * 4, 1 + r() * 3);
    return c;
  }

  function smokeTexture() {
    var S = 256, c = FQ.canvas(S, S), g = c.getContext('2d');
    var img = g.createImageData(S, S), d = img.data;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var u = x / S - .5, v = y / S - .5;
      var r = Math.sqrt(u * u + v * v);
      var n = (Math.sin(x * .11 + y * .07) + Math.sin(x * .043 - y * .13) + Math.sin((x + y) * .17)) * .12;
      var a = FQ.clamp((1 - r * 2.1 + n) * 180, 0, 158);
      var i = (y * S + x) * 4;
      d[i] = 220; d[i + 1] = 228; d[i + 2] = 226; d[i + 3] = a;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function glowTexture() {
    var S = 256, c = FQ.canvas(S, S), g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,240,1)');
    gr.addColorStop(.18, 'rgba(255,218,158,.72)');
    gr.addColorStop(.48, 'rgba(255,101,58,.22)');
    gr.addColorStop(1, 'rgba(255,52,22,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  }

  function sparkTexture() {
    var S = 128, c = FQ.canvas(S, S), g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.12, 'rgba(255,245,216,.95)');
    gr.addColorStop(.35, 'rgba(255,187,111,.34)');
    gr.addColorStop(1, 'rgba(255,120,70,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  }

  function vignetteDust() {
    var S = 256, c = FQ.canvas(S, S), g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(212,236,239,.7)'); gr.addColorStop(.2, 'rgba(160,204,212,.26)'); gr.addColorStop(1, 'rgba(80,120,135,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  }

  FQ.buildTextures = function () {
    Tex.concrete = FQ.tex(concrete(0xb4b2a7, 14, 1024, 2), {});
    Tex.concreteCool = FQ.tex(concrete(0xa9aea8, 15, 1024, 2), {});
    Tex.concreteDark = FQ.tex(concrete(0x6b6e67, 17, 512, 1), {});
    Tex.rock = FQ.tex(rockTexture(0x625e51, 46, 1024), {});
    Tex.rockDark = FQ.tex(rockTexture(0x393b35, 34, 512), {});
    Tex.deck = FQ.tex(deckTexture(), {});
    Tex.rust = FQ.tex(rustSteel(), {});
    Tex.steel = FQ.tex(brushedSteel(), {});
    Tex.diamond = FQ.tex(diamondPlate(), {});
    Tex.hazard = FQ.tex(hazard(), { wrap: T.RepeatWrapping });
    Tex.grate = FQ.tex(grateTexture(), { wrap: T.RepeatWrapping });
    Tex.controlFloor = FQ.tex(controlFloorTexture(), {});
    Tex.controlWall = FQ.tex(controlWallTexture(), {});
    Tex.crtBezel = FQ.tex(crtBezelTexture(), {});
    Tex.monitorWall = FQ.tex(monitorWallCanvas(), {});
    Tex.baseSign = FQ.tex(baseSignCanvas(), {});
    Tex.warnRestricted = FQ.tex(warningSign('restricted'), {});
    Tex.warnContainment = FQ.tex(warningSign('containment'), {});
    Tex.warnNoEntry = FQ.tex(warningSign('noentry'), {});
    Tex.stencil07 = FQ.tex(stencil07(), {});
    Tex.fbcLogo = FQ.tex(fbcLogoTexture(), {});
    Tex.plaque = FQ.tex(plaqueTexture(), {});
    Tex.punchCard = FQ.tex(punchedCardTexture(), {});
    Tex.documentA = FQ.tex(documentTexture(3), {});
    Tex.documentB = FQ.tex(documentTexture(7), {});
    Tex.screenA = FQ.tex(screenCode(2, '#9af2ca', 'FBC / NODE 07-A'), {});
    Tex.screenB = FQ.tex(screenMap(12), {});
    Tex.screenC = FQ.tex(screenWave(5), {});
    Tex.screenD = FQ.tex(screenCode(18, '#e8d8ad', 'HRA / CLEARANCE'), {});
    Tex.screenE = FQ.tex(screenRed(), {});
    Tex.screenF = FQ.tex(screenCode(33, '#b7f1dd', 'ARCHIVE / FIELD'), {});
    Tex.screenG = FQ.tex(screenSurveillance(), {});
    Tex.smoke = FQ.tex(smokeTexture(), {});
    Tex.glow = FQ.tex(glowTexture(), {});
    Tex.spark = FQ.tex(sparkTexture(), {});
    Tex.mote = FQ.tex(vignetteDust(), {});
    return Tex;
  };
})();
