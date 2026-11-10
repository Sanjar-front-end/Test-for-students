import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const envKeys = Object.keys(process.env).filter((k) =>
    k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('UPSTASH') || k.includes('VERCEL')
  );

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  let dbStatus = 'NOT_CONNECTED';
  let dbError: string | null = null;
  let count = 0;

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const res = await sql`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'student_submissions'
      `;
      const tableExists = Number(res[0]?.count) > 0;

      if (tableExists) {
        const rows = await sql`SELECT COUNT(*) as count FROM student_submissions`;
        count = Number(rows[0]?.count || 0);
        dbStatus = 'CONNECTED_TABLE_EXISTS';
      } else {
        dbStatus = 'CONNECTED_TABLE_NOT_CREATED_YET';
      }
    } catch (err: any) {
      dbStatus = 'ERROR_CONNECTING';
      dbError = err.message || String(err);
    }
  }

  return NextResponse.json({
    status: 'ok',
    environment: process.env.VERCEL_ENV || 'unknown',
    projectName: process.env.VERCEL_PROJECT_NAME || 'unknown',
    database: {
      type: dbUrl ? 'Neon / Postgres' : 'None (DATABASE_URL missing in this deployment)',
      status: dbStatus,
      submissionsCount: count,
      error: dbError,
    },
    detectedEnvKeys: envKeys,
    isVercel: !!process.env.VERCEL,
    tip: !dbUrl
      ? 'DATABASE_URL is not attached to this deployment. Connect your Neon DB to this project in Vercel Storage tab and click Redeploy.'
      : 'Database connected successfully!',
  });
}
