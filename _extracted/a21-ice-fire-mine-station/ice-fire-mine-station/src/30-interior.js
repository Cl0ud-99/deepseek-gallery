/* ============================================================
   30 · INTERIOR — 矿石鉴定所 × 旅人休息站
   ============================================================ */
const inG = G();
const IFLOOR = 0.16;
const IX0 = -2.74, IX1 = 1.14, IZ0 = -3.74, IZ1 = -0.68;

/* ---------- 地板 ---------- */
{
  const f = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0), tm(0x6a4630, { map: woodTex2 }));
  f.rotation.x = -Math.PI / 2;
  f.position.set((IX0 + IX1) / 2, IFLOOR, (IZ0 + IZ1) / 2);
  f.receiveShadow = true;
  inG.add(f);
  // 地板铁轨纹样
  for (const off of [-0.24, 0.24]) {
    B(0.05, 0.02, 2.6, tm(0x3a3f48), -0.4 + off, IFLOOR, -2.3, inG, false);
    B(0.012, 0.025, 2.6, em(0x59d8ff, 1.2, 0x0a1a22), -0.4 + off + 0.032, IFLOOR, -2.3, inG, false);
  }
  for (let i = 0; i < 5; i++) {
    const z = -1.1 - i * 0.5;
    B(0.42, 0.02, 0.05, tm(0x3a3f48), -0.4, IFLOOR + 0.005, z, inG, false);
  }
  // 荧光导视箭头
  for (let i = 0; i < 4; i++) {
    const z = -1.35 - i * 0.55;
    const a = B(0.18, 0.012, 0.03, em(0x6fe0ff, 1.5, 0x081820), -0.4, IFLOOR + 0.008, z, inG, false);
    a.rotation.y = 0;
    const l = B(0.06, 0.012, 0.13, em(0x6fe0ff, 1.5, 0x081820), -0.46, IFLOOR + 0.008, z - 0.07, inG, false);
    l.rotation.y = 0.7;
    const r = B(0.06, 0.012, 0.13, em(0x6fe0ff, 1.5, 0x081820), -0.34, IFLOOR + 0.008, z - 0.07, inG, false);
    r.rotation.y = -0.7;
  }
}

/* ---------- 天花板与横梁 ---------- */
{
  const c = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0), tm(0x3f2a1c, { map: woodTex }));
  c.rotation.x = Math.PI / 2;
  c.position.set((IX0 + IX1) / 2, 2.44, (IZ0 + IZ1) / 2);
  inG.add(c);
  for (let i = 0; i < 4; i++) {
    B(IX1 - IX0, 0.1, 0.12, tm(0x4d3122), (IX0 + IX1) / 2, 2.36, IZ0 + 0.4 + i * 0.85, inG, true);
  }
  B(0.12, 0.12, IZ1 - IZ0, tm(0x4d3122), -1.6, 2.32, (IZ0 + IZ1) / 2, inG, true);
}

/* ---------- 后墙：标本货架 ---------- */
{
  const sx = -2.05, sz = -3.6;
  B(1.85, 2.3, 0.12, tm(0x3f2a1c), sx, IFLOOR, sz + 0.12, inG, true);
  B(1.95, 0.1, 0.42, tm(0x5a3a26), sx, IFLOOR + 2.22, sz + 0.28, inG, true);
  const cols = [0x8ce0ff, 0xff8a3a, 0xb06bff, 0x6fffd0, 0xffd070];
  for (let t = 0; t < 4; t++) {
    const y = IFLOOR + 0.28 + t * 0.5;
    B(1.85, 0.05, 0.4, tm(0x5a3a26), sx, y, sz + 0.26, inG, true);
    // 支架
    for (const xx of [-0.85, 0, 0.85]) B(0.05, 0.2, 0.34, tm(PAL.iron), sx + xx, y - 0.2, sz + 0.26, inG, false);
    // 标本
    for (let i = 0; i < 7; i++) {
      const xx = sx - 0.8 + i * 0.27 + rnd(-0.03, 0.03);
      const cc = cols[(t + i) % cols.length];
      const h = rnd(0.1, 0.2);
      if (srnd() > 0.45) {
        C(rnd(0.035, 0.06), rnd(0.045, 0.07), h, 5, em(cc, 1.5, 0x0c1018), xx, y + 0.05, sz + 0.26, inG, true);
      } else {
        const s = S(rnd(0.05, 0.075), 5, em(cc, 1.4, 0x0c1018), xx, y + 0.1, sz + 0.26, inG, false);
        s.scale.y = 0.8;
      }
      // 标签牌
      B(0.11, 0.05, 0.012, tm(0xd8d2c0), xx, y + 0.055, sz + 0.45, inG, false);
    }
  }
  // 货架顶部的矿石箱
  B(0.4, 0.26, 0.3, tm(0x5a3a26), -2.6, IFLOOR + 2.32, sz + 0.24, inG, true);
  B(0.3, 0.18, 0.22, tm(0x5a3a26), -2.1, IFLOOR + 2.32, sz + 0.24, inG, true);
}

