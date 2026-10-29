import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { P } from './palette.js';
import { rng, rr, v3, mesh, rBox, ico, tube, canvasTexture, makeSoftCloudTexture, TAU, clamp, smoothstep } from './lib.js';
import { MAT, toonRamp, glowSprite } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  A complete square of cloud, two storeys tall:
//    · a pillowy peach-lavender cloud sea
//    · a smaller, gilded sky-pool stage on top
//  The square silhouette stays legible through all the fluff.
// ─────────────────────────────────────────────────────────────

export const BASE = {
  size: 20.2,
  waterSize: 16.0,
  upperSize: 17.5,
  frameInner: 16.05,
  waterY: 0.31,
  deckY: 2.95,
};

// ── rounded square helpers ──────────────────────────────────
export function roundedSquarePoints(size, radius, segmentsPerCorner = 9) {
  const h = size / 2;
  const pts = [];
  const centers = [
    [h - radius, h - radius, 0],
    [-h + radius, h - radius, Math.PI / 2],
    [-h + radius, -h + radius, Math.PI],
    [h - radius, -h + radius, Math.PI * 1.5],
  ];
  for (const [cx, cz, a0] of centers) {
    for (let i = 0; i <= segmentsPerCorner; i++) {
      const a = a0 + i / segmentsPerCorner * Math.PI / 2;
      pts.push(new THREE.Vector2(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius));
    }
  }
  return pts;
}

export function roundedSquareShape(size, radius) {
  const s = new THREE.Shape();
  const pts = roundedSquarePoints(size, radius, 10);
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  s.closePath();
  return s;
}

function roundedSquareHole(size, radius) {
  const p = new THREE.Path();
  const pts = roundedSquarePoints(size, radius, 10);
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
  p.closePath();
  return p;
}

function roundedSquareTube(size, radius, y, tubeR, material, segments = 160) {
  const pts = roundedSquarePoints(size, radius, 10).map(p => v3(p.x, y, p.y));
  pts.push(pts[0].clone());
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, segments, tubeR, 5, false);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = false;
  return m;
}

// ── sky pool water ───────────────────────────────────────────
const waterVert = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;

  void main() {
    vec3 p = position;
    float w1 = sin(p.x * .67 + uTime * .30) * .028;
    float w2 = sin(p.y * .88 - uTime * .21 + 1.7) * .020;
    float w3 = sin((p.x + p.y) * .47 + uTime * .16) * .012;
    p.z += w1 + w2 + w3;
    vUv = uv;

    float dx = cos(p.x * .67 + uTime * .30) * .0288 + cos((p.x + p.y) * .47 + uTime * .16) * .0103;
    float dy = cos(p.y * .88 - uTime * .21 + 1.7) * .0281 + cos((p.x + p.y) * .47 + uTime * .16) * .0103;
    vec3 localN = normalize(vec3(-dx, -dy, 1.0));
    vN = normalize(normalMatrix * localN);
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const waterFrag = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uAqua, uLilac, uPeach, uGold, uRose;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;

  float hash(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p+34.23); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    vec2 uv = vUv;
    vec2 c = uv - .5;
    float r = length(c * vec2(1.0, 1.18));

    float n1 = noise(uv * 4.8 + vec2(uTime * .017, -uTime * .013));
    float n2 = noise(uv * 10.0 - vec2(uTime * .010, uTime * .018));
    vec3 col = mix(uAqua, uLilac, smoothstep(.0, .95, uv.y + c.x * .16 + n1 * .24));
    col = mix(col, uPeach, smoothstep(.48, 1.02, n1 * .72 + uv.y * .48 - .04));
    col = mix(col, uRose, smoothstep(.55, .92, n2) * .34);
    col = mix(col, uGold, smoothstep(.72, 1.0, .5 + .5 * sin((uv.x + uv.y) * 8.5 - uTime * .15)) * .15);

    // painted cloud reflections
    float band = smoothstep(.47, .82, noise(uv * vec2(3.0, 6.0) + vec2(uTime*.012, 0.0)));
    col = mix(col, vec3(1.0, .93, .94), band * .16);
    float band2 = smoothstep(.6, .9, noise(uv * vec2(6.5, 2.4) - vec2(uTime*.008, .0) + 4.0));
    col = mix(col, vec3(.95, .86, 1.0), band2 * .14);

    // a broad path of sunset on the water
    float sunStreak = exp(-pow((uv.x - .67) * 3.6 + (uv.y - .45) * 1.4, 2.0) * 6.0);
    col += uGold * sunStreak * (.20 + fres * .45);
    col += uPeach * fres * .18;

    // tiny caustic glints
    float caustic = sin(uv.x * 93.0 + uTime * .38 + sin(uv.y * 25.0) * 2.0)
                  * sin(uv.y * 80.0 - uTime * .31 + sin(uv.x * 21.0) * 2.0);
    float glint = smoothstep(.92, 1.0, caustic) * smoothstep(.03, .4, fres);
    col += vec3(1.0, .9, .68) * glint * .85;

    // thin iridescent surface film
    vec3 iri = .5 + .5 * cos(6.28318 * (fres * 1.3 + vec3(0.0, .33, .67) + vec3(uv.x * .15 + .04)));
    col = mix(col, iri, .07 + fres * .12);
    col += fres * vec3(1.0, .81, .69) * .18;

    // darken the inside corners just a touch, keeping an illuminated rim
    float edge = smoothstep(.34, .47, max(abs(c.x), abs(c.y)));
    col = mix(col, col * vec3(1.04, .98, 1.07) + vec3(.045,.03,.06), edge * .28);
    float rim = smoothstep(.44, .49, max(abs(c.x), abs(c.y)));
    col += vec3(1.0, .84, .58) * rim * .12;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeWater() {
  const geo = new THREE.PlaneGeometry(BASE.waterSize, BASE.waterSize, 96, 96);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAqua: { value: new THREE.Color('#6fcbdc') },
      uLilac: { value: new THREE.Color('#ba9ce8') },
      uPeach: { value: new THREE.Color('#ffad92') },
      uGold: { value: new THREE.Color('#ffd786') },
      uRose: { value: new THREE.Color('#ff93b8') },
    },
    vertexShader: waterVert,
    fragmentShader: waterFrag,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = BASE.waterY;
  m.receiveShadow = false;
  return m;
}

