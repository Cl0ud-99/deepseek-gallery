import * as THREE from 'three';
import { P } from './palette.js';
import { A } from './config.js';
import {
  rng, v3, mesh, rBox, ico, sphere, cyl, plane, tube, inkOutline,
  archHole, archOutline, canvasTexture, makeGlowTexture, TAU, rr, roundedRectPath,
} from './lib.js';
import {
  MAT, TEX, toonRamp, JELLY, GLOW_TEX, STAR_TEX, toon, brassMaterial,
  glow, glowSprite, basic,
} from './materials.js';
import { createInterior } from './interior.js';

// ─────────────────────────────────────────────────────────────
//  晚霞织梦染坊 & 捕梦灯塔
//  A dollhouse with no front wall to hide its warm little life.
// ─────────────────────────────────────────────────────────────

const D = A.D, W = A.W, T = A.wallT;

function starShape(radius = .12, inner = .45) {
  const s = new THREE.Shape();
  const spikes = 5, ro = radius, ri = radius * inner;
  for (let i = 0; i < spikes * 2; i++) {
    const a = i * Math.PI / spikes - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function starMesh(radius=.1, depth=.028, color='#ffd17c') {
  const geo = new THREE.ExtrudeGeometry(starShape(radius), {
    depth, bevelEnabled: true, bevelSegments: 1, steps: 1,
    bevelSize: .007, bevelThickness: .006, curveSegments: 2,
  });
  const m = new THREE.Mesh(geo, brassMaterial(color));
  m.castShadow = true;
  return m;
}

function crescentMesh(radius=.18, tube=.028, arc=Math.PI*1.3) {
  const g = new THREE.TorusGeometry(radius, tube, 6, 24, arc);
  const m = new THREE.Mesh(g, brassMaterial('#ffd985'));
  m.castShadow = true;
  return m;
}

function archTrimCurve(hole, z) {
  const pts = archOutline(hole.x, hole.bottom, hole.w, hole.h, z);
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .02);
  return new THREE.TubeGeometry(curve, 60, .032, 5, false);
}

function mullionGroup(hole, z, opts={}) {
  const g = new THREE.Group();
  const mat = MAT.woodDark;
  const vertical = mesh(rBox(.034, hole.h * (opts.vScale ?? .80), .035, .01), mat, {
    pos: [hole.x, hole.bottom + hole.h * .36, z]
  });
  g.add(vertical);
  const horizontal = mesh(rBox(hole.w * .76, .032, .035, .01), mat, {
    pos: [hole.x, hole.bottom + hole.h * .56, z]
  });
  g.add(horizontal);
  if (opts.ring) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(hole.w, hole.h)*.16, .018, 5, 18), mat);
    ring.position.set(hole.x, hole.bottom + hole.h*.72, z);
    g.add(ring);
    for (let i=0;i<4;i++){
      const a = i/4*Math.PI*2 + Math.PI/4;
      const spoke = mesh(cyl(.009,.009, Math.min(hole.w,hole.h)*.16, 4), mat, {
        pos:[hole.x + Math.cos(a)*Math.min(hole.w,hole.h)*.08, hole.bottom+hole.h*.72 + Math.sin(a)*Math.min(hole.w,hole.h)*.08, z],
        rot:[Math.PI/2, 0, a]
      });
      g.add(spoke);
    }
  }
  return g;
}

function flowerBox(x, y, z, width=.52) {
  const g = new THREE.Group();
  const box = mesh(rBox(width, .15, .20, .035), MAT.woodDark, { pos:[x,y,z] });
  g.add(box);
  const soil = mesh(rBox(width-.06, .035, .15, .012), toon('#6d4b48'), { pos:[x,y+.08,z] });
  g.add(soil);
  const r = rng(400 + Math.floor(x*11));
  for (let i=0;i<8;i++){
    const px = x + (r()-.5)*width*.8;
    const pz = z + (r()-.5)*.12;
    const leaf = mesh(ico(.07,1), toon(i%3 ? '#9ed9b9' : '#c3e8c8'), {
      pos:[px, y+.12+r()*.06, pz], scale:[.7,.35,.7], rot:[0,r()*TAU,0]
    });
    leaf.castShadow = false; g.add(leaf);
    if (i < 5) {
      const blossom = mesh(ico(.035,1), toon(['#ffb4c8','#ffe3b2','#ffd0de','#d8c2ff'][i%4]), {
        pos:[px + (r()-.5)*.08, y+.19+r()*.06, pz], scale:[1,.8,1]
      });
      g.add(blossom);
    }
  }
  for (let i=0;i<3;i++){
    const vine = mesh(cyl(.008,.008,.22,4), toon('#9bcbb3'), {
      pos:[x-width*.28 + i*.24, y-.08, z+.12], rot:[.2,0,.4]
    });
    g.add(vine);
  }
  return g;
}

