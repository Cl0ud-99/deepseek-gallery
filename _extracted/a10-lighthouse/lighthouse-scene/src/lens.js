import * as THREE from 'three';
import { DIM } from './world.js';
import { makeGear, glowTexture, rainGlassTexture, floorDecalTexture, mulberry32 } from './lib.js';

function makeBeamCone(len, rad, seg = 28) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pos.push(0, 0, 0); uv.push(i / seg, 0);
    pos.push(Math.cos(a) * rad, Math.sin(a) * rad, len); uv.push(i / seg, 1);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 3, a, a + 3, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function beamMaterial(opacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(0xfff3d4) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float facing = max(dot(normalize(vN), normalize(vV)), 0.0);
        float along = clamp(vUv.y, 0.0, 1.0);
        float a = pow(facing, 0.85) * pow(1.0 - along, 1.35) * uOpacity;
        a *= 0.82 + 0.18 * sin(vUv.x * 31.0 + uTime * 1.3);
        a *= 0.9 + 0.1 * sin(uTime * 0.9);
        gl_FragColor = vec4(uColor * a * 2.4, a);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

export function buildLantern(scene, M) {
  const g = new THREE.Group();
  const { glassBottom, glassTop, deckTop, lensY } = DIM;
  const rnd = mulberry32(1234);

  /* ---------- base drum & floor ---------- */
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.94, 2.02, 0.34, 56), M.ironRough);
  drum.position.y = glassBottom - 0.17;
  drum.castShadow = true; drum.receiveShadow = true;
  g.add(drum);
  const drumRing = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.05, 6, 56), M.brass);
  drumRing.rotation.x = Math.PI / 2;
  drumRing.position.y = glassBottom - 0.02;
  g.add(drumRing);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 48), M.iron);
  floor.position.y = glassBottom - 0.05;
  floor.receiveShadow = true;
  g.add(floor);
  // floor plating
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.012, 0.02), M.ironBlack);
    pl.position.set(Math.cos(a) * 0.85, glassBottom + 0.006, Math.sin(a) * 0.85);
    pl.rotation.y = -a;
    g.add(pl);
  }

  // muddy footprints / feathers decal
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: floorDecalTexture(), transparent: true, opacity: 0.85, depthWrite: false, color: 0x8f8878 })
  );
  decal.rotation.x = -Math.PI / 2;
  decal.position.y = glassBottom + 0.008;
  decal.renderOrder = 2;
  g.add(decal);

  /* ---------- glass cage ---------- */
  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(1.74, 1.74, glassTop - glassBottom, 64, 1, true),
    M.glass
  );
  cage.position.y = (glassTop + glassBottom) / 2;
  cage.renderOrder = 5;
  g.add(cage);

  const rainTex = rainGlassTexture();
  const rainLayer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.765, 1.765, glassTop - glassBottom, 64, 1, true),
    new THREE.MeshBasicMaterial({
      map: rainTex, transparent: true, opacity: 0.55, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
  );
  rainLayer.position.y = (glassTop + glassBottom) / 2;
  rainLayer.renderOrder = 7;
  g.add(rainLayer);

  // mullions & rings
  const mull = 18;
  const mullGeo = new THREE.BoxGeometry(0.07, glassTop - glassBottom, 0.07);
  const mullInst = new THREE.InstancedMesh(mullGeo, M.iron, mull);
  const d = new THREE.Object3D();
  for (let i = 0; i < mull; i++) {
    const a = (i / mull) * Math.PI * 2;
    d.position.set(Math.cos(a) * 1.745, (glassTop + glassBottom) / 2, Math.sin(a) * 1.745);
    d.rotation.set(0, -a, 0);
    d.updateMatrix(); mullInst.setMatrixAt(i, d.matrix);
  }
  mullInst.castShadow = true;
  g.add(mullInst);
  for (const yy of [glassBottom + 0.06, (glassBottom + glassTop) / 2, glassTop - 0.06]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.045, 6, 64), M.iron);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = yy;
    g.add(ring);
  }

  /* ---------- roof ---------- */
  const roofPts = [
    new THREE.Vector2(1.9, 0), new THREE.Vector2(1.84, 0.16), new THREE.Vector2(1.62, 0.44),
    new THREE.Vector2(1.24, 0.7), new THREE.Vector2(0.72, 0.88), new THREE.Vector2(0.2, 0.96),
    new THREE.Vector2(0.0, 1.0),
  ];
  const roof = new THREE.Mesh(new THREE.LatheGeometry(roofPts, 56), M.iron);
  roof.scale.set(1, 1.02, 1);
  roof.position.y = glassTop;
  roof.castShadow = true;
  g.add(roof);
  const ribCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.9, 0.0, 0), new THREE.Vector3(1.72, 0.32, 0),
    new THREE.Vector3(1.32, 0.63, 0), new THREE.Vector3(0.78, 0.86, 0),
    new THREE.Vector3(0.2, 0.97, 0), new THREE.Vector3(0.02, 1.01, 0),
  ]);
  const ribGeo = new THREE.TubeGeometry(ribCurve, 16, 0.035, 5, false);
  const ribs = new THREE.InstancedMesh(ribGeo, M.iron, 12);
  for (let i = 0; i < 12; i++) {
    d.position.set(0, glassTop, 0);
    d.rotation.set(0, (i / 12) * Math.PI * 2, 0);
    d.scale.set(1, 1, 1);
    d.updateMatrix(); ribs.setMatrixAt(i, d.matrix);
  }
  g.add(ribs);
  const roofRim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.06, 6, 56), M.brass);
  roofRim.rotation.x = Math.PI / 2;
  roofRim.position.y = glassTop + 0.01;
  g.add(roofRim);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), M.brass);
  finial.position.y = glassTop + 1.04;
  g.add(finial);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.035, 1.1, 8), M.iron);
  rod.position.y = glassTop + 1.6;
  g.add(rod);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), M.brass);
  tip.position.y = glassTop + 2.16;
  g.add(tip);

  /* ---------- weather vane ---------- */
  const vaneBase = new THREE.Group();
  vaneBase.position.y = glassTop + 1.24;
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.02), M.iron);
    arm.rotation.y = (i / 4) * Math.PI * 2;
    vaneBase.add(arm);
    const letter = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.01), M.brass);
    letter.position.set(Math.cos((i / 4) * Math.PI * 2) * 0.33, 0.01, Math.sin((i / 4) * Math.PI * 2) * 0.33);
    letter.rotation.y = -(i / 4) * Math.PI * 2;
    vaneBase.add(letter);
  }
  const vane = new THREE.Group();
  const vaneShaft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.86), M.iron);
  vane.add(vaneShaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), M.iron);
  head.rotation.x = Math.PI / 2; head.position.z = 0.5;
  vane.add(head);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.26), M.iron);
  tail.position.z = -0.4;
  vane.add(tail);
  vane.position.y = glassTop + 1.38;
  g.add(vaneBase, vane);

  /* ---------- ropes on the gallery rail ---------- */
  const ropeCount = 6, ropeSeg = 14;
  const ropeGeo = new THREE.CylinderGeometry(0.032, 0.032, 1, 5);
  const ropes = new THREE.InstancedMesh(ropeGeo, M.rope, ropeCount * ropeSeg);
  const ropeDefs = [];
  for (let i = 0; i < ropeCount; i++) {
    const a = THREE.MathUtils.degToRad(20 + i * 47 + rnd() * 14);
    ropeDefs.push({ a, len: 1.1 + rnd() * 1.1, phase: rnd() * 6.3, r: 2.44 });
  }
  g.add(ropes);
  const rp = new THREE.Vector3(), rq = new THREE.Quaternion(), rm = new THREE.Matrix4(), rs = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  function updateRopes(time) {
    let k = 0;
    for (const def of ropeDefs) {
      const top = new THREE.Vector3(Math.cos(def.a) * def.r, deckTop + 0.92, Math.sin(def.a) * def.r);
      let prev = top.clone();
      for (let s = 1; s <= ropeSeg; s++) {
        const f = s / ropeSeg;
        const sway = Math.sin(time * 1.9 + def.phase + f * 2.4) * 0.16 * Math.pow(f, 1.5);
        const sway2 = Math.cos(time * 1.5 + def.phase * 1.7 + f * 2.0) * 0.1 * Math.pow(f, 1.5);
        const p = new THREE.Vector3(
          top.x + sway + def.len * 0.06 * Math.sin(time * 0.8 + def.phase),
          top.y - def.len * f,
          top.z + sway2
        );
        const mid = prev.clone().add(p).multiplyScalar(0.5);
        const dir = p.clone().sub(prev);
        const len = dir.length();
        rq.setFromUnitVectors(up, dir.normalize());
        rs.set(1, len, 1);
        rm.compose(mid, rq, rs);
        ropes.setMatrixAt(k++, rm);
        prev = p;
      }
    }
    ropes.instanceMatrix.needsUpdate = true;
  }

  /* =================  FRESNEL LENS  ================= */
  const lens = new THREE.Group();
  lens.position.y = lensY;
  g.add(lens);

  // brass pedestal
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.08, 0.09, 40), M.brassDark);
  basePlate.position.y = -1.06;
  lens.add(basePlate);
  const ringGear = new THREE.Mesh(makeGear({ r: 0.92, teeth: 34, tooth: 0.075, thickness: 0.07, hole: 0.5 }), M.brass);
  ringGear.position.y = -1.0;
  lens.add(ringGear);

  const sideGear = new THREE.Mesh(makeGear({ r: 0.36, teeth: 16, tooth: 0.07, thickness: 0.07, hole: 0.1 }), M.brass);
  sideGear.rotation.x = Math.PI / 2;
  sideGear.position.set(0.95, -0.84, 0.05);
  lens.add(sideGear);
  const crank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.05), M.iron);
  crank.position.set(1.15, -0.84, 0.05);
  crank.rotation.z = 0.3;
  lens.add(crank);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10), M.brass);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(1.05, -0.84, 0.05);
  lens.add(axle);

  const pedestalShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 16), M.brass);
  pedestalShaft.position.y = -0.88;
  lens.add(pedestalShaft);

  // prism rings
  const RINGS = 9;
  const lensProfile = (t) => 0.36 + 0.82 * Math.pow(Math.sin(Math.PI * t), 0.8);
  const facetGeo = new THREE.BoxGeometry(0.085, 0.155, 0.05);
  const facets = new THREE.InstancedMesh(facetGeo, M.lens, RINGS * 30);
  let fi = 0;
  const fd = new THREE.Object3D();
  for (let i = 0; i < RINGS; i++) {
    const t = (i + 0.5) / RINGS;
    const y = -0.8 + i * 0.178;
    const rad = lensProfile(t);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.01, 0.172, 30, 1, true), M.lens);
    band.position.y = y;
    lens.add(band);
    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(rad + 0.012, 0.012, 5, 30), M.brass);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.y = y + 0.086;
    lens.add(brassRing);
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * Math.PI * 2;
      fd.position.set(Math.cos(a) * (rad + 0.012), y, Math.sin(a) * (rad + 0.012));
      fd.rotation.set(0.16, -a, 0);
      fd.updateMatrix();
      facets.setMatrixAt(fi++, fd.matrix);
    }
  }
  facets.count = fi;
  lens.add(facets);

  // caps
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.44, 0.2, 20), M.brass);
  capTop.position.y = 0.86;
  lens.add(capTop);
  const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.34, 0.2, 20), M.brassDark);
  capBottom.position.y = -0.9;
  lens.add(capBottom);

  // central eye / bullseye
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), M.lensCore);
  lens.add(eye);
  const bull = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 24), M.lens);
  bull.rotation.z = Math.PI / 2;
  bull.position.set(1.02, 0, 0);
  lens.add(bull);

  const glowTex = glowTexture();
  for (const [s, o] of [[4.8, 0.30], [2.5, 0.45], [10.5, 0.10]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xfff6e0, transparent: true, opacity: o,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
    }));
    sp.scale.set(s, s, 1);
    sp.renderOrder = 8;
    lens.add(sp);
  }

  // beams
  const beamMats = [];
  for (const [rotY, len, rad, op] of [[0, 27, 3.6, 0.5], [Math.PI, 27, 3.6, 0.5], [0, 31, 1.0, 0.75], [Math.PI, 31, 1.0, 0.75]]) {
    const mat = beamMaterial(op);
    const beam = new THREE.Mesh(makeBeamCone(len, rad, 26), mat);
    beam.rotation.y = rotY;
    beam.rotation.z = 0.012;
    beam.renderOrder = 9;
    lens.add(beam);
    beamMats.push(mat);
  }

  const lensLight = new THREE.PointLight(0xfff1d2, 20, 5.2, 2);
  lensLight.position.y = 0.05;
  lens.add(lensLight);

  // sacred shaft falling down the stairwell
  const shaftMat = beamMaterial(0.024);
  const shaftBeam = new THREE.Mesh(makeBeamCone(5.6, 1.85, 24), shaftMat);
  shaftBeam.rotation.x = Math.PI;
  shaftBeam.position.y = glassBottom - 0.1;
  shaftBeam.renderOrder = 6;
  g.add(shaftBeam);

  /* ---------- floor props ---------- */
  // open logbook
  const book = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), M.leather);
  book.add(cover);
  for (const side of [-1, 1]) {
    const pg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.28), M.paper);
    pg.position.set(side * 0.1, 0.024, 0);
    pg.rotation.z = -side * 0.06;
    book.add(pg);
  }
  book.position.set(0.86, glassBottom + 0.03, 0.62);
  book.rotation.y = 0.6;
  g.add(book);

  // tipped oil can
  const can = new THREE.Group();
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.2, 12), M.brassDark);
  can.add(canBody);
  const canNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.16, 8), M.brass);
  canNeck.position.set(0.12, 0.06, 0); canNeck.rotation.z = -0.9;
  can.add(canNeck);
  can.position.set(-0.78, glassBottom + 0.11, 0.86);
  can.rotation.z = Math.PI / 2 - 0.15;
  g.add(can);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.9,
  }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-0.62, glassBottom + 0.006, 0.82);
  puddle.scale.set(1.4, 1, 1);
  g.add(puddle);

  // scattered feathers
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), M.paper);
    const a = rnd() * Math.PI * 2, rr = 0.3 + rnd() * 1.2;
    f.position.set(Math.cos(a) * rr, glassBottom + 0.012, Math.sin(a) * rr);
    f.rotation.set(-Math.PI / 2, 0, rnd() * 3);
    g.add(f);
  }

  scene.add(g);

  let vaneAngle = 0.4;
  return {
    group: g,
    lens,
    update(time, dt) {
      lens.rotation.y = time * 0.115;
      ringGear.rotation.y = -time * 0.115 * 0.9;
      sideGear.rotation.y = time * 0.62;
      eye.scale.setScalar(1 + Math.sin(time * 2.2) * 0.015);
      beamMats.forEach((m) => { m.uniforms.uTime.value = time; });
      shaftMat.uniforms.uTime.value = time;
      rainTex.offset.y = -time * 0.13;
      rainTex.offset.x = Math.sin(time * 0.07) * 0.02;
      vaneAngle += dt * (0.32 + Math.sin(time * 0.43) * 0.22 + Math.sin(time * 1.7) * 0.08);
      vane.rotation.y = vaneAngle;
      updateRopes(time);
    },
  };
}
