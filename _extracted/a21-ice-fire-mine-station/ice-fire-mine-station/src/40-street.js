/* ============================================================
   40 · STREET — 矿山街角的所有道具
   ============================================================ */
const SY = 0.13;          // 人行道面
const stG = G();

/* ---------- 投币式自动贩卖机 ---------- */
function vendingMachine(x, z, ry, hot) {
  const g = G(stG);
  g.position.set(x, SY, z);
  g.rotation.y = ry;
  const bodyCol = hot ? 0x6e2a22 : 0x1c405e;
  const accent = hot ? 0xff7a30 : 0x4fc8ff;
  B(0.62, 1.62, 0.68, tm(bodyCol), 0, 0, 0, g, true);
  B(0.66, 0.08, 0.72, tm(0x2a2f38), 0, 1.62, 0, g, true);
  // 展示窗
  B(0.5, 0.95, 0.02, tm(0x0d1620), 0, 0.58, 0.347, g, false);
  const pane = Plane(0.46, 0.9, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.14, depthWrite: false }), 0, 1.055, 0.388, g);
  pane.renderOrder = 6;
  // 商品排
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 4; i++) {
      C(0.03, 0.03, 0.15, 7, em(hot ? 0xff9a40 : 0x6fd0ff, 0.85, 0x101820), -0.18 + i * 0.12, 0.65 + r * 0.28, 0.352, g, false);
    }
  }
  // 顶部灯箱
  const tex = canvasTex(512, 160, (gg, w, h) => {
    gg.fillStyle = hot ? '#c8421e' : '#1b6a9a'; gg.fillRect(0, 0, w, h);
    gg.fillStyle = '#fff2d8';
    gg.font = '700 58px "Microsoft YaHei",sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText(hot ? '抗寒热汤' : '防暑冰袋', w / 2, h * 0.42);
    gg.font = '500 30px "Microsoft YaHei",sans-serif';
    gg.fillText(hot ? 'HOT SOUP · 24H' : 'ICE PACK · 24H', w / 2, h * 0.78);
  });
  const lb = Plane(0.56, 0.18, new THREE.MeshBasicMaterial({ map: tex, color: 0xcfc6bc }), 0, 1.75, 0.352, g);
  // 投币口 / 按钮
  B(0.06, 0.16, 0.04, tm(PAL.brass), 0.22, 0.5, 0.36, g, true);
  for (let i = 0; i < 3; i++) B(0.05, 0.05, 0.03, em(accent, 1.4, 0x101010), 0.22, 0.9 + i * 0.08, 0.36, g, false);
  // 取物口
  B(0.34, 0.12, 0.06, tm(0x11161c), 0, 0.14, 0.36, g, false);
  // 底部散热格栅
  for (let i = 0; i < 4; i++) B(0.44, 0.015, 0.02, tm(0x0e1319), 0, 0.05 + i * 0.02, 0.35, g, false);
  glowSprite(accent, 1.6, 0.4, 0, 1.0, 0.45, g);
  // 机器正面的地面反光
  const rp = Plane(0.9, 1.4, new THREE.MeshBasicMaterial({
    map: TEX_GLOW, color: accent, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false
  }), 0, 0.005, 0.85, g);
  rp.rotation.x = -Math.PI / 2;
  return g;
}
vendingMachine(0.45, -0.25, 0, true);
vendingMachine(1.11, -0.25, 0, false);

/* ---------- 矿石粉碎机造型垃圾桶 ---------- */
function crusherBin(x, z, ry, col) {
  const g = G(stG);
  g.position.set(x, SY, z);
  g.rotation.y = ry;
  // 漏斗
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.15, 0.28, 4, 1, true), tm(0x3a4149, { side: THREE.DoubleSide }));
  hopper.position.y = 0.72; hopper.rotation.y = Math.PI / 4;
  hopper.castShadow = true; hopper.userData.outline = true;
  g.add(hopper);
  B(0.3, 0.62, 0.3, tm(0x2f353d), 0, 0.1, 0, g, true);
  // 齿轮
  const gear = C(0.1, 0.1, 0.04, 10, tm(PAL.brass), 0.17, 0.36, 0.02, g, true);
  gear.rotation.z = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.28;
    const t = B(0.04, 0.04, 0.04, tm(PAL.brass), 0.19, 0.36 + Math.sin(a) * 0.11, 0.02 + Math.cos(a) * 0.11, g, false);
  }
  // 投入口
  B(0.26, 0.05, 0.26, tm(0x14181d), 0, 0.7, 0, g, false);
  // 分类标牌
  const tex = canvasTex(256, 256, (gg, w, h) => {
    gg.fillStyle = col; gg.beginPath(); gg.arc(w / 2, h / 2, w / 2 - 6, 0, 6.3); gg.fill();
    gg.fillStyle = '#10161c'; gg.font = '700 96px "Microsoft YaHei",sans-serif';
    gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText('矿', w / 2, h / 2 + 4);
  });
  const p = Plane(0.2, 0.2, new THREE.MeshBasicMaterial({ map: tex, transparent: true }), 0, 0.45, 0.16, g);
  return g;
}
crusherBin(1.72, 0.72, 0.2, '#c08a45');
crusherBin(2.12, 0.95, -0.15, '#5fa8c8');

