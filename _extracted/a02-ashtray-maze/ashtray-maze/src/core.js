/* =========================================================================
   ASHTRAY MAZE — FBC observation model
   core: renderer, toon kit, outlines, controls, environment, post
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.enabled = true;
  var AM = (window.AM = window.AM || {});
  AM.T = T;

  /* ---------------- palette ---------------- */
  AM.PAL = {
    ink:        0x060807,
    outline:    0x090b0a,
    void:       0x050809,
    fog:        0x0a1010,
    concrete:   0xb9b9ac,
    concreteHi: 0xd4d0c0,
    concreteLo: 0x83857c,
    concreteDk: 0x525954,
    rock:       0x6f7169,
    steel:      0x4a5453,
    steelHi:    0x78837c,
    steelDk:    0x1b2222,
    rust:       0x85533a,
    rustDk:     0x4a2e22,
    warning:    0xe2b542,
    warningDk:  0x6c541f,
    safety:     0xc9a23a,
    brass:      0xaa864b,
    brassHi:    0xe0bf7b,
    red:        0xbe3a2e,
    redDk:      0x5c1b18,
    redGlow:    0xff5a3b,
    amber:      0xffb15e,
    amberPale:  0xffe0ad,
    green:      0xc2d97d,
    greenPale:  0xe2f5ac,
    greenDk:    0x6d7d4d,
    screen:     0xa7e79e,
    cool:       0x8fb1b2,
    ice:        0xbfd5cd,
    glass:      0x91b0a2,
    cream:      0xd0c3a9,
    wood:       0x7a5538,
    woodDk:     0x49301f,
    leather:    0x46332a,
    black:      0x151817
  };

  /* ---------------- layout ---------------- */
  AM.L = {
    baseHalf: 9.0,
    baseTop: 0.0,
    baseBottom: -2.05,
    floorY: 0.0,
    room: {
      cx: -0.55, cz: -0.55,
      w: 5.35, d: 4.25,
      floor: 0.62, wallTop: 3.84, roof: 4.02,
      glassTop: 3.62
    },
    gantryY: 6.4
  };

  /* ---------------- math + random ---------------- */
  AM.clamp = T.MathUtils.clamp;
  AM.lerp = T.MathUtils.lerp;
  AM.smooth = function (t) { t = AM.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  AM.smoother = function (t) { t = AM.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  AM.mod = function (a, b) { return ((a % b) + b) % b; };
  AM.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  };
  AM.hash = function (x) { var s = Math.sin(x * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); };
  AM.hash2 = function (x, y) { var s = Math.sin(x * 127.1 + y * 311.7 + 17.3) * 43758.5453123; return s - Math.floor(s); };

  /* ---------------- canvas + texture helpers ---------------- */
  AM.canvas = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  AM.tex = function (canvas, opts) {
    opts = opts || {};
    var tx = new T.CanvasTexture(canvas);
    tx.anisotropy = opts.aniso || 8;
    tx.wrapS = tx.wrapT = opts.wrap || T.ClampToEdgeWrapping;
    if (opts.repeat) tx.repeat.set(opts.repeat[0], opts.repeat[1]);
    tx.encoding = opts.srgb === false ? T.LinearEncoding : (T.sRGBEncoding !== undefined ? T.sRGBEncoding : 3001);
    tx.needsUpdate = true;
    return tx;
  };
  AM.repeat = function (texture, x, y, ox, oy) {
    var t = texture.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(x, y);
    if (ox || oy) t.offset.set(ox || 0, oy || 0);
    return t;
  };
  AM.cover = function (ctx, w, h, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); };
  AM.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w * .5, h * .5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /* ---------------- toon ramps ---------------- */
  function ramp(values) {
    var data = new Uint8Array(values.length * 4);
    for (var i = 0; i < values.length; i++) {
      var v = Math.round(AM.clamp(values[i], 0, 1) * 255);
      data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
    }
    var tx = new T.DataTexture(data, values.length, 1, T.RGBAFormat);
    tx.minFilter = tx.magFilter = T.NearestFilter;
    tx.generateMipmaps = false;
    tx.needsUpdate = true;
    return tx;
  }
  AM.grad = ramp([0.20, 0.42, 0.65, 0.86, 1.0]);
  AM.gradSoft = ramp([0.31, 0.48, 0.66, 0.84, 1.0]);
  AM.gradHard = ramp([0.22, 0.22, 0.56, 0.82, 1.0]);
  AM.gradWarm = ramp([0.24, 0.42, 0.64, 0.84, 1.0]);
  AM.gradInk = ramp([0.15, 0.36, 0.62, 0.86, 1.0]);

  /* ---------------- materials ---------------- */
  // All general surfaces are stepped toon. Rim is a very quiet shape cue, not a glow.
  AM.toon = function (color, opts) {
    opts = opts || {};
    var noBump = /[?&]nobump=1/.test(location.search);
    var m = new T.MeshToonMaterial({
      color: color,
      gradientMap: opts.gradientMap || AM.grad,
      map: opts.map || null,
      bumpMap: noBump ? null : (opts.bumpMap || null),
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      normalMap: opts.normalMap || null,
      normalScale: opts.normalScale || new T.Vector2(1, 1),
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      emissiveMap: opts.emissiveMap || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      vertexColors: !!opts.vertexColors,
      flatShading: !!opts.flatShading,
      fog: opts.fog !== undefined ? opts.fog : true
    });
    if (opts.rim) {
      var rimColor = new T.Color(opts.rimColor !== undefined ? opts.rimColor : 0x86a4a5);
      var rimPower = opts.rimPower || 2.6;
      var rimStrength = opts.rim;
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uRimColor = { value: rimColor };
        sh.uniforms.uRimPower = { value: rimPower };
        sh.uniforms.uRimStrength = { value: rimStrength };
        sh.fragmentShader = 'uniform vec3 uRimColor;uniform float uRimPower;uniform float uRimStrength;\n' + sh.fragmentShader;
        sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
          '{\n' +
          '  vec3 rV = normalize(vViewPosition);\n' +
          '  vec3 rN = normalize(normal);\n' +
          '  float rimF = pow(1.0 - clamp(dot(rV, rN), 0.0, 1.0), uRimPower);\n' +
          '  gl_FragColor.rgb += uRimColor * rimF * uRimStrength;\n' +
          '}\n#include <dithering_fragment>');
      };
      m.customProgramCacheKey = function () { return 'rim' + rimColor.getHexString() + rimPower + rimStrength; };
    }
    return m;
  };

  AM.basic = function (color, opts) {
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
      depthTest: opts.depthTest !== undefined ? opts.depthTest : true,
      blending: opts.blending || T.NormalBlending,
      toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : false,
      fog: opts.fog !== undefined ? opts.fog : true
    });
  };

  AM.std = function (color, opts) {
    opts = opts || {};
    return new T.MeshStandardMaterial({
      color: color,
      map: opts.map || null,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.72,
      normalMap: opts.normalMap || null,
      bumpMap: opts.bumpMap || null,
      bumpScale: opts.bumpScale !== undefined ? opts.bumpScale : 1,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 0.7,
      flatShading: !!opts.flatShading,
      fog: opts.fog !== undefined ? opts.fog : true
    });
  };

  AM.phys = function (color, opts) {
    opts = opts || {};
    return new T.MeshPhysicalMaterial({
      color: color,
      map: opts.map || null,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.08,
      clearcoat: opts.clearcoat !== undefined ? opts.clearcoat : 1.0,
      clearcoatRoughness: opts.clearcoatRoughness !== undefined ? opts.clearcoatRoughness : 0.06,
      transparent: !!opts.transparent,
      opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
      envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 1.4,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
      flatShading: !!opts.flatShading,
      fog: opts.fog !== undefined ? opts.fog : true
    });
  };

  AM.glass = function (tint, opacity) {
    return new T.MeshPhysicalMaterial({
      color: tint === undefined ? AM.PAL.glass : tint,
      metalness: 0.0,
      roughness: 0.055,
      transparent: true,
      opacity: opacity === undefined ? 0.13 : opacity,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      side: T.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.65,
      fog: true
    });
  };

  AM.glow = function (color, opacity, opts) {
    opts = opts || {};
    return new T.MeshBasicMaterial({
      color: color,
      map: opts.map || null,
      transparent: true,
      opacity: opacity === undefined ? 1 : opacity,
      blending: opts.blending || T.AdditiveBlending,
      depthWrite: false,
      depthTest: opts.depthTest !== undefined ? opts.depthTest : true,
      side: opts.side || T.DoubleSide,
      toneMapped: false,
      fog: opts.fog !== undefined ? opts.fog : false
    });
  };

  AM.emissive = function (color, intensity, opts) {
    opts = opts || {};
    var c = new T.Color(color).multiplyScalar(intensity === undefined ? 1 : intensity);
    return AM.basic(c.getHex(), Object.assign({}, opts, {
      map: opts.map || null, transparent: opts.transparent, opacity: opts.opacity,
      side: opts.side, blending: opts.blending, depthWrite: opts.depthWrite,
      toneMapped: false
    }));
  };

  /* ---------------- geometry cache ---------------- */
  var geoCache = {};
  var G = {
    box: function (w, h, d) {
      var k = 'b' + w.toFixed(4) + '_' + h.toFixed(4) + '_' + d.toFixed(4);
      return geoCache[k] || (geoCache[k] = new T.BoxGeometry(w, h, d));
    },
    cyl: function (rt, rb, h, seg, open) {
      var k = 'c' + rt.toFixed(4) + '_' + rb.toFixed(4) + '_' + h.toFixed(4) + '_' + (seg || 12) + '_' + (open ? 1 : 0);
      return geoCache[k] || (geoCache[k] = new T.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open));
    },
    sphere: function (r, ws, hs) {
      var k = 's' + r.toFixed(4) + '_' + (ws || 16) + '_' + (hs || 10);
      return geoCache[k] || (geoCache[k] = new T.SphereGeometry(r, ws || 16, hs || 10));
    },
    plane: function (w, h, sx, sy) {
      var k = 'p' + w.toFixed(4) + '_' + h.toFixed(4) + '_' + (sx || 1) + '_' + (sy || 1);
      return geoCache[k] || (geoCache[k] = new T.PlaneGeometry(w, h, sx || 1, sy || 1));
    },
    torus: function (r, tube, radial, tubular, arc) {
      var k = 't' + r.toFixed(4) + '_' + tube.toFixed(4) + '_' + (radial || 8) + '_' + (tubular || 24) + '_' + (arc || Math.PI * 2).toFixed(4);
      return geoCache[k] || (geoCache[k] = new T.TorusGeometry(r, tube, radial || 8, tubular || 24, arc || Math.PI * 2));
    },
    ring: function (ri, ro, seg) {
      var k = 'r' + ri.toFixed(4) + '_' + ro.toFixed(4) + '_' + (seg || 32);
      return geoCache[k] || (geoCache[k] = new T.RingGeometry(ri, ro, seg || 32));
    }
  };
  AM.G = G;

  AM.worldUVBox = function (geo, scale, offsetX, offsetY) {
    scale = scale || .35;
    var p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (var i = 0; i < p.count; i++) {
      var nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
      var u, v;
      if (nx > .5) { u = p.getZ(i); v = p.getY(i); }
      else if (ny > .5) { u = p.getX(i); v = p.getZ(i); }
      else { u = p.getX(i); v = p.getY(i); }
      uv.setXY(i, u * scale + (offsetX || 0), v * scale + (offsetY || 0));
    }
    uv.needsUpdate = true;
    return geo;
  };

  AM.boxGeo = function (w, h, d, opts) {
    if (opts && opts.worldUV) {
      var g = new T.BoxGeometry(w, h, d);
      AM.worldUVBox(g, opts.uvScale || .32, opts.uvX, opts.uvY);
      return g;
    }
    return G.box(w, h, d);
  };

  /* ---------------- outlines ---------------- */
  var outlineCache = {};
  var outlineVS = [
    'uniform float uThickness;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  vec3 n = normalize(normalMatrix * normal);',
    '  mv.xyz += n * uThickness * max(1.0, -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var outlineFS = 'uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }';
  AM.outlineMat = function (thickness, color, opacity) {
    var key = thickness + '_' + color + '_' + (opacity === undefined ? 1 : opacity);
    if (!outlineCache[key]) {
      outlineCache[key] = new T.ShaderMaterial({
        uniforms: {
          uThickness: { value: thickness },
          uColor: { value: new T.Color(color === undefined ? AM.PAL.outline : color) },
          uOpacity: { value: opacity === undefined ? 1 : opacity }
        },
        vertexShader: outlineVS,
        fragmentShader: outlineFS,
        side: T.BackSide,
        transparent: opacity !== undefined && opacity < 1,
        depthWrite: true,
        fog: false
      });
    }
    return outlineCache[key];
  };
  // Constant-thickness inverted hull. The camera-distance multiplier keeps the line
  // weight readable whether the lens is at the model edge or inside the control room.
  AM.outline = function (mesh, thickness, color, opacity) {
    if (!mesh || mesh.userData.noOutline) return null;
    var o = new T.Mesh(mesh.geometry, AM.outlineMat(thickness === undefined ? 0.0026 : thickness, color, opacity));
    o.castShadow = false; o.receiveShadow = false;
    o.userData.isOutline = true;
    o.frustumCulled = mesh.frustumCulled;
    o.renderOrder = -2;
    mesh.add(o);
    return o;
  };

  /* ---------------- mesh helpers ---------------- */
  AM.box = function (w, h, d, mat, outline, thick, opts) {
    var m = new T.Mesh(AM.boxGeo(w, h, d, opts), mat);
    if (outline !== false) AM.outline(m, thick === undefined ? .0022 : thick);
    return m;
  };
  AM.cyl = function (rt, rb, h, seg, mat, outline, thick) {
    var m = new T.Mesh(G.cyl(rt, rb, h, seg, false), mat);
    if (outline) AM.outline(m, thick === undefined ? .0020 : thick);
    return m;
  };
  AM.sphere = function (r, ws, hs, mat, outline, thick) {
    var m = new T.Mesh(G.sphere(r, ws, hs), mat);
    if (outline) AM.outline(m, thick === undefined ? .0018 : thick);
    return m;
  };
  AM.plane = function (w, h, mat, sx, sy) { return new T.Mesh(G.plane(w, h, sx, sy), mat); };
  AM.put = function (parent, mesh, x, y, z, ry, rx, rz) {
    mesh.position.set(x || 0, y || 0, z || 0);
    if (ry) mesh.rotation.y = ry;
    if (rx) mesh.rotation.x = rx;
    if (rz) mesh.rotation.z = rz;
    if (parent) parent.add(mesh);
    return mesh;
  };
  AM.group = function (parent, x, y, z) {
    var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g;
  };
  AM.tube = function (points, radius, mat, segs, radial) {
    var curve = new T.CatmullRomCurve3(points);
    var geo = new T.TubeGeometry(curve, segs || 20, radius, radial || 8, false);
    return new T.Mesh(geo, mat);
  };
  AM.torus = function (r, tube, mat, radial, tubular) {
    return new T.Mesh(G.torus(r, tube, radial, tubular), mat);
  };
  AM.ring = function (ri, ro, seg, mat) { return new T.Mesh(G.ring(ri, ro, seg), mat); };
  AM.decal = function (w, h, map, opts) {
    opts = opts || {};
    var m = new T.MeshBasicMaterial({
      map: map,
      transparent: true,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      color: opts.color === undefined ? 0xffffff : opts.color,
      side: opts.side || T.FrontSide,
      depthWrite: false,
      blending: opts.blending || T.NormalBlending,
      alphaTest: opts.alphaTest === undefined ? 0.015 : opts.alphaTest,
      toneMapped: false,
      fog: opts.fog !== false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    var mesh = new T.Mesh(G.plane(w, h), m);
    mesh.renderOrder = opts.renderOrder || 2;
    return mesh;
  };
  AM.sprite = function (parent, map, color, size, opacity, additive) {
    var mat = new T.SpriteMaterial({
      map: map, color: color, transparent: true,
      opacity: opacity === undefined ? 1 : opacity,
      blending: additive === false ? T.NormalBlending : T.AdditiveBlending,
      depthWrite: false, toneMapped: false, fog: true
    });
    var s = new T.Sprite(mat); s.scale.set(size, size, 1); if (parent) parent.add(s); return s;
  };

  /* ---------------- structural sub-kits ---------------- */
  AM.iBeam = function (length, height, width, mat, outline) {
    var g = new T.Group();
    var t = Math.min(.16, height * .18);
    var top = AM.box(length, t, width, mat, false);
    top.position.y = height * .5 - t * .5;
    var bot = top.clone(); bot.position.y = -height * .5 + t * .5;
    var web = AM.box(length, height - t * 2, Math.max(.07, width * .17), mat, false);
    if (outline !== false) {
      AM.outline(top, .0026);
    }
    g.add(top, bot, web);
    g.userData.height = height;
    return g;
  };
  AM.bolts = function (parent, positions, radius, depth, mat) {
    var geo = G.cyl(radius, radius, depth, 6, false);
    for (var i = 0; i < positions.length; i++) {
      var b = new T.Mesh(geo, mat);
      b.position.copy(positions[i]);
      b.rotation.z = Math.PI * .5;
      parent.add(b);
    }
  };
  AM.tubeLight = function (parent, length, color, thickness, fixture) {
    var g = new T.Group();
    var mat = new T.MeshBasicMaterial({ color: color, toneMapped: false });
    var tube = new T.Mesh(G.cyl(thickness, thickness, length, 10, false), mat);
    tube.rotation.z = Math.PI * .5;
    tube.position.y = 0;
    g.add(tube);
    // soft glass sleeve catches a little light
    var sleeveMat = AM.glow(color, .11);
    var sleeve = new T.Mesh(G.cyl(thickness * 1.8, thickness * 1.8, length * 1.02, 10, true), sleeveMat);
    sleeve.rotation.z = Math.PI * .5; g.add(sleeve);
    if (fixture !== false) {
      var capMat = AM.toon(0x2a3030, { rim: .12 });
      var capA = AM.cyl(thickness * 2.0, thickness * 2.0, .1, 10, capMat, false);
      capA.rotation.z = Math.PI * .5; capA.position.x = length * .5 + .045; g.add(capA);
      var capB = capA.clone(); capB.position.x = -length * .5 - .045; g.add(capB);
      var rail = AM.box(length + .26, .035, .09, AM.mats ? AM.mats.steelDark : capMat, false);
      rail.position.y = .10; g.add(rail);
    }
    g.userData.tubeMat = mat;
    if (parent) parent.add(g);
    return g;
  };
  AM.ladder = function (parent, x, y, z, height, width, mat, orientation) {
    var g = AM.group(parent, x, y, z);
    if (orientation) g.rotation.y = orientation;
    var r = .027;
    var railGeo = G.cyl(r, r, height, 6, false);
    var a = new T.Mesh(railGeo, mat); a.position.set(-width * .5, height * .5, 0); g.add(a);
    var b = a.clone(); b.position.x = width * .5; g.add(b);
    var stepGeo = G.cyl(r * .8, r * .8, width, 6, false);
    for (var yy = .26; yy < height; yy += .3) {
      var s = new T.Mesh(stepGeo, mat); s.rotation.z = Math.PI * .5; s.position.y = yy; g.add(s);
    }
    return g;
  };
  AM.railing = function (parent, length, height, mat, axis) {
    var g = new T.Group();
    var postGeo = G.cyl(.026, .026, height, 6, false);
    var count = Math.max(2, Math.round(length / .75));
    for (var i = 0; i <= count; i++) {
      var p = new T.Mesh(postGeo, mat);
      p.position.set((i / count - .5) * length, height * .5, 0);
      g.add(p);
    }
    for (var h = 0; h < 2; h++) {
      var bar = new T.Mesh(G.cyl(.022, .022, length, 6, false), mat);
      bar.rotation.z = Math.PI * .5;
      bar.position.y = height * (h ? 1 : .55);
      g.add(bar);
    }
    if (axis === 'z') g.rotation.y = Math.PI * .5;
    if (parent) parent.add(g);
    return g;
  };
  AM.pipe = function (parent, points, radius, mat, segs) {
    var m = AM.tube(points, radius, mat, segs || Math.max(8, points.length * 8), 8);
    m.castShadow = true;
    if (parent) parent.add(m);
    return m;
  };
  AM.louver = function (parent, w, h, d, mat, angle) {
    var g = new T.Group();
    var count = Math.max(3, Math.round(h / .1));
    for (var i = 0; i < count; i++) {
      var slat = AM.box(w, .025, d, mat, false);
      slat.position.y = -h * .5 + (i + .5) * h / count;
      slat.rotation.x = angle === undefined ? .55 : angle;
      g.add(slat);
    }
    if (parent) parent.add(g);
    return g;
  };

  /* ---------------- global state ---------------- */
  AM.scene = null;
  AM.camera = null;
  AM.renderer = null;
  AM.controls = null;
  AM.time = 0;
  AM.updaters = [];
  AM.postUpdaters = [];
  AM.lights = {};
  AM.isCapture = false;

  /* ---------------- environment ---------------- */
  function makeEnvCanvas(face) {
    var c = AM.canvas(256, 256), g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#030607');
    grad.addColorStop(.42, '#0d1415');
    grad.addColorStop(.62, '#3b3832');
    grad.addColorStop(.78, '#231813');
    grad.addColorStop(1, '#050706');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    var r = AM.rng(face.charCodeAt(0) * 29 + 19);
    for (var i = 0; i < 8; i++) {
      g.globalAlpha = .08 + r() * .2;
      g.fillStyle = i % 3 === 0 ? '#9bb06b' : (i % 3 === 1 ? '#ffc184' : '#6d8f94');
      var w = 3 + r() * 58, h = 1 + r() * 6;
      g.fillRect(r() * 230, 40 + r() * 150, w, h);
    }
    g.globalAlpha = .24;
    g.fillStyle = '#d9d4b4'; g.fillRect(45, 126, 166, 1.5);
    g.globalAlpha = .1;
    g.fillStyle = '#a55736'; g.fillRect(0, 174, 256, 24);
    g.globalAlpha = 1;
    return c;
  }

  AM.initCore = function () {
    var canvas = document.getElementById('scene');
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (T.LinearEncoding !== undefined) renderer.outputEncoding = T.LinearEncoding;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setClearColor(0x050809, 1);
    renderer.shadowMap.enabled = !/[?&]noshadow=1/.test(location.search);
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    AM.renderer = renderer;
    try {
      var gl = renderer.getContext();
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      AM.glInfo = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (e) { AM.glInfo = 'unknown'; }

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x091011, .009);
    AM.scene = scene;

    var camera = new T.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .08, 180);
    AM.camera = camera;

    // A dark, softly reflective environment keeps steel and glass from reading flat.
    var faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(makeEnvCanvas);
    var cube = new T.CubeTexture(faces);
    if (T.sRGBEncoding !== undefined) cube.encoding = T.sRGBEncoding;
    cube.needsUpdate = true;
    var pmrem = new T.PMREMGenerator(renderer);
    var envRT = pmrem.fromCubemap(cube);
    scene.environment = envRT.texture;
    AM.env = envRT.texture;
    if (cube.dispose) cube.dispose();
    pmrem.dispose();

    var hemi = new T.HemisphereLight(0x718f95, 0x1c1813, .55);
    scene.add(hemi);

    var key = new T.DirectionalLight(0xc9d9d2, 1.95);
    key.position.set(-11.5, 17.5, 12.5);
    key.target.position.set(0, 2.1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -14; key.shadow.camera.right = 14;
    key.shadow.camera.top = 15; key.shadow.camera.bottom = -14;
    key.shadow.camera.near = 1; key.shadow.camera.far = 48;
    key.shadow.bias = -0.00020; key.shadow.normalBias = .085;
    scene.add(key); scene.add(key.target);

    var fill = new T.DirectionalLight(0x4c7780, .55);
    fill.position.set(13, 9, 7); scene.add(fill);

    var rim = new T.DirectionalLight(0xd68d59, 1.0);
    rim.position.set(5, 10, -15);
    rim.target.position.set(0, 3, 0);
    scene.add(rim); scene.add(rim.target);

    var amb = new T.AmbientLight(0x223033, .22);
    scene.add(amb);

    // warm room core / green machine bank
    var warm = new T.PointLight(0xffa35b, 2.7, 9.5, 2);
    warm.position.set(-1.15, 3.24, 1.0);
    scene.add(warm);
    var warm2 = new T.PointLight(0xffc985, 1.3, 7, 2);
    warm2.position.set(-1.8, 2.1, -.25);
    scene.add(warm2);
    var monitor = new T.PointLight(0xb1db85, 1.25, 6, 2);
    monitor.position.set(-1.3, 2.5, -2.0);
    scene.add(monitor);
    var tableGlow = new T.PointLight(0xd7e9a0, .75, 4.2, 2);
    tableGlow.position.set(-.3, 2.2, -.2);
    scene.add(tableGlow);
    var redLamp = new T.PointLight(0xff4a2e, .9, 6, 2);
    redLamp.position.set(3.8, 3.4, -3.2);
    scene.add(redLamp);
    var searchLamp = new T.PointLight(0xffd393, 1.5, 12, 2);
    searchLamp.position.set(-6.1, 7.1, -6.0);
    scene.add(searchLamp);

    AM.lights = { hemi: hemi, key: key, fill: fill, rim: rim, ambient: amb, warm: warm, warm2: warm2, monitor: monitor, tableGlow: tableGlow, redLamp: redLamp, searchLamp: searchLamp };

    var controls = AM.makeControls(camera, renderer.domElement);
    AM.controls = controls;
    controls.setInitial();

    AM.Post.init(renderer, renderer.domElement.width, renderer.domElement.height);

    // Sky: deep, sooty void with one soft sickly glow behind the bureau model.
    var sky = new T.Mesh(new T.SphereGeometry(90, 48, 28), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new T.Color(0x010304) },
        uBottom: { value: new T.Color(0x0b1415) },
        uGlow: { value: new T.Color(0x2a3b2b) },
        uWarm: { value: new T.Color(0x3a2417) },
        uTime: { value: 0 }
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'varying vec3 vDir;',
        'uniform vec3 uTop,uBottom,uGlow,uWarm;',
        'uniform float uTime;',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.)); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
        'void main(){',
        '  vec3 d = normalize(vDir);',
        '  float h = clamp(d.y * .5 + .5, 0.0, 1.0);',
        '  vec3 col = mix(uBottom, uTop, pow(h, .55));',
        '  float warm = pow(max(0.0, 1.0 - length(d.xz - vec2(-.36,-.92)) * 1.48), 4.5);',
        '  col += uWarm * warm * .24;',
        '  float green = pow(max(0.0, 1.0 - length(d.xz - vec2(.75,.45)) * 1.8), 6.0);',
        '  col += uGlow * green * .18;',
        '  vec2 sp = vec2(atan(d.z, d.x) * 1.7 + uTime * .0015, d.y * 2.2);',
        '  float n = noise(sp * 1.2 + 9.0) * .6 + noise(sp * 4.5 - uTime * .002) * .28 + noise(sp * 11.0) * .12;',
        '  float cloud = smoothstep(.42, .86, n) * smoothstep(-.15, .4, d.y);',
        '  col += vec3(.026,.030,.029) * cloud;',
        '  float floorLine = smoothstep(.04, -.24, d.y);',
        '  col = mix(col, vec3(.010,.015,.015) + vec3(.012,.014,.012) * noise(d.xz * 4.0), floorLine * .8);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    }));
    sky.renderOrder = -20;
    scene.add(sky);
    AM.sky = sky;

    // Haze below the plinth. It anchors the object without becoming a visible floor.
    var under = new T.Mesh(new T.PlaneGeometry(62, 62), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uA: { value: new T.Color(0x101b19) },
        uB: { value: new T.Color(0x2c1c12) },
        uC: { value: new T.Color(0x5f6f55) }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime; uniform vec3 uA,uB,uC;',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
        'float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }',
        'void main(){',
        '  vec2 p = vUv - .5; float d = length(p);',
        '  float cloud = n(vUv * 4.5 + uTime * .004) * .55 + n(vUv * 13. - uTime * .003) * .25 + n(vUv * 27.) * .12;',
        '  float a = smoothstep(.5, .055, d) * (.20 + cloud * .17);',
        '  vec3 c = mix(uA, uB, smoothstep(.35, .05, d) * .42) + uC * cloud * .11;',
        '  a *= smoothstep(0.0, .09, d);',
        '  gl_FragColor = vec4(c * a * 1.5, a);',
        '}'
      ].join('\n')
    }));
    under.rotation.x = -Math.PI * .5;
    under.position.y = -2.28;
    under.renderOrder = -12;
    scene.add(under);
    AM.underHaze = under;

    // Fine guide rings under the base, almost invisible, to sell the "collected
    // object on a dark plinth" read.
    var rings = new T.Mesh(new T.RingGeometry(9.6, 15.8, 96, 1), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ vec2 p = vUv-.5; float d=length(p)*2.; float rings = smoothstep(.08,.0,abs(d-.58))*.16 + smoothstep(.055,.0,abs(d-.77))*.10; float a = smoothstep(1.0,.38,d) * rings; gl_FragColor=vec4(vec3(.36,.42,.23)*a,a); }'
    }));
    rings.rotation.x = -Math.PI * .5;
    rings.position.y = -2.3;
    rings.renderOrder = -11;
    scene.add(rings);
    AM.underRings = rings;

    window.addEventListener('resize', function () {
      var w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      AM.Post.resize(renderer.domElement.width, renderer.domElement.height);
    });
  };

  /* ---------------- camera interaction ---------------- */
  AM.makeControls = function (camera, dom) {
    var capture = /[?&]capture=1/.test(location.search);
    var portrait = window.innerWidth / window.innerHeight < 1.05;
    var fit = (!capture && portrait) ? AM.clamp(1.15 / (window.innerWidth / window.innerHeight), 1, 2.05) : 1;
    var HOME = { theta: .70, phi: 1.095, radius: 31.0 * fit, target: [0, 2.40, -.02] };
    var st = {
      theta: HOME.theta, phi: HOME.phi, radius: HOME.radius,
      tTheta: HOME.theta, tPhi: HOME.phi, tRadius: HOME.radius,
      target: new T.Vector3(HOME.target[0], HOME.target[1], HOME.target[2]),
      tTarget: new T.Vector3(HOME.target[0], HOME.target[1], HOME.target[2]),
      lastInput: performance.now(),
      autoDelay: 17000,
      autoRotate: !capture,
      minRadius: 8.5,
      maxRadius: 58,
      baseFit: fit
    };
    var drag = 0, lx = 0, ly = 0, pointers = new Map(), pinch = 0, pinchX = null, pinchY = null;

    /* shift/right-drag and two-finger drag share the same pan: push `target`
       along the camera's right/up axes, so the model follows the fingers. */
    function panBy(dx, dy) {
      var k = st.radius * .00135;
      var right = new T.Vector3().setFromMatrixColumn(camera.matrix, 0);
      var up = new T.Vector3().setFromMatrixColumn(camera.matrix, 1);
      st.tTarget.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
      st.tTarget.x = AM.clamp(st.tTarget.x, -6.5, 6.5);
      st.tTarget.z = AM.clamp(st.tTarget.z, -6.5, 6.5);
      st.tTarget.y = AM.clamp(st.tTarget.y, -0.3, 8.5);
    }
    function down(e) {
      if (dom.setPointerCapture) { try { dom.setPointerCapture(e.pointerId); } catch (x) {} }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = (e.button === 2 || e.button === 1 || e.shiftKey) ? 2 : 1;
      lx = e.clientX; ly = e.clientY;
      st.lastInput = performance.now();
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
        if (pinch > 0 && d > 0) st.tRadius = AM.clamp(st.tRadius * (pinch / d), st.minRadius, st.maxRadius);
        /* two fingers moving together pan; the midpoint drifts during a pinch too,
           which keeps dollies and pans usable in the same gesture */
        if (pinchX !== null) panBy(cx - pinchX, cy - pinchY);
        pinch = d; pinchX = cx; pinchY = cy;
        return;
      }
      var dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      if (drag === 2) {
        panBy(dx, dy);
      } else {
        st.tTheta -= dx * .0046;
        st.tPhi = AM.clamp(st.tPhi - dy * .0036, .22, 1.47);
      }
    }
    function up(e) {
      pointers.delete(e.pointerId);
      pinch = 0; pinchX = pinchY = null;
      if (pointers.size === 0) drag = 0;
      else if (pointers.size === 1) {
        /* Re-anchor on the finger that is still down. Without this the next move
           measures from the other finger's old position and throws the camera. */
        var rest = pointers.values().next().value;
        lx = rest.x; ly = rest.y;
      }
    }
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', function (e) {
      e.preventDefault(); st.lastInput = performance.now();
      var f = 1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * .0012, .15);
      st.tRadius = AM.clamp(st.tRadius * f, st.minRadius, st.maxRadius);
    }, { passive: false });
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.addEventListener('dblclick', function () { st.setShot('hero'); });

    st.update = function (dt) {
      var now = performance.now();
      if (st.autoRotate && !drag && pointers.size === 0 && now - st.lastInput > st.autoDelay) st.tTheta += dt * .016;
      var k = 1 - Math.pow(.0007, Math.min(dt, .05));
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
      AM.cameraState = st;
    };
    st.setInitial = function () {
      st.theta = st.tTheta; st.phi = st.tPhi; st.radius = st.tRadius;
      st.target.copy(st.tTarget); st.update(.016);
    };
    st.setShot = function (name, instant) {
      st.lastInput = performance.now();
      var f = st.baseFit;
      var shots = {
        hero:      { theta: .70, phi: 1.095, radius: 31.0 * f, target: [0, 2.40, -.02] },
        overview:  { theta: .52, phi: .86, radius: 34.5 * f, target: [0, 1.8, -.1] },
        close:     { theta: .48, phi: 1.08, radius: 18.8 * f, target: [-.1, 2.2, -.05] },
        interior:  { theta: .38, phi: 1.155, radius: 11.4 * f, target: [-.5, 2.35, -.1] },
        control:   { theta: .25, phi: 1.19, radius: 9.2 * f, target: [-.7, 2.25, -.25] },
        top:       { theta: .67, phi: .55, radius: 28 * f, target: [0, 1.4, -.1] },
        back:      { theta: 2.45, phi: 1.06, radius: 31 * f, target: [0, 2.0, 0] },
        left:      { theta: -0.58, phi: 1.09, radius: 30 * f, target: [0, 2.1, 0] },
        low:       { theta: .78, phi: 1.41, radius: 27.5 * f, target: [0, 1.9, 0] },
        tower:     { theta: 1.15, phi: 1.18, radius: 18 * f, target: [-4.2, 4.1, -3.8] },
        trench:    { theta: .88, phi: 1.13, radius: 10.2 * f, target: [1.4, .8, 4.8] },
        portal:    { theta: .58, phi: 1.19, radius: 10.0 * f, target: [-1.5, 1.7, 1.8] },
        tapewall:  { theta: 1.10, phi: 1.10, radius: 9.8 * f, target: [-1.5, 1.9, -.3] },
        heroLow:   { theta: .66, phi: 1.12, radius: 31.5 * f, target: [0, 2.3, 0] },
        heroRight: { theta: .85, phi: 1.08, radius: 30.8 * f, target: [0, 2.25, 0] },
        heroLeft:  { theta: .43, phi: 1.08, radius: 31.2 * f, target: [0, 2.3, 0] },
        heroClose: { theta: .72, phi: 1.13, radius: 29.0 * f, target: [0, 2.25, 0] },
        heroFit2:  { theta: .70, phi: 1.10, radius: 30.9 * f, target: [0, 2.40, 0] },
        heroFit3:  { theta: .73, phi: 1.085, radius: 31.2 * f, target: [0, 2.45, 0] }
      };
      var s = shots[name] || shots.hero;
      st.tTheta = s.theta; st.tPhi = s.phi; st.tRadius = s.radius;
      st.tTarget.set(s.target[0], s.target[1], s.target[2]);
      if (instant || name) {
        st.theta = s.theta; st.phi = s.phi; st.radius = s.radius;
        st.target.copy(st.tTarget); st.update(.016);
      }
    };
    st.state = st;
    st.setShot('hero', true);
    return st;
  };

  /* ---------------- post ---------------- */
  AM.Post = (function () {
    var renderer, sceneRT, bloomA, bloomB, bloomC, bloomD;
    var qScene, qCam, quad, brightMat, blurH, blurV, compMat;
    var W = 1, H = 1;
    var VS = 'varying vec2 vUv; void main(){ vUv = .5 * (position.xy + 1.0); gl_Position = vec4(position.xy, 0.0, 1.0); }';
    function makeRT(w, h, samples) {
      var rt = new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
        minFilter: T.LinearFilter, magFilter: T.LinearFilter,
        format: T.RGBAFormat, type: T.HalfFloatType,
        depthBuffer: true, stencilBuffer: false, samples: samples || 0
      });
      return rt;
    }
    function makeBlur(dir) {
      return new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uDir: { value: dir }, uTexel: { value: new T.Vector2(1 / 512, 1 / 512) } },
        vertexShader: VS,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir,uTexel; void main(){ vec2 o=uDir*uTexel; vec3 c=texture2D(tSrc,vUv).rgb*0.227027; c+=texture2D(tSrc,vUv+o*1.3846).rgb*0.316216; c+=texture2D(tSrc,vUv-o*1.3846).rgb*0.316216; c+=texture2D(tSrc,vUv+o*3.2308).rgb*0.070270; c+=texture2D(tSrc,vUv-o*3.2308).rgb*0.070270; gl_FragColor=vec4(c,1.0); }',
        depthTest: false, depthWrite: false
      });
    }
    function init(r, w, h) {
      renderer = r;
      var dpr = renderer.getPixelRatio();
      W = w || window.innerWidth * dpr; H = h || window.innerHeight * dpr;
      sceneRT = makeRT(W, H, 4);
      bloomA = makeRT(W / 3.2, H / 3.2);
      bloomB = makeRT(W / 3.2, H / 3.2);
      bloomC = makeRT(W / 8, H / 8);
      bloomD = makeRT(W / 8, H / 8);
      qScene = new T.Scene(); qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; qScene.add(quad);
      brightMat = new T.ShaderMaterial({
        uniforms: { tSrc: { value: null }, uThreshold: { value: .50 }, uKnee: { value: .38 } },
        vertexShader: VS,
        fragmentShader: 'varying vec2 vUv; uniform sampler2D tSrc; uniform float uThreshold,uKnee; void main(){ vec3 c=texture2D(tSrc,vUv).rgb; float l=max(c.r,max(c.g,c.b)); float s=smoothstep(uThreshold,uThreshold+uKnee,l); gl_FragColor=vec4(c*s,1.0); }',
        depthTest: false, depthWrite: false
      });
      blurH = makeBlur(new T.Vector2(1, 0));
      blurV = makeBlur(new T.Vector2(0, 1));
      compMat = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloomA: { value: null }, tBloomC: { value: null },
          uTime: { value: 0 }, uRes: { value: new T.Vector2(W, H) },
          uBloom: { value: .78 }, uVignette: { value: .76 },
          uExposure: { value: .88 }, uFade: { value: 0 }, uGrain: { value: .012 }
        },
        vertexShader: VS,
        fragmentShader: [
          'varying vec2 vUv;',
          'uniform sampler2D tScene,tBloomA,tBloomC;',
          'uniform float uTime,uBloom,uVignette,uExposure,uFade,uGrain;',
          'uniform vec2 uRes;',
          'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
          'vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }',
          'void main(){',
          '  vec2 uv = vUv;',
          '  vec2 d = uv - .5;',
          '  float r2 = dot(d,d);',
          '  float ca = r2 * .0019;',
          '  vec3 col;',
          '  col.r = texture2D(tScene, uv + d * ca).r;',
          '  col.g = texture2D(tScene, uv).g;',
          '  col.b = texture2D(tScene, uv - d * ca).b;',
          '  vec3 bloom = texture2D(tBloomA,uv).rgb * .52 + texture2D(tBloomC,uv).rgb * .74;',
          '  col += bloom * uBloom;',
          '  float l = dot(col, vec3(.299,.587,.114));',
          '  col = mix(col, col * vec3(.64,.88,1.12), (1.0-smoothstep(0.0,.46,l)) * .66);',
          '  col = mix(col, col * vec3(1.10,1.00,.87), smoothstep(.34,1.02,l) * .43);',
          '  col *= uExposure;',
          '  col = aces(col);',
          '  col = pow(max(col,0.0), vec3(1.0/2.2));',
          '  col = clamp((col-.5)*1.13+.5, 0.0, 1.0);',
          '  float l2 = dot(col, vec3(.299,.587,.114));',
          '  col = mix(vec3(l2), col, 1.18);',
          '  col += vec3(.004,.008,.011) * (1.0-l2);',
          '  // subtle paper tooth, no screen-space lines',
          '  float vig = smoothstep(.97,.16,r2*1.42);',
          '  col *= mix(1.0,vig,uVignette);',
          '  float grain = hash(uv * uRes + fract(uTime)*97.3);',
          '  col += (grain-.5) * uGrain;',
          '  col *= 1.0 - uFade;',
          '  gl_FragColor = vec4(max(col,0.0),1.0);',
          '}'
        ].join('\n'),
        depthTest: false, depthWrite: false
      });
    }
    function pass(mat, target) {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(qScene, qCam);
    }
    function resize(w, h) {
      W = Math.max(1, w | 0); H = Math.max(1, h | 0);
      sceneRT.setSize(W, H);
      bloomA.setSize(W / 3.2, H / 3.2); bloomB.setSize(W / 3.2, H / 3.2);
      bloomC.setSize(W / 8, H / 8); bloomD.setSize(W / 8, H / 8);
      if (compMat) compMat.uniforms.uRes.value.set(W, H);
    }
    function render(scene, camera, time, fade) {
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(0x050809, 1);
      renderer.clear();
      renderer.render(scene, camera);
      AM.frameStats = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
      brightMat.uniforms.tSrc.value = sceneRT.texture; pass(brightMat, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture;
      blurH.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height); pass(blurH, bloomB);
      blurV.uniforms.tSrc.value = bloomB.texture;
      blurV.uniforms.uTexel.value.set(1 / bloomA.width, 1 / bloomA.height); pass(blurV, bloomA);
      blurH.uniforms.tSrc.value = bloomA.texture;
      blurH.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height); pass(blurH, bloomC);
      blurV.uniforms.tSrc.value = bloomC.texture;
      blurV.uniforms.uTexel.value.set(2 / bloomC.width, 2 / bloomC.height); pass(blurV, bloomD);
      compMat.uniforms.tScene.value = sceneRT.texture;
      compMat.uniforms.tBloomA.value = bloomA.texture;
      compMat.uniforms.tBloomC.value = bloomD.texture;
      compMat.uniforms.uTime.value = time;
      compMat.uniforms.uFade.value = fade || 0;
      quad.material = compMat;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(qScene, qCam);
    }
    return { init: init, resize: resize, render: render, uniforms: function () { return compMat.uniforms; } };
  })();

  /* ---------------- generic animation helpers ---------------- */
  AM.mechanical = function (time, period, phase, smoothness) {
    var u = AM.mod(time / period + phase, 1);
    var s = AM.smoother((u - .06) / .29) * (1 - AM.smoother((u - .64) / .29));
    return s;
  };

  AM.addUpdater = function (fn) { AM.updaters.push(fn); };
})();