// ── the soft, luminous cloud material ───────────────────────
const cloudVert = `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vColor;
  varying vec3 vWorld;
  void main() {
    mat4 im = mat4(1.0);
    #ifdef USE_INSTANCING
      im = instanceMatrix;
    #endif
    vec4 wp = modelMatrix * im * vec4(position, 1.0);
    vWorld = wp.xyz;
    mat3 nm = mat3(modelMatrix) * mat3(im);
    vN = normalize(nm * normal);
    vV = normalize(cameraPosition - wp.xyz);
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(1.0);
    #endif
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const cloudFrag = `
  precision highp float;
  uniform vec3 uWarm, uCool, uRim, uShade, uLightDir;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vColor;
  varying vec3 vWorld;

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    vec3 L = normalize(uLightDir);
    float up = N.y * .5 + .5;
    float ndl = dot(N, L) * .5 + .5;
    float band = smoothstep(.28,.34,ndl) * .18
               + smoothstep(.50,.56,ndl) * .19
               + smoothstep(.73,.79,ndl) * .17;
    vec3 base = mix(vColor * uWarm, vColor * uCool, smoothstep(.08,.9,up));
    base *= .70 + band + .10 * up;
    base = mix(base, base * uShade, (1.0 - up) * .26);
    float rim = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.4);
    base += uRim * rim * .16;
    base += uWarm * smoothstep(.55,.0,up) * .07;
    float underGlow = smoothstep(.7, -2.8, vWorld.y);
    base += uWarm * underGlow * .075;
    float m = sin(vColor.r*10.0 + N.x*3.1 + N.y*4.7 + uTime*.04);
    base *= .985 + m * .012;
    // let the silhouette sigh into the air instead of ending on a hard edge
    float facing = clamp(dot(N,V), 0.0, 1.0);
    float alpha = .40 + .60 * pow(facing, .38);
    gl_FragColor = vec4(base, alpha);
  }
