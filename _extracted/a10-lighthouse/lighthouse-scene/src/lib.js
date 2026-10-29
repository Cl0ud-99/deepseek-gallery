import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  utils                                                              */
/* ------------------------------------------------------------------ */

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function canvasTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/*  procedural textures                                                */
/* ------------------------------------------------------------------ */

export function soilTexture() {
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(7);
  g.fillStyle = '#6b5b46'; g.fillRect(0, 0, S, S);

  // bold geological strata
  let y = -20;
  while (y < S + 20) {
    const h = 5 + r() * 26;
    const tone = r();
    const v = tone < 0.32 ? 30 + r() * 22 : tone < 0.7 ? 92 + r() * 44 : 128 + r() * 40;
    g.fillStyle = `rgb(${v},${v - 8},${v - 20})`;
    g.beginPath();
    const off = (r() - 0.5) * 10;
    g.moveTo(-10, y + off);
    for (let x = 0; x <= S + 20; x += 16) g.lineTo(x, y + off + Math.sin(x * 0.02 + y) * 5 + (r() - 0.5) * 3);
    for (let x = S + 20; x >= -10; x -= 16) g.lineTo(x, y + off + h + Math.sin(x * 0.017 + y * 1.3) * 5);
    g.closePath(); g.fill();
    y += h;
  }
  // grain + pebbles
  for (let i = 0; i < 2600; i++) {
    const x = r() * S, y2 = r() * S, rr = 0.5 + r() * 3.2;
    const v = Math.floor(25 + r() * 130);
    g.fillStyle = `rgba(${v},${v - 4},${v - 12},${0.15 + r() * 0.55})`;
    g.beginPath(); g.ellipse(x, y2, rr, rr * (0.5 + r()), r() * 3, 0, 6.3); g.fill();
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * S, y2 = r() * S, rr = 3 + r() * 9;
    g.fillStyle = `rgb(${120 + r() * 70},${112 + r() * 60},${100 + r() * 55})`;
    g.beginPath(); g.ellipse(x, y2, rr, rr * 0.7, r() * 3, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(30,24,16,0.55)';
    g.beginPath(); g.ellipse(x + 1.5, y2 + 1.5, rr, rr * 0.7, r() * 3, 0, 6.3); g.fill();
  }
  // roots
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(18,14,10,${0.3 + r() * 0.5})`;
    g.lineWidth = 0.6 + r() * 1.8;
    g.beginPath();
    let x = r() * S, y2 = r() * S; g.moveTo(x, y2);
    for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 26; y2 += 6 + r() * 18; g.lineTo(x, y2); }
    g.stroke();
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function rockTexture() {
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(31);
  g.fillStyle = '#5c5c5e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const v = Math.floor(24 + r() * 110);
    g.fillStyle = `rgba(${v},${v},${v + 3},${0.10 + r() * 0.40})`;
    const x = r() * S, y = r() * S, rr = 4 + r() * 46;
    g.beginPath(); g.ellipse(x, y, rr, rr * (0.3 + r() * 0.7), r() * 3, 0, 6.3); g.fill();
  }
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(12,12,14,${0.3 + r() * 0.5})`;
    g.lineWidth = 0.7 + r() * 2.2;
    g.beginPath();
    let x = r() * S, y = r() * S; g.moveTo(x, y);
    for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 500; i++) {
    const v = Math.floor(140 + r() * 70);
    g.fillStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.2})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

