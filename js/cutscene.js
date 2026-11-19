'use strict';

/* Zwischensequenzen im Visual-Novel-Stil:
   gemalte Szenenbilder, Event-Grafiken (CGs), Figuren als Standbilder mit Mimik und die Bühnen-Regie. */

/* ================= Zeichenhelfer ================= */

/* Zeichnet ein Kulissen-Sprite als Vektor in beliebiger Größe (cx = Mitte, by = Unterkante, hpx = Höhe in Pixeln) */
function stamp(g, name, cx, by, hpx, o) {
  const d = SPR[name];
  const k = hpx / d.ph;
  g.save();
  g.translate(cx, by - hpx / 2);
  if (o && o.rot) g.rotate(o.rot);
  g.scale((o && o.flip ? -1 : 1) * k, k);
  if (o && o.alpha != null) g.globalAlpha = o.alpha;
  g.translate(-d.pw / 2, -d.ph / 2);
  d.fn(g, d.pw, d.ph);
  g.restore();
}

function q4(g, x1, y1, x2, y2, x3, y3, x4, y4) {
  g.beginPath();
  g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4);
  g.closePath();
  g.fill();
}

function vignette(g, a) {
  const v = g.createRadialGradient(CX, 320, 260, CX, 320, 860);
  v.addColorStop(0, 'rgba(4,6,20,0)');
  v.addColorStop(1, 'rgba(4,6,20,' + a + ')');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}

/* ================= Szenenbilder ================= */

/* o: { track, zone | theme, ground }, horizon, floor ('tiles' | 'water' | 'cracks'), road, props: [name, x, Unterkante, Höhe, Optionen] */
function composeScene(o) {
  return mk(W, H, g => {
    const t = o.track ? trackById(o.track) : null;
    const th = getTheme(o.theme || t.theme);
    const z = t ? t.zones[o.zone || 0] : null;
    const hz = o.horizon || 350;
    const gy = hz + 8;

    // Himmel, Wolken, Ferne
    g.drawImage(th.sky, 40, 40, W, CY + 10, 0, 0, W, hz + 10);
    if (th.clouds) g.drawImage(th.clouds, o.cloudX || 260, 0, W, 300, 0, 6, W, 300);
    const fk = o.farScale || 1.2;
    g.drawImage(th.far, o.farX || 240, 0, W / fk, th.far.height, 0, gy - th.far.height * fk, W, th.far.height * fk);
    const hg = g.createLinearGradient(0, hz - 110, 0, gy);
    hg.addColorStop(0, 'rgba(' + th.fogRgb + ',0)');
    hg.addColorStop(1, 'rgba(' + th.fogRgb + ',1)');
    g.fillStyle = hg;
    g.fillRect(0, hz - 110, W, 120);

    // Boden
    const c1 = o.ground ? o.ground[0] : z.g1, c2 = o.ground ? o.ground[1] : z.g2;
    const gg = g.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, th.fog);
    gg.addColorStop(0.2, c1);
    gg.addColorStop(1, c2);
    g.fillStyle = gg;
    g.fillRect(0, gy, W, H - gy);

    const R = mulberry32(o.seed || 3);
    if (o.floor === 'tiles') {
      g.strokeStyle = o.line || 'rgba(0,0,0,.1)';
      g.lineWidth = 2;
      for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(CX + i * 22, gy); g.lineTo(CX + i * 300, H); g.stroke(); }
      for (let k = 1; k < 12; k++) {
        const y = gy + (H - gy) * Math.pow(k / 12, 2.2);
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
    } else if (o.floor === 'water') {
      for (let i = 0; i < 110; i++) {
        const d = Math.pow(R(), 1.6);
        g.fillStyle = 'rgba(255,255,255,' + (0.04 + R() * 0.12).toFixed(2) + ')';
        g.fillRect(R() * W, gy + 4 + (H - gy) * d, 20 + d * 240 * R(), 1.5 + d * 3);
      }
    } else if (o.floor === 'cracks') {
      g.lineCap = 'round';
      g.lineJoin = 'round';
      glowOn(g, '#ff5a1f', 14);
      g.strokeStyle = '#ff8a3c';
      for (let i = 0; i < 18; i++) {
        const d = 0.15 + R() * 0.85;
        let x = R() * W, y = gy + (H - gy) * d * d;
        g.lineWidth = 1 + d * d * 5;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 240 * d; y += (R() - 0.3) * 30 * d; g.lineTo(x, y); }
        g.stroke();
      }
      glowOff(g);
    }

    // Rennstrecke, die zum Horizont läuft
    if (o.road) {
      const yd1 = H - gy, k = 2.222;
      g.fillStyle = z.r1;
      g.beginPath(); g.moveTo(CX, gy); g.lineTo(CX + yd1 * k, H); g.lineTo(CX - yd1 * k, H); g.closePath(); g.fill();
      for (let i = 0; i < 26; i++) {
        const a = Math.pow(i / 26, 2.4) * yd1, b = Math.pow((i + 1) / 26, 2.4) * yd1;
        g.fillStyle = i % 2 ? z.rumB : '#f2f5f9';
        for (const sd of [-1, 1]) q4(g, CX + sd * a * k, gy + a, CX + sd * a * k * 1.075, gy + a, CX + sd * b * k * 1.075, gy + b, CX + sd * b * k, gy + b);
        if (i % 2 === 0) {
          g.fillStyle = 'rgba(240,246,252,.8)';
          for (const f of [-1 / 3, 1 / 3]) {
            q4(g, CX + f * a * k - a * 0.014, gy + a, CX + f * a * k + a * 0.014, gy + a, CX + f * b * k + b * 0.014, gy + b, CX + f * b * k - b * 0.014, gy + b);
          }
        }
      }
    }

    // Kulissen von hinten nach vorn, dazwischen Dunst für die Tiefe
    const props = (o.props || []).slice().sort((p, q) => (p[4] && p[4].air ? -1 : p[2]) - (q[4] && q[4].air ? -1 : q[2]));
    let hazed = false;
    const haze = () => {
      hazed = true;
      const hh = g.createLinearGradient(0, hz - 220, 0, gy + 120);
      hh.addColorStop(0, 'rgba(' + th.fogRgb + ',0)');
      hh.addColorStop(0.62, 'rgba(' + th.fogRgb + ',.5)');
      hh.addColorStop(1, 'rgba(' + th.fogRgb + ',0)');
      g.fillStyle = hh;
      g.fillRect(0, hz - 220, W, 348);
    };
    for (const p of props) {
      if (!hazed && !(p[4] && p[4].air) && p[2] > gy + 80) haze();
      stamp(g, p[0], p[1], p[2], p[3], p[4]);
    }
    if (!hazed) haze();
    if (o.tint) { g.fillStyle = o.tint; g.fillRect(0, 0, W, H); }
    vignette(g, o.vig == null ? 0.5 : o.vig);
  });
}

