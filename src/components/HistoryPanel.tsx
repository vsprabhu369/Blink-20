import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { DarkThemeVariant } from '../themes';
import { SessionSummary } from '../types';
import {
  formatClockTime,
  formatDurationHuman,
  formatHoursDecimal,
} from '../utils/formatTime';

interface HistoryPanelProps {
  sessions: SessionSummary[];
  theme: DarkThemeVariant;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  theme,
  onClearHistory,
}) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(
    (s) => s.startedAt >= startOfToday.getTime()
  );

  const todayWorkMs = todaySessions.reduce((acc, s) => acc + s.workMs, 0);
  const todayRestMs = todaySessions.reduce((acc, s) => acc + s.restMs, 0);
  const todayCycles = todaySessions.reduce((acc, s) => acc + s.cycles, 0);

  return (
    <div className="space-y-6">
      {/* Today Totals */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          className={`rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} p-3.5`}
        >
          <div className={`text-xs ${theme.workAccentClass}`}>Today work</div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-semibold font-mono-tabular ${theme.textPrimaryClass}`}
          >
            {formatDurationHuman(todayWorkMs)}
          </div>
          <div className={`text-xs font-mono-tabular ${theme.textMutedClass}`}>
            {formatHoursDecimal(todayWorkMs)}
          </div>
        </div>

        <div
          className={`rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} p-3.5`}
        >
          <div className={`text-xs ${theme.restAccentClass}`}>Today break</div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-semibold font-mono-tabular ${theme.textPrimaryClass}`}
          >
            {formatDurationHuman(todayRestMs)}
          </div>
          <div className={`text-xs font-mono-tabular ${theme.textMutedClass}`}>
            {formatHoursDecimal(todayRestMs)}
          </div>
        </div>

        <div
          className={`rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} p-3.5`}
        >
          <div className={`text-xs ${theme.textMutedClass}`}>Cycles</div>
          <div
            className={`mt-1.5 text-lg sm:text-xl font-semibold font-mono-tabular ${theme.textPrimaryClass}`}
          >
            {todayCycles}
          </div>
          <div className={`text-xs ${theme.textMutedClass}`}>
            {todaySessions.length}{' '}
            {todaySessions.length === 1 ? 'session' : 'sessions'}
          </div>
        </div>
      </div>

      {/* Session List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-base font-semibold ${theme.textPrimaryClass}`}>
            Completed Sessions
          </h2>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className={`min-h-[38px] px-3 rounded-xl text-xs font-medium ${theme.textMutedClass} ${theme.surfaceHoverClass} flex items-center gap-1.5 transition-colors`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div
            className={`rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} p-8 text-center`}
          >
            <Clock className={`w-6 h-6 mx-auto ${theme.textMutedClass}`} />
            <p className={`mt-3 text-sm font-medium ${theme.textSecondaryClass}`}>
              No stopped sessions yet
            </p>
            <p className={`mt-1 text-xs ${theme.textMutedClass}`}>
              When you stop a session or reach your scheduled stop time, your work hours and break totals appear here.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border ${theme.borderClass} ${theme.surfaceClass} divide-y ${theme.borderClass}`}
          >
            {sessions.map((item) => {
              const dateLabel = new Date(item.startedAt).toLocaleDateString(
                [],
                { month: 'short', day: 'numeric' }
              );
              return (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className={`text-sm font-medium ${theme.textPrimaryClass}`}>
                      {dateLabel}
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-tabular">
                        {formatClockTime(item.startedAt)} –{' '}
                        {formatClockTime(item.stoppedAt)}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs ${theme.textMutedClass}`}>
                      {item.cycles} {item.cycles === 1 ? 'cycle' : 'cycles'}
                      <span aria-hidden="true"> · </span>
                      {item.stoppedBy === 'schedule'
                        ? 'Scheduled stop'
                        : 'Manual stop'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold font-mono-tabular ${theme.workAccentClass}`}
                    >
                      {formatDurationHuman(item.workMs)} work
                    </div>
                    <div
                      className={`mt-0.5 text-xs font-mono-tabular ${theme.restAccentClass}`}
                    >
                      {formatDurationHuman(item.restMs)} break
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
