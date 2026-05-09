/**
 * Procedural Web Audio API — Murder Mystery Detective sound engine.
 * SFX engine + canvas-synced thunder clap.
 *
 * Design principles:
 *  - No ambient rain/wind — silence keeps TTS voices clear
 *  - Thunder only fires when canvas lightning flash triggers it
 *  - Noise-based thunder rumble (not oscillators) → far more natural
 *  - startAmbient() just warms up the AudioContext for low-latency SFX
 *  - Master gain 0.48 → present but not overwhelming
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientRunning = false;
let _muted = false;
const _ambientNodes: (AudioBufferSourceNode)[] = [];

/* ── Bootstrap ─────────────────────────────────────────── */

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.48;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function master(): GainNode {
  getCtx();
  return masterGain!;
}

function g(vol: number): GainNode {
  const node = getCtx().createGain();
  node.gain.value = _muted ? 0 : vol;
  node.connect(master());
  return node;
}

function bqf(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = getCtx().createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Natural-sounding reverb impulse response */
function makeReverb(duration = 2.5, decay = 1.2): ConvolverNode {
  const c = getCtx();
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  const rev = c.createConvolver();
  rev.buffer = buf;
  return rev;
}

/**
 * Long stereo white-noise buffer.
 * 18-25 seconds means looping is inaudible in practice.
 */
function makeNoise(c: AudioContext, sec = 20): AudioBufferSourceNode {
  const len = Math.floor(c.sampleRate * sec);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/* ══════════════════════════════════════════════════════
   SFX
══════════════════════════════════════════════════════ */

/* CLICK — crisp physical click ────────────────────── */
export function playClick() {
  if (_muted) return;
  try {
    const c = getCtx(); const now = c.currentTime;
    const len = Math.floor(c.sampleRate * 0.008);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const ns = c.createBufferSource(); ns.buffer = buf;
    const lpf = bqf('lowpass', 4500);
    const hpf = bqf('highpass', 900);
    const ng = c.createGain(); ng.gain.value = 0.5;
    ns.connect(hpf); hpf.connect(lpf); lpf.connect(ng); ng.connect(master());
    ns.start(now); ns.stop(now + 0.008);
    const osc = c.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.014);
    const og = c.createGain();
    og.gain.setValueAtTime(0.18, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    osc.connect(og); og.connect(master());
    osc.start(now); osc.stop(now + 0.018);
  } catch {}
}

/* HOVER — faint ink scritch ───────────────────────── */
export function playHover() {
  if (_muted) return;
  try {
    const c = getCtx(); const now = c.currentTime;
    const len = Math.floor(c.sampleRate * 0.010);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const ns = c.createBufferSource(); ns.buffer = buf;
    const hpf = bqf('highpass', 4200);
    const ng = g(0.04); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    ns.connect(hpf); hpf.connect(ng); ns.start(now); ns.stop(now + 0.012);
  } catch {}
}

/* SEND — soft downward whoosh ─────────────────────── */
export function playSend() {
  if (_muted) return;
  try {
    const c = getCtx(); const now = c.currentTime;
    const osc = c.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
    const gn = g(0.16);
    gn.gain.setValueAtTime(0.16, now);
    gn.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gn); osc.start(now); osc.stop(now + 0.24);
    const osc2 = c.createOscillator(); osc2.type = 'sine';
    osc2.frequency.setValueAtTime(75, now + 0.19);
    osc2.frequency.exponentialRampToValueAtTime(38, now + 0.38);
    const gn2 = g(0.22);
    gn2.gain.setValueAtTime(0, now + 0.17);
    gn2.gain.linearRampToValueAtTime(0.22, now + 0.21);
    gn2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gn2); osc2.start(now + 0.17); osc2.stop(now + 0.42);
  } catch {}
}

