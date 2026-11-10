'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QuestionClient } from '@/lib/types';
import { Timer } from './Timer';
import { QuestionPalette } from './QuestionPalette';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  User,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  Menu,
  X,
} from 'lucide-react';

interface QuizViewProps {
  firstName: string;
  lastName: string;
  questions: QuestionClient[];
  initialAnswers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  remainingSeconds: number;
  totalDuration?: number;
  onAnswerChange: (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => void;
  onSubmitQuiz: () => void;
  onTimeExpired: () => void;
}

export function QuizView({
  firstName,
  lastName,
  questions,
  initialAnswers,
  remainingSeconds,
  totalDuration = 600,
  onAnswerChange,
  onSubmitQuiz,
  onTimeExpired,
}: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>(initialAnswers);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial answers when props change
  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  // Current question
  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.id);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optionId: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);
    onAnswerChange(currentQuestion.id, optionId);
  };

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    onSubmitQuiz();
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modal is open
      if (showConfirmModal) return;

      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (currentQuestion) {
        const key = e.key.toUpperCase();
        if (key === 'A' || key === '1') handleSelectOption('A');
        else if (key === 'B' || key === '2') handleSelectOption('B');
        else if (key === 'C' || key === '3') handleSelectOption('C');
        else if (key === 'D' || key === '4') handleSelectOption('D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, showConfirmModal, handlePrev, handleNext]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Сұрақтар жүктелуде...</p>
        </div>
      </div>
    );
  }

  const currentSelectedOption = answers[currentQuestion.id];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Top Application Bar */}
      <header className="glass-panel rounded-2xl p-3 sm:p-4 mb-6 border border-slate-800 flex items-center justify-between gap-4 sticky top-3 z-30 shadow-xl">
        {/* Student Info & Topic */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
              <span>Оқушы:</span>
              <span className="font-semibold text-slate-200 truncate">
                {firstName} {lastName}
              </span>
            </div>
            <div className="text-sm font-bold text-white truncate hidden sm:block">
              Биология: Гаметогенез және спорогенез
            </div>
          </div>
        </div>

        {/* Right side: Timer & Mobile Menu button */}
        <div className="flex items-center gap-3">
          <Timer remainingSeconds={remainingSeconds} totalDuration={totalDuration} />

          {/* Mobile Palette Toggle */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Сұрақтар тізімі"
          >
            {showMobilePalette ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Grid: Question Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Current Question Card */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
            {/* Top Indicator */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-600/40 text-indigo-300 text-xs sm:text-sm font-bold font-mono">
                  Сұрақ {currentIndex + 1} / {totalQuestions}
                </span>
                {currentSelectedOption && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
                    <Check className="w-3 h-3" /> Белгіленді
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Жауап берілді: <span className="text-slate-200 font-bold">{answeredCount}</span> / {totalQuestions}
              </div>
            </div>

            {/* Question Text */}
            <div className="no-select mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed tracking-tight">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3.5 no-select">
              {currentQuestion.options.map((option) => {
                const isSelected = currentSelectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/40 glow-primary text-white font-medium'
                        : 'bg-slate-900/60 border-slate-800/90 text-slate-200 hover:bg-slate-850 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 transition-colors font-mono ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {option.id}
                    </div>
                    <span className="text-sm sm:text-base leading-snug flex-1">
                      {option.text}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Question Actions */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Алдыңғы</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Келесі сұрақ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-600/30 glow-emerald transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Тестті аяқтау</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick finish bar at the bottom */}
          <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-slate-800 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Жауаптарыңыз автоматты түрде сақталуда</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Мерзімінен бұрын аяқтау
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette (Desktop Sticky Sidebar) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24">
          <QuestionPalette
            totalQuestions={totalQuestions}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
          />

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Тестті аяқтау және нәтижені көру</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Question Palette Drawer */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex flex-col justify-end p-4">
          <div className="glass-panel rounded-3xl p-5 border border-slate-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Сұрақтар кестесі</h3>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <QuestionPalette
              totalQuestions={totalQuestions}
              currentIndex={currentIndex}
              answers={answers}
              questionIds={questionIds}
              onSelectIndex={(idx) => {
                setCurrentIndex(idx);
                setShowMobilePalette(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setShowMobilePalette(false);
                setShowConfirmModal(true);
              }}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              Тестті аяқтау
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Тестті аяқтауды растайсыз ба?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Сіз <strong>{totalQuestions}</strong> сұрақтың{' '}
              <strong className="text-indigo-400">{answeredCount}</strong> сұрағына жауап бердіңіз.
              {answeredCount < totalQuestions && (
                <span className="block mt-1 text-amber-400">
                  Ескерту: {totalQuestions - answeredCount} сұрақ белгіленбеген!
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Аяқтаған соң жауаптарыңыз тексеріліп, қорытынды балл көрсетіледі. Қайта тапсыру мүмкін емес.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium cursor-pointer"
              >
                Жалғастыру
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Жіберілуде...' : 'Иә, аяқтау'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
