// Web Audio API Sound Synthesizer
const SoundFX = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  },

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  },

  click() {
    this.playTone(800, 'sine', 0.05, 0.08);
  },

  confirm() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.12), 80);
  },

  start() {
    this.playTone(440, 'triangle', 0.1, 0.15);
    setTimeout(() => this.playTone(554.37, 'triangle', 0.1, 0.15), 100);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.2, 0.18), 200);
    setTimeout(() => this.playTone(880, 'triangle', 0.3, 0.2), 300);
  },

  success() {
    this.playTone(587.33, 'sine', 0.12, 0.15);
    setTimeout(() => this.playTone(739.99, 'sine', 0.12, 0.15), 120);
    setTimeout(() => this.playTone(880.00, 'sine', 0.25, 0.2), 240);
  },

  error() {
    this.playTone(220, 'sawtooth', 0.15, 0.15);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.15), 120);
  },

  hint() {
    this.playTone(659.25, 'sine', 0.1, 0.12);
    setTimeout(() => this.playTone(880.00, 'sine', 0.2, 0.15), 100);
  },

  attack() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch(e){}
  },

  heal() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch(e){}
  },

  alarm() {
    this.playTone(880, 'square', 0.08, 0.08);
    setTimeout(() => this.playTone(880, 'square', 0.08, 0.08), 120);
  }
};

window.SoundFX = SoundFX;
