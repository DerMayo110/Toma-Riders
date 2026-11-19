'use strict';

/* Echte 3D-Darstellung der Rennwelt (WebGL2).
   Die Spiellogik bleibt, wie sie ist: Jeder Fahrer hat eine Streckenposition (z), eine Querlage (x) und eine Höhe (h).
   Hier wird die Strecke zu einer Raumkurve mit echten Kurven, Hügeln, Querneigung und Loopings; Gelände, Fahrbahn,
   Kulissen und Fahrer werden daran entlang platziert. Kulissen und Fahrer sind Bildtafeln (Billboards) aus den
   vorhandenen Zeichnungen. HUD, Namensschilder und Effekte zeichnet game.js als 2D-Bild darüber.
   Ohne WebGL2 gibt es kein Bild – game.js zeigt dann einen Hinweis. */

const W3 = (() => {
  const CURVE_K = 0.0025;        // Richtungsänderung je Segment und Kurvenwert
  const BANK_K = 0.03;           // Querneigung je Kurvenwert
  const VIEW = 300, BEHIND = 14; // Sichtweite in Segmenten nach vorn / hinter der Kamera
  const TERR_W = 6, PIER_W = 1.35, SKIRT = 3;                   // Gelände: halbe Breite (in Fahrbahnhälften), Böschung
  const BASE_GAP = 700;                                         // so tief liegt die Tiefebene mindestens unter der Fahrbahn
  const FOG_D = 3.3e-5;
  const CELL_W = 320, CELL_H = 368, CELL_S = 1.6, CELL_OX = 160, CELL_OY = 300;   // Fahrer-Bildtafeln
  const LIGHT = (() => { const l = Math.hypot(0.35, 0.85, 0.4); return [0.35 / l, 0.85 / l, 0.4 / l]; })();

  /* Tiefebene unter der Strecke: Farbe und Art (0 = Land, 3 = bewegte Fläche wie Wasser, Lava, Wolken) */
  const BASES = {
    sky: ['#2f7fc0', 3], piraeus: ['#1f86d6', 3], akropolis: ['#a98f63', 0], thermo: ['#b8381a', 3],
    knossos: ['#141a33', 0], styx: ['#0f4a44', 3], olymp: ['#f1eeff', 3], tartaros: ['#2a0f45', 3],
  };
  const WATER_ZONES = { 'Bay Bridge': 1, 'Mole': 1, 'Styx': 1, 'Riss: Styx': 1 };

  let gl = null, cv = null, ready = false, aniso = null, maxAniso = 1;
  let pMesh = null, pSky = null, um = null, us = null;
  let dynVao = null, dynBuf = null, skyVao = null;
  let tex = {};
  let T = null;                  // Daten der geladenen Strecke
  let atlasCv = null, atlasCtx = null, atlasTex = null;
  /* Geglätteter Kamerastand: Höhe über der Bezugsbahn (off) und Blickweite (la); p… = Stand einen Schritt zuvor */
  const camS = { off: 1000, la: 7000, laV: 0, pOff: 1000, pLa: 7000, hi: 0, pHi: 0, init: false };   // hi = Flughöhe über der Bezugsbahn
  const cam3 = { c: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], vp: new Float32Array(16), tan: 0.56 };
  const fa = mkFrame(), fb = mkFrame(), fc = mkFrame(), fq = mkFrame();
  const batches = new Map();

  function mkFrame() { return { p: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1] }; }

  /* ================= Shader ================= */
  const VS_MESH = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in vec4 aCol;
uniform mat4 uVP;
uniform vec2 uUvOff;
out vec2 vUv; out vec4 vCol; out float vDepth;
void main() {
  vec4 p = uVP * vec4(aPos, 1.0);
  gl_Position = p;
  vUv = aUv + uUvOff;
  vCol = aCol;
  vDepth = p.w;
}`;
  const FS_MESH = `#version 300 es
