/* =========================================================
   effects.js — rain, wet ground, mist, life & flicker
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C, L = TP.L;
  var FX = TP.FX = TP.FX || {};
  var TAU = Math.PI * 2;
  TP.anim = TP.anim || {};
  TP.anim.curtains = TP.anim.curtains || [];
  TP.anim.steam = TP.anim.steam || [];
  TP.anim.tapes = TP.anim.tapes || [];
  var refls = [], puddles = [], mists = [], motes = null;

  /* rain ------------------------------------------------------- */
  function buildRain() {
    var N = 3200;
    var positions = new Float32Array(N * 2 * 3);
    var tails = new Float32Array(N * 2);
    var speeds = new Float32Array(N * 2);
    var lens = new Float32Array(N * 2);
    var alphas = new Float32Array(N * 2);
    var r = TP.rng(9021);
    for (var i = 0; i < N; i++) {
      var x = -18 + r() * 36;
      var z = -18 + r() * 36;
      var y = r() * 15;
      var speed = 6.2 + r() * 6.0;
      var len = .24 + r() * .60;
      var alpha = .22 + r() * .62;
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
    geo.boundingSphere = new T.Sphere(new T.Vector3(0, 7, 0), 50);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      blending: T.AdditiveBlending, toneMapped: false,
      uniforms: {
        uTime: { value: 0 }, uOpacity: { value: .36 },
        uRoom: { value: new T.Vector3(0, 4.4, -.8) },
        uLamp: { value: new T.Vector3(7.9, 4.6, 5.9) }
      },
      vertexShader: [
        'uniform float uTime; uniform float uOpacity;',
        'uniform vec3 uRoom; uniform vec3 uLamp;',
        'attribute float aTail; attribute float aSpeed; attribute float aLen; attribute float aAlpha;',
        'varying float vAlpha; varying vec3 vColor;',
        'void main(){',
        ' float h=15.0;',
        ' float fall=mod(position.y - uTime*aSpeed, h);',
        ' vec3 p=vec3(position.x, fall, position.z);',
        ' p.y += aTail*aLen;',
        ' p.x += aTail*aLen*.13 + (15.0-fall)*.018;',
        ' p.z += aTail*aLen*.045;',
        ' float dR=distance(p,uRoom);',
        ' float dL=distance(p,uLamp);',
        ' float warm=smoothstep(6.8,.4,dR)*.9 + smoothstep(6.0,.2,dL)*.5;',
        ' float fade=smoothstep(0.0,.35,fall)*(1.0-smoothstep(14.2,15.0,fall));',
        ' float trail=aTail>.5?.22:1.0;',
        ' vAlpha=uOpacity*fade*trail*aAlpha*(.34+warm);',
        ' vColor=mix(vec3(.34,.48,.57),vec3(1.0,.66,.38),clamp(warm,0.0,1.0));',
        ' vColor+=vec3(.15,.045,.02)*clamp(warm,0.0,1.0);',
        ' gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: 'varying float vAlpha; varying vec3 vColor; void main(){ if(vAlpha<.002) discard; gl_FragColor=vec4(vColor,vAlpha); }'
    });
    var lines = new T.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 8;
    lines.name = 'rain';
    TP.scene.add(lines);
    FX.rain = { object: lines, mat: mat };
  }

  /* slow leaf drips ------------------------------------------- */
  function buildDrips() {
    var N = 100;
    var pos = new Float32Array(N * 2 * 3);
    var tail = new Float32Array(N * 2);
    var speed = new Float32Array(N * 2);
    var baseY = new Float32Array(N * 2);
    var alpha = new Float32Array(N * 2);
    var phases = new Float32Array(N * 2);
    var r = TP.rng(7621);
    var clusters = TP.Forest.leafClusters || [];
    for (var i = 0; i < N; i++) {
      var c = clusters.length ? clusters[(r() * clusters.length) | 0] : null;
      var x = c ? c.p.x + (r() - .5) * 1.2 : (r() - .5) * 12;
      var z = c ? c.p.z + (r() - .5) * 1.2 : (r() - .5) * 12;
      var start = c ? c.p.y + .1 : 4 + r() * 4;
      var sp = 1.2 + r() * 1.5;
      var a = .25 + r() * .6;
      for (var j = 0; j < 2; j++) {
        var k = i * 2 + j;
        pos[k * 3] = x; pos[k * 3 + 1] = start; pos[k * 3 + 2] = z;
        tail[k] = j; speed[k] = sp; baseY[k] = start; alpha[k] = a; phases[k] = r() * start;
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aTail', new T.BufferAttribute(tail, 1));
    geo.setAttribute('aSpeed', new T.BufferAttribute(speed, 1));
    geo.setAttribute('aStart', new T.BufferAttribute(baseY, 1));
    geo.setAttribute('aAlpha', new T.BufferAttribute(alpha, 1));
    geo.setAttribute('aPhase', new T.BufferAttribute(phases, 1));
    geo.boundingSphere = new T.Sphere(new T.Vector3(0, 5, 0), 30);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: [
        'uniform float uTime; attribute float aTail; attribute float aSpeed; attribute float aStart; attribute float aAlpha; attribute float aPhase;',
        'varying float vA; varying vec3 vC;',
        'void main(){',
        ' float fall = mod(uTime*aSpeed + aPhase, aStart);',
        ' vec3 p = vec3(position.x, aStart - fall, position.z);',
        ' p.y += aTail*(.18+aSpeed*.08);',
        ' p.x += aTail*.018;',
        ' vA = smoothstep(0.0, .25, fall) * (1.0-smoothstep(aStart*.82,aStart,fall)) * aAlpha * .50;',
        ' vC = mix(vec3(.62,.76,.78), vec3(.82,.96,.85), .25);',
        ' gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: 'varying float vA; varying vec3 vC; void main(){ if(vA<.003) discard; gl_FragColor=vec4(vC,vA); }'
    });
    var lines = new T.LineSegments(geo, mat);
    lines.frustumCulled = false; lines.renderOrder = 7;
    TP.scene.add(lines);
    FX.drips = { object: lines, mat: mat };
  }

  /* rain ripples on wet floor --------------------------------- */
  function roadDistanceSq(x, z) {
    var best = 1e9;
    for (var i = 0; i <= 70; i++) {
      var p = TP.Ground.roadCurve.getPoint(i / 70);
      var d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
      if (d < best) best = d;
    }
    return best;
  }
  function buildRipples() {
    var N = 170;
    var verts = [], uvs = [], centers = [], phases = [], speeds = [], sizes = [];
    var r = TP.rng(7117);
    for (var i = 0; i < N; i++) {
      var x, z, y;
      if (i < 100) {
        // on the asphalt
        var t = r();
        var p = TP.Ground.roadCurve.getPoint(t);
        var tan = TP.Ground.roadCurve.getTangent(t);
        var sx = tan.z, sz = -tan.x;
        var sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
        x = p.x + sx * (r() - .5) * 3.4;
        z = p.z + sz * (r() - .5) * 3.4;
        y = L.roadY + .013;
      } else {
        x = (r() - .5) * 21.8;
        z = (r() - .5) * 21.8;
        // exclude the room
        if (x > -5.6 && x < 5.6 && z > -5.4 && z < 4.5) { i--; continue; }
        var dRoad = roadDistanceSq(x, z);
        y = dRoad < 2.6 ? L.roadY + .014 : L.groundY + .017;
      }
      var size = .13 + r() * .42;
      var quad = [[-.5, 0, -.5, 0, 0], [.5, 0, -.5, 1, 0], [.5, 0, .5, 1, 1], [-.5, 0, .5, 0, 1]];
      for (var q = 0; q < 4; q++) {
        verts.push(quad[q][0], quad[q][1], quad[q][2]);
        uvs.push(quad[q][3], quad[q][4]);
        centers.push(x, y, z);
        phases.push(r());
        speeds.push(.26 + r() * .40);
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
    geo.boundingSphere = new T.Sphere(new T.Vector3(0, 0, 0), 30);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: .26 }, uColor: { value: new T.Color(0xbfdce0) } },
      vertexShader: [
        'uniform float uTime;',
        'attribute vec3 aCenter; attribute float aPhase; attribute float aSpeed; attribute float aSize;',
        'varying vec2 vUv; varying float vAge;',
        'void main(){',
        ' float age=fract(uTime*aSpeed+aPhase);',
        ' vAge=age; vUv=uv;',
        ' vec3 p=aCenter+position*aSize;',
        ' p.y+=sin(age*3.14159)*.010;',
        ' gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv; varying float vAge;',
        'uniform float uOpacity; uniform vec3 uColor;',
        'void main(){',
        ' vec2 p=vUv*2.0-1.0; float d=length(p);',
        ' float ring=smoothstep(.10,.0,abs(d-(.05+vAge*.82)));',
        ' float second=smoothstep(.06,.0,abs(d-(.12+vAge*.60)))*.35;',
        ' float fade=(1.0-vAge)*smoothstep(1.0,.2,d);',
        ' gl_FragColor=vec4(uColor, (ring+second)*fade*uOpacity);',
        '}'
      ].join('\n')
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 6;
    TP.scene.add(mesh);
    FX.ripples = { object: mesh, mat: mat };
  }

  /* puddles ---------------------------------------------------- */
  function puddleMaterial(oil, tint) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      blending: T.NormalBlending, toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new T.Color(oil ? 0x030505 : 0x050b0c) },
        uTint: { value: new T.Color(tint === undefined ? 0xff8d5f : tint) },
        uOil: { value: oil ? 1 : 0 },
        uAlpha: { value: oil ? .96 : .82 }
      },
      vertexShader: 'varying vec2 vUv; uniform float uTime; void main(){ vUv=uv; vec3 p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime, uOil, uAlpha;',
        'uniform vec3 uDeep, uTint;',
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
        ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
        ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
        'void main(){',
        ' vec2 p=vUv*2.0-1.0;',
        ' float r=length(p*vec2(1.0,1.18));',
        ' float edge=smoothstep(1.02,.76,r);',
        ' float n=noise(p*4.2+uTime*.02)*.5+noise(p*9.0-uTime*.015)*.3;',
        ' vec3 col=uDeep + vec3(.006,.009,.011)*(n-.5);',
        ' // broad wet mirror sheen, stronger toward the wet rim',
        ' float rim=smoothstep(.15,.95,r);',
        ' col += vec3(.03,.045,.045)*rim*.4;',
        ' // rain rings: concentric rings spreading outward',
        ' for(int i=0;i<3;i++){',
        '  float fi=float(i);',
        '  float age=fract(uTime*(.27+fi*.05) + fi*.31 + hash(p*4.0+fi)*.3);',
        '  float rad=age*(.75+fi*.08);',
        '  float ring=smoothstep(.016,.0,abs(r-rad)) * (1.0-age);',
        '  col += vec3(.20,.27,.28)*ring*.22;',
        ' }',
        ' // warm reflection band (red room / lamp) broken into vertical streaks',
        ' float bands=.5+.5*sin(vUv.y*22.0+sin(vUv.x*8.0+uTime*.9)*2.0);',
        ' float streak=smoothstep(.32,1.0,bands)*smoothstep(.18,.9,vUv.y)*smoothstep(1.0,.35,abs(vUv.x-.48));',
        ' col += uTint*streak*.20;',
        ' // oil film iridescence',
        ' if(uOil>.5){',
        '  float film=sin(p.x*7.0+p.y*8.0+uTime*.23)+sin(p.x*13.0-p.y*4.0-uTime*.13);',
        '  vec3 iri=.5+.5*cos(vec3(0.0,2.1,4.2)+film*.9);',
        '  col += iri*.12*smoothstep(.2,.8,r);',
        '  // inverse / contracting rings',
        '  for(int j=0;j<3;j++){',
        '   float fj=float(j);',
        '   float age=fract(uTime*.12 + fj*.36);',
        '   float rad=(1.0-age)*(.86-fj*.12);',
        '   float ring=smoothstep(.018,.0,abs(r-rad))*(.3+.5*age);',
        '   col += mix(vec3(.20,.29,.20),uTint*.66,age)*ring*.62;',
        '  }',
        ' }',
        ' float alpha=edge*uAlpha;',
        ' gl_FragColor=vec4(col,alpha);',
        '}'
      ].join('\n')
    });
  }

  function makePuddle(x, z, rx, rz, y, seed, oil, tint) {
    var geo = TP.irregularDisc(1, seed, 46, [rx, rz], 0);
    var mat = puddleMaterial(oil, tint);
    var mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = 0;
    mesh.position.set(x, y, z);
    mesh.renderOrder = 2;
    mesh.receiveShadow = false;
    TP.scene.add(mesh);
    puddles.push(mat);
    return mesh;
  }

  /* additive reflection streaks ------------------------------- */
  function reflMat(a, b, intensity, speed, flicker) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide,
      blending: T.AdditiveBlending, toneMapped: false,
      uniforms: {
        uTime: { value: 0 }, uColorA: { value: new T.Color(a) }, uColorB: { value: new T.Color(b) },
        uIntensity: { value: intensity }, uSpeed: { value: speed === undefined ? 1 : speed },
        uFlicker: { value: 1.0 }, uFlickerOn: { value: flicker ? 1 : 0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime, uIntensity, uSpeed, uFlicker, uFlickerOn;',
        'uniform vec3 uColorA, uColorB;',
        'void main(){',
        ' vec2 p=vUv-.5;',
        ' float radial=smoothstep(.58,.06,length(p*vec2(1.04,1.46)));',
        ' float wav=sin(vUv.y*23.0-uTime*(1.1+uSpeed)+sin(vUv.x*10.0+uTime*.6)*3.3);',
        ' float streak=pow(.5+.5*wav,2.3);',
        ' float fine=.58+.42*sin(vUv.y*77.0-uTime*2.2+sin(vUv.x*19.0)*1.4);',
        ' float breakup=.46+.34*sin(vUv.x*31.0+uTime*.9);',
        ' vec3 col=mix(uColorA,uColorB,.5+.5*sin(vUv.x*5.5+uTime*.25));',
        ' float a=radial*streak*fine*max(breakup,0.0)*uIntensity*1.35;',
        ' a*=mix(1.0,uFlicker,uFlickerOn);',
        ' gl_FragColor=vec4(col,a);',
        '}'
      ].join('\n')
    });
  }
  function addRefl(x, z, w, d, a, b, intensity, speed, flicker, ry, y) {
    var m = reflMat(a, b, intensity, speed, flicker);
    var mesh = new T.Mesh(new T.PlaneGeometry(w, d), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = ry || 0;
    mesh.position.set(x, y === undefined ? L.roadY + .025 : y, z);
    mesh.renderOrder = 5;
    TP.scene.add(mesh);
    refls.push({ mat: m, base: intensity, flicker: !!flicker });
    return mesh;
  }

  function buildPuddlesAndReflections() {
    // red room spill on the clearing
    makePuddle(-.35, 5.35, 2.55, 1.02, L.groundY + .022, 41, false, 0xff7449);
    makePuddle(2.9, 8.75, 2.1, .64, L.roadY + .02, 73, false, 0xff8b58);
    makePuddle(-5.35, 8.05, 1.28, .70, L.groundY + .024, 17, false, 0xffa25a);
    makePuddle(9.95, 2.0, 1.0, 2.0, L.roadY + .02, 22, false, 0x86a7a8);
    makePuddle(-7.8, 6.35, .8, 1.6, L.pathY + .02, 55, false, 0x9a5e4e);
    // black oil puddles with inverse rings
    makePuddle(6.40, 4.18, 1.48, .91, L.groundY + .03, 9, true, 0xc95343);
    makePuddle(4.05, 6.35, 1.18, .64, L.groundY + .032, 64, true, 0xc25b4b);
    // red room light on wet asphalt and forest floor
    addRefl(-.2, 6.0, 9.2, 4.2, 0xff5f3b, 0xffc274, .46, .8, true, .04, L.groundY + .027);
    addRefl(.5, 8.25, 6.2, 3.7, 0xff743d, 0xffdf9d, .35, .9, true, -.1, L.roadY + .038);
    addRefl(4.0, 6.35, 2.5, 1.6, 0xff6d42, 0xb77a4d, .20, .75, true, .15, L.groundY + .034);
    addRefl(1.6, 7.6, 4.0, 1.6, 0x526f6b, 0xc0d3c8, .10, .4, false, 0, L.roadY + .032);
    addRefl(-5.15, 7.65, 3.4, 2.4, 0xffca86, 0xfff0cc, .30, .65, false, .15, L.groundY + .028);
    addRefl(-6.95, 6.95, 2.4, 2.2, 0xffc37c, 0xffe9be, .20, .8, false, -.2, L.groundY + .03);
    addRefl(2.9, 8.85, 4.4, 2.0, 0x7f9e9b, 0xc9e3d9, .12, .45, false, 0, L.roadY + .032);
    addRefl(-7.6, 5.7, 2.2, 2.0, 0xff6c45, 0xffb374, .12, .6, true, .2, L.pathY + .035);
    // little red glints at the mouth of the corridor
    addRefl(0, 4.8, 2.2, 1.3, 0xff4433, 0xffb067, .13, 1.2, false, 0, L.groundY + .03);
  }

  /* mist ------------------------------------------------------- */
  function buildMist() {
    var tex = TP.Tex.smoke();
    var r = TP.rng(338);
    for (var i = 0; i < 24; i++) {
      var m = new T.Sprite(new T.SpriteMaterial({
        map: tex, color: i % 4 === 0 ? 0x9aada5 : 0x7c9692, transparent: true,
        opacity: .12 + r() * .12, depthWrite: false, blending: T.NormalBlending, toneMapped: false
      }));
      var a = r() * TAU;
      var rad = 5.5 + r() * 6.3;
      m.scale.set(7 + r() * 10, 3.2 + r() * 4.2, 1);
      m.position.set(Math.cos(a) * rad, .35 + r() * 3.9, -.8 + Math.sin(a) * rad);
      m.userData = { baseX: m.position.x, baseZ: m.position.z, phase: r() * 6.28, amp: .35 + r() * 1.1, speed: .035 + r() * .06, baseOp: m.material.opacity };
      m.renderOrder = 3;
      TP.scene.add(m);
      mists.push(m);
    }
    // low fog banks drifting between the trunks
    for (var j = 0; j < 8; j++) {
      var lb = new T.Sprite(new T.SpriteMaterial({
        map: tex, color: 0xa9c0b6, transparent: true, opacity: .075 + (j % 3) * .018,
        depthWrite: false, blending: T.NormalBlending, toneMapped: false
      }));
      var la = j / 8 * TAU + .17;
      lb.scale.set(6.5 + (j % 4) * 1.6, 2.1 + (j % 2) * .9, 1);
      lb.position.set(Math.cos(la) * (7.2 + (j % 3) * 1.1), 1.0 + (j % 4) * .45, -.8 + Math.sin(la) * (7.2 + (j % 3) * 1.1));
      lb.userData = { baseX: lb.position.x, baseZ: lb.position.z, phase: j * .9, amp: .35 + (j % 3) * .2, baseOp: lb.material.opacity };
      lb.renderOrder = 3;
      TP.scene.add(lb);
      mists.push(lb);
    }
    // a low fog that hangs in the road corner
    for (var j = 0; j < 5; j++) {
      var mm = new T.Sprite(new T.SpriteMaterial({
        map: tex, color: 0xb4cac0, transparent: true, opacity: .145,
        depthWrite: false, blending: T.NormalBlending, toneMapped: false
      }));
      mm.scale.set(9 + j * 1.8, 3.2 + j * .4, 1);
      mm.position.set(2 + Math.cos(j * 1.2) * 6.2, 1.1 + j * .2, 6.6 + Math.sin(j * 1.2) * 2.0);
      mm.material.opacity = .10;
      mm.userData = { baseX: mm.position.x, baseZ: mm.position.z, phase: j * 1.4, amp: .4 + j * .16, speed: .03 + j * .007, baseOp: .10 };
      mm.renderOrder = 3;
      TP.scene.add(mm);
      mists.push(mm);
    }
  }

  /* atmosphere ------------------------------------------------- */
  function buildHaze() {
    var tex = TP.Tex.smoke();
    var colors = [0x94aaa2, 0x7f9a95, 0xa0b4ad];
    for (var i = 0; i < 12; i++) {
      var s = new T.Sprite(new T.SpriteMaterial({
        map: tex, color: colors[i % colors.length], transparent: true,
        opacity: .045 + (i % 4) * .012, depthWrite: false,
        blending: T.NormalBlending, toneMapped: false
      }));
      var a = i / 12 * TAU + .3;
      s.scale.set(15 + (i % 3) * 4, 7 + (i % 2) * 3, 1);
      s.position.set(Math.cos(a) * 14, 3.5 + (i % 4) * 1.3, -.8 + Math.sin(a) * 14);
      s.userData = { baseX: s.position.x, baseZ: s.position.z, phase: i * .8, amp: .3 + (i % 3) * .2, baseOp: s.material.opacity };
      s.scale.multiplyScalar(.9);
      s.renderOrder = 2;
      TP.scene.add(s);
      mists.push(s);
    }
    // soft pool of ground mist under the plinth
    var plane = new T.Mesh(new T.PlaneGeometry(38, 31), new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uColor: { value: new T.Color(0x3b565b) }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'varying vec2 vUv; uniform vec3 uColor; uniform float uTime;',
        'void main(){ vec2 p=vUv-.5; float r=length(p*vec2(1.0,1.23));',
        ' float a=exp(-r*5.4)*.32; a*=smoothstep(.0,.23,sin(p.x*19.0+uTime*.035)*.5+.5);',
        ' gl_FragColor=vec4(uColor,a); }'
      ].join('\n')
    }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = -1.86; plane.renderOrder = 1;
    TP.scene.add(plane);
    FX.underGlow = plane;
  }

  /* drifting ring mist ---------------------------------------- */
  var fogRings = [];
  function buildFogRings() {
    var commonVS = 'varying vec3 vWorld; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWorld=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }';
    var commonFS = [
      'varying vec3 vWorld;',
      'uniform float uTime; uniform float uOpacity; uniform vec3 uColor;',
      'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
      'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
      ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
      ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
      'void main(){',
      ' vec2 p=vWorld.xz;',
      ' float n=noise(p*.28+vec2(uTime*.012,-uTime*.008))*0.55 + noise(p*.68+vec2(-uTime*.007,uTime*.005))*0.30 + noise(p*1.55+vec2(uTime*.018,0.))*0.15;',
      ' float r=length(vec2(vWorld.x, vWorld.z+.8));',
      ' float edge=smoothstep(6.4,7.4,r)*(1.0-smoothstep(11.4,12.7,r));',
      ' float wisps=smoothstep(.40,.78,n);',
      ' gl_FragColor=vec4(uColor, wisps*edge*uOpacity);',
      '}'
    ].join('\n');
    function ring(y, op, speed, col) {
      var geo = new T.RingGeometry(6.2, 12.6, 96, 1);
      geo.rotateX(-Math.PI / 2);
      var mat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: true,
        blending: T.NormalBlending, side: T.DoubleSide, toneMapped: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: op }, uColor: { value: new T.Color(col) } },
        vertexShader: commonVS, fragmentShader: commonFS
      });
      var m = new T.Mesh(geo, mat);
      m.position.y = y;
      m.renderOrder = 3;
      TP.scene.add(m);
      fogRings.push({ mesh: m, mat: mat, speed: speed, base: op });
    }
    ring(.62, .15, 1, 0xa8bdb4);
    ring(1.65, .09, .6, 0x91aaa5);
    ring(2.9, .05, .4, 0x9db6b0);
  }

  /* dust & motes ---------------------------------------------- */
  function buildMotes() {
    var glowTex = TP.Tex.glow();
    // interior gold motes
    var N = 150;
    var innerMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uMap: { value: glowTex }, uColor: { value: new T.Color(0xffd39b) } },
      vertexShader: [
        'uniform float uTime; attribute float aPhase; attribute float aSize; attribute vec3 aBase;',
        'varying float vA;',
        'void main(){',
        ' vec3 p=aBase;',
        ' p.y += sin(uTime*.25+aPhase)*.28; p.x += sin(uTime*.17+aPhase*1.7)*.16; p.z += cos(uTime*.19+aPhase)*.16;',
        ' vec4 mv=modelViewMatrix*vec4(p,1.0);',
        ' gl_PointSize=aSize*(320.0/max(1.0,-mv.z));',
        ' vA=.40+.35*sin(uTime*.55+aPhase*2.0);',
        ' gl_Position=projectionMatrix*mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap; uniform vec3 uColor; varying float vA;',
        'void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(uColor,t.a*vA); }'
      ].join('\n')
    });
    var pos = new Float32Array(N * 3), phase = new Float32Array(N), sizes = new Float32Array(N);
    var r = TP.rng(635);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = -.2 + (r() - .5) * 8.4;
      pos[i * 3 + 1] = 1.2 + r() * 5.8;
      pos[i * 3 + 2] = -.8 + (r() - .5) * 6.3;
      phase[i] = r() * 6.28;
      sizes[i] = .018 + r() * .055;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('aBase', new T.BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new T.BufferAttribute(phase, 1));
    g.setAttribute('aSize', new T.BufferAttribute(sizes, 1));
    var points = new T.Points(g, innerMat);
    points.frustumCulled = false; points.renderOrder = 9;
    TP.scene.add(points);
    FX.innerMotes = innerMat;

    // exterior cool wisps
    var N2 = 80;
    var mat2 = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uMap: { value: glowTex }, uColor: { value: new T.Color(0x92c7b2) } },
      vertexShader: [
        'uniform float uTime; attribute float aPhase; attribute float aSize; attribute vec3 aBase;',
        'varying float vA;',
        'void main(){ vec3 p=aBase; p.y+=sin(uTime*.13+aPhase)*.45; p.x+=sin(uTime*.1+aPhase)*.35; vec4 mv=modelViewMatrix*vec4(p,1.);',
        ' gl_PointSize=aSize*(300.0/max(1.0,-mv.z)); vA=.22+.2*sin(uTime*.4+aPhase*2.1); gl_Position=projectionMatrix*mv; }'
      ].join('\n'),
      fragmentShader: 'uniform sampler2D uMap; uniform vec3 uColor; varying float vA; void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(uColor,t.a*vA); }'
    });
    var p2 = new Float32Array(N2 * 3), ph2 = new Float32Array(N2), sz2 = new Float32Array(N2);
    for (var j = 0; j < N2; j++) {
      var a = r() * TAU, rad = 7.8 + r() * 3.8;
      p2[j * 3] = Math.cos(a) * rad;
      p2[j * 3 + 1] = .4 + r() * 4.8;
      p2[j * 3 + 2] = -.8 + Math.sin(a) * rad;
      ph2[j] = r() * 6.28;
      sz2[j] = .022 + r() * .06;
    }
    var g2 = new T.BufferGeometry();
    g2.setAttribute('position', new T.BufferAttribute(p2, 3));
    g2.setAttribute('aBase', new T.BufferAttribute(p2, 3));
    g2.setAttribute('aPhase', new T.BufferAttribute(ph2, 1));
    g2.setAttribute('aSize', new T.BufferAttribute(sz2, 1));
    var pts2 = new T.Points(g2, mat2);
    pts2.frustumCulled = false; pts2.renderOrder = 8;
    TP.scene.add(pts2);
    FX.outerMotes = mat2;
  }

  /* build all -------------------------------------------------- */
  FX.build = function (scene) {
    buildRain();
    buildDrips();
    buildRipples();
    buildPuddlesAndReflections();
    buildMist();
    buildHaze();
    buildFogRings();
    buildMotes();
  };

  /* main per-frame update ------------------------------------- */
  var tmpColor = new T.Color();
  FX.update = function (dt, t) {
    // rain & drips
    if (FX.rain) {
      FX.rain.mat.uniforms.uTime.value = t;
      if (TP.Props.streetLamp) {
        var wp = TP.Props.streetLamp.lanternPos;
        FX.rain.mat.uniforms.uLamp.value.copy(wp);
      }
      if (TP.Room && TP.Room.lights) {
        FX.rain.mat.uniforms.uRoom.value.set(0, 4.2, -.6);
      }
    }
    if (FX.drips) FX.drips.mat.uniforms.uTime.value = t;
    if (FX.ripples) FX.ripples.mat.uniforms.uTime.value = t;
    for (var p = 0; p < puddles.length; p++) puddles[p].uniforms.uTime.value = t;

    // floor lamp current flicker
    var lamp = TP.Furniture.lamp;
    var flick = .93 + .045 * Math.sin(t * 13.7) + .026 * Math.sin(t * 7.1 + .8) + .018 * Math.sin(t * 33.9 + 1.7);
    var mm = t % 11.3;
    if (mm > 7.9 && mm < 8.02) flick *= .38;
    else if (mm > 8.02 && mm < 8.07) flick *= .72;
    else if (mm > 4.2 && mm < 4.25) flick *= .64;
    if (mm > 9.1 && mm < 9.16) flick *= .86;
    if (lamp) {
      lamp.light.intensity = lamp.baseIntensity * (.75 + flick * .33);
      lamp.spot.intensity = lamp.baseSpot * (.65 + flick * .36);
      lamp.shadeMat.emissiveIntensity = .18 + flick * .25;
      lamp.glow.material.opacity = .34 + flick * .20;
      lamp.bulbMat.color.setRGB(2.5 * flick, 1.32 * flick, .46 * flick);
    }
    var room = TP.Room;
    if (room && room.floorPool) {
      room.floorPool.material.opacity = .22 + flick * .08;
    }
    if (room && room.roomHalo) room.roomHalo.material.opacity = .16 + flick * .06;
    if (TP.Furniture.lampHalo) TP.Furniture.lampHalo.material.opacity = .15 + flick * .08;
    // global reflections
    for (var r = 0; r < refls.length; r++) {
      refls[r].mat.uniforms.uTime.value = t;
      if (refls[r].flicker) refls[r].mat.uniforms.uFlicker.value = .55 + flick * .5;
    }

    // tape flutter
    for (var ti = 0; ti < TP.anim.tapes.length; ti++) {
      var tape = TP.anim.tapes[ti];
      var geo = tape.mesh.geometry, arr = geo.attributes.position.array, base = tape.base;
      for (var vi = 0; vi < arr.length / 3; vi++) {
        var v = base[vi * 3 + 1];
        var u = vi % 2;
        var wave = Math.sin(t * .9 + vi * .33 + tape.phase) * .018 + Math.sin(t * 1.7 + vi * .7) * .006;
        arr[vi * 3] = base[vi * 3] + wave * (.6 + (vi % 4) * .1);
        arr[vi * 3 + 2] = base[vi * 3 + 2] + wave * .45;
        arr[vi * 3 + 1] = base[vi * 3 + 1] + Math.sin(t * .8 + vi * .5) * .012;
      }
      geo.attributes.position.needsUpdate = true;
    }

    // curtains — slow motion with no wind
    for (var ci = 0; ci < TP.anim.curtains.length; ci++) {
      var cu = TP.anim.curtains[ci];
      var g = cu.geo, pos = g.attributes.position, arr = pos.array, base = cu.base;
      var gust = .82 + .18 * Math.sin(t * .28 + cu.phase);
      for (var i = 0; i < arr.length / 3; i++) {
        var bx = base[i * 5], by = base[i * 5 + 1], bz = base[i * 5 + 2], u = base[i * 5 + 3], v = base[i * 5 + 4];
        var w = Math.pow(1 - v, 1.35);
        var s1 = Math.sin(t * .55 + cu.phase + u * 4.2 + v * 1.5);
        var s2 = Math.sin(t * .32 + cu.phase * 1.3 + u * 8.6 - v * 2.1);
        var sway = (s1 * .68 + s2 * .32) * cu.amp * w * 2.3 * gust;
        arr[i * 3] = bx + sway * .68 + Math.sin(t * .22 + v * 4.0 + cu.phase) * cu.amp * .28 * w;
        arr[i * 3 + 1] = by + s2 * cu.amp * .12 * w;
        arr[i * 3 + 2] = bz + sway;
      }
      pos.needsUpdate = true;
      // occasional cheap normals only for the foreground curtains
      if ((ci + Math.floor(t * 3)) % 7 === 0) g.computeVertexNormals();
    }

    // steam over coffee
    for (var st = 0; st < TP.anim.steam.length; st++) {
      var steam = TP.anim.steam[st];
      var cyc = (t * .25 + steam.phase * .17) % 1;
      steam.sprite.position.x = steam.base.x + Math.sin(t * .8 + steam.phase) * .035;
      steam.sprite.position.y = steam.base.y + cyc * .55;
      steam.sprite.position.z = steam.base.z + Math.cos(t * .7 + steam.phase) * .03;
      steam.sprite.material.opacity = Math.sin(cyc * Math.PI) * .18;
      var sc = .25 + cyc * .26;
      steam.sprite.scale.set(sc, sc * 1.6, 1);
    }
    if (TP.Furniture.coffeeLiquid) TP.Furniture.coffeeLiquid.uniforms.uTime.value = t;

    // owl eyes
    var owl = TP.Forest.owl;
    if (owl) {
      if (t > owl.nextFlash) {
        owl.flashT = .36;
        owl.nextFlash = t + 5.0 + Math.random() * 8.5;
      }
      if (owl.flashT > 0) {
        owl.flashT -= dt;
        var f = Math.max(0, Math.min(1, owl.flashT / .36));
        owl.level += (Math.sin(f * Math.PI) * 1.0 - owl.level) * .28;
      } else {
        owl.level += (0 - owl.level) * .06;
      }
      var level = owl.level;
      owl.eyeMat.color.setRGB(.22 + level * 4.8, .10 + level * 2.4, .02 + level * .52);
      for (var e = 0; e < owl.eyes.length; e++) {
        owl.eyes[e].halo.material.opacity = level * .62;
        owl.eyes[e].halo.scale.setScalar(.42 + level * .22);
      }
    }

    // clock second hand occasional stutter + pendulum
    var clock = TP.Furniture.clock;
    if (clock) {
      var tick = Math.floor(t * .8) % 60;
      var handAngle = -((37 + tick) % 60) / 60 * TAU;
      clock.second.rotation.z = handAngle;
      clock.pendulum.rotation.z = Math.sin(t * .9) * .045;
    }

    // Saturn floating
    var sat = TP.Furniture.saturn;
    if (sat) {
      sat.group.rotation.y = t * .11;
      sat.group.position.y = sat.baseY + Math.sin(t * .47) * .07;
      sat.glow.material.opacity = .19 + .045 * Math.sin(t * .9 + 1.4);
    }

    // candle flame
    if (TP.Props.candleFlame) {
      var cf = 1 + Math.sin(t * 16.3) * .14 + Math.sin(t * 7.7) * .08;
      TP.Props.candleFlame.scale.set(1 / cf, cf, 1 / cf);
      TP.Props.candleFlame.material.color.setRGB(3.2 + cf * .8, 1.5 + cf * .4, .3);
    }
    // owl cave glyph glow
    if (TP.Props.owlGlowMat) TP.Props.owlGlowMat.opacity = .10 + .06 * Math.sin(t * 1.1) + .02 * Math.sin(t * 3.4);

    // drifting mist
    for (var mi = 0; mi < mists.length; mi++) {
      var m = mists[mi], ud = m.userData;
      m.position.x = ud.baseX + Math.sin(t * ud.speed + ud.phase) * ud.amp;
      m.position.z = ud.baseZ + Math.cos(t * ud.speed * .7 + ud.phase) * ud.amp * .8;
      m.material.opacity = ud.baseOp * (.8 + .2 * Math.sin(t * .23 + ud.phase));
    }
    if (TP.lowMist && TP.lowMist.material.uniforms) TP.lowMist.material.uniforms.uTime.value = t;
    if (FX.underGlow && FX.underGlow.material.uniforms.uTime) FX.underGlow.material.uniforms.uTime.value = t;
    if (TP.sky && TP.sky.material.uniforms) TP.sky.material.uniforms.uTime.value = t;

    // drifting ring mist
    for (var fr = 0; fr < fogRings.length; fr++) {
      fogRings[fr].mat.uniforms.uTime.value = t * fogRings[fr].speed;
      fogRings[fr].mat.uniforms.uOpacity.value = fogRings[fr].base * (.82 + .18 * Math.sin(t * .17 + fr));
    }
    // dust
    if (FX.innerMotes) FX.innerMotes.uniforms.uTime.value = t;
    if (FX.outerMotes) FX.outerMotes.uniforms.uTime.value = t;

    // street lamp shaft shimmer
    if (TP.Props.streetLamp) {
      TP.Props.streetLamp.shaftMat.uniforms.uTime.value = t;
      TP.Props.streetLamp.shaftMat.uniforms.uColor.value.setHex(0xffb167);
    }
  };
})();
