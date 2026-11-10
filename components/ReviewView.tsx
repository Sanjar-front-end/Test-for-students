'use client';

import React from 'react';
import { QuestionClient } from '@/lib/types';
import { ArrowLeft, User, Check, AlertCircle } from 'lucide-react';

interface ReviewViewProps {
  firstName: string;
  lastName: string;
  questions: QuestionClient[];
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  score?: number;
  total?: number;
  percentage?: number;
  onBack: () => void;
}

export function ReviewView({
  firstName,
  lastName,
  questions,
  answers,
  score,
  total = 25,
  percentage,
  onBack,
}: ReviewViewProps) {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-3 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
            title="Нәтижеге оралу"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              Жауаптарды қарап шығу
            </h1>
            <div className="text-xs text-slate-400">
              Оқушы: <span className="font-semibold text-slate-200">{firstName} {lastName}</span>
            </div>
          </div>
        </div>

        {percentage !== undefined && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-bold font-mono">
              Нәтиже: {percentage}% ({score} / {total})
            </div>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all"
            >
              Оралу
            </button>
          </div>
        )}
      </div>

      {/* Intro info banner */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-center justify-between">
        <span>
          Бұл бөлімде сіз белгілеген <strong>{answeredCount}</strong> жауап көрсетілген.
        </span>
        <span className="text-slate-400 hidden sm:inline">25 сұрақтан тұрады</span>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const studentAnswer = answers[q.id];
          const hasAnswered = !!studentAnswer;

          return (
            <div
              key={q.id}
              className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800/90 shadow-md"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                <span className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
                  Сұрақ #{idx + 1}
                </span>

                {hasAnswered ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    Таңдалған нұсқа: {studentAnswer}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Жауап берілмеген
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-white mb-5 leading-relaxed">
                {q.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((option) => {
                  const isStudentChoice = studentAnswer === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 transition-colors ${
                        isStudentChoice
                          ? 'bg-indigo-950/60 border-indigo-500/80 text-white font-medium ring-1 ring-indigo-500/30'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 font-mono ${
                          isStudentChoice
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {option.id}
                      </div>

                      <span className="text-sm sm:text-base flex-1">
                        {option.text}
                      </span>

                      {isStudentChoice && (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold shrink-0">
                          Сіздің жауабыңыз
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Back Button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 cursor-pointer transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Нәтижеге оралу</span>
        </button>
      </div>
    </div>
  );
}
