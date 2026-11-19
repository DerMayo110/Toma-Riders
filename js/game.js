'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const $ = id => document.getElementById(id);

const FONT = '"Arial Black", "Segoe UI Black", Impact, sans-serif';
const STEP = 1 / 60;
const DIFF = [0.92, 1.0, 1.05];
let AI_PACE = 1.03;              // Grundtempo aller Gegner (gleicht Drift-Turbos, Loopings und Sprünge des Spielers aus)
const DIFF_NAMES = ['Locker', 'Normal', 'Profi'];
const OVERLAYS = ['menu', 'tracks', 'chapters', 'boards', 'vn', 'card', 'results', 'death', 'ending'];

/* Götter-Fallen auf der Strecke */
const HZ = {
  bolt:  { w: 0.22, len: 7,  col: '#ffe14d', fx: 'fxbolt',  msg: 'BLITZSCHLAG!', mc: '#ffe14d', warn: 'ZEUS ZIELT – SPUR WECHSELN!' },
  shade: { w: 0.30, len: 10, col: '#8a3df0', fx: 'fxshade', msg: 'SEELENKÄLTE!', mc: '#c9a0ff', warn: 'SCHATTEN VORAUS – AUSWEICHEN!' },
  rift:  { w: 0.26, len: 8,  col: '#c77dff', fx: 'fxrift',  msg: 'ZEITLUPE!',    mc: '#d0a0ff', warn: 'ZEITRISS VORAUS – AUSWEICHEN!' },
};

/* Driften: Ladestufen (Zeit bis Stufe 1/2/3), Turbo-Dauer und Energie je Stufe */
const DRIFT_AT = [0.6, 1.3, 2.1];
const DRIFT_BOOST = [0, 0.55, 0.95, 1.45];
const DRIFT_GAIN = [0, 1, 3, 6];
const DRIFT_COL = ['#dfe9f5', '#39e0ff', '#ffb13c', '#ff5fd0'];
const DRIFT_MSG = ['', 'DRIFT-TURBO!', 'SUPER-TURBO!', 'ULTRA-TURBO!'];

/* ================= Zustand ================= */
let renderScale = 1;
let focal = BASE_FOCAL;
let state = 'menu';            // menu (Demo im Hintergrund) | countdown | race | finished
let mode = 'free';             // free | story
let ui = 'menu';               // sichtbares Overlay bzw. 'race'
let paused = false;
let difficulty = 1;
let theme = null;              // Himmel/Hintergrund der geladenen Strecke
let roster = FREE_RIVALS;
let skillMul = 1;
let gameT = 0, raceTime = 0, countdownT = 0, finishT = 0;
let racers = [], player = null;
let finalOrder = [], teamMates = [], resultsShown = false, newRecord = false;
let lapStart = 0, bestLap = Infinity;
let upPressedAt = -9;
let orbChain = 0, orbChainT = 0;
let rival = null, rivalAhead = null, rivalT = 0;      // Tomas Rivale im Feld (Story) und seine Sprüche
let shake = 0, boostVis = 0, flash = 0;
let particles = [], popups = [];
let HUD_PORTRAIT = null;
let warnT = 0, warnText = '', warnCol = '#ffe14d', hairpinT = 0;
/* Kamera: Lage entlang der Strecke (z) und seitlicher Versatz (x). Höhe und Blickrichtung führt world3d.js. */
const cam = { x: 0, z: 0 };
let loopVis = 0, trickVis = 0;
const pScr = { x: CX, y: 620, k: 1.7 };      // Bildschirmposition des Spielers (für Partikel)

/* ================= Oberfläche ================= */
function showUI(name) {
  ui = name || 'race';
  for (const o of OVERLAYS) $(o).classList.toggle('hidden', o !== name);
  $('pause').classList.add('hidden');
}

/* Die Rennwelt braucht WebGL2. Fehlt es (lost = false) oder entzieht der Browser die Grafik mitten im Spiel
   (lost = true), gibt es statt eines eingefrorenen Bildes einen Hinweis. */
function showNoGl(lost) {
  paused = true;
  ui = 'nogl';
  Sfx.musicStop();
  for (const o of OVERLAYS) $(o).classList.add('hidden');
  $('pause').classList.add('hidden');
  $('noglTitle').textContent = lost ? 'GRAFIK UNTERBROCHEN' : 'KEINE 3D-GRAFIK';
  $('noglText').textContent = lost
    ? 'Der Browser hat die 3D-Grafik unterbrochen – das passiert zum Beispiel nach dem Standby oder einem Neustart des Grafiktreibers. Lade die Seite neu, um weiterzufahren. Dein gespeicherter Story-Fortschritt bleibt erhalten.'
    : 'Dieser Browser oder dieses Gerät stellt kein WebGL2 bereit – das braucht Toma Riders für die Rennwelt. Aktuelle Versionen von Chrome, Edge, Firefox und Safari können es. Hilft ein Update nicht, schalte in den Browser-Einstellungen die Hardwarebeschleunigung ein.';
  $('nogl').classList.remove('hidden');
}

/* ================= Rennen aufsetzen ================= */
function makeRacer(def, x, dist, isPlayer) {
  return {
    name: def.name, pal: def.pal, skill: def.skill || 1, god: def.god || null, isPlayer,
    ally: def.ally || 0, lane: def.lane || 0, gapNow: 0, big: 0, shot: false, fade: 1, rival: !!def.rival,
    cr: 0.3, sq: 0, sqV: 0, armUp: 0, bo: 0,          // Haltung fürs Zeichnen: Hocke, Federung, Arme hoch, Boost-Haltung
    x, dist, z: mod(dist, TRACK_LEN),
    pDist: dist, pX: x, pH: 0, pY: 0,                 // Stand einen Schritt zuvor (für Zwischenbilder)
    speed: 0, steerV: 0, lean: 0, targetX: x, laneT: 1 + Math.random() * 3,
    air: false, airT: 0, airEta: 0, yAbs: 0, vy: 0, h: 0, trick: null, tricks: 0, trickQ: null, trickQT: 0,
    drift: 0, driftT: 0, driftLvl: 0, driftVis: 0, curveT: 0, loopIn: null,
    boostT: 0, stumbleT: 0, hitT: 0, bumpT: 0, hzT: 0, slip: 0, scrape: false, scrapeSide: 0,
    godT: 5 + Math.random() * 2, behindT: 0, rewinds: 0,
    energy: 50, auto: false, finished: false, finishTime: 0, estTime: 0, pos: 0,
    phase: Math.random() * 6,
  };
}

function resetRace() {
  for (const s of segments) {
    s.hz = null;
    s.hzHead = null;
    for (const sp of s.sprites) sp.gone = 0;
  }
  racers = [];
  // Startaufstellung in Zweierreihen; Toma steht ganz hinten (in der Story direkt hinter Robin und Jario)
  const n = Math.min(roster.length, 7);
  for (let i = 0; i < n; i++) racers.push(makeRacer(roster[i], i % 2 ? 0.42 : -0.42, -700 - 350 * i, false));
  player = makeRacer({ name: 'Toma', pal: playerPal(), skill: 1 }, n % 2 ? 0.42 : -0.42, -700 - 350 * n, true);
  racers.push(player);
  raceTime = 0; lapStart = 0; bestLap = Infinity;
  finalOrder = []; teamMates = []; resultsShown = false; newRecord = false;
  particles = []; popups = [];
  shake = 0; boostVis = 0; flash = 0; orbChain = 0; orbChainT = 0; warnT = 0;
  rival = racers.find(r => r.rival) || null; rivalAhead = null; rivalT = 0;
  cam.x = player.x * ROAD_W * 0.72;
  cam.z = mod(player.dist - CAM_D, TRACK_LEN);
  loopVis = 0;
  bossReset();
  updateCamera(0);
  keepPrev();
  rank();
}

/* cfg: { track, laps, roster, skill } */
function setupRace(cfg) {
  if (!track || track.id !== cfg.track) {
    loadTrack(cfg.track);
    theme = getTheme(track.theme);
    W3.build();
  }
  bossOn = !!cfg.boss;
  LAPS = bossOn ? 999 : cfg.laps || 3;       // der Bosskampf kennt keine Runden
  roster = cfg.roster || FREE_RIVALS;
  skillMul = cfg.skill || 1;
  Sfx.tune(track.tune);
  resetRace();
}

/* Autopilot-Fahrt als Hintergrund für Menüs und Dialoge */
function enterDemo() {
  resetRace();
  state = 'menu';
  paused = false;
  player.auto = true;
  for (const r of racers) r.speed = MAX_SPEED * 0.7;
}

