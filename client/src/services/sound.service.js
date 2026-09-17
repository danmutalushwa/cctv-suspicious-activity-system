/**
 * Sound notification service using Web Audio API
 * No external audio files needed
 */

let audioContext = null;
let isEnabled = true;

const getAudioContext = () => {
  if (!audioContext) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  return audioContext;
};

/**
 * Play a beep tone
 */
const playTone = (frequency = 800, duration = 200, type = 'sine', volume = 0.3) => {
  if (!isEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Failed to play tone:', error);
  }
};

/**
 * Play a sequence of tones
 */
const playSequence = (tones, gap = 100) => {
  tones.forEach((tone, i) => {
    setTimeout(() => {
      playTone(tone.frequency, tone.duration, tone.type, tone.volume);
    }, i * gap);
  });
};

export const soundService = {
  /**
   * Critical alert sound - urgent double beep
   */
  playCritical: () => {
    playSequence([
      { frequency: 1000, duration: 150, type: 'square', volume: 0.4 },
      { frequency: 1200, duration: 150, type: 'square', volume: 0.4 },
      { frequency: 1000, duration: 150, type: 'square', volume: 0.4 },
    ], 180);
  },

  /**
   * High priority - single beep
   */
  playHigh: () => {
    playTone(900, 250, 'sine', 0.35);
  },

  /**
   * Medium priority - soft tone
   */
  playMedium: () => {
    playTone(600, 200, 'sine', 0.25);
  },

  /**
   * Low priority - subtle notification
   */
  playLow: () => {
    playTone(400, 150, 'sine', 0.2);
  },

  /**
   * Success sound
   */
  playSuccess: () => {
    playSequence([
      { frequency: 600, duration: 100, type: 'sine', volume: 0.25 },
      { frequency: 800, duration: 150, type: 'sine', volume: 0.25 },
    ], 100);
  },

  /**
   * Error sound
   */
  playError: () => {
    playSequence([
      { frequency: 400, duration: 150, type: 'sawtooth', volume: 0.3 },
      { frequency: 300, duration: 200, type: 'sawtooth', volume: 0.3 },
    ], 150);
  },

  /**
   * Play sound for a given priority
   */
  playForPriority: (priority) => {
    switch (priority) {
      case 'critical': return soundService.playCritical();
      case 'high': return soundService.playHigh();
      case 'medium': return soundService.playMedium();
      case 'low': return soundService.playLow();
      default: return soundService.playMedium();
    }
  },

  /**
   * Enable/disable sounds
   */
  setEnabled: (enabled) => {
    isEnabled = enabled;
  },

  isEnabled: () => isEnabled,

  /**
   * Initialize audio context on user interaction
   */
  initialize: () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  },
};