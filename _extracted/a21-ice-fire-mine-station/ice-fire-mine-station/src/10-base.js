/* ============================================================
   10 · BASE — 冰火交融底座 / 熔岩瀑布 / 冰川深潭 / 伴生水晶
   ============================================================ */

const HALF = 5.5;          // 底座半宽
const STREET_Y = 0;
const BX0 = -2.9, BX1 = 1.3, BZ0 = -3.9, BZ1 = -0.6;   // 建筑占地
const SHELF_Y = 1.28;      // 熔岩台地高度
const POOL_Y = -0.52;      // 冰潭水面
const FALL_Z = 1.15;       // 熔岩瀑布落点 z
const CONTACT = new THREE.Vector3(-3.72, POOL_Y, 1.55);

const FX = { lava: [], steam: [], drips: [], spirits: [], pulses: [] };

/* ---------- 熔岩 / 水面着色器 ---------- */
const NOISE_GLSL = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x),
               mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
  }
  float fbm(vec2 p){ return vnoise(p)*0.55 + vnoise(p*2.3+11.0)*0.28 + vnoise(p*5.1+31.0)*0.17; }
`;

function lavaMaterial(speed = 1.0, hot = 1.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uSpeed: { value: speed }, uHot: { value: hot },
      cA: { value: new THREE.Color(0x4a0a04) },
      cB: { value: new THREE.Color(0xff5a14) },
      cC: { value: new THREE.Color(0xffd66a) }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: NOISE_GLSL + `
      varying vec2 vUv; uniform float uT, uSpeed, uHot; uniform vec3 cA, cB, cC;
      void main(){
        vec2 uv = vUv;
        float t = uT * uSpeed;
        float n1 = fbm(vec2(uv.x*7.0, uv.y*4.5 - t*1.15));
        float n2 = fbm(vec2(uv.x*16.0 + 7.0, uv.y*9.0 - t*2.3));
        float v = n1*0.62 + n2*0.38;
        v += 0.09 * sin(uv.x*26.0 + n1*7.0);           // 纵向流纹
        vec3 hot = mix(cB, cC, smoothstep(0.44, 0.74, v));
        // 冷却黑壳与热缝
        vec3 col = mix(cA, hot, smoothstep(0.40, 0.53, v));
        col = mix(col, cC, smoothstep(0.60, 0.84, v) * uHot);
        // 流芯
        float core = smoothstep(0.62, 0.0, abs(uv.x - 0.5));
        col += cC * core * 0.18 * uHot;
        // 纵向流丝（增强"向下倾倒"的观感）
        float streak = smoothstep(0.55, 1.0, sin(uv.x*34.0 + n1*9.0)*0.5 + 0.5);
        col += cC * streak * 0.16 * uHot;
        // 底部接近落点更亮
        col *= mix(0.92, 1.22, smoothstep(0.55, 1.0, uv.y));
        // 冷却壳
        float edge = smoothstep(0.0, 0.13, uv.x) * smoothstep(1.0, 0.87, uv.x);
        col *= mix(0.3, 1.0, edge);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
}
function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uT: { value: 0 },
      cDeep: { value: new THREE.Color(0x07243a) },
      cMid: { value: new THREE.Color(0x1d6f9c) },
      cIce: { value: new THREE.Color(0x9fe8ff) }
    },
    vertexShader: `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vP; uniform float uT; uniform vec3 cDeep, cMid, cIce;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5); }
      void main(){
        vec2 uv = vUv;
        float rip = sin(uv.x*24.0 + sin(uv.y*8.0 + uT*0.9)*1.9 + uT*0.7) * sin(uv.y*17.0 - uT*0.5);
        float rip2 = sin(uv.x*52.0 - uT*1.25) * sin(uv.y*35.0 + uT*0.85);
        vec3 col = mix(cDeep, cMid, smoothstep(-0.5, 0.9, rip) * 0.62);
        col += cIce * (smoothstep(0.78, 1.0, rip*0.55 + rip2*0.55) * 0.42);
        col *= mix(1.05, 0.72, smoothstep(0.2, 1.0, uv.y));
        float edge = smoothstep(0.0, 0.13, uv.x) * smoothstep(1.0, 0.87, uv.x) * smoothstep(0.0, 0.09, uv.y) * smoothstep(1.0, 0.91, uv.y);
        col = mix(cIce*0.42, col, edge*0.82 + 0.18);
        gl_FragColor = vec4(col, 0.94);
      }`
  });
}

/* ============================================================
   底座主体
   ============================================================ */
const baseG = G();

