'use client';

import React, { useState, useEffect } from 'react';
import { getDeviceLock } from '@/lib/storage';
import { DeviceRegistration } from '@/lib/types';
import {
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Sparkles,
  Lock,
  ArrowRight,
  BookOpen,
  Timer,
  CheckCircle2,
} from 'lucide-react';

interface LoginViewProps {
  onLoginStudent: (firstName: string, lastName: string) => void;
  onLoginAdmin: () => void;
}

export function LoginView({ onLoginStudent, onLoginAdmin }: LoginViewProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deviceLock, setDeviceLockState] = useState<DeviceRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const lock = getDeviceLock();
    if (lock) {
      setDeviceLockState(lock);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fName = firstName.trim();
    const lName = lastName.trim();

    if (!fName || !lName) {
      setError('Аты мен тегін толық енгізіңіз (екі өріс те міндетті)');
      return;
    }

    // Check Admin login: "ADMIN" - name, "PASSWORD" - surname
    if (fName.toUpperCase() === 'ADMIN' && lName.toUpperCase() === 'PASSWORD') {
      setIsLoading(true);
      setTimeout(() => {
        onLoginAdmin();
      }, 300);
      return;
    }

    // Check device lock
    if (deviceLock) {
      const isSameStudent =
        deviceLock.firstName.trim().toLowerCase() === fName.toLowerCase() &&
        deviceLock.lastName.trim().toLowerCase() === lName.toLowerCase();

      if (!isSameStudent) {
        setError(
          `⚠️ Рұқсат жоқ! Бұл құрылғы «${deviceLock.firstName} ${deviceLock.lastName}» оқушысы үшін бекітілген. Басқа оқушы атымен кіруге болмайды.`
        );
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      onLoginStudent(fName, lName);
    }, 300);
  };

  const autofillRegisteredStudent = () => {
    if (deviceLock) {
      setFirstName(deviceLock.firstName);
      setLastName(deviceLock.lastName);
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4 glow-primary">
          <GraduationCap className="w-9 h-9 text-indigo-400" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 mb-2">
          Ресми тестілеу платформасы
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Биология пәнінен тест
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md mx-auto">
          Тақырыбы: <span className="text-indigo-300 font-medium">Өсімдіктер мен жануарлардағы гаметогенез және спорогенез</span>
        </p>
      </div>

      {/* Main Login Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

        {/* Device Lock Banner if active */}
        {deviceLock && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Құрылғы тіркелген</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Бұл құрылғы оқушы <strong className="text-white underline decoration-amber-400">{deviceLock.firstName} {deviceLock.lastName}</strong> үшін 1 ай мерзімге бекітілген.
            </p>
            <button
              type="button"
              onClick={autofillRegisteredStudent}
              className="self-start text-xs text-amber-300 hover:text-amber-100 font-semibold underline underline-offset-4 cursor-pointer mt-1"
            >
              Осы аты-жөнді автоматты енгізу →
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-sm flex items-start gap-3 animate-shake">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Атыңыз (First Name) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Мысалы: Айдос"
              autoComplete="given-name"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Тегіңіз (Surname) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Мысалы: Нұрланұлы"
              autoComplete="family-name"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium text-base"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Тексерілуде...
              </span>
            ) : (
              <>
                <span>Тестті бастау / Жүйеге кіру</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Quick Exam Overview Specs */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <BookOpen className="w-4 h-4 mx-auto text-indigo-400 mb-1" />
            <div className="text-xs text-slate-400">Сұрақтар</div>
            <div className="text-sm font-bold text-slate-200">25 сұрақ</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Timer className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <div className="text-xs text-slate-400">Уақыт лимиті</div>
            <div className="text-sm font-bold text-slate-200">10 минут</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Lock className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <div className="text-xs text-slate-400">Құрылғы</div>
            <div className="text-sm font-bold text-slate-200">1 оқушы</div>
          </div>
        </div>

        {/* Rules note */}
        <div className="mt-6 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[12px] text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Ережелер:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400">
            <li>Тест басталған сәттен 10 минут кері санақ тоқтамайды (бетті жапсаңыз да).</li>
            <li>10 минут біткенде жауаптар автоматты түрде қабылданып, нәтиже шығады.</li>
            <li>Сұрақтардың реті әр оқушы үшін әртүрлі болып араластырылады.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
