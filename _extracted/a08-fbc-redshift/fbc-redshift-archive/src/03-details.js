// ═══════════════════════════════════════════════════════════════════════
//  03 — evidence: posters, tape decks, dead channels, paper bureaucracy
// ═══════════════════════════════════════════════════════════════════════

// ── bureaucracy printed on paper ───────────────────────────────────────
function posterCanvas(type) {
  const W = 640, H = 880;
  const [c, x] = canvas2d(W, H);
  const r = rng(7700 + type * 91);
  const grain = (alpha = .055) => {
    x.save();
    for (let i = 0; i < 1200; i++) {
      x.fillStyle = r() > .5 ? `rgba(30,25,19,${alpha * r()})` : `rgba(255,246,224,${alpha * r()})`;
      x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
    }
    x.restore();
  };
  const codeLine = (yy, txt = 'FBC / BUREAU OF CONTROL / ARCHIVE 07') => {
    x.fillStyle = 'rgba(35,33,28,.72)';
    x.font = '600 13px ui-monospace, monospace';
    x.fillText(txt, 34, yy);
  };
  if (type === 0) {
    x.fillStyle = '#d9d2c1'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#111313'; x.fillRect(0, 0, W, 118);
    x.fillStyle = '#e2dbc9'; x.font = '900 44px "Arial Narrow", Impact, sans-serif';
    x.fillText('FEDERAL BUREAU', 36, 62);
    x.fillStyle = '#9e1a18'; x.fillRect(36, 82, 280, 7);
    x.fillStyle = '#d8d1c1'; x.font = '15px ui-monospace, monospace';
    x.fillText('OF CONTROL — PARANORMAL ARCHIVE', 36, 105);
    // monolithic triangle mark
    x.save(); x.translate(W / 2, 365);
    x.strokeStyle = '#151615'; x.lineWidth = 9;
    x.beginPath(); x.moveTo(0, -160); x.lineTo(168, 116); x.lineTo(-168, 116); x.closePath(); x.stroke();
    x.beginPath(); x.arc(0, 60, 85, 0, TAU); x.stroke();
    x.fillStyle = '#a51d1a'; x.fillRect(-10, -28, 20, 94);
    x.restore();
    x.fillStyle = '#121313'; x.font = '900 91px "Arial Black", Impact, sans-serif';
    x.fillText('PARANORMAL', 34, 605);
    x.fillText('ARCHIVE', 34, 694);
    x.fillStyle = '#9d1917'; x.font = '700 23px ui-monospace, monospace';
    x.fillText('SECTOR 07 / INTAKE & CONTAINMENT', 36, 746);
    x.fillStyle = '#181918'; x.font = '16px ui-monospace, monospace';
    x.fillText('OBSERVATION IS A CONTAINMENT PROCEDURE.', 36, 790);
    x.fillText('DO NOT FILE WHAT FOLLOWS YOU HOME.', 36, 812);
    codeLine(84, 'FBC-FORM 77-C / REV 1964');
    x.strokeStyle = 'rgba(26,26,24,.5)'; x.lineWidth = 2; x.strokeRect(12, 12, W - 24, H - 24);
    // barcode
    for (let i = 0; i < 42; i++) { const bw = 1 + Math.floor(r() * 5); x.fillStyle = i % 7 ? '#161716' : '#a01b18'; x.fillRect(36 + i * 9, 832, bw, 26); }
    x.fillStyle = '#282823'; x.font = '11px monospace'; x.fillText('7 7 0 4 1 9 6 4', 420, 852);
    grain(.08);
  } else if (type === 1) {
    x.fillStyle = '#100d0d'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#8e1715'; x.fillRect(0, 0, W, 152);
    x.fillStyle = '#0f0d0c'; x.font = '900 68px "Arial Black", Impact, sans-serif';
    x.fillText('RED SHIFT', 32, 94);
    x.fillStyle = '#e3dbca'; x.font = '17px ui-monospace, monospace';
    x.fillText('EMERGENCY ILLUMINATION PROTOCOL 7B', 35, 128);
    // breathing lamp diagram
    x.save(); x.translate(W / 2, 392);
    x.strokeStyle = '#d7d0bf'; x.lineWidth = 4;
    for (let i = 0; i < 3; i++) x.strokeRect(-45 - i * 26, -62 - i * 24, 90 + i * 52, 124 + i * 48);
    x.beginPath(); x.arc(0, 0, 24, 0, TAU); x.fillStyle = '#b9221e'; x.fill();
    x.strokeStyle = 'rgba(185,34,30,.75)'; x.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      x.beginPath(); x.moveTo(Math.cos(a) * 48, Math.sin(a) * 48); x.lineTo(Math.cos(a) * 90, Math.sin(a) * 90); x.stroke();
    }
    x.restore();
    x.fillStyle = '#e5ddcb'; x.font = '900 33px "Arial Narrow", Impact, sans-serif';
    x.fillText('IF THE LIGHT BREATHES,', 36, 586);
    x.fillText('DO NOT BREATHE WITH IT.', 36, 632);
    x.fillStyle = '#b4241f'; x.font = '900 38px "Arial Black", Impact, sans-serif';
    x.fillText('EVACUATE THE INTERIOR.', 36, 694);
    x.fillStyle = '#878074'; x.font = '15px ui-monospace, monospace';
    x.fillText('THE OBJECT DOES NOT OBEY THE FLOOR PLAN.', 36, 736);
    x.fillText('REMAIN CALM. REMAIN OBSERVED.', 36, 760);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#b32420' : '#1a1715'; x.fillRect(34 + i * 44, 804, 42, 28); }
    codeLine(858);
    grain(.12);
  } else if (type === 2) {
    x.fillStyle = '#d6d0c1'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#111313'; x.fillRect(0, 0, 640, 72);
    x.fillStyle = '#d5cebd'; x.font = '700 20px ui-monospace, monospace';
    x.fillText('INCIDENT REPORT — UNVERIFIED SPACE', 34, 45);
    x.fillStyle = '#111313'; x.font = '900 94px "Arial Black", Impact, sans-serif';
    x.fillText('THE', 34, 190);
    x.fillText('ROOM', 34, 286);
    x.fillText('IS NOT', 34, 382);
    x.fillStyle = '#a01b18'; x.fillText('EMPTY', 34, 478);
    // impossible floor plan
    x.save(); x.translate(80, 600); x.strokeStyle = '#1a1b1a'; x.lineWidth = 6;
    x.strokeRect(0, 0, 472, 158);
    x.strokeRect(46, 31, 210, 94);
    x.strokeRect(290, 31, 148, 94);
    x.strokeRect(210, 52, 80, 54);
    x.strokeStyle = '#a01b18'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(256, 75); x.lineTo(210, 104); x.lineTo(290, 120); x.lineTo(256, 75); x.stroke();
    x.beginPath(); x.arc(256, 96, 8, 0, TAU); x.fillStyle = '#a01b18'; x.fill();
    x.fillStyle = '#101111'; x.font = '12px monospace';
    x.fillText('OBSERVATION CHAMBER', 57, 54);
    x.fillText('NON-EXISTENT WING', 303, 54);
    x.restore();
    x.fillStyle = '#1a1b19'; x.font = '17px ui-monospace, monospace';
    x.fillText('REPORT ALL SPATIAL DISCREPANCIES TO YOUR', 36, 800);
    x.fillText('NEAREST ARCHIVIST. DO NOT OPEN CLOSED DOORS.', 36, 824);
    codeLine(858);
    x.strokeStyle = 'rgba(20,21,20,.55)'; x.lineWidth = 2; x.strokeRect(12, 12, W - 24, H - 24);
    grain(.1);
  } else {
    x.fillStyle = '#b5b0a2'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#171818'; x.fillRect(0, 0, W, 10); x.fillRect(0, H - 10, W, 10);
    x.fillStyle = '#9d1b18';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(0, H); x.closePath(); x.globalAlpha = .18; x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#171818'; x.font = '700 15px ui-monospace, monospace';
    x.fillText('FBC / CONCRETE DIVISION / NOTICE 19', 34, 55);
    x.fillStyle = '#171818'; x.font = '900 71px "Arial Black", Impact, sans-serif';
    x.fillText('SILENCE', 34, 195);
    x.fillText('IS A', 34, 276);
    x.fillText('CONTAINMENT', 34, 360);
    x.fillText('PROCEDURE', 34, 444);
    x.fillStyle = '#9b1b18'; x.font = '900 52px "Arial Narrow", Impact, sans-serif';
    x.fillText('ТИШИНА', 34, 536);
    x.fillStyle = '#1b1c1a'; x.font = '16px ui-monospace, monospace';
    for (let i = 0; i < 4; i++) x.fillText('KEEP ALL DOORS SHUT. KEEP ALL RECORDS OPEN.', 34, 640 + i * 25);
    x.strokeStyle = '#9e1d19'; x.lineWidth = 10; x.beginPath(); x.moveTo(34, 730); x.lineTo(550, 610); x.stroke();
    x.fillStyle = '#9e1d19'; x.font = '700 26px ui-monospace, monospace';
    x.fillText('AUTHORIZED PERSONNEL ONLY', 34, 795);
    for (let i = 0; i < 30; i++) { x.strokeStyle = 'rgba(30,31,29,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(r() * W, r() * H); x.lineTo(r() * W, r() * H); x.stroke(); }
    grain(.12);
  }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
const POSTERS = [0, 1, 2, 3].map(posterCanvas);

function addPoster(parent, tex, x, y, z, w, h, ry = 0) {
  const g = groupAt(parent, x, y, z, ry);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness: .92, metalness: .01,
    emissive: 0x3b0d09, emissiveMap: tex, emissiveIntensity: .13,
  });
  const p = new THREE.Mesh(planeGeo(w, h), mat);
  p.position.z = .016;
  p.castShadow = false; p.receiveShadow = true;
  g.add(p);
  // blackened metal frame and thumbtacks
  const frame = M.steelDark;
  box(g, w + .09, .035, .05, frame, 0, h / 2 + .02, .02);
  box(g, w + .09, .035, .05, frame, 0, -h / 2 - .02, .02);
  box(g, .035, h + .07, .05, frame, -w / 2 - .02, 0, .02);
  box(g, .035, h + .07, .05, frame, w / 2 + .02, 0, .02);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const pin = new THREE.Mesh(cylGeo(.018, .018, .03, 5), M.steel);
    pin.rotation.x = Math.PI / 2; pin.position.set(sx * (w / 2 - .08), sy * (h / 2 - .08), .055);
    g.add(pin);
  }
  return g;
}

