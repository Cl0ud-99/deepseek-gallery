/* =========================================================
   util.js — 材质 / 纹理 / 几何 小工具
   ========================================================= */
(function () {
  const APP = (window.APP = window.APP || {});
  const U = (APP.U = {});

  /* ---------------- 随机 ---------------- */
  let seed = 20261029;
  U.seed = (s) => { seed = s >>> 0; };
  U.rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  U.rr = (a, b) => a + (b - a) * U.rnd();
  U.ri = (a, b) => Math.floor(a + (b - a + 1) * U.rnd());
  U.rpick = (arr) => arr[Math.floor(U.rnd() * arr.length) % arr.length];

  U.lerp = (a, b, t) => a + (b - a) * t;
  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.smooth = (t) => t * t * (3 - 2 * t);

  /* ---------------- 颜色 ---------------- */
  U.shade = function (hex, amt) {
    const c = new THREE.Color(hex);
    const h = {}; c.getHSL(h);
    c.setHSL(h.h, U.clamp(h.s + amt * 0.0016, 0, 1), U.clamp(h.l + amt * 0.0045, 0, 1));
    return '#' + c.getHexString();
  };
  U.mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

  /* ---------------- canvas ---------------- */
  U.cv = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { c: c, x: c.getContext('2d') };
  };
  U.tex = function (canvas, rx, ry, srgb) {
    const t = new THREE.CanvasTexture(canvas);
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = 8;
    return t;
  };

  /* 木纹板 */
  U.plankTex = function (base, dark, planks) {
    planks = planks || 8;
    const S = 512, o = U.cv(S, S), x = o.x;
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    const pw = S / planks;
    for (let i = 0; i < planks; i++) {
      x.fillStyle = U.shade(base, U.rr(-26, 22));
      x.fillRect(i * pw, 0, pw + 1, S);
      // 木纹
      for (let g = 0; g < 22; g++) {
        x.strokeStyle = 'rgba(30,10,4,' + U.rr(0.03, 0.09).toFixed(3) + ')';
        x.lineWidth = U.rr(0.5, 1.8);
        x.beginPath();
        const gx = i * pw + U.rr(3, pw - 3);
        x.moveTo(gx, -10);
        for (let y = 0; y <= S + 10; y += 26) x.lineTo(gx + Math.sin(y * 0.014 + g * 1.7) * U.rr(1, 3.4), y);
        x.stroke();
      }
      // 木节
      if (U.rnd() > 0.72) {
        const kx = i * pw + U.rr(6, pw - 6), ky = U.rr(20, S - 20);
        for (let k = 5; k > 0; k--) {
          x.strokeStyle = 'rgba(40,14,6,0.18)';
          x.lineWidth = 1.4;
          x.beginPath();
          x.ellipse(kx, ky, k * 3.2, k * 6.5, 0.2, 0, Math.PI * 2);
          x.stroke();
        }
      }
      // 板缝
      x.fillStyle = dark; x.globalAlpha = 0.85;
      x.fillRect(i * pw - 1, 0, 2, S);
      x.globalAlpha = 0.25;
      x.fillRect(i * pw + 2, 0, 1, S);
      x.globalAlpha = 1;
      // 钉子
      if (U.rnd() > 0.5) {
        for (let n = 0; n < 2; n++) {
          x.fillStyle = 'rgba(20,16,12,0.55)';
          x.beginPath(); x.arc(i * pw + pw * 0.5, 18 + n * (S - 36), 2.4, 0, 7); x.fill();
        }
      }
    }
    return o.c;
  };

  /* 帆布 */
  U.clothTex = function (base) {
    const S = 256, o = U.cv(S, S), x = o.x;
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 4200; i++) {
      x.fillStyle = 'rgba(120,110,92,' + U.rr(0.01, 0.05).toFixed(3) + ')';
      x.fillRect(U.rr(0, S), U.rr(0, S), U.rr(1, 5), U.rr(1, 3));
    }
    // 缝合线
    for (let i = 1; i < 4; i++) {
      const y = (S / 4) * i;
      x.strokeStyle = 'rgba(140,128,105,0.35)'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke();
      x.setLineDash([4, 6]); x.strokeStyle = 'rgba(90,78,60,0.3)';
      x.beginPath(); x.moveTo(0, y + 3); x.lineTo(S, y + 3); x.stroke();
      x.setLineDash([]);
    }
    return o.c;
  };

  /* 牛皮纸 */
  U.kraftTex = function () {
    const S = 256, o = U.cv(S, S), x = o.x;
    x.fillStyle = '#c9a271'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = 'rgba(' + U.ri(90, 150) + ',' + U.ri(60, 110) + ',' + U.ri(30, 70) + ',' + U.rr(0.02, 0.1).toFixed(3) + ')';
      x.fillRect(U.rr(0, S), U.rr(0, S), U.rr(1, 4), U.rr(1, 4));
    }
    return o.c;
  };

  /* 表盘 */
  U.dialTex = function () {
    const S = 256, o = U.cv(S, S), x = o.x;
    x.fillStyle = '#efe4c8'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill();
    x.strokeStyle = '#2b2118'; x.lineWidth = 2;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, r0 = i % 6 === 0 ? 96 : 108;
      x.beginPath();
      x.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
      x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118);
      x.lineWidth = i % 6 === 0 ? 3 : 1;
      x.stroke();
    }
    x.fillStyle = '#3a2c1e'; x.font = 'bold 22px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('N', 128, 44); x.fillText('S', 128, 214); x.fillText('E', 212, 128); x.fillText('W', 44, 128);
    x.strokeStyle = '#b8862f'; x.lineWidth = 3;
    x.beginPath(); x.arc(128, 128, 70, 0, 7); x.stroke();
    x.fillStyle = '#8c6a2a'; x.font = 'italic 16px Georgia';
    x.fillText('ALT · 3 200 m', 128, 170);
    return o.c;
  };

  /* 招牌 */
  U.signTex = function (line1, line2) {
    const o = U.cv(512, 256), x = o.x;
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#3d2a1c'); g.addColorStop(1, '#2a1a10');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#c9a227'; x.lineWidth = 8; x.strokeRect(14, 14, 484, 228);
    x.strokeStyle = 'rgba(201,162,39,0.35)'; x.lineWidth = 2; x.strokeRect(28, 28, 456, 200);
    x.fillStyle = '#e8c46a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 74px "Microsoft YaHei","PingFang SC",sans-serif';
    x.fillText(line1, 256, 104);
    x.font = '22px Georgia,serif'; x.fillStyle = '#c9a227';
    x.fillText(line2, 256, 176);
    // 铆钉
    for (const p of [[34, 34], [478, 34], [34, 222], [478, 222]]) {
      x.fillStyle = '#e8c46a'; x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill();
    }
    return o.c;
  };

  /* 光晕 */
  U.glowTex = function () {
    const S = 128, o = U.cv(S, S), x = o.x;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,240,210,0.55)');
    g.addColorStop(0.6, 'rgba(255,210,150,0.14)');
    g.addColorStop(1, 'rgba(255,200,140,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return o.c;
  };

  /* 软云 */
  U.softTex = function () {
    const S = 256, o = U.cv(S, S), x = o.x;
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.45, 'rgba(240,247,255,0.45)');
    g.addColorStop(1, 'rgba(225,238,252,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    // 打散一点，别太圆
    for (let i = 0; i < 26; i++) {
      const a = U.rr(0, 7), r = U.rr(20, 100);
      const px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r;
      const gg = x.createRadialGradient(px, py, 1, px, py, U.rr(28, 66));
      gg.addColorStop(0, 'rgba(255,255,255,0.5)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gg; x.beginPath(); x.arc(px, py, 66, 0, 7); x.fill();
    }
    return o.c;
  };

  /* ---------------- 材质 ---------------- */
  const grad = (function () {
    const d = new Uint8Array([56, 56, 56, 255, 122, 122, 122, 255, 198, 198, 198, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  })();
  U.grad = grad;

  // 云专用的低对比色阶：避免每朵云都出现硬分界
  const gradSoft = (function () {
    const d = new Uint8Array([132, 132, 132, 255, 186, 186, 186, 255, 224, 224, 224, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  })();
  U.gradSoft = gradSoft;

  U.toon = function (color, opt) {
    opt = opt || {};
    const m = new THREE.MeshToonMaterial({
      color: color,
      gradientMap: opt.grad || grad,
      map: opt.map || null,
      transparent: !!opt.transparent,
      opacity: opt.opacity !== undefined ? opt.opacity : 1,
      side: opt.side || THREE.FrontSide,
      vertexColors: !!opt.vertexColors,
      emissive: opt.emissive !== undefined ? opt.emissive : 0x000000,
      emissiveIntensity: opt.emissiveIntensity !== undefined ? opt.emissiveIntensity : 1,
      depthWrite: opt.depthWrite !== undefined ? opt.depthWrite : true
    });
    return m;
  };

  U.std = function (color, opt) {
    opt = opt || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: opt.metalness !== undefined ? opt.metalness : 0,
      roughness: opt.roughness !== undefined ? opt.roughness : 0.6,
      map: opt.map || null,
      emissive: opt.emissive !== undefined ? opt.emissive : 0x000000,
      emissiveIntensity: opt.emissiveIntensity !== undefined ? opt.emissiveIntensity : 1,
      transparent: !!opt.transparent,
      opacity: opt.opacity !== undefined ? opt.opacity : 1,
      side: opt.side || THREE.FrontSide,
      envMapIntensity: opt.env !== undefined ? opt.env : 1,
      flatShading: !!opt.flatShading
    });
  };

  U.glass = function (color, opacity) {
    const m = new THREE.MeshStandardMaterial({
      color: color || 0xd7ecf7,
      metalness: 0.05,
      roughness: 0.05,
      transparent: true,
      opacity: opacity === undefined ? 0.14 : opacity,
      envMapIntensity: 1.55,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    return m;
  };

  U.glowMat = function (color, opacity) {
    const t = U._glowTex || (U._glowTex = U.tex(U.glowTex(), 1, 1));
    return new THREE.SpriteMaterial({
      map: t, color: color || 0xffd28a, transparent: true,
      opacity: opacity === undefined ? 0.9 : opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    });
  };

  U.glow = function (color, size, opacity) {
    const s = new THREE.Sprite(U.glowMat(color, opacity));
    s.scale.set(size, size, 1);
    return s;
  };

  /* ---------------- 几何辅助 ---------------- */
  U.mesh = function (geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  };
  U.box = function (w, h, d, mat, x, y, z) {
    return U.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  };
  U.cyl = function (rt, rb, h, seg, mat, x, y, z) {
    return U.mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat, x, y, z);
  };
  U.sph = function (r, mat, x, y, z, sx, sy, sz) {
    const m = U.mesh(new THREE.SphereGeometry(r, 20, 14), mat, x, y, z);
    if (sx !== undefined) m.scale.set(sx, sy, sz);
    return m;
  };
  U.tor = function (r, t, mat, x, y, z, arc) {
    return U.mesh(new THREE.TorusGeometry(r, t, 8, 24, arc || Math.PI * 2), mat, x, y, z);
  };

  /* 描边（墨线） */
  U.ink = function (mesh, color, opacity, angle) {
    const eg = new THREE.EdgesGeometry(mesh.geometry, angle === undefined ? 28 : angle);
    const line = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
      color: color === undefined ? 0x1a1620 : color,
      transparent: true,
      opacity: opacity === undefined ? 0.5 : opacity
    }));
    line.renderOrder = 3;
    mesh.add(line);
    return line;
  };

  /* 点状线 */
  U.rope = function (points, color, opacity, radius) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), radius || 0.045, 5, false);
    return new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: color || 0x8a6a45, gradientMap: grad }));
  };

  /* 铁链 */
  U.chain = function (a, b, links, mat, sag) {
    const g = new THREE.Group();
    const geo = new THREE.TorusGeometry(0.1, 0.028, 5, 9);
    const inst = new THREE.InstancedMesh(geo, mat, links);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3(), tan = new THREE.Vector3();
    const A = new THREE.Vector3().copy(a), B = new THREE.Vector3().copy(b);
    const sagAmt = sag === undefined ? 0.5 : sag;
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    const getP = (t, out) => {
      out.lerpVectors(A, B, t);
      out.y -= Math.sin(Math.PI * t) * sagAmt;
      return out;
    };
    const xA = new THREE.Vector3(), yA = new THREE.Vector3(), zA = new THREE.Vector3();
    for (let i = 0; i < links; i++) {
      const t = (i + 0.5) / links;
      getP(t, pos);
      getP(Math.min(1, t + 0.02), tmpB);
      getP(Math.max(0, t - 0.02), tmpA);
      tan.subVectors(tmpB, tmpA).normalize();
      // 环面法线交替
      xA.copy(tan);
      zA.set(Math.cos(i * 1.7), 0.3, Math.sin(i * 1.7));
      zA.crossVectors(tan, zA).normalize();
      if (i % 2 === 1) zA.applyAxisAngle(tan, Math.PI / 2);
      yA.crossVectors(zA, xA).normalize();
      m.makeBasis(xA, yA, zA);
      q.setFromRotationMatrix(m);
      m.compose(pos, q, sc);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.castShadow = true;
    g.add(inst);
    return g;
  };

  /* 几何扰动 */
  U.deform = function (geo, fn) {
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      fn(v, i);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  };

  /* 简易 3D 噪声 */
  U.noise3 = function (x, y, z) {
    return Math.sin(x * 1.7 + Math.cos(y * 1.3) * 2.1) * Math.cos(z * 1.9 + Math.sin(x * 0.8) * 1.7) * 0.5
      + Math.sin(x * 3.1 + z * 2.7 + y * 1.1) * 0.3
      + Math.cos(y * 2.3 - z * 1.5) * 0.2;
  };

  /* 圆角矩形 Shape */
  U.roundRectShape = function (w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };

  /* 实例化云团 */
  U.instanced = function (geo, mat, n) {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    return m;
  };
})();
