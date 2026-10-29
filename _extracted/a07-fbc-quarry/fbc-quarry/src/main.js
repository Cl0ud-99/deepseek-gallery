/* =========================================================================
   FBC QUARRY 07 — bootstrap and frame loop
   ========================================================================= */
(function () {
  'use strict';
  var FQ = window.FQ;

  function boot() {
    var t0 = performance.now();
    try {
      FQ.buildTextures();
      FQ.initCore();
      FQ.base.build(FQ.scene);
      FQ.pyramid.build(FQ.scene);
      if (FQ.industry && FQ.industry.build) FQ.industry.build(FQ.scene);
      if (FQ.effects && FQ.effects.build) FQ.effects.build(FQ.scene);
      FQ.readyAt = performance.now();
      if (FQ.renderer && FQ.renderer.shadowMap) {
        FQ.renderer.shadowMap.autoUpdate = false;
        FQ.renderer.shadowMap.needsUpdate = true;
      }
      window.__BOOT__ = { stage: 'first-frame', ms: Math.round(FQ.readyAt - t0) };
    } catch (err) {
      window.__BOOT__ = { stage: 'error', message: String(err && err.message), stack: String(err && err.stack).slice(0, 1200) };
      console.error(err);
      return;
    }

    var last = performance.now();
    var elapsed = 0;
    var frames = 0;
    var fpsStart = performance.now();
    var intro = 1;

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      FQ.time = elapsed;
      if (intro > 0) intro = Math.max(0, intro - dt * 0.36);

      FQ.controls.update(dt);
      FQ.sky.material.uniforms.uTime.value = elapsed;
      FQ.underGlow.material.uniforms.uTime.value = elapsed;
      for (var i = 0; i < FQ.updaters.length; i++) {
        try { FQ.updaters[i](dt, elapsed); } catch (e) { /* a single prop must not stop the museum */ }
      }
      FQ.Post.render(FQ.scene, FQ.camera, elapsed, intro * 0.0);

      frames++;
      if (!window.__READY__) {
        if (frames >= 3) {
          window.__READY__ = true;
          window.__BOOT__.stage = 'ready';
          window.__BOOT__.readyMs = Math.round(performance.now() - t0);
          window.__APP__.stats = function () {
            var el = (performance.now() - fpsStart) / 1000;
            var f = FQ.frameStats || {};
            return {
              fps: Math.round(frames / Math.max(el, .001) * 10) / 10,
              calls: f.calls, triangles: f.triangles,
              readyMs: window.__BOOT__.readyMs
            };
          };
        }
      }
      requestAnimationFrame(frame);
    }

    window.__APP__ = {
      FQ: FQ,
      setShot: function (name) { FQ.controls.setShot(name); FQ.controls.setInitial(); },
      stats: null,
      scene: FQ.scene,
      camera: FQ.camera
    };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
