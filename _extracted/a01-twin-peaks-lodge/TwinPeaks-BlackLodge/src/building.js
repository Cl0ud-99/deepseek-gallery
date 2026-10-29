import * as THREE from 'three';
import { PAL, M, MB, GLOW, add, box, cyl, plane, timeU, glow, addOutline, velvetMat, curtainGeometry, softSprite } from './style.js';
import { chevronSmallTexture, woodTexture, owlSilhouette, twedesOval, rrPanel, cafePanel, cv, makeTex } from './textures.js';
import { L } from './layout.js';

/* ------------------------------------------------------------------ *
 *  Glass shader — rain streaks, droplets, ghost reflection
 * ------------------------------------------------------------------ */
export function makeGlassMaterial(tint = 0xa8cfd6) {
  const uniforms = {
    uTime: timeU,
    uTint: { value: new THREE.Color(tint) },
    uOpacity: { value: 1.0 },
    uGhost: { value: 0.55 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vW;
      varying vec2 vUv;
      varying vec3 vN;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform float uGhost;
      varying vec3 vW;
      varying vec2 vUv;
      varying vec3 vN;

      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.2);

        // running rain streaks
        float streak = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float col = h21(vec2(floor(vUv.x * 34.0 + fi * 7.0), fi));
          float speed = 0.10 + col * 0.22;
          float yy = fract(vUv.y * 1.0 - uTime * speed + col * 5.0);
          float line = smoothstep(0.90, 1.0, h21(vec2(floor(vUv.x * 90.0 + fi * 3.0), 1.0)));
          float seg = smoothstep(0.0, 0.15, yy) * (1.0 - yy);
          streak += line * seg * (0.25 + col * 0.75) * 0.55;
        }
        // ghost (double image) streaks
        float ghost = 0.0;
        for (int i = 0; i < 2; i++) {
          float fi = float(i);
          float col = h21(vec2(floor(vUv.x * 22.0 + fi * 11.0), 9.0));
          float yy = fract(vUv.y * 0.7 - uTime * (0.06 + col * 0.1) + col * 3.0);
          ghost += smoothstep(0.93, 1.0, h21(vec2(floor(vUv.x * 60.0 + fi * 5.0), 4.0))) * (1.0 - yy) * 0.4;
        }

        // droplets
        vec2 g = vUv * vec2(26.0, 18.0);
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float dh = h21(id);
        float drop = smoothstep(0.16, 0.0, length(f - vec2(0.0, 0.15 * sin(uTime * 0.7 + dh * 9.0)))) * step(0.93, dh);

        float red = smoothstep(0.55, 1.0, vUv.y) * 0.16 + smoothstep(0.15, 0.0, vUv.y) * 0.10;
        vec3 col = uTint * (0.28 + fres * 0.75);
        col += vec3(0.72, 0.82, 0.92) * (streak + ghost * uGhost) * 0.32;
        col += vec3(0.85, 0.9, 1.0) * drop * 0.3;
        col += vec3(0.42, 0.05, 0.10) * red;

        float a = (0.035 + fres * 0.17 + streak * 0.11 + ghost * 0.05 + drop * 0.16) * uOpacity;
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.72));
      }`,
  });
  mat.userData.uniforms = uniforms;
  return mat;
}

/* ------------------------------------------------------------------ *
 *  helpers
 * ------------------------------------------------------------------ */
function plaqueTexture(text, sub, w = 512, h = 160) {
  const c = cv(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a060b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#e8c877';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.floor(h * 0.34)}px Georgia, serif`;
  ctx.fillText(text, w / 2, h * 0.52);
  if (sub) {
    ctx.font = `${Math.floor(h * 0.15)}px Georgia, serif`;
    ctx.fillStyle = 'rgba(232,200,119,0.75)';
    ctx.fillText(sub, w / 2, h * 0.78);
  }
  return makeTex(c, { clamp: true });
}

function fringeTexture() {
  const W = 128, H = 64;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * W + Math.random() * 1.5;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(214,176,110,0.95)');
    g.addColorStop(0.7, 'rgba(178,138,76,0.8)');
    g.addColorStop(1, 'rgba(120,88,44,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, H);
    ctx.stroke();
  }
  const t = makeTex(c, { clamp: false });
  return t;
}

