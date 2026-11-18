'use strict';

/* Finale: Bosskampf gegen Kronos. Kein Rennen – die Toma Heroes jagen ihn über die Strecke.
   Ablauf in Runden: Kronos greift an (Zeitrisse, Echos) → Robin oder Jario bringt seinen Zeitschild zum Flackern
   → Toma fährt mit Boost in ihn hinein. Verloren ist, wenn der Fadenbund reißt oder der Sand durchgelaufen ist. */

const BOSS_CFG = [               // je Schwierigkeit: Schildstärke, Fadenstärke, Sekunden Sand, Länge des Zeitfensters
  { hp: 5, thread: 6, time: 175, open: 6.5 },
  { hp: 6, thread: 4, time: 150, open: 5.5 },
  { hp: 7, thread: 3, time: 135, open: 4.8 },
];

/* Angriffsfolge je Stufe (Kronos wird wilder, je schwächer sein Schild ist): [Sekunde, Art, Stärke] */
const BOSS_PLAN = [
  [[1.2, 'rift', 0], [3.6, 'echo', 2], [6.6, 'rift', 0]],
  [[1.0, 'rift', 1], [3.0, 'echo', 3], [5.6, 'rift', 0], [7.2, 'echo', 2]],
  [[0.8, 'echo', 3], [2.6, 'rift', 1], [4.4, 'echo', 4], [6.6, 'rift', 1]],
];
const BOSS_LANES = [-0.55, 0, 0.55];
const BOSS_FINAL_PLAN = [[0.8, 'echo', 2], [2.4, 'rift', 1]];      // nach der Krise: kurze Angriffe, dann rammt Martin erneut
const BOSS_TAUNT = ['', 'Ich kenne jede Linie, die du fahren wirst!', 'Dann halte ich die Zeit eben mit Gewalt an!'];

/* Die Krise: Sobald nur noch ein Schildsegment steht, schlägt Kronos zurück. Robin und Jario fallen aus,
   der Fadenbund hängt am letzten Knoten – bis Martin Swagger über seinen Stolz springt. [Sekunde, Aktion] */
const BOSS_CRISIS = [
  [0, B => {
    bossSay('kronos', 'GENUG! Ich drehe die Uhr um – und diesmal bleibt ihr liegen.');
    B.guard = true;
    B.down = true;
    racers.forEach((r, i) => {
      if (!r.ally) return;
      r.gapNow = -1700 - i * 450;                    // weit zurückgeworfen
      r.stumbleT = 9;
      r.boostT = 0;
    });
    if (B.thread > 1) B.thread = 1;
    B.hurtT = 1.2;
    flash = 1;
    shake = 30;
    Sfx.rewind();
    Sfx.crash();
    popup('ROBIN UND JARIO SIND GETROFFEN!', '#ff5a5a', 1.7);
  }],
  [1.3, () => bossAttack('echo', 3)],
  [2.3, () => bossSay('robin', 'Toma! Mein Brett ist hin – ich komm nicht mehr an ihn ran!')],
  [3.7, () => bossAttack('rift', 1)],
  [4.7, () => bossSay('jario', 'Die Sanduhr ist gesperrt. Ich kann sie nicht mehr hacken!')],
  [5.8, () => bossAttack('echo', 3)],
  [7.0, () => bossSay('kronos', 'Niemand kommt mehr, Junge. Du bist allein. So wie ich es immer war.')],
  [8.2, () => bossAttack('rift', 0)],
  [10.0, () => bossMartin()],
  [12.8, () => bossSay('martin', 'Erzähl das bloß keinem, Lioumba. Und jetzt halt dich bereit!')],
  [14.4, () => bossPhase('assist')],
];

let bossOn = false;              // setzt setupRace: Ist das aktuelle Rennen der Bosskampf?
let boss = null;

