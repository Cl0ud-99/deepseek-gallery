import * as THREE from 'three';
import { P } from './palette.js';
import { A } from './config.js';
import {
  rng, v3, mesh, rBox, ico, sphere, cyl, plane, tube, inkOutline, canvasTexture,
  makeGlowTexture, TAU, rr,
} from './lib.js';
import {
  MAT, TEX, toonRamp, JELLY, DYES, glow, glowSprite, toon, brassMaterial,
  GLOW_TEX, SPRITE_GLOW,
} from './materials.js';

// ─────────────────────────────────────────────────────────────
//  Everything inside the atelier.  Two little floors of soft,
//  handmade clutter, all visible through the open arches.
// ─────────────────────────────────────────────────────────────

const FLOOR = 0.175;

function lathe(points, mat, seg = 28) {
  const p = points.map(([x,y]) => new THREE.Vector2(x,y));
  const g = new THREE.LatheGeometry(p, seg);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function lineSegments(pointsPairs, color, opacity = .5) {
  const pos = [];
  for (const [a,b] of pointsPairs) { pos.push(a.x,a.y,a.z,b.x,b.y,b.z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  return new THREE.LineSegments(g, m);
}

// soft fabrics -------------------------------------------------
const fabricMats = {
  blush: toon('#ffd1d8', { side: THREE.DoubleSide }),
  peach: toon('#ffd4b8', { side: THREE.DoubleSide }),
  lilac: toon('#d9c9ff', { side: THREE.DoubleSide }),
  cream: toon('#fff2dd', { side: THREE.DoubleSide }),
  sky: toon('#cbe9f5', { side: THREE.DoubleSide }),
  mint: toon('#c8e8da', { side: THREE.DoubleSide }),
  gold: toon('#f4d28d', { side: THREE.DoubleSide }),
};

function clothPlane(w, h, mat, opts = {}) {
  const geo = plane(w, h, opts.ws || 12, opts.hs || 12);
  const pos = geo.attributes.position;
  const r = rng(opts.seed || 8);
  for (let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x*7 + y*2)*.014 + Math.sin(y*9)*.01 + (opts.wave ? Math.sin(x*4+opts.wave)*.02 : 0));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = false; m.receiveShadow = true;
  return m;
}

// glass apothecary jar -----------------------------------------
function makeDyeJar(color, liquidColor, scale = 1) {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity: .23, roughness: .06, metalness: 0,
    clearcoat: 1, clearcoatRoughness: .05, iridescence: .7, iridescenceIOR: 1.3,
    envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false,
  });
  const profile = [
    [.10,0], [.22,.035], [.28,.13], [.285,.29], [.25,.43],
    [.20,.505], [.18,.545], [.17,.56],
  ];
  const jar = lathe(profile, glass);
  jar.scale.setScalar(scale);
  jar.castShadow = false;
  g.add(jar);
  const liquidProfile = [[.005,.035],[.19,.045],[.245,.13],[.25,.28],[.225,.39],[.19,.44],[.005,.44]];
  const liquidMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(liquidColor).multiplyScalar(1.12),
    transparent: true, opacity: .82, depthWrite: false, toneMapped: false,
  });
  const liquid = lathe(liquidProfile, liquidMat);
  liquid.scale.setScalar(scale);
  liquid.renderOrder = 1;
  g.add(liquid);

  const base = mesh(cyl(.22*scale, .27*scale, .06*scale, 20), MAT.woodDark, { pos:[0,.03*scale,0] });
  base.castShadow = true;
  g.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.18*scale, .015*scale, 5, 22), MAT.brass);
  rim.rotation.x = Math.PI/2;
  rim.position.y = .56*scale;
  g.add(rim);
  const lid = mesh(new THREE.SphereGeometry(.18*scale, 18, 8, 0, TAU, 0, Math.PI*.32), MAT.brassSoft, { pos:[0,.56*scale,0] });
  lid.scale.y = .45;
  g.add(lid);

  // a ribbon of dye spiralling inside, plus tiny suspended motes
  const spiral = [];
  for (let i=0;i<=32;i++){
    const u = i/32, a = u * Math.PI * 5;
    const rad = .18 * scale * (1-u*.5);
    spiral.push(v3(Math.cos(a)*rad, (.06 + u*.35)*scale, Math.sin(a)*rad));
  }
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 40, .008*scale, 3, false), glow('#fff5d8', 1.1, .6));
  ribbon.renderOrder = 2;
  g.add(ribbon);
  for (let i=0;i<7;i++){
    const a = i*2.1 + .8;
    const mote = glowSprite('gold', .06*scale + .015, .22);
    mote.position.set(Math.cos(a)*.14*scale, (.15 + i*.035)*scale, Math.sin(a)*.14*scale);
    g.add(mote);
  }
  const halo = glowSprite(color === '#ffb4d1' ? 'pink' : 'gold', .7*scale, .14);
  halo.position.y = .3*scale;
  g.add(halo);
  return g;
}

