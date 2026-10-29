/* =========================================================
   main.js — 渲染 / 自由轨道相机 / 时间线
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;

  const host = document.getElementById('app');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    preserveDrawingBuffer: /frames=/.test(location.search)
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, window.innerWidth / window.innerHeight, 0.5, 900);

  /* ---------------- 场景 ---------------- */
  const only = (location.search.match(/only=([a-z,]+)/) || [, null])[1];
  const want = (n) => !only || only.split(',').indexOf(n) >= 0;
  const skip = (location.search.match(/skip=([a-z,]+)/) || [, ''])[1].split(',');

  if (want('sky')) APP.Sky.build(scene, renderer);
  if (want('cloud')) APP.Base.buildCloudSea(scene);
  if (want('rock')) { APP.Base.buildRocks(scene); APP.Base.buildRuins(scene); }
  if (want('dock')) APP.Base.buildDock(scene);

  const ship = want('ship') ? APP.Airship.build(scene) : new THREE.Group();
  if (!want('ship')) scene.add(ship);
  if (want('building') && skip.indexOf('building') < 0) APP.Building.build(ship);
  if (want('props') && skip.indexOf('props') < 0) APP.Props.build(ship, scene);

  /* ---------------- 相机控制 ---------------- */
  const cam = {
    theta: 0.84, phi: 1.24, radius: 58,
    target: new THREE.Vector3(0, 9.2, 0)
  };
  const goal = {
    theta: cam.theta, phi: cam.phi, radius: cam.radius,
    target: cam.target.clone()
  };
  let idle = 0, dragging = false;
  const pointers = new Map();
  let lastDist = 0;

  function applyCamera() {
    const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
    camera.position.set(
      cam.target.x + cam.radius * sp * Math.sin(cam.theta),
      cam.target.y + cam.radius * cp,
      cam.target.z + cam.radius * sp * Math.cos(cam.theta)
    );
    camera.lookAt(cam.target);
  }

  const el = renderer.domElement;
  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragging = true; idle = 0;
    if (pointers.size === 2) {
      const p = [...pointers.values()];
      lastDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
  });

  el.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    prev.x = e.clientX; prev.y = e.clientY;
    idle = 0;

    if (pointers.size === 1) {
      goal.theta -= dx * 0.0052;
      goal.phi = U.clamp(goal.phi - dy * 0.0042, 0.32, 1.63);
    } else if (pointers.size === 2) {
      const p = [...pointers.values()];
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (lastDist > 0) {
        goal.radius = U.clamp(goal.radius * (lastDist / d), 26, 130);
      }
      lastDist = d;
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) dragging = false;
    lastDist = 0;
  };
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('pointerleave', endPointer);

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    goal.radius = U.clamp(goal.radius * (1 + Math.sign(e.deltaY) * 0.075), 26, 130);
    idle = 0;
  }, { passive: false });

  /* ---------------- 时间线 ---------------- */
  const clock = new THREE.Clock();
  let frame = 0;
  let T = 0;
  const capFrames = +(location.search.match(/frames=(\d+)/) || [, 0])[1];
  let stopped = false;

  function animate() {
    if (!stopped) requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    T += dt;
    frame++;
    idle += dt;

    /* 相机阻尼 */
    if (!dragging && idle > 5) goal.theta += dt * 0.045;
    cam.theta += (goal.theta - cam.theta) * Math.min(1, dt * 7);
    cam.phi += (goal.phi - cam.phi) * Math.min(1, dt * 7);
    cam.radius += (goal.radius - cam.radius) * Math.min(1, dt * 6);
    cam.target.lerp(goal.target, Math.min(1, dt * 5));
    applyCamera();

    /* 整体悬浮呼吸 */
    const bob = Math.sin(T * 0.52) * 0.16;
    if (APP.Airship.root) {
      APP.Airship.root.position.y = APP.C.hullDeckY + bob;
      APP.Airship.root.rotation.z = Math.sin(T * 0.41) * 0.0035;
      APP.Airship.root.rotation.x = Math.cos(T * 0.33) * 0.0025;
      APP.Airship.env.position.y = bob * 1.1;
      APP.Airship.env.rotation.z = Math.sin(T * 0.41 + 0.2) * 0.004;
      APP.Airship.rig.position.y = bob * 0.6;
    }

    /* 螺旋桨 */
    (APP.Airship.props || []).forEach((p, i) => {
      p.rotation.z += dt * (i < 2 ? 7.5 : 5.5);
    });

    /* 风帆轻摆 */
    (APP.Airship.sails || []).forEach((s, i) => {
      s.g.rotation.x = s.base + Math.sin(T * 1.3 + s.ph) * 0.035;
      s.g.rotation.z = (i % 2 === 0 ? -0.1 : 0.1) + Math.cos(T * 1.1 + s.ph) * 0.02;
    });

    /* 小旗 */
    (APP.Airship.pennants || []).forEach((f, i) => {
      f.rotation.y = Math.sin(T * 3.2 + f.userData.ph) * 0.35;
      f.rotation.z = Math.sin(T * 4.1 + f.userData.ph) * 0.12;
    });

    /* 云海翻涌 */
    const bed = APP.Base.bed;
    if (bed) {
      const pos = bed.geometry.attributes.position;
      const base = bed.userData.base;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const f = U.clamp((y + 3.2) / 4.4, 0, 1);
        const w = Math.sin(T * 0.42 + x * 0.24 + z * 0.17) * 0.20
          + Math.sin(T * 0.29 - z * 0.31 + 2.1) * 0.13
          + Math.cos(T * 0.19 + x * 0.11) * 0.09;
        pos.setY(i, y + w * f * f);
      }
      pos.needsUpdate = true;
      if (frame % 4 === 0) bed.geometry.computeVertexNormals();
    }

    /* 云团漂移 */
    const puffs = APP.Base.puffs;
    if (puffs) {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
      const e = new THREE.Euler();
      for (let i = 0; i < APP.Base.puffData.length; i++) {
        const d = APP.Base.puffData[i];
        const dy = Math.sin(T * d.sp * 0.6 + d.ph) * 0.28;
        const da = d.a + Math.sin(T * 0.12 + d.ph) * 0.012;
        v.set(Math.cos(da) * d.r, d.y + dy, Math.sin(da) * d.r);
        e.set(d.rot, d.rot * 0.7 + T * 0.02, d.rot * 0.3);
        q.setFromEuler(e);
        const sc = d.sc * (1 + Math.sin(T * 0.4 + d.ph) * 0.035);
        s.set(sc, sc * 0.72, sc);
        m.compose(v, q, s);
        puffs.setMatrixAt(i, m);
      }
      puffs.instanceMatrix.needsUpdate = true;
    }

    /* 浮石呼吸 */
    (APP.Base.rocks || []).forEach((r) => {
      r.position.y = r.userData.y0 + Math.sin(T * 0.45 + r.userData.ph) * r.userData.amp;
      r.rotation.y += dt * 0.006;
    });

    /* 碎云 */
    if (APP.Base.wisps) APP.Base.wisps.children.forEach((w) => {
      w.position.y = w.userData.y0 + Math.sin(T * 0.3 + w.userData.ph) * 0.5;
    });

    /* 星图自转 */
    if (APP.Building.starmap) {
      const sm = APP.Building.starmap;
      sm.rotation.y = T * 0.22;
      sm.position.y = sm.userData.y0 + Math.sin(T * 0.8) * 0.05;
    }
    if (APP.Building.wheel) {
      APP.Building.wheel.rotation.z = Math.sin(T * 0.4) * 0.03;
    }
    if (APP.Building.vane) {
      APP.Building.vane.rotation.y = Math.sin(T * 0.6) * 0.4 + 0.6;
    }
    if (APP.Building.flag) {
      APP.Building.flag.rotation.y = Math.sin(T * 2.2) * 0.18;
      APP.Building.flag.scale.x = 1 + Math.sin(T * 3.1) * 0.04;
    }

    /* 咖啡蒸汽 */
    if (APP.Building.steam) {
      APP.Building.steam.forEach((s, i) => {
        s.userData.t = (s.userData.t + dt * 0.16) % 1;
        const t = s.userData.t;
        s.position.y = s.userData.y0 + t * 0.85;
        s.position.x = s.userData.base + Math.sin(T * 1.1 + i) * 0.05 + t * 0.06;
        s.position.z = -1.55 + Math.cos(T * 0.9 + i) * 0.05;
        const sc = 0.6 + t * 2.4;
        s.scale.setScalar(sc);
        s.material.opacity = 0.26 * (1 - t) * Math.min(1, t * 5);
      });
    }

    /* 气压管指示灯闪烁 */
    if (APP.Building.pipeLights) {
      APP.Building.pipeLights.forEach((l, i) => {
        l.m.emissiveIntensity = 1.2 + Math.sin(T * 2.4 + l.ph) * 1.1;
      });
    }

    /* 道具动画 */
    APP.Props.update(T);

    renderer.render(scene, camera);

    if (capFrames && frame >= capFrames) {
      stopped = true;
      try {
        const url = renderer.domElement.toDataURL('image/png');
        const img = new Image();
        img.src = url;
        img.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:99';
        document.body.appendChild(img);
      } catch (e) { }
      document.title = 'READY';
    }
  }

  /* 机位预设：#cam=radius,theta,phi,tx,ty,tz */
  (function () {
    const m = location.hash.match(/cam=([-\d.,]+)/);
    if (!m) return;
    const p = m[1].split(',').map(Number);
    if (p.length < 6) return;
    cam.radius = goal.radius = p[0];
    cam.theta = goal.theta = p[1];
    cam.phi = goal.phi = p[2];
    cam.target.set(p[3], p[4], p[5]);
    goal.target.copy(cam.target);
  })();

  applyCamera();
  animate();

  /* ---------------- 尺寸 ---------------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* 便于调试 */
  APP.scene = scene;
  APP.camera = camera;
  APP.renderer = renderer;
})();
