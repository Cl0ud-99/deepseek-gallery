import * as THREE from 'three';
import { PAL, M, MB, GLOW, add, box, cyl, sph, plane, lathe, timeU, glow, tubeBetween, curtainGeometry, velvetMat } from './style.js';
import { posterTrout, posterLog, numberPlate, tvSnow, chevronSmallTexture, woodTexture, woodGrain, coffeeSteam, mistTexture } from './textures.js';
import { L } from './layout.js';

const leather = () => M(PAL.leather, { emissive: 0x050405 });
const leatherLit = () => M(PAL.leatherLit);
const marble = () => M(0xc4bcaa, { emissive: 0x080806 });
const brass = () => M(PAL.brass, { emissive: 0x2a1a05 });
const brassDark = () => M(PAL.brassDark);
const caseGlass = () => new THREE.MeshBasicMaterial({
  color: 0xcfe6e8, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.FrontSide,
});

/* ------------------------------------------------------------------ *
 *  Props
 * ------------------------------------------------------------------ */
function armchair() {
  const g = new THREE.Group();
  const m = leather();
  box(g, 0.92, 0.18, 0.9, m, { p: [0, 0.3, 0] });
  box(g, 0.84, 0.16, 0.78, leatherLit(), { p: [0, 0.44, 0.02] });
  const back = box(g, 0.9, 0.92, 0.2, m, { p: [0, 0.78, -0.36] });
  back.rotation.x = -0.12;
  box(g, 0.8, 0.3, 0.16, leatherLit(), { p: [0, 0.78, -0.24], r: [-0.12, 0, 0] });
  for (const s of [-1, 1]) {
    box(g, 0.16, 0.42, 0.86, m, { p: [s * 0.46, 0.54, 0.02] });
    box(g, 0.18, 0.1, 0.16, m, { p: [s * 0.46, 0.74, 0.42] });
    for (const z of [-0.36, 0.36]) {
      box(g, 0.07, 0.14, 0.07, brassDark(), { p: [s * 0.38, 0.1, z], castShadow: false });
    }
  }
  // tufting buttons
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), brassDark());
    s.position.set(-0.26 + (i % 3) * 0.26, 0.62 + Math.floor(i / 3) * 0.22, -0.3);
    g.add(s);
  }
  return g;
}

function marbleColumn(h = 0.95) {
  const g = new THREE.Group();
  box(g, 0.44, 0.08, 0.44, marble(), { p: [0, 0.04, 0] });
  box(g, 0.36, 0.06, 0.36, marble(), { p: [0, 0.11, 0] });
  cyl(g, 0.15, 0.17, h, 12, marble(), { p: [0, h / 2 + 0.14, 0] });
  box(g, 0.38, 0.07, 0.38, marble(), { p: [0, h + 0.18, 0] });
  return g;
}

function venus() {
  const g = new THREE.Group();
  const pts = [
    [0.02, 0.0], [0.17, 0.0], [0.19, 0.05], [0.2, 0.14], [0.185, 0.26],
    [0.155, 0.38], [0.14, 0.46], [0.165, 0.54], [0.185, 0.6], [0.2, 0.64],
    [0.19, 0.68], [0.15, 0.71], [0.1, 0.74], [0.072, 0.78], [0.068, 0.82],
    [0.082, 0.86], [0.1, 0.9], [0.09, 0.94], [0.06, 0.96], [0.02, 0.97],
  ];
  lathe(g, pts, 16, marble());
  // drapery
  const dr = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.36, 12, 1, true), marble());
  dr.position.y = 0.2;
  dr.rotation.x = Math.PI;
  dr.castShadow = true;
  g.add(dr);
  // neck + head
  cyl(g, 0.045, 0.05, 0.09, 8, marble(), { p: [0, 0.99, 0] });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), marble());
  head.position.set(0, 1.06, 0.005);
  head.scale.set(0.9, 1.05, 0.95);
  head.castShadow = true;
  g.add(head);
  // hair bun
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), marble());
  bun.position.set(0, 1.09, -0.06);
  g.add(bun);
  return g;
}

