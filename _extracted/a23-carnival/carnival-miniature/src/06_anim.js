/* =========================================================
   06 · 动效总装：烟花 / 跑马灯 / 后期 / 主循环
   ========================================================= */
(function () {
  'use strict';
  const APP = window.APP;
  const { scene, camera, renderer, controls, srgb, toon, mesh, G, M } = APP;

  /* ---------------- 夜空烟花 ---------------- */
  const bursts = [];
  const fwGroup = new THREE.Group();
  scene.add(fwGroup);
  const fwPalette = [0xff8fc0, 0xffd166, 0x9be3ff, 0xc8a0ff, 0x7be0d0, 0xffb08a];

  function spawnBurst() {
    if (bursts.length > 2) return;
    const N = 64;
    const origin = new THREE.Vector3(
      (Math.random() - 0.5) * 44,
      14 + Math.random() * 12,
      -8 - Math.random() * 26
    );
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const vel = [];
    const base = srgb(fwPalette[(Math.random() * fwPalette.length) | 0]);
    const alt = srgb(fwPalette[(Math.random() * fwPalette.length) | 0]);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const sp = 2.6 + Math.random() * 4.2;
      vel.push(
        new THREE.Vector3(
          Math.sin(v) * Math.cos(u) * sp,
          Math.cos(v) * sp,
          Math.sin(v) * Math.sin(u) * sp
        )
      );
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;
      const c = Math.random() < 0.7 ? base : alt;
      colors[i * 3] = c.r * 2.2;
      colors[i * 3 + 1] = c.g * 2.2;
      colors[i * 3 + 2] = c.b * 2.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.34,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    fwGroup.add(pts);

    // 爆开瞬间的光核
    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: APP.glowTexture('rgba(255,240,220,0.9)', 'rgba(255,180,220,0.3)'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    flash.position.copy(origin);
    flash.scale.setScalar(1.5);
    fwGroup.add(flash);

    bursts.push({ pts, mat, vel, origin, life: 0, dur: 2.4 + Math.random() * 0.8, flash });
  }

  let fwTimer = 1.2;
  APP.onFrame((t, dt) => {
    fwTimer -= dt;
    if (fwTimer <= 0) {
      fwTimer = 2.6 + Math.random() * 3.4;
      spawnBurst();
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life += dt;
      const k = b.life / b.dur;
      const pos = b.pts.geometry.attributes.position;
      for (let j = 0; j < b.vel.length; j++) {
        const v = b.vel[j];
        pos.setXYZ(
          j,
          pos.getX(j) + v.x * dt,
          pos.getY(j) + v.y * dt,
          pos.getZ(j) + v.z * dt
        );
        v.multiplyScalar(1 - 1.9 * dt);
        v.y -= 2.4 * dt;
      }
      pos.needsUpdate = true;
      b.mat.opacity = Math.max(0, 1 - k * k) * 0.95;
      b.mat.size = 0.34 * (1 - k * 0.45);
      const fk = Math.min(1, b.life / 0.35);
      b.flash.material.opacity = (1 - fk) * 0.85;
      b.flash.scale.setScalar(1.5 + fk * 4.5);
      if (k >= 1) {
        fwGroup.remove(b.pts);
        fwGroup.remove(b.flash);
        b.pts.geometry.dispose();
        b.mat.dispose();
        b.flash.material.dispose();
        bursts.splice(i, 1);
      }
    }
  });

  /* ---------------- 后期：泛光 + 暗角 ---------------- */
  const composer = new THREE.EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new THREE.RenderPass(scene, camera));

  const bloom = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.26,
    0.42,
    0.9
  );
  composer.addPass(bloom);

  const finalPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uVig: { value: 0.62 } },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uVig;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        // 线性 -> sRGB
        vec3 col = pow(max(c.rgb, 0.0), vec3(0.4545));
        // 柔和暗角
        float d = length((vUv - 0.5) * vec2(1.06, 1.0));
        float v = smoothstep(0.78, 0.28, d);
        col *= mix(uVig, 1.0, v);
        // 极轻的冷调压边
        col = mix(col, col * vec3(0.86, 0.88, 1.06), (1.0 - v) * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  finalPass.renderToScreen = true;
  composer.addPass(finalPass);

  APP.composer = composer;
  APP.bloom = bloom;

  /* ---------------- 开场镜头推进 ---------------- */
  const baseDist = camera.position.distanceTo(controls.target);
  let introDone = false;
  APP.onFrame((t) => {
    if (introDone) return;
    const k = Math.min(1, t / 3.4);
    const e = 1 - Math.pow(1 - k, 3);
    const dist = baseDist * (1 + 0.3 * (1 - e));
    const off = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(off, dist);
    if (k >= 1) introDone = true;
  });

  /* ---------------- 轻量化：小物件不投影 ---------------- */
  scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const r = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z);
    if (r < 0.14) o.castShadow = false;
  });

  /* ---------------- 主循环 ---------------- */
  const clock = new THREE.Clock();
  let frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    frame++;

    controls.update();

    const tickers = APP.tickers;
    for (let i = 0; i < tickers.length; i++) tickers[i](t, dt);

    // 跑马灯（每两帧刷新一次，足够顺滑）
    if (frame % 2 === 0) {
      const bulbs = APP.bulbs;
      for (let i = 0; i < bulbs.length; i++) bulbs[i].update(t);
    }

    composer.render();
  }

  window.addEventListener('resize', () => {
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  // 淡入
  const veil = document.getElementById('veil');
  if (veil) {
    requestAnimationFrame(() => {
      veil.style.opacity = '0';
      setTimeout(() => veil.remove(), 1800);
    });
  }
})();