`;

function makeCloudPuffMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: cloudVert,
    fragmentShader: cloudFrag,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uWarm: { value: new THREE.Color('#ffdccb') },
      uCool: { value: new THREE.Color('#edf1ff') },
      uRim: { value: new THREE.Color('#fff0dc') },
      uShade: { value: new THREE.Color('#a9a1c8') },
      uLightDir: { value: new THREE.Vector3(8.5, 18.5, 12).normalize() },
      uTime: { value: 0 },
    },
  });
}

function makeCloudClusterGeometry() {
  const lobes = [
    { p:[0,0,0], s:[1.0,.86,1.0] },
    { p:[.72,.10,.24], s:[.78,.64,.78] },
    { p:[-.62,.08,-.15], s:[.68,.64,.62] },
    { p:[.18,.42,-.40], s:[.55,.56,.54] },
    { p:[-.22,.30,.48], s:[.60,.48,.58] },
    { p:[.16,-.35,.26], s:[.58,.36,.56] },
  ];
  const parts = [];
  for (const l of lobes) {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(l.p[0], l.p[1], l.p[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(l.s[1]*.3, l.s[0]*1.7, l.s[2]*.2)),
      new THREE.Vector3(l.s[0],l.s[1],l.s[2])
    );
    g.applyMatrix4(m);
    g.deleteAttribute('uv');
    parts.push(g);
  }
  let geo = mergeGeometries(parts, false);
  const p = geo.attributes.position;
  for (let i=0;i<p.count;i++){
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const n = 1 + .055*Math.sin(x*5.1+y*2.2+1.1)*Math.cos(z*4.3) + .03*Math.sin(y*7.2+z*4.7);
    p.setXYZ(i,x*n,y*n,z*n);
  }
  geo.computeVertexNormals();
  // normalize the cloud cluster to a friendly radius of 1 so that the
  // hand-authored scale values in the layout remain meaningful
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const maxAbs = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x), Math.abs(bb.min.z), Math.abs(bb.max.z), Math.abs(bb.min.y), Math.abs(bb.max.y));
  const inv = 1 / maxAbs;
  geo.scale(inv, inv, inv);
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

// ── cloud records ───────────────────────────────────────────
function buildPuffRecords() {
  const r = rng(20241030);
  const recs = [];
  const cream = ['#fffdf9', '#fff9f3', '#fff4ee', '#fffaf5', '#fff1ed'];
  const blush = ['#fff0f2', '#ffe9ed', '#ffeef4', '#ffe7ee'];
  const cool  = ['#f5f0ff', '#edf3ff', '#f7f1fd'];
  const peach = ['#fff2e6', '#ffeadf', '#fff4e8'];
  const pick = (a) => a[Math.floor(r()*a.length)];
  const add = (x,y,z,sx,sy,sz,color,phase) => recs.push({x,y,z,sx,sy,sz,color,rot:r()*TAU,phase});
  const half = BASE.size/2;
  const corners = [[1,1],[1,-1],[-1,-1],[-1,1]];
  const dirs = [
    { nx:0, nz:1, tx:1, tz:0 },
    { nx:1, nz:0, tx:0, tz:-1 },
    { nx:0, nz:-1, tx:-1, tz:0 },
    { nx:-1, nz:0, tx:0, tz:1 },
  ];

  for (const dir of dirs) {
    // three overlapping floss rows blanket the top border
    for (let i=0;i<26;i++){
      const t = (-.95 + i/19*1.90) * half;
      const sz = .28 + r()*.32;
      const sx = .24 + r()*.26;
      const off = half - sz*.9 - .02;
      add(dir.nx*off + dir.tx*t, .09 + r()*.12, dir.nz*off + dir.tz*t,
          dir.tx ? sz*1.55 : sx, .22 + r()*.22, dir.tz ? sz*1.55 : sx,
          pick(r()<.18?blush:cream), r()*TAU);
    }
    for (let i=0;i<20;i++){
      const t = (-.93 + i/19*1.86) * (half-.55);
      const sz = .26 + r()*.32;
      const off = half - .53 + (r()-.5)*.12;
      add(dir.nx*off + dir.tx*t, .18 + r()*.13, dir.nz*off + dir.tz*t,
          dir.tx?sz*1.5:sz*1.1, .19 + r()*.16, dir.tz?sz*1.5:sz*1.1,
          pick(r()<.2?peach:cream), r()*TAU);
    }
    for (let i=0;i<14;i++){
      const t = (-.92 + i/13*1.84) * (half-1.0);
      const sz = .22 + r()*.28;
      const off = half - 1.02 + (r()-.5)*.12;
      add(dir.nx*off + dir.tx*t, .24 + r()*.08, dir.nz*off + dir.tz*t,
          dir.tx?sz*1.4:sz, .16 + r()*.13, dir.tz?sz*1.4:sz,
          pick(r()<.15?blush:cream), r()*TAU);
    }
    // broad soft shoulders, side lobes and skirt
    for (let i=0;i<8;i++){
      const t = (-.82 + i/7*1.64) * (half-.3);
      const size = .55 + r()*.4;
      const off = half - size*.82;
      add(dir.nx*off + dir.tx*t, -.18 - r()*.12, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.8:1.0), size*.5, size*(dir.tz?1.8:1.0),
          pick(r()<.2?peach:cream), r()*TAU);
    }
    for (let i=0;i<7;i++){
      const t = (-.84 + i/6*1.68) * (half-.15);
      const size = .62 + r()*.45;
      const off = half - size*.55;
      add(dir.nx*off + dir.tx*t, -.88 - r()*.18, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.55:1.0), size*.55, size*(dir.tz?1.55:1.0),
          pick(r()<.24?peach:cream), r()*TAU);
    }
    for (let i=0;i<6;i++){
      const t = (-.82 + i/5*1.64) * (half-.15);
      const size = .62 + r()*.46;
      const off = half - size*.48;
      add(dir.nx*off + dir.tx*t, -1.64 - r()*.2, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.35:1.0), size*.58, size*(dir.tz?1.35:1.0),
          pick(r()<.3?blush:cream), r()*TAU);
    }
    for (let i=0;i<5;i++){
      const t = (-.78 + i/4*1.56) * (half-.2);
      const size = .45 + r()*.34;
      const off = half - size*.65;
      add(dir.nx*off + dir.tx*t, -2.34 - r()*.16, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.35:1.0), size*.52, size*(dir.tz?1.35:1.0),
          pick(cream), r()*TAU);
    }
    // small frosted cloudlets around the pool rim
    for (let i=0;i<15;i++){
      const t = (-.87 + i/14*1.74) * (BASE.upperSize/2);
      const size = .18 + r()*.25;
      const off = BASE.upperSize/2 - .17 + (r()-.5)*.14;
      add(dir.nx*off + dir.tx*t, .40 + r()*.11, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.55:1.1), .14 + r()*.18, size*(dir.tz?1.55:1.1),
          pick(r()<.22?blush:cream), r()*TAU);
    }
    for (let i=0;i<10;i++){
      const t = (-.85 + i/9*1.7) * (BASE.upperSize/2);
      const size = .14 + r()*.23;
      const off = BASE.upperSize/2 - .32 + (r()-.5)*.12;
      add(dir.nx*off + dir.tx*t, .52 + r()*.08, dir.nz*off + dir.tz*t,
          size*(dir.tx?1.35:1.0), .12 + r()*.15, size*(dir.tz?1.35:1.0),
          pick(r()<.18?peach:cream), r()*TAU);
    }
  }

  // bulbous corner curls
  for (const [sx,sz] of corners) {
    for (let k=0;k<5;k++){
      const size=.45+r()*.45;
      add(sx*(half-.5), -.10-k*.50, sz*(half-.5),
          size*1.3, size*.5, size*1.2, pick(r()<.2?blush:cream), r()*TAU);
    }
    for (let k=0;k<2;k++){
      add(sx*(half-.28), .18+k*.08, sz*(half-.28),
          .30+r()*.2, .18+r()*.1, .30+r()*.2, pick(cream), r()*TAU);
    }
    add(sx*(BASE.upperSize/2-.24), .48, sz*(BASE.upperSize/2-.24),
        .24+r()*.18, .16+r()*.11, .24+r()*.18, pick(blush), r()*TAU);
  }
  // hanging feathery underbelly
  for (let i=0;i<20;i++){
    const a=r()*TAU;
    const rad=4.6+r()*4.6;
    const size=.4+r()*.55;
    add(Math.cos(a)*rad, -3.10-r()*.22, Math.sin(a)*rad,
        size*1.2, size*(.18+r()*.20), size*.9, pick(r()<.5?cream:peach), r()*TAU);
  }
  // tiny soft crumbs
  for (let i=0;i<34;i++){
    const dir = dirs[Math.floor(r()*4)];
    const t=(r()-.5)*1.8*half;
    const size=.10+r()*.18;
    const off = half - (r()*.45 + .18);
    add(dir.nx*off+dir.tx*t, -.18-r()*2.1, dir.nz*off+dir.tz*t,
        size*1.2, size*.55, size*1.1, pick(r()<.2?blush:cream), r()*TAU);
  }
  return recs;
}

function makeCloudPuffs() {
  const recs = buildPuffRecords();
  const geo = makeCloudClusterGeometry();
  const mat = makeCloudPuffMaterial();
  const inst = new THREE.InstancedMesh(geo, mat, recs.length);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  inst.castShadow = false;
  inst.receiveShadow = false;
  inst.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  for (let i=0;i<recs.length;i++){
    c.set(recs[i].color);
    inst.setColorAt(i, c);
  }
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  const baseY = recs.map(r=>r.y);
  const baseX = recs.map(r=>r.x);
  const baseZ = recs.map(r=>r.z);
  const PUFF_SCALE = 1.28;
  function apply(t) {
    for (let i=0;i<recs.length;i++){
      const rec = recs[i];
      dummy.position.set(
        baseX[i] + Math.sin(t*.11 + rec.phase)*.025,
        baseY[i] + Math.sin(t*.25 + rec.phase)*.045,
        baseZ[i] + Math.cos(t*.09 + rec.phase*1.3)*.02
      );
      dummy.rotation.set(Math.sin(t*.07+rec.phase)*.04, rec.rot, Math.cos(t*.06+rec.phase)*.03);
      const breathe = 1 + Math.sin(t*.20 + rec.phase)*.01;
      dummy.scale.set(rec.sx*PUFF_SCALE*breathe, rec.sy*PUFF_SCALE, rec.sz*PUFF_SCALE*breathe);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    mat.uniforms.uTime.value = t;
  }
  apply(0);
  return { inst, apply };
}

// ── base assembly ───────────────────────────────────────────
let CLOUD_SKIN;
function cloudSkinTexture() {
  return canvasTexture(512, 512, (ctx,w,h) => {
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#fffcf8');
    g.addColorStop(.4,'#fff7f0');
    g.addColorStop(.75,'#ffefe9');
    g.addColorStop(1,'#ffe9e3');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    const r = rng(771);
    for (let i=0;i<120;i++){
      const x=r()*w, y=r()*h, rad=20+r()*90;
      const cg=ctx.createRadialGradient(x,y,0,x,y,rad);
      const c = ['255,251,244','255,236,232','247,235,250','255,243,231'][i%4];
      cg.addColorStop(0,'rgba('+c+',.25)');
      cg.addColorStop(1,'rgba('+c+',0)');
      ctx.fillStyle=cg; ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
    }
    for (let i=0;i<700;i++){
      ctx.fillStyle = i%3?'rgba(255,255,255,.16)':'rgba(255,194,187,.08)';
      ctx.beginPath(); ctx.arc(r()*w,r()*h,.6+r()*2.2,0,7); ctx.fill();
    }
    // suggestions of soft billows
    ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.lineWidth=10;
    for (let i=0;i<9;i++){
      ctx.beginPath(); ctx.arc(r()*w, h*.65+r()*h*.2, 50+r()*120, Math.PI*1.1, Math.PI*1.95); ctx.stroke();
    }
  }, { repeat:[1.4,1.4] });
}

const massVert = `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main(){
    vLocal = position;
    vec4 wp = modelMatrix * vec4(position,1.0);
    vWorld = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const massFrag = `
  precision highp float;
  uniform vec3 uTop,uMid,uBottom,uRim,uShade,uLightDir;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main(){
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    vec3 L = normalize(uLightDir);
    float up = N.y*.5+.5;
    float ndl = dot(N,L)*.5+.5;
    vec3 base = mix(uBottom,uMid,smoothstep(.05,.6,up));
    base = mix(base,uTop,smoothstep(.45,1.0,up));
    float band = smoothstep(.30,.36,ndl)*.19 + smoothstep(.52,.58,ndl)*.18 + smoothstep(.74,.8,ndl)*.15;
    base *= .68 + band + .08*up;
    base = mix(base, base*uShade, (1.0-up)*.22);
    // quiet airy mottling
    vec3 q = vWorld * .7;
    float m = sin(q.x*1.1 + sin(q.z*.8+uTime*.02)*2.0) * sin(q.y*1.4 + q.z*.9)
            + .5*sin(q.x*2.2 - q.z*1.7 + .8);
    base *= .96 + m*.020;
    float rim = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.3);
    base += uRim*rim*.24;
    base += uMid * smoothstep(-.2,.5,vLocal.y) * .02;
    base += vec3(1.0,.72,.62) * smoothstep(.1,-3.0,vWorld.y) * .05;
    gl_FragColor = vec4(base,1.0);
  }
`;
function makeCloudMassMaterial(){
  CLOUD_SKIN = CLOUD_SKIN || cloudSkinTexture();
  return new THREE.ShaderMaterial({
    uniforms:{
      uTop:{value:new THREE.Color('#fffaff')},
      uMid:{value:new THREE.Color('#fff1f4')},
      uBottom:{value:new THREE.Color('#f8e3e6')},
      uRim:{value:new THREE.Color('#fff1d8')},
      uShade:{value:new THREE.Color('#a29bca')},
      uLightDir:{value:new THREE.Vector3(8.5,18.5,12).normalize()},
      uTime:{value:0},
    },
    vertexShader:massVert, fragmentShader:massFrag,
  });
}
function makeCloudMassGeometry(w=20.2,h=3.3,d=20.2){
  const geo = new RoundedBoxGeometry(w,h,d,16,2.2);
  const pos=geo.attributes.position, nor=geo.attributes.normal;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const nx=nor.getX(i), ny=nor.getY(i), nz=nor.getZ(i);
    const bump = .085*Math.sin(x*.82 + z*.63 + y*1.5 + 1.3)
               + .062*Math.cos(z*1.15 - x*.5 + y*1.1)
               + .035*Math.sin(x*2.4 - z*1.8 + .7)
               + .022*Math.cos(y*4.1 + z*2.5);
    pos.setXYZ(i, x+nx*bump, y+ny*bump*.8, z+nz*bump);
  }
  geo.computeVertexNormals();
  return geo;
}