function startCountdown() {
  Sfx.init();
  Sfx.hold(false);
  state = 'countdown';
  countdownT = 3.8;
  paused = false;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function startFree(id) {
  mode = 'free';
  setupRace({ track: id, laps: 3, roster: FREE_RIVALS, skill: 1 });
  showUI(null);
  startCountdown();
}

function restartRace() {
  resetRace();
  showUI(null);
  startCountdown();
}

function toMenu() {
  Sfx.hold(false);
  Sfx.musicStop();
  mode = 'free';
  const keep = track && !(track.locked && !Story.status().done);
  setupRace({ track: keep ? track.id : 'piraeus', laps: 3, roster: FREE_RIVALS, skill: 1 });
  enterDemo();
  showUI('menu');
  refreshMenu();
}

function togglePause(force) {
  if (state !== 'race' && state !== 'countdown') return;
  paused = typeof force === 'boolean' ? force : !paused;
  $('pause').classList.toggle('hidden', !paused);
  Sfx.hold(paused);
}

/* ================= Effekte ================= */
function popup(text, color, life) {
  popups.push({ text, color, t: 0, life: life || 1.4 });
  if (popups.length > 3) popups.shift();
}

function spawn(x, y, vx, vy, life, size, color, grav) {
  if (particles.length < 420) particles.push({ x, y, vx, vy, life, max: life, size, color, grav: grav || 0 });
}

function ring(x, y, size, color) {
  if (particles.length < 420) particles.push({ ring: true, x, y, vx: 0, vy: 0, life: 0.36, max: 0.36, size, color, grav: 0 });
}

/* Haltung der Fahrer: Hocke je nach Tempo und Lage, Arme, und eine Feder fürs Stauchen/Strecken */
function poseUpdate(r, dt) {
  const boosting = r.boostT > 0;
  let cr = 0.2 + 0.22 * Math.min(1, r.speed / MAX_SPEED);
  if (boosting) cr = 0.7;
  if (r.drift || Math.abs(r.driftVis) > 0.3) cr = 0.62;
  if (r.stumbleT > 0) cr = 0.5;
  if (r.air) cr = r.trick && r.trick.t > 0 ? 0.9 : r.vy > 0 ? 0.08 : 0.4;
  r.cr = damp(r.cr, cr, r.air ? 14 : 9, dt);
  r.armUp = damp(r.armUp, r.air && !(r.trick && r.trick.t > 0) ? 1 : 0, 10, dt);
  r.bo = damp(r.bo, boosting && !r.air ? 1 : 0, 9, dt);
  r.sqV += (-260 * r.sq - 17 * r.sqV) * dt;
  r.sq = clamp(r.sq + r.sqV * dt, -0.28, 0.28);
}

function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = 120 + Math.random() * 380;
    spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 80, 0.3 + Math.random() * 0.35, 4 + Math.random() * 6, color, 500);
  }
}

/* ================= Sprünge & Tricks ================= */
/* Restliche Flugzeit (entscheidet, ob sich ein Trick noch ausgeht). Gerechnet wird Schritt für Schritt genau so wie in
   airUpdate. Eine gröbere Rechnung sackt im ersten Schritt ein paar Einheiten zu tief: Fällt die Bahn nur langsam
   unter dem Fahrer weg (Kuppe, Absprung mitten auf einer Schanze), galt ein langer Flug dann als Hüpfer, und Tricks
   blieben gesperrt. lead = 0: an der Absprungstelle, vor dem ersten Flugschritt; 1: nach einem fertigen Flugschritt. */
function flightLeft(r, dt, lead) {
  let y = r.yAbs, w = r.vy;
  for (let n = 0; n < 180; n++) {
    w -= GRAVITY * dt;
    y += w * dt;
    if (y <= roadYAt(r.z + r.speed * dt * (n + lead))) return (n + 1) * dt;
  }
  return 3;
}

/* Abgehoben wird rein physikalisch: Fällt die Fahrbahn schneller weg, als die Schwerkraft den Fahrer
   nach unten zieht (Schanzenkante, steile Kuppe, Abbruchkante), fliegt er mit seinem Schwung weiter. */
function checkLaunch(r, dt) {
  const v = r.speed;
  if (v < 2500) return;
  const z = r.z, y0 = roadYAt(z);
  const vy = (y0 - roadYAt(z - 120)) / 120 * v;
  if (y0 + vy * dt - 0.5 * GRAVITY * dt * dt <= roadYAt(z + v * dt) + 1) return;      // der Boden trägt noch
  if (y0 + vy * 0.1 - 45 <= roadYAt(z + v * 0.1) + 12) return;                        // nur ein Knick, kein Absprung
  r.air = true;
  r.airT = 0;
  r.vy = Math.min(vy, JUMP_V * 2.4);
  r.yAbs = y0;
  r.tricks = 0;
  r.trick = null;

  const eta = r.airEta = flightLeft(r, dt, 0);
  r.sqV = 2.4;                                   // streckt sich beim Absprung
  if (r.isPlayer && !r.auto && eta > 0.35) burst(pScr.x, pScr.y, 8, '#ffffff');
  if (r.isPlayer && !r.auto) {
    if (eta > 0.35) Sfx.jump();
    queuedTrick(r, 0.14);
  }
  else if (eta > 0.6) {                            // KI zeigt einen Trick
    const ty = ['left', 'right', 'up', 'down'][(Math.random() * 4) | 0], set = TRICK_SETS[ty];
    r.trick = { type: ty, kind: set[(Math.random() * set.length) | 0], t: -0.5 };
  }
}

function grounded(r) {
  r.air = false;
  r.vy = 0;
  r.h = 0;
  r.trick = null;
  r.trickQ = null;
  r.tricks = 0;
}

/* In die Schlucht gestürzt: hinter der Kante wieder aufsetzen, Tempo und Energie sind weg */
function fallRescue(r) {
  const N = segments.length;
  let i = findSegment(r.z).index, k = 0;
  while (segments[i].gap && k++ < 90) i = (i + 1) % N;
  i = (i + 3) % N;
  r.dist += mod(i * SEG_LEN - r.z, TRACK_LEN);
  r.z = mod(r.dist, TRACK_LEN);
  grounded(r);
  r.yAbs = roadYAt(r.z);
  r.speed = MAX_SPEED * 0.22;
  r.boostT = 0;
  if (r.isPlayer) {
    endDrift(r, false);
    r.stumbleT = 1.1;
    r.energy = Math.max(0, r.energy - 10);
    if (!r.auto) {
      Sfx.fall();
      shake = 18;
      flash = 1;
      popup('ABGESTÜRZT!', '#ff5a5a', 1.2);
    }
  } else r.hitT = 1.0;
}

function landed(r) {
  const big = r.airT > 0.3;
  if (big) {                                       // federt die Landung ab
    r.sqV = -clamp(2.4 + Math.abs(r.vy) / 2600, 2.6, 6);
    if (r.isPlayer && !r.auto) ring(pScr.x, pScr.y + 6 * pScr.k, 95 * pScr.k, '#ffffff');
  }
  r.air = false;
  r.vy = 0;
  if (findSegment(r.z).gap) { fallRescue(r); return; }
  if (r.isPlayer && !r.auto) {
    if (r.trick) {
      endDrift(r, false);
      r.stumbleT = 0.9;
      r.speed *= 0.55;
      r.energy = Math.max(0, r.energy - 5);
      shake = 14;
      popup('STURZ!', '#ff5a5a');
      Sfx.crash();
    } else if (r.tricks > 0) {
      const gain = r.tricks * 10 + (r.tricks >= 3 ? 8 : 0);
      r.energy = Math.min(100, r.energy + gain);
      r.boostT = Math.max(r.boostT, 0.35 + r.tricks * 0.3);
      popup('SAUBER GELANDET  +' + gain, '#7dffd8');
      Sfx.land(r.tricks);
      burst(pScr.x, pScr.y - 20 * pScr.k, 10 + r.tricks * 4, '#7dffd8');
    } else if (big) {
      Sfx.land(0);
    }
  }
  r.trick = null;
  r.trickQ = null;
  r.tricks = 0;
}

function airUpdate(r, dt) {
  const ry = roadYAt(r.z);
  if (!r.air) { r.h = 0; r.yAbs = ry; return; }
  r.airT += dt;
  r.vy -= GRAVITY * dt;
  r.yAbs += r.vy * dt;
  if (r.trick) {
    r.trick.t += dt / (r.isPlayer ? TRICK_DUR * BD.trick : TRICK_DUR);
    if (r.trick.t >= 1) {
      const kind = r.trick.kind;
      r.trick = null;
      r.tricks++;
      r.sqV = 1.6;
      if (r.isPlayer && !r.auto) {
        popup(TRICK_LABEL[kind] + (r.tricks > 1 ? '  ×' + r.tricks : '!'), '#ffd34d', 0.9);
        Sfx.trickDone(r.tricks);
        burst(pScr.x, pScr.y - 50 * pScr.k, 8 + r.tricks * 3, '#ffe9a0');
        queuedTrick(r, 0.4);
      }
    }
  }
  if (r.yAbs <= ry) { r.yAbs = ry; r.h = 0; landed(r); }
  else {
    r.h = r.yAbs - ry;
    // Der Spieler ändert im Flug sein Tempo (Boost läuft aus): Vorhersage nachführen, sonst läuft ein vorgemerkter
    // Trick am Ende langer Flüge in die Landung hinein
    if (r.isPlayer) r.airEta = r.airT + flightLeft(r, dt, 1);
  }
}

function tryTrick(dir) {
  const p = player;
  if (state !== 'race' || p.auto) return;
  if (!p.air || p.trick) {
    // Einen Tick zu früh gedrückt (kurz vor dem Absprung oder gegen Ende des laufenden Tricks): vormerken,
    // der Trick schließt dann nahtlos an.
    if (!p.air || p.trick.t > 0.3) { p.trickQ = dir; p.trickQT = gameT; }
    return;
  }
  startTrick(p, dir, 0.6);
}

/* need = Anteil der Trickdauer, der mindestens noch an Flugzeit übrig sein muss */
function startTrick(p, dir, need) {
  p.trickQ = null;
  const dur = TRICK_DUR * BD.trick;
  if (p.airEta < dur * 1.05) return;                 // Hüpfer, in den kein ganzer Trick passt: nur lenken
  if (p.airEta - p.airT < dur * need) return;        // schon kurz vor dem Boden: nur lenken
  const set = TRICK_SETS[dir];
  p.trick = { type: dir, kind: set[p.tricks % set.length], t: 0 };
  Sfx.trick();
}

/* Vorgemerkte Eingabe einlösen – nur, wenn sie frisch ist und der Trick sicher noch fertig wird */
function queuedTrick(p, maxAge) {
  const dir = p.trickQ;
  p.trickQ = null;
  if (dir && gameT - p.trickQT <= maxAge && state === 'race' && !p.auto) startTrick(p, dir, 1.05);
}

