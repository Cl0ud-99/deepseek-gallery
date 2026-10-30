/* =========================================================
   02 · 世界：夜空 / 星 / 月 / 拼花底座 / 木栈道
   ========================================================= */
(function () {
  'use strict';
  const APP = window.APP;
  const { scene, mesh, G, M, C, toon, metal, gloss, srgb, outline, outlineAll } = APP;

  /* ---------------- 夜空穹顶 ---------------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      cTop: { value: srgb(0x03020a) },
      cMid: { value: srgb(0x0e0a26) },
      cHor: { value: srgb(0x251145) },
      cWarm: { value: srgb(0x4a1b3e) }
    },
    vertexShader: `
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform vec3 cTop, cMid, cHor, cWarm;
      varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float h = d.y;
        vec3 c = mix(cHor, cMid, smoothstep(-0.05, 0.42, h));
        c = mix(c, cTop, smoothstep(0.35, 0.95, h));
        float glow = pow(max(0.0, 1.0 - abs(h) * 2.6), 2.4);
        c += cWarm * glow * 0.7;
        // 极轻的色带，制造插画感
        float band = sin(h * 26.0) * 0.5 + 0.5;
        c += vec3(0.012, 0.008, 0.03) * band;
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 32), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  /* ---------------- 星星 ---------------- */
  (function stars() {
    const N = 1700;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c1 = srgb(0xfff6e0);
    const c2 = srgb(0xa9c6ff);
    const c3 = srgb(0xffc0e0);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.pow(Math.random(), 0.62);
      const y = v * 0.98 + 0.02;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const R = 250;
      pos[i * 3] = Math.cos(u) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(u) * r * R;
      const t = Math.random();
      const c = t < 0.55 ? c1 : t < 0.85 ? c2 : c3;
      const k = 0.55 + Math.random() * 0.45;
      col[i * 3] = c.r * k;
      col[i * 3 + 1] = c.g * k;
      col[i * 3 + 2] = c.b * k;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    APP.starField = pts;
    APP.onFrame((t) => {
      mat.opacity = 0.78 + Math.sin(t * 1.7) * 0.08;
    });
  })();

  /* ---------------- 月亮 ---------------- */
  (function moon() {
    const dir = new THREE.Vector3(-0.42, 0.5, -0.76).normalize();
    const pos = dir.clone().multiplyScalar(238);
    const g = new THREE.Group();
    g.position.copy(pos);
    g.lookAt(0, 0, 0);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(11, 48),
      new THREE.MeshBasicMaterial({ color: srgb(0xfff2cf), transparent: true, opacity: 0.95 })
    );
    g.add(disc);
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshBasicMaterial({
        map: APP.glowTexture('rgba(255,240,205,0.85)', 'rgba(180,170,255,0.25)'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.position.z = -1;
    g.add(halo);
    scene.add(g);
  })();

  /* ---------------- 底座 ---------------- */
  const baseGroup = new THREE.Group();
  scene.add(baseGroup);

  const BW = 24; // 底座边长
  const tileZ0 = -11.85,
    tileZ1 = 8.55; // 拼花区
  const BWALK_Z = 11.85; // 栈道外缘

  // 木纹
  const woodTex = APP.plankTexture();
  woodTex.repeat.set(3, 1);
  const slabMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: srgb(0x9a6a44),
    roughness: 0.82,
    metalness: 0.05
  });

  const slab = mesh(G.box(BW, 1.2, BW), slabMat, 0, -0.6, 0);
  baseGroup.add(slab);

  // 金色腰带 + 底部基座
  baseGroup.add(mesh(G.box(BW + 0.34, 0.16, BW + 0.34), M.gold, 0, -1.2, 0));
  baseGroup.add(
    mesh(
      G.box(BW + 0.1, 0.28, BW + 0.1),
      new THREE.MeshStandardMaterial({ color: srgb(0x2a1c30), roughness: 0.7, metalness: 0.3 }),
      0,
      -1.42,
      0
    )
  );
  baseGroup.add(mesh(G.box(BW - 0.5, 0.14, BW - 0.5), M.goldDk, 0, -1.62, 0));

  /* --- 拼花地砖 --- */
  const tileTex = APP.tileTexture();
  const tileW = BW - 0.24;
  const tileD = tileZ1 - tileZ0;
  tileTex.repeat.set(tileW / 3.5, tileD / 3.5);
  const tileMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    roughness: 0.38,
    metalness: 0.16,
    envMapIntensity: 0.7
  });
  const floor = mesh(G.pla(tileW, tileD), tileMat, 0, 0.012, (tileZ0 + tileZ1) / 2, false);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  baseGroup.add(floor);

  /* --- 木栈道 --- */
  const bwalkTex = APP.plankTexture();
  bwalkTex.repeat.set(9, 1.1);
  const bwalkMat = new THREE.MeshStandardMaterial({
    map: bwalkTex,
    color: srgb(0xb08058),
    roughness: 0.7,
    metalness: 0.06
  });
  const bwalkD = BWALK_Z - tileZ1;
  const bwalk = mesh(G.pla(tileW, bwalkD), bwalkMat, 0, 0.014, (tileZ1 + BWALK_Z) / 2, false);
  bwalk.rotation.x = -Math.PI / 2;
  bwalk.receiveShadow = true;
  baseGroup.add(bwalk);

  // 栈道与地砖之间的木压条
  baseGroup.add(mesh(G.box(tileW, 0.13, 0.22), M.woodDk, 0, 0.06, tileZ1));
  // 栈道外缘挡板
  baseGroup.add(mesh(G.box(tileW + 0.2, 0.26, 0.26), M.woodDk, 0, 0.1, BWALK_Z - 0.05));

  /* --- 金色包边（四条） --- */
  const trimMat = M.gold;
  baseGroup.add(mesh(G.box(tileW + 0.3, 0.1, 0.16), trimMat, 0, 0.03, tileZ0 + 0.05));
  baseGroup.add(mesh(G.box(0.16, 0.1, BW - 0.2), trimMat, -BW / 2 + 0.09, 0.03, 0));
  baseGroup.add(mesh(G.box(0.16, 0.1, BW - 0.2), trimMat, BW / 2 - 0.09, 0.03, 0));
  baseGroup.add(mesh(G.box(tileW + 0.3, 0.1, 0.16), trimMat, 0, 0.03, BWALK_Z - 0.1));

  /* --- 侧面壁柱与腰线 --- */
  for (let sd = 0; sd < 4; sd++) {
    const side = new THREE.Group();
    side.rotation.y = (sd * Math.PI) / 2;
    for (let i = -2; i <= 2; i++) {
      side.add(mesh(G.box(0.2, 0.82, 0.1), M.goldDk, i * 4.5, -0.62, BW / 2 + 0.02, false));
      side.add(mesh(G.sph(0.12, 8), M.gold, i * 4.5, -0.16, BW / 2 + 0.04, false));
    }
    side.add(mesh(G.box(BW, 0.07, 0.12), M.gold, 0, -0.34, BW / 2 + 0.03, false));
    baseGroup.add(side);
  }

  /* --- 地砖描边 --- */
  const borderMat = new THREE.MeshStandardMaterial({
    color: srgb(0x14224a),
    roughness: 0.45,
    metalness: 0.25
  });
  baseGroup.add(mesh(G.box(tileW, 0.02, 0.34), borderMat, 0, 0.016, tileZ0 + 0.2, false));
  baseGroup.add(mesh(G.box(tileW, 0.02, 0.34), borderMat, 0, 0.016, tileZ1 - 0.2, false));
  baseGroup.add(mesh(G.box(0.34, 0.02, tileD), borderMat, -tileW / 2 + 0.2, 0.016, (tileZ0 + tileZ1) / 2, false));
  baseGroup.add(mesh(G.box(0.34, 0.02, tileD), borderMat, tileW / 2 - 0.2, 0.016, (tileZ0 + tileZ1) / 2, false));

  /* --- 四角铜饰 --- */
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const g = new THREE.Group();
    g.position.set(sx * (BW / 2 - 0.16), 0.06, sz * (BW / 2 - 0.16));
    g.add(mesh(G.cyl(0.2, 0.24, 0.12, 12), M.gold, 0, 0, 0));
    const knob = mesh(G.sph(0.13, 12), M.goldLt, 0, 0.11, 0);
    g.add(knob);
    baseGroup.add(g);
  });

  /* --- 栈道栏杆柱 + 缆绳 --- */
  const bollards = [];
  for (let i = 0; i < 2; i++) {
    const x = i === 0 ? -11.1 : 11.1;
    const g = new THREE.Group();
    g.position.set(x, 0, BWALK_Z - 0.55);
    const post = mesh(G.cyl(0.17, 0.21, 0.95, 12), M.woodDk, 0, 0.47, 0);
    g.add(post);
    g.add(mesh(G.cyl(0.23, 0.23, 0.1, 12), M.gold, 0, 0.97, 0));
    baseGroup.add(g);
    bollards.push(g);
  }
  // 缆绳
  (function rope() {
    const a = new THREE.Vector3(-11.1, 0.9, BWALK_Z - 0.55);
    const b = new THREE.Vector3(11.1, 0.9, BWALK_Z - 0.55);
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= 0.42;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 40, 0.045, 6, false);
    baseGroup.add(mesh(geo, M.cream, 0, 0, 0, false));
  })();

  APP.base = { group: baseGroup, size: BW, tileZ0, tileZ1, bwalkZ: BWALK_Z };
})();
