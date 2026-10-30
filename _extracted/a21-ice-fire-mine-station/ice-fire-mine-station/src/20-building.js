/* ============================================================
   20 · BUILDING — 寻矿者公会补给驿站与鉴定所
   ============================================================ */

/* ---------- 木纹贴图 ---------- */
function woodTexture(base = '#8a5f40', dark = '#3f2a1a', plankCount = 8) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const pw = w / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const x = i * pw;
      const shade = 0.82 + srnd() * 0.3;
      g.fillStyle = `rgba(${Math.round(58 * shade)},${Math.round(36 * shade)},${Math.round(24 * shade)},0.55)`;
      g.fillRect(x, 0, pw - 1, h);
      // 木纹
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = `rgba(${30 + srnd() * 40},${18 + srnd() * 24},${10 + srnd() * 16},${0.15 + srnd() * 0.25})`;
        g.lineWidth = 0.8 + srnd() * 1.8;
        g.beginPath();
        const gx = x + 4 + srnd() * (pw - 8);
        g.moveTo(gx, 0);
        for (let y = 0; y < h; y += 32) g.lineTo(gx + Math.sin(y * 0.05 + k) * 2.2, y);
        g.stroke();
      }
      // 板缝
      g.fillStyle = dark; g.fillRect(x + pw - 2, 0, 2, h);
      // 钉子
      g.fillStyle = 'rgba(150,150,160,0.5)';
      g.beginPath(); g.arc(x + pw * 0.5, 14, 2.4, 0, 6.3); g.fill();
      g.beginPath(); g.arc(x + pw * 0.5, h - 14, 2.4, 0, 6.3); g.fill();
    }
  });
}
const woodTex = woodTexture();
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
woodTex.repeat.set(2, 1);

const woodTex2 = woodTexture('#9a6a46', '#3f2a1a', 6);
woodTex2.wrapS = woodTex2.wrapT = THREE.RepeatWrapping;

const MAT_WALL = tm(0xffffff, { map: woodTex });
const MAT_WALL_DARK = tm(0xe8d8c8, { map: woodTex2 });
const MAT_STONE = tm(0x77828f);
const MAT_IRON = tm(PAL.iron);
const MAT_IRON_L = tm(PAL.ironLite);
const MAT_ROOF = tm(0x59636f);
const MAT_WINFRAME = tm(0x333a45);
const MAT_DOOR = tm(0x8a5a38, { map: woodTex2 });
const MAT_SNOW = tm(0x6d8299, { emissive: 0x0e1a26, emissiveIntensity: 0.06 });

const bldG = G();
const WALL_H = 2.6;

/* ---------- 墙体：正立面（带三个洞口） ---------- */
const FZ = BZ1;          // -0.6
const wallD = 0.16;
function wallPiece(w, h, x, y, z, mat = MAT_WALL) {
  return B(w, h, wallD, mat, x, y, z, bldG, true);
}
// 窗洞：x -2.70 ~ -1.30, y 0.45 ~ 2.25
// 门洞：x -1.10 ~ 0.20, y 0.13 ~ 2.05
wallPiece(0.20, WALL_H, -2.80, 0, FZ);                   // 左侧墙垛
wallPiece(1.40, 0.45, -2.00, 0, FZ, MAT_STONE);          // 窗下石裙
wallPiece(1.40, 0.35, -2.00, 2.25, FZ);                  // 窗上
wallPiece(0.20, WALL_H, -1.20, 0, FZ);                   // 窗门之间
wallPiece(1.30, 0.55, -0.45, 2.05, FZ);                  // 门上
wallPiece(1.10, 0.55, 0.75, 0, FZ, MAT_STONE);           // 石裙（售货机位）
wallPiece(1.10, 2.05, 0.75, 0.55, FZ);                   // 实墙（售货机位）
wallPiece(0.10, WALL_H, 1.25, 0, FZ);                    // 右墙垛

