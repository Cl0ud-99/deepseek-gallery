import * as THREE from 'three';
import { C, matc, mat, bx, rbx, cyl, sph, cone, plane, grp, add, instanced, GLASS, GLASS_SOFT, archRing } from './lib.js';
import * as T from './textures.js';

/* ------------------------------------------------------------------ *
 *  GRAND HOTEL — alpine cable station, cut-away dollhouse
 * ------------------------------------------------------------------ */
const W = 46, HW = 23, D = 28, ZF = 12, ZB = -16;
const Y0 = 1.0;    // lobby floor
const Y1 = 13.0;   // 2F floor
const Y2 = 23.5;   // 3F floor
const Y3 = 31.0;   // roof deck
const SLAB = 0.9;

const PINK = () => matc(C.pink);
const CREAM = () => matc(C.cream);
const MINT = () => matc(C.mint);
const BRASS = () => matc(C.brass);
const BURG = () => matc(C.burgundy);

function wallPlane(w, h, material, x, y, z, rotY = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  p.position.set(x, y, z);
  p.rotation.y = rotY;
  p.receiveShadow = true;
  return p;
}

function rectFrame(w, h, t, depth, m, x, y, z) {
  const g = grp(x, y, z);
  g.add(bx(w, t, depth, m, 0, h / 2 - t / 2, 0));
  g.add(bx(w, t, depth, m, 0, -h / 2 + t / 2, 0));
  g.add(bx(t, h, depth, m, -w / 2 + t / 2, 0, 0));
  g.add(bx(t, h, depth, m, w / 2 - t / 2, 0, 0));
  return g;
}

function archFrame(w, springH, t, depth, m, x, y, z) {
  const g = grp(x, y, z);
  const r = w / 2;
  g.add(bx(t, springH, depth, m, -r + t / 2, springH / 2, 0));
  g.add(bx(t, springH, depth, m, r - t / 2, springH / 2, 0));
  const arch = new THREE.Mesh(new THREE.TorusGeometry(r - t / 2, t / 2, 6, 30, Math.PI), m);
  arch.position.set(0, springH, 0);
  arch.castShadow = true;
  g.add(arch);
  return g;
}