/* ---------- 街角护栏（临冰潭一侧） ---------- */
{
  for (let i = 0; i < 7; i++) {
    const z = 0.15 + i * 0.86;
    C(0.055, 0.07, 0.55, 6, tm(PAL.stoneDark), -2.86, SY, z, stG, true);
    const cap = C(0.05, 0.075, 0.12, 6, tm(0x9fe6ff, { emissive: 0x3f9dc4, emissiveIntensity: 1.0 }), -2.86, SY + 0.55, z, stG, true);
    glowSprite(0x6fd8ff, 0.65, 0.35, -2.86, SY + 0.62, z, stG);
  }
  beam([-2.86, SY + 0.46, 0.1], [-2.86, SY + 0.46, 5.45], 0.032, tm(PAL.ironLite), stG);
  beam([-2.86, SY + 0.2, 0.1], [-2.86, SY + 0.2, 5.45], 0.022, tm(PAL.iron), stG);
  // 护栏上的警示牌
  const tex = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#c8a020'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a1a'; g.font = '700 44px "Microsoft YaHei",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('冰潭危险', w / 2, h / 2);
  });
  const p = Plane(0.4, 0.2, new THREE.MeshBasicMaterial({ map: tex }), -2.82, SY + 0.5, 3.0, stG);
  p.rotation.y = Math.PI / 2;
}

/* ---------- 铁桶伞架 ---------- */
{
  const g = G(stG);
  g.position.set(-2.62, SY, 0.42);
  C(0.19, 0.16, 0.44, 8, tm(0x4a5058), 0, 0, 0, g, true);
  C(0.2, 0.2, 0.04, 8, tm(PAL.ironLite), 0, 0.44, 0, g, true);
  // 水
  C(0.17, 0.17, 0.01, 8, new THREE.MeshBasicMaterial({ color: 0x2a6a8a, transparent: true, opacity: 0.7 }), 0, 0.4, 0, g, false);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28;
    const ux = Math.cos(a) * 0.07, uz = Math.sin(a) * 0.07;
    const shaft = C(0.012, 0.012, 1.15, 5, tm(pick([0x2a3a4a, 0x3a2a2a, 0x1f2a34])), ux, 0.1, uz, g, false);
    shaft.rotation.set(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    // 伞面（收拢）
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.5, 5), tm(pick([0x2f4a5a, 0x4a2f3a, 0x33403a])));
    canopy.position.set(ux + Math.sin(a) * 0.13, 1.1, uz - Math.cos(a) * 0.13);
    canopy.rotation.set(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    canopy.castShadow = true; canopy.userData.outline = true;
    g.add(canopy);
    // 弯手柄
    const hk = C(0.014, 0.014, 0.12, 5, tm(0x6a4a2a), ux, 1.3, uz, g, false);
    hk.rotation.z = 1.2;
  }
  // 桶上的水珠
  for (let i = 0; i < 5; i++) {
    const s = S(0.012, 4, new THREE.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.7 }), rnd(-0.15, 0.15), rnd(0.1, 0.4), 0.19, g, false);
  }
}

/* ---------- 冰火双灵路灯 ---------- */
function streetLamp(x, z) {
  const g = G(stG);
  g.position.set(x, 0, z);
  C(0.19, 0.24, 0.16, 8, tm(PAL.stoneDark), 0, 0, 0, g, true);
  C(0.1, 0.15, 0.2, 8, tm(PAL.iron), 0, 0.16, 0, g, true);
  C(0.045, 0.06, 2.35, 8, tm(PAL.iron), 0, 0.34, 0, g, true);
  for (let i = 0; i < 3; i++) C(0.075, 0.075, 0.04, 8, tm(PAL.ironLite), 0, 0.7 + i * 0.62, 0, g, true);
  // 顶部横臂
  beam([0, 2.68, 0], [0, 2.72, 0], 0.05, tm(PAL.iron), g, 5);
  beam([-0.44, 2.6, 0], [0.44, 2.6, 0], 0.035, tm(PAL.iron), g, 5);
  beam([0, 2.45, 0], [-0.42, 2.58, 0], 0.022, tm(PAL.iron), g, 4);
  beam([0, 2.45, 0], [0.42, 2.58, 0], 0.022, tm(PAL.iron), g, 4);
  C(0.02, 0.02, 0.16, 5, tm(PAL.iron), 0, 2.72, 0, g, false);
  // 双灯
  const specs = [
    { x: -0.42, col: 0x7fe4ff, dark: 0x1d5f80 },
    { x: 0.42, col: 0xffb060, dark: 0x8a3a10 }
  ];
  const spirits = [];
  for (const s of specs) {
    C(0.12, 0.13, 0.06, 8, tm(PAL.iron), s.x, 2.38, 0, g, true);
    const globe = S(0.13, 10, new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: 0.5 }), s.x, 2.26, 0, g);
    globe.scale.set(1, 1.15, 1);
    // 内部发光核
    S(0.055, 8, em(s.col, 2.0, 0x0a1018), s.x, 2.26, 0, g, false);
    // 铁箍
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 4, 12), tm(PAL.iron));
      r.position.set(s.x, 2.18 + i * 0.08, 0);
      r.rotation.x = Math.PI / 2;
      g.add(r);
    }
    C(0.09, 0.12, 0.05, 8, tm(PAL.iron), s.x, 2.12, 0, g, true);
    glowSprite(s.col, 1.3, 0.55, s.x, 2.26, 0, g);
    // 灵体
    const sp = glowSprite(s.col, 0.3, 0.85, s.x + 0.05, 2.26, 0, g);
    spirits.push({ s: sp, cx: s.x, cy: 2.26, r: 0.07, sp: s.col === 0x7fe4ff ? 1.6 : 1.1, ph: s.col === 0x7fe4ff ? 0 : 2.2 });
    const pl = new THREE.PointLight(s.col, 1.5, 3.2, 2);
    pl.position.set(s.x, 2.24, 0);
    g.add(pl);
  }
  FX.spirits.push(...spirits.map(o => ({ ...o, group: g })));
  return g;
}
streetLamp(-2.5, 2.3);
streetLamp(4.85, 2.35);