/* 背墙 / 左墙 */
B(4.2, WALL_H, wallD, MAT_WALL_DARK, -0.8, 0, BZ0 + 0.08, bldG, true);
B(wallD, WALL_H, 3.3, MAT_WALL_DARK, BX0 + 0.08, 0, -2.25, bldG, true);

/* 右墙（带橱窗） */
// 窗洞：z -1.95 ~ -0.95, y 0.70 ~ 1.85
B(wallD, WALL_H, 0.35, MAT_WALL, 1.22, 0, -0.775, bldG, true);
B(wallD, WALL_H, 1.95, MAT_WALL, 1.22, 0, -2.925, bldG, true);
B(wallD, 0.70, 1.0, MAT_STONE, 1.22, 0, -1.45, bldG, true);
B(wallD, 0.75, 1.0, MAT_WALL, 1.22, 1.85, -1.45, bldG, true);

/* ---------- 背立面细节（后巷视角） ---------- */
{
  for (const x of [-2.05, 0.35]) {
    // 假窗：外挂铁框 + 暖光玻璃
    B(0.62, 0.7, 0.07, MAT_IRON, x, 1.2, BZ0 + 0.02, bldG, true);
    const gl = Plane(0.5, 0.58, new THREE.MeshBasicMaterial({ color: 0xffb877, transparent: true, opacity: 0.85 }), x, 1.55, BZ0 - 0.015, bldG);
    gl.rotation.y = Math.PI;
    gl.renderOrder = 2;
    B(0.52, 0.04, 0.05, MAT_IRON_L, x, 1.53, BZ0 + 0.0, bldG, true);
    B(0.04, 0.6, 0.05, MAT_IRON_L, x, 1.24, BZ0 + 0.0, bldG, true);
    glowSprite(0xffa860, 1.1, 0.3, x, 1.55, BZ0 - 0.1, bldG);
  }
  // 后墙通风管与杂物
  C(0.09, 0.09, 1.3, 6, MAT_IRON, 1.05, 0.4, BZ0 - 0.1, bldG, true);
  C(0.11, 0.11, 0.06, 6, MAT_IRON_L, 1.05, 1.68, BZ0 - 0.1, bldG, true);
  for (let i = 0; i < 3; i++) {
    const b = C(0.15, 0.17, 0.42, 10, tm(0x4a3526), -2.55 + i * 0.42, 0, BZ0 - 0.35, bldG, true);
    for (let k = 0; k < 2; k++) C(0.155, 0.155, 0.03, 10, tm(0x2f353d), -2.55 + i * 0.42, 0.1 + k * 0.15, BZ0 - 0.35, bldG, false);
  }
  B(0.5, 0.5, 0.4, tm(0x5a3d26), 0.75, 0, BZ0 - 0.42, bldG, true);
}

/* ---------- 石砌基座与墙角 ---------- */
for (let i = 0; i < 2; i++) {
  const x = i === 0 ? -2.0 : 0.8;
  const w = i === 0 ? 1.9 : 1.1;
  B(w, 0.52, 0.2, MAT_STONE, x, 0, FZ + 0.03, bldG, true);
}
B(0.2, 0.52, 3.2, MAT_STONE, BX1 + 0.03, 0, -2.25, bldG, true);
// 石块分缝
for (let i = 0; i < 8; i++) {
  B(0.02, 0.46, 0.2, tm(0x3d444e), -2.85 + i * 0.55, 0.03, FZ + 0.14, bldG, false);
}
// 四角铁包边
for (const [x, z] of [[BX0 + 0.06, FZ], [BX1 - 0.06, FZ], [BX0 + 0.06, BZ0 + 0.08], [BX1 - 0.06, BZ0 + 0.08]]) {
  B(0.14, WALL_H, 0.14, MAT_IRON, x, 0, z, bldG, true);
}
// 横向木梁（半木结构）
B(4.2, 0.13, 0.06, MAT_IRON_L, -0.8, 2.22, FZ + 0.09, bldG, true);
B(4.2, 0.10, 0.05, MAT_IRON_L, -0.8, 0.56, FZ + 0.09, bldG, true);

