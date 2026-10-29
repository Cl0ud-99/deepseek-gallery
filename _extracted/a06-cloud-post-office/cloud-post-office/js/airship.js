/* =========================================================
   airship.js — 飞艇船体 / 气囊 / 螺旋桨 / 风帆翼 / 索具
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;
  const A = (APP.Airship = {});

  const DECK = APP.C.hullDeckY;
  const L = 17.6, W = 6.6, H = 2.3;

  A.ENV = { cx: 0, cy: 22.5, rx: 9.3, ry: 3.5, rz: 3.5 };

  /* 气囊表面取点 */
  function envPoint(s, a, out) {
    const e = A.ENV;
    const k = Math.sqrt(Math.max(0, 1 - s * s));
    return out.set(s * e.rx, e.cy + k * Math.sin(a) * e.ry, k * Math.cos(a) * e.rz);
  }

  /* ---------------- 船体 ---------------- */
  function hullGeometry() {
    const nx = 34, nt = 26;
    const pos = [], uv = [], idx = [];
    const stat = [];
    for (let i = 0; i <= nx; i++) {
      const t = i / nx, x = -L / 2 + t * L, s = x / (L / 2);
      const wf = Math.pow(Math.max(0, 1 - s * s), 0.40);
      const df = Math.pow(Math.max(0, 1 - s * s), 0.26);
      stat.push({ x: x, w: (W / 2) * Math.max(wf, 0.02), h: H * Math.max(df, 0.03) });
    }
    for (let i = 0; i <= nx; i++) {
      const st = stat[i];
      for (let j = 0; j <= nt; j++) {
        const th = -Math.PI / 2 + (j / nt) * Math.PI;
        const cz = Math.sin(th), cy = -Math.cos(th);
        const z = st.w * Math.sign(cz) * Math.pow(Math.abs(cz), 0.82);
        const y = -st.h * Math.pow(Math.abs(cy), 0.92);
        pos.push(st.x, y, z);
        uv.push(i / nx, j / nt);
      }
    }
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nt; j++) {
        const a0 = i * (nt + 1) + j, b0 = (i + 1) * (nt + 1) + j;
        idx.push(a0, b0, a0 + 1);
        idx.push(b0, b0 + 1, a0 + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    A.stat = stat;
    return g;
  }

  function buildHull() {
    const g = new THREE.Group();
    const woodTex = U.tex(U.plankTex('#8e3b25', '#3d1409', 12), 7, 1.4);
    const hullMat = U.toon(0xffffff, { map: woodTex });
    const deckTex = U.tex(U.plankTex('#a04a2e', '#41160a', 10), 9, 3);
    const deckMat = U.toon(0xffffff, { map: deckTex });
    const beam = U.toon(0x5d2417);
    const brass = U.std(0xc9a227, { metalness: 1, roughness: 0.3, env: 1.3 });
    const brassD = U.std(0x8f6b1f, { metalness: 1, roughness: 0.42 });
    const dark = U.toon(0x33231a);

    // 船壳
    const hull = new THREE.Mesh(hullGeometry(), hullMat);
    hull.castShadow = true; hull.receiveShadow = true;
    g.add(hull);
    A.hull = hull;

    // 甲板
    const nx = 30, nz = 16;
    const dpos = [], duv = [], didx = [];
    for (let i = 0; i <= nx; i++) {
      const t = i / nx, x = -L / 2 + t * L, s = x / (L / 2);
      const wf = Math.pow(Math.max(0, 1 - s * s), 0.40);
      const w = (W / 2) * Math.max(wf, 0.02) * 0.985;
      for (let j = 0; j <= nz; j++) {
        const u = j / nz;
        const z = -w + 2 * w * u;
        const camber = 0.07 * (1 - Math.pow((z / Math.max(w, 0.01)), 2));
        dpos.push(x, camber, z);
        duv.push(t * 3, u * 3);
      }
    }
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a0 = i * (nz + 1) + j, b0 = (i + 1) * (nz + 1) + j;
        didx.push(a0, b0, a0 + 1);
        didx.push(b0, b0 + 1, a0 + 1);
      }
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3));
    dg.setAttribute('uv', new THREE.Float32BufferAttribute(duv, 2));
    dg.setIndex(didx);
    dg.computeVertexNormals();
    const deck = new THREE.Mesh(dg, deckMat);
    deck.receiveShadow = true;
    g.add(deck);

    // 舷墙 + 铜压条
    for (const side of [-1, 1]) {
      const bw = [];
      const capPts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, x = -L / 2 + t * L, s = x / (L / 2);
        const wf = Math.pow(Math.max(0, 1 - s * s), 0.40);
        const w = (W / 2) * Math.max(wf, 0.02) * side;
        bw.push(x, 0, w, x, 0.62, w * 0.955);
        if (i % 2 === 0) capPts.push(new THREE.Vector3(x, 0.62, w * 0.955));
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bw, 3));
      const bidx = [];
      for (let i = 0; i < 40; i++) {
        const a0 = i * 2;
        bidx.push(a0, a0 + 2, a0 + 1);
        bidx.push(a0 + 2, a0 + 3, a0 + 1);
      }
      bg.setIndex(bidx);
      bg.computeVertexNormals();
      const bm = new THREE.Mesh(bg, beam);
      bm.material.side = THREE.DoubleSide;
      bm.castShadow = true;
      g.add(bm);
      // 铜扶手
      const curve = new THREE.CatmullRomCurve3(capPts);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.055, 6, false), brass);
      rail.castShadow = true;
      g.add(rail);
    }

    // 铜箍（船壳环）
    for (const sx of [-0.62, -0.18, 0.26, 0.62]) {
      const x = sx * (L / 2);
      const s = sx;
      const wf = Math.pow(Math.max(0, 1 - s * s), 0.40);
      const w = (W / 2) * wf;
      const pts = [];
      for (let j = 0; j <= 20; j++) {
        const th = -Math.PI / 2 + (j / 20) * Math.PI;
        const cz = Math.sin(th), cy = -Math.cos(th);
        pts.push(new THREE.Vector3(
          x,
          -H * Math.pow(Math.max(0, 1 - s * s), 0.26) * Math.pow(Math.abs(cy), 0.92) * 1.01,
          w * Math.sign(cz) * Math.pow(Math.abs(cz), 0.82) * 1.01
        ));
      }
      const c = new THREE.CatmullRomCurve3(pts);
      const band = new THREE.Mesh(new THREE.TubeGeometry(c, 26, 0.075, 6, false), brassD);
      band.castShadow = true;
      g.add(band);
    }

    // 舷窗
    const glassGlow = new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffa94d, emissiveIntensity: 2.4, roughness: 0.3
    });
    for (let i = 0; i < 12; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = -6.2 + (i / 11) * 11.6;
      const s = x / (L / 2);
      const wf = Math.pow(Math.max(0, 1 - s * s), 0.40);
      const w = (W / 2) * wf;
      const y = -0.62;
      const zz = Math.sqrt(Math.max(0, 1 - Math.pow(y / (H * Math.pow(Math.max(0, 1 - s * s), 0.26)), 2))) * w * 0.97;
      const pz = side * zz;
      const ring = U.tor(0.15, 0.035, brass, x, y, pz);
      ring.rotation.y = side > 0 ? 0 : Math.PI;
      g.add(ring);
      const disc = U.mesh(new THREE.CircleGeometry(0.14, 12), glassGlow, x, y, pz + side * 0.01);
      disc.rotation.y = side > 0 ? 0 : Math.PI;
      g.add(disc);
    }

    // 船首斜桅
    const sprit = U.cyl(0.09, 0.14, 3.4, 8, beam, L / 2 + 1.2, 0.75, 0);
    sprit.rotation.z = -1.28;
    sprit.castShadow = true;
    g.add(sprit);
    const spritTip = U.sph(0.13, brass, L / 2 + 2.6, 1.35, 0);
    g.add(spritTip);

    // 桅杆（前后各一）
    [[-5.4, 3.9], [5.2, 3.3]].forEach((m) => {
      const mast = U.cyl(0.1, 0.15, m[1], 8, beam, m[0], m[1] / 2, 0);
      mast.castShadow = true;
      g.add(mast);
      const ring = U.tor(0.13, 0.03, brass, m[0], m[1] * 0.7, 0);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      const top = U.sph(0.14, brass, m[0], m[1], 0);
      g.add(top);
    });

    // 尾部栏杆（弧形）
    const railArc = [];
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      const x = -L / 2 + 0.4;
      railArc.push(new THREE.Vector3(x, 0.62, Math.sin(a) * 1.4));
    }

    return g;
  }

  /* ---------------- 气囊 ---------------- */
  function buildEnvelope() {
    const g = new THREE.Group();
    const e = A.ENV;
    const clothTex = U.tex(U.clothTex('#f4efe2'), 3, 2);

    // 主体（略微拉尖）
    const geo = new THREE.SphereGeometry(1, 60, 40);
    U.deform(geo, (v) => {
      const nx = v.x;
      const taper = 1 - 0.16 * Math.pow(Math.abs(nx), 3.2);
      v.y *= taper * (1 - 0.05 * Math.max(0, -v.y));
      v.z *= taper;
    });
    // 顶部亮、底部沉，给气囊体积感
    {
      const p = geo.attributes.position, cols = [];
      const cT = new THREE.Color(0xfffdf6), cB = new THREE.Color(0xc0b9a8), tc = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const ny = p.getY(i);
        tc.copy(cB).lerp(cT, U.smooth(U.clamp((ny + 0.75) / 1.45, 0, 1)));
        cols.push(tc.r, tc.g, tc.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    }
    const canvasMat = U.toon(0xffffff, { map: clothTex, vertexColors: true });
    const body = new THREE.Mesh(geo, canvasMat);
    body.scale.set(e.rx, e.ry, e.rz);
    body.position.set(e.cx, e.cy, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    A.envMesh = body;


    // 补丁
    const patchCols = [0xe6dcc4, 0xd9cdb0, 0xefe6d2, 0xcbbfa2];
    const patches = [[0.34, 1.15], [-0.2, 2.5], [0.62, 4.0], [-0.55, 5.2], [0.05, 0.4], [0.72, 2.0]];
    patches.forEach((p, i) => {
      const pos = envPoint(p[0], p[1], new THREE.Vector3());
      const nrm = new THREE.Vector3(
        (pos.x - e.cx) / (e.rx * e.rx),
        (pos.y - e.cy) / (e.ry * e.ry),
        pos.z / (e.rz * e.rz)
      ).normalize();
      const pw = U.rr(1.6, 3.0), ph = U.rr(1.1, 2.1);
      const pl = new THREE.Mesh(
        new THREE.PlaneGeometry(pw, ph),
        U.toon(patchCols[i % patchCols.length], { side: THREE.DoubleSide })
      );
      pl.position.copy(pos).addScaledVector(nrm, 0.02);
      pl.lookAt(pos.clone().add(nrm));
      pl.rotateZ(U.rr(-0.4, 0.4));
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(pl.geometry),
        new THREE.LineBasicMaterial({ color: 0x8a7a5c, transparent: true, opacity: 0.5 })
      );
      pl.add(edge);
      g.add(pl);
    });

    // 绳网
    const netMat = U.toon(0xa8875a);
    const netG = new THREE.Group();
    const out = (p, k) => {
      p.set(e.cx + (p.x - e.cx) * k, e.cy + (p.y - e.cy) * k, p.z * k);
      return p;
    };
    for (let li = 0; li < 9; li++) {
      const a = (li / 9) * Math.PI * 2;
      const pts = [];
      for (let si = 0; si <= 26; si++) {
        const s = -0.955 + (si / 26) * 1.91;
        pts.push(out(envPoint(s, a, new THREE.Vector3()), 1.012));
      }
      netG.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.015, 4, false), netMat));
    }
    for (const s of [-0.8, -0.55, -0.25, 0.06, 0.36, 0.64, 0.85]) {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        pts.push(out(envPoint(s, (i / 40) * Math.PI * 2, new THREE.Vector3()), 1.012));
      }
      netG.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 56, 0.013, 4, false), netMat));
    }
    g.add(netG);

    // 鼻锥
    const nose = U.sph(0.55, U.std(0xb08a2c, { metalness: 1, roughness: 0.35 }), e.cx + e.rx * 0.99, e.cy, 0, 0.5, 1.0, 1.0);
    g.add(nose);

    // 尾翼
    const finMat = U.toon(0xf0e8d6, { side: THREE.DoubleSide });
    const finEdge = U.std(0xb08a2c, { metalness: 1, roughness: 0.4 });
    const mkFin = (rotY, len, hgt) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.quadraticCurveTo(len * 0.4, hgt * 0.55, len, hgt * 0.28);
      sh.lineTo(len * 0.92, 0);
      sh.lineTo(0, 0);
      const geoF = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false });
      const m = new THREE.Mesh(geoF, finMat);
      m.rotation.y = rotY;
      return m;
    };
    const tailX = e.cx - e.rx * 0.9;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      const holder = new THREE.Group();
      holder.position.set(tailX, e.cy, 0);
      holder.rotation.x = a;
      const fin = mkFin(0, 2.6, 1.7);
      holder.add(fin);
      const edgeMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.09), finEdge);
      edgeMesh.position.set(1.25, 0.72, 0.03);
      edgeMesh.rotation.z = 0.16;
      holder.add(edgeMesh);
      g.add(holder);
    }

    return g;
  }

  /* ---------------- 螺旋桨 ---------------- */
  function buildPropeller(radius, blades, mat) {
    const g = new THREE.Group();
    const hub = U.cyl(radius * 0.15, radius * 0.18, radius * 0.34, 12, mat, 0, 0, 0);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const spinner = U.mesh(new THREE.SphereGeometry(radius * 0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, 0, radius * 0.16);
    spinner.rotation.x = Math.PI / 2;
    g.add(spinner);
    const sh = new THREE.Shape();
    const bl = radius * 0.92, bw = radius * 0.19;
    sh.moveTo(0, radius * 0.12);
    sh.bezierCurveTo(bw, bl * 0.3, bw * 0.9, bl * 0.8, 0, bl);
    sh.bezierCurveTo(-bw * 0.9, bl * 0.8, -bw, bl * 0.3, 0, radius * 0.12);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 });
    bg.center();
    const bladeMat = U.std(0xc9a227, { metalness: 1, roughness: 0.28, env: 1.4 });
    for (let i = 0; i < blades; i++) {
      const holder = new THREE.Group();
      holder.rotation.z = (i / blades) * Math.PI * 2;
      const b = new THREE.Mesh(bg, bladeMat);
      b.position.y = radius * 0.55;
      b.rotation.y = 0.5;
      b.castShadow = true;
      holder.add(b);
      g.add(holder);
    }
    const ring = U.tor(radius * 0.14, radius * 0.03, mat, 0, 0, 0);
    g.add(ring);
    return g;
  }
  A.buildPropeller = buildPropeller;

  /* ---------------- 风帆翼 ---------------- */
  function buildWing(span, chord, mat, sparMat, side) {
    const g = new THREE.Group();
    const nx = 12, nz = 12;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      for (let j = 0; j <= nz; j++) {
        const w = j / nz;
        const sweep = -w * chord * 0.30;
        const x = (u - 0.5) * chord + sweep;
        const z = w * span;
        const camber = Math.sin(u * Math.PI) * 0.46 * (0.45 + 0.55 * w);
        const dihedral = w * span * 0.42;
        pos.push(x, camber + dihedral, z * side);
        uv.push(u * 2, w * 2);
      }
    }
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a0 = i * (nz + 1) + j, b0 = (i + 1) * (nz + 1) + j;
        idx.push(a0, b0, a0 + 1);
        idx.push(b0, b0 + 1, a0 + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const cloth = new THREE.Mesh(geo, mat);
    cloth.castShadow = true;
    g.add(cloth);

    // 前缘撑杆
    const leadPts = [];
    for (let j = 0; j <= 8; j++) {
      const w = j / 8;
      leadPts.push(new THREE.Vector3(
        -chord * 0.5 - w * chord * 0.30,
        0.02 + w * span * 0.42,
        w * span * side
      ));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leadPts), 20, 0.055, 6, false), sparMat));
    // 根部横杆
    const rootPts = [
      new THREE.Vector3(-chord * 0.5, 0.02, 0),
      new THREE.Vector3(chord * 0.5, 0.02, 0)
    ];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rootPts), 8, 0.05, 6, false), sparMat));
    // 翼肋
    for (const u of [0.3, 0.62, 0.88]) {
      const ribPts = [];
      for (let j = 0; j <= 6; j++) {
        const w = j / 6;
        ribPts.push(new THREE.Vector3(
          (u - 0.5) * chord - w * chord * 0.30,
          Math.sin(u * Math.PI) * 0.46 * (0.45 + 0.55 * w) + w * span * 0.42,
          w * span * side
        ));
      }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribPts), 12, 0.028, 5, false), sparMat));
    }
    return g;
  }

  /* ---------------- 组装 ---------------- */
  A.build = function (scene) {
    const root = new THREE.Group();
    root.position.y = DECK;
    const hullG = buildHull();
    root.add(hullG);

    const brass = U.std(0xc9a227, { metalness: 1, roughness: 0.3, env: 1.3 });
    const brassD = U.std(0x8a6a22, { metalness: 1, roughness: 0.45 });
    const iron = U.std(0x3a3f49, { metalness: 0.9, roughness: 0.5 });

    /* --- 尾部双螺旋桨 --- */
    const props = [];
    for (const side of [-1, 1]) {
      const nac = new THREE.Group();
      nac.position.set(-L / 2 + 0.7, -0.55, side * 2.3);
      const arm = U.box(1.5, 0.16, 0.16, iron, 0.75, 0.2, -side * 0.3);
      arm.rotation.z = 0.12;
      nac.add(arm);
      const body = U.cyl(0.34, 0.42, 1.5, 12, brass, -0.55, 0, 0);
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      nac.add(body);
      const nose = U.mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass, -1.3, 0, 0);
      nose.rotation.z = -Math.PI / 2;
      nac.add(nose);
      const prop = buildPropeller(1.75, 4, brassD);
      prop.position.set(-1.42, 0, 0);
      prop.rotation.y = Math.PI / 2;
      nac.add(prop);
      props.push(prop);
      root.add(nac);
    }

    /* --- 两侧螺旋桨 --- */
    for (const side of [-1, 1]) {
      const nac = new THREE.Group();
      nac.position.set(3.4, -0.35, side * 3.25);
      const arm = U.box(0.9, 0.14, 0.14, iron, -0.2, 0, -side * 0.35);
      nac.add(arm);
      const body = U.cyl(0.26, 0.3, 0.9, 10, brass, 0.2, 0, -side * 0.55);
      body.rotation.x = Math.PI / 2;
      body.castShadow = true;
      nac.add(body);
      const prop = buildPropeller(1.15, 3, brassD);
      prop.position.set(0.2, 0, -side * 1.05);
      prop.rotation.x = Math.PI / 2;
      nac.add(prop);
      props.push(prop);
      root.add(nac);
    }
    A.props = props;

    /* --- 风帆翼 --- */
    const sailMat = U.toon(0xe9dec2, { map: U.tex(U.clothTex('#efe4c9'), 2, 2), side: THREE.DoubleSide });
    const sails = [];
    const sailDefs = [
      { x: -0.6, side: 1, span: 3.5, chord: 4.0 },
      { x: -4.9, side: 1, span: 2.9, chord: 3.2 },
      { x: -0.6, side: -1, span: 3.5, chord: 4.0 },
      { x: -4.9, side: -1, span: 2.9, chord: 3.2 }
    ];
    sailDefs.forEach((d) => {
      const g = buildWing(d.span, d.chord, sailMat, brassD, d.side);
      g.position.set(d.x, 1.05, d.side * 2.55);
      g.rotation.x = -d.side * 0.62;
      g.userData = { baseY: 0.55, ph: U.rr(0, 7) };
      root.add(g);
      sails.push({ g: g, base: 0, ph: U.rr(0, 7) });
    });
    A.sails = sails;

    /* --- 气囊 --- */
    const env = buildEnvelope();
    scene.add(env);
    A.env = env;

    /* --- 气囊与船体之间的吊索 / 支柱 --- */
    const rig = new THREE.Group();
    const ropeMat = U.toon(0xc0a074);
    const strutMat = brassD;
    const rigXs = [-7.6, -5.9, 4.9, 6.6, 7.8];
    rigXs.forEach((x, i) => {
      const s = x / A.ENV.rx;
      for (const side of [-1, 1]) {
        const p = envPoint(s, side > 0 ? 0.62 : -0.62, new THREE.Vector3());
        const a = new THREE.Vector3(p.x, p.y, p.z);
        const b = new THREE.Vector3(x * 0.98, DECK + 0.55, side * 2.95);
        const mid = a.clone().lerp(b, 0.5);
        rig.add(U.rope([a, mid, b], 0xc0a074, 1, 0.018));
        if (i % 2 === 0) {
          const st = U.cyl(0.05, 0.06, a.distanceTo(b), 6, strutMat, 0, 0, 0);
          st.position.copy(mid);
          st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
          rig.add(st);
        }
      }
    });
    // 中央主吊架
    const keel = U.box(9.5, 0.22, 0.5, brassD, 0, DECK + 3.35, 0);
    rig.add(keel);
    for (const x of [-3.4, 0, 3.4]) {
      const st = U.cyl(0.1, 0.12, 3.4, 8, brass, x, DECK + 1.7, 0);
      rig.add(st);
    }
    scene.add(rig);
    A.rig = rig;

    /* --- 跳板（向外悬空） --- */
    const gw = new THREE.Group();
    const plankMat = U.toon(0xffffff, { map: U.tex(U.plankTex('#a3522f', '#3d1409', 5), 2, 1) });
    const gwLen = 5.6;
    const gwW = 1.7;
    for (let i = 0; i < 9; i++) {
      const p = U.box(gwLen / 9 - 0.05, 0.09, gwW, plankMat, -gwLen / 2 + (i + 0.5) * (gwLen / 9), 0, 0);
      p.castShadow = true;
      gw.add(p);
    }
    for (const side of [-1, 1]) {
      const beamG = U.box(gwLen, 0.16, 0.16, brassD, 0, -0.11, side * gwW / 2);
      gw.add(beamG);
      const railPts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        railPts.push(new THREE.Vector3(-gwLen / 2 + t * gwLen, 0.85 - t * 0.1, side * gwW / 2));
      }
      gw.add(U.rope(railPts, 0x9d7b4f, 1, 0.03));
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const post = U.cyl(0.035, 0.04, 0.85, 6, brass, -gwLen / 2 + t * gwLen, 0.42, side * gwW / 2);
        gw.add(post);
      }
    }
    gw.position.set(L / 2 + 2.4, -0.35, 1.5);
    gw.rotation.z = 0.18;
    gw.rotation.y = -0.22;
    root.add(gw);

    /* --- 船首旗绳 + 小旗 --- */
    const pennants = [];
    const lineA = new THREE.Vector3(L / 2 + 2.4, 1.5, 0);
    const lineB = new THREE.Vector3(5.2, 3.3, 0);
    const pPts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pPts.push(new THREE.Vector3().lerpVectors(lineA, lineB, t).add(new THREE.Vector3(0, -Math.sin(t * Math.PI) * 0.35, 0)));
    }
    root.add(U.rope(pPts, 0x8a6a45, 1, 0.022));
    for (let i = 1; i < 7; i++) {
      const t = i / 8;
      const p = new THREE.Vector3().lerpVectors(lineA, lineB, t);
      p.y -= Math.sin(t * Math.PI) * 0.35;
      const sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.lineTo(0.62, -0.1); sh.lineTo(0, -0.3);
      const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), U.toon(i % 2 ? 0xc4552f : 0xe8c46a, { side: THREE.DoubleSide }));
      f.position.copy(p);
      f.userData = { ph: i * 0.8 };
      root.add(f);
      pennants.push(f);
    }
    A.pennants = pennants;

    scene.add(root);
    A.root = root;
    return root;
  };
})();