// posters on the archive wall
addPoster(HALL, POSTERS[0], -5.05, 4.95, -3.86, 1.65, 2.28);
addPoster(HALL, POSTERS[2], 5.36, 5.1, -3.86, 1.6, 2.2);
addPoster(HALL, POSTERS[1], -7.74, 9.7, -3.86, 1.25, 1.72);
addPoster(HALL, POSTERS[3], 7.75, 9.55, -3.86, 1.25, 1.72);
addPoster(HALL, POSTERS[1], -6.95, 2.2, -3.86, 1.1, 1.5);
// posters on the portico piers
addPoster(pierR, POSTERS[0], .05, 8.1, 1.53, 1.42, 1.98);
addPoster(pierL, POSTERS[2], .05, 8.15, 1.53, 1.42, 1.98);
addPoster(pierR, POSTERS[3], -.4, 12.3, 1.53, 1.05, 1.45);
// lower side wall, inside
addPoster(HALL, POSTERS[0], 8.93, 3.45, -1.4, 1.2, 1.7, -Math.PI / 2);
// the back face — for anyone who walks around the model
addPoster(HALL, POSTERS[1], -6.4, 7.2, -5.33, 1.4, 1.95, Math.PI);
addPoster(HALL, POSTERS[3], 8.0, 7.0, -5.33, 1.15, 1.6, Math.PI);
// rear loading signage
(function rearSign() {
  const [c, x] = canvas2d(1024, 260);
  x.fillStyle = '#141514'; x.fillRect(0, 0, 1024, 260);
  x.strokeStyle = '#5c5f5b'; x.lineWidth = 3; x.strokeRect(10, 10, 1004, 240);
  x.fillStyle = '#bcb8ab'; x.font = '700 32px "Arial Narrow", sans-serif'; x.letterSpacing = '8px';
  x.fillText('FEDERAL BUREAU OF CONTROL', 40, 70);
  x.fillStyle = '#b22421'; x.font = '900 88px "Arial Black", Impact, sans-serif';
  x.fillText('LOADING  //  07', 38, 172);
  x.fillStyle = '#6e6c63'; x.font = '700 21px ui-monospace, monospace';
  x.fillText('NO UNOBSERVED DELIVERIES / AUTHORIZED PERSONNEL ONLY', 40, 218);
  const t = canvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const mesh = new THREE.Mesh(planeGeo(3.8, .97), new THREE.MeshBasicMaterial({ map: t }));
  mesh.position.set(3.6, 5.65, -5.65); mesh.rotation.y = Math.PI; HALL.add(mesh);
})();

