'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QuestionClient,
  StudentSession,
  SubmissionRecord,
} from '@/lib/types';
import {
  getDeviceLock,
  setDeviceLock,
  getStudentSession,
  saveStudentSession,
  getRemainingSeconds,
} from '@/lib/storage';
import { LoginView } from '@/components/LoginView';
import { QuizView } from '@/components/QuizView';
import { ResultsView } from '@/components/ResultsView';
import { ReviewView } from '@/components/ReviewView';
import { AdminView } from '@/components/AdminView';

export default function Home() {
  const [currentView, setCurrentView] = useState<'login' | 'quiz' | 'results' | 'review' | 'admin'>('login');
  const [student, setStudent] = useState<{ firstName: string; lastName: string } | null>(null);
  const [questions, setQuestions] = useState<QuestionClient[]>([]);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    timeSpentFormatted: string;
    submittedAt?: number;
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial restoration from localStorage
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedSession = getStudentSession();
        if (savedSession) {
          setStudent({ firstName: savedSession.firstName, lastName: savedSession.lastName });
          setAnswers(savedSession.answers || {});
          setStartTime(savedSession.startTime);

          // Fetch questions with saved order
          const orderQuery = savedSession.questionIdsOrder?.length
            ? `&order=${savedSession.questionIdsOrder.join(',')}`
            : '';
          const res = await fetch(
            `/api/questions?firstName=${encodeURIComponent(savedSession.firstName)}&lastName=${encodeURIComponent(savedSession.lastName)}${orderQuery}`
          );
          const data = await res.json();
          if (data.success && data.questions) {
            setQuestions(data.questions);
          }

          if (savedSession.isSubmitted) {
            setSubmissionResult({
              score: savedSession.score || 0,
              total: savedSession.total || 25,
              percentage: savedSession.percentage || 0,
              timeSpentFormatted: savedSession.timeSpentFormatted || '',
              submittedAt: savedSession.submittedAt,
            });
            setCurrentView('results');
          } else {
            // Check remaining time
            const rem = getRemainingSeconds(savedSession.startTime, 600);
            if (rem <= 0) {
              // Time expired while away! Auto-submit
              setRemainingSeconds(0);
              await handleSubmitAnswers(
                savedSession.firstName,
                savedSession.lastName,
                savedSession.startTime,
                savedSession.answers || {},
                data.questions || []
              );
            } else {
              setRemainingSeconds(rem);
              setCurrentView('quiz');
            }
          }
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    restoreSession();
  }, []);

  // 2. Wall-clock countdown timer when in 'quiz' view
  useEffect(() => {
    if (currentView !== 'quiz' || !startTime) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const checkTimer = () => {
      const rem = getRemainingSeconds(startTime, 600);
      setRemainingSeconds(rem);

      if (rem <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (student) {
          handleSubmitAnswers(student.firstName, student.lastName, startTime, answers, questions);
        }
      }
    };

    checkTimer();
    timerRef.current = setInterval(checkTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView, startTime, student, answers, questions]);

  // 3. Handle Answer Selection
  const handleAnswerChange = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Persist to local session immediately
    if (student && startTime) {
      const currentSession = getStudentSession();
      if (currentSession) {
        currentSession.answers = newAnswers;
        saveStudentSession(currentSession);
      }
    }
  };

  // 4. Submit answers to server
  const handleSubmitAnswers = async (
    fName: string,
    lName: string,
    start: number,
    ans: Record<number, 'A' | 'B' | 'C' | 'D'>,
    quizList: QuestionClient[]
  ) => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fName,
          lastName: lName,
          startTime: start,
          answers: ans,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const result = {
          score: data.score,
          total: data.total,
          percentage: data.percentage,
          timeSpentFormatted: data.timeSpentFormatted,
          submittedAt: data.submittedAt,
        };

        setSubmissionResult(result);

        // Update local session to submitted
        const sessionToSave: StudentSession = {
          firstName: fName,
          lastName: lName,
          startTime: start,
          durationSeconds: 600,
          questionIdsOrder: quizList.map((q) => q.id),
          answers: ans,
          isSubmitted: true,
          submittedAt: data.submittedAt,
          score: data.score,
          total: data.total,
          percentage: data.percentage,
          timeSpentSeconds: data.timeSpentSeconds,
          timeSpentFormatted: data.timeSpentFormatted,
          createdAt: Date.now(),
        };
        saveStudentSession(sessionToSave);

        setCurrentView('results');
      }
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  // 5. Start new student test
  const handleStartStudent = async (fName: string, lName: string) => {
    setDeviceLock(fName, lName);
    setStudent({ firstName: fName, lastName: lName });

    // Check if session already exists
    const existingSession = getStudentSession();
    if (
      existingSession &&
      existingSession.firstName.toLowerCase() === fName.toLowerCase() &&
      existingSession.lastName.toLowerCase() === lName.toLowerCase()
    ) {
      if (existingSession.isSubmitted) {
        setSubmissionResult({
          score: existingSession.score || 0,
          total: existingSession.total || 25,
          percentage: existingSession.percentage || 0,
          timeSpentFormatted: existingSession.timeSpentFormatted || '',
          submittedAt: existingSession.submittedAt,
        });
        setCurrentView('results');
        return;
      }

      const rem = getRemainingSeconds(existingSession.startTime, 600);
      if (rem <= 0) {
        // Auto submit
        await handleSubmitAnswers(
          fName,
          lName,
          existingSession.startTime,
          existingSession.answers || {},
          questions
        );
        return;
      }

      setStartTime(existingSession.startTime);
      setRemainingSeconds(rem);
      setAnswers(existingSession.answers || {});

      // Fetch questions using existing order
      const orderQuery = existingSession.questionIdsOrder?.length
        ? `&order=${existingSession.questionIdsOrder.join(',')}`
        : '';
      const res = await fetch(
        `/api/questions?firstName=${encodeURIComponent(fName)}&lastName=${encodeURIComponent(lName)}${orderQuery}`
      );
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
      }
      setCurrentView('quiz');
      return;
    }

    // New Session
    const now = Date.now();
    setStartTime(now);
    setRemainingSeconds(600);
    setAnswers({});

    // Fetch randomized questions for this student
    const res = await fetch(
      `/api/questions?firstName=${encodeURIComponent(fName)}&lastName=${encodeURIComponent(lName)}`
    );
    const data = await res.json();

    if (data.success && data.questions) {
      setQuestions(data.questions);

      const newSession: StudentSession = {
        firstName: fName,
        lastName: lName,
        startTime: now,
        durationSeconds: 600,
        questionIdsOrder: data.order,
        answers: {},
        isSubmitted: false,
        createdAt: now,
      };
      saveStudentSession(newSession);

      setCurrentView('quiz');
    }
  };

  const handleLogout = () => {
    // If student logged out, they return to login screen
    setCurrentView('login');
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-300 font-medium">Жүйе жүктелуде...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between">
      <div className="flex-1 py-4 sm:py-8">
        {currentView === 'login' && (
          <LoginView
            onLoginStudent={handleStartStudent}
            onLoginAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'quiz' && student && (
          <QuizView
            firstName={student.firstName}
            lastName={student.lastName}
            questions={questions}
            initialAnswers={answers}
            remainingSeconds={remainingSeconds}
            totalDuration={600}
            onAnswerChange={handleAnswerChange}
            onSubmitQuiz={() =>
              handleSubmitAnswers(student.firstName, student.lastName, startTime, answers, questions)
            }
            onTimeExpired={() =>
              handleSubmitAnswers(student.firstName, student.lastName, startTime, answers, questions)
            }
          />
        )}

        {currentView === 'results' && student && submissionResult && (
          <ResultsView
            firstName={student.firstName}
            lastName={student.lastName}
            score={submissionResult.score}
            total={submissionResult.total}
            percentage={submissionResult.percentage}
            timeSpentFormatted={submissionResult.timeSpentFormatted}
            submittedAt={submissionResult.submittedAt}
            onOpenReview={() => setCurrentView('review')}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'review' && student && (
          <ReviewView
            firstName={student.firstName}
            lastName={student.lastName}
            questions={questions}
            answers={answers}
            score={submissionResult?.score}
            total={submissionResult?.total || 25}
            percentage={submissionResult?.percentage}
            onBack={() => setCurrentView('results')}
          />
        )}

        {currentView === 'admin' && (
          <AdminView onLogout={() => setCurrentView('login')} />
        )}
      </div>

      {/* Global Minimal Footer */}
      <footer className="py-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Биология пәнінен онлайн емтихан жүйесі • Гаметогенез және спорогенез</span>
          <span>© 2026 Барлық құқықтар қорғалған</span>
        </div>
      </footer>
    </main>
  );
}