/* Kairons Werkstatt in Piräus */
function drawWorkshop(g, evening) {
  let gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, evening ? '#5c4238' : '#705744');
  gr.addColorStop(1, '#2a1e16');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,.13)';
  g.lineWidth = 2;
  for (let r = 0; r < 8; r++) {
    const y = 30 + r * 64;
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    for (let c = 0; c < 10; c++) {
      const x = (c + (r % 2) * 0.5) * 150;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke();
    }
  }

  // Rundbogenfenster mit Blick auf den Hafen
  const wx = 505, wy = 56, ww = 270, wh = 318;
  const arch = () => {
    g.beginPath();
    g.moveTo(wx, wy + wh);
    g.lineTo(wx, wy + ww / 2);
    g.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
    g.lineTo(wx + ww, wy + wh);
    g.closePath();
  };
  const th = getTheme(evening ? 'hellasDusk' : 'hellasDay');
  g.save();
  arch();
  g.clip();
  g.drawImage(th.sky, 200, 40, 620, 330, wx, wy, ww, wh * 0.74);
  if (th.clouds) g.drawImage(th.clouds, 400, 20, 500, 220, wx, wy + 8, ww, 120);
  g.drawImage(th.far, 300, 130, 460, 200, wx, wy + wh * 0.4, ww, wh * 0.36);
  g.fillStyle = evening ? '#8a4f7a' : '#2389d6';
  g.fillRect(wx, wy + wh * 0.74, ww, wh * 0.26);
  g.fillStyle = 'rgba(255,255,255,.28)';
  for (let i = 0; i < 9; i++) g.fillRect(wx + (20 + i * 67) % (ww - 40), wy + wh * 0.78 + (i * 17) % 60, 34, 2);
  stamp(g, 'ship', wx + 176, wy + wh * 0.92, 70);
  g.restore();
  arch();
  g.lineWidth = 16;
  g.strokeStyle = '#8f7358';
  g.stroke();
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(0,0,0,.22)';
  g.stroke();
  g.fillStyle = '#9a7d60';
  g.fillRect(wx - 22, wy + wh - 2, ww + 44, 18);

  // Lichtkegel vom Fenster
  g.fillStyle = evening ? 'rgba(255,160,90,.12)' : 'rgba(255,245,210,.11)';
  g.beginPath();
  g.moveTo(wx, wy + 40); g.lineTo(wx + ww, wy + 40); g.lineTo(wx + ww + 280, H); g.lineTo(wx - 280, H);
  g.closePath();
  g.fill();

  // Regal links: Amphoren, Rollen, Zahnräder – und eine Sanduhr
  for (const y of [190, 322]) {
    g.fillStyle = '#3a2616';
    g.fillRect(72, y + 13, 10, 28);
    g.fillRect(418, y + 13, 10, 28);
    g.fillStyle = '#4e351f';
    g.fillRect(50, y, 400, 13);
  }
  amphora(g, 112, 190, 1.0, '#c9703a');
  amphora(g, 186, 190, 0.76, '#b8602f');
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? '#e6d9b8' : '#d3c298';
    rrect(g, 226, 178 - i * 11, 70, 11, 5);
    g.fill();
  }
  const hgw = g.createRadialGradient(360, 130, 4, 360, 130, 120);
  hgw.addColorStop(0, 'rgba(208,160,255,.5)');
  hgw.addColorStop(1, 'rgba(208,160,255,0)');
  g.fillStyle = hgw;
  g.fillRect(240, 10, 240, 240);
  stamp(g, 'hourglass', 360, 190, 132);
  g.fillStyle = '#c98a3c';
  g.beginPath(); g.arc(122, 322, 36, Math.PI, 0); g.fill();
  g.fillStyle = '#ff3b3b';
  g.beginPath(); g.moveTo(112, 290); g.quadraticCurveTo(122, 262, 134, 290); g.closePath(); g.fill();
  g.strokeStyle = '#8a93a8';
  g.lineWidth = 7;
  for (const c of [[232, 290, 27], [282, 300, 19]]) {
    ell(g, c[0], c[1], c[2], c[2]);
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      g.beginPath();
      g.moveTo(c[0] + Math.cos(a) * c[2], c[1] + Math.sin(a) * c[2]);
      g.lineTo(c[0] + Math.cos(a) * (c[2] + 7), c[1] + Math.sin(a) * (c[2] + 7));
      g.stroke();
    }
  }
  amphora(g, 372, 322, 0.9, '#d98548');

  // Werkzeugwand rechts mit Ersatzbrett
  g.fillStyle = '#3e2c1c';
  rrect(g, 850, 96, 372, 244, 10);
  g.fill();
  g.fillStyle = '#8a6a3a';
  g.fillRect(905, 132, 10, 152);
  g.fillStyle = '#cfd3da';
  rrect(g, 882, 118, 56, 30, 5);
  g.fill();
  g.lineCap = 'round';
  g.strokeStyle = '#aab0bc';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(975, 284); g.lineTo(1000, 172); g.lineTo(990, 126);
  g.moveTo(1025, 284); g.lineTo(1000, 172); g.lineTo(1012, 126);
  g.stroke();
  g.strokeStyle = '#cfd3da';
  g.lineWidth = 9;
  g.beginPath(); g.moveTo(1066, 288); g.lineTo(1066, 156); g.stroke();
  g.lineWidth = 7;
  g.beginPath(); g.arc(1066, 138, 15, 0.25 * Math.PI, 1.75 * Math.PI); g.stroke();
  g.fillStyle = '#f5f7fb';
  rrect(g, 1124, 112, 62, 212, 30);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = '#12b89a';
  g.stroke();
  g.fillStyle = '#ff3d81';
  g.fillRect(1151, 136, 8, 164);

  // Hängelampe
  g.strokeStyle = '#2a1e16';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(250, 0); g.lineTo(250, 58); g.stroke();
  const lg = g.createRadialGradient(250, 78, 4, 250, 78, 190);
  lg.addColorStop(0, 'rgba(255,214,140,.55)');
  lg.addColorStop(1, 'rgba(255,214,140,0)');
  g.fillStyle = lg;
  g.fillRect(40, 0, 420, 290);
  g.fillStyle = '#b8873f';
  g.beginPath(); g.moveTo(222, 78); g.quadraticCurveTo(250, 40, 278, 78); g.closePath(); g.fill();
  g.fillStyle = '#fff3c8';
  ell(g, 250, 80, 15, 7);
  g.fill();

  // Werkbank mit dem Brett und dem Aether-Kern
  const cg = g.createRadialGradient(640, 432, 6, 640, 432, 280);
  cg.addColorStop(0, 'rgba(120,240,255,.6)');
  cg.addColorStop(1, 'rgba(120,240,255,0)');
  g.fillStyle = cg;
  g.fillRect(340, 150, 600, 570);
  g.fillStyle = '#8a6240';
  g.fillRect(0, 478, W, 70);
  g.fillStyle = '#a57850';
  g.fillRect(0, 478, W, 8);
  g.fillStyle = '#4a3220';
  g.fillRect(0, 548, W, H - 548);
  g.strokeStyle = 'rgba(0,0,0,.18)';
  g.lineWidth = 2;
  for (let x = 90; x < W; x += 190) { g.beginPath(); g.moveTo(x, 486); g.lineTo(x - 30, 548); g.stroke(); }
  g.fillStyle = 'rgba(94,242,255,.5)';
  ell(g, 640, 482, 260, 13);
  g.fill();
  g.fillStyle = '#f5f7fb';
  rrect(g, 396, 440, 488, 32, 16);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = '#12b89a';
  g.stroke();
  g.fillStyle = '#ff3d81';
  g.fillRect(440, 453, 400, 6);
  glowOn(g, '#39e0ff', 30);
  const kg = g.createRadialGradient(634, 432, 2, 640, 438, 26);
  kg.addColorStop(0, '#ffffff');
  kg.addColorStop(0.5, '#7dffd8');
  kg.addColorStop(1, '#11c6e8');
  g.fillStyle = kg;
  ell(g, 640, 438, 25, 25);
  g.fill();
  glowOff(g);
  g.lineWidth = 3;
  g.strokeStyle = '#ffffff';
  ell(g, 640, 438, 25, 25);
  g.stroke();

  if (evening) { g.fillStyle = 'rgba(255,140,80,.08)'; g.fillRect(0, 0, W, H); }
  vignette(g, 0.6);
}

