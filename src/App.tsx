import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  Clock,
  History,
  Pause,
  Play,
  SkipForward,
  SlidersHorizontal,
  Square,
  Volume2,
  WifiOff,
} from 'lucide-react';
import {
  getSortedVoices,
  playSoundPreset,
  speakCue,
  triggerVibration,
  unlockAudioAndSpeech,
} from './audio/soundEngine';
import { AudioVoicePanel } from './components/AudioVoicePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { IntervalCustomizer } from './components/IntervalCustomizer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScheduleThemePanel } from './components/ScheduleThemePanel';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { TimerRing } from './components/TimerRing';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { DARK_THEMES, THEME_LIST } from './themes';
import {
  AppTab,
  SessionSummary,
  TimerPhase,
  TimerSettings,
} from './types';
import {
  formatDurationHuman,
  formatDurationSpoken,
  parseHHMMToMinutes,
} from './utils/formatTime';

const SETTINGS_STORAGE_KEY = 'blink20_settings_v1';
const HISTORY_STORAGE_KEY = 'blink20_history_v1';

const DEFAULT_SETTINGS: TimerSettings = {
  workSeconds: 20 * 60,
  restSeconds: 20,
  theme: 'obsidian',
  soundPreset: 'soft-chime',
  soundVolume: 0.8,
  voiceEnabled: true,
  voicePreset: 'calm-female',
  selectedVoiceURI: '',
  voiceRate: 0.93,
  voicePitch: 1.08,
  workPhrase: 'Time to work',
  restPhrase: 'Time to rest',
  speakStopSummary: true,
  vibrationPattern: 'double-tap',
  keepAwake: true,
  notificationsEnabled: false,
  scheduler: {
    enabled: false,
    startTime: '09:00',
    stopTime: '18:00',
    days: [1, 2, 3, 4, 5],
    autoStart: true,
    autoStop: true,
  },
};

