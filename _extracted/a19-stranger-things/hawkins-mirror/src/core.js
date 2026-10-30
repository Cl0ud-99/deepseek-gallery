/* =========================================================
   core.js — 三渲二核心：随机数 / 画布纹理 / 卡通材质 / 描边
   ========================================================= */
(function () {
  'use strict';
  var ST = (window.ST = window.ST || {});

  /* 开启色彩管理：十六进制色按 sRGB 解释并转到线性空间
     r149 使用 legacyMode 开关（r152+ 改为 enabled） */
  if (THREE.ColorManagement) {
    if ('legacyMode' in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    THREE.ColorManagement.enabled = true;
  }

  /* ---------------- 确定性随机 ---------------- */
  ST.seed = 1983;
  ST.setSeed = function (s) { ST.seed = s >>> 0; };
  ST.rand = function () {
    ST.seed = (ST.seed * 1664525 + 1013904223) >>> 0;
    return ST.seed / 4294967296;
  };
  ST.rr = function (a, b) { return a + (b - a) * ST.rand(); };
  ST.ri = function (a, b) { return Math.floor(a + (b - a + 1) * ST.rand()); };
  ST.pick = function (a) { return a[Math.floor(ST.rand() * a.length)]; };
  ST.chance = function (p) { return ST.rand() < p; };

  /* ---------------- 画布纹理 ---------------- */
  ST.cvs = function (w, h, draw, opts) {
    opts = opts || {};
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    draw(x, w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    t.needsUpdate = true;
    return t;
  };

  function noiseFill(x, w, h, base, amt, count) {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (var i = 0; i < (count || 2400); i++) {
      var a = ST.rand() * amt;
      x.fillStyle = 'rgba(' + (ST.chance(0.5) ? '255,255,255,' : '0,0,0,') + a.toFixed(3) + ')';
      var s = ST.rr(1, 3.2);
      x.fillRect(ST.rand() * w, ST.rand() * h, s, s);
    }
  }

  /* 沥青 */
  ST.texAsphalt = function (theme) {
    var up = theme === 'up';
    return ST.cvs(512, 512, function (x, w, h) {
      noiseFill(x, w, h, up ? '#0c0e13' : '#20242f', 0.09, 5200);
      // 细碎骨料
      for (var i = 0; i < 900; i++) {
        x.fillStyle = 'rgba(' + (up ? '90,70,70,' : '190,200,215,') + (0.02 + ST.rand() * 0.07) + ')';
        x.beginPath(); x.arc(ST.rand() * w, ST.rand() * h, ST.rr(0.4, 1.6), 0, 6.283); x.fill();
      }
      // 补丁与裂缝
      x.strokeStyle = up ? 'rgba(120,30,24,0.35)' : 'rgba(0,0,0,0.28)';
      x.lineWidth = 1.4;
      for (var k = 0; k < 7; k++) {
        x.beginPath();
        var px = ST.rand() * w, py = ST.rand() * h;
        x.moveTo(px, py);
        for (var s = 0; s < 5; s++) { px += ST.rr(-40, 40); py += ST.rr(-40, 40); x.lineTo(px, py); }
        x.stroke();
      }
    }, { repeat: [6, 6] });
  };

  /* 人行道 / 水泥 */
  ST.texWalk = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      noiseFill(x, w, h, up ? '#23262c' : '#6a6f7d', 0.07, 1600);
      x.strokeStyle = up ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.22)';
      x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
      x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
    }, { repeat: [3, 3] });
  };

  /* 木墙板 */
  ST.texWood = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      x.fillStyle = up ? '#241a16' : '#6b4a33'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 8; i++) {
        var y = i * 32;
        x.fillStyle = 'rgba(0,0,0,' + (0.10 + ST.rand() * 0.12) + ')';
        x.fillRect(0, y + 29, w, 3);
        x.fillStyle = 'rgba(255,235,200,' + (up ? 0.02 : 0.05) + ')';
        x.fillRect(0, y + 1, w, 1);
        for (var j = 0; j < 26; j++) {
          x.fillStyle = 'rgba(0,0,0,' + (ST.rand() * 0.10) + ')';
          x.fillRect(ST.rand() * w, y + ST.rand() * 28, ST.rr(6, 40), 1);
        }
      }
    }, { repeat: [2, 2] });
  };

  /* 砖墙 */
  ST.texBrick = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      x.fillStyle = up ? '#1a1212' : '#5c3428'; x.fillRect(0, 0, w, h);
      var bh = 22, bw = 52;
      for (var r = 0; r < h / bh; r++) {
        for (var c = -1; c < w / bw + 1; c++) {
          var off = (r % 2) * bw * 0.5;
          var px = c * bw + off + 2, py = r * bh + 2;
          var v = ST.rand();
          x.fillStyle = up
            ? 'rgb(' + (30 + v * 18 | 0) + ',' + (20 + v * 10 | 0) + ',' + (20 + v * 8 | 0) + ')'
            : 'rgb(' + (108 + v * 42 | 0) + ',' + (60 + v * 26 | 0) + ',' + (48 + v * 20 | 0) + ')';
          x.fillRect(px, py, bw - 4, bh - 4);
        }
      }
    }, { repeat: [3, 3] });
  };

  /* 碎花壁纸 + 26 个字母（字母墙） */
  ST.texAlphabet = function (theme) {
    var up = theme === 'up';
    return ST.cvs(1024, 640, function (x, w, h) {
      x.fillStyle = up ? '#241c1c' : '#efe2c4'; x.fillRect(0, 0, w, h);
      // 竖条纹
      for (var i = 0; i < 26; i++) {
        x.fillStyle = up ? 'rgba(70,44,44,0.35)' : 'rgba(205,176,133,0.42)';
        x.fillRect(i * 40, 0, 13, h);
      }
      // 碎花
      for (var f = 0; f < 420; f++) {
        var fx = ST.rand() * w, fy = ST.rand() * h, fr = ST.rr(3, 7);
        x.fillStyle = up
          ? 'rgba(' + (90 + ST.rand() * 30 | 0) + ',' + (50 + ST.rand() * 20 | 0) + ',' + (50 + ST.rand() * 20 | 0) + ',0.45)'
          : 'rgba(' + (190 + ST.rand() * 50 | 0) + ',' + (140 + ST.rand() * 40 | 0) + ',' + (150 + ST.rand() * 40 | 0) + ',0.55)';
        for (var p = 0; p < 5; p++) {
          var a = p / 5 * 6.283;
          x.beginPath(); x.arc(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * 0.62, 0, 6.283); x.fill();
        }
        x.fillStyle = up ? 'rgba(140,90,60,0.5)' : 'rgba(230,190,90,0.85)';
        x.beginPath(); x.arc(fx, fy, fr * 0.42, 0, 6.283); x.fill();
      }
      // 26 个字母
      var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var cols = 6, rows = 5;
      for (var k = 0; k < 26; k++) {
        var cx = (k % cols) * (w / cols) + (w / cols) * 0.5 + ST.rr(-14, 14);
        var cy = Math.floor(k / cols) * (h / rows) + (h / rows) * 0.52 + ST.rr(-10, 10);
        x.save();
        x.translate(cx, cy);
        x.rotate(ST.rr(-0.07, 0.07));
        x.font = 'bold ' + ST.ri(64, 82) + 'px Georgia, "Times New Roman", serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        if (up) {
          x.fillStyle = 'rgba(80,54,52,0.75)';
        } else {
          var pal = ['#c0453f', '#3f6ac0', '#c08a2f', '#3f9a6a', '#8a3f9a', '#c05a2f'];
          x.fillStyle = pal[k % pal.length];
        }
        x.fillText(A[k], 0, 0);
        x.restore();
      }
      // 潮气 / 霉斑
      if (up) {
        for (var m = 0; m < 40; m++) {
          var g = x.createRadialGradient(ST.rand() * w, ST.rand() * h, 2, 0, 0, 1);
          x.fillStyle = 'rgba(20,14,14,0.35)';
          x.beginPath(); x.arc(ST.rand() * w, ST.rand() * h, ST.rr(8, 46), 0, 6.283); x.fill();
        }
      }
    });
  };

  /* 通用壁纸（无字母） */
  ST.texWallpaper = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      x.fillStyle = up ? '#231c1c' : '#e3d6ba'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 8; i++) {
        x.fillStyle = up ? 'rgba(66,42,42,0.4)' : 'rgba(200,172,130,0.5)';
        x.fillRect(i * 32, 0, 10, h);
      }
      for (var f = 0; f < 120; f++) {
        x.fillStyle = up ? 'rgba(100,60,58,0.35)' : 'rgba(196,150,152,0.5)';
        var fx = ST.rand() * w, fy = ST.rand() * h;
        x.beginPath(); x.arc(fx, fy, ST.rr(2, 4), 0, 6.283); x.fill();
      }
    }, { repeat: [2, 1] });
  };

  /* 街机厅棋盘地砖 */
  ST.texTile = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      var n = 4, s = w / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var dark = (i + j) % 2 === 1;
        x.fillStyle = up
          ? (dark ? '#15161b' : '#202127')
          : (dark ? '#2f3440' : '#d9d0bc');
        x.fillRect(i * s, j * s, s, s);
      }
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2;
      for (var k = 0; k <= n; k++) {
        x.beginPath(); x.moveTo(k * s, 0); x.lineTo(k * s, h); x.stroke();
        x.beginPath(); x.moveTo(0, k * s); x.lineTo(w, k * s); x.stroke();
      }
      for (var d = 0; d < 500; d++) {
        x.fillStyle = 'rgba(0,0,0,' + (ST.rand() * 0.08) + ')';
        x.fillRect(ST.rand() * w, ST.rand() * h, 2, 2);
      }
    }, { repeat: [4, 6] });
  };

  /* 木地板 */
  ST.texFloorWood = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 256, function (x, w, h) {
      x.fillStyle = up ? '#1c1512' : '#7a5638'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 16; i++) {
        var y = i * 16;
        x.fillStyle = 'rgba(0,0,0,' + (0.08 + ST.rand() * 0.1) + ')';
        x.fillRect(0, y + 14, w, 2);
        x.fillStyle = 'rgba(255,220,180,' + (up ? 0.015 : 0.04) + ')';
        x.fillRect(0, y + 1, w, 1);
      }
    }, { repeat: [3, 4] });
  };

  /* 寻人启事公告栏 */
  ST.texBulletin = function () {
    return ST.cvs(512, 320, function (x, w, h) {
      x.fillStyle = '#3a2c22'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) {
        var px = 22 + i * 120 + ST.rr(-6, 6), py = 18 + j * 100 + ST.rr(-5, 5);
        var rot = ST.rr(-0.06, 0.06);
        x.save(); x.translate(px, py); x.rotate(rot);
        x.fillStyle = '#e8e2d0'; x.fillRect(0, 0, 96, 84);
        x.fillStyle = '#8a8a8a'; x.fillRect(10, 10, 76, 44);
        x.fillStyle = '#2a2a2a';
        x.beginPath(); x.arc(48, 30, 13, 0, 6.283); x.fill();
        x.fillStyle = '#4a4a4a'; x.fillRect(28, 40, 40, 12);
        x.fillStyle = '#1a1a1a'; x.font = 'bold 11px Arial';
        x.fillText('HAVE YOU', 22, 62); x.fillText('SEEN ME?', 24, 74);
        x.fillStyle = '#b02a2a'; x.fillRect(4, 4, 4, 4);
        x.restore();
      }
    });
  };

  /* 霓虹字（叠加发光） */
  ST.texNeon = function (text, color, opts) {
    opts = opts || {};
    var w = opts.w || 1024, h = opts.h || 256;
    var size = opts.size || 130;
    var font = opts.font || '"Arial Black", Impact, Arial, sans-serif';
    return ST.cvs(w, h, function (x) {
      x.clearRect(0, 0, w, h);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'bold ' + size + 'px ' + font;
      x.shadowColor = color;
      x.shadowBlur = 46;
      x.fillStyle = color;
      for (var i = 0; i < 4; i++) x.fillText(text, w / 2, h / 2);
      x.shadowBlur = 14;
      x.fillStyle = '#ffffff';
      x.globalAlpha = 0.92;
      x.fillText(text, w / 2, h / 2);
      x.globalAlpha = 1;
    });
  };

  /* 竖排霓虹字（刀旗招牌） */
  ST.texNeonVert = function (text, color) {
    var w = 160, h = 640;
    return ST.cvs(w, h, function (x) {
      x.clearRect(0, 0, w, h);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'bold 92px "Arial Black", Impact, Arial, sans-serif';
      var n = text.length;
      for (var i = 0; i < n; i++) {
        var cy = h * (i + 0.5) / n;
        x.shadowColor = color; x.shadowBlur = 34;
        x.fillStyle = color;
        for (var k = 0; k < 3; k++) x.fillText(text[i], w / 2, cy);
        x.shadowBlur = 10; x.fillStyle = '#fff'; x.globalAlpha = 0.9;
        x.fillText(text[i], w / 2, cy);
        x.globalAlpha = 1;
      }
    });
  };

  /* 街道路牌 HAWKINS */
  ST.texStreetSign = function () {
    return ST.cvs(512, 128, function (x, w, h) {
      x.fillStyle = '#1f5a35'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#e8e8e8'; x.lineWidth = 6;
      x.strokeRect(10, 10, w - 20, h - 20);
      x.fillStyle = '#f2f2f2';
      x.font = 'bold 62px "Arial Narrow", Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('HAWKINS', w / 2, h / 2 - 4);
    });
  };
  ST.texStreetSign2 = function () {
    return ST.cvs(512, 128, function (x, w, h) {
      x.fillStyle = '#1f5a35'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#e8e8e8'; x.lineWidth = 6;
      x.strokeRect(10, 10, w - 20, h - 20);
      x.fillStyle = '#f2f2f2';
      x.font = 'bold 58px "Arial Narrow", Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('MAPLE ST', w / 2, h / 2 - 4);
    });
  };

  /* 可乐贩卖机面板 */
  ST.texVending = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 512, function (x, w, h) {
      x.fillStyle = up ? '#2a1416' : '#c0202a'; x.fillRect(0, 0, w, h);
      x.fillStyle = up ? '#3a1c1c' : '#e83a44'; x.fillRect(0, 0, w, 90);
      x.fillStyle = up ? '#4a2a2a' : '#ffffff';
      x.font = 'bold 40px "Arial Black", Arial'; x.textAlign = 'center';
      x.fillText('COKE', w / 2, 62);
      // 展示窗
      x.fillStyle = up ? '#101010' : '#f4e6c8'; x.fillRect(18, 110, w - 36, 200);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
        x.fillStyle = up ? '#2a1a1a' : (ST.chance(0.5) ? '#d02030' : '#f0f0f0');
        x.fillRect(30 + c * 52, 124 + r * 64, 34, 52);
      }
      x.fillStyle = up ? '#0c0c0c' : '#2a2a2a'; x.fillRect(24, 330, w - 48, 40);
      x.fillStyle = up ? '#331a1a' : '#d8d8d8'; x.fillRect(24, 390, w - 48, 70);
    });
  };

  /* 街机侧板贴花 */
  ST.texCabArt = function (i, theme) {
    var up = theme === 'up';
    var cols = [['#ff3fa4', '#4fe4ff'], ['#ffb04a', '#ff3a2f'], ['#6f5cff', '#4fe4ff'], ['#4fe4ff', '#ff3fa4']];
    var c = cols[i % cols.length];
    return ST.cvs(256, 512, function (x, w, h) {
      x.fillStyle = up ? '#141318' : '#241d2e'; x.fillRect(0, 0, w, h);
      x.globalAlpha = up ? 0.25 : 0.85;
      var g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, h * 0.55); x.lineTo(w, h * 0.35); x.lineTo(w, h); x.lineTo(0, h);
      x.closePath(); x.fill();
      x.globalAlpha = up ? 0.2 : 0.9;
      x.strokeStyle = c[1]; x.lineWidth = 6;
      for (var k = 0; k < 5; k++) {
        x.beginPath(); x.moveTo(0, h * 0.2 + k * 26); x.lineTo(w, h * 0.1 + k * 26); x.stroke();
      }
      x.globalAlpha = up ? 0.25 : 1;
      x.fillStyle = '#fff'; x.font = 'bold 30px "Arial Black", Arial';
      x.textAlign = 'center';
      x.save(); x.translate(w / 2, h * 0.22); x.rotate(-0.12);
      x.fillText(['DRAGON', 'DIG DUG', 'GALAGA', 'TEMPEST'][i % 4], 0, 0);
      x.restore();
      x.globalAlpha = 1;
    });
  };

  /* 街机屏幕像素动画（4 帧横向拼接） */
  ST.texArcadeScreen = function (kind, theme) {
    var up = theme === 'up';
    var W = 128, H = 128, N = 4;
    return ST.cvs(W * N, H, function (x) {
      x.fillStyle = up ? '#07080a' : '#050810';
      x.fillRect(0, 0, W * N, H);
      for (var f = 0; f < N; f++) {
        var ox = f * W;
        var pal = ['#4fe4ff', '#ff3fa4', '#ffd24a', '#6aff8a'];
        for (var i = 0; i < 46; i++) {
          var px = ox + 8 + ((i * 37 + f * 11) % (W - 16));
          var py = 12 + ((i * 53 + f * 7) % (H - 40));
          x.fillStyle = up ? '#101418' : pal[(i + f) % pal.length];
          x.globalAlpha = up ? 0.5 : 0.95;
          x.fillRect(px, py, 4, 4);
        }
        x.globalAlpha = 1;
        // 像素角色
        x.fillStyle = up ? '#0d1014' : '#ffe14a';
        var bx = ox + 24 + ((f * 9) % 60), by = H - 42;
        for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
          if ((r + c + f) % 5 !== 0) x.fillRect(bx + c * 5, by + r * 5, 5, 5);
        }
        // 分数条
        x.fillStyle = up ? '#0b0d10' : '#ff3fa4';
        x.fillRect(ox + 10, 8, 46, 4);
        x.fillStyle = up ? '#0b0d10' : '#4fe4ff';
        x.fillRect(ox + W - 44, 8, 34, 4);
      }
    });
  };

  /* 复古海报 / 招贴 */
  ST.texPoster = function (theme) {
    var up = theme === 'up';
    return ST.cvs(256, 384, function (x, w, h) {
      x.fillStyle = up ? '#1c1718' : '#f0e4c8'; x.fillRect(0, 0, w, h);
      var g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, up ? '#2a1a1e' : '#c8384a');
      g.addColorStop(1, up ? '#140f12' : '#2a1a3a');
      x.fillStyle = g; x.fillRect(12, 12, w - 24, h * 0.55);
      x.fillStyle = up ? '#3a2a2a' : '#ffd24a';
      x.beginPath(); x.arc(w / 2, h * 0.28, 46, 0, 6.283); x.fill();
      x.fillStyle = up ? '#241c1c' : '#1a1020';
      x.font = 'bold 34px "Arial Black", Arial'; x.textAlign = 'center';
      x.fillText('PALACE', w / 2, h * 0.66);
      x.font = 'bold 20px Arial';
      x.fillText('ARCADE', w / 2, h * 0.73);
      x.font = '14px Arial';
      x.fillText('OPEN 10AM - LATE', w / 2, h * 0.83);
      x.fillStyle = up ? '#3a2020' : '#c8384a';
      x.fillRect(12, h * 0.87, w - 24, 6);
    });
  };

  /* ---------------- 卡通材质 ---------------- */
  var gradData = new Uint8Array([56, 122, 190, 255]);
  var GRAD = new THREE.DataTexture(gradData, 4, 1, THREE.RedFormat);
  GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
  GRAD.generateMipmaps = false;
  GRAD.needsUpdate = true;
  ST.GRAD = GRAD;

  ST.toon = function (color, o) {
    o = o || {};
    var p = { color: color, gradientMap: GRAD };
    if (o.map) p.map = o.map;
    if (o.emissive !== undefined) { p.emissive = new THREE.Color(o.emissive); p.emissiveIntensity = o.ei === undefined ? 1 : o.ei; }
    if (o.transparent) { p.transparent = true; p.opacity = o.opacity === undefined ? 1 : o.opacity; }
    if (o.side) p.side = o.side;
    if (o.depthWrite === false) p.depthWrite = false;
    if (o.alphaTest) p.alphaTest = o.alphaTest;
    var m = new THREE.MeshToonMaterial(p);
    m.name = o.name || '';
    return m;
  };

  /* ---------------- 描边（反向壳） ---------------- */
  var outlineMats = {};
  ST.outlineMat = function (color, t) {
    var key = color + '_' + t;
    if (outlineMats[key]) return outlineMats[key];
    var m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uT: { value: t } },
      vertexShader: [
        'uniform float uT;',
        'void main(){',
        '  vec3 p = position + normal * uT;',
        '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'void main(){ gl_FragColor = vec4(uColor,1.0); }'
      ].join('\n'),
      side: THREE.BackSide
    });
    outlineMats[key] = m;
    return m;
  };

  ST.outline = function (mesh, t, color) {
    if (mesh.userData._ol) return;
    var o = new THREE.Mesh(mesh.geometry, ST.outlineMat(color === undefined ? 0x080a10 : color, t === undefined ? 0.013 : t));
    o.userData._isOutline = true;
    o.renderOrder = -1;
    o.castShadow = false;
    o.receiveShadow = false;
    mesh.add(o);
    mesh.userData._ol = o;
  };

  /* ---------------- 几何辅助 ---------------- */
  // 以包围范围构建盒体
  ST.bx = function (p, mat, xr, yr, zr, opt) {
    opt = opt || {};
    var w = Math.abs(xr[1] - xr[0]), h = Math.abs(yr[1] - yr[0]), d = Math.abs(zr[1] - zr[0]);
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, mat);
    m.position.set((xr[0] + xr[1]) / 2, (yr[0] + yr[1]) / 2, (zr[0] + zr[1]) / 2);
    if (opt.ry) m.rotation.y = opt.ry;
    if (opt.rx) m.rotation.x = opt.rx;
    if (opt.rz) m.rotation.z = opt.rz;
    p.add(m);
    if (opt.ol !== false) ST.outline(m, opt.ol === undefined ? 0.019 : opt.ol, opt.olc);
    if (opt.cs) m.castShadow = true;
    if (opt.rs) m.receiveShadow = true;
    return m;
  };

  ST.cyl = function (p, mat, rt, rb, h, x, y, z, opt) {
    opt = opt || {};
    var g = new THREE.CylinderGeometry(rt, rb, h, opt.seg || 12, 1, !!opt.open);
    var m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    if (opt.rx) m.rotation.x = opt.rx;
    if (opt.ry) m.rotation.y = opt.ry;
    if (opt.rz) m.rotation.z = opt.rz;
    p.add(m);
    if (opt.ol !== false) ST.outline(m, opt.ol === undefined ? 0.014 : opt.ol, opt.olc);
    if (opt.cs) m.castShadow = true;
    return m;
  };

  ST.sph = function (p, mat, r, x, y, z, opt) {
    opt = opt || {};
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, opt.seg || 10, opt.seg2 || 8), mat);
    m.position.set(x, y, z);
    if (opt.sx) m.scale.x = opt.sx;
    if (opt.sy) m.scale.y = opt.sy;
    if (opt.sz) m.scale.z = opt.sz;
    p.add(m);
    if (opt.ol !== false) ST.outline(m, opt.ol === undefined ? 0.008 : opt.ol, opt.olc);
    return m;
  };

  // 管状曲线
  ST.tube = function (p, mat, pts, r, seg, opt) {
    opt = opt || {};
    var curve = new THREE.CatmullRomCurve3(pts);
    var g = new THREE.TubeGeometry(curve, seg || 24, r, opt.rad || 5, false);
    var m = new THREE.Mesh(g, mat);
    p.add(m);
    if (opt.ol) ST.outline(m, opt.ol, opt.olc);
    return m;
  };

  // 平面（默认竖立在 XY，可旋转）
  ST.plane = function (p, mat, w, h, x, y, z, opt) {
    opt = opt || {};
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, opt.sx || 1, opt.sy || 1), mat);
    m.position.set(x, y, z);
    if (opt.rx !== undefined) m.rotation.x = opt.rx;
    if (opt.ry !== undefined) m.rotation.y = opt.ry;
    if (opt.rz !== undefined) m.rotation.z = opt.rz;
    p.add(m);
    return m;
  };

  ST.grp = function (p, x, y, z) {
    var g = new THREE.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (p) p.add(g);
    return g;
  };

  /* ---------------- 发光贴图（径向渐变精灵） ---------------- */
  var glowTex = null;
  ST.glowTex = function () {
    if (glowTex) return glowTex;
    glowTex = ST.cvs(128, 128, function (x, w, h) {
      var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.22, 'rgba(255,255,255,0.62)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    return glowTex;
  };

  ST.glow = function (p, color, size, x, y, z, opacity) {
    var m = new THREE.SpriteMaterial({
      map: ST.glowTex(), color: color, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
      opacity: opacity === undefined ? 0.85 : opacity
    });
    var s = new THREE.Sprite(m);
    s.scale.set(size, size, 1);
    s.position.set(x, y, z);
    p.add(s);
    return s;
  };

  /* ---------------- 材质库 ---------------- */
  ST.pal = {
    real: {
      asphalt: 0x232838, line: 0xd6cfae, walk: 0x6d7280, curb: 0x878c9b, dirt: 0x3a3328,
      brick: 0x7a4638, stucco: 0x2f6b70, stucco2: 0x27575c, trim: 0xe8dcc4,
      wood: 0x6b4a33, woodDark: 0x402c21, woodLight: 0x8a6444, shingle: 0x4a3d3a,
      metal: 0x4a5058, chrome: 0xaab4c2, dark: 0x191c24,
      glass: 0xb8dcff, neonPink: 0xff3fa4, neonCyan: 0x4fe4ff, neonAmber: 0xffb04a, neonRed: 0xff3a2f,
      warm: 0xffc47a, cool: 0x8fb4ff, bulb: 0xffd9a0,
      fabricA: 0xb35a3c, fabricB: 0x2f4f6f, rug: 0x7a2f3f,
      arcadeBody: 0x241d2e, counter: 0xd6c49f, fridge: 0xe2ddcf, tv: 0x2a2a30,
      grass: 0x2c4632, bark: 0x3a2c26, leaf: 0x1f3b28,
      puddle: 0x0d1424, paper: 0xe8e2d0,
      vine: 0x0d1014, fungus: 0x6b2a2a, deadWood: 0x120f0f, rift: 0xff2a18,
      phoneBooth: 0xc9a13a, phoneBoothDark: 0x8f6f1c, awning: 0xc2456e, awning2: 0xf0e2c8,
      screenOff: 0x1a1c22
    },
    up: {
      asphalt: 0x1e222b, line: 0x4a443f, walk: 0x3a3d46, curb: 0x42454e, dirt: 0x241f1c,
      brick: 0x3a2723, stucco: 0x27393c, stucco2: 0x1f3032, trim: 0x453d38,
      wood: 0x3a2a22, woodDark: 0x221a16, woodLight: 0x4a362a, shingle: 0x2a2422,
      metal: 0x3a3e46, chrome: 0x565c66, dark: 0x0e0f13,
      glass: 0x2a3a4a, neonPink: 0x4a2232, neonCyan: 0x1c3c48, neonAmber: 0x3a2a1c, neonRed: 0x4a1a14,
      warm: 0x3a1c1a, cool: 0x22345a, bulb: 0x4a362a,
      fabricA: 0x3e2822, fabricB: 0x26303a, rug: 0x3a1c20,
      arcadeBody: 0x1c1a24, counter: 0x3e382e, fridge: 0x3e3e36, tv: 0x16161c,
      grass: 0x1c2a20, bark: 0x2a221c, leaf: 0x18261c,
      puddle: 0x080c12, paper: 0x4a4740,
      vine: 0x0e1116, fungus: 0x5a1f1f, deadWood: 0x14100e, rift: 0xff2a18,
      phoneBooth: 0x4a3a1c, phoneBoothDark: 0x362a16, awning: 0x3a1a24, awning2: 0x443a34,
      screenOff: 0x0a0b0e
    }
  };

  ST.theme = 'real';
  ST.mats = {};

  ST.M = function (k) { return ST.mats[k] || ST.mats.dark; };

  ST.buildMats = function (theme) {
    var P = ST.pal[theme], out = {};
    for (var k in P) out[k] = ST.toon(P[k], { name: k });

    // 发光类
    ['neonPink', 'neonCyan', 'neonAmber', 'neonRed', 'bulb', 'rift'].forEach(function (k) {
      out[k] = ST.toon(P[k], { name: k, emissive: P[k], ei: theme === 'up' ? 0.55 : 1.15 });
    });
    out.bulb = ST.toon(theme === 'up' ? 0x2a2018 : 0xffe6b8, { name: 'bulb', emissive: theme === 'up' ? 0x1a1008 : 0xffd08a, ei: theme === 'up' ? 0.3 : 1.5 });

    // 纹理类
    out.road = ST.toon(0xffffff, { name: 'road', map: ST.texAsphalt(theme) });
    out.road.side = THREE.DoubleSide;
    out.road.color = new THREE.Color(theme === 'up' ? 0x9aa0aa : 0xc8ccd8);
    out.walkTex = ST.toon(0xffffff, { name: 'walk', map: ST.texWalk(theme) });
    out.walkTex.color = new THREE.Color(theme === 'up' ? 0x8a8e96 : 0xc4c8d2);
    out.woodTex = ST.toon(0xffffff, { name: 'woodTex', map: ST.texWood(theme) });
    out.brickTex = ST.toon(0xffffff, { name: 'brickTex', map: ST.texBrick(theme) });
    out.brickTex.color = new THREE.Color(theme === 'up' ? 0x9a8a86 : 0xd8c8c0);
    out.alphabet = ST.toon(0xffffff, { name: 'alphabet', map: ST.texAlphabet(theme) });
    out.brickIn = ST.toon(theme === 'up' ? 0x6a5a54 : 0xb08e78, { name: 'brickIn', map: ST.texBrick(theme) });
    out.wallpaper = ST.toon(0xffffff, { name: 'wallpaper', map: ST.texWallpaper(theme) });
    out.tile = ST.toon(0xffffff, { name: 'tile', map: ST.texTile(theme) });
    out.floorWood = ST.toon(0xffffff, { name: 'floorWood', map: ST.texFloorWood(theme) });
    out.vending = ST.toon(0xffffff, { name: 'vending', map: ST.texVending(theme), emissive: theme === 'up' ? 0x000000 : 0x551010, ei: 0.5 });
    out.poster = ST.toon(0xffffff, { name: 'poster', map: ST.texPoster(theme) });
    out.bulletin = ST.toon(0xffffff, { name: 'bulletin', map: ST.texBulletin() });

    // 玻璃
    out.glass = new THREE.MeshPhysicalMaterial({
      color: theme === 'up' ? 0x0a1014 : 0x7fb4d8,
      transparent: true,
      opacity: theme === 'up' ? 0.07 : 0.075,
      roughness: 0.02,
      metalness: 0,
      transmission: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    out.glass.name = 'glass';

    return out;
  };
})();
