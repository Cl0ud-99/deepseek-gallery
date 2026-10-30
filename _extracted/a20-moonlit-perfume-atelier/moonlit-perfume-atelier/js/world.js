/* =========================================================================
   世界底座：翡翠苔藓基座 / 双层荧光琉璃水池 / 鹅卵石花滩 / 水下秘境
   ========================================================================= */

const worldRoot = new THREE.Group();
scene.add(worldRoot);

/* --------------------------------------------------------------- 水面着色器 */
const WATER_VS = `
  varying vec3 vW; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const WATER_FS = `
  precision highp float;
  uniform float uTime;
  uniform vec4 uRipples[8];
  uniform vec3 uDeep, uShallow, uFoam, uSky;
  varying vec3 vW; varying vec3 vN; varying vec3 vV; varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x),
               mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
  }
  float caustic(vec2 p, float t){
    float a = sin(p.x*2.3 + sin(p.y*1.7 + t*0.55)*1.65);
    float b = sin(p.y*2.6 + sin(p.x*2.0 - t*0.45)*1.65);
    float n = abs(a*b);
    n = pow(n, 1.55);
    n += noise(p*3.0 + vec2(t*0.10, -t*0.09)) * 0.07;
    return clamp(n, 0.0, 1.0);
  }

  void main(){
    vec2 p = vW.xz;
    float h = 0.0;
    vec2 grad = vec2(0.0);

    for(int i=0;i<8;i++){
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if(age > 0.0 && age < 4.5){
        vec2 dv = p - r.xy;
        float d = length(dv) + 0.0001;
        float env = exp(-d*0.80) * exp(-age*0.92) * r.w;
        float ph = d*7.0 - age*9.0;
        h += sin(ph) * env;
        float dhdd = (7.0*cos(ph) - 0.80*sin(ph)) * env;
        grad += dhdd * dv / d;
      }
    }

    grad += vec2(cos(p.x*1.10 + uTime*0.50)*0.014, cos(p.y*1.35 - uTime*0.42)*0.014);
    h += sin(p.x*1.10 + uTime*0.50)*0.012 + sin(p.y*1.35 - uTime*0.42)*0.012;

    vec3 n = normalize(vec3(-grad.x*0.62, 1.0, -grad.y*0.62));
    vec3 v = normalize(vV);

    float c1 = caustic(p*2.2, uTime);
    float c2 = caustic(p*4.6 + 7.0, uTime*0.85);
    float caus = clamp(c1*0.70 + c2*0.50, 0.0, 1.0);

    float ndv = clamp(dot(n, v), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 4.0);

    vec3 col = mix(uDeep, uShallow, 0.34);
    col = mix(col, uSky, fres * 0.92);
    col += uFoam * pow(caus, 9.0) * 0.22;
    col += uFoam * max(0.0, h) * 2.6;

    // 池壁边缘的荧光
    float edge = smoothstep(8.95, 9.7, max(abs(p.x), abs(p.y)));
    col += uFoam * edge * 0.55;

    float alpha = clamp(0.18 + 0.60*fres + pow(caus,9.0)*0.10 + max(0.0,h)*1.4, 0.0, 0.90);
    gl_FragColor = vec4(col, alpha);
  }`;

const waterMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: U.uTime,
    uRipples: { value: rippleData },
    uDeep: { value: new THREE.Color(0x0a4b59) },
    uShallow: { value: new THREE.Color(0x2a98a8) },
    uFoam: { value: new THREE.Color(0xf2fffd).multiplyScalar(0.55) },
    uSky: { value: new THREE.Color(0x8fc6e4) }
  },
  vertexShader: WATER_VS,
  fragmentShader: WATER_FS,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});

/* ------------------------------------------------------------------ 基座 */
(function buildBase() {
  const moss = toonMat({ color: 0x22663f, shade: 0x0b2a1b, rim: 0x8fe0a8, rimPow: 2.2, rimStr: 0.20, spec: 0x9fe8cc, specStr: 0.18, emissive: 0.02 });

  const outer = roundedRectShape(11.15, 11.15, 1.05);
  outer.holes.push(roundedRectShape(9.98, 9.98, 0.75));
  const baseGeo = new THREE.ExtrudeGeometry(outer, {
    depth: 1.9, bevelEnabled: true, bevelSize: 0.10, bevelThickness: 0.10, bevelSegments: 3, curveSegments: 22
  });
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, moss);
  base.position.y = -2.95;
  worldRoot.add(base);

  // 底部阴影 / 展台暗面
  const under = new THREE.Mesh(
    new THREE.BoxGeometry(21.6, 0.28, 21.6),
    toonMat({ color: 0x16333a, shade: 0x08181c, rim: 0x4fb0a8, rimStr: 0.25 })
  );
  under.position.y = -3.08;
  worldRoot.add(under);

  // 展台落影
  const groundShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42),
    new THREE.MeshBasicMaterial({ map: texShadow, transparent: true, opacity: 0.55, depthWrite: false, color: 0x000000 })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = -3.22;
  groundShadow.renderOrder = -5;
  worldRoot.add(groundShadow);

  // 基座顶部金线
  const goldLine = tubeOf(roundedRectPoints(10.55, 10.55, 0.95, -1.02, 12), 0.035,
    toonMat({ color: 0xf0c887, shade: 0x6b4a1c, rim: 0xfff3c8, specStr: 1.1, emissive: 0.40 }), 200, 6, true);
  worldRoot.add(goldLine);

  // 苔藓绒球
  const tuftGeo = new THREE.SphereGeometry(1, 6, 5);
  const tuftMat = toonMat({ color: 0x2f7d4f, shade: 0x0e3322, rim: 0x9fffc0, rimStr: 0.25, emissive: 0.04 });
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 260);
  const dummy = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < 900 && k < 260; i++) {
    const x = rnd(-11.0, 11.0), z = rnd(-11.0, 11.0);
    const ax = Math.abs(x), az = Math.abs(z);
    if (ax < 9.95 && az < 9.95) continue;
    if (ax > 11.05 || az > 11.05) continue;
    const s = rnd(0.06, 0.17);
    dummy.position.set(x, -1.0 + s * 0.25, z);
    dummy.scale.set(s * rnd(0.8, 1.5), s * rnd(0.5, 0.9), s * rnd(0.8, 1.5));
    dummy.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    dummy.updateMatrix();
    tufts.setMatrixAt(k++, dummy.matrix);
  }
  tufts.count = k;
  worldRoot.add(tufts);

  // 苔藓上的小荧光蘑菇
  const capMat = glowMat(0x7ff5e0, 0.95);
  const stemMat = toonMat({ color: 0xdff7ff, shade: 0x7aa6b8, rim: 0xffffff, emissive: 0.25 });
  for (let i = 0; i < 9; i++) {
    const side = rndi(0, 3);
    let x, z;
    if (side === 0) { x = rnd(-10.9, 10.9); z = rnd(-10.9, -10.1); }
    else if (side === 1) { x = rnd(-10.9, 10.9); z = rnd(10.1, 10.9); }
    else if (side === 2) { x = rnd(-10.9, -10.1); z = rnd(-10.9, 10.9); }
    else { x = rnd(10.1, 10.9); z = rnd(-10.9, 10.9); }
    const s = rnd(0.09, 0.17);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.22, s * 0.3, s * 2.2, 6), stemMat);
    stem.position.set(x, -1.0 + s * 1.1, z);
    worldRoot.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(s * 0.95, 10, 6, 0, TAU, 0, Math.PI * 0.62), capMat);
    cap.position.set(x, -1.0 + s * 2.2, z);
    cap.scale.y = 0.72;
    worldRoot.add(cap);
    const g = glowSprite(0x7ff5e0, s * 9, 0.5);
    g.position.copy(cap.position);
    worldRoot.add(g);
  }
})();

/* ------------------------------------------------------------ 双层水池 */
(function buildPool() {
  // 玻璃池壁
  const wallOuter = roundedRectShape(9.92, 9.92, 0.7);
  wallOuter.holes.push(roundedRectShape(9.74, 9.74, 0.58));
  const wallGeo = new THREE.ExtrudeGeometry(wallOuter, { depth: 2.95, bevelEnabled: false, curveSegments: 18 });
  wallGeo.rotateX(-Math.PI / 2);
  const wall = new THREE.Mesh(wallGeo, glassMat({ color: 0xd6f4ff, opacity: 0.18, spec: 1.5, irid: 0.6 }));
  wall.position.y = -2.95;
  wall.renderOrder = 6;
  worldRoot.add(wall);

  // 池口发光唇线
  const lip = tubeOf(roundedRectPoints(9.86, 9.86, 0.66, -0.03, 12), 0.036,
    glowMat(0x9ffff0, 0.9), 200, 6, true);
  lip.renderOrder = 7;
  worldRoot.add(lip);

  // 内壁荧光（加法体积感）
  const innerMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uTop: { value: new THREE.Color(0x6ff0ff) }, uBot: { value: new THREE.Color(0x0a5a70) } },
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `
      varying vec3 vW; varying vec3 vN; uniform float uTime; uniform vec3 uTop, uBot;
      void main(){
        float t = clamp((vW.y + 2.9) / 2.9, 0.0, 1.0);
        float g = pow(t, 2.4);
        float band = sin(vW.y*7.0 - uTime*0.7)*0.5+0.5;
        vec3 c = mix(uBot, uTop, g) * (0.45 + 0.35*band) * g;
        gl_FragColor = vec4(c, 0.16*g);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
  });
  const inner = new THREE.Mesh(new THREE.BoxGeometry(19.7, 2.9, 19.7), innerMat);
  inner.position.y = -1.45;
  inner.renderOrder = 5;
  worldRoot.add(inner);

  // 池底
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(19.8, 19.8),
    toonMat({ color: 0x2a6f78, shade: 0x0c2c31, rim: 0xa8e0dc, rimStr: 0.20, spec: 0xffffff, specStr: 0.4, emissive: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.66;
  worldRoot.add(floor);

  // 池底发光沙粒
  const sandGeo = new THREE.SphereGeometry(1, 5, 4);
  const sandMat = new THREE.MeshBasicMaterial({ color: 0xeafffb, transparent: true, opacity: 0.55 });
  const sand = new THREE.InstancedMesh(sandGeo, sandMat, 220);
  const d = new THREE.Object3D();
  for (let i = 0; i < 220; i++) {
    const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 9.4;
    const s = rnd(0.02, 0.07);
    d.position.set(Math.cos(a) * r, -2.64, Math.sin(a) * r);
    d.scale.set(s, s * 0.5, s);
    d.updateMatrix();
    sand.setMatrixAt(i, d.matrix);
  }
  worldRoot.add(sand);

  // 水底焦散光网
  const causMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.uTime,
      uColor: { value: new THREE.Color(0xcafcf4).multiplyScalar(0.42) },
      uDeep: { value: new THREE.Color(0x145c68) }
    },
    vertexShader: `varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `
      precision highp float;
      uniform float uTime; uniform vec3 uColor, uDeep;
      varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
      }
      float caustic(vec2 p, float t){
        float a = sin(p.x*2.3 + sin(p.y*1.7 + t*0.55)*1.65);
        float b = sin(p.y*2.6 + sin(p.x*2.0 - t*0.45)*1.65);
        return pow(abs(a*b), 1.5);
      }
      void main(){
        vec2 p = vW.xz;
        float c = caustic(p*0.95, uTime);
        c = pow(clamp(c, 0.0, 1.0), 4.2);
        float c2 = pow(clamp(caustic(p*1.9 + 3.0, uTime*0.8), 0.0, 1.0), 7.0);
        vec3 col = uDeep * 0.16 + uColor * (c * 1.15 + c2 * 0.20);
        float edge = smoothstep(9.7, 7.2, max(abs(p.x), abs(p.y)));
        col *= 0.25 + 0.75*edge;
        gl_FragColor = vec4(col, 0.06 + c*0.26 + c2*0.06);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const causPlane = new THREE.Mesh(new THREE.PlaneGeometry(19.3, 19.3), causMat);
  causPlane.rotation.x = -Math.PI / 2;
  causPlane.position.y = -2.60;
  causPlane.renderOrder = 2;
  worldRoot.add(causPlane);

  // 第二层玻璃隔层
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(19.3, 0.06, 19.3), glassMat({ color: 0xcaf0ff, opacity: 0.10, spec: 0.9 }));
  shelf.position.y = -1.18;
  shelf.renderOrder = 6;
  worldRoot.add(shelf);

  const shelfGlow = tubeOf(roundedRectPoints(9.6, 9.6, 0.5, -1.18, 10), 0.028,
    glowMat(0x8ff8ff, 0.95), 200, 5, true);
  shelfGlow.renderOrder = 7;
  worldRoot.add(shelfGlow);

  // 水面
  const water = new THREE.Mesh(new THREE.PlaneGeometry(19.9, 19.9), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.0;
  water.renderOrder = 8;
  worldRoot.add(water);

  // 莲花投影
  const sh = shadowDecal(16.5, 0.42);
  sh.position.set(-1.2, 0.025, -1.6);
  sh.renderOrder = 9;
  worldRoot.add(sh);
})();