/* 底部收藏级基座 */
B(11.5, 0.26, 11.5, tm(0x1b2029), 0, -2.72, 0, baseG, true);
B(11.24, 0.10, 11.24, tm(0x2b3340), 0, -2.46, 0, baseG, true);
// 黄铜描边
B(11.56, 0.045, 11.56, tm(PAL.brass, { emissive: 0x3a2a10, emissiveIntensity: 0.6 }), 0, -2.63, 0, baseG, false);
/* 主体岩层（街道部分） */
B(8.4, 2.4, 11.0, tm(PAL.stoneDark), 1.3, -2.42, 0, baseG, false);
// 外立面岩层纹理带
const strataColors = [0x2c333d, 0x39424e, 0x2a313a, 0x434c58, 0x30373f];
for (let i = 0; i < 5; i++) {
  B(8.5, 0.16, 11.08, tm(strataColors[i]), 1.3, -2.42 + i * 0.46, 0, baseG, false);
}
// 正面外壁的熔岩脉
for (let i = 0; i < 6; i++) {
  const x = -1.8 + i * 1.25;
  B(rnd(0.2, 0.7), 0.07, 0.08, em(PAL.lava, 1.3, 0x3a0e04), x, rnd(-2.1, -0.4), HALF + 0.01, baseG, false);
}
// 侧壁顶缘少量冰凌
for (let i = 0; i < 5; i++) {
  const z = -3.4 + i * 1.7 + rnd(-0.3, 0.3);
  const h = rnd(0.14, 0.3);
  C(0.012, 0.035, h, 4, tm(0xbfeaff, { emissive: 0x2a7ba8, emissiveIntensity: 0.45 }), HALF + 0.02, -0.12 - h, z, baseG, false);
}

/* ============================================================
   左侧熔岩台地（悬崖）
   ============================================================ */
const shelfG = G();
B(2.65, 3.7, 6.65, tm(PAL.stoneDark), -4.175, -2.42, -2.175, shelfG, false);
// 台地顶部岩石
for (let i = 0; i < 26; i++) {
  const x = rnd(-5.45, -2.95), z = rnd(-5.35, 1.05);
  rock(rnd(0.22, 0.55), tm(pick([PAL.stoneDark, 0x3f4854, 0x2f3640])), x, SHELF_Y - 0.12 + rnd(-0.05, 0.1), z, shelfG, 0.3);
}
// 台地崖壁（面向冰潭）
for (let i = 0; i < 16; i++) {
  const x = rnd(-5.45, -2.95);
  rock(rnd(0.3, 0.62), tm(pick([PAL.stoneDark, 0x3a424d])), x, rnd(-1.2, 0.9), FALL_Z + rnd(0.0, 0.35), shelfG, 0.32);
}
// 崖壁上的发光熔岩裂缝
for (let i = 0; i < 9; i++) {
  const m = B(rnd(0.05, 0.12), rnd(0.3, 0.9), 0.06, em(PAL.lava, 1.5, 0x4a1004), rnd(-5.2, -3.1), rnd(-0.9, 1.0), FALL_Z + 0.32, shelfG, false);
  m.rotation.z = rnd(-0.25, 0.25);
}

/* 熔岩河（台地顶面） */
{
  const riverMat = lavaMaterial(0.85, 1.0);
  FX.lava.push(riverMat);
  const riverShape = new THREE.Shape();
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const z = lerp(-5.45, FALL_Z + 0.02, t);
    const cx = -4.1 + Math.sin(t * 3.4) * 0.42;
    pts.push([cx, z, 0.52 + Math.sin(t * 2.2) * 0.14]);
  }
  const verts = [], uvs = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const [cx, z, hw] = pts[i];
    verts.push(cx - hw, SHELF_Y + 0.035, z, cx + hw, SHELF_Y + 0.035, z);
    uvs.push(0, i / (pts.length - 1), 1, i / (pts.length - 1));
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2, b = a + 1, c2 = a + 2, d = a + 3;
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const river = new THREE.Mesh(g, riverMat);
  river.renderOrder = 2;
  shelfG.add(river);
  // 河岸结焦岩
  for (let i = 0; i < 12; i++) {
    const t = rnd(0, 1);
    const z = lerp(-5.4, FALL_Z, t);
    const cx = -4.1 + Math.sin(t * 3.4) * 0.42;
    const side = srnd() > 0.5 ? 1 : -1;
    rock(rnd(0.07, 0.16), tm(0x241f22), cx + side * rnd(0.46, 0.62), SHELF_Y + 0.02, z, shelfG, 0.34);
  }
  // 台地上的熔岩池（源头）
  const srcMat = lavaMaterial(0.6, 1.0);
  FX.lava.push(srcMat);
  const src = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), srcMat);
  src.rotation.x = -Math.PI / 2;
  src.position.set(-4.15, SHELF_Y + 0.045, -4.6);
  shelfG.add(src);
  // 源头火山岩堆
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.28;
    rock(rnd(0.3, 0.55), tm(0x2a2226), -4.15 + Math.cos(a) * 1.05, SHELF_Y + 0.05, -4.6 + Math.sin(a) * 1.05, shelfG, 0.3);
  }
}

