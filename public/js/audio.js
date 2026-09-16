/**
 * Web Audio API Synthesized Sound Engine
 * Provee efectos de sonido futuristas para el taller sin requerir archivos de audio externos.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('csi_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('csi_sound_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playBeep(frequency = 600, duration = 0.1, type = 'sine') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playTimerWarning() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Double warning beep
    this.playBeep(880, 0.12, 'sawtooth');
    setTimeout(() => {
      this.playBeep(1100, 0.2, 'sawtooth');
    }, 180);
  }

  playSubmitSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Arpeggio chime
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 0.18, 'triangle');
      }, index * 80);
    });
  }

  playReveal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Sci-fi power chord
    this.playBeep(440, 0.25, 'sine');
    setTimeout(() => {
      this.playBeep(880, 0.35, 'triangle');
    }, 100);
  }

  playVictoryFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 150 },  // E5
      { freq: 783.99, delay: 300 },  // G5
      { freq: 1046.50, delay: 450 }, // C6
      { freq: 1318.51, delay: 650 }  // E6
    ];

    chords.forEach(c => {
      setTimeout(() => {
        this.playBeep(c.freq, 0.4, 'triangle');
      }, c.delay);
    });
  }
}

window.soundEngine = new SoundEngine();
