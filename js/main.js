import * as THREE from 'three';
import { CARS, HOTSPOT_COPY } from './config.js';
import { SceneManager } from './SceneManager.js';
import { CarRig } from './CarRig.js';
import { ScrollState } from './ScrollState.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const canvas = document.getElementById('webgl');
const sceneManager = new SceneManager(canvas);
const scrollState = new ScrollState(CARS.length);

const scrollContainer = document.getElementById('scroll-container');
// Total scroll distance = 3 car sections + 1 outro spacer, set via CSS already.

const rigs = new Map(); // carIndex -> CarRig

const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const loaderLabel = document.getElementById('loader-label');
const scrollCue = document.getElementById('scroll-cue');
const dragHint = document.getElementById('drag-hint');

const infoPanels = CARS.map((_, i) => document.getElementById(`info-${i}`));
const outroPanel = document.getElementById('outro-panel');

const hotspotLayer = document.getElementById('hotspot-layer');
const hotspotTooltip = document.getElementById('hotspot-tooltip');

// ---------------------------------------------------------------------------
// Rig lifecycle
// ---------------------------------------------------------------------------
function ensureRig(index, { blocking = false } = {}) {
  if (index == null || index < 0 || index >= CARS.length) return null;
  if (rigs.has(index)) return rigs.get(index);

  const config = CARS[index];
  const rig = new CarRig(config, sceneManager.scene);
  rigs.set(index, rig);

  const onProgress = blocking ? (p) => setLoaderProgress(p, config) : undefined;
  rig.load(onProgress).catch((err) => console.error('Failed to load', config.url, err));

  return rig;
}

function cleanupRigs(keepIndices) {
  for (const [index, rig] of rigs) {
    if (!keepIndices.has(index)) {
      rig.dispose();
      rigs.delete(index);
    }
  }
}

function setLoaderProgress(p, config) {
  loaderFill.style.width = `${Math.round(p * 100)}%`;
  if (config) loaderLabel.textContent = `LOADING ${config.meta.name[0]}`;
}

// ---------------------------------------------------------------------------
// Initial load (car 0, blocking with full-screen loader)
// ---------------------------------------------------------------------------
async function init() {
  const firstRig = ensureRig(0, { blocking: true });
  await waitForLoad(firstRig);
  loaderEl.classList.add('hidden');
  scrollCue.classList.remove('hidden');
  requestAnimationFrame(loop);
}

function waitForLoad(rig) {
  return new Promise((resolve) => {
    const check = () => {
      if (rig.loaded || rig.disposed) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

// ---------------------------------------------------------------------------
// Scroll tracking (rAF-throttled read of window.scrollY)
// ---------------------------------------------------------------------------
let latestScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  latestScrollY = window.scrollY;
}, { passive: true });

// ---------------------------------------------------------------------------
// Manual drag-to-inspect (mouse always; touch only when horizontal intent is clear)
// ---------------------------------------------------------------------------
const drag = { active: false, startX: 0, pointerId: null, isTouch: false, startY: 0, committed: false };

canvas.addEventListener('pointerdown', (e) => {
  drag.active = true;
  drag.committed = e.pointerType !== 'touch'; // mouse commits immediately; touch waits to see intent
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.pointerId = e.pointerId;
  drag.isTouch = e.pointerType === 'touch';
});

window.addEventListener('pointermove', (e) => {
  if (!drag.active || e.pointerId !== drag.pointerId) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;

  if (drag.isTouch && !drag.committed) {
    // Decide intent once movement is meaningful; let vertical swipes fall through to page scroll.
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dx) <= Math.abs(dy)) { drag.active = false; return; }
    drag.committed = true;
  }

  if (drag.committed) {
    if (e.cancelable) e.preventDefault();
    const state = scrollState.read(latestScrollY);
    const rig = rigs.get(state.activeIndex);
    if (rig) rig.dragYaw = dx * 0.006;
  }
}, { passive: false });

window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
function endDrag(e) {
  if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return;
  drag.active = false;
  drag.committed = false;
  drag.pointerId = null;
}

let dragHintShown = false;

// ---------------------------------------------------------------------------
// Hotspots (DOM dots projected from 3D world space each frame)
// ---------------------------------------------------------------------------
const hotspotPool = [];
function getHotspotEl(i) {
  if (!hotspotPool[i]) {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.addEventListener('click', (e) => {
      const type = el.dataset.type;
      showTooltip(type, el);
      e.stopPropagation();
    });
    hotspotLayer.appendChild(el);
    hotspotPool[i] = el;
  }
  return hotspotPool[i];
}

function showTooltip(type, el) {
  const copy = HOTSPOT_COPY[type];
  if (!copy) return;
  hotspotTooltip.innerHTML = `<span class="h-label">${copy.label}</span><span class="h-body">${copy.body}</span>`;
  const rect = el.getBoundingClientRect();
  const tw = 240;
  let left = rect.left + 20;
  if (left + tw > window.innerWidth - 20) left = rect.left - tw - 20;
  hotspotTooltip.style.left = `${Math.max(20, left)}px`;
  hotspotTooltip.style.top = `${Math.min(window.innerHeight - 140, rect.top)}px`;
  hotspotTooltip.classList.add('visible');
}

document.addEventListener('click', () => hotspotTooltip.classList.remove('visible'));

