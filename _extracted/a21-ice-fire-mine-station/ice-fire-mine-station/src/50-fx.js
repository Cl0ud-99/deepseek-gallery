/* ============================================================
   50 · FX — 雨 / 雪 / 蒸汽 / 水滴 / 灵体 / 动效
   ============================================================ */

const FXG = G();
const insideBuilding = (x, z) => (x > BX0 - 0.25 && x < BX1 + 0.25 && z > BZ0 - 0.25 && z < BZ1 + 0.25);
const respawnXZ = () => {
  let x = rnd(-6, 6), z = rnd(-6, 6);
  if (insideBuilding(x, z)) x = BX1 + rnd(0.6, 4.2);
  return [x, z];
};

/* ---------- 细雨 ---------- */
const RAIN_N = 720;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(RAIN_N * 6);
const rainVel = new Float32Array(RAIN_N);
const rainLen = new Float32Array(RAIN_N);
for (let i = 0; i < RAIN_N; i++) {
  const [x, z] = respawnXZ();
  const y = rnd(0, 9);
  const len = rnd(0.16, 0.36);
  rainPos[i * 6] = x; rainPos[i * 6 + 1] = y; rainPos[i * 6 + 2] = z;
  rainPos[i * 6 + 3] = x + 0.03; rainPos[i * 6 + 4] = y - len; rainPos[i * 6 + 5] = z;
  rainVel[i] = rnd(5.5, 8.5);
  rainLen[i] = len;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({
  color: 0xa8d8ff, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false
}));
rain.frustumCulled = false;
FXG.add(rain);

/* ---------- 冰晶雪花 ---------- */
const SNOW_N = 460;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(SNOW_N * 3);
const snowData = [];
for (let i = 0; i < SNOW_N; i++) {
  const [x, z] = respawnXZ();
  snowPos[i * 3] = x; snowPos[i * 3 + 1] = rnd(0, 9); snowPos[i * 3 + 2] = z;
  snowData.push({ v: rnd(0.22, 0.55), ph: rnd(0, 6.28), amp: rnd(0.1, 0.35), sp: rnd(0.4, 1.2) });
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({
  map: TEX_SOFT, color: 0xdff2ff, size: 0.075, transparent: true, opacity: 0.9,
  depthWrite: false, sizeAttenuation: true, alphaTest: 0.02
}));
snow.frustumCulled = false;
FXG.add(snow);

