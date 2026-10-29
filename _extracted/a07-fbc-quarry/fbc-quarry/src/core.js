/* =========================================================================
   FBC QUARRY 07 — core renderer, toon material kit, camera & post-processing
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.enabled = true;
  var FQ = (window.FQ = window.FQ || {});
  FQ.T = T;

  /* ---------- palette ---------- */
  FQ.PAL = {
    ink:        0x050708,
    outline:    0x080a0b,
    void:       0x030507,
    fog:        0x091014,
    concrete:   0xb9b7ac,
    concreteHi: 0xd8d5c8,
    concreteLo: 0x777d7a,
    concreteDk: 0x3c4445,
    rock:       0x5c5a50,
    rockDk:     0x2c302f,
    rockWarm:   0x6b5542,
    basalt:     0x111516,
    steel:      0x394348,
    steelDk:    0x161b1d,
    gunmetal:   0x252c2e,
    rust:       0x8a4d30,
    rustDk:     0x44271c,
    rustRed:    0x6f2720,
    brass:      0xa88242,
    brassHi:    0xd8b16a,
    red:        0xc93731,
    redDeep:    0x61191a,
    redGlow:    0xff3b26,
    amber:      0xffa143,
    amberPale:  0xffd39b,
    cool:       0x93b9c4,
    ice:        0xb4d9df,
    screen:     0x9ef1d2,
    yellow:     0xd2a935,
    white:      0xe9e5d7
  };

  /* ---------- layout ---------- */
  FQ.L = {
    half: 11.7,
    plateauY: 0.82,
    baseBottom: -3.95,
    rimY: 0.82,
    pitCenter: new T.Vector2(0.35, 0.15),
    pyramid: {
      x: 0.0, z: 0.2,
      apexY: 7.65,
      topY: 19.15,
      halfTop: 9.7,
      roomFloor: 10.85,
      roomCeil: 15.25
    }
  };

  /* ---------- random + image helpers ---------- */
  FQ.rng = function (seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  };
  FQ.clamp = T.MathUtils.clamp;
  FQ.lerp = T.MathUtils.lerp;
  FQ.smooth = function (t) { return t * t * (3 - 2 * t); };
  FQ.canvas = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  FQ.tex = function (canvas, opts) {
    opts = opts || {};
    var t = new T.CanvasTexture(canvas);
    t.anisotropy = opts.aniso || 8;
    t.wrapS = t.wrapT = opts.wrap || T.ClampToEdgeWrapping;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    t.encoding = opts.srgb === false ? T.LinearEncoding : T.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  };
  FQ.repeatTex = function (texture, x, y) {
    var t = texture.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(x, y); return t;
  };

  /* ---------- toon ramps ---------- */
  function ramp(vals) {
    var data = new Uint8Array(vals.length * 4);
    for (var i = 0; i < vals.length; i++) {
      var c = Math.round(vals[i] * 255);
      data[i * 4] = c; data[i * 4 + 1] = c; data[i * 4 + 2] = c; data[i * 4 + 3] = 255;
    }
    var t = new T.DataTexture(data, vals.length, 1, T.RGBAFormat);
    t.minFilter = t.magFilter = T.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  }
  FQ.grad = ramp([0.18, 0.39, 0.61, 0.82, 1.0]);
  FQ.gradSoft = ramp([0.33, 0.48, 0.64, 0.82, 1.0]);
  FQ.gradHard = ramp([0.24, 0.24, 0.56, 0.82, 1.0]);
  FQ.gradWarm = ramp([0.20, 0.42, 0.68, 0.90, 1.0]);

  /* ---------- material kit ---------- */
  FQ.toon = function (color, opts) {
    opts = opts || {};
    var m = new T.MeshToonMaterial({
      color: color,
      gradientMap: opts.gradientMap || FQ.grad,
      map: opts.map || null,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      vertexColors: !!opts.vertexColors,
      fog: opts.fog !== undefined ? opts.fog : true
    });
    m.name = opts.name || '';
    var rimColor = new T.Color(opts.rimColor !== undefined ? opts.rimColor : 0x8db8ca);
    var rimPower = opts.rimPower || 2.4;
    var rimStrength = opts.rim || 0;
    var inkStrength = opts.ink !== undefined ? opts.ink : 0.32;
    var inkColor = new T.Color(opts.inkColor !== undefined ? opts.inkColor : 0x101416);
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uRimColor = { value: rimColor };
      sh.uniforms.uRimPower = { value: rimPower };
      sh.uniforms.uRimStrength = { value: rimStrength };
      sh.uniforms.uInkColor = { value: inkColor };
      sh.uniforms.uInkStrength = { value: inkStrength };
      sh.fragmentShader = 'uniform vec3 uRimColor;uniform float uRimPower;uniform float uRimStrength;uniform vec3 uInkColor;uniform float uInkStrength;\n' + sh.fragmentShader;
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
        '{\n' +
        'float ndv=clamp(dot(normalize(vViewPosition),normalize(normal)),0.0,1.0);\n' +
        'float rimF=pow(1.0-ndv,uRimPower);\n' +
        'gl_FragColor.rgb+=uRimColor*rimF*uRimStrength;\n' +
        'float inkE=smoothstep(.52,.94,1.0-ndv);\n' +
        'gl_FragColor.rgb=mix(gl_FragColor.rgb,uInkColor,inkE*uInkStrength);\n' +
        '}\n#include <dithering_fragment>');
    };
    m.customProgramCacheKey = function () { return 'ink' + rimColor.getHexString() + rimPower + rimStrength + inkStrength + inkColor.getHexString(); };
    return m;
  };
  FQ.basic = function (color, opts) {
    opts = opts || {};
    return new T.MeshBasicMaterial({
      color: color, map: opts.map || null, alphaMap: opts.alphaMap || null,
      alphaTest: opts.alphaTest !== undefined ? opts.alphaTest : 0,
      transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      blending: opts.blending || T.NormalBlending,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : false
    });
  };
  FQ.std = function (color, opts) {
    opts = opts || {};
    return new T.MeshStandardMaterial({
      color: color, map: opts.map || null, normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null, bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      alphaMap: opts.alphaMap || null, alphaTest: opts.alphaTest || 0,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.72,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 0.8,
      vertexColors: !!opts.vertexColors,
      flatShading: !!opts.flatShading
    });
  };
  FQ.physical = function (color, opts) {
    opts = opts || {};
    return new T.MeshPhysicalMaterial({
      color: color, map: opts.map || null, metalness: opts.metalness !== undefined ? opts.metalness : 0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.12,
      clearcoat: opts.clearcoat !== undefined ? opts.clearcoat : 1,
      clearcoatRoughness: opts.clearcoatRoughness !== undefined ? opts.clearcoatRoughness : 0.08,
      transmission: opts.transmission || 0, thickness: opts.thickness || 0,
      transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide, depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1.3,
      emissive: opts.emissive !== undefined ? opts.emissive : 0,
      flatShading: !!opts.flatShading
    });
  };
  FQ.steel = function (color, rough) {
    return FQ.std(color === undefined ? 0x485154 : color, { metalness: 0.72, roughness: rough === undefined ? 0.34 : rough, envMapIntensity: 1.05 });
  };
  FQ.iron = function (color, rough) {
    return FQ.std(color === undefined ? 0x1b2022 : color, { metalness: 0.58, roughness: rough === undefined ? 0.5 : rough, envMapIntensity: 0.75 });
  };
  FQ.brass = function (color, rough) {
    return FQ.std(color === undefined ? FQ.PAL.brass : color, { metalness: 0.82, roughness: rough === undefined ? 0.28 : rough, envMapIntensity: 1.25 });
  };
  FQ.glass = function (tint, opacity) {
    return new T.MeshPhysicalMaterial({
      color: tint === undefined ? 0x9fbec1 : tint,
      metalness: 0.0, roughness: 0.055, transparent: true,
      opacity: opacity === undefined ? 0.14 : opacity,
      clearcoat: 1, clearcoatRoughness: 0.03,
      side: T.DoubleSide, depthWrite: false,
      envMapIntensity: 1.7, toneMapped: true
    });
  };
  FQ.glow = function (color, opacity, map) {
    return new T.MeshBasicMaterial({
      color: color, map: map || null, transparent: true,
      opacity: opacity === undefined ? 1 : opacity,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false
    });
  };

  /* ---------- geometry helpers ---------- */
  var cache = {};
  FQ.boxGeo = function (w, h, d) {
    var k = 'b' + w.toFixed(4) + '_' + h.toFixed(4) + '_' + d.toFixed(4);
    if (!cache[k]) cache[k] = new T.BoxGeometry(w, h, d);
    return cache[k];
  };
  FQ.cylGeo = function (rt, rb, h, seg, open) {
    var k = 'c' + rt.toFixed(4) + '_' + rb.toFixed(4) + '_' + h.toFixed(4) + '_' + (seg || 12) + '_' + (open ? 1 : 0);
    if (!cache[k]) cache[k] = new T.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open);
    return cache[k];
  };
  FQ.sphereGeo = function (r, ws, hs) {
    var k = 's' + r.toFixed(4) + '_' + (ws || 16) + '_' + (hs || 10);
    if (!cache[k]) cache[k] = new T.SphereGeometry(r, ws || 16, hs || 10);
    return cache[k];
  };
  FQ.planeGeo = function (w, h, sx, sy) {
    var k = 'p' + w.toFixed(4) + '_' + h.toFixed(4) + '_' + (sx || 1) + '_' + (sy || 1);
    if (!cache[k]) cache[k] = new T.PlaneGeometry(w, h, sx || 1, sy || 1);
    return cache[k];
  };

  var outlineMats = {};
  var outlineVS = 'uniform float uThickness;\nvoid main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*uThickness*(-mv.z);gl_Position=projectionMatrix*mv;}';
  var outlineFS = 'uniform vec3 uColor;void main(){gl_FragColor=vec4(uColor,1.0);}';
  FQ.outlineMat = function (thickness, color) {
    var key = thickness + '_' + color;
    if (!outlineMats[key]) {
      outlineMats[key] = new T.ShaderMaterial({
        uniforms: { uThickness: { value: thickness }, uColor: { value: new T.Color(color) } },
        vertexShader: outlineVS, fragmentShader: outlineFS, side: T.BackSide, fog: false
      });
    }
    return outlineMats[key];
  };
  FQ.outline = function (mesh, thickness, color) {
    if (!mesh || mesh.userData.noOutline) return null;
    var o = new T.Mesh(mesh.geometry, FQ.outlineMat(thickness === undefined ? 0.0028 : thickness, color === undefined ? FQ.PAL.outline : color));
    o.castShadow = false; o.receiveShadow = false; o.userData.isOutline = true;
    o.renderOrder = mesh.renderOrder;
    mesh.add(o);
    return o;
  };
  FQ.box = function (w, h, d, mat, outline, thick) {
    var m = new T.Mesh(FQ.boxGeo(w, h, d), mat);
    if (outline !== false) FQ.outline(m, thick === undefined ? 0.0026 : thick);
    return m;
  };
  FQ.cyl = function (rt, rb, h, seg, mat, outline, thick) {
    var m = new T.Mesh(FQ.cylGeo(rt, rb, h, seg, false), mat);
    if (outline !== false) FQ.outline(m, thick === undefined ? 0.0024 : thick);
    return m;
  };
  FQ.sphere = function (r, ws, hs, mat, outline, thick) {
    var m = new T.Mesh(FQ.sphereGeo(r, ws, hs), mat);
    if (outline !== false) FQ.outline(m, thick === undefined ? 0.0022 : thick);
    return m;
  };
  FQ.plane = function (w, h, mat, sx, sy) { return new T.Mesh(FQ.planeGeo(w, h, sx, sy), mat); };
  FQ.put = function (parent, mesh, x, y, z, ry, rx, rz) {
    mesh.position.set(x || 0, y || 0, z || 0);
    if (ry) mesh.rotation.y = ry;
    if (rx) mesh.rotation.x = rx;
    if (rz) mesh.rotation.z = rz;
    parent.add(mesh);
    return mesh;
  };
  FQ.group = function (parent, x, y, z) {
    var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g;
  };
  FQ.textPlane = function (w, h, texture, opts) {
    opts = opts || {};
    var mat;
    if (opts.lit) {
      mat = FQ.toon(opts.color || 0xffffff, {
        map: texture, transparent: !!opts.transparent, opacity: opts.opacity === undefined ? 1 : opts.opacity,
        side: opts.side || T.DoubleSide, alphaTest: opts.alphaTest || 0, depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true
      });
    } else {
      mat = new T.MeshBasicMaterial({
        color: opts.tint || 0xffffff, map: texture, transparent: !!opts.transparent,
        opacity: opts.opacity === undefined ? 1 : opts.opacity,
        side: opts.side || T.DoubleSide, alphaTest: opts.alphaTest || 0,
        depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
        blending: opts.blending || T.NormalBlending,
        toneMapped: false
      });
    }
    return new T.Mesh(FQ.planeGeo(w, h), mat);
  };
  FQ.tube = function (points, radius, mat, segments, radial) {
    var curve = new T.CatmullRomCurve3(points);
    var geo = new T.TubeGeometry(curve, segments || 24, radius, radial || 6, false);
    return new T.Mesh(geo, mat);
  };
  FQ.sprite = function (parent, map, color, size, opacity) {
    var mat = new T.SpriteMaterial({ map: map, color: color, transparent: true, opacity: opacity === undefined ? 1 : opacity, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
    var s = new T.Sprite(mat); s.scale.set(size, size, 1); if (parent) parent.add(s); return s;
  };
  FQ.beamCone = function (color, rt, rb, height, opacity) {
    var geo = new T.CylinderGeometry(rt, rb, height, 28, 1, true);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(color) }, uOpacity: { value: opacity } },
      vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec2 vUv; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vP=-mv.xyz; gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vP; varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity; void main(){ float edge=pow(1.0-abs(dot(normalize(vN),normalize(vP))),1.7); float fade=pow(max(0.0,1.0-vUv.y),1.15); gl_FragColor=vec4(uColor,edge*fade*uOpacity); }'
    });
    var m = new T.Mesh(geo, mat); m.userData.noOutline = true; return m;
  };
  FQ.roundedBox = function (w, h, d, r, mat) {
    // simple bevelled box silhouette substitute: three stacked slabs
    var g = new T.Group();
    var main = FQ.box(w, h - r * 2, d, mat, false); g.add(main);
    var top = FQ.box(w - r * 2, r * 2, d - r * 2, mat, false); top.position.y = h / 2 - r; g.add(top);
    var bot = top.clone(); bot.position.y = -h / 2 + r; g.add(bot);
    return g;
  };

  /* ---------- global state ---------- */
  FQ.scene = null; FQ.camera = null; FQ.renderer = null; FQ.controls = null;
  FQ.time = 0; FQ.updaters = []; FQ.lights = {}; FQ.env = null;

  function envCanvas(dir) {
    var c = FQ.canvas(256, 256), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#030609'); gr.addColorStop(0.42, '#0b1217'); gr.addColorStop(0.67, '#2a2724'); gr.addColorStop(0.82, '#2e1510'); gr.addColorStop(1, '#030405');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    if (dir !== 'py' && dir !== 'ny') {
      var r = FQ.rng(dir.charCodeAt(0) * 89 + 7);
      for (var i = 0; i < 7; i++) {
        g.globalAlpha = 0.05 + r() * 0.13;
        g.fillStyle = r() < 0.5 ? '#ff6f5e' : '#ffd1a0';
        g.fillRect(r() * 240, 80 + r() * 120, 4 + r() * 40, 2 + r() * 7);
      }
      g.globalAlpha = 0.12;
      g.fillStyle = '#b9d9e0'; g.fillRect(40, 145, 160, 1.5);
    }
    g.globalAlpha = 1;
    return c;
  }

  FQ.initCore = function () {
    var canvas = document.getElementById('scene');
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.LinearEncoding;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setClearColor(0x030507, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    FQ.renderer = renderer;

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0a1014, 0.0105);
    FQ.scene = scene;

    var camera = new T.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.12, 220);
    FQ.camera = camera;

    var faces = []; ['px', 'nx', 'py', 'ny', 'pz', 'nz'].forEach(function (d) { faces.push(envCanvas(d)); });
    var cube = new T.CubeTexture(faces); cube.encoding = T.sRGBEncoding; cube.needsUpdate = true;
    var pmrem = new T.PMREMGenerator(renderer);
    var envRT = pmrem.fromCubemap(cube);
    scene.environment = envRT.texture; FQ.env = envRT.texture;
    cube.dispose(); pmrem.dispose();

    var hemi = new T.HemisphereLight(0x7694a5, 0x151013, 0.68);
    scene.add(hemi);
    var key = new T.DirectionalLight(0xd2e1e6, 2.05);
    key.position.set(-11, 23, 15); key.target.position.set(0, 8, 0);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -18; key.shadow.camera.right = 18;
    key.shadow.camera.top = 20; key.shadow.camera.bottom = -13;
    key.shadow.camera.near = 1; key.shadow.camera.far = 60;
    key.shadow.bias = -0.00035; key.shadow.normalBias = 0.035;
    scene.add(key); scene.add(key.target);
    var fill = new T.DirectionalLight(0x507b96, 1.1);
    fill.position.set(14, 8, 9); scene.add(fill);
    var frontFill = new T.DirectionalLight(0x7fa5b6, 1.65);
    frontFill.position.set(3, 7.5, 23); frontFill.target.position.set(0, 10.5, 0); scene.add(frontFill); scene.add(frontFill.target);
    var lowWarm = new T.DirectionalLight(0xb97860, 0.33);
    lowWarm.position.set(10, 1.5, 12); lowWarm.target.position.set(0, 8.0, 0); scene.add(lowWarm); scene.add(lowWarm.target);
    var rim = new T.DirectionalLight(0xff6044, 0.95);
    rim.position.set(-3, 9, -20); rim.target.position.set(0, 10, 0); scene.add(rim); scene.add(rim.target);
    var ambient = new T.AmbientLight(0x27343d, 0.5); scene.add(ambient);
    var pitGlow = new T.PointLight(0xff5433, 3.6, 17, 2);
    pitGlow.position.set(0, -2.05, 0.6); scene.add(pitGlow);
    var rimUnder = new T.PointLight(0x4c93aa, 1.6, 23, 2);
    rimUnder.position.set(4.5, 4.8, -7.5); scene.add(rimUnder);
    FQ.lights = { hemi: hemi, key: key, fill: fill, frontFill: frontFill, lowWarm: lowWarm, rim: rim, ambient: ambient, pitGlow: pitGlow, rimUnder: rimUnder };

    var controls = FQ.makeControls(camera, renderer.domElement); FQ.controls = controls;
    controls.setInitial();
    controls.fitAspect();
    FQ.Post.init(renderer);

    /* sky dome */
    var sky = new T.Mesh(new T.SphereGeometry(120, 48, 28), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new T.Color(0x020408) },
        uHorizon: { value: new T.Color(0x0b1319) },
        uGlow: { value: new T.Color(0x4a1c13) },
        uCool: { value: new T.Color(0x0a1b25) },
        uTime: { value: 0 }
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec3 vDir;',
        'uniform vec3 uTop,uHorizon,uGlow,uCool; uniform float uTime;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
        'void main(){',
        ' float h=clamp(vDir.y*0.5+0.5,0.0,1.0);',
        ' vec3 col=mix(uHorizon,uTop,pow(h,0.58));',
        ' float az=atan(vDir.z,vDir.x);',
        ' vec2 sp=vec2(az*1.8+uTime*.002,vDir.y*2.7);',
        ' float n=noise(sp*1.2+7.0)*.58+noise(sp*3.4+1.0)*.28+noise(sp*8.1)*.14;',
        ' float cloud=smoothstep(.38,.84,n)*smoothstep(-.25,.5,vDir.y);',
        ' col+=vec3(.020,.026,.031)*cloud;',
        ' float glow=pow(max(0.0,1.0-abs(vDir.y-.12)*2.6),2.2);',
        ' col+=uGlow*glow*.46;',
        ' float side=pow(max(0.0,-vDir.z*.5+vDir.y*.2),2.0);',
        ' col+=uCool*side*.20;',
        ' float veil=noise(vec2(az*2.4+vDir.y*1.8, vDir.y*5.0)+uTime*.002);',
        ' col+=vec3(.028,.010,.008)*smoothstep(.58,.9,veil)*smoothstep(-.2,.6,vDir.y);',
        ' float floorBand=smoothstep(.08,-.28,vDir.y);',
        ' col=mix(col,vec3(.012,.018,.021)+vec3(.018,.009,.007)*noise(vDir.xz*4.0),floorBand*.72);',
        ' gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n')
    }));
    scene.add(sky); FQ.sky = sky;

    /* under-model haze / soft stage glow */
    var underGlow = new T.Mesh(new T.PlaneGeometry(70, 70), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 }, uColorA: { value: new T.Color(0x111b21) }, uColorB: { value: new T.Color(0x2a130f) } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime; uniform vec3 uColorA,uColorB;',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
        'void main(){vec2 p=vUv-.5;float d=length(p);float cloud=n(vUv*4.+uTime*.008)*.58+n(vUv*12.-uTime*.005)*.25;float a=smoothstep(.46,.02,d)*.38*(.55+cloud*.6);vec3 c=mix(uColorA,uColorB,cloud*.5)*a;gl_FragColor=vec4(c,a);}'
      ].join('\n')
    }));
    underGlow.rotation.x = -Math.PI / 2; underGlow.position.y = -4.15; underGlow.renderOrder = -1; scene.add(underGlow); FQ.underGlow = underGlow;

    /* faint distant floor plane never in frame normally */
    var floorHaze = new T.Mesh(new T.CircleGeometry(55, 64), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv;uniform float uTime;void main(){float d=length(vUv-.5)*2.;float a=smoothstep(1.,.1,d)*.09;float n=sin(vUv.x*30.+uTime*.02)*sin(vUv.y*22.-uTime*.015)*.5+.5;gl_FragColor=vec4(vec3(.10,.13,.14)*a*(.5+n*.5),a);}'
    }));
    floorHaze.rotation.x = -Math.PI / 2; floorHaze.position.y = -4.6; scene.add(floorHaze);

    var prevAspect = window.innerWidth / window.innerHeight;
    window.addEventListener('resize', function () {
      var nextAspect = window.innerWidth / window.innerHeight;
      camera.aspect = nextAspect; camera.updateProjectionMatrix();
      if (FQ.controls && FQ.controls.onAspectChange) FQ.controls.onAspectChange(prevAspect, nextAspect);
      prevAspect = nextAspect;
      renderer.setSize(window.innerWidth, window.innerHeight); FQ.Post.resize();
    });
  };

  /* ---------- orbit / pan / zoom (no UI) ---------- */
  FQ.makeControls = function (camera, dom) {
    var HOME = { theta: 0.58, phi: 1.28, radius: 61.0, target: [0.0, 9.2, 0.0] };
    var st = {
      theta: HOME.theta, phi: HOME.phi, radius: HOME.radius,
      tTheta: HOME.theta, tPhi: HOME.phi, tRadius: HOME.radius,
      target: new T.Vector3(HOME.target[0], HOME.target[1], HOME.target[2]),
      tTarget: new T.Vector3(HOME.target[0], HOME.target[1], HOME.target[2]),
      lastInput: performance.now(), autoDelay: 18000,
      minRadius: 8.0, maxRadius: 120.0
    };
    var drag = 0, lx = 0, ly = 0, pointers = new Map(), pinch = 0;
    function down(e) {
      if (dom.setPointerCapture) { try { dom.setPointerCapture(e.pointerId); } catch (x) {} }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = (e.button === 2 || e.button === 1 || e.shiftKey) ? 2 : 1;
      lx = e.clientX; ly = e.clientY; st.lastInput = performance.now();
      if (pointers.size === 2) { var p = Array.from(pointers.values()); pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
    }
    function move(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      st.lastInput = performance.now();
      if (pointers.size === 2) {
        var p = Array.from(pointers.values()); var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinch > 0) st.tRadius = FQ.clamp(st.tRadius * (pinch / d), st.minRadius, st.maxRadius);
        pinch = d; return;
      }
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      if (drag === 2) {
        var k = st.radius * 0.00145;
        var right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0);
        var up = new T.Vector3().setFromMatrixColumn(camera.matrix, 1);
        st.tTarget.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
        st.tTarget.x = FQ.clamp(st.tTarget.x, -7, 7);
        st.tTarget.z = FQ.clamp(st.tTarget.z, -7, 7);
        st.tTarget.y = FQ.clamp(st.tTarget.y, -1, 17);
      } else {
        st.tTheta -= dx * 0.0048;
        st.tPhi = FQ.clamp(st.tPhi - dy * 0.0038, 0.19, 1.50);
      }
    }
    function up(e) { pointers.delete(e.pointerId); if (pointers.size === 0) drag = 0; pinch = 0; }
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', function (e) {
      e.preventDefault(); st.lastInput = performance.now();
      var f = 1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.0013, 0.16);
      st.tRadius = FQ.clamp(st.tRadius * f, st.minRadius, st.maxRadius);
    }, { passive: false });
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.addEventListener('dblclick', function () { st.setShot('hero'); });

    st.update = function (dt) {
      if (!drag && performance.now() - st.lastInput > st.autoDelay) st.tTheta += dt * 0.018;
      var k = 1 - Math.pow(0.0011, Math.min(dt, 0.05));
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
      FQ.cameraState = st;
    };
    st.setInitial = function () { st.theta = st.tTheta; st.phi = st.tPhi; st.radius = st.tRadius; st.target.copy(st.tTarget); st.update(0.016); };
    st.setShot = function (name, instant) {
      st.lastInput = performance.now();
      var shots = {
        hero:      { theta: 0.58,  phi: 1.28,  radius: 61.0, target: [0.0, 9.2, 0.0] },
        control:   { theta: 0.08,  phi: 1.47,  radius: 21.5, target: [0.15, 12.65, 2.4] },
        interior:  { theta: 0.035, phi: 1.48,  radius: 13.8, target: [0.0, 12.55, 2.8] },
        front:     { theta: 0.12,  phi: 1.27,  radius: 46.0, target: [0.0, 10.0, 0.6] },
        quarry:    { theta: 0.66,  phi: 1.10,  radius: 27.0, target: [0.4, 0.2, 0.8] },
        crane:     { theta: 1.12,  phi: 1.24,  radius: 38.0, target: [-3.5, 5.0, 1.0] },
        high:      { theta: 0.58,  phi: 0.94,  radius: 62.0, target: [0.0, 9.0, 0.0] },
        low:       { theta: 0.36,  phi: 1.43,  radius: 43.0, target: [0.2, 8.2, 0.0] },
        back:      { theta: 2.58,  phi: 1.24,  radius: 52.0, target: [0.0, 8.7, -1.0] },
        apex:      { theta: 0.26,  phi: 1.30,  radius: 21.0, target: [0.0, 9.2, 0.7] },
        underside: { theta: 0.72,  phi: 1.46,  radius: 33.0, target: [0.0, 4.6, 0.0] }
      };
      var s = shots[name] || shots.hero;
      st.tTheta = s.theta; st.tPhi = s.phi; st.tRadius = s.radius;
      st.tTarget.set(s.target[0], s.target[1], s.target[2]);
      if (instant || name) {
        st.theta = s.theta; st.phi = s.phi; st.radius = s.radius; st.target.copy(st.tTarget); st.update(0.016);
      }
    };
    st.state = st;
    st.fitAspect = function () {
      var aspect = window.innerWidth / window.innerHeight;
      var factor = aspect < 1.25 ? Math.pow(1.25 / aspect, .75) : 1;
      st.tRadius = Math.min(HOME.radius * factor, st.maxRadius);
      st.radius = st.tRadius;
      st.update(.016);
    };
    st.onAspectChange = function (oldAspect, newAspect) {
      var oldF = oldAspect < 1.25 ? Math.pow(1.25 / oldAspect, .75) : 1;
      var newF = newAspect < 1.25 ? Math.pow(1.25 / newAspect, .75) : 1;
      var scale = newF / oldF;
      st.tRadius = FQ.clamp(st.tRadius * scale, st.minRadius, st.maxRadius);
      st.radius = st.tRadius;
    };
    return st;
  };

  /* ---------- post ---------- */
  FQ.Post = (function () {
    var renderer, sceneRT, bloomA, bloomB, bloomC, bloomD;
    var qScene, qCam, quad, brightMat, blurH, blurV, compMat;
    var W = 1, H = 1;
    var VS = 'varying vec2 vUv; void main(){ vUv=.5*(position.xy+1.0); gl_Position=vec4(position.xy,0.0,1.0); }';
    function rt(w, h, samples) {
      return new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
        minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat,
        type: T.HalfFloatType, depthBuffer: true, stencilBuffer: false, samples: samples || 0
      });
    }
    function makeBlur(dir) {
      return new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uDir: { value: dir }, uTexel: { value: new T.Vector2(1 / 512, 1 / 512) } },
        vertexShader: VS,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir,uTexel; void main(){ vec2 o=uDir*uTexel; vec3 c=texture2D(tSrc,vUv).rgb*0.227027; c+=texture2D(tSrc,vUv+o*1.3846).rgb*0.316216; c+=texture2D(tSrc,vUv-o*1.3846).rgb*0.316216; c+=texture2D(tSrc,vUv+o*3.2308).rgb*0.070270; c+=texture2D(tSrc,vUv-o*3.2308).rgb*0.070270; gl_FragColor=vec4(c,1.0); }',
        depthTest: false, depthWrite: false
      });
    }
    function init(r) {
      renderer = r;
      var dpr = renderer.getPixelRatio(); W = window.innerWidth; H = window.innerHeight;
      sceneRT = rt(W * dpr, H * dpr, 4);
      bloomA = rt(W * dpr / 3.0, H * dpr / 3.0);
      bloomB = rt(W * dpr / 3.0, H * dpr / 3.0);
      bloomC = rt(W * dpr / 7.0, H * dpr / 7.0);
      bloomD = rt(W * dpr / 7.0, H * dpr / 7.0);
      qScene = new T.Scene(); qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; qScene.add(quad);
      brightMat = new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uThreshold: { value: 0.72 }, uKnee: { value: 0.36 } },
        vertexShader: VS,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; uniform float uThreshold,uKnee; void main(){vec3 c=texture2D(tSrc,vUv).rgb;float l=max(c.r,max(c.g,c.b));float s=smoothstep(uThreshold,uThreshold+uKnee,l);gl_FragColor=vec4(c*s,1.0);}',
        depthTest: false, depthWrite: false
      });
      blurH = makeBlur(new T.Vector2(1, 0)); blurV = makeBlur(new T.Vector2(0, 1));
      compMat = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloomA: { value: null }, tBloomC: { value: null },
          uTime: { value: 0 }, uRes: { value: new T.Vector2(W, H) },
          uBloom: { value: 0.52 }, uVignette: { value: 0.72 }, uExposure: { value: 1.26 }, uFade: { value: 0 }
        },
        vertexShader: VS,
        fragmentShader: [
          'varying vec2 vUv;',
          'uniform sampler2D tScene,tBloomA,tBloomC;',
          'uniform float uTime,uBloom,uVignette,uExposure,uFade;',
          'uniform vec2 uRes;',
          'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'vec3 aces(vec3 x){const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0);}',
          'void main(){',
          ' vec2 uv=vUv; vec2 d=uv-.5; float r2=dot(d,d);',
          ' vec3 col; float ca=r2*0.0018;',
          ' col.r=texture2D(tScene,uv+d*ca).r;',
          ' col.g=texture2D(tScene,uv).g;',
          ' col.b=texture2D(tScene,uv-d*ca).b;',
          ' vec3 bloom=texture2D(tBloomA,uv).rgb*.52+texture2D(tBloomC,uv).rgb*.72;',
          ' col+=bloom*uBloom;',
          ' float l=dot(col,vec3(.299,.587,.114));',
          ' col=mix(col,col*vec3(.62,.83,1.16),(1.0-smoothstep(0.0,.48,l))*.68);',
          ' col=mix(col,col*vec3(1.14,.95,.80),smoothstep(.34,1.0,l)*.55);',
          ' col*=uExposure;',
          ' col=aces(col);',
          ' col=pow(max(col,0.0),vec3(1.0/2.2));',
          ' col=clamp((col-.5)*1.14+.5,0.0,1.0);',
          ' float l2=dot(col,vec3(.299,.587,.114));',
          ' col=mix(vec3(l2),col,1.16);',
          ' col=mix(col,col*vec3(.82,.92,1.08),(1.0-smoothstep(.05,.45,l2))*.38);',
          ' col+=vec3(.006,.010,.015)*(1.0-smoothstep(0.0,.32,l2));',
          ' float vig=smoothstep(.93,.18,r2*1.5);',
          ' col*=mix(1.0,vig,uVignette);',
          ' float g=hash(uv*uRes+fract(uTime)*97.3);',
          ' col+=(g-.5)*.018;',
          ' col=clamp(col,0.0,1.0);',
          ' col=mix(col,floor(col*20.0+.5)/20.0,.09);',
          ' col*=1.0-uFade;',
          ' gl_FragColor=vec4(max(col,0.0),1.0);',
          '}'
        ].join('\n'),
        depthTest: false, depthWrite: false
      });
    }
    function pass(mat, target) {
      quad.material = mat; renderer.setRenderTarget(target); renderer.clear(); renderer.render(qScene, qCam);
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      var dpr = renderer.getPixelRatio();
      sceneRT.setSize(W * dpr, H * dpr);
      bloomA.setSize(W * dpr / 3, H * dpr / 3); bloomB.setSize(W * dpr / 3, H * dpr / 3);
      bloomC.setSize(W * dpr / 7, H * dpr / 7); bloomD.setSize(W * dpr / 7, H * dpr / 7);
      compMat.uniforms.uRes.value.set(W, H);
    }
    function render(scene, camera, time, fade) {
      renderer.setRenderTarget(sceneRT); renderer.setClearColor(0x030507, 1); renderer.clear();
      renderer.render(scene, camera);
      FQ.frameStats = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
      brightMat.uniforms.tSrc.value = sceneRT.texture; pass(brightMat, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture; blurH.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height); pass(blurH, bloomB);
      blurV.uniforms.tSrc.value = bloomB.texture; blurV.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height); pass(blurV, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture; blurH.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height); pass(blurH, bloomC);
      blurV.uniforms.tSrc.value = bloomC.texture; blurV.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height); pass(blurV, bloomD);
      compMat.uniforms.tScene.value = sceneRT.texture;
      compMat.uniforms.tBloomA.value = bloomA.texture;
      compMat.uniforms.tBloomC.value = bloomD.texture;
      compMat.uniforms.uTime.value = time;
      compMat.uniforms.uFade.value = fade || 0;
      quad.material = compMat; renderer.setRenderTarget(null); renderer.clear();
      renderer.render(qScene, qCam);
    }
    return { init: init, resize: resize, render: render, uniforms: function () { return compMat.uniforms; } };
  })();
})();
