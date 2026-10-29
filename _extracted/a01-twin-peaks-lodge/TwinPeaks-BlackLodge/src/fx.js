import * as THREE from 'three';
import { catenary, timeU, M } from './style.js';
import { L } from './layout.js';

/* ------------------------------------------------------------------ *
 *  Rain
 * ------------------------------------------------------------------ */
export function buildRain(scene) {
  const COUNT = 3000;
  const H = 16;
  const pos = new Float32Array(COUNT * 2 * 3);
  const seed = new Float32Array(COUNT * 2);
  const tip = new Float32Array(COUNT * 2);
  const bx0 = L.bld.x0 - 1.8, bx1 = L.bld.x1 + 1.8;
  const bz0 = L.bld.z0 - 1.8, bz1 = L.bld.z1 + 1.8;
  let i = 0;
  while (i < COUNT) {
    const x = (Math.random() - 0.5) * 33;
    const z = (Math.random() - 0.5) * 33;
    if (x > bx0 && x < bx1 && z > bz0 && z < bz1) continue;
    const y = Math.random() * H;
    const s = Math.random();
    for (let k = 0; k < 2; k++) {
      const idx = (i * 2 + k) * 3;
      pos[idx] = x;
      pos[idx + 1] = y;
      pos[idx + 2] = z;
      seed[i * 2 + k] = s;
      tip[i * 2 + k] = k;
    }
    i++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aTip', new THREE.BufferAttribute(tip, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: timeU, uColor: { value: new THREE.Color(0xa8c8dc) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime;
      attribute float aSeed;
      attribute float aTip;
      varying float vA;
      void main(){
        float sp = 9.0 + 9.0 * fract(aSeed * 13.7);
        float H = 16.0;
        float y = mod(position.y - uTime * sp, H);
        vec3 p = vec3(position.x + (H - y) * 0.055, y, position.z + (H - y) * 0.012);
        p.y += aTip * (0.34 + 0.3 * fract(aSeed * 7.1));
        vA = (0.22 + 0.5 * fract(aSeed * 3.3)) * smoothstep(0.0, 2.0, y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      varying float vA;
      void main(){
        gl_FragColor = vec4(uColor, vA * 0.24);
      }`,
  });
  const rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.name = 'rain';
  scene.add(rain);
  return rain;
}

/* ------------------------------------------------------------------ *
 *  Power lines
 * ------------------------------------------------------------------ */
export function buildWires(scene, poleTop) {
  const g = new THREE.Group();
  g.name = 'wires';
  const wireMat = M(0x1c1c22, { flat: true });
  const wires = [];
  const add = (a, b, sag) => {
    const curve = catenary(a, b, sag, 22);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.032, 5, false), wireMat);
    tube.castShadow = true;
    g.add(tube);
    wires.push(curve);
    return curve;
  };
  const top = [poleTop.x, poleTop.y + 0.35, poleTop.z];
  const c1 = add(top, [-2.6, 4.8, 1.0], 0.8);
  const c2 = add(top, [-9.9, 4.1, 1.6], 1.5);
  const c3 = add([poleTop.x + 0.7, poleTop.y - 0.7, poleTop.z], [-2.9, 4.3, 0.8], 0.95);
  scene.add(g);
  return { group: g, curves: [c1, c2, c3] };
}

/* ------------------------------------------------------------------ *
 *  Arc spark
 * ------------------------------------------------------------------ */
export class Spark {
  constructor(scene, a, b, opts = {}) {
    this.a = new THREE.Vector3(...a);
    this.b = new THREE.Vector3(...b);
    this.count = opts.count || 9;
    this.color = new THREE.Color(opts.color || 0xbfe9ff);
    this.next = 0;
    this.life = 0;
    this.duration = 0.18;
    this.positions = new Float32Array(this.count * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.mat = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.line = new THREE.LineSegments(geo, this.mat);
    this.line.frustumCulled = false;
    scene.add(this.line);
    this.light = new THREE.PointLight(this.color, 0, 6, 2);
    this.light.position.copy(this.a).lerp(this.b, 0.5);
    scene.add(this.light);
    this.active = false;
    this.scale = opts.scale || 1;
  }

  build() {
    const n = this.count;
    const a = this.a, b = this.b;
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const p0 = new THREE.Vector3().lerpVectors(a, b, t0);
      const p1 = new THREE.Vector3().lerpVectors(a, b, t1);
      const mid = new THREE.Vector3().lerpVectors(p0, p1, 0.5);
      const off = 0.14 * this.scale * (0.4 + Math.random());
      mid.x += (Math.random() - 0.5) * off * 2;
      mid.y += (Math.random() - 0.5) * off * 2;
      mid.z += (Math.random() - 0.5) * off * 2;
      this.positions.set([p0.x, p0.y, p0.z], i * 6);
      this.positions.set([mid.x, mid.y, mid.z], i * 6 + 3);
    }
    this.line.geometry.attributes.position.needsUpdate = true;
  }

  update(t, dt) {
    if (t > this.next && !this.active) {
      this.active = true;
      this.life = this.duration = 0.1 + Math.random() * 0.22;
      this.build();
      this.next = t + 1.4 + Math.random() * 3.4;
    }
    if (this.active) {
      this.life -= dt;
      const k = Math.max(0, this.life / this.duration);
      this.mat.opacity = k * (0.55 + Math.random() * 0.45);
      this.light.intensity = k * 9 * (0.6 + Math.random() * 0.6);
      if (Math.random() > 0.55) this.build();
      if (this.life <= 0) {
        this.active = false;
        this.mat.opacity = 0;
        this.light.intensity = 0;
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Dripping water from the awning / branches
 * ------------------------------------------------------------------ */
export class DripField {
  constructor(scene, points, opts = {}) {
    this.drops = [];
    this.splashes = [];
    const dropGeo = new THREE.SphereGeometry(0.022, 6, 5);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0xbfd8e4, transparent: true, opacity: 0.75 });
    const splashGeo = new THREE.RingGeometry(0.02, 0.06, 12);
    const splashMat = new THREE.MeshBasicMaterial({ color: 0xbfd8e4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    for (const p of points) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      m.position.set(p[0], p[1], p[2]);
      m.scale.set(1, 1.9, 1);
      scene.add(m);
      const s = new THREE.Mesh(splashGeo, splashMat.clone());
      s.rotation.x = -Math.PI / 2;
      s.position.set(p[0], 0.03, p[2]);
      s.visible = false;
      scene.add(s);
      this.drops.push({ mesh: m, home: new THREE.Vector3(p[0], p[1], p[2]), y: p[1], v: 0, wait: Math.random() * 3, splash: s, spl: 0 });
    }
  }

  update(t, dt) {
    for (const d of this.drops) {
      if (d.wait > 0) {
        d.wait -= dt;
        d.mesh.visible = false;
        continue;
      }
      d.mesh.visible = true;
      d.v += 9.8 * dt;
      d.y -= d.v * dt;
      d.mesh.position.y = d.y;
      d.mesh.scale.set(1, 1.9 + d.v * 0.14, 1);
      if (d.y <= 0.03) {
        d.y = d.home.y;
        d.v = 0;
        d.wait = 1.2 + Math.random() * 4.5;
        d.mesh.visible = false;
        d.splash.visible = true;
        d.spl = 1;
      }
      if (d.spl > 0) {
        d.spl -= dt * 2.6;
        const k = Math.max(0, d.spl);
        d.splash.scale.setScalar(1 + (1 - k) * 4);
        d.splash.material.opacity = k * 0.45;
        if (d.spl <= 0) d.splash.visible = false;
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Ambient floating motes (adds life to the still air)
 * ------------------------------------------------------------------ */
export function buildMotes(scene) {
  const N = 220;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: timeU, uColor: { value: new THREE.Color(0xffd9a0) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime;
      attribute float aSeed;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.25 + aSeed * 20.0) * 0.4;
        p.y += sin(uTime * 0.18 + aSeed * 13.0) * 0.35;
        p.z += cos(uTime * 0.22 + aSeed * 17.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (2.0 + 4.0 * aSeed) * (60.0 / -mv.z);
        vA = (0.25 + 0.55 * aSeed) * (0.6 + 0.4 * sin(uTime * 1.4 + aSeed * 30.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      varying float vA;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(d));
        gl_FragColor = vec4(uColor, a * vA * 0.5);
      }`,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  scene.add(p);
  return p;
}
