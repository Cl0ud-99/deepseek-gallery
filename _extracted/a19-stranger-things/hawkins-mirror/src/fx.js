/* =========================================================
   fx.js — 动效：降雨 / 涟漪 / 玻璃雨痕 / 孢子 / 雷电 / 夺心魔
   ========================================================= */
(function () {
  'use strict';
  var ST = window.ST;

  function hashStr(n) { return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1; }

  /* ---------------- 雨 ---------------- */
  function buildRain(scene) {
    var N = 6000;
    var pos = new Float32Array(N * 3);
    var spd = new Float32Array(N);
    var sz = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = ST.rr(-7.0, 7.0);
      pos[i * 3 + 1] = ST.rr(0, 11.5);
      pos[i * 3 + 2] = ST.rr(-7.0, 7.0);
      spd[i] = ST.rr(5.5, 10.5);
      sz[i] = ST.rr(0.7, 1.5);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 900 },
        uTex: { value: rainTex() }
      },
      vertexShader: [
        'attribute float aSpeed;',
        'attribute float aSize;',
        'uniform float uTime;',
        'uniform float uScale;',
        'varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y = mod(p.y - uTime*aSpeed, 11.5);',
        '  p.x += sin(uTime*0.6 + p.z)*0.06;',
        '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
        '  float dist = -mv.z;',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = 0.17 * aSize * uScale / max(dist, 0.5);',
        // 建筑内部不落雨
        '  if (p.x > -1.78 && p.x < 2.06 && p.z > -4.06 && p.z < 2.06) gl_PointSize = 0.0;',
        '  if (p.x > -5.58 && p.x < -1.72 && p.z > -4.06 && p.z < 0.96) gl_PointSize = 0.0;',
        '  vA = smoothstep(0.0, 1.2, p.y) * (1.0 - smoothstep(0.55, 1.0, dist/34.0));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying float vA;',
        'void main(){',
        '  vec4 t = texture2D(uTex, gl_PointCoord);',
        '  if (t.a < 0.02) discard;',
        '  gl_FragColor = vec4(vec3(0.70,0.84,1.0), t.a * vA * 0.62);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return mat;
  }

  function rainTex() {
    return ST.cvs(32, 64, function (x, w, h) {
      x.clearRect(0, 0, w, h);
      var g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.75, 'rgba(255,255,255,0.5)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(w / 2 - 1.5, 0, 3, h);
    });
  }

  /* ---------------- 屋檐滴水 ---------------- */
  function buildDrips(scene) {
    var lines = [
      { x0: -5.4, x1: -2.0, z: 1.82, y0: 2.35, y1: 0.2, n: 22 },
      { x0: -1.6, x1: 0.9, z: 2.62, y0: 2.28, y1: 0.15, n: 18 },
      { x0: 1.95, x1: 1.95, z: -3.9, y0: 3.1, y1: 0.15, n: 8 }
    ];
    var pts = [], spd = [], size = [], ph = [];
    lines.forEach(function (L) {
      for (var i = 0; i < L.n; i++) {
        var t = (i + 0.5) / L.n;
        pts.push(L.x0 + (L.x1 - L.x0) * t + ST.rr(-0.03, 0.03), L.y0, L.z + ST.rr(-0.02, 0.02));
        spd.push(ST.rr(1.6, 3.0));
        size.push(ST.rr(0.5, 1.0));
        ph.push(ST.rand());
      }
    });
    var n = spd.length;
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('aSpeed', new THREE.Float32BufferAttribute(spd, 1));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 900 }, uTex: { value: ST.glowTex() } },
      vertexShader: [
        'attribute float aSpeed; attribute float aSize; attribute float aPhase;',
        'uniform float uTime; uniform float uScale;',
        'varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  float span = p.y;',
        '  float t = fract(uTime*0.5*aSpeed + aPhase);',
        '  p.y = span * (1.0 - t);',
        '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = 0.11 * aSize * uScale / max(-mv.z, 0.5);',
        '  vA = smoothstep(0.0,0.12,t) * (1.0-smoothstep(0.86,1.0,t));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex; varying float vA;',
        'void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.75,0.88,1.0), t.a*vA*0.75); }'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var p = new THREE.Points(g, mat);
    p.frustumCulled = false;
    scene.add(p);
    return mat;
  }

  /* ---------------- 地面积水涟漪 ---------------- */
  function buildRipples(scene) {
    var N = 90;
    var base = new THREE.PlaneGeometry(1, 1);
    var geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes.position = base.attributes.position;
    geo.attributes.uv = base.attributes.uv;
    var ip = new Float32Array(N * 3), iph = new Float32Array(N), isc = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var x, z;
      var r = ST.rand();
      if (r < 0.62) { x = ST.rr(-6.4, 6.4); z = ST.rr(2.95, 6.5); }
      else if (r < 0.85) { x = ST.rr(2.95, 6.5); z = ST.rr(-6.4, 2.9); }
      else { x = ST.rr(-6.4, 2.6); z = ST.rr(1.9, 2.9); }
      ip[i * 3] = x; ip[i * 3 + 1] = 0.016; ip[i * 3 + 2] = z;
      iph[i] = ST.rand();
      isc[i] = ST.rr(0.5, 1.35);
    }
    geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 3));
    geo.setAttribute('iPhase', new THREE.InstancedBufferAttribute(iph, 1));
    geo.setAttribute('iScale', new THREE.InstancedBufferAttribute(isc, 1));
    geo.instanceCount = N;

    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: [
        'attribute vec3 iPos; attribute float iPhase; attribute float iScale;',
        'uniform float uTime;',
        'varying vec2 vUv; varying float vT;',
        'void main(){',
        '  float t = fract(uTime*0.62 + iPhase*7.31);',
        '  vT = t; vUv = uv;',
        '  vec3 p = vec3(position.x, 0.0, -position.y);',
        '  p *= (0.09 + t*0.62) * iScale;',
        '  p += iPos;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv; varying float vT;',
        'void main(){',
        '  float d = length(vUv - 0.5) * 2.0;',
        '  float ring = smoothstep(0.72,0.90,d) * (1.0 - smoothstep(0.90,1.0,d));',
        '  float ring2 = smoothstep(0.34,0.46,d) * (1.0 - smoothstep(0.46,0.60,d));',
        '  float a = (ring*0.85 + ring2*0.28) * (1.0 - vT) * (1.0 - vT);',
        '  gl_FragColor = vec4(vec3(0.55,0.78,1.0), a*0.34);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    scene.add(m);
    return mat;
  }

  /* ---------------- 玻璃雨痕 ---------------- */
  function glassRain(w, h, x, y, z, ry) {
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime;',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }',
        'void main(){',
        '  float col = floor(vUv.x*18.0);',
        '  float fx = fract(vUv.x*18.0);',
        '  float seed = hash(vec2(col,7.0));',
        '  float sp = 0.18 + seed*0.55;',
        '  float ypos = 1.0 - fract(uTime*sp + seed*11.0);',
        '  float dx = abs(fx-0.5);',
        '  float drop = smoothstep(0.16,0.0,dx) * smoothstep(0.012,0.0,abs(vUv.y-ypos));',
        '  float dy = vUv.y - ypos;',
        '  float trail = smoothstep(0.0,-0.22,dy) * smoothstep(0.14,0.0,dx) * 0.16;',
        '  float a = drop*0.22 + trail*0.6;',
        '  a *= 0.55 + 0.45*seed;',
        '  gl_FragColor = vec4(vec3(0.70,0.84,1.0), a*0.30);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    return { mesh: m, mat: mat };
  }

  /* ---------------- 孢子 ---------------- */
  function buildSpores(scene) {
    var N = 700;
    var pos = new Float32Array(N * 3), spd = new Float32Array(N), sz = new Float32Array(N), ph = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = ST.rr(-6.6, 6.6);
      pos[i * 3 + 1] = ST.rr(-9.5, -0.9);
      pos[i * 3 + 2] = ST.rr(-6.6, 6.6);
      spd[i] = ST.rr(0.10, 0.34);
      sz[i] = ST.rr(0.5, 1.6);
      ph[i] = ST.rand() * 6.283;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 900 }, uTex: { value: ST.glowTex() } },
      vertexShader: [
        'attribute float aSpeed; attribute float aSize; attribute float aPhase;',
        'uniform float uTime; uniform float uScale;',
        'varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  float span = 8.6;',
        '  p.y = -0.9 - mod((-p.y-0.9) - uTime*aSpeed, span);',
        '  p.x += sin(uTime*0.35 + aPhase)*0.28;',
        '  p.z += cos(uTime*0.28 + aPhase*1.7)*0.28;',
        '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = 0.075 * aSize * uScale / max(-mv.z, 0.5);',
        '  vA = smoothstep(-9.6,-8.2,p.y) * (1.0 - smoothstep(-2.2,-0.95,p.y));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex; varying float vA;',
        'void main(){ vec4 t = texture2D(uTex, gl_PointCoord); if(t.a<0.01) discard; gl_FragColor = vec4(vec3(0.86,0.90,0.94), t.a*vA*0.55); }'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var p = new THREE.Points(g, mat);
    p.frustumCulled = false;
    scene.add(p);
    return mat;
  }

  /* ---------------- 深渊血雾 ---------------- */
  function buildAbyss(scene) {
    var g = new THREE.Group();
    var defs = [
      [0, -6.0, -9, 26, 0x4a0a14, 0.30],
      [-9, -7.5, -4, 20, 0x3a0a20, 0.24],
      [10, -6.5, -6, 18, 0x1a1030, 0.22],
      [0, -11.5, -2, 22, 0x5a0c10, 0.18]
    ];
    defs.forEach(function (d) {
      var sp = ST.glow(g, d[4], d[3], d[0], d[1], d[2], d[5]);
      sp.material.blending = THREE.AdditiveBlending;
    });
    scene.add(g);
    return g;
  }

  /* ---------------- 夺心魔剪影 ---------------- */
  function buildMindFlayer(scene) {
    var g = new THREE.Group();
    g.position.set(-0.6, -7.6, -1.4);
    g.scale.setScalar(1.35);
    g.rotation.y = 0.4;

    var sil = new THREE.MeshBasicMaterial({ color: 0x03040a, transparent: true, opacity: 0.0, depthWrite: false });

    // 躯干
    var body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 12), sil);
    body.scale.set(1.15, 0.85, 1.15);
    g.add(body);
    // 头部
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), sil);
    head.position.set(0, 1.5, 0.15);
    head.scale.set(1.0, 0.9, 1.0);
    g.add(head);
    // 长肢
    for (var i = 0; i < 9; i++) {
      var a = (i / 9) * Math.PI * 2 + 0.3;
      var len = 4.2 + (i % 3) * 1.1;
      var pts = [
        new THREE.Vector3(Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8),
        new THREE.Vector3(Math.cos(a) * 2.2, 1.9 + (i % 2) * 0.7, Math.sin(a) * 2.2),
        new THREE.Vector3(Math.cos(a) * 3.0, 0.2, Math.sin(a) * 3.0),
        new THREE.Vector3(Math.cos(a) * len, -1.9 - (i % 3) * 0.5, Math.sin(a) * len)
      ];
      var curve = new THREE.CatmullRomCurve3(pts);
      var geo = new THREE.TubeGeometry(curve, 18, 0.16, 5, false);
      g.add(new THREE.Mesh(geo, sil));
    }

    // 身后血光
    var halo = ST.glow(g, 0x7a1410, 17, 0, 0.8, -5.0, 0.0);
    halo.material.blending = THREE.AdditiveBlending;
    var halo2 = ST.glow(g, 0x3a1a4a, 26, 0, 1.2, -8.0, 0.0);
    halo2.material.blending = THREE.AdditiveBlending;

    scene.add(g);
    return { group: g, sil: sil, halos: [halo, halo2] };
  }

  /* ---------------- 红色雷电 ---------------- */
  function buildLightning(scene) {
    var g = new THREE.Group();
    var mat = new THREE.LineBasicMaterial({ color: 0xff8a5a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var mat2 = new THREE.LineBasicMaterial({ color: 0xffd0b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var boltA = new THREE.LineSegments(new THREE.BufferGeometry(), mat);
    var boltB = new THREE.LineSegments(new THREE.BufferGeometry(), mat2);
    boltA.frustumCulled = false; boltB.frustumCulled = false;
    g.add(boltA); g.add(boltB);

    var light = new THREE.PointLight(0xff3a20, 0, 30, 2);
    light.position.set(0, -6.5, -1);
    scene.add(light);
    scene.add(g);

    function makeBolt(seedShift) {
      var verts = [];
      var x0 = ST.rr(-6, 6), z0 = ST.rr(-6, 3);
      var yTop = -3.0, yBot = -9.6;
      var n = 16;
      var prev = new THREE.Vector3(x0, yTop, z0);
      for (var i = 1; i <= n; i++) {
        var t = i / n;
        var p = new THREE.Vector3(
          x0 + ST.rr(-1.6, 1.6) * t + Math.sin(t * 7 + seedShift) * 0.5,
          yTop + (yBot - yTop) * t,
          z0 + ST.rr(-1.2, 1.2) * t
        );
        verts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
        // 分叉
        if (i % 4 === 0 && ST.chance(0.8)) {
          var b = new THREE.Vector3(p.x + ST.rr(-2.2, 2.2), p.y - ST.rr(1.0, 2.6), p.z + ST.rr(-1.5, 1.5));
          verts.push(p.x, p.y, p.z, b.x, b.y, b.z);
        }
        prev = p;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      return geo;
    }

    return {
      group: g, mats: [mat, mat2], bolts: [boltA, boltB], light: light,
      regen: function () {
        boltA.geometry.dispose();
        boltB.geometry.dispose();
        boltA.geometry = makeBolt(ST.rand() * 10);
        boltB.geometry = makeBolt(ST.rand() * 10 + 3);
      }
    };
  }

  /* ---------------- 湿地反光条 ---------------- */
  function reflectTex() {
    return ST.cvs(64, 256, function (x, w, h) {
      x.clearRect(0, 0, w, h);
      for (var i = 0; i < 26; i++) {
        var px = ST.rand() * w;
        var ww = ST.rr(1.5, 6);
        var g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.22)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(px, 0, ww, h * ST.rr(0.5, 1));
      }
    });
  }

  ST.addWetReflections = function (p) {
    var tex = reflectTex();
    function streak(x, z, w, len, color, op) {
      var mat = new THREE.MeshBasicMaterial({
        map: tex, color: color, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
      m.position.set(x, 0.018, z + len / 2);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = Math.PI;
      p.add(m);
      return m;
    }
    streak(-0.35, 2.55, 3.4, 3.4, 0xff3fa4, 0.72);   // 街机厅招牌
    streak(1.2, 2.6, 1.6, 2.6, 0x4fe4ff, 0.5);
    streak(2.15, 1.0, 2.4, 3.2, 0xff3fa4, 0.48);
    streak(-3.6, 2.9, 2.2, 2.4, 0xffb877, 0.55);     // 路灯
    streak(-1.15, 2.4, 1.2, 1.8, 0xff4040, 0.6);   // 可乐机
    streak(-4.85, 2.6, 1.0, 1.4, 0xffd89a, 0.3);    // 电话亭
    streak(2.6, 2.2, 0.8, 1.2, 0x8fd8ff, 0.25);
    streak(0.2, 2.4, 2.2, 2.6, 0xff6ab0, 0.30);

    // 地面光池（湿地反光晕）
    function pool(x, z, size, color, op) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.62),
        new THREE.MeshBasicMaterial({
          map: ST.glowTex(), color: color, transparent: true, opacity: op,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.02, z);
      p.add(m);
      return m;
    }
    pool(-0.2, 3.1, 5.6, 0xff3fa4, 0.22);
    pool(2.4, 1.6, 4.0, 0xff3fa4, 0.14);
    pool(-3.6, 3.3, 3.4, 0xffb877, 0.16);
    pool(-1.15, 2.9, 2.2, 0xff4040, 0.16);
  };

  /* ---------------- 汇总 ---------------- */
  ST.fx = {
    glass: [],
    init: function (scene) {
      this.rainMat = buildRain(scene);
      this.dripMat = buildDrips(scene);
      this.rippleMat = buildRipples(scene);
      this.sporeMat = buildSpores(scene);
      this.mf = buildMindFlayer(scene);
      this.abyss = buildAbyss(scene);
      this.lt = buildLightning(scene);
      this.lt.regen();
      this.nextBolt = 1.5;
      this.flash = 0;
      this.time = 0;
    },
    addGlass: function (w, h, x, y, z, ry) {
      var g = glassRain(w, h, x, y, z, ry);
      this.glass.push(g);
    },
    update: function (t, dt, camera) {
      var f = this;
      if (f.rainMat) f.rainMat.uniforms.uTime.value = t;
      if (f.dripMat) f.dripMat.uniforms.uTime.value = t;
      if (f.rippleMat) f.rippleMat.uniforms.uTime.value = t;
      if (f.sporeMat) f.sporeMat.uniforms.uTime.value = t;
      f.glass.forEach(function (g) { g.mat.uniforms.uTime.value = t; });

      // 雷电
      f.nextBolt -= dt;
      if (f.nextBolt <= 0) {
        f.lt.regen();
        f.nextBolt = ST.rr(2.4, 5.5);
        f.flash = 1;
      }
      f.flash = Math.max(0, f.flash - dt * 2.6);
      var fl = f.flash * f.flash;
      f.lt.mats[0].opacity = fl * 0.95;
      f.lt.mats[1].opacity = fl * 0.55;
      f.lt.light.intensity = fl * 9.0;

      // 夺心魔浮现
      var mfA = Math.max(0, f.flash - 0.10) * 1.3;
      f.mf.sil.opacity = Math.min(0.96, mfA * 0.96);
      f.mf.halos[0].material.opacity = Math.min(0.75, mfA * 0.72);
      f.mf.halos[1].material.opacity = Math.min(0.45, mfA * 0.42);
      f.mf.group.position.y = -7.6 + Math.sin(t * 0.35) * 0.25;
      f.mf.group.rotation.y = 0.4 + Math.sin(t * 0.12) * 0.12;

      // 街机屏幕
      if (ST.screens) {
        var fr = Math.floor(t * 3.2) % 4;
        ST.screens.forEach(function (s) {
          s.mat.map.offset.x = fr * 0.25 + (s.i % 4) * 0.25 % 1;
          s.mat.map.offset.x = ((fr + s.i) % 4) * 0.25;
        });
      }
      // CRT 雪花
      if (ST.crtMats) ST.crtMats.forEach(function (m) { m.uniforms.uT.value = t; });

      // 圣诞灯追逐
      if (ST.bulbs) {
        ST.bulbs.forEach(function (b) {
          var on = (Math.floor(t * 6 - b.i * 0.6) % 5) !== 0;
          b.mat.emissiveIntensity = on ? 1.6 : 0.25;
          b.mat.color.setHex(on ? b.c : 0x2a2420);
        });
      }
      // 藤蔓呼吸
      if (ST.vineTime) ST.vineTime.value = t;
      // 裂缝脉动
      if (ST.riftMats) {
        var pu = 0.55 + 0.45 * Math.sin(t * 2.1);
        ST.riftMats.forEach(function (m) { m.opacity = 0.45 + pu * 0.5; });
        if (ST.seamLight) ST.seamLight.intensity = 1.0 + pu * 1.5;
      }
      // 路灯频闪（上下同步）
      if (ST.flickerLights) {
        var fl2 = 0.82 + 0.18 * Math.sin(t * 3.0);
        var spike = Math.sin(t * 23.0) > 0.94 ? 0.25 : 1;
        var dip = (Math.floor(t * 7) % 23 === 0) ? 0.35 : 1;
        var v = fl2 * spike * dip;
        ST.flickerLights.forEach(function (L) { L.intensity = L.userData.base * v; });
      }
    }
  };
})();
