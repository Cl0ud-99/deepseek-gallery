/* =========================================================
   core.js — renderer, materials, utilities, camera, post
   Twin Peaks / Glastonbury Grove micro-diorama
   ========================================================= */
(function () {
  'use strict';
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.enabled = true;
  var TP = window.TP = window.TP || {};
  TP.T = T;
  TP.TAU = Math.PI * 2;

  TP.C = {
    ink: 0x050608,
    outline: 0x070a0c,
    night: 0x060b0e,
    fog: 0x0a1216,
    pine: 0x172b28,
    pineDark: 0x0b1715,
    pineLight: 0x34544a,
    moss: 0x314437,
    bog: 0x1b261f,
    bark: 0xb8b3a1,
    barkDark: 0x555a50,
    asphalt: 0x22292c,
    wet: 0x0e1418,
    roadLine: 0xd8d6c2,
    wine: 0x5b0b17,
    wineDeep: 0x2b0308,
    velvet: 0x7c1221,
    velvetHi: 0xc23a45,
    cream: 0xefe6cf,
    ivory: 0xf3ebd9,
    gold: 0xc79543,
    goldHi: 0xffd98c,
    brass: 0x9a7135,
    lamp: 0xffb45f,
    ember: 0xff6e3b,
    cold: 0x94c2c8,
    cyan: 0x73b9b4,
    oil: 0x07090a,
    paper: 0xc9b68e,
    taupe: 0x6f6252
  };

  /* deterministic random -------------------------------------- */
  TP.rng = function (seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  };
  TP.rand = function (a, b) { return a + Math.random() * (b - a); };
  TP.clamp = T.MathUtils.clamp;
  TP.lerp = T.MathUtils.lerp;
  TP.damp = function (a, b, lambda, dt) { return b + (a - b) * Math.exp(-lambda * dt); };

  /* canvas / texture ------------------------------------------ */
  TP.canvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  TP.texture = function (cv, opts) {
    opts = opts || {};
    var t = new T.CanvasTexture(cv);
    t.anisotropy = opts.aniso || 8;
    t.wrapS = opts.wrapS || T.ClampToEdgeWrapping;
    t.wrapT = opts.wrapT || T.ClampToEdgeWrapping;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    t.encoding = opts.linear ? T.LinearEncoding : T.sRGBEncoding;
    t.minFilter = opts.minFilter || T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    t.needsUpdate = true;
    return t;
  };
  TP.radialTexture = function (inner, mid, outer, stops) {
    stops = stops || [0, .2, .55, 1];
    return TP.texture(TP.canvas(192, 192), {
      wrapS: T.ClampToEdgeWrapping,
      wrapT: T.ClampToEdgeWrapping
    });
  };

  /* toon ramp -------------------------------------------------- */
  function ramp(steps) {
    var data = new Uint8Array(steps.length * 4);
    for (var i = 0; i < steps.length; i++) {
      var c = Math.round(TP.clamp(steps[i], 0, 1) * 255);
      data[i * 4] = c; data[i * 4 + 1] = c; data[i * 4 + 2] = c; data[i * 4 + 3] = 255;
    }
    var t = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
    t.minFilter = T.NearestFilter;
    t.magFilter = T.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }
  TP.grad = ramp([.25, .48, .69, .86, 1.0]);
  TP.gradSoft = ramp([.36, .55, .72, .88, 1.0]);

  /* material factory ------------------------------------------ */
  TP.toon = function (color, opts) {
    opts = opts || {};
    var m = new T.MeshToonMaterial({
      color: color,
      gradientMap: opts.gradientMap || TP.grad,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      alphaTest: opts.alphaTest || 0,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      vertexColors: !!opts.vertexColors
    });
    if (opts.flatShading) m.flatShading = true;
    if (opts.rim) {
      var rimColor = new T.Color(opts.rimColor !== undefined ? opts.rimColor : 0x6c9a9c);
      var rimPower = opts.rimPower || 2.2;
      var rimStrength = opts.rim;
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uRimColor = { value: rimColor };
        sh.uniforms.uRimPower = { value: rimPower };
        sh.uniforms.uRimStrength = { value: rimStrength };
        sh.fragmentShader = 'uniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimStrength;\n' + sh.fragmentShader;
        sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
          '{\n' +
          '  float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normalize(normal)), 0.0, 1.0), uRimPower);\n' +
          '  gl_FragColor.rgb += uRimColor * rimF * uRimStrength;\n' +
          '}\n' +
          '#include <dithering_fragment>');
      };
      m.customProgramCacheKey = function () { return 'rim' + rimColor.getHexString() + rimPower + rimStrength; };
    }
    return m;
  };

  TP.basic = function (color, opts) {
    opts = opts || {};
    return new T.MeshBasicMaterial({
      color: color,
      map: opts.map || null,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest !== undefined ? opts.alphaTest : 0,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      blending: opts.blending || T.NormalBlending,
      toneMapped: opts.toneMapped !== false
    });
  };

  TP.std = function (color, opts) {
    opts = opts || {};
    var m = new T.MeshStandardMaterial({
      color: color,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest || 0,
      metalness: opts.metalness !== undefined ? opts.metalness : 0,
      roughness: opts.roughness !== undefined ? opts.roughness : .7,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : .8,
      vertexColors: !!opts.vertexColors
    });
    if (opts.flatShading) m.flatShading = true;
    return m;
  };

  TP.physical = function (color, opts) {
    opts = opts || {};
    var m = new T.MeshPhysicalMaterial({
      color: color,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      roughnessMap: opts.roughnessMap || null,
      metalnessMap: opts.metalnessMap || null,
      metalness: opts.metalness !== undefined ? opts.metalness : 0,
      roughness: opts.roughness !== undefined ? opts.roughness : .2,
      clearcoat: opts.clearcoat !== undefined ? opts.clearcoat : 0,
      clearcoatRoughness: opts.clearcoatRoughness !== undefined ? opts.clearcoatRoughness : .12,
      sheen: opts.sheen !== undefined ? opts.sheen : 0,
      sheenColor: opts.sheenColor !== undefined ? opts.sheenColor : 0xffffff,
      sheenRoughness: opts.sheenRoughness !== undefined ? opts.sheenRoughness : .55,
      transmission: opts.transmission || 0,
      thickness: opts.thickness || 0,
      ior: opts.ior || 1.5,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest || 0,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1
    });
    if (opts.flatShading) m.flatShading = true;
    return m;
  };

  TP.brass = function (color, rough) {
    return TP.std(color === undefined ? TP.C.brass : color, {
      metalness: .82, roughness: rough === undefined ? .28 : rough, envMapIntensity: 1.7
    });
  };
  TP.gold = function (rough) {
    return TP.std(TP.C.gold, { metalness: .9, roughness: rough === undefined ? .22 : rough, envMapIntensity: 2.1, emissive: 0x2a1604, emissiveIntensity: .3 });
  };
  TP.iron = function (color, rough) {
    return TP.std(color === undefined ? 0x1a1e20 : color, { metalness: .72, roughness: rough === undefined ? .4 : rough, envMapIntensity: 1.1 });
  };
  TP.glass = function (tint, opacity) {
    return TP.physical(tint === undefined ? 0xa7c0c4 : tint, {
      metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .025,
      transparent: true, opacity: opacity === undefined ? .14 : opacity,
      side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.8
    });
  };
  TP.glowMat = function (color, opacity, map) {
    return new T.MeshBasicMaterial({
      color: color, map: map || null,
      transparent: true, opacity: opacity === undefined ? 1 : opacity,
      blending: T.AdditiveBlending, depthWrite: false, depthTest: true,
      side: T.DoubleSide, toneMapped: false
    });
  };

  /* geometry helpers ------------------------------------------ */
  var geoCache = {};
  TP.boxGeo = function (w, h, d) {
    var k = 'b' + w.toFixed(3) + '_' + h.toFixed(3) + '_' + d.toFixed(3);
    if (!geoCache[k]) geoCache[k] = new T.BoxGeometry(w, h, d);
    return geoCache[k];
  };
  TP.cylGeo = function (rt, rb, h, seg, open) {
    var k = 'c' + rt.toFixed(3) + '_' + rb.toFixed(3) + '_' + h.toFixed(3) + '_' + (seg || 10) + '_' + (open ? 1 : 0);
    if (!geoCache[k]) geoCache[k] = new T.CylinderGeometry(rt, rb, h, seg || 10, 1, !!open);
    return geoCache[k];
  };
  TP.sphereGeo = function (r, ws, hs) {
    var k = 's' + r.toFixed(3) + '_' + (ws || 14) + '_' + (hs || 10);
    if (!geoCache[k]) geoCache[k] = new T.SphereGeometry(r, ws || 14, hs || 10);
    return geoCache[k];
  };

  /* superellipsoid / soft cushion */
  var pudCache = {};
  TP.puddingGeo = function (w, h, d, p, ws, hs) {
    p = p || .32; ws = ws || 24; hs = hs || 16;
    var k = [w, h, d, p, ws, hs].join('_');
    if (pudCache[k]) return pudCache[k];
    var g = new T.SphereGeometry(1, ws, hs);
    var pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      pos.setXYZ(i,
        Math.sign(x) * Math.pow(Math.abs(x), p) * w * .5,
        Math.sign(y) * Math.pow(Math.abs(y), p) * h * .5,
        Math.sign(z) * Math.pow(Math.abs(z), p) * d * .5);
    }
    g.computeVertexNormals();
    pudCache[k] = g;
    return g;
  };

  /* general outline (inverted hull, screen-space thickness) */
  var outlineMats = {};
  function outlineMat(thick, color) {
    var k = String(thick) + '_' + color;
    if (!outlineMats[k]) {
      outlineMats[k] = new T.ShaderMaterial({
        uniforms: {
          uThickness: { value: thick },
          uColor: { value: new T.Color(color) }
        },
        vertexShader: [
          'uniform float uThickness;',
          'void main(){',
          ' vec4 mv = modelViewMatrix * vec4(position, 1.0);',
          ' vec3 n = normalize(normalMatrix * normal);',
          ' mv.xyz += n * uThickness * (-mv.z);',
          ' gl_Position = projectionMatrix * mv;',
          '}'
        ].join('\n'),
        fragmentShader: 'uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }',
        side: T.BackSide, fog: false, toneMapped: false
      });
    }
    return outlineMats[k];
  }
  TP.ink = function (mesh, thick, color) {
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.normal) return null;
    if (mesh.userData.noOutline) return null;
    var o = new T.Mesh(mesh.geometry, outlineMat(thick === undefined ? .0023 : thick, color === undefined ? TP.C.outline : color));
    o.castShadow = false; o.receiveShadow = false;
    o.userData.isOutline = true;
    o.renderOrder = mesh.renderOrder || 0;
    mesh.add(o);
    return o;
  };

  TP.mesh = function (geo, mat, parent, x, y, z, shadow) {
    var m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    if (parent) parent.add(m);
    return m;
  };
  TP.box = function (w, h, d, mat, parent, x, y, z, shadow, outline, thick) {
    var m = TP.mesh(TP.boxGeo(w, h, d), mat, parent, x, y, z, shadow);
    if (outline !== false) TP.ink(m, thick);
    return m;
  };
  TP.cyl = function (rt, rb, h, seg, mat, parent, x, y, z, shadow, outline, thick) {
    var m = TP.mesh(TP.cylGeo(rt, rb, h, seg, false), mat, parent, x, y, z, shadow);
    if (outline !== false) TP.ink(m, thick);
    return m;
  };
  TP.sphere = function (r, ws, hs, mat, parent, x, y, z, outline, thick) {
    var m = TP.mesh(TP.sphereGeo(r, ws, hs), mat, parent, x, y, z, true);
    if (outline) TP.ink(m, thick);
    return m;
  };
  TP.put = function (parent, mesh, x, y, z, ry, rx, rz) {
    mesh.position.set(x || 0, y || 0, z || 0);
    if (ry) mesh.rotation.y = ry;
    if (rx) mesh.rotation.x = rx;
    if (rz) mesh.rotation.z = rz;
    if (parent) parent.add(mesh);
    return mesh;
  };
  TP.group = function (parent, x, y, z) {
    var g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  };
  TP.plane = function (w, h, mat, opts) {
    opts = opts || {};
    var g = new T.PlaneGeometry(w, h, opts.segsX || 1, opts.segsY || 1);
    return new T.Mesh(g, mat);
  };
  TP.curveTube = function (points, radius, mat, parent, segments, radial) {
    var curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    var m = new T.Mesh(new T.TubeGeometry(curve, segments || 32, radius, radial || 5, false), mat);
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  };
  TP.wire = function (a, b, sag, radius, mat, parent, seg) {
    var mid = a.clone().add(b).multiplyScalar(.5);
    mid.y -= sag === undefined ? .25 : sag;
    var curve = new T.QuadraticBezierCurve3(a, mid, b);
    var m = new T.Mesh(new T.TubeGeometry(curve, seg || 22, radius || .014, 4, false), mat);
    m.castShadow = false; m.receiveShadow = false;
    if (parent) parent.add(m);
    return m;
  };
  TP.torusMesh = function (radius, tube, mat, parent, radial, tubular, arc) {
    var m = new T.Mesh(new T.TorusGeometry(radius, tube, radial || 6, tubular || 24, arc === undefined ? Math.PI * 2 : arc), mat);
    if (parent) parent.add(m);
    return m;
  };
  TP.alignCylinder = function (m, a, b) {
    var d = new T.Vector3().subVectors(b, a);
    var len = d.length();
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    if (m.userData && m.userData.baseLen) m.scale.y = len / m.userData.baseLen;
    return len;
  };

  /* ribbon along a 2D xz curve -------------------------------- */
  TP.ribbonGeo = function (points, width, segments, uvV, widthSegs) {
    var curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    var n = segments || 120;
    var ws = widthSegs || 1;
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var p = curve.getPoint(t);
      var tan = curve.getTangent(t);
      var sx = tan.z, sz = -tan.x;
      var sl = Math.hypot(sx, sz) || 1;
      sx /= sl; sz /= sl;
      for (var j = 0; j <= ws; j++) {
        var u = j / ws;
        var off = (u - .5) * width;
        pos.push(p.x + sx * off, p.y, p.z + sz * off);
        uv.push(u, (uvV === undefined ? 1 : uvV) * t);
      }
    }
    for (var ii = 0; ii < n; ii++) {
      for (var jj = 0; jj < ws; jj++) {
        var a = ii * (ws + 1) + jj;
        var b = a + 1;
        var c = a + (ws + 1);
        var d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };

  TP.irregularDisc = function (radius, seed, points, stretch, inner) {
    var r = TP.rng(seed || 7);
    var n = points || 36;
    var arr = [];
    var start = radius * (inner || .01);
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      var wob = 1 + Math.sin(a * 3 + r() * 2) * .09 + Math.sin(a * 7 + r() * 2) * .06 + (r() - .5) * .09;
      arr.push(new T.Vector2(Math.cos(a) * radius * wob * (stretch ? stretch[0] : 1), Math.sin(a) * radius * wob * (stretch ? stretch[1] : 1)));
    }
    var shape = new T.Shape();
    shape.moveTo(arr[0].x, arr[0].y);
    for (var k = 1; k < arr.length; k++) shape.lineTo(arr[k].x, arr[k].y);
    var g = new T.ShapeGeometry(shape);
    // planar UVs
    var p = g.attributes.position;
    var uv = g.attributes.uv;
    for (var q = 0; q < p.count; q++) {
      uv.setXY(q,
        p.getX(q) / (radius * 2 * (stretch ? stretch[0] : 1)) + .5,
        p.getY(q) / (radius * 2 * (stretch ? stretch[1] : 1)) + .5);
    }
    g.rotateX(-Math.PI / 2);
    return g;
  };

  /* sprites and glows ----------------------------------------- */
  TP.addGlow = function (parent, tex, color, size, opacity, x, y, z, depthTest) {
    var mat = new T.SpriteMaterial({
      map: tex, color: color, transparent: true, opacity: opacity,
      blending: T.AdditiveBlending, depthWrite: false,
      depthTest: depthTest !== false, toneMapped: false
    });
    var s = new T.Sprite(mat);
    s.scale.set(size, size, 1);
    s.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(s);
    return s;
  };
  TP.addSoftSprite = function (parent, tex, color, w, h, opacity, x, y, z) {
    var mat = new T.SpriteMaterial({
      map: tex, color: color, transparent: true, opacity: opacity,
      blending: T.NormalBlending, depthWrite: false, depthTest: true, toneMapped: false
    });
    var s = new T.Sprite(mat);
    s.scale.set(w, h, 1);
    s.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(s);
    return s;
  };

  /* environment cube ------------------------------------------ */
  TP.makeEnvFace = function (kind) {
    var cv = TP.canvas(128, 128), g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, '#010306');
    grd.addColorStop(0.5, '#071216');
    grd.addColorStop(0.76, '#1b2b2b');
    grd.addColorStop(1, '#050807');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    if (kind !== 'py' && kind !== 'ny') {
      var warm = g.createRadialGradient(64, 92, 2, 64, 92, 64);
      warm.addColorStop(0, kind === 'nz' ? 'rgba(255,142,82,.7)' : 'rgba(255,120,74,.25)');
      warm.addColorStop(.35, 'rgba(137,38,25,.14)');
      warm.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = warm; g.fillRect(0, 0, 128, 128);
      var green = g.createRadialGradient(20 + (kind === 'px' ? 60 : 0), 84, 1, 64, 84, 70);
      green.addColorStop(0, 'rgba(92,145,126,.16)');
      green.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = green; g.fillRect(0, 0, 128, 128);
      for (var i = 0; i < 9; i++) {
        g.globalAlpha = .05 + Math.random() * .12;
        g.fillStyle = i % 2 ? '#ff9955' : '#c9fff1';
        g.fillRect(Math.random() * 128, 86 + Math.random() * 28, 2 + Math.random() * 10, 2 + Math.random() * 5);
      }
      g.globalAlpha = 1;
    }
    return cv;
  };

  /* global core state ----------------------------------------- */
  TP.renderer = null; TP.scene = null; TP.camera = null; TP.controls = null;
  TP.world = null; TP.time = 0;
  TP.anim = TP.anim || {};
  TP.anim.curtains = TP.anim.curtains || [];
  TP.anim.steam = TP.anim.steam || [];
  TP.anim.tapes = TP.anim.tapes || [];
  TP.anim.discs = TP.anim.discs || [];

  TP.initCore = function () {
    var canvas = document.getElementById('scene');
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.LinearEncoding;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setClearColor(0x030608, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.autoClear = true;
    TP.renderer = renderer;

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0e1f23, 0.0130);
    TP.scene = scene;
    var world = TP.world = new T.Group();
    scene.add(world);

    var camera = new T.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .15, 180);
    TP.camera = camera;

    /* reflection environment */
    var faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(function (k) { return TP.makeEnvFace(k); });
    var cube = new T.CubeTexture(faces);
    cube.encoding = T.sRGBEncoding;
    cube.needsUpdate = true;
    var pmrem = new T.PMREMGenerator(renderer);
    var envRT = pmrem.fromCubemap(cube);
    scene.environment = envRT.texture;
    TP.env = envRT.texture;
    cube.dispose(); pmrem.dispose();

    /* base lighting */
    var hemiRef = new T.HemisphereLight(0x83a0a8, 0x101713, .92);
    scene.add(hemiRef);
    var ambientRef = new T.AmbientLight(0x3a4b4e, .52);
    scene.add(ambientRef);
    var moon = new T.DirectionalLight(0xc9e2e4, 1.58);
    moon.position.set(-13, 19, -10);
    moon.target.position.set(0, 1.4, 0);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -15.5;
    moon.shadow.camera.right = 15.5;
    moon.shadow.camera.top = 15.5;
    moon.shadow.camera.bottom = -15.5;
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 55;
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = .02;
    scene.add(moon); scene.add(moon.target);
    var fill = new T.DirectionalLight(0x5b8290, .78);
    fill.position.set(14, 8, 17);
    scene.add(fill);
    var frontFill = new T.DirectionalLight(0x7fa5a4, .45);
    frontFill.position.set(-12, 9, 15);
    scene.add(frontFill);
    var rim = new T.DirectionalLight(0xa0cbca, .92);
    rim.position.set(10, 13, -15);
    scene.add(rim);
    var canopy = new T.PointLight(0x94bec1, .86, 38, 2);
    canopy.position.set(2, 16, 4);
    scene.add(canopy);
    var frontBounce = new T.PointLight(0x7fa8a8, .78, 28, 2);
    frontBounce.position.set(7, 5, 14);
    scene.add(frontBounce);
    TP.lights = { hemi: hemiRef, moon: moon, fill: fill, frontFill: frontFill, rim: rim, canopy: canopy, frontBounce: frontBounce, ambient: ambientRef };

    /* sky */
    var skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTime: { value: 0 },
        uTop: { value: new T.Color(0x03080b) },
        uHorizon: { value: new T.Color(0x102529) },
        uGlow: { value: new T.Color(0x2a4244) }
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'varying vec3 vDir;',
        'uniform vec3 uTop, uHorizon, uGlow; uniform float uTime;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
        ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
        ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
        'void main(){',
        ' float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);',
        ' vec3 col = mix(uHorizon, uTop, pow(h, 0.42));',
        ' float band = pow(max(0.0, 1.0 - abs(vDir.y) * 2.8), 2.6);',
        ' col += uGlow * band * 0.20;',
        ' float az = atan(vDir.z, vDir.x);',
        ' vec2 sp = vec2(az * 2.0 + uTime*.002, vDir.y * 5.2);',
        ' float n = noise(sp*1.3+3.0)*0.52 + noise(sp*3.2+8.0)*0.3 + noise(sp*7.1)*0.12;',
        ' float cloud = smoothstep(0.40, 0.92, n) * smoothstep(-0.03, 0.48, vDir.y);',
        ' col += vec3(0.058,0.078,0.083) * cloud;',
        ' col += vec3(0.002,0.004,0.007);',
        ' vec3 moonDir = normalize(vec3(-0.42,0.32,-0.85));',
        ' float moonHalo = pow(max(0.0, dot(normalize(vDir), moonDir)), 26.0);',
        ' col += vec3(0.20,0.26,0.26) * moonHalo * 0.65;',
        ' col += vec3(0.035,0.050,0.052) * pow(max(0.0, 1.0-abs(vDir.y)*3.4), 3.0);',
        ' col *= 1.27;',
        ' gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var sky = new T.Mesh(new T.SphereGeometry(88, 32, 20), skyMat);
    scene.add(sky);
    TP.sky = sky;

    /* low mist under the floating diorama */
    var mistMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(0x384b52) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime; uniform vec3 uColor;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
        'void main(){ vec2 p=vUv-.5; float r=length(p*vec2(1.0,1.32)); float a=exp(-r*4.0);',
        ' float n=noise(p*7.0+vec2(uTime*.012,0.0))*0.6+noise(p*16.0-vec2(0.0,uTime*.018))*0.4;',
        ' a*=smoothstep(0.1,0.66,a*0.6+n*.48); gl_FragColor=vec4(uColor,a*.24); }'
      ].join('\n')
    });
    var mist = new T.Mesh(new T.PlaneGeometry(52, 42), mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.y = -1.75;
    mist.renderOrder = 1;
    scene.add(mist);
    TP.lowMist = mist;

    /* controls & post */
    TP.controls = TP.makeControls(camera, renderer.domElement);
    TP.controls.setInitial();
    TP.Post.init(renderer);

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      TP.Post.resize();
      TP.fitCamera();
    });
    TP.fitCamera();
  };

  TP.fitCamera = function () {
    var st = TP.controls && TP.controls.state;
    if (!st) return;
    var aspect = window.innerWidth / Math.max(1, window.innerHeight);
    var portrait = aspect < .95;
    TP.camera.fov = portrait ? 47 : 35;
    TP.camera.updateProjectionMatrix();
    if (!st.userZoomed) {
      var targetR = portrait ? 51.5 : 39.2;
      targetR *= Math.max(.92, Math.min(1.12, Math.sqrt(1.58 / Math.max(.5, aspect))));
      st.tRadius = targetR;
      if (!st.initialized) { st.radius = targetR; st.tRadius = targetR; }
    }
  };

  /* camera controls ------------------------------------------- */
  TP.makeControls = function (camera, dom) {
    var st = {
      theta: .60, phi: 1.115, radius: 39.2,
      tTheta: .60, tPhi: 1.115, tRadius: 39.2,
      target: new T.Vector3(0, 3.05, .18),
      tTarget: new T.Vector3(0, 3.05, .18),
      lastInput: performance.now(), userZoomed: false, initialized: false,
      autoRotate: false
    };
    var drag = 0, lastX = 0, lastY = 0, pointers = new Map(), pinch = 0, pinchX = null, pinchY = null, moved = 0;
    var dragging = false;
    /* shift/right-drag and two-finger drag share the same pan: push `target`
       along the camera's right/up axes, so the model follows the fingers. */
    function panBy(dx, dy) {
      var k = st.radius * .0014;
      var right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0);
      var up = new T.Vector3().setFromMatrixColumn(camera.matrix, 1);
      st.tTarget.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
      st.tTarget.x = TP.clamp(st.tTarget.x, -5, 5);
      st.tTarget.z = TP.clamp(st.tTarget.z, -5, 5);
      st.tTarget.y = TP.clamp(st.tTarget.y, .6, 7.0);
    }
    function down(e) {
      if (dom.setPointerCapture) try { dom.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = (e.button === 2 || e.button === 1 || e.shiftKey) ? 2 : 1;
      lastX = e.clientX; lastY = e.clientY; moved = 0;
      st.lastInput = performance.now();
      st.autoRotate = false;
      dragging = true;
      dom.style.cursor = 'grabbing';
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        pinchX = (p[0].x + p[1].x) * .5; pinchY = (p[0].y + p[1].y) * .5;
      }
    }
    function move(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      st.lastInput = performance.now();
      if (pointers.size > 1) {
        var p = Array.from(pointers.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        var cx = (p[0].x + p[1].x) * .5, cy = (p[0].y + p[1].y) * .5;
        if (pinch > 0 && d > 0) {
          st.tRadius = TP.clamp(st.tRadius * (pinch / d), 12.5, 66);
          st.userZoomed = true;
        }
        /* two fingers moving together pan; the midpoint drifts during a pinch too,
           which keeps dollies and pans usable in the same gesture */
        if (pinchX !== null) panBy(cx - pinchX, cy - pinchY);
        pinch = d; pinchX = cx; pinchY = cy;
        return;
      }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (drag === 2) {
        panBy(dx, dy);
      } else {
        st.tTheta -= dx * .0048;
        st.tPhi = TP.clamp(st.tPhi - dy * .0038, .20, 1.43);
      }
    }
    function up(e) {
      pointers.delete(e.pointerId);
      pinch = 0; pinchX = pinchY = null;
      if (pointers.size === 0) { drag = 0; dragging = false; dom.style.cursor = 'grab'; }
      else if (pointers.size === 1) {
        /* Re-anchor on the finger that is still down. Without this the next move
           measures from the other finger's old position and throws the camera. */
        var rest = pointers.values().next().value;
        lastX = rest.x; lastY = rest.y;
      }
    }
    function wheel(e) {
      e.preventDefault();
      st.lastInput = performance.now();
      st.userZoomed = true;
      st.tRadius = TP.clamp(st.tRadius * (1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * .0015, .18)), 12.5, 66);
    }
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', wheel, { passive: false });
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.addEventListener('dblclick', function () { st.setShot('hero'); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'r' || e.key === 'R') st.setShot('hero');
    });

    st.update = function (dt) {
      if (drag) st.lastInput = performance.now();
      var k = 1 - Math.pow(0.0016, Math.min(dt, .08));
      st.theta += (st.tTheta - st.theta) * k;
      st.phi += (st.tPhi - st.phi) * k;
      st.radius += (st.tRadius - st.radius) * k;
      st.target.lerp(st.tTarget, k);
      var sp = Math.sin(st.phi), cp = Math.cos(st.phi);
      camera.position.set(
        st.target.x + st.radius * sp * Math.sin(st.theta),
        st.target.y + st.radius * cp,
        st.target.z + st.radius * sp * Math.cos(st.theta)
      );
      camera.lookAt(st.target);
      TP.cameraState = st;
    };
    st.setInitial = function () {
      st.initialized = true;
      st.radius = st.tRadius;
      st.theta = st.tTheta; st.phi = st.tPhi;
      st.target.copy(st.tTarget);
      st.update(.016);
    };
    st.setShot = function (name) {
      var shots = {
        hero: { theta: .60, phi: 1.115, radius: 39.2, target: [0, 3.05, .18] },
        room: { theta: .48, phi: 1.02, radius: 17.0, target: [-.1, 3.65, -.1] },
        roomwide: { theta: .55, phi: .98, radius: 23.0, target: [0, 3.6, -.2] },
        table: { theta: .38, phi: 1.14, radius: 9.6, target: [0, 2.3, -.15] },
        street: { theta: .78, phi: 1.10, radius: 24.0, target: [-2.0, 1.4, 4.8] },
        sign: { theta: .38, phi: 1.10, radius: 16.0, target: [-6.2, 1.9, 5.6] },
        forest: { theta: 1.02, phi: 1.05, radius: 23.0, target: [0, 4.1, -2.2] },
        back: { theta: 2.72, phi: 1.09, radius: 33.0, target: [0, 3.7, -.6] },
        top: { theta: .58, phi: .56, radius: 39.0, target: [0, 2.5, -.4] },
        low: { theta: .68, phi: 1.28, radius: 36.0, target: [0, 2.7, -.5] }
      };
      var s = shots[name] || shots.hero;
      st.userZoomed = name !== 'hero';
      st.tTheta = s.theta; st.tPhi = s.phi; st.tRadius = s.radius;
      st.tTarget.set(s.target[0], s.target[1], s.target[2]);
      if (name === 'hero') {
        st.theta = s.theta; st.phi = s.phi; st.radius = s.radius; st.target.copy(st.tTarget);
      } else {
        st.theta = s.theta; st.phi = s.phi; st.radius = s.radius; st.target.copy(st.tTarget);
      }
      st.update(.016);
    };
    st.state = st;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    return st;
  };

  /* post processing ------------------------------------------- */
  TP.Post = (function () {
    var renderer, sceneRT, bloomA, bloomB, bloomC, bloomD;
    var quadScene, quadCam, quad, brightMat, blurH, blurV, compMat;
    var W = 1, H = 1;
    var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    function rt(w, h, samples) {
      return new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
        minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat,
        type: T.HalfFloatType, depthBuffer: true, stencilBuffer: false,
        samples: samples || 0
      });
    }
    function init(r) {
      renderer = r;
      var dpr = renderer.getPixelRatio();
      W = window.innerWidth; H = window.innerHeight;
      sceneRT = rt(W * dpr, H * dpr, 4);
      bloomA = rt(W * dpr / 3, H * dpr / 3);
      bloomB = rt(W * dpr / 3, H * dpr / 3);
      bloomC = rt(W * dpr / 7, H * dpr / 7);
      bloomD = rt(W * dpr / 7, H * dpr / 7);
      quadScene = new T.Scene();
      quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quad = new T.Mesh(new T.PlaneGeometry(2, 2));
      quad.frustumCulled = false;
      quadScene.add(quad);
      brightMat = new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uThreshold: { value: 1.02 }, uKnee: { value: .42 } },
        vertexShader: VS,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; uniform float uThreshold; uniform float uKnee; void main(){ vec3 c=texture2D(tSrc,vUv).rgb; float l=max(c.r,max(c.g,c.b)); float s=smoothstep(uThreshold,uThreshold+uKnee,l); gl_FragColor=vec4(c*s,1.0); }',
        depthTest: false, depthWrite: false
      });
      function blur(dir) {
        return new T.ShaderMaterial({
          uniforms: { tSrc: { value: null }, uDir: { value: dir }, uTexel: { value: new T.Vector2(1 / 512, 1 / 512) } },
          vertexShader: VS,
          fragmentShader: [
            'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir; uniform vec2 uTexel;',
            'void main(){',
            ' vec2 o=uDir*uTexel;',
            ' vec3 c=texture2D(tSrc,vUv).rgb*0.2270270270;',
            ' c+=texture2D(tSrc,vUv+o*1.3846153846).rgb*0.3162162162;',
            ' c+=texture2D(tSrc,vUv-o*1.3846153846).rgb*0.3162162162;',
            ' c+=texture2D(tSrc,vUv+o*3.2307692308).rgb*0.0702702703;',
            ' c+=texture2D(tSrc,vUv-o*3.2307692308).rgb*0.0702702703;',
            ' gl_FragColor=vec4(c,1.0);',
            '}'
          ].join('\n'),
          depthTest: false, depthWrite: false
        });
      }
      blurH = blur(new T.Vector2(1, 0));
      blurV = blur(new T.Vector2(0, 1));
      compMat = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloomA: { value: null }, tBloomC: { value: null },
          uTime: { value: 0 }, uRes: { value: new T.Vector2(W, H) },
          uBloom: { value: .50 }, uVignette: { value: .56 }, uExposure: { value: 1.66 },
          uGamma: { value: .985 }, uContrast: { value: .99 }, uLift: { value: .042 }, uSaturation: { value: 1.125 }
        },
        vertexShader: VS,
        fragmentShader: [
          'varying vec2 vUv;',
          'uniform sampler2D tScene, tBloomA, tBloomC;',
          'uniform float uTime, uBloom, uVignette, uExposure, uGamma, uContrast, uLift, uSaturation;',
          'uniform vec2 uRes;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
          'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
          ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
          ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
          'vec3 aces(vec3 x){ float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }',
          'void main(){',
          ' vec2 uv=vUv; vec2 d=uv-0.5; float r2=dot(d,d);',
          ' float ca=r2*0.0014;',
          ' vec3 col;',
          ' col.r=texture2D(tScene,uv+d*ca).r;',
          ' col.g=texture2D(tScene,uv).g;',
          ' col.b=texture2D(tScene,uv-d*ca).b;',
          ' vec3 bloom=texture2D(tBloomA,uv).rgb*0.42 + texture2D(tBloomC,uv).rgb*0.76;',
          ' col+=bloom*uBloom;',
          ' float l=dot(col,vec3(0.299,0.587,0.114));',
          ' col=mix(col,col*vec3(0.76,0.94,1.02),(1.0-smoothstep(0.0,0.44,l))*0.52);',
          ' col=mix(col,col*vec3(1.10,1.02,0.87),smoothstep(0.42,1.0,l)*0.58);',
          ' col*=uExposure;',
          ' col=aces(col);',
          ' col=pow(max(col,0.0),vec3(uGamma))*1.08;',
          ' col=clamp((col-0.5)*uContrast+0.5,0.0,1.0);',
          ' float l2=dot(col,vec3(0.299,0.587,0.114));',
          ' col=mix(vec3(l2),col,uSaturation);',
          ' col=mix(col,col*vec3(0.83,0.91,1.05),(1.0-smoothstep(0.0,0.33,l2))*0.46);',
          ' col=mix(col,col*vec3(1.10,1.02,0.91),smoothstep(0.38,1.0,l2)*0.6);',
          ' col += vec3(0.020,0.032,0.038) * (1.0 - smoothstep(0.0,0.36,l2)) * uLift * 30.0;',
          ' col += vec3(0.010,0.014,0.018) * (1.0 - smoothstep(0.0,0.18,l2));',
          ' float vig=smoothstep(0.98,0.12,r2*1.50);',
          ' col*=mix(1.0,vig,uVignette);',
          ' float g=hash(uv*uRes+fract(uTime)*97.3);',
          ' col+=(g-0.5)*0.014;',
          ' gl_FragColor=vec4(max(col,0.0),1.0);',
          '}'
        ].join('\n'),
        depthTest: false, depthWrite: false
      });
    }
    function pass(mat, target) {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      var dpr = renderer.getPixelRatio();
      sceneRT.setSize(W * dpr, H * dpr);
      bloomA.setSize(W * dpr / 3, H * dpr / 3);
      bloomB.setSize(W * dpr / 3, H * dpr / 3);
      bloomC.setSize(W * dpr / 7, H * dpr / 7);
      bloomD.setSize(W * dpr / 7, H * dpr / 7);
      compMat.uniforms.uRes.value.set(W, H);
    }
    function render(scene, camera, time) {
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(0x030608, 1);
      renderer.clear();
      renderer.render(scene, camera);
      TP.frameStats = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points
      };
      brightMat.uniforms.tSrc.value = sceneRT.texture;
      pass(brightMat, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture;
      blurH.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height);
      pass(blurH, bloomB);
      blurV.uniforms.tSrc.value = bloomB.texture;
      blurV.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height);
      pass(blurV, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture;
      blurH.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height);
      pass(blurH, bloomC);
      blurV.uniforms.tSrc.value = bloomC.texture;
      blurV.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height);
      pass(blurV, bloomD);
      compMat.uniforms.tScene.value = sceneRT.texture;
      compMat.uniforms.tBloomA.value = bloomA.texture;
      compMat.uniforms.tBloomC.value = bloomD.texture;
      compMat.uniforms.uTime.value = time;
      quad.material = compMat;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }
    function setExposure(v) { compMat.uniforms.uExposure.value = v; }
    function uniforms() { return compMat.uniforms; }
    return { init: init, resize: resize, render: render, setExposure: setExposure, uniforms: uniforms };
  })();
})();
