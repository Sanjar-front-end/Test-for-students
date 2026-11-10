import { DeviceRegistration, StudentSession } from './types';

const DEVICE_LOCK_KEY = 'bio_quiz_device_lock_v1';
const SESSION_KEY = 'bio_quiz_session_v1';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Check if the device is already locked to a specific student.
 * If expired (> 30 days), it is automatically cleared.
 */
export function getDeviceLock(): DeviceRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEVICE_LOCK_KEY);
    if (!raw) return null;
    const lock: DeviceRegistration = JSON.parse(raw);
    const now = Date.now();
    if (lock.expiresAt && now > lock.expiresAt) {
      localStorage.removeItem(DEVICE_LOCK_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return lock;
  } catch {
    return null;
  }
}

/**
 * Register device to a student for 1 month
 */
export function setDeviceLock(firstName: string, lastName: string): DeviceRegistration {
  const now = Date.now();
  const lock: DeviceRegistration = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    registeredAt: now,
    expiresAt: now + ONE_MONTH_MS,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_LOCK_KEY, JSON.stringify(lock));
  }
  return lock;
}

/**
 * Clear device lock (for admin use)
 */
export function clearDeviceLock(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_LOCK_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Get active student session from localStorage
 */
export function getStudentSession(): StudentSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StudentSession = JSON.parse(raw);
    const now = Date.now();
    // Check 1 month expiration
    if (session.createdAt && now - session.createdAt > ONE_MONTH_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Save or update student session
 */
export function saveStudentSession(session: StudentSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error saving session to localStorage:', err);
  }
}

/**
 * Calculate remaining seconds based on wall-clock startTime
 */
export function getRemainingSeconds(startTime: number, totalDuration: number = 600): number {
  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  const remaining = totalDuration - elapsed;
  return Math.max(0, remaining);
}
