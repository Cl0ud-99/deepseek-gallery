/* =========================================================
   core.js — renderer, toon materials, camera controls, post
   ========================================================= */
(function () {
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.enabled = true;
  var QP = (window.QP = window.QP || {});
  QP.T = T;

  /* ---------------- palette ---------------- */
  QP.PAL = {
    ink:          0x060812,
    outline:      0x080a11,
    night:        0x080d17,
    fog:          0x0b111b,
    brick:        0x76392f,
    brickDark:    0x4d241f,
    brickLight:   0x9a5a45,
    stone:        0x978d7c,
    stoneDark:    0x5d574f,
    slate:        0x263334,
    slateWet:     0x324746,
    walnut:       0x392319,
    walnutLight:  0x67452b,
    brass:        0xb68a3e,
    brassLight:   0xe5c275,
    gold:         0xd2a74f,
    wine:         0x5a1527,
    wineLight:    0x8b2940,
    emerald:      0x0f5748,
    jade:         0x7fc4a8,
    cream:        0xf1dfb6,
    warm:         0xffc36b,
    warmHi:       0xffe3ac,
    lamp:         0xffb85a,
    cool:         0x9fc8e6,
    neonPink:     0xff4f91,
    neonRose:     0xff8cb0,
    neonTeal:     0x53e3d1,
    neonAmber:    0xffb45c,
    silkBlue:     0x28496e,
    velvet:       0x4b0f20,
    leaf:         0x48573f
  };

  /* ---------------- layout ---------------- */
  QP.L = {
    half: 8.5,
    plinthH: 0.82,
    streetY: 0,
    walkY: 0.13,
    trackZ: 3.15,
    gauge: 1.46,
    railTop: 0.06,
    build: {
      x0: -5.72, x1: 1.32,
      z0: -6.45, z1: 0.62,
      chamfer: 0.96,
      g0: 0.18,          // ground floor sill / plinth top
      h1: 3.62,          // ground storefront cornice
      h2: 7.18,          // second floor top / cornice
      h3: 8.78,          // attic wall top
      roof: 10.05
    },
    shop: {
      tailor: { x0: -5.55, x1: -1.82, front: 0.62, back: -3.55 },
      records: { x0: -1.82, x1: 1.32, z0: -4.15, z1: 0.62, cham: 0.96 }
    }
  };

  /* ---------------- gradient ramps ---------------- */
  function ramp(steps) {
    var data = new Uint8Array(steps.length * 4);
    for (var i = 0; i < steps.length; i++) {
      var c = Math.round(steps[i] * 255);
      data[i * 4] = c; data[i * 4 + 1] = c; data[i * 4 + 2] = c; data[i * 4 + 3] = 255;
    }
    var t = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
    t.minFilter = T.NearestFilter;
    t.magFilter = T.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }
  QP.grad = ramp([0.30, 0.50, 0.70, 0.86, 1.0]);
  QP.gradSoft = ramp([0.38, 0.56, 0.72, 0.86, 1.0]);

  /* ---------------- textures ---------------- */
  QP.canvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  QP.texture = function (cv, opts) {
    opts = opts || {};
    var t = new T.CanvasTexture(cv);
    t.anisotropy = opts.aniso || 8;
    t.wrapS = opts.wrapS || T.ClampToEdgeWrapping;
    t.wrapT = opts.wrapT || T.ClampToEdgeWrapping;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    if (opts.srgb === false) t.encoding = T.LinearEncoding;
    else t.encoding = T.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  };
  QP.rand = function (a, b) { return a + Math.random() * (b - a); };
  QP.rng = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };
  QP.clamp = T.MathUtils.clamp;

  /* ---------------- material helpers ---------------- */
  QP.toon = function (color, opts) {
    opts = opts || {};
    var m = new T.MeshToonMaterial({
      color: color,
      gradientMap: opts.gradientMap || QP.grad,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      vertexColors: !!opts.vertexColors
    });
    if (opts.rim) {
      var rimColor = new T.Color(opts.rimColor !== undefined ? opts.rimColor : 0x7fa4d8);
      var rimPower = opts.rimPower || 2.4;
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

  QP.basic = function (color, opts) {
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
      toneMapped: false
    });
  };

  QP.std = function (color, opts) {
    opts = opts || {};
    return new T.MeshStandardMaterial({
      color: color,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest !== undefined ? opts.alphaTest : 0,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.7,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1,
      vertexColors: !!opts.vertexColors
    });
  };

  QP.physical = function (color, opts) {
    opts = opts || {};
    return new T.MeshPhysicalMaterial({
      color: color,
      map: opts.map || null,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.2,
      clearcoat: opts.clearcoat !== undefined ? opts.clearcoat : 1,
      clearcoatRoughness: opts.clearcoatRoughness !== undefined ? opts.clearcoatRoughness : 0.08,
      sheen: opts.sheen !== undefined ? opts.sheen : 0,
      sheenColor: opts.sheenColor !== undefined ? opts.sheenColor : 0xffffff,
      sheenRoughness: opts.sheenRoughness !== undefined ? opts.sheenRoughness : 0.5,
      alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest !== undefined ? opts.alphaTest : 0,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1
    });
  };

  QP.brass = function (color, rough) {
    return QP.std(color === undefined ? 0xb8883d : color, {
      metalness: 0.88,
      roughness: rough === undefined ? 0.28 : rough,
      envMapIntensity: 1.5
    });
  };
  QP.iron = function (color) {
    return QP.std(color === undefined ? 0x171b1d : color, { metalness: 0.68, roughness: 0.42, envMapIntensity: 0.8 });
  };
  QP.glass = function (tint, opacity) {
    return QP.physical(tint === undefined ? 0x9aaeb8 : tint, {
      metalness: 0.0, roughness: 0.06, transparent: true,
      opacity: opacity === undefined ? 0.16 : opacity, clearcoat: 1.0,
      clearcoatRoughness: 0.04, side: T.DoubleSide, depthWrite: false,
      envMapIntensity: 1.7
    });
  };
  QP.glow = function (color, opacity, map) {
    return new T.MeshBasicMaterial({
      color: color, map: map || null,
      transparent: true, opacity: opacity === undefined ? 1 : opacity,
      blending: T.AdditiveBlending, depthWrite: false,
      side: T.DoubleSide, toneMapped: false
    });
  };

  /* ---------------- geometry helpers ---------------- */
  var geoCache = {};
  QP.boxGeo = function (w, h, d) {
    var k = 'b' + w.toFixed(3) + '_' + h.toFixed(3) + '_' + d.toFixed(3);
    if (!geoCache[k]) geoCache[k] = new T.BoxGeometry(w, h, d);
    return geoCache[k];
  };
  QP.cylGeo = function (rt, rb, h, seg, open) {
    var k = 'c' + rt.toFixed(3) + '_' + rb.toFixed(3) + '_' + h.toFixed(3) + '_' + (seg || 10) + '_' + (open ? 1 : 0);
    if (!geoCache[k]) geoCache[k] = new T.CylinderGeometry(rt, rb, h, seg || 10, 1, !!open);
    return geoCache[k];
  };
  QP.sphereGeo = function (r, ws, hs) {
    var k = 's' + r.toFixed(3) + '_' + (ws || 12) + '_' + (hs || 8);
    if (!geoCache[k]) geoCache[k] = new T.SphereGeometry(r, ws || 12, hs || 8);
    return geoCache[k];
  };
  var outlineMats = {};
  var outlineVS = 'uniform float uThickness;\n' +
    'void main() {\n' +
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);\n' +
    '  vec3 n = normalize(normalMatrix * normal);\n' +
    '  mv.xyz += n * uThickness * (-mv.z);\n' +
    '  gl_Position = projectionMatrix * mv;\n' +
    '}';
  var outlineFS = 'uniform vec3 uColor;\nvoid main() { gl_FragColor = vec4(uColor, 1.0); }';
  QP.outlineMat = function (thickness, color) {
    var key = thickness + '_' + color;
    if (!outlineMats[key]) {
      outlineMats[key] = new T.ShaderMaterial({
        uniforms: { uThickness: { value: thickness }, uColor: { value: new T.Color(color) } },
        vertexShader: outlineVS, fragmentShader: outlineFS, side: T.BackSide, fog: false
      });
    }
    return outlineMats[key];
  };
  QP.outline = function (mesh, thickness, color) {
    if (mesh.userData.noOutline) return null;
    var o = new T.Mesh(mesh.geometry, QP.outlineMat(thickness === undefined ? 0.0027 : thickness, color === undefined ? QP.PAL.outline : color));
    o.castShadow = false; o.receiveShadow = false;
    o.userData.isOutline = true;
    o.renderOrder = mesh.renderOrder;
    mesh.add(o);
    return o;
  };
  QP.box = function (w, h, d, mat, outline, thick) {
    var m = new T.Mesh(QP.boxGeo(w, h, d), mat);
    if (outline !== false) QP.outline(m, thick);
    return m;
  };
  QP.cyl = function (rt, rb, h, seg, mat, outline, thick) {
    var m = new T.Mesh(QP.cylGeo(rt, rb, h, seg, false), mat);
    if (outline !== false) QP.outline(m, thick);
    return m;
  };
  QP.sphere = function (r, ws, hs, mat, outline, thick) {
    var m = new T.Mesh(QP.sphereGeo(r, ws, hs), mat);
    if (outline !== false) QP.outline(m, thick);
    return m;
  };
  QP.put = function (parent, mesh, x, y, z, ry, rx, rz) {
    mesh.position.set(x || 0, y || 0, z || 0);
    if (ry) mesh.rotation.y = ry;
    if (rx) mesh.rotation.x = rx;
    if (rz) mesh.rotation.z = rz;
    parent.add(mesh);
    return mesh;
  };
  QP.group = function (parent, x, y, z) {
    var g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  };
  QP.plane = function (w, h, mat, opts) {
    opts = opts || {};
    var g = new T.PlaneGeometry(w, h, opts.segsX || 1, opts.segsY || 1);
    return new T.Mesh(g, mat);
  };
  QP.addGlowSprite = function (parent, tex, color, size, opacity, x, y, z) {
    var m = new T.SpriteMaterial({
      map: tex, color: color, transparent: true, opacity: opacity,
      blending: T.AdditiveBlending, depthWrite: false, depthTest: true, toneMapped: false
    });
    var s = new T.Sprite(m);
    s.scale.set(size, size, 1);
    s.position.set(x || 0, y || 0, z || 0);
    parent.add(s);
    return s;
  };
  QP.textMesh = function (mat, w, h, x, y, z, ry) {
    var m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (ry) m.rotation.y = ry;
    return m;
  };
  QP.roundedRectShape = function (w, h, r) {
    var s = new T.Shape();
    var x = -w / 2, y = -h / 2;
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
  QP.arcMesh = function (radius, tube, arc, mat, seg) {
    return new T.Mesh(new T.TorusGeometry(radius, tube, 5, seg || 16, arc), mat);
  };
  QP.wire = function (a, b, sag, radius, color, parent) {
    var mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y -= sag || 0.3;
    var curve = new T.QuadraticBezierCurve3(a, mid, b);
    var g = new T.TubeGeometry(curve, 22, radius || 0.012, 4, false);
    var m = new T.Mesh(g, QP.iron(color === undefined ? 0x0d0f12 : color));
    m.castShadow = false;
    if (parent) parent.add(m);
    return m;
  };

  /* ---------------- global state ---------------- */
  QP.renderer = null;
  QP.scene = null;
  QP.camera = null;
  QP.controls = null;
  QP.time = 0;
  QP.env = null;

  QP.makeEnvFace = function (dir) {
    var c = QP.canvas(256, 256), g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#03050b');
    grd.addColorStop(0.56, '#0a111e');
    grd.addColorStop(0.75, '#172231');
    grd.addColorStop(1, '#050608');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    if (dir !== 'py' && dir !== 'ny') {
      for (var i = 0; i < 16; i++) {
        var x = Math.random() * 256, w = 3 + Math.random() * 22;
        var y = 130 + Math.random() * 50, h = 4 + Math.random() * 42;
        var cols = ['#ff9b4e', '#ffca7e', '#ff517f', '#52dfcf', '#c7d7ff'];
        g.globalAlpha = 0.10 + Math.random() * 0.24;
        g.fillStyle = cols[(Math.random() * cols.length) | 0];
        g.fillRect(x, y, w, h);
      }
      for (var j = 0; j < 7; j++) {
        g.globalAlpha = 0.12 + Math.random() * 0.2;
        var grd2 = g.createLinearGradient(0, 90 + j * 20, 0, 230);
        grd2.addColorStop(0, 'rgba(255,85,130,0)');
        grd2.addColorStop(0.5, j % 2 ? 'rgba(255,85,130,0.55)' : 'rgba(47,215,199,0.42)');
        grd2.addColorStop(1, 'rgba(255,170,80,0)');
        g.fillStyle = grd2;
        g.fillRect(20 + j * 33, 80 + (j % 3) * 14, 4 + (j % 2) * 4, 100);
      }
    }
    g.globalAlpha = 1;
    return c;
  };

  QP.initCore = function () {
    var canvas = document.getElementById('scene');
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    var dpr = Math.min(window.devicePixelRatio || 1, 1.65);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.LinearEncoding;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setClearColor(0x05070c, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.autoClear = true;
    QP.renderer = renderer;

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0c1420, 0.016);
    QP.scene = scene;

    var camera = new T.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.18, 160);
    QP.camera = camera;

    /* environment for brass and glass */
    var faces = [QP.makeEnvFace('px'), QP.makeEnvFace('nx'), QP.makeEnvFace('py'),
                 QP.makeEnvFace('ny'), QP.makeEnvFace('pz'), QP.makeEnvFace('nz')];
    var cube = new T.CubeTexture(faces);
    cube.encoding = T.sRGBEncoding;
    cube.needsUpdate = true;
    var pmrem = new T.PMREMGenerator(renderer);
    var envRT = pmrem.fromCubemap(cube);
    scene.environment = envRT.texture;
    QP.env = envRT.texture;
    cube.dispose();
    pmrem.dispose();

    /* lights */
    var hemi = new T.HemisphereLight(0x8fa9d4, 0x24191a, 0.92);
    scene.add(hemi);
    var moon = new T.DirectionalLight(0xbcd2f1, 1.12);
    moon.position.set(-9, 15, 7);
    moon.target.position.set(0, 0, 0);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -12;
    moon.shadow.camera.right = 12;
    moon.shadow.camera.top = 12;
    moon.shadow.camera.bottom = -12;
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 45;
    moon.shadow.bias = -0.00045;
    moon.shadow.normalBias = 0.025;
    scene.add(moon); scene.add(moon.target);
    var coolRim = new T.DirectionalLight(0x6c9ed0, 0.55);
    coolRim.position.set(11, 8, -12);
    scene.add(coolRim);
    var warmFill = new T.DirectionalLight(0xffb477, 0.36);
    warmFill.position.set(8, 4, 12);
    scene.add(warmFill);
    var frontFill = new T.DirectionalLight(0x90b2d4, 0.26);
    frontFill.position.set(12, 9, 15);
    scene.add(frontFill);
    var ambient = new T.AmbientLight(0x3a4560, 0.42);
    scene.add(ambient);
    var canopy = new T.PointLight(0x9ec3e6, 0.55, 32, 2);
    canopy.position.set(3, 14, 6);
    scene.add(canopy);
    QP.lights = { hemi: hemi, moon: moon, coolRim: coolRim, warmFill: warmFill, frontFill: frontFill, ambient: ambient, canopy: canopy };

    /* controls */
    QP.controls = QP.makeControls(camera, renderer.domElement);
    QP.controls.setInitial();
    QP.Post.init(renderer);

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      QP.Post.resize();
    });

    /* subtle atmospheric sky */
    var sky = new T.Mesh(new T.SphereGeometry(76, 32, 18), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new T.Color(0x07101c) },
        uHorizon: { value: new T.Color(0x1a2a3c) },
        uGlow: { value: new T.Color(0x41464d) }
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'varying vec3 vDir;',
        'uniform vec3 uTop, uHorizon, uGlow;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
        ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
        ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
        'void main(){',
        ' float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);',
        ' vec3 col = mix(uHorizon, uTop, pow(h, 0.50));',
        ' float city = pow(max(0.0, 1.0 - abs(vDir.y) * 2.7), 2.4);',
        ' col += uGlow * city * 0.26;',
        ' float az = atan(vDir.z, vDir.x);',
        ' vec2 sp = vec2(az * 1.9, vDir.y * 4.5);',
        ' float n = noise(sp*1.4 + 2.0) * 0.52 + noise(sp*3.3 + 7.0) * 0.30 + noise(sp*7.1) * 0.13;',
        ' float cloud = smoothstep(0.38, 0.92, n) * smoothstep(-0.04, 0.42, vDir.y);',
        ' col += vec3(0.075,0.095,0.130) * cloud;',
        ' col += vec3(0.005, 0.009, 0.018);',
        ' col *= 1.32;',
        ' col *= 1.0 - smoothstep(0.72, 0.95, h) * 0.25;',
        ' gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    }));
    scene.add(sky);
    QP.sky = sky;

    /* very faint low mist plane to give the plinth a base in the void */
    var mistMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(0x2a3444) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; uniform vec3 uColor; void main(){ vec2 p=vUv-0.5; float a=exp(-length(p*vec2(1.0,1.4))*5.0); float n=sin(p.x*20.0+uTime*.05)*sin(p.y*14.0-uTime*.04); a*=0.55+n*0.08; gl_FragColor=vec4(uColor,a*0.18); }'
    });
    var mist = new T.Mesh(new T.PlaneGeometry(38, 26), mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.y = -1.3;
    scene.add(mist);
    QP.mist = mist;
  };

  /* ---------------- camera controls ---------------- */
  QP.makeControls = function (camera, dom) {
    var st = {
      theta: 0.69, phi: 1.14, radius: 25.2,
      tTheta: 0.69, tPhi: 1.14, tRadius: 25.2,
      target: new T.Vector3(-0.30, 2.90, -0.35),
      tTarget: new T.Vector3(-0.30, 2.90, -0.35),
      lastInput: performance.now(), autoRotate: true
    };
    var drag = 0, lastX = 0, lastY = 0, pointers = new Map(), pinch = 0, moved = 0;
    function down(e) {
      if (dom.setPointerCapture) dom.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = (e.button === 2 || e.button === 1 || e.shiftKey) ? 2 : 1;
      lastX = e.clientX; lastY = e.clientY; moved = 0;
      st.lastInput = performance.now();
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      }
    }
    function move(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      st.lastInput = performance.now();
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinch > 0) st.tRadius = QP.clamp(st.tRadius * (pinch / d), 10.5, 38);
        pinch = d;
        return;
      }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (drag === 2) {
        var k = st.radius * 0.00155;
        var right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0);
        var up = new T.Vector3().setFromMatrixColumn(camera.matrix, 1);
        st.tTarget.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
        st.tTarget.x = QP.clamp(st.tTarget.x, -9, 9);
        st.tTarget.z = QP.clamp(st.tTarget.z, -9, 9);
        st.tTarget.y = QP.clamp(st.tTarget.y, 0.4, 8.5);
      } else {
        st.tTheta -= dx * 0.0052;
        st.tPhi = QP.clamp(st.tPhi - dy * 0.0042, 0.20, 1.44);
      }
    }
    function up(e) {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) drag = 0;
      pinch = 0;
    }
    function wheel(e) {
      e.preventDefault();
      st.lastInput = performance.now();
      st.tRadius = QP.clamp(st.tRadius * (1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.0017, 0.2)), 10.5, 38);
    }
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', wheel, { passive: false });
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    st.update = function (dt) {
      if (moved < 3 && performance.now() - st.lastInput < 250) {
        // a tap: leave any gentle drift untouched
      }
      if (st.autoRotate && !drag && performance.now() - st.lastInput > 26000) st.tTheta += dt * 0.028;
      var k = 1 - Math.pow(0.0018, dt);
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
      QP.cameraState = st;
    };
    st.setInitial = function () {
      st.theta = st.tTheta; st.phi = st.tPhi; st.radius = st.tRadius;
      st.target.copy(st.tTarget);
      st.update(0.016);
    };
    st.setShot = function (name) {
      st.lastInput = performance.now();
      var shots = {
        hero:     { theta: 0.69, phi: 1.14, radius: 25.2, target: [-0.30, 2.94, -0.35] },
        front:    { theta: 0.48, phi: 1.27, radius: 16.4, target: [-0.55, 2.35, 0.15] },
        corner:   { theta: 0.88, phi: 1.24, radius: 14.2, target: [0.20, 2.60, 0.25] },
        tram:     { theta: 1.10, phi: 1.20, radius: 12.0, target: [4.8, 2.20, 2.7] },
        upstairs: { theta: 0.53, phi: 1.34, radius: 11.5, target: [-2.50, 5.35, 0.85] },
        record:   { theta: 1.34, phi: 1.25, radius: 10.8, target: [-0.15, 1.9, 0.1] },
        top:      { theta: 0.70, phi: 0.53, radius: 25.0, target: [0.0, 1.9, 0.0] },
        east:     { theta: 1.52, phi: 1.16, radius: 20.5, target: [0.0, 3.0, -1.4] },
        salon:    { theta: 0.49, phi: 1.31, radius: 6.8, target: [-2.45, 4.85, 0.25] },
        atelier:  { theta: 0.35, phi: 1.30, radius: 8.2, target: [-3.4, 1.55, 1.1] },
        collection:{ theta: 1.38, phi: 1.30, radius: 7.6, target: [-0.1, 1.65, -0.3] },
        street:   { theta: 0.90, phi: 1.31, radius: 14.0, target: [-0.7, 1.2, 2.7] },
        hero2:    { theta: 0.67, phi: 1.11, radius: 23.0, target: [-0.35, 3.0, -0.3] }
      };
      var s = shots[name] || shots.hero;
      st.tTheta = s.theta; st.tPhi = s.phi; st.tRadius = s.radius;
      st.tTarget.set(s.target[0], s.target[1], s.target[2]);
      if (name) { st.theta = s.theta; st.phi = s.phi; st.radius = s.radius; st.target.copy(st.tTarget); st.update(0.016); }
    };
    st.state = st;
    return st;
  };

  /* ---------------- post processing ---------------- */
  QP.Post = (function () {
    var renderer, sceneRT, bloomA, bloomB, bloomC, bloomD;
    var quadScene, quadCam, quad, brightMat, blurMatH, blurMatV, compMat;
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
      bloomA = rt(W * dpr / 3.0, H * dpr / 3.0);
      bloomB = rt(W * dpr / 3.0, H * dpr / 3.0);
      bloomC = rt(W * dpr / 7.0, H * dpr / 7.0);
      bloomD = rt(W * dpr / 7.0, H * dpr / 7.0);
      quadScene = new T.Scene();
      quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quad = new T.Mesh(new T.PlaneGeometry(2, 2));
      quad.frustumCulled = false;
      quadScene.add(quad);
      brightMat = new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uThreshold: { value: 1.14 }, uKnee: { value: 0.34 } },
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
      blurMatH = blur(new T.Vector2(1, 0));
      blurMatV = blur(new T.Vector2(0, 1));
      compMat = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloomA: { value: null }, tBloomC: { value: null },
          uTime: { value: 0 }, uRes: { value: new T.Vector2(W, H) },
          uBloom: { value: 0.46 }, uVignette: { value: 0.70 }, uExposure: { value: 1.75 }
        },
        vertexShader: VS,
        fragmentShader: [
          'varying vec2 vUv;',
          'uniform sampler2D tScene, tBloomA, tBloomC;',
          'uniform float uTime, uBloom, uVignette, uExposure;',
          'uniform vec2 uRes;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
          'vec3 aces(vec3 x){ float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }',
          'void main(){',
          ' vec2 uv=vUv; vec2 d=uv-0.5; float r2=dot(d,d);',
          ' float ca=r2*0.0019;',
          ' vec3 col;',
          ' col.r=texture2D(tScene,uv+d*ca).r;',
          ' col.g=texture2D(tScene,uv).g;',
          ' col.b=texture2D(tScene,uv-d*ca).b;',
          ' vec3 bloom=texture2D(tBloomA,uv).rgb*0.45 + texture2D(tBloomC,uv).rgb*0.72;',
          ' col+=bloom*uBloom;',
          ' float l=dot(col,vec3(0.299,0.587,0.114));',
          ' col=mix(col,col*vec3(0.84,0.93,1.12),(1.0-smoothstep(0.0,0.46,l))*0.48);',
          ' col=mix(col,col*vec3(1.09,1.02,0.92),smoothstep(0.45,1.0,l)*0.50);',
          ' col*=uExposure;',
          ' col=aces(col);',
          ' col=pow(max(col,0.0),vec3(1.22))*1.16;',
          ' col=clamp((col-0.5)*1.18+0.5,0.0,1.0);',
          ' float l2=dot(col,vec3(0.299,0.587,0.114));',
          ' col=mix(vec3(l2),col,1.22);',
          ' col=mix(col,col*vec3(0.82,0.90,1.08),(1.0-smoothstep(0.0,0.36,l2))*0.45);',
          ' col=mix(col,col*vec3(1.10,1.02,0.90),smoothstep(0.36,1.0,l2)*0.55);',
          ' col+=vec3(0.014,0.010,0.024)*(1.0-l2);',
          ' float vig=smoothstep(0.96,0.20,r2*1.55);',
          ' col*=mix(1.0,vig,uVignette);',
          ' float g=hash(uv*uRes+fract(uTime)*97.3);',
          ' col+=(g-0.5)*0.018;',
          ' col+=(hash(uv*uRes*1.7)-0.5)/255.0;',
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
      bloomA.setSize(W * dpr / 3.0, H * dpr / 3.0);
      bloomB.setSize(W * dpr / 3.0, H * dpr / 3.0);
      bloomC.setSize(W * dpr / 7.0, H * dpr / 7.0);
      bloomD.setSize(W * dpr / 7.0, H * dpr / 7.0);
      compMat.uniforms.uRes.value.set(W, H);
    }
    function render(scene, camera, time) {
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(0x05070c, 1);
      renderer.clear();
      renderer.render(scene, camera);
      QP.frameStats = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points
      };
      brightMat.uniforms.tSrc.value = sceneRT.texture;
      pass(brightMat, bloomA);
      blurMatH.uniforms.tSrc.value = bloomA.texture;
      blurMatH.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height);
      pass(blurMatH, bloomB);
      blurMatV.uniforms.tSrc.value = bloomB.texture;
      blurMatV.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height);
      pass(blurMatV, bloomA);
      blurMatH.uniforms.tSrc.value = bloomA.texture;
      blurMatH.uniforms.uTexel.value.set(2.0 / bloomC.width, 2.0 / bloomC.height);
      pass(blurMatH, bloomC);
      blurMatV.uniforms.tSrc.value = bloomC.texture;
      blurMatV.uniforms.uTexel.value.set(2.0 / bloomC.width, 2.0 / bloomC.height);
      pass(blurMatV, bloomD);
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
    function postUniforms() { return compMat.uniforms; }
    return { init: init, resize: resize, render: render, setExposure: setExposure, uniforms: postUniforms };
  })();
})();