// a stopped office clock
(function wallClock() {
  const [c, x] = canvas2d(256, 256);
  x.translate(128, 128);
  x.fillStyle = '#d3cdbb'; x.beginPath(); x.arc(0, 0, 114, 0, TAU); x.fill();
  x.strokeStyle = '#161717'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 112, 0, TAU); x.stroke();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    x.strokeStyle = '#1a1b19'; x.lineWidth = i % 3 ? 2 : 5;
    x.beginPath(); x.moveTo(Math.cos(a) * 94, Math.sin(a) * 94); x.lineTo(Math.cos(a) * 103, Math.sin(a) * 103); x.stroke();
  }
  x.strokeStyle = '#181918'; x.lineWidth = 7;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(-Math.PI / 2 + .58) * 55, Math.sin(-Math.PI / 2 + .58) * 55); x.stroke();
  x.strokeStyle = '#9f1b17'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(-Math.PI / 2 + 4.7) * 82, Math.sin(-Math.PI / 2 + 4.7) * 82); x.stroke();
  x.fillStyle = '#9f1b17'; x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill();
  x.fillStyle = '#4a463e'; x.font = '16px ui-monospace, monospace'; x.textAlign = 'center'; x.fillText('FBC', 0, -40);
  const t = canvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const clock = new THREE.Mesh(planeGeo(.62, .62), new THREE.MeshStandardMaterial({ map: t, roughness: .8, metalness: .1 }));
  clock.position.set(8.93, 6.6, -.15); clock.rotation.y = -Math.PI / 2;
  HALL.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 4, 32), M.steelDark);
  rim.position.copy(clock.position); rim.position.x -= .01; rim.rotation.y = -Math.PI / 2; HALL.add(rim);
})();

// punched steel ventilation grilles
function grille(parent, x, y, z, w, h, ry = 0) {
  const g = groupAt(parent, x, y, z, ry);
  box(g, w + .18, h + .18, .12, M.steelDark, 0, 0, 0);
  box(g, w, h, .04, M.voidBlack, 0, 0, .08);
  const slots = Math.floor(h / .1);
  for (let i = 0; i < slots; i++) {
    box(g, w - .06, .035, .035, M.steel, 0, -h / 2 + .06 + i * (h - .12) / (slots - 1), .11);
  }
  return g;
}
grille(HALL, -8.95, 10.5, -2.7, 1.35, 2.2, 0);
grille(HALL, 8.95, 10.1, -2.8, 1.35, 2.2, 0);
grille(pierR, .0, 5.2, 1.54, .9, .55, 0);
grille(pierL, .0, 13.1, 1.54, .9, .55, 0);

