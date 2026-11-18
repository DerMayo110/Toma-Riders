'use strict';

/* Techno-Hellas: Kulissen, Himmel/Hintergründe je Thema und Dialog-Porträts.
   Nutzt die Helfer aus art.js (mk, reg, rrect, ell, drawBillboard, drawCloud …). */

/* ================= Bausteine ================= */

/* Mäander-Band ("Greek key") als Linienzug */
function meander(g, x, y, len, u) {
  g.beginPath();
  g.moveTo(x, y + u);
  for (let cx = x; cx < x + len - u * 2; cx += u * 2) {
    g.lineTo(cx, y);
    g.lineTo(cx + u * 1.5, y);
    g.lineTo(cx + u * 1.5, y + u * 0.62);
    g.lineTo(cx + u * 0.6, y + u * 0.62);
    g.lineTo(cx + u * 0.6, y + u);
    g.lineTo(cx + u * 2, y + u);
  }
  g.stroke();
}

function glowOn(g, col, blur) { g.shadowColor = col; g.shadowBlur = blur; }
function glowOff(g) { g.shadowBlur = 0; }

function drawColumn(g, w, h, o) {
  const bw = w * 0.5, capH = h * 0.06, baseH = h * 0.05;
  const top = o.broken ? h * 0.09 : capH;
  const tt = o.inv ? 1.0 : 0.82, tb = o.inv ? 0.76 : 1.0;      // Breite oben / unten
  const gr = g.createLinearGradient(w / 2 - bw / 2, 0, w / 2 + bw / 2, 0);
  gr.addColorStop(0, o.c1);
  gr.addColorStop(0.55, o.c1);
  gr.addColorStop(1, o.c2);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(w / 2 - bw * tb / 2, h - baseH);
  g.lineTo(w / 2 - bw * tt / 2, top);
  if (o.broken) {
    g.lineTo(w / 2 - bw * 0.12, top + h * 0.06);
    g.lineTo(w / 2 + bw * 0.1, top - h * 0.04);
    g.lineTo(w / 2 + bw * tt / 2, top + h * 0.05);
  } else {
    g.lineTo(w / 2 + bw * tt / 2, top);
  }
  g.lineTo(w / 2 + bw * tb / 2, h - baseH);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(60,50,40,.18)';
  g.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    const f = i / 5;
    g.beginPath();
    g.moveTo(w / 2 - bw * tt / 2 + bw * tt * f, top + h * 0.07);
    g.lineTo(w / 2 - bw * tb / 2 + bw * tb * f, h - baseH);
    g.stroke();
  }
  g.fillStyle = o.cap || o.c1;
  g.fillRect(w / 2 - bw * 0.62, h - baseH, bw * 1.24, baseH);
  if (!o.broken) {
    g.fillRect(w / 2 - bw * 0.68, 0, bw * 1.36, capH * 0.55);
    g.fillRect(w / 2 - bw * 0.56, capH * 0.55, bw * 1.12, capH * 0.45);
  }
  if (o.ring) {
    glowOn(g, o.ring, 14);
    g.fillStyle = o.ring;
    g.fillRect(w / 2 - bw / 2 - 2, h * 0.62, bw + 4, 7);
    glowOff(g);
  }
}

function drawTemple(g, w, h, o) {
  const stepH = h * 0.05, colTop = h * 0.42, colBot = h - stepH * 2;
  g.fillStyle = o.c2;
  g.fillRect(0, h - stepH, w, stepH);
  g.fillStyle = o.c1;
  g.fillRect(w * 0.03, h - stepH * 2, w * 0.94, stepH);
  const ig = g.createLinearGradient(0, colTop, 0, colBot);
  ig.addColorStop(0, o.glow);
  ig.addColorStop(1, o.dark || 'rgba(10,20,50,.92)');
  g.fillStyle = ig;
  g.fillRect(w * 0.08, colTop, w * 0.84, colBot - colTop);
  const n = 6, cw = w * 0.07;
  for (let i = 0; i < n; i++) {
    const cx = w * 0.1 + (w * 0.8 - cw) * i / (n - 1);
    const cg = g.createLinearGradient(cx, 0, cx + cw, 0);
    cg.addColorStop(0, o.c1);
    cg.addColorStop(1, o.c2);
    g.fillStyle = cg;
    g.fillRect(cx, colTop, cw, colBot - colTop);
    g.fillStyle = o.c1;
    g.fillRect(cx - cw * 0.15, colTop, cw * 1.3, 8);
  }
  g.fillStyle = o.c1;
  g.fillRect(w * 0.05, colTop - h * 0.07, w * 0.9, h * 0.07);
  glowOn(g, o.glow, 10);
  g.fillStyle = o.glow;
  g.fillRect(w * 0.05, colTop - h * 0.038, w * 0.9, 5);
  glowOff(g);
  g.fillStyle = o.roof || o.c2;
  g.beginPath();
  g.moveTo(w * 0.02, colTop - h * 0.07); g.lineTo(w / 2, h * 0.08); g.lineTo(w * 0.98, colTop - h * 0.07);
  g.closePath();
  g.fill();
  g.fillStyle = o.c1;
  g.beginPath();
  g.moveTo(w * 0.14, colTop - h * 0.085); g.lineTo(w / 2, h * 0.145); g.lineTo(w * 0.86, colTop - h * 0.085);
  g.closePath();
  g.fill();
  glowOn(g, o.glow, 12);
  g.fillStyle = o.glow;
  g.font = '900 ' + Math.round(h * 0.11) + 'px "Segoe UI", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(o.sym || 'Ω', w / 2, colTop - h * 0.15);
  ell(g, w / 2, h * 0.07, 8, 8);
  g.fill();
  glowOff(g);
}

function drawStatue(g, w, h, o) {
  g.fillStyle = o.c2;
  g.fillRect(w * 0.2, h * 0.88, w * 0.6, h * 0.12);
  g.fillStyle = o.c1;
  g.fillRect(w * 0.16, h * 0.86, w * 0.68, h * 0.03);
  const gr = g.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
  gr.addColorStop(0, o.c1);
  gr.addColorStop(1, o.c2);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(w * 0.36, h * 0.86); g.lineTo(w * 0.4, h * 0.5); g.lineTo(w * 0.6, h * 0.5); g.lineTo(w * 0.66, h * 0.86);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(w * 0.36, h * 0.52); g.lineTo(w * 0.33, h * 0.3);
  g.quadraticCurveTo(w * 0.5, h * 0.25, w * 0.67, h * 0.3);
  g.lineTo(w * 0.64, h * 0.52);
  g.closePath();
  g.fill();
  ell(g, w * 0.5, h * 0.21, w * 0.09, h * 0.045);
  g.fill();
  g.lineCap = 'round';
  g.strokeStyle = o.c1;
  g.lineWidth = w * 0.07;
  g.beginPath();
  g.moveTo(w * 0.65, h * 0.32); g.lineTo(w * 0.8, h * 0.27); g.lineTo(w * 0.82, h * 0.17);
  g.stroke();
  glowOn(g, o.glow, 10);
  g.fillStyle = o.glow;
  g.beginPath();
  g.moveTo(w * 0.42, h * 0.19);
  g.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.6, h * 0.2);
  g.quadraticCurveTo(w * 0.5, h * 0.15, w * 0.42, h * 0.19);
  g.fill();
  g.strokeStyle = o.glow;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(w * 0.83, h * 0.03); g.lineTo(w * 0.83, h * 0.86);
  g.stroke();
  g.beginPath();
  g.moveTo(w * 0.83, 0); g.lineTo(w * 0.79, h * 0.05); g.lineTo(w * 0.87, h * 0.05);
  g.fill();
  g.fillRect(w * 0.455, h * 0.205, w * 0.03, 4);
  g.fillRect(w * 0.515, h * 0.205, w * 0.03, 4);
  glowOff(g);
  g.fillStyle = o.c2;
  ell(g, w * 0.3, h * 0.45, w * 0.17, w * 0.17);
  g.fill();
  glowOn(g, o.glow, 8);
  g.strokeStyle = o.glow;
  g.lineWidth = 4;
  ell(g, w * 0.3, h * 0.45, w * 0.115, w * 0.115);
  g.stroke();
  glowOff(g);
}

function drawBrazier(g, w, h, o) {
  g.lineCap = 'round';
  g.strokeStyle = '#8a6a3a';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.42); g.lineTo(w * 0.22, h - 4);
  g.moveTo(w * 0.5, h * 0.42); g.lineTo(w * 0.78, h - 4);
  g.moveTo(w * 0.5, h * 0.42); g.lineTo(w * 0.5, h - 4);
  g.stroke();
  const gr = g.createRadialGradient(w / 2, h * 0.2, 3, w / 2, h * 0.2, w * 0.55);
  gr.addColorStop(0, 'rgba(' + o.glow + ',.85)');
  gr.addColorStop(1, 'rgba(' + o.glow + ',0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h * 0.5);
  g.fillStyle = '#b8873f';
  g.beginPath();
  g.moveTo(w * 0.14, h * 0.3);
  g.quadraticCurveTo(w * 0.5, h * 0.52, w * 0.86, h * 0.3);
  g.closePath();
  g.fill();
  g.fillStyle = '#e0b060';
  g.fillRect(w * 0.1, h * 0.28, w * 0.8, 7);
  g.fillStyle = o.flame;
  g.beginPath();
  g.moveTo(w * 0.26, h * 0.29);
  g.quadraticCurveTo(w * 0.2, h * 0.14, w * 0.42, h * 0.1);
  g.quadraticCurveTo(w * 0.4, h * 0.03, w * 0.52, 0);
  g.quadraticCurveTo(w * 0.56, h * 0.1, w * 0.66, h * 0.12);
  g.quadraticCurveTo(w * 0.8, h * 0.2, w * 0.74, h * 0.29);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(w * 0.38, h * 0.29);
  g.quadraticCurveTo(w * 0.4, h * 0.18, w * 0.5, h * 0.12);
  g.quadraticCurveTo(w * 0.62, h * 0.2, w * 0.62, h * 0.29);
  g.closePath();
  g.fill();
}