/* ================= Driften ================= */
/* Beendet den Drift; pay = Turbo auszahlen (je nach Ladestufe) */
function endDrift(p, pay) {
  if (!p.drift) return;
  const l = p.driftLvl;
  p.drift = 0;
  p.driftT = 0;
  p.driftLvl = 0;
  if (!pay || !l) return;
  p.boostT = Math.max(p.boostT, DRIFT_BOOST[l]);
  p.energy = Math.min(100, p.energy + DRIFT_GAIN[l]);
  popup(DRIFT_MSG[l], DRIFT_COL[l], 0.9);
  Sfx.turbo(l);
  flash = Math.max(flash, 0.25 + 0.12 * l);
  shake = Math.max(shake, 3 + 2 * l);
  burst(pScr.x, pScr.y - 10 * pScr.k, 8 + 5 * l, DRIFT_COL[l]);
}

function tryBoost() {
  const p = player;
  if (state !== 'race' || p.auto || p.stumbleT > 0) return;
  if (p.energy >= BOOST_COST && p.boostT < 0.25) {
    p.energy -= BOOST_COST;
    p.boostT = BOOST_DUR * BD.boostT;
    p.sqV = 2.2;
    shake = Math.max(shake, 8);
    flash = Math.max(flash, 0.7);
    popup('BOOST!', '#ffd34d', 0.9);
    Sfx.boost();
  } else if (p.energy < BOOST_COST) {
    Sfx.deny();
  }
}

/* ================= Götter-Fallen ================= */
function placeHazard(type, double) {
  const p = player;
  if (p.air || p.finished) return false;
  const N = segments.length, cfg = HZ[type];
  const lead = Math.round(clamp(p.speed / SEG_LEN * 1.8, 70, 160));      // ~1,8 s vor dem Spieler
  const start = (findSegment(p.z).index + lead) % N;
  for (let k = -3; k < cfg.len + 3; k++) {
    const s = segments[mod(start + k, N)];
    if (s.pad || s.ramp || s.loop || s.gap || s.index < 14 || (s.hz && s.hz.until > gameT)) return false;
  }
  const x = clamp(p.x + (Math.random() - 0.5) * 0.16, -0.72, 0.72);
  const xs = [x];
  if (double) xs.push(clamp(x + (x > 0 ? -0.6 : 0.6), -0.72, 0.72));
  const hz = { xs, w: cfg.w, type, until: gameT + 6 };
  for (let k = 0; k < cfg.len; k++) segments[(start + k) % N].hz = hz;
  segments[(start + (cfg.len >> 1)) % N].hzHead = hz;
  warnT = 1.5;
  warnText = cfg.warn;
  warnCol = cfg.mc;
  Sfx.hazard();
  return true;
}

function hazardHit(p, hz) {
  const cfg = HZ[hz.type];
  hz.until = gameT;
  p.hzT = 1.4;
  p.speed *= 0.5;
  p.boostT = 0;
  p.energy = Math.max(0, p.energy - 8);
  p.stumbleT = 0.55;
  endDrift(p, false);
  if (!p.auto) {
    Sfx.zap();
    shake = 16;
    flash = Math.max(flash, 0.8);
    popup(cfg.msg, cfg.mc, 1.0);
    burst(pScr.x, pScr.y - 40 * pScr.k, 16, cfg.col);
  }
  if (boss) bossHurt('rift');
}

/* Spezialfähigkeiten der Götter; gibt zurück, wie schnell der Gott die Spur wechselt */
function godUpdate(r, dt) {
  const p = player;
  const lead = mod(p.dist - r.dist + TRACK_LEN / 2, TRACK_LEN) - TRACK_LEN / 2;      // > 0: Spieler liegt vorn
  let follow = 2.2;
  r.godT -= dt;
  if (r.god === 'ares') {
    if (Math.abs(lead) < 1500 && !p.air && !r.air) { r.targetX = clamp(p.x, -0.8, 0.8); r.laneT = 0.3; follow = 3.4; }
  } else if (r.god === 'hermes') {
    if (r.godT <= 0) {
      r.boostT = 1.6;
      r.godT = 6 + Math.random() * 3;
      r.targetX = (Math.random() * 2 - 1) * 0.7;
      r.laneT = 1.5;
    }
  } else if (r.god === 'zeus') {
    if (r.godT <= 0) r.godT = placeHazard('bolt', Math.random() < 0.35) ? 4.5 + Math.random() * 2.5 : 0.6;
  } else if (r.god === 'hades') {
    if (r.godT <= 0) r.godT = placeHazard('shade', false) ? 5 + Math.random() * 2.5 : 0.6;
  } else if (r.god === 'kronos') {
    if (r.godT <= 0) r.godT = placeHazard('rift', Math.random() < 0.25) ? 4.5 + Math.random() * 2.5 : 0.6;
    r.behindT = lead > 900 ? r.behindT + dt : 0;
    if (r.behindT > 2.5 && r.rewinds < 2 && p.dist > 3000 && p.dist < LAPS * TRACK_LEN * 0.85 && !p.air && !r.air
        && !findSegment(p.z).loop && !findSegment(p.z + 1300).loop && !findSegment(p.z + 1300).gap) {
      r.rewinds++;
      r.behindT = 0;
      r.dist = p.dist + 1300;
      r.z = mod(r.dist, TRACK_LEN);
      r.x = clamp(p.x > 0 ? p.x - 0.6 : p.x + 0.6, -0.7, 0.7);
      r.targetX = r.x;
      r.speed = Math.max(r.speed, p.speed);
      flash = 1;
      shake = 14;
      popup('KRONOS DREHT DIE ZEIT ZURÜCK!', '#d0a0ff', 1.8);
      Sfx.rewind();
    }
  }
  return follow;
}

/* ================= Autopilot (Demo und nach dem Ziel) ================= */
function avoidTarget(spx, selfX, gap) {
  let t = spx + (selfX >= spx ? gap : -gap);
  if (t > 0.76) t = spx - gap;
  if (t < -0.76) t = spx + gap;
  return t;
}

function autoSteer(p, seg, dt) {
  const N = segments.length;
  p.laneT -= dt;
  if (p.laneT <= 0) { p.targetX = (Math.random() * 2 - 1) * 0.5; p.laneT = 2 + Math.random() * 3; }
  for (let i = 2; i < 18; i++) {
    const s = segments[(seg.index + i) % N];
    for (const sp of s.sprites) {
      if (sp.solid && sp.gone <= gameT && Math.abs(sp.x - p.targetX) < 0.32) { p.targetX = avoidTarget(sp.x, p.x, 0.45); p.laneT = 1.2; }
    }
  }
  const sp = p.speed / MAX_SPEED;
  const auth = STEER * clamp(sp * 2.5, 0.1, 1);
  const comp = seg.curve * CENTRIFUGAL * sp * sp / auth;
  return clamp((p.targetX - p.x) * 3.5 + comp, -1, 1);
}

