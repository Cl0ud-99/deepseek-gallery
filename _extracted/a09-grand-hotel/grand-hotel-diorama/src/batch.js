import * as THREE from 'three';

/* ================================================================== *
 *  静态合批
 *
 *  把「永远不会动的不透明网格」按 材质 + 阴影标记 + renderOrder 分组，
 *  烘焙世界矩阵后合并成一个大网格。A09 每帧要跑三遍场景
 *  （法线预渲染 / 阴影 / 颜色），所以这里砍掉一个 draw call，
 *  整帧就少三次。
 *
 *  跳过：
 *    - 动画对象（电梯轿厢、旋转门、旗帜、电话总机指示灯、缆车吊厢）
 *    - 透明件与 userData.glass（玻璃要单独排序）
 *    - ShaderMaterial / 非标准混合 / depthWrite:false
 *    - InstancedMesh / SkinnedMesh / 多材质网格
 *    - 属性集合对不齐的几何体（比如带顶点色的一批混进不带的一批）
 * ================================================================== */
export function batchStatic(root, { skip = [], skipMaterials = [], minGroup = 2 } = {}) {
  root.updateMatrixWorld(true);

  const skipSet = new Set(skip.filter(Boolean));
  const skipMat = new Set(skipMaterials.filter(Boolean));
  const underSkipped = (o) => { let n = o; while (n) { if (skipSet.has(n)) return true; n = n.parent; } return false; };

  const candidates = new Set();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
    if (Array.isArray(o.material)) return;
    const m = o.material;
    if (!m || !m.isMaterial) return;
    if (m.isShaderMaterial || m.isSpriteMaterial) return;
    if (m.transparent || m.opacity < 0.999 || m.depthWrite === false) return;
    if (m.blending !== THREE.NormalBlending) return;
    if (skipMat.has(m)) return;
    if (o.userData.glass || o.userData.noBatch) return;
    const g = o.geometry;
    if (!g || !g.attributes || !g.attributes.position) return;
    if (g.morphAttributes && Object.keys(g.morphAttributes).length) return;
    if (underSkipped(o)) return;
    candidates.add(o);
  });

  // 只有「整棵子树都可合并」的节点才能搬走，否则会破坏父节点语义
  const final = [];
  for (const o of candidates) {
    let ok = true;
    for (const c of o.children) { if (!candidates.has(c)) { ok = false; break; } }
    if (ok) final.push(o);
  }

  const buckets = new Map();
  for (const o of final) {
    const key = o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + (o.renderOrder | 0);
    let b = buckets.get(key);
    if (!b) { b = { mat: o.material, cast: o.castShadow, receive: o.receiveShadow, order: o.renderOrder, items: [] }; buckets.set(key, b); }
    b.items.push(o);
  }

  const batchRoot = new THREE.Group();
  batchRoot.name = 'static-batches';
  root.add(batchRoot);

  let batches = 0, absorbed = 0;
  for (const b of buckets.values()) {
    if (b.items.length < minGroup) continue;

    const geos = [];
    const names = Object.keys(b.items[0].geometry.attributes).sort().join(',');
    let uniform = true;
    for (const o of b.items) {
      if (Object.keys(o.geometry.attributes).sort().join(',') !== names) { uniform = false; break; }
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      geos.push(g);
    }
    if (!uniform) { for (const g of geos) g.dispose(); continue; }

    let total = 0;
    for (const g of geos) total += g.attributes.position.count;

    const out = new THREE.BufferGeometry();
    for (const name of Object.keys(geos[0].attributes)) {
      const itemSize = geos[0].attributes[name].itemSize;
      const arr = new Float32Array(total * itemSize);
      let off = 0;
      for (const g of geos) {
        const a = g.attributes[name];
        arr.set(a.array, off * itemSize);
        off += a.count;
      }
      out.setAttribute(name, new THREE.BufferAttribute(arr, itemSize));
    }
    out.computeBoundingSphere();
    out.computeBoundingBox();

    const mesh = new THREE.Mesh(out, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.renderOrder = b.order;
    mesh.matrixAutoUpdate = false;
    mesh.userData.isStaticBatch = true;
    mesh.name = 'batch:' + b.mat.name || 'batch';
    batchRoot.add(mesh);

    batches++; absorbed += b.items.length;
    for (const g of geos) g.dispose();
    for (const o of b.items) { if (o.parent) o.parent.remove(o); }
  }

  root.updateMatrixWorld(true);
  return { batches, absorbed, candidates: final.length, drawCallsSaved: absorbed - batches };
}