/* RECEIVE — typewriter carriage return ────────────── */
export function playReceive() {
  if (_muted) return;
  try {
    const c = getCtx(); const now = c.currentTime;
    const osc = c.createOscillator(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.linearRampToValueAtTime(430, now + 0.07);
    const gn = g(0.11);
    gn.gain.setValueAtTime(0.11, now);
    gn.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gn); osc.start(now); osc.stop(now + 0.4);
    const len2 = Math.floor(c.sampleRate * 0.008);
    const buf2 = c.createBuffer(1, len2, c.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < len2; i++) d2[i] = (Math.random() * 2 - 1) * 0.6;
    const ns2 = c.createBufferSource(); ns2.buffer = buf2;
    const hpf2 = bqf('highpass', 1800);
    const ng2 = g(0.13); ng2.gain.exponentialRampToValueAtTime(0.001, now + 0.010);
    ns2.connect(hpf2); hpf2.connect(ng2); ns2.start(now); ns2.stop(now + 0.010);
  } catch {}
}

/* COIN — bright metallic chime ────────────────────── */
export function playCoin() {
  if (_muted) return;
  try {
    const c = getCtx();
    [
      { freq: 1760, delay: 0,    vol: 0.13 },
      { freq: 2217, delay: 0.09, vol: 0.10 },
      { freq: 2794, delay: 0.17, vol: 0.08 },
    ].forEach(({ freq, delay, vol }) => {
      const now = c.currentTime + delay;
      const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
      const osc2 = c.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = freq * 1.004;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0, now);
      gn.gain.linearRampToValueAtTime(vol, now + 0.004);
      gn.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      gn.connect(master());
      osc.connect(gn); osc2.connect(gn);
      osc.start(now); osc.stop(now + 0.7);
      osc2.start(now); osc2.stop(now + 0.7);
    });
  } catch {}
}

/* WIN — cinematic major 7th swell ─────────────────── */
export function playWin() {
  if (_muted) return;
  try {
    const c = getCtx();
    const rev = makeReverb(1.5, 2.5);
    rev.connect(master());
    [261.6, 329.6, 392, 493.9, 523.3].forEach((freq, i) => {
      const now = c.currentTime + i * 0.11;
      const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0, now);
      gn.gain.linearRampToValueAtTime(0.1 - i * 0.012, now + 0.06);
      gn.gain.setValueAtTime(0.1 - i * 0.012, now + 0.55);
      gn.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      gn.connect(master()); gn.connect(rev);
      osc.connect(gn); osc.start(now); osc.stop(now + 2.2);
    });
  } catch {}
}

/* LOSE — descending minor dirge ───────────────────── */
export function playLose() {
  if (_muted) return;
  try {
    const c = getCtx();
    const rev = makeReverb(2.0, 1.8);
    rev.connect(master());
    [220, 174.6, 155.6, 130.8].forEach((freq, i) => {
      const now = c.currentTime + i * 0.2;
      const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
      const filt = bqf('lowpass', 700); filt.Q.value = 2;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0, now);
      gn.gain.linearRampToValueAtTime(0.14, now + 0.05);
      gn.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      gn.connect(rev); osc.connect(filt); filt.connect(gn);
      osc.start(now); osc.stop(now + 2.5);
    });
  } catch {}
}

/* TIMER WARNING — heartbeat ───────────────────────── */
export function playTimerWarning() {
  if (_muted) return;
  try {
    const c = getCtx(); const now = c.currentTime;
    ([[0, 0.22, 78], [0.14, 0.18, 62]] as [number, number, number][]).forEach(([start, dur, freq]) => {
      const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const filt = bqf('lowpass', 280);
      const gn = g(0.26);
      gn.gain.setValueAtTime(0, now + start);
      gn.gain.linearRampToValueAtTime(0.26, now + start + 0.025);
      gn.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(filt); filt.connect(gn);
      osc.start(now + start); osc.stop(now + start + dur);
    });
  } catch {}
}

/* ══════════════════════════════════════════════════════
   THUNDER  ─  canvas-synced lightning clap
   No ambient rain or wind. Thunder fires only when the
   canvas NoirBackground triggers a lightning flash.
══════════════════════════════════════════════════════ */

/**
 * Lightning strike sound — sharp electrical crack + brief sizzle tail.
 * Designed to match the canvas lightning flash: instant, bright, short.
 * Much more electric/sharp than a deep thunder rumble.
 */