/* Event-Grafik: der Lebensfaden – durchtrennt (cut) oder neu geknotet */
function drawCgThread(g, cut, trio) {
  const bgc = g.createRadialGradient(640, 330, 40, 640, 330, 780);
  bgc.addColorStop(0, cut ? '#4a0f1c' : '#1c2f6a');
  bgc.addColorStop(1, '#040208');
  g.fillStyle = bgc;
  g.fillRect(0, 0, W, H);

  // die Augen der Moiren im Dunkeln
  glowOn(g, '#ffffff', 12);
  g.fillStyle = 'rgba(255,255,255,.75)';
  for (const e of [[250, 124], [640, 84], [1030, 124]]) {
    ell(g, e[0] - 17, e[1], 6.5, 3.4); g.fill();
    ell(g, e[0] + 17, e[1], 6.5, 3.4); g.fill();
  }
  glowOff(g);

  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,210,90,.15)';
  g.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const y = 170 + i * 62;
    g.beginPath();
    g.moveTo(-20, y);
    g.bezierCurveTo(300, y - 50 + i * 9, 900, y + 60 - i * 11, 1300, y - 10);
    g.stroke();
  }

  glowOn(g, '#ffd23d', 24);
  g.strokeStyle = '#ffe9a0';
  g.lineWidth = 7;
  if (cut) {
    g.beginPath(); g.moveTo(-20, 300); g.bezierCurveTo(200, 250, 420, 300, 585, 335); g.quadraticCurveTo(602, 346, 596, 396); g.stroke();
    g.beginPath(); g.moveTo(1300, 320); g.bezierCurveTo(1080, 260, 880, 290, 700, 332); g.quadraticCurveTo(684, 344, 691, 404); g.stroke();
  } else {
    // ein Faden – oder der Schwurbund: drei Fäden (Toma, Robin, Jario) in einem Knoten
    const knot = (col, glow, d) => {
      glowOn(g, glow, 24);
      g.strokeStyle = col;
      g.beginPath();
      g.moveTo(-20, 300 + d * 2.3);
      g.bezierCurveTo(200, 250 + d * 1.9, 420, 300 + d, 600, 335 + d * 0.14);
      g.bezierCurveTo(710, 352 + d * 0.12, 706, 246 + d * 0.12, 640, 260 + d * 0.12);
      g.bezierCurveTo(574, 274 + d * 0.12, 588, 372 + d * 0.12, 690, 332 + d * 0.14);
      g.bezierCurveTo(880, 290 + d, 1080, 260 + d * 1.9, 1300, 320 + d * 2.3);
      g.stroke();
    };
    if (trio) {
      knot('#ffc48a', '#ff8a2b', -64);
      knot('#a8ccff', '#3f7ad8', 64);
      knot('#9dffe6', '#19c9a8', 0);
    } else knot('#ffe9a0', '#ffd23d', 0);
  }
  glowOff(g);

  const R = mulberry32(cut ? 4 : 9);
  if (cut) {
    g.save();
    g.translate(642, 404);
    for (const sd of [-1, 1]) {
      g.save();
      g.rotate(sd * 0.3);
      const bl = g.createLinearGradient(-14, 0, 14, 0);
      bl.addColorStop(0, '#f4f5f8');
      bl.addColorStop(1, '#8a93a8');
      g.fillStyle = bl;
      g.beginPath(); g.moveTo(-9, 20); g.lineTo(0, -214); g.lineTo(11, 20); g.closePath(); g.fill();
      g.strokeStyle = '#ffd23d';
      g.lineWidth = 10;
      g.beginPath(); g.moveTo(1, 20); g.lineTo(sd * -14, 120); g.stroke();
      ell(g, sd * -22, 160, 30, 42);
      g.stroke();
      g.restore();
    }
    g.fillStyle = '#ffd23d';
    ell(g, 0, 8, 9, 9);
    g.fill();
    g.restore();
    g.fillStyle = '#fff3c8';
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = 20 + R() * 120, r = 1 + R() * 3;
      ell(g, 642 + Math.cos(a) * d, 350 + Math.sin(a) * d * 0.6, r, r);
      g.fill();
    }
  } else {
    glowOn(g, '#fff3c8', 10);
    g.fillStyle = '#fff3c8';
    for (let i = 0; i < 34; i++) {
      const a = R() * TAU, d = 40 + R() * 210, r = 1 + R() * 3.4;
      ell(g, 640 + Math.cos(a) * d, 306 + Math.sin(a) * d * 0.55, r, r);
      g.fill();
    }
    glowOff(g);
  }
  vignette(g, 0.65);
}

/* Event-Grafik: Kairon ohne Augenbinde – darunter der leuchtende Sand */
function drawCgReveal(g) {
  const bgc = g.createRadialGradient(640, 300, 60, 640, 300, 800);
  bgc.addColorStop(0, '#4a1a80');
  bgc.addColorStop(1, '#05020c');
  g.fillStyle = bgc;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(208,160,255,.08)';
  for (let i = 0; i < 14; i++) {
    const a = i * TAU / 14;
    g.beginPath();
    g.moveTo(640, 300);
    g.lineTo(640 + Math.cos(a) * 1200, 300 + Math.sin(a) * 1200);
    g.lineTo(640 + Math.cos(a + 0.13) * 1200, 300 + Math.sin(a + 0.13) * 1200);
    g.fill();
  }
  g.save();
  g.translate(640, 318);
  g.scale(8.4, 8.4);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  portraitHead(g, CAST.kaironR.spec);
  g.restore();
  // die gelöste Augenbinde
  g.strokeStyle = '#2a2f3a';
  g.lineWidth = 34;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(820, 250);
  g.bezierCurveTo(960, 250, 1020, 420, 1150, 560);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.1)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(826, 244);
  g.bezierCurveTo(966, 244, 1030, 414, 1160, 552);
  g.stroke();
  // Schatten auf einer Gesichtshälfte
  const sh = g.createLinearGradient(330, 0, 700, 0);
  sh.addColorStop(0, 'rgba(5,2,12,.82)');
  sh.addColorStop(1, 'rgba(5,2,12,0)');
  g.fillStyle = sh;
  g.fillRect(0, 0, 700, H);
  vignette(g, 0.7);
}

