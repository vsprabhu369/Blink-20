import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { DarkThemeVariant } from '../themes';
import { formatShortInterval } from '../utils/formatTime';

interface IntervalCustomizerProps {
  workSeconds: number;
  restSeconds: number;
  theme: DarkThemeVariant;
  disabled?: boolean;
  onChangeWork: (seconds: number) => void;
  onChangeRest: (seconds: number) => void;
}

const WORK_PRESETS = [
  { label: '15m', seconds: 15 * 60 },
  { label: '20m', seconds: 20 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '45m', seconds: 45 * 60 },
];

const REST_PRESETS = [
  { label: '20s', seconds: 20 },
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
];

export const IntervalCustomizer: React.FC<IntervalCustomizerProps> = ({
  workSeconds,
  restSeconds,
  theme,
  disabled = false,
  onChangeWork,
  onChangeRest,
}) => {
  const adjustWork = (deltaMinutes: number) => {
    const next = Math.max(60, Math.min(180 * 60, workSeconds + deltaMinutes * 60));
    onChangeWork(next);
  };

  const adjustRest = (deltaSeconds: number) => {
    const next = Math.max(5, Math.min(30 * 60, restSeconds + deltaSeconds));
    onChangeRest(next);
  };

  return (
    <div className="space-y-5">
      {/* Work Interval */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-xs font-medium ${theme.textMutedClass}`}>
            Work duration
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => adjustWork(-1)}
              aria-label="Decrease work time by 1 minute"
              className={`min-h-[36px] min-w-[36px] rounded-lg border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textSecondaryClass} flex items-center justify-center disabled:opacity-40`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className={`min-w-[54px] text-center text-sm font-semibold font-mono-tabular ${theme.workAccentClass}`}
            >
              {formatShortInterval(workSeconds)}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => adjustWork(1)}
              aria-label="Increase work time by 1 minute"
              className={`min-h-[36px] min-w-[36px] rounded-lg border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textSecondaryClass} flex items-center justify-center disabled:opacity-40`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {WORK_PRESETS.map((preset) => {
            const active = workSeconds === preset.seconds;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => onChangeWork(preset.seconds)}
                className={`min-h-[42px] rounded-xl text-xs font-medium font-mono-tabular transition-colors whitespace-nowrap disabled:opacity-45 ${
                  active
                    ? theme.workButtonClass
                    : `border ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rest Interval */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-xs font-medium ${theme.textMutedClass}`}>
            Rest duration
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => adjustRest(restSeconds > 60 ? -15 : -5)}
              aria-label="Decrease rest time"
              className={`min-h-[36px] min-w-[36px] rounded-lg border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textSecondaryClass} flex items-center justify-center disabled:opacity-40`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className={`min-w-[54px] text-center text-sm font-semibold font-mono-tabular ${theme.restAccentClass}`}
            >
              {formatShortInterval(restSeconds)}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => adjustRest(restSeconds >= 60 ? 15 : 5)}
              aria-label="Increase rest time"
              className={`min-h-[36px] min-w-[36px] rounded-lg border ${theme.borderClass} ${theme.surfaceClass} ${theme.surfaceHoverClass} ${theme.textSecondaryClass} flex items-center justify-center disabled:opacity-40`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {REST_PRESETS.map((preset) => {
            const active = restSeconds === preset.seconds;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => onChangeRest(preset.seconds)}
                className={`min-h-[42px] rounded-xl text-xs font-medium font-mono-tabular transition-colors whitespace-nowrap disabled:opacity-45 ${
                  active
                    ? theme.restButtonClass
                    : `border ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass}`
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
