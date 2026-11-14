import {
  SoundPresetId,
  VibrationPatternId,
  VoicePresetId,
} from '../types';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudioAndSpeech(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

export const SOUND_PRESETS: Array<{
  id: SoundPresetId;
  label: string;
  detail: string;
}> = [
  { id: 'soft-chime', label: 'Soft Chime', detail: 'Warm two-note harmonic bell' },
  { id: 'zen-bowl', label: 'Zen Bowl', detail: 'Deep singing bowl resonance' },
  { id: 'crystal-ping', label: 'Crystal Ping', detail: 'Minimalist crisp high tone' },
  { id: 'double-marimba', label: 'Double Marimba', detail: 'Gentle wooden percussion' },
  { id: 'warm-bell', label: 'Warm Bell', detail: 'Soft mellow meditation bell' },
  { id: 'none', label: 'Voice Only', detail: 'No chime before voice cue' },
];

export function playSoundPreset(
  preset: SoundPresetId,
  volume: number,
  mode: 'work' | 'rest' | 'stop' = 'rest'
): number {
  if (preset === 'none' || volume <= 0.01) return 0;
  const ctx = getAudioContext();
  if (!ctx) return 0;

  const now = ctx.currentTime;
  const gainLevel = Math.max(0.02, Math.min(1, volume)) * 0.45;

  const playTone = (
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakGain = gainLevel
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + startOffset);

    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.05);
  };

  if (preset === 'soft-chime') {
    const base = mode === 'rest' ? 523.25 : mode === 'work' ? 587.33 : 440;
    const second = mode === 'rest' ? 659.25 : mode === 'work' ? 783.99 : 523.25;
    playTone(base, 0, 0.55, 'sine', gainLevel);
    playTone(second, 0.16, 0.75, 'sine', gainLevel * 0.9);
    return 600;
  }

  if (preset === 'zen-bowl') {
    const root = mode === 'rest' ? 256 : 288;
    playTone(root, 0, 1.4, 'sine', gainLevel * 0.95);
    playTone(root * 2.01, 0, 0.9, 'sine', gainLevel * 0.35);
    playTone(root * 3.02, 0.02, 0.6, 'sine', gainLevel * 0.15);
    return 650;
  }

  if (preset === 'crystal-ping') {
    const freq = mode === 'rest' ? 880 : 1046.5;
    playTone(freq, 0, 0.45, 'sine', gainLevel * 0.8);
    playTone(freq * 1.5, 0.08, 0.45, 'sine', gainLevel * 0.35);
    return 420;
  }

  if (preset === 'double-marimba') {
    const n1 = mode === 'rest' ? 392 : 440;
    const n2 = mode === 'rest' ? 523.25 : 587.33;
    playTone(n1, 0, 0.24, 'triangle', gainLevel);
    playTone(n2, 0.14, 0.3, 'triangle', gainLevel);
    return 450;
  }

  // warm-bell
  const bell = mode === 'rest' ? 432 : 480;
  playTone(bell, 0, 0.85, 'sine', gainLevel * 0.9);
  playTone(bell * 1.5, 0, 0.45, 'triangle', gainLevel * 0.2);
  return 550;
}

export const VIBRATION_PATTERNS: Array<{
  id: VibrationPatternId;
  label: string;
  detail: string;
  pattern: number[];
}> = [
  { id: 'double-tap', label: 'Double Tap', detail: 'Two crisp haptic taps', pattern: [120, 90, 120] },
  { id: 'pulse', label: 'Gentle Pulse', detail: 'Three soft rhythmic pulses', pattern: [90, 80, 90, 80, 140] },
  { id: 'heartbeat', label: 'Heartbeat', detail: 'Natural lub-dub cadence', pattern: [110, 70, 180, 260, 110, 70, 180] },
  { id: 'long', label: 'Long Buzz', detail: 'Single steady 400ms alert', pattern: [400] },
  { id: 'off', label: 'Off', detail: 'No vibration', pattern: [] },
];

export function triggerVibration(patternId: VibrationPatternId): boolean {
  if (patternId === 'off') return false;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }
  const found = VIBRATION_PATTERNS.find((p) => p.id === patternId);
  if (!found || found.pattern.length === 0) return false;
  return navigator.vibrate(found.pattern);
}

export const VOICE_PRESETS: Array<{
  id: VoicePresetId;
  label: string;
  detail: string;
  rate: number;
  pitch: number;
}> = [
  { id: 'calm-female', label: 'Calm Female', detail: 'Soothing, balanced cadence', rate: 0.93, pitch: 1.08 },
  { id: 'clear-female', label: 'Clear Female', detail: 'Crisp, natural everyday tone', rate: 1.0, pitch: 1.12 },
  { id: 'warm-female', label: 'Warm Female', detail: 'Slightly deeper relaxed tone', rate: 0.92, pitch: 0.98 },
  { id: 'soft-gentle', label: 'Soft Gentle', detail: 'Unrushed wellness voice', rate: 0.84, pitch: 1.15 },
];

const FEMALE_VOICE_HINTS = [
  'female',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'veena',
  'zira',
  'heera',
  'hazel',
  'susan',
  'aria',
  'jenny',
  'emma',
  'olivia',
  'ava',
  'allison',
  'kate',
  'serena',
  'libby',
  'sonia',
  'natasha',
  'claire',
  'google uk english female',
  'google us english',
  'en-gb-x-gba',
  'en-us-x-sfg',
  'en-us-x-tpf',
  'en-in-x-ena',
  'woman',
];

export function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  if (name.includes('male') && !name.includes('female')) return false;
  return FEMALE_VOICE_HINTS.some((hint) => name.includes(hint));
}

export function getSortedVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  return [...voices].sort((a, b) => {
    const aEn = a.lang.toLowerCase().startsWith('en') ? 0 : 1;
    const bEn = b.lang.toLowerCase().startsWith('en') ? 0 : 1;
    if (aEn !== bEn) return aEn - bEn;
    const aFem = isLikelyFemaleVoice(a) ? 0 : 1;
    const bFem = isLikelyFemaleVoice(b) ? 0 : 1;
    if (aFem !== bFem) return aFem - bFem;
    return a.name.localeCompare(b.name);
  });
}

export function pickBestFemaleVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (preferredURI) {
    const exact = voices.find((v) => v.voiceURI === preferredURI);
    if (exact) return exact;
  }
  const englishFemale = voices.find(
    (v) => v.lang.toLowerCase().startsWith('en') && isLikelyFemaleVoice(v)
  );
  if (englishFemale) return englishFemale;

  const anyFemale = voices.find((v) => isLikelyFemaleVoice(v));
  if (anyFemale) return anyFemale;

  const englishVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  return englishVoice || voices[0];
}

export function speakCue(
  text: string,
  options: {
    voiceURI?: string;
    rate: number;
    pitch: number;
    volume: number;
    delayMs?: number;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  const runSpeak = () => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      const voices = getSortedVoices();
      const chosen = pickBestFemaleVoice(voices, options.voiceURI);
      if (chosen) {
        utterance.voice = chosen;
        utterance.lang = chosen.lang;
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = Math.max(0.6, Math.min(1.5, options.rate));
      utterance.pitch = Math.max(0.7, Math.min(1.5, options.pitch));
      utterance.volume = Math.max(0.1, Math.min(1, options.volume));
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore synthesis errors in restricted environments
    }
  };

  if (options.delayMs && options.delayMs > 0) {
    window.setTimeout(runSpeak, options.delayMs);
  } else {
    runSpeak();
  }
}
