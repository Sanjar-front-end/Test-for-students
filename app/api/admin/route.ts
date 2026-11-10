import { NextRequest, NextResponse } from 'next/server';
import { getAllSubmissions, deleteSubmission, resetAllSubmissions, getDatabaseType } from '@/lib/db.server';

function checkAdminAuth(request: NextRequest): boolean {
  const adminName = request.headers.get('x-admin-name')?.trim().toUpperCase();
  const adminPass = request.headers.get('x-admin-password')?.trim().toUpperCase();
  return adminName === 'ADMIN' && adminPass === 'PASSWORD';
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Рұқсат берілмеді. Тек әкімші үшін.' },
      { status: 401 }
    );
  }

  const submissions = await getAllSubmissions();

  const total = submissions.length;
  let avgPercentage = 0;
  let highestPercentage = 0;
  let lowestPercentage = total > 0 ? 100 : 0;

  if (total > 0) {
    const sum = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
    avgPercentage = Math.round((sum / total) * 10) / 10;
    highestPercentage = Math.max(...submissions.map((s) => s.percentage));
    lowestPercentage = Math.min(...submissions.map((s) => s.percentage));
  }

  return NextResponse.json({
    success: true,
    databaseType: getDatabaseType(),
    submissions,
    stats: {
      total,
      avgPercentage,
      highestPercentage,
      lowestPercentage,
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Рұқсат берілмеді.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (action === 'clear-all') {
    await resetAllSubmissions();
    return NextResponse.json({ success: true, message: 'Барлық нәтижелер тазартылды' });
  }

  if (id) {
    await deleteSubmission(id);
    return NextResponse.json({ success: true, message: 'Оқушы жазбасы өшірілді' });
  }

  return NextResponse.json({ success: false, error: 'Параметр көрсетілмеді' }, { status: 400 });
}