/* ---------- 大水晶观察橱窗 ---------- */
function chamferShape(w, h, c) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2 - c);
  s.lineTo(w / 2 - c, h / 2);
  s.lineTo(-w / 2 + c, h / 2);
  s.lineTo(-w / 2, h / 2 - c);
  s.closePath();
  return s;
}
function innerChamfer(w, h, c, b) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + b, -h / 2 + b);
  s.lineTo(w / 2 - b, -h / 2 + b);
  s.lineTo(w / 2 - b, h / 2 - c);
  s.lineTo(w / 2 - c, h / 2 - b);
  s.lineTo(-w / 2 + c, h / 2 - b);
  s.lineTo(-w / 2 + b, h / 2 - c);
  s.closePath();
  return s;
}
const glassMat = new THREE.MeshBasicMaterial({
  color: 0xa8e4ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false
});
const glassMatSide = new THREE.MeshBasicMaterial({
  color: 0xbdf0ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false
});

function crystalWindow(w, h, border, chamfer, depth = 0.16) {
  const grp = new THREE.Group();
  // 外轮廓比墙洞每边大 0.05，把接缝埋进墙体，避免共面闪烁
  const OV = 0.05;
  const outer = chamferShape(w + OV * 2, h + OV * 2, chamfer);
  outer.holes.push(new THREE.Path(innerChamfer(w, h, chamfer, border).getPoints(12)));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }), MAT_WINFRAME);
  frame.castShadow = true;
  frame.userData.outline = true;
  grp.add(frame);
  // 玻璃
  const g = new THREE.Mesh(new THREE.ShapeGeometry(innerChamfer(w, h, chamfer, border * 0.7)), glassMat);
  g.position.z = depth * 0.35;
  g.renderOrder = 6;
  grp.add(g);
  // 内侧木框（环形，不能挡视线）
  const ringShape = innerChamfer(w, h, chamfer, border * 0.55);
  ringShape.holes.push(new THREE.Path(innerChamfer(w, h, chamfer, border * 1.35).getPoints(12)));
  const innerFrame = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: 0.06, bevelEnabled: false }), MAT_WALL_DARK);
  innerFrame.position.z = -0.08;
  grp.add(innerFrame);
  return grp;
}

// 正面大窗
{
  const win = crystalWindow(1.4, 1.8, 0.1, 0.2, 0.18);
  win.position.set(-2.0, 1.35, FZ - 0.09);
  bldG.add(win);
  // 窗棂
  B(1.18, 0.04, 0.05, MAT_IRON_L, -2.0, 1.35, FZ + 0.11, bldG, true);
  B(0.04, 1.5, 0.05, MAT_IRON_L, -2.0, 0.6, FZ + 0.11, bldG, true);
  // 铆钉
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    S(0.022, 6, tm(PAL.brass), -2.62 + t * 1.24, 2.18, FZ + 0.2, bldG);
  }
}
// 右侧橱窗
{
  const win = crystalWindow(1.0, 1.15, 0.11, 0.14, 0.16);
  win.position.set(BX1 + 0.09, 1.27, -1.45);
  win.rotation.y = Math.PI / 2;
  bldG.add(win);
  B(0.05, 0.045, 0.85, MAT_IRON_L, BX1 + 0.16, 1.27, -1.45, bldG, true);
  B(0.05, 0.9, 0.045, MAT_IRON_L, BX1 + 0.16, 0.82, -1.45, bldG, true);
}
// 售货机上方的小壁龛灯
B(0.5, 0.06, 0.16, MAT_IRON_L, 0.825, 2.28, FZ + 0.06, bldG, true);

