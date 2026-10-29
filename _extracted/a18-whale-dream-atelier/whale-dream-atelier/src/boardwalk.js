import * as THREE from 'three';
import { P } from './palette.js';
import { rng, v3, mesh, rBox, ico, cyl, plane, TAU, tube } from './lib.js';
import { MAT, TEX, toonRamp, toon, JELLY, brassMaterial, glowSprite } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  A curling boardwalk steps down from the whale's shoulders,
//  ending at a small pier where a winged cloud-boat is moored.
// ─────────────────────────────────────────────────────────────

function featherGeometry(length = 1, width = .16) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-width * .7, .22, -width * .95, length * .68, 0, length);
  s.bezierCurveTo(width * .95, length * .68, width * .7, .22, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: .014, bevelEnabled: false, steps: 1, curveSegments: 14,
  });
  return geo;
}

function makeWing(side) {
  const wing = new THREE.Group();
  wing.position.set(-.05, .32, side * .34);
  wing.rotation.x = side * .33;
  wing.rotation.z = side * -.16;
  wing.rotation.y = side * .06;
  const featherGeo = featherGeometry();
  const cream = toon('#fff4e5', { side: THREE.DoubleSide, emissive: '#ffdcc9', emissiveIntensity: .08 });
  const pink = toon('#ffd4dc', { side: THREE.DoubleSide, emissive: '#ffc2cf', emissiveIntensity: .08 });
  const gold = brassMaterial('#efc57c');
  for (let i=0;i<8;i++){
    const t = i/7;
    const a = -.72 + t * 1.34;
    const len = .62 + Math.sin(t * Math.PI) * .52;
    const f = new THREE.Mesh(featherGeo, i%3===1 ? pink : cream);
    f.rotation.z = a;
    f.scale.set(1, len, 1);
    f.position.z = i * .006;
    f.castShadow = true;
    wing.add(f);
    // a fine gold quill
    const tip = new THREE.Vector3(Math.sin(a) * len, Math.cos(a) * len, .03);
    const quill = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      v3(0,0,.025), v3(tip.x*.5,tip.y*.55,.03), tip
    ]), 10, .006, 3, false), gold);
    wing.add(quill);
  }
  // the little shoulder tuft
  for (let i=0;i<3;i++){
    const f = new THREE.Mesh(featherGeo, cream);
    f.rotation.z = -.2 + i*.22;
    f.scale.set(.7, .34, .7);
    f.position.z = -.015;
    wing.add(f);
  }
  return wing;
}