function makeWallAssembly(opts) {
  const { width, height, holes, flowers = [], mullions = [], trim = true, outline = true } = opts;
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-width/2, 0);
  shape.lineTo(width/2, 0);
  shape.lineTo(width/2, height);
  shape.lineTo(-width/2, height);
  shape.closePath();
  for (const h of holes) {
    const hole = archHole(h.x, h.bottom, h.w, h.h, 0);
    shape.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: T, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: .026, bevelThickness: .022, curveSegments: 16,
  });
  geo.translate(0, 0, -T/2);
  const wall = new THREE.Mesh(geo, MAT.plaster);
  wall.castShadow = true; wall.receiveShadow = true;
  g.add(wall);
  if (outline) inkOutline(wall, '#816270', .012, .48);

  // timber skeleton
  const frameMat = MAT.woodDark;
  const top = mesh(rBox(width + .06, .12, T + .12, .025), frameMat, { pos:[0, height - .055, 0] });
  const bottom = mesh(rBox(width + .08, .11, T + .14, .025), frameMat, { pos:[0, .055, 0] });
  g.add(top, bottom);
  for (const sx of [-1,1]) {
    g.add(mesh(rBox(.12, height, T + .13, .03), frameMat, { pos:[sx*(width/2-.012), height/2, 0] }));
  }
  // slim verticals at the edge of each large opening, like hand-cut timber
  for (const h of holes) {
    if (h.w > .8) {
      const ytop = h.bottom + h.h - h.w*.5;
      for (const side of [-1,1]) {
        const x = h.x + side*h.w/2;
        g.add(mesh(rBox(.07, ytop, T + .125, .018), frameMat, { pos:[x, ytop/2, 0] }));
      }
    }
    if (trim) {
      for (const face of [-1,1]) {
        const zf = face * (T/2 + .023);
        const trimMesh = new THREE.Mesh(archTrimCurve(h, zf), frameMat);
        trimMesh.castShadow = false;
        g.add(trimMesh);
        // a lichen-thin gold inner line
        const pts = archOutline(h.x, h.bottom + .04, h.w - .09, h.h - .08, zf + face*.008);
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .02);
        const gold = new THREE.Mesh(new THREE.TubeGeometry(curve, 50, .008, 4, false), MAT.brassSoft);
        g.add(gold);
      }
    }
  }
  for (const h of mullions) {
    const idx = holes.findIndex(x => x.x === h);
    if (idx >= 0) g.add(mullionGroup(holes[idx], T/2 + .03, { ring:true }));
  }
  // subtle corner braces
  for (const [sx,sz] of [[-1,1],[1,1],[-1,-1],[1,-1]]) {
    if (sz < 0 && opts.noBackBraces) continue;
    const brace = mesh(rBox(.055, .48, .045, .012), frameMat, {
      pos:[sx*(width/2-.30), height-.36, sz*(T/2+.005)],
      rot:[0,0,sx*.65]
    });
    brace.castShadow = false;
    g.add(brace);
  }
  // flower boxes on the outside face
  for (const f of flowers) {
    g.add(flowerBox(f.x, f.y, T/2+.13, f.width || .52));
  }
  return { group: g, wall };
}

function makeRoofSide(sign) {
  const segX = 34, segV = 16;
  const halfW = A.roofHalfW;
  const eaveZ = A.eaveZ;
  const apex = A.ridgeY;
  const eaveY = A.eaveY;
  const pos = [], uv = [], idx = [];
  for (let j=0;j<=segV;j++){
    const v = j/segV;
    for (let i=0;i<=segX;i++){
      const u = i/segX;
      const x = -halfW + u*halfW*2;
      const z = sign * eaveZ * v;
      const curve = 0.16 * Math.pow(v, 2.2);
      const lift = .22 * Math.pow(Math.abs(x)/halfW, 5.5) * Math.pow(v, 2.0);
      const y = apex - (apex - eaveY) * Math.pow(v, 1.14) + lift;
      pos.push(x, y, z);
      uv.push(u * 2.4 + .03, v * 2.1);
    }
  }
  for (let j=0;j<segV;j++){
    for (let i=0;i<segX;i++){
      const a = j*(segX+1)+i;
      const b = (j+1)*(segX+1)+i;
      const c = (j+1)*(segX+1)+i+1;
      const d = j*(segX+1)+i+1;
      idx.push(a,b,d, b,c,d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshToonMaterial({
    color: '#ffffff', map: TEX.roof, gradientMap: toonRamp,
    side: THREE.DoubleSide, emissive: new THREE.Color('#8e4e60'), emissiveIntensity: .035,
  });
  const roof = new THREE.Mesh(geo, mat);
  roof.castShadow = true; roof.receiveShadow = true;
  return { roof, halfW, eaveZ, apex, eaveY };
}

function makeRoof() {
  const group = new THREE.Group();
  const front = makeRoofSide(1);
  const back = makeRoofSide(-1);
  group.add(front.roof, back.roof);

  // ridge beam + finials
  const ridge = mesh(cyl(.085,.085,A.roofHalfW*2+.24,10), MAT.woodDark, {
    pos:[0, A.ridgeY+.015, 0], rot:[0,0,Math.PI/2]
  });
  group.add(ridge);
  const ridgeGold = mesh(cyl(.026,.026,A.roofHalfW*2+.32,6), MAT.brass, {
    pos:[0, A.ridgeY+.102, 0], rot:[0,0,Math.PI/2]
  });
  group.add(ridgeGold);
  for (const sx of [-1,1]) {
    const fin = mesh(new THREE.SphereGeometry(.10, 12, 8), MAT.brass, {
      pos:[sx*(A.roofHalfW+.06), A.ridgeY+.08, 0], scale:[1,.8,1]
    });
    group.add(fin);
    const spike = mesh(new THREE.ConeGeometry(.025,.22,5), MAT.brass, {
      pos:[sx*(A.roofHalfW+.06), A.ridgeY+.22, 0], rot:[0,0,sx*.06]
    });
    group.add(spike);
  }

  // eave fascia on both slopes
  for (const sign of [-1,1]) {
    const pts = [];
    for (let i=0;i<=30;i++){
      const x = -A.roofHalfW + i/30*A.roofHalfW*2;
      const lift = .22 * Math.pow(Math.abs(x)/A.roofHalfW, 5.5);
      pts.push(v3(x, A.eaveY + lift, sign*(A.eaveZ+.004)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const fascia = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, .055, 6), MAT.woodDark);
    fascia.castShadow = true;
    group.add(fascia);
    const goldLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, .018, 4), MAT.brass);
    goldLine.position.y = -.09;
    group.add(goldLine);
  }

  // tile ribs and little eave charms
  for (const sign of [-1,1]) {
    for (let i=0;i<=8;i++){
      const x = -A.roofHalfW + i/8*A.roofHalfW*2;
      const pts = [];
      for (let j=0;j<=8;j++){
        const v = j/8;
        const lift = .22 * Math.pow(Math.abs(x)/A.roofHalfW, 5.5) * Math.pow(v, 2.0);
        pts.push(v3(x, A.ridgeY - (A.ridgeY-A.eaveY)*Math.pow(v,1.14) + lift + .012, sign*A.eaveZ*v));
      }
      const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 34, .008, 3), new THREE.MeshBasicMaterial({ color:'#b56d76', transparent:true, opacity:.23, toneMapped:false }));
      rib.castShadow = false;
      group.add(rib);
    }
    // scalloped little cloud charms under the front eave
    if (sign === 1) {
      for (let i=0;i<9;i++){
        const x = -2.2 + i*.55;
        const bead = mesh(ico(.055,1), MAT.brassSoft, { pos:[x, A.eaveY-.08, A.eaveZ+.05], scale:[1.2,.6,.8] });
        bead.castShadow=false;
        group.add(bead);
        const drop = mesh(new THREE.ConeGeometry(.025,.10,5), MAT.brass, { pos:[x, A.eaveY-.19, A.eaveZ+.05], rot:[Math.PI,0,0] });
        drop.castShadow=false;
        group.add(drop);
      }
    }
  }

  // rafters visible from below / from the open sides
  const rafterMat = MAT.woodDark;
  for (const sign of [-1,1]) {
    for (let i=0;i<7;i++){
      const x = -2.25 + i*.75;
      const top = v3(x, A.ridgeY-.10, sign*.16);
      const bottom = v3(x, A.eaveY-.14, sign*(A.eaveZ-.08));
      const rafter = new THREE.Mesh(new THREE.CylinderGeometry(.043,.034, top.distanceTo(bottom), 6), rafterMat);
      rafter.position.copy(top).add(bottom).multiplyScalar(.5);
      rafter.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3().subVectors(bottom, top).normalize());
      rafter.castShadow = false;
      group.add(rafter);
    }
  }

  // a little gold star at the ridge
  const star = starMesh(.13, .025, '#ffd27d');
  star.position.set(0, A.ridgeY+.36, 0);
  group.add(star);

  return group;
}