function makeLowerLoaf() {
  const g = new THREE.Group();
  CLOUD_SKIN = CLOUD_SKIN || cloudSkinTexture();
  const mass = new THREE.Mesh(makeCloudMassGeometry(), makeCloudMassMaterial());
  mass.position.y = -1.6;
  mass.castShadow = true; mass.receiveShadow = true;
  g.add(mass);
  // gentle upper frosting shelf that lifts the pool stage
  const shelfGeo = new RoundedBoxGeometry(BASE.size+.06,.36,BASE.size+.06,8,1.75);
  const shelfMat = makeCloudMassMaterial();
  const shelf = new THREE.Mesh(shelfGeo, shelfMat);
  shelf.position.y = -.08;
  shelf.castShadow = true; shelf.receiveShadow = true;
  g.add(shelf);
  return { group:g, mass, shelf };
}

function makeLowerLoafOld() {
  const g = new THREE.Group();
  // Three overlapping cloud layers.  The lower ones are a touch wider,
  // so their scalloped shoulders remain visible from above.
  const tiers = [
    { w: 20.2, h: 1.42, y: -.62, color: '#fff8f1', em: '#ffd0c3' },
    { w: 20.62, h: 1.20, y: -1.66, color: '#fff2ea', em: '#ffc8bf' },
    { w: 20.16, h: .92, y: -2.52, color: '#fff6f0', em: '#ffd3c8' },
  ];
  for (let i=0;i<tiers.length;i++){
    const t=tiers[i];
    CLOUD_SKIN = CLOUD_SKIN || cloudSkinTexture();
    const m = new THREE.MeshToonMaterial({
      color:t.color, map:CLOUD_SKIN, gradientMap:toonRamp,
      emissive:new THREE.Color(t.em), emissiveIntensity:.035,
    });
    const slab = mesh(rBox(t.w, t.h, t.w, 2.2, 8), m, { pos:[0,t.y,0] });
    slab.castShadow = true; slab.receiveShadow = true;
    g.add(slab);
  }
  // a soft, wide cap where the puffy border begins
  CLOUD_SKIN = CLOUD_SKIN || cloudSkinTexture();
  const cap = mesh(rBox(BASE.size+.12, .34, BASE.size+.12, 2.0, 6), new THREE.MeshToonMaterial({
    color:'#fffaf5', map:CLOUD_SKIN, gradientMap:toonRamp,
    emissive:'#ffd6c6', emissiveIntensity:.04,
  }), { pos:[0,-.06,0] });
  cap.receiveShadow = true; cap.castShadow = true;
  g.add(cap);
  return g;
}

