/* =========================================================================
   FBC QUARRY 07 — square plinth, stepped quarry, rock faces and black water
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE, Tex = FQ.Tex, PAL = FQ.PAL;
  var L = FQ.L;
  var Base = FQ.base = {};
  var rng = FQ.rng(0x51a7e);

  var mats = {};

  function cloneMap(map, rx, ry, rot) {
    var t = map.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
    if (rot) { t.center.set(.5, .5); t.rotation = rot; }
    return t;
  }

  function makeMaterials() {
    mats.deck = FQ.toon(0x899390, {
      map: cloneMap(Tex.deck, 2.3, 2.3),
      bumpMap: cloneMap(Tex.deck, 2.3, 2.3), bumpScale: .028,
      gradientMap: FQ.gradSoft
    });
    mats.deckSide = FQ.toon(0xa8a59a, {
      map: cloneMap(Tex.concrete, 1.3, .7), bumpMap: cloneMap(Tex.concrete, 1.3, .7), bumpScale: .03
    });
    mats.concrete = FQ.toon(0x9fa6a0, {
      map: cloneMap(Tex.concrete, 2.2, 1.2), bumpMap: cloneMap(Tex.concrete, 2.2, 1.2), bumpScale: .026
    });
    mats.concreteDark = FQ.toon(0x6d746e, {
      map: cloneMap(Tex.concreteDark, 2.2, 1.1), bumpMap: cloneMap(Tex.concreteDark, 2.2, 1.1), bumpScale: .03
    });
    mats.rock = FQ.toon(0xb8af9d, {
      map: cloneMap(Tex.rock, 1.2, 1.2), bumpMap: cloneMap(Tex.rock, 1.2, 1.2), bumpScale: .09,
      gradientMap: FQ.gradHard
    });
    mats.rockSide = FQ.toon(0xaaa190, {
      map: cloneMap(Tex.rock, 2.0, .85), bumpMap: cloneMap(Tex.rock, 2.0, .85), bumpScale: .075,
      gradientMap: FQ.gradHard
    });
    mats.rockDark = FQ.toon(0x6d6b61, {
      map: cloneMap(Tex.rockDark, 1.5, 1.1), bumpMap: cloneMap(Tex.rockDark, 1.5, 1.1), bumpScale: .07,
      gradientMap: FQ.gradHard
    });
    mats.gravel = FQ.toon(0x91958e, {
      map: cloneMap(Tex.deck, 1.5, 1.5), bumpMap: cloneMap(Tex.deck, 1.5, 1.5), bumpScale: .025,
      gradientMap: FQ.gradSoft
    });
    mats.rust = FQ.toon(0x9a7053, {
      map: cloneMap(Tex.rust, 1.5, .8), bumpMap: cloneMap(Tex.rust, 1.5, .8), bumpScale: .03
    });
    mats.steel = FQ.steel(0x3f494b, .35);
    mats.steelDark = FQ.iron(0x151b1d, .47);
    mats.brass = FQ.brass(PAL.brass, .3);
    mats.hazard = FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 2, .25), bumpMap: cloneMap(Tex.hazard, 2, .25), bumpScale: .012 });
    mats.grate = FQ.std(0x252d2d, { map: cloneMap(Tex.grate, 1.8, 1), metalness: .4, roughness: .54, bumpMap: cloneMap(Tex.grate, 1.8, 1), bumpScale: .025 });
    mats.darkWater = FQ.std(0x0a1112, { metalness: .4, roughness: .18, envMapIntensity: 1.3 });
    mats.pale = FQ.toon(0xd2cec0, { map: cloneMap(Tex.concreteCool || Tex.concrete, 1.6, 1) });
  }

  Base.pit = {
    cx: 0.0, cz: 0.0,
    ox: 7.1, oz: 6.8,
    levels: [
      { yTop: 0.82, yBot: -0.58, hx: 7.1, hz: 6.8 },
      { yTop: -0.58, yBot: -1.82, hx: 5.8, hz: 5.5 },
      { yTop: -1.82, yBot: -3.10, hx: 4.62, hz: 4.32 }
    ],
    floorY: -3.18,
    waterY: -2.91
  };

  function ringGeometry(hxOut, hzOut, hxIn, hzIn, depth) {
    var s = new T.Shape();
    s.moveTo(-hxOut, -hzOut); s.lineTo(hxOut, -hzOut); s.lineTo(hxOut, hzOut); s.lineTo(-hxOut, hzOut); s.closePath();
    var hole = new T.Path();
    hole.moveTo(-hxIn, -hzIn); hole.lineTo(-hxIn, hzIn); hole.lineTo(hxIn, hzIn); hole.lineTo(hxIn, -hzIn); hole.closePath();
    s.holes.push(hole);
    var geo = new T.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  function makeRing(hxOut, hzOut, hxIn, hzIn, top, depth, matTop, matSide, outline) {
    var geo = ringGeometry(hxOut, hzOut, hxIn, hzIn, depth);
    var m = new T.Mesh(geo, [matTop, matSide || matTop]);
    m.position.y = top - depth;
    m.receiveShadow = true; m.castShadow = false;
    if (outline) FQ.outline(m, .0023);
    return m;
  }

  function jaggedWall(cx, cz, hx, hz, yTop, yBot, kind, mat, seed) {
    var r = FQ.rng(seed || 0x9911);
    var N = 26, rows = 4;
    var pos = [], uv = [], ind = [];
    var spanX = hx * 2, spanZ = hz * 2;
    for (var row = 0; row <= rows; row++) {
      var v = row / rows;
      var y = FQ.lerp(yTop, yBot, v);
      for (var i = 0; i <= N; i++) {
        var u = i / N;
        var amp = 0.09 + r() * 0.2;
        var x, z;
        if (kind === 'back' || kind === 'front') {
          x = cx - hx + u * spanX + (i === 0 || i === N ? 0 : (r() - .5) * .26);
          z = cz + (kind === 'back' ? -hz : hz);
          z += kind === 'back' ? (0.04 + r() * amp) : -(0.04 + r() * amp);
          y += (row === 0 || row === rows ? 0 : (r() - .5) * .22);
        } else {
          z = cz - hz + u * spanZ + (i === 0 || i === N ? 0 : (r() - .5) * .26);
          x = cx + (kind === 'left' ? -hx : hx);
          x += kind === 'left' ? (0.04 + r() * amp) : -(0.04 + r() * amp);
          y += (row === 0 || row === rows ? 0 : (r() - .5) * .22);
        }
        pos.push(x, y, z);
        uv.push(u * (kind === 'back' || kind === 'front' ? 2.4 : 2.2), v * 1.5);
      }
    }
    for (var rr = 0; rr < rows; rr++) {
      for (var ii = 0; ii < N; ii++) {
        var a = rr * (N + 1) + ii, b = a + 1, c = a + N + 1, d = c + 1;
        ind.push(a, c, b, b, c, d);
      }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(ind);
    geo.computeVertexNormals();
    var m = new T.Mesh(geo, mat.clone());
    m.material.side = T.DoubleSide;
    m.receiveShadow = true; m.castShadow = true;
    return m;
  }

  function buildPit(scene) {
    var p = Base.pit;
    // giant top deck slab with a hole
    var deck = makeRing(11.7, 11.7, p.ox, p.oz, L.plateauY, 1.24, mats.deck, mats.deckSide, true);
    deck.name = 'quarry-deck'; scene.add(deck); Base.deck = deck;

    // The inner rim wear strip: black steel lip and yellow paint fragments.
    var lipMat = FQ.iron(0x1c2324, .4);
    var rims = [
      { w: p.ox * 2 + .28, h: .09, d: .16, x: 0, z: -p.oz },
      { w: p.ox * 2 + .28, h: .09, d: .16, x: 0, z: p.oz },
      { w: .16, h: .09, d: p.oz * 2 + .28, x: -p.ox, z: 0 },
      { w: .16, h: .09, d: p.oz * 2 + .28, x: p.ox, z: 0 }
    ];
    for (var i = 0; i < rims.length; i++) {
      var rr = rims[i];
      var lip = FQ.box(rr.w, rr.h, rr.d, lipMat, false);
      lip.position.set(rr.x, L.plateauY + .015, rr.z); scene.add(lip);
    }

    // Scorched / wet gravel collar around the opening.
    var collarMat = FQ.toon(0x737b76, {
      map: cloneMap(Tex.deck, 3.1, .6), bumpMap: cloneMap(Tex.deck, 3.1, .6), bumpScale: .02
    });
    var collars = [
      [p.ox * 2 + 1.5, .025, .7, 0, -.43, p.oz + .27],
      [p.ox * 2 + 1.5, .025, .55, 0, -.43, -p.oz - .24],
      [.58, .025, p.oz * 2 + 1.1, p.ox + .24, -.43, 0],
      [.58, .025, p.oz * 2 + 1.1, -p.ox - .24, -.43, 0]
    ];
    for (var c = 0; c < collars.length; c++) {
      var cd = collars[c];
      var strip = FQ.box(cd[0], cd[1], cd[2], collarMat, false);
      strip.position.set(cd[3], L.plateauY + .006, cd[5]); scene.add(strip);
    }

    // Three rock benches, each stepped inward and down.
    for (var lv = 0; lv < p.levels.length; lv++) {
      var level = p.levels[lv];
      var next = p.levels[lv + 1];
      // ledge inside this level
      if (next) {
        var innerHx = next.hx, innerHz = next.hz;
        var ledge = makeRing(level.hx + .02, level.hz + .02, innerHx, innerHz, level.yTop, .30, mats.gravel, mats.concreteDark, true);
        ledge.position.x = p.cx; ledge.position.z = p.cz; scene.add(ledge);
        Base['ledge' + lv] = ledge;
      }
      // vertical rock walls around this bench
      var walls = ['back', 'front', 'left', 'right'];
      for (var w = 0; w < walls.length; w++) {
        var kind = walls[w];
        var wm = jaggedWall(p.cx, p.cz, level.hx, level.hz, level.yTop, level.yBot, kind, (lv === 1 ? mats.rock : mats.rockDark), 911 + lv * 73 + w * 17);
        scene.add(wm);
      }
      // dark recess line where the wall meets its ledge
      if (next) {
        var recess = makeRing(level.hx + .04, level.hz + .04, level.hx - .04, level.hz - .04, level.yTop + .005, .025, mats.steelDark, mats.steelDark, false);
        recess.position.x = p.cx; recess.position.z = p.cz; scene.add(recess);
      }
    }

    // Water / wet floor at the bottom.
    var floor = FQ.box(p.levels[2].hx * 2 + .3, .22, p.levels[2].hz * 2 + .3, FQ.toon(0x3d403b, {
      map: cloneMap(Tex.deck, 1.2, 1.2), bumpMap: cloneMap(Tex.deck, 1.2, 1.2), bumpScale: .03,
      gradientMap: FQ.gradHard
    }), false);
    floor.position.set(p.cx, p.floorY - .11, p.cz); floor.receiveShadow = true; scene.add(floor);
    Base.pitFloor = floor;

    buildPool(scene);

    // broken concrete retaining buttresses and rusty ribs hug the left wall.
    buildPitStructure(scene);

    // Rubble across the benches.
    scatterRubble(scene);

    // safety rail around the upper rim (segments, leaving industrial gaps)
    buildRimRail(scene);

    // drainage channel from the pit rim to the front edge
    buildDrain(scene);

    // puddles on the plateau
    buildPlateauPuddles(scene);
  }

  function buildPool(scene) {
    var p = Base.pit;
    var geo = new T.PlaneGeometry(8.5, 7.6, 1, 1);
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new T.Vector2(.5, .5) },
        uDeep: { value: new T.Color(0x041216) },
        uCool: { value: new T.Color(0x285862) },
        uWarm: { value: new T.Color(0xcc5b39) }
      },
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vW;',
        'uniform float uTime; uniform vec2 uCenter; uniform vec3 uDeep,uCool,uWarm;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
        'void main(){',
        ' vec2 p=vUv;',
        ' float edge=min(min(p.x,1.-p.x),min(p.y,1.-p.y));',
        ' if(edge<0.028) discard;',
        ' vec2 q=p*vec2(4.,3.55);',
        ' float n=noise(q*2.4+vec2(uTime*.015,-uTime*.011))*.6+noise(q*7.1-vec2(uTime*.02,0.))*.25;',
        ' float shore=smoothstep(.055,.02,edge);',
        ' float rip=0.0;',
        ' for(int i=0;i<3;i++){',
        '  vec2 c=vec2(.32+.16*float(i), .43+.12*sin(float(i)*2.3));',
        '  float d=length(q-c);',
        '  float age=fract(uTime*.12+float(i)*.31);',
        '  float rad=age*2.6;',
        '  rip+=sin((d-rad)*38.0)*exp(-abs(d-rad)*4.0)*exp(-age*2.2)*.5;',
        ' }',
        ' vec3 col=mix(uDeep,uCool,.32+n*.38);',
        ' vec2 rp=vec2(p.x-.49,p.y-.52);',
        ' float red=exp(-abs(rp.x)*9.0)*exp(-abs(rp.y)*1.25)*(.55+.45*sin(uTime*.8+uTime*.31));',
        ' col=mix(col,uWarm,red*.48);',
        ' float beamGlow=exp(-abs(rp.x)*22.0)*(.22+.10*sin(uTime*1.2));',
        ' col+=vec3(.9,.34,.16)*beamGlow;',
        ' float gleam=smoothstep(.67,1.0,sin((q.x*8.+q.y*5.+rip*5.+uTime*.22))*0.5+0.5);',
        ' col+=mix(uCool,vec3(.82,.63,.46),red*.6)*gleam*.22;',
        ' float fres=pow(1.0-clamp(abs(normalize(cameraPosition-vW).y),0.,1.),2.2);',
        ' col+=vec3(.13,.18,.18)*fres*.24;',
        ' float glint=smoothstep(.88,1.0,sin(q.x*26.+q.y*19.+uTime*.4+noise(q*3.)*4.))*.11;',
        ' col+=vec3(.8,.66,.48)*glint;',
        ' col=mix(col,vec3(.48,.62,.64),shore*.35);',
        ' float a=smoothstep(.028,.10,edge)*.985;',
        ' gl_FragColor=vec4(col,a);',
        '}'
      ].join('\n')
    });
    var pool = new T.Mesh(geo, mat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(1.6, p.waterY, 1.4);
    pool.renderOrder = 3;
    scene.add(pool); Base.pool = pool; Base.waterMat = mat;
    FQ.updaters.push(function (dt, t) { mat.uniforms.uTime.value = t; });

    // thin steel maintenance walk along the water's west edge
    var walkMat = FQ.std(0x242b2b, { map: cloneMap(Tex.grate, 2, 1), metalness: .45, roughness: .58 });
    var walk = FQ.box(1.05, .10, 4.6, walkMat, true, .0015);
    walk.position.set(-2.85, p.waterY - .01, 1.2); walk.rotation.y = .04; scene.add(walk);
    for (var k = 0; k < 7; k++) {
      var pipe = FQ.cyl(.045, .045, 1.0, 6, mats.steel, false);
      pipe.rotation.z = Math.PI / 2; pipe.position.set(-2.85, p.waterY + .09, -.95 + k * .7); scene.add(pipe);
    }
  }

  function buildPitStructure(scene) {
    var p = Base.pit;
    // heavy concrete buttresses against the western bench wall
    for (var i = 0; i < 4; i++) {
      var buttress = FQ.box(.42, 2.4, 1.2, mats.concreteDark, true, .0022);
      buttress.position.set(-5.55, -1.25, -4.15 + i * 2.1);
      buttress.rotation.z = -.055;
      scene.add(buttress);
      var cap = FQ.box(.58, .17, 1.45, mats.concrete, true, .0018);
      cap.position.set(-5.52, -.08, -4.15 + i * 2.1); scene.add(cap);
      var foot = FQ.box(.58, .2, 1.4, mats.concrete, false);
      foot.position.set(-5.52, -2.44, -4.15 + i * 2.1); scene.add(foot);
    }
    // huge rusted diagonal tie braces
    var braceMat = FQ.toon(0x8c6b51, { map: cloneMap(Tex.rust, 2, .45), bumpMap: cloneMap(Tex.rust, 2, .45), bumpScale: .025 });
    for (var b = 0; b < 3; b++) {
      var z = -3.9 + b * 3.6;
      var brace = FQ.box(.18, .18, 3.3, braceMat, true, .0016);
      brace.position.set(-4.35, -1.25, z); brace.rotation.x = -.46; scene.add(brace);
      var plate = FQ.box(.52, .5, .14, mats.steelDark, true, .0016);
      plate.position.set(-4.8, -1.8, z + 1.1); plate.rotation.x = -.46; scene.add(plate);
    }
    // lower stairs on the western side, descending toward the water
    var stair = FQ.group(scene, -3.15, -2.55, 2.25);
    stair.rotation.y = Math.PI / 2;
    for (var s = 0; s < 7; s++) {
      var step = FQ.box(1.2, .12, .34, mats.steel, true, .0014);
      step.position.set(0, -s * .17, .34 + s * .33); stair.add(step);
    }
    var railMat = FQ.steel(0x7d805e, .52);
    for (var sr = 0; sr < 2; sr++) {
      var rail = FQ.cyl(.032, .032, 2.5, 6, railMat, false);
      rail.rotation.x = Math.PI / 2 - .4;
      rail.position.set(sr ? .58 : -.58, -.34, 1.95); stair.add(rail);
      for (var sp = 0; sp < 4; sp++) {
        var post = FQ.cyl(.03, .03, .8, 6, railMat, false);
        post.position.set(sr ? .58 : -.58, .1 - sp * .14, .4 + sp * .68);
        post.rotation.z = sr ? .08 : -.08; stair.add(post);
      }
    }
    // broken concrete / fallen wall on the northern bench
    for (var c = 0; c < 5; c++) {
      var shard = FQ.box(.8 + rng() * 1.2, .3 + rng() * .5, .5 + rng() * 1.1, mats.concreteDark, true, .002);
      shard.position.set(-3.8 + c * 1.6, -1.72 + rng() * .16, -4.9 + rng() * .45);
      shard.rotation.set((rng() - .5) * .5, rng() * 2, (rng() - .5) * .6);
      scene.add(shard);
    }
  }

  function scatterRubble(scene) {
    var r = FQ.rng(0xbadc0de);
    var rockMats = [mats.rockDark, mats.rock, mats.concreteDark];
    var positions = [
      [-5.0, -.46, 5.05], [-4.2, -.48, 5.7], [5.15, -.44, -3.9], [5.6, -.38, -2.85],
      [-5.2, -1.7, 3.7], [5.0, -1.66, 2.4], [3.9, -1.72, 4.65], [-3.9, -1.75, -3.2],
      [-2.1, -2.98, -.8], [2.5, -2.97, -2.8], [3.4, -2.95, 2.9], [-3.8, -2.94, 2.6],
      [7.95, .86, 8.7], [-8.8, .86, 8.9], [9.8, .86, -7.8], [-8.2, .86, -8.0],
      [6.6, .86, 5.5], [-6.5, .86, -5.1], [3.1, .86, 9.4], [-5.8, .86, 8.2]
    ];
    for (var i = 0; i < positions.length; i++) {
      var pa = positions[i];
      var n = 2 + (r() * 4 | 0);
      for (var k = 0; k < n; k++) {
        var geo = new T.DodecahedronGeometry(.15 + r() * .36, 0);
        var mesh = new T.Mesh(geo, rockMats[(r() * rockMats.length) | 0]);
        var sc = .5 + r() * 1.4;
        mesh.scale.set(sc * (1 + r() * .7), sc * (.35 + r() * .6), sc * (1 + r() * .5));
        mesh.position.set(pa[0] + (r() - .5) * 1.1, pa[1] + .15 + r() * .1, pa[2] + (r() - .5) * 1.0);
        mesh.rotation.set(r() * 3, r() * 3, r() * 3);
        mesh.castShadow = true; mesh.receiveShadow = true; FQ.outline(mesh, .0016);
        scene.add(mesh);
      }
    }
    // big boulders at the base of the western cliff
    for (var b = 0; b < 5; b++) {
      var rock = new T.Mesh(new T.DodecahedronGeometry(.7 + r() * .55, 0), mats.rockDark);
      rock.scale.set(1.2 + r() * .7, .7 + r() * .5, .9 + r() * .7);
      rock.position.set(-3.8 + r() * 1.2, -2.45 + r() * .3, -2.2 + b * 1.35);
      rock.rotation.set(r() * 2, r() * 3, r() * 2);
      rock.castShadow = true; rock.receiveShadow = true; FQ.outline(rock, .0021); scene.add(rock);
    }
  }

  function buildRimRail(scene) {
    var mat = FQ.std(0x6b705d, { metalness: .62, roughness: .5, envMapIntensity: .75 });
    var postMat = FQ.steel(0x3b4140, .44);
    function railLine(x1, z1, x2, z2, y, gap) {
      var group = FQ.group(scene);
      var len = Math.hypot(x2 - x1, z2 - z1);
      var nx = (x2 - x1) / len, nz = (z2 - z1) / len;
      var posts = Math.max(2, Math.round(len / 1.8));
      for (var i = 0; i <= posts; i++) {
        if (gap && i === Math.floor(posts / 2)) continue;
        var t = i / posts;
        var px = x1 + (x2 - x1) * t, pz = z1 + (z2 - z1) * t;
        var post = FQ.box(.075, .82, .075, postMat, false);
        post.position.set(px, y + .41, pz); group.add(post);
        var foot = FQ.box(.24, .07, .24, mats.steelDark, false);
        foot.position.set(px, y + .035, pz); group.add(foot);
        // safety yellow band
        var band = FQ.box(.082, .10, .082, FQ.toon(0xc3a034), false);
        band.position.set(px, y + .66, pz); group.add(band);
      }
      for (var k = 0; k < 2; k++) {
        var rail = FQ.cyl(.035, .035, len, 6, mat, false);
        rail.rotation.z = Math.PI / 2;
        rail.rotation.y = -Math.atan2(nz, nx);
        rail.position.set((x1 + x2) / 2, y + .52 + k * .27, (z1 + z2) / 2);
        group.add(rail);
      }
      return group;
    }
    var p = Base.pit, y = L.plateauY;
    railLine(-p.ox - .35, p.oz + .33, -p.ox - .35, -1.2, y, false);
    railLine(-p.ox - .35, -2.2, -p.ox - .35, -p.oz - .35, y, true);
    railLine(-p.ox - .35, -p.oz - .35, -2.0, -p.oz - .35, y, false);
    railLine(p.ox + .34, p.oz + .4, p.ox + .34, 1.0, y, true);
    railLine(p.ox + .34, -.4, p.ox + .34, -p.oz - .34, y, false);
    railLine(1.4, p.oz + .37, 5.0, p.oz + .37, y, true);
    // faded warning stripes on some posts
    var stripeMat = FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 1, 1) });
    for (var s = 0; s < 3; s++) {
      var strip = FQ.box(.25, .16, .02, stripeMat, false);
      strip.position.set(-p.ox - .35, y + .44, 1.3 + s * 2.1);
      scene.add(strip);
    }
  }

  function buildDrain(scene) {
    var p = Base.pit;
    var drainMat = mats.grate;
    // perimeter drain gutter on the front apron
    var drainA = FQ.box(5.7, .05, .32, drainMat, false);
    drainA.position.set(-1.8, L.plateauY + .012, p.oz + 1.05); scene.add(drainA);
    var rim = FQ.box(5.9, .08, .42, mats.concreteDark, false);
    rim.position.set(-1.8, L.plateauY - .02, p.oz + 1.05); scene.add(rim);
    for (var i = 0; i < 8; i++) {
      var bar = FQ.box(.06, .035, .4, mats.steel, false);
      bar.position.set(-4.45 + i * .74, L.plateauY + .045, p.oz + 1.05); scene.add(bar);
    }
    // a long shallow runoff channel heading to the front edge
    var ch = FQ.box(.38, .035, 4.0, FQ.std(0x121819, { metalness: .35, roughness: .55 }), false);
    ch.position.set(-3.1, L.plateauY + .004, 9.2); scene.add(ch);
    for (var k = 0; k < 8; k++) {
      var grate = FQ.box(.31, .018, .3, mats.grate, false);
      grate.position.set(-3.1, L.plateauY + .03, 7.5 + k * .48); scene.add(grate);
    }
    // hazard paint at the lip
    var stripe = FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 4, .4) });
    for (var s = 0; s < 3; s++) {
      var stripeMesh = new T.Mesh(FQ.boxGeo(2.0, .012, .26), stripe);
      stripeMesh.position.set(2.7 + s * 0.05, L.plateauY + .022, p.oz + .62 - s * .0);
      scene.add(stripeMesh);
      stripeMesh.rotation.y = -.015;
    }
    var paint = FQ.plane(1.4, .34, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .28, depthWrite: false }), 1, 1);
    paint.rotation.x = -Math.PI / 2; paint.position.set(-3.1, L.plateauY + .02, 5.3); scene.add(paint);
  }

  function puddle(x, z, sx, sz, ry) {
    var mat = new T.MeshPhysicalMaterial({
      color: 0x101a1c, metalness: .35, roughness: .12, transparent: true, opacity: .8,
      clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.4, side: T.DoubleSide, depthWrite: false
    });
    var m = FQ.plane(1, 1, mat, 1, 1);
    m.scale.set(sx, sz, 1); m.rotation.x = -Math.PI / 2; m.rotation.z = ry || 0;
    m.position.set(x, L.plateauY + .018, z); m.renderOrder = 2; return m;
  }

  function buildPlateauPuddles(scene) {
    var a = puddle(-4.8, 8.75, 1.75, .95, .2); scene.add(a);
    var b = puddle(8.15, 7.5, 1.25, .7, -.3); scene.add(b);
    var c = puddle(7.1, -2.9, 1.55, .8, .6); scene.add(c);
    Base.puddles = [a, b, c];
    // sunken drainage channel with ripples, simple rings added by effects.js
  }

  function buildOuterShell(scene) {
    var H = L.half;
    var ext = H;
    // stepped exterior strata under the deck
    // Outer strata are built as four slabs, leaving the quarry volume hollow.
    // The band's outer faces need a crisp outline; use four slabs instead of outlining a box that intersects.
    var sideRockMat = FQ.toon(0x958b7b, {
      map: cloneMap(Tex.rock, 3.5, .95), bumpMap: cloneMap(Tex.rock, 3.5, .95), bumpScale: .08, gradientMap: FQ.gradHard
    });
    var sideData = [
      [0, -1.6, ext - .11, ext * 2 - .15, 1.92, .22],
      [0, -1.6, -ext + .11, ext * 2 - .15, 1.92, .22],
      [ext - .11, -1.6, 0, .22, 1.92, ext * 2 - .15],
      [-ext + .11, -1.6, 0, .22, 1.92, ext * 2 - .15]
    ];
    for (var i = 0; i < sideData.length; i++) {
      var s = sideData[i];
      var m = FQ.box(s[3], s[4], s[5], sideRockMat, true, .0026);
      m.position.set(s[0], s[1], s[2]); scene.add(m);
    }
    // concrete upper band / engineering ribs around the square
    var ribMat = mats.concreteDark;
    for (var side = 0; side < 4; side++) {
      for (var k = -3; k <= 3; k++) {
        if (Math.abs(k) === 3) continue;
        var x = 0, z = 0, rw = .28, rd = .3, rh = 2.15;
        if (side === 0) { x = k * 3.1; z = ext - .04; rw = .28; rd = .34; }
        else if (side === 1) { x = k * 3.1; z = -ext + .04; rw = .28; rd = .34; }
        else if (side === 2) { x = ext - .04; z = k * 3.1; rw = .34; rd = .28; }
        else { x = -ext + .04; z = k * 3.1; rw = .34; rd = .28; }
        var rib = FQ.box(rw, rh, rd, ribMat, true, .0018);
        rib.position.set(x, -1.55, z); scene.add(rib);
        var cap = FQ.box(rw * 1.8, .11, rd * 1.8, mats.steelDark, false);
        cap.position.set(x, -.54, z); scene.add(cap);
      }
    }
    // corner columns
    for (var cx = -1; cx <= 1; cx += 2) {
      for (var cz = -1; cz <= 1; cz += 2) {
        var col = FQ.box(.42, 1.98, .42, mats.concreteDark, true, .0022);
        col.position.set(cx * (ext - .22), -1.6, cz * (ext - .22)); scene.add(col);
        var cap = FQ.box(.55, .14, .55, mats.steel, true, .0015);
        cap.position.set(cx * (ext - .22), -.55, cz * (ext - .22)); scene.add(cap);
        var bolt = FQ.cyl(.07, .07, .03, 8, mats.brass, false);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(cx * (ext - .22), -.77, cz * (ext - .07));
        if (cz < 0) bolt.position.z = cz * (ext - .22);
        // small brass corner plate on the lower foot
        var plate = FQ.box(.5, .055, .5, mats.brass, false);
        plate.position.set(cx * (ext - .28), -2.73, cz * (ext - .28)); scene.add(plate);
      }
    }
    // dark steel display skirt, built around the rim so the pit remains hollow
    var skirtMat = mats.steelDark;
    var skirtH = .86, skirtY = -2.98, skirtT = .34;
    var skirtSides = [
      [0, skirtY, ext - skirtT / 2, ext * 2 - .18, skirtH, skirtT],
      [0, skirtY, -ext + skirtT / 2, ext * 2 - .18, skirtH, skirtT],
      [ext - skirtT / 2, skirtY, 0, skirtT, skirtH, ext * 2 - .18],
      [-ext + skirtT / 2, skirtY, 0, skirtT, skirtH, ext * 2 - .18]
    ];
    for (var fs = 0; fs < skirtSides.length; fs++) {
      var sd = skirtSides[fs];
      var sm = FQ.box(sd[3], sd[4], sd[5], skirtMat, true, .0023);
      sm.position.set(sd[0], sd[1], sd[2]); scene.add(sm);
    }
    // thin steel top lips / brass inlay around the square perimeter only
    var lipDefs = [
      [0, -2.54, ext - .18, ext * 2 - .36, .06, .28],
      [0, -2.54, -ext + .18, ext * 2 - .36, .06, .28],
      [ext - .18, -2.54, 0, .28, .06, ext * 2 - .36],
      [-ext + .18, -2.54, 0, .28, .06, ext * 2 - .36]
    ];
    for (var ld = 0; ld < lipDefs.length; ld++) {
      var lp = lipDefs[ld];
      var topLip = FQ.box(lp[3], lp[4], lp[5], mats.steel, false); topLip.position.set(lp[0], lp[1], lp[2]); scene.add(topLip);
      var brass = FQ.box(lp[3] + .01, .022, lp[5] + .01, mats.brass, false); brass.position.set(lp[0], lp[1] + .035, lp[2]); scene.add(brass);
    }
    // a dark underside slab below the pit floor, so the model still reads as a solid collectible
    var bottomPad = FQ.box(ext * 2 + .52, .26, ext * 2 + .52, FQ.std(0x080b0c, { metalness: .32, roughness: .4 }), true, .0025);
    bottomPad.position.y = -3.72; scene.add(bottomPad);
    var bottomTrim = FQ.box(ext * 2 + .2, .035, ext * 2 + .2, mats.steel, false);
    bottomTrim.position.y = -3.56; scene.add(bottomTrim);
    var bottomLine = FQ.box(ext * 2 + .35, .022, ext * 2 + .35, mats.brass, false);
    bottomLine.position.y = -3.83; scene.add(bottomLine);
    // small corner caps keep the display-object silhouette
    for (var fx = -1; fx <= 1; fx += 2) {
      for (var fz = -1; fz <= 1; fz += 2) {
        var corner = FQ.box(.56, .12, .56, mats.brass, false);
        corner.position.set(fx * (ext - .29), -2.52, fz * (ext - .29)); scene.add(corner);
      }
    }
    // vertical seam / rust streaks on the side rock
    for (var s = 0; s < 4; s++) {
      for (var j = -2; j <= 2; j++) {
        var streakMat = FQ.toon(0x5a4032, { map: cloneMap(Tex.rust, .4, 1.3), transparent: true, opacity: .55, depthWrite: false });
        var plane = FQ.plane(.18, 1.55, streakMat, 1, 1);
        var px, pz, ry;
        if (s === 0) { px = j * 4.1; pz = ext + .015; ry = 0; }
        else if (s === 1) { px = j * 4.1; pz = -ext - .015; ry = Math.PI; }
        else if (s === 2) { px = ext + .015; pz = j * 4.1; ry = Math.PI / 2; }
        else { px = -ext - .015; pz = j * 4.1; ry = -Math.PI / 2; }
        plane.position.set(px, -1.45, pz); plane.rotation.y = ry; scene.add(plane);
      }
    }

    // base plaque on the front face
    var plaque = FQ.textPlane(5.4, 1.28, Tex.plaque, { side: T.FrontSide });
    plaque.position.set(0, -1.65, ext + .022); scene.add(plaque);
    var plaqueFrame = FQ.box(5.72, 1.55, .08, mats.brass, false);
    plaqueFrame.position.set(0, -1.65, ext - .01); scene.add(plaqueFrame);
    var plaqueBack = FQ.box(5.55, 1.4, .06, mats.steelDark, false);
    plaqueBack.position.set(0, -1.65, ext + .005); scene.add(plaqueBack);
    plaque.position.z = ext + .044;

    // front hazard corner plates and bolt rows
    var cornerPlateGeo = new T.PlaneGeometry(1.1, 1.1);
    var cmat = FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 1.2, 1.2), transparent: true, opacity: .62, depthWrite: false });
    for (var cp = 0; cp < 2; cp++) {
      var cm = new T.Mesh(cornerPlateGeo, cmat);
      cm.position.set((cp ? 1 : -1) * (ext - 1.3), -1.05, ext + .028);
      cm.rotation.z = cp ? -.1 : .1; scene.add(cm);
    }

    // stencils on deck
    var st = FQ.plane(4.2, 4.2, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .33, depthWrite: false }), 1, 1);
    st.rotation.x = -Math.PI / 2; st.rotation.z = -.08;
    st.position.set(-7.3, L.plateauY + .028, 9.1); scene.add(st);
    var st2 = FQ.plane(3.2, 3.2, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .15, depthWrite: false }), 1, 1);
    st2.rotation.x = -Math.PI / 2; st2.rotation.z = .12;
    st2.position.set(8.9, L.plateauY + .028, -8.4); scene.add(st2);
  }

  function buildBaseTopDetails(scene) {
    var H = L.half;
    // concrete wheel stops / low blocks along the rear apron
    for (var i = 0; i < 3; i++) {
      var b = FQ.box(2.0, .55, .62, mats.concreteDark, true, .0022);
      b.position.set(-7.6 + i * 2.45, .82 + .275, -9.1); scene.add(b);
      var cap = FQ.box(2.1, .10, .74, mats.concrete, false);
      cap.position.set(-7.6 + i * 2.45, 1.14, -9.1); scene.add(cap);
      var stripe = FQ.box(1.6, .055, .68, FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 2.2, .2) }), false);
      stripe.position.set(-7.6 + i * 2.45, 1.2, -9.1); scene.add(stripe);
    }
    // hazard bollards around the front apron
    for (var k = 0; k < 6; k++) {
      var x = -6.2 + k * 1.25, z = 10.1;
      var boll = FQ.cyl(.09, .12, .78, 8, FQ.toon(0x87702e), true, .0015);
      boll.position.set(x, L.plateauY + .39, z); scene.add(boll);
      var band = FQ.cyl(.10, .10, .14, 8, mats.steelDark, false);
      band.position.set(x, L.plateauY + .60, z); scene.add(band);
    }
    // a short wire/rope barrier across a closed part of the rim
    var bmat = FQ.iron(0x232622, .7);
    var poles = [[3.7, 6.8, 8.7], [2.7, 6.8, 9.6], [1.7, 6.8, 10.2]];
    for (var p = 0; p < poles.length; p++) {
      var pole = FQ.cyl(.035, .045, .9, 6, bmat, false);
      pole.position.set(poles[p][0], .82 + .45, poles[p][2] - 2.3); scene.add(pole);
    }
    FQ.tube([new T.Vector3(3.7, 1.7, 6.4), new T.Vector3(2.7, 1.52, 7.3), new T.Vector3(1.7, 1.62, 7.9)], .012, bmat, 16, 4).position.set(0, 0, 0);
    // concrete safety barriers at the south-east corner
    for (var c = 0; c < 4; c++) {
      var bar = FQ.box(1.65, .62, .45, mats.concrete, true, .0022);
      bar.position.set(8.3 + c * .3, .82 + .31, 8.8 - c * .18);
      bar.rotation.y = -.08; scene.add(bar);
      var hz = FQ.box(1.4, .16, .46, FQ.toon(0xffffff, { map: cloneMap(Tex.hazard, 2, .3) }), false);
      hz.position.set(8.3 + c * .3, .98, 8.8 - c * .18); hz.rotation.y = -.08; scene.add(hz);
    }
  }

  function buildSigns(scene) {
    // sign on the back apron near the cliff
    var sign = FQ.textPlane(2.15, 2.15, Tex.warnContainment, { side: T.FrontSide });
    sign.position.set(-7.5, 2.15, -6.1); sign.rotation.y = .15; scene.add(sign);
    var frame = FQ.box(2.4, 2.4, .08, mats.steelDark, false);
    frame.position.set(-7.5, 2.15, -6.2); frame.rotation.y = .15; scene.add(frame);
    var postL = FQ.cyl(.06, .06, 1.55, 8, mats.steel, false);
    postL.position.set(-8.55, 1.35, -6.1); scene.add(postL);
    var postR = FQ.cyl(.06, .06, 1.55, 8, mats.steel, false);
    postR.position.set(-6.45, 1.35, -6.1); scene.add(postR);
    // restricted warning at the front-left rim
    var wr = FQ.textPlane(.92, .92, Tex.warnRestricted, { side: T.FrontSide });
    wr.position.set(-7.6, 1.55, 7.3); wr.rotation.y = .05; scene.add(wr);
    var post = FQ.box(.08, 1.3, .08, mats.steel, false);
    post.position.set(-7.6, 1.1, 7.3); scene.add(post);
    // large FBC ghost logo on the deck near the quarry lip
    var logo = FQ.plane(2.6, 2.6, FQ.basic(0xffffff, { map: Tex.fbcLogo, transparent: true, opacity: .16, depthWrite: false }), 1, 1);
    logo.rotation.x = -Math.PI / 2; logo.position.set(4.4, L.plateauY + .027, 9.3); scene.add(logo);
    // NO ENTRY at the back-right stair access
    var ne = FQ.textPlane(.8, .8, Tex.warnNoEntry, { side: T.FrontSide });
    ne.position.set(7.1, 1.65, -8.7); ne.rotation.y = -.5; scene.add(ne);
    var nePost = FQ.cyl(.045, .045, 1.2, 6, mats.steel, false);
    nePost.position.set(7.1, 1.15, -8.68); scene.add(nePost);
  }

  Base.build = function (scene) {
    makeMaterials();
    buildOuterShell(scene);
    buildPit(scene);
    buildBaseTopDetails(scene);
    buildSigns(scene);
    // stray boulders on the apron
    for (var i = 0; i < 8; i++) {
      var rock = new T.Mesh(new T.DodecahedronGeometry(.12 + rng() * .2, 0), mats.rockDark);
      rock.scale.set(1 + rng(), .5 + rng() * .5, 1 + rng());
      rock.position.set(-10.2 + rng() * 20, L.plateauY + .12, -10.1 + rng() * 20);
      if (Math.abs(rock.position.x) < 7.4 && Math.abs(rock.position.z) < 7.0) rock.position.x += 2;
      rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      rock.castShadow = true; rock.receiveShadow = true; FQ.outline(rock, .0014); scene.add(rock);
    }
    return Base;
  };
})();