/* ---------- 电线杆 ---------- */
{
  const g = G(stG);
  g.position.set(5.0, 0, 0.6);
  C(0.105, 0.135, 4.0, 8, tm(0x4a3526), 0, 0, 0, g, true);
  // 树皮纹理环
  for (let i = 0; i < 12; i++) {
    C(0.112, 0.122, 0.05, 8, tm(pick([0x3f2c1e, 0x553c2a])), 0, 0.25 + i * 0.3, 0, g, false);
  }
  // 横担
  for (const y of [3.3, 3.62]) {
    B(1.1, 0.08, 0.1, tm(0x4a3526), 0, y, 0, g, true);
    for (const xx of [-0.42, 0, 0.42]) {
      C(0.045, 0.055, 0.1, 6, tm(0x9fb0c0), xx, y + 0.08, 0, g, true);
    }
  }
  // 变压器
  C(0.16, 0.16, 0.4, 8, tm(0x3a4149), 0.24, 2.6, 0, g, true);
  C(0.17, 0.17, 0.05, 8, tm(PAL.ironLite), 0.24, 3.0, 0, g, true);
  // 绝缘子与线缆
  const pts = [[-0.42, 3.75, 0], [0.42, 3.75, 0], [0, 3.4, 0]];
  // 缠绕的耐热电缆圈
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.24 - i * 0.02, 0.018, 4, 14), tm(0x1f2228));
    t.position.set(0, 1.15 + i * 0.1, 0);
    t.rotation.x = Math.PI / 2 + rnd(-0.1, 0.1);
    g.add(t);
  }
  // 冰凌
  for (let i = 0; i < 10; i++) {
    C(0.006, 0.024, rnd(0.12, 0.4), 4, tm(0xcfeaff, { emissive: 0x2a7ba8, emissiveIntensity: 0.6 }), rnd(-0.1, 0.1), rnd(1.6, 3.2), rnd(0.08, 0.13), g, false);
  }
  // 杆上小灯
  C(0.07, 0.09, 0.1, 6, em(0xffb060, 1.6, 0x2a1608), 0, 2.2, 0.2, g, true);
  glowSprite(0xffa050, 0.8, 0.5, 0, 2.28, 0.22, g);
  // 拉线
  beam([0, 3.6, 0], [1.4, 0.1, -1.2], 0.012, tm(0x1a1a1e), g, 4);
  FX.poleTop = new THREE.Vector3(5.0, 3.75, 0.6);
}

/* ---------- 索道缆线 + 吊篮 + 信号灯 ---------- */
{
  const A = new THREE.Vector3(5.0, 3.78, 0.6);
  const Bp = new THREE.Vector3(1.5, 3.3, -3.2);
  const curve = new THREE.CatmullRomCurve3([
    A,
    new THREE.Vector3(4.0, 3.2, -1.0),
    new THREE.Vector3(2.6, 3.05, -2.3),
    Bp
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 4, false), tm(0x1a1d22));
  tube.userData.outline = false;
  stG.add(tube);
  // 两个固定信号灯
  for (const t of [0.28, 0.72]) {
    const p = curve.getPoint(t);
    C(0.03, 0.03, 0.16, 5, tm(0x1a1d22), p.x, p.y - 0.16, p.z, stG, false);
    S(0.06, 8, em(t < 0.5 ? 0xff6a4a : 0x6fd8ff, 1.8, 0x0a0a10), p.x, p.y - 0.2, p.z, stG, false);
    glowSprite(t < 0.5 ? 0xff6a4a : 0x6fd8ff, 0.7, 0.6, p.x, p.y - 0.2, p.z, stG);
  }
  // 移动吊篮
  const basket = G(stG);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.18, 6, 1, true), tm(0x3a4149, { side: THREE.DoubleSide }));
  bucket.position.y = -0.1;
  bucket.userData.outline = true;
  basket.add(bucket);
  for (let i = 0; i < 3; i++) S(0.04, 5, em([0x9fe8ff, 0xffa050, 0xc07bff][i], 1.4, 0x101018), rnd(-0.06, 0.06), 0.0, rnd(-0.06, 0.06), basket, false);
  C(0.012, 0.012, 0.3, 4, tm(0x1a1d22), 0, 0.12, 0, basket, false);
  beam([0, 0.26, 0], [0, 0.26, 0], 0.01, tm(0x1a1d22), basket, 3);
  basket.traverse((o) => { if (o.isMesh) o.userData.outline = false; });
  FX.cable = { basket, curve, t: 0.2 };
}

/* ---------- 铁皮路牌 ---------- */
{
  const g = G(stG);
  g.position.set(2.28, SY, 0.62);
  g.rotation.y = -0.35;
  C(0.045, 0.055, 2.1, 8, tm(PAL.iron), 0, 0, 0, g, true);
  C(0.14, 0.18, 0.12, 8, tm(PAL.stoneDark), 0, -0.1, 0, g, true);
  C(0.05, 0.05, 0.08, 8, tm(PAL.ironLite), 0, 2.1, 0, g, true);
  const plates = [
    { y: 1.95, txt: '熔岩矿道', dir: '←', col: '#8a2a1a', ry: 0.16 },
    { y: 1.68, txt: '寒冰晶洞', dir: '→', col: '#1a4a6a', ry: -0.2 },
    { y: 1.41, txt: '冰火交融核心区', dir: '↑', col: '#4a2a6a', ry: 0.05 }
  ];
  for (const p of plates) {
    const tex = canvasTex(640, 150, (gg, w, h) => {
      gg.fillStyle = p.col; gg.fillRect(0, 0, w, h);
      gg.strokeStyle = '#e8d8b0'; gg.lineWidth = 6; gg.strokeRect(6, 6, w - 12, h - 12);
      gg.fillStyle = '#f4ecd8';
      gg.font = '700 62px "Microsoft YaHei","PingFang SC",sans-serif';
      gg.textBaseline = 'middle'; gg.textAlign = 'left';
      gg.fillText(p.txt, 40, h / 2 + 2);
      gg.font = '700 72px sans-serif'; gg.textAlign = 'right';
      gg.fillText(p.dir, w - 34, h / 2 + 4);
    });
    const pl = new THREE.Group();
    const board = B(0.82, 0.2, 0.035, tm(0x2a2f38), 0.34, 0, 0, g, true);
    const face = Plane(0.8, 0.19, new THREE.MeshBasicMaterial({ map: tex }), 0.34, 0.1, 0.025, g);
    face.position.z = 0.032;
    // 定位
    board.position.set(0.34, p.y, 0);
    face.position.set(0.34, p.y + 0.1, 0.025);
    board.rotation.y = p.ry; face.rotation.y = p.ry;
  }
}

