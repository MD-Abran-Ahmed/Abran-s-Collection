import * as THREE from 'three';

function detectQuality() {
  const cores = navigator.hardwareConcurrency || 4;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 4;

  if (coarse && (cores <= 4 || mem <= 4)) return 'low';
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

const QUALITY_PRESETS = {
  low:    { pixelRatioCap: 1.0, shadows: false, antialias: false },
  medium: { pixelRatioCap: 1.5, shadows: false, antialias: true },
  high:   { pixelRatioCap: 2.0, shadows: true,  antialias: true }
};

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.quality = QUALITY_PRESETS[detectQuality()];

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(0x0a0a0b, 14, 26);

    this.camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.35, 7.2);
    this.camera.lookAt(0, 0.3, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    if (this.quality.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this._buildLighting();
    this._buildStage();

    window.addEventListener('resize', () => this._onResize());
  }

  _buildLighting() {
    const key = new THREE.DirectionalLight(0xfff3e0, 2.6);
    key.position.set(4, 6, 5);
    key.castShadow = this.quality.shadows;
    if (this.quality.shadows) {
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 20;
      key.shadow.bias = -0.0005;
    }
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x8fb4ff, 1.4);
    rim.position.set(-5, 3, -6);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xc9a876, 0.5);
    fill.position.set(-3, 1.5, 4);
    this.scene.add(fill);

    const hemi = new THREE.HemisphereLight(0x2a2a30, 0x08080a, 0.65);
    this.scene.add(hemi);
  }

  _buildStage() {
    // A soft reflective-looking ground disc, purely for grounding — no heavy geometry.
    const geo = new THREE.CircleGeometry(9, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.35,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.62;
    ground.receiveShadow = this.quality.shadows;
    this.scene.add(ground);

    // subtle ring accent
    const ringGeo = new THREE.RingGeometry(2.6, 2.63, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a876, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.615;
    this.scene.add(ring);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