function amphora(g, cx, by, s, col) {
  g.lineCap = 'round';
  g.strokeStyle = col;
  g.lineWidth = 4 * s;
  for (const sd of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + sd * 9 * s, by - 76 * s);
    g.quadraticCurveTo(cx + sd * 25 * s, by - 74 * s, cx + sd * 16 * s, by - 57 * s);
    g.stroke();
  }
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(cx - 5 * s, by);
  g.quadraticCurveTo(cx - 27 * s, by - 40 * s, cx - 12 * s, by - 66 * s);
  g.lineTo(cx - 8 * s, by - 80 * s);
  g.lineTo(cx + 8 * s, by - 80 * s);
  g.lineTo(cx + 12 * s, by - 66 * s);
  g.quadraticCurveTo(cx + 27 * s, by - 40 * s, cx + 5 * s, by);
  g.closePath();
  g.fill();
  g.fillStyle = '#1b1e27';
  g.fillRect(cx - 17.5 * s, by - 50 * s, 35 * s, 7 * s);
  g.fillRect(cx - 10 * s, by - 84 * s, 20 * s, 5 * s);
  g.fillStyle = 'rgba(255,255,255,.22)';
  ell(g, cx - 7 * s, by - 36 * s, 4 * s, 12 * s);
  g.fill();
}

function drawRock(g, w, h, o) {
  const P = o.mesa
    ? [[0.02, 1], [0.08, 0.5], [0.16, 0.42], [0.2, 0.12], [0.5, 0.06], [0.78, 0.1], [0.84, 0.4], [0.93, 0.52], [0.98, 1]]
    : [[0.06, 1], [0.14, 0.62], [0.24, 0.48], [0.31, 0.2], [0.43, 0.06], [0.55, 0], [0.66, 0.13], [0.72, 0.4], [0.86, 0.56], [0.95, 1]];
  const path = () => {
    g.beginPath();
    P.forEach((p, i) => (i ? g.lineTo(w * p[0], h * p[1]) : g.moveTo(w * p[0], h * p[1])));
    g.closePath();
  };
  path();
  g.fillStyle = o.c1;
  g.fill();
  g.save();
  path();
  g.clip();
  g.fillStyle = o.c2;
  g.beginPath();
  g.moveTo(w * 0.56, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(w * 0.48, h);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,.13)';
  g.lineWidth = 4;
  for (let y = h * 0.14; y < h; y += h * 0.11) {
    g.beginPath();
    g.moveTo(0, y); g.lineTo(w, y + h * 0.03);
    g.stroke();
  }
  g.restore();
}

function drawCloudT(g, x, y, s, tint, shade) {
  const parts = [[-60, 10, 50, 22], [-20, -8, 46, 30], [25, -2, 52, 28], [70, 12, 44, 20], [0, 16, 92, 18]];
  g.fillStyle = shade;
  for (const p of parts) { ell(g, x + p[0] * s, y + (p[1] + 7) * s, p[2] * s, p[3] * s); g.fill(); }
  g.fillStyle = tint;
  for (const p of parts) { ell(g, x + p[0] * s, y + p[1] * s, p[2] * s, p[3] * s); g.fill(); }
}

/* ================= Sprites ================= */