function boatHullGeometry() {
  const cols = 26, rows = 10;
  const pos = [], idx = [];
  for (let i=0;i<=cols;i++){
    const t = i/cols;
    const x = -1.25 + 2.5*t;
    const halfW = .44 * Math.pow(Math.sin(Math.PI * clamp(t*.94+.03, 0, 1)), .62);
    const top = .20 + .11*Math.sin(Math.PI*t);
    const bottom = -.31 - .16*Math.sin(Math.PI*t);
    for (let j=0;j<=rows;j++){
      const phi = Math.PI * j/rows;
      const z = halfW * Math.cos(phi);
      const y = top - (top-bottom) * Math.pow(Math.sin(phi), .8);
      pos.push(x,y,z);
    }
  }
  for (let i=0;i<cols;i++){
    for (let j=0;j<rows;j++){
      const a = i*(rows+1)+j, b=(i+1)*(rows+1)+j, c=(i+1)*(rows+1)+j+1, d=i*(rows+1)+j+1;
      idx.push(a,b,d,b,c,d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(pos.map((_,i)=>i), 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

function makeBoat() {
  const boat = new THREE.Group();
  boat.position.set(7.35, .69, 5.55);
  boat.rotation.y = 1.08;
  boat.rotation.z = -.035;

  const hullMat = new THREE.MeshToonMaterial({
    color:'#fff0dc', map:TEX.wood, gradientMap:toonRamp, side:THREE.DoubleSide,
  });
  const hull = new THREE.Mesh(boatHullGeometry(), hullMat);
  hull.castShadow = true; hull.receiveShadow = true;
  boat.add(hull);
  // inner dark floor / folded blankets
  const floor = mesh(rBox(1.35,.045,.45,.15), MAT.woodDark, { pos:[0,-.04,0] });
  floor.castShadow=false;
  boat.add(floor);
  const cushion = mesh(rBox(.65,.16,.42,.08), toon('#ffd1dc'), { pos:[-.48,.08,0] });
  boat.add(cushion);
  const cushion2 = mesh(rBox(.55,.11,.4,.06), toon('#d8c8ff'), { pos:[-.55,.2,0] });
  boat.add(cushion2);
  // a little cloud pillow in the bow
  const pillow = mesh(ico(.20,2), toon('#fff8eb'), { pos:[.46,.11,0], scale:[1.1,.4,.85] });
  boat.add(pillow);

  // graceful gunwales and gilt trim
  for (const sz of [-1,1]) {
    const pts = [];
    for (let i=0;i<=20;i++){
      const t=i/20;
      const x = -1.25 + 2.5*t;
      const halfW = .44 * Math.pow(Math.sin(Math.PI * (t*.94+.03)), .62) + .015;
      const top = .20 + .11*Math.sin(Math.PI*t);
      pts.push(v3(x, top, sz*halfW));
    }
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .028, 5), brassMaterial('#d9aa6e'));
    rail.castShadow = true;
    boat.add(rail);
  }
  // seats
  for (const x of [-.35, .38]){
    const seat = mesh(rBox(.28,.06,.72,.02), MAT.wood, { pos:[x,.19,0] });
    boat.add(seat);
  }
  // oars asleep in the boat
  for (let i=0;i<2;i++){
    const oar = mesh(cyl(.018,.024,1.45,7), MAT.wood, {
      pos:[.02,.24 + i*.04,.13 - i*.24], rot:[0,Math.PI/2, Math.PI/2], scale:[1,1,1]
    });
    oar.castShadow = true;
    boat.add(oar);
    const blade = mesh(ico(.11,1), MAT.woodPale, { pos:[.72,.24+i*.04,.13-i*.24], scale:[1.8,.35,.8] });
    boat.add(blade);
  }

  // wings
  const wingR = makeWing(1);
  const wingL = makeWing(-1);
  boat.add(wingR, wingL);

  // bow lantern on a curled stem
  const lantern = new THREE.Group();
  lantern.position.set(1.02,.25,0);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    v3(0,0,0), v3(-.04,.26,.02), v3(.06,.44,.02), v3(.12,.52,.0)
  ]), 12, .018, 5, false), brassMaterial('#efc078'));
  lantern.add(stem);
  const cage = new THREE.Group();
  cage.position.set(.12,.54,0);
  for (let i=0;i<4;i++){
    const a=i/4*TAU;
    const bar = mesh(cyl(.006,.006,.20,4), MAT.brass, { pos:[Math.cos(a)*.06,-.1,Math.sin(a)*.06] });
    cage.add(bar);
  }
  const top = mesh(new THREE.ConeGeometry(.09,.08,8), MAT.brassDeep, { pos:[0,0,0] });
  cage.add(top);
  const bulb = mesh(ico(.055,2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd8a0').multiplyScalar(1.4), toneMapped:false }), { pos:[0,-.06,0] });
  cage.add(bulb);
  const glow = glowSprite('gold', 1.0, .28);
  glow.position.y = -.06;
  cage.add(glow);
  lantern.add(cage);
  boat.add(lantern);

  // curling stern ornament
  const stern = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    v3(-1.2,.19,0), v3(-1.38,.36,.02), v3(-1.32,.58,-.04), v3(-1.16,.68,.03)
  ]), 12, .023, 4, false), brassMaterial('#efc078'));
  boat.add(stern);
  const sternStar = makeStar(.075,.014,'#ffdd92');
  sternStar.position.set(-1.15,.71,.03);
  sternStar.rotation.y = .3;
  boat.add(sternStar);

  // a little cloud living beneath the keel
  for (let i=0;i<4;i++){
    const puff = mesh(ico(.24 + i*.05,2), toon(i%2?'#ffd7dd':'#fff4e7'), {
      pos:[-.5+i*.35,-.38,0], scale:[1.3,.6,1.0]
    });
    puff.castShadow=false;
    boat.add(puff);
  }
  // thin dusting of sparkles at the wings
  for (let i=0;i<8;i++){
    const s = glowSprite(i%2?'pink':'gold', .10+.05*(i%2), .25);
    s.position.set(-.3 + (i/8)*1.0, .8 + Math.sin(i)*.2, .35 + (i%3)*.1);
    boat.add(s);
  }
  return { boat, wingL, wingR, glow };
}

