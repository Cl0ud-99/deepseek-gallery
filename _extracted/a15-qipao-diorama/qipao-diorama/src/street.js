/* =========================================================
   street.js — tram, rickshaw, lamp, mailbox, wires & stop
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP, P = QP.PAL;
  var glowTex = QP.Tex.glow(), starTex = QP.Tex.starGlow();
  var M = {};
  var anim = (QP.streetAnim = {});
  var add, cyl, barBetween;

  function initMats() {
    M.iron = QP.iron(0x121416);
    M.iron2 = QP.iron(0x272a2a);
    M.brass = QP.brass(0xbe984c, .24);
    M.brassLight = QP.brass(0xdcb76e, .18);
    M.brassDark = QP.brass(0x765520, .36);
    M.stone = QP.toon(0x655e52, { rim: .03 });
    M.stoneLight = QP.toon(0x766b5a);
    M.stoneDark = QP.toon(0x39352e);
    M.wood = QP.std(0xffffff, { map: QP.cloneTex(QP.Tex.walnutDark(), 1.2, 1.4), roughness: .36, metalness: .04, envMapIntensity: .6 });
    M.woodLight = QP.std(0xffffff, { map: QP.cloneTex(QP.Tex.walnut(), 1.5, 1), roughness: .35, metalness: .03, envMapIntensity: .5 });
    M.tramGreen = QP.std(0x2f5546, { roughness: .31, metalness: .08, envMapIntensity: .9 });
    M.tramGreenDark = QP.std(0x1b3a30, { roughness: .36, metalness: .05, envMapIntensity: .6 });
    M.tramCream = QP.toon(0xba9f6e, { rim: .04 });
    M.tramRoof = QP.toon(0x2b3b35, { rim: .20, rimColor: 0x6c8f9b, gradientMap: QP.gradSoft });
    M.tramRoofGlow = QP.toon(0x44564d, { rim: .25, rimColor: 0x9cb9b5, gradientMap: QP.gradSoft });
    M.tramFrame = QP.std(0x3d2818, { roughness: .3, metalness: .04 });
    M.tramGlass = QP.physical(0xa8bfbd, {
      roughness: .05, metalness: 0, transparent: true, opacity: .17, clearcoat: 1,
      clearcoatRoughness: .02, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false
    });
    M.greenLeather = QP.physical(0x234b3a, { roughness: .55, sheen: .8, sheenColor: 0x8bb69b });
    M.tarp = QP.std(0x6f5b3e, { roughness: .48, metalness: .04, envMapIntensity: .25 });
    M.tarpDark = QP.std(0x544429, { roughness: .55 });
    M.rubber = QP.std(0x111112, { roughness: .65, metalness: .03 });
    M.phoneBoxBlack = QP.std(0x0a0d0c, { roughness: .31, metalness: .22, envMapIntensity: .7 });
    M.skinGlass = QP.physical(0xffe1aa, {
      color: 0xffd79a, roughness: .1, metalness: 0, transparent: true, opacity: .45,
      emissive: 0xffb45c, emissiveIntensity: 1.7, clearcoat: 1, side: T.DoubleSide, depthWrite: false
    });
  }

  add = function (parent, w, h, d, mat, x, y, z, o) {
    o = o || {};
    var m = QP.box(w, h, d, mat, o.outline !== undefined ? o.outline : false, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    if (o.receive !== false) m.receiveShadow = true;
    return m;
  };
  cyl = function (parent, rt, rb, h, seg, mat, x, y, z, o) {
    o = o || {};
    var m = QP.cyl(rt, rb, h, seg, mat, o.outline !== undefined ? o.outline : false, o.thick);
    QP.put(parent, m, x, y, z, o.ry, o.rx, o.rz);
    if (o.cast) m.castShadow = true;
    return m;
  };
  barBetween = function (parent, a, b, rad, mat, seg) {
    var len = a.distanceTo(b);
    var geo = new T.CylinderGeometry(rad, rad, len, seg || 6, 1, false);
    var m = new T.Mesh(geo, mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    parent.add(m);
    return m;
  };
  function glow(parent, color, size, op, x, y, z) {
    return QP.addGlowSprite(parent, glowTex, color, size, op, x, y, z);
  }
  function shadowBlob(parent, w, d, x, y, z, op) {
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({
      map: glowTex, color: 0x000000, transparent: true, opacity: op === undefined ? .38 : op, depthWrite: false
    }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y + .004, z); parent.add(m);
  }
  function tubePath(parent, pts, rad, mat, segs) {
    var curve = new T.CatmullRomCurve3(pts);
    var m = new T.Mesh(new T.TubeGeometry(curve, segs || 24, rad, 6, false), mat);
    parent.add(m); return m;
  }

  /* ---------------- street lamp ---------------- */
  function streetLamp(world, x, z, ry) {
    var g = QP.group(world, x, .14, z);
    g.rotation.y = ry || 0;
    g.name = 'cast-iron-street-lamp';
    /* stone foot + cast base */
    add(g, .78, .16, .78, M.stone, 0, .08, 0, { outline: true, thick: .002 });
    add(g, .64, .12, .64, M.stoneLight, 0, .19, 0, {});
    var base = new T.Mesh(new T.LatheGeometry([
      new T.Vector2(.29, 0), new T.Vector2(.32, .08), new T.Vector2(.25, .16),
      new T.Vector2(.28, .20), new T.Vector2(.21, .32), new T.Vector2(.16, .48),
      new T.Vector2(.14, .65), new T.Vector2(.12, 1.0), new T.Vector2(.10, 1.4)
    ], 16), M.iron);
    base.position.y = .24; base.castShadow = true; g.add(base);
    for (var i = 0; i < 4; i++) {
      var leaf = new T.Mesh(new T.TorusGeometry(.19, .018, 5, 12, Math.PI * 1.3), M.iron2);
      leaf.position.set(Math.cos(i * 1.57) * .14, .35, Math.sin(i * 1.57) * .14);
      leaf.rotation.y = -i * 1.57; leaf.rotation.x = .8; g.add(leaf);
    }
    /* fluted shaft */
    var pole = new T.Mesh(new T.CylinderGeometry(.065, .115, 3.15, 12), M.iron);
    pole.position.y = 2.08; pole.castShadow = true; g.add(pole);
    for (var f = 0; f < 6; f++) {
      var flute = new T.Mesh(new T.CylinderGeometry(.012, .018, 2.95, 4), M.iron2);
      flute.position.set(Math.cos(f * Math.PI / 3) * .095, 2.07, Math.sin(f * Math.PI / 3) * .095); g.add(flute);
    }
    for (var ring = 0; ring < 7; ring++) {
      var rr = new T.Mesh(new T.TorusGeometry(.095 - ring * .002, .009, 4, 12), M.iron2);
      rr.rotation.x = Math.PI / 2; rr.position.y = .68 + ring * .32; g.add(rr);
    }
    /* curved arm to the street side */
    var armPts = [
      new T.Vector3(0, 3.62, 0), new T.Vector3(.05, 3.93, .12),
      new T.Vector3(.10, 4.15, .42), new T.Vector3(.12, 4.21, .82),
      new T.Vector3(.10, 4.17, 1.10)
    ];
    tubePath(g, armPts, .036, M.iron, 20);
    tubePath(g, [new T.Vector3(0,3.55,0), new T.Vector3(.12,3.65,.34), new T.Vector3(.1,3.72,.64)], .015, M.iron2, 12);
    var curl = new T.Mesh(new T.TorusGeometry(.18, .015, 5, 14, Math.PI * 1.55), M.iron2);
    curl.position.set(.1, 3.72, .55); curl.rotation.y = Math.PI / 2; curl.rotation.z = .55; g.add(curl);
    var finial = QP.cyl(.035, .035, .20, 8, M.brassDark, false); QP.put(g, finial, .1, 4.36, 1.1);
    var orb = QP.sphere(.07, 8, 6, M.brass, false); QP.put(g, orb, .1, 4.50, 1.1);
    /* hanging lantern */
    var lg = QP.group(g, .1, 0, 1.1);
    QP.put(lg, QP.cyl(.018, .018, .25, 6, M.iron, false), 0, 4.16, 0);
    var cap = new T.Mesh(new T.ConeGeometry(.34, .24, 8), M.iron);
    cap.position.y = 3.92; cap.castShadow = true; lg.add(cap);
    var brim = QP.cyl(.34, .34, .035, 8, M.iron2, false); QP.put(lg, brim, 0, 3.81, 0);
    var inner = QP.cyl(.22, .30, .50, 8, M.skinGlass, false); QP.put(lg, inner, 0, 3.53, 0);
    var cap2 = new T.Mesh(new T.ConeGeometry(.31, .16, 8), M.iron); cap2.rotation.x = Math.PI; cap2.position.y = 3.28; lg.add(cap2);
    /* cage ribs */
    for (var c = 0; c < 8; c++) {
      var a = c / 8 * Math.PI * 2;
      var rib = new T.Mesh(new T.CylinderGeometry(.006, .006, .52, 4), M.iron);
      rib.position.set(Math.cos(a) * .255, 3.53, Math.sin(a) * .255);
      rib.rotation.z = Math.cos(a) * .12; rib.rotation.x = -Math.sin(a) * .12; lg.add(rib);
    }
    var tip = QP.cyl(.001, .07, .15, 6, M.brassDark, false); QP.put(lg, tip, 0, 3.15, 0);
    var bulb = QP.sphere(.095, 10, 8, QP.basic(0xffe2ac), false); QP.put(lg, bulb, 0, 3.55, 0);
    glow(lg, 0xffbf70, 2.6, .50, 0, 3.50, 0);
    var lampLight = new T.PointLight(0xffb266, 7.8, 12, 2);
    lampLight.position.set(0, 3.45, 0); lg.add(lampLight);
    /* soft volumetric cone */
    var volGeo = new T.CylinderGeometry(.30, 2.1, 3.32, 24, 1, true);
    var volMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false,
      uniforms: { uColor: { value: new T.Color(0xffc887) }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform vec3 uColor; uniform float uTime; void main(){ float edge=pow(1.0-abs(dot(normalize(vN),normalize(vV))),1.4); float fade=smoothstep(0.0,.2,vUv.y)*(1.0-smoothstep(.75,1.0,vUv.y)); float shimmer=.72+.28*sin(vUv.y*20.0-uTime*.7+vUv.x*9.0); gl_FragColor=vec4(uColor, edge*fade*.085*shimmer); }'
    });
    var vol = new T.Mesh(volGeo, volMat); vol.position.set(0, 1.86, 0); vol.renderOrder = 3; lg.add(vol);
    anim.lampVol = volMat;
    /* falling light on stone */
    var pool = new T.Mesh(new T.PlaneGeometry(3.2, 3.2), new T.MeshBasicMaterial({
      map: glowTex, color: 0xffbb72, transparent: true, opacity: .2,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, -.135, 0); g.add(pool);
    anim.lamp = { group: g, light: lampLight, bulb: bulb, volMat: volMat, glow: null };
    anim.lampPos = new T.Vector3(x + .1, 3.65, z + 1.1);
    return g;
  }

  /* ---------------- old mailbox ---------------- */
  function postbox(world, x, z) {
    var g = QP.group(world, x, .14, z);
    g.rotation.y = -.22;
    g.name = 'postbox';
    add(g, .68, .12, .68, M.stoneDark || M.stone, 0, .06, 0, { outline: true, thick: .002 });
    var base = QP.cyl(.31, .35, .18, 18, M.phoneBoxBlack, true, .0018); QP.put(g, base, 0, .20, 0);
    var body = QP.cyl(.27, .29, 1.16, 20, M.phoneBoxBlack, true, .0018); QP.put(g, body, 0, .87, 0);
    var collar = new T.Mesh(new T.TorusGeometry(.28, .025, 5, 20), M.brassDark);
    collar.rotation.x = Math.PI / 2; collar.position.y = 1.38; g.add(collar);
    var collar2 = collar.clone(); collar2.position.y = .42; collar2.scale.setScalar(.96); g.add(collar2);
    var dome = QP.sphere(.29, 18, 9, M.phoneBoxBlack, false);
    dome.scale.y = .60; dome.position.y = 1.46; g.add(dome);
    var fin = QP.sphere(.065, 8, 6, M.brass, false); QP.put(g, fin, 0, 1.65, 0);
    /* letter slot */
    add(g, .24, .035, .05, QP.basic(0x050607), 0, 1.10, .281, {});
    add(g, .27, .017, .065, M.brassDark, 0, 1.13, .287, {});
    /* enamel plate */
    var lblC = QP.canvas(512, 256), lg = lblC.getContext('2d');
    lg.fillStyle = 'rgba(239,224,188,0.94)'; lg.fillRect(0, 0, 512, 256);
    lg.strokeStyle = 'rgba(74,55,38,.7)'; lg.lineWidth = 5; lg.strokeRect(14, 14, 484, 228);
    lg.fillStyle = '#303325'; lg.textAlign = 'center'; lg.font = '700 61px "PMingLiU",serif';
    lg.fillText('上 海 郵 政', 256, 95);
    lg.font = '22px "PMingLiU",serif'; lg.fillStyle = 'rgba(42,46,35,.7)';
    lg.fillText('收 信 時 間 · 下 午 六 時', 256, 140);
    lg.font = '18px Georgia,serif'; lg.fillText('SHANGHAI POST  ·  LETTER BOX', 256, 177);
    lg.fillStyle = 'rgba(126,43,44,.9)'; lg.font = '17px "PMingLiU",serif';
    lg.fillText('中華郵政 · 民國廿五年', 256, 214);
    var lbl = new T.Mesh(new T.PlaneGeometry(.44, .22), QP.basic(0xffffff, { map: QP.texture(lblC) }));
    lbl.position.set(0, .86, .287); g.add(lbl);
    var rim = new T.Mesh(new T.TorusGeometry(.225, .011, 4, 16), M.brassDark);
    rim.position.set(0, .86, .29); g.add(rim);
    shadowBlob(world, .9, .8, x, .148, z, .3);
    return g;
  }

  /* ---------------- calendar poster stone column ---------------- */
  function posterColumn(world, x, z) {
    var g = QP.group(world, x, .14, z);
    g.rotation.y = .06;
    add(g, .74, .22, .74, M.stone, 0, .11, 0, { outline: true, thick: .002 });
    add(g, .58, .11, .58, M.stoneLight, 0, .25, 0, {});
    var body = add(g, .48, 1.92, .48, M.stoneDark, 0, 1.18, 0, { outline: true, thick: .0023 });
    /* chamfered pilasters at corners */
    for (var cx = -1; cx <= 1; cx += 2) for (var cz = -1; cz <= 1; cz += 2) {
      add(g, .06, 1.9, .06, M.brassDark, cx * .225, 1.18, cz * .225, {});
    }
    /* poster faces on south and east */
    var posterTex = QP.Tex.calendarPoster();
    var pMat = QP.basic(0xffffff, { map: posterTex });
    pMat.color.setRGB(1.35, 1.25, 1.12);
    function face(px, pz, ry) {
      var pg = QP.group(g, px, 1.21, pz); pg.rotation.y = ry;
      var p = new T.Mesh(new T.PlaneGeometry(.40, .62), pMat); p.position.z = .012; pg.add(p);
      add(pg, .46, .06, .055, M.brass, 0, .335, 0, {});
      add(pg, .46, .06, .055, M.brass, 0, -.335, 0, {});
      add(pg, .06, .72, .055, M.brass, -.23, 0, 0, {});
      add(pg, .06, .72, .055, M.brass, .23, 0, 0, {});
      var glass = new T.Mesh(new T.PlaneGeometry(.42, .64), QP.glass(0xa5b4b2, .10)); glass.position.z = .025; glass.renderOrder = 9; pg.add(glass);
      return pg;
    }
    face(0, .242, 0); face(.242, 0, Math.PI / 2);
    /* little warm hood lamp above the poster */
    add(g, .08, .02, .25, M.brass, 0, 1.92, .31, {});
    var shade = QP.cyl(.055, .10, .09, 10, M.brassDark, true, .0012); QP.put(g, shade, 0, 1.83, .31);
    var pb = QP.sphere(.035, 6, 5, QP.basic(0xffd49a), false); QP.put(g, pb, 0, 1.78, .31);
    glow(g, 0xffb665, .55, .34, 0, 1.76, .32);
    /* crown */
    add(g, .64, .10, .64, M.stoneLight, 0, 2.18, 0, {});
    var cap = QP.cyl(.28, .35, .17, 8, M.stoneDark, true, .002); QP.put(g, cap, 0, 2.32, 0);
    var cap2 = QP.cyl(.025, .27, .20, 8, M.tramRoof, false); QP.put(g, cap2, 0, 2.50, 0);
    var fin = QP.sphere(.065, 8, 6, M.brass, false); QP.put(g, fin, 0, 2.63, 0);
    /* tiny enamel street name above */
    var streetC = QP.canvas(768, 192), sg = streetC.getContext('2d');
    sg.fillStyle = '#153c4a'; sg.fillRect(0, 0, 768, 192);
    sg.strokeStyle = 'rgba(234,223,193,.9)'; sg.lineWidth = 8; sg.strokeRect(10, 10, 748, 172);
    sg.fillStyle = '#ece0c4'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
    sg.font = '700 80px "PMingLiU",serif'; sg.fillText('霞 飛 路', 384, 90);
    sg.font = '26px Georgia,serif'; sg.fillText('AVENUE JOFFRE', 384, 148);
    var sm = new T.Mesh(new T.PlaneGeometry(.60, .15), QP.basic(0xffffff, { map: QP.texture(streetC) }));
    sm.position.set(0, 2.92, .252); g.add(sm);
    add(g, .68, .04, .07, M.brassDark, 0, 3.02, .24, {});
    add(g, .04, .08, .07, M.brassDark, -.31, 2.98, .24, {});
    add(g, .04, .08, .07, M.brassDark, .31, 2.98, .24, {});
    shadowBlob(world, 1.0, 1.0, x, .148, z, .3);
    return g;
  }

  /* ---------------- rickshaw ---------------- */
  function wheel(parent, radius, tube, spokes, matRim, matSpoke, matHub) {
    var g = QP.group(parent, 0, 0, 0);
    var rim = new T.Mesh(new T.TorusGeometry(radius, tube, 5, 24), matRim);
    g.add(rim);
    var inner = new T.Mesh(new T.TorusGeometry(radius * .82, tube * .35, 4, 20), matSpoke);
    g.add(inner);
    for (var i = 0; i < spokes; i++) {
      var a = i / spokes * Math.PI * 2;
      var sp = add(g, .023, radius * 1.54, .023, matSpoke, 0, 0, 0, { rz: a });
    }
    var hub = QP.cyl(.075, .075, .15, 12, matHub, false);
    hub.rotation.x = Math.PI / 2; g.add(hub);
    return g;
  }
  function rickshaw(world, x, z, ry) {
    var g = QP.group(world, x, .145, z); g.rotation.y = ry;
    g.name = 'covered-rickshaw';
    var rimWood = QP.toon(0x9a7440, { rim: .12, rimColor: 0xd7b36e });
    var wheelL = QP.group(g, -.10, .50, -.52); var w1 = wheel(wheelL, .47, .038, 14, rimWood, M.woodLight, M.brass); wheelL.add(w1);
    var wheelR = QP.group(g, -.10, .50, .52); var w2 = wheel(wheelR, .47, .038, 14, rimWood, M.woodLight, M.brass); wheelR.add(w2);
    /* axle */
    var axle = QP.cyl(.035, .035, 1.1, 8, M.iron, false); axle.rotation.x = Math.PI / 2; QP.put(g, axle, -.1, .5, 0);
    /* sprung carriage body */
    add(g, 1.15, .18, .82, M.wood, .10, .58, 0, { outline: true, thick: .0022 });
    add(g, 1.0, .52, .82, M.phoneBoxBlack, .10, .96, 0, { outline: true, thick: .0022 });
    /* seat */
    add(g, .74, .14, .68, M.greenLeather, .18, 1.18, 0, { outline: true, thick: .0018 });
    var backrest = add(g, .16, .55, .72, M.greenLeather, -.20, 1.33, 0, { outline: true, thick: .0018 });
    for (var btn = 0; btn < 3; btn++) {
      var b = QP.sphere(.018, 6, 5, M.brass, false); QP.put(g, b, -.13, 1.40, -.22 + btn * .22);
    }
    /* footboard and side panel */
    add(g, .95, .12, .88, M.wood, .52, .72, 0, {});
    add(g, .05, .62, .92, M.wood, .68, .95, 0, {});
    /* canopy frame */
    var arcMat = M.iron;
    for (var ar = -1; ar <= 1; ar += 2) {
      var arc = new T.Mesh(new T.TorusGeometry(.60, .025, 5, 16, Math.PI), M.woodLight);
      arc.rotation.y = Math.PI / 2; arc.position.set(-.48, 1.22, ar * .49); arc.rotation.z = 0; g.add(arc);
    }
    var ar2 = new T.Mesh(new T.TorusGeometry(.60, .025, 5, 16, Math.PI), M.woodLight);
    ar2.rotation.y = Math.PI / 2; ar2.position.set(-.48, 1.22, 0); g.add(ar2);
    /* tarp canopy half cylinder */
    var targeo = new T.CylinderGeometry(.62, .62, 1.15, 14, 1, true, 0, Math.PI);
    targeo.rotateZ(Math.PI / 2);
    var tarp = new T.Mesh(targeo, M.tarp);
    tarp.position.set(-.38, 1.22, 0);
    tarp.material.side = T.DoubleSide;
    tarp.castShadow = true; g.add(tarp);
    /* tarp rear drape */
    var drapeC = QP.canvas(256, 256), dg = drapeC.getContext('2d');
    dg.fillStyle = '#5d4c33'; dg.fillRect(0, 0, 256, 256);
    for (var ws = 0; ws < 12; ws++) {
      dg.strokeStyle = 'rgba(16,11,7,' + (.12 + Math.random() * .18) + ')'; dg.lineWidth = 2;
      dg.beginPath(); dg.moveTo(10 + ws * 20, 0); dg.bezierCurveTo(30 + ws * 20, 100, -5 + ws * 20, 180, 15 + ws * 20, 256); dg.stroke();
    }
    dg.fillStyle = 'rgba(173,143,91,.14)';
    for (var hl = 0; hl < 8; hl++) dg.fillRect(0, 20 + hl * 28, 256, 2);
    var drape = new T.Mesh(new T.PlaneGeometry(.92, .86, 6, 5), QP.std(0xffffff, { map: QP.texture(drapeC), roughness: .6, side: T.DoubleSide }));
    drape.position.set(-.95, 1.12, 0); drape.rotation.y = 0; drape.rotation.z = .06; g.add(drape);
    /* side curtain flaps */
    for (var fl = -1; fl <= 1; fl += 2) {
      var flap = new T.Mesh(new T.PlaneGeometry(.8, .55, 5, 3), M.tarpDark);
      flap.position.set(-.5, 1.00, fl * .58); flap.rotation.y = fl * .07; g.add(flap);
    }
    /* shafts */
    for (var s = -1; s <= 1; s += 2) {
      var shaft = new T.Mesh(new T.CylinderGeometry(.034, .042, 1.9, 6), M.woodLight);
      shaft.position.set(1.42, .39, s * .38); shaft.rotation.z = 1.23; g.add(shaft);
      var grip = QP.cyl(.045, .045, .22, 8, M.brassDark, false);
      grip.rotation.z = 1.23; QP.put(g, grip, 2.22, .18, s * .38);
    }
    /* kerosene lamp */
    add(g, .12, .20, .12, M.brass, .33, 1.35, .42, { outline: true, thick: .0015 });
    glow(g, 0xffb45f, 1.0, .48, .33, 1.38, .42);
    var lampBulb = QP.sphere(.055, 8, 6, QP.basic(0xffd193), false); QP.put(g, lampBulb, .33, 1.36, .42);
    /* folded blanket */
    add(g, .53, .07, .40, M.tarpDark, .24, 1.28, -.08, { ry: .16 });
    shadowBlob(world, 1.6, 1.5, x, .148, z, .3);
    return g;
  }

  /* ---------------- tram ---------------- */
  function makeTram(world, x, z) {
    var g = QP.group(world, x, 0, z);
    g.name = 'green-wooden-tram';
    anim.tram = g;
    var L = 5.1, W = 2.03;
    var zSide = W / 2;

    /* underframe and wheels */
    add(g, L - .35, .26, 1.65, M.iron, 0, .77, 0, { outline: true, thick: .0024, cast: true });
    for (var wx = -1; wx <= 1; wx += 2) {
      var ax = wx * 1.55;
      add(g, .24, .15, 1.85, M.iron2, ax, .54, 0, {});
      for (var wz = -1; wz <= 1; wz += 2) {
        var wg = QP.group(g, ax, .42, wz * .73);
        var steelWheel = wheel(wg, .33, .038, 10, M.iron, M.iron2, M.brassDark);
        // wheel lies in XY plane with its axis along Z
        wg.add(steelWheel);
        wg.position.z = wz * .73;
      }
      /* leaf springs */
      add(g, .58, .05, 1.2, M.iron2, ax, .74, 0, {});
      var spring = new T.Mesh(new T.TorusGeometry(.40, .028, 5, 12, Math.PI), M.iron2);
      spring.rotation.x = Math.PI / 2; spring.position.set(ax, .80, 0); g.add(spring);
    }
    /* long side sill and bracing */
    add(g, L, .14, W + .04, M.tramCream, 0, .96, 0, { outline: true, thick: .0022 });
    add(g, L - .10, .07, W + .08, M.tramGreenDark, 0, .86, 0, {});
    /* lower wooden body */
    add(g, L, .48, W, M.tramGreen, 0, 1.24, 0, { outline: true, thick: .0026, cast: true });
    add(g, L + .04, .06, W + .02, M.brassDark, 0, 1.50, 0, {});
    /* gold lines and beading */
    for (var gl = 0; gl < 3; gl++) add(g, L - .12, .012, W + .012, gl === 1 ? M.brass : M.tramCream, 0, 1.03 + gl * .18, 0, {});
    /* waist rail */
    add(g, L, .08, W + .03, M.tramCream, 0, 1.53, 0, {});
    /* window band side frames */
    var winBottom = 1.58, winTop = 2.35;
    var posts = [-2.5, -1.78, -.98, -.12, .78, 1.56, 2.42];
    for (var side = -1; side <= 1; side += 2) {
      var zz = side * (zSide + .01);
      add(g, L, .08, .10, M.tramFrame, 0, winTop, zz, {});
      add(g, L, .08, .09, M.tramFrame, 0, winBottom, zz, {});
      for (var pi = 0; pi < posts.length; pi++) {
        add(g, .075, winTop - winBottom, .11, M.tramFrame, posts[pi], (winTop + winBottom) / 2, zz, {});
      }
      for (var wi = 0; wi < posts.length - 1; wi++) {
        var ww = posts[wi + 1] - posts[wi] - .085;
        var pane = new T.Mesh(new T.PlaneGeometry(ww, winTop - winBottom - .12), M.tramGlass);
        pane.position.set((posts[wi] + posts[wi + 1]) / 2, (winTop + winBottom) / 2, zz);
        pane.renderOrder = 12;
        g.add(pane);
        /* window lower ledge and upper colored transom */
        add(g, ww, .015, .035, M.brass, (posts[wi] + posts[wi + 1]) / 2, winBottom + .075, zz + side * .035, {});
      }
      /* side doors: brass handles and handrails */
      add(g, .12, 1.15, .05, M.brass, -2.02, 1.36, zz + side * .06, {});
      add(g, .12, 1.15, .05, M.brass, 1.05, 1.36, zz + side * .06, {});
      /* advertisement board */
      var adMat = QP.basic(0xffffff, { map: QP.Tex.tramAd() });
      var ad = new T.Mesh(new T.PlaneGeometry(1.25, .35), adMat);
      ad.position.set(-.55, 1.24, zz + side * .025); ad.rotation.y = side < 0 ? Math.PI : 0; g.add(ad);
      /* side route plate */
      var routeC = QP.canvas(256, 96), rg = routeC.getContext('2d');
      rg.fillStyle = '#f2e2bb'; rg.fillRect(0, 0, 256, 96); rg.strokeStyle = '#4b2d23'; rg.lineWidth = 3; rg.strokeRect(4, 4, 248, 88);
      rg.fillStyle = '#5f261f'; rg.textAlign = 'center'; rg.font = '700 44px Georgia,serif'; rg.fillText('8', 42, 65);
      rg.font = '35px "PMingLiU",serif'; rg.fillText('靜安寺', 148, 60);
      var rp = new T.Mesh(new T.PlaneGeometry(.50, .18), QP.basic(0xffffff, { map: QP.texture(routeC) }));
      rp.position.set(2.05, 2.02, zz + side * .06); rp.rotation.y = side < 0 ? Math.PI : 0; g.add(rp);
    }
    /* floor inside */
    add(g, L - .25, .08, W - .18, QP.toon(0x2b1b12), 0, 1.0, 0, { receive: false });
    var benchMat = M.wood;
    for (var bs = -1; bs <= 1; bs += 2) {
      add(g, L - .35, .09, .52, M.greenLeather, 0, 1.19, bs * .57, { outline: true, thick: .0015 });
      add(g, L - .35, .11, .52, M.greenLeather, 0, 1.24, bs * .57, {});
      add(g, L - .35, .50, .12, M.wood, 0, 1.45, bs * .84, {});
      for (var bp = -1.8; bp <= 1.8; bp += .9) {
        cyl(g, .018, .018, 2.1, 6, M.brassDark, bp, 1.9, bs * .72, {});
      }
    }
    /* front / rear walls */
    for (var end = -1; end <= 1; end += 2) {
      var endX = end * (L / 2 + .01);
      add(g, .08, .56, W, M.tramGreen, endX - end * .02, 1.22, 0, { outline: true, thick: .0022 });
      add(g, .06, .09, W, M.tramCream, endX, 1.52, 0, {});
      /* window glass front */
      var fg = new T.Mesh(new T.PlaneGeometry(W - .28, .72), M.tramGlass);
      fg.position.set(endX + end * .02, 1.96, 0); fg.rotation.y = end > 0 ? Math.PI / 2 : -Math.PI / 2; fg.renderOrder = 12; g.add(fg);
      /* window framing */
      add(g, .10, .08, W, M.tramFrame, endX, 2.36, 0, {});
      add(g, .10, .08, W, M.tramFrame, endX, 1.58, 0, {});
      add(g, .10, .78, .07, M.tramFrame, endX, 1.97, 0, {});
      /* cabin panel */
      add(g, .10, .53, W - .1, M.tramGreenDark, endX, 1.22, 0, {});
      /* destination board */
      var dest = new T.Mesh(new T.PlaneGeometry(1.35, .30), QP.basic(0xffffff, { map: QP.Tex.tramDest() }));
      dest.position.set(endX + end * .08, 2.44, 0);
      dest.rotation.y = end > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(dest);
      glow(g, 0xffd08a, .8, .26, endX + end * .12, 2.44, 0);
      /* front bumper / cowcatcher */
      add(g, .20, .16, W + .1, M.iron, endX, .58, 0, { outline: true, thick: .0018 });
      for (var cb = -3; cb <= 3; cb++) {
        add(g, .12, .36, .045, M.iron2, endX + end * .25, .46, cb * .25, { rz: end * .5 });
      }
      add(g, .3, .18, 1.85, M.wood, endX, .84, 0, {});
      /* single headlamp on the leading end */
      if (end > 0) {
        var housing = new T.Mesh(new T.CylinderGeometry(.17, .20, .24, 16), M.brass);
        housing.rotation.z = Math.PI / 2; housing.position.set(endX + .12, 1.17, 0); g.add(housing);
        var ring = new T.Mesh(new T.TorusGeometry(.18, .025, 5, 18), M.brassLight);
        ring.rotation.y = Math.PI / 2; ring.position.set(endX + .245, 1.17, 0); g.add(ring);
        var lens = new T.Mesh(new T.CircleGeometry(.15, 20), QP.basic(0xfff0ce)); lens.material.color.setRGB(2.5, 2.1, 1.5);
        lens.rotation.y = Math.PI / 2; lens.position.set(endX + .255, 1.17, 0); g.add(lens);
        glow(g, 0xffd28a, 2.8, .72, endX + .34, 1.17, 0);
        var flare = new T.Sprite(new T.SpriteMaterial({ map: starTex, color: 0xffe3ae, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
        flare.scale.set(1.8, 1.8, 1); flare.position.set(endX + .36, 1.17, .05); g.add(flare);
        anim.headlightGlow = flare;
        var spot = new T.SpotLight(0xffd9a2, 7.0, 15, 0.46, .65, 1.4);
        spot.position.set(endX + .26, 1.17, 0);
        spot.target.position.set(endX + 5.2, .1, 0);
        g.add(spot); g.add(spot.target);
        anim.headlight = spot;
        /* volumetric beam */
        var coneGeo = new T.CylinderGeometry(.02, 1.35, 4.7, 24, 1, true);
        var coneMat = new T.ShaderMaterial({
          transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false,
          uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(0xffd08a) } },
          vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
          fragmentShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uTime; uniform vec3 uColor; void main(){ float edge=pow(1.0-abs(dot(normalize(vN),normalize(vV))),1.6); float fade=smoothstep(0.0,.08,vUv.y)*(1.0-smoothstep(.55,1.0,vUv.y)); float motes=.75+.25*sin(vUv.x*18.0+uTime*.9+vUv.y*10.0); gl_FragColor=vec4(uColor,edge*fade*.10*motes); }'
        });
        var cone = new T.Mesh(coneGeo, coneMat);
        cone.rotation.z = Math.PI / 2; cone.position.set(endX + 2.5, 1.17, 0);
        cone.renderOrder = 3; g.add(cone);
        anim.headlightVol = coneMat;
        anim.headlightPos = new T.Vector3(x + endX + .4, 1.17, z);
        /* handrail front */
        add(g, .05, .7, W, M.brassDark, endX - end * .16, 1.58, 0, {});
      } else {
        var tail = new T.Mesh(new T.CircleGeometry(.11, 16), QP.basic(0xff3b31));
        tail.rotation.y = -Math.PI / 2; tail.position.set(endX - .01, 1.17, 0); g.add(tail);
        glow(g, 0xff3b31, .55, .25, endX - .06, 1.17, 0);
        /* rear driver access */
        add(g, .16, 2.1, .76, M.tramFrame, endX - end * .04, 1.45, 0, {});
      }
    }
    /* roof */
    add(g, L + .02, .065, W + .06, M.tramCream, 0, 2.40, 0, { outline: true, thick: .0018 });
    add(g, L - .02, .11, W, M.tramRoof, 0, 2.51, 0, { outline: true, thick: .0018, cast: true });
    /* clerestory */
    add(g, L - .80, .26, 1.04, M.tramGreenDark, 0, 2.70, 0, { outline: true, thick: .0015 });
    for (var cw = 0; cw < 9; cw++) {
      var cxp = -1.85 + cw * .46;
      add(g, .30, .18, 1.08, M.tramCream, cxp, 2.70, 0, {});
      add(g, .24, .14, .02, QP.basic(0xffd59d), cxp + .21, 2.70, .55, {});
    }
    add(g, L - .24, .07, 1.24, M.tramRoof, 0, 2.86, 0, { outline: true, thick: .0018, cast: true });
    add(g, L - .10, .04, W + .02, M.iron2, 0, 2.92, 0, {});
    /* thin cream/brass roof rails */
    add(g, L - .16, .028, .045, M.tramCream, 0, 2.94, .61, {});
    add(g, L - .16, .028, .045, M.tramCream, 0, 2.94, -.61, {});
    /* ribs and warm clerestory lights break up the dark roof mass */
    for (var rr2 = 0; rr2 < 7; rr2++) {
      var rx2 = -2.1 + rr2 * .7;
      add(g, .05, .025, W + .15, M.brassDark, rx2, 2.61, 0, {});
      add(g, .24, .022, .03, M.brassDark, rx2, 2.91, .64, {});
      add(g, .24, .022, .03, M.brassDark, rx2, 2.91, -.64, {});
    }
    var clGlass = QP.basic(0xffd79d);
    for (var cw2 = 0; cw2 < 8; cw2++) {
      var cxp2 = -1.79 + cw2 * .51;
      add(g, .25, .15, .02, clGlass, cxp2, 2.74, .55, {});
      add(g, .25, .15, .02, clGlass, cxp2, 2.74, -.55, {});
    }
    /* rounded roof edges, not capsule ends */
    for (var er = -1; er <= 1; er += 2) {
      var edgeCyl = new T.Mesh(new T.CylinderGeometry(.105, .105, L + .28, 8, 1, false), M.tramRoof);
      edgeCyl.rotation.z = Math.PI / 2; edgeCyl.position.set(0, 2.48, er * (W / 2 + .10)); g.add(edgeCyl);
      var frontTrim = add(g, .12, .16, W + .2, M.tramCream, er * (L / 2 + .10), 2.45, 0, { outline: true, thick: .0018 });
    }
    /* small destination visor */
    add(g, .34, .07, 1.55, M.tramRoof, L / 2 + .22, 2.54, 0, {});
    add(g, -.34, .07, 1.55, M.tramRoof, -(L / 2 + .22), 2.54, 0, {});
    /* roof vent and bell */
    add(g, .52, .08, .52, M.iron2, .55, 3.12, 0, {});
    for (var rv = 0; rv < 4; rv++) add(g, .45, .02, .055, M.iron, .55, 3.16, -.16 + rv * .1, {});
    var bell = QP.sphere(.08, 10, 7, M.brass, false); QP.put(g, bell, -1.2, 3.16, 0);
    var bellStem = QP.cyl(.012, .012, .16, 5, M.iron, false); QP.put(g, bellStem, -1.2, 3.08, 0);
    /* pantograph */
    var pg = QP.group(g, 0, 0, 0);
    for (var ins = -1; ins <= 1; ins += 2) {
      cyl(pg, .06, .08, .14, 10, QP.toon(0x6e5a3d), ins * .6, 3.18, 0, {});
      cyl(pg, .10, .12, .05, 12, M.iron2, ins * .6, 3.27, 0, {});
    }
    var pp = [
      [new T.Vector3(-.55, 3.30, 0), new T.Vector3(.46, 4.35, 0)],
      [new T.Vector3(.55, 3.30, 0), new T.Vector3(-.46, 4.35, 0)],
      [new T.Vector3(-.46, 4.35, 0), new T.Vector3(-.34, 5.62, 0)],
      [new T.Vector3(.46, 4.35, 0), new T.Vector3(.34, 5.62, 0)]
    ];
    for (var pl = 0; pl < pp.length; pl++) barBetween(pg, pp[pl][0], pp[pl][1], .022, M.iron, 6);
    barBetween(pg, new T.Vector3(-.5, 3.5, .22), new T.Vector3(.5, 3.5, .22), .015, M.iron2, 6);
    barBetween(pg, new T.Vector3(-.34, 5.62, 0), new T.Vector3(.34, 5.62, 0), .018, M.brassDark, 6);
    add(pg, .95, .035, .22, M.iron2, 0, 5.66, 0, {});
    /* contact bow */
    add(pg, 1.05, .026, .075, M.brass, 0, 5.69, 0, {});
    barBetween(pg, new T.Vector3(-.34, 5.62, 0), new T.Vector3(-.34, 5.69, .32), .008, M.brassDark, 5);
    barBetween(pg, new T.Vector3(.34, 5.62, 0), new T.Vector3(.34, 5.69, -.32), .008, M.brassDark, 5);
    /* roof cable */
    tubePath(pg, [new T.Vector3(-.45, 3.25, .1), new T.Vector3(0, 4.6, .2), new T.Vector3(-.35, 5.65, .06)], .008, M.iron2, 14);
    anim.pantographTop = new T.Vector3(x, 5.69, z);
    anim.sparkPoint = new T.Vector3(x, 5.72, z);

    /* interior details seen through windows */
    for (var lightI = -1; lightI <= 1; lightI++) {
      var lampG = QP.group(g, lightI * 1.35, 0, 0);
      cyl(lampG, .01, .01, .34, 4, M.brassDark, 0, 2.29, 0, {});
      var shade = QP.cyl(.085, .12, .06, 10, QP.basic(0xffd89e), false); QP.put(lampG, shade, 0, 2.13, 0);
      glow(lampG, 0xffbd71, .48, .34, 0, 2.11, 0);
    }
    var tramLight = new T.PointLight(0xffb76f, 4.2, 4.8, 2);
    tramLight.position.set(0, 2.08, 0); g.add(tramLight);
    anim.tramLight = tramLight;
    /* driver controls silhouette */
    add(g, .33, .12, 1.0, M.wood, 2.15, 1.2, 0, {});
    add(g, .04, .36, .04, M.brass, 2.07, 1.5, .22, { ry: 0, rx: -.25 });
    add(g, .04, .36, .04, M.brass, 2.07, 1.5, -.22, { rx: .25 });
    var dash = new T.Mesh(new T.TorusGeometry(.16, .018, 4, 14), M.brass); dash.rotation.x = Math.PI / 2; dash.position.set(2.10, 1.45, 0); g.add(dash);
    /* hanging straps */
    for (var hs = 0; hs < 5; hs++) {
      var hx = -1.5 + hs * .75;
      cyl(g, .006, .006, .26, 4, M.brassDark, hx, 2.25, 0, {});
      var loop = new T.Mesh(new T.TorusGeometry(.07, .008, 4, 10), M.brassDark);
      loop.position.set(hx, 2.10, 0); g.add(loop);
    }
    /* underbody details */
    add(g, 1.4, .12, .2, M.iron2, 0, .38, 0, {});
    shadowBlob(world, 6.2, 2.6, x, .03, z, .42);
    /* little destination reflection pool ahead */
    var pool = new T.Mesh(new T.PlaneGeometry(3.2, 2.0), new T.MeshBasicMaterial({ map: glowTex, color: 0xffc581, transparent: true, opacity: .14, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x + 3.2, .04, z); world.add(pool);
    return g;
  }

  /* ---------------- utility pole & wires ---------------- */
  function utilityPole(world, x, z, height, ry) {
    var g = QP.group(world, x, 0, z); g.rotation.y = ry || 0;
    add(g, .55, .45, .55, M.stoneDark, 0, .22, 0, { outline: true, thick: .002 });
    var pole = new T.Mesh(new T.CylinderGeometry(.10, .16, height, 10), M.wood);
    pole.position.y = height / 2 + .18; pole.castShadow = true; g.add(pole);
    /* tar bands */
    for (var b = 0; b < 6; b++) {
      var band = new T.Mesh(new T.TorusGeometry(.12 - b * .003, .012, 4, 10), M.iron2);
      band.rotation.x = Math.PI / 2; band.position.y = .6 + b * .55; g.add(band);
    }
    /* crossarms */
    for (var ca = 0; ca < 2; ca++) {
      var yy = height - .35 - ca * .65;
      add(g, .14, .12, 2.3, M.woodLight, 0, yy, 0, { outline: true, thick: .0018 });
      for (var ins = -1; ins <= 1; ins += 2) {
        cyl(g, .045, .06, .14, 8, M.iron2, ins * .62, yy + .12, 0, {});
        cyl(g, .08, .09, .03, 10, M.iron, ins * .62, yy + .19, 0, {});
      }
    }
    add(g, .55, .08, .55, M.wood, 0, height - 1.8, 0, {});
    /* small transformer box and steps */
    add(g, .30, .60, .26, M.iron2, .19, height - 2.5, 0, { outline: true, thick: .0014 });
    for (var st = 0; st < 4; st++) add(g, .26, .025, .06, M.iron, .19, height - 2.7 + st * .12, .16, {});
    glow(g, 0xffc177, .65, .16, .0, height - 1.2, 0);
    return { group: g, height: height };
  }

  /* ---------------- tram shelter sign & bench ---------------- */
  function stationBench(world, x, z, ry) {
    var g = QP.group(world, x, .15, z); g.rotation.y = ry || 0;
    for (var sx = -1; sx <= 1; sx += 2) {
      var side = QP.group(g, sx * .73, 0, 0);
      add(side, .07, .52, .52, M.iron, 0, .26, 0, {});
      var arm = new T.Mesh(new T.TorusGeometry(.20, .018, 4, 12, Math.PI), M.iron2);
      arm.rotation.y = Math.PI / 2; arm.position.set(0, .56, -.10); side.add(arm);
    }
    for (var sl = 0; sl < 5; sl++) add(g, 1.5, .045, .07, M.woodLight, 0, .49, -.23 + sl * .115, {});
    for (var sb = 0; sb < 4; sb++) add(g, 1.5, .07, .04, M.woodLight, 0, .72 + sb * .115, -.29, { rx: -.10 });
    add(g, 1.34, .08, .06, M.brassDark, 0, .94, -.29, {});
    shadowBlob(world, 1.5, .9, x, .148, z, .25);
    return g;
  }
  function tramStop(world, x, z) {
    var g = QP.group(world, x, .15, z);
    g.rotation.y = -.22;
    g.name = 'tram-stop';
    add(g, .62, .18, .46, M.stone, 0, .09, 0, {});
    var post = new T.Mesh(new T.CylinderGeometry(.055, .075, 3.9, 10), M.iron);
    post.position.y = 2.02; post.castShadow = true; g.add(post);
    for (var r = 0; r < 7; r++) {
      var rr = new T.Mesh(new T.TorusGeometry(.066, .012, 4, 12), M.iron2);
      rr.rotation.x = Math.PI / 2; rr.position.y = .42 + r * .52; g.add(rr);
    }
    /* curled bracket */
    tubePath(g, [new T.Vector3(0, 3.72, 0), new T.Vector3(.25, 3.99, 0), new T.Vector3(.72, 4.01, 0), new T.Vector3(1.02, 3.92, 0)], .025, M.iron2, 16);
    tubePath(g, [new T.Vector3(0, 3.25, 0), new T.Vector3(.26, 3.40, 0), new T.Vector3(.47, 3.82, 0)], .014, M.iron2, 12);
    var signTex = QP.Tex.enamelSign('靜安寺站', 'TZINGAN TEMPLE  ·  TRAM STOP  8', '#143a49', '#efe3c7');
    var sign = new T.Mesh(new T.PlaneGeometry(1.0, .31), QP.basic(0xffffff, { map: signTex }));
    sign.position.set(.69, 3.70, .028); g.add(sign);
    var signBack = sign.clone(); signBack.position.z = -.028; signBack.rotation.y = Math.PI; g.add(signBack);
    add(g, 1.12, .055, .055, M.brassDark, .69, 3.89, 0, {});
    add(g, .05, .36, .05, M.iron2, .13, 3.94, 0, {});
    add(g, 1.08, .39, .025, M.iron, .69, 3.70, 0, {});
    /* suspension chains from an overhead arm */
    add(g, .035, 1.5, .035, M.iron2, .30, 3.64, 0, {});
    add(g, .035, 1.5, .035, M.iron2, 1.08, 3.64, 0, {});
    /* little crown */
    var crown = new T.Mesh(new T.ConeGeometry(.075, .16, 4), M.brass);
    crown.position.set(.69, 3.98, 0); crown.rotation.y = Math.PI / 4; g.add(crown);
    /* illuminated clock */
    var clockC = QP.canvas(256, 256), cg = clockC.getContext('2d');
    cg.fillStyle = '#e5d9bb'; cg.beginPath(); cg.arc(128, 128, 118, 0, 6.3); cg.fill();
    cg.strokeStyle = '#433b2e'; cg.lineWidth = 6; cg.stroke();
    cg.strokeStyle = '#3c3427'; cg.lineWidth = 5; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128, 45); cg.stroke();
    cg.lineWidth = 3; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(184, 154); cg.stroke();
    cg.fillStyle = '#3c3427'; cg.font = '22px Georgia,serif'; cg.textAlign = 'center';
    cg.fillText('XII', 128, 32); cg.fillText('VI', 128, 238);
    var clock = new T.Mesh(new T.CircleGeometry(.21, 24), QP.basic(0xffffff, { map: QP.texture(clockC) }));
    clock.position.set(0, 3.08, .078); g.add(clock);
    var clockRing = new T.Mesh(new T.TorusGeometry(.22, .023, 5, 20), M.brassDark);
    clockRing.position.set(0, 3.08, .087); g.add(clockRing);
    glow(g, 0xffc67b, .85, .18, .69, 3.70, .05);
    var stationGlobe = QP.sphere(.11, 10, 8, QP.basic(0xffd99c), false); QP.put(g, stationGlobe, 0, 3.98, .02);
    glow(g, 0xffb76c, .8, .33, 0, 3.96, .02);
    shadowBlob(world, .8, .8, x, .148, z, .25);
    return g;
  }

  /* ---------------- delivery clutter & plants ---------------- */
  function makePlanter(world, x, z, s, leafSeed) {
    var g = QP.group(world, x, .15, z);
    g.scale.setScalar(s || 1);
    var pot = QP.cyl(.18, .13, .30, 12, QP.std(0x6e4430, { roughness: .48 }), true, .0016);
    QP.put(g, pot, 0, .15, 0);
    var rim = new T.Mesh(new T.TorusGeometry(.18, .015, 4, 12), M.brassDark); rim.rotation.x = Math.PI / 2; rim.position.y = .30; g.add(rim);
    var r = QP.rng(leafSeed || 77);
    for (var i = 0; i < 14; i++) {
      var a = r() * 6.28, len = .25 + r() * .45;
      var leaf = QP.sphere(.09, 6, 4, i % 3 ? QP.toon(0x254434) : QP.toon(0x3b5942), false);
      leaf.scale.set(.34, 1.5, .10);
      leaf.position.set(Math.cos(a) * .12, .4 + len * .38, Math.sin(a) * .12);
      leaf.rotation.set(.4 + r() * .35, a, -.35 + r() * .6); g.add(leaf);
      if (i % 4 === 0) {
        var fl = QP.sphere(.035, 6, 5, i % 8 ? QP.toon(0xf1e5c7) : QP.toon(0xc95f6e), false);
        fl.scale.set(1.3, .55, 1.3);
        fl.position.set(Math.cos(a) * .15, .58 + (i % 3) * .08, Math.sin(a) * .12); g.add(fl);
      }
    }
    shadowBlob(world, .5, .5, x, .148, z, .25);
    return g;
  }

  function shopBoard(world, x, z, ry) {
    var g = QP.group(world, x, .15, z); g.rotation.y = ry || 0;
    var c = QP.canvas(384, 512), g2 = c.getContext('2d');
    g2.fillStyle = '#1b1714'; g2.fillRect(0, 0, 384, 512);
    g2.strokeStyle = 'rgba(207,176,110,.8)'; g2.lineWidth = 3; g2.strokeRect(12, 12, 360, 488);
    g2.fillStyle = '#e2c27f'; g2.textAlign = 'center'; g2.font = '600 48px "PMingLiU",serif';
    g2.fillText('秋 裳', 192, 150); g2.fillText('新 裁', 192, 214);
    g2.font = '19px "PMingLiU",serif'; g2.fillStyle = 'rgba(220,196,144,.62)';
    g2.fillText('滬 上 名 裁 · 量 身 定 制', 192, 278);
    g2.strokeStyle = 'rgba(207,176,110,.35)'; g2.lineWidth = 1;
    g2.beginPath(); g2.moveTo(76, 305); g2.lineTo(308, 305); g2.stroke();
    g2.fillStyle = 'rgba(211,185,127,.5)'; g2.font = '15px "PMingLiU",serif';
    g2.fillText('今 日 營 業 · 上 午 十 時', 192, 344);
    var boardTex = QP.texture(c);
    for (var s = -1; s <= 1; s += 2) {
      var panel = new T.Mesh(new T.PlaneGeometry(.54, .75), QP.basic(0xffffff, { map: boardTex, side: T.DoubleSide }));
      panel.position.set(0, .52, s * .12); panel.rotation.x = s * .18; panel.rotation.y = s > 0 ? 0 : Math.PI; g.add(panel);
    }
    add(g, .06, .90, .06, M.wood, -.30, .48, 0, { rz: .18 });
    add(g, .06, .90, .06, M.wood, .30, .48, 0, { rz: -.18 });
    add(g, .62, .035, .035, M.brassDark, 0, .92, 0, {});
    return g;
  }

  function makePolesAndWires(world) {
    var pA = utilityPole(world, -7.75, 5.15, 8.35, .15);
    var pB = utilityPole(world, 7.55, -3.7, 8.65, -.2);
    var aTop = new T.Vector3(-7.75, 7.85, 5.15);
    var bTop = new T.Vector3(7.55, 7.25, -3.7);
    /* multiple sagging telephone / power lines */
    QP.wire(aTop, bTop, 1.1, .016, 0x1b1e20, world);
    QP.wire(new T.Vector3(-7.75, 7.35, 5.15), new T.Vector3(7.55, 6.75, -3.7), 1.4, .013, 0x1b1e20, world);
    QP.wire(new T.Vector3(-7.75, 7.15, 5.15), new T.Vector3(7.55, 6.55, -3.7), 1.6, .010, 0x232729, world);
    QP.wire(new T.Vector3(-7.75, 6.55, 5.15), new T.Vector3(-2.15, 8.75, 1.1), .8, .012, 0x1b1e20, world);
    QP.wire(new T.Vector3(7.55, 6.25, -3.7), new T.Vector3(1.35, 7.15, .68), .5, .012, 0x1b1e20, world);
    QP.wire(new T.Vector3(7.55, 7.7, -3.7), new T.Vector3(1.35, 8.2, .68), .4, .010, 0x1b1e20, world);
    /* tram contact line with messenger and droppers */
    var contactY = 5.82;
    var cat = QP.wire(new T.Vector3(-8.25, contactY, 3.15), new T.Vector3(8.25, contactY, 3.15), .03, .012, 0x24292a, world);
    var messenger = QP.wire(new T.Vector3(-8.25, 6.52, 3.15), new T.Vector3(8.25, 6.52, 3.15), .48, .013, 0x24292a, world);
    for (var dx = -6.5; dx <= 6.5; dx += 1.3) {
      var my = 6.52 - .48 * (1 - Math.pow(dx / 8.25, 2));
      QP.wire(new T.Vector3(dx, my - .03, 3.15), new T.Vector3(dx, contactY + .02, 3.15), 0.0, .005, 0x303536, world);
    }
    /* cross-spans from poles to the building & contact line */
    QP.wire(new T.Vector3(-7.75, 6.95, 5.15), new T.Vector3(0.8, 6.2, 3.15), .22, .012, 0x25292a, world);
    QP.wire(new T.Vector3(7.55, 6.95, -3.7), new T.Vector3(1.2, 6.3, 3.15), .16, .012, 0x25292a, world);
    QP.wire(new T.Vector3(7.55, 7.45, -3.7), new T.Vector3(5.6, 6.5, 3.15), .06, .009, 0x25292a, world);
    /* little insulators dangling at ends */
    for (var di = 0; di < 3; di++) {
      var drop = QP.cyl(.03, .045, .18, 6, QP.toon(0x6f8b80), true, .001);
      QP.put(world, drop, -5.2 + di * 4.8, 6.25 - (di === 1 ? .12 : 0), 3.15);
    }
    anim.poles = [pA.group, pB.group];
    anim.contactWire = cat;
  }

  /* =========================================================
     build the street
     ========================================================= */
  QP.buildStreet = function (world) {
    initMats();
    var g = QP.group(world, 0, 0, 0);
    g.name = 'street-life';
    QP.street = g;

    /* extend the boarding platform east of the corner sidewalk */
    var pave = QP.Tex.pavement();
    var paveMat = QP.std(0xc1c4bf, { map: QP.cloneTex(pave.map, 1.7, .7), roughness: .48, metalness: .04, envMapIntensity: .35 });
    var platform = QP.group(g, 4.37, 0, 1.38);
    add(platform, 2.35, .15, 1.0, QP.toon(0x4d4a42), 0, .075, 0, { outline: true, thick: .0018 });
    var top = new T.Mesh(new T.PlaneGeometry(2.32, .96), paveMat); top.rotation.x = -Math.PI / 2; top.position.y = .151; platform.add(top);
    add(platform, 2.35, .10, .12, M.stone, 0, .06, .50, {});
    add(platform, .12, .10, 1.0, M.stone, -1.17, .06, 0, {});
    add(platform, .12, .10, 1.0, M.stone, 1.17, .06, 0, {});
    /* brass route inlay */
    add(platform, 2.3, .008, .025, M.brassDark, 0, .154, -.43, {});
    for (var st = 0; st < 6; st++) add(platform, .40, .012, .04, M.brassDark, -.9 + st * .36, .153, .38, {});
    /* bench & station sign post */
    stationBench(world, 3.88, 1.27, Math.PI);
    tramStop(world, 5.12, 1.05);
    /* little leather case waiting */
    var caseG = QP.group(world, 4.50, .15, 1.73);
    add(caseG, .38, .24, .22, QP.std(0x3b2519, { roughness: .5 }), 0, .12, 0, { outline: true, thick: .0015 });
    add(caseG, .40, .035, .24, M.brassDark, 0, .26, 0, {});
    var handle = new T.Mesh(new T.TorusGeometry(.07, .013, 4, 10, Math.PI), M.brassDark);
    handle.position.set(0, .28, 0); caseG.add(handle);
    var tag = add(caseG, .08, .11, .015, QP.toon(0xe5d6b7), .16, .13, .13, {});

    /* street furniture on the corner sidewalk */
    streetLamp(world, -7.25, 1.23, -.15);
    rickshaw(world, -6.55, 1.12, 0.10);
    postbox(world, -.18, 1.45);
    posterColumn(world, 3.03, 1.60);
    makePlanter(world, 1.56, 1.27, .80, 301);
    makePlanter(world, 2.22, -.02, .70, 307);
    makePlanter(world, -4.99, 1.02, .75, 311);
    shopBoard(world, -2.92, 1.06, -.22);
    /* a tiny stack of hat boxes by the record door */
    for (var hb = 0; hb < 3; hb++) {
      var hx = 1.72 + (hb % 2) * .07, hy = .21 + hb * .15;
      add(world, .32, .14, .25, QP.toon(hb % 2 ? 0x6b272d : 0x8d6e46), hx, hy, .96, { outline: true, thick: .0012 });
      var tie = new T.Mesh(new T.TorusGeometry(.11, .008, 3, 10, Math.PI), M.brassDark);
      tie.position.set(hx, hy + .075, .96); tie.rotation.x = Math.PI / 2; world.add(tie);
    }
    /* tram at the stop */
    makeTram(world, 5.18, 3.15);
    /* tall poles + wire web */
    makePolesAndWires(world);

    /* small wall-mounted street name below neon */
    var nameC = QP.canvas(512, 128), nc = nameC.getContext('2d');
    nc.fillStyle = '#1c423f'; nc.fillRect(0, 0, 512, 128);
    nc.strokeStyle = 'rgba(221,208,173,.8)'; nc.lineWidth = 4; nc.strokeRect(6, 6, 500, 116);
    nc.fillStyle = '#e9dec3'; nc.font = '44px "PMingLiU",serif'; nc.textAlign = 'center'; nc.textBaseline = 'middle';
    nc.fillText('霞 飛 路 · 邁 爾 西 愛 路', 256, 55);
    nc.font = '18px Georgia,serif'; nc.fillStyle = 'rgba(221,207,170,.7)';
    nc.fillText('AVENUE JOFFRE  ·  RUE MARCEL', 256, 91);
    var nSign = new T.Mesh(new T.PlaneGeometry(1.2, .30), QP.basic(0xffffff, { map: QP.texture(nameC) }));
    nSign.position.set(1.35, 3.95, .86); nSign.rotation.y = .50; g.add(nSign);

    /* tram stop puddle and extra little leaves */
    /* (wet reflections are added by effects) */
    var leafMat = QP.toon(0x8e5a2c, { side: T.DoubleSide });
    var lg = new T.PlaneGeometry(.11, .22);
    for (var lf = 0; lf < 16; lf++) {
      var leaf = new T.Mesh(lg, leafMat);
      leaf.rotation.x = -Math.PI / 2 + Math.random() * .2;
      leaf.rotation.z = Math.random() * 6.28;
      leaf.position.set(-7.5 + Math.random() * 14.8, .018, 2.0 + Math.random() * 5.8);
      g.add(leaf);
    }

    /* performance stats & animation references */
    anim.streetLamp = anim.lamp;
    anim.tramPos = new T.Vector3(4.75, 0, 3.15);
    return g;
  };
})();