// the magical loom --------------------------------------------
function makeLoom() {
  const group = new THREE.Group();
  group.position.set(.56, FLOOR + .03, -.50);
  const wood = MAT.woodWarm, dark = MAT.woodDark;
  const w = 1.35, d = .74, h = 1.43;
  const postGeo = rBox(.075, h, .075, .022);
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const p = mesh(postGeo, dark, { pos:[sx*w/2, h/2, sz*d/2] });
    p.castShadow = true; group.add(p);
  }
  // heavy base
  const base = mesh(rBox(w+.2, .11, d+.16, .035), wood, { pos:[0,.07,0] });
  group.add(base);
  const topBar = mesh(rBox(w+.1, .10, .10, .03), wood, { pos:[0,h-.02,0] });
  group.add(topBar);
  const crossBar = mesh(rBox(w+.08, .055, .055, .02), dark, { pos:[0,1.19,-.22] });
  group.add(crossBar);
  const frontRoller = mesh(cyl(.065,.065,w,12), wood, { pos:[0,.70,.32], rot:[0,0,Math.PI/2] });
  group.add(frontRoller);

  // the woven cloth — a little galaxy spilling off the loom
  const cloth = new THREE.Mesh(plane(1.06, .66, 10, 14), MAT.starCloth);
  const pos = cloth.geometry.attributes.position;
  for (let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin((x+.5)*8 + y*2)*.025 + Math.sin(y*7)*.012);
  }
  cloth.geometry.computeVertexNormals();
  cloth.position.set(0, .76, .345);
  cloth.castShadow = false;
  group.add(cloth);
  const fringe = [];
  for (let i=0;i<11;i++){
    const x = -.48 + i*.096;
    fringe.push(v3(x, .41, .35), v3(x + Math.sin(i)*.01, .34, .35));
  }
  const fringeGeo = new THREE.BufferGeometry();
  const fp = [];
  fringe.forEach(p=>fp.push(p.x,p.y,p.z));
  fringeGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const fringeLines = new THREE.LineSegments(fringeGeo, new THREE.LineBasicMaterial({ color:'#ffe5ad', transparent:true, opacity:.7, toneMapped:false }));
  group.add(fringeLines);
  // tiny stars glide above the cloth
  for (let i=0;i<6;i++){
    const star = glowSprite('gold', .08 + (i%2)*.03, .4);
    star.position.set(-.44 + i*.18, .55 + (i%3)*.15, .42);
    star.userData = { base: star.position.clone(), ph: i*1.5 };
    star.name = 'loomStar';
    group.add(star);
  }

  // warp threads from top bar down to the woven edge
  const threadPairs = [];
  for (let i=0;i<17;i++){
    const x = -w/2 + .08 + i/16*(w-.16);
    threadPairs.push([v3(x, .74, .23), v3(x, 1.36, .03)]);
  }
  group.add(lineSegments(threadPairs, '#ffe7b8', .32));

  // shuttle
  const shuttle = new THREE.Group();
  const sBody = mesh(rBox(.20,.065,.095, .026), toon('#ffdba9'), { pos:[0,0,0] });
  shuttle.add(sBody);
  const sTip1 = mesh(ico(.033, 1), MAT.brass, { pos:[-.11,0,0], scale:[1.2,.7,.9] });
  const sTip2 = mesh(ico(.033, 1), MAT.brass, { pos:[.11,0,0], scale:[1.2,.7,.9] });
  shuttle.add(sTip1, sTip2);
  shuttle.position.set(0, .95, .42);
  group.add(shuttle);

  // heddles
  const heddle = mesh(rBox(w-.1, .035, .035, .012), MAT.brassDeep, { pos:[0,1.04,.10] });
  group.add(heddle);

  // a low stool
  const stool = new THREE.Group();
  const seat = mesh(cyl(.25,.25,.10,20), fabricMats.blush, { pos:[0,.33,.83] });
  stool.add(seat);
  const cushion = mesh(ico(.23, 1), fabricMats.peach, { pos:[0,.43,.83], scale:[1,.35,1] });
  stool.add(cushion);
  for (let i=0;i<3;i++){
    const a = i/3*TAU;
    const leg = mesh(cyl(.035,.045,.32,8), MAT.woodDark, { pos:[Math.cos(a)*.16,.16,.83+Math.sin(a)*.16] });
    stool.add(leg);
  }
  group.add(stool);

  const updates = [];
  const baseHeddle = heddle.position.y;
  function update(t) {
    shuttle.position.x = Math.sin(t * 1.7) * .49;
    shuttle.rotation.z = Math.sin(t * 1.7) * .04;
    heddle.position.y = baseHeddle + Math.sin(t * 3.4) * .018;
    cloth.rotation.z = Math.sin(t * .5) * .004;
    group.children.forEach(c => {
      if (c.name === 'loomStar') {
        c.position.y = c.userData.base.y + Math.sin(t*.7 + c.userData.ph)*.035;
        c.material.opacity = .18 + .18*(.5+.5*Math.sin(t*1.2+c.userData.ph));
      }
    });
  }
  return { group, update };
}

