import * as THREE from 'three';
import { P } from './palette.js';
import { rng, v3, mesh, ico, TAU } from './lib.js';
import { JELLY, GLOW_TEX, glowSprite, bubbleMaterial } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  Sky jellies — living lanterns that breathe above the atelier
// ─────────────────────────────────────────────────────────────

const jellyVert = `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vPos;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uPulse;
  void main() {
    vUv = uv;
    vec3 p = position;
    // a little breathing scallop around the hem
    float wob = sin(atan(p.z, p.x) * 7.0 + uTime * 1.4) * .025 * smoothstep(.0, .5, .5 - p.y);
    p.xz *= 1.0 + wob;
    p.y *= 1.0 + sin(uTime * .9) * .02 + uPulse * .02;
    vPos = p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const jellyFrag = `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uRim;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vPos;
  varying vec2 vUv;

  void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(vV);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.55);
    float vertexGlow = smoothstep(-.4, .55, vPos.y);
    vec3 col = mix(uB, uA, vertexGlow * .8 + fres * .3);
    col *= 1.08;
    float veins = .5 + .5 * sin(vPos.x * 18.0 + vPos.z * 13.0 + uTime * .9)
                  * sin(vPos.y * 21.0 - uTime * .7);
    col = mix(col, uRim, veins * .14 + fres * .38);
    vec3 iri = .5 + .5 * cos(6.283 * (fres + vec3(0.0, .28, .62) + vUv.x * .18 + uTime * .025));
    col = mix(col, iri, .10 + fres * .18);
    float alpha = uOpacity * (.38 + fres * .54 + veins * .06);
    gl_FragColor = vec4(col, alpha);
  }
