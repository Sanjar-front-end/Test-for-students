'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  remainingSeconds: number;
  totalDuration?: number; // 600 default
}

export function Timer({ remainingSeconds, totalDuration = 600 }: TimerProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (remainingSeconds / totalDuration) * 100));

  // Determine urgency color
  const isUrgent = remainingSeconds <= 60; // < 1 min
  const isWarning = remainingSeconds <= 180 && !isUrgent; // < 3 min

  let colorClasses = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
  let progressColor = 'bg-emerald-500';

  if (isUrgent) {
    colorClasses = 'border-rose-500/50 bg-rose-950/40 text-rose-400 animate-pulse glow-rose';
    progressColor = 'bg-rose-500';
  } else if (isWarning) {
    colorClasses = 'border-amber-500/40 bg-amber-950/25 text-amber-300 glow-amber';
    progressColor = 'bg-amber-400';
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border backdrop-blur-md transition-all ${colorClasses}`}
      >
        {isUrgent ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 opacity-80" />
        )}
        <div className="font-mono text-base sm:text-lg font-bold tracking-wider">
          {formattedTime}
        </div>
        <span className="text-xs uppercase tracking-wider opacity-70 hidden sm:inline">
          {isUrgent ? 'Уақыт аз!' : 'қалды'}
        </span>
      </div>

      {/* Mini remaining time progress bar */}
      <div className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