/* ================================================================== */
export function createHotel() {
  const g = grp();
  const anim = { elevators: [], door: null, flag: null, flagGeo: null, lights: [], pointLights: [] };

  const plaster = matc(C.pink);
  const cream = matc(C.cream);
  const brass = matc(C.brass);
  const mint = matc(C.mint);
  const burg = matc(C.burgundy);
  const snow = matc(C.snow);

  /* ---------------- stone plinth ---------------- */
  g.add(bx(48, 1.0, 30, matc(0xcfc4cc), 0, 0.5, -2));
  g.add(bx(47, 0.18, 29, matc(0xe4d8d2), 0, 0.86, -2));

  /* ---------------- structural shell ---------------- */
  const wallH = 30.6, wallCY = Y0 + wallH / 2;
  for (const s of [-1, 1]) {
    g.add(bx(1.2, wallH, D + 0.4, plaster, s * 22.4, wallCY, -2));
  }
  g.add(bx(W, wallH, 1.2, plaster, 0, wallCY, -15.4));

  // floor slabs
  for (const y of [Y1 - SLAB / 2, Y2 - SLAB / 2, Y3 - SLAB / 2]) {
    g.add(bx(W, SLAB, D, cream, 0, y, -2));
    g.add(bx(W, 0.16, 0.5, brass, 0, y + SLAB / 2 - 0.08, ZF - 0.1));
  }

  /* ---------------- facade frame ---------------- */
  for (const s of [-1, 1]) {
    g.add(bx(2.6, wallH + 0.4, 2.4, plaster, s * 22.2, wallCY, 12.2));
    for (const y of [Y1, Y2, Y3]) {
      g.add(bx(3.3, 0.75, 3.0, cream, s * 22.2, y, 12.3));
      g.add(bx(3.1, 0.28, 2.8, brass, s * 22.2, y - 0.52, 12.3));
    }
    // vertical brass fluting
    for (let i = 0; i < 4; i++) {
      g.add(bx(0.12, wallH - 1.2, 0.12, brass, s * 21.15, wallCY, 13.3 - i * 0.02));
    }
  }
  // cornice bands
  for (const y of [Y1, Y2, Y3]) {
    g.add(bx(48.4, 0.85, 2.0, cream, 0, y + 0.1, 12.4));
    g.add(bx(48.8, 0.18, 2.4, brass, 0, y + 0.58, 12.4));
  }
  // top cornice + dentils
  g.add(bx(50, 1.5, 3.0, cream, 0, Y3 + 0.9, 12.4));
  g.add(bx(50.6, 0.25, 3.4, brass, 0, Y3 + 1.72, 12.4));
  const dent = [];
  for (let i = 0; i < 30; i++) dent.push({ p: [-23.4 + i * 1.62, Y3 + 0.05, 13.7] });
  g.add(instanced(new THREE.BoxGeometry(0.7, 0.55, 0.5), cream, dent));

  /* ---------------- arched glass front (cut-away dollhouse) ---------------- */
  const glassGroup = grp();
  function archGlassGeo(w, springH) {
    const r = w / 2;
    const sh = new THREE.Shape();
    sh.moveTo(-r, 0);
    sh.lineTo(r, 0);
    sh.lineTo(r, springH);
    sh.absarc(0, springH, r, 0, Math.PI, false);
    sh.lineTo(-r, 0);
    return new THREE.ShapeGeometry(sh, 26);
  }
  function addGlass(geo, x, y, z, rotY = 0) {
    const m = new THREE.Mesh(geo, GLASS);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.userData.glass = true;
    glassGroup.add(m);
    return m;
  }
  // ground floor side bays
  for (const s of [-1, 1]) {
    glassGroup.add(archFrame(12.6, 6.0, 0.42, 0.5, brass, s * 15.6, Y0, 12.55));
    glassGroup.add(bx(13.6, 0.5, 1.0, cream, s * 15.6, Y0 + 0.25, 12.55));
    addGlass(archGlassGeo(12.2, 6.0), s * 15.6, Y0 + 0.2, 12.6);
    // mullions
    glassGroup.add(bx(0.22, 11.2, 0.24, brass, s * 15.6, Y0 + 5.9, 12.66));
    glassGroup.add(bx(12.2, 0.22, 0.24, brass, s * 15.6, Y0 + 6.1, 12.66));
  }
  // 2F windows
  for (const x of [-14.5, 0, 14.5]) {
    glassGroup.add(rectFrame(9.6, 7.6, 0.34, 0.42, brass, x, 18.6, 12.55));
    addGlass(new THREE.PlaneGeometry(9.2, 7.2), x, 18.6, 12.6);
    glassGroup.add(bx(0.2, 7.2, 0.22, brass, x, 18.6, 12.66));
    glassGroup.add(bx(9.2, 0.2, 0.22, brass, x, 18.6, 12.66));
  }
  // 3F arched dormers
  for (const x of [-14.5, 0, 14.5]) {
    glassGroup.add(archFrame(7.6, 3.6, 0.34, 0.42, brass, x, 25.8, 12.55));
    addGlass(archGlassGeo(7.2, 3.6), x, 25.8, 12.6);
    glassGroup.add(bx(0.2, 6.6, 0.22, brass, x, 28.9, 12.66));
  }
  g.add(glassGroup);

  /* ---------------- side elevations : arched windows + shutters ---------------- */
  for (const s of [-1, 1]) {
    for (const wz of [-9.6, -1.6, 6.4]) {
      for (const [wy, sh, ww] of [[Y0 + 0.2, 5.4, 4.8], [Y1 + 0.4, 4.6, 4.4], [Y2 + 0.3, 3.2, 3.6]]) {
        const wg = grp(s * 23.04, wy, wz);
        wg.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
        const R = ww / 2;
        wg.add(bx(0.28, sh, 0.34, brass, -R + 0.14, sh / 2, 0));
        wg.add(bx(0.28, sh, 0.34, brass, R - 0.14, sh / 2, 0));
        const arc = new THREE.Mesh(new THREE.TorusGeometry(R - 0.14, 0.16, 5, 20, Math.PI), brass);
        arc.position.y = sh;
        wg.add(arc);
        wg.add(bx(ww + 1.4, 0.4, 1.2, cream, 0, -0.22, 0.25));
        wg.add(bx(ww + 1.0, 0.12, 1.1, brass, 0, -0.44, 0.28));
        // glass
        const shp = new THREE.Shape();
        shp.moveTo(-R + 0.2, 0); shp.lineTo(R - 0.2, 0); shp.lineTo(R - 0.2, sh);
        shp.absarc(0, sh, R - 0.2, 0, Math.PI, false);
        shp.lineTo(-R + 0.2, 0);
        const gm = new THREE.Mesh(new THREE.ShapeGeometry(shp, 20), GLASS);
        gm.position.z = 0.05;
        gm.userData.glass = true;
        wg.add(gm);
        wg.add(bx(0.18, sh + R - 0.3, 0.2, brass, 0, (sh + R) / 2 - 0.1, 0.1));
        // shutters
        for (const ss of [-1, 1]) {
          const sh2 = bx(1.15, sh * 0.96, 0.22, matc(C.burgundy), ss * (R + 0.85), sh * 0.48, 0.12);
          wg.add(sh2);
          for (let k = 0; k < 4; k++) {
            wg.add(bx(0.95, 0.12, 0.06, matc(C.burgundyDeep), ss * (R + 0.85), sh * 0.18 + k * sh * 0.22, 0.24));
          }
        }
        g.add(wg);
      }
    }
    // side cornices
    for (const y of [Y1, Y2, Y3]) {
      g.add(bx(1.5, 0.85, D + 1.4, cream, s * 23.2, y + 0.1, -2));
      g.add(bx(1.9, 0.18, D + 1.8, brass, s * 23.3, y + 0.58, -2));
    }
    // downpipe
    g.add(cyl(0.22, 0.22, 29.5, brass, s * 23.25, 15.6, 11.2, 8));
    g.add(cyl(0.3, 0.3, 0.5, brass, s * 23.25, 1.2, 11.2, 8));
  }

  // Juliet balconies
  for (const s of [-1, 1]) {
    const bg = grp(s * 14.5, 0, 0);
    bg.add(bx(11.6, 0.4, 2.4, cream, 0, Y1 + 1.1, 13.6));
    bg.add(bx(11.6, 0.22, 0.22, brass, 0, Y1 + 3.3, 14.6));
    const bars = [];
    for (let i = 0; i < 18; i++) bars.push({ p: [-5.5 + i * 0.65, Y1 + 2.2, 14.6] });
    bg.add(instanced(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 6), brass, bars));
    for (const x of [-5.7, 5.7]) bg.add(bx(0.16, 2.3, 0.16, brass, x, Y1 + 2.2, 14.6));
    // flower boxes
    bg.add(bx(9.6, 0.8, 1.0, matc(C.mintDeep), 0, Y1 + 1.5, 14.5));
    const fl = [];
    for (let i = 0; i < 14; i++) fl.push({ p: [-4.4 + i * 0.68, Y1 + 2.0, 14.5], s: [1, 1, 1] });
    bg.add(instanced(new THREE.SphereGeometry(0.3, 7, 5), matc(C.pinkLight), fl));
    g.add(bg);
  }

  /* ---------------- striped awnings ---------------- */
  function awning(cx, width) {
    const a = grp(cx, 12.05, 12.35);
    a.rotation.x = -0.26;
    const n = 10, sw = width / n, dep = 4.2;
    for (let i = 0; i < n; i++) {
      const m = i % 2 ? matc(C.cream) : matc(C.burgundy);
      a.add(bx(sw, 0.16, dep, m, -width / 2 + sw * (i + 0.5), 0, dep / 2));
    }
    // valance
    for (let i = 0; i < n; i++) {
      const m = i % 2 ? matc(C.cream) : matc(C.burgundy);
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(sw / 2, sw / 2, 0.14, 10, 1, false, 0, Math.PI), m);
      sc.rotation.z = -Math.PI / 2;
      sc.rotation.y = Math.PI / 2;
      sc.position.set(-width / 2 + sw * (i + 0.5), -0.34, dep - 0.02);
      sc.castShadow = true;
      a.add(sc);
    }
    a.add(bx(width, 0.1, 0.1, brass, 0, 0.16, dep - 0.06));
    for (const s of [-1, 1]) {
      const rod = bx(0.08, 0.08, dep, brass, s * (width / 2 - 0.1), 0.1, dep / 2);
      a.add(rod);
    }
    return a;
  }
  for (const s of [-1, 1]) g.add(awning(s * 15.6, 14.2));

  /* ---------------- entrance : brass revolving door ---------------- */
  const doorG = grp(0, Y0, 13.5);
  doorG.add(cyl(3.3, 3.3, 0.2, matc(0x3a2130), 0, 0.1, 0, 24));
  const dr = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.16, 6, 30), brass);
  dr.rotation.x = Math.PI / 2;
  dr.position.y = 0.26;
  doorG.add(dr);
  doorG.add(cyl(3.2, 3.2, 0.35, brass, 0, 5.9, 0, 24));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.26, 6, 30), brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 5.9;
  doorG.add(ring);
  // static curved glass sides
  for (const s of [-1, 1]) {
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 5.5, 16, 1, true, s > 0 ? -0.75 : Math.PI - 0.75, 1.5), new THREE.MeshBasicMaterial({ color: 0xdff3f2, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    gl.position.y = 2.95;
    gl.userData.glass = true;
    doorG.add(gl);
  }
  const wings = grp(0, 2.95, 0);
  for (let i = 0; i < 4; i++) {
    const wg = grp();
    wg.rotation.y = (i / 4) * Math.PI * 2;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 5.2), new THREE.MeshBasicMaterial({ color: 0xd8eef0, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
    pane.rotation.y = Math.PI / 2;
    pane.position.x = 3.1;
    pane.userData.glass = true;
    wg.add(pane);
    wg.add(bx(0.26, 5.3, 0.26, brass, 0, 0, 0));
    wg.add(bx(6.2, 0.22, 0.22, brass, 3.1, 2.55, 0));
    wg.add(bx(6.2, 0.22, 0.22, brass, 3.1, -2.55, 0));
    wings.add(wg);
  }
  doorG.add(wings);
  anim.door = wings;
  // canopy
  doorG.add(bx(8.2, 0.45, 2.9, cream, 0, 6.35, 0));
  doorG.add(bx(8.5, 0.2, 3.2, brass, 0, 6.62, 0));
  for (const s of [-1, 1]) doorG.add(bx(0.3, 6.1, 0.3, brass, s * 3.9, 3.05, 1.2));
  // warm entrance lamp
  const lampBall = sph(0.4, new THREE.MeshBasicMaterial({ color: 0xffe2ae }), 0, 7.35, 0, 10);
  doorG.add(lampBall);
  g.add(doorG);

  /* ---------------- rear elevation windows ---------------- */
  for (const wx of [-14.5, 0, 14.5]) {
    for (const [wy, sh, ww] of [[Y0 + 0.2, 5.4, 4.8], [Y1 + 0.4, 4.6, 4.4], [Y2 + 0.3, 3.2, 3.6]]) {
      const wg = grp(wx, wy, -16.04);
      wg.rotation.y = Math.PI;
      const R = ww / 2;
      wg.add(bx(0.28, sh, 0.34, brass, -R + 0.14, sh / 2, 0));
      wg.add(bx(0.28, sh, 0.34, brass, R - 0.14, sh / 2, 0));
      const arc = new THREE.Mesh(new THREE.TorusGeometry(R - 0.14, 0.16, 5, 20, Math.PI), brass);
      arc.position.y = sh;
      wg.add(arc);
      wg.add(bx(ww + 1.4, 0.4, 1.2, cream, 0, -0.22, 0.25));
      wg.add(bx(ww + 1.0, 0.12, 1.1, brass, 0, -0.44, 0.28));
      const shp2 = new THREE.Shape();
      shp2.moveTo(-R + 0.2, 0); shp2.lineTo(R - 0.2, 0); shp2.lineTo(R - 0.2, sh);
      shp2.absarc(0, sh, R - 0.2, 0, Math.PI, false);
      shp2.lineTo(-R + 0.2, 0);
      const gm2 = new THREE.Mesh(new THREE.ShapeGeometry(shp2, 20), GLASS);
      gm2.position.z = 0.05;
      gm2.userData.glass = true;
      wg.add(gm2);
      wg.add(bx(0.18, sh + R - 0.3, 0.2, brass, 0, (sh + R) / 2 - 0.1, 0.1));
      for (const ss of [-1, 1]) {
        wg.add(bx(1.15, sh * 0.96, 0.22, matc(C.burgundy), ss * (R + 0.85), sh * 0.48, 0.12));
        for (let k = 0; k < 4; k++) {
          wg.add(bx(0.95, 0.12, 0.06, matc(C.burgundyDeep), ss * (R + 0.85), sh * 0.18 + k * sh * 0.22, 0.24));
        }
      }
      g.add(wg);
    }
  }

  /* ================================================================ *
   *  INTERIOR — floor 1 : lobby
   * ================================================================ */
  const lobby = grp(0, Y0, 0);
  g.add(lobby);

  const carpetTex = T.carpet();
  carpetTex.repeat.set(2, 1);
  lobby.add(plane(41, 22.4, mat(0xffffff, { map: carpetTex }), 0, 0.05, -2));
  lobby.add(plane(7.2, 9.4, matc(C.burgundy), 0, 0.09, 7.6));

  // interior wall surfaces
  const wpTex = T.wallpaper();
  const wpMat = mat(0xffffff, { map: wpTex });
  for (const s of [-1, 1]) {
    lobby.add(wallPlane(27.6, 3.4, matc(0x6d1a2c), s * 21.76, 2.7, -2, s > 0 ? -Math.PI / 2 : Math.PI / 2));
    lobby.add(wallPlane(27.6, 7.0, wpMat, s * 21.76, 8.4, -2, s > 0 ? -Math.PI / 2 : Math.PI / 2));
    lobby.add(bx(0.14, 0.3, 27.6, brass, s * 21.7, 4.45, -2));
  }
  lobby.add(wallPlane(43.6, 10.8, wpMat, 0, 6.6, -14.78, 0));
  lobby.add(bx(43.6, 3.2, 0.2, matc(0x6d1a2c), 0, 2.6, -14.7));
  lobby.add(bx(43.6, 0.24, 0.24, brass, 0, 4.24, -14.65));

  // key & mail wall
  const cubTex = T.cubbies();
  const cubMat = new THREE.MeshBasicMaterial({ map: cubTex });
  const cub = new THREE.Mesh(new THREE.PlaneGeometry(27, 8.4), cubMat);
  cub.position.set(0, 7.1, -14.5);
  lobby.add(cub);
  lobby.add(bx(28, 0.3, 1.2, brass, 0, 2.75, -14.2));
  lobby.add(bx(28.4, 0.2, 1.5, matc(0xf7e7cf), 0, 2.55, -14.2));
  // little key tags sticking out
  const tags = [];
  for (let i = 0; i < 22; i++) {
    const c = i % 11, r = Math.floor(i / 11);
    tags.push({ p: [-12.4 + c * 2.44, 4.6 + r * 2.7, -14.0], r: [0, 0, 0.04] });
  }
  lobby.add(instanced(new THREE.BoxGeometry(0.34, 0.5, 0.1), matc(0xf2d79a), tags));

  // octagonal concierge desk
  const desk = grp(0, 0, -2.4);
  desk.add(cyl(4.4, 4.4, 3.5, matc(C.walnut), 0, 1.75, 0, 8));
  desk.add(cyl(4.55, 4.55, 0.34, matc(0xf6e7cd), 0, 3.62, 0, 8));
  desk.add(cyl(4.62, 4.62, 0.12, brass, 0, 3.44, 0, 8));
  desk.add(cyl(4.62, 4.62, 0.16, brass, 0, 2.5, 0, 8));
  // desk objects
  desk.add(cyl(0.42, 0.5, 0.3, brass, 1.5, 3.9, 1.3, 12));
  desk.add(sph(0.26, brass, 1.5, 4.14, 1.3, 10));
  const ledger = bx(1.7, 0.16, 1.1, matc(0xf7ecd6), -1.6, 3.87, 1.0);
  ledger.rotation.y = 0.3; desk.add(ledger);
  desk.add(bx(1.8, 0.1, 1.2, matc(C.burgundy), -1.6, 3.79, 1.0));
  // desk lamp
  desk.add(cyl(0.1, 0.1, 1.2, brass, -2.6, 4.4, -0.6, 8));
  const shade = cone(0.72, 0.9, matc(C.mint), -2.6, 5.2, -0.6, 12);
  shade.rotation.x = Math.PI;
  desk.add(shade);
  desk.add(sph(0.3, new THREE.MeshBasicMaterial({ color: 0xffdca8 }), -2.6, 4.86, -0.6, 10));
  lobby.add(desk);

  // birdcage elevators
  for (const s of [-1, 1]) {
    const shaftX = s * 17.2;
    lobby.add(bx(0.3, 11.0, 0.3, brass, shaftX, 5.6, -7.4));
    lobby.add(bx(0.24, 0.24, 2.6, brass, shaftX, 11.0, -6.2));
    const cab = grp(shaftX, 0.5, -5.4);
    cab.add(cyl(2.5, 2.5, 0.4, brass, 0, 0.2, 0, 18));
    cab.add(cyl(2.4, 2.4, 0.2, matc(C.walnut), 0, 0.42, 0, 18));
    const bars = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      bars.push({ p: [Math.cos(a) * 2.4, 2.9, Math.sin(a) * 2.4] });
    }
    cab.add(instanced(new THREE.CylinderGeometry(0.075, 0.075, 5.1, 6), brass, bars));
    cab.add(cyl(2.5, 2.5, 0.22, brass, 0, 5.45, 0, 18));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), brass);
    dome.position.y = 5.55; dome.castShadow = true;
    cab.add(dome);
    cab.add(sph(0.35, brass, 0, 8.2, 0, 10));
    cab.add(cyl(0.1, 0.16, 0.5, brass, 0, 7.9, 0, 8));
    // warm interior
    cab.add(sph(0.85, new THREE.MeshBasicMaterial({ color: 0xffd9a4 }), 0, 3.0, 0, 12));
    cab.add(cyl(1.9, 2.1, 0.2, new THREE.MeshBasicMaterial({ color: 0xffe6bb }), 0, 5.35, 0, 14));
    const bench = bx(2.4, 0.4, 0.9, matc(C.velvet), 0, 0.9, -1.3);
    cab.add(bench);
    lobby.add(cab);
    anim.elevators.push({ obj: cab, base: 0.5, phase: s > 0 ? 0 : Math.PI });

    // shaft glow
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: T.glowTexture(), color: 0xffb877, transparent: true,
      opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(9, 9, 1);
    sp.position.set(shaftX, 3.2, -5.4);
    lobby.add(sp);
  }

  // paintings
  const paintTex = T.painting();
  for (const s of [-1, 1]) {
    const pg = grp(s * 21.6, 7.6, 3.2);
    pg.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    pg.add(bx(3.4, 4.4, 0.22, brass, 0, 0, 0));
    const canvasM = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.9), new THREE.MeshBasicMaterial({ map: paintTex }));
    canvasM.position.z = 0.13;
    pg.add(canvasM);
    lobby.add(pg);
  }

  // symmetric seating groups
  function armchair(x, z, ry) {
    const ch = grp(x, 0, z);
    ch.rotation.y = ry;
    ch.add(bx(2.4, 0.55, 2.3, matc(C.velvet), 0, 1.05, 0));
    ch.add(bx(2.5, 0.2, 2.4, matc(0x5e1424), 0, 1.35, 0));
    ch.add(bx(2.4, 2.5, 0.42, matc(C.velvet), 0, 2.2, -1.0));
    ch.add(bx(2.7, 0.22, 0.5, matc(0x5e1424), 0, 3.45, -1.0));
    for (const sx of [-1, 1]) {
      ch.add(bx(0.32, 1.1, 2.1, matc(C.velvet), sx * 1.15, 1.7, 0.05));
      ch.add(bx(0.36, 0.16, 2.2, matc(0x5e1424), sx * 1.15, 2.26, 0.05));
      ch.add(cyl(0.12, 0.1, 0.8, brass, sx * 1.0, 0.4, 0.9, 6));
      ch.add(cyl(0.12, 0.1, 0.8, brass, sx * 1.0, 0.4, -0.9, 6));
    }
    return ch;
  }
  for (const s of [-1, 1]) {
    lobby.add(armchair(s * 13.5, 4.6, s > 0 ? -Math.PI / 2 : Math.PI / 2));
    lobby.add(armchair(s * 13.5, 9.4, s > 0 ? -Math.PI / 2 : Math.PI / 2));
    const t = grp(s * 16.6, 0, 7.0);
    t.add(cyl(0.28, 0.42, 0.2, brass, 0, 0.1, 0, 10));
    t.add(cyl(0.14, 0.14, 1.5, brass, 0, 0.85, 0, 8));
    t.add(cyl(1.15, 1.15, 0.18, matc(0xf7e9d2), 0, 1.68, 0, 16));
    t.add(cyl(1.18, 1.18, 0.08, brass, 0, 1.58, 0, 16));
    t.add(cyl(0.3, 0.24, 0.3, matc(C.cream), 0, 1.9, 0, 10));
    lobby.add(t);
  }

  // chandelier
  const chand = grp(0, 11.2, -2);
  chand.add(cyl(0.08, 0.08, 2.2, brass, 0, 1.1, 0, 8));
  chand.add(cyl(3.0, 3.0, 0.18, brass, 0, 0.1, 0, 24));
  const flames = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    flames.push({ p: [Math.cos(a) * 2.9, 0.5, Math.sin(a) * 2.9] });
    chand.add(cyl(0.09, 0.09, 0.7, matc(C.cream), Math.cos(a) * 2.9, 0.4, Math.sin(a) * 2.9, 6));
  }
  chand.add(instanced(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9bd }), flames));
  chand.add(sph(1.6, matc(0xf8e3c4), 0, -0.3, 0, 16));
  lobby.add(chand);

  // floor lamps
  for (const s of [-1, 1]) {
    const fl = grp(s * 19.6, 0, 9.2);
    fl.add(cyl(0.7, 0.9, 0.24, brass, 0, 0.12, 0, 12));
    fl.add(cyl(0.11, 0.11, 4.6, brass, 0, 2.4, 0, 8));
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 1.3, 14, 1, true), matc(C.cream));
    sh.position.y = 5.0; fl.add(sh);
    fl.add(sph(0.4, new THREE.MeshBasicMaterial({ color: 0xffdca8 }), 0, 4.7, 0, 10));
    lobby.add(fl);
  }

  // potted palms flanking the entrance
  for (const s of [-1, 1]) {
    const pl = grp(s * 8.4, 0, 10.2);
    pl.add(cyl(0.9, 0.7, 1.4, matc(0xd9c9b4), 0, 0.7, 0, 12));
    pl.add(cyl(1.0, 1.0, 0.2, brass, 0, 1.42, 0, 12));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const leaf = bx(0.22, 3.4, 0.7, matc(0x4f8a6a), Math.cos(a) * 0.7, 3.0, Math.sin(a) * 0.7);
      leaf.rotation.z = Math.cos(a) * 0.5;
      leaf.rotation.x = Math.sin(a) * 0.5;
      pl.add(leaf);
    }
    lobby.add(pl);
  }

  for (const [lx, ly, lz, li] of [[0, 8.4, 5.0, 11.5], [0, 7.4, -9.5, 9.0]]) {
    const pl = new THREE.PointLight(0xffb877, li, 70, 1.0);
    pl.position.set(lx, ly, lz);
    lobby.add(pl);
    anim.pointLights.push(pl);
  }

  /* ================================================================ *
   *  INTERIOR — floor 2 : Mendl's dessert salon
   * ================================================================ */
  const salon = grp(0, Y1, 0);
  g.add(salon);

  const chkTex = T.checker();
  chkTex.repeat.set(10, 6);
  salon.add(plane(41.6, 26.4, mat(0xffffff, { map: chkTex }), 0, 0.05, -2));
  // rug
  salon.add(plane(13, 13, matc(C.burgundy), 0, 0.08, 1.5));
  salon.add(bx(13.4, 0.05, 13.4, matc(C.brass), 0, 0.07, 1.5));

  for (const s of [-1, 1]) {
    salon.add(wallPlane(27.6, 8.8, matc(0xf7c3d0), s * 21.76, 5.2, -2, s > 0 ? -Math.PI / 2 : Math.PI / 2));
    salon.add(bx(0.14, 0.26, 27.6, brass, s * 21.7, 1.0, -2));
    salon.add(bx(0.14, 0.26, 27.6, brass, s * 21.7, 9.4, -2));
  }
  salon.add(wallPlane(43.6, 9.4, matc(0xf7c3d0), 0, 5.2, -14.78, 0));

  // back counter
  salon.add(bx(30, 3.3, 3.2, mint, 0, 1.65, -12.6));
  salon.add(bx(30.6, 0.34, 3.8, matc(0xf7e9d2), 0, 3.45, -12.6));
  salon.add(bx(30.6, 0.12, 3.9, brass, 0, 3.26, -12.6));
  for (let i = 0; i < 6; i++) {
    salon.add(bx(0.3, 1.6, 0.3, brass, -13 + i * 5.2, 4.4, -13.9));
  }
  salon.add(bx(30, 0.3, 2.0, matc(0xf7e9d2), 0, 5.2, -13.6));

  // espresso machine
  const esp = grp(0, 3.6, -12.6);
  esp.add(bx(6.4, 3.6, 2.6, mint, 0, 1.8, 0));
  esp.add(bx(6.8, 0.3, 3.0, brass, 0, 3.65, 0));
  esp.add(bx(6.0, 1.0, 0.4, matc(0xf3e4cb), 0, 1.0, 1.45));
  for (const s of [-1, 1]) {
    esp.add(cyl(0.5, 0.5, 0.4, brass, s * 1.5, 0.75, 1.6, 12));
    esp.add(cyl(0.24, 0.24, 1.5, brass, s * 1.5, 1.9, 1.5, 10));
  }
  esp.add(cyl(0.5, 0.5, 0.5, brass, 2.9, 1.6, 1.2, 10));
  // cups on top
  for (let i = 0; i < 4; i++) {
    esp.add(cyl(0.26, 0.2, 0.3, matc(0xfdf6ea), -2.2 + i * 1.1, 3.95, 0, 10));
  }
  salon.add(esp);

  // pastry display case
  const caseG = grp(-9.5, 3.6, -12.4);
  caseG.add(bx(7.6, 0.3, 3.0, matc(0xf7e9d2), 0, 0.15, 0));
  for (const [x, z] of [[-3.7, -1.4], [3.7, -1.4], [-3.7, 1.4], [3.7, 1.4]]) {
    caseG.add(bx(0.12, 3.0, 0.12, brass, x, 1.7, z));
  }
  caseG.add(bx(7.6, 0.12, 3.0, brass, 0, 3.2, 0));
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(7.4, 2.9, 2.8), GLASS_SOFT);
  caseGlass.position.y = 1.7;
  caseGlass.userData.glass = true;
  caseG.add(caseGlass);
  for (let i = 0; i < 3; i++) {
    caseG.add(cyl(0.7, 0.75, 0.4, matc(0xf0d7b8), -2.4 + i * 2.4, 0.45, 0, 12));
    caseG.add(cyl(0.5, 0.55, 0.3, matc(0xf6bccb), -2.4 + i * 2.4, 0.75, 0, 12));
  }
  salon.add(caseG);

  // Mendl's box pyramids
  function mendlStack(cx, cz, sgn) {
    const st = grp(cx, 0, cz);
    const boxMat = mat(0xffffff, { map: T.mendlBox() });
    const ribbon = matc(0x7fb8d8);
    const stack = [[-2.6, 0.6], [0, 0.6], [2.6, 0.6], [-1.3, 2.2], [1.3, 2.2], [0, 3.8]];
    for (const [dx, dy] of stack) {
      const b = bx(2.4, 1.5, 2.4, boxMat, dx, dy, 0);
      st.add(b);
      st.add(bx(2.44, 0.16, 0.5, ribbon, dx, dy + 0.05, 0));
      st.add(bx(0.5, 0.16, 2.44, ribbon, dx, dy + 0.05, 0));
    }
    st.add(bx(8.2, 0.4, 4.4, matc(0xf7e9d2), 0, 0.2, 0));
    st.add(bx(8.2, 0.12, 4.5, brass, 0, 0.38, 0));
    return st;
  }
  salon.add(mendlStack(-14.5, -6.2));
  salon.add(mendlStack(14.5, -6.2));

  // glass cloche with religieuses
  const cloche = grp(0, 0, 4.2);
  cloche.add(cyl(3.0, 3.2, 0.3, brass, 0, 0.15, 0, 20));
  cloche.add(cyl(2.9, 2.9, 0.25, matc(0xfdf4e4), 0, 0.42, 0, 20));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const px = Math.cos(a) * 1.4, pz = Math.sin(a) * 1.4;
    cloche.add(cyl(0.5, 0.56, 0.9, matc(0xf3dfc4), px, 0.95, pz, 12));
    cloche.add(sph(0.52, matc(0xf6bccb), px, 1.45, pz, 12));
    cloche.add(sph(0.2, matc(0xfdf6ea), px, 1.9, pz, 8));
  }
  cloche.add(cyl(0.08, 0.08, 3.2, brass, 0, 2.0, 0, 8));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), GLASS_SOFT);
  dome.position.y = 1.0;
  dome.userData.glass = true;
  cloche.add(dome);
  const domeRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 24), brass);
  domeRing.rotation.x = Math.PI / 2; domeRing.position.y = 1.0;
  cloche.add(domeRing);
  cloche.add(sph(0.24, brass, 0, 3.62, 0, 10));
  salon.add(cloche);

  // banquettes + tables
  for (const s of [-1, 1]) {
    const bn = grp(s * 19.4, 0, 0);
    bn.add(bx(2.8, 1.3, 13, matc(C.velvet), 0, 0.65, 0));
    bn.add(bx(1.0, 3.6, 13, matc(C.velvet), -s * 0.9, 2.4, 0));
    bn.add(bx(2.9, 0.2, 13.2, brass, 0, 1.3, 0));
    bn.add(bx(0.4, 0.4, 13.4, matc(C.burgundy), -s * 1.5, 3.9, 0));
    const buttons = [];
    for (let i = 0; i < 8; i++) buttons.push({ p: [-s * 1.42, 2.4 + (i % 2) * 0.6, -5.6 + Math.floor(i / 2) * 3.2] });
    bn.add(instanced(new THREE.SphereGeometry(0.11, 6, 5), matc(0x5e1424), buttons));
    salon.add(bn);

    for (const tz of [-3.6, 3.6]) {
      const t = grp(s * 14.6, 0, tz);
      t.add(cyl(0.35, 0.6, 0.24, brass, 0, 0.12, 0, 12));
      t.add(cyl(0.22, 0.22, 2.3, brass, 0, 1.3, 0, 10));
      t.add(cyl(2.1, 2.1, 0.26, matc(0xf7e9d2), 0, 2.55, 0, 20));
      t.add(cyl(2.14, 2.14, 0.1, brass, 0, 2.4, 0, 20));
      t.add(cyl(0.5, 0.4, 0.5, matc(C.cream), 0, 2.9, 0, 12));
      t.add(sph(0.34, matc(C.pinkLight), 0, 3.25, 0, 10));
      salon.add(t);
      // stools
      for (const a of [0.4, Math.PI - 0.4]) {
        const st = grp(s * 14.6 + Math.cos(a) * 3.1, 0, tz + Math.sin(a) * 3.1);
        st.add(cyl(0.14, 0.14, 1.5, brass, 0, 0.75, 0, 8));
        st.add(cyl(0.85, 0.85, 0.3, matc(C.velvet), 0, 1.6, 0, 14));
        st.add(cyl(0.6, 0.6, 0.2, brass, 0, 0.1, 0, 12));
        salon.add(st);
      }
    }
  }

  // MENDL'S neon
  const mendlSign = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 2.4),
    new THREE.MeshBasicMaterial({ color: 0x3a1a26 })
  );
  mendlSign.position.set(0, 8.4, -14.5);
  salon.add(mendlSign);
  const mendlEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(9.8, 2.8),
    new THREE.MeshBasicMaterial({ color: 0xff9ec4 })
  );
  mendlEdge.position.set(0, 8.4, -14.54);
  salon.add(mendlEdge);
  const mendlText = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.6),
    new THREE.MeshBasicMaterial({
      map: (() => {
        const cv = document.createElement('canvas');
        cv.width = 512; cv.height = 96;
        const c2 = cv.getContext('2d');
        c2.fillStyle = '#3a1a26'; c2.fillRect(0, 0, 512, 96);
        c2.fillStyle = '#ffd0e0'; c2.font = 'italic 62px Georgia, serif';
        c2.textAlign = 'center'; c2.textBaseline = 'middle';
        c2.fillText("Mendl's", 256, 52);
        const tx = new THREE.CanvasTexture(cv);
        tx.colorSpace = THREE.SRGBColorSpace;
        return tx;
      })(),
      toneMapped: false,
    })
  );
  mendlText.position.set(0, 8.4, -14.42);
  mendlText.material.color.setRGB(1.9, 1.3, 1.55);
  salon.add(mendlText);

  for (const [lx, ly, lz, li] of [[0, 6.6, 4.6, 10.5], [0, 6.2, -9.0, 8.5]]) {
    const pl = new THREE.PointLight(0xffc98a, li, 66, 1.0);
    pl.position.set(lx, ly, lz);
    salon.add(pl);
    anim.pointLights.push(pl);
  }

  /* ================================================================ *
   *  INTERIOR — floor 3 : turkish bath + switchboard
   * ================================================================ */
  const attic = grp(0, Y2, 0);
  g.add(attic);

  attic.add(plane(41.6, 26.4, matc(0xa9764f), 0, 0.05, -2));
  // plank lines
  for (let i = 0; i < 14; i++) {
    attic.add(bx(41.6, 0.02, 0.14, matc(0x7d5233), 0, 0.08, -14.6 + i * 1.9));
  }
  for (const s of [-1, 1]) {
    attic.add(wallPlane(27.6, 6.6, matc(0xe7cfae), s * 21.76, 3.3, -2, s > 0 ? -Math.PI / 2 : Math.PI / 2));
  }
  attic.add(wallPlane(43.6, 6.6, matc(0xe7cfae), 0, 3.3, -14.78, 0));
  // beams
  for (let i = 0; i < 7; i++) {
    attic.add(bx(0.7, 0.55, 27.6, matc(0x6b4327), -19 + i * 6.4, 6.3, -2));
  }
  attic.add(bx(43.6, 0.4, 0.7, matc(0x6b4327), 0, 6.3, 5.6));

  // ---- turkish bath ----
  const bath = grp(-12, 0, -3);
  const tileTex = T.tiles();
  tileTex.repeat.set(3, 1.4);
  const tileMat = mat(0xffffff, { map: tileTex });
  bath.add(wallPlane(15, 6.4, tileMat, 0, 3.2, -8.2, 0));
  bath.add(wallPlane(15, 6.4, tileMat, -8.2, 3.2, 0, Math.PI / 2));
  // pool
  bath.add(bx(11, 0.5, 7.4, matc(0xe8dccb), 0, 0.25, 1.5));
  bath.add(bx(9.8, 0.5, 6.2, matc(0x2f8f92), 0, 0.45, 1.5));
  const water = plane(9.6, 6.0, new THREE.MeshBasicMaterial({ color: 0x66e6d8 }), 0, 0.73, 1.5);
  bath.add(water);
  bath.add(bx(10.2, 0.14, 6.6, brass, 0, 0.53, 1.5));
  // taps
  for (const s of [-1, 1]) {
    bath.add(cyl(0.14, 0.14, 2.0, brass, s * 2.6, 2.6, -7.4, 8));
    bath.add(cyl(0.5, 0.4, 0.2, brass, s * 2.6, 3.6, -7.4, 12));
    bath.add(cyl(0.5, 0.4, 0.2, brass, s * 2.6, 1.7, -7.4, 12));
  }
  // towels
  bath.add(cyl(0.1, 0.1, 5.4, brass, -6.6, 3.4, 3.2, 8));
  for (let i = 0; i < 3; i++) {
    bath.add(bx(0.9, 2.4, 0.28, matc(i % 2 ? C.cream : C.mintPale), -5.8, 2.4, 3.2 + i * 0.3));
  }
  // bath lamp
  bath.add(sph(0.5, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0, 5.9, -2, 10));
  attic.add(bath);
  // steam source marker
  anim.bath = new THREE.Vector3(-12, 24.9, -1.5);

  // ---- switchboard ----
  const sb = grp(12.5, 0, -8.5);
  sb.add(bx(10.4, 1.0, 3.4, matc(0x6b4327), 0, 0.5, 0));
  sb.add(bx(10.0, 4.4, 0.6, matc(0x7a4a2e), 0, 3.0, -1.2));
  const panel = bx(9.4, 3.6, 0.5, matc(0x8b5c3c), 0, 3.1, -0.75);
  panel.rotation.x = -0.16;
  sb.add(panel);
  // jacks
  const jacks = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
    jacks.push({ p: [-4.0 + c * 1.33, 2.2 + r * 0.72, -0.46], r: [Math.PI / 2 - 0.16, 0, 0] });
  }
  sb.add(instanced(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 8), brass, jacks));
  // indicator lamps
  const lamps = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffdf7a });
    const s2 = sph(0.17, m, -4.0 + i * 0.95, 4.4, -0.4, 8);
    sb.add(s2);
    lamps.push({ mesh: s2, mat: m, phase: i * 0.7 });
  }
  anim.switchLights = lamps;
  // cords + headset
  for (let i = 0; i < 5; i++) {
    sb.add(cyl(0.05, 0.05, 1.6, matc(0x2b2028), -3 + i * 1.5, 1.6, -0.2, 5));
  }
  sb.add(bx(1.2, 0.2, 0.9, matc(0x2b2028), 3.6, 1.3, 0.4));
  // stool
  sb.add(cyl(0.2, 0.28, 1.5, matc(0x5a3a26), 0, 0.75, 1.6, 8));
  sb.add(cyl(0.85, 0.85, 0.28, matc(C.velvet), 0, 1.6, 1.6, 12));
  attic.add(sb);
  for (const bx0 of [9.5, 15.5]) {
    attic.add(cyl(0.06, 0.06, 1.6, matc(0x2b2028), bx0, 5.6, -8.5, 5));
    attic.add(sph(0.3, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), bx0, 4.75, -8.5, 8));
  }

  for (const [lx, ly, lz, li] of [[0, 4.8, 3.4, 9.0], [2, 4.6, -6.0, 8.0]]) {
    const pl = new THREE.PointLight(0xffbe7a, li, 56, 1.0);
    pl.position.set(lx, ly, lz);
    attic.add(pl);
    anim.pointLights.push(pl);
  }

  /* ================================================================ *
   *  ROOF
   * ================================================================ */
  const roof = grp(0, Y3, -2);

  // mansard frustum
  const rg = new THREE.BoxGeometry(1, 1, 1);
  {
    const pos = rg.attributes.position;
    const wb = 48, db = 30, wt = 39, dt = 22, h = 6.4;
    for (let i = 0; i < pos.count; i++) {
      const nx = pos.getX(i), ny = pos.getY(i), nz = pos.getZ(i);
      const k = ny > 0 ? 1 : 0;
      const sx = k ? wt / wb : 1, sz = k ? dt / db : 1;
      pos.setXYZ(i, nx * wb * sx, (ny + 0.5) * h, nz * db * sz);
    }
    rg.computeVertexNormals();
  }
  const mansard = new THREE.Mesh(rg, matc(C.mintDeep));
  mansard.castShadow = true; mansard.receiveShadow = true;
  roof.add(mansard);

  // roof ribs
  for (const s of [-1, 1]) {
    const r1 = bx(0.4, 7.2, 0.4, brass, s * 19.6, 3.4, 11.2);
    r1.rotation.x = -0.32; roof.add(r1);
    const r2 = bx(0.4, 7.2, 0.4, brass, s * 19.6, 3.4, -11.2);
    r2.rotation.x = 0.32; roof.add(r2);
  }
  // ridge cresting
  roof.add(bx(39.4, 0.4, 0.5, brass, 0, 6.5, 0));
  const crest = [];
  for (let i = 0; i < 13; i++) crest.push({ p: [-18 + i * 3, 6.9, 0] });
  roof.add(instanced(new THREE.SphereGeometry(0.28, 8, 6), brass, crest));

  // snow along the eaves
  for (const s of [-1, 1]) {
    const sn = bx(48.6, 0.6, 1.6, snow, 0, 0.5, s * 14.6);
    roof.add(sn);
    const sn2 = bx(1.6, 0.6, 30.6, snow, s * 24.0, 0.5, 0);
    roof.add(sn2);
  }

  // dormers
  for (const s of [-1, 1]) {
    for (const dx of [6, 15]) {
      const d = grp(s * dx, 0.4, 12.9);
      d.add(bx(5.2, 4.2, 3.4, plaster, 0, 2.1, 0));
      d.add(bx(5.6, 0.4, 3.8, cream, 0, 4.3, 0));
      const win = archFrame(2.6, 1.6, 0.24, 0.3, brass, 0, 1.3, 1.75);
      d.add(win);
      const wg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), GLASS_SOFT);
      wg.position.set(0, 2.2, 1.72);
      wg.userData.glass = true;
      d.add(wg);
      d.add(bx(5.8, 0.5, 4.0, snow, 0, 4.55, 0));
      roof.add(d);
      const db = d.clone();
      db.position.z = -12.9;
      db.rotation.y = Math.PI;
      roof.add(db);
    }
  }

  // chimneys
  for (const s of [-1, 1]) {
    const ch = grp(s * 15, 0, -6);
    ch.add(bx(3.2, 8.5, 3.2, matc(0xd08a95), 0, 4.25, 0));
    ch.add(bx(3.6, 0.5, 3.6, cream, 0, 8.5, 0));
    ch.add(bx(3.8, 0.6, 3.8, snow, 0, 8.9, 0));
    for (const dx of [-0.8, 0.8]) ch.add(cyl(0.35, 0.35, 1.1, matc(0x6a5a62), dx, 9.3, 0, 8));
    roof.add(ch);
  }

  // cupola
  const cup = grp(0, 6.2, 0);
  cup.add(cyl(5.4, 6.0, 4.6, matc(0xf3e2c8), 0, 2.3, 0, 8));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const panel = bx(1.5, 2.6, 0.3, matc(0x6f9f92), Math.cos(a) * 5.2, 2.3, Math.sin(a) * 5.2);
    panel.rotation.y = -a;
    cup.add(panel);
  }
  cup.add(cyl(6.4, 6.4, 0.4, brass, 0, 4.7, 0, 8));
  const cdome = new THREE.Mesh(new THREE.SphereGeometry(5.6, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), matc(C.mint));
  cdome.position.y = 4.8; cdome.castShadow = true;
  cup.add(cdome);
  cup.add(cyl(0.4, 0.5, 1.6, brass, 0, 10.8, 0, 10));
  cup.add(sph(0.55, brass, 0, 11.7, 0, 12));
  roof.add(cup);

  // flag pole + flag
  const pole = cyl(0.18, 0.22, 12, brass, 0, 18.4, 0, 10);
  roof.add(pole);
  roof.add(sph(0.4, brass, 0, 24.6, 0, 10));
  const flagGeo = new THREE.PlaneGeometry(9.5, 5.6, 22, 10);
  const flagMat = new THREE.MeshToonMaterial({
    color: C.gold, gradientMap: matc(0xffffff).gradientMap, side: THREE.DoubleSide,
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(4.9, 21.6, 0);
  flag.castShadow = false;
  roof.add(flag);
  anim.flag = flag;
  anim.flagGeo = flagGeo;

  // sign board
  const signGrp = grp(0, 8.0, 10.2);
  signGrp.add(bx(23, 4.7, 0.55, matc(0x2b2028), 0, 0, 0));
  signGrp.add(bx(23.6, 0.32, 0.75, brass, 0, 2.4, 0));
  signGrp.add(bx(23.6, 0.32, 0.75, brass, 0, -2.4, 0));
  const signTex = T.signTexture();
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(21.6, 4.3),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false })
  );
  signFace.material.color.setRGB(1.7, 1.5, 1.15);
  signFace.position.z = 0.31;
  signGrp.add(signFace);
  const signBack = new THREE.Mesh(
    new THREE.PlaneGeometry(21.6, 4.3),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false })
  );
  signBack.material.color.setRGB(1.4, 1.25, 1.0);
  signBack.position.z = -0.31;
  signBack.rotation.y = Math.PI;
  signGrp.add(signBack);
  // posts
  for (const s of [-1, 1]) {
    signGrp.add(bx(0.45, 6.4, 0.45, brass, s * 8.5, -5.0, -0.2));
  }
  roof.add(signGrp);
  // glow behind sign
  const signGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: T.glowTexture(), color: 0xffc46a, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  signGlow.scale.set(38, 14, 1);
  signGlow.position.set(0, 8.0, 9.3);
  roof.add(signGlow);

  g.add(roof);

  // warm spill from windows onto the snow
  for (const [x, y, z, s] of [[0, 6, 15, 16], [0, 18, 15, 13]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: T.glowTexture(), color: 0xffb46a, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(s, s, 1);
    sp.position.set(x, y, z);
    g.add(sp);
  }

  return { group: g, anim };
}

export const HOTEL = { W, HW, D, ZF, ZB, Y0, Y1, Y2, Y3 };
