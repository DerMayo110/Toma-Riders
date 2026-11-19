'use strict';

/* Strecken: Definitionen (Zonen, Abschnitte, Kulissen) + Aufbau der Segmentliste. */

let segments = [];
let TRACK_LEN = 0;
let track = null;            // aktuell geladene Streckendefinition

function findSegment(z) {
  return segments[Math.floor(mod(z, TRACK_LEN) / SEG_LEN) % segments.length];
}

function roadYAt(z) {
  const s = findSegment(z);
  const t = mod(z, SEG_LEN) / SEG_LEN;
  return lerp(s.p1.world.y, s.p2.world.y, t);
}


/* ================= Zonen ================= */

/* Zone: Boden-/Fahrbahnfarben (hell, dunkel), Randstreifen, Leitplanke, Kulissenregeln */
const zoneDef = (name, g1, g2, r1, r2, rumB, rail, scenery) => ({ name, g1, g2, r1, r2, rumA: '#f2f5f9', rumB, rail, scenery });

/* Kulissenregel: alle e Segmente (Phase ph) Sprite s im Abstand a..b (in Streckenhalbbreiten) */
const S = (e, ph, s, a, b, o) => Object.assign({ e, ph, s, a, b: b == null ? a : b, p: 1, both: false }, o);

const TOWERS = ['tower1', 'tower2', 'tower3', 'tower4', 'tower5'];
const BB = ['bb1', 'bb2', 'bb3', 'bb4'];
const GB = ['gb1', 'gb2', 'gb3', 'gb4'];
const STELE = ['stele1', 'stele2', 'stele3'];

const Z_SKY = [
  zoneDef('Skyline Boulevard', '#a9bfca', '#9db4c1', '#646c79', '#5d6572', '#22c7e8', '#5ef2ff', [
    S(7, 0, TOWERS, 2.7, 5.9), S(13, 5, TOWERS, 6.5, 11.5), S(47, 20, BB, 1.95), S(9, 4, 'palm', 1.6, 2.0, { p: 0.5 }),
  ]),
  zoneDef('Bay Bridge', '#2f95de', '#2a8bd2', '#6b7281', '#646b7a', '#ff8a3c', '#ffd27a', [
    S(36, 0, 'pylon', 1.5, 1.5, { both: true }), S(17, 3, 'boat', 3.5, 12.5, { p: 0.6 }),
  ]),
  zoneDef('Neon Park', '#60c975', '#56be6b', '#606774', '#59616d', '#ff4fa3', '#ff9fd0', [
    S(3, 0, ['tree1', 'tree1', 'tree1', 'tree2'], 1.65, 6.65), S(5, 2, ['palm', 'tree1'], 5, 11), S(53, 30, BB, 2.0),
  ]),
];

const Z_PIR = [
  zoneDef('Hafenkai', '#d9c9a3', '#d0bf97', '#6a6f7b', '#636874', '#1fa8e0', '#7fe8ff', [
    S(6, 0, 'house', 2.0, 5.5), S(11, 4, 'house', 6, 11), S(19, 7, 'col', 1.45, 1.45, { both: true }), S(47, 20, GB, 1.95), S(8, 3, 'olive', 1.6, 2.4, { p: 0.5 }),
  ]),
  zoneDef('Mole', '#2389d6', '#1f7fca', '#6b7281', '#646b7a', '#ffb13c', '#ffe08a', [
    S(14, 2, 'ship', 2.6, 11, { p: 0.75 }), S(30, 0, 'col', 1.45, 1.45, { both: true }), S(120, 60, 'statue', 2.2),
  ]),
  zoneDef('Altstadt', '#e9e2cf', '#e0d8c2', '#676c78', '#606571', '#e2574c', '#ffb9a8', [
    S(4, 0, 'house', 2.0, 5), S(9, 5, 'house', 5.5, 10), S(7, 3, 'cypress', 1.45, 2.4), S(60, 30, 'temple', 3.2, 4), S(53, 12, GB, 1.95),
  ]),
];

