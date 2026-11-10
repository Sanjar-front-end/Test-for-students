'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  Clock,
  Percent,
  Eye,
  LogOut,
  Sparkles,
  User,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface ResultsViewProps {
  firstName: string;
  lastName: string;
  score: number;
  total: number;
  percentage: number;
  timeSpentFormatted: string;
  submittedAt?: number;
  onOpenReview: () => void;
  onLogout: () => void;
}

export function ResultsView({
  firstName,
  lastName,
  score,
  total,
  percentage,
  timeSpentFormatted,
  submittedAt,
  onOpenReview,
  onLogout,
}: ResultsViewProps) {
  useEffect(() => {
    // Fire festive confetti if score >= 50%
    if (percentage >= 50) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#10b981', '#38bdf8', '#fbbf24'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#10b981', '#38bdf8', '#fbbf24'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [percentage]);

  // Determine achievement grade
  let gradeText = 'Қайталау қажет';
  let gradeColor = 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  let ringColor = 'stroke-rose-500';

  if (percentage >= 85) {
    gradeText = 'Үздік нәтиже! Керемет!';
    gradeColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    ringColor = 'stroke-emerald-400';
  } else if (percentage >= 70) {
    gradeText = 'Жақсы нәтиже!';
    gradeColor = 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40';
    ringColor = 'stroke-indigo-400';
  } else if (percentage >= 50) {
    gradeText = 'Қанағаттанарлық нәтиже';
    gradeColor = 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    ringColor = 'stroke-amber-400';
  }

  const dateFormatted = submittedAt
    ? new Date(submittedAt).toLocaleString('kk-KZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('kk-KZ');

  // SVG circle circumference
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold mb-3 backdrop-blur-md glow-primary border-indigo-500/30 bg-indigo-950/40 text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Тест сәтті аяқталды</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Тестілеу нәтижесі
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Өсімдіктер мен жануарлардағы гаметогенез және спорогенез
        </p>
      </div>

      {/* Main Results Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Student Name Card */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Оқушы</div>
              <div className="text-lg font-bold text-white">
                {firstName} {lastName}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${gradeColor}`}>
            {gradeText}
          </div>
        </div>

        {/* Circular Score Visualizer */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800 fill-none"
                strokeWidth="12"
              />
              {/* Progress ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className={`fill-none transition-all duration-1000 ease-out ${ringColor}`}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {percentage}%
              </span>
              <span className="text-xs text-slate-400 font-medium mt-0.5">Жалпы нәтиже</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-8">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400">Дұрыс жауаптар</div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">
              <span className="text-emerald-400">{score}</span> / {total}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
              <Percent className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400">Пайыздық көрсеткіш</div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">
              <span className="text-indigo-400">{percentage}%</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-400">Жұмсалған уақыт</div>
            <div className="text-base font-bold text-white font-mono mt-1">
              {timeSpentFormatted}
            </div>
          </div>
        </div>

        {/* Info list */}
        <div className="space-y-2 mb-8 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Тапсырылған күні:
            </span>
            <span className="text-slate-300 font-mono">{dateFormatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Сұрақтар саны:
            </span>
            <span className="text-slate-300">25 тест тапсырмасы</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Сақталу мерзімі:</span>
            <span className="text-slate-300">Осы құрылғыда 1 ай сақталады</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onOpenReview}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Жауаптарымды қарап шығу</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Шығу</span>
          </button>
        </div>
      </div>
    </div>
  );
}