// ── archive shelves: the hall is a machine for holding paper ────────────
const fileInstances = [];
function queueFile(x, y, z, sx, sy, sz, ry, color) {
  fileInstances.push({ x, y, z, sx, sy, sz, ry, color });
}
function fileShelfWall() {
  const x0 = -.1, z = -3.72, width = 7.7;
  box(HALL, width + .2, .16, .62, M.steelDark, x0, .92, z + .05);
  for (const y of [1.0, 1.78, 2.56, 3.34]) {
    box(HALL, width, .055, .58, M.steelDark, x0, y - .08, z);
    for (let i = 0; i < 34; i++) {
      const px = x0 - width / 2 + .18 + i * (width - .4) / 33 + rr(-.02, .02);
      const h = rr(.23, .39);
      const col = randOf(['#cfc7b3', '#aaa086', '#7d836f', '#8a6f53', '#b6b09f', '#595549', '#9f9a89']);
      queueFile(px, y + h / 2 + .035, z + rr(-.06, .06), rr(.13, .2), h, rr(.28, .42), rr(-.03, .03), col);
    }
  }
  for (const px of [-width / 2 + .1, -1.8, .9, width / 2 - .1]) {
    box(HALL, .07, 3.4, .56, M.steelDark, x0 + px, 1.87, z);
  }
  // large index cards and red tabs
  for (let i = 0; i < 15; i++) {
    const x = x0 + rr(-width / 2 + .3, width / 2 - .3);
    queueFile(x, rr(1.05, 3.55), z + .32, .16, rr(.25, .34), .025, rr(-.1, .1), i % 4 ? '#d0c7b2' : '#9a2420');
  }
}

// archive cabinets, front after front
const drawerMatCache = new Map();
function cabinetDrawerMaterial(baseMat) {
  if (!drawerMatCache.has(baseMat.uuid)) {
    drawerMatCache.set(baseMat.uuid, new THREE.MeshStandardMaterial({
      color: baseMat.color.clone().multiplyScalar(.9), roughness: .7, metalness: .2,
    }));
  }
  return drawerMatCache.get(baseMat.uuid);
}
function fileCabinet(x, y, z, ry = 0, scale = 1, parent = HALL, mat = M.paintedGreen) {
  const g = groupAt(parent, x, y, z, ry);
  const w = 1.25 * scale, h = 1.48 * scale, d = .62 * scale;
  const body = box(g, w, h, d, mat, 0, h / 2, 0, 0, true);
  body.castShadow = true; body.receiveShadow = true;
  for (let i = 0; i < 3; i++) {
    const dy = h * .18 + i * h * .27;
    box(g, w - .11, h * .23, .035, cabinetDrawerMaterial(mat), 0, dy, d / 2 + .02);
    box(g, .3, .045, .05, M.steel, 0, dy + h * .025, d / 2 + .055);
    // crooked little label
    queueFileRel(g, 0, dy, d / 2 + .06, .14, .06, .008, '#d1c8b2');
  }
  for (let i = 0; i < 3; i++) {
    const p = queueFileRel(g, -.38 + i * .38, h + .045, -.05, .2, .07, .32, randOf(['#cec6b1', '#a39a84', '#7d7462']));
  }
  return g;
}
function queueFileRel(parent, x, y, z, sx, sy, sz, color) {
  parent.updateWorldMatrix(true, false);
  const p = new THREE.Vector3(x, y, z).applyMatrix4(parent.matrixWorld);
  fileInstances.push({ x: p.x, y: p.y, z: p.z, sx, sy, sz, ry: parent.rotation.y, color });
}

// ground banks
fileCabinet(-6.62, .26, -3.35, 0, 1.02);
fileCabinet(-5.32, .26, -3.35, 0, 1.02);
fileCabinet(5.0, .26, -3.35, 0, 1.02);
fileCabinet(6.3, .26, -3.35, 0, 1.02);
fileCabinet(7.5, .26, -2.6, -.08, .9);
fileCabinet(-7.35, .26, 1.5, Math.PI / 2, .92);
fileCabinet(7.25, .26, 1.5, -Math.PI / 2, .9);
// mezzanine banks
fileCabinet(-7.3, 5.82, -3.28, 0, .94);
fileCabinet(-6.05, 5.82, -3.28, 0, .94);
fileCabinet(6.4, 5.82, -3.32, 0, .95);
fileCabinet(7.5, 5.82, -3.32, 0, .85);
fileCabinet(4.1, 10.32, -3.8, 0, .86);
fileCabinet(-2.0, 10.32, -3.8, 0, .86);
fileCabinet(-7.8, 10.32, -3.8, 0, .8);
// rooftop and outside storage
fileCabinet(-10.6, .26, -4.25, .1, 1.1);
fileCabinet(-11.1, 10.38, .6, .1, .7);
fileCabinet(10.5, 13.77, -2.4, -.2, .64);
fileCabinet(-11.8, .26, -2.75, .16, 1.4);
fileCabinet(11.2, .26, -3.7, -.15, 1.2, BASE);
fileCabinet(10.9, .26, 8.0, -.25, 1.0, BASE);
fileCabinet(8.1, .26, -7.4, Math.PI, 1.15, BASE);
fileCabinet(-6.8, .26, -7.0, Math.PI, .9, BASE);
fileCabinet(10.4, .26, -7.0, 2.9, .9, BASE);
// crates by the loading dock
for (let i = 0; i < 9; i++) {
  const s = rr(.3, .58);
  architectural(box(BASE, s, s * rr(.55, .9), s * rr(.8, 1.1), i % 2 ? M.concreteDark : M.steelRust,
    1.8 + rr(-1.6, 1.6), .27 + s * .35, -7.8 + rr(-.6, .6), rr(0, TAU), true));
}
fileShelfWall();