function bossReset() {
  boss = null;
  if (!bossOn) return;
  const k = racers.find(r => r.god === 'kronos');
  if (!k) return;
  const c = BOSS_CFG[difficulty];
  k.big = 1.75;
  player.energy = 100;                              // Martin gibt Apollons Gunst weiter: volle Energie zum Start
  boss = {
    k, hp: c.hp, hpMax: c.hp, thread: c.thread, threadMax: c.thread, time: c.time, timeMax: c.time, openLen: c.open,
    phase: 'intro', t: 0, step: 0, delay: 0, cycle: 0, tier: 0, free: 1,
    shots: [], helper: null, hurtT: 0, hitFx: 0, lost: '',
    crisis: 0, guard: false, down: false, final: false, martin: null, say: null,
  };
}

const bossWon = () => !!boss && boss.hp <= 0;

function bossSay(who, text) {
  boss.say = { who, text, t: 0, dur: 2.4 + text.length * 0.035 };
  Sfx.blip();
}

/* Martin Swagger stößt dazu: Er hat seinen Faden an den Bund geknotet, um durch den Riss zu kommen */
function bossMartin() {
  const B = boss, p = player;
  const m = makeRacer(RACER.martin, clamp(p.x > 0 ? p.x - 0.5 : p.x + 0.5, -0.7, 0.7), p.dist - 2500, false);
  m.ally = 650;
  m.lane = m.x;
  m.speed = BOOST_SPEED;
  m.boostT = 4;
  racers.push(m);
  B.martin = m;
  B.final = true;
  B.down = false;
  for (const r of racers) {
    if (r.ally && r !== m) { r.gapNow = 0; r.stumbleT = 0; }       // Robin und Jario rappeln sich wieder auf
  }
  B.threadMax++;                                    // vier Fäden, ein Knoten
  B.thread = Math.min(B.threadMax, B.thread + 1);
  B.time = Math.max(B.time, 45);
  flash = 1;
  shake = 16;
  Sfx.boost();
  Sfx.lap();
  popup('MARTIN SWAGGER!', '#ffd76a', 1.9);
  popup('VIER FÄDEN, EIN KNOTEN!', '#7dffd8', 1.9);
  bossSay('martin', 'Allein? Von wegen. Der Riss lässt nur Knoten durch – also hab ich mich drangeknotet.');
}

function bossFailText() {
  return boss && boss.lost === 'time'
    ? 'Der Sand ist durchgelaufen. Kronos hält die Zeit an – für immer.'
    : 'Der Fadenbund ist gerissen. Die Moiren schneiden alle drei Fäden auf einmal.';
}

function bossPhase(ph) {
  const B = boss;
  if (B.helper) { B.helper.gapNow = 0; B.helper = null; }
  if (B.martin) B.martin.gapNow = 0;
  B.phase = ph;
  B.t = 0;
  B.step = 0;
  B.delay = 0;
  if (ph === 'assist') {
    const allies = racers.filter(r => r.ally && r !== B.martin);
    B.helper = B.martin || (allies.length ? allies[B.cycle % allies.length] : null);
    B.cycle++;
  }
}

/* Zeitfenster öffnen: der Schild flackert, Kronos lässt sich zurückfallen */
function bossOpen() {
  const B = boss, p = player, h = B.helper;
  const robin = !h || h.name === 'Robin';
  if (B.final) {
    B.guard = false;                                 // ab hier zählt wieder jeder Treffer
    popup('MARTIN RAMMT DEN ZEITSCHILD!', '#ffd76a', 1.5);
    bossSay('martin', 'JETZT, KURIER! Ich halte ihn fest – gib ihm den Rest!');
    p.energy = Math.max(p.energy, BOOST_COST * 2);
  } else popup(robin ? 'ROBIN RAMMT DEN ZEITSCHILD!' : 'JARIO HACKT DIE SANDUHR!', robin ? '#ffb46a' : '#8fc0ff', 1.3);
  if (p.energy < BOOST_COST) {
    p.energy = BOOST_COST;                           // der Fadenbund teilt seine Energie: ein Boost ist immer drin
    popup('FADENBUND: ENERGIE FÜR DICH!', '#7dffd8', 1.1);
  }
  Sfx.smash();
  Sfx.rewind();
  flash = Math.max(flash, 0.6);
  shake = Math.max(shake, 8);
  bossPhase('open');
}