/* ---------- 自动门（齿轮滑轮木铁包边） ---------- */
const doorG = G();
doorG.position.set(-0.45, 0, FZ);
bldG.add(doorG);
// 门框
B(1.42, 0.1, 0.17, MAT_IRON, 0, 2.06, 0.03, doorG, true);
B(0.1, 2.06, 0.17, MAT_IRON, -0.66, 0, 0.03, doorG, true);
B(0.1, 2.06, 0.17, MAT_IRON, 0.66, 0, 0.03, doorG, true);
// 门槛
B(1.3, 0.05, 0.34, MAT_IRON_L, 0, 0.13, 0.06, doorG, false);

const doors = [];
for (const side of [-1, 1]) {
  const d = G(doorG);
  d.position.set(0, 0, 0.06);
  const panel = B(0.62, 1.86, 0.09, MAT_DOOR, side * 0.31, 0.15, 0, d, true);
  // 铁包边
  B(0.62, 0.07, 0.11, MAT_IRON_L, side * 0.31, 0.15, 0, d, true);
  B(0.62, 0.07, 0.11, MAT_IRON_L, side * 0.31, 1.94, 0, d, true);
  B(0.06, 1.86, 0.11, MAT_IRON_L, side * 0.31 - side * 0.28, 0.15, 0, d, true);
  // 圆形观察窗
  C(0.17, 0.17, 0.02, 12, tm(0x1d3444), side * 0.31, 1.24, 0.06, d, false).rotation.x = Math.PI / 2;
  const gg = C(0.145, 0.145, 0.02, 12, glassMatSide, side * 0.31, 1.265, 0.07, d, false);
  gg.rotation.x = Math.PI / 2;
  gg.renderOrder = 6;
  // 铆钉
  for (let i = 0; i < 4; i++) S(0.022, 6, tm(PAL.brass), side * 0.31, 0.35 + i * 0.42, 0.06, d);
  // 把手
  C(0.03, 0.03, 0.26, 6, tm(PAL.brass), side * 0.12, 0.85, 0.08, d, true);
  // 动态门扇：不使用静态描边，改为跟随的子级描边
  d.traverse((o) => { if (o.isMesh) o.userData.outline = false; });
  childOutline(panel, 0.016);
  doors.push({ g: d, closed: 0, open: side * 0.6 });
}
// 门楣齿轮组
{
  const gearMat = tm(PAL.brass, { emissive: 0x2a1a06, emissiveIntensity: 0.5 });
  const gear = G(doorG);
  gear.position.set(0, 2.28, 0.06);
  C(0.17, 0.17, 0.06, 10, gearMat, 0, 0, 0, gear, true).rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.28;
    const t = B(0.06, 0.09, 0.06, gearMat, Math.cos(a) * 0.19, Math.sin(a) * 0.19 + 0.14, 0, gear, false);
    t.rotation.z = a;
  }
  C(0.07, 0.07, 0.08, 8, tm(PAL.ironLite), 0.24, 2.2, 0, gear, true).rotation.x = Math.PI / 2;
  gear.traverse((o) => { if (o.isMesh) o.userData.outline = false; });
  // 滑轮与皮带
  C(0.05, 0.05, 0.05, 8, tm(PAL.ironLite), -0.24, 2.22, 0, gear, true).rotation.x = Math.PI / 2;
  beam([-0.24, 2.24, 0.02], [-0.05, 1.6, 0.02], 0.014, tm(0x1a1a1e), doorG, 4);
  FX.gear = gear;
}

