// ---------------------------------------------------------------------------
// Central config for every car in the collection.
// Add a 4th / 5th car by appending another object to this array —
// nothing else in the app needs to change.
// ---------------------------------------------------------------------------

export const HOTSPOT_COPY = {
  headlight: {
    label: 'LIGHTING',
    body: 'Forward lighting cluster, positioned for both visibility and the car\u2019s signature face.'
  },
  wheel: {
    label: 'WHEELS',
    body: 'Lightweight wheel design, chosen to shed unsprung mass and sharpen turn-in response.'
  },
  wing: {
    label: 'AERODYNAMICS',
    body: 'Track-focused aerodynamic elements designed to improve stability and cornering performance.'
  },
  splitter: {
    label: 'FRONT SPLITTER',
    body: 'Manages airflow beneath the nose, balancing front-end grip against the rear aero package.'
  },
  exhaust: {
    label: 'EXHAUST',
    body: 'Tuned exhaust routing, engineered as much for sound character as for flow efficiency.'
  },
  bodyline: {
    label: 'BODY LINE',
    body: 'A defining surface crease that carries the car\u2019s silhouette from nose to tail.'
  },
  intake: {
    label: 'AIR INTAKE',
    body: 'Feeds cooling air to the drivetrain — a functional cue borrowed straight from motorsport.'
  }
};

export const CARS = [
  {
    id: 'lotus',
    url: 'models/lotus.glb',
    // Direction the car exits toward when its section completes. Alternates per car.
    exitDirection: -1,
    // Base yaw (radians) for the opening 3/4 front view, and total sweep applied across the section.
    baseYaw: Math.PI * 0.22,
    yawSweep: -Math.PI * 1.3,
    // Target size (largest bounding-box dimension, in scene units) the model is normalized to.
    targetSize: 3.6,
    cameraDistance: 7.2,
    cameraHeight: 1.35,
    hotspots: [
      { type: 'headlight', pos: [0.62, 0.05, 0.92] },
      { type: 'wheel',     pos: [0.55, -0.28, 0.55] },
      { type: 'wing',      pos: [-0.05, 0.22, -0.95] },
      { type: 'splitter',  pos: [0.0, -0.42, 0.98] },
      { type: 'intake',    pos: [-0.5, -0.05, 0.15] }
    ],
    meta: {
      eyebrow: '2016',
      name: ['LOTUS', 'EXIGE 360 CUP'],
      tagline: 'LIGHTWEIGHT / TRACK-FOCUSED',
      specs: [
        { label: 'POWER', value: '360', unit: 'HP' },
        { label: 'ENGINE', value: '3.5L', unit: 'SUPERCHARGED V6' },
        { label: 'DRIVETRAIN', value: 'RWD', unit: 'REAR WHEEL DRIVE' }
      ]
    }
  },
  {
    id: 'porsche',
    url: 'models/porsche.glb',
    exitDirection: 1,
    baseYaw: Math.PI * 0.22,
    yawSweep: -Math.PI * 1.3,
    targetSize: 3.9,
    cameraDistance: 7.6,
    cameraHeight: 1.35,
    hotspots: [
      { type: 'headlight', pos: [0.58, 0.02, 0.95] },
      { type: 'wheel',     pos: [0.6, -0.3, 0.5] },
      { type: 'wing',      pos: [0.0, 0.34, -0.98] },
      { type: 'exhaust',   pos: [0.22, -0.32, -0.98] },
      { type: 'intake',    pos: [-0.55, -0.02, -0.35] }
    ],
    meta: {
      eyebrow: '2023',
      name: ['PORSCHE', '911 GT3 RS'],
      tagline: 'RACE-DERIVED / AERO OBSESSED',
      specs: [
        { label: 'POWER', value: '525', unit: 'HP' },
        { label: 'ENGINE', value: '4.0L', unit: 'NATURALLY ASPIRATED FLAT-6' },
        { label: 'DRIVETRAIN', value: 'RWD', unit: 'REAR WHEEL DRIVE' }
      ]
    }
  },
  {
    id: 'datsun',
    url: 'models/datsun.glb',
    exitDirection: -1,
    baseYaw: Math.PI * 0.22,
    yawSweep: -Math.PI * 1.3,
    targetSize: 3.9,
    cameraDistance: 7.6,
    cameraHeight: 1.3,
    hotspots: [
      { type: 'headlight', pos: [0.55, 0.0, 0.92] },
      { type: 'wheel',     pos: [0.55, -0.3, 0.5] },
      { type: 'bodyline',  pos: [-0.62, -0.05, 0.0] },
      { type: 'exhaust',   pos: [0.2, -0.34, -0.95] }
    ],
    meta: {
      eyebrow: '1972',
      name: ['DATSUN', '240K GT'],
      tagline: 'JAPANESE CLASSIC / ANALOG & HONEST',
      specs: [
        { label: 'POWER', value: '130', unit: 'HP' },
        { label: 'ENGINE', value: '2.4L', unit: 'SOHC INLINE-6' },
        { label: 'DRIVETRAIN', value: 'RWD', unit: 'REAR WHEEL DRIVE' }
      ]
    }
  }
];

// Fraction of each section's scroll distance spent rotating + revealing details
// before the horizontal exit transition begins.
export const ROTATION_END = 0.72;

// Multiplier applied to viewport height to get the scrollable height of one car section.
export const SECTION_HEIGHT_VH = 320;
