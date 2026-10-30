/* =========================================================
   interior.js — 室内陈设 / 霓虹招牌 / 腐化处理
   ========================================================= */
(function () {
  'use strict';
  var ST = window.ST;

  /* 把霓虹字弄“坏”：随机熄灭若干字母 */
  function brokenText(text, keep) {
    var out = '';
    var lit = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      if (ST.rand() < 0.42) out += ' '; else { out += ch; lit++; }
    }
    return lit === 0 ? text : out;
  }

  /* 霓虹灯牌 */
  ST.neon = function (p, text, color, w, h, x, y, z, ry, opts) {
    opts = opts || {};
    var up = ST.theme === 'up';
    var t = ST.texNeon(up ? brokenText(text) : text, color, {
      w: opts.tw || 1024, h: opts.th || 256, size: opts.size || 130, font: opts.font
    });
    var mat = new THREE.MeshBasicMaterial({
      map: t, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: up ? (opts.dim || 0.42) : (opts.op || 1)
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    p.add(m);
    if (!up && opts.glow !== false) {
      var gl = ST.glow(p, color, Math.max(w, h) * (opts.gs || 1.5), x, y, z + (opts.gdz || 0.02), 0.5);
      if (ry) { gl.position.set(x + Math.sin(ry) * 0.02, y, z + Math.cos(ry) * 0.02); }
      gl.material.opacity = 0.35;
    }
    return m;
  };

  /* 雪花屏 / CRT 静态噪波 */
  ST.crtStatic = function (p, w, h, x, y, z, ry) {
    var up = ST.theme === 'up';
    var mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uUp: { value: up ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uT; uniform float uUp;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
        'void main(){',
        '  vec2 uv = vUv;',
        '  float n = hash(uv*vec2(320.0,240.0) + floor(uT*22.0));',
        '  float n2 = hash(uv*vec2(90.0,70.0) + floor(uT*9.0));',
        '  float v = mix(n, n2, 0.35);',
        '  float scan = 0.82 + 0.18*sin(uv.y*300.0 + uT*6.0);',
        '  vec3 col = vec3(v*0.78, v*0.86, v*1.0) * scan;',
        '  col *= 1.0 - 0.55*pow(length((uv-0.5)*vec2(1.25,1.0)), 3.0);',
        '  col = mix(col, vec3(0.02,0.03,0.05), uUp*0.92);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    p.add(m);
    ST.crtMats = ST.crtMats || [];
    ST.crtMats.push(mat);
    return m;
  };

  /* ---------------- 街机框体 ---------------- */
  function cabinet(p, x, z, idx) {
    var M = ST.mats, up = ST.theme === 'up';
    var g = ST.grp(p, x, 0.1, z);
    g.rotation.y = Math.PI / 2; // 正面朝 +x

    var body = ST.toon(M.arcadeBody.color, {});
    // 机身
    ST.bx(g, body, [-0.31, 0.31], [0, 1.68], [-0.28, 0.28], { ol: 0.01, cs: true });
    // 侧板贴花
    var art = new THREE.MeshBasicMaterial({ map: ST.texCabArt(idx, ST.theme), transparent: false });
    [-1, 1].forEach(function (s) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.5), art);
      m.position.set(0, 0.95, s * 0.285);
      if (s < 0) m.rotation.y = Math.PI;
      g.add(m);
    });
    // 屏幕凹槽
    ST.bx(g, ST.toon(0x0a0a0e, {}), [-0.28, 0.28], [1.02, 1.58], [0.2, 0.28], { ol: 0.006 });
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.44), new THREE.MeshBasicMaterial({
      map: ST.texArcadeScreen(idx, ST.theme), transparent: false
    }));
    scr.material.map.repeat.set(0.25, 1);
    scr.material.map.wrapS = THREE.RepeatWrapping;
    scr.position.set(0, 1.3, 0.29);
    g.add(scr);
    if (!up) {
      ST.screens = ST.screens || [];
      ST.screens.push({ mat: scr.material, i: idx });
    }
    if (!up) {
      var sl = new THREE.PointLight(0x5fd0ff, 0.18, 1.4, 2);
      sl.position.set(0, 1.3, 0.55); g.add(sl);
    }
    // 遮光罩
    ST.bx(g, ST.toon(0x121016, {}), [-0.31, 0.31], [1.6, 1.68], [0.12, 0.34], { ol: 0.008 });
    // 灯箱
    var marq = ST.toon(up ? 0x1a1418 : 0xffd24a, { emissive: up ? 0x0a0508 : 0xffb04a, ei: up ? 0.2 : 1.4 });
    ST.bx(g, marq, [-0.29, 0.29], [1.7, 1.86], [0.02, 0.26], { ol: 0.008 });
    // 操作台
    ST.bx(g, ST.toon(0x1a1a22, {}), [-0.3, 0.3], [0.86, 0.94], [0.1, 0.42], { rx: -0.28, ol: 0.008 });
    // 摇杆 + 按钮
    ST.cyl(g, ST.toon(0x14161c, {}), 0.016, 0.016, 0.14, -0.13, 1.0, 0.3, { ol: false });
    ST.sph(g, ST.toon(up ? 0x3a1a1a : 0xd83a4a, {}), 0.035, -0.13, 1.08, 0.3, { ol: false });
    ST.sph(g, ST.toon(up ? 0x2a2a2a : 0xffd24a, {}), 0.028, 0.02, 0.98, 0.32, { ol: false });
    ST.sph(g, ST.toon(up ? 0x2a2a2a : 0x4fe4ff, {}), 0.028, 0.11, 0.98, 0.32, { ol: false });
    // 投币口
    ST.bx(g, ST.toon(0x2a2a30, {}), [-0.12, 0.12], [0.55, 0.72], [0.27, 0.3], { ol: 0.005 });
    ST.bx(g, ST.toon(0x000000, {}), [-0.02, 0.02], [0.6, 0.68], [0.29, 0.31], { ol: false });
    // 踢脚
    ST.bx(g, ST.toon(0x0c0c10, {}), [-0.31, 0.31], [0, 0.12], [-0.3, 0.3], { ol: false });
    return g;
  }

  /* ---------------- 街机厅室内 ---------------- */
  function arcadeInterior(p) {
    var M = ST.mats, up = ST.theme === 'up', A = ST.GEO.ARC;

    // 地垫 / 地毯
    var rug = ST.toon(M.rug.color, {});
    ST.plane(p, rug, 2.0, 1.4, 0.1, 0.108, -1.5, { rx: -Math.PI / 2 });

    // 街机框体一列（左墙）
    [-2.62, -1.96, -1.3, -0.64].forEach(function (z, i) {
      cabinet(p, -1.2, z, i);
    });

    // 后墙：沙发 + 电视角
    var sofa = ST.grp(p, 0.95, 0.1, -3.5);
    var fab = ST.toon(M.fabricA.color, {});
    var fab2 = ST.toon(up ? 0x2a1a16 : 0x8f4630, {});
    ST.bx(sofa, fab, [-0.72, 0.72], [0.1, 0.42], [-0.3, 0.3], { ol: 0.01, cs: true });
    ST.bx(sofa, fab2, [-0.72, 0.72], [0.42, 0.86], [-0.3, -0.14], { ol: 0.01 });
    ST.bx(sofa, fab, [-0.78, -0.62], [0.42, 0.66], [-0.3, 0.3], { ol: 0.008 });
    ST.bx(sofa, fab, [0.62, 0.78], [0.42, 0.66], [-0.3, 0.3], { ol: 0.008 });
    ST.bx(sofa, fab2, [-0.62, -0.02], [0.42, 0.52], [-0.28, 0.26], { ol: false });
    ST.bx(sofa, fab2, [0.02, 0.62], [0.42, 0.52], [-0.28, 0.26], { ol: false });
    for (var l = 0; l < 4; l++) {
      ST.cyl(sofa, ST.toon(0x1a1410, {}), 0.03, 0.03, 0.12, -0.66 + l * 0.44, 0.05, 0.26, { ol: false });
    }
    // 毯子
    ST.bx(sofa, ST.toon(up ? 0x221a1a : 0x3f6a6a, {}), [-0.3, 0.1], [0.42, 0.72], [-0.32, -0.22], { ol: 0.008 });

    // 电视柜（后左角，斜置）
    var tv = ST.grp(p, -1.15, 0.1, -3.35);
    tv.rotation.y = 0.62;
    ST.bx(tv, M.woodDark, [-0.45, 0.45], [0, 0.5], [-0.28, 0.28], { ol: 0.01, cs: true });
    ST.bx(tv, ST.toon(M.tv.color, {}), [-0.34, 0.34], [0.5, 0.96], [-0.24, 0.24], { ol: 0.012 });
    ST.bx(tv, ST.toon(0x0a0a0c, {}), [-0.29, 0.29], [0.56, 0.9], [0.2, 0.25], { ol: 0.006 });
    ST.crtStatic(tv, 0.52, 0.3, 0, 0.73, 0.255);
    ST.cyl(tv, ST.toon(0x2a2a30, {}), 0.03, 0.03, 0.14, -0.2, 1.02, -0.05, { ol: false });
    ST.cyl(tv, ST.toon(0x2a2a30, {}), 0.03, 0.03, 0.14, -0.02, 1.02, -0.05, { ol: false });
    if (!up) {
      var tl = new THREE.PointLight(0x9fd8ff, 0.40, 2.2, 2);
      tl.position.set(0, 0.8, 0.6); tv.add(tl);
    }

    // D&D 桌
    var tbl = ST.grp(p, 0.2, 0.1, -1.45);
    ST.bx(tbl, M.woodLight, [-0.62, 0.62], [0.68, 0.76], [-0.44, 0.44], { ol: 0.012, cs: true });
    [[-0.52, -0.34], [0.52, -0.34], [-0.52, 0.34], [0.52, 0.34]].forEach(function (c) {
      ST.bx(tbl, M.woodDark, [c[0] - 0.04, c[0] + 0.04], [0, 0.68], [c[1] - 0.04, c[1] + 0.04], { ol: 0.006 });
    });
    // 跑团地图
    var map = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.56), new THREE.MeshBasicMaterial({
      map: ST.cvs(512, 384, function (x, w, h) {
        x.fillStyle = up ? '#2a2622' : '#e8dcc0'; x.fillRect(0, 0, w, h);
        x.strokeStyle = up ? 'rgba(90,80,70,0.5)' : 'rgba(120,110,90,0.55)'; x.lineWidth = 1;
        for (var i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
        for (var j = 0; j < h; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
        x.strokeStyle = up ? 'rgba(120,60,50,0.6)' : 'rgba(60,50,40,0.85)'; x.lineWidth = 3;
        x.strokeRect(64, 64, 160, 128); x.strokeRect(256, 96, 96, 96);
        x.beginPath(); x.moveTo(64, 320); x.lineTo(200, 240); x.lineTo(330, 300); x.stroke();
        x.fillStyle = up ? 'rgba(120,70,60,0.4)' : 'rgba(120,90,60,0.35)';
        x.beginPath(); x.arc(150, 140, 40, 0, 6.283); x.fill();
      })
    }));
    map.rotation.x = -Math.PI / 2;
    map.position.set(0, 0.765, 0);
    tbl.add(map);
    // 骰子
    var dcol = [0xff3fa4, 0x4fe4ff, 0xffd24a, 0xd8d8d8];
    for (var d = 0; d < 6; d++) {
      var geo = d % 2 ? new THREE.IcosahedronGeometry(0.032, 0) : new THREE.TetrahedronGeometry(0.036, 0);
      var dm = new THREE.Mesh(geo, ST.toon(up ? 0x2a2622 : dcol[d % 4], {}));
      dm.position.set(ST.rr(-0.3, 0.3), 0.79, ST.rr(-0.2, 0.2));
      dm.rotation.set(ST.rr(0, 3), ST.rr(0, 3), ST.rr(0, 3));
      tbl.add(dm);
    }
    // 对讲机
    for (var wk = 0; wk < 2; wk++) {
      var wg = ST.grp(tbl, -0.32 + wk * 0.62, 0.775, 0.3);
      wg.rotation.y = ST.rr(-0.6, 0.6);
      ST.bx(wg, ST.toon(up ? 0x1a1a1a : 0x2a2e36, {}), [-0.035, 0.035], [0, 0.12], [-0.018, 0.018], { ol: 0.004 });
      ST.cyl(wg, ST.toon(0x14161a, {}), 0.006, 0.006, 0.09, 0.02, 0.16, 0, { ol: false });
    }
    // 椅子
    function chair(x, z, ry) {
      var c = ST.grp(p, x, 0.1, z);
      c.rotation.y = ry;
      ST.bx(c, M.woodDark, [-0.17, 0.17], [0.42, 0.47], [-0.17, 0.17], { ol: 0.008 });
      ST.bx(c, M.woodDark, [-0.17, 0.17], [0.47, 0.9], [-0.19, -0.14], { ol: 0.008 });
      [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(function (q) {
        ST.bx(c, M.woodDark, [q[0] - 0.018, q[0] + 0.018], [0, 0.42], [q[1] - 0.018, q[1] + 0.018], { ol: false });
      });
    }
    chair(-0.62, -0.82, 0.3);
    chair(1.02, -1.05, -1.3);
    chair(0.28, -2.08, Math.PI);

    // 兑币柜台（前右）
    var cnt = ST.grp(p, 0, 0, 0);
    ST.bx(cnt, M.counter, [0.62, 1.82], [0.1, 1.05], [0.72, 1.28], { ol: 0.012, cs: true });
    ST.bx(cnt, ST.toon(up ? 0x2a2620 : 0xe8dcc0, {}), [0.6, 1.84], [1.05, 1.12], [0.7, 1.3], { ol: 0.008 });
    ST.bx(cnt, M.woodDark, [0.62, 1.82], [0.1, 0.22], [0.7, 1.3], { ol: 0.006 });
    // 收银机
    ST.bx(cnt, ST.toon(up ? 0x1a1c1e : 0x3a3f48, {}), [1.0, 1.4], [1.12, 1.34], [0.82, 1.08], { ol: 0.008 });
    ST.bx(cnt, ST.toon(up ? 0x0a0a0c : 0x7fe0a0, { emissive: up ? 0x000000 : 0x2f8a5a, ei: 0.6 }), [1.06, 1.34], [1.34, 1.42], [0.86, 1.04], { rx: -0.4, ol: 0.006 });
    // 拨盘电话
    var ph = ST.grp(cnt, 1.62, 1.12, 0.98);
    ST.bx(ph, ST.toon(up ? 0x2a2422 : 0x1a1c22, {}), [-0.09, 0.09], [0, 0.07], [-0.11, 0.11], { ol: 0.006 });
    ST.cyl(ph, ST.toon(up ? 0x3a302a : 0x2a2e36, {}), 0.085, 0.085, 0.04, 0, 0.09, 0, { ol: 0.005 });
    ST.bx(ph, ST.toon(up ? 0x2a2422 : 0x1a1c22, {}), [-0.06, 0.06], [0.07, 0.12], [-0.13, -0.09], { ol: false });
    for (var hh = 0; hh < 8; hh++) {
      var a = hh / 8 * 6.283;
      ST.cyl(ph, ST.toon(0x0a0a0c, {}), 0.012, 0.012, 0.008, Math.cos(a) * 0.05, 0.112, Math.sin(a) * 0.05, { ol: false });
    }
    // TOKENS 霓虹
    ST.neon(p, 'TOKENS', '#4fe4ff', 1.15, 0.3, 1.2, 2.05, 0.7, 0, { size: 120, tw: 1024, th: 256, gs: 1.4 });

    // 留声机 / 边桌
    var rt = ST.grp(p, -1.28, 0.1, 0.42);
    ST.bx(rt, M.woodDark, [-0.28, 0.28], [0, 0.62], [-0.24, 0.24], { ol: 0.01 });
    ST.bx(rt, ST.toon(up ? 0x1a1614 : 0x3a2a22, {}), [-0.24, 0.24], [0.62, 0.7], [-0.2, 0.2], { ol: 0.008 });
    ST.cyl(rt, ST.toon(up ? 0x141414 : 0x1a1a1e, {}), 0.16, 0.16, 0.02, 0, 0.71, 0, { seg: 14, ol: 0.005 });
    ST.cyl(rt, ST.toon(up ? 0x1a1a1a : 0xd8c8a8, {}), 0.06, 0.06, 0.015, 0, 0.725, 0, { seg: 10, ol: false });
    ST.tube(rt, ST.toon(up ? 0x2a2420 : 0xc8a44a, {}), [
      new THREE.Vector3(-0.1, 0.72, -0.1), new THREE.Vector3(0.02, 0.86, -0.06), new THREE.Vector3(0.08, 0.9, 0.04)
    ], 0.022, 10, {});

    // 墙上的海报
    var po = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.63), new THREE.MeshBasicMaterial({ map: ST.texPoster(ST.theme) }));
    po.position.set(0.05, 1.85, -3.96); p.add(po);

    // 荧光灯管（吊装）
    if (!up) {
      [[-0.6, -2.9], [0.9, -1.4], [-0.9, 0.3]].forEach(function (lz) {
        ST.bx(p, ST.toon(0xfff4d8, { emissive: 0xffe0a0, ei: 1.6 }), [lz[0] - 0.5, lz[0] + 0.5], [3.0, 3.06], [lz[1] - 0.06, lz[1] + 0.06], { ol: false });
        var pl = new THREE.PointLight(0xffcf8f, 1.55, 5.6, 2);
        pl.position.set(lz[0], 2.9, lz[1]);
        p.add(pl);
      });
    }
  }

  /* ---------------- 老屋室内 ---------------- */
  function houseInterior(p) {
    var M = ST.mats, up = ST.theme === 'up', Hh = ST.GEO.HSE;

    // 隔断墙 + 字母墙
    ST.bx(p, M.wallpaper, [Hh.x0, Hh.x1], [0.1, 2.68], [-1.56, -1.44], { ol: 0.01 });
    var alpha = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.5), new THREE.MeshBasicMaterial({
      map: ST.texAlphabet(ST.theme)
    }));
    alpha.position.set(-3.65, 1.32, -1.43);
    p.add(alpha);
    if (!up) {
      // 字母墙的暖光
      var al = new THREE.PointLight(0xffb066, 0.85, 3.2, 2);
      al.position.set(-3.6, 1.9, -0.6);
      p.add(al);
    }

    // 圣诞灯串（波浪形，沿字母墙）
    var bulbs = [];
    var cols = [0xff3a3a, 0xffd24a, 0x4fe4ff, 0x6aff8a, 0xff7ad0, 0xffa040];
    for (var i = 0; i < 26; i++) {
      var t = i / 25;
      var bx = -5.3 + t * 3.3;
      var by = 2.36 + Math.sin(t * Math.PI * 3.2) * 0.16;
      var c = cols[i % cols.length];
      var bm = ST.toon(up ? 0x2a2420 : c, { emissive: up ? 0x100806 : c, ei: up ? 0.12 : 1.6 });
      ST.sph(p, bm, 0.035, bx, by, -1.4, { ol: false });
      if (!up) ST.glow(p, c, 0.26, bx, by, -1.37, 0.55);
      bulbs.push({ mat: bm, i: i, c: c });
    }
    ST.bulbs = ST.bulbs || [];
    if (!up) ST.bulbs = ST.bulbs.concat(bulbs);
    // 电线
    var wirePts = [];
    for (var w = 0; w <= 26; w++) {
      var tt = w / 26;
      wirePts.push(new THREE.Vector3(-5.3 + tt * 3.3, 2.36 + Math.sin(tt * Math.PI * 3.2) * 0.16, -1.41));
    }
    ST.tube(p, ST.toon(0x2a2622, {}), wirePts, 0.006, 60, {});

    // 厨房流理台
    var kx0 = Hh.x0 + 0.12, kx1 = Hh.x0 + 0.78;
    ST.bx(p, ST.toon(up ? 0x1e1c1a : 0xd8ccb4, {}), [kx0, kx1], [0.1, 0.92], [-1.36, 0.62], { ol: 0.012, cs: true });
    ST.bx(p, ST.toon(up ? 0x242220 : 0x8a8f96, {}), [kx0 - 0.03, kx1 + 0.03], [0.92, 0.98], [-1.38, 0.64], { ol: 0.008 });
    // 水槽
    ST.bx(p, ST.toon(up ? 0x141414 : 0x9aa0a8, {}), [kx0 + 0.12, kx1 - 0.12], [0.94, 0.965], [-0.9, -0.4], { ol: 0.005 });
    ST.tube(p, ST.toon(up ? 0x1a1a1a : 0xc8ced8, {}), [
      new THREE.Vector3(kx0 + 0.3, 0.96, -1.1), new THREE.Vector3(kx0 + 0.3, 1.16, -1.1), new THREE.Vector3(kx0 + 0.42, 1.16, -0.82)
    ], 0.016, 10, {});
    // 吊柜
    ST.bx(p, ST.toon(up ? 0x1a1816 : 0xc8b898, {}), [kx0, kx1], [1.55, 2.25], [-1.36, 0.5], { ol: 0.01 });
    ST.bx(p, ST.toon(0x0a0a0a, {}), [kx0 + 0.1, kx1 - 0.1], [1.6, 2.2], [0.5, 0.52], { ol: false });
    // 盘子里的 Eggo 华夫饼
    var plate = ST.grp(p, kx0 + 0.34, 0.98, 0.14);
    ST.cyl(plate, ST.toon(up ? 0x2a2622 : 0xf0e8d8, {}), 0.14, 0.13, 0.022, 0, 0, 0, { seg: 14, ol: 0.005 });
    for (var eg = 0; eg < 3; eg++) {
      ST.bx(plate, ST.toon(up ? 0x2a2018 : 0xd8a45a, {}), [-0.075, 0.075], [0.01 + eg * 0.035, 0.04 + eg * 0.035], [-0.075, 0.075], { rz: 0.2 * eg, ol: 0.004 });
    }
    // 烤面包机
    ST.bx(p, ST.toon(up ? 0x1a1a1a : 0xb8bcc4, {}), [kx0 + 0.18, kx0 + 0.5], [0.98, 1.16], [-0.3, -0.02], { ol: 0.008 });
    ST.bx(p, ST.toon(0x1a1a1a, {}), [kx0 + 0.22, kx0 + 0.46], [1.16, 1.18], [-0.26, -0.06], { ol: false });

    // 冰箱
    var fr = ST.grp(p, Hh.x0 + 0.45, 0.1, 0.95);
    ST.bx(fr, M.fridge, [-0.34, 0.34], [0, 1.72], [-0.32, 0.32], { ol: 0.012, cs: true });
    ST.bx(fr, ST.toon(up ? 0x1a1a1a : 0xbfbcb0, {}), [-0.34, 0.34], [1.1, 1.14], [-0.33, 0.33], { ol: 0.006 });
    ST.cyl(fr, ST.toon(up ? 0x2a2a2a : 0x8a8f96, {}), 0.018, 0.018, 0.3, 0.26, 1.35, 0.34, { ol: false });
    // 冰箱贴
    for (var mg = 0; mg < 4; mg++) {
      ST.bx(fr, ST.toon(up ? 0x2a2020 : [0xff3fa4, 0xffd24a, 0x4fe4ff, 0x6aff8a][mg], {}),
        [-0.18 + mg * 0.09, -0.14 + mg * 0.09], [1.25 + (mg % 2) * 0.12, 1.31 + (mg % 2) * 0.12], [0.325, 0.335], { ol: false });
    }

    // 餐桌
    var dt = ST.grp(p, -3.25, 0.1, -0.3);
    ST.bx(dt, M.woodLight, [-0.52, 0.52], [0.68, 0.75], [-0.38, 0.38], { ol: 0.012, cs: true });
    [[-0.44, -0.3], [0.44, -0.3], [-0.44, 0.3], [0.44, 0.3]].forEach(function (c) {
      ST.bx(dt, M.woodDark, [c[0] - 0.035, c[0] + 0.035], [0, 0.68], [c[1] - 0.035, c[1] + 0.035], { ol: 0.005 });
    });
    // 桌上的 Eggo 与牛奶
    ST.cyl(dt, ST.toon(up ? 0x2a2622 : 0xf0e8d8, {}), 0.13, 0.12, 0.02, -0.2, 0.77, 0.05, { seg: 12, ol: 0.004 });
    for (var e2 = 0; e2 < 2; e2++) {
      ST.bx(dt, ST.toon(up ? 0x2a2018 : 0xd8a45a, {}), [-0.27, -0.13], [0.78 + e2 * 0.035, 0.81 + e2 * 0.035], [-0.02, 0.12], { rz: 0.15, ol: 0.003 });
    }
    ST.cyl(dt, ST.toon(up ? 0x2a2a2a : 0xe8e8e8, {}), 0.05, 0.045, 0.16, 0.26, 0.83, -0.06, { ol: 0.004 });
    // 椅子
    function hchair(x, z, ry) {
      var c = ST.grp(p, x, 0.1, z);
      c.rotation.y = ry;
      ST.bx(c, M.woodDark, [-0.16, 0.16], [0.42, 0.47], [-0.16, 0.16], { ol: 0.007 });
      ST.bx(c, M.woodDark, [-0.16, 0.16], [0.47, 0.88], [-0.18, -0.13], { ol: 0.007 });
      [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].forEach(function (q) {
        ST.bx(c, M.woodDark, [q[0] - 0.016, q[0] + 0.016], [0, 0.42], [q[1] - 0.016, q[1] + 0.016], { ol: false });
      });
    }
    hchair(-3.25, -0.95, 0.1);
    hchair(-3.25, 0.36, Math.PI);

    // 落地灯
    var fl = ST.grp(p, -2.1, 0.1, -0.95);
    ST.cyl(fl, ST.toon(0x2a2622, {}), 0.11, 0.13, 0.03, 0, 0.02, 0, { seg: 10, ol: false });
    ST.cyl(fl, ST.toon(0x2a2622, {}), 0.018, 0.018, 1.5, 0, 0.78, 0, { ol: false });
    ST.cyl(fl, ST.toon(up ? 0x2a2420 : 0xf0d8a8, { emissive: up ? 0x100804 : 0xffc070, ei: up ? 0.2 : 1.1 }), 0.16, 0.24, 0.26, 0, 1.6, 0, { seg: 12, open: true, ol: 0.006 });
    if (!up) {
      ST.glow(fl, 0xffb877, 1.3, 0, 1.5, 0, 0.45);
      var ll = new THREE.PointLight(0xffb877, 0.62, 3.2, 2);
      ll.position.set(0, 1.45, 0);
      fl.add(ll);
    }

    // 墙上的挂钟
    var clk = ST.grp(p, -2.3, 2.05, -1.5);
    ST.cyl(clk, ST.toon(up ? 0x241c18 : 0xe8dcc0, {}), 0.14, 0.14, 0.03, 0, 0, 0, { rx: Math.PI / 2, seg: 14, ol: 0.006 });
    ST.bx(clk, ST.toon(0x1a1a1a, {}), [-0.006, 0.006], [-0.09, 0.02], [0.02, 0.03], { ol: false });

    // 室内门（通往卧室，关着）
    ST.bx(p, M.woodDark, [-3.9, -3.2], [0.1, 2.0], [-1.6, -1.52], { ol: 0.008 });

    if (!up) {
      var hl = new THREE.PointLight(0xffc48a, 1.0, 4.6, 2);
      hl.position.set(-3.9, 2.2, -0.4);
      p.add(hl);
    }
  }

  ST.buildInteriors = function (p) {
    arcadeInterior(p);
    houseInterior(p);
  };

  /* =========================================================
     腐化处理：藤蔓 / 菌毯 / 裂缝
     ========================================================= */
  ST.corruptPass = function (p) {
    var M = ST.mats;
    var vineMat = ST.toon(0x14100f, { emissive: 0x1e0504, ei: 0.22 });
    var vineMat2 = ST.toon(0x1c1815, { emissive: 0x140403, ei: 0.18 });
    var fungusMat = ST.toon(0x36100f, { emissive: 0x2a0605, ei: 0.28 });

    // 呼吸蠕动
    ST.vineTime = { value: 0 };
    [vineMat, vineMat2].forEach(function (m) {
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uTime = ST.vineTime;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
          '#include <begin_vertex>',
          [
            'vec3 transformed = vec3( position );',
            'float w = sin(uTime*0.55 + position.y*3.1 + position.x*2.3 + position.z*1.7);',
            'float w2 = sin(uTime*0.31 + position.y*1.7 - position.z*2.1);',
            'transformed += normal * (w*0.016 + w2*0.012);'
          ].join('\n')
        );
      };
      m.needsUpdate = true;
    });

    /* --- 藤蔓生成器 --- */
    function vine(x0, y0, z0, dir, len, thick, mat) {
      var pts = [new THREE.Vector3(x0, y0, z0)];
      var cur = new THREE.Vector3(x0, y0, z0);
      var d = dir.clone().normalize();
      var segs = 8;
      for (var i = 0; i < segs; i++) {
        d.x += ST.rr(-0.42, 0.42);
        d.y += ST.rr(-0.12, 0.42);
        d.z += ST.rr(-0.42, 0.42);
        d.normalize();
        cur = cur.clone().add(d.clone().multiplyScalar(len / segs));
        pts.push(cur.clone());
      }
      ST.tube(p, mat, pts, thick, 26, { rad: 5 });
      // 分枝
      if (ST.chance(0.7)) {
        var mid = pts[Math.floor(ST.rr(2, segs))];
        var d2 = d.clone().add(new THREE.Vector3(ST.rr(-0.8, 0.8), ST.rr(-0.2, 0.5), ST.rr(-0.8, 0.8))).normalize();
        vine(mid.x, mid.y, mid.z, d2, len * 0.55, thick * 0.6, mat);
      }
      // 末端卷须
      if (ST.chance(0.5)) {
        var tip = pts[pts.length - 1];
        ST.sph(p, mat, thick * 0.9, tip.x, tip.y, tip.z, { ol: false });
      }
    }

    var A = ST.GEO.ARC, Hh = ST.GEO.HSE;

    // 沿墙根生长的粗藤
    for (var i = 0; i < 40; i++) {
      var side = ST.ri(0, 3);
      var sx, sz, dir;
      if (side === 0) { sx = ST.rr(A.x0, A.x1); sz = A.z1; dir = new THREE.Vector3(ST.rr(-0.3, 0.3), 1, ST.rr(-0.2, 0.5)); }
      else if (side === 1) { sx = A.x1; sz = ST.rr(A.z0, A.z1); dir = new THREE.Vector3(ST.rr(-0.5, 0.2), 1, ST.rr(-0.3, 0.3)); }
      else if (side === 2) { sx = ST.rr(Hh.x0, Hh.x1); sz = Hh.z1; dir = new THREE.Vector3(ST.rr(-0.3, 0.3), 1, ST.rr(-0.2, 0.4)); }
      else { sx = ST.rr(A.x0, A.x1); sz = A.z0; dir = new THREE.Vector3(ST.rr(-0.3, 0.3), 1, ST.rr(-0.5, 0.2)); }
      vine(sx, 0.05, sz, dir, ST.rr(1.4, 3.2), ST.rr(0.045, 0.095), ST.chance(0.5) ? vineMat : vineMat2);
    }
    // 屋檐垂下的藤蔓（倒悬世界 → 视觉上向上攀附）
    for (var j = 0; j < 30; j++) {
      var vy = ST.rr(2.6, 3.3);
      var vx = ST.rr(A.x0, A.x1);
      vine(vx, vy, A.z1 - 0.05, new THREE.Vector3(ST.rr(-0.4, 0.4), ST.rr(-0.5, 0.6), ST.rr(-0.6, 0.2)), ST.rr(1.0, 2.4), ST.rr(0.035, 0.075), vineMat);
    }
    // 缠绕电线杆
    for (var k = 0; k < 8; k++) {
      var ang = k / 8 * Math.PI * 4;
      ST.tube(p, vineMat, [
        new THREE.Vector3(2.5 + Math.cos(ang) * 0.16, 0.3 + k * 0.55, -0.55 + Math.sin(ang) * 0.16),
        new THREE.Vector3(2.5 + Math.cos(ang + 2) * 0.16, 0.6 + k * 0.55, -0.55 + Math.sin(ang + 2) * 0.16)
      ], 0.022, 8, {});
    }
    // 街机厅内部藤蔓
    for (var m = 0; m < 14; m++) {
      vine(ST.rr(A.x0 + 0.3, A.x1 - 0.3), 0.12, ST.rr(A.z0 + 0.3, A.z1 - 0.3),
        new THREE.Vector3(ST.rr(-0.4, 0.4), 1, ST.rr(-0.4, 0.4)), ST.rr(1.0, 2.2), ST.rr(0.03, 0.06), vineMat);
    }

    /* --- 菌毯 --- */
    for (var f = 0; f < 40; f++) {
      var fx = ST.rr(-6.3, 6.3), fz = ST.rr(-6.3, 6.3);
      if (Math.abs(fx) < 0.01) continue;
      var fr = ST.rr(0.10, 0.30);
      var blob = ST.sph(p, fungusMat, fr, fx, ST.rr(0.02, 0.08), fz, { sy: 0.18, seg: 8, ol: false });
      blob.rotation.y = ST.rr(0, 3);
    }
    // 墙面菌斑
    for (var f2 = 0; f2 < 46; f2++) {
      var face = ST.ri(0, 2);
      var bx2, by2, bz2;
      if (face === 0) { bx2 = ST.rr(A.x0, A.x1); by2 = ST.rr(0.3, 2.8); bz2 = A.z1 + 0.02; }
      else if (face === 1) { bx2 = A.x1 + 0.02; by2 = ST.rr(0.3, 2.8); bz2 = ST.rr(A.z0, A.z1); }
      else { bx2 = ST.rr(Hh.x0, Hh.x1); by2 = ST.rr(0.3, 2.2); bz2 = Hh.z1 + 0.02; }
      var b3 = ST.sph(p, fungusMat, ST.rr(0.09, 0.26), bx2, by2, bz2, { sy: ST.rr(0.7, 1.8), sz: 0.22, seg: 7, ol: false });
      b3.rotation.y = ST.rr(0, 3);
    }

    /* --- 窗内红光幕 --- */
    var innerGlowTex = ST.cvs(128, 128, function (x, w, h) {
      var g = x.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, 'rgba(255,60,26,0.85)');
      g.addColorStop(0.45, 'rgba(200,30,16,0.35)');
      g.addColorStop(1, 'rgba(120,10,8,0.05)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    var innerGlowMat = new THREE.MeshBasicMaterial({
      map: innerGlowTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, opacity: 0.55
    });
    var ig1 = new THREE.Mesh(new THREE.PlaneGeometry(A.x1 - A.x0 - 0.4, 2.0), innerGlowMat);
    ig1.position.set((A.x0 + A.x1) / 2, 1.5, A.z1 - 0.2);
    p.add(ig1);
    var ig2 = new THREE.Mesh(new THREE.PlaneGeometry(A.z1 - A.z0 - 0.4, 2.0), innerGlowMat);
    ig2.position.set(A.x1 - 0.2, 1.5, (A.z0 + A.z1) / 2);
    ig2.rotation.y = Math.PI / 2;
    p.add(ig2);

    /* --- 立面黏液滴挂 --- */
    for (var dr = 0; dr < 26; dr++) {
      var df = ST.ri(0, 1);
      var dx3, dz3;
      if (df === 0) { dx3 = ST.rr(A.x0, A.x1); dz3 = A.z1 + 0.02; }
      else { dx3 = A.x1 + 0.02; dz3 = ST.rr(A.z0, A.z1); }
      var dy3 = ST.rr(2.2, 3.1);
      var drip = ST.cyl(p, vineMat, 0.012, 0.03, ST.rr(0.3, 1.1), dx3, dy3, dz3, { seg: 5, ol: false });
      ST.sph(p, vineMat, 0.035, dx3, dy3 - 0.55, dz3, { ol: false });
    }

    /* --- 窗口透出的猩红内光 --- */
    for (var gw = 0; gw < 9; gw++) {
      var gx = ST.rr(A.x0 + 0.3, A.x1 - 0.3);
      var gy = ST.rr(0.9, 2.2);
      ST.glow(p, 0xff3418, ST.rr(0.9, 1.8), gx, gy, A.z1 + 0.04, 0.30);
    }
    for (var gw2 = 0; gw2 < 7; gw2++) {
      var gz2 = ST.rr(A.z0 + 0.3, A.z1 - 0.3);
      ST.glow(p, 0xff3418, ST.rr(0.9, 1.7), A.x1 + 0.04, ST.rr(0.9, 2.2), gz2, 0.28);
    }
    // 深渊中的大范围血雾
    ST.glow(p, 0x8a0a08, 9.0, 0, -1.2, -1.0, 0.16);

    /* --- 墙面黑色黏液 --- */
    var slimeMat = ST.toon(0x0a0a0c, { emissive: 0x0e0202, ei: 0.15 });
    for (var sl = 0; sl < 30; sl++) {
      var sface = ST.ri(0, 2);
      var sx3, sy3, sz3;
      if (sface === 0) { sx3 = ST.rr(A.x0, A.x1); sy3 = ST.rr(0.2, 2.9); sz3 = A.z1 + 0.03; }
      else if (sface === 1) { sx3 = A.x1 + 0.03; sy3 = ST.rr(0.2, 2.9); sz3 = ST.rr(A.z0, A.z1); }
      else { sx3 = ST.rr(Hh.x0, Hh.x1); sy3 = ST.rr(0.2, 2.3); sz3 = Hh.z1 + 0.03; }
      var sm = ST.sph(p, slimeMat, ST.rr(0.12, 0.4), sx3, sy3, sz3, { sy: ST.rr(1.2, 2.6), sz: 0.22, seg: 7, ol: false });
      sm.rotation.y = ST.rand() * 3;
    }

    /* --- 路面裂缝（脉动红光） --- */
    ST.riftMats = [];
    var crackMat = new THREE.MeshBasicMaterial({ color: 0xff3a18, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    ST.riftMats.push(crackMat);
    function crack(x0, z0, x1, z1, w) {
      var pts = [new THREE.Vector3(x0, 0.02, z0)];
      var n = 5;
      for (var i = 1; i < n; i++) {
        var t = i / n;
        pts.push(new THREE.Vector3(
          x0 + (x1 - x0) * t + ST.rr(-0.28, 0.28), 0.02,
          z0 + (z1 - z0) * t + ST.rr(-0.28, 0.28)
        ));
      }
      pts.push(new THREE.Vector3(x1, 0.02, z1));
      var curve = new THREE.CatmullRomCurve3(pts);
      var g = new THREE.TubeGeometry(curve, 20, w, 3, false);
      var mesh = new THREE.Mesh(g, crackMat);
      mesh.scale.y = 0.35;
      p.add(mesh);
    }
    crack(-2.4, 3.2, 1.2, 5.6, 0.035);
    crack(1.2, 5.6, 4.2, 4.4, 0.03);
    crack(3.0, 2.2, 5.6, -1.4, 0.032);
    crack(-4.6, 2.6, -2.0, 3.4, 0.026);
    crack(-1.0, -2.0, 1.6, -3.0, 0.024);

    // 缝隙中的红光点
    for (var r = 0; r < 14; r++) {
      var rx = ST.rr(-6, 6), rz = ST.rr(-6, 6);
      ST.glow(p, 0xff2a10, ST.rr(0.3, 0.9), rx, 0.06, rz, 0.5);
    }

    // 下层室内幽红微光（让腐化陈设可见）
    var A2 = ST.GEO.ARC, H2 = ST.GEO.HSE;
    [[0.2, 2.2, -1.6, 2.2], [0.9, 1.0, -0.6, 1.3], [-3.7, 2.0, -0.6, 1.6]].forEach(function (L) {
      var pl = new THREE.PointLight(0xff3a1e, L[3], 4.2, 2);
      pl.position.set(L[0], L[1], L[2]);
      p.add(pl);
    });

    // 焦黑的树（更枯败）
    for (var t2 = 0; t2 < 5; t2++) {
      var tx = ST.rr(-6.2, 5.8), tz = ST.rr(-6.2, 5.8);
      ST.cyl(p, ST.toon(0x0c0a0a, {}), 0.04, 0.09, ST.rr(0.9, 1.8), tx, 0.6, tz, { seg: 6, ol: false });
    }
  };
})();