// shelves full of textile treasures ---------------------------
function makeShelves() {
  const group = new THREE.Group();
  group.position.set(-.15, FLOOR, -1.60);
  const W = 1.75, H = 1.52, D = .32;
  const wood = MAT.woodWarm;
  const posts = [
    [-W/2, -D/2], [W/2, -D/2], [-W/2, D/2], [W/2, D/2]
  ];
  for (const [x,z] of posts) {
    const p = mesh(rBox(.065, H, .065, .018), MAT.woodDark, { pos:[x, H/2, z] });
    group.add(p);
  }
  for (let i=0;i<3;i++){
    const y = .35 + i*.47;
    const shelf = mesh(rBox(W, .055, D+.07, .018), wood, { pos:[0,y,0] });
    group.add(shelf);
    const back = mesh(rBox(W, .006, .04, .002), MAT.woodPale, { pos:[0,y+.05,-D/2] });
    back.castShadow = false; group.add(back);
  }
  const r = rng(203);
  const colors = ['#ffb1c5','#ffd092','#b5a5f4','#9eddd5','#ffd9bd','#afc8f3','#f4b4a9','#caedc9'];
  // spools and folded cloth
  for (let row=0; row<3; row++) {
    const baseY = .39 + row*.47;
    for (let i=0;i<5;i++) {
      const x = -W/2 + .18 + i*(W-.36)/4 + (r()-.5)*.05;
      const kind = r();
      const color = colors[Math.floor(r()*colors.length)];
      if (kind < .58) {
        // a little spool
        const spool = new THREE.Group();
        const body = mesh(cyl(.052,.052,.16,10), toon(color), { pos:[0,.11,0] });
        const top = mesh(cyl(.085,.085,.018,12), MAT.woodPale, { pos:[0,.197,0] });
        const bottom = mesh(cyl(.085,.085,.018,12), MAT.woodPale, { pos:[0,.018,0] });
        spool.add(body, top, bottom);
        spool.position.set(x, baseY, .02);
        spool.rotation.z = (r()-.5)*.12;
        group.add(spool);
      } else {
        // a folded bolt / soft package
        const stack = Math.floor(r()*3)+1;
        for (let k=0;k<stack;k++){
          const f = mesh(rBox(.24+r()*.12, .06, .19+r()*.04, .028), toon(color), {
            pos:[x, baseY+.04+k*.063, .02], rot:[0,(r()-.5)*.2,0]
          });
          group.add(f);
        }
      }
    }
  }
  // hanging tools + glowing spindles
  const bar = mesh(cyl(.018,.018,W-.18,7), MAT.brassDeep, { pos:[0,.45,.28], rot:[0,0,Math.PI/2] });
  group.add(bar);
  for (let i=0;i<4;i++){
    const y = .48 - i*.05;
    const drop = mesh(new THREE.ConeGeometry(.035,.15,8), toon(colors[i]), { pos:[-.55+i*.37, .34 - i*.06, .3] });
    group.add(drop);
    const string = mesh(cyl(.004,.004,.12,4), MAT.brassDeep, { pos:[-.55+i*.37, .44 - i*.06, .3] });
    group.add(string);
  }
  // a tiny potted plant on top
  const pot = mesh(cyl(.09,.07,.13,12), toon('#e7b7a4'), { pos:[.65, H+.01, 0] });
  group.add(pot);
  for (let i=0;i<5;i++){
    const leaf = mesh(ico(.06,1), toon('#a8d6b9'), { pos:[.65+(r()-.5)*.15, H+.11+r()*.12, (r()-.5)*.12], scale:[.8,.35,.8] });
    group.add(leaf);
  }
  return group;
}