/* plaster skin peeling off, brick beneath */
export function towerTexture() {
  const S = 1024, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(21);
  g.fillStyle = '#b8b2a4'; g.fillRect(0, 0, S, S);

  for (let i = 0; i < 3000; i++) {
    const v = Math.floor(120 + r() * 110);
    g.fillStyle = `rgba(${v},${v - 3},${v - 10},${0.03 + r() * 0.13})`;
    const x = r() * S, y = r() * S, rr = 2 + r() * 34;
    g.beginPath(); g.ellipse(x, y, rr, rr * (0.35 + r()), r() * 3, 0, 6.3); g.fill();
  }

  // exposed brick patches
  for (let i = 0; i < 16; i++) {
    const cx = r() * S, cy = r() * S, w = 40 + r() * 130, h = 30 + r() * 110;
    const pts = 13, path = [];
    for (let k = 0; k <= pts; k++) {
      const a = k / pts * Math.PI * 2;
      const rr = 0.72 + r() * 0.5;
      path.push([cx + Math.cos(a) * w * 0.5 * rr, cy + Math.sin(a) * h * 0.5 * rr]);
    }
    g.save();
    g.beginPath();
    path.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
    g.clip();
    g.fillStyle = '#3a322d'; g.fillRect(cx - w, cy - h, w * 2, h * 2);
    const bh = 21, bw = 48;
    for (let yy = cy - h; yy < cy + h; yy += bh) {
      const off = (Math.floor(yy / bh) % 2) * bw * 0.5;
      for (let xx = cx - w - off; xx < cx + w; xx += bw) {
        const v = Math.floor(52 + r() * 40);
        g.fillStyle = `rgb(${v + 14},${v + 2},${v - 2})`;
        g.fillRect(xx + 2, yy + 2, bw - 4, bh - 4);
      }
    }
    g.restore();
    g.strokeStyle = 'rgba(24,22,20,0.35)'; g.lineWidth = 2.0;
    g.beginPath();
    path.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath(); g.stroke();
  }

  // salt / water streaks
  for (let i = 0; i < 70; i++) {
    const x = r() * S, w = 2 + r() * 12;
    const grd = g.createLinearGradient(0, 0, 0, S);
    grd.addColorStop(0, 'rgba(255,255,252,0.11)');
    grd.addColorStop(0.7, 'rgba(255,255,252,0.03)');
    grd.addColorStop(1, 'rgba(255,255,252,0)');
    g.fillStyle = grd; g.fillRect(x, 0, w, S);
  }
  // cracks
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(15,13,12,${0.35 + r() * 0.4})`;
    g.lineWidth = 0.8 + r() * 1.6;
    g.beginPath();
    let x = r() * S, y = r() * S; g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (r() - 0.5) * 30; y += 10 + r() * 26; g.lineTo(x, y); }
    g.stroke();
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function woodTexture() {
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(88);
  g.fillStyle = '#6b543c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 180; i++) {
    const v = Math.floor(50 + r() * 80);
    g.strokeStyle = `rgba(${v + 18},${v},${v - 12},${0.12 + r() * 0.4})`;
    g.lineWidth = 0.6 + r() * 2.4;
    g.beginPath();
    let y = r() * S;
    g.moveTo(0, y);
    for (let x = 0; x <= S; x += 16) { y += (r() - 0.5) * 3.2; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = 'rgba(30,22,14,0.55)';
    g.lineWidth = 1.2 + r() * 2;
    g.beginPath(); g.ellipse(r() * S, r() * S, 3 + r() * 12, 2 + r() * 6, r() * 3, 0, 6.3); g.stroke();
  }
  // plank seams
  for (let x = 0; x <= S; x += 128) {
    g.fillStyle = 'rgba(22,16,10,0.65)'; g.fillRect(x, 0, 3, S);
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function labelTexture(title, sub, batch) {
  const W = 320, H = 240, c = makeCanvas(W, H), g = c.getContext('2d');
  const r = mulberry32(batch * 13 + 5);
  g.fillStyle = '#cbb589'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) {
    const v = Math.floor(120 + r() * 90);
    g.fillStyle = `rgba(${v},${v - 12},${v - 40},${0.05 + r() * 0.16})`;
    g.fillRect(r() * W, r() * H, 1 + r() * 6, 1 + r() * 4);
  }
  g.strokeStyle = 'rgba(35,25,15,0.8)'; g.lineWidth = 5;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.lineWidth = 1.6; g.strokeRect(24, 24, W - 48, H - 48);

  g.fillStyle = '#211710';
  g.textAlign = 'center';
  g.font = 'bold 34px Georgia, serif';
  g.fillText(title, W / 2, 92);
  g.font = '17px Georgia, serif';
  g.fillText(sub, W / 2, 122);
  g.font = '13px Georgia, serif';
  g.fillText('DISTILLED  ·  CASK No.' + (1200 + Math.floor(r() * 700)), W / 2, 160);

  g.strokeStyle = 'rgba(40,28,16,0.75)'; g.lineWidth = 2;
  g.beginPath(); g.arc(W / 2, 190, 26, 0, 6.3); g.stroke();
  g.font = 'bold 11px Georgia, serif';
  g.fillText('PROOF', W / 2, 187);
  g.fillText('100', W / 2, 201);

  // stains
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(60,40,20,${0.05 + r() * 0.12})`;
    g.beginPath(); g.ellipse(r() * W, r() * H, 8 + r() * 40, 6 + r() * 26, r() * 3, 0, 6.3); g.fill();
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function glowTexture() {
  const S = 256, c = makeCanvas(S, S), g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.16, 'rgba(255,250,235,0.72)');
  grd.addColorStop(0.42, 'rgba(255,245,220,0.22)');
  grd.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  return canvasTexture(c, { repeat: [1, 1] });
}