function buildWorldArt() {
  const MARBLE = { c1: '#f4efe2', c2: '#cfc6b0' };
  const GOLD = { c1: '#ffe9a8', c2: '#d9a93a' };

  reg('col', 900, 3000, 120, 400, (g, w, h) => drawColumn(g, w, h, { c1: MARBLE.c1, c2: MARBLE.c2, ring: '#19e3ff' }));
  reg('colb', 900, 1700, 120, 226, (g, w, h) => drawColumn(g, w, h, { c1: MARBLE.c1, c2: MARBLE.c2, broken: true }));
  reg('gcol', 950, 3300, 120, 416, (g, w, h) => drawColumn(g, w, h, { c1: GOLD.c1, c2: GOLD.c2, ring: '#ffffff' }));
  reg('mcol', 900, 2800, 120, 374, (g, w, h) => drawColumn(g, w, h, { c1: '#c8372d', c2: '#8a1f1a', ring: '#ffd23d', inv: true, cap: '#1b1e27' }));
  reg('dcol', 900, 1700, 120, 226, (g, w, h) => drawColumn(g, w, h, { c1: '#4a565e', c2: '#2a3238', broken: true }));

  reg('temple', 5200, 4200, 520, 420, (g, w, h) => drawTemple(g, w, h, { c1: '#f6f1e4', c2: '#d2c8b0', glow: '#39e0ff', sym: 'Ω' }));
  reg('temple2', 5200, 4200, 520, 420, (g, w, h) => drawTemple(g, w, h, { c1: '#f6f1e4', c2: '#d2c8b0', glow: '#ff7ab0', roof: '#c8372d', sym: 'Φ' }));
  reg('gtemple', 5600, 4600, 520, 428, (g, w, h) => drawTemple(g, w, h, { c1: '#fff0c0', c2: '#e0b24a', glow: '#ffffff', roof: '#f0c860', dark: 'rgba(120,80,20,.85)', sym: 'Ζ' }));

  reg('statue', 2200, 5200, 220, 520, (g, w, h) => drawStatue(g, w, h, { c1: '#f2ede0', c2: '#c9c0aa', glow: '#39e0ff' }));
  reg('gstatue', 2400, 5600, 220, 514, (g, w, h) => drawStatue(g, w, h, { c1: '#ffe9a8', c2: '#d9a93a', glow: '#ffffff' }));

  reg('olive', 1700, 1900, 300, 336, (g, w, h) => {
    g.lineCap = 'round';
    g.strokeStyle = '#6b5a45';
    g.lineWidth = 22;
    g.beginPath(); g.moveTo(w * 0.5, h - 10); g.quadraticCurveTo(w * 0.42, h * 0.75, w * 0.52, h * 0.55); g.stroke();
    g.lineWidth = 13;
    g.beginPath(); g.moveTo(w * 0.5, h * 0.66); g.quadraticCurveTo(w * 0.34, h * 0.56, w * 0.3, h * 0.45); g.stroke();
    g.beginPath(); g.moveTo(w * 0.52, h * 0.6); g.quadraticCurveTo(w * 0.66, h * 0.52, w * 0.72, h * 0.42); g.stroke();
    const blobs = [[0.28, 0.34, 0.2], [0.5, 0.24, 0.24], [0.74, 0.33, 0.2], [0.4, 0.42, 0.18], [0.62, 0.42, 0.18]];
    g.fillStyle = '#5f7a55';
    for (const b of blobs) { ell(g, w * b[0], h * b[1] + 8, w * b[2], w * b[2] * 0.8); g.fill(); }
    g.fillStyle = '#8fa67a';
    for (const b of blobs) { ell(g, w * b[0], h * b[1], w * b[2], w * b[2] * 0.8); g.fill(); }
    g.fillStyle = '#b5c79e';
    for (const b of blobs) { ell(g, w * b[0] - w * 0.04, h * b[1] - h * 0.04, w * b[2] * 0.5, w * b[2] * 0.36); g.fill(); }
  });

  reg('cypress', 800, 2800, 120, 420, (g, w, h) => {
    g.fillStyle = '#5a4030';
    g.fillRect(w / 2 - 6, h * 0.9, 12, h * 0.1);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#2f6b4a');
    gr.addColorStop(1, '#1d4a34');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.bezierCurveTo(w * 0.95, h * 0.35, w * 0.9, h * 0.8, w / 2, h * 0.94);
    g.bezierCurveTo(w * 0.1, h * 0.8, w * 0.05, h * 0.35, w / 2, 0);
    g.fill();
    g.fillStyle = 'rgba(160,220,170,.2)';
    g.beginPath();
    g.moveTo(w / 2, h * 0.03);
    g.bezierCurveTo(w * 0.3, h * 0.35, w * 0.25, h * 0.7, w * 0.42, h * 0.9);
    g.bezierCurveTo(w * 0.36, h * 0.6, w * 0.4, h * 0.3, w / 2, h * 0.03);
    g.fill();
  });

  reg('brazier', 760, 1800, 120, 284, (g, w, h) => drawBrazier(g, w, h, { flame: '#39e0ff', glow: '90,230,255' }));
  reg('brazierF', 760, 1800, 120, 284, (g, w, h) => drawBrazier(g, w, h, { flame: '#ff8a2b', glow: '255,150,60' }));
  reg('brazierG', 760, 1800, 120, 284, (g, w, h) => drawBrazier(g, w, h, { flame: '#7dffd8', glow: '120,255,210' }));

  reg('house', 2600, 2200, 300, 254, (g, w, h) => {
    g.fillStyle = '#f7f7f2';
    g.fillRect(w * 0.08, h * 0.42, w * 0.6, h * 0.58);
    g.fillStyle = '#e3e3da';
    g.fillRect(w * 0.5, h * 0.42, w * 0.18, h * 0.58);
    g.fillStyle = '#fbfbf7';
    g.fillRect(w * 0.6, h * 0.6, w * 0.34, h * 0.4);
    g.fillStyle = '#e6e6de';
    g.fillRect(w * 0.84, h * 0.6, w * 0.1, h * 0.4);
    g.fillStyle = '#2f7fd6';
    g.beginPath(); g.arc(w * 0.33, h * 0.42, w * 0.16, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.beginPath(); g.arc(w * 0.3, h * 0.41, w * 0.1, Math.PI * 1.1, Math.PI * 1.6); g.lineTo(w * 0.3, h * 0.41); g.fill();
    g.fillStyle = '#2f7fd6';
    rrect(g, w * 0.2, h * 0.7, w * 0.1, h * 0.3, 8); g.fill();
    glowOn(g, '#19e3ff', 10);
    g.fillStyle = '#19e3ff';
    g.fillRect(w * 0.4, h * 0.58, w * 0.07, h * 0.1);
    g.fillRect(w * 0.68, h * 0.72, w * 0.1, h * 0.09);
    g.fillRect(w * 0.08, h * 0.42, w * 0.6, 4);
    glowOff(g);
    g.strokeStyle = '#8a97a8';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(w * 0.78, h * 0.6); g.lineTo(w * 0.78, h * 0.44); g.stroke();
    g.fillStyle = '#ff3d81';
    ell(g, w * 0.78, h * 0.43, 6, 6); g.fill();
  });

  reg('ship', 3000, 2400, 300, 240, (g, w, h) => {
    const sg = g.createLinearGradient(0, h * 0.08, 0, h * 0.6);
    sg.addColorStop(0, 'rgba(125,255,216,.95)');
    sg.addColorStop(1, 'rgba(25,201,232,.75)');
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(w * 0.22, h * 0.1); g.lineTo(w * 0.78, h * 0.1);
    g.quadraticCurveTo(w * 0.84, h * 0.36, w * 0.76, h * 0.6);
    g.lineTo(w * 0.24, h * 0.6);
    g.quadraticCurveTo(w * 0.16, h * 0.36, w * 0.22, h * 0.1);
    g.fill();
    g.strokeStyle = '#0b3a66';
    g.lineWidth = 4;
    meander(g, w * 0.27, h * 0.3, w * 0.48, 14);
    g.fillStyle = '#5a4030';
    g.fillRect(w * 0.49, h * 0.04, 6, h * 0.7);
    g.fillStyle = '#4a2f22';
    g.beginPath();
    g.moveTo(w * 0.04, h * 0.7); g.lineTo(w * 0.9, h * 0.7);
    g.quadraticCurveTo(w * 0.99, h * 0.62, w * 0.96, h * 0.5);
    g.lineTo(w * 0.99, h * 0.72);
    g.quadraticCurveTo(w * 0.9, h * 0.95, w * 0.7, h * 0.95);
    g.lineTo(w * 0.18, h * 0.95);
    g.quadraticCurveTo(w * 0.06, h * 0.9, 0, h * 0.78);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd23d';
    g.fillRect(w * 0.06, h * 0.72, w * 0.84, 5);
    g.fillStyle = '#ffffff';
    ell(g, w * 0.12, h * 0.81, 9, 6); g.fill();
    g.fillStyle = '#19c9e8';
    ell(g, w * 0.12, h * 0.81, 4, 4); g.fill();
    g.strokeStyle = '#c9a36a';
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      g.beginPath(); g.moveTo(w * (0.26 + i * 0.08), h * 0.86); g.lineTo(w * (0.22 + i * 0.08), h * 0.995); g.stroke();
    }
  });

  /* Holo-Stelen (erfundene Werbung) */
  const boards = [
    { a: '#0f8f7a', b: '#39e0ff', ink: '#ffffff', txt: 'AMBROSIA ZERO', sub: 'jetzt ganz ohne Sterblichkeit', size: 40 },
    { a: '#7a2a12', b: '#ff8a2b', ink: '#ffffff', txt: 'HEPHAISTOS', sub: 'Aether-Werke · seit Anbeginn', size: 50 },
    { a: '#3a1a7a', b: '#b06aff', ink: '#ffffff', txt: 'ORAKEL 24/7', sub: 'Delphi sieht alles. Wirklich alles.', size: 50 },
    { a: '#f0c860', b: '#fff3d0', ink: '#3a2a0a', txt: 'PEGASOS', sub: 'Express – über Nacht nach Theben', size: 62 },
  ];
  boards.forEach((o, i) => reg('gb' + (i + 1), 2600, 2100, 420, 340, (g, w, h) => drawBillboard(g, w, h, o)));

  /* Hindernis: Amphoren */
  reg('amph', 720, 540, 240, 180, (g, w, h) => {
    amphora(g, 60, h - 2, 1, '#c9703a');
    amphora(g, 180, h - 2, 1, '#b8602f');
    amphora(g, 120, h - 2, 1.28, '#d98548');
    glowOn(g, '#ffd23d', 12);
    g.fillStyle = '#ffd23d';
    g.beginPath(); g.moveTo(120, 14); g.lineTo(134, 40); g.lineTo(106, 40); g.closePath(); g.fill();
    glowOff(g);
    g.fillStyle = '#1b1e27';
    g.fillRect(118, 22, 4, 10);
    g.fillRect(118, 34, 4, 3);
  });

  /* Thermopylen */
  reg('rock', 2600, 4200, 260, 420, (g, w, h) => drawRock(g, w, h, { c1: '#c06a45', c2: '#8f4230' }));
  reg('rock2', 3800, 2700, 380, 270, (g, w, h) => drawRock(g, w, h, { c1: '#b05c3c', c2: '#7f3a2a', mesa: true }));
  reg('forge', 2400, 4200, 240, 420, (g, w, h) => {
    const gg = g.createRadialGradient(w / 2, h * 0.9, 10, w / 2, h * 0.9, w * 0.7);
    gg.addColorStop(0, 'rgba(255,120,30,.7)');
    gg.addColorStop(1, 'rgba(255,120,30,0)');
    g.fillStyle = gg;
    g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle = '#2a2228';
    g.beginPath(); g.moveTo(w * 0.2, h); g.lineTo(w * 0.3, h * 0.2); g.lineTo(w * 0.7, h * 0.2); g.lineTo(w * 0.8, h); g.closePath(); g.fill();
    g.fillStyle = '#1c161b';
    g.beginPath(); g.moveTo(w * 0.56, h); g.lineTo(w * 0.58, h * 0.2); g.lineTo(w * 0.7, h * 0.2); g.lineTo(w * 0.8, h); g.closePath(); g.fill();
    g.fillStyle = '#3a3038';
    g.fillRect(w * 0.26, h * 0.16, w * 0.48, h * 0.05);
    glowOn(g, '#ff7a1f', 18);
    g.fillStyle = '#ff8a2b';
    g.beginPath();
    g.moveTo(w * 0.34, h * 0.16);
    g.quadraticCurveTo(w * 0.3, h * 0.07, w * 0.45, h * 0.06);
    g.quadraticCurveTo(w * 0.46, h * 0.01, w * 0.54, 0);
    g.quadraticCurveTo(w * 0.56, h * 0.06, w * 0.62, h * 0.07);
    g.quadraticCurveTo(w * 0.7, h * 0.1, w * 0.66, h * 0.16);
    g.closePath();
    g.fill();
    for (const t of [0.38, 0.56, 0.74]) {
      g.fillStyle = '#ff7a1f';
      rrect(g, w * 0.4, h * t, w * 0.14, h * 0.075, 6); g.fill();
      g.fillStyle = '#ffe08a';
      rrect(g, w * 0.43, h * (t + 0.02), w * 0.08, h * 0.035, 4); g.fill();
    }
    glowOff(g);
    g.strokeStyle = '#b87333';
    g.lineWidth = 8;
    g.lineJoin = 'round';
    g.beginPath(); g.moveTo(w * 0.24, h * 0.9); g.lineTo(w * 0.08, h * 0.9); g.lineTo(w * 0.08, h * 0.6); g.stroke();
  });
  reg('spears', 1400, 1900, 170, 230, (g, w, h) => {
    g.lineCap = 'round';
    for (const p of [[0.3, -0.06], [0.5, 0], [0.7, 0.06]]) {
      g.strokeStyle = '#c9a36a';
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(w * p[0], h); g.lineTo(w * (p[0] + p[1]), h * 0.1); g.stroke();
      g.fillStyle = '#e6e9ee';
      const tx = w * (p[0] + p[1]);
      g.beginPath(); g.moveTo(tx, 0); g.lineTo(tx - 6, h * 0.11); g.lineTo(tx + 6, h * 0.11); g.closePath(); g.fill();
    }
    g.fillStyle = '#b8873f';
    ell(g, w * 0.5, h * 0.68, w * 0.3, w * 0.3); g.fill();
    g.fillStyle = '#8a1f1f';
    ell(g, w * 0.5, h * 0.68, w * 0.24, w * 0.24); g.fill();
    g.strokeStyle = '#ffd23d';
    g.lineWidth = 8;
    g.lineJoin = 'round';
    g.beginPath(); g.moveTo(w * 0.36, h * 0.79); g.lineTo(w * 0.5, h * 0.56); g.lineTo(w * 0.64, h * 0.79); g.stroke();
  });

  /* Knossos */
  reg('wall', 3000, 2300, 360, 276, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3a4470');
    gr.addColorStop(1, '#232a4a');
    g.fillStyle = gr;
    g.fillRect(0, h * 0.08, w, h * 0.92);
    g.fillStyle = '#4a5688';
    g.fillRect(0, h * 0.04, w, h * 0.07);
    g.strokeStyle = 'rgba(0,0,0,.25)';
    g.lineWidth = 2;
    for (let r = 0; r < 5; r++) {
      const y = h * (0.32 + r * 0.14);
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let c = 0; c < 7; c++) {
        const x = (c + (r % 2) * 0.5) * w / 6;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h * 0.14); g.stroke();
      }
    }
    glowOn(g, '#19e3ff', 12);
    g.strokeStyle = '#19e3ff';
    g.lineWidth = 5;
    g.lineJoin = 'miter';
    meander(g, 6, h * 0.15, w - 6, 22);
    glowOff(g);
  });
  reg('bull', 2200, 2800, 220, 280, (g, w, h) => {
    g.fillStyle = '#2a2233';
    g.fillRect(w * 0.25, h * 0.72, w * 0.5, h * 0.28);
    g.fillStyle = '#3a3046';
    g.fillRect(w * 0.2, h * 0.68, w * 0.6, h * 0.06);
    g.lineCap = 'round';
    g.strokeStyle = '#ffd23d';
    g.lineWidth = 12;
    g.beginPath(); g.moveTo(w * 0.32, h * 0.3); g.quadraticCurveTo(w * 0.08, h * 0.26, w * 0.14, h * 0.05); g.stroke();
    g.beginPath(); g.moveTo(w * 0.68, h * 0.3); g.quadraticCurveTo(w * 0.92, h * 0.26, w * 0.86, h * 0.05); g.stroke();
    g.fillStyle = '#1f1a28';
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.3);
    g.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.7, h * 0.3);
    g.lineTo(w * 0.62, h * 0.62);
    g.quadraticCurveTo(w * 0.5, h * 0.72, w * 0.38, h * 0.62);
    g.closePath();
    g.fill();
    glowOn(g, '#ff2a2a', 16);
    g.fillStyle = '#ff3b3b';
    ell(g, w * 0.41, h * 0.42, 8, 5); g.fill();
    ell(g, w * 0.59, h * 0.42, 8, 5); g.fill();
    glowOff(g);
    g.strokeStyle = '#ffd23d';
    g.lineWidth = 4;
    g.beginPath(); g.arc(w * 0.5, h * 0.6, 10, 0, Math.PI); g.stroke();
  });

  /* Unterwelt */
  reg('dead', 1600, 2400, 220, 330, (g, w, h) => {
    g.strokeStyle = '#10161a';
    g.lineCap = 'round';
    const br = (x0, y0, x1, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(w * x0, h * y0); g.lineTo(w * x1, h * y1); g.stroke(); };
    br(0.5, 1, 0.48, 0.55, 18); br(0.48, 0.55, 0.3, 0.32, 11); br(0.48, 0.55, 0.66, 0.3, 11);
    br(0.3, 0.32, 0.14, 0.22, 6); br(0.3, 0.32, 0.32, 0.1, 6); br(0.66, 0.3, 0.86, 0.2, 6);
    br(0.66, 0.3, 0.62, 0.08, 6); br(0.48, 0.7, 0.7, 0.58, 7); br(0.14, 0.22, 0.06, 0.1, 3);
    br(0.86, 0.2, 0.95, 0.08, 3); br(0.32, 0.1, 0.24, 0.02, 3); br(0.7, 0.58, 0.82, 0.5, 3);
  });
  ['Ω', 'Ψ', 'Θ'].forEach((sym, i) => reg('stele' + (i + 1), 700, 1500, 100, 214, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#5a6670');
    gr.addColorStop(1, '#343d44');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(w * 0.15, h); g.lineTo(w * 0.18, h * 0.2);
    g.arc(w * 0.5, h * 0.2, w * 0.32, Math.PI, 0);
    g.lineTo(w * 0.85, h);
    g.closePath();
    g.fill();
    glowOn(g, '#7dffd8', 10);
    g.fillStyle = '#7dffd8';
    g.font = '900 44px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(sym, w / 2, h * 0.32);
    g.fillRect(w * 0.3, h * 0.55, w * 0.4, 3);
    g.fillRect(w * 0.34, h * 0.63, w * 0.32, 3);
    glowOff(g);
  }));
  reg('wisp', 600, 1000, 90, 150, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.58, 3, w / 2, h * 0.58, w * 0.55);
    gr.addColorStop(0, 'rgba(160,255,225,.75)');
    gr.addColorStop(1, 'rgba(120,255,216,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,255,235,.9)';
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.12);
    g.quadraticCurveTo(w * 0.86, h * 0.5, w * 0.72, h * 0.74);
    g.quadraticCurveTo(w * 0.5, h * 0.92, w * 0.28, h * 0.74);
    g.quadraticCurveTo(w * 0.14, h * 0.5, w * 0.5, h * 0.12);
    g.fill();
    g.fillStyle = '#0c2a2a';
    ell(g, w * 0.4, h * 0.6, 5, 7); g.fill();
    ell(g, w * 0.6, h * 0.6, 5, 7); g.fill();
  });
  reg('charon', 2600, 1700, 300, 196, (g, w, h) => {
    const gg = g.createRadialGradient(w * 0.82, h * 0.3, 2, w * 0.82, h * 0.3, 60);
    gg.addColorStop(0, 'rgba(150,255,220,.8)');
    gg.addColorStop(1, 'rgba(150,255,220,0)');
    g.fillStyle = gg;
    g.fillRect(w * 0.55, 0, w * 0.45, h * 0.7);
    g.strokeStyle = '#3a444c';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(w * 0.62, h * 0.02); g.lineTo(w * 0.7, h * 0.95); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(w * 0.94, h * 0.56); g.lineTo(w * 0.82, h * 0.22); g.lineTo(w * 0.82, h * 0.3); g.stroke();
    g.fillStyle = '#0f1418';
    g.beginPath();
    g.moveTo(w * 0.02, h * 0.62);
    g.quadraticCurveTo(w * 0.5, h * 0.8, w * 0.98, h * 0.55);
    g.quadraticCurveTo(w * 0.9, h * 0.98, w * 0.5, h * 0.98);
    g.quadraticCurveTo(w * 0.1, h * 0.98, w * 0.02, h * 0.62);
    g.fill();
    g.fillStyle = '#161c22';
    g.beginPath();
    g.moveTo(w * 0.36, h * 0.72); g.lineTo(w * 0.42, h * 0.22);
    g.quadraticCurveTo(w * 0.47, h * 0.08, w * 0.52, h * 0.22);
    g.lineTo(w * 0.58, h * 0.72);
    g.closePath();
    g.fill();
    g.fillStyle = '#b6ffe6';
    ell(g, w * 0.82, h * 0.32, 7, 9); g.fill();
    ell(g, w * 0.455, h * 0.24, 2.5, 2.5); g.fill();
    ell(g, w * 0.495, h * 0.24, 2.5, 2.5); g.fill();
  });
  reg('skull', 2800, 2600, 300, 278, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#525d66');
    gr.addColorStop(1, '#2a3238');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(w * 0.14, h); g.lineTo(w * 0.1, h * 0.5);
    g.quadraticCurveTo(w * 0.1, h * 0.04, w * 0.5, h * 0.04);
    g.quadraticCurveTo(w * 0.9, h * 0.04, w * 0.9, h * 0.5);
    g.lineTo(w * 0.86, h);
    g.closePath();
    g.fill();
    g.fillStyle = '#0a0f12';
    ell(g, w * 0.33, h * 0.45, w * 0.12, h * 0.13); g.fill();
    ell(g, w * 0.67, h * 0.45, w * 0.12, h * 0.13); g.fill();
    g.beginPath(); g.moveTo(w * 0.5, h * 0.56); g.lineTo(w * 0.45, h * 0.7); g.lineTo(w * 0.55, h * 0.7); g.fill();
    g.fillRect(w * 0.27, h * 0.8, w * 0.46, h * 0.2);
    g.fillStyle = '#4a545c';
    for (let i = 0; i < 6; i++) g.fillRect(w * (0.285 + i * 0.075), h * 0.8, w * 0.055, h * 0.2);
    glowOn(g, '#7dffd8', 18);
    g.fillStyle = '#7dffd8';
    ell(g, w * 0.33, h * 0.47, 9, 9); g.fill();
    ell(g, w * 0.67, h * 0.47, 9, 9); g.fill();
    glowOff(g);
  });

  /* Olymp */
  reg('puff', 3000, 1300, 300, 130, (g, w, h) => {
    const parts = [[0.2, 0.62, 0.18, 0.3], [0.4, 0.42, 0.2, 0.38], [0.62, 0.48, 0.2, 0.36], [0.82, 0.66, 0.16, 0.26], [0.5, 0.78, 0.46, 0.2]];
    g.fillStyle = '#e2d6f0';
    for (const p of parts) { ell(g, w * p[0], h * p[1] + 6, w * p[2], h * p[3]); g.fill(); }
    g.fillStyle = '#ffffff';
    for (const p of parts) { ell(g, w * p[0], h * p[1], w * p[2], h * p[3]); g.fill(); }
  });
  reg('rod', 800, 3400, 110, 468, (g, w, h) => {
    const gg = g.createRadialGradient(w / 2, h * 0.06, 2, w / 2, h * 0.06, 50);
    gg.addColorStop(0, 'rgba(220,250,255,.95)');
    gg.addColorStop(1, 'rgba(120,220,255,0)');
    g.fillStyle = gg;
    g.fillRect(0, 0, w, h * 0.2);
    g.fillStyle = '#8a93b0';
    g.fillRect(w / 2 - 5, h * 0.06, 10, h * 0.94);
    g.fillStyle = '#ffd23d';
    for (const t of [0.2, 0.28, 0.36]) { rrect(g, w / 2 - 14, h * t, 28, 9, 4); g.fill(); }
    g.fillStyle = '#5a6078';
    g.fillRect(w / 2 - 16, h - 12, 32, 12);
    g.strokeStyle = '#eaffff';
    g.lineWidth = 3;
    g.lineJoin = 'bevel';
    g.beginPath(); g.moveTo(w * 0.5, h * 0.06); g.lineTo(w * 0.2, h * 0.02); g.lineTo(w * 0.32, h * 0.09); g.lineTo(w * 0.08, h * 0.1); g.stroke();
    g.beginPath(); g.moveTo(w * 0.5, h * 0.06); g.lineTo(w * 0.8, h * 0.03); g.lineTo(w * 0.7, h * 0.1); g.lineTo(w * 0.94, h * 0.12); g.stroke();
  });

  /* Tartaros */
  reg('hourglass', 2400, 4200, 240, 420, (g, w, h) => {
    g.fillStyle = '#b8873f';
    g.fillRect(w * 0.1, h * 0.02, w * 0.8, h * 0.06);
    g.fillRect(w * 0.1, h * 0.92, w * 0.8, h * 0.06);
    g.fillRect(w * 0.14, h * 0.08, 8, h * 0.84);
    g.fillRect(w * 0.86 - 8, h * 0.08, 8, h * 0.84);
    g.beginPath();
    g.moveTo(w * 0.22, h * 0.08); g.lineTo(w * 0.78, h * 0.08);
    g.quadraticCurveTo(w * 0.78, h * 0.36, w * 0.53, h * 0.5);
    g.quadraticCurveTo(w * 0.78, h * 0.64, w * 0.78, h * 0.92);
    g.lineTo(w * 0.22, h * 0.92);
    g.quadraticCurveTo(w * 0.22, h * 0.64, w * 0.47, h * 0.5);
    g.quadraticCurveTo(w * 0.22, h * 0.36, w * 0.22, h * 0.08);
    g.closePath();
    g.fillStyle = 'rgba(200,170,255,.22)';
    g.fill();
    g.strokeStyle = 'rgba(230,210,255,.8)';
    g.lineWidth = 3;
    g.stroke();
    glowOn(g, '#d0a0ff', 16);
    g.fillStyle = '#d0a0ff';
    g.beginPath(); g.moveTo(w * 0.3, h * 0.3); g.lineTo(w * 0.7, h * 0.3); g.lineTo(w * 0.53, h * 0.48); g.lineTo(w * 0.47, h * 0.48); g.closePath(); g.fill();
    g.fillRect(w * 0.49, h * 0.5, w * 0.02, h * 0.3);
    g.beginPath(); g.moveTo(w * 0.25, h * 0.92); g.quadraticCurveTo(w * 0.5, h * 0.66, w * 0.75, h * 0.92); g.closePath(); g.fill();
    glowOff(g);
  });

  /* Start/Ziel-Tor im Tempelstil */
  reg('archG', 5300, 3000, 1060, 600, (g, w, h) => {
    for (const x of [30, w - 110]) {
      const gr = g.createLinearGradient(x, 0, x + 80, 0);
      gr.addColorStop(0, '#f6f1e4');
      gr.addColorStop(1, '#c9c0aa');
      g.fillStyle = gr;
      g.fillRect(x, 200, 80, h - 200);
      g.strokeStyle = 'rgba(60,50,40,.18)';
      g.lineWidth = 2;
      for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + i * 16, 214); g.lineTo(x + i * 16, h - 24); g.stroke(); }
      g.fillStyle = '#f6f1e4';
      g.fillRect(x - 10, h - 24, 100, 24);
      g.fillRect(x - 10, 200, 100, 16);
      glowOn(g, '#19e3ff', 14);
      g.fillStyle = '#19e3ff';
      g.fillRect(x - 2, h - 200, 84, 8);
      glowOff(g);
    }
    g.fillStyle = '#d9d0b8';
    g.beginPath(); g.moveTo(8, 130); g.lineTo(w / 2, 8); g.lineTo(w - 8, 130); g.closePath(); g.fill();
    g.fillStyle = '#f6f1e4';
    g.beginPath(); g.moveTo(110, 122); g.lineTo(w / 2, 30); g.lineTo(w - 110, 122); g.closePath(); g.fill();
    glowOn(g, '#19e3ff', 14);
    g.fillStyle = '#19e3ff';
    g.font = '900 64px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('Ω', w / 2, 90);
    glowOff(g);
    g.fillStyle = '#0d1b45';
    g.fillRect(8, 130, w - 16, 72);
    const cs = 24;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        g.fillStyle = (i + j) % 2 ? '#ffffff' : '#10131c';
        g.fillRect(8 + i * cs, 130 + j * cs, cs, cs);
        g.fillRect(w - 8 - (i + 1) * cs, 130 + j * cs, cs, cs);
      }
    }
    g.fillStyle = '#ffffff';
    g.font = 'italic 900 50px "Arial Black", Impact, sans-serif';
    g.fillText('AGON  ·  START / ZIEL', w / 2, 168);
  });

  /* Götter-Fallen */
  reg('fxbolt', 1100, 5200, 110, 520, (g, w, h) => {
    const pts = [[0.5, 0], [0.3, 0.12], [0.62, 0.22], [0.36, 0.36], [0.7, 0.5], [0.4, 0.64], [0.64, 0.78], [0.5, 1]];
    g.lineJoin = 'bevel';
    glowOn(g, '#fff7a0', 18);
    g.strokeStyle = '#ffd23d';
    g.lineWidth = 14;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(w * p[0], h * p[1]) : g.moveTo(w * p[0], h * p[1]))); g.stroke();
    g.strokeStyle = '#fffbe0';
    g.lineWidth = 6;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(w * p[0], h * p[1]) : g.moveTo(w * p[0], h * p[1]))); g.stroke();
    glowOff(g);
  });
  reg('fxshade', 1200, 1800, 130, 195, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.6, 4, w / 2, h * 0.6, w * 0.6);
    gr.addColorStop(0, 'rgba(120,60,200,.6)');
    gr.addColorStop(1, 'rgba(60,20,120,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#12081f';
    g.beginPath();
    g.moveTo(w * 0.5, 0);
    g.quadraticCurveTo(w * 0.64, h * 0.26, w * 0.8, h * 0.3);
    g.quadraticCurveTo(w * 0.96, h * 0.7, w * 0.8, h);
    g.lineTo(w * 0.2, h);
    g.quadraticCurveTo(w * 0.04, h * 0.7, w * 0.22, h * 0.36);
    g.quadraticCurveTo(w * 0.4, h * 0.3, w * 0.5, 0);
    g.fill();
    glowOn(g, '#b06aff', 14);
    g.fillStyle = '#d0a0ff';
    ell(g, w * 0.38, h * 0.55, 8, 5); g.fill();
    ell(g, w * 0.62, h * 0.55, 8, 5); g.fill();
    glowOff(g);
  });
  reg('fxrift', 1500, 1900, 150, 190, (g, w, h) => {
    const cx = w / 2, cy = h * 0.5, r = w * 0.4;
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, w * 0.5);
    gr.addColorStop(0, 'rgba(208,160,255,.5)');
    gr.addColorStop(1, 'rgba(208,160,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    glowOn(g, '#d0a0ff', 16);
    g.strokeStyle = '#e8d0ff';
    g.lineWidth = 6;
    ell(g, cx, cy, r, r); g.stroke();
    g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); g.lineTo(cx + Math.cos(a) * r * 0.96, cy + Math.sin(a) * r * 0.96); g.stroke();
    }
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - r * 0.7); g.moveTo(cx, cy); g.lineTo(cx - r * 0.45, cy + r * 0.2); g.stroke();
    glowOff(g);
  });
}

