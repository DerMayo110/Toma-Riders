'use strict';

/* Bretter: Aussehen und Fahrwerte. Jeder Wert hat fünf Stufen; 3 ist der Standard von Tomas erstem Brett.
   Die Werte wirken nur auf den Spieler – die Gegner fahren unverändert. */

const STAT_NAMES = ['Tempo', 'Antritt', 'Lenkung', 'Boost', 'Drift'];

/* Wirkung je Stufe als Faktor auf die Fahrphysik */
const STAT_MUL = {
  speed:  [0.976, 0.988, 1, 1.012, 1.024],     // Tempo: Höchsttempo
  accel:  [0.68, 0.84, 1, 1.2, 1.42],          // Antritt: Beschleunigung
  steer:  [0.82, 0.91, 1, 1.1, 1.2],           // Lenkung: Quertempo …
  cent:   [1.18, 1.09, 1, 0.91, 0.82],         // … und wie stark Kurven nach außen tragen
  boostV: [0.98, 0.99, 1, 1.01, 1.02],         // Boost: Tempo …
  boostT: [0.9, 0.95, 1, 1.05, 1.1],           // … und Dauer
  drift:  [0.7, 0.85, 1, 1.2, 1.45],           // Drift: wie schnell der Turbo lädt
};

/* stats: [Tempo, Antritt, Lenkung, Boost, Drift] · tough: Crashs kosten weniger Tempo · trick: Faktor auf die Trickdauer */
const BOARDS = [
  { id: 'aether', name: 'Aether-Eins', sub: 'Kairons Erstling. Kann alles ein bisschen – der sichere Griff.',
    stats: [3, 3, 3, 3, 3], pal: { board: '#f5f7fb', edge: '#12b89a', stripe: '#ff3d81', glow: '94,242,255' } },
  { id: 'blitz', name: 'Blitzkeil', sub: 'Rennbrett für lange Geraden. Höchstes Tempo, aber störrisch in Kurven.',
    stats: [5, 2, 2, 3, 2], pal: { board: '#fff1a8', edge: '#ffb000', stripe: '#1b1e27', glow: '255,225,90' } },
  { id: 'delphin', name: 'Delphin', sub: 'Tanzt durch Haarnadeln und lädt Drift-Turbos im Nu.',
    stats: [3, 3, 5, 2, 5], pal: { board: '#dff8ff', edge: '#1fa8e0', stripe: '#0b5fb0', glow: '90,200,255' } },
  { id: 'mino', name: 'Minotaurus', sub: 'Schwer wie ein Stier: träge, aber mit gewaltigem Boost. Crashs bremsen es kaum.',
    stats: [2, 1, 2, 5, 3], tough: true, pal: { board: '#6a2424', edge: '#d99a55', stripe: '#ffd23d', glow: '255,120,60' } },
  { id: 'pegasos', name: 'Pegasos', sub: 'Federleicht: zieht sofort an, und Tricks gehen ein Fünftel schneller.',
    stats: [2, 5, 4, 3, 3], trick: 0.8, pal: { board: '#ffffff', edge: '#e6b422', stripe: '#8fc0ff', glow: '255,240,190' } },
  { id: 'sanduhr', name: 'Sanduhr', sub: 'Das Brett des alten Königs. In jeder Hinsicht stark.', locked: true,
    stats: [4, 4, 4, 4, 4], pal: { board: '#221a34', edge: '#d0a0ff', stripe: '#d0a0ff', glow: '208,160,255' } },
];

const BOARD_KEY = 'toma-riders-board';
const BD = { speed: 1, accel: 1, steer: 1, cent: 1, boostV: 1, boostT: 1, drift: 1, trick: 1, tough: false };
let board = BOARDS[0];
let boardsFrom = 'menu';         // von wo die Brettwahl geöffnet wurde

function setBoard(id, save) {
  const b = BOARDS.find(q => q.id === id) || BOARDS[0];
  const s = b.stats;
  board = b;
  BD.speed = STAT_MUL.speed[s[0] - 1];
  BD.accel = STAT_MUL.accel[s[1] - 1];
  BD.steer = STAT_MUL.steer[s[2] - 1];
  BD.cent = STAT_MUL.cent[s[2] - 1];
  BD.boostV = STAT_MUL.boostV[s[3] - 1];
  BD.boostT = STAT_MUL.boostT[s[3] - 1];
  BD.drift = STAT_MUL.drift[s[4] - 1];
  BD.trick = b.trick || 1;
  BD.tough = !!b.tough;
  if (save) {
    try { localStorage.setItem(BOARD_KEY, b.id); } catch (err) { /* ohne Speicher gilt die Wahl nur bis zum Neuladen */ }
  }
}