const Z_AKR = [
  zoneDef('Agora', '#d8b98a', '#cfaf80', '#5f5a66', '#585360', '#ffb13c', '#ffd27a', [
    S(9, 0, 'col', 1.45, 1.45, { both: true }), S(40, 20, ['temple', 'temple2'], 2.9, 4.2), S(47, 11, GB, 1.95), S(7, 3, 'olive', 2.0, 6),
  ]),
  zoneDef('Heiliger Weg', '#8fae62', '#86a55a', '#5d5c62', '#56555b', '#b85c38', '#c9f58a', [
    S(3, 0, 'olive', 1.6, 6.5), S(5, 2, 'cypress', 1.5, 8), S(23, 9, 'colb', 1.45, 2.2), S(70, 35, 'statue', 2.2, 2.8),
  ]),
  zoneDef('Akropolis', '#efe6d2', '#e6dcc6', '#62606a', '#5b5963', '#19c9e8', '#7ff3ff', [
    S(22, 0, ['temple', 'temple2'], 2.9, 4.6), S(6, 3, 'col', 1.45, 1.45, { both: true }), S(55, 30, 'statue', 2.0, 2.4), S(11, 5, 'cypress', 5, 9),
  ]),
];

const Z_THE = [
  zoneDef('Der Pass', '#b5653f', '#aa5c38', '#5c545a', '#554d53', '#ffd23d', '#ffb347', [
    S(5, 0, 'rock', 2.0, 6), S(9, 4, 'rock2', 4, 11), S(17, 8, 'spears', 1.5, 1.8), S(61, 30, GB, 1.95),
  ]),
  zoneDef('Schmiede des Hephaistos', '#2b2026', '#33252a', '#4f4a52', '#48434b', '#ff5a1f', '#ff7a3c', [
    S(8, 0, 'forge', 1.9, 6), S(11, 5, 'rock', 6, 10), S(12, 6, 'brazierF', 1.3, 1.3, { both: true }),
  ]),
  zoneDef('Bronzefeld', '#8f6a3a', '#86622f', '#5a5458', '#534d51', '#e23b3b', '#ff9f7a', [
    S(4, 0, 'spears', 1.5, 3.6), S(45, 20, 'statue', 2.0, 2.6), S(13, 6, 'rock', 4.5, 10), S(21, 10, 'col', 1.45, 1.45, { both: true }),
  ]),
];

const Z_KNO = [
  zoneDef('Palasttor', '#3a2f4a', '#342a43', '#4a4c5e', '#444658', '#ff3d81', '#ff7ab0', [
    S(8, 0, 'mcol', 1.45, 1.45, { both: true }), S(12, 5, 'wall', 2.3, 3.2), S(60, 30, 'bull', 2.0, 2.6), S(9, 3, 'cypress', 4, 8),
  ]),
  zoneDef('Irrgarten', '#1d2440', '#192038', '#454a60', '#3f4459', '#19e3ff', '#5ef2ff', [
    S(6, 0, 'wall', 1.95, 1.95, { both: true }), S(9, 4, 'wall', 4.5, 8), S(80, 40, 'bull', 2.0),
  ]),
  zoneDef('Stierhof', '#4a2a2a', '#432525', '#4f4a55', '#48434e', '#ffd23d', '#ffcf6a', [
    S(6, 0, 'mcol', 1.45, 1.45, { both: true }), S(30, 15, 'bull', 2.0, 3.0), S(10, 5, 'wall', 3.5, 6),
  ]),
];

const Z_STY = [
  zoneDef('Asphodeloswiese', '#3f4a52', '#394349', '#3a3d47', '#343741', '#7dffd8', '#9dffe6', [
    S(5, 0, 'dead', 1.6, 6), S(6, 3, STELE, 1.35, 3), S(4, 1, 'wisp', 1.3, 5, { p: 0.6 }), S(70, 35, 'skull', 2.2, 3),
  ]),
  zoneDef('Styx', '#0c2a2a', '#0a2424', '#3d4049', '#373a43', '#b06aff', '#c9a0ff', [
    S(20, 0, 'charon', 2.4, 10, { p: 0.8 }), S(3, 1, 'wisp', 1.3, 8, { p: 0.5 }), S(25, 12, 'dcol', 1.45, 1.45, { both: true }),
  ]),
  zoneDef('Tor zum Tartaros', '#2a1620', '#24121b', '#403a42', '#39343b', '#ff3d3d', '#ff8a8a', [
    S(16, 0, 'skull', 2.2, 5), S(4, 2, STELE, 1.35, 3.5), S(7, 3, 'dead', 2, 7),
  ]),
];