/* ================= Himmel & Hintergründe je Thema ================= */

const THEMES = {
  city:       { sky: ['#0f5fd0', '#3f9ced', '#bfe6ff'], fog: '#cdeeff', sun: { x: 1010, y: 96, core: '255,255,240', glow: '255,245,200', r: 260 }, far: 'city', clouds: 'city' },
  hellasDay:  { sky: ['#1273d6', '#56b4f0', '#d6f1ff'], fog: '#d6f1ff', sun: { x: 300, y: 90, core: '255,255,235', glow: '255,240,190', r: 280 },
                far: { kind: 'hills', cols: ['#a9cdee', '#86b6dc', '#6fa0c8'], deco: '#5f8fb8', lit: '#fff6d0' }, clouds: { tint: '#ffffff', shade: 'rgba(150,195,235,.5)', n: 13 } },
  hellasDusk: { sky: ['#2c2470', '#d9607a', '#ffd9a0'], fog: '#ffd2a0', sun: { x: 330, y: 262, core: '255,245,210', glow: '255,170,90', r: 330 },
                far: { kind: 'hills', cols: ['#b06a8a', '#8a4f7a', '#6a3a68'], deco: '#55305a', lit: '#ffd27a' }, clouds: { tint: '#ffc9b0', shade: 'rgba(170,80,120,.5)', n: 11 } },
  canyon:     { sky: ['#24102e', '#b8402f', '#ffb070'], fog: '#e89a6a', sun: { x: 930, y: 250, core: '255,225,190', glow: '255,90,40', r: 300 },
                far: { kind: 'mesa', cols: ['#b05a3e', '#7f3528', '#5a2019'] }, clouds: { tint: '#6a3038', shade: 'rgba(40,10,20,.5)', n: 9, alpha: 0.75 } },
  night:      { sky: ['#050822', '#141f55', '#35468f'], fog: '#26346e', moon: { x: 990, y: 104, r: 44, col: '235,240,255' }, stars: 150,
                far: { kind: 'hills', cols: ['#1a245a', '#121a46', '#0c1234'], deco: '#090e2a', lit: '#ff3d81', palace: true }, clouds: { tint: '#2a3a7a', shade: 'rgba(5,8,30,.5)', n: 8, alpha: 0.7 } },
  underworld: { sky: ['#020308', '#0b1820', '#1f4a44'], fog: '#16332f', moon: { x: 300, y: 112, r: 30, col: '170,255,225' }, stars: 40,
                far: { kind: 'spikes', cols: ['#12262a', '#0c1a1e', '#081114'], glow: '#7dffd8' }, clouds: { tint: '#2f7a68', shade: 'rgba(0,0,0,.3)', n: 10, alpha: 0.35 } },
  olymp:      { sky: ['#2f6fe0', '#8fc8ff', '#fff3d0'], fog: '#fff1d6', sun: { x: 640, y: 130, core: '255,255,245', glow: '255,225,140', r: 400, rays: true },
                far: { kind: 'cloudsea', cols: ['#ffe2b8', '#fff0d6', '#ffffff'], deco: '#e8b84a' }, clouds: { tint: '#ffffff', shade: 'rgba(240,200,140,.5)', n: 16 } },
  void:       { sky: ['#04010c', '#2a0a4a', '#7a2a8a'], fog: '#3a1450', stars: 220, hourglass: true,
                far: { kind: 'ruins', cols: ['#3a155a', '#2a0f45', '#1a0830'], glow: '#d0a0ff' }, clouds: { tint: '#7a3aa8', shade: 'rgba(10,0,30,.4)', n: 9, alpha: 0.45 } },
};

