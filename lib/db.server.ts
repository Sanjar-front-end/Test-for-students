import fs from 'fs';
import path from 'path';
import { SubmissionRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'submissions.json');
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllSubmissions(): SubmissionRecord[] {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const items: SubmissionRecord[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out items older than 30 days
    const validItems = items.filter(
      (item) => now - (item.createdAt || item.submittedAt) < ONE_MONTH_MS
    );
    if (validItems.length !== items.length) {
      fs.writeFileSync(DB_FILE, JSON.stringify(validItems, null, 2), 'utf-8');
    }
    return validItems.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (err) {
    console.error('Error reading submissions DB:', err);
    return [];
  }
}

export function saveSubmission(record: SubmissionRecord): void {
  ensureDbFile();
  try {
    const existing = getAllSubmissions();
    // Check if student already has a submission (update or add)
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

    fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving submission:', err);
  }
}

export function deleteSubmission(id: string): boolean {
  ensureDbFile();
  try {
    const existing = getAllSubmissions();
    const filtered = existing.filter((item) => item.id !== id);
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error deleting submission:', err);
    return false;
  }
}

export function resetAllSubmissions(): boolean {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}
