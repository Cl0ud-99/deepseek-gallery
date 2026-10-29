import * as THREE from 'three';
import { PAL, M, MB, GLOW, add, box, cyl, sph, plane, timeU, glow, tubeBetween, catenary } from './style.js';
import {
  vendingFront, welcomeSign, lauraPhoto, owlCaveMap, fbiTape, chevronSmallTexture,
  woodTexture, barkTexture, woodGrain, cv, makeTex,
} from './textures.js';
import { L } from './layout.js';

/* ------------------------------------------------------------------ *
 *  Vending machine
 * ------------------------------------------------------------------ */
function vendingMachine() {
  const g = new THREE.Group();
  const bodyMat = M(0x5a0f16, { emissive: 0x120306 });
  box(g, 1.05, 1.95, 0.72, bodyMat, { p: [0, 0.98, 0] });
  box(g, 1.1, 0.08, 0.78, M(0x2a0a0c), { p: [0, 1.99, 0] });
  box(g, 1.1, 0.06, 0.78, M(0x2a0a0c), { p: [0, 0.05, 0] });
  // glowing front
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.72), new THREE.MeshBasicMaterial({ map: vendingFront() }));
  front.position.set(0, 1.02, 0.365);
  g.add(front);
  // side chevron stripe
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.16), M(0xffffff, { map: chevronSmallTexture('#0f0d0b', '#d8cfb8', 3) }));
  stripe.position.set(0.53, 1.75, 0);
  stripe.rotation.y = Math.PI / 2;
  g.add(stripe);
  glow(g, 0xffb070, 1.6, 0.3, [0, 1.1, 0.55]);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Sheriff bicycle
 * ------------------------------------------------------------------ */
function bicycle() {
  const g = new THREE.Group();
  const frameMat = M(0x2b3a34);
  const chrome = M(0xb8b6ae);
  const rubber = M(0x141212);
  const wheel = (x) => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 6, 20), rubber);
    w.add(t);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 4, 20), chrome);
    w.add(rim);
    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 3), chrome);
      sp.rotation.z = (i / 8) * Math.PI;
      w.add(sp);
    }
    w.rotation.y = Math.PI / 2;
    w.position.set(x, 0.36, 0);
    return w;
  };
  g.add(wheel(-0.52));
  g.add(wheel(0.52));
  // frame
  tubeBetween(g, [-0.52, 0.36, 0], [-0.05, 0.72, 0], 0.022, frameMat);
  tubeBetween(g, [-0.05, 0.72, 0], [0.3, 0.7, 0], 0.022, frameMat);
  tubeBetween(g, [0.3, 0.7, 0], [0.52, 0.36, 0], 0.022, frameMat);
  tubeBetween(g, [-0.05, 0.72, 0], [0.3, 0.36, 0], 0.02, frameMat);
  tubeBetween(g, [0.3, 0.36, 0], [0.52, 0.36, 0], 0.018, frameMat);
  tubeBetween(g, [0.3, 0.36, 0], [0.3, 0.7, 0], 0.02, frameMat);
  // handlebar
  tubeBetween(g, [0.3, 0.7, 0], [0.26, 0.92, 0], 0.02, chrome);
  tubeBetween(g, [0.26, 0.92, -0.22], [0.26, 0.92, 0.22], 0.016, chrome);
  // saddle
  box(g, 0.2, 0.06, 0.12, M(0x2a1a12), { p: [-0.08, 0.76, 0] });
  // basket
  const basket = new THREE.Group();
  box(basket, 0.28, 0.22, 0.34, M(0x6a5438, { flatShading: true }), { p: [0, 0, 0] });
  for (let i = 0; i < 3; i++) box(basket, 0.3, 0.012, 0.012, M(0x3a2a1a), { p: [0, -0.08 + i * 0.08, 0.18], castShadow: false });
  basket.position.set(0.36, 0.82, 0);
  g.add(basket);
  // headlamp
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), GLOW(0xfff0c8, 2.2));
  lamp.position.set(0.42, 0.68, 0);
  g.add(lamp);
  // kickstand
  tubeBetween(g, [-0.1, 0.34, 0], [-0.16, 0.02, 0.12], 0.012, chrome);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Logging handcart
 * ------------------------------------------------------------------ */