/* ---------- 屋顶 ---------- */
const RIDGE_X = -0.8, RIDGE_Y = 3.52, EAVE_Y = 2.4, EAVE_L = -3.2, EAVE_R = 1.6;
{
  const halfSpan = 2.4, rise = 1.12;
  const slopeLen = Math.hypot(halfSpan, rise) + 0.1;
  const ang = Math.atan2(rise, halfSpan);
  for (const side of [-1, 1]) {
    const p = B(slopeLen, 0.12, 4.35, MAT_ROOF, RIDGE_X + side * halfSpan / 2, (RIDGE_Y + EAVE_Y) / 2 - 0.06, -2.25, bldG, true);
    p.rotation.z = -side * ang;
    // 瓦楞（子物体，随屋面倾斜）
    for (let i = 0; i < 11; i++) {
      const t = (i / 10 - 0.5) * slopeLen * 0.95;
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.028, 4.3), tm(0x525c68));
      r.position.set(t, 0.072, 0);
      r.userData.outline = false;
      p.add(r);
    }
    // 积雪层
    const snow = new THREE.Mesh(new THREE.BoxGeometry(slopeLen * 0.9, 0.08, 4.14), MAT_SNOW);
    snow.position.set(-side * slopeLen * 0.02, 0.14, 0.01);
    snow.castShadow = true; snow.receiveShadow = true;
    snow.userData.outline = true;
    p.add(snow);
    // 雪层下缘的不规则挂雪
    for (let k = 0; k < 7; k++) {
      const w = rnd(0.16, 0.42) * slopeLen;
      const px = -side * slopeLen * 0.44 + (srnd() - 0.5) * 0.1;
      const blk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, rnd(0.3, 0.8)), MAT_SNOW);
      blk.position.set(px + (srnd() - 0.5) * 0.2 * slopeLen, 0.135, rnd(-1.9, 1.9));
      blk.userData.outline = true;
      p.add(blk);
    }
    // 火山灰
    for (let i = 0; i < 11; i++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.35, 1.5), 0.03, rnd(0.12, 0.36)), tm(0x4e525b));
      a.position.set(rnd(-0.42, 0.42) * slopeLen, 0.19, rnd(-1.9, 1.9));
      a.rotation.y = rnd(-0.25, 0.25);
      a.userData.outline = false;
      p.add(a);
    }
  }
  // 檐口冰凌
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const zz = -4.2 + i * 0.36;
      const xx = RIDGE_X + side * 2.36;
      const h = rnd(0.08, 0.3);
      C(0.008, 0.03, h, 4, tm(0xcfeaff, { emissive: 0x2a6f92, emissiveIntensity: 0.55 }), xx, 2.24 - h, zz, bldG, false);
    }
  }
  // 屋脊
  B(0.22, 0.14, 4.4, tm(0x4a545f), RIDGE_X, RIDGE_Y - 0.02, -2.25, bldG, true);
  B(0.5, 0.11, 4.32, MAT_SNOW, RIDGE_X, RIDGE_Y + 0.1, -2.25, bldG, false);
  // 山墙（正/背）
  for (const zz of [FZ - 0.06, BZ0 + 0.06]) {
    const s = new THREE.Shape();
    s.moveTo(BX0, WALL_H - 0.02);
    s.lineTo(BX1, WALL_H - 0.02);
    s.lineTo(RIDGE_X, RIDGE_Y - 0.04);
    s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }), MAT_WALL);
    m.position.z = zz - (zz > -2 ? 0.14 : 0);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.outline = true;
    bldG.add(m);
  }
  // 山墙装饰（正面圆窗 + 木饰）
  C(0.2, 0.2, 0.06, 14, MAT_IRON, -0.8, 2.95, FZ + 0.02, bldG, true).rotation.x = Math.PI / 2;
  const cw = C(0.15, 0.15, 0.02, 14, em(0xffb060, 0.55, 0x2a1608), -0.8, 3.0, FZ + 0.05, bldG, false);
  cw.rotation.x = Math.PI / 2;
  B(2.5, 0.07, 0.05, MAT_IRON_L, -0.8, 2.62, FZ + 0.06, bldG, true);
  // 山墙斜撑
  beam([BX0 + 0.1, WALL_H, FZ + 0.02], [RIDGE_X, RIDGE_Y - 0.1, FZ + 0.02], 0.045, MAT_IRON_L, bldG);
  beam([BX1 - 0.1, WALL_H, FZ + 0.02], [RIDGE_X, RIDGE_Y - 0.1, FZ + 0.02], 0.045, MAT_IRON_L, bldG);
}