function floorLamp() {
  const g = new THREE.Group();
  cyl(g, 0.16, 0.2, 0.05, 12, brass(), { p: [0, 0.025, 0] });
  cyl(g, 0.022, 0.03, 1.62, 8, brass(), { p: [0, 0.83, 0] });
  cyl(g, 0.09, 0.12, 0.06, 10, brass(), { p: [0, 1.66, 0] });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.3, 14, 1, true), M(0xe8d9b4, { side: THREE.DoubleSide, emissive: 0x3a2c14 }));
  shade.position.y = 1.84;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), GLOW(0xfff0cc, 1.7));
  bulb.position.y = 1.8;
  g.add(bulb);
  glow(g, 0xffd9a0, 0.8, 0.26, [0, 1.8, 0]);
  return g;
}

function displayCase() {
  const g = new THREE.Group();
  const W = 1.5, H = 1.05, D = 0.62;
  box(g, W, 0.72, D, M(0x241a14), { p: [0, 0.36, 0] });
  box(g, W + 0.06, 0.06, D + 0.06, brass(), { p: [0, 0.74, 0] });
  // glass top
  box(g, W - 0.04, 0.6, D - 0.04, caseGlass(), { p: [0, 1.06, 0], castShadow: false, receiveShadow: false });
  // brass frame
  for (const s of [-1, 1]) {
    box(g, 0.03, 0.6, 0.03, brass(), { p: [s * (W / 2 - 0.02), 1.06, D / 2 - 0.02], castShadow: false });
    box(g, 0.03, 0.6, 0.03, brass(), { p: [s * (W / 2 - 0.02), 1.06, -D / 2 + 0.02], castShadow: false });
  }
  box(g, W, 0.03, D, brass(), { p: [0, 1.36, 0], castShadow: false });
  // golden orbs
  for (let i = 0; i < 3; i++) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), M(PAL.gold, { emissive: 0x4a3208 }));
    o.position.set(-0.5 + i * 0.32, 0.86, 0.05);
    o.castShadow = true;
    g.add(o);
  }
  // owl cave rings
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.017, 6, 12), M(PAL.emerald, { emissive: 0x0d3a24 }));
    r.position.set(0.18 + i * 0.14, 1.02, 0.12);
    r.rotation.x = 0.3;
    g.add(r);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), GLOW(0x59d99a, 1.6));
    gem.position.set(0.18 + i * 0.14, 1.08, 0.14);
    g.add(gem);
  }
  // small label
  plane(g, 0.42, 0.12, new THREE.MeshBasicMaterial({ map: numberPlate('315'), transparent: false }), {
    p: [0, 0.5, D / 2 + 0.005],
  });
  return g;
}

function fridge() {
  const g = new THREE.Group();
  const body = M(0xd9d2c2);
  box(g, 0.78, 1.55, 0.66, body, { p: [0, 0.8, 0] });
  const door = box(g, 0.72, 1.0, 0.06, M(0xe8e2d2), { p: [0, 1.0, 0.34] });
  box(g, 0.72, 0.42, 0.06, M(0xe8e2d2), { p: [0, 0.42, 0.34] });
  cyl(g, 0.022, 0.022, 0.5, 6, brass(), { p: [0.28, 1.0, 0.4] });
  // glow inside top door gap
  plane(g, 0.66, 0.03, GLOW(0xffe6b0, 2.0), { p: [0, 0.51, 0.38], r: [Math.PI / 2, 0, 0], castShadow: false });
  // bottles on top
  for (let i = 0; i < 4; i++) {
    cyl(g, 0.045, 0.045, 0.22, 8, M(i % 2 ? PAL.cherry : 0x6b3a12, { emissive: 0x1a0503 }), { p: [-0.24 + i * 0.16, 1.68, 0] });
    cyl(g, 0.02, 0.02, 0.08, 6, M(0x2a2018), { p: [-0.24 + i * 0.16, 1.82, 0] });
  }
  // maple syrup tin
  cyl(g, 0.06, 0.06, 0.16, 8, M(0x8a4a10), { p: [0.3, 1.66, 0.12] });
  return g;
}

