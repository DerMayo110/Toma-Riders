'use strict';

/* Alle Grafiken werden beim Start prozedural auf Canvas gezeichnet – keine Bilddateien. */

const SPR = {};   // name -> { img, w, h }  (w/h in Welt-Einheiten)
const BG = {};    // Parallax-Hintergründe

function mk(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  return c;
}

function reg(name, worldW, worldH, pw, ph, fn) {
  SPR[name] = { img: mk(pw, ph, fn), w: worldW, h: worldH, fn, pw, ph };
}

function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function ell(g, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TAU);
}

function leaf(g, x0, y0, x1, y1, wd) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l * wd, ny = dx / l * wd;
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo(mx + nx, my + ny - wd * 0.7, x1, y1);
  g.quadraticCurveTo(mx - nx, my - ny - wd * 0.7, x0, y0);
  g.fill();
}

/* ================= Kulissen ================= */

function drawTower(g, w, h, o) {
  const R = mulberry32(o.seed);
  const bw = w * o.bw, x0 = (w - bw) / 2;
  const top = o.top;
  const y0 = top === 'spire' ? h * 0.2 : top === 'round' ? h * 0.08 : h * 0.05;

  function body() {
    g.beginPath();
    if (top === 'round') {
      g.moveTo(x0, h);
      g.lineTo(x0, y0 + bw / 2);
      g.arc(x0 + bw / 2, y0 + bw / 2, bw / 2, Math.PI, 0);
      g.lineTo(x0 + bw, h);
    } else if (top === 'slant') {
      g.moveTo(x0, h);
      g.lineTo(x0, y0 + bw * 0.55);
      g.lineTo(x0 + bw, y0);
      g.lineTo(x0 + bw, h);
    } else if (top === 'step') {
      const sw = bw * 0.6, sx = x0 + (bw - sw) / 2, sy = y0 + h * 0.16;
      g.moveTo(x0, h);
      g.lineTo(x0, sy); g.lineTo(sx, sy); g.lineTo(sx, y0);
      g.lineTo(sx + sw, y0); g.lineTo(sx + sw, sy); g.lineTo(x0 + bw, sy);
      g.lineTo(x0 + bw, h);
    } else {
      g.moveTo(x0, h);
      g.lineTo(x0, y0); g.lineTo(x0 + bw, y0);
      g.lineTo(x0 + bw, h);
    }
    g.closePath();
  }

  if (top === 'spire') {
    g.fillStyle = o.c2;
    g.beginPath();
    g.moveTo(w / 2 - bw * 0.2, y0 + 2);
    g.lineTo(w / 2, h * 0.02);
    g.lineTo(w / 2 + bw * 0.2, y0 + 2);
    g.fill();
    g.fillStyle = '#ff5a6e';
    ell(g, w / 2, h * 0.02 + 4, 5, 5);
    g.fill();
  }

  const grad = g.createLinearGradient(x0, 0, x0 + bw, 0);
  grad.addColorStop(0, o.c1);
  grad.addColorStop(0.62, o.c1);
  grad.addColorStop(0.63, o.c2);
  grad.addColorStop(1, o.c2);
  body();
  g.fillStyle = grad;
  g.fill();

  g.save();
  body();
  g.clip();
  const rowH = 17;
  for (let y = y0 + 10; y < h - 26; y += rowH) {
    g.globalAlpha = 0.5;
    g.fillStyle = o.win;
    g.fillRect(x0 + 5, y, bw - 10, rowH * 0.45);
    g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) {
      if (R() < 0.35) {
        g.fillStyle = 'rgba(255,255,255,.7)';
        g.fillRect(x0 + 6 + R() * (bw - 34), y, 10 + R() * 14, rowH * 0.45);
      }
    }
  }
  g.fillStyle = 'rgba(0,20,60,.16)';
  for (let x = x0 + bw * 0.125; x < x0 + bw - 2; x += bw * 0.125) g.fillRect(x, 0, 2, h);
  g.fillStyle = 'rgba(255,255,255,.15)';
  g.beginPath();
  g.moveTo(x0, h * 0.56); g.lineTo(x0 + bw * 0.62, h * 0.26);
  g.lineTo(x0 + bw * 0.62, h * 0.38); g.lineTo(x0, h * 0.68);
  g.fill();
  g.fillStyle = 'rgba(10,25,60,.35)';
  g.fillRect(x0 - 4, h - 24, bw + 8, 24);
  g.restore();
}

function drawBillboard(g, w, h, o) {
  g.fillStyle = '#5a6578';
  g.fillRect(w / 2 - 7, h * 0.5, 14, h * 0.5);
  g.fillStyle = '#414b5c';
  g.fillRect(w / 2 - 24, h - 10, 48, 10);
  const ph = h * 0.62;
  const grad = g.createLinearGradient(0, 0, w, ph);
  grad.addColorStop(0, o.a);
  grad.addColorStop(1, o.b);
  rrect(g, 6, 6, w - 12, ph, 16);
  g.fillStyle = grad;
  g.fill();
  g.save();
  rrect(g, 6, 6, w - 12, ph, 16);
  g.clip();
  g.fillStyle = 'rgba(255,255,255,.13)';
  for (let i = -2; i < 8; i++) {
    g.beginPath();
    g.moveTo(i * 70, ph + 6); g.lineTo(i * 70 + 30, ph + 6);
    g.lineTo(i * 70 + 130, 6); g.lineTo(i * 70 + 100, 6);
    g.fill();
  }
  g.restore();
  rrect(g, 6, 6, w - 12, ph, 16);
  g.lineWidth = 6;
  g.strokeStyle = '#ffffff';
  g.stroke();
  g.fillStyle = o.ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'italic 900 ' + o.size + 'px "Arial Black", Impact, sans-serif';
  g.fillText(o.txt, w / 2, 6 + ph * 0.42);
  g.font = '700 22px "Segoe UI", Arial, sans-serif';
  g.fillText(o.sub, w / 2, 6 + ph * 0.79);
}

function drawTree(g, w, h, c1, c2, c3) {
  g.fillStyle = '#7a5236';
  rrect(g, w / 2 - 12, h * 0.55, 24, h * 0.45, 8);
  g.fill();
  const blobs = [[0.5, 0.27, 0.27], [0.29, 0.42, 0.23], [0.71, 0.42, 0.23], [0.5, 0.48, 0.26]];
  g.fillStyle = c3;
  for (const b of blobs) { ell(g, w * b[0], h * b[1] + 8, w * b[2], w * b[2] * 0.95); g.fill(); }
  g.fillStyle = c2;
  for (const b of blobs) { ell(g, w * b[0], h * b[1], w * b[2], w * b[2] * 0.95); g.fill(); }
  g.fillStyle = c1;
  for (const b of blobs) { ell(g, w * b[0] - w * 0.05, h * b[1] - h * 0.05, w * b[2] * 0.55, w * b[2] * 0.5); g.fill(); }
}

function drawCloud(g, x, y, s) {
  const parts = [[-60, 10, 50, 22], [-20, -8, 46, 30], [25, -2, 52, 28], [70, 12, 44, 20], [0, 16, 92, 18]];
  g.fillStyle = 'rgba(150,195,235,.5)';
  for (const p of parts) { ell(g, x + p[0] * s, y + (p[1] + 7) * s, p[2] * s, p[3] * s); g.fill(); }
  g.fillStyle = '#ffffff';
  for (const p of parts) { ell(g, x + p[0] * s, y + p[1] * s, p[2] * s, p[3] * s); g.fill(); }
}

