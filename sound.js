const Sound = (function () {
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem("n4-muted") === "1"; } catch (e) {}

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, t0, dur, o = {}) {
    const type = o.type || "sine", vol = o.vol == null ? 0.22 : o.vol;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);

    if (o.bell) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(freq * 2.76, t0);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + 0.008);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
      o2.connect(g2); g2.connect(master);
      o2.start(t0); o2.stop(t0 + dur);
    }
  }

  function play(p) {
    if (muted || !init()) return;
    const t = ctx.currentTime + 0.01;
    if (p.slide) {
      tone(hz(p.root), t, p.dur, { type: p.type, vol: p.vol, slideTo: hz(p.root + p.seq[p.seq.length - 1]) });
      return;
    }
    p.seq.forEach((n, i) => tone(hz(p.root + n), t + i * p.step, p.dur || 0.22,
      { type: p.type, vol: p.vol, bell: p.bell }));
  }

  const BENAR = [
    { root: 72, seq: [0, 4, 7, 12],        step: 0.09, type: "sine",     bell: true },
    { root: 74, seq: [0, 2, 7, 9, 14],     step: 0.08, type: "triangle" },
    { root: 67, seq: [0, 7, 12, 16],       step: 0.10, type: "sine",     bell: true },
    { root: 69, seq: [0, 5, 9, 12, 17],    step: 0.07, type: "triangle" },
    { root: 76, seq: [0, 2, 4, 7, 12],     step: 0.07, type: "square",   vol: 0.1 },
    { root: 71, seq: [12, 9, 7, 4, 0, 12], step: 0.07, type: "sine",     bell: true },
    { root: 65, seq: [0, 7, 12, 19],       step: 0.11, type: "triangle" },
    { root: 79, seq: [0, -2, 0, 5, 9],     step: 0.08, type: "sine",     bell: true },
    { root: 62, seq: [0, 4, 9, 14, 16],    step: 0.08, type: "triangle" },
    { root: 72, seq: [0, 0, 7, 7, 12],     step: 0.09, type: "square",   vol: 0.1 },
  ];

  const SALAH = [
    { root: 60, seq: [0, -3, -7],     step: 0.14, type: "sawtooth", vol: 0.13, dur: 0.25 },
    { root: 57, seq: [0, -5],         step: 0.18, type: "square",   vol: 0.1,  dur: 0.3 },
    { root: 64, seq: [0, -12], slide: true, dur: 0.45, type: "triangle", vol: 0.25 },
    { root: 55, seq: [0, -6, 0],      step: 0.12, type: "sawtooth", vol: 0.12, dur: 0.22 },
    { root: 62, seq: [0, -1, -2, -3], step: 0.1,  type: "triangle", vol: 0.22, dur: 0.2 },
    { root: 67, seq: [0, -10], slide: true, dur: 0.4, type: "sawtooth", vol: 0.12 },
    { root: 58, seq: [0, -4, -8],     step: 0.15, type: "square",   vol: 0.09, dur: 0.26 },
    { root: 52, seq: [0, 0, -5],      step: 0.13, type: "sawtooth", vol: 0.13, dur: 0.24 },
    { root: 66, seq: [0, -2, -4, -6], step: 0.09, type: "triangle", vol: 0.22, dur: 0.2 },
    { root: 59, seq: [0, -7], slide: true, dur: 0.5, type: "square", vol: 0.09 },
  ];

  const MENANG = { root: 72, seq: [0, 4, 7, 12, 7, 12, 16, 19], step: 0.11, type: "triangle", bell: true, dur: 0.35 };
  const KALAH  = { root: 57, seq: [0, -1, -3, -5, -8], step: 0.22, type: "sawtooth", vol: 0.11, dur: 0.4 };
  const PING   = { root: 84, seq: [0], step: 0, type: "sine", bell: true, dur: 0.2, vol: 0.15 };

  return {
    benar(i, combo) {
      const p = BENAR[i % BENAR.length];
      play(combo >= 3 ? Object.assign({}, p, { seq: p.seq.concat([p.seq[p.seq.length - 1] + 5]) }) : p);
    },
    salah(i) { play(SALAH[i % SALAH.length]); },
    menang() { play(MENANG); },
    kalah() { play(KALAH); },
    ping() { play(PING); },
    isMuted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem("n4-muted", muted ? "1" : "0"); } catch (e) {}
      if (!muted) this.ping();
      return muted;
    },
  };
})();