/* Ein Angriff; false = geht hier gerade nicht (Looping, Schlucht, Sprung) und wird gleich noch einmal versucht */
function bossAttack(type, n) {
  const B = boss, k = B.k, N = segments.length;
  if (type === 'rift') return placeHazard('rift', !!n);

  // Echos: Schatten gescheiterter Tomas, die langsamer fahren als du – zwei von drei Spuren sind dicht
  const i0 = findSegment(k.z).index;
  const span = Math.ceil((n * 1700 + 800) / SEG_LEN);
  for (let i = 0; i < span; i++) {
    const s = segments[(i0 + i) % N];
    if (s.loop || s.gap || s.ramp) return false;
  }
  for (let row = 0; row < n; row++) {
    B.free = B.free === 0 ? 1 : B.free === 2 ? 1 : (Math.random() < 0.5 ? 0 : 2);
    for (let l = 0; l < 3; l++) {
      if (l === B.free) continue;
      const e = makeRacer(RACER['echo' + (1 + (row + l) % 4)], BOSS_LANES[l], k.dist + 300 + row * 1700, false);
      e.shot = true;
      e.fade = 0;
      e.age = 0;
      e.speed = player.speed;
      B.shots.push(e);
    }
  }
  warnT = 1.7;
  warnText = 'ECHOS VORAUS – AUSWEICHEN ODER DURCHBOOSTEN!';
  warnCol = '#c9d0de';
  Sfx.hazard();
  return true;
}

/* Toma wurde getroffen: der Fadenbund franst aus */
function bossHurt(src) {
  const B = boss, p = player;
  if (!B || B.phase === 'done' || B.hurtT > 0) return;
  const hold = B.guard && B.thread <= 1;
  if (!hold) B.thread--;
  B.hurtT = 1.1;
  if (src === 'echo') {
    p.speed *= 0.6;
    p.stumbleT = Math.max(p.stumbleT, 0.4);
    endDrift(p, false);
    Sfx.crash();
    burst(pScr.x, pScr.y - 40 * pScr.k, 14, '#aab0bc');
  }
  shake = Math.max(shake, 16);
  flash = Math.max(flash, 0.6);
  if (B.thread <= 0) { bossEnd('thread'); return; }
  popup(hold ? 'DER LETZTE KNOTEN HÄLT – NOCH!' : 'DER FADEN FRANST AUS!  ' + B.thread + '/' + B.threadMax, '#ff5a5a', 1.1);
}

/* Toma ist mit Boost durch den flackernden Schild gefahren */
function bossHit() {
  const B = boss, p = player, k = B.k;
  B.hp--;
  B.hitFx = 1;
  B.shots.length = 0;
  k.stumbleT = 1.3;
  p.energy = Math.min(100, p.energy + 10);
  shake = 22;
  flash = 1;
  Sfx.smash();
  Sfx.zap();
  burst(pScr.x, pScr.y - 60 * pScr.k, 30, '#d0a0ff');
  if (B.hp <= 0) {
    if (B.final) bossSay('martin', 'Nicht übel … für einen Kurier.');
    bossEnd('win');
    return;
  }
  if (B.hp === 1 && !B.crisis) B.crisis = 1;        // letztes Segment: nach dem Taumeln beginnt die Krise
  B.thread = Math.min(B.threadMax, B.thread + 1);  // jeder Treffer zieht den Knoten wieder fester
  popup('TREFFER!  NOCH ' + B.hp, '#ffd34d', 1.2);
  const f = B.hp / B.hpMax, tier = f <= 0.34 ? 2 : f <= 0.67 ? 1 : 0;
  if (tier > B.tier) {
    B.tier = tier;
    bossSay('kronos', BOSS_TAUNT[tier]);
  }
  bossPhase('stagger');
}