// ── one punch-tape monolith in the corner of the hall ──────────────────
function tapeMachine(x, y, z, ry = 0, scale = 1, parent = HALL) {
  const g = groupAt(parent, x, y, z, ry);
  const sc = scale;
  box(g, 1.9 * sc, .16, 1.1 * sc, M.steelRust, 0, .08 * sc, 0, 0, true);
  box(g, 1.85 * sc, .82, 1.0 * sc, M.paintedOchre, 0, .55 * sc, 0, 0, true);
  box(g, 1.75 * sc, .2, .92 * sc, M.steelDark, 0, .98 * sc, .02, 0, true);
  // twin tape reels
  for (const sx of [-.47, .47]) {
    const reel = new THREE.Group();
    reel.position.set(sx * sc, 1.38 * sc, .34 * sc);
    const disc = new THREE.Mesh(cylGeo(.31 * sc, .31 * sc, .08 * sc, 28), M.blackPlastic);
    disc.rotation.x = Math.PI / 2; reel.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.29 * sc, .018 * sc, 4, 32), M.steel);
    rim.position.z = .05 * sc; reel.add(rim);
    const hub = new THREE.Mesh(cylGeo(.07 * sc, .07 * sc, .1 * sc, 12), M.steel);
    hub.rotation.x = Math.PI / 2; hub.position.z = .055 * sc; reel.add(hub);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const spoke = box(reel, .03 * sc, .23 * sc, .02 * sc, M.steelDark, Math.cos(a) * .14 * sc, Math.sin(a) * .14 * sc, .045 * sc, 0);
      spoke.rotation.z = a;
    }
    g.add(reel);
  }
  // tape ribbon between reels and head
  const pts = [
    v3(-.16 * sc, 1.38 * sc, .42 * sc), v3(0, 1.14 * sc, .45 * sc), v3(.14 * sc, 1.34 * sc, .42 * sc),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .012 * sc, 3, false), M.blackPlastic);
  g.add(ribbon);
  box(g, .34 * sc, .08 * sc, .035 * sc, M.steel, 0, 1.02 * sc, .5 * sc);
  // keyboard / switches
  box(g, 1.05 * sc, .07 * sc, .3 * sc, M.blackPlastic, 0, 1.06 * sc, .59 * sc);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
    box(g, .075 * sc, .025 * sc, .06 * sc, M.paintedGreen, -.38 * sc + col * .108 * sc, 1.1 * sc, .52 * sc + row * .08 * sc);
  }
  const lamp = new THREE.Mesh(sphGeo(.045 * sc, 8, 6), M.lampGreen);
  lamp.position.set(.66 * sc, 1.05 * sc, .62 * sc); g.add(lamp);
  const lamp2 = new THREE.Mesh(sphGeo(.035 * sc, 8, 6), M.bulb);
  lamp2.position.set(.78 * sc, 1.05 * sc, .62 * sc); g.add(lamp2);
  // plastic tape case
  box(g, .9 * sc, .32 * sc, .44 * sc, M.blackPlastic, -.65 * sc, .18 * sc, .76 * sc, .1, true);
  // trailing punched tape
  const tapePts = [];
  for (let i = 0; i < 10; i++) tapePts.push(v3(.3 * sc + i * .17 * sc - rr(0, .05), .17 * sc + Math.sin(i * .75) * .02, .7 * sc + i * .12 * sc));
  const tapeCurve = new THREE.CatmullRomCurve3(tapePts);
  const tape = new THREE.Mesh(new THREE.TubeGeometry(tapeCurve, 32, .018 * sc, 2, false), M.paperPlain);
  tape.scale.y = .25; g.add(tape);
  return g;
}
tapeMachine(6.6, .25, 2.25, -.1, 1.05);
tapeMachine(-3.3, 10.14, -2.6, .03, .85);
tapeMachine(-10.9, .16, 2.3, .42, 1.2, BASE);

