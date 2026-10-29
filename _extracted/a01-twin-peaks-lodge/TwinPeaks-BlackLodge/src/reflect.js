import * as THREE from 'three';

/**
 * Planar reflection for a horizontal plane at y = planeY.
 * Renders the scene from a mirrored camera into a render target so the wet
 * chevron floor can composite a real reflection of the red curtains, the
 * marble statue and the interior.
 */
export class PlanarReflector {
  constructor(renderer, scene, camera, opts = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.planeY = opts.planeY || 0;
    this.exclude = opts.exclude || [];
    const size = opts.size || 1024;
    this.target = new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      colorSpace: THREE.NoColorSpace,
    });
    this.virtualCamera = new THREE.PerspectiveCamera();
    this.textureMatrix = new THREE.Matrix4();
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10000);
    this._v = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._rot = new THREE.Matrix4();
    this._normal = new THREE.Vector3(0, 1, 0);
    this.enabled = true;
  }

  get texture() {
    return this.target.texture;
  }

  update() {
    if (!this.enabled) return;
    const cam = this.camera;
    cam.updateMatrixWorld();
    const camPos = this._v.setFromMatrixPosition(cam.matrixWorld);
    if (camPos.y <= this.planeY + 0.05) return;

    // mirrored eye position
    const eye = new THREE.Vector3(camPos.x, this.planeY - (camPos.y - this.planeY), camPos.z);

    // mirrored look-at
    this._rot.extractRotation(cam.matrixWorld);
    const look = this._look.set(0, 0, -1).applyMatrix4(this._rot).add(camPos);
    const tgt = this._target.set(look.x, this.planeY - (look.y - this.planeY), look.z);

    const vc = this.virtualCamera;
    vc.position.copy(eye);
    vc.up.set(0, 1, 0).applyMatrix4(this._rot);
    vc.up.y *= -1;
    vc.lookAt(tgt);
    vc.near = cam.near;
    vc.far = cam.far;
    vc.fov = cam.fov;
    vc.aspect = cam.aspect;
    vc.updateProjectionMatrix();
    vc.updateMatrixWorld();

    this.textureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    this.textureMatrix.multiply(vc.projectionMatrix);
    this.textureMatrix.multiply(vc.matrixWorldInverse);

    const r = this.renderer;
    const prevRT = r.getRenderTarget();
    const prevClip = r.clippingPlanes;
    const prevShadowAuto = r.shadowMap.autoUpdate;

    this.exclude.forEach((o) => { if (o) o.visible = false; });
    r.shadowMap.autoUpdate = false;
    r.setRenderTarget(this.target);
    r.clear();
    r.render(this.scene, vc);
    r.shadowMap.autoUpdate = prevShadowAuto;
    r.setRenderTarget(prevRT);
    this.exclude.forEach((o) => { if (o) o.visible = true; });
  }
}