export function playThunderClap() {
  if (_muted) return;
  try {
    const c = getCtx();
    const now = c.currentTime;

    // Short air reverb — keeps the crack bright, not boomy
    const rev = makeReverb(0.9, 2.8);
    rev.connect(master());

    // ── 1. Initial electrical CRACK — instantaneous ──────────
    // Shaped noise burst with very sharp attack (exponent 0.08 = almost square)
    const crackLen = Math.floor(c.sampleRate * 0.055);
    const crackBuf = c.createBuffer(2, crackLen, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = crackBuf.getChannelData(ch);
      for (let i = 0; i < crackLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crackLen, 0.08);
      }
    }
    const crack = c.createBufferSource(); crack.buffer = crackBuf;
    const crackHpf = bqf('highpass', 1800, 0.7);
    const crackLpf = bqf('lowpass', 14000, 0.6);
    const crackGain = c.createGain();
    crackGain.gain.setValueAtTime(0.88, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crack.connect(crackHpf); crackHpf.connect(crackLpf); crackLpf.connect(crackGain);
    crackGain.connect(master()); crackGain.connect(rev);
    crack.start(now); crack.stop(now + 0.065);

    // ── 2. Electric sizzle / arc — like a high-voltage discharge ──
    const sizzleLen = Math.floor(c.sampleRate * 0.28);
    const sizzleBuf = c.createBuffer(2, sizzleLen, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = sizzleBuf.getChannelData(ch);
      for (let i = 0; i < sizzleLen; i++) {
        // Add slight periodic variation to give "electrical" texture
        const env = Math.pow(1 - i / sizzleLen, 0.55);
        d[i] = (Math.random() * 2 - 1) * env * (0.8 + 0.2 * Math.sin(i * 0.35));
      }
    }
    const sizzle = c.createBufferSource(); sizzle.buffer = sizzleBuf;
    const sizzleBpf = bqf('bandpass', 3400, 3.2);
    const sizzleHpf = bqf('highpass', 1200, 0.6);
    const sizzleGain = c.createGain();
    sizzleGain.gain.setValueAtTime(0, now + 0.005);
    sizzleGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    sizzle.connect(sizzleBpf); sizzleBpf.connect(sizzleHpf); sizzleHpf.connect(sizzleGain);
    sizzleGain.connect(master()); sizzleGain.connect(rev);
    sizzle.start(now + 0.005);

    // ── 3. Subtle short rumble — just enough to feel grounded ──
    // Much shorter and quieter than before (1.8 s, not 7 s; 0.14 gain, not 0.52)
    const rumbleLen = Math.floor(c.sampleRate * 1.8);
    const rumbleBuf = c.createBuffer(2, rumbleLen, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = rumbleBuf.getChannelData(ch);
      for (let i = 0; i < rumbleLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rumbleLen, 0.38);
      }
    }
    const rumble = c.createBufferSource(); rumble.buffer = rumbleBuf;
    const rumbleLpf = bqf('lowpass', 180, 2.5);
    const rumbleGain = c.createGain();
    rumbleGain.gain.setValueAtTime(0, now + 0.04);
    rumbleGain.gain.linearRampToValueAtTime(0.14, now + 0.12);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
    rumble.connect(rumbleLpf); rumbleLpf.connect(rumbleGain);
    rumbleGain.connect(master()); rumbleGain.connect(rev);
    rumble.start(now + 0.04);
  } catch {}
}

/**
 * startAmbient — warms up the AudioContext so SFX play with minimal latency.
 * No rain or wind layers are started; silence keeps the TTS voices clear.
 */
export function startAmbient() {
  if (ambientRunning) return;
  try {
    getCtx(); // resume context on first user interaction
    ambientRunning = true;
  } catch {}
}

export function stopAmbient() {
  ambientRunning = false;
  _ambientNodes.forEach((n) => { try { n.stop(); } catch {} });
  _ambientNodes.length = 0;
}

export function setMuted(value: boolean) {
  _muted = value;
  if (ctx && masterGain) {
    masterGain.gain.setTargetAtTime(value ? 0 : 0.48, ctx.currentTime, 0.15);
  }
  if (!value && !ambientRunning) startAmbient();
  if (value) stopAmbient();
}

export function isMuted() { return _muted; }