/* Event-Grafik: die Sanduhr – im Licht (bench = false) oder auf der Werkbank neben Kairons Augenbinde */
function drawCgHourglass(g, bench) {
  const bgc = g.createRadialGradient(640, 280, 40, 640, 280, 800);
  bgc.addColorStop(0, bench ? '#6a4a30' : '#5a2aa0');
  bgc.addColorStop(1, bench ? '#0f0a06' : '#05020c');
  g.fillStyle = bgc;
  g.fillRect(0, 0, W, H);
  if (bench) {
    g.fillStyle = 'rgba(255,220,160,.1)';
    g.beginPath(); g.moveTo(900, 0); g.lineTo(1180, 0); g.lineTo(760, H); g.lineTo(240, H); g.closePath(); g.fill();
    const wg = g.createLinearGradient(0, 452, 0, H);
    wg.addColorStop(0, '#8a6240');
    wg.addColorStop(1, '#3a2616');
    g.fillStyle = wg;
    g.fillRect(0, 452, W, H - 452);
    g.fillStyle = '#a57850';
    g.fillRect(0, 452, W, 7);
    g.strokeStyle = 'rgba(0,0,0,.2)';
    g.lineWidth = 2;
    for (let x = 60; x < W + 200; x += 210) { g.beginPath(); g.moveTo(x, 459); g.lineTo(x - 120, H); g.stroke(); }
  } else {
    g.fillStyle = 'rgba(255,225,150,.09)';
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16;
      g.beginPath();
      g.moveTo(640, 280);
      g.lineTo(640 + Math.cos(a) * 1200, 280 + Math.sin(a) * 1200);
      g.lineTo(640 + Math.cos(a + 0.12) * 1200, 280 + Math.sin(a + 0.12) * 1200);
      g.fill();
    }
  }
  const gl = g.createRadialGradient(640, 280, 10, 640, 280, 330);
  gl.addColorStop(0, 'rgba(208,160,255,.55)');
  gl.addColorStop(1, 'rgba(208,160,255,0)');
  g.fillStyle = gl;
  g.fillRect(280, 0, 720, 640);
  if (bench) {
    g.fillStyle = 'rgba(0,0,0,.35)';
    ell(g, 640, 470, 130, 16);
    g.fill();
  }
  stamp(g, 'hourglass', 640, bench ? 474 : 492, bench ? 396 : 440);
  if (bench) {
    g.fillStyle = 'rgba(0,0,0,.3)';
    ell(g, 912, 474, 96, 10);
    g.fill();
    g.lineCap = 'round';
    g.strokeStyle = '#2a2f3a';
    g.lineWidth = 24;
    g.beginPath();
    g.moveTo(820, 488);
    g.bezierCurveTo(876, 458, 944, 508, 1006, 478);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.14)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(824, 482);
    g.bezierCurveTo(880, 452, 946, 502, 1004, 472);
    g.stroke();
  }
  const R = mulberry32(21);
  g.fillStyle = 'rgba(255,240,210,.5)';
  for (let i = 0; i < 40; i++) {
    const r = 0.8 + R() * 2.2;
    ell(g, R() * W, R() * 460, r, r);
    g.fill();
  }
  vignette(g, 0.65);
}

const SCENES = {
  neosky: { label: 'Neo-Skyline · Freitagnacht', make: () => composeScene({
    track: 'sky', zone: 0, road: true, tint: 'rgba(10,12,48,.46)', props: [
      ['tower2', 300, 384, 250], ['tower4', 965, 386, 270], ['tower1', 520, 392, 180], ['tower5', 775, 392, 200],
      ['tower3', 120, 404, 330], ['tower1', 1160, 404, 340], ['bb2', 420, 430, 150], ['palm', 870, 436, 150],
      ['lamp', 500, 452, 190], ['lamp', 780, 452, 190, { flip: true }], ['tower4', 30, 470, 520], ['tower2', 1250, 476, 540],
      ['lamp', 330, 500, 330], ['lamp', 950, 500, 330, { flip: true }], ['bb3', 1090, 520, 300],
    ] }) },
  hellas: { make: () => composeScene({
    track: 'piraeus', zone: 1, floor: 'water', horizon: 400, vig: 0.4, props: [
      ['temple', 640, 414, 150], ['ship', 770, 432, 58], ['ship', 300, 452, 112], ['statue', 1030, 476, 390],
      ['col', 96, 700, 590], ['col', 232, 520, 300], ['col', 1210, 640, 480], ['ship', 520, 612, 230, { flip: true }],
    ] }) },
  workshop: { label: 'Piräus · Die erloschene Schmiede', make: () => mk(W, H, g => drawWorkshop(g, false)) },
  workshop_end: { label: 'Piräus · Kairons alte Werkstatt', make: () => mk(W, H, g => drawWorkshop(g, true)) },
  piraeus: { label: 'Hafen von Piräus · Startlinie', make: () => composeScene({
    track: 'piraeus', zone: 0, road: true, props: [
      ['ship', 240, 374, 60], ['house', 380, 402, 80], ['house', 900, 400, 76], ['archG', 640, 444, 290],
      ['col', 470, 402, 110], ['col', 810, 402, 110], ['brazier', 520, 412, 70], ['brazier', 760, 412, 70],
      ['gb2', 1010, 402, 120], ['house', 150, 432, 150], ['house', 1120, 428, 140], ['col', 395, 428, 170], ['col', 885, 428, 170],
      ['brazier', 330, 452, 150], ['brazier', 950, 452, 150], ['col', 250, 474, 290], ['col', 1030, 474, 290],
      ['house', 60, 504, 260], ['house', 1230, 514, 280],
    ] }) },
  akropolis: { label: 'Athen · Akropolis', make: () => composeScene({
    track: 'akropolis', zone: 2, floor: 'tiles', props: [
      ['cypress', 520, 382, 90], ['cypress', 770, 382, 90], ['temple2', 170, 398, 170], ['temple', 1130, 394, 150], ['olive', 1010, 402, 110],
      ['temple', 640, 424, 330], ['cypress', 60, 424, 240], ['cypress', 1225, 422, 230], ['statue', 395, 444, 300], ['statue', 885, 444, 300],
      ['brazier', 500, 448, 130], ['brazier', 780, 448, 130], ['col', 300, 474, 330], ['col', 980, 474, 330], ['col', 120, 564, 560], ['col', 1160, 564, 560],
    ] }) },
  thermo: { label: 'Thermopylen · Schmiede des Hephaistos', make: () => composeScene({
    track: 'thermo', zone: 1, floor: 'cracks', props: [
      ['rock', 760, 374, 130], ['rock2', 1000, 378, 150], ['rock', 250, 382, 190], ['forge', 640, 404, 300],
      ['forge', 420, 424, 380, { flip: true }], ['forge', 900, 428, 400], ['brazierF', 540, 452, 150], ['brazierF', 750, 452, 150],
      ['spears', 330, 474, 150], ['spears', 965, 474, 150], ['forge', 150, 474, 560], ['forge', 1150, 484, 600, { flip: true }],
    ] }) },
  knossos: { label: 'Kreta · Labyrinth von Knossos', make: () => composeScene({
    track: 'knossos', zone: 1, floor: 'tiles', line: 'rgba(25,227,255,.14)', props: [
      ['wall', 640, 370, 60], ['wall', 480, 374, 70], ['wall', 800, 374, 70], ['wall', 250, 402, 120], ['wall', 1030, 402, 120],
      ['bull', 640, 434, 260], ['mcol', 500, 444, 220], ['mcol', 780, 444, 220], ['wall', 120, 454, 230], ['wall', 1160, 454, 230],
      ['brazier', 420, 474, 170], ['brazier', 860, 474, 170], ['wall', -40, 564, 480], ['wall', 1320, 564, 480],
    ] }) },
  styx: { label: 'Unterwelt · Ufer des Styx', make: () => composeScene({
    track: 'styx', zone: 1, floor: 'water', horizon: 360, props: [
      ['wisp', 560, 384, 50], ['stele1', 520, 398, 60], ['stele2', 800, 400, 66], ['skull', 1080, 400, 120], ['dead', 900, 408, 180],
      ['dead', 440, 414, 200], ['skull', 250, 424, 230], ['wisp', 740, 424, 70], ['stele3', 370, 444, 120], ['wisp', 1000, 444, 80],
      ['dcol', 960, 454, 190], ['charon', 660, 474, 150], ['dead', 80, 474, 380], ['brazierG', 380, 484, 200],
      ['dead', 1210, 484, 420, { flip: true }], ['wisp', 480, 504, 110], ['wisp', 300, 524, 90], ['wisp', 850, 524, 120],
    ] }) },
  olymp: { label: 'Olymp · Thron des Königs', make: () => composeScene({
    track: 'olymp', zone: 1, floor: 'tiles', line: 'rgba(160,110,20,.14)', props: [
      ['puff', 560, 374, 34], ['puff', 760, 376, 30], ['puff', 1180, 398, 64], ['puff', 100, 402, 70],
      ['gcol', 450, 422, 200], ['gcol', 830, 422, 200], ['gtemple', 640, 428, 350], ['gstatue', 240, 444, 300], ['gstatue', 1040, 444, 300],
      ['brazier', 540, 452, 130], ['brazier', 740, 452, 130], ['gcol', 330, 464, 320], ['gcol', 950, 464, 320],
      ['gcol', 150, 564, 580], ['gcol', 1130, 564, 580], ['puff', 40, 704, 220], ['puff', 1240, 704, 220],
    ] }) },
  tartaros: { label: 'Tartaros · Jenseits der Zeit', make: () => composeScene({
    theme: 'void', ground: ['#3a1a5a', '#12061f'], floor: 'tiles', line: 'rgba(208,160,255,.16)', horizon: 360, props: [
      ['col', 520, 250, 150, { rot: 0.5, air: true }], ['gcol', 790, 210, 130, { rot: -0.7, air: true }], ['house', 360, 190, 90, { rot: 0.3, air: true }],
      ['amph', 905, 300, 60, { rot: 1, air: true }], ['stele2', 610, 150, 70, { rot: -0.4, air: true }], ['wall', 1090, 220, 110, { rot: 0.25, air: true }],
      ['skull', 500, 404, 90], ['gcol', 820, 404, 150], ['house', 200, 414, 120], ['wall', 1090, 424, 150], ['colb', 380, 434, 150],
      ['dcol', 900, 444, 160], ['hourglass', 640, 454, 400], ['dead', 1010, 474, 260], ['col', 260, 484, 330],
    ] }) },
  cg_snip: { cg: true, make: () => mk(W, H, g => drawCgThread(g, true)) },
  cg_knot: { cg: true, make: () => mk(W, H, g => drawCgThread(g, false)) },
  cg_bund: { cg: true, make: () => mk(W, H, g => drawCgThread(g, false, true)) },
  cg_reveal: { cg: true, make: () => mk(W, H, drawCgReveal) },
  cg_sand: { cg: true, make: () => mk(W, H, g => drawCgHourglass(g, false)) },
  cg_hourglass: { cg: true, make: () => mk(W, H, g => drawCgHourglass(g, true)) },
};

