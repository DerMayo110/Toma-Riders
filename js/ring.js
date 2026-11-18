'use strict';

/* Loopings: Der Ring wird mit echter 3D-Geometrie gezeichnet – ein Kreis in der Höhen-/Tiefenebene,
   seitlich versetzt wie eine Schraube, damit Ein- und Ausfahrt nebeneinander liegen.
   Die flache Welt drumherum zeichnet game.js mit gekippter Kamera.
   Ring-Koordinaten: Ursprung = Einfahrt am Boden; x seitlich, y hoch, z nach vorn.
   Kamera C: { x, y, z, cos, sin, pitch } in denselben Koordinaten. */

const RING_NEAR = 140;
const MG = 130;                // Rand um das Bild, damit beim Neigen der Kamera keine Lücken entstehen
const ringBuf = { sx: [], sy: [], sw: [], cz: [], rx: [], ry: [], rw: [] };
const ringCmd = [];

/* Punkt auf dem Ring (Winkel th, seitlich lat, Höhe hgt über der Fahrbahn) -> Bildschirm */
function ringPoint(L, C, th, lat, hgt, out) {
  const c = Math.cos(th), s = Math.sin(th);
  const dy = L.R * (1 - c) + hgt * c - C.y;
  const dz = L.R * s - hgt * s - C.z;
  const cz = dy * C.sin + dz * C.cos;
  out.cz = cz;
  if (cz < RING_NEAR) return false;
  const sc = focal / cz;
  out.sc = sc;
  out.sx = CX + sc * (L.S * th / TAU + lat - C.x);
  out.sy = CY - sc * (dy * C.cos - dz * C.sin);
  return true;
}

/* Fahrer, der gerade im Looping steckt, für diesen Frame anmelden */
function ringAddRacer(L, r) {
  const th = mod(r.z - L.z0, TRACK_LEN) / L.R;
  const it = { cz: 0, sx: 0, sy: 0, sc: 0, r, up: 1 };
  if (!ringPoint(L, L.cam, th, r.x * ROAD_W, 0, it)) return;
  const up = Math.cos(th - L.cam.pitch);          // steht der Fahrer aus Kamerasicht aufrecht, schräg oder kopfüber?
  it.up = Math.abs(up) < 0.34 ? (up < 0 ? -0.34 : 0.34) : up;
  L.items.push(it);
}

function rquad(xa1, xa2, ya, xb1, xb2, yb) {
  ctx.beginPath();
  ctx.moveTo(xa1, ya);
  ctx.lineTo(xa2, ya);
  ctx.lineTo(xb2, yb);
  ctx.lineTo(xb1, yb);
  ctx.closePath();
  ctx.fill();
}

