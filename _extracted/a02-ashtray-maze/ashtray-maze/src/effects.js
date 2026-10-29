/* =========================================================================
   ASHTRAY MAZE — atmosphere, steam, flicker, sound-ripples, searchlight
   ========================================================================= */
(function () {
  'use strict';
  var T = THREE;
  var AM = window.AM;
  var M, TEX, root;
  var dustMat, steamMat, smokeMat;
  var fixtureState = [];
  var searchPool = null;
  var soundNotes = [], soundRings = [], floorRipples = [];
  var papers = [];
  var hazeSprites = [];

  function makeCanvas(w, h) { return AM.canvas(w, h); }
  function canvasTex(c, opts) { return AM.tex(c, opts); }
  function shadowless(g) { g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); return g; }

  /* -----------------------------------------------------------------------
     textures for beams / soft light
     ----------------------------------------------------------------------- */
  function beamTexture() {
    var W = 256, H = 512;
    var c = makeCanvas(W, H), g = c.getContext('2d');
    var img = g.createImageData(W, H), d = img.data;
    for (var y = 0; y < H; y++) {
      var v = y / (H - 1);
      var env = Math.sin(Math.PI * Math.pow(v, .76));
      env *= smoothstep(0, .08, v) * (1 - smoothstep(.82, 1, v));
      for (var x = 0; x < W; x++) {
        var u = x / (W - 1);
        var edge = 1 - Math.pow(Math.abs(u - .5) * 2, 2.2);
        edge = Math.max(0, edge);
        var a = env * Math.pow(edge, 1.2);
        var i = (y * W + x) * 4;
        d[i] = 255; d[i + 1] = 248; d[i + 2] = 225;
        d[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
    var tx = canvasTex(c, { aniso: 2, srgb: false });
    tx.flipY = false;
    tx.needsUpdate = true;
    return tx;
  }
  function smoothstep(a, b, x) { var t = AM.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* -----------------------------------------------------------------------
     dust / motes
     ----------------------------------------------------------------------- */
  function buildDust() {
    var n = 300;
    var geo = new T.BufferGeometry();
    var positions = new Float32Array(n * 3);
    var phases = new Float32Array(n);
    var sizes = new Float32Array(n);
    var tints = new Float32Array(n);
    var rnd = AM.rng(901);
    for (var i = 0; i < n; i++) {
      positions[i * 3] = (rnd() - .5) * 17.0;
      positions[i * 3 + 1] = .2 + rnd() * 7.2;
      positions[i * 3 + 2] = (rnd() - .5) * 16.0;
      phases[i] = rnd();
      sizes[i] = .045 + Math.pow(rnd(), 2.6) * .18;
      tints[i] = rnd();
    }
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new T.BufferAttribute(phases, 1));
    geo.setAttribute('aSize', new T.BufferAttribute(sizes, 1));
    geo.setAttribute('aTint', new T.BufferAttribute(tints, 1));
    var mat = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 540 },
        uCool: { value: new T.Color(0x6f8274) },
        uWarm: { value: new T.Color(0xc59c6d) }
      },
      vertexShader: [
        'attribute float aPhase;',
        'attribute float aSize;',
        'attribute float aTint;',
        'uniform float uTime;',
        'uniform float uScale;',
        'varying float vAlpha;',
        'varying float vTint;',
        'void main(){',
        '  vec3 p = position;',
        '  p.x += sin(uTime * .07 + aPhase * 6.2831) * .65;',
        '  p.y += sin(uTime * .043 + aPhase * 8.3) * .28;',
        '  p.z += cos(uTime * .058 + aPhase * 5.1) * .52;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * (uScale / max(1.0, -mv.z));',
        '  gl_Position = projectionMatrix * mv;',
        '  vAlpha = (.35 + .65 * pow(.5 + .5 * sin(uTime * .8 + aPhase * 23.0), 3.0));',
        '  vTint = aTint;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vAlpha;',
        'varying float vTint;',
        'uniform vec3 uCool;',
        'uniform vec3 uWarm;',
        'void main(){',
        '  vec2 q = gl_PointCoord - .5;',
        '  float d = length(q) * 2.0;',
        '  float a = smoothstep(1.0, .12, d) * vAlpha;',
        '  vec3 col = mix(uCool, uWarm, vTint);',
        '  gl_FragColor = vec4(col, a * .34);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, depthTest: true,
      blending: T.AdditiveBlending
    });
    var pts = new T.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 8;
    root.add(pts);
    dustMat = mat;
  }

  /* -----------------------------------------------------------------------
     steam / smoke point system
     ----------------------------------------------------------------------- */
  function makeSteamSystem(o) {
    var n = o.particles.length;
    if (!n) return null;
    var geo = new T.BufferGeometry();
    var pos = new Float32Array(n * 3), drift = new Float32Array(n * 3);
    var seeds = new Float32Array(n), speeds = new Float32Array(n), sizes = new Float32Array(n), alphas = new Float32Array(n);
    var rnd = AM.rng(o.seed || 1);
    for (var i = 0; i < n; i++) {
      var p = o.particles[i];
      pos[i * 3] = p.position.x + (rnd() - .5) * (o.spread || .16);
      pos[i * 3 + 1] = p.position.y + (rnd() - .5) * .06;
      pos[i * 3 + 2] = p.position.z + (rnd() - .5) * (o.spread || .16);
      drift[i * 3] = p.drift.x + (rnd() - .5) * (o.driftJitter || .10);
      drift[i * 3 + 1] = p.drift.y + (o.rise || .70) + rnd() * .28;
      drift[i * 3 + 2] = p.drift.z + (rnd() - .5) * (o.driftJitter || .10);
      seeds[i] = rnd();
      speeds[i] = (o.speed || .14) * (.65 + rnd() * .7);
      sizes[i] = (o.size || .65) * (.65 + rnd() * .8);
      alphas[i] = (o.alpha || .22) * (.6 + rnd() * .8);
    }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aDrift', new T.BufferAttribute(drift, 3));
    geo.setAttribute('aSeed', new T.BufferAttribute(seeds, 1));
    geo.setAttribute('aSpeed', new T.BufferAttribute(speeds, 1));
    geo.setAttribute('aSize', new T.BufferAttribute(sizes, 1));
    geo.setAttribute('aAlpha', new T.BufferAttribute(alphas, 1));
    var mat = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: TEX.smoke },
        uScale: { value: 470 },
        uColor: { value: new T.Color(o.color === undefined ? 0xbac3b3 : o.color) }
      },
      vertexShader: [
        'attribute vec3 aDrift;',
        'attribute float aSeed;',
        'attribute float aSpeed;',
        'attribute float aSize;',
        'attribute float aAlpha;',
        'uniform float uTime;',
        'uniform float uScale;',
        'varying float vAlpha;',
        'void main(){',
        '  float life = fract(uTime * aSpeed + aSeed);',
        '  vec3 p = position + aDrift * life;',
        '  p.x += sin(aSeed * 31.0 + uTime * .5 + life * 4.0) * .10 * life;',
        '  p.z += cos(aSeed * 17.0 + uTime * .4 + life * 5.0) * .08 * life;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * (.45 + life * 2.15) * (uScale / max(1.0, -mv.z));',
        '  gl_Position = projectionMatrix * mv;',
        '  vAlpha = aAlpha * smoothstep(0.0, .10, life) * (1.0 - smoothstep(.64, 1.0, life));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap;',
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        'void main(){',
        '  vec4 t = texture2D(uMap, gl_PointCoord);',
        '  float a = t.a * vAlpha;',
        '  if(a < .005) discard;',
        '  gl_FragColor = vec4(uColor, a);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, depthTest: true,
      blending: o.blending === undefined ? T.NormalBlending : o.blending
    });
    var pts = new T.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 6;
    root.add(pts);
    return mat;
  }

  function buildSteam() {
    var emitters = AM.steamVents || [];
    if (emitters.length) {
      var puffs = [];
      for (var i = 0; i < 20; i++) {
        var e = emitters[i % emitters.length];
        puffs.push({ position: e.position.clone().add(new T.Vector3((i % 3 - 1) * .05, 0, (i % 2) * .04)), drift: e.drift.clone() });
      }
      steamMat = makeSteamSystem({
        particles: puffs, seed: 17, spread: .18, driftJitter: .08,
        rise: .75, speed: .085, size: .68, alpha: .26, color: 0xbfc8b8, blending: T.NormalBlending
      });
    }
    // thin ashtray smoke inside the observation room
    var smokeParticles = [];
    (AM.interiorSmoke || []).forEach(function (s) {
      for (var k = 0; k < 14; k++) {
        smokeParticles.push({ position: s.position.clone(), drift: new T.Vector3((AM.hash2(s.seed, k) - .5) * .22, .42, (AM.hash2(k, s.seed) - .5) * .22) });
      }
    });
    if (smokeParticles.length) {
      smokeMat = makeSteamSystem({
        particles: smokeParticles, seed: 93, spread: .05, driftJitter: .04,
        rise: .42, speed: .17, size: .28, alpha: .13, color: 0xd8d0bb, blending: T.NormalBlending
      });
    }
  }


  /* -----------------------------------------------------------------------
     strong, readable steam plumes (sprites), independent of the fine mist points
     ----------------------------------------------------------------------- */
  function makeSteamTexture() {
    var S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
    g.clearRect(0, 0, S, S);
    var rnd = AM.rng(184);
    for (var i = 0; i < 34; i++) {
      var a = rnd() * Math.PI * 2, rr = Math.pow(rnd(), .65) * S * .26;
      var cx = S * .5 + Math.cos(a) * rr, cy = S * .5 + Math.sin(a) * rr;
      var rad = S * (.10 + rnd() * .22);
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, 'rgba(255,255,250,' + (.09 + rnd() * .09) + ')');
      gr.addColorStop(.45, 'rgba(246,248,238,' + (.035 + rnd() * .05) + ')');
      gr.addColorStop(1, 'rgba(246,248,238,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    }
    // denser core
    var core = g.createRadialGradient(S * .5, S * .5, 2, S * .5, S * .5, S * .34);
    core.addColorStop(0, 'rgba(255,255,248,.30)');
    core.addColorStop(.55, 'rgba(247,248,236,.12)');
    core.addColorStop(1, 'rgba(247,248,236,0)');
    g.fillStyle = core; g.fillRect(0, 0, S, S);
    return canvasTex(c, { aniso: 4 });
  }

  function buildSteamPlumes() {
    var tex = makeSteamTexture();
    var plumes = [
      { p: new T.Vector3(1.45, .15, 5.9), n: 7, size: 1.35, life: .115, spread: .75, tint: 0xb9c5b7, drift: new T.Vector3(-.08, 1.6, -.05) },
      { p: new T.Vector3(4.35, .15, 5.1), n: 3, size: .72, life: .16, spread: .38, tint: 0xb0beb2, drift: new T.Vector3(-.10, 1.3, .02) },
      { p: new T.Vector3(-5.6, .52, 3.1), n: 3, size: .7, life: .13, spread: .32, tint: 0xb8c5b6, drift: new T.Vector3(.05, 1.2, .02) },
      { p: new T.Vector3(7.3, .38, 6.0), n: 2, size: .46, life: .11, spread: .1, tint: 0x9aa39a, drift: new T.Vector3(.02, .36, .01) }
    ];
    var out = [];
    for (var i = 0; i < plumes.length; i++) {
      var pl = plumes[i];
      for (var j = 0; j < pl.n; j++) {
        var mat = new T.SpriteMaterial({
          map: tex, color: pl.tint, transparent: true, opacity: 0,
          blending: T.NormalBlending, depthWrite: false, depthTest: true,
          toneMapped: false
        });
        var s = new T.Sprite(mat);
        s.position.copy(pl.p);
        s.renderOrder = 7;
        s.userData = {
          base: pl.p.clone(),
          phase: j / pl.n + AM.hash2(i, j) * .18,
          speed: pl.life * (.8 + AM.hash2(j, i) * .5),
          size: pl.size * (.65 + AM.hash2(i + 4, j) * .75),
          spreadX: (AM.hash2(i, j + 9) - .5) * pl.spread,
          spreadZ: (AM.hash2(j + 3, i + 2) - .5) * pl.spread,
          drift: pl.drift.clone(),
          tint: new T.Color(pl.tint),
          green: !!pl.green
        };
        root.add(s);
        out.push(s);
      }
    }
    AM.steamPlumes = out;
    return out;
  }

  function updateSteamPlumes(t) {
    var arr = AM.steamPlumes || [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i], d = s.userData;
      var u = AM.mod(t * d.speed + d.phase, 1);
      var env = Math.sin(Math.PI * u);
      s.position.set(
        d.base.x + d.spreadX * (u * 2.1) + Math.sin(t * .5 + d.phase * 9) * .08 * u,
        d.base.y + d.drift.y * u * 1.6,
        d.base.z + d.spreadZ * (u * 1.8) + Math.cos(t * .4 + d.phase * 7) * .06 * u
      );
      var sc = d.size * (.45 + u * 2.2);
      s.scale.set(sc, sc, 1);
      s.material.opacity = env * (d.green ? .20 : .155) * (1 - u * .3);
      s.material.rotation = Math.sin(t * .22 + d.phase * 5) * .25;
    }
  }

  var accentRoot = null;
  var warmAir = [];

  function buildColorAccents() {
    // soft pools and wall washes that make the fluorescent sources read in the air
    var portalWash = new T.Mesh(new T.PlaneGeometry(3.2, 2.4), new T.MeshBasicMaterial({
      map: TEX.glowGreen, color: 0x8ecb4d, transparent: true, opacity: .10,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false
    }));
    portalWash.position.set(-1.72, 2.35, 2.34); portalWash.renderOrder = 8; accentRoot.add(portalWash);
    var leftWash = new T.Mesh(new T.PlaneGeometry(3.2, 2.7), new T.MeshBasicMaterial({
      map: TEX.glowGreen, color: 0x84bc44, transparent: true, opacity: .08,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false
    }));
    leftWash.rotation.y = Math.PI * .5; leftWash.position.set(-5.60, 2.3, .72); leftWash.renderOrder = 8; accentRoot.add(leftWash);
    // warm glow above the observation room — light scatter into the black air
    for (var i = 0; i < 4; i++) {
      var mat = new T.SpriteMaterial({
        map: TEX.smoke, color: i < 2 ? 0x9a713e : 0x6f5d45, transparent: true,
        opacity: i < 2 ? .035 : .025, blending: T.AdditiveBlending,
        depthWrite: false, depthTest: true, toneMapped: false
      });
      var s = new T.Sprite(mat);
      s.position.set(-.5 + (i - 1.5) * 1.1, 4.6 + i * .3, -.4 + (i % 2) * .6);
      s.scale.set(7.5, 4.3, 1);
      s.userData = { baseO: mat.opacity, seed: i * 3.1, y: s.position.y };
      accentRoot.add(s); warmAir.push(s);
    }
    // a big cold halo above the left gantry to separate its silhouette
    var coolHalo = AM.sprite(accentRoot, TEX.glowGreen, 0x688d4b, 9.0, .045);
    coolHalo.position.set(-4.5, 5.0, -3.4);
    // a large warm floor pool at the entrance, brighter than the generic pool
    lightPool(-1.8, 3.0, 5.2, 3.5, 0xffa35d, .10, TEX.glowWarm, .014);
    lightPool(-4.7, 1.4, 4.2, 3.0, 0x9bc46a, .06, TEX.glowGreen, .014);
  }

  function updateColorAccents(t) {
    for (var i = 0; i < warmAir.length; i++) {
      var s = warmAir[i];
      s.position.y = s.userData.y + Math.sin(t * .08 + s.userData.seed) * .25;
      s.material.opacity = s.userData.baseO * (.75 + .25 * Math.sin(t * .17 + s.userData.seed));
    }
  }

  /* -----------------------------------------------------------------------
     pools of spilled light on the apron
     ----------------------------------------------------------------------- */
  function lightPool(x, z, sx, sz, color, opacity, tex, height) {
    var m = new T.MeshBasicMaterial({
      map: tex || TEX.glowWarm, color: color, transparent: true,
      opacity: opacity, blending: T.AdditiveBlending, depthWrite: false,
      side: T.DoubleSide, toneMapped: false
    });
    var p = new T.Mesh(new T.PlaneGeometry(sx, sz), m);
    p.rotation.x = -Math.PI * .5;
    p.position.set(x, height === undefined ? .012 : height, z);
    p.renderOrder = 7;
    root.add(p);
    return p;
  }

  function buildLightPools() {
    // warm spill through the observation glazing / door
    lightPool(-1.75, 3.55, 4.8, 3.0, 0xffa95e, .14);
    lightPool(1.15, 2.35, 3.4, 2.3, 0xffb46a, .09);
    // cold fluorescent line washing the entrance canopy / steps
    var cool = lightPool(.55, 2.7, 3.8, 2.0, 0xc8e18f, .065);
    cool.rotation.z = .0;
    // checkpoint red wash
    lightPool(5.9, 2.2, 2.0, 1.8, 0xff4c32, .055);
    // pylon / sign lamp
    lightPool(-5.0, 5.55, 2.6, 2.2, 0xffbc75, .055);
    // trench green
    lightPool(1.55, 5.82, 2.8, 1.7, 0xbecd81, .04);
    // a faint cool pool under the gantry on the back apron
    lightPool(-1.2, -3.9, 5.4, 2.2, 0xb5d37d, .07);
  }

  /* -----------------------------------------------------------------------
     lamp flicker / bloom refresh
     ----------------------------------------------------------------------- */
  function collectFixtures(arr, isInterior) {
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      var fx = arr[i];
      if (!fx || !fx.group || !fx.mats) continue;
      var halos = [];
      fx.group.traverse(function (o) {
        if (o.isSprite) halos.push({ obj: o, base: o.material.opacity });
      });
      var baseColors = fx.colors || (fx.color ? [new T.Color(fx.color), new T.Color(fx.color)] : [new T.Color(0xffffff), new T.Color(0xffffff)]);
      fixtureState.push({
        fx: fx, isInterior: !!isInterior, halos: halos,
        colors: baseColors.map(function (c) { return c.clone(); }),
        light: fx.light || null,
        baseLight: fx.light ? (fx.baseLightIntensity !== undefined ? fx.baseLightIntensity : fx.light.intensity) : 0,
        seed: fx.seed || i * 7 + 1,
        flicker: !!fx.flicker,
        baseColor: fx.color ? new T.Color(fx.color) : null
      });
    }
  }

  function flickerValue(seed, time, enabled) {
    if (!enabled) return .97 + .03 * Math.sin(time * 37 + seed);
    var period = 7.0 + (seed % 5) * 2.35;
    var u = AM.mod(time + seed * 1.37, period);
    var v = 1;
    if (u < .055) v = .04;
    else if (u < .095) v = .62;
    else if (u < .13) v = .10;
    else if (u < .17) v = .82;
    else if (u > period - .10) v = .32;
    v *= .975 + .025 * Math.sin(time * 51 + seed);
    return v;
  }

  function prepareFixtureEffects() {
    collectFixtures(AM.fixtures, false);
    collectFixtures(AM.interiorFixtures, true);
    // Hard, theatrical pools from the visible fixtures. These produce the
    // localized light hierarchy that the broad ambient fill cannot.
    var warmSpot = new T.SpotLight(0xffa35b, .70, 4.0, .46, .9, 1.6);
    warmSpot.position.set(-.94, 3.62, -.40);
    warmSpot.target.position.set(-.94, 1.0, -.40);
    warmSpot.castShadow = false;
    AM.scene.add(warmSpot); AM.scene.add(warmSpot.target);
    AM.lights.warmSpot = warmSpot;
    var greenSpot = new T.SpotLight(0xaada66, 2.8, 14.0, .72, .92, 1.5);
    greenSpot.position.set(-1.7, 5.0, .25);
    greenSpot.target.position.set(.6, 0, 2.8);
    greenSpot.castShadow = false;
    AM.scene.add(greenSpot); AM.scene.add(greenSpot.target);
    AM.lights.greenSpot = greenSpot;
    var doorSpot = new T.SpotLight(0xffb374, 1.5, 5.2, .78, .9, 1.8);
    doorSpot.position.set(-1.85, 2.95, 2.45);
    doorSpot.target.position.set(-1.7, 0.1, 3.3);
    doorSpot.castShadow = false;
    AM.scene.add(doorSpot); AM.scene.add(doorSpot.target);
    AM.lights.doorSpot = doorSpot;
  }

  function updateFixtureFlicker(t) {
    // The facade fixture is driven here rather than collected with the hanging tubes.
    for (var i = 0; i < fixtureState.length; i++) {
      var s = fixtureState[i];
      var v = flickerValue(s.seed, t, s.flicker);
      for (var m = 0; m < s.fx.mats.length; m++) {
        var base = s.colors[m % s.colors.length];
        s.fx.mats[m].color.copy(base).multiplyScalar(v);
      }
      if (s.light) s.light.intensity = s.baseLight * v;
      for (var h = 0; h < s.halos.length; h++) {
        s.halos[h].obj.material.opacity = s.halos[h].base * (0.15 + v * .85);
      }
    }
    // facade tube (the one under the rolling shutter)
    if (AM.facadeTube) {
      var fv = flickerValue(43, t, true);
      AM.facadeTube.color.setHex(0xd9eea1).multiplyScalar(fv * .92);
      if (AM.facadeTubeHalo) AM.facadeTubeHalo.material.opacity = .15 * (.2 + fv * .8);
      if (AM.facadeFillLight) AM.facadeFillLight.intensity = 1.15 * (.25 + fv * .75);
    }
    if (AM.alleyLight) AM.alleyLight.intensity = .8 * (.9 + .1 * Math.sin(t * 1.2));
    // primary worklight has a faint electrical breathing, never a full blackout
    if (AM.lights.warm) AM.lights.warm.intensity = .14 * (.965 + .035 * Math.sin(t * .9));
  }

  /* -----------------------------------------------------------------------
     searchlight beam (crossed additive light planes + projected pool)
     ----------------------------------------------------------------------- */
  function beamStrip(w0, w1, len) {
    var geo = new T.BufferGeometry();
    var pos = new Float32Array([
      -w0 * .5, 0, 0, w0 * .5, 0, 0,
      -w1 * .5, 0, len, w1 * .5, 0, len
    ]);
    var uv = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    geo.setIndex([0, 2, 1, 1, 2, 3]);
    geo.computeVertexNormals();
    return geo;
  }

  function buildSearchBeam() {
    if (!AM.searchlight) return;
    if (AM.searchlight.beam) AM.searchlight.beam.visible = false;
    var head = AM.searchlight.head;
    if (!head) return;
    var bt = beamTexture();
    var beamGroup = new T.Group();
    beamGroup.position.set(0, 0, .58);
    head.add(beamGroup);
    var mat = new T.MeshBasicMaterial({
      map: bt, color: 0xffe6bd, transparent: true, opacity: .065,
      blending: T.AdditiveBlending, side: T.DoubleSide,
      depthWrite: false, depthTest: true, toneMapped: false
    });
    for (var i = 0; i < 3; i++) {
      var plane = new T.Mesh(beamStrip(.10, 2.1, 15.5), mat);
      plane.rotation.z = i * Math.PI / 3;
      plane.renderOrder = 3;
      beamGroup.add(plane);
    }
    var innerMat = mat.clone(); innerMat.opacity = .028;
    var inner = new T.Mesh(beamStrip(.04, 1.15, 12.0), innerMat);
    inner.rotation.z = Math.PI / 6; beamGroup.add(inner);
    // source bloom
    var lens = AM.sprite(head, TEX.glowWarm, 0xffedc4, 1.8, .30);
    lens.position.z = .72;
    AM.searchBeam = { group: beamGroup, mat: mat, inner: innerMat };
    // projected pool under the beam. It moves with the head's sweep.
    searchPool = lightPool(0, 0, 5.0, 2.4, 0xffd49e, .10, TEX.glowWarm, .035);
    searchPool.visible = true;
  }

  function updateSearchPool() {
    if (!searchPool || !AM.searchlight || !AM.searchlight.head) return;
    var head = AM.searchlight.head;
    var p = new T.Vector3(); head.getWorldPosition(p);
    var q = new T.Quaternion(); head.getWorldQuaternion(q);
    var dir = new T.Vector3(0, 0, 1).applyQuaternion(q);
    if (dir.y < -.015) {
      var t = (0.02 - p.y) / dir.y;
      if (t > 0 && t < 30) {
        var hit = p.clone().addScaledVector(dir, t);
        searchPool.position.set(hit.x, .026, hit.z);
        searchPool.visible = Math.abs(hit.x) < 12 && Math.abs(hit.z) < 12;
      } else {
        searchPool.visible = false;
      }
    } else {
      searchPool.visible = false;
    }
  }

  /* -----------------------------------------------------------------------
     distant sound notes + rings + floor ripples
     ----------------------------------------------------------------------- */
  function buildSound() {
    var source = (AM.soundSource || new T.Vector3(-7.5, 5.9, -5.8)).clone();
    // four golden notes, each drifting upward from the dead speaker
    for (var i = 0; i < 5; i++) {
      var sm = new T.SpriteMaterial({
        map: TEX.note, color: i % 2 ? 0xffd493 : 0xd8e9a1,
        transparent: true, opacity: 0, blending: T.AdditiveBlending,
        depthWrite: false, depthTest: true, toneMapped: false
      });
      var s = new T.Sprite(sm);
      s.scale.set(.42, .42, 1);
      s.position.copy(source);
      s.renderOrder = 8;
      root.add(s);
      soundNotes.push({ sprite: s, material: sm, seed: i * 1.73 + .4, phase: i / 5 });
    }
    // expanding sound rings in the air around the dead speaker
    var ringMatBase = new T.MeshBasicMaterial({
      color: 0xd8df9e, transparent: true, opacity: .08,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide,
      toneMapped: false
    });
    for (var r = 0; r < 3; r++) {
      var rm = ringMatBase.clone();
      var ring = new T.Mesh(new T.TorusGeometry(1, .012, 4, 48), rm);
      ring.position.copy(source);
      ring.rotation.x = Math.PI * .5 + (r === 1 ? .6 : -.2);
      ring.rotation.z = r * 1.1;
      root.add(ring);
      soundRings.push({ mesh: ring, material: rm, phase: r / 3 });
    }
    // low-frequency floor ripples, almost imperceptible
    for (var f = 0; f < 2; f++) {
      var fm = new T.MeshBasicMaterial({
        color: f === 0 ? 0xbdd18b : 0x9bbf99, transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide,
        toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2
      });
      var fg = new T.Mesh(new T.RingGeometry(.955, 1.0, 64), fm);
      fg.rotation.x = -Math.PI * .5;
      fg.position.set(-.55, .035, -.55);
      fg.renderOrder = 6;
      root.add(fg);
      floorRipples.push({ mesh: fg, material: fm, phase: f * .47, speed: f === 0 ? .047 : .031 });
    }
  }

  function updateSound(t) {
    var source = (AM.soundSource || new T.Vector3(-7.5, 5.9, -5.8));
    for (var i = 0; i < soundNotes.length; i++) {
      var n = soundNotes[i];
      var u = AM.mod(t * .085 + n.phase, 1);
      var env = Math.sin(Math.PI * u);
      var angle = n.seed * 2.1 + t * .13;
      n.sprite.position.set(
        source.x + Math.cos(angle) * (.4 + u * 1.8),
        source.y + u * 2.9 + Math.sin(t * .8 + n.seed) * .06,
        source.z + Math.sin(angle) * (.4 + u * 1.4)
      );
      n.material.opacity = env * .32;
      var sz = .30 + env * .38;
      n.sprite.scale.set(sz, sz, 1);
      n.sprite.material.rotation = Math.sin(t * .4 + n.seed) * .22;
    }
    for (var r = 0; r < soundRings.length; r++) {
      var rr = soundRings[r];
      var u2 = AM.mod(t * .14 + rr.phase, 1);
      var sc = .25 + u2 * 2.7;
      rr.mesh.scale.setScalar(sc * .75);
      rr.mesh.position.y = source.y + u2 * .9;
      rr.material.opacity = Math.sin(Math.PI * u2) * .028;
    }
    for (var f = 0; f < floorRipples.length; f++) {
      var fr = floorRipples[f];
      var u3 = AM.mod(t * fr.speed + fr.phase, 1);
      var scale = 1.1 + u3 * 6.6;
      fr.mesh.scale.setScalar(scale);
      fr.material.opacity = Math.sin(Math.PI * u3) * .035;
    }
  }

  /* -----------------------------------------------------------------------
     atmospheric haze / drifting papers / floating bits
     ----------------------------------------------------------------------- */
  function buildHaze() {
    var hazeData = [
      { p: [-3.6, 2.2, -4.5], s: 9.0, c: 0x35514b, o: .030, sp: .004 },
      { p: [4.7, 3.0, 1.2], s: 8.0, c: 0x584432, o: .024, sp: -.003 },
      { p: [-5.5, 4.2, 1.0], s: 11.5, c: 0x3c554b, o: .026, sp: .0025 },
      { p: [2.0, 5.3, -5.5], s: 12.0, c: 0x2c4347, o: .022, sp: -.002 },
      { p: [0.0, 6.5, 2.5], s: 7.0, c: 0x4c4a36, o: .016, sp: .003 }
    ];
    for (var i = 0; i < hazeData.length; i++) {
      var d = hazeData[i];
      var m = new T.SpriteMaterial({
        map: TEX.smoke, color: d.c, transparent: true, opacity: d.o,
        blending: T.NormalBlending, depthWrite: false, depthTest: true,
        toneMapped: false
      });
      var s = new T.Sprite(m);
      s.scale.set(d.s, d.s * .55, 1);
      s.position.set(d.p[0], d.p[1], d.p[2]);
      s.userData.seed = i * 2.37;
      s.userData.baseY = d.p[1];
      s.userData.baseO = d.o;
      s.userData.sp = d.sp;
      root.add(s);
      hazeSprites.push(s);
    }
    // faint halo behind the machinery, like aurora caught in the dark
    var backGlow = AM.sprite(root, TEX.glowGreen, 0x4f6a4d, 22, .035);
    backGlow.position.set(-2.5, 4.2, -12.0);
    backGlow.userData.fixed = true;
  }

  function buildFloatingPapers() {
    var positions = [
      { p: [2.35, 2.15, 5.1], s: .17, seed: 2.1 },
      { p: [-3.55, 1.9, 6.2], s: .15, seed: 4.7 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var d = positions[i];
      var tx = TEX.papers[i % TEX.papers.length];
      var mat = new T.MeshBasicMaterial({ map: tx, transparent: true, opacity: .86, side: T.DoubleSide, toneMapped: false, depthWrite: true });
      var m = new T.Mesh(new T.PlaneGeometry(d.s, d.s * 1.38), mat);
      m.position.set(d.p[0], d.p[1], d.p[2]);
      m.userData.seed = d.seed;
      m.userData.base = new T.Vector3(d.p[0], d.p[1], d.p[2]);
      root.add(m);
      papers.push(m);
    }
  }

  function buildFloatingBits() {
    var rnd = AM.rng(211);
    for (var i = 0; i < 7; i++) {
      var geo = i % 3 === 0 ? new T.TetrahedronGeometry(.035 + rnd() * .03, 0) : new T.BoxGeometry(.045, .018, .09 + rnd() * .05);
      var col = i % 3 === 0 ? 0xd9d3ad : (i % 3 === 1 ? 0x7d8a68 : 0x2e3933);
      var mat = i % 3 === 0 ? AM.basic(col, { toneMapped: false }) : AM.toon(col, { rim: .2, rimColor: 0xa8c6a2, gradientMap: AM.gradHard });
      var o = new T.Mesh(geo, mat);
      o.userData = {
        center: new T.Vector3(2.6 + rnd() * 2.2, 3.4 + rnd() * 2.0, 1.2 + rnd() * 2.4),
        phase: rnd() * 6.283, radius: .4 + rnd() * .8, speed: .04 + rnd() * .06, bob: rnd() * 2
      };
      root.add(o);
      AM.glitchBits.push(o);
    }
  }

  /* -----------------------------------------------------------------------
     update
     ----------------------------------------------------------------------- */
  function updateEffects(dt, t) {
    if (dustMat) dustMat.uniforms.uTime.value = t;
    if (steamMat) steamMat.uniforms.uTime.value = t;
    if (smokeMat) smokeMat.uniforms.uTime.value = t;
    updateFixtureFlicker(t);
    if (AM.searchBeam) {
      var pulse = .9 + .1 * Math.sin(t * .55);
      AM.searchBeam.mat.opacity = .065 * pulse;
      AM.searchBeam.inner.opacity = .028 * pulse;
    }
    updateSearchPool();
    updateSteamPlumes(t);
    updateColorAccents(t);
    updateSound(t);
    for (var i = 0; i < hazeSprites.length; i++) {
      var s = hazeSprites[i];
      if (!s.userData.baseY) continue;
      s.position.y = s.userData.baseY + Math.sin(t * .06 + s.userData.seed) * .5;
      s.position.x = s.userData.baseX === undefined ? s.position.x : s.userData.baseX;
      s.material.opacity = s.userData.baseO * (.8 + .2 * Math.sin(t * .13 + s.userData.seed));
    }
    for (var p = 0; p < papers.length; p++) {
      var paper = papers[p];
      var sd = paper.userData.seed;
      var base = paper.userData.base;
      paper.position.x = base.x + Math.sin(t * .11 + sd) * .45;
      paper.position.y = base.y + Math.sin(t * .19 + sd * 1.7) * .28;
      paper.position.z = base.z + Math.cos(t * .09 + sd) * .35;
      paper.rotation.x = -.3 + Math.sin(t * .31 + sd) * .55;
      paper.rotation.y = Math.sin(t * .17 + sd) * .8;
      paper.rotation.z = Math.sin(t * .23 + sd) * .45;
      paper.material.opacity = .60 + .15 * (0.5 + 0.5 * Math.sin(t * .4 + sd));
    }
    for (var b = 0; b < AM.glitchBits.length; b++) {
      var bit = AM.glitchBits[b];
      var d = bit.userData;
      var a = d.phase + t * d.speed;
      bit.position.set(d.center.x + Math.cos(a) * d.radius, d.center.y + Math.sin(t * .33 + d.bob) * .22, d.center.z + Math.sin(a) * d.radius);
      bit.rotation.x = t * .21 + d.phase;
      bit.rotation.y = t * .17 + d.bob;
    }
  }

  AM.buildEffects = function (scene) {
    M = AM.mats; TEX = AM.TEX;
    root = new T.Group(); root.name = 'ATMOSPHERE_EFFECTS';
    scene.add(root);
    accentRoot = new T.Group(); scene.add(accentRoot);
    buildLightPools();
    buildColorAccents();
    buildDust();
    buildSteam();
    buildSteamPlumes();
    prepareFixtureEffects();
    buildSearchBeam();
    buildSound();
    buildHaze();
    buildFloatingPapers();
    buildFloatingBits();
    AM.addUpdater(updateEffects);
    AM.effectRoot = root;
    return root;
  };
})();