/* ================= Figuren (Standbilder) ================= */

const TOMA_SPEC = {
  skin: '#f4cba4', skin2: '#eec19a', hair: { kind: 'curls', cols: BLOND_CURLS },
  beard: { col: 'rgba(150,110,70,.3)' }, brow: '#b98f3a', eyes: 'shades', mouth: 'smirk',
};

/* Mimik: überschreibt Mund und Brauen der Figur */
const EXPR = {
  angry: { mouth: 'shout', brows: 'angry' },
  shock: { mouth: 'open', brows: 'up' },
  sad:   { mouth: 'sad', brows: 'sad' },
  smile: { mouth: 'grin', brows: 'normal' },
  stern: { mouth: 'stern', brows: 'stern' },
};

/* who = dieselbe Person (Kostümwechsel statt Auf-/Abtritt), slot = Bühnenseite */
const BUST = {
  toma:    { who: 'toma', slot: 'left', spec: () => TOMA_SPEC, outfit: { kind: 'tee', body: '#17181d', sleeve: 24 } },
  robin:   { who: 'robin', slot: 'm1', size: 1.03, spec: () => CAST.robin.spec, outfit: { kind: 'tee', body: '#a6a8ab', sleeve: 26, pocket: true, neck: '#8a8c90', plain: true, w: 1.1 } },
  jario:   { who: 'jario', slot: 'm2', spec: () => CAST.jario.spec, outfit: { kind: 'hoodie', body: '#20263f', arm: '#20263f', hood: '#151a2c', zip: '#f2f5f9', plain: true, w: 0.93 } },
  martin:  { who: 'martin', spec: () => CAST.martin.spec, outfit: { kind: 'halfzip', body: '#bfc2c6', arm: '#bfc2c6', collar2: '#adb0b5', zip: '#8b8e94', tee: '#f6f7f9', w: 1.04 } },
  mila:    { who: 'mila', size: 0.78, spec: () => CAST.mila.spec, outfit: { kind: 'chiton', body: '#ff8fc2', trim: '#ffd23d' } },
  kairon:  { who: 'kairon', size: 0.98, ghost: true, spec: () => CAST.kairon.spec, outfit: { kind: 'apron', body: '#6a5038', apron: '#3a2a1e', bracer: '#3a2a1e' } },
  kaironR: { who: 'kairon', size: 1.02, ghost: true, spec: () => CAST.kaironR.spec, outfit: { kind: 'armor', body: '#2a2038', plate: '#6a5a8c', plate2: '#2a2038', cape: '#1a1228', bracer: '#6a5a8c', lines: '#e8c877', arm: '#2a2038', glow: '232,200,119' } },
  kronos:  { who: 'kronos', size: 1.1, spec: () => CAST.kronos.spec, outfit: { kind: 'robe', body: '#2a2038', trim: '#e8c877', cape: '#1a1228', collar: '#1a1228', glow: '208,160,255' } },
  xanthe:  { who: 'xanthe', size: 0.97, spec: () => CAST.xanthe.spec, outfit: { kind: 'chiton', body: '#e6b422', trim: '#fff6d6' } },
  theron:  { who: 'theron', size: 1.08, spec: () => CAST.theron.spec, outfit: { kind: 'armor', body: '#236238', plate: '#b8873f', plate2: '#7a5626', cape: '#3f9a5a', bracer: '#b8873f', w: 1.1 } },
  kassia:  { who: 'kassia', spec: () => CAST.kassia.spec, outfit: { kind: 'armor', body: '#8a1f1f', plate: '#d9a04e', plate2: '#a8742c', cape: '#a3202a', bracer: '#d9a04e' } },
  phaidon: { who: 'phaidon', size: 0.9, spec: () => CAST.phaidon.spec, outfit: { kind: 'chiton', body: '#3f7ad8', trim: '#f2f5f9' } },
  theronG: { who: 'theronG', size: 1.08, ghost: true, spec: () => CAST.theronG.spec, outfit: { kind: 'armor', body: '#235a50', plate: '#6fbfae', plate2: '#3f8f80', cape: '#1a4a40', bracer: '#6fbfae', glow: '125,255,216', w: 1.1 } },
  pythia:  { who: 'pythia', custom: true, flicker: true },
  ares:    { who: 'ares', size: 1.12, spec: () => CAST.ares.spec, outfit: { kind: 'armor', body: '#3a0a0a', plate: '#3a3a42', plate2: '#17171c', cape: '#8a1414', bracer: '#3a3a42', lines: '#ff2a2a', arm: '#2a2022', glow: '255,60,40' } },
  hermes:  { who: 'hermes', spec: () => CAST.hermes.spec, outfit: { kind: 'chiton', body: '#f5f0dc', trim: '#ffd23d', glow: '255,220,90' } },
  hades:   { who: 'hades', size: 1.1, spec: () => CAST.hades.spec, outfit: { kind: 'robe', body: '#1a1426', trim: '#b06aff', cape: '#0c0a16', collar: '#0c0a16', glow: '160,90,255' } },
  zeus:    { who: 'zeus', size: 1.15, spec: () => CAST.zeus.spec, outfit: { kind: 'robe', body: '#f7f9ff', trim: '#ffd23d', cape: '#dfe6fa', fold: 'rgba(110,125,170,.3)', glow: '140,200,255' } },
};