/* ================= Spieler ================= */
function updatePlayer(p, dt) {
  const prev = p.dist;
  const N = segments.length;
  const seg = findSegment(p.z);
  const sp = p.speed / MAX_SPEED;
  const live = !p.auto && state === 'race';

  let steer = 0, throttle = false, brake = false;
  if (p.auto) {
    steer = autoSteer(p, seg, dt);
    throttle = true;
  } else if (state === 'race') {
    steer = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    throttle = Input.up || Input.touch;
    brake = Input.down;
  }
  if (p.stumbleT > 0) { p.stumbleT -= dt; steer *= 0.35; }
  if (p.hitT > 0) p.hitT -= dt;
  if (p.bumpT > 0) p.bumpT -= dt;
  if (p.hzT > 0) p.hzT -= dt;

  // Looping: die Magnetschiene hält das Board – kein Bremsen, kein Abheben, Mindesttempo
  const L = seg.loop;
  if (L) {
    if (p.air) grounded(p);
    brake = false;
  }
  if (L !== p.loopIn) {
    if (live) {
      if (L) Sfx.loop();
      else {
        p.energy = Math.min(100, p.energy + 5);
        p.boostT = Math.max(p.boostT, 0.5);
        popup('LOOPING!  +5', '#7dffd8', 1.0);
        Sfx.land(2);
      }
    }
    p.loopIn = L;
  }

  // Driften: Taste halten und einlenken. In Kurven lädt sich ein Turbo auf, der beim Loslassen zündet.
  if (p.drift) {
    if (!live || !Input.drift) endDrift(p, true);
    else if (p.stumbleT > 0 || sp < 0.3 || brake) endDrift(p, false);
  } else if (live && Input.drift && steer !== 0 && !p.air && !L && sp > 0.42 && p.stumbleT <= 0) {
    p.drift = steer;
    p.driftT = 0;
    p.driftLvl = 0;
    Sfx.driftStart();
  }
  // Haarnadeln (Kurve > 6) drücken überproportional nach außen: ohne Drift oder Bremse geht es an die Bande
  const cf = seg.curve + Math.sign(seg.curve) * Math.max(0, Math.abs(seg.curve) - 6);
  if (live && hairpinT <= 0 && Math.abs(seg.curve) < 3 && Math.abs(segments[(seg.index + 30) % N].curve) >= 6.5) {
    hairpinT = 4;
    warnT = 1.7;
    warnText = Input.touch ? 'HAARNADEL – DRIFTEN!' : 'HAARNADEL – DRIFTEN!  (X / SHIFT + LENKEN)';
    warnCol = '#ffd23d';
  }
  if (hairpinT > 0) hairpinT -= dt;
  let grip = p.auto ? 0.6 : 1;
  if (p.drift) {
    const into = steer * p.drift;                        // 1 = weiter eindrehen, −1 = gegenlenken
    const withCurve = seg.curve * p.drift > 0;
    // Quer gestellt hält das Board die Kurve von selbst: ohne Lenken bleibt die Linie,
    // Einlenken zieht nach innen, Gegenlenken lässt es nach außen tragen.
    steer = p.drift * (withCurve ? 0.04 + 0.36 * into : 0.15 + 0.5 * into);
    if (withCurve) grip = 0.1;
    if (!p.air) {
      const c = Math.abs(seg.curve);
      const rate = withCurve ? 0.3 + 0.7 * Math.min(1, c / 4) : c < 1 ? 0.12 : 0.2;
      p.driftT += dt * rate * BD.drift * (0.85 + 0.15 * into);
    }
    const lvl = p.driftT >= DRIFT_AT[2] ? 3 : p.driftT >= DRIFT_AT[1] ? 2 : p.driftT >= DRIFT_AT[0] ? 1 : 0;
    if (lvl > p.driftLvl) {
      Sfx.driftLvl(lvl);
      burst(pScr.x, pScr.y - 6 * pScr.k, 8, DRIFT_COL[lvl]);
    }
    p.driftLvl = lvl;
  }
  p.driftVis = damp(p.driftVis, p.drift, 12, dt);

  // Lenken + Fliehkraft
  const auth = STEER * BD.steer * clamp(sp * 2.5, 0, 1) * (p.air ? 0.5 : 1);
  p.steerV = damp(p.steerV, steer * auth, p.air ? 5 : 11, dt);
  p.x += p.steerV * dt;
  if (!p.air) p.x -= cf * CENTRIFUGAL * BD.cent * sp * sp * grip * dt;
  p.lean = damp(p.lean, clamp(p.steerV / STEER * 1.1, -1, 1), 9, dt);

  // Tempo
  let top = MAX_SPEED * BD.speed, acc = ACCEL * BD.accel;
  if (p.boostT > 0) { p.boostT -= dt; top = BOOST_SPEED * BD.boostV; acc = BOOST_ACCEL; throttle = true; brake = false; }
  else if (p.slip > 0.6) top *= 1.07;
  if (p.finished) top = MAX_SPEED * 0.55;
  else if (p.auto) top = Math.min(top, MAX_SPEED * 0.92);
  if (p.stumbleT > 0) top = Math.min(top, MAX_SPEED * 0.6);
  if (brake && !p.air) p.speed -= BRAKE * dt;
  else if (throttle) {
    if (p.speed < top) p.speed = Math.min(top, p.speed + acc * (p.air ? 0.35 : 1) * dt);
    else p.speed = damp(p.speed, top, 1.3, dt);
  } else if (!p.air) p.speed -= DECEL * dt;
  p.speed = clamp(p.speed, L ? MAX_SPEED * 0.62 : 0, BOOST_SPEED * BD.boostV * 1.05);

  // Leitplanken
  const LIM = 0.96;
  p.scrape = false;
  if (Math.abs(p.x) > LIM) {
    p.scrapeSide = Math.sign(p.x);
    p.x = clamp(p.x, -LIM, LIM);
    p.steerV *= 0.6;
    if (!p.air && p.speed > 1500) {
      p.scrape = true;
      if (p.drift) p.driftT = Math.max(0, p.driftT - dt * 1.6);      // an der Bande verpufft die Drift-Ladung
      if (p.speed > MAX_SPEED * 0.45) p.speed -= p.speed * (BD.tough ? 0.55 : 0.95) * dt;
    }
  }

  p.dist += p.speed * dt;
  p.z = mod(p.dist, TRACK_LEN);
  const now = findSegment(p.z);
  if (!p.air && !now.loop) checkLaunch(p, dt);
  airUpdate(p, dt);
  if (!p.air && findSegment(p.z).gap) fallRescue(p);      // ohne Schwung in die Schlucht gerollt

  const i0 = Math.floor(prev / SEG_LEN), i1 = Math.floor(p.dist / SEG_LEN);
  for (let i = i0; i <= i1; i++) playerEvents(p, segments[mod(i, N)]);

  if (state === 'race') {
    const l0 = Math.floor(prev / TRACK_LEN), l1 = Math.floor(p.dist / TRACK_LEN);
    if (l1 > l0 && l1 >= 1) playerLap(l1);
  }
}

function playerEvents(p, s) {
  const live = !p.auto;
  if (s.pad && !p.air && Math.abs(p.x - s.pad.x) < s.pad.w + 0.06) {
    if (p.boostT < PAD_BOOST - 0.4 && live) {
      Sfx.pad();
      popup('BOOST-PAD!', '#39e0ff', 0.9);
      flash = Math.max(flash, 0.5);
    }
    p.boostT = Math.max(p.boostT, PAD_BOOST);
  }
  const hz = s.hz;
  if (hz && hz.until > gameT && !p.air && p.hzT <= 0) {
    for (const hx of hz.xs) {
      if (Math.abs(p.x - hx) < hz.w + 0.03) { hazardHit(p, hz); break; }
    }
  }

  for (const sp of s.sprites) {
    if (sp.gone > gameT) continue;
    const dx = Math.abs(p.x - sp.x);
    if (sp.pick) {
      if (dx < 0.17 && Math.abs(p.h - sp.yOff + 90) < 380) {
        sp.gone = gameT + 10;
        p.energy = Math.min(100, p.energy + 2);
        if (live) {
          orbChain = orbChainT > 0 ? orbChain + 1 : 0;
          orbChainT = 0.6;
          Sfx.orb(orbChain);
          burst(pScr.x, pScr.y - 50 * pScr.k, 7, '#7dffd8');
        }
      }
    } else if (sp.solid) {
      if (dx < 0.2 && p.h < 300 && p.hitT <= 0) {
        sp.gone = gameT + 8;
        if (p.boostT > 0) {
          if (live) {
            Sfx.smash();
            popup('ZERTRÜMMERT!', '#ffd34d', 0.9);
            shake = Math.max(shake, 8);
            burst(pScr.x, pScr.y - 30 * pScr.k, 18, '#ffb347');
          }
        } else {
          p.speed *= BD.tough ? 0.6 : 0.35;
          p.hitT = 0.5;
          endDrift(p, false);
          p.energy = Math.max(0, p.energy - 6);
          if (live) {
            Sfx.crash();
            shake = 16;
            popup('AUTSCH!', '#ff5a5a', 0.9);
            burst(pScr.x, pScr.y - 30 * pScr.k, 16, '#ff8a5a');
          }
        }
      }
    }
  }
}

function playerLap(l1) {
  if (boss) return;
  const lt = raceTime - lapStart;
  bestLap = Math.min(bestLap, lt);
  lapStart = raceTime;
  if (l1 >= LAPS) finishRace();
  else {
    popup(l1 === LAPS - 1 ? 'LETZTE RUNDE!' : 'RUNDE ' + (l1 + 1), '#ffffff');
    Sfx.lap();
  }
}

/* ================= Gegner-KI ================= */
function updateAI(r, dt) {
  const N = segments.length;
  let follow = 2.2;
  if (r.god && !boss && state === 'race' && !player.finished) follow = godUpdate(r, dt);

  const prev = r.dist;
  const seg = findSegment(r.z);

  let top = MAX_SPEED * r.skill * skillMul * DIFF[difficulty] * AI_PACE;
  top *= 1 + clamp((player.dist - r.dist) / 250000, -0.06, 0.05);       // Gummiband: vorn etwas langsamer, hinten etwas schneller
  top *= 1 - Math.abs(seg.curve) * 0.006;
  if (r.boostT > 0) { r.boostT -= dt; top *= 1.28; }
  // Schwurbund: Robin und Jario halten Formation knapp vor Toma, egal wie schnell er gerade ist
  const escort = r.ally && state === 'race' && !player.finished && !r.finished;
  if (escort) {
    top = clamp(player.speed + (player.dist + (r.gapNow || r.ally) - r.dist) * 1.6, MAX_SPEED * 0.45, BOOST_SPEED * 1.1);
    if (player.boostT > 0) r.boostT = Math.max(r.boostT, 0.2);
  }
  if (r.hitT > 0) { r.hitT -= dt; top *= 0.55; }
  if (r.finished) top = MAX_SPEED * 0.5;
  const lead = boss && state === 'race' ? bossTop(r) : 0;       // Kronos im Bosskampf: Tempo je nach Phase
  if (lead) top = lead;
  if (r.speed < top) r.speed = Math.min(top, r.speed + ACCEL * (escort || lead ? 3 : r.boostT > 0 ? 2.2 : 0.95) * dt);
  else r.speed = damp(r.speed, top, escort || lead ? 4 : 1.5, dt);

  // Spurwahl: gelegentlich wechseln, Hindernissen und Vorderleuten ausweichen
  r.laneT -= dt;
  if (r.laneT <= 0) { r.targetX = r.ally ? r.lane + (Math.random() - 0.5) * 0.1 : (Math.random() * 2 - 1) * 0.68; r.laneT = 2 + Math.random() * 4; }
  if (!r.air) {
    for (let i = 2; i < 16; i++) {
      const s = segments[(seg.index + i) % N];
      for (const sp of s.sprites) {
        if (sp.solid && sp.gone <= gameT && Math.abs(sp.x - r.targetX) < 0.3) { r.targetX = avoidTarget(sp.x, r.x, 0.42); r.laneT = 1.2; }
      }
    }
    for (const o of racers) {
      if (o === r || (o.isPlayer && r.god === 'ares')) continue;
      const dz = o.dist - r.dist;
      if (dz > 0 && dz < 900 && o.speed < r.speed && Math.abs(o.x - r.targetX) < 0.16) {
        r.targetX = avoidTarget(o.x, r.x, 0.3);
        r.laneT = 1;
      }
    }
  }
  // In harten Kurven stellen auch die Gegner das Board quer und holen sich danach einen kleinen Turbo
  const hard = Math.abs(seg.curve);
  if (hard >= 4.5 && !r.air) r.curveT += dt;
  else if (hard < 2 && r.curveT > 0) {
    if (r.curveT > 0.7) r.boostT = Math.max(r.boostT, Math.min(1, 0.35 + r.curveT * 0.3));
    r.curveT = 0;
  }
  r.driftVis = damp(r.driftVis, hard >= 4.5 && !r.air ? Math.sign(seg.curve) : 0, 6, dt);

  const nx = damp(r.x, clamp(r.targetX, -0.8, 0.8), follow, dt);
  r.lean = damp(r.lean, clamp((nx - r.x) / dt * 0.7 + seg.curve * 0.06, -1, 1), 6, dt);
  r.x = nx;

  r.dist += r.speed * dt;
  r.z = mod(r.dist, TRACK_LEN);
  const now = findSegment(r.z);
  if (now.loop) {
    if (r.air) grounded(r);
    if (r.speed < MAX_SPEED * 0.62) r.speed = MAX_SPEED * 0.62;
  } else if (!r.air) checkLaunch(r, dt);
  airUpdate(r, dt);
  if (!r.air && findSegment(r.z).gap) fallRescue(r);

  const i0 = Math.floor(prev / SEG_LEN), i1 = Math.floor(r.dist / SEG_LEN);
  for (let i = i0; i <= i1; i++) {
    const s = segments[mod(i, N)];
    if (s.pad && !r.air && Math.abs(r.x - s.pad.x) < s.pad.w + 0.05) r.boostT = Math.max(r.boostT, 1.2);
    if (!r.air && r.hitT <= 0) {
      for (const sp of s.sprites) {
        if (!r.big && sp.solid && sp.gone <= gameT && Math.abs(sp.x - r.x) < 0.19) { r.speed *= 0.5; r.hitT = 0.8; }
      }
    }
  }

  if (state === 'race') {
    if (!r.finished && r.dist >= LAPS * TRACK_LEN) { r.finished = true; r.finishTime = raceTime; }
    if (r.boostT <= 0 && Math.random() < dt * 0.05) r.boostT = 1.4;
  }
}