function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TimerSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      scheduler: {
        ...DEFAULT_SETTINGS.scheduler,
        ...(parsed.scheduler || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadHistory(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface TimerEngineState {
  phase: TimerPhase;
  isRunning: boolean;
  phaseElapsedMs: number;
  segmentStartedAt: number | null;
  sessionStartedAt: number | null;
  sessionWorkMs: number;
  sessionRestMs: number;
  cycles: number;
}

const INITIAL_ENGINE: TimerEngineState = {
  phase: 'idle',
  isRunning: false,
  phaseElapsedMs: 0,
  segmentStartedAt: null,
  sessionStartedAt: null,
  sessionWorkMs: 0,
  sessionRestMs: 0,
  cycles: 0,
};

export default function App() {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [history, setHistory] = useState<SessionSummary[]>(loadHistory);
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [showMobileCustomizer, setShowMobileCustomizer] = useState(false);

  const [engine, setEngine] = useState<TimerEngineState>(INITIAL_ENGINE);
  const engineRef = useRef<TimerEngineState>(INITIAL_ENGINE);
  engineRef.current = engine;

  const settingsRef = useRef<TimerSettings>(settings);
  settingsRef.current = settings;

  const [nowTick, setNowTick] = useState(() => Date.now());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [latestSummary, setLatestSummary] = useState<SessionSummary | null>(
    null
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'unsupported'
  );

  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const lastAutoStartDateRef = useRef<string>('');
  const lastAutoStopDateRef = useRef<string>('');

  const isOnline = useOnlineStatus();
  const theme = DARK_THEMES[settings.theme] || DARK_THEMES.obsidian;

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore quota errors
    }
  }, [history]);

  // Sync theme background and browser status bar color
  useEffect(() => {
    document.body.style.backgroundColor = theme.bgHex;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.bgHex);
    }
  }, [theme.bgHex]);

  // Load SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const refresh = () => setVoices(getSortedVoices());
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refresh);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // Screen Wake Lock management
  useEffect(() => {
    const shouldLock = engine.isRunning && settings.keepAwake;
    const nav = navigator as unknown as {
      wakeLock?: {
        request: (type: 'screen') => Promise<{ release: () => Promise<void> }>;
      };
    };

    if (!nav.wakeLock) return;

    if (shouldLock && !wakeLockRef.current) {
      nav.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockRef.current = sentinel;
        })
        .catch(() => {});
    } else if (!shouldLock && wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      if (!shouldLock && wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [engine.isRunning, settings.keepAwake]);

  const notifyUser = useCallback(
    (title: string, body: string) => {
      const s = settingsRef.current;
      if (
        !s.notificationsEnabled ||
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted'
      ) {
        return;
      }
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          silent: true,
        });
      } catch {
        // Ignore on Android Chrome if SW notification is required
      }
    },
    []
  );

  const firePhaseAlerts = useCallback(
    (nextPhase: 'work' | 'rest') => {
      const s = settingsRef.current;
      triggerVibration(s.vibrationPattern);
      const chimeDelay = playSoundPreset(
        s.soundPreset,
        s.soundVolume,
        nextPhase
      );

      if (s.voiceEnabled) {
        const phrase = nextPhase === 'work' ? s.workPhrase : s.restPhrase;
        speakCue(phrase, {
          voiceURI: s.selectedVoiceURI,
          rate: s.voiceRate,
          pitch: s.voicePitch,
          volume: s.soundVolume,
          delayMs: chimeDelay > 0 ? Math.min(480, chimeDelay) : 0,
        });
      }

      notifyUser(
        nextPhase === 'rest' ? 'Time to rest your eyes' : 'Time to work',
        nextPhase === 'rest'
          ? 'Look 20 feet away for 20 seconds.'
          : 'Back to your focus session.'
      );
    },
    [notifyUser]
  );

  const startSession = useCallback(() => {
    unlockAudioAndSpeech();
    const now = Date.now();
    setEngine({
      phase: 'work',
      isRunning: true,
      phaseElapsedMs: 0,
      segmentStartedAt: now,
      sessionStartedAt: now,
      sessionWorkMs: 0,
      sessionRestMs: 0,
      cycles: 0,
    });
    setNowTick(now);
    firePhaseAlerts('work');
  }, [firePhaseAlerts]);

  const pauseSession = useCallback(() => {
    const now = Date.now();
    setEngine((prev) => {
      if (!prev.isRunning || prev.phase === 'idle' || !prev.segmentStartedAt) {
        return prev;
      }
      const delta = Math.max(0, now - prev.segmentStartedAt);
      return {
        ...prev,
        isRunning: false,
        phaseElapsedMs: prev.phaseElapsedMs + delta,
        segmentStartedAt: null,
        sessionWorkMs:
          prev.phase === 'work' ? prev.sessionWorkMs + delta : prev.sessionWorkMs,
        sessionRestMs:
          prev.phase === 'rest' ? prev.sessionRestMs + delta : prev.sessionRestMs,
      };
    });
  }, []);

  const resumeSession = useCallback(() => {
    unlockAudioAndSpeech();
    const now = Date.now();
    setEngine((prev) => {
      if (prev.isRunning || prev.phase === 'idle') return prev;
      return {
        ...prev,
        isRunning: true,
        segmentStartedAt: now,
      };
    });
    setNowTick(now);
  }, []);

  const skipPhase = useCallback(() => {
    unlockAudioAndSpeech();
    const now = Date.now();
    const current = engineRef.current;
    if (current.phase === 'idle') {
      startSession();
      return;
    }

    const delta =
      current.isRunning && current.segmentStartedAt
        ? Math.max(0, now - current.segmentStartedAt)
        : 0;

    const nextPhase: 'work' | 'rest' =
      current.phase === 'work' ? 'rest' : 'work';
    const nextCycles =
      current.phase === 'rest' ? current.cycles + 1 : current.cycles;

    setEngine({
      phase: nextPhase,
      isRunning: true,
      phaseElapsedMs: 0,
      segmentStartedAt: now,
      sessionStartedAt: current.sessionStartedAt ?? now,
      sessionWorkMs:
        current.phase === 'work'
          ? current.sessionWorkMs + delta
          : current.sessionWorkMs,
      sessionRestMs:
        current.phase === 'rest'
          ? current.sessionRestMs + delta
          : current.sessionRestMs,
      cycles: nextCycles,
    });
    setNowTick(now);
    firePhaseAlerts(nextPhase);
  }, [firePhaseAlerts, startSession]);

  const stopSession = useCallback(
    (stoppedBy: 'manual' | 'schedule' = 'manual') => {
      const current = engineRef.current;
      if (current.phase === 'idle') return;

      const now = Date.now();
      const delta =
        current.isRunning && current.segmentStartedAt
          ? Math.max(0, now - current.segmentStartedAt)
          : 0;

      const finalWorkMs =
        current.sessionWorkMs + (current.phase === 'work' ? delta : 0);
      const finalRestMs =
        current.sessionRestMs + (current.phase === 'rest' ? delta : 0);

      const summary: SessionSummary = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        startedAt: current.sessionStartedAt ?? now,
        stoppedAt: now,
        workMs: finalWorkMs,
        restMs: finalRestMs,
        cycles: current.cycles,
        stoppedBy,
      };

      setEngine(INITIAL_ENGINE);
      setLatestSummary(summary);
      setHistory((prev) => [summary, ...prev].slice(0, 60));

      const s = settingsRef.current;
      triggerVibration(s.vibrationPattern);
      const chimeDelay = playSoundPreset(s.soundPreset, s.soundVolume, 'stop');
      if (s.voiceEnabled && s.speakStopSummary) {
        const spoken = `Session stopped. You worked for ${formatDurationSpoken(
          finalWorkMs
        )}, and took breaks for ${formatDurationSpoken(finalRestMs)}.`;
        speakCue(spoken, {
          voiceURI: s.selectedVoiceURI,
          rate: s.voiceRate,
          pitch: s.voicePitch,
          volume: s.soundVolume,
          delayMs: chimeDelay > 0 ? Math.min(480, chimeDelay) : 0,
        });
      }
    },
    []
  );

  // High-accuracy timestamp timer loop
  useEffect(() => {
    if (!engine.isRunning || engine.phase === 'idle') return;

    const tick = () => {
      const now = Date.now();
      setNowTick(now);

      const cur = engineRef.current;
      if (!cur.isRunning || cur.phase === 'idle' || !cur.segmentStartedAt) {
        return;
      }

      const s = settingsRef.current;
      const targetMs =
        (cur.phase === 'work' ? s.workSeconds : s.restSeconds) * 1000;
      const delta = Math.max(0, now - cur.segmentStartedAt);
      const totalElapsed = cur.phaseElapsedMs + delta;

      if (totalElapsed >= targetMs) {
        const nextPhase: 'work' | 'rest' =
          cur.phase === 'work' ? 'rest' : 'work';
        const nextCycles =
          cur.phase === 'rest' ? cur.cycles + 1 : cur.cycles;

        const nextTargetMs =
          (nextPhase === 'work' ? s.workSeconds : s.restSeconds) * 1000;
        const overshoot = totalElapsed - targetMs;
        const carryOver = overshoot < nextTargetMs ? overshoot : 0;

        setEngine({
          phase: nextPhase,
          isRunning: true,
          phaseElapsedMs: carryOver,
          segmentStartedAt: now,
          sessionStartedAt: cur.sessionStartedAt ?? now,
          sessionWorkMs:
            cur.phase === 'work' ? cur.sessionWorkMs + delta : cur.sessionWorkMs,
          sessionRestMs:
            cur.phase === 'rest' ? cur.sessionRestMs + delta : cur.sessionRestMs,
          cycles: nextCycles,
        });
        firePhaseAlerts(nextPhase);
      }
    };

    const intervalId = window.setInterval(tick, 200);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [engine.isRunning, engine.phase, firePhaseAlerts]);

  // Daily Start & Stop Scheduler
  useEffect(() => {
    const checkSchedule = () => {
      const s = settingsRef.current;
      if (!s.scheduler.enabled) return;

      const now = new Date();
      const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const dayOfWeek = now.getDay();
      if (!s.scheduler.days.includes(dayOfWeek)) return;

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMin = parseHHMMToMinutes(s.scheduler.startTime);
      const stopMin = parseHHMMToMinutes(s.scheduler.stopTime);

      if (
        s.scheduler.autoStart &&
        engineRef.current.phase === 'idle' &&
        nowMinutes === startMin &&
        lastAutoStartDateRef.current !== todayKey
      ) {
        lastAutoStartDateRef.current = todayKey;
        startSession();
      }

      if (
        s.scheduler.autoStop &&
        engineRef.current.phase !== 'idle' &&
        nowMinutes === stopMin &&
        lastAutoStopDateRef.current !== todayKey
      ) {
        lastAutoStopDateRef.current = todayKey;
        stopSession('schedule');
      }
    };

    const id = window.setInterval(checkSchedule, 1000);
    return () => window.clearInterval(id);
  }, [startSession, stopSession]);

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      updateSettings({ notificationsEnabled: true });
    }
  };

  // Compute live display values
  const liveSegmentDelta =
    engine.isRunning && engine.segmentStartedAt
      ? Math.max(0, nowTick - engine.segmentStartedAt)
      : 0;

  const totalPhaseSeconds =
    engine.phase === 'rest' ? settings.restSeconds : settings.workSeconds;

  const currentPhaseElapsedMs =
    engine.phase === 'idle' ? 0 : engine.phaseElapsedMs + liveSegmentDelta;

  const remainingSeconds =
    engine.phase === 'idle'
      ? settings.workSeconds
      : Math.max(0, totalPhaseSeconds - currentPhaseElapsedMs / 1000);

  const liveWorkMs =
    engine.sessionWorkMs + (engine.phase === 'work' ? liveSegmentDelta : 0);
  const liveRestMs =
    engine.sessionRestMs + (engine.phase === 'rest' ? liveSegmentDelta : 0);

  const cycleTheme = () => {
    const idx = THEME_LIST.findIndex((t) => t.id === settings.theme);
    const next = THEME_LIST[(idx + 1) % THEME_LIST.length];
    updateSettings({ theme: next.id });
  };

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: typeof Clock;
  }> = useMemo(
    () => [
      { id: 'timer', label: 'Timer', icon: Clock },
      { id: 'audio', label: 'Voice & Sound', icon: Volume2 },
      { id: 'schedule', label: 'Schedule', icon: CalendarClock },
      { id: 'history', label: 'History', icon: History },
    ],
    []
  );

  return (
    <div
      className={`min-h-dvh flex flex-col ${theme.bgClass} ${theme.textPrimaryClass} transition-colors duration-300`}
    >
      {/* Top Bar — 3-Zone Contract on desktop, compact 52px bar on mobile */}
      <header
        className={`sticky top-0 z-30 h-14 border-b ${theme.borderClass} ${theme.bgClass}/90 backdrop-blur-md`}
      >
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('timer');
            }}
            className="text-lg font-display font-semibold tracking-tight whitespace-nowrap shrink-0"
          >
            Blink 20
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? `${theme.textPrimaryClass} border-current`
                      : `${theme.textMutedClass} border-transparent hover:${theme.textSecondaryClass}`
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton theme={theme} />
            <button
              type="button"
              onClick={cycleTheme}
              title={`Switch dark theme (${theme.name})`}
              className={`min-h-[38px] px-3 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} text-xs font-medium ${theme.textSecondaryClass} flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: theme.workAccentHex }}
                aria-hidden="true"
              />
              <span>{theme.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24 md:py-10">
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Primary Focus Canvas */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center py-2 sm:py-4">
              {/* Unboxed minimal metadata line */}
              <div className={`text-xs ${theme.textMutedClass} flex items-center gap-2 mb-4`}>
                <span>20-20-20 Eye Care</span>
                {settings.voiceEnabled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Female Voice On</span>
                  </>
                )}
                {settings.scheduler.enabled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {settings.scheduler.startTime}–{settings.scheduler.stopTime}
                    </span>
                  </>
                )}
              </div>

              <TimerRing
                phase={engine.phase}
                isRunning={engine.isRunning}
                remainingSeconds={remainingSeconds}
                totalPhaseSeconds={totalPhaseSeconds}
                cycleCount={engine.cycles}
                workSeconds={settings.workSeconds}
                restSeconds={settings.restSeconds}
                theme={theme}
              />

              {/* Live Session Totals (Visible during active/paused session) */}
              <div
                className={`mt-5 text-xs sm:text-sm ${theme.textMutedClass} flex items-center gap-2.5 font-mono-tabular`}
              >
                {engine.phase === 'idle' ? (
                  <span>Press Start for your next work block</span>
                ) : (
                  <>
                    <span>
                      Work{' '}
                      <strong className={theme.workAccentClass}>
                        {formatDurationHuman(liveWorkMs)}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Break{' '}
                      <strong className={theme.restAccentClass}>
                        {formatDurationHuman(liveRestMs)}
                      </strong>
                    </span>
                  </>
                )}
              </div>

              {/* Primary Thumb-Zone Controls */}
              <div className="mt-7 w-full max-w-sm flex items-center gap-3">
                {engine.phase === 'idle' ? (
                  <button
                    type="button"
                    onClick={startSession}
                    className={`flex-1 min-h-[52px] px-6 rounded-2xl ${theme.workButtonClass} text-base font-semibold flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] whitespace-nowrap`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Start Timer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={engine.isRunning ? pauseSession : resumeSession}
                      className={`flex-1 min-h-[52px] px-5 rounded-2xl ${
                        engine.phase === 'rest'
                          ? theme.restButtonClass
                          : theme.workButtonClass
                      } text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] whitespace-nowrap`}
                    >
                      {engine.isRunning ? (
                        <>
                          <Pause className="w-5 h-5 fill-current" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          Resume
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={skipPhase}
                      aria-label={
                        engine.phase === 'work'
                          ? 'Switch to rest phase'
                          : 'Switch to work phase'
                      }
                      title={
                        engine.phase === 'work'
                          ? 'Rest now'
                          : 'Back to work'
                      }
                      className={`min-h-[52px] min-w-[52px] px-4 rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textPrimaryClass} flex items-center justify-center transition-colors`}
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => stopSession('manual')}
                      className={`min-h-[52px] px-5 rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textPrimaryClass} text-sm sm:text-base font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap`}
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Quick Interval Toggle */}
              <div className="mt-5 lg:hidden w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => setShowMobileCustomizer((v) => !v)}
                  className={`w-full min-h-[44px] px-4 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} text-xs font-medium ${theme.textSecondaryClass} flex items-center justify-between transition-colors`}
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Customize work & rest time
                  </span>
                  <span className={`font-mono-tabular ${theme.textMutedClass}`}>
                    {showMobileCustomizer ? 'Hide' : 'Edit'}
                  </span>
                </button>

                {showMobileCustomizer && (
                  <div
                    className={`mt-3 rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} p-4`}
                  >
                    <IntervalCustomizer
                      workSeconds={settings.workSeconds}
                      restSeconds={settings.restSeconds}
                      theme={theme}
                      disabled={engine.phase !== 'idle'}
                      onChangeWork={(workSeconds) =>
                        updateSettings({ workSeconds })
                      }
                      onChangeRest={(restSeconds) =>
                        updateSettings({ restSeconds })
                      }
                    />
                    {engine.phase !== 'idle' && (
                      <p className={`mt-3 text-xs ${theme.textMutedClass}`}>
                        Stop the active session to adjust interval lengths.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Right Panel: Intervals + Quick Status */}
            <div className="hidden lg:block lg:col-span-5 space-y-6">
              <div
                className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceClass} p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-base font-semibold ${theme.textPrimaryClass}`}
                  >
                    Interval Lengths
                  </h2>
                  {engine.phase !== 'idle' && (
                    <span className={`text-xs ${theme.textMutedClass}`}>
                      Stop session to edit
                    </span>
                  )}
                </div>

                <IntervalCustomizer
                  workSeconds={settings.workSeconds}
                  restSeconds={settings.restSeconds}
                  theme={theme}
                  disabled={engine.phase !== 'idle'}
                  onChangeWork={(workSeconds) =>
                    updateSettings({ workSeconds })
                  }
                  onChangeRest={(restSeconds) =>
                    updateSettings({ restSeconds })
                  }
                />
              </div>

              <div
                className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceClass} p-6 space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme.textPrimaryClass}`}>
                    Voice & Alerts
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audio')}
                    className={`text-xs font-medium ${theme.workAccentClass} hover:underline`}
                  >
                    Configure
                  </button>
                </div>
                <p className={`text-xs leading-relaxed ${theme.textMutedClass}`}>
                  {settings.voiceEnabled
                    ? `Female voice speaks "${settings.workPhrase}" and "${settings.restPhrase}"`
                    : 'Voice announcements muted'}
                  <span aria-hidden="true"> · </span>
                  Vibration: {settings.vibrationPattern}
                </p>

                <hr className={`border-t ${theme.borderClass}`} />

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme.textPrimaryClass}`}>
                    Daily Schedule
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`text-xs font-medium ${theme.restAccentClass} hover:underline`}
                  >
                    Edit schedule
                  </button>
                </div>
                <p className={`text-xs leading-relaxed ${theme.textMutedClass}`}>
                  {settings.scheduler.enabled
                    ? `Scheduled ${settings.scheduler.startTime} to ${settings.scheduler.stopTime}`
                    : 'Manual start and stop (daily schedule off)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className={`text-xl font-semibold ${theme.textPrimaryClass}`}>
                Voice, Sound & Vibration
              </h1>
              <p className={`mt-1 text-xs ${theme.textMutedClass}`}>
                Choose a female voice style, chime tone, and Android vibration alert for work and eye rest cues.
              </p>
            </div>
            <AudioVoicePanel
              settings={settings}
              voices={voices}
              theme={theme}
              onUpdate={updateSettings}
            />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className={`text-xl font-semibold ${theme.textPrimaryClass}`}>
                Schedule & Theme
              </h1>
              <p className={`mt-1 text-xs ${theme.textMutedClass}`}>
                Set automatic daily start/stop times and switch between dark theme variants.
              </p>
            </div>
            <ScheduleThemePanel
              settings={settings}
              theme={theme}
              notificationPermission={notificationPermission}
              onUpdate={updateSettings}
              onRequestNotifications={handleRequestNotifications}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className={`text-xl font-semibold ${theme.textPrimaryClass}`}>
                Work & Break Log
              </h1>
              <p className={`mt-1 text-xs ${theme.textMutedClass}`}>
                Exact work hours and eye break durations recorded when stopping a session.
              </p>
            </div>
            <HistoryPanel
              sessions={history}
              theme={theme}
              onClearHistory={() => setHistory([])}
            />
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (<= 15% sticky height cap) */}
      <nav
        aria-label="Mobile bottom navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t ${theme.borderClass} ${theme.bgClass}/95 backdrop-blur-md`}
      >
        <div className="grid grid-cols-4 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? theme.workAccentClass : theme.textMutedClass
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline Indicator */}
      {!isOnline && (
        <div
          className={`fixed bottom-20 md:bottom-4 left-4 z-40 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} px-3 py-2 text-xs ${theme.textSecondaryClass} flex items-center gap-2 shadow-lg`}
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline mode — timer & sounds work locally</span>
        </div>
      )}

      {/* Session Stop Summary Modal */}
      <SessionSummaryModal
        summary={latestSummary}
        theme={theme}
        onClose={() => setLatestSummary(null)}
        onStartNew={() => {
          setLatestSummary(null);
          startSession();
        }}
      />
    </div>
  );
}