function drawBlimp(g, x, y) {
  g.fillStyle = '#c2255f';
  g.beginPath();
  g.moveTo(x - 62, y); g.lineTo(x - 92, y - 22); g.lineTo(x - 84, y); g.lineTo(x - 92, y + 22);
  g.fill();
  g.fillStyle = '#ff3d81';
  ell(g, x, y, 72, 25);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)';
  ell(g, x + 6, y - 9, 56, 10);
  g.fill();
  g.fillStyle = '#0b1b4d';
  rrect(g, x - 16, y + 23, 32, 10, 4);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = 'italic 900 21px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('TOMA', x, y + 1);
}

function buildArt() {
  /* ----- Hochhäuser ----- */
  const towers = [
    { c1: '#eef8ff', c2: '#b9d6ee', win: '#3aa0e0', top: 'flat', bw: 0.8, seed: 1 },
    { c1: '#5fdccf', c2: '#2fa79f', win: '#e6fffb', top: 'round', bw: 0.7, seed: 2 },
    { c1: '#ffa684', c2: '#e0734f', win: '#fff1dc', top: 'step', bw: 0.84, seed: 3 },
    { c1: '#8795ff', c2: '#5560d8', win: '#dfe6ff', top: 'spire', bw: 0.62, seed: 4 },
    { c1: '#ffffff', c2: '#c9d7e6', win: '#ff7fb0', top: 'slant', bw: 0.78, seed: 5 },
  ];
  towers.forEach((o, i) => reg('tower' + (i + 1), 4200 + i * 250, 10500 + (i % 3) * 2600, 300, 760, (g, w, h) => drawTower(g, w, h, o)));

  /* ----- Werbetafeln (alles erfundene Marken) ----- */
  const boards = [
    { a: '#ff3d81', b: '#ff9b3d', ink: '#ffffff', txt: 'TOMA COLA', sub: 'eiskalt & verdammt schnell', size: 54 },
    { a: '#132a7a', b: '#19c9e8', ink: '#ffffff', txt: 'HOVR', sub: 'Boards der Zukunft', size: 92 },
    { a: '#c6ff5e', b: '#19c9a8', ink: '#0b1b4d', txt: 'NOVA ENERGY', sub: 'volle Ladung voraus', size: 46 },
    { a: '#6a35d8', b: '#ff5fb0', ink: '#ffffff', txt: 'SKY CITY FM', sub: '103.7 · Nonstop Beats', size: 48 },
  ];
  boards.forEach((o, i) => reg('bb' + (i + 1), 2600, 2100, 420, 340, (g, w, h) => drawBillboard(g, w, h, o)));

  /* ----- Laterne (Kopf zeigt nach links; für die linke Seite gespiegelt) ----- */
  reg('lamp', 1500, 2600, 240, 416, (g, w, h) => {
    g.lineCap = 'round';
    g.strokeStyle = '#e8eef5';
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(w * 0.85, h);
    g.lineTo(w * 0.85, h * 0.32);
    g.quadraticCurveTo(w * 0.85, h * 0.07, w * 0.3, h * 0.08);
    g.stroke();
    const gr = g.createRadialGradient(w * 0.24, h * 0.1, 2, w * 0.24, h * 0.1, 46);
    gr.addColorStop(0, 'rgba(255,255,220,.95)');
    gr.addColorStop(1, 'rgba(255,255,220,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w * 0.6, h * 0.3);
    g.fillStyle = '#fffbe0';
    rrect(g, w * 0.1, h * 0.065, w * 0.3, 12, 6);
    g.fill();
    g.fillStyle = '#56657a';
    g.fillRect(w * 0.85 - 12, h - 14, 24, 14);
  });

  /* ----- Palme ----- */
  reg('palm', 1700, 2600, 340, 520, (g, w, h) => {
    g.lineCap = 'round';
    g.strokeStyle = '#8a5a3a';
    g.lineWidth = 22;
    g.beginPath();
    g.moveTo(w * 0.46, h - 8);
    g.quadraticCurveTo(w * 0.42, h * 0.6, w * 0.52, h * 0.32);
    g.stroke();
    g.strokeStyle = 'rgba(60,30,10,.3)';
    g.lineWidth = 3;
    for (let i = 1; i < 9; i++) {
      const t = i / 9, y = lerp(h, h * 0.34, t), x = w * (0.46 - 0.04 * Math.sin(t * Math.PI) + 0.06 * t * t);
      g.beginPath();
      g.moveTo(x - 10, y); g.lineTo(x + 10, y - 5);
      g.stroke();
    }
    const cx = w * 0.52, cy = h * 0.31;
    const fr = [[-150, 30], [-135, -60], [-70, -125], [20, -140], [100, -110], [150, -40], [140, 45], [-90, 80], [85, 90]];
    fr.forEach((f, i) => {
      g.fillStyle = i % 2 ? '#2fae5b' : '#3fca70';
      leaf(g, cx, cy, cx + f[0], cy + f[1], 26);
    });
    g.fillStyle = '#6b4226';
    ell(g, cx, cy + 4, 12, 10);
    g.fill();
  });

  /* ----- Parkbäume ----- */
  reg('tree1', 1500, 1900, 300, 380, (g, w, h) => drawTree(g, w, h, '#8ff0a0', '#3fca70', '#259a4f'));
  reg('tree2', 1500, 1900, 300, 380, (g, w, h) => drawTree(g, w, h, '#ffd0e6', '#ff8fc2', '#e0609c'));

  /* ----- Brückenpylon ----- */
  reg('pylon', 1500, 5600, 240, 900, (g, w, h) => {
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const y = h * (0.45 + i * 0.11);
      g.beginPath(); g.moveTo(w / 2, h * 0.07); g.lineTo(0, y); g.stroke();
      g.beginPath(); g.moveTo(w / 2, h * 0.07); g.lineTo(w, y); g.stroke();
    }
    g.fillStyle = '#f7f9fc';
    g.beginPath();
    g.moveTo(w / 2 - 36, h); g.lineTo(w / 2 - 14, h * 0.05); g.lineTo(w / 2 + 14, h * 0.05); g.lineTo(w / 2 + 36, h);
    g.closePath();
    g.fill();
    g.fillStyle = '#d3dce9';
    g.beginPath();
    g.moveTo(w / 2 + 6, h); g.lineTo(w / 2 + 3, h * 0.05); g.lineTo(w / 2 + 14, h * 0.05); g.lineTo(w / 2 + 36, h);
    g.closePath();
    g.fill();
    g.fillStyle = '#ff7043';
    for (const t of [0.2, 0.45, 0.7]) {
      const half = lerp(14, 36, (t - 0.05) / 0.95);
      g.fillRect(w / 2 - half, h * t, half * 2, 16);
    }
    const gr = g.createRadialGradient(w / 2, h * 0.04, 1, w / 2, h * 0.04, 22);
    gr.addColorStop(0, 'rgba(255,90,90,1)');
    gr.addColorStop(1, 'rgba(255,90,90,0)');
    g.fillStyle = gr;
    g.fillRect(w / 2 - 24, 0, 48, h * 0.08);
  });

  /* ----- Segelboot ----- */
  reg('boat', 1600, 1700, 200, 212, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(w * 0.52, h * 0.05); g.lineTo(w * 0.52, h * 0.75); g.lineTo(w * 0.12, h * 0.75); g.closePath(); g.fill();
    g.fillStyle = '#ff6d9a';
    g.beginPath(); g.moveTo(w * 0.57, h * 0.2); g.lineTo(w * 0.57, h * 0.75); g.lineTo(w * 0.9, h * 0.75); g.closePath(); g.fill();
    g.fillStyle = '#23324f';
    g.beginPath(); g.moveTo(w * 0.05, h * 0.8); g.lineTo(w * 0.95, h * 0.8); g.lineTo(w * 0.82, h * 0.97); g.lineTo(w * 0.18, h * 0.97); g.closePath(); g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(w * 0.05, h * 0.8, w * 0.9, 5);
  });

  /* ----- Start/Ziel-Bogen ----- */
  reg('arch', 5300, 2700, 1060, 540, (g, w, h) => {
    for (const x of [40, w - 100]) {
      const gr = g.createLinearGradient(x, 0, x + 60, 0);
      gr.addColorStop(0, '#eef3f8');
      gr.addColorStop(1, '#a9b7c7');
      g.fillStyle = gr;
      g.fillRect(x, 60, 60, h - 60);
      g.fillStyle = '#ff3d81';
      g.fillRect(x, h - 130, 60, 18);
      g.fillRect(x, h - 90, 60, 18);
    }
    rrect(g, 20, 20, w - 40, 152, 22);
    g.fillStyle = '#0d1b45';
    g.fill();
    const cs = 26, n = Math.floor((w - 80) / cs);
    const ox = (w - n * cs) / 2;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 2; j++) {
        g.fillStyle = (i + j) % 2 ? '#ffffff' : '#10131c';
        g.fillRect(ox + i * cs, 32 + j * cs, cs, cs);
      }
    }
    g.fillStyle = '#ffffff';
    g.font = 'italic 900 54px "Arial Black", Impact, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TOMA RIDERS  ·  START / ZIEL', w / 2, 128);
    rrect(g, 20, 20, w - 40, 152, 22);
    g.lineWidth = 5;
    g.strokeStyle = '#7dffd8';
    g.stroke();
  });

  /* ----- Sprungschild ----- */
  /* ----- Kurvenschild für Haarnadeln (Pfeile zeigen nach rechts; für Linkskurven gespiegelt) ----- */
  reg('chev', 900, 1000, 216, 240, (g, w, h) => {
    g.fillStyle = '#5a6578';
    g.fillRect(w * 0.2 - 5, h * 0.5, 10, h * 0.5);
    g.fillRect(w * 0.8 - 5, h * 0.5, 10, h * 0.5);
    rrect(g, 6, 8, w - 12, h * 0.52, 12);
    g.fillStyle = '#1b1e27';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = '#ffd23d';
    g.stroke();
    g.fillStyle = '#ffd23d';
    const cy = 8 + h * 0.26;
    for (let i = 0; i < 3; i++) {
      const x = 28 + i * 56;
      g.beginPath();
      g.moveTo(x, cy - 40); g.lineTo(x + 24, cy - 40); g.lineTo(x + 50, cy);
      g.lineTo(x + 24, cy + 40); g.lineTo(x, cy + 40); g.lineTo(x + 26, cy);
      g.closePath();
      g.fill();
    }
  });

  reg('jumpsign', 700, 1300, 180, 334, (g, w, h) => {
    g.fillStyle = '#5a6578';
    g.fillRect(w / 2 - 6, h * 0.5, 12, h * 0.5);
    const cy = h * 0.28;
    g.save();
    g.translate(w / 2, cy);
    g.rotate(Math.PI / 4);
    rrect(g, -56, -56, 112, 112, 12);
    g.fillStyle = '#ffd23d';
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = '#1b1e27';
    g.stroke();
    g.restore();
    g.fillStyle = '#1b1e27';
    g.beginPath();
    g.moveTo(w / 2, cy - 44); g.lineTo(w / 2 + 30, cy - 6); g.lineTo(w / 2 + 12, cy - 6);
    g.lineTo(w / 2 + 12, cy + 34); g.lineTo(w / 2 - 12, cy + 34); g.lineTo(w / 2 - 12, cy - 6);
    g.lineTo(w / 2 - 30, cy - 6);
    g.closePath();
    g.fill();
  });

  /* ----- Hindernis: Absperrung ----- */
  reg('barrier', 720, 480, 240, 160, (g, w, h) => {
    g.fillStyle = '#39424f';
    g.fillRect(24, 50, 16, h - 50);
    g.fillRect(w - 40, 50, 16, h - 50);
    g.fillStyle = '#2a313b';
    g.fillRect(10, h - 12, 44, 12);
    g.fillRect(w - 54, h - 12, 44, 12);
    g.save();
    rrect(g, 6, 34, w - 12, 70, 10);
    g.clip();
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff6a1f';
    for (let i = -3; i < 10; i++) {
      g.beginPath();
      g.moveTo(i * 44, 104); g.lineTo(i * 44 + 22, 104); g.lineTo(i * 44 + 66, 34); g.lineTo(i * 44 + 44, 34);
      g.fill();
    }
    g.restore();
    rrect(g, 6, 34, w - 12, 70, 10);
    g.lineWidth = 5;
    g.strokeStyle = '#1b1e27';
    g.stroke();
    for (const x of [32, w - 32]) {
      const gr = g.createRadialGradient(x, 22, 2, x, 22, 24);
      gr.addColorStop(0, 'rgba(255,220,80,.9)');
      gr.addColorStop(1, 'rgba(255,220,80,0)');
      g.fillStyle = gr;
      g.fillRect(x - 26, 0, 52, 48);
      g.fillStyle = '#ffd23d';
      ell(g, x, 22, 12, 12);
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = '#1b1e27';
      g.stroke();
    }
  });

  /* ----- Energie-Orb ----- */
  reg('orb', 300, 300, 120, 120, (g, w) => {
    const c = w / 2;
    let gr = g.createRadialGradient(c, c, 4, c, c, 58);
    gr.addColorStop(0, 'rgba(120,255,220,.9)');
    gr.addColorStop(0.45, 'rgba(60,230,255,.35)');
    gr.addColorStop(1, 'rgba(60,230,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, w);
    gr = g.createRadialGradient(c - 8, c - 10, 2, c, c, 26);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.5, '#7dffd8');
    gr.addColorStop(1, '#11c6e8');
    g.fillStyle = gr;
    ell(g, c, c, 26, 26);
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.fillStyle = '#0b3a66';
    g.beginPath();
    g.moveTo(c + 4, c - 17); g.lineTo(c - 10, c + 3); g.lineTo(c - 1, c + 3);
    g.lineTo(c - 5, c + 17); g.lineTo(c + 10, c - 4); g.lineTo(c + 1, c - 4);
    g.closePath();
    g.fill();
  });

  /* ----- Hintergrund: Wolken (kachelbar) ----- */
  BG.clouds = mk(2048, 300, (g, w) => {
    const R = mulberry32(7);
    for (let i = 0; i < 15; i++) {
      const x = R() * w, y = 34 + R() * 190, s = 0.55 + R() * 1.1;
      for (const ox of [0, -w, w]) drawCloud(g, x + ox, y, s);
    }
    drawBlimp(g, 620, 96);
  });

  /* ----- Hintergrund: ferne Skyline (kachelbar) ----- */
  BG.city = mk(2048, 330, (g, w, h) => {
    const R = mulberry32(99);
    const layers = [
      { col: '#b3daf5', hi: '#c6e6fa', min: 90, max: 260, wmin: 40, wmax: 110, n: 30 },
      { col: '#8ec3ec', hi: '#a6d3f3', min: 50, max: 175, wmin: 36, wmax: 100, n: 36 },
      { col: '#6fa9dd', hi: '#8cbfe8', min: 20, max: 100, wmin: 40, wmax: 120, n: 34 },
    ];
    for (const L of layers) {
      for (let i = 0; i < L.n; i++) {
        const bw = L.wmin + R() * (L.wmax - L.wmin), bh = L.min + R() * (L.max - L.min);
        const x = R() * w, kind = R();
        for (const ox of [0, -w]) {
          const bx = x + ox, by = h - bh;
          g.fillStyle = L.col;
          g.fillRect(bx, by, bw, bh);
          if (kind < 0.22) {
            g.beginPath(); g.moveTo(bx + bw * 0.3, by); g.lineTo(bx + bw * 0.5, by - bw * 0.9); g.lineTo(bx + bw * 0.7, by); g.fill();
          } else if (kind < 0.42) {
            g.beginPath(); g.arc(bx + bw / 2, by, bw / 2, Math.PI, 0); g.fill();
          } else if (kind < 0.6) {
            g.fillRect(bx + bw * 0.2, by - 18, bw * 0.6, 18);
            g.fillRect(bx + bw * 0.46, by - 44, bw * 0.08, 26);
          }
          g.fillStyle = L.hi;
          g.fillRect(bx, by, bw * 0.34, bh);
          g.fillStyle = 'rgba(255,255,255,.14)';
          for (let y = by + 8; y < h - 6; y += 11) g.fillRect(bx + 3, y, bw - 6, 3);
        }
      }
    }
  });
}