// ── the dead-channel wall ──────────────────────────────────────────────
const CRT_FRAG = `
precision highp float;
uniform float uTime; uniform float uSeed; uniform float uFace;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
void main(){
  vec2 uv = vUv;
  vec2 cc = uv - .5;
  uv = .5 + cc * (1.0 + .12 * dot(cc,cc));
  float inside = step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
  float t = uTime + uSeed * 11.7;
  float glitch = smoothstep(.82, .99, hash(vec2(floor(t*4.0), uSeed*13.0)));
  uv.x += (hash(vec2(floor(uv.y*34.0), floor(t*17.0)+uSeed)) - .5) * .1 * glitch;
  float scan = .72 + .28 * sin(uv.y*340.0 + t*8.0);
  float grain = hash(uv*vec2(210.,130.) + floor(t*28.0)*vec2(2.1,3.7));
  float roll = smoothstep(0.02,.10,abs(uv.y - fract(t*.11 + uSeed*.41)));
  float vig = smoothstep(0.,.06,uv.x)*smoothstep(0.,.06,1.-uv.x)*smoothstep(0.,.08,uv.y)*smoothstep(0.,.08,1.-uv.y);
  vec3 green = vec3(.16,1.0,.47);
  vec3 col = green * (.015 + .18*grain + .05*scan + .025*(1.0-roll));
  col += vec3(.42,.9,.55) * step(.997, hash(vec2(floor(t*21.0),uSeed))) * .11;
  // the thing that is not a broadcast — a negative silhouette in the snow
  vec2 p = uv - vec2(.5,.51);
  p.x += sin(t*1.7+uSeed*8.0)*.008*step(.6,noise(vec2(t*.7,uSeed)));
  float phase = sin(t*(.23 + fract(uSeed*3.17)*.12) + uSeed*7.0)*.5+.5;
  float visage = clamp(uFace * smoothstep(.23,.55,phase), 0., 1.);
  float head = 1.0-smoothstep(.2,.245, length((p-vec2(.0,.065))*vec2(1.28,.94)));
  float shoulder = 1.0-smoothstep(.33,.37, length((p-vec2(.0,-.33))*vec2(.85,1.28)));
  float mask = max(head, shoulder);
  float face = visage * mask;
  float eyes = (1.0-smoothstep(.012,.027,length(p-vec2(-.072,.068))) + 1.0-smoothstep(.012,.027,length(p-vec2(.072,.068))));
  float mouth = (1.0-smoothstep(.009,.024,abs(p.y+.015))) * step(abs(p.x),.06);
  // the figure is a hole in the signal, not a bright sprite
  col = mix(col, vec3(.002,.016,.008) + green*grain*.025, face*.965);
  col += green * eyes * face * 1.15;
  col += green * mouth * face * .11;
  // a slice of transmission failure across the face
  float faceTear = step(.965, hash(vec2(floor(uv.y*34.0), floor(t*9.0)+uSeed))) * face;
  col += vec3(.4,1.0,.6) * faceTear * .2;
  float tear = step(.93, hash(vec2(floor(uv.y*18.0), floor(t*11.0)+uSeed)));
  col += vec3(.6,1.0,.65) * tear * .11;
  col *= inside * vig;
  gl_FragColor = vec4(col*1.18, 1.0);
}`;
const CRT_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

function makeCRT(w, h, d, seed, face = 1, parent = HALL) {
  const g = new THREE.Group();
  parent.add(g);
  const body = box(g, w, h, d, seed % 2 ? M.crtBody : M.crtBodyDark, 0, 0, 0, 0, true);
  body.castShadow = true; body.receiveShadow = true;
  const back = box(g, w * .7, h * .72, d * .5, M.crtBodyDark, 0, 0, -d * .57, 0, false);
  back.castShadow = true;
  const bezel = box(g, w * .91, h * .86, .09, M.blackPlastic, 0, 0, d / 2 + .015);
  const sw = w * .77, sh = h * .68;
  const screen = new THREE.Mesh(planeGeo(sw, sh), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed * .713 }, uFace: { value: face } },
    vertexShader: CRT_VERT, fragmentShader: CRT_FRAG,
  }));
  screen.position.set(-w * .055, .02, d / 2 + .075);
  g.add(screen);
  screens.push(screen.material);
  // knobs / brand strip
  for (let i = 0; i < 2; i++) {
    const knob = new THREE.Mesh(cylGeo(.052, .052, .04, 10), M.steelDark);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(w * .405, -.1 + i * .16, d / 2 + .065);
    g.add(knob);
  }
  box(g, w * .92, .035, .04, M.steelDark, 0, -h * .43, d / 2 + .07);
  for (let i = 0; i < 5; i++) box(g, w * .6, .015, .02, M.steelDark, -w * .08, -h * .36 + i * .035, d / 2 + .077);
  if (seed % 3 === 0) {
    const a = cylinderBetween(v3(-w * .22, h * .4, -d * .15), v3(-w * .6, h * .95, -.1), .012, M.steelDark, 4);
    g.add(a);
    const b = cylinderBetween(v3(w * .18, h * .4, -d * .15), v3(w * .62, h * 1.05, -.2), .012, M.steelDark, 4);
    g.add(b);
  }
  return g;
}

