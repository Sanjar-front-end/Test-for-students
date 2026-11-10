'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SubmissionRecord } from '@/lib/types';
import {
  Users,
  Award,
  Clock,
  Percent,
  Search,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface AdminViewProps {
  onLogout: () => void;
}

export function AdminView({ onLogout }: AdminViewProps) {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSubmissions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: {
          'x-admin-name': 'ADMIN',
          'x-admin-password': 'PASSWORD',
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch admin submissions:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // Auto-update table every 5 seconds so new student submissions appear live
    const interval = setInterval(() => {
      fetchSubmissions(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`«${name}» оқушысының нәтижесін өшіруді растайсыз ба?`)) return;

    try {
      const res = await fetch(`/api/admin?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-name': 'ADMIN',
          'x-admin-password': 'PASSWORD',
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) => prev.filter((item) => item.id !== id));
        showNotice(`«${name}» жазбасы өшірілді`);
      }
    } catch (err) {
      alert('Өшіру кезінде қате кетті');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('ЕСКЕРТУ: Барлық оқушылардың деректерін өшіруді растайсыз ба? Бұл әрекетті қайтару мүмкін емес!')) {
      return;
    }
    try {
      const res = await fetch('/api/admin?action=clear-all', {
        method: 'DELETE',
        headers: {
          'x-admin-name': 'ADMIN',
          'x-admin-password': 'PASSWORD',
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions([]);
        showNotice('Барлық жазбалар тазартылды');
      }
    } catch (err) {
      alert('Тазарту кезінде қате кетті');
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('Экспорттайтын деректер жоқ');
      return;
    }

    const headers = ['№', 'Аты', 'Тегі', 'Дұрыс жауап саны', 'Жалпы сұрақ', 'Нәтиже (%)', 'Жұмсалған уақыт', 'Тапсырған күні'];
    const rows = submissions.map((s, idx) => [
      idx + 1,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      s.score,
      s.total,
      `${s.percentage}%`,
      `"${s.timeSpentFormatted}"`,
      `"${new Date(s.submittedAt).toLocaleString('kk-KZ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `биология_нәтижелері_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter & Sort
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((s) => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const matchesQuery = fullName.includes(searchQuery.toLowerCase().trim());

        let matchesScore = true;
        if (filterScore === 'high') matchesScore = s.percentage >= 80;
        else if (filterScore === 'medium') matchesScore = s.percentage >= 50 && s.percentage < 80;
        else if (filterScore === 'low') matchesScore = s.percentage < 50;

        return matchesQuery && matchesScore;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') diff = a.submittedAt - b.submittedAt;
        else if (sortBy === 'score') diff = a.percentage - b.percentage;
        else if (sortBy === 'name') diff = a.lastName.localeCompare(b.lastName);
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [submissions, searchQuery, filterScore, sortBy, sortOrder]);

  // Metrics
  const totalCount = submissions.length;
  const avgPercentage =
    totalCount > 0
      ? Math.round((submissions.reduce((acc, curr) => acc + curr.percentage, 0) / totalCount) * 10) / 10
      : 0;
  const highScorersCount = submissions.filter((s) => s.percentage >= 80).length;
  const maxScore = totalCount > 0 ? Math.max(...submissions.map((s) => s.percentage)) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-sm font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Әкімшілік панелі (ADMIN)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Тікелей эфир
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Оқушылар нәтижелерінің кестесі
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Өсімдіктер мен жануарлардағы гаметогенез және спорогенез
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => fetchSubmissions(false)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            title="Жаңарту"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>CSV экспорт</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Шығу</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Жалпы оқушылар</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Орташа балл</div>
            <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">{avgPercentage}%</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ең жоғарғы балл</div>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">{maxScore}%</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Үздіктер (≥ 80%)</div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">{highScorersCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Оқушы аты немесе тегі бойынша іздеу..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value as any)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Барлық ұпайлар</option>
              <option value="high" className="bg-slate-900 text-white">Үздік (≥ 80%)</option>
              <option value="medium" className="bg-slate-900 text-white">Орташа (50-79%)</option>
              <option value="low" className="bg-slate-900 text-white">Төмен (&lt; 50%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="date" className="bg-slate-900 text-white">Уақыты бойынша</option>
              <option value="score" className="bg-slate-900 text-white">Балл бойынша</option>
              <option value="name" className="bg-slate-900 text-white">Аты-жөні бойынша</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="font-mono text-indigo-400 ml-1 font-bold"
              title="Реттеу бағытын өзгерту"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {totalCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Барлығын тазарту</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">
              <tr>
                <th className="py-4 px-4 sm:px-6 w-14">#</th>
                <th className="py-4 px-4 sm:px-6">Оқушының аты-жөні</th>
                <th className="py-4 px-4 sm:px-6">Дұрыс жауап саны</th>
                <th className="py-4 px-4 sm:px-6">Нәтижесі (%)</th>
                <th className="py-4 px-4 sm:px-6">Жұмсалған уақыт</th>
                <th className="py-4 px-4 sm:px-6">Тапсырған күні</th>
                <th className="py-4 px-4 sm:px-6 text-right">Әрекет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {searchQuery || filterScore !== 'all' ? (
                      <div className="space-y-1">
                        <p className="text-base text-slate-300 font-medium">
                          Іздеу шарттары бойынша оқушы табылмады
                        </p>
                        <p className="text-xs text-slate-500">
                          Сүзгілерді тазартып қайта көріңіз
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        <p className="text-base text-slate-300 font-medium">
                          Әзірге тест тапсырған оқушылар жоқ
                        </p>
                        <p className="text-xs text-slate-500">
                          Оқушылар тестті тапсырған соң осы кестеде автоматты түрде пайда болады.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((record, index) => {
                  let pillClass = 'bg-rose-950/60 border-rose-500/40 text-rose-300';
                  if (record.percentage >= 80) {
                    pillClass = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
                  } else if (record.percentage >= 50) {
                    pillClass = 'bg-amber-950/60 border-amber-500/40 text-amber-300';
                  }

                  const dateFormatted = new Date(record.submittedAt).toLocaleString('kk-KZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6 font-mono text-slate-500 text-xs">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-white text-base">
                          {record.firstName} {record.lastName}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-mono">
                        <span className="font-bold text-white text-base">{record.score}</span>
                        <span className="text-slate-400"> / {record.total}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl border text-xs font-bold font-mono ${pillClass}`}
                          >
                            {record.percentage}%
                          </span>
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                              style={{ width: `${record.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-mono text-slate-300 text-xs">
                        {record.timeSpentFormatted}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-400 font-mono">
                        {dateFormatted}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRecord(record.id, `${record.firstName} ${record.lastName}`)
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Жазбаны өшіру"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
