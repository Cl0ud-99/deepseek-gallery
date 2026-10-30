/* =========================================================================
   生命动效：彩蝶尾迹 / 露珠涟漪 / 花露气泡 / 金鱼 / 风车 / 呼吸花瓣 / 主循环
   ========================================================================= */

/* 白天主题：整体压低发光精灵强度，避免在明亮天空下过曝 */
for (const gs of glowSprites) {
  gs.material.opacity = (gs.userData.baseOpacity !== undefined ? gs.userData.baseOpacity : 1) * 0.5;
}

/* 收集需要驱动的部件 */
let stillBubbles = null, chandelierFireflies = null, scaleBeam = null, dandelionHead = null, dandelionTips = null;
scene.traverse(o => {
  if (o.userData.bubbles) stillBubbles = o.userData.bubbles;
  if (o.userData.fireflies) chandelierFireflies = o.userData.fireflies;
  if (o.userData.beam) scaleBeam = o.userData.beam;
  if (o.userData.head) dandelionHead = o.userData.head;
  if (o.userData.tips) dandelionTips = o.userData.tips;
});

/* --------------------------------------------------------------- 发光彩蝶 */
const butterflies = [];
function makeButterfly(scale) {
  const g = new THREE.Group();
  const bodyMat = toonMat({ color: 0xfff0d8, shade: 0xc08a5a, rim: 0xffffff, rimStr: 1.2, emissive: 1.0 });
  const bodyGeo = new THREE.SphereGeometry(0.10, 10, 8);
  bodyGeo.scale(0.55, 0.55, 1.7);
  g.add(new THREE.Mesh(bodyGeo, bodyMat));

  const wingGeo = new THREE.PlaneGeometry(0.72, 0.62);
  wingGeo.translate(-0.36, 0, 0);
  const matL = new THREE.MeshBasicMaterial({ map: texWing, transparent: true, alphaTest: 0.03, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const wl = new THREE.Mesh(wingGeo, matL);
  wl.position.set(0.03, 0.02, 0);
  g.add(wl);
  const wr = new THREE.Mesh(wingGeo, matL);
  wr.position.set(-0.03, 0.02, 0);
  wr.scale.x = -1;
  g.add(wr);

  const halo = glowSprite(0x9fe8ff, 1.1, 0.45);
  g.add(halo);
  g.scale.setScalar(scale);
  g.userData.wl = wl;
  g.userData.wr = wr;
  scene.add(g);
  return g;
}

const bfDefs = [
  { R: 5.4, y: 5.3, sp: 0.30, ph: 0.0, cz: 0.0, sc: 1.9 },
  { R: 7.6, y: 2.4, sp: 0.21, ph: 2.1, cz: 1.2, sc: 1.6 },
  { R: 3.4, y: 6.6, sp: 0.38, ph: 3.6, cz: -1.6, sc: 1.4 },
  { R: 6.6, y: 3.9, sp: 0.26, ph: 5.0, cz: -2.4, sc: 1.7 },
  { R: 8.6, y: 1.7, sp: 0.17, ph: 1.1, cz: 2.6, sc: 1.5 }
];
for (const d of bfDefs) {
  const obj = makeButterfly(d.sc);
  const trail = makePoints(18, { color: 0xffb347, size: 0.09, additive: false });
  scene.add(trail);
  butterflies.push({ ...d, obj, trail, history: [] });
}

/* --------------------------------------------------------------- 蒲公英绒 */
const fluffCount = 70;
const fluff = makePoints(fluffCount, { color: 0xffffff, size: 0.14, additive: false });
scene.add(fluff);
const fluffVel = [];
const fluffLife = [];
const fp = fluff.geometry.attributes.position;
const fa = fluff.geometry.attributes.aAlpha;
const fluffOrigin = new THREE.Vector3(-8.65, 2.72, 2.65);
function respawnFluff(i) {
  const a = rnd(0, TAU), e = rnd(-0.3, 1.0);
  const r = rnd(0.1, 1.15);
  fp.setXYZ(i, fluffOrigin.x + Math.cos(a) * r * Math.cos(e), fluffOrigin.y + Math.sin(e) * r * 0.8, fluffOrigin.z + Math.sin(a) * r * Math.cos(e));
  fluffVel[i] = new THREE.Vector3(rnd(-0.12, 0.12) + Math.cos(a) * 0.12, rnd(0.03, 0.10), rnd(-0.12, 0.12) + Math.sin(a) * 0.12);
  fluffLife[i] = rnd(0, 1);
  fa.setX(i, 0);
}
for (let i = 0; i < fluffCount; i++) respawnFluff(i);

/* --------------------------------------------------------------- 空气微尘 */
const motes = makePoints(150, { color: 0xd8f0ff, size: 0.10, additive: false });
scene.add(motes);
const motePos = motes.geometry.attributes.position;
const moteVel = [];
for (let i = 0; i < 150; i++) {
  const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 10.5;
  motePos.setXYZ(i, Math.cos(a) * r, rnd(-1.6, 8.5), Math.sin(a) * r);
  moteVel.push(rnd(0.04, 0.16));
}
motes.geometry.attributes.aAlpha.array.forEach((_, i) => motes.geometry.attributes.aAlpha.setX(i, rnd(0.15, 0.6)));

/* --------------------------------------------------------------- 露珠与涟漪 */
const dropMat = toonMat({ color: 0xffffff, shade: 0x9fd8f0, rim: 0xffffff, rimStr: 1.6, spec: 0xffffff, specStr: 1.5, emissive: 0.55, transparent: true, opacity: 0.95 });
const drops = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), dropMat);
  m.visible = false;
  scene.add(m);
  drops.push({ mesh: m, active: false, vy: 0, y: 0, x: 0, z: 0 });
}
let dropTimer = 0.6;