/* ================= Fahrer (Rückansicht, live gezeichnet) ================= */

const HERO_CURLS = [
  [0, -1, 8.8, '#e0b548'],
  [-6.5, -6, 4.6, '#f3d36e'], [0, -8.6, 5, '#f8e394'], [6.5, -6, 4.6, '#f3d36e'],
  [-8.6, -0.5, 4.2, '#e6bd4f'], [8.6, -0.5, 4.2, '#e6bd4f'],
  [-4, -2, 4.6, '#f8e394'], [4, -2, 4.6, '#f3d36e'],
  [-6.5, 4.6, 4, '#d9ab3d'], [6.5, 4.6, 4, '#d9ab3d'],
  [0, 3, 4.8, '#e6bd4f'], [-2.6, 7, 3.6, '#d9ab3d'], [2.6, 7, 3.6, '#e0b548'],
];

/* Tricks je Richtungstaste – sie wechseln sich innerhalb eines Sprungs ab (1., 2., 3. Trick …) */
const TRICK_SETS = {
  up: ['handstand', 'backflip', 'spagat'],
  down: ['spin', 'kickflip', 'overhead'],
  left: ['grab', 'roll'],
  right: ['grab', 'roll'],
};
const TRICK_LABEL = {
  handstand: 'HANDSTAND', backflip: 'BACKFLIP', spagat: 'EINHAND-SPAGAT',
  spin: '360-SPIN', kickflip: 'KICKFLIP', overhead: 'ÜBERKOPF-GRIFF',
  grab: 'SEITGRIFF', roll: 'FASSROLLE',
};