// brass steam iron + table ------------------------------------
function makeIroningTable() {
  const group = new THREE.Group();
  group.position.set(1.40, FLOOR, .68);
  const tableY = .59;
  const top = mesh(rBox(1.05, .085, .58, .03), MAT.wood, { pos:[0,tableY,0] });
  group.add(top);
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const leg = mesh(cyl(.04,.05,.6,8), MAT.woodDark, { pos:[sx*.42, .3, sz*.23] });
    group.add(leg);
  }
  // soft folded cloud fabric on the table
  const fold1 = mesh(rBox(.55,.11,.37,.055), fabricMats.cream, { pos:[-.19, tableY+.09, .0], rot:[0,.12,0] });
  group.add(fold1);
  const fold2 = mesh(rBox(.4,.08,.29,.045), fabricMats.lilac, { pos:[-.16, tableY+.17, 0], rot:[0,-.06,.03] });
  group.add(fold2);
  // steam iron
  const iron = new THREE.Group();
  iron.position.set(.27, tableY + .105, .02);
  const base = mesh(rBox(.40,.12,.24,.055), brassMaterial('#e5af6c'), { pos:[0,.01,0] });
  base.scale.z = 1;
  iron.add(base);
  const nose = mesh(ico(.09,1), brassMaterial('#edc58f'), { pos:[-.19,.03,0], scale:[1.25,.65,1.1] });
  iron.add(nose);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.12,.022,6,18,Math.PI), MAT.woodDark);
  handle.rotation.y = Math.PI/2;
  handle.rotation.z = Math.PI/2;
  handle.position.y = .16;
  iron.add(handle);
  const dial = mesh(cyl(.028,.028,.02,12), MAT.brass, { pos:[.10,.10,.02], rot:[Math.PI/2,0,0] });
  iron.add(dial);
  group.add(iron);

  // steam puffs
  const steam = [];
  for (let i=0;i<7;i++){
    const sp = glowSprite('peach', .18, .0);
    sp.position.set(.32 + (i%3)*.08, tableY + .22, .02 + (i%2)*.08);
    sp.userData = { phase: i*.8, baseY: tableY + .2, baseX: .32 + (i%3)*.08 };
    group.add(sp); steam.push(sp);
  }
  // pin cushion & scissors
  const pin = mesh(new THREE.SphereGeometry(.075,12,8), fabricMats.blush, { pos:[-.38, tableY+.17, .15] });
  pin.scale.y = .65;
  group.add(pin);
  for (let i=0;i<5;i++){
    const needle = mesh(cyl(.003,.003,.11,4), MAT.brass, { pos:[-.44+i*.028, tableY+.26, .15], rot:[(i%2? .1:-.1), 0, .2] });
    group.add(needle);
  }
  const update = (t) => {
    steam.forEach((sp,i)=>{
      const u = (t*.13 + i/7*.8) % 1;
      sp.position.y = sp.userData.baseY + u*.65;
      sp.position.x = sp.userData.baseX + Math.sin(t*.7+i)*.06 + u*.08;
      sp.material.opacity = .16 * Math.sin(Math.min(1,u)*Math.PI);
      sp.scale.setScalar(.13 + u*.28);
    });
  };
  return { group, update };
}

// a dreamy little bed -----------------------------------------
function makeBed() {
  const group = new THREE.Group();
  group.position.set(-1.10, A.upperFloorY, -.95);
  const frame = mesh(rBox(1.35,.16,1.65,.06), MAT.woodWarm, { pos:[0,.20,0] });
  group.add(frame);
  const footboard = mesh(rBox(1.35,.34,.08,.05), MAT.wood, { pos:[0,.35,.80] });
  group.add(footboard);
  const headboard = mesh(rBox(1.32,.82,.07,.09), MAT.wood, { pos:[0,.52,-.81] });
  const hbTop = mesh(rBox(1.24,.16,.09,.04), MAT.woodPale, { pos:[0,.94,-.81] });
  group.add(headboard, hbTop);
  const mattress = mesh(rBox(1.18,.18,1.46,.08), MAT.cream, { pos:[0,.34,0] });
  group.add(mattress);
  const duvet = mesh(rBox(1.22,.13,1.0,.08), fabricMats.blush, { pos:[0,.47,.26] });
  group.add(duvet);
  const duvet2 = mesh(rBox(1.15,.06,.7,.07), fabricMats.lilac, { pos:[0,.55,.12], rot:[0,.02,0] });
  group.add(duvet2);
  // a cascade of feathery pillows
  const pillows = [
    [-.30,.58,-.56,.36,.20,'#fff0dd'], [.22,.60,-.6,.42,.22,'#ffd4dd'],
    [-.02,.70,-.48,.32,.18,'#e7d8ff'], [.38,.67,-.38,.24,.16,'#ffe3c5'],
    [-.36,.67,-.35,.25,.16,'#ffe7ee'],
  ];
  for (let i=0;i<pillows.length;i++){
    const [x,y,z,w,h,c] = pillows[i];
    const p = mesh(ico(1,2), toon(c), { pos:[x,y,z], scale:[w,h,w*.72], rot:[(i%2? -.15:.12), i*.9, .1] });
    p.castShadow = true;
    group.add(p);
    // tiny buttons
    const button = mesh(ico(.025,1), MAT.brass, { pos:[x,y+.02,z+w*.55] });
    group.add(button);
  }
  // tasselled throw
  for (let i=0;i<12;i++){
    const t = mesh(cyl(.008,.008,.14,4), fabricMats.cream, { pos:[-.55+i*.1,.30,.79], rot:[.35,0,0] });
    group.add(t);
  }
  // dreamcatcher above the pillow cloud
  const catcher = makeDreamcatcher(.28, 1.0);
  catcher.position.set(0,.95,-.77);
  catcher.rotation.x = .06;
  group.add(catcher);
  return group;
}