const themeCache = {};

function tinyTemple(g, x, y, s, col, lit) {
  g.fillStyle = col;
  g.fillRect(x - s, y - s * 0.75, s * 2, s * 0.8);
  g.beginPath(); g.moveTo(x - s * 1.12, y - s * 0.75); g.lineTo(x, y - s * 1.35); g.lineTo(x + s * 1.12, y - s * 0.75); g.fill();
  g.fillStyle = lit;
  for (let i = 0; i < 4; i++) g.fillRect(x - s * 0.74 + i * s * 0.44, y - s * 0.62, s * 0.18, s * 0.6);
}

function buildFar(f) {
  if (f === 'city') return BG.city;
  return mk(2048, 330, (g, w, h) => {
    const R = mulberry32(31);
    const wave = (base, amp, seed) => {
      const RR = mulberry32(seed), ks = [1, 2, 3, 5, 8];
      const ph = ks.map(() => RR() * TAU);
      return x => {
        let y = base;
        for (let i = 0; i < ks.length; i++) y += Math.sin(x / w * TAU * ks[i] + ph[i]) * amp / (i + 1.2);
        return y;
      };
    };
    const tiled = (x, fn) => { for (const ox of [0, -w, w]) fn(x + ox); };

    if (f.kind === 'hills') {
      const layers = [wave(150, 55, 1), wave(92, 38, 2), wave(46, 22, 3)];
      layers.forEach((fn, li) => {
        g.fillStyle = f.cols[li];
        g.beginPath();
        g.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) g.lineTo(x, h - fn(x));
        g.lineTo(w, h);
        g.fill();
        if (li === 0) return;
        for (let i = 0; i < 10; i++) {
          const x = R() * w, k = R(), s = 14 + R() * 12;
          tiled(x, xx => {
            const y = h - fn(mod(xx, w)) + 3;
            if (k < 0.4) tinyTemple(g, xx, y, s, f.deco, f.lit);
            else {
              g.fillStyle = f.deco;
              ell(g, xx, y - s * 1.2, s * 0.3, s * 1.3);
              g.fill();
            }
          });
        }
      });
      if (f.palace) {
        const px = 620, py = h - 46;
        g.fillStyle = f.deco;
        g.fillRect(px - 190, py - 60, 380, 60);
        g.fillRect(px - 120, py - 104, 240, 46);
        g.fillRect(px - 50, py - 140, 100, 38);
        g.fillStyle = '#19e3ff';
        for (let i = 0; i < 12; i++) g.fillRect(px - 176 + i * 30, py - 44, 9, 20);
        g.fillStyle = f.lit;
        for (let i = 0; i < 7; i++) g.fillRect(px - 106 + i * 32, py - 92, 9, 20);
        g.fillRect(px - 30, py - 128, 60, 5);
      }
    } else if (f.kind === 'mesa') {
      [[170, 70], [110, 50], [56, 30]].forEach((cfg, li) => {
        const RR = mulberry32(50 + li);
        const pts = [];
        let x = 0;
        const first = cfg[0] * (0.5 + RR() * 0.6);
        let y = first;
        while (x < w - 90) {
          const step = 50 + RR() * 110;
          pts.push([x, y], [x + step * 0.82, y]);
          x += step;
          y = cfg[0] - cfg[1] + RR() * cfg[1] * 1.6;
        }
        pts.push([x, first], [w, first]);
        g.fillStyle = f.cols[li];
        g.beginPath();
        g.moveTo(0, h);
        for (const p of pts) g.lineTo(p[0], h - p[1]);
        g.lineTo(w, h);
        g.fill();
      });
    } else if (f.kind === 'spikes') {
      [[190, 90], [120, 60], [60, 34]].forEach((cfg, li) => {
        const RR = mulberry32(70 + li);
        g.fillStyle = f.cols[li];
        g.beginPath();
        g.moveTo(0, h);
        g.lineTo(0, h - 20);
        let x = 0;
        while (x < w - 60) {
          const step = 30 + RR() * 70;
          g.lineTo(x + step * 0.5, h - (cfg[0] - cfg[1] + RR() * cfg[1] * 1.5));
          g.lineTo(x + step, h - 16 - RR() * 20);
          x += step;
        }
        g.lineTo(w, h - 20);
        g.lineTo(w, h);
        g.fill();
      });
      const gl = g.createLinearGradient(0, h - 26, 0, h);
      gl.addColorStop(0, 'rgba(125,255,216,0)');
      gl.addColorStop(1, 'rgba(125,255,216,.55)');
      g.fillStyle = gl;
      g.fillRect(0, h - 26, w, 26);
    } else if (f.kind === 'cloudsea') {
      [[130, 0], [80, 1], [36, 2]].forEach(cfg => {
        const RR = mulberry32(90 + cfg[1]);
        if (cfg[1] === 1) {
          for (let i = 0; i < 7; i++) {
            const x = RR() * w, s = 18 + RR() * 16, y = h - 120 - RR() * 110;
            tiled(x, xx => {
              g.fillStyle = '#fff6e0';
              ell(g, xx, y + s * 0.3, s * 2.2, s * 0.6);
              g.fill();
              tinyTemple(g, xx, y, s, f.deco, '#fff6d0');
            });
          }
        }
        g.fillStyle = f.cols[cfg[1]];
        for (let i = 0; i < 26; i++) {
          const x = RR() * w, rx = 60 + RR() * 90, ry = 26 + RR() * 34;
          tiled(x, xx => { ell(g, xx, h - cfg[0] + ry * 0.4, rx, ry); g.fill(); });
        }
        g.fillRect(0, h - cfg[0] + 20, w, cfg[0]);
      });
    } else if (f.kind === 'ruins') {
      const RR = mulberry32(120);
      for (let li = 0; li < 3; li++) {
        g.fillStyle = f.cols[li];
        for (let i = 0; i < 16; i++) {
          const x = RR() * w, y = h - 20 - RR() * (230 - li * 60), bw = 14 + RR() * 22, bh = 40 + RR() * 110, tilt = (RR() - 0.5) * 0.9;
          tiled(x, xx => {
            g.save();
            g.translate(xx, y);
            g.rotate(tilt);
            g.fillRect(-bw / 2, -bh / 2, bw, bh);
            g.fillRect(-bw * 0.75, -bh / 2, bw * 1.5, 7);
            g.restore();
          });
        }
      }
      g.strokeStyle = 'rgba(208,160,255,.35)';
      g.lineWidth = 3;
      for (const c of [[380, 200, 120], [1300, 150, 170], [1800, 230, 90]]) {
        ell(g, c[0], h - c[1], c[2], c[2]);
        g.stroke();
        for (let i = 0; i < 12; i++) {
          const a = i * TAU / 12;
          g.beginPath();
          g.moveTo(c[0] + Math.cos(a) * c[2], h - c[1] + Math.sin(a) * c[2]);
          g.lineTo(c[0] + Math.cos(a) * (c[2] + 14), h - c[1] + Math.sin(a) * (c[2] + 14));
          g.stroke();
        }
      }
    }
  });
}