/* ---------- 倾斜铁皮雨棚 ---------- */
{
  const aw = B(3.9, 0.07, 0.95, MAT_ROOF, -0.85, 2.3, FZ + 0.46, bldG, true);
  aw.rotation.x = 0.16;
  // 支撑托架
  for (const x of [-2.6, -1.6, -0.4, 0.85]) {
    beam([x, 1.86, FZ + 0.03], [x, 2.3, FZ + 0.84], 0.028, MAT_IRON, bldG, 5);
    beam([x, 2.28, FZ + 0.03], [x, 2.3, FZ + 0.84], 0.022, MAT_IRON, bldG, 5);
  }
  // 棚面积雪与灰
  {
    const sn = new THREE.Mesh(new THREE.BoxGeometry(3.72, 0.06, 0.5), MAT_SNOW);
    sn.position.set(0, 0.085, -0.22);
    sn.castShadow = true; sn.receiveShadow = true;
    sn.userData.outline = true;
    aw.add(sn);
    for (let i = 0; i < 5; i++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.25, 0.7), 0.025, rnd(0.12, 0.3)), tm(0x232329));
      a.position.set(rnd(-1.7, 1.7), 0.11, rnd(-0.3, 0.3));
      a.userData.outline = false;
      aw.add(a);
    }
  }
  // 棚檐挂冰
  for (let i = 0; i < 9; i++) {
    C(0.012, 0.04, rnd(0.1, 0.34), 4, tm(0xd8f4ff, { emissive: 0x2a7ba8, emissiveIntensity: 0.8 }), rnd(-2.7, 1.0), 2.16, FZ + 0.9, bldG, false);
  }
}

/* ---------- 侧廊（右侧雨棚 + 木柱） ---------- */
{
  const pr = B(1.05, 0.07, 3.0, MAT_ROOF, 1.95, 2.22, -1.95, bldG, true);
  pr.rotation.z = 0.16;
  for (const z of [-3.3, -0.75]) {
    C(0.07, 0.08, 2.15, 6, MAT_WALL_DARK, 2.38, 0, z, bldG, true);
    beam([2.38, 2.1, z], [1.35, 2.34, z], 0.04, MAT_WALL_DARK, bldG, 5);
  }
  {
    const sn = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 2.85), MAT_SNOW);
    sn.position.set(-0.14, 0.075, 0);
    sn.userData.outline = true;
    pr.add(sn);
  }
}

/* ---------- 招牌：矿工镐 + 提灯 ---------- */
function signBoardTexture() {
  return canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c08a45'; g.lineWidth = 10; g.strokeRect(9, 9, w - 18, h - 18);
    g.strokeStyle = 'rgba(192,138,69,0.35)'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48);
    // 镐
    g.save();
    g.translate(w / 2, h * 0.40); g.rotate(-0.5);
    g.strokeStyle = '#b98b52'; g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -70); g.lineTo(0, 70); g.stroke();
    g.strokeStyle = '#9aa6b4'; g.lineWidth = 18;
    g.beginPath(); g.arc(0, -66, 52, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.restore();
    // 提灯
    g.save();
    g.translate(w / 2, h * 0.40);
    g.fillStyle = 'rgba(255,190,110,0.95)';
    g.beginPath(); g.arc(0, 0, 34, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(255,240,200,0.9)';
    g.beginPath(); g.arc(0, 0, 18, 0, 6.3); g.fill();
    g.strokeStyle = '#2a2018'; g.lineWidth = 8;
    g.beginPath(); g.arc(0, 0, 40, 0, 6.3); g.stroke();
    g.restore();
    // 文字
    g.fillStyle = '#f0d9a8';
    g.font = '700 60px "Microsoft YaHei","PingFang SC",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('补 给 · 鉴 定', w / 2, h * 0.80);
    g.font = '500 28px "Microsoft YaHei",sans-serif';
    g.fillStyle = '#9fb0c2';
    g.fillText('MINERS GUILD  ·  STATION 07', w / 2, h * 0.93);
  });
}
{
  const sg = G(bldG);
  sg.position.set(1.05, 2.55, FZ + 0.1);
  // 支架
  beam([0, 0, 0], [0, 0.1, 0.85], 0.035, MAT_IRON, sg, 5);
  beam([0, 0.1, 0.85], [0, -0.5, 0.85], 0.02, MAT_IRON, sg, 4);
  beam([0, 0, 0], [0, -0.34, 0.42], 0.022, MAT_IRON, sg, 4);
  // 吊牌
  const board = B(0.9, 0.66, 0.06, tm(0x3a2c20), 0, -1.1, 0.72, sg, true);
  const face = Plane(0.86, 0.62, new THREE.MeshBasicMaterial({ map: signBoardTexture(), toneMapped: true }), 0, -1.1 + 0.31, 0.764, sg);
  face.renderOrder = 2;
  // 吊链
  beam([-0.3, -0.44, 0.72], [-0.3, -0.44, 0.72], 0.01, MAT_IRON, sg, 4);
  for (const x of [-0.32, 0.32]) {
    beam([x, -0.45, 0.72], [x, -0.46, 0.72], 0.01, MAT_IRON, sg, 4);
    beam([x, -0.4, 0.72], [x, -0.78, 0.72], 0.012, MAT_IRON, sg, 4);
  }
  // 牌下小灯
  const lamp = C(0.06, 0.08, 0.14, 6, em(0xffb060, 1.6, 0x2a1608), 0, -1.28, 0.72, sg, true);
  glowSprite(0xffa050, 0.7, 0.6, 0, -1.2, 0.78, sg);
  FX.signBoard = board;
  FX.signGroup = sg;
}

