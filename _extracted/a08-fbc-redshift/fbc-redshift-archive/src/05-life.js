// ═══════════════════════════════════════════════════════════════════════
//  05 — the HDR lens, the slow physics failure, and the final loop
// ═══════════════════════════════════════════════════════════════════════

// ── post: a dirty anamorphic lens trained on a concrete room ───────────
const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(planeGeo(2, 2), new THREE.MeshBasicMaterial());
quad.frustumCulled = false;
postScene.add(quad);

const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.HalfFloatType,
  format: THREE.RGBAFormat,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
  stencilBuffer: false,
});
sceneRT.texture.colorSpace = THREE.LinearSRGBColorSpace;
sceneRT.texture.generateMipmaps = false;
sceneRT.samples = Math.min(IS_COARSE ? 2 : 4, renderer.capabilities.maxSamples || 0);

const bloomA = new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  depthBuffer: false, stencilBuffer: false,
});
const bloomB = bloomA.clone();
bloomA.texture.colorSpace = bloomB.texture.colorSpace = THREE.LinearSRGBColorSpace;
bloomA.texture.generateMipmaps = bloomB.texture.generateMipmaps = false;
bloomB.texture.generateMipmaps = false;

const QUAD_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const brightMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, uThreshold: { value: .86 } },
  vertexShader: QUAD_VERT,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uThreshold;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = max(c.r, max(c.g, c.b));
      float v = smoothstep(uThreshold, uThreshold + .35, l);
      gl_FragColor = vec4(c * v, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const blurMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, uTexel: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(1, 0) } },
  vertexShader: QUAD_VERT,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform vec2 uDir;
    void main(){
      vec2 o = uTexel * uDir;
      vec3 c = texture2D(tDiffuse, vUv).rgb * .227027;
      c += texture2D(tDiffuse, vUv + o * 1.384615).rgb * .316216;
      c += texture2D(tDiffuse, vUv - o * 1.384615).rgb * .316216;
      c += texture2D(tDiffuse, vUv + o * 3.230769).rgb * .070270;
      c += texture2D(tDiffuse, vUv - o * 3.230769).rgb * .070270;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});