/* x/y = Punkt direkt unter dem Board (in Flughöhe); s = Pixel pro Einheit (Fahrer ~100 Einheiten hoch).
   Der Fahrer ist ein Gelenk-Skelett (Füße, Knie, Hüfte, Schultern, Ellbogen, Hände, Kopf). Aus der Fahrhaltung
   werden die Gelenke je nach Trick in eine Pose geblendet; das Brett hat eine eigene Lage und kann sich lösen.
   Haltung (alles optional): cr = Hocke 0…1 · sq = Stauchen (<0) / Strecken (>0) · armUp = Arme hoch (Luft)
   bo = Boost-Haltung 0…1 · vy = Steig-/Fallgeschwindigkeit · trick = { type, kind, t } */
function drawRider(g, x, y, s, o) {
  const pal = o.pal;
  const t = o.t || 0, ph = o.phase || 0;
  let lean = o.lean || 0;
  if (o.stumble) lean += Math.sin(t * 34) * 0.7;
  const dr = o.drift || 0;                      // Drift: Board steht quer zur Fahrtrichtung
  const cr = o.cr == null ? 0.3 : o.cr;
  const sq = o.sq || 0, up = o.armUp || 0;
  const bo = o.bo == null ? (o.boost ? 1 : 0) : o.bo;
  const hv = 9 + Math.sin(t * 6 + ph) * 1.3;   // Schwebehöhe
  const yaw = lean * 7 + dr * 13;
  const smooth = v => { v = v < 0 ? 0 : v > 1 ? 1 : v; return v * v * (3 - 2 * v); };

  const tr = o.trick && o.trick.t > 0 ? o.trick : null;
  const kind = tr ? tr.kind || TRICK_SETS[tr.type][tr.type === 'up' ? 1 : tr.type === 'down' ? 0 : 1] : '';
  const td = tr && tr.type === 'left' ? -1 : 1;
  const tu = tr ? Math.min(1, tr.t) : 0;
  const ta = tr ? easeInOut(0, TAU, tu) : 0;                           // eine volle Drehung
  const tw = tr ? Math.sin(Math.PI * tu) : 0;                          // 0 → 1 → 0
  const hold = tr ? smooth(tu / 0.24) * smooth((1 - tu) / 0.24) : 0;   // rein – halten – raus

  /* ---------- Brett: eigene Lage, kann sich vom Fahrer lösen ---------- */
  const B = { x: 0, y: 0, rot: 0, w: 1, nose: 22, under: false, flame: 1 };
  let front = false, bodyW = 1, figRot = 0, figSY = 1;
  if (kind === 'roll') figRot = td * ta;
  else if (kind === 'backflip') {              // kopfüber sieht man den Fahrer von vorn
    figSY = Math.cos(ta);
    front = figSY < 0;
    if (Math.abs(figSY) < 0.1) figSY = figSY < 0 ? -0.1 : 0.1;
  } else if (kind === 'spin') {                // Brett quer = lang, Fahrer im Profil schmal
    const sn = Math.abs(Math.sin(ta));
    front = Math.cos(ta) < 0;
    bodyW = lerp(1, 0.62, sn);
    B.w = 1 + sn * 1.5;
    B.nose = lerp(22, 7, sn);
  } else if (kind === 'kickflip') {            // das Brett wirbelt unter den Füßen um die Längsachse
    B.rot = td * ta;
    B.under = Math.cos(ta) < 0;
    B.flame = 1 - tw;
    B.y = 3 * tw;
  } else if (kind === 'grab') {                // Brett und Beine schwingen zur Seite heraus
    B.x = td * 20 * hold;
    B.y = -15 * hold;
    B.rot = td * 0.85 * hold;
  } else if (kind === 'handstand') B.rot = tw * 0.04;

  /* ---------- Gelenke der Fahrhaltung ---------- */
  const hipY = -hv - lerp(46, 31, cr);
  const shY = hipY - lerp(27, 21, cr);
  const bx = lean * 3;                         // der Oberkörper legt sich stärker in die Kurve als das Brett
  const fx = 3.5 + yaw * 0.6, f1y = -hv - B.nose * 0.8, f2y = -hv - 5, kn = 5.5 * cr;
  if (kind === 'overhead') {                   // beide Hände heben das Brett über den Kopf
    B.y = (shY - 36 + hv) * hold;
    B.rot = Math.sin(tu * TAU) * 0.1 * hold;
    B.flame = 1 - hold;
  }
  const bp = (px, py) => {                     // Punkt auf dem Brett -> Lage in der Figur
    const c = Math.cos(B.rot), sn = Math.sin(B.rot), oy = py + hv + 10;
    return [B.x + px * c - oy * sn, B.y - hv - 10 + px * sn + oy * c];
  };
  const J = {
    fR: [fx, f1y], fL: [-3.5, f2y],
    kR: [11 + kn, lerp(f1y, hipY, 0.5) + 1], kL: [-12 - kn, lerp(f2y, hipY, 0.5) - 1],
    hip: [bx * 0.4, hipY], sh: [bx, shY], head: [bx + lean * 1.5, shY - 15],
    eR: null, hR: null, eL: null, hL: null,
  };
  // Arme: Balance · hoch in der Luft · nach hinten beim Boost · tief/hoch im Drift
  for (const sd of [-1, 1]) {
    const k = sd * lean * 7, sy = shY + 2;
    let ex = sd * 21 + bx, ey = sy + 7 + k * 0.5, hx = sd * 29 + bx, hy2 = sy + 16 + k;
    const pose = (ex2, ey2, hx2, hy3, w) => {
      ex = lerp(ex, ex2, w); ey = lerp(ey, ey2, w); hx = lerp(hx, hx2, w); hy2 = lerp(hy2, hy3, w);
    };
    if (up > 0.01) pose(sd * 21 + bx, sy - 5, sd * 28 + bx, sy - 18, up);
    if (bo > 0.01) pose(sd * 17 + bx, sy + 12, sd * 21 + bx, sy + 27, bo * 0.85);
    if (dr) {
      const a = Math.min(1, Math.abs(dr));
      if (sd * dr > 0) pose(sd * 22 + bx, sy + 15, sd * 27 + bx, sy + 31, a * 0.85);
      else pose(sd * 20 + bx, sy - 2, sd * 30 + bx, sy - 9, a * 0.6);
    }
    if (o.stumble) {
      hx += Math.sin(t * 30 + sd) * 6;
      hy2 += Math.cos(t * 27 + sd * 2) * 8;
    }
    J[sd > 0 ? 'eR' : 'eL'] = [ex, ey];
    J[sd > 0 ? 'hR' : 'hL'] = [hx, hy2];
  }

  /* ---------- Trick-Posen ---------- */
  const set = (key, p, w) => { J[key] = [lerp(J[key][0], p[0], w), lerp(J[key][1], p[1], w)]; };
  const R = td > 0 ? 'R' : 'L', L = td > 0 ? 'L' : 'R';       // Seite zur Trickrichtung / Gegenseite
  if (kind === 'handstand') {
    // Hände aufs Brett, Körper kerzengerade nach oben, die Beine öffnen sich zum V und schließen wieder
    const sp = 0.5 - 0.5 * Math.cos(TAU * clamp((tu - 0.2) / 0.6, 0, 1));
    const sw = Math.sin(tu * TAU) * 2.5;
    set('hR', bp(13, -hv - 9), hold); set('hL', bp(-13, -hv - 6), hold);
    set('eR', [20, -hv - 23], hold); set('eL', [-20, -hv - 21], hold);
    set('sh', [sw * 0.4, -hv - 37], hold); set('head', [sw * 0.4, -hv - 23], hold);
    set('hip', [sw, -hv - 65], hold);
    set('kR', [7 + 9 * sp + sw, -hv - 84], hold); set('kL', [-7 - 9 * sp + sw, -hv - 84], hold);
    set('fR', [8 + 20 * sp + sw * 1.5, -hv - 104 + 9 * sp], hold); set('fL', [-8 - 20 * sp + sw * 1.5, -hv - 104 + 9 * sp], hold);
  } else if (kind === 'spagat') {
    // einhändiger Handstand, freier Arm zur Seite, Beine im Spagat
    const wv = Math.sin(tu * TAU) * 4;
    set('hR', bp(12, -hv - 8), hold); set('eR', [21, -hv - 22], hold);
    set('hL', [-37, -hv - 45], hold); set('eL', [-24, -hv - 40], hold);
    set('sh', [3, -hv - 36], hold); set('head', [2, -hv - 22], hold);
    set('hip', [9, -hv - 62], hold);
    set('kR', [27, -hv - 73], hold); set('fR', [45, -hv - 80 - wv], hold);
    set('kL', [-8, -hv - 77], hold); set('fL', [-27, -hv - 85 + wv], hold);
  } else if (kind === 'kickflip') {
    // Sprung übers wirbelnde Brett: Knie hoch, Arme weit
    const lift = tw * 17;
    for (const key of ['hip', 'sh', 'head', 'kR', 'kL']) J[key][1] -= lift;
    J.fR = [lerp(fx, 10, tw), f1y - lift * 1.1];
    J.fL = [lerp(-3.5, -10, tw), f2y - lift * 1.6];
    set('hR', [32, shY - 11 - lift], tw); set('hL', [-32, shY - 11 - lift], tw);
    set('eR', [22, shY - 2 - lift], tw); set('eL', [-22, shY - 2 - lift], tw);
  } else if (kind === 'overhead') {
    // Brett über dem Kopf, Beine angezogen
    set('hR', [11, B.y - hv + 3], hold); set('hL', [-11, B.y - hv + 3], hold);
    set('eR', [17, shY - 16], hold); set('eL', [-17, shY - 16], hold);
    set('fR', [8, hipY + 26], hold); set('fL', [-8, hipY + 23], hold);
    set('kR', [16, hipY + 10], hold); set('kL', [-16, hipY + 9], hold);
  } else if (kind === 'grab') {
    // Füße bleiben am Brett, Oberkörper lehnt dagegen, eine Hand greift die Kante, die andere zeigt nach oben
    J.fR = bp(fx, f1y);
    J.fL = bp(-3.5, f2y);
    set('hip', [td * 9, hipY - 5], hold);
    J.kR = [(J.fR[0] + J.hip[0]) / 2 + 9 + td * 5 * hold, (J.fR[1] + J.hip[1]) / 2 + 1];
    J.kL = [(J.fL[0] + J.hip[0]) / 2 - 9 + td * 5 * hold, (J.fL[1] + J.hip[1]) / 2 - 1];
    set('sh', [-td * 6, shY - 2], hold); set('head', [-td * 9, shY - 17], hold);
    const grip = bp(td * 13, -hv - 4);
    set('h' + R, grip, hold);
    set('e' + R, [(J.sh[0] + td * 11 + grip[0]) / 2 + td * 5, (J.sh[1] + grip[1]) / 2 + 3], hold);
    set('h' + L, [-td * 33, shY - 25], hold); set('e' + L, [-td * 22, shY - 12], hold);
  } else if (kind === 'roll') {
    const w = Math.sqrt(tw);
    set('h' + R, [td * 33, shY - 8], w); set('e' + R, [td * 22, shY - 2], w);
    set('h' + L, [-td * 9, hipY + 15], w); set('e' + L, [-td * 16, shY + 15], w);
  } else if (kind === 'backflip') {
    const w = Math.sqrt(tw);
    set('hR', [9, hipY + 15], w); set('eR', [16, shY + 15], w);
    set('hL', [-9, hipY + 15], w); set('eL', [-16, shY + 15], w);
  } else if (kind === 'spin') {
    const w = Math.sqrt(tw);
    set('hR', [9, hipY + 15], w); set('eR', [16, shY + 15], w);
    set('hL', [-27, shY - 18], w); set('eL', [-20, shY - 4], w);
  }

  /* ---------- Zeichnen ---------- */
  g.save();
  g.translate(x, y);
  g.scale(s * (1 - sq * 0.55), s * (1 + sq));
  g.rotate(lean * 0.26 + dr * 0.2);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  if (pal.aura) {
    const ag = g.createRadialGradient(0, -52, 4, 0, -52, 72);
    ag.addColorStop(0, 'rgba(' + pal.aura + ',.5)');
    ag.addColorStop(1, 'rgba(' + pal.aura + ',0)');
    g.fillStyle = ag;
    g.fillRect(-74, -126, 148, 148);
  }

  // Leuchtschweif hinter der Figur: Bogen bei Drehungen, aufgehender Ring bei gehaltenen Posen
  if (tr) {
    g.lineWidth = 5;
    g.beginPath();
    if (kind === 'roll' || kind === 'backflip' || kind === 'spin' || kind === 'kickflip') {
      g.strokeStyle = 'rgba(' + pal.glow + ',' + (0.65 * tw).toFixed(3) + ')';
      if (kind === 'spin') g.ellipse(0, -hv - 6, 48, 10, 0, ta - 2.2, ta);
      else if (kind === 'backflip') g.ellipse(0, -52, 16, 64, 0, ta - 2.2, ta);
      else if (kind === 'kickflip') g.arc(0, -hv - 8, 27, td * ta - (td > 0 ? 2.4 : 0), td * ta + (td > 0 ? 0 : 2.4));
      else if (td < 0) g.arc(0, -52, 62, -ta - Math.PI / 2, -ta - Math.PI / 2 + 2.2);
      else g.arc(0, -52, 62, ta - Math.PI / 2 - 2.2, ta - Math.PI / 2);
    } else {
      g.strokeStyle = 'rgba(' + pal.glow + ',' + (0.6 * (1 - tu) * smooth(tu / 0.15)).toFixed(3) + ')';
      g.lineWidth = 4 * (1 - tu) + 1;
      g.arc(0, -hv - 54, 34 + 44 * tu, 0, TAU);
    }
    g.stroke();
  }

  // Drehung der ganzen Figur (Fassrolle, Backflip)
  if (figRot || figSY !== 1) {
    g.translate(0, -52);
    if (figRot) g.rotate(figRot);
    if (figSY !== 1) g.scale(1, figSY);
    g.translate(0, 52);
  }

  /* ---------- Brett ---------- */
  g.save();
  if (B.x || B.y) g.translate(B.x, B.y);
  if (B.rot) {
    g.translate(0, -hv - 10);
    g.rotate(B.rot);
    g.translate(0, hv + 10);
  }
  g.scale(B.w, 1);

  // Lichtschweif an den Heckkanten: wächst mit dem Tempo
  const fast = (o.boost ? 1 : clamp(((o.thrust || 0) - 0.55) / 0.45, 0, 1)) * B.flame;
  if (fast > 0.02) {
    const sl = (o.boost ? 62 : 14 + 30 * fast) * (0.82 + 0.18 * Math.sin(t * 39 + ph));
    const col = o.boost ? '255,200,90' : pal.glow;
    const tg = g.createLinearGradient(0, -hv + 3, 0, -hv + 3 + sl);
    tg.addColorStop(0, 'rgba(' + col + ',' + (0.75 * fast).toFixed(3) + ')');
    tg.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = tg;
    for (const sd of [-1, 1]) {
      g.beginPath();
      g.moveTo(sd * 13, -hv + 3);
      g.lineTo(sd * 9.5, -hv + 3);
      g.lineTo(sd * 12 - lean * 5, -hv + 3 + sl);
      g.closePath();
      g.fill();
    }
  }

  // Schubstrahl
  if (B.flame > 0.05) {
    const fl = (o.boost ? 34 : 9 + 9 * (o.thrust || 0)) * (0.8 + 0.2 * Math.sin(t * 47 + ph)) * B.flame;
    const fg = g.createLinearGradient(0, -hv + 2, 0, -hv + 2 + fl);
    if (o.boost) {
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.35, '#ffd34d');
      fg.addColorStop(1, 'rgba(255,90,0,0)');
    } else {
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.4, 'rgba(' + pal.glow + ',.9)');
      fg.addColorStop(1, 'rgba(' + pal.glow + ',0)');
    }
    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(-9, -hv + 2);
    g.quadraticCurveTo(-lean * 4, -hv + 2 + fl * 1.7, 9, -hv + 2);
    g.closePath();
    g.fill();
  }

  // Glühen unter dem Board
  g.fillStyle = 'rgba(' + pal.glow + ',' + (0.45 + 0.3 * tw).toFixed(3) + ')';
  ell(g, 0, -hv + 5, 17 + 5 * tw, 4 + tw);
  g.fill();

  // Board (Heck vorn, Nase perspektivisch verkürzt); beim Kickflip sieht man zwischendurch die Unterseite
  const nY = -hv - B.nose;
  g.beginPath();
  g.moveTo(-13, -hv);
  g.lineTo(13, -hv);
  g.quadraticCurveTo(15 + yaw * 0.3, -hv - B.nose * 0.55, 9 + yaw, nY);
  g.quadraticCurveTo(yaw, nY - 6, -9 + yaw, nY);
  g.quadraticCurveTo(-15 + yaw * 0.3, -hv - B.nose * 0.55, -13, -hv);
  g.closePath();
  g.fillStyle = B.under ? pal.edge : pal.board;
  g.fill();
  g.lineWidth = 1.6;
  g.strokeStyle = pal.edge;
  g.stroke();
  if (B.under) {
    g.fillStyle = 'rgba(' + pal.glow + ',.9)';
    g.fillRect(-8 + yaw * 0.4, -hv - 9, 16, 2.2);
    g.fillRect(-6 + yaw * 0.7, -hv - 16, 12, 2);
  } else {
    g.fillStyle = pal.stripe;
    g.beginPath();
    g.moveTo(-3, -hv - 1); g.lineTo(3, -hv - 1);
    g.lineTo(2 + yaw * 0.9, nY - 1); g.lineTo(-2 + yaw * 0.9, nY - 1);
    g.closePath();
    g.fill();
  }
  g.fillStyle = pal.edge;
  rrect(g, -13, -hv, 26, 4.2, 2);
  g.fill();
  g.fillStyle = '#1b1e27';
  g.fillRect(-9.5, -hv + 1.2, 5, 2.4);
  g.fillRect(4.5, -hv + 1.2, 5, 2.4);
  g.restore();

  /* ---------- Körper ---------- */
  g.save();
  g.scale(bodyW, 1);
  const hip = J.hip, sh = J.sh;
  let dx = sh[0] - hip[0], dy = sh[1] - hip[1];           // Richtung der Wirbelsäule (Hüfte -> Schultern)
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl;
  dy /= dl;
  const nx = -dy, ny = dx;                                // quer dazu

  // Beine
  g.strokeStyle = pal.pants;
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(J.fR[0], J.fR[1] - 1.5);
  g.quadraticCurveTo(J.kR[0], J.kR[1], hip[0] + nx * 3, hip[1] + ny * 3);
  g.stroke();
  g.beginPath();
  g.moveTo(J.fL[0], J.fL[1] - 2);
  g.quadraticCurveTo(J.kL[0], J.kL[1], hip[0] - nx * 3, hip[1] - ny * 3);
  g.stroke();

  // Schuhe
  g.fillStyle = pal.shoe;
  ell(g, J.fR[0], J.fR[1], 5.6, 3.2);
  g.fill();
  ell(g, J.fL[0], J.fL[1], 6.6, 3.6);
  g.fill();
  if (!tr) {
    g.fillStyle = pal.edge;
    g.fillRect(J.fL[0] - 5.5, J.fL[1] + 1.8, 11, 1.4);
  }

  // Oberkörper
  const mx = lerp(hip[0], sh[0], 0.45), my = lerp(hip[1], sh[1], 0.45);
  const p1x = hip[0] - nx * 8 - dx * 2, p1y = hip[1] - ny * 8 - dy * 2;
  g.fillStyle = pal.shirt;
  g.beginPath();
  g.moveTo(p1x, p1y);
  g.lineTo(hip[0] + nx * 8 - dx * 2, hip[1] + ny * 8 - dy * 2);
  g.quadraticCurveTo(mx + nx * 13, my + ny * 13, sh[0] + nx * 12, sh[1] + ny * 12);
  g.quadraticCurveTo(sh[0] + dx * 6, sh[1] + dy * 6, sh[0] - nx * 12, sh[1] - ny * 12);
  g.quadraticCurveTo(mx - nx * 13, my - ny * 13, p1x, p1y);
  g.closePath();
  g.fill();
  if (front && pal.hero) {                      // von vorn: die zwei Streifen auf Tomas Shirt
    g.lineCap = 'butt';
    g.strokeStyle = '#12b89a';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(sh[0] - dx * 11.5 - nx * 10.5, sh[1] - dy * 11.5 - ny * 10.5);
    g.lineTo(sh[0] - dx * 11.5 + nx * 10.5, sh[1] - dy * 11.5 + ny * 10.5);
    g.stroke();
    g.strokeStyle = '#ff3d81';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(sh[0] - dx * 14 - nx * 10.5, sh[1] - dy * 14 - ny * 10.5);
    g.lineTo(sh[0] - dx * 14 + nx * 10.5, sh[1] - dy * 14 + ny * 10.5);
    g.stroke();
    g.lineCap = 'round';
  }

  // Arme
  for (const sd of [-1, 1]) {
    const e = J[sd > 0 ? 'eR' : 'eL'], h = J[sd > 0 ? 'hR' : 'hL'];
    const ax = sh[0] + sd * nx * 11 - dx * 2, ay = sh[1] + sd * ny * 11 - dy * 2;
    g.strokeStyle = pal.arm;
    g.lineWidth = 5.2;
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(e[0], e[1], h[0], h[1]);
    g.stroke();
    g.strokeStyle = pal.shirt;
    g.lineWidth = 6.6;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(lerp(ax, e[0], 0.55), lerp(ay, e[1], 0.55));
    g.stroke();
    g.fillStyle = pal.hero || pal.buddy ? pal.skin : '#1b1e27';
    ell(g, h[0], h[1], 3.3, 3.3);
    g.fill();
  }

  // Umhang und Kapuze (nur aufrecht und von hinten)
  const upright = dy < -0.7;
  if (pal.cape && !front && upright) {
    const sw = Math.sin(t * 5 + ph) * 3;
    g.fillStyle = pal.cape;
    g.beginPath();
    g.moveTo(-11 + sh[0], sh[1] - 2);
    g.lineTo(11 + sh[0], sh[1] - 2);
    g.quadraticCurveTo(17 + sw, my, 15 + sw * 1.5 - lean * 6, -hv - 27);
    g.lineTo(-15 + sw * 1.5 - lean * 6, -hv - 27);
    g.quadraticCurveTo(-17 + sw, my, -11 + sh[0], sh[1] - 2);
    g.closePath();
    g.fill();
  }
  if (pal.hood && !front) {
    g.fillStyle = pal.hood;
    ell(g, sh[0] - dx * 0.5, sh[1] - dy * 0.5, 8.6, 5.6);
    g.fill();
  }

  // Hals
  g.lineCap = 'butt';
  g.strokeStyle = pal.skin;
  g.lineWidth = 6.4;
  g.beginPath();
  g.moveTo(sh[0] + dx * 2, sh[1] + dy * 2);
  g.lineTo(lerp(sh[0], J.head[0], 0.6), lerp(sh[1], J.head[1], 0.6));
  g.stroke();
  g.lineCap = 'round';

  // Kopf: folgt der Körperachse (steht im Handstand also auf dem Kopf); Haare fliegen beim Fallen nach oben
  const hy = 0;
  const fly = clamp((o.vy || 0) / 3500, -2.2, 1.2);
  g.translate(J.head[0], J.head[1]);
  g.rotate(Math.atan2(dx, -dy));
  if (pal.hero) {
    g.fillStyle = pal.skin;
    ell(g, 0, hy, 9.5, 10);
    g.fill();
    ell(g, -9.6, hy + 1, 2.2, 3);
    g.fill();
    ell(g, 9.6, hy + 1, 2.2, 3);
    g.fill();
    if (front) {                                // grüne Brille und Grinsen
      g.fillStyle = '#f5f7fa';
      rrect(g, -9.4, hy - 3.8, 8.4, 6, 1.6); g.fill();
      rrect(g, 1, hy - 3.8, 8.4, 6, 1.6); g.fill();
      g.fillStyle = '#5fe0a2';
      rrect(g, -8.3, hy - 2.8, 6.2, 4, 1); g.fill();
      rrect(g, 2.1, hy - 2.8, 6.2, 4, 1); g.fill();
      g.strokeStyle = '#a5594d';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-3, hy + 5); g.quadraticCurveTo(0, hy + 7.4, 3.4, hy + 4.6);
      g.stroke();
    } else {                                    // Brillenbügel und Glasrand in Grün
      g.fillStyle = '#f5f7fa';
      g.fillRect(-11.8, hy - 2.4, 3.6, 2.2);
      g.fillRect(8.2, hy - 2.4, 3.6, 2.2);
      g.fillStyle = '#5fe0a2';
      g.fillRect(-13, hy - 3.6, 1.9, 4.6);
      g.fillRect(11.1, hy - 3.6, 1.9, 4.6);
    }
    // Locken (von vorn nur der Schopf über der Stirn)
    for (let i = 0; i < HERO_CURLS.length; i++) {
      const c = HERO_CURLS[i];
      if (front && c[1] > -4) continue;
      g.fillStyle = pal.curls ? pal.curls[i % pal.curls.length] : c[3];
      ell(g, c[0], hy + c[1] + fly * (0.6 + Math.abs(c[0]) * 0.06), c[2], c[2]);
      g.fill();
    }
  } else if (pal.buddy) {
    // Kopf ohne Helm: von hinten die Haare, von vorn das Gesicht
    g.fillStyle = pal.skin;
    ell(g, 0, hy, 9.5, 10);
    g.fill();
    ell(g, -9.6, hy + 1, 2.2, 3);
    g.fill();
    ell(g, 9.6, hy + 1, 2.2, 3);
    g.fill();
    g.fillStyle = pal.hair;
    if (front) {
      g.beginPath();
      g.ellipse(0, hy - 3 + fly * 0.4, 10.2, 8, 0, Math.PI, TAU);
      g.fill();
      g.fillStyle = '#2a1c14';
      ell(g, -3.6, hy, 1.2, 1.4); g.fill();
      ell(g, 3.6, hy, 1.2, 1.4); g.fill();
      if (pal.specs) {
        g.strokeStyle = pal.specs;
        g.lineWidth = 0.9;
        rrect(g, -7.2, hy - 2.6, 6.4, 5, 1.6); g.stroke();
        rrect(g, 0.8, hy - 2.6, 6.4, 5, 1.6); g.stroke();
      }
      g.strokeStyle = '#a5594d';
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(-2.6, hy + 5); g.quadraticCurveTo(0, hy + 6.6, 2.8, hy + 4.8);
      g.stroke();
    } else {
      if (pal.hairLong) ell(g, 0, hy - 1 + fly * 0.4, 10.5, 10.4);
      else ell(g, 0, hy - 2.4 + fly * 0.4, 9.9, 9);
      g.fill();
      g.strokeStyle = pal.hair2;
      g.lineWidth = 1.1;
      g.beginPath();
      g.arc(-1.5, hy - 2.5, 6.2, Math.PI * 1.1, Math.PI * 1.75);
      g.moveTo(4.6, hy - 5);
      g.arc(1.5, hy - 1, 5, -0.9, 0.5);
      g.stroke();
    }
  } else {
    g.fillStyle = pal.helmet;
    ell(g, 0, hy, 10.5, 10.5);
    g.fill();
    g.fillStyle = pal.hstripe;
    g.fillRect(-2.2, hy - 10.2, 4.4, front ? 7 : 20);
    if (front) {                                // Visier
      g.fillStyle = '#12151c';
      rrect(g, -8, hy - 3.4, 16, 6.6, 3);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.fillRect(-6, hy - 2.4, 5, 1.4);
    } else {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath();
      g.ellipse(0, hy + 5.5, 10, 5, 0, 0, Math.PI);
      g.fill();
    }
    if (pal.crest) {
      g.fillStyle = pal.crest;
      g.beginPath();
      g.moveTo(-2.8, hy - 9);
      g.quadraticCurveTo(0, hy - 23 + fly, 2.8, hy - 9);
      g.lineTo(2.3, hy + (front ? -6 : 9));
      g.lineTo(-2.3, hy + (front ? -6 : 9));
      g.closePath();
      g.fill();
    }
    if (pal.wings) {
      g.fillStyle = pal.wings;
      for (const sd of [-1, 1]) {
        g.beginPath();
        g.moveTo(sd * 9, hy - 3);
        g.quadraticCurveTo(sd * 23, hy - 17 + fly * 2, sd * 18, hy - 1);
        g.quadraticCurveTo(sd * 14, hy + 3, sd * 9, hy + 3);
        g.fill();
      }
    }
    if (pal.crown) {
      g.fillStyle = pal.crown;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 4 - 2.2, hy - 8.5);
        g.lineTo(i * 4, hy - 17 + Math.abs(i) * 1.6);
        g.lineTo(i * 4 + 2.2, hy - 8.5);
        g.fill();
      }
    }
  }

  g.restore();
  g.restore();
}

