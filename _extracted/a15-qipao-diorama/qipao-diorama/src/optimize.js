/* =========================================================
   optimize.js — freeze every static opaque mesh into material
   batches. Animated objects and all transparent surfaces stay live.
   ========================================================= */
(function () {
  var T = THREE, QP = window.QP;

  QP.optimizeStatic = function (scene) {
    scene.updateMatrixWorld(true);

    function mark(obj) {
      if (!obj) return;
      obj.traverse(function (o) { o.userData.noMerge = true; });
    }
    if (QP.anim) {
      if (QP.anim.discs) for (var i = 0; i < QP.anim.discs.length; i++) mark(QP.anim.discs[i].obj);
      if (QP.anim.curtains) for (var c = 0; c < QP.anim.curtains.length; c++) mark(QP.anim.curtains[c].mesh);
    }
    if (QP.fx) {
      if (QP.fx.spark && QP.fx.spark.group) mark(QP.fx.spark.group);
      if (QP.fx.petals) for (var p = 0; p < QP.fx.petals.length; p++) mark(QP.fx.petals[p]);
    }
    function animated(o) {
      var n = o;
      while (n) { if (n.userData && n.userData.noMerge) return true; n = n.parent; }
      return false;
    }

    var candidates = [];
    var candSet = new Set();
    scene.traverse(function (o) {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) return;
      if (!o.material || Array.isArray(o.material)) return;
      var m = o.material;
      if (m.transparent || m.opacity < 0.999 || m.depthWrite === false) return;
      if (m.blending !== T.NormalBlending) return;
      if (m.isShaderMaterial && !(o.userData && o.userData.isOutline)) return;
      if (!o.geometry || !o.geometry.getAttribute || !o.geometry.getAttribute('position')) return;
      if (o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length) return;
      if (animated(o)) return;
      candidates.push(o); candSet.add(o);
    });

    var final = [];
    for (var j = 0; j < candidates.length; j++) {
      var o = candidates[j];
      var bad = false;
      for (var k = 0; k < o.children.length; k++) {
        var ch = o.children[k];
        if (!candSet.has(ch)) { bad = true; break; }
      }
      if (!bad) final.push(o);
    }

    var groups = new Map();
    for (var f = 0; f < final.length; f++) {
      var m0 = final[f];
      var key = m0.material.uuid + '|' + (m0.renderOrder | 0) + '|' + (m0.castShadow ? 1 : 0) + '|' + (m0.receiveShadow ? 1 : 0);
      var arr = groups.get(key);
      if (!arr) { arr = []; groups.set(key, arr); }
      arr.push(m0);
    }

    var mergedRoot = new T.Group();
    mergedRoot.name = 'static-batches';
    scene.add(mergedRoot);
    var batches = 0, absorbed = 0, vertexTotal = 0;

    groups.forEach(function (entries) {
      if (entries.length < 2) return;
      var pos = [], norm = [], uv = [];
      var mat = entries[0].material;
      for (var e = 0; e < entries.length; e++) {
        var src = entries[e];
        var g = src.geometry;
        if (g.index) g = g.toNonIndexed(); else g = g.clone();
        g.applyMatrix4(src.matrixWorld);
        var p = g.getAttribute('position');
        var n = g.getAttribute('normal');
        var u = g.getAttribute('uv');
        if (!n && g.computeVertexNormals) { g.computeVertexNormals(); n = g.getAttribute('normal'); }
        var count = p.count;
        for (var v = 0; v < count; v++) {
          pos.push(p.getX(v), p.getY(v), p.getZ(v));
          if (n) norm.push(n.getX(v), n.getY(v), n.getZ(v));
          else norm.push(0, 1, 0);
          if (u) uv.push(u.getX(v), u.getY(v)); else uv.push(0, 0);
        }
        vertexTotal += count;
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
      geo.setAttribute('normal', new T.BufferAttribute(new Float32Array(norm), 3));
      geo.setAttribute('uv', new T.BufferAttribute(new Float32Array(uv), 2));
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      var mesh = new T.Mesh(geo, mat);
      mesh.castShadow = entries[0].castShadow;
      mesh.receiveShadow = entries[0].receiveShadow;
      mesh.renderOrder = entries[0].renderOrder;
      mesh.matrixAutoUpdate = false;
      mesh.userData.isMergedStatic = true;
      mesh.name = 'batch-' + mat.uuid.slice(0, 6);
      mergedRoot.add(mesh);
      batches++;
      absorbed += entries.length;
      for (var r = 0; r < entries.length; r++) {
        var ent = entries[r];
        if (ent.parent) ent.parent.remove(ent);
      }
    });

    QP.optimizationStats = {
      before: final.length,
      batches: batches,
      absorbed: absorbed,
      vertices: vertexTotal
    };
    scene.updateMatrixWorld(true);
    return QP.optimizationStats;
  };
})();