function makeLatticeDoor(hingeX, side, y) {
  const g = new THREE.Group();
  g.position.set(hingeX, y, D/2 + T/2 + .13);
  const sign = side; // -1 left leaf (extends toward +x), +1 right leaf (extends toward -x)
  g.rotation.y = sign * 1.05;
  const leaf = new THREE.Group();
  const w = 1.0, h = 1.28;
  leaf.position.x = -sign * .5;
  const frameMat = MAT.woodDark;
  const outer = [
    [0, h-.04, w, .08, 0],
    [0, .06, w, .08, 0],
  ];
  const top = mesh(rBox(w, .075, .06, .015), frameMat, { pos:[0, h-.03, .02] });
  const bottom = mesh(rBox(w, .075, .06, .015), frameMat, { pos:[0, .03, .02] });
  const left = mesh(rBox(.06, h, .06, .015), frameMat, { pos:[-w/2+.03,h/2,.02] });
  const right = mesh(rBox(.06, h, .06, .015), frameMat, { pos:[w/2-.03,h/2,.02] });
  leaf.add(top,bottom,left,right);
  // open lattice, with a fine warm glimmer between the slats
  for (let i=1;i<4;i++) {
    leaf.add(mesh(rBox(.026, h-.12, .035, .006), frameMat, { pos:[-w/2+i*w/4, h/2, .03] }));
  }
  for (let j=1;j<5;j++) {
    leaf.add(mesh(rBox(w-.12, .026, .035, .006), frameMat, { pos:[0, .06+j*h/6, .03] }));
  }
  // a few tiny star-shaped peepholes along the top
  for (let i=0;i<3;i++){
    const s = starMesh(.035, .012, '#efc075');
    s.position.set(-.22+i*.22, h-.23, .07);
    leaf.add(s);
  }
  // silk tie / handle
  const handle = mesh(new THREE.TorusGeometry(.045,.009,5,12,Math.PI), MAT.brass, { pos:[-sign*.35,.62,.07], rot:[0,0,sign>0?0:Math.PI] });
  leaf.add(handle);
  g.add(leaf);
  return g;
}

function makeBalconyRail() {
  const g = new THREE.Group();
  const z = D/2 + .13;
  const railY = A.upperFloorY + .52;
  const baseY = A.upperFloorY + .01;
  const railMat = MAT.wood;
  const top = mesh(rBox(W+.16, .075, .085, .025), railMat, { pos:[0,railY,z] });
  g.add(top);
  const low = mesh(rBox(W+.16, .045, .065, .018), railMat, { pos:[0,baseY+.11,z] });
  g.add(low);
  for (let i=0;i<13;i++){
    const x = -W/2 + .10 + i*(W-.20)/12;
    const post = mesh(cyl(.022,.026,railY-baseY-.10,7), MAT.wood, { pos:[x, baseY+.12+(railY-baseY-.1)/2,z] });
    g.add(post);
  }
  for (const sx of [-1,1]) {
    const post = mesh(rBox(.10, .66, .10, .02), MAT.woodDark, { pos:[sx*(W/2+.06), baseY+.32, z] });
    g.add(post);
    const ball = mesh(ico(.075,1), MAT.brassSoft, { pos:[sx*(W/2+.06), baseY+.69, z] });
    g.add(ball);
  }
  // flower garland and warm star-lights on the rail
  const r = rng(510);
  for (let i=0;i<9;i++){
    const x = -2.05 + i*.51;
    const leaf = mesh(ico(.09,1), toon(i%2?'#9fcfb5':'#bfe2bd'), { pos:[x, railY-.05+(r()-.5)*.06, z+.05], scale:[1.2,.4,.8] });
    g.add(leaf);
    if (i%2===0) {
      const flower = mesh(ico(.045,1), toon(i%4 ? '#ffc1d4':'#ffe7b6'), { pos:[x+.08, railY+.01, z+.08] });
      g.add(flower);
    }
    const bead = glowSprite('gold', .055, .18);
    bead.position.set(x-.1, railY-.10, z+.07);
    g.add(bead);
  }
  return g;
}