function buildSky(t) {
  return mk(W + 80, CY + 50, (g, w, h) => {
    const gr = g.createLinearGradient(0, 40, 0, h);
    gr.addColorStop(0, t.sky[0]);
    gr.addColorStop(0.5, t.sky[1]);
    gr.addColorStop(1, t.sky[2]);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    if (t.stars) {
      const R = mulberry32(5150);
      for (let i = 0; i < t.stars; i++) {
        const x = R() * w, y = R() * (h - 70), r = 0.6 + R() * 1.5;
        g.fillStyle = 'rgba(255,255,255,' + (0.35 + R() * 0.6).toFixed(2) + ')';
        ell(g, x, y, r, r);
        g.fill();
      }
    }
    if (t.sun) {
      const s = t.sun, sx = s.x + 40, sy = s.y + 40;
      if (s.rays) {
        g.fillStyle = 'rgba(' + s.glow + ',.16)';
        for (let i = 0; i < 16; i++) {
          const a = i * TAU / 16;
          g.beginPath();
          g.moveTo(sx, sy);
          g.lineTo(sx + Math.cos(a) * 900, sy + Math.sin(a) * 900);
          g.lineTo(sx + Math.cos(a + 0.12) * 900, sy + Math.sin(a + 0.12) * 900);
          g.fill();
        }
      }
      const sg = g.createRadialGradient(sx, sy, 10, sx, sy, s.r);
      sg.addColorStop(0, 'rgba(' + s.core + ',1)');
      sg.addColorStop(0.12, 'rgba(' + s.core + ',.9)');
      sg.addColorStop(0.3, 'rgba(' + s.glow + ',.3)');
      sg.addColorStop(1, 'rgba(' + s.glow + ',0)');
      g.fillStyle = sg;
      g.fillRect(0, 0, w, h);
    }
    if (t.moon) {
      const m = t.moon, mx = m.x + 40, my = m.y + 40;
      const mg = g.createRadialGradient(mx, my, m.r * 0.6, mx, my, m.r * 3.4);
      mg.addColorStop(0, 'rgba(' + m.col + ',.45)');
      mg.addColorStop(1, 'rgba(' + m.col + ',0)');
      g.fillStyle = mg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgb(' + m.col + ')';
      ell(g, mx, my, m.r, m.r);
      g.fill();
      g.fillStyle = 'rgba(0,0,40,.12)';
      ell(g, mx - m.r * 0.3, my - m.r * 0.2, m.r * 0.22, m.r * 0.22); g.fill();
      ell(g, mx + m.r * 0.25, my + m.r * 0.3, m.r * 0.16, m.r * 0.16); g.fill();
      ell(g, mx + m.r * 0.35, my - m.r * 0.4, m.r * 0.1, m.r * 0.1); g.fill();
    }
    if (t.hourglass) {
      const hg = SPR.hourglass.img;
      g.globalAlpha = 0.5;
      g.drawImage(hg, 640 + 40 - 90, 26, 180, 315);
      g.globalAlpha = 1;
    }
  });
}

function buildClouds(c) {
  if (!c) return null;
  if (c === 'city') return BG.clouds;
  return mk(2048, 300, (g, w) => {
    const R = mulberry32(17);
    g.globalAlpha = c.alpha || 1;
    for (let i = 0; i < c.n; i++) {
      const x = R() * w, y = 34 + R() * 190, s = 0.55 + R() * 1.1;
      for (const ox of [0, -w, w]) drawCloudT(g, x + ox, y, s, c.tint, c.shade);
    }
  });
}

function getTheme(name) {
  if (themeCache[name]) return themeCache[name];
  const t = THEMES[name] || THEMES.city;
  const rgb = hexRgb(t.fog);
  const th = {
    name,
    fog: t.fog,
    fogRgb: rgb[0] + ',' + rgb[1] + ',' + rgb[2],
    sky: buildSky(t),
    far: buildFar(t.far),
    clouds: buildClouds(t.clouds),
    colors: t.sky,
  };
  themeCache[name] = th;
  return th;
}

/* ================= Dialog-Porträts ================= */

const GREY_CURLS = ['#cfd3da', '#b9bec8', '#e6e9ee', '#a7adb8'];
const WHITE_CURLS = ['#f4f5f8', '#dfe2ea', '#ffffff', '#cdd1db'];
const BLOND_CURLS = ['#f3d36e', '#e6bd4f', '#f8e394', '#d9ab3d'];

function eyeNormal(g, x, col, big) {
  const rx = big ? 5.6 : 4.6, ry = big ? 4.6 : 3.2;
  g.fillStyle = '#ffffff';
  ell(g, x, -7, rx, ry); g.fill();
  g.fillStyle = col;
  ell(g, x + 0.4, -6.8, ry * 0.8, ry * 0.8); g.fill();
  g.fillStyle = '#111111';
  ell(g, x + 0.4, -6.8, ry * 0.38, ry * 0.38); g.fill();
  g.fillStyle = '#ffffff';
  ell(g, x + 1.5, -7.9, 0.9, 0.9); g.fill();
  g.strokeStyle = 'rgba(60,35,20,.8)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(x - rx, -7.4);
  g.quadraticCurveTo(x, -7 - ry - 0.9, x + rx, -7.4);
  g.stroke();
}

function shades(g, cracked) {
  g.strokeStyle = '#f5f7fa';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(-19.5, -7.5); g.lineTo(-22.5, -8.5);
  g.moveTo(19.5, -7.5); g.lineTo(22.5, -8.5);
  g.moveTo(-3, -8); g.lineTo(3, -8);
  g.stroke();
  for (const x of [-19, 3]) {
    const lg = g.createLinearGradient(0, -12.5, 0, -2);
    lg.addColorStop(0, cracked ? '#8fc9b0' : '#a5f7cb');
    lg.addColorStop(1, cracked ? '#2f7a5e' : '#3fc48e');
    rrect(g, x, -12.5, 16, 10.5, 2.6);
    g.globalAlpha = 0.92;
    g.fillStyle = lg;
    g.fill();
    g.globalAlpha = 1;
    g.lineWidth = 2.4;
    g.strokeStyle = cracked ? '#cfd3da' : '#f5f7fa';
    g.stroke();
    if (!cracked) {
      g.strokeStyle = 'rgba(255,255,255,.75)';
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x + 3, -4.5); g.lineTo(x + 7.5, -10.5); g.stroke();
    }
  }
  if (cracked) {
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-16, -12.5); g.lineTo(-11, -8); g.lineTo(-13.5, -5.5); g.lineTo(-8, -2);
    g.moveTo(-11, -8); g.lineTo(-5.5, -9.5);
    g.moveTo(15, -12.5); g.lineTo(11.5, -7); g.lineTo(14.5, -4.5);
    g.moveTo(11.5, -7); g.lineTo(6, -6);
    g.stroke();
    glowOn(g, '#d0a0ff', 8);
    g.fillStyle = '#e8d0ff';
    ell(g, -11, -7, 1.6, 1.6); g.fill();
    ell(g, 11, -7, 1.6, 1.6); g.fill();
    glowOff(g);
  }
}