const projected = new THREE.Vector3();
function updateHotspots(visibleRigs) {
  let poolIndex = 0;
  const w2 = window.innerWidth / 2;
  const h2 = window.innerHeight / 2;

  visibleRigs.forEach(({ rig, opacity }) => {
    if (!rig || !rig.loaded || opacity < 0.05) return;
    rig.getHotspotWorldPositions().forEach(({ type, world }) => {
      projected.copy(world).project(sceneManager.camera);
      if (projected.z > 1) return; // behind camera
      const el = getHotspotEl(poolIndex++);
      el.dataset.type = type;
      el.style.left = `${projected.x * w2 + w2}px`;
      el.style.top = `${-projected.y * h2 + h2}px`;
      el.style.opacity = String(opacity);
      el.style.display = 'block';
    });
  });

  for (let i = poolIndex; i < hotspotPool.length; i++) {
    hotspotPool[i].style.display = 'none';
  }
}

// ---------------------------------------------------------------------------
// Info panel + counter updates
// ---------------------------------------------------------------------------
const counterCurrentEl = document.getElementById('counter-current');

function stageIndexFor(rotationProgress) {
  return Math.min(4, Math.floor(rotationProgress * 5));
}

function updateInfoPanels(state) {
  infoPanels.forEach((panel, i) => {
    if (!panel) return;
    let opacity = 0;
    if (i === state.activeIndex) {
      opacity = state.isLast ? 1 - state.outroProgress : 1 - state.transitionProgress;
      const stage = stageIndexFor(state.rotationProgress);
      panel.querySelectorAll('.info-stage').forEach((s) => {
        s.classList.toggle('active', Number(s.dataset.stage) === stage);
      });
    } else if (i === state.nextIndex) {
      opacity = state.transitionProgress;
      if (state.transitionProgress > 0.05) {
        panel.querySelectorAll('.info-stage').forEach((s) => {
          s.classList.toggle('active', s.dataset.stage === '0');
        });
      }
    } else {
      panel.querySelectorAll('.info-stage').forEach((s) => s.classList.remove('active'));
    }
    panel.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    panel.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
  });

  outroPanel.style.opacity = String(state.isLast ? state.outroProgress : 0);

  scrollCue.style.opacity = state.activeIndex === 0 && state.rotationProgress < 0.05 ? '1' : '0';
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
let lastActiveIndex = -1;

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const state = scrollState.read(latestScrollY);

  // --- lifecycle: make sure the active car is loaded, preload the next one
  //     once we're comfortably into the rotation phase.
  const activeRig = ensureRig(state.activeIndex);
  let nextRig = null;
  if (state.nextIndex != null && state.rotationProgress > 0.5) {
    nextRig = ensureRig(state.nextIndex);
  }

  const keep = new Set([state.activeIndex]);
  if (state.nextIndex != null) keep.add(state.nextIndex);
  cleanupRigs(keep);

  // --- drive the active car's yaw from scroll, and its exit position during transition
  if (activeRig && activeRig.loaded) {
    const config = CARS[state.activeIndex];
    activeRig.scrollYaw = config.baseYaw + config.yawSweep * state.rotationProgress;
    const exitDistance = 6.5;
    activeRig.targetX = state.isLast
      ? 0
      : config.exitDirection * exitDistance * state.transitionProgress;
  }

  // --- drive the incoming next car: enters from the opposite side, settles to center
  if (nextRig) {
    if (!nextRig.loaded) {
      // keep it invisible until ready so we never show a half-loaded/empty car
      nextRig.group.visible = false;
    } else {
      nextRig.group.visible = true;
      const activeConfig = CARS[state.activeIndex];
      const entryDistance = 6.5;
      const entryX = -activeConfig.exitDirection * entryDistance;
      nextRig.targetX = THREE.MathUtils.lerp(entryX, 0, state.transitionProgress);
      if (state.transitionProgress < 0.02) {
        // snap once, right as it appears, so it doesn't fly in from a stale position
        nextRig.displayX = entryX;
      }
    }
  }

  // --- update all loaded rigs (smoothing happens per-rig)
  for (const rig of rigs.values()) rig.update(dt);

  // --- camera: gently settle toward the active car's preferred framing
  const activeConfig = CARS[state.activeIndex];
  const camZ = THREE.MathUtils.lerp(sceneManager.camera.position.z, activeConfig.cameraDistance, 0.05);
  const camY = THREE.MathUtils.lerp(sceneManager.camera.position.y, activeConfig.cameraHeight, 0.05);
  sceneManager.camera.position.z = camZ;
  sceneManager.camera.position.y = camY;
  cameraTarget.set(0, 0.25, 0);
  sceneManager.camera.lookAt(cameraTarget);

  // --- UI
  updateInfoPanels(state);
  counterCurrentEl.textContent = String(state.activeIndex + 1).padStart(2, '0');

  const visibleForHotspots = [{ rig: activeRig, opacity: state.isLast ? 1 - state.outroProgress : 1 - state.transitionProgress }];
  if (nextRig) visibleForHotspots.push({ rig: nextRig, opacity: state.transitionProgress });
  updateHotspots(visibleForHotspots);

  if (state.activeIndex !== lastActiveIndex) {
    lastActiveIndex = state.activeIndex;
    if (!dragHintShown) {
      dragHint.classList.add('visible');
      dragHintShown = true;
      setTimeout(() => dragHint.classList.remove('visible'), 3200);
    }
  }

  sceneManager.render();
  requestAnimationFrame(loop);
}

init();