/* ---------- 后墙：宣传海报 + 矿脉灯箱 ---------- */
{
  const poster = canvasTex(512, 700, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2a1b3f'); grd.addColorStop(0.55, '#3d2350'); grd.addColorStop(1, '#1a1024');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a3ff'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
    // 龙晶
    g.save(); g.translate(w / 2, h * 0.36);
    const cg = g.createLinearGradient(0, -140, 0, 140);
    cg.addColorStop(0, '#ffe6a0'); cg.addColorStop(0.45, '#c07bff'); cg.addColorStop(1, '#5fd8ff');
    g.fillStyle = cg;
    g.beginPath(); g.moveTo(0, -150); g.lineTo(70, -20); g.lineTo(40, 130); g.lineTo(-40, 130); g.lineTo(-70, -20); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -150); g.lineTo(0, 130); g.stroke();
    g.restore();
    // 光芒
    g.strokeStyle = 'rgba(200,160,255,0.5)'; g.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.28;
      g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 120, h * 0.36 + Math.sin(a) * 120);
      g.lineTo(w / 2 + Math.cos(a) * 170, h * 0.36 + Math.sin(a) * 170); g.stroke();
    }
    g.fillStyle = '#f4e2ff';
    g.font = '700 52px "Microsoft YaHei","PingFang SC",sans-serif';
    g.textAlign = 'center';
    g.fillText('巨 型 龙 晶', w / 2, h * 0.68);
    g.fillText('发 现 纪 念', w / 2, h * 0.76);
    g.fillStyle = '#c9a3ff'; g.font = '500 26px "Microsoft YaHei",sans-serif';
    g.fillText('ICE-FIRE DRAGON CRYSTAL · No.001', w / 2, h * 0.85);
    g.fillStyle = '#8f7fb0'; g.font = '500 22px "Microsoft YaHei",sans-serif';
    g.fillText('寻矿者公会 第七支部', w / 2, h * 0.92);
  });
  const p = Plane(0.72, 0.98, new THREE.MeshBasicMaterial({ map: poster }), 0.05, 1.72, IZ0 + 0.037, inG);
  // 海报挂在后墙
  B(0.78, 1.04, 0.03, tm(0x2a2018), 0.05, 1.2, IZ0 + 0.01, inG, true);
  p.position.z = IZ0 + 0.035;
  p.position.y = 1.72;
  p.renderOrder = 2;

  // 矿脉截面灯箱
  const boxTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#07131c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${90 + srnd() * 120},${170 + srnd() * 80},255,${0.25 + srnd() * 0.6})`;
      g.lineWidth = 1 + srnd() * 3.4;
      g.beginPath();
      let x = srnd() * w, y = srnd() * h;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (srnd() - 0.5) * 130; y += (srnd() - 0.5) * 70; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(255,${140 + srnd() * 80},80,0.75)`;
      g.beginPath(); g.arc(srnd() * w, srnd() * h, 2 + srnd() * 5, 0, 6.3); g.fill();
    }
    g.strokeStyle = '#7fd8ff'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  });
  B(0.98, 0.5, 0.1, tm(0x1c2733), 0.05, 2.14, IZ0 + 0.06, inG, true);
  const bl = Plane(0.9, 0.42, new THREE.MeshBasicMaterial({ map: boxTex }), 0.05, 2.39, IZ0 + 0.12, inG);
  bl.renderOrder = 2;
}

/* ---------- 后墙：冷热柜 + 铁门 ---------- */
{
  // 冷热饮料柜
  const cx = -0.72, cz = -3.5;
  B(0.72, 1.95, 0.42, tm(0x2a2f38), cx, IFLOOR, cz, inG, true);
  const gt = glassMatSide;
  const g1 = Plane(0.62, 1.7, gt, cx, IFLOOR + 1.02, cz + 0.215, inG);
  g1.renderOrder = 6;
  B(0.72, 0.08, 0.46, tm(0x3a414c), cx, IFLOOR + 1.95, cz, inG, true);
  // 分层与饮料
  for (let t = 0; t < 4; t++) {
    const y = IFLOOR + 0.3 + t * 0.42;
    B(0.62, 0.03, 0.34, tm(0x4a5260), cx, y, cz, inG, false);
    for (let i = 0; i < 7; i++) {
      const warm = t < 2;
      C(0.035, 0.035, 0.16, 6, em(warm ? 0xffa050 : 0x60c8ff, 1.1, 0x101820), cx - 0.26 + i * 0.085, y + 0.03, cz + 0.02, inG, false);
    }
  }
  // 冷热标签
  B(0.28, 0.08, 0.02, em(0xff8a3a, 1.3, 0x1a0e06), cx - 0.16, IFLOOR + 1.86, cz + 0.24, inG, false);
  B(0.28, 0.08, 0.02, em(0x5fc8ff, 1.3, 0x061420), cx + 0.16, IFLOOR + 1.86, cz + 0.24, inG, false);

  // 铆钉铁门（通往金库）
  const dx = 0.82, dz = IZ0 + 0.08;
  B(0.72, 1.9, 0.14, tm(0x333a44), dx, IFLOOR, dz, inG, true);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      S(0.016, 5, tm(PAL.ironLite), dx - 0.3 + i * 0.15, IFLOOR + 0.16 + j * 0.22, dz + 0.08, inG);
    }
  }
  B(0.1, 0.16, 0.06, tm(PAL.brass), dx + 0.24, IFLOOR + 0.95, dz + 0.1, inG, true);
  B(0.72, 0.1, 0.18, tm(0x262c34), dx, IFLOOR + 1.9, dz, inG, true);
}

/* ---------- 收银鉴定台 ---------- */
{
  const cg = G(inG);
  // L 形台面
  B(0.92, 0.95, 0.55, tm(0x7a4f33), 0.68, IFLOOR, -2.05, cg, true);
  B(0.98, 0.08, 0.62, tm(0x8a5c3b), 0.68, IFLOOR + 0.95, -2.05, cg, true);
  B(0.92, 0.95, 0.9, tm(0x7a4f33), 0.68, IFLOOR, -3.0, cg, true);
  B(0.98, 0.08, 0.96, tm(0x8a5c3b), 0.68, IFLOOR + 0.95, -3.0, cg, true);
  // 台面木板缝
  for (let i = 0; i < 6; i++) {
    B(0.9, 0.012, 0.01, tm(0x4a2f1e), 0.68, IFLOOR + 1.03, -3.4 + i * 0.28, cg, false);
  }
  // 鉴定放大镜（支架式）
  {
    const mg = G(cg);
    mg.position.set(0.45, IFLOOR + 1.03, -2.05);
    C(0.11, 0.13, 0.03, 10, tm(PAL.brass), 0, 0, 0, mg, true);
    beam([0, 0.03, 0], [0, 0.42, 0], 0.014, tm(PAL.brass), mg, 5);
    beam([0, 0.42, 0], [0.22, 0.46, 0.06], 0.012, tm(PAL.brass), mg, 5);
    const ring = C(0.1, 0.1, 0.03, 12, tm(PAL.brass), 0.24, 0.42, 0.06, mg, true);
    ring.rotation.x = Math.PI / 2;
    const lens = C(0.085, 0.085, 0.02, 12, new THREE.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.5 }), 0.24, 0.435, 0.06, mg, false);
    lens.rotation.x = Math.PI / 2;
    glowSprite(0x9fe0ff, 0.4, 0.35, 0.24, 0.44, 0.1, mg);
  }
  // 宝石秤
  {
    const sg = G(cg);
    sg.position.set(0.85, IFLOOR + 1.03, -2.45);
    C(0.13, 0.16, 0.03, 8, tm(PAL.brass), 0, 0, 0, sg, true);
    beam([0, 0.03, 0], [0, 0.3, 0], 0.012, tm(PAL.brass), sg, 5);
    B(0.34, 0.02, 0.05, tm(PAL.brass), 0, 0.3, 0, sg, true);
    for (const s of [-1, 1]) {
      C(0.05, 0.04, 0.02, 8, tm(PAL.brass), s * 0.16, 0.32, 0, sg, true);
      S(0.035, 5, em(0xffb060, 0.8, 0x201008), s * 0.16, 0.37, 0, sg, false);
    }
  }
  // 账本 + 羽毛笔
  B(0.28, 0.03, 0.22, tm(0xd8cdb4), 0.72, IFLOOR + 1.03, -2.78, cg, false).rotation.y = 0.18;
  B(0.28, 0.012, 0.22, tm(0x5a3a26), 0.72, IFLOOR + 1.06, -2.78, cg, false).rotation.y = 0.18;
  // 黄铜台灯
  {
    const lg = G(cg);
    lg.position.set(0.95, IFLOOR + 1.03, -3.15);
    C(0.09, 0.11, 0.03, 8, tm(PAL.brass), 0, 0, 0, lg, true);
    C(0.014, 0.014, 0.36, 5, tm(PAL.brass), 0, 0.03, 0, lg, false);
    const shade = C(0.11, 0.16, 0.14, 8, em(0xffc078, 1.5, 0x2a1a0a), 0, 0.36, 0, lg, true);
    glowSprite(0xffa858, 0.8, 0.5, 0, 0.42, 0, lg);
    const pl = new THREE.PointLight(0xffb070, 1.5, 1.9, 2);
    pl.position.set(0, 0.42, 0);
    lg.add(pl);
  }
  // 收银小抽屉 + 矿石盒
  B(0.22, 0.12, 0.18, tm(0x4a2f1e), 0.85, IFLOOR + 1.03, -1.92, cg, true);
  B(0.16, 0.1, 0.14, tm(0x5a3a26), 0.36, IFLOOR + 1.03, -2.42, cg, true);
  for (let i = 0; i < 3; i++) S(0.028, 5, em([0x9fe8ff, 0xffa050, 0xc07bff][i], 1.3, 0x101018), 0.36 + rnd(-0.04, 0.04), IFLOOR + 1.14, -2.42 + rnd(-0.04, 0.04), cg, false);
}

/* ---------- 蒸汽浓缩咖啡机 ---------- */
{
  const eg = G(inG);
  eg.position.set(0.55, IFLOOR + 1.03, -3.55);
  B(0.4, 0.42, 0.28, tm(0x6a4a30), 0, 0, 0, eg, true);
  B(0.34, 0.06, 0.24, tm(PAL.brass), 0, 0.42, 0, eg, true);
  C(0.05, 0.05, 0.14, 8, tm(PAL.brass), -0.1, 0.42, 0.02, eg, true);
  C(0.05, 0.05, 0.14, 8, tm(PAL.brass), 0.1, 0.42, 0.02, eg, true);
  // 压力表
  C(0.055, 0.055, 0.03, 10, tm(PAL.brass), 0.14, 0.2, 0.15, eg, true).rotation.x = Math.PI / 2;
  const dial = C(0.04, 0.04, 0.01, 10, em(0xffe0a0, 0.8, 0x2a2010), 0.14, 0.215, 0.17, eg, false);
  dial.rotation.x = Math.PI / 2;
  // 蒸汽管接熔岩余热
  beam([0.2, 0.4, 0], [0.34, 0.9, -0.1], 0.022, tm(PAL.copper), eg, 5);
  beam([0.34, 0.9, -0.1], [0.34, 1.3, -0.1], 0.022, tm(PAL.copper), eg, 5);
  glowSprite(0xffa050, 0.5, 0.35, 0, 0.5, 0.1, eg);
  FX.steam.push({ x: 0.55, y: IFLOOR + 1.5, z: -3.5, n: 6, spread: 0.12, up: 0.22, color: 0xffe8d0, small: true });
}

/* ---------- 冷热柜台：大锅关东煮 / 热汤 ---------- */
{
  const og = G(inG);
  og.position.set(-2.5, IFLOOR, -2.3);
  B(0.46, 0.9, 1.15, tm(0x6b452d), 0, 0, 0, og, true);
  B(0.52, 0.07, 1.22, tm(0x8a5c3b), 0, 0.9, 0, og, true);
  // 大锅
  const pot = C(0.24, 0.2, 0.26, 12, tm(0x4a4f58), 0, 0.97, -0.22, og, true);
  C(0.26, 0.24, 0.05, 12, tm(PAL.ironLite), 0, 1.23, -0.22, og, true);
  const soup = C(0.22, 0.22, 0.02, 12, em(0xffa040, 1.0, 0x3a1a04), 0, 1.23, -0.22, og, false);
  // 关东煮串
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.28;
    const s = C(0.015, 0.015, 0.3, 4, tm(0xd8c8a0), Math.cos(a) * 0.11, 1.2, -0.22 + Math.sin(a) * 0.11, og, false);
    s.rotation.z = rnd(-0.15, 0.15);
    S(0.045, 6, tm(pick([0xd8a050, 0xc87840, 0xe8c890])), Math.cos(a) * 0.11, 1.42, -0.22 + Math.sin(a) * 0.11, og);
  }
  glowSprite(0xff9040, 0.8, 0.4, 0, 1.35, -0.22, og);
  FX.steam.push({ x: -2.5, y: IFLOOR + 1.35, z: -2.52, n: 10, spread: 0.2, up: 0.3, color: 0xffe0c0, small: true });
  // 汤桶
  C(0.15, 0.13, 0.22, 10, tm(0x5a5f6a), 0.02, 0.97, 0.28, og, true);
  C(0.16, 0.14, 0.03, 10, tm(PAL.ironLite), 0.02, 1.19, 0.28, og, true);
  // 碗堆
  for (let i = 0; i < 4; i++) {
    const b = C(0.075, 0.06, 0.04, 8, tm(0xe8dcc0), -0.02, 0.97 + i * 0.042, 0.5, og, false);
  }
  // 价目小黑板
  const bb = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7a5a38'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#f0e0c0'; g.font = '600 34px "Microsoft YaHei",sans-serif'; g.textAlign = 'center';
    g.fillText('今日热汤', w / 2, 56);
    g.font = '400 26px "Microsoft YaHei",sans-serif'; g.fillStyle = '#ffd08a';
    g.fillText('关东煮  12', w / 2, 116);
    g.fillText('姜茶    8', w / 2, 158);
    g.fillText('炖菜    15', w / 2, 200);
    g.fillStyle = '#8fd8ff'; g.font = '400 20px "Microsoft YaHei",sans-serif';
    g.fillText('冰镇麦酒 10', w / 2, 236);
  });
  const p = Plane(0.34, 0.34, new THREE.MeshBasicMaterial({ map: bb }), 0.24, 1.28, 0.1, og);
  p.rotation.y = Math.PI / 2;
}

/* ---------- 便当 / 饭团陈列柜 ---------- */
{
  const bg = G(inG);
  bg.position.set(-1.72, IFLOOR, -0.98);
  B(0.85, 0.62, 0.42, tm(0x6b452d), 0, 0, 0, bg, true);
  B(0.9, 0.06, 0.46, tm(0x8a5c3b), 0, 0.62, 0, bg, true);
  // 玻璃罩
  const glass = B(0.84, 0.42, 0.4, glassMatSide, 0, 0.68, 0, bg, false);
  glass.renderOrder = 6;
  B(0.88, 0.04, 0.44, tm(PAL.brass), 0, 1.1, 0, bg, true);
  // 饭团
  for (let i = 0; i < 6; i++) {
    const s = S(0.055, 6, tm(0xf4f0e0), -0.3 + (i % 3) * 0.2, 0.72, -0.08 + Math.floor(i / 3) * 0.16, bg);
    s.scale.set(1, 0.8, 0.9);
    B(0.05, 0.03, 0.04, tm(0x1a2a20), -0.3 + (i % 3) * 0.2, 0.745, -0.08 + Math.floor(i / 3) * 0.16, bg, false);
  }
  // 炖菜托盘
  B(0.34, 0.05, 0.24, tm(0x9a6a40), 0.22, 0.7, 0.02, bg, false);
  B(0.3, 0.02, 0.2, em(0xc06a2a, 0.5, 0x2a1408), 0.22, 0.75, 0.02, bg, false);
  // 岩石巧克力 / 结晶冰糖罐
  for (let i = 0; i < 3; i++) {
    const j = C(0.07, 0.065, 0.16, 8, glassMatSide, -0.32 + i * 0.16, 0.68, 0.28, bg, false);
    j.renderOrder = 6;
    for (let k = 0; k < 5; k++) {
      S(0.022, 4, em([0x8a5a3a, 0x9fe8ff, 0xffc070][i], 0.9, 0x1a1210), -0.32 + i * 0.16 + rnd(-0.03, 0.03), 0.71 + rnd(0, 0.1), 0.28 + rnd(-0.03, 0.03), bg, false);
    }
  }
  B(0.3, 0.04, 0.02, tm(0xd8d2c0), 0, 0.66, 0.23, bg, false);
}

/* ---------- 冰封柜（不稳定火属性矿石） ---------- */
{
  const ig = G(inG);
  ig.position.set(-2.5, IFLOOR, -1.4);
  B(0.5, 1.45, 0.62, tm(0x2a3a4a), 0, 0, 0, ig, true);
  B(0.56, 0.08, 0.68, tm(0x3a4a5a), 0, 1.45, 0, ig, true);
  // 柜内暗腔（贴住柜体前面，做出纵深）
  B(0.44, 1.12, 0.03, tm(0x0b141c), 0, 0.24, 0.325, ig, false);
  // 内部矿石（位于柜体前面之前、玻璃之后，才看得见）
  for (let i = 0; i < 7; i++) {
    const m = rock(rnd(0.06, 0.11), em(0xff6a2a, 1.7, 0x3a1004), 0, 0.26 + i * 0.15, 0.348, ig, 0.3);
    m.position.x = rnd(-0.11, 0.11);
    m.position.z = 0.345 + rnd(-0.01, 0.01);
  }
  // 玻璃面板（在矿石之前）
  const glass = B(0.46, 1.06, 0.025, new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.17, depthWrite: false }), 0, 0.22, 0.372, ig, false);
  glass.renderOrder = 7;
  // 玻璃金属压边
  B(0.5, 0.03, 0.05, tm(PAL.ironLite), 0, 0.24, 0.372, ig, true);
  B(0.5, 0.03, 0.05, tm(PAL.ironLite), 0, 1.27, 0.372, ig, true);
  B(0.03, 1.06, 0.05, tm(PAL.ironLite), -0.235, 0.22, 0.372, ig, true);
  B(0.03, 1.06, 0.05, tm(PAL.ironLite), 0.235, 0.22, 0.372, ig, true);
  glowSprite(0xff6a2a, 1.1, 0.4, 0, 0.72, 0.365, ig);
  // 结霜
  for (let i = 0; i < 8; i++) {
    B(rnd(0.05, 0.14), 0.02, rnd(0.05, 0.12), tm(0xd8f4ff, { emissive: 0x2a7ba8, emissiveIntensity: 0.7 }), rnd(-0.2, 0.2), 0.16 + rnd(0, 1.1), 0.392, ig, false);
  }
  // 警示牌
  const wt = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#c8a020'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a1a'; g.font = '700 40px "Microsoft YaHei",sans-serif'; g.textAlign = 'center';
    g.fillText('高温危险', w / 2, 66);
    g.font = '600 26px "Microsoft YaHei",sans-serif';
    g.fillText('禁止开柜', w / 2, 112);
  });
  const p = Plane(0.26, 0.16, new THREE.MeshBasicMaterial({ map: wt }), 0.26, 1.12, 0.2, ig);
  p.rotation.y = Math.PI / 2;
}

/* ---------- 装备储物柜 ---------- */
{
  const lg = G(inG);
  lg.position.set(-2.55, IFLOOR, -3.1);
  B(0.4, 1.8, 1.1, tm(0x3a4450), 0, 0, 0, lg, true);
  for (let i = 0; i < 3; i++) {
    B(0.03, 1.5, 0.3, tm(0x2a3038), 0.21, 0.15, -0.36 + i * 0.36, lg, true);
    // 通风格栅
    for (let k = 0; k < 4; k++) B(0.02, 0.02, 0.16, tm(0x1a1e24), 0.23, 1.3 + k * 0.06, -0.36 + i * 0.36, lg, false);
    // 锁
    B(0.05, 0.09, 0.06, tm(PAL.brass), 0.24, 0.75, -0.36 + i * 0.36, lg, true);
  }
  B(0.44, 0.06, 1.16, tm(0x2a3038), 0, 1.8, 0, lg, true);
}

/* ---------- 杂志架 ---------- */
{
  const mg = G(inG);
  mg.position.set(0.25, IFLOOR, -1.0);
  B(0.5, 0.85, 0.3, tm(0x5a3a26), 0, 0, 0, mg, true);
  for (let i = 0; i < 3; i++) {
    const b = B(0.42, 0.3, 0.04, tm(pick([0x9a3a3a, 0x3a6a8a, 0x8a7a3a])), 0, 0.2 + i * 0.22, 0.1, mg, false);
    b.rotation.x = -0.22;
  }
  B(0.3, 0.1, 0.02, tm(0xd8d2c0), 0.05, 0.9, 0.08, mg, false);
}

/* ---------- 中央展台：冰火共生龙晶 ---------- */
const pedestalG = G(inG);
pedestalG.position.set(-1.55, IFLOOR, -2.2);
{
  C(0.42, 0.48, 0.12, 8, tm(0x3a424e), 0, 0, 0, pedestalG, true);
  C(0.34, 0.4, 0.32, 8, tm(0x4a5260), 0, 0.12, 0, pedestalG, true);
  C(0.42, 0.36, 0.06, 8, tm(0x5a6270), 0, 0.44, 0, pedestalG, true);
  // 台面发光环
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 24), em(0xffd070, 1.6, 0x2a1e08));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.5;
  pedestalG.add(ring);
  // 旋转晶体
  const spin = G(pedestalG);
  spin.position.y = 0.52;
  const c1 = dualCrystal(0.19, 1.0, 0, 0, 0, spin, 0, 0);
  const c2 = dualCrystal(0.08, 0.45, 0.14, 0, 0.05, spin, 0.25, 0.2);
  const c3 = dualCrystal(0.07, 0.4, -0.12, 0, -0.04, spin, -0.22, 0.15);
  FX.spin = spin;
  spin.traverse((o) => { if (o.isMesh) o.userData.outline = false; });
  glowSprite(0xffd090, 2.0, 0.42, 0, 0.5, 0, pedestalG);
  glowSprite(0x9f7bff, 2.2, 0.28, 0, 0.5, 0, pedestalG);
  const pl = new THREE.PointLight(0xffd0a0, 2.4, 2.6, 2);
  pl.position.set(0, 0.6, 0);
  pedestalG.add(pl);
  // 聚光灯
  C(0.07, 0.09, 0.14, 8, tm(PAL.ironLite), 0, 2.34, 0, inG, true).position.set(-1.55, 2.3, -2.2);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.7, 14, 1, true), new THREE.MeshBasicMaterial({
    color: 0xffd9a0, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  cone.position.set(-1.55, 1.55, -2.2);
  cone.rotation.x = Math.PI;
  inG.add(cone);
  FX.spotCone = cone;
}

/* ---------- 吊灯 ---------- */
function hangLamp(x, z, y = 2.1) {
  const g = G(inG);
  g.position.set(x, y, z);
  beam([0, 0.34, 0], [0, 0, 0], 0.008, tm(0x1a1a1e), g, 3);
  const shade = C(0.16, 0.09, 0.16, 8, tm(0x5a3a26), 0, -0.16, 0, g, true);
  C(0.09, 0.09, 0.03, 8, em(0xffc078, 0.8, 0x2a1a08), 0, -0.2, 0, g, true);
  glowSprite(0xffa858, 0.8, 0.4, 0, -0.22, 0, g);
  const pl = new THREE.PointLight(0xffb070, 1.5, 3.2, 2);
  pl.position.set(0, -0.24, 0);
  g.add(pl);
  return g;
}
hangLamp(-1.55, -1.1, 2.05);
hangLamp(-2.35, -2.9, 2.1);
hangLamp(0.35, -2.55, 2.12);

/* 室内主光 */
{
  const l1 = new THREE.PointLight(0xffb877, 1.9, 5.2, 2);
  l1.position.set(-1.2, 1.45, -2.0);
  scene.add(l1);
  const l2 = new THREE.PointLight(0xffa060, 1.5, 4.2, 2);
  l2.position.set(-2.2, 1.35, -1.2);
  scene.add(l2);
  const l3 = new THREE.PointLight(0x9fd8ff, 1.3, 3.6, 2);
  l3.position.set(0.5, 1.55, -3.2);
  scene.add(l3);
}
