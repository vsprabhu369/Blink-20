import React from 'react';
import { CalendarClock, Palette, ShieldCheck } from 'lucide-react';
import { DARK_THEMES, DarkThemeVariant, THEME_LIST } from '../themes';
import { ThemeVariantId, TimerSettings } from '../types';

interface ScheduleThemePanelProps {
  settings: TimerSettings;
  theme: DarkThemeVariant;
  notificationPermission: NotificationPermission | 'unsupported';
  onUpdate: (patch: Partial<TimerSettings>) => void;
  onRequestNotifications: () => void;
}

const WEEKDAYS = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];

export const ScheduleThemePanel: React.FC<ScheduleThemePanelProps> = ({
  settings,
  theme,
  notificationPermission,
  onUpdate,
  onRequestNotifications,
}) => {
  const { scheduler } = settings;

  const updateScheduler = (patch: Partial<TimerSettings['scheduler']>) => {
    onUpdate({ scheduler: { ...scheduler, ...patch } });
  };

  const toggleDay = (day: number) => {
    const exists = scheduler.days.includes(day);
    const next = exists
      ? scheduler.days.filter((d) => d !== day)
      : [...scheduler.days, day];
    updateScheduler({ days: next });
  };

  return (
    <div className="space-y-8">
      {/* Start / Stop Scheduler */}
      <section aria-labelledby="scheduler-heading">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CalendarClock className={`w-4 h-4 ${theme.workAccentClass}`} />
            <div>
              <h2
                id="scheduler-heading"
                className={`text-base font-semibold ${theme.textPrimaryClass}`}
              >
                Daily Start & Stop Schedule
              </h2>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={scheduler.enabled}
            onClick={() => updateScheduler({ enabled: !scheduler.enabled })}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              scheduler.enabled
                ? theme.workButtonClass
                : `border ${theme.borderClass} ${theme.textMutedClass}`
            }`}
          >
            {scheduler.enabled ? 'Active' : 'Off'}
          </button>
        </div>

        <p className={`mt-2 text-xs leading-relaxed ${theme.textMutedClass}`}>
          Automatically start your 20-20-20 timer at your workday start and stop with a full work & break summary at your finish time.
        </p>

        <div
          className={`mt-4 space-y-4 transition-opacity ${
            scheduler.enabled ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schedule-start"
                className={`block text-xs font-medium mb-1.5 ${theme.textMutedClass}`}
              >
                Start time
              </label>
              <input
                id="schedule-start"
                type="time"
                value={scheduler.startTime}
                onChange={(e) => updateScheduler({ startTime: e.target.value })}
                className={`w-full min-h-[46px] px-3.5 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.textPrimaryClass} text-sm font-mono-tabular focus:outline-none focus:ring-2 focus:ring-white/20`}
              />
            </div>

            <div>
              <label
                htmlFor="schedule-stop"
                className={`block text-xs font-medium mb-1.5 ${theme.textMutedClass}`}
              >
                Stop time
              </label>
              <input
                id="schedule-stop"
                type="time"
                value={scheduler.stopTime}
                onChange={(e) => updateScheduler({ stopTime: e.target.value })}
                className={`w-full min-h-[46px] px-3.5 rounded-xl border ${theme.borderClass} ${theme.surfaceClass} ${theme.textPrimaryClass} text-sm font-mono-tabular focus:outline-none focus:ring-2 focus:ring-white/20`}
              />
            </div>
          </div>

          <div>
            <div className={`text-xs font-medium mb-2 ${theme.textMutedClass}`}>
              Active days
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((item) => {
                const active = scheduler.days.includes(item.day);
                return (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => toggleDay(item.day)}
                    aria-pressed={active}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? theme.workButtonClass
                        : `border ${theme.borderClass} ${theme.surfaceClass} ${theme.textMutedClass} ${theme.surfaceHoverClass}`
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <span className={`text-sm ${theme.textSecondaryClass}`}>
                Auto-start timer at start time
              </span>
              <input
                type="checkbox"
                checked={scheduler.autoStart}
                onChange={(e) => updateScheduler({ autoStart: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <span className={`text-sm ${theme.textSecondaryClass}`}>
                Auto-stop and show hours summary at stop time
              </span>
              <input
                type="checkbox"
                checked={scheduler.autoStop}
                onChange={(e) => updateScheduler({ autoStop: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded"
              />
            </label>
          </div>
        </div>
      </section>

      <hr className={`border-t ${theme.borderClass}`} />

      {/* Dark Theme Variants */}
      <section aria-labelledby="theme-heading">
        <div className="flex items-center gap-2.5">
          <Palette className={`w-4 h-4 ${theme.restAccentClass}`} />
          <h2
            id="theme-heading"
            className={`text-base font-semibold ${theme.textPrimaryClass}`}
          >
            Dark Theme Variants
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_LIST.map((variant) => {
            const active = settings.theme === variant.id;
            const previewTheme = DARK_THEMES[variant.id as ThemeVariantId];
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onUpdate({ theme: variant.id })}
                className={`min-h-[68px] text-left p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                  active
                    ? `${theme.workSoftBgClass} border-current ${theme.workAccentClass}`
                    : `${theme.surfaceClass} ${theme.borderClass} ${theme.surfaceHoverClass}`
                }`}
              >
                <div>
                  <div className={`text-sm font-semibold ${theme.textPrimaryClass}`}>
                    {variant.name}
                  </div>
                  <div className={`text-xs mt-0.5 ${theme.textMutedClass}`}>
                    {variant.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span
                    className="w-4 h-4 rounded-full border border-white/15"
                    style={{ backgroundColor: previewTheme.bgHex }}
                  />
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: previewTheme.workAccentHex }}
                  />
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: previewTheme.restAccentHex }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <hr className={`border-t ${theme.borderClass}`} />

      {/* Android & Power Options */}
      <section aria-labelledby="device-heading">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-4 h-4 ${theme.workAccentClass}`} />
          <h2
            id="device-heading"
            className={`text-base font-semibold ${theme.textPrimaryClass}`}
          >
            Device & Alerts
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
            <div>
              <div className={`text-sm ${theme.textSecondaryClass}`}>
                Keep screen awake while running
              </div>
              <div className={`text-xs ${theme.textMutedClass}`}>
                Uses Screen Wake Lock so Android stays responsive
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.keepAwake}
              onChange={(e) => onUpdate({ keepAwake: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded shrink-0"
            />
          </label>

          <div className="flex items-center justify-between gap-3 py-1">
            <div>
              <div className={`text-sm ${theme.textSecondaryClass}`}>
                Background notifications
              </div>
              <div className={`text-xs ${theme.textMutedClass}`}>
                {notificationPermission === 'granted'
                  ? 'Alerts appear even if you switch apps'
                  : notificationPermission === 'denied'
                    ? 'Blocked in browser settings'
                    : notificationPermission === 'unsupported'
                      ? 'Not supported in this browser'
                      : 'Notify when work or rest starts'}
              </div>
            </div>

            <button
              type="button"
              onClick={onRequestNotifications}
              disabled={notificationPermission === 'unsupported'}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.notificationsEnabled && notificationPermission === 'granted'
                  ? theme.restButtonClass
                  : `border ${theme.borderClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
              }`}
            >
              {settings.notificationsEnabled && notificationPermission === 'granted'
                ? 'Active'
                : 'Enable'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