function drawRingSeg(L, k) {
  const B = ringBuf, C = L.cam, a = k, b = k + 1;
  const s = segments[L.i0 + k], col = s.col;
  const x1 = B.sx[a], w1 = B.sw[a], x2 = B.sx[b], w2 = B.sw[b];
  let y1 = B.sy[a], y2 = B.sy[b];
  const grow = y1 > y2 ? 0.7 : -0.7;                // hauchdünn überlappen, sonst blitzen Fugen durch
  y1 += grow;
  y2 -= grow;
  const e1 = w1 * 1.075, e2 = w2 * 1.075;

  const th = TAU * (k + 0.5) / L.n, c = Math.cos(th), sn = Math.sin(th);
  const inner = (C.y - L.R * (1 - c)) * c - (C.z - L.R * sn) * sn > 0;

  if (inner) {
    ctx.fillStyle = col.rumble;
    rquad(x1 - e1, x1 + e1, y1, x2 - e2, x2 + e2, y2);
    ctx.fillStyle = col.road;
    rquad(x1 - w1, x1 + w1, y1, x2 - w2, x2 + w2, y2);
    if (k < 16) {                                    // Leuchtpfeile am Einstieg
      const ph = mod(k - Math.floor(gameT * 14), 3);
      ctx.fillStyle = ph === 0 ? '#eaffff' : ph === 1 ? '#19e3ff' : '#0aa8e0';
      rquad(x1 - w1 * 0.45, x1 + w1 * 0.45, y1, x2 - w2 * 0.45, x2 + w2 * 0.45, y2);
    } else if (!s.dark) {
      const l1 = w1 * 0.012, l2 = w2 * 0.012;
      ctx.fillStyle = 'rgba(240,246,252,.85)';
      rquad(x1 - w1 / 3 - l1, x1 - w1 / 3 + l1, y1, x2 - w2 / 3 - l2, x2 - w2 / 3 + l2, y2);
      rquad(x1 + w1 / 3 - l1, x1 + w1 / 3 + l1, y1, x2 + w2 / 3 - l2, x2 + w2 / 3 + l2, y2);
    }
    // Energie-Leitplanken stehen zur Ringmitte hin
    const ra = B.rw[a] * 1.075, rb = B.rw[b] * 1.075;
    ctx.fillStyle = col.rail;
    ctx.globalAlpha = s.dark ? 0.28 : 0.42;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(x1 + side * e1, y1);
      ctx.lineTo(x2 + side * e2, y2);
      ctx.lineTo(B.rx[b] + side * rb, B.ry[b]);
      ctx.lineTo(B.rx[a] + side * ra, B.ry[a]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = clamp(w1 * 0.008, 1, 4);
    ctx.beginPath();
    ctx.moveTo(B.rx[a] - ra, B.ry[a]); ctx.lineTo(B.rx[b] - rb, B.ry[b]);
    ctx.moveTo(B.rx[a] + ra, B.ry[a]); ctx.lineTo(B.rx[b] + rb, B.ry[b]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {                                           // Unterseite: dunkles Tragwerk mit Leuchtrippen
    ctx.fillStyle = k % 6 === 0 ? col.rail : s.dark ? L.under2 : L.under;
    rquad(x1 - e1, x1 + e1, y1, x2 - e2, x2 + e2, y2);
    ctx.fillStyle = col.rail;
    rquad(x1 - e1, x1 - e1 * 0.9, y1, x2 - e2, x2 - e2 * 0.9, y2);
    rquad(x1 + e1 * 0.9, x1 + e1, y1, x2 + e2 * 0.9, x2 + e2, y2);
  }

  if (L.fog > 0.03) {
    ctx.globalAlpha = L.fog;
    ctx.fillStyle = FOG;
    rquad(x1 - e1, x1 + e1, y1, x2 - e2, x2 + e2, y2);
    ctx.globalAlpha = 1;
  }
}

function drawRingItem(L, it) {
  const vis = 1 - L.fog * 0.9;
  if (!it.r) {                                       // Orb
    const d = SPR.orb, w = d.w * it.sc;
    if (w < 3) return;
    ctx.globalAlpha = vis;
    ctx.drawImage(d.img, it.sx - w / 2, it.sy - w / 2, w, w);
    ctx.globalAlpha = 1;
    return;
  }
  const r = it.r;
  const k = it.sc * RIDER_SCALE * (r.pal.size || 1) * (r.big || 1);
  if (r.isPlayer) { pScr.x = it.sx; pScr.y = it.sy; pScr.k = k; }
  if (k < 0.04 || it.sx < -260 || it.sx > W + 260) return;
  ctx.save();
  ctx.translate(it.sx, it.sy);
  ctx.scale(1, it.up);
  ctx.globalAlpha = vis;
  ctx.fillStyle = 'rgba(10,20,40,' + (0.3 * (r.pal.ghost || 1)).toFixed(3) + ')';
  ctx.beginPath();
  ctx.ellipse(0, 0, 21 * k, 6 * k, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = vis * (r.pal.ghost || 1) * r.fade;
  drawRider(ctx, 0, 0, k, {
    pal: r.pal, lean: r.lean, t: gameT, phase: r.phase, drift: r.driftVis,
    boost: r.boostT > 0, thrust: r.speed / MAX_SPEED, trick: null, stumble: r.stumbleT > 0,
    cr: r.cr, sq: r.sq, armUp: 0, bo: r.bo,
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* Zeichnet den ganzen Ring samt Orbs und Fahrern, von hinten nach vorn. clipY: Unterkante (Kuppen davor) oder null. */
function drawRing(L, clipY) {
  const C = L.cam, n = L.n, st = L.st, B = ringBuf;
  for (let k = 0; k <= n; k++) {
    const p = st[k];
    const dy = p.y - C.y, dz = p.z - C.z;
    const cz = dy * C.sin + dz * C.cos;
    B.cz[k] = cz;
    if (cz < RING_NEAR) continue;
    const sc = focal / cz;
    B.sx[k] = Math.round(CX + sc * (p.x - C.x));
    B.sy[k] = Math.round(CY - sc * (dy * C.cos - dz * C.sin));
    B.sw[k] = Math.round(sc * ROAD_W);
    const ey = dy + RAIL_H * p.ny, ez = dz + RAIL_H * p.nz;
    const sc2 = focal / Math.max(ey * C.sin + ez * C.cos, 60);
    B.rx[k] = CX + sc2 * (p.x - C.x);
    B.ry[k] = CY - sc2 * (ey * C.cos - ez * C.sin);
    B.rw[k] = sc2 * ROAD_W;
  }

  ringCmd.length = 0;
  for (let k = 0; k < n; k++) {
    if (B.cz[k] < RING_NEAR || B.cz[k + 1] < RING_NEAR) continue;
    const ya = B.sy[k], yb = B.sy[k + 1];
    if ((ya < -MG && yb < -MG) || (ya > H + MG && yb > H + MG)) continue;
    ringCmd.push({ z: (B.cz[k] + B.cz[k + 1]) / 2, k, it: null });
  }
  for (let k = 0; k < n; k++) {
    const sg = segments[L.i0 + k];
    for (const sp of sg.sprites) {
      if (!sp.pick || sp.gone > gameT) continue;
      const it = { cz: 0, sx: 0, sy: 0, sc: 0, r: null, up: 1 };
      const hgt = sp.yOff + 150 + Math.sin(gameT * 4 + sp.seed) * 25;
      if (ringPoint(L, C, TAU * k / n, sp.x * ROAD_W, hgt, it)) ringCmd.push({ z: it.cz - 320, k: -1, it });
    }
  }
  for (const it of L.items) ringCmd.push({ z: it.cz - 320, k: -1, it });
  L.items.length = 0;
  if (!ringCmd.length) return;
  ringCmd.sort((p, q) => q.z - p.z);

  const clip = clipY != null && clipY < H + MG;
  if (clip) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-MG, -MG * 4, W + 2 * MG, clipY + MG * 4);
    ctx.clip();
  }
  for (const c of ringCmd) {
    if (c.it) drawRingItem(L, c.it);
    else drawRingSeg(L, c.k);
  }
  if (clip) ctx.restore();
}
