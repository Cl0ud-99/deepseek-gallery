import * as THREE from 'three';
import { P } from './palette.js';
import {
  rng, v3, mesh, rBox, ico, sphere, cyl, tube, inkOutline,
  canvasTexture, softShadowPlane, TAU, clamp, smoothstep, roundedRectPath,
} from './lib.js';
import { toonRamp, MAT, TEX, JELLY, GLOW_TEX, STAR_TEX, glowSprite, glow, toon, brassMaterial } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  白玉飞空鲸
//  A sculpted, softly-lit sky whale whose back is a small green
//  island. Its fins are thin porcelain, edged in gold.
// ─────────────────────────────────────────────────────────────

export const DECK_Y = 2.80;
export const PLATFORM_Y = 2.72;

const BODY_LEN = 14.8;
const BODY_X0 = -7.4;
const SEG_LONG = 92;
const SEG_AROUND = 48;

const profile = [
  { t: 0.000, w: 0.035, h: 0.045, cy: 1.50 },
  { t: 0.025, w: 0.63, h: 0.40, cy: 1.39 },
  { t: 0.075, w: 1.52, h: 0.80, cy: 1.29 },
  { t: 0.145, w: 2.37, h: 1.10, cy: 1.23 },
  { t: 0.240, w: 2.83, h: 1.31, cy: 1.23 },
  { t: 0.380, w: 3.00, h: 1.42, cy: 1.26 },
  { t: 0.520, w: 2.96, h: 1.42, cy: 1.30 },
  { t: 0.640, w: 2.66, h: 1.31, cy: 1.37 },
  { t: 0.760, w: 2.08, h: 1.08, cy: 1.47 },
  { t: 0.850, w: 1.49, h: 0.80, cy: 1.58 },
  { t: 0.930, w: 0.82, h: 0.45, cy: 1.68 },
  { t: 0.980, w: 0.27, h: 0.16, cy: 1.76 },
  { t: 1.000, w: 0.055, h: 0.06, cy: 1.80 },
];

function profileAt(t) {
  t = clamp(t, 0, 1);
  let i = 0;
  while (i < profile.length - 2 && t > profile[i + 1].t) i++;
  const a = profile[i], b = profile[i + 1];
  const k = clamp((t - a.t) / (b.t - a.t), 0, 1);
  const f = k * k * (3 - 2 * k);
  return {
    t,
    w: a.w + (b.w - a.w) * f,
    h: a.h + (b.h - a.h) * f,
    cy: a.cy + (b.cy - a.cy) * f,
  };
}

export function whaleSection(t, theta) {
  const p = profileAt(t);
  const cx = BODY_X0 + BODY_LEN * t;
  const cz = Math.sin(t * Math.PI) * 0.19 - t * 0.06;
  const z = p.w * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), .9);
  const y = p.h * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), .82);
  return {
    x: cx, y: p.cy + y, z: cz + z,
    top: p.cy + p.h,
    width: p.w,
    height: p.h,
    centerY: p.cy,
    centerZ: cz,
  };
}

const whaleVert = `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vLocal;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vLocal = position;
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const whaleFrag = `
  precision highp float;
  uniform vec3 uTop, uSide, uBelly, uRim, uAurora, uShadow;
  uniform vec3 uLight;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vLocal;

  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vV);
    vec3 l = normalize(uLight);

    float top = smoothstep(-.15, 2.66, vLocal.y);
    float bandTop = smoothstep(1.10, 2.45, vLocal.y);
    vec3 base = mix(uBelly, uSide, smoothstep(-.25, .85, vLocal.y));
    base = mix(base, uTop, smoothstep(.28, 1.0, bandTop));

    float ndl = dot(n, l) * .5 + .5;
    float lightBand = smoothstep(.30,.36,ndl) * .19
                    + smoothstep(.50,.56,ndl) * .18
                    + smoothstep(.72,.78,ndl) * .15
                    + smoothstep(.86,.91,ndl) * .10;
    base *= .64 + lightBand;

    // cool shadow pooled along the flank
    float under = smoothstep(.55, .95, 1.0 - top);
    base = mix(base, uShadow, under * .12);

    // warm light glowing through the rim
    float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.05);
    base += uRim * rim * .58;
    float through = pow(max(dot(-n, l), 0.0), 2.2);
    base += uRim * through * .12;
    base = mix(base, uBelly, smoothstep(.35, 0.0, top) * .24);

    // opaline aurora along the back
    float aurora = smoothstep(.55, 1.0, bandTop) * smoothstep(2.0, .8, abs(vLocal.z));
    float ribbon = .5 + .5 * sin(vLocal.x * .95 + uTime * .30 + vLocal.z * 1.7);
    base = mix(base, uAurora, aurora * (.18 + ribbon * .18));
    base += uAurora * aurora * .05;

    // pearly sheen
    vec3 h = normalize(l + v);
    base += vec3(1.0, .96, .88) * pow(max(dot(n, h), 0.0), 11.0) * .12;

    // translucent marble veins
    float vein = smoothstep(.94, 1.0, .5 + .5 * sin(vLocal.x * 3.9 + sin(vLocal.y * 5.2) * 2.0 + vLocal.z * 1.5));
    base = mix(base, uRim, vein * .08);

    gl_FragColor = vec4(base, uOpacity);
  }
