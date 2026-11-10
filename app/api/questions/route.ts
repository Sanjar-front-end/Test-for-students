import { NextRequest, NextResponse } from 'next/server';
import { QUESTIONS_DATA } from '@/data/questions.server';
import { QuestionClient } from '@/lib/types';

// Deterministic pseudo-random generator from seed string
function createSeededRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded RNG
function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  const rand = createSeededRandom(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get('firstName')?.trim().toLowerCase() || '';
  const lastName = searchParams.get('lastName')?.trim().toLowerCase() || '';
  const orderParam = searchParams.get('order');

  // Strip correct answers completely so students cannot inspect network payload
  const publicQuestions: QuestionClient[] = QUESTIONS_DATA.map((q) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    question: q.question,
    options: q.options,
  }));

  let orderedQuestions: QuestionClient[] = [];

  if (orderParam) {
    // If client specified an order from existing session
    const ids = orderParam
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n));
    const questionMap = new Map(publicQuestions.map((q) => [q.id, q]));
    orderedQuestions = ids
      .map((id) => questionMap.get(id))
      .filter(Boolean) as QuestionClient[];

    // Fallback if missing
    if (orderedQuestions.length !== publicQuestions.length) {
      orderedQuestions = publicQuestions;
    }
  } else if (firstName || lastName) {
    // Unique deterministic ordering per student
    const seed = `${firstName}_${lastName}_biology_2026`;
    orderedQuestions = shuffleWithSeed(publicQuestions, seed);
  } else {
    orderedQuestions = publicQuestions;
  }

  return NextResponse.json({
    success: true,
    total: orderedQuestions.length,
    questions: orderedQuestions,
    order: orderedQuestions.map((q) => q.id),
  });
}
