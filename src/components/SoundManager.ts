// Synthesizer manager using Web Audio API for cyberpunk arcade sounds
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMutedState() {
    return this.isMuted;
  }

  playTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {
      // Audio context might be blocked or unsupported
    }
  }

  playSelect() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playImpact() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Tone oscillator
      const osc = this.ctx.createOscillator();
      const gainOsc = this.ctx.createGain();
      osc.connect(gainOsc);
      gainOsc.connect(this.ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      
      gainOsc.gain.setValueAtTime(0.12, now);
      gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      // Noise component for texture
      const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      
      const gainNoise = this.ctx.createGain();
      gainNoise.gain.setValueAtTime(0.15, now);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(now + 0.4);
      noise.start();
      noise.stop(now + 0.22);
    } catch (e) {}
  }

  playError() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(120, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start();
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playHoverLaunch() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start();
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playPunchyCTA() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(200, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(203, now);
      osc2.frequency.exponentialRampToValueAtTime(446, now + 0.15);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc1.start();
      osc2.start();
      osc1.stop(now + 0.22);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  playWhooshImpact() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Sweep whoosh
      const whooshOsc = this.ctx.createOscillator();
      const whooshGain = this.ctx.createGain();
      whooshOsc.connect(whooshGain);
      whooshGain.connect(this.ctx.destination);
      whooshOsc.type = 'triangle';
      whooshOsc.frequency.setValueAtTime(1400, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
      whooshGain.gain.setValueAtTime(0.06, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      // Dual sub bass impact
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.type = 'sawtooth';
      kickOsc.frequency.setValueAtTime(110, now + 0.08);
      kickOsc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
      kickGain.gain.setValueAtTime(0.18, now + 0.08);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      whooshOsc.start();
      whooshOsc.stop(now + 0.19);
      kickOsc.start(now + 0.08);
      kickOsc.stop(now + 0.46);
    } catch (e) {}
  }
}

export const sounds = new SoundManager();