function firSprigTexture() {
  const W = 256, H = 128;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#2c4630';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(4, H / 2);
  ctx.quadraticCurveTo(W / 2, H / 2 - 10, W - 4, H / 2 + 4);
  ctx.stroke();
  for (let i = 0; i < 34; i++) {
    const t = i / 34;
    const x = 8 + t * (W - 20);
    const y = H / 2 - 6 + Math.sin(t * 3) * 5;
    const len = 34 * (1 - t * 0.55);
    ctx.strokeStyle = i % 2 ? '#20361f' : '#2e4a2c';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 8, y - len * 0.7, x + 2, y - len);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.quadraticCurveTo(x + 8, y + 4 + len * 0.7, x + 2, y + 4 + len);
    ctx.stroke();
  }
  return makeTex(c, { clamp: true });
}

/* ------------------------------------------------------------------ *
 *  Ribbon that follows a polyline (valance / fringe)
 * ------------------------------------------------------------------ */
function ribbonGeometry(points, topY, height, opts = {}) {
  const folds = opts.folds || 0.05;
  const freq = opts.freq || 9;
  const outward = opts.outward !== false;
  const pos = [];
  const col = [];
  const uv = [];
  const idx = [];
  const c = new THREE.Color();
  let dist = 0;
  const n = points.length;
  const segs = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i], b = points[i + 1];
    segs.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
  }
  const total = segs.reduce((s, x) => s + x.len, 0);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    // outward normal (average of adjacent segments)
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    let nx = dz, nz = -dx;
    if (!outward) { nx = -nx; nz = -nz; }
    const wob = Math.sin((acc / total) * Math.PI * 2 * freq) * folds;
    const px = p[0] + nx * wob;
    const pz = p[1] + nz * wob;
    pos.push(px, topY, pz);
    pos.push(px + nx * folds * 0.4, topY - height, pz + nz * folds * 0.4);
    uv.push(acc / total, 1);
    uv.push(acc / total, 0);
    const shade = 0.42 + 0.58 * (0.5 + 0.5 * Math.cos((acc / total) * Math.PI * 2 * freq));
    c.setRGB(shade, shade * 0.95, shade * 0.93);
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < n - 1) acc += segs[i].len;
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ *
 *  Owl
 * ------------------------------------------------------------------ */
function buildOwl() {
  const g = new THREE.Group();
  const bodyMat = M(0xd6cbb0, { flat: true, emissive: 0x241a0c });
  const darkMat = M(0x5a4f3c, { flat: true });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), bodyMat);
  body.scale.set(1, 1.35, 0.86);
  body.castShadow = true;
  addOutline(body, 0.0055);
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), bodyMat);
  head.position.set(0, 0.44, 0.02);
  head.scale.set(1.08, 0.95, 0.95);
  head.castShadow = true;
  addOutline(head, 0.0055);
  g.add(head);

  // ear tufts
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 5), bodyMat);
    ear.position.set(s * 0.17, 0.64, 0.0);
    ear.rotation.z = -s * 0.3;
    g.add(ear);
  }
  // eyes
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), GLOW(0xffd27a, 3.2));
    eye.position.set(s * 0.1, 0.47, 0.22);
    g.add(eye);
    const halo = glow(g, 0xffcf7a, 0.55, 0.55, [s * 0.1, 0.47, 0.26]);
    halo.material.opacity = 0.45;
  }
  // beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), M(0xc9a24a));
  beak.position.set(0, 0.37, 0.25);
  beak.rotation.x = Math.PI / 2;
  g.add(beak);

  // wings
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.05);
  shape.lineTo(0.42, 0.3);
  shape.lineTo(0.88, 0.34);
  shape.lineTo(1.24, 0.24);
  shape.lineTo(1.38, 0.05);
  shape.lineTo(1.26, -0.04);
  shape.lineTo(1.08, 0.02);
  shape.lineTo(0.98, -0.1);
  shape.lineTo(0.78, -0.02);
  shape.lineTo(0.66, -0.14);
  shape.lineTo(0.46, -0.05);
  shape.lineTo(0.32, -0.17);
  shape.lineTo(0.1, -0.1);
  shape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.015, bevelSegments: 1 });
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(wingGeo, bodyMat);
    w.scale.x = s;
    w.position.set(s * 0.18, 0.16, -0.02);
    w.rotation.y = s * 0.16;
    w.rotation.z = s * 0.42;
    w.castShadow = true;
    addOutline(w, 0.0055);
    g.add(w);
    // wing bar markings
    for (let i = 0; i < 3; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.02), darkMat);
      bar.position.set(s * (0.45 + i * 0.22), 0.12 - i * 0.035, 0.06);
      bar.rotation.z = s * (0.12 - i * 0.05);
      g.add(bar);
    }
  }
  // tail
  for (let i = -1; i <= 1; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 5), bodyMat);
    t.position.set(i * 0.12, -0.42, -0.06);
    t.rotation.x = Math.PI;
    t.rotation.z = i * 0.2;
    g.add(t);
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Main building
 * ------------------------------------------------------------------ */
