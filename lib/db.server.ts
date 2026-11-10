import fs from 'fs';
import path from 'path';
import os from 'os';
import { neon } from '@neondatabase/serverless';
import { SubmissionRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'submissions.json');
const TMP_FILE = path.join(os.tmpdir(), 'biology_submissions.json');
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// In-memory cache
let memoryCache: SubmissionRecord[] = [];
let neonTableInitialized = false;

// 1. Neon / Postgres connection string (Auto-provided by Vercel when selecting Neon or Postgres)
const POSTGRES_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

// 2. Upstash Redis connection (Auto-provided by Vercel when selecting Upstash)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function getNeonSql() {
  if (!POSTGRES_URL) return null;
  try {
    return neon(POSTGRES_URL);
  } catch (err) {
    console.error('Failed to initialize Neon client:', err);
    return null;
  }
}

async function ensureNeonTable(sql: any) {
  if (neonTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS student_submissions (
        id VARCHAR(100) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        time_spent_seconds INTEGER NOT NULL,
        time_spent_formatted VARCHAR(100) NOT NULL,
        submitted_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL,
        answers JSONB DEFAULT '{}'::jsonb
      )
    `;
    neonTableInitialized = true;
  } catch (err) {
    console.error('Error creating Neon table:', err);
  }
}

function getLocalDbFilePath(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    return DB_FILE;
  } catch {
    try {
      if (!fs.existsSync(TMP_FILE)) {
        fs.writeFileSync(TMP_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch {}
    return TMP_FILE;
  }
}

/**
 * Fetch all submissions (Neon -> Upstash -> Local File)
 */
export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  const now = Date.now();

  // --- OPTION A: Neon / Postgres (Vercel Database) ---
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      const rows = await sql`
        SELECT * FROM student_submissions 
        ORDER BY submitted_at DESC
      `;
      const records: SubmissionRecord[] = rows
        .map((r: any) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          score: Number(r.score),
          total: Number(r.total),
          percentage: Number(r.percentage),
          timeSpentSeconds: Number(r.time_spent_seconds),
          timeSpentFormatted: r.time_spent_formatted,
          submittedAt: Number(r.submitted_at),
          createdAt: Number(r.created_at),
          answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || {},
        }))
        .filter((r) => now - (r.createdAt || r.submittedAt) < ONE_MONTH_MS);

      memoryCache = records;
      return records;
    } catch (err) {
      console.error('Error fetching from Neon database:', err);
    }
  }

  // --- OPTION B: Upstash Redis (Vercel Database) ---
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/hgetall/submissions`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data && data.result) {
        const list: SubmissionRecord[] = [];
        const result = data.result;
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i += 2) {
            try {
              list.push(JSON.parse(result[i + 1]));
            } catch {}
          }
        } else if (typeof result === 'object') {
          for (const key of Object.keys(result)) {
            try {
              list.push(JSON.parse(result[key]));
            } catch {}
          }
        }
        const valid = list.filter((item) => now - (item.createdAt || item.submittedAt) < ONE_MONTH_MS);
        return valid.sort((a, b) => b.submittedAt - a.submittedAt);
      }
    } catch (err) {
      console.error('Error fetching from Upstash:', err);
    }
  }

  // --- OPTION C: Local Filesystem Fallback ---
  const file = getLocalDbFilePath();
  try {
    let items: SubmissionRecord[] = [];
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      items = JSON.parse(raw);
    } else if (memoryCache.length > 0) {
      items = memoryCache;
    }

    const validItems = items.filter(
      (item) => now - (item.createdAt || item.submittedAt) < ONE_MONTH_MS
    );
    memoryCache = validItems;
    return validItems.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (err) {
    console.error('Error reading local fallback DB:', err);
    return memoryCache;
  }
}

/**
 * Save a submission (Neon -> Upstash -> Local File)
 */
export async function saveSubmission(record: SubmissionRecord): Promise<void> {
  // --- OPTION A: Neon / Postgres (Vercel Database) ---
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      const normalizedFirst = record.firstName.trim();
      const normalizedLast = record.lastName.trim();

      // Check if student already has a record to update their attempt
      const existing = await sql`
        SELECT id FROM student_submissions 
        WHERE LOWER(TRIM(first_name)) = LOWER(${normalizedFirst}) 
          AND LOWER(TRIM(last_name)) = LOWER(${normalizedLast})
        LIMIT 1
      `;

      const targetId = existing.length > 0 ? existing[0].id : record.id;
      const answersJson = JSON.stringify(record.answers || {});

      await sql`
        INSERT INTO student_submissions (
          id, first_name, last_name, score, total, percentage, 
          time_spent_seconds, time_spent_formatted, submitted_at, created_at, answers
        ) VALUES (
          ${targetId}, ${record.firstName}, ${record.lastName}, ${record.score}, ${record.total}, 
          ${record.percentage}, ${record.timeSpentSeconds}, ${record.timeSpentFormatted}, 
          ${record.submittedAt}, ${record.createdAt}, ${answersJson}::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          score = EXCLUDED.score,
          total = EXCLUDED.total,
          percentage = EXCLUDED.percentage,
          time_spent_seconds = EXCLUDED.time_spent_seconds,
          time_spent_formatted = EXCLUDED.time_spent_formatted,
          submitted_at = EXCLUDED.submitted_at,
          answers = EXCLUDED.answers
      `;
      return;
    } catch (err) {
      console.error('Error saving to Neon database:', err);
    }
  }

  // --- OPTION B: Upstash Redis (Vercel Database) ---
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const payload = JSON.stringify(record);
      await fetch(`${UPSTASH_URL}/hset/submissions/${encodeURIComponent(record.id)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]),
      });
      return;
    } catch (err) {
      console.error('Error saving to Upstash:', err);
    }
  }

  // --- OPTION C: Local Filesystem Fallback ---
  const file = getLocalDbFilePath();
  try {
    const existing = await getAllSubmissions();
    const normalizedName = `${record.firstName.trim().toLowerCase()} ${record.lastName.trim().toLowerCase()}`;
    const idx = existing.findIndex(
      (item) =>
        `${item.firstName.trim().toLowerCase()} ${item.lastName.trim().toLowerCase()}` ===
        normalizedName
    );

    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.push(record);
    }

    memoryCache = existing;

    try {
      fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf-8');
    } catch {
      if (file !== TMP_FILE) {
        fs.writeFileSync(TMP_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.error('Error saving locally:', err);
  }
}

/**
 * Delete a submission (Neon -> Upstash -> Local File)
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      await sql`DELETE FROM student_submissions WHERE id = ${id}`;
      return true;
    } catch (err) {
      console.error('Error deleting from Neon:', err);
    }
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/hdel/submissions/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      return true;
    } catch (err) {
      console.error('Error deleting from Upstash:', err);
    }
  }

  const file = getLocalDbFilePath();
  try {
    const existing = await getAllSubmissions();
    const filtered = existing.filter((item) => item.id !== id);
    memoryCache = filtered;
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Reset all submissions (Neon -> Upstash -> Local File)
 */
export async function resetAllSubmissions(): Promise<boolean> {
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureNeonTable(sql);
      await sql`TRUNCATE TABLE student_submissions`;
      return true;
    } catch (err) {
      console.error('Error resetting Neon table:', err);
    }
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/del/submissions`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      return true;
    } catch (err) {
      console.error('Error resetting Upstash:', err);
    }
  }

  const file = getLocalDbFilePath();
  try {
    memoryCache = [];
    fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