/* Oberkörper + Kopf; (cx, cy) = Gesichtsmitte, c = Porträt-Daten, o = Kleidung */
function drawBust(g, cx, cy, s, c, o) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.save();
  g.scale(o.w || 1, 1);                              // Statur: breiter oder schmaler

  if (o.glow) {
    // Aura – bleibt innerhalb der Sprite-Fläche, damit kein Rand sichtbar wird
    const ag = g.createRadialGradient(0, 24, 8, 0, 24, 86);
    ag.addColorStop(0, 'rgba(' + o.glow + ',.5)');
    ag.addColorStop(1, 'rgba(' + o.glow + ',0)');
    g.fillStyle = ag;
    g.fillRect(-90, -64, 180, 180);
  }
  if (o.cape) {
    g.fillStyle = o.cape;
    g.beginPath();
    g.moveTo(-40, 26);
    g.quadraticCurveTo(-68, 90, -62, 200);
    g.lineTo(62, 200);
    g.quadraticCurveTo(68, 90, 40, 26);
    g.closePath();
    g.fill();
  }
  if (c.hair && c.hair.long) {
    g.fillStyle = c.hair.cols[0];
    g.beginPath();
    g.moveTo(-24, -14);
    g.quadraticCurveTo(-32, 24, -25, 62);
    g.lineTo(25, 62);
    g.quadraticCurveTo(32, 24, 24, -14);
    g.quadraticCurveTo(0, -38, -24, -14);
    g.fill();
  }
  if (o.hood) {
    g.fillStyle = o.hood;
    g.beginPath();
    g.moveTo(-35, 38);
    g.quadraticCurveTo(-34, 3, -17, -4);
    g.lineTo(17, -4);
    g.quadraticCurveTo(34, 3, 35, 38);
    g.closePath();
    g.fill();
  }
  if (o.collar) {
    g.fillStyle = o.collar;
    for (const sd of [-1, 1]) {
      g.beginPath(); g.moveTo(sd * 8, 26); g.lineTo(sd * 27, -4); g.lineTo(sd * 33, 34); g.closePath(); g.fill();
    }
  }

  // Arme
  for (const sd of [-1, 1]) {
    g.fillStyle = o.arm || c.skin;
    g.beginPath();
    g.moveTo(sd * 40, 30);
    g.quadraticCurveTo(sd * 59, 40, sd * 58, 80);
    g.lineTo(sd * 55, 200);
    g.lineTo(sd * 36, 200);
    g.lineTo(sd * 34, 60);
    g.closePath();
    g.fill();
    if (o.sleeve) {
      g.fillStyle = o.body;
      g.beginPath();
      g.moveTo(sd * 38, 27);
      g.quadraticCurveTo(sd * 61, 37, sd * 60, 40 + o.sleeve);
      g.lineTo(sd * 34, 46 + o.sleeve);
      g.closePath();
      g.fill();
    }
    if (o.bracer) {
      g.fillStyle = o.bracer;
      g.fillRect(sd > 0 ? 36 : -56, 132, 20, 34);
    }
  }

  // Rumpf
  const torso = () => {
    g.beginPath();
    g.moveTo(-15, 22);
    g.quadraticCurveTo(-43, 26, -46, 46);
    g.lineTo(-38, 200);
    g.lineTo(38, 200);
    g.lineTo(46, 46);
    g.quadraticCurveTo(43, 26, 15, 22);
    g.closePath();
  };
  torso();
  g.fillStyle = o.body;
  g.fill();
  g.save();
  torso();
  g.clip();
  g.fillStyle = 'rgba(0,0,0,.14)';
  g.fillRect(18, 0, 40, 210);
  const fold = o.fold || 'rgba(0,0,0,.15)';

  if (o.kind === 'tee' || o.kind === 'hoodie') {
    if (!o.plain) {                                  // Tomas Shirt hat zwei Streifen
      g.fillStyle = '#12b89a';
      g.fillRect(-50, 84, 100, 5.5);
      g.fillStyle = '#ff3d81';
      g.fillRect(-50, 93, 100, 2.4);
    }
    if (o.pocket) {
      g.strokeStyle = 'rgba(0,0,0,.3)';
      g.lineWidth = 1.5;
      rrect(g, 14, 51, 19, 21, 2.5);
      g.stroke();
      g.beginPath(); g.moveTo(14, 56.5); g.lineTo(33, 56.5); g.stroke();
    }
    if (o.kind === 'hoodie') {
      g.fillStyle = '#c9342f';
      g.fillRect(-3.7, 24, 7.4, 180);
      g.fillStyle = o.zip;
      g.fillRect(-2.2, 24, 4.4, 180);
      g.strokeStyle = fold;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-30, 60); g.quadraticCurveTo(-26, 110, -29, 200);
      g.moveTo(30, 60); g.quadraticCurveTo(26, 110, 29, 200);
      g.stroke();
    }
  } else if (o.kind === 'halfzip') {
    g.fillStyle = o.tee;                             // weißes Shirt im Ausschnitt
    g.beginPath(); g.moveTo(-11, 19); g.lineTo(11, 19); g.lineTo(0, 39); g.closePath(); g.fill();
    g.strokeStyle = o.zip;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 38); g.lineTo(0, 70); g.stroke();
    g.fillStyle = o.zip;
    rrect(g, -2.3, 68, 4.6, 8.5, 1.6);
    g.fill();
    g.strokeStyle = fold;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-30, 62); g.quadraticCurveTo(-26, 112, -30, 200);
    g.moveTo(30, 62); g.quadraticCurveTo(26, 112, 30, 200);
    g.stroke();
  } else if (o.kind === 'chiton') {
    g.fillStyle = c.skin2 || c.skin;
    g.beginPath(); g.moveTo(-11, 21); g.lineTo(11, 21); g.lineTo(0, 46); g.closePath(); g.fill();
    g.strokeStyle = fold;
    g.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(i * 9, 42 + Math.abs(i) * 3);
      g.quadraticCurveTo(i * 11.5, 110, i * 10, 200);
      g.stroke();
    }
    g.fillStyle = o.trim;
    g.fillRect(-50, 124, 100, 6);
    ell(g, -30, 31, 5, 5); g.fill();
    ell(g, 30, 31, 5, 5); g.fill();
  } else if (o.kind === 'apron') {
    g.fillStyle = o.apron;
    g.beginPath(); g.moveTo(-22, 52); g.lineTo(22, 52); g.lineTo(33, 200); g.lineTo(-33, 200); g.closePath(); g.fill();
    g.strokeStyle = o.apron;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-20, 54); g.lineTo(-9, 24);
    g.moveTo(20, 54); g.lineTo(9, 24);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.08)';
    rrect(g, -16, 92, 32, 26, 3);
    g.fill();
    g.strokeStyle = '#b8873f';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-8, 98); g.lineTo(-10, 79);
    g.moveTo(5, 98); g.lineTo(7.5, 80);
    g.stroke();
    g.fillStyle = '#cfd3da';
    g.fillRect(-13.5, 72, 7, 8);
    ell(g, 7.5, 77, 3.6, 3.6);
    g.fill();
    g.fillStyle = '#b8873f';
    g.fillRect(-50, 128, 100, 5);
    // die kleine Sanduhr am Gürtel
    g.fillRect(21, 136, 13, 2.2);
    g.fillRect(21, 157, 13, 2.2);
    g.fillStyle = '#d0a0ff';
    g.beginPath();
    g.moveTo(22.5, 138); g.lineTo(32.5, 138); g.lineTo(27.5, 147.5); g.lineTo(32.5, 157); g.lineTo(22.5, 157); g.lineTo(27.5, 147.5);
    g.closePath();
    g.fill();
  } else if (o.kind === 'armor') {
    const pg = g.createLinearGradient(-40, 0, 40, 0);
    pg.addColorStop(0, o.plate);
    pg.addColorStop(1, o.plate2);
    g.fillStyle = pg;
    g.beginPath();
    g.moveTo(-14, 23);
    g.quadraticCurveTo(-41, 27, -43, 48);
    g.lineTo(-37, 118);
    g.quadraticCurveTo(0, 131, 37, 118);
    g.lineTo(43, 48);
    g.quadraticCurveTo(41, 27, 14, 23);
    g.quadraticCurveTo(0, 39, -14, 23);
    g.closePath();
    g.fill();
    for (let i = -5; i <= 4; i++) {
      g.fillStyle = i % 2 ? o.plate2 : o.body;
      g.fillRect(i * 9.4 + 0.6, 124, 8.4, 46);
    }
    const lines = () => {
      g.beginPath();
      g.moveTo(0, 42); g.lineTo(0, 121);
      g.moveTo(-31, 70); g.quadraticCurveTo(-15, 82, 0, 71); g.quadraticCurveTo(15, 82, 31, 70);
      g.moveTo(-20, 98); g.lineTo(20, 98);
      g.stroke();
    };
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(0,0,0,.28)';
    lines();
    if (o.lines) {
      glowOn(g, o.lines, 10);
      g.strokeStyle = o.lines;
      g.lineWidth = 1.6;
      lines();
      glowOff(g);
    }
  } else if (o.kind === 'robe') {
    g.strokeStyle = fold;
    g.lineWidth = 1.8;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(i * 10 - 6, 44 + Math.abs(i) * 3);
      g.quadraticCurveTo(i * 12, 120, i * 11 + 6, 200);
      g.stroke();
    }
    if (o.tee) {
      // offene Robe: darunter Tomas schwarzes Shirt
      g.fillStyle = '#17181d';
      g.beginPath(); g.moveTo(-13, 21); g.lineTo(13, 21); g.lineTo(19, 200); g.lineTo(-19, 200); g.closePath(); g.fill();
      g.fillStyle = '#12b89a';
      g.fillRect(-18, 84, 36, 5.5);
      g.fillStyle = '#ff3d81';
      g.fillRect(-18, 93, 36, 2.4);
      g.strokeStyle = o.trim;
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-13, 21); g.lineTo(-19, 200);
      g.moveTo(13, 21); g.lineTo(19, 200);
      g.stroke();
    } else {
      g.fillStyle = o.trim;
      g.globalAlpha = 0.92;
      g.beginPath(); g.moveTo(-48, 42); g.lineTo(-30, 25); g.lineTo(42, 150); g.lineTo(32, 178); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }
  g.restore();

  if (o.kind === 'armor') {
    for (const sd of [-1, 1]) {
      g.fillStyle = sd < 0 ? o.plate : o.plate2;
      ell(g, sd * 45, 37, 16, 11);
      g.fill();
    }
  }
  if (o.kind === 'robe' && !o.tee) {
    g.fillStyle = o.trim;
    ell(g, -31, 31, 6.5, 6.5);
    g.fill();
  }

  // Hals + Kopf
  g.fillStyle = c.skin2 || c.skin;
  rrect(g, -8, 9, 16, 19, 5);
  g.fill();
  if (o.kind === 'tee') {
    g.strokeStyle = o.neck || '#30333d';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 19, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    g.stroke();
  }
  if (o.kind === 'hoodie') {
    g.strokeStyle = o.hood;
    g.lineWidth = 6.5;
    g.beginPath();
    g.moveTo(-20, 12); g.quadraticCurveTo(-14, 30, -2, 41);
    g.moveTo(20, 12); g.quadraticCurveTo(14, 30, 2, 41);
    g.stroke();
    g.strokeStyle = '#f2f5f9';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-9.5, 33); g.quadraticCurveTo(-11, 51, -10, 67);
    g.moveTo(9.5, 33); g.quadraticCurveTo(11, 51, 10, 67);
    g.stroke();
    g.fillStyle = '#f2f5f9';
    g.fillRect(-11.6, 66, 3.2, 6.5);
    g.fillRect(8.4, 66, 3.2, 6.5);
  }
  if (o.kind === 'halfzip') {                        // Stehkragen, vorn ein Stück offen
    g.fillStyle = o.collar2;
    for (const sd of [-1, 1]) {
      g.beginPath();
      g.moveTo(sd * 1.5, 37);
      g.quadraticCurveTo(sd * 10, 33, sd * 14.5, 25);
      g.quadraticCurveTo(sd * 16, 19.5, sd * 18.5, 20.5);
      g.quadraticCurveTo(sd * 23.5, 26, sd * 22, 35);
      g.quadraticCurveTo(sd * 12, 44, sd * 1.5, 46);
      g.closePath();
      g.fill();
    }
  }
  g.restore();
  g.save();
  g.scale(c.wide || 1, 1);
  portraitHead(g, c);
  g.restore();
  g.restore();
}

