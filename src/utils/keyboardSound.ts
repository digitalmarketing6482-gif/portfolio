// Procedural Mechanical Keyboard Switch Sound Engine using Web Audio API
// Generates realistic, zero-latency mechanical switch clacks without external audio dependencies

class KeyboardSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private switchType: "clicky" | "thock" = "thock";

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setSwitchType(type: "clicky" | "thock") {
    this.switchType = type;
  }

  public getSwitchType(): "clicky" | "thock" {
    return this.switchType;
  }

  public playKeyClick(isBigKey = false) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Slight pitch variation for organic keystrokes (±8%)
      const pitchVariance = 1 + (Math.random() - 0.5) * 0.16;

      if (this.switchType === "clicky") {
        // --- CRISP CLICKY SWITCH (Cherry MX Blue / Kailh Box White) ---
        // 1. Sharp tactile leaf click
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = "sine";
        clickOsc.frequency.setValueAtTime((isBigKey ? 2600 : 3800) * pitchVariance, now);
        clickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.008);
        clickGain.gain.setValueAtTime(0.45, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.015);

        // 2. High snap noise
        const snapLen = Math.floor(ctx.sampleRate * 0.018);
        const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
        const snapData = snapBuf.getChannelData(0);
        for (let i = 0; i < snapLen; i++) {
          snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapLen * 0.3));
        }
        const snapSource = ctx.createBufferSource();
        snapSource.buffer = snapBuf;
        const snapFilter = ctx.createBiquadFilter();
        snapFilter.type = "bandpass";
        snapFilter.frequency.setValueAtTime((isBigKey ? 2200 : 3200) * pitchVariance, now);
        snapFilter.Q.setValueAtTime(3.5, now);
        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.4, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
        snapSource.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(ctx.destination);
        snapSource.start(now);

        // 3. Body bottom-out thud
        const thudOsc = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thudOsc.type = "triangle";
        thudOsc.frequency.setValueAtTime((isBigKey ? 160 : 240) * pitchVariance, now);
        thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.04);
        thudGain.gain.setValueAtTime(isBigKey ? 0.6 : 0.45, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        thudOsc.connect(thudGain);
        thudGain.connect(ctx.destination);
        thudOsc.start(now);
        thudOsc.stop(now + 0.045);
      } else {
        // --- CREAMY THOCK SWITCH (Boba U4T / Holy Panda / Gateron Ink Black) ---
        // 1. Soft rounded stem impact
        const stemOsc = ctx.createOscillator();
        const stemGain = ctx.createGain();
        stemOsc.type = "sine";
        stemOsc.frequency.setValueAtTime((isBigKey ? 650 : 920) * pitchVariance, now);
        stemOsc.frequency.exponentialRampToValueAtTime(280, now + 0.015);
        stemGain.gain.setValueAtTime(0.5, now);
        stemGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
        stemOsc.connect(stemGain);
        stemGain.connect(ctx.destination);
        stemOsc.start(now);
        stemOsc.stop(now + 0.02);

        // 2. Plastic acoustic noise burst (acoustic plate resonance)
        const noiseLen = Math.floor(ctx.sampleRate * 0.035);
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.4));
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.setValueAtTime((isBigKey ? 1200 : 1600) * pitchVariance, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);

        // 3. Deep bass bottom-out thock
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "triangle";
        bassOsc.frequency.setValueAtTime((isBigKey ? 130 : 180) * pitchVariance, now);
        bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.055);
        bassGain.gain.setValueAtTime(isBigKey ? 0.75 : 0.55, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn("Error playing key click:", e);
    }
  }
}

export const keyboardSound = new KeyboardSoundEngine();