function pieCounter() {
  const g = new THREE.Group();
  const W = 2.6, D = 0.8;
  box(g, W, 0.86, D, M(0x2e2018), { p: [0, 0.43, 0] });
  box(g, W + 0.1, 0.07, D + 0.1, M(0xe6ddc8), { p: [0, 0.9, 0] });
  // glass dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, 7, 0, Math.PI / 2), caseGlass());
  dome.position.set(-0.55, 0.93, 0);
  dome.castShadow = false;
  g.add(dome);
  // pies
  for (let i = 0; i < 3; i++) {
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.1, 14), M(0xd8a760));
    pie.position.set(-0.75 + i * 0.26, 1.0, -0.12 + (i % 2) * 0.2);
    pie.castShadow = true;
    g.add(pie);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 14), M(PAL.cherry, { emissive: 0x2a0206 }));
    fill.position.set(pie.position.x, 1.06, pie.position.z);
    g.add(fill);
    // lattice
    for (let k = 0; k < 3; k++) {
      box(g, 0.36, 0.012, 0.025, M(0xd8a760), { p: [pie.position.x, 1.07, pie.position.z - 0.08 + k * 0.08], r: [0, 0.5, 0], castShadow: false });
    }
  }
  // donuts
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.032, 6, 12), M(0xd9a86a));
    d.position.set(0.42 + (i % 3) * 0.18, 0.96, -0.14 + Math.floor(i / 3) * 0.2);
    d.rotation.x = Math.PI / 2;
    d.castShadow = true;
    g.add(d);
    const ic = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.034, 6, 12), M(0xf0e2c8));
    ic.position.copy(d.position);
    ic.position.y += 0.012;
    ic.rotation.x = Math.PI / 2;
    ic.scale.set(1.02, 1.02, 0.5);
    g.add(ic);
  }
  // tray stacks
  for (let i = 0; i < 3; i++) {
    cyl(g, 0.2, 0.2, 0.02, 12, M(0xc9c2b2), { p: [0.9, 0.94 + i * 0.022, 0.18] });
  }
  return g;
}

function keyRack() {
  const g = new THREE.Group();
  box(g, 1.5, 0.95, 0.08, M(0x2a3a2c), { p: [0, 0, 0] });
  box(g, 1.56, 0.06, 0.1, brass(), { p: [0, 0.5, 0] });
  plane(g, 1.4, 0.16, new THREE.MeshBasicMaterial({ map: numberPlate('---'), transparent: false }), { p: [0, 0.36, 0.05] });
  for (let i = 0; i < 10; i++) {
    const x = -0.62 + (i % 5) * 0.31;
    const y = 0.14 - Math.floor(i / 5) * 0.3;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 4, 8), brass());
    hook.position.set(x, y + 0.1, 0.06);
    g.add(hook);
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.012), M(0xc9a24a));
    key.position.set(x, y + 0.01, 0.07);
    g.add(key);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.01), M(0xe8dfc8));
    tag.position.set(x + 0.03, y - 0.02, 0.075);
    g.add(tag);
  }
  return g;
}

function recorder() {
  const g = new THREE.Group();
  box(g, 0.52, 0.16, 0.36, M(0x2b2a28), { p: [0, 0, 0] });
  box(g, 0.5, 0.05, 0.34, M(0x1a1918), { p: [0, 0.09, 0] });
  for (const s of [-1, 1]) {
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 12), M(0xd8d2c4));
    reel.position.set(s * 0.12, 0.115, 0);
    reel.rotation.x = Math.PI / 2;
    g.add(reel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8), M(0x3a3632));
    hub.position.set(s * 0.12, 0.115, 0);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
  }
  box(g, 0.16, 0.06, 0.02, M(0x8a8278), { p: [0, 0.05, 0.19], castShadow: false });
  return g;
}