/* ================= Rempler, Windschatten, Platzierung ================= */
function collide(dt) {
  const p = player;
  let slip = false, team = false;
  for (const r of racers) {
    if (r === p || r.big) continue;                  // den Boss regelt boss.js
    const dz = mod(r.dist - p.dist + TRACK_LEN / 2, TRACK_LEN) - TRACK_LEN / 2;   // > 0: Gegner vorn
    const dx = r.x - p.x;
    if (!r.ally && Math.abs(dz) < 240 && Math.abs(dx) < 0.125 && Math.abs(r.h - p.h) < 300 && p.bumpT <= 0) {
      p.bumpT = 0.35;
      const side = dx >= 0 ? 1 : -1;
      if (r.god === 'ares' && state === 'race') {
        p.bumpT = 0.9;
        p.speed *= 0.82;
        p.boostT = 0;
        p.steerV -= side * 1.7;
        endDrift(p, false);
        if (!p.auto) { Sfx.crash(); shake = 14; popup('ARES RAMMT!', '#ff5a5a', 0.9); }
        continue;
      }
      if (p.boostT > 0) {
        r.speed *= 0.85;
        r.hitT = 0.4;
        r.targetX = clamp(r.x + side * 0.3, -0.75, 0.75);
        r.laneT = 1.5;
      } else if (dz > 0) p.speed = Math.min(p.speed, r.speed * 0.9);
      else r.speed = Math.min(r.speed, p.speed * 0.9);
      p.steerV -= side * 0.9;
      r.x = clamp(r.x + side * 0.05, -0.8, 0.8);
      if (!p.auto) { Sfx.bump(); shake = Math.max(shake, 6); }
    }
    if (dz > 350 && dz < 2800 && Math.abs(dx) < 0.13 && p.speed > MAX_SPEED * 0.7 && !p.air) { slip = true; if (r.ally) team = true; }
  }
  const was = p.slip > 0.6;
  p.slip = damp(p.slip, slip ? 1 : 0, slip ? 2.2 : 4, dt);
  if (!was && p.slip > 0.6 && !p.auto && state === 'race') popup(team ? 'TEAM-WINDSCHATTEN' : 'WINDSCHATTEN', team ? '#7dffd8' : '#bfe9ff', 0.9);
}

function rank() {
  const order = racers.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.dist - a.dist;
  });
  let place = 0;
  for (const r of order) r.pos = r.ally ? 0 : ++place;      // der Schwurbund zählt als ein Fahrer: Robin und Jario laufen außer Wertung
}

/* ================= Zieleinlauf, Ergebnis, Bestzeiten ================= */
const bestKey = id => 'toma-riders-best-' + id + '-' + difficulty;

function loadBest(id) {
  try {
    const v = JSON.parse(localStorage.getItem(bestKey(id)) || 'null');
    return v && typeof v.total === 'number' ? v : null;
  } catch (err) {
    return null;
  }
}

function finishRace() {
  state = 'finished';
  finishT = 0;
  const p = player;
  p.finished = true;
  p.finishTime = raceTime;
  p.auto = true;
  p.boostT = 0;
  for (const r of racers) {
    if (!r.finished) r.estTime = raceTime + Math.max(0, LAPS * TRACK_LEN - r.dist) / (MAX_SPEED * r.skill * skillMul * DIFF[difficulty] * AI_PACE);
  }
  rank();
  teamMates = racers.filter(r => r.ally).map(r => ({ name: r.name, dot: r.pal.dot }));
  finalOrder = racers.filter(r => !r.ally).sort((a, b) => a.pos - b.pos).map(r => ({
    name: r.name, isPlayer: r.isPlayer, dot: r.pal.dot, time: r.finished ? r.finishTime : r.estTime,
  }));
  if (mode === 'free') {
    const old = loadBest(track.id);
    newRecord = !old || raceTime < old.total;
    try {
      localStorage.setItem(bestKey(track.id), JSON.stringify({
        total: newRecord ? raceTime : old.total,
        lap: old ? Math.min(old.lap, bestLap) : bestLap,
      }));
    } catch (err) { /* privater Modus o. Ä.: Bestzeit wird dann einfach nicht gespeichert */ }
  }
  Sfx.finish(p.pos);
}

function showResults() {
  const pos = finalOrder.findIndex(r => r.isPlayer) + 1;
  const story = mode === 'story';
  $('resTitle').textContent = boss ? 'KRONOS BESIEGT!' : pos === 1 ? 'SIEG!' : story ? 'GESCHAFFT – PLATZ ' + pos : 'PLATZ ' + pos;
  const sub = $('resSub');
  sub.textContent = '';
  const line = document.createElement('div');
  line.append('Zeit ');
  const b1 = document.createElement('b'); b1.textContent = fmtTime(raceTime); line.append(b1);
  line.append('  ·  Beste Runde ');
  const b2 = document.createElement('b'); b2.textContent = fmtTime(bestLap); line.append(b2);
  if (boss) {
    line.textContent = '';
    line.append('Zeit ');
    const b3 = document.createElement('b'); b3.textContent = fmtTime(raceTime); line.append(b3);
    line.append('  ·  Schwurbund hält: ' + boss.thread + '/' + boss.threadMax);
  }
  sub.append(line);
  if (newRecord && !story) {
    const rec = document.createElement('div');
    rec.className = 'rec';
    rec.textContent = 'Neue Bestzeit!';
    sub.append(rec);
  }
  const table = $('resTable');
  table.textContent = '';
  const lead = finalOrder[0].time;
  finalOrder.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'trow' + (r.isPlayer ? ' me' : '');
    const p = document.createElement('span'); p.className = 'p'; p.textContent = (i + 1) + '.';
    const d = document.createElement('span'); d.className = 'd'; d.style.background = r.dot;
    const n = document.createElement('span'); n.textContent = r.name;
    const t = document.createElement('span'); t.className = 't'; t.textContent = i === 0 ? fmtTime(r.time) : '+' + (r.time - lead).toFixed(2) + ' s';
    row.append(p, d, n, t);
    table.append(row);
  });
  for (const r of teamMates) {
    const row = document.createElement('div');
    row.className = 'trow team';
    const p = document.createElement('span'); p.className = 'p'; p.textContent = '★';
    const d = document.createElement('span'); d.className = 'd'; d.style.background = r.dot;
    const n = document.createElement('span'); n.textContent = r.name;
    const t = document.createElement('span'); t.className = 't'; t.textContent = 'Schwurbund';
    row.append(p, d, n, t);
    table.append(row);
  }
  $('againBtn').textContent = story ? 'Weiter' : 'Nochmal';
  $('menuBtn').classList.toggle('hidden', story);
  showUI('results');
}

/* ================= Menüs ================= */
/* Martin Swagger kommentiert, wenn er Toma überholt oder überholt wird */
const RIVAL_UP = ['»AUS DEM WEG, LIOUMBA!«', '»STIL SCHLÄGT FLEISS, KOLLEGE.«', '»MAN SIEHT SICH – VON HINTEN.«'];
const RIVAL_DOWN = ['»DAS WAR WINDSCHATTEN!«', '»GENIESS ES. DAUERT NICHT LANG.«', '»NICHT ÜBEL … FÜR DEIN TEAM.«'];
function rivalBanter(dt) {
  const p = player;
  if (p.finished || rival.finished) return;
  rivalT -= dt;
  const ahead = rival.dist > p.dist;
  if (rivalAhead !== null && ahead !== rivalAhead && rivalT <= 0 && raceTime > 6 && Math.abs(rival.dist - p.dist) < 1500) {
    rivalT = 9;
    const lines = ahead ? RIVAL_UP : RIVAL_DOWN;
    popup('MARTIN: ' + lines[(Math.random() * lines.length) | 0], '#ffd76a', 1.6);
  }
  rivalAhead = ahead;
}

