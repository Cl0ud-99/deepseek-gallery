/* =========================================================================
   FBC QUARRY 07 — airborne motes, vent steam, ripples and beam embers
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE, Tex = FQ.Tex, L = FQ.L;
  var E = FQ.effects = {};
  var R = FQ.rng(0x5eedb);
  var updaters = [];
  var clocks = [];

  function makeDust(scene) {
    var N = 320;
    var pos = new Float32Array(N * 3);
    var seed = new Float32Array(N);
    var size = new Float32Array(N);
    var tint = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var a = R() * Math.PI * 2, rad = 2.2 + R() * 13.0;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = 3.3 + R() * 21.0;
      pos[i * 3 + 2] = Math.sin(a) * rad;
      seed[i] = R();
      size[i] = .6 + R() * 2.2;
      tint[i] = R();
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
    geo.setAttribute('aSize', new T.BufferAttribute(size, 1));
    geo.setAttribute('aTint', new T.BufferAttribute(tint, 1));
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uTex: { value: Tex.mote }, uPR: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
      vertexShader: [
        'attribute float aSeed; attribute float aSize; attribute float aTint;',
        'uniform float uTime; uniform float uPR;',
        'varying float vA; varying float vTint;',
        'void main(){',
        '  float age=fract(uTime*.018+aSeed*1.7);',
        '  float a=age*6.28318;',
        '  vec3 p=position;',
        '  p.y += age*9.0 - 4.5;',
        '  p.x += sin(a*2.3+aSeed*12.0)*.55 + age*.25;',
        '  p.z += cos(a*1.9+aSeed*9.0)*.5;',
        '  p.x += uTime*.035*(.2+aSeed*.3);',
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  gl_PointSize=clamp(aSize*(68.0/-mv.z)*uPR,1.0,11.0);',
        '  vA=sin(age*3.14159)*.42;',
        '  vTint=aTint;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex; varying float vA; varying float vTint;',
        'void main(){',
        '  vec4 tx=texture2D(uTex,gl_PointCoord);',
        '  vec3 warm=vec3(1.0,.45,.18); vec3 cool=vec3(.52,.76,.84);',
        '  vec3 c=mix(cool,warm,vTint*.75);',
        '  gl_FragColor=vec4(c,tx.a*vA);',
        '}'
      ].join('\n')
    });
    var pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    updaters.push(function (dt, t) { mat.uniforms.uTime.value = t; });
    return pts;
  }

  function makeBeamEmbers(scene) {
    var N = 110;
    var pos = [], seed = [], size = [];
    for (var i = 0; i < N; i++) {
      var a = R() * Math.PI * 2, r = .15 + R() * 1.15;
      pos.push(Math.cos(a) * r, -2.7 + R() * 10.6, Math.sin(a) * r + .2);
      seed.push(R()); size.push(.6 + R() * 1.8);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new T.Float32BufferAttribute(seed, 1));
    geo.setAttribute('aSize', new T.Float32BufferAttribute(size, 1));
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uTex: { value: Tex.spark }, uPR: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
      vertexShader: [
        'attribute float aSeed; attribute float aSize; uniform float uTime,uPR; varying float vA;',
        'void main(){',
        '  float age=fract(uTime*.055+aSeed);',
        '  vec3 p=position; p.y+=age*5.2;',
        '  float ang=aSeed*6.283+uTime*.2;',
        '  p.x+=sin(ang)*age*.3; p.z+=cos(ang*.8)*age*.25;',
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  gl_PointSize=clamp(aSize*(100.0/-mv.z)*uPR,1.0,10.0);',
        '  vA=sin(age*3.14159)*(.55+.45*sin(aSeed*99.0+uTime*8.0));',
        '}'
      ].join('\n'),
      fragmentShader: 'uniform sampler2D uTex; varying float vA; void main(){vec4 tx=texture2D(uTex,gl_PointCoord);vec3 c=mix(vec3(1.0,.26,.08),vec3(1.0,.84,.55),tx.r);gl_FragColor=vec4(c,tx.a*vA);}'
    });
    var pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    updaters.push(function (dt, t) { mat.uniforms.uTime.value = t; });
  }

  function makeSteam(scene) {
    var vents = (FQ.industry && FQ.industry.steamVents) || [];
    for (var v = 0; v < vents.length; v++) {
      var spec = vents[v];
      var N = Math.round(34 * (spec.size || 1));
      var seed = new Float32Array(N), size = new Float32Array(N), offset = new Float32Array(N * 3);
      for (var i = 0; i < N; i++) {
        seed[i] = R();
        size[i] = .6 + R() * 1.7;
        offset[i * 3] = (R() - .5) * .28;
        offset[i * 3 + 1] = (R() - .5) * .28;
        offset[i * 3 + 2] = (R() - .5) * .28;
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(offset, 3));
      geo.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
      geo.setAttribute('aSize', new T.BufferAttribute(size, 1));
      var mat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.NormalBlending,
        uniforms: {
          uTime: { value: 0 }, uTex: { value: Tex.smoke }, uOrigin: { value: spec.pos.clone() },
          uDir: { value: spec.dir.clone().normalize() }, uRate: { value: spec.rate || .8 },
          uDay: { value: new T.Color(spec.color || 0xbfd4d2) }, uPR: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
        },
        vertexShader: [
          'attribute float aSeed; attribute float aSize;',
          'uniform float uTime,uRate; uniform vec3 uOrigin,uDir; uniform float uPR;',
          'varying float vA; varying vec2 vUv; varying float vRot;',
          'void main(){',
          '  float age=fract(uTime*uRate*.16+aSeed*1.37);',
          '  vec3 p=position;',
          '  p += uDir*(age*age*2.4);',
          '  p.x += sin(age*8.0+aSeed*20.0)*.28*age;',
          '  p.z += cos(age*6.0+aSeed*17.0)*.24*age;',
          '  p += uOrigin;',
          '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
          '  gl_Position=projectionMatrix*mv;',
          '  gl_PointSize=clamp(aSize*(.55+age*1.35)*(185.0/-mv.z)*uPR,2.0,64.0);',
          '  vA=smoothstep(0.0,.12,age)*(1.0-smoothstep(.55,1.0,age))*.48;',
          '  vUv=vec2(uv.x,1.0-uv.y);',
          '  vRot=aSeed*6.283+age*1.7;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform sampler2D uTex; uniform vec3 uDay; varying float vA; varying vec2 vUv; varying float vRot;',
          'void main(){',
          '  vec2 uv=gl_PointCoord-.5; float c=cos(vRot),s=sin(vRot); uv=mat2(c,-s,s,c)*uv+.5;',
          '  vec4 tx=texture2D(uTex,uv);',
          '  gl_FragColor=vec4(uDay*1.15,tx.a*vA);',
          '}'
        ].join('\n')
      });
      var pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 7; scene.add(pts);
      (function (m) { updaters.push(function (dt, t) { m.uniforms.uTime.value = t; }); })(mat);
    }
  }

  function makeRipples(scene) {
    var data = [];
    // plateau puddles
    var puddleSpots = [
      [-4.8, L.plateauY + .025, 8.75, 1.35], [8.15, L.plateauY + .025, 7.5, .95],
      [7.1, L.plateauY + .025, -2.9, 1.2]
    ];
    for (var p = 0; p < puddleSpots.length; p++) {
      for (var k = 0; k < 2; k++) {
        var spot = puddleSpots[p];
        var mat = new T.MeshBasicMaterial({ color: p % 2 ? 0xacc8c9 : 0xd1b290, transparent: true, opacity: .2, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false });
        var geo = new T.RingGeometry(.82, .94, 40);
        var m = new T.Mesh(geo, mat); m.rotation.x = -Math.PI / 2;
        m.position.set(spot[0] + (k - .5) * .23, spot[1], spot[2] + (k === 0 ? .1 : -.12));
        m.scale.setScalar(.2); scene.add(m);
        data.push({ mesh: m, mat: mat, base: .5 + R() * .9, speed: .23 + R() * .12, phase: R(), max: spot[3] });
      }
    }
    // water pool
    for (var w = 0; w < 4; w++) {
      var wm = new T.Mesh(new T.RingGeometry(.82, .94, 48), new T.MeshBasicMaterial({ color: 0x8db3b2, transparent: true, opacity: .16, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
      wm.rotation.x = -Math.PI / 2; wm.position.set(-2.8 + w * .85, FQ.base.pit.waterY + .012, .2 + (w % 2) * 2.3);
      wm.scale.setScalar(.2); scene.add(wm);
      wm.material.opacity = .24;
      data.push({ mesh: wm, mat: wm.material, base: .5 + R(), speed: .2 + R() * .1, phase: R(), max: 1.8 });
    }
    updaters.push(function (dt, t) {
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var cycle = (t * d.speed + d.phase) % 1;
        var sc = .15 + cycle * d.max;
        d.mesh.scale.set(sc, sc, sc);
        d.mat.opacity = (1 - cycle) * .26;
      }
    });
  }

  function makeGroundFog(scene) {
    var g = new T.Group(); g.position.set(0, L.plateauY + .35, 0); scene.add(g);
    var mat = new T.SpriteMaterial({ map: Tex.smoke, color: 0x678087, transparent: true, opacity: .05, depthWrite: false, blending: T.NormalBlending });
    for (var i = 0; i < 4; i++) {
      var s = new T.Sprite(mat); s.scale.set(6.5, 2.2, 1);
      s.position.set(-4.0 + i * 2.7, 1.1 + (i % 2) * .6, -2.5 + i * 1.4);
      g.add(s);
    }
    updaters.push(function (dt, t) {
      g.position.x = Math.sin(t * .025) * .4;
    });
  }

  function makeAtmosphere(scene) {
    var g = new T.Group(); scene.add(g);
    var haloA = FQ.sprite(g, Tex.glow, 0xff5634, 34, .032); haloA.position.set(0, 15, -30);
    var haloB = FQ.sprite(g, Tex.glow, 0x2a6d80, 40, .035); haloB.position.set(-25, 9, -15);
    var haloC = FQ.sprite(g, Tex.glow, 0x4c1a2b, 36, .024); haloC.position.set(28, 8, 10);
    var under = FQ.sprite(scene, Tex.glow, 0x25120f, 44, .08); under.position.set(0, -4.6, 0);
    updaters.push(function (dt, t) {
      haloA.material.opacity = .045 + Math.sin(t * .08) * .012;
      haloB.material.opacity = .035 + Math.cos(t * .06) * .008;
      under.position.x = Math.sin(t * .02) * 1.2;
    });
  }

  E.build = function (scene) {
    makeAtmosphere(scene);
    makeDust(scene);
    makeBeamEmbers(scene);
    makeSteam(scene);
    makeRipples(scene);
    makeGroundFog(scene);
    FQ.updaters.push(function (dt, t) { for (var i = 0; i < updaters.length; i++) updaters[i](dt, t); });
    return E;
  };
})();