function coffeeBar() {
  const g = new THREE.Group();
  const W = 3.0, D = 0.8;
  box(g, W, 0.9, D, M(0x3a2418), { p: [0, 0.45, 0] });
  box(g, W + 0.08, 0.06, D + 0.08, M(0xe8dfc8), { p: [0, 0.93, 0] });
  // back shelf
  box(g, W, 1.1, 0.16, M(0x241a14), { p: [0, 2.0, -0.36] });
  for (let s = 0; s < 2; s++) {
    box(g, W, 0.05, 0.24, M(0x3a2418), { p: [0, 1.68 + s * 0.44, -0.32] });
  }
  // brass pots
  for (let i = 0; i < 3; i++) {
    const x = -0.9 + i * 0.45;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.26, 12), brass());
    pot.position.set(x, 1.1, 0.05);
    pot.castShadow = true;
    g.add(pot);
    const lid = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.07, 12), brass());
    lid.position.set(x, 1.26, 0.05);
    g.add(lid);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.14, 6), brass());
    spout.position.set(x + 0.13, 1.12, 0.05);
    spout.rotation.z = -0.9;
    g.add(spout);
  }
  // b/w geometric cups
  for (let i = 0; i < 5; i++) {
    const x = -0.2 + i * 0.16;
    cyl(g, 0.045, 0.038, 0.08, 8, M(i % 2 ? 0xe8e2d2 : 0x1a1818), { p: [x, 1.0, 0.28] });
  }
  // stacked saucers
  for (let i = 0; i < 4; i++) {
    cyl(g, 0.09, 0.09, 0.012, 12, M(0xe8e2d2), { p: [0.62, 0.98 + i * 0.015, 0.2] });
  }
  // shelf items: tins
  for (let i = 0; i < 6; i++) {
    cyl(g, 0.055, 0.055, 0.14, 8, M(i % 2 ? 0x8a2a1e : 0x3a4a2a), { p: [-1.2 + i * 0.2, 1.78, -0.32] });
  }
  return g;
}

function dripMachine() {
  const g = new THREE.Group();
  box(g, 0.5, 0.62, 0.42, M(0x2a2624), { p: [0, 0.31, 0] });
  box(g, 0.44, 0.2, 0.36, M(0x1a1716), { p: [0, 0.5, 0.02] });
  // glass carafe
  const carafe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.22, 10), caseGlass());
  carafe.position.set(0, 0.2, 0.16);
  g.add(carafe);
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.09, 0.1, 10), M(0x2a0f06, { emissive: 0x0a0200 }));
  coffee.position.set(0, 0.16, 0.16);
  g.add(coffee);
  // drip stream
  const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.12, 5), M(0x3a1a0a));
  drip.position.set(0, 0.32, 0.16);
  g.add(drip);
  // steam sprite
  const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: coffeeSteam(), color: 0xfff2dc, transparent: true, opacity: 0.22, depthWrite: false }));
  st.position.set(0, 0.46, 0.16);
  st.scale.set(0.5, 0.7, 1);
  g.add(st);
  g.userData.steam = st;
  // indicator light
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), GLOW(0xff6a3a, 3));
  led.position.set(0.18, 0.55, 0.22);
  g.add(led);
  return g;
}

function magazineRack() {
  const g = new THREE.Group();
  box(g, 0.7, 1.2, 0.3, M(0x2a2018), { p: [0, 0.6, 0] });
  for (let s = 0; s < 3; s++) {
    const sh = box(g, 0.62, 0.04, 0.26, M(0x3a2a1e), { p: [0, 0.35 + s * 0.3, 0.02] });
    sh.rotation.x = -0.25;
    for (let i = 0; i < 4; i++) {
      const mag = box(g, 0.1, 0.24, 0.19, M([0xb03030, 0x2a4a6a, 0xd8c9a0, 0x3a5a3a][(i + s) % 4]), {
        p: [-0.24 + i * 0.15, 0.47 + s * 0.3, 0.02],
        r: [-0.25, 0, 0],
      });
      mag.castShadow = true;
    }
  }
  return g;
}

function tvSet() {
  const g = new THREE.Group();
  box(g, 0.86, 0.66, 0.6, M(0x3a3228), { p: [0, 0.33, 0] });
  box(g, 0.9, 0.06, 0.64, M(0x241e18), { p: [0, 0.68, 0] });
  // screen
  const snow = tvSnow();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.44), new THREE.MeshBasicMaterial({ map: snow, color: 0xbfd8ff }));
  screen.position.set(-0.06, 0.36, 0.305);
  g.add(screen);
  g.userData.screen = screen;
  g.userData.snowTex = snow;
  // knobs
  for (let i = 0; i < 2; i++) {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), M(0x1a1714));
    k.position.set(0.32, 0.46 - i * 0.14, 0.31);
    k.rotation.x = Math.PI / 2;
    g.add(k);
  }
  // antenna
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), M(0x8a8278));
    a.position.set(s * 0.12, 0.98, -0.05);
    a.rotation.z = -s * 0.5;
    g.add(a);
  }
  glow(g, 0x7fb0ff, 1.5, 0.35, [0, 0.4, 0.42]);
  return g;
}