`;

function makeWhaleMaterial(doubleSide = false, opacity = .955) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color('#d4ebe3') },
      uSide: { value: new THREE.Color('#a7d2ce') },
      uBelly: { value: new THREE.Color('#f5c5c0') },
      uRim: { value: new THREE.Color('#ffedc7') },
      uAurora: { value: new THREE.Color('#a8e3d2') },
      uShadow: { value: new THREE.Color('#7baeb5') },
      uLight: { value: new THREE.Vector3(-.4, .82, .55).normalize() },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
    },
    vertexShader: whaleVert,
    fragmentShader: whaleFrag,
    transparent: true,
    depthWrite: true,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function makeBodyGeometry() {
  const pos = [], idx = [];
  for (let i = 0; i <= SEG_LONG; i++) {
    const t = i / SEG_LONG;
    for (let j = 0; j <= SEG_AROUND; j++) {
      const theta = j / SEG_AROUND * TAU;
      const p = whaleSection(t, theta);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < SEG_LONG; i++) {
    for (let j = 0; j < SEG_AROUND; j++) {
      const a = i * (SEG_AROUND + 1) + j;
      const b = (i + 1) * (SEG_AROUND + 1) + j;
      const c = (i + 1) * (SEG_AROUND + 1) + j + 1;
      const d = i * (SEG_AROUND + 1) + j + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── fins ────────────────────────────────────────────────────
function finGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.28, .35, .63, .99, 1.15, 1.58);
  s.bezierCurveTo(1.75, 2.25, 2.65, 2.86, 3.42, 2.62);
  s.bezierCurveTo(3.84, 2.48, 3.52, 2.03, 3.20, 1.74);
  s.bezierCurveTo(2.88, 1.42, 2.62, 1.31, 2.33, .99);
  s.bezierCurveTo(2.07, .69, 1.83, .64, 1.55, .40);
  s.bezierCurveTo(1.16, .12, .65, .02, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: .105, bevelEnabled: true, bevelSegments: 3, steps: 1,
    bevelSize: .045, bevelThickness: .04, curveSegments: 28,
  });
  geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++){
    const z = pos.getZ(i);
    const lift = .42 * Math.pow(Math.max(0, z) / 3.35, 2.1);
    pos.setY(i, pos.getY(i) + lift);
  }
  geo.computeVertexNormals();
  return geo;
}

function finRimCurvePoints() {
  const pts = [
    [0,0],[.28,.35],[.63,.99],[1.15,1.58],[1.75,2.25],[2.65,2.86],[3.42,2.62],
    [3.84,2.48],[3.52,2.03],[3.20,1.74],[2.88,1.42],[2.62,1.31],[2.33,.99],[2.07,.69],[1.83,.64],[1.55,.40],[1.16,.12],[.65,.02],[0,0],
  ];
  return pts.map(([x,y]) => v3(x, .075 + .42 * Math.pow(Math.max(0,y)/3.35, 2.1), y));
}

function makeFin(side, finMat) {
  const group = new THREE.Group();
  const t = .235;
  const p = whaleSection(t, side > 0 ? 0.06 : Math.PI - 0.06);
  group.position.set(p.x, 1.58, side * (Math.abs(p.z) - .02));
  const droop = .44;
  group.rotation.x = side > 0 ? droop : Math.PI - droop;
  group.rotation.z = side > 0 ? -.1 : .1;
  group.rotation.y = side > 0 ? .07 : -.07;
  group.userData.baseX = group.rotation.x;
  group.userData.baseZ = group.rotation.z;
  group.userData.side = side;

  const fin = new THREE.Mesh(finGeometry(), finMat);
  fin.castShadow = true;
  fin.receiveShadow = true;
  group.add(fin);

  const rimPts = finRimCurvePoints();
  const trimMat = brassMaterial('#efc77f');
  trimMat.side = THREE.DoubleSide;
  const rim = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, false, 'centripetal'), 84, .027, 5, false),
    trimMat
  );
  rim.castShadow = false;
  group.add(rim);
  // gold ribs fanning through the fin
  for (let i=0;i<4;i++){
    const aa = .35 + i*.38;
    const length = 1.8 + (i%2)*.35;
    const curve = new THREE.CatmullRomCurve3([
      v3(.12, .06, -.02),
      v3(.4 + Math.cos(aa)*.1, .07, .4 + i*.13),
      v3(.9 + Math.sin(aa)*.3, .075, .9 + i*.18),
      v3(1.6 + Math.sin(aa)*.2, .08, 1.35 + i*.15),
    ]);
    const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .011, 3), MAT.brassSoft);
    rib.castShadow = false;
    group.add(rib);
  }
  // a tiny pearl at the tip
  const pearl = mesh(ico(.075, 2), glow('#ffe3a8', .9), { pos:[3.35, .38, 2.48] });
  pearl.castShadow = false;
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(.20,.026,5,18,Math.PI*1.5), MAT.brassSoft);
  cuff.rotation.z = .2;
  group.add(cuff);
  group.add(pearl);
  return group;
}

// ── flukes ──────────────────────────────────────────────────
function flukeLobeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.28, .45, .38, 1.18, .92, 1.86);
  s.bezierCurveTo(1.30, 2.32, 2.10, 2.78, 2.58, 2.48);
  s.bezierCurveTo(2.96, 2.23, 2.70, 1.76, 2.33, 1.30);
  s.bezierCurveTo(1.96, .86, 1.64, .44, 1.30, .15);
  s.quadraticCurveTo(1.02, -.05, .68, 0);
  s.quadraticCurveTo(.25, .01, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: .17, bevelEnabled: true, bevelSegments: 3, steps: 1,
    bevelSize: .07, bevelThickness: .06, curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function makeTail(finMat) {
  const tail = new THREE.Group();
  tail.position.set(6.98, 1.80, 0);
  tail.rotation.z = .12;
  const geo = flukeLobeGeometry();
  const gold = brassMaterial('#efc57e');
  gold.side = THREE.DoubleSide;
  tail.scale.setScalar(1.10);

  // left lobe (world -z)
  const left = new THREE.Group();
  left.rotation.x = .44;
  left.position.z = -.015;
  const lm = new THREE.Mesh(geo, finMat);
  lm.castShadow = true; lm.receiveShadow = true;
  left.add(lm);
  for (let i=0;i<3;i++){
    const pts = [
      v3(.18+i*.05, .11, -.06), v3(1.0+i*.08, .10, -.35-i*.1),
      v3(1.65+i*.02, .10, -.8-i*.15), v3(2.1-i*.1, .08, -1.4-i*.08)
    ];
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .011, 3), gold);
    rib.castShadow=false; left.add(rib);
  }
  const leftEdgePts = [
    v3(0,.025,0), v3(.55,.03,-.9), v3(1.1,.03,-1.8), v3(2.18,.01,-2.23)
  ];
  const leftEdge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftEdgePts), 26, .025, 5), gold);
  left.add(leftEdge);
  tail.add(left);

  // right lobe (mirror the same lobe around z)
  const right = new THREE.Group();
  right.rotation.x = -.44;
  right.position.z = .015;
  right.scale.z = -1;
  const rm = new THREE.Mesh(geo, finMat);
  rm.castShadow = true; rm.receiveShadow = true;
  right.add(rm);
  for (let i=0;i<3;i++){
    const pts = [
      v3(.18+i*.05, .11, -.06), v3(1.0+i*.08, .10, -.35-i*.1),
      v3(1.65+i*.02, .10, -.8-i*.15), v3(2.1-i*.1, .08, -1.4-i*.08)
    ];
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .011, 3), gold);
    rib.castShadow=false; right.add(rib);
  }
  const rightEdge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftEdgePts.map(p=>p.clone())), 26, .025, 5), gold);
  right.add(rightEdge);
  tail.add(right);

  // the notch pearl
  const jewel = mesh(ico(.075, 2), glow('#ffe2a8', 1.15), { pos:[.45,.12,0] });
  jewel.castShadow = false;
  tail.add(jewel);
  // a thin gold collar where the flukes meet the tail
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.22,.025,5,18,Math.PI*1.4), MAT.brass);
  collar.rotation.x = Math.PI/2;
  collar.position.set(.02,.02,0);
  tail.add(collar);
  return tail;
}

function makeDorsalFin(finMat) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.15, .35, .48, .74, .92, .88);
  s.bezierCurveTo(1.24, .98, 1.36, .68, 1.08, .33);
  s.bezierCurveTo(.78, .06, .35, -.03, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth:.12, bevelEnabled:true, bevelSegments:2, steps:1, bevelSize:.04, bevelThickness:.035, curveSegments:16 });
  const fin = new THREE.Mesh(geo, finMat);
  fin.castShadow = true; fin.receiveShadow = true;
  fin.position.set(4.05, 2.46, -.06);
  fin.scale.set(1.45,1.25,1.15);
  fin.rotation.y = -.04;
  g.add(fin);
  const pts = [v3(4.08,2.48,.07), v3(4.85,2.93,.04), v3(5.35,3.30,-.02)];
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, .018, 4), brassMaterial('#efc77f'));
  rim.material.side = THREE.DoubleSide;
  g.add(rim);
  g.position.set(0,0,0);
  return g;
}

// ── eyes & face ─────────────────────────────────────────────
function makeEyes() {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const t = .148;
    const theta = side > 0 ? .12 : Math.PI - .12;
    const p = whaleSection(t, theta);
    const z = p.z + side * .012;
    const eye = new THREE.Group();
    eye.position.set(p.x, p.y + .15, z);
    const arc = [];
    for (let i=0;i<=14;i++){
      const a = -1.05 + i/14 * 2.1;
      arc.push(v3(Math.sin(a)*.16, Math.cos(a)*.075 - .05, 0));
    }
    const lid = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 18, .014, 4, false), MAT.ink);
    lid.castShadow=false;
    eye.add(lid);
    // lashes
    for (let i=0;i<2;i++){
      const l = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        v3(-.05+i*.12, .02, .01), v3(-.015+i*.12, .10, .02)
      ]), 5, .008, 3), MAT.inkSoft);
      eye.add(l);
    }
    const blush = new THREE.Mesh(new THREE.SphereGeometry(.20, 16, 8), new THREE.MeshBasicMaterial({
      color:'#ff9eb5', transparent:true, opacity:.16, depthWrite:false, side:THREE.DoubleSide, toneMapped:false
    }));
    blush.scale.set(1.3,.65,.15);
    blush.position.set(-.03, -.015, side*.005);
    eye.add(blush);
    const pearl = mesh(ico(.028,2), MAT.brassSoft, { pos:[.065,.07,side*.012] });
    eye.add(pearl);
    group.add(eye);
    // a little smile line
    const smilePts = [];
    for (let i=0;i<=10;i++){
      const u = i/10;
      const tt = .06 + u*.12;
      const pp = whaleSection(tt, side > 0 ? -.50 : Math.PI+.50);
      smilePts.push(v3(pp.x, pp.y-.03, pp.z + side*.01));
    }
    const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 22, .009, 3), MAT.inkSoft);
    smile.castShadow=false;
    group.add(smile);
  }
  return group;
}

function surfaceSidePoint(t, yOffset, side) {
  const p = profileAt(t);
  const x = BODY_X0 + BODY_LEN * t;
  const cz = Math.sin(t * Math.PI) * .19 - t * .06;
  const f = Math.pow(clamp(yOffset / Math.max(.001, p.h), 0, 1), 1 / .82);
  const cosT = Math.sqrt(Math.max(0, 1 - f * f));
  const z = cz + side * p.w * Math.pow(cosT, .9);
  return { x, y: p.cy + yOffset, z, cz, p };
}

function makeFace() {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const t = .155;
    const eye = surfaceSidePoint(t, .23, side);
    const dir = side;
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(eye.x, eye.y, eye.z + dir * .10);
    eyeGroup.renderOrder = 20;
    // ivory almond
    const white = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshBasicMaterial({
      color: '#fff8e7', toneMapped: false,
    }));
    white.scale.set(.27, .34, .085);
    eyeGroup.add(white);
    // deep-plum pupil with a starry glint
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshBasicMaterial({
      color: '#403a56', toneMapped: false,
    }));
    pupil.scale.set(.145, .235, .055);
    pupil.position.z = dir * .06;
    eyeGroup.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.040, 10, 8), new THREE.MeshBasicMaterial({
      color: '#fff9df', toneMapped: false,
    }));
    glint.position.set(-.05, .10, dir * .12);
    eyeGroup.add(glint);
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), new THREE.MeshBasicMaterial({
      color: '#ffdca8', toneMapped: false,
    }));
    glint2.position.set(.055, -.06, dir * .115);
    eyeGroup.add(glint2);
    // golden upper lid and lashes
    const lidPts = [];
    for (let i=0;i<=10;i++){
      const a = -1.05 + i/10*2.1;
      lidPts.push(new THREE.Vector3(Math.sin(a)*.29, .27 + Math.cos(a)*.11, dir*.13));
    }
    const lid = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lidPts), 18, .018, 4, false), MAT.ink);
    lid.castShadow = false;
    eyeGroup.add(lid);
    for (let i=0;i<3;i++){
      const l = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.14+i*.14, .32, dir*.13),
        new THREE.Vector3(-.12+i*.14, .50, dir*.135),
      ]), 5, .011, 3), MAT.inkSoft);
      eyeGroup.add(l);
    }
    // blush and a tiny gold cheek star
    const blush = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 8), new THREE.MeshBasicMaterial({
      color: '#ff9db4', transparent: true, opacity: .18, depthWrite: false, toneMapped: false, side: THREE.DoubleSide
    }));
    blush.scale.set(1.3,.5,.045);
    blush.position.set(0, -.28, dir*.11);
    eyeGroup.add(blush);
    const pearl = mesh(ico(.04,2), MAT.brassSoft, { pos:[.22, .12, dir*.15] });
    eyeGroup.add(pearl);
    g.add(eyeGroup);

    // the smile line
    const smilePts = [];
    for (let i=0;i<=14;i++){
      const u = i/14;
      const tt = .035 + u*.14;
      const pt = whaleSection(tt, side>0 ? -.52 : Math.PI + .52);
      const rise = Math.sin(u*Math.PI) * .06;
      smilePts.push(new THREE.Vector3(pt.x, pt.y + .05 + rise, pt.z + dir*.10));
    }
    const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 30, .017, 4, false), MAT.inkSoft);
    smile.castShadow = false;
    g.add(smile);
  }
  return g;
}

function makeWhaleJewels() {
  const g = new THREE.Group();
  const r = rng(883);
  // pearly freckles along the cheek and flanks
  const spots = [
    [.09, .78, .022], [.12, .62, .018], [.18, .85, .020],
    [.24, .68, .016], [.32, .84, .018], [.51, .60, .014], [.58, .78, .016],
  ];
  for (const [t, ang, s] of spots) {
    for (const side of [-1,1]) {
      const p = whaleSection(t, side>0?ang:Math.PI-ang);
      const orb = mesh(ico(s,2), glow('#ffe5b4', 1.0), { pos:[p.x, p.y, p.z + side*.015] });
      orb.castShadow=false;
      g.add(orb);
      const halo = glowSprite('gold', s*7, .22);
      halo.position.set(p.x, p.y, p.z + side*.03);
      g.add(halo);
    }
  }
  // long gold light-lines along the sides
  for (const side of [-1,1]) {
    const pts=[];
    for (let i=0;i<=34;i++){
      const t = .17 + i/34*.66;
      const p = whaleSection(t, side>0? .44 : Math.PI-.44);
      pts.push(v3(p.x, p.y+.28, p.z + side*.014));
    }
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 54, .011, 3), new THREE.MeshBasicMaterial({
      color:new THREE.Color('#ffdaa3'), transparent:true, opacity:.34,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false
    }));
    line.castShadow=false;
    g.add(line);
  }
  // throat grooves near the head
  for (const side of [-1,1]) {
    for (let k=0;k<3;k++){
      const pts=[];
      for (let i=0;i<=18;i++){
        const t = .05 + i/18*.22;
        const p = whaleSection(t, side>0? (-1.15 + k*.16) : (Math.PI +1.15 - k*.16));
        pts.push(v3(p.x, p.y, p.z + side*.01));
      }
      const groove = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .007, 3), new THREE.MeshBasicMaterial({
        color:new THREE.Color('#e9aaa9'), transparent:true, opacity:.30,
        depthWrite:false, toneMapped:false
      }));
      g.add(groove);
    }
  }
  // a garland of little stars draped over the head
  for (let i=0;i<4;i++){
    const p = whaleSection(.07 + i*.025, Math.PI*.5);
    const star = mesh(ico(.035,1), glow(i%2?'#ffdf9e':'#e6fcff', 1.1), { pos:[p.x, p.top+.02, p.z + .2] });
    star.castShadow=false; g.add(star);
  }
  return g;
}

// ── back island & deck ──────────────────────────────────────
function organicShape(ax, az, exponent = 2.7, wobble = .035, offsetZ = 0) {
  const s = new THREE.Shape();
  const N = 128;
  for (let i=0;i<=N;i++){
    const a = i/N*TAU;
    const w = 1 + Math.sin(a*5+1.7)*wobble + Math.sin(a*8.2+.3)*wobble*.55;
    const co = Math.cos(a), si = Math.sin(a);
    const x = Math.sign(co) * Math.pow(Math.abs(co), 2/exponent) * ax * w;
    const z = Math.sign(si) * Math.pow(Math.abs(si), 2/exponent) * az * w + offsetZ;
    if (i===0) s.moveTo(x,z); else s.lineTo(x,z);
  }
  s.closePath();
  return s;
}

function meadowTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#c4e4cb');
    g.addColorStop(.35,'#aad4bc');
    g.addColorStop(.68,'#d1e3c0');
    g.addColorStop(1,'#b4d6ca');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    const r = rng(151);
    for (let i=0;i<220;i++){
      ctx.fillStyle = ['rgba(255,246,216,.4)','rgba(174,219,185,.5)','rgba(255,190,208,.24)','rgba(170,188,238,.18)'][i%4];
      ctx.beginPath(); ctx.ellipse(r()*w, r()*h, 3+r()*18, 1+r()*7, r()*3, 0, 7); ctx.fill();
    }
    for (let i=0;i<70;i++){
      ctx.fillStyle = ['#fff6e0','#ffc8d8','#e5d4ff','#ffe2a2'][i%4];
      ctx.beginPath(); ctx.arc(r()*w, r()*h, .7+r()*1.7,0,7); ctx.fill();
    }
    // winding pale path / dry stream
    ctx.strokeStyle='rgba(241,224,198,.45)'; ctx.lineWidth=18; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(w*.18,h*.85); ctx.bezierCurveTo(w*.35,h*.68,w*.32,h*.44,w*.48,h*.30); ctx.stroke();
  });
}

let MEADOW_TEX;
function makeTerrace() {
  const group = new THREE.Group();
  const shape = organicShape(3.30, 2.60, 3.1, .028, .08);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: .26, bevelEnabled: true, bevelSegments: 4, steps: 1,
    bevelSize: .10, bevelThickness: .09, curveSegments: 26,
  });
  geo.rotateX(-Math.PI/2);
  const skirtMat = new THREE.MeshToonMaterial({
    color:'#d8e4ca', gradientMap:toonRamp, emissive:'#a9caa7', emissiveIntensity:.055
  });
  const terrace = new THREE.Mesh(geo, skirtMat);
  terrace.position.y = PLATFORM_Y - .32;
  terrace.castShadow = true; terrace.receiveShadow = true;
  group.add(terrace);
  inkOutline(terrace, '#7e6371', .018, .36);

  // top meadow
  const topGeo = new THREE.ShapeGeometry(shape, 32);
  topGeo.rotateX(-Math.PI/2);
  const pos = topGeo.attributes.position;
  const uv = topGeo.attributes.uv;
  const minX = -3.5, maxX = 3.5, minZ = -2.7, maxZ = 2.9;
  for (let i=0;i<uv.count;i++){
    uv.setXY(i, (pos.getX(i)-minX)/(maxX-minX), (pos.getZ(i)-minZ)/(maxZ-minZ));
  }
  MEADOW_TEX = MEADOW_TEX || meadowTexture();
  const topMat = new THREE.MeshToonMaterial({
    map: MEADOW_TEX, gradientMap: toonRamp, color:'#effae7', side:THREE.DoubleSide,
    emissive:'#90c8a9', emissiveIntensity:.045,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = PLATFORM_Y - .005;
  top.receiveShadow = true;
  group.add(top);

  // gold rim along the island edge
  const rimPts = [];
  for (let i=0;i<=90;i++){
    const a = i/90*TAU;
    const w = 1 + Math.sin(a*5+1.7)*.028 + Math.sin(a*8.2+.3)*.015;
    const co=Math.cos(a), si=Math.sin(a);
    const x=Math.sign(co)*Math.pow(Math.abs(co),2/3.1)*3.30*w;
    const z=Math.sign(si)*Math.pow(Math.abs(si),2/3.1)*2.60*w + .08;
    rimPts.push(v3(x, PLATFORM_Y+.015, z));
  }
  rimPts.push(rimPts[0].clone());
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, false, 'centripetal'), 160, .014, 4), MAT.brassSoft);
  rim.castShadow=false;
  group.add(rim);

  // wooden deck, shaped like a polished boat-deck rather than a tray
  const dShape = organicShape(2.86, 2.15, 6.5, .008, .00);
  const dGeo = new THREE.ExtrudeGeometry(dShape, {
    depth: .09, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: .045, bevelThickness: .035, curveSegments: 20,
  });
  dGeo.rotateX(-Math.PI/2);
  const deckMat = new THREE.MeshToonMaterial({
    color:'#dab08d', map:TEX.deck, gradientMap:toonRamp,
    emissive:'#643e30', emissiveIntensity:.03,
  });
  const deck = new THREE.Mesh(dGeo, deckMat);
  deck.position.set(-.05, DECK_Y - .09, .18);
  deck.castShadow = true; deck.receiveShadow = true;
  group.add(deck);
  inkOutline(deck, '#73515b', .013, .4);

  // inlaid border on the deck
  const borderPts = [];
  const dsPts = organicShape(2.72, 2.02, 7.5, .004, .00);
  const pts = dsPts.getPoints(72);
  pts.forEach(p=>borderPts.push(v3(p.x-.05, DECK_Y+.015, p.y+.18)));
  borderPts.push(borderPts[0].clone());
  const border = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(borderPts,false,'centripetal'), 160, .018, 5), MAT.brassSoft);
  border.castShadow=false;
  group.add(border);

  // soft dark touch where the house meets the boards
  const shadow = softShadowPlane(6.0, 4.9, .46);
  shadow.position.set(-.05, DECK_Y+.005, .15);
  group.add(shadow);

  // small tufts of cloud tucked around the island
  const r = rng(444);
  const puffGeo = new THREE.IcosahedronGeometry(1,2);
  const cols = ['#eef3d8','#f7e8d2','#d8e4ca','#e9def5'];
  for (let i=0;i<11;i++){
    const a = i/11*TAU + (r()-.5)*.08;
    const co=Math.cos(a), si=Math.sin(a);
    const x=Math.sign(co)*Math.pow(Math.abs(co),2/2.8)*3.36;
    const z=Math.sign(si)*Math.pow(Math.abs(si),2/2.8)*2.66 + .08;
    const puff = mesh(puffGeo, toon(cols[i%cols.length], { emissive:'#c1d8b6', emissiveIntensity:.035 }), {
      pos:[x, PLATFORM_Y-.12+(r()-.5)*.06, z],
      scale:[.18+r()*.22, .10+r()*.12, .18+r()*.22], rot:[0,r()*TAU,0]
    });
    puff.castShadow = true; puff.receiveShadow = true;
    group.add(puff);
  }
  // mossy pebbles
  for (let i=0;i<7;i++){
    const a = .4 + i*1.3;
    const x = Math.cos(a)*(2.3 + (i%2)*.4), z = Math.sin(a)*(1.7 + (i%3)*.2);
    if (Math.abs(x)<2.4 && Math.abs(z)<1.9) continue;
    const p = mesh(ico(.12+r()*.08,1), toon('#e6d2c7'), { pos:[x,PLATFORM_Y+.02,z], scale:[1.2,.4,1] });
    group.add(p);
  }
  return { group, deck, terrace };
}

// ── fountain ────────────────────────────────────────────────
const fountainVert = `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main(){
    vUv=uv;
    vec4 wp=modelMatrix*vec4(position,1.);
    vN=normalize(mat3(modelMatrix)*normal);
    vV=normalize(cameraPosition-wp.xyz);
    gl_Position=projectionMatrix*viewMatrix*wp;
  }
