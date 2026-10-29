/* =========================================================================
   FBC QUARRY 07 — the control room suspended inside the inverted apex
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE, Tex = FQ.Tex, PAL = FQ.PAL;
  var I = FQ.interior = {};
  var rng = FQ.rng(0xc0a7e0);
  var mats = {};
  var screenMats = [];
  var flickerLights = [];
  var reels = [];
  var clockHands = [];
  var fans = [];

  var dims = { yFloor: 10.95, yCeil: 15.18, zBack: -2.14, zFront: 2.72, halfBottom: 2.6, halfTop: 4.86 };

  function wallPanel(w, h, mat) {
    return new T.Mesh(new T.PlaneGeometry(w, h), mat);
  }

  function makeScreenMat(texture, tint, opts) {
    opts = opts || {};
    var m = new T.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uSeed: { value: opts.seed || rng() * 10 },
        uTint: { value: new T.Color(tint || 0x9df0ce) },
        uGain: { value: opts.gain === undefined ? 1.1 : opts.gain },
        uScan: { value: opts.scan === undefined ? .075 : opts.scan }
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform sampler2D uMap; uniform float uTime,uSeed,uGain,uScan; uniform vec3 uTint;',
        'void main(){',
        '  vec2 uv=vUv;',
        '  uv.x+=sin(uTime*.23+uSeed)*.0012;',
        '  vec3 tex=pow(texture2D(uMap,uv).rgb,vec3(2.2));',
        '  float scan=.94+uScan*sin((vUv.y+uTime*.13)*560.0);',
        '  float band=1.0+0.22*exp(-pow((fract(vUv.y-uTime*.125)-.5)*16.0,2.0));',
        '  float flick=.93+.07*sin(uTime*31.0+uSeed)*sin(uTime*7.0+uSeed*2.1);',
        '  vec3 c=tex*uTint*scan*band*flick*uGain;',
        '  gl_FragColor=vec4(c,1.0);',
        '}'
      ].join('\n')
    });
    screenMats.push(m);
    return m;
  }

  function makeMaterials() {
    mats.wall = FQ.toon(0x4f554c, {
      map: FQ.repeatTex(Tex.controlWall, 2.4, 2.4), bumpMap: FQ.repeatTex(Tex.controlWall, 2.4, 2.4), bumpScale: .026,
      gradientMap: FQ.gradSoft, side: T.DoubleSide
    });
    mats.wallDark = FQ.toon(0x2b312d, {
      map: FQ.repeatTex(Tex.controlWall, 2, 2), bumpMap: FQ.repeatTex(Tex.controlWall, 2, 2), bumpScale: .03,
      gradientMap: FQ.gradHard, side: T.DoubleSide
    });
    mats.ceiling = FQ.toon(0x181d1b, {
      map: FQ.repeatTex(Tex.concreteDark, 2, 2), gradientMap: FQ.gradHard
    });
    mats.floor = FQ.std(0x3c443e, {
      map: Tex.controlFloor, roughness: .36, metalness: .15, envMapIntensity: .9,
      bumpMap: Tex.controlFloor, bumpScale: .012
    });
    mats.floorTrim = FQ.iron(0x1a2020, .4);
    mats.desk = FQ.toon(0x343a35, { map: FQ.repeatTex(Tex.steel, 1.2, 1.2), bumpMap: FQ.repeatTex(Tex.steel, 1.2, 1.2), bumpScale: .01, gradientMap: FQ.gradHard });
    mats.deskTop = FQ.toon(0x141917, { map: FQ.repeatTex(Tex.steel, 1.1, 1.1), gradientMap: FQ.gradHard, ink: .26 });
    mats.wood = FQ.toon(0x5d4633, { map: FQ.repeatTex(Tex.rust, .8, .8), gradientMap: FQ.gradHard });
    mats.beige = FQ.toon(0x7e8378, { map: FQ.repeatTex(Tex.controlWall, 1.2, .8), gradientMap: FQ.gradSoft });
    mats.cream = FQ.toon(0x9e9988, { gradientMap: FQ.gradSoft });
    mats.crt = FQ.toon(0xa7a18f, { map: FQ.repeatTex(Tex.crtBezel, 1, 1), gradientMap: FQ.gradHard });
    mats.crtDark = FQ.toon(0x282e2b, { map: FQ.repeatTex(Tex.crtBezel, 1, 1), gradientMap: FQ.gradHard });
    mats.black = FQ.toon(0x101414, { gradientMap: FQ.gradHard });
    mats.rubber = FQ.std(0x101313, { roughness: .8, metalness: .1 });
    mats.steel = FQ.steel(0x505958, .36);
    mats.steelDark = FQ.iron(0x161c1c, .45);
    mats.brass = FQ.brass(0xb49255, .28);
    mats.red = FQ.toon(0x782925, { gradientMap: FQ.gradHard, rim: .1, rimColor: 0xe95d4a });
    mats.redGlow = FQ.basic(0xff3e28, { transparent: true, opacity: .8, blending: T.AdditiveBlending, toneMapped: false });
    mats.amberGlow = FQ.basic(0xffa257, { transparent: true, opacity: .9, toneMapped: false });
    mats.greenGlow = FQ.basic(0x81f0c7, { transparent: true, opacity: .8, toneMapped: false });
    mats.darkGlass = new T.MeshPhysicalMaterial({ color: 0x273330, metalness: .1, roughness: .08, transparent: true, opacity: .38, clearcoat: 1, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.0 });
    mats.cable = FQ.iron(0x121616, .65);
    mats.paper = FQ.toon(0xd0c5aa, { side: T.DoubleSide, gradientMap: FQ.gradSoft });
  }

  function addBox(parent, w, h, d, mat, x, y, z, outline) {
    var m = FQ.box(w, h, d, mat, outline === undefined ? true : outline, .0012);
    m.position.set(x, y, z); parent.add(m); return m;
  }

  function buildShell(group) {
    // floor slab and edge lip
    var floor = FQ.box(5.28, .18, 4.95, mats.floor, false);
    floor.position.set(0, dims.yFloor - .09, .18); floor.receiveShadow = true; group.add(floor);
    var floorFront = FQ.box(5.28, .06, .18, mats.floorTrim, false);
    floorFront.position.set(0, dims.yFloor - .01, 2.61); group.add(floorFront);
    var floorBack = FQ.box(5.28, .06, .14, mats.floorTrim, false);
    floorBack.position.set(0, dims.yFloor - .01, -2.1); group.add(floorBack);
    for (var f = -1; f <= 1; f += 2) {
      var sideTrim = FQ.box(.14, .06, 4.9, mats.floorTrim, false);
      sideTrim.position.set(f * 2.63, dims.yFloor - .01, .18); group.add(sideTrim);
      var led = FQ.box(.03, .025, 4.5, f === 1 ? mats.redGlow : mats.greenGlow, false);
      led.position.set(f * 2.56, dims.yFloor + .015, .18); group.add(led);
    }

    // back wall (trapezoid, generated as two triangles)
    var bw = new T.BufferGeometry();
    var bp = [
      -2.62, dims.yFloor, dims.zBack, 2.62, dims.yFloor, dims.zBack,
      4.86, dims.yCeil, dims.zBack, -4.86, dims.yCeil, dims.zBack
    ];
    var buv = [0, 0, 1, 0, 1, 1, 0, 1];
    bw.setAttribute('position', new T.Float32BufferAttribute(bp, 3));
    bw.setAttribute('uv', new T.Float32BufferAttribute(buv, 2));
    bw.setIndex([0, 1, 2, 0, 2, 3]); bw.computeVertexNormals();
    var backWall = new T.Mesh(bw, mats.wall); backWall.receiveShadow = true; group.add(backWall);
    var backBase = FQ.box(5.35, .9, .15, mats.wallDark, false);
    backBase.position.set(0, dims.yFloor + .46, dims.zBack + .04); group.add(backBase);
    var backBaseTrim = FQ.box(5.35, .045, .17, mats.brass, false);
    backBaseTrim.position.set(0, dims.yFloor + .92, dims.zBack + .05); group.add(backBaseTrim);

    // slanted side walls, expanding with pyramid geometry
    function sideWall(sign) {
      var geo = new T.BufferGeometry();
      var verts = [
        sign * 2.62, dims.yFloor, dims.zBack + .01,
        sign * 2.62, dims.yFloor, 2.72,
        sign * 4.86, dims.yCeil, 6.18,
        sign * 4.86, dims.yCeil, dims.zBack + .01
      ];
      var uv = [0, 0, 1, 0, 1, 1, 0, 1];
      geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      var m = new T.Mesh(geo, mats.wall); m.receiveShadow = true; group.add(m);
      // horizontal structural seams
      for (var k = 0; k < 3; k++) {
        var y = dims.yFloor + 1.0 + k * 1.25;
        var t = (y - dims.yFloor) / (dims.yCeil - dims.yFloor);
        var xIn = sign * (2.62 + (4.86 - 2.62) * t);
        var zFront = 2.72 + (6.18 - 2.72) * t;
        var seam = FQ.box(.055, .06, zFront - dims.zBack, mats.steelDark, false);
        seam.position.set(xIn - sign * .012, y, (zFront + dims.zBack) / 2); group.add(seam);
      }
      // vertical conduit
      var conduit = FQ.tube([new T.Vector3(sign * 2.58, dims.yFloor + .15, .8), new T.Vector3(sign * 3.05, 12.2, 1.2), new T.Vector3(sign * 3.6, dims.yCeil - .2, 2.8)], .07, mats.cable, 16, 6);
      group.add(conduit);
    }
    sideWall(-1); sideWall(1);

    // ceiling plane and deep structural beams
    var ceil = FQ.box(9.9, .18, 8.55, mats.ceiling, false);
    ceil.position.set(0, dims.yCeil + .09, 2.02); ceil.receiveShadow = true; group.add(ceil);
    var beamMat = mats.steelDark;
    for (var b = 0; b < 4; b++) {
      var beam = FQ.box(9.3, .25, .18, beamMat, true, .0012);
      beam.position.set(0, dims.yCeil - .06, -1.3 + b * 1.95); group.add(beam);
    }
    var beamLong = FQ.box(.18, .25, 8.1, beamMat, false);
    beamLong.position.set(0, dims.yCeil - .06, 2.0); group.add(beamLong);
    for (var c = -2; c <= 2; c += 2) {
      var col = FQ.box(.23, 4.2, .23, mats.steelDark, true, .0012);
      col.position.set(c * 1.95, dims.yFloor + 2.1, -1.86); group.add(col);
    }
    // heavy front columns / window jambs inside
    for (var s = -1; s <= 1; s += 2) {
      var col2 = FQ.box(.28, 4.2, .3, mats.steelDark, true, .0013);
      col2.position.set(s * 2.5, dims.yFloor + 2.1, 2.45); group.add(col2);
      var brass = FQ.box(.05, 3.4, .05, mats.brass, false);
      brass.position.set(s * 2.34, dims.yFloor + 2.0, 2.56); group.add(brass);
    }
  }

  function buildMonitorWall(group) {
    var z = dims.zBack + .14;
    // casing
    var frame = FQ.box(5.15, 2.72, .20, mats.steelDark, true, .0014);
    frame.position.set(0, 13.05, z - .08); group.add(frame);
    var inset = FQ.box(4.94, 2.50, .06, mats.black, false);
    inset.position.set(0, 13.05, z + .04); group.add(inset);
    var screenMat = makeScreenMat(Tex.monitorWall, 0xffffff, { seed: 4.2, gain: 1.72, scan: .022 });
    var screen = new T.Mesh(new T.PlaneGeometry(4.72, 2.36), screenMat);
    screen.position.set(0, 13.07, z + .075); group.add(screen);
    // physical mullions across the big wall map
    for (var mx = 1; mx <= 2; mx++) {
      var bar = FQ.box(.045, 2.36, .06, mats.steelDark, false); bar.position.set(-.79 + mx * .79, 13.07, z + .085); group.add(bar);
    }
    var hbar = FQ.box(4.72, .045, .06, mats.steelDark, false); hbar.position.set(0, 13.07, z + .085); group.add(hbar);
    // glass sheen strip
    var sheen = new T.Mesh(new T.PlaneGeometry(4.6, .25), FQ.basic(0xd6e8dd, { transparent: true, opacity: .025, blending: T.AdditiveBlending, depthWrite: false }));
    sheen.position.set(0, 14.26, z + .09); sheen.rotation.z = -.035; group.add(sheen);
    // emergency light bars flanking the display, readable from outside
    for (var es = -1; es <= 1; es += 2) {
      var ebox = FQ.box(.26, 1.5, .16, mats.steelDark, true, .001); ebox.position.set(es * 2.72, 13.0, z - .02); group.add(ebox);
      var eglow = FQ.box(.17, 1.22, .04, FQ.basic(0xff3523, { transparent: true, opacity: .85, blending: T.AdditiveBlending }), false); eglow.position.set(es * 2.72, 13.0, z + .07); group.add(eglow);
      var eglowSprite = FQ.sprite(group, Tex.glow, 0xff3d28, 1.65, .2); eglowSprite.position.set(es * 2.72, 13.0, z + .2);
    }
    // bezel details and lower status strip
    var strip = FQ.box(4.75, .12, .06, FQ.toon(0x252b28), false);
    strip.position.set(0, 11.805, z + .07); group.add(strip);
    for (var s = 0; s < 6; s++) {
      var led = FQ.sphere(.024, 8, 6, s === 4 ? mats.redGlow : FQ.basic(0x9ed8a9), false);
      led.position.set(-2.05 + s * .82, 11.82, z + .11); group.add(led);
    }
    // small strip above
    var header = FQ.box(5.3, .24, .24, mats.wallDark, true, .0013); header.position.set(0, 14.51, z - .02); group.add(header);
    var headerLine = FQ.box(4.9, .018, .03, mats.redGlow, false); headerLine.position.set(0, 14.50, z + .11); group.add(headerLine);
    var plaque = makeWallSign('QUARRY CONTROL  /  SITE 07', 'FBC INDUSTRIAL OVERSIGHT  ·  LEVEL 02', 1024, 128, '#d8d0ba', '#191d1c');
    var plaqueMesh = new T.Mesh(new T.PlaneGeometry(3.2, .4), FQ.basic(0xffffff, { map: plaque }));
    plaqueMesh.position.set(0, 14.66, z + .12); group.add(plaqueMesh);

    // warm backlight strips behind monitor
    for (var i = -1; i <= 1; i += 2) {
      var glowStrip = FQ.box(2.1, .045, .04, mats.amberGlow, false);
      glowStrip.position.set(i * 3.0, 12.0, z + .1); group.add(glowStrip);
    }
    // wall clock over left of monitor bank
    buildClock(group, -3.3, 14.35, z + .1);
    // round brass FBC seal on right
    var sealMat = FQ.toon(0x594b31, { gradientMap: FQ.gradHard });
    var seal = new T.Mesh(new T.CircleGeometry(.38, 32), sealMat);
    seal.position.set(3.36, 14.35, z + .09); group.add(seal);
    var sealInset = new T.Mesh(new T.CircleGeometry(.27, 32), mats.black);
    sealInset.position.set(3.36, 14.35, z + .095); group.add(sealInset);
    var sealGlyph = new T.Mesh(new T.ConeGeometry(.16, .28, 3), FQ.basic(0xa83527));
    sealGlyph.rotation.z = Math.PI; sealGlyph.position.set(3.36, 14.33, z + .115); group.add(sealGlyph);
  }

  function makeWallSign(title, sub, W, H, fg, bg) {
    W = W || 1024; H = H || 256;
    var c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = bg || '#1b201f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(201,186,150,.45)'; g.lineWidth = 3; g.strokeRect(7, 7, W - 14, H - 14);
    g.fillStyle = fg || '#d8d0ba'; g.textAlign = 'left';
    g.font = '600 ' + Math.round(H * .23) + 'px "Arial Narrow", Arial, sans-serif';
    g.fillText(title, 28, H * .45);
    g.fillStyle = 'rgba(204,194,169,.55)'; g.font = Math.round(H * .115) + 'px "Courier New", monospace';
    g.fillText(sub, 30, H * .70);
    g.fillStyle = 'rgba(156,58,48,.75)'; g.fillRect(28, H * .77, W * .2, 3);
    g.textAlign = 'right'; g.fillStyle = 'rgba(162,134,88,.7)'; g.font = Math.round(H * .1) + 'px "Courier New", monospace';
    g.fillText('FBC / 07', W - 28, H * .70);
    return FQ.tex(c, {});
  }

  function buildClock(group, x, y, z) {
    var clockFaceMat = FQ.toon(0x3f4038, { gradientMap: FQ.gradHard });
    var face = FQ.cyl(.31, .31, .06, 24, clockFaceMat, true, .0008);
    face.rotation.x = Math.PI / 2; face.position.set(x, y, z); group.add(face);
    var ring = new T.Mesh(new T.TorusGeometry(.32, .022, 6, 24), mats.brass);
    ring.position.set(x, y, z + .035); group.add(ring);
    var hour = FQ.box(.025, .21, .015, mats.black, false); hour.geometry.translate(0, .085, 0);
    hour.position.set(x, y, z + .045); group.add(hour);
    var minute = FQ.box(.014, .27, .012, mats.black, false); minute.geometry.translate(0, .12, 0);
    minute.position.set(x, y, z + .052); group.add(minute);
    var sec = FQ.box(.007, .27, .012, FQ.basic(0xb13d32), false); sec.geometry.translate(0, .12, 0);
    sec.position.set(x, y, z + .06); group.add(sec);
    clockHands.push({ hour: hour, minute: minute, sec: sec });
  }

  function makeCRT(tex, tint, lean, scale) {
    var g = new T.Group();
    var s = scale || 1;
    var body = FQ.box(.56 * s, .46 * s, .42 * s, mats.crt, true, .001);
    g.add(body);
    var front = FQ.box(.5 * s, .4 * s, .04 * s, mats.crtDark, true, .0008);
    front.position.set(0, .005 * s, .221 * s); g.add(front);
    var screenMat = FQ.basic(0xffffff, { map: tex });
    var screen = new T.Mesh(new T.PlaneGeometry(.38 * s, .29 * s), screenMat);
    screen.position.set(0, .015 * s, .244 * s); screen.rotation.x = lean === undefined ? -.10 : lean; g.add(screen);
    screenMats.push(screenMat);
    // knobs
    for (var k = -1; k <= 1; k += 2) {
      var knob = FQ.cyl(.028 * s, .028 * s, .025 * s, 8, mats.steelDark, false);
      knob.rotation.x = Math.PI / 2; knob.position.set(k * .18 * s, -.155 * s, .243 * s); g.add(knob);
    }
    var led = FQ.sphere(.015 * s, 6, 4, FQ.basic(tint === 'amber' ? 0xffa24c : 0x88f1ca), false);
    led.position.set(-.19 * s, -.2 * s, .248 * s); g.add(led);
    // shell top vent grooves
    for (var v = 0; v < 4; v++) {
      var groove = FQ.box(.27 * s, .008, .006, mats.black, false);
      groove.position.set(0, .23 * s, .15 * s - v * .045); g.add(groove);
    }
    g.userData.screen = screen;
    return g;
  }

  function buildMainConsole(group) {
    var floor = dims.yFloor;
    var console = FQ.group(group, 0, floor, .66);
    // base and top
    var base = FQ.box(3.9, .8, 1.32, mats.desk, true, .0015);
    base.position.set(0, .4, 0); console.add(base);
    var frontFace = FQ.box(3.75, .55, .1, mats.deskTop, true, .0012);
    frontFace.position.set(0, .42, .69); console.add(frontFace);
    var top = FQ.box(4.1, .14, 1.45, mats.deskTop, true, .0014);
    top.position.set(0, 1.0, -.01); console.add(top);
    var brass = FQ.box(4.02, .045, .05, mats.brass, false);
    brass.position.set(0, 1.06, .69); console.add(brass);
    var kick = FQ.box(3.7, .08, .06, mats.brass, false);
    kick.position.set(0, .1, .66); console.add(kick);
    // red floor guide reflection under console
    var underGlow = FQ.plane(3.1, .5, FQ.basic(0xff6c39, { transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false }), 1, 1);
    underGlow.rotation.x = -Math.PI / 2; underGlow.position.set(0, .025, .45); console.add(underGlow);
    // under-desk equipment bays
    for (var u = -1; u <= 1; u += 2) {
      var bay = FQ.box(1.2, .55, .1, mats.steelDark, true, .001);
      bay.position.set(u * .95, .35, .67); console.add(bay);
      for (var v = 0; v < 4; v++) {
        var vent = FQ.box(.45, .009, .01, mats.black, false);
        vent.position.set(u * .95, .46 - v * .06, .725); console.add(vent);
      }
      var handle = FQ.box(.16, .025, .04, mats.steel, false);
      handle.position.set(u * .95, .17, .735); console.add(handle);
    }
    // rear riser
    var riser = FQ.box(3.82, .32, .25, mats.desk, true, .0013);
    riser.position.set(0, 1.19, -.52); console.add(riser);
    // CRT row
    var crts = [
      { x: -1.42, tex: Tex.screenA, tint: 'green' }, { x: -.72, tex: Tex.screenB, tint: 'green' },
      { x: 0, tex: Tex.screenC, tint: 'green' }, { x: .72, tex: Tex.screenD, tint: 'amber' },
      { x: 1.42, tex: Tex.screenF, tint: 'green' }
    ];
    for (var c = 0; c < crts.length; c++) {
      var crt = makeCRT(crts[c].tex, crts[c].tint, -.12, c === 2 ? 1.06 : .94);
      crt.position.set(crts[c].x, 1.35, -.37);
      crt.rotation.x = -.19;
      console.add(crt);
      var key = FQ.box(.42, .025, .16, mats.steelDark, false);
      key.position.set(crts[c].x * .86, 1.075, .23); key.rotation.x = -.03; console.add(key);
      for (var r = 0; r < 4; r++) {
        var keys = FQ.box(.31, .012, .012, mats.black, false);
        keys.position.set(crts[c].x * .86, 1.09, .17 + r * .031); console.add(keys);
      }
      // paper / notes
      if (c % 2 === 0) {
        var doc = FQ.plane(.29, .4, mats.paper, 1, 1);
        doc.material = FQ.basic(0xffffff, { map: c === 0 ? Tex.documentA : Tex.documentB, transparent: true, side: T.DoubleSide });
        doc.rotation.x = -Math.PI / 2; doc.rotation.z = .12;
        doc.position.set(crts[c].x + .3, 1.078, .18); console.add(doc);
      }
    }
    // broad command-surface map set into the desk
    var deskInset = FQ.box(3.45, .035, 1.12, mats.black, false);
    deskInset.position.set(0, 1.055, .08); console.add(deskInset);
    var insMat = FQ.basic(0xffffff, { map: makeRedMapCanvas(), transparent: true, opacity: .9 });
    var insetScreen = new T.Mesh(new T.PlaneGeometry(2.55, .76), insMat);
    insetScreen.rotation.x = -Math.PI / 2; insetScreen.position.set(-.15, 1.078, .10); console.add(insetScreen); screenMats.push(insMat);
    var mapRing = FQ.box(2.85, .018, .88, mats.brass, false); mapRing.position.set(-.15, 1.07, .10); console.add(mapRing);
    // shallow keyboard well and button rail
    var keyWell = FQ.box(1.2, .018, .23, mats.steelDark, false); keyWell.position.set(-.15, 1.072, .77); console.add(keyWell);
    for (var kb = 0; kb < 14; kb++) {
      var key = FQ.box(.055, .014, .055, mats.cream, false);
      key.position.set(-.63 + (kb % 7) * .09, 1.085, .74 + Math.floor(kb / 7) * .065); console.add(key);
    }
    for (var rb = 0; rb < 7; rb++) {
      var dot = FQ.sphere(.019, 6, 4, rb % 3 === 0 ? mats.redGlow : (rb % 3 === 1 ? mats.greenGlow : mats.amberGlow), false);
      dot.position.set(1.25 + (rb % 4) * .10, 1.085, .57 + Math.floor(rb / 4) * .12); console.add(dot);
    }
    var displayTrim = FQ.box(2.96, .045, .07, mats.brass, false); displayTrim.position.set(-.15, 1.085, -.35); console.add(displayTrim);
    var displayHood = FQ.box(2.99, .035, .05, mats.steelDark, false); displayHood.position.set(-.15, 1.10, .50);
    // tilted primary console screen over the map table
    var mainScreen = new T.Group(); mainScreen.position.set(0, 1.34, .40); mainScreen.rotation.x = -.46; console.add(mainScreen);
    var msCase = FQ.box(1.16, .54, .1, mats.steelDark, true, .0012); mainScreen.add(msCase);
    var msMat = FQ.basic(0xffffff, { map: Tex.screenB });
    var msScreen = new T.Mesh(new T.PlaneGeometry(1.0, .4), msMat); msScreen.position.z = .055; mainScreen.add(msScreen); screenMats.push(msMat);
    var msGlow = FQ.sprite(mainScreen, Tex.glow, 0x82d6c3, .7, .09); msGlow.position.set(0, 0, .12);
    // scattered reports beside the keyboard
    for (var pr = 0; pr < 3; pr++) {
      var dmat = FQ.basic(0xffffff, { map: pr === 1 ? Tex.documentB : Tex.documentA, transparent: true, side: T.DoubleSide });
      var paper = new T.Mesh(new T.PlaneGeometry(.28, .38), dmat);
      paper.rotation.x = -Math.PI / 2; paper.rotation.z = .22 + pr * .35;
      paper.position.set(-1.5 + pr * .18, 1.082, .58 + pr * .06); console.add(paper);
    }
    // phones
    var phoneBase = FQ.box(.26, .065, .18, mats.black, true, .0008); phoneBase.position.set(-1.85, 1.08, .42); console.add(phoneBase);
    var handset = FQ.box(.25, .065, .07, mats.red, true, .0007); handset.position.set(-1.85, 1.14, .40); handset.rotation.z = .1; console.add(handset);
    var dial = FQ.cyl(.075, .075, .018, 12, mats.cream, false); dial.rotation.x = -Math.PI / 2; dial.position.set(-1.82, 1.117, .48); console.add(dial);
    var phone2 = FQ.box(.23, .06, .16, mats.steelDark, true, .0007); phone2.position.set(1.76, 1.08, .38); console.add(phone2);
    var handset2 = FQ.box(.22, .055, .06, mats.black, false); handset2.position.set(1.76, 1.14, .37); console.add(handset2);
    // mug, ashtray, red binder
    var mug = FQ.cyl(.07, .065, .12, 12, mats.cream, true, .0007); mug.position.set(1.38, 1.12, .18); console.add(mug);
    var binder = FQ.box(.28, .035, .38, mats.red, true, .0007); binder.position.set(-1.9, 1.1, .12); binder.rotation.y = .2; console.add(binder);
    var cup = FQ.cyl(.06, .07, .055, 10, mats.steelDark, false); cup.position.set(.92, 1.08, .53); console.add(cup);
    var ashtray = FQ.cyl(.09, .08, .03, 12, mats.steel, false); ashtray.position.set(.58, 1.08, .38); console.add(ashtray);
    // small desk fan
    var fanBase = FQ.cyl(.1, .11, .06, 12, mats.steelDark, false); fanBase.position.set(-.55, 1.07, .42); console.add(fanBase);
    var fanArm = FQ.cyl(.018, .018, .3, 6, mats.steel, false); fanArm.position.set(-.55, 1.22, .42); console.add(fanArm);
    var fanHead = FQ.group(console, -.55, 1.38, .42);
    var fanRing = new T.Mesh(new T.TorusGeometry(.14, .018, 5, 16), mats.steel); fanRing.rotation.y = 0; fanHead.add(fanRing);
    var blades = FQ.group(fanHead);
    for (var fb = 0; fb < 3; fb++) {
      var blade = FQ.box(.025, .22, .04, mats.steel, false);
      blade.rotation.z = fb * 2.09; blades.add(blade);
    }
    fans.push(blades);
    // cable bundle down back of console
    for (var cb = 0; cb < 4; cb++) {
      var cable = FQ.tube([
        new T.Vector3(-1.4 + cb * .9, dims.yFloor + 1.02, -.7),
        new T.Vector3(-1.3 + cb * .9, dims.yFloor + .45, -.83),
        new T.Vector3(-1.1 + cb * .9, dims.yFloor + .08, -.62)
      ], .018, mats.cable, 10, 4);
      console.add(cable);
    }
    // deliberately empty: the room is between shifts, or maybe it never had one.
    return console;
  }

  function buildChair(x, z) {
    var g = new T.Group(); g.position.set(x, 0, z);
    var seat = FQ.box(.55, .11, .55, mats.rubber, true, .001); seat.position.y = .52; g.add(seat);
    var back = FQ.box(.51, .6, .1, mats.rubber, true, .001); back.position.set(0, .86, .27); back.rotation.x = -.1; g.add(back);
    var stem = FQ.cyl(.055, .07, .3, 8, mats.steelDark, false); stem.position.y = .28; g.add(stem);
    for (var a = 0; a < 5; a++) {
      var arm = FQ.box(.06, .045, .44, mats.steelDark, false);
      arm.position.set(0, .12, 0); arm.rotation.y = a * Math.PI * .4; arm.translateZ(.2); g.add(arm);
      var wheel = FQ.sphere(.055, 6, 4, mats.black, false); wheel.position.set(arm.position.x, .04, arm.position.z); g.add(wheel);
    }
    return g;
  }

  function buildRack(x, z, w, h, d, phase) {
    var g = new T.Group(); g.position.set(x, dims.yFloor, z);
    var body = FQ.box(w, h, d, mats.steelDark, true, .0013); body.position.y = h / 2; g.add(body);
    var face = FQ.box(w - .1, h - .16, .06, mats.black, false); face.position.set(0, h / 2, d / 2 + .02); g.add(face);
    for (var i = 0; i < 11; i++) {
      var y = .22 + i * (h - .45) / 10;
      var led = FQ.box(.035, .018, .015, i % 4 === 0 ? mats.amberGlow : (i % 3 === 0 ? mats.redGlow : mats.greenGlow), false);
      led.position.set(-w * .28 + (i % 3) * .035, y, d / 2 + .06); g.add(led);
      var slot = FQ.box(w - .3, .012, .01, mats.steelDark, false);
      slot.position.set(.08, y, d / 2 + .06); g.add(slot);
    }
    var label = FQ.plane(.18, .055, FQ.basic(0xb7ae92, { map: makeTinyLabel('SERVER 0' + (phase + 1), '#b7ae92', '#232726') }), 1, 1);
    label.position.set(0, h - .12, d / 2 + .065); g.add(label);
    // cable drops from top
    for (var c = 0; c < 3; c++) {
      var cable = FQ.tube([new T.Vector3(-.2 + c * .15, h, -.1), new T.Vector3(-.3 + c * .18, dims.yCeil, -.3), new T.Vector3(-.8 + c * .23, dims.yCeil - .5, -1.3)], .022, mats.cable, 12, 4);
      g.add(cable);
    }
    return g;
  }

  function makeTinyLabel(text, fg, bg) {
    var c = FQ.canvas(256, 64), g = c.getContext('2d');
    g.fillStyle = bg || '#d3cbb8'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = fg || '#232726'; g.font = '600 25px "Courier New", monospace'; g.textAlign = 'center'; g.fillText(text, 128, 42);
    return FQ.tex(c, {});
  }

  function buildFiling(x, z, index) {
    var g = new T.Group(); g.position.set(x, dims.yFloor, z);
    var body = FQ.box(.82, 1.55, .55, mats.desk, true, .0013); body.position.y = .775; g.add(body);
    for (var i = 0; i < 4; i++) {
      var y = .26 + i * .34;
      var drawer = FQ.box(.72, .27, .035, mats.wallDark, true, .0009); drawer.position.set(0, y, .285); g.add(drawer);
      var handle = FQ.box(.27, .035, .035, mats.brass, false); handle.position.set(0, y + .04, .31); g.add(handle);
      var label = FQ.plane(.23, .065, FQ.basic(0xffffff, { map: makeTinyLabel('AWE / 0' + (index * 4 + i + 1), '#d8cfb8', '#242a26') }), 1, 1);
      label.position.set(0, y - .055, .31); g.add(label);
    }
    // folders on top
    var cols = [0x7c3029, 0x9a8454, 0x435952, 0x7d342b];
    for (var f = 0; f < 4; f++) {
      var folder = FQ.box(.62, .035, .42, FQ.toon(cols[f]), true, .0007);
      folder.position.set(-.04 + f * .035, 1.58 + f * .035, 0); folder.rotation.y = -.08 + f * .04; g.add(folder);
    }
    return g;
  }

  function buildTapeDrive(x, z) {
    var g = new T.Group(); g.position.set(x, dims.yFloor, z);
    var body = FQ.box(.92, 1.78, .62, mats.steelDark, true, .0014); body.position.y = .89; g.add(body);
    var face = FQ.box(.8, 1.55, .05, mats.black, false); face.position.set(0, .9, .33); g.add(face);
    // reels
    for (var r = 0; r < 2; r++) {
      var reelGroup = new T.Group(); reelGroup.position.set(-.22 + r * .44, 1.13, .38); g.add(reelGroup);
      var disc = FQ.cyl(.15, .15, .055, 20, mats.steel, true, .0008);
      disc.rotation.x = Math.PI / 2; reelGroup.add(disc);
      var hub = FQ.cyl(.055, .055, .07, 12, mats.brass, false); hub.rotation.x = Math.PI / 2; reelGroup.add(hub);
      for (var sp = 0; sp < 3; sp++) {
        var spoke = FQ.box(.025, .23, .02, mats.steelDark, false);
        spoke.rotation.z = sp * Math.PI / 3; reelGroup.add(spoke);
      }
      reels.push({ group: reelGroup, speed: r === 0 ? .24 : .17 });
    }
    var tapeWindow = FQ.box(.66, .2, .02, mats.darkGlass, false); tapeWindow.position.set(0, .75, .345); g.add(tapeWindow);
    for (var l = 0; l < 4; l++) {
      var led = FQ.box(.03, .02, .015, l % 2 ? mats.greenGlow : mats.redGlow, false);
      led.position.set(-.27 + l * .18, 1.48, .37); g.add(led);
    }
    var label = FQ.plane(.48, .12, FQ.basic(0xffffff, { map: makeTinyLabel('FBC DATA / REEL 07', '#cfc6ae', '#242927') }), 1, 1);
    label.position.set(0, 1.61, .37); g.add(label);
    return g;
  }

  function buildPunchMachine(x, z, rot) {
    var g = new T.Group(); g.position.set(x, dims.yFloor, z); g.rotation.y = rot || 0;
    var base = FQ.box(.8, .85, .62, mats.desk, true, .0013); base.position.y = .425; g.add(base);
    var top = FQ.box(.75, .13, .66, mats.deskTop, true, .0012); top.position.set(0, .9, 0); g.add(top);
    var card = FQ.plane(.38, .19, FQ.basic(0xffffff, { map: Tex.punchCard, side: T.DoubleSide }), 1, 1);
    card.rotation.x = -Math.PI / 2; card.rotation.z = .04; card.position.set(.05, .972, -.02); g.add(card);
    var slot = FQ.box(.4, .04, .08, mats.black, false); slot.position.set(0, .94, .22); g.add(slot);
    var stack = FQ.group(g, -.24, .98, -.25);
    for (var s = 0; s < 9; s++) {
      var c = FQ.box(.34, .012, .2, mats.paper, false); c.position.set(0, s * .012, 0); c.rotation.y = s * .03; stack.add(c);
    }
    for (var k = 0; k < 3; k++) {
      var btn = FQ.cyl(.045, .045, .03, 8, k === 0 ? mats.redGlow : mats.cream, false);
      btn.position.set(-.28 + k * .1, .98, .23); g.add(btn);
    }
    var plate = FQ.plane(.32, .08, FQ.basic(0xffffff, { map: makeTinyLabel('IBM 029 / FBC', '#c5ba9f', '#1d231f') }), 1, 1);
    plate.position.set(0, .55, .32); g.add(plate);
    var tray = FQ.box(.3, .06, .18, mats.steelDark, true, .0008); tray.position.set(.38, .74, .15); g.add(tray);
    return g;
  }

  function buildServerWall(group) {
    // cable ladders and breakers on the left side wall
    var ladder = FQ.group(group, -2.58, 11.1, -1.3);
    for (var r = 0; r < 2; r++) {
      var rail = FQ.box(.045, 3.3, .045, mats.steel, false);
      rail.position.set(0, 1.65, r * .6); ladder.add(rail);
    }
    for (var k = 0; k < 9; k++) {
      var rung = FQ.box(.04, .04, .6, mats.steel, false);
      rung.position.set(0, .35 + k * .36, .3); ladder.add(rung);
    }
    // cable bundles following the wall
    for (var c = 0; c < 5; c++) {
      var cable = FQ.tube([
        new T.Vector3(-2.53, dims.yFloor + .08, -1.8 + c * .1),
        new T.Vector3(-2.62, 12.2, -1.6 + c * .12),
        new T.Vector3(-2.45, 14.3, -1.1 + c * .14),
        new T.Vector3(-2.2, dims.yCeil - .2, -.7 + c * .1)
      ], .022 + c * .002, mats.cable, 16, 4);
      group.add(cable);
    }
    // breaker panel
    var panel = FQ.box(1.08, .85, .06, mats.steelDark, true, .001); panel.position.set(-2.52, 12.55, .8); panel.rotation.y = Math.PI / 2; group.add(panel);
    for (var b = 0; b < 8; b++) {
      var sw = FQ.box(.07, .17, .04, mats.cream, false); sw.position.set(-2.47, 12.28 + (b % 4) * .18, .37 + Math.floor(b / 4) * .24); sw.rotation.y = Math.PI / 2; group.add(sw);
      var swLed = FQ.box(.024, .024, .015, b % 3 === 0 ? mats.redGlow : mats.greenGlow, false);
      swLed.position.set(-2.465, 12.21 + (b % 4) * .18, .37 + Math.floor(b / 4) * .24); swLed.rotation.y = Math.PI / 2; group.add(swLed);
    }
    // coiled hose
    var coil = new T.Mesh(new T.TorusGeometry(.32, .035, 6, 30), mats.rubber);
    coil.rotation.y = Math.PI / 2; coil.position.set(-2.4, 11.6, 1.7); group.add(coil);
    var coil2 = coil.clone(); coil2.scale.set(.78, .78, .78); coil2.position.z += .04; group.add(coil2);
  }

  function buildRedLights(group) {
    // emergency box left
    var box = FQ.box(.46, .76, .11, mats.red, true, .0012); box.position.set(-2.22, 14.34, -1.62); group.add(box);
    var lens = FQ.box(.32, .46, .035, mats.redGlow, false); lens.position.set(-2.22, 14.36, -1.555); group.add(lens);
    var cage = FQ.group(group, -2.22, 14.36, -1.55);
    for (var i = -1; i <= 1; i++) {
      var bar = FQ.box(.022, .5, .02, mats.steelDark, false); bar.position.x = i * .12; cage.add(bar);
    }
    var label = FQ.plane(.28, .075, FQ.basic(0xffffff, { map: makeTinyLabel('EMERGENCY', '#1c2020', '#d1c7ae') }), 1, 1);
    label.position.set(-2.22, 14.7, -1.6); group.add(label);
    var point = new T.PointLight(0xff3c22, 1.4, 5.5, 2);
    point.position.set(-2.0, 14.2, -1.1); group.add(point);
    flickerLights.push({ light: point, mat: mats.redGlow, phase: 0, base: 1.4 });

    // second red lamp on right wall
    var box2 = FQ.box(.34, .56, .1, mats.red, true, .001); box2.position.set(2.45, 13.55, -1.74); group.add(box2);
    var lens2 = FQ.box(.23, .34, .028, mats.redGlow, false); lens2.position.set(2.45, 13.56, -1.68); group.add(lens2);
    // cold fluorescent tube near server wall (emissive, no extra light slot)
    var tube = FQ.box(1.8, .035, .065, FQ.basic(0xc9f2e0, { transparent: true, opacity: .82 }), false);
    tube.position.set(-.8, dims.yCeil - .28, -1.42); group.add(tube);
    flickerLights.push({ light: null, mat: tube.material, phase: 4.4, base: .42, pale: true });
  }

  function buildCeiling(group) {
    var amber = new T.PointLight(0xff8a43, 3.5, 9.5, 2);
    amber.position.set(0, dims.yCeil - .85, .75); group.add(amber);
    var amberFront = new T.PointLight(0xffc083, 2.1, 6.4, 2);
    amberFront.position.set(-.5, dims.yFloor + 1.95, 1.65); group.add(amberFront);
    I.amberLight = amber;
    // main pendant lamp
    var lampXZ = [[-1.8, .4], [1.6, .7]];
    for (var l = 0; l < lampXZ.length; l++) {
      var x = lampXZ[l][0], z = lampXZ[l][1];
      var cable = FQ.cyl(.014, .014, .9, 5, mats.cable, false); cable.position.set(x, dims.yCeil - .45, z); group.add(cable);
      var shade = FQ.cyl(.08, .27, .2, 12, mats.steelDark, true, .0008); shade.position.set(x, dims.yCeil - .94, z); group.add(shade);
      var bulb = FQ.sphere(.06, 10, 8, mats.amberGlow, false); bulb.position.set(x, dims.yCeil - 1.06, z); group.add(bulb);
      var glow = FQ.sprite(group, Tex.glow, 0xff7b39, .55, .09); glow.position.set(x, dims.yCeil - 1.06, z);
      if (l === 0) for (var lc = 0; lc < 2; lc++) {
        var cone = FQ.beamCone(0xffa260, .07, 1.35, 2.65, .018);
        cone.position.set(x, dims.yCeil - 2.32, z); group.add(cone);
      }
      var cage = FQ.group(group, x, dims.yCeil - 1.01, z);
      for (var s = 0; s < 3; s++) {
        var bar = FQ.box(.016, .25, .016, mats.steelDark, false);
        bar.position.set(Math.cos(s * 2.09) * .12, .02, Math.sin(s * 2.09) * .12); cage.add(bar);
      }
      var ring = new T.Mesh(new T.TorusGeometry(.18, .012, 4, 16), FQ.basic(0x0b0d0d)); ring.rotation.x = Math.PI / 2; ring.position.y = .13; cage.add(ring);
    }
    // warm actual light plus a red emergency point near the floor
    // spinning emergency beacon in the ceiling corner
    var beaconBase = FQ.cyl(.16, .2, .12, 12, mats.steelDark, false); beaconBase.position.set(2.4, dims.yCeil - .12, 1.7); group.add(beaconBase);
    var beaconDome = new T.Mesh(new T.SphereGeometry(.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), FQ.basic(0xff3f28, { transparent: true, opacity: .82, blending: T.AdditiveBlending })); beaconDome.position.set(2.4, dims.yCeil - .04, 1.7); group.add(beaconDome);
    var beaconGlow = FQ.sprite(group, Tex.glow, 0xff3f28, 1.8, .25); beaconGlow.position.set(2.4, dims.yCeil - .04, 1.7);
    // ductwork across ceiling
    var duct = FQ.cyl(.28, .28, 3.4, 12, mats.steel, true, .0015);
    duct.rotation.z = Math.PI / 2; duct.position.set(0, dims.yCeil - .38, -1.62); group.add(duct);
    for (var df = -1; df <= 1; df += 2) {
      var flange = FQ.cyl(.34, .34, .1, 12, mats.steelDark, false);
      flange.rotation.z = Math.PI / 2; flange.position.set(df * 1.2, dims.yCeil - .38, -1.62); group.add(flange);
    }
    for (var vent = 0; vent < 6; vent++) {
      var v = FQ.box(.34, .025, .04, mats.black, false); v.position.set(-1.3 + vent * .52, dims.yCeil - .66, -1.62); group.add(v);
    }
    // cable trays and drooping wires
    for (var w = 0; w < 3; w++) {
      var pts = [];
      for (var p = 0; p <= 4; p++) {
        pts.push(new T.Vector3(-3.4 + p * 1.7, dims.yCeil - .33 - Math.sin(p / 4 * Math.PI) * .28 - w * .04, .7 + w * .3));
      }
      var wire = FQ.tube(pts, .018, mats.cable, 20, 4); group.add(wire);
    }
    // suspended red lamp near glass
    var wire2 = FQ.cyl(.013, .013, 1.1, 5, mats.cable, false); wire2.position.set(-2.8, dims.yCeil - .5, 1.5); group.add(wire2);
    var redShade = FQ.cyl(.055, .22, .18, 12, mats.red, true, .0008); redShade.position.set(-2.8, dims.yCeil - 1.1, 1.5); group.add(redShade);
    var redBulb = FQ.sphere(.075, 8, 6, mats.redGlow, false); redBulb.position.set(-2.8, dims.yCeil - 1.2, 1.5); group.add(redBulb);
  }

  function buildDetails(group) {
    // wall-mounted site schematic on right side
    var board = FQ.box(1.95, 1.05, .06, mats.steelDark, true, .001); board.position.set(2.55, 13.1, -1.6); board.rotation.y = -Math.PI / 2; group.add(board);
    var paperMap = FQ.plane(1.7, .9, FQ.basic(0xffffff, { map: Tex.screenB, transparent: true, opacity: .55, side: T.DoubleSide }), 1, 1);
    paperMap.rotation.y = -Math.PI / 2; paperMap.position.set(2.58, 13.1, -1.6); group.add(paperMap);
    for (var pin = 0; pin < 5; pin++) {
      var dot = FQ.sphere(.023, 6, 4, pin % 2 ? mats.redGlow : mats.brass, false);
      dot.position.set(2.585, 12.82 + (pin % 3) * .22, -1.9 + pin * .16); group.add(dot);
    }
    // brass containment artifact on a side plinth
    var plinth = FQ.box(.72, .82, .72, mats.steelDark, true, .0012); plinth.position.set(-2.25, dims.yFloor + .41, -.1); group.add(plinth);
    var cap = FQ.box(.78, .06, .78, mats.brass, false); cap.position.set(-2.25, dims.yFloor + .85, -.1); group.add(cap);
    var artifact = new T.Mesh(new T.ConeGeometry(.23, .34, 4), mats.basalt || mats.black);
    artifact.rotation.z = Math.PI; artifact.rotation.y = Math.PI / 4; artifact.position.set(-2.25, dims.yFloor + 1.05, -.1); group.add(artifact);
    // black square folder stack
    var papers = FQ.plane(.42, .56, mats.paper, 1, 1); papers.material = FQ.basic(0xffffff, { map: Tex.documentB, transparent: true, side: T.DoubleSide });
    papers.rotation.x = -Math.PI / 2; papers.rotation.z = .3; papers.position.set(-2.24, dims.yFloor + 1.072, -.1); group.add(papers);
    // a little red desk lamp
    var lampBase = FQ.cyl(.09, .1, .025, 10, mats.steelDark, false); lampBase.position.set(1.95, dims.yFloor + 1.08, .98); group.add(lampBase);
    var lampStem = FQ.cyl(.015, .015, .4, 5, mats.steel, false); lampStem.position.set(1.95, dims.yFloor + 1.29, .98); group.add(lampStem);
    var shade = FQ.cyl(.05, .16, .14, 10, mats.red, true, .0007); shade.position.set(1.95, dims.yFloor + 1.5, .98); shade.rotation.z = .2; group.add(shade);
    var glow = FQ.sprite(group, Tex.glow, 0xff7745, .9, .18); glow.position.set(1.9, dims.yFloor + 1.42, 1.0);
    // file cart
    var cart = FQ.group(group, 2.25, dims.yFloor, 1.55);
    for (var c = 0; c < 2; c++) {
      var shelf = FQ.box(.86, .07, .52, mats.steelDark, true, .0009); shelf.position.set(0, .25 + c * .72, 0); cart.add(shelf);
      for (var f = 0; f < 2; f++) {
        var folder = FQ.box(.58, .34, .38, f ? mats.wallDark : mats.red, true, .0008);
        folder.position.set(-.08 + f * .18, .48 + c * .72 + f * .16, 0); folder.rotation.z = f ? .05 : -.03; cart.add(folder);
      }
    }
    for (var s = -1; s <= 1; s += 2) {
      var wheel = FQ.sphere(.09, 8, 6, mats.rubber, false); wheel.position.set(s * .36, .1, -.2); cart.add(wheel);
      var leg = FQ.box(.05, .55, .05, mats.steelDark, false); leg.position.set(s * .36, .35, -.2); cart.add(leg);
    }
    // scattered documents on the floor
    var docs = [[-1.2, 1.7, .4], [1.0, 1.9, -.7], [-.2, -.8, 1.2], [1.6, -.7, .7]];
    for (var d = 0; d < docs.length; d++) {
      var doc = FQ.plane(.4, .55, mats.paper, 1, 1);
      doc.material = FQ.basic(0xffffff, { map: d % 2 ? Tex.documentA : Tex.documentB, transparent: true, side: T.DoubleSide });
      doc.rotation.x = -Math.PI / 2; doc.rotation.z = docs[d][2];
      doc.position.set(docs[d][0], dims.yFloor + .02 + d * .001, docs[d][1]); group.add(doc);
    }
    // cables along floor to console
    for (var c2 = 0; c2 < 5; c2++) {
      var pts = [
        new T.Vector3(-2.4 + c2 * .2, dims.yFloor + .035, -1.7 + c2 * .28),
        new T.Vector3(-.8 + c2 * .31, dims.yFloor + .03, .5 + c2 * .12),
        new T.Vector3(.4 + c2 * .16, dims.yFloor + .025, 1.2 + c2 * .13),
        new T.Vector3(1.8 + c2 * .09, dims.yFloor + .02, 1.6)
      ];
      group.add(FQ.tube(pts, .023, mats.cable, 16, 4));
    }
    // floor access hatch in center front
    var hatch = FQ.cyl(.48, .48, .025, 24, mats.steelDark, true, .0008); hatch.position.set(1.1, dims.yFloor + .018, 2.0); group.add(hatch);
    var hatchRing = new T.Mesh(new T.TorusGeometry(.48, .022, 5, 24), mats.brass); hatchRing.rotation.x = Math.PI / 2; hatchRing.position.set(1.1, dims.yFloor + .035, 2.0); group.add(hatchRing);
    // hazard tape line at floor near front
    var hazard = FQ.plane(1.5, .13, FQ.basic(0xffffff, { map: FQ.repeatTex(Tex.hazard, 3, .4), transparent: true, opacity: .5, side: T.DoubleSide }), 1, 1);
    hazard.rotation.x = -Math.PI / 2; hazard.position.set(-1.4, dims.yFloor + .022, 2.3); group.add(hazard);
  }


  function makeStatusCanvas() {
    var W = 1024, H = 512, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#0a0d0b'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(143,164,147,.24)'; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28);
    g.fillStyle = 'rgba(199,190,167,.85)'; g.font = '600 22px "Courier New", monospace'; g.textAlign = 'left';
    g.fillText('FEDERAL BUREAU OF CONTROL / INDUSTRIAL OVERSIGHT', 34, 48);
    g.fillStyle = 'rgba(156,52,43,.9)'; g.fillRect(34, 62, W - 68, 3);
    // large inverted triangle seal
    g.save(); g.translate(W * .67, H * .50);
    g.strokeStyle = 'rgba(209,66,49,.55)'; g.lineWidth = 6;
    g.beginPath(); g.arc(0, 0, 154, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 138, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(170,47,37,.92)';
    g.beginPath(); g.moveTo(0, -104); g.lineTo(94, 82); g.lineTo(-94, 82); g.closePath(); g.fill();
    g.fillStyle = '#0b0f0d'; g.beginPath(); g.moveTo(0, -66); g.lineTo(58, 56); g.lineTo(-58, 56); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(230,214,180,.8)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -115); g.lineTo(104, 91); g.lineTo(-104, 91); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(223,211,185,.9)'; g.font = '700 28px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('AWE-77', 0, 124);
    g.restore();
    // left-side text and bars
    g.fillStyle = 'rgba(213,204,182,.92)'; g.font = '700 42px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'left';
    g.fillText('QUARRY 07', 36, 148);
    g.fillStyle = 'rgba(207,88,64,.94)'; g.font = '600 25px "Courier New", monospace';
    g.fillText('CONTAINMENT ACTIVE', 38, 186);
    g.fillStyle = 'rgba(139,172,151,.76)'; g.font = '18px "Courier New", monospace';
    g.fillText('GRAVITY ANCHOR // STABLE', 38, 227);
    g.fillText('SUSPENSION MASS // 1.7e5 T', 38, 253);
    g.fillText('DRIFT CORRECTION // 0.041', 38, 279);
    // amber live bars
    for (var b = 0; b < 7; b++) {
      var bw = 55 + (rng() * 80 | 0);
      g.fillStyle = 'rgba(216,155,73,' + (.32 + rng() * .5) + ')';
      g.fillRect(38, 320 + b * 18, bw, 6);
      g.fillStyle = 'rgba(95,66,36,.4)'; g.fillRect(38 + bw + 8, 320 + b * 18, 265 - bw, 6);
    }
    g.fillStyle = 'rgba(131,164,144,.55)'; g.font = '16px "Courier New", monospace';
    g.fillText('OCCUPANCY // NONE', 38, 470);
    g.fillText('LAST ENTRY // UNRECORDED', 300, 470);
    // scanlines & dust
    g.fillStyle = 'rgba(0,0,0,.15)';
    for (var y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
    for (var d = 0; d < 240; d++) { g.fillStyle = 'rgba(226,221,197,' + rng() * .05 + ')'; g.fillRect(rng() * W, rng() * H, 1, 1); }
    return FQ.tex(c, {});
  }

  function makeRedMapCanvas() {
    var W = 512, H = 256, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.fillStyle = '#0c1110'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(50,10,8,.6)'; g.fillRect(10, 10, W - 20, H - 20);
    g.strokeStyle = 'rgba(255,106,76,.28)'; g.lineWidth = 1;
    for (var i = 0; i < 10; i++) { g.beginPath(); g.arc(W / 2, H / 2, 20 + i * 18, 0, Math.PI); g.stroke(); }
    for (var a = 0; a < 8; a++) { g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(a * .8) * 230, H / 2 - Math.sin(a * .8) * 130); g.stroke(); }
    g.fillStyle = 'rgba(231,61,41,.9)';
    g.beginPath(); g.moveTo(W / 2, 44); g.lineTo(W / 2 + 56, 150); g.lineTo(W / 2 - 56, 150); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,154,112,.93)'; g.font = '12px "Courier New", monospace'; g.textAlign = 'center';
    g.fillText('SITE 07 / CONTAINMENT', W / 2, 210);
    g.fillStyle = 'rgba(213,191,150,.65)'; g.font = '10px "Courier New", monospace';
    g.fillText('TRACE 04 / SECTOR C', W / 2, 232);
    for (var y = 0; y < H; y += 4) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, y, W, 1); }
    return FQ.tex(c, {});
  }


  function buildCRTArc(group) {
    var rail = new T.Group(); rail.position.set(0, dims.yCeil - .52, -.18); group.add(rail);
    var beam = FQ.box(4.5, .1, .12, mats.steelDark, true, .001); rail.add(beam);
    for (var i = 0; i < 5; i++) {
      var x = -1.7 + i * .85;
      var y = dims.yCeil - .9;
      var z = -.58 + Math.abs(x) * .09;
      var mon = new T.Group(); mon.position.set(x, y, z); group.add(mon);
      mon.rotation.x = -.38;
      mon.rotation.y = -x * .13;
      var shell = FQ.box(.66, .47, .22, mats.steelDark, true, .001); mon.add(shell);
      var screenTex = [Tex.screenA, Tex.screenB, Tex.screenE, Tex.screenC, Tex.screenD][i];
      var scMat = FQ.basic(0xffffff, { map: screenTex });
      screenMats.push(scMat);
      var scr = new T.Mesh(new T.PlaneGeometry(.55, .36), scMat); scr.position.z = .116; mon.add(scr);
      var frame = FQ.box(.6, .4, .02, mats.black, false); frame.position.z = .106; mon.add(frame);
      scr.position.z = .12;
      for (var k = -1; k <= 1; k += 2) {
        var knob = FQ.cyl(.016, .016, .012, 6, mats.steel, false); knob.rotation.x = Math.PI / 2; knob.position.set(k * .24, -.18, .122); mon.add(knob);
      }
      var led = FQ.sphere(.015, 6, 4, i === 2 ? mats.redGlow : mats.greenGlow, false); led.position.set(.27, -.18, .123); mon.add(led);
      // suspension rods
      var rod = FQ.cyl(.012, .012, .38, 4, mats.cable, false); rod.position.set(x > 0 ? -.26 : .26, .39, 0); mon.add(rod);
    }
    // warm downlight strip under the rail
    var strip = FQ.box(3.6, .035, .06, FQ.basic(0xffb06a, { transparent: true, opacity: .8 }), false);
    strip.position.set(0, dims.yCeil - .61, .0); group.add(strip);
    var sg = FQ.sprite(group, Tex.glow, 0xffa55d, 2.0, .08); sg.position.set(0, dims.yCeil - .7, .2);
    // red cable bundles from ceiling to monitors
    for (var c = 0; c < 3; c++) {
      var cable = FQ.tube([
        new T.Vector3(-2.0 + c * 1.7, dims.yCeil - .08, -.45),
        new T.Vector3(-1.6 + c * 1.8, dims.yCeil - .34, -.28),
        new T.Vector3(-1.2 + c * 2.0, dims.yCeil - .65, -.18)
      ], .018, mats.cable, 10, 4);
      group.add(cable);
    }
  }

  function buildDisplayBoards(group) {
    var texA = makeStatusCanvas();
    var texB = Tex.screenB;
    var boards = [
      { x: -1.65, y: 14.18, z: -.3, w: 1.75, h: .88, tex: texA, accent: 'red' },
      { x: 1.72, y: 14.05, z: -.3, w: 1.38, h: .72, tex: texB, accent: 'amber' }
    ];
    for (var i = 0; i < boards.length; i++) {
      var b = boards[i];
      var g = new T.Group(); g.position.set(b.x, b.y, b.z); group.add(g);
      var caseMesh = FQ.box(b.w + .15, b.h + .15, .12, mats.steelDark, true, .0013); g.add(caseMesh);
      var mat = FQ.basic(0xffffff, { map: b.tex });
      screenMats.push(mat);
      var plane = new T.Mesh(new T.PlaneGeometry(b.w, b.h), mat);
      plane.position.z = .071; g.add(plane);
      var inner = FQ.box(b.w + .03, b.h + .03, .015, mats.black, false); inner.position.z = .057; g.add(inner);
      // bracket to ceiling
      var cable = FQ.box(.025, dims.yCeil - (b.y + b.h / 2), .025, mats.cable, false);
      cable.position.set(0, (dims.yCeil - (b.y + b.h / 2)) / 2, -.02); g.add(cable);
      for (var s = -1; s <= 1; s += 2) {
        var bracket = FQ.box(.04, .32, .03, mats.iron, false); bracket.position.set(s * b.w * .32, b.h * .5 + .18, .02); g.add(bracket);
      }
      var glow = FQ.sprite(g, Tex.glow, i === 0 ? 0xff5734 : 0x96d8c1, b.w * 1.2, .13);
      glow.position.set(0, 0, .16);
      var lip = FQ.box(b.w + .3, .03, .04, i === 0 ? mats.redGlow : mats.amberSolid, false); lip.position.set(0, -b.h * .5 - .11, .09); g.add(lip);
      // keep the boards angled slightly toward the room's front glass
      g.rotation.x = -.12;
    }
    // small central containment map table on the console
    var mapTex = makeRedMapCanvas();
    var mapGroup = new T.Group(); mapGroup.position.set(0, dims.yFloor + 1.17, 1.08); group.add(mapGroup);
    var mapFrame = FQ.box(1.22, .62, .08, mats.steelDark, true, .0012); mapFrame.position.set(0, 0, 0); mapGroup.add(mapFrame);
    var mapScreen = new T.Mesh(new T.PlaneGeometry(1.03, .44), FQ.basic(0xffffff, { map: mapTex }));
    mapScreen.position.set(0, 0, .049); mapGroup.add(mapScreen);
    screenMats.push(mapScreen.material);
    var mapGlow = FQ.sprite(mapGroup, Tex.glow, 0xff5e39, .95, .1); mapGlow.position.set(0, 0, .16);
    var mapStand = FQ.box(.14, .48, .14, mats.iron, false); mapStand.position.set(0, -.4, -.05); mapGroup.add(mapStand);
    mapGroup.rotation.x = -.62;
    mapGroup.rotation.y = 0;
    // ceiling warm strip and utility lamps
    var strip = FQ.box(3.8, .035, .07, FQ.basic(0xffb36c, { transparent: true, opacity: .82 }), false);
    strip.position.set(0, dims.yCeil - .18, .9); group.add(strip);
    var stripGlow = FQ.sprite(group, Tex.glow, 0xffaa64, 2.0, .08); stripGlow.position.set(0, dims.yCeil - .25, .9);
    for (var l = -1; l <= 1; l += 2) {
      var lampBox = FQ.box(.42, .13, .25, mats.iron, false); lampBox.position.set(l * 2.1, dims.yCeil - .3, 1.2); group.add(lampBox);
      var lens = FQ.box(.32, .07, .02, FQ.basic(0xffbf82, { transparent: true, opacity: .9 }), false); lens.position.set(l * 2.1, dims.yCeil - .33, 1.34); group.add(lens);
    }
    // little amber beacons along rear floor line
    for (var t = 0; t < 5; t++) {
      var dot = FQ.sphere(.025, 6, 4, FQ.basic(0xffb46e), false);
      dot.position.set(-1.7 + t * .85, dims.yFloor + .04, -1.98); group.add(dot);
    }
    // red emergency light shafts through the room haze
    for (var rc = -1; rc <= 1; rc += 2) {
      var shaft = FQ.beamCone(0xff4b2f, .12, .65, 3.5, .035);
      shaft.position.set(rc * 1.35, 13.0, -1.3);
      shaft.rotation.z = rc * .12;
      group.add(shaft);
    }
    // two pedestal status monitors flanking the front glass, readable from outside
    for (var side = -1; side <= 1; side += 2) {
      var pedestal = new T.Group(); pedestal.position.set(side * 2.22, dims.yFloor, 1.42); group.add(pedestal);
      var stand = FQ.box(.3, .9, .3, mats.steelDark, true, .001); stand.position.y = .45; pedestal.add(stand);
      var station = new T.Group(); station.position.y = 1.15; station.rotation.x = -.3; station.rotation.y = side * -.18; pedestal.add(station);
      var shell = FQ.box(.95, .62, .16, mats.steelDark, true, .0012); station.add(shell);
      var tex = side < 0 ? Tex.screenE : Tex.screenB;
      var scr = new T.Mesh(new T.PlaneGeometry(.78, .46), FQ.basic(0xffffff, { map: tex })); scr.position.z = .086; station.add(scr); screenMats.push(scr.material);
      var hood = FQ.box(.98, .05, .35, mats.iron, false); hood.position.set(0, .33, .15); station.add(hood);
      var glow = FQ.sprite(station, Tex.glow, side < 0 ? 0xff5e3b : 0x87ddc5, .9, .08); glow.position.set(0, 0, .18);
      var led = FQ.sphere(.023, 6, 4, side < 0 ? mats.redGlow : mats.greenGlow, false); led.position.set(side * -.35, -.26, .1); station.add(led);
    }
  }

  function buildExtraScreens(group) {
    // a side console on the left of the main desk
    var g = FQ.group(group, -2.18, dims.yFloor + 1.05, .45);
    g.rotation.y = Math.PI / 2 - .12;
    var body = FQ.box(.95, .22, .58, mats.desk, true, .001); body.position.y = .1; g.add(body);
    var top = FQ.box(.9, .08, .52, mats.deskTop, true, .0008); top.position.y = .24; g.add(top);
    var crt = makeCRT(Tex.screenE, 'red', -.14, .78); crt.position.set(-.18, .53, -.05); crt.rotation.y = -.1; g.add(crt);
    var crt2 = makeCRT(Tex.screenG, 'green', -.12, .6); crt2.position.set(.3, .45, -.1); crt2.rotation.y = .15; g.add(crt2);
    var glow = FQ.sprite(group, Tex.glow, 0x7ae4c2, 1.15, .08); glow.position.set(-2.8, 12.3, .2);
    return g;
  }

  I.build = function (parent, dimsOverride) {
    if (dimsOverride) {
      dims.yFloor = POverride(dimsOverride, 'yb', dims.yFloor);
      dims.yCeil = POverride(dimsOverride, 'yt', dims.yCeil);
    }
    function POverride(o, k, def) { return o[k] !== undefined ? o[k] : def; }
    makeMaterials();
    var group = FQ.group(parent, 0, 0, 0);
    dims.yFloor = dimsOverride && dimsOverride.yb !== undefined ? dimsOverride.yb : dims.yFloor;
    dims.yCeil = dimsOverride && dimsOverride.yt !== undefined ? dimsOverride.yt : dims.yCeil;
    buildShell(group);
    buildMonitorWall(group);
    buildMainConsole(group);
    // server racks on the left, files + tape + punch cards on the right
    group.add(buildRack(-1.98, -1.68, .8, 2.0, .58, 0));
    group.add(buildRack(-1.05, -1.68, .8, 2.0, .58, 1));
    group.add(buildFiling(2.2, -1.5, 0));
    group.add(buildFiling(2.2, -.9, 1));
    group.add(buildTapeDrive(2.22, .02));
    group.add(buildPunchMachine(2.23, 1.22, -.12));
    buildServerWall(group);
    buildRedLights(group);
    buildCeiling(group);
    buildDetails(group);
    buildDisplayBoards(group);
    buildCRTArc(group);
    buildExtraScreens(group);
    // an extra little strip of white light lining the floor
    for (var g = -1; g <= 1; g += 2) {
      var strip = FQ.box(2.7, .018, .02, mats.greenGlow, false);
      strip.position.set(g * 2.0, dims.yFloor + .02, -2.05); group.add(strip);
    }
    // interior haze / warm volumetric glow
    var hazeMat = new T.SpriteMaterial({ map: Tex.smoke, color: 0xffa45d, transparent: true, opacity: .045, depthWrite: false, blending: T.AdditiveBlending });
    for (var h = 0; h < 3; h++) {
      var haze = new T.Sprite(hazeMat); haze.scale.set(5.0, 4.2, 1); haze.position.set(-1.2 + h * 1.4, 12.8 + h * .3, -.4); group.add(haze);
    }
    I.group = group;
    I.screenMats = screenMats;
    var startT = 0;
    I.update = function (dt, t) {
      startT = t;
      for (var i = 0; i < screenMats.length; i++) {
        var m = screenMats[i];
        if (m.uniforms) { m.uniforms.uTime.value = t; continue; }
        // basic screens: occasional dark flicker or brightness waver
        var f = .78 + .2 * Math.sin(t * 1.2 + i * 1.7) + (Math.sin(t * 8.7 + i) > .94 ? -.22 : 0);
        m.color.setRGB(f, f, f);
      }
      for (var r = 0; r < reels.length; r++) reels[r].group.rotation.z += dt * reels[r].speed;
      for (var f = 0; f < fans.length; f++) fans[f].rotation.z += dt * 2.3;
      for (var l = 0; l < flickerLights.length; l++) {
        var fl = flickerLights[l];
        var pulse = fl.pale ? (0.8 + Math.sin(t * 3.2 + fl.phase) * .06) : (0.28 + Math.pow(Math.max(0, Math.sin(t * 1.35 + fl.phase)), 18) * 1.25 + Math.sin(t * 9.1 + fl.phase) * .025);
        if (fl.light) fl.light.intensity = fl.base * pulse;
      }
      // clock hands run at slightly wrong speed: a small wrongness in the room
      for (var c = 0; c < clockHands.length; c++) {
        clockHands[c].sec.rotation.z = -t * .36;
        clockHands[c].minute.rotation.z = -t * .006;
        clockHands[c].hour.rotation.z = -t * .0005;
      }
      // one grid strip in monitor wall pulses with current
      if (I.redStrip) I.redStrip.material.opacity = .35 + Math.sin(t * 2.4) * .14;
      if (I.amberLight) I.amberLight.intensity = 1.2 + Math.sin(t * .6) * .08;
    };
    return I;
  };
})();