// ── the tower ───────────────────────────────────────────────
function makeDreamcatcher(radius) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .022, 6, 40), brassMaterial('#f3c674'));
  g.add(ring);
  const web = [];
  const N = 14;
  for (let i=0;i<N;i++){
    const a0 = i/N*TAU, a1=(i+1)/N*TAU;
    const p0 = v3(Math.cos(a0)*radius*.82, Math.sin(a0)*radius*.82, .01);
    const p1 = v3(Math.cos(a1)*radius*.82, Math.sin(a1)*radius*.82, .01);
    const pm = v3(Math.cos((a0+a1)/2)*radius*.55, Math.sin((a0+a1)/2)*radius*.55, .01);
    web.push(p0,pm,pm,p1);
  }
  const webGeo = new THREE.BufferGeometry().setFromPoints(web);
  const webLine = new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({ color:'#ffdda0', transparent:true, opacity:.6, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false }));
  g.add(webLine);
  for (let i=0;i<3;i++){
    const x = -.22 + i*.22;
    const thread = mesh(cyl(.004,.004,.23,3), MAT.brassDeep, { pos:[x,-radius-.12,.01] });
    g.add(thread);
    const feather = mesh(new THREE.ConeGeometry(.035,.15,5), toon(i===1?'#ffd4a2':'#d9c5ff', { side:THREE.DoubleSide }), { pos:[x,-radius-.30,.01] });
    feather.castShadow = false;
    g.add(feather);
  }
  return g;
}

function makeTower() {
  const g = new THREE.Group();
  const { x, z, r } = A.tower;
  g.position.set(x, 0, z);
  const bodyH = A.tower.bodyTop;
  const body = mesh(cyl(r*1.01, r*1.05, bodyH, 16), MAT.plaster, { pos:[0,bodyH/2,0] });
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  inkOutline(body, '#826371', .014, .48);

  // wooden skirt at the bottom
  const skirt = mesh(cyl(r*1.08, r*1.13, .42, 16), MAT.woodDark, { pos:[0,.21,0] });
  g.add(skirt);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(r*1.02,.03,5,36), MAT.brass);
  baseRing.rotation.x = Math.PI/2; baseRing.position.y = .45;
  g.add(baseRing);
  // gold body bands
  for (const yy of [1.25, 2.20, 3.12, 3.88]){
    const band = new THREE.Mesh(new THREE.TorusGeometry(r*1.013,.014,4,36), MAT.brassSoft);
    band.rotation.x = Math.PI/2; band.position.y = yy;
    g.add(band);
  }
  // warm narrow windows around the tower
  for (let side=0; side<4; side++){
    const a = side * Math.PI/2 + Math.PI/4;
    const win = new THREE.Group();
    win.position.set(Math.cos(a)*r*.97, 2.64, Math.sin(a)*r*.97);
    win.rotation.y = Math.PI/2 - a;
    const arch = mesh(rBox(.24,.46,.04,.06), MAT.washi, { pos:[0,0,0] });
    arch.castShadow=false;
    win.add(arch);
    const frame = mesh(rBox(.34,.10,.07,.018), MAT.woodDark, { pos:[0,-.26,.01] });
    win.add(frame);
    const glaze = glowSprite('gold', .28, .2);
    glaze.position.z = .06;
    win.add(glaze);
    g.add(win);
  }

  // dreamcatcher on the front face
  const catcher = makeDreamcatcher(.40);
  catcher.position.set(0, 3.28, r+.04);
  g.add(catcher);
  const catcherGlow = glowSprite('pink', .7, .16);
  catcherGlow.position.set(0,3.28,r+.1);
  g.add(catcherGlow);

  // balcony
  const balY = bodyH;
  const balFloor = mesh(cyl(r*1.34, r*1.28, .12, 20), MAT.deck, { pos:[0,balY,0] });
  g.add(balFloor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r*1.3,.028,5,30), MAT.brass);
  ring.rotation.x = Math.PI/2; ring.position.y = balY+.075;
  g.add(ring);
  for (let i=0;i<10;i++){
    const a = i/10*TAU;
    const post = mesh(cyl(.018,.022,.34,5), MAT.wood, { pos:[Math.cos(a)*r*1.24,balY+.26,Math.sin(a)*r*1.24] });
    g.add(post);
  }
  const balRail = new THREE.Mesh(new THREE.TorusGeometry(r*1.24,.028,5,36), MAT.wood);
  balRail.rotation.x=Math.PI/2; balRail.position.y=balY+.43;
  g.add(balRail);

  // lantern room — glass with a sleeping light inside
  const lanH = A.tower.lanternTop - A.tower.bodyTop - .1;
  const lanBaseY = balY + .07;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color:'#fff2dc', transparent:true, opacity:.17, roughness:.04, metalness:0,
    clearcoat:1, clearcoatRoughness:.05, side:THREE.DoubleSide, depthWrite:false, envMapIntensity:1.5,
  });
  const lantern = mesh(cyl(r*.87, r*.90, lanH, 12, 1, true), glassMat, { pos:[0,lanBaseY+lanH/2,0] });
  lantern.castShadow=false;
  g.add(lantern);
  for (let i=0;i<8;i++){
    const a = i/8*TAU;
    const post = mesh(cyl(.022,.025,lanH,6), MAT.brassDeep, { pos:[Math.cos(a)*r*.91, lanBaseY+lanH/2, Math.sin(a)*r*.91] });
    g.add(post);
  }
  for (const yy of [lanBaseY, lanBaseY+lanH]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r*.92,.026,5,30), MAT.brass);
    rim.rotation.x=Math.PI/2; rim.position.y=yy;
    g.add(rim);
  }
  const lanternCatcher = makeDreamcatcher(.36);
  lanternCatcher.position.set(.02, lanBaseY + lanH*.72, r*.91);
  lanternCatcher.scale.setScalar(.92);
  g.add(lanternCatcher);
  const catcherGlow2 = glowSprite('gold', 1.4, .16);
  catcherGlow2.position.set(.02, lanBaseY + lanH*.72, r*.95);
  g.add(catcherGlow2);
  const dreamOrb = mesh(new THREE.SphereGeometry(.19, 24, 16), glow('#ffdca8',1.2));
  dreamOrb.position.y = lanBaseY+lanH*.52;
  dreamOrb.castShadow=false;
  g.add(dreamOrb);
  const innerMoon = crescentMesh(.13,.023);
  innerMoon.position.set(0, lanBaseY+lanH*.52, .24);
  innerMoon.castShadow=false;
  g.add(innerMoon);
  const halo = glowSprite('gold', 2.8, .38);
  halo.position.y = lanBaseY+lanH*.52;
  g.add(halo);
  const light = new THREE.PointLight('#ffc58b', 3.2, 4.2, 2);
  light.position.y = lanBaseY+lanH*.5;
  g.add(light);

  // pink conical cap with a gilded spiral
  const coneBase = A.tower.lanternTop - .02;
  const coneH = A.tower.coneTop - coneBase;
  const cone = mesh(new THREE.ConeGeometry(r*1.42, coneH, 18, 1, false), MAT.roof, { pos:[0,coneBase+coneH/2,0] });
  cone.castShadow=true; cone.receiveShadow=true;
  g.add(cone);
  for (let i=0;i<5;i++){
    const a = i/5*TAU;
    const eave = mesh(ico(.07,1), MAT.cloudPink, { pos:[Math.cos(a)*r*1.4,coneBase+.01,Math.sin(a)*r*1.4], scale:[1.2,.45,.8] });
    g.add(eave);
  }
  const eaveRing = new THREE.Mesh(new THREE.TorusGeometry(r*1.42,.028,5,36), MAT.brass);
  eaveRing.rotation.x=Math.PI/2; eaveRing.position.y=coneBase+.015;
  g.add(eaveRing);
  // a gold ribbon coils around the lantern roof
  const helixPts = [];
  for (let i=0;i<=30;i++){
    const t = i/30;
    const a = t * Math.PI*3.2;
    const rr = r*1.38*(1-t*.96);
    helixPts.push(v3(Math.cos(a)*rr, coneBase + t*coneH + .02, Math.sin(a)*rr));
  }
  const helix = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 80, .012, 4, false), MAT.brassSoft);
  g.add(helix);
  const finial = mesh(cyl(.018,.018,.25,6), MAT.brass, { pos:[0,A.tower.coneTop+.12,0] });
  g.add(finial);
  const tipBall = mesh(ico(.055,1), MAT.brass, { pos:[0,A.tower.coneTop+.26,0] });
  g.add(tipBall);

  // weather vane: moon, stars, a tiny arrow
  const vane = new THREE.Group();
  vane.position.y = A.tower.coneTop + .27;
  const spindle = mesh(cyl(.016,.022,.68,6), MAT.brass, { pos:[0,.34,0] });
  vane.add(spindle);
  const cross = mesh(rBox(.82,.025,.025,.008), MAT.brassDeep, { pos:[0,.50,0] });
  vane.add(cross);
  const arrowTip = mesh(new THREE.ConeGeometry(.045,.16,4), MAT.brass, { pos:[.47,.50,0], rot:[0,0,-Math.PI/2] });
  vane.add(arrowTip);
  const arrowFeather = mesh(rBox(.13,.10,.016,.01), MAT.brassSoft, { pos:[-.42,.50,0], rot:[0,0,-.45] });
  vane.add(arrowFeather);
  const moon = crescentMesh(.17,.022,Math.PI*1.3);
  moon.rotation.z = .7; moon.position.set(0,.68,0);
  vane.add(moon);
  for (let i=0;i<3;i++){
    const s = starMesh(.045+i*.012, .012, '#ffe6a6');
    s.position.set(Math.cos(i*2.1)*.34, .56+Math.sin(i)*.1, Math.sin(i*2.1)*.06);
    vane.add(s);
  }
  // tiny dangling crystal
  const thread = mesh(cyl(.004,.004,.20,3), MAT.brassDeep, { pos:[-.22,.38,0] });
  vane.add(thread);
  const bead = mesh(ico(.045,1), JELLY.lilac, { pos:[-.22,.26,0] });
  bead.castShadow=false; vane.add(bead);
  g.add(vane);
  g.userData.vane = vane;
  g.userData.halo = halo;
  return g;
}