function makeStar(radius=.08, depth=.018, color='#ffd785') {
  const s = new THREE.Shape();
  for (let i=0;i<10;i++){
    const a=i*Math.PI/5-Math.PI/2;
    const r=i%2?radius*.43:radius;
    const x=Math.cos(a)*r, y=Math.sin(a)*r;
    if(i===0)s.moveTo(x,y); else s.lineTo(x,y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.006,bevelThickness:.005,curveSegments:2});
  return new THREE.Mesh(geo, brassMaterial(color));
}

function makeDock() {
  const group = new THREE.Group();
  const center = v3(6.25,.33,4.9);
  const platform = mesh(new THREE.CylinderGeometry(1.0,1.12,.13,24), MAT.deck, { pos:[center.x,center.y,center.z] });
  platform.castShadow = true; platform.receiveShadow = true;
  group.add(platform);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0,.035,5,32), MAT.woodDark);
  rim.rotation.x=Math.PI/2; rim.position.set(center.x,center.y+.07,center.z);
  group.add(rim);
  // posts descending into the cloud water
  for (let i=0;i<4;i++){
    const a = i/4*TAU + .5;
    const post = mesh(cyl(.055,.07,.8,7), MAT.woodDark, {
      pos:[center.x+Math.cos(a)*.7, center.y-.4, center.z+Math.sin(a)*.7]
    });
    group.add(post);
  }
  // small outer railing on the far side
  for (let i=0;i<4;i++){
    const a = .7 + i*.42;
    const post = mesh(cyl(.022,.027,.5,5), MAT.wood, {
      pos:[center.x+Math.cos(a)*.94, center.y+.24, center.z+Math.sin(a)*.94]
    });
    group.add(post);
  }
  const railPts = [];
  for (let i=0;i<=8;i++){
    const a=.7+i/8*1.26;
    railPts.push(v3(center.x+Math.cos(a)*.94,center.y+.49,center.z+Math.sin(a)*.94));
  }
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts),30,.025,4),MAT.woodDark);
  group.add(rail);
  // mooring post
  const moor = mesh(cyl(.065,.085,.92,8), MAT.woodDark, {
    pos:[center.x+.69, center.y+.38, center.z-.1]
  });
  group.add(moor);
  const moorTop = mesh(new THREE.SphereGeometry(.095,10,8), MAT.brass, {
    pos:[center.x+.69,center.y+.86,center.z-.1], scale:[1,.65,1]
  });
  group.add(moorTop);
  // lantern on a pole
  const pole = mesh(cyl(.02,.026,1.0,6), MAT.brassDeep, {
    pos:[center.x-.48, center.y+.46, center.z+.48]
  });
  group.add(pole);
  const lamp = mesh(ico(.12,2), JELLY.gold, { pos:[center.x-.48,center.y+.93,center.z+.48] });
  group.add(lamp);
  const lampCore = mesh(ico(.06,2), new THREE.MeshBasicMaterial({ color:new THREE.Color('#ffcf8b').multiplyScalar(1.5), toneMapped:false }), {
    pos:[center.x-.48,center.y+.93,center.z+.48]
  });
  group.add(lampCore);
  const lg = glowSprite('gold', 1.4, .22);
  lg.position.set(center.x-.48,center.y+.93,center.z+.48);
  group.add(lg);
  // crates & coiled rope
  const crate = mesh(rBox(.35,.24,.3,.03), MAT.wood, { pos:[center.x-.38,center.y+.17,center.z-.25], rot:[0,.4,0] });
  group.add(crate);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(.12,.03,5,18), toon('#d5ae7f'), {
    pos:[center.x-.1,center.y+.12,center.z+.33], rot:[Math.PI/2,0,0]
  });
  group.add(coil);
  // cloud underneath
  for (let i=0;i<5;i++){
    const puff = mesh(ico(.35+i*.04,2), toon(i%2?'#ffe3e0':'#fff4e8'), {
      pos:[center.x+(i%3-.5)*.7,-.07-i*.05,center.z+(i%2-.5)*.55],
      scale:[1.5,.55,1.2]
    });
    group.add(puff);
  }
  group.position.set(0,0,0);
  group.userData.center = center;
  group.userData.moorPos = v3(center.x+.69, center.y+.88, center.z-.1);
  return group;
}

