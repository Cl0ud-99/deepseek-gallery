/* =========================================================
   effects.js — rain, neon, sparks, ripples, reflection & wind
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP;
  var sceneQueue = [];
  var rain = null, ripples = null, spark = null;
  var reflMats = [];
  var neon = null;
  var ext = (QP.fx = QP.fx || {});
  var glowTex = QP.Tex.glow();

  function buildRain() {
    var N = 4300;
    var positions = new Float32Array(N * 2 * 3);
    var tails = new Float32Array(N * 2);
    var speeds = new Float32Array(N * 2);
    var lens = new Float32Array(N * 2);
    var alphas = new Float32Array(N * 2);
    var r = QP.rng(9011);
    for (var i = 0; i < N; i++) {
      var x = -10.8 + r() * 21.6;
      var z = -10.8 + r() * 21.6;
      var y = r() * 12.0;
      var speed = 4.4 + r() * 5.4;
      var len = .28 + r() * .48;
      var alpha = .35 + r() * .65;
      for (var j = 0; j < 2; j++) {
        var k = i * 2 + j;
        positions[k * 3] = x;
        positions[k * 3 + 1] = y;
        positions[k * 3 + 2] = z;
        tails[k] = j;
        speeds[k] = speed;
        lens[k] = len;
        alphas[k] = alpha;
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    geo.setAttribute('aTail', new T.BufferAttribute(tails, 1));
    geo.setAttribute('aSpeed', new T.BufferAttribute(speeds, 1));
    geo.setAttribute('aLen', new T.BufferAttribute(lens, 1));
    geo.setAttribute('aAlpha', new T.BufferAttribute(alphas, 1));
    geo.boundingSphere = new T.Sphere(new T.Vector3(0, 6, 0), 50);

    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      blending: T.AdditiveBlending, toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.45 },
        uLampPos: { value: new T.Vector3(-7.1, 3.6, 2.3) },
        uHeadPos: { value: new T.Vector3(7.7, 1.17, 3.15) },
        uNeonPos: { value: new T.Vector3(1.6, 5.7, 1.6) },
        uNeonFactor: { value: 1.0 }
      },
      vertexShader: [
        'uniform float uTime; uniform float uOpacity;',
        'uniform vec3 uLampPos; uniform vec3 uHeadPos; uniform vec3 uNeonPos;',
        'attribute float aTail; attribute float aSpeed; attribute float aLen; attribute float aAlpha;',
        'varying float vAlpha; varying vec3 vColor;',
        'void main(){',
        '  float h = 12.0;',
        '  float fall = mod(position.y - uTime * aSpeed, h);',
        '  vec3 p = vec3(position.x, fall, position.z);',
        '  p.y += aTail * aLen;',
        '  p.x += aTail * aLen * .24;',
        '  p.z += aTail * aLen * .06;',
        '  float dL = distance(p, uLampPos);',
        '  float dH = distance(p, uHeadPos);',
        '  float dN = distance(p, uNeonPos);',
        '  float warm = smoothstep(4.0, .4, dL) + smoothstep(5.0, .8, dH) * .9;',
        '  float pink = smoothstep(3.4, .1, dN) * .28;',
        '  float fade = smoothstep(0.0, .5, fall) * (1.0 - smoothstep(10.8, 12.0, fall));',
        '  float trail = aTail > 0.5 ? .22 : 1.0;',
        '  vAlpha = uOpacity * fade * trail * aAlpha * (.25 + warm * 1.1 + pink);',
        '  vColor = mix(vec3(.42,.60,.78), vec3(1.0,.73,.43), clamp(warm, 0.0, 1.0));',
        '  vColor += vec3(.38,.05,.16) * pink;',
        '  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: 'varying float vAlpha; varying vec3 vColor; void main(){ if(vAlpha < .004) discard; gl_FragColor = vec4(vColor, vAlpha); }'
    });
    var lines = new T.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 7;
    lines.name = 'night-rain';
    QP.scene.add(lines);
    return { object: lines, mat: mat };
  }

  function buildRipples() {
    var N = 150;
    var verts = [], uvs = [], centers = [], phases = [], speeds = [], sizes = [];
    var r = QP.rng(711);
    for (var i = 0; i < N; i++) {
      var x = -8.0 + r() * 16.0;
      var z = -8.0 + r() * 16.0;
      var y = .026;
      /* lift onto the two sidewalks where appropriate */
      var onSouth = (z > .62 && z < 1.92 && x < 3.2);
      var onEast = (x > 1.30 && x < 3.18 && z < .62);
      if (onSouth || onEast) y = .158;
      var size = .18 + r() * .48;
      var quad = [[-.5, 0, -.5, 0, 0], [.5, 0, -.5, 1, 0], [.5, 0, .5, 1, 1], [-.5, 0, .5, 0, 1]];
      for (var q = 0; q < 4; q++) {
        verts.push(quad[q][0], quad[q][1], quad[q][2]);
        uvs.push(quad[q][3], quad[q][4]);
        centers.push(x, y, z);
        phases.push(r());
        speeds.push(.22 + r() * .38);
        sizes.push(size);
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('aCenter', new T.Float32BufferAttribute(centers, 3));
    geo.setAttribute('aPhase', new T.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new T.Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aSize', new T.Float32BufferAttribute(sizes, 1));
    var indices = [];
    for (var n = 0; n < N; n++) {
      var o = n * 4;
      indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    geo.setIndex(indices);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: .32 }, uColor: { value: new T.Color(0xa8c8da) } },
      vertexShader: [
        'uniform float uTime;',
        'attribute vec3 aCenter; attribute float aPhase; attribute float aSpeed; attribute float aSize;',
        'varying vec2 vUv; varying float vAge;',
        'void main(){',
        '  float age = fract(uTime * aSpeed + aPhase);',
        '  vAge = age; vUv = uv;',
        '  vec3 p = aCenter + position * aSize;',
        '  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv; varying float vAge;',
        'uniform float uOpacity; uniform vec3 uColor;',
        'void main(){',
        '  vec2 p = vUv * 2.0 - 1.0;',
        '  float d = length(p);',
        '  float ring = smoothstep(.10, .0, abs(d - (0.08 + vAge * .82)));',
        '  float fade = (1.0 - vAge) * smoothstep(1.0, .2, d);',
        '  gl_FragColor = vec4(uColor, ring * fade * uOpacity);',
        '}'
      ].join('\n')
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    mesh.name = 'rain-ripples';
    QP.scene.add(mesh);
    return { object: mesh, mat: mat };
  }

  function reflMat(a, b, intensity, speed, useFlicker) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide,
      blending: T.AdditiveBlending, toneMapped: false,
      uniforms: {
        uTime: { value: 0 }, uColorA: { value: new T.Color(a) }, uColorB: { value: new T.Color(b) },
        uIntensity: { value: intensity }, uSpeed: { value: speed === undefined ? 1 : speed },
        uFlicker: { value: 1.0 }, uFlickerOn: { value: useFlicker ? 1 : 0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime, uIntensity, uSpeed, uFlicker, uFlickerOn;',
        'uniform vec3 uColorA, uColorB;',
        'void main(){',
        '  vec2 p = vUv - .5;',
        '  float radial = smoothstep(.56, .10, length(p * vec2(1.06, 1.35)));',
        '  float wav = sin(vUv.y * 18.0 - uTime * (1.2 + uSpeed) + sin(vUv.x * 9.0 + uTime * .7) * 3.2);',
        '  float streak = pow(.5 + .5 * wav, 2.2);',
        '  float fine = .55 + .45 * sin(vUv.y * 66.0 - uTime * 2.0 + sin(vUv.x * 18.0) * 1.5);',
        '  float breakup = .50 + .30 * sin(vUv.x * 27.0 + uTime * 1.1);',
        '  vec3 col = mix(uColorA, uColorB, .5 + .5 * sin(vUv.x * 6.3 + uTime * .30));',
        '  float a = radial * streak * fine * max(breakup, 0.0) * uIntensity * 1.35;',
        '  a *= mix(1.0, uFlicker, uFlickerOn);',
        '  gl_FragColor = vec4(col, a);',
        '}'
      ].join('\n')
    });
  }
  function addReflection(x, z, w, d, colorA, colorB, intensity, speed, flicker, ry) {
    var mat = reflMat(colorA, colorB, intensity, speed, flicker);
    var mesh = new T.Mesh(new T.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    if (ry) mesh.rotation.z = ry;
    mesh.position.set(x, z.y === undefined ? .041 : z.y, z.z === undefined ? z : z.z);
    mesh.renderOrder = 6;
    QP.scene.add(mesh);
    reflMats.push({ mat: mat, base: intensity, flicker: !!flicker });
    return mesh;
  }

  function buildReflections() {
    addReflection(-2.32, { y: .05, z: 2.75 }, 6.8, 3.2, 0xff9d54, 0xffd9a3, .18, .8, false, .05);
    addReflection(-3.35, { y: .16, z: 1.28 }, 4.6, 1.1, 0xff9f50, 0xffe2b4, .20, .7, false, 0);
    addReflection(2.0, { y: .16, z: -1.55 }, 2.6, 3.2, 0xffa04f, 0xffd394, .13, .7, false, .1);
    addReflection(1.52, { y: .16, z: 1.22 }, 1.4, 1.1, 0xff4f8a, 0x55e4d3, .44, 1.2, true, -.25);
    addReflection(-.8, { y: .055, z: 2.28 }, 2.9, 1.35, 0xff477f, 0x4be1d2, .30, 1.3, true, -.12);
    addReflection(1.85, { y: .05, z: 2.65 }, 2.1, 3.5, 0xff5b95, 0x54e0d0, .35, 1.1, true, -.18);
    addReflection(1.32, { y: .16, z: 1.18 }, 1.1, 1.6, 0x55e6d5, 0xa2fff2, .22, 1.4, true, 0);
    addReflection(-6.85, { y: .06, z: 2.0 }, 2.7, 3.1, 0xffa34e, 0xffd79a, .18, .6, false, .2);
    addReflection(-7.05, { y: .16, z: 1.28 }, 1.5, 1.3, 0xffab55, 0xffe2b0, .15, .6, false, 0);
    addReflection(6.72, { y: .05, z: 3.18 }, 3.0, 2.0, 0xffd38d, 0xfff3d1, .23, 1.0, false, 0);
    addReflection(4.62, { y: .05, z: 5.55 }, 2.8, 2.1, 0xff6096, 0x63e1d4, .26, 1.0, true, .15);
    addReflection(1.9, { y: .05, z: -1.7 }, 3.2, 3.1, 0x54d8cf, 0x9ffff3, .12, .8, true, .2);
    addReflection(4.7, { y: .16, z: 1.35 }, 2.0, .9, 0xb5e5de, 0x3fcfc3, .10, .5, false, 0);
    addReflection(6.7, { y: .05, z: 4.9 }, 3.4, 1.5, 0xffd58f, 0xfff3d5, .28, 1.0, false, .08);
    addReflection(-1.4, { y: .05, z: 4.1 }, 3.0, 1.8, 0xff6f9c, 0x65e4d7, .16, .9, true, -.2);
  }

  function buildSparks() {
    var pos = QP.streetAnim.sparkPoint || new T.Vector3(4.75, 5.72, 3.15);
    var g = new T.Group();
    g.position.copy(pos);
    g.position.y = 5.80;
    g.visible = false;
    var geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.BufferAttribute(new Float32Array(20 * 3), 3));
    var mat = new T.LineBasicMaterial({
      color: 0xd6ecff, transparent: true, opacity: 1,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    mat.color.setRGB(2.4, 3.4, 5.0);
    var line = new T.LineSegments(geom, mat);
    line.frustumCulled = false;
    g.add(line);
    var flash = new T.Sprite(new T.SpriteMaterial({
      map: QP.Tex.starGlow(), color: 0xcfe9ff, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    flash.material.color.setRGB(0.9, 1.6, 3.2);
    flash.scale.set(.95, .95, 1);
    g.add(flash);
    var light = new T.PointLight(0xaad3ff, 0, 4.8, 2);
    g.add(light);
    QP.scene.add(g);
    return { group: g, line: line, flash: flash, light: light, ttl: 0, next: 1.0, max: .28 };
  }

  function randomizeSpark() {
    var sp = ext.spark;
    if (!sp) return;
    var posAttr = sp.line.geometry.attributes.position;
    var arr = posAttr.array;
    var count = 12;
    var x = 0, y = -.1, z = 0;
    for (var i = 0; i < count; i++) {
      var nx = (Math.random() - .5) * .26;
      var ny = -.1 + (i + 1) / count * .23;
      var nz = (Math.random() - .5) * .20;
      arr[i * 6 + 0] = x; arr[i * 6 + 1] = y; arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = nx; arr[i * 6 + 4] = ny; arr[i * 6 + 5] = nz;
      x = nx; y = ny; z = nz;
    }
    /* branch */
    arr[60] = -.04; arr[61] = -.03; arr[62] = .02;
    arr[63] = -.18; arr[64] = .06; arr[65] = -.06;
    arr[66] = .03; arr[67] = .02; arr[68] = 0;
    arr[69] = .17; arr[70] = .08; arr[71] = .05;
    posAttr.needsUpdate = true;
  }

  function buildMist() {
    var smoke = QP.Tex.smoke();
    var arr = [];
    var r = QP.rng(88);
    for (var i = 0; i < 15; i++) {
      var s = new T.Sprite(new T.SpriteMaterial({
        map: smoke, color: 0x66798a, transparent: true, opacity: .035,
        depthWrite: false, blending: T.NormalBlending, toneMapped: false
      }));
      var a = r() * Math.PI * 2;
      s.scale.set(8 + r() * 10, 3 + r() * 3, 1);
      s.position.set(Math.cos(a) * (7 + r() * 3), .25 + r() * 1.3, Math.sin(a) * (7 + r() * 3));
      s.userData = { baseX: s.position.x, baseZ: s.position.z, phase: r() * 6.28, amp: .3 + r() * .8, speed: .08 + r() * .1 };
      s.renderOrder = 2;
      QP.scene.add(s);
      arr.push(s);
    }
    return arr;
  }

  QP.buildEffects = function (scene) {
    ext.rain = buildRain();
    ext.ripples = buildRipples();
    ext.spark = buildSparks();
    buildReflections();
    ext.mists = buildMist();
    ext.ripples.mat.uniforms.uTime.value = 0;

    /* lights for rain */
    if (QP.streetAnim && QP.streetAnim.lamp && QP.streetAnim.lamp.light) {
      var wp = new T.Vector3();
      QP.streetAnim.lamp.light.getWorldPosition(wp);
      ext.rain.mat.uniforms.uLampPos.value.copy(wp);
    }
    if (QP.streetAnim && QP.streetAnim.headlightPos) {
      ext.rain.mat.uniforms.uHeadPos.value.copy(QP.streetAnim.headlightPos);
    }
    if (QP.neonRefs && QP.neonRefs.lights && QP.neonRefs.lights[0]) {
      var np = new T.Vector3();
      QP.neonRefs.lights[0].getWorldPosition(np);
      ext.rain.mat.uniforms.uNeonPos.value.copy(np);
    }

    /* gather glow sprites and neon bases */
    neon = { sprites: [], lightBases: [], panelMats: [], tubeMats: [], tubeBases: [], roundMats: [], roundLightBase: 0 };
    if (QP.neonRefs) {
      neon.panelMats = QP.neonRefs.panelMats || [];
      neon.tubeMats = QP.neonRefs.tubeMats || [];
      for (var i = 0; i < neon.tubeMats.length; i++) neon.tubeBases.push(neon.tubeMats[i].color.clone());
      neon.lightBases = (QP.neonRefs.lights || []).map(function (l) { return l.intensity; });
      if (QP.neonRefs.signGrp) {
        QP.neonRefs.signGrp.traverse(function (o) {
          if (o.isSprite) neon.sprites.push({ mat: o.material, base: o.material.opacity });
        });
      }
      if (QP.neonRefs.roundMats) {
        neon.roundMats = QP.neonRefs.roundMats;
      }
      if (QP.neonRefs.lights && QP.neonRefs.lights[2]) neon.roundLightBase = QP.neonRefs.lights[2].intensity;
    }

    /* interior dust */
    var dustCount = 140;
    var dp = new Float32Array(dustCount * 3);
    var da = new Float32Array(dustCount);
    var r = QP.rng(543);
    for (var d = 0; d < dustCount; d++) {
      var zone = d % 3;
      var x = zone === 0 ? -4.8 + r() * 3.0 : zone === 1 ? -.9 + r() * 2.0 : -4.3 + r() * 3.0;
      var z = zone === 2 ? -.6 + r() * 1.6 : -2.2 + r() * 2.2;
      var y = zone === 2 ? 4.4 + r() * 1.8 : .7 + r() * 1.8;
      dp[d * 3] = x; dp[d * 3 + 1] = y; dp[d * 3 + 2] = z;
      da[d] = .25 + r() * .75;
    }
    var dustGeo = new T.BufferGeometry();
    dustGeo.setAttribute('position', new T.BufferAttribute(dp, 3));
    dustGeo.setAttribute('aAlpha', new T.BufferAttribute(da, 1));
    var dustMat = new T.PointsMaterial({
      color: 0xffd49a, size: .025, sizeAttenuation: true, transparent: true,
      opacity: .5, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    var dust = new T.Points(dustGeo, dustMat);
    dust.renderOrder = 8;
    scene.add(dust);
    ext.dust = dust;

    /* wind leaves? just a few balcony petals */
    ext.petals = [];
    var petalGeom = new T.PlaneGeometry(.045, .08);
    for (var p = 0; p < 18; p++) {
      var petal = new T.Mesh(petalGeom, new T.MeshBasicMaterial({ color: 0xb87379, transparent: true, opacity: .6, side: T.DoubleSide, depthWrite: false }));
      petal.position.set(-4.4 + Math.random() * 1.3, 4.3 + Math.random() * 1.2, 1.0 + Math.random() * .4);
      petal.userData = { phase: Math.random() * 6.28, speed: .08 + Math.random() * .16, base: petal.position.clone(), drift: .2 + Math.random() * .4 };
      petal.renderOrder = 7;
      scene.add(petal);
      ext.petals.push(petal);
    }

    /* neon reflective light intensities */
    ext.neon = neon;
  };

  function neonFlicker(t) {
    var f = 0.94 + .045 * Math.sin(t * 27.0) + .025 * Math.sin(t * 13.7 + 1.2);
    var m = t % 12.4;
    if (m > 7.2 && m < 7.28) f *= .08;
    else if (m > 7.28 && m < 7.32) f *= .45;
    else if (m > 10.1 && m < 10.16) f *= .18;
    var s = t % 5.7;
    if (s > 3.1 && s < 3.145) f *= .36;
    return Math.max(f, .02);
  }
  function roundFlicker(t) {
    var f = .80 + .11 * Math.sin(t * 1.7) + .05 * Math.sin(t * 9.1);
    var m = t % 8.9;
    if (m > 4.1 && m < 4.15) f *= .22;
    return f;
  }

  QP.updateWorld = function (dt, t) {
    /* rain */
    if (ext.rain) {
      ext.rain.mat.uniforms.uTime.value = t;
      if (ext.rain.mat.uniforms.uNeonFactor) ext.rain.mat.uniforms.uNeonFactor.value = 1.0;
    }
    if (ext.ripples) ext.ripples.mat.uniforms.uTime.value = t;

    /* neon alternate flicker */
    var nf = neonFlicker(t);
    if (neon) {
      var p = 0.60 + nf * .55;
      for (var i = 0; i < neon.panelMats.length; i++) {
        neon.panelMats[i].color.setRGB(1.10 * p, 1.02 * p, 1.02 * p);
      }
      if (neon.tubeMats.length) {
        neon.tubeMats[0].color.copy(neon.tubeBases[0]).multiplyScalar(.35 + nf * .7);
        if (neon.tubeMats[1] && neon.tubeBases[1]) neon.tubeMats[1].color.copy(neon.tubeBases[1]).multiplyScalar(.55 + .45 * Math.sin(t * 2.1) * .5 + .22);
      }
      for (var s = 0; s < neon.sprites.length; s++) neon.sprites[s].mat.opacity = neon.sprites[s].base * (.55 + nf * .55);
      if (QP.neonRefs && QP.neonRefs.lights) {
        QP.neonRefs.lights[0].intensity = neon.lightBases[0] * (.35 + nf * .75);
        if (QP.neonRefs.lights[1]) QP.neonRefs.lights[1].intensity = neon.lightBases[1] * (.55 + .45 * Math.sin(t * 2.2));
      }
      var rf = roundFlicker(t);
      if (neon.roundMats) for (var rm = 0; rm < neon.roundMats.length; rm++) neon.roundMats[rm].color.setScalar(.6 + rf * .55);
      if (QP.neonRefs && QP.neonRefs.lights[2]) QP.neonRefs.lights[2].intensity = neon.roundLightBase * (.5 + rf * .6);
      for (var r = 0; r < reflMats.length; r++) {
        if (reflMats[r].flicker) reflMats[r].mat.uniforms.uFlicker.value = .25 + nf * .9;
      }
    }
    for (var k = 0; k < reflMats.length; k++) {
      reflMats[k].mat.uniforms.uTime.value = t;
    }

    /* rotating records */
    if (QP.anim && QP.anim.discs) {
      for (var d = 0; d < QP.anim.discs.length; d++) {
        var rec = QP.anim.discs[d];
        if (rec && rec.obj) rec.obj.rotation.y += dt * rec.speed;
      }
    }

    /* sheer curtains */
    if (QP.anim && QP.anim.curtains) {
      for (var c = 0; c < QP.anim.curtains.length; c++) {
        var cu = QP.anim.curtains[c];
        var geo = cu.mesh.geometry;
        var arr = geo.attributes.position.array;
        var base = cu.base;
        var gust = .8 + .2 * Math.sin(t * .27 + cu.phase);
        for (var vi = 0; vi < base.length; vi++) {
          var b = base[vi];
          var sway = Math.sin(b.u * 11.0 + t * (1.1 + cu.speed * .4) + cu.phase) * cu.amp * (.22 + b.v * .95);
          var ripple = Math.sin(b.v * 7.0 - t * .8 + b.u * 3.0) * cu.amp * .22;
          arr[vi * 3] = b.x + Math.sin(b.v * 3.2 + t * .6 + cu.phase) * cu.amp * .22 * b.v;
          arr[vi * 3 + 2] = b.z + (sway + ripple) * gust;
        }
        geo.attributes.position.needsUpdate = true;
        if ((c + Math.floor(t * 5)) % 3 === 0) geo.computeVertexNormals();
      }
    }

    /* pantograph sparks */
    if (ext.spark) {
      var st = ext.spark;
      if (st.ttl <= 0 && t > st.next) {
        st.ttl = st.max = .25 + Math.random() * .20;
        st.next = t + 5.0 + Math.random() * 7.5;
        st.group.visible = true;
        randomizeSpark();
      }
      if (st.ttl > 0) {
        st.ttl -= dt;
        randomizeSpark();
        st.flash.material.opacity = .55 + Math.random() * .35;
        st.line.material.opacity = .72 + Math.random() * .28;
        st.light.intensity = 7 + Math.random() * 12;
        st.flash.scale.setScalar(.9 + Math.random() * .7);
      } else {
        st.group.visible = false;
        st.light.intensity = 0;
      }
    }

    /* lamp and headlight atmosphere */
    if (QP.streetAnim) {
      if (QP.streetAnim.lamp && QP.streetAnim.lamp.light) {
        QP.streetAnim.lamp.light.intensity = 9.5 * (0.94 + .06 * Math.sin(t * 3.1));
      }
      if (QP.streetAnim.lampVol) QP.streetAnim.lampVol.uniforms.uTime.value = t;
      if (QP.streetAnim.headlightVol) QP.streetAnim.headlightVol.uniforms.uTime.value = t;
      if (QP.streetAnim.headlight) QP.streetAnim.headlight.intensity = 6.4 + .35 * Math.sin(t * 7.1);
      if (QP.streetAnim.headlightGlow) QP.streetAnim.headlightGlow.material.opacity = .75 + .08 * Math.sin(t * 4.2);
      if (QP.streetAnim.tramLight) QP.streetAnim.tramLight.intensity = 4.2 * (0.96 + .04 * Math.sin(t * 2.6));
    }

    /* dust motes */
    if (ext.dust) {
      ext.dust.position.y = Math.sin(t * .12) * .03;
      ext.dust.material.opacity = .35 + .12 * Math.sin(t * .9);
    }
    /* balcony petals drifting */
    if (ext.petals) {
      for (var pp = 0; pp < ext.petals.length; pp++) {
        var petal = ext.petals[pp], ud = petal.userData;
        var cyc = (t * ud.speed + ud.phase) % 6.283;
        petal.position.x = ud.base.x + Math.sin(cyc) * ud.drift;
        petal.position.y = ud.base.y + Math.cos(cyc * .7) * .05;
        petal.position.z = ud.base.z + Math.sin(cyc * .8 + 1.2) * ud.drift * .5;
        petal.rotation.x = cyc; petal.rotation.z = cyc * .7;
      }
    }
    /* low mist drifting */
    if (ext.mists) {
      for (var m = 0; m < ext.mists.length; m++) {
        var ms = ext.mists[m], mu = ms.userData;
        ms.position.x = mu.baseX + Math.sin(t * mu.speed + mu.phase) * mu.amp;
        ms.position.z = mu.baseZ + Math.cos(t * mu.speed * .7 + mu.phase) * mu.amp;
        ms.material.opacity = .035 + .018 * (0.5 + .5 * Math.sin(t * .3 + mu.phase));
      }
    }
    if (QP.mist && QP.mist.material.uniforms.uTime) QP.mist.material.uniforms.uTime.value = t;
    if (ext.rain) ext.rain.mat.uniforms.uTime.value = t;
  };
})();