/* ---------- 竖招牌（公会旗） ---------- */
{
  const tex = canvasTex(256, 768, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2b3b52'); grd.addColorStop(0.5, '#243244'); grd.addColorStop(1, '#1b2532');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c08a45'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#e8c98a';
    g.font = '700 92px "Microsoft YaHei","PingFang SC",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = ['寻', '矿', '者', '公', '会'];
    chars.forEach((c, i) => g.fillText(c, w / 2, 110 + i * 132));
    g.fillStyle = '#7fa8c8';
    g.beginPath(); g.arc(w / 2, h - 70, 34, 0, 6.3); g.fill();
    g.fillStyle = '#1b2532';
    g.font = '700 40px serif'; g.fillText('矿', w / 2, h - 66);
  });
  const m = Plane(0.62, 1.86, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }), BX1 + 0.12, 1.62, -2.55, bldG);
  m.rotation.y = Math.PI / 2;
  B(0.04, 0.04, 0.7, MAT_IRON, BX1 + 0.14, 2.58, -2.55, bldG, true);
  // 布旗轻微摆动
  FX.banner = m;
}

/* ---------- 檐下小灯笼串 ---------- */
{
  const lg = G(bldG);
  const x0 = -2.55, x1 = 0.95, y0 = 2.12;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = lerp(x0, x1, t);
    const y = y0 - Math.sin(t * Math.PI) * 0.1;
    const g = G(lg);
    g.position.set(x, y, FZ + 0.66);
    beam([0, 0.18, 0], [0, 0, 0], 0.006, tm(0x1a1a1e), g, 3);
    const body = S(0.062, 8, em(0xffb060, 1.4, 0x2a1608), 0, -0.09, 0, g, false);
    body.scale.set(1, 1.25, 1);
    C(0.03, 0.03, 0.02, 6, tm(0x3a2a1a), 0, -0.02, 0, g, false);
    C(0.03, 0.03, 0.02, 6, tm(0x3a2a1a), 0, -0.17, 0, g, false);
    glowSprite(0xffa858, 0.5, 0.35, 0, -0.09, 0, g);
  }
  beam([x0, y0 + 0.18, FZ + 0.66], [x1, y0 + 0.18, FZ + 0.66], 0.006, tm(0x1a1a1e), bldG, 3);
}