const TVWALL = new THREE.Group();
TVWALL.position.set(-10.35, .15, 6.05);
TVWALL.rotation.y = .28;
BASE.add(TVWALL);
// black steel frame and concrete footing
architectural(box(TVWALL, 4.15, .28, 1.35, M.concreteDark, 0, .14, 0, 0, true));
for (const sx of [-1, 1]) {
  box(TVWALL, .08, 4.1, .08, M.steelDark, sx * 1.94, 2.2, -.55);
}
for (let i = 0; i < 4; i++) box(TVWALL, 3.95, .06, .9, M.steelDark, 0, .4 + i * 1.0, -.52);
const tvDefs = [
  [-1.28, .67, 0, .0, 1.04, 1.3], [0, .62, .02, .02, 1.08, 2.2], [1.27, .7, -.02, -.02, 1.0, 0],
  [-1.3, 1.68, .01, .01, .98, 2.2], [.05, 1.7, .08, -.03, 1.12, 0.25], [1.28, 1.62, -.01, .04, 1.02, 1.0],
  [-1.25, 2.65, -.04, -.04, 1.04, 0], [-.02, 2.7, .04, .03, 1.02, 1.9], [1.3, 2.62, .02, -.02, .98, 1.0],
  [-.65, 3.57, .06, .02, .95, 0], [.72, 3.52, -.02, -.03, .92, 2.1],
];
for (let i = 0; i < tvDefs.length; i++) {
  const d = tvDefs[i];
  const tv = makeCRT(1.02 * d[4], .82 * d[4], .72 * d[4], i + 2, d[5], TVWALL);
  tv.position.set(d[0], d[1], d[2] + .0);
  tv.rotation.y = d[3];
  tv.rotation.z = rr(-.025, .025);
}
// a leaning monitor at the foot and one on top
const tvFoot = makeCRT(.9, .7, .64, 17, .7, TVWALL);
tvFoot.position.set(1.65, .32, .45); tvFoot.rotation.set(0, -.15, .03);
const tvTop = makeCRT(.78, .62, .58, 23, 1.5, TVWALL);
tvTop.position.set(1.45, 4.13, .22); tvTop.rotation.set(0, .12, -.08);
box(TVWALL, 4.4, .38, 1.52, M.concreteDark, 0, 4.35, -.1, 0, true);
const tvSign = (() => {
  const [c, x] = canvas2d(620, 92);
  x.fillStyle = '#101111'; x.fillRect(0, 0, 620, 92);
  x.fillStyle = '#6b7770'; x.font = '700 22px ui-monospace, monospace';
  x.fillText('FBC // CLOSED CIRCUIT / SUBLEVEL 04', 24, 38);
  x.fillStyle = '#a4211e'; x.font = '700 18px ui-monospace, monospace';
  x.fillText('DO NOT ADJUST THE RECEIVER', 24, 66);
  const t = canvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
})();
const tvSignMesh = new THREE.Mesh(planeGeo(2.8, .41), new THREE.MeshBasicMaterial({ map: tvSign }));
tvSignMesh.position.set(0, 4.35, .68); TVWALL.add(tvSignMesh);
// green light and blurry aura
const greenAura = glowSprite(0x5bff9e, 4.2, .14);
greenAura.position.set(0, 2.2, .55); TVWALL.add(greenAura);
greenGlowMats.push(greenAura.material);
const tvLight = new THREE.PointLight(0x5dffa2, 9, 8, 1.8);
tvLight.position.set(-9.8, 2.3, 6.5); BASE.add(tvLight);
pulseLights.push({ light: tvLight, base: 9, phase: 5.2, color: 'green' });
// tangled signal cables
for (let i = 0; i < 5; i++) {
  const pts = [];
  let p = v3(rr(-1.8, 1.8), 4.25, -.4);
  for (let j = 0; j < 5; j++) {
    p = p.clone().add(v3(rr(-.5, .5), -rr(.65, 1.2), rr(-.15, .1)));
    pts.push(p);
  }
  tube(TVWALL, pts, .014, M.blackPlastic, 22, 4);
}
// the same ghost channels, much smaller, up in the archive
const insideCRT1 = makeCRT(.72, .58, .52, 41, 1.4, HALL);
insideCRT1.position.set(-8.35, 11.05, -2.05);
insideCRT1.rotation.y = .12;
const insideCRT2 = makeCRT(.62, .52, .48, 44, 1.9, HALL);
insideCRT2.position.set(7.78, 6.6, -1.45);
insideCRT2.rotation.y = -.1;