function freezer() {
  const g = new THREE.Group();
  box(g, 1.2, 0.7, 0.9, M(0xcfd8d4), { p: [0, 0.35, 0] });
  box(g, 1.14, 0.5, 0.84, caseGlass(), { p: [0, 0.96, 0], castShadow: false });
  box(g, 1.2, 0.06, 0.9, M(0xbfc9c4), { p: [0, 1.24, 0], castShadow: false });
  for (let i = 0; i < 3; i++) {
    cyl(g, 0.09, 0.09, 0.24, 8, M(0xe8e2d2), { p: [-0.35 + i * 0.3, 0.86, 0] });
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, 7, 0, 1.4), M(0xd94a6a));
    lid.position.set(-0.35 + i * 0.3, 0.98, 0);
    g.add(lid);
  }
  const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTexture(), color: 0xdff2ff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
  mist.position.set(0, 0.62, 0.4);
  mist.scale.set(1.4, 0.8, 1);
  g.add(mist);
  g.userData.mist = mist;
  return g;
}

function logLadyLog() {
  const g = new THREE.Group();
  box(g, 0.7, 0.4, 0.7, M(0x2a2018), { p: [0, 0.2, 0] });
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.0, 10), M(0x3a2a1e));
  log.position.set(0, 0.6, 0);
  log.rotation.z = Math.PI / 2;
  log.rotation.y = 0.3;
  log.castShadow = true;
  g.add(log);
  // rings on cut end
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06 + i * 0.03, 0.006, 4, 12), M(0x8a6a44));
    ring.position.set(0.5, 0.6, 0);
    ring.rotation.y = Math.PI / 2;
    g.add(ring);
  }
  // gold ribbon
  const rib = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 5, 14), M(0xd8b24a, { emissive: 0x3a2606 }));
  rib.position.set(-0.1, 0.6, 0);
  rib.rotation.y = Math.PI / 2;
  g.add(rib);
  const bow = new THREE.Mesh(new THREE.TorusKnotGeometry(0.05, 0.014, 24, 6), M(0xd8b24a, { emissive: 0x3a2606 }));
  bow.position.set(-0.1, 0.76, 0);
  g.add(bow);
  return g;
}

function locker() {
  const g = new THREE.Group();
  const W = 1.0, H = 2.1, D = 0.5;
  box(g, W, H, D, M(0x5a1218), { p: [0, H / 2, 0] });
  box(g, W + 0.06, 0.08, D + 0.04, M(0x2a0a0c), { p: [0, H, 0] });
  for (let i = 0; i < 2; i++) {
    const x = -0.25 + i * 0.5;
    box(g, 0.46, 1.9, 0.03, M(0x6a161e), { p: [x, H / 2, D / 2] });
    plane(g, 0.28, 0.28, new THREE.MeshBasicMaterial({ map: numberPlate(i ? '315' : '253') }), {
      p: [x, 1.62, D / 2 + 0.02],
    });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), brass());
    knob.position.set(x + 0.16, 1.1, D / 2 + 0.04);
    g.add(knob);
    for (let s = 0; s < 4; s++) {
      box(g, 0.3, 0.012, 0.01, M(0x2a0a0c), { p: [x, 0.5 + s * 0.05, D / 2 + 0.02], castShadow: false });
    }
  }
  return g;
}

function pendant() {
  const g = new THREE.Group();
  cyl(g, 0.008, 0.008, 0.7, 4, M(0x1a1714), { p: [0, 0.35, 0] });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 12, 1, true), M(0x2a1a14, { side: THREE.DoubleSide }));
  shade.position.y = -0.05;
  shade.rotation.x = Math.PI;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), GLOW(0xffe9c0, 3.2));
  bulb.position.y = -0.12;
  g.add(bulb);
  glow(g, 0xffd9a0, 1.2, 0.5, [0, -0.12, 0]);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Parted curtains into the dark
 * ------------------------------------------------------------------ */