function handcart() {
  const g = new THREE.Group();
  const wood = M(0x4a3524, { flatShading: true });
  const iron = M(0x2a2724);
  box(g, 1.5, 0.1, 1.0, wood, { p: [0, 0.5, 0] });
  for (const s of [-1, 1]) {
    box(g, 1.5, 0.16, 0.08, wood, { p: [0, 0.62, s * 0.46] });
    // wheel
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 14), wood);
    w.position.set(0.2, 0.44, s * 0.56);
    w.rotation.x = Math.PI / 2;
    w.castShadow = true;
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 8), iron);
    hub.position.copy(w.position);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), wood);
      sp.position.copy(w.position);
      sp.rotation.x = Math.PI / 2;
      sp.rotation.y = (i / 6) * Math.PI;
      g.add(sp);
    }
  }
  // handle
  tubeBetween(g, [-0.75, 0.6, -0.4], [-1.25, 0.95, -0.4], 0.03, wood);
  tubeBetween(g, [-0.75, 0.6, 0.4], [-1.25, 0.95, 0.4], 0.03, wood);
  tubeBetween(g, [-1.25, 0.95, -0.4], [-1.25, 0.95, 0.4], 0.028, wood);
  // logs
  const logMat = M(0x3a2a1c);
  for (let i = 0; i < 3; i++) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 1.6, 9), logMat);
    lg.position.set(0.05, 0.7 + i * 0.3, (i - 1) * 0.3);
    lg.rotation.z = Math.PI / 2;
    lg.rotation.x = 0.05 * (i - 1);
    lg.castShadow = true;
    g.add(lg);
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 9), M(0x8a6a44));
    end.position.set(0.86, 0.7 + i * 0.3, (i - 1) * 0.3);
    end.rotation.z = Math.PI / 2;
    g.add(end);
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Stump umbrella stand
 * ------------------------------------------------------------------ */
function umbrellaStand() {
  const g = new THREE.Group();
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.78, 10), M(0xffffff, { map: barkTexture('#3a2a1c', '#150e09', '#6b5238') }));
  stump.position.y = 0.39;
  stump.castShadow = true;
  stump.receiveShadow = true;
  g.add(stump);
  const hollow = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 10), M(0x0a0705));
  hollow.position.y = 0.77;
  g.add(hollow);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 5, 12), M(0x4a3524));
  rim.position.y = 0.78;
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  // umbrellas
  const umbMat = M(0x141214, { side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    const tilt = 0.22 + i * 0.06;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.9, 5), M(0x2a2724));
    shaft.position.set(Math.cos(a) * 0.12, 1.05, Math.sin(a) * 0.12);
    shaft.rotation.z = Math.cos(a) * tilt;
    shaft.rotation.x = -Math.sin(a) * tilt;
    g.add(shaft);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 8, 1, true), umbMat);
    canopy.position.set(Math.cos(a) * 0.28, 1.75, Math.sin(a) * 0.28);
    canopy.rotation.z = Math.cos(a) * tilt;
    canopy.rotation.x = -Math.sin(a) * tilt;
    canopy.castShadow = true;
    g.add(canopy);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), M(0x8a8278));
    tip.position.set(Math.cos(a) * 0.3, 2.0, Math.sin(a) * 0.3);
    g.add(tip);
    // crook handle
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 5, 10, Math.PI * 1.2), M(0x4a2a18));
    hook.position.set(Math.cos(a) * 0.06, 0.14, Math.sin(a) * 0.06);
    hook.rotation.y = a;
    g.add(hook);
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Wrapped trash can
 * ------------------------------------------------------------------ */
function trashCan() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.29, 0.85, 12), M(0x2c3a30, { flatShading: true }));
  body.position.y = 0.43;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.018, 4, 14), M(0x1c2620));
    r.position.y = 0.18 + i * 0.28;
    r.rotation.x = Math.PI / 2;
    g.add(r);
  }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12), M(0x222e26));
  lid.position.y = 0.87;
  g.add(lid);
  // translucent plastic wrap
  const plastic = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.35, 1.0, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xdfe8ea, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
  );
  plastic.position.y = 0.46;
  g.add(plastic);
  // rope
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.014, 4, 16), M(0xb09a70));
    r.position.y = 0.24 + i * 0.3;
    r.rotation.x = Math.PI / 2;
    r.rotation.z = 0.1 * i;
    g.add(r);
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Street lamp
 * ------------------------------------------------------------------ */