/* Pythia: schwebende Holo-Maske über einem Projektor */
function drawPythiaSprite(g) {
  const cx = 300, cy = 250;
  g.fillStyle = '#2a3348';
  rrect(g, cx - 60, 640, 120, 60, 10);
  g.fill();
  g.fillStyle = '#39e0ff';
  g.fillRect(cx - 40, 636, 80, 6);
  const cg = g.createLinearGradient(0, 640, 0, 110);
  cg.addColorStop(0, 'rgba(57,224,255,.42)');
  cg.addColorStop(1, 'rgba(57,224,255,.03)');
  g.fillStyle = cg;
  g.beginPath(); g.moveTo(cx - 36, 640); g.lineTo(cx + 36, 640); g.lineTo(cx + 196, 100); g.lineTo(cx - 196, 100); g.closePath(); g.fill();

  g.strokeStyle = 'rgba(127,243,255,.5)';
  g.lineWidth = 2;
  ell(g, cx, cy, 176, 176);
  g.stroke();
  g.setLineDash([10, 12]);
  ell(g, cx, cy, 194, 194);
  g.stroke();
  g.setLineDash([]);

  g.save();
  g.translate(cx, cy);
  g.scale(4.7, 4.7);
  g.lineJoin = 'round';
  glowOn(g, '#39e0ff', 24);
  g.beginPath();
  g.moveTo(-21, -22);
  g.quadraticCurveTo(-25, 10, -12, 26);
  g.quadraticCurveTo(0, 36, 12, 26);
  g.quadraticCurveTo(25, 10, 21, -22);
  g.quadraticCurveTo(0, -36, -21, -22);
  g.closePath();
  g.fillStyle = 'rgba(25,227,255,.2)';
  g.fill();
  g.strokeStyle = '#7ff3ff';
  g.lineWidth = 2.4;
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
  g.strokeStyle = 'rgba(127,243,255,.8)';
  g.lineWidth = 1.2;
  g.lineJoin = 'miter';
  meander(g, -15, -27, 32, 3.4);
  g.restore();

  g.fillStyle = 'rgba(127,243,255,.15)';
  for (let y = 100; y < 640; y += 9) g.fillRect(cx - 200, y, 400, 2);
}

/* ================= Bühne ================= */