function refreshMenu() {
  const st = Story.status();
  $('storyBtn').textContent = st.finished ? 'Story nochmal' : st.ch > 0 ? 'Story fortsetzen' : 'Story starten';
  $('storyLine').textContent = st.finished
    ? 'Ticket von K. – gelöst  ·  Durchtrennte Fäden: ' + st.deaths
    : st.ch > 0
      ? 'Ticket von K. – Kapitel ' + (st.ch + 1) + '/' + st.total + ': ' + st.title
      : 'Ticket von K. – Drei Entwickler, ein uraltes Ticket und eine Sagenwelt voller Götter-Ritter. Verlierst du, schneiden die Moiren.';
  $('storyResetBtn').classList.toggle('hidden', st.ch === 0 || st.finished);
}

/* Kleines Vorschaubild einer Strecke für die Karten der Strecken- und Kapitelwahl */
function trackPreview(t, locked) {
  const th = THEMES[t.theme];
  const pv = document.createElement('div');
  pv.className = 'tprev';
  pv.style.background = locked
    ? 'linear-gradient(180deg, #05020c, #1a0830)'
    : 'linear-gradient(180deg, ' + th.sky[0] + ' 0%, ' + th.sky[1] + ' 38%, ' + th.sky[2] + ' 62%, ' + t.zones[0].g1 + ' 62%, ' + t.zones[0].g2 + ' 100%)';
  if (!locked) {
    const rd = document.createElement('div');
    rd.className = 'troad';
    rd.style.background = t.zones[0].r1;
    rd.style.borderColor = t.zones[0].rumB;
    pv.append(rd);
  }
  return pv;
}

/* Kapitelwahl: Jedes Kapitel der Story lässt sich direkt ansteuern; markiert ist das Kapitel des Spielstands */
function buildChapterGrid() {
  const grid = $('chapGrid');
  grid.textContent = '';
  const st = Story.status();
  const div = (cls, text) => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    return d;
  };
  Story.chapters().forEach((c, i) => {
    const t = TRACKS.find(k => k.id === c.track);
    const here = !st.finished && i === st.ch;
    const card = document.createElement('button');
    card.className = 'tcard' + (here ? ' sel' : '');
    const kick = div('tkick', c.finale ? 'Finale' : 'Kapitel ' + (i + 1));
    if (here) {
      const mark = document.createElement('span');
      mark.className = 'bsel';
      mark.textContent = 'Dein Stand';
      kick.append(mark);
    }
    card.append(
      trackPreview(t, false), kick, div('tname', c.title),
      div('tsub', t.name + '  ·  ' + (c.boss ? 'Bosskampf' : c.laps + ' Runden')),
      div('tgoal', 'Ziel: ' + c.goalText));
    card.addEventListener('click', () => { Sfx.init(); Story.beginAt(i); });
    grid.append(card);
  });
}

function buildTrackGrid() {
  const grid = $('trackGrid');
  grid.textContent = '';
  const done = Story.status().done;
  for (const t of TRACKS) {
    const locked = t.locked && !done;
    const card = document.createElement('button');
    card.className = 'tcard' + (locked ? ' locked' : '');
    const pv = trackPreview(t, locked);
    const nm = document.createElement('div');
    nm.className = 'tname';
    nm.textContent = locked ? '???' : t.name;
    const sb = document.createElement('div');
    sb.className = 'tsub';
    const best = locked ? null : loadBest(t.id);
    sb.textContent = locked ? 'Schließe die Story ab' : t.sub + (best ? '  ·  ' + fmtTime(best.total) : '');
    card.append(pv, nm, sb);
    if (!locked) card.addEventListener('click', () => startFree(t.id));
    grid.append(card);
  }
}

/* ================= Simulation ================= */
function update(dt) {
  gameT += dt;
  keepPrev();

  if (state === 'countdown') {
    const prev = countdownT;
    countdownT -= dt;
    for (let k = 3; k >= 1; k--) if (prev > k && countdownT <= k) Sfx.beep(false);
    if (countdownT <= 0) {
      state = 'race';
      Sfx.beep(true);
      Sfx.musicStart();
      popup('LOS!', '#7dffd8', 1.0);
      if (Input.up && gameT - upPressedAt < 0.4) {
        player.boostT = 1.3;
        popup('RAKETENSTART!', '#ffd34d');
        Sfx.boost();
      }
    }
  }

  if (state === 'race') raceTime += dt;

  if (state !== 'countdown') {
    for (const r of racers) {
      if (r.isPlayer) updatePlayer(r, dt);
      else updateAI(r, dt);
      poseUpdate(r, dt);
    }
    collide(dt);
    rank();
    if (boss && state === 'race') bossUpdate(dt);
    if (rival && state === 'race') rivalBanter(dt);
  }

  if (state === 'finished') {
    finishT += dt;
    if (!resultsShown && finishT > 1.8) {
      resultsShown = true;
      if (mode === 'story') Story.raceDone(finalOrder);
      else showResults();
    }
  }

  updateCamera(dt);
  W3.tick(dt);
  updateFx(dt);
}

function updateCamera(dt) {
  const p = player;
  cam.z = mod(p.dist - CAM_D, TRACK_LEN);
  cam.x = damp(cam.x, p.x * ROAD_W * 0.72, 9, dt);
  // Brennweite: weiter beim Boost und im Looping, enger bei Tricks
  boostVis = damp(boostVis, p.boostT > 0 ? 1 : 0, 5, dt);
  loopVis = damp(loopVis, findSegment(cam.z).loop ? 1 : 0, 4, dt);
  trickVis = damp(trickVis, p.air && p.trick && p.trick.t > 0 && !p.auto ? 1 : 0, 7, dt);
  focal = BASE_FOCAL * (1 - 0.13 * boostVis - 0.06 * loopVis + 0.09 * trickVis);
}

/* ================= Zwischenbilder ================= */
/* Gerechnet wird in festen Schritten (60 pro Sekunde), gezeichnet so oft, wie der Bildschirm es anbietet. Damit die
   Bewegung dabei gleichmäßig bleibt, zeigt jedes Bild einen Stand zwischen dem vorigen und dem aktuellen Schritt
   (a = Anteil des aktuellen). Fahrer und Kamera werden dafür kurz auf diesen Zwischenstand gesetzt und nach dem
   Zeichnen wieder zurück – die Simulation selbst merkt davon nichts. */
const prevCam = { x: 0, focal: BASE_FOCAL };
const trueCam = { x: 0, z: 0, focal: 0 };
let blended = [];

function movers() { return boss && boss.shots.length ? racers.concat(boss.shots) : racers; }

/* Stand vor dem nächsten Schritt merken */
function keepPrev() {
  for (const r of movers()) { r.pDist = r.dist; r.pX = r.x; r.pH = r.h; r.pY = r.yAbs; }
  prevCam.x = cam.x;
  prevCam.focal = focal;
}

function blendIn(a) {
  blended = movers();
  for (const r of blended) {
    r.tDist = r.dist; r.tZ = r.z; r.tX = r.x; r.tH = r.h;
    const dd = r.dist - r.pDist;
    if (dd > -400 && dd < 1200) {                    // sonst wurde der Fahrer versetzt (Sturz in die Schlucht, Neustart)
      r.dist = r.pDist + dd * a;
      r.z = mod(r.dist, TRACK_LEN);
      r.x = lerp(r.pX, r.x, a);
      // Flughöhe aus der absoluten Höhe: an Schanzenkanten springt die Höhe über der Bahn, die Flugbahn selbst nicht
      r.h = r.air || r.pH > 0 ? Math.max(0, lerp(r.pY, r.yAbs, a) - roadYAt(r.z)) : 0;
    }
  }
  trueCam.x = cam.x; trueCam.z = cam.z; trueCam.focal = focal;
  cam.z = mod(player.dist - CAM_D, TRACK_LEN);
  cam.x = lerp(prevCam.x, cam.x, a);
  focal = lerp(prevCam.focal, focal, a);
}

function blendOut() {
  for (const r of blended) { r.dist = r.tDist; r.z = r.tZ; r.x = r.tX; r.h = r.tH; }
  cam.x = trueCam.x; cam.z = trueCam.z; focal = trueCam.focal;
}

function updateFx(dt) {
  const p = player;
  shake = damp(shake, 0, 8, dt);
  flash = damp(flash, 0, 6, dt);
  if (orbChainT > 0) orbChainT -= dt;
  if (warnT > 0) warnT -= dt;
  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].t += dt;
    if (popups[i].t >= popups[i].life) popups.splice(i, 1);
  }
  if (state !== 'countdown') {
    if (p.boostT > 0) {
      for (let i = 0; i < 2; i++) {
        spawn(pScr.x + (Math.random() - 0.5) * 22 * pScr.k, pScr.y - 4 * pScr.k,
          (Math.random() - 0.5) * 160, 250 + Math.random() * 420,
          0.3 + Math.random() * 0.2, 5 + Math.random() * 7, Math.random() < 0.5 ? '#ffd34d' : '#ff8a2b');
      }
    }
    if (p.scrape) {
      for (let i = 0; i < 2; i++) {
        spawn(pScr.x + p.scrapeSide * 22 * pScr.k, pScr.y - 12 * pScr.k,
          -p.scrapeSide * (80 + Math.random() * 260), -120 - Math.random() * 320,
          0.25 + Math.random() * 0.25, 3 + Math.random() * 4, '#ffe9a8', 1400);
      }
    }
    if (p.drift && !p.air) {                       // Funken vom quer gestellten Board, Farbe = Ladestufe
      const col = DRIFT_COL[p.driftLvl];
      for (let i = 0; i < (p.driftLvl ? 3 : 1); i++) {
        spawn(pScr.x - p.drift * 14 * pScr.k + (Math.random() - 0.5) * 10 * pScr.k, pScr.y - 3 * pScr.k,
          -p.drift * (120 + Math.random() * 320), -60 - Math.random() * 260,
          0.22 + Math.random() * 0.25, 3 + Math.random() * 5, col, 1100);
      }
    }
    if (p.trick && p.trick.t > 0 && !p.auto) {     // Funkeln rund um den Fahrer, solange ein Trick läuft
      const a = Math.random() * TAU, rr = (28 + Math.random() * 42) * pScr.k;
      spawn(pScr.x + Math.cos(a) * rr, pScr.y - 55 * pScr.k + Math.sin(a) * rr, Math.cos(a) * 70, Math.sin(a) * 70 - 40,
        0.3 + Math.random() * 0.25, 3 + Math.random() * 4, Math.random() < 0.5 ? '#ffffff' : '#ffe9a0');
    }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.life -= dt;
    if (q.life <= 0) { particles.splice(i, 1); continue; }
    q.vy += q.grav * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
}

