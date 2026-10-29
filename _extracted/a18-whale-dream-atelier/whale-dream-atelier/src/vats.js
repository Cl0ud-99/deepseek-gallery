import * as THREE from 'three';
import { P } from './palette.js';
import { rng, v3, mesh, rBox, ico, cyl, TAU } from './lib.js';
import { MAT, TEX, toonRamp, toon, JELLY, brassMaterial, glow, glowSprite, GLOW_TEX } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  Cloud dye vats and rattan cotton baskets on the whale deck.
// ─────────────────────────────────────────────────────────────

const liquidVert = `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position,1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const liquidFrag = `
  uniform float uTime;
  uniform vec3 uA,uB,uC;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main(){
    vec2 p = vUv - .5;
    float r = length(p);
    float ang = atan(p.y,p.x);
    float swirl = sin(ang*3.0 + r*22.0 - uTime*.7) * .5 + .5;
    float swirl2 = sin(ang*5.0 - r*16.0 + uTime*.42) * .5 + .5;
    vec3 col = mix(uA,uB, swirl*.7 + .05);
    col = mix(col,uC, smoothstep(.65,1.0,swirl2)*.65);
    col += uC * .07;
    // broad creamy reflections
    float shine = smoothstep(.55,.9, swirl2) * smoothstep(.0,.35,.42-r);
    col += vec3(1.0,.94,.82) * shine * .25;
    // golden bubble flowers
    float fleck = smoothstep(.92,1.0, sin(ang*12.0 + r*70.0 - uTime*1.8)*.5+.5)
               * smoothstep(.0,.28,.44-r);
    col += vec3(1.0,.92,.72)*fleck*.7;
    // darkened rim so the liquid sits inside the barrel
    col *= .83 + .17*smoothstep(.5,.42,r);
    gl_FragColor = vec4(col,1.0);
  }