/* ---------- 蒸汽 / 水雾 ---------- */
function makeSteam(cfg) {
  const n = cfg.n;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const alpha = new Float32Array(n);
  const size = new Float32Array(n);
  const data = [];
  for (let i = 0; i < n; i++) {
    const life = rnd(0, 1);
    data.push({ life, sp: rnd(0.55, 1.1), dx: rnd(-1, 1), dz: rnd(-1, 1), ph: rnd(0, 6.28) });
    pos[i * 3] = cfg.x; pos[i * 3 + 1] = cfg.y; pos[i * 3 + 2] = cfg.z;
    alpha[i] = 0; size[i] = cfg.small ? rnd(0.12, 0.28) : rnd(0.3, 0.7);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: TEX_SOFT }, uColor: { value: new THREE.Color(cfg.color) }, uOpacity: { value: cfg.opacity || 0.1 } },
    vertexShader: `
      attribute float aAlpha; attribute float aSize;
      varying float vA;
      void main(){
        vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * 420.0 / max(0.001, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity;
      varying float vA;
      void main(){
        vec4 tx = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(uColor, tx.a * vA * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  FXG.add(pts);
  return { pts, geo, pos, alpha, size, data, cfg };
}
const steams = FX.steam.map(makeSteam);

/* ---------- 熔岩飞溅火星 ---------- */
const SPARK_N = 70;
const sparkGeo = new THREE.BufferGeometry();
const sparkPos = new Float32Array(SPARK_N * 3);
const sparkData = [];
for (let i = 0; i < SPARK_N; i++) {
  sparkData.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: rnd(0, 1) });
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
  map: TEX_SOFT, color: 0xffb050, size: 0.1, transparent: true, opacity: 0.95,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
sparks.frustumCulled = false;
FXG.add(sparks);
function resetSpark(s) {
  s.x = CONTACT.x + rnd(-0.6, 0.6);
  s.y = POOL_Y + rnd(0, 0.2);
  s.z = CONTACT.z + rnd(-0.35, 0.5);
  s.vx = rnd(-0.5, 0.5); s.vy = rnd(0.8, 2.0); s.vz = rnd(-0.3, 0.6);
  s.life = rnd(0.5, 1);
}
sparkData.forEach(resetSpark);

/* ---------- 屋檐滴水 ---------- */
const drips = [];
{
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.85 });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x9fd8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  for (const p of FX.dripPoints) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), dropMat);
    m.scale.set(0.6, 1.7, 0.6);
    m.position.copy(p);
    FXG.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.05, 12), ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.02, p.z + 0.02);
    ring.visible = false;
    FXG.add(ring);
    drips.push({ m, ring, y: p.y, t: rnd(0, 2.4), sp: rnd(2.6, 4.0), x: p.x, z: p.z });
  }
}

/* ---------- 水晶窗上的雨痕 ---------- */
const glassDrops = [];
{
  const mat = new THREE.MeshBasicMaterial({
    color: 0xdff4ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
  });
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.012, rnd(0.05, 0.16)), mat.clone());
    m.position.set(rnd(-2.42, -1.38), rnd(0.8, 2.0), FZ + 0.105);
    m.renderOrder = 7;
    FXG.add(m);
    glassDrops.push({ m, y0: 0.8, y1: 2.0, sp: rnd(0.05, 0.16), pause: rnd(0, 3), t: 0 });
  }
}

/* ---------- 冷雾 ---------- */
const mists = [];
for (let i = 0; i < 6; i++) {
  const s = glowSprite(0x8fd8ff, rnd(1.4, 2.6), rnd(0.03, 0.06), rnd(-5.2, -3.0), POOL_Y + rnd(0.1, 0.6), rnd(1.4, 5.2), FXG);
  mists.push({ s, x0: s.position.x, ph: rnd(0, 6.28), sp: rnd(0.1, 0.25), amp: rnd(0.2, 0.6) });
}

/* ---------- 熔岩落点光晕环 ---------- */
const rings = [];
for (let i = 0; i < 3; i++) {
  const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({
    color: i === 0 ? 0xffb060 : (i === 1 ? 0xa07bff : 0x6fd8ff),
    transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  }));
  r.rotation.x = -Math.PI / 2;
  r.position.set(CONTACT.x, POOL_Y + 0.05, CONTACT.z + 0.25);
  FXG.add(r);
  rings.push({ m: r, t: i * 0.8 });
}

/* ============================================================
   动画
   ============================================================ */
let lastT = 0;
onFrame((dt, t) => {
  /* 熔岩 / 水 */
  for (const m of FX.lava) m.uniforms.uT.value = t;
  waterMat.uniforms.uT.value = t;
  crystalMat.uniforms.uT.value = t;

  /* 雨 */
  for (let i = 0; i < RAIN_N; i++) {
    const o = i * 6;
    const v = rainVel[i] * dt;
    rainPos[o + 1] -= v; rainPos[o + 4] -= v;
    rainPos[o] -= v * 0.09; rainPos[o + 3] -= v * 0.09;
    if (rainPos[o + 4] < -0.4) {
      const [x, z] = respawnXZ();
      const y = rnd(8.4, 9.6);
      const len = rainLen[i];
      rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z;
      rainPos[o + 3] = x + 0.03; rainPos[o + 4] = y - len; rainPos[o + 5] = z;
    }
  }
  rainGeo.attributes.position.needsUpdate = true;

  /* 雪 */
  for (let i = 0; i < SNOW_N; i++) {
    const d = snowData[i];
    snowPos[i * 3 + 1] -= d.v * dt;
    snowPos[i * 3] += Math.sin(t * d.sp + d.ph) * d.amp * dt;
    snowPos[i * 3 + 2] += Math.cos(t * d.sp * 0.8 + d.ph) * d.amp * 0.7 * dt;
    if (snowPos[i * 3 + 1] < -0.3) {
      const [x, z] = respawnXZ();
      snowPos[i * 3] = x; snowPos[i * 3 + 1] = rnd(7.5, 9.2); snowPos[i * 3 + 2] = z;
    }
  }
  snowGeo.attributes.position.needsUpdate = true;

  /* 蒸汽 */
  for (const st of steams) {
    const { pos, alpha, size, data, cfg } = st;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.life += dt * 0.16 * d.sp;
      if (d.life > 1) { d.life = 0; d.dx = rnd(-1, 1); d.dz = rnd(-1, 1); d.ph = rnd(0, 6.28); }
      const l = d.life;
      pos[i * 3] = cfg.x + d.dx * cfg.spread * (0.35 + l * 1.5) + Math.sin(t * 0.9 + d.ph) * 0.09 * l;
      pos[i * 3 + 1] = cfg.y + l * cfg.up * 2.6;
      pos[i * 3 + 2] = cfg.z + d.dz * cfg.spread * (0.35 + l * 1.4) + Math.cos(t * 0.7 + d.ph) * 0.08 * l;
      alpha[i] = Math.sin(l * Math.PI) * (1 - l * 0.25);
      size[i] = (cfg.small ? 0.12 : 0.26) * (0.5 + l * 2.0);
    }
    st.geo.attributes.position.needsUpdate = true;
    st.geo.attributes.aAlpha.needsUpdate = true;
    st.geo.attributes.aSize.needsUpdate = true;
  }

  /* 火星 */
  for (let i = 0; i < SPARK_N; i++) {
    const s = sparkData[i];
    s.life -= dt * 0.7;
    if (s.life <= 0) resetSpark(s);
    s.vy -= dt * 2.2;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    sparkPos[i * 3] = s.x; sparkPos[i * 3 + 1] = s.y; sparkPos[i * 3 + 2] = s.z;
  }
  sparkGeo.attributes.position.needsUpdate = true;

  /* 滴水 */
  for (const d of drips) {
    d.t -= dt;
    if (d.t <= 0) {
      d.t = rnd(1.4, 3.6);
      d.m.visible = true;
      d.m.position.set(d.x, d.y, d.z);
      d.vy = 0;
      d.falling = true;
      d.ring.visible = false;
    }
    if (d.falling) {
      d.vy += 9.5 * dt;
      d.m.position.y -= d.vy * dt;
      d.m.scale.y = 1.7 + d.vy * 0.16;
      if (d.m.position.y < 0.03) {
        d.falling = false;
        d.m.visible = false;
        d.ring.visible = true;
        d.ring.scale.setScalar(0.4);
        d.ring.material.opacity = 0.55;
      }
    }
    if (d.ring.visible) {
      d.ring.scale.multiplyScalar(1 + dt * 3.4);
      d.ring.material.opacity -= dt * 1.6;
      if (d.ring.material.opacity <= 0) d.ring.visible = false;
    }
  }

  /* 窗上雨痕 */
  for (const g of glassDrops) {
    if (g.pause > 0) { g.pause -= dt; continue; }
    g.m.position.y -= g.sp * dt * 4;
    if (g.m.position.y < g.y0) {
      g.m.position.y = g.y1;
      g.m.position.x = rnd(-2.42, -1.38);
      g.pause = rnd(0.4, 3.0);
      g.m.material.opacity = rnd(0.25, 0.6);
    }
  }

  /* 冷雾 */
  for (const m of mists) {
    m.s.position.x = m.x0 + Math.sin(t * m.sp + m.ph) * m.amp;
    m.s.material.opacity = 0.035 + Math.sin(t * m.sp * 1.7 + m.ph) * 0.018;
  }

  /* 落点光环 */
  for (const r of rings) {
    r.t += dt * 0.42;
    if (r.t > 1) r.t -= 1;
    const k = r.t;
    r.m.scale.setScalar(0.6 + k * 2.6);
    r.m.material.opacity = (1 - k) * 0.3;
  }

  /* 灯光脉动 */
  const pulse = 0.82 + Math.sin(t * 2.1) * 0.08 + Math.sin(t * 5.7) * 0.05;
  FX.lavaLights[0].intensity = 9 * pulse;
  FX.lavaLights[1].intensity = 6 * (0.85 + Math.sin(t * 3.3 + 1) * 0.12);
  crystalLight.intensity = 5.5 * (0.85 + Math.sin(t * 1.5) * 0.12);
  for (const p of FX.pulses) {
    p.s.material.opacity = p.base * (0.78 + Math.sin(t * p.sp * 2.2) * 0.22);
  }

  /* 冰火双灵 */
  for (const s of FX.spirits) {
    const a = t * s.sp + s.ph;
    s.s.position.set(s.cx + Math.cos(a) * s.r, s.cy + Math.sin(a * 1.7) * s.r * 0.9, Math.sin(a) * s.r);
    s.s.material.opacity = 0.7 + Math.sin(t * 3 + s.ph) * 0.25;
  }

  /* 中央龙晶旋转 */
  FX.spin.rotation.y = t * 0.5;
  FX.spin.position.y = 0.52 + Math.sin(t * 1.1) * 0.015;
  if (FX.spotCone) FX.spotCone.material.opacity = 0.08 + Math.sin(t * 1.3) * 0.025;

  /* 招牌轻摆 */
  if (FX.signGroup) FX.signGroup.rotation.z = Math.sin(t * 0.8) * 0.014;
  if (FX.banner) FX.banner.rotation.x = Math.sin(t * 0.9) * 0.05;

  /* 自动门 */
  {
    const cycle = 15, openAt = 5, dur = 3.4;
    const ph = t % cycle;
    let k = 0;
    if (ph > openAt && ph < openAt + dur) {
      const u = (ph - openAt) / dur;
      k = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    }
    for (const d of doors) {
      d.g.position.x = lerp(d.closed, d.open, k);
    }
    if (FX.gear) FX.gear.rotation.z += (k - (FX._lastK || 0)) * 12;
    FX._lastK = k;
  }

  /* 索道吊篮 */
  if (FX.cable) {
    FX.cable.t += dt * 0.045;
    if (FX.cable.t > 1) FX.cable.t -= 1;
    const u = 0.5 - 0.5 * Math.cos(FX.cable.t * Math.PI * 2);
    const p = FX.cable.curve.getPoint(u);
    FX.cable.basket.position.set(p.x, p.y - 0.05, p.z);
    FX.cable.basket.rotation.z = Math.sin(t * 1.4) * 0.06;
  }

  /* 排水槽水流 */
  if (FX.flow) FX.flow.material.opacity = 0.34 + Math.sin(t * 2.2) * 0.08;
});