// ── warm little lights & banners──────────────────────────────
function makePorchLantern(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x,y,z);
  const rope = mesh(cyl(.008,.008,.34,4), MAT.brassDeep, { pos:[0,.17,0] });
  g.add(rope);
  const cap = mesh(new THREE.ConeGeometry(.17,.12,8), MAT.brassDeep, { pos:[0,-.01,0] });
  g.add(cap);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.12,.10,.24,8,1,true), new THREE.MeshPhysicalMaterial({
    color:'#ffe9c8', transparent:true, opacity:.33, roughness:.08, clearcoat:1, side:THREE.DoubleSide, depthWrite:false
  }));
  glass.position.y=-.14;
  g.add(glass);
  const frame = mesh(rBox(.03,.25,.03,.006), MAT.brass, { pos:[.11,-.14,0] });
  g.add(frame);
  const flame = mesh(ico(.06,2), glow('#ffd59b', 1.8), { pos:[0,-.14,0] });
  flame.castShadow=false;
  g.add(flame);
  const halo = glowSprite('gold', 1.15, .32);
  halo.position.y=-.14; g.add(halo);
  g.userData = { phase: x*2.3, baseRot: .04 };
  return g;
}

function makeFairyString() {
  const g = new THREE.Group();
  const points = [];
  for (let i=0;i<=32;i++){
    const u=i/32;
    const x = -2.2 + u*4.4;
    const y = 3.26 - Math.sin(u*Math.PI*2)*.08 - Math.sin(u*Math.PI)*.05;
    points.push(v3(x,y,D/2+.30));
  }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 80, .006, 3, false), new THREE.MeshBasicMaterial({ color:'#795e62', transparent:true, opacity:.5 }));
  g.add(wire);
  const bulbs = [];
  for (let i=2;i<32;i+=3){
    const p = points[i];
    const bulb = mesh(ico(.038,1), glow(i%2?'#ffe0a0':'#ffd1dd', 1.6), { pos:[p.x,p.y-.06,p.z] });
    bulb.castShadow=false;
    g.add(bulb); bulbs.push(bulb);
    const halo = glowSprite(i%2?'gold':'pink', .26, .12);
    halo.position.copy(bulb.position);
    g.add(halo);
  }
  return g;
}