function portraitCurls(g, cols, big) {
  g.fillStyle = cols[1];
  ell(g, 0, -24, 21 + (big ? 2 : 0), 14 + (big ? 2 : 0));
  g.fill();
  const R = mulberry32(5);
  for (let row = 2; row >= 0; row--) {
    const n = 9 - row * 2;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.06 + 0.88 * (i / (n - 1)));
      const px = Math.cos(a) * (20 + (big ? 2.5 : 0) - row * 2.8) + (R() - 0.5) * 2;
      const py = -13 + Math.sin(a) * (12 + (big ? 2.5 : 0) + row * 6.5) + (R() - 0.5) * 2;
      const r = 6.3 + (big ? 0.8 : 0) - row * 0.3;
      g.fillStyle = cols[(i + row * 2) % 4];
      ell(g, px, py, r, r);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)';
      g.lineWidth = 1.1;
      g.beginPath();
      g.arc(px, py, r * 0.55, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
  }
}

function portraitHead(g, c) {
  const skin = c.skin;
  const full = c.head === 'corinth';

  if (!full) {
    g.fillStyle = c.skin2 || skin;
    ell(g, -20, -5, 4, 6); g.fill();
    ell(g, 20, -5, 4, 6); g.fill();
  }
  g.fillStyle = skin;
  g.beginPath();
  g.moveTo(-19, -14);
  g.quadraticCurveTo(-20, 8, -11, 17);
  g.quadraticCurveTo(0, 24, 11, 17);
  g.quadraticCurveTo(20, 8, 19, -14);
  g.quadraticCurveTo(0, -30, -19, -14);
  g.fill();

  // Bart
  const b = c.beard;
  if (b && !full) {
    g.fillStyle = b.col;
    if (b.short) {
      g.beginPath();
      g.moveTo(-18.5, -0.2);
      g.quadraticCurveTo(-16.85, 11.15, -11, 17);
      g.quadraticCurveTo(0, 24, 11, 17);
      g.quadraticCurveTo(16.85, 11.15, 18.5, -0.2);
      g.quadraticCurveTo(17, 9, 11.5, 12.5);
      g.quadraticCurveTo(9.5, 8.5, 6.5, 7.2);
      g.quadraticCurveTo(0, 4.6, -6.5, 7.2);
      g.quadraticCurveTo(-9.5, 8.5, -11.5, 12.5);
      g.quadraticCurveTo(-17, 9, -18.5, -0.2);
      g.fill();
      g.fillStyle = skin;
      ell(g, 0, 11.6, 6.2, 3.1);
      g.fill();
    } else if (b.full) {
      const L = b.len || 0;
      g.beginPath();
      g.moveTo(-19.5, -2);
      g.quadraticCurveTo(-22, 20, 0, 30 + L);
      g.quadraticCurveTo(22, 20, 19.5, -2);
      g.quadraticCurveTo(13, 7, 7, 6);
      g.quadraticCurveTo(0, 3.5, -7, 6);
      g.quadraticCurveTo(-13, 7, -19.5, -2);
      g.fill();
      g.fillStyle = skin;
      ell(g, 0, 11.5, 6.5, 3.2);
      g.fill();
    } else {
      ell(g, 0, 17.5, 7, 3.2);
      g.fill();
    }
  }

  // Haare
  const hr = c.hair;
  let hairTop = null;          // Pony: wird nach den Brauen noch einmal gezeichnet, damit er sie verdeckt
  if (hr && !c.head || hr && (c.head === 'laurel' || c.head === 'crown')) {
    if (hr.kind === 'curls') portraitCurls(g, hr.cols, hr.big);
    else if (hr.kind === 'short') {                   // kurz, dunkel, vorn leicht hochgestellt
      g.fillStyle = hr.cols[0];
      g.beginPath();
      g.moveTo(-20.5, -7);
      g.quadraticCurveTo(-25, -27, -15.5, -33.5);
      g.quadraticCurveTo(-11, -39.5, -5, -36);
      g.quadraticCurveTo(0.5, -41, 6.5, -37);
      g.quadraticCurveTo(12.5, -40.5, 17, -34);
      g.quadraticCurveTo(24.5, -27, 20.5, -7);
      g.quadraticCurveTo(19, -15.5, 13, -17.5);
      g.quadraticCurveTo(2, -21.5, -10, -18);
      g.quadraticCurveTo(-18, -15.5, -20.5, -7);
      g.fill();
      g.strokeStyle = hr.cols[1];
      g.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const x = -13 + i * 6.4;
        g.beginPath();
        g.moveTo(x, -23 - (i % 2));
        g.quadraticCurveTo(x + 2.5, -30, x + 6.5, -34.5 + Math.abs(i - 2) * 0.8);
        g.stroke();
      }
    } else if (hr.kind === 'fringe') {                // halblang, Pony fällt schräg in die Stirn
      hairTop = () => {
      g.fillStyle = hr.cols[0];
      g.beginPath();
      g.moveTo(22.5, 0);
      g.quadraticCurveTo(27, -35, 2, -37.5);
      g.quadraticCurveTo(-26.5, -36.5, -22.5, 0);
      g.quadraticCurveTo(-21.5, -12, -19.5, -17.5);
      g.quadraticCurveTo(-8, -15.5, 6, -17.5);
      g.quadraticCurveTo(13, -18.5, 18, -13.5);
      g.quadraticCurveTo(21, -8, 22.5, 0);
      g.fill();
      g.strokeStyle = hr.cols[1];
      g.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(15 - i * 5.2, -32.5 + i * 0.5);
        g.quadraticCurveTo(7 - i * 5.6, -26, -2 - i * 4.2, -18.5 + (i > 2 ? (2 - i) * 0.4 : 0));
        g.stroke();
      }
      };
      hairTop();
    } else {
      g.fillStyle = hr.cols[0];
      g.beginPath();
      g.moveTo(-20.5, -9);
      g.quadraticCurveTo(-24, -35, 0, -36);
      g.quadraticCurveTo(24, -35, 20.5, -9);
      g.quadraticCurveTo(15, -21, 4, -20);
      g.quadraticCurveTo(-8, -19, -20.5, -9);
      g.fill();
      g.strokeStyle = hr.cols[1];
      g.lineWidth = 1.3;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 6, -34 + Math.abs(i) * 1.5);
        g.quadraticCurveTo(i * 7.5, -27, i * 8.5, -21);
        g.stroke();
      }
    }
  }

  if (c.old && !full) {
    g.strokeStyle = 'rgba(120,80,50,.4)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-9, -19.5); g.quadraticCurveTo(0, -21, 9, -19.5);
    g.moveTo(-7, -22.5); g.quadraticCurveTo(0, -23.8, 7, -22.5);
    g.moveTo(-15, 1); g.quadraticCurveTo(-13, 5, -14, 8);
    g.moveTo(15, 1); g.quadraticCurveTo(13, 5, 14, 8);
    g.stroke();
  }

  if (!full) {
    // Augenbrauen
    const stern = c.mouth === 'stern' || c.eyes === 'glow';
    const BROWS = { normal: [-15.5, -14.5], stern: [-17, -13.6], angry: [-18.8, -12.4], sad: [-13.6, -16.8], up: [-18.6, -17.8] };
    const bw = BROWS[c.brows || (stern ? 'stern' : 'normal')];
    g.strokeStyle = c.brow || '#5a3a22';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-17, bw[0]); g.lineTo(-6, bw[1]);
    g.moveTo(17, bw[0]); g.lineTo(6, bw[1]);
    g.stroke();
    if (hairTop) hairTop();

    // Augen
    if (c.eyes === 'shades') shades(g, false);
    else if (c.eyes === 'cracked') shades(g, true);
    else if (c.eyes === 'blind') {
      g.fillStyle = c.band || '#2a2f3a';
      g.beginPath();
      g.moveTo(-20.5, -12.5); g.lineTo(20.5, -12.5); g.lineTo(20, -3); g.lineTo(-20, -3);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.14)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-18, -9.5); g.lineTo(18, -10.2);
      g.moveTo(-18, -6); g.lineTo(18, -6.4);
      g.stroke();
      g.strokeStyle = c.band || '#2a2f3a';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(20, -8); g.quadraticCurveTo(27, -4, 25, 6);
      g.moveTo(20, -7); g.quadraticCurveTo(30, -8, 30, 2);
      g.stroke();
    } else if (c.eyes === 'glow') {
      glowOn(g, c.eyeCol, 9);
      g.fillStyle = c.eyeCol;
      ell(g, -9, -7, 4.8, 2.7); g.fill();
      ell(g, 9, -7, 4.8, 2.7); g.fill();
      g.fillStyle = '#ffffff';
      ell(g, -9, -7, 2.2, 1.2); g.fill();
      ell(g, 9, -7, 2.2, 1.2); g.fill();
      glowOff(g);
    } else {
      eyeNormal(g, -9, c.eyeCol || '#6b4a2f', c.eyes === 'big');
      eyeNormal(g, 9, c.eyeCol || '#6b4a2f', c.eyes === 'big');
    }

    if (c.glasses) {                                 // Brille mit durchsichtigem Rahmen
      for (const pass of [['rgba(110,100,92,.5)', 2.7], [c.glasses, 1.5]]) {
        g.strokeStyle = pass[0];
        g.lineWidth = pass[1];
        for (const x of [-16.5, 2.5]) {
          rrect(g, x, -13.2, 14, 11.6, 4.6);
          g.stroke();
        }
        g.beginPath();
        g.moveTo(-2.5, -8.6); g.quadraticCurveTo(0, -10.2, 2.5, -8.6);
        g.moveTo(-16.5, -9); g.lineTo(-20.5, -9.9);
        g.moveTo(16.5, -9); g.lineTo(20.5, -9.9);
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.13)';
      rrect(g, -16.5, -13.2, 14, 11.6, 4.6); g.fill();
      rrect(g, 2.5, -13.2, 14, 11.6, 4.6); g.fill();
    }

    // Nase
    g.strokeStyle = 'rgba(120,80,60,.6)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(1, 0);
    g.quadraticCurveTo(3.6, 4, 0, 5);
    g.stroke();

    // Mund
    g.strokeStyle = c.lip || '#a5594d';
    g.lineWidth = 2;
    g.beginPath();
    if (c.mouth === 'grin') {
      g.moveTo(-7, 9.5);
      g.quadraticCurveTo(0, 17.5, 7, 9.5);
      g.closePath();
      g.fillStyle = '#ffffff';
      g.fill();
      g.stroke();
    } else if (c.mouth === 'open') {
      g.fillStyle = '#5a2a2a';
      ell(g, 0, 12, 3.4, 2.8);
      g.fill();
    } else if (c.mouth === 'shout') {
      g.fillStyle = '#5a2a2a';
      ell(g, 0, 12.8, 5.4, 4.6);
      g.fill();
      g.fillStyle = '#ffffff';
      g.fillRect(-3.4, 9.2, 6.8, 1.7);
    } else if (c.mouth === 'sad') {
      g.moveTo(-5.5, 12.8); g.quadraticCurveTo(0, 10, 5.5, 12.8);
      g.stroke();
    } else if (c.mouth === 'stern') {
      g.moveTo(-6, 11.8); g.quadraticCurveTo(0, 10.8, 6, 11.8);
      g.stroke();
    } else {
      g.moveTo(-6, 10.5); g.quadraticCurveTo(1, 13.8, 7.5, 9.3);
      g.stroke();
    }
  }

  // Kopfbedeckung
  if (c.head === 'spartan' || c.head === 'corinth') {
    const hg = g.createLinearGradient(-22, 0, 22, 0);
    hg.addColorStop(0, c.headCol);
    hg.addColorStop(1, c.headCol2 || c.headCol);
    g.fillStyle = c.crestCol;
    g.beginPath();
    g.moveTo(-4.5, -35);
    g.quadraticCurveTo(-11, -50, -3.5, -57);
    g.quadraticCurveTo(0, -59.5, 3.5, -57);
    g.quadraticCurveTo(11, -50, 4.5, -35);
    g.closePath();
    g.fill();
    g.fillStyle = hg;
    g.beginPath();
    if (full) {
      g.moveTo(-21.5, 12);
      g.quadraticCurveTo(-26, -36, 0, -37);
      g.quadraticCurveTo(26, -36, 21.5, 12);
      g.quadraticCurveTo(12, 24, 0, 25);
      g.quadraticCurveTo(-12, 24, -21.5, 12);
    } else {
      g.moveTo(-21.5, 7);
      g.quadraticCurveTo(-25.5, -36, 0, -37);
      g.quadraticCurveTo(25.5, -36, 21.5, 7);
      g.lineTo(15, 4);
      g.quadraticCurveTo(17.5, -8, 13.5, -15);
      g.lineTo(2.3, -15); g.lineTo(2.3, -1.5); g.lineTo(-2.3, -1.5); g.lineTo(-2.3, -15);
      g.lineTo(-13.5, -15);
      g.quadraticCurveTo(-17.5, -8, -15, 4);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.3)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-15, -22); g.quadraticCurveTo(-8, -32, 2, -33.5);
    g.stroke();
    if (full) {
      g.fillStyle = '#07070a';
      g.beginPath();
      g.moveTo(-15, -12); g.lineTo(15, -12); g.lineTo(14, -4.5); g.lineTo(3, -4.5); g.lineTo(3, 14); g.lineTo(-3, 14); g.lineTo(-3, -4.5); g.lineTo(-14, -4.5);
      g.closePath();
      g.fill();
      glowOn(g, c.eyeCol, 10);
      g.fillStyle = c.eyeCol;
      ell(g, -8.5, -8.2, 3.6, 1.9); g.fill();
      ell(g, 8.5, -8.2, 3.6, 1.9); g.fill();
      glowOff(g);
    }
  } else if (c.head === 'wings') {
    g.fillStyle = '#ffffff';
    for (const sd of [-1, 1]) {
      g.beginPath();
      g.moveTo(sd * 19, -18);
      g.quadraticCurveTo(sd * 42, -42, sd * 31, -13);
      g.quadraticCurveTo(sd * 37, -15, sd * 28, -7);
      g.quadraticCurveTo(sd * 31, -5, sd * 20, -8);
      g.closePath();
      g.fill();
    }
    g.fillStyle = c.headCol;
    g.beginPath();
    g.moveTo(-21, -13);
    g.quadraticCurveTo(-23, -37, 0, -38);
    g.quadraticCurveTo(23, -37, 21, -13);
    g.closePath();
    g.fill();
    g.fillStyle = c.headCol2 || c.headCol;
    rrect(g, -24, -16, 48, 5, 2.4);
    g.fill();
  } else if (c.head === 'crown') {
    g.fillStyle = c.headCol;
    g.fillRect(-19, -25, 38, 5.5);
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(i * 8 - 4, -24.5); g.lineTo(i * 8, -38 + Math.abs(i) * 2.5); g.lineTo(i * 8 + 4, -24.5);
      g.fill();
    }
    glowOn(g, c.crestCol, 8);
    g.fillStyle = c.crestCol;
    for (let i = -1; i <= 1; i++) { ell(g, i * 8, -22.2, 1.7, 1.7); g.fill(); }
    glowOff(g);
  } else if (c.head === 'laurel') {
    g.fillStyle = c.headCol;
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (1.5 + sd * (0.12 + i * 0.075));
        const px = Math.cos(a) * 22, py = -11 + Math.sin(a) * 22;
        g.beginPath();
        g.ellipse(px, py, 5, 2.2, a + sd * 0.9, 0, TAU);
        g.fill();
      }
    }
  }
}