export function buildBuilding(scene) {
  const b = L.bld;
  const grp = new THREE.Group();
  grp.name = 'blackLodge';
  const glassMats = [];
  const glass = makeGlassMaterial();
  glassMats.push(glass);

  const woodMat = M(0xffffff, { map: woodTexture('#33241a', '#1b120c', 3, [3, 1]) });
  const trimMat = M(0x1d1512);
  const goldMat = M(PAL.brass, { emissive: 0x241703 });
  const velvetOut = velvetMat(0x8a1222, { sway: 0.012 });

  /* ---- shell walls ---- */
  const wallT = 0.16;
  const backWall = box(grp, b.x1 - b.x0 + wallT, b.h, wallT, M(0x1a0d10), { p: [(b.x0 + b.x1) / 2, b.h / 2, b.z0 - wallT / 2] });
  backWall.castShadow = true;
  const leftWall = box(grp, wallT, b.h, b.z1 - b.z0, M(0x180c0f), { p: [b.x0 - wallT / 2, b.h / 2, (b.z0 + b.z1) / 2] });

  /* ---- wainscot ---- */
  const wainH = 0.62;
  box(grp, b.x1 - b.x0, wainH, 0.2, woodMat, { p: [(b.x0 + b.x1) / 2, wainH / 2, b.z1 + 0.02] });
  box(grp, 0.2, wainH, b.z1 - b.z0, woodMat, { p: [b.x1 + 0.02, wainH / 2, (b.z0 + b.z1) / 2] });
  // kick plate with chevron inlay
  const kickTex = chevronSmallTexture('#0d0b0a', '#cfc7b4', 3);
  const kickMat = M(0xffffff, { map: kickTex });
  box(grp, b.x1 - b.x0 - 0.1, 0.2, 0.03, kickMat, { p: [(b.x0 + b.x1) / 2, 0.12, b.z1 + 0.13] });

  /* ---- fascia band above glass ---- */
  const fasciaY = 3.15;
  box(grp, b.x1 - b.x0 + 0.3, b.h - fasciaY, 0.24, M(0x5c0c16), { p: [(b.x0 + b.x1) / 2, (b.h + fasciaY) / 2, b.z1 + 0.03] });
  box(grp, 0.24, b.h - fasciaY, b.z1 - b.z0, M(0x3a0a10), { p: [b.x1 + 0.03, (b.h + fasciaY) / 2, (b.z0 + b.z1) / 2] });

  // BLACK LODGE fascia plaque
  const blTex = plaqueTexture('BLACK LODGE', 'room 315 \u00b7 no vacancy', 640, 160);
  plane(grp, 3.0, 0.75, new THREE.MeshBasicMaterial({ map: blTex, transparent: false }), {
    p: [-4.4, 3.74, b.z1 + 0.16],
  });

  /* ---- glass panes ---- */
  const gTop = 3.15, gBot = 0.62;
  const gh = gTop - gBot;
  const gy = (gTop + gBot) / 2;
  const d = L.door;
  // left of door
  plane(grp, (d.x0 - b.x0), gh, glass, { p: [(b.x0 + d.x0) / 2, gy, b.z1 + 0.01], castShadow: false, receiveShadow: false });
  // right of door
  plane(grp, (b.x1 - d.x1), gh, glass, { p: [(d.x1 + b.x1) / 2, gy, b.z1 + 0.01], castShadow: false, receiveShadow: false });
  // transom above door
  plane(grp, d.x1 - d.x0, gTop - d.h, glass, { p: [(d.x0 + d.x1) / 2, (d.h + gTop) / 2, b.z1 + 0.01], castShadow: false, receiveShadow: false });
  // right facade glass
  const rGlass = plane(grp, b.z1 - L.corner.cz - 0.02, gh, glass, {
    p: [b.x1 + 0.01, gy, (b.z0 + L.corner.cz) / 2],
    r: [0, Math.PI / 2, 0],
    castShadow: false,
    receiveShadow: false,
  });
  // curved corner glass
  const arcGeo = new THREE.CylinderGeometry(L.corner.r, L.corner.r, gh, 26, 1, true, 0, Math.PI / 2);
  const arcGlass = new THREE.Mesh(arcGeo, glass);
  arcGlass.position.set(L.corner.cx, gy, L.corner.cz);
  arcGlass.rotation.y = 0;
  arcGlass.castShadow = false;
  grp.add(arcGlass);

  /* ---- mullions ---- */
  const mull = (x, z, ry = 0, w = 0.07) => {
    box(grp, w, gh, 0.12, trimMat, { p: [x, gy, z], r: [0, ry, 0], castShadow: false });
  };
  // verticals along front
  for (let x = b.x0; x <= b.x1 + 0.01; x += 1.55) {
    if (x > d.x0 - 0.05 && x < d.x1 + 0.05) continue;
    if (x > L.corner.cx) continue;
    mull(x, b.z1 + 0.04);
  }
  // corner verticals
  mull(L.corner.cx, b.z1 + 0.04);
  // right facade verticals
  for (let z = b.z0 + 0.3; z < L.corner.cz - 0.1; z += 1.6) {
    box(grp, 0.12, gh, 0.07, trimMat, { p: [b.x1 + 0.04, gy, z], castShadow: false });
  }
  // horizontal rails
  box(grp, b.x1 - b.x0, 0.09, 0.14, trimMat, { p: [(b.x0 + b.x1) / 2, gBot, b.z1 + 0.04], castShadow: false });
  box(grp, b.x1 - b.x0, 0.12, 0.16, trimMat, { p: [(b.x0 + b.x1) / 2, gTop + 0.02, b.z1 + 0.04], castShadow: false });
  box(grp, 0.14, 0.09, b.z1 - b.z0, trimMat, { p: [b.x1 + 0.04, gBot, (b.z0 + b.z1) / 2], castShadow: false });
  box(grp, 0.16, 0.12, b.z1 - b.z0, trimMat, { p: [b.x1 + 0.04, gTop + 0.02, (b.z0 + b.z1) / 2], castShadow: false });
  // curved rails
  for (const yy of [gBot, gTop + 0.02]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(L.corner.r, 0.05, 6, 24, Math.PI / 2), trimMat);
    t.rotation.x = Math.PI / 2;
    t.position.set(L.corner.cx, yy, L.corner.cz);
    t.castShadow = false;
    grp.add(t);
  }

  /* ---- door frame + curtain doors ---- */
  box(grp, 0.14, d.h, 0.3, trimMat, { p: [d.x0 - 0.06, d.h / 2, b.z1 + 0.02] });
  box(grp, 0.14, d.h, 0.3, trimMat, { p: [d.x1 + 0.06, d.h / 2, b.z1 + 0.02] });
  box(grp, d.x1 - d.x0 + 0.28, 0.18, 0.34, trimMat, { p: [(d.x0 + d.x1) / 2, d.h + 0.06, b.z1 + 0.02] });

  const doorMat = velvetMat(PAL.velvet, { sway: 0.03 });
  const doorW = (d.x1 - d.x0) / 2;
  const makeDoorPanel = (side) => {
    const geo = curtainGeometry(doorW, d.h - 0.06, 5, 0.055, 10);
    const m = new THREE.Mesh(geo, doorMat);
    m.position.set(side < 0 ? d.x0 + doorW / 2 : d.x1 - doorW / 2, 0.04, b.z1 - 0.1);
    m.castShadow = true;
    grp.add(m);
    // fringe along inner edge
    const fr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, d.h - 0.1),
      new THREE.MeshBasicMaterial({ map: fringeTexture(), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })
    );
    fr.position.set(side < 0 ? doorW / 2 : -doorW / 2, (d.h - 0.1) / 2, 0.05);
    m.add(fr);
    return m;
  };
  const doorL = makeDoorPanel(-1);
  const doorR = makeDoorPanel(1);
  const doorHomeL = doorL.position.x;
  const doorHomeR = doorR.position.x;

  // pelmet above door
  const pel = new THREE.Mesh(curtainGeometry(d.x1 - d.x0 + 0.3, 0.42, 4, 0.06, 4), velvetMat(PAL.velvetDeep, { sway: 0.008 }));
  pel.position.set((d.x0 + d.x1) / 2, d.h - 0.32, b.z1 - 0.02);
  pel.rotation.z = Math.PI;
  grp.add(pel);

  // threshold mat
  const matTex = chevronSmallTexture('#141110', '#d8cfb8', 2);
  const doorMat2 = M(0xffffff, { map: matTex });
  const dm = box(grp, 1.9, 0.04, 1.1, doorMat2, { p: [(d.x0 + d.x1) / 2, 0.02, b.z1 + 0.85], castShadow: false });
  dm.material.color.setHex(0x8a8272);
  dm.material.map.repeat.set(0.9, 0.6);

  /* ---- awning ---- */
  const awnY = L.awningY;
  const over = L.overhang;
  const ax0 = b.x0 - over, ax1 = b.x1 + over, az0 = b.z0 - over, az1 = b.z1 + over;
  const cr = L.corner.r + over;
  const shape = new THREE.Shape();
  // build in (x, -z) then rotate -90 about X
  shape.moveTo(ax0, -az0);
  shape.lineTo(ax0, -az1);
  shape.lineTo(L.corner.cx, -az1);
  // arc from front to right around corner
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ang = Math.PI / 2 - t * (Math.PI / 2);
    const x = L.corner.cx + Math.cos(ang) * cr;
    const z = L.corner.cz + Math.sin(ang) * cr;
    shape.lineTo(x, -z);
  }
  shape.lineTo(ax1, -az0);
  shape.closePath();
  const awnGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  const awn = new THREE.Mesh(awnGeo, M(0x2a1a18, { flatShading: true }));
  awn.rotation.x = -Math.PI / 2;
  awn.position.y = awnY;
  awn.castShadow = true;
  awn.receiveShadow = true;
  grp.add(awn);

  // valance following the outer edge
  const edgePts = [];
  edgePts.push([ax0, az1]);
  edgePts.push([L.corner.cx, az1]);
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    const ang = Math.PI / 2 - t * (Math.PI / 2);
    edgePts.push([L.corner.cx + Math.cos(ang) * cr, L.corner.cz + Math.sin(ang) * cr]);
  }
  edgePts.push([ax1, az0]);
  const valGeo = ribbonGeometry(edgePts, awnY - 0.02, 0.40, { folds: 0.055, freq: 12 });
  const val = new THREE.Mesh(valGeo, velvetMat(0xb81a30, { sway: 0.02 }));
  val.castShadow = true;
  grp.add(val);

  // fringe under valance
  const frTex = fringeTexture();
  frTex.repeat.set(26, 1);
  const fringeGeo = ribbonGeometry(edgePts, awnY - 0.42, 0.13, { folds: 0.02, freq: 14 });
  const fringe = new THREE.Mesh(fringeGeo, new THREE.MeshBasicMaterial({ map: frTex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide }));
  grp.add(fringe);

  // fir sprigs tucked along the awning edge
  const sprigTex = firSprigTexture();
  const sprigMat = M(0xffffff, { map: sprigTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
  for (let i = 0; i < edgePts.length - 1; i += 2) {
    const p = edgePts[i];
    const p2 = edgePts[i + 1] || p;
    const mx = (p[0] + p2[0]) / 2, mz = (p[1] + p2[1]) / 2;
    for (let k = 0; k < 2; k++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), sprigMat);
      s.position.set(mx + (Math.random() - 0.5) * 0.4, awnY - 0.16 - k * 0.1, mz + (Math.random() - 0.5) * 0.4);
      s.rotation.set(-0.5 + Math.random() * 0.3, Math.random() * 3.14, (Math.random() - 0.5) * 0.5);
      s.castShadow = false;
      grp.add(s);
    }
  }

  // awning bulbs
  const bulbMat = GLOW(0xffd9a0, 3.0);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = -6.9 + t * 9.6;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), bulbMat);
    bulb.position.set(x, awnY - 0.12, b.z1 + over - 0.12);
    grp.add(bulb);
    glow(grp, 0xffca80, 0.9, 0.5, [x, awnY - 0.12, b.z1 + over - 0.1]);
  }

  /* ---- roof ---- */
  const roofY = b.h;
  const roof = box(grp, b.x1 - b.x0 + 0.3, 0.22, b.z1 - b.z0 + 0.3, M(0x1d1b20, { flat: true }), {
    p: [(b.x0 + b.x1) / 2, roofY + 0.11, (b.z0 + b.z1) / 2],
  });
  roof.castShadow = true;
  roof.receiveShadow = true;

  // shingle rows
  const shingleMat = M(0x1e1b20, { flat: true });
  for (let i = 0; i < 9; i++) {
    const zz = b.z0 + 0.5 + i * ((b.z1 - b.z0 - 0.6) / 8);
    box(grp, b.x1 - b.x0 - 0.2, 0.035, 0.1, shingleMat, { p: [(b.x0 + b.x1) / 2, roofY + 0.235, zz], castShadow: false });
  }
  // rooftop puddles
  const roofWater = new THREE.MeshBasicMaterial({ color: 0x0a0e12, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.7 + i * 0.35, 14), roofWater);
    w.rotation.x = -Math.PI / 2;
    w.position.set(-4.4 + i * 1.9, roofY + 0.24, -3.2 - i * 1.5);
    w.scale.set(1, 1, 0.55);
    grp.add(w);
  }

  // parapet
  const parMat = M(0x3a0c12);
  box(grp, b.x1 - b.x0 + 0.34, 0.42, 0.14, parMat, { p: [(b.x0 + b.x1) / 2, roofY + 0.42, b.z1 + 0.08] });
  box(grp, 0.14, 0.42, b.z1 - b.z0 + 0.3, parMat, { p: [b.x1 + 0.1, roofY + 0.42, (b.z0 + b.z1) / 2] });
  box(grp, b.x1 - b.x0 + 0.34, 0.42, 0.14, parMat, { p: [(b.x0 + b.x1) / 2, roofY + 0.42, b.z0 - 0.08] });
  box(grp, 0.14, 0.42, b.z1 - b.z0 + 0.3, parMat, { p: [b.x0 - 0.1, roofY + 0.42, (b.z0 + b.z1) / 2] });
  // chevron trim on parapet
  const parTrim = M(0xffffff, { map: chevronSmallTexture('#120f0d', '#cfc6b0', 4) });
  box(grp, b.x1 - b.x0 + 0.36, 0.09, 0.03, parTrim, { p: [(b.x0 + b.x1) / 2, roofY + 0.2, b.z1 + 0.16], castShadow: false });

  // glowing skylight over the lounge
  const skyFrame = box(grp, 2.2, 0.16, 1.5, M(0x3a2a1c), { p: [-3.0, roofY + 0.3, -3.0], castShadow: false });
  const skyGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.06, 1.3),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a3a).multiplyScalar(0.42), transparent: true, opacity: 0.9 })
  );
  skyGlass.position.set(-3.0, roofY + 0.39, -3.0);
  grp.add(skyGlass);
  glow(grp, 0xff7a4a, 2.6, 0.28, [-3.0, roofY + 0.45, -3.0]);
  for (let i = 0; i < 3; i++) {
    box(grp, 2.0, 0.03, 0.04, M(0x3a2a1c), { p: [-3.0, roofY + 0.41, -3.55 + i * 0.55], castShadow: false });
  }

  // rooftop clutter
  cyl(grp, 0.12, 0.14, 0.9, 8, M(0x4a4640), { p: [-5.2, roofY + 0.65, -6.4] });
  cyl(grp, 0.2, 0.2, 0.12, 8, M(0x3a3632), { p: [-5.2, roofY + 1.12, -6.4] });
  box(grp, 1.1, 0.5, 0.9, M(0x37343a, { flat: true }), { p: [2.0, roofY + 0.4, -6.6] });
  // water tank
  cyl(grp, 0.62, 0.62, 1.0, 12, M(0x4a3a2a), { p: [1.9, roofY + 0.75, -6.6] });
  cyl(grp, 0.66, 0.66, 0.08, 12, M(0x2a1f16), { p: [1.9, roofY + 1.28, -6.6] });

  /* ---- Twede's Cafe / Double R sign ---- */
  const signGrp = new THREE.Group();
  signGrp.position.set(-3.3, 4.72, 0.66);
  signGrp.scale.setScalar(0.86);
  signGrp.rotation.y = 0.05;

  const redMat = M(0xc0392b, { emissive: 0x3d0d06 });
  const redDeep = M(0x8b2a1d, { emissive: 0x260703 });
  const creamMat = M(0xefe6cf, { emissive: 0x161208 });
  const steel = M(0x6d6b64);

  // mounting pole
  box(signGrp, 0.15, 1.5, 0.15, redMat, { p: [0.25, 1.55, -0.09] });
  box(signGrp, 0.3, 0.9, 0.3, redDeep, { p: [0.25, 0.45, -0.09] });
  box(signGrp, 0.52, 0.14, 0.52, steel, { p: [0.25, -0.02, -0.09] });

  // ---- Cafe panel (bottom) ----
  const cafeW = 3.5, cafeH = 1.05, cafeY = 0.64;
  box(signGrp, cafeW, cafeH, 0.15, creamMat, { p: [0.05, cafeY, 0] });
  plane(signGrp, cafeW - 0.05, cafeH - 0.05, new THREE.MeshBasicMaterial({ map: cafePanel() }), {
    p: [0.05, cafeY, 0.079], castShadow: false, receiveShadow: false,
  });
  box(signGrp, cafeW + 0.12, 0.075, 0.2, steel, { p: [0.05, cafeY + cafeH / 2, 0] });
  box(signGrp, cafeW + 0.12, 0.075, 0.2, steel, { p: [0.05, cafeY - cafeH / 2, 0] });
  for (const sx of [-1, 1]) {
    box(signGrp, 0.075, cafeH, 0.2, steel, { p: [0.05 + sx * cafeW / 2, cafeY, 0] });
  }

  // ---- RR panel (left, above) ----
  const rrY = 2.05;
  box(signGrp, 1.24, 1.18, 0.13, creamMat, { p: [-1.45, rrY, -0.03] });
  plane(signGrp, 1.2, 1.14, new THREE.MeshBasicMaterial({ map: rrPanel() }), {
    p: [-1.45, rrY, 0.038], castShadow: false, receiveShadow: false,
  });
  box(signGrp, 0.09, 0.62, 0.09, steel, { p: [-1.45, 1.15, -0.06] });

  // ---- blue TWEDE'S oval (right, above) ----
  const ovalY = 2.12;
  const oval = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 1.05),
    new THREE.MeshBasicMaterial({ map: twedesOval(), transparent: true, alphaTest: 0.04, side: THREE.DoubleSide })
  );
  oval.position.set(0.6, ovalY, 0.04);
  oval.castShadow = false;
  signGrp.add(oval);
  box(signGrp, 0.13, 0.7, 0.13, redMat, { p: [0.6, 1.42, -0.05] });

  // ---- red T topper ----
  box(signGrp, 1.42, 0.5, 0.24, redMat, { p: [0.6, 3.34, -0.14] });
  box(signGrp, 0.52, 0.95, 0.24, redMat, { p: [0.6, 2.78, -0.14] });
  box(signGrp, 1.46, 0.06, 0.26, redDeep, { p: [0.6, 3.61, -0.14] });
  box(signGrp, 0.56, 0.06, 0.26, redDeep, { p: [0.6, 2.32, -0.14] });
  for (const sx of [-1, 1]) {
    box(signGrp, 0.1, 0.56, 0.28, redDeep, { p: [0.6 + sx * 0.71, 3.31, -0.14] });
    box(signGrp, 0.1, 0.9, 0.28, redDeep, { p: [0.6 + sx * 0.26, 2.78, -0.14] });
  }

  // warm backlight so the sign glows at night
  glow(signGrp, 0xffb060, 3.2, 0.26, [0.05, 1.4, -0.35]);
  glow(signGrp, 0x8fd0ff, 1.9, 0.22, [0.6, ovalY, -0.3]);
  glow(signGrp, 0xff6a4a, 1.7, 0.2, [0.6, 3.2, -0.36]);

  grp.add(signGrp);
  signGrp.traverse((o) => { o.castShadow = false; });

  /* ---- glowing owl sign ---- */
  const owl = new THREE.Group();
  const owlMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.88),
    new THREE.MeshBasicMaterial({ map: owlSilhouette(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xfff0d4 })
  );
  owl.add(owlMesh);
  glow(owl, 0xffc878, 3.4, 0.26, [0, 0, -0.12]);
  owl.position.set(2.3, 5.0, 0.5);
  owl.rotation.y = 0.72;
  grp.add(owl);
  // mount
  box(grp, 0.08, 0.9, 0.08, M(0x2a2422), { p: [2.3, 4.5, 0.5] });
  // perch bracket
  box(grp, 0.5, 0.12, 0.4, M(0x2a2422), { p: [2.45, 4.5, 0.42] });
  // owl plaque
  const owlPlaque = plaqueTexture('THE OWLS ARE NOT', 'WHAT THEY SEEM', 512, 128);
  plane(grp, 1.35, 0.34, new THREE.MeshBasicMaterial({ map: owlPlaque }), { p: [-1.55, 3.74, b.z1 + 0.16], r: [0, 0, 0] });

  /* ---- exterior velvet curtain panels on solid walls ---- */
  const sideCurtain = new THREE.Mesh(curtainGeometry(b.z1 - b.z0, b.h - 0.1, 12, 0.07, 10), velvetOut);
  sideCurtain.rotation.y = Math.PI / 2;
  sideCurtain.position.set(b.x0 - 0.2, 0.05, (b.z0 + b.z1) / 2);
  grp.add(sideCurtain);

  const backCurtain = new THREE.Mesh(curtainGeometry(b.x1 - b.x0, b.h - 0.1, 12, 0.07, 10), velvetOut);
  backCurtain.position.set((b.x0 + b.x1) / 2, 0.05, b.z0 - 0.2);
  backCurtain.rotation.y = Math.PI;
  grp.add(backCurtain);

  // back wall sconces so the model reads when orbited
  for (const bx of [-4.6, 0.6]) {
    box(grp, 0.12, 0.34, 0.16, M(0x2a1a12), { p: [bx, 2.5, b.z0 - 0.3] });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), GLOW(0xffe0b0, 1.8));
    bulb.position.set(bx, 2.42, b.z0 - 0.42);
    grp.add(bulb);
    glow(grp, 0xffc98a, 1.1, 0.3, [bx, 2.42, b.z0 - 0.44]);
  }

  scene.add(grp);
  return { group: grp, doorL, doorR, doorHomeL, doorHomeR, glassMats, owl, signGrp };
}