const Z_OLY = [
  zoneDef('Wolkentor', '#f6f4ff', '#ecebfa', '#70748a', '#696d83', '#ffd23d', '#fff0a0', [
    S(3, 0, 'puff', 2.0, 7), S(12, 6, 'gcol', 1.45, 1.45, { both: true }), S(50, 25, 'gtemple', 3.0, 5),
  ]),
  zoneDef('Halle der Götter', '#f3e2b0', '#ead8a2', '#6c6a78', '#656371', '#ff8a3c', '#ffe08a', [
    S(5, 0, 'gcol', 1.45, 1.45, { both: true }), S(24, 12, 'gtemple', 3.0, 5.5), S(36, 18, 'gstatue', 2.0, 2.6), S(4, 2, 'puff', 6, 11),
  ]),
  zoneDef('Blitzkamm', '#8f95b8', '#868cb0', '#5e6278', '#575b71', '#19e3ff', '#b0f4ff', [
    S(9, 0, 'rod', 1.4, 3), S(4, 2, 'puff', 2.0, 8), S(15, 7, 'gcol', 1.45, 1.45, { both: true }),
  ]),
];

/* Tartaros: alle Orte stürzen ineinander – Zonen aus den anderen Strecken, dazu Sanduhren */
const rift = (z, name) => Object.assign({}, z, { name, rail: '#d0a0ff', scenery: z.scenery.concat([S(40, 19, 'hourglass', 2.2, 3.5)]) });
const Z_TAR = [
  rift(Z_OLY[1], 'Riss: Olymp'), rift(Z_PIR[0], 'Riss: Piräus'), rift(Z_AKR[2], 'Riss: Akropolis'),
  rift(Z_THE[1], 'Riss: Schmiede'), rift(Z_KNO[1], 'Riss: Labyrinth'), rift(Z_STY[1], 'Riss: Styx'),
];

/* ================= Streckenliste =================
   Abschnitt:  [Einfahrt, Halten, Ausfahrt, Kurve, Hügel, Optionen]   oder   { loop: Segmente, zone }
   Kurve: +rechts/−links (2 leicht … 6 hart, 7–9 Haarnadel: ohne Drift trägt es dich an die Bande)
   Hügel in Segmentlängen, 'home' = zurück auf Höhe 0. Kurze, steile Hügel werden zu Sprungkuppen.
   Optionen: zone (Zonenwechsel) · ramp (Schanze am Ende, Stärke 1 … 1.8) · gap (Schlucht dahinter, in Segmenten)
             kind ('pads' | 'slalom' | 'orbs')
   abyss: Farben der Schluchten [Grund, Wand] */

let loops = [];                // Loopings der geladenen Strecke

const LOOP_SHIFT = 4800;       // seitlicher Versatz zwischen Ein- und Ausfahrt eines Loopings
const GAP_DEPTH = 1500;        // Tiefe der Schluchten
const KICK_SLOPE = 0.283;      // Steigung einer Schanze der Stärke 1 (hebt bei Höchsttempo mit JUMP_V ab)
const LAND_LEN = 34;           // gerade Landezone hinter einer Schlucht

const BRAZIER = { s: 'brazier', e: 16, x: 1.3 };