/* --------------------------------------------------------- 白色鹅卵石花滩 */
(function buildBeach() {
  const pebbleGeo = new THREE.IcosahedronGeometry(1, 1);
  const pebbleMat = toonMat({ color: 0xf7faf9, shade: 0xa9bcc4, rim: 0xffffff, rimStr: 0.35, spec: 0xffffff, specStr: 0.5 });
  const N = 620;
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, N);
  const d = new THREE.Object3D();
  const corner = new THREE.Vector2(9.2, 9.2);
  const beachPts = [];
  for (let i = 0; i < N; i++) {
    const a = rnd(0, Math.PI * 0.5) * 0.98 + 0.01;
    const rr = Math.pow(Math.random(), 0.62) * 4.75;
    const x = corner.x - Math.cos(a) * rr;
    const z = corner.y - Math.sin(a) * rr;
    const t = 1 - rr / 4.9;
    const y = -0.16 + Math.pow(t, 0.85) * 0.55 + rnd(-0.05, 0.05);
    const s = rnd(0.055, 0.145) * (0.6 + t * 0.7);
    d.position.set(x, y, z);
    d.scale.set(s * rnd(0.9, 1.4), s * rnd(0.45, 0.75), s * rnd(0.9, 1.4));
    d.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    d.updateMatrix();
    pebbles.setMatrixAt(i, d.matrix);
    if (y > 0.02 && Math.random() < 0.55) beachPts.push(new THREE.Vector3(x, y + s * 0.4, z));
  }
  worldRoot.add(pebbles);

  // 大石块
  const bigRockMat = toonMat({ color: 0xe6edee, shade: 0x93a9b0, rim: 0xffffff, rimStr: 0.3, spec: 0xffffff, specStr: 0.45 });
  for (let i = 0; i < 4; i++) {
    const a = rnd(0.25, 1.35);
    const rr = rnd(3.4, 4.5);
    const x = corner.x - Math.cos(a) * rr, z = corner.y - Math.sin(a) * rr;
    const s = rnd(0.22, 0.38);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), bigRockMat);
    rock.position.set(x, rnd(-0.18, 0.02), z);
    rock.scale.set(1, rnd(0.5, 0.75), 1);
    rock.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    worldRoot.add(addOutline(rock, 1.03, 0x2a4048));
  }

  // 散落花瓣
  const petalGeo = petalGeometry(0.34, 0.20, 0.9, 0.2, 8, 5);
  const petalMat = toonMat({
    color: 0xffd9e8, shade: 0xe08aad, rim: 0xfff3f8, rimStr: 0.7,
    grad: 0xfff6fb, gradAmt: 0.8, emissive: 0.10, side: THREE.DoubleSide
  });
  const P = 260;
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, P);
  for (let i = 0; i < P; i++) {
    const base = beachPts.length ? pick(beachPts) : new THREE.Vector3(7, 0.4, 7);
    d.position.set(base.x + rnd(-0.4, 0.4), base.y + rnd(0, 0.12), base.z + rnd(-0.4, 0.4));
    d.rotation.set(-Math.PI / 2 + rnd(-0.5, 0.5), rnd(0, TAU), rnd(-0.4, 0.4));
    d.scale.setScalar(rnd(0.7, 1.35));
    d.updateMatrix();
    petals.setMatrixAt(i, d.matrix);
  }
  worldRoot.add(petals);

  // 岸边苔痕
  for (let i = 0; i < 40; i++) {
    const a = rnd(0.1, 1.5), rr = rnd(3.9, 4.85);
    const x = corner.x - Math.cos(a) * rr, z = corner.y - Math.sin(a) * rr;
    const s = rnd(0.05, 0.13);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 4),
      toonMat({ color: 0x2f7d4f, shade: 0x0e3322, rim: 0x9fffc0, rimStr: 0.25 }));
    tuft.position.set(x, -0.02, z);
    tuft.scale.y = 0.55;
    worldRoot.add(tuft);
  }
})();

