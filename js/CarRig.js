import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map(); // url -> Promise<GLTF>  (raw parse cache, cheap to keep across the session)

function loadGLTF(url, onProgress) {
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => {
      loader.load(url, resolve, onProgress, reject);
    }));
  }
  return cache.get(url);
}

/**
 * CarRig wraps one car's Object3D: normalizes it into a consistent bounding
 * box, exposes yaw control for scroll-driven rotation, a manual drag offset,
 * a horizontal exit/entry position, and disposal.
 */
export class CarRig {
  constructor(config, scene) {
    this.config = config;
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.loaded = false;
    this.disposed = false;
    this.bbox = null;
    this.hotspotAnchors = []; // { type, worldOffset: Vector3 }

    // rotation state
    this.scrollYaw = config.baseYaw;     // driven by scroll rotationProgress
    this.dragYaw = 0;                    // driven by manual pointer drag
    this.displayYaw = config.baseYaw;    // smoothed, applied to the mesh each frame

    // horizontal position state (for the exit/entry transition)
    this.targetX = 0;
    this.displayX = 0;
  }

  async load(onProgress) {
    const gltf = await loadGLTF(this.config.url, (evt) => {
      if (onProgress && evt.total) onProgress(evt.loaded / evt.total);
    });
    if (this.disposed) return;

    // Clone the scene graph so the same parsed GLTF could theoretically be reused;
    // cheap relative to re-parsing the binary.
    const root = gltf.scene.clone(true);

    root.traverse((node) => {
      console.log(
  'CAR PART:',
  node.name,
  'MATERIAL:',
  node.material?.name
);
  if (node.isMesh) {
    node.castShadow = true;
    node.receiveShadow = true;

    if (node.material) {
      node.material.envMapIntensity = 1.0;

      // Pearl white for the THIRD car
      if (this.config.url.includes('datsun.glb')) {
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];

        
      }
    }
  }
});

    // Normalize: center on origin, sit on y=0, scale to targetSize.
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = this.config.targetSize / maxDim;
    root.scale.setScalar(scale);

    // recompute box after scaling to place it exactly on the ground plane, centered.
    const box2 = new THREE.Box3().setFromObject(root);
    const center2 = new THREE.Vector3();
    box2.getCenter(center2);
    root.position.x -= center2.x;
    root.position.z -= center2.z;
    root.position.y -= box2.min.y;

    this.group.add(root);
    this.root = root;
    this.bbox = new THREE.Box3().setFromObject(root);
    this.loaded = true;
    this.group.visible = true;

    this._buildHotspotAnchors();
  }

  _buildHotspotAnchors() {
    if (!this.bbox) return;
    const size = new THREE.Vector3();
    this.bbox.getSize(size);
    const half = size.clone().multiplyScalar(0.5);

    this.hotspotAnchors = (this.config.hotspots || []).map((h) => ({
      type: h.type,
      // hotspot pos values are fractional (-1..1) offsets from center per-axis
      offset: new THREE.Vector3(h.pos[0] * half.x, half.y + h.pos[1] * half.y, h.pos[2] * half.z)
    }));
  }

  /** Called every frame with smoothing factor (0-1) for cinematic easing. */
  update(dt, damp = 0.08) {
    if (!this.loaded) return;
    const targetYaw = this.scrollYaw + this.dragYaw;
    this.displayYaw += (targetYaw - this.displayYaw) * damp;
    this.displayX += (this.targetX - this.displayX) * damp;

    this.group.rotation.y = this.displayYaw;
    this.group.position.x = this.displayX;
  }

  /** World-space positions of this car's hotspots, for screen projection. */
  getHotspotWorldPositions() {
    if (!this.loaded) return [];
    return this.hotspotAnchors.map((a) => ({
      type: a.type,
      world: a.offset.clone().applyMatrix4(this.group.matrixWorld)
    }));
  }

  dispose() {
    this.disposed = true;
    if (this.root) {
      this.root.traverse((node) => {
        if (node.isMesh) {
          node.geometry?.dispose();
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((m) => {
            if (!m) return;
            Object.values(m).forEach((v) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose?.();
          });
        }
      });
      this.group.remove(this.root);
    }
    this.scene.remove(this.group);
  }
}
