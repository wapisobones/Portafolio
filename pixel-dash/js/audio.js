export class AudioController {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.musicGain = null;
    this.musicSource = null;
  }

  unlock() {
    if (!this.enabled || this.context) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.enabled = false;
      return;
    }

    this.context = new AudioContext();
  }

  playJump() {
    this.playTone(520, 0.07, "square", 0.04);
  }

  playHit() {
    this.playTone(120, 0.16, "sawtooth", 0.08);
  }

  playGameOver() {
    this.playTone(220, 0.12, "square", 0.05);
    window.setTimeout(() => this.playTone(150, 0.18, "square", 0.05), 120);
  }

  playTone(frequency, duration, type, volume) {
    if (!this.context || !this.enabled) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.stop(this.context.currentTime + duration);
  }

  async playMusic(src) {
    if (!this.enabled || !this.context) {
      return;
    }

    this.stopMusic();

    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const gain = this.context.createGain();
      gain.gain.value = 0.3;

      source.connect(gain);
      gain.connect(this.context.destination);
      source.start();

      this.musicSource = source;
      this.musicGain = gain;
    } catch (e) {
      // fallback silencioso si no se pudo cargar el audio
    }
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
    }
  }
}
