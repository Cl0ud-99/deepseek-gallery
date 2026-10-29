/* =========================================================================
   FBC QUARRY 07 — floating inverted brutalist pyramid & suspension field
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ, T = THREE, Tex = FQ.Tex, PAL = FQ.PAL;
  var P = FQ.L.pyramid;
  var H = P.topY - P.apexY;
  var HALF = P.halfTop;
  var SLOPE = HALF / H;
  var rng = FQ.rng(0x0b17e2);

  var PY = FQ.pyramid = {};
  var mats = {};
  var anim = { panels: [], beacons: [], rings: [], fans: [], screens: [] };

  function wAt(y) { return HALF * (y - P.apexY) / H; }
  function point(face, y, along) {
    var z = wAt(y);
    if (face === 'front') return new T.Vector3(along, y, z);
    if (face === 'back') return new T.Vector3(along, y, -z);
    if (face === 'right') return new T.Vector3(z, y, along);
    return new T.Vector3(-z, y, along);
  }
  function normal(face) {
    if (face === 'front') return new T.Vector3(0, -SLOPE, 1).normalize();
    if (face === 'back') return new T.Vector3(0, -SLOPE, -1).normalize();
    if (face === 'right') return new T.Vector3(1, -SLOPE, 0).normalize();
    return new T.Vector3(-1, -SLOPE, 0).normalize();
  }
  function upTan(face) {
    if (face === 'front') return new T.Vector3(0, 1, SLOPE).normalize();
    if (face === 'back') return new T.Vector3(0, 1, -SLOPE).normalize();
    if (face === 'right') return new T.Vector3(SLOPE, 1, 0).normalize();
    return new T.Vector3(-SLOPE, 1, 0).normalize();
  }
  function alongTan(face) {
    return (face === 'front' || face === 'back') ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
  }

  function laserTrim() {
    return FQ.basic(0xff5a3a, { toneMapped: false });
  }

  function beamBetween(a, b, radius, mat, radial) {
    var dir = b.clone().sub(a);
    var len = dir.length();
    var cyl = FQ.cyl(radius, radius, len, radial || 8, mat, false);
    cyl.position.copy(a).add(b).multiplyScalar(.5);
    cyl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    return cyl;
  }

  function boxBeamBetween(a, b, w, h, mat, outline) {
    var dir = b.clone().sub(a);
    var len = dir.length();
    var geo = new T.BoxGeometry(w, h, len);
    var m = new T.Mesh(geo, mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    // local +z is length axis; allow local +y to stay roughly upward
    var z = dir.clone().normalize();
    var up = new T.Vector3(0, 1, 0).lerp(z.clone().multiplyScalar(0.0), 0).normalize();
    if (Math.abs(z.y) > 0.98) up.set(0, 0, 1);
    var x = new T.Vector3().crossVectors(up, z).normalize();
    var y = new T.Vector3().crossVectors(z, x).normalize();
    var mat4 = new T.Matrix4().makeBasis(x, y, z);
    m.quaternion.setFromRotationMatrix(mat4);
    if (outline) FQ.outline(m, .0016);
    return m;
  }

  function facePanel(face, y, along, width, height, mat, offset) {
    var cen = point(face, y, along).addScaledVector(normal(face), offset === undefined ? .018 : offset);
    var hTan = alongTan(face).multiplyScalar(width * .5);
    var vTan = upTan(face).multiplyScalar(height * .5);
    var pts = [
      cen.clone().sub(hTan).sub(vTan),
      cen.clone().add(hTan).sub(vTan),
      cen.clone().add(hTan).add(vTan),
      cen.clone().sub(hTan).add(vTan)
    ];
    var geo = new T.BufferGeometry();
    var pos = [], uv = [];
    for (var i = 0; i < 4; i++) { pos.push(pts[i].x, pts[i].y, pts[i].z); }
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    var idx = (face === 'right' || face === 'back') ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    geo.setIndex(idx); geo.computeVertexNormals();
    var mesh = new T.Mesh(geo, mat);
    if (mat.transparent) mesh.renderOrder = 4;
    return mesh;
  }

  function faceTriangle(face, pts2d, mat, offset) {
    var n = normal(face);
    var verts = [];
    for (var i = 0; i < pts2d.length; i++) verts.push(point(face, pts2d[i][0], pts2d[i][1]).addScaledVector(n, offset === undefined ? .022 : offset));
    var geo = new T.BufferGeometry();
    var pos = [], uv = [];
    for (var k = 0; k < verts.length; k++) { pos.push(verts[k].x, verts[k].y, verts[k].z); uv.push(k === 1 ? 1 : k === 2 ? .5 : 0, k === 0 ? 0 : 1); }
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex([0, 1, 2]); geo.computeVertexNormals();
    var nrm = new T.Vector3().fromBufferAttribute(geo.attributes.normal, 0);
    if (nrm.dot(new T.Vector3(0, 0, 1)) < 0) geo.setIndex([0, 2, 1]);
    return new T.Mesh(geo, mat);
  }

  function polyFace(points, mat) {
    var geo = new T.BufferGeometry();
    var pos = [], uv = [];
    for (var i = 0; i < points.length; i++) {
      pos.push(points[i].x, points[i].y, points[i].z);
      uv.push((points[i].x + HALF) / (2 * HALF), (points[i].y - P.apexY) / H);
    }
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    var idx = [];
    for (var k = 1; k < points.length - 1; k++) idx.push(0, k, k + 1);
    geo.setIndex(idx); geo.computeVertexNormals();
    var mesh = new T.Mesh(geo, mat);
    return mesh;
  }

  function makeMaterials() {
    mats.concrete = FQ.toon(0x96a3a2, {
      map: FQ.repeatTex(Tex.concrete, 2.4, 2.4),
      bumpMap: FQ.repeatTex(Tex.concrete, 2.4, 2.4), bumpScale: .035,
      gradientMap: FQ.grad, rim: .12, rimColor: 0x7e9aa0, side: T.DoubleSide
    });
    mats.concreteDark = FQ.toon(0x545f5c, {
      map: FQ.repeatTex(Tex.concreteDark, 2.2, 2.2),
      bumpMap: FQ.repeatTex(Tex.concreteDark, 2.2, 2.2), bumpScale: .04,
      gradientMap: FQ.gradHard, rim: .08, rimColor: 0x8f9d9d, side: T.DoubleSide
    });
    mats.basalt = FQ.toon(0x171b1b, {
      map: FQ.repeatTex(Tex.rockDark, .65, .65), bumpMap: FQ.repeatTex(Tex.rockDark, .65, .65), bumpScale: .03,
      gradientMap: FQ.gradHard, rim: .22, rimColor: 0xb34a38
    });
    mats.basaltAccent = FQ.toon(0x22201e, {
      map: FQ.repeatTex(Tex.rock, .8, .8), gradientMap: FQ.gradHard, rim: .15, rimColor: 0xc35e45
    });
    mats.steel = FQ.steel(0x434c4d, .34);
    mats.steelDark = FQ.iron(0x13191a, .46);
    mats.steelMid = FQ.steel(0x626b6b, .42);
    mats.brass = FQ.brass(0xb08e50, .29);
    mats.frameSteel = FQ.toon(0x242b2b, { map: FQ.repeatTex(Tex.steel, 1.3, 1.3), bumpMap: FQ.repeatTex(Tex.steel, 1.3, 1.3), bumpScale: .01, gradientMap: FQ.gradHard, rim: .08, rimColor: 0xad7152 });
    mats.redMetal = FQ.toon(0x6c2823, { gradientMap: FQ.gradHard, rim: .12, rimColor: 0xf06b50 });
    mats.roof = FQ.toon(0x777b73, {
      map: FQ.repeatTex(Tex.concreteDark, 2.7, 2.7), bumpMap: FQ.repeatTex(Tex.concreteDark, 2.7, 2.7), bumpScale: .035,
      gradientMap: FQ.gradHard
    });
    mats.glass = new T.ShaderMaterial({
      transparent: true, side: T.DoubleSide, depthWrite: false,
      uniforms: { uTint: { value: new T.Color(0x7ea9ac) } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }',
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform vec3 uTint;',
        'void main(){',
        ' float ndv=abs(dot(normalize(vN),normalize(vV)));',
        ' float fres=pow(1.0-clamp(ndv,0.,1.),3.2);',
        ' float band=smoothstep(.05,.0,abs(vUv.x*1.25+vUv.y*.43-.72));',
        ' float band2=smoothstep(.018,.0,abs(vUv.x*.9-vUv.y*.58-.28));',
        ' float alpha=.012+fres*.24+band*.028+band2*.016;',
        ' vec3 col=uTint*(.10+.55*fres)+vec3(.32,.38,.38)*(band*.65+band2*.35);',
        ' gl_FragColor=vec4(col,alpha);',
        '}'
      ].join('\n'),
      depthTest: true
    });
    mats.glassDark = new T.MeshPhysicalMaterial({
      color: 0x263d3e, metalness: .15, roughness: .08, transparent: true, opacity: .35,
      clearcoat: 1, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.25
    });
    mats.windowGlow = FQ.basic(0xff8a4d, { transparent: true, opacity: .64, blending: T.AdditiveBlending, depthWrite: false });
    mats.blueGlow = FQ.basic(0x85dbe2, { transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false });
    mats.redLine = FQ.basic(0xc63c2c, { toneMapped: false });
    mats.redGlow = FQ.basic(0xff4e2c, { transparent: true, opacity: .72, blending: T.AdditiveBlending, depthWrite: false });
  }

  function addEdgeRibs(group) {
    var top = [
      new T.Vector3(-HALF, P.topY, HALF),
      new T.Vector3(HALF, P.topY, HALF),
      new T.Vector3(HALF, P.topY, -HALF),
      new T.Vector3(-HALF, P.topY, -HALF)
    ];
    var apex = new T.Vector3(0, P.apexY, 0);
    for (var i = 0; i < 4; i++) {
      var a = top[i], b = apex;
      var rib = beamBetween(a, b, .15, mats.steelDark, 8);
      rib.castShadow = false; group.add(rib);
      var rib2 = beamBetween(a.clone().add(new T.Vector3(0, -.04, 0)), b.clone().lerp(a, .04), .075, mats.brass, 6);
      rib2.position.add(new T.Vector3(0, 0, 0));
      group.add(rib2);
      // clamps at regular intervals
      for (var k = 1; k < 5; k++) {
        var tt = k / 5;
        var p = a.clone().lerp(b, tt);
        var clamp = FQ.box(.32, .18, .22, mats.steel, false);
        clamp.position.copy(p);
        clamp.lookAt(p.clone().add(normal(i === 0 || i === 1 ? 'front' : 'back')));
        group.add(clamp);
      }
    }
    // top corner caps
    for (var c = 0; c < 4; c++) {
      var cap = FQ.box(.65, .32, .65, mats.steelDark, true, .0017);
      cap.position.copy(top[c]).add(new T.Vector3(0, -.02, 0));
      group.add(cap);
      var brass = FQ.box(.5, .06, .5, mats.brass, false);
      brass.position.copy(top[c]).add(new T.Vector3(0, .15, 0)); group.add(brass);
    }
  }

  function addFaceArmor(group, face, y, along, width, height, color) {
    var mat = color || mats.basalt;
    var p = facePanel(face, y, along, width, height, mat, .055);
    p.castShadow = false; p.receiveShadow = false; group.add(p);
    // glowing inner seam
    var seam = facePanel(face, y, along, width * .01, height * .8, mats.redLine, .07);
    group.add(seam);
    // frame at left/right
    var ft = facePanel(face, y + height / 2, along, width, .055, mats.steelDark, .075); group.add(ft);
    var fb = facePanel(face, y - height / 2, along, width, .055, mats.steelDark, .075); group.add(fb);
    var fl = facePanel(face, y, along - width / 2, .055, height, mats.steelDark, .075); group.add(fl);
    var fr = facePanel(face, y, along + width / 2, .055, height, mats.steelDark, .075); group.add(fr);
    anim.panels.push({ mesh: p, base: p.position.clone(), face: face, phase: rng() * 6.28 });
    return p;
  }

  function addBelt(group, y, height, depth, mat, accent) {
    var w = wAt(y);
    var parts = [
      { w: 2 * w + .38, h: height, d: depth, x: 0, z: w + .02 },
      { w: 2 * w + .38, h: height, d: depth, x: 0, z: -w - .02 },
      { w: depth, h: height, d: 2 * w + .38, x: w + .02, z: 0 },
      { w: depth, h: height, d: 2 * w + .38, x: -w - .02, z: 0 }
    ];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i];
      var b = FQ.box(s.w, s.h, s.d, mat, true, .0017);
      b.position.set(s.x, y, s.z); b.castShadow = false; group.add(b);
      if (accent) {
        var strip = FQ.box(s.w * .78, .026, s.d * .28, accent, false);
        strip.position.set(s.x, y + s.h * .38, s.z + (i < 2 ? (i === 0 ? .22 : -.22) : 0));
        if (i >= 2) { strip.rotation.y = Math.PI / 2; strip.position.x += i === 2 ? .22 : -.22; strip.position.z = 0; }
        group.add(strip);
      }
    }
  }

  function buildShell(group) {
    // four large faces; the front carries the glazed control room cutaway
    var faces = ['back', 'right', 'left'];
    for (var f = 0; f < faces.length; f++) {
      var face = faces[f];
      var topA, topB, apex = new T.Vector3(0, P.apexY, 0);
      if (face === 'back') { topA = new T.Vector3(-HALF, P.topY, -HALF); topB = new T.Vector3(HALF, P.topY, -HALF); }
      if (face === 'left') { topA = new T.Vector3(-HALF, P.topY, -HALF); topB = new T.Vector3(-HALF, P.topY, HALF); }
      if (face === 'right') { topA = new T.Vector3(HALF, P.topY, HALF); topB = new T.Vector3(HALF, P.topY, -HALF); }
      var tri = polyFace([topA, topB, apex], mats.concrete);
      tri.castShadow = true; tri.receiveShadow = true; group.add(tri);
      // thick inner shadow line along top edge
      var rail = boxBeamBetween(topA.clone().add(new T.Vector3(0, -.4, 0)), topB.clone().add(new T.Vector3(0, -.4, 0)), .18, .2, mats.steelDark);
      group.add(rail);
    }

    // front face with a trapezoidal glazed aperture
    var yb = P.roomFloor, yt = P.roomCeil;
    var ob = 2.52, ot = 4.95;
    var wb = wAt(yb), wt = wAt(yt);
    var bottomL = new T.Vector3(-wb, yb, wb), bottomR = new T.Vector3(wb, yb, wb);
    var topL = new T.Vector3(-wt, yt, wt), topR = new T.Vector3(wt, yt, wt);
    var apex = new T.Vector3(0, P.apexY, 0);
    var topTopL = new T.Vector3(-HALF, P.topY, HALF), topTopR = new T.Vector3(HALF, P.topY, HALF);
    var openingBL = new T.Vector3(-ob, yb, wAt(yb)), openingBR = new T.Vector3(ob, yb, wAt(yb));
    var openingTL = new T.Vector3(-ot, yt, wAt(yt)), openingTR = new T.Vector3(ot, yt, wAt(yt));

    // top panel above the opening
    group.add(polyFace([topTopL, topTopR, new T.Vector3(wt, yt, wt), new T.Vector3(-wt, yt, wt)], mats.concrete));
    // lower pyramid tip below the opening
    group.add(polyFace([bottomL, bottomR, apex], mats.concrete));
    // left + right shoulder panels
    group.add(polyFace([new T.Vector3(-wt, yt, wt), new T.Vector3(-wb, yb, wb), openingBL, openingTL], mats.concrete));
    group.add(polyFace([new T.Vector3(wt, yt, wt), new T.Vector3(wb, yb, wb), openingBR, openingTR], mats.concrete));

    // window frame under structure
    var fr = { bar: 0.2, depth: .32 };
    var frameDefs = [
      [openingBL, openingBR, .20, .34],
      [openingTL, openingTR, .20, .34],
      [openingBL, openingTL, .19, .34],
      [openingBR, openingTR, .19, .34]
    ];
    for (var fd = 0; fd < frameDefs.length; fd++) {
      var bar = boxBeamBetween(frameDefs[fd][0], frameDefs[fd][1], frameDefs[fd][2], frameDefs[fd][3], mats.steelDark, true);
      bar.castShadow = false; group.add(bar);
    }
    // slim concrete drip lip over the glazing only; the aperture stays open
    var lipA = point('front', yt + .17, -ot - .15).add(new T.Vector3(0, 0, .12));
    var lipB = point('front', yt + .17, ot + .15).add(new T.Vector3(0, 0, .12));
    var lip = boxBeamBetween(lipA, lipB, .22, .12, mats.concreteDark, true);
    group.add(lip);
    var sillGlow = boxBeamBetween(point('front', yb - .03, -ob - .1).add(new T.Vector3(0, 0, .06)), point('front', yb - .03, ob + .1).add(new T.Vector3(0, 0, .06)), .03, .03, mats.windowGlow);
    group.add(sillGlow);

    // the actual blast glass
    var glassGeo = new T.BufferGeometry();
    var gv = [openingBL, openingBR, openingTR, openingTL];
    var gpos = [], guv = [];
    for (var g = 0; g < 4; g++) { gpos.push(gv[g].x, gv[g].y, gv[g].z); }
    guv.push(0, 0, 1, 0, 1, 1, 0, 1);
    glassGeo.setAttribute('position', new T.Float32BufferAttribute(gpos, 3));
    glassGeo.setAttribute('uv', new T.Float32BufferAttribute(guv, 2));
    glassGeo.setIndex([0, 1, 2, 0, 2, 3]); glassGeo.computeVertexNormals();
    var glass = new T.Mesh(glassGeo, mats.glass); glass.renderOrder = 12; group.add(glass);
    PY.glass = glass;
    // interior warm reflection / amber spill plane behind the glass edge
    var film = facePanel('front', (yb + yt) / 2, 0, 2 * ot * .91, yt - yb, FQ.basic(0xff8b54, { transparent: true, opacity: .025, blending: T.AdditiveBlending, depthWrite: false }), .006);
    group.add(film);

    // only one slim central post: the room is meant to read through the glass
    var pb = point('front', yb, 0), pt = point('front', yt, 0);
    var centralPost = boxBeamBetween(pb, pt, .026, .045, mats.frameSteel, false);
    group.add(centralPost);
    // heavy vertical buttress at window edges
    for (var side = -1; side <= 1; side += 2) {
      var pa = point('front', yb - .2, side * (ob + .35)).add(new T.Vector3(0, 0, .05));
      var pb2 = point('front', yt + .22, side * (ot + .3)).add(new T.Vector3(0, 0, .05));
      var butt = boxBeamBetween(pa, pb2, .16, .25, mats.concreteDark, true); group.add(butt);
    }


    // external window light accents / warm spill
    for (var gs = -1; gs <= 1; gs += 2) {
      var jambA = point('front', yb + .15, gs * (ob + .15)).addScaledVector(normal('front'), .04);
      var jambB = point('front', yt - .2, gs * (ot + .15)).addScaledVector(normal('front'), .04);
      var glowBar = boxBeamBetween(jambA, jambB, .035, .04, mats.windowGlow, false);
      group.add(glowBar);
      var sgl = FQ.sprite(group, Tex.glow, 0xff8e50, 1.8, .08); sgl.position.copy(jambA.clone().lerp(jambB, .45)).addScaledVector(normal('front'), .4);
    }
    var winHalo = FQ.sprite(group, Tex.glow, 0xff8a4a, 6.4, .055);
    winHalo.position.copy(point('front', yb + .6, 0)).addScaledVector(normal('front'), .7);
    var lowerBar = boxBeamBetween(point('front', yb + .05, -ob - .1).addScaledVector(normal('front'), .12), point('front', yb + .05, ob + .1).addScaledVector(normal('front'), .12), .025, .025, FQ.basic(0xffb46b, { transparent: true, opacity: .7 }), false);
    group.add(lowerBar);
    // red exterior status strip to the left of the glazing
    var extRed = facePanel('front', yb + 1.4, -ot - 1.2, .16, 2.4, FQ.basic(0xff4f31, { transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false }), .07);
    group.add(extRed);

    // small illuminated lettering over the glass
    var sign = makeControlSign();
    var signPanel = facePanel('front', yt + .62, 0, 3.5, .34, sign, .06);
    group.add(signPanel);
    var redLine = facePanel('front', yt + .42, 0, 2.4, .06, mats.redLine, .07); group.add(redLine);

    // front face black inset / FBC logo near the crown
    addFaceArmor(group, 'front', 17.25, 0, 3.9, 2.25, mats.basalt);
    var logo = facePanel('front', 17.28, 0, 1.55, 1.55, FQ.basic(0xffffff, { map: Tex.fbcLogo, transparent: true, opacity: .72, side: T.DoubleSide, depthWrite: false }), .09);
    group.add(logo);
    // vertical slit lights on front shoulder surfaces
    for (var sl = 0; sl < 4; sl++) {
      var yy = 12.3 + sl * .9;
      var xx = -6.3 + sl * 1.2;
      var slit = facePanel('front', yy, xx, .055, .62, mats.windowGlow, .065); group.add(slit);
    }
    // big black flank + glowing seam
    addFaceArmor(group, 'right', 15.6, 1.4, 4.1, 1.9, mats.basalt);
    addFaceArmor(group, 'right', 11.7, -3.1, 2.8, 1.2, mats.basaltAccent);
    addFaceArmor(group, 'left', 16.1, -1.8, 3.2, 1.5, mats.basalt);
    addFaceArmor(group, 'back', 15.3, 0.2, 4.3, 2.0, mats.basalt);
    // slit windows / amber vertical lights on right flank
    for (var rw = 0; rw < 7; rw++) {
      var ry = 12.4 + rw * .52;
      var rz = -4.8 + rw * 1.1;
      var slot = facePanel('right', ry, rz, .13, .27, mats.windowGlow, .06);
      group.add(slot);
      var slotFrame = facePanel('right', ry, rz, .26, .38, mats.steelDark, .052); group.add(slotFrame);
      // put glowing slot in front of dark frame
      slot.position.addScaledVector(normal('right'), .02);
    }
    // black triangle glyph on right flank
    var glyph = faceTriangle('right', [[15.2, -4.4], [17.65, -4.4], [16.1, 4.0]], mats.basalt, .045);
    group.add(glyph);
    var glyphLine = faceTriangle('right', [[15.38, -4.1], [17.45, -4.1], [16.12, 3.55]], FQ.basic(0xff5b35, { transparent: true, opacity: .28, blending: T.AdditiveBlending, depthWrite: false }), .055);
    group.add(glyphLine);
    // A more reliable emissive outline using thin rails on the right face.
    group.add(facePanel('right', 15.2, -4.4, 2.1, .035, mats.redLine, .07));

    // giant stencilled 07 on the eastern flank
    var stencilMat = FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .26, side: T.DoubleSide, depthWrite: false });
    var stencil = facePanel('right', 17.0, 1.2, 2.8, 2.8, stencilMat, .06);
    group.add(stencil);
    // rows of narrow amber windows low on both flanks
    for (var sideRow = 0; sideRow < 3; sideRow++) {
      for (var win = 0; win < 5; win++) {
        var wy = 10.2 + sideRow * .48;
        var wz = -3.4 + win * 1.5;
        var wglow = facePanel('right', wy, wz, .16, .25, mats.windowGlow, .07); group.add(wglow);
        var wfrm = facePanel('right', wy, wz, .26, .35, mats.steelDark, .055); group.add(wfrm);
        wglow.position.addScaledVector(normal('right'), .02);
      }
    }
    // long red containment strip along the eastern shoulder
    group.add(facePanel('right', 10.62, 0.2, 7.2, .06, mats.redLine, .06));
    // dark service channel down the western flank
    group.add(facePanel('left', 14.4, -2.6, .18, 5.2, mats.steelDark, .04));
    group.add(facePanel('left', 14.4, -2.6, .06, 4.8, mats.redLine, .055));

    // rear face treatment for when the model is orbited
    addFaceArmor(group, 'back', 16.85, 2.1, 4.2, 2.2, mats.basalt);
    var backLogo = facePanel('back', 16.85, 2.1, 1.3, 1.3, FQ.basic(0xffffff, { map: Tex.fbcLogo, transparent: true, opacity: .6, side: T.DoubleSide, depthWrite: false }), .09);
    group.add(backLogo);
    group.add(facePanel('back', 15.4, 2.1, 3.8, .05, mats.redLine, .07));
    for (var bw = 0; bw < 8; bw++) {
      var by = 11.4 + (bw % 2) * .7;
      var bz = -4.2 + Math.floor(bw / 2) * 2.1;
      var wglow = facePanel('back', by, bz, .2, .38, mats.windowGlow, .07); group.add(wglow);
      var wfrm2 = facePanel('back', by, bz, .3, .48, mats.steelDark, .052); group.add(wfrm2);
      wglow.position.addScaledVector(normal('back'), .02);
    }
    var backStencil = facePanel('back', 13.15, -3.9, 2.5, 2.5, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .19, side: T.DoubleSide, depthWrite: false }), .06);
    group.add(backStencil);
    // horizontal belts and crown
    addBelt(group, 19.04, .34, .22, mats.steelDark, mats.brass);
    addBelt(group, 17.94, .21, .18, mats.concreteDark, mats.redLine);
    addBelt(group, 9.66, .26, .22, mats.steelDark, mats.brass);
    addBelt(group, 8.56, .16, .15, mats.steelDark, mats.redLine);
    // apex faceted armor / windows
    for (var fw = 0; fw < 3; fw++) {
      var fname = ['front', 'right', 'left'][fw];
      var pane = facePanel(fname, 9.1, 0, .9, 1.2, mats.glassDark, .055);
      group.add(pane);
      var glow = facePanel(fname, 9.06, 0, .2, .8, mats.windowGlow, .075);
      group.add(glow);
    }
    // underside emitter housings
    for (var e = 0; e < 4; e++) {
      var ang = e * Math.PI / 2 + Math.PI / 4;
      var housing = FQ.cyl(.34, .52, .45, 10, mats.steelDark, true, .0015);
      housing.position.set(Math.cos(ang) * 1.6, P.apexY + .75, Math.sin(ang) * 1.6);
      housing.rotation.z = .15; group.add(housing);
      var lens = FQ.cyl(.24, .24, .06, 12, FQ.basic(0xff7144, { transparent: true, opacity: .7, blending: T.AdditiveBlending }), false);
      lens.position.set(Math.cos(ang) * 1.6, P.apexY + .54, Math.sin(ang) * 1.6); group.add(lens);
    }
  }

  function makeControlSign() {
    var W = 1024, H = 128, c = FQ.canvas(W, H), g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(18,22,22,.72)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(185,153,91,.68)'; g.lineWidth = 3; g.strokeRect(5, 5, W - 10, H - 10);
    g.fillStyle = 'rgba(223,213,190,.9)'; g.font = '600 31px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'left';
    g.fillText('FEDERAL BUREAU OF CONTROL  /  QUARRY CONTROL', 31, 52);
    g.fillStyle = 'rgba(160,50,42,.9)'; g.font = '21px "Courier New", monospace';
    g.fillText('LEVEL 02  ·  SITE AWE-77  ·  INVERSION MONUMENT', 32, 91);
    g.fillStyle = 'rgba(198,180,143,.6)'; g.beginPath(); g.moveTo(W - 83, 29); g.lineTo(W - 39, 96); g.lineTo(W - 127, 96); g.closePath(); g.fill();
    return FQ.basic(0xffffff, { map: FQ.tex(c, {}), side: T.DoubleSide });
  }

  function buildRoof(group) {
    var g = FQ.group(group);
    var zTop = P.topY;
    var deckGeo = new T.BoxGeometry(19.15, .34, 19.15);
    var deck = new T.Mesh(deckGeo, mats.roof); deck.position.y = zTop + .17; deck.castShadow = true; deck.receiveShadow = true; FQ.outline(deck, .0024); g.add(deck);
    // roof perimeter parapet with breaks
    var sideW = 19.15, ph = .58, pw = .32;
    var defs = [
      [0, zTop + .34 + ph / 2, 9.5, 19.15, pw],
      [0, zTop + .34 + ph / 2, -9.5, 19.15, pw],
      [9.5, zTop + .34 + ph / 2, 0, pw, 19.15],
      [-9.5, zTop + .34 + ph / 2, 0, pw, 19.15]
    ];
    for (var d = 0; d < defs.length; d++) {
      var q = defs[d];
      var p = FQ.box(q[3], ph, q[4], mats.concreteDark, true, .0018);
      p.position.set(q[0], q[1], q[2]); g.add(p);
      var top = FQ.box(q[3] + .1, .07, q[4] + .1, mats.steel, false);
      top.position.set(q[0], q[1] + ph / 2 + .03, q[2]); g.add(top);
    }
    // brass guide line etched on the deck
    for (var i = -1; i <= 1; i += 2) {
      var line = FQ.box(17.1, .025, .035, mats.brass, false);
      line.position.set(0, zTop + .36, i * 5.2); g.add(line);
    }
    // central inverted-pyramid brass sigil / gravity ring
    var ringMat = FQ.brass(0xa98548, .34);
    var ring = new T.Mesh(new T.TorusGeometry(3.4, .075, 8, 64), ringMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = zTop + .38; g.add(ring);
    var ring2 = new T.Mesh(new T.TorusGeometry(2.72, .028, 6, 64), mats.redLine);
    ring2.rotation.x = Math.PI / 2; ring2.position.y = zTop + .42; g.add(ring2);
    for (var sp = 0; sp < 8; sp++) {
      var a = sp / 8 * Math.PI * 2;
      var spoke = FQ.box(2.7, .04, .055, mats.steelDark, false);
      spoke.position.set(Math.cos(a) * 1.35, zTop + .39, Math.sin(a) * 1.35);
      spoke.rotation.y = -a; g.add(spoke);
    }
    var glyph = FQ.plane(4.2, 4.2, FQ.basic(0xffffff, { map: Tex.stencil07, transparent: true, opacity: .2, depthWrite: false }), 1, 1);
    glyph.rotation.x = -Math.PI / 2; glyph.rotation.z = .04; glyph.position.set(-5.3, zTop + .36, 3.8); g.add(glyph);

    // blockhouse / vent house
    var house = FQ.group(g, -4.5, zTop + .34, -3.0);
    var body = FQ.box(4.15, 1.7, 3.3, mats.concrete, true, .0023); body.position.y = .85; house.add(body);
    var hroof = FQ.box(4.45, .18, 3.6, mats.steelDark, true, .0017); hroof.position.y = 1.78; house.add(hroof);
    var door = FQ.box(1.0, 1.1, .06, mats.steel, true, .0014); door.position.set(1.2, .56, 1.68); house.add(door);
    var hazardPlate = FQ.textPlane(.8, .8, Tex.warnNoEntry, { side: T.FrontSide });
    hazardPlate.position.set(-.65, 1.0, 1.72); house.add(hazardPlate);
    for (var v = 0; v < 3; v++) {
      var duct = FQ.cyl(.12, .12, 1.2, 8, mats.steel, false);
      duct.position.set(-1.4 + v * .35, 1.9, -.7); house.add(duct);
      var vent = FQ.cyl(.2, .16, .22, 8, mats.steelDark, false);
      vent.position.set(-1.4 + v * .35, 2.5, -.7); house.add(vent);
    }
    // tall lattice comms mast
    var mast = FQ.group(g, 3.65, zTop + .34, -3.8);
    var mastMat = mats.steel;
    var legPts = [[-.45, 0, -.45], [.45, 0, -.45], [.45, 0, .45], [-.45, 0, .45]];
    for (var lp = 0; lp < 4; lp++) {
      var leg = FQ.cyl(.035, .055, 2.75, 6, mastMat, false);
      leg.position.set(legPts[lp][0] * .7, 1.375, legPts[lp][2] * .7);
      leg.rotation.x = legPts[lp][1] * .02; leg.rotation.z = -legPts[lp][0] * .035;
      mast.add(leg);
    }
    for (var level = 0; level < 3; level++) {
      var y = .72 + level * .72;
      var r = 0.62 - level * .08;
      var bar = FQ.box(r * 2, .04, .04, mastMat, false);
      bar.position.set(0, y, r); mast.add(bar);
      var bar2 = bar.clone(); bar2.position.z = -r; mast.add(bar2);
      bar = FQ.box(.04, .04, r * 2, mastMat, false); bar.position.set(r, y, 0); mast.add(bar);
      bar2 = bar.clone(); bar2.position.x = -r; mast.add(bar2);
    }
    var dish = new T.Mesh(new T.SphereGeometry(0.52, 12, 6, 0, Math.PI * 2, 0, Math.PI * .42), mats.steelDark);
    dish.rotation.x = Math.PI * .5; dish.rotation.z = .4; dish.position.set(0, 2.3, .1); mast.add(dish);
    var beacon = new T.Mesh(new T.SphereGeometry(.11, 10, 8), FQ.basic(0xff3c27));
    beacon.position.set(0, 2.95, 0); mast.add(beacon); anim.beacons.push(beacon);
    var antenna = FQ.cyl(.022, .022, .8, 6, mats.steel, false); antenna.position.set(.1, 3.25, -.1); mast.add(antenna);
    // a second smaller dish
    var dish2 = new T.Mesh(new T.SphereGeometry(.28, 10, 6, 0, Math.PI * 2, 0, Math.PI * .45), mats.steelDark);
    dish2.rotation.x = Math.PI * .5; dish2.rotation.z = -.8; dish2.position.set(1.6, 2.9, 1.4); g.add(dish2);

    // roof-mounted ventilation / pump cluster
    var unit = FQ.group(g, 4.3, zTop + .34, 3.6);
    for (var u = 0; u < 2; u++) {
      var boxunit = FQ.box(2.3, 1.25, 1.8, FQ.toon(0x2f3633, { gradientMap: FQ.gradHard, ink: .26 }), true, .002);
      boxunit.position.set(u * 2.7, .65, 0); unit.add(boxunit);
      for (var lv = 0; lv < 4; lv++) {
        var louvre = FQ.box(2.06, .035, .04, mats.iron, false); louvre.position.set(u * 2.7, .25 + lv * .22, .92); unit.add(louvre);
      }
      var fan = new T.Mesh(new T.TorusGeometry(.52, .06, 6, 24), mats.steelDark); fan.rotation.x = Math.PI / 2; fan.position.set(u * 2.7, 1.35, 0); unit.add(fan);
      var hub = FQ.cyl(.1, .1, .25, 10, mats.steel, false); hub.position.set(u * 2.7, 1.4, 0); unit.add(hub);
      var blades = FQ.group(unit, u * 2.7, 1.37, 0); blades.rotation.x = -Math.PI / 2;
      for (var bl = 0; bl < 4; bl++) {
        var blade = FQ.box(.72, .02, .16, mats.steel, false);
        blade.rotation.y = bl * Math.PI / 2; blades.add(blade);
      }
      anim.fans.push(blades);
    }
    // cooling pipes around the roof
    var pp = [
      [new T.Vector3(-6.8, zTop + .5, 5.3), new T.Vector3(-1.0, zTop + .5, 5.3), new T.Vector3(-.5, zTop + .9, 3.9)],
      [new T.Vector3(6.9, zTop + .48, -5.3), new T.Vector3(1.2, zTop + .48, -5.3), new T.Vector3(.1, zTop + .8, -4.0)]
    ];
    for (var pi = 0; pi < pp.length; pi++) {
      for (var pk = 0; pk < pp[pi].length - 1; pk++) {
        var pipe = FQ.tube([pp[pi][pk], pp[pi][pk + 1]], .075, mats.steel, 12, 6); g.add(pipe);
      }
    }
    // edge navigation lights
    for (var c = 0; c < 4; c++) {
      var cx = c < 2 ? -9.0 : 9.0;
      var cz = (c % 2 === 0) ? 9.0 : -9.0;
      var lamp = FQ.box(.24, .2, .24, mats.steelDark, false); lamp.position.set(cx, zTop + .75, cz); g.add(lamp);
      var lens = FQ.sphere(.07, 8, 6, FQ.basic(0xff3a25), false); lens.position.set(cx, zTop + .87, cz); g.add(lens);
      anim.beacons.push(lens);
    }
    // rooftop light spill sprites (atmosphere, no extra lights)
    var glowSprite = FQ.sprite(g, Tex.glow, 0xff6c3d, 2.4, .12); glowSprite.position.set(0, zTop + .55, 0);
    // tiny roof rail posts on front edge
    for (var rp = 0; rp < 8; rp++) {
      var post = FQ.box(.045, .54, .045, mats.steel, false);
      post.position.set(-7.4 + rp * 2.1, zTop + .77, 9.22); g.add(post);
    }
    var rail = FQ.box(14.7, .035, .035, mats.steel, false); rail.position.set(0, zTop + 1.0, 9.22); g.add(rail);
    var rail2 = rail.clone(); rail2.position.y = zTop + .82; g.add(rail2);
    // roof service clutter / cable drums
    for (var rc = 0; rc < 4; rc++) {
      var drum = FQ.cyl(.46, .46, .22, 14, mats.rust, true, .001);
      drum.rotation.x = Math.PI / 2; drum.position.set(-7.2 + rc * 1.2, zTop + .46, -7.3 + (rc % 2) * 2.1); g.add(drum);
    }
    for (var pipe = 0; pipe < 3; pipe++) {
      var duct = FQ.cyl(.09, .09, 5.0, 8, mats.steel, false);
      duct.rotation.z = Math.PI / 2; duct.position.set(-2.7 + pipe * .4, zTop + .52, 7.0); g.add(duct);
    }
    // angular antenna mast / lightning spine
    var spine = boxBeamBetween(new T.Vector3(6.1, zTop + .34, 6.3), new T.Vector3(5.8, zTop + 2.5, 6.2), .11, .11, mats.steelDark); g.add(spine);
    var cross = FQ.box(1.1, .06, .06, mats.steel, false); cross.position.set(5.8, zTop + 2.15, 6.2); g.add(cross);
    var beacon2 = FQ.sphere(.075, 8, 6, FQ.basic(0xff3c27), false); beacon2.position.set(5.8, zTop + 2.58, 6.2); g.add(beacon2); anim.beacons.push(beacon2);
    // roof pylon lights
    for (var pyl = 0; pyl < 4; pyl++) {
      var px = pyl < 2 ? -8.2 : 8.2; var pz = (pyl % 2 === 0) ? -8.2 : 8.2;
      var lamp = FQ.sphere(.065, 8, 6, FQ.basic(0xffa666), false); lamp.position.set(px, zTop + .52, pz); g.add(lamp);
      var gl = FQ.sprite(g, Tex.glow, 0xffa25d, 1.1, .1); gl.position.set(px, zTop + .55, pz);
    }
  }

  function buildApexField(group) {
    var apexGlow = FQ.sprite(group, Tex.glow, 0xff6d44, 2.2, .38);
    apexGlow.position.set(0, P.apexY + .2, 0);
    var core = new T.Group(); group.add(core);
    // faceted gravity engine hanging from the tip
    var rockMat = FQ.toon(0x171a1a, { gradientMap: FQ.gradHard, rim: .24, rimColor: 0xc44932 });
    var crystal = new T.Mesh(new T.OctahedronGeometry(1.05, 0), rockMat);
    crystal.scale.set(.6, 1.5, .6); crystal.position.y = P.apexY - .25; core.add(crystal);
    var cage = new T.Mesh(new T.TorusGeometry(.85, .035, 6, 32), mats.brass);
    cage.rotation.x = Math.PI / 2; cage.position.y = P.apexY - .25; core.add(cage);
    var cage2 = cage.clone(); cage2.rotation.x = 0; cage2.rotation.z = .5; cage2.scale.set(1.2, 1.2, 1.2); core.add(cage2);
    var glow = FQ.sphere(.34, 12, 10, FQ.basic(0xff4529, { transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false }), false);
    glow.position.y = P.apexY - .45; core.add(glow);
    anim.rings.push(cage); anim.rings.push(cage2);

    // suspension beam — a soft industrial column of red/orange light
    var yTop = P.apexY - .25, yBot = -2.95;
    var len = yTop - yBot;
    var geo = new T.CylinderGeometry(.08, .38, len, 18, 1, true);
    var mat = new T.ShaderMaterial({
      transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColorA: { value: new T.Color(0xff5a2e) }, uColorB: { value: new T.Color(0xffc18d) }, uPower: { value: .38 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }',
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vV;',
        'uniform float uTime,uPower; uniform vec3 uColorA,uColorB;',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
        'void main(){',
        ' float edge=pow(1.0-abs(dot(normalize(vN),normalize(vV))),1.6);',
        ' float bands=.52+.48*sin(vUv.y*50.-uTime*1.25);',
        ' float pulse=pow(max(0.,sin(vUv.y*8.-uTime*.7)),6.);',
        ' float a=(.16+bands*.13+pulse*.22)*edge*uPower;',
        ' vec3 c=mix(uColorA,uColorB,.35+pulse*.45);',
        ' gl_FragColor=vec4(c,a);',
        '}'
      ].join('\n')
    });
    var beam = new T.Mesh(geo, mat);
    beam.position.y = (yTop + yBot) / 2;
    beam.userData.noOutline = true; group.add(beam);
    PY.beam = beam; PY.beamMat = mat;
    FQ.updaters.push(function (dt, t) { mat.uniforms.uTime.value = t; });

    // narrow bright core
    var coreBeam = new T.Mesh(new T.CylinderGeometry(.018, .075, len, 8, 1, true), FQ.basic(0xffd2a2, { transparent: true, opacity: .38, blending: T.AdditiveBlending, depthWrite: false }));
    coreBeam.position.y = (yTop + yBot) / 2; group.add(coreBeam);

    // rotating field rings around the shaft
    var ringYs = [-1.2, 1.6, 4.2];
    for (var i = 0; i < ringYs.length; i++) {
      var rg = new T.Group(); group.add(rg);
      rg.position.y = ringYs[i];
      var r1 = new T.Mesh(new T.TorusGeometry(1.5 - i * .2, .028, 6, 48), mats.brass);
      r1.rotation.x = Math.PI / 2; rg.add(r1);
      var r2 = new T.Mesh(new T.TorusGeometry(1.1 - i * .12, .025, 6, 32), FQ.basic(0xff5a34, { transparent: true, opacity: .55, blending: T.AdditiveBlending, toneMapped: false }));
      r2.rotation.x = Math.PI / 2; r2.rotation.z = .7; rg.add(r2);
      for (var k = 0; k < 3; k++) {
        var arm = FQ.box(1.0, .035, .04, mats.steelDark, false);
        arm.position.set(Math.cos(k * 2.09) * .6, 0, Math.sin(k * 2.09) * .6);
        arm.rotation.y = -k * 2.09; rg.add(arm);
      }
      anim.rings.push(rg);
    }

    // impact halo on the pit floor below
    var halo = FQ.group(group);
    halo.position.y = -2.88;
    var haloTex = Tex.glow;
    var glowDisc = new T.Mesh(new T.CircleGeometry(3.0, 48), FQ.basic(0xff4b2c, { transparent: true, opacity: .26, blending: T.AdditiveBlending, depthWrite: false, map: haloTex, side: T.DoubleSide }));
    glowDisc.rotation.x = -Math.PI / 2; halo.add(glowDisc);
    for (var hr = 0; hr < 3; hr++) {
      var ring = new T.Mesh(new T.RingGeometry(1.6 + hr * .55, 1.66 + hr * .55, 48), FQ.basic(hr === 1 ? 0xff6a42 : 0xb89052, { transparent: true, opacity: .36 - hr * .06, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; halo.add(ring);
      anim.rings.push(ring);
    }
    var underLight = new T.PointLight(0xff5d36, 2.2, 10, 2);
    underLight.position.set(0, P.apexY - .8, 0); group.add(underLight);
    PY.underLight = underLight;

    // floating rubble field around the apex: +50% count and +50% spread,
    // with a wider random size distribution than the original debris
    var shardCount = 21; // 14 × 1.5
    for (var fr = 0; fr < shardCount; fr++) {
      var srand = Math.pow(rng(), 1.9);
      var baseSize = .06 + srand * .36;
      var geo = (fr % 3 === 0)
        ? new T.TetrahedronGeometry(baseSize, 0)
        : new T.DodecahedronGeometry(baseSize, 0);
      var shard = new T.Mesh(geo, mats.basalt);
      // previous 2.1..4.8 and 5.7 vertical band, each +20% again
      var ang = rng() * 6.28;
      var rad = 2.52 + rng() * 3.24;
      var y = P.apexY - 2.7 + rng() * 6.84;
      shard.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      shard.rotation.set(rng() * 3.14, rng() * 3.14, rng() * 3.14);
      shard.scale.set(.65 + rng() * .8, .58 + rng() * .95, .65 + rng() * .8);
      FQ.outline(shard, .0011);
      group.add(shard);
      anim.panels.push({
        mesh: shard,
        baseY: y,
        orbit: true,
        ang: ang,
        rad: rad,
        speed: .03 + rng() * .04,
        phase: rng() * 6.28
      });
    }
  }

  function buildExtensions(group) {
    // a couple of suspended external service platforms and antennae clipped to the shell
    var arm = new T.Group(); arm.position.set(wAt(12.3) + .04, 12.3, -2.4); group.add(arm);
    var strut = boxBeamBetween(new T.Vector3(0, 0, 0), new T.Vector3(1.9, -.55, 1.5), .12, .15, mats.steelDark);
    arm.add(strut);
    var platform = FQ.box(2.4, .14, 1.8, mats.steel, true, .0015); platform.position.set(2.35, -.75, 1.5); arm.add(platform);
    for (var i = 0; i < 5; i++) {
      var post = FQ.box(.04, .65, .04, mats.steelDark, false); post.position.set(1.4 + i * .5, -.4, 2.34); arm.add(post);
    }
    var rail = FQ.box(2.2, .04, .04, mats.steelDark, false); rail.position.set(2.35, -.1, 2.34); arm.add(rail);
    var hazard = FQ.box(.5, .3, .06, FQ.toon(0xffffff, { map: FQ.repeatTex(Tex.hazard, 1, 1) }), false); hazard.position.set(2.35, -.57, 2.34); arm.add(hazard);
    // caution side ladder down the pyramid face (abstract thin rails)
    var l1 = boxBeamBetween(new T.Vector3(6.75, 15.8, 6.3), new T.Vector3(3.3, 10.85, 3.2), .035, .04, mats.steelMid); group.add(l1);
    var l2 = boxBeamBetween(new T.Vector3(7.25, 15.8, 6.8), new T.Vector3(3.65, 10.85, 3.55), .035, .04, mats.steelMid); group.add(l2);
    for (var s = 0; s < 12; s++) {
      var t = s / 12;
      var p1 = new T.Vector3(6.75, 15.8, 6.3).lerp(new T.Vector3(3.3, 10.85, 3.2), t);
      var p2 = new T.Vector3(7.25, 15.8, 6.8).lerp(new T.Vector3(3.65, 10.85, 3.55), t);
      var step = boxBeamBetween(p1, p2, .025, .035, mats.steel, false); group.add(step);
    }
  }

  function buildPyramid(scene) {
    makeMaterials();
    var root = FQ.group(scene, P.x, 0, P.z);
    root.name = 'inverted-pyramid';
    PY.root = root;
    // shell
    var shell = FQ.group(root);
    buildShell(shell);
    addEdgeRibs(shell);
    buildExtensions(shell);

    // interior (module created later)
    var interior = null;
    if (FQ.interior && FQ.interior.build) interior = FQ.interior.build(root, { yb: P.roomFloor, yt: P.roomCeil, halfBottom: 2.52, halfTop: 4.95 });

    // roof & apex
    buildRoof(root);
    buildApexField(root);

    // the room's light is carried by its own fixtures and emissive signage

    // dynamic micro-misalignment + beacon flicker
    var t0 = 0;
    FQ.updaters.push(function (dt, t) {
      t0 += dt;
      root.position.y = Math.sin(t * .16) * .055;
      root.rotation.y = Math.sin(t * .05 + 1.2) * .00075;
      if (interior && interior.group) {
        interior.group.position.x = Math.sin(t * .19) * .025;
        interior.group.position.y = Math.cos(t * .15) * .015;
      }
      for (var i = 0; i < anim.panels.length; i++) {
        var p = anim.panels[i];
        if (p.orbit) {
          p.mesh.position.x = Math.cos(p.ang + t * p.speed) * p.rad;
          p.mesh.position.z = Math.sin(p.ang + t * p.speed) * p.rad;
          p.mesh.position.y = p.baseY + Math.sin(t * .45 + p.phase) * .14;
          p.mesh.rotation.x += dt * .012;
          p.mesh.rotation.y += dt * .03;
        } else {
          p.mesh.position.y = p.base.y + Math.sin(t * .22 + p.phase) * .035;
          p.mesh.rotation.z = Math.sin(t * .13 + p.phase) * .0015;
        }
      }
      for (var b = 0; b < anim.beacons.length; b++) {
        var beacon = anim.beacons[b];
        var on = (Math.sin(t * 1.8 + b) > .3);
        if (beacon.material) {
          beacon.material.color.setHex(on ? 0xff3b24 : 0x5a1b15);
          if (beacon.material.emissive) beacon.material.emissiveIntensity = on ? 1 : .1;
        }
      }
      for (var r = 0; r < anim.rings.length; r++) {
        var obj = anim.rings[r];
        obj.rotation.z += dt * (r % 2 ? -.045 : .062);
        obj.rotation.y += dt * .022;
      }
      for (var f = 0; f < anim.fans.length; f++) anim.fans[f].rotation.z += dt * .7;
      if (PY.underLight) PY.underLight.intensity = 1.8 + Math.sin(t * 2.4) * .5 + Math.sin(t * 8.7) * .16;
      if (interior && interior.update) interior.update(dt, t);
    });
    scene.add(root);
    PY.shell = shell;
    PY.interior = interior;
    return PY;
  }

  PY.build = buildPyramid;
})();