function makeDreamcatcher(radius=.3, glowIntensity=.8) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .022, 6, 40), brassMaterial('#f4c977'));
  group.add(ring);
  // web
  const N = 12;
  const web = [];
  for (let i=0;i<N;i++){
    const a0 = i/N*TAU, a1 = (i+1)/N*TAU;
    const r0 = radius*.82, r1 = radius*.58;
    const p0 = v3(Math.cos(a0)*r0, Math.sin(a0)*r0, -.006);
    const p1 = v3(Math.cos(a1)*r0, Math.sin(a1)*r0, -.006);
    const p2 = v3(Math.cos((a0+a1)/2)*r0*.7, Math.sin((a0+a1)/2)*r0*.7, -.006);
    web.push(p0,p2,p2,p1);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(web);
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color:'#ffe4a3', transparent:true, opacity:.72, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false }));
  group.add(lines);
  // hanging feathers & crystals
  for (let i=0;i<3;i++){
    const a = -.6 + i*.6;
    const x = Math.sin(a)*radius*.55;
    const thread = mesh(cyl(.004,.004,.18,3), MAT.brassDeep, { pos:[x,-radius-.09,0] });
    group.add(thread);
    const crystal = mesh(new THREE.ConeGeometry(.035,.13,5), JELLY[i===1?'gold':'pink'], { pos:[x,-radius-.24,0] });
    crystal.castShadow = false;
    group.add(crystal);
  }
  const center = glowSprite('gold', radius*1.1, .24*glowIntensity);
  group.add(center);
  return group;
}

// rotating music box ------------------------------------------
function makeMusicBox() {
  const group = new THREE.Group();
  group.position.set(.38, A.upperFloorY, -1.30);
  const table = mesh(rBox(.64,.52,.45,.04), MAT.woodDark, { pos:[0,.26,0] });
  group.add(table);
  const top = mesh(rBox(.70,.06,.52,.02), MAT.wood, { pos:[0,.55,0] });
  group.add(top);
  const box = mesh(rBox(.30,.16,.24,.03), MAT.woodPale, { pos:[0,.66,0] });
  group.add(box);
  const base = mesh(cyl(.17,.19,.04,24), MAT.brass, { pos:[0,.76,0] });
  group.add(base);
  // glass dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.19, 24, 14, 0, TAU, 0, Math.PI/2), new THREE.MeshPhysicalMaterial({
    color:'#f6f0ff', transparent:true, opacity:.25, roughness:.08, clearcoat:1, side:THREE.DoubleSide, depthWrite:false,
  }));
  dome.position.y = .76;
  group.add(dome);
  // spinning star + moon
  const spinner = new THREE.Group();
  spinner.position.y = .79;
  const star = makeStarMesh(.11, .025, '#ffd578');
  star.position.set(.08, .1, 0);
  spinner.add(star);
  const moon = new THREE.Mesh(new THREE.TorusGeometry(.075,.013,5,20,Math.PI*1.35), brassMaterial('#ffe1a3'));
  moon.rotation.z = 1.4;
  moon.position.set(-.07,.06,0);
  spinner.add(moon);
  for (let i=0;i<3;i++){
    const spark = glowSprite('gold', .045, .4);
    const a = i/3*TAU;
    spark.position.set(Math.cos(a)*.12,.1+Math.sin(a)*.05,Math.sin(a)*.09);
    spinner.add(spark);
  }
  group.add(spinner);
  const string = mesh(cyl(.006,.006,.25,4), MAT.brassDeep, { pos:[0,.91,0] });
  group.add(string);
  const notes = [];
  for (let i=0;i<5;i++) {
    const n = makeNoteSprite();
    n.position.set(0,.85,0);
    n.scale.setScalar(.11);
    n.userData = { phase: i*.6, baseX: -.04 + (i%2)*.09, baseZ: (i%3)*.03 };
    group.add(n); notes.push(n);
  }
  const update = (t) => {
    spinner.rotation.y = t * .55;
    spinner.position.y = .79 + Math.sin(t*.8)*.006;
    notes.forEach((n,i)=>{
      const u = (t*.16 + i*.23)%1;
      n.position.set(n.userData.baseX + Math.sin(u*7+i)*.09, .74 + u*.55, n.userData.baseZ + Math.cos(u*4+i)*.05);
      n.material.opacity = Math.sin(u*Math.PI)*.55;
    });
  };
  return { group, update };
}

function makeNoteSprite() {
  const tex = canvasTexture(64,64,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#ffe6a8'; ctx.strokeStyle='#ffe6a8'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.ellipse(24,45,9,6,-.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(32,43); ctx.lineTo(32,14); ctx.quadraticCurveTo(48,20,48,30); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(46,42,7,5,-.2,0,Math.PI*2); ctx.fill();
  });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
}