/* Tomas Farben mit dem gewählten Brett */
const playerPal = () => Object.assign({}, HERO_PAL, board.pal);

try { setBoard(localStorage.getItem(BOARD_KEY)); } catch (err) { setBoard('aether'); }
if (board.locked && !Story.status().done) setBoard('aether');

/* Brett schräg von oben, mit Schwebelicht darunter */
function drawBoardIcon(g, w, h, pal) {
  const L = w * 0.37, B = h * 0.2;
  g.save();
  g.translate(w / 2, h * 0.47);
  g.rotate(-0.26);
  const gl = g.createRadialGradient(0, B * 1.5, 2, 0, B * 1.5, L * 1.1);
  gl.addColorStop(0, 'rgba(' + pal.glow + ',.8)');
  gl.addColorStop(1, 'rgba(' + pal.glow + ',0)');
  g.fillStyle = gl;
  g.fillRect(-L * 1.4, -B, L * 2.8, B * 5);
  const shape = () => {
    g.beginPath();
    g.moveTo(-L, 0);
    g.quadraticCurveTo(-L, -B, -L * 0.55, -B);
    g.lineTo(L * 0.6, -B * 0.85);
    g.quadraticCurveTo(L * 1.1, -B * 0.5, L * 1.1, 0);
    g.quadraticCurveTo(L * 1.1, B * 0.5, L * 0.6, B * 0.85);
    g.lineTo(-L * 0.55, B);
    g.quadraticCurveTo(-L, B, -L, 0);
    g.closePath();
  };
  g.translate(0, B * 0.34);
  shape();
  g.fillStyle = pal.edge;
  g.fill();
  g.translate(0, -B * 0.34);
  shape();
  g.fillStyle = pal.board;
  g.fill();
  g.lineWidth = Math.max(2, h * 0.03);
  g.strokeStyle = pal.edge;
  g.stroke();
  g.fillStyle = pal.stripe;
  g.fillRect(-L * 0.8, -B * 0.15, L * 1.72, B * 0.3);
  g.fillStyle = 'rgba(20,24,34,.85)';
  rrect(g, -L * 0.5, -B * 0.62, L * 0.28, B * 1.24, 4);
  g.fill();
  rrect(g, L * 0.16, -B * 0.58, L * 0.28, B * 1.16, 4);
  g.fill();
  g.restore();
}

/* ================= Brettwahl ================= */
function refreshBoardLabels() {
  for (const id of ['boardBtn', 'tracksBoard', 'cardBoard']) {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Brett: ' + board.name + '  ▸';
  }
}

function buildBoardGrid() {
  const grid = document.getElementById('boardGrid');
  grid.textContent = '';
  const done = Story.status().done;
  const mk1 = (tag, cls, text) => {
    const el = document.createElement(tag);
    el.className = cls;
    if (text) el.textContent = text;
    return el;
  };
  for (const b of BOARDS) {
    const locked = b.locked && !done;
    const card = mk1('button', 'bcard' + (locked ? ' locked' : '') + (b === board ? ' sel' : ''));
    const head = mk1('div', 'bname', locked ? '???' : b.name);
    if (b === board) head.append(mk1('span', 'bsel', 'gewählt'));
    const cv = document.createElement('canvas');
    cv.className = 'bprev';
    cv.width = 300;
    cv.height = 150;
    if (locked) {
      const g = cv.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.font = '900 90px "Arial Black", Impact, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('?', 150, 80);
    } else drawBoardIcon(cv.getContext('2d'), 300, 150, b.pal);
    const stats = mk1('div', 'bstats');
    STAT_NAMES.forEach((name, i) => {
      const row = mk1('div', 'stat');
      row.append(mk1('span', 'sname', name));
      for (let k = 1; k <= 5; k++) row.append(mk1('i', 'pip' + (!locked && k <= b.stats[i] ? ' on' : '')));
      stats.append(row);
    });
    card.append(head, cv, stats, mk1('div', 'bsub', locked ? 'Schließe die Story ab' : b.sub));
    if (!locked) card.addEventListener('click', () => chooseBoard(b.id));
    grid.append(card);
  }
}

function openBoards() {
  boardsFrom = ui;
  buildBoardGrid();
  showUI('boards');
}

function closeBoards() {
  showUI(boardsFrom);
  refreshBoardLabels();
}

function chooseBoard(id) {
  setBoard(id, true);
  if (player) player.pal = playerPal();        // auch die Fahrt im Hintergrund zeigt gleich das neue Brett
  closeBoards();
}
