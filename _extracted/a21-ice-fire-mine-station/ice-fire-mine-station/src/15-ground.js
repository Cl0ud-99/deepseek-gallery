/* ============================================================
   15 · GROUND — 湿滑石板路 / 人行道 / 排水槽 / 铁轨 / 斑马线
   ============================================================ */

/* ---------- 石板贴图 ---------- */
function cobbleTexture() {
  return canvasTex(768, 768, (g, w, h) => {
    g.fillStyle = '#1d2530'; g.fillRect(0, 0, w, h);
    const N = 7, cell = w / N;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const jx = (srnd() - 0.5) * cell * 0.16, jy = (srnd() - 0.5) * cell * 0.16;
        const x = i * cell + 4 + jx, y = j * cell + 4 + jy;
        const ww = cell - 8 + (srnd() - 0.5) * 5, hh = cell - 8 + (srnd() - 0.5) * 5;
        const v = 80 + srnd() * 44;
        const r = Math.round(v * 0.94 + srnd() * 12);
        const gg = Math.round(v * 0.98 + srnd() * 10);
        const b = Math.round(v * 1.06 + srnd() * 12);
        g.fillStyle = `rgb(${r},${gg},${b})`;
        roundRect(g, x, y, ww, hh, 12 + srnd() * 10);
        g.fill();
        // 石面高光
        g.fillStyle = `rgba(${r + 42},${gg + 46},${b + 56},0.5)`;
        roundRect(g, x + 5, y + 4, ww - 12, hh * 0.42, 10);
        g.fill();
        // 裂纹
        if (srnd() > 0.6) {
          g.strokeStyle = 'rgba(10,14,20,0.55)'; g.lineWidth = 1.6;
          g.beginPath();
          g.moveTo(x + srnd() * ww, y);
          g.lineTo(x + srnd() * ww, y + hh);
          g.stroke();
        }
      }
    }
    // 潮湿斑驳
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${20 + srnd() * 30},${40 + srnd() * 40},${60 + srnd() * 50},${0.05 + srnd() * 0.1})`;
      g.beginPath();
      g.ellipse(srnd() * w, srnd() * h, 12 + srnd() * 60, 8 + srnd() * 40, srnd() * 3, 0, 6.3);
      g.fill();
    }
  });
}
const cobbleTex = cobbleTexture();
cobbleTex.wrapS = cobbleTex.wrapT = THREE.RepeatWrapping;
cobbleTex.repeat.set(4.6, 4.6);

const groundG = G();

/* 街面 */
{
  const m = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 11.0), tm(0xe4ecf4, { map: cobbleTex }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(1.3, 0.002, 0);
  m.receiveShadow = true;
  groundG.add(m);
}
/* 人行道（L 形） */
const walkMat = tm(0xd6dde6, { map: cobbleTex });
B(5.55, 0.13, 1.66, walkMat, -0.08, 0, 0.23, groundG, true);
B(1.42, 0.13, 3.98, walkMat, 2.0, 0, -2.61, groundG, true);
/* 路缘石 */
const curbMat = tm(0x9aa7b4);
B(5.6, 0.16, 0.12, curbMat, -0.08, 0, 1.11, groundG, true);
B(0.12, 0.16, 4.1, curbMat, 2.66, 0, -2.62, groundG, true);
// 路缘石上的薄冰
for (let i = 0; i < 14; i++) {
  B(rnd(0.1, 0.35), 0.03, rnd(0.06, 0.13), tm(0xcdeeff, { emissive: 0x2a6f92, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 }),
    rnd(-2.6, 2.4), 0.155, 1.12, groundG, false);
}

/* ---------- 石砌排水槽 ---------- */
{
  const gz = 1.42;
  B(8.2, 0.18, 0.12, tm(0x4e5763), 1.35, -0.02, gz - 0.24, groundG, true);
  B(8.2, 0.18, 0.12, tm(0x4e5763), 1.35, -0.02, gz + 0.24, groundG, true);
  const chW = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 0.36), new THREE.MeshBasicMaterial({ color: 0x1b3f5c }));
  chW.rotation.x = -Math.PI / 2;
  chW.position.set(1.35, -0.06, gz);
  groundG.add(chW);
  // 流水
  const flow = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 0.3), new THREE.MeshBasicMaterial({
    color: 0x54c8f0, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  flow.rotation.x = -Math.PI / 2;
  flow.position.set(1.35, -0.03, gz);
  groundG.add(flow);
  FX.flow = flow;
  // 槽内发光熔岩碎屑
  for (let i = 0; i < 16; i++) {
    const s = B(rnd(0.03, 0.08), 0.02, rnd(0.03, 0.08), em(PAL.lava, 1.4, 0x3a0e04), rnd(-2.5, 5.2), -0.04, gz + rnd(-0.1, 0.1), groundG, false);
    s.rotation.y = rnd(0, 3);
  }
  // 格栅盖板
  for (let i = 0; i < 9; i++) {
    const x = -2.4 + i * 0.95;
    if (x > 0.4 && x < 2.4) continue;
    for (let j = 0; j < 4; j++) {
      B(0.9, 0.05, 0.045, tm(PAL.ironLite), x, 0.02, gz - 0.16 + j * 0.1, groundG, false);
    }
  }
}

/* ---------- 斑马线（内嵌发光冰火矿石） ---------- */
{
  const zc = 3.15, len = 1.5;
  for (let i = 0; i < 7; i++) {
    const x = -2.45 + i * 0.42;
    B(0.26, 0.035, len, tm(0x76889c, { emissive: 0x0a141c, emissiveIntensity: 0.3 }), x, 0.005, zc, groundG, false);
    // 内嵌矿石
    const isIce = i % 2 === 0;
    B(0.09, 0.05, 0.22, em(isIce ? PAL.ice : PAL.lava, 1.5, 0x081018), x, 0.004, zc - len / 2 + 0.22, groundG, false);
    B(0.09, 0.05, 0.22, em(isIce ? PAL.lava : PAL.ice, 1.5, 0x081018), x, 0.004, zc + len / 2 - 0.22, groundG, false);
  }
  // 斑马线两端提示灯
  for (const zz of [zc - len / 2 - 0.2, zc + len / 2 + 0.2]) {
    B(0.1, 0.06, 0.06, em(PAL.gold, 1.2, 0x141008), -2.62, 0.01, zz, groundG, false);
  }
}

/* ---------- 积水与反光 ---------- */
const puddleMat = new THREE.MeshBasicMaterial({
  map: TEX_GLOW, color: 0x2a4a6a, transparent: true, opacity: 0.5,
  blending: THREE.AdditiveBlending, depthWrite: false
});
for (let i = 0; i < 16; i++) {
  const x = rnd(-2.6, 5.1), z = rnd(-4.9, 5.1);
  if (x > -1.4 && x < 1.9 && z > -1.1 && z < 1.3) continue;
  const p = Plane(rnd(0.5, 1.7), rnd(0.4, 1.2), puddleMat.clone(), x, 0.016, z, groundG);
  p.material.opacity = rnd(0.18, 0.45);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = rnd(0, 3.14);
}
/* 冷暖双色地面光斑 */
function lightPool(color, size, x, z, op, y = 0.022) {
  const p = Plane(size, size, new THREE.MeshBasicMaterial({
    map: TEX_GLOW, color, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }), x, y, z, groundG);
  p.rotation.x = -Math.PI / 2;
  p.renderOrder = 1;
  return p;
}
const poolWarm = lightPool(0xff9a4e, 3.4, -1.0, 0.6, 0.3, 0.148);
const poolIce = lightPool(0x59c6ff, 3.0, -2.2, 3.4, 0.24);
const poolRed = lightPool(0xff5a22, 4.6, -3.6, 1.0, 0.3);
FX.pulses.push({ s: poolWarm, base: 0.3, sp: 0.5 });
FX.pulses.push({ s: poolIce, base: 0.24, sp: 0.42 });
// 橱窗与门口洒出的暖光
const spill1 = lightPool(0xffb060, 4.4, -2.0, 0.5, 0.5, 0.148);
const spill2 = lightPool(0xffa050, 3.0, -0.45, 0.45, 0.46, 0.148);
const spill3 = lightPool(0xffc890, 2.4, 1.9, -1.2, 0.32, 0.148);
FX.pulses.push({ s: spill1, base: 0.42, sp: 0.35 });
FX.pulses.push({ s: spill2, base: 0.38, sp: 0.45 });
// 路灯下的冷光斑
lightPool(0x7fd8ff, 2.4, -2.5, 2.3, 0.22);
lightPool(0x7fd8ff, 2.4, 4.85, 2.35, 0.2);
lightPool(0xffb060, 1.8, 4.72, -2.8, 0.16);

/* ---------- 黑色火山灰 / 薄冰斑块 ---------- */
for (let i = 0; i < 26; i++) {
  const x = rnd(-2.7, 5.2), z = rnd(-5.0, 5.2);
  if (x > -1.5 && x < 2.0 && z > -1.2 && z < 1.4) continue;
  const isAsh = srnd() > 0.45;
  const p = Plane(rnd(0.4, 1.5), rnd(0.35, 1.1), new THREE.MeshBasicMaterial({
    map: TEX_GLOW, color: isAsh ? 0x101318 : 0xbfe8ff,
    transparent: true, opacity: isAsh ? 0.5 : 0.18, depthWrite: false
  }), x, 0.012, z, groundG);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = rnd(0, 3.14);
}

/* ---------- 铁轨 ---------- */
function offsetCurve(pts, dx, dz) {
  return new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x + dx, p.y, p.z + dz)));
}
{
  const P = [
    new THREE.Vector3(4.06, 0.03, -4.95),
    new THREE.Vector3(4.06, 0.03, -2.4),
    new THREE.Vector3(4.02, 0.03, 0.5),
    new THREE.Vector3(3.55, 0.03, 2.5),
    new THREE.Vector3(2.62, 0.03, 4.5),
    new THREE.Vector3(2.35, 0.03, 5.55)
  ];
  const curve = new THREE.CatmullRomCurve3(P);
  const N = 74;
  const gauge = 0.46;
  const railMat = tm(0x8b95a4, { emissive: 0x1a2028, emissiveIntensity: 0.3 });
  for (let side = -1; side <= 1; side += 2) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const nx = -tan.z, nz = tan.x;
      pts.push(new THREE.Vector3(p.x + nx * gauge * side, 0.055, p.z + nz * gauge * side));
    }
    const c2 = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(c2, N, 0.032, 5, false), railMat);
    tube.castShadow = true;
    tube.userData.outline = false;
    groundG.add(tube);
  }
  // 枕木
  const sleeperMat = tm(0x3d2a1e);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const b = B(0.78, 0.07, 0.17, sleeperMat, p.x, 0.0, p.z, groundG, false);
    b.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
  }
  // 道砟
  for (let i = 0; i < 60; i++) {
    const t = srnd();
    const p = curve.getPoint(t);
    rock(rnd(0.05, 0.12), tm(pick([0x2c3138, 0x3a4048])), p.x + rnd(-0.55, 0.55), 0.02, p.z + rnd(-0.2, 0.2), groundG, 0.3);
  }
}

/* ---------- 街角护栏（发光冰柱焊接铁栏） ---------- */
{
  const gx = 5.32;
  for (let i = 0; i < 8; i++) {
    const z = -4.8 + i * 1.45;
    C(0.045, 0.06, 0.62, 6, tm(PAL.ironLite), gx, 0, z, groundG, true);
    const ice = C(0.05, 0.08, 0.22, 6, tm(0x9fe6ff, { emissive: 0x3f9dc4, emissiveIntensity: 0.9 }), gx, 0.62, z, groundG, true);
    glowSprite(0x6fd8ff, 0.7, 0.4, gx, 0.72, z, groundG);
  }
  beam([gx, 0.52, -4.9], [gx, 0.52, 5.0], 0.028, tm(PAL.ironLite), groundG);
  beam([gx, 0.2, -4.9], [gx, 0.2, 5.0], 0.02, tm(PAL.iron), groundG);
}