// ── bureaucratic clutter, stacked and abandoned ────────────────────────
const paperBoxMat = new THREE.MeshStandardMaterial({ color: 0x8b7954, map: WOOD_TEX, roughness: .9 });
const paperBoxMat2 = new THREE.MeshStandardMaterial({ color: 0x686b5e, roughness: .92 });
for (let i = 0; i < 22; i++) {
  const s = rr(.28, .65);
  const x = randOf([-7.7, -6.9, 6.9, 7.7, -10.8, 10.7, 11.6]) + rr(-.25, .25);
  const z = randOf([-2.8, -.7, 2.3, 5.1]) + rr(-.2, .2);
  const y = .3 + rr(0, .9);
  const b = box(HALL, s, s * rr(.45, .85), s * rr(.7, 1.1), i % 3 ? paperBoxMat : paperBoxMat2, x, y, z, rr(0, TAU), true);
  b.castShadow = true;
}
// stray folders on the unsupported trays
for (let i = 0; i < 10; i++) {
  queueFile(rr(-11.7, -9.0), 10.4, rr(-2.1, 1.6), rr(.18, .33), .035, rr(.22, .35), rr(0, TAU), randOf(['#c7bda6', '#a69a7d', '#827b64']));
}
for (let i = 0; i < 8; i++) {
  queueFile(rr(8.9, 11.7), 13.78, rr(-3.0, .7), rr(.16, .3), .03, rr(.2, .32), rr(0, TAU), randOf(['#c7bda6', '#a69a7d', '#827b64']));
}
// low piles of damp folders directly on the concrete
for (let i = 0; i < 34; i++) {
  const x = rr(-8.4, 8.4), z = rr(-4.0, 4.0);
  if (Math.hypot(x, z) < 2.4) continue;
  const y = .32 + rr(0, .28);
  const s = rr(.18, .42);
  queueFile(x, y, z, s, rr(.03, .08), s * rr(.8, 1.4), rr(0, TAU), randOf(['#c5bca6', '#a69a7e', '#827a63', '#c7bfae']));
}
// papers stuck to the back wall like dead moths
for (let i = 0; i < 18; i++) {
  const x = rr(-8.4, 8.4), y = rr(1.0, 6.7);
  const p = new THREE.Mesh(planeGeo(rr(.2, .38), rr(.26, .46)), M.paperAged);
  p.position.set(x, y, -3.82 + rr(-.02, .03));
  p.rotation.z = rr(-.3, .3);
  p.rotation.x = rr(-.1, .1);
  HALL.add(p);
}
// add all queued files in one draw
(function commitFiles() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88, metalness: .01 });
  const inst = new THREE.InstancedMesh(boxGeo(1, 1, 1), mat, fileInstances.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  fileInstances.forEach((f, i) => {
    p.set(f.x, f.y, f.z);
    e.set(0, f.ry, 0); q.setFromEuler(e);
    s.set(f.sx, f.sy, f.sz);
    m.compose(p, q, s); inst.setMatrixAt(i, m);
    col.set(f.color); inst.setColorAt(i, col);
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.castShadow = false; inst.receiveShadow = true;
  HALL.add(inst);
})();


// ── temporary emergency floods, aimed at the archive ───────────────────
function emergencyFlood(x, z, aim, intensity = 42) {
  const g = groupAt(BASE, x, 0, z, aim);
  const feet = [];
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + .4;
    const foot = v3(Math.cos(a) * .62, .02, Math.sin(a) * .62);
    feet.push(foot);
    g.add(cylinderBetween(foot, v3(0, 1.62, 0), .024, M.steelDark, 5));
    const pad = new THREE.Mesh(cylGeo(.09, .11, .05, 7), M.steelRust);
    pad.position.copy(foot); pad.position.y = .03; g.add(pad);
  }
  // adjustable mast and yoke
  g.add(cylinderBetween(v3(0, 1.56, 0), v3(0, 2.1, .08), .035, M.steelDark, 6));
  box(g, .28, .15, .24, M.steelDark, 0, 2.1, .04, 0, true);
  const head = groupAt(g, 0, 2.32, .15, 0);
  head.rotation.x = -.62;
  box(head, 1.05, .62, .33, M.steelRust, 0, 0, 0, 0, true);
  box(head, .88, .46, .035, M.bulb, 0, 0, .19);
  // cage bars
  for (let i = 0; i < 4; i++) box(head, .9, .025, .025, M.steelDark, 0, -.21 + i * .14, .22);
  for (let i = 0; i < 3; i++) box(head, .025, .5, .025, M.steelDark, -.35 + i * .35, 0, .22);
  // cable
  const cable = [];
  for (let i = 0; i < 5; i++) cable.push(v3(-.7 + i * .1, .04 + Math.sin(i) * .04, .55 + i * .16));
  tube(g, cable, .02, M.blackPlastic, 16, 4);
  const glow = glowSprite(0xff1f14, 2.2, .46);
  glow.position.set(0, 2.4, .55);
  g.add(glow);
  redGlowMats.push(glow.material);
  const light = new THREE.PointLight(0xff1f14, intensity, 16, 1.75);
  light.position.set(x + Math.sin(aim) * .8, 2.6, z + Math.cos(aim) * .8);
  scene.add(light);
  pulseLights.push({ light, base: intensity, phase: x * .33 });
  return g;
}
emergencyFlood(-8.9, 9.75, -.35, 34);
emergencyFlood(9.15, 7.9, .7, 30);
emergencyFlood(-1.1, 11.8, 3.1, 22);
emergencyFlood(-7.6, -9.7, 2.8, 24);
emergencyFlood(7.35, -9.0, -2.55, 20);

// occasional office chair wheels / abandoned audio tape
for (let i = 0; i < 12; i++) {
  const reel = new THREE.Mesh(cylGeo(.18, .18, .07, 18), M.blackPlastic);
  reel.rotation.x = Math.PI / 2;
  reel.rotation.z = rr(0, TAU);
  reel.position.set(rr(-8.2, 8.2), .3, rr(-3.8, 3.9));
  HALL.add(reel);
}