function streetLamp() {
  const g = new THREE.Group();
  const brass = M(0x8a6a32, { emissive: 0x1a1004 });
  cyl(g, 0.24, 0.3, 0.12, 12, M(0x1e1a17), { p: [0, 0.06, 0] });
  cyl(g, 0.09, 0.13, 3.3, 10, brass, { p: [0, 1.71, 0] });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 4, 10), brass);
    r.position.y = 0.5 + i * 0.9;
    r.rotation.x = Math.PI / 2;
    g.add(r);
  }
  // curved arm
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.36, 0),
    new THREE.Vector3(0.05, 3.62, 0),
    new THREE.Vector3(0.3, 3.74, 0),
    new THREE.Vector3(0.55, 3.7, 0),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.04, 6, false), brass);
  arm.castShadow = true;
  g.add(arm);
  // globe
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), GLOW(0xfff1cf, 1.7));
  globe.position.set(0.55, 3.5, 0);
  g.add(globe);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 10), brass);
  cap.position.set(0.55, 3.76, 0);
  g.add(cap);
  glow(g, 0xffd9a0, 1.15, 0.3, [0.55, 3.5, 0]);
  g.userData.globePos = new THREE.Vector3(0.55, 3.5, 0);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Utility pole with petroglyphs + transformer
 * ------------------------------------------------------------------ */
function glyphTexture() {
  const W = 256, H = 512;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a1c12';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // spiral
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4.4; a += 0.12) {
    const r = 6 + a * 7;
    const x = W / 2 + Math.cos(a) * r;
    const y = 120 + Math.sin(a) * r;
    a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  // triangle
  ctx.beginPath();
  ctx.moveTo(W / 2, 230);
  ctx.lineTo(W / 2 + 46, 300);
  ctx.lineTo(W / 2 - 46, 300);
  ctx.closePath();
  ctx.stroke();
  // zigzag
  ctx.beginPath();
  ctx.moveTo(60, 360);
  for (let i = 0; i < 5; i++) ctx.lineTo(60 + i * 30, i % 2 ? 360 : 400);
  ctx.stroke();
  // owl eyes
  ctx.beginPath(); ctx.arc(W / 2 - 26, 460, 16, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2 + 26, 460, 16, 0, 7); ctx.stroke();
  return makeTex(c, { clamp: true });
}

function utilityPole() {
  const g = new THREE.Group();
  const barkTex = barkTexture('#3a2c1e', '#100b07', '#63492f');
barkTex.repeat.set(2.5, 3.5);
  const barkMat = M(0xffffff, { map: barkTex });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.27, L.pole.h, 10, 4), barkMat);
  pole.position.y = L.pole.h / 2;
  pole.castShadow = true;
  pole.receiveShadow = true;
  g.add(pole);
  // base flare
  cyl(g, 0.34, 0.42, 0.3, 10, M(0x241a12), { p: [0, 0.15, 0] });
  // crossarms
  const woodMat = M(0x3a2a1c, { flatShading: true });
  for (let i = 0; i < 2; i++) {
    const y = 6.5 + i * 0.85;
    box(g, 2.4, 0.12, 0.12, woodMat, { p: [0, y, 0] });
    for (let k = -1; k <= 1; k += 2) {
      cyl(g, 0.05, 0.06, 0.18, 6, M(0xd8d2c0), { p: [k * 0.9, y + 0.14, 0] });
      cyl(g, 0.05, 0.06, 0.18, 6, M(0xd8d2c0), { p: [k * 0.35, y + 0.14, 0] });
    }
  }
  // glyph plaques
  const glyph = glyphTexture();
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.68), new THREE.MeshBasicMaterial({ map: glyph, transparent: true }));
    p.position.set(0.0, 1.5 + i * 0.9, 0.27);
    p.rotation.y = 0;
    g.add(p);
  }
  // transformer cans
  for (let i = 0; i < 2; i++) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.7, 12), M(0x4a4a46, { flatShading: true }));
    can.position.set(0.36, 3.1 + i * 0.85, 0);
    can.castShadow = true;
    g.add(can);
    for (let k = 0; k < 5; k++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), M(0x3a3a36));
      fin.position.set(0.36 + 0.18, 3.1 + i * 0.85, -0.2 + k * 0.1);
      g.add(fin);
    }
  }
  box(g, 0.9, 0.08, 0.4, M(0x2a2a26), { p: [0.36, 2.72, 0] });
  // climbing steps
  for (let i = 0; i < 6; i++) {
    box(g, 0.05, 0.04, 0.26, M(0x5a5a52), { p: [-0.2, 1.4 + i * 0.55, 0], castShadow: false });
  }
  // humming glow
  glow(g, 0x8fb6ff, 1.2, 0.22, [0.36, 3.4, 0.3]);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Welcome sign
 * ------------------------------------------------------------------ */