const splashRings = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  m.visible = false;
  m.renderOrder = 10;
  scene.add(m);
  splashRings.push({ mesh: m, life: 0, active: false });
}
let ringIdx = 0;

function splash(x, z, big = false) {
  const r = splashRings[ringIdx % splashRings.length];
  ringIdx++;
  r.mesh.position.set(x, 0.035, z);
  r.mesh.scale.setScalar(0.35);
  r.active = true;
  r.life = 0;
  r.mesh.visible = true;
  r.big = big;
  addRipple(x, z, big ? 1.5 : 1.0);
}

/* ------------------------------------------------------------ 随机环境涟漪 */
let ambRipple = 0;

/* --------------------------------------------------------------- 主循环 */
const clockStart = performance.now();
let prev = performance.now();

function updateLife(t, dt) {
  /* 花瓣呼吸 */
  for (const p of lotusPetals) {
    const b = Math.sin(t * 0.55 + p.phase);
    p.mesh.rotation.x = p.baseX + b * 0.014;
    const s = 1 + b * 0.008;
    p.mesh.scale.set(s, 1, 1 + b * 0.004);
  }

  /* 风车 */
  if (windmill.userData.wheel) windmill.userData.wheel.rotation.z -= dt * 0.42;

  /* 王莲步道起伏 */
  for (const l of leafBoats) {
    l.obj.position.y = l.baseY + Math.sin(t * 0.8 + l.phase) * 0.028;
    l.obj.rotation.z = Math.sin(t * 0.6 + l.phase) * 0.012;
  }

  /* 天鹅船 */
  swan.position.y = 0.02 + Math.sin(t * 0.9) * 0.035;
  swan.rotation.z = Math.sin(t * 0.7) * 0.018;
  swan.rotation.x = Math.sin(t * 1.1 + 1.2) * 0.014;

  /* 紫藤摇摆 */
  for (const w of wisteriaStrands) {
    w.obj.rotation.z = Math.sin(t * 0.8 + w.phase) * w.amp;
    w.obj.rotation.x = Math.cos(t * 0.65 + w.phase) * w.amp * 0.8;
  }

  /* 月露珠 */
  moonPearl.position.y = 6.95 + Math.sin(t * 0.9) * 0.14;
  moonPearl.rotation.y = t * 0.35;
  moonPearl.rotation.x = Math.sin(t * 0.4) * 0.2;

  /* 天平轻晃 */
  if (scaleBeam) scaleBeam.rotation.z = Math.sin(t * 1.15) * 0.055;

  /* 吊灯萤火 */
  if (chandelierFireflies) {
    const a = chandelierFireflies.geometry.attributes.aAlpha;
    for (let i = 0; i < a.count; i++) a.setX(i, 0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + i * 1.9)));
    a.needsUpdate = true;
    chandelierFireflies.rotation.y = t * 0.15;
  }

  /* 蒸馏器气泡 */
  if (stillBubbles) {
    const p = stillBubbles.geometry.attributes.position;
    const a = stillBubbles.geometry.attributes.aAlpha;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * (0.22 + (i % 5) * 0.05);
      if (y > 1.24) {
        y = 0.56;
        const ang = rnd(0, TAU), rr = Math.sqrt(Math.random()) * 0.34;
        p.setX(i, Math.cos(ang) * rr);
        p.setZ(i, Math.sin(ang) * rr);
      }
      p.setY(i, y);
      a.setX(i, 0.35 + 0.65 * Math.sin(((y - 0.56) / 0.68) * Math.PI));
    }
    p.needsUpdate = true;
    a.needsUpdate = true;
  }

  /* 金鱼 */
  for (const f of fishes) {
    const a = t * f.sp + f.ph;
    const x = Math.cos(a) * f.r;
    const z = Math.sin(a) * f.r * 0.85 + f.cz;
    f.obj.position.set(x, f.y + Math.sin(t * 0.8 + f.ph) * 0.09, z);
    const na = a + Math.sign(f.sp) * 0.06;
    const nx = Math.cos(na) * f.r;
    const nz = Math.sin(na) * f.r * 0.85 + f.cz;
    f.obj.lookAt(nx, f.obj.position.y, nz);
    f.obj.rotation.z = Math.sin(t * 1.4 + f.ph) * 0.10;
    if (f.obj.userData.tail) f.obj.userData.tail.rotation.y = Math.sin(t * 6.5 + f.ph) * 0.45;
  }

  /* 彩蝶 */
  for (const b of butterflies) {
    const a = t * b.sp + b.ph;
    const x = Math.cos(a) * b.R;
    const z = Math.sin(a) * b.R * 0.86 + b.cz;
    const y = b.y + Math.sin(t * 0.9 + b.ph) * 0.75 + Math.sin(t * 2.3 + b.ph) * 0.12;
    b.obj.position.set(x, y, z);
    const na = a + Math.sign(b.sp) * 0.05;
    const nx = Math.cos(na) * b.R, nz = Math.sin(na) * b.R * 0.86 + b.cz;
    const ny = b.y + Math.sin((t + 0.12) * 0.9 + b.ph) * 0.75;
    b.obj.lookAt(nx, ny, nz);
    b.obj.rotation.z = Math.sin(t * 1.3 + b.ph) * 0.18;

    const flap = Math.sin(t * 13 + b.ph * 3) * 0.75;
    b.obj.userData.wl.rotation.z = flap - 0.15;
    b.obj.userData.wr.rotation.z = -flap + 0.15;

    b.history.unshift(b.obj.position.clone());
    if (b.history.length > 18) b.history.pop();
    const tp = b.trail.geometry.attributes.position;
    const ta = b.trail.geometry.attributes.aAlpha;
    for (let i = 0; i < 18; i++) {
      const p = b.history[Math.min(i, b.history.length - 1)];
      tp.setXYZ(i, p.x, p.y, p.z);
      ta.setX(i, Math.max(0, 1 - i / 17) * 0.85);
    }
    tp.needsUpdate = true;
    ta.needsUpdate = true;
  }

  /* 蒲公英绒 */
  for (let i = 0; i < fluffCount; i++) {
    const v = fluffVel[i];
    fluffLife[i] += dt * 0.12;
    let x = fp.getX(i) + v.x * dt + Math.sin(t * 0.7 + i) * 0.002;
    let y = fp.getY(i) + v.y * dt;
    let z = fp.getZ(i) + v.z * dt;
    if (fluffLife[i] > 1 || y > 9.5 || Math.abs(x) > 12 || Math.abs(z) > 12) {
      respawnFluff(i);
      continue;
    }
    fp.setXYZ(i, x, y, z);
    fa.setX(i, Math.sin(Math.min(1, fluffLife[i] * 3) * Math.PI) * 0.85);
  }
  fp.needsUpdate = true;
  fa.needsUpdate = true;

  /* 微尘 */
  for (let i = 0; i < 150; i++) {
    let y = motePos.getY(i) + moteVel[i] * dt;
    if (y > 9.0) y = -1.4;
    motePos.setY(i, y);
    motePos.setX(i, motePos.getX(i) + Math.sin(t * 0.4 + i) * 0.0025);
  }
  motePos.needsUpdate = true;

  /* 露珠生成 */
  dropTimer -= dt;
  if (dropTimer <= 0 && dewSources.length) {
    dropTimer = rnd(0.9, 1.8);
    const src = dewSources[0];
    const d = drops.find(x => !x.active);
    if (d) {
      d.active = true;
      d.mesh.visible = true;
      d.x = src.x + rnd(-0.05, 0.05);
      d.z = src.z + rnd(-0.05, 0.05);
      d.y = src.y;
      d.vy = 0;
      d.mesh.position.set(d.x, d.y, d.z);
      d.mesh.scale.setScalar(rnd(0.8, 1.2));
    }
  }
  for (const d of drops) {
    if (!d.active) continue;
    d.vy -= 9.8 * dt;
    d.y += d.vy * dt;
    d.mesh.position.y = d.y;
    d.mesh.rotation.y += dt * 3;
    if (d.y <= 0.04) {
      d.active = false;
      d.mesh.visible = false;
      splash(d.x, d.z, false);
    }
  }

  /* 水花光环 */
  for (const r of splashRings) {
    if (!r.active) continue;
    r.life += dt;
    const k = r.life / 0.9;
    if (k >= 1) { r.active = false; r.mesh.visible = false; continue; }
    r.mesh.scale.setScalar(0.3 + k * 1.5);
    r.mesh.material.opacity = (1 - k) * 0.55;
  }

  /* 随机涟漪 */
  ambRipple -= dt;
  if (ambRipple <= 0) {
    ambRipple = rnd(2.2, 4.5);
    const a = rnd(0, TAU), r = rnd(3.5, 9.0);
    addRipple(Math.cos(a) * r, Math.sin(a) * r, rnd(0.25, 0.5));
  }

  /* 紫藤水面涟漪 */
  if (Math.random() < dt * 0.5) {
    addRipple(-5.2 + rnd(-1.2, 1.2), -6.9 + rnd(-0.8, 0.8), 0.4);
  }
}

