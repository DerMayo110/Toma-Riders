'use strict';

/* ================= Welt & Kamera ================= */
const W = 1280, H = 720;           // logische Auflösung (wird passend skaliert)
const CX = W / 2, CY = 322;        // Fluchtpunkt / Horizont
const BASE_FOCAL = 640;
const SEG_LEN = 200;               // Länge eines Streckensegments
const ROAD_W = 2000;               // halbe Streckenbreite
const RUMBLE_LEN = 3;              // Segmente pro Farbstreifen
const DRAW_DIST = 280;             // Sichtweite in Segmenten
const CAM_H = 1000;                // Kamerahöhe über der Strecke
const CAM_D = 2100;                // Abstand Kamera -> Spieler
const RIDER_SCALE = 5.6;           // Welt-Einheiten pro Fahrer-Zeicheneinheit
const RAIL_H = 170;                // Höhe der Energie-Leitplanken
let FOG = '#cdeeff';                // Nebelfarbe (je Strecke)

/* ================= Fahrphysik ================= */
const MAX_SPEED = 12000;
const BOOST_SPEED = 16800;
const ACCEL = 4200;
const BOOST_ACCEL = 12000;
const BRAKE = 13000;
const DECEL = 3200;
const STEER = 1.9;                 // Querbewegung pro Sekunde (Strecke = -1..1)
const CENTRIFUGAL = 0.25;
const GRAVITY = 9000;
const JUMP_V = 3400;
const TRICK_DUR = 0.4;
const BOOST_COST = 25;
const BOOST_DUR = 2.0;
const PAD_BOOST = 1.3;
let LAPS = 3;                       // Rundenzahl (je Rennen)

/* ================= Mathe-Helfer ================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;
const easeIn = (a, b, t) => a + (b - a) * t * t;
const easeOut = (a, b, t) => a + (b - a) * (1 - (1 - t) * (1 - t));
const easeInOut = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* Deterministischer Zufall (für Strecke und Kulissen) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(h1, h2, t) {
  const a = hexRgb(h1), b = hexRgb(h2);
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}

function fmtTime(t) {
  if (!isFinite(t)) return '-:--.--';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}

/* ================= Eingabe ================= */
const Input = { left: false, right: false, up: false, down: false, drift: false, touch: false };
const HOLD = { left: 1, right: 1, up: 1, down: 1, drift: 1 };      // Tasten, die gehalten werden

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'boost',
  KeyX: 'drift', KeyC: 'drift', ShiftLeft: 'drift', ShiftRight: 'drift',
  Enter: 'confirm', NumpadEnter: 'confirm',
  KeyP: 'pause', Escape: 'pause',
  KeyM: 'mute',
  KeyR: 'restart',
};

/* Wird in game.js gesetzt: bekommt jede frisch gedrückte Aktion. */
let onAction = function () {};

window.addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (!a || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  if (e.repeat) return;
  if (HOLD[a]) Input[a] = true;
  onAction(a);
});

window.addEventListener('keyup', e => {
  const a = KEYMAP[e.code];
  if (HOLD[a]) Input[a] = false;
});

window.addEventListener('blur', () => {
  Input.left = Input.right = Input.up = Input.down = Input.drift = false;
});