`;

function makeLiquid(colors, radius) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:{value:0},
      uA:{value:new THREE.Color(colors[0])},
      uB:{value:new THREE.Color(colors[1])},
      uC:{value:new THREE.Color(colors[2])},
    },
    vertexShader: liquidVert,
    fragmentShader: liquidFrag,
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), mat);
  m.rotation.x = -Math.PI/2;
  m.position.y = .54;
  return m;
}

function makeVat({ x, y, z, scale=1, colors, seed=1 }) {
  const group = new THREE.Group();
  group.position.set(x,y,z);
  group.scale.setScalar(scale);
  group.userData = { seed };
  const r = rng(seed);

  // little cloud pillow it rests on
  for (let i=0;i<5;i++){
    const puff = mesh(ico(.3,2), toon(i%2?'#ffe2dd':'#fff4e9'), {
      pos:[(i%3-.5)*.45,-.08, (i%2-.5)*.35], scale:[1.4,.35,1.05]
    });
    puff.castShadow=false;
    group.add(puff);
  }
  // wooden tub body
  const body = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.31,0), new THREE.Vector2(.38,.04), new THREE.Vector2(.47,.20),
    new THREE.Vector2(.49,.42), new THREE.Vector2(.46,.55), new THREE.Vector2(.42,.60)
  ], 24), new THREE.MeshToonMaterial({ color:'#fff2dd', map:TEX.wood, gradientMap:toonRamp }));
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);
  // vertical stave highlights
  for (let i=0;i<14;i++){
    const a=i/14*TAU;
    const stave = mesh(rBox(.032,.52,.055,.012), MAT.woodWarm, {
      pos:[Math.cos(a)*.473,.30,Math.sin(a)*.473], rot:[0,-a,0.015]
    });
    stave.castShadow = false;
    group.add(stave);
  }
  // brass hoops
  for (const yy of [.14,.47]){
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.473,.022,5,36), MAT.brass);
    hoop.rotation.x=Math.PI/2; hoop.position.y=yy;
    group.add(hoop);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.425,.038,6,36), MAT.brassDeep);
  rim.rotation.x=Math.PI/2; rim.position.y=.595;
  group.add(rim);
  const innerShadow = new THREE.Mesh(new THREE.CylinderGeometry(.40,.37,.06,24,1,true), MAT.woodDark);
  innerShadow.position.y=.56;
  group.add(innerShadow);

  // dye
  const liquid = makeLiquid(colors, .42);
  liquid.position.y = .615;
  group.add(liquid);
  // a soft glow licking up from the vat
  const glowSp = glowSprite(colors[2] === '#ffd15b' ? 'gold' : 'pink', 2.7, .4);
  glowSp.position.y=.62;
  group.add(glowSp);
  // a ring of soft rainbow mist gathers above the dye
  for (let i=0;i<5;i++){
    const mist = glowSprite(i%2 ? 'pink':'gold', 1.0 + i*.25, .16);
    mist.position.set(Math.cos(i*1.6)*.3, .82 + i*.08, Math.sin(i*1.6)*.3);
    group.add(mist);
  }
  const dyeLight = new THREE.PointLight(colors[1], 1.6, 3.0, 2);
  dyeLight.position.set(0, .9, 0);
  group.add(dyeLight);

  // decorative bubbles resting on the surface
  for (let i=0;i<9;i++){
    const a=r()*TAU, rad=r()*.3;
    const b = mesh(new THREE.SphereGeometry(.026+r()*.055,10,8), new THREE.MeshPhysicalMaterial({
      color:'#ffffff', transparent:true, opacity:.36, roughness:.02, metalness:0,
      clearcoat:1, iridescence:1, iridescenceIOR:1.35, envMapIntensity:1.8,
      depthWrite:false, side:THREE.DoubleSide,
    }), {
      pos:[Math.cos(a)*rad,.60+r()*.03,Math.sin(a)*rad], scale:[1,.7,1]
    });
    b.castShadow=false; group.add(b);
  }

  // dye drips
  for (let i=0;i<2;i++){
    const a = .4 + i*2.4;
    const drip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      v3(Math.cos(a)*.44,.55,Math.sin(a)*.44),
      v3(Math.cos(a)*.47,.38,Math.sin(a)*.47),
      v3(Math.cos(a)*.46,.22,Math.sin(a)*.46),
    ]), 8, .017, 4, false), glow(colors[1], .8, .8));
    drip.castShadow=false;
    group.add(drip);
  }

  // long stirring paddle
  const paddle = new THREE.Group();
  paddle.rotation.z = .36;
  paddle.rotation.y = -.4;
  const stick = mesh(cyl(.023,.028,1.15,7), MAT.wood, { pos:[0,.55,0] });
  paddle.add(stick);
  const blade = mesh(rBox(.17,.26,.035,.02), MAT.woodWarm, { pos:[0,-.05,0] });
  paddle.add(blade);
  paddle.position.set(.18,.05,.08);
  group.add(paddle);

  // little brass tap
  const tap = mesh(cyl(.035,.045,.12,8), MAT.brass, { pos:[.38,.14,.27], rot:[0,0,Math.PI/2] });
  group.add(tap);
  const tapArm = mesh(new THREE.TorusGeometry(.055,.012,4,12,Math.PI), MAT.brass, { pos:[.46,.18,.27], rot:[0,0,Math.PI/2] });
  group.add(tapArm);

  // steam wisps
  const steam = [];
  for (let i=0;i<7;i++){
    const s = glowSprite(i%2?'pink':'gold', .18, 0);
    s.position.set((r()-.5)*.4,.7,(r()-.5)*.4);
    s.userData = { phase:r()*TAU, base:s.position.clone() };
    group.add(s); steam.push(s);
  }

  // floating feather-petal charms
  for (let i=0;i<3;i++){
    const a=i/3*TAU;
    const star = mesh(ico(.035,1), JELLY.gold, {
      pos:[Math.cos(a)*.23,.62,Math.sin(a)*.23]
    });
    star.castShadow=false;
    group.add(star);
  }

  const source = new THREE.Vector3(x, y + .62*scale, z);
  const update = (t)=>{
    liquid.material.uniforms.uTime.value = t;
    steam.forEach((s,i)=>{
      const u=(t*.11+i/7*.7)%1;
      s.position.x = s.userData.base.x + Math.sin(t*.5+i)*.08 + u*.1;
      s.position.y = .68 + u*.65;
      s.position.z = s.userData.base.z + Math.cos(t*.4+i)*.06;
      s.material.opacity = .12 * Math.sin(Math.min(1,u)*Math.PI);
      s.scale.setScalar(.15+u*.25);
    });
  };
  return { group, update, source };
}

function makeBasket(x, y, z, scale=1, seed=3, cottonColors=null) {
  const group = new THREE.Group();
  group.position.set(x,y,z);
  group.scale.setScalar(scale);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.22,0), new THREE.Vector2(.25,.01), new THREE.Vector2(.33,.12),
    new THREE.Vector2(.40,.3), new THREE.Vector2(.42,.36)
  ], 24), new THREE.MeshToonMaterial({ color:'#ffffff', map:TEX.basket, gradientMap:toonRamp }));
  bowl.material.side = THREE.DoubleSide;
  bowl.castShadow=true; bowl.receiveShadow=true;
  group.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.42,.035,5,28), MAT.woodWarm);
  rim.rotation.x = Math.PI/2; rim.position.y=.35;
  group.add(rim);
  // handles
  for (const sx of [-1,1]){
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.37,.023,5,28,Math.PI), MAT.woodWarm);
    handle.position.set(0,.34,0);
    handle.rotation.x = -.12;
    handle.rotation.z = sx > 0 ? 0 : Math.PI;
    // Only one loop handle is physically sensible, but two crossed make a
    // lovely little cotton basket.
    handle.rotation.y = 0;
    group.add(handle);
    break;
  }
  const r = rng(seed);
  const cols = cottonColors || ['#ffc6d7','#ffe0a3','#c9b8ff','#b8ebdf','#fff0dc','#ffd2b5'];
  for (let i=0;i<11;i++){
    const a = r()*TAU;
    const rad = r()*.26;
    const puff = mesh(ico(.11+r()*.10,2), toon(cols[i%cols.length]), {
      pos:[Math.cos(a)*rad,.42+r()*.2,Math.sin(a)*rad],
      scale:[1.15,.8,1.0], rot:[0,r()*TAU,r()*.2]
    });
    puff.castShadow=true;
    group.add(puff);
  }
  // a couple of trailing ribbons / needles
  const needle = mesh(cyl(.006,.006,.4,4), MAT.brass, { pos:[.18,.55,.18], rot:[0,0,-.75] });
  group.add(needle);
  const ribbon = mesh(new THREE.TorusGeometry(.18,.018,4,12,Math.PI*1.3), toon('#ffc9d7'), {
    pos:[.32,.42,-.08], rot:[.4,.2,.2]
  });
  group.add(ribbon);
  return group;
}

export function createDyeVatsAndBaskets() {
  const root = new THREE.Group();
  root.name = 'cloud-dye-vats';
  const updaters = [];
  const sources = [];

  const vatA = makeVat({
    x:-2.82, y:2.79, z:2.56, scale:1.15, seed:12,
    colors:['#ff78ad','#b18cff','#ffd164']
  });
  root.add(vatA.group); updaters.push(vatA.update); sources.push(vatA.source);

  const vatB = makeVat({
    x:2.56, y:2.78, z:2.52, scale:.92, seed:22,
    colors:['#72d9df','#b995ff','#ffc8db']
  });
  root.add(vatB.group); updaters.push(vatB.update); sources.push(vatB.source);

  // baskets: one by the front door, one in the tree garden
  const basketA = makeBasket(-1.48,2.80,2.40,1.04,3);
  root.add(basketA);
  const basketB = makeBasket(-4.6,.44,8.7,1.12,8,['#ffb7d0','#d2c0ff','#9fe6db','#ffe09a']);
  root.add(basketB);
  // a little cloud pad under the rim basket
  for (let i=0;i<3;i++){
    const puff = mesh(ico(.22+i*.05,2), toon(i%2?'#fff2e7':'#ffd9dc', { emissive:'#ffc5b8', emissiveIntensity:.05 }), {
      pos:[-4.6+(i%2-.5)*.4, .34+i*.02, 8.7+(i%3-1)*.25], scale:[1.5,.4,1.2]
    });
    root.add(puff);
  }

  // a small crate of colorful fabric rolls
  const crate = new THREE.Group();
  crate.position.set(2.35,2.79,-1.15);
  const box = mesh(rBox(.62,.32,.46,.04), MAT.woodDark, { pos:[0,.16,0] });
  crate.add(box);
  for (let i=0;i<5;i++){
    const roll = mesh(cyl(.07,.07,.52,10), toon(['#ffbfd2','#cbb7ff','#ffd48b','#a8e6dc','#ffc9b0'][i]), {
      pos:[-.24+i*.12,.36,.04], rot:[Math.PI/2,0,0]
    });
    crate.add(roll);
  }
  const cloth = mesh(new THREE.PlaneGeometry(.7,.4,8,6), new THREE.MeshToonMaterial({ color:'#ffd8c7', map:TEX.rug, gradientMap:toonRamp, side:THREE.DoubleSide }), {
    pos:[0,.33,-.23], rot:[.2,0,.1]
  });
  crate.add(cloth);
  root.add(crate);

  // soft contact shadows under the vats / baskets
  const shadowMat = new THREE.MeshBasicMaterial({ color:'#634956', transparent:true, opacity:.18, depthWrite:false });
  for (const [sx,sz,sw,sd] of [[-2.82,2.56,.9,.8],[2.56,2.52,.75,.65],[-1.48,2.40,.7,.55]]){
    const sm = new THREE.Mesh(new THREE.CircleGeometry(1,32), shadowMat);
    sm.rotation.x=-Math.PI/2; sm.scale.set(sw,sd,1);
    sm.position.set(sx,2.805,sz);
    root.add(sm);
  }

  function update(t) {
    updaters.forEach(fn=>fn(t));
  }
  return { group: root, update, sources };
}