/* ---------- 壁灯 ---------- */
function wallLamp(x, y, z, ry = 0) {
  const g = G(bldG);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  beam([0, 0, 0], [0, 0.16, 0.42], 0.025, MAT_IRON, g, 4);
  beam([0, 0.16, 0.42], [0, -0.06, 0.5], 0.02, MAT_IRON, g, 4);
  // 灯笼
  const body = C(0.13, 0.10, 0.24, 6, em(0xffc078, 1.5, 0x2a1a0a), 0, -0.3, 0.5, g, true);
  C(0.16, 0.13, 0.05, 6, MAT_IRON, 0, -0.08, 0.5, g, true);
  C(0.10, 0.13, 0.05, 6, MAT_IRON, 0, -0.35, 0.5, g, true);
  glowSprite(0xffa858, 0.85, 0.55, 0, -0.18, 0.52, g);
  const pl = new THREE.PointLight(0xffa860, 1.6, 2.4, 2);
  pl.position.set(0, -0.16, 0.5);
  g.add(pl);
  return g;
}
wallLamp(-2.62, 2.28, FZ + 0.05);
wallLamp(0.55, 2.28, FZ + 0.05);
wallLamp(BX1 + 0.02, 2.15, -2.95, Math.PI / 2);

/* ---------- 门口与檐下补光 ---------- */
{
  const pl = new THREE.PointLight(0xffb070, 2.6, 3.4, 2);
  pl.position.set(-0.45, 2.05, FZ + 0.62);
  scene.add(pl);
  const pl2 = new THREE.PointLight(0xffa860, 1.6, 2.6, 2);
  pl2.position.set(-2.15, 2.05, FZ + 0.62);
  scene.add(pl2);
  // 室内门口补光（让门洞里有暖光）
  const pl3 = new THREE.PointLight(0xffb877, 2.4, 3.2, 2);
  pl3.position.set(-0.5, 1.55, -1.1);
  scene.add(pl3);
}

/* ---------- 屋顶烟囱与通风管 ---------- */
{
  C(0.16, 0.18, 1.0, 8, MAT_IRON, 0.55, 3.0, -2.2, bldG, true);
  C(0.24, 0.24, 0.1, 8, MAT_IRON_L, 0.55, 3.95, -2.2, bldG, true);
  C(0.2, 0.2, 0.06, 8, tm(0x1a1a1e), 0.55, 4.04, -2.2, bldG, false);
  // 弯管
  C(0.09, 0.09, 0.7, 6, MAT_IRON, -2.5, 2.2, -2.9, bldG, true);
  const bend = C(0.09, 0.09, 0.5, 6, MAT_IRON, -2.5, 2.86, -2.9, bldG, true);
  bend.rotation.z = 0.5;
  // 屋顶积雪堆
  for (let i = 0; i < 6; i++) {
    const b = S(rnd(0.1, 0.2), 6, MAT_SNOW, rnd(-2.8, 1.4), 2.46, rnd(-4.0, -0.4), bldG);
    b.scale.y = 0.5;
  }
}

/* ---------- 门口地垫 ---------- */
{
  const tex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#1a1e24'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c08a45'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
    g.strokeStyle = '#8fa4b8'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(150, 70); g.lineTo(190, 190); g.stroke();
    g.beginPath(); g.moveTo(362, 70); g.lineTo(322, 190); g.stroke();
    g.beginPath(); g.arc(256, 110, 46, 0, 6.3); g.stroke();
    g.fillStyle = '#e8c98a'; g.font = '700 30px "Microsoft YaHei",sans-serif';
    g.textAlign = 'center'; g.fillText('WELCOME · 公会驿站', 256, 226);
  });
  const mat = B(1.5, 0.035, 0.72, tm(0x22262c), -0.45, 0.13, FZ + 0.55, bldG, false);
  const face = Plane(1.44, 0.66, new THREE.MeshBasicMaterial({ map: tex }), -0.45, 0.168, FZ + 0.56, bldG);
  face.rotation.x = -Math.PI / 2;
  face.renderOrder = 2;
}