function makeUpperStage() {
  const g = new THREE.Group();
  const outer = BASE.upperSize;
  const inner = BASE.frameInner;
  const frameShape = roundedSquareShape(outer, 1.55);
  frameShape.holes.push(roundedSquareHole(inner, 1.35));
  const depth = .48;
  const geo = new THREE.ExtrudeGeometry(frameShape, {
    depth, bevelEnabled: true, bevelSegments: 3, steps: 1,
    bevelSize: .075, bevelThickness: .055, curveSegments: 18,
  });
  geo.rotateX(-Math.PI/2);
  const frameMat = new THREE.MeshPhysicalMaterial({
    color:'#ffe0d5', roughness: .18, metalness: .02,
    clearcoat: 1, clearcoatRoughness: .14,
    iridescence: .55, iridescenceIOR: 1.26,
    transparent: true, opacity: .93, side: THREE.DoubleSide,
    envMapIntensity: .85,
  });
  const frame = new THREE.Mesh(geo, frameMat);
  frame.position.y = -.08;
  frame.castShadow = true; frame.receiveShadow = true;
  g.add(frame);

  // the pearly gold border
  g.add(roundedSquareTube(outer + .02, 1.57, .445, .035, MAT.brass));
  g.add(roundedSquareTube(inner + .01, 1.35, .435, .020, new THREE.MeshBasicMaterial({
    color:new THREE.Color('#fff0c7').multiplyScalar(1.15), toneMapped:false
  })));
  g.add(roundedSquareTube(outer + .20, 1.66, -.16, .024, MAT.brassSoft));

  // a quiet, deep bottom for the water
  const bed = mesh(rBox(inner-.03, .10, inner-.03, 1.25, 5), new THREE.MeshToonMaterial({
    color:'#8ed4de', gradientMap: toonRamp, emissive:'#6dafcc', emissiveIntensity:.10,
  }), { pos:[0,.06,0] });
  bed.receiveShadow = false;
  g.add(bed);

  // warm inner glow just under the water's edge
  for (let i=0;i<6;i++){
    const s = glowSprite(i%2?'pink':'gold', 1.1+i*.4, .05);
    s.position.set((i%3-1)*5.2, .22, (i%2?1:-1)*3.8);
    g.add(s);
  }
  return g;
}