function makeBoardwalk() {
  const group = new THREE.Group();
  group.name = 'sky-boardwalk';
  const curve = new THREE.CatmullRomCurve3([
    v3(2.55,2.74,1.02),
    v3(3.22,2.61,1.62),
    v3(3.92,2.33,2.40),
    v3(4.67,1.86,3.18),
    v3(5.38,1.25,3.86),
    v3(5.96,.62,4.46),
  ]);
  const N = 24;
  const len = curve.getLength();
  const step = len / N;
  const planks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.06,.075,step*.92), MAT.deck, N);
  planks.castShadow = true; planks.receiveShadow = true;
  planks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0,1,0);
  const sideVec = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const positions = [];
  for (let i=0;i<N;i++){
    const t = (i+.5)/N;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tangent);
    sideVec.crossVectors(tangent, up).normalize();
    normal.crossVectors(sideVec, tangent).normalize();
    const m = new THREE.Matrix4();
    m.makeBasis(sideVec, normal, tangent.clone().normalize());
    dummy.position.copy(p).addScaledVector(normal, .035);
    dummy.quaternion.setFromRotationMatrix(m);
    dummy.scale.set(1,1,1);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
    positions.push({ p:p.clone(), side:sideVec.clone(), normal:normal.clone(), t });
  }
  planks.instanceMatrix.needsUpdate = true;
  group.add(planks);

  // two support stringers under the boards
  for (const off of [-.34,.34]){
    const pts = [];
    for (let i=0;i<=20;i++){
      const t=i/20;
      const p=curve.getPointAt(t);
      const tan=curve.getTangentAt(t);
      const side=new THREE.Vector3().crossVectors(tan,up).normalize();
      pts.push(p.clone().addScaledVector(side,off).addScaledVector(up,-.075));
    }
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .045, 5), MAT.woodDark);
    rail.castShadow = true;
    group.add(rail);
  }

  // outer railing with lanterns
  const railSide = .58;
  const postPositions = [];
  for (let i=1;i<N;i+=3){
    const t = i/N;
    const p=curve.getPointAt(t);
    const tan=curve.getTangentAt(t);
    const side=new THREE.Vector3().crossVectors(tan,up).normalize();
    const base = p.clone().addScaledVector(side,railSide);
    const h=.58;
    const post = mesh(rBox(.055,h,.055,.014), MAT.woodDark, {
      pos:[base.x,base.y+h/2,base.z], rot:[0, Math.atan2(tan.x,tan.z), 0]
    });
    group.add(post);
    postPositions.push(base);
    if (i===10 || i===19) {
      const lamp = mesh(ico(.095,2), JELLY.gold, { pos:[base.x,base.y+h+.08,base.z] });
      group.add(lamp);
      const glow = glowSprite('gold', 1.1, .18);
      glow.position.set(base.x,base.y+h+.08,base.z);
      group.add(glow);
    }
  }
  for (const h of [.58,.3]) {
    const pts = [];
    for (let i=0;i<=22;i++){
      const t=i/22;
      const p=curve.getPointAt(t);
      const tan=curve.getTangentAt(t);
      const side=new THREE.Vector3().crossVectors(tan,up).normalize();
      const base=p.clone().addScaledVector(side,railSide).addScaledVector(up,h);
      pts.push(base);
    }
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 50, h>.5?.025:.014, 4), MAT.wood);
    group.add(rail);
  }

  // little drifting cloud supports
  for (let i=0;i<6;i++){
    const t=(i+1)/7;
    const p=curve.getPointAt(t);
    for (let k=0;k<2;k++){
      const puff = mesh(ico(.28 + (i%3)*.1, 2), toon(i%2?'#ffe0dc':'#fff3e9'), {
        pos:[p.x+(k? .25:-.25), p.y-.28-.07*k, p.z+(k? .1:-.2)],
        scale:[1.3,.48,1.1]
      });
      puff.castShadow = false;
      group.add(puff);
    }
  }

  // a welcome post at the top with ribbons
  const top = curve.getPointAt(.03);
  const topPost = mesh(cyl(.035,.045,.5,6), MAT.woodDark, { pos:[top.x-.5,top.y+.25,top.z+.15] });
  group.add(topPost);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.28,.16), new THREE.MeshBasicMaterial({ color:'#ffd0dc', side:THREE.DoubleSide, transparent:true, opacity:.85, toneMapped:false }));
  flag.position.set(top.x-.34,top.y+.43,top.z+.15);
  group.add(flag);

  return { group, curve, positions };
}

