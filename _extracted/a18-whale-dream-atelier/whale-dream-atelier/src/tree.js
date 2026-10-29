import * as THREE from 'three';
import { P } from './palette.js';
import { rng, v3, mesh, ico, cyl, tube, sphere, inkOutline, TAU, canvasTexture } from './lib.js';
import { MAT, JELLY, GLOW_TEX, toonRamp, toon, brassMaterial, glow, glowSprite } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  The wishing tree, growing out of a small cloud in the sky pond.
//  Hundreds of glass wind chimes live under its cotton canopy.
// ─────────────────────────────────────────────────────────────

function latheMesh(points, mat, seg=20) {
  const geo = new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(p[0],p[1])), seg);
  return new THREE.Mesh(geo, mat);
}

function starGeom(radius=.08, depth=.02) {
  const s = new THREE.Shape();
  for (let i=0;i<10;i++){
    const a = i*Math.PI/5 - Math.PI/2;
    const r = i%2 ? radius*.42 : radius;
    const x = Math.cos(a)*r, y = Math.sin(a)*r;
    if (i===0) s.moveTo(x,y); else s.lineTo(x,y);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled:true, bevelSegments:1, steps:1, bevelSize:.008, bevelThickness:.006, curveSegments:2 });
}

export function createWishingTree() {
  const group = new THREE.Group();
  group.name = 'wishing-tree';
  group.position.set(-7.35, .20, 2.15);
  group.scale.setScalar(1.22);
  group.rotation.y = -.2;

  // little cloud-isle
  const r = rng(818);
  const island = new THREE.Group();
  for (let i=0;i<12;i++){
    const a = i/12*TAU;
    const rad = .5 + r()*1.3;
    const puff = mesh(ico(1,2), toon([P.cloudCream,P.cloudPink,P.cloudPeach,P.cloudLilac][i%4]), {
      pos:[Math.cos(a)*rad*.8, .18 + r()*.36, Math.sin(a)*rad*.6],
      scale:[.55+r()*.6, .25+r()*.22, .5+r()*.5], rot:[0,r()*TAU,0]
    });
    island.add(puff);
  }
  const moss = mesh(new THREE.SphereGeometry(1, 24, 12), toon('#b7ddc7', { emissive:'#a4d5b7', emissiveIntensity:.08 }), {
    pos:[0,.56,0], scale:[1.45,.24,1.08]
  });
  moss.receiveShadow = true;
  island.add(moss);
  // little stones and mushrooms
  for (let i=0;i<5;i++){
    const a = r()*TAU, rad = .55 + r()*.65;
    const stone = mesh(ico(.08+r()*.06,1), toon('#e3d2c8'), {
      pos:[Math.cos(a)*rad, .64+r()*.02, Math.sin(a)*rad*.7], scale:[1.3,.45,1]
    });
    island.add(stone);
  }
  for (let i=0;i<4;i++){
    const a = 1+i*1.5;
    const stem = mesh(cyl(.015,.02,.11,5), toon('#fff1dc'), { pos:[Math.cos(a)*.9,.68,Math.sin(a)*.55] });
    island.add(stem);
    const cap = mesh(new THREE.SphereGeometry(.07,10,6,0,TAU,0,Math.PI/2), toon(i%2?'#ffc0d1':'#d9c4ff'), { pos:[Math.cos(a)*.9,.79,Math.sin(a)*.55], scale:[1,.7,1] });
    island.add(cap);
  }
  group.add(island);

  // roots & trunk
  const trunkMat = toon('#8d5b52', { emissive:'#4a2c30', emissiveIntensity:.06 });
  const trunkPts = [
    v3(0,.64,0), v3(-.12,1.15,.08), v3(.06,1.76,-.04), v3(-.16,2.4,.08),
    v3(-.07,3.1,-.06), v3(.16,3.7,.02), v3(.2,4.38,-.02)
  ];
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkPts), 32, .16, 8, false), trunkMat);
  trunk.castShadow = true; trunk.receiveShadow = true;
  group.add(trunk);
  // taper using a second thinner sleeve near the top
  const topTrunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(.12,3.25,-.03),v3(.22,3.85,.05),v3(.18,4.48,-.03)]), 16, .085, 6, false), matWood2());
  group.add(topTrunk);
  inkOutline(trunk, '#5d3e43', .012, .4);

  for (let i=0;i<5;i++){
    const a = i/5*TAU + .2;
    const rootEnd = v3(Math.cos(a)*.8, .60, Math.sin(a)*.55);
    const root = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      v3(0,.72,0), v3(Math.cos(a)*.35,.68,Math.sin(a)*.2), rootEnd
    ]), 12, .055, 5, false), trunkMat);
    group.add(root);
  }
  const branchDefs = [
    { pts:[v3(-.1,3.15,0),v3(-.7,3.55,-.2),v3(-1.4,3.95,-.45),v3(-2.0,4.15,-.2)], r:.07 },
    { pts:[v3(.12,3.5,0),v3(.8,3.65,.2),v3(1.55,4.08,.1),v3(1.9,4.45,.5)], r:.065 },
    { pts:[v3(-.03,3.85,0),v3(-.2,4.25,-.6),v3(-.7,4.55,-.95),v3(-1.1,4.65,-.9)], r:.055 },
    { pts:[v3(.18,4.03,0),v3(.4,4.4,.55),v3(.1,4.8,.95),v3(-.4,5.12,.8)], r:.05 },
    { pts:[v3(-.1,4.2,0),v3(-.5,4.55,.35),v3(-.9,4.9,.25),v3(-1.15,5.1,-.2)], r:.04 },
  ];
  for (const b of branchDefs) {
    const branch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(b.pts), 20, b.r, 6, false), trunkMat);
    branch.castShadow = true;
    group.add(branch);
    // twig
    const tip = b.pts[b.pts.length-1];
    const twig = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      tip, tip.clone().add(v3(.18,.32,.22)), tip.clone().add(v3(.05,.55,.34))
    ]), 10, b.r*.35, 4, false), trunkMat);
    group.add(twig);
  }
  // pale bark contours
  for (let i=0;i<3;i++){
    const pts = [];
    for (let j=0;j<=18;j++){
      const t = j/18;
      const base = new THREE.CatmullRomCurve3(trunkPts).getPointAt(t*.8);
      pts.push(base.add(v3(Math.cos(i*2.1+t*4)*.16, 0, Math.sin(i*2.1+t*4)*.16)));
    }
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .009, 3), new THREE.MeshBasicMaterial({ color:'#e6b999', transparent:true, opacity:.35, toneMapped:false, depthWrite:false }));
    group.add(line);
  }

  // cotton-canopy
  const canopy = new THREE.Group();
  const clusters = [
    [-1.5,4.35,-.4,1.05],[-.8,4.65,-.75,.9],[.25,4.7,-.45,.92],[1.3,4.45,.2,1.0],[1.75,4.7,.5,.65],
    [-1.8,4.8,.2,.72],[-.9,5.0,.2,.8],[.35,5.15,.35,.82],[-.3,5.05,-.95,.68],[1.05,4.95,-.7,.6],
    [-1.2,4.3,.6,.8],[.9,4.1,.6,.66],[-2.1,4.25,.1,.55],
  ];
  for (let i=0;i<clusters.length;i++){
    const [x,y,z,s] = clusters[i];
    const mat = toon([P.cloudLilac,P.cloudPink,P.cloudPeach,P.cloudCream,P.cloudMint][i%5], {
      emissive: i%2?'#ffc9e1':'#d9c8ff', emissiveIntensity:.08
    });
    const puffs = 3 + Math.floor(r()*3);
    for (let k=0;k<puffs;k++){
      const puff = mesh(ico(1,2), mat, {
        pos:[x+(r()-.5)*s*1.4, y+(r()-.5)*s*.55, z+(r()-.5)*s*.9],
        scale:[s*(.55+r()*.6), s*(.38+r()*.35), s*(.55+r()*.5)],
        rot:[r()*.2, r()*TAU, r()*.2]
      });
      puff.castShadow = true; puff.receiveShadow = true;
      canopy.add(puff);
    }
  }
  // mint and celestial blossoms peeking through
  for (let i=0;i<18;i++){
    const a = r()*TAU, rad = .5 + r()*1.6;
    const blossom = mesh(ico(.04+r()*.05,1), toon(i%4===0?'#ffe4a5':i%3===0?'#ffc6da':'#fff2e4'), {
      pos:[Math.cos(a)*rad, 4.1+r()*1.15, Math.sin(a)*rad*.65]
    });
    blossom.castShadow=false;
    canopy.add(blossom);
  }
  group.add(canopy);

  // a few warm lanterns and star charms inside the tree
  const canopyGlows = [];
  for (let i=0;i<7;i++){
    const s = glowSprite(i%2?'gold':'pink', .22+r()*.18, .22);
    s.position.set((r()-.5)*2.8, 3.9+r()*.95, (r()-.5)*1.4);
    canopy.add(s); canopyGlows.push({ sprite:s, base:s.position.clone(), phase:r()*TAU });
  }
  const treeLight = new THREE.PointLight('#ffca9a', 2.6, 4.5, 2);
  treeLight.position.set(-.1, 3.9, .1);
  group.add(treeLight);

  // hanging gold star ornaments
  for (let i=0;i<4;i++){
    const top = v3(-1.2 + i*.8, 4.15 - (i%2)*.25, .75 + (i%2)*.25);
    const thread = mesh(cyl(.004,.004,.32,3), MAT.brassDeep, { pos:[top.x,top.y-.16,top.z] });
    group.add(thread);
    const star = new THREE.Mesh(starGeom(.075,.015), brassMaterial('#ffd68c'));
    star.position.set(top.x, top.y-.35, top.z);
    star.rotation.y = i*.6;
    group.add(star);
  }

  // glass wind chimes — instanced, so we can afford "countless"
  const chimes = [];
  const N = 38;
  for (let i=0;i<N;i++){
    const a = r()*TAU;
    const rad = .45 + r()*2.05;
    const top = v3(Math.cos(a)*rad, 3.0 + r()*1.55, Math.sin(a)*rad*.68);
    const len = .26 + r()*.58;
    const glen = .14 + r()*.22;
    chimes.push({
      top, len, glen,
      phase: r()*TAU,
      amp: .09 + r()*.08,
      color: [P.dyeRose, P.dyeLilac, P.dyeGold, P.dyeSky, '#fff0d0'][i%5],
      spin: (r()-.5)*.4,
    });
  }
  const threadGeo = new THREE.CylinderGeometry(.0028,.0028,1,3);
  const threadMat = new THREE.MeshBasicMaterial({ color:'#f8dcae', transparent:true, opacity:.55, toneMapped:false, depthWrite:false });
  const threads = new THREE.InstancedMesh(threadGeo, threadMat, N);
  threads.frustumCulled = false;
  threads.castShadow = false;
  const glassGeo = new THREE.CylinderGeometry(.015,.032,1,6,1,true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color:'#ffffff', transparent:true, opacity:.62, roughness:.06, metalness:0,
    clearcoat:1, clearcoatRoughness:.06, iridescence:1, iridescenceIOR:1.35,
    iridescenceThicknessRange:[100,700], side:THREE.DoubleSide, depthWrite:false, envMapIntensity:1.7,
  });
  const glassChimes = new THREE.InstancedMesh(glassGeo, glassMat, N);
  glassChimes.frustumCulled = false;
  glassChimes.castShadow = false;
  glassChimes.renderOrder = 8;
  const beadGeo = new THREE.IcosahedronGeometry(.014,1);
  const beads = new THREE.InstancedMesh(beadGeo, MAT.brass, N);
  beads.frustumCulled = false;
  beads.castShadow = false;
  const dummy = new THREE.Object3D();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i=0;i<N;i++){
    glassChimes.setColorAt(i, new THREE.Color(chimes[i].color));
    beads.setColorAt(i, new THREE.Color('#ffd889'));
  }
  group.add(threads, glassChimes, beads);

  // a small warm halo at the trunk
  const trunkGlow = glowSprite('gold', 1.5, .12);
  trunkGlow.position.set(0,.9,0);
  group.add(trunkGlow);

  const flowerPuffs = [];
  for (let i=0;i<6;i++){
    const a = r()*TAU, rad = .6 + r()*.8;
    const b = mesh(ico(.16,1), toon(['#ffc1d5','#fff0dc','#d6c4ff'][i%3]), {
      pos:[Math.cos(a)*rad*.8, .72+r()*.18, Math.sin(a)*rad*.5], scale:[1.2,.5,1]
    });
    island.add(b);
  }

  function update(t) {
    canopy.position.y = Math.sin(t*.23)*.025;
    canopy.rotation.z = Math.sin(t*.17)*.006;
    for (const g of canopyGlows) {
      g.sprite.position.y = g.base.y + Math.sin(t*.6+g.phase)*.06;
      g.sprite.material.opacity = .12 + .13*(.5+.5*Math.sin(t*.9+g.phase));
    }
    // swaying glass chimes
    for (let i=0;i<N;i++) {
      const c = chimes[i];
      const ax = Math.sin(t*.78 + c.phase) * c.amp;
      const az = Math.cos(t*.61 + c.phase*1.3) * c.amp;
      e.set(ax, 0, az);
      q.setFromEuler(e);
      // thread
      dummy.position.copy(c.top).add(new THREE.Vector3(0,-c.len/2,0).applyQuaternion(q));
      dummy.quaternion.copy(q);
      dummy.scale.set(1,c.len,1);
      dummy.updateMatrix();
      threads.setMatrixAt(i,dummy.matrix);
      // glass
      const glassCenter = new THREE.Vector3(0, -c.len - c.glen*.5, 0).applyQuaternion(q).add(c.top);
      dummy.position.copy(glassCenter);
      dummy.quaternion.copy(q);
      dummy.rotateY(t*.18 + c.phase + c.spin);
      dummy.scale.set(1,c.glen,1);
      dummy.updateMatrix();
      glassChimes.setMatrixAt(i,dummy.matrix);
      // bead
      dummy.position.copy(c.top).add(new THREE.Vector3(0,-c.len-.035,0).applyQuaternion(q));
      dummy.quaternion.copy(q);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      beads.setMatrixAt(i,dummy.matrix);
    }
    threads.instanceMatrix.needsUpdate = true;
    glassChimes.instanceMatrix.needsUpdate = true;
    beads.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update, chimes };
}

function matWood2() {
  return toon('#a06d5d', { emissive:'#44232a', emissiveIntensity:.05 });
}