/* ================= Toma-Porträt (Menü + HUD) ================= */

function drawHeroPortrait(g, cx, cy, s) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);

  // Plakette
  const gr = g.createLinearGradient(0, -50, 0, 50);
  gr.addColorStop(0, '#45ccff');
  gr.addColorStop(1, '#1b5fd6');
  ell(g, 0, 0, 49, 49);
  g.fillStyle = gr;
  g.fill();

  g.save();
  ell(g, 0, 0, 49, 49);
  g.clip();
  g.fillStyle = 'rgba(255,255,255,.13)';
  for (let i = 0; i < 9; i++) {
    const a = i * TAU / 9;
    g.beginPath();
    g.moveTo(0, 6);
    g.lineTo(Math.cos(a) * 90, 6 + Math.sin(a) * 90);
    g.lineTo(Math.cos(a + 0.22) * 90, 6 + Math.sin(a + 0.22) * 90);
    g.fill();
  }
  // Schultern im schwarzen Shirt
  g.fillStyle = '#17181d';
  g.beginPath();
  g.moveTo(-47, 54);
  g.quadraticCurveTo(-43, 27, -15, 22);
  g.lineTo(15, 22);
  g.quadraticCurveTo(43, 27, 47, 54);
  g.closePath();
  g.fill();
  g.strokeStyle = '#30333d';
  g.lineWidth = 2.6;
  g.beginPath();
  g.arc(0, 19, 11.5, 0.12 * Math.PI, 0.88 * Math.PI);
  g.stroke();
  // Hals
  g.fillStyle = '#e2b48c';
  rrect(g, -8, 9, 16, 19, 5);
  g.fill();
  g.restore();

  // Ohren
  g.fillStyle = '#eec19a';
  ell(g, -20, -5, 4, 6);
  g.fill();
  ell(g, 20, -5, 4, 6);
  g.fill();

  // Gesicht
  g.fillStyle = '#f4cba4';
  g.beginPath();
  g.moveTo(-19, -14);
  g.quadraticCurveTo(-20, 8, -11, 17);
  g.quadraticCurveTo(0, 24, 11, 17);
  g.quadraticCurveTo(20, 8, 19, -14);
  g.quadraticCurveTo(0, -30, -19, -14);
  g.fill();

  // Bartschatten am Kinn
  g.fillStyle = 'rgba(150,110,70,.3)';
  ell(g, 0, 17.5, 7, 3.2);
  g.fill();

  // Blonde Locken
  g.fillStyle = '#e0b548';
  ell(g, 0, -24, 21, 14);
  g.fill();
  const R = mulberry32(5);
  const cols = ['#f3d36e', '#e6bd4f', '#f8e394', '#d9ab3d'];
  for (let row = 2; row >= 0; row--) {
    const n = 9 - row * 2;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.06 + 0.88 * (i / (n - 1)));
      const px = Math.cos(a) * (20 - row * 2.8) + (R() - 0.5) * 2;
      const py = -13 + Math.sin(a) * (12 + row * 6.5) + (R() - 0.5) * 2;
      const r = 6.3 - row * 0.3;
      g.fillStyle = cols[(i + row * 2) % 4];
      ell(g, px, py, r, r);
      g.fill();
      g.strokeStyle = 'rgba(255,246,190,.75)';
      g.lineWidth = 1.1;
      g.beginPath();
      g.arc(px, py, r * 0.55, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
  }

  // Augenbrauen
  g.lineCap = 'round';
  g.strokeStyle = '#b98f3a';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-17, -15.5); g.lineTo(-6, -14.5);
  g.moveTo(17, -15.5); g.lineTo(6, -14.5);
  g.stroke();

  // Grüne Brille mit weißem Rahmen
  g.strokeStyle = '#f5f7fa';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(-19.5, -7.5); g.lineTo(-22.5, -8.5);
  g.moveTo(19.5, -7.5); g.lineTo(22.5, -8.5);
  g.moveTo(-3, -8); g.lineTo(3, -8);
  g.stroke();
  for (const x of [-19, 3]) {
    const lg = g.createLinearGradient(0, -12.5, 0, -2);
    lg.addColorStop(0, '#a5f7cb');
    lg.addColorStop(1, '#3fc48e');
    rrect(g, x, -12.5, 16, 10.5, 2.6);
    g.globalAlpha = 0.92;
    g.fillStyle = lg;
    g.fill();
    g.globalAlpha = 1;
    g.lineWidth = 2.4;
    g.strokeStyle = '#f5f7fa';
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x + 3, -4.5); g.lineTo(x + 7.5, -10.5);
    g.stroke();
  }

  // Nase und Grinsen
  g.strokeStyle = 'rgba(160,110,80,.65)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(1, 0);
  g.quadraticCurveTo(3.6, 4, 0, 5);
  g.stroke();
  g.strokeStyle = '#a5594d';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-6, 10.5);
  g.quadraticCurveTo(1, 13.8, 7.5, 9.3);
  g.stroke();

  // Rand
  ell(g, 0, 0, 49, 49);
  g.lineWidth = 3.4;
  g.strokeStyle = '#ffffff';
  g.stroke();

  g.restore();
}