precision highp float;
in vec2 vUv; in vec4 vCol; in float vDepth;
uniform sampler2D uTex;
uniform vec3 uFog;
uniform float uFogD, uCut, uTime, uFlip;
uniform int uMode;     // 0 Textur*Farbe · 1 Fahrbahn (Belag aus dem Atlas, von der Zone getönt) · 2 leuchtend · 3 bewegte Fläche
out vec4 o;
void main() {
  vec4 c;
  if (uMode == 1) {
    c = vec4(texture(uTex, vUv).rgb * vCol.rgb, 1.0);
    if ((gl_FrontFacing ? 1.0 : -1.0) * uFlip < 0.0) c.rgb = c.rgb * 0.34 + vec3(0.02, 0.03, 0.06);   // Unterseite (Looping)
  } else if (uMode == 3) {
    float n = texture(uTex, vUv + vec2(uTime * 0.013, uTime * 0.008)).r * 0.5
            + texture(uTex, vUv * 1.7 - vec2(uTime * 0.011, uTime * 0.004)).r * 0.5;
    c = vec4(vCol.rgb * (0.72 + 0.5 * n) + vec3(smoothstep(0.80, 0.97, n)) * 0.22, 1.0);
  } else {
    c = texture(uTex, vUv) * vCol;
  }
  if (c.a < uCut) discard;
  float f = clamp(1.0 - exp(-pow(vDepth * uFogD, 2.0)), 0.0, 1.0);
  if (uMode == 2) c.a *= 1.0 - f;
  else c.rgb = mix(c.rgb, uFog, f);
  o = c;
}`;
  const VS_SKY = `#version 300 es
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)) * 2.0 - 1.0;
  vNdc = p;
  gl_Position = vec4(p, 0.0, 1.0);
}`;
  const FS_SKY = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform vec3 uR, uU, uF, uZen, uMid, uHor, uFog, uSunDir, uSunCore, uSunGlow;
uniform float uTan, uAspect, uYaw, uSunSize, uStars, uTime, uFarH, uFarRep, uCloudOn;
uniform sampler2D uFar, uCloud;
out vec4 o;
void main() {
  vec3 d = normalize(uF + uR * (vNdc.x * uTan * uAspect) + uU * (vNdc.y * uTan));
  float el = d.y;
  float az = atan(d.x, d.z) - uYaw;
  vec3 c = mix(uHor, mix(uMid, uZen, smoothstep(0.22, 0.85, el)), smoothstep(0.0, 0.3, el));
  float sd = max(dot(d, uSunDir), 0.0);
  c += uSunGlow * (pow(sd, 6.0) * 0.28 + pow(sd, 60.0) * 0.5) + uSunCore * smoothstep(uSunSize, uSunSize + 0.0012, sd);
  if (uStars > 0.0 && el > 0.03) {
    vec2 g = vec2(az * 46.0, el * 70.0);
    vec2 id = floor(g);
    float h = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
    float s = step(1.0 - uStars, h) * smoothstep(0.16, 0.0, length(fract(g) - 0.5));
    c += vec3(s) * (0.35 + 0.65 * fract(h * 7.0));
  }
  if (uCloudOn > 0.5 && el > 0.05) {
    vec2 uv = vec2(az / 6.2831853 * 2.0 + uTime * 0.0016, 1.0 - (el - 0.05) / 0.5);
    if (uv.y > 0.0) {
      vec4 cl = texture(uCloud, uv);
      c = mix(c, cl.rgb, cl.a * smoothstep(0.05, 0.13, el));
    }
  }
  float fe = el / uFarH;
  if (fe > 0.0 && fe < 1.0) {
    vec4 ft = texture(uFar, vec2(az / 6.2831853 * uFarRep, 1.0 - fe));
    c = mix(c, ft.rgb, ft.a);
  }
  c = mix(c, uFog, el > 0.0 ? smoothstep(0.09, 0.0, el) * 0.92 : 1.0);
  o = vec4(c, 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader: ' + gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs, names) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Programm: ' + gl.getProgramInfoLog(p));
    const u = {};
    for (const n of names) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  }

  /* ================= Texturen ================= */
  function texFrom(src, o) {
    o = o || {};
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    // repeat: true = beide Richtungen · 's' = nur quer · 't' = nur längs
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o.repeat && o.repeat !== 't' ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.repeat === true || o.repeat === 't' ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (o.mip === false) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    else {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, maxAniso));
    }
    return t;
  }

  /* ================= Fahrbahnbeläge =================
     Je Belag eine Kachel: quer 4000 Einheiten (die ganze Bahnbreite), längs 2400 (12 Segmente). Gezeichnet wird in
     Welt-Einheiten, alle Muster wiederholen sich längs nahtlos. Welche Zone welchen Belag trägt, steht in track.js
     (SURFACES); die Zone tönt ihn zusätzlich ein – bei Basalt, Irrgarten und Glas bestimmt die Tönung die Leuchtfarbe. */
  const SURF = ['plain', 'asphalt', 'deck', 'planks', 'pavers', 'marble', 'dirt', 'basalt', 'bronze', 'maze', 'glass', 'cloud'];
  const SURF_W = 256, SURF_H = 1024, SURF_PAD = 16, SURF_LEN = 12;
  const RU = 4000, RL = 2400;
  const surfU = (id, u) => (id + (SURF_PAD + u * (SURF_W - 2 * SURF_PAD)) / SURF_W) / SURF.length;

  /* n Rechtecke zufällig verteilt; was unten übersteht, erscheint oben wieder */
  function speck(g, R, n, col, w0, w1, h0, h1) {
    for (let i = 0; i < n; i++) {
      const x = R() * RU, y = R() * RL, w = w0 + R() * (w1 - w0), h = h0 + R() * (h1 - h0);
      g.fillStyle = col(R);
      g.fillRect(x, y, w, h);
      if (y + h > RL) g.fillRect(x, y - RL, w, h);
    }
  }
  function dot(g, x, y, r) {
    for (const oy of [0, -RL, RL]) {
      if (y + oy + r < 0 || y + oy - r > RL) continue;
      g.beginPath();
      g.arc(x, y + oy, r, 0, TAU);
      g.fill();
    }
  }
  /* Strichlinien auf den Spurgrenzen */
  function dashes(g, col, w, len, period) {
    g.fillStyle = col;
    for (const x of [RU / 3, 2 * RU / 3]) for (let y = 0; y < RL; y += period) g.fillRect(x - w / 2, y, w, len);
  }
  /* Risse: Zickzack-Linien längs der Bahn, außen ein weicher Schein, innen hell */
  function cracks(g, R, n, halo, core) {
    const paths = [];
    for (let i = 0; i < n; i++) {
      let x = 300 + R() * (RU - 600), y = R() * RL;
      const p = [[x, y]];
      for (let k = 0, m = 5 + (R() * 7 | 0); k < m; k++) {
        x = clamp(x + (R() - 0.5) * 760, 120, RU - 120);
        y += 70 + R() * 190;
        p.push([x, y]);
        if (R() < 0.3) paths.push([[x, y], [clamp(x + (R() - 0.5) * 900, 120, RU - 120), y + 60 + R() * 160]]);
      }
      paths.push(p);
    }
    g.lineJoin = g.lineCap = 'round';
    for (const pass of [[halo, 110], [core, 30]]) {
      g.strokeStyle = pass[0];
      g.lineWidth = pass[1];
      for (const p of paths) for (const oy of [0, -RL]) {
        g.beginPath();
        p.forEach((q, i) => (i ? g.lineTo(q[0], q[1] + oy) : g.moveTo(q[0], q[1] + oy)));
        g.stroke();
      }
    }
  }

  const ROAD_ART = {
    /* Randstreifen und Schanzenkante: schlichtes Weiß mit etwas Körnung */
    plain(g, R) {
      g.fillStyle = '#f3f3f3';
      g.fillRect(0, 0, RU, RL);
      speck(g, R, 500, () => 'rgba(0,0,0,' + (0.03 + R() * 0.05).toFixed(3) + ')', 60, 240, 10, 40);
    },
    asphalt(g, R) {
      g.fillStyle = '#6b717d';
      g.fillRect(0, 0, RU, RL);
      speck(g, R, 2600, () => (R() < 0.5 ? 'rgba(20,22,30,' : 'rgba(210,215,225,') + (0.08 + R() * 0.14).toFixed(3) + ')', 30, 90, 6, 24);
      for (let i = 0; i < 14; i++) {                                        // Schleifspuren
        g.fillStyle = 'rgba(28,30,38,' + (0.08 + R() * 0.12).toFixed(3) + ')';
        g.fillRect(250 + R() * (RU - 500), 0, 50 + R() * 90, RL);
      }
      g.fillStyle = '#e6eaf0';
      g.fillRect(110, 0, 50, RL);
      g.fillRect(RU - 160, 0, 50, RL);
      dashes(g, '#eef1f5', 72, 600, 1200);
    },
    /* Stahlplatten einer Brücke: Quernähte, Nieten, Riffelung, gelbe Linien */
    deck(g, R) {
      g.fillStyle = '#7e8896';
      g.fillRect(0, 0, RU, RL);
      g.fillStyle = 'rgba(255,255,255,.09)';
      for (let y = 0, r = 0; y < RL; y += 60, r++) for (let x = (r % 2) * 100; x < RU; x += 200) g.fillRect(x, y + 22, 96, 12);
      speck(g, R, 160, () => 'rgba(120,70,40,' + (0.05 + R() * 0.1).toFixed(3) + ')', 80, 300, 30, 110);
      for (let y = 0; y < RL; y += 600) {
        g.fillStyle = '#4c5460';
        g.fillRect(0, y, RU, 16);
        g.fillStyle = 'rgba(255,255,255,.28)';
        g.fillRect(0, y + 16, RU, 9);
        g.fillStyle = '#3f4651';
        for (let x = 125; x < RU; x += 250) { dot(g, x, y + 62, 22); dot(g, x, y + 600 - 46, 22); }
      }
      g.fillStyle = '#566070';
      g.fillRect(RU / 2 - 14, 0, 28, RL);
      g.fillStyle = '#f2c230';
      g.fillRect(105, 0, 62, RL);
      g.fillRect(RU - 167, 0, 62, RL);
      dashes(g, '#f2c230', 62, 300, 600);
    },
    /* Holzplanken einer Mole: Bretter quer zur Fahrt, versetzte Stöße, Nägel */
    planks(g, R) {
      const tones = ['#a17a4e', '#96704a', '#8a6540', '#ab8558', '#7f5c3a', '#9c7650', '#8f6b46'];
      g.fillStyle = '#4a3320';
      g.fillRect(0, 0, RU, RL);
      for (let y = 0; y < RL; y += 240) {
        const cuts = [0, 900 + R() * 900, 2200 + R() * 900, RU].sort((a, b) => a - b);
        for (let i = 0; i < cuts.length - 1; i++) {
          const x0 = cuts[i], x1 = cuts[i + 1];
          g.fillStyle = tones[(R() * tones.length) | 0];
          g.fillRect(x0 + 12, y + 9, x1 - x0 - 24, 222);
          g.fillStyle = 'rgba(255,240,210,.13)';
          g.fillRect(x0 + 12, y + 9, x1 - x0 - 24, 14);
          g.fillStyle = 'rgba(40,24,10,.2)';
          g.fillRect(x0 + 12, y + 212, x1 - x0 - 24, 19);
          g.fillStyle = 'rgba(50,30,14,.2)';                                   // Maserung
          for (let k = 0; k < 7; k++) { const gx = x0 + 30 + R() * (x1 - x0 - 300); g.fillRect(gx, y + 26 + R() * 180, 120 + R() * 500, 5); }
          g.fillStyle = '#3a2716';                                             // Nägel
          for (const nx of [x0 + 90, x1 - 90]) { dot(g, nx, y + 70, 15); dot(g, nx, y + 170, 15); }
        }
      }
      g.fillStyle = '#5e4329';                                                 // Randbalken
      g.fillRect(0, 0, 150, RL);
      g.fillRect(RU - 150, 0, 150, RL);
      g.fillStyle = 'rgba(255,235,200,.22)';
      g.fillRect(150, 0, 36, RL);
      g.fillRect(RU - 186, 0, 36, RL);
    },
    /* Steinplatten im Läuferverband (neutral hell – die Zone tönt sie zu Sandstein, Kalk oder Beton) */
    pavers(g, R) {
      g.fillStyle = '#8a8780';
      g.fillRect(0, 0, RU, RL);
      for (let y = 0; y < RL; y += 300) {
        for (let x = -R() * 600; x < RU;) {
          const w = 450 + R() * 380, v = (198 + R() * 40) | 0;
          g.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 9) + ')';
          g.fillRect(x + 20, y + 8, w - 40, 284);
          g.fillStyle = 'rgba(255,255,255,.16)';
          g.fillRect(x + 20, y + 8, w - 40, 16);
          g.fillStyle = 'rgba(0,0,0,.1)';
          g.fillRect(x + 20, y + 268, w - 40, 24);
          x += w;
        }
      }
      speck(g, R, 900, () => 'rgba(60,55,45,' + (0.05 + R() * 0.1).toFixed(3) + ')', 30, 110, 6, 22);
    },
    /* Marmorplatten mit Adern, außen ein goldenes Mäanderband */
    marble(g, R) {
      g.fillStyle = '#eef0f3';
      g.fillRect(0, 0, RU, RL);
      speck(g, R, 220, () => 'rgba(150,160,180,' + (0.04 + R() * 0.06).toFixed(3) + ')', 200, 700, 60, 220);
      g.lineCap = 'round';
      for (let i = 0; i < 30; i++) {                                           // Adern
        const x = R() * RU, y = R() * RL, dx = (R() - 0.5) * 1800, dy = 200 + R() * 700;
        g.strokeStyle = 'rgba(110,122,146,' + (0.14 + R() * 0.18).toFixed(3) + ')';
        g.lineWidth = 8 + R() * 20;
        for (const oy of [0, -RL]) {
          g.beginPath();
          g.moveTo(x, y + oy);
          g.bezierCurveTo(x + dx * 0.3 + (R() - 0.5) * 300, y + oy + dy * 0.3, x + dx * 0.7, y + oy + dy * 0.6, x + dx, y + oy + dy);
          g.stroke();
        }
      }
      g.fillStyle = '#c5c9d2';                                                 // Fugen
      for (let y = 0; y < RL; y += 1200) g.fillRect(0, y, RU, 10);
      for (const x of [1000, 2000, 3000]) g.fillRect(x - 14, 0, 28, RL);
      g.fillStyle = '#c9a24a';                                                 // Mäander
      for (const x0 of [140, RU - 440]) {
        g.fillRect(x0, 0, 40, RL);
        g.fillRect(x0 + 260, 0, 40, RL);
        for (let y = 0; y < RL; y += 300) {
          g.fillRect(x0 + 40, y + 20, 150, 36);
          g.fillRect(x0 + 150, y + 20, 40, 120);
          g.fillRect(x0 + 110, y + 170, 150, 36);
          g.fillRect(x0 + 110, y + 170, 40, 120);
        }
      }
      for (const x of [RU / 3, 2 * RU / 3]) for (let y = 300; y < RL; y += 600) {  // Rauten auf den Spurgrenzen
        g.beginPath();
        g.moveTo(x, y - 110); g.lineTo(x + 60, y); g.lineTo(x, y + 110); g.lineTo(x - 60, y);
        g.closePath();
        g.fill();
      }
    },
    /* Festgefahrene Erde mit Fahrrinnen und Kieseln (neutral hell – die Zone tönt sie) */
    dirt(g, R) {
      g.fillStyle = '#cdc6ba';
      g.fillRect(0, 0, RU, RL);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = R() < 0.6 ? 'rgba(110,96,78,' + (0.06 + R() * 0.08).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.05 + R() * 0.07).toFixed(3) + ')';
        const x = R() * RU, y = R() * RL, rx = 200 + R() * 500, ry = 90 + R() * 240;
        for (const oy of [0, -RL, RL]) { g.beginPath(); g.ellipse(x, y + oy, rx, ry, 0, 0, TAU); g.fill(); }
      }
      g.fillStyle = 'rgba(86,72,56,.13)';                                      // Fahrrinnen
      for (const cx of [1250, 2750]) for (let y = 0; y < RL; y += 40) g.fillRect(cx - 190 + Math.sin(y / RL * TAU * 2 + cx) * 50, y, 380, 40);
      for (let i = 0; i < 420; i++) {                                          // Kiesel
        const x = R() * RU, y = R() * RL, r = 16 + R() * 26;
        g.fillStyle = 'rgba(70,60,48,.3)';
        dot(g, x + 8, y + 5, r);
        g.fillStyle = R() < 0.5 ? '#e9e3d9' : '#a69e92';
        dot(g, x, y, r);
      }
      speck(g, R, 700, () => 'rgba(80,68,54,' + (0.08 + R() * 0.1).toFixed(3) + ')', 30, 90, 6, 18);
    },
    /* Dunkler Fels mit hellen Rissen – die Tönung der Zone macht daraus Glut, Blitz oder Höllenrot */
    basalt(g, R) {
      g.fillStyle = '#55555e';
      g.fillRect(0, 0, RU, RL);
      speck(g, R, 380, () => 'rgba(0,0,0,' + (0.08 + R() * 0.16).toFixed(3) + ')', 120, 520, 40, 170);
      speck(g, R, 500, () => 'rgba(255,255,255,' + (0.03 + R() * 0.05).toFixed(3) + ')', 40, 140, 8, 28);
      cracks(g, R, 10, 'rgba(255,255,255,.2)', 'rgba(255,255,255,.96)');
      g.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 60; i++) dot(g, R() * RU, R() * RL, 8 + R() * 12);
    },
    /* Gehämmerte Bronzeplatten mit Nieten */
    bronze(g, R) {
      g.fillStyle = '#5a3c1a';
      g.fillRect(0, 0, RU, RL);
      for (let y = 0; y < RL; y += 600) for (let x = 0; x < RU; x += 1000) {
        g.fillStyle = 'rgb(' + ((172 + R() * 26) | 0) + ',' + ((120 + R() * 20) | 0) + ',' + ((54 + R() * 16) | 0) + ')';
        g.fillRect(x + 16, y + 7, 968, 586);
        g.fillStyle = 'rgba(255,232,170,.3)';
        g.fillRect(x + 16, y + 7, 968, 16);
        g.fillRect(x + 16, y + 7, 30, 586);
        g.fillStyle = 'rgba(50,28,8,.25)';
        g.fillRect(x + 16, y + 571, 968, 22);
        g.fillStyle = '#4a2f12';
        for (const rx of [x + 90, x + 910]) for (const ry of [y + 60, y + 540]) dot(g, rx, ry, 24);
        g.fillStyle = 'rgba(255,235,180,.7)';
        for (const rx of [x + 82, x + 902]) for (const ry of [y + 54, y + 534]) dot(g, rx, ry, 9);
      }
      speck(g, R, 700, () => (R() < 0.5 ? 'rgba(255,230,160,' : 'rgba(60,34,10,') + (0.05 + R() * 0.08).toFixed(3) + ')', 60, 160, 16, 50);
      speck(g, R, 60, () => 'rgba(70,160,140,' + (0.06 + R() * 0.08).toFixed(3) + ')', 150, 500, 50, 160);
    },
    /* Dunkle Fliesen mit hellen Einlegelinien im Mäander – die Tönung der Zone lässt sie leuchten */
    maze(g, R) {
      g.fillStyle = '#23252d';
      g.fillRect(0, 0, RU, RL);
      for (let y = 0; y < RL; y += 600) for (let x = 0; x < RU; x += 500) {
        const v = (52 + R() * 16) | 0;
        g.fillStyle = 'rgb(' + v + ',' + (v + 2) + ',' + (v + 12) + ')';
        g.fillRect(x + 14, y + 6, 472, 588);
      }
      for (const pass of [['rgba(255,255,255,.16)', 60, 26], ['rgba(255,255,255,.95)', 0, 0]]) {
        const gx = pass[1], gy = pass[2];
        g.fillStyle = pass[0];
        g.fillRect(140 - gx, 0, 46 + 2 * gx, RL);
        g.fillRect(RU - 186 - gx, 0, 46 + 2 * gx, RL);
        for (const x of [RU / 3, 2 * RU / 3]) for (let y = 0; y < RL; y += 600) {
          g.fillRect(x - 112 - gx, y - gy, 46 + 2 * gx, 314 + 2 * gy);
          g.fillRect(x - 112 - gx, y + 300 - gy, 224 + 2 * gx, 16 + 2 * gy);
          g.fillRect(x + 66 - gx, y + 300 - gy, 46 + 2 * gx, 316 + 2 * gy);
          g.fillRect(x - 112 - gx, y + 584 - gy, 224 + 2 * gx, 16 + 2 * gy);
        }
      }
      g.strokeStyle = 'rgba(255,255,255,.45)';                                 // kleine Labyrinthe in der Mitte
      g.lineWidth = 22;
      for (let y = 300; y < RL; y += 1200) for (const r of [90, 180, 270]) g.strokeRect(RU / 2 - r, y - r, 2 * r, 2 * r);
    },
    /* Schwarzes Glas über dem Wasser: Spiegelungen, Leuchtpunkte auf den Spurgrenzen (Tönung = Leuchtfarbe) */
    glass(g, R) {
      g.fillStyle = '#2b2d3a';
      g.fillRect(0, 0, RU, RL);
      for (let i = 0; i < 46; i++) {
        g.fillStyle = 'rgba(255,255,255,' + (0.03 + R() * 0.07).toFixed(3) + ')';
        g.fillRect(R() * RU, 0, 24 + R() * 130, RL);
      }
      speck(g, R, 150, () => 'rgba(255,255,255,' + (0.04 + R() * 0.06).toFixed(3) + ')', 300, 900, 6, 13);
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.fillRect(130, 0, 40, RL);
      g.fillRect(RU - 170, 0, 40, RL);
      for (const x of [RU / 3, 2 * RU / 3]) for (let y = 150; y < RL; y += 300) {
        g.fillStyle = 'rgba(255,255,255,.16)';
        dot(g, x, y, 95);
        g.fillStyle = 'rgba(255,255,255,.95)';
        dot(g, x, y, 36);
      }
    },
    /* Wolkenbahn: weiche Ballen, goldene Striche */
    cloud(g, R) {
      g.fillStyle = '#e4e9f8';
      g.fillRect(0, 0, RU, RL);
      for (let i = 0; i < 260; i++) {
        const x = R() * RU, y = R() * RL, r = 150 + R() * 300, blue = R() < 0.25;
        for (const oy of [0, -RL, RL]) {
          if (y + oy + r < 0 || y + oy - r > RL) continue;
          const gr = g.createRadialGradient(x, y + oy, r * 0.1, x, y + oy, r);
          gr.addColorStop(0, blue ? 'rgba(160,178,226,.3)' : 'rgba(255,255,255,.95)');
          gr.addColorStop(1, blue ? 'rgba(160,178,226,0)' : 'rgba(255,255,255,0)');
          g.fillStyle = gr;
          g.fillRect(x - r, y + oy - r, 2 * r, 2 * r);
        }
      }
      g.fillStyle = '#e3bd55';
      g.fillRect(120, 0, 44, RL);
      g.fillRect(RU - 164, 0, 44, RL);
      dashes(g, '#e3bd55', 60, 220, 600);
    },
  };

  function makeTextures() {
    const R = mulberry32(99);
    tex.white = texFrom(mk(4, 4, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); }), { mip: false });

    // Fahrbahn: alle Beläge nebeneinander in einem Bild. Jede Spalte hat links und rechts einen verlängerten Rand,
    // damit in der Ferne (verkleinerte Fassungen) keine Farbe des Nachbarn hineinläuft.
    tex.road = texFrom(mk(SURF_W * SURF.length, SURF_H, g => {
      SURF.forEach((name, i) => {
        const iw = SURF_W - 2 * SURF_PAD;
        const tile = mk(iw, SURF_H, c => { c.scale(iw / RU, SURF_H / RL); ROAD_ART[name](c, mulberry32(7 + i * 31)); });
        const x0 = i * SURF_W;
        g.drawImage(tile, x0 + SURF_PAD, 0);
        g.drawImage(tile, 0, 0, 1, SURF_H, x0, 0, SURF_PAD, SURF_H);
        g.drawImage(tile, iw - 1, 0, 1, SURF_H, x0 + SURF_W - SURF_PAD, 0, SURF_PAD, SURF_H);
      });
    }), { repeat: 't' });

    // Boden: helle, fleckige Körnung zum Einfärben
    tex.ground = texFrom(mk(256, 256, (g, w, h) => {
      g.fillStyle = '#d8d8d8';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const v = (150 + R() * 105) | 0, r = 3 + R() * 22, x = R() * w, y = R() * h;
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.28)';
        for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }
      }
      for (let i = 0; i < 2600; i++) {
        const v = (120 + R() * 135) | 0;
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.5)';
        g.fillRect(R() * w, R() * h, 1.5, 1.5);
      }
    }), { repeat: true });

    // Leitplanke: unten zart, oben eine helle Kante
    tex.rail = texFrom(mk(4, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.12, 'rgba(255,255,255,.9)');
      gr.addColorStop(0.16, 'rgba(255,255,255,.5)');
      gr.addColorStop(1, 'rgba(255,255,255,.22)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }), { mip: false, repeat: 's' });

    tex.blob = texFrom(mk(64, 64, g => {
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(0.6, 'rgba(0,0,0,.7)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    }));

    // Boost-Feld: Pfeile, die in Fahrtrichtung wandern
    tex.pad = texFrom(mk(128, 128, (g, w, h) => {
      g.fillStyle = '#0aa8e0';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#19e3ff';
      g.fillRect(0, 0, w, h * 0.5);
      g.fillStyle = '#eaffff';
      for (const y0 of [0, h / 2]) {
        g.beginPath();
        g.moveTo(w * 0.5, y0 + 6); g.lineTo(w * 0.9, y0 + h * 0.36); g.lineTo(w * 0.68, y0 + h * 0.36);
        g.lineTo(w * 0.5, y0 + h * 0.2); g.lineTo(w * 0.32, y0 + h * 0.36); g.lineTo(w * 0.1, y0 + h * 0.36);
        g.closePath();
        g.fill();
      }
    }), { repeat: true });

    // Schanze: gelb-schwarze Winkel
    tex.ramp = texFrom(mk(128, 128, (g, w, h) => {
      g.fillStyle = '#22262f';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffd23d';
      for (const y0 of [-h / 2, 0, h / 2]) {
        g.beginPath();
        g.moveTo(0, y0 + h * 0.5); g.lineTo(w * 0.5, y0); g.lineTo(w, y0 + h * 0.5);
        g.lineTo(w, y0 + h * 0.75); g.lineTo(w * 0.5, y0 + h * 0.25); g.lineTo(0, y0 + h * 0.75);
        g.closePath();
        g.fill();
      }
    }), { repeat: true });

    tex.checker = texFrom(mk(128, 16, (g, w, h) => {
      for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) {
        g.fillStyle = (i + j) % 2 ? '#f5f7fa' : '#14161d';
        g.fillRect(i * 8, j * 8, 8, 8);
      }
    }), { repeat: true, mip: false });
  }

  function spriteTex(name) {
    const key = 'spr:' + name;
    if (!tex[key]) tex[key] = texFrom(SPR[name].img);
    return tex[key];
  }

  /* ================= Netze ================= */
  const colCache = {};
  function rgb(str) {
    let c = colCache[str];
    if (!c) {
      if (str[0] === '#') c = hexRgb(str);
      else c = str.slice(4, -1).split(',').map(Number);
      colCache[str] = c;
    }
    return c;
  }

  function Mesh(maxV) {
    this.f = new Float32Array(maxV * 5);
    this.c = new Uint8Array(maxV * 4);
    this.i = new Uint32Array(Math.ceil(maxV * 1.5));
    this.nv = 0;
    this.ni = 0;
    this.start = null;
  }
  Mesh.prototype.v = function (p, u, v, c, sh, a) {
    const n = this.nv++, o = n * 5, q = n * 4;
    this.f[o] = p[0]; this.f[o + 1] = p[1]; this.f[o + 2] = p[2]; this.f[o + 3] = u; this.f[o + 4] = v;
    this.c[q] = Math.min(255, c[0] * sh); this.c[q + 1] = Math.min(255, c[1] * sh); this.c[q + 2] = Math.min(255, c[2] * sh);
    this.c[q + 3] = a == null ? 255 : a;
    return n;
  };
  Mesh.prototype.quad = function (a, b, c, d) {
    const i = this.i, n = this.ni;
    i[n] = a; i[n + 1] = b; i[n + 2] = c; i[n + 3] = a; i[n + 4] = c; i[n + 5] = d;
    this.ni += 6;
  };
  Mesh.prototype.upload = function () {
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const b1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b1);
    gl.bufferData(gl.ARRAY_BUFFER, this.f.subarray(0, this.nv * 5), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    const b2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b2);
    gl.bufferData(gl.ARRAY_BUFFER, this.c.subarray(0, this.nv * 4), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 4, 0);
    const b3 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.i.subarray(0, this.ni), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.bufs = [b1, b2, b3];
    this.f = this.c = this.i = null;
  };
  Mesh.prototype.draw = function (s0, s1) {
    const a = this.start[s0], n = this.start[s1] - a;
    if (n <= 0) return;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_INT, a * 4);
  };
  Mesh.prototype.free = function () {
    if (!this.vao) return;
    gl.deleteVertexArray(this.vao);
    for (const b of this.bufs) gl.deleteBuffer(b);
  };

  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k, p[2] + v[2] * k];
  const crossv = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dotv = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const normv = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  /* Strecke aufbauen: Raumkurve mit Rahmen (Ort, rechts, oben, vorn) je Segmentgrenze, daraus die Netze.
     Es werden gut zwei Runden hintereinander gelegt, damit man über Start/Ziel hinaus sieht. */
  function build() {
    if (!ready) return;
    if (T) {
      for (const m of T.meshes) m.free();
      gl.deleteTexture(T.farTex);
      if (T.cloudTex) gl.deleteTexture(T.cloudTex);
    }
    const N = segments.length, total = 2 * N + VIEW + BEHIND + 8;
    const P = new Float32Array((total + 2) * 3), Rr = new Float32Array((total + 2) * 3);
    const Uu = new Float32Array((total + 2) * 3), Ff = new Float32Array((total + 2) * 3);
    const put = (A, k, v) => { A[k * 3] = v[0]; A[k * 3 + 1] = v[1]; A[k * 3 + 2] = v[2]; };

    let psi = 0, x = 0, z = 0, lapPsi = 0, k = 0;
    while (k <= total) {
      const s = segments[k % N];
      if (k === N) lapPsi = psi;
      const L = s.loop, sn = Math.sin(psi), cs = Math.cos(psi);
      if (L && s.index === L.i0) {                           // Looping: Kreis in der Fahrtrichtung, seitlich versetzt
        const y0 = s.p1.world.y;
        for (let j = 0; j <= L.n && k + j <= total + 1; j++) {
          const th = TAU * j / L.n, c = Math.cos(th), si = Math.sin(th), lat = L.S * j / L.n;
          put(P, k + j, [x + sn * L.R * si + cs * lat, y0 + L.R * (1 - c), z + cs * L.R * si - sn * lat]);
          put(Ff, k + j, [sn * c, si, cs * c]);
          put(Uu, k + j, [-sn * si, c, -cs * si]);
          put(Rr, k + j, [cs, 0, -sn]);
        }
        x += cs * L.S;
        z -= sn * L.S;
        k += L.n;
        continue;
      }
      let dy = s.p2.world.y - s.p1.world.y;
      if (Math.abs(dy) > 260) dy = 0;                        // Abbruchkanten zählen nicht als Gefälle
      const fl = Math.hypot(SEG_LEN, dy);
      const f = [sn * SEG_LEN / fl, dy / fl, cs * SEG_LEN / fl], r = [cs, 0, -sn], u = crossv(f, r);
      const prev = segments[(k - 1 + N) % N];
      const beta = s.ramp || s.gap || prev.loop ? 0 : -(prev.curve + s.curve) * 0.5 * BANK_K;
      const cb = Math.cos(beta), sb = Math.sin(beta);
      put(P, k, [x, s.p1.world.y, z]);
      put(Ff, k, f);
      put(Rr, k, [r[0] * cb + u[0] * sb, r[1] * cb + u[1] * sb, r[2] * cb + u[2] * sb]);
      put(Uu, k, [u[0] * cb - r[0] * sb, u[1] * cb - r[1] * sb, u[2] * cb - r[2] * sb]);
      x += sn * SEG_LEN;
      z += cs * SEG_LEN;
      psi += s.curve * CURVE_K;
      k++;
    }

    /* Tiefebene: liegt überall unter dem tiefsten Punkt der Strecke, den man von dort aus sieht – so steigt Wasser
       oder Lava nie über die Fahrbahn. Die Böschungen reichen jeweils bis unter die Ebene. */
    const wrap = i => (i < 0 ? i + N : i > total ? i - N : i);
    const low = new Float32Array(total + 1), baseY = new Float32Array(total + 2), skirtY = new Float32Array(total + 2);
    for (let i = 0; i <= total; i++) {
      let m = Infinity;
      for (let j = i - 60; j <= i + VIEW + 30; j++) m = Math.min(m, P[wrap(j) * 3 + 1]);
      low[i] = m;
    }
    for (let i = 0; i <= total; i++) {
      let sum = 0;
      for (let j = i - 30; j <= i + 30; j++) sum += low[wrap(j)];
      baseY[i] = sum / 61 - BASE_GAP;
    }
    for (let i = 0; i <= total; i++) {
      let m = Infinity;
      for (let j = i - VIEW - 2; j <= i + BEHIND + 2; j++) m = Math.min(m, baseY[wrap(j)]);
      skirtY[i] = m - 160;
    }
    baseY[total + 1] = baseY[total];
    skirtY[total + 1] = skirtY[total];

    /* Bezugshöhe für die Kamera: die Fahrbahn ohne Schanzen und Schluchten (berechnet in loadTrack, track.js);
       im Looping gilt die echte Ringbahn. */
    const ref = new Float32Array(total + 2);
    for (let i = 0; i <= total + 1; i++) {
      const s = segments[i % N];
      ref[i] = s.loop ? P[Math.min(i, total) * 3 + 1] : s.ref;
    }
    const inner = new Int8Array(N);                          // Seite, auf der neben einem Looping die andere Bahn liegt
    for (const L of loops) {
      const sg = L.S < 0 ? -1 : 1, m = Math.ceil(L.R / SEG_LEN) + 8;
      for (let j = 0; j < L.n; j++) inner[(L.i0 + j) % N] = j < L.n / 2 ? sg : -sg;
      for (let j = 1; j <= m; j++) {
        inner[((L.i0 - j) % N + N) % N] = sg;
        inner[(L.i0 + L.n - 1 + j) % N] = -sg;
      }
    }

    const at = (A, i) => [A[i * 3], A[i * 3 + 1], A[i * 3 + 2]];
    const RW = ROAD_W;
    const terr = new Mesh(total * 12), road = new Mesh(total * 12), rails = new Mesh(total * 8);
    const deco = new Mesh(total * 2 + 400), pads = new Mesh(total * 2 + 400), check = new Mesh(64);
    for (const m of [terr, road, rails, deco, pads, check]) m.start = new Int32Array(total + 2);
    const white = [255, 255, 255];

    for (k = 0; k < total; k++) {
      const s = segments[k % N], c = s.col;
      for (const m of [terr, road, rails, deco, pads, check]) m.start[k] = m.ni;
      const pa = at(P, k), pb = at(P, k + 1), ra = at(Rr, k), rb = at(Rr, k + 1), ua = at(Uu, k), ub = at(Uu, k + 1);
      const sh = 0.64 + 0.36 * Math.max(0, dotv(ua, LIGHT));
      const edge = (p, r, u, o, lift) => add(add(p, r, o * RW), u, lift);

      if (!s.loop) {                                         // Gelände: Böschung – Ebene – unter der Fahrbahn – Ebene – Böschung
        const wz = WATER_ZONES[track.zones[s.zone].name] ? PIER_W : TERR_W;
        const g = rgb(c.ground);
        const row = (p, r, u, low) => {
          const rh = normv([r[0], 0, r[2]]);
          const pts = [
            [p[0] - rh[0] * (wz + SKIRT) * RW, low, p[2] - rh[2] * (wz + SKIRT) * RW],
            [p[0] - rh[0] * wz * RW, p[1] - 14, p[2] - rh[2] * wz * RW],
            edge(p, r, u, -1.15, -14), edge(p, r, u, 1.15, -14),
            [p[0] + rh[0] * wz * RW, p[1] - 14, p[2] + rh[2] * wz * RW],
            [p[0] + rh[0] * (wz + SKIRT) * RW, low, p[2] + rh[2] * (wz + SKIRT) * RW],
          ];
          const shs = [0.42, 0.78, 1, 1, 0.78, 0.42];
          return pts.map((q, i) => terr.v(q, q[0] / 3200, q[2] / 3200, g, sh * (s.gap ? 1 : shs[i])));
        };
        const A = row(pa, ra, ua, skirtY[k]), B = row(pb, rb, ub, skirtY[k + 1]);
        for (let i = 0; i < 5; i++) terr.quad(A[i], A[i + 1], B[i + 1], B[i]);
      }

      if (!s.gap) {                                          // Fahrbahn mit Randstreifen
        // Belag der Zone aus dem Atlas, von ihr getönt; Schanzenkante und Randstreifen nehmen die schlichte Kachel
        const si = SURF.indexOf(track.zones[s.zone].surf), sid = s.launch ? 0 : si < 0 ? 1 : si;
        const rc = s.launch ? white : rgb(c.tint), ru = rgb(c.rumble), up = surfU(0, 0.5);
        const v0 = k / SURF_LEN, v1 = (k + 1) / SURF_LEN;
        const q = (o1, o2, u1, u2, col) => road.quad(
          road.v(edge(pa, ra, ua, o1, 0), u1, v0, col, sh), road.v(edge(pa, ra, ua, o2, 0), u2, v0, col, sh),
          road.v(edge(pb, rb, ub, o2, 0), u2, v1, col, sh), road.v(edge(pb, rb, ub, o1, 0), u1, v1, col, sh));
        q(-1, 1, surfU(sid, 0), surfU(sid, 1), rc);
        q(-1.075, -1, up, up, ru);
        q(1, 1.075, up, up, ru);

        // Leitplanken
        const rl = rgb(c.rail);
        for (const sd of [-1, 1]) {
          rails.quad(
            rails.v(edge(pa, ra, ua, sd * 1.075, 0), k, 1, rl, 1, s.dark ? 150 : 205), rails.v(edge(pb, rb, ub, sd * 1.075, 0), k + 1, 1, rl, 1, s.dark ? 150 : 205),
            rails.v(edge(pb, rb, ub, sd * 1.075, RAIL_H), k + 1, 0, rl, 1, 255), rails.v(edge(pa, ra, ua, sd * 1.075, RAIL_H), k, 0, rl, 1, 255));
        }

        if (s.ramp && !s.launch) {
          deco.quad(deco.v(edge(pa, ra, ua, -1, 5), 0, k * 0.5, white, sh), deco.v(edge(pa, ra, ua, 1, 5), 4, k * 0.5, white, sh),
            deco.v(edge(pb, rb, ub, 1, 5), 4, (k + 1) * 0.5, white, sh), deco.v(edge(pb, rb, ub, -1, 5), 0, (k + 1) * 0.5, white, sh));
        }
        if (s.index < 2) {
          check.quad(check.v(edge(pa, ra, ua, -1, 5), 0, s.index * 0.5, white, 1), check.v(edge(pa, ra, ua, 1, 5), 1, s.index * 0.5, white, 1),
            check.v(edge(pb, rb, ub, 1, 5), 1, s.index * 0.5 + 0.5, white, 1), check.v(edge(pb, rb, ub, -1, 5), 0, s.index * 0.5 + 0.5, white, 1));
        }
        let pd = s.pad;
        if (!pd && s.loop && s.index - s.loop.i0 < 16) pd = { x: 0, w: 0.45 };      // Leuchtpfeile am Einstieg ins Looping
        if (pd) {
          pads.quad(pads.v(edge(pa, ra, ua, pd.x - pd.w, 7), 0, -k * 0.5, white, 1), pads.v(edge(pa, ra, ua, pd.x + pd.w, 7), 1, -k * 0.5, white, 1),
            pads.v(edge(pb, rb, ub, pd.x + pd.w, 7), 1, -(k + 1) * 0.5, white, 1), pads.v(edge(pb, rb, ub, pd.x - pd.w, 7), 0, -(k + 1) * 0.5, white, 1));
        }
      }
    }
    for (const m of [terr, road, rails, deco, pads, check]) { m.start[total] = m.start[total + 1] = m.ni; m.upload(); }

    const th = THEMES[track.theme] || THEMES.city, far = theme.far;
    const sun = th.sun || th.moon, base = BASES[track.id] || ['#3a4a5a', 0];
    const saz = sun ? (sun.x - 640) / 640 : 0.6, sel = sun ? Math.atan((322 - sun.y) / 640) : 0.5;
    const col3 = s => (s ? s.split(',').map(v => +v / 255) : [1, 1, 1]);
    T = {
      N, total, P, R: Rr, U: Uu, F: Ff, baseY, skirtY, inner, ref, lapPsi, yaw: 0, onB: false, ce: 0, cb: 0,
      meshes: [terr, road, rails, deco, pads, check], terr, road, rails, deco, pads, check,
      sky: th.sky.map(h => hexRgb(h).map(v => v / 255)), fog: hexRgb(theme.fog).map(v => v / 255),
      sunDir: [Math.sin(saz) * Math.cos(sel), Math.sin(sel), Math.cos(saz) * Math.cos(sel)],
      sunCore: th.sun ? col3(th.sun.core) : th.moon ? col3(th.moon.col) : [0, 0, 0],
      sunGlow: th.sun ? col3(th.sun.glow) : th.moon ? col3(th.moon.col).map(v => v * 0.35) : [0, 0, 0],
      sunSize: th.sun ? 0.9993 : th.moon ? 0.9989 : 2,
      stars: th.stars ? Math.min(0.3, th.stars / 900) : 0,
      farTex: texFrom(far, { repeat: 's' }), farH: Math.sin(Math.atan(far.height / 640)), farRep: Math.max(1, Math.round(TAU * 640 / far.width)),
      cloudTex: theme.clouds ? texFrom(theme.clouds, { repeat: 's' }) : null,
      base: hexRgb(base[0]), baseMode: base[1],
    };
    camS.init = false;
  }

  /* ================= Lage auf der Strecke ================= */
  function frame(e, o) {
    const i = Math.floor(e), t = e - i, a = i * 3, b = a + 3, P = T.P, R = T.R, U = T.U, F = T.F;
    for (let j = 0; j < 3; j++) {
      o.p[j] = P[a + j] + (P[b + j] - P[a + j]) * t;
      o.r[j] = R[a + j] + (R[b + j] - R[a + j]) * t;
      o.u[j] = U[a + j] + (U[b + j] - U[a + j]) * t;
      o.f[j] = F[a + j] + (F[b + j] - F[a + j]) * t;
    }
    return o;
  }

  /* Wo die Kamera in der doppelt gelegten Strecke steht. Beim Wechsel zurück auf die erste Runde dreht sich
     die Welt um den Rundenwinkel – der Himmel dreht mit, damit man nichts davon merkt. */
  function locate() {
    const cb = mod(cam.z, TRACK_LEN) / SEG_LEN;
    const onB = cb < BEHIND + 2;
    if (T.onB && !onB) T.yaw -= T.lapPsi;
    T.onB = onB;
    T.cb = cb;
    T.ce = onB ? cb + T.N : cb;
  }

  /* Streckenposition -> Index in der doppelt gelegten Strecke (NaN = außer Sicht) */
  function ext(z) {
    let d = mod(z, TRACK_LEN) / SEG_LEN - T.cb;
    d = ((d % T.N) + T.N) % T.N;
    if (d > T.N - BEHIND) d -= T.N;
    return d > VIEW - 2 ? NaN : T.ce + d;
  }

  /* ================= Kamera ================= */
  const refAt = e => { const i = Math.floor(e); return lerp(T.ref[i], T.ref[i + 1], e - i); };
  /* 1 = normale Bahn (Kamera senkrecht darüber), 0 = im Looping (Kamera folgt der Bahn); weicher Übergang */
  const flatOf = uy => { const t = clamp((uy - 0.25) / 0.63, 0, 1); return t * t * (3 - 2 * t); };
  function tick(dt) {
    if (!ready || !T || !player) return;
    locate();
    const p = player, ep = ext(p.z);
    if (isNaN(ep)) return;
    frame(T.ce, fc);
    camS.pOff = camS.off;
    camS.pLa = camS.la;
    // Höhe: folgt dem Fahrer, im Sprung und auf Schanzen aber nur zu gut drei Vierteln; nie zu dicht über der Bahn
    // unter der Kamera. Gemerkt wird die Höhe über der Bezugsbahn – so fährt die Kamera Hügel und Ring ohne Nachhängen mit.
    const refC = refAt(T.ce), onRing = !!segments[Math.floor(T.cb) % T.N].loop;
    const hRef = Math.max(0, p.yAbs - refAt(ep));
    // Der Rückstand wächst mit der Flughöhe, aber nur bis gut 600 Einheiten: Bei Klippensprüngen hoch über der Bahn
    // bliebe der Fahrer sonst weit über der Kamera.
    const want = Math.max(p.yAbs + CAM_H - 620 * Math.tanh(0.22 * hRef / 620) - refC, onRing ? CAM_H * fc.u[1] : 420);
    camS.pHi = camS.hi;
    camS.hi = hRef;
    let la = 900;                                           // Blick weit voraus – in engen Kurven und Loopings näher
    for (let d = 1200; d <= 7000; d += 290) {
      const e = ext(p.z + d);
      if (isNaN(e)) break;
      frame(e, fq);
      if (dotv(fq.f, fc.f) < 0.82) break;
      la = d;
    }
    if (!camS.init || Math.abs(camS.off - want) > 3000) {   // Start oder Sprung an eine andere Stelle: sofort hin
      camS.off = camS.pOff = want;
      camS.la = camS.pLa = la;
      camS.laV = 0;
      camS.pHi = hRef;
      camS.init = true;
    } else {
      // Bei sehr schnellem Steigen oder Fallen (Riesensprünge) höchstens 520 Einheiten nachhängen – sonst rutscht
      // der Fahrer kurz vor der Landung unten aus dem Bild
      camS.off = clamp(damp(camS.off, want, 14, dt), want - 520, want + 520);
      // Blickweite federnd nachführen: Wert und Tempo bleiben stetig, auch wenn das Ziel springt
      camS.laV += (30 * (la - camS.la) - 11 * camS.laV) * dt;
      camS.la += camS.laV * dt;
    }
  }

  /* a = Anteil des laufenden Schritts (Zwischenbild, siehe game.js) */
  function setCamera(a) {
    const p = player;
    frame(T.ce, fc);
    const off = lerp(camS.pOff, camS.off, a), la = lerp(camS.pLa, camS.la, a);
    const flat = flatOf(fc.u[1]);
    // Auf normaler Bahn steht die Kamera senkrecht über der Fahrbahn (kein Zucken an Rampen und in Schräglage),
    // im Looping folgt sie der Bahn-Senkrechten.
    const lp = add(fc.p, fc.r, cam.x), tilt = CAM_H * (1 - flat);
    const c = [lp[0] + fc.u[0] * tilt, lerp(lp[1] + fc.u[1] * CAM_H, refAt(T.ce) + off, flat), lp[2] + fc.u[2] * tilt];
    if (shake > 0.3) {
      c[0] += (Math.random() - 0.5) * shake * 3;
      c[1] += (Math.random() - 0.5) * shake * 3;
    }
    let e = ext(p.z + la);
    if (isNaN(e)) e = T.ce + 20;
    frame(e, fq);
    const q = add(fq.p, fq.u, 150);
    q[1] += refAt(e) - fq.p[1];                              // Schanzen und Schluchten lenken den Blick nicht ab
    // Hoch in der Luft (Riesenschanze, Klippensprung) nicht steil hinunter auf die ferne Bahn schauen: Der Blick hebt
    // sich so weit, dass der Fahrer im oberen Bilddrittel bleibt statt oben aus dem Bild zu fliegen.
    const wHi = clamp((lerp(camS.pHi, camS.hi, a) - 1500) / 1500, 0, 1);
    const eR = wHi > 0 ? ext(p.z) : NaN;
    if (!isNaN(eR)) {
      frame(eR, fq);
      const lim = c[1] + Math.hypot(q[0] - c[0], q[2] - c[2]) * ((fq.p[1] + p.h - c[1]) / CAM_D - 0.2);
      if (q[1] < lim) q[1] = lerp(q[1], lim, wHi);
    }
    const f = normv([q[0] - c[0], q[1] - c[1], q[2] - c[2]]);
    const hint = normv([fc.u[0] * (1 - 0.45 * flat), fc.u[1] * (1 - 0.45 * flat) + 0.45 * flat, fc.u[2] * (1 - 0.45 * flat)]);
    const r = normv(crossv(hint, f)), u = crossv(f, r);
    cam3.c = c; cam3.r = r; cam3.u = u; cam3.f = f;
    const tan = (H / 2) / focal, asp = W / H, near = 80, farZ = VIEW * SEG_LEN * 1.5;
    cam3.tan = tan;
    const fy = 1 / tan, fx = fy / asp, A = (farZ + near) / (near - farZ), B = 2 * farZ * near / (near - farZ);
    // Sicht-Projektion in einem Schritt: Sichtraum x = r·(p−c), y = u·(p−c), z = −f·(p−c)
    const tx = -dotv(r, c), ty = -dotv(u, c), tz = dotv(f, c);
    const m = cam3.vp;
    m[0] = fx * r[0]; m[1] = fy * u[0]; m[2] = -A * f[0]; m[3] = f[0];
    m[4] = fx * r[1]; m[5] = fy * u[1]; m[6] = -A * f[1]; m[7] = f[1];
    m[8] = fx * r[2]; m[9] = fy * u[2]; m[10] = -A * f[2]; m[11] = f[2];
    m[12] = fx * tx; m[13] = fy * ty; m[14] = A * tz + B; m[15] = -tz;
  }

  /* Weltpunkt -> Bildschirm (logische 1280×720). k = Pixel je Welt-Einheit in dieser Tiefe */
  function project(p, o) {
    const m = cam3.vp;
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    o.vis = w > 100;
    if (!o.vis) return o;
    o.x = ((m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w * 0.5 + 0.5) * W;
    o.y = (0.5 - (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w * 0.5) * H;
    o.k = focal / w;
    o.w = w;
    return o;
  }

  /* ================= Bewegliche Tafeln ================= */
  function batch(key) {
    let b = batches.get(key);
    if (!b) { b = { d: new Float32Array(9 * 6 * 64), n: 0 }; batches.set(key, b); }
    return b;
  }
  /* Viereck: p = unten links, ex/ey = Kanten; uv: (u0,v0) oben links … (u1,v1) unten rechts */
  function quad(b, p, ex, ey, u0, v0, u1, v1, r, g, bl, a) {
    if ((b.n + 6) * 9 > b.d.length) { const d = new Float32Array(b.d.length * 2); d.set(b.d); b.d = d; }
    const d = b.d;
    const put = (x, y, z, u, v) => {
      const o = b.n++ * 9;
      d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = u; d[o + 4] = v; d[o + 5] = r; d[o + 6] = g; d[o + 7] = bl; d[o + 8] = a;
    };
    const x1 = p[0] + ex[0], y1 = p[1] + ex[1], z1 = p[2] + ex[2];
    const x2 = x1 + ey[0], y2 = y1 + ey[1], z2 = z1 + ey[2];
    const x3 = p[0] + ey[0], y3 = p[1] + ey[1], z3 = p[2] + ey[2];
    put(p[0], p[1], p[2], u0, v1); put(x1, y1, z1, u1, v1); put(x2, y2, z2, u1, v0);
    put(p[0], p[1], p[2], u0, v1); put(x2, y2, z2, u1, v0); put(x3, y3, z3, u0, v0);
  }
  function flush(key, texture) {
    const b = batches.get(key);
    if (!b || !b.n) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(dynVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    gl.bufferData(gl.ARRAY_BUFFER, b.d.subarray(0, b.n * 9), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, b.n);
    b.n = 0;
  }
  function mode(m, cut, uvx, uvy) {
    gl.uniform1i(um.uMode, m);
    gl.uniform1f(um.uCut, cut || 0);
    gl.uniform2f(um.uUvOff, uvx || 0, uvy || 0);
  }

  const scr = { x: 0, y: 0, k: 0, w: 0, vis: false };
  const actors = [];

  /* ================= Bild zeichnen ================= */
  function draw(a) {
    if (!ready || !T || !player) return false;
    const w = canvas.width, h = canvas.height;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    locate();
    if (!camS.init) tick(0);
    setCamera(a == null ? 1 : a);
    const N = T.N, e0 = Math.max(0, Math.floor(T.ce) - BEHIND), e1 = Math.min(T.total, Math.floor(T.ce) + VIEW);
    const c = cam3.c, RW = ROAD_W;

    gl.viewport(0, 0, w, h);
    gl.clearColor(T.fog[0], T.fog[1], T.fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);

    /* ---------- Himmel ---------- */
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);
    gl.useProgram(pSky.p);
    gl.uniform3fv(us.uR, cam3.r); gl.uniform3fv(us.uU, cam3.u); gl.uniform3fv(us.uF, cam3.f);
    gl.uniform3fv(us.uZen, T.sky[0]); gl.uniform3fv(us.uMid, T.sky[1]); gl.uniform3fv(us.uHor, T.sky[2]); gl.uniform3fv(us.uFog, T.fog);
    const cy = Math.cos(T.yaw), sy = Math.sin(T.yaw), sdv = T.sunDir;
    gl.uniform3f(us.uSunDir, sdv[0] * cy + sdv[2] * sy, sdv[1], sdv[2] * cy - sdv[0] * sy);
    gl.uniform3fv(us.uSunCore, T.sunCore); gl.uniform3fv(us.uSunGlow, T.sunGlow);
    gl.uniform1f(us.uSunSize, T.sunSize); gl.uniform1f(us.uStars, T.stars);
    gl.uniform1f(us.uTan, cam3.tan); gl.uniform1f(us.uAspect, W / H); gl.uniform1f(us.uYaw, T.yaw); gl.uniform1f(us.uTime, gameT);
    gl.uniform1f(us.uFarH, T.farH); gl.uniform1f(us.uFarRep, T.farRep); gl.uniform1f(us.uCloudOn, T.cloudTex ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.farTex); gl.uniform1i(us.uFar, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.cloudTex || tex.white); gl.uniform1i(us.uCloud, 1);
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);

    /* ---------- Welt ---------- */
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.useProgram(pMesh.p);
    gl.uniformMatrix4fv(um.uVP, false, cam3.vp);
    gl.uniform3fv(um.uFog, T.fog);
    gl.uniform1f(um.uFogD, FOG_D);
    gl.uniform1f(um.uTime, gameT);
    gl.uniform1f(um.uFlip, FRONT);
    gl.uniform1i(um.uTex, 0);

    // Tiefebene unter allem: folgt der Kamera, liegt immer ein Stück unter der Fahrbahn
    const bi = Math.floor(T.ce), by = lerp(T.baseY[bi], T.baseY[bi + 1], T.ce - bi), S = 150000, bb = batch('base'), bc = T.base;
    quad(bb, [c[0] - S, by, c[2] - S], [2 * S, 0, 0], [0, 0, 2 * S],
      (c[0] - S) / 5200, (c[2] + S) / 5200, (c[0] + S) / 5200, (c[2] - S) / 5200, bc[0] / 255, bc[1] / 255, bc[2] / 255, 1);
    mode(T.baseMode);
    flush('base', tex.ground);

    mode(0);
    gl.bindTexture(gl.TEXTURE_2D, tex.ground);
    T.terr.draw(e0, e1);
    mode(1);
    gl.bindTexture(gl.TEXTURE_2D, tex.road);
    T.road.draw(e0, e1);

    // Aufgemaltes knapp über der Fahrbahn
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-2, -2);
    mode(0);
    gl.bindTexture(gl.TEXTURE_2D, tex.ramp);
    T.deco.draw(e0, e1);
    gl.bindTexture(gl.TEXTURE_2D, tex.checker);
    T.check.draw(e0, e1);
    mode(0, 0, 0, gameT * 3.2);
    gl.bindTexture(gl.TEXTURE_2D, tex.pad);
    T.pads.draw(e0, e1);

    /* ---------- Kulissen, Fallen, Orbs ---------- */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const rh = normv([cam3.r[0], 0, cam3.r[2]]);
    const names = [], glow = [];
    const hzB = batch('hz');
    for (let ei = e0; ei < e1; ei++) {
      const s = segments[ei % N];
      const hz = s.hz;
      if (hz && hz.until > gameT) {                          // Götter-Falle: leuchtende Fläche auf der Bahn
        frame(ei, fa);
        frame(ei + 1, fb);
        const col = hexRgb(HZ[hz.type].col), pulse = 0.62 + 0.28 * Math.sin(gameT * 14);
        for (const hx of hz.xs) {
          const p0 = add(add(fa.p, fa.r, (hx - hz.w) * RW), fa.u, 9);
          const ex = [fa.r[0] * hz.w * 2 * RW, fa.r[1] * hz.w * 2 * RW, fa.r[2] * hz.w * 2 * RW];
          const p1 = add(add(fb.p, fb.r, (hx - hz.w) * RW), fb.u, 9);
          quad(hzB, p0, ex, [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], 0, 0, 1, 1, col[0] / 255, col[1] / 255, col[2] / 255, pulse);
        }
      }
      if (!s.sprites.length && !(s.hzHead && s.hzHead.until > gameT)) continue;
      frame(ei, fa);
      const wz = WATER_ZONES[track.zones[s.zone].name] ? PIER_W : TERR_W;
      if (s.hzHead && s.hzHead.until > gameT) {              // Leuchtsäule über der Falle
        const d = SPR[HZ[s.hzHead.type].fx], key = 'g:' + HZ[s.hzHead.type].fx;
        if (glow.indexOf(key) < 0) glow.push(key);
        const a = 0.8 + 0.2 * Math.sin(gameT * 30);
        for (const hx of s.hzHead.xs) {
          const base = add(fa.p, fa.r, hx * RW);
          quad(batch(key), add(base, rh, -d.w * 0.75), [rh[0] * d.w * 1.5, 0, rh[2] * d.w * 1.5], [0, d.h * 1.5, 0], 0, 0, 1, 1, 1, 1, 1, a);
        }
      }
      for (const sp of s.sprites) {
        if (sp.gone > gameT) continue;
        const d = SPR[sp.name], ax = Math.abs(sp.x);
        if (sp.x * T.inner[ei % N] > 1.2) continue;          // dort verläuft die Bahn nach bzw. vor dem Looping
        let base, upv, rv;
        if (s.loop) {                                        // im Looping stehen die Dinge auf der Ringbahn
          if (ax > 1.2 && fa.u[1] < 0.9) continue;           // Kulissen nur unten am Einstieg, nicht quer im Ring
          base =add(add(fa.p, fa.r, sp.x * RW), fa.u, sp.yOff);
          upv = fa.u;
          rv = fa.r;
        } else {
          rv = rh;
          upv = [0, 1, 0];
          if (ax <= 1.5) base = add(add(fa.p, fa.r, sp.x * RW), fa.u, sp.yOff);
          else {
            const hr = normv([fa.r[0], 0, fa.r[2]]);
            const y = ax <= wz ? fa.p[1] : Math.max(by, lerp(fa.p[1], T.skirtY[ei], Math.min(1, (ax - wz) / SKIRT)));
            base = [fa.p[0] + hr[0] * sp.x * RW, y + sp.yOff, fa.p[2] + hr[2] * sp.x * RW];
          }
        }
        if (sp.pick) base = add(base, upv, Math.sin(gameT * 4 + sp.seed) * 25);
        // direkt vor der Kamera blenden Tafeln aus, statt riesig durchs Bild zu wischen
        const near = clamp(((base[0] - c[0]) * cam3.f[0] + (base[1] - c[1]) * cam3.f[1] + (base[2] - c[2]) * cam3.f[2] - 260) / 640, 0, 1);
        if (near <= 0) continue;
        const soft = sp.pick || sp.name === 'wisp' || sp.name === 'puff';
        const key = (soft ? 'g:' : 's:') + sp.name;
        const list = soft ? glow : names;
        if (list.indexOf(key) < 0) list.push(key);
        const p0 = add(base, rv, -d.w / 2);
        quad(batch(key), p0, [rv[0] * d.w, rv[1] * d.w, rv[2] * d.w], [upv[0] * d.h, upv[1] * d.h, upv[2] * d.h],
          sp.flip ? 1 : 0, 0, sp.flip ? 0 : 1, 1, 1, 1, 1, near);
      }
    }
    gl.depthMask(false);
    mode(2);
    flush('hz', tex.white);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.depthMask(true);
    mode(0, 0.35);
    for (const key of names) flush(key, spriteTex(key.slice(2)));

    /* ---------- Fahrer (und Echos im Bosskampf) ---------- */
    actors.length = 0;
    const all = boss && boss.shots.length ? racers.concat(boss.shots) : racers;
    for (const r of all) {
      r.sv = false;
      const e = ext(r.z);
      if (isNaN(e) || e < e0 + 1) continue;
      frame(e, fa);
      // Die Flughöhe zählt senkrecht nach oben, nicht entlang der Bahn-Senkrechten: Hoch über steilem Gefälle
      // (Klippensprung) stünde der Fahrer sonst weit vor seinem wirklichen Ort.
      const pos = add(add(fa.p, fa.r, r.x * RW), [0, 1, 0], r.h);
      const dz = (pos[0] - c[0]) * cam3.f[0] + (pos[1] - c[1]) * cam3.f[1] + (pos[2] - c[2]) * cam3.f[2];
      if (dz < 150) continue;
      actors.push({ r, pos, dz, u: fa.u.slice(), rr: fa.r.slice(), f: fa.f.slice(), ground: add(add(fa.p, fa.r, r.x * RW), fa.u, 10) });
    }
    actors.sort((a, b) => b.dz - a.dz);
    if (actors.length > 16) actors.splice(0, actors.length - 16);
    atlasCtx.clearRect(0, 0, atlasCv.width, atlasCv.height);
    const sb = batch('shadow'), ab = batch('riders');
    actors.forEach((a, i) => {
      const r = a.r, cx = (i % 4) * CELL_W, cyy = Math.floor(i / 4) * CELL_H;
      const size = RIDER_SCALE * (r.pal.size || 1) * (r.big || 1);
      atlasCtx.save();
      atlasCtx.beginPath();
      atlasCtx.rect(cx, cyy, CELL_W, CELL_H);
      atlasCtx.clip();
      atlasCtx.globalAlpha = (r.pal.ghost || 1) * (r.fade == null ? 1 : r.fade);
      drawRider(atlasCtx, cx + CELL_OX, cyy + CELL_OY, CELL_S, {
        pal: r.pal, lean: r.lean, t: gameT, phase: r.phase, drift: r.driftVis,
        boost: r.boostT > 0, thrust: r.speed / MAX_SPEED, trick: r.trick, stumble: r.stumbleT > 0,
        cr: r.cr, sq: r.sq, armUp: r.armUp, bo: r.bo, vy: r.air ? r.vy : 0,
      });
      atlasCtx.restore();
      // Tafel: steht auf der Fahrbahn-Senkrechten, dreht sich zur Kamera
      const upv = a.u, rr = normv([cam3.r[0] - upv[0] * dotv(cam3.r, upv), cam3.r[1] - upv[1] * dotv(cam3.r, upv), cam3.r[2] - upv[2] * dotv(cam3.r, upv)]);
      const wu = CELL_W / CELL_S * size, hu = CELL_H / CELL_S * size, below = (CELL_H - CELL_OY) / CELL_S * size;
      const p0 = add(add(a.pos, rr, -wu / 2), upv, -below);
      quad(ab, p0, [rr[0] * wu, rr[1] * wu, rr[2] * wu], [upv[0] * hu, upv[1] * hu, upv[2] * hu],
        cx / atlasCv.width, cyy / atlasCv.height, (cx + CELL_W) / atlasCv.width, (cyy + CELL_H) / atlasCv.height, 1, 1, 1, 1);
      // Schatten auf der Bahn
      const sh = 1 / (1 + r.h / 700), sw = 24 * size * sh, sl = 20 * size * sh;
      const g0 = add(add(a.ground, a.rr, -sw), a.f, -sl);
      quad(sb, g0, [a.rr[0] * sw * 2, a.rr[1] * sw * 2, a.rr[2] * sw * 2], [a.f[0] * sl * 2, a.f[1] * sl * 2, a.f[2] * sl * 2],
        0, 0, 1, 1, 1, 1, 1, 0.42 * sh * (r.pal.ghost || 1));
      // für Namensschilder und Effekte im 2D-Bild darüber
      project(a.pos, scr);
      r.sv = scr.vis;
      r.sx = scr.x; r.sy = scr.y; r.sk = scr.k * size;
      if (r.isPlayer && scr.vis) { pScr.x = scr.x; pScr.y = scr.y; pScr.k = scr.k * size; }
    });
    gl.depthMask(false);
    mode(0);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    flush('shadow', tex.blob);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    for (const key of glow) flush(key, spriteTex(key.slice(2)));
    if (ab.n) {
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCv);
      mode(0, 0.02);
      flush('riders', atlasTex);
    }

    /* ---------- leuchtende Leitplanken ---------- */
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    mode(2);
    gl.bindTexture(gl.TEXTURE_2D, tex.rail);
    T.rails.draw(e0, e1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
    return true;
  }

  const FRONT = 1;               // Vorzeichen für die Erkennung der Fahrbahn-Unterseite
  let canvas = null;             // die 2D-Leinwand gibt die Größe vor

  /* onLost: wird gerufen, wenn der Browser die 3D-Grafik mitten im Betrieb entzieht */
  function init(glCanvas, sizeCanvas, onLost) {
    try {
      cv = glCanvas;
      canvas = sizeCanvas;
      gl = cv.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
      if (!gl) return false;
      aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      if (aniso) maxAniso = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      pMesh = program(VS_MESH, FS_MESH, ['uVP', 'uUvOff', 'uTex', 'uFog', 'uFogD', 'uCut', 'uTime', 'uMode', 'uFlip']);
      pSky = program(VS_SKY, FS_SKY, ['uR', 'uU', 'uF', 'uZen', 'uMid', 'uHor', 'uFog', 'uSunDir', 'uSunCore', 'uSunGlow',
        'uTan', 'uAspect', 'uYaw', 'uSunSize', 'uStars', 'uTime', 'uFarH', 'uFarRep', 'uCloudOn', 'uFar', 'uCloud']);
      um = pMesh.u;
      us = pSky.u;
      skyVao = gl.createVertexArray();
      dynVao = gl.createVertexArray();
      gl.bindVertexArray(dynVao);
      dynBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
      gl.bindVertexArray(null);
      makeTextures();
      atlasCv = document.createElement('canvas');
      atlasCv.width = CELL_W * 4;
      atlasCv.height = CELL_H * 4;
      atlasCtx = atlasCv.getContext('2d');
      atlasTex = texFrom(atlasCv, { mip: false });
      cv.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        ready = false;
        if (onLost) onLost();
      });
      ready = true;
    } catch (err) {
      console.warn('3D-Darstellung nicht verfügbar:', err.message);
      ready = false;
    }
    return ready;
  }

  return {
    init, build, tick, draw, project,
    get ready() { return ready && !!T; },
    info: () => T,
    get cam() { return cam3; },
  };
})();