/* 熔岩瀑布 */
{
  const fallMat = lavaMaterial(1.5, 1.05);
  FX.lava.push(fallMat);
  const seg = 10, wSeg = 4;
  const verts = [], uvs = [], idx = [];
  const topY = SHELF_Y + 0.02, botY = POOL_Y + 0.05;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const y = lerp(topY, botY, t);
    const zOut = FALL_Z + Math.pow(t, 0.75) * 0.42;         // 向外抛洒
    const hw = lerp(0.78, 1.12, Math.pow(t, 0.6));
    for (let j = 0; j <= wSeg; j++) {
      const u = j / wSeg;
      const x = lerp(-4.72, -3.18, u) + Math.sin(t * 3.0 + u * 2.0) * 0.03;
      verts.push(x, y, zOut + Math.sin(u * 3.14) * 0.06);
      uvs.push(u, t);   // v 向下递增，保证纹理沿瀑布向下流动
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < wSeg; j++) {
      const a = i * (wSeg + 1) + j, b = a + 1, c2 = a + wSeg + 1, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const fall = new THREE.Mesh(g, fallMat);
  fall.renderOrder = 3;
  shelfG.add(fall);

  // 顶部岩唇（熔岩从岩缝里涌出）
  for (let i = 0; i < 7; i++) {
    const rx = -4.72 + i * 0.26;
    rock(rnd(0.2, 0.34), tm(0x241d22), rx, SHELF_Y + 0.12, FALL_Z + 0.12, shelfG, 0.3);
  }
  B(1.7, 0.16, 0.3, tm(0x2a2226), -3.95, SHELF_Y + 0.16, FALL_Z + 0.02, shelfG, true);
  // 落点白光
  glowSprite(0xfff0d0, 1.5, 0.4, -3.95, POOL_Y + 0.25, FALL_Z + 0.55, shelfG);
  // 瀑布两侧的凝固岩壳
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const y = lerp(topY - 0.05, botY + 0.2, t);
    const z = FALL_Z + Math.pow(t, 0.75) * 0.42;
    B(rnd(0.1, 0.22), rnd(0.14, 0.34), 0.12, tm(0x241d20), -4.72, y, z, shelfG, false);
    B(rnd(0.1, 0.22), rnd(0.14, 0.34), 0.12, tm(0x241d20), -3.18, y, z, shelfG, false);
  }
}

/* ============================================================
   冰川深潭
   ============================================================ */
const poolG = G();
// 潭底
B(2.9, 0.5, 4.5, tm(0x0d2438), -4.15, -2.42, 3.35, poolG, false);
// 冰潭水体：填满水面以下，避免从侧面看穿
B(2.6, 1.88, 4.36, tm(0x0e3350, { emissive: 0x0b2a42, emissiveIntensity: 0.55 }), -4.2, -2.42, 3.31, poolG, false);
// 水体中的分层冰纹（侧面可见）
for (let i = 0; i < 4; i++) {
  B(2.62, 0.03, 4.38, tm(0x4f9fc4, { emissive: 0x1b5a78, emissiveIntensity: 0.6, transparent: true, opacity: 0.5 }), -4.2, -2.12 + i * 0.4, 3.31, poolG, false);
}
// 潭水
const waterMat = waterMaterial();
const water = new THREE.Mesh(new THREE.PlaneGeometry(2.82, 4.42), waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(-4.13, POOL_Y, 3.3);
water.renderOrder = 1;
poolG.add(water);

// 冰面 / 浮冰
for (let i = 0; i < 16; i++) {
  const x = rnd(-5.35, -3.05), z = rnd(1.25, 5.3);
  const d = Math.hypot(x + 3.9, z - 1.5);
  if (d < 1.35) continue;
  const w = rnd(0.18, 0.55);
  const b = B(w, rnd(0.02, 0.05), w * rnd(0.6, 1.3), tm(0x5fa6c8, { emissive: 0x143f5a, emissiveIntensity: 0.2, transparent: true, opacity: 0.42 }),
    x, POOL_Y + 0.02, z, poolG, false);
  b.rotation.y = rnd(0, 3.14);
}
// 巨大冰柱 / 冰崖
const iceMat = tm(0x8fdcf7, { emissive: 0x1e6f96, emissiveIntensity: 0.3, transparent: true, opacity: 0.94 });
const iceMat2 = tm(0xa9dff2, { emissive: 0x2a7090, emissiveIntensity: 0.26, transparent: true, opacity: 0.9 });
for (let i = 0; i < 7; i++) {
  const x = rnd(-5.42, -4.85), z = rnd(2.1, 5.25);
  const h = rnd(0.45, 1.05);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rnd(0.12, 0.3), rnd(0.28, 0.45), h, 5, 1), srnd() > 0.5 ? iceMat : iceMat2);
  m.position.set(x, POOL_Y + h / 2 - 0.15, z);
  m.rotation.set(rnd(-0.14, 0.14), rnd(0, 3), rnd(-0.14, 0.14));
  m.castShadow = true; m.userData.outline = true;
  poolG.add(m);
}
// 潭边冰块堆
for (let i = 0; i < 10; i++) {
  const x = rnd(-5.4, -4.9), z = rnd(1.2, 5.35);
  if (Math.hypot(x + 3.72, z - 1.55) < 1.15) continue;
  const b = B(rnd(0.3, 0.7), rnd(0.2, 0.5), rnd(0.3, 0.7), tm(0x6fb4d0, { emissive: 0x154c66, emissiveIntensity: 0.28, transparent: true, opacity: 0.9 }),
    x, POOL_Y - 0.1, z, poolG, true);
  b.rotation.y = rnd(0, 3.14);
}