/* ------------------------------------------------------------ 水下水晶簇 */
const crystalGroups = [];
function crystalCluster(x, z, scale, hue) {
  const g = new THREE.Group();
  const mat = toonMat({
    color: hue, shade: new THREE.Color(hue).multiplyScalar(0.25).getHex(),
    rim: 0xffffff, rimStr: 0.8, spec: 0xffffff, specStr: 1.2, emissive: 0.35, transparent: true, opacity: 0.9
  });
  const n = rndi(4, 8);
  for (let i = 0; i < n; i++) {
    const h = rnd(0.35, 1.25) * scale;
    const r = rnd(0.08, 0.20) * scale;
    const geo = new THREE.ConeGeometry(r, h, rndi(4, 6));
    const m = new THREE.Mesh(geo, mat);
    const a = rnd(0, TAU), rad = rnd(0, 0.55) * scale;
    m.position.set(Math.cos(a) * rad, h * 0.45, Math.sin(a) * rad);
    m.rotation.set(rnd(-0.45, 0.45), rnd(0, TAU), rnd(-0.45, 0.45));
    g.add(m);
  }
  g.position.set(x, -2.55, z);
  const gl = glowSprite(hue, 3.0 * scale, 0.30);
  gl.position.y = 0.5 * scale;
  g.add(gl);
  worldRoot.add(g);
  crystalGroups.push(g);
  return g;
}