/* ------------------------------------------------------------------ 渲染 */
function renderFrame() {
  renderer.setRenderTarget(rtScene);
  renderer.render(scene, camera);

  brightMat.uniforms.tDiffuse.value = rtScene.texture;
  blit(brightMat, rtB1);

  blurMat.uniforms.tDiffuse.value = rtB1.texture;
  blurMat.uniforms.uDir.value.set(1 / rtB1.width, 0);
  blit(blurMat, rtB2);

  blurMat.uniforms.tDiffuse.value = rtB2.texture;
  blurMat.uniforms.uDir.value.set(0, 1 / rtB1.height);
  blit(blurMat, rtB1);

  blurMat.uniforms.tDiffuse.value = rtB1.texture;
  blurMat.uniforms.uDir.value.set(2 / rtB1.width, 0);
  blit(blurMat, rtC1);

  blurMat.uniforms.tDiffuse.value = rtC1.texture;
  blurMat.uniforms.uDir.value.set(0, 2 / rtC2.height);
  blit(blurMat, rtC2);

  compositeMat.uniforms.tScene.value = rtScene.texture;
  compositeMat.uniforms.tB1.value = rtB1.texture;
  compositeMat.uniforms.tB2.value = rtC2.texture;
  blit(compositeMat, null);
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  const t = (now - clockStart) / 1000;
  U.uTime.value = t;
  updateCamera(dt);
  updateLife(t, dt);
  renderFrame();
}

/* 初始涟漪，让水面一开始就有生气 */
addRipple(2.5, 4.0, 0.9);
addRipple(-4.0, -2.0, 0.7);
requestAnimationFrame(animate);