function curtainVoid() {
  const g = new THREE.Group();
  const z0 = L.bld.z0;
  const cx = -0.35;
  // nested darker frames read as an endless curtain passage without any exterior geometry
  const layers = [
    [2.05, 3.25, -7.99, 0x22060b],
    [1.55, 2.75, -7.96, 0x170407],
    [1.05, 2.1, -7.93, 0x0e0205],
    [0.6, 1.35, -7.9, 0x070103],
  ];
  for (const [w, h, zz, col] of layers) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col }));
    p.position.set(cx, h / 2 + 0.02, zz);
    g.add(p);
  }
  // faint red glow deep inside
  const core = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 1.05),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x6e0a16).multiplyScalar(1.15),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  core.position.set(cx, 1.0, -7.88);
  g.add(core);
  glow(g, 0xff4a3a, 1.3, 0.18, [cx, 1.05, -7.86]);

  // parted curtain edges framing the opening
  for (const sgn of [-1, 1]) {
    const e = new THREE.Mesh(curtainGeometry(0.36, 3.3, 3, 0.05, 8), velvetMat(PAL.velvet, { sway: 0.012 }));
    e.position.set(cx + sgn * 1.02, 0.02, z0 + 0.07);
    g.add(e);
  }
  // valance across the top of the opening
  const top = new THREE.Mesh(curtainGeometry(2.05, 0.34, 5, 0.05, 4), velvetMat(PAL.velvetDeep, { sway: 0.008 }));
  top.position.set(cx, 3.28, z0 + 0.08);
  top.rotation.z = Math.PI;
  g.add(top);
  return g;
}

/* ------------------------------------------------------------------ *
 *  Build interior
 * ------------------------------------------------------------------ */
