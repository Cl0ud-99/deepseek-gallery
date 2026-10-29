import * as THREE from 'three';
import { P } from './palette.js';
import { rng, v3, mesh, ico, TAU } from './lib.js';
import { toon, toonRamp, JELLY, glowSprite, MAT } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  Tiny wildflowers, grass and dreaming lilies.
//  They soften every edge of the miniature.
// ─────────────────────────────────────────────────────────────

function scatterFlowers() {
  const group = new THREE.Group();
  group.name = 'wildflower-meadow';
  const r = rng(992);

  const grassGeo = new THREE.ConeGeometry(.014, .16, 3);
  grassGeo.translate(0,.08,0);
  const grass = new THREE.InstancedMesh(grassGeo, toon('#a8d8b8'), 90);
  const flowerGeo = new THREE.IcosahedronGeometry(.035, 1);
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshToonMaterial({ color:'#ffffff', gradientMap: toonRamp }), 70);
  const stamens = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.012, 1), MAT.brass, 70);
  const dummy = new THREE.Object3D();
  const flowerCols = ['#ffc3d8','#fff1d0','#d9c5ff','#ffd7a6','#d5f1e4'];
  const fcol = new THREE.Color();

  let gi=0, fi=0;
  function addGrass(x,y,z,s=1,rot=0){
    if (gi>=90) return;
    dummy.position.set(x,y,z);
    dummy.rotation.set((r()-.5)*.2, rot, (r()-.5)*.25);
    dummy.scale.set(.8+r()*.7,s,1);
    dummy.updateMatrix();
    grass.setMatrixAt(gi++, dummy.matrix);
  }
  function addFlower(x,y,z,s=1){
    if (fi>=70) return;
    dummy.position.set(x,y,z);
    dummy.rotation.set(0,r()*TAU,0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    flowers.setMatrixAt(fi, dummy.matrix);
    fcol.set(flowerCols[fi%flowerCols.length]);
    flowers.setColorAt(fi, fcol);
    dummy.position.set(x,y+.005,z);
    dummy.scale.setScalar(.7);
    dummy.updateMatrix();
    stamens.setMatrixAt(fi, dummy.matrix);
    fi++;
  }

  // scatter around the whale-back island edge (the deck is 5.7 × 4.3)
  for (let i=0;i<85;i++){
    const a = r()*TAU;
    const rad = .88 + r()*.10;
    const x = Math.cos(a) * 3.28 * rad;
    const z = Math.sin(a) * 2.58 * rad + .08;
    if (Math.abs(x) < 2.93 && z > -1.98 && z < 2.36) continue;
    addGrass(x, 2.715, z, .6+r()*.65, a);
    if (r()<.64) addFlower(x, 2.84, z, .48+r()*.5);
  }
  // scatter on the wide lower cloud rim
  for (let i=0;i<60;i++){
    const a = r()*TAU;
    const rad = 8.95 + r()*.75;
    const x = Math.cos(a)*rad;
    const z = Math.sin(a)*rad;
    if (Math.abs(x)>9.85 || Math.abs(z)>9.85) continue;
    addGrass(x, .31+r()*.12, z, .45+r()*.4, a);
    if (r()<.5) addFlower(x, .43+r()*.1, z, .32+r()*.4);
  }
  // a few tufts by the atelier steps
  addGrass(-1.26, 2.73, 2.42, .55, .3);
  addGrass(1.46, 2.73, 2.36, .6, -.4);
  addFlower(1.1, 2.87, 2.44, .6);
  addFlower(-.92, 2.86, 2.47, .5);

  grass.instanceMatrix.needsUpdate = true;
  flowers.instanceMatrix.needsUpdate = true;
  stamens.instanceMatrix.needsUpdate = true;
  grass.castShadow = true; flowers.castShadow = true; stamens.castShadow = false;
  grass.frustumCulled = false; flowers.frustumCulled = false; stamens.frustumCulled = false;
  group.add(grass, flowers, stamens);
  return group;
}