function bossEnd(kind) {
  const B = boss, p = player;
  B.lost = kind === 'win' ? '' : kind;
  B.shots.length = 0;
  if (B.helper) B.helper.gapNow = 0;
  B.helper = null;
  B.phase = 'done';
  warnT = 0;
  state = 'finished';
  finishT = 0;
  p.finished = true;
  p.finishTime = raceTime;
  p.auto = true;
  p.boostT = 0;
  endDrift(p, false);
  teamMates = racers.filter(r => r.ally).map(r => ({ name: r.name, dot: r.pal.dot }));
  finalOrder = [{ name: 'Toma', isPlayer: true, dot: p.pal.dot, time: raceTime }];
  flash = 1;
  if (kind === 'win') {
    B.k.hitT = 4;
    shake = 26;
    Sfx.finish(1);
  } else {
    shake = 18;
    Sfx.snip();
  }
}

/* Wunschtempo von Kronos (0 = normale KI). Er hält Abstand – außer im Zeitfenster: Da kommt ihm nur ein Boost bei. */
function bossTop(r) {
  const B = boss, p = player;
  if (r !== B.k || B.phase === 'done') return 0;
  const ahead = r.dist - p.dist;
  if (B.phase === 'open') {
    if (ahead < -150) return BOOST_SPEED * 1.12;
    return p.boostT > 0 ? MAX_SPEED * 0.93 : clamp(p.speed + (1150 - ahead) * 2, MAX_SPEED * 0.5, MAX_SPEED * 1.12);
  }
  const gap = B.phase === 'stagger' ? 3400 : B.phase === 'assist' ? 2300 : 2800;
  return clamp(p.speed + (gap - ahead) * 1.6, MAX_SPEED * 0.5, BOOST_SPEED * 1.25);
}

