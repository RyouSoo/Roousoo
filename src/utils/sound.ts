class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted() {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.06,
    delay = 0,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  public playStep() {
    this.playTone(180 + Math.random() * 25, 0.045, 'triangle', 0.035);
  }

  public playTalk() {
    this.playTone(523.25, 0.07, 'square', 0.05, 0);
    this.playTone(659.25, 0.09, 'square', 0.05, 0.06);
  }

  public playCorrect() {
    this.playTone(523.25, 0.1, 'square', 0.06, 0);
    this.playTone(659.25, 0.1, 'square', 0.06, 0.08);
    this.playTone(783.99, 0.12, 'square', 0.06, 0.16);
    this.playTone(1046.5, 0.22, 'square', 0.065, 0.25);
  }

  public playWrong() {
    this.playTone(311.13, 0.14, 'sawtooth', 0.045, 0);
    this.playTone(246.94, 0.22, 'sawtooth', 0.045, 0.12);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.11, 0.22, 0.34, 0.5, 0.64];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.35 : 0.11, 'square', 0.06, times[idx]);
    });
  }
}

export const retroAudio = new RetroAudioEngine();