/* 岸边岩壁与护栏地基 */
for (let i = 0; i < 20; i++) {
  const x = rnd(-5.45, -2.85);
  rock(rnd(0.16, 0.32), tm(pick([PAL.stoneDark, 0x3c444f])), x, rnd(-1.0, -0.45), rnd(1.0, 1.3), poolG, 0.3);
}
// 建筑侧的挡土石墙
B(0.28, 2.0, 4.5, tm(0x3a424d), -2.83, -1.9, 3.3, poolG, true);
for (let i = 0; i < 10; i++) {
  B(0.34, 0.22, rnd(0.4, 0.8), tm(pick([0x454e5a, 0x333a44])), -2.82, -1.8 + i * 0.19, rnd(1.3, 5.2), poolG, false);
}
// 挡土墙上的冰凌
for (let i = 0; i < 14; i++) {
  C(0.015, 0.05, rnd(0.2, 0.62), 4, tm(0xd8f4ff, { emissive: 0x2a7ba8, emissiveIntensity: 0.7 }), -2.68, rnd(-0.9, 0.1), rnd(1.3, 5.2), poolG, false);
}

/* 底座外缘的自然断面碎石 */
{
  const edges = [];
  for (let i = 0; i < 26; i++) edges.push([HALF + rnd(-0.04, 0.08), rnd(-2.3, -0.1), -HALF + i * 0.44]);
  for (let i = 0; i < 26; i++) edges.push([-HALF + i * 0.44, rnd(-2.3, -0.1), HALF + rnd(-0.04, 0.08)]);
  for (let i = 0; i < 26; i++) edges.push([-HALF - rnd(-0.04, 0.08), rnd(-2.3, -0.1), -HALF + i * 0.44]);
  for (const [x, y, z] of edges) {
    const m = rock(rnd(0.16, 0.4), tm(pick([0x333b45, 0x2b323b, 0x3d4650])), x, y, z, baseG, 0.34);
    m.scale.set(1, rnd(0.7, 1.5), 1);
  }
}

/* ============================================================
   冰火交融伴生水晶簇
   ============================================================ */
const crystalMat = new THREE.ShaderMaterial({
  vertexColors: true,
  uniforms: { uT: { value: 0 } },
  vertexShader: `
    varying vec3 vCol; varying vec3 vN; varying vec3 vV;
    void main(){
      vCol = color;
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vV = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vCol; varying vec3 vN; varying vec3 vV; uniform float uT;
    void main(){
      vec3 n = normalize(vN), v = normalize(vV);
      float fres = pow(1.0 - abs(dot(n, v)), 2.2);
      float shard = pow(abs(sin(v.y*22.0 + uT*0.6)), 6.0);
      vec3 col = vCol * (0.62 + fres * 0.5) + vCol * shard * 0.3;
      col += vec3(0.42, 0.22, 0.85) * fres * 0.18;
      gl_FragColor = vec4(col, 1.0);
    }`
});
FX.crystalMat = crystalMat;