const Cut = (() => {
  const SLOT_X = { left: 250, m1: 505, m2: 770, right: 1035 };
  const bgCache = {}, sprCache = {};
  let cv = null, g = null, scale = 1;
  let bgCur = null, bgPrev = null, bgFade = 1;
  let chars = [], active = null;
  let shakeV = 0, flashV = 0, flashCol = '255,255,255';
  let capText = '', capT = 0;
  let t = 0;

  function getBg(id) {
    if (!bgCache[id]) bgCache[id] = SCENES[id].make();
    return bgCache[id];
  }

  /* Standbild (hell) + abgedunkelte Fassung für Figuren, die gerade nicht sprechen */
  function bust(key, ex) {
    const id = key + ':' + (ex || '');
    if (sprCache[id]) return sprCache[id];
    const def = BUST[key];
    const img = mk(600, 700, c => {
      if (def.custom) drawPythiaSprite(c);
      else drawBust(c, 300, 215, 3.3, Object.assign({}, def.spec(), EXPR[ex] || null), def.outfit);
    });
    const dark = mk(600, 700, c => {
      c.drawImage(img, 0, 0);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(6,10,30,.6)';
      c.fillRect(0, 0, 600, 700);
    });
    return (sprCache[id] = { img, dark });
  }

  function clear() {
    for (const c of chars) c.target = 0;
    active = null;
  }

  function setBg(id) {
    if (!SCENES[id] || (bgCur && bgCur.id === id)) return;
    bgPrev = bgCur;
    bgCur = { id, img: getBg(id), cg: !!SCENES[id].cg, age: 0, seed: id.length * 1.7 };
    bgFade = bgPrev ? 0 : 1;
    if (bgCur.cg) clear();
    if (SCENES[id].label) { capText = SCENES[id].label; capT = 3.4; }
    else capT = Math.min(capT, 0.3);
  }

  function speak(key, ex) {
    const def = BUST[key];
    if (!def || !bgCur || bgCur.cg) { active = null; return; }
    const slot = def.slot || 'right';
    let c = chars.find(q => q.slot === slot && q.target === 1);
    if (c && c.who !== def.who) { c.target = 0; c = null; }
    if (!c) {
      c = { who: def.who, slot, x: SLOT_X[slot] + (slot === 'left' ? -150 : 150), alpha: 0, target: 1, act: 1, bob: 0 };
      chars.push(c);
    }
    c.spr = bust(key, ex);
    c.size = def.size || 1;
    c.ghost = !!def.ghost;
    c.flicker = !!def.flicker;
    c.bob = 1;
    active = c;
  }

  function tick(dt) {
    t += dt;
    if (bgFade < 1) {
      bgFade = Math.min(1, bgFade + dt / 0.5);
      if (bgFade >= 1) bgPrev = null;
    }
    if (bgCur) bgCur.age += dt;
    for (let i = chars.length - 1; i >= 0; i--) {
      const c = chars[i];
      c.alpha = damp(c.alpha, c.target, 12, dt);
      c.x = damp(c.x, SLOT_X[c.slot] + (c.target ? 0 : (c.slot === 'left' ? -100 : 100)), 10, dt);
      c.act = damp(c.act, c === active ? 1 : 0, 10, dt);
      c.bob = damp(c.bob, 0, 7, dt);
      if (!c.target && c.alpha < 0.02) chars.splice(i, 1);
    }
    shakeV = damp(shakeV, 0, 7, dt);
    flashV = damp(flashV, 0, 4, dt);
    if (capT > 0) capT -= dt;
  }

  function drawBg(b, a) {
    if (!b || a <= 0) return;
    const z = 1.04 + (b.cg ? 0.035 * Math.min(1, b.age / 7) : 0);          // CGs zoomen langsam heran
    const px = Math.sin(t * 0.11 + b.seed) * 10, py = Math.cos(t * 0.09 + b.seed) * 5;
    g.globalAlpha = a;
    g.drawImage(b.img, CX - W * z / 2 + px, H / 2 - H * z / 2 + py, W * z, H * z);
  }

  function render() {
    if (!g) return;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = '#05070d';
    g.fillRect(0, 0, W, H);
    g.save();
    if (shakeV > 0.4) g.translate((Math.random() - 0.5) * shakeV, (Math.random() - 0.5) * shakeV);
    drawBg(bgPrev, 1);
    drawBg(bgCur, bgFade);

    // Figuren: erst die stummen, dann der Sprecher
    chars.sort((p, q) => p.act - q.act);
    for (const c of chars) {
      const s = c.size * (0.965 + 0.045 * c.act);
      const w = 600 * s, h = 700 * s;
      const x = c.x - w / 2, y = H + 26 - h - c.bob * 10 + (1 - c.act) * 6;
      let a = c.alpha * (c.ghost ? 0.74 : 1);
      if (c.flicker) a *= 0.87 + 0.13 * Math.sin(t * 31) * Math.sin(t * 7.3);
      g.globalAlpha = a;
      g.shadowColor = 'rgba(0,0,12,.55)';
      g.shadowBlur = 24;
      g.drawImage(c.spr.dark, x, y, w, h);
      g.shadowColor = 'transparent';
      g.shadowBlur = 0;
      if (c.act > 0.02) {
        g.globalAlpha = a * c.act;
        g.drawImage(c.spr.img, x, y, w, h);
      }
    }
    g.globalAlpha = 1;

    // nach unten abdunkeln, damit die Textbox ruhig steht
    const fade = g.createLinearGradient(0, H - 250, 0, H);
    fade.addColorStop(0, 'rgba(5,7,13,0)');
    fade.addColorStop(1, 'rgba(5,7,13,.92)');
    g.fillStyle = fade;
    g.fillRect(-40, H - 250, W + 80, 290);

    // Ortsangabe
    if (capT > 0 && capText) {
      const a = Math.min(1, capT / 0.5, (3.4 - capT) / 0.4);
      const slide = (1 - Math.min(1, (3.4 - capT) / 0.4)) * -40;
      g.globalAlpha = Math.max(0, a);
      g.font = 'italic 900 22px "Arial Black", "Segoe UI Black", Impact, sans-serif';
      const tw = g.measureText(capText).width;
      g.fillStyle = 'rgba(8,14,44,.82)';
      g.beginPath();
      g.moveTo(0, 28); g.lineTo(tw + 78 + slide, 28); g.lineTo(tw + 58 + slide, 74); g.lineTo(0, 74);
      g.closePath();
      g.fill();
      g.fillStyle = '#7dffd8';
      g.fillRect(0, 74, tw + 58 + slide, 3);
      g.fillStyle = '#ffffff';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(capText, 30 + slide, 52);
      g.globalAlpha = 1;
    }
    g.restore();

    if (flashV > 0.01) {
      g.fillStyle = 'rgba(' + flashCol + ',' + (flashV * 0.85).toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  return {
    tick, render, clear,
    bg: setBg,
    speak,
    narrate() { active = null; },
    /* Mimik einer Figur wechseln, ohne dass sie spricht */
    face(key, ex) {
      const def = BUST[key];
      const c = def && chars.find(q => q.who === def.who && q.target === 1);
      if (c) c.spr = bust(key, ex);
    },
    /* Beginn einer Sequenz: Bühne leeren */
    start() { chars = []; active = null; shakeV = 0; flashV = 0; },
    fx(name) {
      if (name === 'snip') { flashCol = '255,60,70'; flashV = 1; shakeV = 26; }
      else if (name === 'quake') { shakeV = 30; }
      else if (name === 'flash') { flashCol = '255,255,255'; flashV = 1; shakeV = 10; }
    },
    resize(rs) {
      cv = document.getElementById('vnStage');
      if (!cv) return;
      g = cv.getContext('2d');
      scale = rs;
      cv.width = Math.round(W * rs);
      cv.height = Math.round(H * rs);
    },
  };
})();
