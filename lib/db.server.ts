import fs from 'fs';
import path from 'path';
import os from 'os';
import { SubmissionRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'submissions.json');
const TMP_FILE = path.join(os.tmpdir(), 'biology_submissions.json');
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// In-memory cache
let memoryCache: SubmissionRecord[] = [];

// Upstash / Vercel KV credentials
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Firebase Database URL (optional zero-config cloud DB)
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL;

function getDbFilePath(): string {
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
    } catch {
      // In-memory fallback
    }
    return TMP_FILE;
  }
}

/**
 * Fetch all submissions from Cloud DB or local file
 */
export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  const now = Date.now();

  // 1. Try Upstash / Vercel KV if configured
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/hgetall/submissions`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data && data.result) {
        // Upstash hgetall returns key-value pairs
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
      console.error('Error reading from Upstash KV:', err);
    }
  }

  // 2. Try Firebase Realtime Database if configured
  if (FIREBASE_URL) {
    try {
      const cleanUrl = FIREBASE_URL.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/submissions.json`, { cache: 'no-store' });
      const data = await res.json();
      if (data && typeof data === 'object') {
        const list: SubmissionRecord[] = Object.values(data);
        const valid = list.filter((item) => now - (item.createdAt || item.submittedAt) < ONE_MONTH_MS);
        return valid.sort((a, b) => b.submittedAt - a.submittedAt);
      }
    } catch (err) {
      console.error('Error reading from Firebase:', err);
    }
  }

  // 3. Fallback to local server filesystem
  const file = getDbFilePath();
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
    console.error('Error reading local submissions DB:', err);
    return memoryCache;
  }
}

/**
 * Save a submission to Cloud DB or local file
 */
export async function saveSubmission(record: SubmissionRecord): Promise<void> {
  // 1. Try Upstash / Vercel KV
  if (KV_URL && KV_TOKEN) {
    try {
      const payload = JSON.stringify(record);
      await fetch(`${KV_URL}/hset/submissions/${encodeURIComponent(record.id)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]),
      });
      return;
    } catch (err) {
      console.error('Error saving to Upstash KV:', err);
    }
  }

  // 2. Try Firebase Realtime Database
  if (FIREBASE_URL) {
    try {
      const cleanUrl = FIREBASE_URL.replace(/\/$/, '');
      await fetch(`${cleanUrl}/submissions/${encodeURIComponent(record.id)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return;
    } catch (err) {
      console.error('Error saving to Firebase:', err);
    }
  }

  // 3. Fallback to local server filesystem
  const file = getDbFilePath();
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
    console.error('Error saving submission locally:', err);
  }
}

/**
 * Delete a single submission
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  if (KV_URL && KV_TOKEN) {
    try {
      await fetch(`${KV_URL}/hdel/submissions/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      return true;
    } catch (err) {
      console.error('Error deleting from Upstash KV:', err);
    }
  }

  if (FIREBASE_URL) {
    try {
      const cleanUrl = FIREBASE_URL.replace(/\/$/, '');
      await fetch(`${cleanUrl}/submissions/${encodeURIComponent(id)}.json`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error('Error deleting from Firebase:', err);
    }
  }

  const file = getDbFilePath();
  try {
    const existing = await getAllSubmissions();
    const filtered = existing.filter((item) => item.id !== id);
    memoryCache = filtered;
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error deleting submission locally:', err);
    return false;
  }
}

/**
 * Reset all submissions
 */
export async function resetAllSubmissions(): Promise<boolean> {
  if (KV_URL && KV_TOKEN) {
    try {
      await fetch(`${KV_URL}/del/submissions`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      return true;
    } catch (err) {
      console.error('Error resetting Upstash KV:', err);
    }
  }

  if (FIREBASE_URL) {
    try {
      const cleanUrl = FIREBASE_URL.replace(/\/$/, '');
      await fetch(`${cleanUrl}/submissions.json`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error('Error resetting Firebase:', err);
    }
  }

  const file = getDbFilePath();
  try {
    memoryCache = [];
    fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