// collecting-dreams cabinet ----------------------------------
function makeOrbCabinet() {
  const group = new THREE.Group();
  group.position.set(1.43, A.upperFloorY, -1.35);
  const w = .92, h = 1.02, d = .35;
  const caseMesh = mesh(rBox(w,h,d,.035), MAT.woodDark, { pos:[0,h/2,0] });
  group.add(caseMesh);
  // a cut-out front is faked with a dark inset and open shelves
  const insideMat = toon('#5a4157');
  for (let row=0; row<2; row++) {
    const y = .25 + row*.42;
    const inset = mesh(rBox(w-.14,.36,.035,.02), insideMat, { pos:[0,y,-d/2-.012] });
    group.add(inset);
    const shelf = mesh(rBox(w-.08,.04,d-.04,.015), MAT.woodWarm, { pos:[0,y-.19,0] });
    group.add(shelf);
    for (let col=0; col<3; col++) {
      const colors = ['#ff87b6','#ad8aff','#ffd25d','#84dce4','#ffbfd4','#d1b1ff'];
      const colr = colors[(row*3+col)%colors.length];
      const jar = new THREE.Group();
      jar.position.set(-.28 + col*.28, y-.08, 0);
      const orb = mesh(new THREE.SphereGeometry(.085,16,12), glow(colr, 1.05, .95));
      orb.castShadow = false;
      jar.add(orb);
      const glass = mesh(new THREE.SphereGeometry(.115,16,12), JELLY[col%2?'pink':'lilac'], { pos:[0,0,0] });
      glass.castShadow=false;
      jar.add(glass);
      const halo = glowSprite('gold', .33, .18);
      jar.add(halo);
      jar.name = 'dreamOrb';
      jar.userData = { baseY: jar.position.y, phase: col*1.4+row*2.2 };
      group.add(jar);
    }
  }
  // little feet and top crest
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    const foot = mesh(cyl(.035,.045,.1,6), MAT.woodWarm, { pos:[sx*.36,.02,sz*.1] });
    group.add(foot);
  }
  const crest = makeStarMesh(.075,.02,'#ffd27d');
  crest.position.set(0,h+.06,0);
  group.add(crest);
  const update = (t)=>{
    group.children.forEach(c=>{
      if (c.name==='dreamOrb') {
        c.position.y = c.userData.baseY + Math.sin(t*.8+c.userData.phase)*.009;
        c.rotation.y = t*.2 + c.userData.phase;
      }
    });
  };
  return { group, update };
}

function makeStarMesh(radius=.12, depth=.04, color='#ffd27d') {
  const s = new THREE.Shape();
  const spikes = 5, ro = radius, ri = radius*.44;
  for (let i=0;i<spikes*2;i++){
    const a = i*Math.PI/spikes - Math.PI/2;
    const rad = i%2?ri:ro;
    const x = Math.cos(a)*rad, y = Math.sin(a)*rad;
    if (i===0) s.moveTo(x,y); else s.lineTo(x,y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .008, bevelThickness: .008, curveSegments: 2 });
  const m = new THREE.Mesh(geo, brassMaterial(color));
  m.castShadow = true;
  return m;
}

// feather floor lamp ------------------------------------------
function featherShape(length=.38, width=.10) {
  const s = new THREE.Shape();
  s.moveTo(0,0);
  s.bezierCurveTo(-width*.5, .15, -width*.45, length*.8, 0, length);
  s.bezierCurveTo(width*.45, length*.8, width*.5, .15, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth:.018, bevelEnabled:true, bevelSegments:2, steps:1, bevelSize:.012, bevelThickness:.008, curveSegments:14 });
  return g;
}

function makeFeatherLamp() {
  const group = new THREE.Group();
  group.position.set(1.52, A.upperFloorY, .72);
  const base = mesh(cyl(.20,.25,.07,20), MAT.brassDeep, { pos:[0,.04,0] });
  group.add(base);
  const pole = mesh(cyl(.018,.024,1.1,8), MAT.brass, { pos:[0,.58,0] });
  group.add(pole);
  const shade = new THREE.Group();
  shade.position.y = 1.13;
  const core = mesh(ico(.14,2), glow('#ffd6a1', 1.3));
  core.castShadow=false; shade.add(core);
  const r = rng(91);
  for (let i=0;i<16;i++) {
    const a = i/16*TAU;
    const feather = mesh(featherShape(.26+r()*.16,.08+r()*.05), toon(i%3? '#fff2de':'#ffd8df', { side:THREE.DoubleSide }), {
      pos:[Math.cos(a)*.06, -.02, Math.sin(a)*.06],
      rot:[.5+ (r()-.5)*.5, a, -.45 + (r()-.5)*.3],
      scale:[1,1,1]
    });
    feather.castShadow=false;
    shade.add(feather);
  }
  const halo = glowSprite('gold', 1.1, .2);
  shade.add(halo);
  group.add(shade);
  const flex = shade.children.slice(1);
  const update = (t)=>{
    flex.forEach((f,i)=>{ f.rotation.z = -.45 + (i%2?1:-1)*(.32 + Math.sin(t*.5+i)*.025); });
    shade.rotation.y = Math.sin(t*.14)*.08;
  };
  return { group, update };
}

