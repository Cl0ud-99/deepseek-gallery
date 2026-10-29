/* =========================================================
   main.js — assemble the miniature and run the loop
   ========================================================= */
(function () {
  'use strict';
  var TP = window.TP;
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
      TP.initCore();
      TP.Ground.build(TP.scene);
      TP.Forest.build(TP.scene);
      TP.Room.build(TP.scene);
      TP.Furniture.build(TP.scene);
      TP.Props.build(TP.scene);
      TP.FX.build(TP.scene);

      // gentle exposure adaptation for very tall or portrait screens
      var aspect = window.innerWidth / Math.max(1, window.innerHeight);
      TP.Post.setExposure(aspect < .95 ? 1.72 : 1.66);
      TP.controls.setShot('hero');
      TP.fitCamera();

      var clock = new THREE.Clock();
      var t0 = performance.now();
      var frames = 0;
      var fpsT = 0, fpsN = 0, fps = 0;
      function frame() {
        requestAnimationFrame(frame);
        var dt = Math.min(clock.getDelta(), .05);
        TP.time += dt;
        frames++;
        fpsT += dt; fpsN++;
        if (fpsT > .75) { fps = fpsN / fpsT; fpsT = 0; fpsN = 0; }
        TP.controls.update(dt);
        TP.FX.update(dt, TP.time);
        TP.Post.render(TP.scene, TP.camera, TP.time);
      }
      frame();
      window.__READY__ = true;
      window.__APP__ = {
        setShot: function (s) {
          TP.controls.setShot(s);
          if (s === 'hero') { TP.fitCamera(); }
          for (var i = 0; i < 4; i++) { TP.controls.update(.016); TP.FX.update(.016, TP.time + .016 * i); }
          TP.Post.render(TP.scene, TP.camera, TP.time);
        },
        reset: function () { TP.controls.setShot('hero'); },
        stats: function () {
          return {
            calls: (TP.frameStats || {}).calls,
            tris: (TP.frameStats || {}).triangles,
            fps: Math.round(fps),
            time: +((performance.now() - t0) / 1000).toFixed(1),
            err: window.__ERR__
          };
        }
      };
      var q = new URLSearchParams(location.search);
      if (q.get('shot')) {
        setTimeout(function () { window.__APP__.setShot(q.get('shot')); }, 30);
      }
    } catch (e) {
      window.__ERR__ = (e && e.stack) ? e.stack : String(e);
      console.error(e);
      window.__READY__ = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