const TRACKS = [
  {
    id: 'sky', name: 'Neo-Skyline', sub: 'Heimstrecke · mittel', theme: 'city', tune: 0, arch: 'arch', obst: 'barrier',
    lamp: { s: 'lamp', e: 22, x: 0.95, flip: true }, zones: Z_SKY, seed: 4711, danger: 0.5, abyss: ['#1668b8', '#2a3550'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 50, 30, 3, 6],
      [20, 30, 20, 0, 0, { kind: 'pads' }],
      { loop: 140 },
      [40, 60, 40, -5, 14],
      [25, 25, 25, 4, 0],
      [25, 25, 25, -4, 0],
      [20, 40, 20, 0, 6, { ramp: 1.2, gap: 14, zone: 1 }],
      [40, 80, 40, 6, -12],
      [15, 20, 15, 0, 9],
      [15, 20, 15, 0, -9],
      [30, 60, 30, -7, 0, { zone: 2 }],
      [20, 50, 20, 0, 0, { kind: 'slalom' }],
      [20, 40, 20, 0, 8, { ramp: 1.6 }],
      [40, 40, 40, 0, -16],
      [40, 70, 40, 5, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'piraeus', name: 'Hafen von Piräus', sub: 'Hellas · leicht', theme: 'hellasDay', tune: 1, arch: 'archG', obst: 'amph',
    lamp: BRAZIER, zones: Z_PIR, seed: 11, danger: 0.3, abyss: ['#1479c4', '#8a7a5a'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 50, 30, 3, 0],
      [20, 40, 20, 0, 8, { ramp: 1 }],
      [30, 40, 30, 0, -8],
      [30, 60, 30, -4, 6],
      [20, 40, 20, 0, 0, { zone: 1, kind: 'pads' }],
      { loop: 130 },
      [40, 80, 40, 5, 0],
      [20, 50, 20, 0, 0, { kind: 'slalom' }],
      [20, 40, 20, 0, 6, { ramp: 1.1, gap: 10 }],
      [30, 50, 30, -5, 0, { zone: 2 }],
      [25, 25, 25, 4, 0],
      [25, 25, 25, -4, 0],
      [15, 20, 15, 0, 8],
      [20, 30, 20, 0, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'akropolis', name: 'Akropolis-Ring', sub: 'Athen · mittel', theme: 'hellasDusk', tune: 1, arch: 'archG', obst: 'amph',
    lamp: BRAZIER, zones: Z_AKR, seed: 23, danger: 0.5, abyss: ['#2a1e30', '#7a5f48'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 60, 30, -4, 14],
      [20, 40, 20, 0, 0, { kind: 'pads' }],
      { loop: 140 },
      [40, 70, 40, 6, 18, { zone: 1 }],
      [25, 30, 25, -5, 0],
      [25, 30, 25, 5, 0],
      [20, 50, 20, 0, 10, { ramp: 1.5, gap: 20, zone: 2 }],
      [40, 40, 40, 0, -30],
      [40, 80, 40, -7, 0],
      [20, 60, 20, 0, 0, { kind: 'slalom' }],
      [15, 20, 15, 0, 10],
      [15, 20, 15, 0, -10],
      [30, 50, 30, 6, -12],
      [20, 40, 20, 0, 8, { ramp: 1.1 }],
      [40, 60, 40, -4, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'thermo', name: 'Thermopylen-Schmiede', sub: 'Sparta · schwer', theme: 'canyon', tune: 2, arch: 'archG', obst: 'amph',
    lamp: { s: 'brazierF', e: 16, x: 1.3 }, zones: Z_THE, seed: 37, danger: 0.7, abyss: ['#ff5a1f', '#3a1a14'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 40, 30, 5, 0],
      [30, 40, 30, -5, 10],
      [20, 50, 20, 0, 10, { ramp: 1.5, gap: 22 }],
      [40, 40, 40, 0, -26, { zone: 1 }],
      [40, 80, 40, 8, 0],
      [20, 40, 20, 0, 0, { kind: 'pads' }],
      { loop: 140 },
      { loop: 120 },
      [40, 60, 40, -6, 14],
      [25, 25, 25, 5, 0],
      [25, 25, 25, -5, 0],
      [25, 25, 25, 5, 0],
      [15, 20, 15, 0, 11, { zone: 2 }],
      [15, 20, 15, 0, -11],
      [40, 80, 40, -8, 0],
      [20, 50, 20, 0, 0, { kind: 'slalom' }],
      [20, 40, 20, 0, 8, { ramp: 1.2 }],
      [30, 50, 30, 4, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'knossos', name: 'Labyrinth von Knossos', sub: 'Kreta · schwer', theme: 'night', tune: 3, arch: 'archG', obst: 'amph',
    lamp: BRAZIER, zones: Z_KNO, seed: 41, danger: 0.6, abyss: ['#07060f', '#2a2140'],
    sections: [
      [0, 40, 0, 0, 0],
      [25, 30, 25, 6, 0],
      [25, 30, 25, -6, 0],
      [20, 30, 20, 0, 0, { kind: 'orbs' }],
      [30, 60, 30, 8, 0, { zone: 1 }],
      [25, 25, 25, -7, 0],
      [25, 25, 25, 7, 0],
      [20, 40, 20, 0, 8, { ramp: 1.3, gap: 16 }],
      [30, 30, 30, 0, -8],
      [40, 80, 40, -9, 0],
      { loop: 130 },
      [30, 40, 30, 6, 0, { zone: 2 }],
      [15, 20, 15, 0, 10],
      [15, 20, 15, 0, -10],
      [30, 40, 30, -6, 8],
      [20, 50, 20, 0, 0, { kind: 'slalom' }],
      [30, 60, 30, -7, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'styx', name: 'Ufer des Styx', sub: 'Unterwelt · schwer', theme: 'underworld', tune: 4, arch: 'archG', obst: 'amph',
    lamp: { s: 'brazierG', e: 16, x: 1.3 }, zones: Z_STY, seed: 53, danger: 0.7, abyss: ['#0f6a5a', '#152a2a'],
    sections: [
      [0, 50, 0, 0, 0],
      [40, 80, 40, -4, -20],
      [15, 20, 15, 0, 10],
      [15, 20, 15, 0, -10],
      [15, 20, 15, 0, 10],
      [15, 20, 15, 0, -10],
      [50, 100, 50, 7, -10, { zone: 1 }],
      [20, 40, 20, 0, 0, { kind: 'pads' }],
      { loop: 150 },
      [30, 40, 30, -8, 0],
      [30, 40, 30, 8, 0],
      [20, 50, 20, 0, 12, { ramp: 1.7, gap: 26 }],
      [40, 50, 40, 0, -24, { zone: 2 }],
      [40, 80, 40, -6, 10],
      [20, 50, 20, 0, 0, { kind: 'slalom' }],
      { loop: 120 },
      [40, 60, 40, 5, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'olymp', name: 'Gipfel des Olymp', sub: 'Über den Wolken · sehr schwer', theme: 'olymp', tune: 5, arch: 'archG', obst: 'amph',
    lamp: BRAZIER, zones: Z_OLY, seed: 67, danger: 0.6, abyss: ['#9fd0ff', '#e4e6f6'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 60, 30, 4, 24],
      [20, 40, 20, 0, 10, { ramp: 1.6, gap: 24 }],
      [40, 40, 40, 0, -28],
      [50, 90, 50, -7, 12, { zone: 1 }],
      [20, 40, 20, 0, 0, { kind: 'pads' }],
      { loop: 150 },
      [30, 30, 30, 6, 0],
      [30, 30, 30, -6, 0],
      [15, 20, 15, 0, 12],
      [15, 20, 15, 0, -12],
      [20, 50, 20, 0, 10, { ramp: 1.4, zone: 2 }],
      [40, 50, 40, 0, -26],
      [50, 80, 50, 8, 0],
      [20, 60, 20, 0, 0, { kind: 'slalom' }],
      { loop: 130 },
      [40, 60, 40, -5, 14],
      [20, 40, 20, 0, 8, { ramp: 1.7, gap: 28 }],
      [40, 50, 40, 0, -22],
      [40, 60, 40, 4, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
  {
    id: 'tartaros', name: 'Tartaros – Der Zeitriss', sub: 'Jenseits der Zeit · brutal', theme: 'void', tune: 6, arch: 'archG', obst: 'amph', locked: true,
    lamp: { s: 'brazierG', e: 16, x: 1.3 }, zones: Z_TAR, seed: 79, danger: 0.8, abyss: ['#12001f', '#3a155a'],
    sections: [
      [0, 50, 0, 0, 0],
      [30, 50, 30, 6, 0, { zone: 1 }],
      [30, 50, 30, -6, 12],
      [20, 40, 20, 0, 8, { ramp: 1.6, gap: 26, zone: 2 }],
      [40, 40, 40, 0, -28],
      [50, 80, 50, 9, 0, { zone: 3 }],
      [25, 25, 25, -7, 0],
      [25, 25, 25, 7, 0],
      [25, 25, 25, -7, 0],
      { loop: 150 },
      { loop: 120 },
      [20, 60, 20, 0, 0, { kind: 'slalom', zone: 4 }],
      [40, 70, 40, -8, 14],
      [15, 20, 15, 0, 12],
      [15, 20, 15, 0, -12],
      [20, 40, 20, 0, 8, { ramp: 1.8, gap: 30, zone: 5 }],
      [40, 40, 40, 0, -30],
      [40, 60, 40, 6, 0],
      [20, 50, 20, 0, 0, { kind: 'pads', zone: 0 }],
      { loop: 130 },
      [30, 50, 30, -4, 'home'],
      [0, 40, 0, 0, 0],
    ],
  },
];

const trackById = id => TRACKS.find(t => t.id === id) || TRACKS[0];

/* ================= Automatische Objekt-Platzierung ================= */

function autoProps(p, secs, def) {
  const R = mulberry32((def.seed || 1) * 97);
  const kinds = ['pads', 'slalom', 'orbs'];
  let straightN = 0;
  secs.forEach((sc, si) => {
    const { start, len, enter, hold, leave, curve, hill, o } = sc;
    if (si === 0) { p.orbs(start + 22, 5, 5, 0); return; }                 // Startgerade
    if (si === secs.length - 1 || o.auto) return;                           // Zielgerade, Loopings und Landezonen: separat bestückt

    const hard = Math.abs(curve) >= 7;
    if (hard) {                                                             // Haarnadel: Warnschilder außen
      for (let i = start + (enter >> 1); i < start + enter + hold; i += 9) p.sign(i, 'chev', curve > 0 ? -1.42 : 1.42, curve < 0);
    }
    if (o.ramp) {                                                           // Anlauf zur Schanze
      p.pad(start + Math.floor(len * 0.25), 0, o.gap ? 0.5 : 0.2);
      p.orbs(start + Math.floor(len * 0.42), 4, 5, 0);
      return;
    }
    const prev = secs[si - 1].o;
    if (prev.ramp || prev.landing) {                                        // hier wird noch geflogen bzw. gelandet
      p.orbs(start + Math.floor(len * 0.62), 5, 5, Math.abs(curve) >= 2 ? (curve > 0 ? 0.5 : -0.5) : 0);
      return;
    }
    if (Math.abs(curve) >= 2) {                                             // Kurve: Orbs auf der Innenbahn
      const inside = curve > 0 ? 0.52 : -0.52;
      const n = clamp(Math.floor((hold + leave * 0.5) / 7), 4, 12);
      p.orbs(start + Math.floor(enter * 0.8), n, 7, inside);
      if (!hard && len >= 120 && R() < (def.danger || 0.5)) p.barrier(start + enter + Math.floor(hold * 0.75), -inside * 0.5);
      return;
    }
    if (Math.abs(hill) >= 7 && len <= 60) {                                 // Sprungkuppe oder Senke
      p.orbs(start + 6, Math.floor((len - 10) / 6), 6, 0);
      return;
    }

    const kind = o.kind || kinds[straightN++ % 3];                          // Gerade
    if (kind === 'pads') {
      p.pad(start + 14, R() < 0.5 ? -0.45 : 0.45);
      p.orbs(start + 28, clamp(Math.floor((len - 44) / 6), 2, 6), 6, 0);
      if (len >= 90) p.pad(start + len - 30, 0);
    } else if (kind === 'slalom') {
      const xs = [0.5, -0.5, 0, 0.6, -0.6, 0.25, -0.25];
      let k = si;
      for (let i = start + 18; i < start + len - 12; i += 26, k++) {
        const x = xs[k % xs.length];
        p.barrier(i, x);
        p.orbs(i - 4, 3, 4, x > 0.1 ? x - 0.5 : x < -0.1 ? x + 0.5 : 0.5);
      }
    } else {
      p.orbs(start + 10, Math.floor((len - 20) / 6), 6, k => 0.5 * Math.sin(k * 0.7 + si));
    }
  });
}

/* ================= Aufbau ================= */

function loadTrack(id) {
  const def = trackById(id);
  track = def;
  segments = [];
  loops = [];
  let zone = 0, baseY = 0;     // baseY: Höhe der Fahrbahn ohne Schanzen und Schluchten
  const bounds = [];           // [Segment, alte Zone, neue Zone]
  const secs = [], kicks = [];

  const lastY = () => (segments.length ? segments[segments.length - 1].p2.world.y : 0);
  const pt = (y, z) => ({ world: { y, z } });

  function addSeg(curve, y) {
    const n = segments.length;
    segments.push({
      index: n,
      p1: pt(lastY(), n * SEG_LEN),
      p2: pt(y, (n + 1) * SEG_LEN),
      curve, zone,
      dark: Math.floor(n / RUMBLE_LEN) % 2 === 1,
      sprites: [],
      pad: null, ramp: false, launch: 0, gap: false, wall: false, loop: null, hz: null, hzHead: null,
      col: null,
    });
  }

  function road(enter, hold, leave, curve, hill, o) {
    o = o || {};
    const start = segments.length, y0 = baseY;
    const hl = hill === 'home' ? -y0 / SEG_LEN : hill;
    const y1 = y0 + hl * SEG_LEN, total = enter + hold + leave;
    let k = 0;
    const y = () => easeInOut(y0, y1, ++k / total);
    for (let n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), y());
    for (let n = 0; n < hold; n++) addSeg(curve, y());
    for (let n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), y());
    baseY = y1;
    secs.push({ start, len: total, enter, hold, leave, curve, hill: hl, o });
    if (o.ramp) kicker(o.ramp, o.gap || 0);
    return start;
  }

  /* Schanze: Keil auf den letzten Segmenten des Abschnitts; dahinter fällt die Fahrbahn zurück auf baseY.
     Mit gap folgt eine Schlucht samt gerader Landezone. Abgehoben wird rein physikalisch (siehe checkLaunch). */
  function kicker(power, gap) {
    const nK = power > 1.3 ? 14 : 10;
    const rise = KICK_SLOPE * power * SEG_LEN;
    const first = segments.length - nK;
    for (let k = 0; k < nK; k++) {
      const s = segments[first + k];
      s.p1.world.y += rise * k;
      s.p2.world.y += rise * (k + 1);
      s.ramp = true;
    }
    const lip = segments.length - 1;
    segments[lip].launch = power;
    kicks.push({ lip, power, height: rise * nK });
    if (!gap) return;
    const a = segments.length;
    road(0, gap + 2 + LAND_LEN, 0, 0, 0, { auto: true, landing: true });
    for (let i = 0; i <= gap + 1; i++) {
      const s = segments[a + i];
      s.gap = true;
      if (i > 0) s.p1.world.y -= GAP_DEPTH;
      if (i <= gap) s.p2.world.y -= GAP_DEPTH;
    }
    segments[a + gap + 1].wall = true;
  }

  /* Looping: in der Segmentliste eine flache Gerade (n Segmente = Umfang); world3d.js legt sie als Ring in den Raum.
     i0 = erstes Segment, R = Radius, S = seitlicher Versatz zwischen Ein- und Ausfahrt. */
  function loop(n) {
    road(0, 26, 0, 0, 0, { auto: true });
    const i0 = segments.length, R = n * SEG_LEN / TAU;
    const L = { i0, n, R, S: LOOP_SHIFT };
    for (let k = 0; k < n; k++) {
      addSeg(0, baseY);
      segments[segments.length - 1].loop = L;
    }
    secs.push({ start: i0, len: n, enter: 0, hold: n, leave: 0, curve: 0, hill: 0, o: { auto: true, loop: true } });
    loops.push(L);
    road(0, 18, 0, 0, 0, { auto: true });
  }

  function setZone(i) {
    if (i === zone) return;
    bounds.push([segments.length, zone, i]);
    zone = i;
  }

  for (const s of def.sections) {
    if (Array.isArray(s)) {
      const o = s[5] || {};
      if (o.zone != null) setZone(o.zone);
      road(s[0], s[1], s[2], s[3], s[4], o);
    } else {
      if (s.zone != null) setZone(s.zone);
      loop(s.loop);
    }
  }

  const N = segments.length;
  segments[N - 1].p2.world.y = segments[0].p1.world.y;
  TRACK_LEN = N * SEG_LEN;

  /* ---------- Bezugshöhe (s.ref): die Fahrbahn ohne Schanzen und Schluchten. Daran richtet sich die Kamera aus,
     damit das Bild an Schanzen- und Abbruchkanten nicht zuckt. ---------- */
  for (let i = 0; i < N; i++) {
    const s = segments[i];
    s.ref = s.p1.world.y + (s.gap && segments[(i - 1 + N) % N].gap ? GAP_DEPTH : 0);
  }
  for (let i = 1; i < N; i++) {
    if (!segments[i].ramp || segments[i - 1].ramp) continue;
    let j = i;
    while (j < N - 1 && segments[j].ramp) j++;             // j = Segment hinter der Kante; es beginnt noch oben
    const end = Math.min(j + 1, N - 1);                    // erst danach liegt die Bahn wieder auf Grundhöhe
    for (let m = i + 1; m < end; m++) segments[m].ref = lerp(segments[i].ref, segments[end].ref, (m - i) / (end - i));
  }

  /* ---------- Kulissen ---------- */
  const add = (i, name, x, extra) => {
    const sp = Object.assign({ name, x, yOff: 0, flip: false, solid: false, pick: false, gone: 0, seed: i }, extra);
    segments[mod(i, N)].sprites.push(sp);
    return sp;
  };
  const R = mulberry32(def.seed || 4711);
  const pick = s => (Array.isArray(s) ? s[(R() * s.length) | 0] : s);
  const L = def.lamp;
  for (let i = 0; i < N; i++) {
    const sg = segments[i];
    if (sg.gap) continue;                                   // in der Schlucht steht nichts
    if (L && !sg.loop) {
      if (i % L.e === 0) add(i, L.s, -L.x, { flip: !!L.flip });
      if (i % L.e === (L.e >> 1)) add(i, L.s, L.x);
    }
    for (const r of def.zones[sg.zone].scenery) {
      if (i % r.e !== r.ph) continue;
      if (r.p < 1 && R() >= r.p) continue;
      const name = pick(r.s);
      const off = r.a + R() * (r.b - r.a);
      if (r.both) { add(i, name, -off); add(i, name, off); }
      else add(i, name, (R() < 0.5 ? -1 : 1) * off);
    }
  }
  add(1, def.arch, 0);

  /* Platz für die Ringe schaffen: die Ausfahrt liegt LOOP_SHIFT rechts neben der Einfahrt */
  for (const lp of loops) {
    const span = Math.ceil(lp.R / SEG_LEN) + 4;
    for (let i = lp.i0 - span; i < lp.i0 + span; i++) {
      const sg = segments[mod(i, N)];
      sg.sprites = sg.sprites.filter(sp => (i < lp.i0 ? sp.x < 0.9 || sp.x > 3.8 : sp.x > -0.9 || sp.x < -3.8));
    }
  }

  /* ---------- Objekte auf der Strecke ---------- */
  const p = {
    orbs(i, n, step, xf) {
      for (let k = 0; k < n; k++) add(i + k * step, 'orb', clamp(typeof xf === 'function' ? xf(k) : xf, -0.8, 0.8), { pick: true, yOff: 90 });
    },
    barrier(i, x) { add(i, def.obst, x, { solid: true }); },
    sign(i, name, x, flip) { add(i, name, x, { flip: !!flip }); },
    pad(i, x, w, n) { for (let k = 0; k < (n || 7); k++) segments[mod(i + k, N)].pad = { x, w: w || 0.2 }; },
  };

  for (const k of kicks) {
    add(k.lip - 26, 'jumpsign', -1.3);
    add(k.lip - 26, 'jumpsign', 1.3);
    // Orbs entlang der Flugbahn (für Höchsttempo berechnet)
    const vy = KICK_SLOPE * k.power * MAX_SPEED;
    const T = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * k.height)) / GRAVITY;
    const y0 = segments[k.lip].p2.world.y;
    for (let j = 1; j <= 3; j++) {
      const t = T * (0.1 + j * 0.2);
      const i = k.lip + 1 + Math.round(MAX_SPEED * t / SEG_LEN);
      const yAbs = y0 + vy * t - 0.5 * GRAVITY * t * t;
      add(i, 'orb', 0, { pick: true, yOff: Math.max(90, yAbs - segments[mod(i, N)].p1.world.y) });
    }
  }
  for (const lp of loops) {
    p.pad(lp.i0 - 22, 0, 0.6, 12);
    p.orbs(lp.i0 + 12, Math.floor((lp.n - 24) / 14), 14, 0);
  }
  autoProps(p, secs, def);

  /* ---------- Farben je Segment (weiche Übergänge zwischen den Zonen) ---------- */
  const BLEND = 30;
  const AB = def.abyss || ['#0b0d18', '#2a2d3a'];
  const zFirst = segments[0].zone, zLast = segments[N - 1].zone;
  for (let i = 0; i < N; i++) {
    const s = segments[i];
    let A = def.zones[s.zone], B = A, t = 0;
    for (const b of bounds) {
      const d = i - b[0];
      if (d >= -BLEND && d < BLEND) { A = def.zones[b[1]]; B = def.zones[b[2]]; t = (d + BLEND) / (2 * BLEND); }
    }
    if (zFirst !== zLast) {
      if (i >= N - BLEND) { A = def.zones[zLast]; B = def.zones[zFirst]; t = (i - (N - BLEND)) / (2 * BLEND); }
      else if (i < BLEND) { A = def.zones[zLast]; B = def.zones[zFirst]; t = 0.5 + i / (2 * BLEND); }
    }
    s.col = {
      ground: s.dark ? mix(A.g2, B.g2, t) : mix(A.g1, B.g1, t),
      road: s.dark ? mix(A.r2, B.r2, t) : mix(A.r1, B.r1, t),
      rumble: s.dark ? mix(A.rumB, B.rumB, t) : mix(A.rumA, B.rumA, t),
      rail: mix(A.rail, B.rail, t),
    };
    if (s.gap) s.col.ground = s.wall ? AB[1] : s.dark ? mix(AB[0], '#000000', 0.14) : AB[0];
  }
  return def;
}
