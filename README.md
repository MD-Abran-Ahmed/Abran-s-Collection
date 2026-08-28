# MARQUE — Scroll-Driven 3D Car Showroom

A cinematic, scroll-controlled showroom for three cars: rotate → reveal specs →
slide away → next car enters. Built with vanilla ES modules + Three.js (no
build step required), structured so the interaction logic is reusable and a
4th/5th car is a one-line config change.

## Run it

Browsers block `fetch()` of local binary files (the `.glb` models) when a page
is opened directly as `file://`, so you need a tiny local server. From this
folder, run one of:

```bash
# Python 3
python3 -m http.server 8080

# Node (no install needed)
npx serve .

# VS Code
# Right-click index.html → "Open with Live Server"
```

Then open **http://localhost:8080** (or whatever port your server printed).

## How the interaction works

The whole thing is driven by one pure function: `ScrollState.read(scrollY)`
(`js/ScrollState.js`). It turns the raw scroll position into:

- `activeIndex` — which car is currently "on stage"
- `rotationProgress` (0→1) — how far through that car's rotate/reveal
  sequence we are
- `transitionProgress` (0→1) — only starts once `rotationProgress` hits 1;
  drives the horizontal exit/entry swap with the next car
- `nextIndex` — the car being preloaded/entering

Everything downstream (`js/main.js`) just reacts to that state every frame:
rotate the active car, fade in the right spec panel, and — only once
`rotationProgress === 1` — start sliding cars horizontally.

Each car is a self-contained `CarRig` (`js/CarRig.js`): it loads its own GLB,
normalizes it to a consistent size/position so all three cars frame
consistently regardless of their original modeling scale, exposes a yaw it
can be rotated to, and disposes its geometries/materials/textures cleanly
when it's no longer needed.

## Adding a 4th car

Append an entry to the `CARS` array in `js/config.js` (URL, exit direction,
target size, hotspots, spec copy). Add a matching `#info-N` panel block in
`index.html` and a `<section class="car-section">` spacer. Nothing in the
scroll/rotation/transition logic needs to change.

## Notes / tuning knobs

- `ROTATION_END` in `config.js` controls what fraction of each car's scroll
  distance is spent rotating vs. transitioning (currently 72% / 28%).
- `SECTION_HEIGHT_VH` controls how much scroll distance each car gets —
  raise it for a slower, more deliberate rotation.
- Per-car `baseYaw` / `yawSweep` in `config.js` control the starting 3/4
  angle and how far the car sweeps around as you scroll. If a model's
  "front" faces the wrong way, adjust `baseYaw` for that car.
- Hotspot positions (`hotspots: [{ type, pos: [x,y,z] }]`) are fractional
  offsets (-1…1) from the car's bounding-box center, not exact mesh
  attachment points — the GLBs don't expose named parts, so these are
  reasonable approximations. Nudge the numbers if a dot lands oddly.
- Quality auto-detects from `navigator.hardwareConcurrency` /
  `deviceMemory` / coarse-pointer to pick a low/medium/high preset
  (pixel ratio cap, shadows on/off, antialiasing) — see
  `js/SceneManager.js`.
- Manual rotation: mouse-drag always works; touch-drag only engages once a
  swipe is clearly more horizontal than vertical, so vertical scrolling on
  mobile is never hijacked.