/* ---------- 公告栏 ---------- */
{
  const tex = canvasTex(640, 480, (g, w, h) => {
    g.fillStyle = '#5a4230'; g.fillRect(0, 0, w, h);
    // 矿脉分布图
    g.fillStyle = '#d8c9a8'; g.fillRect(28, 28, 340, 250);
    g.strokeStyle = '#8a7a5a'; g.lineWidth = 3; g.strokeRect(28, 28, 340, 250);
    g.fillStyle = '#c9b98f'; g.fillRect(28, 28, 340, 40);
    g.fillStyle = '#4a3a24'; g.font = '600 26px "Microsoft YaHei",sans-serif'; g.textAlign = 'center';
    g.fillText('矿 脉 分 布 图', 198, 56);
    // 地形色块
    const cols = ['#b8a67e', '#9aa88a', '#c9a07a', '#8fa0b8'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = cols[i % 4];
      g.beginPath();
      const x = 40 + srnd() * 300, y = 80 + srnd() * 180;
      g.moveTo(x, y);
      g.lineTo(x + 30 + srnd() * 60, y + (srnd() - 0.5) * 50);
      g.lineTo(x + (srnd() - 0.5) * 60, y + 30 + srnd() * 50);
      g.closePath(); g.fill();
    }
    // 矿脉线
    g.strokeStyle = '#c0392b'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(60, 280); g.bezierCurveTo(120, 200, 220, 240, 330, 110); g.stroke();
    g.strokeStyle = '#2b6ca8'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(80, 120); g.bezierCurveTo(180, 160, 240, 100, 330, 200); g.stroke();
    g.fillStyle = '#c0392b'; g.beginPath(); g.arc(330, 110, 8, 0, 6.3); g.fill();
    g.fillStyle = '#2b6ca8'; g.beginPath(); g.arc(330, 200, 8, 0, 6.3); g.fill();
    // 价目表
    g.fillStyle = '#e8dcc0'; g.fillRect(390, 28, 222, 250);
    g.fillStyle = '#3a2a18'; g.font = '700 26px "Microsoft YaHei",sans-serif'; g.textAlign = 'center';
    g.fillText('龙晶收购价', 501, 62);
    g.font = '400 20px "Microsoft YaHei",sans-serif'; g.textAlign = 'left';
    const rows = [['冰火交融龙晶', '★★★★'], ['幽蓝冰晶', '★★★'], ['火耀石', '★★'], ['普通矿石', '★']];
    rows.forEach((r, i) => {
      g.fillStyle = '#3a2a18'; g.fillText(r[0], 402, 100 + i * 42);
      g.fillStyle = '#b8860b'; g.fillText(r[1], 520, 100 + i * 42);
      g.strokeStyle = '#b0a080'; g.beginPath(); g.moveTo(398, 112 + i * 42); g.lineTo(600, 112 + i * 42); g.stroke();
    });
    // 便签
    for (let i = 0; i < 4; i++) {
      g.save();
      g.translate(60 + i * 80, 320 + (i % 2) * 40);
      g.rotate((srnd() - 0.5) * 0.2);
      g.fillStyle = ['#f4e8c0', '#e8f0d8', '#f4e0d8', '#e0e8f4'][i];
      g.fillRect(0, 0, 66, 76);
      g.fillStyle = '#5a4a3a'; g.font = '400 11px "Microsoft YaHei",sans-serif';
      for (let k = 0; k < 4; k++) g.fillRect(6, 12 + k * 12, 50 - srnd() * 20, 3);
      g.restore();
    }
    g.fillStyle = '#f4e8c0'; g.fillRect(390, 300, 222, 120);
    g.fillStyle = '#8a2a1a'; g.font = '700 30px "Microsoft YaHei",sans-serif'; g.textAlign = 'center';
    g.fillText('招募：矿道护卫', 501, 342);
    g.fillStyle = '#3a2a18'; g.font = '400 18px "Microsoft YaHei",sans-serif';
    g.fillText('有意者至柜台登记', 501, 376);
    g.fillText('待遇：包食宿 + 矿石分红', 501, 402);
  });
  const g = G(stG);
  g.position.set(1.42, SY, -3.3);
  g.rotation.y = Math.PI / 2;
  C(0.04, 0.05, 2.0, 6, tm(0x4a3526), -0.45, 0, 0, g, true);
  C(0.04, 0.05, 2.0, 6, tm(0x4a3526), 0.45, 0, 0, g, true);
  B(1.06, 0.78, 0.05, tm(0x5a4230), 0, 0.95, 0, g, true);
  const face = Plane(1.0, 0.72, new THREE.MeshBasicMaterial({ map: tex }), 0, 1.34, 0.038, g);
  face.renderOrder = 2;
  // 小屋顶
  const roof = B(1.16, 0.05, 0.24, tm(0x3a4149), 0, 1.73, 0.04, g, true);
  roof.rotation.x = -0.22;
  B(1.16, 0.04, 0.14, MAT_SNOW, 0, 1.78, 0.06, g, false);
  // 钉在上面的矿石样本
  for (let i = 0; i < 3; i++) S(0.035, 5, em([0x9fe8ff, 0xffa050, 0xc07bff][i], 1.3, 0x101018), -0.35 + i * 0.35, 1.62, 0.06, g, false);
}

