import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS_DATA } from '@/data/questions.server';
import { saveSubmission } from '@/lib/db.server';
import { SubmissionRecord } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, startTime, answers } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Аты мен тегі толтырылуы міндетті' },
        { status: 400 }
      );
    }

    const totalQuestions = QUESTIONS_DATA.length;
    let correctCount = 0;

    QUESTIONS_DATA.forEach((q) => {
      const studentAnswer = answers?.[q.id];
      if (studentAnswer && studentAnswer.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const now = Date.now();
    let timeSpentSeconds = 600;
    if (startTime && typeof startTime === 'number') {
      const elapsed = Math.floor((now - startTime) / 1000);
      timeSpentSeconds = Math.min(600, Math.max(0, elapsed));
    }

    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    const timeSpentFormatted = `${minutes} мин ${seconds < 10 ? '0' : ''}${seconds} сек`;

    const record: SubmissionRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      score: correctCount,
      total: totalQuestions,
      percentage,
      timeSpentSeconds,
      timeSpentFormatted,
      submittedAt: now,
      createdAt: now,
      answers: answers || {},
    };

    await saveSubmission(record);

    return NextResponse.json({
      success: true,
      score: correctCount,
      total: totalQuestions,
      percentage,
      timeSpentSeconds,
      timeSpentFormatted,
      submittedAt: now,
    });
  } catch (err: any) {
    console.error('Error handling submission:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Серверлік қате' },
      { status: 500 }
    );
  }
}