function makeDryingRack() {
  const g = new THREE.Group();
  const z = D/2 + .75;
  const y = 3.20;
  // a bamboo pole floating just outside the eaves, tied up with twin cords
  const pole = mesh(cyl(.045,.052,2.9,8), toon('#e8bd84'), {
    pos:[1.85, y, z], rot:[0,0,Math.PI/2]
  });
  g.add(pole);
  for (const x of [.5, 3.2]){
    const cord = mesh(cyl(.008,.008,.82,3), MAT.brassDeep, {
      pos:[x, y+.38, z-.20], rot:[.35,0,0]
    });
    g.add(cord);
  }
  // a couple of dreamy wheel ornaments at the pole ends
  for (const x of [.48, 3.18]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.10,.012,4,16), MAT.brassSoft);
    hoop.position.set(x,y,z); g.add(hoop);
    const star = starMesh(.04,.012,'#ffd98e');
    star.position.set(x,y,z-.03); g.add(star);
  }
  // rings that will hold the silk scarves
  const anchors = [];
  const xs = [1.02, 1.5, 2.0, 2.47, 2.93];
  const palettes = [
    ['#ffcf9a','#ff81a7','#a787ff'],
    ['#82e5da','#8db5ff','#d0a6ff'],
    ['#ffd28e','#ff9fcf','#ffc09b'],
    ['#b798ff','#74d6ef','#ffbc96'],
    ['#ffd77e','#7de0bd','#b393ff'],
  ];
  const lengths = [5.9, 6.6, 7.1, 6.8, 6.05];
  xs.forEach((x,i)=>{
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.036,.008,4,12), MAT.brass);
    ring.position.set(x, y-.045, z);
    ring.rotation.x = Math.PI/2;
    g.add(ring);
    anchors.push({ x, y:y-.06, z, width: .36 + (i%3)*.035, length: lengths[i], palette: palettes[i], seed: i*1.7 + .4 });
  });
  return { group: g, anchors };
}

function makeChimesUnderEave() {
  const g = new THREE.Group();
  const glass = JELLY.gold;
  for (let i=0;i<5;i++){
    const x = -1.4 + i*.7;
    const str = mesh(cyl(.004,.004,.35,3), MAT.brassDeep, { pos:[x,3.15,D/2+.35] });
    g.add(str);
    const tube = mesh(cyl(.022,.022,.15,6,1,true), glass, { pos:[x,2.94,D/2+.35] });
    tube.castShadow=false;
    g.add(tube);
    const bead = mesh(ico(.025,1), MAT.brassSoft, { pos:[x,3.04,D/2+.35] });
    g.add(bead);
  }
  return g;
}

function makeDoorWreath() {
  const g = new THREE.Group();
  g.position.set(0, 1.36, D/2 + .22);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.28,.055,7,24), toon('#b9d9b4'));
  g.add(ring);
  const r = rng(166);
  for (let i=0;i<12;i++){
    const a = i/12*TAU;
    const leaf = mesh(ico(.10,1), toon(i%3?'#9fceb0':'#cbe4bc'), {
      pos:[Math.cos(a)*.3,Math.sin(a)*.3,.0], scale:[.9,.35,.75]
    });
    g.add(leaf);
    if (i%2===0) g.add(mesh(ico(.045,1), toon(i%4?'#ffc4d6':'#ffe5b2'), {
      pos:[Math.cos(a)*.32,Math.sin(a)*.32,.06]
    }));
  }
  const moon = crescentMesh(.09,.016,Math.PI*1.2);
  moon.position.z = .1; moon.rotation.z=.9;
  g.add(moon);
  const hanger = mesh(cyl(.008,.008,.35,3), MAT.brassDeep, { pos:[0,.45,0] });
  g.add(hanger);
  return g;
}