/* ================= Zeichnen: Helfer ================= */
function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function riderLabel(r, sx, fy, k) {
  if (r.isPlayer || r.shot || r.big || state === 'menu' || k <= 0.42 || k >= 2.9) return;
  const size = clamp(11 * k + 6, 11, 22);
  ctx.font = '800 ' + size + 'px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(8,20,60,.85)';
  const label = r.ally ? '★ ' + r.name : r.pos + '. ' + r.name;
  ctx.strokeText(label, sx, fy - 110 * k);
  ctx.fillStyle = r.ally ? '#7dffd8' : r.god || r.rival ? '#ffd34d' : '#ffffff';
  ctx.fillText(label, sx, fy - 110 * k);
}

/* Namensschilder und Boss-Markierung liegen als 2D-Bild über der 3D-Welt (Bildschirmlage liefert world3d.js) */
function drawLabels() {
  for (const r of racers) {
    if (!r.sv) continue;
    if (r.big) drawBossMark(r.sx, r.sy, r.sk);
    riderLabel(r, r.sx, r.sy, r.sk);
  }
}

function drawParticles() {
  if (!particles.length) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const q of particles) {
    const a = q.life / q.max;
    if (q.ring) {                                    // Landering: breitet sich flach am Boden aus
      ctx.globalAlpha = a;
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 2 + 5 * a;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, q.size * (1.15 - a), q.size * 0.3 * (1.15 - a), 0, 0, TAU);
      ctx.stroke();
      continue;
    }
    const s = q.size * (0.4 + a * 0.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, s / 2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawSpeedFx() {
  const p = player;
  const sp = p.speed / MAX_SPEED;
  const inten = clamp(boostVis + (p.slip > 0.6 ? 0.35 : 0) + Math.max(0, sp - 0.97) * 3, 0, 1);
  if (inten < 0.05) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  const n = Math.floor(8 + inten * 26);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, r0 = 210 + Math.random() * 260, len = 40 + Math.random() * 180 * inten;
    const c = Math.cos(a), s = Math.sin(a);
    ctx.globalAlpha = (0.05 + Math.random() * 0.2) * inten;
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.moveTo(CX + c * r0 * 1.5, CY + 60 + s * r0 * 0.9);
    ctx.lineTo(CX + c * (r0 + len) * 1.5, CY + 60 + s * (r0 + len) * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

/* ================= Zeichnen: HUD ================= */
function txt(s, x, y, size, fill, align, stroke, sw) {
  ctx.font = 'italic 900 ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  if (stroke !== null) {
    ctx.lineWidth = sw || Math.max(3, size * 0.16);
    ctx.strokeStyle = stroke || '#0b1b4d';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(s, x, y);
}

function drawHUD() {
  const p = player;
  const boosting = p.boostT > 0;

  if (boss) drawBossHUD();
  else {
    // Platzierung
    txt('PLATZ', 40, 38, 18, '#bfe9ff');
    const posCol = p.pos === 1 ? '#ffd34d' : '#ffffff';
    txt(String(p.pos), 36, 114, 86, posCol);
    const wNum = ctx.measureText(String(p.pos)).width;
    txt('/' + racers.reduce((c, r) => c + (r.ally ? 0 : 1), 0), 46 + wNum, 114, 30, '#ffffff');

    // Story-Ziel
    if (mode === 'story') {
      const g = Story.goalState();
      txt((g.ok ? '✔ ' : '✖ ') + g.text, 40, 146, 16, g.ok ? '#7dffd8' : '#ff7a7a', 'left', '#0b1b4d', 4);
    }

    // Runde und Zeit
    const lap = clamp(Math.floor(p.dist / TRACK_LEN) + 1, 1, LAPS);
    txt('RUNDE', W - 40, 38, 18, '#bfe9ff', 'right');
    txt(lap + '/' + LAPS, W - 38, 92, 58, '#ffffff', 'right');
    txt(fmtTime(raceTime), W - 40, 126, 26, '#ffffff', 'right');
    if (isFinite(bestLap)) txt('Beste Runde ' + fmtTime(bestLap), W - 40, 150, 15, '#7dffd8', 'right', '#0b1b4d', 3.5);

    // Rundenfortschritt mit allen Fahrern
    const bx = 440, bw = 400, by = 32;
    ctx.fillStyle = 'rgba(8,20,60,.6)';
    rrect(ctx, bx - 12, by - 10, bw + 24, 20, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(bx, by - 1.5, bw, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 1.5, by - 7, 3, 14);
    ctx.fillRect(bx + bw - 1.5, by - 7, 3, 14);
    for (const r of racers) {
      if (r.isPlayer) continue;
      ctx.fillStyle = r.pal.dot;
      ctx.beginPath();
      ctx.arc(bx + bw * (r.z / TRACK_LEN), by, r.god ? 6.5 : 5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd34d';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bx + bw * (p.z / TRACK_LEN), by, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // Energie
  const ex = 124, ey = H - 76, ew = 290, eh = 24;
  ctx.drawImage(HUD_PORTRAIT, 24, H - 114, 92, 92);
  txt('BOOST', ex + 8, ey - 9, 17, '#bfe9ff');
  ctx.save();
  ctx.translate(ex + 14, ey);
  ctx.transform(1, 0, -0.3, 1, 0, 0);
  ctx.fillStyle = 'rgba(8,20,60,.75)';
  ctx.fillRect(-4, -4, ew + 8, eh + 8);
  const f = p.energy / 100;
  const eg = ctx.createLinearGradient(0, 0, ew, 0);
  if (boosting) { eg.addColorStop(0, '#ff8a2b'); eg.addColorStop(1, '#ffe14d'); }
  else { eg.addColorStop(0, '#19c9a8'); eg.addColorStop(1, '#7dffd8'); }
  ctx.fillStyle = eg;
  ctx.fillRect(0, 0, ew * f, eh);
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.fillRect(0, 0, ew * f, eh * 0.4);
  ctx.fillStyle = 'rgba(8,20,60,.9)';
  for (let i = 1; i < 4; i++) ctx.fillRect(ew * i / 4 - 1.5, 0, 3, eh);
  ctx.restore();
  if (state === 'race' && !boosting && p.energy >= BOOST_COST && Math.sin(gameT * 8) > -0.3) {
    txt(Input.touch ? 'BEREIT' : 'LEERTASTE', ex + ew + 8, ey - 9, 15, '#ffd34d', 'right', '#0b1b4d', 3.5);
  }

  // Tempo
  const kmh = Math.round(p.speed / MAX_SPEED * 240);
  txt(String(kmh), W - 106, H - 46, 76, boosting ? '#ffd34d' : '#ffffff', 'right');
  txt('km/h', W - 38, H - 46, 22, '#bfe9ff', 'right');
  for (let i = 0; i < 14; i++) {
    const on = p.speed / BOOST_SPEED > (i + 0.5) / 14;
    ctx.fillStyle = on ? (i >= 10 ? '#ffd34d' : '#7dffd8') : 'rgba(8,20,60,.6)';
    const x0 = W - 322 + i * 20.5;
    quad(x0 + 4, H - 34, x0 + 19, H - 34, x0 + 15, H - 22, x0, H - 22);
  }
  if (p.slip > 0.6) txt('WINDSCHATTEN', W - 40, H - 136, 17, '#bfe9ff', 'right', '#0b1b4d', 3.5);

  // Trick-Hinweis in der Luft
  if (state === 'race' && p.air && !p.auto && !Input.touch && p.airEta - p.airT > 0.3) {
    txt('←  →  GRIFF · ROLLE     ↑  HANDSTAND · FLIP     ↓  SPIN · KICKFLIP', CX, H - 40, 19, '#ffd34d', 'center');
  }

  // Drift-Ladung: drei Stufen, jede zündet beim Loslassen einen längeren Turbo
  if (p.drift && !p.air) {
    const lvl = p.driftLvl;
    const from = lvl ? DRIFT_AT[lvl - 1] : 0;
    const part = lvl >= 3 ? 1 : (p.driftT - from) / (DRIFT_AT[lvl] - from);
    const mx = CX - 114, my = H - 42;
    txt(lvl ? 'DRIFT  ×' + lvl : 'DRIFT', CX, my - 8, 18, DRIFT_COL[lvl], 'center');
    for (let i = 0; i < 3; i++) {
      const x0 = mx + i * 76;
      ctx.fillStyle = 'rgba(8,20,60,.75)';
      quad(x0 + 6, my, x0 + 74, my, x0 + 68, my + 14, x0, my + 14);
      const f = i < lvl ? 1 : i === lvl ? part : 0;
      if (f > 0) {
        ctx.fillStyle = DRIFT_COL[i + 1];
        quad(x0 + 8, my + 2, x0 + 8 + 62 * f, my + 2, x0 + 4 + 62 * f, my + 12, x0 + 4, my + 12);
      }
    }
  }

  // Meldungen
  for (let i = 0; i < popups.length; i++) {
    const q = popups[i];
    const a = q.t / q.life;
    const inS = Math.min(1, q.t / 0.14);
    ctx.globalAlpha = a > 0.7 ? (1 - a) / 0.3 : 1;
    const size = (q.text.length > 22 ? 38 : 48) * (0.6 + 0.4 * easeOut(0, 1, inS));
    txt(q.text, CX, 196 + i * 56 - a * 14, size, q.color, 'center');
  }
  ctx.globalAlpha = 1;

  // Warnung vor Götter-Fallen
  if (warnT > 0 && state === 'race' && Math.sin(gameT * 22) > -0.4) {
    txt('⚠ ' + warnText, CX, 138, 22, warnCol, 'center', '#0b1b4d', 5);
  }

  // Countdown
  if (state === 'countdown') {
    txt(track.name.toUpperCase(), CX, 100, 30, '#ffffff', 'center');
    txt('Brett: ' + board.name, CX, 128, 17, '#7dffd8', 'center', '#0b1b4d', 4);
    const n = Math.ceil(countdownT);
    if (n > 3) {
      txt('BEREIT?', CX, 300, 76, '#ffffff', 'center');
    } else {
      const fr = countdownT - Math.floor(countdownT);
      ctx.globalAlpha = clamp(fr * 2.2, 0, 1);
      txt(String(n), CX, 330, 150 + 70 * fr, n === 1 ? '#ffd34d' : '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }
    txt(Input.touch ? 'Gas läuft automatisch' : '↑ halten = Gas   ·   Genau zum LOS drücken = Raketenstart', CX + 14, H - 30, 18, '#eaffff', 'center', '#0b1b4d', 4);
    txt(Input.touch ? 'DRIFT halten + lenken = Driften' : 'X oder Shift halten + lenken = Driften   ·   Loslassen = Turbo', CX + 14, H - 58, 16, '#ffd34d', 'center', '#0b1b4d', 4);
  }

  if (state === 'finished' && !resultsShown) {
    if (!boss) txt('ZIEL!', CX, 330, 150, '#ffd34d', 'center');
    else if (boss.lost) txt(boss.lost === 'time' ? 'DIE ZEIT STEHT.' : 'SCHNIPP.', CX, 330, 110, '#ff5a5a', 'center');
    else txt('SCHILD ZERBROCHEN!', CX, 330, 96, '#ffd34d', 'center');
  }

  if (Sfx.muted) txt('TON AUS (M)', CX, 66, 14, '#ffffff', 'center', '#0b1b4d', 3.5);
}

/* a = Anteil des laufenden Schritts (siehe Zwischenbilder); ohne Angabe wird der aktuelle Stand gezeichnet */
function render(a) {
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  const world = W3.draw(a);                         // die Rennwelt entsteht auf der eigenen 3D-Leinwand darunter
  ctx.clearRect(-2, -2, W + 4, H + 4);
  ctx.save();
  if (world) drawLabels();
  drawParticles();
  drawSpeedFx();
  ctx.restore();
  if (flash > 0.01) {
    ctx.globalAlpha = flash * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (state !== 'menu') drawHUD();
}

/* ================= Bedienung ================= */
onAction = a => {
  if (ui === 'nogl') return;
  Sfx.init();
  if (a === 'mute') { Sfx.toggleMute(); return; }
  const ok = a === 'confirm' || a === 'boost';

  if (ui === 'vn') {
    if (ok) Story.advance();
    else if (a === 'pause') Story.skip();
    return;
  }
  if (ui === 'card') { if (ok) Story.go(); else if (a === 'pause') toMenu(); return; }
  if (ui === 'death') { if (ok || a === 'restart') Story.retry(); else if (a === 'pause') toMenu(); return; }
  if (ui === 'ending') { if (ok) toMenu(); return; }
  if (ui === 'tracks' || ui === 'chapters') { if (a === 'pause') { showUI('menu'); refreshMenu(); } return; }
  if (ui === 'boards') { if (a === 'pause') closeBoards(); return; }
  if (ui === 'menu') { if (a === 'confirm') Story.begin(false); return; }
  if (ui === 'results') {
    if (ok || a === 'restart') { if (mode === 'story') Story.next(); else restartRace(); }
    return;
  }

  if (a === 'pause') { togglePause(); return; }
  if (paused) { if (a === 'confirm') togglePause(false); return; }
  if (state === 'finished') return;
  if (a === 'restart') { restartRace(); return; }
  if (a === 'boost') { tryBoost(); return; }
  if (a === 'up') upPressedAt = gameT;
  if (a === 'left' || a === 'right' || a === 'up' || a === 'down') tryTrick(a);
};

$('storyBtn').addEventListener('click', () => { Sfx.init(); Story.begin(false); });
$('storyResetBtn').addEventListener('click', () => { Sfx.init(); Story.begin(true); });
$('freeBtn').addEventListener('click', () => { buildTrackGrid(); showUI('tracks'); });
$('tracksBack').addEventListener('click', () => { showUI('menu'); refreshMenu(); });
$('chapBtn').addEventListener('click', e => { e.currentTarget.blur(); buildChapterGrid(); showUI('chapters'); });
$('chapBack').addEventListener('click', () => { showUI('menu'); refreshMenu(); });
for (const id of ['boardBtn', 'tracksBoard', 'cardBoard']) $(id).addEventListener('click', e => { e.currentTarget.blur(); openBoards(); });
$('boardsBack').addEventListener('click', closeBoards);

$('noglReload').addEventListener('click', () => location.reload());
$('againBtn').addEventListener('click', () => { if (mode === 'story') Story.next(); else restartRace(); });
$('menuBtn').addEventListener('click', toMenu);
$('quitBtn').addEventListener('click', toMenu);
$('resumeBtn').addEventListener('click', () => togglePause(false));
$('vn').addEventListener('click', e => { if (!e.target.closest('button')) Story.advance(); });
$('vnSkip').addEventListener('click', () => Story.skip());
$('vnAuto').addEventListener('click', e => { e.currentTarget.classList.toggle('on', Story.toggleAuto()); e.currentTarget.blur(); });
$('cardGo').addEventListener('click', () => Story.go());
$('cardMenu').addEventListener('click', toMenu);
$('deathRetry').addEventListener('click', () => Story.retry());
$('deathMenu').addEventListener('click', toMenu);
$('endMenu').addEventListener('click', toMenu);

// nur die Schwierigkeits-Knöpfe – „Brett“ und „Kapitel wählen“ sehen gleich aus, stellen aber nichts an der Schwierigkeit um
const DIFF_CHIPS = document.querySelectorAll('.chip[data-diff]');
DIFF_CHIPS.forEach(b => {
  b.addEventListener('click', () => {
    difficulty = +b.dataset.diff;
    DIFF_CHIPS.forEach(c => c.classList.toggle('active', c === b));
    b.blur();
  });
});

function bindTouch(id, name) {
  const el = $(id);
  const down = e => {
    e.preventDefault();
    if (name !== 'boost') Input[name] = true;
    onAction(name);
    el.classList.add('on');
  };
  const up = e => {
    e.preventDefault();
    if (name !== 'boost') Input[name] = false;
    el.classList.remove('on');
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
bindTouch('tLeft', 'left');
bindTouch('tRight', 'right');
bindTouch('tBrake', 'down');
bindTouch('tBoost', 'boost');
bindTouch('tDrift', 'drift');

window.addEventListener('touchstart', () => {
  if (!Input.touch) {
    Input.touch = true;
    $('touch').classList.remove('hidden');
  }
}, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !paused) togglePause(true);
});

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  const cw = Math.max(320, Math.floor(W * s));
  stage.style.width = cw + 'px';
  stage.style.height = Math.floor(cw * H / W) + 'px';
  stage.style.setProperty('--u', (cw / W) + 'px');
  renderScale = clamp((cw / W) * Math.min(window.devicePixelRatio || 1, 2), 0.5, 2);
  canvas.width = Math.round(W * renderScale);
  canvas.height = Math.round(H * renderScale);
  Cut.resize(renderScale);
}

/* ================= Start ================= */
let lastT = performance.now(), accT = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  const cut = ui === 'vn';           // Zwischensequenz: Spielwelt pausiert, die Bühne übernimmt das Bild
  if (!paused && !cut) {
    accT += dt;
    let n = 0;
    while (accT >= STEP && n < 6) { update(STEP); accT -= STEP; n++; }
    if (n === 6) accT = 0;
  }
  Story.tick(dt);
  const p = player;
  Sfx.engine(p.speed / MAX_SPEED, p.boostT > 0, !paused && !cut && state !== 'menu', p.scrape, !!p.drift && !p.air);
  if (cut) {
    Cut.tick(dt);
    Cut.render();
  } else {
    const a = clamp(accT / STEP, 0, 1);
    blendIn(a);
    render(a);
    blendOut();
  }
}

buildArt();
buildWorldArt();
HUD_PORTRAIT = mk(184, 184, g => drawHeroPortrait(g, 92, 92, 1.8));
drawHeroPortrait($('portrait').getContext('2d'), 180, 180, 3.55);
resize();
window.addEventListener('resize', resize);
refreshBoardLabels();
const glOk = W3.init($('gl'), canvas, () => showNoGl(true));
toMenu();
if (glOk) requestAnimationFrame(frame);
else showNoGl(false);