export function createDockAndBoat() {
  const group = new THREE.Group();
  group.name = 'cloud-boat-and-boardwalk';
  const walk = makeBoardwalk();
  group.add(walk.group);
  const dock = makeDock();
  group.add(dock);
  const { boat, wingL, wingR, glow } = makeBoat();
  group.add(boat);

  // rope from the dock bollard to the boat's bow
  boat.updateMatrixWorld(true);
  const bow = boat.localToWorld(v3(1.14,.24,0));
  const moor = dock.userData.moorPos;
  const mid = bow.clone().add(moor).multiplyScalar(.5);
  mid.y = Math.min(bow.y, moor.y) - .22;
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    bow, mid, moor
  ]), 24, .012, 4, false), toon('#bf956b'));
  group.add(rope);

  // water rings around the hull
  const rings = [];
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.RingGeometry(.95,1,64), new THREE.MeshBasicMaterial({
      color:'#fff2da', transparent:true, opacity:.14, side:THREE.DoubleSide,
      depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false
    }));
    ring.rotation.x=-Math.PI/2;
    ring.position.set(7.35,.225,5.55);
    ring.scale.set(1.3+i*.26,.65+i*.16,1);
    ring.userData.phase = i*1.3;
    group.add(ring); rings.push(ring);
  }

  const boatBaseY = boat.position.y;
  const baseRotZ = boat.rotation.z;
  const wingBaseL = wingL.rotation.x;
  const wingBaseR = wingR.rotation.x;

  function update(t) {
    boat.position.y = boatBaseY + Math.sin(t*.55)*.025;
    boat.rotation.z = baseRotZ + Math.sin(t*.42)*.009;
    boat.rotation.x = Math.sin(t*.36+1)*.008;
    wingL.rotation.x = wingBaseL + Math.sin(t*.32)*.018;
    wingR.rotation.x = wingBaseR - Math.sin(t*.32+.4)*.018;
    rings.forEach((r,i)=>{
      const u = ((t*.09 + i*.33) % 1);
      r.scale.set(1.15+u*.9, .58+u*.45, 1);
      r.material.opacity = .12 * (1-u);
    });
  }
  return { group, update, boat, dock, walk };
}
