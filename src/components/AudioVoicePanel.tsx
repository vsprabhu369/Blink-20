import React, { useState } from 'react';
import { Volume2, Mic, Smartphone, Play } from 'lucide-react';
import {
  SOUND_PRESETS,
  VIBRATION_PATTERNS,
  VOICE_PRESETS,
  isLikelyFemaleVoice,
  playSoundPreset,
  speakCue,
  triggerVibration,
  unlockAudioAndSpeech,
} from '../audio/soundEngine';
import { DarkThemeVariant } from '../themes';
import { TimerSettings, VoicePresetId } from '../types';

interface AudioVoicePanelProps {
  settings: TimerSettings;
  voices: SpeechSynthesisVoice[];
  theme: DarkThemeVariant;
  onUpdate: (patch: Partial<TimerSettings>) => void;
}

export const AudioVoicePanel: React.FC<AudioVoicePanelProps> = ({
  settings,
  voices,
  theme,
  onUpdate,
}) => {
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [vibrateFeedback, setVibrateFeedback] = useState(false);

  const femaleVoices = voices.filter((v) => isLikelyFemaleVoice(v));
  const displayedVoices =
    showAllVoices || femaleVoices.length === 0 ? voices : femaleVoices;

  const handleVoicePreset = (presetId: VoicePresetId) => {
    const found = VOICE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    onUpdate({
      voicePreset: presetId,
      voiceRate: found.rate,
      voicePitch: found.pitch,
    });
  };

  const handleTestVoice = (mode: 'work' | 'rest') => {
    unlockAudioAndSpeech();
    const phrase = mode === 'work' ? settings.workPhrase : settings.restPhrase;
    speakCue(phrase, {
      voiceURI: settings.selectedVoiceURI,
      rate: settings.voiceRate,
      pitch: settings.voicePitch,
      volume: settings.soundVolume,
    });
  };

  const handleTestSound = () => {
    unlockAudioAndSpeech();
    playSoundPreset(settings.soundPreset, settings.soundVolume, 'rest');
  };

  const handleTestVibration = () => {
    triggerVibration(settings.vibrationPattern);
    setVibrateFeedback(true);
    window.setTimeout(() => setVibrateFeedback(false), 380);
  };

  return (
    <div className="space-y-8">
      {/* Female Voice Engine */}
      <section aria-labelledby="voice-heading">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Mic className={`w-4 h-4 ${theme.workAccentClass}`} />
            <h2
              id="voice-heading"
              className={`text-base font-semibold ${theme.textPrimaryClass}`}
            >
              Female Voice Cues
            </h2>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.voiceEnabled}
            onClick={() => onUpdate({ voiceEnabled: !settings.voiceEnabled })}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              settings.voiceEnabled
                ? theme.workButtonClass
                : `border ${theme.borderClass} ${theme.textMutedClass}`
            }`}
          >
            {settings.voiceEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        <div
          className={`mt-4 space-y-5 transition-opacity ${
            settings.voiceEnabled ? 'opacity-100' : 'opacity-45 pointer-events-none'
          }`}
        >
          {/* Voice Persona Presets */}
          <div>
            <div className={`text-xs font-medium mb-2.5 ${theme.textMutedClass}`}>
              Voice style
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {VOICE_PRESETS.map((preset) => {
                const active = settings.voicePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleVoicePreset(preset.id)}
                    className={`min-h-[54px] text-left px-3.5 py-2.5 rounded-2xl border transition-colors ${
                      active
                        ? `${theme.workSoftBgClass} border-current ${theme.workAccentClass}`
                        : `${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
                    }`}
                  >
                    <div className="text-sm font-medium">{preset.label}</div>
                    <div className={`text-xs mt-0.5 ${theme.textMutedClass}`}>
                      {preset.detail}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Voice Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="device-voice-select"
                className={`text-xs font-medium ${theme.textMutedClass}`}
              >
                System voice ({displayedVoices.length} available)
              </label>
              {femaleVoices.length > 0 && voices.length > femaleVoices.length && (
                <button
                  type="button"
                  onClick={() => setShowAllVoices((v) => !v)}
                  className={`text-xs font-medium ${theme.workAccentClass} hover:underline`}
                >
                  {showAllVoices ? 'Female voices only' : 'Show all system voices'}
                </button>
              )}
            </div>
            <select
              id="device-voice-select"
              value={settings.selectedVoiceURI}
              onChange={(e) => onUpdate({ selectedVoiceURI: e.target.value })}
              className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.textPrimaryClass} text-sm focus:outline-none focus:ring-2 focus:ring-white/20`}
            >
              <option value="">Auto-select best female voice</option>
              {displayedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate & Pitch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className={theme.textMutedClass}>Pace</span>
                <span className={`font-mono-tabular ${theme.textSecondaryClass}`}>
                  {settings.voiceRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.3}
                step={0.02}
                value={settings.voiceRate}
                onChange={(e) =>
                  onUpdate({
                    voiceRate: Number(e.target.value),
                    voicePreset: 'custom',
                  })
                }
                style={
                  {
                    '--slider-thumb': theme.workAccentHex,
                    '--slider-border': theme.bgHex,
                  } as React.CSSProperties
                }
                className="w-full blink-slider"
                aria-label="Voice pace"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className={theme.textMutedClass}>Tone pitch</span>
                <span className={`font-mono-tabular ${theme.textSecondaryClass}`}>
                  {settings.voicePitch.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.35}
                step={0.02}
                value={settings.voicePitch}
                onChange={(e) =>
                  onUpdate({
                    voicePitch: Number(e.target.value),
                    voicePreset: 'custom',
                  })
                }
                style={
                  {
                    '--slider-thumb': theme.workAccentHex,
                    '--slider-border': theme.bgHex,
                  } as React.CSSProperties
                }
                className="w-full blink-slider"
                aria-label="Voice tone pitch"
              />
            </div>
          </div>

          {/* Custom Spoken Phrases + Test Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="work-phrase"
                className={`block text-xs font-medium mb-1.5 ${theme.textMutedClass}`}
              >
                Work announcement
              </label>
              <div className="flex gap-2">
                <input
                  id="work-phrase"
                  type="text"
                  value={settings.workPhrase}
                  onChange={(e) => onUpdate({ workPhrase: e.target.value })}
                  placeholder="Time to work"
                  className={`flex-1 min-w-0 min-h-[44px] px-3 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.textPrimaryClass} text-sm focus:outline-none focus:ring-2 focus:ring-white/20`}
                />
                <button
                  type="button"
                  onClick={() => handleTestVoice('work')}
                  aria-label="Test work voice"
                  className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.workAccentClass} flex items-center justify-center shrink-0`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="rest-phrase"
                className={`block text-xs font-medium mb-1.5 ${theme.textMutedClass}`}
              >
                Rest announcement
              </label>
              <div className="flex gap-2">
                <input
                  id="rest-phrase"
                  type="text"
                  value={settings.restPhrase}
                  onChange={(e) => onUpdate({ restPhrase: e.target.value })}
                  placeholder="Time to rest"
                  className={`flex-1 min-w-0 min-h-[44px] px-3 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.textPrimaryClass} text-sm focus:outline-none focus:ring-2 focus:ring-white/20`}
                />
                <button
                  type="button"
                  onClick={() => handleTestVoice('rest')}
                  aria-label="Test rest voice"
                  className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.restAccentClass} flex items-center justify-center shrink-0`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
            <span className={`text-sm ${theme.textSecondaryClass}`}>
              Speak work & break totals when stopping
            </span>
            <input
              type="checkbox"
              checked={settings.speakStopSummary}
              onChange={(e) => onUpdate({ speakStopSummary: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </label>
        </div>
      </section>

      <hr className={`border-t ${theme.borderClass}`} />

      {/* Alert Sounds */}
      <section aria-labelledby="sound-heading">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Volume2 className={`w-4 h-4 ${theme.restAccentClass}`} />
            <h2
              id="sound-heading"
              className={`text-base font-semibold ${theme.textPrimaryClass}`}
            >
              Chime Sound
            </h2>
          </div>

          <button
            type="button"
            onClick={handleTestSound}
            className={`min-h-[38px] px-3.5 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textPrimaryClass} text-xs font-medium flex items-center gap-1.5 whitespace-nowrap`}
          >
            <Play className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SOUND_PRESETS.map((sound) => {
            const active = settings.soundPreset === sound.id;
            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => {
                  onUpdate({ soundPreset: sound.id });
                  unlockAudioAndSpeech();
                  playSoundPreset(sound.id, settings.soundVolume, 'rest');
                }}
                className={`min-h-[54px] text-left px-3.5 py-2.5 rounded-2xl border transition-colors ${
                  active
                    ? `${theme.restSoftBgClass} border-current ${theme.restAccentClass}`
                    : `${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
                }`}
              >
                <div className="text-sm font-medium">{sound.label}</div>
                <div className={`text-xs mt-0.5 ${theme.textMutedClass}`}>
                  {sound.detail}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span className={theme.textMutedClass}>Audio volume</span>
            <span className={`font-mono-tabular ${theme.textSecondaryClass}`}>
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.soundVolume}
            onChange={(e) => onUpdate({ soundVolume: Number(e.target.value) })}
            style={
              {
                '--slider-thumb': theme.restAccentHex,
                '--slider-border': theme.bgHex,
              } as React.CSSProperties
            }
            className="w-full blink-slider"
            aria-label="Audio volume"
          />
        </div>
      </section>

      <hr className={`border-t ${theme.borderClass}`} />

      {/* Vibration */}
      <section aria-labelledby="vibration-heading">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Smartphone className={`w-4 h-4 ${theme.workAccentClass}`} />
            <h2
              id="vibration-heading"
              className={`text-base font-semibold ${theme.textPrimaryClass}`}
            >
              Android Vibration
            </h2>
          </div>

          <button
            type="button"
            onClick={handleTestVibration}
            className={`min-h-[38px] px-3.5 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textPrimaryClass} text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-transform ${
              vibrateFeedback ? 'scale-95' : ''
            }`}
          >
            Test Vibrate
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {VIBRATION_PATTERNS.map((vib) => {
            const active = settings.vibrationPattern === vib.id;
            return (
              <button
                key={vib.id}
                type="button"
                onClick={() => {
                  onUpdate({ vibrationPattern: vib.id });
                  triggerVibration(vib.id);
                }}
                className={`min-h-[54px] text-left px-3.5 py-2.5 rounded-2xl border transition-colors ${
                  active
                    ? `${theme.workSoftBgClass} border-current ${theme.workAccentClass}`
                    : `${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
                }`}
              >
                <div className="text-sm font-medium">{vib.label}</div>
                <div className={`text-xs mt-0.5 ${theme.textMutedClass}`}>
                  {vib.detail}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
