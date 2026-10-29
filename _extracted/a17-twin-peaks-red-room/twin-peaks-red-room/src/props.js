/* =========================================================
   props.js — grove sign, street lamp, pole, rail, tape, shrine
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C, L = TP.L;
  var P = TP.Props = TP.Props || {};
  var GY = L.groundY;
  var TAU = Math.PI * 2;
  TP.anim = TP.anim || {};
  TP.anim.curtains = TP.anim.curtains || [];
  TP.anim.steam = TP.anim.steam || [];
  TP.anim.tapes = TP.anim.tapes || [];

  function cutWoodTexture() {
    var S = 256, cv = TP.canvas(S, S), g = cv.getContext('2d');
    var r = TP.rng(71);
    g.fillStyle = '#6e5737'; g.fillRect(0, 0, S, S);
    g.translate(S / 2, S / 2);
    g.strokeStyle = 'rgba(39,26,13,.55)';
    for (var i = 1; i < 16; i++) {
      g.lineWidth = .8 + r() * 2;
      g.beginPath(); g.arc(0, 0, i * 8 + r() * 3, 0, 6.28); g.stroke();
    }
    g.strokeStyle = 'rgba(24,17,9,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-10, -120); g.lineTo(6, -55); g.lineTo(-4, 20); g.lineTo(18, 122); g.stroke();
    for (var n = 0; n < 200; n++) {
      g.fillStyle = 'rgba(38,27,14,' + (.02 + r() * .12) + ')';
      g.fillRect((r() - .5) * S, (r() - .5) * S, 1 + r() * 16, 1 + r() * 3);
    }
    return TP.texture(cv, {});
  }
  var cutTex = null;

  function stoneMat() {
    return TP.toon(0x3f4640, { map: TP.Tex.ground(), rim: .14, rimColor: 0x819089 });
  }

  /* grove sign ------------------------------------------------- */
  P.buildSign = function (root) {
    var g = TP.group(root, -9.10, GY, 7.52);
    g.rotation.y = .92;
    g.rotation.z = -.025;
    var wood = TP.toon(0x6d553b, { map: TP.Tex.woodLight(), rim: .1, rimColor: 0x9c9078 });
    var dark = TP.toon(0x3b2a1c, { map: TP.Tex.woodDark(), rim: .08, rimColor: 0x82745e });
    // posts
    var p1 = TP.box(.18, 3.20, .18, wood, g, -1.35, 1.55, -.10, true, true, .0024);
    var p2 = TP.box(.18, 3.05, .18, wood, g, 1.40, 1.47, -.10, true, true, .0024);
    p2.rotation.z = -.075; p2.position.x += .04;
    // head of posts
    for (var s = -1; s <= 1; s += 2) {
      var cap = new T.Mesh(new T.ConeGeometry(.13, .2, 5), dark);
      cap.position.set(s > 0 ? 1.44 : -1.35, s > 0 ? 3.07 : 3.22, -.10);
      cap.rotation.z = s > 0 ? -.08 : 0;
      g.add(cap); TP.ink(cap, .0024);
    }
    // board body
    var board = TP.box(3.35, 1.62, .12, dark, g, 0, 2.24, .01, true, true, .0027);
    board.rotation.z = -.023;
    // face
    var face = new T.Mesh(new T.PlaneGeometry(3.20, 1.50), TP.std(0xffffff, {
      map: TP.Tex.sign(), roughness: .58, metalness: .03, envMapIntensity: .45,
      emissive: 0x18140e, emissiveIntensity: .45
    }));
    face.position.set(0, 2.24, .072);
    face.rotation.z = -.023;
    g.add(face);
    // frame strips
    TP.box(3.46, .075, .17, wood, g, 0, 3.07, .01, true, true, .0024).rotation.z = -.023;
    TP.box(3.46, .075, .17, wood, g, 0, 1.42, .01, true, true, .0024).rotation.z = -.023;
    TP.box(.075, 1.65, .17, wood, g, -1.70, 2.24, .01, true, true, .0024).rotation.z = -.023;
    TP.box(.075, 1.65, .17, wood, g, 1.70, 2.24, .01, true, true, .0024).rotation.z = -.023;
    // rusty nails
    var nailMat = TP.std(0x5c4f38, { metalness: .7, roughness: .45 });
    for (var n = 0; n < 4; n++) {
      var nail = new T.Mesh(new T.SphereGeometry(.022, 6, 5), nailMat);
      nail.position.set(n % 2 ? 1.51 : -1.51, n < 2 ? 2.94 : 1.54, .10);
      g.add(nail);
    }
    // moss growth on a post
    var mossMat = TP.toon(0x405b41, { rim: .1, rimColor: 0x7b9a7a });
    for (var m = 0; m < 4; m++) {
      var moss = TP.mesh(TP.puddingGeo(.2 + m * .04, .12, .15, .5, 8, 5), mossMat, g, -1.35 + (m % 2) * .1, .32 + m * .26, -.10 + (m % 2 ? .06 : -.06));
      moss.castShadow = false;
    }
    // small route marker at the base
    var marker = TP.box(.35, .45, .09, TP.toon(0x4b3b29, { map: TP.Tex.woodDark(), rim: .08, rimColor: 0x8d7a5d }), g, .7, .23, .7, true, true, .0023);
    marker.rotation.z = .06;
    var markerFace = new T.Mesh(new T.PlaneGeometry(.25, .31), TP.basic(0xc7bc9d));
    markerFace.position.set(.7, .25, .75); markerFace.rotation.z = .06; g.add(markerFace);
    // darker green weeds at feet
    P.sign = g;
    return g;
  };

  /* street lamp ------------------------------------------------ */
  P.buildStreetLamp = function (root) {
    var LAMP_X = -5.45, LAMP_Z = 7.95;
    var g = TP.group(root, LAMP_X, GY, LAMP_Z);
    var iron = TP.iron(0x181b1b, .35);
    var brass = TP.brass(0x9e763a, .3);
    // stone footing
    var footStone = TP.mesh(TP.puddingGeo(.85, .24, .85, .32, 12, 7), stoneMat(), g, 0, .1, 0);
    footStone.receiveShadow = true;
    TP.ink(footStone, .0025);
    // tiered base
    TP.cyl(.22, .34, .18, 12, iron, g, 0, .26, 0, true, true, .0024);
    TP.cyl(.13, .22, .26, 12, iron, g, 0, .46, 0, true, true, .0024);
    var pole = TP.cyl(.065, .095, 4.25, 12, iron, g, 0, 2.62, 0, true, true, .0024);
    pole.castShadow = true;
    // decorative rings
    for (var i = 0; i < 4; i++) {
      var ring = new T.Mesh(new T.TorusGeometry(.095, .015, 5, 12), brass);
      ring.rotation.x = Math.PI / 2; ring.position.y = .83 + i * .84; g.add(ring);
    }
    // scroll arm
    var armPts = [
      new T.Vector3(0, 4.68, 0),
      new T.Vector3(.04, 4.93, 0),
      new T.Vector3(.35, 5.05, .10),
      new T.Vector3(.72, 4.95, .25)
    ];
    var arm = TP.curveTube(armPts, .055, iron, g, 26, 6);
    arm.castShadow = true; TP.ink(arm, .0023);
    var scroll = TP.curveTube([
      new T.Vector3(0, 4.72, 0),
      new T.Vector3(.20, 4.55, .06),
      new T.Vector3(.39, 4.70, .14),
      new T.Vector3(.32, 4.90, .10)
    ], .03, iron, g, 20, 5);
    TP.ink(scroll, .0022);
    // lantern hanging at arm end
    var lx = .72, ly = 4.60, lz = .25;
    var chain = new T.Mesh(new T.CylinderGeometry(.022, .022, .30, 5), iron);
    chain.position.set(lx, 4.81, lz); g.add(chain);
    var lanternTop = new T.Mesh(new T.ConeGeometry(.37, .28, 6), iron);
    lanternTop.position.set(lx, 5.0, lz); lanternTop.castShadow = true; g.add(lanternTop); TP.ink(lanternTop, .0023);
    var capTip = new T.Mesh(new T.SphereGeometry(.07, 8, 6), brass);
    capTip.position.set(lx, 5.16, lz); g.add(capTip);
    // glass housing
    var glassMat = new T.MeshPhysicalMaterial({
      color: 0xffc27a, roughness: .16, metalness: .05, transparent: true,
      opacity: .42, side: T.DoubleSide, emissive: 0xffa24e, emissiveIntensity: .9,
      depthWrite: false, envMapIntensity: 1.3
    });
    var lantern = new T.Mesh(new T.CylinderGeometry(.30, .34, .52, 6, 1, true), glassMat);
    lantern.position.set(lx, 4.66, lz); g.add(lantern);
    // inner glow
    var bulbMat = new T.MeshBasicMaterial({ color: new T.Color().setRGB(3.1, 1.75, .65), toneMapped: false });
    var bulb = new T.Mesh(new T.SphereGeometry(.11, 10, 7), bulbMat);
    bulb.position.set(lx, 4.63, lz); g.add(bulb);
    // lantern frame
    for (var r = 0; r < 6; r++) {
      var a = r / 6 * TAU;
      var rib = new T.Mesh(new T.CylinderGeometry(.012, .012, .54, 4), iron);
      rib.position.set(lx + Math.cos(a) * .33, 4.66, lz + Math.sin(a) * .33);
      g.add(rib);
    }
    var bottom = new T.Mesh(new T.CylinderGeometry(.38, .34, .08, 6), iron);
    bottom.position.set(lx, 4.40, lz); g.add(bottom); TP.ink(bottom, .0022);
    var finial = new T.Mesh(new T.SphereGeometry(.055, 8, 6), iron);
    finial.position.set(lx, 4.34, lz); g.add(finial);
    // light
    var light = new T.PointLight(0xffb05c, 2.1, 12.5, 2);
    light.position.set(lx, 4.55, lz);
    g.add(light);
    var spot = new T.SpotLight(0xffb064, 1.1, 13, 1.08, .9, 1.6);
    spot.position.set(lx, 4.5, lz);
    spot.target.position.set(lx, 0, lz + .2);
    g.add(spot); g.add(spot.target);
    var glow = TP.addGlow(g, TP.Tex.glow(), 0xffb460, 5.5, .42, lx, 4.6, lz, false);
    glow.material.depthWrite = false;
    var halo2 = TP.addGlow(g, TP.Tex.glow(), 0xff7a30, 2.3, .5, lx, 4.58, lz, false);
    halo2.material.depthWrite = false;
    // faint shaft of light in rain
    var shaftMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(0xffb167) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform vec3 uColor; uniform float uTime;',
        'void main(){ float edge=smoothstep(.0,.18,vUv.x)*smoothstep(1.,.82,vUv.x);',
        ' float fade=(1.0-vUv.y); float streak=.85+.15*sin(vUv.y*45.0+uTime*.7);',
        ' gl_FragColor=vec4(uColor, edge*fade*.10*streak); }'
      ].join('\n')
    });
    var shaft = new T.Mesh(new T.CylinderGeometry(.15, 2.1, 4.2, 20, 1, true), shaftMat);
    shaft.position.set(lx, 2.45, lz);
    shaft.renderOrder = 3;
    g.add(shaft);
    // warm lantern light pooling over the wet ground
    var poolGlow = new T.Mesh(new T.PlaneGeometry(6.8, 5.4), new T.MeshBasicMaterial({
      map: TP.Tex.glow(), color: 0xff9e4d, transparent: true, opacity: .24,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    poolGlow.rotation.x = -Math.PI / 2;
    poolGlow.position.set(lx, .105, lz);
    poolGlow.renderOrder = 4;
    g.add(poolGlow);
    var poolGlow2 = new T.Mesh(new T.PlaneGeometry(3.4, 2.8), new T.MeshBasicMaterial({
      map: TP.Tex.glow(), color: 0xffd08c, transparent: true, opacity: .20,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    poolGlow2.rotation.x = -Math.PI / 2;
    poolGlow2.position.set(lx, .108, lz);
    poolGlow2.renderOrder = 4;
    g.add(poolGlow2);
    P.streetLamp = {
      group: g, light: light, spot: spot, glow: glow, halo: halo2,
      glassMat: glassMat, shaftMat: shaftMat, lanternPos: new T.Vector3(LAMP_X + lx, GY + 4.6, LAMP_Z + lz)
    };
    return g;
  };

  /* fallen utility pole & wires -------------------------------- */
  P.buildPole = function (root) {
    var g = TP.group(root, 0, 0, 0);
    var start = new T.Vector3(9.80, GY, 2.60);
    var end = new T.Vector3(6.90, GY + .2, 5.20);
    var dir = new T.Vector3().subVectors(end, start);
    var len = dir.length();
    var poleMat = TP.toon(0x443728, { map: TP.Tex.bark(), rim: .1, rimColor: 0x7b7260 });
    var pole = new T.Mesh(new T.CylinderGeometry(.16, .24, len, 9), poleMat);
    pole.position.copy(start).addScaledVector(dir, .5);
    pole.position.y += .25;
    pole.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
    pole.castShadow = true; pole.receiveShadow = true;
    g.add(pole); TP.ink(pole, .0025);
    // crossarms near the top
    var up = dir.clone().normalize();
    var topPt = start.clone().addScaledVector(dir, len * .84);
    topPt.y += .28;
    var cross = new T.Mesh(new T.BoxGeometry(2.4, .12, .13), TP.toon(0x3e3022, { map: TP.Tex.woodDark() }));
    cross.position.copy(topPt);
    cross.rotation.y = -.6; cross.rotation.z = -.12;
    cross.castShadow = true; g.add(cross); TP.ink(cross, .0023);
    // insulators
    var insMat = TP.physical(0x5c7b75, { roughness: .18, metalness: .2, clearcoat: 1, envMapIntensity: 1.5 });
    for (var i = 0; i < 3; i++) {
      var ins = new T.Mesh(new T.CylinderGeometry(.075, .10, .18, 10), insMat);
      ins.position.set(topPt.x + (i - 1) * .65, topPt.y + .18, topPt.z + (i - 1) * .12);
      ins.rotation.y = -.6; g.add(ins); TP.ink(ins, .002);
      var pin = new T.Mesh(new T.CylinderGeometry(.025, .025, .28, 6), TP.iron(0x4a4b45, .3));
      pin.position.copy(ins.position); pin.position.y -= .18; g.add(pin);
    }
    // splintered end
    var splinter = new T.Mesh(new T.ConeGeometry(.18, .55, 5), poleMat);
    splinter.position.copy(end); splinter.position.y += .22;
    splinter.rotation.z = Math.PI / 2; splinter.rotation.y = -.7; g.add(splinter); TP.ink(splinter, .0024);
    // broken wire loops hanging
    var wireMat = TP.iron(0x080a0a, .6);
    var w1 = TP.curveTube([
      new T.Vector3(9.1, GY + .30, 4.2),
      new T.Vector3(8.8, GY + .62, 3.4),
      new T.Vector3(8.5, GY + .16, 2.9),
      new T.Vector3(8.8, GY + .30, 2.3)
    ], .017, wireMat, g, 26, 4);
    w1.castShadow = false;
    var w2 = TP.curveTube([
      new T.Vector3(8.3, GY + .25, 4.6),
      new T.Vector3(7.8, GY + .75, 5.3),
      new T.Vector3(7.2, GY + .32, 5.8)
    ], .012, wireMat, g, 20, 4);
    // wires to the right-hand sycamore and down over the road
    var treePoint = new T.Vector3(8.0, GY + 5.1, 2.25);
    var roadPoint = new T.Vector3(10.7, GY + .7, 7.8);
    TP.wire(topPt.clone().add(new T.Vector3(0, .2, 0)), treePoint, .65, .014, wireMat, g, 30);
    TP.wire(topPt.clone().add(new T.Vector3(-.7, .15, 0)), roadPoint, 1.35, .012, wireMat, g, 32);
    // little ceramic/glass shards under the pole
    var shardMat = TP.basic(0x9ab0a7, { transparent: true, opacity: .65 });
    for (var sh = 0; sh < 9; sh++) {
      var sg = new T.Mesh(new T.ConeGeometry(.015 + Math.random() * .02, .06 + Math.random() * .06, 3), shardMat);
      sg.position.set(8.2 + Math.random() * 2.2, GY + .03, 1.0 + Math.random() * 2.4);
      sg.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      g.add(sg);
    }
    P.pole = { group: g, top: topPt, start: start, end: end };
    return g;
  };

  /* guardrail -------------------------------------------------- */
  P.buildGuardrail = function (root) {
    var g = TP.group(root, 0, 0, 0);
    var r = TP.rng(303);
    var curve = TP.Ground.roadCurve;
    var metal = TP.std(0x6f746e, { metalness: .82, roughness: .34, envMapIntensity: 1.5 });
    var dark = TP.iron(0x282a28, .4);
    var n = 24;
    var prev = null;
    var postCount = 0;
    for (var i = 0; i <= n; i++) {
      var t = .55 + (i / n) * .37;
      var p = curve.getPoint(t);
      var tan = curve.getTangent(t);
      var sx = tan.z, sz = -tan.x, sl = Math.hypot(sx, sz) || 1;
      sx /= sl; sz /= sl;
      p.x += sx * -2.10; p.z += sz * -2.10;
      var y = GY + .73 + Math.sin(i * 1.3) * .02;
      if (prev) {
        var mid = prev.clone().add(p).multiplyScalar(.5);
        var d = new T.Vector3().subVectors(p, prev);
        var len = d.length() + .06;
        var rail = new T.Mesh(new T.BoxGeometry(.075, .34, len), metal);
        rail.position.copy(mid); rail.position.y = y;
        rail.rotation.y = Math.atan2(d.x, d.z);
        rail.rotation.z = (i === 17 ? .07 : 0);
        rail.castShadow = true; rail.receiveShadow = true;
        g.add(rail); TP.ink(rail, .0023);
        // horizontal groove
        var ridge = new T.Mesh(new T.BoxGeometry(.082, .045, len * .96), dark);
        ridge.position.copy(rail.position); ridge.position.y += .06; ridge.rotation.copy(rail.rotation);
        g.add(ridge);
      }
      if (i % 3 === 0) {
        var post = new T.Mesh(new T.BoxGeometry(.10, .78, .10), dark);
        post.position.set(p.x, GY + .39, p.z);
        post.castShadow = true; g.add(post); TP.ink(post, .0023);
        var bolt = new T.Mesh(new T.SphereGeometry(.025, 6, 5), TP.iron(0x393b34, .4));
        bolt.position.set(p.x, GY + .72, p.z + .06); g.add(bolt);
        postCount++;
      }
      prev = p.clone();
    }
    P.guardrail = g;
    return g;
  };

  /* police tape ------------------------------------------------ */
  function makeTape(a, b, sag, width, extra, seed) {
    var r = TP.rng(seed || 1);
    var mid = a.clone().add(b).multiplyScalar(.5);
    mid.y -= sag;
    mid.x += (r() - .5) * 1.2;
    var curve = new T.QuadraticBezierCurve3(a, mid, b);
    var n = 34;
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var p = curve.getPoint(t);
      var tan = curve.getTangent(t);
      var sx = tan.z, sz = -tan.x;
      var sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
      var wave = Math.sin(t * 8 + (seed || 0)) * .04 * (extra === undefined ? 1 : extra);
      for (var j = 0; j <= 1; j++) {
        var v = j;
        var yy = p.y + (v - .5) * .16;
        var off = wave + (r() - .5) * .006;
        pos.push(p.x + sx * off, yy, p.z + sz * off);
        uv.push(t * 2.4, v);
      }
    }
    for (var q = 0; q < n; q++) {
      var k = q * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    var mesh = new T.Mesh(geo, new T.MeshStandardMaterial({
      map: TP.Tex.tape(), side: T.DoubleSide, roughness: .55, metalness: .02,
      transparent: true, opacity: .96, emissive: 0x342708, emissiveIntensity: .28,
      envMapIntensity: .6
    }));
    mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.userData.base = new Float32Array(pos);
    mesh.material.map.wrapS = T.RepeatWrapping;
    TP.anim.tapes.push({ mesh: mesh, base: new Float32Array(pos), phase: seed || 0 });
    return mesh;
  }

  P.buildTape = function (root) {
    var a = new T.Vector3(9.05, GY + 1.04, 6.25);
    var b = new T.Vector3(7.02, GY + 1.43, 5.46);
    var tape = makeTape(a, b, .24, .16, 1.2, 4.2);
    root.add(tape);
    var c = new T.Vector3(6.2, GY + .72, 4.10);
    var d = new T.Vector3(8.2, GY + .32, 2.55);
    var tape2 = makeTape(c, d, .18, .16, .7, 7.7);
    root.add(tape2);
    var e1 = new T.Vector3(-8.8, GY + 1.18, 8.20);
    var e2 = new T.Vector3(-6.25, GY + 1.08, 7.45);
    var tape3 = makeTape(e1, e2, .16, .16, 1.1, 9.4);
    root.add(tape3);
    P.tape = [tape, tape2, tape3];
    return tape;
  };

  /* owl cave rock --------------------------------------------- */
  P.buildOwlRock = function (root) {
    var g = TP.group(root, -2.58, GY, 6.78);
    var r = TP.rng(1990);
    var geo = new T.DodecahedronGeometry(1, 1);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var n = Math.sin(x * 3.3 + y * 2.1) * .09 + Math.sin(z * 4.0 + x * 1.7) * .06;
      pos.setXYZ(i, x * (1 + n), y * (.62 + n), z * (1 + n));
    }
    geo.computeVertexNormals();
    var rockMat = TP.toon(0x404944, { map: TP.Tex.ground(), rim: .16, rimColor: 0x788d88, gradientMap: TP.gradSoft });
    var rock = new T.Mesh(geo, rockMat);
    rock.scale.set(1.24, .92, 1.05);
    rock.position.y = .47;
    rock.rotation.set(.1, .58, -.03);
    rock.castShadow = true; rock.receiveShadow = true;
    g.add(rock); TP.ink(rock, .0026);
    // flat-ish slab face for the petroglyph
    var slab = TP.mesh(TP.puddingGeo(1.24, 1.12, .22, .16, 14, 8), TP.toon(0x51554d, { rim: .12, rimColor: 0x80908a }), g,
      .25, .65, .55);
    slab.rotation.set(-.20, .34, .06);
    TP.ink(slab, .0025);
    var decalMat = new T.MeshBasicMaterial({
      map: TP.Tex.owlCave(), transparent: true, opacity: .92,
      depthWrite: false, side: T.DoubleSide, toneMapped: false, color: 0xbda46f
    });
    var decal = new T.Mesh(new T.PlaneGeometry(.91, .91), decalMat);
    decal.position.set(.44, .72, .74);
    decal.rotation.set(-.12, .29, -.02);
    decal.renderOrder = 2;
    g.add(decal);
    var glowMat = new T.MeshBasicMaterial({
      map: TP.Tex.owlCave(), transparent: true, opacity: .24,
      depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, color: 0xffbe7c
    });
    var glow = new T.Mesh(new T.PlaneGeometry(1.04, 1.04), glowMat);
    glow.position.copy(decal.position); glow.position.z += .01;
    glow.rotation.copy(decal.rotation);
    glow.renderOrder = 3;
    g.add(glow);
    P.owlGlowMat = glowMat;
    var glyphLight = new T.PointLight(0xffa95f, .38, 3.1, 2);
    glyphLight.position.set(.35, .9, .8);
    g.add(glyphLight);
    // moss and grass at base
    var mossMat = TP.toon(0x3c583d, { rim: .12, rimColor: 0x729172 });
    for (var m = 0; m < 4; m++) {
      var moss = TP.mesh(TP.puddingGeo(.35 + r() * .3, .1, .25, .5, 9, 5), mossMat, g,
        -.6 + r() * 1.2, .08 + r() * .05, -.2 + r() * .9);
      moss.castShadow = false;
    }
    P.owlRock = g;
    return g;
  };

  /* clippings stump ------------------------------------------- */
  function clippingMaterial(idx) {
    var tex = TP.Tex.clippings()[idx % 3];
    return TP.std(0xffffff, {
      map: tex, roughness: .78, metalness: 0,
      emissive: 0x776246, emissiveIntensity: .55, envMapIntensity: .2
    });
  }

  P.buildStumpShrine = function (root) {
    if (!cutTex) cutTex = cutWoodTexture();
    var g = TP.group(root, -5.30, GY, 6.42);
    g.rotation.y = .68;
    var r = TP.rng(1889);
    var barkMat = TP.toon(0x5a4f3a, { map: TP.Tex.bark(), rim: .1, rimColor: 0x8e8a74 });
    var stump = new T.Mesh(new T.CylinderGeometry(.62, .86, 1.12, 10), barkMat);
    stump.position.y = .56; stump.castShadow = true; stump.receiveShadow = true;
    g.add(stump); TP.ink(stump, .0026);
    var top = new T.Mesh(new T.CylinderGeometry(.62, .62, .035, 18), TP.std(0x7d6440, { map: cutTex, roughness: .7, metalness: .03 }));
    top.position.y = 1.13; g.add(top);
    var topGlowRim = new T.Mesh(new T.TorusGeometry(.62, .018, 4, 24), TP.std(0x4a3a24, { roughness: .8 }));
    topGlowRim.rotation.x = Math.PI / 2; topGlowRim.position.y = 1.13; g.add(topGlowRim);
    // roots
    for (var rt = 0; rt < 5; rt++) {
      var a = rt / 5 * TAU + .21;
      var start = new T.Vector3(Math.cos(a) * .4, .3, Math.sin(a) * .4);
      var end = new T.Vector3(Math.cos(a) * 1.15, .02, Math.sin(a) * 1.1);
      var d = new T.Vector3().subVectors(end, start);
      var root = new T.Mesh(new T.CylinderGeometry(.055, .16, d.length(), 6), barkMat);
      root.position.copy(start).addScaledVector(d, .5);
      root.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
      root.castShadow = true; g.add(root); TP.ink(root, .0023);
    }
    // old board nailed to stump
    var board = TP.box(1.25, 1.32, .12, TP.toon(0x4d3927, { map: TP.Tex.woodDark(), rim: .08, rimColor: 0x8d7050 }), g, .05, .72, .56, true, true, .0025);
    board.rotation.set(-.05, .04, -.04);
    // clippings
    var clippings = TP.Tex.clippings();
    for (var i = 0; i < 3; i++) {
      var paper = new T.Mesh(new T.PlaneGeometry(.56, .72), clippingMaterial(i));
      paper.position.set(-.35 + i * .38, .72 + (i % 2) * .10, .64 + i * .006);
      paper.rotation.set(0, 0, (i - 1) * .06 + (r() - .5) * .03);
      g.add(paper);
      // corners tacks
      for (var c = 0; c < 2; c++) {
        var tack = new T.Mesh(new T.SphereGeometry(.018, 6, 5), TP.brass(0xb38b47, .3));
        tack.position.set(paper.position.x + (c ? .23 : -.23), paper.position.y + .3, .652);
        g.add(tack);
      }
    }
    // loose leaflet on the ground
    var loose = new T.Mesh(new T.PlaneGeometry(.45, .58), clippingMaterial(1));
    loose.rotation.x = -Math.PI / 2; loose.rotation.z = .8;
    loose.position.set(.9, .018, .8);
    g.add(loose);
    // a candle stub and small memento
    var candle = new T.Mesh(new T.CylinderGeometry(.035, .04, .16, 8), TP.toon(0xd4c7ab, {}));
    candle.position.set(.48, 1.08, -.35); g.add(candle); TP.ink(candle, .0018);
    var flame = new T.Mesh(new T.SphereGeometry(.023, 6, 5), new T.MeshBasicMaterial({ color: new T.Color().setRGB(4, 1.8, .4), toneMapped: false }));
    flame.scale.y = 1.7; flame.position.set(.48, 1.19, -.35); g.add(flame);
    P.candleFlame = flame;
    var candleGlow = TP.addGlow(g, TP.Tex.glow(), 0xffa85b, 1.9, .34, .48, 1.12, -.35, false);
    var candleLight = new T.PointLight(0xffb266, .45, 3.6, 2);
    candleLight.position.set(.48, 1.2, -.25);
    g.add(candleLight);
    P.stumpShrine = g;
    return g;
  };

  /* crate ------------------------------------------------------ */
  P.buildCrate = function (root) {
    var g = TP.group(root, 6.15, GY, 4.38);
    g.rotation.y = -.35;
    var wood = TP.toon(0x60472f, { map: TP.Tex.woodLight(), rim: .08, rimColor: 0x968063 });
    var dark = TP.toon(0x392a1d, { map: TP.Tex.woodDark() });
    var w = 1.14, h = .86, d = .82;
    // corner frames
    for (var ix = -1; ix <= 1; ix += 2) {
      for (var iz = -1; iz <= 1; iz += 2) {
        TP.box(.10, h, .10, dark, g, ix * w / 2, h / 2, iz * d / 2, true, true, .0023);
      }
    }
    // side slats
    for (var s = 0; s < 4; s++) {
      var y = .13 + s * .20;
      TP.box(w, .15, .055, wood, g, 0, y, d / 2, true, true, .0022);
      TP.box(w, .15, .055, wood, g, 0, y, -d / 2, true, true, .0022);
      TP.box(.055, .15, d, wood, g, w / 2, y, 0, true, true, .0022);
      TP.box(.055, .15, d, wood, g, -w / 2, y, 0, true, true, .0022);
    }
    // interior darkness
    var inside = TP.box(w - .2, .05, d - .2, TP.basic(0x070604), g, 0, .62, 0, false, false);
    // open/damaged top slats
    var lid = TP.box(w + .04, .07, d * .72, wood, g, .05, 1.08, -.16, true, true, .0022);
    lid.rotation.x = .36;
    var lid2 = TP.box(w * .75, .07, .3, wood, g, -.06, .96, .31, true, true, .0022);
    lid2.rotation.z = .18;
    // stencil mark
    var mark = new T.Mesh(new T.PlaneGeometry(.40, .22), TP.basic(0xc3b795, { transparent: true, opacity: .44 }));
    mark.position.set(.18, .47, d / 2 + .031); g.add(mark);
    // old rags / dark contents
    var cloth = TP.toon(0x272b22, {});
    var cl = TP.mesh(TP.puddingGeo(.7, .18, .45, .5, 10, 6), cloth, g, -.08, .75, 0);
    cl.rotation.y = .6;
    P.crate = g;
    return g;
  };

  /* misc rocks, stumps, gutter grate --------------------------- */
  P.buildMisc = function (root) {
    var r = TP.rng(1201);
    var rockGeo = new T.DodecahedronGeometry(1, 1);
    var rockMat = TP.toon(0x4a5049, { rim: .14, rimColor: 0x78877e, gradientMap: TP.gradSoft });
    for (var i = 0; i < 20; i++) {
      var a = r() * TAU, rad = 9.8 + r() * 2.2;
      var x = Math.cos(a) * rad, z = -.8 + Math.sin(a) * rad;
      if (TP.Forest.nearRoad(x, z, 2.4)) continue;
      var rock = new T.Mesh(rockGeo, rockMat);
      rock.position.set(x, GY + .09 + r() * .06, z);
      rock.scale.set(.12 + r() * .35, .10 + r() * .24, .12 + r() * .32);
      rock.rotation.set(r() * 3, r() * 3, r() * 3);
      rock.castShadow = true; rock.receiveShadow = true;
      root.add(rock);
      if (i < 7) TP.ink(rock, .0023);
    }
    // small stumps
    var bark = TP.toon(0x5c4e3b, { map: TP.Tex.bark(), rim: .1, rimColor: 0x8c8972 });
    var tops = TP.std(0x7c6746, { map: cutTex || (cutTex = cutWoodTexture()), roughness: .72 });
    var stumps = [[-1.25, 7.35, .37, .32], [4.9, -9.7, .45, .30], [-10.2, -.2, .30, .24]];
    for (var s = 0; s < stumps.length; s++) {
      var def = stumps[s];
      var st = new T.Mesh(new T.CylinderGeometry(def[2] * .7, def[2], def[3] * 2.4, 8), bark);
      st.position.set(def[0], GY + def[3] * 1.2, def[1]);
      st.castShadow = true; st.receiveShadow = true; root.add(st); TP.ink(st, .0023);
      var tt = new T.Mesh(new T.CylinderGeometry(def[2] * .7, def[2] * .7, .025, 12), tops);
      tt.position.set(def[0], GY + def[3] * 2.4, def[1]); root.add(tt);
    }
    // gutter grate near the ditch
    var grate = TP.group(root, -6.20, GY + .03, 7.02);
    var gm = TP.iron(0x34342c, .4);
    var frame = TP.box(.9, .06, .5, gm, grate, 0, 0, 0, false, false);
    for (var b = 0; b < 7; b++) {
      TP.box(.035, .065, .43, gm, grate, -.35 + b * .115, .02, 0, false, false);
    }
    TP.box(.9, .06, .07, gm, grate, 0, .035, .22, false, false);
    TP.box(.9, .06, .07, gm, grate, 0, .035, -.22, false, false);
    return root;
  };

  P.build = function (scene) {
    var root = TP.group(scene, 0, 0, 0);
    P.root = root;
    P.buildSign(root);
    P.buildStreetLamp(root);
    P.buildPole(root);
    P.buildGuardrail(root);
    P.buildTape(root);
    P.buildOwlRock(root);
    P.buildStumpShrine(root);
    P.buildCrate(root);
    P.buildMisc(root);
    return root;
  };
})();
