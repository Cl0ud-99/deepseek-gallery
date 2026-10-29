import * as THREE from 'three';
import * as T from './textures.js';

/* ------------------------------------------------------------------ *
 *  pink dusk sky dome
 * ------------------------------------------------------------------ */
export function createSky() {
  const geo = new THREE.SphereGeometry(600, 32, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      cTop: { value: new THREE.Color(0x5e2c48) },
      cMid: { value: new THREE.Color(0xe08fae) },
      cHor: { value: new THREE.Color(0xffb3b4) },
      cBot: { value: new THREE.Color(0x2a1626) },
    },
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main(){
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cHor; uniform vec3 cBot;
      varying vec3 vPos;
      void main(){
        vec3 n = normalize(vPos);
        float h = n.y;
        vec3 col = mix(cHor, cMid, smoothstep(-0.02, 0.30, h));
        col = mix(col, cTop, smoothstep(0.24, 0.92, h));
        col = mix(cBot, col, smoothstep(-0.45, -0.02, h));
        // faint warm bloom low on the horizon
        float glow = smoothstep(0.35, 0.0, abs(h + 0.02)) * smoothstep(0.1, 0.9, n.z * 0.5 + 0.5);
        col += vec3(0.22, 0.11, 0.06) * glow;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  return sky;
}

/* ------------------------------------------------------------------ *
 *  drifting snow
 * ------------------------------------------------------------------ */
export function createSnow(count = 2800) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  const phase = new Float32Array(count);
  const R = 74;
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = (Math.random() * 2 - 1) * R;
    pos[i * 3 + 1] = -18 + Math.random() * 92;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * R;
    speed[i] = 1.6 + Math.random() * 2.2;
    phase[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.0,
    map: T.snowTexture(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
    color: 0xffffff,
    alphaTest: 0.01,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  let t = 0;
  function update(dt) {
    t += dt;
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const iy = i * 3 + 1;
      p[iy] -= speed[i] * dt;
      if (p[iy] < -18) {
        p[iy] = 74;
        p[i * 3] = (Math.random() * 2 - 1) * R;
        p[i * 3 + 2] = (Math.random() * 2 - 1) * R;
      }
      p[i * 3] += Math.sin(t * 0.5 + phase[i]) * dt * 0.32;
      p[i * 3 + 2] += Math.cos(t * 0.42 + phase[i]) * dt * 0.22;
    }
    geo.attributes.position.needsUpdate = true;
  }
  return { points, update };
}

/* ------------------------------------------------------------------ *
 *  steam / vapour puffs
 * ------------------------------------------------------------------ */
export class SteamSystem {
  constructor(count = 46) {
    this.pool = [];
    const tex = T.steamTexture();
    for (let i = 0; i < count; i++) {
      const m = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false,
        color: 0xfff6f8, blending: THREE.NormalBlending,
      });
      const s = new THREE.Sprite(m);
      s.visible = false;
      s.scale.set(1, 1, 1);
      this.pool.push({ s, life: 0, max: 1, v: new THREE.Vector3(), grow: 1, op: 0.7, spin: 0 });
    }
    this.cursor = 0;
  }
  spawn(pos, opt = {}) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;
    p.s.visible = true;
    p.s.position.copy(pos);
    p.life = 0;
    p.max = opt.life ?? 2.4;
    p.v.set((Math.random() - 0.5) * (opt.spread ?? 0.5), opt.rise ?? 1.4, (Math.random() - 0.5) * (opt.spread ?? 0.5));
    p.grow = opt.grow ?? 2.6;
    p.op = opt.opacity ?? 0.55;
    p.s0 = opt.size ?? 0.8;
    p.s.material.opacity = 0;
    p.s.scale.setScalar(p.s0);
    return p;
  }
  update(dt) {
    for (const p of this.pool) {
      if (!p.s.visible) continue;
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { p.s.visible = false; continue; }
      p.s.position.addScaledVector(p.v, dt);
      p.v.multiplyScalar(1 - dt * 0.35);
      p.v.y += dt * 0.35;
      const sc = p.s0 + p.grow * k;
      p.s.scale.setScalar(sc);
      p.s.material.opacity = p.op * Math.sin(Math.min(1, k * 3.2) * Math.PI * 0.5) * (1 - k * k);
    }
  }
}