function makePendant(x,z,y,color='#ffcf9c') {
  const group = new THREE.Group();
  group.position.set(x,y,z);
  const wire = mesh(cyl(.006,.006,.36,4), MAT.brassDeep, { pos:[0,-.18,0] });
  group.add(wire);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(.16,20,10,0,TAU,0,Math.PI*.62), new THREE.MeshPhysicalMaterial({
    color:'#ffd9bb', transparent:true, opacity:.5, roughness:.15, clearcoat:1, side:THREE.DoubleSide, depthWrite:false
  }));
  shade.scale.y = .85;
  shade.position.y = -.42;
  group.add(shade);
  const bulb = mesh(ico(.07,2), glow(color,1.5), { pos:[0,-.40,0] });
  bulb.castShadow=false;
  group.add(bulb);
  const halo = glowSprite('gold', .8, .2);
  halo.position.y = -.4;
  group.add(halo);
  return group;
}

// woven rug on each floor -------------------------------------
function makeRug(w,h,x,z,y,seed=1) {
  const geo = new THREE.PlaneGeometry(w,h, 24, 18);
  const pos = geo.attributes.position;
  const r = rng(seed);
  for (let i=0;i<pos.count;i++){
    pos.setZ(i, Math.sin(pos.getX(i)*7+seed)*.008 + Math.cos(pos.getY(i)*8)*.006);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshToonMaterial({ map: TEX.rug, gradientMap: toonRamp, side:THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI/2;
  m.position.set(x,y+.006,z);
  m.receiveShadow = true;
  return m;
}

// old dreamcatcher / tapestry on a wall ----------------------
function makeWallTapestry() {
  const group = new THREE.Group();
  group.position.set(-.15, 1.18, -1.71);
  const cloth = clothPlane(1.0, .75, MAT.starCloth, { ws:10, hs:10, seed:5 });
  cloth.position.y = 0;
  group.add(cloth);
  const rod = mesh(cyl(.035,.035,1.2,8), MAT.brassDeep, { pos:[0,.42,0], rot:[0,0,Math.PI/2] });
  group.add(rod);
  for (let i=0;i<6;i++){
    const t = mesh(cyl(.006,.006,.15,3), fabricMats.cream, { pos:[-.45+i*.18,-.42,0] });
    group.add(t);
  }
  return group;
}

// ladder to the loft ------------------------------------------
function makeLadder() {
  const group = new THREE.Group();
  group.position.set(1.83, FLOOR, -1.05);
  group.rotation.z = -.11;
  for (const x of [-.22,.22]) {
    const rail = mesh(rBox(.06,2.12,.06,.015), MAT.woodDark, { pos:[x,1.04,-.02] });
    group.add(rail);
  }
  for (let i=0;i<7;i++){
    const rung = mesh(cyl(.028,.028,.5,8), MAT.woodWarm, { pos:[0,.35+i*.28,0], rot:[0,0,Math.PI/2] });
    group.add(rung);
  }
  return group;
}

// ─────────────────────────────────────────────────────────────
export function createInterior() {
  const group = new THREE.Group();
  group.name = 'atelier-interior';

  // floors + rugs
  const floorBase = mesh(rBox(4.30,.12,3.38,.04), MAT.woodWarm, { pos:[0,.09,0] });
  floorBase.receiveShadow = true;
  group.add(floorBase);
  const upperFloor = mesh(rBox(4.22,.12,3.24,.04), MAT.wood, { pos:[0,A.upperFloorY-.06,0] });
  upperFloor.receiveShadow = true;
  group.add(upperFloor);
  group.add(makeRug(2.3, 1.75, -.02, .23, FLOOR, 3));
  group.add(makeRug(1.65, 1.1, .45, .32, A.upperFloorY, 7));

  // low ceiling beams
  for (let i=0;i<5;i++){
    const beam = mesh(rBox(4.28,.07,.08,.02), MAT.woodDark, { pos:[0,A.slabY-.01,-1.35 + i*.64] });
    group.add(beam);
  }

  // dye jars — pink, violet, gold
  const jarColors = [
    ['#ffacc8', '#ff75ad'], ['#c4b8ff', '#9b78ff'], ['#ffe0a2', '#ffc94f'],
  ];
  const jarPositions = [[-1.62,-.88],[-1.54,-.15],[-1.43,.60]];
  jarPositions.forEach(([x,z],i)=>{
    const jar = makeDyeJar(jarColors[i][0], jarColors[i][1], .92 + i*.05);
    jar.position.set(x, FLOOR, z);
    group.add(jar);
    // little colored glass plate under each
    const saucer = mesh(cyl(.27,.30,.03,18), MAT.brassSoft, { pos:[x,FLOOR+.015,z] });
    group.add(saucer);
  });

  const loom = makeLoom();
  group.add(loom.group);
  group.add(makeShelves());
  const iron = makeIroningTable();
  group.add(iron.group);
  group.add(makeWallTapestry());
  group.add(makeLadder());

  // small thread basket on the floor
  const basket = mesh(cyl(.17,.22,.22,18), MAT.basket, { pos:[1.78,FLOOR+.11,.12] });
  group.add(basket);
  for (let i=0;i<5;i++){
    const ball = mesh(ico(.07,1), toon(['#ffafc5','#b7a3f2','#ffd085','#9edfd7','#ffd8bd'][i]), {
      pos:[1.78 + (i%2-.5)*.16, FLOOR+.2+Math.floor(i/2)*.055, .12 + (i%3-1)*.12]
    });
    group.add(ball);
  }

  // upper floor pieces
  group.add(makeBed());
  const orbCabinet = makeOrbCabinet();
  group.add(orbCabinet.group);
  const music = makeMusicBox();
  group.add(music.group);
  const lamp = makeFeatherLamp();
  group.add(lamp.group);

  // reading stool & blanket chest beneath the loft window
  const chest = mesh(rBox(.74,.34,.45,.04), MAT.woodDark, { pos:[.52, A.upperFloorY+.17, .96] });
  group.add(chest);
  const chestTop = mesh(rBox(.79,.07,.49,.02), MAT.wood, { pos:[.52, A.upperFloorY+.37, .96] });
  group.add(chestTop);
  const cushion = mesh(ico(.24,2), fabricMats.lilac, { pos:[.52,A.upperFloorY+.46,.96], scale:[1.35,.44,.85] });
  group.add(cushion);

  // small stack of cloud books on the upper rug
  for (let i=0;i<3;i++){
    const b = mesh(rBox(.3,.05,.22,.01), toon(['#ffc9d7','#b6dff0','#ffdfad'][i]), {
      pos:[.94, A.upperFloorY+.03+i*.045, -.25], rot:[0,.2+i*.1,0]
    });
    group.add(b);
  }

  // dreamy pendant lights
  group.add(makePendant(-.25, .15, A.slabY-.02, '#ffca94'));
  group.add(makePendant(.38, -.62, A.upperFloorY+1.12, '#ffd2ad'));

  // warm interior lights
  const warm1 = new THREE.PointLight('#ffc08a', 5.2, 4.3, 2);
  warm1.position.set(-.2, .95, .1);
  group.add(warm1);
  const warm2 = new THREE.PointLight('#ffd0a4', 3.6, 3.3, 2);
  warm2.position.set(.2, A.upperFloorY+.9, -.15);
  group.add(warm2);
  const dyeLight = new THREE.PointLight('#ff8ebf', 1.3, 2.2, 2);
  dyeLight.position.set(-1.5, .45, -.3);
  group.add(dyeLight);
  const orbLight = new THREE.PointLight('#c9b5ff', 1.0, 1.8, 2);
  orbLight.position.set(1.35, A.upperFloorY+.7, -.9);
  group.add(orbLight);

  const pendants = group.children.filter(c => c.isGroup && c.children[0]?.geometry?.type === 'CylinderGeometry');
  const initialChest = chest.position.clone();

  function update(t) {
    loom.update(t);
    iron.update(t);
    music.update(t);
    lamp.update(t);
    orbCabinet.update(t);
    // animate any nested updaters
    group.children.forEach(c => {
      if (c.isGroup && c.userData && c.userData.update) c.userData.update(t);
    });
    // the pendant lamps breathe a little
    group.children.forEach((c)=>{
      if (c.isGroup && c.children.length && c.children[0].geometry?.type === 'CylinderGeometry' && c.children.some(x=>x.material?.type === 'MeshPhysicalMaterial')) {
        c.rotation.z = Math.sin(t*.42 + c.position.x)*.026;
        c.rotation.x = Math.cos(t*.36 + c.position.z)*.018;
      }
    });
    // keep the dream-orbs breathing
    group.traverse(o=>{
      if (o.name === 'dreamOrb') {
        o.position.y = o.userData.baseY + Math.sin(t*.8+o.userData.phase)*.009;
        o.rotation.y = t*.2 + o.userData.phase;
      }
    });
    // music box notes shimmer
    // (handled by its own update)
  }

  // expose updates for subcomponents whose update wasn't attached before
  const orbCab = group.children.find(c => c.type === 'Group' && c.children.some(x => x.name === 'dreamOrb'));
  const orbUpdate = null;

  return { group, update };
}