export function buildInterior(scene) {
  const g = new THREE.Group();
  g.name = 'interior';

  // ceiling
  box(g, L.bld.x1 - L.bld.x0, 0.12, L.bld.z1 - L.bld.z0, M(0x1e0a0e), {
    p: [(L.bld.x0 + L.bld.x1) / 2, 3.88, (L.bld.z0 + L.bld.z1) / 2],
    castShadow: false,
  });

  // wall curtains (left + back)
  const wallVel = velvetMat(0xa81c32, { sway: 0.014, emissive: 0x1e0409 });
  const leftC = new THREE.Mesh(curtainGeometry(L.bld.z1 - L.bld.z0, 3.8, 14, 0.075, 12), wallVel);
  leftC.rotation.y = Math.PI / 2;
  leftC.position.set(L.bld.x0 + 0.06, 0.02, (L.bld.z0 + L.bld.z1) / 2);
  g.add(leftC);
  const backC1 = new THREE.Mesh(curtainGeometry(4.4, 3.8, 12, 0.075, 12), wallVel);
  backC1.position.set(-4.2, 0.02, L.bld.z0 + 0.06);
  g.add(backC1);
  const backC2 = new THREE.Mesh(curtainGeometry(2.2, 3.8, 8, 0.075, 12), wallVel);
  backC2.position.set(1.9, 0.02, L.bld.z0 + 0.06);
  g.add(backC2);

  // parted curtains into the dark
  g.add(curtainVoid());

  // interior chevron guide strips
  const stripTex = chevronSmallTexture('#0f0d0b', '#d8cfb8', 2);
  const stripMat = M(0xffffff, { map: stripTex });
  const s1 = plane(g, 1.1, 3.0, stripMat, { p: [-1.4, 0.014, -3.2], r: [-Math.PI / 2, 0, 0], castShadow: false });
  s1.material.map.repeat.set(1, 3);
  const s2 = plane(g, 2.6, 1.0, stripMat, { p: [-3.2, 0.014, 0.1], r: [-Math.PI / 2, 0, 0], castShadow: false });

  /* armchairs */
  const chairPos = [
    { p: [-3.3, 0, -2.2], r: 0.2 },
    { p: [-1.6, 0, -3.6], r: -0.9 },
    { p: [-4.4, 0, -4.1], r: 1.0 },
  ];
  for (const c of chairPos) {
    const ch = armchair();
    ch.position.set(c.p[0], 0, c.p[2]);
    ch.rotation.y = c.r;
    g.add(ch);
  }
  // round table
  cyl(g, 0.36, 0.36, 0.05, 16, M(0x2a1a14), { p: [-3.1, 0.62, -3.1] });
  cyl(g, 0.05, 0.07, 0.6, 8, brassDark(), { p: [-3.1, 0.3, -3.1] });
  // coffee cup on table
  cyl(g, 0.055, 0.045, 0.09, 8, M(0xe8e2d2), { p: [-3.0, 0.69, -3.0] });
  const cupCoffee = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.012, 8), M(0x1a0a04));
  cupCoffee.position.set(-3.0, 0.735, -3.0);
  g.add(cupCoffee);

  /* venus + column + lamp at curved corner */
  const col = marbleColumn(0.95);
  col.position.set(1.95, 0, 0.25);
  g.add(col);
  const v = venus();
  v.position.set(1.95, 1.14, 0.25);
  v.rotation.y = -0.9;
  g.add(v);
  const lamp = floorLamp();
  lamp.position.set(2.45, 0, 0.95);
  g.add(lamp);

  /* display case front-left */
  const dc = displayCase();
  dc.position.set(-4.85, 0, 0.78);
  dc.rotation.y = 0.04;
  g.add(dc);

  /* fridge right wall */
  const fr = fridge();
  fr.position.set(2.62, 0, -2.4);
  fr.rotation.y = -Math.PI / 2;
  g.add(fr);

  /* pie counter left wall */
  const pc = pieCounter();
  pc.position.set(-5.75, 0, -3.1);
  pc.rotation.y = Math.PI / 2;
  g.add(pc);

  /* cashier bar + coffee */
  const cb = coffeeBar();
  cb.position.set(-4.3, 0, -6.85);
  g.add(cb);
  const dm = dripMachine();
  dm.position.set(-3.4, 0.96, -6.85);
  g.add(dm);

  /* key rack + recorder on back wall */
  const kr = keyRack();
  kr.position.set(1.5, 2.45, L.bld.z0 + 0.14);
  g.add(kr);
  const rec = recorder();
  rec.position.set(1.35, 1.32, L.bld.z0 + 0.2);
  g.add(rec);
  box(g, 0.7, 0.05, 0.34, M(0x2a1a14), { p: [1.35, 1.25, L.bld.z0 + 0.2] });

  /* magazine rack */
  const mr = magazineRack();
  mr.position.set(2.72, 0, -4.7);
  mr.rotation.y = -Math.PI / 2;
  g.add(mr);

  /* tv */
  const tv = tvSet();
  tv.position.set(0.6, 0, -5.2);
  tv.rotation.y = 0.25;
  g.add(tv);
  box(g, 1.1, 0.5, 0.7, M(0x241a14), { p: [0.6, 0.25, -5.2] });

  /* freezer */
  const fz = freezer();
  fz.position.set(2.2, 0, -6.55);
  fz.rotation.y = -0.4;
  g.add(fz);

  /* log */
  const lg = logLadyLog();
  lg.position.set(-5.7, 0, -7.0);
  lg.rotation.y = 0.5;
  g.add(lg);

  /* lockers */
  const lk = locker();
  lk.position.set(-1.95, 0, L.bld.z0 + 0.32);
  g.add(lk);

  /* posters */
  const p1 = plane(g, 0.85, 1.2, new THREE.MeshBasicMaterial({ map: posterTrout() }), {
    p: [L.bld.x0 + 0.16, 2.1, -1.6], r: [0, Math.PI / 2, 0],
  });
  const p2 = plane(g, 0.85, 1.2, new THREE.MeshBasicMaterial({ map: posterLog() }), {
    p: [2.9, 2.15, -1.1], r: [0, -Math.PI / 2, 0],
  });
  const p3 = plane(g, 0.85, 1.2, new THREE.MeshBasicMaterial({ map: posterTrout() }), {
    p: [-2.6, 2.2, L.bld.z0 + 0.13], r: [0, 0, 0],
  });

  /* pendants */
  const pen1 = pendant();
  pen1.position.set(-3.1, 3.75, -2.6);
  g.add(pen1);
  const pen2 = pendant();
  pen2.position.set(-4.3, 3.75, -6.0);
  g.add(pen2);
  const pen3 = pendant();
  pen3.position.set(1.2, 3.75, -4.2);
  g.add(pen3);

  /* small side table with ashtray near chairs */
  cyl(g, 0.28, 0.28, 0.04, 12, M(0x2a1a14), { p: [-2.2, 0.52, -1.6] });
  cyl(g, 0.04, 0.06, 0.5, 8, brassDark(), { p: [-2.2, 0.25, -1.6] });

  /* cake stand near counter */
  cyl(g, 0.18, 0.18, 0.02, 12, M(0xc9c2b2), { p: [-5.3, 1.15, -1.9] });
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.16, 12), M(0xe0c8a0));
  cake.position.set(-5.3, 1.24, -1.9);
  g.add(cake);
  const icing = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.03, 12), M(0xf0e0c0));
  icing.position.set(-5.3, 1.33, -1.9);
  g.add(icing);

  /* entrance console table — reads through the open curtain door */
  box(g, 1.15, 0.08, 0.42, M(0x2e1f16), { p: [-1.65, 0.86, -0.55] });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cyl(g, 0.028, 0.032, 0.82, 6, brassDark(), { p: [-1.65 + sx * 0.48, 0.41, -0.55 + sz * 0.16] });
    }
  }
  // guest book + brass bell
  box(g, 0.34, 0.05, 0.24, M(0xe4dcc8), { p: [-1.85, 0.93, -0.55], r: [0, 0.2, 0] });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6, 0, 7, 0, Math.PI / 2), brass());
  bell.position.set(-1.32, 0.95, -0.52);
  g.add(bell);
  // small lamp on the console
  cyl(g, 0.05, 0.07, 0.3, 8, brass(), { p: [-1.42, 1.05, -0.62] });
  const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.16, 12, 1, true), M(0xf0e2c4, { side: THREE.DoubleSide, emissive: 0x3a2a10 }));
  cl.position.set(-1.42, 1.24, -0.62);
  g.add(cl);
  const clb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), GLOW(0xfff0cc, 1.8));
  clb.position.set(-1.42, 1.22, -0.62);
  g.add(clb);
  glow(g, 0xffd9a0, 0.7, 0.3, [-1.42, 1.22, -0.62]);

  /* cafe table by the corner window */
  cyl(g, 0.34, 0.34, 0.05, 14, M(0xe4dcc8), { p: [1.25, 0.72, -1.35] });
  cyl(g, 0.045, 0.06, 0.7, 8, brassDark(), { p: [1.25, 0.36, -1.35] });
  cyl(g, 0.2, 0.22, 0.03, 12, brassDark(), { p: [1.25, 0.02, -1.35] });
  // pie slice + cup on it
  const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 3), M(0xd8a760));
  slice.position.set(1.18, 0.77, -1.32);
  slice.rotation.y = 0.4;
  g.add(slice);
  cyl(g, 0.05, 0.042, 0.08, 8, M(0xe8e2d2), { p: [1.36, 0.79, -1.42] });
  const ch1 = armchair();
  ch1.position.set(0.75, 0, -1.0);
  ch1.rotation.y = -0.7;
  ch1.scale.setScalar(0.78);
  g.add(ch1);
  const ch2 = armchair();
  ch2.position.set(1.8, 0, -1.9);
  ch2.rotation.y = 2.3;
  ch2.scale.setScalar(0.78);
  g.add(ch2);

  /* coat rack by the door */
  cyl(g, 0.16, 0.2, 0.05, 10, M(0x2a1a14), { p: [-0.15, 0.03, -0.15] });
  cyl(g, 0.03, 0.04, 1.85, 8, M(0x3a2a1c), { p: [-0.15, 0.95, -0.15] });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.24, 5), M(0x3a2a1c));
    hook.position.set(-0.15 + Math.cos(a) * 0.11, 1.8, -0.15 + Math.sin(a) * 0.11);
    hook.rotation.z = Math.cos(a) * 0.9;
    hook.rotation.x = -Math.sin(a) * 0.9;
    g.add(hook);
  }
  // hanging trench coat
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.95, 8, 1, true), M(0x2e2a24, { side: THREE.DoubleSide }));
  coat.position.set(-0.05, 1.28, -0.1);
  g.add(coat);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), M(0x1a1814));
  hat.position.set(-0.05, 1.78, -0.1);
  g.add(hat);
  cyl(g, 0.09, 0.1, 0.12, 10, M(0x1a1814), { p: [-0.05, 1.85, -0.1] });

  /* firewood stack */
  for (let i = 0; i < 9; i++) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.85, 7), M(0x3a2a1c));
    lg.position.set(-6.25, 0.1 + Math.floor(i / 3) * 0.15, -5.5 + (i % 3) * 0.17);
    lg.rotation.x = Math.PI / 2;
    lg.castShadow = true;
    g.add(lg);
  }

  scene.add(g);
  return { group: g, tv, freezer: fz, drip: dm };
}
