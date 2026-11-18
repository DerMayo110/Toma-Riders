'use strict';

/* Komplett synthetischer Sound (WebAudio) – keine Audiodateien nötig. */
const Sfx = (() => {
  let ac = null, master, sfx, mus, bassBus, noiseBuf;
  let muted = false;
  let eng = null;
  let musicOn = false, musicTimer = null, step = 0, nextT = 0;

  function init() {
    if (ac) {
      if (ac.state === 'suspended' && !init.held) ac.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ac = new AC();
    } catch (err) {
      ac = null;
      return;
    }
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.9;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = 0.55; mus.connect(master);
    bassBus = ac.createBiquadFilter(); bassBus.type = 'lowpass'; bassBus.frequency.value = 650; bassBus.connect(mus);

    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    startEngine();
  }

  function tone(o) {
    if (!ac) return;
    const t0 = ac.currentTime + Math.max(0, o.delay || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.att || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    g.connect(o.dest || sfx);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.03);
  }

  function noise(o) {
    if (!ac) return;
    const t0 = ac.currentTime + Math.max(0, o.delay || 0);
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.att || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || sfx);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + o.dur + 0.03);
  }

  /* ---------- Dauer-Sounds: Antrieb, Fahrtwind, Schleifen ---------- */
  function loopNoise(type, freq, q) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(sfx);
    src.start();
    return g;
  }

  function startEngine() {
    const o1 = ac.createOscillator(), o2 = ac.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'triangle';
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 4;
    const g = ac.createGain();
    g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(sfx);
    o1.start(); o2.start();
    eng = { o1, o2, f, g, wind: loopNoise('bandpass', 700, 0.6), scrape: loopNoise('bandpass', 2800, 1.6), drift: loopNoise('bandpass', 1700, 3) };
  }

  function engine(sp, boosting, on, scraping, drifting) {
    if (!ac || !eng) return;
    const t = ac.currentTime;
    const base = 60 + sp * 95 + (boosting ? 28 : 0);
    eng.o1.frequency.setTargetAtTime(base, t, 0.06);
    eng.o2.frequency.setTargetAtTime(base * 1.5 + 2, t, 0.06);
    eng.f.frequency.setTargetAtTime(350 + sp * 1500 + (boosting ? 900 : 0), t, 0.08);
    eng.g.gain.setTargetAtTime(on ? 0.03 + sp * 0.035 : 0, t, 0.1);
    eng.wind.gain.setTargetAtTime(on ? sp * sp * 0.05 : 0, t, 0.15);
    eng.scrape.gain.setTargetAtTime(on && scraping ? 0.13 : 0, t, 0.03);
    eng.drift.gain.setTargetAtTime(on && drifting ? 0.1 : 0, t, 0.04);
  }

  /* ---------- Musik: kleiner Step-Sequencer ---------- */
  const TUNES = [
    { bpm: 138, ch: [{ bass: 45, arp: [57, 60, 64, 69] }, { bass: 41, arp: [57, 60, 65, 69] }, { bass: 48, arp: [55, 60, 64, 67] }, { bass: 43, arp: [55, 59, 62, 67] }] },   // 0 Skyline
    { bpm: 132, ch: [{ bass: 40, arp: [56, 59, 64, 68] }, { bass: 41, arp: [57, 60, 65, 69] }, { bass: 38, arp: [57, 62, 65, 69] }, { bass: 40, arp: [56, 59, 64, 68] }] },   // 1 Hellas
    { bpm: 146, ch: [{ bass: 38, arp: [57, 62, 65, 69] }, { bass: 34, arp: [58, 62, 65, 70] }, { bass: 43, arp: [58, 62, 67, 70] }, { bass: 45, arp: [57, 61, 64, 69] }] },   // 2 Schmiede
    { bpm: 128, ch: [{ bass: 40, arp: [55, 59, 64, 67] }, { bass: 36, arp: [55, 60, 64, 67] }, { bass: 45, arp: [57, 60, 64, 69] }, { bass: 47, arp: [54, 59, 63, 66] }] },   // 3 Labyrinth
    { bpm: 120, ch: [{ bass: 36, arp: [55, 60, 63, 67] }, { bass: 44, arp: [56, 60, 63, 68] }, { bass: 41, arp: [56, 60, 65, 68] }, { bass: 43, arp: [55, 59, 62, 67] }] },   // 4 Unterwelt
    { bpm: 150, ch: [{ bass: 48, arp: [55, 60, 64, 67] }, { bass: 43, arp: [55, 59, 62, 67] }, { bass: 45, arp: [57, 60, 64, 69] }, { bass: 41, arp: [57, 60, 65, 69] }] },   // 5 Olymp
    { bpm: 156, ch: [{ bass: 45, arp: [57, 60, 64, 69] }, { bass: 41, arp: [57, 60, 65, 69] }, { bass: 38, arp: [57, 62, 65, 69] }, { bass: 40, arp: [56, 59, 64, 68] }] },   // 6 Finale
  ];
  let CHORDS = TUNES[0].ch;
  let STEP = 60 / TUNES[0].bpm / 4;
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function schedule() {
    if (!ac || !musicOn) return;
    if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.02;
    while (nextT < ac.currentTime + 0.14) {
      const s = step % 16, bar = Math.floor(step / 16) % 4, ch = CHORDS[bar];
      const loop = Math.floor(step / 64) % 2;
      const d = nextT - ac.currentTime;
      if (s % 4 === 0) tone({ f: 140, f2: 42, dur: 0.16, vol: 0.5, delay: d, dest: mus });
      if (s % 8 === 4) noise({ dur: 0.12, vol: 0.15, f: 1900, q: 0.7, delay: d, dest: mus });
      if (s % 2 === 1) noise({ dur: 0.03, vol: 0.045, f: 8000, type: 'highpass', delay: d, dest: mus });
      if (s % 2 === 0) tone({ type: 'sawtooth', f: mtof(ch.bass + (s % 8 === 6 ? 12 : 0)), dur: 0.15, vol: 0.2, delay: d, dest: bassBus });
      tone({ type: 'square', f: mtof(ch.arp[ARP[s]] + (loop ? 12 : 0)), dur: 0.09, vol: 0.032, delay: d, dest: mus });
      if (loop && s % 8 === 0) tone({ type: 'triangle', f: mtof(ch.arp[3] + 12), dur: 0.4, vol: 0.05, delay: d, dest: mus });
      step++;
      nextT += STEP;
    }
  }

  function musicStart() {
    if (!ac || musicOn) return;
    musicOn = true;
    step = 0;
    nextT = ac.currentTime + 0.06;
    musicTimer = setInterval(schedule, 30);
  }

  function musicStop() {
    musicOn = false;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  const ORB_SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

  return {
    init,
    engine,
    musicStart,
    musicStop,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (ac) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.02);
      return muted;
    },
    hold(on) {
      init.held = on;
      if (!ac) return;
      if (on) ac.suspend(); else ac.resume();
    },
    tune(i) {
      const t = TUNES[i] || TUNES[0];
      CHORDS = t.ch;
      STEP = 60 / t.bpm / 4;
    },
    duck(on) {
      if (ac) mus.gain.setTargetAtTime(on ? 0.3 : 0.55, ac.currentTime, 0.3);
    },
    blip() { tone({ type: 'triangle', f: 520 + Math.random() * 60, dur: 0.035, vol: 0.035 }); },
    snip() {
      noise({ dur: 0.05, vol: 0.4, f: 6000, type: 'highpass' });
      noise({ dur: 0.07, vol: 0.45, f: 5000, type: 'highpass', delay: 0.11 });
      tone({ f: 90, f2: 40, dur: 0.5, vol: 0.35, delay: 0.12 });
    },
    hazard() { tone({ type: 'sawtooth', f: 900, f2: 300, dur: 0.25, vol: 0.07 }); },
    zap() {
      noise({ dur: 0.35, vol: 0.5, f: 3000, f2: 600, q: 0.5 });
      tone({ type: 'sawtooth', f: 1400, f2: 80, dur: 0.3, vol: 0.2 });
    },
    rewind() {
      tone({ type: 'sawtooth', f: 200, f2: 1600, dur: 0.6, vol: 0.16 });
      noise({ dur: 0.7, vol: 0.25, f: 4000, f2: 400, q: 0.8 });
    },
    orb(n) {
      const f = 880 * Math.pow(2, ORB_SCALE[Math.min(n, ORB_SCALE.length - 1)] / 12);
      tone({ f, dur: 0.12, vol: 0.16 });
      tone({ f: f * 1.5, dur: 0.14, vol: 0.09, delay: 0.045 });
    },
    boost() {
      noise({ dur: 0.7, vol: 0.3, f: 400, f2: 4200, q: 0.8 });
      tone({ type: 'sawtooth', f: 110, f2: 520, dur: 0.5, vol: 0.12 });
    },
    pad() {
      tone({ type: 'square', f: 520, f2: 1040, dur: 0.18, vol: 0.1 });
      noise({ dur: 0.4, vol: 0.2, f: 600, f2: 3600, q: 0.8 });
    },
    deny() { tone({ type: 'square', f: 150, dur: 0.1, vol: 0.07 }); },
    crash() {
      noise({ dur: 0.45, vol: 0.5, f: 900, f2: 140, type: 'lowpass' });
      tone({ f: 130, f2: 40, dur: 0.3, vol: 0.4 });
    },
    smash() {
      noise({ dur: 0.3, vol: 0.4, f: 2400, f2: 500, q: 0.6 });
      tone({ type: 'square', f: 300, f2: 90, dur: 0.18, vol: 0.14 });
    },
    bump() { tone({ f: 190, f2: 70, dur: 0.14, vol: 0.3 }); },
    jump() { tone({ type: 'triangle', f: 280, f2: 760, dur: 0.22, vol: 0.2 }); },
    driftStart() { noise({ dur: 0.22, vol: 0.22, f: 2600, f2: 900, q: 1.4 }); },
    driftLvl(l) { tone({ type: 'square', f: 500 + l * 220, f2: 900 + l * 300, dur: 0.12, vol: 0.09 }); },
    turbo(l) {
      noise({ dur: 0.35 + l * 0.12, vol: 0.26, f: 500, f2: 3800 + l * 500, q: 0.8 });
      tone({ type: 'sawtooth', f: 160, f2: 520 + l * 140, dur: 0.3 + l * 0.08, vol: 0.11 });
    },
    loop() {
      noise({ dur: 1.5, vol: 0.28, f: 300, f2: 2600, q: 0.7, att: 0.5 });
      tone({ type: 'triangle', f: 180, f2: 720, dur: 1.4, vol: 0.1, att: 0.3 });
    },
    fall() {
      tone({ type: 'sawtooth', f: 700, f2: 70, dur: 0.6, vol: 0.2 });
      noise({ dur: 0.5, vol: 0.4, f: 900, f2: 140, type: 'lowpass', delay: 0.35 });
    },
    trick() { noise({ dur: 0.26, vol: 0.14, f: 700, f2: 3200, q: 1.2 }); },
    trickDone(n) { tone({ type: 'triangle', f: 660 * Math.pow(2, Math.min(n, 5) * 2 / 12), dur: 0.14, vol: 0.14 }); },
    land(n) {
      tone({ f: 120, f2: 60, dur: 0.12, vol: 0.22 });
      const notes = [523, 659, 784, 1047];
      for (let i = 0; i < Math.min(n, 4); i++) tone({ type: 'triangle', f: notes[i], dur: 0.2, vol: 0.14, delay: 0.05 + i * 0.07 });
    },
    beep(go) {
      if (go) tone({ type: 'square', f: 880, dur: 0.55, vol: 0.16 });
      else tone({ type: 'square', f: 440, dur: 0.18, vol: 0.14 });
    },
    lap() {
      tone({ type: 'triangle', f: 784, dur: 0.14, vol: 0.18 });
      tone({ type: 'triangle', f: 1047, dur: 0.25, vol: 0.18, delay: 0.13 });
    },
    finish(pos) {
      const notes = pos === 1 ? [523, 659, 784, 1047, 1319] : pos <= 3 ? [523, 659, 784, 1047] : [392, 440, 392];
      notes.forEach((f, i) => tone({ type: 'triangle', f, dur: i === notes.length - 1 ? 0.6 : 0.16, vol: 0.2, delay: i * 0.14 }));
    },
  };
})();
