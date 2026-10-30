/* =========================================================
   main.js — 场景装配 / 光照 / 轨道相机 / 主循环
   ========================================================= */
(function () {
  'use strict';
  var ST = window.ST;

  var scene, camera, renderer, clock;
  var t = 0;
  var params = new URLSearchParams(location.search);
  var SHOT = params.has('shot');
  var FIXED_T = params.has('t') ? parseFloat(params.get('t')) : null;

  var cam = {
    az: 0.55, el: 0.155, dist: 20.2,
    azT: 0.55, elT: 0.155, distT: 20.2,
    tx: -0.7, ty: -1.32, tz: 0,
    ttx: -0.7, tty: -1.32, ttz: 0,
    lastInput: 0
  };

  /* ---------------- 轨道相机 ---------------- */
  function initControls(dom) {
    var pointers = new Map();
    var mode = null;
    var prev = { x: 0, y: 0 };
    var pinch0 = 0;

    function markInput() { cam.lastInput = performance.now(); }

    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    dom.addEventListener('pointerdown', function (e) {
      dom.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      markInput();
      if (pointers.size === 1) {
        mode = (e.button === 2 || e.shiftKey || e.ctrlKey) ? 'pan' : 'orbit';
        prev.x = e.clientX; prev.y = e.clientY;
      } else if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinch0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        mode = 'pinch';
      }
    });

    dom.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      markInput();
      if (mode === 'orbit' && pointers.size === 1) {
        var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        cam.azT -= dx * 0.0072;
        cam.elT = Math.max(-0.62, Math.min(1.28, cam.elT + dy * 0.0055));
        prev.x = e.clientX; prev.y = e.clientY;
      } else if (mode === 'pan' && pointers.size === 1) {
        var dx2 = e.clientX - prev.x, dy2 = e.clientY - prev.y;
        var s = cam.dist * 0.0016;
        var right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        var up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        cam.ttx -= right.x * dx2 * s; cam.tty -= right.y * dx2 * s; cam.ttz -= right.z * dx2 * s;
        cam.ttx += up.x * dy2 * s; cam.tty += up.y * dy2 * s; cam.ttz += up.z * dy2 * s;
        prev.x = e.clientX; prev.y = e.clientY;
      } else if (mode === 'pinch' && pointers.size === 2) {
        var p = Array.from(pointers.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinch0 > 0) cam.distT = Math.max(9, Math.min(52, cam.distT * (pinch0 / d)));
        pinch0 = d;
      }
    });

    function up(e) {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) mode = null;
      else if (pointers.size === 1) { mode = 'orbit'; var p = Array.from(pointers.values())[0]; prev.x = p.x; prev.y = p.y; }
    }
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      markInput();
      cam.distT = Math.max(9, Math.min(52, cam.distT * Math.exp(e.deltaY * 0.0011)));
    }, { passive: false });
  }

  function updateCamera(dt) {
    var k = Math.min(1, dt * 8);
    cam.az += (cam.azT - cam.az) * k;
    cam.el += (cam.elT - cam.el) * k;
    cam.dist += (cam.distT - cam.dist) * k;
    cam.tx += (cam.ttx - cam.tx) * k;
    cam.ty += (cam.tty - cam.ty) * k;
    cam.tz += (cam.ttz - cam.tz) * k;

    if (!SHOT && performance.now() - cam.lastInput > 5200) cam.azT += dt * 0.055;

    var ce = Math.cos(cam.el), se = Math.sin(cam.el);
    camera.position.set(
      cam.tx + cam.dist * ce * Math.sin(cam.az),
      cam.ty + cam.dist * se,
      cam.tz + cam.dist * ce * Math.cos(cam.az)
    );
    camera.lookAt(cam.tx, cam.ty, cam.tz);
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('stage').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05070e, 30, 58);

    camera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 0.5, 200);

    if (params.has('az')) { cam.az = cam.azT = parseFloat(params.get('az')); }
    if (params.has('el')) { cam.el = cam.elT = parseFloat(params.get('el')); }
    if (params.has('dist')) { cam.dist = cam.distT = parseFloat(params.get('dist')); }
    if (params.has('ty')) { cam.ty = cam.tty = parseFloat(params.get('ty')); }
    if (params.has('tx')) { cam.tx = cam.ttx = parseFloat(params.get('tx')); }

    /* 底座 */
    scene.add(ST.buildBase());

    /* 现实世界 */
    ST.setSeed(1983);
    var real = ST.buildWorld('real');
    real.traverse(function (o) {
      if (o.isMesh && !o.userData._isOutline) o.receiveShadow = true;
    });
    scene.add(real);

    /* 颠倒世界（垂直镜像，悬挂于底座下方） */
    ST.setSeed(1983);
    var upw = ST.buildWorld('up');
    upw.scale.y = -1;
    upw.position.y = -ST.BASE_H;
    upw.traverse(function (o) {
      if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; }
    });
    scene.add(upw);

    /* 交界处裂缝 */
    scene.add(ST.buildSeam());

    /* 动效 */
    ST.fx.init(scene);
    if (params.has('bolt')) { ST.fx.lt.regen(); ST.fx.flash = 1; }

    /* 玻璃雨痕（仅现实世界） */
    ST.fx.addGlass(3.44, 1.98, 0.06, 1.5, 1.972);
    ST.fx.addGlass(5.7, 1.98, 1.972, 1.5, -1.05, -Math.PI / 2);
    var gg = ST.fx.glass;
    real.add(gg[gg.length - 2].mesh);
    real.add(gg[gg.length - 1].mesh);

    initControls(renderer.domElement);

    /* 灯光 */
    var hemi = new THREE.HemisphereLight(0x33466f, 0x080a10, 0.42);
    scene.add(hemi);

    // 反向半球光：专照朝下的面（倒悬世界）
    var hemiDown = new THREE.HemisphereLight(0x000000, 0x2c3b60, 0.62);
    scene.add(hemiDown);

    var moon = new THREE.DirectionalLight(0x9db4e0, 1.15);
    moon.position.set(9, 16, 7);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -9; moon.shadow.camera.right = 9;
    moon.shadow.camera.top = 9; moon.shadow.camera.bottom = -9;
    moon.shadow.camera.near = 2; moon.shadow.camera.far = 40;
    moon.shadow.bias = -0.0016;
    moon.shadow.normalBias = 0.02;
    scene.add(moon);

    var rim = new THREE.DirectionalLight(0x3a5aa8, 0.38);
    rim.position.set(-10, 5, -9);
    scene.add(rim);

    // 街机厅暖光溢出
    var spill = new THREE.PointLight(0xffa860, 0.70, 8, 2);
    spill.position.set(0.6, 1.6, 3.0);
    scene.add(spill);

    // 下层深渊光
    var abyss = new THREE.PointLight(0x8a1a2a, 1.5, 16, 2);
    abyss.position.set(0, -8.5, -1);
    scene.add(abyss);
    var abyss2 = new THREE.PointLight(0x2a3a8a, 0.55, 12, 2);
    abyss2.position.set(-5, -6.5, 4);
    scene.add(abyss2);

    // 自深渊向上的冷光：照亮倒悬世界
    var below = new THREE.DirectionalLight(0x7f9fdc, 1.05);
    below.position.set(3, -14, 7);
    below.target.position.set(0, -2, 0);
    scene.add(below);
    scene.add(below.target);

    var below2 = new THREE.DirectionalLight(0x9a2a3a, 0.95);
    below2.position.set(-8, -9, -6);
    below2.target.position.set(0, -2, 0);
    scene.add(below2);
    scene.add(below2.target);

    // 下层正面冷光（照亮倒悬立面）
    var below4 = new THREE.DirectionalLight(0x7a6a9e, 1.35);
    below4.position.set(11, -7, 17);
    below4.target.position.set(0, -2.5, 0);
    scene.add(below4);
    scene.add(below4.target);

    // 下层背面轮廓光
    var below3 = new THREE.DirectionalLight(0x5a7ac8, 0.55);
    below3.position.set(6, -6, -14);
    below3.target.position.set(0, -3, 0);
    scene.add(below3);
    scene.add(below3.target);

    /* 路灯频闪登记 */
    ST.flickerLights = [];
    [real, upw].forEach(function (g) {
      g.traverse(function (o) {
        if (o.userData && o.userData.flicker) {
          o.userData.flicker.userData.base = o.userData.flicker.intensity;
          ST.flickerLights.push(o.userData.flicker);
        }
      });
    });

    window.addEventListener('resize', onResize);

    if (FIXED_T !== null) t = FIXED_T;

    clock = new THREE.Clock();
    cam.lastInput = performance.now();
    document.body.classList.add('ready');
    animate();
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  var frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!SHOT) t += dt;
    updateCamera(SHOT ? 0.016 : dt);
    ST.fx.update(t, SHOT ? 0 : dt, camera);

    var sc = window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    if (ST.fx.rainMat) ST.fx.rainMat.uniforms.uScale.value = sc;
    if (ST.fx.dripMat) ST.fx.dripMat.uniforms.uScale.value = sc;
    if (ST.fx.sporeMat) ST.fx.sporeMat.uniforms.uScale.value = sc;

    renderer.render(scene, camera);
    frame++;
    if (SHOT && frame > 6) { window.__ready = true; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
