export type TimerPhase = 'idle' | 'work' | 'rest';

export type ThemeVariantId = 'obsidian' | 'midnight' | 'forest' | 'velvet';

export type SoundPresetId =
  | 'soft-chime'
  | 'zen-bowl'
  | 'crystal-ping'
  | 'double-marimba'
  | 'warm-bell'
  | 'none';

export type VoicePresetId =
  | 'calm-female'
  | 'clear-female'
  | 'warm-female'
  | 'soft-gentle'
  | 'custom';

export type VibrationPatternId =
  | 'double-tap'
  | 'pulse'
  | 'heartbeat'
  | 'long'
  | 'off';

export type AppTab = 'timer' | 'audio' | 'schedule' | 'history';

export interface SchedulerConfig {
  enabled: boolean;
  startTime: string; // HH:mm 24h
  stopTime: string;  // HH:mm 24h
  days: number[];    // 0 = Sun, 1 = Mon ... 6 = Sat
  autoStart: boolean;
  autoStop: boolean;
}

export interface TimerSettings {
  workSeconds: number;
  restSeconds: number;
  theme: ThemeVariantId;
  soundPreset: SoundPresetId;
  soundVolume: number; // 0 to 1
  voiceEnabled: boolean;
  voicePreset: VoicePresetId;
  selectedVoiceURI: string;
  voiceRate: number;   // 0.6 to 1.4
  voicePitch: number;  // 0.7 to 1.4
  workPhrase: string;
  restPhrase: string;
  speakStopSummary: boolean;
  vibrationPattern: VibrationPatternId;
  keepAwake: boolean;
  notificationsEnabled: boolean;
  scheduler: SchedulerConfig;
}

export interface SessionSummary {
  id: string;
  startedAt: number;
  stoppedAt: number;
  workMs: number;
  restMs: number;
  cycles: number;
  stoppedBy: 'manual' | 'schedule';
}