const finalMat = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: sceneRT.texture }, tBloom: { value: bloomA.texture },
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uExposure: { value: 1.33 }, uBloom: { value: .84 },
  },
  vertexShader: QUAD_VERT,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tScene; uniform sampler2D tBloom;
    uniform float uTime; uniform vec2 uRes; uniform float uExposure; uniform float uBloom;
    float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
    vec3 aces(vec3 x){
      const float a=2.51,b=.03,c=2.43,d=.59,e=.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.);
    }
    vec3 lin2srgb(vec3 c){
      return mix(1.055*pow(c,vec3(1./2.4))-.055, c*12.92, step(c,vec3(.0031308)));
    }
    void main(){
      vec2 uv = vUv;
      vec2 cc = uv - .5;
      float r2 = dot(cc,cc);
      float ab = .0006 + r2*.006;
      vec3 col;
      col.r = texture2D(tScene, uv + cc*ab*.6).r;
      col.g = texture2D(tScene, uv).g;
      col.b = texture2D(tScene, uv - cc*ab*.6).b;
      vec3 bloom = texture2D(tBloom, uv).rgb;
      // a wider, dirtier halo
      vec3 wide = texture2D(tBloom, uv + vec2(.004,.002)).rgb * .4 + texture2D(tBloom, uv - vec2(.003,.004)).rgb * .35;
      col += bloom * uBloom + wide * uBloom * .35;
      // a faint red pressure behind the model, like light bleeding through a wall
      float halo = smoothstep(1.02, .03, length((cc - vec2(.0, .055)) * vec2(.78, 1.08)));
      col += vec3(.020, .0032, .0025) * pow(halo, 2.3);
      col *= uExposure;
      col = aces(col);
      // cold concrete, bleeding red — grade toward a worn film print
      float lum = dot(col, vec3(.299,.587,.114));
      col = mix(vec3(lum), col, 1.055);
      col.rgb = mix(col.rgb, vec3(lum), smoothstep(.55,1.0,lum)*.11);
      col.b = max(col.b, col.b * 1.025 + (1.0-lum)*.014);
      col.rgb += vec3(-.004, .003, .009) * (1.0 - smoothstep(.0, .3, lum));
      col = mix(col, col*col*(3.0-2.0*col), .09);
      // grain + very fine scan/spatial noise, like a 16mm print
      float grain = hash(gl_FragCoord.xy * .37 + floor(uTime*25.0)) - .5;
      col += grain*.013;
      float scan = 1.0 - .012 * (0.5 + 0.5 * sin(uv.y * uRes.y * 3.14159));
      col *= scan;
      // vignette and a faint red edge pressure
      float vig = smoothstep(.88, .24, length(cc*vec2(1.03,.88)));
      col *= mix(.52, 1.0, vig);
      col.r += smoothstep(.55,.95,length(cc))*.015;
      col = clamp(col, 0., 1.);
      gl_FragColor = vec4(lin2srgb(col), 1.0);
    }`,
  depthTest: false, depthWrite: false,
});

function setPassMat(mat) { quad.material = mat; }
function drawPass(mat, target) {
  setPassMat(mat);
  renderer.setRenderTarget(target);
  renderer.clear();
  renderer.render(postScene, postCamera);
}
function resizePost() {
  const w = Math.max(1, Math.floor(innerWidth * DPR));
  const h = Math.max(1, Math.floor(innerHeight * DPR));
  sceneRT.setSize(w, h);
  bloomA.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
  bloomB.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
  finalMat.uniforms.uRes.value.set(w, h);
  finalMat.uniforms.tBloom.value = bloomA.texture;
}
resizePost();

// ── the very slow failure of gravity ──────────────────────────────────
const scratchM = new THREE.Matrix4();
const scratchP = new THREE.Vector3();
const scratchQ = new THREE.Quaternion();
const scratchS = new THREE.Vector3();
const scratchE = new THREE.Euler();
const tempColor = new THREE.Color();

function driftDesks(t) {
  for (let i = 0; i < deskFloat.length; i++) {
    const d = deskFloat[i];
    const o = d.obj;
    const slow = Math.sin(t * d.speed + d.phase);
    const slower = Math.sin(t * d.speed * .61 + d.phase * 1.7 + 1.3);
    o.position.x = d.base.x + slow * d.ax;
    o.position.y = d.base.y + slower * d.ay;
    o.position.z = d.base.z + Math.sin(t * d.speed * .78 + d.phase + .6) * d.az;
    o.rotation.x = d.rx0 + slower * .016;
    o.rotation.y = d.ry0 + slow * .024;
    o.rotation.z = d.rz0 + Math.sin(t * d.speed * .49 + d.phase * 2.1) * .012;
  }
}

function driftBase(t) {
  for (let i = 0; i < floaters.length; i++) {
    const f = floaters[i];
    f.obj.position.x = f.base.x + Math.sin(t * f.speed + f.phase) * f.amp;
    f.obj.position.y = f.base.y + Math.sin(t * f.speed * .77 + f.phase + 1.7) * f.amp * .8;
    f.obj.position.z = f.base.z + Math.sin(t * f.speed * .59 + f.phase + 2.3) * f.amp;
    f.obj.rotation.y = f.ry + Math.sin(t * f.speed * .43 + f.phase) * .025;
  }
}

function driftObject(t) {
  OBJECT.position.y = 9.35 + Math.sin(t * .24) * .16;
  OBJECT.rotation.y = .22 + t * .013 + Math.sin(t * .17) * .035;
  OBJECT.rotation.z = -.055 + Math.sin(t * .31 + 1.0) * .018;
  objectLight.position.y = OBJECT.position.y - 2.1;
  objectGlow.position.y = -.82 + Math.sin(t * .26) * .035;
}

function driftChips(t) {
  for (let i = 0; i < chipData.length; i++) {
    const d = chipData[i];
    const cycle = (t * d.speed + d.phase) % 1;
    const a = d.a + t * .012;
    const wobble = Math.sin(t * .5 + d.phase * 6.28) * .04;
    scratchP.set(
      OBJECT.position.x + Math.cos(a) * (d.r + wobble),
      OBJECT.position.y + d.h + cycle * d.rise + Math.sin(t * .8 + d.phase * 6.0) * .03,
      OBJECT.position.z + Math.sin(a) * (d.r + wobble) * .72
    );
    scratchE.set(d.tilt + t * d.spin, d.a + t * d.spin * .5, d.tilt * .5 + t * d.spin * .3);
    scratchQ.setFromEuler(scratchE);
    const s = d.s * (1.0 - cycle * .35);
    scratchS.set(s, s * d.sy, s);
    scratchM.compose(scratchP, scratchQ, scratchS);
    chips.setMatrixAt(i, scratchM);
  }
  chips.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < emberData.length; i++) {
    const d = emberData[i];
    const cycle = (t * d.speed + d.phase) % 1;
    const a = d.a - t * .02;
    scratchP.set(
      OBJECT.position.x + Math.cos(a) * d.r,
      OBJECT.position.y + d.h + cycle * d.rise,
      OBJECT.position.z + Math.sin(a) * d.r * .7
    );
    const s = d.s * (.55 + .45 * Math.sin(cycle * Math.PI));
    scratchE.set(t * .5 + d.phase, a, t * .2);
    scratchQ.setFromEuler(scratchE);
    scratchS.set(s, s, s);
    scratchM.compose(scratchP, scratchQ, scratchS);
    embers.setMatrixAt(i, scratchM);
  }
  embers.instanceMatrix.needsUpdate = true;
}

function driftPapers(t) {
  for (let f = 0; f < paperMeshProps.length; f++) {
    const { mesh, data } = paperMeshProps[f];
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const s = d.speed;
      scratchP.set(
        d.bx + Math.sin(t * s + d.phase) * d.ax + Math.sin(t * s * .43 + d.phase * 2.3) * d.ax * .35,
        d.by + Math.sin(t * s * .73 + d.phase + .9) * d.ay,
        d.bz + Math.cos(t * s * .61 + d.phase + .4) * d.az
      );
      scratchQ.set(d.qx, d.qy, d.qz, d.qw);
      scratchS.set(d.s, d.s, d.s);
      scratchM.compose(scratchP, scratchQ, scratchS);
      mesh.setMatrixAt(i, scratchM);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

function driftMotes(t) {
  for (let i = 0; i < moteData.length; i++) {
    const d = moteData[i];
    scratchP.set(
      d.bx + Math.sin(t * d.speed * .23 + d.phase) * d.amp,
      d.by + Math.cos(t * d.speed * .17 + d.phase + 1.1) * d.amp,
      d.bz + Math.sin(t * d.speed * .19 + d.phase + 2.4) * d.amp
    );
    scratchE.set(d.spin + t * d.speed * .12, d.spin * 1.7 + t * d.speed * .08, d.spin + t * .06);
    scratchQ.setFromEuler(scratchE);
    scratchS.set(d.size, d.size * 1.5, d.size);
    scratchM.compose(scratchP, scratchQ, scratchS);
    motes.setMatrixAt(i, scratchM);
  }
  motes.instanceMatrix.needsUpdate = true;
}

// ── emergency-light heartbeat and CRT time ─────────────────────────────
const glowBases = new Map();
for (const m of [...redGlowMats, ...greenGlowMats]) glowBases.set(m, m.opacity);
let lastGreenFlicker = 0;

function animateLights(t) {
  // low-frequency breathing, with an unstable starter-ballast flutter
  const breath = .52 + .48 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.48), 1.6);
  const flutter = .91 + .09 * Math.sin(t * 17.0) + .035 * Math.sin(t * 61.0);
  for (const p of pulseLights) {
    if (p.color === 'green') {
      const pulse = .72 + .2 * Math.sin(t * 2.9 + p.phase) + .09 * Math.sin(t * 28.3 + p.phase * 3.1);
      p.light.intensity = p.base * clamp(pulse, .28, 1.4);
    } else {
      p.light.intensity = p.base * breath * flutter;
    }
  }
  for (const m of redGlowMats) {
    const b = glowBases.get(m) || m.opacity;
    m.opacity = b * (0.55 + .55 * breath);
  }
  for (const m of greenGlowMats) {
    const b = glowBases.get(m) || m.opacity;
    m.opacity = b * (0.65 + .35 * Math.abs(Math.sin(t * 3.7 + 1.2)));
  }
  crtLight.intensity = 9 * (0.72 + .2 * Math.sin(t * 2.9) + .09 * Math.sin(t * 28.3));
}

// ── animate the lens ───────────────────────────────────────────────────
let revealed = false;

function updateCamera(dt, t) {
  if (pointers.size === 0 && !dragging) {
    // tiny post-release inertia / after-hours orbit
    if (Math.abs(vTheta) > .00005 || Math.abs(vPhi) > .00005) {
      goal.theta += vTheta * dt * 9.0;
      goal.phi = clamp(goal.phi + vPhi * dt * 9.0, .58, 1.47);
      vTheta *= Math.exp(-3.4 * dt);
      vPhi *= Math.exp(-3.4 * dt);
    }
    if (t - userActiveAt > 13.0) {
      goal.theta += dt * .012;
    }
  }
  view.theta = damp(view.theta, goal.theta, 6.4, dt);
  view.phi = damp(view.phi, goal.phi, 6.4, dt);
  view.radius = damp(view.radius, goal.radius, 5.2, dt);
  placeCamera();
}

function renderPost(t) {
  renderer.setRenderTarget(sceneRT);
  renderer.clear();
  renderer.render(scene, camera);

  brightMat.uniforms.tDiffuse.value = sceneRT.texture;
  drawPass(brightMat, bloomA);

  const bw = bloomA.width, bh = bloomA.height;
  for (let i = 0; i < 2; i++) {
    blurMat.uniforms.tDiffuse.value = bloomA.texture;
    blurMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
    blurMat.uniforms.uDir.value.set(1, 0);
    drawPass(blurMat, bloomB);
    blurMat.uniforms.tDiffuse.value = bloomB.texture;
    blurMat.uniforms.uDir.value.set(0, 1);
    drawPass(blurMat, bloomA);
  }

  finalMat.uniforms.tScene.value = sceneRT.texture;
  finalMat.uniforms.tBloom.value = bloomA.texture;
  finalMat.uniforms.uTime.value = t;
  renderer.setRenderTarget(null);
  setPassMat(finalMat);
  renderer.clear();
  renderer.render(postScene, postCamera);
}

// ── the loop ───────────────────────────────────────────────────────────
let firstRendered = false;
let lastFrameAt = performance.now();
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now();
  const dt = Math.min((now - lastFrameAt) / 1000, .05);
  lastFrameAt = now;
  clockTime += dt;
  const t = clockTime;

  updateCamera(dt, t);
  driftDesks(t);
  driftBase(t);
  driftObject(t);
  driftChips(t);
  driftPapers(t);
  driftMotes(t);
  animateLights(t);
  for (const s of screens) s.uniforms.uTime.value = t;
  if (window.__dustPoints) {
    window.__dustPoints.rotation.y = t * .004;
    window.__dustPoints.material.opacity = .28 + .12 * (0.5 + 0.5 * Math.sin(t * .37));
  }

  renderPost(t);

  if (!firstRendered) {
    firstRendered = true;
    requestAnimationFrame(() => document.body.classList.add('ready'));
  }
}
frame();

// a small, non-visual debug handle for inspection from the console
window.__FBC = {
  THREE, scene, camera, renderer, view, goal, CAM_TARGET, world, HALL, BASE, OBJECT,
  setView(theta, phi, radius) {
    goal.theta = theta; goal.phi = phi; goal.radius = radius;
    view.theta = theta; view.phi = phi; view.radius = radius;
    placeCamera();
  },
  stats() {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      clock: clockTime,
    };
  },
};