function welcomeSignBoard() {
  const g = new THREE.Group();
  const postMat = M(0x3a2a1c, { flatShading: true });
  for (const s of [-1, 1]) {
    cyl(g, 0.07, 0.09, 1.55, 7, postMat, { p: [s * 0.95, 0.78, 0] });
    cyl(g, 0.13, 0.15, 0.1, 7, M(0x241a12), { p: [s * 0.95, 0.05, 0] });
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 0.09), [
    M(0x3a2a1c), M(0x3a2a1c), M(0x3a2a1c), M(0x3a2a1c),
    new THREE.MeshBasicMaterial({ map: welcomeSign() }), M(0x3a2a1c),
  ]);
  board.position.set(0, 1.3, 0);
  board.castShadow = true;
  g.add(board);
  // small hanging plank
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 0.05), M(0x4a3524));
  plank.position.set(0, 0.6, 0.02);
  g.add(plank);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Railing — logs + chevron panels
 * ------------------------------------------------------------------ */
function railing(len, axis = 'x') {
  const g = new THREE.Group();
  const logMat = M(0x3a2a1c, { flatShading: true });
  const chevTex = chevronSmallTexture('#100e0c', '#c9c0aa', 1);
  const panelMat = M(0xffffff, { map: chevTex, side: THREE.DoubleSide });
  const posts = Math.max(2, Math.round(len / 1.5) + 1);
  for (let i = 0; i < posts; i++) {
    const x = -len / 2 + (i / (posts - 1)) * len;
    cyl(g, 0.075, 0.09, 0.95, 7, logMat, { p: [x, 0.48, 0] });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 7, 5), logMat);
    cap.position.set(x, 0.96, 0);
    g.add(cap);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, len, 7), logMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 0.88;
  rail.castShadow = true;
  g.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 0.24;
  g.add(rail2);
  // chevron panels
  for (let i = 0; i < posts - 1; i++) {
    const x = -len / 2 + ((i + 0.5) / (posts - 1)) * len;
    const w = len / (posts - 1) - 0.18;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.58), panelMat);
    p.position.set(x, 0.56, 0);
    p.castShadow = false;
    g.add(p);
  }
  if (axis === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

/* ------------------------------------------------------------------ *
 *  1950s sedan
 * ------------------------------------------------------------------ */
function sedan() {
  const g = new THREE.Group();
  const bodyMat = M(0x5d7a70);
  const roofMat = M(0x8a8574);
  const chrome = M(0xc9c6bc, { emissive: 0x1a1a18 });
  const glassMat = M(0x1a2a2e, { emissive: 0x05080a });

  const s = new THREE.Shape();
  s.moveTo(-2.35, 0.34);
  s.lineTo(-2.4, 0.56);
  s.quadraticCurveTo(-2.2, 0.72, -1.75, 0.75);
  s.lineTo(-1.05, 0.78);
  s.quadraticCurveTo(-0.75, 1.14, 0.0, 1.16);
  s.lineTo(0.72, 1.14);
  s.quadraticCurveTo(1.25, 0.98, 1.55, 0.78);
  s.lineTo(2.15, 0.72);
  s.quadraticCurveTo(2.42, 0.66, 2.4, 0.44);
  s.lineTo(2.36, 0.32);
  s.lineTo(-2.35, 0.34);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  const body = new THREE.Mesh(geo, bodyMat);
  body.position.z = -0.9;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // roof + chrome drip rail
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.09, 1.5), roofMat);
  roof.position.set(-0.18, 1.19, 0);
  roof.castShadow = true;
  g.add(roof);
  for (const s3 of [-1, 1]) {
    box(g, 1.4, 0.03, 0.04, chrome, { p: [-0.18, 1.14, s3 * 0.77], castShadow: false });
    box(g, 0.04, 0.03, 1.55, chrome, { p: [-0.85, 1.14, 0], castShadow: false });
  }
  // pillars
  for (const s3 of [-1, 1]) {
    box(g, 0.07, 0.3, 0.06, bodyMat, { p: [0.42, 1.02, s3 * 0.79], r: [0, 0, 0.32] });
    box(g, 0.07, 0.28, 0.06, bodyMat, { p: [-0.78, 1.02, s3 * 0.79], r: [0, 0, -0.3] });
  }

  // windows
  for (const s2 of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.34), glassMat);
    win.position.set(-0.15, 1.06, s2 * 0.9);
    win.rotation.y = s2 > 0 ? 0 : Math.PI;
    g.add(win);
  }
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), glassMat);
  windshield.position.set(0.62, 1.02, 0);
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.z = 0.5;
  g.add(windshield);

  // chrome bumpers
  for (const s2 of [-1, 1]) {
    box(g, 0.18, 0.16, 1.9, chrome, { p: [s2 * 2.4, 0.44, 0] });
  }
  // headlights
  for (const s2 of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), GLOW(0xfff2d0, 2.2));
    hl.position.set(2.36, 0.6, s2 * 0.62);
    g.add(hl);
    glow(g, 0xffe0a0, 0.8, 0.35, [2.42, 0.6, s2 * 0.62]);
  }
  // tail fins
  for (const s2 of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 3), bodyMat);
    fin.position.set(-2.2, 0.82, s2 * 0.66);
    fin.rotation.z = 0.9;
    fin.rotation.y = Math.PI / 2;
    g.add(fin);
  }
  // wheels
  for (const x of [-1.55, 1.55]) {
    for (const z of [-0.92, 0.92]) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 14), M(0x161414));
      tire.position.set(x, 0.38, z);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      g.add(tire);
      const white = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 14), M(0xd8d2c0));
      white.position.set(x, 0.38, z);
      white.rotation.x = Math.PI / 2;
      g.add(white);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 10), chrome);
      hub.position.set(x, 0.38, z);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
    }
  }
  // side chrome trim
  for (const s2 of [-1, 1]) {
    box(g, 3.6, 0.04, 0.03, chrome, { p: [0, 0.66, s2 * 0.93], castShadow: false });
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Bulletin board
 * ------------------------------------------------------------------ */
function bulletinBoard() {
  const g = new THREE.Group();
  const frame = M(0x3a2418);
  box(g, 1.6, 1.1, 0.08, M(0xffffff, { map: woodTexture('#3a2418', '#22150e', 2, [2, 1]) }), { p: [0, 0, 0] });
  plane(g, 1.44, 0.94, M(0xb08a55, { map: woodGrain('#b08a55') }), { p: [0, 0, 0.045] });
  // roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.3), frame);
  roof.position.set(0, 0.58, 0.06);
  roof.rotation.x = 0.18;
  g.add(roof);
  // items
  const items = [
    { tex: lauraPhoto(), w: 0.36, h: 0.45, p: [-0.42, 0.02] },
    { tex: owlCaveMap(), w: 0.4, h: 0.4, p: [0.16, 0.1] },
    { tex: fbiTape(), w: 0.44, h: 0.14, p: [0.12, -0.3] },
  ];
  for (const it of items) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), new THREE.MeshBasicMaterial({ map: it.tex }));
    m.position.set(it.p[0], it.p[1], 0.06);
    m.rotation.z = (Math.random() - 0.5) * 0.1;
    g.add(m);
    for (const s of [-1, 1]) {
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), M(0xc0392b, { emissive: 0x2a0503 }));
      pin.position.set(it.p[0] + s * it.w * 0.35, it.p[1] + it.h * 0.42, 0.08);
      g.add(pin);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Glowing golden sapling crosswalk
 * ------------------------------------------------------------------ */