/* ---------- 轨道矿车 ---------- */
{
  const g = G(stG);
  g.position.set(4.05, 0.06, -1.25);
  g.rotation.y = 0.02;
  // 车斗
  B(0.72, 0.42, 0.56, tm(0x4a5058), 0, 0.06, 0, g, true);
  B(0.76, 0.06, 0.6, tm(PAL.ironLite), 0, 0.46, 0, g, true);
  // 侧板加强筋
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) B(0.03, 0.4, 0.03, tm(0x2f353d), -0.24 + i * 0.24, 0.08, s * 0.29, g, false);
  }
  // 轮
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = C(0.1, 0.1, 0.06, 10, tm(0x2a2f38), sx * 0.28, 0.0, sz * 0.2, g, true);
    w.rotation.z = Math.PI / 2;
    const hub = C(0.04, 0.04, 0.07, 8, tm(PAL.brass), sx * 0.28, 0.03, sz * 0.2, g, false);
    hub.rotation.z = Math.PI / 2;
  }
  // 装载：冰晶 + 火耀石
  for (let i = 0; i < 9; i++) {
    const x = rnd(-0.26, 0.26), z = rnd(-0.18, 0.18);
    if (i < 5) {
      dualCrystal(rnd(0.05, 0.09), rnd(0.18, 0.4), x, 0.44, z, g, rnd(-0.3, 0.3), rnd(-0.3, 0.3));
    } else {
      const m = rock(rnd(0.07, 0.12), em(PAL.lava, 1.6, 0x3a1004), x, 0.5, z, g, 0.3);
    }
  }
  // 挂在车边的小灯
  C(0.05, 0.07, 0.12, 6, em(0xffb060, 1.5, 0x2a1608), 0.36, 0.3, 0.3, g, true);
  glowSprite(0xffa050, 0.7, 0.5, 0.36, 0.36, 0.3, g);
  // 车头编号牌
  const t = canvasTex(256, 128, (gg, w, h) => {
    gg.fillStyle = '#c8a020'; gg.fillRect(0, 0, w, h);
    gg.fillStyle = '#1a1a1a'; gg.font = '700 64px "Microsoft YaHei",sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText('07', w / 2, h / 2);
  });
  Plane(0.22, 0.11, new THREE.MeshBasicMaterial({ map: t }), 0, 0.28, 0.29, g);
}

/* ---------- 发条钻探机 ---------- */
{
  const g = G(stG);
  g.position.set(3.05, 0.02, -0.15);
  g.rotation.y = -0.9;
  // 履带
  for (const s of [-1, 1]) {
    B(0.62, 0.14, 0.12, tm(0x1f2328), 0, 0, s * 0.2, g, true);
    for (let i = 0; i < 4; i++) C(0.05, 0.05, 0.13, 8, tm(0x3a4149), -0.2 + i * 0.14, 0.02, s * 0.2, g, false).rotation.z = Math.PI / 2;
  }
  B(0.5, 0.34, 0.34, tm(0x6a4a30), 0, 0.14, 0, g, true);
  B(0.44, 0.06, 0.3, tm(PAL.ironLite), 0, 0.48, 0, g, true);
  // 钻头
  const drill = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), tm(0x9aa4b0));
  drill.position.set(0.42, 0.32, 0);
  drill.rotation.z = -Math.PI / 2;
  drill.castShadow = true; drill.userData.outline = true;
  g.add(drill);
  C(0.11, 0.11, 0.1, 8, tm(PAL.ironLite), 0.3, 0.27, 0, g, true).rotation.z = Math.PI / 2;
  // 发条
  const key = C(0.09, 0.09, 0.03, 8, tm(PAL.brass), -0.24, 0.5, 0.18, g, true);
  key.rotation.x = Math.PI / 2;
  beam([-0.24, 0.5, 0.2], [-0.24, 0.62, 0.2], 0.012, tm(PAL.brass), g, 4);
  beam([-0.24, 0.62, 0.2], [-0.16, 0.68, 0.2], 0.012, tm(PAL.brass), g, 4);
  // 排气管 + 小灯
  C(0.03, 0.035, 0.3, 6, tm(0x2f353d), -0.1, 0.48, -0.1, g, true);
  S(0.04, 6, em(0xffc070, 1.4, 0x2a1a08), 0.2, 0.5, 0.14, g, false);
  glowSprite(0xffb060, 0.6, 0.4, 0.2, 0.52, 0.14, g);
}