export function rainGlassTexture() {
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(5);
  g.clearRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = r() * S, len = 30 + r() * 260, w = 0.7 + r() * 2.4;
    const grd = g.createLinearGradient(0, 0, 0, len);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.4, `rgba(255,255,255,${0.05 + r() * 0.18})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.save(); g.translate(x, r() * S); g.fillRect(-w / 2, 0, w, len); g.restore();
  }
  for (let i = 0; i < 180; i++) {
    const x = r() * S, y = r() * S, rr = 0.8 + r() * 3;
    g.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.25})`;
    g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fill();
  }
  const t = canvasTexture(c, { repeat: [3, 1] });
  return t;
}

export function floorDecalTexture() {
  const S = 512, c = makeCanvas(S, S), g = c.getContext('2d');
  const r = mulberry32(99);
  g.clearRect(0, 0, S, S);
  // mud boot prints
  for (let i = 0; i < 9; i++) {
    g.save();
    g.translate(80 + r() * 350, 70 + r() * 370);
    g.rotate(r() * 6.3);
    g.scale(0.7 + r() * 0.6, 0.7 + r() * 0.6);
    g.fillStyle = `rgba(28,22,16,${0.25 + r() * 0.4})`;
    g.beginPath(); g.ellipse(0, 0, 17, 34, 0, 0, 6.3); g.fill();
    g.beginPath(); g.ellipse(0, 40, 14, 12, 0, 0, 6.3); g.fill();
    for (let k = -2; k <= 2; k++) {
      g.beginPath(); g.ellipse(k * 6, -6 + Math.abs(k) * 3, 4, 3, 0, 0, 6.3); g.fill();
    }
    g.restore();
  }
  // feathers
  for (let i = 0; i < 16; i++) {
    g.save();
    g.translate(r() * S, r() * S); g.rotate(r() * 6.3);
    g.fillStyle = `rgba(235,232,225,${0.35 + r() * 0.45})`;
    g.beginPath();
    g.moveTo(0, -22); g.quadraticCurveTo(9, 0, 0, 22); g.quadraticCurveTo(-9, 0, 0, -22);
    g.fill();
    g.strokeStyle = 'rgba(60,55,48,0.5)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 20); g.stroke();
    g.restore();
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function envTexture() {
  const W = 1024, H = 512, c = makeCanvas(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#2a2f38');
  grd.addColorStop(0.45, '#14161b');
  grd.addColorStop(0.52, '#0b0c0f');
  grd.addColorStop(1, '#050506');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // moon glow
  const mg = g.createRadialGradient(220, 120, 0, 220, 120, 210);
  mg.addColorStop(0, 'rgba(210,220,235,0.95)');
  mg.addColorStop(0.12, 'rgba(170,182,200,0.45)');
  mg.addColorStop(1, 'rgba(120,130,150,0)');
  g.fillStyle = mg; g.fillRect(0, 0, W, H);
  // warm bounce (brass will pick this up)
  const wg = g.createRadialGradient(760, 300, 0, 760, 300, 240);
  wg.addColorStop(0, 'rgba(190,150,90,0.30)');
  wg.addColorStop(1, 'rgba(120,90,50,0)');
  g.fillStyle = wg; g.fillRect(0, 0, W, H);
  const t = canvasTexture(c, { repeat: [1, 1] });
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/* ------------------------------------------------------------------ */
/*  geometry helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Solid arc shell (a section of a tapered cylinder wall) with cut end faces.
 * Angle 0 is +X, increasing toward +Z.
 */
export function makeArcWall({
  rb, rt, y0, y1, a0, a1, thickness = 0.16, segs = 48, uvScale = 3.2,
}) {
  const pos = [], uv = [], idx = [];
  const n = segs;
  const ob = [], ot = [], ib = [], it = [];

  const push = (x, y, z, u, v) => {
    pos.push(x, y, z); uv.push(u, v); return pos.length / 3 - 1;
  };

  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const cs = Math.cos(a), sn = Math.sin(a);
    const u = (a - a0) * ((rb + rt) * 0.5) / uvScale;
    const v = (y1 - y0) / uvScale;
    ob.push(push(rb * cs, y0, rb * sn, u, 0));
    ot.push(push(rt * cs, y1, rt * sn, u, v));
    ib.push(push((rb - thickness) * cs, y0, (rb - thickness) * sn, u, 0));
    it.push(push((rt - thickness) * cs, y1, (rt - thickness) * sn, u, v));
  }

  for (let i = 0; i < n; i++) {
    idx.push(ob[i], ob[i + 1], ot[i + 1], ob[i], ot[i + 1], ot[i]);
    idx.push(ib[i], it[i], it[i + 1], ib[i], it[i + 1], ib[i + 1]);
    idx.push(ot[i], ot[i + 1], it[i + 1], ot[i], it[i + 1], it[i]);
    idx.push(ob[i], ib[i], ib[i + 1], ob[i], ib[i + 1], ob[i + 1]);
  }
  idx.push(ob[0], ot[0], it[0], ob[0], it[0], ib[0]);
  idx.push(ob[n], ib[n], it[n], ob[n], it[n], ot[n]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Single curved surface patch (used for glass slits and decals on the tower) */
export function makeArcSurface({ rb, rt, y0, y1, a0, a1, segs = 24, offset = 0 }) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const a = a0 + (a1 - a0) * i / segs;
    const cs = Math.cos(a), sn = Math.sin(a);
    pos.push((rb + offset) * cs, y0, (rb + offset) * sn);
    pos.push((rt + offset) * cs, y1, (rt + offset) * sn);
    uv.push(i / segs, 0, i / segs, 1);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 3, a, a + 3, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Flat gear lying in the XZ plane, extruded along Y */
export function makeGear({ r = 1, teeth = 24, tooth = 0.09, thickness = 0.06, hole = 0.4 }) {
  const shape = new THREE.Shape();
  const N = teeth * 4;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const phase = i % 4;
    const rr = (phase === 1 || phase === 2) ? r : r - tooth;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  if (hole > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Whiskey crate with slats, label and optional open lid + bottles */
export function makeCrate({
  w = 0.92, h = 0.62, d = 0.66, wood, slat, label, labelMat, bottleMat, corkMat, open = false,
}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  const t = 0.035;
  const addSlat = (sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), slat);
    m.position.set(x, y, z); m.castShadow = true; g.add(m);
  };
  // horizontal bands front / back
  for (const z of [d / 2 + 0.012, -d / 2 - 0.012]) {
    addSlat(w + 0.03, t, 0.03, 0, h * 0.30, z);
    addSlat(w + 0.03, t, 0.03, 0, -h * 0.30, z);
  }
  // vertical corner battens
  for (const x of [w / 2 + 0.012, -w / 2 - 0.012]) {
    for (const z of [d / 2 + 0.012, -d / 2 - 0.012]) {
      addSlat(0.045, h + 0.02, 0.045, x, 0, z);
    }
  }
  // labels on the four sides
  const lm = labelMat;
  const lgeo = new THREE.PlaneGeometry(0.5, 0.36);
  for (const [x, z, ry] of [[0, d / 2 + 0.032, 0], [0, -d / 2 - 0.032, Math.PI], [w / 2 + 0.032, 0, Math.PI / 2], [-w / 2 - 0.032, 0, -Math.PI / 2]]) {
    const m = new THREE.Mesh(lgeo, lm);
    m.position.set(x, 0.02, z); m.rotation.y = ry;
    g.add(m);
  }

  if (open) {
    const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.05, d + 0.02), wood);
    lid.position.set(-w * 0.62, h / 2 + 0.02, 0);
    lid.rotation.z = 1.9;
    lid.castShadow = true;
    g.add(lid);
    // bottles standing inside
    for (let i = 0; i < 5; i++) {
      const bx = (i % 3 - 1) * 0.24, bz = (Math.floor(i / 3) - 0.5) * 0.26;
      const b = new THREE.Group();
      const bodyB = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.26, 8), bottleMat);
      bodyB.position.y = 0.13; b.add(bodyB);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.05, 0.12, 8), bottleMat);
      neck.position.y = 0.31; b.add(neck);
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6), corkMat);
      cork.position.y = 0.39; b.add(cork);
      b.position.set(bx, -h / 2 + 0.02, bz);
      g.add(b);
    }
  }
  return g;
}

