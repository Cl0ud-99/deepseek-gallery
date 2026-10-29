/* =========================================================
   main.js — boot, shot presets, animation loop
   ========================================================= */
(function () {
  var QP = window.QP;
  window.__ERR__ = '';
  window.addEventListener('error', function (ev) {
    var e = ev.error || ev;
    window.__ERR__ = (e && e.stack) ? e.stack : String(ev.message || e);
  });
  window.addEventListener('unhandledrejection', function (ev) {
    window.__ERR__ = String(ev.reason && ev.reason.stack || ev.reason);
  });

  function boot() {
    try {
      QP.initCore();
      QP.buildGround(QP.scene);
      QP.buildBuilding(QP.scene);
      QP.buildInterior(QP.scene);
      QP.buildStreet(QP.scene);
      QP.buildEffects(QP.scene);
      QP.optimizeStatic(QP.scene);

      var q = new URLSearchParams(location.search);
      var shot = q.get('shot') || 'hero';
      if (q.get('q')) QP.quality = q.get('q'); 
      QP.controls.setShot(shot);
      QP.fitFraming = function (resizeOnly) {
        var aspect = window.innerWidth / window.innerHeight;
        QP.camera.aspect = aspect;
        var portrait = aspect < 1.0;
        QP.camera.fov = portrait ? 49 : 38;
        QP.camera.updateProjectionMatrix();
        var st = QP.controls.state;
        if (!resizeOnly && portrait) {
          st.tRadius = Math.min(42, st.tRadius * 1.45);
          st.radius = st.tRadius;
        }
        QP.controls.state.portrait = portrait;
      };
      QP.fitFraming(true);
      if (window.innerWidth / window.innerHeight < 1.0) QP.fitFraming(false);
      window.addEventListener('resize', function () { QP.fitFraming(true); });
      QP.time = 0;
      var clock = new THREE.Clock();
      var t0 = performance.now();
      function frame() {
        requestAnimationFrame(frame);
        var dt = Math.min(clock.getDelta(), 0.05);
        QP.time += dt;
        QP.controls.update(dt);
        QP.updateWorld(dt, QP.time);
        QP.Post.render(QP.scene, QP.camera, QP.time);
      }
      frame();
      window.__READY__ = true;
      window.__APP__ = {
        setShot: function (s) { QP.controls.setShot(s); },
        stats: function () {
          return { calls: (QP.frameStats || {}).calls, tris: (QP.frameStats || {}).triangles, time: (performance.now() - t0) / 1000 };
        }
      };
    } catch (e) {
      window.__ERR__ = (e && e.stack) ? e.stack : String(e);
      console.error(e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