function crosswalk() {
  const g = new THREE.Group();
  const goldMat = GLOW(0xffc45a, 1.35);
  const barMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xd9a94a).multiplyScalar(0.35),
    transparent: true,
    opacity: 0.4,
  });
  const saplingMat = GLOW(0xffcf72, 1.8);
  for (let i = 0; i < 7; i++) {
    const z = 1.95 + i * 0.68;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.42), barMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(-4.55, 0.02, z);
    g.add(bar);
    // tiny glowing saplings at the ends
    for (const s of [-1, 1]) {
      const x = -4.55 + s * 1.75;
      cyl(g, 0.012, 0.018, 0.3, 4, goldMat, { p: [x, 0.15, z], castShadow: false });
      for (let k = 0; k < 3; k++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.055 - k * 0.012, 0.1, 4), saplingMat);
        leaf.position.set(x, 0.3 + k * 0.08, z);
        leaf.rotation.y = k * 0.7;
        g.add(leaf);
      }
      glow(g, 0xffc45a, 0.5, 0.45, [x, 0.34, z]);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  Stone gutter with oily water
 * ------------------------------------------------------------------ */
function gutter(len, axis = 'x') {
  const g = new THREE.Group();
  const stone = M(0x4a4741, { flatShading: true });
  const stoneDark = M(0x2e2c29, { flatShading: true });
  box(g, len, 0.16, 0.34, stone, { p: [0, 0.06, 0] });
  box(g, len, 0.1, 0.5, stoneDark, { p: [0, 0.0, 0] });
  // oily water
  const water = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.26), new THREE.MeshBasicMaterial({ color: 0x090c10, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.135;
  g.add(water);
  // grate
  for (let i = 0; i < Math.floor(len / 0.55); i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.3), M(0x22221f));
    bar.position.set(-len / 2 + 0.3 + i * 0.55, 0.155, 0);
    g.add(bar);
  }
  if (axis === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

/* ------------------------------------------------------------------ *
 *  Build all exterior props
 * ------------------------------------------------------------------ */
export function buildProps(scene) {
  const g = new THREE.Group();
  g.name = 'props';

  // vending machine under the right awning
  const vm = vendingMachine();
  vm.position.set(3.95, 0, -3.2);
  vm.rotation.y = Math.PI / 2;
  g.add(vm);

  // bicycle near the door
  const bike = bicycle();
  bike.position.set(-5.05, 0, 1.45);
  bike.rotation.y = 0.12;
  bike.rotation.z = -0.12;
  g.add(bike);

  // handcart
  const cart = handcart();
  cart.position.set(5.95, 0, -3.6);
  cart.rotation.y = 0.5;
  g.add(cart);

  // umbrella stand
  const us = umbrellaStand();
  us.position.set(-6.25, 0, 1.55);
  g.add(us);

  // trash can
  const tc = trashCan();
  tc.position.set(4.65, 0, 0.95);
  g.add(tc);

  // street lamp
  const LAMP_ROT = -0.55;
  const sl = streetLamp();
  sl.position.set(L.lamp.x, 0, L.lamp.z);
  sl.rotation.y = LAMP_ROT;
  g.add(sl);

  // utility pole
  const up = utilityPole();
  up.position.set(L.pole.x, 0, L.pole.z);
  up.rotation.y = 0.5;
  g.add(up);

  // welcome sign
  const ws = welcomeSignBoard();
  ws.position.set(-5.5, 0, 7.35);
  ws.rotation.y = 0.55;
  g.add(ws);

  // bulletin board on facade
  const bb = bulletinBoard();
  bb.position.set(-5.25, 1.95, L.bld.z1 + 0.12);
  g.add(bb);

  // crosswalk
  g.add(crosswalk());

  // railings
  const r1 = railing(3.4, 'x');
  r1.position.set(3.2, 0, 7.28);
  g.add(r1);
  const r2 = railing(3.8, 'z');
  r2.position.set(7.28, 0, -0.8);
  g.add(r2);

  // gutters
  const gt1 = gutter(7.6, 'x');
  gt1.position.set(2.6, 0, 7.05);
  g.add(gt1);
  const gt2 = gutter(4.9, 'z');
  gt2.position.set(7.05, 0, 3.9);
  g.add(gt2);

  // car
  const car = sedan();
  car.position.set(5.45, 0, 3.15);
  car.rotation.y = Math.PI / 2 + 0.04;
  g.add(car);

  // parking lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcfc7ae, transparent: true, opacity: 0.5 });
  for (const x of [4.32, 6.58]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 5.2), lineMat);
    l.rotation.x = -Math.PI / 2;
    l.position.set(x, 0.015, 3.2);
    g.add(l);
  }

  scene.add(g);
  const lampPos = new THREE.Vector3(L.lamp.x + 0.55 * Math.cos(LAMP_ROT), 3.5, L.lamp.z - 0.55 * Math.sin(LAMP_ROT));
  return { group: g, lampPos, poleTop: new THREE.Vector3(L.pole.x, L.pole.h - 0.4, L.pole.z) };
}
