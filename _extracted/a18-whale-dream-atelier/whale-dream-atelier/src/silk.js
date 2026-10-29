import * as THREE from 'three';
import { P } from './palette.js';
import { rng, rr, v3, TAU } from './lib.js';
import { MAT, bubbleMaterial, glowSprite } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  Silk waterfall & soap-bubble weather
// ─────────────────────────────────────────────────────────────

const silkVert = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uLength;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vLocal;

  void main() {
    vUv = uv;
    vLocal = position;
    vec3 p = position;
    float hang = clamp(-p.y / uLength, 0.0, 1.0);
    float h2 = hang * hang;
    float wave = sin(hang * 7.6 - uTime * 1.02 + uSeed) * .22 * h2
               + sin(hang * 3.4 + uTime * .63 + uSeed * 1.7) * .10 * hang;
    p.z += wave;
    p.x += sin(hang * 5.2 + uTime * .72 + uSeed * .8) * .075 * h2;
    p.z += sin(uv.x * 6.283 + uTime * .4 + hang * 2.0) * .025 * h2;

    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const silkFrag = `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

  void main() {
    vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    vec3 V = normalize(cameraPosition - vWorld);
    if (dot(N, V) < 0.0) N = -N;
    vec3 L = normalize(vec3(-.35, .8, .52));
    float lam = clamp(dot(N, L) * .5 + .5, 0.0, 1.0);
    float soft = smoothstep(.25, .8, lam);

    float t = vUv.y;
    vec3 col = mix(uA, uB, smoothstep(.0, .72, t)); // saturated silk
    col *= 1.05;
    col = mix(col, uC, smoothstep(.58, 1.0, t) * .86);
    col = mix(col, vec3(1.0, .94, .88), .045);

    // moving iridescent bands, like sunlight through the weave
    float band = .5 + .5 * sin(t * 26.0 + vUv.x * 7.0 - uTime * .95 + uSeed);
    col = mix(col, col * vec3(1.05, .98, 1.08) + vec3(.035,.012,.055), band * .28);
    float gold = smoothstep(.72, 1.0, .5 + .5 * sin(t * 45.0 + uTime * .4 + uSeed * 2.1));
    col += vec3(1.0, .78, .45) * gold * .07;

    // raised edging and a feather-light sheen
    float edge = smoothstep(.42, .5, abs(vUv.x - .5));
    col = mix(col, col * vec3(1.10, 1.02, .92) + vec3(.05,.03,.015), edge * .35);
    float sheen = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.2);
    col += vec3(1.0, .90, .78) * sheen * .17;

    // tiny stars caught in the silk
    float sparkle = step(.995, hash21(floor(vUv * vec2(52.0, 190.0)) + floor(uTime*.25)));
    col += vec3(1.0,.9,.7) * sparkle * .35;

    // darker silk fold lines + gold fringe at the bottom
    col *= .90 + .10 * smoothstep(0.0, .9, soft);
    float hem = 1.0 - smoothstep(.0, .025, vUv.y);
    col = mix(col, vec3(1.0, .82, .48), hem * .45);

    float alpha = uOpacity * (0.83 + edge*.1);
    alpha *= smoothstep(0.0, .018, vUv.x) * smoothstep(1.0, .982, vUv.x);
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createSilks(anchors) {
  const group = new THREE.Group();
  group.name = 'silk-waterfall';
  const mats = [];

  anchors.forEach((a, idx) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: a.seed },
        uLength: { value: a.length },
        uA: { value: new THREE.Color(a.palette[0]) },
        uB: { value: new THREE.Color(a.palette[1]) },
        uC: { value: new THREE.Color(a.palette[2]) },
        uOpacity: { value: .92 },
      },
      vertexShader: silkVert,
      fragmentShader: silkFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    mats.push(mat);
    const geo = new THREE.PlaneGeometry(a.width, a.length, 10, 64);
    geo.translate(0, -a.length/2, 0);
    const ribbon = new THREE.Mesh(geo, mat);
    ribbon.position.set(a.x, a.y, a.z);
    ribbon.rotation.y = -.035 + idx * .01;
    ribbon.renderOrder = 6 + idx;
    ribbon.castShadow = false;
    ribbon.receiveShadow = false;
    group.add(ribbon);

    // its little brass hanger
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.04, .009, 4, 12), MAT.brass);
    ring.position.set(a.x, a.y + .02, a.z);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // a second, translucent layer, so the color feels like sunlit dye
    if (idx === 0 || idx === 2 || idx === 4) {
      const mat2 = mat.clone();
      mat2.uniforms = THREE.UniformsUtils.clone(mat.uniforms);
      mat2.uniforms.uOpacity.value = .24;
      mat2.uniforms.uSeed.value = a.seed + 2.4;
      const geo2 = new THREE.PlaneGeometry(a.width * 1.55, a.length * 1.02, 8, 48);
      geo2.translate(0, -a.length * .51, 0);
      const back = new THREE.Mesh(geo2, mat2);
      back.position.set(a.x + .03, a.y + .01, a.z - .06);
      back.renderOrder = 4;
      group.add(back);
      mats.push(mat2);
    }
  });

  // one wide, whisper-thin sunset veil behind the cascade
  {
    const veilMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uSeed: { value: 4.2 }, uLength: { value: 7.4 },
        uA: { value: new THREE.Color('#ffd3b6') },
        uB: { value: new THREE.Color('#e8a8df') },
        uC: { value: new THREE.Color('#b5d8f3') },
        uOpacity: { value: .13 },
      },
      vertexShader: silkVert,
      fragmentShader: silkFrag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(2.0, 7.4, 14, 52);
    geo.translate(0, -3.7, 0);
    const veil = new THREE.Mesh(geo, veilMat);
    veil.position.set(2.16, 3.09, 2.58);
    veil.rotation.y = -.03;
    veil.renderOrder = 3;
    group.add(veil);
    mats.push(veilMat);
  }

  function update(t) {
    for (const m of mats) m.uniforms.uTime.value = t;
  }
  return { group, update };
}

// ── soap bubbles ────────────────────────────────────────────
export function createBubbleField(sources, count = 44) {
  const group = new THREE.Group();
  group.name = 'rainbow-bubbles';
  const geo = new THREE.SphereGeometry(1, 12, 9);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vWorld;
      void main(){
        mat4 im = mat4(1.0);
        #ifdef USE_INSTANCING
          im = instanceMatrix;
        #endif
        vec4 wp = modelMatrix * im * vec4(position,1.0);
        vWorld = wp.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying vec3 vWorld;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);
        float fres = pow(1.0 - abs(dot(N,V)), 1.7);
        vec3 iri = .5 + .5 * cos(6.28318 * (fres * 1.35 + vec3(0.0,.33,.67) + vWorld.y * .035 + uTime * .018));
        vec3 col = mix(vec3(.92,.99,1.0), iri, .72);
        float spec = pow(max(dot(N, normalize(vec3(.38,.82,.42))), 0.0), 22.0);
        col += vec3(1.0,.98,.9) * spec * 1.2;
        float alpha = .06 + fres * .48 + spec * .45;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
  });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  inst.castShadow = false;
  inst.receiveShadow = false;
  inst.renderOrder = 12;
  inst.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const rrnd = rng(921);
  const data = [];
  const colors = [new THREE.Color('#ffd9ea'), new THREE.Color('#d8f6ff'), new THREE.Color('#fff0c8'), new THREE.Color('#e4d5ff')];
  for (let i=0;i<count;i++) {
    const src = sources[i % sources.length];
    data.push({
      src,
      phase: rrnd(),
      speed: .16 + rrnd()*.22,
      size: .065 + rrnd()*.14,
      angle: rrnd()*TAU,
      radius: .06 + rrnd()*.22,
      drift: .5 + rrnd()*1.4,
      maxH: 1.4 + rrnd()*2.4,
    });
    inst.setColorAt(i, colors[i%colors.length]);
  }
  // a few happy giant bubbles
  for (let i=0;i<Math.min(8,count);i++){
    data[i].size *= 1.9;
    data[i].speed *= .72;
  }
  group.add(inst);

  function update(t) {
    for (let i=0;i<count;i++){
      const b = data[i];
      const u = (t * b.speed * .55 + b.phase) % 1;
      const climb = Math.sin(Math.min(1,u)*Math.PI*.5);
      const pop = Math.sin(Math.min(1,u)*Math.PI);
      const wob = Math.sin(t*(.6 + b.speed*4) + b.phase*9.0);
      const radial = b.radius + climb*.14;
      const x = b.src.x + Math.cos(b.angle + climb*2.2 + t*.13) * radial * .7 + Math.sin(t*.3+b.phase*4)*.03;
      const z = b.src.z + Math.sin(b.angle + climb*1.9 - t*.10) * radial * .6;
      const y = b.src.y + u * b.maxH + wob*.035;
      const s = b.size * (0.35 + .9*pop);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s);
      dummy.rotation.set(t*.3 + b.phase, t*.5 + b.angle, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    mat.uniforms.uTime.value = t;
  }
  update(0);
  return { group, update, inst };
}