function bossUpdate(dt) {
  const B = boss, p = player, k = B.k;
  if (B.phase === 'done') return;
  B.t += dt;
  B.time -= dt;
  if (B.guard) B.time = Math.max(20, B.time - dt * 2.2);      // in der Krise rast der Sand – bis kurz vor Schluss
  if (B.say && (B.say.t += dt) > B.say.dur) B.say = null;
  if (B.hurtT > 0) B.hurtT -= dt;
  if (B.hitFx > 0) B.hitFx -= dt * 1.4;
  if (k.stumbleT > 0) k.stumbleT -= dt;
  if (B.time <= 0) { B.time = 0; bossEnd('time'); return; }

  // Kronos pendelt über die Bahn; im Zeitfenster schneller, damit man ihn anpeilen muss
  k.laneT = 1;
  k.targetX = B.phase === 'open' ? Math.sin(B.t * 1.5 + B.cycle) * (B.final ? 0.22 : 0.5) : B.phase === 'stagger' ? 0 : Math.sin(gameT * 0.7) * 0.45;

  if (B.phase === 'intro') {
    if (B.t > 2.5) bossPhase('attack');
  } else if (B.phase === 'attack') {
    const plan = B.final ? BOSS_FINAL_PLAN : BOSS_PLAN[B.tier];
    while (B.step < plan.length && B.t - B.delay >= plan[B.step][0]) {
      if (bossAttack(plan[B.step][1], plan[B.step][2])) B.step++;
      else { B.delay += 0.5; break; }
    }
    if (B.step >= plan.length && B.t - B.delay >= plan[plan.length - 1][0] + 2.2) bossPhase('assist');
  } else if (B.phase === 'assist') {
    const h = B.helper;
    if (h) {                                         // der Helfer schießt nach vorn zu Kronos
      h.gapNow = k.dist - p.dist - 220;
      h.targetX = k.x;
      h.laneT = 0.5;
    }
    if ((h && Math.abs(h.dist - k.dist) < 520 && B.t > 0.5) || B.t > 2.6) bossOpen();
  } else if (B.phase === 'crisis') {
    while (B.phase === 'crisis' && B.step < BOSS_CRISIS.length && B.t >= BOSS_CRISIS[B.step][0]) BOSS_CRISIS[B.step++][1](B);
  } else if (B.phase === 'open') {
    const dz = k.dist - p.dist, dx = k.x - p.x;
    if (B.final && B.martin) {                       // Martin bleibt an Kronos dran und hält ihn fest
      const m = B.martin;
      m.gapNow = dz - 110;
      m.targetX = clamp(k.x + (k.x > 0 ? -0.26 : 0.26), -0.8, 0.8);
      m.laneT = 0.5;
    }
    if (Math.abs(dz) < 320 && Math.abs(dx) < 0.25 && Math.abs(p.h - k.h) < 500) {
      if (p.boostT > 0) { bossHit(); return; }
      if (p.bumpT <= 0) {                            // ohne Boost prallt Toma ab
        p.bumpT = 0.6;
        p.speed *= 0.85;
        p.steerV -= (dx >= 0 ? 1 : -1) * 1.1;
        Sfx.bump();
        shake = Math.max(shake, 8);
        popup('OHNE BOOST KOMMST DU NICHT DURCH!', '#ffd34d', 1.1);
      }
    }
    if (B.t > B.openLen * (B.final ? 1.6 : 1)) {
      if (B.final) bossSay('martin', 'Er hat sich losgerissen! Nochmal – ich krieg ihn wieder zu fassen!');
      else popup('DER ZEITSCHILD STEHT WIEDER', '#d0a0ff', 1.2);
      bossPhase('attack');
    }
  } else if (B.phase === 'stagger') {
    if (B.t > 1.4) {
      if (B.crisis === 1) { B.crisis = 2; bossPhase('crisis'); }
      else bossPhase('attack');
    }
  }

  // Echos
  for (let i = B.shots.length - 1; i >= 0; i--) {
    const e = B.shots[i];
    e.age += dt;
    e.fade = Math.min(1, e.age / 0.35);
    e.speed = Math.max(3000, p.speed - 2600);
    e.dist += e.speed * dt;
    e.z = mod(e.dist, TRACK_LEN);
    e.lean = Math.sin(gameT * 3 + e.phase) * 0.3;
    const dz = e.dist - p.dist;
    if (dz < -900 || e.age > 14 || findSegment(e.z).gap) { B.shots.splice(i, 1); continue; }
    if (Math.abs(dz) < 210 && Math.abs(e.x - p.x) < 0.17 && p.h < 320) {
      B.shots.splice(i, 1);
      if (p.boostT > 0) {
        p.energy = Math.min(100, p.energy + 3);
        Sfx.smash();
        burst(pScr.x, pScr.y - 40 * pScr.k, 16, '#c9d0de');
        popup('ECHO DURCHBROCHEN!', '#c9d0de', 0.8);
      } else {
        bossHurt('echo');
        if (B.phase === 'done') return;               // der Faden ist gerissen: der Kampf ist vorbei, die Echos sind weg
      }
    }
  }
}

/* ================= Zeichnen ================= */