`;
const fountainFrag = `
  uniform float uTime;
  uniform vec3 uA,uB,uC;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main(){
    float along = vUv.y;
    float stream = smoothstep(0.,.08,along) * (1.0 - smoothstep(.72,1.,along));
    float running = .5+.5*sin(vUv.x*18. + along*36. - uTime*2.1 + sin(vUv.x*5.)*2.);
    float rim = pow(1.-abs(dot(normalize(vN),normalize(vV))),1.4);
    vec3 col = mix(uB,uA,smoothstep(.05,.8,along));
    col = mix(col,uC,smoothstep(.55,1.,running*.45+along*.25));
    col += uA*rim*.26;
    gl_FragColor=vec4(col, (stream*.65 + rim*.2)*(0.66+running*.34));
  }
`;

function makeFountain() {
  const group = new THREE.Group();
  group.name='whale-fountain';
  const blow = whaleSection(.145, Math.PI/2);
  group.position.set(blow.x, blow.top + .02, blow.z);
  const basin = new THREE.Group();
  basin.scale.setScalar(1.35);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(.31,32), new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a8f3f5').multiplyScalar(1.1), transparent:true, opacity:.85, toneMapped:false, side:THREE.DoubleSide
  }));
  pool.rotation.x=-Math.PI/2; pool.position.y=.015; basin.add(pool);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.32,.045,8,28), MAT.brass);
  rim.rotation.x=-Math.PI/2; basin.add(rim);
  const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(.37,.012,4,32), new THREE.MeshBasicMaterial({ color:'#c9f8f1', transparent:true, opacity:.35, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false }));
  rimGlow.rotation.x=-Math.PI/2; rimGlow.position.y=.04; basin.add(rimGlow);
  group.add(basin);
  const halo = glowSprite('blue', 2.0, .34);
  halo.position.y=.1; group.add(halo);

  const streamMat = new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}, uA:{value:new THREE.Color('#f2feff')}, uB:{value:new THREE.Color('#92e7ec')}, uC:{value:new THREE.Color('#ffc8da')}},
    vertexShader:fountainVert, fragmentShader:fountainFrag,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide
  });
  const streams = [
    [[0,.05,0],[-.10,1.0,.04],[-.34,2.0,.1],[-.18,2.9,-.05],[-.38,3.5,.18]],
    [[.03,.05,.02],[.45,.9,-.15],[.95,1.85,-.3],[1.15,2.8,-.1],[1.55,3.25,.2]],
    [[-.02,.05,-.02],[-.5,.8,.2],[-1.0,1.55,.25],[-1.5,2.3,.05],[-1.8,2.6,-.15]],
    [[.02,.05,.05],[.1,1.2,.4],[.35,2.1,.65],[.1,2.9,.5],[.4,3.2,.2]],
  ];
  streams.forEach((ps,i)=>{
    const curve = new THREE.CatmullRomCurve3(ps.map(p=>v3(...p)));
    const mesh_ = new THREE.Mesh(new THREE.TubeGeometry(curve, 50, i===0?.075:.038, 7, false), streamMat);
    mesh_.renderOrder=5;
    group.add(mesh_);
  });

  // glitter crown
  const crown = new THREE.Group();
  crown.position.set(.05,3.4,0);
  for (let i=0;i<9;i++){
    const a=i/9*TAU;
    const s = mesh(ico(.04+Math.random()*.025,1), JELLY.blue, { pos:[Math.cos(a)*.3, Math.random()*.18, Math.sin(a)*.25], scale:[1,.7,1] });
    s.castShadow=false; crown.add(s);
  }
  group.add(crown);

  // star-dust fountain particles
  const N=200;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N*3), aSize=new Float32Array(N), aAlpha=new Float32Array(N), seed=new Float32Array(N*4);
  const r = rng(534);
  for (let i=0;i<N;i++){
    seed[i*4]=r(); seed[i*4+1]=.25+r()*.9; seed[i*4+2]=.18+r()*.9; seed[i*4+3]=r();
    aSize[i]=.06+r()*.18; aAlpha[i]=0;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize,1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha,1));
  const pMat = new THREE.ShaderMaterial({
    uniforms:{uMap:{value:STAR_TEX},uColor:{value:new THREE.Color('#fff0bc')}},
    vertexShader:`
      attribute float aSize; attribute float aAlpha; varying float vAlpha;
      void main(){ vAlpha=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=aSize*1000.0/max(1.0,-mv.z); gl_Position=projectionMatrix*mv; }
    `,
    fragmentShader:`
      uniform sampler2D uMap; uniform vec3 uColor; varying float vAlpha;
      void main(){ vec4 t=texture2D(uMap,gl_PointCoord); gl_FragColor=vec4(uColor,t.a*vAlpha); }
    `,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false
  });
  const stars = new THREE.Points(geo,pMat);
  stars.frustumCulled=false;
  group.add(stars);
  const light = new THREE.PointLight('#bceff0', 2.2, 7, 2);
  light.position.set(0,1.5,0); group.add(light);

  // feathery droplets hanging in the air
  const drops = new THREE.Group();
  for (let i=0;i<7;i++){
    const s = glowSprite(i%2?'pink':'gold', .22+.1*(i%3), .22);
    s.userData = { phase:i*1.4, rad:.35+(i%3)*.25, y:.8+i*.32 };
    drops.add(s);
  }
  group.add(drops);

  function update(t){
    streamMat.uniforms.uTime.value=t;
    crown.rotation.y=t*.25;
    crown.position.y=3.4+Math.sin(t*.7)*.08;
    const pts=geo.attributes.position.array; const al=geo.attributes.aAlpha.array;
    for (let i=0;i<N;i++){
      const ph=seed[i*4], sp=seed[i*4+1], rad=seed[i*4+2], dir=seed[i*4+3];
      let u=(t*.09*sp+ph)%1;
      const climb=smoothstep(0,.6,u);
      const x=Math.sin(dir*TAU+u*7.2+t*.22)*rad*climb*.6;
      const z=Math.cos(dir*TAU+u*7.2+t*.22)*rad*climb*.45;
      const y=.08+u*3.55+Math.sin(u*10+t)*.04;
      pts[i*3]=x; pts[i*3+1]=y; pts[i*3+2]=z;
      al[i]=Math.sin(Math.min(1,u*2.2)*Math.PI*.5)*(1-smoothstep(.6,1,u))*.95;
    }
    geo.attributes.position.needsUpdate=true; geo.attributes.aAlpha.needsUpdate=true;
    drops.children.forEach((s,i)=>{
      const u=(t*.07+i*.17)%1;
      s.position.set(Math.cos(t*.3+i*2.2)*(.4+i*.08), .1+u*2.6, Math.sin(t*.25+i)* .35);
      s.material.opacity=.12*(1-u);
    });
  }
  return { group, update };
}

// ─────────────────────────────────────────────────────────────
export function createWhale() {
  const root = new THREE.Group();
  root.name = 'jade-whale';

  const whaleMat = makeWhaleMaterial(false, .96);
  const finMat = makeWhaleMaterial(true, .84);
  finMat.uniforms.uTop.value.set('#d6f4ec');
  finMat.uniforms.uSide.value.set('#9bd7d2');
  finMat.uniforms.uBelly.value.set('#8bcfca');
  finMat.uniforms.uRim.value.set('#ffe6b8');
  finMat.uniforms.uAurora.value.set('#71dfcc');

  const body = new THREE.Mesh(makeBodyGeometry(), whaleMat);
  body.name='whale-body';
  body.castShadow = true; body.receiveShadow = true;
  root.add(body);
  inkOutline(body, '#5f4c5d', .043, 1.0);

  root.add(makeWhaleJewels());
  root.add(makeFace());

  const finR = makeFin(1, finMat);
  const finL = makeFin(-1, finMat);
  root.add(finR, finL);

  const tail = makeTail(finMat);
  root.add(tail);
  const dorsal = makeDorsalFin(finMat);
  root.add(dorsal);

  const back = makeTerrace();
  root.add(back.group);

  const fountain = makeFountain();
  root.add(fountain.group);

  // a faint shadow/pool made by the huge body
  const under = new THREE.Mesh(new THREE.CircleGeometry(1,64), new THREE.MeshBasicMaterial({
    color:'#937bb2', transparent:true, opacity:.12, depthWrite:false
  }));
  under.rotation.x=-Math.PI/2;
  under.scale.set(7.3,3.1,1);
  under.position.y=.335;
  root.add(under);

  const finBaseR = finR.rotation.x, finBaseZR = finR.rotation.z;
  const finBaseL = finL.rotation.x;
  const tailZ = tail.rotation.z;
  const baseY = root.position.y;
  let time=0;

  function update(t){
    time=t;
    whaleMat.uniforms.uTime.value=t;
    finMat.uniforms.uTime.value=t;
    const breathe = Math.sin(t*.32);
    root.position.y = Math.sin(t*.30+1.0)*.035;
    finR.rotation.x = finBaseR + Math.sin(t*.42+1.2)*.030;
    finR.rotation.z = finBaseZR + Math.cos(t*.31)*.014;
    finL.rotation.x = finBaseL - Math.sin(t*.42+1.45)*.030;
    finL.rotation.z = -.1 - Math.cos(t*.31+.2)*.014;
    tail.rotation.y = Math.sin(t*.28+.3)*.045;
    tail.rotation.z = tailZ + Math.sin(t*.21+1.2)*.022;
    fountain.update(t);
  }

  return { group: root, update, body, deckY: DECK_Y, platformY: PLATFORM_Y, terrace: back };
}