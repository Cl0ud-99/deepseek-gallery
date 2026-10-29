/* =========================================================
   furniture.js — leather, marble, statues, lamp, clock, Saturn
   ========================================================= */
(function () {
  'use strict';
  var T = THREE, TP = window.TP, C = TP.C, L = TP.L;
  var F = TP.Furniture = TP.Furniture || {};
  var Rm = L.room;
  TP.anim = TP.anim || {};
  TP.anim.curtains = TP.anim.curtains || [];
  TP.anim.steam = TP.anim.steam || [];
  TP.anim.tapes = TP.anim.tapes || [];

  function leatherMat() {
    var m = TP.physical(0x08090a, {
      roughness: .25, metalness: .04, clearcoat: .78, clearcoatRoughness: .22,
      sheen: 1.0, sheenColor: 0x6a3530, sheenRoughness: .38, envMapIntensity: 1.9
    });
    return m;
  }
  var leather = null, leatherLine = null;
  function getLeather() {
    if (!leather) leather = leatherMat();
    return leather;
  }
  function marbleWhite() {
    return TP.physical(0xf0ebe0, {
      map: TP.Tex.marbleWhite(), roughness: .23, metalness: .04,
      clearcoat: .55, clearcoatRoughness: .22, envMapIntensity: 1.4
    });
  }
  function marbleBlack() {
    return TP.physical(0x0c0f10, {
      map: TP.Tex.marbleBlack(), roughness: .24, metalness: .16,
      clearcoat: .65, clearcoatRoughness: .18, envMapIntensity: 1.6
    });
  }
  var brassMat = null, goldMat = null;
  function getBrass() { return brassMat || (brassMat = TP.brass(0xb78b45, .24)); }
  function getGold() { return goldMat || (goldMat = TP.gold(.18)); }

  function child(parent, mesh, x, y, z, rx, ry, rz) {
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    parent.add(mesh);
    return mesh;
  }

  function softMesh(w, h, d, p, mat, parent, x, y, z) {
    var m = new T.Mesh(TP.puddingGeo(w, h, d, p === undefined ? .34 : p, 22, 14), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  function tuftButton(parent, x, y, z, mat) {
    var b = new T.Mesh(new T.SphereGeometry(.035, 8, 6), mat || getBrass());
    b.scale.z = .5;
    b.position.set(x, y, z);
    parent.add(b);
    return b;
  }

  function pipingCurve(parent, pts, radius, mat) {
    var g = new T.CatmullRomCurve3(pts);
    var m = new T.Mesh(new T.TubeGeometry(g, 18, radius || .013, 4, false), mat || getLeather());
    m.castShadow = false;
    parent.add(m);
    return m;
  }

  function makeLeg(parent, x, z, h, darkWood, brass) {
    var leg = new T.Mesh(new T.CylinderGeometry(.045, .025, h, 6), darkWood);
    leg.position.set(x, h / 2, z);
    leg.castShadow = true; parent.add(leg); TP.ink(leg, .0023);
    var cuff = new T.Mesh(new T.CylinderGeometry(.055, .05, .075, 8), brass);
    cuff.position.set(x, h * .78, z); parent.add(cuff);
    var foot = new T.Mesh(new T.SphereGeometry(.047, 8, 6), brass);
    foot.scale.y = .7; foot.position.set(x, .032, z); parent.add(foot);
  }

  function makeArmchair(opts) {
    opts = opts || {};
    var width = opts.width || 1.62;
    var depth = opts.depth || 1.15;
    var g = TP.group(TP.world, opts.x, Rm.floorY, opts.z);
    g.rotation.y = opts.ry || 0;
    var leatherM = getLeather();
    var wood = TP.std(0x1b120b, { roughness: .33, metalness: .03, envMapIntensity: .8 });
    var brass = getBrass();

    makeLeg(g, -width * .37, depth * .33, .28, wood, brass);
    makeLeg(g, width * .37, depth * .33, .28, wood, brass);
    makeLeg(g, -width * .37, -depth * .30, .28, wood, brass);
    makeLeg(g, width * .37, -depth * .30, .28, wood, brass);
    // apron
    var apron = TP.box(width * .86, .17, depth * .82, leatherM, g, 0, .33, -.02, true, true, .0024);
    // seat cushion
    var seat = softMesh(width * .76, .20, depth * .68, .32, leatherM, g, 0, .49, .02);
    seat.scale.y = .9;
    // back
    var back = softMesh(width * .90, 1.18, .34, .30, leatherM, g, 0, 1.03, -depth * .40);
    back.rotation.x = -.10;
    // rolled top
    var topRoll = new T.Mesh(new T.CylinderGeometry(.12, .12, width * .84, 12), leatherM);
    topRoll.rotation.z = Math.PI / 2;
    topRoll.position.set(0, 1.59, -depth * .405);
    topRoll.castShadow = true; g.add(topRoll); TP.ink(topRoll, .0024);
    // wing sides
    for (var w = -1; w <= 1; w += 2) {
      var wing = softMesh(.28, .98, .33, .32, leatherM, g, w * width * .40, 1.05, -depth * .28);
      wing.rotation.z = w * -.10; wing.rotation.x = -.1;
      TP.ink(wing, .0022);
    }
    // arms
    for (var a = -1; a <= 1; a += 2) {
      var arm = new T.Mesh(new T.CylinderGeometry(.16, .17, depth * .66, 12), leatherM);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(a * width * .43, .74, -.02);
      arm.castShadow = true; g.add(arm); TP.ink(arm, .0025);
      var end = new T.Mesh(new T.SphereGeometry(.17, 12, 9), leatherM);
      end.scale.set(.86, .95, .95);
      end.position.set(a * width * .43, .74, depth * .315);
      g.add(end); TP.ink(end, .0025);
      // gold piping on arm
      var pipePts = [];
      for (var k = 0; k <= 4; k++) pipePts.push(new T.Vector3(a * width * .43, .78 + Math.sin(k / 4 * Math.PI) * .15, depth * .31 - k * .0));
      // simple longitudinal seam in leather
      var seam = new T.Mesh(new T.CylinderGeometry(.005, .005, depth * .64, 4), TP.basic(0x1d1c19));
      seam.rotation.x = Math.PI / 2;
      seam.position.set(a * width * .43, .91, 0);
      g.add(seam);
    }
    // tufting buttons
    for (var row = 0; row < 3; row++) {
      for (var col = -1; col <= 1; col++) {
        if (row === 2 && col !== 0) continue;
        tuftButton(g, col * width * .22, 1.01 + row * .16, -depth * .40 - .155, brass);
      }
    }
    // seat piping
    pipingCurve(g, [
      new T.Vector3(-width * .38, .40, depth * .37),
      new T.Vector3(0, .40, depth * .40),
      new T.Vector3(width * .38, .40, depth * .37)
    ], .008, leatherM);
    // small red velvet accent pillow
    if (opts.pillow !== false) {
      var pillowMat = TP.toon(0x8d1422, { map: TP.Tex.velvet(), gradientMap: TP.gradSoft, rim: .12, rimColor: 0xb13f46 });
      var pillow = softMesh(.56, .34, .16, .55, pillowMat, g, -width * .20, .80, -depth * .25);
      pillow.rotation.z = -.15; pillow.rotation.x = -.12;
      TP.ink(pillow, .0022);
      // a fine gold seam
      pipingCurve(g, [
        new T.Vector3(-width * .20 - .22, .88, -depth * .25 + .08),
        new T.Vector3(-width * .20, .64, -depth * .25 + .12),
        new T.Vector3(-width * .20 + .22, .88, -depth * .25 + .08)
      ], .005, getBrass());
    }
    F.armchair = g;
    return g;
  }

  function makeSofa(opts) {
    opts = opts || {};
    var width = opts.width || 3.25;
    var depth = opts.depth || 1.15;
    var g = TP.group(TP.world, opts.x, Rm.floorY, opts.z);
    g.rotation.y = opts.ry || 0;
    var leatherM = getLeather();
    var wood = TP.std(0x1b120b, { roughness: .33, metalness: .03, envMapIntensity: .8 });
    var brass = getBrass();
    for (var lx = -1; lx <= 1; lx += 2) {
      for (var lz = -1; lz <= 1; lz += 2) makeLeg(g, lx * width * .42, lz * depth * .33, .27, wood, brass);
    }
    var apron = TP.box(width * .90, .17, depth * .83, leatherM, g, 0, .32, -.02, true, true, .0024);
    for (var c = -1; c <= 1; c += 2) {
      var seat = softMesh(width * .39, .20, depth * .67, .32, leatherM, g, c * width * .215, .48, .02);
      // seat back sections
      var back = softMesh(width * .40, 1.06, .32, .30, leatherM, g, c * width * .215, .98, -depth * .40);
      back.rotation.x = -.08;
      for (var row = 0; row < 2; row++) {
        for (var col = -1; col <= 1; col += 2) {
          tuftButton(g, c * width * .215 + col * width * .095, .94 + row * .19, -depth * .40 - .15, brass);
        }
      }
    }
    // center back panel
    var centerBack = softMesh(width * .28, 1.08, .30, .3, leatherM, g, 0, .99, -depth * .41);
    TP.ink(centerBack, .0022);
    // rolled top
    var topRoll = new T.Mesh(new T.CylinderGeometry(.11, .11, width * .88, 12), leatherM);
    topRoll.rotation.z = Math.PI / 2;
    topRoll.position.set(0, 1.51, -depth * .405);
    topRoll.castShadow = true; g.add(topRoll); TP.ink(topRoll, .0024);
    // arms
    for (var a = -1; a <= 1; a += 2) {
      var arm = new T.Mesh(new T.CylinderGeometry(.16, .17, depth * .69, 12), leatherM);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(a * width * .47, .73, -.01);
      arm.castShadow = true; g.add(arm); TP.ink(arm, .0025);
      var end = new T.Mesh(new T.SphereGeometry(.17, 12, 9), leatherM);
      end.scale.set(.88, .94, .95);
      end.position.set(a * width * .47, .73, depth * .33);
      g.add(end); TP.ink(end, .0025);
      var end2 = new T.Mesh(new T.SphereGeometry(.17, 12, 9), leatherM);
      end2.scale.set(.88, .9, .9);
      end2.position.set(a * width * .47, .73, -.30);
      g.add(end2); TP.ink(end2, .0025);
      var seam = new T.Mesh(new T.CylinderGeometry(.005, .005, depth * .65, 4), TP.basic(0x1d1c19));
      seam.rotation.x = Math.PI / 2;
      seam.position.set(a * width * .47, .90, 0);
      g.add(seam);
    }
    // arm piping
    pipingCurve(g, [
      new T.Vector3(-width * .47, .78, -.29),
      new T.Vector3(-width * .47, .92, 0),
      new T.Vector3(-width * .47, .78, .31)
    ], .006, leatherM);
    pipingCurve(g, [
      new T.Vector3(width * .47, .78, -.29),
      new T.Vector3(width * .47, .92, 0),
      new T.Vector3(width * .47, .78, .31)
    ], .006, leatherM);
    // red throw pillow
    var pillowMat = TP.toon(0x7a0f1a, { map: TP.Tex.velvet(), gradientMap: TP.gradSoft, rim: .13, rimColor: 0xac3e45 });
    var pillow = softMesh(.66, .42, .18, .55, pillowMat, g, -width * .26, .82, -depth * .20);
    pillow.rotation.set(-.18, .15, .18);
    TP.ink(pillow, .0022);
    F.sofa = g;
    return g;
  }

  /* side table & phone ---------------------------------------- */
  function makeSideTable(x, z) {
    var g = TP.group(TP.world, x, Rm.floorY, z);
    var mb = marbleBlack();
    var brass = getBrass();
    var base = new T.Mesh(new T.CylinderGeometry(.34, .40, .055, 18), mb);
    base.position.y = .03; base.receiveShadow = true; g.add(base); TP.ink(base, .0023);
    var stem = new T.Mesh(new T.CylinderGeometry(.075, .11, .92, 10), mb);
    stem.position.y = .51; stem.castShadow = true; g.add(stem); TP.ink(stem, .0023);
    var ring1 = new T.Mesh(new T.TorusGeometry(.13, .025, 5, 16), brass);
    ring1.rotation.x = Math.PI / 2; ring1.position.y = .18; g.add(ring1);
    var top = new T.Mesh(new T.CylinderGeometry(.49, .49, .085, 28), mb);
    top.position.y = 1.01; top.castShadow = true; top.receiveShadow = true; g.add(top); TP.ink(top, .0023);
    var rim = new T.Mesh(new T.TorusGeometry(.49, .019, 5, 36), brass);
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.057; g.add(rim);
    // phone
    var phone = TP.group(g, 0, 1.08, 0);
    phone.rotation.y = -.55;
    var black = TP.physical(0x090a0a, { roughness: .28, metalness: .05, clearcoat: .7, clearcoatRoughness: .2, envMapIntensity: 1.3 });
    var body = softMesh(.52, .15, .36, .3, black, phone, 0, .075, 0);
    var bodyTop = TP.box(.44, .025, .30, black, phone, 0, .16, 0, true, true, .002); bodyTop.rotation.x = -.12;
    var handset = new T.Mesh(new T.CylinderGeometry(.075, .08, .40, 10), black);
    handset.rotation.z = Math.PI / 2; handset.position.set(0, .26, -.02); phone.add(handset); TP.ink(handset, .0022);
    for (var e = -1; e <= 1; e += 2) {
      var ear = new T.Mesh(new T.SphereGeometry(.10, 10, 8), black);
      ear.scale.set(1.25, .8, 1); ear.position.set(e * .21, .255, -.02); phone.add(ear); TP.ink(ear, .0022);
    }
    // rotary dial
    var dial = new T.Mesh(new T.CylinderGeometry(.12, .12, .015, 20), TP.physical(0x131313, { roughness: .25, metalness: .2, clearcoat: 1 }));
    dial.rotation.x = Math.PI / 2; dial.position.set(-.14, .16, .17); phone.add(dial);
    var dialFace = new T.Mesh(new T.CircleGeometry(.10, 24), TP.basic(0xd8cdb6));
    dialFace.position.set(-.14, .166, .181); phone.add(dialFace);
    for (var d = 0; d < 10; d++) {
      var hole = new T.Mesh(new T.CircleGeometry(.011, 8), TP.basic(0x1a1814));
      var aa = d / 10 * Math.PI * 2;
      hole.position.set(-.14 + Math.cos(aa) * .056, .167, .181 + Math.sin(aa) * .056);
      hole.rotation.x = 0; hole.scale.z = 1;
      phone.add(hole);
    }
    var coil = new T.Mesh(new T.TorusGeometry(.10, .012, 5, 24, Math.PI * 3.2), black);
    coil.rotation.x = Math.PI / 2; coil.rotation.z = .4; coil.position.set(.24, .13, .12); phone.add(coil);
    TP.ink(phone, .0022);
    F.sideTable = g;
    return g;
  }

  /* glass coffee table & coffee ------------------------------- */
  function rippleCoffeeTexture() {
    var cv = TP.canvas(256, 256), g = cv.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    var grd = g.createRadialGradient(112, 108, 2, 128, 128, 128);
    grd.addColorStop(0, '#a8743d');
    grd.addColorStop(.32, '#4a2b13');
    grd.addColorStop(.92, '#170d06');
    grd.addColorStop(1, '#100a06');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return TP.texture(cv);
  }

  function makeCoffeeTable(x, z) {
    var g = TP.group(TP.world, x, Rm.floorY, z);
    g.rotation.y = Math.PI / 2; // long axis along z
    var brass = getBrass();
    var glassM = TP.physical(0xacc5c4, {
      metalness: 0, roughness: .035, transparent: true, opacity: .28,
      clearcoat: 1, clearcoatRoughness: .02, side: T.DoubleSide,
      depthWrite: false, envMapIntensity: 2.1
    });
    var top = new T.Mesh(new T.BoxGeometry(2.55, .055, 1.28), glassM);
    top.position.y = .64; top.renderOrder = 4; g.add(top);
    // brass rim
    for (var s = -1; s <= 1; s += 2) {
      var railX = new T.Mesh(new T.BoxGeometry(2.59, .055, .032), brass);
      railX.position.set(0, .64, s * .656); g.add(railX); TP.ink(railX, .0018);
      var railZ = new T.Mesh(new T.BoxGeometry(.032, .055, 1.31), brass);
      railZ.position.set(s * 1.295, .64, 0); g.add(railZ); TP.ink(railZ, .0018);
    }
    // lower shelf
    var shelf = new T.Mesh(new T.BoxGeometry(2.2, .035, 1.03), glassM);
    shelf.position.y = .20; shelf.renderOrder = 4; g.add(shelf);
    // curved legs
    for (var i = -1; i <= 1; i += 2) {
      for (var j = -1; j <= 1; j += 2) {
        var pts = [
          new T.Vector3(i * 1.12, .61, j * .48),
          new T.Vector3(i * 1.16, .32, j * .53),
          new T.Vector3(i * 1.02, .04, j * .48)
        ];
        var leg = TP.curveTube(pts, .026, brass, g, 20, 5);
        leg.castShadow = true; TP.ink(leg, .002);
        var cap = new T.Mesh(new T.SphereGeometry(.036, 8, 6), brass);
        cap.position.set(i * 1.02, .03, j * .48); g.add(cap);
      }
    }
    // coffee service
    var ceramic = TP.physical(0xf1ece1, { roughness: .24, metalness: 0, clearcoat: .6, clearcoatRoughness: .18, envMapIntensity: 1.25 });
    var saucerGroup = TP.group(g, .12, .665, .03);
    var saucer = new T.Mesh(new T.CylinderGeometry(.29, .26, .028, 24), ceramic);
    saucer.position.y = .014; saucer.castShadow = true; saucerGroup.add(saucer); TP.ink(saucer, .0018);
    var saucerIn = new T.Mesh(new T.CylinderGeometry(.20, .20, .008, 24), TP.basic(0xd6cbb8));
    saucerIn.position.y = .031; saucerGroup.add(saucerIn);
    // cup
    var cupGroup = TP.group(saucerGroup, 0, .03, 0);
    var cupBodyGeo = new T.CylinderGeometry(.17, .115, .22, 24, 1, true);
    var cup = new T.Mesh(cupBodyGeo, ceramic);
    cup.position.y = .11; cup.castShadow = true; cupGroup.add(cup); TP.ink(cup, .0018);
    var cupBase = new T.Mesh(new T.CylinderGeometry(.115, .12, .025, 20), ceramic);
    cupBase.position.y = .014; cupGroup.add(cupBase);
    var rim = new T.Mesh(new T.TorusGeometry(.17, .012, 5, 24), ceramic);
    rim.rotation.x = Math.PI / 2; rim.position.y = .22; cupGroup.add(rim);
    var handle = new T.Mesh(new T.TorusGeometry(.088, .018, 6, 16, Math.PI * 1.25), ceramic);
    handle.rotation.y = Math.PI / 2; handle.rotation.z = -.45; handle.position.set(.18, .12, 0); cupGroup.add(handle);
    // black liquid shader
    var liquidMat = new T.ShaderMaterial({
      transparent: true, depthWrite: true, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 }, uTint: { value: new T.Color(0x120b06) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime; uniform vec3 uTint;',
        'void main(){',
        ' vec2 p=vUv-.5; float r=length(p);',
        ' float ring=sin(r*34.0-uTime*2.2+sin(atan(p.y,p.x)*4.0)*2.0);',
        ' float ripple=exp(-r*9.0)*ring*.08;',
        ' vec3 c=uTint + vec3(.16,.10,.042)*smoothstep(.23,.42,r) + vec3(.09,.05,.02)*ripple;',
        ' float glint=pow(max(0.0,1.0-r*3.0),8.0)*0.13;',
        ' c += vec3(.55,.35,.18)*glint;',
        ' gl_FragColor=vec4(c,1.0);',
        '}'
      ].join('\n')
    });
    var liquid = new T.Mesh(new T.CircleGeometry(.158, 32), liquidMat);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.set(0, .213, 0);
    cupGroup.add(liquid);
    F.coffeeLiquid = liquidMat;
    // spoon
    var spoonMat = TP.std(0xc6cad0, { metalness: .9, roughness: .18, envMapIntensity: 2 });
    var spoon = new T.Mesh(new T.BoxGeometry(.30, .012, .045), spoonMat);
    spoon.position.set(.22, .04, .16); spoon.rotation.y = .55; spoon.rotation.x = -.12; saucerGroup.add(spoon);
    var spoonBowl = new T.Mesh(new T.SphereGeometry(.048, 10, 6), spoonMat);
    spoonBowl.scale.set(1, .22, .65); spoonBowl.position.set(.35, .045, .23); saucerGroup.add(spoonBowl);
    TP.ink(spoon, .0016);
    // steam references (effects will drive)
    var smokeTex = TP.Tex.smoke();
    for (var st = 0; st < 3; st++) {
      var sm = new T.Sprite(new T.SpriteMaterial({
        map: smokeTex, color: 0xe6d5bc, transparent: true, opacity: .0,
        depthWrite: false, blending: T.NormalBlending, toneMapped: false
      }));
      sm.scale.set(.30, .5, 1);
      sm.position.set(-.06 + st * .06, .24 + st * .06, -.02);
      cupGroup.add(sm);
      TP.anim.steam.push({ sprite: sm, phase: st * 1.7, base: sm.position.clone(), amp: .045 });
    }
    // a slice of cherry pie on a black plate, beside the coffee
    var piePlateGroup = TP.group(g, -.68, .665, -.14);
    var plateMat = TP.physical(0x111214, { roughness: .22, metalness: .1, clearcoat: .8, clearcoatRoughness: .12, envMapIntensity: 1.2 });
    var plate = new T.Mesh(new T.CylinderGeometry(.34, .30, .028, 26), plateMat);
    plate.position.y = .014; piePlateGroup.add(plate); TP.ink(plate, .0018);
    var pieRim = new T.Mesh(new T.TorusGeometry(.335, .012, 5, 28), getBrass());
    pieRim.rotation.x = Math.PI / 2; pieRim.position.y = .030; piePlateGroup.add(pieRim);
    var crustMat = TP.toon(0xc29043, { rim: .12, rimColor: 0xf2ce8c });
    var fillingMat = TP.physical(0x6d0714, { roughness: .32, metalness: .05, clearcoat: .5, envMapIntensity: .8, emissive: 0x220104, emissiveIntensity: .5 });
    var pie = new T.Mesh(new T.CylinderGeometry(.245, .245, .115, 24, 1, false, 0, Math.PI * 1.12), fillingMat);
    pie.position.set(-.03, .083, .03); pie.rotation.y = .25; piePlateGroup.add(pie); TP.ink(pie, .0016);
    var crustEdge = new T.Mesh(new T.TorusGeometry(.24, .018, 5, 18, Math.PI * 1.12), crustMat);
    crustEdge.rotation.x = Math.PI / 2; crustEdge.position.set(-.03, .142, .03); crustEdge.rotation.z = .25; piePlateGroup.add(crustEdge);
    // lattice strips
    for (var pi2 = 0; pi2 < 3; pi2++) {
      var strip = new T.Mesh(new T.BoxGeometry(.42, .012, .028), crustMat);
      strip.position.set(-.03, .144, .02 + (pi2 - 1) * .075);
      strip.rotation.y = .45 + pi2 * .38;
      piePlateGroup.add(strip);
    }
    var pieGlow = TP.addGlow(g, TP.Tex.glow(), 0xff7a4a, .8, .06, -.68, .82, -.14, false);
    F.coffeeTable = g;
    return g;
  }

  /* floor lamp ------------------------------------------------ */
  function makeFloorLamp(x, z) {
    var g = TP.group(TP.world, x, Rm.floorY, z);
    var brass = getBrass();
    var base = new T.Mesh(new T.CylinderGeometry(.30, .38, .08, 20), brass);
    base.position.y = .04; base.receiveShadow = true; g.add(base); TP.ink(base, .0023);
    var base2 = new T.Mesh(new T.CylinderGeometry(.23, .29, .08, 18), brass);
    base2.position.y = .11; g.add(base2); TP.ink(base2, .0022);
    var stem = new T.Mesh(new T.CylinderGeometry(.035, .055, 3.55, 10), brass);
    stem.position.y = 1.9; stem.castShadow = true; g.add(stem); TP.ink(stem, .0022);
    for (var r = 0; r < 4; r++) {
      var ring = new T.Mesh(new T.TorusGeometry(.062 - r * .004, .008, 5, 12), brass);
      ring.rotation.x = Math.PI / 2; ring.position.y = .55 + r * .55; g.add(ring);
    }
    var neck = new T.Mesh(new T.CylinderGeometry(.045, .035, .35, 8), brass);
    neck.position.y = 3.76; g.add(neck);
    // fabric shade
    var shadeMat = new T.MeshPhysicalMaterial({
      color: 0x8f4b28, map: TP.Tex.velvet(), roughness: .58,
      transparent: true, opacity: .92, side: T.DoubleSide,
      emissive: 0xff8b3e, emissiveIntensity: .32, sheen: .4, sheenColor: 0xff9960
    });
    var shadeGeo = new T.CylinderGeometry(.38, .59, .85, 24, 3, true);
    var shade = new T.Mesh(shadeGeo, shadeMat);
    shade.position.y = 4.15; shade.castShadow = false; g.add(shade); TP.ink(shade, .0025);
    var shadeTop = new T.Mesh(new T.TorusGeometry(.38, .023, 6, 24), brass);
    shadeTop.rotation.x = Math.PI / 2; shadeTop.position.y = 4.58; g.add(shadeTop);
    var shadeBottom = new T.Mesh(new T.TorusGeometry(.59, .022, 6, 24), brass);
    shadeBottom.rotation.x = Math.PI / 2; shadeBottom.position.y = 3.73; g.add(shadeBottom);
    // fringe strip
    var fringe = new T.Mesh(new T.CylinderGeometry(.61, .61, .22, 24, 1, true), new T.MeshBasicMaterial({
      map: TP.Tex.velvetDeep(), side: T.DoubleSide, transparent: true, opacity: .8, depthWrite: false
    }));
    fringe.position.y = 3.64; g.add(fringe);
    // glowing bulb and light
    var bulbMat = new T.MeshBasicMaterial({ color: 0xffd8a0, toneMapped: false });
    var bulb = new T.Mesh(new T.SphereGeometry(.12, 12, 8), bulbMat);
    bulb.position.y = 4.05; g.add(bulb);
    var glowTex = TP.Tex.glow();
    var glow = TP.addGlow(g, glowTex, 0xff9c54, 3.4, .5, 0, 4.05, .1, false);
    var light = new T.PointLight(0xffb66c, 1.35, 8.0, 2);
    light.position.set(0, 3.95, .25); g.add(light);
    var spot = new T.SpotLight(0xffb56b, .9, 7.5, .75, .9, 1.4);
    spot.position.set(0, 4.05, .1); spot.target.position.set(0, 0, .7); g.add(spot); g.add(spot.target);
    F.lamp = {
      group: g, light: light, spot: spot, shadeMat: shadeMat, glow: glow,
      bulbMat: bulbMat, baseIntensity: 1.35, baseSpot: .72
    };
    return g;
  }

  /* pedestals & statues --------------------------------------- */
  function makePedestal(x, z, h, r) {
    var g = TP.group(TP.world, x, Rm.floorY, z);
    var mb = marbleBlack();
    var brass = getBrass();
    var foot = new T.Mesh(new T.CylinderGeometry(r * 1.18, r * 1.30, .12, 8), mb);
    foot.position.y = .06; foot.castShadow = true; g.add(foot); TP.ink(foot, .0023);
    var base = new T.Mesh(new T.CylinderGeometry(r * 1.08, r * 1.18, .14, 8), mb);
    base.position.y = .16; g.add(base); TP.ink(base, .0023);
    var shaft = new T.Mesh(new T.CylinderGeometry(r * .82, r * .92, h - .48, 8), mb);
    shaft.position.y = .24 + (h - .48) / 2; shaft.castShadow = true; g.add(shaft); TP.ink(shaft, .0023);
    var cap = new T.Mesh(new T.CylinderGeometry(r * 1.05, r * 1.0, .12, 8), mb);
    cap.position.y = h - .12; g.add(cap); TP.ink(cap, .0023);
    var topPlate = new T.Mesh(new T.CylinderGeometry(r * 1.12, r * 1.12, .055, 16), mb);
    topPlate.position.y = h - .03; topPlate.receiveShadow = true; g.add(topPlate); TP.ink(topPlate, .0022);
    var band = new T.Mesh(new T.TorusGeometry(r * 1.14, .015, 5, 24), brass);
    band.rotation.x = Math.PI / 2; band.position.y = h - .005; g.add(band);
    // little gold plaque facing +z
    var plaque = new T.Mesh(new T.PlaneGeometry(.42, .17), TP.basic(0xffffff, { map: TP.Tex.plaque() }));
    plaque.position.set(0, h * .58, r * .86);
    g.add(plaque);
    return { group: g, top: h };
  }

  function addVenus(parent, baseY) {
    var marble = marbleWhite();
    var g = TP.group(parent, 0, baseY, 0);
    var local = TP.group(g, 0, 0, 0);
    local.scale.setScalar(1.04);
    // fluted skirt via lathe
    var profile = [
      new T.Vector2(.33, 0), new T.Vector2(.39, .06), new T.Vector2(.34, .24),
      new T.Vector2(.29, .52), new T.Vector2(.26, .82), new T.Vector2(.22, 1.0)
    ];
    var skirt = new T.Mesh(new T.LatheGeometry(profile, 22), marble);
    skirt.castShadow = true; skirt.receiveShadow = true; local.add(skirt); TP.ink(skirt, .0022);
    // vertical drapery ridges
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2;
      var rr = .315;
      var ridge = new T.Mesh(new T.CylinderGeometry(.008, .015, .9, 4), marble);
      ridge.position.set(Math.cos(a) * rr, .48, Math.sin(a) * rr * .9);
      ridge.rotation.z = Math.cos(a) * .09;
      ridge.rotation.x = Math.sin(a) * .09;
      local.add(ridge);
    }
    // waist / torso
    var tprof = [
      new T.Vector2(.20, .96), new T.Vector2(.19, 1.08), new T.Vector2(.24, 1.22),
      new T.Vector2(.29, 1.36), new T.Vector2(.27, 1.47), new T.Vector2(.17, 1.54)
    ];
    var torso = new T.Mesh(new T.LatheGeometry(tprof, 20), marble);
    torso.scale.z = .7;
    torso.castShadow = true; local.add(torso); TP.ink(torso, .0022);
    // chest volume
    for (var s = -1; s <= 1; s += 2) {
      var chest = new T.Mesh(new T.SphereGeometry(.12, 12, 8), marble);
      chest.scale.set(1, .85, .66);
      chest.position.set(s * .105, 1.36, .12);
      local.add(chest);
    }
    // shoulders / broken arms
    var shoulder = new T.Mesh(new T.SphereGeometry(.27, 14, 9), marble);
    shoulder.scale.set(1.1, .46, .66); shoulder.position.y = 1.56; local.add(shoulder);
    TP.ink(shoulder, .0022);
    for (var arm = -1; arm <= 1; arm += 2) {
      var stub = new T.Mesh(new T.CylinderGeometry(.085, .12, .28, 8), marble);
      stub.position.set(arm * .31, 1.46, .0);
      stub.rotation.z = arm * .42;
      local.add(stub); TP.ink(stub, .0022);
      var cut = new T.Mesh(new T.CylinderGeometry(.082, .088, .025, 8), TP.toon(0xcac3b3, {}));
      cut.position.set(arm * .36, 1.36, 0); cut.rotation.z = arm * .42; local.add(cut);
    }
    // neck
    var neck = new T.Mesh(new T.CylinderGeometry(.072, .10, .24, 10), marble);
    neck.position.y = 1.66; local.add(neck);
    // head & hair
    var head = new T.Mesh(new T.SphereGeometry(.155, 16, 12), marble);
    head.scale.set(.84, 1.08, .90); head.position.y = 1.87; local.add(head); TP.ink(head, .0022);
    var nose = new T.Mesh(new T.ConeGeometry(.027, .10, 6), marble);
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.86, .145); local.add(nose);
    var hair = new T.Mesh(new T.SphereGeometry(.17, 16, 12), marble);
    hair.scale.set(.9, .9, .65); hair.position.set(0, 1.91, -.045); local.add(hair);
    var bun = new T.Mesh(new T.SphereGeometry(.095, 12, 9), marble);
    bun.position.set(0, 2.0, -.155); local.add(bun);
    var band = new T.Mesh(new T.TorusGeometry(.14, .012, 4, 18), getGold());
    band.rotation.x = Math.PI / 2.4; band.position.y = 1.97; local.add(band);
    // lower plinth
    var plinth = new T.Mesh(new T.CylinderGeometry(.32, .36, .07, 20), TP.physical(0x181614, { roughness: .3, metalness: .2, clearcoat: .4 }));
    plinth.position.y = .035; local.add(plinth); TP.ink(plinth, .0023);
    g.rotation.y = -.22;
    return { group: g, height: 2.05 * .92 };
  }

  function makeCaduceusStaff(mat) {
    var g = TP.group();
    var staff = new T.Mesh(new T.CylinderGeometry(.015, .020, 1.7, 8), mat);
    staff.position.y = .85; g.add(staff); TP.ink(staff, .0018);
    // snakes - helix tubes
    for (var s = -1; s <= 1; s += 2) {
      var pts = [];
      for (var i = 0; i <= 34; i++) {
        var t = i / 34;
        var a = t * Math.PI * 3.4 + (s > 0 ? 0 : Math.PI);
        var rad = .075 * (1 - t * .40);
        pts.push(new T.Vector3(Math.cos(a) * rad, .48 + t * .92, Math.sin(a) * rad));
      }
      var snake = TP.curveTube(pts, .014, mat, g, 40, 4);
      snake.castShadow = true;
    }
    // top wings
    for (var w = -1; w <= 1; w += 2) {
      var wing = new T.Mesh(new T.SphereGeometry(.09, 10, 6), mat);
      wing.scale.set(1.9, .32, .45);
      wing.position.set(w * .14, 1.48, 0); wing.rotation.z = w * -.32; g.add(wing); TP.ink(wing, .0018);
    }
    return g;
  }

  function addMercury(parent, baseY) {
    var marble = marbleWhite();
    var g = TP.group(parent, 0, baseY, 0);
    var local = TP.group(g, 0, 0, 0);
    local.scale.setScalar(1.03);
    function limb(a, b, r1, r2, mat) {
      var d = new T.Vector3().subVectors(b, a);
      var len = d.length();
      var m = new T.Mesh(new T.CylinderGeometry(r2, r1, len, 7), mat);
      m.position.copy(a).addScaledVector(d, .5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
      m.castShadow = true; m.receiveShadow = true;
      local.add(m); TP.ink(m, .0019);
      return m;
    }
    // base
    var base = new T.Mesh(new T.CylinderGeometry(.28, .34, .06, 18), marble);
    base.position.y = .03; local.add(base); TP.ink(base, .0021);
    // legs
    var hipL = new T.Vector3(-.12, .98, 0), kneeL = new T.Vector3(-.15, .54, .03), ankleL = new T.Vector3(-.13, .08, .06);
    var hipR = new T.Vector3(.12, .98, 0), kneeR = new T.Vector3(.22, .58, .14), ankleR = new T.Vector3(.28, .12, .32);
    limb(hipL, kneeL, .085, .06, marble); limb(kneeL, ankleL, .06, .038, marble);
    limb(hipR, kneeR, .085, .06, marble); limb(kneeR, ankleR, .06, .038, marble);
    var jointL = new T.Mesh(new T.SphereGeometry(.07, 10, 7), marble); jointL.position.copy(kneeL); local.add(jointL);
    var jointR = new T.Mesh(new T.SphereGeometry(.07, 10, 7), marble); jointR.position.copy(kneeR); local.add(jointR);
    // feet
    var footL = new T.Mesh(new T.SphereGeometry(.10, 10, 6), marble); footL.scale.set(1.7, .55, 1.0); footL.position.set(-.13, .055, .15); local.add(footL); TP.ink(footL, .0018);
    var footR = new T.Mesh(new T.SphereGeometry(.10, 10, 6), marble); footR.scale.set(1.7, .55, 1.0); footR.position.set(.29, .07, .41); footR.rotation.y = .45; local.add(footR); TP.ink(footR, .0018);
    // winged sandals
    for (var fs = 0; fs < 2; fs++) {
      var wg = new T.Mesh(new T.SphereGeometry(.055, 8, 5), marble);
      wg.scale.set(2.2, .22, .54);
      wg.position.set(fs ? .20 : -.22, .10, fs ? .28 : .0);
      wg.rotation.z = fs ? -.4 : .4; local.add(wg);
    }
    // pelvis
    var pelvis = new T.Mesh(TP.puddingGeo(.34, .30, .24, .4, 16, 10), marble);
    pelvis.position.y = 1.02; local.add(pelvis); TP.ink(pelvis, .0019);
    // torso
    var torso = new T.Mesh(TP.puddingGeo(.46, .64, .27, .4, 18, 12), marble);
    torso.position.set(-.015, 1.39, .01);
    torso.rotation.z = -.035; local.add(torso); TP.ink(torso, .002);
    // chest definition
    for (var pc = -1; pc <= 1; pc += 2) {
      var pec = new T.Mesh(new T.SphereGeometry(.11, 10, 7), marble);
      pec.scale.set(1.25, .6, .42); pec.position.set(pc * .1, 1.5, .12); local.add(pec);
    }
    // shoulders
    var shoulderL = new T.Vector3(-.28, 1.58, 0), shoulderR = new T.Vector3(.27, 1.58, .01);
    var shL = new T.Mesh(new T.SphereGeometry(.12, 10, 8), marble); shL.position.copy(shoulderL); local.add(shL);
    var shR = new T.Mesh(new T.SphereGeometry(.12, 10, 8), marble); shR.position.copy(shoulderR); local.add(shR);
    // arms: left down, right raised holding caduceus
    var elbowL = new T.Vector3(-.43, 1.23, .08), wristL = new T.Vector3(-.50, .90, .19);
    limb(shoulderL, elbowL, .07, .052, marble); limb(elbowL, wristL, .052, .035, marble);
    var handL = new T.Mesh(new T.SphereGeometry(.055, 8, 6), marble); handL.scale.set(.65, 1.2, .7); handL.position.copy(wristL); local.add(handL);
    var elbowR = new T.Vector3(.43, 1.42, .14), wristR = new T.Vector3(.35, 1.30, .35);
    limb(shoulderR, elbowR, .07, .052, marble); limb(elbowR, wristR, .052, .035, marble);
    var handR = new T.Mesh(new T.SphereGeometry(.055, 8, 6), marble); handR.scale.set(.7, 1.1, .8); handR.position.copy(wristR); local.add(handR);
    // neck / head
    var neck = new T.Mesh(new T.CylinderGeometry(.065, .09, .18, 10), marble);
    neck.position.y = 1.74; local.add(neck);
    var head = new T.Mesh(new T.SphereGeometry(.13, 16, 10), marble);
    head.scale.set(.82, 1.06, .82); head.position.set(0, 1.88, 0); local.add(head); TP.ink(head, .0019);
    var nose = new T.Mesh(new T.ConeGeometry(.02, .07, 5), marble);
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.87, .11); local.add(nose);
    // helmet
    var helmet = new T.Mesh(new T.SphereGeometry(.135, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), marble);
    helmet.scale.set(1.02, .85, 1.0); helmet.position.set(0, 1.92, -.01); local.add(helmet);
    for (var hw = -1; hw <= 1; hw += 2) {
      var wng = new T.Mesh(new T.SphereGeometry(.08, 8, 5), marble);
      wng.scale.set(2.4, .25, .45);
      wng.position.set(hw * .19, 1.97, -.03);
      wng.rotation.z = hw * .22;
      local.add(wng);
    }
    // caduceus in right hand, extending upward
    var staff = makeCaduceusStaff(marble);
    staff.position.set(.38, 1.27, .4);
    staff.rotation.z = -.10;
    local.add(staff);
    // drape over the left arm
    var drapePts = [];
    for (var i = 0; i < 5; i++) {
      drapePts.push(new T.Vector3(-.30 - i * .045, 1.33 - i * .14, .02 + i * .015));
    }
    var drape = TP.curveTube(drapePts, .065, marble, local, 18, 5);
    drape.castShadow = true;
    g.rotation.y = -.35;
    return { group: g, height: 2.03 * .94 };
  }

  /* clock ----------------------------------------------------- */
  function makeClock(x, y, z, ry) {
    var g = TP.group(TP.world, x, y, z);
    g.rotation.y = ry || 0;
    var wood = TP.toon(0x3b2418, { map: TP.Tex.woodDark(), rim: .12, rimColor: 0x8f7452 });
    var brass = getBrass();
    // chain
    var chainX = 0;
    for (var c = 0; c < 11; c++) {
      var link = new T.Mesh(new T.TorusGeometry(.031, .009, 4, 8), brass);
      link.rotation.x = Math.PI / 2;
      link.rotation.y = c % 2 ? Math.PI / 2 : 0;
      link.position.set(chainX, 1.45 - c * .115, 0);
      g.add(link);
    }
    var caseMesh = new T.Mesh(new T.CylinderGeometry(.55, .55, .18, 28), wood);
    caseMesh.rotation.x = Math.PI / 2;
    caseMesh.position.set(0, 0, 0);
    caseMesh.castShadow = true;
    g.add(caseMesh); TP.ink(caseMesh, .0024);
    var caseBack = new T.Mesh(new T.CylinderGeometry(.62, .60, .08, 28), wood);
    caseBack.rotation.x = Math.PI / 2;
    caseBack.position.z = -.10;
    g.add(caseBack);
    var ring = new T.Mesh(new T.TorusGeometry(.49, .032, 6, 32), brass);
    ring.position.z = .10; g.add(ring);
    var face = new T.Mesh(new T.CircleGeometry(.47, 36), new T.MeshBasicMaterial({ map: TP.Tex.clock(), transparent: true, side: T.DoubleSide, toneMapped: false }));
    face.position.z = .105; g.add(face);
    // glass over face
    var glassM = TP.physical(0xc6ddd8, { roughness: .045, transparent: true, opacity: .12, clearcoat: 1, depthWrite: false, envMapIntensity: 1.4 });
    var glass = new T.Mesh(new T.CircleGeometry(.475, 36), glassM);
    glass.position.z = .13; glass.renderOrder = 8; g.add(glass);
    // hands (fixed, second hand can tick)
    function hand(len, width, mat) {
      var pivot = TP.group(g, 0, 0, .135);
      var m = new T.Mesh(new T.BoxGeometry(width, len, .012), mat);
      m.position.y = len / 2 - .03;
      pivot.add(m);
      TP.ink(m, .0012);
      return pivot;
    }
    var hour = hand(.24, .035, getBrass());
    var minute = hand(.34, .022, getBrass());
    var second = hand(.38, .008, TP.std(0xd8c8a2, { metalness: .4, roughness: .3 }));
    hour.rotation.z = -(4 + 17 / 60) / 12 * Math.PI * 2;
    minute.rotation.z = -(17 / 60) * Math.PI * 2;
    second.rotation.z = -(37 / 60) * Math.PI * 2;
    var hub = new T.Mesh(new T.SphereGeometry(.04, 8, 6), brass);
    hub.position.z = .15; g.add(hub);
    // lower pendulum box
    var boxW = .62, boxH = .88;
    var pendBox = TP.box(boxW, boxH, .16, wood, g, 0, -.86, -.02, true, true, .0024);
    var pendFace = new T.Mesh(new T.PlaneGeometry(boxW - .13, boxH - .13), TP.physical(0x1b1510, { roughness: .6, metalness: .1 }));
    pendFace.position.set(0, -.86, .067); g.add(pendFace);
    var pendulum = TP.group(g, 0, -.50, .095);
    var rod = new T.Mesh(new T.CylinderGeometry(.012, .012, .58, 5), brass);
    rod.position.y = -.27; pendulum.add(rod);
    var bob = new T.Mesh(new T.CylinderGeometry(.12, .12, .025, 18), brass);
    bob.rotation.x = Math.PI / 2; bob.position.y = -.58; pendulum.add(bob);
    var topFinial = new T.Mesh(new T.ConeGeometry(.09, .22, 8), wood);
    topFinial.position.set(0, .67, 0); g.add(topFinial);
    var sideFinialL = new T.Mesh(new T.SphereGeometry(.065, 8, 6), brass); sideFinialL.position.set(-.61, .12, 0); g.add(sideFinialL);
    var sideFinialR = sideFinialL.clone(); sideFinialR.position.x = .61; g.add(sideFinialR);
    F.clock = { group: g, second: second, pendulum: pendulum, face: face };
    return g;
  }

  /* Saturn ---------------------------------------------------- */
  function makeSaturn() {
    var g = TP.group(TP.world, 0, Rm.floorY + 2.85, -1.1);
    var gold = TP.std(0xd6a948, { metalness: .92, roughness: .22, envMapIntensity: 2.3, emissive: 0x2d1804, emissiveIntensity: .24 });
    var planet = new T.Mesh(new T.SphereGeometry(.34, 24, 16), gold);
    planet.castShadow = true; g.add(planet); TP.ink(planet, .0022);
    var ringMat = TP.physical(0xd5b15d, {
      color: 0xd5b15d, metalness: .75, roughness: .3,
      transparent: true, opacity: .86, side: T.DoubleSide,
      emissive: 0x3e2606, emissiveIntensity: .5, envMapIntensity: 1.8
    });
    for (var r = 0; r < 2; r++) {
      var ring = new T.Mesh(new T.TorusGeometry(.50 + r * .11, r === 0 ? .035 : .012, 6, 64), ringMat);
      ring.rotation.x = 1.18; ring.rotation.y = -.15; ring.rotation.z = .28;
      ring.castShadow = false; g.add(ring);
    }
    var glow = TP.addGlow(g, TP.Tex.glow(), 0xffd17a, 2.8, .24, 0, 0, 0, false);
    F.saturn = { group: g, planet: planet, glow: glow, baseY: Rm.floorY + 2.85 };
    return g;
  }

  /* build all ------------------------------------------------- */
  F.build = function (scene) {
    RmRoot = TP.Room.root;
    // seats
    makeSofa({ x: -2.38, z: -1.16, ry: Math.PI / 2 - .31, width: 3.15 });
    makeArmchair({ x: 2.35, z: -.62, ry: -Math.PI / 2 + .30, width: 1.66 });
    // centerpiece table + service
    makeCoffeeTable(0, -1.15);
    makeSideTable(-3.72, .25);
    // floor lamp warm beacon at the right edge
    makeFloorLamp(3.74, -.72);
    // statues
    var pedL = makePedestal(-3.38, -2.98, 1.16, .38);
    var venus = addVenus(pedL.group, pedL.top);
    var pedR = makePedestal(3.36, -2.96, 1.12, .36);
    var mercury = addMercury(pedR.group, pedR.top);
    // hanging clock
    makeClock(-2.15, 6.12, -4.18);
    // floating gold Saturn
    makeSaturn();
    // warm halo of lamp
    F.lampHalo = TP.addGlow(TP.Room.root, TP.Tex.glow(), 0xffa75c, 4.8, .22, 4.02, Rm.floorY + 3.1, 1.9, false);
    F.lampHalo.material.depthWrite = false;
    return F;
  };
  var RmRoot;
})();