/* Schild bzw. Zielmarke um Kronos (in der Welt, direkt nach seinem Fahrer gezeichnet) */
function drawBossMark(sx, fy, k) {
  const B = boss;
  if (!B || B.phase === 'done') return;
  const cy = fy - 52 * k;
  ctx.save();
  if (B.phase === 'open') {
    const pu = 0.5 + 0.5 * Math.sin(gameT * 12);
    const r = (50 + 9 * pu) * k;
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = Math.max(2.5, 3 * k);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.65 + 0.35 * pu;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + gameT * 2.4;
      ctx.beginPath();
      ctx.arc(sx, cy, r, a + 0.25, a + 1.3);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(gameT * 31);      // der flackernde Rest des Schilds
    ctx.strokeStyle = '#e8d0ff';
    ctx.lineWidth = Math.max(1.5, 1.6 * k);
    ctx.beginPath();
    ctx.ellipse(sx, cy, 40 * k, 66 * k, 0, 0, TAU);
    ctx.stroke();
  } else {
    const hit = Math.max(0, B.hitFx);
    ctx.fillStyle = 'rgba(208,160,255,' + (0.1 + hit * 0.45).toFixed(2) + ')';
    ctx.strokeStyle = 'rgba(232,208,255,' + (0.6 + 0.25 * Math.sin(gameT * 5)).toFixed(2) + ')';
    ctx.lineWidth = Math.max(1.5, 2 * k);
    ctx.beginPath();
    ctx.ellipse(sx, cy, (40 + hit * 14) * k, (66 + hit * 14) * k, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, 1.1 * k);
    for (let i = -1; i <= 1; i++) {                          // Schildringe
      ctx.beginPath();
      ctx.ellipse(sx, cy + i * 30 * k, 38 * k * Math.cos(i * 0.5), 9 * k, 0, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Anzeige oben: Fadenbund (links), Zeitschild (Mitte), Sand (rechts) – ersetzt Platz, Runde und Fortschritt */
function drawBossHUD() {
  const B = boss, p = player;
  const blink = Math.sin(gameT * 14) > 0;

  // Fadenbund
  txt('FADENBUND', 40, 38, 18, B.hurtT > 0 && blink ? '#ff7a7a' : '#bfe9ff');
  for (let i = 0; i < B.threadMax; i++) {
    const on = i < B.thread, x = 52 + i * 36, y = 70;
    ctx.fillStyle = on ? (B.thread === 1 && blink ? '#ff5a5a' : '#7dffd8') : 'rgba(8,20,60,.6)';
    ctx.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 11.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (i < B.threadMax - 1) {
      ctx.strokeStyle = i < B.thread - 1 ? '#7dffd8' : 'rgba(255,255,255,.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 13, y);
      ctx.lineTo(x + 23, y);
      ctx.stroke();
    }
  }
  txt('Toma · Robin · Jario' + (B.martin ? ' · Martin' : ''), 40, 108, 14, B.martin ? '#ffd76a' : '#ffffff', 'left', '#0b1b4d', 3.5);

  // Sand
  const tl = Math.ceil(B.time), low = tl <= 25;
  txt('SAND', W - 40, 38, 18, '#bfe9ff', 'right');
  txt(Math.floor(tl / 60) + ':' + (tl % 60 < 10 ? '0' : '') + (tl % 60), W - 38, 92, 58, low && blink ? '#ff5a5a' : '#ffffff', 'right');
  const sw = 190, sx = W - 40 - sw;
  ctx.fillStyle = 'rgba(8,20,60,.7)';
  ctx.fillRect(sx - 3, 104, sw + 6, 14);
  ctx.fillStyle = low ? '#ff5a5a' : '#e8c877';
  ctx.fillRect(sx, 107, sw * clamp(B.time / B.timeMax, 0, 1), 8);

  // Zeitschild
  const bw = 430, bx = CX - bw / 2, by = 40;
  const jx = B.hitFx > 0 ? (Math.random() - 0.5) * 10 * B.hitFx : 0;
  txt('KRONOS  ·  ZEITSCHILD', CX + jx, 30, 17, '#e8d0ff', 'center', '#1a0830', 4);
  const gap = 6, cw = (bw - gap * (B.hpMax - 1)) / B.hpMax;
  for (let i = 0; i < B.hpMax; i++) {
    const x0 = bx + i * (cw + gap) + jx;
    ctx.fillStyle = 'rgba(20,6,40,.8)';
    quad(x0 + 6, by, x0 + cw + 6, by, x0 + cw, by + 20, x0, by + 20);
    if (i < B.hp) {
      ctx.fillStyle = B.phase === 'open' ? (blink ? '#ffe9a0' : '#d0a0ff') : '#b06aff';
      quad(x0 + 8, by + 3, x0 + cw + 3, by + 3, x0 + cw - 2, by + 17, x0 + 3, by + 17);
    }
  }

  // Zeitfenster: Hinweis und Peilung
  if (B.phase === 'open' && state === 'race') {
    const dx = B.k.x - p.x;
    const dir = dx < -0.14 ? '◄  ' : dx > 0.14 ? '  ►' : '';
    const len = B.openLen * (B.final ? 1.6 : 1), left = Math.max(0, len - B.t);
    if (Math.sin(gameT * 18) > -0.5) {
      txt((dx < -0.14 ? dir : '') + 'JETZT! MIT BOOST IN KRONOS HINEIN!' + (dx > 0.14 ? dir : ''), CX, 104, 26, '#ffd34d', 'center', '#0b1b4d', 6);
    }
    ctx.fillStyle = 'rgba(8,20,60,.7)';
    ctx.fillRect(CX - 152, 114, 304, 10);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(CX - 150, 116, 300 * left / len, 6);
  } else if (B.phase === 'crisis' && B.down && state === 'race') {
    if (blink) txt('ROBIN UND JARIO SIND AUSGESCHALTET!', CX, 100, 22, '#ff5a5a', 'center', '#0b1b4d', 5);
  } else if (B.phase === 'assist' && B.helper && state === 'race') {
    txt(B.helper.name.toUpperCase() + ' GREIFT AN – HALT DICH BEREIT!', CX, 100, 20, B.helper === B.martin ? '#ffd76a' : B.helper.name === 'Robin' ? '#ffb46a' : '#8fc0ff', 'center', '#0b1b4d', 5);
  }

  drawBossSay();
}

/* Funkfenster links: Kopf, Name und Satz der Figur, die gerade spricht */
const bossFaces = {};
function bossFace(who) {
  if (bossFaces[who]) return bossFaces[who];
  const spec = CAST[who].spec;
  return (bossFaces[who] = mk(136, 136, g => {
    const gr = g.createLinearGradient(0, 0, 0, 136);
    gr.addColorStop(0, spec.bg[0]);
    gr.addColorStop(1, spec.bg[1]);
    ell(g, 68, 68, 66, 66);
    g.fillStyle = gr;
    g.fill();
    g.save();
    ell(g, 68, 68, 66, 66);
    g.clip();
    g.translate(68, 84);
    g.scale(2.05 * (spec.wide || 1), 2.05);
    g.fillStyle = spec.shirt || '#30333d';
    rrect(g, -34, 20, 68, 40, 12);
    g.fill();
    g.fillStyle = spec.skin2 || spec.skin;
    rrect(g, -8, 9, 16, 19, 5);
    g.fill();
    portraitHead(g, spec);
    g.restore();
    ell(g, 68, 68, 65, 65);
    g.lineWidth = 4;
    g.strokeStyle = CAST[who].col;
    g.stroke();
  }));
}

function drawBossSay() {
  const s = boss.say;
  if (!s) return;
  const cast = CAST[s.who];
  const x = 24, y = H - 236, w = 430;               // links unten: dort verdecken es die großen Meldungen nicht
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(s.t / 0.15, (s.dur - s.t) / 0.25), 0, 1);
  ctx.fillStyle = 'rgba(8,14,44,.88)';
  rrect(ctx, x, y, w, 92, 14);
  ctx.fill();
  ctx.fillStyle = cast.col;
  ctx.fillRect(x + w - 6, y + 14, 4, 64);
  ctx.drawImage(bossFace(s.who), x + 10, y + 10, 72, 72);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'italic 900 15px ' + FONT;
  ctx.fillText(cast.name.split(' · ')[0].toUpperCase(), x + 94, y + 26);
  ctx.font = '600 15.5px "Segoe UI", system-ui, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  let line = '', ly = y + 47;
  for (const word of s.text.split(' ')) {
    if (line && ctx.measureText(line + ' ' + word).width > w - 112) {
      ctx.fillText(line, x + 94, ly);
      line = word;
      ly += 19;
    } else line = line ? line + ' ' + word : word;
  }
  ctx.fillText(line, x + 94, ly);
  ctx.restore();
}
