/* =========================================================================
   ASHTRAY MAZE — bootstrap
   ========================================================================= */
(function () {
  'use strict';
  var AM = window.AM;
  var params = new URLSearchParams(location.search);
  var capture = params.get('capture') === '1';
  var captureShot = params.get('shot') || 'hero';
  var captureW = Math.max(320, parseInt(params.get('w') || '1600', 10));
  var captureH = Math.max(240, parseInt(params.get('h') || '1000', 10));
  var captureWait = Math.max(300, parseInt(params.get('wait') || '1800', 10));
  var captureName = (params.get('name') || 'hero').replace(/[^a-z0-9_-]/gi, '');
  var freezeParam = params.get('t');
  AM.freezeTime = capture && freezeParam !== null ? parseFloat(freezeParam) : null;
  AM.isCapture = capture;
  var rayParam = params.get('ray');

  function describeObject(o) {
    var chain = [];
    var p = o;
    for (var i = 0; i < 6 && p; i++) { chain.push(p.name || p.type); p = p.parent; }
    return {
      name: o.name, type: o.type, geometry: o.geometry && o.geometry.type,
      material: o.material && o.material.type,
      color: o.material && o.material.color && o.material.color.getHexString ? o.material.color.getHexString() : null,
      map: !!(o.material && o.material.map),
      world: o.getWorldPosition(new THREE.Vector3()).toArray().map(function (v) { return +v.toFixed(2); }),
      chain: chain, visible: o.visible
    };
  }
  AM.spriteDebug = function () {
    var out = [];
    var W = AM.renderer.domElement.width, H = AM.renderer.domElement.height;
    AM.camera.updateMatrixWorld();
    var v = new THREE.Vector3();
    AM.scene.traverse(function (o) {
      if (!o.isSprite) return;
      o.getWorldPosition(v);
      var vp = v.clone().applyMatrix4(AM.camera.matrixWorldInverse);
      var d = Math.max(.001, -vp.z);
      var ndc = v.clone().project(AM.camera);
      var sx = (ndc.x * .5 + .5) * W, sy = (-ndc.y * .5 + .5) * H;
      var sizePx = o.scale.y * AM.camera.projectionMatrix.elements[5] * H * .5 / d;
      var tex = o.material.map;
      out.push({
        sx: +sx.toFixed(0), sy: +sy.toFixed(0), size: +sizePx.toFixed(0),
        world: [ +v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2) ],
        scale: [ +o.scale.x.toFixed(2), +o.scale.y.toFixed(2) ],
        color: o.material.color ? o.material.color.getHexString() : null,
        opacity: o.material.opacity, blending: o.material.blending,
        mapSize: tex && tex.image ? [tex.image.width, tex.image.height] : null,
        visible: o.visible
      });
    });
    return out.sort(function (a, b) { return Math.abs(a.sx - W * .49) + Math.abs(a.sy - H * .5) - (Math.abs(b.sx - W * .49) + Math.abs(b.sy - H * .5)); }).slice(0, 16);
  };

  AM.raycastDebug = function () {
    if (!rayParam) return null;
    var xy = rayParam.split(',').map(Number);
    var ndc = new THREE.Vector2(xy[0] || 0, xy[1] || 0);
    AM.camera.updateMatrixWorld();
    var rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, AM.camera);
    var hits = rc.intersectObjects(AM.scene.children, true).filter(function (h) { return !h.object.userData.isOutline; });
    return hits.slice(0, 8).map(function (h) { return { distance: +h.distance.toFixed(3), point: h.point.toArray().map(function(v){return +v.toFixed(2);}), obj: describeObject(h.object) }; });
  };

  var consoleErrors = [];
  (function () {
    var orig = console.error.bind(console);
    console.error = function () {
      try { consoleErrors.push(Array.prototype.map.call(arguments, function (a) { return typeof a === 'string' ? a : (a && a.message) || String(a); }).join(' ').slice(0, 800)); } catch (e) {}
      orig.apply(null, arguments);
    };
  })();

  function reportError(err) {
    var msg = (err && (err.stack || err.message)) || String(err);
    try { console.error(msg); } catch (e) {}
    try { fetch('/report', { method: 'POST', body: msg }); } catch (e) {}
    window.__BOOT__ = { stage: 'error', message: msg };
  }
  window.addEventListener('error', function (e) {
    if (!window.__BOOT__ || window.__BOOT__.stage !== 'error') reportError(e.error || e.message);
  });
  window.addEventListener('unhandledrejection', function (e) { reportError(e.reason); });

  function boot() {
    var t0 = performance.now();
    try {
      AM.buildTextures();
      AM.buildMaterials();
      AM.initCore();
      if (capture) {
        AM.renderer.setPixelRatio(1);
        AM.renderer.setSize(captureW, captureH, false);
        AM.camera.aspect = captureW / captureH;
        AM.camera.fov = 35;
        AM.camera.updateProjectionMatrix();
        AM.Post.resize(captureW, captureH);
        AM.controls.setShot(captureShot, true);
        AM.controls.state.autoRotate = false;
      }
      AM.buildBase(AM.scene);
      if (AM.buildMaze) AM.buildMaze(AM.scene);
      if (AM.buildInterior) AM.buildInterior(AM.scene);
      if (AM.buildEffects) AM.buildEffects(AM.scene);
      if (params.get('nokey') === '1' && AM.lights.key) AM.lights.key.intensity = 0;
      if (params.get('nospots') === '1') {
        ['warmSpot', 'greenSpot', 'doorSpot'].forEach(function (k) { if (AM.lights[k]) AM.lights[k].intensity = 0; });
      }
      if (params.get('nointeriorpoints') === '1') {
        ['warm', 'warm2', 'monitor', 'tableGlow', 'desk'].forEach(function (k) { if (AM.lights[k]) AM.lights[k].intensity = 0; });
      }
      if (params.get('nosun') === '1') {
        if (AM.lights.key) AM.lights.key.intensity = 0;
        if (AM.lights.fill) AM.lights.fill.intensity = 0;
        if (AM.lights.rim) AM.lights.rim.intensity = 0;
        if (AM.lights.hemi) AM.lights.hemi.intensity = 0;
        if (AM.lights.ambient) AM.lights.ambient.intensity = 0;
      }
      if (params.get('nosprite') === '1') {
        AM.scene.traverse(function (o) { if (o.isSprite) o.visible = false; });
      }
      if (params.get('nosandhalo') === '1') {
        if (AM.sand && AM.sand.halo) AM.sand.halo.visible = false;
        if (AM.sand && AM.sand.underHalo) AM.sand.underHalo.visible = false;
      }
      if (params.get('hidebank') === '1' && AM.monitorBank) AM.monitorBank.visible = false;
      if (params.get('hideconsole') === '1' && AM.console) AM.console.visible = false;
      if (params.get('hidesand') === '1' && AM.sand && AM.sand.group) AM.sand.group.visible = false;
      if (params.get('hideinterior') === '1' && AM.interiorRoot) AM.interiorRoot.visible = false;
      if (params.get('hidechairs') === '1' && AM.chairsGroup) AM.chairsGroup.visible = false;
      if (params.get('hidearchive') === '1' && AM.archiveGroup) AM.archiveGroup.visible = false;
      if (params.get('hidedressing') === '1' && AM.dressing) AM.dressing.visible = false;
      if (params.get('hidemons') === '1' && AM.monitorBank) AM.monitorBank.visible = false;
      if (params.get('hideconsole') === '1' && AM.console) AM.console.visible = false;
      if (params.get('hidesand') === '1' && AM.sand && AM.sand.group) AM.sand.group.visible = false;
      if (params.get('hidepend') === '1' && AM.pendantGroup) AM.pendantGroup.visible = false;
      if (params.get('hidecone') === '1' && AM.pendantCone) AM.pendantCone.visible = false;
      if (params.get('hidehotline') === '1' && AM.hotlineGroup) AM.hotlineGroup.visible = false;
      if (params.get('hidefixtures') === '1' && AM.interiorFixtures) for (var _hf = 0; _hf < AM.interiorFixtures.length; _hf++) AM.interiorFixtures[_hf].group.visible = false;
      if (params.get('dumptex') === '1') {
        try {
          if (AM.containmentPaint && AM.containmentPaint.material.map && AM.containmentPaint.material.map.image) {
            fetch('/upload?name=containment_tex', { method: 'POST', body: AM.containmentPaint.material.map.image.toDataURL() });
            fetch('/report', { method: 'POST', body: JSON.stringify({ containment: { opacity: AM.containmentPaint.material.opacity, alphaTest: AM.containmentPaint.material.alphaTest, mapSize: [AM.containmentPaint.material.map.image.width, AM.containmentPaint.material.map.image.height], pos: AM.containmentPaint.position.toArray(), visible: AM.containmentPaint.visible } }) });
          }
        } catch (e) { console.log('dump fail', e); }
      }
      if (params.get('nobeam') === '1') {
        AM.scene.traverse(function (o) { if (o.isMesh && o.material && o.material.type === 'ShaderMaterial' && o.material.uniforms && o.material.uniforms.uColor && o.parent && o.parent.parent) { /* search beam is huge */ if (o.geometry && o.geometry.type === 'CylinderGeometry') o.visible = false; } });
      }

      AM.readyAt = performance.now();
      window.__BOOT__ = { stage: 'built', ms: Math.round(AM.readyAt - t0), capture: capture };
    } catch (err) {
      reportError(err);
      return;
    }

    var last = performance.now(), elapsed = 0, frames = 0, snapDone = false;
    var startedAt = performance.now();

    function frame(now) {
      var dt = Math.min((now - last) / 1000, .05);
      last = now;
      elapsed += dt;
      if (AM.freezeTime !== null) { elapsed = AM.freezeTime; dt = 0; }
      AM.time = elapsed;

      AM.controls.update(dt);
      if (AM.sky) AM.sky.material.uniforms.uTime.value = elapsed;
      if (AM.underHaze) AM.underHaze.material.uniforms.uTime.value = elapsed;
      if (AM.underRings) AM.underRings.material.uniforms.uTime.value = elapsed;
      for (var i = 0; i < AM.updaters.length; i++) {
        try { AM.updaters[i](dt, elapsed); } catch (e) { if (!AM._updaterErr) { AM._updaterErr = e; console.error(e); } }
      }
      var fade = 0;
      AM.Post.render(AM.scene, AM.camera, elapsed, fade);

      frames++;
      if (!window.__READY__ && frames >= 3) {
        window.__READY__ = true;
        window.__BOOT__.stage = 'ready';
        window.__BOOT__.readyMs = Math.round(performance.now() - t0);
        window.__APP__ = {
          AM: AM,
          setShot: function (n) { AM.controls.setShot(n, true); },
          stats: function () {
            var f = AM.frameStats || {};
            return { fps: window.__FPS__ || 0, calls: f.calls, triangles: f.triangles, readyMs: window.__BOOT__.readyMs };
          },
          scene: AM.scene,
          camera: AM.camera
        };
      }

      if (capture && !snapDone && now - startedAt > captureWait) {
        snapDone = true;
        try {
          AM.Post.render(AM.scene, AM.camera, elapsed, 0);
          var data = AM.renderer.domElement.toDataURL('image/png');
          fetch('/upload?name=' + captureName, { method: 'POST', body: data }).then(function (r) { return r.text(); }).then(function (t) {
            try { fetch('/report', { method: 'POST', body: JSON.stringify({ stage: 'snapped', uploaded: t, ready: window.__BOOT__, frames: frames, stats: AM.frameStats, gl: AM.glInfo, dpr: window.devicePixelRatio, size: [AM.renderer.domElement.width, AM.renderer.domElement.height], ray: AM.raycastDebug(), sprites: params.get('spritedebug') ? AM.spriteDebug() : null, consoleErrors: consoleErrors.slice(0, 12) }) }); } catch (e) {}
          }).catch(function (e) { try { fetch('/report', { method: 'POST', body: 'UPLOAD ' + e }); } catch (x) {} });
        } catch (e) { reportError(e); }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
