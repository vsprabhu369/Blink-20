import React from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { DarkThemeVariant } from '../themes';
import { SessionSummary } from '../types';
import {
  formatClockTime,
  formatDurationHuman,
  formatHoursDecimal,
} from '../utils/formatTime';

interface SessionSummaryModalProps {
  summary: SessionSummary | null;
  theme: DarkThemeVariant;
  onClose: () => void;
  onStartNew: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  theme,
  onClose,
  onStartNew,
}) => {
  if (!summary) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-summary-title"
    >
      <div
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border ${theme.surfaceClass} ${theme.borderClass} p-6 pb-8 sm:pb-6 shadow-2xl`}
      >
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="session-summary-title"
              className={`text-xl font-semibold tracking-tight ${theme.textPrimaryClass}`}
            >
              {summary.stoppedBy === 'schedule'
                ? 'Scheduled Stop Reached'
                : 'Session Summary'}
            </h2>
            <p className={`mt-1 text-xs ${theme.textMutedClass}`}>
              {formatClockTime(summary.startedAt)} –{' '}
              {formatClockTime(summary.stoppedAt)}
              <span aria-hidden="true"> · </span>
              {summary.cycles} {summary.cycles === 1 ? 'cycle' : 'cycles'} completed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            className={`min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl ${theme.textMutedClass} ${theme.surfaceHoverClass} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div
            className={`rounded-2xl border ${theme.borderClass} ${theme.bgClass} p-4`}
          >
            <div className={`text-xs font-medium ${theme.workAccentClass}`}>
              Hours worked
            </div>
            <div
              className={`mt-2 text-2xl font-semibold font-mono-tabular ${theme.textPrimaryClass}`}
            >
              {formatDurationHuman(summary.workMs)}
            </div>
            <div className={`mt-1 text-xs font-mono-tabular ${theme.textMutedClass}`}>
              {formatHoursDecimal(summary.workMs)}
            </div>
          </div>

          <div
            className={`rounded-2xl border ${theme.borderClass} ${theme.bgClass} p-4`}
          >
            <div className={`text-xs font-medium ${theme.restAccentClass}`}>
              Breaks taken
            </div>
            <div
              className={`mt-2 text-2xl font-semibold font-mono-tabular ${theme.textPrimaryClass}`}
            >
              {formatDurationHuman(summary.restMs)}
            </div>
            <div className={`mt-1 text-xs font-mono-tabular ${theme.textMutedClass}`}>
              {formatHoursDecimal(summary.restMs)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onStartNew}
            className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl border ${theme.borderClass} ${theme.textPrimaryClass} ${theme.surfaceHoverClass} text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap`}
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 min-h-[48px] px-4 py-2.5 rounded-xl ${theme.workButtonClass} text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap`}
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