/** Low-poly gull silhouette with flapping wings */
export function makeGull(mat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.15, 3, 7), mat);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 7, 6), mat);
  head.position.set(0.12, 0.018, 0); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.08, 5), mat);
  beak.rotation.z = -Math.PI / 2; beak.position.set(0.185, 0.008, 0); g.add(beak);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 4), mat);
  tail.rotation.z = Math.PI / 2; tail.position.set(-0.14, 0, 0); g.add(tail);

  // swept wing (fan from the shoulder)
  const pts = [
    [0.07, 0.10], [0.02, 0.34], [-0.05, 0.56], [-0.11, 0.70],
    [-0.17, 0.50], [-0.15, 0.26], [-0.07, 0.05],
  ];
  const pos = [0, 0, 0];
  for (const [x, z] of pts) pos.push(x, 0, z);
  const idx = [];
  for (let i = 1; i <= pts.length; i++) idx.push(0, i, i === pts.length ? 1 : i + 1);
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  wingGeo.setIndex(idx);
  wingGeo.computeVertexNormals();

  const wl = new THREE.Group(), wr = new THREE.Group();
  const ml = new THREE.Mesh(wingGeo, mat);
  const mr = new THREE.Mesh(wingGeo, mat);
  mr.scale.z = -1;
  wl.add(ml); wr.add(mr);
  g.add(wl, wr);
  g.userData.wings = [wl, wr];
  return g;
}