/* ---------- 巨型蒸汽矿石筛选外机 ---------- */
{
  const g = G(stG);
  g.position.set(4.72, 0, -2.8);
  B(0.72, 1.3, 1.15, tm(0x4a5058), 0, 0, 0, g, true);
  B(0.78, 0.09, 1.21, tm(0x3a4149), 0, 1.3, 0, g, true);
  // 底座
  B(0.82, 0.16, 1.25, tm(0x2f353d), 0, 0, 0, g, true);
  // 旋转筛筒
  const drum = C(0.3, 0.3, 0.62, 12, tm(0x6a727e), 0.42, 0.42, 0, g, true);
  drum.rotation.z = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.02, 4, 12), tm(0x2f353d));
    r.position.set(0.16 + i * 0.09, 0.42, 0);
    r.rotation.y = Math.PI / 2;
    g.add(r);
  }
  C(0.1, 0.1, 0.06, 8, tm(PAL.ironLite), 0.76, 0.39, 0, g, true).rotation.z = Math.PI / 2;
  // 进料斗
  const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.32, 4, 1, true), tm(0x3a4149, { side: THREE.DoubleSide }));
  hop.position.set(-0.02, 1.5, -0.3);
  hop.rotation.y = Math.PI / 4;
  hop.castShadow = true; hop.userData.outline = true;
  g.add(hop);
  for (let i = 0; i < 5; i++) rock(rnd(0.045, 0.075), em(PAL.lava, 1.3, 0x3a1004), -0.02 + rnd(-0.12, 0.12), 1.55, -0.3 + rnd(-0.12, 0.12), g, 0.3);
  // 烟囱
  C(0.075, 0.095, 0.7, 8, tm(0x2f353d), -0.22, 1.35, 0.34, g, true);
  C(0.11, 0.11, 0.05, 8, tm(PAL.ironLite), -0.22, 2.05, 0.34, g, true);
  // 管道
  beam([0.05, 1.05, 0.5], [0.05, 1.05, 0.72], 0.03, tm(PAL.copper), g, 6);
  beam([0.05, 1.05, 0.72], [0.05, 0.42, 0.72], 0.03, tm(PAL.copper), g, 6);
  beam([-0.34, 0.8, -0.55], [-0.34, 1.35, -0.55], 0.025, tm(PAL.copper), g, 6);
  // 结霜（左侧）
  for (let i = 0; i < 9; i++) {
    B(rnd(0.08, 0.22), rnd(0.02, 0.07), rnd(0.08, 0.22), tm(0xcfeaff, { emissive: 0x2a7ba8, emissiveIntensity: 0.6 }), -0.37, rnd(0.1, 1.2), rnd(-0.5, 0.5), g, false);
  }
  // 排热（右侧）
  for (let i = 0; i < 4; i++) {
    B(0.025, rnd(0.15, 0.4), 0.05, em(PAL.lava, 1.5, 0x3a0e04), 0.37, rnd(0.2, 1.0), rnd(-0.45, 0.45), g, false);
  }
  // 控制面板
  B(0.02, 0.26, 0.28, tm(0x1c2733), 0.37, 0.85, 0.42, g, false);
  for (let i = 0; i < 3; i++) S(0.016, 5, em([0x6fffd0, 0xffc070, 0x6fd8ff][i], 1.5, 0x0a1018), 0.383, 1.0 - i * 0.06, 0.36 + i * 0.05, g, false);
  // 梯子
  for (let i = 0; i < 5; i++) B(0.3, 0.025, 0.025, tm(PAL.ironLite), 0, 0.2 + i * 0.24, 0.6, g, false);
  FX.steam.push({ x: 4.5, y: 2.1, z: -2.46, n: 10, spread: 0.18, up: 0.45, color: 0xffe8d8 });
  FX.steam.push({ x: 4.72, y: 1.5, z: -2.5, n: 5, spread: 0.26, up: 0.3, color: 0xdff4ff });
}

/* ---------- 矿洞入口 ---------- */
{
  const g = G(stG);
  g.position.set(4.0, 0, -5.0);
  // 洞内黑暗
  const dark = B(2.0, 2.2, 0.5, tm(0x070a0e), 0, 0, -0.1, g, false);
  const mouth = Plane(1.7, 1.9, new THREE.MeshBasicMaterial({ color: 0x060a10 }), 0, 0.95, 0.16, g);
  // 岩石拱
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (i / 13);
    const x = -Math.cos(a) * 1.05;
    const y = Math.sin(a) * 1.25;
    rock(rnd(0.3, 0.5), tm(pick([0x39424e, 0x2e363f, 0x434c58])), x, y, 0.1 + rnd(-0.05, 0.1), g, 0.32);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      rock(rnd(0.35, 0.55), tm(pick([0x39424e, 0x2e363f])), s * (1.0 + rnd(-0.1, 0.15)), i * 0.42, 0.1, g, 0.3);
    }
  }
  // 洞口木支撑
  for (const s of [-1, 1]) {
    B(0.14, 1.8, 0.14, tm(0x4a3526), s * 0.86, 0, 0.28, g, true);
  }
  B(1.9, 0.14, 0.18, tm(0x4a3526), 0, 1.75, 0.28, g, true);
  beam([-0.86, 1.5, 0.28], [0, 1.9, 0.28], 0.05, tm(0x4a3526), g, 5);
  beam([0.86, 1.5, 0.28], [0, 1.9, 0.28], 0.05, tm(0x4a3526), g, 5);
  // 洞内铁轨微光
  for (let i = 0; i < 4; i++) {
    S(0.05, 5, em(PAL.lava, 1.4, 0x3a0e04), rnd(-0.5, 0.5), 0.15, -0.2 - i * 0.05, g, false);
  }
  // 悬挂信号灯
  C(0.012, 0.012, 0.3, 4, tm(0x1a1d22), 0, 1.9, 0.4, g, false);
  S(0.07, 6, em(0xff6a3a, 1.8, 0x1a0804), 0, 1.86, 0.4, g, false);
  glowSprite(0xff6a3a, 0.9, 0.6, 0, 1.86, 0.45, g);
  // 落石警示
  const tex = canvasTex(320, 160, (gg, w, h) => {
    gg.fillStyle = '#c8a020'; gg.fillRect(0, 0, w, h);
    gg.fillStyle = '#1a1a1a'; gg.font = '700 40px "Microsoft YaHei",sans-serif'; gg.textAlign = 'center';
    gg.fillText('注意落石', w / 2, 62);
    gg.font = '600 28px "Microsoft YaHei",sans-serif';
    gg.fillText('矿道 07 · 冰火核心区', w / 2, 112);
  });
  const p = Plane(0.5, 0.25, new THREE.MeshBasicMaterial({ map: tex }), 0, 1.6, 0.4, g);
  // 洞口积雪
  for (let i = 0; i < 8; i++) {
    const s = S(rnd(0.1, 0.22), 6, MAT_SNOW, rnd(-1.2, 1.2), 0.05, rnd(0.3, 0.5), g);
    s.scale.y = 0.4;
  }
}