crystalCluster(-3.6, -4.6, 1.15, 0x7ff0ff);
crystalCluster(5.0, -2.4, 1.0, 0xffa6e8);
crystalCluster(-6.8, 0.6, 0.85, 0x8fd0ff);
crystalCluster(1.6, -8.0, 0.9, 0xb98bff);
crystalCluster(8.2, 1.6, 0.75, 0x7ff5d8);
crystalCluster(-1.4, 5.0, 0.7, 0xa8ffe0);

/* ------------------------------------------------------------------ 金鱼 */
const fishes = [];
function makeKoi(bodyColor, patchColor, scale) {
  const g = new THREE.Group();
  const mat = toonMat({ color: bodyColor, shade: new THREE.Color(bodyColor).multiplyScalar(0.35).getHex(), rim: 0xfff0c8, rimStr: 0.75, spec: 0xffffff, specStr: 0.8, emissive: 0.12 });
  const mat2 = toonMat({ color: patchColor, shade: new THREE.Color(patchColor).multiplyScalar(0.4).getHex(), rim: 0xffffff, rimStr: 0.6, emissive: 0.1 });

  const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
  bodyGeo.scale(0.30, 0.24, 0.66);
  const body = new THREE.Mesh(bodyGeo, mat);
  g.add(body);

  const patchGeo = new THREE.SphereGeometry(0.19, 10, 8);
  patchGeo.scale(1, 0.8, 1.6);
  const patch = new THREE.Mesh(patchGeo, mat2);
  patch.position.set(0.10, 0.10, 0.12);
  g.add(patch);

  // 尾鳍
  const tailGroup = new THREE.Group();
  tailGroup.position.z = -0.58;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.22, 0.34, 0.46, 0.40);
  s.quadraticCurveTo(0.36, 0.10, 0.40, -0.02);
  s.quadraticCurveTo(0.36, -0.18, 0.46, -0.42);
  s.quadraticCurveTo(0.20, -0.34, 0, 0);
  const tailGeo = new THREE.ShapeGeometry(s, 8);
  tailGeo.rotateY(Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, mat);
  tail.material = mat;
  tailGroup.add(tail);
  g.add(tailGroup);

  // 背鳍
  const ds = new THREE.Shape();
  ds.moveTo(0, 0);
  ds.quadraticCurveTo(0.10, 0.22, 0.30, 0.10);
  ds.quadraticCurveTo(0.18, 0.0, 0, 0);
  const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(ds, 6), mat);
  dorsal.rotation.y = Math.PI / 2;
  dorsal.position.set(0, 0.20, 0.10);
  g.add(dorsal);

  // 眼睛
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x081018 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    e.position.set(sx * 0.16, 0.05, 0.45);
    g.add(e);
  }

  g.scale.setScalar(scale);
  g.userData.tail = tailGroup;
  worldRoot.add(g);
  return g;
}

const koiDefs = [
  { c1: 0xffd9a0, c2: 0xff8a4c, s: 1.0, r: 5.4, y: -0.75, sp: 0.24, ph: 0.0, cz: 1.5 },
  { c1: 0xfff4e2, c2: 0xff6b4a, s: 0.85, r: 6.6, y: -1.05, sp: -0.18, ph: 2.1, cz: -1.0 },
  { c1: 0xffe9c9, c2: 0xffb35c, s: 0.72, r: 4.4, y: -1.35, sp: 0.30, ph: 4.0, cz: 0.6 }
];
for (const k of koiDefs) {
  const f = makeKoi(k.c1, k.c2, k.s);
  fishes.push({ obj: f, ...k });
}

/* 水下光斑 */
(function underwaterGlow() {
  for (let i = 0; i < 4; i++) {
    const s = glowSprite(0x8fe8ff, rnd(2.0, 3.0), 0.07);
    s.position.set(rnd(-7, 7), rnd(-2.3, -1.6), rnd(-7, 7));
    worldRoot.add(s);
  }
})();
