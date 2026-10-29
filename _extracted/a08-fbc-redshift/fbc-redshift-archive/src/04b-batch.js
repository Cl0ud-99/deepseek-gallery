// ═══════════════════════════════════════════════════════════════════════
//  04b — static batching: one mesh for every wall that will never move
//  This keeps the thicket of detail from becoming a thicket of draw calls.
// ═══════════════════════════════════════════════════════════════════════

function batchStaticWorld() {
  const dynamicRoots = new Set();
  dynamicRoots.add(OBJECT);
  for (const f of floaters) dynamicRoots.add(f.obj);
  for (const d of deskFloat) dynamicRoots.add(d.obj);

  const dynamic = (o) => {
    let p = o;
    while (p) {
      if (dynamicRoots.has(p)) return true;
      p = p.parent;
    }
    return false;
  };

  const meshes = [];
  const lines = [];
  world.traverse(o => {
    if (o === world) return;
    if (dynamic(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh) {
      if (Array.isArray(o.material)) return;
      if (!o.material || o.material.transparent) return;
      if (o.material.isShaderMaterial || o.material.isSpriteMaterial) return;
      if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      meshes.push(o);
    } else if (o.isLineSegments) {
      if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      lines.push(o);
    }
  });

  const meshBuckets = new Map();
  const lineBuckets = new Map();
  for (const o of meshes) {
    o.updateWorldMatrix(true, false);
    const key = o.material.uuid + '|' + (o.castShadow ? 1 : 0) + '|' + (o.receiveShadow ? 1 : 0);
    if (!meshBuckets.has(key)) meshBuckets.set(key, { mat: o.material, cast: o.castShadow, receive: o.receiveShadow, geos: [] });
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    meshBuckets.get(key).geos.push(g);
  }
  for (const o of lines) {
    o.updateWorldMatrix(true, false);
    const key = o.material.uuid;
    if (!lineBuckets.has(key)) lineBuckets.set(key, { mat: o.material, geos: [], renderOrder: o.renderOrder });
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    lineBuckets.get(key).geos.push(g);
  }

  // remove every source node after all world transforms have been read
  const toRemove = new Set([...meshes, ...lines]);
  for (const o of toRemove) {
    if (o.parent) o.parent.remove(o);
  }

  function mergePositionNormalUV(geos) {
    let count = 0;
    for (const g of geos) count += g.attributes.position.count;
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    let offset = 0;
    for (const g of geos) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, offset * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, offset * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, offset * 2);
      offset += n;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeBoundingSphere();
    out.computeBoundingBox();
    return out;
  }
  function mergePositions(geos) {
    let count = 0;
    for (const g of geos) count += g.attributes.position.count;
    const pos = new Float32Array(count * 3);
    let offset = 0;
    for (const g of geos) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, offset * 3);
      offset += n;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.computeBoundingSphere();
    out.computeBoundingBox();
    return out;
  }

  let mergedMeshes = 0, mergedLines = 0;
  for (const b of meshBuckets.values()) {
    if (!b.geos.length) continue;
    const geo = mergePositionNormalUV(b.geos);
    const mesh = new THREE.Mesh(geo, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    world.add(mesh);
    mergedMeshes++;
    for (const g of b.geos) g.dispose();
  }
  for (const b of lineBuckets.values()) {
    if (!b.geos.length) continue;
    const geo = mergePositions(b.geos);
    const line = new THREE.LineSegments(geo, b.mat);
    line.renderOrder = b.renderOrder;
    line.matrixAutoUpdate = false;
    line.updateMatrix();
    world.add(line);
    mergedLines++;
    for (const g of b.geos) g.dispose();
  }
  if (window.__FBC) {
    window.__FBC.batchInfo = { mergedMeshes, mergedLines, sourceMeshes: meshes.length, sourceLines: lines.length };
  }
  console.log('[FBC] static batch:', meshes.length, 'meshes /', lines.length, 'outlines ->', mergedMeshes, 'meshes /', mergedLines, 'outline batches');
}
batchStaticWorld();