/* ---------- 重型采矿陆行鸟停靠位 ---------- */
{
  const g = G(stG);
  g.position.set(-2.25, 0, 4.55);
  // 围栏
  for (const [x, z] of [[-0.55, -0.5], [0.55, -0.5], [-0.55, 0.55], [0.55, 0.55]]) {
    C(0.06, 0.075, 0.95, 6, tm(0x4a3526), x, 0, z, g, true);
    C(0.07, 0.09, 0.05, 6, tm(PAL.ironLite), x, 0.95, z, g, true);
  }
  beam([-0.55, 0.8, -0.5], [0.55, 0.8, -0.5], 0.035, tm(0x4a3526), g);
  beam([-0.55, 0.8, 0.55], [0.55, 0.8, 0.55], 0.035, tm(0x4a3526), g);
  beam([-0.55, 0.8, -0.5], [-0.55, 0.8, 0.55], 0.035, tm(0x4a3526), g);
  // 水槽
  B(0.5, 0.24, 0.26, tm(0x4a5058), 0.0, 0, 0.35, g, true);
  const w = Plane(0.44, 0.2, new THREE.MeshBasicMaterial({ color: 0x2f7f9f, transparent: true, opacity: 0.85 }), 0, 0.2, 0.35, g);
  w.rotation.x = -Math.PI / 2;
  // 干草
  for (let i = 0; i < 7; i++) {
    const s = B(rnd(0.1, 0.2), 0.06, rnd(0.1, 0.2), tm(0xb89a50), rnd(-0.35, 0.35), 0.01, rnd(-0.35, 0.2), g, false);
    s.rotation.y = rnd(0, 3);
  }
  // 搭在栏杆上的毯子
  const bl = B(0.4, 0.3, 0.06, tm(0x8a3a3a), 0.1, 0.55, 0.56, g, true);
  bl.rotation.x = 0.1;
  // 牌
  const tex = canvasTex(512, 200, (gg, w, h) => {
    gg.fillStyle = '#1f3a4a'; gg.fillRect(0, 0, w, h);
    gg.strokeStyle = '#e8c98a'; gg.lineWidth = 6; gg.strokeRect(6, 6, w - 12, h - 12);
    gg.fillStyle = '#f0e0c0'; gg.font = '700 46px "Microsoft YaHei",sans-serif'; gg.textAlign = 'center';
    gg.fillText('陆行鸟停靠位', w / 2, 74);
    gg.fillStyle = '#9fc8e0'; gg.font = '500 28px "Microsoft YaHei",sans-serif';
    gg.fillText('CH OCOBO PARKING · 07', w / 2, 126);
    gg.fillStyle = '#e8c98a'; gg.font = '500 22px "Microsoft YaHei",sans-serif';
    gg.fillText('请拴好缰绳 / 勿投喂矿石', w / 2, 166);
  });
  C(0.04, 0.05, 1.7, 6, tm(0x4a3526), 0, 0, -0.55, g, true);
  const board = B(0.66, 0.26, 0.04, tm(0x1f3a4a), 0, 1.15, -0.52, g, true);
  Plane(0.64, 0.24, new THREE.MeshBasicMaterial({ map: tex }), 0, 1.28, -0.492, g);
}

/* ---------- 木箱 / 桶 / 矿石堆 ---------- */
{
  const g = G(stG);
  g.position.set(2.35, SY, -0.25);
  for (let i = 0; i < 3; i++) {
    const b = B(0.34, 0.34, 0.34, tm(0x6b4a2e), 0, i * 0.35, 0, g, true);
    b.rotation.y = rnd(-0.2, 0.2);
    // 箱板
    B(0.36, 0.04, 0.36, tm(0x4a3018), 0, i * 0.35 + 0.15, 0, g, false);
    B(0.36, 0.04, 0.36, tm(0x4a3018), 0, i * 0.35 + 0.02, 0, g, false);
  }
  const bar = C(0.16, 0.18, 0.4, 10, tm(0x5a3a26), 0.42, 0, 0.18, g, true);
  for (let i = 0; i < 3; i++) C(0.165, 0.165, 0.03, 10, tm(0x2f353d), 0.42, 0.08 + i * 0.13, 0.18, g, false);
  // 矿石堆
  for (let i = 0; i < 8; i++) {
    rock(rnd(0.06, 0.12), srnd() > 0.5 ? em(PAL.ice, 0.9, 0x0a2030) : em(PAL.lava, 1.2, 0x2a0a02), rnd(-0.5, 0.1), 0.03, rnd(0.2, 0.6), g, 0.3);
  }
}


