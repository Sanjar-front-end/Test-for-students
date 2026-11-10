'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<number, string>;
  questionIds: number[];
  onSelectIndex: (index: number) => void;
}

export function QuestionPalette({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectIndex,
}: QuestionPaletteProps) {
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Сұрақтар кестесі</h3>
          <p className="text-xs text-slate-400">
            Орындалды: <span className="font-semibold text-indigo-400">{answeredCount}</span> / {totalQuestions} ({progressPercent}%)
          </p>
        </div>
      </div>

      {/* Progress line */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 25 Question Buttons Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          const isAnswered = qId !== undefined && answers[qId] !== undefined && answers[qId] !== '';
          const isCurrent = idx === currentIndex;

          let btnClass = 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200';

          if (isCurrent) {
            btnClass = 'bg-indigo-600 border-indigo-400 text-white font-bold ring-2 ring-indigo-400/50 glow-primary scale-105 z-10';
          } else if (isAnswered) {
            btnClass = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40 font-medium';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`relative h-10 w-full rounded-xl border text-sm flex items-center justify-center transition-all cursor-pointer font-mono ${btnClass}`}
              title={`Сұрақ ${idx + 1}${isAnswered ? ' (Жауап берілген)' : ''}`}
            >
              <span>{idx + 1}</span>
              {isAnswered && !isCurrent && (
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-indigo-600 border border-indigo-400" />
          <span>Ағымдағы</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-emerald-950/60 border border-emerald-500/50" />
          <span>Жауап берілді</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-slate-800/80 border border-slate-700" />
          <span>Жауап жоқ</span>
        </div>
      </div>
    </div>
  );
}