function drawPortrait(g, cx, cy, s, c) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  const gr = g.createLinearGradient(0, -50, 0, 50);
  gr.addColorStop(0, c.bg[0]);
  gr.addColorStop(1, c.bg[1]);
  ell(g, 0, 0, 49, 49);
  g.fillStyle = gr;
  g.fill();

  g.save();
  ell(g, 0, 0, 49, 49);
  g.clip();
  g.fillStyle = 'rgba(255,255,255,.1)';
  for (let i = 0; i < 9; i++) {
    const a = i * TAU / 9;
    g.beginPath();
    g.moveTo(0, 6);
    g.lineTo(Math.cos(a) * 90, 6 + Math.sin(a) * 90);
    g.lineTo(Math.cos(a + 0.22) * 90, 6 + Math.sin(a + 0.22) * 90);
    g.fill();
  }

  if (c.kind === 'mask') {
    // Pythia: holografische Theatermaske
    glowOn(g, '#39e0ff', 10);
    g.strokeStyle = '#7ff3ff';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-21, -22);
    g.quadraticCurveTo(-25, 10, -12, 26);
    g.quadraticCurveTo(0, 36, 12, 26);
    g.quadraticCurveTo(25, 10, 21, -22);
    g.quadraticCurveTo(0, -36, -21, -22);
    g.closePath();
    g.fillStyle = 'rgba(25,227,255,.16)';
    g.fill();
    g.stroke();
    g.fillStyle = '#eaffff';
    for (const sd of [-1, 1]) {
      g.beginPath();
      g.moveTo(sd * 4, -8);
      g.quadraticCurveTo(sd * 10, -15, sd * 17, -9);
      g.quadraticCurveTo(sd * 10, -4, sd * 4, -8);
      g.fill();
    }
    g.beginPath();
    g.moveTo(-10, 11);
    g.quadraticCurveTo(0, 16, 10, 11);
    g.quadraticCurveTo(0, 26, -10, 11);
    g.fill();
    glowOff(g);
    g.fillStyle = 'rgba(127,243,255,.22)';
    for (let y = -40; y < 44; y += 5) g.fillRect(-48, y, 96, 1.4);
  } else if (c.kind === 'hood') {
    // Die Moiren: Kapuze, Augen, Schere
    g.fillStyle = '#17131f';
    g.beginPath();
    g.moveTo(-34, 54);
    g.quadraticCurveTo(-36, -6, -18, -30);
    g.quadraticCurveTo(0, -46, 18, -30);
    g.quadraticCurveTo(36, -6, 34, 54);
    g.closePath();
    g.fill();
    g.fillStyle = '#050408';
    g.beginPath();
    g.moveTo(-16, 16);
    g.quadraticCurveTo(-20, -18, 0, -24);
    g.quadraticCurveTo(20, -18, 16, 16);
    g.quadraticCurveTo(0, 26, -16, 16);
    g.fill();
    glowOn(g, '#ffffff', 8);
    g.fillStyle = '#ffffff';
    for (const e of [[-7, -8], [7, -8], [-4, 0], [4, 0], [0, 8]]) { ell(g, e[0], e[1], 1.9, 1.2); g.fill(); }
    glowOff(g);
    g.strokeStyle = '#ffd23d';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-9, 26); g.lineTo(9, 42);
    g.moveTo(9, 26); g.lineTo(-9, 42);
    g.stroke();
    ell(g, -11, 44, 3, 3); g.stroke();
    ell(g, 11, 44, 3, 3); g.stroke();
  } else {
    if (c.ghost) g.globalAlpha = 0.8;
    if (c.hair && c.hair.long) {
      g.fillStyle = c.hair.cols[0];
      g.beginPath();
      g.moveTo(-24, -14);
      g.quadraticCurveTo(-31, 22, -23, 44);
      g.lineTo(23, 44);
      g.quadraticCurveTo(31, 22, 24, -14);
      g.quadraticCurveTo(0, -38, -24, -14);
      g.fill();
    }
    g.fillStyle = c.shirt;
    g.beginPath();
    g.moveTo(-47, 54);
    g.quadraticCurveTo(-43, 27, -15, 22);
    g.lineTo(15, 22);
    g.quadraticCurveTo(43, 27, 47, 54);
    g.closePath();
    g.fill();
    g.strokeStyle = c.trim || 'rgba(255,255,255,.14)';
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(0, 19, 11.5, 0.12 * Math.PI, 0.88 * Math.PI);
    g.stroke();
    g.fillStyle = c.skin2 || c.skin;
    rrect(g, -8, 9, 16, 19, 5);
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();

  if (!c.kind) {
    if (c.ghost) g.globalAlpha = 0.8;
    portraitHead(g, c);
    g.globalAlpha = 1;
  }

  ell(g, 0, 0, 49, 49);
  g.lineWidth = 3.4;
  g.strokeStyle = c.ring || '#ffffff';
  g.stroke();
  g.restore();
}