function dualCrystal(r, h, x, y, z, parent, tiltX = 0, tiltZ = 0) {
  let g = new THREE.ConeGeometry(r, h, 6, 4, false).toNonIndexed();
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const cIce = new THREE.Color(0x35c8ff), cViolet = new THREE.Color(0x9a3cff), cGold = new THREE.Color(0xffc247);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp(pos.getY(i) / h + 0.5, 0, 1);
    if (t < 0.55) tmp.copy(cIce).lerp(cViolet, t / 0.55);
    else tmp.copy(cViolet).lerp(cGold, (t - 0.55) / 0.45);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, crystalMat);
  m.position.set(x, y + h / 2, z);
  m.rotation.set(tiltX, rnd(0, 6.28), tiltZ);
  m.castShadow = true;
  m.userData.outline = true;
  (parent || world).add(m);
  return m;
}

const clusterG = G();
for (let i = 0; i < 16; i++) {
  const a = rnd(0, 6.28), d = rnd(0, 0.85);
  const h = rnd(0.35, 1.55) * (1 - d * 0.35);
  dualCrystal(rnd(0.07, 0.17), h, CONTACT.x + Math.cos(a) * d, CONTACT.y - 0.05, CONTACT.z + Math.sin(a) * d * 0.8,
    clusterG, rnd(-0.35, 0.35), rnd(-0.35, 0.35));
}
// 最大的一根
dualCrystal(0.22, 1.85, CONTACT.x - 0.15, CONTACT.y - 0.1, CONTACT.z + 0.1, clusterG, 0.1, -0.08);
// 水中倒影光晕
const contactGlow = glowSprite(0xffb060, 1.7, 0.26, CONTACT.x, CONTACT.y + 0.25, CONTACT.z, clusterG);
const contactGlow2 = glowSprite(0x9a6bff, 2.3, 0.14, CONTACT.x, CONTACT.y + 0.1, CONTACT.z, clusterG);
FX.pulses.push({ s: contactGlow, base: 0.26, sp: 1.6 });
FX.pulses.push({ s: contactGlow2, base: 0.14, sp: 1.1 });
// 水面上的光斑
for (let i = 0; i < 3; i++) {
  const p = Plane(2.2 + i * 0.9, 2.2 + i * 0.9, new THREE.MeshBasicMaterial({
    map: TEX_GLOW, color: i === 0 ? 0xff9a4a : (i === 1 ? 0x7f7dff : 0x35c8ff),
    transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false
  }), CONTACT.x, POOL_Y + 0.06, CONTACT.z + 0.2, poolG);
  p.rotation.x = -Math.PI / 2;
  FX.pulses.push({ s: p, base: 0.11, sp: 0.7 + i * 0.35 });
}
// 晶体点光源
const crystalLight = new THREE.PointLight(0xb06bff, 4.2, 5.0, 2);
crystalLight.position.set(CONTACT.x, CONTACT.y + 0.7, CONTACT.z);
scene.add(crystalLight);
FX.crystalLight = crystalLight;

/* 熔岩与冰潭的环境光 */
const lavaLightA = new THREE.PointLight(0xff6a20, 9, 9, 2);
lavaLightA.position.set(-4.1, 1.0, 0.4);
scene.add(lavaLightA);
FX.lavaLights = [lavaLightA];
const lavaLightB = new THREE.PointLight(0xff8a3a, 6, 7, 2);
lavaLightB.position.set(-4.0, POOL_Y + 0.5, 1.5);
scene.add(lavaLightB);
FX.lavaLights.push(lavaLightB);

const iceLight = new THREE.PointLight(0x4fc8ff, 3.4, 6.0, 2);
iceLight.position.set(-4.4, -0.2, 4.2);
scene.add(iceLight);

/* 蒸汽起点（FX 用） */
FX.steam.push({ x: CONTACT.x, y: CONTACT.y + 0.15, z: CONTACT.z, n: 14, spread: 0.34, up: 0.42, color: 0xdff4ff });
FX.steam.push({ x: -4.1, y: SHELF_Y, z: -4.6, n: 7, spread: 0.5, up: 0.3, color: 0xffd0a0 });

/* 台地边缘的护栏（防止掉落） */
for (let i = 0; i < 7; i++) {
  const x = -5.25 + i * 0.36;
  B(0.06, 0.5, 0.06, tm(PAL.iron), x, SHELF_Y + 0.15, 0.95, shelfG, true);
}
beam([-5.3, SHELF_Y + 0.62, 0.95], [-3.15, SHELF_Y + 0.62, 0.95], 0.035, tm(PAL.iron), shelfG);
