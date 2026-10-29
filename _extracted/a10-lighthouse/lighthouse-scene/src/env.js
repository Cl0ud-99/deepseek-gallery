import * as THREE from 'three';
import { glowTexture, makeGull, mulberry32, rockTexture } from './lib.js';
import { DIM } from './world.js';

const NOISE = /* glsl */`
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    float a = hash21(i), b = hash21(i+vec2(1.0,0.0)), c = hash21(i+vec2(0.0,1.0)), d = hash21(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

export function buildEnvironment(scene, M, camera) {
  const rnd = mulberry32(777);
  const env = { flash: 0, update: () => {} };
  let timeGlobal = 0;

  /* ---------------- storm sky ---------------- */
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      varying vec3 vDir;
      ${NOISE}
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(vec3(0.013,0.015,0.019), vec3(0.088,0.093,0.104), smoothstep(-0.04, 0.80, h));
        float n = fbm(d.xz * 5.0 / max(0.45, 0.55 + h) + vec2(uTime*0.006, uTime*0.003));
        col += vec3(0.042) * smoothstep(0.44, 0.94, n) * smoothstep(0.0, 0.55, h);
        float n2 = fbm(d.xz * 13.0 + vec2(-uTime*0.012, 0.0));
        col += vec3(0.010) * smoothstep(0.55, 0.95, n2) * smoothstep(0.08, 0.6, h);
        float md = max(0.0, dot(d, normalize(vec3(-0.55, 0.45, -0.5))));
        col += vec3(0.07) * pow(md, 32.0);
        col = mix(col, vec3(0.006,0.007,0.009), smoothstep(0.0, -0.35, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 40, 24), skyMat);
  sky.name = 'sky';
  scene.add(sky);

  /* ---------------- sea ---------------- */
  const seaGeo = new THREE.PlaneGeometry(170, 170, 200, 200);
  seaGeo.rotateX(-Math.PI / 2);
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector3(-0.55, 0.62, -0.55).normalize() },
      uCam: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying float vH; varying vec2 vP;
      ${NOISE}
      float height(vec2 p, float t){
        float h = 0.0;
        h += sin(p.x*0.62 + t*0.9) * 0.20;
        h += sin(p.y*0.74 - t*1.1) * 0.17;
        h += sin((p.x*1.1 + p.y*0.9)*1.05 + t*1.6) * 0.12;
        h += sin(p.x*2.6 - p.y*2.1 + t*2.4) * 0.07;
        h += sin(p.x*4.3 + p.y*3.7 - t*3.1) * 0.04;
        h += fbm(p*0.55 + vec2(t*0.07, -t*0.05)) * 0.36 - 0.18;
        h += fbm(p*1.9 + vec2(t*0.28, -t*0.2)) * 0.12 - 0.06;
        return h;
      }
      void main(){
        vec2 p = position.xz;
        float h = height(p, uTime);
        float e = 0.14;
        float hx = height(p + vec2(e, 0.0), uTime);
        float hz = height(p + vec2(0.0, e), uTime);
        vN = normalize(vec3(-(hx-h), e, -(hz-h)));
        vH = h; vP = p;
        vec4 wp = modelMatrix * vec4(position.x, h, position.z, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uLight; uniform vec3 uCam;
      varying vec3 vW; varying vec3 vN; varying float vH; varying vec2 vP;
      ${NOISE}
      void main(){
        float d = max(abs(vP.x), abs(vP.y));
        if (d < 5.42) discard;
        vec3 N = normalize(vN);
        vec3 V = normalize(uCam - vW);
        float diff = max(dot(N, uLight), 0.0);
        float band = floor(diff * 4.0) / 4.0;
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        float dist = length(vW.xz);
        vec3 col = vec3(0.006, 0.007, 0.009);
        col += vec3(0.018) * band;
        col += vec3(0.038) * fres;
        vec3 H = normalize(uLight + V);
        float spec = pow(max(dot(N, H), 0.0), 80.0);
        col += vec3(0.42) * smoothstep(0.55, 0.95, spec);
        float n = fbm(vP*vec2(3.2, 5.8) + vec2(uTime*0.16, -uTime*0.24));
        float n2 = fbm(vP*13.0 + vec2(-uTime*0.30, uTime*0.14));
        float streak = smoothstep(0.56, 0.76, n) * smoothstep(0.40, 0.68, n2);
        float crest = smoothstep(0.20, 0.46, vH);
        float surf = smoothstep(6.9, 5.46, d) * (0.4 + 0.6*n2) * (0.55 + 0.45*sin(uTime*1.7 + vP.x*2.0 + vP.y*1.6));
        float foam = clamp(streak*0.5 + crest*streak*0.8 + surf*1.0, 0.0, 1.0);
        foam *= 0.78 + 0.22*sin(uTime*3.1 + n*9.0);
        col = mix(col, vec3(0.74), clamp(foam, 0.0, 1.0) * 0.86);
        col = mix(col, vec3(0.0134,0.0154,0.0192), smoothstep(34.0, 78.0, dist));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.name = 'sea';
  sea.position.y = -1.55;
  scene.add(sea);

  // flat far ocean so the horizon reads as a clean line
  const farSea = new THREE.Mesh(
    new THREE.RingGeometry(8.5, 620, 96, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.0134, 0.0154, 0.0192), side: THREE.DoubleSide })
  );
  farSea.rotation.x = -Math.PI / 2;
  farSea.position.y = -1.58;
  farSea.name = 'farSea';
  scene.add(farSea);

  /* ---------------- sea stacks / boulders ---------------- */
  const rockMat = new THREE.MeshStandardMaterial({
    map: rockTexture(), color: 0x4a4a4c, roughness: 0.82, metalness: 0.12, envMapIntensity: 0.6,
  });
  const bGeo = new THREE.DodecahedronGeometry(1, 0);
  const boulders = new THREE.InstancedMesh(bGeo, rockMat, 26);
  boulders.castShadow = true; boulders.receiveShadow = true;
  const dm = new THREE.Object3D();
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rnd() * 0.4;
    const rad = 7.9 + rnd() * 3.6;
    const s = 0.35 + rnd() * 0.7;
    dm.position.set(Math.cos(a) * rad, -1.6 + s * 0.2, Math.sin(a) * rad);
    dm.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    dm.scale.set(s * (1 + rnd() * 0.7), s * (0.7 + rnd() * 0.6), s * (1 + rnd() * 0.7));
    dm.updateMatrix(); boulders.setMatrixAt(i, dm.matrix);
  }
  scene.add(boulders);

  /* ---------------- spray ---------------- */
  const glowTex = glowTexture();
  const sprays = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.25;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xd8e2ee, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const rad = 5.6 + rnd() * 1.6;
    sp.userData = { a, rad, phase: rnd() * 6.3, speed: 0.5 + rnd() * 0.7, scale: 1.4 + rnd() * 2.6 };
    sp.position.set(Math.cos(a) * rad, -1.4, Math.sin(a) * rad);
    scene.add(sp);
    sprays.push(sp);
  }

  /* ---------------- surf at the section corner ---------------- */
  const cornerSpray = [];
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xdde6f0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.userData = { phase: rnd() * 6.3, x: 4.2 + rnd() * 1.4, z: 4.2 + rnd() * 1.4, sc: 1.0 + rnd() * 1.6 };
    scene.add(sp);
    cornerSpray.push(sp);
  }

  /* ---------------- rain ---------------- */
  const RAIN = 5200;
  const rpos = new Float32Array(RAIN * 2 * 3);
  const rbase = new Float32Array(RAIN * 2 * 3);
  const rtail = new Float32Array(RAIN * 2);
  const rspeed = new Float32Array(RAIN * 2);
  for (let i = 0; i < RAIN; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd()) * 34 + 1.5;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    const y = -3 + rnd() * 30;
    const len = 0.35 + rnd() * 0.85;
    const sp = 11 + rnd() * 9;
    for (let k = 0; k < 2; k++) {
      const j = (i * 2 + k);
      rpos[j * 3] = x; rpos[j * 3 + 1] = y; rpos[j * 3 + 2] = z;
      rbase[j * 3] = x; rbase[j * 3 + 1] = y; rbase[j * 3 + 2] = z;
      rtail[j] = k === 0 ? 0 : -len;
      rspeed[j] = sp;
    }
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  rainGeo.setAttribute('aBase', new THREE.BufferAttribute(rbase, 3));
  rainGeo.setAttribute('aTail', new THREE.BufferAttribute(rtail, 1));
  rainGeo.setAttribute('aSpeed', new THREE.BufferAttribute(rspeed, 1));
  const rainMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec3 aBase; attribute float aTail; attribute float aSpeed;
      uniform float uTime;
      varying float vFade;
      void main(){
        float y = mod(aBase.y - uTime*aSpeed, 30.0) - 3.0;
        float fall = aBase.y - y;
        vec3 p = vec3(aBase.x + fall*0.055, y + aTail, aBase.z + fall*0.02);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vFade = smoothstep(60.0, 8.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vFade;
      void main(){ gl_FragColor = vec4(vec3(0.60,0.64,0.70), 0.20 * vFade); }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.name = 'rain';
  rain.frustumCulled = false;
  scene.add(rain);

  /* ---------------- gulls ---------------- */
  const gulls = [];
  for (let i = 0; i < 9; i++) {
    const b = makeGull(M.gull);
    const scale = 0.5 + rnd() * 0.22;
    b.scale.setScalar(scale);
    scene.add(b);
    gulls.push({
      obj: b,
      radius: 3.2 + rnd() * 4.6,
      y: DIM.lensY + 0.6 + rnd() * 2.6,
      speed: (0.28 + rnd() * 0.3) * (rnd() > 0.35 ? 1 : -1),
      phase: rnd() * 6.3,
      flap: 5.5 + rnd() * 3.5,
      bob: 0.3 + rnd() * 0.5,
    });
  }

  /* ---------------- lightning ---------------- */
  const boltMat = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const boltGeo = new THREE.BufferGeometry();
  boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
  const bolt = new THREE.Line(boltGeo, boltMat);
  bolt.frustumCulled = false;
  scene.add(bolt);

  const boltLight = new THREE.DirectionalLight(0xdfe9ff, 0);
  scene.add(boltLight);
  const boltLight2 = new THREE.DirectionalLight(0xdfe9ff, 0);
  boltLight2.position.set(20, 30, 10);
  scene.add(boltLight2);

  let nextStrike = 2.5 + rnd() * 3;
  let strikeT = -1;
  let strikeAngle = 0;

  function strike(time) {
    strikeAngle = rnd() * Math.PI * 2;
    const dist = 46 + rnd() * 14;
    const x0 = Math.cos(strikeAngle) * dist, z0 = Math.sin(strikeAngle) * dist;
    const pos = boltGeo.attributes.position.array;
    let x = x0, z = z0;
    for (let i = 0; i < 18; i++) {
      const f = i / 17;
      const y = 30 - f * 34;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      x += (rnd() - 0.5) * 3.4 * (1 - f * 0.4);
      z += (rnd() - 0.5) * 3.4 * (1 - f * 0.4);
    }
    boltGeo.attributes.position.needsUpdate = true;
    boltLight.position.set(x0, 26, z0);
    boltLight2.position.set(x0, 18, z0);
    strikeT = time;
  }

  /* ---------------- moon ---------------- */
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xc9d6e6, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  moon.position.set(-52, 40, -48);
  moon.scale.set(34, 34, 1);
  scene.add(moon);

  env.strike = () => strike(timeGlobal);
  env.update = (time, dt) => {
    timeGlobal = time;
    seaMat.uniforms.uTime.value = time;
    seaMat.uniforms.uCam.value.copy(camera.position);
    skyMat.uniforms.uTime.value = time;
    rainMat.uniforms.uTime.value = time;

    // spray
    for (const sp of sprays) {
      const u = sp.userData;
      const k = (time * u.speed + u.phase) % 4.0;
      const f = k / 4.0;
      sp.position.set(
        Math.cos(u.a + Math.sin(time * 0.2 + u.phase) * 0.05) * u.rad,
        -1.5 + f * 2.6,
        Math.sin(u.a + Math.sin(time * 0.2 + u.phase) * 0.05) * u.rad
      );
      const s = u.scale * (0.5 + f * 1.4);
      sp.scale.set(s, s, 1);
      sp.material.opacity = Math.max(0, (1 - f) * 0.22 * Math.min(1, f * 6));
    }

    // corner surf
    for (const sp of cornerSpray) {
      const u = sp.userData;
      const f = ((time * 0.55 + u.phase) % 3.0) / 3.0;
      sp.position.set(u.x, -1.3 + f * 1.5, u.z);
      const sc = u.sc * (0.6 + f * 1.2);
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.max(0, (1 - f) * 0.3 * Math.min(1, f * 5));
    }

    // gulls
    for (const gl of gulls) {
      const a = gl.phase + time * gl.speed;
      const o = gl.obj;
      o.position.set(
        Math.cos(a) * gl.radius,
        gl.y + Math.sin(time * 0.7 + gl.phase) * gl.bob,
        Math.sin(a) * gl.radius
      );
      o.rotation.y = -(a + Math.PI / 2) * Math.sign(gl.speed);
      o.rotation.z = Math.sin(a) * 0.28 * Math.sign(gl.speed);
      const flap = Math.sin(time * gl.flap + gl.phase) * 0.65 + 0.1;
      o.userData.wings[0].rotation.x = -flap;
      o.userData.wings[1].rotation.x = flap;
    }

    // lightning
    if (strikeT < 0 && time > nextStrike) strike(time);
    if (strikeT >= 0) {
      const el = time - strikeT;
      let f = Math.exp(-el * 11.0);
      if (el > 0.09) f += 0.75 * Math.exp(-(el - 0.09) * 13.0);
      if (el > 0.2) f += 0.4 * Math.exp(-(el - 0.2) * 9.0);
      f = Math.max(0, Math.min(1.2, f));
      boltMat.opacity = f * 0.95;
      boltLight.intensity = f * 7.5;
      boltLight2.intensity = f * 3.0;
      env.flash = f;
      if (el > 1.2) { strikeT = -1; nextStrike = time + 2.8 + rnd() * 5.5; env.flash = 0; boltMat.opacity = 0; }
    } else {
      env.flash *= 0.9;
    }
  };

  return env;
}
