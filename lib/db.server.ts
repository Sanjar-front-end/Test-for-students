import fs from 'fs';
import path from 'path';
import os from 'os';
import { SubmissionRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'submissions.json');
const TMP_FILE = path.join(os.tmpdir(), 'biology_submissions.json');
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

let memoryCache: SubmissionRecord[] = [];

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
    // Fallback to /tmp for Vercel/serverless environments
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

export function getAllSubmissions(): SubmissionRecord[] {
  const file = getDbFilePath();
  try {
    let items: SubmissionRecord[] = [];
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      items = JSON.parse(raw);
    } else if (memoryCache.length > 0) {
      items = memoryCache;
    }

    const now = Date.now();
    // Filter out items older than 30 days
    const validItems = items.filter(
      (item) => now - (item.createdAt || item.submittedAt) < ONE_MONTH_MS
    );

    memoryCache = validItems;
    return validItems.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (err) {
    console.error('Error reading submissions DB:', err);
    return memoryCache;
  }
}

export function saveSubmission(record: SubmissionRecord): void {
  const file = getDbFilePath();
  try {
    const existing = getAllSubmissions();
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
    } catch (writeErr) {
      // If primary file failed, try tmp
      if (file !== TMP_FILE) {
        fs.writeFileSync(TMP_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.error('Error saving submission:', err);
  }
}

export function deleteSubmission(id: string): boolean {
  const file = getDbFilePath();
  try {
    const existing = getAllSubmissions();
    const filtered = existing.filter((item) => item.id !== id);
    memoryCache = filtered;
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error deleting submission:', err);
    return false;
  }
}

export function resetAllSubmissions(): boolean {
  const file = getDbFilePath();
  try {
    memoryCache = [];
    fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}