/* ---------- 矿石装卸场（前景右角） ---------- */
{
  const g = G(stG);
  g.position.set(4.2, 0, 3.5);
  // 木平台
  B(1.9, 0.4, 1.9, tm(0x5a3d26), 0, 0, 0, g, true);
  for (let i = 0; i < 8; i++) B(1.88, 0.05, 0.2, tm(0x7a5236), 0, 0.4, -0.82 + i * 0.235, g, false);
  // 边缘护木
  B(1.94, 0.09, 0.08, tm(0x3f2a1a), 0, 0.44, 0.94, g, true);
  B(0.08, 0.09, 1.94, tm(0x3f2a1a), 0.94, 0.44, 0, g, true);
  // 台阶
  B(0.9, 0.14, 0.34, tm(0x5a3d26), -0.5, 0, 1.08, g, true);
  B(0.9, 0.28, 0.18, tm(0x5a3d26), -0.5, 0, 0.94, g, true);
  // 台面积雪
  for (let i = 0; i < 7; i++) {
    const sn = B(rnd(0.2, 0.6), 0.05, rnd(0.15, 0.4), MAT_SNOW, rnd(-0.8, 0.8), 0.45, rnd(-0.85, 0.85), g, false);
    sn.rotation.y = rnd(0, 3);
  }
  // 矿袋
  for (let i = 0; i < 5; i++) {
    const sack = S(0.16, 6, tm(0x8a7a5a), -0.55 + (i % 3) * 0.32, 0.56, -0.5 + Math.floor(i / 3) * 0.3, g, true);
    sack.scale.set(1, 0.85, 0.9);
    B(0.1, 0.04, 0.1, tm(0x5a4a32), -0.55 + (i % 3) * 0.32, 0.68, -0.5 + Math.floor(i / 3) * 0.3, g, false);
  }
  // 矿石堆
  for (let i = 0; i < 9; i++) {
    rock(rnd(0.07, 0.13), srnd() > 0.45 ? em(PAL.lava, 1.2, 0x2a0a02) : em(PAL.ice, 1.0, 0x0a2030),
      rnd(-0.3, 0.4), 0.5, rnd(-0.9, -0.4), g, 0.3);
  }
  // 吊装门架
  for (const sx of [-0.78, 0.78]) {
    C(0.055, 0.07, 1.85, 6, tm(0x4a3526), sx, 0.4, -0.72, g, true);
    beam([sx, 1.2, -0.72], [sx, 1.9, -0.3], 0.035, tm(0x4a3526), g, 5);
  }
  beam([-0.85, 2.22, -0.72], [0.85, 2.22, -0.72], 0.05, tm(0x4a3526), g, 6);
  beam([0, 2.22, -0.72], [0, 2.22, 0.2], 0.045, tm(0x4a3526), g, 6);
  // 滑轮与吊索
  C(0.07, 0.07, 0.05, 8, tm(PAL.ironLite), 0, 2.16, 0.2, g, true).rotation.x = Math.PI / 2;
  beam([0, 2.16, 0.2], [0, 1.35, 0.2], 0.012, tm(0x1a1a1e), g, 4);
  // 吊篮
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.2, 6, 1, true), tm(0x3a4149, { side: THREE.DoubleSide }));
  bucket.position.set(0, 1.24, 0.2);
  bucket.castShadow = true; bucket.userData.outline = true;
  g.add(bucket);
  for (let i = 0; i < 4; i++) S(0.045, 5, em(PAL.ice, 1.2, 0x0a2030), rnd(-0.08, 0.08), 1.32, 0.2 + rnd(-0.08, 0.08), g, false);
  // 台面小灯
  C(0.045, 0.06, 0.12, 6, em(0xffb060, 1.5, 0x2a1608), 0.8, 0.95, 0.7, g, true);
  glowSprite(0xffa050, 0.75, 0.45, 0.8, 1.01, 0.7, g);
  // 告示牌
  const tex = canvasTex(256, 160, (gg, w, h) => {
    gg.fillStyle = '#243444'; gg.fillRect(0, 0, w, h);
    gg.strokeStyle = '#c08a45'; gg.lineWidth = 5; gg.strokeRect(5, 5, w - 10, h - 10);
    gg.fillStyle = '#e8d8b0'; gg.font = '700 34px "Microsoft YaHei",sans-serif'; gg.textAlign = 'center';
    gg.fillText('矿石装卸区', w / 2, 62);
    gg.fillStyle = '#9fc8e0'; gg.font = '500 22px "Microsoft YaHei",sans-serif';
    gg.fillText('装车 · 分拣 · 过磅', w / 2, 104);
    gg.fillText('闲人免进', w / 2, 136);
  });
  C(0.03, 0.04, 0.9, 5, tm(0x4a3526), 0.86, 0.4, -0.9, g, true);
  const bd = B(0.34, 0.22, 0.03, tm(0x243444), 0.86, 1.02, -0.9, g, true);
  Plane(0.32, 0.2, new THREE.MeshBasicMaterial({ map: tex }), 0.86, 1.13, -0.874, g);
}

/* ---------- 街口杂物 ---------- */
{
  const g = G(stG);
  g.position.set(1.05, 0, 4.75);
  for (let i = 0; i < 2; i++) {
    const b = B(0.32, 0.32, 0.32, tm(0x6b4a2e), i * 0.34, i === 0 ? 0 : 0.32, 0, g, true);
    b.rotation.y = rnd(-0.2, 0.2);
  }
  C(0.14, 0.16, 0.36, 8, tm(0x4a5058), 0.72, 0, 0.1, g, true);
  for (let i = 0; i < 3; i++) C(0.145, 0.145, 0.025, 8, tm(0x2f353d), 0.72, 0.08 + i * 0.11, 0.1, g, false);
  // 雪堆
  for (let i = 0; i < 5; i++) {
    const s = S(rnd(0.18, 0.4), 7, MAT_SNOW, rnd(-0.6, 0.9), 0.02, rnd(-0.4, 0.5), g);
    s.scale.y = 0.35;
  }
}

/* ---------- 墙上的管道与冰凌细节 ---------- */
{
  // 右侧外墙的排水管
  const g = G(stG);
  beam([1.36, 2.3, -0.72], [1.36, 0.1, -0.72], 0.035, tm(0x4a5058), g, 6);
  beam([1.36, 2.3, -0.72], [1.3, 2.3, -0.72], 0.035, tm(0x4a5058), g, 6);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 4, 8), tm(PAL.ironLite));
    t.position.set(1.36, 0.4 + i * 0.55, -0.72);
    t.rotation.x = Math.PI / 2;
    g.add(t);
  }
  // 屋檐滴水位置标记（FX 用）
  FX.dripPoints = [];
  for (let i = 0; i < 7; i++) {
    FX.dripPoints.push(new THREE.Vector3(-2.7 + i * 0.62, 2.18, FZ + 0.9));
  }
}
