import React from 'react';
import { DarkThemeVariant } from '../themes';
import { TimerPhase } from '../types';
import { formatCountdown, formatShortInterval } from '../utils/formatTime';

interface TimerRingProps {
  phase: TimerPhase;
  isRunning: boolean;
  remainingSeconds: number;
  totalPhaseSeconds: number;
  cycleCount: number;
  workSeconds: number;
  restSeconds: number;
  theme: DarkThemeVariant;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  phase,
  isRunning,
  remainingSeconds,
  totalPhaseSeconds,
  cycleCount,
  workSeconds,
  restSeconds,
  theme,
}) => {
  const size = 276;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress =
    totalPhaseSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / totalPhaseSeconds))
      : 1;
  const dashOffset = circumference * (1 - progress);

  const activeColor =
    phase === 'rest' ? theme.restAccentHex : theme.workAccentHex;

  const phaseTitle =
    phase === 'idle'
      ? 'Ready to focus'
      : phase === 'work'
        ? isRunning
          ? 'Time to work'
          : 'Work paused'
        : isRunning
          ? 'Time to rest'
          : 'Rest paused';

  const subHint =
    phase === 'rest'
      ? 'Look 20 ft away · Blink softly'
      : phase === 'work'
        ? `Cycle ${cycleCount + 1} · Next ${formatShortInterval(restSeconds)} rest`
        : `${formatShortInterval(workSeconds)} work · ${formatShortInterval(restSeconds)} rest`;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center w-[264px] h-[264px] sm:w-[292px] sm:h-[292px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`${phaseTitle}: ${formatCountdown(remainingSeconds)} remaining`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.ringTrackHex}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 180ms linear, stroke 250ms ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span
            className={`text-sm font-medium tracking-wide ${
              phase === 'rest' ? theme.restAccentClass : theme.workAccentClass
            }`}
          >
            {phaseTitle}
          </span>

          <div
            className={`mt-2 text-5xl sm:text-6xl font-semibold tracking-tight font-mono-tabular ${theme.textPrimaryClass}`}
          >
            {formatCountdown(remainingSeconds)}
          </div>

          <span className={`mt-2.5 text-xs ${theme.textMutedClass}`}>
            {subHint}
          </span>
        </div>
      </div>
    </div>
  );
};