// ─────────────────────────────────────────────────────────────
export function createAtelier() {
  const root = new THREE.Group();
  root.name = 'atelier';

  // ── foundation & porch
  const foundation = mesh(rBox(W+.46,.17,D+.42,.05), MAT.woodDark, { pos:[0,-.075,0] });
  foundation.receiveShadow = true; foundation.castShadow = true;
  root.add(foundation);
  const threshold = mesh(rBox(2.1,.13,.55,.04), MAT.wood, { pos:[0,.06,D/2+.28] });
  root.add(threshold);
  for (let i=0;i<2;i++){
    const step = mesh(rBox(1.8+i*.22,.08,.34,.025), MAT.woodWarm, { pos:[0,-.02-i*.07,D/2+.52+i*.20] });
    root.add(step);
  }
  // a little doormat of woven cloud
  const mat = mesh(plane(1.2,.5), new THREE.MeshToonMaterial({ map: TEX.rug, gradientMap: toonRamp, side: THREE.DoubleSide }), {
    pos:[0,.145,D/2+.55], rot:[-Math.PI/2,0,0]
  });
  mat.receiveShadow = true;
  root.add(mat);

  // ── walls
  const lowerFront = makeWallAssembly({
    width: W, height: A.groundH,
    holes: [
      { x: 0, bottom: .10, w: 2.05, h: 1.43 },
      { x: -1.82, bottom: .68, w: .48, h: .63 },
      { x: 1.82, bottom: .68, w: .48, h: .63 },
    ],
    flowers: [{x:-1.82,y:.63,width:.52},{x:1.82,y:.63,width:.46}],
    mullions: [-1.82, 1.82],
  });
  lowerFront.group.position.set(0,A.groundBase,D/2);
  root.add(lowerFront.group);

  const lowerBack = makeWallAssembly({
    width: W, height: A.groundH,
    holes: [
      { x: 0, bottom: .48, w: 1.35, h: .96 },
      { x: -1.55, bottom: .68, w: .48, h: .63 },
      { x: 1.55, bottom: .68, w: .48, h: .63 },
    ],
    flowers: [{x:-1.55,y:.63,width:.45},{x:1.55,y:.63,width:.45}],
    mullions: [0, -1.55, 1.55],
  });
  lowerBack.group.position.set(0,A.groundBase,-D/2);
  lowerBack.group.rotation.y = Math.PI;
  root.add(lowerBack.group);

  const lowerRight = makeWallAssembly({
    width: D, height: A.groundH,
    holes: [
      { x: 0, bottom: .16, w: 1.52, h: 1.2 },
      { x: -1.35, bottom: .70, w: .44, h: .60 },
      { x: 1.35, bottom: .70, w: .44, h: .60 },
    ],
    flowers: [{x:-1.35,y:.65,width:.4},{x:1.35,y:.65,width:.4}],
    mullions: [0, -1.35, 1.35],
  });
  lowerRight.group.position.set(W/2,A.groundBase,0);
  lowerRight.group.rotation.y = Math.PI/2;
  root.add(lowerRight.group);

  const lowerLeft = makeWallAssembly({
    width: D, height: A.groundH,
    holes: [
      { x: 0, bottom: .16, w: 1.52, h: 1.2 },
      { x: -1.35, bottom: .70, w: .44, h: .60 },
      { x: 1.35, bottom: .70, w: .44, h: .60 },
    ],
    flowers: [{x:-1.35,y:.65,width:.4},{x:1.35,y:.65,width:.4}],
    mullions: [0, -1.35, 1.35],
  });
  lowerLeft.group.position.set(-W/2,A.groundBase,0);
  lowerLeft.group.rotation.y = -Math.PI/2;
  root.add(lowerLeft.group);

  const upperBack = makeWallAssembly({
    width: W, height: A.upperH,
    holes: [
      { x: 0, bottom: .12, w: 1.4, h: 1.01 },
      { x: -1.58, bottom: .40, w: .53, h: .68 },
      { x: 1.58, bottom: .40, w: .53, h: .68 },
    ],
    flowers: [{x:-1.58,y:.36,width:.48},{x:1.58,y:.36,width:.48}],
    mullions: [0, -1.58, 1.58],
    noBackBraces: true,
  });
  upperBack.group.position.set(0,A.upperWallBase,-D/2);
  upperBack.group.rotation.y = Math.PI;
  root.add(upperBack.group);

  const upperRight = makeWallAssembly({
    width: D, height: A.upperH,
    holes: [
      { x: 0, bottom: .08, w: 1.42, h: 1.08 },
      { x: -1.34, bottom: .38, w: .45, h: .63 },
      { x: 1.34, bottom: .38, w: .45, h: .63 },
    ],
    flowers: [{x:-1.34,y:.33,width:.42},{x:1.34,y:.33,width:.42}],
    mullions: [0, -1.34, 1.34],
  });
  upperRight.group.position.set(W/2,A.upperWallBase,0);
  upperRight.group.rotation.y = Math.PI/2;
  root.add(upperRight.group);

  const upperLeft = makeWallAssembly({
    width: D, height: A.upperH,
    holes: [
      { x: 0, bottom: .08, w: 1.42, h: 1.08 },
      { x: -1.34, bottom: .38, w: .45, h: .63 },
      { x: 1.34, bottom: .38, w: .45, h: .63 },
    ],
    flowers: [{x:-1.34,y:.33,width:.42},{x:1.34,y:.33,width:.42}],
    mullions: [0, -1.34, 1.34],
  });
  upperLeft.group.position.set(-W/2,A.upperWallBase,0);
  upperLeft.group.rotation.y = -Math.PI/2;
  root.add(upperLeft.group);

  // front of the loft is open — a balcony floor and rail frame the warm interior.
  const balconyFloor = mesh(rBox(W + .16, .095, .62, .03), MAT.deck, {
    pos: [0, A.upperFloorY - .055, D/2 + .16]
  });
  balconyFloor.receiveShadow = true;
  root.add(balconyFloor);
  const balconyLip = mesh(rBox(W + .24, .09, .11, .025), MAT.woodDark, {
    pos: [0, A.upperFloorY - .055, D/2 + .47]
  });
  root.add(balconyLip);
  root.add(makeBalconyRail());

  // little timber gables close the volume above the side windows
  for (const side of [-1, 1]) {
    const gh = A.ridgeY - A.wallTop + .06;
    const gs = new THREE.Shape();
    gs.moveTo(-D/2, 0);
    gs.quadraticCurveTo(0, -.08, D/2, 0);
    gs.lineTo(0, gh);
    gs.lineTo(-D/2, 0);
    gs.closePath();
    const oculus = new THREE.Path();
    oculus.absarc(0, gh * .38, .22, 0, Math.PI*2, true);
    gs.holes.push(oculus);
    const gg = new THREE.ExtrudeGeometry(gs, { depth: .09, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .02, curveSegments: 18 });
    gg.translate(0, 0, -.045);
    const gm = new THREE.Mesh(gg, MAT.plaster);
    gm.rotation.y = side * Math.PI/2;
    gm.position.set(side * (W/2 - .045), A.wallTop, 0);
    gm.castShadow = true; gm.receiveShadow = true;
    root.add(gm);
    // dark timber edges + dreamcatcher hoop in the oculus
    const edgePts = [v3(side * (W/2 + .015), A.wallTop, -D/2), v3(side * (W/2 + .015), A.wallTop + gh - .03, 0), v3(side * (W/2 + .015), A.wallTop, D/2)];
    const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePts, false, 'catmullrom', .01), 30, .04, 5, false), MAT.woodDark);
    root.add(edge);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.24, .022, 5, 30), MAT.brassSoft);
    hoop.rotation.y = side * Math.PI/2;
    hoop.position.set(side * (W/2 + .006), A.wallTop + gh*.38, 0);
    root.add(hoop);
    const hangingStar = starMesh(.075, .018, '#ffd798');
    hangingStar.rotation.y = side * Math.PI/2;
    hangingStar.position.set(side * (W/2 + .02), A.wallTop + gh*.38, 0);
    root.add(hangingStar);
  }

  // broad chestnut corner posts, binding the two floors
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const post = mesh(rBox(.15,A.wallTop,.15,.03), MAT.woodDark, {
      pos:[sx*(W/2+.01), A.wallTop/2-.02, sz*(D/2+.01)]
    });
    root.add(post);
    inkOutline(post, '#76505e', .012, .5);
    const brace = mesh(rBox(.075,.55,.06,.02), MAT.woodDark, {
      pos:[sx*(W/2-.34), A.slabY+.18, sz*(D/2+.02)], rot:[0,0,sz*sx*.65]
    });
    root.add(brace);
  }
  // floor band, warm and structural
  const floorBand = mesh(rBox(W+.24,.17,D+.24,.035), MAT.woodDark, { pos:[0,A.slabY+.01,0] });
  root.add(floorBand);
  const upperBand = mesh(rBox(W+.15,.11,D+.15,.025), MAT.woodDark, { pos:[0,A.wallTop-.04,0] });
  root.add(upperBand);
  // decorative little brackets under the balcony
  for (let i=0;i<9;i++){
    const x = -2.0 + i*.5;
    const bracket = mesh(rBox(.07,.24,.07,.015), MAT.woodDark, { pos:[x,A.slabY-.16,D/2+.13], rot:[.5,0,0] });
    root.add(bracket);
  }

  // ── doors
  root.add(makeLatticeDoor(-1.02, -1, A.groundBase + .10));
  root.add(makeLatticeDoor(1.02, 1, A.groundBase + .10));
  // central fanlight spokes above the door
  {
    const doorTop = A.groundBase + .10 + 1.43;
    const spring = A.groundBase + .10 + 1.43 - 2.05/2;
    for (let i=0;i<3;i++){
      const a = -1.1 + i*1.1;
      const bar = mesh(rBox(.026,.47,.03,.006), MAT.woodDark, {
        pos:[0,A.groundBase+1.31,D/2+T/2+.04],
        rot:[0,0,a]
      });
      root.add(bar);
    }
    const crest = starMesh(.09,.02,'#ffda8f');
    crest.position.set(0,A.groundBase+1.49,D/2+T/2+.06);
    root.add(crest);
  }
  root.add(makeDoorWreath());

  // ── planters, lanterns, fairy lights
  root.add(makePorchLantern(-1.95,A.groundBase+.92,D/2+.25));
  root.add(makePorchLantern(1.95,A.groundBase+.92,D/2+.25));
  root.add(makeFairyString());
  root.add(makeChimesUnderEave());

  // big leafy pots flanking the entrance
  for (const sx of [-1,1]) {
    const pot = mesh(cyl(.17,.13,.28,14), toon('#e9b59e'), { pos:[sx*1.65,A.groundBase+.14,D/2+.38] });
    pot.castShadow = true; root.add(pot);
    for (let i=0;i<4;i++){
      const leaf = mesh(ico(.11,1), toon(i%2?'#a5d7b6':'#c5e5bd'), {
        pos:[sx*1.65+(i-1.5)*.09, A.groundBase+.34+(i%2)*.12, D/2+.38],
        scale:[.7,.8,.4], rot:[.3,i,.2]
      });
      root.add(leaf);
    }
  }

  // ── interior
  const interior = createInterior();
  root.add(interior.group);

  // ── upper balcony drapes / towels hung on the rail
  for (let i=0;i<2;i++){
    const cloth = new THREE.Mesh(plane(.65,.8,8,10), new THREE.MeshPhysicalMaterial({
      color:['#ffd3dd','#d6c9ff'][i], transparent:true, opacity:.48, roughness:.4, side:THREE.DoubleSide, depthWrite:false,
    }));
    const pos = cloth.geometry.attributes.position;
    for (let j=0;j<pos.count;j++){
      const x=pos.getX(j), y=pos.getY(j);
      pos.setZ(j, Math.sin((x+.4)*7+y*2)*.02);
    }
    cloth.geometry.computeVertexNormals();
    cloth.position.set(-1.68+i*3.35, A.upperFloorY+.02, D/2+.24);
    cloth.rotation.z = .0;
    root.add(cloth);
  }

  // ── roof, chimney & tower
  root.add(makeRoof());
  const tower = makeTower();
  root.add(tower);

  // ── drying rack with silk ribbons
  const rack = makeDryingRack();
  root.add(rack.group);

  // a teeny pair of swallows / fireflies above the chimney corner
  const bokeh = [];
  for (let i=0;i<10;i++){
    const s = glowSprite(i%3?'pink':'gold', .18 + (i%2)*.08, .2);
    s.position.set(-2.2 + (i%5)*.9, A.wallTop + .7 + (i%3)*.6, -1.2 + (i%2)*.8);
    s.userData = { base: s.position.clone(), ph: i*1.1 };
    root.add(s); bokeh.push(s);
  }

  const lanterns = root.children.filter(c => c.isGroup && c.userData?.phase !== undefined && c.userData?.baseRot !== undefined);
  const vane = tower.userData.vane;
  const towerHalo = tower.userData.halo;
  const allChimes = [];

  function update(t) {
    interior.update(t);
    for (const l of lanterns) {
      l.rotation.z = Math.sin(t * .6 + l.userData.phase) * .025;
      l.rotation.x = Math.cos(t * .45 + l.userData.phase) * .018;
    }
    if (vane) {
      vane.rotation.y = Math.sin(t*.18)*.4 + Math.sin(t*.53+2)*.08;
      vane.rotation.z = Math.sin(t*.4)*.02;
    }
    if (towerHalo) {
      const s = 2.8 + Math.sin(t*.7)*.18;
      towerHalo.scale.setScalar(s);
    }
    bokeh.forEach((s,i)=>{
      s.position.x = s.userData.base.x + Math.sin(t*.12+i)*.2;
      s.position.y = s.userData.base.y + Math.cos(t*.16+i)*.15;
      s.material.opacity = .10 + .1*(.5+.5*Math.sin(t*.8+i));
    });
    // the small towels on the balcony flutter
    root.children.forEach(c => {
      if (c.isMesh && c.material?.type === 'MeshPhysicalMaterial' && c.position.z > D/2 + .2 && c.position.y < A.upperFloorY + .2) {
        c.rotation.x = -.18 + Math.sin(t*.45 + c.position.x)*.02;
      }
    });
  }

  return {
    group: root,
    update,
    silkAnchors: rack.anchors,
    interior,
    tower,
  };
}