function makeSparkleRings() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fff2d2').multiplyScalar(1.4),
    transparent: true, opacity: .20, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const specs = [
    [7.0, 3.1, .42], [7.35, 3.35, .52], [7.7, 3.6, .38],
  ];
  for (const [rx, rz, y] of specs) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(.955, 1, 128), mat.clone());
    ring.rotation.x = -Math.PI/2;
    ring.position.y = y;
    ring.scale.set(rx, rz, 1);
    ring.userData = { baseScale: rx, baseZ: rz, phase: rx * 2.3 };
    g.add(ring);
  }
  const update = (t) => {
    for (const ring of g.children) {
      const k = 1 + Math.sin(t * .15 + ring.userData.phase) * .035;
      ring.scale.set(ring.userData.baseScale * k, ring.userData.baseZ * k, 1);
      ring.material.opacity = .11 + .09 * (0.5 + 0.5 * Math.sin(t * .15 + ring.userData.phase));
    }
  };
  return { g, update };
}

function makeUnderglow() {
  const g = new THREE.Group();
  const tex = makeSoftCloudTexture(256);
  const mat = new THREE.SpriteMaterial({
    map: tex, color: '#ffbca8', transparent: true, opacity: .22,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const specs = [
    [0, -2.1, 3.5, 17], [0, -2.7, -4.5, 19], [-4.5, -2.2, 5.0, 13],
    [4.8, -1.7, 5.5, 12], [-6.5, -2.4, -4.0, 11], [6.2, -2.1, -5.1, 12],
  ];
  for (const [x,y,z,s] of specs) {
    const sp = new THREE.Sprite(mat.clone()); sp.position.set(x,y,z); sp.scale.set(s*1.35,s*.65,1); g.add(sp);
  }
  g.userData.base = g.children.map(c=>c.position.y);
  return g;
}

function makeGoldenCharm(x,z,y) {
  const g = new THREE.Group();
  g.position.set(x,y,z);
  const chain = mesh(new THREE.CylinderGeometry(.006,.006,.35,4), MAT.brassSoft, { pos:[0,-.175,0] });
  g.add(chain);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.09,1), MAT.brass);
  star.position.y = -.4; star.scale.y = 1.4;
  g.add(star);
  return g;
}

function makeFluffyCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,512,512);
  ctx.filter = 'blur(14px)';
  const lobes = [
    [150,290,95,.42],[230,255,125,.52],[315,280,110,.48],[390,315,80,.38],
    [195,330,100,.38],[280,330,130,.42],[355,345,90,.38],[110,345,70,.3],
    [260,200,75,.34],[335,215,70,.28],[200,380,120,.24],[310,400,130,.26],
  ];
  for (const [x,y,r,a] of lobes){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(255,250,244,'+a+')');
    g.addColorStop(.55,'rgba(255,238,234,'+(a*.55)+')');
    g.addColorStop(1,'rgba(255,225,224,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRimMist() {
  const g = new THREE.Group();
  const tex = makeFluffyCloudTexture();
  const specs = [
    [0,.25,9.8,9,.30], [5.2,.32,8.4,7,.26], [-5.2,.22,8.4,7.5,.27],
    [9.7,.22,2.5,8,.26], [9.8,.2,-1.8,7,.24], [-9.7,.18,2.5,8.2,.26],
    [-9.8,.16,-1.8,7,.24], [0,.14,-9.7,8.4,.22],
    [6.0,-.8,8.9,7,.20], [-6.4,-.9,8.6,7,.20],
    [9.6,-.9,-4.4,6.3,.18], [-9.5,-1.0,-4.4,6.3,.18],
    [2.8,-1.3,9.3,6.5,.16], [-2.8,-1.35,9.3,6.5,.16],
  ];
  for (const [x,y,z,s,o] of specs) {
    const m = new THREE.SpriteMaterial({ map:tex, color:'#fff4ec', transparent:true, opacity:o, depthWrite:false, toneMapped:true });
    const sp = new THREE.Sprite(m);
    sp.position.set(x,y,z);
    sp.scale.set(s*1.55,s*.78,1);
    sp.renderOrder = 2;
    g.add(sp);
  }
  return g;
}

export function createCloudBase() {
  const group = new THREE.Group();
  group.name = 'cloud-base';

  const lower = makeLowerLoaf();
  group.add(lower.group);
  const upper = makeUpperStage();
  group.add(upper);

  const water = makeWater();
  group.add(water);

  // a single quiet pearl line hides under the top floss
  group.add(roundedSquareTube(BASE.size + .04, 2.1, .015, .012, new THREE.MeshBasicMaterial({ color:'#ffedc8', transparent:true, opacity:.38, toneMapped:false }), 180));

  // fluffy clouds sit outside the gold stage lines
  const { inst, apply } = makeCloudPuffs();
  group.add(inst);
  group.add(makeRimMist());

  // star jewellery at the four corners of the lower rim
  const corners = [[1,1],[1,-1],[-1,1],[-1,-1]];
  for (const [sx,sz] of corners) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.14,0), MAT.brass);
    star.position.set(sx*(BASE.size/2-.18), -.05, sz*(BASE.size/2-.18));
    star.scale.set(1.2,.7,1.2);
    group.add(star);
    if (sx*sz > 0) {
      const charm = makeGoldenCharm(sx*(BASE.size/2-.22), sz*(BASE.size/2-.15), -1.0);
      group.add(charm);
    }
  }

  const underglow = makeUnderglow();
  group.add(underglow);
  // a broad soft cloud field under the whole cake, so it floats in fluff
  const floorTex = makeFluffyCloudTexture();
  for (let i=0;i<7;i++){
    const m = new THREE.SpriteMaterial({ map:floorTex, color:i%2?'#ffe4db':'#fff1e6', transparent:true, opacity:.16, depthWrite:false });
    const sp = new THREE.Sprite(m);
    const a = i/7*TAU;
    sp.position.set(Math.cos(a)*5.1, -3.1+Math.sin(i)*.1, Math.sin(a)*5.1);
    sp.scale.set(10+i,3.2+i*.3,1);
    group.add(sp);
  }

  const rings = makeSparkleRings();
  group.add(rings.g);

  // drifting cloud petals on the pond
  const r = rng(451);
  for (let i=0;i<12;i++) {
    const ang = r()*TAU;
    const rad = 5.6 + r()*2.4;
    const p = mesh(ico(.11,1), new THREE.MeshToonMaterial({ color:'#ffd7df', gradientMap: toonRamp }), {
      pos:[Math.cos(ang)*rad, BASE.waterY + .075, Math.sin(ang)*rad],
      scale:[1.6+r()*.7, .28, .75+r()*.4], rot:[0, r()*TAU, 0]
    });
    p.castShadow = false; p.receiveShadow = false;
    group.add(p);
  }

  // fat under-light glow so the cotton sea feels lit from inside
  const underLights = [
    [-2.5, -1.4, 0.0, '#ffae98', 5.2, 12],
    [4.5, -1.5, 3.5, '#ffd0a9', 3.5, 11],
    [-5.0, -1.8, 4.2, '#ffb8be', 2.5, 9],
  ];
  for (const [x,y,z,c,i,dist] of underLights) {
    const l = new THREE.PointLight(c, i, dist, 2);
    l.position.set(x,y,z);
    group.add(l);
  }

  const underBase = underglow.userData.base;
  function update(t) {
    apply(t);
    water.material.uniforms.uTime.value = t;
    rings.update(t);
    inst.material.uniforms.uTime.value = t;
    if (lower.mass.material.uniforms?.uTime) lower.mass.material.uniforms.uTime.value = t;
    if (lower.shelf.material.uniforms?.uTime) lower.shelf.material.uniforms.uTime.value = t;
    underglow.children.forEach((s,i)=>{ s.position.y = underBase[i] + Math.sin(t*.08+i)*.08; });
  }

  return { group, update, inst, water };
}