`;

function makeBell(radius, color, pulse) {
  const geo = new THREE.SphereGeometry(radius, 30, 16, 0, TAU, 0, Math.PI/2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPulse: { value: pulse },
      uA: { value: new THREE.Color(color) },
      uB: { value: new THREE.Color('#fff4f6') },
      uRim: { value: new THREE.Color('#ffdcef') },
      uOpacity: { value: 1.0 },
    },
    vertexShader: jellyVert,
    fragmentShader: jellyFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(1, .66, 1);
  m.castShadow = false;
  return m;
}

function makeTentacles(radius, color, count=7, seed=1) {
  const group = new THREE.Group();
  const r = rng(seed);
  const mat = JELLY[color] || JELLY.pink;
  const tentacles = [];
  for (let i=0;i<count;i++) {
    const a = i/count*TAU + .2;
    const arm = new THREE.Group();
    arm.rotation.y = a;
    const len = .7 + r()*1.05 ;
    const outset = .15 + r()*.22;
    const pts = [];
    for (let j=0;j<=6;j++){
      const u = j/6;
      pts.push(v3(
        Math.sin(u * (1.2 + r()*.4) + i) * .045 + u*.02,
        -u * len,
        outset * u + Math.sin(u * Math.PI * 2 + i * 2) * .05
      ));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, .010 + r()*.008, 4, false), mat);
    tube.castShadow = false;
    arm.add(tube);
    // tiny bell / bead at tentacle tip
    const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(.018 + r()*.012, 1), JELLY.lilac);
    tip.position.copy(pts[pts.length-1]);
    tip.castShadow = false;
    arm.add(tip);
    arm.userData = { phase: r()*TAU, baseX: arm.rotation.x };
    group.add(arm);
    tentacles.push(arm);
  }
  return { group, tentacles };
}

export function createJellyfishSwarm() {
  const group = new THREE.Group();
  group.name = 'jelly-lamps';
  const specs = [
    { x: -5.1, y: 5.4, z: 3.7, r: .44, color: 'pink', c: '#ff88b7', seed: 1, bob: 1.15, phase: .4 },
    { x: 4.95, y: 6.7, z: 3.4, r: .48, color: 'lilac', c: '#ab88ff', seed: 2, bob: .95, phase: 2.0 },
    { x: 6.8, y: 4.6, z: -.7, r: .34, color: 'blue', c: '#8bdde9', seed: 3, bob: 1.35, phase: 4.1 },
    { x: -5.7, y: 4.45, z: 1.2, r: .28, color: 'peach', c: '#ffb68e', seed: 4, bob: 1.0, phase: 5.2 },
    { x: -.5, y: 9.0, z: -3.8, r: .38, color: 'blue', c: '#a9e1ee', seed: 5, bob: 1.2, phase: 1.3 },
    { x: 2.0, y: 9.1, z: 3.8, r: .30, color: 'pink', c: '#ffa3c3', seed: 6, bob: .8, phase: 3.6 },
    { x: -7.4, y: 7.6, z: -2.0, r: .32, color: 'gold', c: '#ffd18c', seed: 7, bob: 1.45, phase: 2.7 },
    { x: 6.8, y: 7.2, z: 1.2, r: .24, color: 'lilac', c: '#cbb5ff', seed: 8, bob: 1.1, phase: 5.9 },
  ];
  const jellies = [];
  for (const s of specs) {
    const jelly = new THREE.Group();
    jelly.position.set(s.x, s.y, s.z);
    jelly.scale.setScalar(1.58);
    jelly.userData = { ...s, baseY: s.y };
    const bell = makeBell(s.r, s.c, 0);
    jelly.add(bell);
    const skirt = new THREE.Group();
    for (let i=0;i<9;i++){
      const a = i/9*TAU;
      const frill = mesh(ico(.085 + s.r*.14, 1), JELLY[s.color] || JELLY.pink, {
        pos:[Math.cos(a)*s.r*.95, -.02, Math.sin(a)*s.r*.95],
        scale:[1.5,.42,1.0], rot:[0,-a,.4]
      });
      frill.castShadow=false;
      skirt.add(frill);
    }
    jelly.add(skirt);
    const core = mesh(ico(s.r*.22, 2), new THREE.MeshBasicMaterial({
      color: new THREE.Color(s.c).multiplyScalar(1.3), transparent:true, opacity:.9,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false
    }), { pos:[0,s.r*.30,0] });
    core.castShadow=false;
    jelly.add(core);
    const halo = glowSprite(s.color==='gold'?'gold':s.color==='blue'?'blue':'pink', s.r*7.5, .26);
    halo.position.y = s.r*.22;
    jelly.add(halo);
    const tend = makeTentacles(s.r, s.color, 7, s.seed*13);
    jelly.add(tend.group);
    // a visible luminous hem and a small inside light make the bell read as a lamp
    const hem = new THREE.Mesh(new THREE.TorusGeometry(s.r*.94, .014, 5, 30), new THREE.MeshBasicMaterial({
      color: new THREE.Color(s.c).multiplyScalar(1.35), transparent:true, opacity:.8,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false
    }));
    hem.rotation.x = Math.PI/2;
    jelly.add(hem);
    const underGlow = glowSprite('gold', s.r*1.2, .18);
    underGlow.position.y = -.08;
    jelly.add(underGlow);
    if (s.r > .4) {
      const pl = new THREE.PointLight(s.c, 1.8, 4.4, 2);
      pl.position.set(0, s.r*.5, 0);
      jelly.add(pl);
    }
    group.add(jelly);
    jellies.push({ group: jelly, bell, skirt, tentacles: tend.tentacles, halo, core, spec: s });
  }

  // two baby jellies near the water
  for (let i=0;i<2;i++) {
    const s = { x: i? 7.2 : -7.6, y: .65, z: i? 2.1 : 3.0, r: .10, color: 'pink', c: '#ffc4d8', seed: 14+i, bob:.7, phase: i*2.4 };
    const jelly = new THREE.Group();
    jelly.position.set(s.x,s.y,s.z);
    jelly.userData = { ...s, baseY:s.y };
    const bell = makeBell(s.r, s.c, .4);
    jelly.add(bell);
    const halo = glowSprite('pink', .6, .2);
    jelly.add(halo);
    const tend = makeTentacles(s.r, 'pink', 4, 17+i);
    jelly.add(tend.group);
    group.add(jelly);
    jellies.push({ group:jelly, bell, skirt:null, tentacles:tend.tentacles, halo, core:null, spec:s });
  }

  function update(t) {
    for (let i=0;i<jellies.length;i++){
      const j = jellies[i];
      const s = j.spec;
      const ph = s.phase;
      const baseY = s.baseY !== undefined ? s.baseY : s.y;
      j.group.position.y = baseY + Math.sin(t*.33 + ph) * s.bob * .22;
      j.group.position.x = s.x + Math.sin(t*.16 + ph*1.7) * .12;
      j.group.position.z = s.z + Math.cos(t*.14 + ph) * .09;
      j.group.rotation.y = Math.sin(t*.10 + ph)*.08;
      const breathe = 1 + Math.sin(t*.56 + ph)*.045;
      j.bell.scale.set(breathe, .66*(.92 + Math.sin(t*.52+ph)*.06), breathe);
      j.bell.material.uniforms.uTime.value = t;
      j.bell.material.uniforms.uPulse.value = Math.sin(t*.56+ph);
      j.tentacles.forEach((arm, k)=>{
        arm.rotation.x = arm.userData.baseX + Math.sin(t*.45 + ph + k*1.2)*.16;
        arm.rotation.z = Math.cos(t*.36 + ph + k*.9)*.12;
      });
      if (j.halo) j.halo.material.opacity = .12 + .05*(.5+.5*Math.sin(t*.8+ph));
      if (j.core) j.core.scale.setScalar(1 + Math.sin(t*.8+ph)*.08);
    }
  }
  return { group, update };
}