function makeLily(x,z,y=.27,scale=1,seed=1){
  const g = new THREE.Group();
  g.position.set(x,y,z);
  g.scale.setScalar(scale);
  const r = rng(seed);
  const leafMat = toon(r()<.5 ? '#a9dfc9' : '#c7e8ce', { side: THREE.DoubleSide });
  for (let i=0;i<3;i++){
    const leaf = mesh(new THREE.CircleGeometry(.24, 16, .22, Math.PI*1.72), leafMat, {
      pos:[i*.17-.17, .006*i, i*.08], rot:[-Math.PI/2,0,r()*TAU]
    });
    leaf.castShadow=false;
    g.add(leaf);
  }
  const flower = new THREE.Group();
  flower.position.y=.035;
  const core = mesh(ico(.05,2), JELLY.gold, { pos:[0,.03,0] });
  flower.add(core);
  for (let i=0;i<6;i++){
    const a=i/6*TAU;
    const petal = mesh(new THREE.SphereGeometry(.075,10,6,0,Math.PI*2,0,Math.PI/2), toon(['#ffe3ec','#fff0d1','#e1d1ff'][i%3]), {
      pos:[Math.cos(a)*.075,0,Math.sin(a)*.075], scale:[1,.42,.65], rot:[.25, -a, .25]
    });
    flower.add(petal);
  }
  const halo = glowSprite('gold', .45, .16);
  halo.position.y=.12;
  flower.add(halo);
  g.add(flower);
  return g;
}

export function createFlora() {
  const group = new THREE.Group();
  group.name = 'flora';
  group.add(scatterFlowers());

  // floating water-lilies & petal-stars on the sky pool
  const lilies = [
    [-6.8, 4.4, .42, 11], [7.5, -3.9, .36, 12], [3.3, 6.4, .32, 13],
    [-3.7, 6.6, .38, 14], [5.2, -5.6, .30, 15], [-7.55, .3, .30, 16],
    [7.55, 2.2, .26, 17], [-5.2, -6.1, .28, 18],
  ];
  for (const [x,z,s,seed] of lilies) group.add(makeLily(x,z,.365,s,seed));

  // tiny petal confetti resting on the pond
  const r = rng(147);
  const petalMat = toon('#ffd6df', { side: THREE.DoubleSide });
  for (let i=0;i<28;i++){
    const a = r()*TAU;
    const rad = 4.6 + r()*3.1;
    const x = Math.cos(a)*rad, z = Math.sin(a)*rad;
    if (Math.abs(x)<3.2 && Math.abs(z)<3.0) continue;
    const petal = mesh(new THREE.CircleGeometry(.05+r()*.06, 7), petalMat, {
      pos:[x,.365,z], rot:[-Math.PI/2,0,r()*TAU], scale:[1.4,.4,1]
    });
    petal.castShadow=false;
    group.add(petal);
  }

  // a few luminous little floating cotton tufts
  const tufts = new THREE.Group();
  for (let i=0;i<8;i++){
    const a = r()*TAU;
    const rad = 9.8 + r()*2.5;
    const tuft = mesh(ico(.20+r()*.28, 2), toon(i%2?'#ffe1e2':'#fff4e9'), {
      pos:[Math.cos(a)*rad, -.35+r()*4.4, Math.sin(a)*rad], scale:[1.3,.5,1]
    });
    tuft.castShadow=false;
    tufts.add(tuft);
  }
  group.add(tufts);
  const tuftBase = tufts.children.map(c=>c.position.clone());

  function update(t){
    tufts.children.forEach((c,i)=>{
      c.position.y = tuftBase[i].y + Math.sin(t*.16 + i*1.8)*.15;
      c.position.x = tuftBase[i].x + Math.cos(t*.11 + i)*.08;
    });
  }
  return { group, update };
}